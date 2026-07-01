#!/usr/bin/env node
/**
 * P1.6A — Dry-run do webhook de autorização de transferência Asaas.
 * Sem PIX OUT real. Sem produção. Mock Supabase apenas.
 */
import { createRequire } from 'node:module';
import { snapshotEnvironment, restoreEnvironment, clearAsaasModuleCache } from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);
const envSnapshot = snapshotEnvironment();

const SAQUE_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = 'user-p16a-001';
const TRANSFER_ID = 'trf_p16a_auth_001';
const EXTERNAL_REF = 'goldeouro-p16a-ref-001';
const AUTH_TOKEN = 'whsec_p16a_transfer_auth_webhook';

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

function createMockSupabase(initialRow, walletSaldo = 50) {
  let row = {
    amount: 10,
    fee: 1,
    net_amount: 9,
    usuario_id: USER_ID,
    correlation_id: 'corr-p16a-001',
    payout_external_reference: EXTERNAL_REF,
    asaas_transfer_id: TRANSFER_ID,
    asaas_transfer_status: 'PENDING',
    asaas_payout_raw: { id: TRANSFER_ID, status: 'PENDING' },
    ...initialRow
  };
  let saldo = walletSaldo;
  const ledger = [];

  return {
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
        if (table === 'usuarios') {
          return {
            select() {
              return {
                eq(column, value) {
                  return {
                    async maybeSingle() {
                      if (column === 'id' && value === row.usuario_id) {
                        return { data: { saldo }, error: null };
                      }
                      return { data: null, error: null };
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
  delete process.env.ASAAS_TRANSFER_AUTH_ENABLED;
  delete process.env.ASAAS_TRANSFER_AUTH_TOKEN;
  clearAsaasModuleCache(require);
}

async function main() {
  setupEnv();

  const {
    handleAsaasTransferAuthorization,
    clearAuthDecisionCache
  } = require('../src/finance/webhooks/asaasTransferAuthorization');
  const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');

  const headers = { [ASAAS_WEBHOOK_AUTH_HEADER]: AUTH_TOKEN };
  const mock = createMockSupabase({ id: SAQUE_ID, status: 'aguardando_confirmacao' });

  await runAsync('1. autorização válida', async () => {
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

  await runAsync('2. token inválido', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'invalid' },
      body: buildAuthBody(),
      supabase: mock.api
    });
    if (result.authorized) throw new Error('deveria recusar');
  });

  await runAsync('3. saque inexistente', async () => {
    clearAuthDecisionCache();
    const empty = createMockSupabase({
      id: SAQUE_ID,
      status: 'aguardando_confirmacao',
      asaas_transfer_id: 'other',
      payout_external_reference: 'other-ref'
    });
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody({ id: 'unknown-transfer', externalReference: 'unknown-ref' }),
      supabase: empty.api
    });
    if (result.authorized) throw new Error('deveria recusar');
  });

  await runAsync('4. valor divergente', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody({ value: 999, netValue: 999 }),
      supabase: mock.api
    });
    if (result.authorized) throw new Error('deveria recusar');
  });

  await runAsync('5. status não elegível', async () => {
    clearAuthDecisionCache();
    const terminal = createMockSupabase({ id: SAQUE_ID, status: 'pago' });
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: terminal.api
    });
    if (result.authorized) throw new Error('deveria recusar');
  });

  await runAsync('6. replay idempotente', async () => {
    clearAuthDecisionCache();
    const replayMock = createMockSupabase({ id: SAQUE_ID, status: 'aguardando_confirmacao' });
    const first = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: replayMock.api
    });
    if (!first.authorized) throw new Error('primeira chamada deveria aprovar');
    const second = await handleAsaasTransferAuthorization({
      headers,
      body: buildAuthBody(),
      supabase: replayMock.api
    });
    if (!second.authorized || !second.idempotent) throw new Error('replay deveria aprovar idempotentemente');
  });

  await runAsync('7. payload incompleto', async () => {
    clearAuthDecisionCache();
    const result = await handleAsaasTransferAuthorization({
      headers,
      body: { type: 'TRANSFER' },
      supabase: mock.api
    });
    if (result.authorized) throw new Error('deveria recusar payload incompleto');
  });

  await runAsync('gate default OFF → 404', async () => {
    process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED = 'false';
    clearAsaasModuleCache(require);
    const { handleAsaasTransferAuthorization: off } = require('../src/finance/webhooks/asaasTransferAuthorization');
    const result = await off({ headers, body: buildAuthBody(), supabase: mock.api });
    if (result.httpStatus !== 404) throw new Error('gate deveria retornar 404');
    setupEnv();
  });

  test('token ausente em runtime → recusa segura', () => {
    clearAuthDecisionCache();
    delete process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN;
    clearAsaasModuleCache(require);
    const { validateAuthToken } = require('../src/finance/webhooks/asaasTransferAuthorization');
    const check = validateAuthToken({ 'asaas-access-token': 'any' });
    if (check.valid) throw new Error('deveria falhar sem token configurado');
    setupEnv();
  });

  console.log('\n--- P1.6A transfer auth webhook dry-run ---');
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
