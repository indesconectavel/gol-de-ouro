/**
 * AUDITORIA CHECK - Script de auditoria contínua
 * Executa verificações a cada 5 minutos (via cron)
 */

const fs = require('fs').promises;
const path = require('path');
const { supabaseAdmin } = require('../../database/supabase-config');
const axios = require('axios');

const AUDIT_DIR = path.join(__dirname, '..', '..', 'docs', 'audit');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

async function verificarRLS() {
  const tabelasCriticas = ['usuarios', 'chutes', 'lotes', 'transacoes', 'pagamentos_pix', 'saques'];
  const resultados = {};

  for (const tabela of tabelasCriticas) {
    const { data, error } = await supabaseAdmin.rpc('pg_get_rls_status', {
      p_table_name: tabela
    }).catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

    resultados[tabela] = {
      rls_enabled: !error && data?.rls_enabled !== false,
      error: error?.message
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
    faltando: indicesFaltando
  };
}

async function verificarLotes() {
  const { data: lotesAtivos, error: lotesError } = await supabaseAdmin
    .from('lotes')
    .select('id', { count: 'exact' })
    .eq('status', 'ativo');

  const { data: lotesCompletos, error: completosError } = await supabaseAdmin
    .from('lotes')
    .select('id', { count: 'exact' })
    .eq('status', 'completed');

  return {
    ativos: lotesError ? 0 : (lotesAtivos?.length || 0),
    completos: completosError ? 0 : (lotesCompletos?.length || 0),
    erro: lotesError?.message || completosError?.message
  };
}

async function verificarLatencia() {
  try {
    const response = await axios.get('http://localhost:8080/monitor', {
      timeout: 5000
    });
    
    return {
      latencia_media_ms: response.data?.metrics?.latencia_media_chute_ms || 0,
      chutes_por_minuto: response.data?.metrics?.chutes_por_minuto || 0
    };
  } catch (e) {
    return {
      latencia_media_ms: null,
      chutes_por_minuto: null,
      erro: e.message
    };
  }
}

async function verificarLogsErro() {
  // Verificar últimos logs de erro (implementar conforme sistema de logs)
  return {
    erros_ultima_hora: 0,
    warnings_ultima_hora: 0
  };
}

async function verificarHeartbeat() {
  const { data, error } = await supabaseAdmin
    .from('system_heartbeat')
    .select('*')
    .order('last_seen', { ascending: false })
    .limit(10);

  if (error) {
    return {
      instancias_ativas: 0,
      ultimo_heartbeat: null,
      alertas: ['Erro ao verificar heartbeat']
    };
  }

  const agora = new Date();
  const instanciasAtivas = data.filter(h => {
    const lastSeen = new Date(h.last_seen);
    const diffMs = agora - lastSeen;
    return diffMs < 15000; // 15 segundos
  });

  const alertas = [];
  data.forEach(h => {
    const lastSeen = new Date(h.last_seen);
    const diffMs = agora - lastSeen;
    if (diffMs > 15000) {
      alertas.push(`Instância ${h.instance_id} sem heartbeat há ${Math.round(diffMs / 1000)}s`);
    }
  });

  return {
    instancias_ativas: instanciasAtivas.length,
    total_instancias: data.length,
    ultimo_heartbeat: data[0]?.last_seen || null,
    alertas: alertas
  };
}

async function enviarWebhook(relatorio) {
  const webhookUrl = process.env.AUDIT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, {
      text: `🔍 Auditoria V19 - ${new Date().toISOString()}\n` +
            `RLS: ${Object.values(relatorio.rls).filter(r => r.rls_enabled).length}/${Object.keys(relatorio.rls).length} habilitado\n` +
            `Índices: ${relatorio.indices.existentes}/${relatorio.indices.esperados} existentes\n` +
            `Lotes ativos: ${relatorio.lotes.ativos}\n` +
            `Alertas: ${relatorio.alertas.length}`
    });
  } catch (e) {
    console.error('❌ Erro ao enviar webhook:', e.message);
  }
}

async function executarAuditoria() {
  await ensureDir(AUDIT_DIR);

  console.log('🔍 Executando auditoria contínua...');

  const relatorio = {
    timestamp: new Date().toISOString(),
    rls: await verificarRLS(),
    indices: await verificarIndices(),
    lotes: await verificarLotes(),
    latencia: await verificarLatencia(),
    logs: await verificarLogsErro(),
    heartbeat: await verificarHeartbeat(),
    alertas: []
  };

  // Detectar problemas críticos
  if (relatorio.indices.faltando.length > 0) {
    relatorio.alertas.push(`Índices faltando: ${relatorio.indices.faltando.join(', ')}`);
  }

  const tabelasSemRLS = Object.entries(relatorio.rls)
    .filter(([_, r]) => !r.rls_enabled)
    .map(([tabela, _]) => tabela);
  
  if (tabelasSemRLS.length > 0) {
    relatorio.alertas.push(`Tabelas sem RLS: ${tabelasSemRLS.join(', ')}`);
  }

  if (relatorio.heartbeat.alertas.length > 0) {
    relatorio.alertas.push(...relatorio.heartbeat.alertas);
  }

  // Salvar relatório
  const relatorioFile = path.join(AUDIT_DIR, 'latest-audit.json');
  await fs.writeFile(relatorioFile, JSON.stringify(relatorio, null, 2), 'utf8');

  console.log(`✅ Auditoria concluída: ${relatorio.alertas.length} alerta(s)`);

  // Enviar webhook se houver alertas críticos
  if (relatorio.alertas.length > 0) {
    await enviarWebhook(relatorio);
  }

  return relatorio;
}

if (require.main === module) {
  executarAuditoria().then(() => {
    process.exit(0);
  }).catch(e => {
    console.error('❌ Erro na auditoria:', e);
    process.exit(1);
  });
}

module.exports = { executarAuditoria };

