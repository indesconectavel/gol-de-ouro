/**
 * POST MIGRATION CHECKS - Validações pós-migration
 * Gera post_migration_checks.json com resultados de todas as verificações
 */

const fs = require('fs').promises;
const path = require('path');
const { supabaseAdmin } = require('../../database/supabase-config');

const CHECKS_FILE = path.join(__dirname, '..', '..', 'post_migration_checks.json');

const checks = {
  timestamp: new Date().toISOString(),
  version: 'V19.0.0',
  resultados: {}
};

async function verificarRLS() {
  const tabelas = ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards'];
  const resultados = {};

  for (const tabela of tabelas) {
    const { data, error } = await supabaseAdmin
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', tabela)
      .single()
      .catch(() => ({ data: null, error: { message: 'Query não disponível' } }));

    resultados[tabela] = {
      rls_enabled: !error && data?.rowsecurity === true,
      query: `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = '${tabela}'`,
      resultado: data?.rowsecurity || null,
      erro: error?.message
    };
  }

  return resultados;
}

async function verificarIndices() {
  const indicesEsperados = [
    'idx_chutes_usuario_id',
    'idx_chutes_lote_id',
    'idx_chutes_created_at',
    'idx_transacoes_usuario_id',
    'idx_transacoes_created_at',
    'idx_lotes_status',
    'idx_lotes_valor_aposta'
  ];

  const { data, error } = await supabaseAdmin
    .from('pg_indexes')
    .select('indexname')
    .eq('schemaname', 'public')
    .in('indexname', indicesEsperados)
    .catch(() => ({ data: [], error: null }));

  const indicesExistentes = data?.map(i => i.indexname) || [];
  const indicesFaltando = indicesEsperados.filter(idx => !indicesExistentes.includes(idx));

  return {
    esperados: indicesEsperados.length,
    existentes: indicesExistentes.length,
    faltando: indicesFaltando.length,
    indices: indicesExistentes,
    faltando_lista: indicesFaltando,
    query: `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (${indicesEsperados.map(i => `'${i}'`).join(', ')})`
  };
}

async function verificarPolicies() {
  const { data, error } = await supabaseAdmin
    .from('pg_policies')
    .select('tablename, policyname, cmd')
    .eq('schemaname', 'public')
    .in('tablename', ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques', 'webhook_events', 'rewards'])
    .catch(() => ({ data: [], error: null }));

  return {
    total: data?.length || 0,
    policies: data || [],
    query: `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public'`
  };
}

async function verificarColunasLotes() {
  const { data, error } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'lotes')
    .in('column_name', ['persisted_global_counter', 'synced_at', 'posicao_atual'])
    .catch(() => ({ data: [], error: null }));

  const colunasExistentes = data?.map(c => c.column_name) || [];
  const colunasEsperadas = ['persisted_global_counter', 'synced_at', 'posicao_atual'];
  const colunasFaltando = colunasEsperadas.filter(c => !colunasExistentes.includes(c));

  return {
    esperadas: colunasEsperadas.length,
    existentes: colunasExistentes.length,
    faltando: colunasFaltando.length,
    colunas: colunasExistentes,
    faltando_lista: colunasFaltando
  };
}

async function verificarSystemHeartbeat() {
  const { data, error } = await supabaseAdmin
    .from('system_heartbeat')
    .select('*')
    .limit(1)
    .single();

  return {
    tabela_existe: !error,
    pode_consultar: !error,
    erro: error?.message,
    query: 'SELECT * FROM system_heartbeat LIMIT 1'
  };
}

async function verificarRPCFunctions() {
  const functions = ['rpc_get_or_create_lote', 'rpc_update_lote_after_shot', 'rpc_add_balance', 'rpc_deduct_balance'];
  const resultados = {};

  for (const funcName of functions) {
    const { data, error } = await supabaseAdmin.rpc('pg_get_function_status', {
      p_function_name: funcName
    }).catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

    resultados[funcName] = {
      existe: !error,
      erro: error?.message
    };
  }

  return resultados;
}

async function executarChecks() {
  console.log('🔍 Executando verificações pós-migration...\n');

  checks.resultados.rls = await verificarRLS();
  console.log('✅ RLS verificado');

  checks.resultados.indices = await verificarIndices();
  console.log('✅ Índices verificado');

  checks.resultados.policies = await verificarPolicies();
  console.log('✅ Policies verificado');

  checks.resultados.colunas_lotes = await verificarColunasLotes();
  console.log('✅ Colunas de lotes verificado');

  checks.resultados.system_heartbeat = await verificarSystemHeartbeat();
  console.log('✅ system_heartbeat verificado');

  checks.resultados.rpc_functions = await verificarRPCFunctions();
  console.log('✅ RPC functions verificado');

  // Salvar resultados
  await fs.writeFile(CHECKS_FILE, JSON.stringify(checks, null, 2), 'utf8');
  console.log(`\n✅ Resultados salvos em: ${CHECKS_FILE}`);

  return checks;
}

if (require.main === module) {
  executarChecks().then(() => {
    process.exit(0);
  }).catch(e => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
}

module.exports = { executarChecks };

