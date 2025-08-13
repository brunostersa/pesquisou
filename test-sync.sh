#!/bin/bash

# Script de teste para sincronização manual
echo "🧪 Testando sincronização Stripe ↔ Firestore..."

# Verificar se o servidor está rodando
if curl -s http://localhost:3000/api/sincronizar-todos-usuarios > /dev/null 2>&1; then
    echo "✅ Servidor está rodando"
    
    # Executar sincronização
    echo "🔄 Executando sincronização..."
    node scripts/sync-stripe-firestore.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Teste concluído com sucesso!"
    else
        echo "❌ Teste falhou"
        exit 1
    fi
else
    echo "❌ Servidor não está rodando em localhost:3000"
    echo "💡 Inicie o servidor com: yarn dev"
    exit 1
fi
