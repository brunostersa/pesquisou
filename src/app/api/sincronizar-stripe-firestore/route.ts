import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔍 Iniciando sincronização para: ${email}`);

    // 1. Buscar usuário no Firestore por email
    let usersRef = collection(db, 'users');
    let q = query(usersRef, where('email', '==', email));
    let querySnapshot = await getDocs(q);

    // 2. Se não encontrou por email, tentar buscar por email vazio (usuários Google OAuth)
    if (querySnapshot.empty) {
      console.log('📧 Usuário não encontrado por email, tentando buscar por email vazio...');
      q = query(usersRef, where('email', '==', ''));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('🔍 Usuários com email vazio encontrados:', querySnapshot.size);
        
        // Filtrar pelo nome ou outros campos para identificar o usuário correto
        const userDocs = querySnapshot.docs;
        const targetUser = userDocs.find(doc => {
          const data = doc.data();
          // Verificar se é o usuário correto por nome ou outros campos
          return data.name === 'Bruno Stersa' || 
                 data.company === 'CustomerHub' || 
                 data.uid === 'I7EWkvmSUagpFaNbvVic93Bwsdl2';
        });
        
        if (targetUser) {
          console.log('✅ Usuário encontrado por outros campos:', targetUser.id);
          querySnapshot = { docs: [targetUser], empty: false } as any;
        } else {
          console.log('❌ Usuário não encontrado mesmo com email vazio');
        }
      }
    }

    // 3. Se ainda não encontrou, tentar buscar por UID específico (fallback)
    if (querySnapshot.empty) {
      console.log('🆔 Tentando buscar por UID específico...');
      const uid = 'I7EWkvmSUagpFaNbvVic93Bwsdl2';
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log('✅ Usuário encontrado por UID:', uid);
        querySnapshot = { docs: [userSnap], empty: false } as any;
      } else {
        console.log('❌ Usuário não encontrado por UID');
      }
    }

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no Firestore' },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('📊 Dados atuais no Firestore:', {
      userId,
      email: userData.email || 'VAZIO (Google OAuth)',
      name: userData.name,
      company: userData.company,
      plan: userData.plan,
      subscriptionStatus: userData.subscriptionStatus,
      stripeCustomerId: userData.stripeCustomerId,
      subscriptionId: userData.subscriptionId
    });

    // 4. Buscar customer no Stripe
    let stripeCustomer: Stripe.Customer | null = null;
    let stripeSubscriptions: Stripe.Subscription[] = [];

    if (userData.stripeCustomerId) {
      try {
        const customerResponse = await stripe.customers.retrieve(userData.stripeCustomerId as string);
        
        // Verificar se o customer não foi deletado
        if (customerResponse.deleted) {
          console.log('❌ Customer foi deletado no Stripe');
        } else {
          stripeCustomer = customerResponse;
          console.log('💳 Customer encontrado no Stripe:', {
            id: stripeCustomer.id,
            email: stripeCustomer.email,
            created: stripeCustomer.created
          });

          // Buscar assinaturas do customer
          const subscriptions = await stripe.subscriptions.list({
            customer: userData.stripeCustomerId as string,
            limit: 100
          });

          stripeSubscriptions = subscriptions.data;
          console.log('📋 Assinaturas encontradas no Stripe:', stripeSubscriptions.length);
        }

      } catch (error) {
        console.error('❌ Erro ao buscar customer no Stripe:', error);
      }
    }

    // 5. Buscar por email no Stripe (fallback)
    if (!stripeCustomer && !userData.stripeCustomerId) {
      try {
        const customers = await stripe.customers.list({
          email: email,
          limit: 1
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          if (!customer.deleted) {
            stripeCustomer = customer;
            console.log('🔍 Customer encontrado por email no Stripe:', {
              id: stripeCustomer.id,
              email: stripeCustomer.email
            });

            // Buscar assinaturas
            const subscriptions = await stripe.subscriptions.list({
              customer: stripeCustomer.id,
              limit: 100
            });

            stripeSubscriptions = subscriptions.data;
            console.log('📋 Assinaturas encontradas por email:', stripeSubscriptions.length);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar customer por email no Stripe:', error);
      }
    }

    // 6. Analisar status das assinaturas
    let activeSubscription = null;
    let subscriptionStatus = 'canceled';
    let plan = 'free';

    if (stripeSubscriptions.length > 0) {
      // Encontrar assinatura ativa mais recente
      activeSubscription = stripeSubscriptions
        .filter(sub => ['active', 'trialing', 'past_due'].includes(sub.status))
        .sort((a, b) => b.created - a.created)[0];

      if (activeSubscription) {
        subscriptionStatus = activeSubscription.status;
        plan = activeSubscription.items.data[0]?.price?.metadata?.plan || 'starter';
        console.log('✅ Assinatura ativa encontrada:', {
          id: activeSubscription.id,
          status: activeSubscription.status,
          plan: plan
        });
      } else {
        console.log('❌ Nenhuma assinatura ativa encontrada');
      }
    }

    // 7. Comparar e atualizar se necessário
    const needsUpdate = 
      userData.plan !== plan ||
      userData.subscriptionStatus !== subscriptionStatus ||
      userData.stripeCustomerId !== (stripeCustomer?.id || null) ||
      userData.subscriptionId !== (activeSubscription?.id || null);

    console.log('🔄 Comparação:', {
      firestorePlan: userData.plan,
      stripePlan: plan,
      firestoreStatus: userData.subscriptionStatus,
      stripeStatus: subscriptionStatus,
      needsUpdate
    });

    if (needsUpdate) {
      // Atualizar Firestore
      const updateData: any = {
        plan: plan,
        subscriptionStatus: subscriptionStatus,
        planUpdatedAt: new Date(),
        subscriptionUpdatedAt: new Date()
      };

      if (stripeCustomer?.id) {
        updateData.stripeCustomerId = stripeCustomer.id;
      }

      if (activeSubscription?.id) {
        updateData.subscriptionId = activeSubscription.id;
      }

      // Corrigir o email vazio se encontrou no Stripe
      if (stripeCustomer?.email && (!userData.email || userData.email === '')) {
        updateData.email = stripeCustomer.email;
        console.log('📧 Email corrigido de vazio para:', stripeCustomer.email);
      }

      await updateDoc(doc(db, 'users', userId), updateData);

      console.log('✅ Firestore atualizado com sucesso:', updateData);

      return NextResponse.json({
        success: true,
        message: 'Dados sincronizados com sucesso',
        previousData: {
          plan: userData.plan,
          subscriptionStatus: userData.subscriptionStatus,
          stripeCustomerId: userData.stripeCustomerId,
          subscriptionId: userData.subscriptionId,
          email: userData.email || 'VAZIO'
        },
        newData: updateData,
        stripeData: {
          customer: stripeCustomer ? {
            id: stripeCustomer.id,
            email: stripeCustomer.email
          } : null,
          subscriptions: stripeSubscriptions.map(sub => ({
            id: sub.id,
            status: sub.status,
            plan: sub.items.data[0]?.price?.metadata?.plan || 'unknown'
          }))
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Dados já estão sincronizados',
        currentData: {
          plan: userData.plan,
          subscriptionStatus: userData.subscriptionStatus,
          stripeCustomerId: userData.stripeCustomerId,
          subscriptionId: userData.subscriptionId,
          email: userData.email || 'VAZIO'
        },
        stripeData: {
          customer: stripeCustomer ? {
            id: stripeCustomer.id,
            email: stripeCustomer.email
          } : null,
          subscriptions: stripeSubscriptions.map(sub => ({
            id: sub.id,
            status: sub.status,
            plan: sub.items.data[0]?.price?.metadata?.plan || 'unknown'
          }))
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
