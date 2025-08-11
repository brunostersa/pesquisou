import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, userId } = await request.json();

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Subscription ID e User ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Cancelar assinatura no Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Atualizar dados no Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: 'canceled',
      planUpdatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura cancelada com sucesso',
      subscription: subscription
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
