/**
 * V1.6 — Biblioteca certificação operacional produção.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const op = require('../../operational/lib/operational-lib');

const REPO_ROOT = op.REPO_ROOT;
const DATE_TAG = '2026-05-19';
const OFFICIAL_BASELINE = {
  version: 'V1',
  cert_date: DATE_TAG,
  gitCommit: 'a83c3cffcc998ed3d1bd8d2e88619a9b03afb634',
  gitCommitShort: 'a83c3cf',
  flyVersion: 461,
  playerBundle: 'index-B6M2smS9.js',
  apiBase: 'https://goldeouro-backend-v2.fly.dev',
  certRef: 'V1.1G+V1.2+V1.3+V1.4+V1.5+V1.6',
};

const PHASE_ARTIFACTS = [
  { phase: 'V1.1A', md: 'V1-1A-AUDITORIA-LEDGER-FINANCEIRO-2026-05-17.md', optional: true },
  { phase: 'V1.1G', json: null, md: 'V1-1G-CERTIFICACAO-FINANCEIRA-POS-HARDENING-2026-05-18.md' },
  { phase: 'V1.2A', json: 'V1-2A-RUNTIME-FINANCIAL-HEALTH-DATA-2026-05-18.json' },
  { phase: 'V1.2B', json: 'V1-2B-ALERTAS-OPERACIONAIS-DATA-2026-05-18.json' },
  { phase: 'V1.2C', json: 'V1-2C-RUNTIME-DRIFT-DEPLOY-INTEGRITY-DATA-2026-05-19.json' },
  { phase: 'V1.2E', json: 'V1-2E-CONTINUOUS-VERIFICATION-DATA-2026-05-19.json' },
  { phase: 'V1.3', json: 'V1-3-AUTONOMOUS-RELIABILITY-DATA-2026-05-19.json' },
  { phase: 'V1.4', json: 'V1-4-EXTERNAL-CERTIFICATION-DATA-2026-05-19.json' },
  { phase: 'V1.5', json: 'V1-5-CONSOLIDATED-DATA-2026-05-19.json' },
  { phase: 'V1.5A', json: 'V1-5A-ACTIVATION-GATE-PRE-DEPLOY-DATA-2026-05-19.json' },
  { phase: 'V1.5C', json: 'V1-5C-EXTERNAL-ALERT-DATA-2026-05-19.json' },
  { phase: 'V1.5D', md: 'V1-5D-CONTROLLED-EXTERNAL-MONITORING-PLAN-2026-05-19.md' },
];

function rel(...parts) {
  return path.join(REPO_ROOT, ...parts);
}

function loadJson(name) {
  if (!name) return null;
  const p = rel('docs', 'relatorios', name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function loadPhaseBundle() {
  const bundle = {};
  for (const a of PHASE_ARTIFACTS) {
    bundle[a.phase] = {
      json: a.json ? loadJson(a.json) : null,
      md: a.md ? fs.existsSync(rel('docs', 'relatorios', a.md)) : false,
    };
  }
  return bundle;
}

function countRunbooks() {
  const dir = rel('docs', 'runbooks');
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.startsWith('RUNBOOK') && f.name.endsWith('.md')) n++;
    }
  }
  walk(dir);
  return n;
}

function operationalClass(score, blockers) {
  const crit = blockers.critical > 0;
  const high = blockers.high > 0;
  const medium = blockers.medium > 0;
  if (crit) return 'FRAGILE';
  if (score >= 92 && !high && !medium) return 'CERTIFIED';
  if (score >= 88 && !high) return 'GOVERNED';
  if (score >= 75) return 'HARDENED';
  if (score >= 65) return 'STABLE';
  return 'FRAGILE';
}

function finalVerdict(classification, blockers, score) {
  if (blockers.critical.length) return { verdict: 'NO-GO', cert: 'NOT CERTIFIED' };
  if (score < 70) return { verdict: 'NO-GO', cert: 'NOT CERTIFIED' };
  const hasRessalvas =
    blockers.high.length > 0 ||
    blockers.medium.length > 0 ||
    score < 95 ||
    classification !== 'CERTIFIED';
  if (hasRessalvas) {
    return { verdict: 'PASS COM RESSALVAS', cert: 'CERTIFIED WITH RESSALVAS' };
  }
  return { verdict: 'PASS', cert: 'CERTIFIED' };
}

function maturityLevel(scores, phases) {
  const hasRunbooks = countRunbooks() >= 15;
  const hasV15 = phases['V1.5']?.json || phases['V1.5A']?.json;
  const hasV13 = phases['V1.3']?.json;
  const hasV12 = phases['V1.2E']?.json;
  if (scores.consolidated >= 88 && hasRunbooks && hasV15 && hasV13 && hasV12) {
    return 'Semi-autonomous';
  }
  if (scores.consolidated >= 85 && hasRunbooks) return 'Governed';
  if (scores.consolidated >= 75) return 'Hardened';
  if (scores.consolidated >= 65) return 'Stable';
  return 'Experimental';
}

module.exports = {
  REPO_ROOT,
  rel,
  DATE_TAG,
  OFFICIAL_BASELINE,
  PHASE_ARTIFACTS,
  loadPhaseBundle,
  loadJson,
  countRunbooks,
  operationalClass,
  finalVerdict,
  maturityLevel,
  op,
};
