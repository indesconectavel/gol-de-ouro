#!/usr/bin/env node
'use strict';
/**
 * P1.4F — Reprocessamento controlado do depósito Asaas já pago (sem nova cobrança).
 *
 * Env:
 *   P14F_ALLOW_REPROCESS=1  — obrigatório
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { createLedgerEntry } = require('../src/domain/payout/processPendingWithdrawals');
const { claimApprovedPixDeposit } = require('../src/finance/deposit/claimApprovedPixDeposit');

const ALLOWED = {
  payment_id: 'pay_1zr8bxbd5abypkws',
  pagamentos_pix_id: '06bcc936-ce25-4474-a810-14d873448e75',
  usuario_id: '85872488-9e4c-42df-8978-7f9ef9f5cb00',
  amount: 5
};

function emit(tag, obj) {
  console.log(`###${tag}###${JSON.stringify(obj)}`);
}

async function main() {
  if (process.env.P14F_ALLOW_REPROCESS !== '1') {
    emit('P14F_VERDICT', { result: 'FAIL', error: 'P14F_ALLOW_REPROCESS=1 obrigatório' });
    process.exit(1);
  }

  if (process.env.ASAAS_PRODUCTION_ENABLED === 'true') {
    emit('P14F_VERDICT', { result: 'FAIL', error: 'ASAAS_PRODUCTION_ENABLED=true — abort' });
    process.exit(1);
  }

  const paymentId = process.env.P14F_PAYMENT_ID || ALLOWED.payment_id;
  if (paymentId !== ALLOWED.payment_id) {
    emit('P14F_VERDICT', { result: 'FAIL', error: 'payment_id não autorizado' });
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    emit('P14F_VERDICT', { result: 'FAIL', error: 'Supabase não configurado' });
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: pixBefore } = await supabase
    .from('pagamentos_pix')
    .select('id, status, amount, valor, usuario_id')
    .eq('id', ALLOWED.pagamentos_pix_id)
    .single();

  const { data: userBefore } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', ALLOWED.usuario_id)
    .single();

  const { data: ledgerBefore } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, valor')
    .eq('correlation_id', paymentId)
    .eq('tipo', 'deposito');

  emit('P14F_BEFORE', {
    pix_status: pixBefore?.status,
    saldo: userBefore?.saldo,
    ledger_count: Array.isArray(ledgerBefore) ? ledgerBefore.length : 0
  });

  const result = await claimApprovedPixDeposit(
    { supabase, createLedgerEntry, log: (event, payload) => emit('P14F_LOG', { event, ...payload }) },
    paymentId
  );

  const { data: pixAfter } = await supabase
    .from('pagamentos_pix')
    .select('id, status, updated_at')
    .eq('id', ALLOWED.pagamentos_pix_id)
    .single();

  const { data: userAfter } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', ALLOWED.usuario_id)
    .single();

  const { data: ledgerAfter } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, valor, referencia')
    .eq('correlation_id', paymentId)
    .eq('tipo', 'deposito');

  const saldoDelta = Number(userAfter?.saldo) - Number(userBefore?.saldo || 0);

  const evidence = {
    claim: result,
    pix_status: pixAfter?.status,
    saldo_before: Number(userBefore?.saldo),
    saldo_after: Number(userAfter?.saldo),
    saldo_delta: saldoDelta,
    ledger_count: Array.isArray(ledgerAfter) ? ledgerAfter.length : 0
  };

  emit('P14F_AFTER', evidence);

  const pass =
    result.ok &&
    String(pixAfter?.status).toLowerCase() === 'approved' &&
    (saldoDelta === ALLOWED.amount || (result.idempotent && saldoDelta === 0 && ledgerAfter?.length >= 1));

  emit('P14F_VERDICT', { result: pass ? 'PASS' : 'FAIL', evidence });
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  emit('P14F_VERDICT', { result: 'FAIL', error: e.message });
  process.exit(1);
});
