'use strict';

const { runMpDepositReconcileCycle } = require('./mpDepositReconcile');
const { runAsaasPayoutRecoveryCycle } = require('./asaasPayoutRecoveryScheduler');

/** @type {NodeJS.Timeout[]} */
const activeIntervals = [];

/**
 * Inicia schedulers financeiros — mesmas ENV e intervalos de server-fly.js (P2.2).
 * @param {object} runtime — runtime injetado pelo PaymentEngine.configure()
 */
function startSchedulers(runtime) {
  stopSchedulers();

  if (process.env.MP_RECONCILE_ENABLED !== 'false') {
    const intervalMs = parseInt(process.env.MP_RECONCILE_INTERVAL_MS || '60000', 10);
    const ms = Math.max(30000, intervalMs);
    activeIntervals.push(setInterval(() => runMpDepositReconcileCycle(runtime), ms));
    console.log(`🕒 [RECON] Reconciliação de PIX pendentes ativa a cada ${Math.round(ms / 1000)}s`);
  }

  if (process.env.ASAAS_PAYOUT_RECOVERY_ENABLED !== 'false') {
    const asaasRecoveryIntervalMs = parseInt(process.env.ASAAS_PAYOUT_RECOVERY_INTERVAL_MS || '120000', 10);
    const ms = Math.max(60000, asaasRecoveryIntervalMs);
    activeIntervals.push(setInterval(() => runAsaasPayoutRecoveryCycle(runtime), ms));
    console.log(
      `🕒 [RECON][ASAAS][PAYOUT] Recovery PIX OUT ativo a cada ${Math.round(ms / 1000)}s`
    );
  }
}

function stopSchedulers() {
  for (const id of activeIntervals) {
    clearInterval(id);
  }
  activeIntervals.length = 0;
}

module.exports = {
  startSchedulers,
  stopSchedulers,
  runMpDepositReconcileCycle,
  runAsaasPayoutRecoveryCycle
};
