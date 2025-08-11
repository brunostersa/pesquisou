export interface AIAnalysis {
  id: string;
  feedbackId: string;
  areaId: string;
  analysis: string;
  problems: string[];
  solutions: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: 'high' | 'medium' | 'low';
  estimatedEffort: 'high' | 'medium' | 'low';
  segment: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'immediate' | 'soon' | 'later';
  businessImpact: string;
  customerSatisfaction: number; // 0-100
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  feedbackIds: string[];
  analysisIds: string[];
  estimatedEffort: string;
  estimatedImpact: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  tips: string[];
  priority: 'high' | 'medium' | 'low';
  category: string;
  segment: string;
  relatedFeedbacks: string[];
  estimatedImpact: string;
  estimatedEffort: string;
  businessValue: string;
  implementationSteps: string[];
  successMetrics: string[];
  createdAt: Date;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  actions: ActionItem[];
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

// Novo: Agente Específico por Segmento
export interface SegmentAgent {
  id: string;
  segment: string;
  name: string;
  description: string;
  expertise: string[];
  keywords: string[];
  commonProblems: string[];
  bestPractices: string[];
  metrics: string[];
  recommendations: string[];
}

// Novo: Análise de Tendências
export interface TrendAnalysis {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  trends: {
    satisfaction: number;
    complaints: number;
    suggestions: number;
    topIssues: string[];
    improvements: string[];
  };
  predictions: {
    nextWeek: string[];
    nextMonth: string[];
    recommendations: string[];
  };
}

// Novo: Relatório de Performance
export interface PerformanceReport {
  id: string;
  period: string;
  metrics: {
    totalFeedbacks: number;
    averageRating: number;
    satisfactionScore: number;
    responseRate: number;
    improvementRate: number;
  };
  insights: string[];
  recommendations: string[];
  nextActions: string[];
  createdAt: Date;
} 