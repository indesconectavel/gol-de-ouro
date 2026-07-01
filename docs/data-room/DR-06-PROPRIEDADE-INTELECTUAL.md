# DR-06 — Propriedade Intelectual e Ativos Intangíveis

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — patrimônio intelectual documentado a partir de evidências do repositório  
**Documentos relacionados:** DR-02 (Inventário), DR-03 (Arquitetura), DR-04 (Governança), DR-05 (Infraestrutura), `docs/arquitetura/PAYMENT-ENGINE-V1.md`  
**Repositório:** monorepo `goldeouro-backend`

---

# 1. Resumo Executivo

O patrimônio intelectual do Gol de Ouro™ V1 é composto por **código proprietário full-stack**, **lógica de negócio crítica em PostgreSQL (RPCs)**, **arquitetura financeira dual-layer (wallet + ledger)**, **Payment Engine multi-PSP**, **corpus documental extenso** (956 arquivos Markdown em `docs/`) e **ativos de marca/domínio** associados ao produto.

### Síntese do patrimônio

| Categoria | Quantidade aproximada (evidência repo) | Natureza |
|-----------|----------------------------------------|----------|
| **Código executável proprietário** | **593** arquivos fonte medidos (player/admin/src, `server-fly.js`, controllers, services, database, scripts) | Software original |
| **Documentação institucional** | **956** arquivos `.md` em `docs/` (contagem repo 2026-06-26) | Know-how, auditorias, ADRs |
| **Data Room** | 6 documentos (DR-02 a DR-06) | Due Diligence |
| **RPCs/algoritmos SQL** | 2 RPCs críticas + views + patches | IP diferenciada no banco |
| **Scripts operacionais** | ~200+ em `scripts/` | Metodologia, certificação, auditoria |
| **Ativos visuais PWA** | 6 ícones SVG + manifest | Marca digital player |
| **Licença declarada (backend)** | MIT em `package.json` raiz | Ver riscos §12 |

### O que é exclusivamente proprietário

- Mecânica de gameplay (lotes, chutes, milestone **Gol de Ouro**, RPC `shoot_apply`)
- Modelo econômico V1 (wallet, ledger, taxas, premiação)
- Payment Engine (`src/finance/`) — contratos, factory, adapters
- UX completa player + admin (React)
- Metodologia de certificação, auditoria e governança documentada
- Integração orchestration (monólito + worker + webhooks) — implementação original

### O que depende de terceiros

- Frameworks open source (React, Express, Vite, Tailwind, etc.)
- Infraestrutura cloud (Fly.io, Vercel, Supabase, GitHub)
- PSPs (Mercado Pago produção; Celcoin/Efí prep; Asaas planejado)
- Bibliotecas UI (Radix UI, Lucide, Recharts) — licenças OSS

**Nota metodológica:** este documento descreve ativos **encontrados no repositório**. Não substitui assessoria jurídica sobre registro de marca, contratos de trabalho, cessão de direitos autorais ou licenciamento comercial.

---

# 2. Software Proprietário

Inventário de componentes **implementados no repositório** — código original do projeto, não bibliotecas de terceiros.

## 2.1 Frontend

| Ativo | Localização | Escopo IP | Arquivos (evidência) |
|-------|-------------|-----------|----------------------|
| **Player Web SPA** | `goldeouro-player/src/` | Login, dashboard, jogo penáltis, PIX, saques, perfil | ~126 arquivos `src/` |
| **Player PWA** | `vite.config.ts`, `src/pwa-sw-updater.tsx` | Manifest, service worker, instalação | Workbox + VitePWA |
| **Player Android wrapper** | `goldeouro-player/android/`, `capacitor.config.ts` | `appId: com.goldeouro.app`, `appName: Gol de Ouro` | Capacitor 7 — parcial |
| **Admin Panel** | `goldeouro-admin/src/` | Dashboard, usuários, saques, relatórios, auditoria, export | ~156 arquivos `src/` |
| **Admin PWA** | `goldeouro-admin/vite.config.js` | PWA operacional | vite-plugin-pwa |
| **Mobile Expo** | `goldeouro-mobile/` | Home, Game, Profile, Leaderboard | Parcial — sem CI prod |

## 2.2 Backend

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **API monolítica** | `server-fly.js` (~4.700 linhas, 44 rotas) | Auth JWT, gameplay HTTP, PIX IN, admin API, webhooks, health |
| **Entry legado** | `server-fly-deploy.js` | Versão anterior — não referenciada em prod |
| **Config boot** | `config/required-env.js` | Guards de ambiente produção |
| **WebSocket** | `src/websocket.js` | Comunicação real-time montada no HTTP server |

## 2.3 Painel administrativo (lógica)

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **Controller saques** | `controllers/adminWithdrawController.js` | Approve, approve-and-send, cancel |
| **Audit logger** | `src/utils/adminAuditLogger.js` | Trilha `admin_logs` |
| **Páginas operacionais** | `goldeouro-admin/src/pages/` | SaqueUsuarios, Transacoes, RelatorioFinanceiro, Auditoria, etc. |

## 2.4 Gameplay

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **RPC atômica** | `database/shoot_apply_atomic_transaction.sql` | Lotes, sorteio, prêmios, milestone Gol de Ouro, débito/crédito saldo |
| **Frontend jogo** | `goldeouro-player/src/` (rotas `/game`, `/gameshoot`) | UX penáltis, áudio, animação |
| **Métricas globais** | Tabela `metricas_globais` + RPC | Contador global, último gol de ouro |
| **Patches econômicos** | `database/patches/F2-2B*`, `F2-2C*` | Regras V1-only, cirurgia econômica documentada |

## 2.5 Wallet

| Ativo | Implementação | Escopo IP |
|-------|---------------|-----------|
| **Saldo mutável** | Coluna `usuarios.saldo` | Modelo wallet interna |
| **Débito/crédito gameplay** | RPC `shoot_apply` | Movimentação atômica por chute |
| **Crédito depósito** | RPC `claim_and_credit_approved_pix_deposit` | Crédito PIX IN idempotente |

## 2.6 Ledger

| Ativo | Implementação | Escopo IP |
|-------|---------------|-----------|
| **Trilha imutável** | Tabela `ledger_financeiro` + `database/schema-ledger-financeiro.sql` | Append-only, tipos: deposito, saque, taxa, rollback, payout_confirmado |
| **Idempotência** | Correlation IDs, validação duplicatas | Runbooks + scripts auditoria |
| **Reconciliação** | Webhooks + worker + admin | Lógica proprietária de consistência |

## 2.7 Payment Engine

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **Contratos** | `src/finance/contracts/PaymentProvider.js`, `PayoutProvider.js` | Abstração multi-PSP |
| **Factory** | `src/finance/factory/FinanceProviderFactory.js` | Seleção provider por env, guards |
| **Adapter MP** | `src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js` | Ponte payout MP |
| **Adapter Celcoin** | `src/finance/providers/celcoin/*` (5 arquivos) | Prep OAuth + stubs |
| **Mock providers** | `src/finance/providers/mock/*` | Testes — forbidden prod |
| **Compat layer** | `src/finance/compat/createPixWithdrawCompat.js` | Ponte legado → factory |
| **Documentação ADR** | `docs/arquitetura/PAYMENT-ENGINE-V1.md` | ADR-001 embutido |

**Total módulos Payment Engine:** 12 arquivos `.js` em `src/finance/`.

## 2.8 Workers

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **Payout worker** | `src/workers/payout-worker.js` | Loop assíncrono saques PIX OUT |
| **Domínio payout** | `src/domain/payout/processPendingWithdrawals.js` | Ledger, rollback, processamento fila |

## 2.9 Serviços e utilitários

| Ativo | Localização | Escopo IP |
|-------|-------------|-----------|
| **PIX Mercado Pago** | `services/pix-mercado-pago.js` | PIX IN helpers + PIX OUT transaction-intents Ed25519 |
| **Email** | `services/emailService.js` | Recovery senha |
| **Webhook validator** | `utils/webhook-signature-validator.js` (~575 linhas) | HMAC depósito + payout |
| **PIX validator** | `utils/pix-validator.js` | Validação chave/valor saque |
| **Supabase config** | `database/supabase-unified-config.js` | Cliente service role |

## 2.10 Scripts (metodologia operacional)

| Categoria | Volume | Escopo IP |
|-----------|--------|-----------|
| Auditorias F2–F6 | `scripts/f2-*`, `f6-*` | Metodologia auditoria read-only |
| Payouts | `scripts/payouts/` | Sandbox, validação prod |
| Certificação | `scripts/certification/`, `reliability/`, `resilience/` | Gates CERTIFIED/DEGRADED/INVALID |
| Governança | `scripts/governance/` | Autonomous reliability check |
| Celcoin/Efí | `scripts/test-celcoin-auth.mjs`, `scripts/efi/` | Verificação prep PSP |
| E2E | `scripts/e2e/` | Auditoria produção |

**Volume total:** ~200+ arquivos ativos em `scripts/` (DR-02 §3.3).

## 2.11 Legado não montado (patrimônio parcial)

Existem mas **não compõem runtime produção** — ainda são ativos versionados:

- `routes/` — 19 arquivos não montados
- `controllers/` — 5/6 legados
- `middlewares/` — 10 arquivos duplicados (inline no monólito)
- `services/` — 9/11 legados

---

# 3. Arquitetura Proprietária

## 3.1 Arquitetura geral

Documentada em DR-03 — princípios observáveis:

| Princípio | Manifestação proprietária |
|-----------|---------------------------|
| Monólito operacional + extração incremental | `server-fly.js` + `src/finance/` + worker |
| Lógica crítica no banco | RPCs atômicas — IP independente do Node |
| Wallet + ledger dual-layer | Modelo financeiro auditável |
| Evolução multi-PSP | Payment Engine factory + adapters |
| Governança por documentação | Corpus `docs/` como ativo intelectual |

## 3.2 Arquitetura financeira

```text
Usuário → PIX IN (MP inline) → webhook → claim_and_credit → ledger + wallet
Usuário → saque request → wallet debit → ledger → fila saques
Worker → FinanceProviderFactory → MercadoPagoPayoutProvider → MP API
Webhook payout → ledger payout_confirmado
Admin → approve manual / approve-and-send
```

## 3.3 Payment Engine — factory e fluxos

| Componente | Responsabilidade proprietária |
|------------|-------------------------------|
| `FinanceProviderFactory` | Boot guards, cache provider, health snapshot |
| `PayoutProvider` contract | Interface PIX OUT desacoplada |
| `PaymentProvider` contract | Interface PIX IN (implementação futura) |
| Feature flags | `PAYOUT_PROVIDER`, `CELCOIN_ENABLED`, `MOCK_FINANCE_ENABLED` |
| Separação PSP | Sem fallback silencioso entre providers |

## 3.4 Separação de responsabilidades

| Camada | Proprietário | Terceiro |
|--------|--------------|----------|
| UX player/admin | Gol de Ouro | React, Vite, Tailwind |
| API HTTP | Gol de Ouro | Express |
| Gameplay rules | Gol de Ouro (RPC SQL) | PostgreSQL engine |
| Wallet/ledger model | Gol de Ouro | Supabase hosting |
| PIX orchestration | Gol de Ouro | MP/Celcoin APIs |
| Infra deploy | Config proprietária | Fly, Vercel, GitHub |

---

# 4. Algoritmos

Algoritmos e regras de negócio **implementados no repositório** (não genéricos de bibliotecas).

## 4.1 Gameplay — RPC `shoot_apply`

| Regra | Evidência (`shoot_apply_atomic_transaction.sql`) |
|-------|--------------------------------------------------|
| Direções válidas | TL, TR, C, BL, BR |
| Valores aposta | R$ 1, 2, 5, 10 — mapeados a tamanhos de lote (10, 5, 2, 1) |
| Alocação de lote | Lock métricas globais, criação/alocação lote por valor |
| Sorteio gol/defesa | Lógica probabilística dentro da RPC |
| Milestone Gol de Ouro | Contador global — prêmio especial documentado (+R$100) |
| Crédito/débito saldo | Atômico na mesma transação |
| Engine V2 branch | Constante `c_engine_v2_from` — ramificação legacy vs V2 |
| Patches V1-only | F2-2C bloqueia lotes não-V1 em produção |

## 4.2 RPC financeira — `claim_and_credit_approved_pix_deposit`

| Regra | Função |
|-------|--------|
| Idempotência depósito | Claim atômico pós-webhook aprovado |
| Crédito ledger + wallet | Dupla escrita consistente |
| Patches versionados | V1.1B-M1-R2/R3, PROD-BASELINE |

## 4.3 Processamento financeiro

| Algoritmo | Localização |
|-----------|-------------|
| Processamento fila saques | `processPendingWithdrawals.js` |
| Rollback saque falho | Domínio payout + ledger tipo `rollback` |
| Validação PIX OUT | `utils/pix-validator.js` |
| Assinatura webhook HMAC/Ed25519 | `webhook-signature-validator.js`, `pix-mercado-pago.js` |
| Factory provider selection | `FinanceProviderFactory.js` — normalização env, guards prod |

## 4.4 Auditoria (algoritmos read-only)

| Script | Função algorítmica |
|--------|-------------------|
| `financial-proof-engine.js` | Prova FP-01..09 — métricas baseline |
| `f2-3a-audit-readonly.mjs` | Cruzamento saques ↔ ledger |
| `runtime-certification.js` | SHA/Fly/bundle vs baseline |
| `shoot-apply` validators | `f2-2b-validate-shoot-apply-ac.mjs`, etc. |

## 4.5 Ranking e estatísticas

| Artefato | Algoritmo |
|----------|-----------|
| `current_ranking` view | `database/schema-ranking.sql` |
| `update_user_ranking()` | Trigger/função ranking |
| `get_cached_stats()` | Cache estatísticas |

## 4.6 Outros

| Algoritmo | Localização |
|-----------|-------------|
| JWT auth + bcrypt | `server-fly.js` auth flows |
| Rate limiting | Express rate-limit inline — thresholds proprietários |
| Admin RBAC | JWT + flag DB administrador |

---

# 5. Documentação

Corpus documental como **ativo intelectual de know-how** — **956** arquivos Markdown em `docs/` (contagem direta no repositório; DR-02 citava ~1.830 incluindo possível agregação histórica/backup).

## 5.1 Inventário por categoria

| Categoria | Localização | Quantidade / escopo |
|-----------|-------------|---------------------|
| **Data Room** | `docs/data-room/` | DR-02 a DR-06 (Due Diligence) |
| **Arquitetura** | `docs/arquitetura/` | PAYMENT-ENGINE-V1, ADR-001 |
| **Auditorias** | `docs/relatorios/` | ~800+ relatórios numerados (H4*, F2*, V1*, OC-INC*) |
| **Governança** | `docs/governance/` | Certificação contínua, dashboard, snapshots JSON |
| **Runbooks** | `docs/runbooks/` | 16 runbooks operacionais |
| **Segurança** | `docs/seguranca/` | ~33 documentos hardening |
| **Certificação** | `docs/certification/` | Certificação oficial V1, baseline |
| **Executive** | `docs/executive/final-delivery/` | Master Handbook, freeze V1 |
| **Roadmaps** | `docs/audits/V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md` | Melhorias pós-V1 |
| **Configurações** | `docs/configuracoes/` | Payouts, onboarding MP |
| **Go-live** | `docs/go-live/` | Finalização jogo |
| **Logs CI** | `docs/logs/` | Health monitor summaries |

## 5.2 ADRs (Architecture Decision Records)

| ADR | Documento | Decisão |
|-----|-----------|---------|
| **ADR-001** | `docs/arquitetura/PAYMENT-ENGINE-V1.md` §16 | Adoção Payment Engine multi-PSP — factory, contratos, flags, migração incremental |

Não há pasta `docs/adr/` separada — ADR embutido na documentação Payment Engine.

## 5.3 Relatórios de encerramento

| Documento | Função IP |
|-----------|-----------|
| `H4-Z-ENCERRAMENTO-GERAL-AUDITORIAS-V1-2026-05-25.md` | Consolidação trilha auditorias |
| `GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` | Certificação institucional score 88/100 |
| `H5-0C-BACKUP-OPERACIONAL-OFICIAL-V1-2026-05-27.md` | Metodologia backup reproduzível |

---

# 6. Infraestrutura

Documentação de infraestrutura como **ativo de configuração e estratégia** (DR-05).

| Ativo | Localização | Natureza IP |
|-------|-------------|-------------|
| **Fly config** | `fly.toml` | Processos app + payout_worker, health, GRU |
| **Docker** | `Dockerfile`, `.dockerignore` | Build reproduzível + GIT_COMMIT trace |
| **Vercel player** | `goldeouro-player/vercel.json` | CSP, cache, SPA routing |
| **Vercel admin** | `goldeouro-admin/vercel.json` | CSP connect-src backend |
| **CI/CD** | `.github/workflows/` (~12 workflows ativos) | Pipeline canónico H3.6C |
| **Dependabot** | `.github/dependabot.yml` | Política atualização deps |
| **Env templates** | `.env.example`, `goldeouro-player/env.example` | Especificação config (sem segredos) |
| **Backup runner** | `backup/h50c-backup-runner.cjs` | Metodologia snapshot V1 |

### Ambientes documentados

Produção · Homologação (scripts) · Sandbox financeiro · Staging DB · Experimental · Local — ver DR-05 §3.

---

# 7. Integrações

Separação **tecnologia própria** (orquestração) vs **terceiros** (APIs/hosting).

| Integração | Código próprio | Serviço terceiro | Produção |
|------------|----------------|------------------|----------|
| **Mercado Pago PIX IN** | `server-fly.js`, `pix-mercado-pago.js`, webhooks | API MP | **Sim** |
| **Mercado Pago PIX OUT** | Worker, factory, webhooks Ed25519 | API MP Payouts | Código sim; bloqueio onboarding |
| **Celcoin** | `src/finance/providers/celcoin/` | API Celcoin sandbox | Prep only |
| **Asaas** | **Zero código** | Planejado docs | **Não** |
| **Efí/Gerencianet** | `scripts/efi/` spike | API Efí sandbox | Experimental |
| **Supabase** | SQL, RPCs, RLS patches, cliente JS | PostgreSQL managed | **Sim** |
| **Fly.io** | `fly.toml`, Dockerfile | Compute hosting | **Sim** |
| **Vercel** | `vercel.json`, build scripts | CDN/hosting frontend | **Sim** |
| **GitHub** | Workflows, Dependabot | Repo + CI | **Sim** |
| **Email SMTP** | `emailService.js` | Provedor SMTP (env) | Sim |
| **Capacitor/Expo** | Wrappers config | Frameworks mobile | Parcial |

### Webhooks (implementação própria)

| Rota | PSP | Validador proprietário |
|------|-----|------------------------|
| `POST /api/payments/webhook` | MP depósito | HMAC |
| `POST /webhooks/mercadopago` | MP payout | Ed25519 |

---

# 8. Dependências Externas

## 8.1 Backend (`package.json` — licença MIT declarada)

| Dependência | Versão | Uso | Licença típica |
|-------------|--------|-----|----------------|
| express | ^4.18.2 | HTTP server | MIT |
| @supabase/supabase-js | ^2.38.4 | Cliente DB | MIT |
| jsonwebtoken | ^9.0.2 | JWT | MIT |
| bcryptjs | ^2.4.3 | Hash senhas | MIT |
| helmet | ^7.1.0 | Security headers | MIT |
| express-rate-limit | ^7.1.5 | Rate limit | MIT |
| axios | ^1.6.7 | HTTP client PSP | MIT |
| nodemailer | ^6.9.8 | Email | MIT |
| dotenv | ^16.3.1 | Env | BSD-2 |
| pdfkit | ^0.17.2 | Relatórios PDF | MIT |

## 8.2 Player (`goldeouro-player/package.json`)

| Dependência | Uso |
|-------------|-----|
| react, react-dom ^18.2.0 | UI |
| vite ^5.0.8 | Build |
| tailwindcss ^3.3.6 | Styling |
| axios ^1.11.0 | API client |
| @capacitor/* ^7.4.3 | Android wrapper |
| vite-plugin-pwa ^1.0.3 | PWA |
| framer-motion, lucide-react | UX |

**Licença:** não declarada em `package.json` player.

## 8.3 Admin (`goldeouro-admin/package.json`)

| Dependência | Uso |
|-------------|-----|
| react ^18.2.0, vite ^4.5.0 | UI/build |
| @radix-ui/* | Componentes UI |
| recharts ^3.1.2 | Gráficos dashboard |
| tailwindcss, framer-motion | Styling/animation |

**Licença:** não declarada em `package.json` admin.

## 8.4 Serviços cloud (SaaS)

| Serviço | Função | Modelo |
|---------|--------|--------|
| Fly.io | Backend + worker | PaaS — contrato comercial externo |
| Vercel | Frontends | PaaS |
| Supabase | PostgreSQL + auth infra | BaaS |
| GitHub | Git + Actions | SaaS |
| Mercado Pago | PIX IN/OUT | PSP — taxas e termos MP |
| Celcoin / Efí / Asaas | PSP alternativos | Contratos futuros |

## 8.5 Observação sobre licenças OSS

- Backend declara **`"license": "MIT"`** em `package.json` raiz
- **Não há arquivo `LICENSE`** na raiz do repositório (busca repo — 0 resultados)
- Dependências majoritariamente MIT/BSD/Apache — compatíveis com uso comercial típico
- **Radix UI** — MIT; **Recharts** — MIT; **Workbox** (PWA) — MIT

---

# 9. Ativos Intangíveis

| Ativo | Evidência | Tipo |
|-------|-----------|------|
| **Marca Gol de Ouro™** | Símbolo ™ em docs Data Room, handbook, certificação | Marca / naming |
| **Domínio** | `goldeouro.lol`, `admin.goldeouro.lol` — docs certificação | Ativo digital |
| **Conceito produto** | Penáltis + saldo real + PIX — handbook §2 | Posicionamento |
| **Milestone Gol de Ouro** | RPC + feature flag `goldenGoal: true` em `/meta` | Mecânica marca |
| **Arquitetura dual-layer financeira** | Wallet + ledger — docs + código | Know-how |
| **Metodologia certificação V1** | V1.1A→V1.6, score 88/100, H4.Z | Processo |
| **Runbooks P0–P3** | `INCIDENT-RESPONSE-FLOW.md` | Processo operacional |
| **Trilha auditorias** | F1–F6, H4*, OC-INC* | Metodologia DD |
| **Baseline congelada** | SHA `a83c3cf`, Fly v461, bundle `index-B6M2smS9.js` | Referência IP/runtime |
| **App ID mobile** | `com.goldeouro.app` | Identificador produto |
| **Autoria documentada** | README: "Desenvolvido por: Fred Silva"; package.json: "Gol de Ouro Team" | Provenance |

### O que não está evidenciado no repositório

- Registro INPI / USPTO de marca
- Contratos de cessão de direitos autorais
- Política formal de IP / NDA
- Licenciamento comercial third-party documentado

---

# 10. Ativos Reutilizáveis

Componentes com potencial de **reutilização em outros produtos** (evidência arquitetural — não oferta comercial).

| Componente | Reutilizável porque | Dependências ao desacoplar |
|------------|---------------------|----------------------------|
| **Wallet model** | `usuarios.saldo` + regras débito/crédito | Esquema usuários Supabase |
| **Ledger append-only** | `ledger_financeiro` + tipos + idempotência | PostgreSQL |
| **Payment Engine** | Factory + contratos + adapters | Env flags, PSP APIs |
| **Payout worker pattern** | Processo Fly separado, loop idempotente | Supabase + PSP token |
| **Webhook validator** | HMAC + Ed25519 modular | MP-specific headers |
| **Admin panel framework** | CRUD usuários, saques, relatórios, audit | Backend `/api/admin/*` |
| **Certificação scripts** | `runtime-certification.js`, `financial-proof-engine.js` | URLs prod, Supabase read |
| **CI/CD path-filter pattern** | H3.6C — docs não disparam deploy | GitHub Actions |
| **Auth JWT + bcrypt** | Flows login/register/recovery | JWT_SECRET |
| **PWA stack** | VitePWA + manifest pattern | Branding assets |
| **RPC atomic pattern** | Gameplay/finance em PL/pgSQL | PostgreSQL expertise |

### Pacotes reutilizáveis como "módulos"

```text
src/finance/           → Payment Engine standalone
src/domain/payout/     → Domínio saques
src/workers/           → Worker template
database/*.sql         → Schema + RPCs
scripts/reliability/   → Observabilidade financeira
scripts/governance/    → Governança contínua
goldeouro-admin/       → Admin ops template
```

---

# 11. Ativos Dependentes de Terceiros

Ativos **não controlados** pelo repositório — dependência operacional e de continuidade.

| Terceiro | O que fornece | Impacto se indisponível |
|----------|---------------|-------------------------|
| **Mercado Pago** | PIX IN prod; PIX OUT API | Sem depósitos; sem saques automáticos |
| **Supabase** | PostgreSQL, hosting DB | Plataforma offline |
| **Fly.io** | Backend + worker compute | API indisponível |
| **Vercel** | Frontends CDN | UX indisponível |
| **GitHub** | Repo + CI/CD | Deploy manual necessário |
| **React/Vite/Express ecosystem** | Frameworks | Rebuild com alternativas possível |
| **Capacitor/Expo** | Mobile wrappers | Mobile não publicado anyway |
| **Celcoin/Efí/Asaas** | PSP alternativo | Sem diversificação PSP |
| **Provedor SMTP** | Email recovery | Reset senha afetado |
| **DNS/registrar** | `goldeouro.lol` | Não versionado no repo |

### Código vs serviço

| Ativo | Propriedade |
|-------|-------------|
| Lógica wallet/ledger/gameplay | **Proprietária** — repo |
| API Mercado Pago | **Terceiro** — termos MP |
| Infra Fly/Vercel/Supabase | **Terceiro** — contratos cloud |
| PostgreSQL engine | **Open source** — licença PostgreSQL |

---

# 12. Riscos

## 12.1 Dependências

| Risco | Severidade | Evidência |
|-------|------------|-----------|
| Lock-in PSP Mercado Pago | Alta | PIX IN 100% inline MP |
| Lock-in Supabase | Média | SQL portable; hosting acoplado |
| Lock-in Fly/Vercel | Média | Docker existe; frontends Vercel-specific config |

## 12.2 Licenças

| Risco | Detalhe |
|-------|---------|
| MIT no backend `package.json` | Permissiva — se repo público, código backend MIT-licensed |
| Ausência arquivo LICENSE raiz | Ambiguidade formal licenciamento repo |
| Player/admin sem license field | Ambiguidade sublicenciamento frontends |
| Dependências OSS | Obrigação manter notices (não evidenciado `NOTICES` file) |

## 12.3 Componentes externos

| Risco | Detalhe |
|-------|---------|
| MP onboarding PIX OUT | Bloqueio institucional — não é IP, mas continuidade |
| Asaas zero código | Roadmap depende terceiro |
| Admin repo separado histórico | Fragmentação IP admin vs monorepo |

## 12.4 Propriedade intelectual

| Risco | Detalhe |
|-------|---------|
| Autoria | README menciona Fred Silva; package.json "Gol de Ouro Team" — sem contrato cessão no repo |
| Marca ™ | Uso documental ™ — sem registro evidenciado |
| RPC SECURITY DEFINER | Lógica crítica no DB — protegida por acesso Supabase, não patente |
| Legado routes/controllers | Código morto — confusão escopo IP vs runtime |
| Backups no repo | `backup/`, tags `BACKUP-*` — duplicação patrimônio histórico |

## 12.5 Mitigações documentadas

- Payment Engine — reduz lock-in PSP
- SQL versionado + rollback scripts — portabilidade schema
- Backup H5-0C — snapshot IP reproduzível
- Certificação + auditorias — prova provenance e integridade

---

# 13. Conclusão Executiva

## Quais ativos intelectuais efetivamente pertencem ao Gol de Ouro™?

Sob a ótica de **Due Diligence de propriedade intelectual**, com base exclusiva no repositório auditado:

### Pertencem ao Gol de Ouro™ (propriedade substantiva)

1. **Motor de jogo** — RPC `shoot_apply` com regras de lotes, probabilidades, milestone Gol de Ouro e movimentação de saldo atômica. Representa o **core IP diferenciador** — independente do runtime Node.js.

2. **Sistema financeiro dual-layer** — modelo wallet (`usuarios.saldo`) + ledger imutável (`ledger_financeiro`), RPC de crédito PIX, domínio payout, worker e webhooks. Conjunto **original e auditável**.

3. **Payment Engine V1** — arquitetura factory + contratos + adapters + ADR-001. Ativo de **evolução multi-PSP** reutilizável.

4. **Aplicações full-stack** — ~280+ arquivos frontend (player + admin), monólito backend, serviços e utilitários. UX penáltis, fluxos PIX, painel operacional.

5. **Corpus documental** — 956 documentos em `docs/` incluindo auditorias, certificação, runbooks, handbook e Data Room. Ativo de **know-how operacional** raro em startups equivalentes.

6. **Metodologias proprietárias** — scripts certificação (CERTIFIED/DEGRADED/INVALID), prova financeira FP-01..09, trilha H4.Z, backup H5-0C.

7. **Marca e identidade digital** — nome Gol de Ouro™, domínios documentados, ícones PWA, `com.goldeouro.app`, manifest branding.

### Não pertencem exclusivamente (terceiros / OSS)

- Frameworks e bibliotecas npm (React, Express, Vite, Radix, etc.)
- Infraestrutura Fly, Vercel, Supabase, GitHub
- APIs Mercado Pago, Celcoin, Efí
- Engine PostgreSQL

### Valor para DD

O comprador adquire **IP operacional integrada** — não apenas snippets isolados. A combinação gameplay-atômico-no-banco + financeiro auditável + Payment Engine + documentação forense constitui **barreira de entrada** para reprodução. Gaps formais (LICENSE file, registro marca, contratos cessão) são **endereçáveis juridicamente** e não invalidam a substância técnica evidenciada.

**Estimativa quantitativa:** ~**150+ módulos/ativos nomeados** executáveis + **956 artefatos documentais** (`docs/`) + **593 arquivos fonte** medidos + **6 documentos Data Room** + **marca/domínio** = patrimônio intelectual consolidado V1.

---

## Metadados desta auditoria

| Campo | Valor |
|-------|-------|
| **Arquivo criado** | `docs/data-room/DR-06-PROPRIEDADE-INTELECTUAL.md` |
| **Modo** | READ-ONLY — nenhuma alteração em código, banco, configs ou docs preexistentes |
| **Fonte** | Evidências exclusivamente do repositório `goldeouro-backend` |
| **Data** | 2026-06-23 |

### Resumo solicitado

| Item | Resultado |
|------|-----------|
| **Ativos intelectuais (aprox.)** | ~150+ módulos código nomeados · **593** arquivos fonte · **956** docs · 6 Data Room |
| **Principais ativos proprietários** | RPC `shoot_apply`, wallet+ledger, Payment Engine, player/admin UX, metodologia certificação, corpus auditorias |
| **Principais dependências externas** | Mercado Pago, Supabase, Fly.io, Vercel, GitHub, React/Express/Vite ecosystem |
| **Código alterado** | **Nenhum** |
