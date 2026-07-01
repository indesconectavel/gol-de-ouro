/**
 * V1.2E — Verificação operacional contínua (read-only).
 * Orquestra runtime, financeiro, segurança e drift/deploy integrity.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const lib = require('./lib/operational-lib');
const { runWatchdog: runRuntime } = require('./watchdog-runtime-health');
const { runWatchdog: runFinancial } = require('./watchdog-financial-integrity');
const { runWatchdog: runSecurity } = require('./watchdog-security-surface');

const MISSION = 'V1.2E-CONTINUOUS-VERIFICATION';
const DATE_TAG = '2026-05-19';

function runV12cDriftOptional() {
  const script = lib.rel('scripts', 'v1-2c-runtime-drift-deploy-integrity.js');
  if (!fs.existsSync(script)) return { skipped: true, reason: 'v1-2c script ausente' };
  try {
    const stdout = execSync(`node "${script}"`, {
      encoding: 'utf8',
      timeout: 120000,
      cwd: lib.REPO_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lastLine = stdout.trim().split('\n').pop();
    try {
      return { source: 'v1-2c', summary: JSON.parse(lastLine) };
    } catch {
      return { source: 'v1-2c', raw_tail: lastLine?.slice(0, 500) };
    }
  } catch (e) {
    return { source: 'v1-2c', error: e.message, inline_fallback: true };
  }
}

async function runContinuousVerification() {
  const [runtime, financial, security] = await Promise.all([
    runRuntime(),
    runFinancial(),
    runSecurity(),
  ]);

  let drift = await lib.collectDriftSummary();
  const v12c = runV12cDriftOptional();
  if (v12c.summary) {
    drift.v12c_ref = v12c.summary;
    if (v12c.summary.estado) drift.status = mapEstado(v12c.summary.estado);
  }

  const logs = lib.sampleFlyLogs();
  const workerEnabled =
    runtime.runtime?.workers?.data?.payoutWorker?.enabledByEnv === true;
  const workers = {
    fly_logs: logs,
    payout_heartbeats: logs.payout_worker_heartbeat,
    reconcile_signals: logs.reconcile_worker_signals,
    enabled: workerEnabled,
    issues: [],
    checks: [],
  };
  if (workerEnabled && logs.available && logs.payout_worker_heartbeat === 0) {
    workers.issues.push({
      severity: 'high',
      id: 'WK-01',
      message: 'Payout worker sem heartbeat na amostra Fly',
    });
    workers.checks.push({ id: 'WK-01', pass: false, weight: 50 });
  } else {
    workers.checks.push({ id: 'WK-01', pass: true, weight: 50 });
  }
  if (logs.reconcile_worker_signals === 0 && logs.available) {
    workers.issues.push({
      severity: 'medium',
      id: 'WK-02',
      message: 'Sem sinais reconcile worker na amostra (pode ser janela curta)',
    });
    workers.checks.push({ id: 'WK-02', pass: false, weight: 30 });
  } else {
    workers.checks.push({ id: 'WK-02', pass: true, weight: 30 });
  }
  workers.score = lib.computeDomainScore(workers.checks);
  workers.status = lib.statusFromIssues({
    critical: workers.issues.filter((i) => i.severity === 'critical').length,
    high: workers.issues.filter((i) => i.severity === 'high').length,
    medium: workers.issues.filter((i) => i.severity === 'medium').length,
  });

  const backlog = {
    reconcile_pending: financial.financial?.metrics?.reconcile_backlog_pending,
    score:
      (financial.financial?.metrics?.reconcile_backlog_pending ?? 0) <= 100 ? 100 : 70,
    status: 'GREEN',
  };
  if (backlog.score < 100) backlog.status = 'YELLOW';

  const consolidated = lib.computeConsolidatedScore({
    runtime: runtime.runtime,
    financial: financial.financial,
    security: security.security,
    drift,
    workers,
    backlog,
    deploy_integrity: drift,
  });

  const allIssues = [
    ...(runtime.issues || []),
    ...(financial.issues || []),
    ...(security.issues || []),
    ...(drift.issues || []),
    ...(workers.issues || []),
  ];
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allIssues.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  let overallSeverity = 'GREEN';
  if (allIssues.some((i) => i.severity === 'critical')) overallSeverity = 'RED';
  else if (allIssues.some((i) => i.severity === 'high')) overallSeverity = 'YELLOW';
  else if (allIssues.some((i) => i.severity === 'medium')) overallSeverity = 'YELLOW';

  let verdict = 'PASS';
  if (overallSeverity === 'RED') verdict = 'NO-GO';
  else if (overallSeverity === 'YELLOW') verdict = 'PASS COM RESSALVAS';

  return {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    domains: { runtime, financial, security, drift, workers, backlog },
    consolidated,
    operational_score: consolidated.operational_score,
    status: consolidated.status,
    overall_severity: overallSeverity,
    verdict,
    top_issues: allIssues.slice(0, 15),
    issue_count: allIssues.length,
    v12c_integration: v12c,
  };
}

function mapEstado(estado) {
  const m = { VERDE: 'GREEN', AMARELO: 'YELLOW', VERMELHO: 'RED' };
  return m[estado] || estado;
}

function writeReport(out) {
  const jsonPath = lib.rel(
    'docs',
    'relatorios',
    `V1-2E-CONTINUOUS-VERIFICATION-DATA-${DATE_TAG}.json`
  );
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  return jsonPath;
}

async function main() {
  const out = await runContinuousVerification();
  const jsonPath = writeReport(out);
  const snap = lib.writeJsonSnapshot('continuous', 'verification', out);
  console.log(
    JSON.stringify(
      {
        operational_score: out.operational_score,
        status: out.status,
        verdict: out.verdict,
        issues: out.issue_count,
        data: jsonPath,
        snapshot: snap,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runContinuousVerification, MISSION };
