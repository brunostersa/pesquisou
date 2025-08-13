#!/bin/bash

# Script de monitoramento dos logs de sincronização
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
TODAY=$(date +%Y%m%d)
LOG_FILE="$LOG_DIR/sync-$TODAY.log"

echo "📊 Monitorando logs de sincronização..."
echo "📁 Arquivo: $LOG_FILE"
echo "⏰ Última atualização: $(date)"
echo "─".repeat(60)

if [[ -f "$LOG_FILE" ]]; then
    echo "📋 Últimas 20 linhas do log:"
    tail -n 20 "$LOG_FILE"
    
    echo ""
    echo "📈 Estatísticas:"
    echo "   Total de linhas: $(wc -l < "$LOG_FILE")"
    echo "   Última execução: $(grep "Iniciando sincronização" "$LOG_FILE" | tail -1 | cut -d' ' -f2- || echo 'N/A')"
    echo "   Última conclusão: $(grep "Sincronização concluída" "$LOG_FILE" | tail -1 | cut -d' ' -f2- || echo 'N/A')"
    
    # Verificar erros
    ERROR_COUNT=$(grep -c "❌\|ERROR\|Error" "$LOG_FILE" || echo "0")
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo "   ❌ Erros encontrados: $ERROR_COUNT"
        echo ""
        echo "🔍 Últimos erros:"
        grep "❌\|ERROR\|Error" "$LOG_FILE" | tail -5
    else
        echo "   ✅ Nenhum erro encontrado"
    fi
else
    echo "❌ Arquivo de log não encontrado para hoje"
    echo "💡 Execute a sincronização primeiro ou aguarde o próximo cron job"
fi

echo ""
echo "💡 Para monitoramento em tempo real: tail -f $LOG_FILE"
