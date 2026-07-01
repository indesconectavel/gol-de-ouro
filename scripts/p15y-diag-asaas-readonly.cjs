#!/usr/bin/env node
'use strict';

/**
 * P1.5Y.DIAG — consultas read-only Asaas produção (sem POST /transfers).
 * Uso: node scripts/p15y-diag-asaas-readonly.cjs
 * Requer: ASAAS_API_KEY (produção). Não altera gates Fly.
 */

const DEFAULT_BASE = 'https://api.asaas.com/v3';

function maskKey(key) {
  if (!key || key.length < 12) return '(ausente)';
  return `${key.slice(0, 14)}...${key.slice(-3)}`;
}

function readEnv(name) {
  const v = process.env[name];
  return v == null || String(v).trim() === '' ? null : String(v).trim();
}

async function asaasGet(baseUrl, apiKey, path) {
  const url = `${baseUrl.replace(/\/+$/, '')}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      access_token: apiKey,
      'User-Agent': 'GolDeOuro-P15Y-DIAG/1.0'
    }
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { httpStatus: res.status, data };
}

function summarizeMyAccount(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    id: data.id ?? null,
    name: data.name ?? null,
    email: data.email ? `${String(data.email).slice(0, 3)}***` : null,
    personType: data.personType ?? null,
    companyType: data.companyType ?? null,
    cpfCnpj: data.cpfCnpj ? `${String(data.cpfCnpj).slice(0, 3)}***` : null,
    status: data.status ?? data.accountStatus ?? null,
    walletId: data.walletId ?? null
  };
}

function summarizeBalance(data) {
  if (!data || typeof data !== 'object') return null;
  return { balance: data.balance ?? null };
}

async function main() {
  const apiKey = readEnv('ASAAS_API_KEY');
  const baseUrl = readEnv('ASAAS_BASE_URL') || DEFAULT_BASE;
  const asaasEnv = readEnv('ASAAS_ENV') || '(unset)';

  const out = {
    phase: 'p15y-diag-readonly',
    ts: new Date().toISOString(),
    config: {
      asaasEnv,
      baseUrl,
      apiKeyPreview: maskKey(apiKey)
    },
    myAccount: null,
    balance: null,
    errors: []
  };

  if (!apiKey) {
    out.errors.push('ASAAS_API_KEY ausente no runtime');
    console.log('###P15Y_DIAG_READONLY###' + JSON.stringify(out));
    process.exit(2);
  }

  const account = await asaasGet(baseUrl, apiKey, '/myAccount');
  out.myAccount = {
    httpStatus: account.httpStatus,
    summary: summarizeMyAccount(account.data),
    errorCode:
      account.httpStatus >= 400 && Array.isArray(account.data?.errors)
        ? account.data.errors[0]?.code ?? null
        : null
  };

  const balance = await asaasGet(baseUrl, apiKey, '/finance/balance');
  out.balance = {
    httpStatus: balance.httpStatus,
    summary: summarizeBalance(balance.data),
    errorCode:
      balance.httpStatus >= 400 && Array.isArray(balance.data?.errors)
        ? balance.data.errors[0]?.code ?? null
        : null
  };

  console.log('###P15Y_DIAG_READONLY###' + JSON.stringify(out));
  process.exit(0);
}

main().catch((err) => {
  console.log(
    '###P15Y_DIAG_READONLY###' +
      JSON.stringify({
        phase: 'p15y-diag-readonly',
        fatal: err?.message || String(err)
      })
  );
  process.exit(1);
});
