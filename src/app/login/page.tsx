'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { applyPhoneMask, removePhoneMask } from '@/lib/masks';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  
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
      if (user && !needsProfileCompletion) {
        // Só redireciona se não estiver no modo de completar perfil
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router, needsProfileCompletion]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        // Usuário existe, verificar se o perfil está completo
        const userData = userDoc.data();
        if (userData.name && userData.company && userData.segment) {
          // Perfil completo, redirecionar para dashboard
          router.push('/dashboard');
        } else {
          // Perfil incompleto, ir para completar perfil
          setNeedsProfileCompletion(true);
          setGoogleUser(user);
        }
      } else {
        // Usuário novo, ir para completar perfil
        setNeedsProfileCompletion(true);
        setGoogleUser(user);
      }
    } catch (error: any) {
      console.error('Erro no Google Sign-In:', error);
      setError(getErrorMessage(error.code));
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
        // Cadastro
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Criar documento do usuário no Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: name,
          company: company,
          segment: segment,
          phone: removePhoneMask(phone),
          createdAt: new Date(),
          role: 'user',
          plan: 'free'
        });

        // Atualizar perfil do Firebase Auth
        await updateProfile(user, {
          displayName: name
        });

        // Redirecionar para dashboard
        router.push('/dashboard');
      } else {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Verificar se o usuário existe no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          // Usuário existe, verificar se o perfil está completo
          const userData = userDoc.data();
          if (userData.name && userData.company && userData.segment) {
            // Perfil completo, redirecionar para dashboard
            router.push('/dashboard');
          } else {
            // Perfil incompleto, ir para completar perfil
            setNeedsProfileCompletion(true);
          }
        } else {
          // Usuário não existe no Firestore, criar documento básico
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            createdAt: new Date(),
            role: 'user',
            plan: 'free'
          });

          // Ir para completar perfil
          setNeedsProfileCompletion(true);
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser || googleUser;
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Atualizar documento do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        company: company,
        segment: segment,
        phone: removePhoneMask(phone),
        createdAt: new Date(),
        role: 'user',
        plan: 'free'
      }, { merge: true });

      // Atualizar perfil do Firebase Auth se não for usuário Google
      if (!googleUser) {
        await updateProfile(user, {
          displayName: name
        });
      }

      // Redirecionar para dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    // Limpar campos ao alternar
    setEmail('');
    setPassword('');
    setName('');
    setCompany('');
    setSegment('');
    setPhone('');
  };

  // Se precisar completar perfil
  if (needsProfileCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Complete seu Perfil
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Precisamos de algumas informações para personalizar sua experiência
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleProfileSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Nome da empresa
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label htmlFor="segment" className="block text-sm font-medium text-gray-700">
                  Segmento de atuação
                </label>
                <select
                  id="segment"
                  name="segment"
                  required
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um segmento</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="automotivo">Automotivo</option>
                  <option value="imobiliario">Imobiliário</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
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
                  Salvando...
                </div>
              ) : (
                'Salvar e Continuar'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Criar conta' : 'Entrar na sua conta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Comece a receber feedbacks dos seus clientes' : 'Acesse seu painel de controle'}
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Ou continue com email</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={clearError}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Nome da empresa
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required={isSignUp}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onFocus={clearError}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome da sua empresa"
                />
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="segment" className="block text-sm font-medium text-gray-700">
                  Segmento de atuação
                </label>
                <select
                  id="segment"
                  name="segment"
                  required={isSignUp}
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  onFocus={clearError}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um segmento</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="automotivo">Automotivo</option>
                  <option value="imobiliario">Imobiliário</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
                  onFocus={clearError}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={clearError}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={clearError}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={isSignUp ? 'Crie uma senha' : 'Sua senha'}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
              {error.includes('senha muito fraca') && (
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
        {!needsProfileCompletion && (
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
        )}
      </div>
    </div>
  );
}
