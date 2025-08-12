#!/bin/bash

# Script para sincronizar assinaturas via cron job
# Executar a cada hora: 0 * * * * /caminho/para/cron-sync-subscriptions.sh

# Configurações
API_URL="http://localhost:3000/api/sync-subscriptions"
API_KEY="${SUBSCRIPTION_SYNC_API_KEY}"  # Definir como variável de ambiente
LOG_FILE="/var/log/subscription-sync.log"

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Verificar se a API está rodando
if ! curl -s --head "$API_URL" > /dev/null; then
    log "❌ ERRO: API não está respondendo em $API_URL"
    exit 1
fi

# Executar sincronização
log "🔄 Iniciando sincronização de assinaturas..."

if [ -n "$API_KEY" ]; then
    # Com autenticação
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        "$API_URL")
else
    # Sem autenticação (não recomendado para produção)
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        "$API_URL")
fi

# Verificar resposta
if echo "$RESPONSE" | grep -q '"success":true'; then
    log "✅ Sincronização concluída com sucesso"
    log "📊 Resposta: $RESPONSE"
else
    log "❌ ERRO na sincronização: $RESPONSE"
    exit 1
fi

log "🎯 Sincronização finalizada"
