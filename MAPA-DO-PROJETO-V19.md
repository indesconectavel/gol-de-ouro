# 🗺️ MAPA COMPLETO DO PROJETO - GOL DE OURO BACKEND V19
## Data: 2025-01-24
## Versão: V19.0.0 - Refactor Total

---

## 📋 ESTRUTURA ATUAL DO PROJETO

### 🏗️ Arquitetura Atual

```
goldeouro-backend/
├── server-fly.js              ✅ Servidor principal (Express)
├── package.json               ✅ Dependências
├── .env                       ✅ Variáveis de ambiente
│
├── controllers/               ⚠️ A REORGANIZAR
│   ├── adminController.js     → src/modules/admin/controllers/
│   ├── authController.js      → src/modules/auth/controllers/
│   ├── gameController.js     → src/modules/game/controllers/
│   ├── paymentController.js  → src/modules/financial/controllers/
│   ├── systemController.js   → src/modules/monitor/controllers/
│   ├── usuarioController.js  → src/modules/auth/controllers/
│   └── withdrawController.js → src/modules/financial/controllers/
│
├── routes/                    ⚠️ A REORGANIZAR
│   ├── adminRoutes.js        → src/modules/admin/routes/
│   ├── authRoutes.js         → src/modules/auth/routes/
│   ├── gameRoutes.js         → src/modules/game/routes/
│   ├── paymentRoutes.js      → src/modules/financial/routes/
│   ├── systemRoutes.js       → src/modules/monitor/routes/
│   ├── usuarioRoutes.js      → src/modules/auth/routes/
│   ├── withdrawRoutes.js     → src/modules/financial/routes/
│   ├── analyticsRoutes.js    ⚠️ DUPLICADO - MOVER PARA LEGACY
│   └── betRoutes.js          → src/modules/game/routes/
│
├── services/                  ⚠️ A REORGANIZAR
│   ├── loteService.js        → src/modules/lotes/services/
│   ├── financialService.js   → src/modules/financial/services/
│   ├── rewardService.js      → src/modules/rewards/services/
│   ├── webhookService.js     → src/modules/financial/services/
│   ├── auth-service-unified.js → src/modules/auth/services/
│   ├── emailService.js       → src/modules/shared/services/
│   ├── pix-service.js        → src/modules/financial/services/
│   ├── pix-mercado-pago.js   → src/modules/financial/services/
│   └── [outros serviços]     → src/modules/shared/services/
│
├── src/                       ✅ Estrutura V19 parcial
│   ├── modules/
│   │   ├── lotes/            ✅ Já existe
│   │   │   ├── lote.service.db.js
│   │   │   └── lote.adapter.js
│   │   ├── monitor/          ✅ Já existe
│   │   │   ├── monitor.controller.js
│   │   │   ├── monitor.routes.js
│   │   │   └── metrics.js
│   │   ├── game/             ⚠️ CRIAR
│   │   ├── admin/            ⚠️ CRIAR
│   │   ├── financial/        ⚠️ CRIAR
│   │   ├── rewards/          ⚠️ CRIAR
│   │   ├── health/           ⚠️ CRIAR
│   │   └── shared/           ⚠️ CRIAR
│   ├── scripts/              ✅ Scripts V19
│   ├── tests/                ✅ Testes V19
│   └── utils/                ⚠️ CONSOLIDAR
│
├── database/                 ✅ Schemas e configurações
│   ├── supabase-unified-config.js ✅ Configuração principal
│   └── schema-*.sql          ✅ Múltiplos schemas
│
├── utils/                     ⚠️ CONSOLIDAR
│   ├── pix-validator.js      → src/modules/shared/validators/
│   ├── lote-integrity-validator.js → src/modules/shared/validators/
│   ├── webhook-signature-validator.js → src/modules/shared/validators/
│   └── response-helper.js    → src/modules/shared/utils/
│
├── middleware/                ⚠️ CONSOLIDAR
│   └── cache-middleware.js   → src/modules/shared/middleware/
│
├── config/                    ✅ Configurações
│   ├── system-config.js
│   └── required-env.js
│
├── legacy/v19_removed/        ✅ CRIADO - Código obsoleto
│
└── logs/refactor_v19/         ✅ CRIADO - Logs do refactor
```

---

## 🎯 DOMÍNIOS IDENTIFICADOS

### 1. **GAME** (Jogo)
**Responsabilidade:** Lógica de jogo, chutes, lotes, estatísticas

**Arquivos:**
- `controllers/gameController.js`
- `routes/gameRoutes.js`
- `routes/betRoutes.js`
- `services/loteService.js` (parcialmente)
- `src/modules/lotes/` (já existe)

**Destino:** `src/modules/game/`

---

### 2. **ADMIN** (Administração)
**Responsabilidade:** Painel administrativo, gestão de usuários, configurações

**Arquivos:**
- `controllers/adminController.js`
- `routes/adminRoutes.js`

**Destino:** `src/modules/admin/`

---

### 3. **AUTH** (Autenticação)
**Responsabilidade:** Login, registro, autenticação, usuários

**Arquivos:**
- `controllers/authController.js`
- `controllers/usuarioController.js`
- `routes/authRoutes.js`
- `routes/usuarioRoutes.js`
- `services/auth-service-unified.js`

**Destino:** `src/modules/auth/`

---

### 4. **FINANCIAL** (Financeiro)
**Responsabilidade:** Pagamentos, saques, PIX, webhooks, transações

**Arquivos:**
- `controllers/paymentController.js`
- `controllers/withdrawController.js`
- `routes/paymentRoutes.js`
- `routes/withdrawRoutes.js`
- `services/financialService.js`
- `services/webhookService.js`
- `services/pix-service.js`
- `services/pix-mercado-pago.js`
- `utils/pix-validator.js`
- `utils/webhook-signature-validator.js`

**Destino:** `src/modules/financial/`

---

### 5. **REWARDS** (Recompensas)
**Responsabilidade:** Sistema de recompensas, prêmios

**Arquivos:**
- `services/rewardService.js`

**Destino:** `src/modules/rewards/`

---

### 6. **LOTES** (Lotes)
**Responsabilidade:** Gestão de lotes de apostas

**Arquivos:**
- `services/loteService.js` (parcialmente)
- `src/modules/lotes/` (já existe)
- `utils/lote-integrity-validator.js`

**Destino:** `src/modules/lotes/` (consolidar)

---

### 7. **MONITOR** (Monitoramento)
**Responsabilidade:** Monitoramento, métricas, heartbeat, health checks

**Arquivos:**
- `controllers/systemController.js`
- `routes/systemRoutes.js`
- `src/modules/monitor/` (já existe)
- `src/scripts/heartbeat_sender.js`

**Destino:** `src/modules/monitor/` (consolidar)

---

### 8. **HEALTH** (Saúde)
**Responsabilidade:** Health checks, status do sistema

**Arquivos:**
- `routes/health.js`

**Destino:** `src/modules/health/`

---

### 9. **SHARED** (Compartilhado)
**Responsabilidade:** Utilitários, middlewares, serviços compartilhados

**Arquivos:**
- `utils/response-helper.js`
- `middleware/cache-middleware.js`
- `services/emailService.js`
- `services/cache-service.js`
- `services/cdn-service.js`
- `services/history-service.js`
- `services/notification-service.js`
- `services/ranking-service.js`
- `services/redisService.js`

**Destino:** `src/modules/shared/`

---

## 🗑️ CÓDIGO OBSOLETO IDENTIFICADO

### Arquivos para Mover para `/legacy/v19_removed/`:

1. **Rotas Analytics Duplicadas:**
   - `routes/analyticsRoutes.js` (não usado no server-fly.js)
   - `routes/analyticsRoutes.js.backup`

2. **Rotas Não Usadas:**
   - `routes/blockchainRoutes.js` (verificar se usado)
   - `routes/gamification_integration.js` (verificar se usado)
   - `routes/monitoringDashboard.js` (verificar se usado)
   - `routes/publicDashboard.js` (verificar se usado)
   - `routes/test.js` (verificar se usado)

3. **Código Frontend no Backend:**
   - `src/App.jsx`
   - `src/main.js`
   - `src/components/` (todos)
   - `src/hooks/` (todos)
   - `src/ai/` (verificar se usado)

---

## 📊 ESTATÍSTICAS DO PROJETO

### Controllers: 7 arquivos
### Routes: 15+ arquivos
### Services: 15+ arquivos
### Utils: 7 arquivos
### Middlewares: 1 arquivo

---

## 🔄 PLANO DE REFACTOR

### FASE 1: Mapeamento ✅
- [x] Criar estrutura de pastas
- [x] Mapear todos os arquivos
- [x] Identificar código obsoleto

### FASE 2: Limpeza
- [ ] Mover código obsoleto para legacy/
- [ ] Remover duplicações
- [ ] Documentar remoções

### FASE 3: Reorganização
- [ ] Mover controllers para módulos
- [ ] Mover routes para módulos
- [ ] Mover services para módulos
- [ ] Consolidar utils e shared

### FASE 4: Atualização de Imports
- [ ] Atualizar imports em todos os arquivos
- [ ] Atualizar server-fly.js
- [ ] Validar imports

### FASE 5: Engine V19
- [ ] Corrigir heartbeat sender
- [ ] Atualizar monitor controller
- [ ] Validar RPCs
- [ ] Validar migration V19

### FASE 6: Testes
- [ ] Criar testes por domínio
- [ ] Validar testes

### FASE 7: Validação Final
- [ ] Executar script de validação
- [ ] Testar servidor
- [ ] Gerar relatório

---

**Mapa gerado em:** 2025-01-24  
**Status:** ✅ COMPLETO - Pronto para refactor
