'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';

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
  upgradeFrom?: string;
}

export default function UpgradePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');

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
        const data = userSnap.data();
        setUserProfile(data);
        setCurrentPlan(data.plan || 'free');
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

  const getCurrentPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { 
          name: 'Gratuito', 
          price: 0, 
          features: ['2 áreas', '50 feedbacks/mês'],
          limitations: ['QR Codes básicos', 'Painel simples', 'Suporte por email']
        };
      case 'starter':
        return { 
          name: 'Starter', 
          price: 29, 
          features: ['5 áreas', '200 feedbacks/mês'],
          limitations: ['Sem IA avançada', 'Sem exportação', 'Suporte limitado']
        };
      case 'professional':
        return { 
          name: 'Professional', 
          price: 79, 
          features: ['Ilimitado', 'Suporte 24/7'],
          limitations: []
        };
      default:
        return { 
          name: 'Gratuito', 
          price: 0, 
          features: ['2 áreas', '50 feedbacks/mês'],
          limitations: ['QR Codes básicos', 'Painel simples', 'Suporte por email']
        };
    }
  };

  const getUpgradeMessage = (currentPlan: string) => {
    switch (currentPlan) {
      case 'free':
        return {
          title: '🚀 Desbloqueie todo o potencial do Pesquisou',
          subtitle: 'Você está usando apenas 20% das funcionalidades disponíveis',
          cta: 'Faça upgrade agora e transforme seu negócio'
        };
      case 'starter':
        return {
          title: '⚡ Leve seu negócio ao próximo nível',
          subtitle: 'Aproveite recursos avançados para crescer ainda mais',
          cta: 'Upgrade para Professional e tenha tudo ilimitado'
        };
      case 'professional':
        return {
          title: '🎯 Você já tem o melhor plano!',
          subtitle: 'Aproveite ao máximo todas as funcionalidades',
          cta: 'Conheça nossos serviços adicionais'
        };
      default:
        return {
          title: '🚀 Desbloqueie todo o potencial do Pesquisou',
          subtitle: 'Você está usando apenas 20% das funcionalidades disponíveis',
          cta: 'Faça upgrade agora e transforme seu negócio'
        };
    }
  };

  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingPeriod === 'monthly' ? 29 : 290,
      period: billingPeriod,
      description: 'Ideal para pequenos negócios em crescimento',
      features: [
        '✅ Até 5 áreas de opiniões',
        '✅ Máximo 200 feedbacks/mês',
        '✅ QR Codes personalizados',
        '✅ Meu Painel completo',
        '✅ Gráficos de evolução',
        '✅ Agente IA básico',
        '✅ Suporte prioritário',
        '✅ Base de conhecimento completa'
      ],
      popular: currentPlan === 'free',
      buttonText: currentPlan === 'free' ? 'Fazer Upgrade para Starter' : 'Mudar para Starter',
      buttonVariant: 'primary',
      upgradeFrom: 'free'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 79 : 790,
      period: billingPeriod,
      description: 'Para empresas que querem dominar o mercado',
      features: [
        '🚀 Áreas ilimitadas',
        '🚀 Opiniões ilimitadas',
        '🚀 QR Codes premium',
        '🚀 Meu Painel avançado',
        '🚀 Agente IA completo',
        '🚀 Análises detalhadas',
        '🚀 Exportação de dados',
        '🚀 Suporte 24/7',
        '🚀 Treinamento personalizado',
        '🚀 Integração com APIs'
      ],
      popular: currentPlan === 'free' || currentPlan === 'starter',
      buttonText: currentPlan === 'professional' ? 'Plano Atual' : 'Fazer Upgrade para Professional',
      buttonVariant: currentPlan === 'professional' ? 'outline' : 'secondary',
      upgradeFrom: currentPlan === 'professional' ? undefined : 'starter'
    }
  ];

  const currentPlanInfo = getCurrentPlanInfo(currentPlan);
  const upgradeMessage = getUpgradeMessage(currentPlan);

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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <span className="mr-2">🎯</span>
              Plano Atual: {currentPlanInfo.name}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {upgradeMessage.title}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
              {upgradeMessage.subtitle}
            </p>
            
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
              {upgradeMessage.cta}
            </p>
          </div>

          {/* Current Plan vs Upgrade Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Current Plan */}
            <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium mb-4">
                  Seu Plano Atual
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentPlanInfo.name}</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentPlanInfo.price > 0 ? `R$ ${currentPlanInfo.price}` : 'R$ 0'}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">✅ O que você tem:</h4>
                {currentPlanInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </div>

              {currentPlanInfo.limitations.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">❌ Limitações:</h4>
                  {currentPlanInfo.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {limitation}
                    </li>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade Plans */}
            {plans.map((plan) => (
              <div key={plan.id} className={`relative p-6 rounded-lg shadow-lg border-2 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    R$ {plan.price}
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                      /{billingPeriod === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      💰 Economia de R$ 58/ano
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <span className="mr-2 mt-0.5">{feature.startsWith('✅') ? '✅' : '🚀'}</span>
                      <span>{feature.replace('✅ ', '').replace('🚀 ', '')}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === currentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    {plan.buttonText}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Implementar lógica de upgrade
                      console.log('Upgrade para:', plan.id);
                      // Aqui você pode integrar com Stripe ou outro sistema de pagamento
                    }}
                    className="w-full py-3 px-6 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {plan.buttonText}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Billing Toggle */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
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
              <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Anual
                <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  -17%
                </span>
              </span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💬 O que nossos clientes dizem
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Junte-se a centenas de empresas que já transformaram seus negócios
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Maria Silva</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Restaurante Sabor & Arte</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  "O upgrade para Professional transformou nosso atendimento. Agora temos insights valiosos sobre nossos clientes."
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    J
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">João Santos</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Farmácia Popular</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  "Com o plano Starter, conseguimos expandir para 5 áreas e melhorar significativamente nosso serviço."
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Ana Costa</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clínica Saúde Total</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  "O Agente IA nos ajuda a analisar feedbacks em tempo real. É como ter um consultor 24/7."
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
              ❓ Perguntas Frequentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Posso mudar de plano a qualquer momento?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Há limite de usuários?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    O plano gratuito permite 1 usuário. Os planos pagos incluem múltiplos usuários e permissões avançadas.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Os dados são seguros?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Sim! Utilizamos criptografia de ponta a ponta, backups automáticos e seguimos todas as normas de segurança.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Oferecem reembolso?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Oferecemos 30 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu dinheiro.
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
} 