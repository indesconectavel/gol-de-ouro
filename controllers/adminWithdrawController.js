'use strict';

const { createPixWithdraw } = require('../services/pix-mercado-pago');
const {
  approveWithdrawManualAdmin,
  approveAndSendWithdrawAdmin,
  cancelWithdrawManualAdmin
} = require('../src/domain/payout/processPendingWithdrawals');
const { logAdminAction, getClientIp } = require('../src/utils/adminAuditLogger');

async function approveManualWithdraw(req, res, supabase) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Sistema temporariamente indisponível' });
    }
    const saqueId = req.body?.saqueId ?? req.body?.id;
    if (!saqueId || typeof saqueId !== 'string') {
      return res.status(400).json({ success: false, message: 'saqueId é obrigatório (string UUID)' });
    }

    const adminActorId = req.user?.userId;
    const result = await approveWithdrawManualAdmin({
      supabase,
      saqueId: String(saqueId).trim(),
      adminActorId
    });
    if (result.success) {
      await logAdminAction({
        supabase,
        adminId: adminActorId,
        action: 'withdraw.approve',
        targetType: 'withdrawal',
        targetId: String(saqueId).trim(),
        metadata: {
          status_final: result.statusFinal || 'pago_manual',
          deduped: !!result.deduped
        },
        ip: getClientIp(req)
      });
      const code = result.deduped ? 200 : 200;
      return res.status(code).json({
        success: true,
        message: result.deduped ? 'Saque já estava marcado como pago manual' : 'Saque marcado como pago manual',
        data: {
          saqueId,
          status: result.statusFinal || 'pago_manual',
          deduped: !!result.deduped
        }
      });
    }

    if (result.code === 'INVARIANT_BROKEN') {
      return res.status(409).json({
        success: false,
        message:
          'Inconsistência detectada: há registro de pagamento no ledger, mas o saque ainda está pendente. Encaminhe para suporte técnico.'
      });
    }
    if (result.code === 'LEDGER_WRITE_FAILED') {
      if (result.compensated === false) {
        return res.status(500).json({
          success: false,
          message:
            'Falha ao registrar o pagamento no ledger e a reversão do saque também falhou. Estado crítico — acione suporte técnico.'
        });
      }
      return res.status(503).json({
        success: false,
        message:
          'Não foi possível registrar o pagamento no ledger; o saque foi revertido para pendente. Tente aprovar novamente em instantes.',
        compensated: true
      });
    }
    if (result.code === 'HAS_ROLLBACK' || `${result.error?.message || ''}`.includes('rollback')) {
      return res.status(409).json({ success: false, message: 'Saque não pode ser pago após rollback' });
    }
    if (result.code === 'OK_COMPENSATED') {
      return res.status(409).json({
        success: false,
        message: 'Saque já está compensado por rollback manual; não representa pagamento real.'
      });
    }
    if (result.code === 'LEDGER_STATE_READ_FAILED') {
      return res.status(503).json({
        success: false,
        message: 'Não foi possível validar o estado financeiro no momento. Tente novamente.'
      });
    }
    if (result.code === 'INVALID_STATUS') {
      return res.status(409).json({
        success: false,
        message: 'Somente saques em status pendente podem ser aprovados manualmente'
      });
    }
    if (result.code === 'CONFLICT') {
      return res.status(409).json({
        success: false,
        message: 'Estado alterado durante a operação. Recarregar e tentar novamente.'
      });
    }

    console.error('[ADMIN][WITHDRAW][APPROVE] falha:', result.error);
    return res.status(500).json({ success: false, message: 'Erro ao aprovar saque manualmente' });
  } catch (e) {
    console.error('[ADMIN][WITHDRAW][APPROVE] exceção:', e);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

async function cancelManualWithdraw(req, res, supabase) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Sistema temporariamente indisponível' });
    }
    const saqueId = req.body?.saqueId ?? req.body?.id;
    const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo : '';

    if (!saqueId || typeof saqueId !== 'string') {
      return res.status(400).json({ success: false, message: 'saqueId é obrigatório (string UUID)' });
    }

    const adminActorId = req.user?.userId;
    const result = await cancelWithdrawManualAdmin({
      supabase,
      saqueId: String(saqueId).trim(),
      motivo,
      adminActorId
    });

    if (result.success) {
      const meta = {
        status_final: result.statusFinal || 'cancelado_manual',
        deduped: !!result.deduped,
        compensated: !!result.compensated
      };
      if (motivo.trim()) {
        meta.motivo_len = Math.min(motivo.trim().length, 500);
      }
      await logAdminAction({
        supabase,
        adminId: adminActorId,
        action: 'withdraw.cancel',
        targetType: 'withdrawal',
        targetId: String(saqueId).trim(),
        metadata: meta,
        ip: getClientIp(req)
      });
      return res.status(200).json({
        success: true,
        message: result.deduped ? 'Saque já estava cancelado manualmente' : 'Saque cancelado e saldo reestornado',
        data: {
          saqueId,
          status: result.statusFinal || 'cancelado_manual',
          deduped: !!result.deduped
        }
      });
    }

    if (result.code === 'ALREADY_PAID') {
      return res.status(409).json({ success: false, message: 'Saque já pago — não pode cancelar' });
    }
    if (result.code === 'INVARIANT_BROKEN') {
      return res.status(409).json({
        success: false,
        message:
          'Inconsistência detectada: existe payout_manual_confirmado sem rollback_manual. Operação bloqueada para segurança.'
      });
    }
    if (result.code === 'OK_COMPENSATED') {
      await logAdminAction({
        supabase,
        adminId: adminActorId,
        action: 'withdraw.cancel',
        targetType: 'withdrawal',
        targetId: String(saqueId).trim(),
        metadata: {
          outcome: 'ok_compensated',
          status_final: result.statusFinal || 'cancelado',
          deduped: true
        },
        ip: getClientIp(req)
      });
      return res.status(200).json({
        success: true,
        message: 'Saque já está compensado (rollback_manual registrado). Nenhuma ação adicional necessária.',
        data: {
          saqueId,
          status: result.statusFinal || 'cancelado',
          deduped: true,
          compensated: true
        }
      });
    }
    if (result.code === 'LEDGER_STATE_READ_FAILED') {
      return res.status(503).json({
        success: false,
        message: 'Não foi possível validar o estado financeiro no momento. Tente novamente.'
      });
    }
    if (result.code === 'INVALID_STATUS') {
      return res.status(409).json({
        success: false,
        message: 'Somente saques em status pendente podem ser cancelados manualmente'
      });
    }
    if (result.code === 'CONFLICT') {
      return res.status(409).json({
        success: false,
        message: 'Estado alterado durante a operação. Recarregar e tentar novamente.'
      });
    }

    console.error('[ADMIN][WITHDRAW][CANCEL] falha:', result.error);
    return res.status(500).json({ success: false, message: 'Erro ao cancelar saque manualmente' });
  } catch (e) {
    console.error('[ADMIN][WITHDRAW][CANCEL] exceção:', e);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

async function approveAndSendWithdraw(req, res, supabase) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Sistema temporariamente indisponível' });
    }
    const saqueId = req.body?.saqueId ?? req.body?.id;
    if (!saqueId || typeof saqueId !== 'string') {
      return res.status(400).json({ success: false, message: 'saqueId é obrigatório (string UUID)' });
    }

    const adminActorId = req.user?.userId;
    const payoutEnabled = String(process.env.PAYOUT_PIX_ENABLED || '').toLowerCase() === 'true';
    const result = await approveAndSendWithdrawAdmin({
      supabase,
      saqueId: String(saqueId).trim(),
      adminActorId,
      createPixWithdraw,
      payoutEnabled
    });

    const trimmedId = String(saqueId).trim();

    if (result.success) {
      await logAdminAction({
        supabase,
        adminId: adminActorId,
        action: 'withdraw.approve_and_send',
        targetType: 'withdrawal',
        targetId: trimmedId,
        metadata: {
          status_final: result.statusFinal || 'aguardando_confirmacao',
          deduped: !!result.deduped,
          mp_transaction_intent_id: result.mp_transaction_intent_id || null,
          mp_payout_status: result.mp_payout_status || null
        },
        ip: getClientIp(req)
      });
      return res.status(200).json({
        success: true,
        message: result.deduped
          ? 'Saque já está aguardando confirmação do provedor'
          : 'PIX enviado ao provedor; aguardando confirmação',
        data: {
          saqueId: trimmedId,
          status: result.statusFinal || 'aguardando_confirmacao',
          deduped: !!result.deduped,
          awaiting_webhook: true,
          mp_transaction_intent_id: result.mp_transaction_intent_id || null,
          mp_payout_status: result.mp_payout_status || null,
          payout_external_reference: result.payout_external_reference || null
        }
      });
    }

    const codeMap = {
      PAYOUT_DISABLED: [503, 'Payout PIX desativado no ambiente'],
      MP_NOT_CONFIGURED: [503, 'Provedor de payout não configurado'],
      NOT_FOUND: [404, 'Saque não encontrado'],
      MISSING_CORRELATION: [409, 'Saque sem correlation_id'],
      INVALID_STATUS: [409, 'Somente saques pendentes podem receber PIX automático'],
      ALREADY_PAID: [409, 'Saque já pago ou finalizado'],
      IN_FLIGHT: [409, 'PIX já em processamento para este saque — recarregue o painel'],
      INVARIANT_BROKEN: [
        409,
        'Inconsistência ledger/status detectada. Encaminhe para suporte técnico.'
      ],
      HAS_ROLLBACK: [409, 'Saque não pode ser pago após rollback'],
      OK_COMPENSATED: [409, 'Saque compensado; não representa pagamento pendente'],
      TITULAR_BLOCKED: [409, 'Dados do titular PIX incompletos para envio automático'],
      INVALID_AMOUNT: [409, 'Valores financeiros inválidos no saque'],
      LOCK_CONFLICT: [409, 'Outro processo iniciou o payout. Recarregue e tente novamente.'],
      LEDGER_STATE_READ_FAILED: [503, 'Não foi possível validar o estado financeiro no momento. Tente novamente.'],
      MP_TERMINAL_FAIL: [502, 'Provedor rejeitou ou falhou no payout PIX'],
      STATUS_UPDATE_FAILED: [500, 'Falha ao atualizar status do saque após envio ao provedor'],
      MP_UNEXPECTED: [502, 'Resposta inesperada do provedor de payout']
    };

    if (result.code && codeMap[result.code]) {
      const [httpStatus, message] = codeMap[result.code];
      return res.status(httpStatus).json({ success: false, message });
    }

    console.error('[ADMIN][WITHDRAW][APPROVE_AND_SEND] falha:', result.error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar PIX automático' });
  } catch (e) {
    console.error('[ADMIN][WITHDRAW][APPROVE_AND_SEND] exceção:', e);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

module.exports = {
  approveManualWithdraw,
  approveAndSendWithdraw,
  cancelManualWithdraw
};
