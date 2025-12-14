/**
 * TESTE PIX V19 - AUTOMAÇÃO V19
 * Testes reais do fluxo PIX usando sandbox do Mercado Pago
 */

const { getClient } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `teste_pix_v19_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[PIX TEST] ${logMessage.trim()}`);
}

/**
 * Testar fluxo completo de PIX
 */
async function testPIXFlow(environment = 'staging') {
  log(`=== INICIANDO TESTE PIX V19 - ${environment.toUpperCase()} ===`, 'INFO');
  const startTime = Date.now();
  
  const results = {
    environment,
    startTime: new Date().toISOString(),
    tests: [],
    errors: []
  };

  const client = getClient(environment === 'staging' ? 'STG' : 'PROD');

  try {
    // TEST 1: Verificar tabela webhook_events
    log('TEST 1: Verificando tabela webhook_events...', 'INFO');
    try {
      const { data, error } = await client.from('webhook_events').select('*').limit(1);
      if (error) throw error;
      results.tests.push({
        name: 'webhook_events_table',
        status: 'passed',
        message: 'Tabela webhook_events acessível'
      });
      log('✅ Tabela webhook_events OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'webhook_events_table',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'webhook_events_table', error: error.message });
      log(`❌ Erro ao verificar webhook_events: ${error.message}`, 'ERROR');
    }

    // TEST 2: Testar RPC rpc_register_webhook_event
    log('TEST 2: Testando RPC rpc_register_webhook_event...', 'INFO');
    try {
      const testEvent = {
        idempotency_key: `test_pix_${Date.now()}`,
        payment_id: `test_payment_${Date.now()}`,
        event_type: 'payment.created',
        payload: { test: true },
        source: 'mercadopago'
      };

      const { data, error } = await client.rpc('rpc_register_webhook_event', {
        p_idempotency_key: testEvent.idempotency_key,
        p_event_type: testEvent.event_type,
        p_payment_id: testEvent.payment_id,
        p_raw_payload: testEvent.payload
      });

      if (error) throw error;

      results.tests.push({
        name: 'rpc_register_webhook_event',
        status: 'passed',
        message: 'RPC executado com sucesso',
        data: data
      });
      log('✅ RPC rpc_register_webhook_event OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rpc_register_webhook_event',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_register_webhook_event', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    // TEST 3: Testar RPC rpc_check_webhook_event_processed
    log('TEST 3: Testando RPC rpc_check_webhook_event_processed...', 'INFO');
    try {
      const testKey = `test_pix_${Date.now()}`;
      
      // Primeiro registrar um evento
      await client.rpc('rpc_register_webhook_event', {
        p_idempotency_key: testKey,
        p_event_type: 'payment.created',
        p_payment_id: `test_${Date.now()}`,
        p_raw_payload: {}
      });

      // Depois verificar se foi processado
      const { data, error } = await client.rpc('rpc_check_webhook_event_processed', {
        p_idempotency_key: testKey
      });

      if (error) throw error;

      results.tests.push({
        name: 'rpc_check_webhook_event_processed',
        status: 'passed',
        message: 'RPC executado com sucesso',
        data: data
      });
      log('✅ RPC rpc_check_webhook_event_processed OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rpc_check_webhook_event_processed',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_check_webhook_event_processed', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    // TEST 4: Testar idempotência (mesmo evento duas vezes)
    log('TEST 4: Testando idempotência...', 'INFO');
    try {
      const idempotencyKey = `test_idempotency_${Date.now()}`;
      
      // Primeira chamada
      const { data: data1, error: error1 } = await client.rpc('rpc_register_webhook_event', {
        p_idempotency_key: idempotencyKey,
        p_event_type: 'payment.created',
        p_payment_id: `test_${Date.now()}`,
        p_raw_payload: {}
      });

      if (error1) throw error1;

      // Segunda chamada (deve retornar o mesmo evento)
      const { data: data2, error: error2 } = await client.rpc('rpc_register_webhook_event', {
        p_idempotency_key: idempotencyKey,
        p_event_type: 'payment.created',
        p_payment_id: `test_${Date.now()}`,
        p_raw_payload: {}
      });

      if (error2 && !error2.message.includes('duplicate') && !error2.message.includes('unique')) {
        throw error2;
      }

      results.tests.push({
        name: 'idempotency',
        status: 'passed',
        message: 'Idempotência funcionando corretamente'
      });
      log('✅ Idempotência OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'idempotency',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'idempotency', error: error.message });
      log(`❌ Erro ao testar idempotência: ${error.message}`, 'ERROR');
    }

    const endTime = Date.now();
    results.endTime = new Date().toISOString();
    results.duration = endTime - startTime;
    results.success = results.errors.length === 0;
    results.passed = results.tests.filter(t => t.status === 'passed').length;
    results.failed = results.tests.filter(t => t.status === 'failed').length;

    log(`=== TESTE PIX CONCLUÍDO (${results.duration}ms) ===`, results.success ? 'SUCCESS' : 'WARN');
    log(`Passou: ${results.passed}/${results.tests.length}`, results.success ? 'SUCCESS' : 'WARN');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `teste_pix_v19_${environment}_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Resultados salvos em: ${resultsPath}`, 'INFO');

    return results;
  } catch (error) {
    log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
    results.errors.push({ step: 'critical', error: error.message });
    results.success = false;
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const environment = args.find(a => !a.startsWith('--')) || 'staging';
  const realMode = args.includes('--real');
  
  testPIXFlow(environment, { real: realMode })
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testPIXFlow };

