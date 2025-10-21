// CONFIGURAÇÃO DA API CORRIGIDA - GOL DE OURO v1.2.0
// ===================================================
// Data: 21/10/2025
// Status: CONFIGURAÇÃO CORRIGIDA PARA PRODUÇÃO REAL
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: API endpoints corrigidos

// URL base do backend em produção
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend.fly.dev';

// Endpoints da API corrigidos
export const API_ENDPOINTS = {
  // Autenticação
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/user/profile`,
  
  // Pagamentos PIX
  PIX_CREATE: `${API_BASE_URL}/api/payments/pix/criar`,
  PIX_STATUS: `${API_BASE_URL}/api/payments/pix/status`,
  PIX_USER: `${API_BASE_URL}/api/payments/pix/usuario`,
  
  // Sistema de Jogo
  GAMES_SHOOT: `${API_BASE_URL}/api/games/shoot`,
  GAMES_METRICS: `${API_BASE_URL}/api/metrics`,
  
  // Sistema de Lotes (compatibilidade)
  GAMES_QUEUE_ENTRAR: `${API_BASE_URL}/api/games/join-lote`,
  GAMES_STATUS: `${API_BASE_URL}/api/games/status`,
  GAMES_CHUTAR: `${API_BASE_URL}/api/games/shoot`,
  
  // Saques
  WITHDRAW: `${API_BASE_URL}/api/withdraw`,
  
  // Health Check
  HEALTH: `${API_BASE_URL}/health`,
  
  // Meta (compatibilidade)
  META: `${API_BASE_URL}/meta`
};

// Configuração do cliente API
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Função para obter token de autenticação
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Função para configurar headers de autenticação
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Função para verificar se está autenticado
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Verificar se o token não expirou (básico)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
};

// Função para fazer logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.href = '/login';
};

// Função para obter dados do usuário
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

// Função para salvar dados do usuário
export const saveUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

// Configurações de ambiente
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  backendUrl: API_BASE_URL,
  version: '1.2.0'
};

// Validação de ambiente
export const validateEnvironment = () => {
  const env = {
    API_BASE_URL: API_BASE_URL,
    MODE: import.meta.env.MODE,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL
  };
  
  console.log('🌐 [API] Configuração de ambiente:', env);
  
  if (!API_BASE_URL) {
    console.error('❌ [API] URL do backend não configurada');
    throw new Error('URL do backend não configurada');
  }
  
  return env;
};

export default API_BASE_URL;

// =====================================================
// CONFIGURAÇÃO DA API CORRIGIDA v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
