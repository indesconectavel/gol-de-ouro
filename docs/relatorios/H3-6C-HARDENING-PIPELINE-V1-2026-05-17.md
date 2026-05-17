# H3.6C — HARDENING DE PIPELINE — V1

**Data:** 2026-05-17  
**Contexto:** pós [H3.6C-PRE Snapshot](H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md) · [H3.6B Runtime](H3-6B-AUDITORIA-RUNTIME-DEPLOY-V1-2026-05-17.md)  
**Modo:** cirurgia **limitada** a `.github/workflows/*` + `scripts/ci/`  
**Sem alteração:** gameplay, economia, payout, wallet, engine, frontend funcional, `server-fly.js`, banco, PWA runtime, bundles em produção.

---

## 1. Resumo executivo

Implementado o hardening de pipeline **H3.6C** para eliminar deploy Fly duplicado e redeploy backend em merges **docs-only**, consolidando um único deployer backend e reforçando gates de rastreabilidade (`/health` + `/meta.gitCommit`).

| Resultado | Detalhe |
|-----------|---------|
| Deployer Fly canónico | **`backend-deploy.yml`** apenas |
| `main-pipeline.yml` | **CI sem publicar** |
| Docs-only em `main` | **Não** disparam `backend-deploy` (paths-filter) |
| Gates pós-deploy Fly | `/health` obrigatório + `/meta` === `RELEASE_SHA` |
| Rollback automático | Reapontado para falha de **`backend-deploy.yml`** |
| `deploy-on-demand.yml` | **Removido** deploy Fly; só preview Vercel |

**Produção no instante da validação:** inalterada até merge destes workflows em `main` (`/meta` = `cacc127`, bundle = `index-CZOAOs6A.js`).

**Veredito operacional:** **PASS COM RESSALVAS** — código de pipeline pronto; efeito pleno só após merge; ressalva: branch `dev` ainda publica no mesmo app Fly (herdado).

---

## 2. Problemas herdados da H3.6B

| ID | Problema | Estado pós-H3.6C |
|----|----------|------------------|
| R1 | Dois deployers Fly (`main-pipeline` + `backend-deploy`) | ✅ Eliminado |
| R2 | Merge `main` docs-only → redeploy Fly | ✅ Eliminado (só `main-pipeline` CI) |
| R3 | `continue-on-error` no deploy `main-pipeline` | ✅ Deploy removido |
| R4 | `FLY_API_TOKEN` ausente → `exit 0` no backend | ✅ `exit 1` em prod |
| R5 | Rollback ligado ao workflow errado | ✅ `rollback.yml` → `backend-deploy` |
| R6 | `deploy-on-demand` publicava Fly | ✅ Fly removido |
| R7 | Sem gate `/meta` === SHA | ✅ Gate adicionado |
| R8 | Paths backend incompletos (`src/`, `utils/`) | ✅ Incluídos |

---

## 3. Alterações aplicadas

### 3.1 Workflows

| Ficheiro | Alteração |
|----------|-----------|
| `main-pipeline.yml` | Removido `flyctl deploy`; job renomeado `ci-main`; smoke read-only; mensagem governança H3.6C |
| `backend-deploy.yml` | Único deployer prod; `concurrency` Fly; gates `/health` + `/meta`; `workflow_dispatch` + input `release_sha`; paths `src/**`, `utils/**`; token obrigatório |
| `rollback.yml` | Trigger = falha de `🚀 Backend Deploy (Fly.io)` em `main`; referência snapshot H3-6C-PRE |
| `deploy-on-demand.yml` | Apenas preview Vercel; **sem** job Fly |
| `frontend-deploy.yml` | Comentários H3.6C + referência rollback snapshot (sem mudança de trigger) |

### 3.2 Triggers

| Evento | `main-pipeline` | `backend-deploy` | `frontend-deploy` |
|--------|-----------------|------------------|-------------------|
| Push `main` só `docs/**` ou `*.md` | ✅ CI corre | ❌ não corre | ❌ não corre |
| Push `main` `server-fly.js` / backend paths | ✅ CI corre | ✅ test + deploy | ❌ |
| Push `main` `goldeouro-player/**` | ✅ CI corre | ❌ | ✅ test + `--prod` |
| `workflow_dispatch` backend | — | ✅ deploy com `release_sha` opcional | — |

### 3.3 Deploy backend

- Comando canónico inalterado semanticamente:  
  `flyctl deploy --remote-only --no-cache --app goldeouro-backend-v2 --build-arg GIT_COMMIT="${RELEASE_SHA}"`
- `concurrency.group: fly-production-goldeouro-backend-v2` — evita corridas paralelas.

### 3.4 Deploy frontend

- **Sem alteração funcional** — continua `frontend-deploy.yml` com paths `goldeouro-player/**`.
- Produção canónica: job `deploy-production` + `--prod` (já existente).

### 3.5 Governança

- Comentários nos workflows apontam snapshot e deployers oficiais.
- `scripts/ci/verify-fly-meta.sh` — gate reutilizável para validação local/CI.

### 3.6 Rollback

- Automático: `rollback.yml` após falha de `backend-deploy` em `main`.
- Manual backend: `flyctl releases rollback v459 -a goldeouro-backend-v2` (ver [H3-6C-PRE](H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md)).
- Manual frontend: `frontend-rollback-manual.yml` — promover `dpl_5CiXu7nXmQSXaVuKyjp8QRjoc4tN` para snapshot V1.

### 3.7 Rastreabilidade

- `GIT_COMMIT` build-arg preservado.
- Gate obrigatório: `GET /meta` → `data.gitCommit === RELEASE_SHA`.
- Step `📌 Rastreabilidade release` com `::notice` GitHub.

---

## 4. Workflows finais oficiais

| Workflow | Papel |
|----------|--------|
| **`backend-deploy.yml`** | **Deployer backend oficial** (push main paths / dispatch) |
| **`frontend-deploy.yml`** | **Deployer frontend oficial** (`--prod`) |
| `main-pipeline.yml` | CI integração `main` — **sem deploy** |
| `ci.yml`, `tests.yml`, `security.yml` | CI/testes |
| `frontend-rollback-manual.yml` | Rollback Vercel manual |
| `rollback.yml` | Rollback Fly automático pós-falha backend-deploy |
| `deploy-on-demand.yml` | Preview Vercel break-glass |
| `health-monitor.yml`, `monitoring.yml` | Observabilidade |

**Removidos / desativados:**

| Capacidade | Onde estava | Pós-H3.6C |
|------------|-------------|-----------|
| `flyctl deploy` em push `main` genérico | `main-pipeline.yml` | ❌ Removido |
| Fly deploy em on-demand | `deploy-on-demand.yml` | ❌ Removido |

---

## 5. Regras finais de deploy

### Quando o backend deploya

- Push em **`main`** que altere ficheiros nos **paths backend** listados em `backend-deploy.yml` (incl. `server-fly.js`, `src/**`, `services/**`, …).
- **`workflow_dispatch`** em `backend-deploy.yml` (SHA opcional via `release_sha`).
- **Não** deploya em push que altere apenas `docs/**`, `**/*.md`, relatórios, ou `goldeouro-player/**`.

### Quando o frontend deploya

- Push em **`main`** / **`dev`** com alterações em `goldeouro-player/**`.
- `workflow_dispatch` em `frontend-deploy.yml` (já existente).

### Quando docs NÃO deployam backend

- Merge PR só com ficheiros sob `docs/`, `*.md`, relatórios → corre apenas `main-pipeline` (CI).
- Confirmado pelo **paths-filter** nativo do GitHub Actions em `backend-deploy.yml`.

### Rollback

| Camada | Procedimento |
|--------|----------------|
| **Fly** | `flyctl releases rollback <version> -a goldeouro-backend-v2` ou workflow `rollback.yml` após falha |
| **Vercel** | `frontend-rollback-manual.yml` com `ROLLBACK` + target `dpl_5CiXu7nXm…` |
| **Snapshot V1** | Fly v460 · meta `cacc127` · bundle `CZOAOs6A` — ver H3-6C-PRE |

---

## 6. Evidências pós-hardening

### 6.1 Diff aplicado (workspace)

```text
 .github/workflows/backend-deploy.yml   | refator + gates
 .github/workflows/main-pipeline.yml    | sem flyctl deploy
 .github/workflows/deploy-on-demand.yml  | sem Fly
 .github/workflows/rollback.yml         | trigger backend-deploy
 .github/workflows/frontend-deploy.yml | comentários H3.6C
 scripts/ci/verify-fly-meta.sh         | novo
```

### 6.2 Produção (read-only — workflows ainda não mergeados)

| Probe | Valor | Esperado snapshot |
|-------|--------|-------------------|
| `/meta.gitCommit` | `cacc127…` | ✅ |
| `/health` | `ok` | ✅ |
| `/game` bundle | `index-CZOAOs6A.js` | ✅ |

### 6.3 Coerência pipeline (estática)

| Verificação | Resultado |
|-------------|-----------|
| Um único workflow com `flyctl deploy` em push `main` | ✅ só `backend-deploy` |
| `main-pipeline` sem deploy | ✅ |
| Docs-only não listados em paths backend | ✅ |
| Gate `/meta` no backend-deploy | ✅ |
| Rollback alinhado ao deployer canónico | ✅ |

### 6.4 Validação pós-merge (checklist operador)

Após merge em `main`:

1. Push commit **só docs** → `backend-deploy` **skipped**; `main-pipeline` **success**.
2. Push commit `server-fly.js` (se necessário testar em branch) → `backend-deploy` com gates.
3. Confirmar `/meta.gitCommit` === SHA do deploy.

---

## 7. Riscos eliminados

- Deploy fantasma Fly via `main-pipeline` em todo push `main`.
- Corrida entre dois `flyctl deploy` no mesmo merge.
- Redeploy backend involuntário por PR #92/#93 (docs-only).
- Deploy Fly silenciosamente skipped sem token em **produção** (`exit 0`).
- Rollback automático desligado do deployer real.
- Terceiro deployer Fly via `deploy-on-demand`.

---

## 8. Riscos remanescentes

| ID | Risco | Nível |
|----|-------|-------|
| M1 | Efeito H3.6C só após **merge** em `main` | Operacional |
| M2 | Push `dev` ainda faz deploy no **mesmo** app Fly | Médio (V1.1) |
| M3 | Deploy manual Fly/Vercel dashboard (bypass CI) | Médio |
| M4 | PWA pode manter bundle antigo em clientes | Baixo |
| M5 | `workflow_dispatch` backend sem approval environment | Baixo |
| M6 | PR com paths backend dispara testes mas não deploy (esperado) | Info |

---

## 9. Veredito operacional

# **PASS COM RESSALVAS**

| Critério | Avaliação |
|----------|-----------|
| Escopo respeitado (só pipeline) | ✅ |
| Um deployer Fly | ✅ |
| Proteção docs-only | ✅ |
| Rastreabilidade `/meta` | ✅ |
| Rollback documentado/alinhado | ✅ |
| Produção validada no snapshot | ✅ |
| Hardening activo em produção | ⚠️ Após merge |

**Não é NO-GO:** alterações são mínimas, reversíveis (revert PR) e compatíveis com baseline V1.

---

## 10. Próximo passo recomendado

| Ordem | Acção |
|-------|--------|
| **1** | **PR dedicado** `fix/h3-6c-pipeline-hardening` → revisão → merge controlado em `main` |
| **2** | Após merge: push docs-only de prova + confirmar `backend-deploy` skipped |
| **3** | **H3.7 — Certificação Operacional V1** (smoke autenticado, sign-off, matriz GO) |
| **4** | V1.1 opcional: separar app Fly `dev` · GitHub Environment `production` com approval |

**Não recomendado agora:** Engine V2 · alterações em `server-fly.js` · mudanças PWA.

---

## Anexo A — Ficheiros tocados

- `.github/workflows/main-pipeline.yml`
- `.github/workflows/backend-deploy.yml`
- `.github/workflows/rollback.yml`
- `.github/workflows/deploy-on-demand.yml`
- `.github/workflows/frontend-deploy.yml` (cabeçalho)
- `scripts/ci/verify-fly-meta.sh`

## Anexo B — Snapshot preservado (não alterar rollback doc)

```text
Fly v460 · meta cacc127 · Vercel dpl_5CiXu7nXm… · bundle index-CZOAOs6A.js
Ver: docs/relatorios/H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md
```

---

*Relatório H3.6C — hardening de pipeline V1. Produção não foi deployada nesta sessão.*
