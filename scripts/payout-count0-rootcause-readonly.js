/**
 * READ-ONLY: Root cause count=0 — mesma query do worker, variações e status reais.
 * Não imprime segredos. Gera: payout-count0-*.json em docs/relatorios.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');
const PENDING = 'pendente';
const PROCESSING = 'processando';
const statusList = [PENDING, 'pending', PROCESSING, 'processando'];

function out(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!(url && url.length > 10);
  const hasServiceKey = !!(key && key.length > 20);
  const sameConfigAsWorker = hasUrl && hasServiceKey;

  // PASSO B — Role/contexto (sem imprimir valores)
  const roleCheck = {
    timestamp_utc: new Date().toISOString(),
    worker_usa_SUPABASE_SERVICE_ROLE_KEY: true,
    worker_usa_SUPABASE_URL: true,
    local_tem_SUPABASE_URL: hasUrl,
    local_tem_SUPABASE_SERVICE_ROLE_KEY: hasServiceKey,
    mesmo_projeto_esperado: sameConfigAsWorker,
    schema_explicito_worker: 'public',
    nota: 'App e worker usam mesmo .env no Fly; diferença seria apenas de processo (app vs payout_worker).'
  };
  out('payout-count0-role-check.json', roleCheck);

  // PASSO A — RLS (inferência; sem acesso a pg_policies pela API)
  const rlsCheck = {
    timestamp_utc: new Date().toISOString(),
    rls_verificado_via_api: false,
    motivo: 'Supabase REST API nao expoe pg_policies. Verificar no Dashboard: Table Editor > saques > RLS.',
    service_role_comportamento: 'Em Supabase, service_role bypassa RLS por padrao.',
    se_count_0_com_service_role: 'Causa provavel nao e RLS; verificar valores de status e filtros.',
    politicas_sugeridas_auditoria: 'Dashboard > Authentication > Policies em saques; ou SQL Editor: SELECT * FROM pg_policies WHERE tablename = \'saques\';'
  };
  out('payout-count0-rls-check.json', rlsCheck);

  if (!sameConfigAsWorker) {
    const visible = { timestamp_utc: new Date().toISOString(), erro: 'SUPABASE nao configurado localmente', queries: {} };
    out('payout-count0-saques-visible.json', visible);
    const statusV = { timestamp_utc: new Date().toISOString(), erro: 'SUPABASE nao configurado', distinct_status: [] };
    out('payout-count0-status-values.json', statusV);
    const wv = { timestamp_utc: new Date().toISOString(), erro: 'Nao foi possivel comparar; config ausente.' };
    out('payout-count0-worker-vs-app.json', wv);
    return;
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });

  const results = { timestamp_utc: new Date().toISOString() };

  // 1) Query EXATA do worker: count
  const { count: exactCount, error: exactError } = await supabase
    .from('saques')
    .select('id', { count: 'exact', head: true })
    .in('status', statusList);
  results.query_exata_worker = {
    statusList,
    count: exactError ? -1 : (exactCount ?? 0),
    error: exactError ? { message: exactError.message, code: exactError.code } : null
  };

  // 2) Só count - variação
  const { count: c2, error: e2 } = await supabase
    .from('saques')
    .select('id', { count: 'exact', head: true })
    .in('status', statusList);
  results.variacao_somente_count = { count: e2 ? -1 : (c2 ?? 0), error: e2 ? e2.message : null };

  // 3) Últimos 20 saques (qualquer status)
  const { data: last20, error: e20 } = await supabase
    .from('saques')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  results.ultimos_20_saques = {
    total: last20 ? last20.length : 0,
    error: e20 ? e20.message : null,
    amostra: (last20 || []).map(r => ({ id: String(r.id).slice(0, 8) + '...', status: r.status, created_at: r.created_at }))
  };

  // 4) Filtro somente processando
  const { count: cProc, error: eProc } = await supabase
    .from('saques')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'processando');
  results.filtro_somente_processando = { count: eProc ? -1 : (cProc ?? 0), error: eProc ? eProc.message : null };

  // 5) Filtro somente pendente
  const { count: cPen, error: ePen } = await supabase
    .from('saques')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente');
  results.filtro_somente_pendente = { count: ePen ? -1 : (cPen ?? 0), error: ePen ? ePen.message : null };

  // 6) Select igual worker limit 1
  const { data: one, error: eOne } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at')
    .in('status', statusList)
    .order('created_at', { ascending: true })
    .limit(1);
  results.select_igual_worker_limit1 = {
    rows: one ? one.length : 0,
    error: eOne ? eOne.message : null,
    primeira: one && one[0] ? { id: String(one[0].id).slice(0, 8) + '...', status: one[0].status } : null
  };

  out('payout-count0-saques-visible.json', results);

  // PASSO E — Valores distintos de status
  const { data: allStatus } = await supabase.from('saques').select('status');
  const distinct = [...new Set((allStatus || []).map(r => r.status).filter(Boolean))];
  const counts = {};
  distinct.forEach(s => {
    counts[s] = (allStatus || []).filter(r => r.status === s).length;
  });
  const statusValues = {
    timestamp_utc: new Date().toISOString(),
    distinct_status: distinct,
    contagem_por_status: counts,
    total_linhas: (allStatus || []).length,
    valores_esperados_worker: statusList,
    conclusao: distinct.includes('processando') ? 'Valor processando existe no banco.' : 'Valor processando NAO encontrado; verificar case/espacos.'
  };
  out('payout-count0-status-values.json', statusValues);

  // PASSO D — Worker vs app
  const workerVsApp = {
    timestamp_utc: new Date().toISOString(),
    cliente_utilizado: 'service_role (mesmo que worker)',
    resultado_count_com_este_cliente: results.query_exata_worker.count,
    app_e_worker_no_fly: 'Usam as mesmas env vars por processo.',
    conclusao: results.query_exata_worker.count === 0
      ? 'Com service_role localmente retorna 0: dados ou filtro explicam count=0.'
      : 'Com service_role localmente retorna >0: em producao pode haver env diferente ou outro fator.'
  };
  out('payout-count0-worker-vs-app.json', workerVsApp);
}

main().catch(err => {
  const outDir = path.join(__dirname, '..', 'docs', 'relatorios');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'payout-count0-saques-visible.json'), JSON.stringify({ timestamp_utc: new Date().toISOString(), erro: err.message }, null, 2), 'utf8');
  process.exit(1);
});
