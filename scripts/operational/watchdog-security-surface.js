/**
 * V1.2E — Watchdog superfície de segurança (read-only).
 * Webhooks 401, flood/replay indicators, endpoints inesperados.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const lib = require('./lib/operational-lib');

const MISSION = 'V1.2E-WATCHDOG-SECURITY-SURFACE';

async function runWatchdog() {
  const security = await lib.collectSecuritySurface();
  const out = {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    security,
    status: security.status,
    score: security.score,
    probes: security.probes,
    issues: security.issues,
  };
  return out;
}

async function main() {
  const out = await runWatchdog();
  const snapDir = lib.rel('docs', 'operational', 'snapshots', 'watchdog-security');
  fs.mkdirSync(snapDir, { recursive: true });
  const ts = out.timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(snapDir, `security-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({ status: out.status, score: out.score, snapshot: jsonPath }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runWatchdog, MISSION };
