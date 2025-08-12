'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
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

  // Função para limpar erro quando o usuário digita
  const clearError = () => {
    if (error) setError('');
  };

  // Função para traduzir códigos de erro do Firebase para português
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      // Erros de autenticação
      case 'auth/invalid-credential':
        return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado. Verifique se o email está correto ou crie uma nova conta.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Verifique se digitou corretamente.';
      case 'auth/invalid-email':
        return 'Email inválido. Verifique o formato do email.';
      case 'auth/weak-password':
        return 'Senha muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/email-already-in-use':
        return 'Este email já está sendo usado. Tente fazer login ou use outro email.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
      case 'auth/user-disabled':
        return 'Conta desabilitada. Entre em contato com o suporte.';
      case 'auth/operation-not-allowed':
        return 'Operação não permitida. Entre em contato com o suporte.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      
      // Erros do Google Sign-In
      case 'auth/popup-closed-by-user':
        return 'Login com Google cancelado. Tente novamente.';
      case 'auth/popup-blocked':
        return 'Popup bloqueado pelo navegador. Permita popups para este site.';
      case 'auth/cancelled-popup-request':
        return 'Solicitação de login cancelada. Tente novamente.';
      
      // Erros gerais
      default:
        if (errorCode.includes('auth/')) {
          return 'Erro de autenticação. Tente novamente ou entre em contato com o suporte.';
        }
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Usuário novo - criar perfil no Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'Usuário Google',
          email: user.email,
          company: '',
          segment: '',
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          authProvider: 'google',
          photoURL: user.photoURL
        });
      }

      router.push('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error instanceof Error) {
        // Extrair o código de erro do Firebase
        const errorCode = (error as any).code || error.message;
        errorMessage = getErrorMessage(errorCode);
        console.error('Erro de Google Sign-In:', errorCode, error);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          updatedAt: new Date(),
          authProvider: 'email'
        });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        // Extrair o código de erro do Firebase
        const errorCode = (error as any).code || error.message;
        errorMessage = getErrorMessage(errorCode);
        console.error('Erro de login:', errorCode, error);
      }
      
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Switcher no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Criar conta' : 'Entrar na sua conta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Comece a coletar feedbacks hoje mesmo' : 'Acesse seu painel de controle'}
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Entrando...' : 'Continuar com Google'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">ou</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={clearError}
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Nome da sua empresa"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onFocus={clearError}
                />
              </div>

              <div>
                <label htmlFor="segment" className="block text-sm font-medium text-gray-700 mb-2">
                  Segmento
                </label>
                <select
                  id="segment"
                  name="segment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  onFocus={clearError}
                >
                  <option value="">Selecione um segmento</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
                  onFocus={clearError}
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
              onFocus={clearError}
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
              onFocus={clearError}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
              <button
                onClick={() => setError('')}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                aria-label="Fechar mensagem de erro"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-3 pr-6">
                  <p className="text-sm text-red-700 font-medium mb-1">Erro de autenticação</p>
                  <p className="text-sm text-red-600">{error}</p>
                  
                  {/* Dicas específicas baseadas no tipo de erro */}
                  {error.includes('incorretos') && (
                    <div className="mt-2 text-xs text-red-500">
                      💡 <strong>Dica:</strong> Verifique se o CAPS LOCK está desativado e se digitou corretamente.
                    </div>
                  )}
                  {error.includes('não encontrado') && (
                    <div className="mt-2 text-xs text-red-500">
                      💡 <strong>Sugestão:</strong> Crie uma nova conta ou verifique se o email está correto.
                    </div>
                  )}
                  {error.includes('já está sendo usado') && (
                    <div className="mt-2 text-xs text-red-500">
                      💡 <strong>Sugestão:</strong> Faça login com esta conta ou use outro email.
                    </div>
                  )}
                  {error.includes('muito fraca') && (
                    <div className="mt-2 text-xs text-red-500">
                      💡 <strong>Dica:</strong> Use pelo menos 6 caracteres, incluindo letras e números.
                    </div>
                  )}
                  {error.includes('muitas tentativas') && (
                    <div className="mt-2 text-xs text-red-500">
                      💡 <strong>Dica:</strong> Aguarde alguns minutos antes de tentar novamente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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

        {/* Features */}
        <div className="text-center">
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>QR Codes automáticos</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
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
