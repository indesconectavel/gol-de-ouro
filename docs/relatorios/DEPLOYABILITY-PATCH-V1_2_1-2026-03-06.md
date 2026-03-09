# Patch de deployabilidade V1.2.1 — pós-FAIL deploy final V1.2

**Data:** 2026-03-06  
**Objetivo:** Corrigir MODULE_NOT_FOUND (withdrawalStatus.js) e documentar separação app/worker no Fly para evitar smoke fail no payout_worker.

---

## 1) Arquivos alterados

- `src/domain/payout/withdrawalStatus.js` — Adicionado ao repositório (antes untracked).
- `fly.toml` — Comentários explicativos (process groups; HTTP só para app).

Nenhum outro arquivo de código foi alterado. Nenhuma alteração em frontend, Vercel ou /game.

---

## 2) Diff resumido

**withdrawalStatus.js**  
Novo arquivo versionado (51 linhas). Exporta constantes de status (PENDING, PROCESSING, COMPLETED, REJECTED, CANCELED), normalizeWithdrawStatus, isFinal, isPending. Já era usado por processPendingWithdrawals.js e reconcileProcessingWithdrawals.js via require('./withdrawalStatus'); sem ele, a imagem do deploy (baseada só no commit) gerava MODULE_NOT_FOUND.

**fly.toml**  
Inclusão de comentário acima de [processes]: explicar que apenas app expõe HTTP (8080) e que payout_worker é job em loop e não deve receber health check HTTP. Inclusão de comentário acima de [[services]]: reforçar que o serviço e os http_checks aplicam-se só ao process group app; máquinas do worker não recebem roteamento nem checks (evita smoke fail no deploy). Nenhuma alteração de comportamento: processes = ["app"] já estava definido; apenas documentação explícita.

---

## 3) Qual problema do deploy foi resolvido

1. **MODULE_NOT_FOUND:** O commit deployado (73de7a39) não continha withdrawalStatus.js. O arquivo existia apenas como untracked na working tree. O build no Fly usou apenas os arquivos do commit, então a imagem não tinha o módulo e o Node falhava ao carregar processPendingWithdrawals.js / reconcileProcessingWithdrawals.js. **Resolvido:** withdrawalStatus.js foi adicionado e commitado; o próximo deploy incluirá o arquivo na imagem.

2. **Smoke fail no payout_worker:** O Fly chegou a rodar smoke check na machine do payout_worker, que não escuta em 8080, resultando em falha. O fly.toml já restringe o serviço HTTP a processes = ["app"]. **Mitigação:** Comentários no fly.toml deixam explícita a intenção (HTTP e checks só para app). Se o Fly ainda aplicar smoke a todas as machines, o checklist recomenda deploy em dois passos (--process-groups app e depois --process-groups payout_worker) ou verificação na documentação Fly de como excluir o worker dos smoke checks.

---

## 4) Por que isso não afeta /game

As mudanças estão apenas em: Backend (src/domain/payout/withdrawalStatus.js e comentários em fly.toml). Não há alteração em rotas ou handlers do frontend, projeto ou deploy Vercel, rotas ou lógica de /game, assets do player ou qualquer código do jogo. O módulo withdrawalStatus é usado somente pelo fluxo de saques (processamento pendente e reconciliação) no backend; o jogo e o player continuam inalterados.

---

## 5) Commit SHA(s)

- Commit 1: bdcd8b2 (bdcd8b2413a42158f4757b68e46159937f301eba) — chore(payout): add withdrawalStatus.js for V1.2 deploy (fix MODULE_NOT_FOUND)
- Commit 2: 55c5cb8 (55c5cb80e5d3550baced5ea5752e9bc2d1d7768f) — docs(fly): document process groups and HTTP-only-for-app (V1.2.1 deployability)

Deploy deve ser feito a partir do último commit (55c5cb8), que contém o tree com withdrawalStatus.js e fly.toml documentado.

---

## 6) Rollback plan

Se o deploy falhar ou houver regressão: reverter os dois commits (git revert --no-commit 55c5cb8 bdcd8b2 e depois git commit -m "revert: deployability patch V1.2.1"), ou fazer deploy do commit anterior a bdcd8b2 (ex.: 73de7a39). Atenção: fazer deploy de 73de7a39 sem withdrawalStatus.js recolocará o MODULE_NOT_FOUND; o rollback de código é reverter para o estado anterior ao patch, e o rollback de deploy no Fly é apontar para a release/imagem anterior (pré-V1.2.1).

Se apenas o smoke do worker falhar no Fly: manter os commits; fazer deploy em dois passos: primeiro fly deploy --process-groups app, depois fly deploy --process-groups payout_worker (e, se a CLI permitir, considerar desabilitar smoke apenas no segundo deploy, conforme documentação Fly).

Comandos de rollback: fly releases list para ver release atual; fly releases rollback para voltar à release anterior (conforme documentação Fly).

---

## Resumo

Arquivos alterados: src/domain/payout/withdrawalStatus.js (adicionado), fly.toml (comentários). Problemas abordados: (1) MODULE_NOT_FOUND por falta de withdrawalStatus.js no commit; (2) documentação da separação app/worker no Fly para evitar smoke indevido no payout_worker. Sem impacto em: frontend, Vercel, /game, lógica de depósitos. Commit mínimo para deploy: 55c5cb8 (ou o branch que o contenha).
