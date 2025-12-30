# 🎯 FASE 9: Plano de Refatoração Controlada do server-fly.js

**Data:** 2025-01-12  
**Status:** 📋 **PLANO CRIADO**

---

## 📊 Situação Atual

- **Arquivo:** `server-fly.js` - 2,631 linhas
- **Rotas inline:** 41 rotas
- **Arquivos de rotas existentes:** 5 arquivos (não usados)
- **Problema:** Rotas duplicadas e código não organizado

---

## 🎯 Objetivo

Refatorar `server-fly.js` de forma controlada, mantendo compatibilidade total e melhorando organização.

---

## 📋 Estratégia de Refatoração

### **Abordagem: Refatoração Incremental e Segura**

1. ✅ **Manter tudo funcionando** durante refatoração
2. ✅ **Adicionar rotas de arquivos** sem remover inline primeiro
3. ✅ **Testar cada mudança** antes de continuar
4. ✅ **Remover duplicações** gradualmente
5. ✅ **Manter compatibilidade** com código existente

---

## 📋 Mapeamento de Rotas

### **Rotas que JÁ EXISTEM em arquivos separados:**

#### **routes/authRoutes.js:**
- ✅ `POST /register` → `authController.register`
- ✅ `POST /login` → `authController.login`

#### **routes/gameRoutes.js:**
- ✅ `GET /status` → `gameController.getGameStatus`
- ✅ `POST /chutar` → `gameController.registerShot`
- ✅ `GET /stats` → `gameController.getGameStats`
- ✅ `GET /history` → `gameController.getShotHistory`

#### **routes/usuarioRoutes.js:**
- ✅ `GET /profile` → `usuarioController.getUserProfile`
- ✅ `PUT /profile` → `usuarioController.updateUserProfile`
- ✅ `GET /list` → `usuarioController.getUsersList`
- ✅ `GET /stats` → `usuarioController.getUserStats`
- ✅ `PUT /status/:id` → `usuarioController.toggleUserStatus`

#### **routes/paymentRoutes.js:**
- ✅ Todas as rotas de pagamento já mapeadas

#### **routes/adminRoutes.js:**
- ✅ Todas as rotas admin já mapeadas

---

### **Rotas que ESTÃO INLINE no server-fly.js:**

#### **Autenticação (duplicadas):**
- ❌ `POST /api/auth/forgot-password` - Inline
- ❌ `POST /api/auth/reset-password` - Inline
- ❌ `POST /api/auth/verify-email` - Inline
- ❌ `POST /api/auth/register` - Inline (duplicada)
- ❌ `POST /api/auth/login` - Inline (duplicada)
- ❌ `PUT /api/auth/change-password` - Inline
- ❌ `POST /auth/login` - Inline (legacy)

#### **Usuário (duplicadas):**
- ❌ `GET /api/user/profile` - Inline (duplicada)
- ❌ `PUT /api/user/profile` - Inline (duplicada)
- ❌ `GET /usuario/perfil` - Inline (legacy)

#### **Jogo:**
- ❌ `POST /api/games/shoot` - Inline (não está em gameRoutes)

#### **Pagamentos:**
- ❌ `POST /api/payments/pix/criar` - Inline (duplicada?)
- ❌ `GET /api/payments/pix/usuario` - Inline (duplicada?)
- ❌ `POST /api/payments/webhook` - Inline

#### **Saques:**
- ❌ `POST /api/withdraw/request` - Inline
- ❌ `GET /api/withdraw/history` - Inline

#### **Sistema:**
- ❌ `GET /robots.txt` - Inline
- ❌ `GET /` - Inline
- ❌ `GET /health` - Inline
- ❌ `GET /api/metrics` - Inline
- ❌ `GET /api/monitoring/metrics` - Inline
- ❌ `GET /api/monitoring/health` - Inline
- ❌ `GET /meta` - Inline
- ❌ `POST /api/admin/bootstrap` - Inline
- ❌ `GET /api/production-status` - Inline
- ❌ `GET /api/debug/token` - Inline
- ❌ `GET /api/fila/entrar` - Inline (legacy/compatibilidade)

---

## 🎯 Plano de Ação

### **Etapa 1: Adicionar Rotas de Arquivos ao server-fly.js**
- Adicionar `app.use('/api/auth', authRoutes)`
- Adicionar `app.use('/api/games', gameRoutes)`
- Adicionar `app.use('/api/user', usuarioRoutes)`
- Adicionar `app.use('/api/payments', paymentRoutes)`
- Adicionar `app.use('/api/admin', adminRoutes)`

### **Etapa 2: Expandir Arquivos de Rotas**
- Adicionar rotas faltantes em `authRoutes.js`
- Adicionar `/api/games/shoot` em `gameRoutes.js`
- Criar `routes/withdrawRoutes.js` para saques
- Criar `routes/systemRoutes.js` para rotas de sistema

### **Etapa 3: Remover Rotas Inline Duplicadas**
- Remover rotas duplicadas gradualmente
- Manter rotas legacy temporariamente (com comentário)
- Testar cada remoção

### **Etapa 4: Limpar server-fly.js**
- Manter apenas configuração e inicialização
- Remover lógica de negócio inline
- Reduzir para ~500-800 linhas

---

## ⚠️ Riscos e Mitigações

### **Risco 1: Quebra de Compatibilidade**
- **Mitigação:** Manter rotas legacy temporariamente
- **Mitigação:** Testar todas as rotas antes de remover

### **Risco 2: Rotas Duplicadas**
- **Mitigação:** Adicionar logs para identificar qual rota está sendo usada
- **Mitigação:** Remover gradualmente

### **Risco 3: Middlewares Não Aplicados**
- **Mitigação:** Verificar que middlewares são aplicados nas rotas
- **Mitigação:** Testar autenticação em todas as rotas

---

## ✅ Próximos Passos

1. Adicionar imports de rotas no server-fly.js
2. Expandir arquivos de rotas com rotas faltantes
3. Testar todas as rotas
4. Remover duplicações gradualmente
5. Limpar server-fly.js

---

**Status:** 📋 **PLANO CRIADO - PRONTO PARA EXECUÇÃO**


