# Deploy final V1.2 — Relatório

**Data:** 2026-03-06  
**Resultado:** **FAIL** (deploy abortado; nenhuma release nova aplicada).

---

## 1) Resumo executivo

O deploy do backend a partir do commit **73de7a39** (V1.2) foi executado via worktree temporária. A imagem foi construída e enviada ao Fly, mas:

1. **Smoke checks do Fly falharam** no machine **payout_worker** (e82794da791108): o process group payout_worker não escuta em 0.0.0.0:8080 (é worker, não HTTP server).
2. O machine **app** (2874551a105768) recebeu a nova imagem e **crashou** com `Error: Cannot find module './withdrawalStatus'` em `processPendingWithdrawals.js`. O commit **73de7a39** **não inclui** o arquivo `src/domain/payout/withdrawalStatus.js` (apenas altera `reconcileProcessingWithdrawals.js` e docs); o build a partir do worktree gerou uma imagem sem esse módulo.
3. O Fly abortou o deploy e liberou os leases; **nenhuma release nova foi aplicada** às machines. Elas permanecem na versão anterior (v313).
4. **Rollback para v305 não foi executado** — não havia nova release em produção para reverter.

---

## 2) Commit exato deployado

- **Alvo:** 73de7a39efafe58e643f1e10207108da9098a63d  
- **Estratégia:** Worktree temporária no commit 73de7a39; `flyctl deploy` executado a partir dessa pasta (TEMP).  
- **Problema:** O commit 73de7a39 altera apenas `reconcileProcessingWithdrawals.js` e relatórios; **não inclui** `withdrawalStatus.js`. O tree nesse commit em `src/domain/payout/` contém apenas `processPendingWithdrawals.js` e `reconcileProcessingWithdrawals.js`. Como `processPendingWithdrawals.js` faz `require('./withdrawalStatus')`, a imagem buildada no worktree ficou sem o módulo e o app crashou.

---

## 3) Estratégia usada para evitar working tree suja

- **Worktree temporária:** `git worktree add <TEMP>/deploy-v12-temp-<ts> 73de7a39`; deploy a partir desse diretório; em seguida `git worktree remove ...`.  
- Assim o deploy usou **apenas** os arquivos do commit 73de7a39, sem alterações locais.  
- O commit em si está **incompleto** para rodar o app (falta `withdrawalStatus.js` no repositório nesse commit).

---

## 4) Release antes / depois

- **Antes:** v313 (imagem deployment-01KK1G1ZJGJRZQ2K21E8VY3C26).  
- **Depois:** **v313** (inalterada). Nenhuma release nova foi aplicada; o Fly abortou e limpou os leases.

---

## 5) Frontend preservado?

- **Sim.** Os gates GET /game e GET /dashboard retornaram 200 antes do deploy. Nenhuma alteração foi feita no Vercel nem no frontend.

---

## 6) Smoke test

- **Não executado** pelo nosso script — o deploy falhou antes (Fly retornou erro).  
- O smoke **do Fly** falhou: (1) payout_worker não escuta em 8080; (2) app crashou com MODULE_NOT_FOUND antes de escutar em 8080.

---

## 7) Logs do reconciler / worker

- Após o abort: logs mostram **app** crashando com `Cannot find module './withdrawalStatus'` e **machine has reached its max restart count of 10**.  
- Causa raiz do crash: commit 73de7a39 não contém `withdrawalStatus.js` em `src/domain/payout/`.

---

## 8) Situação final do financeiro

- Estado **inalterado** em relação ao pré-deploy: 7 saques rejeitados (5 com rollback, 2 históricos/inconclusivos); ledger ok; sem novo bloqueio.  
- O patch V1.2 **não está** em produção.

---

## 9) Houve rollback? Por quê?

- **Não.** O deploy não completou; nenhuma release nova foi aplicada. Rollback para v305 não foi necessário.

---

## 10) PASS / FAIL

**FAIL.**

---

## 11) Financeiro V1 concluído? sim/não

**Não.** O patch V1.2 (reconciler com rollback) não está em produção. Para concluir: fazer um commit que inclua `withdrawalStatus.js` (ou garantir que ele esteja no tree do commit de deploy) e realizar novo deploy; ou ajustar o Fly para que o process group **payout_worker** não exija health check HTTP em 8080 (para evitar falha de smoke no worker).

---

## 12) Próxima ação recomendada

1. **Incluir `withdrawalStatus.js` no commit de deploy:**  
   Verificar se `src/domain/payout/withdrawalStatus.js` está versionado. Se não estiver, fazer commit desse arquivo (no branch hotfix/financeiro-v1-stabilize ou no mesmo commit que contém o patch V1.2). Em seguida, fazer **novo deploy** a partir de um commit que contenha **todos** os arquivos necessários (reconcileProcessingWithdrawals.js, processPendingWithdrawals.js, withdrawalStatus.js).

2. **Fly — payout_worker:**  
   Configurar o process group **payout_worker** para não exigir HTTP em 8080 (ex.: desabilitar `http_service` ou usar `tcp_checks` apenas no grupo **app**), para que o deploy não falhe no smoke do worker.

3. **Após deploy bem-sucedido:**  
   Rodar smoke (GET /health, /game, /dashboard), conferir logs e post-check financeiro conforme combinado.

---

## Artefatos

| Artefato | Caminho |
|----------|----------|
| Relatório | docs/relatorios/FINANCEIRO-V1-DEPLOY-FINAL-2026-03-06.md |
| Gate | docs/relatorios/financeiro-v1-deploy-gate.json |
| Fly antes | docs/relatorios/financeiro-v1-deploy-fly-before.json |
| Resultado | docs/relatorios/financeiro-v1-deploy-result.json |
| Smoke | docs/relatorios/financeiro-v1-deploy-smoke.json |
| Logs | docs/relatorios/financeiro-v1-deploy-logs.json |
| Post-check | docs/relatorios/financeiro-v1-deploy-postcheck.json |
| Rollback | docs/relatorios/financeiro-v1-deploy-rollback.json |
| Script deploy | scripts/financeiro-v1-deploy-final.js |

---

## Saída final

| Pergunta | Resposta |
|----------|----------|
| **PASS ou FAIL** | **FAIL** |
| **Houve rollback?** | **Não** (deploy não completou; rollback não foi necessário). |
| **/game preservado?** | **Sim** (gate 200; nenhuma alteração no frontend). |
| **Commit exato deployado?** | Build e push foram feitos **a partir** do commit 73de7a39; o Fly tentou aplicar a nova imagem mas abortou. O commit 73de7a39 está **incompleto** (falta withdrawalStatus.js). |
| **Financeiro V1 concluído?** | **Não.** |
| **Caminhos** | Relatório: `docs/relatorios/FINANCEIRO-V1-DEPLOY-FINAL-2026-03-06.md`; JSONs: `docs/relatorios/financeiro-v1-deploy-*.json`. |
