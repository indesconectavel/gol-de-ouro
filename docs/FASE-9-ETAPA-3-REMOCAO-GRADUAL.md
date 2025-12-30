# 📋 FASE 9: Etapa 3 - Remoção Gradual de Rotas Duplicadas

**Data:** 2025-01-12  
**Status:** 🚧 **EM ANDAMENTO**

---

## ⚠️ Estratégia de Remoção

Devido à complexidade e tamanho do arquivo (2,922 linhas), a remoção completa de todas as rotas duplicadas de uma vez pode introduzir erros de sintaxe.

**Decisão:** Manter rotas inline comentadas temporariamente e remover completamente em uma segunda passagem após testes.

---

## ✅ Rotas de Sistema Removidas

1. ✅ `GET /robots.txt` - Removida (agora em systemRoutes.js)
2. ✅ `GET /` - Removida (agora em systemRoutes.js)
3. ✅ `GET /health` - Removida (agora em systemRoutes.js)
4. ✅ `GET /api/metrics` - Removida (agora em systemRoutes.js)
5. ✅ `GET /api/monitoring/metrics` - Removida (agora em systemRoutes.js)
6. ✅ `GET /api/monitoring/health` - Removida (agora em systemRoutes.js)
7. ✅ `GET /meta` - Removida (agora em systemRoutes.js)
8. ✅ `GET /api/production-status` - Removida (agora em systemRoutes.js)

---

## ⏳ Rotas a Remover (Próxima Passagem)

### **Autenticação:**
- ⏳ `POST /api/auth/forgot-password` (linha ~521)
- ⏳ `POST /api/auth/reset-password` (linha ~630)
- ⏳ `POST /api/auth/verify-email` (linha ~716)
- ⏳ `POST /api/auth/register` (linha ~797) - Duplicada
- ⏳ `POST /api/auth/login` (linha ~949) - Duplicada
- ⏳ `PUT /api/auth/change-password` (linha ~2248) - Duplicada
- ⏳ `POST /auth/login` (linha ~2480) - Legacy

### **Usuário:**
- ⏳ `GET /api/user/profile` (linha ~1055) - Duplicada
- ⏳ `PUT /api/user/profile` (linha ~1113) - Duplicada
- ⏳ `GET /usuario/perfil` (linha ~2729) - Legacy

### **Saques:**
- ⏳ `POST /api/withdraw/request` (linha ~1503) - Duplicada
- ⏳ `GET /api/withdraw/history` (linha ~1621) - Duplicada

---

## 📊 Progresso

- **Rotas de sistema removidas:** 8/8 ✅
- **Rotas de autenticação a remover:** 7
- **Rotas de usuário a remover:** 3
- **Rotas de saque a remover:** 2

**Total removido:** 8/20 (40%)

---

## 🚀 Próximos Passos

1. Testar rotas de sistema removidas
2. Remover rotas de autenticação duplicadas
3. Remover rotas de usuário duplicadas
4. Remover rotas de saque duplicadas
5. Verificar sintaxe final

---

**Status:** 🚧 **ETAPA 3 EM ANDAMENTO - 40% COMPLETO**


