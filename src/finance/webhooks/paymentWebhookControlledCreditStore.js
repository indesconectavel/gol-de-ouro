'use strict';

const crypto = require('crypto');

const CREDIT_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Wallet + ledger controlados in-memory (Opção B — F4.6).
 * Schema equivalente V1: usuarios, pagamentos_pix, ledger_financeiro.
 */
class PaymentWebhookControlledCreditStore {
  constructor() {
    this.usuarios = [];
    this.pagamentos_pix = [];
    this.ledger_financeiro = [];
    /** @type {Set<string>} */
    this.processedIdempotencyKeys = new Set();
    /** @type {Array<object>} */
    this.decisions = [];
  }

  reset() {
    this.usuarios = [];
    this.pagamentos_pix = [];
    this.ledger_financeiro = [];
    this.processedIdempotencyKeys.clear();
    this.decisions = [];
  }

  createControlledUser({ email = 'f46-controlled@goldeouro.test', nome = 'Usuario F4.6 Controlado' } = {}) {
    const user = {
      id: newId('usr'),
      email,
      nome,
      saldo: 0,
      provider: 'asaas',
      testOnly: true,
      created_at: nowIso()
    };
    this.usuarios.push(user);
    return user;
  }

  getUser(userId) {
    return this.usuarios.find((u) => u.id === userId) ?? null;
  }

  getSaldo(userId) {
    return this.getUser(userId)?.saldo ?? null;
  }

  recordPixDepositPending({ userId, providerPaymentId, amount, externalReference }) {
    const row = {
      id: newId('pix'),
      usuario_id: userId,
      payment_id: String(providerPaymentId),
      external_id: externalReference ?? String(providerPaymentId),
      provider: 'asaas',
      amount: roundMoney(amount),
      valor: roundMoney(amount),
      status: 'pending',
      created_at: nowIso(),
      updated_at: nowIso()
    };
    this.pagamentos_pix.push(row);
    return row;
  }

  _idempotencyKeys(event) {
    const keys = [];
    if (event.eventId) keys.push(`event:${event.provider}:${event.eventId}`);
    if (event.paymentId) keys.push(`payment:${event.provider}:${event.paymentId}:${event.eventType}`);
    if (event.externalReference) {
      keys.push(`ext:${event.provider}:${event.externalReference}:${event.eventType}`);
    }
    return keys;
  }

  _hasIdempotent(keys) {
    return keys.some((k) => this.processedIdempotencyKeys.has(k));
  }

  _markIdempotent(keys) {
    for (const k of keys) {
      this.processedIdempotencyKeys.add(k);
    }
  }

  _recordDecision(event, decision, extra = {}) {
    const row = {
      decision,
      provider: event.provider,
      eventId: event.eventId,
      paymentId: event.paymentId,
      externalReference: event.externalReference,
      amount: event.amount,
      ts: nowIso(),
      ...extra
    };
    this.decisions.push(row);
    return row;
  }

  /**
   * Crédito wallet + ledger a partir de evento normalizado (Payment Engine).
   */
  creditFromWebhookEvent({ event, body = {} }) {
    if (!event || !event.provider) {
      return { ok: false, decision: 'blocked_invalid', reason: 'missing_event' };
    }

    if (!event.shouldCreditWallet) {
      return { ok: true, decision: 'skipped_not_credit_event', credited: false, financialEffect: false };
    }

    if (!CREDIT_EVENTS.has(String(event.eventType || '').toUpperCase())) {
      return {
        ok: false,
        decision: 'blocked_invalid',
        reason: 'event_not_creditable',
        eventType: event.eventType
      };
    }

    const idempotencyKeys = this._idempotencyKeys(event);
    if (this._hasIdempotent(idempotencyKeys)) {
      this._recordDecision(event, 'ignored_duplicate', { idempotent: true });
      const userId = this._findUserIdForPayment(event.paymentId, event.externalReference);
      return {
        ok: true,
        decision: 'ignored_duplicate',
        credited: false,
        idempotent: true,
        financialEffect: false,
        saldo: userId ? this.getSaldo(userId) : null,
        idempotencyKeys
      };
    }

    const pix =
      this.pagamentos_pix.find(
        (p) =>
          p.payment_id === String(event.paymentId) ||
          p.external_id === String(event.paymentId) ||
          (event.externalReference &&
            (p.external_id === event.externalReference || p.payment_id === event.externalReference))
      ) ?? null;

    if (!pix) {
      this._recordDecision(event, 'blocked_invalid', { reason: 'deposit_not_found' });
      return { ok: false, decision: 'blocked_invalid', reason: 'deposit_not_found' };
    }

    const user = this.getUser(pix.usuario_id);
    if (!user) {
      this._recordDecision(event, 'blocked_invalid', { reason: 'user_not_found' });
      return { ok: false, decision: 'blocked_invalid', reason: 'user_not_found' };
    }

    const ledgerDuplicate = this.ledger_financeiro.find(
      (l) =>
        l.tipo === 'deposito' &&
        l.provider === 'asaas' &&
        (l.correlation_id === String(event.paymentId) ||
          l.payment_id === String(event.paymentId) ||
          l.idempotency_key === idempotencyKeys[0])
    );

    if (ledgerDuplicate) {
      this._markIdempotent(idempotencyKeys);
      this._recordDecision(event, 'ignored_duplicate', { idempotent: true, ledgerId: ledgerDuplicate.id });
      return {
        ok: true,
        decision: 'ignored_duplicate',
        credited: false,
        idempotent: true,
        financialEffect: false,
        saldo: user.saldo,
        ledgerId: ledgerDuplicate.id
      };
    }

    const credit = roundMoney(event.amount ?? pix.amount);
    user.saldo = roundMoney(user.saldo + credit);
    pix.status = 'approved';
    pix.approved_at = nowIso();
    pix.updated_at = nowIso();

    const ledgerId = newId('led');
    const idempotencyKey = idempotencyKeys[0] || `asaas:${event.eventId}`;

    this.ledger_financeiro.push({
      id: ledgerId,
      tipo: 'deposito',
      provider: 'asaas',
      valor: credit,
      amount: credit,
      external_reference: event.externalReference ?? pix.external_id,
      payment_id: String(event.paymentId),
      event_id: event.eventId,
      idempotency_key: idempotencyKey,
      correlation_id: String(event.paymentId),
      referencia: pix.id,
      user_id: user.id,
      usuario_id: user.id,
      created_at: nowIso()
    });

    this._markIdempotent(idempotencyKeys);
    this._recordDecision(event, 'credited', { credited: true, ledgerId, saldo: user.saldo });

    return {
      ok: true,
      decision: 'credited',
      credited: true,
      idempotent: false,
      financialEffect: true,
      controlledCredit: true,
      saldo: user.saldo,
      saldoAnterior: roundMoney(user.saldo - credit),
      credit,
      ledgerId,
      pagamentosPixId: pix.id,
      idempotencyKey,
      ledgerEntry: this.ledger_financeiro[this.ledger_financeiro.length - 1]
    };
  }

  _findUserIdForPayment(paymentId, externalReference) {
    const pix = this.pagamentos_pix.find(
      (p) =>
        p.payment_id === String(paymentId) ||
        p.external_id === String(paymentId) ||
        (externalReference && p.external_id === externalReference)
    );
    return pix?.usuario_id ?? null;
  }

  snapshot() {
    return {
      users: this.usuarios.map((u) => ({
        id: `${String(u.id).slice(0, 8)}...`,
        saldo: u.saldo,
        testOnly: u.testOnly
      })),
      pagamentosPix: this.pagamentos_pix.length,
      ledgerCount: this.ledger_financeiro.length,
      idempotencyKeys: this.processedIdempotencyKeys.size,
      decisions: [...this.decisions]
    };
  }

  getLedgerDeposits() {
    return this.ledger_financeiro.filter((l) => l.tipo === 'deposito');
  }
}

module.exports = {
  PaymentWebhookControlledCreditStore,
  CREDIT_EVENTS
};
