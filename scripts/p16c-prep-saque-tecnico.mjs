#!/usr/bin/env node
/**
 * P1.6C.PREP — Criar saque técnico pendente via fluxo oficial (POST /api/withdraw/request).
 *
 * Fases (P16C_PREP_PHASE):
 *   snapshot — wallet/ledger/saques antes (default)
 *   create   — login + POST withdraw (requer P16C_PREP_CREATE=1)
 *   audit    — validação read-only pós-criação
 *   all      — snapshot → create (se habilitado) → audit
 *
 * Saída: tmp/p16c-prep-result.json + stdout tags ###P16C_*###
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const { isTechnicalE2EAccount } = require('../src/utils/technicalE2EAccount');

const TECHNICAL_USER_ID =
  process.env.P16C_TECHNICAL_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const BACKEND_URL = process.env.P16C_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const AMOUNT = Number(process.env.P16C_AMOUNT || 10);
const FEE = Number(process.env.PAGAMENTO_TAXA_SAQUE || 2);
const NET = AMOUNT - FEE;
const PHASE = (process.env.P16C_PREP_PHASE || 'all').toLowerCase();
const CREATE_ENABLED = process.env.P16C_PREP_CREATE === '1';
const OUT_PATH =
  process.env.P16C_PREP_OUT || path.join(process.cwd(), 'tmp', 'p16c-prep-result.json');

/** P1.6ZA — default homologação: indesconectavel@gmail.com (EMAIL). Override: P16C_PIX_KEY */
const PIX_KEY = process.env.P16C_PIX_KEY || 'indesconectavel@gmail.com';
const PIX_TYPE = process.env.P16C_PIX_TYPE || 'email';

const result = { at: new Date().toISOString(), phase: PHASE, steps: [] };

function emit(tag, obj) {
  const line = `###${tag}###${JSON.stringify(obj)}`;
  console.log(line);
  result.steps.push({ tag, ...obj });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function readTechnicalSnapshot(sb) {
  const { data: user, error: userErr } = await sb
    .from('usuarios')
    .select('id, email, saldo, cpf_cnpj')
    .eq('id', TECHNICAL_USER_ID)
    .maybeSingle();
  if (userErr) throw userErr;

  const { data: pending } = await sb
    .from('saques')
    .select('id, status, amount, valor, net_amount, correlation_id, created_at')
    .eq('usuario_id', TECHNICAL_USER_ID)
    .in('status', ['pendente', 'pending'])
    .limit(5);

  const { data: recent } = await sb
    .from('saques')
    .select('id, status, amount, valor, net_amount, asaas_transfer_id, created_at')
    .eq('usuario_id', TECHNICAL_USER_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    user,
    pendingSaques: pending || [],
    recentSaques: recent || [],
    technical: isTechnicalE2EAccount({ id: user?.id, email: user?.email })
  };
}

async function readLedgerForCorrelation(sb, correlationId) {
  if (!correlationId) return [];
  const { data } = await sb
    .from('ledger_financeiro')
    .select('id, tipo, valor, referencia, correlation_id, created_at')
    .eq('correlation_id', correlationId)
    .order('created_at', { ascending: true });
  return data || [];
}

async function readSaqueAudit(sb, saqueId) {
  const { data: saque, error } = await sb
    .from('saques')
    .select(
      'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, pix_key, chave_pix, pix_type, tipo_chave, asaas_transfer_id, asaas_transfer_status, payout_provider, created_at'
    )
    .eq('id', saqueId)
    .maybeSingle();
  if (error) throw error;

  const { data: user } = await sb
    .from('usuarios')
    .select('id, email, saldo')
    .eq('id', saque?.usuario_id || TECHNICAL_USER_ID)
    .maybeSingle();

  const ledger = await readLedgerForCorrelation(sb, saque?.correlation_id);

  return { saque, user, ledger };
}

async function loginTechnical() {
  const email = process.env.P16C_TECHNICAL_EMAIL;
  const password = process.env.P16C_TECHNICAL_PASSWORD;
  if (!email || !password) {
    return {
      ok: false,
      error: 'P16C_TECHNICAL_EMAIL / P16C_TECHNICAL_PASSWORD não configurados no ambiente'
    };
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30000)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    return { ok: false, status: res.status, body };
  }
  if (body.user?.id && body.user.id !== TECHNICAL_USER_ID) {
    return {
      ok: false,
      error: `Login retornou user_id ${body.user.id}, esperado ${TECHNICAL_USER_ID}`
    };
  }
  return { ok: true, token: body.token, user: body.user };
}

async function createWithdrawOfficial(token, correlationId) {
  const res = await fetch(`${BACKEND_URL}/api/withdraw/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': correlationId
    },
    body: JSON.stringify({
      valor: AMOUNT,
      chave_pix: PIX_KEY,
      tipo_chave: PIX_TYPE
    }),
    signal: AbortSignal.timeout(45000)
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function validateAudit(bundle) {
  const issues = [];
  const saque = bundle.saque;
  if (!saque?.id) issues.push('saque não encontrado');
  const st = String(saque?.status || '').toLowerCase();
  if (!['pendente', 'pending'].includes(st)) issues.push(`status=${st}, esperado pendente`);
  const amount = parseFloat(saque?.amount ?? saque?.valor ?? 0);
  if (amount !== AMOUNT) issues.push(`amount=${amount}, esperado ${AMOUNT}`);
  const net = parseFloat(saque?.net_amount ?? 0);
  if (net !== NET) issues.push(`net_amount=${net}, esperado ${NET}`);
  if (saque?.usuario_id !== TECHNICAL_USER_ID) {
    issues.push(`usuario_id=${saque?.usuario_id}, esperado conta técnica`);
  }
  if (saque?.asaas_transfer_id) {
    issues.push('asaas_transfer_id já preenchido — PIX OUT não deveria ter sido aberto');
  }
  const tipos = (bundle.ledger || []).map((r) => r.tipo);
  if (!tipos.includes('saque')) issues.push('ledger sem tipo saque');
  if (!tipos.includes('taxa')) issues.push('ledger sem tipo taxa');
  const provider = saque?.payout_provider;
  if (provider && !['asaas', null, ''].includes(String(provider).toLowerCase())) {
    issues.push(`payout_provider=${provider} incompatível com Asaas`);
  }
  const pixKey = String(saque?.pix_key || saque?.chave_pix || '').trim().toLowerCase();
  if (pixKey !== String(PIX_KEY).trim().toLowerCase()) {
    issues.push(`pix_key=${pixKey || '(vazio)'}, esperado ${PIX_KEY}`);
  }
  const pixType = String(saque?.pix_type || saque?.tipo_chave || PIX_TYPE).trim().toLowerCase();
  if (pixType !== String(PIX_TYPE).trim().toLowerCase()) {
    issues.push(`tipo_chave=${pixType}, esperado ${PIX_TYPE}`);
  }
  return { ok: issues.length === 0, issues };
}

async function phaseSnapshot(sb) {
  const snap = await readTechnicalSnapshot(sb);
  emit('P16C_SNAPSHOT', {
    technicalUserId: TECHNICAL_USER_ID,
    email: snap.user?.email,
    walletBefore: snap.user?.saldo,
    cpfCadastrado: Boolean(String(snap.user?.cpf_cnpj || '').replace(/\D/g, '').length),
    technical: snap.technical,
    pendingCount: snap.pendingSaques.length,
    pendingSaques: snap.pendingSaques,
    recentSaques: snap.recentSaques
  });
  return snap;
}

async function phaseCreate(sb, snap) {
  if (snap.pendingSaques.length > 0) {
    const existing = snap.pendingSaques[0];
    emit('P16C_CREATE_SKIP', {
      reason: 'já existe saque pendente na conta técnica',
      saqueId: existing.id,
      correlation_id: existing.correlation_id
    });
    return { saqueId: existing.id, correlationId: existing.correlation_id, created: false };
  }

  if (!CREATE_ENABLED) {
    emit('P16C_CREATE_BLOCKED', {
      reason: 'P16C_PREP_CREATE=1 não definido — criação não executada',
      manualAction: {
        endpoint: 'POST /api/withdraw/request',
        backend: BACKEND_URL,
        body: { valor: AMOUNT, chave_pix: PIX_KEY, tipo_chave: PIX_TYPE },
        headers: ['Authorization: Bearer <token conta técnica>', 'x-correlation-id: <uuid>']
      }
    });
    return { created: false, blocked: true };
  }

  const login = await loginTechnical();
  if (!login.ok) {
    emit('P16C_CREATE_FAIL', { step: 'login', ...login });
    return { created: false, error: login.error || 'login failed' };
  }

  const correlationId = process.env.P16C_CORRELATION_ID || crypto.randomUUID();
  const walletBefore = snap.user?.saldo;

  const withdraw = await createWithdrawOfficial(login.token, correlationId);
  if (withdraw.status !== 201 && withdraw.status !== 200) {
    emit('P16C_CREATE_FAIL', { step: 'withdraw', status: withdraw.status, body: withdraw.body });
    return { created: false, error: withdraw.body?.message || 'withdraw failed' };
  }

  const saqueId = withdraw.body?.data?.id;
  emit('P16C_CREATE_OK', {
    saqueId,
    userId: TECHNICAL_USER_ID,
    correlationId,
    walletBefore,
    amount: AMOUNT,
    fee: FEE,
    net_amount: NET,
    status: withdraw.body?.data?.status,
    httpStatus: withdraw.status
  });
  return { saqueId, correlationId, walletBefore, created: true };
}

async function phaseAudit(sb, saqueId) {
  if (!saqueId) {
    emit('P16C_AUDIT', { result: 'SKIP', reason: 'sem saque_id' });
    return { result: 'SKIP' };
  }

  const bundle = await readSaqueAudit(sb, saqueId);
  const validation = validateAudit(bundle);
  emit('P16C_AUDIT', {
    saqueId,
    userId: bundle.saque?.usuario_id,
    correlationId: bundle.saque?.correlation_id,
    status: bundle.saque?.status,
    amount: bundle.saque?.amount ?? bundle.saque?.valor,
    fee: bundle.saque?.fee,
    net_amount: bundle.saque?.net_amount,
    walletAfter: bundle.user?.saldo,
    asaas_transfer_id: bundle.saque?.asaas_transfer_id ?? null,
    payout_provider: bundle.saque?.payout_provider ?? null,
    ledger: bundle.ledger,
    validation
  });
  return validation;
}

function writeResult(verdict) {
  result.verdict = verdict;
  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  emit('P16C_OUT', { path: OUT_PATH });
}

async function main() {
  const sb = getSupabase();
  let saqueId = process.env.P16C_SAQUE_ID || null;

  if (['snapshot', 'all'].includes(PHASE)) {
    const snap = await phaseSnapshot(sb);
    if (!snap.user?.id) {
      writeResult('BLOCKED');
      emit('P16C_VERDICT', { result: 'BLOCKED', reason: 'conta técnica não encontrada' });
      process.exit(3);
    }
    if (parseFloat(snap.user.saldo) < AMOUNT) {
      writeResult('BLOCKED');
      emit('P16C_VERDICT', {
        result: 'BLOCKED',
        reason: `saldo wallet ${snap.user.saldo} < ${AMOUNT}`
      });
      process.exit(3);
    }

    if (['create', 'all'].includes(PHASE)) {
      const created = await phaseCreate(sb, snap);
      if (created.saqueId) saqueId = created.saqueId;
      if (created.blocked) {
        writeResult('BLOCKED');
        emit('P16C_VERDICT', { result: 'BLOCKED', reason: 'criação requer credenciais ou P16C_PREP_CREATE=1' });
        process.exit(2);
      }
      if (created.error && !created.saqueId) {
        writeResult('BLOCKED');
        emit('P16C_VERDICT', { result: 'BLOCKED', reason: created.error });
        process.exit(2);
      }
    }
  }

  if (['audit', 'all'].includes(PHASE)) {
    const validation = await phaseAudit(sb, saqueId);
    if (validation.result === 'SKIP') {
      writeResult('BLOCKED');
      emit('P16C_VERDICT', { result: 'BLOCKED', reason: 'auditoria sem saque' });
      process.exit(2);
    }
    if (validation.ok) {
      writeResult('READY');
      emit('P16C_VERDICT', { result: 'READY', saqueId });
      process.exit(0);
    }
    writeResult('BLOCKED');
    emit('P16C_VERDICT', { result: 'BLOCKED', issues: validation.issues, saqueId });
    process.exit(2);
  }

  writeResult('BLOCKED');
  emit('P16C_VERDICT', { result: 'BLOCKED', reason: `fase desconhecida: ${PHASE}` });
  process.exit(1);
}

main().catch((err) => {
  emit('P16C_FATAL', { error: err.message, stack: err.stack });
  writeResult('BLOCKED');
  process.exit(1);
});
