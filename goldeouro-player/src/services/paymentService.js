// Serviço de pagamentos com configuração via variáveis de ambiente
import apiClient from './apiClient';
import { validateEnvironment } from '../config/environments';

const env = validateEnvironment();

class PaymentService {
  constructor() {
    this.isSandbox = env.USE_SANDBOX;
    this.isProduction = env.IS_PRODUCTION;
    this.baseUrl = env.API_BASE_URL;
    
    // Configurações específicas por ambiente
    this.config = this.getPaymentConfig();
  }

  getPaymentConfig() {
    if (this.isProduction) {
      // Configuração de produção - PIX Live
      return {
        pixProvider: 'live',
        pixEndpoint: '/api/payments/pix/criar',
        pixStatusEndpoint: '/api/payments/pix/status',
        pixUserEndpoint: '/api/payments/pix/usuario',
        pixKey: process.env.VITE_PIX_LIVE_KEY || '',
        pixSecret: process.env.VITE_PIX_LIVE_SECRET || '',
        pixWebhookUrl: process.env.VITE_PIX_LIVE_WEBHOOK || '',
        minAmount: 10.00,
        maxAmount: 1000.00,
        currency: 'BRL',
        timeout: 30000
      };
    } else if (this.isSandbox) {
      // Configuração de sandbox - PIX Sandbox
      return {
        pixProvider: 'sandbox',
        pixEndpoint: '/api/payments/pix/criar',
        pixStatusEndpoint: '/api/payments/pix/status',
        pixUserEndpoint: '/api/payments/pix/usuario',
        pixKey: process.env.VITE_PIX_SANDBOX_KEY || 'sandbox-key',
        pixSecret: process.env.VITE_PIX_SANDBOX_SECRET || 'sandbox-secret',
        pixWebhookUrl: process.env.VITE_PIX_SANDBOX_WEBHOOK || '',
        minAmount: 1.00,
        maxAmount: 100.00,
        currency: 'BRL',
        timeout: 15000
      };
    } else {
      // Configuração de desenvolvimento - Mock
      return {
        pixProvider: 'mock',
        pixEndpoint: '/api/payments/pix/criar',
        pixStatusEndpoint: '/api/payments/pix/status',
        pixUserEndpoint: '/api/payments/pix/usuario',
        pixKey: 'mock-key',
        pixSecret: 'mock-secret',
        pixWebhookUrl: '',
        minAmount: 0.50,
        maxAmount: 50.00,
        currency: 'BRL',
        timeout: 5000
      };
    }
  }

  // Criar PIX
  async createPix(amount, pixKey, description = 'Saque Gol de Ouro') {
    try {
      // Validações
      if (amount < this.config.minAmount) {
        throw new Error(`Valor mínimo é R$ ${this.config.minAmount.toFixed(2)}`);
      }
      
      if (amount > this.config.maxAmount) {
        throw new Error(`Valor máximo é R$ ${this.config.maxAmount.toFixed(2)}`);
      }

      // Validar chave PIX
      if (!this.validatePixKey(pixKey)) {
        throw new Error('Chave PIX inválida');
      }

      const payload = {
        amount: parseFloat(amount),
        pixKey: pixKey,
        description: description,
        environment: this.config.pixProvider,
        currency: this.config.currency,
        timeout: this.config.timeout
      };

      console.log(`[PaymentService] Criando PIX ${this.config.pixProvider}:`, payload);

      const response = await apiClient.post(this.config.pixEndpoint, payload, {
        timeout: this.config.timeout
      });

      return {
        success: true,
        data: response.data,
        environment: this.config.pixProvider
      };

    } catch (error) {
      console.error('[PaymentService] Erro ao criar PIX:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento',
        environment: this.config.pixProvider
      };
    }
  }

  // Verificar status do PIX
  async getPixStatus(transactionId) {
    try {
      const response = await apiClient.get(`${this.config.pixStatusEndpoint}/${transactionId}`, {
        timeout: this.config.timeout
      });

      return {
        success: true,
        data: response.data,
        environment: this.config.pixProvider
      };

    } catch (error) {
      console.error('[PaymentService] Erro ao verificar status PIX:', error);
      return {
        success: false,
        error: error.message || 'Erro ao verificar status',
        environment: this.config.pixProvider
      };
    }
  }

  // Listar PIX do usuário
  async getUserPix() {
    try {
      const response = await apiClient.get(this.config.pixUserEndpoint, {
        timeout: this.config.timeout
      });

      return {
        success: true,
        data: response.data,
        environment: this.config.pixProvider
      };

    } catch (error) {
      console.error('[PaymentService] Erro ao listar PIX do usuário:', error);
      return {
        success: false,
        error: error.message || 'Erro ao carregar histórico',
        environment: this.config.pixProvider
      };
    }
  }

  // Validar chave PIX
  validatePixKey(pixKey) {
    if (!pixKey || typeof pixKey !== 'string') {
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(pixKey)) {
      return true;
    }

    // Validar CPF (11 dígitos)
    const cpfRegex = /^\d{11}$/;
    if (cpfRegex.test(pixKey)) {
      return true;
    }

    // Validar CNPJ (14 dígitos)
    const cnpjRegex = /^\d{14}$/;
    if (cnpjRegex.test(pixKey)) {
      return true;
    }

    // Validar telefone (11 dígitos com DDD)
    const phoneRegex = /^\d{11}$/;
    if (phoneRegex.test(pixKey)) {
      return true;
    }

    // Validar chave aleatória (UUID ou similar)
    const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (randomKeyRegex.test(pixKey)) {
      return true;
    }

    return false;
  }

  // Obter configuração atual
  getConfig() {
    return {
      ...this.config,
      isSandbox: this.isSandbox,
      isProduction: this.isProduction,
      environment: env.IS_DEVELOPMENT ? 'development' : env.IS_STAGING ? 'staging' : 'production'
    };
  }

  // Verificar se está em modo sandbox
  isSandboxMode() {
    return this.isSandbox;
  }

  // Verificar se está em modo produção
  isProductionMode() {
    return this.isProduction;
  }
}

// Exportar instância única
const paymentService = new PaymentService();
export default paymentService;
