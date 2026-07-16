'use strict';



const depositCore = require('../core/deposit');

const providersCore = require('../providers');

const { createGolDeOuroAdapters } = require('../adapters/goldeouro');

const { startSchedulers, runMpDepositReconcileCycle, runAsaasPayoutRecoveryCycle } = require('../scheduler');

const { getFinanceSurface, resolveFinanceSurface } = require('../boundary/resolveFinanceSurface');

const {

  processPendingWithdrawalsCompat,

  createLedgerEntryCompat,

  rollbackWithdrawCompat,

  payoutCountersCompat,

  isAsaasPayoutRecoveryEnabledCompat,

  approveWithdrawManualAdminCompat,

  approveAndSendWithdrawAdminCompat,

  cancelWithdrawManualAdminCompat

} = require('../compat/payoutBoundaryBridge');

const { isPayoutBoundaryEnabled } = require('../boundary/payout-boundary-config');

const { isRuntimeBoundaryEnabled } = require('../boundary/runtime-boundary-config');

const { isProviderBoundaryEnabled } = require('../boundary/provider-boundary-config');



/**

 * Fachada pública da Indesconectável Payment Engine™ (P2.2 / PE.2I).

 * Finance legado via financeLegacySurface — Core não importa finance/*.

 */

function finance() {

  return getFinanceSurface();

}



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



    const createLedgerEntry =

      deps.createLedgerEntry || ((input) => createLedgerEntryCompat(input));

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



  /** PE.2I — inspeção do modo de fronteira Core↔Finance */

  financeBoundary() {

    return resolveFinanceSurface();

  },



  deposit: {

    createCompat(input) {

      return finance().createPixDepositCompat(input);

    },

    create(input) {

      return finance().createPixDeposit(input);

    },

    isConfigured(options) {

      return finance().isPixDepositConfigured(options);

    },

    getHealth() {

      return finance().getPixDepositHealth();

    },

    claimApproved(paymentId, deps) {

      // PE.2F — compat bridge (flag deposit claim OFF = legado idêntico)

      return depositCore.claimApprovedPixDepositCompat(deps, paymentId);

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

      const createLedgerEntry = (input) => createLedgerEntryCompat(input);

      const financeLog = runtime.financeLog || (() => {});

      try {

        const result = await depositCore.claimApprovedPixDepositCompat(

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

    },

    /**

     * PE.2F — claim via ports (neutro).

     */

    claimApprovedViaPorts(input, ports) {

      return depositCore.claimApprovedDeposit(input, ports);

    }

  },



  withdraw: {

    createCompat(...args) {

      return finance().createPixWithdrawCompat(...args);

    },

    processPending(input) {

      // PE.2J — flag OFF = domain/payout idêntico; ON = ports → adapter → legado

      return processPendingWithdrawalsCompat(input);

    },

    createLedgerEntry(input) {

      return createLedgerEntryCompat(input);

    },

    rollback(input) {

      return rollbackWithdrawCompat(input);

    },

    approveManualAdmin(input) {

      return approveWithdrawManualAdminCompat(input);

    },

    approveAndSendAdmin(input) {

      return approveAndSendWithdrawAdminCompat(input);

    },

    cancelManualAdmin(input) {

      return cancelWithdrawManualAdminCompat(input);

    },

    get counters() {

      return payoutCountersCompat();

    }

  },



  webhooks: {

    processCompat(input) {

      return finance().processPaymentWebhookCompat(input);

    },

    process(input) {

      return finance().processPaymentWebhook(input);

    },

    processFromPayload(webhookPayload, extras = {}) {

      const GdoWebhookHttpBridge = require('../bridges/http/GdoWebhookHttpBridge');

      const input = GdoWebhookHttpBridge.toEngineInput(webhookPayload, extras);

      if (extras.res) {

        return finance().processPaymentWebhookCompat(input);

      }

      return finance().processPaymentWebhook(input);

    },

    processFromExpress(req, options = {}) {

      const GdoWebhookHttpBridge = require('../bridges/http/GdoWebhookHttpBridge');

      const input = GdoWebhookHttpBridge.buildProcessInput(req, options);

      if (options.res) {

        return finance().processPaymentWebhookCompat(input);

      }

      return finance().processPaymentWebhook(input);

    },

    extractPayload(req, options = {}) {

      const GdoWebhookHttpBridge = require('../bridges/http/GdoWebhookHttpBridge');

      return GdoWebhookHttpBridge.extract(req, options);

    },

    processAsaasTransfer(input) {

      return finance().processAsaasTransferWebhook(input);

    },

    handleAsaasTransferAuthorization(input) {

      return finance().handleAsaasTransferAuthorization(input);

    },

    isEngineEnabled() {

      return finance().isPaymentWebhookEngineEnabled();

    },

    isAsaasRouteAllowed() {

      return finance().isAsaasWebhookRouteAllowed();

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

      return finance().reconcileAsaasPendingPayouts(input);

    },

    isAsaasRecoveryEnabled() {

      return isAsaasPayoutRecoveryEnabledCompat();

    }

  },



  providers() {

    return {

      resolvePayment: providersCore.resolvePaymentProvider,

      resolvePayout: providersCore.resolvePayoutProvider,

      snapshot: providersCore.getHealthSnapshot,

      assertBoot: providersCore.assertBootConfig,

      inspect: providersCore.inspect,

      resolution: providersCore.getResolutionMetadata,

      resolver: providersCore.ProviderResolver

    };

  },



  health() {

    const snapshot = providersCore.getHealthSnapshot();

    const boundary = resolveFinanceSurface();

    const resolution = providersCore.getResolutionMetadata();

    return {

      engine: 'payment-engine',

      version: 'V1',

      productId: this._adapters?.productId || 'gol-de-ouro',

      providers: snapshot,

      deposit: finance().getPixDepositHealth(),

      schedulersStarted: this._started,

      asaasRecoveryEnabled: isAsaasPayoutRecoveryEnabledCompat(),

      pe2i: {

        coreFinanceBoundaryEnabled: boundary.boundaryEnabled,

        mode: boundary.mode

      },

      pe2j: {

        payoutBoundaryEnabled: isPayoutBoundaryEnabled()

      },

      pe2k: {

        runtimeBoundaryEnabled: isRuntimeBoundaryEnabled()

      },

      pe2l: {

        providerBoundaryEnabled: isProviderBoundaryEnabled(),

        providerMode: providersCore.inspect().mode,

        resolution

      }

    };

  }

};



module.exports = PaymentEngine;

