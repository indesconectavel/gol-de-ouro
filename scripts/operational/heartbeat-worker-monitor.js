/**
 * V1.2E — Heartbeat worker monitor (read-only).
 * Análise heurística de logs Fly: reconcile, payout, loops, travamento.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const lib = require('./lib/operational-lib');

const MISSION = 'V1.2E-HEARTBEAT-WORKER-MONITOR';

const HEARTBEAT_PATTERNS = {
  payout: ['[PAYOUT][WORKER][HEARTBEAT]', 'PAYOUT][WORKER][HEARTBEAT', 'payout_worker'],
  reconcile: ['[RECONCILE]', 'reconcile_worker', 'RECONCILE_WORKER', 'pix_reconcile'],
  loop: ['cycle complete', 'worker loop', 'tick finished', 'iteration'],
  stall: ['stuck', 'timeout', 'ECONNRESET', 'worker error', 'fatal'],
};

function analyzeLogs(logs) {
  const analysis = {
    payout: { heartbeats: 0, errors: 0, last_hint: null },
    reconcile: { signals: 0, errors: 0 },
    loops: 0,
    stall_hints: 0,
    lines_sampled: logs.lines_sampled,
    available: logs.available,
  };

  if (!logs.available) {
    return { ...analysis, status: 'YELLOW', note: logs.error || 'logs indisponíveis' };
  }

  analysis.payout.heartbeats = logs.payout_worker_heartbeat;
  analysis.reconcile.signals = logs.reconcile_worker_signals;
  analysis.stall_hints = logs.stuck_loop_hints;

  const minHeartbeats = Number(process.env.V12E_MIN_PAYOUT_HEARTBEATS || 1);
  const minReconcile = Number(process.env.V12E_MIN_RECONCILE_SIGNALS || 0);

  const issues = [];
  if (analysis.payout.heartbeats < minHeartbeats) {
    issues.push({
      severity: 'high',
      worker: 'payout',
      message: `Heartbeats payout: ${analysis.payout.heartbeats} (mín ${minHeartbeats})`,
    });
  }
  if (minReconcile > 0 && analysis.reconcile.signals < minReconcile) {
    issues.push({
      severity: 'medium',
      worker: 'reconcile',
      message: `Sinais reconcile: ${analysis.reconcile.signals}`,
    });
  }
  if (analysis.stall_hints > Number(process.env.V12E_STALL_HINTS_MAX || 10)) {
    issues.push({
      severity: 'high',
      worker: 'both',
      message: `Indícios de travamento: ${analysis.stall_hints}`,
    });
  }

  const crit = issues.filter((i) => i.severity === 'critical').length;
  const high = issues.filter((i) => i.severity === 'high').length;
  const status = lib.statusFromIssues({ critical: crit, high });

  return {
    patterns: HEARTBEAT_PATTERNS,
    analysis,
    issues,
    status,
    heuristics: {
      note: 'Somente leitura flyctl logs; não altera workers nem env',
      recommendation:
        status === 'GREEN'
          ? 'Workers aparentam ativos na janela amostrada'
          : 'Consultar RUNBOOK-payout-worker-offline ou RUNBOOK-reconcile-parado',
    },
  };
}

async function runMonitor() {
  const logs = lib.sampleFlyLogs();
  const workersEndpoint = await lib.fetchHttp(`${lib.API_BASE}/health/workers`);
  const monitor = analyzeLogs(logs);
  return {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    fly_app: lib.FLY_APP,
    workers_endpoint: workersEndpoint.json?.data || workersEndpoint.json,
    logs_summary: logs,
    monitor,
    status: monitor.status,
  };
}

async function main() {
  const out = await runMonitor();
  const snapDir = lib.rel('docs', 'operational', 'snapshots', 'heartbeat');
  fs.mkdirSync(snapDir, { recursive: true });
  const ts = out.timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(snapDir, `heartbeat-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({ status: out.status, snapshot: jsonPath, monitor: out.monitor }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runMonitor, MISSION };
