// Configuração da API - Gol de Ouro Player
import { validateEnvironment } from './environments.js';

const env = validateEnvironment();
const API_BASE_URL = env.API_BASE_URL;

export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/user/profile`,
  
  // Pagamentos
  PIX_CREATE: `${API_BASE_URL}/api/payments/pix/criar`,
  PIX_STATUS: `${API_BASE_URL}/api/payments/pix/status`,
  PIX_USER: `${API_BASE_URL}/api/payments/pix/usuario`,
  
  // Jogos
  GAMES_QUEUE_ENTRAR: `${API_BASE_URL}/api/games/fila/entrar`,
  GAMES_STATUS: `${API_BASE_URL}/api/games/status`,
  GAMES_CHUTAR: `${API_BASE_URL}/api/games/chutar`,
  
  // Fila
  QUEUE: `${API_BASE_URL}/api/fila`,
  
  // Notificações
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  NOTIFICATIONS_READ: `${API_BASE_URL}/api/notifications`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
  
  // Analytics
  ANALYTICS_DASHBOARD: `${API_BASE_URL}/api/analytics/dashboard`,
  
  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
  
  // Meta
  META: `${API_BASE_URL}/meta`
};

export default API_BASE_URL;
