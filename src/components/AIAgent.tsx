'use client';

import { useState, useEffect } from 'react';
import { Feedback } from '@/types/Feedback';
import { Area } from '@/types/Area';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';

interface AIAgentProps {
  feedbacks: Feedback[];
  areas: Area[];
  userSegment?: string;
  onClose: () => void;
}

interface AIAnalysis {
  areaId: string;
  areaName: string;
  totalFeedbacks: number;
  averageRating: number;
  topIssues: string[];
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export default function AIAgent({ feedbacks, areas, userSegment, onClose }: AIAgentProps) {
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Análise inteligente baseada no segmento do usuário
  const getSegmentInsights = (segment?: string) => {
    const insights = {
      'Varejo': {
        keywords: ['fila', 'espera', 'produto', 'estoque', 'preço', 'atendimento', 'limpeza'],
        commonIssues: ['Tempo de espera', 'Produtos fora de estoque', 'Preços altos', 'Atendimento ruim'],
        solutions: ['Sistema de senhas digitais', 'Gestão de estoque', 'Treinamento da equipe', 'Promoções estratégicas']
      },
      'Restaurante': {
        keywords: ['comida', 'sabor', 'temperatura', 'atendimento', 'limpeza', 'ambiente'],
        commonIssues: ['Tempo de preparo', 'Qualidade dos alimentos', 'Atendimento lento', 'Problemas de higiene'],
        solutions: ['Otimização da cozinha', 'Controle de qualidade', 'Treinamento da equipe', 'Protocolos de limpeza']
      },
      'Saúde': {
        keywords: ['atendimento', 'espera', 'médico', 'consulta', 'exame', 'limpeza'],
        commonIssues: ['Tempo de espera', 'Falta de comunicação', 'Problemas de agendamento', 'Ambiente inadequado'],
        solutions: ['Otimização de agenda', 'Sistema de triagem', 'Melhoria da comunicação', 'Humanização do atendimento']
      },
      'Educação': {
        keywords: ['professor', 'aula', 'material', 'infraestrutura', 'metodologia'],
        commonIssues: ['Qualidade do ensino', 'Problemas de infraestrutura', 'Falta de material', 'Metodologia inadequada'],
        solutions: ['Formação continuada', 'Investimento em infraestrutura', 'Metodologias ativas', 'Suporte personalizado']
      },
      'Serviços': {
        keywords: ['atendimento', 'qualidade', 'prazo', 'comunicação', 'profissionalismo'],
        commonIssues: ['Atrasos no serviço', 'Falta de comunicação', 'Qualidade inadequada', 'Falta de profissionalismo'],
        solutions: ['Prazos realistas', 'Comunicação clara', 'Controle de qualidade', 'Treinamento da equipe']
      }
    };

    return segment && insights[segment as keyof typeof insights] ? insights[segment as keyof typeof insights] : {
      keywords: ['atendimento', 'qualidade', 'satisfação', 'melhoria'],
      commonIssues: ['Satisfação do cliente', 'Qualidade do serviço', 'Atendimento ao cliente'],
      solutions: ['Análise de feedbacks', 'Implementação de melhorias', 'Monitoramento contínuo']
    };
  };

  // Analisar área específica
  const analyzeArea = async () => {
    if (!selectedArea) return;
    
    setLoading(true);
    
    // Simular processamento
    setTimeout(() => {
      const areaFeedbacks = feedbacks.filter(f => f.areaId === selectedArea);
      const area = areas.find(a => a.id === selectedArea);
      
      if (!area || areaFeedbacks.length === 0) {
        setAnalysis(null);
        setLoading(false);
        return;
      }

      const avgRating = areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / areaFeedbacks.length;
      const insights = getSegmentInsights(userSegment);
      
      // Análise inteligente baseada no conteúdo dos feedbacks
      const textAnalysis = areaFeedbacks.map(f => f.comment.toLowerCase()).join(' ');
      const topIssues: string[] = [];
      const recommendations: string[] = [];

      // Identificar problemas baseados em palavras-chave
      insights.keywords.forEach(keyword => {
        if (textAnalysis.includes(keyword)) {
          const matchingIssue = insights.commonIssues.find(issue => 
            issue.toLowerCase().includes(keyword)
          );
          if (matchingIssue && !topIssues.includes(matchingIssue)) {
            topIssues.push(matchingIssue);
          }
        }
      });

      // Se não encontrou problemas específicos, usar análise geral
      if (topIssues.length === 0) {
        if (avgRating <= 2) {
          topIssues.push('Satisfação muito baixa - investigação urgente necessária');
        } else if (avgRating <= 3) {
          topIssues.push('Oportunidade de melhoria significativa');
        } else {
          topIssues.push('Manter padrão de qualidade e buscar excelência');
        }
      }

      // Gerar recomendações baseadas nos problemas
      topIssues.forEach(issue => {
        const matchingSolution = insights.solutions.find(solution => 
          solution.toLowerCase().includes(issue.toLowerCase().split(' ')[0])
        );
        if (matchingSolution) {
          recommendations.push(matchingSolution);
        }
      });

      // Se não encontrou soluções específicas, usar soluções gerais
      while (recommendations.length < topIssues.length) {
        recommendations.push('Implementar melhorias específicas para o problema identificado');
      }

      // Determinar prioridade
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (avgRating <= 2 || topIssues.some(issue => issue.includes('urgente'))) {
        priority = 'high';
      } else if (avgRating >= 4 && topIssues.length === 0) {
        priority = 'low';
      }

      setAnalysis({
        areaId: area.id,
        areaName: area.name,
        totalFeedbacks: areaFeedbacks.length,
        averageRating: avgRating,
        topIssues,
        recommendations,
        priority
      });
      
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (selectedArea) {
      analyzeArea();
    } else {
      setAnalysis(null);
    }
  }, [selectedArea]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">🤖 Análise Inteligente de IA</h2>
              <p className="text-secondary">Análise focada e recomendações personalizadas</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Seletor de Área */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-600 mb-2">
              Selecione uma área para análise:
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="">Escolha uma área...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({feedbacks.filter(f => f.areaId === area.id).length} feedbacks)
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Analisando dados da área...</p>
            </div>
          )}

          {/* Análise */}
          {analysis && !loading && (
            <div className="space-y-6">
              {/* Resumo da Área */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-blue-600">{analysis.areaName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.priority === 'high' ? 'bg-red-100 text-red-800' :
                      analysis.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Prioridade {analysis.priority === 'high' ? 'Alta' : 
                                 analysis.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.totalFeedbacks}</div>
                      <div className="text-sm text-gray-600">Total de Feedbacks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.averageRating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Avaliação Média</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.topIssues.length}</div>
                      <div className="text-sm text-gray-600">Problemas Identificados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problemas Identificados */}
              <Card variant="elevated">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-blue-600">🚨 Problemas Identificados</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.topIssues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-gray-900">{issue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <Card variant="elevated">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-blue-600">💡 Recomendações de Melhoria</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-900">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights do Segmento */}
              {userSegment && (
                <Card variant="elevated">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-blue-600">🎯 Insights do Segmento: {userSegment}</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        Esta análise foi personalizada para o seu segmento de atuação, 
                        considerando as melhores práticas e desafios específicos da área.
                      </p>
                      <p>
                        Recomendamos implementar as melhorias sugeridas de forma gradual, 
                        monitorando os resultados para otimizar continuamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Sem área selecionada */}
          {!selectedArea && !loading && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">
                Selecione uma área para análise
              </h3>
              <p className="text-gray-600">
                Escolha uma área específica para receber análises inteligentes e recomendações personalizadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 