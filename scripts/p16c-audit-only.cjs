#!/usr/bin/env node
'use strict';
/** P1.6C.PREP — auditoria read-only via Supabase REST (timeout 20s). */
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SAQUE_ID = process.env.P16C_SAQUE_ID || 'd0313dfe-b08a-4334-a3ca-d9e7011af38a';
const TECH_ID = process.env.P16C_TECH_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const OUT = path.join(__dirname, '..', 'tmp', 'p16c-audit.json');

const SB_URL = (process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

async function sbGet(table, query) {
  const url = `${SB_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${table} HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  if (!SB_URL || !SB_KEY) throw new Error('Supabase prod credentials missing');

  const saques = await sbGet(
    'saques',
    `id=eq.${SAQUE_ID}&select=id,usuario_id,status,amount,valor,fee,net_amount,correlation_id,pix_key,chave_pix,asaas_transfer_id,asaas_transfer_status,created_at`
  );
  const saque = saques[0] || null;

  const users = await sbGet('usuarios', `id=eq.${TECH_ID}&select=id,email,saldo`);
  const user = users[0] || null;

  let ledger = [];
  if (saque?.correlation_id) {
    ledger = await sbGet(
      'ledger_financeiro',
      `correlation_id=eq.${encodeURIComponent(saque.correlation_id)}&select=id,tipo,valor,referencia,correlation_id,created_at&order=created_at.asc`
    );
  }

  const pendentes = await sbGet(
    'saques',
    `usuario_id=eq.${TECH_ID}&status=in.(pendente,pending)&select=id,status,amount,net_amount,correlation_id`
  );

  const amount = parseFloat(saque?.amount ?? saque?.valor ?? 0);
  const issues = [];
  if (!saque) issues.push('saque não encontrado');
  if (saque && !['pendente', 'pending'].includes(String(saque.status).toLowerCase())) {
    issues.push(`status=${saque.status}`);
  }
  if (amount !== 10) issues.push(`amount=${amount}`);
  if (parseFloat(saque?.net_amount) !== 8) issues.push(`net=${saque?.net_amount}`);
  if (saque?.usuario_id !== TECH_ID) issues.push(`usuario_id=${saque?.usuario_id}`);
  if (saque?.asaas_transfer_id) issues.push('asaas_transfer_id preenchido — PIX OUT aberto');
  const tipos = ledger.map((r) => r.tipo);
  if (!tipos.includes('saque')) issues.push('ledger sem saque');
  if (!tipos.includes('taxa')) issues.push('ledger sem taxa');

  const walletAfter = user?.saldo != null ? parseFloat(user.saldo) : null;
  const walletBefore = walletAfter != null ? walletAfter + 10 : 166555;

  const out = {
    at: new Date().toISOString(),
    supabaseHost: SB_URL.replace(/^https?:\/\//, '').split('.')[0],
    saqueId: SAQUE_ID,
    userId: TECH_ID,
    correlationId: saque?.correlation_id || null,
    walletBefore,
    walletAfter,
    saque,
    user: user ? { id: user.id, email: user.email, saldo: user.saldo } : null,
    ledger,
    technicalPending: pendentes,
    validation: { ok: issues.length === 0, issues },
    verdict: issues.length === 0 ? 'READY' : 'BLOCKED'
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ verdict: out.verdict, saqueId: SAQUE_ID, issues }));
}

main().catch((e) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), error: e.message, verdict: 'BLOCKED' }));
  console.error(e.message);
  process.exit(1);
});
