# 🌳 ÁRVORE DE ARQUIVOS V19 - Gol de Ouro Backend
## Estrutura Completa do Projeto

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Auditor:** AUDITOR SUPREMO V19

---

## 📁 ESTRUTURA PRINCIPAL

```
goldeouro-backend/
├── 📄 server-fly.js                    # Servidor principal (Fly.io)
├── 📄 package.json                     # Dependências e scripts
├── 📄 fly.toml                         # Configuração Fly.io
├── 📄 Dockerfile                        # Container Docker
├── 📄 env.example                      # Exemplo de variáveis de ambiente
│
├── 📁 src/                             # Código-fonte principal
│   ├── 📁 modules/                     # Módulos V19 (Arquitetura Modular)
│   │   ├── 📁 admin/
│   │   │   ├── 📁 controllers/
│   │   │   │   └── admin.controller.js
│   │   │   ├── 📁 routes/
│   │   │   │   └── admin.routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 auth/
│   │   │   ├── 📁 controllers/
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── usuario.controller.js
│   │   │   ├── 📁 routes/
│   │   │   │   ├── auth.routes.js
│   │   │   │   └── usuario.routes.js
│   │   │   ├── 📁 services/
│   │   │   │   └── auth.service.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 financial/                # ⚠️ CRÍTICO - Sistema Financeiro
│   │   │   ├── 📁 controllers/
│   │   │   │   ├── payment.controller.js
│   │   │   │   └── withdraw.controller.js
│   │   │   ├── 📁 routes/
│   │   │   │   ├── payment.routes.js
│   │   │   │   └── withdraw.routes.js
│   │   │   ├── 📁 services/
│   │   │   │   ├── financial.service.js      # ⚠️ ACID - RPCs financeiras
│   │   │   │   ├── pix-mercado-pago.service.js
│   │   │   │   ├── pix.service.js
│   │   │   │   └── webhook.service.js          # ⚠️ Idempotência webhook
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 game/                    # ⚠️ CRÍTICO - Sistema de Jogo
│   │   │   ├── 📁 controllers/
│   │   │   │   └── game.controller.js
│   │   │   ├── 📁 routes/
│   │   │   │   └── game.routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 health/
│   │   │   ├── 📁 routes/
│   │   │   │   └── health.routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 lotes/                    # ⚠️ CRÍTICO - Sistema de Lotes
│   │   │   ├── 📁 services/
│   │   │   │   ├── lote.service.js
│   │   │   │   └── lote.service.db.js
│   │   │   ├── lote.adapter.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 monitor/                 # ✅ V19 - Monitoramento
│   │   │   ├── 📁 controllers/
│   │   │   │   ├── system.controller.js
│   │   │   │   └── monitor.controller.js
│   │   │   ├── 📁 routes/
│   │   │   │   └── system.routes.js
│   │   │   ├── monitor.routes.js
│   │   │   ├── metrics.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 rewards/                 # ⚠️ CRÍTICO - Sistema de Recompensas
│   │   │   ├── 📁 services/
│   │   │   │   └── reward.service.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 shared/                  # Utilitários Compartilhados
│   │   │   ├── 📁 middleware/
│   │   │   │   ├── authMiddleware.js
│   │   │   │   └── response-handler.js
│   │   │   ├── 📁 services/
│   │   │   │   └── email.service.js
│   │   │   ├── 📁 utils/
│   │   │   │   └── response-helper.js
│   │   │   ├── 📁 validators/
│   │   │   │   ├── lote-integrity-validator.js  # ⚠️ Validação de lotes
│   │   │   │   ├── pix-validator.js
│   │   │   │   └── webhook-signature-validator.js
│   │   │   └── index.js
│   │   │
│   │   ├── 📁 chutes/                  # LEGACY
│   │   │   └── index.js
│   │   │
│   │   └── 📁 transactions/            # LEGACY
│   │       └── index.js
│   │
│   ├── 📁 scripts/                     # Scripts V19 (84 arquivos)
│   │   ├── 📁 validacao/
│   │   │   ├── validate_engine_v19_final.js
│   │   │   ├── validate_migration_v19.js
│   │   │   ├── validate_heartbeat_v19.js
│   │   │   ├── validate_rpc_functions_v19.js
│   │   │   └── ...
│   │   ├── 📁 migration/
│   │   │   ├── aplicar_migration_v19_supabase.js
│   │   │   ├── prechecks_v19.js
│   │   │   └── ...
│   │   ├── 📁 heartbeat/
│   │   │   ├── heartbeat_sender.js
│   │   │   └── ...
│   │   ├── 📁 testes/
│   │   │   ├── teste_completo_pix_e_10_chutes.js
│   │   │   └── ...
│   │   └── 📁 auditoria/
│   │       ├── auditoria_avancada_finalizacao_jogo.js
│   │       └── ...
│   │
│   ├── 📁 tests/                       # Testes automatizados
│   │   ├── 📁 v19/
│   │   │   ├── test_engine_v19.spec.js
│   │   │   ├── test_financial.spec.js
│   │   │   ├── test_lotes.spec.js
│   │   │   ├── test_migration.spec.js
│   │   │   └── test_monitoramento.spec.js
│   │   ├── smoke.test.js
│   │   ├── rls.policies.test.js
│   │   └── ...
│   │
│   ├── 📁 config/                      # Configurações
│   │   ├── api.js
│   │   ├── env.example.js
│   │   ├── environments.js
│   │   └── roles.sql
│   │
│   └── websocket.js                    # WebSocket Manager
│
├── 📁 database/                        # Scripts SQL e Schemas
│   ├── 📄 MIGRATION-V19-PARA-SUPABASE.sql      # ⚠️ Migration V19 principal
│   ├── 📄 rpc-financial-acid.sql                # ⚠️ RPCs financeiras ACID
│   ├── 📄 schema-lotes-persistencia.sql         # ⚠️ Schema de lotes
│   ├── 📄 corrigir-constraint-status-transacoes.sql
│   ├── 📄 verificar-e-corrigir-transacoes-completo.sql
│   ├── 📄 aplicar-search-path-todas-rpcs-financeiras.sql
│   ├── 📄 corrigir-rpc-deduct-balance-uuid.sql
│   ├── 📄 limpar-lotes-ULTRA-SIMPLES.sql
│   └── ... (muitos outros scripts SQL)
│
├── 📁 controllers/                     # ⚠️ LEGACY - Não usado em V19
│   ├── adminController.js
│   ├── authController.js
│   ├── gameController.js
│   └── ...
│
├── 📁 config/                          # Configurações do sistema
│   ├── env.js
│   ├── production.js
│   ├── system-config.js
│   └── required-env.js
│
├── 📁 _archived_legacy_*/              # Arquivos arquivados (legacy)
│   ├── _archived_config_controllers/
│   ├── _archived_legacy_middlewares/
│   └── _archived_legacy_routes/
│
├── 📁 logs/                            # Logs do sistema
│   └── 📁 migration_v19/
│       └── RELATORIO-APLICACAO.md
│
└── 📁 docs/                            # Documentação
    └── (vários arquivos .md)
```

---

## 🔴 ARQUIVOS CRÍTICOS V19

### Servidor Principal
- **`server-fly.js`** - Servidor Express principal, configuração V19

### Services Core V19
- **`src/modules/financial/services/financial.service.js`** - Sistema financeiro ACID
- **`src/modules/financial/services/webhook.service.js`** - Webhook idempotente
- **`src/modules/lotes/services/lote.service.js`** - Gerenciamento de lotes
- **`src/modules/rewards/services/reward.service.js`** - Sistema de recompensas

### Validators
- **`src/modules/shared/validators/lote-integrity-validator.js`** - Validação de integridade

### Database
- **`MIGRATION-V19-PARA-SUPABASE.sql`** - Migration principal V19
- **`database/rpc-financial-acid.sql`** - RPCs financeiras (aplicar separadamente)
- **`database/schema-lotes-persistencia.sql`** - Schema de lotes

### Configuração
- **`env.example`** - Variáveis de ambiente (verificar V19)
- **`package.json`** - Dependências e scripts

---

## ⚠️ ARQUIVOS LEGACY (Não Usados em V19)

### Controllers Legacy
- `controllers/adminController.js`
- `controllers/authController.js`
- `controllers/gameController.js`
- `controllers/paymentController.js`
- `controllers/systemController.js`
- `controllers/usuarioController.js`
- `controllers/withdrawController.js`

**Status:** Não são usados na arquitetura modular V19. Os controllers estão em `src/modules/*/controllers/`.

### Módulos Legacy
- `src/modules/chutes/` - Vazio, apenas index.js
- `src/modules/transactions/` - Vazio, apenas index.js

---

## 📊 ESTATÍSTICAS

- **Total de Módulos:** 11
- **Módulos Ativos:** 8
- **Módulos Legacy:** 3
- **Controllers V19:** 7
- **Services V19:** 8
- **Routes V19:** 10
- **Validators:** 3
- **Scripts V19:** 84
- **Testes:** 9
- **RPC Functions:** 10

---

## 🔍 ARQUIVOS RECÉM-MODIFICADOS (Correções Recentes)

### 2025-12-10
- `src/modules/shared/validators/lote-integrity-validator.js` - Correção validação de direções
- `src/modules/financial/services/webhook.service.js` - Correção payment_id muito grande
- `database/verificar-e-corrigir-transacoes-completo.sql` - Adicionadas colunas faltantes
- `database/corrigir-constraint-status-transacoes.sql` - Corrigido constraint status

---

**Gerado em:** 2025-12-10  
**Versão:** V19.0.0

