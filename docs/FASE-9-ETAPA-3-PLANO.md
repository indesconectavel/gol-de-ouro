# 📋 FASE 9: Etapa 3 - Plano de Remoção de Rotas Duplicadas

**Data:** 2025-01-12  
**Status:** 📋 **PLANO CRIADO**

---

## 🎯 Objetivo

Remover rotas inline duplicadas do `server-fly.js` gradualmente, mantendo compatibilidade total.

---

## 📋 Rotas a Remover (Duplicadas)

### **Autenticação (já em authRoutes.js):**
1. ❌ `POST /api/auth/forgot-password` (linha ~517)
2. ❌ `POST /api/auth/reset-password` (linha ~618)
3. ❌ `POST /api/auth/verify-email` (linha ~704)
4. ❌ `POST /api/auth/register` (linha ~764) - Duplicada
5. ❌ `POST /api/auth/login` (linha ~924) - Duplicada
6. ❌ `PUT /api/auth/change-password` (linha ~2414) - Duplicada
7. ❌ `POST /auth/login` (linha ~2480) - Legacy

### **Usuário (já em usuarioRoutes.js):**
1. ❌ `GET /api/user/profile` (linha ~1030) - Duplicada
2. ❌ `PUT /api/user/profile` (linha ~1080) - Duplicada
3. ❌ `GET /usuario/perfil` (linha ~2729) - Legacy

### **Saques (já em withdrawRoutes.js):**
1. ❌ `POST /api/withdraw/request` (linha ~1499) - Duplicada
2. ❌ `GET /api/withdraw/history` (linha ~1609) - Duplicada

### **Sistema (já em systemRoutes.js):**
1. ❌ `GET /robots.txt` (linha ~2140) - Duplicada
2. ❌ `GET /` (linha ~2145) - Duplicada
3. ❌ `GET /health` (linha ~2157) - Duplicada
4. ❌ `GET /api/metrics` (linha ~2188) - Duplicada
5. ❌ `GET /api/monitoring/metrics` (linha ~2321) - Duplicada
6. ❌ `GET /api/monitoring/health` (linha ~2354) - Duplicada
7. ❌ `GET /meta` (linha ~2364) - Duplicada
8. ❌ `GET /api/production-status` (linha ~2654) - Duplicada

---

## ⚠️ Rotas a Manter (Não Duplicadas)

### **Jogo:**
- ✅ `POST /api/games/shoot` - Mantida inline (complexa, requer refatoração)

### **Pagamentos:**
- ✅ `POST /api/payments/pix/criar` - Verificar se está em paymentRoutes
- ✅ `GET /api/payments/pix/usuario` - Verificar se está em paymentRoutes
- ✅ `POST /api/payments/webhook` - Verificar se está em paymentRoutes

### **Admin:**
- ✅ Rotas admin já estão em adminRoutes.js

### **Legacy/Compatibilidade:**
- ⚠️ `POST /api/admin/bootstrap` - Verificar se pode ser movido
- ⚠️ `GET /api/debug/token` - Verificar se pode ser movido
- ⚠️ `GET /api/fila/entrar` - Legacy/compatibilidade

---

## 🎯 Estratégia de Remoção

### **Fase 1: Rotas de Sistema (Mais Seguras)**
- Remover rotas de sistema primeiro (health, metrics, etc.)
- São rotas simples e menos críticas

### **Fase 2: Rotas de Autenticação**
- Remover rotas de autenticação duplicadas
- Manter rotas legacy temporariamente

### **Fase 3: Rotas de Usuário**
- Remover rotas de usuário duplicadas
- Manter rotas legacy temporariamente

### **Fase 4: Rotas de Saque**
- Remover rotas de saque duplicadas

---

## ⚠️ Riscos e Mitigações

### **Risco 1: Quebra de Compatibilidade**
- **Mitigação:** Testar cada remoção antes de continuar
- **Mitigação:** Manter rotas legacy temporariamente

### **Risco 2: Rotas Não Encontradas**
- **Mitigação:** Verificar que rotas de arquivos estão registradas corretamente
- **Mitigação:** Testar todas as rotas após remoção

### **Risco 3: Middlewares Não Aplicados**
- **Mitigação:** Verificar que middlewares são aplicados nas rotas de arquivos
- **Mitigação:** Testar autenticação em todas as rotas

---

## ✅ Próximos Passos

1. Remover rotas de sistema primeiro
2. Testar rotas de sistema
3. Remover rotas de autenticação
4. Testar rotas de autenticação
5. Continuar com outras rotas

---

**Status:** 📋 **PLANO CRIADO - PRONTO PARA EXECUÇÃO**


