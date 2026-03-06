/**
 * Serviço de saque - Gol de Ouro
 * Integra com POST /api/withdraw/request e GET /api/withdraw/history.
 * Não altera fluxo de depósito PIX (paymentService.createPix).
 */
import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

const STATUS_MAP = {
  pending: 'Pendente',
  processing: 'Pendente',
  completed: 'Processado',
  completed_ok: 'Processado',
  rejected: 'Cancelado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  failed: 'Cancelado',
};

function mapStatus(backendStatus) {
  if (!backendStatus) return 'Pendente';
  const s = String(backendStatus).toLowerCase();
  return STATUS_MAP[s] || (s.includes('pend') ? 'Pendente' : s.includes('process') ? 'Processado' : 'Pendente');
}

function formatDate(createdAt) {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? String(createdAt) : d.toLocaleString('pt-BR');
  } catch {
    return String(createdAt);
  }
}

/**
 * Solicitar saque PIX.
 * @param {number} amount - Valor em reais
 * @param {string} pixKey - Chave PIX (CPF, email, telefone, etc.)
 * @param {string} pixType - Tipo: cpf, email, phone, random
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function requestWithdraw(amount, pixKey, pixType) {
  try {
    const response = await apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, {
      valor: parseFloat(amount),
      chave_pix: String(pixKey).trim(),
      tipo_chave: pixType || 'cpf',
    });
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data };
    }
    return {
      success: false,
      error: response.data?.message || 'Erro ao solicitar saque',
    };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Erro ao solicitar saque';
    return { success: false, error: message };
  }
}

/**
 * Buscar histórico de saques do usuário.
 * Retorna lista no formato esperado pela tela Withdraw (amount, method, pixKey, date, status).
 * @returns {{ success: boolean, data?: array, error?: string }}
 */
export async function getWithdrawHistory() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.WITHDRAW_HISTORY);
    if (!response.data || !response.data.success) {
      return { success: false, error: response.data?.message || 'Erro ao carregar histórico', data: [] };
    }
    const raw = response.data.data?.saques || [];
    const list = raw.map((row) => ({
      id: row.id,
      amount: row.amount ?? row.valor ?? 0,
      method: 'PIX',
      pixKey: row.pix_key ?? row.chave_pix ?? '',
      date: formatDate(row.created_at),
      status: mapStatus(row.status),
    }));
    return { success: true, data: list };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Erro ao carregar histórico de saques';
    return { success: false, error: message, data: [] };
  }
}

export default { requestWithdraw, getWithdrawHistory };
