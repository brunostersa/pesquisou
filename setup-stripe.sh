#!/bin/bash

echo "🚀 Configurando Stripe CLI para desenvolvimento local..."

# Verificar se o Stripe CLI está instalado
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI não encontrado. Instalando..."
    
    # Verificar se o Homebrew está instalado
    if command -v brew &> /dev/null; then
        echo "📦 Instalando via Homebrew..."
        brew install stripe/stripe-cli/stripe
    else
        echo "⚠️  Homebrew não encontrado. Por favor, instale o Stripe CLI manualmente:"
        echo "   https://github.com/stripe/stripe-cli/releases"
        exit 1
    fi
else
    echo "✅ Stripe CLI já está instalado"
fi

# Fazer login no Stripe
echo "🔐 Fazendo login no Stripe..."
stripe login

# Iniciar o listener
echo "🎧 Iniciando listener para webhooks..."
echo "   URL: http://localhost:3000/api/webhook"
echo ""
echo "📋 Copie o webhook secret que aparecerá abaixo e adicione ao .env.local"
echo "   Exemplo: STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef..."
echo ""
echo "🔄 Para parar o listener, pressione Ctrl+C"
echo ""

stripe listen --forward-to localhost:3000/api/webhook 