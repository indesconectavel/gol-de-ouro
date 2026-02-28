// Serviço de saques - endpoints reais do backend
// NÃO alterar paymentService.js; depósitos PIX permanecem em /api/payments/pix/*
import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Solicita saque PIX.
 * POST /api/withdraw/request
 * @param {{ valor: number, chave_pix: string, tipo_chave: string }} payload
 * @returns {{ success: boolean, data?: object, message?: string }}
 */
export async function requestWithdraw({ valor, chave_pix, tipo_chave }) {
  try {
    const response = await apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, {
      valor,
      chave_pix,
      tipo_chave
    });
    const body = response.data || {};
    return {
      success: body.success === true,
      data: body.data,
      message: body.message
    };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Erro ao processar saque';
    return {
      success: false,
      message
    };
  }
}

/**
 * Retorna histórico de saques do usuário.
 * GET /api/withdraw/history
 * @returns {Promise<Array>} Array de itens (data.data.saques com fallback seguro)
 */
export async function getWithdrawHistory() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.WITHDRAW_HISTORY);
    const data = response.data;
    if (!data || typeof data !== 'object') return [];
    const inner = data.data;
    if (!inner || typeof inner !== 'object') return [];
    const saques = inner.saques;
    return Array.isArray(saques) ? saques : [];
  } catch (err) {
    console.error('[withdrawService] Erro ao carregar histórico:', err);
    return [];
  }
}

const withdrawService = {
  requestWithdraw,
  getWithdrawHistory
};

export default withdrawService;
