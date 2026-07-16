'use strict';



const RuntimeBoundary = require('../runtime/RuntimeBoundary');



let asaasPayoutRecovering = false;



/**

 * Ciclo de recovery PIX OUT Asaas — PE.2K via RuntimeBoundary

 * (flag runtime OFF = legado idêntico; ON = facade).

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

  if (!RuntimeBoundary.isAsaasPayoutRecoveryEnabled()) return;



  try {

    asaasPayoutRecovering = true;

    const result = await RuntimeBoundary.reconcileAsaasPendingPayouts({ supabase, financeLog });

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

