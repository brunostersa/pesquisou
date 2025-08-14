'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import FeedbackList from '@/components/FeedbackList';
import DeleteAllFeedbacksModal from '@/components/DeleteAllFeedbacksModal';
import Notification from '@/components/Notification';
import Sidebar from '@/components/Sidebar';
import AIAgent from '@/components/AIAgent';
import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import { useActiveTab } from '@/hooks/useActiveTab';

export default function FeedbacksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadAreas(user.uid);
        loadAllFeedbacks(user.uid);
        loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadAreas = (userId: string) => {
    const q = query(collection(db, 'areas'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const areasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Area[];
      setAreas(areasData);
    });

    return unsubscribe;
  };

  const loadAllFeedbacks = (userId: string) => {
    // Carregar apenas os feedbacks das áreas do usuário
    const q = query(collection(db, 'feedbacks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFeedbacks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      
      // Filtrar apenas feedbacks das áreas do usuário
      const userFeedbacks = allFeedbacks.filter(feedback => {
        const area = areas.find(a => a.id === feedback.areaId);
        return area && area.userId === userId;
      });
      
      console.log('Debug - Total feedbacks no banco:', allFeedbacks.length);
      console.log('Debug - Feedbacks do usuário:', userFeedbacks.length);
      console.log('Debug - Áreas do usuário:', areas.length);
      
      setFeedbacks(userFeedbacks);
    });

    return unsubscribe;
  };

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

  // Função para obter limite de feedbacks baseado no plano
  const getFeedbackLimit = (plan: string) => {
    switch (plan) {
      case 'free':
        return 50;
      case 'starter':
        return 200;
      case 'professional':
        return 9999; // Praticamente ilimitado
      default:
        return 50;
    }
  };

  // Função para verificar se está próximo do limite de feedbacks
  const getFeedbackUsage = () => {
    if (!userProfile) return { current: 0, limit: 50, percentage: 0 };
    
    const currentPlan = userProfile.plan || 'free';
    const limit = getFeedbackLimit(currentPlan);
    
    // Contar feedbacks do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyFeedbacks = feedbacks.filter(feedback => {
      const feedbackDate = new Date(feedback.createdAt);
      return feedbackDate.getMonth() === currentMonth && feedbackDate.getFullYear() === currentYear;
    }).length;
    
    console.log('Debug - getFeedbackUsage:', {
      totalFeedbacks: feedbacks.length,
      monthlyFeedbacks,
      currentMonth,
      currentYear,
      limit
    });
    
    const percentage = Math.round((monthlyFeedbacks / limit) * 100);
    
    return {
      current: monthlyFeedbacks,
      limit,
      percentage: Math.min(percentage, 100)
    };
  };

  // Função para verificar se está próximo do limite
  const isNearFeedbackLimit = () => {
    const usage = getFeedbackUsage();
    return usage.percentage >= 80; // 80% ou mais
  };

  // Função para verificar se atingiu o limite
  const hasReachedFeedbackLimit = () => {
    const usage = getFeedbackUsage();
    return usage.percentage >= 100;
  };

  const getFilteredFeedbacks = () => {
    let filtered = feedbacks.filter(feedback => {
      const area = areas.find(a => a.id === feedback.areaId);
      return area && area.userId === user?.uid;
    });

    if (selectedAreaFilter) {
      filtered = filtered.filter(feedback => feedback.areaId === selectedAreaFilter);
    }

    if (selectedRatingFilter) {
      const rating = parseInt(selectedRatingFilter);
      filtered = filtered.filter(feedback => feedback.rating === rating);
    }

    return filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const handleDeleteAllFeedbacks = async () => {
    try {
      const batch = writeBatch(db);
      const userFeedbacks = feedbacks.filter(feedback => {
        const area = areas.find(a => a.id === feedback.areaId);
        return area && area.userId === user?.uid;
      });

      userFeedbacks.forEach(feedback => {
        batch.delete(doc(db, 'feedbacks', feedback.id));
      });

      await batch.commit();
      setShowDeleteAllModal(false);
      setNotification({
        message: `${userFeedbacks.length} feedbacks excluídos com sucesso!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir feedbacks:', error);
      setNotification({
        message: 'Erro ao excluir feedbacks. Tente novamente.',
        type: 'error'
      });
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

  const userFeedbacks = getFilteredFeedbacks();
  const totalFeedbacks = userFeedbacks.length;
  const averageRating = totalFeedbacks > 0 
    ? userFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
    : 0;

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
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Meu Painel
                </button>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-900 dark:text-white font-medium">Opiniões</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">💬 Todas as Opiniões</h1>
            <p className="text-gray-600 dark:text-gray-400">Visualize e gerencie todas as opiniões recebidas</p>
          </div>

          {/* Feedback Usage Warning */}
          {userProfile && (
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Feedbacks este mês: {getFeedbackUsage().current}/{getFeedbackUsage().limit}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getFeedbackUsage().percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          hasReachedFeedbackLimit() 
                            ? 'bg-red-500' 
                            : isNearFeedbackLimit() 
                              ? 'bg-yellow-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${getFeedbackUsage().percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {hasReachedFeedbackLimit() && (
                  <div className="ml-4">
                    <button
                      onClick={() => router.push('/planos')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Limite Atingido - Fazer Upgrade
                    </button>
                  </div>
                )}
                
                {isNearFeedbackLimit() && !hasReachedFeedbackLimit() && (
                  <div className="ml-4">
                    <button
                      onClick={() => router.push('/planos')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Próximo do Limite - Fazer Upgrade
                    </button>
                  </div>
                )}
              </div>
              
              {hasReachedFeedbackLimit() && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 dark:text-red-300">
                      <strong>Limite atingido!</strong> Você atingiu o máximo de {getFeedbackLimit(userProfile.plan || 'free')} feedbacks/mês do seu plano gratuito. 
                      <button 
                        onClick={() => router.push('/planos')}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Faça upgrade para receber feedbacks ilimitados!
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card variant="elevated">
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalFeedbacks}</div>
                  <div className="text-gray-600 dark:text-gray-400">Total de Opiniões</div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Avaliação Média</div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{areas.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Áreas Ativas</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="elevated" className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filtrar por Área
                  </label>
                  <select
                    value={selectedAreaFilter}
                    onChange={(e) => setSelectedAreaFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas as áreas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filtrar por Avaliação
                  </label>
                  <select
                    value={selectedRatingFilter}
                    onChange={(e) => setSelectedRatingFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas as avaliações</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-600 dark:text-gray-400">
              {userFeedbacks.length} feedback{userFeedbacks.length !== 1 ? 's' : ''} encontrado{userFeedbacks.length !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              {userFeedbacks.length > 0 && (
                <>
                  <CardAction
                    onClick={() => setShowAIAnalysis(true)}
                    variant="primary"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    Análise de IA
                  </CardAction>
                  <CardAction
                    onClick={() => setShowDeleteAllModal(true)}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Excluir Todos
                  </CardAction>
                </>
              )}
            </div>
          </div>

          {/* Feedbacks List */}
          {userFeedbacks.length === 0 ? (
            <Card variant="elevated">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum feedback encontrado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {feedbacks.length === 0 
                    ? 'Ainda não há feedbacks. Compartilhe seus QR Codes para começar a receber avaliações!'
                    : 'Nenhum feedback corresponde aos filtros selecionados.'
                  }
                </p>
                {feedbacks.length === 0 && (
                  <CardAction
                    onClick={() => router.push('/areas')}
                    variant="primary"
                  >
                    Criar Primeira Área
                  </CardAction>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userFeedbacks.map((feedback) => (
                <Card key={feedback.id} variant="elevated">
                  <CardContent>
                    <FeedbackList
                      feedbacks={[feedback]}
                      showAreaName={true}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAIAnalysis && (
        <AIAgent
          feedbacks={userFeedbacks}
          areas={areas}
          userSegment={userProfile?.segment}
          onClose={() => setShowAIAnalysis(false)}
        />
      )}

      {/* Delete All Feedbacks Modal */}
      {showDeleteAllModal && (
        <DeleteAllFeedbacksModal
          onClose={() => setShowDeleteAllModal(false)}
          onConfirm={handleDeleteAllFeedbacks}
          totalFeedbacks={userFeedbacks.length}
        />
      )}

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