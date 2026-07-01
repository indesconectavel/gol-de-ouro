/**
 * V1.2E — Watchdog integridade financeira (read-only).
 * Duplicatas, saldo negativo, approved sem ledger, pending, payout, rollback, reconcile.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const lib = require('./lib/operational-lib');

const MISSION = 'V1.2E-WATCHDOG-FINANCIAL-INTEGRITY';

async function runWatchdog() {
  const financial = await lib.collectFinancialMetrics();
  const out = {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    financial,
    status: financial.status || 'YELLOW',
    score: financial.score ?? 0,
    metrics: financial.metrics,
    diff_vs_baseline: financial.diff,
    thresholds: financial.thresholds,
    issues: financial.issues,
  };
  return out;
}

async function main() {
  const out = await runWatchdog();
  const snapDir = lib.rel('docs', 'operational', 'snapshots', 'watchdog-financial');
  fs.mkdirSync(snapDir, { recursive: true });
  const ts = out.timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(snapDir, `financial-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        status: out.status,
        score: out.score,
        snapshot: jsonPath,
        metrics: out.metrics,
        diff: out.diff_vs_baseline,
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

module.exports = { runWatchdog, MISSION };
