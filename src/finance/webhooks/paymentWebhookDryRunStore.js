'use strict';

/**
 * Store controlado in-memory para webhooks Asaas sandbox (F4.5).
 * Não toca Supabase, wallet ou ledger produção.
 */

class PaymentWebhookDryRunStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.processedEvents = new Map();
    /** @type {Array<object>} */
    this.creditDecisions = [];
  }

  reset() {
    this.processedEvents.clear();
    this.creditDecisions = [];
  }

  _key(provider, eventId) {
    return `${provider}:${eventId}`;
  }

  hasProcessed(provider, eventId) {
    return this.processedEvents.has(this._key(provider, eventId));
  }

  markProcessed(event, meta = {}) {
    const key = this._key(event.provider, event.eventId);
    if (this.processedEvents.has(key)) {
      return { duplicate: true, record: this.processedEvents.get(key) };
    }
    const record = {
      provider: event.provider,
      eventId: event.eventId,
      paymentId: event.paymentId,
      status: event.status,
      amount: event.amount,
      shouldCreditWallet: event.shouldCreditWallet,
      processedAt: new Date().toISOString(),
      ...meta
    };
    this.processedEvents.set(key, record);
    return { duplicate: false, record };
  }

  recordCreditDecision(event, decision) {
    this.creditDecisions.push({
      provider: event.provider,
      eventId: event.eventId,
      paymentId: event.paymentId,
      decision,
      amount: event.amount,
      ts: new Date().toISOString()
    });
    return decision;
  }

  snapshot() {
    return {
      processedCount: this.processedEvents.size,
      creditDecisions: [...this.creditDecisions]
    };
  }
}

const defaultStore = new PaymentWebhookDryRunStore();

module.exports = {
  PaymentWebhookDryRunStore,
  defaultStore
};
