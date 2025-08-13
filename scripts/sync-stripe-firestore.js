#!/usr/bin/env node

/**
 * Script de Sincronização Automática Stripe ↔ Firestore
 * 
 * Este script pode ser executado:
 * 1. Manualmente: node scripts/sync-stripe-firestore.js
 * 2. Via cron: 0 /6 * * * node /path/to/scripts/sync-stripe-firestore.js
 * 3. Via GitHub Actions
 */

const https = require('https');
const http = require('http');

// Configuração
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiEndpoint: '/api/sincronizar-todos-usuarios',
  timeout: 300000, // 5 minutos
  retryAttempts: 3,
  retryDelay: 5000 // 5 segundos
};

// Função para fazer requisição HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe-Firestore-Sync/1.0'
      },
      timeout: config.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Erro de requisição: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout da requisição'));
    });

    req.end();
  });
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de sincronização
async function syncStripeFirestore() {
  const startTime = new Date();
  console.log(`🚀 Iniciando sincronização automática em: ${startTime.toISOString()}`);
  console.log(`🌐 URL da API: ${config.baseUrl}${config.apiEndpoint}`);
  console.log(`⏱️  Timeout: ${config.timeout / 1000}s`);
  console.log('─'.repeat(60));

  let attempt = 1;
  
  while (attempt <= config.retryAttempts) {
    try {
      console.log(`\n🔄 Tentativa ${attempt}/${config.retryAttempts}...`);
      
      const response = await makeRequest(`${config.baseUrl}${config.apiEndpoint}`);
      
      if (response.statusCode === 200) {
        const result = response.data;
        
        console.log('✅ Sincronização concluída com sucesso!');
        console.log('─'.repeat(60));
        console.log('📊 Resumo:');
        console.log(`   Total de usuários: ${result.summary.totalUsers}`);
        console.log(`   ✅ Sucessos: ${result.summary.successCount}`);
        console.log(`   ❌ Erros: ${result.summary.errorCount}`);
        console.log(`   🔄 Atualizados: ${result.summary.updatedCount}`);
        console.log(`   ✅ Já sincronizados: ${result.summary.alreadySyncedCount}`);
        
        // Mostrar detalhes dos usuários atualizados
        const updatedUsers = result.results.filter(r => r.status === 'updated');
        if (updatedUsers.length > 0) {
          console.log('\n🔄 Usuários atualizados:');
          updatedUsers.forEach(user => {
            console.log(`   • ${user.name} (${user.email})`);
            console.log(`     Plano: ${user.previousData.plan} → ${user.newData.plan}`);
            console.log(`     Status: ${user.previousData.subscriptionStatus} → ${user.newData.subscriptionStatus}`);
          });
        }
        
        // Mostrar erros se houver
        const errorUsers = result.results.filter(r => r.status === 'error');
        if (errorUsers.length > 0) {
          console.log('\n❌ Usuários com erro:');
          errorUsers.forEach(user => {
            console.log(`   • ${user.name} (${user.email}): ${user.error}`);
          });
        }
        
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        console.log(`\n⏱️  Duração total: ${duration.toFixed(2)}s`);
        console.log('🎉 Sincronização automática concluída!');
        
        return result;
        
      } else {
        throw new Error(`HTTP ${response.statusCode}: ${response.data.error || 'Erro desconhecido'}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt}: ${error.message}`);
      
      if (attempt < config.retryAttempts) {
        console.log(`⏳ Aguardando ${config.retryDelay / 1000}s antes da próxima tentativa...`);
        await sleep(config.retryDelay);
        attempt++;
      } else {
        console.error('💥 Todas as tentativas falharam. Sincronização abortada.');
        throw error;
      }
    }
  }
}

// Função para executar com tratamento de erro
async function main() {
  try {
    await syncStripeFirestore();
    process.exit(0);
  } catch (error) {
    console.error('💥 Erro fatal na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { syncStripeFirestore, makeRequest };
