// Sistema de configuração dinâmica para produção real
const systemConfig = {
  // Configurações de saldo inicial
  initialBalance: {
    regular: 0,      // Usuários regulares começam com R$ 0,00
    premium: 0,      // Usuários premium começam com R$ 0,00
    vip: 0,          // Usuários VIP começam com R$ 0,00
    admin: 0         // Admins começam com R$ 0,00
  },
  
  // Configurações de produção
  production: {
    allowSimulatedData: false,    // NUNCA permitir dados simulados
    requireRealDeposits: true,    // Obrigar depósitos reais
    enableMockMode: false,        // Desabilitar modo mock
    logAllOperations: true         // Logar todas as operações
  },
  
  // Configurações de validação
  validation: {
    minDepositAmount: 5.00,       // Depósito mínimo R$ 5,00
    maxDepositAmount: 1000.00,    // Depósito máximo R$ 1.000,00
    requireEmailVerification: true, // Obrigar verificação de email
    requirePhoneVerification: false // Não obrigar verificação de telefone
  },
  
  // Configurações de segurança
  security: {
    enableRateLimiting: true,     // Habilitar rate limiting
    enableCORS: true,             // Habilitar CORS
    enableHelmet: true,           // Habilitar Helmet
    enableCompression: true       // Habilitar compressão
  }
};

// Função para calcular saldo inicial baseado no tipo de usuário
function calculateInitialBalance(userType = 'regular') {
  const balance = systemConfig.initialBalance[userType] || systemConfig.initialBalance.regular;
  
  // Log da operação para auditoria
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CONFIG] Saldo inicial calculado para ${userType}: R$ ${balance}`);
  }
  
  return balance;
}

// Função para validar se dados são reais
function validateRealData(data) {
  if (data && typeof data === 'object') {
    // Verificar se há indicadores de dados simulados
    const simulatedIndicators = ['mock', 'fake', 'simulated', 'test', 'dummy'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    for (const indicator of simulatedIndicators) {
      if (dataString.includes(indicator)) {
        throw new Error(`Dados simulados detectados: ${indicator}`);
      }
    }
  }
  
  return true;
}

// Função para verificar se sistema está em modo produção real
function isProductionMode() {
  return systemConfig.production.allowSimulatedData === false &&
         systemConfig.production.requireRealDeposits === true &&
         systemConfig.production.enableMockMode === false;
}

// Função para obter configuração do sistema
function getSystemConfig() {
  return {
    ...systemConfig,
    isProductionMode: isProductionMode(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  systemConfig,
  calculateInitialBalance,
  validateRealData,
  isProductionMode,
  getSystemConfig
};
