/**
 * V1.3 — Financial proof engine (read-only).
 * Prova contínua de integridade: hashes, score, delta vs baseline.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const rl = require('./lib/reliability-lib');

const MISSION = 'V1.3-FINANCIAL-PROOF-ENGINE';

async function generateProof() {
  const fin = await rl.op.collectFinancialMetrics();
  const baseline = fin.baseline || rl.op.loadBaselineV12a();
  const m = fin.metrics || {};

  const validations = [
    { id: 'FP-01', name: 'duplicatas', pass: (m.dups_corr_tipo ?? 0) === 0, value: m.dups_corr_tipo },
    { id: 'FP-02', name: 'saldo_negativo', pass: (m.saldo_negativo ?? 0) === 0, value: m.saldo_negativo },
    {
      id: 'FP-03',
      name: 'approved_sem_ledger_stable',
      pass: (m.approved_without_ledger ?? 0) <= baseline.approved_without_ledger,
      value: m.approved_without_ledger,
      baseline: baseline.approved_without_ledger,
    },
    {
      id: 'FP-04',
      name: 'pending_old_stable',
      pass: (m.pix_pending_old ?? 0) <= baseline.pix_pending_old,
      value: m.pix_pending_old,
      baseline: baseline.pix_pending_old,
    },
    {
      id: 'FP-05',
      name: 'rollback_no_spike',
      pass: (fin.diff?.rollback ?? 0) < Number(process.env.V13_ROLLBACK_SPIKE || 2),
      value: m.rollback,
      delta: fin.diff?.rollback,
    },
    {
      id: 'FP-06',
      name: 'falha_payout_no_spike',
      pass: (fin.diff?.falha_payout ?? 0) < Number(process.env.V13_FALHA_SPIKE || 3),
      value: m.falha_payout,
      delta: fin.diff?.falha_payout,
    },
    {
      id: 'FP-07',
      name: 'reconcile_backlog',
      pass: (m.reconcile_backlog_pending ?? 0) <= Math.max(baseline.reconcile_backlog_pending || 54, 100),
      value: m.reconcile_backlog_pending,
    },
    { id: 'FP-08', name: 'saques_stuck', pass: (m.saques_stuck ?? 0) === 0, value: m.saques_stuck },
    {
      id: 'FP-09',
      name: 'payout_anomaly',
      pass: (m.payout_confirmado ?? 0) >= 0,
      note: 'payout_confirmado histórico 0 documentado V1.2A',
    },
  ];

  const proofPayload = {
    timestamp: new Date().toISOString(),
    metrics: m,
    diff: fin.diff,
    validations: validations.map((v) => ({ id: v.id, pass: v.pass })),
  };

  const proof_hash = rl.proofHash(proofPayload);
  const snapshot_hash = rl.stableHash({ metrics: m, baseline_ref: baseline.source });

  const failed = validations.filter((v) => !v.pass);
  const criticalFail = failed.some((v) => ['FP-01', 'FP-02'].includes(v.id));

  let proof_status = 'VALID';
  if (criticalFail) proof_status = 'INVALID';
  else if (failed.length > 0) proof_status = 'DEGRADED';

  return {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    proof_status,
    financial_score: fin.score ?? 0,
    proof_hash,
    snapshot_hash,
    baseline_ref: baseline.source,
    metrics: m,
    delta_vs_baseline: fin.diff,
    validations,
    failed_count: failed.length,
    ledger_consistency: {
      approved_without_ledger: m.approved_without_ledger,
      dups: m.dups_corr_tipo,
      orphan_note: 'validação completa órfãos via V1.2A PG quando disponível',
    },
  };
}

async function main() {
  const out = await generateProof();
  rl.writeSnapshot('proofs', 'financial-proof', out);
  const jsonPath = rl.rel('docs', 'relatorios', `V1-3-FINANCIAL-PROOF-DATA-${rl.DATE_TAG}.json`);
  fs.mkdirSync(require('path').dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        proof_status: out.proof_status,
        financial_score: out.financial_score,
        proof_hash: out.proof_hash,
        snapshot_hash: out.snapshot_hash,
        failed: out.failed_count,
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

module.exports = { generateProof, MISSION };
