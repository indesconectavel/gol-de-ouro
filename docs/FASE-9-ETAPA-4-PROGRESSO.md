# 📋 FASE 9: Etapa 4 - Progresso da Limpeza

**Data:** 2025-01-12  
**Status:** 🔄 **EM ANDAMENTO**

---

## ✅ O Que Foi Feito

1. ✅ Backup criado (`server-fly.js.backup-YYYYMMDD-HHMMSS`)
2. ✅ Mapeamento completo de rotas inline (29 rotas identificadas)
3. ✅ Plano de remoção criado
4. ✅ Documentação criada

---

## 📊 Rotas Identificadas para Remoção

### **Total: 29 rotas inline**

- **Autenticação:** 2 rotas (já em authRoutes.js)
- **Usuário:** 2 rotas (já em usuarioRoutes.js)
- **Jogo:** 1 rota (já em gameRoutes.js)
- **Saques:** 2 rotas (já em withdrawRoutes.js)
- **Pagamentos:** 3 rotas (já em paymentRoutes.js)
- **Admin:** 13 rotas (já em adminRoutes.js)
- **Compatibilidade:** 4 rotas (legacy)
- **Debug:** 1 rota

---

## ⚠️ Próximos Passos

1. Remover todas as rotas inline duplicadas
2. Manter apenas:
   - Configuração do servidor
   - Middlewares globais
   - Registro de rotas organizadas
   - Inicialização
   - WebSocket
   - Funções auxiliares essenciais (getOrCreateLoteByValue, reconcilePendingPayments, saveGlobalCounter)

---

## 📝 Notas Importantes

- A função `getOrCreateLoteByValue` deve ser mantida (usada pelo endpoint `/api/games/shoot` que está em gameRoutes.js)
- A função `reconcilePendingPayments` deve ser mantida (reconciliação automática de PIX)
- A função `saveGlobalCounter` deve ser mantida (salva métricas globais)
- O middleware `authenticateToken` deve ser mantido (usado por várias rotas)
- O middleware `authAdmin` pode ser removido (já existe em authMiddleware.js)

---

**Status:** 🔄 **EM ANDAMENTO - PRONTO PARA REMOÇÃO**


