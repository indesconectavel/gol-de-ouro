#!/usr/bin/env node
/**
 * P1.4F — Verificação fallback Asaas quando RPC retorna invalid_mercadopago_id.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  isAsaasProviderPaymentId,
  shouldUseJsFallbackForRpcRejection,
  claimApprovedPixDeposit,
  claimApprovedPixDepositJsFallback
} = require('../src/finance/deposit/claimApprovedPixDeposit');
function test(name, fn) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

test('isAsaasProviderPaymentId detects pay_*', () => {
  if (!isAsaasProviderPaymentId('pay_1zr8bxbd5abypkws')) throw new Error('expected true');
  if (isAsaasProviderPaymentId('123456789')) throw new Error('numeric should be false');
});

test('shouldUseJsFallbackForRpcRejection only for Asaas + invalid_mercadopago_id', () => {
  const rpc = { ok: false, error: 'invalid_mercadopago_id' };
  if (!shouldUseJsFallbackForRpcRejection(rpc, 'pay_abc123')) throw new Error('asaas should fallback');
  if (shouldUseJsFallbackForRpcRejection(rpc, '12345')) throw new Error('mp numeric should not');
});

function buildMockSupabase({ paymentId, pixId, userId, saldoStart = 100, ledgerRows = [], pixStatus = 'pending' }) {
  const state = {
    saldo: saldoStart,
    pix: {
      id: pixId,
      usuario_id: userId,
      amount: 5,
      valor: 5,
      payment_id: paymentId,
      external_id: paymentId,
      status: pixStatus
    },
    ledger: [...ledgerRows]
  };

  const supabase = {
    rpc: async () => ({
      data: { ok: false, error: 'invalid_mercadopago_id', credited: false },
      error: null
    }),
    from(table) {
      const q = { filters: {} };
      const builder = {
        select() {
          return builder;
        },
        eq(k, v) {
          q.filters[k] = v;
          return builder;
        },
        neq() {
          return builder;
        },
        maybeSingle: async () => {
          if (table === 'ledger_financeiro') {
            const row = state.ledger.find(
              (r) => r.correlation_id === q.filters.correlation_id && r.tipo === q.filters.tipo
            );
            return { data: row || null, error: null };
          }
          if (table === 'pagamentos_pix' && q.filters.payment_id === paymentId) {
            return { data: { ...state.pix }, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => ({ data: { saldo: state.saldo }, error: null }),
        update(patch) {
          return {
            eq(k, v) {
              return {
                neq() {
                  return {
                    select: async () => {
                      if (table === 'pagamentos_pix' && k === 'payment_id' && v === paymentId) {
                        if (state.pix.status === 'approved') return { data: [], error: null };
                        state.pix = { ...state.pix, ...patch };
                        return { data: [state.pix], error: null };
                      }
                      return { data: [], error: null };
                    }
                  };
                }
              };
            },
            eq_user(k, v) {
              if (table === 'usuarios') {
                state.saldo = patch.saldo;
                return Promise.resolve({ error: null });
              }
              return Promise.resolve({ error: null });
            }
          };
        }
      };
      if (table === 'usuarios') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { saldo: state.saldo }, error: null })
            })
          }),
          update: (patch) => ({
            eq: async () => {
              state.saldo = patch.saldo;
              return { error: null };
            }
          })
        };
      }
      return builder;
    }
  };
  return { supabase, state };
}

async function mockCreateLedgerEntry({ supabase, tipo, usuarioId, valor, referencia, correlationId }) {
  const { data: existing } = await supabase
    .from('ledger_financeiro')
    .select('id')
    .eq('correlation_id', correlationId)
    .eq('tipo', tipo)
    .maybeSingle();
  if (existing?.id) return { success: true, deduped: true, id: existing.id };
  const row = {
    id: `led-${correlationId}`,
    correlation_id: correlationId,
    tipo,
    valor,
    referencia,
    usuario_id: usuarioId
  };
  // hack: access state via closure in test
  return { success: true, id: row.id, _row: row };
}

await runAsync('JS fallback credits wallet + ledger for Asaas pay_*', async () => {
  const paymentId = 'pay_p14f_unit';
  const { supabase, state } = buildMockSupabase({
    paymentId,
    pixId: '06bcc936-ce25-4474-a810-14d873448e75',
    userId: '85872488-9e4c-42df-8978-7f9ef9f5cb00'
  });

  const createLedgerEntry = async (args) => {
    const res = await mockCreateLedgerEntry(args);
    if (!res.deduped && res._row) state.ledger.push(res._row);
    return res;
  };

  const result = await claimApprovedPixDepositJsFallback(
    { supabase, createLedgerEntry, log: () => {} },
    paymentId
  );

  if (!result.ok || !result.credited) throw new Error(JSON.stringify(result));
  if (state.saldo !== 105) throw new Error(`saldo ${state.saldo}`);
  if (state.pix.status !== 'approved') throw new Error('pix not approved');
  if (state.ledger.length !== 1) throw new Error('ledger count');
});

await runAsync('claimApprovedPixDeposit routes RPC rejection to fallback', async () => {
  const paymentId = 'pay_p14froute1';
  const { supabase, state } = buildMockSupabase({
    paymentId,
    pixId: 'pix-route',
    userId: 'user-route',
    saldoStart: 50
  });
  const createLedgerEntry = async (args) => {
    const res = await mockCreateLedgerEntry(args);
    if (!res.deduped && res._row) state.ledger.push(res._row);
    return res;
  };
  const logs = [];
  const result = await claimApprovedPixDeposit(
    { supabase, createLedgerEntry, log: (event) => logs.push(event) },
    paymentId
  );
  if (!result.ok) throw new Error(JSON.stringify(result));
  if (!logs.some((e) => e === 'deposit_claim_rpc_asaas_fallback')) throw new Error('missing fallback log');
});

await runAsync('idempotent when ledger already exists', async () => {
  const paymentId = 'pay_p14f_idem';
  const { supabase, state } = buildMockSupabase({
    paymentId,
    pixId: 'pix-idem',
    userId: 'user-idem',
    saldoStart: 200,
    ledgerRows: [{ id: 'led-1', correlation_id: paymentId, tipo: 'deposito', valor: 5 }],
    pixStatus: 'approved'
  });
  const result = await claimApprovedPixDepositJsFallback(
    { supabase, createLedgerEntry: mockCreateLedgerEntry, log: () => {} },
    paymentId
  );
  if (!result.ok || result.credited) throw new Error(JSON.stringify(result));
  if (state.saldo !== 200) throw new Error('saldo changed on idempotent');
});

await runAsync('MP numeric RPC success — no fallback', async () => {
  const result = await claimApprovedPixDeposit(
    {
      supabase: {
        rpc: async () => ({ data: { ok: true, credited: true }, error: null }),
        from: () => {
          throw new Error('no fallback');
        }
      },
      createLedgerEntry: async () => {
        throw new Error('no fallback');
      },
      log: () => {}
    },
    '99988877766'
  );
  if (!result.ok) throw new Error('mp path failed');
});

if (process.exitCode) process.exit(process.exitCode);
console.log('P1.4F verify-asaas-deposit-claim-fallback: ALL OK');
