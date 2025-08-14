'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Card, { CardHeader, CardContent } from '@/components/Card';
import { useActiveTab } from '@/hooks/useActiveTab';
interface SubscriptionData {
  plan: 'free' | 'starter' | 'professional';
  subscriptionStatus?: string;
  planUpdatedAt?: Date;
}

export default function SubscriptionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
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
        setSubscriptionData({
          plan: data.plan || 'free',
          subscriptionStatus: data.subscriptionStatus,
          planUpdatedAt: data.planUpdatedAt?.toDate(),
        });
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

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { name: 'Gratuito', price: 0, features: ['2 áreas', '50 feedbacks/mês'] };
      case 'starter':
        return { name: 'Starter', price: 29, features: ['5 áreas', '200 feedbacks/mês'] };
      case 'professional':
        return { name: 'Professional', price: 79, features: ['Ilimitado', 'Suporte 24/7'] };
      default:
        return { name: 'Gratuito', price: 0, features: [] };
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

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

  const currentPlan = getPlanInfo(subscriptionData?.plan || 'free');

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">💳 Minha Assinatura</h1>
            <p className="text-gray-700 dark:text-gray-300">Visualize seu plano atual e informações da assinatura</p>
          </div>

          {/* Current Plan */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Plano Atual</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentPlan.price > 0 ? `R$ ${currentPlan.price},00/mês` : 'Gratuito'}
                  </p>
                  <div className="mt-2">
                    {currentPlan.features.map((feature, index) => (
                      <span key={index} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded mr-2 mb-1">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subscriptionData?.subscriptionStatus === 'active' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {subscriptionData?.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informações da Assinatura</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plano ativo desde</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(subscriptionData?.planUpdatedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de plano</p>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">{subscriptionData?.plan || 'free'}</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Upgrade CTA Section */}
          {currentPlan !== 'professional' && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🚀 Desbloqueie Mais Recursos</h2>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                  <div className="text-center mb-6">
                                         <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                       {currentPlan === 'free' 
                         ? 'Transforme seu negócio com o Plano Starter' 
                         : 'Leve seu negócio ao próximo nível com o Plano Professional'
                       }
                     </h3>
                     <p className="text-gray-600 dark:text-gray-400 text-lg">
                       {currentPlan === 'free' 
                         ? 'Aproveite recursos avançados que vão revolucionar sua experiência com feedbacks'
                         : 'Tenha acesso ilimitado a todas as funcionalidades e suporte premium'
                       }
                     </p>
                  </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     {currentPlan === 'free' ? (
                      <>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">✅ O que você ganha:</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• 5 áreas de opiniões (vs. 2 atuais)</li>
                            <li>• 200 feedbacks/mês (vs. 50 atuais)</li>
                            <li>• QR Codes personalizados</li>
                            <li>• Agente IA básico</li>
                            <li>• Suporte prioritário</li>
                          </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">💡 Benefícios:</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Crescimento 3x mais rápido</li>
                            <li>• Insights valiosos sobre clientes</li>
                            <li>• Melhor tomada de decisão</li>
                            <li>• ROI comprovado</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">✅ O que você ganha:</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Áreas ilimitadas</li>
                            <li>• Feedback ilimitado</li>
                            <li>• Agente IA completo</li>
                            <li>• Suporte 24/7</li>
                            <li>• Integração com APIs</li>
                          </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">💡 Benefícios:</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Escalabilidade total</li>
                            <li>• Automação avançada</li>
                            <li>• Relatórios personalizados</li>
                            <li>• Treinamento dedicado</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-center">
                                         <button
                       onClick={() => router.push('/planos')}
                       className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                     >
                       {currentPlan === 'free' 
                         ? 'Fazer Upgrade para Starter - R$ 29/mês' 
                         : 'Fazer Upgrade para Professional - R$ 79/mês'
                       }
                     </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Teste gratuito de 30 dias • Sem compromisso • Cancele a qualquer momento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Analytics & Upgrade Motivation */}
          {currentPlan === 'free' && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📊 Seu Uso Atual</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Áreas de opiniões</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">2/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Feedbacks este mês</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">30/50</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Dica:</strong> Você está usando 60% da sua cota de feedbacks. Faça upgrade para não perder insights valiosos!
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Proof for Upgrade */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">💬 O que nossos clientes dizem</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      M
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Maria Silva</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Restaurante Sabor & Arte</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "O upgrade para Professional transformou nosso atendimento. Agora temos insights valiosos sobre nossos clientes."
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      J
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">João Santos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Farmácia Popular</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Com o plano Starter, conseguimos expandir para 5 áreas e melhorar significativamente nosso serviço."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info - Simplified */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Precisa cancelar sua assinatura?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                Envie um email para{' '}
                <a href="mailto:suporte@pesquisou.com.br" className="text-blue-600 dark:text-blue-400 hover:underline">
                  suporte@pesquisou.com.br
                </a>{' '}
                com o assunto &quot;Cancelamento de Assinatura&quot;
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Inclua seu nome, email da conta e data desejada para o cancelamento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}