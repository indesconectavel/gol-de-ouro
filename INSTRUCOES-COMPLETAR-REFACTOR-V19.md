# 📋 INSTRUÇÕES PARA COMPLETAR REFACTOR V19
## Data: 2025-01-24
## Status: Estrutura Básica Criada - Refactor Parcial Concluído

---

## ✅ O QUE JÁ FOI FEITO

1. **Estrutura de módulos criada** em `src/modules/`
2. **Código obsoleto movido** para `legacy/v19_removed/`
3. **Módulo GAME criado** com controller e routes
4. **Arquivos shared copiados** (utils, validators, middleware)
5. **Services principais copiados** (lote, financial, reward)

---

## 🔄 PRÓXIMAS AÇÕES NECESSÁRIAS

### 1. Mover Controllers Restantes

**Para `src/modules/admin/controllers/`:**
- `controllers/adminController.js` → `admin.controller.js`

**Para `src/modules/auth/controllers/`:**
- `controllers/authController.js` → `auth.controller.js`
- `controllers/usuarioController.js` → `usuario.controller.js`

**Para `src/modules/financial/controllers/`:**
- `controllers/paymentController.js` → `payment.controller.js`
- `controllers/withdrawController.js` → `withdraw.controller.js`

**Para `src/modules/monitor/controllers/`:**
- `controllers/systemController.js` → `system.controller.js`

### 2. Mover Routes Restantes

**Para `src/modules/admin/routes/`:**
- `routes/adminRoutes.js` → `admin.routes.js`

**Para `src/modules/auth/routes/`:**
- `routes/authRoutes.js` → `auth.routes.js`
- `routes/usuarioRoutes.js` → `usuario.routes.js`

**Para `src/modules/financial/routes/`:**
- `routes/paymentRoutes.js` → `payment.routes.js`
- `routes/withdrawRoutes.js` → `withdraw.routes.js`

**Para `src/modules/monitor/routes/`:**
- `routes/systemRoutes.js` → `system.routes.js`

**Para `src/modules/health/routes/`:**
- `routes/health.js` → `health.routes.js`

### 3. Mover Services Restantes

**Para `src/modules/financial/services/`:**
- `services/webhookService.js` → `webhook.service.js`
- `services/pix-service.js` → `pix.service.js`
- `services/pix-mercado-pago.js` → `pix-mercado-pago.service.js`

**Para `src/modules/auth/services/`:**
- `services/auth-service-unified.js` → `auth.service.js`

**Para `src/modules/shared/services/`:**
- `services/emailService.js` → `email.service.js`
- `services/cache-service.js` → `cache.service.js`
- `services/cdn-service.js` → `cdn.service.js`
- `services/history-service.js` → `history.service.js`
- `services/notification-service.js` → `notification.service.js`
- `services/ranking-service.js` → `ranking.service.js`
- `services/redisService.js` → `redis.service.js`

### 4. Atualizar Imports em Todos os Arquivos Movidos

**Padrão de imports:**
```javascript
// Database
const { supabase, supabaseAdmin } = require('../../../database/supabase-unified-config');

// Shared
const response = require('../../shared/utils/response-helper');
const { verifyToken } = require('../../shared/middleware/authMiddleware');

// Módulos
const LoteService = require('../../lotes/services/lote.service');
const FinancialService = require('../../financial/services/financial.service');
const RewardService = require('../../rewards/services/reward.service');
```

### 5. Atualizar server-fly.js

**Substituir imports antigos:**
```javascript
// ANTES
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const GameController = require('./controllers/gameController');
const LoteService = require('./services/loteService');

// DEPOIS
const authRoutes = require('./src/modules/auth/routes/auth.routes');
const gameRoutes = require('./src/modules/game/routes/game.routes');
const GameController = require('./src/modules/game/controllers/game.controller');
const LoteService = require('./src/modules/lotes/services/lote.service');
```

**Atualizar todas as referências:**
- Rotas: `/api/auth`, `/api/games`, `/api/user`, `/api/payments`, `/api/admin`, `/api/withdraw`
- Controllers: GameController, SystemController
- Services: LoteService, FinancialService, RewardService, WebhookService

### 6. Validar e Testar

1. **Executar validação de imports:**
```bash
node -e "require('./server-fly.js')"
```

2. **Testar servidor:**
```bash
npm run dev
```

3. **Verificar endpoints:**
- `GET /api/games/status`
- `POST /api/games/shoot`
- `GET /monitor`
- `GET /health`

### 7. Remover Arquivos Antigos (APÓS VALIDAÇÃO)

**Só remover após confirmar que tudo funciona:**
- `controllers/` (todos os arquivos)
- `routes/` (exceto os que ainda são usados)
- `services/` (exceto os que ainda são usados)
- `utils/` (exceto os que ainda são usados)
- `middlewares/` (exceto os que ainda são usados)

### 8. Criar Testes

**Criar testes em `src/tests/v19/`:**
- `test_game.spec.js`
- `test_financial.spec.js`
- `test_lotes.spec.js`
- `test_rewards.spec.js`
- `test_monitor.spec.js`

### 9. Criar Script de Validação

**Criar `src/scripts/validar_engine_v19_final.js`:**
- Validar RPCs
- Validar tabelas
- Validar policies
- Validar endpoints
- Validar imports

### 10. Documentação Final

**Criar:**
- `RELATORIO-REFACTOR-V19-FINAL.md`
- `DOCUMENTACAO-ENGINE-V19.md`
- `CHECKLIST-FINAL-PARA-PRODUCAO.md`

---

## 🛡️ REGRAS DE SEGURANÇA

1. **SEMPRE criar backup antes de mover arquivos**
2. **Testar após cada mudança**
3. **Não remover arquivos antigos até validar**
4. **Manter logs em `logs/refactor_v19/`**

---

## 📝 CHECKLIST DE CONCLUSÃO

- [ ] Todos os controllers movidos
- [ ] Todas as routes movidas
- [ ] Todos os services movidos
- [ ] Todos os imports atualizados
- [ ] server-fly.js atualizado
- [ ] Servidor testado e funcionando
- [ ] Endpoints validados
- [ ] Arquivos antigos removidos
- [ ] Testes criados
- [ ] Script de validação criado
- [ ] Documentação final gerada

---

**Última atualização:** 2025-01-24  
**Status:** ⚠️ Estrutura básica criada - Refactor parcial concluído

