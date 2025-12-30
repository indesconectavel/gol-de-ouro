# 🛠️ RECOMENDAÇÕES TÉCNICAS - IMPLEMENTAÇÃO DE ADAPTADORES
## Gol de Ouro - Guia de Implementação Sem Alterar UI

**Data:** 18/12/2025  
**Auditor:** Fred S. Silva  
**Objetivo:** Implementar adaptadores para corrigir problemas funcionais SEM alterar UI

---

## 🎯 ESTRATÉGIA GERAL

### **Princípio Fundamental**

**NÃO ALTERAR UI** - Criar camada de adaptação que intercepte e normalize dados entre UI e Engine V19.

### **Arquitetura Proposta**

```
UI (Congelada)
    ↓
Adaptadores (Nova Camada)
    ↓
API Client (Existente)
    ↓
Engine V19 (Backend)
```

---

## 📁 ESTRUTURA DE PASTAS PROPOSTA

### **Player (`goldeouro-player/src/adapters/`)**

```
adapters/
├── authAdapter.js          # Autenticação e tokens
├── gameAdapter.js          # Jogo e lotes
├── paymentAdapter.js       # Pagamentos PIX
├── withdrawAdapter.js      # Saques
├── dataAdapter.js          # Normalização de dados
└── errorAdapter.js         # Tratamento de erros
```

### **Admin (`goldeouro-admin/src/adapters/`)**

```
adapters/
├── authAdapter.js          # Autenticação e tokens
├── dataAdapter.js          # Normalização de dados
└── errorAdapter.js         # Tratamento de erros
```

---

## 🔐 ADAPTADOR DE AUTENTICAÇÃO

### **Objetivo**
- Migrar token para SecureStore
- Implementar renovação automática
- Implementar refresh token

### **Implementação**

```javascript
// adapters/authAdapter.js

import * as SecureStore from 'expo-secure-store';

class AuthAdapter {
  // Armazenar token de forma segura
  async setToken(token) {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      // Fallback para localStorage apenas em desenvolvimento
      if (import.meta.env.DEV) {
        localStorage.setItem('authToken', token);
      }
    }
  }

  // Obter token de forma segura
  async getToken() {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      // Fallback para localStorage apenas em desenvolvimento
      if (import.meta.env.DEV) {
        return localStorage.getItem('authToken');
      }
      return null;
    }
  }

  // Renovar token automaticamente
  async refreshToken() {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return null;

      const response = await apiClient.post('/api/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });

      if (response.data.success) {
        await this.setToken(response.data.data.token);
        await SecureStore.setItemAsync('refreshToken', response.data.data.refreshToken);
        return response.data.data.token;
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return null;
    }
  }

  // Verificar e renovar token se necessário
  async ensureValidToken() {
    const token = await this.getToken();
    if (!token) return null;

    // Verificar se token está próximo de expirar (5 minutos antes)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
      // Renovar token
      return await this.refreshToken();
    }

    return token;
  }
}

export default new AuthAdapter();
```

### **Integração com API Client**

```javascript
// services/apiClient.js (MODIFICAR)

import authAdapter from '../adapters/authAdapter';

// Interceptor de requisição
apiClient.interceptors.request.use(
  async (config) => {
    // Garantir token válido antes de cada requisição
    const token = await authAdapter.ensureValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Tentar renovar token
      const newToken = await authAdapter.refreshToken();
      if (newToken) {
        // Retentar requisição original
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } else {
        // Logout
        await authAdapter.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🎮 ADAPTADOR DE JOGO

### **Objetivo**
- Validar saldo antes de chute
- Tratar lotes completos/encerrados
- Usar contador global do backend

### **Implementação**

```javascript
// adapters/gameAdapter.js

import apiClient from '../services/apiClient';
import authAdapter from './authAdapter';

class GameAdapter {
  // Validar saldo antes de permitir chute
  async validateShot(amount) {
    try {
      const token = await authAdapter.getToken();
      const response = await apiClient.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const saldo = response.data.data.saldo || 0;
      if (saldo < amount) {
        return {
          valid: false,
          error: 'Saldo insuficiente',
          saldo
        };
      }

      return {
        valid: true,
        saldo
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Erro ao validar saldo'
      };
    }
  }

  // Processar chute com tratamento de erros
  async processShot(direction, amount) {
    // Validar saldo primeiro
    const validation = await this.validateShot(amount);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        saldo: validation.saldo
      };
    }

    try {
      const response = await apiClient.post('/api/games/shoot', {
        direction,
        amount
      });

      if (response.data.success) {
        const data = response.data.data;

        // Tratar lote completo/encerrado
        if (data.isLoteComplete) {
          // Criar novo lote automaticamente (se necessário)
          console.log('Lote completo - novo lote será criado automaticamente');
        }

        // Retornar dados normalizados
        return {
          success: true,
          data: {
            result: data.result,
            premio: data.premio,
            premioGolDeOuro: data.premioGolDeOuro,
            loteProgress: data.loteProgress,
            isLoteComplete: data.isLoteComplete,
            novoSaldo: data.novoSaldo,
            contadorGlobal: data.contadorGlobal, // SEMPRE usar do backend
            isGolDeOuro: data.isGolDeOuro,
            shotsUntilGoldenGoal: 1000 - (data.contadorGlobal % 1000) // Calcular do backend
          }
        };
      } else {
        // Tratar erros específicos
        if (response.data.message.includes('Lote encerrado')) {
          // Criar novo lote e retentar
          return await this.processShot(direction, amount);
        }

        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      // Tratar erros de rede
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Backend offline. Tente novamente em alguns instantes.'
        };
      }

      return {
        success: false,
        error: error.message || 'Erro ao processar chute'
      };
    }
  }

  // Obter métricas globais (sempre do backend)
  async getGlobalMetrics() {
    try {
      const response = await apiClient.get('/api/metrics');
      if (response.data.success) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            contadorGlobal: data.contador_chutes_global,
            ultimoGolDeOuro: data.ultimo_gol_de_ouro,
            shotsUntilGoldenGoal: 1000 - (data.contador_chutes_global % 1000)
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao carregar métricas'
      };
    }
  }
}

export default new GameAdapter();
```

### **Integração com GameService**

```javascript
// services/gameService.js (MODIFICAR)

import gameAdapter from '../adapters/gameAdapter';

class GameService {
  // Usar adaptador para processar chute
  async processShot(direction, amount) {
    return await gameAdapter.processShot(direction, amount);
  }

  // Usar adaptador para métricas
  async loadGlobalMetrics() {
    const result = await gameAdapter.getGlobalMetrics();
    if (result.success) {
      this.globalCounter = result.data.contadorGlobal;
      this.lastGoldenGoal = result.data.ultimoGolDeOuro;
      return result.data;
    }
    throw new Error(result.error);
  }

  // NUNCA calcular localmente
  getShotsUntilGoldenGoal() {
    // SEMPRE usar valor do backend
    return 1000 - (this.globalCounter % 1000);
  }
}
```

---

## 💳 ADAPTADOR DE PAGAMENTOS

### **Objetivo**
- Implementar polling automático de status
- Tratar pagamentos expirados
- Atualizar saldo automaticamente

### **Implementação**

```javascript
// adapters/paymentAdapter.js

import apiClient from '../services/apiClient';

class PaymentAdapter {
  constructor() {
    this.pollingIntervals = new Map();
  }

  // Criar pagamento PIX
  async createPayment(amount, description) {
    try {
      const response = await apiClient.post('/api/payments/pix/criar', {
        amount,
        description
      });

      if (response.data.success) {
        const paymentId = response.data.data.paymentId;
        
        // Iniciar polling automático
        this.startPolling(paymentId);

        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao criar pagamento'
      };
    }
  }

  // Polling automático de status
  startPolling(paymentId, callback) {
    // Limpar polling anterior se existir
    if (this.pollingIntervals.has(paymentId)) {
      clearInterval(this.pollingIntervals.get(paymentId));
    }

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/payments/pix/status?paymentId=${paymentId}`);
        
        if (response.data.success) {
          const status = response.data.data.status;

          if (status === 'approved') {
            // Pagamento aprovado
            clearInterval(interval);
            this.pollingIntervals.delete(paymentId);
            
            if (callback) {
              callback({ status: 'approved', data: response.data.data });
            }

            // Atualizar saldo automaticamente
            await this.refreshBalance();
          } else if (status === 'expired') {
            // Pagamento expirado
            clearInterval(interval);
            this.pollingIntervals.delete(paymentId);
            
            if (callback) {
              callback({ status: 'expired' });
            }
          } else if (status === 'rejected') {
            // Pagamento rejeitado
            clearInterval(interval);
            this.pollingIntervals.delete(paymentId);
            
            if (callback) {
              callback({ status: 'rejected' });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao consultar status:', error);
      }
    }, 5000); // Polling a cada 5 segundos

    this.pollingIntervals.set(paymentId, interval);

    // Parar polling após 30 minutos (pagamento expira)
    setTimeout(() => {
      if (this.pollingIntervals.has(paymentId)) {
        clearInterval(this.pollingIntervals.get(paymentId));
        this.pollingIntervals.delete(paymentId);
        
        if (callback) {
          callback({ status: 'timeout' });
        }
      }
    }, 30 * 60 * 1000);
  }

  // Atualizar saldo após pagamento aprovado
  async refreshBalance() {
    try {
      const response = await apiClient.get('/api/user/profile');
      if (response.data.success) {
        // Disparar evento para atualizar UI
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: { saldo: response.data.data.saldo }
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
    }
  }

  // Parar polling
  stopPolling(paymentId) {
    if (this.pollingIntervals.has(paymentId)) {
      clearInterval(this.pollingIntervals.get(paymentId));
      this.pollingIntervals.delete(paymentId);
    }
  }
}

export default new PaymentAdapter();
```

### **Integração com PaymentService**

```javascript
// services/paymentService.js (MODIFICAR)

import paymentAdapter from '../adapters/paymentAdapter';

class PaymentService {
  async createPayment(amount, description) {
    return await paymentAdapter.createPayment(amount, description);
  }

  // Usar polling automático
  startStatusPolling(paymentId, callback) {
    paymentAdapter.startPolling(paymentId, callback);
  }
}
```

---

## 📊 ADAPTADOR DE DADOS

### **Objetivo**
- Normalizar dados antes de exibir
- Validar estrutura de resposta
- Tratar dados nulos/incompletos

### **Implementação**

```javascript
// adapters/dataAdapter.js

class DataAdapter {
  // Normalizar dados do perfil
  normalizeProfile(data) {
    if (!data || typeof data !== 'object') {
      return {
        id: null,
        email: '',
        nome: '',
        saldo: 0,
        tipo: 'jogador',
        total_apostas: 0,
        total_ganhos: 0,
        created_at: null
      };
    }

    return {
      id: data.id || null,
      email: data.email || '',
      nome: data.nome || data.username || '',
      saldo: Number(data.saldo) || 0,
      tipo: data.tipo || 'jogador',
      total_apostas: Number(data.total_apostas) || 0,
      total_ganhos: Number(data.total_ganhos) || 0,
      created_at: data.created_at || null
    };
  }

  // Normalizar resposta de chute
  normalizeShotResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida do backend');
    }

    return {
      result: data.result || 'miss',
      premio: Number(data.premio) || 0,
      premioGolDeOuro: Number(data.premioGolDeOuro) || 0,
      loteProgress: {
        current: Number(data.loteProgress?.current) || 0,
        total: Number(data.loteProgress?.total) || 0
      },
      isLoteComplete: Boolean(data.isLoteComplete),
      novoSaldo: Number(data.novoSaldo) || 0,
      contadorGlobal: Number(data.contadorGlobal) || 0,
      isGolDeOuro: Boolean(data.isGolDeOuro)
    };
  }

  // Validar estrutura de resposta
  validateResponse(response) {
    if (!response || typeof response !== 'object') {
      return {
        valid: false,
        error: 'Resposta inválida'
      };
    }

    if (response.success === undefined) {
      return {
        valid: false,
        error: 'Campo "success" ausente'
      };
    }

    if (response.success && !response.data) {
      return {
        valid: false,
        error: 'Campo "data" ausente em resposta de sucesso'
      };
    }

    return {
      valid: true
    };
  }
}

export default new DataAdapter();
```

---

## ⚠️ ADAPTADOR DE ERROS

### **Objetivo**
- Tratar erros de forma consistente
- Exibir mensagens claras
- Não usar fallbacks hardcoded

### **Implementação**

```javascript
// adapters/errorAdapter.js

class ErrorAdapter {
  // Tratar erro de forma consistente
  handleError(error, context = '') {
    console.error(`[${context}] Erro:`, error);

    // Não usar fallback hardcoded
    // Sempre retornar erro estruturado

    if (error.response) {
      // Erro do backend
      return {
        success: false,
        error: error.response.data?.message || 'Erro no servidor',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Erro de rede
      return {
        success: false,
        error: 'Erro de conexão. Verifique sua internet.',
        status: 0
      };
    } else {
      // Erro de configuração
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        status: 0
      };
    }
  }

  // Exibir mensagem de erro ao usuário
  showError(error, context = '') {
    const errorMessage = this.handleError(error, context);
    
    // Usar toast ou notificação
    // NUNCA usar fallback hardcoded
    if (window.toast) {
      window.toast.error(errorMessage.error);
    } else {
      console.error('Erro:', errorMessage.error);
    }

    return errorMessage;
  }
}

export default new ErrorAdapter();
```

---

## 🔄 INTEGRAÇÃO COM UI EXISTENTE

### **Princípio**
- Interceptar chamadas de API antes de chegar na UI
- Normalizar dados antes de passar para UI
- Manter UI inalterada

### **Exemplo: Dashboard**

```javascript
// pages/Dashboard.jsx (NÃO MODIFICAR)

// Usar adaptador através do serviço existente
const loadUserData = async () => {
  try {
    // API Client já usa adaptadores internamente
    const profileResponse = await apiClient.get(API_ENDPOINTS.PROFILE);
    
    // Dados já normalizados pelo adaptador
    if (profileResponse.data.success) {
      setUser(profileResponse.data.data);
      setBalance(profileResponse.data.data.saldo || 0);
    }
  } catch (error) {
    // Erro já tratado pelo adaptador
    // NÃO usar fallback hardcoded
    console.error('Erro ao carregar dados:', error);
    // Exibir mensagem de erro ao usuário
  }
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Adaptadores Base**
- [ ] Criar estrutura de pastas `adapters/`
- [ ] Implementar `authAdapter.js`
- [ ] Implementar `dataAdapter.js`
- [ ] Implementar `errorAdapter.js`

### **Fase 2: Adaptadores Específicos**
- [ ] Implementar `gameAdapter.js`
- [ ] Implementar `paymentAdapter.js`
- [ ] Implementar `withdrawAdapter.js`

### **Fase 3: Integração**
- [ ] Integrar adaptadores com `apiClient`
- [ ] Integrar adaptadores com serviços existentes
- [ ] Testar integração

### **Fase 4: Validação**
- [ ] Testar todos os fluxos críticos
- [ ] Validar tratamento de erros
- [ ] Validar normalização de dados

---

## 🎯 RESULTADO ESPERADO

Após implementação dos adaptadores:

1. ✅ Token migrado para SecureStore
2. ✅ Renovação automática de token funcionando
3. ✅ Validação de saldo antes de chute
4. ✅ Polling automático de status PIX
5. ✅ Tratamento de lotes completo/encerrado
6. ✅ Dados sempre normalizados
7. ✅ Erros tratados consistentemente
8. ✅ **UI permanece inalterada**

---

**RECOMENDAÇÕES TÉCNICAS COMPLETAS** ✅  
**IMPLEMENTAÇÃO SEM ALTERAR UI** ✅  
**CAMINHO CLARO DEFINIDO** ✅

