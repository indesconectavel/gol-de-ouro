// Cliente API ULTRA DEFINITIVO COM FALLBACK - Gol de Ouro Player
import axios from 'axios';
import { validateEnvironment } from '../config/environments.js';

const env = validateEnvironment();

// Configuração do cliente Axios ULTRA DEFINITIVA
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  withCredentials: false, // Desabilitar credentials para evitar CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debug
    console.log('🔍 API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros ULTRA DEFINITIVO COM FALLBACK
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
    
    // Se for erro de CORS ou Failed to fetch, tentar backend direto
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      console.log('🔄 Tentando backend direto devido a CORS...');
      
      try {
        const directConfig = { ...error.config };
        directConfig.baseURL = 'https://goldeouro-backend-v2.fly.dev/api';
        directConfig.withCredentials = false;
        
        const directResponse = await axios.request(directConfig);
        console.log('✅ Backend direto funcionou!');
        return directResponse;
      } catch (directError) {
        console.error('❌ Backend direto também falhou:', directError);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;