'use strict';



/**

 * PE.2F — GolDeOuroDepositClaimAdapter™

 *

 * Concentra toda dependência GDO do claim:

 * - Supabase / RPC claim_and_credit_approved_pix_deposit

 * - pagamentos_pix / usuarios / ledger_financeiro (via legado homologado)

 *

 * Delega ao fluxo certificado em finance/deposit/claimApprovedPixDeposit.js

 * para preservar atomicidade, idempotência e equivalência byte-a-byte do resultado.

 *

 * Shadow: ativo somente com PE_DEPOSIT_CLAIM_PORT_ENABLED=true.

 */



const {

  claimApprovedPixDeposit,

  isAsaasProviderPaymentId

} = require('../../../finance/deposit/claimApprovedPixDeposit');

const {

  normalizeDepositClaimInput,

  normalizeDepositClaimResult

} = require('../../types/DepositClaimInput');



/**

 * @param {object} row

 * @returns {import('../../ports/DepositClaimPort').DepositRecord | null}

 */

function mapPixRowToDepositRecord(row) {

  if (!row) return null;

  const providerPaymentId = row.payment_id || row.external_id || null;

  return {

    depositId: String(row.id),

    accountId: row.usuario_id != null ? String(row.usuario_id) : null,

    amount: Number(row.amount ?? row.valor ?? 0),

    status: String(row.status || 'unknown'),

    providerPaymentId: providerPaymentId != null ? String(providerPaymentId) : null,

    correlationId: providerPaymentId != null ? String(providerPaymentId) : null,

    metadata: {

      // metadados neutros — sem expor schema cru ao core

      hasExternalId: row.external_id != null,

      hasPaymentId: row.payment_id != null

    }

  };

}



/**

 * @param {object} deps

 * @param {object} deps.supabase

 * @param {Function} deps.createLedgerEntry

 * @param {Function} [deps.log]

 * @returns {import('../../ports/DepositClaimPort').DepositClaimPort}

 */

function createGolDeOuroDepositClaimAdapter(deps = {}) {

  const { supabase, createLedgerEntry, log = () => {} } = deps;



  return {

    productId: 'gol-de-ouro',



    async findByProviderPaymentId(providerPaymentId) {

      const id = String(providerPaymentId || '').trim();

      if (!supabase || !id) {

        return { found: false, deposit: null, error: new Error('INVALID_INPUT') };

      }



      /**

       * Consulta por coluna de provider id.

       * Resultado sempre normalizado via mapPixRowToDepositRecord (contrato DepositRecord).

       */

      const trySelect = async (column) => {

        const query = supabase

          .from('pagamentos_pix')

          .select('id, usuario_id, amount, valor, payment_id, external_id, status')

          .eq(column, id);



        const terminal =

          typeof query?.maybeSingle === 'function'

            ? query.maybeSingle()

            : typeof query?.single === 'function'

              ? query.single()

              : query;



        const { data, error } = await terminal;

        if (error) return { data: null, error };

        return { data: data || null, error: null };

      };



      let result = await trySelect('payment_id');

      if (result.error) {

        return { found: false, deposit: null, error: result.error };

      }

      if (!result.data) {

        result = await trySelect('external_id');

        if (result.error) {

          return { found: false, deposit: null, error: result.error };

        }

      }



      if (!result.data) {

        return { found: false, deposit: null, error: null };

      }



      const deposit = mapPixRowToDepositRecord(result.data);

      return {

        found: !!deposit,

        deposit,

        error: null

      };

    },



    async claimApprovedDeposit(rawInput) {

      const input = normalizeDepositClaimInput(rawInput);

      if (!supabase || !input.providerPaymentId) {

        return normalizeDepositClaimResult({

          ok: false,

          credited: false,

          idempotent: false,

          reason: 'INVALID_INPUT',

          correlationId: input.correlationId || null

        });

      }



      if (typeof createLedgerEntry !== 'function') {

        return normalizeDepositClaimResult({

          ok: false,

          credited: false,

          idempotent: false,

          reason: 'LEDGER_FN_UNAVAILABLE',

          correlationId: input.correlationId

        });

      }



      const legacy = await claimApprovedPixDeposit(

        {

          supabase,

          createLedgerEntry,

          log: (event, payload = {}) => {

            // sanitize — não logar objetos de schema crus

            const safe = {

              payment_id: payload.payment_id || input.providerPaymentId,

              status: payload.status,

              error: payload.error,

              user_id: payload.user_id,

              valor: payload.valor,

              ledger_id: payload.ledger_id

            };

            log(event, safe);

          }

        },

        input.providerPaymentId

      );



      return normalizeDepositClaimResult({

        ok: !!legacy.ok,

        credited: !!legacy.credited,

        idempotent: !!legacy.idempotent,

        reason: legacy.ok

          ? legacy.credited

            ? 'CREDITED'

            : legacy.idempotent

              ? 'IDEMPOTENT'

              : 'OK'

          : 'NOT_CREDITED',

        accountId: input.accountId,

        amount: input.amount != null ? Number(input.amount) : null,

        correlationId: input.correlationId,

        metadata: {

          effectsApplied: true,

          provider: input.provider || (isAsaasProviderPaymentId(input.providerPaymentId) ? 'asaas' : 'unknown'),

          source: 'goldeouro_deposit_claim_adapter'

        }

      });

    },



    async markProcessed(rawInput) {

      const input = normalizeDepositClaimInput(rawInput);

      return normalizeDepositClaimResult({

        ok: true,

        credited: false,

        idempotent: true,

        reason: 'MARK_PROCESSED_NOOP',

        correlationId: input.correlationId,

        metadata: { note: 'status transitions handled inside claimApprovedDeposit' }

      });

    },



    async markFailed(rawInput) {

      const input = normalizeDepositClaimInput(rawInput);

      return normalizeDepositClaimResult({

        ok: false,

        credited: false,

        idempotent: false,

        reason: rawInput?.reason || 'MARK_FAILED',

        correlationId: input.correlationId,

        metadata: { error: rawInput?.error || null }

      });

    }

  };

}



module.exports = {

  createGolDeOuroDepositClaimAdapter,

  mapPixRowToDepositRecord

};

