// Configuração de Ambiente - Gol de Ouro Player
const config = {
  // URL do backend - prioriza variável de ambiente, senão usa localhost
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Configurações de desenvolvimento
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  
  // Timeout para requisições
  REQUEST_TIMEOUT: 15000,
  
  // Configurações de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

export default config;
