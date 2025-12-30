/**
 * VALIDAÇÃO PÓS-MIGRATION V19 - Módulo D
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarPosMigration() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO PÓS-MIGRATION V19');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    tabelas: {},
    colunas: {},
    rls: {},
    policies: {},
    indices: {},
    rpc_functions: {},
    heartbeat: {},
    erros: []
  };
  
  // 1. Verificar tabelas
  console.log('1️⃣ Verificando tabelas...');
  const tabelasEsperadas = ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards', 'system_heartbeat'];
  
  for (const tabela of tabelasEsperadas) {
    try {
      const { data, error } = await supabase.from(tabela).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          resultado.tabelas[tabela] = { existe: false };
          console.log(`   ❌ ${tabela}: NÃO EXISTE`);
        } else {
          resultado.tabelas[tabela] = { existe: true, erro: error.message };
          console.log(`   ✅ ${tabela}: EXISTE`);
        }
      } else {
        resultado.tabelas[tabela] = { existe: true };
        console.log(`   ✅ ${tabela}: EXISTE`);
      }
    } catch (e) {
      resultado.tabelas[tabela] = { existe: false, erro: e.message };
      console.log(`   ⚠️  ${tabela}: ${e.message}`);
    }
  }
  
  // 2. Verificar colunas em lotes
  console.log('\n2️⃣ Verificando colunas em lotes...');
  const colunasEsperadas = ['persisted_global_counter', 'synced_at', 'posicao_atual'];
  
  for (const coluna of colunasEsperadas) {
    try {
      const { data, error } = await supabase.from('lotes').select(`id, ${coluna}`).limit(1);
      if (error && error.message.includes(coluna) && error.message.includes('does not exist')) {
        resultado.colunas[coluna] = { existe: false };
        console.log(`   ❌ ${coluna}: NÃO EXISTE`);
      } else {
        resultado.colunas[coluna] = { existe: true };
        console.log(`   ✅ ${coluna}: EXISTE`);
      }
    } catch (e) {
      resultado.colunas[coluna] = { existe: false, erro: e.message };
      console.log(`   ⚠️  ${coluna}: ${e.message}`);
    }
  }
  
  // 3. Verificar RLS
  console.log('\n3️⃣ Verificando RLS...');
  const tabelasRLS = ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards'];
  
  for (const tabela of tabelasRLS) {
    try {
      // Tentar acesso sem role (deve falhar se RLS ativo)
      const { error } = await supabase.from(tabela).select('id').limit(1);
      // Se não der erro de permissão, RLS pode não estar ativo
      resultado.rls[tabela] = { habilitado: error?.code === '42501' };
      console.log(`   ${error?.code === '42501' ? '✅' : '⚠️ '} ${tabela}: ${error?.code === '42501' ? 'RLS ATIVO' : 'RLS pode não estar ativo'}`);
    } catch (e) {
      resultado.rls[tabela] = { habilitado: false, erro: e.message };
    }
  }
  
  // 4. Verificar RPC Functions
  console.log('\n4️⃣ Verificando RPC Functions...');
  const rpcFunctions = ['rpc_get_or_create_lote', 'rpc_update_lote_after_shot', 'rpc_add_balance', 'rpc_deduct_balance'];
  
  for (const fnName of rpcFunctions) {
    try {
      const { error } = await supabase.rpc(fnName, {});
      if (error && (error.message.includes('does not exist') || error.code === '42883')) {
        resultado.rpc_functions[fnName] = { existe: false };
        console.log(`   ❌ ${fnName}: NÃO EXISTE`);
      } else {
        resultado.rpc_functions[fnName] = { existe: true };
        console.log(`   ✅ ${fnName}: EXISTE`);
      }
    } catch (e) {
      resultado.rpc_functions[fnName] = { existe: false, erro: e.message };
      console.log(`   ⚠️  ${fnName}: ${e.message}`);
    }
  }
  
  // 5. Verificar heartbeat
  console.log('\n5️⃣ Verificando heartbeat...');
  try {
    const { data, error } = await supabase.from('system_heartbeat').select('*').order('last_seen', { ascending: false }).limit(5);
    if (error) {
      resultado.heartbeat = { existe: false, erro: error.message };
      console.log(`   ❌ Heartbeat: ${error.message}`);
    } else {
      resultado.heartbeat = { existe: true, registros: data?.length || 0 };
      console.log(`   ✅ Heartbeat: ${data?.length || 0} registro(s)`);
    }
  } catch (e) {
    resultado.heartbeat = { existe: false, erro: e.message };
    console.log(`   ❌ Heartbeat: ${e.message}`);
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'v19_cursor_run', 'validation', 'report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  validarPosMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarPosMigration };



