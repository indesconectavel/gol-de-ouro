// Cliente API ULTRA DEFINITIVO - Gol de Ouro Player
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

// Interceptor para tratamento de erros ULTRA DEFINITIVO
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
    
    return Promise.reject(error);
  }
);

export default apiClient;