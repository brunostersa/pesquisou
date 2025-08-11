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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'overview') router.push('/dashboard');
          else if (tab === 'areas') router.push('/areas');
          else if (tab === 'feedbacks') router.push('/feedbacks');
          else if (tab === 'planos') router.push('/planos');
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

          {/* Debug Tools */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🔧 Ferramentas de Debug</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Status da Assinatura: {subscriptionData?.subscriptionStatus === 'active' ? '✅ Ativo' : '❌ Inativo'}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Se o status estiver incorreto, use os botões abaixo para corrigir.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const response = await fetch('/api/verificar-assinatura-usuario', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.uid })
                          });
                          const data = await response.json();
                          if (data.success) {
                            alert(`Dados do usuário:\n${JSON.stringify(data.userData, null, 2)}\n\nAnálise:\n${JSON.stringify(data.analysis, null, 2)}`);
                          }
                        } catch (error) {
                          console.error('Erro ao verificar dados:', error);
                          alert('Erro ao verificar dados');
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      🔍 Verificar Dados do Usuário
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const response = await fetch('/api/corrigir-dados-assinatura', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.uid })
                          });
                          const data = await response.json();
                          if (data.success) {
                            alert(`✅ ${data.message}`);
                            // Recarregar dados
                            await loadUserProfile(user.uid);
                          }
                        } catch (error) {
                          console.error('Erro ao corrigir dados:', error);
                          alert('Erro ao corrigir dados');
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      🔄 Corrigir Dados da Assinatura
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Cancelar Assinatura</h2>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Como cancelar sua assinatura
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Para cancelar sua assinatura, envie um email para{' '}
                        <a href="mailto:suporte@pesquisou.com.br" className="font-medium underline">
                          suporte@pesquisou.com.br
                        </a>{' '}
                        com o assunto &quot;Cancelamento de Assinatura&quot; e inclua:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Seu nome completo</li>
                        <li>Email da conta</li>
                        <li>Motivo do cancelamento (opcional)</li>
                        <li>Data desejada para o cancelamento</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Importante:</strong> O cancelamento será processado até o final do período atual de cobrança.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}