# DR-02 — Inventário Oficial do Ativo

**Projeto:** Gol de Ouro™  
**Versão do ativo:** V1 (~95% concluída)  
**Data do inventário:** 2026-06-23  
**Modo:** auditoria READ-ONLY — baseada exclusivamente em evidências do repositório  
**Repositório:** `goldeouro-backend` (monorepo)  
**Classificação:** Documento institucional para Data Room / Due Diligence tecnológica

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> **SUBSTITUÍDO PELO H0 / H1 / P1.9 / G2 / H2A** para fatos abaixo. O corpo deste DR-02 (datado 2026-06-23) permanece como **NARRATIVA ORIGINAL / HISTÓRICO** do inventário naquela data.  
> Porta de entrada atual: [`DR-01-RESUMO-EXECUTIVO.md`](./DR-01-RESUMO-EXECUTIVO.md).

| Tema no corpo histórico | Estado oficial H2.5 |
|-------------------------|---------------------|
| Asaas “zero código / planejado” | **OBSOLETO** — Providers Asaas em `src/finance/providers/asaas/`; PIX IN/OUT e Recovery certificados (**P1.9 PASS**) |
| Payment Engine “parcial” / MP-only default | **Atualizar leitura:** IPE™ com factory multi-PSP, fachada P2.2, Asaas primário arquitetural; MP pode permanecer legado/fallback conforme ENV |
| Staging só “docs F2-2B” | **Homologação permanente:** `goldeouro-backend-staging` + `fly.staging.toml` + **G2 PASS COM RESSALVAS** (`b29d847`) |
| PIX OUT “bloqueio onboarding” como único gap | **Parcialmente historico:** OUT Asaas homologado + Recovery; gates produção aplicáveis; A2R staging sandbox pendente (H2A) |
| Data Room sem DR-01 | **Resolvido:** DR-01 criado em H2.5 |
| Asset Package / patrimônio | Ver **H1** + snapshot `h1-patrimonial-package.json` |

**Não apagar** seções históricas §9/§12 que citam Asaas ausente — marcar mentalmente como inventário jun/2026.

---

## Metodologia

Este inventário responde, para cada ativo encontrado:

| Pergunta | Critério |
|----------|----------|
| **O que existe?** | Arquivo, módulo ou artefato versionado no Git |
| **Onde está?** | Caminho relativo no repositório |
| **Finalidade?** | Função operacional ou documental |
| **Implementado?** | Código executável presente e referenciado |
| **Produção?** | Evidência em `fly.toml`, `vercel.json`, workflows CI/CD ou docs de deploy |
| **Parte do ativo?** | Sim, se contribui para operação, IP ou governança V1 |

**Exclusões declaradas:** pastas `backup/`, `backup-pre-limpeza-*`, `BACKUP-*` tratadas como histórico — listadas apenas como ativo de arquivo, não como runtime ativo.

---

## 1. Resumo Executivo

O Gol de Ouro™ possui um **patrimônio tecnológico consolidado** composto por:

- **3 aplicações web/mobile** (player, admin, mobile Expo)
- **1 backend monolítico** em produção (`server-fly.js`) com worker dedicado de payout
- **1 banco PostgreSQL** gerenciado via Supabase, com RPCs atômicas de gameplay e financeiro
- **1 Payment Engine** parcial (`src/finance/`) com suporte a múltiplos PSPs
- **Infraestrutura cloud** Fly.io + Vercel + Supabase + GitHub Actions
- **Corpus documental extenso** (~1.830 arquivos Markdown em `docs/`)

**Produção comprovada no repositório:**

| Camada | Plataforma | Domínio / App (evidência) |
|--------|------------|---------------------------|
| Backend API | Fly.io | `goldeouro-backend-v2.fly.dev` |
| Frontend Player | Vercel | `www.goldeouro.lol` / `goldeouro.lol` |
| Frontend Admin | Vercel | `admin.goldeouro.lol` |
| Banco | Supabase | PostgreSQL (via `SUPABASE_URL`) |

**Integração financeira ativa:** Mercado Pago (PIX IN operacional; PIX OUT com código completo, bloqueio institucional documentado).

**Integrações preparatórias:** Celcoin (stubs + OAuth sandbox client); Efí (scripts spike); Asaas (somente planejamento documental).

---

## 2. Frontend

### 2.1 Inventário detalhado

| Ativo | Localização | Finalidade | Status | Produção | Dependências | Observações |
|-------|-------------|------------|--------|----------|--------------|-------------|
| **Player Web (SPA)** | `goldeouro-player/` | App do jogador: login, jogo, perfil, PIX, saques | Implementado (~126 arquivos `src/`) | **Sim** — Vercel + CI `frontend-deploy.yml` | React 18, Vite 5, Tailwind, Axios, Capacitor 7 | Domínio `goldeouro.lol` |
| **Player PWA** | `goldeouro-player/vite.config.ts`, `src/pwa-sw-updater.tsx` | Instalação offline, SW Workbox | Implementado | Sim | `vite-plugin-pwa`, Workbox | Manifest standalone |
| **Player Android (Capacitor)** | `goldeouro-player/android/`, `capacitor.config.ts` | Wrapper nativo Android | Parcial | Não evidenciado em CI | Capacitor 7 | `appId: com.goldeouro.app` |
| **Admin Panel** | `goldeouro-admin/` | Painel operacional: usuários, saques, relatórios, auditoria | Implementado (~156 arquivos `src/`) | **Sim** — Vercel manual/scripts | React 18, Vite 4, Radix UI, Recharts | `admin.goldeouro.lol` |
| **Admin PWA** | `goldeouro-admin/vite.config.js` | PWA admin | Implementado | Sim | `vite-plugin-pwa` | |
| **Mobile Expo** | `goldeouro-mobile/` | App nativo Expo (Home, Game, Profile, Leaderboard) | Parcial | Não — sem CI/CD no repo | Expo ~51, React Native 0.74 | `eas.json` presente |
| **Build estático legado** | `player-dist-deploy/` | Artefato pré-compilado + proxy API | Congelado | Incerto | Vercel config | Excluído de deploy raiz |
| **Backup frontend V1** | `backup/goldeouro-v1-operacional-2026-05-27/frontend-*` | Snapshot 2026-05-27 | Arquivo histórico | Não | — | Patrimônio de arquivo |

### 2.2 Rotas principais — Player

| Rota | Página | Protegida |
|------|--------|-----------|
| `/` | Login | — |
| `/register`, `/forgot-password`, `/reset-password` | Auth | — |
| `/dashboard` | Dashboard | Sim |
| `/game`, `/gameshoot` | Jogo (penalty shoot) | Sim |
| `/profile` | Perfil | Sim |
| `/withdraw` | Saque PIX | Sim |
| `/pagamentos` | Depósitos PIX | Sim |
| `/download` | Download PWA/APK | — |

### 2.3 Rotas principais — Admin

| Rota | Página | Finalidade |
|------|--------|------------|
| `/`, `/painel` | Dashboard | Métricas operacionais |
| `/lista-usuarios` | Users | Gestão de usuários |
| `/saque-usuarios` | SaqueUsuarios | **Aprovação de saques (ativa)** |
| `/transacoes` | Transacoes | Relatório financeiro/ledger |
| `/relatorio-financeiro` | RelatorioFinanceiro | Gestão financeira |
| `/auditoria`, `/logs` | Auditoria, LogsSistema | Auditoria admin |
| `/fila`, `/chutes`, `/top-jogadores` | Operacional gameplay | Monitoramento |
| `/backup`, `/configuracoes`, `/exportar-dados` | Ops | Ferramentas admin |

**Nota:** existem páginas em `goldeouro-admin/src/pages/` não montadas em `AppRoutes.jsx` (ex.: `Saques.jsx` legado).

---

## 3. Backend

### 3.1 Inventário detalhado

| Ativo | Localização | Finalidade | Status | Produção | Dependências | Observações |
|-------|-------------|------------|--------|----------|--------------|-------------|
| **Entry point HTTP** | `server-fly.js` (~4.700 linhas) | Monólito Express — 44 rotas inline | Implementado | **Sim** — `npm start`, Dockerfile, Fly | Express, Supabase, JWT, Helmet | v1.2.1-deploy-functional |
| **Entry legado** | `server-fly-deploy.js` | Versão anterior | Legado | Não referenciado | — | |
| **Serviço PIX MP** | `services/pix-mercado-pago.js` | PIX IN helpers + PIX OUT transaction-intents | Implementado | **Sim** | Axios, crypto Ed25519 | Core financeiro MP |
| **Serviço email** | `services/emailService.js` | Recuperação de senha | Implementado | Sim | Nodemailer | |
| **Admin saques** | `controllers/adminWithdrawController.js` | Approve / approve-and-send / cancel | Implementado | **Sim** | Supabase, payout domain | 3 rotas montadas |
| **Domínio payout** | `src/domain/payout/processPendingWithdrawals.js` | Ledger, rollback, worker, admin payout | Implementado | **Sim** | Supabase, factory | Core saques |
| **Worker payout** | `src/workers/payout-worker.js` | Processamento automático saques | Implementado | **Sim** — processo Fly `payout_worker` | Supabase, MP token | Gate `ENABLE_PIX_PAYOUT_WORKER` |
| **WebSocket** | `src/websocket.js` | Comunicação real-time | Implementado | Sim | WS nativo | Montado no HTTP server |
| **Config Supabase** | `database/supabase-unified-config.js` | Cliente Supabase service role | Implementado | **Sim** | `@supabase/supabase-js` | |
| **Env validation** | `config/required-env.js` | Boot guards | Implementado | **Sim** | — | Exige MP deposit token em prod |
| **PIX validator** | `utils/pix-validator.js` | Validação chave/valor saque | Implementado | **Sim** | — | |
| **Webhook validator** | `utils/webhook-signature-validator.js` | HMAC MP depósito + payout | Implementado | **Sim** | crypto | ~575 linhas |
| **Admin audit logger** | `src/utils/adminAuditLogger.js` | Trilha ações admin | Implementado | Sim | Supabase `admin_logs` | |
| **Routes legadas** | `routes/` (19 arquivos) | Módulos Express antigos | Existe | **Não montadas** | — | `routes/index.js` = `{}` |
| **Controllers legados** | `controllers/` (6 arquivos) | Auth, payment, game, user | Existe | 1/6 montado | — | |
| **Middlewares legados** | `middlewares/` (10 arquivos) | Auth, rate limit, helmet | Existe | **Não importados** — inline em `server-fly.js` | — | Duplicação arquitetural |
| **Services legados** | `services/` (11 arquivos) | Cache, ranking, notificações | Existe | 2/11 ativos | — | |

### 3.2 Rotas HTTP ativas (`server-fly.js`)

| Área | Endpoints | Count |
|------|-----------|-------|
| Auth | `/api/auth/*`, `/auth/login` | 7 |
| User | `/api/user/profile`, `/usuario/perfil` | 3 |
| Gameplay | `/api/games/shoot`, `/api/games/chutes/recentes` | 2 |
| Withdraw | `/api/withdraw/request`, `/api/withdraw/history` | 2 |
| Admin | `/api/admin/*` (users, chutes, withdraw, dashboard, audit) | 13 |
| Payments PIX | `/api/payments/pix/*`, webhooks | 6 |
| Health/Ops | `/health`, `/meta`, `/api/metrics`, etc. | 10 |
| Compat | `/api/fila/entrar` (stub) | 1 |

### 3.3 Scripts operacionais (`scripts/`)

| Categoria | Localização | Finalidade | Produção |
|-----------|-------------|------------|----------|
| Payouts MP | `scripts/payouts/` | Audit, sandbox, validação prod | Ops manual |
| Celcoin | `scripts/test-celcoin-auth.mjs`, `verify-celcoin-prep.mjs` | OAuth sandbox, verificação prep | Dev/sandbox |
| Efí spike | `scripts/efi/` | OAuth/webhook/PIX OUT sandbox | Experimental |
| Missões F2–F6 | `scripts/f2-*`, `f6-*`, `v1-*` | Auditorias, gates, RLS | Ops/audit |
| Certificação | `scripts/certification/`, `resilience/`, `reliability/` | Gates operacionais | Homologação |
| CI | `scripts/ci/verify-fly-meta.sh` | Validação pós-deploy | CI |
| E2E | `scripts/e2e/` | Auditoria produção | Homologação |

**Volume:** ~200+ arquivos em `scripts/` (inclui históricos e obsoletos).

---

## 4. Banco de Dados

### 4.1 Plataforma

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **PostgreSQL (Supabase)** | Cloud Supabase | Persistência principal | Operacional | **Sim** |
| **Cliente JS** | `database/supabase-unified-config.js` | Conexão backend | Ativo | **Sim** |
| **Schema consolidado** | `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql` | DDL referência | Documentado | Evidência schema |
| **Migrations formais** | `database/migrations/` (4 arquivos) | Evolução versionada | Implementado | Apply manual controlado |
| **Patches operacionais** | `database/patches/` (~15 arquivos) | Hotfixes controlados | Implementado | Apply manual |
| **Rollback scripts** | `database/rollback/` | Reversão patches | Implementado | Contingência |
| **RLS remediação** | `database/patches/F6-1C-*`, `corrigir-rls-*` | Row Level Security | Implementado | Documentado F6 |

### 4.2 Tabelas principais

| Tabela | Finalidade | Wallet/Ledger/Game |
|--------|------------|-------------------|
| `usuarios` | Contas, `saldo`, stats, `cpf_cnpj` | **Wallet** |
| `ledger_financeiro` | Auditoria imutável financeira | **Ledger** |
| `pagamentos_pix` | Depósitos PIX IN | Financeiro |
| `saques` | Solicitações PIX OUT | Financeiro |
| `lotes` | Pools de apostas por valor | **Gameplay** |
| `chutes` | Histórico de jogadas | **Gameplay** |
| `metricas_globais` | Contador global, milestone Gol de Ouro | **Gameplay** |
| `admin_logs` | Auditoria ações admin | Governança |
| `password_reset_tokens` | Reset senha | Auth |
| `transacoes` | Histórico legado | Legado |
| `ranking`, `conquistas`, `fila_jogadores` | Features auxiliares | Parcial/legado |

### 4.3 RPCs PostgreSQL (funções críticas)

| RPC | Arquivo canônico | Finalidade | Produção |
|-----|------------------|------------|----------|
| **`shoot_apply`** | `database/shoot_apply_atomic_transaction.sql` | Gameplay atômico: lote + chute + saldo + premiação | **Sim** — fonte da verdade do jogo |
| **`claim_and_credit_approved_pix_deposit`** | `database/claim_and_credit_approved_pix_deposit.sql` | PIX IN idempotente: crédito saldo + ledger | **Sim** |
| Ranking/cache | `database/schema-ranking.sql` | Stats e ranking | Parcial |
| Utilitários | `corrigir-supabase-security-warnings.sql` | Triggers, cleanup | Ops |

**Observação DD:** a lógica econômica do jogo (sorteio, lotes, prêmios R$5 + Gol de Ouro R$100) reside **no PostgreSQL**, não no Node.js — ativo de IP central.

---

## 5. Sistema Financeiro

### 5.1 Inventário

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **Wallet interna** | `usuarios.saldo` | Saldo virtual do jogador | Implementado | **Sim** |
| **Ledger** | `ledger_financeiro` + `schema-ledger-financeiro.sql` | Trilha auditável append-only | Implementado | **Sim** |
| **Payment Engine** | `src/finance/` | Abstração multi-PSP | Parcial | Payout path ativo |
| **Factory** | `src/finance/factory/FinanceProviderFactory.js` | Seleção provider | Implementado | **Sim** (default MP) |
| **Contrato PIX IN** | `src/finance/contracts/PaymentProvider.js` | Interface JSDoc | Definido | **Não wired** |
| **Contrato PIX OUT** | `src/finance/contracts/PayoutProvider.js` | Interface JSDoc | Definido | **Sim** |
| **MP Payout adapter** | `src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js` | Adapter MP | Implementado | **Sim** |
| **Celcoin provider** | `src/finance/providers/celcoin/` (6 arquivos) | Provider alternativo | Preparatório | **Não** — flags off |
| **Mock providers** | `src/finance/providers/mock/` | Dev/test | Implementado | Dev only |
| **Compat layer** | `src/finance/compat/createPixWithdrawCompat.js` | Ponte legado → factory | Implementado | **Sim** |

### 5.2 Fluxos financeiros

| Fluxo | Implementação | Provider | Produção |
|-------|---------------|----------|----------|
| **PIX Cash-In** | `server-fly.js` inline | Mercado Pago | **Sim** |
| **PIX Cash-Out request** | `server-fly.js` + wallet debit | Domínio interno | **Sim** |
| **PIX Cash-Out automático** | Worker + factory | Mercado Pago (default) | Código sim; **bloqueio institucional MP Payouts** |
| **Saque manual admin** | `adminWithdrawController.js` | Sem PSP / com PSP | **Sim** |
| **Reconciliação PIX** | `setInterval` em `server-fly.js` | Mercado Pago | Configurável |

### 5.3 Feature flags financeiras

| Flag | Default | Efeito |
|------|---------|--------|
| `PAYOUT_PROVIDER` | `mercadopago` | Provider payout |
| `PAYOUT_PIX_ENABLED` | — | Habilita PIX OUT |
| `PAYOUT_MODE` | — | `manual` \| `auto` |
| `ENABLE_PIX_PAYOUT_WORKER` | — | Worker Fly |
| `CELCOIN_ENABLED` | `false` | Gate Celcoin |
| `CELCOIN_HTTP_ENABLED` | `false` | Gate HTTP real Celcoin |
| `MOCK_FINANCE_ENABLED` | `false` | Mock (proibido prod) |
| `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` | — | PIX IN prod |
| `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` | — | PIX OUT prod |

---

## 6. Gameplay

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **Engine principal** | RPC `shoot_apply` (`database/shoot_apply_atomic_transaction.sql`) | Lógica de lotes, sorteio, prêmios | Implementado | **Sim** |
| **HTTP gameplay** | `POST /api/games/shoot` em `server-fly.js` | Thin layer → RPC | Implementado | **Sim** |
| **Lotes (batches)** | Tabela `lotes` + lógica RPC | Pool por valor aposta (R$1/2/5/10) | Implementado | **Sim** |
| **Chutes** | Tabela `chutes` | Histórico jogadas | Implementado | **Sim** |
| **Premiação goal** | RPC | R$5 por gol no lote | Implementado | **Sim** |
| **Premiação Gol de Ouro** | RPC + `metricas_globais` | R$100 milestone global | Implementado | **Sim** |
| **Validador integridade lotes** | `utils/lote-integrity-validator.js` | Auditoria lotes | Implementado | Ops |
| **Frontend game service** | `goldeouro-player/src/services/gameService.js` | Cliente HTTP jogo | Implementado | **Sim** |
| **Game controller legado** | `controllers/gameController.js` | Lógica local antiga | Legado | Não montado |
| **Patches engine** | `database/patches/F2-2B..F2-2C-*` | Cirurgia econômica V1 | Aplicados (doc) | **Sim** |

---

## 7. Painel Administrativo

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **SPA Admin** | `goldeouro-admin/` | Painel operacional completo | Implementado | **Sim** |
| **Dashboard** | `pages/Dashboard.jsx` | Métricas | Implementado | Sim |
| **Saques** | `pages/SaqueUsuarios.jsx` | Aprovação manual + approve-and-send | Implementado | **Sim** — API `/api/admin/withdraw/*` |
| **Transações** | `pages/Transacoes.jsx` | Relatório `/api/admin/financial/report` | Implementado | Sim |
| **Usuários** | `pages/Users.jsx`, bloqueio | Gestão usuários | Implementado | Sim |
| **Auditoria** | `pages/Auditoria.jsx`, `LogsSistema.jsx` | Logs admin | Implementado | Sim |
| **Relatórios** | Múltiplas páginas `Relatorio*` | Financeiro, semanal, geral | Implementado | Sim |
| **Backup/Export** | `pages/Backup.jsx`, `ExportarDados.jsx` | Ops | Implementado | Parcial |
| **Deploy scripts** | `goldeouro-admin/scripts/` | Deploy Vercel, rollback | Implementado | Manual |

---

## 8. Infraestrutura

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **Fly.io backend** | `fly.toml` | Deploy API + worker | Implementado | **Sim** — `goldeouro-backend-v2`, região `gru` |
| **Dockerfile** | `Dockerfile` | Container Node 20 Alpine | Implementado | **Sim** — CMD `server-fly.js` |
| **Vercel player** | `goldeouro-player/vercel.json` | Deploy player | Implementado | **Sim** — CI automático |
| **Vercel admin** | `goldeouro-admin/vercel.json` | Deploy admin | Implementado | **Sim** — manual/scripts |
| **Supabase** | Cloud + `database/` | PostgreSQL managed | Operacional | **Sim** |
| **GitHub Actions** | `.github/workflows/` (12 workflows ativos) | CI/CD, security, monitor | Implementado | **Sim** |
| **Backend deploy CI** | `.github/workflows/backend-deploy.yml` | Deploy Fly em `main` | Implementado | **Sim** |
| **Frontend deploy CI** | `.github/workflows/frontend-deploy.yml` | Deploy Vercel player | Implementado | **Sim** |
| **Health monitor** | `.github/workflows/health-monitor.yml` | Poll `/health` contínuo | Implementado | **Sim** |
| **Security CI** | `.github/workflows/security.yml` | CodeQL, npm audit, TruffleHog | Implementado | **Sim** |
| **Dependabot** | `.github/dependabot.yml` | Atualização deps | Implementado | Sim |

### Ambientes

| Ambiente | Evidência | Componentes |
|----------|-----------|-------------|
| **Produção** | `NODE_ENV=production`, Fly + Vercel prod | Backend, player, admin, Supabase prod |
| **Staging/Dev** | Docs F2-2B staging, env examples | Supabase staging (documentado) |
| **Sandbox financeiro** | Scripts `payout:sandbox`, `test-celcoin-auth.mjs` | MP/Celcoin/Efí sandbox — ops manual |

---

## 9. Integrações

| Integração | Código | Docs | Webhook | OAuth | Produção |
|------------|--------|------|---------|-------|----------|
| **Mercado Pago PIX IN** | `services/pix-mercado-pago.js`, `server-fly.js` | Extensa (`docs/configuracoes/`, `F2-*`) | `POST /api/payments/webhook` | Access token estático | **Sim** |
| **Mercado Pago PIX OUT** | `pix-mercado-pago.js`, worker, factory | Trilha F2-4E/F2-5* | `POST /webhooks/mercadopago` | Token + Ed25519 | Código sim; **bloqueio onboarding** |
| **Celcoin** | `src/finance/providers/celcoin/` | `F4-*`, `F4.1-*`, `PAYMENT-ENGINE-V1.md` | Stub | `POST /v5/token` (F4.1) | **Não** — `CELCOIN_ENABLED=false` |
| **Asaas** | **Zero código** | Mencionado em `PAYMENT-ENGINE-V1.md` | — | — | **Não** — aguardando API |
| **Efí/Gerencianet** | `scripts/efi/` apenas | `F3-1A`, `F5-0*` | Script sandbox | Script sandbox | **Não** — spike |
| **Email (SMTP)** | `services/emailService.js` | — | — | — | Sim (auth recovery) |
| **Supabase Auth/DB** | `database/supabase-unified-config.js` | `docs/configuracoes/` | — | Service role | **Sim** |

---

## 10. Segurança

| Ativo | Localização | Finalidade | Status | Produção |
|-------|-------------|------------|--------|----------|
| **JWT jogador** | `server-fly.js` `authenticateToken` | Bearer auth rotas protegidas | Implementado inline | **Sim** |
| **JWT admin DB** | `server-fly.js` `requireAdministradorDb` | RBAC administrador | Implementado | **Sim** |
| **Admin token header** | `middlewares/authMiddleware.js` | `x-admin-token` | Existe | Uso incerto vs inline |
| **bcrypt** | Auth flows | Hash senhas | Implementado | **Sim** |
| **Helmet** | `server-fly.js` | Security headers, CSP report-only | Implementado | **Sim** |
| **Rate limiting** | `server-fly.js` inline | 100/15min geral; 5 login/recovery | Implementado | **Sim** |
| **CORS** | `server-fly.js` | Origins oficiais + env | Implementado | **Sim** |
| **Webhook HMAC** | `utils/webhook-signature-validator.js` | Validação MP depósito/payout | Implementado | **Sim** |
| **RLS Supabase** | Patches F6-1C | Row Level Security | Documentado/aplicado | Evidência patches |
| **Mock finance guard** | `FinanceProviderFactory.js` | Bloqueia mock em prod | Implementado | **Sim** |
| **CodeQL / audit CI** | `.github/workflows/security.yml` | SAST, dependency audit | Implementado | **Sim** |
| **Auditorias segurança** | `docs/seguranca/` (~33 docs) | PR-18, webhooks, SSRF, branch protection | Documentado | Governança |

---

## 11. Documentação

| Categoria | Localização | Volume | Finalidade |
|-----------|-------------|--------|------------|
| **Arquitetura** | `docs/arquitetura/` | 1 doc oficial | Payment Engine V1 |
| **Relatórios / auditorias** | `docs/relatorios/` | ~800+ `.md` | Trilha forense F1–F6, H4*, payouts, RLS |
| **Executive / Data Room** | `docs/executive/final-delivery/` | 12 pastas | Handbook, certificação, demo |
| **Auditorias V1** | `docs/audits/` | 14 docs | UX, financeiro, investidor |
| **Segurança** | `docs/seguranca/` | ~33 docs | Hardening, CodeQL, webhooks |
| **Governança** | `docs/governance/` | 4 docs | Maturidade, certificação contínua |
| **Certificação** | `docs/certification/` | 2 docs | Certificação oficial V1 |
| **Configurações / runbooks** | `docs/configuracoes/`, `docs/runbooks/` | ~40 docs | MP, Supabase, deploy, workers |
| **Reliability** | `docs/reliability/` | Simulações | Failure modes documentados |
| **Data Room (este doc)** | `docs/data-room/` | DR-02 | Inventário oficial |

**Volume total `docs/`:** ~1.830 arquivos Markdown (inclui históricos e snapshots).

**Documentos âncora:**

- `docs/executive/final-delivery/01-EXECUTIVE/GOLDEOURO-V1-MASTER-HANDBOOK.md`
- `docs/arquitetura/PAYMENT-ENGINE-V1.md`
- `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`
- `docs/relatorios/H4-Z-ENCERRAMENTO-GERAL-AUDITORIAS-V1-2026-05-25.md`

---

## 12. Tabela Resumo Consolidada

| Ativo | Localização | Status | Produção |
|-------|-------------|--------|----------|
| Backend API monolito | `server-fly.js` | Implementado | **Sim** |
| Worker payout | `src/workers/payout-worker.js` | Implementado | **Sim** |
| Frontend Player PWA | `goldeouro-player/` | Implementado | **Sim** |
| Frontend Admin | `goldeouro-admin/` | Implementado | **Sim** |
| Mobile Expo | `goldeouro-mobile/` | Parcial | Não |
| PostgreSQL / Supabase | Cloud + `database/` | Operacional | **Sim** |
| RPC gameplay `shoot_apply` | `database/shoot_apply_atomic_transaction.sql` | Implementado | **Sim** |
| RPC PIX IN | `database/claim_and_credit_approved_pix_deposit.sql` | Implementado | **Sim** |
| Wallet `usuarios.saldo` | Supabase | Implementado | **Sim** |
| Ledger `ledger_financeiro` | Supabase | Implementado | **Sim** |
| Payment Engine | `src/finance/` | Parcial | Payout sim |
| Mercado Pago PIX IN | `services/pix-mercado-pago.js` + monólito | Implementado | **Sim** |
| Mercado Pago PIX OUT | Worker + factory + MP API | Implementado | Código sim / payout bloqueado |
| Celcoin provider | `src/finance/providers/celcoin/` | Preparatório | **Não** |
| Asaas | — | Planejado | **Não** |
| Efí scripts | `scripts/efi/` | Experimental | **Não** |
| Routes legadas | `routes/` | Legado | **Não** |
| Fly.io deploy | `fly.toml` + CI | Implementado | **Sim** |
| Vercel deploy | `*/vercel.json` + CI | Implementado | **Sim** |
| GitHub CI/CD | `.github/workflows/` | Implementado | **Sim** |
| Documentação | `docs/` (~1.830 md) | Extensa | Ativo IP/governança |
| Backup operacional V1 | `backup/goldeouro-v1-operacional-2026-05-27/` | Snapshot | Arquivo histórico |

---

## 13. Classificação de Ativos

### Produção

Ativos com evidência de deploy, CI/CD ou operação documentada em ambiente produtivo:

- `server-fly.js` + processo Fly `payout_worker`
- `goldeouro-player/` → Vercel (`goldeouro.lol`)
- `goldeouro-admin/` → Vercel (`admin.goldeouro.lol`)
- Supabase PostgreSQL (tabelas, RPCs, RLS patches)
- Mercado Pago PIX IN (depósito + webhook + RPC crédito)
- Wallet + ledger + fluxo de saque (request + admin manual)
- Payment Engine factory (default `mercadopago`)
- Infra CI/CD (Fly deploy, Vercel player CI, health monitor, security)
- Autenticação JWT, Helmet, rate limit, webhook HMAC

### Homologação

Ativos implementados para validação, staging ou ops controlado — não default prod:

- Scripts `scripts/payouts/` (sandbox MP)
- Scripts `scripts/test-celcoin-auth.mjs`, `verify-celcoin-prep.mjs`
- Bootstrap staging `database/staging/`
- Patches SQL com runbooks de apply manual
- `docs/reliability/simulations/`
- Certificação gates `scripts/certification/`

### Experimental

Ativos de spike, POC ou dev-only:

- `src/finance/providers/mock/` (`MOCK_FINANCE_ENABLED`)
- `scripts/efi/` (OAuth/webhook/PIX OUT spike)
- `goldeouro-mobile/` (Expo — sem CI)
- `player-dist-deploy/` (build congelado)
- `server-fly-deploy.js`, `routes/` legadas, controllers/middlewares não montados
- Capacitor Android (sem pipeline CI evidenciado)

### Planejado

Ativos documentados ou contratados conceitualmente — sem implementação no código:

- **Asaas** — candidato Cash-Out; zero código
- **Celcoin PIX OUT** — stubs; DICT + payment não implementados
- **Celcoin PIX IN** — `CelcoinPaymentProvider` não wired
- **`PIX_IN_PROVIDER` env routing** — não existe na factory
- **Webhooks genéricos por provider** — `/webhooks/celcoin` não criado
- **Efí `PAYOUT_PROVIDER=efi`** — throw explícito (não implementado)
- **mTLS Celcoin produção**

---

## 14. Patrimônio Tecnológico Consolidado

### Infraestrutura

- Fly.io (`goldeouro-backend-v2`, região GRU, 2 processos: app + payout_worker)
- Vercel (player + admin)
- Supabase (PostgreSQL managed)
- GitHub (repo, Actions, Dependabot, security workflows)
- Docker (Node 20 Alpine, build reprodutível)

### Software

- Backend Node.js/Express monolito funcional (`server-fly.js`)
- Frontends React/Vite (player v1.2.0, admin v1.1.0)
- PWA (Workbox, manifest, service workers)
- Worker background payout
- WebSocket manager
- ~200 scripts operacionais (audit, deploy, gates)
- Mobile Expo (parcial)

### Financeiro

- Wallet virtual (`usuarios.saldo`)
- Ledger append-only (`ledger_financeiro`)
- Fluxo PIX IN Mercado Pago (produção)
- Fluxo saque completo (request → ledger → worker → webhook)
- Admin dual-mode (manual + approve-and-send)
- Payment Engine (`src/finance/`) com factory multi-PSP
- Integração MP transaction-intents + Ed25519
- Preparação Celcoin (6 módulos, OAuth F4.1)

### Gameplay / IP de produto

- RPC `shoot_apply` — motor econômico atômico no PostgreSQL
- Sistema de lotes por valor de aposta
- Mecânica Gol de Ouro (milestone R$100)
- Premiação por gol (R$5)
- Frontend de jogo (penalty shoot UI)
- Validador de integridade de lotes

### Arquitetura

- Documento oficial Payment Engine V1 (`docs/arquitetura/PAYMENT-ENGINE-V1.md`)
- Contratos `PaymentProvider` / `PayoutProvider`
- Padrão factory + adapters + feature flags
- ADR-001 embutido na Payment Engine doc
- Monólito + extração financeira incremental (F4.0E-S1)

### Documentação

- ~1.830 arquivos Markdown
- Master Handbook executivo
- Certificação V1 oficial
- Trilha de auditorias F1–F6 (payouts, RLS, cirurgia econômica)
- Runbooks operacionais (workers, deploy, rollback)
- Relatórios de due diligence históricos (H4*, OC-INC-*)

### Governança

- Branch protection documentada
- CodeQL + npm audit CI
- Admin audit logs (`admin_logs`)
- Gates de deploy (path-filter — docs/scripts não disparam deploy)
- Política mock finance forbidden in production
- Encerramento formal auditorias V1 (`H4-Z-*`)

### Propriedade Intelectual

| Ativo de IP | Evidência |
|-------------|-----------|
| Marca **Gol de Ouro™** | Manifests PWA, docs executive, domínio `goldeouro.lol` |
| Mecânica de jogo (lotes + milestone) | RPC `shoot_apply`, patches F2-2B/C |
| Modelo econômico V1 | Ledger + wallet + premiação documentada |
| Payment Engine architecture | `src/finance/` + docs arquitetura |
| Corpus de auditoria e certificação | `docs/` — know-how operacional |
| Frontend UX (player + admin) | `goldeouro-player/`, `goldeouro-admin/` |

---

## 15. Conclusão Executiva — Due Diligence

### O que um comprador efetivamente adquire

Ao adquirir o Gol de Ouro™, um comprador adquire um **ativo tecnológico operacional de entretenimento com premiação financeira**, composto por:

**1. Plataforma em produção (~95% V1)**

Uma aplicação web full-stack já deployada e acessível publicamente: frontend do jogador (`goldeouro.lol`), painel administrativo (`admin.goldeouro.lol`) e backend API (`goldeouro-backend-v2.fly.dev`), sustentados por PostgreSQL Supabase e pipeline CI/CD maduro.

**2. Motor de jogo proprietário**

A lógica central de gameplay — alocação de lotes, sorteio, premiação e movimentação de saldo — está implementada como **RPC PostgreSQL atômica** (`shoot_apply`), representando IP diferenciada independente do backend Node.js. O frontend de jogo (penalty shoot) e validadores de integridade complementam o ativo.

**3. Sistema financeiro dual-layer**

- **Camada interna:** wallet virtual (`usuarios.saldo`) + ledger imutável (`ledger_financeiro`) com idempotência, correlation IDs e rollback — prontos para auditoria.
- **Camada externa:** integração PIX IN via Mercado Pago **operacional em produção**; fluxo PIX OUT **completo em código** (request, worker, webhook, admin) com bloqueio documentado no onboarding Mercado Pago Payouts — não é lacuna de arquitetura, é dependência institucional do PSP.

**4. Payment Engine multi-PSP (fundação)**

Infraestrutura de abstração (`src/finance/`) que permite adicionar Celcoin, Asaas ou futuros PSPs sem reescrever wallet/ledger/gameplay. Celcoin já possui stubs, OAuth sandbox client (F4.1) e testes de verificação. Mercado Pago permanece provider default.

**5. Painel administrativo operacional**

Ferramentas de gestão de usuários, aprovação de saques (manual e com envio PSP), relatórios financeiros, auditoria e exportação — essenciais para operação regulada de premiação.

**6. Patrimônio documental excepcional**

~1.830 documentos incluindo auditorias forenses, runbooks, certificação V1, handbook executivo e trilha completa de incidentes/payouts — reduz risco de informação assimétrica em DD e acelera onboarding de equipe técnica.

**7. Infraestrutura cloud e DevOps**

Fly.io + Vercel + Supabase + GitHub Actions com health monitoring, security scanning e gates de deploy — ativo operacional, não apenas código fonte.

### O que o comprador **não** adquire pronto

| Item | Situação |
|------|----------|
| PIX OUT automático em produção | Bloqueio PSP; código pronto |
| Asaas integrado | Zero código; planejamento only |
| Celcoin em produção | Preparatório; sandbox OAuth testável |
| App mobile publicado | Expo parcial; sem CI |
| Arquitetura 100% desacoplada de MP | PIX IN + webhooks ainda no monólito |
| Contas/credenciais PSP | Não transferidas via Git — negociação separada |

### Avaliação de risco para comprador

| Dimensão | Avaliação |
|----------|-----------|
| **Completude V1** | Alta (~95%) |
| **Operação PIX IN** | Estável, produção |
| **Operação PIX OUT** | Manual operacional; automático pendente PSP |
| **Escalabilidade multi-PSP** | Fundação pronta; execução parcial |
| **Dívida técnica** | Média — monólito + routes legadas + middlewares duplicados |
| **Documentação / governança** | Muito alta |
| **IP gameplay** | Forte — lógica no PostgreSQL RPC |

### Recomendação DD

O ativo representa uma **plataforma de entretenimento financeiro funcional** com receita de depósitos PIX operacional, mecânica de jogo proprietária auditável e infraestrutura preparada para destravar Cash-Out via PSP alternativo. O valor principal está na **combinação código + dados + documentação + operação**, não em integrações PSP isoladas.

---

## 16. Lacunas e Observações do Inventário

| # | Lacuna | Impacto DD |
|---|--------|------------|
| 1 | **Asaas** mencionado no contexto operacional mas **zero código** no repositório | Confirmar status comercial externo ao repo |
| 2 | **Credenciais** (`.env`, `.env.production` no admin) podem existir no repo — não inventariadas por segurança | Due diligence de secrets separada |
| 3 | **Volume `docs/`** inclui duplicatas e históricos — filtrar para DD | Ruído; valor em docs âncora |
| 4 | **`routes/` legadas** (~180 handlers) não montadas — risco de confusão | Não são ativo operacional |
| 5 | **Migrations formais** apenas 4 arquivos; evolução via `patches/` manual | Processo de schema requer ops discipline |
| 6 | **Sem pasta ADR formal** — decisões em docs de arquitetura | ADR-001 em PAYMENT-ENGINE-V1.md |
| 7 | **Mobile Expo** sem evidência de produção | Ativo opcional / roadmap |
| 8 | **E2E payout produção** não certificado end-to-end | Risco operacional Cash-Out |

---

## Metadados do documento

| Campo | Valor |
|-------|-------|
| **ID** | DR-02 |
| **Título** | Inventário Oficial do Ativo |
| **Versão** | 1.0 |
| **Autor** | Auditoria técnica automatizada (READ-ONLY) |
| **Base** | Repositório `goldeouro-backend` — snapshot 2026-06-23 |
| **Ativos inventariados (núcleo)** | ~130 ativos nomeados + ~1.830 docs |
| **Código alterado** | **Nenhum** |

---

*Documento preparado para composição do Data Room Gol de Ouro™ V1. Todas as afirmações derivam de evidências encontradas no repositório; itens não encontrados estão explicitamente marcados como lacunas ou planejados.*
