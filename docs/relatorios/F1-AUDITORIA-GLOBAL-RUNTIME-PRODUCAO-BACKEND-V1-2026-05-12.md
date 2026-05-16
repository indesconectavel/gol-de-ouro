# F1 — AUDITORIA GLOBAL FINAL V1
# RUNTIME + PRODUÇÃO + BACKEND

**Modo:** READ-ONLY (sem alterações de código, deploy, banco ou workflows)  
**Data da auditoria:** 2026-05-15 (sessão F1)  
**Branch auditada:** `fix/admin-financial-integrity-v1`  
**App Fly:** `goldeouro-backend-v2`  
**URL pública:** `https://goldeouro-backend-v2.fly.dev`  
**Baseline declarada:** T14A concluída · H1 concluída · H2 concluída · release Fly esperada **v452**

---

## 1. Resumo executivo

Auditoria **F1** executada contra produção real (`goldeouro-backend-v2.fly.dev`) e contra o repositório local. O **runtime Fly está saudável**: release **v452** ativa, duas máquinas `started`, health check Fly **passing**, `GET /health` e `GET /meta` em **200**, base de dados e Mercado Pago reportados como **connected**. Endpoints admin e financeiros críticos **existem** e respondem **401** sem token (não **404**). Rastreabilidade H2 **confirmada**: `data.gitCommit` não é nulo e coincide com o commit deployado **`7ecedca`**.

**Ressalvas de governança (não bloqueantes operacionais):** working tree com ficheiros `??` e `goldeouro-player/vercel.json` modificado; **HEAD local** (`61c4679`) à frente do artefacto em runtime (`7ecedca`) por commits apenas documentais pós-deploy H2; warning Fly histórico de bind address; `router.js` legado presente no repo mas **não montado** em `server-fly.js`.

**Classificação oficial F1:** **F1 APROVADO COM RESSALVAS**

| Dimensão | Resultado |
|----------|-----------|
| Runtime Fly | ✅ Saudável (v452) |
| Health / Meta | ✅ 200, critérios H2 cumpridos |
| Endpoints críticos | ✅ Existentes, auth coerente |
| Produção | ✅ Estável, sem crash loop observável |
| Governança Git local | ⚠️ Working tree suja |
| Runtime ↔ HEAD repo | ⚠️ Drift documental esperado |

---

## 2. Estado Git

### Comandos executados

```text
git status --short
git branch --show-current
git log -5 --oneline
git rev-parse HEAD
git tag --list | tail
git rev-list --left-right --count origin/fix/admin-financial-integrity-v1...HEAD
```

### Registo

| Campo | Valor |
|-------|--------|
| **HEAD** | `61c46799455ad87a18eb9e3dba0edb685bc5c93e` (`61c4679`) |
| **Branch** | `fix/admin-financial-integrity-v1` |
| **Sincronia com origin** | `0 0` (alinhado com `origin/fix/admin-financial-integrity-v1`) |

### `git log -5 --oneline`

```text
61c4679 docs: registrar validacao global runtime fechamento pipeline V1
a94a70b docs: registrar H2 execucao controlada gitCommit runtime
7ecedca fix(ci): injetar GIT_COMMIT no deploy on-demand Fly (H2)
77464f5 docs: preparar baseline H2 runtime traceability
b5eb492 docs: registrar H2 pre-execucao gitCommit meta
```

### Tags recentes (últimas 10)

`v1.2.1`, `v1.2.0`, `v1.1.2`, `v1.1.1-prod`, `v2.0.0-pix-complete`, `v3.0.0-golden-goal`, entre outras.

### Arquivos fora do escopo F1 (working tree)

| Tipo | Itens |
|------|--------|
| **Modificado** | `goldeouro-player/vercel.json` (frontend/player — fora do núcleo backend F1) |
| **Não rastreados (`??`)** | 20+ relatórios em `docs/relatorios/`, scripts operacionais (`scripts/*20260504*.js`), SQL `database/exec-plano-b-reversao-transacao-20260504.sql` |

### Baseline atual

- **Código em produção (via `/meta`):** commit **`7ecedca`** (H2 — injeção `GIT_COMMIT` no deploy on-demand).
- **HEAD local:** **`61c4679`** — apenas documentação após H2; **não** implica regressão se não houve novo deploy.
- **T14A / H1 / H2:** documentados e coerentes com histórico recente da branch.

---

## 3. Runtime Fly

### Comandos

```text
fly releases -a goldeouro-backend-v2
fly status -a goldeouro-backend-v2
```

### Release ativa

| Campo | Valor |
|-------|--------|
| **Release** | **v452** (`complete`, ~17h antes da auditoria em 2026-05-15) |
| **Release anterior estável** | v451 (rollback disponível) |
| **Imagem** | `goldeouro-backend-v2:deployment-01KRM3KRNFSNAACC21P1FDP4P4` |
| **Hostname** | `goldeouro-backend-v2.fly.dev` |
| **Região** | `gru` |

### Machines

| Processo | Machine ID | Version | State | Checks |
|----------|------------|---------|-------|--------|
| **app** | `080e207b071048` | 452 | `started` | 1 total, **1 passing** |
| **payout_worker** | `784e047bd04e08` | 452 | `started` | — |

**Última atualização machines:** 2026-05-14T20:43:31Z / 32Z

### Warnings conhecidos (histórico H2)

Durante deploy v452 foi registado warning Fly: *"app is not listening on the expected address"* — seguido de smoke com máquinas em bom estado. O servidor em `server-fly.js` faz `listen(PORT, '0.0.0.0')`; health público **200** confirma que o proxy alcança a app. **Ressalva operacional**, não bloqueante F1.

### `fly.toml` (estrutura)

- App: `goldeouro-backend-v2`
- Processos: `app` → `npm start` (`server-fly.js`); `payout_worker` → `node src/workers/payout-worker.js`
- HTTP check: `GET /health` a cada 30s

---

## 4. Healthcheck global

**Request:** `GET https://goldeouro-backend-v2.fly.dev/health`  
**HTTP:** **200**

```json
{
  "status": "ok",
  "timestamp": "2026-05-15T14:18:10.784Z",
  "version": "1.2.1",
  "database": "connected",
  "mercadoPago": "connected",
  "contadorChutes": 384,
  "ultimoGolDeOuro": 0
}
```

| Critério | Status |
|----------|--------|
| HTTP 200 | ✅ |
| `database: connected` | ✅ |
| `mercadoPago: connected` | ✅ |
| `version: 1.2.1` | ✅ |

**Workers (leitura de flags):** `GET /health/workers` → **200**

```json
{
  "success": true,
  "data": {
    "payoutWorker": {
      "enabledByEnv": true,
      "payoutPixProcessingEnabled": true
    }
  }
}
```

---

## 5. Meta runtime

**Request:** `GET https://goldeouro-backend-v2.fly.dev/meta`  
**HTTP:** **200**

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "7ecedca98d1f5d5d7c1878aa043ec724e422dd41",
    "environment": "production",
    "compatibility": { "minVersion": "1.0.0", "supported": true },
    "features": { "pix": true, "goldenGoal": true, "monitoring": true }
  }
}
```

| Critério | Status |
|----------|--------|
| `gitCommit` não-null | ✅ |
| Coerente com H2 (`7ecedca`) | ✅ (match exato com deploy documentado em `H2-EXECUCAO-CONTROLADA-RUNTIME-GITCOMMIT-2026-05-12.md`) |
| Coerente com HEAD local atual (`61c4679`) | ⚠️ Não — esperado: commits pós-H2 são só docs, sem redeploy |

**Implementação:** `process.env.GIT_COMMIT` em `server-fly.js` (L4207–4217); `Dockerfile` com `ARG`/`ENV`; workflows `backend-deploy.yml`, `main-pipeline.yml`, `deploy-on-demand.yml` com `--build-arg GIT_COMMIT`.

---

## 6. Endpoints críticos

Base: `https://goldeouro-backend-v2.fly.dev` — **sem** header `Authorization`, salvo nota.

| Endpoint | Método testado | HTTP | Resumo / classificação |
|----------|----------------|------|-------------------------|
| `/api/admin/chutes/recentes` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/admin/users/:id` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/admin/audit/logs` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/admin/dashboard/stats` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/admin/users/list` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/admin/financial/report` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/withdraw/request` | GET | **404** | Rota existe como **POST** apenas; 404 por método incorreto ℹ️ |
| `/api/withdraw/request` | POST `{}` | **401** | Rota ativa; auth exigida ✅ |
| `/api/withdraw/history` | GET | **401** | Rota ativa; auth exigida ✅ |
| `/api/payments/pix/status` | GET | **401** | Sem token → auth antes de validação de `paymentId` ✅ |
| `/api/payments/pix/status` | GET + Bearer inválido | **403** | Token rejeitado pelo JWT ✅ |
| `/api/games/shoot` | GET | **404** | Rota existe como **POST** apenas ℹ️ |
| `/api/games/shoot` | POST | **401** | Rota ativa; auth exigida ✅ |

**Middleware admin:** cadeia `authenticateToken` → `requireAdministradorDb` (validação `usuarios.tipo === 'admin'` no Supabase).

**Nota sobre 400:** `handleGetPixStatus` devolve **400** quando `paymentId` inválido/ausente, mas **após** `authenticateToken`; sem token válido observou-se **401/403**, comportamento coerente.

**Ausência de 404 críticos** nos caminhos admin listados: **confirmada**.

---

## 7. Estrutura backend

### Entrypoint e dependências

| Item | Estado |
|------|--------|
| **Entrypoint produção** | `server-fly.js` (`package.json` → `"start": "node server-fly.js"`) |
| **Supabase** | `./database/supabase-unified-config` — `supabaseAdmin`, health no `/health` |
| **Env obrigatório** | `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; em produção também `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (`config/required-env.js`) |
| **Auth** | JWT Bearer; 401 sem token; 403 token inválido (`authenticateToken`, L398–433) |
| **Admin DB** | `requireAdministradorDb` (L2054–2075) — 503 se DB down; 403 se não admin |

### Rotas admin montadas em `server-fly.js` (amostra crítica)

- `GET /api/admin/users/list`
- `GET /api/admin/users/:id`
- `GET /api/admin/chutes/recentes`
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/financial/report`
- `GET /api/admin/audit/logs`
- `POST /api/admin/users/block` · `unblock`
- `GET /api/admin/withdraw/list` · approve/cancel

### Rotas legado / sensíveis

| Rota | Estado F1 |
|------|-----------|
| `POST /api/admin/bootstrap` | Ativa — one-shot promoção admin se `count(admin)=0` |
| `GET /api/debug/token` | **404** em produção (`isProduction()`) ✅ |
| `router.js` (v1.1.1) | **Não** referenciado em `server-fly.js` — órfão no disco, **não** exposto ✅ |
| Fallback `app.use('*')` | 404 JSON com `path` e `method` (L4633–4640) |

### Monitoramento

- Middleware de métricas in-process (L4110+) — logs estruturados por request.
- Pacotes `monitoring/flyio-*` **comentados** no arranque (re-habilitação futura).

### Integração financeira

- Saques: `POST /api/withdraw/request`, worker `payout_worker`, flags `ENABLE_PIX_PAYOUT_WORKER` / `PAYOUT_PIX_ENABLED`.
- PIX: webhooks com validação de assinatura (`webhookSignatureValidator`).

---

## 8. Produção real

| Verificação | Evidência |
|-------------|-----------|
| Backend operável | `/health` 200, DB/MP connected |
| Fly consistente | v452, checks passing, 2 processos started |
| Supabase acessível | Ping via health (`usuarios` select head) |
| Runtime rastreável | `/meta.gitCommit` = `7ecedca` |
| Endpoints protegidos | Admin/player 401 sem token |
| Sem regressão crítica de rotas admin | Nenhum 404 nos GET admin testados |
| Sem crash loop | Machines `started`, release `complete` |
| Sem release quebrada | v452 estável; v451 para rollback |

**Não executado nesta F1 (fora do escopo READ-ONLY runtime):** smoke autenticado completo painel admin, E2E saque real, validação de tabela `admin_logs` no Supabase.

---

## 9. Observabilidade

| Canal | Maturidade | Gap |
|-------|------------|-----|
| `GET /health` | ✅ Produção | — |
| `GET /meta` + `gitCommit` | ✅ Pós-H2 | HEAD local ≠ runtime até próximo deploy |
| `GET /health/workers` | ✅ Flags ENV | Liveness real do worker = logs `[PAYOUT][WORKER][HEARTBEAT]` |
| Logs Fly | ✅ `fly logs -a goldeouro-backend-v2` | Sem amostragem nesta sessão |
| Releases / rollback | ✅ v451←v452 via `fly releases` | — |
| Métricas avançadas Fly | ⚠️ Código comentado | Custom metrics/notifications desligados |
| Label OCI imagem | ✅ `Dockerfile` `org.opencontainers.image.revision` | — |

**Maturidade operacional atual:** **adequada para V1** com rastreabilidade de build restaurada (H2); gaps em correlação automática HEAD local ↔ runtime e higiene de working tree.

---

## 10. Riscos críticos

**Nenhum risco crítico identificado** na auditoria F1 de runtime/produção/backend público.

---

## 11. Riscos médios

| ID | Risco | Domínio | Nota |
|----|-------|---------|------|
| M1 | Working tree suja (docs/scripts/SQL não versionados + `vercel.json` modificado) | Deploy / governança | Pode gerar deploy acidental com artefactos errados se não houver disciplina |
| M2 | `POST /api/admin/bootstrap` ainda exposto a qualquer utilizador autenticado quando não há admin | Auth | Mitigado se já existe admin; risco de escalada no cenário “zero admins” |
| M3 | Drift HEAD (`61c4679`) vs runtime (`7ecedca`) | Rastreabilidade | Esperado até deploy; confundir suporte se não documentado |
| M4 | Deploy manual sem `--build-arg GIT_COMMIT` | Runtime | Workflows corrigidos; risco de regressão a `gitCommit: null` |

---

## 12. Riscos leves

| ID | Risco | Domínio |
|----|-------|---------|
| L1 | Warning Fly bind address no deploy | Runtime |
| L2 | GET em rotas POST-only devolve 404 (não diferencia “método errado”) | API UX |
| L3 | `npm audit` / vulnerabilidades no build log | Dependências |
| L4 | Monitoramento avançado comentado no arranque | Observabilidade |
| L5 | `build` estático `2025-10-21` em `/meta` | Metadados |

---

## 13. Riscos mitigados

| Risco histórico | Mitigação observada |
|-----------------|---------------------|
| `gitCommit: null` em `/meta` | H2 + v452 — valor real presente |
| Rotas admin 404 (T14A) | GET admin → 401, rotas montadas em `server-fly.js` |
| `router.js` órfão perigoso | Não montado no servidor de produção |
| `/api/debug/token` em produção | 404 forçado |
| Regressão release Fly | v452 complete, health passing |
| Auth admin só por token sem DB | `requireAdministradorDb` consulta `usuarios.tipo` |

---

## 14. Diagnóstico global

O **núcleo backend V1 em produção está saudável e alinhado** com as cirurgias recentes (T14A estrutural admin, H2 rastreabilidade). A evidência runtime é **consistente** com o relatório H2: release **v452**, `gitCommit` **7ecedca**, health e integrações OK.

Os pontos em aberto são predominantemente de **governança de repositório** (working tree, ficheiros operacionais não versionados) e de **aceite formal** (smokes autenticados admin/player não repetidos nesta F1), não de indisponibilidade ou ausência de rotas críticas.

**Mapa de confiança F1:**

```text
Produção Fly     ████████████████████  Alta
Health/Meta      ████████████████████  Alta
Auth middleware  ██████████████████░░  Alta (bootstrap ressalva)
Rotas admin      ████████████████████  Alta
Governança Git   ████████░░░░░░░░░░░░  Média
Observabilidade  ██████████████░░░░░░  Boa (gaps métricas avançadas)
```

---

## 15. Recomendação oficial

### Classificação F1: **F1 APROVADO COM RESSALVAS**

**Justificativa:** todos os critérios operacionais de **F1 APROVADO** foram cumpridos (runtime saudável, `/health` e `/meta` OK, endpoints críticos existentes, auth coerente, produção estável, sem regressão crítica de 404 admin). As ressalvas referem-se a **higiene Git local**, **drift HEAD vs imagem deployada** (documental) e **superfícies históricas** (`bootstrap`, warning Fly) — não bloqueiam o fechamento F1 do núcleo backend.

### Próximos passos sugeridos (fora desta auditoria READ-ONLY)

1. **Higiene H1/H3:** decidir versionar, arquivar ou `.gitignore` dos `??` operacionais; não commitar `vercel.json` sem cirurgia frontend.
2. **Opcional:** deploy com `GIT_COMMIT=$(git rev-parse HEAD)` após commits relevantes, para alinhar `/meta` ao HEAD.
3. **F2+:** smoke autenticado painel admin (`/audit/logs`, dashboard, financial report) e gate E2E utilizador.
4. **Governança:** avaliar desativação ou proteção extra de `/api/admin/bootstrap` em produção.

---

## Anexo A — Evidências de comando (timestamp auditoria)

```text
Data sessão: 2026-05-15 ~14:17–14:18 UTC
fly releases  → v452 complete (primeira linha)
fly status    → app 080e207b071048 + payout_worker 784e047bd04e08, version 452
curl /health  → 200
curl /meta    → 200, gitCommit 7ecedca...
```

---

*Relatório gerado em modo READ-ONLY — F1 Runtime + Produção + Backend — Gol de Ouro V1.*
