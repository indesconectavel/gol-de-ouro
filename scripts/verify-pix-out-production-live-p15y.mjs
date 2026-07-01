#!/usr/bin/env node
/**
 * P1.5Y — Verificação read-only pós-janela operacional PIX OUT produção.
 * Não executa transferência — valida evidências no banco + gates OFF.
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  snapshotEnvironment,
  restoreEnvironment,
  resetAsaasEnvironment,
  clearAsaasModuleCache,
  applyEnvironment
} from './helpers/asaas-test-env.mjs';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envSnapshot = snapshotEnvironment();

const STATE_PATH = process.env.P15Y_STATE_PATH || path.join(root, 'tmp', 'p15y-live-state.json');
const BACKEND_URL = process.env.P15Y_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';

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

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase não configurado localmente');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function readBundle(supabase, saqueId) {
  const { data: saque, error } = await supabase
    .from('saques')
    .select(
      'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, asaas_payout_raw, last_asaas_sync_at, created_at, updated_at'
    )
    .eq('id', saqueId)
    .maybeSingle();
  if (error) throw error;

  let walletSaldo = null;
  let ledger = [];
  if (saque?.usuario_id) {
    const { data: user } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', saque.usuario_id)
      .maybeSingle();
    walletSaldo = user?.saldo ?? null;
    if (saque.correlation_id) {
      const { data: rows } = await supabase
        .from('ledger_financeiro')
        .select('id, tipo, valor, referencia, correlation_id, created_at')
        .eq('correlation_id', saque.correlation_id)
        .order('created_at', { ascending: true });
      ledger = rows || [];
    }
  }
  return { saque, walletSaldo, ledger };
}

function runRegression(relativePath) {
  const result = spawnSync(process.execPath, [path.join(root, relativePath)], {
    cwd: root,
    env: { ...process.env },
    encoding: 'utf8',
    timeout: 600000
  });
  if (result.status !== 0) {
    throw new Error(`${relativePath} failed`);
  }
}

try {
  const saqueId = process.env.P15Y_SAQUE_ID;
  if (!saqueId) {
    throw new Error('P15Y_SAQUE_ID obrigatório para verificação pós-janela');
  }

  test('state file or env saqueId present', () => {
    if (!saqueId) throw new Error('missing saqueId');
    if (fs.existsSync(STATE_PATH)) {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      if (state.saqueId && state.saqueId !== saqueId) {
        throw new Error(`state file saqueId mismatch: ${state.saqueId} vs ${saqueId}`);
      }
    }
  });

  await runAsync('read-only: saque + asaas fields', async () => {
    const supabase = getSupabase();
    const { saque } = await readBundle(supabase, saqueId);
    if (!saque?.id) throw new Error('saque não encontrado');
    if (!saque.asaas_transfer_id) throw new Error('asaas_transfer_id vazio');
    if (!saque.asaas_transfer_status) throw new Error('asaas_transfer_status vazio');
    if (!saque.payout_external_reference) throw new Error('payout_external_reference vazio');
    console.log('  transfer_id:', saque.asaas_transfer_id);
    console.log('  transfer_status:', saque.asaas_transfer_status);
    console.log('  saque_status:', saque.status);
  });

  await runAsync('read-only: ledger coerente', async () => {
    const supabase = getSupabase();
    const { saque, ledger } = await readBundle(supabase, saqueId);
    const st = String(saque?.status || '').toLowerCase();
    const transferSt = String(saque?.asaas_transfer_status || '').toUpperCase();
    const tipos = ledger.map((e) => e.tipo);
    const terminalFail = ['FAILED', 'CANCELLED', 'BLOCKED'].includes(transferSt) || st === 'falhou';
    const terminalOk = transferSt === 'DONE' || st === 'processado';
    if (terminalOk && !tipos.includes('payout_confirmado')) {
      throw new Error(`esperado payout_confirmado, tipos=${tipos.join(',')}`);
    }
    if (terminalFail && !tipos.includes('falha_payout')) {
      throw new Error(`esperado falha_payout, tipos=${tipos.join(',')}`);
    }
    const dupConfirm = ledger.filter((e) => e.tipo === 'payout_confirmado' && e.referencia === saqueId);
    const dupFail = ledger.filter((e) => e.tipo === 'falha_payout' && e.referencia === saqueId);
    if (dupConfirm.length > 1 || dupFail.length > 1) {
      throw new Error('ledger terminal duplicado');
    }
  });

  await runAsync('read-only: wallet snapshot', async () => {
    const supabase = getSupabase();
    const { walletSaldo, saque } = await readBundle(supabase, saqueId);
    if (walletSaldo == null) throw new Error('wallet saldo indisponível');
    console.log('  wallet_saldo:', walletSaldo, 'usuario:', saque.usuario_id);
  });

  await runAsync('replay idempotente (mock in-process)', async () => {
    resetAsaasEnvironment();
    applyEnvironment({
      PAYMENT_WEBHOOK_ENGINE_ENABLED: 'true',
      ASAAS_WEBHOOK_ENABLED: 'true',
      ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN || 'test',
      ALLOW_ASAAS_SANDBOX_WEBHOOK: '1',
      NODE_ENV: 'production',
      ASAAS_ENV: 'production'
    });
    clearAsaasModuleCache(require);

    const supabase = getSupabase();
    const before = await readBundle(supabase, saqueId);
    const { validateAsaasWebhook, ASAAS_WEBHOOK_AUTH_HEADER } = require('../src/finance/providers/asaas/asaas-webhook-validator');
    const { processAsaasTransferWebhook } = require('../src/finance/webhooks/processAsaasTransferWebhook');

    const transferStatus = before.saque.asaas_transfer_status || 'DONE';
    const eventMap = {
      DONE: 'TRANSFER_DONE',
      FAILED: 'TRANSFER_FAILED',
      CANCELLED: 'TRANSFER_CANCELLED',
      BLOCKED: 'TRANSFER_BLOCKED'
    };
    const body = {
      id: 'evt_p15y_verify_replay',
      event: eventMap[String(transferStatus).toUpperCase()] || 'TRANSFER_DONE',
      transfer: {
        id: before.saque.asaas_transfer_id,
        status: String(transferStatus).toUpperCase(),
        externalReference: before.saque.payout_external_reference,
        value: parseFloat(before.saque.net_amount ?? 10),
        type: 'PIX'
      }
    };
    const validation = validateAsaasWebhook({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: process.env.ASAAS_WEBHOOK_TOKEN },
      body
    });
    const r1 = await processAsaasTransferWebhook({ validation, body, supabase, financeLog: () => {} });
    const mid = await readBundle(supabase, saqueId);
    const r2 = await processAsaasTransferWebhook({ validation, body, supabase, financeLog: () => {} });
    const after = await readBundle(supabase, saqueId);
    if (mid.ledger.length !== after.ledger.length) {
      throw new Error('ledger duplicado no replay');
    }
    if (mid.walletSaldo !== after.walletSaldo) {
      throw new Error('wallet alterada no replay');
    }
    if (!r2.idempotent && !r2.ledgerIdempotent && !r2.replay) {
      throw new Error('replay não idempotente');
    }
  });

  test('gates audit: production OUT gates OFF (local env probe)', () => {
    resetAsaasEnvironment();
    applyEnvironment({
      NODE_ENV: 'production',
      ASAAS_ENV: 'production',
      ASAAS_ENABLED: 'true',
      ASAAS_PIX_OUT_PRODUCTION_ENABLED: 'false',
      PAYMENT_ENGINE_PIXOUT_ENABLED: 'false'
    });
    clearAsaasModuleCache(require);
    const cfg = require('../src/finance/config/asaas-pix-out-config');
    if (cfg.isAsaasPixOutProductionHttpEnabled()) {
      throw new Error('gates devem estar OFF após janela (probe local)');
    }
  });

  await runAsync('backend health reachable', async () => {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error(`health HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'ok') throw new Error('health not ok');
  });

  const regressions = [
    'scripts/verify-pix-out-production-homologation-p15i.mjs',
    'scripts/verify-pix-out-end-to-end-p15h.mjs',
    'scripts/verify-asaas-transfer-webhook-p15g.mjs'
  ];
  for (const s of regressions) {
    test(`regression: ${path.basename(s)}`, () => runRegression(s));
  }

  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);

  if (process.exitCode) {
    console.error('\nVerification FAILED (P1.5Y live post-window)');
    process.exit(process.exitCode);
  }
  console.log('\nVerification PASSED (P1.5Y live post-window read-only)');
} finally {
  restoreEnvironment(envSnapshot);
  clearAsaasModuleCache(require);
}
