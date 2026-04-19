// Cliente API ULTRA DEFINITIVO COM FALLBACK E CACHE - Gol de Ouro Player
import axios from 'axios';
import { validateEnvironment } from '../config/environments.js';
import requestCache from '../utils/requestCache.js';

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

// Interceptor para autenticação e cache
apiClient.interceptors.request.use(
  (config) => {
    // Saneamento de URL: remover BOM e espaços e evitar URL absoluta duplicada
    if (typeof config.url === 'string') {
      // remover BOM (U+FEFF) no início, caso exista
      config.url = config.url.replace(/^\uFEFF/, '').trim();

      // Se por algum motivo vier uma URL absoluta do mesmo backend, tornar relativa
      const base = (env.API_BASE_URL || '').replace(/\/+$/, '');
      if (config.url.startsWith(base)) {
        config.url = config.url.slice(base.length);
      }

      // Garantir que comece com uma única barra quando for relativa
      if (!config.url.startsWith('http') && !config.url.startsWith('/')) {
        config.url = `/${config.url}`;
      }
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Verificar cache para requests GET
    if (config.method === 'get' && !config.skipCache) {
      const cachedData = requestCache.get(config.url, config.method, config.params);
      if (cachedData) {
        // Retornar dados do cache sem fazer request
        return Promise.reject({
          isCached: true,
          data: cachedData,
          config
        });
      }
    }
    
    // Log apenas em desenvolvimento ou para requests críticos - OTIMIZADO PARA PRODUÇÃO
    const isDevelopment = import.meta.env.DEV;
    const isCriticalRequest = config.url.includes('/auth/') || config.url.includes('/meta') || config.url.includes('/health');
    const isProduction = window.location.hostname.includes('goldeouro.lol');
    
    // Debug específico para PIX endpoint
    if (config.url.includes('/pix/')) {
      console.warn('🔍 [PIX DEBUG] URL detectada:', config.url);
      console.warn('🔍 [PIX DEBUG] BaseURL:', config.baseURL);
      console.warn('🔍 [PIX DEBUG] FullURL:', config.url.startsWith('http') ? config.url : `${config.baseURL}${config.url}`);
    }
    
    // CORREÇÃO CRÍTICA: Garantir que URLs PIX usem o endpoint correto - ULTRA ROBUSTA
    if (config.url === '/pix/usuario' || config.url.includes('/pix/usuario')) {
      console.warn('🔧 [PIX FIX] Corrigindo URL incorreta:', config.url, '-> /api/payments/pix/usuario');
      config.url = '/api/payments/pix/usuario';
      
      // CORREÇÃO ADICIONAL: Forçar atualização da URL completa
      if (config.url.startsWith('/')) {
        config.url = config.url.replace(/^\/+/, '/');
      }
    }
    
    if ((isDevelopment || isCriticalRequest) && !isProduction) {
      console.log('🔍 API Request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        fullURL: config.url.startsWith('http') ? config.url : `${config.baseURL}${config.url}`
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros ULTRA DEFINITIVO COM FALLBACK E CACHE
apiClient.interceptors.response.use(
  (response) => {
    // Armazenar no cache para requests GET bem-sucedidos
    if (response.config.method === 'get' && !response.config.skipCache) {
      const ttl = response.config.url.includes('/meta') ? 60000 : 30000; // 1 min para meta, 30s para outros
      requestCache.set(
        response.config.url,
        response.config.method,
        response.config.params,
        response.data,
        ttl
      );
    }
    
    // Log apenas em desenvolvimento ou para responses críticos - OTIMIZADO PARA PRODUÇÃO
    const isDevelopment = import.meta.env.DEV;
    const isCriticalResponse = response.config.url.includes('/auth/') || response.config.url.includes('/meta') || response.config.url.includes('/health');
    const isProduction = window.location.hostname.includes('goldeouro.lol');
    
    if ((isDevelopment || isCriticalResponse) && !isProduction) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Tratar dados do cache
    if (error.isCached) {
      console.log('📦 Retornando dados do cache para:', error.config.url);
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK',
        config: error.config
      });
    }
    
    // Sempre logar erros, mas com menos detalhes em produção
    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      console.error('❌ API Response Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        data: error.response?.data
      });
    } else {
      console.error('❌ API Error:', error.response?.status || error.message);
    }
    
    // Se for erro de CORS ou Failed to fetch, tentar backend direto
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (isDevelopment) {
        console.log('🔄 Tentando backend direto devido a CORS...');
      }
      
      try {
        const directConfig = { ...error.config };
        directConfig.baseURL = 'https://goldeouro-backend-v2.fly.dev';
        directConfig.withCredentials = false;
        
        const directResponse = await axios.request(directConfig);
        if (isDevelopment) {
          console.log('✅ Backend direto funcionou!');
        }
        return directResponse;
      } catch (directError) {
        if (isDevelopment) {
          console.error('❌ Backend direto também falhou:', directError);
        }
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Não redirecionar automaticamente - deixar o componente de login lidar com isso
      if (isDevelopment) {
        console.log('🔒 Token inválido ou expirado - usuário precisa fazer login novamente');
      }
    }
    
    return Promise.reject(error);
  }
);

// Utilitários de cache para uso pontual (ex.: rota /game)
apiClient.invalidateCache = (url, method = 'GET') => {
  return requestCache.invalidate(url, method);
};

apiClient.clearCache = () => {
  requestCache.clear();
};

export default apiClient;