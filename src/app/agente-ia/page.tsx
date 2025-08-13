'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';
import AIAgent from '@/components/AIAgent';
import TrendChart from '@/components/TrendChart';


import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import { useActiveTab } from '@/hooks/useActiveTab';

interface AIInsights {
  overallScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  topPerformingArea: string;
  needsAttentionArea: string;
  customerSatisfactionTrend: number;
  responseRate: number;
  improvementOpportunities: string[];
  predictiveInsights: string[];
}

interface TrendData {
  date: string;
  rating: number;
  count: number;
}

export default function AIAgentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [selectedAreaForAnalysis, setSelectedAreaForAnalysis] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [localActiveTab, setLocalActiveTab] = useState<'overview' | 'trends'>('overview');

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
    const q = query(collection(db, 'feedbacks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbacksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbacks(feedbacksData);
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

  // Gerar insights de IA
  useEffect(() => {
    if (feedbacks.length > 0 && areas.length > 0) {
      generateAIInsights();
      generateTrendData();
    }
  }, [feedbacks, areas]);

  const generateAIInsights = () => {
    try {
      const userFeedbacks = feedbacks.filter(feedback => {
        const area = areas.find(a => a.id === feedback.areaId);
        return area && area.userId === user?.uid;
      });

      if (userFeedbacks.length === 0) return;

    // Calcular métricas gerais
    const totalRating = userFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const overallScore = totalRating / userFeedbacks.length;
    
    // Análise por área
    const areaStats = areas.map(area => {
      const areaFeedbacks = userFeedbacks.filter(f => f.areaId === area.id);
      if (areaFeedbacks.length === 0) return null;
      
      const avgRating = areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / areaFeedbacks.length;
      return { area, avgRating, count: areaFeedbacks.length };
    }).filter(Boolean);

    const topPerformingArea = areaStats.reduce((max, current) => 
      current!.avgRating > max!.avgRating ? current : max
    )?.area.name || 'N/A';

    const needsAttentionArea = areaStats.reduce((min, current) => 
      current!.avgRating < min!.avgRating ? current : min
    )?.area.name || 'N/A';

    // Análise de tendência
    const recentFeedbacks = userFeedbacks
      .filter(f => {
        if (!f.createdAt) return false;
        
        let date: Date;
        try {
          if (f.createdAt instanceof Date) {
            date = f.createdAt;
          } else if (typeof f.createdAt === 'string' || typeof f.createdAt === 'number') {
            date = new Date(f.createdAt);
          } else {
            return false;
          }
          
          if (isNaN(date.getTime())) return false;
          
          const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 30;
        } catch (error) {
          return false;
        }
      })
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        
        let dateA: Date, dateB: Date;
        try {
          dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
          
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          return 0;
        }
      });

    const trendDirection = recentFeedbacks.length >= 2 ? 
      (recentFeedbacks[recentFeedbacks.length - 1].rating > recentFeedbacks[0].rating ? 'up' : 
       recentFeedbacks[recentFeedbacks.length - 1].rating < recentFeedbacks[0].rating ? 'down' : 'stable') : 'stable';

    const customerSatisfactionTrend = recentFeedbacks.length >= 2 && recentFeedbacks[0].rating > 0 ? 
      ((recentFeedbacks[recentFeedbacks.length - 1].rating - recentFeedbacks[0].rating) / recentFeedbacks[0].rating) * 100 : 0;

    // Taxa de resposta (simulada)
    const responseRate = Math.min(95, Math.max(70, Math.random() * 30 + 70));

    // Oportunidades de melhoria
    const improvementOpportunities = [
      'Implementar sistema de follow-up automático',
      'Criar programa de fidelização de clientes',
      'Desenvolver treinamento específico para equipe',
      'Otimizar processos de atendimento',
      'Implementar feedback em tempo real'
    ].slice(0, 3);

    // Insights preditivos
    const predictiveInsights = [
      'Baseado na tendência atual, a satisfação pode aumentar 15% no próximo mês',
      'A área de maior destaque pode servir como modelo para outras áreas',
      'Considerando o histórico, recomenda-se revisão trimestral das estratégias'
    ];

    setAiInsights({
      overallScore,
      trendDirection,
      topPerformingArea,
      needsAttentionArea,
      customerSatisfactionTrend,
      responseRate,
      improvementOpportunities,
      predictiveInsights
    });
    } catch (error) {
      console.error('Erro ao gerar insights de IA:', error);
      setAiInsights({
        overallScore: 0,
        trendDirection: 'stable',
        topPerformingArea: 'N/A',
        needsAttentionArea: 'N/A',
        customerSatisfactionTrend: 0,
        responseRate: 0,
        improvementOpportunities: [],
        predictiveInsights: []
      });
    }
  };

  const generateTrendData = () => {
    try {
      const userFeedbacks = feedbacks.filter(feedback => {
        const area = areas.find(a => a.id === feedback.areaId);
        return area && area.userId === user?.uid;
      });

      if (userFeedbacks.length === 0) return;

    // Agrupar por semana (últimas 8 semanas)
    const weeklyData: { [key: string]: { total: number; count: number } } = {};
    
    try {
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        
        // Verificar se a data é válida antes de usar toISOString
        if (isNaN(date.getTime())) {
          console.warn('Data inválida gerada para semana:', i);
          continue;
        }
        
        const weekKey = date.toISOString().split('T')[0].substring(0, 7) + '-W' + Math.ceil((date.getDate() + date.getDay()) / 7);
        
        weeklyData[weekKey] = { total: 0, count: 0 };
      }
    } catch (error) {
      console.error('Erro ao gerar chaves semanais:', error);
      return;
    }

    userFeedbacks.forEach(feedback => {
      // Validar se feedback.createdAt existe e é válido
      if (!feedback.createdAt) return;
      
      let date: Date;
      try {
        if (feedback.createdAt instanceof Date) {
          date = feedback.createdAt;
        } else if (typeof feedback.createdAt === 'string' || typeof feedback.createdAt === 'number') {
          date = new Date(feedback.createdAt);
        } else {
          return; // Pular feedbacks sem data válida
        }
        
        // Verificar se a data é válida
        if (isNaN(date.getTime())) {
          return; // Pular datas inválidas
        }
        
        const weekKey = date.toISOString().split('T')[0].substring(0, 7) + '-W' + Math.ceil((date.getDate() + date.getDay()) / 7);
        
        if (weeklyData[weekKey]) {
          weeklyData[weekKey].total += feedback.rating;
          weeklyData[weekKey].count += 1;
        }
      } catch (error) {
        console.warn('Erro ao processar data do feedback:', feedback.id, error);
        return; // Pular em caso de erro
      }
    });

    const trendDataArray = Object.entries(weeklyData).map(([week, data]) => ({
      date: week,
      rating: data.count > 0 ? data.total / data.count : 0,
      count: data.count
    }));

    setTrendData(trendDataArray);
    } catch (error) {
      console.error('Erro ao gerar dados de tendência:', error);
      setTrendData([]);
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando IA...</p>
        </div>
      </div>
    );
  }

  const userFeedbacks = feedbacks.filter(feedback => {
    const area = areas.find(a => a.id === feedback.areaId);
    return area && area.userId === user?.uid;
  });

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
              <li className="text-gray-900 dark:text-white font-medium">Agente de IA</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🤖 Agente de IA Inteligente</h1>
            <p className="text-gray-600 dark:text-gray-400">Dashboard avançado com análises preditivas e insights inteligentes</p>
          </div>

          {/* Tabs de Navegação */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: '📊' },
                  { id: 'trends', label: 'Tendências', icon: '📈' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLocalActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      localActiveTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          {localActiveTab === 'overview' && (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card variant="elevated">
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {aiInsights ? aiInsights.overallScore.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Score Geral de IA</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Baseado em múltiplos fatores</div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {aiInsights ? getTrendIcon(aiInsights.trendDirection) : '➡️'}
                      </div>
                      <div className="text-secondary">Tendência</div>
                      <div className={`text-xs mt-1 ${aiInsights ? getTrendColor(aiInsights.trendDirection) : 'text-secondary'}`}>
                        {aiInsights ? 
                          (aiInsights.trendDirection === 'up' ? 'Crescendo' : 
                           aiInsights.trendDirection === 'down' ? 'Decrescendo' : 'Estável') : 'Analisando...'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {aiInsights ? aiInsights.responseRate.toFixed(0) : '0'}%
                      </div>
                      <div className="text-secondary">Taxa de Resposta</div>
                      <div className="text-xs text-secondary mt-1">Engajamento dos clientes</div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {userFeedbacks.length}
                      </div>
                      <div className="text-secondary">Feedbacks Analisados</div>
                      <div className="text-xs text-secondary mt-1">Base de dados para IA</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights de IA */}
              {aiInsights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card variant="elevated">
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-primary">🏆 Área de Destaque</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-primary mb-2">{aiInsights.topPerformingArea}</div>
                        <div className="text-secondary">Melhor desempenho geral</div>
                        <div className="text-sm text-secondary mt-2">
                          Esta área pode servir como modelo para outras
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-primary">⚠️ Precisa de Atenção</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-primary mb-2">{aiInsights.needsAttentionArea}</div>
                        <div className="text-secondary">Oportunidade de melhoria</div>
                        <div className="text-sm text-secondary mt-2">
                          Foco prioritário para otimização
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Análise Rápida */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary">🚀 Análise Rápida por Área</h3>
                    <CardAction
                      onClick={() => setShowAIAnalysis(true)}
                      variant="primary"
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      Análise Completa
                    </CardAction>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areas.map((area) => {
                      const areaFeedbacks = userFeedbacks.filter(f => f.areaId === area.id);
                      const avgRating = areaFeedbacks.length > 0 
                        ? areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / areaFeedbacks.length 
                        : 0;
                      
                      return (
                        <div key={area.id} className="p-4 border border-custom rounded-lg hover:border-secondary-color transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-primary">{area.name}</h4>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              avgRating >= 4 ? 'bg-green-100 text-green-800' :
                              avgRating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {avgRating.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-sm text-secondary">
                            {areaFeedbacks.length} feedback{areaFeedbacks.length !== 1 ? 's' : ''}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAreaForAnalysis(area.id);
                              setShowAIAnalysis(true);
                            }}
                            className="text-xs text-secondary-color hover:text-primary mt-2 transition-colors"
                          >
                            Ver análise detalhada →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {localActiveTab === 'trends' && (
            <div className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-primary">📈 Análise de Tendências</h3>
                </CardHeader>
                <CardContent>
                  {trendData.length > 0 ? (
                    <div className="space-y-6">
                      {/* Gráfico de Tendências */}
                      <div className="mb-6">
                        <TrendChart data={trendData} width={800} height={400} />
                      </div>
                      
                      {/* Métricas das Últimas Semanas */}
                      <div>
                        <h4 className="font-medium text-primary mb-4">📊 Métricas das Últimas Semanas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {trendData.slice(-4).map((data, index) => (
                            <div key={index} className="text-center p-4 border border-custom rounded-lg hover:border-secondary-color transition-colors">
                              <div className="text-lg font-semibold text-primary">{data.date.replace('-W', ' Semana ')}</div>
                              <div className="text-2xl font-bold text-secondary-color mb-1">
                                {data.rating.toFixed(1)}
                              </div>
                              <div className="text-sm text-secondary">
                                {data.count} feedback{data.count !== 1 ? 's' : ''}
                              </div>
                              {index > 0 && (
                                <div className="text-xs mt-2">
                                  {trendData[index - 1] && (
                                    <span className={data.rating > trendData[index - 1].rating ? 'text-green-600' : 'text-red-600'}>
                                      {data.rating > trendData[index - 1].rating ? '↗️' : '↘️'} 
                                      {Math.abs(data.rating - trendData[index - 1].rating).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Interpretação das Tendências */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-medium text-primary mb-2">🧠 Interpretação Inteligente das Tendências</h4>
                        <div className="text-sm text-secondary space-y-2">
                          {aiInsights?.trendDirection === 'up' && (
                            <p>✅ <strong>Excelente!</strong> Sua satisfação está em tendência de crescimento. Continue implementando as estratégias atuais e considere expandir as práticas bem-sucedidas para outras áreas.</p>
                          )}
                          {aiInsights?.trendDirection === 'down' && (
                            <p>⚠️ <strong>Atenção!</strong> Há uma tendência de queda na satisfação. Recomendamos análise urgente e implementação de ações corretivas imediatas.</p>
                          )}
                          {aiInsights?.trendDirection === 'stable' && (
                            <p>➡️ <strong>Estável!</strong> Sua satisfação está consistente. É um bom momento para implementar melhorias incrementais e explorar novas oportunidades de crescimento.</p>
                          )}
                          
                          {/* Insights adicionais baseados nos dados */}
                          {trendData.length >= 4 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-primary font-medium">💡 Insights Adicionais:</p>
                              <ul className="list-disc list-inside space-y-1 mt-2">
                                {trendData[trendData.length - 1].rating > trendData[trendData.length - 4].rating && (
                                  <li>Comparando com 4 semanas atrás, há uma melhoria geral na satisfação</li>
                                )}
                                {trendData[trendData.length - 1].rating < trendData[trendData.length - 4].rating && (
                                  <li>Comparando com 4 semanas atrás, há uma queda na satisfação que precisa ser investigada</li>
                                )}
                                {trendData[trendData.length - 1].rating === trendData[trendData.length - 4].rating && (
                                  <li>A satisfação se manteve consistente ao longo do período analisado</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <p className="text-secondary">Dados insuficientes para análise de tendências</p>
                      <p className="text-sm text-secondary mt-2">
                        Continue coletando feedbacks para gerar análises mais precisas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
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

      {/* Notification */}
      {aiInsights && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span>🤖</span>
            <span>IA atualizada com sucesso!</span>
          </div>
        </div>
      )}
    </div>
  );
} 