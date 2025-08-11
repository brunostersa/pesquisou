import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do usuário
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    
    // Retornar todos os dados relevantes da assinatura
    return NextResponse.json({
      success: true,
      userData: {
        uid: userId,
        email: userData.email,
        plan: userData.plan || 'free',
        subscriptionStatus: userData.subscriptionStatus || 'undefined',
        planUpdatedAt: userData.planUpdatedAt?.toDate?.() || userData.planUpdatedAt || 'N/A',
        stripeCustomerId: userData.stripeCustomerId || 'N/A',
        subscriptionId: userData.subscriptionId || 'N/A',
        subscriptionUpdatedAt: userData.subscriptionUpdatedAt?.toDate?.() || userData.subscriptionUpdatedAt || 'N/A'
      },
      analysis: {
        hasPlan: !!userData.plan,
        isPaidPlan: userData.plan && userData.plan !== 'free',
        hasSubscriptionStatus: !!userData.subscriptionStatus,
        subscriptionStatusValue: userData.subscriptionStatus || 'undefined',
        needsFix: userData.plan && userData.plan !== 'free' && (!userData.subscriptionStatus || userData.subscriptionStatus === 'inactive')
      }
    });

  } catch (error) {
    console.error('Erro ao verificar dados da assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
