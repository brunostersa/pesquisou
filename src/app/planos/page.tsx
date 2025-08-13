'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';
import PaymentButton from '@/components/PaymentButton';
import { useActiveTab } from '@/hooks/useActiveTab';
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handlePlanSelect = (planId: string) => {
    // Implementar lógica de seleção de plano
    console.log('Plano selecionado:', planId);
    // Aqui você pode integrar com um sistema de pagamento como Stripe
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      period: billingPeriod,
      description: 'Perfeito para começar e testar o sistema',
      features: [
        'Até 2 áreas de opiniões',
        'Máximo 50 feedbacks/mês',
        'QR Codes básicos',
        'Meu Painel simples',
        'Suporte por email',
        'Base de conhecimento básica'
      ],
      buttonText: 'Começar Grátis',
      buttonVariant: 'outline'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: billingPeriod === 'monthly' ? 29 : 290,
      period: billingPeriod,
      description: 'Ideal para pequenos negócios',
      features: [
        'Até 5 áreas de opiniões',
        'Máximo 200 feedbacks/mês',
        'QR Codes personalizados',
        'Meu Painel completo',
        'Gráficos de evolução',
        'Agente IA básico',
        'Suporte prioritário',
        'Base de conhecimento completa'
      ],
      popular: true,
      buttonText: 'Escolher Starter',
      buttonVariant: 'primary'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 79 : 790,
      period: billingPeriod,
      description: 'Para empresas em crescimento',
      features: [
        'Áreas ilimitadas',
        'Opiniões ilimitadas',
        'QR Codes premium',
        'Meu Painel avançado',
        'Agente IA completo',
        'Análises detalhadas',
        'Exportação de dados',
        'Suporte 24/7',
        'Treinamento personalizado'
      ],
      buttonText: 'Escolher Professional',
      buttonVariant: 'secondary'
    },

  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'overview') router.push('/dashboard');
          else if (tab === 'areas') router.push('/areas');
          else if (tab === 'feedbacks') router.push('/feedbacks');
          else if (tab === 'agente-ia') router.push('/agente-ia');
          else if (tab === 'base-conhecimento') router.push('/base-conhecimento');
          else if (tab === 'pricing') router.push('/planos');
          else if (tab === 'assinatura') router.push('/assinatura');
        }}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <div className="lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">💎 Escolha o Plano Ideal</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Comece grátis e evolua conforme seu negócio cresce
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Mensal
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Anual
                <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  -17%
                </span>
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Plano Gratuito */}
            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  R$ 0
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Perfeito para começar e testar</p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Até 2 áreas de opiniões</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Máximo 50 feedbacks/mês</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">QR Codes básicos</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Meu Painel simples</span>
                </li>
              </ul>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Starter */}
            <PaymentButton
              plan="starter"
              price="R$ 29"
              features={[
                'Até 5 áreas de opiniões',
                'Máximo 200 feedbacks/mês',
                'QR Codes personalizados',
                'Meu Painel completo',
                'Gráficos de evolução',
                'Agente IA básico',
                'Suporte prioritário',
                'Base de conhecimento completa'
              ]}
            />

            {/* Plano Professional */}
            <PaymentButton
              plan="professional"
              price="R$ 79"
              features={[
                'Áreas ilimitadas',
                'Opiniões ilimitadas',
                'QR Codes premium',
                'Meu Painel avançado',
                'Agente IA completo',
                'Suporte 24/7',
                'Relatórios personalizados',
                'Integração com APIs'
              ]}
              popular={true}
            />
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-primary text-center mb-8">Perguntas Frequentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Posso mudar de plano a qualquer momento?</h4>
                  <p className="text-secondary text-sm">Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Há limite de usuários?</h4>
                  <p className="text-secondary text-sm">O plano gratuito permite 1 usuário. Os planos pagos incluem múltiplos usuários.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Os dados são seguros?</h4>
                  <p className="text-secondary text-sm">Sim! Utilizamos criptografia de ponta a ponta e backups automáticos.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Oferecem reembolso?</h4>
                  <p className="text-secondary text-sm">Oferecemos 30 dias de garantia. Se não gostar, devolvemos seu dinheiro.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 