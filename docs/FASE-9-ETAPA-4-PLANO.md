# 📋 FASE 9: Etapa 4 - Plano de Limpeza do server-fly.js

**Data:** 2025-01-12  
**Status:** 📋 **PLANO CRIADO**

---

## 🎯 Objetivo

Limpar `server-fly.js` mantendo apenas:
- Configuração do servidor
- Middlewares globais
- Inicialização
- WebSocket
- Funções auxiliares essenciais

**Meta:** Reduzir de ~2,312 para ~500-800 linhas

---

## 📋 O Que Manter

### **1. Configuração e Imports**
- ✅ Imports de dependências
- ✅ Configuração do Express
- ✅ Configuração de middlewares globais
- ✅ Configuração do Supabase
- ✅ Configuração do Mercado Pago
- ✅ Imports de rotas organizadas

### **2. Middlewares Globais**
- ✅ CORS
- ✅ Helmet
- ✅ Compression
- ✅ Rate Limiting
- ✅ Body Parser
- ✅ Error Handling

### **3. Inicialização**
- ✅ Conexão com Supabase
- ✅ Teste do Mercado Pago
- ✅ Carregamento de métricas
- ✅ Inicialização do WebSocket
- ✅ Inicialização do servidor HTTP

### **4. WebSocket**
- ✅ Inicialização do WebSocketManager
- ✅ Integração com servidor HTTP

### **5. Funções Auxiliares Essenciais**
- ✅ `calculateInitialBalance` (se não estiver em outro lugar)
- ✅ `connectSupabase`
- ✅ `testMercadoPago`
- ✅ `startServer`

---

## ❌ O Que Remover

### **1. Rotas Inline Duplicadas**
- ❌ Rotas de autenticação (já em authRoutes.js)
- ❌ Rotas de usuário (já em usuarioRoutes.js)
- ❌ Rotas de saque (já em withdrawRoutes.js)
- ❌ Rotas de sistema (já em systemRoutes.js)

### **2. Lógica de Negócio**
- ❌ Lógica de lotes (deve estar em LoteService)
- ❌ Lógica de chutes (deve estar em GameController)
- ❌ Lógica de pagamentos (deve estar em PaymentController)
- ❌ Lógica de reconciliação (pode ser movida para service)

### **3. Funções Auxiliares Duplicadas**
- ❌ Funções que já estão em services/controllers
- ❌ Funções que podem ser movidas para utils

---

## 🚀 Estratégia

1. ✅ Criar backup do server-fly.js atual
2. ✅ Identificar todas as rotas inline restantes
3. ✅ Mover lógica de negócio para services/controllers
4. ✅ Remover rotas duplicadas
5. ✅ Manter apenas configuração e inicialização
6. ✅ Testar servidor após limpeza

---

## ⚠️ Riscos

- **Risco 1:** Quebrar funcionalidades existentes
- **Mitigação:** Testar cada remoção antes de continuar

- **Risco 2:** Remover código necessário
- **Mitigação:** Verificar se código está em services/controllers antes de remover

- **Risco 3:** Quebrar WebSocket
- **Mitigação:** Manter toda lógica de WebSocket intacta

---

**Status:** 📋 **PLANO CRIADO - PRONTO PARA EXECUÇÃO**


