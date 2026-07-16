'use strict';



/**

 * PE.2F — DepositClaimPort™ (neutro; sem Supabase / schema GDO na assinatura).

 *

 * Responsabilidades mínimas refletindo o fluxo real de claimApprovedPixDeposit:

 * - localizar depósito por providerPaymentId

 * - validar elegibilidade (status, valor, account)

 * - executar claim atômico ou equivalente (RPC GDO ou claim row + ledger + wallet no adapter)

 * - retornar estado normalizado

 *

 * Nunca expor: cliente Supabase, nomes de tabelas, detalhes GDO ao core.

 *

 * @typedef {import('../types/DepositClaimInput').DepositClaimInput} DepositClaimInput

 * @typedef {import('../types/DepositClaimInput').DepositClaimResult} DepositClaimResult

 *

 * @typedef {Object} DepositRecord

 * @property {string} depositId

 * @property {string | null} accountId

 * @property {number} amount

 * @property {string} status

 * @property {string | null} providerPaymentId

 * @property {string | null} correlationId

 * @property {Record<string, unknown>} [metadata]

 *

 * @typedef {Object} DepositClaimPort

 * @property {string} productId

 * @property {(providerPaymentId: string) => Promise<{ found: boolean, deposit: DepositRecord | null, error?: object }>} findByProviderPaymentId

 * @property {(input: DepositClaimInput) => Promise<DepositClaimResult>} claimApprovedDeposit

 * @property {(input: DepositClaimInput & { reason?: string }) => Promise<DepositClaimResult>} [markProcessed]

 * @property {(input: DepositClaimInput & { reason?: string, error?: object }) => Promise<DepositClaimResult>} [markFailed]

 */



module.exports = {};

