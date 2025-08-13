'use client';

import { useState } from 'react';

export default function SyncStripePage() {
  const [email, setEmail] = useState('bruno.stersa@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/sincronizar-stripe-firestore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erro na sincronização');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔄 Sincronização Stripe ↔ Firestore
          </h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email do usuário
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o email do usuário"
              />
            </div>

            <button
              onClick={handleSync}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Sincronizando...' : '🔄 Sincronizar Dados'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro na Sincronização</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  {result.message}
                </h3>
                
                <div className="space-y-4">
                  {/* Dados Anteriores */}
                  {result.previousData && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">📊 Dados Anteriores (Firestore)</h4>
                      <div className="bg-white rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Plano:</strong> {result.previousData.plan || 'N/A'}</div>
                          <div><strong>Status:</strong> {result.previousData.subscriptionStatus || 'N/A'}</div>
                          <div><strong>Customer ID:</strong> {result.previousData.stripeCustomerId || 'N/A'}</div>
                          <div><strong>Subscription ID:</strong> {result.previousData.subscriptionId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dados Atuais */}
                  {result.currentData && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">📊 Dados Atuais (Firestore)</h4>
                      <div className="bg-white rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Plano:</strong> {result.currentData.plan || 'N/A'}</div>
                          <div><strong>Status:</strong> {result.currentData.subscriptionStatus || 'N/A'}</div>
                          <div><strong>Customer ID:</strong> {result.currentData.stripeCustomerId || 'N/A'}</div>
                          <div><strong>Subscription ID:</strong> {result.currentData.subscriptionId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dados Novos */}
                  {result.newData && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">🆕 Dados Novos (Atualizados)</h4>
                      <div className="bg-white rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Plano:</strong> {result.newData.plan || 'N/A'}</div>
                          <div><strong>Status:</strong> {result.newData.subscriptionStatus || 'N/A'}</div>
                          <div><strong>Customer ID:</strong> {result.newData.stripeCustomerId || 'N/A'}</div>
                          <div><strong>Subscription ID:</strong> {result.newData.subscriptionId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dados do Stripe */}
                  {result.stripeData && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">💳 Dados do Stripe</h4>
                      <div className="bg-white rounded p-3 text-sm">
                        {result.stripeData.customer ? (
                          <div className="mb-3">
                            <div><strong>Customer ID:</strong> {result.stripeData.customer.id}</div>
                            <div><strong>Email:</strong> {result.stripeData.customer.email}</div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Nenhum customer encontrado</div>
                        )}
                        
                        {result.stripeData.subscriptions && result.stripeData.subscriptions.length > 0 ? (
                          <div>
                            <div className="font-medium mb-2">Assinaturas:</div>
                            {result.stripeData.subscriptions.map((sub: any, index: number) => (
                              <div key={index} className="border-t pt-2 mt-2">
                                <div><strong>ID:</strong> {sub.id}</div>
                                <div><strong>Status:</strong> {sub.status}</div>
                                <div><strong>Plano:</strong> {sub.plan}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500">Nenhuma assinatura encontrada</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">📋 Como Funciona</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>1. <strong>Busca no Firestore:</strong> Localiza o usuário pelo email</p>
            <p>2. <strong>Verifica no Stripe:</strong> Busca customer e assinaturas</p>
            <p>3. <strong>Compara dados:</strong> Identifica discrepâncias</p>
            <p>4. <strong>Sincroniza:</strong> Atualiza Firestore com dados corretos do Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
