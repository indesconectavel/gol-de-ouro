# 📋 RELATÓRIO ESTRUTURAL V19 PRE-ENGINE
## Auditoria Estrutural Completa do Projeto Gol de Ouro
## Data: 2025-12-05
## Versão: V19.0.0-PRE-ENGINE

---

## 1) 📦 ESTRUTURA ATUAL DE PASTAS DO PROJETO

### Estrutura Principal

```
goldeouro-backend/
├── src/
│   ├── ai/                    # Inteligência Artificial
│   │   ├── analytics-ai.js
│   │   ├── chatbot.js
│   │   └── sentiment-analysis.js
│   ├── components/            # Componentes React (frontend)
│   │   ├── AudioControls.jsx
│   │   ├── LazyComponent.jsx
│   │   ├── LoadingAnimations.jsx
│   │   ├── MemoizedComponents.jsx
│   │   ├── NotificationAnimations.jsx
│   │   ├── OfflineIndicator.jsx
│   │   ├── PageTransition.jsx
│   │   └── PWAInstallPrompt.jsx
│   ├── config/                # Configurações
│   │   ├── api.js
│   │   └── environments.js
│   ├── hooks/                 # React Hooks
│   │   ├── useLazyLoad.js
│   │   ├── usePerformance.js
│   │   ├── usePWA.js
│   │   └── useSound.js
│   ├── services/              # Serviços frontend
│   │   └── apiService.js
│   ├── utils/                 # Utilitários frontend
│   │   ├── analytics-optimized.js
│   │   ├── analytics.js
│   │   ├── logger.js
│   │   ├── metrics.js
│   │   ├── monitoramentoAvancado.js
│   │   ├── monitoring-optimized.js
│   │   └── monitoring.js
│   ├── App.jsx
│   ├── main.js
│   └── websocket.js
│
├── controllers/               # Controladores do backend
│   ├── adminController.js
│   ├── authController.js
│   ├── gameController.js     # ⭐ CRÍTICO: Lógica de jogo
│   ├── index.js
│   ├── paymentController.js
│   ├── systemController.js
│   ├── usuarioController.js
│   └── withdrawController.js
│
├── services/                  # Serviços de negócio
│   ├── auth-service-unified.js
│   ├── cache-service.js
│   ├── cdn-service.js
│   ├── emailService.js
│   ├── financialService.js   # ⭐ CRÍTICO: Operações financeiras ACID
│   ├── history-service.js
│   ├── index.js
│   ├── loteService.js        # ⭐ CRÍTICO: Gerenciamento de lotes
│   ├── notification-service.js
│   ├── pix-mercado-pago.js
│   ├── pix-service-real.js
│   ├── pix-service.js
│   ├── queueService.js        # ⚠️ OBSOLETO: Sistema de fila antigo
│   ├── ranking-service.js
│   ├── redisService.js
│   ├── rewardService.js      # ⭐ CRÍTICO: Sistema de recompensas
│   └── webhookService.js     # ⭐ CRÍTICO: Webhooks Mercado Pago
│
├── routes/                    # Rotas da API
│   ├── adminRoutes.js
│   ├── analyticsRoutes.js
│   ├── analyticsRoutes_fixed.js
│   ├── analyticsRoutes_optimized.js
│   ├── analyticsRoutes_v1.js
│   ├── authRoutes.js
│   ├── betRoutes.js
│   ├── blockchainRoutes.js
│   ├── filaRoutes.js          # ⚠️ OBSOLETO: Sistema de fila antigo
│   ├── gameRoutes.js          # ⭐ CRÍTICO: Rotas de jogo
│   ├── gamification_integration.js
│   ├── health.js
│   ├── index.js
│   ├── monitoringDashboard.js
│   ├── mpWebhook.js
│   ├── paymentRoutes.js       # ⭐ CRÍTICO: Rotas de pagamento
│   ├── publicDashboard.js
│   ├── systemRoutes.js
│   ├── test.js
│   ├── usuarioRoutes.js
│   └── withdrawRoutes.js
│
├── database/                  # Schemas e migrations SQL
│   ├── connection.js
│   ├── schema.sql             # Schema base
│   ├── schema-completo.sql
│   ├── schema-lotes-persistencia.sql  # ⭐ CRÍTICO: Schema de lotes
│   ├── schema-rewards.sql
│   ├── schema-ranking.sql
│   ├── schema-history.sql
│   ├── schema-notifications.sql
│   ├── schema-webhook-events.sql
│   ├── schema-queue-matches.sql  # ⚠️ OBSOLETO: Sistema de fila antigo
│   ├── rpc-financial-acid.sql    # ⭐ CRÍTICO: RPC functions financeiras
│   ├── supabase-config.js
│   ├── supabase-unified-config.js
│   └── [vários arquivos de correção SQL]
│
├── scripts/                   # Scripts de automação
│   ├── v16-*.js              # Scripts de auditoria V16
│   ├── v17-*.js              # Scripts de auditoria V17
│   ├── v18-*.js              # Scripts de auditoria V18
│   └── [centenas de scripts de teste/deploy/auditoria]
│
├── utils/                     # Utilitários backend
│   ├── aggressiveMemoryCleanup.js
│   ├── index.js
│   ├── lote-integrity-validator.js  # ⭐ CRÍTICO: Validador de integridade
│   ├── memoryOptimizer.js
│   ├── pix-validator.js
│   ├── response-helper.js
│   └── webhook-signature-validator.js
│
├── middlewares/               # Middlewares Express
│   ├── analyticsMiddleware.js
│   ├── auth.js
│   ├── authMiddleware.js      # ⭐ CRÍTICO: Autenticação JWT
│   ├── errorHandler.js
│   ├── index.js
│   ├── memoryCleanup.js
│   ├── rateLimit.js
│   ├── requestId.js
│   ├── response-handler.js
│   ├── secureHeaders.js
│   └── security-performance.js
│
├── prisma/                    # Prisma ORM (não utilizado ativamente)
│   └── schema.prisma          # ⚠️ VAZIO: Apenas datasource básico
│
├── server-fly.js              # ⭐ CRÍTICO: Servidor principal
├── package.json
└── [vários arquivos de documentação/configuração]
```

---

## 2) 🗂️ LISTAR TODAS AS TABELAS REAIS DO BANCO

### Tabelas Principais (Schema Base)

#### 1. `usuarios`
- **Colunas:**
  - `id` UUID PRIMARY KEY
  - `email` VARCHAR(255) UNIQUE NOT NULL
  - `nome` VARCHAR(255) NOT NULL
  - `senha_hash` VARCHAR(255) NOT NULL
  - `saldo` DECIMAL(10,2) DEFAULT 0.00
  - `tipo` VARCHAR(50) DEFAULT 'jogador' CHECK (tipo IN ('jogador', 'admin', 'moderador'))
  - `ativo` BOOLEAN DEFAULT true
  - `email_verificado` BOOLEAN DEFAULT false
  - `telefone` VARCHAR(20)
  - `data_nascimento` DATE
  - `avatar_url` VARCHAR(500)
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `last_login` TIMESTAMP WITH TIME ZONE
  - `total_apostas` DECIMAL(12,2) DEFAULT 0.00
  - `total_ganhos` DECIMAL(12,2) DEFAULT 0.00
  - `total_partidas` INTEGER DEFAULT 0
  - `total_gols` INTEGER DEFAULT 0
  - `ranking` INTEGER DEFAULT 0
- **Constraints:** PRIMARY KEY, UNIQUE(email), CHECK(tipo)
- **Relacionamentos:** Referenciado por `transacoes`, `chutes`, `pagamentos_pix`, `saques`, `partida_jogadores`
- **RLS:** ❌ NÃO HABILITADO (conforme auditoria V18)
- **Índices:** `idx_usuarios_email` (existe), `idx_usuarios_ativo`, `idx_usuarios_ranking`
- **Triggers:** `update_usuarios_updated_at` (atualiza `updated_at`)

#### 2. `chutes`
- **Colunas:**
  - `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  - `usuario_id` UUID NOT NULL REFERENCES usuarios(id)
  - `lote_id` VARCHAR(100) NOT NULL  # ⭐ CRÍTICO: Referência ao lote
  - `direcao` VARCHAR(20) NOT NULL CHECK (direcao IN ('TL', 'TR', 'C', 'BL', 'BR'))
  - `valor_aposta` DECIMAL(10,2) NOT NULL
  - `resultado` VARCHAR(20) CHECK (resultado IN ('goal', 'miss'))
  - `premio` DECIMAL(10,2) DEFAULT 0.00
  - `premio_gol_de_ouro` DECIMAL(10,2) DEFAULT 0.00
  - `is_gol_de_ouro` BOOLEAN DEFAULT false
  - `contador_global` INTEGER
  - `shot_index` INTEGER
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- **Constraints:** PRIMARY KEY, FOREIGN KEY(usuario_id), FOREIGN KEY(lote_id), CHECK(direcao), CHECK(resultado)
- **Relacionamentos:** `usuarios`, `lotes`
- **RLS:** ❌ NÃO HABILITADO
- **Índices:** `idx_chutes_usuario_id` (❌ FALTANDO), `idx_chutes_lote_id` (❌ FALTANDO), `idx_chutes_created_at` (❌ FALTANDO)
- **Triggers:** Nenhum

#### 3. `lotes` ⭐ CRÍTICO
- **Colunas:**
  - `id` VARCHAR(100) PRIMARY KEY
  - `valor_aposta` DECIMAL(10,2) NOT NULL
  - `tamanho` INTEGER NOT NULL
  - `posicao_atual` INTEGER DEFAULT 0
  - `indice_vencedor` INTEGER NOT NULL  # ⭐ CRÍTICO: Índice do ganhador
  - `status` VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'pausado', 'completed'))
  - `total_arrecadado` DECIMAL(10,2) DEFAULT 0.00
  - `premio_total` DECIMAL(10,2) DEFAULT 0.00
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `completed_at` TIMESTAMP WITH TIME ZONE
- **Constraints:** PRIMARY KEY, CHECK(status)
- **Relacionamentos:** Referenciado por `chutes`
- **RLS:** ❌ NÃO HABILITADO
- **Índices:** `idx_lotes_status` (✅ EXISTE), `idx_lotes_valor_aposta` (✅ EXISTE), `idx_lotes_created_at` (✅ EXISTE)
- **Triggers:** Nenhum

#### 4. `transacoes`
- **Colunas:**
  - `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  - `usuario_id` UUID NOT NULL REFERENCES usuarios(id)
  - `tipo` VARCHAR(50) NOT NULL CHECK (tipo IN ('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback', 'credito'))
  - `valor` DECIMAL(12,2) NOT NULL
  - `saldo_anterior` DECIMAL(12,2) NOT NULL
  - `saldo_posterior` DECIMAL(12,2) NOT NULL
  - `descricao` TEXT
  - `referencia` VARCHAR(255)
  - `referencia_id` VARCHAR(255)
  - `referencia_tipo` VARCHAR(50)
  - `status` VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluida', 'cancelada', 'falhou'))
  - `metadata` JSONB
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `processed_at` TIMESTAMP WITH TIME ZONE
- **Constraints:** PRIMARY KEY, FOREIGN KEY(usuario_id), CHECK(tipo), CHECK(status)
- **Relacionamentos:** `usuarios`
- **RLS:** ❌ NÃO HABILITADO
- **Índices:** `idx_transacoes_usuario_id` (❌ FALTANDO), `idx_transacoes_created_at` (❌ FALTANDO)
- **Triggers:** Nenhum

#### 5. `pagamentos_pix`
- **Colunas:**
  - `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  - `usuario_id` UUID NOT NULL REFERENCES usuarios(id)
  - `transacao_id` UUID REFERENCES transacoes(id)
  - `payment_id` VARCHAR(255) UNIQUE NOT NULL
  - `status` VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
  - `valor` DECIMAL(10,2) NOT NULL
  - `qr_code` TEXT
  - `qr_code_base64` TEXT
  - `pix_copy_paste` TEXT
  - `expires_at` TIMESTAMP WITH TIME ZONE
  - `approved_at` TIMESTAMP WITH TIME ZONE
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- **Constraints:** PRIMARY KEY, FOREIGN KEY(usuario_id), FOREIGN KEY(transacao_id), UNIQUE(payment_id), CHECK(status)
- **Relacionamentos:** `usuarios`, `transacoes`
- **RLS:** ❌ NÃO HABILITADO
- **Índices:** `idx_pagamentos_pix_usuario` (existe), `idx_pagamentos_pix_status` (existe)
- **Triggers:** `update_pagamentos_pix_updated_at`

#### 6. `saques`
- **Colunas:**
  - `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  - `usuario_id` UUID NOT NULL REFERENCES usuarios(id)
  - `transacao_id` UUID REFERENCES transacoes(id)
  - `valor` DECIMAL(10,2) NOT NULL
  - `chave_pix` VARCHAR(255) NOT NULL
  - `tipo_chave` VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria'))
  - `status` VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado', 'cancelado'))
  - `motivo_rejeicao` TEXT
  - `processed_at` TIMESTAMP WITH TIME ZONE
  - `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  - `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- **Constraints:** PRIMARY KEY, FOREIGN KEY(usuario_id), FOREIGN KEY(transacao_id), CHECK(tipo_chave), CHECK(status)
- **Relacionamentos:** `usuarios`, `transacoes`
- **RLS:** ❌ NÃO HABILITADO
- **Índices:** `idx_saques_usuario` (existe), `idx_saques_status` (existe)
- **Triggers:** Nenhum

### Tabelas Secundárias (Sistema Antigo - ⚠️ OBSOLETAS)

#### 7. `partidas` ⚠️ OBSOLETO
- **Status:** Tabela existe mas não é utilizada pelo sistema atual de lotes
- **Uso:** Sistema antigo de partidas (substituído por lotes)

#### 8. `partida_jogadores` ⚠️ OBSOLETO
- **Status:** Tabela existe mas não é utilizada

#### 9. `fila_jogadores` ⚠️ OBSOLETO
- **Status:** Tabela existe mas não é utilizada pelo sistema atual

### Tabelas Adicionais (Schemas Extras)

#### 10. `conquistas`
- **Status:** Tabela existe mas uso limitado

#### 11. `usuario_conquistas`
- **Status:** Tabela existe mas uso limitado

#### 12. `ranking`
- **Status:** Tabela existe mas uso limitado

#### 13. `configuracoes`
- **Status:** Tabela existe mas uso limitado

#### 14. `logs_sistema`
- **Status:** Tabela existe mas uso limitado

#### 15. `sessoes`
- **Status:** Tabela existe mas uso limitado

#### 16. `notificacoes`
- **Status:** Tabela existe mas uso limitado

#### 17. `webhook_events` ⭐ CRÍTICO
- **Status:** Tabela para idempotência de webhooks Mercado Pago
- **RLS:** Habilitado (conforme schema-webhook-events.sql)

#### 18. `rewards` ⭐ CRÍTICO
- **Status:** Tabela para sistema de recompensas
- **RLS:** Habilitado (conforme schema-rewards.sql)

---

## 3) 🔍 MAPEAR TODA A LÓGICA DO JOGO ENCONTRADA

### ✅ Sistema de Lotes (LOTE_MODERNO) - ATIVO

**Existe "lotes"?** ✅ SIM
- Tabela `lotes` existe e está ativa
- Armazenamento: Banco de dados + memória (`lotesAtivos` Map em `server-fly.js:445`)

**Existe "lote_participantes"?** ❌ NÃO
- Não existe tabela separada
- Participantes são rastreados via `chutes.lote_id`

**Como funciona:**
1. Lote criado via `getOrCreateLoteByValue(amount)` em `server-fly.js:459`
2. Persistido no banco via `LoteService.getOrCreateLote()`
3. Armazenado em memória em `lotesAtivos` Map
4. Sincronização ao iniciar via `syncLotesFromDatabase()` em `server-fly.js:172`

### ❌ Sistema de Partidas (FILA_ANTIGA) - OBSOLETO

**Existe "partidas"?** ⚠️ SIM (tabela existe) mas ❌ NÃO UTILIZADO
- Tabela `partidas` existe mas não é usada pelo sistema atual
- Sistema antigo substituído por lotes

**Existe "fila"?** ⚠️ SIM (tabela existe) mas ❌ NÃO UTILIZADO
- Tabela `fila_jogadores` existe mas não é usada
- `routes/filaRoutes.js` existe mas não está registrado no servidor principal

### ✅ Sistema de Vencedor (winnerIndex) - ATIVO

**Existe winnerIndex?** ✅ SIM
- Campo `lotes.indice_vencedor` INTEGER NOT NULL
- Gerado aleatoriamente: `crypto.randomInt(0, config.size)` em `server-fly.js:482`
- Determinado na criação do lote

**Existe escolha aleatória do vencedor?** ✅ SIM
- `winnerIndex` é gerado aleatoriamente na criação do lote
- Comparação: `shotIndex === lote.winnerIndex` determina gol

### ⚠️ Lógica em Memória - PARCIALMENTE ATIVA

**Existe lógica em memória?** ✅ SIM
- `lotesAtivos` Map em `server-fly.js:445`
- `contadorChutesGlobal` variável global em `server-fly.js:447`
- `ultimoGolDeOuro` variável global em `server-fly.js:448`

**Riscos:**
- Perda de dados em reinicialização (mitigado com sincronização)
- Divergência entre memória e banco

### ✅ Persistência Completa no DB - PARCIALMENTE IMPLEMENTADA

**Existe persistência completa?** ⚠️ PARCIAL
- Lotes são persistidos no banco ✅
- Chutes são persistidos no banco ✅
- Transações são persistidas no banco ✅
- **MAS:** Estado em memória pode divergir do banco ⚠️

### ✅ Engine de Chute - ATIVA

**Existe engine de chute?** ✅ SIM
- `GameController.shoot()` em `controllers/gameController.js:215`
- Lógica: `shotIndex === lote.winnerIndex` → gol
- Direções: `TL`, `TR`, `C`, `BL`, `BR`

**Fluxo:**
1. Validar entrada (direção, valor)
2. Verificar saldo
3. Obter/criar lote
4. Validar integridade (`LoteIntegrityValidator`)
5. Calcular resultado (`shotIndex === winnerIndex`)
6. Salvar chute no banco
7. Atualizar lote no banco
8. Creditar prêmio (se gol)
9. Debitar aposta

### ✅ Engine de Premiação - ATIVA

**Existe engine de premiação?** ✅ SIM
- `FinancialService.addBalance()` em `services/financialService.js:26`
- Prêmio normal: R$ 5,00 fixo
- Gol de Ouro: R$ 100,00 adicional (a cada 1000 chutes)

**Fluxo:**
1. Gol detectado → `isGoal = true`
2. Prêmio calculado → `premio + premioGolDeOuro`
3. RPC chamado → `rpc_add_balance()` (ACID)
4. Transação registrada → Tabela `transacoes`
5. Saldo atualizado → Tabela `usuarios`

### ✅ Engine de Progressão - ATIVA

**Existe engine de progressão?** ✅ SIM
- `contadorChutesGlobal` incrementado a cada chute
- Gol de Ouro: `contadorChutesGlobal % 1000 === 0`
- Persistido no banco via `saveGlobalCounter()` em `server-fly.js:593`

---

## 4) 🧩 LISTAR TODAS AS ROTAS EXISTENTES NO BACKEND

### Rotas de Autenticação (`/api/auth`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| POST | `/register` | `authController` | `register` | `auth-service-unified` | Validação express-validator |
| POST | `/login` | `authController` | `login` | `auth-service-unified` | Validação express-validator |
| POST | `/forgot-password` | `authController` | `forgotPassword` | `emailService` | Validação express-validator |
| POST | `/reset-password` | `authController` | `resetPassword` | `auth-service-unified` | Validação express-validator |
| POST | `/verify-email` | `authController` | `verifyEmail` | `auth-service-unified` | Validação express-validator |
| PUT | `/change-password` | `authController` | `changePassword` | `auth-service-unified` | `verifyToken` |

### Rotas de Jogo (`/api/games`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| GET | `/status` | `GameController` | `getGameStatus` | Nenhum | Nenhum |
| POST | `/chutar` | `GameController` | `registerShot` | Nenhum | Nenhum |
| GET | `/stats` | `GameController` | `getGameStats` | Nenhum | Nenhum |
| GET | `/history` | `GameController` | `getShotHistory` | Supabase | Nenhum |
| POST | `/shoot` | `GameController` | `shoot` | `LoteService`, `FinancialService`, `RewardService` | `verifyToken` |
| GET | `/health` | Inline | Health check | Nenhum | Nenhum |

### Rotas de Usuário (`/api/users`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| GET | `/profile` | `usuarioController` | `getUserProfile` | Supabase | `verifyToken` |
| PUT | `/profile` | `usuarioController` | `updateUserProfile` | Supabase | `verifyToken` |
| GET | `/list` | `usuarioController` | `getUsersList` | Supabase | `verifyToken` |
| GET | `/stats` | `usuarioController` | `getUserStats` | Supabase | `verifyToken` |
| PUT | `/status/:id` | `usuarioController` | `toggleUserStatus` | Supabase | `verifyToken` |
| GET | `/health` | Inline | Health check | Nenhum | `verifyToken` |

### Rotas de Pagamento (`/api/payments`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| POST | `/webhook` | `PaymentController` | `webhookMercadoPago` | `WebhookService`, `FinancialService` | Validação signature |
| POST | `/pix/criar` | `PaymentController` | `criarPagamentoPix` | `pix-service-real`, Mercado Pago API | `verifyToken` |
| GET | `/pix/status/:payment_id` | `PaymentController` | `consultarStatusPagamento` | Supabase | `verifyToken` |
| GET | `/pix/usuario/:user_id` | `PaymentController` | `listarPagamentosUsuario` | Supabase | `verifyToken` |
| POST | `/pix/cancelar/:payment_id` | `PaymentController` | `cancelarPagamentoPix` | Mercado Pago API | `verifyToken` |
| POST | `/saque` | `PaymentController` | `solicitarSaque` | `FinancialService` | `verifyToken` |
| GET | `/saque/:id` | `PaymentController` | `obterSaque` | Supabase | `verifyToken` |
| GET | `/saques/usuario/:user_id` | `PaymentController` | `listarSaquesUsuario` | Supabase | `verifyToken` |
| GET | `/extrato/:user_id` | `PaymentController` | `obterExtrato` | Supabase | `verifyToken` |
| GET | `/saldo/:user_id` | `PaymentController` | `obterSaldo` | Supabase | `verifyToken` |
| GET | `/health` | `PaymentController` | `healthCheck` | Nenhum | `verifyToken` |

### Rotas de Admin (`/api/admin`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| GET | `/stats` | `AdminController` | `getGeneralStats` | Supabase | `authAdminToken` |
| GET | `/game-stats` | `AdminController` | `getGameStats` | Supabase | `authAdminToken` |
| GET | `/users` | `AdminController` | `getUsers` | Supabase | `authAdminToken` |
| GET | `/financial-report` | `AdminController` | `getFinancialReport` | Supabase | `authAdminToken` |
| GET | `/top-players` | `AdminController` | `getTopPlayers` | Supabase | `authAdminToken` |
| GET | `/recent-transactions` | `AdminController` | `getRecentTransactions` | Supabase | `authAdminToken` |
| GET | `/recent-shots` | `AdminController` | `getRecentShots` | Supabase | `authAdminToken` |
| GET | `/weekly-report` | `AdminController` | `getWeeklyReport` | Supabase | `authAdminToken` |
| POST | `/fix-expired-pix` | `AdminController` | `fixExpiredPix` | Supabase | `authAdminToken` |
| GET | `/fix-expired-pix` | `AdminController` | `fixExpiredPix` | Supabase | `authAdminToken` |

### Rotas de Sistema (`/api/system`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| GET | `/robots.txt` | `SystemController` | `getRobotsTxt` | Nenhum | Nenhum |
| GET | `/` | `SystemController` | `getRoot` | Nenhum | Nenhum |
| GET | `/health` | `SystemController` | `getHealth` | Supabase | Nenhum |
| GET | `/api/metrics` | `SystemController` | `getMetrics` | Nenhum | Nenhum |
| GET | `/api/monitoring/metrics` | `SystemController` | `getMonitoringMetrics` | Nenhum | Nenhum |
| GET | `/api/monitoring/health` | `SystemController` | `getMonitoringHealth` | Nenhum | Nenhum |
| GET | `/meta` | `SystemController` | `getMeta` | Nenhum | Nenhum |
| GET | `/api/production-status` | `SystemController` | `getProductionStatus` | Nenhum | Nenhum |

### Rotas de Saque (`/api/withdraw`)

| Método | Path | Controller | Função | Service/Engine | Middlewares |
|--------|------|------------|--------|----------------|-------------|
| POST | `/request` | `WithdrawController` | `requestWithdraw` | `FinancialService` | `verifyToken` |
| GET | `/history` | `WithdrawController` | `getWithdrawHistory` | Supabase | `verifyToken` |

### Rotas Obsoletas/Não Utilizadas

- `routes/filaRoutes.js` - ⚠️ OBSOLETO: Sistema de fila antigo
- `routes/blockchainRoutes.js` - ⚠️ Não utilizado
- `routes/betRoutes.js` - ⚠️ Não utilizado
- `routes/analyticsRoutes*.js` - ⚠️ Múltiplas versões, uso limitado

---

## 5) 🔧 CONTROLADORES E SERVICES

### GameController (`controllers/gameController.js`)

**Funções:**
1. `getGameStatus()` - Status do jogo
2. `registerShot()` - Registrar chute (legado)
3. `getGameStats()` - Estatísticas do jogo
4. `getShotHistory()` - Histórico de chutes
5. `shoot()` ⭐ CRÍTICO - Processar chute

**Services chamados:**
- `LoteService.getOrCreateLote()`
- `LoteService.updateLoteAfterShot()`
- `FinancialService.addBalance()`
- `FinancialService.deductBalance()`
- `RewardService.processReward()`

**Queries executadas:**
- `SELECT saldo FROM usuarios WHERE id = ?`
- `INSERT INTO chutes (...)`
- RPC `rpc_get_or_create_lote()`
- RPC `rpc_update_lote_after_shot()`
- RPC `rpc_add_balance()`
- RPC `rpc_deduct_balance()`

**Dependências internas:**
- `getOrCreateLoteByValue()` (função global)
- `LoteIntegrityValidator`
- `incrementGlobalCounter()`
- `saveGlobalCounter()`

**Pontos críticos:**
- ⚠️ Dependências injetadas via `injectDependencies()` - se não injetadas, retorna erro 500
- ⚠️ Estado em memória (`lotesAtivos`) pode divergir do banco
- ⚠️ Race condition possível em chutes simultâneos (mitigado com RPC functions)

### PaymentController (`controllers/paymentController.js`)

**Services chamados:**
- `pix-service-real` (Mercado Pago)
- `WebhookService` (idempotência)
- `FinancialService.addBalance()`

**Queries executadas:**
- `SELECT * FROM pagamentos_pix WHERE payment_id = ?`
- `INSERT INTO pagamentos_pix (...)`
- `UPDATE pagamentos_pix SET status = ?`
- `INSERT INTO webhook_events (...)`
- RPC `rpc_add_balance()`

**Pontos críticos:**
- ✅ Idempotência via `WebhookService`
- ✅ Validação de signature do webhook

### AuthController (`controllers/authController.js`)

**Services chamados:**
- `auth-service-unified`
- `emailService`

**Queries executadas:**
- `SELECT * FROM usuarios WHERE email = ?`
- `INSERT INTO usuarios (...)`
- `UPDATE usuarios SET last_login = ?`

### AdminController (`controllers/adminController.js`)

**Queries executadas:**
- Múltiplas queries de agregação para estatísticas
- `SELECT COUNT(*) FROM usuarios`
- `SELECT SUM(valor) FROM transacoes`
- `SELECT * FROM chutes ORDER BY created_at DESC`

---

## 6) 🧠 ENGINES INTERNAS DO SISTEMA

### Engine de Criação de Lote

**Como o sistema realmente cria um lote/jogo:**

1. **Função:** `getOrCreateLoteByValue(amount)` em `server-fly.js:459`
2. **Processo:**
   - Verifica se existe lote ativo em memória (`lotesAtivos` Map)
   - Se não existe, gera `loteId` único: `lote_${amount}_${Date.now()}_${randomBytes}`
   - Gera `winnerIndex` aleatório: `crypto.randomInt(0, config.size)`
   - Chama `LoteService.getOrCreateLote()` para persistir no banco
   - Cria objeto em memória e armazena em `lotesAtivos.set(loteId, loteAtivo)`

**Configurações:**
```javascript
batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1 },  // R$1 → 10 chutes
  2: { size: 5, totalValue: 10, winChance: 0.2 },   // R$2 → 5 chutes
  5: { size: 2, totalValue: 10, winChance: 0.5 },   // R$5 → 2 chutes
  10: { size: 1, totalValue: 10, winChance: 1.0 }   // R$10 → 1 chute
}
```

### Engine de Organização de Jogadores

**Como o sistema realmente organiza os jogadores:**

- ❌ **NÃO há organização explícita de jogadores**
- ✅ Jogadores são rastreados via `chutes.usuario_id` agrupados por `chutes.lote_id`
- ✅ Não há fila ou matchmaking
- ✅ Qualquer jogador pode chutar em qualquer lote ativo do mesmo valor

### Engine de Decisão de Chute

**Como o sistema realmente decide o chute:**

1. **Lógica:** `shotIndex === lote.winnerIndex` → gol
2. **Processo:**
   - `shotIndex` = posição do chute no array `lote.chutes` (0-based)
   - `winnerIndex` = índice pré-definido na criação do lote
   - Comparação direta: `shotIndex === winnerIndex`
   - Se igual → `result = 'goal'`, senão → `result = 'miss'`

**Não usa:**
- ❌ Simulação física
- ❌ Probabilidade baseada em direção
- ❌ Random por chute

### Engine de Determinação do Vencedor

**Como o sistema realmente determina o vencedor:**

1. **Gol detectado:** `shotIndex === winnerIndex`
2. **Lote fechado imediatamente:** `lote.status = 'completed'`
3. **Prêmio creditado:** `FinancialService.addBalance(userId, premio)`
4. **Transação registrada:** Tabela `transacoes` com tipo `'premio'`
5. **Chute salvo:** Tabela `chutes` com `resultado = 'goal'`

**Regras:**
- ✅ Um vencedor por lote
- ✅ Primeiro gol fecha o lote
- ✅ Chutes subsequentes não são processados (lote já fechado)

### Engine de Geração de Transações

**Como o sistema realmente gera transações:**

1. **Via RPC Functions (ACID):**
   - `rpc_add_balance()` - Crédito
   - `rpc_deduct_balance()` - Débito
2. **Processo:**
   - SELECT FOR UPDATE (lock de linha)
   - Atualizar saldo
   - INSERT transação
   - COMMIT (implícito na função RPC)
3. **Tipos de transação:**
   - `'deposito'` - Depósito PIX
   - `'saque'` - Saque
   - `'aposta'` - Aposta (débito)
   - `'premio'` - Prêmio (crédito)
   - `'credito'` - Crédito genérico
   - `'bonus'` - Bônus
   - `'cashback'` - Cashback

---

## 7) 🛢️ PERSISTÊNCIA E MEMÓRIA

### Dados Armazenados em Memória

**✅ SIM - Existem dados em memória:**

1. **`lotesAtivos` Map** (`server-fly.js:445`)
   - Tipo: `Map<string, Lote>`
   - Conteúdo: Lotes ativos com chutes em array
   - Risco: Perda em reinicialização (mitigado com sincronização)

2. **`contadorChutesGlobal`** (`server-fly.js:447`)
   - Tipo: `number`
   - Conteúdo: Contador global de chutes
   - Persistência: Salvo no banco via `saveGlobalCounter()`

3. **`ultimoGolDeOuro`** (`server-fly.js:448`)
   - Tipo: `number`
   - Conteúdo: Último contador que teve Gol de Ouro
   - Persistência: Salvo no banco via `saveGlobalCounter()`

### Dependências de Listas Locais ou Arrays Fixos

**✅ SIM:**

1. **`lote.chutes`** - Array em memória
   - Tipo: `Array<Chute>`
   - Risco: Perda em reinicialização
   - Mitigação: Chutes são salvos no banco, array reconstruído se necessário

2. **`batchConfigs`** - Objeto fixo
   - Tipo: `Object`
   - Conteúdo: Configurações dos lotes por valor
   - Risco: Nenhum (configuração estática)

### Processos Dependentes de Estado Global

**✅ SIM:**

1. **`contadorChutesGlobal`**
   - Usado para: Gol de Ouro (`contadorChutesGlobal % 1000 === 0`)
   - Risco: Divergência entre instâncias (múltiplas instâncias Fly.io)

2. **`lotesAtivos` Map**
   - Usado para: Acesso rápido a lotes ativos
   - Risco: Divergência entre instâncias

---

## 8) 🔒 SEGURANÇA & INTEGRIDADE

### Tabelas sem RLS

**❌ TODAS AS TABELAS PRINCIPAIS SEM RLS:**

1. `usuarios` - ❌ RLS não habilitado
2. `chutes` - ❌ RLS não habilitado
3. `lotes` - ❌ RLS não habilitado
4. `transacoes` - ❌ RLS não habilitado
5. `pagamentos_pix` - ❌ RLS não habilitado
6. `saques` - ❌ RLS não habilitado

**✅ Tabelas com RLS:**
- `webhook_events` - ✅ RLS habilitado
- `rewards` - ✅ RLS habilitado

### Tabelas sem Índices

**❌ ÍNDICES FALTANDO:**

1. `chutes`:
   - ❌ `idx_chutes_usuario_id` - FALTANDO
   - ❌ `idx_chutes_lote_id` - FALTANDO
   - ❌ `idx_chutes_created_at` - FALTANDO

2. `transacoes`:
   - ❌ `idx_transacoes_usuario_id` - FALTANDO
   - ❌ `idx_transacoes_created_at` - FALTANDO

3. `usuarios`:
   - ✅ `idx_usuarios_email` - EXISTE

### Queries Desprotegidas

**⚠️ QUERIES SEM PROTEÇÃO ADEQUADA:**

1. **Queries diretas ao Supabase sem validação de usuário:**
   - `SELECT * FROM usuarios WHERE id = ?` - Sem verificação de ownership
   - `SELECT * FROM chutes WHERE usuario_id = ?` - Sem verificação de ownership

2. **Uso de `supabaseAdmin` bypassa RLS:**
   - Todos os services usam `supabaseAdmin` que bypassa RLS
   - Dependência de validação no código JavaScript

### Race Conditions Possíveis

**⚠️ RACE CONDITIONS IDENTIFICADAS:**

1. **Chutes simultâneos no mesmo lote:**
   - Risco: Múltiplos chutes podem ser processados simultaneamente
   - Mitigação: RPC `rpc_update_lote_after_shot()` usa `SELECT FOR UPDATE`

2. **Atualização de saldo:**
   - Risco: Múltiplas transações simultâneas
   - Mitigação: RPC `rpc_add_balance()` e `rpc_deduct_balance()` usam `SELECT FOR UPDATE`

3. **Criação de lote:**
   - Risco: Múltiplos lotes criados simultaneamente para mesmo valor
   - Mitigação: RPC `rpc_get_or_create_lote()` busca lote ativo antes de criar

### Inconsistências entre Migrations e Schema

**⚠️ INCONSISTÊNCIAS:**

1. **Schema Prisma vazio:**
   - `prisma/schema.prisma` contém apenas datasource básico
   - Não reflete schema real do banco

2. **Múltiplos arquivos de schema:**
   - `database/schema.sql` - Schema base
   - `database/schema-completo.sql` - Schema completo
   - `database/schema-lotes-persistencia.sql` - Schema de lotes
   - Inconsistências possíveis entre arquivos

---

## 9) 📊 DIAGNÓSTICO DE DEAD CODE

### Pastas Não Usadas

**⚠️ PASTAS COM CÓDIGO NÃO UTILIZADO:**

1. `src/` - ⚠️ Código frontend no backend (não utilizado)
2. `_archived_config_controllers/` - ⚠️ Arquivos arquivados
3. `_archived_legacy_middlewares/` - ⚠️ Middlewares legados
4. `_archived_legacy_routes/` - ⚠️ Rotas legadas

### Controllers Não Referenciados

**✅ TODOS OS CONTROLLERS SÃO UTILIZADOS:**
- `adminController.js` - ✅ Usado em `adminRoutes.js`
- `authController.js` - ✅ Usado em `authRoutes.js`
- `gameController.js` - ✅ Usado em `gameRoutes.js`
- `paymentController.js` - ✅ Usado em `paymentRoutes.js`
- `systemController.js` - ✅ Usado em `systemRoutes.js`
- `usuarioController.js` - ✅ Usado em `usuarioRoutes.js`
- `withdrawController.js` - ✅ Usado em `withdrawRoutes.js`

### Services Não Chamados

**⚠️ SERVICES COM USO LIMITADO:**

1. `queueService.js` - ⚠️ OBSOLETO: Sistema de fila antigo não utilizado
2. `cache-service.js` - ⚠️ Uso limitado
3. `cdn-service.js` - ⚠️ Uso limitado
4. `history-service.js` - ⚠️ Uso limitado
5. `notification-service.js` - ⚠️ Uso limitado
6. `ranking-service.js` - ⚠️ Uso limitado
7. `redisService.js` - ⚠️ Uso limitado

**✅ SERVICES ATIVOS:**
- `financialService.js` - ✅ CRÍTICO
- `loteService.js` - ✅ CRÍTICO
- `rewardService.js` - ✅ CRÍTICO
- `webhookService.js` - ✅ CRÍTICO
- `auth-service-unified.js` - ✅ CRÍTICO
- `pix-service-real.js` - ✅ CRÍTICO

### Arquivos Antigos da Versão MongoDB

**❌ NÃO ENCONTRADOS:**
- Não há referências a MongoDB no código atual
- Sistema usa apenas Supabase (PostgreSQL)

### Rotas Sem Uso

**⚠️ ROTAS OBSOLETAS:**

1. `routes/filaRoutes.js` - ⚠️ OBSOLETO: Sistema de fila antigo
2. `routes/blockchainRoutes.js` - ⚠️ Não utilizado
3. `routes/betRoutes.js` - ⚠️ Não utilizado
4. `routes/analyticsRoutes*.js` - ⚠️ Múltiplas versões, uso limitado

### Código Duplicado

**⚠️ CÓDIGO DUPLICADO:**

1. **Múltiplas versões de analyticsRoutes:**
   - `analyticsRoutes.js`
   - `analyticsRoutes_fixed.js`
   - `analyticsRoutes_optimized.js`
   - `analyticsRoutes_v1.js`

2. **Múltiplos arquivos de schema:**
   - `schema.sql`
   - `schema-completo.sql`
   - `schema-lotes-persistencia.sql`

---

## 10) 📁 ARQUIVOS CONFIGURADOS E VARIÁVEIS CRÍTICAS

### Envs Utilizadas

**Variáveis de Ambiente Críticas (conforme `server-fly.js`):**

1. **Supabase:**
   - `SUPABASE_URL` - ⭐ CRÍTICO
   - `SUPABASE_SERVICE_ROLE_KEY` - ⭐ CRÍTICO

2. **JWT:**
   - `JWT_SECRET` - ⭐ CRÍTICO

3. **Mercado Pago:**
   - `MERCADOPAGO_ACCESS_TOKEN` - ⭐ CRÍTICO (produção)
   - `MERCADOPAGO_CLIENT_ID` - Opcional
   - `MERCADOPAGO_CLIENT_SECRET` - Opcional

4. **Servidor:**
   - `PORT` - Padrão: 8080
   - `NODE_ENV` - Ambiente (development/production)

5. **Email (opcional):**
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`

### Envs Faltando

**⚠️ VARIÁVEIS QUE PODEM FALTAR:**

- `REDIS_URL` - Se `redisService` for usado
- `CDN_URL` - Se `cdn-service` for usado
- Variáveis de monitoramento/analytics

### Serviços Externos Referenciados

1. **Supabase (PostgreSQL):**
   - Banco de dados principal
   - Autenticação (não utilizado ativamente)
   - Storage (não utilizado ativamente)

2. **Mercado Pago:**
   - API de pagamentos PIX
   - Webhooks para notificações de pagamento

3. **Fly.io:**
   - Hospedagem do backend
   - Deploy via `flyctl`

4. **Vercel:**
   - Hospedagem dos frontends (player/admin)
   - Deploy automático via Git

---

## 11) 📌 CONCLUSÃO

### Componentes que o Projeto Realmente Utiliza

**✅ COMPONENTES ATIVOS:**

1. **Sistema de Lotes (LOTE_MODERNO):**
   - Tabela `lotes`
   - `LoteService`
   - `GameController.shoot()`
   - `lotesAtivos` Map em memória

2. **Sistema Financeiro:**
   - `FinancialService` (ACID via RPC)
   - Tabela `transacoes`
   - RPC `rpc_add_balance()` e `rpc_deduct_balance()`

3. **Sistema de Pagamentos:**
   - `PaymentController`
   - `pix-service-real` (Mercado Pago)
   - `WebhookService` (idempotência)
   - Tabela `pagamentos_pix`

4. **Sistema de Autenticação:**
   - `AuthController`
   - JWT tokens
   - `auth-service-unified`

5. **Sistema de Recompensas:**
   - `RewardService`
   - Tabela `rewards`

### Tabelas que Estão Realmente Vivas

**✅ TABELAS ATIVAS:**

1. `usuarios` - ⭐ CRÍTICO
2. `chutes` - ⭐ CRÍTICO
3. `lotes` - ⭐ CRÍTICO
4. `transacoes` - ⭐ CRÍTICO
5. `pagamentos_pix` - ⭐ CRÍTICO
6. `saques` - ✅ ATIVO
7. `webhook_events` - ✅ ATIVO
8. `rewards` - ✅ ATIVO

**⚠️ TABELAS OBSOLETAS:**

1. `partidas` - ⚠️ OBSOLETO
2. `partida_jogadores` - ⚠️ OBSOLETO
3. `fila_jogadores` - ⚠️ OBSOLETO

**⚠️ TABELAS COM USO LIMITADO:**

1. `conquistas`
2. `usuario_conquistas`
3. `ranking`
4. `configuracoes`
5. `logs_sistema`
6. `sessoes`
7. `notificacoes`

### Engines que Estão Realmente Ativas

**✅ ENGINES ATIVAS:**

1. **Engine de Lotes:**
   - `getOrCreateLoteByValue()`
   - `LoteService.getOrCreateLote()`
   - `LoteService.updateLoteAfterShot()`
   - `LoteService.syncActiveLotes()`

2. **Engine de Chute:**
   - `GameController.shoot()`
   - Lógica: `shotIndex === winnerIndex`

3. **Engine de Premiação:**
   - `FinancialService.addBalance()`
   - Prêmio: R$5 fixo + R$100 gol de ouro

4. **Engine de Progressão:**
   - `contadorChutesGlobal`
   - Gol de Ouro: `contadorChutesGlobal % 1000 === 0`

### O Que Está Obsoleto

**⚠️ CÓDIGO OBSOLETO:**

1. **Sistema de Fila/Partidas:**
   - `routes/filaRoutes.js`
   - `services/queueService.js`
   - Tabelas `partidas`, `partida_jogadores`, `fila_jogadores`

2. **Múltiplas Versões:**
   - `analyticsRoutes*.js` (4 versões)
   - Múltiplos arquivos de schema

3. **Código Frontend no Backend:**
   - Pasta `src/` com componentes React

### O Que Precisa Ser Refeito

**🔧 MELHORIAS NECESSÁRIAS:**

1. **Segurança:**
   - Habilitar RLS em todas as tabelas críticas
   - Criar índices faltantes
   - Implementar validação de ownership nas queries

2. **Persistência:**
   - Migrar lotes completamente para banco (eliminar memória)
   - Implementar heartbeat para validar estado
   - Sincronização automática entre instâncias

3. **Limpeza:**
   - Remover código obsoleto (fila/partidas)
   - Consolidar múltiplas versões de arquivos
   - Remover código frontend do backend

4. **Observabilidade:**
   - Implementar endpoint `/monitor`
   - Criar dashboard de observabilidade
   - Configurar auditoria contínua automática

### Risco Atual

**⚠️ RISCOS IDENTIFICADOS:**

1. **Segurança:**
   - ⚠️ ALTO: RLS não habilitado em tabelas críticas
   - ⚠️ MÉDIO: Índices faltantes (performance)
   - ⚠️ BAIXO: Race conditions mitigadas via RPC

2. **Persistência:**
   - ⚠️ MÉDIO: Estado em memória pode divergir do banco
   - ⚠️ MÉDIO: Múltiplas instâncias não compartilham memória
   - ⚠️ BAIXO: Sincronização ao iniciar implementada

3. **Manutenibilidade:**
   - ⚠️ MÉDIO: Código obsoleto presente
   - ⚠️ BAIXO: Múltiplas versões de arquivos

### Estado de Prontidão para Engine V19

**📊 AVALIAÇÃO:**

**✅ PONTOS FORTES:**
- Sistema de lotes funcional
- Sistema financeiro ACID implementado
- Webhooks com idempotência
- Persistência parcial implementada

**⚠️ PONTOS DE ATENÇÃO:**
- RLS não habilitado
- Índices faltantes
- Estado em memória
- Código obsoleto presente

**❌ BLOQUEADORES:**
- Nenhum bloqueador crítico
- Sistema funcional mas requer melhorias de segurança

**🎯 RECOMENDAÇÕES PARA V19:**
1. Habilitar RLS em todas as tabelas
2. Criar índices faltantes
3. Migrar lotes completamente para banco
4. Remover código obsoleto
5. Implementar observabilidade completa

---

## 12) 📄 RESUMO EXECUTIVO

### Estado Atual do Sistema

O projeto Gol de Ouro utiliza um **sistema de lotes moderno (LOTE_MODERNO)** onde:
- Lotes são criados por valor de aposta (R$1, R$2, R$5, R$10)
- Cada lote tem um `winnerIndex` pré-definido
- Chutes são processados sequencialmente
- Gol é determinado por `shotIndex === winnerIndex`
- Prêmio é creditado automaticamente via RPC functions ACID

### Arquitetura

- **Backend:** Node.js + Express
- **Banco:** Supabase (PostgreSQL)
- **Pagamentos:** Mercado Pago (PIX)
- **Deploy:** Fly.io (backend), Vercel (frontends)
- **Autenticação:** JWT

### Componentes Críticos

1. **Sistema de Lotes:** Funcional, mas com estado em memória
2. **Sistema Financeiro:** ACID via RPC functions ✅
3. **Sistema de Pagamentos:** Integrado com Mercado Pago ✅
4. **Sistema de Autenticação:** JWT funcional ✅

### Próximos Passos Recomendados

1. **Segurança:** Habilitar RLS + criar índices
2. **Persistência:** Migrar lotes completamente para banco
3. **Limpeza:** Remover código obsoleto
4. **Observabilidade:** Implementar monitoramento completo

---

**Gerado em:** 2025-12-05T02:00:00Z  
**Versão:** V19.0.0-PRE-ENGINE  
**Status:** ✅ Relatório estrutural completo gerado

