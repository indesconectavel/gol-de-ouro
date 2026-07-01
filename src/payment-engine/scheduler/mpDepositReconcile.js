'use strict';

const axios = require('axios');
const GolDeOuroDepositRepository = require('../adapters/goldeouro/GolDeOuroDepositRepository');

let reconciling = false;

/**
 * Reconciliação automática de PIX IN pendentes (Mercado Pago).
 * Lógica extraída de server-fly.js — comportamento idêntico (P2.2).
 *
 * @param {object} runtime
 * @param {() => object|null} runtime.getSupabase
 * @param {() => boolean} runtime.getDbConnected
 * @param {() => boolean} runtime.getMercadoPagoConnected
 * @param {() => string|null} runtime.getMercadoPagoAccessToken
 * @param {Function} runtime.financeLog
 * @param {(id: string) => Promise<boolean>} runtime.claimAndCreditApprovedPixDeposit
 */
async function runMpDepositReconcileCycle(runtime = {}) {
  if (reconciling) return;
  const supabase = runtime.getSupabase?.();
  const dbConnected = runtime.getDbConnected?.();
  const mercadoPagoConnected = runtime.getMercadoPagoConnected?.();
  const mercadoPagoAccessToken = runtime.getMercadoPagoAccessToken?.();
  const financeLog = runtime.financeLog || (() => {});
  const claimAndCreditApprovedPixDeposit = runtime.claimAndCreditApprovedPixDeposit;

  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  if (!mercadoPagoAccessToken) {
    console.log('⚠️ [RECON][DEPOSIT] Token de depósito não configurado');
    return;
  }
  if (typeof claimAndCreditApprovedPixDeposit !== 'function') return;

  try {
    reconciling = true;
    const maxAgeRaw = parseInt(process.env.MP_RECONCILE_MIN_AGE_MIN || '2', 10);
    const limitRaw = parseInt(process.env.MP_RECONCILE_LIMIT || '10', 10);
    const maxAgeMin = Number.isFinite(maxAgeRaw) && maxAgeRaw > 0 ? Math.min(maxAgeRaw, 120) : 2;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 10;
    const sinceIso = new Date(Date.now() - maxAgeMin * 60 * 1000).toISOString();
    financeLog('deposit_reconcile_cycle_start', {
      tipo: 'deposito',
      status: 'running',
      max_age_min: maxAgeMin,
      limit
    });

    const { data: pendings, error: listError } = await GolDeOuroDepositRepository.listPending(
      supabase,
      { sinceIso, limit }
    );

    if (listError) {
      console.error('❌ [RECON] Erro ao listar pendentes:', listError.message);
      return;
    }
    if (!pendings || pendings.length === 0) {
      financeLog('deposit_reconcile_cycle_empty', {
        tipo: 'deposito',
        status: 'empty'
      });
      return;
    }

    for (const p of pendings) {
      const mpId = GolDeOuroDepositRepository.pickMercadoPagoPaymentIdForReconcile(p);
      if (!mpId) {
        console.warn('⚠️ [RECON] Pendente sem ID MP numérico (reconcile ignorado):', {
          localId: p.id,
          usuario_id: p.usuario_id
        });
        continue;
      }

      const paymentId = parseInt(mpId, 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        console.error('❌ [RECON] ID de pagamento inválido (não é número positivo):', mpId);
        continue;
      }

      try {
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
          timeout: 5000
        });
        const status = resp?.data?.status;
        if (status === 'approved') {
          const credited = await claimAndCreditApprovedPixDeposit(mpId);
          financeLog('deposit_reconcile_claim', {
            payment_id: mpId,
            user_id: p.usuario_id,
            tipo: 'deposito',
            status: credited ? 'approved' : 'idempotent',
            valor: Number(p.amount ?? p.valor ?? 0)
          });
          if (credited) {
            console.log(
              `✅ [RECON] Pagamento ${mpId} reconciliado e saldo creditado (usuário pendente ${p.usuario_id})`
            );
          }
        } else {
          financeLog('deposit_reconcile_skip_non_approved', {
            payment_id: mpId,
            user_id: p.usuario_id,
            tipo: 'deposito',
            status: String(status || 'unknown')
          });
        }
      } catch (mpErr) {
        console.log(`⚠️ [RECON] Erro consultando MP ${mpId}:`, mpErr.response?.data || mpErr.message);
      }
    }
  } catch (err) {
    console.error('❌ [RECON] Erro geral:', err.message);
  } finally {
    financeLog('deposit_reconcile_cycle_end', {
      tipo: 'deposito',
      status: 'done'
    });
    reconciling = false;
  }
}

module.exports = { runMpDepositReconcileCycle };
