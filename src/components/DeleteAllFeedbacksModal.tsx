'use client';

import { useState } from 'react';

interface DeleteAllFeedbacksModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  totalFeedbacks: number;
}

export default function DeleteAllFeedbacksModal({ onClose, onConfirm, totalFeedbacks }: DeleteAllFeedbacksModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (confirmationText !== 'EXCLUIR TODOS') {
      setError('Digite "EXCLUIR TODOS" para confirmar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir opiniões:', error);
      setError('Erro ao excluir opiniões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-red-600">⚠️ Excluir Todas as Avaliações</h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-red-800">Ação Irreversível</span>
              </div>
              <p className="text-red-700 text-sm">
                Esta ação irá excluir permanentemente <strong>{totalFeedbacks} avaliação{totalFeedbacks !== 1 ? 'ões' : ''}</strong> de todas as suas áreas.
              </p>
            </div>

            <p className="text-primary text-sm mb-4">
              Para confirmar esta ação, digite <strong>EXCLUIR TODOS</strong> no campo abaixo:
            </p>

            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite: EXCLUIR TODOS"
              className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-card text-primary"
              disabled={loading}
            />

            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-custom rounded-md text-primary hover:bg-tertiary transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || confirmationText !== 'EXCLUIR TODOS'}
            >
              {loading ? 'Excluindo...' : 'Excluir Todos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 