# H3.6C-FIX — Blindagem do Frontend Deploy — V1

**Data:** 2026-05-17  
**Contexto:** pós merge [PR #94](https://github.com/indesconectavel/gol-de-ouro/pull/94) (H3.6C) · ressalva pós-merge: `frontend-deploy` republicou player por alteração em `.github/workflows/frontend-deploy.yml`  
**Modo:** cirurgia **limitada** a `.github/workflows/frontend-deploy.yml` + este relatório  
**Sem alteração:** `goldeouro-player/**` (código), backend, financeiro, gameplay, banco, PWA, service worker.

---

## 1. Resumo executivo

| Item | Detalhe |
|------|---------|
| Problema | Merge H3.6C (#94) alterou `frontend-deploy.yml`; o self-path no trigger disparou **Vercel `--prod`** |
| Bundle antes do merge #94 | `index-CZOAOs6A.js` |
| **Bundle activo pós-H3.6C (pós-merge #94)** | **`index-B6M2smS9.js`** |
| Correcção | Remover `.github/workflows/frontend-deploy.yml` dos `paths` de `push` |
| Paridade | Alinhar com `backend-deploy.yml` (sem self-path; sem `docs/**` / `scripts/**`) |

**Veredito:** correção de governança de pipeline; **não** altera runtime do jogo.

---

## 2. Incidente pós-merge PR #94

| Workflow | Esperado no merge #94 | Observado |
|----------|----------------------|-----------|
| `main-pipeline` | CI only | ✅ success |
| `backend-deploy` | Sem deploy Fly | ✅ Fly permanece **v460**; `/meta` **cacc127** |
| `frontend-deploy` | Skipped | ❌ **success** — deploy prod executado |

**Causa raiz:** linha explícita nos paths:

```yaml
paths:
  - 'goldeouro-player/**'
  - '.github/workflows/frontend-deploy.yml'  # ← removido em H3.6C-FIX
```

O PR #94 tocava esse ficheiro (comentários H3.6C) → GitHub Actions considerou match → rebuild Vercel → novo hash de bundle (`B6M2smS9`).

---

## 3. Alteração aplicada (H3.6C-FIX)

### 3.1 `frontend-deploy.yml` — triggers `push`

| Path | Deploy automático |
|------|-------------------|
| `goldeouro-player/**` | ✅ (código, `vercel.json`, `package.json`, assets, build config) |
| `.github/workflows/**` | ❌ |
| `docs/**` | ❌ (não listado) |
| `scripts/**` | ❌ (não listado) |

**Incluído implicitamente em `goldeouro-player/**`:**

- `goldeouro-player/vercel.json` — rewrites SPA / domínios
- `goldeouro-player/package.json` / `package-lock.json`
- `vite.config.js`, `index.html`, PWA manifest no player (sem alteração neste PR)

**Excluído explicitamente:** self-path do workflow (como em `backend-deploy.yml` pós-`448d325`).

### 3.2 Sem mudança

- Jobs (`test-frontend`, `deploy-production`, gates smoke/deep links)
- `pull_request` paths (já só `goldeouro-player/**`)
- `workflow_dispatch` (deploy manual break-glass)

---

## 4. Validação esperada pós-merge deste fix

Merge do PR H3.6C-FIX altera **apenas**:

- `.github/workflows/frontend-deploy.yml`
- `docs/relatorios/H3-6C-FIX-BLINDAGEM-FRONTEND-DEPLOY-V1-2026-05-17.md`

| Workflow | Resultado esperado |
|----------|-------------------|
| `main-pipeline` | ✅ CI (`ci-main`) |
| `backend-deploy` | ❌ Não corre / sem jobs (paths backend não tocados) |
| `frontend-deploy` | ❌ **Não deve correr** (único path funcional seria `goldeouro-player/**`, não alterado) |

### Produção esperada inalterada após merge

| Probe | Valor esperado |
|-------|----------------|
| `/meta.gitCommit` | `cacc127` |
| `/health` | `ok` |
| Fly release | **v460** (sem v461+) |
| Bundle www | **`index-B6M2smS9.js`** (mantém baseline pós-#94) |
| `/game` | HTTP 200 |

**Nota:** este fix **não** reverte o bundle para `CZOAOs6A`; apenas impede redeploys futuros em merges só-pipeline/docs.

---

## 5. Baseline operacional actualizada (frontend)

| Campo | Valor |
|-------|--------|
| Merge H3.6C SHA | `4ee150cb8c7d895921fe409da0eb7daa2581488d` |
| Bundle produção (canónico pós-#94) | **`index-B6M2smS9.js`** |
| Bundle histórico V1 (pré-#94) | `index-CZOAOs6A.js` · snapshot `dpl_5CiXu7nXm…` |
| Rollback manual | `frontend-rollback-manual.yml` |

---

## 6. Riscos eliminados / remanescentes

| ID | Estado |
|----|--------|
| R-F1 | ✅ Merge só workflows/docs não republica player |
| M-F1 | ⚠️ Clientes com cache PWA podem ver bundle antigo (herdado) |
| M-F2 | `workflow_dispatch` em `frontend-deploy` ainda publica (intencional) |

---

## 7. Veredito

# **PASS** (governança)

Pronto para PR dedicado · **merge manual** · validar checklist da secção 4 após merge.

---

## Anexo — Diff conceptual

```diff
 on:
   push:
     paths:
       - 'goldeouro-player/**'
-      - '.github/workflows/frontend-deploy.yml'
```

---

*Relatório H3.6C-FIX — blindagem frontend deploy. Nenhum deploy manual executado nesta sessão.*
