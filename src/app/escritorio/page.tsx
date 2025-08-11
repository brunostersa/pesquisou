'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useActiveTab } from '@/hooks/useActiveTab';
interface BackofficeStats {
  totalUsers: number;
  activeUsers: number;
  totalAreas: number;
  totalFeedbacks: number;
  totalRevenue: number;
  monthlyGrowth: number;
  avgFeedbacksPerUser: number;
  topPerformingAreas: Array<{
    name: string;
    feedbacks: number;
    user: string;
  }>;
  recentUsers: Array<{
    uid: string;
    email: string;
    company: string;
    createdAt: Date;
    areasCount: number;
  }>;
  systemUsage: {
    storageUsed: number;
    bandwidthUsed: number;
    uptime: number;
  };
}

export default function BackofficePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<BackofficeStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAreas: 0,
    totalFeedbacks: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    avgFeedbacksPerUser: 0,
    topPerformingAreas: [],
    recentUsers: [],
    systemUsage: {
      storageUsed: 0,
      bandwidthUsed: 0,
      uptime: 99.9
    }
  });

  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserProfile(user.uid);
        loadBackofficeStats();
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

  const loadBackofficeStats = async () => {
    try {
      // Carregar todos os usuários
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any[];
      
      // Carregar todas as áreas
      const areasSnapshot = await getDocs(collection(db, 'areas'));
      const areas = areasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Carregar todos os feedbacks
      const feedbacksSnapshot = await getDocs(collection(db, 'feedbacks'));
      const feedbacks = feedbacksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Calcular estatísticas
      const totalUsers = users.length;
      const activeUsers = users.length; // Simplificado - todos os usuários são considerados ativos
      const totalAreas = areas.length;
      const totalFeedbacks = feedbacks.length;
      
      // Calcular receita (simulação baseada em planos)
      const totalRevenue = users.reduce((sum, user) => {
        if (user.plan === 'starter') return sum + 29;
        if (user.plan === 'professional') return sum + 79;
        return sum;
      }, 0);

      // Calcular crescimento mensal
      const thisMonthUsers = users.filter(u => u.createdAt && new Date(u.createdAt.toDate()).getMonth() === new Date().getMonth()).length;
      const lastMonthUsers = users.filter(u => u.createdAt && new Date(u.createdAt.toDate()).getMonth() === new Date().getMonth() - 1).length;
      const monthlyGrowth = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      // Calcular média de feedbacks por usuário
      const avgFeedbacksPerUser = totalUsers > 0 ? totalFeedbacks / totalUsers : 0;

      // Top áreas com mais feedbacks
      const areaStats = areas.map(area => {
        const areaFeedbacks = feedbacks.filter(f => f.areaId === area.id).length;
        return {
          name: area.name,
          feedbacks: areaFeedbacks,
          user: users.find(u => u.uid === area.userId)?.email || 'N/A'
        };
      }).sort((a, b) => b.feedbacks - a.feedbacks).slice(0, 5);

      // Usuários recentes
      const recentUsers = users
        .filter(u => u.createdAt)
        .sort((a, b) => new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime())
        .slice(0, 10)
        .map(user => ({
          uid: user.uid,
          email: user.email,
          company: user.company || 'N/A',
          createdAt: user.createdAt.toDate(),
          areasCount: areas.filter(a => a.userId === user.uid).length
        }));

      setStats({
        totalUsers,
        activeUsers,
        totalAreas,
        totalFeedbacks,
        totalRevenue,
        monthlyGrowth,
        avgFeedbacksPerUser,
        topPerformingAreas: areaStats,
        recentUsers,
        systemUsage: {
          storageUsed: Math.round((totalUsers * 0.5 + totalAreas * 0.1 + totalFeedbacks * 0.05) * 100) / 100,
          bandwidthUsed: Math.round((totalFeedbacks * 0.1) * 100) / 100,
          uptime: 99.9
        }
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Carregando backoffice...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar 
          user={user} 
          userProfile={userProfile} 
          onLogout={handleLogout}
          onTabChange={(tab) => router.push(`/${tab}`)}
          activeTab={activeTab}
        />
        
        <div className="lg:ml-80 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Backoffice</h1>
              <p className="text-gray-600 dark:text-gray-400">Controle administrativo e métricas do sistema</p>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total de Usuários</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">+{stats.activeUsers} ativos</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Áreas Criadas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAreas}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Média: {stats.totalUsers > 0 ? (stats.totalAreas / stats.totalUsers).toFixed(1) : 0}/usuário</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Feedbacks Recebidos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFeedbacks}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Média: {stats.avgFeedbacksPerUser.toFixed(1)}/usuário</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receita Mensal</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% vs mês anterior</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Utilização do Sistema</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Armazenamento</span>
                        <span>{stats.systemUsage.storageUsed} MB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((stats.systemUsage.storageUsed / 1000) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Bandwidth</span>
                        <span>{stats.systemUsage.bandwidthUsed} GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((stats.systemUsage.bandwidthUsed / 100) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uptime</span>
                        <span>{stats.systemUsage.uptime}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.systemUsage.uptime}%` }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Top Áreas</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topPerformingAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{area.name}</p>
                            <p className="text-xs text-gray-500">{area.user}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{area.feedbacks}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Distribuição de Planos</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Gratuito</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round((stats.totalUsers * 0.6))} usuários
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Starter</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round((stats.totalUsers * 0.3))} usuários
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Professional</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round((stats.totalUsers * 0.1))} usuários
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usuários Recentes */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Usuários Recentes</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Áreas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentUsers.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.company}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.areasCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt.toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 