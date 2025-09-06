// Configuração da API - Gol de Ouro Player
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com';

export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PROFILE: `${API_BASE_URL}/usuario/perfil`,
  
  // Pagamentos
  PIX_CREATE: `${API_BASE_URL}/api/payments/pix/criar`,
  PIX_STATUS: `${API_BASE_URL}/api/payments/pix/status`,
  PIX_USER: `${API_BASE_URL}/api/payments/pix/usuario`,
  
  // Jogos
  GAMES_QUEUE_ENTRAR: `${API_BASE_URL}/api/games/fila/entrar`,
  GAMES_STATUS: `${API_BASE_URL}/api/games/status`,
  GAMES_CHUTAR: `${API_BASE_URL}/api/games/chutar`,
  
  // Fila
  QUEUE: `${API_BASE_URL}/fila`,
  
  // Notificações
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_READ: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  
  // Analytics
  ANALYTICS_DASHBOARD: `${API_BASE_URL}/analytics/dashboard`,
  
  // Health
  HEALTH: `${API_BASE_URL}/health`
};

export default API_BASE_URL;