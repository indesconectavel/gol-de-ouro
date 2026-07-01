#!/usr/bin/env node
/**
 * P1.6B — Preflight read-only homologação webhook autorização Asaas.
 * Não executa PIX OUT. Não altera gates Fly.
 */
const BACKEND_URL = process.env.P16B_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';

const GATE_FLAGS = [
  'ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED',
  'ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN',
  'ASAAS_PRODUCTION_ENABLED',
  'ASAAS_PIX_OUT_PRODUCTION_ENABLED',
  'PAYMENT_ENGINE_PIXOUT_ENABLED',
  'PAYOUT_PIX_ENABLED',
  'ENABLE_PIX_PAYOUT_WORKER',
  'PAYOUT_PROVIDER',
  'ASAAS_PRODUCTION_ENABLED',
  'ASAAS_WEBHOOK_ENABLED',
  'PAYMENT_WEBHOOK_ENGINE_ENABLED'
];

function emit(tag, obj) {
  console.log(`###${tag}###${JSON.stringify(obj)}`);
}

async function probeAuthEndpoint() {
  const res = await fetch(`${BACKEND_URL}/webhooks/asaas/transfer-validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'TRANSFER',
      transfer: { id: 'p16b_preflight_probe', status: 'PENDING', value: 1 }
    })
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body };
}

async function main() {
  const at = new Date().toISOString();
  let health = null;
  let workers = null;
  let authProbe = null;
  let errors = [];

  try {
    const hres = await fetch(`${BACKEND_URL}/health`);
    health = { status: hres.status, body: await hres.json() };
  } catch (e) {
    errors.push(`health:${e.message}`);
  }

  try {
    const wres = await fetch(`${BACKEND_URL}/health/workers`);
    workers = { status: wres.status, body: await wres.json() };
  } catch (e) {
    errors.push(`workers:${e.message}`);
  }

  try {
    authProbe = await probeAuthEndpoint();
  } catch (e) {
    errors.push(`auth_probe:${e.message}`);
  }

  const routeDeployed =
    authProbe?.body?.error === 'asaas_transfer_auth_webhook_disabled' ||
    authProbe?.body?.status === 'REFUSED' ||
    (authProbe?.status === 200 && authProbe?.body?.status);

  const routeMissing =
    authProbe?.body?.message === 'Rota não encontrada' ||
    authProbe?.body?.success === false && String(authProbe?.body?.path || '').includes('transfer-validation');

  const localFlags = Object.fromEntries(
    GATE_FLAGS.map((k) => [k, process.env[k] == null ? null : String(process.env[k]).trim()])
  );

  const checks = {
    health_200: health?.status === 200,
    db_connected: health?.body?.database === 'connected',
    auth_route_deployed: routeDeployed,
    auth_route_missing: routeMissing,
    pix_out_gates_local_off:
      localFlags.ASAAS_PIX_OUT_PRODUCTION_ENABLED !== 'true' &&
      localFlags.PAYMENT_ENGINE_PIXOUT_ENABLED !== 'true'
  };

  const blockers = [];
  if (!checks.health_200) blockers.push('HEALTH_NOT_200');
  if (!checks.db_connected) blockers.push('DB_NOT_CONNECTED');
  if (routeMissing) blockers.push('AUTH_ROUTE_NOT_DEPLOYED');
  if (!routeDeployed && !routeMissing) blockers.push('AUTH_ROUTE_STATE_UNKNOWN');

  const verdict =
    blockers.length === 0 ? 'PREFLIGHT_PASS' : blockers.includes('AUTH_ROUTE_NOT_DEPLOYED') ? 'BLOCKED_DEPLOY' : 'PREFLIGHT_FAIL';

  emit('P16B_PREFLIGHT', {
    at,
    backendUrl: BACKEND_URL,
    health,
    workers,
    authProbe,
    localFlags,
    checks,
    blockers,
    errors
  });
  emit('P16B_VERDICT', { verdict, blockers });

  process.exit(verdict === 'PREFLIGHT_PASS' ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
