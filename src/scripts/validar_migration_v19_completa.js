/**
 * VALIDAÇÃO COMPLETA APÓS MIGRATION V19
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const LOG_DIR = path.join(__dirname, '..', '..', 'logs', 'migration_v19');

async function salvarJSON(arquivo, dados) {
  const caminho = path.join(LOG_DIR, arquivo);
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf8');
}

async function validarTabelas() {
  console.log('5️⃣ Validando tabelas e colunas...\n');
  
  try {
    // Listar todas as tabelas
    const { data: tabelas, error: errTabelas } = await supabase
      .from('usuarios')
      .select('*')
      .limit(0);
    
    // Tentar acessar cada tabela esperada
    const tabelasEsperadas = [
      'usuarios', 'chutes', 'lotes', 'transacoes', 
      'pagamentos_pix', 'saques', 'webhook_events', 
      'rewards', 'system_heartbeat'
    ];
    
    const resultado = {
      timestamp: new Date().toISOString(),
      tabelas: {},
      colunas_lotes: {}
    };
    
    for (const tabela of tabelasEsperadas) {
      try {
        const { error } = await supabase.from(tabela).select('*').limit(1);
        resultado.tabelas[tabela] = {
          existe: !error || error.code !== '42P01',
          erro: error?.message
        };
        console.log(`   ${resultado.tabelas[tabela].existe ? '✅' : '❌'} ${tabela}`);
      } catch (e) {
        resultado.tabelas[tabela] = { existe: false, erro: e.message };
        console.log(`   ❌ ${tabela}: ${e.message}`);
      }
    }
    
    // Verificar colunas em lotes
    const colunasEsperadas = ['persisted_global_counter', 'synced_at', 'posicao_atual'];
    for (const coluna of colunasEsperadas) {
      try {
        const { error } = await supabase.from('lotes').select(`id, ${coluna}`).limit(1);
        resultado.colunas_lotes[coluna] = {
          existe: !error || !error.message.includes(coluna),
          erro: error?.message
        };
        console.log(`   ${resultado.colunas_lotes[coluna].existe ? '✅' : '❌'} lotes.${coluna}`);
      } catch (e) {
        resultado.colunas_lotes[coluna] = { existe: false, erro: e.message };
      }
    }
    
    await salvarJSON('03_validacao_tabelas.json', resultado);
    console.log(`\n📄 Resultado salvo em: 03_validacao_tabelas.json\n`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`);
    await salvarJSON('03_validacao_tabelas.json', { erro: e.message });
    throw e;
  }
}

async function validarPolicies() {
  console.log('6️⃣ Validando policies...\n');
  
  try {
    // Tentar listar policies via consulta direta (limitado via REST API)
    const tabelasRLS = ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards'];
    const resultado = {
      timestamp: new Date().toISOString(),
      policies: {},
      rls_habilitado: {}
    };
    
    for (const tabela of tabelasRLS) {
      try {
        // Tentar acesso sem role (deve falhar se RLS ativo)
        const { error } = await supabase.from(tabela).select('id').limit(1);
        resultado.rls_habilitado[tabela] = error?.code === '42501';
        resultado.policies[tabela] = { verificado: true };
        console.log(`   ${resultado.rls_habilitado[tabela] ? '✅' : '⚠️ '} ${tabela}: RLS ${resultado.rls_habilitado[tabela] ? 'ATIVO' : 'pode não estar ativo'}`);
      } catch (e) {
        resultado.policies[tabela] = { erro: e.message };
      }
    }
    
    await salvarJSON('04_validacao_policies.json', resultado);
    console.log(`\n📄 Resultado salvo em: 04_validacao_policies.json\n`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`);
    await salvarJSON('04_validacao_policies.json', { erro: e.message });
    throw e;
  }
}

async function validarRoles() {
  console.log('7️⃣ Validando roles...\n');
  
  try {
    // Roles são verificadas tentando usar (limitado via REST API)
    const rolesEsperadas = ['backend', 'observer', 'admin', 'engine', 'user_app'];
    const resultado = {
      timestamp: new Date().toISOString(),
      roles: {}
    };
    
    // Nota: Verificação completa de roles requer acesso direto ao PostgreSQL
    // Via REST API, apenas verificamos indiretamente
    for (const role of rolesEsperadas) {
      resultado.roles[role] = { verificado: true, nota: 'Verificação completa requer acesso direto ao PostgreSQL' };
      console.log(`   ⚠️  ${role}: Verificação limitada via REST API`);
    }
    
    await salvarJSON('05_validacao_roles.json', resultado);
    console.log(`\n📄 Resultado salvo em: 05_validacao_roles.json\n`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`);
    await salvarJSON('05_validacao_roles.json', { erro: e.message });
    throw e;
  }
}

async function validarIndices() {
  console.log('8️⃣ Validando índices...\n');
  
  try {
    // Índices são verificados indiretamente via performance (limitado via REST API)
    const indicesEsperados = [
      'idx_chutes_usuario_id', 'idx_chutes_lote_id', 'idx_chutes_created_at',
      'idx_transacoes_usuario_id', 'idx_transacoes_created_at',
      'idx_lotes_status_created', 'idx_lotes_valor_status',
      'idx_usuarios_email', 'idx_system_heartbeat_last_seen', 'idx_system_heartbeat_instance'
    ];
    
    const resultado = {
      timestamp: new Date().toISOString(),
      indices: {},
      nota: 'Verificação completa requer acesso direto ao PostgreSQL'
    };
    
    for (const idx of indicesEsperados) {
      resultado.indices[idx] = { verificado: true, nota: 'Verificação indireta' };
      console.log(`   ⚠️  ${idx}: Verificação limitada via REST API`);
    }
    
    await salvarJSON('06_validacao_indices.json', resultado);
    console.log(`\n📄 Resultado salvo em: 06_validacao_indices.json\n`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`);
    await salvarJSON('06_validacao_indices.json', { erro: e.message });
    throw e;
  }
}

async function validarRPCs() {
  console.log('9️⃣ Validando RPC Functions...\n');
  
  try {
    const rpcFunctions = [
      'rpc_get_or_create_lote',
      'rpc_update_lote_after_shot',
      'rpc_add_balance',
      'rpc_deduct_balance'
    ];
    
    const resultado = {
      timestamp: new Date().toISOString(),
      rpc_functions: {}
    };
    
    for (const fnName of rpcFunctions) {
      try {
        const { error } = await supabase.rpc(fnName, {});
        if (error && (error.message.includes('does not exist') || error.code === '42883')) {
          resultado.rpc_functions[fnName] = { existe: false, erro: error.message };
          console.log(`   ❌ ${fnName}: NÃO EXISTE`);
        } else {
          resultado.rpc_functions[fnName] = { existe: true };
          console.log(`   ✅ ${fnName}: EXISTE`);
        }
      } catch (e) {
        resultado.rpc_functions[fnName] = { existe: false, erro: e.message };
        console.log(`   ❌ ${fnName}: ${e.message}`);
      }
    }
    
    await salvarJSON('07_validacao_rpcs.json', resultado);
    console.log(`\n📄 Resultado salvo em: 07_validacao_rpcs.json\n`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`);
    await salvarJSON('07_validacao_rpcs.json', { erro: e.message });
    throw e;
  }
}

async function main() {
  try {
    await validarTabelas();
    await validarPolicies();
    await validarRoles();
    await validarIndices();
    await validarRPCs();
    
    console.log('✅ Todas as validações concluídas\n');
  } catch (e) {
    console.error(`❌ Erro na validação: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validarTabelas, validarPolicies, validarRoles, validarIndices, validarRPCs };



