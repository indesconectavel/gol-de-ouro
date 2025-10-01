// Cliente API Centralizado - Gol de Ouro Player
import axios from 'axios';
import { validateEnvironment } from '../config/environments.js';

const env = validateEnvironment();

// Configuração do cliente Axios
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Incluir cookies nas requisições
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

