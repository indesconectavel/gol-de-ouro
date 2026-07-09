'use strict';

/**
 * PE.2B — smoke test local dos bridges (não toca produção nem banco).
 * Executar: node scripts/pe2b-adapter-boundary-smoke.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { isAdapterBoundaryEnabled } = require('../src/payment-engine/boundary/adapter-boundary-config');
const { webhookPayloadFromExpress, expressLikeFromWebhookPayload } = require('../src/payment-engine/compat/webhookPayloadFromExpress');
const { resolveWithdrawalIds, withWithdrawalIdAliases } = require('../src/payment-engine/compat/withdrawalIdAlias');
const { createLedgerPortFromAdapter } = require('../src/payment-engine/compat/ledgerPortBridge');
const { createWalletPortFromAdapter } = require('../src/payment-engine/compat/walletPortBridge');
const { resolveAdapterBoundaryPorts } = require('../src/payment-engine/boundary/index');

const prevFlag = process.env.PE_ADAPTER_BOUNDARY_ENABLED;
process.env.PE_ADAPTER_BOUNDARY_ENABLED = 'false';

assert.equal(isAdapterBoundaryEnabled(), false, 'default flag must be false');
assert.equal(resolveAdapterBoundaryPorts({ supabase: {} }), null, 'ports null when flag off');

process.env.PE_ADAPTER_BOUNDARY_ENABLED = 'true';
assert.equal(isAdapterBoundaryEnabled(), true, 'flag true when env set');

const mockReq = {
  method: 'post',
  originalUrl: '/webhooks/asaas',
  headers: { 'x-token': 'abc', 'content-type': 'application/json' },
  query: { ref: '1' },
  body: { event: 'PAYMENT_RECEIVED' },
  rawBody: '{"event":"PAYMENT_RECEIVED"}'
};

const payload = webhookPayloadFromExpress(mockReq, { provider: 'asaas' });
assert.equal(payload.method, 'POST');
assert.equal(payload.path, '/webhooks/asaas');
assert.equal(payload.headers['x-token'], 'abc');
assert.equal(payload.provider, 'asaas');

const roundTrip = expressLikeFromWebhookPayload(payload);
assert.equal(roundTrip.method, 'POST');
assert.equal(roundTrip.originalUrl, '/webhooks/asaas');

const ids = resolveWithdrawalIds({ saqueId: 'uuid-saque-1' });
assert.equal(ids.withdrawalId, 'uuid-saque-1');
assert.equal(ids.saqueId, 'uuid-saque-1');

const aliased = withWithdrawalIdAliases({ amount: 10, withdrawalId: 'w-1' });
assert.equal(aliased.saqueId, 'w-1');
assert.equal(aliased.withdrawalId, 'w-1');

const ledgerCalls = [];
const legacyLedger = {
  productId: 'gol-de-ouro',
  tableName: 'ledger_financeiro',
  async createEntry(input) {
    ledgerCalls.push(input);
    return { success: true, id: 'led-1', deduped: false };
  }
};

const mockSupabase = {
  from(table) {
    return {
      select() {
        return this;
      },
      eq() {
        return Promise.resolve({
          data: [{ usuario_id: 'u1', tipo: 'saque', valor: 10, referencia: 'w-1', correlation_id: 'c-1' }],
          error: null
        });
      }
    };
  }
};

const ledgerPort = createLedgerPortFromAdapter(legacyLedger, { supabase: mockSupabase });
const appendResult = await ledgerPort.append({
  accountId: 'u1',
  type: 'deposito',
  amount: 50,
  reference: 'p-1',
  correlationId: 'c-1'
});
assert.equal(appendResult.success, true);
assert.equal(appendResult.id, 'led-1');
assert.equal(ledgerCalls.length, 1);

const walletCalls = [];
const legacyWallet = {
  productId: 'gol-de-ouro',
  tableName: 'usuarios',
  balanceColumn: 'saldo',
  async getBalance(_sb, userId) {
    walletCalls.push(['get', userId]);
    return { success: true, balance: 100 };
  },
  async debitBalance(_sb, userId, amount) {
    walletCalls.push(['debit', userId, amount]);
    return { success: true, balance: 100 - amount };
  }
};

const walletPort = createWalletPortFromAdapter(legacyWallet, {
  supabase: {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: { saldo: 100 }, error: null }),
        update() {
          return this;
        }
      };
    }
  }
});

const bal = await walletPort.getBalance('u1');
assert.equal(bal.success, true);
const deb = await walletPort.debit('u1', 10);
assert.equal(deb.success, true);
assert.ok(walletPort.credit, 'wallet port must expose credit');

const ports = resolveAdapterBoundaryPorts({
  supabase: mockSupabase,
  ledgerAdapter: legacyLedger,
  walletAdapter: legacyWallet
});
assert.ok(ports);
assert.ok(ports.ledger);
assert.ok(ports.wallet);
assert.ok(ports.withdrawal);
assert.ok(ports.webhook);

process.env.PE_ADAPTER_BOUNDARY_ENABLED = prevFlag;

console.log('[PE.2B] adapter boundary smoke: PASS');
