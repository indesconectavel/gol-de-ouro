# Blindagem Player – Workflow Vercel (READ-ONLY)

**Data:** 2026-03-04  
**Objetivo:** Identificar qual workflow faz deploy do Vercel para o player e quais condições disparam esse deploy.

---

## 1) Workflows listados

```
.github/workflows/
  backend-deploy.yml
  ci.yml
  configurar-seguranca.yml
  deploy-on-demand.yml
  frontend-deploy.yml
  health-monitor.yml
  main-pipeline.yml
  monitoring.yml
  rollback.yml
  security.yml
  tests.yml
```

---

## 2) Busca por Vercel

Comando: `rg -n "vercel|npx vercel|vercel --prod|VERCEL" .github/workflows`

**Arquivos com match:**

| Arquivo               | Ocorrências |
|-----------------------|-------------|
| main-pipeline.yml     | 6 (VERCEL_*, npx vercel --prod --yes) |
| frontend-deploy.yml   | 14 (vercel-action, VERCEL_*) |
| rollback.yml          | 6 (npx vercel ls, vercel promote) |
| deploy-on-demand.yml  | 6 (vercel-action, VERCEL_*) |

---

## 3) Detalhamento por workflow

### 3.1) main-pipeline.yml

| Campo | Valor |
|-------|--------|
| **Nome** | 🚀 Pipeline Principal - Gol de Ouro |
| **Eventos (on:)** | `push: branches: [ main ]` e `workflow_dispatch` |
| **Path filter** | **Nenhum** — qualquer push em `main` dispara o workflow. |
| **Monorepo / player** | Sim. Step de frontend usa `working-directory: ./goldeouro-player`. |
| **Job** | `build-and-deploy` (único job). |
| **Steps que chamam Vercel** | **"🌐 Deploy Frontend (Vercel)"** (linhas 47–61): `run: npx vercel --prod --yes` com `working-directory: ./goldeouro-player`; env `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. |
| **working-directory** | `./goldeouro-player` (apenas no step do frontend). |
| **Ordem** | 1) Checkout, 2) Node, 3) npm ci (raiz), 4) Validar estrutura (raiz), 5) Deploy Backend (Fly), 6) **Deploy Frontend (Vercel)**, 7) Validar endpoints, 8) Upload artifacts, 9) Log. |

**Resumo:** Todo push em `main` (ou run manual) faz deploy do backend no Fly e em seguida deploy do player no Vercel (`--prod`), sem filtrar por paths. Ou seja, **mesmo commits que só alteram backend** disparam deploy do player a partir do conteúdo atual de `goldeouro-player` no repositório.

---

### 3.2) frontend-deploy.yml

| Campo | Valor |
|-------|--------|
| **Nome** | 🎨 Frontend Deploy (Vercel) |
| **Eventos (on:)** | `push: branches: [ main, dev ]` com **paths: `goldeouro-player/**`, `.github/workflows/frontend-deploy.yml`**; `pull_request: branches: [ main ]` com **paths: `goldeouro-player/**`**. |
| **Path filter** | **Sim.** Só corre quando há mudanças em `goldeouro-player/**` ou no próprio workflow. |
| **Monorepo / player** | Sim. Jobs usam `working-directory: goldeouro-player` ou `cd goldeouro-player`. |
| **Jobs que chamam Vercel** | `deploy-production` (main): **amondnet/vercel-action@v25** com `vercel-args: '--prod --yes'`, `working-directory: goldeouro-player`. `deploy-development` (dev): mesma action com `vercel-args: '--target preview'`. |
| **working-directory** | `goldeouro-player` (na action e nos steps com `cd goldeouro-player`). |
| **Condição produção** | `if: github.ref == 'refs/heads/main'` no job `deploy-production`. |

**Resumo:** Este workflow **já está blindado por paths**: só dispara em pushes/PRs que tocam em `goldeouro-player/**` (ou no workflow). Em `main`, faz deploy de produção do player; em `dev`, deploy preview.

---

### 3.3) rollback.yml

| Campo | Valor |
|-------|--------|
| **Nome** | ⚠️ Rollback Automático – Gol de Ouro |
| **Eventos (on:)** | `workflow_run: workflows: ["🚀 Pipeline Principal - Gol de Ouro"], types: [completed]`. |
| **Path filter** | N/A (disparo por conclusão do main-pipeline). |
| **Monorepo / player** | Não usa working-directory para Vercel; usa secrets do projeto. |
| **Step que chama Vercel** | **"🔁 Rollback Frontend (Vercel)"**: `npx vercel ls`, depois `npx vercel promote $PREVIOUS_DEPLOYMENT` para reverter produção. Não faz deploy de código novo. |

**Resumo:** Não é o workflow que “promove” o player para produção; apenas faz rollback (promote de um deployment anterior) quando o **main-pipeline** falha.

---

### 3.4) deploy-on-demand.yml

| Campo | Valor |
|-------|--------|
| **Nome** | Deploy On Demand (Backend Fly.io + Player Vercel) |
| **Eventos (on:)** | **Apenas `workflow_dispatch`** (manual), com input `environment: production`. |
| **Path filter** | Nenhum (disparo manual). |
| **Monorepo / player** | Sim. `working-directory: ./goldeouro-player` na action. |
| **Job que chama Vercel** | `deploy-player-vercel`: **amondnet/vercel-action@v25** com `vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PLAYER }}`, `vercel-args: "--prod"`. |
| **working-directory** | `./goldeouro-player`. |

**Resumo:** Deploy manual (backend Fly + player Vercel). Não é disparado por push; não compete com o pipeline principal em termos de “quem promove prod”.

---

## 4) Conclusão

### Qual workflow está promovendo produção do player hoje?

- **Principal:** **main-pipeline.yml** — no step **"🌐 Deploy Frontend (Vercel)"** (run `npx vercel --prod --yes` em `working-directory: ./goldeouro-player`).  
- **Alternativo (com path filter):** **frontend-deploy.yml** — job **deploy-production** também faz `--prod` no Vercel, mas **só quando há alterações em `goldeouro-player/**`** (ou no próprio workflow).

Ou seja: em prática, **todo push em `main`** passa pelo **main-pipeline** e dispara deploy do player, independentemente de ter mudança no player ou só no backend. O **frontend-deploy** só roda quando há mudanças no player (paths já filtrados).

### Gatilhos

| Workflow            | Gatilho principal                          | Deploy player prod? |
|---------------------|--------------------------------------------|----------------------|
| main-pipeline.yml   | `push` em `main` ou `workflow_dispatch`    | Sim (sempre que o job roda) |
| frontend-deploy.yml | `push` em `main`/`dev` com paths           | Sim em `main` (se paths batem) |
| rollback.yml        | Conclusão do main-pipeline (quando falha)  | Não (só rollback)    |
| deploy-on-demand.yml| `workflow_dispatch`                        | Sim (manual)         |

### Ponto exato que precisa de filter por paths

- **Arquivo:** `.github/workflows/main-pipeline.yml`
- **Onde:** No **evento `on`** e/ou no **job/step** do frontend.

**Opção A – Filter no step (não executar deploy Vercel quando só o backend mudou):**

- Manter `on: push: branches: [ main ]` como está.
- Adicionar um job de “path filter” (ex.: com `dorny/paths-filter`) que define um output quando há mudanças em `goldeouro-player/**`.
- No step **"🌐 Deploy Frontend (Vercel)"**, usar `if: needs.paths.outputs.goldeouro-player == 'true'` (ou equivalente), para que o deploy do player só rode quando houver alterações no player.

**Opção B – Paths no `on.push`** (fazer o workflow só rodar quando houver mudanças em backend ou player; ainda assim o step do Vercel pode ser condicionado a `goldeouro-player/**`):

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'goldeouro-player/**'
      - 'src/**'
      - 'server-fly.js'
      - 'fly.toml'
      - '.github/workflows/main-pipeline.yml'
      # etc. — listar o que deve disparar backend e/ou player
```

**Resumo da conclusão:**

- O workflow que hoje **promove produção do player em todo push em `main`** é o **main-pipeline.yml**, step **"Deploy Frontend (Vercel)"**.
- O **gatilho** é **push em `main`** (e opcionalmente `workflow_dispatch`).
- O **ponto que precisa de filter por paths** é o **main-pipeline.yml**: seja com **paths em `on.push`** (para não rodar quando só backend mudar) ou com **condição no step** (só executar "Deploy Frontend (Vercel)" quando `goldeouro-player/**` tiver mudanças). O **frontend-deploy.yml** já está blindado por paths e pode continuar sendo o canal preferencial para deploy do player em pushes que tocam apenas o player.
