'use client';

import { useState, useEffect } from 'react';
import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import Card, { CardHeader, CardContent } from '@/components/Card';

interface AIInsightsPanelProps {
  areas: Area[];
  feedbacks: Feedback[];
  userSegment?: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  actionable: boolean;
  action?: string;
}

export default function AIInsightsPanel({ areas, feedbacks, userSegment }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (feedbacks.length > 0 && areas.length > 0) {
      generateInsights();
    }
  }, [feedbacks, areas]);

  const generateInsights = () => {
    setLoading(true);
    
    // Simular processamento de IA
    setTimeout(() => {
      const newInsights: Insight[] = [];
      const userFeedbacks = feedbacks.filter(feedback => {
        const area = areas.find(a => a.id === feedback.areaId);
        return area && area.userId;
      });

      if (userFeedbacks.length === 0) {
        setInsights([]);
        setLoading(false);
        return;
      }

      // Calcular métricas gerais
      const totalRating = userFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const avgRating = totalRating / userFeedbacks.length;
      
      // Análise por área
      const areaStats = areas.map(area => {
        const areaFeedbacks = userFeedbacks.filter(f => f.areaId === area.id);
        if (areaFeedbacks.length === 0) return null;
        
        const areaAvgRating = areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / areaFeedbacks.length;
        const recentFeedbacks = areaFeedbacks.filter(f => {
          const date = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
          const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        });
        
        return {
          area,
          avgRating: areaAvgRating,
          count: areaFeedbacks.length,
          recentCount: recentFeedbacks.length,
          recentRating: recentFeedbacks.length > 0 
            ? recentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / recentFeedbacks.length 
            : areaAvgRating
        };
      }).filter(Boolean);

      // Insight 1: Performance geral
      if (avgRating >= 4.5) {
        newInsights.push({
          id: '1',
          type: 'success',
          title: '🎉 Excelente Desempenho Geral!',
          message: `Sua satisfação média está em ${avgRating.toFixed(1)}, demonstrando excelente qualidade de serviço.`,
          priority: 'low',
          timestamp: new Date(),
          actionable: false
        });
      } else if (avgRating <= 3.0) {
        newInsights.push({
          id: '2',
          type: 'alert',
          title: '🚨 Atenção: Satisfação Baixa',
          message: `Sua satisfação média está em ${avgRating.toFixed(1)}. Recomendamos análise urgente e implementação de melhorias.`,
          priority: 'high',
          timestamp: new Date(),
          actionable: true,
          action: 'Revisar processos e implementar melhorias imediatas'
        });
      }

      // Insight 2: Análise de tendências
      const recentFeedbacks = userFeedbacks.filter(f => {
        const date = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });

      if (recentFeedbacks.length > 0) {
        const recentAvg = recentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / recentFeedbacks.length;
        const change = recentAvg - avgRating;
        
        if (change > 0.5) {
          newInsights.push({
            id: '3',
            type: 'success',
            title: '📈 Tendência Positiva Detectada',
            message: `Sua satisfação recente (${recentAvg.toFixed(1)}) está ${change.toFixed(1)} pontos acima da média geral. Continue assim!`,
            priority: 'low',
            timestamp: new Date(),
            actionable: false
          });
        } else if (change < -0.5) {
          newInsights.push({
            id: '4',
            type: 'warning',
            title: '📉 Tendência Negativa Detectada',
            message: `Sua satisfação recente (${recentAvg.toFixed(1)}) está ${Math.abs(change).toFixed(1)} pontos abaixo da média geral.`,
            priority: 'medium',
            timestamp: new Date(),
            actionable: true,
            action: 'Investigar causas da queda recente'
          });
        }
      }

      // Insight 3: Análise por área
      areaStats.forEach((stat, index) => {
        if (!stat) return;
        
        if (stat.avgRating >= 4.5 && stat.count >= 5) {
          newInsights.push({
            id: `5-${index}`,
            type: 'success',
            title: `🏆 Área de Destaque: ${stat.area.name}`,
            message: `${stat.area.name} tem excelente desempenho com ${stat.avgRating.toFixed(1)} de satisfação.`,
            priority: 'low',
            timestamp: new Date(),
            actionable: true,
            action: 'Documentar melhores práticas desta área'
          });
        } else if (stat.avgRating <= 3.0 && stat.count >= 3) {
          newInsights.push({
            id: `6-${index}`,
            type: 'alert',
            title: `⚠️ Área Precisa de Atenção: ${stat.area.name}`,
            message: `${stat.area.name} tem baixa satisfação (${stat.avgRating.toFixed(1)}) e precisa de melhorias urgentes.`,
            priority: 'high',
            timestamp: new Date(),
            actionable: true,
            action: 'Implementar plano de melhoria para esta área'
          });
        }
      });

      // Insight 4: Volume de feedbacks
      if (userFeedbacks.length < 10) {
        newInsights.push({
          id: '7',
          type: 'info',
          title: '📊 Base de Dados Limitada',
          message: 'Você tem poucos feedbacks para análise. Considere aumentar a coleta para insights mais precisos.',
          priority: 'medium',
          timestamp: new Date(),
          actionable: true,
          action: 'Promover coleta de feedbacks'
        });
      } else if (userFeedbacks.length >= 50) {
        newInsights.push({
          id: '8',
          type: 'success',
          title: '📊 Base de Dados Robusta',
          message: `Excelente! Com ${userFeedbacks.length} feedbacks, suas análises são muito confiáveis.`,
          priority: 'low',
          timestamp: new Date(),
          actionable: false
        });
      }

      // Insight 5: Segmento específico
      if (userSegment) {
        const segmentInsights = {
          'Varejo': 'Considere implementar sistema de fidelização para aumentar satisfação',
          'Restaurante': 'Foque na qualidade dos alimentos e tempo de atendimento',
          'Saúde': 'Priorize comunicação clara e agendamento eficiente',
          'Educação': 'Invista em metodologias ativas e infraestrutura',
          'Serviços': 'Mantenha prazos realistas e comunicação transparente'
        };

        const insight = segmentInsights[userSegment as keyof typeof segmentInsights];
        if (insight) {
          newInsights.push({
            id: '9',
            type: 'info',
            title: `🎯 Insight do Segmento: ${userSegment}`,
            message: insight,
            priority: 'medium',
            timestamp: new Date(),
            actionable: true,
            action: 'Implementar estratégias específicas do segmento'
          });
        }
      }

      // Ordenar insights por prioridade e timestamp
      newInsights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setInsights(newInsights);
      setLoading(false);
    }, 1000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'alert': return '🚨';
      default: return '📊';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-400 bg-green-50';
      case 'warning': return 'border-yellow-400 bg-yellow-50';
      case 'info': return 'border-blue-400 bg-blue-50';
      case 'alert': return 'border-red-400 bg-red-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-primary">🧠 Insights de IA em Tempo Real</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-color mx-auto mb-4"></div>
            <p className="text-secondary">Analisando dados para gerar insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">🧠 Insights de IA em Tempo Real</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary">Última atualização:</span>
              <span className="text-sm font-medium text-primary">
                {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-secondary">Nenhum insight disponível no momento</p>
              <p className="text-sm text-secondary mt-2">
                Continue coletando feedbacks para receber análises inteligentes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-primary">{insight.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                            {insight.priority === 'high' ? 'Alta' : 
                             insight.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <p className="text-secondary text-sm mb-2">{insight.message}</p>
                        {insight.actionable && insight.action && (
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-primary font-medium mb-1">💡 Ação Recomendada:</p>
                            <p className="text-sm text-secondary">{insight.action}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-secondary ml-4">
                      {insight.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas dos Insights */}
      {insights.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <h4 className="text-lg font-semibold text-primary">📊 Resumo dos Insights</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.type === 'success').length}
                </div>
                <div className="text-sm text-green-700">Sucessos</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {insights.filter(i => i.type === 'warning').length}
                </div>
                <div className="text-sm text-yellow-700">Atenções</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {insights.filter(i => i.type === 'alert').length}
                </div>
                <div className="text-sm text-red-700">Alertas</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {insights.filter(i => i.actionable).length}
                </div>
                <div className="text-sm text-blue-700">Ações</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
