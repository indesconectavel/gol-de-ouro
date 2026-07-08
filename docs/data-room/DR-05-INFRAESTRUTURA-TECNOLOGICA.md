# DR-05 — Infraestrutura Tecnológica

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — infraestrutura documentada a partir de evidências do repositório  
**Documentos relacionados:** DR-01, DR-02–04, certificação V1, **G2**, **H2A**, `fly.toml`, `fly.staging.toml`  
**Repositório:** monorepo `goldeouro-backend`

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> Corpo **2026-06-23** documenta baseline produção V1.FINAL (`a83c3cf` / Fly **v461**) como **HISTÓRICO certificado plataforma**. Releases Fly posteriores (ex.: evidências P1.9 / G2) **não invalidam** aquela certificação, mas o runtime live deve ser lido nos relatórios mais recentes.

| Tema | Estado oficial H2.5 |
|------|---------------------|
| App produção | `goldeouro-backend-v2` + `payout_worker` (`fly.toml`) |
| **Staging permanente** | `goldeouro-backend-staging` + **somente** processo `app` (`fly.staging.toml`) — **G2** |
| Supabase staging | `uatszaqzdqcwnfbipoxg` (isolado de prod `gayopagjdrkcmkirmfvy`) |
| Asaas em DR-05 como “prep/planejado” | **HISTÓRICO** no texto antigo — ver P1.9 / DR-11 adenda |
| Deploy staging | `backend-deploy-staging.yml` (dispatch) |
| A2R | Sandbox Asaas no staging **pendente** (H2A) |

---

# 1. Resumo Executivo

A infraestrutura tecnológica do Gol de Ouro™ V1 é **cloud-native, multi-provedor e distribuída**, composta por cinco camadas principais observáveis no repositório:

| Camada | Provedor | Função |
|--------|----------|--------|
| **Frontend** | Vercel | SPAs React (player + admin) |
| **Backend API + Worker** | Fly.io (região GRU) | Node.js 20 — monólito HTTP + processo payout |
| **Banco de dados** | Supabase | PostgreSQL managed |
| **CI/CD** | GitHub Actions | Build, test, deploy, monitoramento |
| **PSPs** | Mercado Pago (prod); Celcoin/Efí/Asaas (prep/planejado) | PIX IN/OUT externo |

### Características distintivas

- **Deploy automatizado** para backend (Fly) e player (Vercel) via workflows canónicos com **gates pós-deploy** (`/health`, `/meta`).
- **Dois processos Fly** no mesmo app: `app` (HTTP) e `payout_worker` (background).
- **Lógica crítica no PostgreSQL** — RPCs atômicas reduzem dependência de escala horizontal no Node.
- **Baseline congelada** documentada: SHA `a83c3cf`, Fly **v461**, bundle `index-B6M2smS9.js`.
- **Monitoramento contínuo** via `health-monitor.yml` (poll a cada 30 min) e scripts de observabilidade read-only.

A infraestrutura **não utiliza Kubernetes, Terraform ou IaC declarativo** evidenciado no repositório — configuração via `fly.toml`, `vercel.json`, `Dockerfile` e secrets em GitHub/Fly/Vercel.

---

# 2. Visão Geral da Infraestrutura

## 2.1 Diagrama de fluxo

```text
                         ┌─────────────────────────┐
                         │   Usuário / Operador    │
                         └───────────┬─────────────┘
                                     │ HTTPS
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      │
   ┌─────────────────────┐  ┌─────────────────────┐        │
   │  Vercel — Player    │  │  Vercel — Admin     │        │
   │  goldeouro.lol      │  │  admin.goldeouro.lol│        │
   │  (React/Vite/PWA)   │  │  (React/Vite/PWA)   │        │
   └──────────┬──────────┘  └──────────┬──────────┘        │
              │ REST + JWT              │ REST + JWT        │
              └──────────────┬───────────┘                   │
                             ▼                              │
              ┌──────────────────────────────┐              │
              │  Fly.io — goldeouro-backend-v2│              │
              │  Região: GRU (São Paulo)      │              │
              │  ┌────────────┐ ┌────────────┐│              │
              │  │ process app│ │payout_worker││              │
              │  │ server-fly │ │ payout loop ││              │
              │  │ :8080      │ │ (sem HTTP)  ││              │
              │  └─────┬──────┘ └──────┬─────┘│              │
              └────────┼───────────────┼──────┘              │
                       │               │                     │
                       ▼               ▼                     │
              ┌──────────────────────────────┐               │
              │  Supabase — PostgreSQL       │               │
              │  RPCs · RLS · Ledger         │               │
              └──────────────┬───────────────┘               │
                             │                               │
              ┌──────────────┼───────────────┐               │
              ▼              ▼               ▼               │
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
   │ Mercado Pago │ │ Celcoin prep │ │ Efí spike    │       │
   │ PIX IN/OUT   │ │ (sandbox)    │ │ (scripts)    │       │
   └──────┬───────┘ └──────────────┘ └──────────────┘       │
          │ webhooks inbound                                  │
          └───────────────────────────────────────────────────┘
                             ▲
                             │ POST /api/payments/webhook
                             │ POST /webhooks/mercadopago
                             │
                    (callbacks PSP → Fly.io)
```

## 2.2 Mapa de hospedagem

| Componente | Onde está | URL / Identificador (evidência) |
|------------|-----------|----------------------------------|
| Backend API | Fly.io | `https://goldeouro-backend-v2.fly.dev` |
| Payout worker | Fly.io (processo) | Mesmo app, sem porta HTTP |
| Player SPA | Vercel | `goldeouro.lol` / `www.goldeouro.lol` |
| Admin SPA | Vercel | `admin.goldeouro.lol` |
| PostgreSQL | Supabase | Via `SUPABASE_URL` (env) |
| CI/CD | GitHub Actions | `.github/workflows/` |
| Artefatos build player | Vercel CDN | `dist/` — bundle baseline `index-B6M2smS9.js` |
| Container backend | Docker Hub (build Fly) | `node:20-alpine`, porta 8080 |

## 2.3 Comunicação entre componentes

| Origem | Destino | Protocolo | Autenticação |
|--------|---------|-----------|--------------|
| Player/Admin | Backend Fly | HTTPS REST | JWT Bearer |
| Backend | Supabase | HTTPS (PostgREST + RPC) | Service role key |
| Backend | Mercado Pago API | HTTPS REST | Access tokens (depósito vs payout separados) |
| MP → Backend | Webhooks | HTTPS POST | HMAC / Ed25519 (payout) |
| Worker | Supabase + MP | HTTPS | Mesmas credenciais env |
| GitHub Actions | Fly / Vercel | CLI + API tokens | Secrets GitHub |
| Health monitor | Backend | HTTPS GET `/health` | Público (sem auth) |

**CORS:** backend aceita origens via `CORS_ORIGIN` ou `CORS_ORIGINS` — admin Vercel explicitamente referenciado em `goldeouro-admin/vercel.json` (`connect-src` inclui `goldeouro-backend-v2.fly.dev`).

---

# 3. Ambientes

| Ambiente | Definição | Infraestrutura | Evidência |
|----------|-----------|----------------|-----------|
| **Produção** | Runtime público com usuários reais | Fly prod + Vercel prod + Supabase prod | `fly.toml` `NODE_ENV=production`, certificação V1 |
| **Homologação** | Validação operacional read-only | Mesmas URLs + scripts certificação | `scripts/certification/`, `scripts/e2e/`, `scripts/reliability/` |
| **Sandbox financeiro** | Testes PSP sem impacto prod | Credenciais sandbox MP/Celcoin/Efí | `npm run payout:sandbox`, `test-celcoin-auth.mjs`, `scripts/efi/` |
| **Staging (DB)** | Bootstrap SQL staging | Supabase staging documentado | `database/staging/F2-2B-bootstrap-staging-engine-2026-05-26.sql` |
| **Experimental** | Código prep desligado | Flags env default false | `CELCOIN_ENABLED=false`, `goldeouro-mobile/` sem CI |
| **Local/Dev** | Desenvolvimento | `npm run dev`, `.env` local | `README.md`, `.env.example` |

### Matriz ambiente × deploy

| Componente | Produção | Sandbox | Local |
|------------|----------|---------|-------|
| Backend Fly | CI `backend-deploy.yml` (main) | Não evidenciado app Fly staging | `npm start` / `nodemon` |
| Player Vercel | CI `frontend-deploy.yml` (main) | — | `vite dev` |
| Admin Vercel | Manual / scripts PS1 | `deploy:staging` script | `vite dev` |
| Supabase | Prod (env) | Staging bootstrap SQL | `.env` local |
| PSP | MP prod tokens | MP sandbox / Celcoin OAuth gate | `.env.example` templates |

---

# 4. Frontend

## 4.1 Player (`goldeouro-player/`)

| Aspecto | Detalhe |
|---------|---------|
| **Stack** | React 18, Vite 5, Tailwind 3, Axios |
| **Versão** | 1.2.0 (`package.json`) |
| **Build** | `npm run build` → `dist/` |
| **Prebuild** | `scripts/inject-build-info.cjs` — injeta versão/data |
| **API backend** | `VITE_BACKEND_URL` ou default `https://goldeouro-backend-v2.fly.dev` |
| **Deploy prod** | GitHub Actions `frontend-deploy.yml` → Vercel `--prod` |
| **Config Vercel** | `goldeouro-player/vercel.json` — framework vite, CSP headers, SPA fallback |

## 4.2 Admin (`goldeouro-admin/`)

| Aspecto | Detalhe |
|---------|---------|
| **Stack** | React 18, Vite 4, Tailwind, Radix UI, Recharts |
| **Versão** | 1.1.0 |
| **Build** | `vite build` / `vercel-build` |
| **API backend** | CSP `connect-src` → `goldeouro-backend-v2.fly.dev` |
| **Deploy prod** | **Manual** — scripts PowerShell (`deploy-basico.ps1`, `deploy-seguro.ps1`, `npx vercel --prod`) |
| **Repositório** | Monorepo local; histórico documenta repo separado `indesconectavel/goldeouro-admin` (F2-4D) |
| **Config Vercel** | `goldeouro-admin/vercel.json` — rewrites SPA, CSP restritiva |

## 4.3 PWA

| App | Evidência |
|-----|-----------|
| **Player** | `vite-plugin-pwa`, Workbox `generateSW`, manifest standalone, ícones 192/512/maskable, Capacitor 7 Android wrapper |
| **Admin** | `vite-plugin-pwa` em `package.json` + `vite.config.js` |

Player PWA: `registerType: 'autoUpdate'`, orientação portrait, theme `#00264d`.

## 4.4 Mobile (experimental)

| Aspecto | Detalhe |
|---------|---------|
| **Stack** | Expo ~51, React Native 0.74 (`goldeouro-mobile/`) |
| **Build** | `eas.json` — profiles development/preview/production (APK Android) |
| **Produção** | **Sem pipeline CI** evidenciado no repositório |

## 4.5 Build e artefatos

| Item | Player | Admin |
|------|--------|-------|
| Output | `dist/` | `dist/` |
| Node engine | ≥18 | — |
| CI Node | 20 (workflows) | — |
| Bundle baseline certificado | `index-B6M2smS9.js` | Não documentado equivalente |
| Cache headers | Granular em `vercel.json` (assets, JS, HTML) | no-cache global |

---

# 5. Backend

## 5.1 API HTTP

| Aspecto | Detalhe |
|---------|---------|
| **Entry point** | `server-fly.js` (~4.700 linhas, 44 rotas inline) |
| **Framework** | Express 4 |
| **Versão runtime** | 1.2.1 (header `/health`, `/meta`) |
| **Porta** | 8080 (`Dockerfile`, `fly.toml`) |
| **Start prod** | `npm start` → `node server-fly.js` |
| **Container** | `node:20-alpine`, `GIT_COMMIT` build-arg |

## 5.2 Worker payout

| Aspecto | Detalhe |
|---------|---------|
| **Arquivo** | `src/workers/payout-worker.js` |
| **Processo Fly** | `payout_worker = "node src/workers/payout-worker.js"` |
| **HTTP** | Nenhum — loop background |
| **Ativação** | `ENABLE_PIX_PAYOUT_WORKER=true` (exit 0 se false) |
| **Intervalo** | `PAYOUT_WORKER_INTERVAL_MS` default 30000 ms |
| **Dependências** | Supabase service role, `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` |
| **Processamento** | `processPendingWithdrawals()` + `createPixWithdraw` |
| **Liveness** | Logs `[PAYOUT][WORKER][HEARTBEAT]`; probe env em `/health/workers` |

## 5.3 Processos Fly.io

```text
fly.toml [processes]
├── app            → npm start → server-fly.js (HTTP 80/443 → 8080)
└── payout_worker  → node src/workers/payout-worker.js (background)
```

## 5.4 Recursos computacionais

| Parâmetro | Valor (`fly.toml`) |
|-----------|-------------------|
| Região primária | `gru` (São Paulo) |
| CPU | shared, 1 vCPU |
| RAM | 256 MB |
| Concorrência HTTP | soft 100 / hard 200 requests |
| Health check Fly | `GET /health` a cada 30s, timeout 10s, grace 10s |

## 5.5 Endpoints de infraestrutura

| Rota | Função |
|------|--------|
| `GET /health` | Status ok, DB connected, MP connected, versão |
| `GET /health/workers` | Flags env worker (não liveness real) |
| `GET /meta` | `gitCommit`, versão, features (`pix`, `goldenGoal`) |
| `GET /api/monitoring/health` | Health check alternativo documentado |

## 5.6 Módulos auxiliares

| Pasta | Função |
|-------|--------|
| `src/finance/` | Payment Engine — factory, providers MP/Celcoin |
| `services/` | `pix-mercado-pago.js`, email |
| `controllers/` | Admin withdraw, etc. |
| `utils/` | `webhook-signature-validator.js` |
| `database/supabase-unified-config.js` | Config Supabase (referenciado) |

---

# 6. Banco de Dados

## 6.1 Supabase / PostgreSQL

| Aspecto | Detalhe |
|---------|---------|
| **Provedor** | Supabase (PostgreSQL managed) |
| **Conexão backend** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (obrigatórios — validados no boot) |
| **Cliente** | `@supabase/supabase-js` v2.38 |
| **Schema** | `public` |
| **Project ref documentado** | `gayopagjdrkcmkirmfvy` (manifesto H5-0C — backup operacional) |

## 6.2 Persistência — tabelas principais (evidência schema)

| Domínio | Tabelas / artefatos |
|---------|---------------------|
| **Usuários / wallet** | `usuarios` (saldo mutável) |
| **Gameplay** | `lotes`, `chutes`, `metricas_globais` |
| **Financeiro** | `ledger_financeiro`, `saques`, intents MP payout |
| **Admin** | `admin_logs` (migration 20260512) |
| **Notificações** | `schema-notifications.sql` |
| **Histórico** | `schema-history.sql` |

## 6.3 RPCs (funções PostgreSQL)

| RPC | Arquivo canônico | Finalidade |
|-----|------------------|------------|
| **`shoot_apply`** | `database/shoot_apply_atomic_transaction.sql` | Gameplay atômico — debita saldo, registra chute, prêmios |
| **`claim_and_credit_approved_pix_deposit`** | `database/claim_and_credit_approved_pix_deposit.sql` | Crédito PIX IN atômico pós-webhook |

Patches versionados em `database/patches/` com rollback em `database/rollback/`.

## 6.4 Views

| View | Arquivo | Finalidade |
|------|---------|------------|
| `current_ranking` | `database/schema-ranking.sql` | Ranking atual |
| `user_game_stats` | `database/schema-ranking.sql` | Estatísticas por usuário |
| `system_game_stats` | `database/schema-ranking.sql` | Estatísticas globais |

## 6.5 Segurança DB

- **RLS** — patches F6-1C (`database/patches/F6-1C-enable-rls-class-a-tables-2026-06-12.sql`)
- **Migrations** — pasta `database/migrations/` (manual, sem CI automático de DDL)
- **Staging bootstrap** — `database/staging/`, `database/stg-m1-bootstrap-for-rpc.sql`

## 6.6 Persistência e backup

| Mecanismo | Evidência |
|-----------|-----------|
| Supabase managed backups | Responsabilidade plataforma |
| DDL versionado | Git `database/` |
| Snapshot código+SQL | `backup/goldeouro-v1-operacional-2026-05-27/` (H5-0C) |

---

# 7. Integrações Externas

## 7.1 Mercado Pago (produção)

| Fluxo | Implementação | Endpoint |
|-------|---------------|----------|
| **PIX IN** | Inline `server-fly.js` + `services/pix-mercado-pago.js` | API MP + webhook |
| **Webhook depósito** | HMAC validator | `POST /api/payments/webhook` |
| **PIX OUT** | Worker + Payment Engine + MP Payouts API | `POST /webhooks/mercadopago` |
| **Tokens** | Separados: `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` vs `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` | `.env.example` |
| **Assinatura payout** | Ed25519 (`MP_PAYOUT_PRIVATE_KEY`) | Documentado V1-1F |

**Status produção:** PIX IN operacional; PIX OUT código completo com bloqueio onboarding documentado.

## 7.2 Celcoin (preparatório)

| Aspecto | Estado |
|---------|--------|
| **Código** | `src/finance/providers/celcoin/` |
| **Flags** | `CELCOIN_ENABLED=false`, `CELCOIN_HTTP_ENABLED=false` (default) |
| **OAuth sandbox** | `celcoin-http-client.js` → `POST {authBaseUrl}/v5/token` |
| **Gate script** | `ALLOW_CELCOIN_SANDBOX_AUTH=1` |
| **Produção** | **Não conectado** |

## 7.3 Asaas (planejado)

- **Zero código** no repositório
- Referenciado em `docs/arquitetura/PAYMENT-ENGINE-V1.md` como PSP futuro
- Aguardando API/liberação comercial documentada

## 7.4 Efí / Gerencianet (spike)

| Aspecto | Estado |
|---------|--------|
| **Código** | Apenas `scripts/efi/` |
| **Escopo** | OAuth, webhook, PIX OUT sandbox |
| **Produção** | **Não** — spike experimental |

## 7.5 OAuth e autenticação externa

| Integração | Mecanismo |
|------------|-----------|
| **JWT interno** | `JWT_SECRET` — auth player/admin |
| **MP** | Access tokens estáticos (não OAuth user-facing) |
| **Celcoin** | OAuth client credentials `/v5/token` (prep) |
| **Efí spike** | Scripts OAuth sandbox |
| **Email** | SMTP via `nodemailer` (`services/emailService.js`) — recovery senha |

## 7.6 Webhooks inbound

| Rota | PSP | Validação |
|------|-----|-----------|
| `POST /api/payments/webhook` | MP depósito | HMAC (`WebhookSignatureValidator`) |
| `POST /webhooks/mercadopago` | MP payout | Ed25519 / enforce flags |
| Celcoin | Stub | Rejeita se `CELCOIN_ENABLED=false` |

Baseline segurança: webhook sem assinatura → **401** (certificação governança).

---

# 8. Pipeline de Deploy

## 8.1 GitHub — repositório e branches

| Item | Evidência |
|------|-----------|
| **Repo** | `goldeouro-backend` (monorepo) |
| **Branch produção** | `main` — dispara deploy backend + player |
| **Branch integração** | `dev` — workflows também escutam |
| **Dependabot** | Atualizações npm semanais (backend, player, admin) |

## 8.2 GitHub Actions — workflows ativos

| Workflow | Função | Disparo |
|----------|--------|---------|
| `backend-deploy.yml` | Deploy Fly canónico | push main/dev (paths funcionais) + dispatch |
| `frontend-deploy.yml` | Deploy Vercel player prod | push main (goldeouro-player/**) |
| `main-pipeline.yml` | CI main **sem deploy** | push main |
| `rollback.yml` | Rollback Fly pós-falha deploy | workflow_run failure |
| `frontend-rollback-manual.yml` | Rollback player manual | dispatch |
| `health-monitor.yml` | Poll /health + /meta | cron 30min + dispatch |
| `security.yml` | CodeQL, npm audit, TruffleHog | push + cron 3x/semana |
| `monitoring.yml` | Lighthouse, logs Fly (manual) | dispatch |
| `tests.yml`, `ci.yml` | Testes/CI | push/PR |
| `configurar-seguranca.yml` | Hardening | dispatch |
| `deploy-on-demand.yml` | Deploy sob demanda | dispatch |

## 8.3 Fluxo backend (Fly.io)

```text
push main (paths: server-fly.js, src/**, services/**, ...)
    ↓
backend-deploy.yml
    ├── npm ci + npm test (condicional)
    ├── flyctl deploy --build-arg GIT_COMMIT=<sha>
    ├── Gate: GET /health (5 tentativas)
    └── Gate: GET /meta.gitCommit === RELEASE_SHA
    ↓
Falha em main → rollback.yml (fly releases rollback)
```

**Path-filter H3.6C:** alterações em `docs/**`, `scripts/**`, `.github/**` **não disparam** deploy.

## 8.4 Fluxo frontend player (Vercel)

```text
push main (goldeouro-player/**)
    ↓
frontend-deploy.yml
    ├── npm ci + eslint + npm run build
    └── vercel deploy --prod (VERCEL_TOKEN + VERCEL_PROJECT_ID)
    ↓
Bundle servido via Vercel CDN
```

## 8.5 Fluxo admin (manual)

```text
Desenvolvimento local / branch painel-protegido-v1.1.0
    ↓
npm run deploy:production | deploy:safe | npx vercel --prod
    ↓
Vercel → admin.goldeouro.lol
```

## 8.6 Secrets de deploy

| Secret | Uso |
|--------|-----|
| `FLY_API_TOKEN` | Deploy/rollback Fly |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Deploy player CI |
| Env Fly (dashboard) | JWT, Supabase, MP tokens, worker flags |
| GitHub Secrets | Tokens CI — nunca no Git |

---

# 9. Monitoramento

## 9.1 Health checks

| Camada | Mecanismo | Frequência |
|--------|-----------|------------|
| **Fly.io** | HTTP check `GET /health` | 30s (`fly.toml`) |
| **GitHub Actions** | `health-monitor.yml` curl backend | 30 min (cron) |
| **Pós-deploy** | Gate obrigatório `/health` + `/meta` | Cada deploy backend |
| **Worker** | Logs heartbeat Fly | Contínuo (logs) |

## 9.2 Logs

| Fonte | Destino |
|-------|---------|
| Backend `server-fly.js` | stdout Fly (`console.log` estruturado) |
| Worker payout | stdout Fly — prefixo `[PAYOUT][WORKER]` |
| Payment Engine | `financeLog()` JSON |
| Health monitor CI | `docs/logs/health-summary.log`, `health-fails.log` (commit automático) |
| Winston | Presente em `middlewares/security-performance.js` — **não wired** no monólito prod |

## 9.3 Auditorias e observabilidade

| Script | Função |
|--------|--------|
| `scripts/v1-2a-runtime-financial-health.js` | Saúde runtime + financeiro |
| `scripts/v1-2b-operational-alerts.js` | Alertas operacionais |
| `scripts/v1-2c-runtime-drift-deploy-integrity.js` | Drift repo vs live |
| `scripts/reliability/runtime-certification.js` | Certificação runtime |
| `scripts/reliability/financial-proof-engine.js` | Prova financeira |
| `scripts/governance/autonomous-reliability-check.js` | Dashboard governança |

## 9.4 Alertas

- `health-monitor.yml` — falhas registradas em `docs/logs/health-fails.log`
- Runbooks operacionais — triggers documentados (rollback-spike, webhook-rejected-spike, payout-worker-offline)
- `monitoring.yml` — Lighthouse performance < 80% alerta (manual)

## 9.5 Observabilidade — limitações

- **Sem APM dedicado** (Datadog, New Relic) evidenciado
- **Sem métricas Prometheus/Grafana** no repo
- Worker liveness via **logs**, não probe HTTP dedicado
- Monitoramento financeiro depende de **scripts read-only** + execução manual ou CI dispatch

---

# 10. Segurança da Infraestrutura

| Controle | Implementação |
|----------|---------------|
| **HTTPS** | Fly TLS 443; Vercel TLS; Supabase SSL |
| **JWT** | Rotas protegidas — `JWT_SECRET` min 32 chars |
| **Helmet** | CSP report-only, HSTS, frame-ancestors — `server-fly.js` |
| **Rate limits** | 100/15min global; 5 login; 5 recovery — bypass `/health`, `/meta`, admin auth |
| **CORS** | Whitelist env — origins Vercel documentadas |
| **Secrets** | GitHub Secrets + Fly secrets + Vercel env — `.env.example` templates sem valores reais |
| **Feature flags** | `PAYOUT_PROVIDER`, `CELCOIN_ENABLED`, `ENABLE_PIX_PAYOUT_WORKER`, `PAYOUT_PIX_ENABLED`, `MOCK_FINANCE_ENABLED` (forbidden prod) |
| **Webhook hardening** | HMAC + Ed25519; 401 sem assinatura |
| **CSP frontend** | Headers em `vercel.json` (player + admin) |
| **Docker** | Alpine minimal; `GIT_COMMIT` label OCI |
| **CodeQL** | `security.yml` — continue-on-error |
| **Admin RBAC** | JWT + flag DB administrador |

---

# 11. Escalabilidade

## 11.1 Pontos de crescimento

| Componente | Capacidade atual | Evolução possível |
|------------|------------------|-------------------|
| **Fly app HTTP** | Concurrency 100/200 req; 256MB RAM | Scale machines Fly; aumentar RAM/CPU |
| **Payout worker** | Processo único, loop 30s | Múltiplas instâncias worker (requer idempotência — já parcial via ledger) |
| **Supabase** | Managed scaling | Upgrade plano Supabase |
| **Vercel frontends** | CDN edge global | Automático Vercel |
| **RPCs PostgreSQL** | Lógica no banco | Escala vertical DB; read replicas (Supabase) |

## 11.2 Limitações atuais

| Limitação | Impacto |
|-----------|---------|
| Monólito `server-fly.js` | Deploy all-or-nothing API |
| 256 MB RAM Fly | Gargalo sob pico HTTP + MP calls |
| Worker single-process | Throughput saques limitado |
| Sem auto-scaling documentado | Escala manual Fly |
| Admin deploy manual | Gargalo operacional humano |

## 11.3 Capacidade de evolução

- **Payment Engine** (`src/finance/`) — desacopla PSP sem reescrever monólito
- **Processos Fly separados** — padrão já estabelecido (app vs worker)
- **RPCs atômicas** — gameplay e crédito PIX escalam com PostgreSQL
- **Path-filter CI** — permite evoluir docs/scripts sem risco deploy

## 11.4 Possibilidades de desacoplamento

| Direção | Evidência prep |
|---------|----------------|
| Extrair webhooks | Rotas já separadas (`/api/payments/webhook` vs `/webhooks/mercadopago`) |
| Extrair payout | Worker + Payment Engine já semi-modular |
| Multi-PSP | Factory + Celcoin stubs |
| Engine V2 | Roadmap V1-X1, PAYMENT-ENGINE-V1 ADR-001 |

---

# 12. Pontos Fortes

| Dimensão | Evidência |
|----------|-----------|
| **Disponibilidade** | Health checks Fly + CI 30min; gates pós-deploy; rollback workflow |
| **Separação de responsabilidades** | Front/back/DB/PSP em provedores distintos; worker processo separado |
| **Escalabilidade edge** | Vercel CDN para frontends; Fly concurrency configurável |
| **Confiabilidade** | RPCs atômicas; ledger append-only; baseline certificada congelada |
| **Reutilização** | Payment Engine factory; scripts observabilidade reutilizáveis |
| **Rastreabilidade infra** | `GIT_COMMIT` em Docker + `/meta`; Fly release numbers documentados |
| **Segurança em camadas** | TLS end-to-end, JWT, rate limit, webhook HMAC, CSP Vercel |
| **Multi-região ready (parcial)** | Fly GRU — latência Brasil; Vercel edge global |

---

# 13. Limitações

| Limitação | Detalhe |
|-----------|---------|
| **Monólito backend** | ~4.700 linhas — escala e deploy acoplados |
| **Sem IaC (Terraform/Pulumi)** | Config imperativa fly.toml + manual secrets |
| **Dependência PSP único prod** | Mercado Pago — PIX OUT bloqueado externamente |
| **Admin fora do CI monorepo** | Deploy manual; drift documentado F2-4D |
| **Backups** | Snapshot código H5-0C; Supabase managed — sem DR multi-região documentado |
| **Observabilidade** | Sem APM; logs stdout; worker sem probe HTTP |
| **Recursos Fly modestos** | 256MB / 1 shared CPU |
| **Mobile/Expo** | Sem infra produção |
| **DDL manual** | Patches SQL sem pipeline migratório automatizado |
| **Winston não wired prod** | Logging principalmente console |

### Infraestrutura futura (documentada, não implementada)

- Celcoin produção PIX OUT
- Asaas integração
- Engine V2 + websocket saldo (roadmap V1-X1)
- Staging Fly dedicado
- Monitoramento externo pós-V1 (handbook executivo)

---

# 14. Conclusão Executiva

## Por que a infraestrutura atual representa um ativo tecnológico relevante?

Sob a ótica de **Due Diligence de Infraestrutura**, o Gol de Ouro™ V1 entrega:

1. **Stack moderna e operacional comprovada** — Fly.io + Vercel + Supabase + GitHub Actions não é protótipo local: domínios públicos, health checks contínuos, certificação runtime e baseline congelada demonstram **infra em produção real**.

2. **Arquitetura distribuída sensata para o estágio** — separação frontend (CDN), backend (compute), dados (managed DB) e PSP (externo) reduz blast radius; worker payout em processo Fly separado antecipa desacoplamento sem microserviços prematuros.

3. **Pipeline de deploy maduro para componentes críticos** — backend e player com CI automatizado, gates `/health` + `/meta`, rollback documentado e path-filters que protegem produção de alterações documentais.

4. **Resiliência financeira na camada de dados** — RPCs PostgreSQL atômicas e ledger imutável movem a garantia de integridade para infraestrutura de banco managed, independente de escala horizontal Node.

5. **Preparação para crescimento sem reescrita** — Payment Engine, processos Fly múltiplos, feature flags e prep multi-PSP indicam que a infra **suporta evolução** (Celcoin, Engine V2) sem forklift.

6. **Transparência de limitações** — monólito, 256MB, admin manual e ausência de APM estão documentados — reduzem surpresa na DD versus infra opaca.

**Síntese DD:** o comprador adquire infraestrutura **cloud-native funcional**, com **disponibilidade monitorada**, **deploy rastreável** e **caminho de escala documentado**. O principal gap infraestrutural é **capacidade compute modesta (256MB)** e **observabilidade básica** — mitigáveis com upgrade Fly e APM, sem redesign arquitetural. A dependência de PSP é **camada externa**, com abstração interna já iniciada.

---

## Metadados desta auditoria

| Campo | Valor |
|-------|-------|
| **Arquivo criado** | `docs/data-room/DR-05-INFRAESTRUTURA-TECNOLOGICA.md` |
| **Modo** | READ-ONLY — nenhuma alteração em código, banco, configs ou docs preexistentes |
| **Fonte** | Evidências exclusivamente do repositório `goldeouro-backend` |
| **Data** | 2026-06-23 |

### Resumo solicitado

| Item | Resultado |
|------|-----------|
| **Ambientes encontrados** | Produção, Homologação (scripts), Sandbox financeiro, Staging DB, Experimental, Local/Dev |
| **Serviços identificados** | Fly.io (API + worker), Vercel (player + admin), Supabase PostgreSQL, GitHub Actions, Mercado Pago, Celcoin prep, Efí spike, Email SMTP, Expo mobile (parcial) |
| **Pipeline de deploy** | `backend-deploy.yml` → Fly; `frontend-deploy.yml` → Vercel player; admin manual; `rollback.yml` + gates `/health`/`/meta` |
| **Principais fortalezas** | Multi-cloud operacional, CI/CD com gates, worker separado, RPCs DB, baseline certificada, health monitor contínuo |
| **Limitações** | Monólito, 256MB Fly, sem APM/IaC, admin deploy manual, PSP único prod, observabilidade básica |
| **Alterações código** | **Nenhuma** |
