// Withdraw Controller - Gol de Ouro v1.3.0 - PADRONIZADO
// ✅ FASE 9: Criado para organizar rotas de saque
const { supabase } = require('../../../../database/supabase-unified-config');
const response = require('../../shared/utils/response-helper');
const PixValidator = require('../../shared/validators/pix-validator');
const FinancialService = require('../services/financial.service');

const pixValidator = new PixValidator();

class WithdrawController {
  // Solicitar saque PIX
  static async requestWithdraw(req, res) {
    try {
      const { valor, chave_pix, tipo_chave } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      if (!valor || !chave_pix || !tipo_chave) {
        return response.validationError(res, 'Valor, chave PIX e tipo de chave são obrigatórios.');
      }

      // Validar dados de entrada usando PixValidator
      const withdrawData = {
        amount: valor,
        pixKey: chave_pix,
        pixType: tipo_chave,
        userId: userId
      };

      const validation = await pixValidator.validateWithdrawData(withdrawData);
      if (!validation.valid) {
        return response.error(res, validation.error, 400);
      }

      // Verificar saldo do usuário usando FinancialService
      const hasBalance = await FinancialService.hasSufficientBalance(userId, parseFloat(valor));
      if (!hasBalance) {
        return response.error(res, 'Saldo insuficiente', 400);
      }

      // Calcular taxa de saque
      const taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00');
      const valorLiquido = parseFloat(valor) - taxa;

      // Criar saque no banco
      const { data: saque, error: saqueError } = await supabase
        .from('saques')
        .insert({
          usuario_id: userId,
          valor: parseFloat(valor),
          amount: parseFloat(valor),
          pix_key: validation.data.pixKey,
          pix_type: validation.data.pixType,
          chave_pix: validation.data.pixKey,
          tipo_chave: validation.data.pixType,
          status: 'pendente',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saqueError) {
        console.error('❌ [WITHDRAW] Erro ao criar saque:', saqueError);
        return response.serverError(res, saqueError, 'Erro ao criar saque');
      }

      // Debitar saldo usando FinancialService (ACID)
      const deductResult = await FinancialService.deductBalance(
        userId,
        parseFloat(valor),
        'saque',
        `Saque PIX - ${validation.data.pixKey}`,
        { saque_id: saque.id }
      );

      if (!deductResult.success) {
        console.error('❌ [WITHDRAW] Erro ao debitar saldo:', deductResult.error);
        // Reverter saque criado
        await supabase.from('saques').delete().eq('id', saque.id);
        return response.serverError(res, deductResult.error, 'Erro ao processar saque');
      }

      console.log(`💰 [WITHDRAW] Saque solicitado: R$ ${valor} para usuário ${userId}`);

      return response.success(
        res,
        {
          id: saque.id,
          amount: valor,
          pix_key: validation.data.pixKey,
          pix_type: validation.data.pixType,
          status: 'pending',
          created_at: saque.created_at
        },
        'Saque solicitado com sucesso',
        201
      );

    } catch (error) {
      console.error('❌ [WITHDRAW] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }

  // Buscar histórico de saques
  static async getWithdrawHistory(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      const { data: saques, error: saquesError } = await supabase
        .from('saques')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (saquesError) {
        console.error('❌ [WITHDRAW] Erro ao buscar saques:', saquesError);
        return response.serverError(res, saquesError, 'Erro ao buscar histórico de saques');
      }

      return response.success(
        res,
        {
          saques: saques || [],
          total: saques?.length || 0
        },
        'Histórico de saques obtido com sucesso'
      );

    } catch (error) {
      console.error('❌ [WITHDRAW] Erro:', error);
      return response.serverError(res, error, 'Erro interno do servidor');
    }
  }
}

module.exports = WithdrawController;


