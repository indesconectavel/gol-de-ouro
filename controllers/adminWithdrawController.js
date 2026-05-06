'use strict';

const { approveWithdrawManualAdmin, cancelWithdrawManualAdmin } = require('../src/domain/payout/processPendingWithdrawals');

async function approveManualWithdraw(req, res, supabase) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Sistema temporariamente indisponível' });
    }
    const saqueId = req.body?.saqueId ?? req.body?.id;
    if (!saqueId || typeof saqueId !== 'string') {
      return res.status(400).json({ success: false, message: 'saqueId é obrigatório (string UUID)' });
    }

    const result = await approveWithdrawManualAdmin({ supabase, saqueId: String(saqueId).trim() });
    if (result.success) {
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

    const result = await cancelWithdrawManualAdmin({
      supabase,
      saqueId: String(saqueId).trim(),
      motivo
    });

    if (result.success) {
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

module.exports = {
  approveManualWithdraw,
  cancelManualWithdraw
};
