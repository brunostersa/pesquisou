'use client';

import { useState, useEffect } from 'react';
import { KnowledgeItem, KnowledgeSegment } from '@/types/Knowledge';
import Card, { CardHeader, CardContent } from '@/components/Card';

// Dados da base de conhecimento
const knowledgeData: KnowledgeSegment[] = [
  {
    id: 'varejo',
    name: 'Varejo',
    description: 'Lojas físicas e e-commerce',
    icon: '🛍️',
    color: 'bg-blue-500',
    items: [
      {
        id: '1',
        title: 'Filas e Tempo de Espera',
        description: 'Problema comum em períodos de pico',
        problem: 'Clientes reclamam de filas longas e demora no atendimento, especialmente em horários de pico e promoções.',
        solution: 'Implementar sistema de senhas digitais, aumentar equipe em horários de pico, e otimizar processos de pagamento.',
        tips: [
          'Instale totens de autoatendimento',
          'Treine equipe para atendimento rápido',
          'Monitore horários de pico',
          'Ofereça opções de pagamento digital'
        ],
        segment: 'Varejo',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Falta de Produtos',
        description: 'Estoque insuficiente',
        problem: 'Produtos populares ficam fora de estoque rapidamente, causando frustração nos clientes.',
        solution: 'Implementar sistema de gestão de estoque em tempo real e previsão de demanda.',
        tips: [
          'Use sistema de alerta de estoque baixo',
          'Analise histórico de vendas',
          'Mantenha fornecedores alternativos',
          'Comunique disponibilidade aos clientes'
        ],
        segment: 'Varejo',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Atendimento Impessoal',
        description: 'Falta de conexão com o cliente',
        problem: 'Funcionários não criam conexão emocional com os clientes, resultando em experiência fria.',
        solution: 'Treinar equipe em técnicas de vendas consultivas e relacionamento com cliente.',
        tips: [
          'Treine equipe em comunicação',
          'Incentive abordagem personalizada',
          'Reconheça clientes recorrentes',
          'Crie programa de fidelidade'
        ],
        segment: 'Varejo',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    description: 'Bares, restaurantes e delivery',
    icon: '🍽️',
    color: 'bg-orange-500',
    items: [
      {
        id: '4',
        title: 'Tempo de Preparo',
        description: 'Demora na entrega dos pratos',
        problem: 'Clientes reclamam do tempo de espera entre pedido e entrega, especialmente em horários de pico.',
        solution: 'Otimizar processos na cozinha, treinar equipe e implementar sistema de gestão de pedidos.',
        tips: [
          'Organize cozinha por fluxo de trabalho',
          'Treine equipe em eficiência',
          'Use sistema de gestão de pedidos',
          'Comunique tempo de espera'
        ],
        segment: 'Restaurante',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        title: 'Qualidade Inconsistente',
        description: 'Variação na qualidade dos pratos',
        problem: 'Mesmo prato tem qualidade diferente dependendo de quem prepara ou do dia.',
        solution: 'Padronizar receitas, treinar equipe e implementar controle de qualidade.',
        tips: [
          'Padronize receitas e processos',
          'Treine equipe constantemente',
          'Implemente controle de qualidade',
          'Use ingredientes consistentes'
        ],
        segment: 'Restaurante',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '6',
        title: 'Limpeza e Higiene',
        description: 'Ambiente e utensílios',
        problem: 'Clientes notam problemas de limpeza no ambiente, banheiros ou utensílios.',
        solution: 'Implementar protocolos rigorosos de limpeza e treinar equipe em higiene.',
        tips: [
          'Crie checklist de limpeza',
          'Treine equipe em higiene',
          'Inspecione regularmente',
          'Mantenha estoque de produtos'
        ],
        segment: 'Restaurante',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'saude',
    name: 'Saúde',
    description: 'Clínicas, hospitais e consultórios',
    icon: '🏥',
    color: 'bg-green-500',
    items: [
      {
        id: '7',
        title: 'Tempo de Espera',
        description: 'Demora para atendimento médico',
        problem: 'Pacientes reclamam de longas esperas para consultas e exames.',
        solution: 'Otimizar agenda, implementar triagem eficiente e comunicar horários.',
        tips: [
          'Otimize agenda de consultas',
          'Implemente triagem eficiente',
          'Comunique atrasos',
          'Ofereça agendamento online'
        ],
        segment: 'Saúde',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '8',
        title: 'Falta de Humanização',
        description: 'Atendimento muito técnico',
        problem: 'Profissionais focam apenas no aspecto técnico, esquecendo o lado humano.',
        solution: 'Treinar equipe em comunicação empática e humanização do atendimento.',
        tips: [
          'Treine equipe em empatia',
          'Use linguagem acessível',
          'Demonstre interesse pessoal',
          'Explique procedimentos claramente'
        ],
        segment: 'Saúde',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '9',
        title: 'Falta de Informação',
        description: 'Pacientes mal informados',
        problem: 'Pacientes não recebem informações claras sobre tratamentos e procedimentos.',
        solution: 'Implementar protocolos de comunicação e material educativo.',
        tips: [
          'Crie material educativo',
          'Explique procedimentos',
          'Ofereça segunda opinião',
          'Mantenha comunicação clara'
        ],
        segment: 'Saúde',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'educacao',
    name: 'Educação',
    description: 'Escolas, cursos e treinamentos',
    icon: '🎓',
    color: 'bg-purple-500',
    items: [
      {
        id: '10',
        title: 'Falta de Individualização',
        description: 'Ensino padronizado demais',
        problem: 'Metodologia não considera as diferenças individuais dos alunos.',
        solution: 'Implementar ensino personalizado e metodologias adaptativas.',
        tips: [
          'Use metodologias adaptativas',
          'Ofereça suporte individual',
          'Avalie progresso personalizado',
          'Adapte conteúdo por aluno'
        ],
        segment: 'Educação',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '11',
        title: 'Falta de Feedback',
        description: 'Alunos não sabem como estão',
        problem: 'Alunos não recebem feedback claro sobre seu progresso e desenvolvimento.',
        solution: 'Implementar sistema de avaliação contínua e feedback regular.',
        tips: [
          'Implemente avaliação contínua',
          'Ofereça feedback regular',
          'Crie relatórios de progresso',
          'Mantenha comunicação com pais'
        ],
        segment: 'Educação',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '12',
        title: 'Infraestrutura Limitada',
        description: 'Recursos insuficientes',
        problem: 'Falta de recursos tecnológicos e infraestrutura adequada para o ensino.',
        solution: 'Investir em tecnologia educacional e melhorar infraestrutura.',
        tips: [
          'Invista em tecnologia educacional',
          'Melhore infraestrutura',
          'Ofereça recursos digitais',
          'Mantenha equipamentos atualizados'
        ],
        segment: 'Educação',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'servicos',
    name: 'Serviços',
    description: 'Consultorias e serviços profissionais',
    icon: '💼',
    color: 'bg-gray-500',
    items: [
      {
        id: '13',
        title: 'Falta de Transparência',
        description: 'Preços e processos não claros',
        problem: 'Clientes não entendem claramente os preços, processos e prazos dos serviços.',
        solution: 'Implementar comunicação transparente sobre preços, processos e prazos.',
        tips: [
          'Seja transparente com preços',
          'Explique processos claramente',
          'Defina prazos realistas',
          'Ofereça contratos claros'
        ],
        segment: 'Serviços',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '14',
        title: 'Falta de Resultados',
        description: 'Promessas não cumpridas',
        problem: 'Serviços não entregam os resultados prometidos ou esperados.',
        solution: 'Estabelecer expectativas realistas e acompanhar resultados.',
        tips: [
          'Estabeleça expectativas realistas',
          'Acompanhe resultados',
          'Ofereça garantias',
          'Comunique progresso'
        ],
        segment: 'Serviços',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '15',
        title: 'Falta de Comunicação',
        description: 'Cliente mal informado',
        problem: 'Falta de comunicação regular sobre o progresso e status dos serviços.',
        solution: 'Implementar sistema de comunicação regular e relatórios de progresso.',
        tips: [
          'Comunique regularmente',
          'Ofereça relatórios de progresso',
          'Responda rapidamente',
          'Use múltiplos canais'
        ],
        segment: 'Serviços',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Startups e empresas de TI',
    icon: '💻',
    color: 'bg-indigo-500',
    items: [
      {
        id: '16',
        title: 'Complexidade Excessiva',
        description: 'Produtos difíceis de usar',
        problem: 'Produtos e serviços são muito complexos para o usuário final.',
        solution: 'Simplificar interfaces e processos, focando na experiência do usuário.',
        tips: [
          'Simplifique interfaces',
          'Teste com usuários reais',
          'Ofereça tutoriais',
          'Mantenha design intuitivo'
        ],
        segment: 'Tecnologia',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '17',
        title: 'Suporte Técnico',
        description: 'Atendimento inadequado',
        problem: 'Suporte técnico lento, ineficiente ou não resolve problemas.',
        solution: 'Melhorar qualidade do suporte técnico e implementar canais eficientes.',
        tips: [
          'Treine equipe de suporte',
          'Ofereça múltiplos canais',
          'Resolva problemas rapidamente',
          'Mantenha base de conhecimento'
        ],
        segment: 'Tecnologia',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '18',
        title: 'Falta de Documentação',
        description: 'Produtos mal documentados',
        problem: 'Produtos não possuem documentação clara ou tutorial adequado.',
        solution: 'Criar documentação completa e tutoriais interativos.',
        tips: [
          'Crie documentação completa',
          'Ofereça tutoriais interativos',
          'Mantenha documentação atualizada',
          'Use linguagem simples'
        ],
        segment: 'Tecnologia',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
];

interface KnowledgeBaseProps {
  userSegment?: string;
}

export default function KnowledgeBase({ userSegment }: KnowledgeBaseProps) {
  const [selectedSegment, setSelectedSegment] = useState<string>(userSegment || '');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSegments = knowledgeData.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.items.some(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const currentSegment = knowledgeData.find(seg => seg.id === selectedSegment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          📚 Base de Conhecimento
        </h1>
        <p className="text-secondary">
          Descubra os problemas mais frequentes do seu segmento e como resolvê-los
        </p>
      </div>

      {/* Busca */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          placeholder="Buscar por segmento ou problema..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-custom rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-color bg-card text-primary"
        />
      </div>

      {/* Segmentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSegments.map((segment) => (
          <Card
            key={segment.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedSegment === segment.id ? 'ring-2 ring-secondary-color' : ''
            }`}
            onClick={() => setSelectedSegment(segment.id)}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{segment.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {segment.name}
                  </h3>
                  <p className="text-sm text-secondary">
                    {segment.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary">
                {segment.items.length} problemas identificados
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detalhes do Segmento */}
      {currentSegment && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">
              {currentSegment.icon} {currentSegment.name}
            </h2>
            <p className="text-secondary">{currentSegment.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentSegment.items.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedItem?.id === item.id ? 'ring-2 ring-secondary-color' : ''
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-secondary mt-1">
                        {item.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority === 'high' ? 'Alta' : 
                       item.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes do Item */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary">
                  {selectedItem.title}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-secondary hover:text-primary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Problema */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    🚨 Problema Identificado
                  </h3>
                  <p className="text-secondary bg-red-50 p-4 rounded-lg">
                    {selectedItem.problem}
                  </p>
                </div>

                {/* Solução */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    ✅ Solução Recomendada
                  </h3>
                  <p className="text-secondary bg-green-50 p-4 rounded-lg">
                    {selectedItem.solution}
                  </p>
                </div>

                {/* Dicas */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    💡 Dicas Práticas
                  </h3>
                  <ul className="space-y-2">
                    {selectedItem.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-secondary-color mt-1">•</span>
                        <span className="text-secondary">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ações */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-custom">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 border border-custom rounded-lg text-primary hover:bg-tertiary transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      // Aqui você pode implementar ação para aplicar a solução
                      alert('Funcionalidade de aplicação da solução será implementada!');
                    }}
                    className="px-4 py-2 bg-secondary-color text-inverse rounded-lg hover:bg-secondary-hover transition-colors"
                  >
                    Aplicar Solução
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 