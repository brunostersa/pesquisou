import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando sincronização em lote de todos os usuários...');

    // 1. Buscar todos os usuários no Firestore
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário encontrado para sincronizar',
        totalUsers: 0,
        results: []
      });
    }

    console.log(`📊 Total de usuários encontrados: ${querySnapshot.size}`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // 2. Processar cada usuário
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        console.log(`\n🔍 Processando usuário: ${userId} (${userData.name || 'Sem nome'})`);
        
        // 3. Buscar customer no Stripe
        let stripeCustomer: Stripe.Customer | null = null;
        let stripeSubscriptions: Stripe.Subscription[] = [];

        // Tentar buscar por customerId existente
        if (userData.stripeCustomerId) {
          try {
            const customerResponse = await stripe.customers.retrieve(userData.stripeCustomerId as string);
            if (!customerResponse.deleted) {
              stripeCustomer = customerResponse;
              console.log(`  💳 Customer encontrado por ID: ${stripeCustomer.id}`);
            }
          } catch (error) {
            console.log(`  ❌ Customer não encontrado por ID: ${userData.stripeCustomerId}`);
          }
        }

        // Se não encontrou, tentar por email
        if (!stripeCustomer && userData.email && userData.email !== '') {
          try {
            const customers = await stripe.customers.list({
              email: userData.email,
              limit: 1
            });

            if (customers.data.length > 0 && !customers.data[0].deleted) {
              stripeCustomer = customers.data[0];
              console.log(`  🔍 Customer encontrado por email: ${stripeCustomer.id}`);
            }
          } catch (error) {
            console.log(`  ❌ Erro ao buscar por email: ${userData.email}`);
          }
        }

        // 4. Buscar assinaturas se encontrou customer
        if (stripeCustomer) {
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: stripeCustomer.id,
              limit: 100
            });
            stripeSubscriptions = subscriptions.data;
            console.log(`  📋 Assinaturas encontradas: ${stripeSubscriptions.length}`);
          } catch (error) {
            console.log(`  ❌ Erro ao buscar assinaturas`);
          }
        }

        // 5. Determinar status atual
        let activeSubscription = null;
        let subscriptionStatus = 'canceled';
        let plan = 'free';

        if (stripeSubscriptions.length > 0) {
          activeSubscription = stripeSubscriptions
            .filter(sub => ['active', 'trialing', 'past_due'].includes(sub.status))
            .sort((a, b) => b.created - a.created)[0];

          if (activeSubscription) {
            subscriptionStatus = activeSubscription.status;
            plan = activeSubscription.items.data[0]?.price?.metadata?.plan || 'starter';
            console.log(`  ✅ Assinatura ativa: ${plan} (${subscriptionStatus})`);
          } else {
            console.log(`  ❌ Nenhuma assinatura ativa`);
          }
        }

        // 6. Verificar se precisa atualizar
        const needsUpdate = 
          userData.plan !== plan ||
          userData.subscriptionStatus !== subscriptionStatus ||
          userData.stripeCustomerId !== (stripeCustomer?.id || null) ||
          userData.subscriptionId !== (activeSubscription?.id || null) ||
          (stripeCustomer?.email && (!userData.email || userData.email === ''));

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

          // Corrigir email vazio se encontrou no Stripe
          if (stripeCustomer?.email && (!userData.email || userData.email === '')) {
            updateData.email = stripeCustomer.email;
            console.log(`  📧 Email corrigido: ${stripeCustomer.email}`);
          }

          await updateDoc(doc(db, 'users', userId), updateData);
          console.log(`  ✅ Usuário atualizado com sucesso`);

          results.push({
            userId,
            name: userData.name || 'Sem nome',
            email: userData.email || 'VAZIO',
            status: 'updated',
            previousData: {
              plan: userData.plan,
              subscriptionStatus: userData.subscriptionStatus,
              stripeCustomerId: userData.stripeCustomerId,
              subscriptionId: userData.subscriptionId
            },
            newData: updateData
          });

          successCount++;
        } else {
          console.log(`  ✅ Dados já sincronizados`);
          results.push({
            userId,
            name: userData.name || 'Sem nome',
            email: userData.email || 'VAZIO',
            status: 'already_synced',
            currentData: {
              plan: userData.plan,
              subscriptionStatus: userData.subscriptionStatus,
              stripeCustomerId: userData.stripeCustomerId,
              subscriptionId: userData.subscriptionId
            }
          });
          successCount++;
        }

      } catch (error) {
        console.error(`  ❌ Erro ao processar usuário ${userId}:`, error);
        results.push({
          userId,
          name: userData.name || 'Sem nome',
          email: userData.email || 'VAZIO',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    console.log(`\n🎉 Sincronização em lote concluída!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${querySnapshot.size}`);

    return NextResponse.json({
      success: true,
      message: 'Sincronização em lote concluída',
      summary: {
        totalUsers: querySnapshot.size,
        successCount,
        errorCount,
        updatedCount: results.filter(r => r.status === 'updated').length,
        alreadySyncedCount: results.filter(r => r.status === 'already_synced').length
      },
      results
    });

  } catch (error) {
    console.error('❌ Erro na sincronização em lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
