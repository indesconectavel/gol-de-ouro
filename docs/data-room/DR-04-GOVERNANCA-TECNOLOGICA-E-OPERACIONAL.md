# DR-04 — Governança Tecnológica e Operacional

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — governança documentada a partir de evidências do repositório  
**Documentos relacionados:** DR-01, DR-02, DR-03, `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`, `docs/governance/`, série **H0–H2.5**  
**Repositório:** monorepo `goldeouro-backend`

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> Governança V1.6 (**88/100**, CERTIFIED WITH RESSALVAS) **permanece válida**. Ampliar leitura com: **H0** (engenharia), **H1** (Asset Package), **G2** (staging permanente), **BASELINE-PROTECTION-POLICY**, tags PE.  
> Corpo 2026-06-23 = **NARRATIVA ORIGINAL** da governança naquela data; não contradiz score 88.

---

# 1. Resumo Executivo

A governança tecnológica e operacional do Gol de Ouro™ V1 combina **três pilares observáveis no repositório**:

1. **Governança por documentação e evidência** — corpus de ~1.830 arquivos Markdown (`docs/`), incluindo auditorias numeradas (série H4.*, F2.*, V1.*), runbooks operacionais, certificação oficial congelada e snapshots JSON de governança contínua.
2. **Pipeline CI/CD com deployers canónicos e path-filters** — GitHub Actions separa integração (`main-pipeline.yml`) de publicação (`backend-deploy.yml`, `frontend-deploy.yml`), com gates pós-deploy (`/health`, `/meta`) e rollback documentado (`rollback.yml`).
3. **Certificação operacional contínua (read-only)** — scripts em `scripts/governance/`, `scripts/reliability/` e `scripts/certification/` produzem estados **CERTIFIED / DEGRADED / INVALID** para runtime e prova financeira, alinhados ao modelo em `docs/governance/CONTINUOUS-CERTIFICATION-MODEL.md`.

### Estratégia geral observada

| Dimensão | Abordagem documentada |
|----------|---------------------|
| **Controle de mudança** | Branch `main` como tronco de produção backend/player; deploy backend só com path-filter funcional; docs/scripts não disparam deploy |
| **Baseline congelada** | SHA `a83c3cf`, Fly **v461**, bundle player `index-B6M2smS9.js` — referência em certificação oficial |
| **Operação controlada** | Veredito **CERTIFIED WITH RESSALVAS** (score 88/100); trilha H4.Z encerrada em 2026-05-25 |
| **Resposta a incidentes** | Runbooks por domínio (financeiro, runtime, workers, segurança) + fluxo formal em `INCIDENT-RESPONSE-FLOW.md` |
| **Evolução incremental** | Payment Engine com feature flags explícitas; PSP alternativo (Celcoin) preparado sem alterar produção MP |

A plataforma **não possui um SOC ou equipe de SRE dedicada documentada** — a governança é **formalizada parcialmente** via processos escritos, automação CI e scripts de auditoria read-only executáveis localmente ou em CI.

---

# 2. Organização do Projeto

## 2.1 Estrutura do repositório

Monorepo full-stack com separação lógica por pastas:

```text
goldeouro-backend/
├── server-fly.js          # Entry point HTTP produção (monólito)
├── src/                   # Payment Engine, workers
├── controllers/           # Controllers admin/financeiro
├── middlewares/           # Middlewares (existem; segurança principal inline no monólito)
├── services/              # Integrações (ex.: pix-mercado-pago.js)
├── database/              # SQL, RPCs, patches, rollback
├── goldeouro-player/      # Frontend jogador (Vercel CI)
├── goldeouro-admin/       # Frontend admin (deploy predominantemente manual)
├── goldeouro-mobile/      # Expo — parcial, sem CI produção
├── scripts/               # Auditoria, governança, operação, payouts
├── docs/                  # Corpus institucional (~1.830 arquivos)
├── backup/                # Snapshot operacional V1 (2026-05-27)
├── .github/workflows/     # CI/CD, segurança, monitoramento
├── fly.toml               # Fly.io app + processo payout_worker
└── Dockerfile             # Container backend Node 20
```

## 2.2 Módulos e separação de responsabilidades

| Módulo | Responsabilidade | Evidência |
|--------|------------------|-----------|
| **Backend HTTP** | API REST, auth, PIX IN, gameplay HTTP, admin API | `server-fly.js` |
| **Worker payout** | Processamento assíncrono saques PIX OUT | `src/workers/payout-worker.js`, `fly.toml` `[processes]` |
| **Payment Engine** | Abstração PSP, factory, adapters | `src/finance/` |
| **Banco (lógica crítica)** | RPCs atômicas gameplay e crédito PIX | `database/shoot_apply_atomic_transaction.sql`, RPCs financeiras |
| **Frontend Player** | UX jogador, PWA, Capacitor Android | `goldeouro-player/` |
| **Frontend Admin** | Operação, saques, relatórios, auditoria UI | `goldeouro-admin/` |
| **Scripts de governança** | Certificação, prova financeira, drift | `scripts/governance/`, `scripts/reliability/` |

## 2.3 Organização documental

| Pasta | Função |
|-------|--------|
| `docs/data-room/` | Documentos institucionais Due Diligence (DR-02, DR-03, DR-04) |
| `docs/governance/` | Modelo certificação contínua, dashboard operacional, snapshots JSON |
| `docs/runbooks/` | Procedimentos operacionais por área (16 runbooks ativos) |
| `docs/relatorios/` | Auditorias, gates, encerramentos (~800+ relatórios) |
| `docs/seguranca/` | Branch protection, hardening webhook, políticas |
| `docs/certification/` | Certificação oficial V1, baseline congelada |
| `docs/arquitetura/` | PAYMENT-ENGINE-V1, ADRs |
| `docs/executive/final-delivery/` | Handbook executivo, freeze V1, roadmap |
| `docs/audits/` | Roadmap pós-V1 (`V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md`) |

**Nota:** DR-01 (Resumo Executivo) é referenciado em DR-02/DR-03 mas **não está presente** em `docs/data-room/` no momento desta auditoria.

---

# 3. Versionamento

## 3.1 Git e GitHub

| Aspecto | Evidência |
|---------|-----------|
| **Controle de versão** | Git — repositório `goldeouro-backend` |
| **Hospedagem** | GitHub (workflows em `.github/workflows/`, Dependabot em `.github/dependabot.yml`) |
| **Versão semântica app** | Backend `1.2.0` (`package.json`) / header runtime `1.2.1` (`server-fly.js`) — delta documentado em H5-0C |
| **Rastreabilidade deploy** | `GIT_COMMIT` build-arg Fly; endpoint `/meta` expõe SHA em produção |

## 3.2 Branches identificadas

| Branch | Uso documentado |
|--------|-----------------|
| **`main`** | Tronco produção — dispara CI, deploy backend (Fly) e player (Vercel) |
| **`dev`** | Integração — workflows `backend-deploy`, `frontend-deploy`, `security` também escutam `dev` |
| **`painel-protegido-v1.1.0`** | Branch admin em repositório separado `indesconectavel/goldeouro-admin` — deploy Vercel manual (F2-4D-4A) |
| **`migracao-canonica-gamefinal-main-2026-04-01`** | Branch histórica E2E player (H4-1C-2) |
| **`wip/v1.1b-player-shoot-apply-staging`** | Worktree isolado documentado (F2-4D-2) |

## 3.3 Estratégia de releases

```text
Desenvolvimento → PR → main
                         ↓
              path-filter (código funcional)
                         ↓
         backend-deploy.yml / frontend-deploy.yml
                         ↓
              Gate /health + /meta (backend)
                         ↓
              Baseline vs certificação (manual/script)
```

- **Backend produção:** deploy automático em push `main` quando paths funcionais alterados (`backend-deploy.yml` §H3.6C).
- **Player produção:** deploy automático em push `main` quando `goldeouro-player/**` alterado.
- **Admin produção:** predominantemente **manual** via Vercel CLI / scripts (`goldeouro-admin/scripts/`, relatórios F2-4D-*).
- **Deploy sob demanda:** `deploy-on-demand.yml` e `workflow_dispatch` com input `release_sha` permitem publicar SHA específico.
- **Rollback:** `rollback.yml` acionado por falha de `backend-deploy.yml` em `main`; `frontend-rollback-manual.yml` para player.

## 3.4 Tags

Não há evidência de **tags Git semânticas formais** (ex.: `v1.2.0`) como mecanismo primário de release no repositório auditado. A estratégia observada usa **SHA Git + Fly release number + bundle hash** como identificadores de baseline (`docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`).

## 3.5 Dependências

`.github/dependabot.yml` — atualizações npm semanais (segunda, 03:00) para backend, player e admin; majors ignorados (revisão manual); limite 5 PRs abertos por ecossistema.

---

# 4. Deploy

## 4.1 Mapa de deploy (evidência)

```text
Player (goldeouro-player)
    ↓  push main + path goldeouro-player/**
    ↓  frontend-deploy.yml
    ↓
Vercel (--prod)
    → www.goldeouro.lol / goldeouro.lol

Admin (goldeouro-admin)
    ↓  deploy manual / Vercel CLI (repo separado documentado)
    ↓
Vercel
    → admin.goldeouro.lol

Backend (server-fly.js)
    ↓  push main + paths funcionais
    ↓  backend-deploy.yml → flyctl deploy
    ↓
Fly.io (app goldeouro-backend-v2, região GRU)
    → https://goldeouro-backend-v2.fly.dev

Workers (payout_worker)
    ↓  mesmo deploy Fly (processo separado)
    ↓
Fly.io process payout_worker
    → node src/workers/payout-worker.js

Banco
    ↓  Supabase managed PostgreSQL
    ↓  patches/migrations documentados (sem CI automático de DDL)
    ↓
Supabase (SUPABASE_URL)
```

## 4.2 Detalhamento por camada

| Camada | Plataforma | Workflow / Mecanismo | Gate pós-deploy |
|--------|------------|----------------------|-----------------|
| **Player** | Vercel | `frontend-deploy.yml` | Build + bundle baseline documentado |
| **Admin** | Vercel | Manual / scripts | Relatórios F2-4D (inspect Vercel, alias domínio) |
| **Backend API** | Fly.io | `backend-deploy.yml` | `GET /health` 200, `GET /meta` gitCommit === SHA |
| **Payout worker** | Fly.io | Mesmo deploy, processo `payout_worker` | Heartbeats documentados em runbooks |
| **Banco** | Supabase | Patches manuais `database/patches/` | Scripts auditoria read-only |

## 4.3 Governança de deploy (H3.6C)

Alterações em `.github/workflows/**`, `docs/**` e `scripts/**` **não disparam** deploy automático backend/player — isolamento documentado para permitir auditoria e documentação sem risco de publicação acidental.

`main-pipeline.yml` executa CI em `main` **sem publicar** — reforça separação integração vs deploy.

---

# 5. Ambientes

Inventário alinhado a DR-02 § ambientes:

| Ambiente | Definição no repositório | Componentes | Automação |
|----------|--------------------------|-------------|-----------|
| **Produção** | `NODE_ENV=production`, domínios públicos documentados | Fly `goldeouro-backend-v2`, Vercel player/admin, Supabase prod | CI/CD backend + player; admin manual |
| **Homologação** | Scripts certificação, E2E, gates operacionais | Mesmas URLs prod com execução read-only de scripts | `scripts/certification/`, `scripts/e2e/`, `scripts/reliability/` |
| **Sandbox financeiro** | Credenciais sandbox MP/Celcoin/Efí | Scripts `scripts/payouts/`, `test-celcoin-auth.mjs`, `scripts/efi/` | Manual com gates env (`ALLOW_CELCOIN_SANDBOX_AUTH=1`) |
| **Experimental** | Código prep sem flag prod | Celcoin stubs (`CELCOIN_ENABLED=false`), Efí spike, mobile Expo | Não conectado a produção |
| **Staging (DB)** | Documentado F2-2B | `database/staging/`, bootstrap staging Supabase | Sem pipeline CI dedicado evidenciado |
| **Planejado** | Documentação apenas | Asaas PSP, Engine V2, desacoplamento webhooks | Roadmap V1-X1, F4.*, PAYMENT-ENGINE-V1 |

### Matriz ambiente × integração

| Integração | Produção | Sandbox | Planejado |
|------------|----------|---------|-----------|
| Mercado Pago PIX IN | **Sim** | Scripts audit | — |
| Mercado Pago PIX OUT | Código pronto; bloqueio institucional onboarding | `scripts/payouts/` | — |
| Celcoin | Prep (`CELCOIN_ENABLED=false`) | OAuth sandbox F4.1 | POC produção |
| Efí/Gerencianet | **Não** | Scripts spike | F4.0E |
| Asaas | **Não** | **Não** | Docs F4.0C |

---

# 6. Auditorias

## 6.1 Programa de auditorias V1

A trilha de auditorias foi **oficialmente encerrada** em 2026-05-25 (`docs/relatorios/H4-Z-ENCERRAMENTO-GERAL-AUDITORIAS-V1-2026-05-25.md`), respondendo:

> O Gol de Ouro V1 está pronto para operar com usuários reais?

**Veredito consolidado:** GO para Operação Controlada — sem bloqueadores críticos; ressalvas documentadas e corrigidas quando necessário.

## 6.2 Auditorias mapeadas (amostra representativa)

| ID | Escopo | Resultado | Relatório |
|----|--------|-----------|-----------|
| **H4.0** | GO/NO-GO Operação Controlada | GO | `H4-0-GO-NO-GO-OPERACAO-CONTROLADA-V1-2026-05-23.md` |
| **H4.1A** | Integridade Dashboard Admin | PASS COM RESSALVAS | `H4-1A-AUDITORIA-INTEGRIDADE-DASHBOARD-ADMIN-*.md` |
| **H4.1B** | Integridade Financeira Dashboard | PASS COM RESSALVAS | `H4-1B-*.md` |
| **H4.1C** | Reconciliação Histórica Saldos | PASS COM RESSALVAS | `H4-1C-*.md` |
| **H4.Z** | Encerramento geral auditorias | CONCLUÍDA | `H4-Z-ENCERRAMENTO-GERAL-AUDITORIAS-V1-2026-05-25.md` |
| **V1.6** | Operational Production Certification | CERTIFIED WITH RESSALVAS | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| **F2.3A** | Auditoria saques read-only | Script | `scripts/f2-3a-audit-readonly.mjs` |
| **F2.2D** | Pós-cirurgia econômica | PASS | `F2-2D-AUDITORIA-POS-CIRURGIA-ECONOMICA-V1-*.md` |
| **OC-INC-02** | Auditoria econômica forense motor jogo | Documentado | `OC-INC-02-AUDITORIA-ECONOMICA-FORENSE-MOTOR-JOGO-*.md` |

## 6.3 Baselines e evidências

| Artefato | Localização | Função |
|----------|-------------|--------|
| **Baseline certificada** | `docs/certification/V1-BASELINE-CERTIFIED.md` | SHA, Fly release, bundle |
| **Certificação oficial** | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` | Veredito institucional score 88/100 |
| **Snapshot governança** | `docs/governance/snapshots/LATEST.json` | Estado operacional agregado |
| **Snapshot rollback** | `docs/relatorios/H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md` | Fly v460 pré-cirurgia |
| **Backup operacional** | `backup/goldeouro-v1-operacional-2026-05-27/` | Pacote reproduzível sem segredos |

## 6.4 Processo de validação contínua

Scripts read-only executáveis:

| Script | Domínio |
|--------|---------|
| `scripts/governance/autonomous-reliability-check.js` | Score agregado governança |
| `scripts/reliability/runtime-certification.js` | CERTIFIED/DEGRADED/INVALID runtime |
| `scripts/reliability/financial-proof-engine.js` | Prova financeira FP-01..09 |
| `scripts/v1-2a-runtime-financial-health.js` | Saúde runtime + financeiro |
| `scripts/v1-2b-operational-alerts.js` | Alertas operacionais |
| `scripts/v1-2c-runtime-drift-deploy-integrity.js` | Drift repo vs live |
| `scripts/f2-3a-audit-readonly.mjs` | Auditoria ledger/saques |

**Modelo de decisão** (`CONTINUOUS-CERTIFICATION-MODEL.md`):

```text
critical_issues > 0        → INVALID / NO-GO
score ≥ 90 + runtime CERTIFIED + proof VALID → CERTIFIED / PASS
score ≥ 70                 → DEGRADED / PASS COM RESSALVAS
score < 70                 → INVALID / NO-GO
```

**Último snapshot documentado** (`OPERATIONAL-GOVERNANCE-DASHBOARD.md`, 2026-05-19): runtime **CERTIFIED**, prova financeira **VALID**, estado operacional **DEGRADED** (drift local médio), score **97/100**.

---

# 7. Controle Financeiro

## 7.1 Wallet

| Aspecto | Implementação |
|---------|---------------|
| **Saldo mutável** | Coluna `usuarios.saldo` (PostgreSQL/Supabase) |
| **Débito saque** | Atômico na solicitação de saque |
| **Crédito depósito** | Via RPC `claim_and_credit_approved_pix_deposit` |
| **Guard produção** | `MOCK_FINANCE_ENABLED=true` **proibido** em produção (`FinanceProviderFactory`) |

## 7.2 Ledger

| Aspecto | Implementação |
|---------|---------------|
| **Tabela** | `ledger_financeiro` — append-only |
| **Tipos documentados** | `deposito`, `saque`, `taxa`, `rollback`, `payout_confirmado`, etc. |
| **Integridade** | Runbooks: duplicata, approved-sem-ledger, saldo-negativo |
| **Auditoria script** | `f2-3a-audit-readonly.mjs` — cruza saques vs ledger |

## 7.3 Reconciliação

| Mecanismo | Evidência |
|-----------|-----------|
| **Webhook PIX IN** | MP → validação HMAC → RPC crédito |
| **Webhook PIX OUT** | MP payout → ledger `payout_confirmado` |
| **Worker reconcile** | `payout-worker` + runbook `RUNBOOK-reconcile-parado.md` |
| **Métricas baseline** | `approved_sem_ledger`, `pix_pending_old`, `reconcile_backlog` no dashboard governança |
| **Prova financeira** | `financial-proof-engine.js` — estados VALID/DEGRADED/INVALID |

## 7.4 PIX

| Fluxo | Provider prod | Status |
|-------|---------------|--------|
| **PIX IN (depósito)** | Mercado Pago inline `server-fly.js` | **Operacional** |
| **PIX OUT (saque)** | MP via Payment Engine + worker | Código completo; **bloqueio onboarding MP Payouts** documentado |
| **Saque manual admin** | Aprovação admin + fluxo manual | Implementado F2.3/F2.3C |

## 7.5 Auditoria financeira

- Série H4.1B/C — integridade dashboard e reconciliação histórica de saldos
- Runbooks financeiros (6): approved-sem-ledger, pending-antigos, rollback-spike, duplicata-ledger, saldo-negativo
- Scripts payouts: `scripts/payouts/` — audit, sandbox, validação prod (ops manual)
- Baseline métricas congeladas no snapshot governança (ex.: `falha_payout: 13`, `rollback: 14` — valores estáveis vs baseline)

---

# 8. Segurança Operacional

| Controle | Implementação | Evidência |
|----------|---------------|-----------|
| **JWT** | Bearer token rotas protegidas | `authenticateToken` em `server-fly.js` |
| **Helmet** | CSP report-only, HSTS, frame-ancestors | `server-fly.js` L221+ |
| **Rate limits** | 100 req/15min global; 5 login; 5 recovery | `express-rate-limit` inline |
| **Logs** | Winston + `financeLog()` JSON estruturado | `server-fly.js`, providers |
| **Webhooks** | HMAC depósito; Ed25519 payout MP | `webhook-signature-validator.js`, `pix-mercado-pago.js` |
| **Probe segurança** | Webhook sem assinatura → **401** | Dashboard governança, certificação |
| **Feature flags** | Env-based: `PAYOUT_PROVIDER`, `CELCOIN_ENABLED`, `MOCK_FINANCE_ENABLED`, `goldenGoal` | `FinanceProviderFactory`, SQL, admin `featureFlags` |
| **Segredos** | GitHub Secrets (FLY_API_TOKEN, VERCEL_*); templates `.env.example` sem valores reais | H5-0C §5, `.env.example` |
| **Admin RBAC** | JWT + flag DB administrador | `requireAdministradorDb` |
| **RLS Supabase** | Patches documentados | `database/patches/` F6-1C |
| **CodeQL / npm audit** | CI `security.yml` 3x/semana | `.github/workflows/security.yml` |
| **Admin audit trail** | Tabela `admin_logs` | `adminAuditLogger.js` |
| **Backups** | Snapshot H5-0C; Supabase managed | `backup/goldeouro-v1-operacional-2026-05-27/` |

### Runbooks de segurança (4)

- webhook-rejected-spike
- hmac-failure
- replay-webhook
- flood-payout-webhook

### Limitação documentada

Middlewares em `middlewares/` **existem mas não são importados** pelo monólito — controles de segurança implementados **inline** em `server-fly.js` (DR-03 §12).

### Branch protection

`docs/seguranca/CONFIGURACAO-FINAL-BRANCH-PROTECTION.md` (2025-11-14) indica configuração **quase pronta** — approvals e status checks marcados, porém **checks específicos não selecionados** na UI GitHub ("No required checks"). Status: **ajustes finais necessários**.

---

# 9. Gestão de Riscos

## 9.1 Dependência de PSP (Mercado Pago)

| Risco | Severidade | Mitigação documentada |
|-------|------------|----------------------|
| PIX IN 100% MP | Alta | Payment Engine prep Celcoin/Asaas; sem fallback silencioso |
| PIX OUT bloqueado onboarding | Alta | Saque manual admin; código worker pronto |
| Webhook MP indisponível | Média | Runbooks replay/flood; validação GET confirm |

## 9.2 Monólito (`server-fly.js` ~4.700 linhas)

| Risco | Mitigação |
|-------|-----------|
| Acoplamento alto | RPCs no banco; Payment Engine incremental; roadmap desacoplamento |
| Deploy all-or-nothing | Path-filter; worker processo separado Fly |
| Testabilidade | Scripts auditoria; testes `tests/backend-tests.js` (condicional CI) |

## 9.3 Webhooks

| Risco | Controle |
|-------|----------|
| Replay attack | HMAC + validação documentada V1-1F |
| Flood | Rate limit + runbook flood-payout-webhook |
| Falso 401 | Rollout staging recomendado; flag `MP_PAYOUT_WEBHOOK_ENFORCE` documentada |

## 9.4 PIX OUT

- Código completo (request → worker → webhook → ledger)
- **Bloqueio institucional** Mercado Pago Payouts — não é falha de implementação
- Celcoin prep (F4/F4.1) como alternativa futura — stubs + OAuth sandbox, **não produção**

## 9.5 Dependências externas

| Serviço | Risco | Evidência continuidade |
|---------|-------|------------------------|
| **Fly.io** | Vendor lock-in cloud | Rollback workflow, runbook fly-release-inesperada |
| **Vercel** | CDN/frontend | Rollback manual frontend, bundle baseline |
| **Supabase** | Banco managed | Patches SQL versionados, backup H5-0C |
| **GitHub Actions** | CI/CD | Workflows versionados; health-monitor 30min |
| **Mercado Pago** | PSP único prod | Payment Engine multi-provider prep |

## 9.6 Outros riscos encontrados

| Risco | Fonte |
|-------|-------|
| Admin deploy manual / branch divergente | F2-4D-4A — Preview vs Production |
| Drift repo local vs runtime live | Dashboard DR-03 (medium) |
| Branch protection incompleta | `CONFIGURACAO-FINAL-BRANCH-PROTECTION.md` |
| Polling PIX pós-pagamento ausente | Roadmap V1-X1 QR-02 |
| Mobile Expo sem pipeline prod | DR-02 |
| Concentracao saldo outlier (conta teste) | H4-1C investigado — conta teste confirmada H4-1C-2 |

---

# 10. Continuidade Operacional

## 10.1 Backups

| Tipo | Mecanismo |
|------|-----------|
| **Snapshot código V1** | `backup/goldeouro-v1-operacional-2026-05-27/` + runner `backup/h50c-backup-runner.cjs` |
| **Manifesto + checksums** | `MANIFESTO-BACKUP-V1.md`, `CHECKSUMS.txt` |
| **Supabase** | Responsabilidade plataforma + DDL versionado em `database/` |
| **Admin scripts** | `goldeouro-admin/scripts/backup*` |

Política H5-0C: **sem segredos** nos artefatos; `.env` reais excluídos.

## 10.2 Infraestrutura

- **Fly.io** GRU — app `goldeouro-backend-v2`, 256MB, health checks HTTP
- **Vercel** — player (CI) + admin (manual)
- **Supabase** — PostgreSQL produção
- **Monitoramento** — `health-monitor.yml` a cada 30min; logs em `docs/logs/`

## 10.3 Reposição (rollback)

| Camada | Mecanismo |
|--------|-----------|
| Backend Fly | `rollback.yml` pós-falha deploy; snapshot v460 documentado |
| Frontend player | `frontend-rollback-manual.yml` |
| SQL | Scripts em `database/rollback/` |
| Baseline congelada | Redeploy SHA `a83c3cf` via `workflow_dispatch release_sha` |

## 10.4 Documentação

~1.830 arquivos Markdown — runbooks, auditorias, certificação, handbook executivo (`docs/executive/final-delivery/`).

## 10.5 Roadmaps

| Documento | Horizonte |
|-----------|-----------|
| `docs/audits/V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md` | Melhorias 1–2 semanas + V2 1–3 meses |
| `docs/arquitetura/PAYMENT-ENGINE-V1.md` | Migração incremental PSP |
| `docs/executive/final-delivery/FINAL-DELIVERY/V1-FINAL-FREEZE.md` | Escopo V1 fechado; pós-V1 = roadmap |

## 10.6 Governança contínua

- `scripts/governance/autonomous-reliability-check.js` — atualiza snapshots
- `docs/governance/RELIABILITY-MATURITY-MODEL.md` — níveis 1–5
- `docs/runbooks/INCIDENT-RESPONSE-FLOW.md` — fluxo formal de incidentes
- `docs/runbooks/CLASSIFICACAO-DE-INCIDENTES.md` — severidade

---

# 11. Pontos Fortes

Evidências de maturidade operacional observáveis no repositório:

| Dimensão | Evidência |
|----------|-----------|
| **Governança** | Modelo certificação contínua CERTIFIED/DEGRADED/INVALID; dashboard operacional; encerramento formal H4.Z |
| **Organização** | Monorepo estruturado; separação Payment Engine; runbooks por domínio (16 ativos) |
| **Auditoria** | Trilha H4.* completa; scripts read-only reproduzíveis; prova financeira FP-01..09 |
| **Rastreabilidade** | SHA em `/meta`; GIT_COMMIT no deploy Fly; relatórios datados com vereditos |
| **Documentação** | Corpus extenso; certificação oficial; backup H5-0C; Data Room DR-02/03/04 |
| **Controle operacional** | Path-filter deploy; rollback workflows; health monitor 30min; webhook 401 baseline |
| **Segurança financeira** | Ledger append-only; guards mock prod; webhook HMAC; runbooks saldo-negativo/duplicata |
| **Evolução preparada** | Payment Engine + Celcoin prep sem impacto prod; roadmap V1-X1 documentado |

---

# 12. Limitações

Processos e gaps **documentados**, não omitidos:

| Limitação | Impacto |
|-----------|---------|
| **Governança parcialmente formalizada** | H4.Z reconhece; branch protection incompleta |
| **Admin deploy manual** | Risco drift Preview/Production (F2-4D) |
| **PIX OUT automático bloqueado** | Dependência onboarding MP; mitigado por saque manual |
| **Monólito server-fly.js** | Dívida manutenção; mitigado por RPCs e engine incremental |
| **Sem tags Git de release** | Rastreio por SHA — requer disciplina operacional |
| **Staging DB sem CI dedicado** | Patches SQL manuais |
| **Polling PIX ausente** | UX depósito — roadmap QR-02 |
| **Mobile sem produção** | Ativo opcional |
| **CodeQL continue-on-error** | Análise security não bloqueia merge |
| **Auto-rollback Fly continue-on-error** | Rollback best-effort, não garantido |
| **Middlewares não wired** | Duplicação potencial vs monólito inline |

### Melhorias futuras (já planejadas no repo)

- Completar branch protection com status checks obrigatórios
- Automatizar deploy admin ou unificar branch produção Vercel
- Ativar Celcoin POC sandbox → produção PIX OUT
- Implementar QR-01/02 (verificação PIX automática)
- Engine V2 e desacoplamento webhooks (roadmap)

---

# 13. Conclusão Executiva

## Por que a governança existente aumenta o valor do ativo?

Sob a ótica de **Due Diligence tecnológica**, o Gol de Ouro™ V1 apresenta governança **acima da média de startups pré-escala** no segmento, pelos seguintes fatores verificáveis:

1. **Auditabilidade comprovada** — não há apenas declaração de conformidade: existem centenas de relatórios datados, scripts executáveis, baselines congeladas (SHA, Fly release, bundle) e veredito institucional (**CERTIFIED WITH RESSALVAS**, score 88/100) emitido em documento oficial.

2. **Controles operacionais reais** — CI/CD com deployers canónicos, path-filters que isolam documentação de produção, gates pós-deploy, rollback documentado, monitoramento periódico e runbooks para cenários financeiros críticos (saldo negativo, duplicata ledger, webhook flood).

3. **Integridade financeira estrutural** — wallet + ledger dual-layer, RPCs atômicas, prova financeira automatizada e trilha de reconciliação auditada reduzem risco de caixa opaco — principal red flag em plataformas de premiação.

4. **Riscos conhecidos e bounded** — dependência PSP, monólito, PIX OUT bloqueado e deploy admin manual estão **documentados com mitigação**, não descobertos apenas na DD. Payment Engine e prep Celcoin demonstram capacidade de evolução sem reescrita.

5. **Continuidade demonstrável** — backup operacional H5-0C, rollback Fly/Vercel, SQL versionado e handbook executivo permitem **transição de equipe** ou **herança Engine V2** sem perda de contexto.

6. **Transparência para investidor** — limitações explicitadas (governança parcial, ressalvas, roadmap pós-V1) aumentam confiança versus plataformas que ocultam dívida técnica.

**Síntese DD:** o comprador adquire não só código, mas um **sistema de governança documentado** — auditorias encerradas, certificação emitida, operação controlada viável e roadmap técnico claro. O gap principal (PIX OUT automático / PSP) é **externo e mitigável**, não estrutural. Isso **reduz desconto de risco** na valoração versus ativos equivalentes sem trilha auditável.

---

## Metadados desta auditoria

| Campo | Valor |
|-------|-------|
| **Arquivo criado** | `docs/data-room/DR-04-GOVERNANCA-TECNOLOGICA-E-OPERACIONAL.md` |
| **Modo** | READ-ONLY — nenhuma alteração em código, banco, configs ou docs preexistentes |
| **Fonte** | Evidências exclusivamente do repositório `goldeouro-backend` |
| **Data** | 2026-06-23 |
