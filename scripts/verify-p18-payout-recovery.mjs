#!/usr/bin/env node
/**
 * P1.8 — Verificação recovery PIX OUT Asaas (mock Supabase + GET transfer simulado).
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envSnapshot = snapshotEnvironment();

const SAQUE_ID = '33333333-3333-4333-8333-333333333333';
const TRANSFER_ID = 'trf_p18_recovery_001';
const EXTERNAL_REF = 'wd_p18_recovery_ref';

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

function createMockSupabase(initialRow) {
  let row = {
    amount: 10,
    fee: 2,
    net_amount: 8,
    ...initialRow
  };
  const ledger = [];
  let walletSaldo = 100;
  const pendingList = [{ ...row }];

  function buildFilterChain(handlers) {
    const state = { filters: [], limit: null };
    const chain = {
      eq(col, val) {
        state.filters.push({ op: 'eq', col, val });
        return chain;
      },
      not(col, op, val) {
        state.filters.push({ op: 'not', col, op, val });
        return chain;
      },
      order() {
        return chain;
      },
      lt(col, val) {
        state.filters.push({ op: 'lt', col, val });
        return chain;
      },
      limit(n) {
        state.limit = n;
        return chain;
      },
      in(col, vals) {
        state.filters.push({ op: 'in', col, val: vals });
        return chain;
      },
      async maybeSingle() {
        return handlers.maybeSingle(state);
      },
      async single() {
        const r = await handlers.maybeSingle(state);
        if (r.error) return r;
        if (!r.data) return { data: null, error: { message: 'not found' } };
        return { data: r.data, error: null };
      },
      then(resolve, reject) {
        Promise.resolve(handlers.list(state))
          .then(resolve, reject);
      }
    };
    return chain;
  }

  const api = {
    from(table) {
      if (table === 'saques') {
        return {
          select() {
            return buildFilterChain({
              maybeSingle(state) {
                const idFilter = state.filters.find((f) => f.op === 'eq' && f.col === 'id');
                const transferFilter = state.filters.find((f) => f.op === 'eq' && f.col === 'asaas_transfer_id');
                const refFilter = state.filters.find((f) => f.op === 'eq' && f.col === 'payout_external_reference');
                if (idFilter && row.id === idFilter.val) {
                  return { data: { ...row, status: row.status }, error: null };
                }
                if (transferFilter && row.asaas_transfer_id === transferFilter.val) {
                  return { data: { ...row }, error: null };
                }
                if (refFilter && row.payout_external_reference === refFilter.val) {
                  return { data: { ...row }, error: null };
                }
                return { data: null, error: null };
              },
              list(state) {
                let rows = pendingList.filter((r) => {
                  for (const f of state.filters) {
                    if (f.op === 'eq' && f.col === 'status' && r.status !== f.val) return false;
                    if (f.op === 'not' && f.col === 'asaas_transfer_id' && !r.asaas_transfer_id) return false;
                    if (f.op === 'lt' && f.col === 'updated_at' && !(r.updated_at < f.val)) return false;
                  }
                  return true;
                });
                if (state.limit != null) rows = rows.slice(0, state.limit);
                return { data: rows.map((r) => ({ ...r })), error: null };
              }
            });
          },
          update(patch) {
            return {
              eq(column, value) {
                const apply = () => {
                  if (column === 'id' && row.id === value) {
                    row = { ...row, ...patch };
                    const idx = pendingList.findIndex((r) => r.id === value);
                    if (idx >= 0) pendingList[idx] = row;
                    return { error: null };
                  }
                  return { error: { message: 'not found' } };
                };
                const eqResult = {
                  select() {
                    return {
                      async single() {
                        const r = apply();
                        return { data: r.error ? null : { id: row.id, status: row.status }, error: r.error };
                      }
                    };
                  },
                  then(resolve, reject) {
                    try {
                      resolve(apply());
                    } catch (err) {
                      reject(err);
                    }
                  }
                };
                return eqResult;
              }
            };
          }
        };
      }
      if (table === 'ledger_financeiro') {
        return {
          select() {
            return buildFilterChain({
              maybeSingle(state) {
                const hit = ledger.find((e) => state.filters.every((f) => {
                  if (f.op === 'eq') return e[f.col] === f.val;
                  if (f.op === 'in') return f.val.includes(e[f.col]);
                  return true;
                }));
                return { data: hit ? { id: hit.id, tipo: hit.tipo, referencia: hit.referencia } : null, error: null };
              },
              list(state) {
                const rows = ledger.filter((e) => state.filters.every((f) => {
                  if (f.op === 'eq') return e[f.col] === f.val;
                  if (f.op === 'in') return f.val.includes(e[f.col]);
                  return true;
                }));
                return { data: rows, error: null };
              }
            });
          },
          insert(entry) {
            const rowEntry = { id: `ledger_${ledger.length + 1}`, ...entry };
            ledger.push(rowEntry);
            return {
              select() {
                return { async single() { return { data: rowEntry, error: null }; } };
              }
            };
          }
        };
      }
      if (table === 'usuarios') {
        return {
          select() {
            return {
              eq(col, val) {
                return {
                  async single() {
                    if (col === 'id' && val === row.usuario_id) {
                      return { data: { id: row.usuario_id, saldo: walletSaldo }, error: null };
                    }
                    return { data: null, error: { message: 'not found' } };
                  }
                };
              }
            };
          },
          update(patch) {
            walletSaldo = patch.saldo ?? walletSaldo;
            return { eq: () => ({ then: (r) => r({ error: null }) }) };
          }
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    getRow() {
      return { ...row };
    },
    getLedger() {
      return [...ledger];
    }
  };
  return api;
}

try {
  resetAsaasEnvironment();
  applyEnvironment({
    ASAAS_ENABLED: 'true',
    ASAAS_ENV: 'production',
    ASAAS_API_KEY: 'test_key_p18',
    ASAAS_PAYOUT_RECOVERY_ENABLED: 'true',
    NODE_ENV: 'production'
  });
  clearAsaasModuleCache(require);

  const {
    reconcileSingleAsaasPayout,
    reconcileAsaasPendingPayouts,
    buildRecoveryWebhookPayload
  } = require('../src/finance/reconciliation/asaasPayoutRecovery');
  const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');

  const baseSaque = {
    id: SAQUE_ID,
    usuario_id: '44444444-4444-4444-8444-444444444444',
    status: 'aguardando_confirmacao',
    correlation_id: 'corr-p18-001',
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: TRANSFER_ID,
    asaas_transfer_status: 'PENDING',
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  };

  await runAsync('buildRecoveryWebhookPayload maps DONE → TRANSFER_DONE', async () => {
    const { body, validation } = buildRecoveryWebhookPayload({
      id: TRANSFER_ID,
      status: 'DONE',
      externalReference: EXTERNAL_REF,
      value: 8
    });
    if (body.event !== 'TRANSFER_DONE' || validation.eventType !== 'TRANSFER_DONE') {
      throw new Error('expected TRANSFER_DONE event');
    }
  });

  await runAsync('recovery reconciles DONE → processado + payout_confirmado', async () => {
    const supabase = createMockSupabase(baseSaque);
    const getTransferFn = async () => ({
      success: true,
      data: {
        id: TRANSFER_ID,
        status: 'DONE',
        externalReference: EXTERNAL_REF,
        value: 8,
        netValue: 8
      }
    });
    const result = await reconcileSingleAsaasPayout({
      supabase,
      saqueRow: baseSaque,
      getTransferFn,
      processWebhookFn: processAsaasTransferWebhook,
      financeLog: () => {}
    });
    if (!result.success || result.terminalSuccess !== true) {
      throw new Error(`expected terminal success, got ${JSON.stringify(result)}`);
    }
    const row = supabase.getRow();
    if (row.status !== 'processado' || row.asaas_transfer_status !== 'DONE') {
      throw new Error(`unexpected row ${JSON.stringify(row)}`);
    }
    if (!supabase.getLedger().some((e) => e.tipo === 'payout_confirmado')) {
      throw new Error('missing payout_confirmado');
    }
  });

  await runAsync('recovery idempotent on second DONE run', async () => {
    const supabase = createMockSupabase({
      ...baseSaque,
      status: 'processado',
      asaas_transfer_status: 'DONE'
    });
    const getTransferFn = async () => ({
      success: true,
      data: { id: TRANSFER_ID, status: 'DONE', externalReference: EXTERNAL_REF }
    });
    const result = await reconcileSingleAsaasPayout({
      supabase,
      saqueRow: supabase.getRow(),
      getTransferFn,
      processWebhookFn: processAsaasTransferWebhook,
      financeLog: () => {}
    });
    if (!result.skipped && result.reason !== 'SAQUE_NOT_PENDING') {
      throw new Error(`expected skip for terminal saque, got ${JSON.stringify(result)}`);
    }
  });

  await runAsync('recovery skips PENDING provider status', async () => {
    const supabase = createMockSupabase(baseSaque);
    const getTransferFn = async () => ({
      success: true,
      data: { id: TRANSFER_ID, status: 'PENDING', externalReference: EXTERNAL_REF }
    });
    const result = await reconcileSingleAsaasPayout({
      supabase,
      saqueRow: baseSaque,
      getTransferFn,
      processWebhookFn: processAsaasTransferWebhook,
      financeLog: () => {}
    });
    if (!result.skipped || result.reason !== 'PROVIDER_PENDING') {
      throw new Error(`expected PROVIDER_PENDING skip, got ${JSON.stringify(result)}`);
    }
    if (supabase.getRow().status !== 'aguardando_confirmacao') {
      throw new Error('saque should remain unchanged for PENDING');
    }
  });

  await runAsync('recovery FAILED triggers falha_payout path', async () => {
    const supabase = createMockSupabase(baseSaque);
    const getTransferFn = async () => ({
      success: true,
      data: {
        id: TRANSFER_ID,
        status: 'FAILED',
        externalReference: EXTERNAL_REF,
        failReason: 'mock_fail'
      }
    });
    const result = await reconcileSingleAsaasPayout({
      supabase,
      saqueRow: baseSaque,
      getTransferFn,
      processWebhookFn: processAsaasTransferWebhook,
      financeLog: () => {}
    });
    if (!result.success || result.terminalFail !== true) {
      throw new Error(`expected terminal fail, got ${JSON.stringify(result)}`);
    }
    const row = supabase.getRow();
    if (row.status !== 'falhou') {
      throw new Error(`expected falhou, got ${row.status}`);
    }
    if (!supabase.getLedger().some((e) => e.tipo === 'falha_payout')) {
      throw new Error('missing falha_payout ledger');
    }
  });

  await runAsync('batch recovery cycle processes pending list', async () => {
    const supabase = createMockSupabase(baseSaque);
    let calls = 0;
    const getTransferFn = async () => {
      calls++;
      return {
        success: true,
        data: { id: TRANSFER_ID, status: 'DONE', externalReference: EXTERNAL_REF, value: 8 }
      };
    };
    const batch = await reconcileAsaasPendingPayouts({
      supabase,
      getTransferFn,
      processWebhookFn: processAsaasTransferWebhook,
      financeLog: () => {},
      minAgeMin: 0,
      limit: 5
    });
    if (batch.processed < 1 || batch.reconciled < 1) {
      throw new Error(`expected batch reconcile, got ${JSON.stringify(batch)}`);
    }
    if (calls < 1) {
      throw new Error('getTransfer should have been called');
    }
  });

  console.log('\nP1.8 payout recovery verification complete.');
} finally {
  restoreEnvironment(envSnapshot);
}
