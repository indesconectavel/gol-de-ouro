'use strict';



/**

 * PE.2F — bridge de compatibilidade claim legado ↔ DepositClaimPort.

 *

 * Flag OFF (default): chama claimApprovedPixDeposit homologado — comportamento idêntico.

 * Flag ON: core neutro + GolDeOuroDepositClaimAdapter (sem mutação dupla).

 *

 * Nunca executa legado + port com mutação no mesmo caminho.

 */



const { claimApprovedPixDeposit } = require('../../finance/deposit/claimApprovedPixDeposit');

const { isDepositClaimPortEnabled } = require('../boundary/deposit-claim-port-config');

const { createGolDeOuroDepositClaimAdapter } = require('../adapters/goldeouro/GolDeOuroDepositClaimAdapter');

const { claimApprovedDeposit } = require('../core/claimApprovedDeposit');

const { normalizeDepositClaimInput, normalizeDepositClaimResult } = require('../types/DepositClaimInput');



/**

 * @param {{ supabase: object, createLedgerEntry: Function, log?: Function }} deps

 * @param {string} paymentId

 * @returns {Promise<{ ok: boolean, credited: boolean, idempotent: boolean }>}

 */

async function claimApprovedPixDepositCompat(deps, paymentId) {

  if (!isDepositClaimPortEnabled()) {

    return claimApprovedPixDeposit(deps, paymentId);

  }



  const input = normalizeDepositClaimInput(paymentId);

  const depositClaim = createGolDeOuroDepositClaimAdapter({

    supabase: deps.supabase,

    createLedgerEntry: deps.createLedgerEntry,

    log: deps.log

  });



  const result = await claimApprovedDeposit(input, { depositClaim });



  // Shape legado para consumidores existentes (ok/credited/idempotent).

  return {

    ok: !!result.ok,

    credited: !!result.credited,

    idempotent: !!result.idempotent

  };

}



/**

 * Compara legado vs port path com os mesmos deps (tests / smoke — mocks only).

 * @returns {Promise<{ legacy: object, port: object, equivalent: boolean }>}

 */

async function compareLegacyAndPortClaim(deps, paymentId) {

  const legacy = await claimApprovedPixDeposit(deps, paymentId);

  const adapter = createGolDeOuroDepositClaimAdapter(deps);

  const port = await claimApprovedDeposit(normalizeDepositClaimInput(paymentId), {

    depositClaim: adapter

  });

  const normalizedPort = normalizeDepositClaimResult(port);

  const equivalent =

    !!legacy.ok === !!normalizedPort.ok &&

    !!legacy.credited === !!normalizedPort.credited &&

    !!legacy.idempotent === !!normalizedPort.idempotent;



  return { legacy, port: normalizedPort, equivalent };

}



module.exports = {

  claimApprovedPixDepositCompat,

  compareLegacyAndPortClaim

};

