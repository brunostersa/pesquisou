'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FeedbackPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    // Teste de conectividade com Firestore
    const testFirestoreConnection = async () => {
      try {
      
        // Teste de conectividade concluído
      } catch (error) {
        console.error('❌ Erro na conectividade com Firestore:', error);
      }
    };
    
    testFirestoreConnection();
  }, [areaId, params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        areaId: areaId,
        rating,
        comment: comment.trim(),
        isAnonymous,
        createdAt: new Date(),
      };

              await addDoc(collection(db, 'feedbacks'), feedbackData);
      
      setSubmitted(true);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setError(`Erro ao enviar feedback: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-accent-color bg-opacity-20 mb-6">
              <svg className="h-10 w-10 text-accent-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Obrigado! 🎉
            </h1>
            <p className="text-white text-lg mb-6">
              Seu feedback foi enviado com sucesso!
            </p>
            <p className="text-white/90">
              Sua opinião é muito importante para melhorarmos nossos serviços.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <p className="text-sm text-secondary">
              Você pode fechar esta página agora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-secondary-color rounded-xl flex items-center justify-center mb-4">
            <span className="text-inverse font-bold text-2xl">P</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Pesquisou
          </h1>
          <p className="text-white/90 text-lg">
            Deixe seu feedback sobre esta área
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Como você avalia sua experiência? *
              </label>
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-all duration-200 transform hover:scale-110 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                {rating > 0 ? `${rating} estrela${rating > 1 ? 's' : ''}` : 'Selecione uma avaliação'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-3">
                Comentário (opcional)
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
                placeholder="Conte-nos mais sobre sua experiência..."
              />
            </div>

            {/* Anonymous */}
            <div className="flex items-center">
              <input
                id="anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-3 block text-sm text-gray-700">
                Enviar feedback anonimamente
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Feedback'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Feedback 100% anônimo</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Processo rápido e seguro</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Sua opinião é importante</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
