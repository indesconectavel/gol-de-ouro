# RELATÓRIO OFICIAL DE FECHAMENTO DA V1
# GOL DE OURO — PRODUÇÃO REAL

**Documento:** fechamento oficial da baseline operacional V1  
**Data do fechamento:** 2026-05-15  
**Branch de referência:** `fix/admin-financial-integrity-v1`  
**HEAD documental (repo backend):** `60bae48f1ecd4d28b9d8d4c89c8a308aff635a53` (`60bae48`)  
**Runtime Fly em produção:** release **v452** · `gitCommit` **`7ecedca`** (`/meta`)  
**Modo de elaboração:** READ-ONLY — consolidação de auditorias e evidências existentes; **sem** deploy, alteração de código ou banco nesta sessão.

---

## 1. Resumo executivo

O **Gol de Ouro V1** encontra-se **operacional em produção real**, com backend Fly saudável, frontends player e admin publicados, núcleo financeiro PIX/saques/ledger defensivo, painel administrativo alinhado ao contrato **`/api/admin/*`** (cirurgia T14A), e **rastreabilidade de runtime** restaurada (cirurgia H2).

As auditorias globais finais **F1** (runtime/backend), **F2** (financeiro) e **F3** (frontend/UX/governança) classificaram-se todas como **APROVADO COM RESSALVAS**. Não foi identificada **falha crítica aberta** que impeça operação, rollback ou suporte de produção.

**Classificação oficial deste documento:**

## **V1 OPERACIONAL APROVADA COM RESSALVAS**

| Pilar | Estado V1 |
|-------|-----------|
| Produção real | ✅ Funcional |
| Runtime rastreável | ✅ (`/meta.gitCommit`) |
| Backend | ✅ v452, health OK |
| Financeiro | ✅ Operacional (ressalvas documentadas) |
| Player + Admin | ✅ Disponíveis (smoke E2E humano pendente) |
| Auditoria admin | ✅ Endpoints + UI alinhados |
| Governança Git local | ⚠️ Working tree suja |
| Homologação humana total | ⚠️ Parcial |

Este relatório constitui a **baseline histórica oficial** da V1 e a **fundação documental** para H3 (hardening), V2 Engine e evoluções do ecossistema Indesconectável.

---

## 2. Linha do tempo da estabilização

| Marco | Período / commit | Entrega principal |
|-------|------------------|-------------------|
| **Hardening financeiro** | 2026-04-28 | Webhook depósito estrito, `financeLog`, reconcile reforçado, consistência ledger no saque |
| **Cirurgias admin 4–10** | maio/2026 | Saques reais, dashboard, utilizadores, bloqueio, auditoria persistida (`admin_logs`) |
| **T14A** | maio/2026 | Correção estrutural painel: rotas **`/api/admin/*`**; remoção dependência **`/admin/...`** legado no cliente |
| **H1** | 2026-05-12 | Baseline higiene operacional: working tree, `vercel.json` CRLF, inventário `??` |
| **H2** | `7ecedca` · Fly **v452** | `GIT_COMMIT` no deploy; `/meta` com hash real; tag `pre-h2-runtime-traceability-2026-05-12` |
| **Validação runtime global** | `61c4679` | Documentação fechamento pipeline pré-F1 |
| **F1** | `fe7b7ac` | Auditoria runtime + produção + backend |
| **F2** | `deec98d` | Auditoria financeiro + ledger + PIX + saques |
| **F3** | `60bae48` | Auditoria frontend + painel + UX + governança |
| **Fechamento V1** | 2026-05-15 | **Este documento** |

### Principais correções (síntese)

1. Rotas admin **404** → contrato **`GET/POST /api/admin/...`** em `server-fly.js`.
2. **`gitCommit: null`** em `/meta` → injeção **`--build-arg GIT_COMMIT`** (H2, v452).
3. Webhook depósito permissivo → **401** sem assinatura válida.
4. Deep links admin **404 Vercel** → rewrite SPA funcional (maio/2026).
5. Cliente admin a chamar **`/admin/lista-usuarios`** → **`/api/admin/users/list`** no bundle de produção.

### Principais estabilizações

- Fly **dois processos**: `app` + `payout_worker`.
- Reconcile PIX periódico ativo (fallback ao webhook).
- Idempotência saque (`correlation_id`, ledger UNIQUE).
- Fallback honesto em páginas admin sem backend (sem mock enganoso).

---

## 3. Runtime e produção

| Componente | Evidência V1 |
|------------|--------------|
| **App Fly** | `goldeouro-backend-v2` |
| **Release** | **v452** (`complete`) |
| **Região** | `gru` |
| **Machines** | `080e207b071048` (app, check **passing**); `784e047bd04e08` (payout_worker, `started`) |
| **URL** | `https://goldeouro-backend-v2.fly.dev` |
| **`GET /health`** | **200** — `database: connected`, `mercadoPago: connected`, `version: 1.2.1` |
| **`GET /meta`** | **200** — `gitCommit: 7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |
| **`GET /health/workers`** | Payout worker **enabled** em produção |
| **Rollback** | **v451** (e anteriores) via `fly releases` |

**Rastreabilidade:** runtime deployado = commit **`7ecedca`** (H2). HEAD repo **`60bae48`** inclui apenas documentação posterior — **drift documental esperado** até próximo deploy com `GIT_COMMIT`.

---

## 4. Backend

| Área | Estado V1 |
|------|-----------|
| **Entrypoint** | `server-fly.js` |
| **Auth** | JWT Bearer; 401 sem token; 403 token inválido |
| **Admin** | `authenticateToken` + `requireAdministradorDb` (`usuarios.tipo === 'admin'`) |
| **Supabase** | Credenciais unificadas; ping no `/health` |
| **Rotas críticas** | Admin, PIX, saque, jogo — **401** anónimo, **sem 404** crítico (F1) |
| **Legado** | `router.js` no disco, **não montado** em produção |
| **Debug** | `/api/debug/token` → **404** em produção |
| **Monitoramento avançado** | Código comentado (reativação pós-V1) |

**Referência:** `docs/relatorios/F1-AUDITORIA-GLOBAL-RUNTIME-PRODUCAO-BACKEND-V1-2026-05-12.md`

---

## 5. Sistema financeiro

### Arquitetura operacional V1

```text
Depósito:  criar PIX → webhook/reconcile → claim → crédito saldo
Saque:     request → débito + ledger → worker/webhook → payout/rollback
Ledger:    append-only (saques); depósitos fora do ledger
```

| Mecanismo | Estado |
|-----------|--------|
| **PIX criar/status** | Rotas protegidas; MP + Supabase |
| **Webhook depósito** | Assinatura **obrigatória** (`/api/payments/webhook`) |
| **Reconcile** | Ativo (`MP_RECONCILE_ENABLED` default on) |
| **Claim** | RPC `claim_and_credit_approved_pix_deposit` + fallback 1-row |
| **Saque request** | Idempotência, lock saldo, ledger `saque`+`taxa`, rollback |
| **payout_worker** | Processo Fly dedicado; flags ativas |
| **Webhook payout** | `/webhooks/mercadopago` — idempotência ledger; **sem** assinatura no handler |
| **Saques manuais admin** | `approve` / `cancel`; tipos ledger manuais |

### Riscos financeiros aceites na V1 (não bloqueantes)

- Depósitos sem linha em `ledger_financeiro`.
- Webhook payout sem paridade de assinatura com depósito.
- RPC SQL não versionada no repo parent (dependência Supabase).

**Referência:** `docs/relatorios/F2-AUDITORIA-GLOBAL-FINANCEIRO-LEDGER-PIX-SAQUES-V1-2026-05-12.md`

---

## 6. Frontend player

| Item | Valor |
|------|--------|
| **Domínios** | `https://www.goldeouro.lol`, `https://app.goldeouro.lol` |
| **Disponibilidade** | HTTP **200**; bundle prod `index-CoJBA5Cq.js` |
| **API** | `https://goldeouro-backend-v2.fly.dev` |
| **Rotas críticas** | `/`, `/register`, `/dashboard`, `/game`, `/pagamentos`, `/withdraw` |
| **Auth** | `ProtectedRoute` + JWT localStorage |
| **PIX / saque** | `Pagamentos.jsx`, `Withdraw.jsx` → endpoints backend V1 |

**Ressalva:** paths como `/login` ou `/deposit` devolvem shell **200** mas **não** estão no router — usar `/` e `/pagamentos`.

**Referência:** `docs/relatorios/F3-AUDITORIA-GLOBAL-FRONTEND-PAINEL-UX-GOVERNANCA-V1-2026-05-12.md`

---

## 7. Frontend admin

| Item | Valor |
|------|--------|
| **Domínio** | `https://admin.goldeouro.lol` |
| **Deploy** | Vercel (projeto `goldeouro-admin`) |
| **Bundle prod** | `index-d541bc94.js` |
| **API** | Fly v2 (normalização em `env.js`) |
| **Deep links** | `/painel`, `/lista-usuarios`, `/saque-usuarios`, etc. → **200** |
| **Legado** | `/admin/lista-usuarios` **ausente** do bundle |

**Repositório:** `goldeouro-admin/` com **`.git` aninhado** — governança dual-repo (ver §9).

---

## 8. Painel e auditoria

### T14A — entregas consolidadas

| Capacidade | Endpoint / rota |
|------------|-----------------|
| Dashboard | `GET /api/admin/dashboard/stats` · `/painel` |
| Lista utilizadores | `GET /api/admin/users/list` · `/lista-usuarios` |
| Relatório individual | `GET /api/admin/users/:id` · `/relatorio-por-usuario/:id` |
| Chutes recentes | `GET /api/admin/chutes/recentes` · `/chutes` |
| Transações / financeiro | `GET /api/admin/financial/report` · `/transacoes` |
| Saques admin | `GET /api/admin/withdraw/list` · `/saque-usuarios` |
| Bloqueio | `POST /api/admin/users/block` · `unblock` |
| **Auditoria persistida** | `GET /api/admin/audit/logs` · `/auditoria`, `/logs` |
| Tabela | `admin_logs` (migration `20260512_create_admin_logs.sql`) |

### Validação

- **T14A (2026-05-12):** dashboard com métricas reais em sessão autenticada; checklist completo **parcial** sem credenciais no agente.
- **F3 (2026-05-15):** disponibilidade HTTP + alinhamento bundle/API confirmados.

---

## 9. Governança operacional

### Pipeline e documentação

| Artefacto | Função |
|-----------|--------|
| Branch `fix/admin-financial-integrity-v1` | Linha de integridade admin/financeira V1 |
| Relatórios `docs/relatorios/` | Cirurgias, deploys controlados, F1–F3, H1–H2 |
| Tags (ex.) | `v1.2.1`, `pre-h2-runtime-traceability-2026-05-12` |
| Workflows | `backend-deploy.yml`, `deploy-on-demand.yml` com `GIT_COMMIT` |

### Rollback

| Camada | Ação |
|--------|------|
| **Fly** | `fly releases` → v451 ou anterior |
| **Git** | Tag pré-H2 `77464f5`; histórico branch |
| **Vercel** | Deployments anteriores no dashboard |

### Runtime validation

- F1: probes produção + estrutura código.
- H2: evidência `/meta` pós-deploy v452.

### Estado Git local (ressalva H1 — ainda vigente)

- ` M goldeouro-player/vercel.json` (CRLF/LF, sem delta semântico).
- **~18** relatórios + scripts + SQL em `??` (não versionados).
- **Sem** `.gitmodules`; admin é repo separado em `goldeouro-admin/.git`.

---

## 10. Observabilidade e rastreabilidade

| Canal | Maturidade V1 |
|-------|----------------|
| `/health` | ✅ Produção |
| `/meta` + `gitCommit` | ✅ Pós-H2 |
| `/health/workers` | ✅ Flags ENV |
| `financeLog` estruturado | ✅ Eventos depósito/saque |
| Logs Fly | ✅ `fly logs -a goldeouro-backend-v2` |
| Métricas Fly custom | ⚠️ Desligadas no arranque |
| Ledger unificado depósito | ⚠️ Ausente |
| Smoke E2E automatizado contínuo | ⚠️ Parcial |

---

## 11. Riscos mitigados

| # | Risco histórico | Mitigação V1 |
|---|-----------------|--------------|
| 1 | Admin API 404 (`/admin/...`) | T14A → `/api/admin/*` |
| 2 | SPA admin 404 em refresh | Rewrite Vercel corrigido |
| 3 | `gitCommit` nulo | H2 + v452 |
| 4 | Webhook depósito sem validação | Modo estrito 401 |
| 5 | Crédito PIX duplicado | Claim idempotente + reconcile |
| 6 | Saque sem ledger / inconsistência | Check 2 linhas + rollback |
| 7 | Payout duplicado | Ledger dedup |
| 8 | Worker valores inválidos | Rollback automático |
| 9 | `router.js` órfão exposto | Não montado |
| 10 | Mock enganoso no admin | Fallback honesto |
| 11 | Player API URL errada | v2 fly.dev explícito |
| 12 | Incidente ledger manual (mai/2026) | Plano B documentado (SQL `??`) |

---

## 12. Ressalvas não bloqueantes

Estas ressalvas **não impedem** a classificação **V1 OPERACIONAL APROVADA COM RESSALVAS**:

1. **Working tree local suja** — `vercel.json` + relatórios/scripts não versionados (H1).
2. **Smoke humano completo** — login admin/player → todas as páginas → Network (T14A/F3 parciais).
3. **Warning Fly** «not listening on expected address» — histórico; health público OK.
4. **`goldeouro-admin` repo aninhado** — sem submódulo formal no parent.
5. **Rotas SPA HTTP 200 sem router** — ex. `/deposit`, `/users` (UX confusa, não downtime).
6. **HEAD repo ≠ runtime** — docs após `7ecedca` até novo deploy.
7. **Dependabot** — alertas no repositório GitHub (informativo).
8. **Depósito fora do ledger** — trilho contábil assimétrico aceite na V1.
9. **Webhook payout sem assinatura** — mitigado por lookup + idempotência parcial.
10. **CSP removido no player prod** — comentário MVP no HTML.

---

## 13. Estado operacional oficial da V1

### O que está **oficialmente operacional**

| Superfície | URL / referência | Status |
|------------|------------------|--------|
| Backend API | `goldeouro-backend-v2.fly.dev` | ✅ |
| Player | `www.goldeouro.lol`, `app.goldeouro.lol` | ✅ |
| Admin | `admin.goldeouro.lol` | ✅ |
| PIX depósito | API + webhook + reconcile | ✅ |
| Saque PIX | API + worker + webhook payout | ✅ |
| Painel métricas | `/api/admin/dashboard/stats` | ✅ |
| Auditoria admin | `/api/admin/audit/logs` + UI | ✅ |
| Rollback Fly | v451+ | ✅ |

### Baseline de commits (documentação)

| Commit | Descrição |
|--------|-----------|
| `7ecedca` | **Runtime produção** (código + `GIT_COMMIT`) |
| `60bae48` | **HEAD documental** (F1+F2+F3 versionados) |

### Tags e releases de referência

- Fly release: **v452**
- Git tag higiene H2: `pre-h2-runtime-traceability-2026-05-12` → `77464f5`
- Versão produto declarada: **1.2.1** (`/health`, `/meta`)

---

## 14. Roadmap pós-V1

### H3 — HARDENING (próximo foco recomendado)

- Higiene Git: versionar/arquivar `??`, normalizar CRLF, submodularizar ou documentar `goldeouro-admin`.
- Assinatura ou secret no webhook **payout**.
- Confirmar RPC `claim_and_credit_*` no Supabase (read-only audit).
- Gravar `deposito` no ledger (opcional, sem duplicar saldo).
- Smoke E2E autenticado formal (checklist único admin + player).
- Deploy alinhado: `GIT_COMMIT` = HEAD após commits relevantes.
- Revisão CSP player e Dependabot prioritário.

### V2 — ENGINE

- Motor de jogo desacoplado; filas; métricas de gameplay centralizadas.
- API versionada; contratos OpenAPI; testes de integração contínuos.
- Consolidação monorepo ou polyrepo com CI unificado.

### NOVOS JOGOS

- Módulos de jogo plugáveis; economia unificada no ledger.
- UX player modular; anti-cheat por design.

### SISTEMAS DIGITAIS INDESCONECTÁVEL

- Observabilidade central (Sentry, métricas, alertas).
- Antifraude e limites transacionais.
- Painel corporativo multi-produto; identidade única operador.

*Itens acima são **evolução**, não débito bloqueante da V1.*

---

## 15. Classificação final

### Critérios «V1 OPERACIONAL APROVADA»

| Critério | Atendido |
|----------|----------|
| Produção real funcional | ✅ |
| Runtime rastreável | ✅ |
| Backend saudável | ✅ |
| Frontend saudável | ✅ |
| Financeiro operacional | ✅ |
| Painel operacional | ✅ |
| Auditoria presente | ✅ |
| Rollback disponível | ✅ |
| Falha crítica aberta | ❌ Nenhuma identificada |

### Veredito único

# **V1 OPERACIONAL APROVADA COM RESSALVAS**

**Motivo das ressalvas:** governança Git local, homologação E2E humana incompleta, lacunas de hardening documentadas (ledger depósito, webhook payout, dual-repo admin) — todas **geríveis em operação** e endereçáveis no roadmap H3.

### Síntese das auditorias F1–F3

| Auditoria | Classificação |
|-----------|---------------|
| **F1** Runtime + produção + backend | APROVADO COM RESSALVAS |
| **F2** Financeiro + ledger + PIX + saques | APROVADO COM RESSALVAS |
| **F3** Frontend + painel + UX + governança | APROVADO COM RESSALVAS |

---

## 16. Encerramento oficial

Por consolidação das cirurgias **T14A**, higienes **H1** e **H2**, validações de runtime e das auditorias globais **F1**, **F2** e **F3**, declara-se:

> **A baseline Gol de Ouro V1 está oficialmente fechada como OPERACIONAL APROVADA COM RESSALVAS**, em produção real, com backend Fly **v452**, rastreabilidade **`7ecedca`** em `/meta`, frontends **player** e **admin** publicados, núcleo financeiro defensivo, e painel administrativo alinhado ao backend moderno.

**Próximo passo recomendado (fora deste documento):** versionar este relatório de fechamento; executar gate **H3** (hardening + smoke humano); planear **V2 Engine** sem misturar débito de higiene com features de produto.

### Documentos de referência (baseline V1)

| Documento | Conteúdo |
|-----------|----------|
| `F1-AUDITORIA-GLOBAL-RUNTIME-PRODUCAO-BACKEND-V1-2026-05-12.md` | Runtime, Fly, backend |
| `F2-AUDITORIA-GLOBAL-FINANCEIRO-LEDGER-PIX-SAQUES-V1-2026-05-12.md` | PIX, ledger, saques |
| `F3-AUDITORIA-GLOBAL-FRONTEND-PAINEL-UX-GOVERNANCA-V1-2026-05-12.md` | Player, admin, UX |
| `H2-EXECUCAO-CONTROLADA-RUNTIME-GITCOMMIT-2026-05-12.md` | Deploy v452 + `/meta` |
| `H1-HIGIENE-OPERACIONAL-BASELINE-FINAL-V1-2026-05-12.md` | Governança Git |
| `VALIDACAO-FUNCIONAL-T14A-PAINEL-ADMIN-V1-2026-05-12.md` | Painel admin |
| `HARDENING-FINANCEIRO-V1-2026-04-28.md` | Base financeira |

---

**Assinatura documental:** fechamento V1 — Gol de Ouro — produção real — 2026-05-15.  
**Sem alteração de sistemas** na elaboração deste relatório.

*Fim do relatório oficial de fechamento da V1.*
