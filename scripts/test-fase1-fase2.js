// Script de Teste - Fases 1 e 2
// ==============================
// Data: 2025-01-12
// Testa: Sistema Financeiro ACID (Fase 1) e Idempotência Webhook (Fase 2)

require('dotenv').config();
const { supabaseAdmin } = require('../database/supabase-config');
const FinancialService = require('../services/financialService');
const WebhookService = require('../services/webhookService');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFase1() {
  log('\n=== TESTE FASE 1: SISTEMA FINANCEIRO ACID ===', 'cyan');
  
  try {
    // Buscar um usuário de teste
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, saldo')
      .limit(1);

    if (userError || !usuarios || usuarios.length === 0) {
      log('❌ Nenhum usuário encontrado para teste', 'red');
      log('💡 Criando usuário de teste...', 'yellow');
      
      // Criar usuário de teste
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          email: `teste-${Date.now()}@teste.com`,
          username: `teste-${Date.now()}`,
          senha_hash: 'teste',
          saldo: 0
        })
        .select('id, saldo')
        .single();

      if (createError || !newUser) {
        log(`❌ Erro ao criar usuário de teste: ${createError?.message}`, 'red');
        return false;
      }

      usuarios = [newUser];
    }

    const testUserId = usuarios[0].id;
    const initialBalance = parseFloat(usuarios[0].saldo || 0);

    log(`✅ Usuário de teste: ${testUserId}`, 'green');
    log(`💰 Saldo inicial: R$ ${initialBalance.toFixed(2)}`, 'blue');

    // Teste 1: Adicionar saldo
    log('\n📝 Teste 1: Adicionar saldo (R$ 100,00)', 'yellow');
    const addResult = await FinancialService.addBalance(
      testUserId,
      100.00,
      {
        description: 'Teste Fase 1 - Crédito',
        referenceType: 'teste'
      }
    );

    if (!addResult.success) {
      log(`❌ Erro ao adicionar saldo: ${addResult.error}`, 'red');
      return false;
    }

    log(`✅ Saldo adicionado: R$ ${addResult.data.amount.toFixed(2)}`, 'green');
    log(`   Saldo anterior: R$ ${addResult.data.oldBalance.toFixed(2)}`, 'blue');
    log(`   Saldo novo: R$ ${addResult.data.newBalance.toFixed(2)}`, 'blue');
    log(`   Transaction ID: ${addResult.data.transactionId}`, 'blue');

    // Teste 2: Verificar saldo
    log('\n📝 Teste 2: Verificar saldo', 'yellow');
    const balanceResult = await FinancialService.getBalance(testUserId);
    
    if (!balanceResult.success) {
      log(`❌ Erro ao verificar saldo: ${balanceResult.error}`, 'red');
      return false;
    }

    log(`✅ Saldo atual: R$ ${balanceResult.balance.toFixed(2)}`, 'green');
    
    if (Math.abs(balanceResult.balance - addResult.data.newBalance) > 0.01) {
      log(`⚠️ Inconsistência: Saldo esperado R$ ${addResult.data.newBalance.toFixed(2)}, obtido R$ ${balanceResult.balance.toFixed(2)}`, 'yellow');
    }

    // Teste 3: Deduzir saldo
    log('\n📝 Teste 3: Deduzir saldo (R$ 30,00)', 'yellow');
    const deductResult = await FinancialService.deductBalance(
      testUserId,
      30.00,
      {
        description: 'Teste Fase 1 - Débito',
        referenceType: 'teste'
      }
    );

    if (!deductResult.success) {
      log(`❌ Erro ao deduzir saldo: ${deductResult.error}`, 'red');
      return false;
    }

    log(`✅ Saldo deduzido: R$ ${deductResult.data.amount.toFixed(2)}`, 'green');
    log(`   Saldo anterior: R$ ${deductResult.data.oldBalance.toFixed(2)}`, 'blue');
    log(`   Saldo novo: R$ ${deductResult.data.newBalance.toFixed(2)}`, 'blue');
    log(`   Transaction ID: ${deductResult.data.transactionId}`, 'blue');

    // Teste 4: Tentar deduzir mais que o saldo disponível
    log('\n📝 Teste 4: Tentar deduzir mais que saldo disponível (R$ 1000,00)', 'yellow');
    const insufficientResult = await FinancialService.deductBalance(
      testUserId,
      1000.00,
      {
        description: 'Teste Fase 1 - Saldo insuficiente',
        referenceType: 'teste'
      }
    );

    if (insufficientResult.success) {
      log(`❌ Erro: Deveria ter falhado por saldo insuficiente`, 'red');
      return false;
    }

    log(`✅ Erro esperado: ${insufficientResult.error}`, 'green');
    if (insufficientResult.data) {
      log(`   Saldo atual: R$ ${insufficientResult.data.currentBalance.toFixed(2)}`, 'blue');
      log(`   Valor necessário: R$ ${insufficientResult.data.requiredAmount.toFixed(2)}`, 'blue');
      log(`   Falta: R$ ${insufficientResult.data.shortage.toFixed(2)}`, 'blue');
    }

    log('\n✅ FASE 1: TODOS OS TESTES PASSARAM!', 'green');
    return true;

  } catch (error) {
    log(`❌ Erro inesperado: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testFase2() {
  log('\n=== TESTE FASE 2: IDEMPOTÊNCIA WEBHOOK ===', 'cyan');
  
  try {
    // Buscar um usuário de teste
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .limit(1);

    if (userError || !usuarios || usuarios.length === 0) {
      log('❌ Nenhum usuário encontrado para teste', 'red');
      return false;
    }

    const testUserId = usuarios[0].id;
    const testPaymentId = `12345${Date.now()}`;
    const testPayload = {
      type: 'payment',
      data: {
        id: testPaymentId,
        status: 'approved'
      }
    };

    log(`✅ Usuário de teste: ${testUserId}`, 'green');
    log(`✅ Payment ID de teste: ${testPaymentId}`, 'green');

    // Teste 1: Registrar evento pela primeira vez
    log('\n📝 Teste 1: Registrar evento webhook (primeira vez)', 'yellow');
    const registerResult1 = await WebhookService.registerWebhookEvent(
      'payment',
      testPaymentId,
      testPayload
    );

    if (!registerResult1.success) {
      log(`❌ Erro ao registrar evento: ${registerResult1.error}`, 'red');
      return false;
    }

    log(`✅ Evento registrado: ID ${registerResult1.eventId}`, 'green');
    log(`   Já existia: ${registerResult1.alreadyExists}`, 'blue');

    // Teste 2: Tentar registrar mesmo evento novamente (idempotência)
    log('\n📝 Teste 2: Registrar mesmo evento novamente (idempotência)', 'yellow');
    const registerResult2 = await WebhookService.registerWebhookEvent(
      'payment',
      testPaymentId,
      testPayload
    );

    if (!registerResult2.success) {
      log(`❌ Erro ao registrar evento: ${registerResult2.error}`, 'red');
      return false;
    }

    log(`✅ Evento registrado: ID ${registerResult2.eventId}`, 'green');
    log(`   Já existia: ${registerResult2.alreadyExists}`, 'blue');

    if (registerResult1.eventId !== registerResult2.eventId) {
      log(`❌ Erro: IDs diferentes (${registerResult1.eventId} vs ${registerResult2.eventId})`, 'red');
      return false;
    }

    if (!registerResult2.alreadyExists) {
      log(`⚠️ Aviso: Segundo registro não detectou evento existente`, 'yellow');
    }

    // Teste 3: Verificar se evento já foi processado
    log('\n📝 Teste 3: Verificar se evento já foi processado', 'yellow');
    const checkResult = await WebhookService.checkEventProcessed(
      'payment',
      testPaymentId,
      testPayload
    );

    if (!checkResult.success) {
      log(`❌ Erro ao verificar evento: ${checkResult.error}`, 'red');
      return false;
    }

    log(`✅ Evento encontrado: ID ${checkResult.eventId}`, 'green');
    log(`   Processado: ${checkResult.processed}`, 'blue');

    // Teste 4: Marcar evento como processado
    log('\n📝 Teste 4: Marcar evento como processado', 'yellow');
    const markResult = await WebhookService.markEventProcessed(
      registerResult1.eventId,
      { test: 'resultado' }
    );

    if (!markResult.success) {
      log(`❌ Erro ao marcar evento: ${markResult.error}`, 'red');
      return false;
    }

    log(`✅ Evento marcado como processado`, 'green');
    log(`   Duração: ${markResult.durationMs}ms`, 'blue');

    // Teste 5: Verificar novamente se foi processado
    log('\n📝 Teste 5: Verificar se evento foi processado', 'yellow');
    const checkResult2 = await WebhookService.checkEventProcessed(
      'payment',
      testPaymentId,
      testPayload
    );

    if (!checkResult2.success) {
      log(`❌ Erro ao verificar evento: ${checkResult2.error}`, 'red');
      return false;
    }

    if (!checkResult2.processed) {
      log(`❌ Erro: Evento deveria estar marcado como processado`, 'red');
      return false;
    }

    log(`✅ Evento está marcado como processado`, 'green');

    log('\n✅ FASE 2: TODOS OS TESTES PASSARAM!', 'green');
    return true;

  } catch (error) {
    log(`❌ Erro inesperado: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function runTests() {
  log('\n🚀 INICIANDO TESTES DAS FASES 1 E 2', 'cyan');
  log('='.repeat(50), 'cyan');

  const fase1Result = await testFase1();
  const fase2Result = await testFase2();

  log('\n' + '='.repeat(50), 'cyan');
  log('📊 RESULTADO DOS TESTES', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Fase 1 (Sistema Financeiro ACID): ${fase1Result ? '✅ PASSOU' : '❌ FALHOU'}`, fase1Result ? 'green' : 'red');
  log(`Fase 2 (Idempotência Webhook): ${fase2Result ? '✅ PASSOU' : '❌ FALHOU'}`, fase2Result ? 'green' : 'red');

  if (fase1Result && fase2Result) {
    log('\n🎉 TODAS AS FASES TESTADAS COM SUCESSO!', 'green');
    log('✅ Pronto para seguir para Fase 3', 'green');
    process.exit(0);
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM', 'yellow');
    log('❌ Revise os erros acima antes de continuar', 'red');
    process.exit(1);
  }
}

// Executar testes
runTests().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

