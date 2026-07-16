'use strict';



/**

 * PE.2F — core neutro de claim de depósito (somente ports).

 *

 * Fluxo: claimApprovedDeposit(input, ports) → DepositClaimPort → resultado normalizado.

 * WalletPort / LedgerPort são contratos oficiais; efeitos de persistência

 * e atomicidade do produto permanecem no adapter injetado.

 *

 * Orquestração granular (find → append → credit) disponível para fakes/shadow

 * via claimApprovedDepositOrchestrated — nunca usa produção real neste gate.

 */



const {

  normalizeDepositClaimInput,

  normalizeDepositClaimResult

} = require('../types/DepositClaimInput');



/**

 * Coordena claim via DepositClaimPort (caminho canônico PE.2F).

 *

 * @param {string | import('../types/DepositClaimInput').DepositClaimInput} rawInput

 * @param {{ depositClaim: import('../ports/DepositClaimPort').DepositClaimPort }} ports

 * @returns {Promise<import('../types/DepositClaimInput').DepositClaimResult>}

 */

async function claimApprovedDeposit(rawInput, ports = {}) {

  const input = normalizeDepositClaimInput(rawInput);

  if (!input.providerPaymentId) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'INVALID_INPUT',

      correlationId: null

    });

  }



  const depositClaim = ports.depositClaim;

  if (!depositClaim || typeof depositClaim.claimApprovedDeposit !== 'function') {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'DEPOSIT_CLAIM_PORT_UNAVAILABLE',

      correlationId: input.correlationId

    });

  }



  const result = await depositClaim.claimApprovedDeposit(input);

  return normalizeDepositClaimResult({

    ...result,

    correlationId: result?.correlationId ?? input.correlationId

  });

}



/**

 * Orquestração via ports granulares (fakes / shadow / futuros adapters transacionais).

 * NÃO é o caminho produtivo all-in-one do adapter de produto. Usa apenas mock/in-memory neste gate.

 *

 * Ordem: LedgerPort.findByCorrelation → DepositClaimPort.find → claim row →

 * LedgerPort.append → WalletPort.credit

 *

 * @param {string | import('../types/DepositClaimInput').DepositClaimInput} rawInput

 * @param {{

 *   depositClaim: import('../ports/DepositClaimPort').DepositClaimPort,

 *   wallet: import('../ports/WalletPort').WalletPort,

 *   ledger: import('../ports/LedgerPort').LedgerPort

 * }} ports

 */

async function claimApprovedDepositOrchestrated(rawInput, ports = {}) {

  const input = normalizeDepositClaimInput(rawInput);

  const { depositClaim, wallet, ledger } = ports;



  if (!input.providerPaymentId) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'INVALID_INPUT'

    });

  }



  if (!depositClaim || !wallet || !ledger) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'PORTS_INCOMPLETE',

      correlationId: input.correlationId

    });

  }



  const existing = await ledger.findByCorrelation(input.correlationId);

  const depositEntries = (existing || []).filter((e) => e.type === 'deposito' || e.type === 'deposit');

  if (depositEntries.length > 0) {

    return normalizeDepositClaimResult({

      ok: true,

      credited: false,

      idempotent: true,

      reason: 'LEDGER_IDEMPOTENT',

      accountId: depositEntries[0].accountId || null,

      amount: depositEntries[0].amount ?? null,

      correlationId: input.correlationId,

      ledgerId: depositEntries[0].metadata?.id != null ? String(depositEntries[0].metadata.id) : null

    });

  }



  const found = await depositClaim.findByProviderPaymentId(input.providerPaymentId);

  if (found?.error) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'PERSISTENCE_ERROR',

      correlationId: input.correlationId,

      metadata: { error: String(found.error.message || found.error) }

    });

  }



  if (!found?.found || !found.deposit) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'DEPOSIT_NOT_FOUND',

      correlationId: input.correlationId

    });

  }



  const deposit = found.deposit;

  if (deposit.status === 'approved' || deposit.status === 'processed') {

    return normalizeDepositClaimResult({

      ok: true,

      credited: false,

      idempotent: true,

      reason: 'ALREADY_APPROVED',

      accountId: deposit.accountId,

      amount: deposit.amount,

      correlationId: input.correlationId

    });

  }



  if (deposit.status !== 'pending' && deposit.status !== 'waiting' && deposit.status !== 'open') {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'INVALID_STATUS',

      accountId: deposit.accountId,

      amount: deposit.amount,

      correlationId: input.correlationId,

      metadata: { status: deposit.status }

    });

  }



  const accountId = input.accountId || deposit.accountId;

  const amount = Number(input.amount != null ? input.amount : deposit.amount);

  if (!accountId || !Number.isFinite(amount) || amount <= 0) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'INVALID_DEPOSIT_RECORD',

      accountId: accountId || null,

      amount: Number.isFinite(amount) ? amount : null,

      correlationId: input.correlationId

    });

  }



  const claimResult = await depositClaim.claimApprovedDeposit({

    ...input,

    accountId,

    amount,

    metadata: { ...(input.metadata || {}), orchestrated: true, depositId: deposit.depositId }

  });



  if (!claimResult?.ok) {

    return normalizeDepositClaimResult({

      ...claimResult,

      correlationId: input.correlationId

    });

  }



  if (claimResult.idempotent && !claimResult.credited) {

    return normalizeDepositClaimResult({

      ...claimResult,

      correlationId: input.correlationId

    });

  }



  // Se o adapter já creditou (modo all-in-one), não duplicar wallet/ledger.

  if (claimResult.credited || claimResult.metadata?.effectsApplied === true) {

    return normalizeDepositClaimResult({

      ...claimResult,

      correlationId: input.correlationId

    });

  }



  const ledgerRes = await ledger.append({

    accountId: String(accountId),

    type: 'deposito',

    amount,

    reference: String(deposit.depositId),

    correlationId: input.correlationId,

    metadata: input.metadata || {}

  });



  if (!ledgerRes?.success) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'LEDGER_ERROR',

      accountId: String(accountId),

      amount,

      correlationId: input.correlationId,

      metadata: { error: ledgerRes?.error }

    });

  }



  if (ledgerRes.duplicate) {

    return normalizeDepositClaimResult({

      ok: true,

      credited: false,

      idempotent: true,

      reason: 'LEDGER_DEDUPED',

      accountId: String(accountId),

      amount,

      correlationId: input.correlationId,

      ledgerId: ledgerRes.id || null

    });

  }



  const walletRes = await wallet.credit(String(accountId), amount, {

    correlationId: input.correlationId,

    reference: String(deposit.depositId),

    reason: 'deposit_claim'

  });



  if (!walletRes?.success) {

    return normalizeDepositClaimResult({

      ok: false,

      credited: false,

      idempotent: false,

      reason: 'WALLET_ERROR',

      accountId: String(accountId),

      amount,

      correlationId: input.correlationId,

      ledgerId: ledgerRes.id || null,

      metadata: { error: walletRes?.error }

    });

  }



  return normalizeDepositClaimResult({

    ok: true,

    credited: true,

    idempotent: false,

    reason: 'CREDITED',

    accountId: String(accountId),

    amount,

    correlationId: input.correlationId,

    ledgerId: ledgerRes.id || null

  });

}



module.exports = {

  claimApprovedDeposit,

  claimApprovedDepositOrchestrated

};

