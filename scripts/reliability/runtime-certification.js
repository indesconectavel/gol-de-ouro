/**
 * V1.3 — Runtime certification vs baseline (read-only).
 * Resultado: CERTIFIED | DEGRADED | INVALID
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const crypto = require('crypto');
const rl = require('./lib/reliability-lib');

const MISSION = 'V1.3-RUNTIME-CERTIFICATION';

async function certifyRuntime() {
  const bl = rl.op.CERTIFIED_BASELINE;
  const runtime = await rl.op.collectRuntimeHealth();
  const security = await rl.op.collectSecuritySurface();
  const drift = await rl.op.collectDriftSummary();
  const logs = rl.op.sampleFlyLogs();

  const checks = {
    sha_runtime: rl.op.shaMatch(runtime.meta?.gitCommit, bl.gitCommit),
    fly_release: Number(runtime.fly?.latest_version) === bl.flyVersion,
    health_ok: runtime.health?.ok === true,
    workers_endpoint: runtime.workers?.status === 200,
    bundle_player: Object.values(runtime.player || {}).some((p) => p.baseline_match),
    webhooks_401: security.probes?.every((p) => p.pass),
    webhooks_hardened: security.probes?.length === 2 && security.probes.every((p) => p.status === 401),
    drift_runtime_vs_cert: drift.checks?.find((c) => c.id === 'DR-01')?.pass !== false,
    no_critical_runtime_issues: !runtime.issues?.some((i) => i.severity === 'critical'),
  };

  const fingerprint = {
    sha: runtime.meta?.gitCommit?.slice(0, 12),
    fly: runtime.fly?.latest_version,
    bundle: Object.values(runtime.player || {}).find((p) => p.bundle)?.bundle,
    health_version: runtime.health?.body?.version,
    worker_flags: runtime.workers?.data,
    log_sample_lines: logs.lines_sampled,
  };

  const fingerprintHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex')
    .slice(0, 16);

  const failed = Object.entries(checks).filter(([, v]) => !v);
  const criticalFail = failed.some(([k]) =>
    ['sha_runtime', 'health_ok', 'webhooks_401', 'no_critical_runtime_issues'].includes(k)
  );

  let certification = 'CERTIFIED';
  if (criticalFail) certification = 'INVALID';
  else if (failed.length > 0) certification = 'DEGRADED';

  return {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    baseline: bl,
    certification,
    checks,
    failed_checks: failed.map(([k]) => k),
    fingerprint,
    fingerprint_hash: fingerprintHash,
    runtime_summary: {
      meta: runtime.meta,
      health: { ok: runtime.health?.ok, status: runtime.health?.status },
      fly: runtime.fly,
      player: runtime.player,
    },
    drift_issues: drift.issues,
    score: runtime.score,
  };
}

async function main() {
  const out = await certifyRuntime();
  rl.writeSnapshot('certification', 'runtime-cert', out);
  console.log(
    JSON.stringify(
      { certification: out.certification, fingerprint_hash: out.fingerprint_hash, failed: out.failed_checks },
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

module.exports = { certifyRuntime, MISSION };
