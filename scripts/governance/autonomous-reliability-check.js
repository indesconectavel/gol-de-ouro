/**
 * V1.3 — Autonomous reliability check (read-only).
 * Orquestra V1.2E watchdogs + certification + proof + drift + heurísticas.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const rl = require('../reliability/lib/reliability-lib');
const { runContinuousVerification } = require('../operational/continuous-verification');
const { certifyRuntime } = require('../reliability/runtime-certification');
const { generateProof } = require('../reliability/financial-proof-engine');
const { runEngine } = require('../reliability/reliability-score-engine');

const MISSION = 'V1.3-AUTONOMOUS-RELIABILITY-CHECK';

function incidentHeuristics(verification, proof, certification) {
  const hints = [];
  const issues = verification.top_issues || [];

  if (issues.some((i) => i.severity === 'critical')) {
    hints.push({
      id: 'IH-P0',
      severity: 'P0',
      message: 'Issue crítico detectado — acionar INCIDENT-RESPONSE-FLOW',
      runbook: 'docs/runbooks/INCIDENT-RESPONSE-FLOW.md',
    });
  }
  if (proof.proof_status === 'INVALID') {
    hints.push({
      id: 'IH-FIN',
      severity: 'P0',
      message: 'Prova financeira INVALID — runbook financeiro',
      runbook: 'docs/runbooks/financeiro/',
    });
  }
  if (certification.certification === 'INVALID') {
    hints.push({
      id: 'IH-RT',
      severity: 'P1',
      message: 'Runtime INVALID — RUNBOOK-runtime-drift / validacao-codigo-live',
      runbook: 'docs/runbooks/runtime/RUNBOOK-runtime-drift.md',
    });
  }
  if (issues.some((i) => i.id === 'WK-01')) {
    hints.push({
      id: 'IH-WK',
      severity: 'P2',
      message: 'Worker liveness inconclusivo',
      runbook: 'docs/runbooks/workers/RUNBOOK-payout-worker-offline.md',
    });
  }
  if ((verification.operational_score ?? 100) < 70) {
    hints.push({
      id: 'IH-SCORE',
      severity: 'P1',
      message: `Score operacional ${verification.operational_score} < 70`,
    });
  }
  return hints;
}

async function runAutonomousCheck() {
  const [verification, certification, proof, scores] = await Promise.all([
    runContinuousVerification(),
    certifyRuntime(),
    generateProof(),
    runEngine(),
  ]);

  const allIssues = verification.top_issues || [];
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  const highCount = allIssues.filter((i) => i.severity === 'high').length;

  const operationalScore = scores.consolidated.reliability_score;
  const state = rl.reliabilityState({
    criticalCount,
    highCount,
    operationalScore,
  });

  const certLevel = rl.certificationFromScores({
    operational: operationalScore,
    runtime: certification.certification,
    financial: proof.financial_score,
    criticalCount,
  });

  const heuristics = incidentHeuristics(verification, proof, certification);

  const evidencePack = {
    verification_summary: {
      score: verification.operational_score,
      status: verification.status,
      verdict: verification.verdict,
      issues: verification.issue_count,
    },
    runtime_certification: certification.certification,
    financial_proof: proof.proof_status,
    proof_hash: proof.proof_hash,
    snapshot_hash: proof.snapshot_hash,
    fingerprint_hash: certification.fingerprint_hash,
    domain_scores: scores.domain_scores,
  };

  const reliability_hash = rl.stableHash(evidencePack);

  let verdict = 'PASS';
  if (state === 'CRITICAL' || certLevel === 'INVALID') verdict = 'NO-GO';
  else if (state === 'DEGRADED' || certLevel === 'DEGRADED') verdict = 'PASS COM RESSALVAS';

  return {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    reliability_state: state,
    continuous_certification: certLevel,
    operational_score: operationalScore,
    verdict,
    scores,
    verification,
    certification,
    proof,
    incident_heuristics: heuristics,
    evidence_pack: evidencePack,
    reliability_hash,
  };
}

async function main() {
  const out = await runAutonomousCheck();
  const govSnap = rl.writeGovernanceSnapshot('autonomous-reliability', out);
  const relSnap = rl.writeSnapshot('governance', 'autonomous-reliability', out);
  const jsonPath = rl.rel(
    'docs',
    'relatorios',
    `V1-3-AUTONOMOUS-RELIABILITY-DATA-${rl.DATE_TAG}.json`
  );
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        reliability_state: out.reliability_state,
        continuous_certification: out.continuous_certification,
        operational_score: out.operational_score,
        verdict: out.verdict,
        reliability_hash: out.reliability_hash,
        governance_snapshot: govSnap.latest,
        reliability_snapshot: relSnap.latest,
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

module.exports = { runAutonomousCheck, MISSION };
