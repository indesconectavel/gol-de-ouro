/**
 * DIAGNÓSTICO V19 SAFE MODE - Apenas validação, sem alterações
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnosticarV19() {
  console.log('============================================================');
  console.log(' DIAGNÓSTICO V19 - MODO SEGURO');
  console.log('============================================================\n');
  
  const diagnostico = {
    timestamp: new Date().toISOString(),
    servidor: {},
    tabelas: {},
    colunas: {},
    policies: {},
    rpc_functions: {},
    erros: []
  };
  
  // 1. Verificar tabela system_heartbeat
  console.log('1️⃣ Verificando tabela system_heartbeat...');
  try {
    const { data, error } = await supabase
      .from('system_heartbeat')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('   ❌ Tabela system_heartbeat NÃO EXISTE');
        diagnostico.tabelas.system_heartbeat = { existe: false, erro: error.message };
      } else {
        console.log(`   ⚠️  Erro ao verificar: ${error.message}`);
        diagnostico.tabelas.system_heartbeat = { existe: false, erro: error.message };
      }
    } else {
      console.log('   ✅ Tabela system_heartbeat EXISTE');
      diagnostico.tabelas.system_heartbeat = { existe: true };
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    diagnostico.erros.push(`system_heartbeat: ${e.message}`);
  }
  
  // 2. Verificar coluna persisted_global_counter em lotes
  console.log('\n2️⃣ Verificando coluna persisted_global_counter em lotes...');
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select('id, persisted_global_counter')
      .limit(1);
    
    if (error) {
      if (error.message.includes('persisted_global_counter') && error.message.includes('does not exist')) {
        console.log('   ❌ Coluna persisted_global_counter NÃO EXISTE');
        diagnostico.colunas.persisted_global_counter = { existe: false, erro: error.message };
      } else {
        console.log(`   ⚠️  Erro: ${error.message}`);
        diagnostico.colunas.persisted_global_counter = { existe: false, erro: error.message };
      }
    } else {
      console.log('   ✅ Coluna persisted_global_counter EXISTE');
      diagnostico.colunas.persisted_global_counter = { existe: true };
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    diagnostico.erros.push(`persisted_global_counter: ${e.message}`);
  }
  
  // 3. Verificar policies esperadas
  console.log('\n3️⃣ Verificando policies V19...');
  const policiesEsperadas = [
    'usuarios_select_backend',
    'usuarios_update_backend',
    'chutes_select_backend',
    'chutes_insert_backend',
    'lotes_select_backend',
    'lotes_insert_backend',
    'lotes_update_backend',
    'transacoes_select_backend',
    'transacoes_insert_backend',
    'transacoes_update_backend'
  ];
  
  try {
    const { data: policies, error } = await supabase
      .rpc('pg_policies_list', { schema_name: 'public' })
      .catch(() => {
        // Fallback: tentar query direta
        return supabase
          .from('pg_policies')
          .select('policyname')
          .eq('schemaname', 'public');
      });
    
    if (error) {
      console.log(`   ⚠️  Não foi possível listar policies: ${error.message}`);
      diagnostico.policies.status = 'nao_verificado';
    } else {
      const policiesExistentes = policies?.map(p => p.policyname || p.policyname) || [];
      const policiesFaltando = policiesEsperadas.filter(p => !policiesExistentes.includes(p));
      
      if (policiesFaltando.length === 0) {
        console.log(`   ✅ Todas as ${policiesEsperadas.length} policies esperadas existem`);
        diagnostico.policies.status = 'completo';
        diagnostico.policies.total = policiesEsperadas.length;
      } else {
        console.log(`   ⚠️  ${policiesFaltando.length} policy(s) faltando`);
        diagnostico.policies.status = 'incompleto';
        diagnostico.policies.faltando = policiesFaltando;
      }
    }
  } catch (e) {
    console.log(`   ⚠️  Não foi possível verificar policies: ${e.message}`);
    diagnostico.policies.status = 'erro';
  }
  
  // 4. Verificar RPC Functions
  console.log('\n4️⃣ Verificando RPC Functions...');
  const rpcFunctionsEsperadas = [
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'rpc_add_balance',
    'rpc_deduct_balance'
  ];
  
  const rpcStatus = {};
  
  for (const rpcName of rpcFunctionsEsperadas) {
    try {
      // Tentar chamar a função (com parâmetros mínimos ou vazios)
      const { error } = await supabase.rpc(rpcName, {});
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log(`   ❌ ${rpcName}: NÃO EXISTE`);
          rpcStatus[rpcName] = { existe: false };
        } else {
          // Se der outro erro (ex: parâmetros inválidos), a função existe
          console.log(`   ✅ ${rpcName}: EXISTE`);
          rpcStatus[rpcName] = { existe: true };
        }
      } else {
        console.log(`   ✅ ${rpcName}: EXISTE`);
        rpcStatus[rpcName] = { existe: true };
      }
    } catch (e) {
      console.log(`   ⚠️  ${rpcName}: Erro ao verificar - ${e.message}`);
      rpcStatus[rpcName] = { existe: false, erro: e.message };
    }
  }
  
  diagnostico.rpc_functions = rpcStatus;
  
  // Resumo
  console.log('\n============================================================');
  console.log(' RESUMO DO DIAGNÓSTICO');
  console.log('============================================================\n');
  
  const tabelaHeartbeatOk = diagnostico.tabelas.system_heartbeat?.existe === true;
  const colunaPersistedOk = diagnostico.colunas.persisted_global_counter?.existe === true;
  
  if (!tabelaHeartbeatOk || !colunaPersistedOk) {
    console.log('❌ MIGRATION V19 NÃO APLICADA');
    console.log('\nElementos faltando:');
    if (!tabelaHeartbeatOk) console.log('  - Tabela system_heartbeat');
    if (!colunaPersistedOk) console.log('  - Coluna persisted_global_counter em lotes');
  } else {
    console.log('✅ Migration V19 parece estar aplicada');
  }
  
  // Salvar diagnóstico
  const fs = require('fs').promises;
  const path = require('path');
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'diagnostico_v19_safe.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(diagnostico, null, 2));
  
  console.log(`\n📄 Diagnóstico salvo: ${reportPath}`);
  
  return diagnostico;
}

if (require.main === module) {
  diagnosticarV19()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { diagnosticarV19 };

