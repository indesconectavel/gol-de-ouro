/**
 * 🧪 TESTES FINAIS PRÉ-PRODUÇÃO
 * =============================
 * Objetivo: Validar TUDO antes de liberar para jogadores reais
 */

require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../../database/supabase-unified-config');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';

// Credenciais de teste
const TEST_EMAIL = 'free10signer@gmail.com';
const TEST_PASSWORD = 'Free10signer';

const resultados = {
  timestamp: new Date().toISOString(),
  base_url: BASE_URL,
  testes: {},
  problemas: [],
  avisos: [],
  percentual: 0,
  status_final: 'PENDENTE'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testesFinais() {
  console.log('\n🧪 TESTES FINAIS PRÉ-PRODUÇÃO\n');
  console.log('='.repeat(70));
  console.log(`URL Base: ${BASE_URL}`);
  console.log(`Timestamp: ${resultados.timestamp}\n`);

  let totalTestes = 0;
  let testesPassaram = 0;

  // =====================================================
  // 1. TESTES DE INFRAESTRUTURA
  // =====================================================
  console.log('\n1️⃣ TESTES DE INFRAESTRUTURA\n');
  console.log('-'.repeat(70));

  // 1.1. Servidor Online
  totalTestes++;
  try {
    const response = await axios.get(`${BASE_URL}/meta`, { timeout: 10000 });
    if (response.status === 200) {
      console.log('   ✅ Servidor Online: OK');
      resultados.testes.servidor_online = { passou: true };
      testesPassaram++;
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Servidor Online: FALHOU - ${error.message}`);
    resultados.testes.servidor_online = { passou: false, erro: error.message };
    resultados.problemas.push('Servidor não está respondendo');
  }

  // 1.2. Conexão com Supabase
  totalTestes++;
  try {
    const { data, error } = await supabaseAdmin.from('usuarios').select('count').limit(1);
    if (error) throw error;
    console.log('   ✅ Conexão Supabase: OK');
    resultados.testes.supabase_conexao = { passou: true };
    testesPassaram++;
  } catch (error) {
    console.log(`   ❌ Conexão Supabase: FALHOU - ${error.message}`);
    resultados.testes.supabase_conexao = { passou: false, erro: error.message };
    resultados.problemas.push('Conexão com Supabase falhou');
  }

  // =====================================================
  // 2. TESTES DE AUTENTICAÇÃO
  // =====================================================
  console.log('\n2️⃣ TESTES DE AUTENTICAÇÃO\n');
  console.log('-'.repeat(70));

  let token = null;
  let userId = null;

  // 2.1. Login
  totalTestes++;
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, { timeout: 10000 });

    if (response.data && response.data.token) {
      token = response.data.token;
      userId = response.data.user?.id || response.data.userId;
      console.log('   ✅ Login: OK');
      console.log(`   ℹ️  Token obtido: ${token.substring(0, 20)}...`);
      console.log(`   ℹ️  User ID: ${userId}`);
      resultados.testes.login = { passou: true, userId };
      testesPassaram++;
    } else {
      throw new Error('Token não retornado');
    }
  } catch (error) {
    console.log(`   ❌ Login: FALHOU - ${error.message}`);
    resultados.testes.login = { passou: false, erro: error.message };
    resultados.problemas.push('Login falhou - não é possível continuar testes');
    console.log('\n⚠️  CRÍTICO: Sem login, não é possível continuar os testes!');
    resultados.status_final = 'BLOQUEADO';
    resultados.percentual = Math.round((testesPassaram / totalTestes) * 100);
    return resultados;
  }

  // 2.2. Verificar Perfil
  totalTestes++;
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    if (response.data && response.data.data) {
      const saldo = response.data.data.saldo || 0;
      console.log('   ✅ Perfil: OK');
      console.log(`   ℹ️  Saldo atual: R$ ${saldo.toFixed(2)}`);
      resultados.testes.perfil = { passou: true, saldo };
      testesPassaram++;
    } else {
      throw new Error('Dados do perfil não retornados');
    }
  } catch (error) {
    console.log(`   ❌ Perfil: FALHOU - ${error.message}`);
    resultados.testes.perfil = { passou: false, erro: error.message };
    resultados.avisos.push('Não foi possível verificar perfil');
  }

  // =====================================================
  // 3. TESTES FINANCEIROS
  // =====================================================
  console.log('\n3️⃣ TESTES FINANCEIROS\n');
  console.log('-'.repeat(70));

  // 3.1. Verificar Saldo Inicial
  let saldoInicial = 0;
  totalTestes++;
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    saldoInicial = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo inicial: R$ ${saldoInicial.toFixed(2)}`);
    resultados.testes.saldo_inicial = { passou: true, saldo: saldoInicial };
    testesPassaram++;
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo inicial: ${error.message}`);
    resultados.testes.saldo_inicial = { passou: false, erro: error.message };
  }

  // 3.2. Criar PIX
  totalTestes++;
  let pixId = null;
  try {
    const response = await axios.post(
      `${BASE_URL}/api/payments/pix/criar`,
      { valor: 5 },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    if (response.data && response.data.data) {
      pixId = response.data.data.payment_id;
      console.log('   ✅ Criar PIX: OK');
      console.log(`   ℹ️  PIX ID: ${pixId}`);
      console.log(`   ℹ️  Valor: R$ 5.00`);
      resultados.testes.criar_pix = { passou: true, pixId };
      testesPassaram++;
    } else {
      throw new Error('Dados do PIX não retornados');
    }
  } catch (error) {
    console.log(`   ❌ Criar PIX: FALHOU - ${error.message}`);
    resultados.testes.criar_pix = { passou: false, erro: error.message };
    resultados.problemas.push('Criação de PIX falhou');
  }

  // =====================================================
  // 4. TESTES DO JOGO
  // =====================================================
  console.log('\n4️⃣ TESTES DO JOGO\n');
  console.log('-'.repeat(70));

  // 4.1. Verificar Saldo Antes do Jogo
  let saldoAntesJogo = 0;
  totalTestes++;
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    saldoAntesJogo = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo antes do jogo: R$ ${saldoAntesJogo.toFixed(2)}`);
    resultados.testes.saldo_antes_jogo = { passou: true, saldo: saldoAntesJogo };
    testesPassaram++;
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo: ${error.message}`);
    resultados.testes.saldo_antes_jogo = { passou: false };
  }

  // 4.2. Fazer Chute no Jogo
  totalTestes++;
  const valorAposta = 5;
  try {
    const response = await axios.post(
      `${BASE_URL}/api/games/shoot`,
      {
        direction: 'left',
        amount: valorAposta
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    if (response.data && response.data.success !== undefined) {
      console.log('   ✅ Chute no Jogo: OK');
      console.log(`   ℹ️  Resultado: ${response.data.result || 'N/A'}`);
      console.log(`   ℹ️  Lote ID: ${response.data.loteId || 'N/A'}`);
      resultados.testes.chute_jogo = { passou: true, resultado: response.data };
      testesPassaram++;
    } else {
      throw new Error('Resposta inválida do jogo');
    }
  } catch (error) {
    console.log(`   ❌ Chute no Jogo: FALHOU - ${error.message}`);
    resultados.testes.chute_jogo = { passou: false, erro: error.message };
    resultados.problemas.push('Jogo não está funcionando');
  }

  // 4.3. Verificar Saldo Após o Jogo
  await sleep(2000); // Aguardar processamento
  totalTestes++;
  let saldoAposJogo = 0;
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    saldoAposJogo = response.data?.data?.saldo || 0;
    const diferenca = saldoAntesJogo - saldoAposJogo;
    
    console.log(`   ℹ️  Saldo após o jogo: R$ ${saldoAposJogo.toFixed(2)}`);
    console.log(`   ℹ️  Diferença: R$ ${diferenca.toFixed(2)}`);
    
    if (Math.abs(diferenca - valorAposta) < 0.01) {
      console.log('   ✅ Débito de Saldo: OK (valor correto)');
      resultados.testes.debito_saldo = { passou: true, diferenca };
      testesPassaram++;
    } else {
      console.log(`   ⚠️  Débito de Saldo: VALOR DIFERENTE (esperado: R$ ${valorAposta}, debitado: R$ ${diferenca.toFixed(2)})`);
      resultados.testes.debito_saldo = { passou: false, diferenca, esperado: valorAposta };
      resultados.avisos.push(`Débito de saldo diferente do esperado: R$ ${diferenca.toFixed(2)} vs R$ ${valorAposta}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo após jogo: ${error.message}`);
    resultados.testes.debito_saldo = { passou: false, erro: error.message };
  }

  // =====================================================
  // 5. TESTES DE INTEGRIDADE DE DADOS
  // =====================================================
  console.log('\n5️⃣ TESTES DE INTEGRIDADE DE DADOS\n');
  console.log('-'.repeat(70));

  // 5.1. Verificar Transações no Banco
  totalTestes++;
  try {
    const { data: transacoes, error } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && transacoes && transacoes.length > 0) {
      console.log(`   ✅ Transações: OK (${transacoes.length} encontradas)`);
      const ultimaTransacao = transacoes[0];
      console.log(`   ℹ️  Última transação: ${ultimaTransacao.tipo} - R$ ${Math.abs(ultimaTransacao.valor).toFixed(2)}`);
      resultados.testes.transacoes = { passou: true, quantidade: transacoes.length };
      testesPassaram++;
    } else {
      throw new Error('Nenhuma transação encontrada');
    }
  } catch (error) {
    console.log(`   ⚠️  Transações: ${error.message}`);
    resultados.testes.transacoes = { passou: false, erro: error.message };
  }

  // =====================================================
  // 6. TESTES DE SEGURANÇA
  // =====================================================
  console.log('\n6️⃣ TESTES DE SEGURANÇA\n');
  console.log('-'.repeat(70));

  // 6.1. Verificar RPCs com Search Path
  totalTestes++;
  try {
    const { data: rpcs, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          proname as function_name,
          proconfig as config
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND proname IN (
          'rpc_add_balance',
          'rpc_deduct_balance',
          'rpc_transfer_balance',
          'rpc_get_balance'
        )
        ORDER BY proname;
      `
    });

    if (!error && rpcs) {
      const rpcsComSearchPath = rpcs.filter(rpc => 
        rpc.config && rpc.config.some(c => c.includes('search_path=public'))
      ).length;

      if (rpcsComSearchPath === 4) {
        console.log(`   ✅ Search Path: OK (${rpcsComSearchPath}/4 RPCs)`);
        resultados.testes.search_path = { passou: true, rpcs: rpcsComSearchPath };
        testesPassaram++;
      } else {
        console.log(`   ⚠️  Search Path: ${rpcsComSearchPath}/4 RPCs`);
        resultados.testes.search_path = { passou: false, rpcs: rpcsComSearchPath };
        resultados.avisos.push(`Apenas ${rpcsComSearchPath}/4 RPCs têm search_path`);
      }
    } else {
      console.log('   ⚠️  Não foi possível verificar search_path');
      resultados.testes.search_path = { passou: false };
    }
  } catch (error) {
    console.log(`   ⚠️  Search Path: ${error.message}`);
    resultados.testes.search_path = { passou: false, erro: error.message };
  }

  // =====================================================
  // 7. RESUMO FINAL
  // =====================================================
  console.log('\n7️⃣ RESUMO FINAL\n');
  console.log('='.repeat(70));

  resultados.percentual = Math.round((testesPassaram / totalTestes) * 100);

  console.log(`\n📊 RESULTADOS:`);
  console.log(`   Total de testes: ${totalTestes}`);
  console.log(`   ✅ Passou: ${testesPassaram}`);
  console.log(`   ❌ Falhou: ${totalTestes - testesPassaram}`);
  console.log(`   📊 Percentual: ${resultados.percentual}%`);

  if (resultados.problemas.length > 0) {
    console.log(`\n❌ PROBLEMAS CRÍTICOS (${resultados.problemas.length}):`);
    resultados.problemas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
  }

  if (resultados.avisos.length > 0) {
    console.log(`\n⚠️  AVISOS (${resultados.avisos.length}):`);
    resultados.avisos.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a}`);
    });
  }

  // Status Final
  if (resultados.percentual === 100 && resultados.problemas.length === 0) {
    console.log(`\n🎉 TODOS OS TESTES PASSARAM!`);
    console.log(`✅ SISTEMA PRONTO PARA LIBERAÇÃO!`);
    resultados.status_final = 'APROVADO_LIBERACAO';
  } else if (resultados.percentual >= 90 && resultados.problemas.length === 0) {
    console.log(`\n✅ TESTES QUASE COMPLETOS (${resultados.percentual}%)`);
    console.log(`⚠️  Verificar avisos antes de liberar`);
    resultados.status_final = 'APROVADO_COM_RESSALVAS';
  } else {
    console.log(`\n❌ TESTES FALHARAM (${resultados.percentual}%)`);
    console.log(`⚠️  CORRIGIR PROBLEMAS ANTES DE LIBERAR`);
    resultados.status_final = 'REPROVADO';
  }

  // =====================================================
  // 8. SALVAR RESULTADOS
  // =====================================================
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '32_testes_finais_pre_producao.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');

  return resultados;
}

testesFinais()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

