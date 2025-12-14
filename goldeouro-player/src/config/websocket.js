// Configuração WebSocket - Gol de Ouro Player
// ===================================================
// Data: 2025-12-01
// Status: CONFIGURAÇÃO CORRIGIDA PARA PRODUÇÃO

import { validateEnvironment } from './environments';

const env = validateEnvironment();

// URL base do WebSocket em produção
const getWebSocketURL = () => {
  // Usar variável de ambiente se disponível
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Detectar ambiente e usar URL apropriada
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'ws://localhost:8080';
  }
  
  // Produção: usar backend v2
  return 'wss://goldeouro-backend-v2.fly.dev';
};

// URL base do WebSocket
export const WS_BASE_URL = getWebSocketURL();

// Função para conectar ao WebSocket do jogo
export const connectGameWebSocket = (token) => {
  const wsUrl = `${WS_BASE_URL}`;
  const ws = new WebSocket(wsUrl);
  
  // Enviar token de autenticação após conexão
  ws.onopen = () => {
    if (token) {
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    }
  };
  
  return ws;
};

// Função para conectar ao WebSocket de chat
export const connectChatWebSocket = () => {
  return new WebSocket(`${WS_BASE_URL}/chat`);
};

// Função para conectar ao WebSocket de analytics
export const connectAnalyticsWebSocket = () => {
  return new WebSocket(`${WS_BASE_URL}/analytics`);
};

export default {
  WS_BASE_URL,
  connectGameWebSocket,
  connectChatWebSocket,
  connectAnalyticsWebSocket
};
