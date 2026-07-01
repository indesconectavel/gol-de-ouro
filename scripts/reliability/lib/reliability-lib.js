/**
 * V1.3 — Biblioteca reliability/governance (read-only).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const op = require('../../operational/lib/operational-lib');

const REPO_ROOT = op.REPO_ROOT;
const DATE_TAG = '2026-05-19';

function rel(...parts) {
  return path.join(REPO_ROOT, ...parts);
}

function stableHash(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function proofHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

function loadTrendSnapshots(limit = 5) {
  const dirs = [
    rel('docs', 'operational', 'snapshots', 'continuous'),
    rel('docs', 'reliability', 'snapshots'),
    rel('docs', 'governance', 'snapshots'),
  ];
  const files = [];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (f.endsWith('.json') && !f.startsWith('LATEST')) files.push({ path: path.join(d, f), mtime: fs.statSync(path.join(d, f)).mtime });
    }
  }
  files.sort((a, b) => b.mtime - a.mtime);
  const trend = [];
  for (const { path: fp } of files.slice(0, limit)) {
    try {
      const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
      trend.push({
        file: path.basename(fp),
        timestamp: d.timestamp,
        operational_score: d.operational_score ?? d.consolidated?.operational_score ?? d.summary?.operational_score,
        status: d.status ?? d.summary?.status,
      });
    } catch {
      /* skip */
    }
  }
  return trend;
}

function computeTrendDelta(trend) {
  if (trend.length < 2) return { direction: 'stable', delta: 0, samples: trend.length };
  const latest = trend[0]?.operational_score;
  const prev = trend[1]?.operational_score;
  if (latest == null || prev == null) return { direction: 'unknown', delta: null, samples: trend.length };
  const delta = latest - prev;
  let direction = 'stable';
  if (delta > 2) direction = 'improving';
  else if (delta < -2) direction = 'degrading';
  return { direction, delta, samples: trend.length };
}

function aggregateRiskScore(issues) {
  const weights = { critical: 40, high: 20, medium: 8, low: 2 };
  let risk = 0;
  for (const i of issues || []) {
    risk += weights[i.severity] || 5;
  }
  return Math.min(100, risk);
}

function certificationFromScores({ operational, runtime, financial, criticalCount }) {
  if (criticalCount > 0) return 'INVALID';
  if (operational >= 90 && runtime === 'CERTIFIED' && financial >= 90) return 'CERTIFIED';
  if (operational >= 70) return 'DEGRADED';
  return 'INVALID';
}

function reliabilityState({ criticalCount, highCount, operationalScore }) {
  if (criticalCount > 0 || operationalScore < 70) return 'CRITICAL';
  if (highCount > 0 || operationalScore < 90) return 'DEGRADED';
  return 'HEALTHY';
}

function writeSnapshot(subdir, name, data) {
  const dir = rel('docs', 'reliability', 'snapshots', subdir || '');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${name}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  const latest = path.join(dir, 'LATEST.json');
  fs.writeFileSync(latest, JSON.stringify(data, null, 2), 'utf8');
  return { file, latest };
}

function writeGovernanceSnapshot(name, data) {
  const dir = rel('docs', 'governance', 'snapshots');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${name}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  const latest = path.join(dir, 'LATEST.json');
  fs.writeFileSync(latest, JSON.stringify(data, null, 2), 'utf8');
  return { file, latest };
}

module.exports = {
  REPO_ROOT,
  rel,
  DATE_TAG,
  op,
  stableHash,
  proofHash,
  loadTrendSnapshots,
  computeTrendDelta,
  aggregateRiskScore,
  certificationFromScores,
  reliabilityState,
  writeSnapshot,
  writeGovernanceSnapshot,
};
