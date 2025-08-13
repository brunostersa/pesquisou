'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Notification from '@/components/Notification';
import { applyPhoneMask, removePhoneMask } from '@/lib/masks';
import Sidebar from '@/components/Sidebar';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTheme } from '@/components/ThemeProvider';

interface UserProfile {
  uid?: string;
  name?: string;
  email?: string;
  company?: string;
  segment?: string;
  phone?: string;
  logoUrl?: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    segment: '',
    phone: '',
    logoUrl: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const { isAdminMode, toggleAdminMode } = useAdminMode();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        setFormData({
          name: data.name || '',
          company: data.company || '',
          segment: data.segment || '',
          phone: data.phone ? applyPhoneMask(data.phone) : '',
          logoUrl: data.logoUrl || ''
        });
        setLogoPreview(data.logoUrl || '');
      } else {
        // Criar documento se não existir
        await setDoc(doc(db, 'users', userId), {
          uid: userId,
          email: user?.email || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setUserProfile({ uid: userId, email: user?.email || '', createdAt: new Date(), updatedAt: new Date() });
        setFormData({
          name: '',
          company: '',
          segment: '',
          phone: '',
          logoUrl: ''
        });
        setLogoPreview('');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      showNotification('Erro ao carregar perfil', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) return;

      const updateData = {
        ...formData,
        phone: removePhoneMask(formData.phone),
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Atualizar estado local
      setUserProfile(prev => prev ? { ...prev, ...updateData } : null);
      
      showNotification('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showNotification('Erro ao atualizar perfil', 'error');
    } finally {
      setSaving(false);
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
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('Arquivo muito grande. Máximo 5MB.', 'error');
        return;
      }
      
      setLogoFile(file);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    
    // Salvar no Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          theme: newTheme,
          updatedAt: new Date()
        });
        
        showNotification(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} salvo com sucesso!`, 'success');
      } catch (error) {
        console.error('Erro ao salvar tema:', error);
        showNotification('Erro ao salvar preferência de tema', 'error');
      }
    }
  };

  const handleToggleAdminMode = () => {
    toggleAdminMode();
    
    // Feedback visual
    const newMode = !isAdminMode;
    showNotification(
      newMode 
        ? 'Modo Admin ativado - Menus completos com funcionalidades administrativas' 
        : 'Modo usuário ativado - Menus simplificados para usuários comuns', 
      'success'
    );
    
    // Forçar re-render do Sidebar
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'profile') {
            router.push('/dashboard');
          }
        }}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Dashboard
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">Meu Perfil</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Gerencie suas informações pessoais e preferências</p>
          </div>

          {/* Profile Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informações do Perfil</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize seus dados pessoais e empresariais</p>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {(userProfile?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Empresa
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Nome da sua empresa"
                      />
                    </div>

                    <div>
                      <label htmlFor="segment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Segmento
                      </label>
                      <select
                        id="segment"
                        name="segment"
                        value={formData.segment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const maskedValue = applyPhoneMask(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            phone: maskedValue
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção do Logo da Empresa */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo da Empresa</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {logoPreview && (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG até 5MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferências */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferências</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tema da Interface
                      </label>
                      <div className="flex items-center space-x-4">
                        {/* Toggle de Tema Estilo Google */}
                        <div className="flex items-center space-x-3">
                          {/* Ícone Sol */}
                          <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-yellow-500' : 'text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Claro</span>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => {
                              const newTheme = theme === 'light' ? 'dark' : 'light';
                              handleThemeChange(newTheme);
                            }}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}
                            `}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md
                                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>

                          {/* Ícone Lua */}
                          <div className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                            <span className="text-sm font-medium">Escuro</span>
                          </div>
                        </div>

                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique no toggle para alternar entre modo claro e escuro
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Sua preferência será salva automaticamente no seu perfil
                      </p>
                    </div>

                    {/* Toggle de Modo Admin */}
                    {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Modo de Visualização
                        </label>
                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            onClick={handleToggleAdminMode}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              ${isAdminMode 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300'
                              }
                            `}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${isAdminMode ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {isAdminMode ? 'Modo Admin' : 'Modo Usuário'}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {isAdminMode 
                                ? (userProfile?.role === 'super_admin' 
                                    ? 'Apenas funcionalidades administrativas (Escritório + Usuários Admin)' 
                                    : 'Menus completos com funcionalidades administrativas'
                                  )
                                : 'Menus simplificados para usuários comuns'
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Alterna entre visualização de admin e usuário normal no sistema
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações</h3>
                  
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 