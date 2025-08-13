#!/bin/bash

# Script de Configuração do Cron Job para Sincronização Stripe ↔ Firestore
# Execute este script como root ou com sudo para configurar o cron job

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos rodando como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script deve ser executado como root (use sudo)"
   exit 1
fi

print_status "Configurando Cron Job para Sincronização Stripe ↔ Firestore..."

# Obter o diretório atual do projeto
PROJECT_DIR=$(pwd)
SCRIPT_PATH="$PROJECT_DIR/scripts/sync-stripe-firestore.js"

# Verificar se o script existe
if [[ ! -f "$SCRIPT_PATH" ]]; then
    print_error "Script não encontrado em: $SCRIPT_PATH"
    print_error "Certifique-se de estar no diretório raiz do projeto"
    exit 1
fi

print_success "Script encontrado em: $SCRIPT_PATH"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado"
    print_error "Instale o Node.js primeiro: https://nodejs.org/"
    exit 1
fi

print_success "Node.js encontrado: $(node --version)"

# Criar o diretório de logs se não existir
LOG_DIR="/var/log/stripe-sync"
mkdir -p "$LOG_DIR"
chmod 755 "$LOG_DIR"

print_success "Diretório de logs criado: $LOG_DIR"

# Configuração do cron job
# Executar a cada 6 horas (0 */6 * * *)
CRON_SCHEDULE="0 */6 * * *"
CRON_USER=$(whoami)
CRON_COMMAND="$CRON_SCHEDULE $CRON_USER cd $PROJECT_DIR && NODE_ENV=production node $SCRIPT_PATH >> $LOG_DIR/sync-$(date +\%Y\%m\%d).log 2>&1"

# Adicionar ao crontab
print_status "Adicionando cron job ao crontab..."

# Verificar se já existe um cron job similar
if crontab -l 2>/dev/null | grep -q "sync-stripe-firestore"; then
    print_warning "Cron job já existe. Removendo versão anterior..."
    crontab -l 2>/dev/null | grep -v "sync-stripe-firestore" | crontab -
fi

# Adicionar novo cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

print_success "Cron job configurado com sucesso!"

# Mostrar o cron job configurado
print_status "Cron job configurado:"
echo "Schedule: $CRON_SCHEDULE (a cada 6 horas)"
echo "Command: cd $PROJECT_DIR && NODE_ENV=production node $SCRIPT_PATH"
echo "Logs: $LOG_DIR/sync-YYYYMMDD.log"

# Criar arquivo de configuração
CONFIG_FILE="$PROJECT_DIR/.stripe-sync-config"
cat > "$CONFIG_FILE" << EOF
# Configuração da Sincronização Stripe ↔ Firestore
# Gerado automaticamente em $(date)

PROJECT_DIR=$PROJECT_DIR
SCRIPT_PATH=$SCRIPT_PATH
LOG_DIR=$LOG_DIR
CRON_SCHEDULE=$CRON_SCHEDULE
CRON_USER=$CRON_USER

# Para testar manualmente:
# cd $PROJECT_DIR && node $SCRIPT_PATH

# Para ver logs:
# tail -f $LOG_DIR/sync-$(date +%Y%m%d).log

# Para remover o cron job:
# crontab -l | grep -v "sync-stripe-firestore" | crontab -
EOF

print_success "Arquivo de configuração criado: $CONFIG_FILE"

# Criar script de teste
TEST_SCRIPT="$PROJECT_DIR/test-sync.sh"
cat > "$TEST_SCRIPT" << 'EOF'
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
EOF

chmod +x "$TEST_SCRIPT"
print_success "Script de teste criado: $TEST_SCRIPT"

# Criar script de monitoramento
MONITOR_SCRIPT="$PROJECT_DIR/monitor-sync.sh"
cat > "$MONITOR_SCRIPT" << 'EOF'
#!/bin/bash

# Script de monitoramento dos logs de sincronização
LOG_DIR="/var/log/stripe-sync"
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
EOF

chmod +x "$MONITOR_SCRIPT"
print_success "Script de monitoramento criado: $MONITOR_SCRIPT"

# Mostrar resumo final
echo ""
print_success "Configuração concluída com sucesso!"
echo ""
echo "📋 Resumo da configuração:"
echo "   • Cron job configurado para executar a cada 6 horas"
echo "   • Logs serão salvos em: $LOG_DIR"
echo "   • Script de teste: $TEST_SCRIPT"
echo "   • Script de monitoramento: $MONITOR_SCRIPT"
echo "   • Configuração salva em: $CONFIG_FILE"
echo ""
echo "🧪 Para testar: ./test-sync.sh"
echo "📊 Para monitorar: ./monitor-sync.sh"
echo "🔄 Para executar manualmente: node scripts/sync-stripe-firestore.js"
echo ""
echo "⏰ Próxima execução automática: $(date -d "$(date +%H):00 +6 hours" +"%Y-%m-%d %H:%M")"
