// Serviço de Pagamentos - Gol de Ouro Player
import api from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

class PaymentService {
  constructor() {
    this.paymentStatuses = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    };
  }

  // Criar pagamento PIX (depósito)
  async createPixPayment(amount, description = '') {
    try {
      const response = await api.post(API_ENDPOINTS.PIX_CREATE, {
        amount: parseFloat(amount),
        description: description || `Recarga de saldo - R$ ${amount.toFixed(2)}`
      });

      return { 
        success: true, 
        payment: response.data,
        qrCode: response.data.qrCode,
        pixCode: response.data.pixCode
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar pagamento PIX' 
      };
    }
  }

  // Verificar status do pagamento PIX
  async checkPixPaymentStatus(paymentId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.PIX_STATUS}/${paymentId}`);
      
      return { 
        success: true, 
        payment: response.data,
        status: response.data.status
      };
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao verificar status do pagamento' 
      };
    }
  }

  // Obter histórico de pagamentos do usuário
  async getUserPayments(page = 1, limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.PIX_USER, {
        params: { page, limit }
      });
      
      return { 
        success: true, 
        payments: response.data.payments,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erro ao obter pagamentos:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter pagamentos' 
      };
    }
  }

  // Criar solicitação de saque PIX
  async createWithdrawal(amount, pixKey, pixKeyType, description = '') {
    try {
      // Validar chave PIX
      const validationResult = this.validatePixKey(pixKey, pixKeyType);
      if (!validationResult.valid) {
        return { 
          success: false, 
          error: validationResult.error 
        };
      }

      const response = await api.post(`${API_ENDPOINTS.PIX_CREATE}/withdrawal`, {
        amount: parseFloat(amount),
        pixKey: pixKey,
        pixKeyType: pixKeyType,
        description: description || `Saque via PIX - R$ ${amount.toFixed(2)}`
      });

      return { 
        success: true, 
        withdrawal: response.data
      };
    } catch (error) {
      console.error('Erro ao criar saque:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar saque' 
      };
    }
  }

  // Obter histórico de saques
  async getWithdrawals(page = 1, limit = 10) {
    try {
      const response = await api.get(`${API_ENDPOINTS.PIX_USER}/withdrawals`, {
        params: { page, limit }
      });
      
      return { 
        success: true, 
        withdrawals: response.data.withdrawals,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erro ao obter saques:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter saques' 
      };
    }
  }

  // Validar chave PIX
  validatePixKey(pixKey, pixKeyType) {
    if (!pixKey || !pixKeyType) {
      return { valid: false, error: 'Chave PIX e tipo são obrigatórios' };
    }

    switch (pixKeyType) {
      case 'cpf':
        if (!/^\d{11}$/.test(pixKey.replace(/\D/g, ''))) {
          return { valid: false, error: 'CPF deve ter 11 dígitos' };
        }
        break;
      
      case 'cnpj':
        if (!/^\d{14}$/.test(pixKey.replace(/\D/g, ''))) {
          return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
        }
        break;
      
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
          return { valid: false, error: 'Email inválido' };
        }
        break;
      
      case 'phone':
        if (!/^\d{10,11}$/.test(pixKey.replace(/\D/g, ''))) {
          return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
        }
        break;
      
      case 'random':
        if (pixKey.length < 32) {
          return { valid: false, error: 'Chave aleatória deve ter pelo menos 32 caracteres' };
        }
        break;
      
      default:
        return { valid: false, error: 'Tipo de chave PIX inválido' };
    }

    return { valid: true };
  }

  // Obter saldo do usuário
  async getUserBalance() {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/balance`);
      
      return { 
        success: true, 
        balance: response.data.balance,
        availableBalance: response.data.availableBalance
      };
    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter saldo' 
      };
    }
  }

  // Verificar limites de transação
  async checkTransactionLimits(amount, type = 'deposit') {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/limits`, {
        params: { amount, type }
      });
      
      return { 
        success: true, 
        limits: response.data,
        canProcess: response.data.canProcess
      };
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao verificar limites' 
      };
    }
  }

  // Cancelar pagamento/saque
  async cancelTransaction(transactionId, type = 'payment') {
    try {
      const endpoint = type === 'withdrawal' 
        ? `${API_ENDPOINTS.PIX_CREATE}/withdrawal/${transactionId}/cancel`
        : `${API_ENDPOINTS.PIX_STATUS}/${transactionId}/cancel`;
      
      const response = await api.post(endpoint);
      
      return { 
        success: true, 
        transaction: response.data
      };
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao cancelar transação' 
      };
    }
  }

  // Obter estatísticas de pagamentos
  async getPaymentStats(period = '30d') {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/payment-stats`, {
        params: { period }
      });
      
      return { 
        success: true, 
        stats: response.data
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter estatísticas' 
      };
    }
  }

  // Formatar valor para exibição
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Formatar data para exibição
  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Obter status de pagamento em português
  getStatusLabel(status) {
    const statusLabels = {
      [this.paymentStatuses.PENDING]: 'Pendente',
      [this.paymentStatuses.PROCESSING]: 'Processando',
      [this.paymentStatuses.COMPLETED]: 'Concluído',
      [this.paymentStatuses.FAILED]: 'Falhou',
      [this.paymentStatuses.CANCELLED]: 'Cancelado'
    };
    
    return statusLabels[status] || 'Desconhecido';
  }

  // Obter cor do status
  getStatusColor(status) {
    const statusColors = {
      [this.paymentStatuses.PENDING]: 'text-yellow-500',
      [this.paymentStatuses.PROCESSING]: 'text-blue-500',
      [this.paymentStatuses.COMPLETED]: 'text-green-500',
      [this.paymentStatuses.FAILED]: 'text-red-500',
      [this.paymentStatuses.CANCELLED]: 'text-gray-500'
    };
    
    return statusColors[status] || 'text-gray-500';
  }
}

// Instância única do serviço
const paymentService = new PaymentService();

export default paymentService;
