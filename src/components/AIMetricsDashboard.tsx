'use client';

import { useState, useEffect, useCallback } from 'react';
import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import Card, { CardHeader, CardContent } from '@/components/Card';

interface AIMetricsDashboardProps {
  areas: Area[];
  feedbacks: Feedback[];
  refreshInterval?: number;
}

interface MetricData {
  name: string;
  value: number;
  target: number;
  previousValue: number;
  change: number;
  changePercent: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  category: 'satisfaction' | 'engagement' | 'quality' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
}

interface PerformanceScore {
  overall: number;
  satisfaction: number;
  engagement: number;
  quality: number;
  efficiency: number;
  trend: 'improving' | 'declining' | 'stable';
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
}

export default function AIMetricsDashboard({ 
  areas, 
  feedbacks, 
  refreshInterval = 30000 
}: AIMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [performanceScore, setPerformanceScore] = useState<PerformanceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const calculateMetrics = useCallback(() => {
    if (feedbacks.length === 0 || areas.length === 0) return [];

    const userFeedbacks = feedbacks.filter(feedback => {
      const area = areas.find(a => a.id === feedback.areaId);
      return area && area.userId;
    });

    if (userFeedbacks.length === 0) return [];

    const now = new Date();
    const timeRanges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const daysAgo = timeRanges[timeRange];
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const previousCutoffDate = new Date(cutoffDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    const currentFeedbacks = userFeedbacks.filter(f => {
      const date = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
      return date >= cutoffDate;
    });

    const previousFeedbacks = userFeedbacks.filter(f => {
      const date = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
      return date >= previousCutoffDate && date < cutoffDate;
    });

    const currentAvg = currentFeedbacks.length > 0 
      ? currentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / currentFeedbacks.length 
      : 0;

    const previousAvg = previousFeedbacks.length > 0 
      ? previousFeedbacks.reduce((sum, f) => sum + f.rating, 0) / previousFeedbacks.length 
      : 0;

    const change = currentAvg - previousAvg;
    const changePercent = previousAvg > 0 ? (change / previousAvg) * 100 : 0;

    const getStatus = (value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' => {
      if (value >= target * 1.1) return 'excellent';
      if (value >= target) return 'good';
      if (value >= target * 0.8) return 'warning';
      return 'critical';
    };

    const getTrend = (change: number): 'up' | 'down' | 'stable' => {
      if (change > 0.1) return 'up';
      if (change < -0.1) return 'down';
      return 'stable';
    };

    const getPriority = (changePercent: number, status: string): 'high' | 'medium' | 'low' => {
      if (status === 'critical' || changePercent < -10) return 'high';
      if (status === 'warning' || Math.abs(changePercent) > 5) return 'medium';
      return 'low';
    };

    return [
      {
        name: 'Satisfação Geral',
        value: currentAvg,
        target: 4.0,
        previousValue: previousAvg,
        change,
        changePercent,
        status: getStatus(currentAvg, 4.0),
        trend: getTrend(change),
        category: 'satisfaction' as const,
        priority: getPriority(changePercent, getStatus(currentAvg, 4.0))
      },
      {
        name: 'Taxa de Engajamento',
        value: (currentFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100,
        target: 30,
        previousValue: (previousFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100,
        change: (currentFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100 - (previousFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100,
        changePercent: previousFeedbacks.length > 0 ? ((currentFeedbacks.length - previousFeedbacks.length) / previousFeedbacks.length) * 100 : 0,
        status: getStatus((currentFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100, 30),
        trend: getTrend((currentFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100 - (previousFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100),
        category: 'engagement' as const,
        priority: getPriority(((currentFeedbacks.length - previousFeedbacks.length) / Math.max(1, previousFeedbacks.length)) * 100, getStatus((currentFeedbacks.length / Math.max(1, userFeedbacks.length)) * 100, 30))
      },
      {
        name: 'Qualidade do Serviço',
        value: currentFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, currentFeedbacks.length) * 100,
        target: 80,
        previousValue: previousFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, previousFeedbacks.length) * 100,
        change: (currentFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, currentFeedbacks.length) * 100) - (previousFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, previousFeedbacks.length) * 100),
        changePercent: previousFeedbacks.filter(f => f.rating >= 4).length > 0 ? ((currentFeedbacks.filter(f => f.rating >= 4).length - previousFeedbacks.filter(f => f.rating >= 4).length) / previousFeedbacks.filter(f => f.rating >= 4).length) * 100 : 0,
        status: getStatus(currentFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, currentFeedbacks.length) * 100, 80),
        trend: getTrend((currentFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, currentFeedbacks.length) * 100) - (previousFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, previousFeedbacks.length) * 100)),
        category: 'quality' as const,
        priority: getPriority(((currentFeedbacks.filter(f => f.rating >= 4).length - previousFeedbacks.filter(f => f.rating >= 4).length) / Math.max(1, previousFeedbacks.filter(f => f.rating >= 4).length)) * 100, getStatus(currentFeedbacks.filter(f => f.rating >= 4).length / Math.max(1, currentFeedbacks.length) * 100, 80))
      },
      {
        name: 'Eficiência Operacional',
        value: currentFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, currentFeedbacks.length) * 100,
        target: 90,
        previousValue: previousFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, previousFeedbacks.length) * 100,
        change: (currentFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, currentFeedbacks.length) * 100) - (previousFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, previousFeedbacks.length) * 100),
        changePercent: previousFeedbacks.filter(f => f.rating >= 3).length > 0 ? ((currentFeedbacks.filter(f => f.rating >= 3).length - previousFeedbacks.filter(f => f.rating >= 3).length) / previousFeedbacks.filter(f => f.rating >= 3).length) * 100 : 0,
        status: getStatus(currentFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, currentFeedbacks.length) * 100, 90),
        trend: getTrend((currentFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, currentFeedbacks.length) * 100) - (previousFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, previousFeedbacks.length) * 100)),
        category: 'efficiency' as const,
        priority: getPriority(((currentFeedbacks.filter(f => f.rating >= 3).length - previousFeedbacks.filter(f => f.rating >= 3).length) / Math.max(1, previousFeedbacks.filter(f => f.rating >= 3).length)) * 100, getStatus(currentFeedbacks.filter(f => f.rating >= 3).length / Math.max(1, currentFeedbacks.length) * 100, 90))
      }
    ];
  }, [feedbacks, areas, timeRange]);

  const calculatePerformanceScore = useCallback((metrics: MetricData[]) => {
    if (metrics.length === 0) return null;

    const categoryScores = {
      satisfaction: metrics.find(m => m.category === 'satisfaction')?.value || 0,
      engagement: metrics.find(m => m.category === 'engagement')?.value || 0,
      quality: metrics.find(m => m.category === 'quality')?.value || 0,
      efficiency: metrics.find(m => m.category === 'efficiency')?.value || 0
    };

    const overall = (categoryScores.satisfaction + categoryScores.engagement + categoryScores.quality + categoryScores.efficiency) / 4;

    const getGrade = (score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' => {
      if (score >= 95) return 'A+';
      if (score >= 90) return 'A';
      if (score >= 85) return 'B+';
      if (score >= 80) return 'B';
      if (score >= 75) return 'C+';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    };

    const getTrend = (metrics: MetricData[]): 'improving' | 'declining' | 'stable' => {
      const improving = metrics.filter(m => m.trend === 'up').length;
      const declining = metrics.filter(m => m.trend === 'down').length;
      
      if (improving > declining) return 'improving';
      if (declining > improving) return 'declining';
      return 'stable';
    };

    return {
      overall,
      satisfaction: categoryScores.satisfaction,
      engagement: categoryScores.engagement,
      quality: categoryScores.quality,
      efficiency: categoryScores.efficiency,
      trend: getTrend(metrics),
      grade: getGrade(overall)
    };
  }, []);

  const refreshMetrics = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const newMetrics = calculateMetrics();
      const newPerformanceScore = calculatePerformanceScore(newMetrics);
      
      setMetrics(newMetrics);
      setPerformanceScore(newPerformanceScore);
      setLastUpdate(new Date());
      setLoading(false);
    }, 600);
  }, [calculateMetrics, calculatePerformanceScore]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics, timeRange]);

  useEffect(() => {
    const interval = setInterval(refreshMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshMetrics, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-primary">📊 Dashboard de Métricas da IA</h3>
              <button
                onClick={refreshMetrics}
                disabled={loading}
                className="px-3 py-1 text-sm bg-secondary-color text-white rounded hover:bg-secondary-color/80 disabled:opacity-50"
              >
                {loading ? '🔄' : '🔄 Atualizar'}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-secondary">Período:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="7d">7 dias</option>
                  <option value="30d">30 dias</option>
                  <option value="90d">90 dias</option>
                </select>
              </div>
              <div className="text-right">
                <div className="text-sm text-secondary">Última atualização</div>
                <div className="text-sm font-medium text-primary">
                  {lastUpdate.toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Score de Performance Geral */}
      {performanceScore && (
        <Card variant="elevated">
          <CardHeader>
            <h4 className="text-lg font-semibold text-primary">🏆 Score de Performance Geral</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {performanceScore.overall.toFixed(1)}
                </div>
                <div className="text-sm text-blue-700 mb-2">Score Geral</div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(performanceScore.grade)}`}>
                  {performanceScore.grade}
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {performanceScore.satisfaction.toFixed(1)}
                </div>
                <div className="text-sm text-green-700">Satisfação</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceScore.engagement.toFixed(1)}
                </div>
                <div className="text-sm text-blue-700">Engajamento</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceScore.quality.toFixed(1)}
                </div>
                <div className="text-sm text-purple-700">Qualidade</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceScore.efficiency.toFixed(1)}
                </div>
                <div className="text-sm text-orange-700">Eficiência</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tendência Geral:</span>
                <span className={`text-sm font-medium ${
                  performanceScore.trend === 'improving' ? 'text-green-600' :
                  performanceScore.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {performanceScore.trend === 'improving' ? '📈 Melhorando' :
                   performanceScore.trend === 'declining' ? '📉 Declinando' : '➡️ Estável'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros de Categoria */}
      <Card variant="elevated">
        <CardHeader>
          <h4 className="text-lg font-semibold text-primary">🔍 Filtros e Categorias</h4>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todas', icon: '📊' },
              { id: 'satisfaction', label: 'Satisfação', icon: '😊' },
              { id: 'engagement', label: 'Engajamento', icon: '🎯' },
              { id: 'quality', label: 'Qualidade', icon: '⭐' },
              { id: 'efficiency', label: 'Eficiência', icon: '⚡' }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'border-secondary-color bg-secondary-color text-white'
                    : 'border-gray-300 text-secondary hover:border-secondary-color hover:text-secondary-color'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <Card variant="elevated">
        <CardHeader>
          <h4 className="text-lg font-semibold text-primary">📈 Métricas Detalhadas</h4>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-color mx-auto mb-4"></div>
              <p className="text-secondary">Calculando métricas...</p>
            </div>
          ) : filteredMetrics.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-secondary">Nenhuma métrica disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMetrics.map((metric, index) => (
                <div key={index} className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {metric.category === 'satisfaction' ? '😊' :
                         metric.category === 'engagement' ? '🎯' :
                         metric.category === 'quality' ? '⭐' : '⚡'}
                      </span>
                      <div>
                        <h5 className="text-lg font-semibold text-primary">{metric.name}</h5>
                        <p className="text-sm text-secondary">
                          Categoria: {metric.category.charAt(0).toUpperCase() + metric.category.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status === 'excellent' ? 'Excelente' :
                         metric.status === 'good' ? 'Bom' :
                         metric.status === 'warning' ? 'Atenção' : 'Crítico'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(metric.priority)}`}>
                        Prioridade {metric.priority === 'high' ? 'Alta' : metric.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  </div>

                  {/* Valores e Mudanças */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-secondary mb-1">Atual</div>
                      <div className="text-2xl font-bold text-primary">
                        {typeof metric.value === 'number' && metric.value % 1 !== 0 
                          ? metric.value.toFixed(1) 
                          : metric.value}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary mb-1">Anterior</div>
                      <div className="text-xl font-bold text-gray-600">
                        {typeof metric.previousValue === 'number' && metric.previousValue % 1 !== 0 
                          ? metric.previousValue.toFixed(1) 
                          : metric.previousValue}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary mb-1">Mudança</div>
                      <div className={`text-xl font-bold ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary mb-1">%</div>
                      <div className={`text-xl font-bold ${metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-secondary">Progresso para meta</span>
                      <span className="text-sm font-medium text-primary">
                        {Math.min(100, (metric.value / metric.target) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          metric.status === 'excellent' ? 'bg-green-500' :
                          metric.status === 'good' ? 'bg-blue-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-secondary mt-1">
                      Meta: {metric.target}
                    </div>
                  </div>

                  {/* Tendência e Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className={`text-lg ${getTrendColor(metric.trend)}`}>
                        {getTrendIcon(metric.trend)} Tendência {metric.trend === 'up' ? 'Positiva' : metric.trend === 'down' ? 'Negativa' : 'Estável'}
                      </span>
                    </div>
                    <div className="text-xs text-secondary">
                      ID: {metric.category}-{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo das Categorias */}
      {metrics.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <h4 className="text-lg font-semibold text-primary">📋 Resumo por Categoria</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['satisfaction', 'engagement', 'quality', 'efficiency'].map((category) => {
                const categoryMetrics = metrics.filter(m => m.category === category);
                const avgValue = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
                const avgStatus = categoryMetrics.reduce((sum, m) => {
                  const statusValues = { excellent: 4, good: 3, warning: 2, critical: 1 };
                  return sum + statusValues[m.status];
                }, 0) / categoryMetrics.length;
                
                const overallStatus = avgStatus >= 3.5 ? 'excellent' : 
                                   avgStatus >= 2.5 ? 'good' : 
                                   avgStatus >= 1.5 ? 'warning' : 'critical';

                return (
                  <div key={category} className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-2xl mb-2">
                      {category === 'satisfaction' ? '😊' :
                       category === 'engagement' ? '🎯' :
                       category === 'quality' ? '⭐' : '⚡'}
                    </div>
                    <div className="text-lg font-semibold text-primary mb-1">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    <div className="text-2xl font-bold text-secondary-color mb-2">
                      {avgValue.toFixed(1)}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(overallStatus)}`}>
                      {overallStatus === 'excellent' ? 'Excelente' :
                       overallStatus === 'good' ? 'Bom' :
                       overallStatus === 'warning' ? 'Atenção' : 'Crítico'}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
