#!/usr/bin/env node
/**
 * P1.6 — Verificação webhook de autorização de transferência Asaas (mock Supabase).
 */
import { createRequire } from 'node:module';
import {
  snapshotEnvironment,
  restoreEnvironment,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const envSnapshot = snapshotEnvironment();

const SAQUE_ID = '22222222-2222-4222-8222-222222222222';
const TRANSFER_ID = 'trf_p16_auth_001';
const EXTERNAL_REF = 'goldeouro-p16-auth-ref-001';
const AUTH_TOKEN = 'whsec_p16_transfer_auth_test';

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

function buildAuthBody(overrides = {}) {
  return {
    type: 'TRANSFER',
    transfer: {
      object: 'transfer',
      id: TRANSFER_ID,
      status: 'PENDING',
      value: 9,
      netValue: 9,
      operationType: 'PIX',
      externalReference: EXTERNAL_REF,
      ...overrides
    }
  };
}

function createMockSupabase(initialRow) {
  let row = {
    amount: 10,
    fee: 1,
    net_amount: 9,
    usuario_id: 'user-p16',
    correlation_id: 'corr-p16-001',
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: TRANSFER_ID,
    asaas_transfer_status: 'PENDING',
    asaas_payout_raw: { id: TRANSFER_ID, status: 'PENDING' },
    ...initialRow
  };

  const ledger = [];

  return {
    ledger,
    getRow: () => ({ ...row }),
    api: {
      from(table) {
        if (table === 'saques') {
          return {
            select() {
              return {
                eq(column, value) {
                  return {
                    async maybeSingle() {
                      if (column === 'asaas_transfer_id' && row.asaas_transfer_id === value) {
                        return { data: { ...row }, error: null };
                      }
                      if (column === 'payout_external_reference' && row.payout_external_reference === value) {
                        return { data: { ...row }, error: null };
                      }
                      return { data: null, error: null };
                    }
                  };
                }
              };
            },
            update(patch) {
              return {
                eq(column, value) {
                  if (column === 'id' && row.id === value) {
                    row = { ...row, ...patch };
                  }
                  return Promise.resolve({ error: null });
                }
              };
            }
          };
        }
        if (table === 'ledger_financeiro') {
          return {
            select() {
              return {
                eq() {
                  return {
                    in() {
                      return Promise.resolve({ data: ledger, error: null });
                    }
                  };
                }
              };
            }
          };
        }
        return {};
      }
    }
  };
}

function setupEnv() {
  process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED = 'true';
  process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN = AUTH_TOKEN;
  process.env.ASAAS_TRANSFER_AUTH_STRICT_MODE = 'true';
  process.env.ASAAS_TRANSFER_AUTH_IP_CHECK = 'false';
  clearAsaasModuleCache(require);
}

async function main() {
  setupEnv();

  const {
    handleAsaasTransferAuthorization,
    validateAuthPayload,
    evaluateSaqueForAuth,
    clearAuthDecisionCache
  } = require('../src/finance/webhooks/asaasTransferAuthorization');
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

  const headers = { [ASAAS_WEBHOOK_AUTH_HEADER]: AUTH_TOKEN };

  test('validateAuthPayload aceita type TRANSFER', () => {
    const r = validateAuthPayload(buildAuthBody());
    if (!r.valid || r.transferId !== TRANSFER_ID) throw new Error('payload inválido');
  });

  test('validateAuthPayload rejeita type PAYMENT', () => {
    const r = validateAuthPayload({ type: 'PAYMENT', transfer: { id: 'x' } });
    if (r.valid) throw new Error('deveria rejeitar');
  });

  const mock = createMockSupabase({
    id: SAQUE_ID,
    status: 'aguardando_confirmacao'
  });

  await runAsync('aprova transferência válida', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: mock.api
    });
    if (!result.authorized || result.body.status !== 'APPROVED') {
      throw new Error(JSON.stringify(result));
    }
  });

  await runAsync('idempotência replay → APPROVED', async () => {
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: mock.api
    });
    if (!result.authorized || !result.idempotent) {
      throw new Error('replay deveria ser idempotente');
    }
  });

  await runAsync('token inválido → REFUSED', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'wrong-token' },
      body: buildAuthBody(),
      supabase: mock.api
    });
    if (result.authorized || result.body.status !== 'REFUSED') {
      throw new Error('deveria recusar token inválido');
    }
  });

  await runAsync('saque não encontrado → REFUSED', async () => {
    clearAuthDecisionCache();
    const emptyMock = createMockSupabase({
      id: SAQUE_ID,
      status: 'aguardando_confirmacao',
      asaas_transfer_id: 'other-id'
    });
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody({ id: 'unknown-transfer' }),
      supabase: emptyMock.api
    });
    if (result.authorized) throw new Error('deveria recusar');
  });

  await runAsync('valor divergente → REFUSED', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody({ value: 99, netValue: 99 }),
      supabase: mock.api
    });
    if (result.authorized) throw new Error('deveria recusar valor');
  });

  await runAsync('saque terminal → REFUSED', async () => {
    clearAuthDecisionCache();
    const terminalMock = createMockSupabase({
      id: SAQUE_ID,
      status: 'processado'
    });
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: terminalMock.api
    });
    if (result.authorized) throw new Error('deveria recusar terminal');
  });

  test('evaluateSaqueForAuth regras de negócio', () => {
    const saque = mock.getRow();
    const payload = validateAuthPayload(buildAuthBody());
    const ev = evaluateSaqueForAuth(saque, payload);
    if (!ev.approved) throw new Error(ev.reason);
  });

  await runAsync('endpoint disabled → 404', async () => {
    process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED = 'false';
    clearAsaasModuleCache(require);
    const { handleAsaasTransferAuthorization: disabledHandler } = require('../src/finance/webhooks/asaasTransferAuthorization');
    const result = await disabledHandler({ headers, body: buildAuthBody(), supabase: mock.api });
    if (result.httpStatus !== 404) throw new Error('deveria retornar 404');
    setupEnv();
  });

  console.log('\n--- P1.6 transfer authorization verify ---');
  console.log(process.exitCode === 1 ? 'FAIL' : 'PASS');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    restoreEnvironment(envSnapshot);
  });
