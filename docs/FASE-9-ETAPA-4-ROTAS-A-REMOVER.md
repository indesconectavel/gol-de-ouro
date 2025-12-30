# 📋 FASE 9: Etapa 4 - Rotas Inline a Remover

**Data:** 2025-01-12  
**Status:** 📋 **MAPEAMENTO COMPLETO**

---

## 📋 Rotas Inline Identificadas (29 rotas)

### **Autenticação (2 rotas) - Já em authRoutes.js:**
1. ❌ `POST /api/auth/login` (linha ~542)
2. ❌ `PUT /api/auth/change-password` (linha ~1841)

### **Usuário (2 rotas) - Já em usuarioRoutes.js:**
3. ❌ `GET /api/user/profile` (linha ~648)
4. ❌ `PUT /api/user/profile` (linha ~698)

### **Jogo (1 rota) - Já em gameRoutes.js:**
5. ❌ `POST /api/games/shoot` (linha ~793)

### **Saques (2 rotas) - Já em withdrawRoutes.js:**
6. ❌ `POST /api/withdraw/request` (linha ~1096)
7. ❌ `GET /api/withdraw/history` (linha ~1206)

### **Pagamentos (3 rotas) - Já em paymentRoutes.js:**
8. ❌ `POST /api/payments/pix/criar` (linha ~1255)
9. ❌ `GET /api/payments/pix/usuario` (linha ~1412)
10. ❌ `POST /api/payments/webhook` (linha ~1510)

### **Admin (13 rotas) - Já em adminRoutes.js:**
11. ❌ `GET /api/admin/stats` (linha ~2040)
12. ❌ `GET /api/admin/game-stats` (linha ~2041)
13. ❌ `GET /api/admin/users` (linha ~2042)
14. ❌ `GET /api/admin/financial-report` (linha ~2043)
15. ❌ `GET /api/admin/top-players` (linha ~2044)
16. ❌ `GET /api/admin/recent-transactions` (linha ~2045)
17. ❌ `GET /api/admin/recent-shots` (linha ~2046)
18. ❌ `GET /api/admin/weekly-report` (linha ~2047)
19. ❌ `POST /api/admin/relatorio-semanal` (linha ~2050)
20. ❌ `POST /api/admin/estatisticas-gerais` (linha ~2051)
21. ❌ `POST /api/admin/top-jogadores` (linha ~2052)
22. ❌ `POST /api/admin/transacoes-recentes` (linha ~2053)
23. ❌ `POST /api/admin/chutes-recentes` (linha ~2054)
24. ❌ `GET /api/admin/lista-usuarios` (linha ~2055)

### **Compatibilidade/Legacy (4 rotas):**
25. ❌ `POST /auth/login` (linha ~1928) - Legacy
26. ❌ `GET /usuario/perfil` (linha ~2153) - Legacy
27. ❌ `GET /api/fila/entrar` (linha ~2214) - Legacy
28. ❌ `POST /api/admin/bootstrap` (linha ~2061) - Pode ser movido para adminRoutes

### **Debug (1 rota):**
29. ❌ `GET /api/debug/token` (linha ~2105) - Debug (pode ser removido ou movido)

---

## ⚠️ Rotas a Manter Temporariamente

### **Webhook:**
- ⚠️ `POST /api/payments/webhook` - Verificar se está em paymentRoutes.js

### **Bootstrap Admin:**
- ⚠️ `POST /api/admin/bootstrap` - Pode ser movido para adminRoutes.js

---

## 📊 Estatísticas

- **Total de rotas inline:** 29
- **Rotas duplicadas:** 25
- **Rotas legacy:** 3
- **Rotas debug:** 1

---

## 🚀 Estratégia de Remoção

1. ✅ Remover rotas de autenticação duplicadas
2. ✅ Remover rotas de usuário duplicadas
3. ✅ Remover rotas de jogo duplicadas
4. ✅ Remover rotas de saque duplicadas
5. ✅ Remover rotas de pagamento duplicadas
6. ✅ Remover rotas admin duplicadas
7. ⚠️ Avaliar rotas legacy (manter temporariamente ou remover)
8. ⚠️ Avaliar rota de debug (remover ou mover)

---

**Status:** 📋 **MAPEAMENTO COMPLETO - PRONTO PARA REMOÇÃO**


