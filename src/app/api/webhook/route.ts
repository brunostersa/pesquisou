import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error('Erro na verificação do webhook:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Webhook: checkout.session.completed recebido');
        console.log('Session metadata:', session.metadata);
        console.log('Session customer:', session.customer);
        console.log('Session subscription:', session.subscription);
        
        // Atualizar plano do usuário no Firestore
        if (session.metadata?.userId && session.metadata?.plan) {
          const userRef = doc(db, 'users', session.metadata.userId);
          const updateData: any = {
            plan: session.metadata.plan,
            stripeCustomerId: session.customer,
            subscriptionStatus: 'active',
            planUpdatedAt: new Date(),
          };
          
          // Adicionar subscriptionId se existir
          if (session.subscription) {
            updateData.subscriptionId = session.subscription;
          }
          
          await updateDoc(userRef, updateData);
          
          console.log(`Plano atualizado para usuário ${session.metadata.userId}: ${session.metadata.plan}`);
          console.log('Dados atualizados:', updateData);
        } else {
          console.log('Metadata não encontrada ou incompleta:', session.metadata);
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        
        // Buscar usuário pelo customerId ou subscriptionId
        let userId = null;
        
        // Primeiro, tentar buscar pelo customerId
        if (subscription.customer) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('stripeCustomerId', '==', subscription.customer));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            userId = querySnapshot.docs[0].id;
          }
        }
        
        // Se não encontrou pelo customerId, tentar pelo subscriptionId
        if (!userId && subscription.id) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('subscriptionId', '==', subscription.id));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            userId = querySnapshot.docs[0].id;
          }
        }
        
        if (userId) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            subscriptionStatus: subscription.status,
            subscriptionUpdatedAt: new Date(),
          });
          
          console.log(`Status da assinatura atualizado para usuário ${userId}: ${subscription.status}`);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Buscar usuário pelo customerId ou subscriptionId
        let deletedUserId = null;
        
        if (deletedSubscription.customer) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('stripeCustomerId', '==', deletedSubscription.customer));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            deletedUserId = querySnapshot.docs[0].id;
          }
        }
        
        if (!deletedUserId && deletedSubscription.id) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('subscriptionId', '==', deletedSubscription.id));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            deletedUserId = querySnapshot.docs[0].id;
          }
        }
        
        if (deletedUserId) {
          const userRef = doc(db, 'users', deletedUserId);
          await updateDoc(userRef, {
            plan: 'free',
            subscriptionStatus: 'canceled',
            planUpdatedAt: new Date(),
          });
          
          console.log(`Assinatura cancelada para usuário ${deletedUserId}`);
        }
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 