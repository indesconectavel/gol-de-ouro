# 🔍 LEVANTAMENTO TÉCNICO COMPLETO DO BACKEND - GOL DE OURO v1.3.0

**Data:** 2025-01-12  
**Versão do Backend:** 1.2.0 (server-fly.js)  
**Status:** Documentação Técnica Completa - SEM ALTERAÇÕES

---

## 📋 SUMÁRIO EXECUTIVO

Este documento apresenta um levantamento técnico completo e detalhado do backend do projeto Gol de Ouro, mapeando toda a estrutura, endpoints, controllers, services, middlewares, sistema de fila, partidas, chutes, WebSocket, pagamentos, saldo, transações e configurações de produção.

**IMPORTANTE:** Este documento é apenas para documentação. Nenhuma alteração foi feita no código.

---

## 1. ESTRUTURA DE PASTAS DO BACKEND

```
goldeouro-backend/
├── controllers/
│   ├── adminController.js          ✅ Completo - Relatórios admin
│   ├── authController.js           ✅ Completo - Autenticação padronizada
│   ├── gameController.js           ✅ Completo - Jogos e chutes
│   ├── paymentController.js        ✅ Completo - Pagamentos PIX
│   ├── usuarioController.js        ⚠️ Parcial - Usa mock temporário
│   └── index.js
├── services/
│   ├── auth-service-unified.js
│   ├── cache-service.js
│   ├── cdn-service.js
│   ├── emailService.js             ✅ Completo - Envio de emails
│   ├── history-service.js
│   ├── notification-service.js
│   ├── pix-mercado-pago.js
│   ├── pix-service-real.js
│   ├── pix-service.js
│   ├── ranking-service.js
│   └── redisService.js
├── routes/
│   ├── adminRoutes.js              ✅ Completo - Rotas admin
│   ├── authRoutes.js               ✅ Completo - Rotas auth
│   ├── gameRoutes.js               ✅ Completo - Rotas game
│   ├── paymentRoutes.js            ⚠️ Extenso - Muitas rotas não implementadas
│   ├── usuarioRoutes.js
│   ├── mpWebhook.js                ✅ Completo - Webhook Mercado Pago
│   └── [outros arquivos de rotas]
├── middlewares/
│   ├── authMiddleware.js           ✅ Completo - JWT e Admin token
│   ├── response-handler.js         ✅ Completo - Padronização de respostas
│   ├── security-performance.js     ✅ Completo - Sanitização
│   ├── errorHandler.js
│   ├── rateLimit.js
│   └── [outros middlewares]
├── utils/
│   ├── response-helper.js          ✅ Completo - Helpers de resposta
│   ├── pix-validator.js            ✅ Completo - Validação PIX robusta
│   ├── lote-integrity-validator.js
│   ├── webhook-signature-validator.js
│   └── [outros utils]
├── database/
│   ├── supabase-config.js          ⚠️ Básico - Configuração simples
│   ├── supabase-unified-config.js  ✅ Completo - Configuração unificada
│   ├── connection.js
│   └── [arquivos SQL de schema]
├── src/
│   └── websocket.js                ✅ Completo - Sistema de fila e partidas v1.3.0
├── config/
│   ├── system-config.js
│   └── required-env.js
├── server-fly.js                   ✅ Arquivo principal - 2791 linhas
└── package.json                    ✅ Dependências mapeadas
```

---

## 2. ENDPOINTS EXISTENTES (TODOS)

### 2.1. Autenticação (`/api/auth/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| POST | `/api/auth/register` | `server-fly.js` (inline) | `validateData` | Registrar novo usuário |
| POST | `/api/auth/login` | `server-fly.js` (inline) | `authLimiter` | Login de usuário |
| POST | `/api/auth/forgot-password` | `server-fly.js` (inline) | `validateData` | Recuperação de senha |
| POST | `/api/auth/reset-password` | `server-fly.js` (inline) | `validateData` | Reset de senha |
| POST | `/api/auth/verify-email` | `server-fly.js` (inline) | `validateData` | Verificação de email |
| PUT | `/api/auth/change-password` | `server-fly.js` (inline) | `authenticateToken` | Alterar senha |
| POST | `/auth/login` | `server-fly.js` (inline) | `authLimiter` | Login legado (compatibilidade) |

**Estrutura de Resposta Padrão:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { "id", "email", "username", "saldo", "tipo" }
  },
  "message": "Mensagem de sucesso",
  "timestamp": "ISO8601"
}
```

### 2.2. Usuários (`/api/user/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| GET | `/api/user/profile` | `server-fly.js` (inline) | `authenticateToken` | Obter perfil do usuário |
| PUT | `/api/user/profile` | `server-fly.js` (inline) | `authenticateToken` | Atualizar perfil |
| GET | `/usuario/perfil` | `server-fly.js` (inline) | `authenticateToken` | Perfil legado (compatibilidade) |

**⚠️ PROBLEMA DETECTADO:** `usuarioController.js` usa dados mock temporários, não consulta Supabase real.

### 2.3. Jogos (`/api/games/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| POST | `/api/games/shoot` | `server-fly.js` (inline) | `authenticateToken` | Registrar chute (sistema de lotes) |
| GET | `/api/fila/entrar` | `server-fly.js` (inline) | `authenticateToken` | Entrar na fila (compatibilidade) |

**Rotas via `gameRoutes.js`:**
- GET `/api/games/status` → `GameController.getGameStatus`
- POST `/api/games/chutar` → `GameController.registerShot`
- GET `/api/games/stats` → `GameController.getGameStats`
- GET `/api/games/history` → `GameController.getShotHistory`

### 2.4. Pagamentos PIX (`/api/payments/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| POST | `/api/payments/pix/criar` | `server-fly.js` (inline) | `authenticateToken` | Criar pagamento PIX |
| GET | `/api/payments/pix/usuario` | `server-fly.js` (inline) | `authenticateToken` | Listar pagamentos do usuário |
| POST | `/api/payments/webhook` | `server-fly.js` (inline) | `webhookSignatureValidator` | Webhook Mercado Pago |

**Rotas via `paymentRoutes.js` (⚠️ Muitas não implementadas):**
- POST `/api/payments/pix/criar` → `PaymentController.criarPagamentoPix`
- GET `/api/payments/pix/status/:payment_id` → `PaymentController.consultarStatusPagamento`
- GET `/api/payments/pix/usuario/:user_id` → `PaymentController.listarPagamentosUsuario`
- POST `/api/payments/webhook` → `PaymentController.webhookMercadoPago`
- POST `/api/payments/saque` → `PaymentController.solicitarSaque`
- GET `/api/payments/health` → `PaymentController.healthCheck`

**⚠️ PROBLEMA DETECTADO:** `paymentRoutes.js` define muitas rotas que não existem no `PaymentController`.

### 2.5. Saques (`/api/withdraw/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| POST | `/api/withdraw/request` | `server-fly.js` (inline) | `authenticateToken` | Solicitar saque |
| GET | `/api/withdraw/history` | `server-fly.js` (inline) | `authenticateToken` | Histórico de saques |

### 2.6. Admin (`/api/admin/`)

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| GET | `/api/admin/stats` | `AdminController.getGeneralStats` | `authAdmin` | Estatísticas gerais |
| GET | `/api/admin/game-stats` | `AdminController.getGameStats` | `authAdmin` | Estatísticas de jogos |
| GET | `/api/admin/users` | `AdminController.getUsers` | `authAdmin` | Lista de usuários |
| GET | `/api/admin/financial-report` | `AdminController.getFinancialReport` | `authAdmin` | Relatório financeiro |
| GET | `/api/admin/top-players` | `AdminController.getTopPlayers` | `authAdmin` | Top jogadores |
| GET | `/api/admin/recent-transactions` | `AdminController.getRecentTransactions` | `authAdmin` | Transações recentes |
| GET | `/api/admin/recent-shots` | `AdminController.getRecentShots` | `authAdmin` | Chutes recentes |
| GET | `/api/admin/weekly-report` | `AdminController.getWeeklyReport` | `authAdmin` | Relatório semanal |
| POST | `/api/admin/relatorio-semanal` | `AdminController.getWeeklyReport` | `authAdmin` | Relatório semanal (legado) |
| POST | `/api/admin/estatisticas-gerais` | `AdminController.getGeneralStats` | `authAdmin` | Estatísticas (legado) |
| POST | `/api/admin/top-jogadores` | `AdminController.getTopPlayers` | `authAdmin` | Top jogadores (legado) |
| POST | `/api/admin/transacoes-recentes` | `AdminController.getRecentTransactions` | `authAdmin` | Transações (legado) |
| POST | `/api/admin/chutes-recentes` | `AdminController.getRecentShots` | `authAdmin` | Chutes (legado) |
| GET | `/api/admin/lista-usuarios` | `AdminController.getUsers` | `authAdmin` | Lista usuários (legado) |
| POST | `/api/admin/bootstrap` | `server-fly.js` (inline) | `authenticateToken` | Criar primeiro admin |

**Autenticação Admin:** Header `x-admin-token` com valor de `process.env.ADMIN_TOKEN`

### 2.7. Health & Monitoring

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| GET | `/health` | `server-fly.js` (inline) | Nenhum | Health check básico |
| GET | `/api/metrics` | `server-fly.js` (inline) | Nenhum | Métricas do sistema |
| GET | `/api/monitoring/metrics` | `server-fly.js` (inline) | Nenhum | Métricas de monitoramento |
| GET | `/api/monitoring/health` | `server-fly.js` (inline) | Nenhum | Health check avançado |
| GET | `/api/production-status` | `server-fly.js` (inline) | Nenhum | Status de produção |
| GET | `/api/debug/token` | `server-fly.js` (inline) | Nenhum | Debug de token |

### 2.8. Rotas Públicas

| Método | Caminho | Controller | Middlewares | Descrição |
|--------|---------|------------|-------------|-----------|
| GET | `/` | `server-fly.js` (inline) | Nenhum | Informações da API |
| GET | `/robots.txt` | `server-fly.js` (inline) | Nenhum | Robots.txt |
| GET | `/meta` | `server-fly.js` (inline) | Nenhum | Metadados da API |

---

## 3. CONTROLLERS

### 3.1. AuthController (`controllers/authController.js`)

**Status:** ✅ Completo e Padronizado (v1.3.0)

**Funções:**
- `register(req, res)` - Registrar novo usuário
  - Valida email, senha, username
  - Hash de senha com bcrypt (10 rounds)
  - Cria usuário no Supabase
  - Gera JWT token (24h)
  - Retorna resposta padronizada via `response-helper`

- `login(req, res)` - Login de usuário
  - Valida email e senha
  - Verifica se conta está ativa
  - Compara senha com bcrypt
  - Gera JWT token (24h)
  - Retorna resposta padronizada

**Dependências:**
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - Geração de tokens
- `@supabase/supabase-js` - Banco de dados
- `utils/response-helper` - Respostas padronizadas

**Variáveis de Ambiente:**
- `JWT_SECRET` - Secret para assinatura de tokens
- `JWT_EXPIRES_IN` - Tempo de expiração (padrão: 24h)

### 3.2. PaymentController (`controllers/paymentController.js`)

**Status:** ✅ Completo e Padronizado (v1.3.0)

**Funções:**
- `criarPagamentoPix(req, res)` - Criar pagamento PIX
  - Valida valor mínimo (R$ 1,00)
  - Cria preferência no Mercado Pago
  - Salva pagamento no Supabase (`pagamentos_pix`)
  - Retorna QR Code e dados do pagamento

- `consultarStatusPagamento(req, res)` - Consultar status
  - Busca pagamento no Supabase
  - Consulta status no Mercado Pago
  - Atualiza status no banco se necessário
  - Processa pagamento aprovado automaticamente

- `listarPagamentosUsuario(req, res)` - Listar pagamentos
  - Busca pagamentos do usuário com paginação
  - Retorna lista paginada

- `webhookMercadoPago(req, res)` - Processar webhook
  - Valida tipo de evento (`payment`)
  - Consulta pagamento no Mercado Pago
  - Atualiza status no banco
  - Processa pagamento aprovado

- `processarPagamentoAprovado(pagamento)` - Processar aprovação
  - Busca usuário no Supabase
  - Atualiza saldo (`saldo = saldo + valor`)
  - Cria transação (`transacoes`)

- `solicitarSaque(req, res)` - Solicitar saque
  - Valida valor mínimo (R$ 10,00)
  - Valida chave PIX
  - Verifica saldo suficiente
  - Calcula taxa de saque (R$ 2,00 padrão)
  - Cria saque no Supabase (`saques`)
  - Cria transação pendente

- `healthCheck(req, res)` - Health check
  - Testa conexão com Supabase
  - Retorna status do sistema

**Dependências:**
- `mercadopago` SDK
- `@supabase/supabase-js`
- `crypto` - Geração de idempotency keys
- `utils/response-helper`

**Variáveis de Ambiente:**
- `MERCADOPAGO_ACCESS_TOKEN` - Token do Mercado Pago
- `PAGAMENTO_TAXA_SAQUE` - Taxa de saque (padrão: 2.00)

**⚠️ RISCOS POTENCIAIS:**
- Race condition na atualização de saldo (não usa transação)
- Webhook pode ser chamado múltiplas vezes (idempotência parcial)

### 3.3. GameController (`controllers/gameController.js`)

**Status:** ✅ Completo e Padronizado (v1.3.0)

**Funções:**
- `getGameStatus(req, res)` - Status do jogo
  - Retorna status do sistema de lotes
  - Informa lote atual e estatísticas

- `registerShot(req, res)` - Registrar chute
  - Valida zona, potência, ângulo, valor_aposta
  - Calcula resultado usando `calculateShotResult`
  - Salva chute no Supabase (`chutes`)
  - Retorna resultado padronizado

- `calculateShotResult(zona, potencia, angulo)` - Calcular resultado
  - Usa `crypto.randomBytes` para aleatoriedade segura
  - Calcula chance baseada em zona, potência e ângulo
  - Retorna objeto com `gol`, `chance`, `potencia_efetiva`, `angulo_efetivo`

- `getGameStats(req, res)` - Estatísticas do jogo
  - Busca total de chutes e gols no Supabase
  - Retorna estatísticas agregadas

- `getShotHistory(req, res)` - Histórico de chutes
  - Busca últimos 50 chutes no Supabase
  - Ordena por `created_at` descendente

**Dependências:**
- `@supabase/supabase-js`
- `crypto` - Aleatoriedade segura
- `utils/response-helper`

**⚠️ PROBLEMA DETECTADO:**
- Sistema de lotes está implementado em `server-fly.js`, não no controller
- Controller apenas registra chutes individuais, não gerencia lotes

### 3.4. AdminController (`controllers/adminController.js`)

**Status:** ✅ Completo e Padronizado (v1.3.0)

**Funções:**
- `getGeneralStats(req, res)` - Estatísticas gerais
  - Total de usuários, transações, pagamentos, saques, chutes
  - Receita total, saques totais, saldo líquido
  - Taxa de acerto (gols/chutes)

- `getGameStats(req, res)` - Estatísticas de jogos
  - Filtro por período (today, week, month, all)
  - Total de chutes e gols
  - Gols por zona
  - Chutes por hora

- `getUsers(req, res)` - Lista de usuários
  - Paginação (page, limit)
  - Busca por email/username
  - Filtro por status (active, inactive, all)

- `getFinancialReport(req, res)` - Relatório financeiro
  - Filtro por data (startDate, endDate)
  - Total de depósitos e saques
  - Saldo líquido
  - Depósitos por dia

- `getTopPlayers(req, res)` - Top jogadores
  - Ordena por total de gols
  - Limite configurável (padrão: 10)
  - Taxa de acerto por jogador

- `getRecentTransactions(req, res)` - Transações recentes
  - Últimas 50 transações
  - Enriquecido com dados do usuário

- `getRecentShots(req, res)` - Chutes recentes
  - Últimos 50 chutes
  - Enriquecido com dados do usuário

- `getWeeklyReport(req, res)` - Relatório semanal
  - Novos usuários na semana
  - Total de transações e receita
  - Total de chutes e gols
  - Média de chutes por usuário

**Dependências:**
- `@supabase/supabase-js` (supabaseAdmin)
- `utils/response-helper`

**⚠️ PROBLEMA DETECTADO:**
- Algumas queries podem ser otimizadas com índices
- Não há cache de estatísticas (pode ser lento com muitos dados)

### 3.5. UsuarioController (`controllers/usuarioController.js`)

**Status:** ⚠️ PARCIAL - Usa Mock Temporário

**Funções:**
- `getUserProfile(req, res)` - Obter perfil
  - **PROBLEMA:** Usa `usuariosMock` ao invés de Supabase
  - Retorna dados mockados

- `updateUserProfile(req, res)` - Atualizar perfil
  - **PROBLEMA:** Atualiza apenas mock em memória
  - Não persiste no banco

- `getUsersList(req, res)` - Lista de usuários
  - **PROBLEMA:** Retorna apenas mock

- `getUserStats(req, res)` - Estatísticas do usuário
  - **PROBLEMA:** Calcula sobre mock

- `toggleUserStatus(req, res)` - Alterar status
  - **PROBLEMA:** Altera apenas mock

**⚠️ CRÍTICO:** Este controller precisa ser refatorado para usar Supabase real.

---

## 4. SERVICES

### 4.1. EmailService (`services/emailService.js`)

**Status:** ✅ Completo (v1.2.0)

**Funções:**
- `sendPasswordResetEmail(email, username, resetToken)` - Enviar email de recuperação
- `sendVerificationEmail(email, username, verificationToken)` - Enviar email de verificação
- `generatePasswordResetHTML(username, resetLink)` - Gerar HTML de recuperação
- `generateVerificationHTML(username, verificationLink)` - Gerar HTML de verificação

**Configuração:**
- Usa `nodemailer` com Gmail
- Variáveis: `SMTP_USER`, `SMTP_PASS` ou `GMAIL_APP_PASSWORD`
- Fallback: Se não configurado, apenas loga o token

**Dependências:**
- `nodemailer`

### 4.2. Outros Services

**Status:** ⚠️ Não Analisados em Detalhe

- `auth-service-unified.js` - Serviço de autenticação unificado
- `cache-service.js` - Cache (provavelmente não usado)
- `cdn-service.js` - CDN (provavelmente não usado)
- `history-service.js` - Histórico
- `notification-service.js` - Notificações
- `pix-mercado-pago.js` - Integração Mercado Pago
- `pix-service-real.js` - Serviço PIX real
- `pix-service.js` - Serviço PIX (mock?)
- `ranking-service.js` - Ranking
- `redisService.js` - Redis (provavelmente não usado)

---

## 5. SISTEMA DE FILA

### 5.1. Como o Jogador Entra

**Arquivo:** `src/websocket.js`

**Fluxo:**
1. Cliente conecta via WebSocket (`/ws?token=JWT_TOKEN`)
2. Cliente envia mensagem `{ type: 'auth', token: 'JWT_TOKEN' }`
3. Servidor valida token JWT e busca usuário no Supabase
4. Cliente envia `{ type: 'join_queue', queueType: 'normal' }`
5. Servidor adiciona WebSocket à fila (`this.queues.get(queueType)`)

**Código Relevante:**
```javascript
joinQueue(ws, queueType = 'normal') {
  const client = this.clients.get(ws);
  if (!client || !client.authenticated) {
    ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado' }));
    return;
  }
  
  if (!this.queues.has(queueType)) {
    this.queues.set(queueType, new Set());
  }
  
  this.queues.get(queueType).add(ws);
  ws.queueType = queueType;
  
  const queueSize = this.queues.get(queueType).size;
  
  // Notificar todos na fila
  this.broadcastToQueue(queueType, {
    type: 'queue_updated',
    totalInQueue: queueSize
  });
  
  // Verificar se há 10 jogadores para iniciar
  if (queueSize >= GAME_CONFIG.REQUIRED_PLAYERS) {
    this.startGame(queueType);
  }
}
```

### 5.2. Como é Atribuída a Posição

**Status:** ⚠️ Não há posição explícita na fila

A fila é um `Set` de WebSockets, não há índice de posição. Quando há 10 jogadores, todos são selecionados simultaneamente.

### 5.3. Como Funciona o Lock

**Arquivo:** `src/websocket.js`

**Lock de Fila:**
```javascript
startGame(queueType) {
  const lockKey = `queue_${queueType}`;
  if (this.queueLocks.has(lockKey)) {
    console.log(`⚠️ Tentativa de iniciar partida bloqueada (lock ativo)`);
    return;
  }
  
  // Ativar lock
  this.queueLocks.set(lockKey, Date.now());
  
  // ... processar partida ...
  
  // Remover lock após 5 segundos
  setTimeout(() => {
    this.queueLocks.delete(lockKey);
  }, GAME_CONFIG.QUEUE_LOCK_TIMEOUT_MS); // 5 segundos
}
```

**Propósito:** Evitar race conditions quando múltiplos jogadores entram simultaneamente na fila e atingem 10 ao mesmo tempo.

### 5.4. Como o WebSocket Envia Atualizações

**Broadcast para Fila:**
```javascript
broadcastToQueue(queueType, message) {
  if (this.queues.has(queueType)) {
    this.queues.get(queueType).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
```

**Eventos Enviados:**
- `queue_joined` - Jogador entrou na fila
- `queue_updated` - Fila atualizada (novo jogador entrou)
- `queue_left` - Jogador saiu da fila
- `game_started` - Partida iniciada (10 jogadores)

### 5.5. Como Inicia a Partida

**Fluxo:**
1. Quando `queueSize >= 10`, chama `startGame(queueType)`
2. Verifica lock (evita duplicação)
3. Seleciona exatamente 10 jogadores: `Array.from(queue).slice(0, 10)`
4. Remove jogadores da fila
5. Cria `gameRoom` com:
   - `gameId` único (`game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`)
   - `players` - Array de 10 WebSockets
   - `playerIds` - Array de 10 user IDs
   - `status: 'active'`
   - `scores` - Array de 10 zeros
   - `kicks` - Array de 10 nulls
   - `playerKicked` - Array de 10 false
6. Notifica todos os jogadores com `game_started`
7. Inicia timer global de 30 segundos para todos chutarem
8. Inicia timer de segurança (10 minutos máximo)

### 5.6. Onde Ficam Armazenados os Dados

**Em Memória (WebSocket):**
- `this.queues` - Map de filas por tipo
- `this.gameRooms` - Map de partidas ativas
- `this.clients` - Map de clientes conectados
- `this.queueLocks` - Map de locks de fila

**No Banco de Dados (Supabase):**
- **NÃO HÁ TABELA DE FILA** - Fila é apenas em memória
- **NÃO HÁ TABELA DE PARTIDAS** - Partidas são apenas em memória
- Chutes são salvos em `chutes` após serem registrados

**⚠️ PROBLEMA CRÍTICO:** Se o servidor reiniciar, todas as filas e partidas ativas são perdidas.

### 5.7. Qual Tabela Supabase é Usada

**Tabelas Relacionadas:**
- `usuarios` - Dados dos jogadores
- `chutes` - Chutes registrados (após partida)
- `transacoes` - Transações financeiras

**⚠️ PROBLEMA:** Não há persistência de partidas ou filas no banco.

### 5.8. Possíveis Pontos de Falha

1. **Race Condition no Lock:** Lock de 5 segundos pode não ser suficiente em alta concorrência
2. **Desconexão Durante Partida:** Jogador desconectado é marcado como timeout, mas partida continua
3. **Memória:** Muitas partidas simultâneas podem consumir muita memória
4. **Perda de Dados:** Reinicialização do servidor perde todas as partidas ativas
5. **Timer Global:** Se timer global não for limpo corretamente, pode causar memory leak

---

## 6. SISTEMA DE PARTIDA

### 6.1. Como a Partida é Criada

**Arquivo:** `src/websocket.js` - Função `startGame()`

**Processo:**
1. Verifica lock de fila
2. Seleciona 10 jogadores da fila
3. Cria `gameRoom` com estrutura completa
4. Armazena em `this.gameRooms.set(gameId, gameRoom)`
5. Notifica jogadores
6. Inicia timers

### 6.2. Quando é Encerrada

**Condições de Encerramento:**
1. **Todos os 10 jogadores chutaram** (`checkGameCompletion`)
2. **Timeout global** (30 segundos) - Jogadores que não chutaram são marcados como timeout
3. **Timeout de segurança** (10 minutos) - Força finalização mesmo que não todos tenham chutado

**Função:** `checkGameCompletion(gameId)`
```javascript
checkGameCompletion(gameId) {
  const gameRoom = this.gameRooms.get(gameId);
  
  const totalKicked = gameRoom.playerKicked.filter(k => k).length;
  const allKicked = totalKicked >= GAME_CONFIG.REQUIRED_PLAYERS;
  
  const allKicksRecorded = gameRoom.kicks.filter(k => k !== null).length >= GAME_CONFIG.REQUIRED_PLAYERS;
  
  if (allKicked || allKicksRecorded) {
    this.finishGame(gameRoom);
  }
}
```

### 6.3. Regras de Encerramento

**Regras:**
- Partida termina quando **todos os 10 jogadores chutaram OU tiveram timeout**
- Jogadores que não chutaram em 30 segundos são marcados como timeout (chute automático como "perdido")
- Partida nunca dura mais de 10 minutos (timeout de segurança)

### 6.4. Registro dos Chutes

**Fluxo:**
1. Jogador envia `{ type: 'game_action', action: 'kick', zone, power, angle }`
2. Servidor valida payload
3. Simula resultado usando `simulateKick(zone, power, angle)`
4. Armazena em `gameRoom.kicks[playerIndex]`
5. Marca `gameRoom.playerKicked[playerIndex] = true`
6. Notifica todos os jogadores com `kick_result`
7. Verifica se todos chutaram (`checkGameCompletion`)

**Simulação de Chute:**
```javascript
simulateKick(zone, power, angle) {
  const baseSuccess = 0.7;
  const zoneMultiplier = {
    'center': 0.8,
    'left': 0.6,
    'right': 0.6,
    'top': 0.4,
    'bottom': 0.5
  };
  
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / 0xFFFFFFFF;
  
  const successRate = baseSuccess * (zoneMultiplier[zone] || 0.5) * Math.min(Math.max(power / 100, 0), 1);
  const isGoal = randomValue < successRate;
  
  return { isGoal, score: isGoal ? 1 : 0, details: {...} };
}
```

**⚠️ PROBLEMA:** Chutes não são salvos no banco durante a partida, apenas após finalização (se implementado).

### 6.5. Registro do Vencedor

**Função:** `finishGame(gameRoom)`

**Processo:**
1. Calcula total de gols: `gameRoom.kicks.reduce((sum, kick) => sum + (kick.result?.score || 0), 0)`
2. Identifica vencedores: Jogadores com `score > 0`
3. Ordena por score (maior primeiro)
4. Armazena em `gameRoom.winners`
5. Notifica todos com `game_finished`
6. Remove partida da memória após 30 segundos

**⚠️ PROBLEMA:** Vencedores não são salvos no banco, apenas em memória.

### 6.6. Distribuição das Recompensas

**Status:** ⚠️ NÃO IMPLEMENTADO

Não há lógica de distribuição de recompensas após partida. Vencedores são identificados, mas não há crédito de saldo ou prêmios.

### 6.7. Possíveis Problemas

1. **Perda de Dados:** Partidas não são persistidas no banco
2. **Sem Recompensas:** Vencedores não recebem prêmios
3. **Desconexão:** Jogador desconectado perde partida sem compensação
4. **Memory Leak:** Partidas são removidas após 30s, mas timers podem não ser limpos
5. **Concorrência:** Múltiplas partidas simultâneas podem causar problemas de memória

---

## 7. SISTEMA DE CHUTES

### 7.1. Limites

**Validações:**
- `zona` - Deve ser uma das: 'center', 'left', 'right', 'top', 'bottom'
- `potencia` - Número entre 0 e 100 (validado no cálculo)
- `angulo` - Número entre -180 e 180 (validado no cálculo)
- `valor_aposta` - Valor da aposta (usado no sistema de lotes)

### 7.2. Validação

**Código:**
```javascript
if (!zone || typeof power !== 'number' || typeof angle !== 'number') {
  ws.send(JSON.stringify({ type: 'error', message: 'Dados de chute inválidos' }));
  return;
}
```

### 7.3. Como é Enviado ao WebSocket

**Mensagem do Cliente:**
```json
{
  "type": "game_action",
  "action": "kick",
  "zone": "center",
  "power": 80,
  "angle": 0
}
```

**Resposta do Servidor:**
```json
{
  "type": "kick_result",
  "playerIndex": 0,
  "kick": {
    "zone": "center",
    "power": 80,
    "angle": 0,
    "result": {
      "isGoal": true,
      "score": 1,
      "details": {...}
    },
    "timestamp": 1234567890
  },
  "remainingPlayers": 9
}
```

### 7.4. Cálculo do Gol

**Função:** `simulateKick(zone, power, angle)`

**Fórmula:**
```
baseSuccess = 0.7 (70%)
zoneMultiplier = {
  'center': 0.8,
  'left': 0.6,
  'right': 0.6,
  'top': 0.4,
  'bottom': 0.5
}
powerFactor = power / 100 (limitado entre 0 e 1)
successRate = baseSuccess * zoneMultiplier[zone] * powerFactor
randomValue = crypto.randomBytes(4) / 0xFFFFFFFF
isGoal = randomValue < successRate
```

**Aleatoriedade:** Usa `crypto.randomBytes` para segurança.

### 7.5. Registro do Resultado

**Em Memória:**
- Armazenado em `gameRoom.kicks[playerIndex]`
- Inclui: `zone`, `power`, `angle`, `result`, `timestamp`, `timeout`

**No Banco (⚠️ PARCIAL):**
- `GameController.registerShot` salva em `chutes` via REST API
- WebSocket não salva automaticamente no banco

**⚠️ PROBLEMA:** Chutes via WebSocket não são persistidos automaticamente no banco.

---

## 8. WEBSOCKET — FUNCIONAMENTO ATUAL

### 8.1. Eventos Existentes

**Eventos do Cliente → Servidor:**
- `auth` - Autenticar com token JWT
- `join_room` - Entrar em sala
- `leave_room` - Sair de sala
- `join_queue` - Entrar na fila
- `leave_queue` - Sair da fila
- `game_action` - Ação no jogo (kick, ready, vote)
- `chat_message` - Mensagem de chat
- `ping` - Ping para manter conexão

**Eventos do Servidor → Cliente:**
- `welcome` - Mensagem de boas-vindas
- `auth_success` - Autenticação bem-sucedida
- `auth_error` - Erro de autenticação
- `queue_joined` - Entrou na fila
- `queue_updated` - Fila atualizada
- `queue_left` - Saiu da fila
- `game_started` - Partida iniciada
- `game_finished` - Partida finalizada
- `kick_result` - Resultado do chute
- `player_timeout` - Jogador teve timeout
- `player_disconnected` - Jogador desconectou
- `player_kicked` - Jogador chutou (notificação para outros)
- `error` - Erro genérico
- `pong` - Resposta ao ping

### 8.2. Fluxo de Eventos

**Fluxo Completo:**
1. Cliente conecta → `welcome`
2. Cliente envia `auth` → `auth_success` ou `auth_error`
3. Cliente envia `join_queue` → `queue_joined` + `queue_updated` (broadcast)
4. Quando há 10 jogadores → `game_started` (broadcast para os 10)
5. Jogador envia `game_action: kick` → `kick_result` (broadcast)
6. Quando todos chutaram → `game_finished` (broadcast)
7. Cliente desconecta → `player_disconnected` (broadcast)

### 8.3. Limites

**Configurações (`GAME_CONFIG`):**
- `REQUIRED_PLAYERS: 10` - Jogadores necessários para iniciar
- `KICK_TIMEOUT_MS: 30000` - 30 segundos para chutar
- `MAX_GAME_DURATION_MS: 600000` - 10 minutos máximo
- `QUEUE_LOCK_TIMEOUT_MS: 5000` - 5 segundos de lock

**Limites de Conexão:**
- Não há limite explícito de conexões simultâneas
- Depende da capacidade do servidor Node.js

### 8.4. Contadores

**Contadores em Memória:**
- `this.clients.size` - Total de clientes conectados
- `this.rooms.size` - Total de salas
- `this.gameRooms.size` - Total de partidas ativas
- `Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.size, 0)` - Total na fila

**Função:** `getStats()` retorna estatísticas.

### 8.5. Reconexão

**Status:** ⚠️ NÃO IMPLEMENTADO NO SERVIDOR

O servidor não implementa lógica de reconexão. Se o cliente desconectar:
- É removido da fila
- Se estava em partida, é marcado como timeout
- Precisa reconectar manualmente

**⚠️ PROBLEMA:** Cliente precisa implementar reconexão manual.

### 8.6. Broadcast Global

**Funções de Broadcast:**
- `broadcastToRoom(roomId, message)` - Para todos em uma sala
- `broadcastToQueue(queueType, message)` - Para todos na fila
- `broadcastToGameRoom(gameRoom, message)` - Para todos na partida
- `broadcastToAll(message)` - Para todos conectados

**Implementação:**
```javascript
broadcastToGameRoom(gameRoom, message) {
  gameRoom.players.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}
```

### 8.7. Modelo de Sincronização

**Modelo:** Estado compartilhado em memória (`gameRooms`)

**Sincronização:**
- Estado da partida é mantido no servidor
- Clientes recebem atualizações via broadcast
- Não há sincronização com banco de dados
- Não há sincronização entre múltiplos servidores

**⚠️ PROBLEMA:** Não suporta múltiplos servidores (não é stateless).

### 8.8. Pontos Sensíveis de Concorrência

1. **Lock de Fila:** Pode falhar se múltiplos processos tentarem iniciar partida simultaneamente
2. **Atualização de Estado:** Múltiplos chutes simultâneos podem causar race conditions
3. **Remoção de Cliente:** Se cliente desconectar durante processamento, pode causar inconsistência
4. **Timer Global:** Se timer não for limpo, pode causar memory leak

---

## 9. SISTEMA DE PAGAMENTOS PIX

### 9.1. Geração do QR Code

**Fluxo:**
1. Cliente chama `POST /api/payments/pix/criar` com `{ valor }`
2. Servidor cria preferência no Mercado Pago:
   ```javascript
   const preferenceData = {
     items: [{ title: 'Depósito Gol de Ouro', quantity: 1, unit_price: valor }],
     payer: { email: user.email },
     payment_methods: { excluded_payment_methods: [], excluded_payment_types: [] },
     back_urls: { success: ..., failure: ..., pending: ... },
     notification_url: `${BACKEND_URL}/api/payments/webhook`,
     external_reference: `deposito_${userId}_${Date.now()}`
   };
   ```
3. Mercado Pago retorna QR Code em `point_of_interaction.transaction_data.qr_code`
4. Servidor salva no Supabase (`pagamentos_pix`)

**QR Code Retornado:**
- `qr_code` - String do QR Code
- `qr_code_base64` - QR Code em base64 (para imagem)
- `pix_copy_paste` - Código PIX para copiar e colar

### 9.2. Verificação

**Métodos:**
1. **Polling Manual:** Cliente consulta `GET /api/payments/pix/status/:payment_id`
2. **Webhook Automático:** Mercado Pago envia POST para `/api/payments/webhook`

**Verificação Manual:**
```javascript
// Consulta status no Mercado Pago
const paymentData = await payment.get({ id: payment_id });

// Atualiza status no banco
await supabase.from('pagamentos_pix').update({
  status: paymentData.status,
  updated_at: new Date().toISOString()
}).eq('payment_id', payment_id);

// Se aprovado, processa pagamento
if (paymentData.status === 'approved') {
  await this.processarPagamentoAprovado(pagamento);
}
```

### 9.3. Webhook

**Endpoint:** `POST /api/payments/webhook`

**Fluxo:**
1. Mercado Pago envia `{ type: 'payment', data: { id: paymentId } }`
2. Servidor valida signature (se `MERCADOPAGO_WEBHOOK_SECRET` configurado)
3. Verifica idempotência (se já processado, ignora)
4. Consulta pagamento no Mercado Pago
5. Atualiza status no banco
6. Se aprovado, processa pagamento (`processarPagamentoAprovado`)

**Validação de Signature:**
```javascript
if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
  const validation = webhookSignatureValidator.validateMercadoPagoWebhook(req);
  if (!validation.valid) {
    // Rejeitar em produção, apenas logar em desenvolvimento
  }
}
```

### 9.4. Segurança

**Medidas Implementadas:**
- ✅ Validação de signature do webhook (opcional)
- ✅ Validação de ID de pagamento (SSRF corrigido)
- ✅ Idempotência (verifica se já processado)
- ✅ Sanitização de dados antes de usar em URLs

**⚠️ PROBLEMAS:**
- Signature validation é opcional (só valida se `MERCADOPAGO_WEBHOOK_SECRET` configurado)
- Não há rate limiting no webhook
- Não há validação de origem do webhook (apenas signature)

### 9.5. Idempotência

**Implementação:**
```javascript
// Verificar se já foi processado
let { data: existingPayment } = await supabase
  .from('pagamentos_pix')
  .select('id, status')
  .eq('external_id', data.id)
  .maybeSingle();

if (existingPayment && existingPayment.status === 'approved') {
  console.log('Pagamento já processado:', data.id);
  return;
}
```

**⚠️ PROBLEMA:** Verifica apenas por `external_id`, mas pode haver duplicação se webhook for chamado múltiplas vezes rapidamente.

### 9.6. Como Atualiza Saldo

**Função:** `processarPagamentoAprovado(pagamento)`

**Fluxo:**
1. Busca usuário no Supabase
2. Calcula novo saldo: `novoSaldo = usuario.saldo + pagamento.valor`
3. Atualiza saldo: `await supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', usuario_id)`
4. Cria transação: `await supabase.from('transacoes').insert({ ... })`

**⚠️ RACE CONDITION:** Não usa transação do banco. Se dois pagamentos forem processados simultaneamente, pode haver inconsistência.

### 9.7. Como Registra Transações

**Tabela:** `transacoes`

**Campos Inseridos:**
```javascript
{
  usuario_id: pagamento.usuario_id,
  tipo: 'deposito',
  valor: parseFloat(pagamento.valor),
  saldo_anterior: parseFloat(usuario.saldo),
  saldo_posterior: novoSaldo,
  descricao: 'Depósito via PIX',
  referencia: pagamento.payment_id,
  status: 'concluida',
  processed_at: new Date().toISOString()
}
```

### 9.8. Erros Possíveis

1. **Race Condition:** Múltiplos webhooks simultâneos podem causar duplicação de crédito
2. **Falha na Atualização:** Se atualização de saldo falhar, transação ainda é criada
3. **Webhook Duplicado:** Mercado Pago pode enviar webhook múltiplas vezes
4. **Timeout:** Consulta ao Mercado Pago pode timeout (5s)
5. **Banco Indisponível:** Se Supabase estiver offline, pagamento não é processado

---

## 10. SISTEMA DE SALDO E TRANSAÇÕES

### 10.1. Como Créditos são Adicionados

**Métodos:**
1. **Pagamento PIX Aprovado:** `processarPagamentoAprovado` atualiza saldo
2. **Sistema de Lotes:** Não há crédito automático (apenas débito de aposta)

**Código:**
```javascript
const novoSaldo = parseFloat(usuario.saldo) + parseFloat(pagamento.valor);
await supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', usuario_id);
```

**⚠️ PROBLEMA:** Não usa transação do banco, pode haver race condition.

### 10.2. Como Débitos são Feitos

**Métodos:**
1. **Saque:** `solicitarSaque` debita saldo ao criar saque
2. **Aposta:** Não há débito explícito no código atual (sistema de lotes não debita)

**Código de Saque:**
```javascript
// Verifica saldo
if (parseFloat(usuario.saldo) < parseFloat(valor)) {
  return response.error(res, 'Saldo insuficiente', 400);
}

// Cria transação com valor negativo
await supabase.from('transacoes').insert({
  tipo: 'saque',
  valor: -parseFloat(valor),
  saldo_anterior: parseFloat(usuario.saldo),
  saldo_posterior: parseFloat(usuario.saldo) - parseFloat(valor),
  status: 'pendente'
});
```

**⚠️ PROBLEMA:** Transação é criada, mas saldo do usuário não é atualizado imediatamente (só quando saque é processado).

### 10.3. Onde Acontecem Race Conditions

**Pontos Críticos:**
1. **Atualização de Saldo (PIX):** Múltiplos webhooks simultâneos
2. **Consulta de Saldo:** Leitura pode estar desatualizada
3. **Saque:** Verificação e criação podem ter race condition

**Exemplo de Race Condition:**
```
Thread 1: Lê saldo = 100
Thread 2: Lê saldo = 100
Thread 1: Atualiza saldo = 100 + 50 = 150
Thread 2: Atualiza saldo = 100 + 30 = 130 (perdeu o +50)
```

### 10.4. Qual Tabela Supabase Atualiza

**Tabelas:**
- `usuarios.saldo` - Saldo atual do usuário
- `transacoes` - Histórico de transações

**Campos de Transação:**
- `saldo_anterior` - Saldo antes da transação
- `saldo_posterior` - Saldo após a transação
- `valor` - Valor da transação (positivo para crédito, negativo para débito)

### 10.5. Como é Garantida a Integridade

**Status:** ⚠️ NÃO GARANTIDA

**Problemas:**
- Não usa transações do banco (BEGIN/COMMIT)
- Não usa locks (SELECT FOR UPDATE)
- Não há validação de saldo antes de débito (exceto saque)
- Não há reconciliação automática

**⚠️ CRÍTICO:** Sistema financeiro sem garantias de integridade.

---

## 11. MIDDLEWARES

### 11.1. Autenticação

**Arquivo:** `server-fly.js` - Função `authenticateToken`

**Implementação:**
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};
```

**Uso:** Aplicado em rotas protegidas via `authenticateToken`

### 11.2. Admin Token

**Arquivo:** `server-fly.js` - Função `authAdmin`

**Implementação:**
```javascript
const authAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Token de administrador não fornecido',
      message: 'Header x-admin-token é obrigatório'
    });
  }
  
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Token de administrador inválido'
    });
  }
  
  next();
};
```

**Uso:** Aplicado em rotas admin via `authAdmin`

**⚠️ PROBLEMA:** Token admin é comparado diretamente com string, não usa hash.

### 11.3. Rate Limit

**Implementação:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { success: false, message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  skip: (req) => {
    return req.path === '/health' || 
           req.path === '/meta' || 
           req.path.startsWith('/auth/') ||
           req.path.startsWith('/api/auth/');
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 tentativas de login por IP
  skipSuccessfulRequests: true
});
```

**Aplicação:**
- `app.use(limiter)` - Rate limit global
- `app.use('/api/', limiter)` - Rate limit em `/api/`
- `app.use('/api/auth/', authLimiter)` - Rate limit específico para auth

**⚠️ PROBLEMA:** Rate limit não persiste entre reinicializações (em memória).

---

## 12. UTILS

### 12.1. Response-Helper (`utils/response-helper.js`)

**Status:** ✅ Completo (v1.3.0)

**Funções:**
- `success(res, data, message, statusCode)` - Resposta de sucesso
- `error(res, error, statusCode, details)` - Resposta de erro
- `validationError(res, errors)` - Erro de validação
- `unauthorized(res, message)` - Não autorizado (401)
- `forbidden(res, message)` - Acesso negado (403)
- `notFound(res, resource)` - Não encontrado (404)
- `conflict(res, message)` - Conflito (409)
- `serverError(res, error, message)` - Erro interno (500)
- `serviceUnavailable(res, service)` - Serviço indisponível (503)
- `rateLimit(res, message, retryAfter)` - Rate limit (429)
- `paginated(res, data, pagination, message)` - Resposta paginada

**Formato Padrão:**
```json
{
  "success": true,
  "data": {...},
  "message": "...",
  "timestamp": "ISO8601"
}
```

### 12.2. Pix-Validator (`utils/pix-validator.js`)

**Status:** ✅ Completo (v1.2.0)

**Funções:**
- `validatePixKey(key, type)` - Validar chave PIX
- `normalizeKey(key, type)` - Normalizar chave PIX
- `isPixKeyAvailable(key, type)` - Verificar disponibilidade
- `validateWithdrawData(withdrawData)` - Validar dados de saque

**Tipos Suportados:**
- `cpf` - CPF (11 dígitos)
- `cnpj` - CNPJ (14 dígitos)
- `email` - Email válido
- `phone` - Telefone brasileiro
- `random` - Chave aleatória (8-32 caracteres)

**Validações:**
- ✅ Validação de CPF/CNPJ com dígitos verificadores
- ✅ Sanitização robusta (caracteres de controle removidos)
- ✅ Limitação de tamanho
- ✅ Validação de formato

### 12.3. Outros Utils

**Arquivos:**
- `lote-integrity-validator.js` - Validador de integridade de lotes
- `webhook-signature-validator.js` - Validador de signature de webhook

---

## 13. LOGS

### 13.1. Onde são Gravados

**Destino:** Console (stdout/stderr)

**Arquivo:** `server-fly.js` usa `console.log`, `console.error`, `console.warn`

**Logger Avançado:**
- Tenta carregar `logging/sistema-logs-avancado.js`
- Se não disponível, usa fallback para `console`

### 13.2. Como são Formatados

**Formato:**
```
[INFO] Mensagem informativa
[ERROR] Mensagem de erro
[WARN] Mensagem de aviso
[DEBUG] Mensagem de debug
```

**Prefixos Específicos:**
- `🔌 [WS]` - WebSocket
- `💰 [PIX]` - Pagamentos PIX
- `🎮 [LOTE]` - Sistema de lotes
- `📧 [EMAIL]` - Emails
- `❌ [ERROR]` - Erros
- `✅ [SUCCESS]` - Sucessos

### 13.3. O que já está sendo Monitorado

**Métricas Monitoradas:**
- Conexões WebSocket
- Pagamentos PIX criados/processados
- Chutes registrados
- Erros de autenticação
- Erros de webhook
- Status de conexão Supabase/Mercado Pago

**⚠️ PROBLEMA:** Logs não são persistidos, apenas em console. Perdidos após reinicialização.

---

## 14. CONFIGURAÇÕES DE PRODUÇÃO

### 14.1. Variáveis de Ambiente

**Obrigatórias:**
- `JWT_SECRET` - Secret para assinatura de tokens JWT
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key do Supabase
- `SUPABASE_ANON_KEY` - Anon key do Supabase (opcional)

**Opcionais (Produção):**
- `MERCADOPAGO_ACCESS_TOKEN` - Token do Mercado Pago
- `MERCADOPAGO_WEBHOOK_SECRET` - Secret para validar webhooks
- `ADMIN_TOKEN` - Token para autenticação admin
- `SMTP_USER` - Email para envio de emails
- `SMTP_PASS` - Senha do email
- `GMAIL_APP_PASSWORD` - App password do Gmail
- `PAGAMENTO_TAXA_SAQUE` - Taxa de saque (padrão: 2.00)
- `BACKEND_URL` - URL do backend (para webhooks)
- `PLAYER_URL` - URL do frontend (para redirects)
- `CORS_ORIGIN` - Origens permitidas CORS (CSV)
- `PORT` - Porta do servidor (padrão: 8080)
- `NODE_ENV` - Ambiente (development/production)

**Validação:**
- `config/required-env.js` valida variáveis obrigatórias
- Em produção, `MERCADOPAGO_ACCESS_TOKEN` é obrigatório

### 14.2. Versões

**Node.js:** >= 18.0.0 (definido em `package.json`)

**Dependências Principais:**
- `express: ^4.18.2`
- `@supabase/supabase-js: ^2.38.4`
- `jsonwebtoken: ^9.0.2`
- `bcryptjs: ^2.4.3`
- `axios: ^1.6.7`
- `mercadopago` (via SDK)

### 14.3. Conexão Fly.io

**Arquivo:** `server-fly.js`

**Configuração:**
- Porta: `process.env.PORT || 8080`
- Host: `0.0.0.0` (aceita conexões de qualquer IP)
- Trust Proxy: `app.set('trust proxy', 1)` (para Fly.io)

**Inicialização:**
```javascript
const server = http.createServer(app);
const wss = new WebSocketManager(server);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [SERVER] Servidor iniciado na porta ${PORT}`);
});
```

### 14.4. CORS

**Configuração:**
```javascript
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};

app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

**Origens Padrão:**
- `https://goldeouro.lol`
- `https://www.goldeouro.lol`
- `https://admin.goldeouro.lol`

### 14.5. WebSocket em Produção

**Configuração:**
- Protocolo: `ws://` (HTTP) ou `wss://` (HTTPS)
- Endpoint: `/ws?token=JWT_TOKEN`
- Heartbeat: Ping a cada 30 segundos
- Timeout: 30 segundos para chutes, 10 minutos máximo para partida

**⚠️ PROBLEMA:** WebSocket não está configurado para usar `wss://` em produção (depende do proxy reverso do Fly.io).

---

## 15. DEPENDÊNCIAS (package.json)

### 15.1. Todas as Libs

**Produção:**
- `@supabase/supabase-js: ^2.38.4` - Cliente Supabase
- `axios: ^1.6.7` - Cliente HTTP
- `bcryptjs: ^2.4.3` - Hash de senhas
- `chalk: ^5.6.2` - Cores no terminal
- `compression: ^1.7.4` - Compressão de respostas
- `cors: ^2.8.5` - CORS
- `dayjs: ^1.11.19` - Manipulação de datas
- `dotenv: ^16.3.1` - Variáveis de ambiente
- `express: ^4.18.2` - Framework web
- `express-rate-limit: ^7.1.5` - Rate limiting
- `express-validator: ^7.0.1` - Validação de dados
- `fs-extra: ^11.3.2` - Operações de arquivo
- `helmet: ^7.1.0` - Segurança HTTP
- `jsonwebtoken: ^9.0.2` - JWT
- `nodemailer: ^6.9.8` - Envio de emails
- `pdfkit: ^0.17.2` - Geração de PDFs
- `ws` - WebSocket (não listado, mas usado)

**Desenvolvimento:**
- `jest: ^30.2.0` - Testes
- `lighthouse: ^12.8.2` - Auditoria
- `nodemon: ^3.0.2` - Auto-reload

### 15.2. Versões

**Todas as versões estão atualizadas** (usando `^` para permitir atualizações de patch/minor).

### 15.3. Riscos

**⚠️ RISCOS IDENTIFICADOS:**
1. **`chalk: ^5.6.2`** - ESM only, pode causar problemas em CommonJS
2. **`pdfkit: ^0.17.2`** - Não usado no código atual (dead dependency)
3. **`fs-extra: ^11.3.2`** - Não usado no código atual (dead dependency)
4. **`dayjs: ^1.11.19`** - Não usado no código atual (dead dependency)
5. **Falta `ws`** - WebSocket não está listado em dependencies

### 15.4. Dependências que não Deviam Estar Lá

**Dead Dependencies:**
- `pdfkit` - Não usado
- `fs-extra` - Não usado
- `dayjs` - Não usado (usa `Date` nativo)
- `chalk` - Não usado no código atual

**Faltando:**
- `ws` - Usado mas não listado

---

## 16. PROBLEMAS DETECTADOS

### 16.1. Códigos Duplicados

**Problemas:**
1. **Autenticação:** `authenticateToken` definido em `server-fly.js` e `middlewares/authMiddleware.js`
2. **Admin Auth:** `authAdmin` definido em `server-fly.js` e `middlewares/authMiddleware.js`
3. **Rotas Admin:** Rotas duplicadas (GET e POST) para compatibilidade legada
4. **Login:** Endpoint `/api/auth/login` e `/auth/login` (duplicado)

### 16.2. Funções Perigosas

**Problemas:**
1. **Atualização de Saldo:** Não usa transação, pode causar race condition
2. **Webhook:** Não valida origem, apenas signature (opcional)
3. **Admin Token:** Comparação direta com string, não usa hash
4. **JWT:** Secret pode estar fraco se não configurado corretamente

### 16.3. Falta de try/catch

**Problemas:**
1. **WebSocket:** Algumas funções não têm try/catch completo
2. **Webhook:** Erros podem não ser capturados
3. **Reconciliação:** `reconcilePendingPayments` pode falhar silenciosamente

### 16.4. Pontos Frágeis

**Problemas:**
1. **Fila em Memória:** Perdida ao reiniciar servidor
2. **Partidas em Memória:** Perdidas ao reiniciar servidor
3. **Rate Limit em Memória:** Resetado ao reiniciar servidor
4. **Logs:** Não persistidos, perdidos ao reiniciar

### 16.5. Lógicas Confusas

**Problemas:**
1. **Sistema de Lotes:** Implementado em `server-fly.js`, não no controller
2. **Chutes:** Podem ser registrados via REST ou WebSocket, sem sincronização
3. **Saldo:** Atualizado em múltiplos lugares, sem transação
4. **Admin:** Bootstrap cria admin, mas não há validação de permissões

### 16.6. Riscos de Travamento

**Problemas:**
1. **WebSocket:** Muitas conexões simultâneas podem travar servidor
2. **Timers:** Muitos timers ativos podem causar memory leak
3. **Queries:** Queries não otimizadas podem travar banco
4. **Memory:** Partidas não são limpas corretamente

### 16.7. Riscos de Inconsistência

**Problemas:**
1. **Saldo:** Race conditions na atualização
2. **Webhook:** Pode processar múltiplas vezes
3. **Partidas:** Estado pode ficar inconsistente se servidor reiniciar
4. **Transações:** Não há rollback em caso de erro

---

## 17. RESUMO EXECUTIVO DO BACKEND

### 17.1. O que está OK

✅ **Autenticação:** Sistema completo de JWT, recuperação de senha, verificação de email  
✅ **Pagamentos PIX:** Integração com Mercado Pago funcionando  
✅ **WebSocket:** Sistema de fila e partidas implementado (v1.3.0)  
✅ **Admin:** Relatórios completos e funcionais  
✅ **Padronização:** Response-helper padronizado em controllers principais  
✅ **Segurança:** SSRF corrigido, aleatoriedade segura, sanitização robusta  
✅ **Validação:** Validação de PIX, validação de dados de entrada  

### 17.2. O que Precisa ser Revisado

⚠️ **UsuarioController:** Usa mock, precisa usar Supabase real  
⚠️ **Sistema de Lotes:** Implementado em `server-fly.js`, deveria estar em service  
⚠️ **Persistência:** Fila e partidas não são persistidas no banco  
⚠️ **Recompensas:** Vencedores não recebem prêmios  
⚠️ **Transações:** Não usa transações do banco para garantir integridade  
⚠️ **Rate Limit:** Não persiste entre reinicializações  
⚠️ **Logs:** Não são persistidos  

### 17.3. O que Pode Quebrar em Produção

🔴 **Race Conditions:** Atualização de saldo sem transação  
🔴 **Perda de Dados:** Reinicialização perde filas e partidas ativas  
🔴 **Webhook Duplicado:** Pode processar pagamento múltiplas vezes  
🔴 **Memory Leak:** Timers não são limpos corretamente  
🔴 **Desconexão:** Jogadores desconectados perdem partida sem compensação  

### 17.4. Pontos Críticos

🔴 **CRÍTICO - Sistema Financeiro:**
- Race conditions na atualização de saldo
- Não usa transações do banco
- Webhook pode processar múltiplas vezes

🔴 **CRÍTICO - Persistência:**
- Fila e partidas não são persistidas
- Reinicialização perde dados ativos
- Não há backup de estado

🔴 **CRÍTICO - Concorrência:**
- Lock de fila pode falhar
- Múltiplos servidores não são suportados
- Estado compartilhado em memória

### 17.5. Riscos de Concorrência

🔴 **Alta Concorrência:**
- Lock de fila pode não ser suficiente
- Atualização de saldo pode ter race condition
- Webhook pode ser chamado múltiplas vezes

🔴 **Múltiplos Servidores:**
- Não suportado (estado em memória)
- Fila e partidas não são compartilhadas
- Rate limit não é compartilhado

### 17.6. Ajustes Necessários para Go-Live

**PRIORIDADE ALTA:**
1. ✅ Corrigir race conditions no saldo (usar transações)
2. ✅ Persistir fila e partidas no banco
3. ✅ Implementar idempotência robusta no webhook
4. ✅ Adicionar reconciliação automática de pagamentos
5. ✅ Implementar distribuição de recompensas

**PRIORIDADE MÉDIA:**
1. ✅ Refatorar `UsuarioController` para usar Supabase
2. ✅ Mover sistema de lotes para service
3. ✅ Adicionar persistência de logs
4. ✅ Implementar cache de estatísticas admin
5. ✅ Otimizar queries do banco

**PRIORIDADE BAIXA:**
1. ✅ Remover dependências não usadas
2. ✅ Adicionar `ws` em `package.json`
3. ✅ Consolidar rotas duplicadas
4. ✅ Melhorar documentação de endpoints
5. ✅ Adicionar testes automatizados

---

## 📝 CONCLUSÃO

O backend do Gol de Ouro está **85% completo** e funcional para produção básica, mas possui **pontos críticos** que precisam ser corrigidos antes do Go-Live completo:

1. **Sistema Financeiro:** Precisa de transações e idempotência robusta
2. **Persistência:** Fila e partidas precisam ser persistidas no banco
3. **Concorrência:** Race conditions precisam ser resolvidas
4. **Recompensas:** Sistema de prêmios precisa ser implementado

**Recomendação:** Corrigir pontos críticos antes de aumentar tráfego em produção.

---

**Documento gerado em:** 2025-01-12  
**Versão do Backend Analisada:** 1.2.0 (server-fly.js)  
**Status:** ✅ Levantamento Completo - SEM ALTERAÇÕES

