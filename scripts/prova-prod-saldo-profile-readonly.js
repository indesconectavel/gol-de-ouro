/**
 * READ-ONLY: Chama GET /health e GET /api/user/profile em T0, T0+10s, T0+40s.
 * Usa process.env.BEARER (não imprime token; mascara nos logs).
 * Saída: JSON com health + saldo em cada momento (para prova saldo persistido vs visual).
 */
const https = require('https');

const BASE = 'https://goldeouro-backend-v2.fly.dev';
const mask = (s) => {
  if (!s || typeof s !== 'string') return '***';
  const t = s.trim();
  if (t.length <= 10) return t.slice(0, 2) + '***';
  return t.slice(0, 6) + '...' + t.slice(-4);
};

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { ...headers }
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, raw: body.slice(0, 200) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function main() {
  const bearer = process.env.BEARER;
  const out = { timestamp: new Date().toISOString(), bearer_set: !!bearer && String(bearer).startsWith('Bearer '), health: null, profile_t0: null, profile_t10: null, profile_t40: null, saldos: [], conclusao: null };

  if (!bearer || !String(bearer).startsWith('Bearer ')) {
    out.conclusao = 'INCONCLUSIVO: BEARER não definido ou inválido. Defina BEARER=Bearer <jwt> e execute novamente.';
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const authHeader = { Authorization: bearer };

  try {
    const healthRes = await get(BASE + '/health');
    out.health = { statusCode: healthRes.statusCode, ok: healthRes.data?.status === 'ok' };

    const p0 = await get(BASE + '/api/user/profile', authHeader);
    out.profile_t0 = { statusCode: p0.statusCode, success: p0.data?.success, saldo: p0.data?.data?.saldo ?? null };
    out.saldos.push({ t: 'T0', saldo: out.profile_t0.saldo });

    await new Promise((r) => setTimeout(r, 10000));
    const p10 = await get(BASE + '/api/user/profile', authHeader);
    out.profile_t10 = { statusCode: p10.statusCode, success: p10.data?.success, saldo: p10.data?.data?.saldo ?? null };
    out.saldos.push({ t: 'T0+10s', saldo: out.profile_t10.saldo });

    await new Promise((r) => setTimeout(r, 30000));
    const p40 = await get(BASE + '/api/user/profile', authHeader);
    out.profile_t40 = { statusCode: p40.statusCode, success: p40.data?.success, saldo: p40.data?.data?.saldo ?? null };
    out.saldos.push({ t: 'T0+40s', saldo: out.profile_t40.saldo });

    const s0 = out.profile_t0.saldo;
    const s10 = out.profile_t10.saldo;
    const s40 = out.profile_t40.saldo;
    if (s0 != null && s10 != null && s40 != null) {
      const increased = (s10 > s0) || (s40 > s0) || (s40 > s10);
      out.conclusao = increased ? 'SALDO_AUMENTOU (persistido - backend alterou entre chamadas)' : 'SALDO_ESTAVEL (sem aumento entre T0, T0+10s, T0+40s)';
    } else {
      out.conclusao = 'INCONCLUSIVO: um ou mais profile retornaram sem saldo (verificar statusCode/success)';
    }
  } catch (e) {
    out.erro = e.message || String(e);
    out.conclusao = 'INCONCLUSIVO: erro na requisição';
  }

  console.log(JSON.stringify(out, null, 2));
}

main();
