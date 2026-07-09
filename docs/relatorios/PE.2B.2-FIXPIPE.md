# PE.2B.2-FIXPIPE — Publicação Segura do Pipeline Staging

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Gate:** PE.2B.2-FIXPIPE (Fase B → C)  
**Data:** 2026-07-09  
**Modo:** GOVERNANÇA DE PIPELINE  
**Escopo:** Infraestrutura CI/CD staging — **sem deploy, sem runtime, sem PE funcional**

---

## Veredito

# BLOCKED

**Pronto para PE.2B.2:** **NO-GO** (re-executar FINAL-PRE após push + flag)

---

## Respostas obrigatórias

| Pergunta | Resposta |
|----------|----------|
| Produção alterada? | **NÃO** |
| Runtime alterado? | **NÃO** |
| Deploy executado? | **NÃO** |
| Workflow publicado? | **NÃO** (local criado; push pendente) |
| fly.staging.toml publicado? | **NÃO** (local criado; push pendente) |
| Secrets staging confirmadas? | **NÃO** (`fly secrets list` indisponível) |
| Rollback documentado? | **SIM** |
| Pipeline auditável? | **PARCIAL** (artefatos locais validados) |
| Pronto para PE.2B.2? | **NO-GO** |

---

## Bloqueadores FINAL-PRE — status

| ID | Objetivo | Status |
|----|----------|--------|
| **FP-01** | Publicar `backend-deploy-staging.yml` | ✅ **Local** — ❌ GitHub |
| **FP-02** | Versionar `fly.staging.toml` | ✅ **Local** — ❌ GitHub |
| **FP-03** | Documentar governança | ✅ **Concluído** |
| **FP-04** | Confirmar `PE_ADAPTER_BOUNDARY_ENABLED=false` | ❌ **BLOCKED** |
| **FP-05** | Validar publicação remota GitHub | ❌ **BLOCKED** |

---

## Artefatos criados (escopo autorizado)

### FP-01 — `.github/workflows/backend-deploy-staging.yml`

Validação estática:

| Critério | OK |
|----------|-----|
| Somente `workflow_dispatch` | ✅ |
| App = `goldeouro-backend-staging` | ✅ |
| Config = `fly.staging.toml` | ✅ |
| Nunca `fly.toml` | ✅ |
| Nunca `goldeouro-backend-v2` como alvo | ✅ |
| Default `pe2b-adapter-boundary-safe` | ✅ |
| Aceita `pe/pe2b-staging-deploy` | ✅ |
| Guards anti-produção | ✅ |
| Gate produção read-only pós-deploy | ✅ |

### FP-02 — `fly.staging.toml`

| Critério | OK |
|----------|-----|
| `app = goldeouro-backend-staging` | ✅ |
| `NODE_ENV = staging` | ✅ |
| `DATABASE_ENV = staging` | ✅ |
| Processo `app` only (`node server-fly.js`) | ✅ |
| Sem `payout_worker` | ✅ |
| Sem referência a `goldeouro-backend-v2` | ✅ |
| Memória 512 MB (G2/H2A) | ✅ |

### FP-03 — Governança

- `docs/payment-engine/staging/deployment-governance.md` — fluxo, pré-check, pós-check, rollback, abort

---

## Runtime (read-only)

### Produção — intocada ✅

| Campo | Valor |
|-------|-------|
| URL | https://goldeouro-backend-v2.fly.dev/meta |
| `environment` | `production` |
| `gitCommit` | `f21f310-p5pixout` |
| `productionRuntime` | `true` |

### Staging — inalterado ✅

| Campo | Valor |
|-------|-------|
| URL | https://goldeouro-backend-staging.fly.dev/meta |
| `environment` | `staging` |
| `gitCommit` | `b29d847` (pré-PE.2B) |
| `productionRuntime` | `false` |

---

## FP-04 — Flag staging (BLOCKED)

`fly secrets list -a goldeouro-backend-staging` **não pôde ser executado** (shell do agente indisponível).

**Regra do gate:** dúvida sobre secrets → **BLOCKED**. Não improvisar.

**Ação operador:**

```bash
fly secrets list -a goldeouro-backend-staging
# Se PE_ADAPTER_BOUNDARY_ENABLED ausente:
fly secrets set PE_ADAPTER_BOUNDARY_ENABLED=false -a goldeouro-backend-staging
```

---

## FP-05 — Publicação GitHub (BLOCKED)

GitHub API (pré-push) retornava **404** para workflow e `fly.staging.toml`.

**Ação operador:**

```bash
cd "e:\Chute de Ouro\goldeouro-backend"
git checkout pe/pe2b-staging-deploy
git add fly.staging.toml .github/workflows/backend-deploy-staging.yml docs/payment-engine/staging/ docs/relatorios/PE.2B.2-FIXPIPE.md docs/relatorios/snapshots/pe2b2-fixpipe.json
git commit -m "ci(staging): publish PE.2B.2 staging pipeline and governance docs"
git push origin pe/pe2b-staging-deploy
```

Validar após push:

```bash
# Deve retornar 200, não 404
curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/indesconectavel/gol-de-ouro/contents/.github/workflows/backend-deploy-staging.yml?ref=pe/pe2b-staging-deploy"
curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/indesconectavel/gol-de-ouro/contents/fly.staging.toml?ref=pe/pe2b-staging-deploy"
```

---

## Critérios de aprovação — avaliação

| Critério | Status |
|----------|--------|
| Workflow no GitHub | ❌ |
| fly.staging.toml no GitHub | ❌ |
| Workflow somente staging | ✅ (local) |
| Workflow somente fly.staging.toml | ✅ (local) |
| Produção intocada | ✅ |
| Flag staging confirmada | ❌ |
| Rollback documentado | ✅ |

---

## Próximo gate autorizado

1. Push dos artefatos + confirmar flag staging  
2. **PE.2B.2-FINAL-PRE** (re-auditoria read-only)  
3. Somente com FINAL-PRE **PASS** → **PE.2B.2** deploy controlado

---

## Entregáveis

| Arquivo |
|---------|
| `docs/relatorios/PE.2B.2-FIXPIPE.md` |
| `docs/payment-engine/staging/pipeline-audit.json` |
| `docs/payment-engine/staging/workflow-validation.json` |
| `docs/payment-engine/staging/fly-config-validation.json` |
| `docs/payment-engine/staging/deployment-governance.md` |
| `docs/relatorios/snapshots/pe2b2-fixpipe.json` |
| `.github/workflows/backend-deploy-staging.yml` |
| `fly.staging.toml` |
