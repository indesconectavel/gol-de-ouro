'use strict';

const { reconcileAsaasPendingPayouts, isAsaasPayoutRecoveryEnabled } = require('../core/reconciliation');

let asaasPayoutRecovering = false;

/**
 * Ciclo de recovery PIX OUT Asaas — delegação idêntica a server-fly.js (P2.2).
 *
 * @param {object} runtime
 * @param {() => object|null} runtime.getSupabase
 * @param {() => boolean} runtime.getDbConnected
 * @param {Function} runtime.financeLog
 */
async function runAsaasPayoutRecoveryCycle(runtime = {}) {
  if (asaasPayoutRecovering) return;
  const supabase = runtime.getSupabase?.();
  const dbConnected = runtime.getDbConnected?.();
  const financeLog = runtime.financeLog || (() => {});

  if (!dbConnected || !supabase) return;
  if (!isAsaasPayoutRecoveryEnabled()) return;

  try {
    asaasPayoutRecovering = true;
    const result = await reconcileAsaasPendingPayouts({ supabase, financeLog });
    if (result.reconciled > 0) {
      console.log(
        `✅ [RECON][ASAAS][PAYOUT] ${result.reconciled} saque(s) reconciliado(s) (${result.processed} processados)`
      );
    }
  } catch (err) {
    console.error('❌ [RECON][ASAAS][PAYOUT] Erro no recovery:', err.message);
  } finally {
    asaasPayoutRecovering = false;
  }
}

module.exports = { runAsaasPayoutRecoveryCycle };
