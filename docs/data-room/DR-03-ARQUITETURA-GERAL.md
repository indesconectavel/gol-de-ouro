# DR-03 — Arquitetura Geral da Plataforma

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — arquitetura documentada a partir de evidências do repositório  
**Documentos relacionados:** [`DR-01`](./DR-01-RESUMO-EXECUTIVO.md) (Resumo Executivo — **presente desde H2.5**), DR-02 (Inventário), `docs/arquitetura/PAYMENT-ENGINE-V1.md`  
**Repositório:** monorepo `goldeouro-backend`

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> Corpo datado **2026-06-23** = **NARRATIVA ORIGINAL**. Fatos arquiteturais atuais: **H0**, **H2A**, **P1.9**, **G2**, `docs/payment-engine/01–12`.

| Afirmação histórica típica neste DR | Estado oficial |
|-------------------------------------|----------------|
| Asaas “planejado / sem código” | **HISTÓRICO** — código + operação/homologação Asaas existentes |
| Gap dominante = PIX OUT automático inexistente | **SUBSTITUÍDO:** OUT Asaas + Recovery Job (P1.9); staging workers OFF por design |
| DR-01 ausente | **Resolvido** (H2.5) |
| PE só como pasta parcial | **IPE™** com Facade P2.2 + Compat Layer + Provider Layer |
| Sem homologação permanente Fly | **Existe** — `fly.staging.toml` / G2 |

Desacoplamento recomendado (**sem antecipar**): **B** módulo interno → **C** pacote → **D** repo → **E** produto (H2A).

---

# 1. Resumo Executivo

O Gol de Ouro™ é uma plataforma de **entretenimento com premiação financeira** construída como **monorepo full-stack**, composta por frontends React (player e admin), backend Node.js/Express, banco PostgreSQL via Supabase e integrações com provedores de pagamento (PSP).

### Filosofia arquitetural observada

| Princípio | Manifestação no repositório |
|-----------|----------------------------|
| **Monólito operacional** | Toda a API HTTP de produção vive em `server-fly.js` (~4.700 linhas, 44 rotas inline) |
| **Lógica crítica no banco** | Gameplay e crédito PIX IN são **RPCs PostgreSQL atômicas** — fonte da verdade fora do Node |
| **Wallet + ledger dual-layer** | Saldo mutável (`usuarios.saldo`) + trilha imutável (`ledger_financeiro`) |
| **Evolução incremental** | Payment Engine (`src/finance/`) introduzida sem reescrever jogo ou wallet |
| **Deploy cloud-native** | Fly.io (backend), Vercel (frontends), Supabase (dados), GitHub Actions (CI/CD) |
| **Governança por documentação** | ~1.830 artefatos Markdown — auditorias, runbooks, certificação |

### Resposta direta: como a plataforma funciona?

O jogador acessa o **frontend player** (Vercel), autentica-se via **JWT**, deposita via **PIX IN Mercado Pago**, joga chamando **`POST /api/games/shoot`** que delega à RPC **`shoot_apply`**, movimenta saldo internamente, e solicita saque via **`POST /api/withdraw/request`**. O saque debita wallet, registra ledger, e — se automático — é processado por **worker Fly** via **Payment Engine** → **Mercado Pago Payouts**. Operadores gerenciam tudo pelo **admin** (Vercel) via rotas `/api/admin/*`.

---

# 2. Arquitetura Conceitual

## 2.1 Diagrama de camadas

```text
                    ┌─────────────────────────────────────┐
                    │           USUÁRIO / ADMIN           │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │              FRONTEND               │
                    │  goldeouro-player  │  goldeouro-admin │
                    │     (React/Vite/PWA)                  │
                    └─────────────────┬───────────────────┘
                                      │ HTTPS + JWT
                    ┌─────────────────▼───────────────────┐
                    │           BACKEND API               │
                    │         server-fly.js               │
                    │    (+ payout-worker process)        │
                    └───────┬─────────┬─────────┬───────────┘
                            │         │         │
         ┌──────────────────┘         │         └──────────────────┐
         ▼                              ▼                              ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  GAME ENGINE    │          │     WALLET      │          │ PAYMENT ENGINE  │
│  RPC shoot_apply│          │ usuarios.saldo  │          │ src/finance/    │
│  lotes + chutes │          │                 │          │ Factory+Providers│
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         LEDGER (auditoria)          │
                    │       ledger_financeiro             │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │      BANCO DE DADOS (Supabase)      │
                    │         PostgreSQL                  │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │     PROVEDORES FINANCEIROS (PSP)   │
                    │  Mercado Pago (prod) │ Celcoin (prep)│
                    │  Asaas (planejado)   │ Efí (spike)   │
                    └─────────────────────────────────────┘
```

## 2.2 Explicação das camadas

| Camada | Responsabilidade | Evidência |
|--------|------------------|-----------|
| **Frontend** | UI jogador e admin; consome REST API | `goldeouro-player/`, `goldeouro-admin/` |
| **Backend API** | Auth, rotas HTTP, webhooks PSP, orquestração | `server-fly.js` |
| **Game Engine** | Sorteio, lotes, prêmios, débito/crédito de aposta | RPC `shoot_apply` |
| **Wallet** | Saldo disponível do jogador | `usuarios.saldo` |
| **Ledger** | Trilha auditável imutável | `ledger_financeiro` |
| **Payment Engine** | Abstração multi-PSP para payout (parcial) | `src/finance/` |
| **Banco** | Persistência, transações atômicas, RLS | Supabase + `database/` |
| **PSPs** | PIX IN/OUT externo | MP produção; Celcoin prep |

---

# 3. Arquitetura Física

## 3.1 Diagrama de deploy

```text
Jogador (browser/PWA)
        │
        ▼ HTTPS
┌───────────────────┐
│      VERCEL       │  goldeouro-player
│  goldeouro.lol    │  CI: frontend-deploy.yml
└─────────┬─────────┘
          │
          │  REST API (VITE_API_URL / BACKEND_URL)
          ▼
┌───────────────────┐       ┌───────────────────┐
│      FLY.IO       │       │      VERCEL       │
│ goldeouro-backend │       │  goldeouro-admin  │
│      -v2          │       │ admin.goldeouro   │
│  região: GRU      │       │      .lol         │
│                   │       └─────────┬─────────┘
│  Processos:       │                 │
│  • app (HTTP)     │◄────────────────┘
│  • payout_worker  │
└─────────┬─────────┘
          │
          │  Supabase client (service role)
          ▼
┌───────────────────┐       ┌───────────────────┐
│     SUPABASE      │       │  MERCADO PAGO     │
│   PostgreSQL      │       │  (PIX IN/OUT)     │
└───────────────────┘       └───────────────────┘
          ▲
          │  Webhooks MP
          └─────────────────── Fly.io (server-fly.js)

┌───────────────────┐
│      GITHUB       │
│  Actions CI/CD    │  backend-deploy.yml → Fly
│  security.yml     │  frontend-deploy.yml → Vercel
│  health-monitor   │
└───────────────────┘
```

## 3.2 Ambientes

| Ambiente | Componentes | Evidência |
|----------|-------------|-----------|
| **Produção** | Fly `goldeouro-backend-v2`, Vercel prod, Supabase prod | `fly.toml`, `NODE_ENV=production`, domínios documentados |
| **Staging** | Supabase staging bootstrap | `database/staging/`, docs F2-2B |
| **Sandbox financeiro** | Scripts MP/Celcoin/Efí | `scripts/payouts/`, `test-celcoin-auth.mjs` |
| **Desenvolvimento local** | `npm run dev`, Vite dev servers | `package.json`, `.env.example` |

## 3.3 Recursos compute (Fly.io)

| Processo | Comando | Recursos |
|----------|---------|----------|
| `app` | `npm start` → `server-fly.js` | 1 CPU shared, 256 MB, concurrency 100/200 |
| `payout_worker` | `node src/workers/payout-worker.js` | Mesmo app Fly, processo separado |

Health check: `GET /health` a cada 30s.

---

# 4. Arquitetura Lógica

## 4.1 Módulos e responsabilidades

### Autenticação

| Componente | Localização | Responsabilidade |
|------------|-------------|------------------|
| Registro/login | `server-fly.js` `/api/auth/*` | JWT + bcrypt + Supabase `usuarios` |
| Middleware JWT | `server-fly.js` `authenticateToken` | Bearer token em rotas protegidas |
| Admin RBAC | `requireAdministradorDb` | Flag administrador no banco |
| Recuperação senha | `/api/auth/forgot-password`, `reset-password` | Tokens + `emailService.js` |
| Rate limit login | `loginLimiter`, `recoveryLimiter` | 5 req/15min |

### Gameplay

| Componente | Localização | Responsabilidade |
|------------|-------------|------------------|
| HTTP shoot | `POST /api/games/shoot` | Valida request → chama RPC |
| Engine | `shoot_apply` (PostgreSQL) | Lotes, sorteio, prêmios, saldo |
| Histórico | `GET /api/games/chutes/recentes` | Lista chutes do usuário |
| UI jogo | `goldeouro-player` `/game`, `/gameshoot` | Penalty shoot frontend |
| Integridade lotes | `utils/lote-integrity-validator.js` | Validação ops |

### Financeiro

| Componente | Localização | Responsabilidade |
|------------|-------------|------------------|
| PIX IN | `server-fly.js` `/api/payments/pix/*` | Cobrança MP + webhook |
| PIX OUT request | `POST /api/withdraw/request` | Debita wallet, cria saque |
| PIX OUT process | `processPendingWithdrawals.js` + worker | Envia ao PSP |
| Webhooks | `/api/payments/webhook`, `/webhooks/mercadopago` | Confirma IN/OUT |
| Payment Engine | `src/finance/` | Factory + providers |
| Admin financeiro | `/api/admin/withdraw/*`, `/financial/report` | Ops manual/automático |

### Painel Administrativo

| Componente | Localização | Responsabilidade |
|------------|-------------|------------------|
| SPA Admin | `goldeouro-admin/` | UI operacional |
| API admin | `server-fly.js` `/api/admin/*` | Users, saques, stats, audit |
| Audit log | `src/utils/adminAuditLogger.js` | Trilha ações admin |

### Infraestrutura

| Componente | Localização | Responsabilidade |
|------------|-------------|------------------|
| Deploy backend | `.github/workflows/backend-deploy.yml` | Fly deploy + gate `/meta` |
| Deploy frontend | `.github/workflows/frontend-deploy.yml` | Vercel player |
| Monitoramento | `health-monitor.yml`, `/health`, `/api/metrics` | Liveness |
| Docker | `Dockerfile` | Container reprodutível |

### Integrações

| PSP | Status | Integração |
|-----|--------|------------|
| Mercado Pago | Produção (IN); OUT código pronto | `services/pix-mercado-pago.js` |
| Celcoin | Preparatório | `src/finance/providers/celcoin/` |
| Asaas | Planejado (sem código) | Docs only |
| Efí | Spike scripts | `scripts/efi/` |

### Documentação

| Pasta | Função |
|-------|--------|
| `docs/data-room/` | Data Room (DR-01, DR-02, DR-03) |
| `docs/arquitetura/` | Payment Engine V1 |
| `docs/relatorios/` | Auditorias forenses |
| `docs/executive/` | Handbook, certificação |

---

# 5. Fluxo Completo do Jogador

## 5.1 Diagrama

```text
Cadastro (/register)
    ↓  POST /api/auth/register
Login (/ ou /api/auth/login)
    ↓  JWT armazenado no client
Dashboard (/dashboard)
    ↓
Depósito PIX (/pagamentos)
    ↓  POST /api/payments/pix/criar → QR Code MP
    ↓  Jogador paga no app bancário
    ↓  Webhook MP → RPC claim_and_credit → saldo +=
Wallet (usuarios.saldo disponível)
    ↓
Gameplay (/game)
    ↓  POST /api/games/shoot { direcao, valor_aposta }
    ↓  RPC shoot_apply: debita aposta, sorteia, credita prêmio
Resultado (goal / miss + possível Gol de Ouro R$100)
    ↓
Histórico (/profile, chutes recentes)
    ↓
Solicitação saque (/withdraw)
    ↓  POST /api/withdraw/request { chave Pix, valor }
    ↓  Debita wallet + ledger saque/taxa + status pendente
PIX Out (automático via worker OU manual via admin)
    ↓  PSP envia Pix → webhook confirma → status processado
```

## 5.2 Detalhamento por etapa

| Etapa | Frontend | Backend | Banco | Externo |
|-------|----------|---------|-------|---------|
| **Cadastro** | `Register.jsx` | `POST /api/auth/register` | INSERT `usuarios` | — |
| **Login** | `Login.jsx` | `POST /api/auth/login` → JWT | SELECT `usuarios` | — |
| **Depósito** | `Pagamentos.jsx` | `POST /api/payments/pix/criar` | INSERT `pagamentos_pix` | MP `/v1/payments` |
| **Crédito** | polling `/pix/status` ou webhook | `claim_and_credit_approved_pix_deposit` | saldo +=, ledger `deposito` | Webhook MP |
| **Jogo** | `GameFinal.jsx` | `POST /api/games/shoot` | RPC `shoot_apply` | — |
| **Saque** | `Withdraw.jsx` | `POST /api/withdraw/request` | saldo -=, INSERT `saques`, ledger | — |
| **Payout** | — | worker ou admin | ledger `payout_confirmado` | MP transaction-intents |

**Valores de aposta suportados (RPC):** R$1, R$2, R$5, R$10 — com tamanhos de lote 10, 5, 2, 1 respectivamente.

---

# 6. Fluxo Financeiro

## 6.1 PIX Cash-In (depósito)

```text
Jogador solicita depósito
    ↓
POST /api/payments/pix/criar (server-fly.js)
    ↓
Mercado Pago POST /v1/payments
    ↓
INSERT pagamentos_pix (status: pending)
    ↓
Retorno QR / copy-paste ao frontend
    ↓
[Assíncrono] Mercado Pago POST /api/payments/webhook
    ↓
validateMercadoPagoWebhook (HMAC)
    ↓
GET /v1/payments/{id} (confirma status approved)
    ↓
RPC claim_and_credit_approved_pix_deposit(p_mercadopago_id)
    ↓
├── UPDATE pagamentos_pix → approved (claim idempotente)
├── UPDATE usuarios.saldo += valor
└── INSERT ledger_financeiro tipo=deposito
```

## 6.2 Gameplay financeiro (dentro do jogo)

```text
POST /api/games/shoot
    ↓
RPC shoot_apply (transação única PostgreSQL)
    ↓
├── FOR UPDATE metricas_globais (contador global)
├── Aloca/reutiliza lote ativo por valor_aposta
├── Incrementa posição no lote
├── Sorteia: goal se posição == indice_vencedor
├── Prêmio goal: R$5 (premio)
├── Milestone Gol de Ouro: +R$100 (premio_gol_de_ouro) se contador global atinge marco
├── Debita valor_aposta do saldo
├── Credita prêmios
└── INSERT chutes + UPDATE lotes
```

## 6.3 PIX Cash-Out (saque)

```text
POST /api/withdraw/request
    ↓
PixValidator (chave, valor mínimo, CPF se necessário)
    ↓
Optimistic lock: UPDATE usuarios.saldo (saldo anterior)
    ↓
INSERT saques (status: pendente, correlation_id)
    ↓
INSERT ledger: tipo=saque, tipo=taxa
    ↓
[Se PAYOUT_MODE=auto + worker enabled]
    ↓
payout-worker → processPendingWithdrawals
    ↓
Lock saque: pendente → processando
    ↓
FinanceProviderFactory → MercadoPagoPayoutProvider
    ↓
createPixWithdraw → MP POST /v1/transaction-intents/process
    ↓
UPDATE saques: aguardando_confirmacao + mp_transaction_intent_id
    ↓
[Assíncrono] POST /webhooks/mercadopago
    ↓
Se approved/credited:
    ├── ledger payout_confirmado
    └── status processado
Se rejected/failed:
    ├── ledger falha_payout
    └── rollback saldo (usuarios.saldo += valor)
```

## 6.4 Modo admin (alternativa ao automático)

| Ação | Endpoint | Efeito |
|------|----------|--------|
| Aprovar manual | `POST /api/admin/withdraw/approve` | `pago_manual` — sem PSP |
| Aprovar e enviar | `POST /api/admin/withdraw/approve-and-send` | Dispara PSP via factory |
| Cancelar | `POST /api/admin/withdraw/cancel` | Rollback wallet + ledger |

---

# 7. Gameplay Engine

## 7.1 Arquitetura

A **fonte da verdade do gameplay** é a função PostgreSQL `shoot_apply`, não o Node.js.

| Aspecto | Implementação |
|---------|---------------|
| **Arquivo canônico** | `database/shoot_apply_atomic_transaction.sql` |
| **Assinatura V1 prod** | `(p_usuario_id uuid, p_direcao text, p_valor_aposta numeric) → jsonb` |
| **Direções válidas** | `TL`, `TR`, `C`, `BL`, `BR` |
| **Segurança** | `SECURITY DEFINER`, `SET search_path = public` |
| **HTTP layer** | Thin — apenas valida e mapeia erros `SHOOT_APPLY_*` |

## 7.2 Sistema de lotes

| Valor aposta | Tamanho do lote | Lógica |
|--------------|-----------------|--------|
| R$ 1 | 10 chutes | Pool compartilhado por valor |
| R$ 2 | 5 chutes | |
| R$ 5 | 2 chutes | |
| R$ 10 | 1 chute | Lote individual |

Cada lote possui `indice_vencedor` (sorteado na criação). Quando `posicao_atual == indice_vencedor`, o chute é **goal** (R$5).

## 7.3 Gol de Ouro (milestone global)

- Tabela `metricas_globais` (id=1): `contador_chutes_global`, `ultimo_gol_de_ouro`
- A cada chute, contador global incrementa
- Quando atinge marco configurado na RPC → prêmio adicional **R$100** (`premio_gol_de_ouro`)
- Patches F2-2B/C documentam cirurgia econômica V1 aplicada em produção

## 7.4 RPC `claim_and_credit_approved_pix_deposit`

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `database/claim_and_credit_approved_pix_deposit.sql` |
| **Função** | Claim idempotente de depósito PIX aprovado |
| **Efeito** | Credita `usuarios.saldo` + INSERT ledger `deposito` |
| **Idempotência** | Evita double-credit via estado `pagamentos_pix` |

---

# 8. Wallet

## 8.1 Modelo

A wallet **não é conta bancária** — é saldo virtual interno na coluna `usuarios.saldo` (tipo numeric).

## 8.2 Operações de crédito

| Origem | Mecanismo | Evidência |
|--------|-----------|-----------|
| Depósito PIX | RPC `claim_and_credit_approved_pix_deposit` | Webhook MP |
| Prêmio goal | RPC `shoot_apply` | Gameplay |
| Gol de Ouro | RPC `shoot_apply` | Milestone |
| Rollback saque | `processPendingWithdrawals` rollback | Falha payout |

## 8.3 Operações de débito

| Origem | Mecanismo | Evidência |
|--------|-----------|-----------|
| Aposta (chute) | RPC `shoot_apply` | Antes do sorteio |
| Solicitação saque | `POST /api/withdraw/request` | Optimistic lock `.eq('saldo', saldoAnterior)` |
| Taxa saque | Mesmo request | Ledger separado `tipo=taxa` |

## 8.4 Reconciliação

| Mecanismo | Localização |
|-----------|-------------|
| Ledger vs saldo | Relatórios admin `/api/admin/financial/report` |
| Reconciliação PIX pendente | `setInterval(reconcilePendingPayments)` em `server-fly.js` |
| Auditorias históricas | Docs H4-1C (reconciliação saldos) |
| Scripts watchdog | `scripts/operational/watchdog-financial-integrity.js` |

---

# 9. Ledger

## 9.1 Schema

**Tabela:** `ledger_financeiro` (`database/schema-ledger-financeiro.sql`)

| Coluna | Função |
|--------|--------|
| `id` | UUID PK |
| `correlation_id` | Rastreio end-to-end |
| `tipo` | Semântica da operação |
| `usuario_id` / `user_id` | Dono |
| `valor` | Montante |
| `referencia` | ID saque, payment, etc. |
| `created_at` | Timestamp imutável |

## 9.2 Tipos registrados

| Tipo | Quando |
|------|--------|
| `deposito` | PIX IN creditado |
| `saque` | Solicitação saque (débito contábil) |
| `taxa` | Taxa de saque |
| `rollback` | Estorno por falha |
| `payout_confirmado` | PIX OUT confirmado pelo PSP |
| `falha_payout` | PIX OUT rejeitado |
| `payout_manual_confirmado` | Admin marcou pago manual |
| `rollback_manual` | Admin cancelou |

## 9.3 Integridade

- **Append-only** — sem UPDATE/DELETE no fluxo normal
- **Idempotência** — unique index `(correlation_id, tipo, referencia)`
- **Auditoria** — base para relatórios admin e due diligence financeira

---

# 10. Payment Engine

## 10.1 Visão geral

Módulo em `src/finance/` — abstração **parcial** introduzida na fatia F4.0E-S1.

```text
createPixWithdrawCompat (ponte legado)
        ↓
FinanceProviderFactory.resolvePayoutProvider()
        ↓
┌───────────────────┬───────────────────┬───────────────────┐
│ MercadoPagoPayout │ CelcoinPayout     │ MockPayout        │
│ Provider (default)│ Provider (flag)   │ Provider (dev)    │
└─────────┬─────────┴─────────┬─────────┴───────────────────┘
          ↓                     ↓
pix-mercado-pago.js      CelcoinProvider (stub/HTTP)
```

## 10.2 Factory

**Arquivo:** `src/finance/factory/FinanceProviderFactory.js`

| Env | Default | Efeito |
|-----|---------|--------|
| `PAYOUT_PROVIDER` | `mercadopago` | Seleciona adapter |
| `CELCOIN_ENABLED` | `false` | Obrigatório para `PAYOUT_PROVIDER=celcoin` |
| `MOCK_FINANCE_ENABLED` | `false` | Mock (proibido prod) |

`resolvePaymentProvider()` → **`null`** (PIX IN não wired na factory).

## 10.3 Providers

| Provider | Cash-In | Cash-Out | Código | Produção |
|----------|---------|----------|--------|----------|
| **Mercado Pago** | Inline monólito | Factory adapter | `pix-mercado-pago.js` | IN sim; OUT bloqueio onboarding |
| **Celcoin** | Stub (`CelcoinPaymentProvider`) | Stub + OAuth F4.1 | `src/finance/providers/celcoin/` | Não |
| **Asaas** | — | — | **Inexistente** | Planejado |
| **Mock** | Stub | Stub | `MockPayoutProvider` | Dev only |
| **Efí** | — | — | `scripts/efi/` spike | Não |

## 10.4 OAuth Celcoin (F4.1)

```text
CelcoinProvider.authenticate()
    ↓  [CELCOIN_ENABLED + CELCOIN_HTTP_ENABLED]
celcoin-http-client.requestAccessToken()
    ↓
POST {authBaseUrl}/v5/token
    ↓
Cache in-memory (expires_in)
```

Gate script: `ALLOW_CELCOIN_SANDBOX_AUTH=1`.

## 10.5 Feature flags financeiras

Ver DR-02 §14 e `PAYMENT-ENGINE-V1.md` §10.

---

# 11. Infraestrutura

| Serviço | Uso | Evidência |
|---------|-----|-----------|
| **Fly.io** | Backend API + payout worker | `fly.toml`, `goldeouro-backend-v2` |
| **Vercel** | Player + Admin SPAs | `vercel.json`, workflows |
| **Supabase** | PostgreSQL managed | `SUPABASE_URL`, `database/` |
| **GitHub** | Repo + CI/CD | `.github/workflows/` |
| **GitHub Actions** | Deploy, security, monitor | 12 workflows ativos |
| **Docker** | Container backend | `Dockerfile` Node 20 Alpine |

## Backups

| Tipo | Localização |
|------|-------------|
| Snapshot operacional V1 | `backup/goldeouro-v1-operacional-2026-05-27/` |
| Docs DR/backup | `docs/relatorios/H5-0C-BACKUP-OPERACIONAL-OFICIAL-V1-2026-05-27.md` |
| Admin backup scripts | `goldeouro-admin/scripts/backup*` |
| Supabase | Responsabilidade plataforma + patches documentados |

## Pipeline CI/CD

```text
push main (backend paths)
    ↓
backend-deploy.yml
    ↓
flyctl deploy → goldeouro-backend-v2
    ↓
Gate: GET /health + GET /meta (gitCommit === SHA)

push main (goldeouro-player/**)
    ↓
frontend-deploy.yml
    ↓
vercel --prod
```

**Governança:** alterações em `docs/**`, `scripts/**` não disparam deploy automático (path-filter).

---

# 12. Segurança

| Controle | Implementação | Localização |
|----------|---------------|-------------|
| **JWT** | Bearer auth rotas protegidas | `server-fly.js` `authenticateToken` |
| **bcrypt** | Hash de senhas | Auth flows |
| **Helmet** | CSP report-only, HSTS, frame-ancestors | `server-fly.js` |
| **Rate limit** | 100/15min geral; 5 login/recovery | `express-rate-limit` inline |
| **CORS** | Origins oficiais + env | `server-fly.js` |
| **Webhook HMAC** | MP depósito + payout | `webhook-signature-validator.js` |
| **Ed25519 payout** | Assinatura MP transaction-intents | `pix-mercado-pago.js` |
| **Admin RBAC** | JWT + flag DB administrador | `requireAdministradorDb` |
| **RLS Supabase** | Patches F6-1C | `database/patches/` |
| **Mock finance guard** | Forbidden in production | `FinanceProviderFactory` |
| **CodeQL / audit** | CI security workflow | `.github/workflows/security.yml` |
| **Logs estruturados** | `financeLog()`, JSON logs | `server-fly.js`, providers |
| **Admin audit** | `admin_logs` table | `adminAuditLogger.js` |

**Limitação:** middlewares em `middlewares/` existem mas **não são importados** — segurança implementada inline no monólito.

---

# 13. Dependências entre Módulos

| Módulo | Depende de |
|--------|------------|
| **Frontend Player** | Backend API (Fly), JWT, Vercel CDN |
| **Frontend Admin** | Backend API (Fly), JWT admin, Vercel CDN |
| **server-fly.js** | Supabase, Mercado Pago API, JWT_SECRET, config |
| **Gameplay HTTP** | RPC `shoot_apply`, Supabase, JWT auth |
| **Gameplay RPC** | Tabelas `lotes`, `chutes`, `metricas_globais`, `usuarios` |
| **PIX IN** | Mercado Pago API, RPC `claim_and_credit`, webhook validator |
| **PIX OUT request** | Wallet (`usuarios.saldo`), ledger, PixValidator |
| **PIX OUT worker** | Supabase, Payment Engine, MP payout token |
| **Payment Engine** | Env flags, `pix-mercado-pago.js` (MP adapter) |
| **Ledger** | Supabase PostgreSQL |
| **Wallet** | Supabase (`usuarios.saldo`) |
| **Webhooks MP** | Supabase, ledger, wallet, MP API (GET confirm) |
| **Admin panel** | Backend `/api/admin/*`, Supabase |
| **payout-worker** | Supabase, processPendingWithdrawals, MP token |
| **CI/CD** | GitHub, Fly CLI, Vercel token |
| **Celcoin (prep)** | Env flags, OAuth sandbox (isolado — não prod) |

### Diagrama de dependências críticas

```text
Frontend ──► server-fly.js ──► Supabase
                 │                ▲
                 ├──► shoot_apply ┘
                 ├──► claim_and_credit ┘
                 ├──► Mercado Pago API
                 └──► processPendingWithdrawals
                              │
                              ▼
                      payout-worker (Fly process)
                              │
                              ▼
                      FinanceProviderFactory ──► MP/Celcoin
```

---

# 14. Pontos Fortes da Arquitetura

| Força | Evidência |
|-------|-----------|
| **Atomicidade gameplay** | Toda jogada em uma transação PostgreSQL (`shoot_apply`) — sem estado inconsistente parcial |
| **Atomicidade depósito** | RPC `claim_and_credit` — idempotência contra double-credit |
| **Ledger auditável** | Append-only com tipos semânticos e correlation_id |
| **Separação wallet/PSP** | Saldo interno desacoplado de contas bancárias externas |
| **Worker isolado** | Payout em processo Fly separado — não bloqueia HTTP |
| **Payment Engine foundation** | Contratos + factory permitem multi-PSP sem big-bang |
| **Feature flags explícitas** | Celcoin/Mock bloqueados por default; sem fallback silencioso |
| **CI/CD maduro** | Deploy automatizado + health gates + security scanning |
| **Governança documental** | Trilha forense extensa (F1–F6, H4*, certificação) |
| **PWA** | Player e admin instaláveis — distribuição sem app store obrigatória |
| **Optimistic locking wallet** | Previne race conditions em saques concurrentes |

---

# 15. Limitações Atuais

| Limitação | Impacto | Evidência |
|-----------|---------|-----------|
| **Monólito HTTP** | Acoplamento, difícil escalar equipes | `server-fly.js` ~4.700 linhas |
| **Payment Engine parcial** | PIX IN e webhooks fora da factory | `resolvePaymentProvider() → null` |
| **PIX IN acoplado MP** | Lock-in parcial no depósito | Inline em `server-fly.js` |
| **Webhooks inline** | Não roteados por provider | `/webhooks/mercadopago` no monólito |
| **Routes legadas** | Confusão — ~180 handlers não montados | `routes/` não importadas |
| **Middlewares duplicados** | Código morto vs inline | `middlewares/` não usados |
| **PIX OUT prod** | Bloqueio onboarding MP Payouts | Docs F2-4E/F2-5* |
| **Schema MP-centric** | Colunas `mp_*` em `saques` | Migration 20260424 |
| **Migrations escassas** | 4 formais; resto via patches manuais | `database/migrations/` |
| **Asaas/Celcoin OUT** | Alternativas PSP não operacionais | Sem código / stubs |
| **Mobile Expo** | Sem pipeline produção | `goldeouro-mobile/` parcial |
| **Recursos Fly modestos** | 256 MB RAM, 1 CPU shared | `fly.toml` |
| **mTLS Celcoin** | Não implementado | Docs only |

---

# 16. Evolução Arquitetural

## 16.1 Linha do tempo (evidência documental)

```text
PRODUTO (conceito)
    ↓  Mecânica penalty shoot + premiação
PLATAFORMA V1 (monólito funcional)
    ↓  server-fly.js + Supabase + MP PIX IN
    ↓  Wallet + ledger + admin panel
INFRAESTRUTURA CLOUD
    ↓  Fly.io + Vercel + GitHub Actions
    ↓  PWA + health monitoring + security CI
CIRURGIA ECONÔMICA (F2-2B/C)
    ↓  RPC shoot_apply refinada — produção estável
PAYOUT PIPELINE (F2-4*)
    ↓  Worker + transaction-intents + webhooks
    ↓  Bloqueio institucional MP documentado
PAYMENT ENGINE (F4.0E-S1+)
    ↓  Factory + providers + Celcoin prep
ATIVO TECNOLÓGICO (Data Room)
    ↓  DR-01, DR-02, PAYMENT-ENGINE-V1, DR-03
    ↓  Certificação V1 + handbook executivo
```

## 16.2 Trajetória arquitetural

A V1 evoluiu de **produto monolítico acoplado ao Mercado Pago** para **plataforma com camadas separadas conceitualmente** (wallet, ledger, engine, payment engine), mantendo **deploy monolítico pragmático** para velocidade operacional. A extração financeira é **incremental** — payout primeiro via factory, PIX IN e webhooks como próxima fatia documentada.

---

# 17. Conclusão Executiva

### Por que esta arquitetura representa um ativo tecnológico?

**1. Separação correta das preocupações críticas**

A decisão de colocar gameplay (`shoot_apply`) e crédito PIX (`claim_and_credit`) no **PostgreSQL transacional** demonstra maturidade arquitetural: as operações que não podem falhar parcialmente estão protegidas pelo ACID do banco, independentemente de falhas no Node.js.

**2. Modelo financeiro auditável**

Wallet + ledger dual-layer permite operar entretenimento com movimentação real de dinheiro mantendo **rastreabilidade completa** — requisito fundamental em due diligence de plataformas de premiação.

**3. Infraestrutura operacional, não protótipo**

Fly.io + Vercel + Supabase + CI/CD com health gates não é scaffolding — é **produção documentada** com domínios públicos, monitoramento contínuo e runbooks.

**4. Fundação multi-PSP sem reescrita**

A Payment Engine V1 prova capacidade de evolução arquitetural **sem interromper operação** — contratos, factory, feature flags e adapters Celcoin já existem enquanto Mercado Pago opera PIX IN.

**5. Patrimônio de conhecimento**

~1.830 documentos de auditoria, incidentes, payouts e certificação reduzem **risco de informação assimétrica** — o comprador adquire não só código, mas **processo operacional documentado**.

**6. IP diferenciada**

O motor de lotes + milestone Gol de Ouro implementado como RPC proprietária constitui **propriedade intelectual de produto**, separável de integrações PSP intercambiáveis.

### Ressalva para due diligence

A arquitetura é **madura para operação PIX IN + gameplay + saque manual**, com **gap documentado em PIX OUT automático** (dependência PSP, não falha de design). O comprador adquire uma plataforma **95% completa** com roadmap técnico claro (F4.2/F4.3, Asaas, desacoplamento webhooks) e dívida técnica **conhecida e bounded** (monólito, routes legadas).

---

## Metadados

| Campo | Valor |
|-------|-------|
| **ID** | DR-03 |
| **Título** | Arquitetura Geral da Plataforma |
| **Versão** | 1.0 |
| **Base** | Repositório `goldeouro-backend` — 2026-06-23 |
| **Código alterado** | **Nenhum** |

---

*Documento preparado para o Data Room Gol de Ouro™ V1. Referências cruzadas: DR-02 (inventário de ativos), PAYMENT-ENGINE-V1 (camada financeira).*
