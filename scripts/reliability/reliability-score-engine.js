/**
 * V1.3 — Reliability score engine (read-only).
 * Scores por domínio + consolidado + tendências + risco agregado.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const rl = require('./lib/reliability-lib');
const { runWatchdog: runRuntime } = require('../operational/watchdog-runtime-health');
const { runWatchdog: runFinancial } = require('../operational/watchdog-financial-integrity');
const { runWatchdog: runSecurity } = require('../operational/watchdog-security-surface');
const { runMonitor } = require('../operational/heartbeat-worker-monitor');

const MISSION = 'V1.3-RELIABILITY-SCORE-ENGINE';

async function runEngine() {
  const [runtime, financial, security, heartbeat] = await Promise.all([
    runRuntime(),
    runFinancial(),
    runSecurity(),
    runMonitor(),
  ]);
  const drift = await rl.op.collectDriftSummary();
  const logs = rl.op.sampleFlyLogs();

  const workerEnabled =
    runtime.runtime?.workers?.data?.payoutWorker?.enabledByEnv === true;
  const workers = {
    score:
      logs.available && logs.payout_worker_heartbeat > 0
        ? 100
        : workerEnabled
          ? 30
          : 100,
    status: logs.payout_worker_heartbeat > 0 ? 'GREEN' : 'YELLOW',
    heartbeats: logs.payout_worker_heartbeat,
  };

  const backlogPending = financial.metrics?.reconcile_backlog_pending ?? 0;
  const backlog = {
    score: backlogPending <= 54 ? 100 : backlogPending <= 80 ? 80 : 60,
    pending: backlogPending,
  };

  const domainScores = {
    operational_runtime: runtime.score,
    operational_financial: financial.score,
    operational_security: security.score,
    deploy_runtime: drift.score,
    workers: workers.score,
    backlog: backlog.score,
    drift: drift.score,
  };

  const consolidated = rl.op.computeConsolidatedScore({
    runtime: runtime.runtime,
    financial: financial.financial,
    security: security.security,
    drift,
    workers: { score: workers.score },
    backlog: { score: backlog.score },
    deploy_integrity: drift,
  });

  const issues = [
    ...(runtime.issues || []),
    ...(financial.issues || []),
    ...(security.security?.issues || security.issues || []),
    ...(drift.issues || []),
    ...(heartbeat.monitor?.issues || []),
  ];

  const trend = rl.loadTrendSnapshots(8);
  const trendAnalysis = rl.computeTrendDelta(
    trend.map((t) => ({ operational_score: t.operational_score }))
  );

  const out = {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    domain_scores: domainScores,
    consolidated: {
      reliability_score: consolidated.operational_score,
      classification: consolidated.status,
      weights: consolidated.weights,
    },
    aggregated_risk: rl.aggregateRiskScore(issues),
    trend: { history: trend, analysis: trendAnalysis },
    issues_count: issues.length,
    top_issues: issues.slice(0, 10),
    reliability_hash: rl.stableHash({ scores: domainScores, ts: new Date().toISOString().slice(0, 16) }),
  };
  return out;
}

async function main() {
  const out = await runEngine();
  const snap = rl.writeSnapshot('', 'reliability-score', out);
  const jsonPath = rl.rel('docs', 'relatorios', `V1-3-RELIABILITY-SCORE-DATA-${rl.DATE_TAG}.json`);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        reliability_score: out.consolidated.reliability_score,
        classification: out.consolidated.classification,
        aggregated_risk: out.aggregated_risk,
        trend: out.trend.analysis,
        snapshot: snap.latest,
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

module.exports = { runEngine, MISSION };
