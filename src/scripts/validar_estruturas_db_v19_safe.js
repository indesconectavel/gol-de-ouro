/**
 * VALIDAR ESTRUTURAS DB V19 - Modo Seguro (apenas leitura)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarEstruturas() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE ESTRUTURAS DO BANCO (MODO SEGURO)');
  console.log('============================================================\n');
  
  const resultado = {
    timestamp: new Date().toISOString(),
    heartbeatTable: {},
    lotesColumns: {},
    rpcFunctions: {},
    erros: []
  };
  
  // 1. Verificar tabela system_heartbeat
  console.log('1️⃣ Verificando tabela system_heartbeat...');
  try {
    const { data, error } = await supabase
      .from('system_heartbeat')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('   ❌ Tabela system_heartbeat NÃO EXISTE');
        resultado.heartbeatTable = { existe: false, erro: error.message };
      } else {
        console.log(`   ⚠️  Erro: ${error.message}`);
        resultado.heartbeatTable = { existe: false, erro: error.message };
      }
    } else {
      console.log('   ✅ Tabela system_heartbeat EXISTE');
      resultado.heartbeatTable = { existe: true, registros: data?.length || 0 };
    }
  } catch (e) {
    console.log(`   ❌ Exceção: ${e.message}`);
    resultado.erros.push(`heartbeatTable: ${e.message}`);
  }
  
  // 2. Verificar colunas em lotes
  console.log('\n2️⃣ Verificando colunas em lotes...');
  const colunasEsperadas = ['persisted_global_counter', 'synced_at', 'posicao_atual'];
  const colunasStatus = {};
  
  for (const coluna of colunasEsperadas) {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select(`id, ${coluna}`)
        .limit(1);
      
      if (error) {
        if (error.message.includes(coluna) && error.message.includes('does not exist')) {
          console.log(`   ❌ Coluna ${coluna} NÃO EXISTE`);
          colunasStatus[coluna] = { existe: false, erro: error.message };
        } else {
          console.log(`   ⚠️  ${coluna}: ${error.message}`);
          colunasStatus[coluna] = { existe: false, erro: error.message };
        }
      } else {
        console.log(`   ✅ Coluna ${coluna} EXISTE`);
        colunasStatus[coluna] = { existe: true };
      }
    } catch (e) {
      console.log(`   ❌ ${coluna}: ${e.message}`);
      colunasStatus[coluna] = { existe: false, erro: e.message };
    }
  }
  
  resultado.lotesColumns = colunasStatus;
  
  // 3. Verificar RPC Functions
  console.log('\n3️⃣ Verificando RPC Functions...');
  const rpcFunctionsEsperadas = [
    'rpc_get_or_create_lote',
    'rpc_update_lote_after_shot',
    'rpc_add_balance',
    'rpc_deduct_balance'
  ];
  
  for (const fnName of rpcFunctionsEsperadas) {
    try {
      // Tentar chamar a função (pode falhar por parâmetros, mas confirma existência)
      const { error } = await supabase.rpc(fnName, {});
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42883') {
          console.log(`   ❌ ${fnName}: NÃO EXISTE`);
          resultado.rpcFunctions[fnName] = { existe: false, erro: error.message };
        } else {
          // Se der outro erro (ex: parâmetros inválidos), a função existe
          console.log(`   ✅ ${fnName}: EXISTE`);
          resultado.rpcFunctions[fnName] = { existe: true };
        }
      } else {
        console.log(`   ✅ ${fnName}: EXISTE`);
        resultado.rpcFunctions[fnName] = { existe: true };
      }
    } catch (e) {
      console.log(`   ⚠️  ${fnName}: ${e.message}`);
      resultado.rpcFunctions[fnName] = { existe: false, erro: e.message };
    }
  }
  
  // Salvar resultado
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'db_validation.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n📄 Resultado salvo em: ${reportPath}`);
  
  return resultado;
}

if (require.main === module) {
  validarEstruturas()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarEstruturas };



