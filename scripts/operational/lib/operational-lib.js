/**
 * V1.2E — Biblioteca operacional read-only (watchdogs, verificação contínua).
 * Não altera produção, banco, deploy ou runtime.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const CERTIFIED_BASELINE = {
  certRef: 'V1.1G+V1.2A+V1.2B+V1.2C',
  gitCommit: 'a83c3cffcc998ed3d1bd8d2e88619a9b03afb634',
  gitCommitShort: 'a83c3cf',
  flyVersion: 461,
  playerBundle: 'index-B6M2smS9.js',
};

const FIN_BASELINE_DEFAULTS = {
  approved_without_ledger: 34,
  pix_pending_old: 54,
  payout_confirmado: 0,
  dups_corr_tipo: 0,
  saldo_negativo: 0,
  falha_payout: 13,
  rollback: 0,
  reconcile_backlog_pending: 0,
};

const PROD_REF = 'gayopagjdrkcmkirmfvy';
const API_BASE = process.env.PROD_API_BASE || 'https://goldeouro-backend-v2.fly.dev';
const FLY_APP = process.env.V12E_FLY_APP || 'goldeouro-backend-v2';
const PLAYER_URLS = (
  process.env.V12E_PLAYER_URLS ||
  'https://www.goldeouro.lol,https://app.goldeouro.lol'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const PENDING_OLD_DAYS = Number(process.env.V12E_PENDING_OLD_DAYS || 7);
const STUCK_HOURS = Number(process.env.V12E_STUCK_HOURS || 24);
const RECENT_HOURS = Number(process.env.V12E_RECENT_HOURS || 72);

function rel(...parts) {
  return path.join(REPO_ROOT, ...parts);
}

function runCmd(cmd, opts = {}) {
  try {
    return {
      ok: true,
      stdout: execSync(cmd, {
        encoding: 'utf8',
        timeout: opts.timeout || 35000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim(),
    };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.message || '').trim(), stdout: (e.stdout || '').trim() };
  }
}

async function fetchHttp(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), ...opts });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  return { status: res.status, json, text: text.slice(0, 800) };
}

function normSha(s) {
  return String(s || '').trim().toLowerCase();
}

function shaMatch(a, b) {
  const x = normSha(a);
  const y = normSha(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y.slice(0, 7)) || y.startsWith(x.slice(0, 7));
}

function loadBaselineV12a() {
  const candidates = [
    rel('docs', 'relatorios', 'V1-2A-RUNTIME-FINANCIAL-HEALTH-DATA-2026-05-18.json'),
    rel('docs', 'relatorios', 'V1-2A-RUNTIME-FINANCIAL-HEALTH-DATA-2026-05-19.json'),
  ];
  const b = { ...FIN_BASELINE_DEFAULTS, ...CERTIFIED_BASELINE, source: 'defaults' };
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      const fin = d.finance_inbound || {};
      return {
        ...b,
        source: path.basename(p),
        gitCommit: d.baseline?.gitCommit || b.gitCommit,
        flyVersion: d.baseline?.flyVersion ?? b.flyVersion,
        approved_without_ledger: fin.approved_without_ledger ?? b.approved_without_ledger,
        pix_pending_old: fin.pix_pending_old ?? b.pix_pending_old,
        payout_confirmado: fin.payout_confirmado ?? fin.ledger_by_tipo?.payout_confirmado ?? b.payout_confirmado,
        dups_corr_tipo: fin.dups_corr_tipo ?? b.dups_corr_tipo,
        saldo_negativo: fin.saldo_negativo ?? b.saldo_negativo,
        falha_payout: fin.falha_payout ?? fin.ledger_by_tipo?.falha_payout ?? b.falha_payout,
        rollback: fin.rollback ?? fin.ledger_by_tipo?.rollback ?? b.rollback,
        reconcile_backlog_pending: fin.reconcile_backlog_pending ?? b.reconcile_backlog_pending,
      };
    } catch {
      /* next */
    }
  }
  return b;
}

function statusFromIssues({ critical = 0, high = 0, medium = 0 }) {
  if (critical > 0) return 'RED';
  if (high > 0) return 'YELLOW';
  if (medium > 0) return 'YELLOW';
  return 'GREEN';
}

function scoreToStatus(score) {
  if (score >= 90) return 'GREEN';
  if (score >= 70) return 'YELLOW';
  return 'RED';
}

function computeDomainScore(checks) {
  const weights = checks.filter((c) => c.weight != null);
  if (!weights.length) return 100;
  let total = 0;
  let wsum = 0;
  for (const c of weights) {
    total += (c.pass ? 1 : 0) * c.weight;
    wsum += c.weight;
  }
  return wsum ? Math.round((total / wsum) * 100) : 100;
}

async function collectRuntimeHealth() {
  const rt = { checks: [], issues: [] };
  const bl = CERTIFIED_BASELINE;

  const meta = await fetchHttp(`${API_BASE}/meta`);
  const gitCommit =
    meta.json?.gitCommit ||
    meta.json?.data?.gitCommit ||
    meta.json?.data?.git?.commit ||
    '';
  rt.meta = { status: meta.status, gitCommit };
  const metaOk = meta.status === 200;
  const shaOk = shaMatch(gitCommit, bl.gitCommit);
  rt.checks.push({ id: 'RT-01', name: '/meta', pass: metaOk, weight: 10 });
  rt.checks.push({ id: 'RT-02', name: 'SHA runtime vs certificado', pass: shaOk, weight: 15 });
  if (!metaOk) rt.issues.push({ severity: 'critical', id: 'RT-01', message: '/meta indisponível' });
  if (!shaOk && !process.env.V12E_DEPLOY_JUSTIFICATION) {
    rt.issues.push({
      severity: 'high',
      id: 'RT-02',
      message: `SHA drift: live ${String(gitCommit).slice(0, 12)} vs ${bl.gitCommitShort}`,
    });
  }

  const health = await fetchHttp(`${API_BASE}/health`);
  const healthOk =
    health.status === 200 && (health.json?.status === 'ok' || health.json?.ok === true);
  rt.health = { status: health.status, ok: healthOk, body: health.json };
  rt.checks.push({ id: 'RT-03', name: '/health', pass: healthOk, weight: 20 });
  if (!healthOk) rt.issues.push({ severity: 'critical', id: 'RT-03', message: '/health unhealthy' });

  const workers = await fetchHttp(`${API_BASE}/health/workers`);
  rt.workers = { status: workers.status, data: workers.json?.data || workers.json };
  const workersOk = workers.status === 200;
  rt.checks.push({ id: 'RT-04', name: '/health/workers', pass: workersOk, weight: 10 });
  if (!workersOk) rt.issues.push({ severity: 'high', id: 'RT-04', message: '/health/workers falhou' });

  const fly = runCmd(`flyctl releases -a ${FLY_APP} --json`, { timeout: 30000 });
  if (fly.ok) {
    try {
      const list = JSON.parse(fly.stdout);
      const latest = list[0];
      rt.fly = {
        latest_version: latest?.Version,
        status: latest?.Status,
        created_at: latest?.CreatedAt,
      };
      const flyOk = Number(latest?.Version) === bl.flyVersion;
      rt.checks.push({ id: 'RT-05', name: 'Fly release certificada', pass: flyOk, weight: 15 });
      if (!flyOk) {
        rt.issues.push({
          severity: 'high',
          id: 'RT-05',
          message: `Release inesperada: v${latest?.Version} (esperado v${bl.flyVersion})`,
        });
      }
    } catch (e) {
      rt.fly = { error: e.message };
      rt.checks.push({ id: 'RT-05', name: 'Fly release', pass: null, weight: 15 });
    }
  } else {
    rt.fly = { error: fly.error };
    rt.checks.push({ id: 'RT-05', name: 'Fly release', pass: null, weight: 15 });
    rt.issues.push({ severity: 'medium', id: 'RT-05', message: `flyctl indisponível: ${fly.error}` });
  }

  rt.player = {};
  let bundleOk = false;
  for (const url of PLAYER_URLS) {
    try {
      const page = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
      const html = await page.text();
      const bundle = html.match(/index-[A-Za-z0-9_-]+\.js/)?.[0] || null;
      const match = html.includes(bl.playerBundle);
      if (match) bundleOk = true;
      rt.player[url] = { status: page.status, bundle, baseline_match: match };
    } catch (e) {
      rt.player[url] = { error: e.message };
    }
  }
  rt.checks.push({ id: 'RT-06', name: 'Bundle player', pass: bundleOk, weight: 10 });
  if (!bundleOk) rt.issues.push({ severity: 'high', id: 'RT-06', message: 'Bundle player divergente ou inacessível' });

  const crit = rt.issues.filter((i) => i.severity === 'critical').length;
  const high = rt.issues.filter((i) => i.severity === 'high').length;
  const med = rt.issues.filter((i) => i.severity === 'medium').length;
  rt.score = computeDomainScore(rt.checks.filter((c) => c.pass !== null));
  rt.status = statusFromIssues({ critical: crit, high, medium: med });
  return rt;
}

async function collectFinancialMetrics() {
  const baseline = loadBaselineV12a();
  const fin = { baseline, metrics: {}, diff: {}, issues: [], checks: [] };
  const url = process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.includes(PROD_REF) || !key) {
    fin.error = 'Supabase prod env ausente';
    fin.complete = false;
    fin.status = 'YELLOW';
    fin.issues.push({ severity: 'medium', id: 'FIN-00', message: fin.error });
    return fin;
  }

  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const norm = (s) => String(s || '').trim().toLowerCase();
  fin.complete = true;

  const { data: pixAll, error: pixErr } = await sb
    .from('pagamentos_pix')
    .select('payment_id, status, approved_at, updated_at, created_at, reconcile_skip');
  if (pixErr) {
    fin.error = pixErr.message;
    fin.complete = false;
    fin.status = 'YELLOW';
    return fin;
  }

  const pendingOldCut = Date.now() - PENDING_OLD_DAYS * 86400000;
  let pendingOld = 0;
  let reconcileBacklog = 0;
  const approvedSet = new Set();
  for (const p of pixAll || []) {
    const st = norm(p.status);
    if (st === 'approved') approvedSet.add(p.payment_id);
    else if (st === 'pending') {
      const t = new Date(p.updated_at || p.created_at || 0).getTime();
      if (t < pendingOldCut) pendingOld++;
      if (!p.reconcile_skip) reconcileBacklog++;
    }
  }

  const { data: ledgers, error: ledErr } = await sb
    .from('ledger_financeiro')
    .select('correlation_id, tipo');
  if (ledErr) {
    fin.error = ledErr.message;
    fin.complete = false;
    return fin;
  }

  const depositos = (ledgers || []).filter((l) => norm(l.tipo) === 'deposito');
  const byKey = {};
  const tipoCounts = {};
  for (const r of ledgers || []) {
    const k = `${r.correlation_id}||${r.tipo}`;
    byKey[k] = (byKey[k] || 0) + 1;
    const t = norm(r.tipo);
    tipoCounts[t] = (tipoCounts[t] || 0) + 1;
  }
  const ledgerDepIds = new Set(depositos.map((l) => l.correlation_id));
  const approvedWithoutLedger = [...approvedSet].filter((id) => !ledgerDepIds.has(id)).length;

  const { data: users } = await sb.from('usuarios').select('saldo');
  const saldoNeg = (users || []).filter((u) => Number(u.saldo) < 0).length;

  const { data: saques } = await sb.from('saques').select('status, updated_at, created_at');
  let stuck = 0;
  const stuckCut = Date.now() - STUCK_HOURS * 3600000;
  for (const s of saques || []) {
    const st = norm(s.status);
    const t = new Date(s.updated_at || s.created_at || 0).getTime();
    if (st === 'processando' && t < stuckCut) stuck++;
    if ((st === 'pendente' || st === 'pending') && t < stuckCut) stuck++;
  }

  fin.metrics = {
    dups_corr_tipo: Object.values(byKey).filter((n) => n > 1).length,
    saldo_negativo: saldoNeg,
    approved_without_ledger: approvedWithoutLedger,
    pix_pending_old: pendingOld,
    payout_confirmado: tipoCounts.payout_confirmado || 0,
    falha_payout: tipoCounts.falha_payout || 0,
    rollback: tipoCounts.rollback || 0,
    rollback_manual: tipoCounts.rollback_manual || 0,
    reconcile_backlog_pending: reconcileBacklog,
    saques_stuck: stuck,
  };

  const bl = baseline;
  fin.diff = {
    approved_without_ledger: fin.metrics.approved_without_ledger - bl.approved_without_ledger,
    pix_pending_old: fin.metrics.pix_pending_old - bl.pix_pending_old,
    falha_payout: fin.metrics.falha_payout - bl.falha_payout,
    rollback: fin.metrics.rollback - (bl.rollback || 0),
    dups_corr_tipo: fin.metrics.dups_corr_tipo - bl.dups_corr_tipo,
    saldo_negativo: fin.metrics.saldo_negativo - bl.saldo_negativo,
  };

  const spikeRollback = Number(process.env.V12E_ROLLBACK_SPIKE_DELTA || 2);
  const spikeFalha = Number(process.env.V12E_FALHA_PAYOUT_SPIKE_DELTA || 3);

  const rules = [
    {
      id: 'FIN-C01',
      pass: fin.metrics.saldo_negativo === 0,
      severity: 'critical',
      msg: 'Saldo negativo detectado',
    },
    {
      id: 'FIN-C02',
      pass: fin.metrics.dups_corr_tipo === 0,
      severity: 'critical',
      msg: 'Duplicatas ledger',
    },
    {
      id: 'FIN-A01',
      pass: fin.metrics.approved_without_ledger <= bl.approved_without_ledger,
      severity: 'high',
      msg: 'approved sem ledger acima do baseline',
    },
    {
      id: 'FIN-A02',
      pass: fin.metrics.pix_pending_old <= bl.pix_pending_old,
      severity: 'high',
      msg: 'pending antigos acima do baseline',
    },
    {
      id: 'FIN-A03',
      pass: fin.diff.rollback < spikeRollback,
      severity: 'high',
      msg: 'rollback spike',
    },
    {
      id: 'FIN-A04',
      pass: fin.diff.falha_payout < spikeFalha,
      severity: 'high',
      msg: 'falha_payout spike',
    },
    {
      id: 'FIN-A05',
      pass: fin.metrics.saques_stuck === 0,
      severity: 'high',
      msg: 'saques presos',
    },
    {
      id: 'FIN-M01',
      pass: fin.metrics.reconcile_backlog_pending <= Math.max(bl.reconcile_backlog_pending || 0, 100),
      severity: 'medium',
      msg: 'backlog reconcile elevado',
    },
  ];

  for (const r of rules) {
    fin.checks.push({ id: r.id, pass: r.pass, weight: r.severity === 'critical' ? 20 : 10 });
    if (!r.pass) fin.issues.push({ severity: r.severity, id: r.id, message: r.msg, metrics: fin.metrics });
  }

  const crit = fin.issues.filter((i) => i.severity === 'critical').length;
  const high = fin.issues.filter((i) => i.severity === 'high').length;
  const med = fin.issues.filter((i) => i.severity === 'medium').length;
  fin.score = computeDomainScore(fin.checks);
  fin.status = statusFromIssues({ critical: crit, high, medium: med });
  fin.thresholds = {
    rollback_spike_delta: spikeRollback,
    falha_payout_spike_delta: spikeFalha,
    pending_old_days: PENDING_OLD_DAYS,
  };
  return fin;
}

async function collectSecuritySurface() {
  const sec = { probes: [], issues: [], checks: [] };
  const body = { action: 'payment.updated', data: { id: '000000000000000' } };
  const headers = { 'Content-Type': 'application/json' };

  const routes = [
    { id: 'SEC-01', route: 'POST /api/payments/webhook', url: `${API_BASE}/api/payments/webhook`, body },
    {
      id: 'SEC-02',
      route: 'POST /webhooks/mercadopago',
      url: `${API_BASE}/webhooks/mercadopago`,
      body: { type: 'payment', data: { id: '000000000000000' } },
    },
  ];

  for (const r of routes) {
    const res = await fetchHttp(r.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(r.body),
    });
    const pass401 = res.status === 401;
    sec.probes.push({ ...r, status: res.status, pass: pass401 });
    sec.checks.push({ id: r.id, name: r.route, pass: pass401, weight: 25 });
    if (!pass401) {
      sec.issues.push({
        severity: 'critical',
        id: r.id,
        message: `${r.route} retornou ${res.status} sem assinatura (esperado 401)`,
      });
    }
  }

  const logs = sampleFlyLogs();
  sec.fly_logs = logs;
  const rejectThreshold = Number(process.env.V12E_WEBHOOK_REJECT_SPIKE || 15);
  const floodOk = !logs.available || logs.webhook_rejected_total < rejectThreshold;
  sec.checks.push({ id: 'SEC-03', name: 'Flood webhook rejected', pass: floodOk, weight: 15 });
  if (!floodOk) {
    sec.issues.push({
      severity: 'high',
      id: 'SEC-03',
      message: `Flood indicators: ${logs.webhook_rejected_total} rejected em amostra Fly`,
    });
  }

  const replayHint = logs.replay_indicators || 0;
  const replayOk = replayHint < Number(process.env.V12E_REPLAY_INDICATORS_MAX || 5);
  sec.checks.push({ id: 'SEC-04', name: 'Replay indicators', pass: replayOk, weight: 10 });
  if (!replayOk) {
    sec.issues.push({
      severity: 'medium',
      id: 'SEC-04',
      message: `Possíveis replays na amostra: ${replayHint}`,
    });
  }

  sec.headers_minimal = {
    note: 'Probes usam apenas Content-Type; HMAC ausente deve resultar 401',
    hmac_drift: 'Comparar taxa rejected vs baseline V1.2B em execução contínua',
  };

  const unexpected = await fetchHttp(`${API_BASE}/api/internal/nonexistent-probe-v12e`, {
    method: 'GET',
  });
  sec.unexpected_endpoint_probe = {
    path: '/api/internal/nonexistent-probe-v12e',
    status: unexpected.status,
    pass: unexpected.status === 404 || unexpected.status === 401 || unexpected.status === 403,
  };
  sec.checks.push({
    id: 'SEC-05',
    name: 'Endpoint inesperado não exposto',
    pass: sec.unexpected_endpoint_probe.pass,
    weight: 5,
  });

  const crit = sec.issues.filter((i) => i.severity === 'critical').length;
  const high = sec.issues.filter((i) => i.severity === 'high').length;
  const med = sec.issues.filter((i) => i.severity === 'medium').length;
  sec.score = computeDomainScore(sec.checks);
  sec.status = statusFromIssues({ critical: crit, high, medium: med });
  return sec;
}

function sampleFlyLogs(opts = {}) {
  const app = opts.app || FLY_APP;
  const result = {
    available: false,
    lines_sampled: 0,
    deposit_webhook_rejected: 0,
    withdraw_webhook_rejected: 0,
    payout_worker_heartbeat: 0,
    reconcile_worker_signals: 0,
    replay_indicators: 0,
    stuck_loop_hints: 0,
    error: null,
  };
  try {
    const maxLines = Number(process.env.V12E_FLY_LOG_LINES || 800);
    const raw = execSync(`flyctl logs -a ${app} --no-tail`, {
      encoding: 'utf8',
      timeout: 45000,
      maxBuffer: 8 * 1024 * 1024,
    });
    result.available = true;
    let lines = raw.split('\n').filter(Boolean);
    if (lines.length > maxLines) lines = lines.slice(-maxLines);
    result.lines_sampled = lines.length;
    for (const line of lines) {
      if (line.includes('deposit_webhook_rejected')) result.deposit_webhook_rejected++;
      if (line.includes('withdraw_webhook_rejected')) result.withdraw_webhook_rejected++;
      if (
        line.includes('[PAYOUT][WORKER][HEARTBEAT]') ||
        line.includes('PAYOUT][WORKER][HEARTBEAT')
      ) {
        result.payout_worker_heartbeat++;
      }
      if (
        line.includes('[RECONCILE]') ||
        line.includes('reconcile_worker') ||
        line.includes('RECONCILE_WORKER')
      ) {
        result.reconcile_worker_signals++;
      }
      if (
        line.toLowerCase().includes('replay') ||
        line.includes('duplicate webhook') ||
        line.includes('idempotency')
      ) {
        result.replay_indicators++;
      }
      if (line.includes('stuck') || line.includes('timeout') && line.includes('worker')) {
        result.stuck_loop_hints++;
      }
    }
    result.webhook_rejected_total =
      result.deposit_webhook_rejected + result.withdraw_webhook_rejected;
  } catch (e) {
    result.error = e.message;
  }
  return result;
}

async function collectDriftSummary() {
  const drift = { source: 'inline-v12e', issues: [], checks: [] };
  const bl = CERTIFIED_BASELINE;
  const meta = await fetchHttp(`${API_BASE}/meta`);
  const sha =
    meta.json?.gitCommit || meta.json?.data?.gitCommit || meta.json?.data?.git?.commit || '';
  const shaOk = shaMatch(sha, bl.gitCommit);
  drift.runtime_sha = sha;
  drift.checks.push({ id: 'DR-01', pass: shaOk, weight: 30 });
  if (!shaOk && !process.env.V12E_DEPLOY_JUSTIFICATION) {
    drift.issues.push({ severity: 'high', id: 'DR-01', message: 'Runtime SHA vs certificado' });
  }

  const fly = runCmd(`flyctl releases -a ${FLY_APP} --json`);
  if (fly.ok) {
    try {
      const latest = JSON.parse(fly.stdout)[0];
      drift.fly_version = latest?.Version;
      const flyOk = Number(latest?.Version) === bl.flyVersion;
      drift.checks.push({ id: 'DR-02', pass: flyOk, weight: 30 });
      if (!flyOk) drift.issues.push({ severity: 'high', id: 'DR-02', message: 'Fly release drift' });
    } catch (_) {
      /* ignore */
    }
  }

  let localHead = null;
  const head = runCmd('git rev-parse HEAD', { timeout: 8000 });
  if (head.ok) localHead = head.stdout;
  drift.local_git_head = localHead;
  if (localHead && sha && !shaMatch(localHead, sha)) {
    drift.issues.push({
      severity: 'medium',
      id: 'DR-03',
      message: 'Repo local diverge do runtime live',
    });
    drift.checks.push({ id: 'DR-03', pass: false, weight: 10 });
  } else {
    drift.checks.push({ id: 'DR-03', pass: true, weight: 10 });
  }

  const crit = drift.issues.filter((i) => i.severity === 'critical').length;
  const high = drift.issues.filter((i) => i.severity === 'high').length;
  drift.score = computeDomainScore(drift.checks);
  drift.status = statusFromIssues({ critical: crit, high });
  return drift;
}

function computeConsolidatedScore(domains) {
  const weights = {
    runtime: 0.2,
    financial: 0.25,
    security: 0.2,
    drift: 0.15,
    workers: 0.1,
    backlog: 0.05,
    deploy_integrity: 0.05,
  };
  const scores = {
    runtime: domains.runtime?.score ?? 0,
    financial: domains.financial?.score ?? 0,
    security: domains.security?.score ?? 0,
    drift: domains.drift?.score ?? 0,
    workers: domains.workers?.score ?? 100,
    backlog: domains.backlog?.score ?? 100,
    deploy_integrity: domains.deploy_integrity?.score ?? domains.drift?.score ?? 100,
  };
  let total = 0;
  for (const [k, w] of Object.entries(weights)) {
    total += (scores[k] || 0) * w;
  }
  const operational_score = Math.round(total);
  return {
    operational_score,
    status: scoreToStatus(operational_score),
    domain_scores: scores,
    weights,
  };
}

function writeJsonSnapshot(subdir, name, data) {
  const dir = rel('docs', 'operational', 'snapshots', subdir || '');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${name}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
}

module.exports = {
  REPO_ROOT,
  rel,
  CERTIFIED_BASELINE,
  API_BASE,
  FLY_APP,
  PLAYER_URLS,
  loadBaselineV12a,
  fetchHttp,
  runCmd,
  shaMatch,
  statusFromIssues,
  scoreToStatus,
  computeDomainScore,
  computeConsolidatedScore,
  collectRuntimeHealth,
  collectFinancialMetrics,
  collectSecuritySurface,
  collectDriftSummary,
  sampleFlyLogs,
  writeJsonSnapshot,
};
