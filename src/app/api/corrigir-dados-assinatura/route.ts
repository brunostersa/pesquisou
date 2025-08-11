import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    console.log('Dados atuais do usuário:', userData);

    // Verificar se o usuário tem um plano pago
    if (userData.plan && userData.plan !== 'free') {
      // Se tem plano pago mas não tem subscriptionStatus, definir como 'active'
      if (!userData.subscriptionStatus || userData.subscriptionStatus === 'inactive') {
        await updateDoc(userRef, {
          subscriptionStatus: 'active',
          planUpdatedAt: new Date(),
        });

        console.log(`Status da assinatura corrigido para usuário ${userId}: active`);

        return NextResponse.json({
          success: true,
          message: 'Status da assinatura corrigido para Ativo',
          previousStatus: userData.subscriptionStatus || 'undefined',
          newStatus: 'active',
          plan: userData.plan
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Status da assinatura já está correto',
          currentStatus: userData.subscriptionStatus,
          plan: userData.plan
        });
      }
    } else {
      // Usuário com plano gratuito
      return NextResponse.json({
        success: true,
        message: 'Usuário com plano gratuito - status não aplicável',
        plan: userData.plan || 'free',
        subscriptionStatus: 'N/A'
      });
    }

  } catch (error) {
    console.error('Erro ao corrigir dados da assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
