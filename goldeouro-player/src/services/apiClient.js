// Cliente API ULTRA ROBUSTO - Gol de Ouro Player
import axios from 'axios';
import { validateEnvironment } from '../config/environments.js';

const env = validateEnvironment();

// Configuração do cliente Axios ULTRA ROBUSTA
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000, // Aumentar timeout
  withCredentials: true, // Incluir cookies nas requisições
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
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

// Interceptor para tratamento de erros ULTRA ROBUSTO
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    // Se for erro de CORS, tentar novamente sem credentials
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.log('🔄 Tentando sem credentials devido a CORS...');
      const retryConfig = { ...error.config };
      retryConfig.withCredentials = false;
      return apiClient.request(retryConfig);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;