# Limpeza auditável da working tree — PAYOUT V1.1

**Data:** 2026-03-06  
**Objetivo:** Deixar o repositório apto para deployar exatamente o commit `0f09038` (patch V1.1) no Fly, sem alterações locais de código indesejadas.

---

## 1) Resumo executivo

- **Gate do commit alvo:** PASS (branch `hotfix/financeiro-v1-stabilize`, HEAD `0f09038`).
- **Limpeza executada:** Restaurado apenas `package.json` do HEAD; docs e scripts read-only preservados.
- **Estado final:** Nenhum arquivo de **código trackado** modificado; restam apenas 3 arquivos de documentação modificados e arquivos untracked (docs/relatorios, scripts, etc.).
- **SAFE TO DEPLOY:** **true** (para o critério do Gate Git do pipeline de Deploy Seguro: ausência de `package.json` ou código sujo em arquivos trackados).

---

## 2) Estado antes

| Item | Valor |
|------|--------|
| Branch | `hotfix/financeiro-v1-stabilize` |
| HEAD | `0f09038` / `0f09038dea8363fd986763107bb07c580a748226` |
| Modificados | 4 arquivos: `package.json`, 3 arquivos em `docs/relatorios/` |
| Staged | Nenhum |
| Untracked | ~178 itens (docs/relatorios, scripts, controllers, 2 arquivos em src/domain/payout) |

**Classificação antes:**
- **Código modificado:** `package.json` (bloqueava o deploy seguro).
- **Docs modificados:** `FINANCEIRO-PATCH-V1-2026-03-05.md`, `PAYOUT-WORKER-PATCH-V1_1-2026-03-06.md`, `PAYOUT-WORKER-PATCH-V1_1-CHECKLIST-2026-03-06.md`.
- **Untracked:** docs, scripts read-only, controllers, `reconcileProcessingWithdrawals.js`, `withdrawalStatus.js`.

Evidência: `docs/relatorios/payout-v1_1-worktree-before.json`.

---

## 3) Ações de limpeza executadas

| # | Ação | Motivo |
|---|------|--------|
| 1 | `git checkout HEAD -- package.json` | Restaurar `package.json` ao estado do commit `0f09038` para que o deploy não inclua alterações locais. Prioridade explícita do procedimento. |

- **Não foi alterado:** Nenhum relatório em `docs/relatorios/`, nenhum script em `scripts/`, e os arquivos do commit `0f09038` (`processPendingWithdrawals.js`, `payout-worker.js`).
- Evidência: `docs/relatorios/payout-v1_1-cleanup-actions.json`.

---

## 4) Estado depois

| Item | Valor |
|------|--------|
| Branch | `hotfix/financeiro-v1-stabilize` |
| HEAD | `0f09038` (inalterado) |
| Modificados | 3 arquivos, todos em `docs/relatorios/` |
| Código trackado modificado | Nenhum |
| `package.json` modificado | Não |

**Confirmação:** Restaram apenas documentos modificados e untracked; nenhum arquivo de código trackado sujo. Evidência: `docs/relatorios/payout-v1_1-worktree-after.json`.

---

## 5) Itens preservados

- **docs/relatorios/** — Todos os relatórios e JSONs preservados (modificados e untracked).
- **scripts/** — Scripts read-only e demais arquivos em `scripts/` preservados (untracked).
- **Arquivos do patch V1.1** — `src/domain/payout/processPendingWithdrawals.js` e `src/workers/payout-worker.js` não foram alterados pela limpeza.

---

## 6) SAFE TO DEPLOY = true

- **Resultado:** **true**
- **Motivo:** O Gate Git do pipeline de Deploy Seguro exige working tree sem `package.json` ou código sujo em arquivos trackados. Após a limpeza, não há `package.json` modificado nem outro código trackado modificado; apenas docs e untracked permanecem.
- **Observação:** Existem arquivos de código **untracked** (ex.: `controllers/adminSaquesController.js`, `src/domain/payout/reconcileProcessingWithdrawals.js`, `withdrawalStatus.js`). Se o deploy no Fly usar apenas o conteúdo versionado (ex.: contexto de build baseado em Git), eles não entram no deploy. Se usar o diretório completo como contexto, verificar se o build ignora esses caminhos ou considerar adicioná-los ao `.dockerignore` se não devessem ser incluídos.

---

## 7) Próxima ação recomendada

**Rerodar o pipeline de DEPLOY SEGURO do V1.1** (passos 0–8), a partir de:

- **PASSO 0** — Gate Vercel (/game, /dashboard).
- **PASSO 1** — Gate Git (branch, HEAD, working tree): deve passar com working tree apenas com docs modificados e untracked.

Não fazer deploy nesta etapa; não alterar frontend, Vercel ou /game.

---

## Artefatos

| Arquivo | Descrição |
|---------|-----------|
| `docs/relatorios/payout-v1_1-worktree-before.json` | Snapshot antes da limpeza (branch, HEAD, modificados, classificação). |
| `docs/relatorios/payout-v1_1-worktree-after.json` | Snapshot depois (modified, confirmação). |
| `docs/relatorios/payout-v1_1-cleanup-actions.json` | Ações de limpeza executadas e arquivos não tocados. |
