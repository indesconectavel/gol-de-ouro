/**
 * V1.2E — Watchdog runtime health (read-only).
 * Valida /meta, /health, /health/workers, Fly, SHA, bundle player.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const lib = require('./lib/operational-lib');

const MISSION = 'V1.2E-WATCHDOG-RUNTIME-HEALTH';

async function runWatchdog() {
  const runtime = await lib.collectRuntimeHealth();
  const out = {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    baseline: lib.CERTIFIED_BASELINE,
    runtime,
    status: runtime.status,
    score: runtime.score,
    issues: runtime.issues,
  };
  return out;
}

async function main() {
  const out = await runWatchdog();
  const snapDir = lib.rel('docs', 'operational', 'snapshots', 'watchdog-runtime');
  fs.mkdirSync(snapDir, { recursive: true });
  const ts = out.timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(snapDir, `runtime-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({ status: out.status, score: out.score, snapshot: jsonPath, issues: out.issues.length }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runWatchdog, MISSION };
