export interface Feedback {
  id: string;
  areaId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  isAnonymous: boolean;
}
