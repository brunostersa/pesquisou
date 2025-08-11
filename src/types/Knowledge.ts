export interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  tips: string[];
  segment: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSegment {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  items: KnowledgeItem[];
} 