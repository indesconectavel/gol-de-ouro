/**
 * TESTE PREMIAÇÃO V19 - AUTOMAÇÃO V19
 * Testes reais do fluxo de premiação V19
 */

const { getClient } = require('./lib/supabase-client');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs/v19/automation');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `teste_premiacao_v19_${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(`[PREMIAÇÃO TEST] ${logMessage.trim()}`);
}

/**
 * Testar fluxo completo de premiação
 */
async function testPremiacaoFlow(environment = 'staging') {
  log(`=== INICIANDO TESTE PREMIAÇÃO V19 - ${environment.toUpperCase()} ===`, 'INFO');
  const startTime = Date.now();
  
  const results = {
    environment,
    startTime: new Date().toISOString(),
    tests: [],
    errors: []
  };

  const client = getClient(environment === 'staging' ? 'STG' : 'PROD');

  try {
    // TEST 1: Verificar tabela rewards
    log('TEST 1: Verificando tabela rewards...', 'INFO');
    try {
      const { data, error } = await client.from('rewards').select('*').limit(1);
      if (error) throw error;
      results.tests.push({
        name: 'rewards_table',
        status: 'passed',
        message: 'Tabela rewards acessível'
      });
      log('✅ Tabela rewards OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rewards_table',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rewards_table', error: error.message });
      log(`❌ Erro ao verificar rewards: ${error.message}`, 'ERROR');
    }

    // TEST 2: Verificar tabela lotes
    log('TEST 2: Verificando tabela lotes...', 'INFO');
    try {
      const { data, error } = await client.from('lotes').select('*').limit(1);
      if (error) throw error;
      results.tests.push({
        name: 'lotes_table',
        status: 'passed',
        message: 'Tabela lotes acessível'
      });
      log('✅ Tabela lotes OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'lotes_table',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'lotes_table', error: error.message });
      log(`❌ Erro ao verificar lotes: ${error.message}`, 'ERROR');
    }

    // TEST 3: Testar RPC rpc_get_or_create_lote
    log('TEST 3: Testando RPC rpc_get_or_create_lote...', 'INFO');
    try {
      const testLote = {
        valor_aposta: 10.00,
        tamanho: 100,
        indice_vencedor: 50
      };

      const loteId = `lote_${testLote.valor_aposta}_${testLote.tamanho}_${Date.now()}`;
      const { data, error } = await client.rpc('rpc_get_or_create_lote', {
        p_lote_id: loteId,
        p_valor_aposta: testLote.valor_aposta,
        p_tamanho: testLote.tamanho,
        p_indice_vencedor: testLote.indice_vencedor
      });

      if (error) throw error;

      results.tests.push({
        name: 'rpc_get_or_create_lote',
        status: 'passed',
        message: 'RPC executado com sucesso',
        data: data
      });
      log('✅ RPC rpc_get_or_create_lote OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rpc_get_or_create_lote',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_get_or_create_lote', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    // TEST 4: Testar RPC rpc_register_reward
    log('TEST 4: Testando RPC rpc_register_reward...', 'INFO');
    try {
      // Criar um lote primeiro
      const loteIdForTest = `lote_test_${Date.now()}`;
      const { data: loteData } = await client.rpc('rpc_get_or_create_lote', {
        p_lote_id: loteIdForTest,
        p_valor_aposta: 10.00,
        p_tamanho: 100,
        p_indice_vencedor: 50
      });

      const loteId = loteData?.id || loteIdForTest;
      
      // Buscar um usuário real ou criar UUID de teste válido
      const { data: usuarios } = await client.from('usuarios').select('id').limit(1);
      const testUserId = usuarios && usuarios.length > 0 ? usuarios[0].id : '00000000-0000-0000-0000-000000000000';

      const { data, error } = await client.rpc('rpc_register_reward', {
        p_usuario_id: testUserId,
        p_lote_id: loteId,
        p_chute_id: null, // chute_id pode ser NULL
        p_tipo: 'gol_normal',
        p_valor: 100.00,
        p_descricao: 'Teste de premiação',
        p_metadata: {}
      });

      if (error) throw error;

      results.tests.push({
        name: 'rpc_register_reward',
        status: 'passed',
        message: 'RPC executado com sucesso',
        data: data
      });
      log('✅ RPC rpc_register_reward OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rpc_register_reward',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_register_reward', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    // TEST 5: Testar RPC rpc_get_user_rewards
    log('TEST 5: Testando RPC rpc_get_user_rewards...', 'INFO');
    try {
      // Buscar um usuário real ou usar UUID de teste válido
      const { data: usuarios } = await client.from('usuarios').select('id').limit(1);
      const testUserId = usuarios && usuarios.length > 0 ? usuarios[0].id : '00000000-0000-0000-0000-000000000000';

      const { data, error } = await client.rpc('rpc_get_user_rewards', {
        p_usuario_id: testUserId,
        p_limit: 10,
        p_offset: 0,
        p_tipo: null,
        p_status: null
      });

      if (error) throw error;

      results.tests.push({
        name: 'rpc_get_user_rewards',
        status: 'passed',
        message: 'RPC executado com sucesso',
        data: data
      });
      log('✅ RPC rpc_get_user_rewards OK', 'SUCCESS');
    } catch (error) {
      results.tests.push({
        name: 'rpc_get_user_rewards',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_get_user_rewards', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    // TEST 6: Testar RPC rpc_mark_reward_credited
    log('TEST 6: Testando RPC rpc_mark_reward_credited...', 'INFO');
    try {
      // Primeiro criar um reward
      const loteIdForReward = `lote_test_${Date.now()}`;
      const { data: loteData } = await client.rpc('rpc_get_or_create_lote', {
        p_lote_id: loteIdForReward,
        p_valor_aposta: 10.00,
        p_tamanho: 100,
        p_indice_vencedor: 50
      });

      const loteId = loteData?.id || loteIdForReward;
      
      // Buscar um usuário real
      const { data: usuarios } = await client.from('usuarios').select('id').limit(1);
      
      if (!usuarios || usuarios.length === 0) {
        // Se não houver usuários, pular este teste mas marcar como skipped
        results.tests.push({
          name: 'rpc_mark_reward_credited',
          status: 'skipped',
          message: 'Teste pulado: Nenhum usuário encontrado no ambiente para criar reward de teste'
        });
        log('⚠️ Teste rpc_mark_reward_credited pulado: Nenhum usuário encontrado', 'WARN');
        // Não fazer throw, apenas continuar
      } else {
      
      const testUserId = usuarios[0].id;

      const { data: rewardData } = await client.rpc('rpc_register_reward', {
        p_usuario_id: testUserId,
        p_lote_id: loteId,
        p_chute_id: null,
        p_tipo: 'gol_normal',
        p_valor: 100.00,
        p_descricao: 'Teste de premiação',
        p_metadata: {}
      });

      // Verificar se houve erro no registro
      if (rewardData && rewardData.success === false) {
        throw new Error(`Erro ao registrar reward: ${rewardData.error || 'Erro desconhecido'}`);
      }

      // O RPC retorna { success: true, reward_id: ... }
      const rewardId = rewardData?.reward_id || null;
      
      if (!rewardId) {
        throw new Error(`Não foi possível obter reward_id. Resposta: ${JSON.stringify(rewardData)}`);
      }

        // Marcar como creditado (precisa de transacao_id e saldo_posterior)
        const { data, error } = await client.rpc('rpc_mark_reward_credited', {
          p_reward_id: rewardId,
          p_transacao_id: null, // pode ser NULL
          p_saldo_posterior: 100.00
        });

        if (error) throw error;

        results.tests.push({
          name: 'rpc_mark_reward_credited',
          status: 'passed',
          message: 'RPC executado com sucesso',
          data: data
        });
        log('✅ RPC rpc_mark_reward_credited OK', 'SUCCESS');
      }
    } catch (error) {
      results.tests.push({
        name: 'rpc_mark_reward_credited',
        status: 'failed',
        message: error.message
      });
      results.errors.push({ test: 'rpc_mark_reward_credited', error: error.message });
      log(`❌ Erro ao testar RPC: ${error.message}`, 'ERROR');
    }

    const endTime = Date.now();
    results.endTime = new Date().toISOString();
    results.duration = endTime - startTime;
    results.success = results.errors.length === 0;
    results.passed = results.tests.filter(t => t.status === 'passed').length;
    results.failed = results.tests.filter(t => t.status === 'failed').length;

    log(`=== TESTE PREMIAÇÃO CONCLUÍDO (${results.duration}ms) ===`, results.success ? 'SUCCESS' : 'WARN');
    log(`Passou: ${results.passed}/${results.tests.length}`, results.success ? 'SUCCESS' : 'WARN');

    // Salvar resultados
    const resultsPath = path.join(LOG_DIR, `teste_premiacao_v19_${environment}_${Date.now()}.json`);
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
  const environment = process.argv[2] || 'staging';
  testPremiacaoFlow(environment)
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testPremiacaoFlow };

