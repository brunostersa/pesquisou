'use client';

import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import Card, { CardHeader, CardContent } from '@/components/Card';

interface AreaComparisonProps {
  areas: Area[];
  feedbacks: Feedback[];
}

interface AreaStats {
  area: Area;
  avgRating: number;
  totalFeedbacks: number;
  recentRating: number;
  trend: 'up' | 'down' | 'stable';
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export default function AreaComparison({ areas, feedbacks }: AreaComparisonProps) {
  const getAreaStats = (): AreaStats[] => {
    return areas.map(area => {
      const areaFeedbacks = feedbacks.filter(f => f.areaId === area.id);
      
      if (areaFeedbacks.length === 0) {
        return {
          area,
          avgRating: 0,
          totalFeedbacks: 0,
          recentRating: 0,
          trend: 'stable' as const,
          performance: 'average' as const
        };
      }

      const avgRating = areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / areaFeedbacks.length;
      
      // Calcular rating recente (últimos 7 dias)
      const recentFeedbacks = areaFeedbacks.filter(f => {
        const date = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
        const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });
      
      const recentRating = recentFeedbacks.length > 0 
        ? recentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / recentFeedbacks.length 
        : avgRating;

      // Determinar tendência
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentFeedbacks.length >= 2) {
        const sortedRecent = recentFeedbacks.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
        
        if (sortedRecent.length >= 2) {
          const firstRating = sortedRecent[0].rating;
          const lastRating = sortedRecent[sortedRecent.length - 1].rating;
          
          if (lastRating > firstRating + 0.5) trend = 'up';
          else if (lastRating < firstRating - 0.5) trend = 'down';
        }
      }

      // Determinar performance
      let performance: 'excellent' | 'good' | 'average' | 'poor' = 'average';
      if (avgRating >= 4.5) performance = 'excellent';
      else if (avgRating >= 4.0) performance = 'good';
      else if (avgRating >= 3.0) performance = 'average';
      else performance = 'poor';

      return {
        area,
        avgRating,
        totalFeedbacks: areaFeedbacks.length,
        recentRating,
        trend,
        performance
      };
    }).sort((a, b) => b.avgRating - a.avgRating);
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return '🏆';
      case 'good': return '✅';
      case 'average': return '⚠️';
      case 'poor': return '❌';
      default: return '📊';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
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

  const areaStats = getAreaStats();
  const totalFeedbacks = feedbacks.length;
  const overallAvgRating = totalFeedbacks > 0 
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-primary">📊 Visão Geral do Desempenho</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{overallAvgRating.toFixed(1)}</div>
              <div className="text-secondary">Avaliação Média Geral</div>
              <div className="text-sm text-secondary mt-1">Todas as áreas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{totalFeedbacks}</div>
              <div className="text-secondary">Total de Feedbacks</div>
              <div className="text-sm text-secondary mt-1">Base de dados</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{areas.length}</div>
              <div className="text-secondary">Áreas Ativas</div>
              <div className="text-sm text-secondary mt-1">Monitoradas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking das Áreas */}
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-primary">🏆 Ranking de Desempenho por Área</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areaStats.map((stat, index) => (
              <div key={stat.area.id} className="flex items-center justify-between p-4 border border-custom rounded-lg hover:border-secondary-color transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-color text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">{stat.area.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-secondary">
                      <span>{getPerformanceIcon(stat.performance)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPerformanceColor(stat.performance)}`}>
                        {stat.performance === 'excellent' ? 'Excelente' :
                         stat.performance === 'good' ? 'Bom' :
                         stat.performance === 'average' ? 'Médio' : 'Baixo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{stat.avgRating.toFixed(1)}</div>
                    <div className="text-xs text-secondary">Média Geral</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-color">{stat.recentRating.toFixed(1)}</div>
                    <div className="text-xs text-secondary">Últimos 7 dias</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{stat.totalFeedbacks}</div>
                    <div className="text-xs text-secondary">Feedbacks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg ${getTrendColor(stat.trend)}`}>
                      {getTrendIcon(stat.trend)}
                    </div>
                    <div className="text-xs text-secondary">Tendência</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise Comparativa */}
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-primary">🔍 Análise Comparativa Inteligente</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areaStats.length >= 2 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-400">
                <h4 className="font-medium text-primary mb-2">💡 Insights de Comparação</h4>
                <div className="text-sm text-secondary space-y-2">
                  <p>
                    <strong>Área Líder:</strong> {areaStats[0].area.name} com avaliação média de {areaStats[0].avgRating.toFixed(1)}
                  </p>
                  <p>
                    <strong>Maior Oportunidade:</strong> {areaStats[areaStats.length - 1].area.name} com avaliação média de {areaStats[areaStats.length - 1].avgRating.toFixed(1)}
                  </p>
                  <p>
                    <strong>Diferença:</strong> {Math.abs(areaStats[0].avgRating - areaStats[areaStats.length - 1].avgRating).toFixed(1)} pontos entre a melhor e pior área
                  </p>
                  {areaStats[0].avgRating - areaStats[areaStats.length - 1].avgRating > 1 && (
                    <p className="text-orange-600 font-medium">
                      ⚠️ Há uma diferença significativa entre as áreas. Considere implementar as melhores práticas da área líder nas outras áreas.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-primary mb-2">🎯 Recomendações Baseadas na Comparação</h4>
              <div className="text-sm text-secondary space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Identifique e documente as práticas da área de melhor desempenho</li>
                  <li>Implemente um programa de compartilhamento de melhores práticas entre áreas</li>
                  <li>Estabeleça metas de melhoria para áreas com desempenho inferior</li>
                  <li>Monitore o progresso das melhorias implementadas</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
