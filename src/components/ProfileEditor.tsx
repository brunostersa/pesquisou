'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface ProfileEditorProps {
  userProfile: {
    name?: string;
    email?: string;
    company?: string;
    segment?: string;
    phone?: string;
    logoUrl?: string;
  } | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditor({ userProfile, onClose, onUpdate }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    segment: '',
    phone: '',
    logoUrl: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        company: userProfile.company || '',
        segment: userProfile.segment || '',
        phone: userProfile.phone || '',
        logoUrl: userProfile.logoUrl || ''
      });
      setLogoPreview(userProfile.logoUrl || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validar dados
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      // Upload do logo se houver arquivo selecionado
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        try {
          // Aqui você pode implementar o upload para Firebase Storage
          // Por enquanto, vamos usar o preview como URL
          logoUrl = logoPreview;
        } catch (uploadError) {
          console.error('Erro no upload do logo:', uploadError);
          throw new Error('Erro ao fazer upload do logo. Tente novamente.');
        }
      }

      // Preparar dados para atualização
      const updateData = {
        name: formData.name.trim(),
        company: formData.company.trim() || null,
        segment: formData.segment || null,
        phone: formData.phone.trim() || null,
        logoUrl: logoUrl || null,
        updatedAt: new Date()
      };

      // Atualizar perfil no Firebase Auth
      await updateProfile(user, {
        displayName: formData.name.trim()
      });

      // Verificar se o documento do usuário existe
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Documento existe, atualizar
        await updateDoc(userRef, updateData);
      } else {
        // Documento não existe, criar
        await setDoc(userRef, {
          ...updateData,
          email: user.email,
          createdAt: new Date()
        });
      }

      setSuccess(true);
      
      // Chamar onUpdate para atualizar o estado no componente pai
      if (onUpdate) {
        onUpdate();
      }
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 5MB.');
        return;
      }

      setLogoFile(file);
      setError('');

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      logoUrl: ''
    }));
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Editar Perfil</h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">Perfil atualizado com sucesso!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                Nome *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-color focus:border-transparent bg-card text-primary"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-custom rounded-md bg-tertiary text-secondary cursor-not-allowed"
                placeholder="Seu e-mail"
              />
              <p className="text-xs text-secondary mt-1">
                O e-mail não pode ser alterado por questões de segurança
              </p>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-primary mb-1">
                Empresa
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-color focus:border-transparent bg-card text-primary"
                placeholder="Nome da sua empresa"
              />
            </div>

            <div>
              <label htmlFor="segment" className="block text-sm font-medium text-primary mb-1">
                Segmento
              </label>
              <select
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-color focus:border-transparent bg-card text-primary"
              >
                <option value="">Selecione um segmento</option>
                <option value="Varejo">Varejo</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Serviços">Serviços</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-primary mb-1">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-color focus:border-transparent bg-card text-primary"
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Seção do Logo da Empresa */}
            <div className="border-t border-custom pt-4">
              <h3 className="text-lg font-semibold text-primary mb-4">Logo da Empresa</h3>
              
              <div className="space-y-4">
                {/* Preview do Logo */}
                {logoPreview && (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg border border-custom overflow-hidden bg-white flex items-center justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo da empresa" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-secondary">Logo atual</p>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="text-xs text-red-600 hover:text-red-800 mt-1"
                      >
                        Remover logo
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload do Logo */}
                <div>
                  <label htmlFor="logo" className="block text-sm font-medium text-primary mb-2">
                    {logoPreview ? 'Alterar Logo' : 'Adicionar Logo'}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo"
                      className="flex items-center space-x-2 px-4 py-2 border border-custom rounded-md text-primary hover:bg-tertiary transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Escolher arquivo</span>
                    </label>
                    <span className="text-xs text-secondary">
                      PNG, JPG até 5MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Preferências */}
            <div className="border-t border-custom pt-4">
              <h3 className="text-lg font-semibold text-primary mb-4">Preferências</h3>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tema da Interface
                </label>
                <div className="flex items-center space-x-4">
                  <ThemeSwitcher />
                  <span className="text-sm text-secondary">
                    Clique no botão para alternar entre modo claro e escuro
                  </span>
                </div>
                <p className="text-xs text-secondary mt-2">
                  Sua preferência será salva automaticamente no seu perfil
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-custom rounded-md text-primary hover:bg-tertiary transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-secondary-color text-inverse rounded-md hover:bg-secondary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 