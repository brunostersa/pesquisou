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