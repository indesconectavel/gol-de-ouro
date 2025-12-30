// Configuração de Ambiente - Gol de Ouro Mobile v2.0.0
// PRODUÇÃO - URLs hardcoded para garantir ambiente correto

// URLs do backend hardcoded para produção
export const API_BASE_URL = "https://goldeouro-backend-v2.fly.dev";
export const WS_BASE_URL = "wss://goldeouro-backend-v2.fly.dev"; // WebSocket correspondente
export const API_TIMEOUT = 15000; // 15 segundos
export const ENV = "production"; // Ambiente de produção

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_TIMEOUT,
  ENV,
};

