'use strict';

const depositCore = require('../core/deposit');
const withdrawCore = require('../core/withdraw');
const webhooksCore = require('../core/webhooks');
const reconciliationCore = require('../core/reconciliation');
const providersCore = require('../providers');
const { createGolDeOuroAdapters } = require('../adapters/goldeouro');
const { startSchedulers, runMpDepositReconcileCycle, runAsaasPayoutRecoveryCycle } = require('../scheduler');

/**
 * Fachada pública da Indesconectável Payment Engine™ (P2.2).
 * Delega para src/finance/ e src/domain/payout/ sem alterar comportamento.
 */
const PaymentEngine = {
  /** @type {object|null} */
  _runtime: null,
  /** @type {object|null} */
  _adapters: null,
  _started: false,

  /**
   * Injeta dependências de runtime (supabase, financeLog, flags MP).
   * @param {object} deps
   */
  configure(deps = {}) {
    this._runtime = {
      getSupabase: deps.getSupabase || (() => null),
      financeLog: deps.financeLog || (() => {}),
      getDbConnected: deps.getDbConnected || (() => false),
      getMercadoPagoConnected: deps.getMercadoPagoConnected || (() => false),
      getMercadoPagoAccessToken: deps.getMercadoPagoAccessToken || (() => null),
      claimAndCreditApprovedPixDeposit:
        deps.claimAndCreditApprovedPixDeposit || this.deposit.claimAndCredit.bind(this.deposit)
    };

    const createLedgerEntry = deps.createLedgerEntry || withdrawCore.createLedgerEntry;
    this._adapters = createGolDeOuroAdapters({ createLedgerEntry });

    if (deps.productId && deps.productId !== 'gol-de-ouro') {
      this._adapters.productId = deps.productId;
    }

    return this;
  },

  /**
   * Inicia schedulers (MP reconcile + Asaas recovery) — mesmas ENV da V1.
   */
  start() {
    if (!this._runtime) {
      this.configure({});
    }
    this._runtime.claimAndCreditApprovedPixDeposit = (id) => this.deposit.claimAndCredit(id);
    if (this._started) return this;
    startSchedulers(this._runtime);
    this._started = true;
    return this;
  },

  /** Adapters do produto ativo (Gol de Ouro™ por default). */
  adapters() {
    if (!this._adapters) {
      this.configure({});
    }
    return this._adapters;
  },

  deposit: {
    createCompat(input) {
      return depositCore.createPixDepositCompat(input);
    },
    create(input) {
      return depositCore.createPixDeposit(input);
    },
    isConfigured(options) {
      return depositCore.isPixDepositConfigured(options);
    },
    getHealth() {
      return depositCore.getPixDepositHealth();
    },
    claimApproved(paymentId, deps) {
      return depositCore.claimApprovedPixDeposit(deps, paymentId);
    },
    /**
     * Wrapper de alto nível — equivalente a claimAndCreditApprovedPixDeposit do monólito.
     */
    async claimAndCredit(paymentId) {
      const engine = PaymentEngine;
      const runtime = engine._runtime || {};
      const supabase = runtime.getSupabase?.();
      if (!supabase) return false;
      const idStr = String(paymentId || '').trim();
      if (!idStr) return false;
      const createLedgerEntry = withdrawCore.createLedgerEntry;
      const financeLog = runtime.financeLog || (() => {});
      try {
        const result = await depositCore.claimApprovedPixDeposit(
          {
            supabase,
            createLedgerEntry,
            log: (event, payload = {}) => financeLog(event, { ...payload, tipo: 'deposito' })
          },
          idStr
        );
        return !!result.ok;
      } catch (error) {
        financeLog('deposit_claim_unexpected_error', {
          payment_id: idStr,
          tipo: 'deposito',
          status: 'error',
          error: error.message
        });
        return false;
      }
    }
  },

  withdraw: {
    createCompat(...args) {
      return withdrawCore.createPixWithdrawCompat(...args);
    },
    processPending(input) {
      return withdrawCore.processPendingWithdrawals(input);
    },
    createLedgerEntry(input) {
      return withdrawCore.createLedgerEntry(input);
    },
    rollback(input) {
      return withdrawCore.rollbackWithdraw(input);
    },
    get counters() {
      return withdrawCore.payoutCounters;
    }
  },

  webhooks: {
    processCompat(input) {
      return webhooksCore.processPaymentWebhookCompat(input);
    },
    process(input) {
      return webhooksCore.processPaymentWebhook(input);
    },
    processAsaasTransfer(input) {
      return webhooksCore.processAsaasTransferWebhook(input);
    },
    handleAsaasTransferAuthorization(input) {
      return webhooksCore.handleAsaasTransferAuthorization(input);
    },
    isEngineEnabled() {
      return webhooksCore.isPaymentWebhookEngineEnabled();
    },
    isAsaasRouteAllowed() {
      return webhooksCore.isAsaasWebhookRouteAllowed();
    }
  },

  reconcile: {
    mpDeposits(runtime) {
      return runMpDepositReconcileCycle(runtime || PaymentEngine._runtime);
    },
    asaasPayouts(runtime) {
      return runAsaasPayoutRecoveryCycle(runtime || PaymentEngine._runtime);
    },
    asaasPendingPayouts(input) {
      return reconciliationCore.reconcileAsaasPendingPayouts(input);
    },
    isAsaasRecoveryEnabled() {
      return reconciliationCore.isAsaasPayoutRecoveryEnabled();
    }
  },

  providers() {
    return {
      resolvePayment: providersCore.resolvePaymentProvider,
      resolvePayout: providersCore.resolvePayoutProvider,
      snapshot: providersCore.getHealthSnapshot,
      assertBoot: providersCore.assertBootConfig
    };
  },

  health() {
    const snapshot = providersCore.getHealthSnapshot();
    return {
      engine: 'payment-engine',
      version: 'V1',
      productId: this._adapters?.productId || 'gol-de-ouro',
      providers: snapshot,
      deposit: depositCore.getPixDepositHealth(),
      schedulersStarted: this._started,
      asaasRecoveryEnabled: reconciliationCore.isAsaasPayoutRecoveryEnabled()
    };
  }
};

module.exports = PaymentEngine;
