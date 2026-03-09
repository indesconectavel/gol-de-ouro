/**
 * AUDITORIA READ-ONLY: Endpoints financeiros — GET e OPTIONS apenas.
 * Inclui /webhooks/mercadopago OPTIONS. Salva docs/relatorios/final-finance-endpoints.json
 */
const path = require('path');
const fs = require('fs');
const BASE = process.env.AUDIT_BASE_URL || 'https://goldeouro-backend-v2.fly.dev';

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const bearer = process.env.BEARER;

const endpoints = [
  { path: '/health', method: 'GET', auth: false, read_only_safe: true },
  { path: '/api/monitoring/health', method: 'GET', auth: false, read_only_safe: true },
  { path: '/api/user/profile', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/withdraw/history', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/payments/pix/usuario', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/withdraw/request', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/api/payments/webhook', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/webhooks/mercadopago', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/api/metrics', method: 'GET', auth: false, read_only_safe: true },
  { path: '/', method: 'GET', auth: false, read_only_safe: true }
];

async function fetchOne(url, method, useAuth) {
  const start = Date.now();
  const headers = { 'Accept': 'application/json' };
  if (useAuth && bearer) headers['Authorization'] = bearer;
  try {
    const res = await fetch(url, { method, headers, redirect: 'follow' });
    const elapsed = Date.now() - start;
    const usefulHeaders = {};
    ['access-control-allow-origin', 'access-control-allow-methods', 'content-type'].forEach(h => {
      const v = res.headers.get(h);
      if (v) usefulHeaders[h] = v;
    });
    return { status: res.status, elapsed_ms: elapsed, headers: usefulHeaders, ok: res.ok };
  } catch (err) {
    return { status: 0, elapsed_ms: Date.now() - start, error: err.message, ok: false };
  }
}

async function run() {
  const results = [];
  for (const ep of endpoints) {
    const method = ep.method || 'GET';
    const useAuth = ep.auth && !!bearer;
    const r = await fetchOne(BASE + ep.path, method, useAuth);
    const exists = r.status > 0 && r.status < 500 && !r.error;
    results.push({
      endpoint: ep.path,
      method_tested: method,
      status_code: r.status,
      response_time_ms: r.elapsed_ms,
      headers: r.headers,
      auth_required: ep.auth,
      auth_used: useAuth,
      read_only_safe: ep.read_only_safe,
      ok: r.ok,
      exists,
      error: r.error || null,
      observacao_fluxo_financeiro: ['/api/withdraw/history', '/api/payments/pix/usuario', '/api/payments/webhook', '/webhooks/mercadopago', '/api/withdraw/request'].includes(ep.path)
    });
  }
  const report = { timestamp: new Date().toISOString(), base_url: BASE, bearer_defined: !!bearer, results };
  const outPath = path.join(OUT_DIR, 'final-finance-endpoints.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK final endpoints -> ' + outPath);
}

run().catch(err => { console.error(err); process.exit(1); });
