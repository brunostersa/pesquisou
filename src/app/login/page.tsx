'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { applyPhoneMask, removePhoneMask } from '@/lib/masks';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Campos adicionais para cadastro
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [segment, setSegment] = useState('');
  const [phone, setPhone] = useState('');

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Criar usuário
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Atualizar perfil com nome
        if (name.trim()) {
          await updateProfile(user, {
            displayName: name.trim()
          });
        }

        // Salvar dados adicionais no Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          email: email,
          company: company.trim(),
          segment: segment,
          phone: removePhoneMask(phone.trim()),
          createdAt: new Date(),
          updatedAt: new Date()
        });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    // Limpar campos adicionais ao trocar para login
    if (!isSignUp) {
      setName('');
      setCompany('');
      setSegment('');
      setPhone('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Switcher no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-secondary-color rounded-xl flex items-center justify-center mb-4">
            <span className="text-inverse font-bold text-2xl">P</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-white/90">
            {isSignUp 
              ? 'Comece a coletar feedbacks dos seus clientes' 
              : 'Entre na sua conta para continuar'
            }
          </p>
        </div>
        
        {/* Form */}
        <div className="bg-card rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa *
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required={isSignUp}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                    placeholder="Nome da sua empresa"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="segment" className="block text-sm font-medium text-gray-700 mb-2">
                    Segmento *
                  </label>
                  <select
                    id="segment"
                    name="segment"
                    required={isSignUp}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                  >
                    <option value="">Selecione um segmento</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="varejo">Varejo</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação</option>
                    <option value="servicos">Serviços</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="automotivo">Automotivo</option>
                    <option value="beleza">Beleza</option>
                    <option value="fitness">Fitness</option>
                    <option value="hotelaria">Hotelaria</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Celular
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => {
                      const maskedValue = applyPhoneMask(e.target.value);
                      setPhone(maskedValue);
                    }}
                    maxLength={15}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </div>
              ) : (
                isSignUp ? 'Criar conta' : 'Entrar'
              )}
            </button>
          </form>

          {/* Toggle Sign Up/Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                onClick={handleToggleMode}
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isSignUp ? 'Faça login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="text-center">
          <div className="grid grid-cols-1 gap-4 text-sm text-inverse">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>QR Codes automáticos</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Feedbacks anônimos</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Tempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
