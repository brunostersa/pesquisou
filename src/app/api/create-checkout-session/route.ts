import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, userEmail } = await request.json();

    // Definir preços dos planos
    const planPrices = {
      starter: {
        price: 2900, // R$ 29,00 em centavos
        name: 'Starter',
        description: 'Plano Starter - Ideal para pequenas empresas'
      },
      professional: {
        price: 7900, // R$ 79,00 em centavos
        name: 'Professional',
        description: 'Plano Professional - Para empresas em crescimento'
      }
    };

    const selectedPlan = planPrices[plan as keyof typeof planPrices];
    
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    // Criar produto no Stripe
    let product;
    try {
      // Tentar encontrar produto existente
      const products = await stripe.products.list({ limit: 100 });
      product = products.data.find(p => p.name === selectedPlan.name);
      
      if (!product) {
        // Criar novo produto
        product = await stripe.products.create({
          name: selectedPlan.name,
          description: selectedPlan.description,
        });
      }
    } catch (error) {
      console.error('Erro ao criar/encontrar produto:', error);
      return NextResponse.json(
        { error: 'Erro ao configurar produto' },
        { status: 500 }
      );
    }

    // Criar preço no Stripe
    let price;
    try {
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 100 
      });
      
      price = prices.data.find(p => 
        p.unit_amount === selectedPlan.price && 
        p.currency === 'brl' &&
        p.recurring?.interval === 'month'
      );
      
      if (!price) {
        // Criar novo preço
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: selectedPlan.price,
          currency: 'brl',
          recurring: {
            interval: 'month',
          },
        });
      }
    } catch (error) {
      console.error('Erro ao criar/encontrar preço:', error);
      return NextResponse.json(
        { error: 'Erro ao configurar preço' },
        { status: 500 }
      );
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/planos`,
      customer_email: userEmail,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 