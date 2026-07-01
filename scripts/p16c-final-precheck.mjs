#!/usr/bin/env node
/**
 * P1.6C.FINAL-PRECHECK / P1.6ZA — read-only. Grava tmp/p16c-final-precheck.json
 * P1.6W: webhook ingress validado (200/401); nunca 403 asaas_webhook_blocked.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
dotenv.config();

const BACKEND = process.env.P16C_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const SAQUE_ID = process.env.P16C_SAQUE_ID || 'd0313dfe-b08a-4334-a3ca-d9e7011af38a';
const OUT = path.join(process.cwd(), 'tmp', 'p16c-final-precheck.json');

/**
 * P1.6W — ingresso HTTP do webhook financeiro desacoplado dos gates PIX OUT.
 * Aceita 200 (processado/ignored) ou 401 (payload/token inválido).
 * Rejeita 403 (gate legado), 404 e 500.
 * @param {number} status
 * @param {object} [body]
 */
function isWebhookIngressHealthy(status, body = {}) {
  if (status === 403) {
    if (body?.error === 'asaas_webhook_blocked') return false;
    return false;
  }
  if (status === 404 || status >= 500) return false;
  if (status === 200 || status === 401) return true;
  return false;
}

function readAuthToken() {
  const fromEnv = process.env.ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN;
  if (fromEnv) return fromEnv;
  const tokenPath = path.join(process.cwd(), 'tmp', 'p16b-r2-auth-token.txt');
  if (fs.existsSync(tokenPath)) {
    const line = fs.readFileSync(tokenPath, 'utf8').split(/\r?\n/).find((l) => l.startsWith('whsec_'));
    if (line) return line.trim();
  }
  return null;
}

async function probe(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(25000), ...opts });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body };
}

async function main() {
  const architectureBlockers = [];
  const operationalBlockers = [];
  const checks = {};
  const authToken = readAuthToken();

  // 1. transfer-validation — em repouso gate OFF → 404 disabled é esperado (P1.6W janela habilita via openGates)
  const authNoToken = await probe(`${BACKEND}/webhooks/asaas/transfer-validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'TRANSFER',
      transfer: { id: 'p16c_final_precheck_probe', status: 'PENDING', value: 1 }
    })
  });

  checks.auth_webhook_at_rest =
    authNoToken.status === 404 &&
    authNoToken.body?.error === 'asaas_transfer_auth_webhook_disabled';

  checks.auth_route_active =
    authNoToken.body?.status === 'REFUSED' ||
    authNoToken.body?.status === 'APPROVED';

  checks.auth_webhook_ingress_ok = checks.auth_webhook_at_rest || checks.auth_route_active;

  if (authNoToken.status === 404 && !checks.auth_webhook_at_rest) {
    architectureBlockers.push('AUTH_ROUTE_404');
  }
  if (!checks.auth_webhook_ingress_ok) {
    architectureBlockers.push('AUTH_WEBHOOK_INGRESS_FAIL');
  }

  // 1b. com token (somente se gate ON ou token local disponível para diagnóstico)
  let authWithToken = null;
  if (authToken && !checks.auth_webhook_at_rest) {
    authWithToken = await probe(`${BACKEND}/webhooks/asaas/transfer-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': authToken
      },
      body: JSON.stringify({
        type: 'TRANSFER',
        transfer: { id: 'p16c_final_precheck_probe', status: 'PENDING', value: 1 }
      })
    });
    checks.auth_accepts_token =
      authWithToken.status === 200 &&
      (authWithToken.body?.status === 'REFUSED' || authWithToken.body?.status === 'APPROVED') &&
      authWithToken.body?.error !== 'AUTH_TOKEN_MISMATCH';
    if (!checks.auth_accepts_token) architectureBlockers.push('AUTH_TOKEN_REJECTED');
  } else if (authToken && checks.auth_webhook_at_rest) {
    checks.auth_accepts_token = 'skipped_gate_off_at_rest';
  } else {
    checks.auth_accepts_token = null;
    checks.auth_token_local_note = 'token local opcional — Fly secret deployado é suficiente em repouso';
  }

  // 2. /webhooks/asaas — P1.6W webhook ingress validated (200/401 esperado, nunca 403 por gate)
  const asaasWebhook = await probe(`${BACKEND}/webhooks/asaas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'PAYMENT_RECEIVED', payment: { id: 'precheck' } })
  });

  checks.asaas_webhook_ingress_validated = isWebhookIngressHealthy(
    asaasWebhook.status,
    asaasWebhook.body
  );
  checks.asaas_webhook_not_gate_blocked =
    asaasWebhook.status !== 403 || asaasWebhook.body?.error !== 'asaas_webhook_blocked';

  if (!checks.asaas_webhook_ingress_validated) {
    architectureBlockers.push('ASAAS_WEBHOOK_INGRESS_UNHEALTHY');
  }
  if (!checks.asaas_webhook_not_gate_blocked) {
    architectureBlockers.push('ASAAS_WEBHOOK_STILL_GATE_BLOCKED');
  }

  // 3–4. saque via Supabase REST (operacional — não bloqueia arquitetura P1.6W)
  const sbUrl = (process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const sbKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  let saque = null;
  if (sbUrl && sbKey) {
    const res = await fetch(
      `${sbUrl}/rest/v1/saques?id=eq.${SAQUE_ID}&select=id,status,amount,net_amount,fee,asaas_transfer_id,correlation_id,usuario_id,pix_key,chave_pix`,
      {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        signal: AbortSignal.timeout(20000)
      }
    );
    const rows = await res.json();
    saque = rows[0] || null;
  }

  const st = String(saque?.status || '').toLowerCase();
  checks.saque_pending = ['pendente', 'pending'].includes(st);
  checks.saque_net_amount_8 = parseFloat(saque?.net_amount) === 8;
  checks.saque_no_transfer = !saque?.asaas_transfer_id;
  checks.saque_pix_key =
    saque?.pix_key || saque?.chave_pix || null;

  if (!saque) operationalBlockers.push('SAQUE_NOT_FOUND');
  if (!checks.saque_pending) operationalBlockers.push(`SAQUE_STATUS_${st || 'missing'}`);
  if (!checks.saque_net_amount_8) operationalBlockers.push('SAQUE_NET_NOT_8');
  if (!checks.saque_no_transfer) operationalBlockers.push('SAQUE_ALREADY_HAS_TRANSFER');

  const expectedPixKey = process.env.P16C_PIX_KEY || 'indesconectavel@gmail.com';
  checks.saque_pix_key_expected = expectedPixKey;
  if (saque && checks.saque_pix_key && checks.saque_pix_key !== expectedPixKey) {
    operationalBlockers.push('SAQUE_PIX_KEY_MISMATCH');
  }

  // 5–7. fly secrets digests (no values)
  const { spawnSync } = require('node:child_process');
  const flyList = spawnSync('fly', ['secrets', 'list', '-a', 'goldeouro-backend-v2'], {
    encoding: 'utf8',
    timeout: 120000
  });
  const flyOut = `${flyList.stdout || ''}${flyList.stderr || ''}`;
  const hasAuthSecret = /ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED\s*│\s*\S+\s*│\s*Deployed/i.test(
    flyOut
  );
  const hasAuthToken = /ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN\s*│\s*\S+\s*│\s*Deployed/i.test(flyOut);
  const payoutProviderUnset = !/PAYOUT_PROVIDER\s*│/.test(flyOut);

  checks.fly_auth_secret_deployed = hasAuthSecret;
  checks.fly_auth_token_deployed = hasAuthToken;
  checks.fly_payout_provider_unset = payoutProviderUnset;

  if (!hasAuthSecret) architectureBlockers.push('FLY_AUTH_SECRET_NOT_DEPLOYED');
  if (!hasAuthToken) architectureBlockers.push('FLY_AUTH_TOKEN_NOT_DEPLOYED');
  if (!payoutProviderUnset) architectureBlockers.push('PAYOUT_PROVIDER_ALREADY_SET');

  const health = await probe(`${BACKEND}/health`);
  checks.health_ok = health.status === 200 && health.body?.database === 'connected';
  if (!checks.health_ok) architectureBlockers.push('HEALTH_FAIL');

  const architectureReady = architectureBlockers.length === 0;
  const verdict =
    architectureReady && operationalBlockers.length === 0
      ? 'READY_TO_EXECUTE'
      : architectureReady
        ? 'ARCHITECTURE_READY'
        : 'BLOCKED';

  const out = {
    at: new Date().toISOString(),
    backend: BACKEND,
    saqueId: SAQUE_ID,
    p16wArchitecture: true,
    checks,
    probes: {
      authNoToken: { status: authNoToken.status, body: authNoToken.body },
      authWithToken: authWithToken
        ? { status: authWithToken.status, body: authWithToken.body, tokenUsed: true, tokenPrinted: false }
        : null,
      asaasWebhook: { status: asaasWebhook.status, body: asaasWebhook.body },
      health: { status: health.status, body: health.body }
    },
    saque,
    flySecrets: {
      authSecretDeployed: hasAuthSecret,
      authTokenDeployed: hasAuthToken,
      payoutProviderUnset,
      note: 'valores de secrets nunca incluídos; auth webhook OFF em repouso é esperado'
    },
    architectureBlockers,
    operationalBlockers,
    blockers: [...architectureBlockers, ...operationalBlockers],
    verdict,
    architectureReady
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(
    `###P16C_FINAL_PRECHECK###${JSON.stringify({
      verdict,
      architectureReady,
      architectureBlockers,
      operationalBlockers,
      checks: {
        asaas_webhook_ingress_validated: checks.asaas_webhook_ingress_validated,
        auth_webhook_ingress_ok: checks.auth_webhook_ingress_ok
      }
    })}`
  );
  process.exit(architectureReady ? 0 : 2);
}

main().catch((e) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ error: e.message, verdict: 'BLOCKED' }));
  console.error(e);
  process.exit(1);
});
