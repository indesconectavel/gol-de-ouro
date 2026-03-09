/**
 * AUDITORIA READ-ONLY: Endpoints do financeiro — apenas GET e OPTIONS.
 * URL base: https://goldeouro-backend-v2.fly.dev
 * Se process.env.BEARER existir (não imprimir), usa para GET autenticados.
 * Salva docs/relatorios/auditoria-endpoints-financeiro-YYYY-MM-DD.json
 */
const path = require('path');
const fs = require('fs');
const BASE = process.env.AUDIT_BASE_URL || 'https://goldeouro-backend-v2.fly.dev';

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);

const bearer = process.env.BEARER; // "Bearer <jwt>" — nunca logar

const endpoints = [
  { path: '/health', method: 'GET', auth: false, read_only_safe: true },
  { path: '/api/monitoring/health', method: 'GET', auth: false, read_only_safe: true },
  { path: '/api/user/profile', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/withdraw/history', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/payments/pix/usuario', method: 'GET', auth: true, read_only_safe: true },
  { path: '/api/withdraw/request', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/api/payments/pix/criar', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/api/payments/webhook', method: 'OPTIONS', auth: false, read_only_safe: true },
  { path: '/api/metrics', method: 'GET', auth: false, read_only_safe: true },
  { path: '/', method: 'GET', auth: false, read_only_safe: true }
];

async function fetchOne(url, method, useAuth) {
  const start = Date.now();
  const headers = { 'Accept': 'application/json' };
  if (useAuth && bearer) headers['Authorization'] = bearer;
  try {
    const res = await fetch(url, {
      method,
      headers,
      redirect: 'follow'
    });
    const elapsed = Date.now() - start;
    const usefulHeaders = {};
    ['access-control-allow-origin', 'access-control-allow-methods', 'content-type'].forEach(h => {
      const v = res.headers.get(h);
      if (v) usefulHeaders[h] = v;
    });
    return {
      status: res.status,
      elapsed_ms: elapsed,
      headers: usefulHeaders,
      ok: res.ok
    };
  } catch (err) {
    return {
      status: 0,
      elapsed_ms: Date.now() - start,
      error: err.message,
      ok: false
    };
  }
}

async function run() {
  const results = [];
  for (const ep of endpoints) {
    const method = ep.method || 'GET';
    const useAuth = ep.auth && !!bearer;
    const url = BASE + ep.path;
    const r = await fetchOne(url, method, useAuth);
    const exists = r.status > 0 && r.status < 500 && !r.error;
    results.push({
      endpoint: ep.path,
      method_tested: method,
      status_code: r.status,
      response_time_ms: r.elapsed_ms,
      headers: r.headers,
      read_only_safe: ep.read_only_safe,
      auth_used: useAuth,
      ok: r.ok,
      exists,
      error: r.error || null
    });
  }
  const report = {
    timestamp: new Date().toISOString(),
    base_url: BASE,
    bearer_defined: !!bearer,
    results
  };
  const outPath = path.join(OUT_DIR, `auditoria-endpoints-financeiro-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK endpoints -> ' + outPath);
  if (process.env.CICLO1 === '1') {
    const ciclo1Path = path.join(OUT_DIR, 'ciclo1-endpoints-snapshot.json');
    fs.writeFileSync(ciclo1Path, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK ciclo1 -> ' + ciclo1Path);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
