// Serviço de API DEFINITIVO - Gol de Ouro Player
import axios from 'axios';

// Configuração SIMPLES e DIRETA
const API_BASE_URL = 'https://goldeouro-backend-v2.fly.dev';

// Cliente Axios SEM fallbacks ou interceptors complexos
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Endpoints CORRETOS
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/user/profile`,
  HEALTH: `${API_BASE_URL}/api/health`,
  META: `${API_BASE_URL}/meta`
};

// Função de login SIMPLES
export const login = async (email, password) => {
  try {
    console.log('🔐 Tentando login com:', { email, url: `${API_BASE_URL}/api/auth/login` });
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });
    console.log('✅ Login bem-sucedido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

// Função de verificação de meta SIMPLES
export const checkMeta = async () => {
  try {
    console.log('🔍 Verificando meta:', `${API_BASE_URL}/meta`);
    const response = await apiClient.get('/meta');
    console.log('✅ Meta verificado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar meta:', error);
    throw error;
  }
};

export default apiClient;