'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Feedback } from '@/types/Feedback';

interface FeedbackListProps {
  feedbacks?: Feedback[];
  areaId?: string;
  showAreaName?: boolean;
}

export default function FeedbackList({ feedbacks: propFeedbacks, areaId, showAreaName = true }: FeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se feedbacks foram passados como prop, usar eles
    if (propFeedbacks) {
      setFeedbacks(propFeedbacks);
      setLoading(false);
      return;
    }

    // Se não, carregar do Firebase usando areaId
    if (!areaId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'feedbacks'),
      where('areaId', '==', areaId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbacksData: Feedback[] = [];
      querySnapshot.forEach((doc) => {
        feedbacksData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Feedback);
      });
      setFeedbacks(feedbacksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [areaId, propFeedbacks]);

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma opinião recebida ainda.</p>
        <p className="text-sm">Compartilhe o QR Code para começar a receber opiniões!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Opiniões ({feedbacks.length})
      </h3>
      <div className="space-y-3">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500 text-lg">
                  {getRatingStars(feedback.rating)}
                </span>
                <span className="text-sm text-gray-600">
                  ({feedback.rating}/5)
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(feedback.createdAt)}
              </span>
            </div>
            <p className="text-gray-800">{feedback.comment}</p>
            {feedback.isAnonymous && (
              <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Anônimo
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
