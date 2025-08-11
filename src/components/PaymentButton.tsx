'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import stripePromise from '@/lib/stripe';

interface PaymentButtonProps {
  plan: 'starter' | 'professional';
  price: string;
  features: string[];
  popular?: boolean;
}

export default function PaymentButton({ plan, price, features, popular = false }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handlePayment = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      // Criar sessão de checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirecionar para checkout do Stripe
      const stripe = await stripePromise;
      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative p-6 bg-white rounded-lg shadow-lg border-2 ${popular ? 'border-blue-500' : 'border-gray-200'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Mais Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan === 'starter' ? 'Starter' : 'Professional'}
        </h3>
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {price}
          <span className="text-lg font-normal text-gray-600">/mês</span>
        </div>
        <p className="text-gray-600">
          {plan === 'starter' 
            ? 'Ideal para pequenas empresas' 
            : 'Para empresas em crescimento'
          }
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePayment}
        disabled={loading}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-colors
          ${popular 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
            Processando...
          </div>
        ) : (
          'Começar Agora'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Cancelamento a qualquer momento • Sem taxa de setup
      </p>
    </div>
  );
} 