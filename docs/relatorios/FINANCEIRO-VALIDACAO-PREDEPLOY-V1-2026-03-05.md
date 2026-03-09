# Validação pré-deploy V1 — Financeiro (READ-ONLY)

**Data:** 2026-03-05  
**Modo:** READ-ONLY (sem deploy, sem alterar lógica).  
**Objetivo:** Provar que o patch cobre saques presos, ledger obrigatório, finalização com processed_at/transacao_id e idempotência.

---

## 1. Resumo do que será validado em produção

Após o deploy do commit **80215a4** (patch V1), em produção deve ser validado:

| Item | Como validar |
|------|-----------------------------|
| **Saques presos** | Worker passa a buscar status `pendente` e `processando`; os 5 saques presos devem ser reprocessados (payout ou rejeição com rollback). |
| **Ledger obrigatório** | Todo novo POST /api/withdraw/request gera uma linha em `ledger_financeiro` com `tipo: withdraw_request`, `valor` negativo e `referencia: saqueId`. Se o insert do ledger falhar, o saque é revertido (rollback) e a API retorna 500. |
| **Finalização** | Sucesso do payout → saque com `status: concluido`, `processed_at` e `transacao_id` preenchidos. Erro → `status: rejeitado`, `motivo_rejeicao` e saldo restituído. |
| **Idempotência** | Saques já com status `concluido` ou `rejeitado` não são reprocessados pelo worker. |
| **Logs** | Logs contêm `[PAYOUT] saqueId` e `[LEDGER] referencia` (apenas 8 caracteres, sem tokens). |

---

## 2. Gates de segurança

- **Backup:** Fazer backup das tabelas `saques` e `ledger_financeiro` antes do deploy.
- **Rollback:** Commit de rollback conhecido: **80215a4** (reverter com `git revert 80215a4` ou deploy da release anterior).
- **Canário:** Se possível, validar em uma instância ou ambiente de staging antes de aplicar a todas.
- **Nenhum gate foi executado nesta validação (read-only).**

---

## 3. Checklist pós-deploy (para o próximo prompt)

- [ ] GET /health e GET /api/monitoring/health retornam 200.
- [ ] POST /api/withdraw/request (com auth) cria saque e uma linha no ledger com `tipo = withdraw_request` e valor negativo.
- [ ] Worker processa saques em `processando`; logs mostram `[PAYOUT] saqueId` e `[LEDGER] referencia`.
- [ ] Saques concluídos com sucesso têm `processed_at` e `transacao_id` preenchidos.
- [ ] Saques que falham no payout ficam `rejeitado` com `motivo_rejeicao` e saldo restituído.
- [ ] Script `ciclo1-saques-presos` (ou equivalente) mostra 0 presos em processando > 30 min após alguns ciclos do worker.
- [ ] Nenhuma alteração em rotas /game, player ou frontend.

---

## 4. Rollback pronto

- **Commit do patch:** `80215a4` (curto) / `80215a41f610223d593abd67df45a6abf5a0e88d` (completo).
- **Reverter:** `git revert 80215a4` e novo deploy, ou deploy da release anterior no Fly.
- **Verificação pós-rollback:** POST /api/withdraw/request e worker voltam ao comportamento anterior (ledger com tipo saque/taxa; worker só busca pendente).

---

## 5. Caminhos exatos dos anexos JSON

| Anexo | Caminho |
|-------|---------|
| Git status | `docs/relatorios/predeploy-git-status.json` |
| Diff summary | `docs/relatorios/predeploy-diff-summary.json` |
| Simulate logic checks | `docs/relatorios/predeploy-simulate-logic-checks.json` |

---

## 6. Resultado da checagem lógica local

O script `scripts/predeploy-validate-withdraw-patch-readonly.js` executou as verificações por string nos arquivos alterados. Resultado em **predeploy-simulate-logic-checks.json**:

- **overall:** pass  
- Todos os itens abaixo com **pass: true**:
  - server-fly.js: tipo `withdraw_request` no ledger
  - server-fly.js: valor negativo (-requestedAmount)
  - server-fly.js: rollback quando ledger falha
  - processPendingWithdrawals: select inclui processando
  - processPendingWithdrawals: sucesso → concluido + processed_at + transacao_id
  - processPendingWithdrawals: erro → rejeitado + motivo_rejeicao
  - processPendingWithdrawals: idempotência (ignora concluido/rejeitado)
  - Log [PAYOUT] saqueId presente
  - Log [LEDGER] referencia presente (worker e server-fly.js)

---

*Validação executada em modo READ-ONLY. Nenhum deploy foi realizado.*
