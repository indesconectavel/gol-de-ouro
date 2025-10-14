// Configuração da API - Gol de Ouro Player
import { validateEnvironment } from './environments.js';

const env = validateEnvironment();
const API_BASE_URL = env.API_BASE_URL;

export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `/auth/login`,
  REGISTER: `/auth/register`,
  PROFILE: `/user/profile`,
  
  // Pagamentos
  PIX_CREATE: `/api/payments/pix/criar`,
  PIX_STATUS: `/api/payments/pix/status`,
  PIX_USER: `/api/payments/pix/usuario`,
  
  // Jogos
  GAMES_QUEUE_ENTRAR: `/api/games/fila/entrar`,
  GAMES_STATUS: `/api/games/status`,
  GAMES_CHUTAR: `/api/games/chutar`,
  
  // Fila
  QUEUE: `${API_BASE_URL}/fila`,
  
  // Notificações
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_READ: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  
  // Analytics
  ANALYTICS_DASHBOARD: `${API_BASE_URL}/analytics/dashboard`,
  
  // Health
  HEALTH: `${API_BASE_URL}/health`,
  
  // Meta
  META: `${API_BASE_URL.replace('/api', '')}/meta`
};

export default API_BASE_URL;