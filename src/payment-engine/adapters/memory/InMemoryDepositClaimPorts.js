'use strict';



/**

 * PE.2F — adapters in-memory para testes sem mutação real / sem banco.

 */



const { normalizeDepositClaimResult } = require('../../types/DepositClaimInput');



/**

 * @param {object} [seed]

 * @returns {{

 *   depositClaim: import('../../ports/DepositClaimPort').DepositClaimPort,

 *   wallet: import('../../ports/WalletPort').WalletPort,

 *   ledger: import('../../ports/LedgerPort').LedgerPort,

 *   state: object

 * }}

 */

function createInMemoryDepositClaimPorts(seed = {}) {

  const state = {

    deposits: new Map(Object.entries(seed.deposits || {})),

    balances: new Map(Object.entries(seed.balances || {})),

    ledger: [...(seed.ledger || [])],

    creditCalls: 0,

    ledgerAppends: 0,

    claimCalls: 0

  };



  const depositClaim = {

    productId: 'in-memory',



    async findByProviderPaymentId(providerPaymentId) {

      const id = String(providerPaymentId || '');

      const deposit = state.deposits.get(id) || null;

      return { found: !!deposit, deposit, error: null };

    },



    async claimApprovedDeposit(input) {

      state.claimCalls += 1;

      const id = String(input.providerPaymentId || '');

      const deposit = state.deposits.get(id);



      if (!deposit) {

        return normalizeDepositClaimResult({

          ok: false,

          credited: false,

          idempotent: false,

          reason: 'DEPOSIT_NOT_FOUND',

          correlationId: input.correlationId

        });

      }



      // Check-and-set síncrono — simula claim único sob concorrência local.

      if (deposit.status === 'approved' || deposit._claiming) {

        return normalizeDepositClaimResult({

          ok: true,

          credited: false,

          idempotent: true,

          reason: 'ALREADY_APPROVED',

          accountId: deposit.accountId,

          amount: deposit.amount,

          correlationId: input.correlationId,

          metadata: { effectsApplied: deposit.status === 'approved' }

        });

      }



      if (deposit.status !== 'pending') {

        return normalizeDepositClaimResult({

          ok: false,

          credited: false,

          idempotent: false,

          reason: 'INVALID_STATUS',

          accountId: deposit.accountId,

          amount: deposit.amount,

          correlationId: input.correlationId,

          metadata: { effectsApplied: false, status: deposit.status }

        });

      }



      deposit._claiming = true;



      // Claim row only — orquestração credit/ledger fica no core quando orchestrated.

      // Se metadata.atomic=true, simula all-in-one (como adapter GDO).

      if (input.metadata?.atomic === true) {

        const accountId = deposit.accountId;

        const amount = deposit.amount;

        const corr = input.correlationId || id;

        const existing = state.ledger.find(

          (e) => e.correlationId === corr && (e.type === 'deposito' || e.type === 'deposit')

        );

        if (existing) {

          deposit.status = 'approved';

          delete deposit._claiming;

          return normalizeDepositClaimResult({

            ok: true,

            credited: false,

            idempotent: true,

            reason: 'IDEMPOTENT',

            accountId,

            amount,

            correlationId: corr,

            ledgerId: existing.id,

            metadata: { effectsApplied: true }

          });

        }

        const ledId = `led-${corr}`;

        state.ledger.push({

          id: ledId,

          accountId,

          type: 'deposito',

          amount,

          reference: deposit.depositId,

          correlationId: corr

        });

        state.ledgerAppends += 1;

        const prev = Number(state.balances.get(accountId) || 0);

        state.balances.set(accountId, prev + amount);

        state.creditCalls += 1;

        deposit.status = 'approved';

        delete deposit._claiming;

        return normalizeDepositClaimResult({

          ok: true,

          credited: true,

          idempotent: false,

          reason: 'CREDITED',

          accountId,

          amount,

          correlationId: corr,

          ledgerId: ledId,

          metadata: { effectsApplied: true }

        });

      }



      deposit.status = 'approved';

      delete deposit._claiming;

      return normalizeDepositClaimResult({

        ok: true,

        credited: false,

        idempotent: false,

        reason: 'CLAIMED_ROW',

        accountId: deposit.accountId,

        amount: deposit.amount,

        correlationId: input.correlationId,

        metadata: { effectsApplied: false, depositId: deposit.depositId }

      });

    },



    async markProcessed(input) {

      return normalizeDepositClaimResult({

        ok: true,

        credited: false,

        idempotent: true,

        reason: 'MARK_PROCESSED_NOOP',

        correlationId: input.correlationId

      });

    },



    async markFailed(input) {

      return normalizeDepositClaimResult({

        ok: false,

        credited: false,

        idempotent: false,

        reason: input.reason || 'MARK_FAILED',

        correlationId: input.correlationId

      });

    }

  };



  const wallet = {

    productId: 'in-memory',

    async getBalance(accountId) {

      return { success: true, balance: Number(state.balances.get(accountId) || 0) };

    },

    async debit(accountId, amount) {

      const prev = Number(state.balances.get(accountId) || 0);

      const next = prev - Number(amount);

      state.balances.set(accountId, next);

      return { success: true, balance: next };

    },

    async credit(accountId, amount, _meta) {

      state.creditCalls += 1;

      const prev = Number(state.balances.get(accountId) || 0);

      const next = prev + Number(amount);

      state.balances.set(accountId, next);

      return { success: true, balance: next };

    }

  };



  const ledger = {

    productId: 'in-memory',

    async append(entry) {

      state.ledgerAppends += 1;

      const existing = state.ledger.find(

        (e) => e.correlationId === entry.correlationId && e.type === entry.type

      );

      if (existing) {

        return { success: true, id: existing.id, duplicate: true };

      }

      const id = `led-${entry.correlationId}-${state.ledger.length + 1}`;

      state.ledger.push({

        id,

        accountId: entry.accountId,

        type: entry.type,

        amount: entry.amount,

        reference: entry.reference,

        correlationId: entry.correlationId,

        metadata: entry.metadata

      });

      return { success: true, id, duplicate: false };

    },

    async findByCorrelation(correlationId) {

      return state.ledger

        .filter((e) => e.correlationId === String(correlationId))

        .map((e) => ({

          accountId: e.accountId,

          type: e.type,

          amount: e.amount,

          reference: e.reference,

          correlationId: e.correlationId,

          metadata: { id: e.id, ...(e.metadata || {}) }

        }));

    }

  };



  return { depositClaim, wallet, ledger, state };

}



module.exports = {

  createInMemoryDepositClaimPorts

};

