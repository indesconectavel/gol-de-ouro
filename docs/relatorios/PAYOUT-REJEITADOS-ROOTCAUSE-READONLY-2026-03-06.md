# Root cause: Saques processando → rejeitado — Auditoria READ-ONLY

**Data:** 2026-03-06  
**Objetivo:** Identificar quem rejeitou, por quê, se o saldo foi devolvido, se houve rollback/ledger e se há inconsistência financeira.

---

## 1) Resumo executivo

- **7 saques** em status `rejeitado` foram analisados.
- **5 saques** foram rejeitados pelo **worker** (processPendingWithdrawals) com motivo **"payout falhou"** em 2026-03-06 (11:56–11:58 UTC). Para todos há **rollback no ledger** (falha_payout + rollback) e saldo devolvido.
- **1 saque** foi rejeitado pelo **reconciler** (reconcileProcessingWithdrawals) com motivo **"timeout_reconciliacao"** em 2026-03-03. **Não há rollback** no código do reconciler; não há linhas de ledger para esse saque na consulta por `referencia` = id do saque. Risco: saldo debitado na criação e não devolvido.
- **1 saque** com motivo = mensagem da API MercadoLibre (erro de provedor). Ledger vazio na busca por referencia; classificado como **inconclusivo**.

---

## 2) Quem rejeitou / causa mais provável

| Origem        | Motivo (exemplos) | Quantidade | Evidência (JSON) |
|---------------|--------------------|------------|------------------|
| **Worker**    | `payout falhou`    | 5          | status-transition: `quem_rejeitou_inferido: worker_ou_webhook`; ledger com `falha_payout` + `rollback` |
| **Reconciler**| `timeout_reconciliacao` | 1   | status-transition: `quem_rejeitou_inferido: reconciler`; sem ledger/rollback |
| **Worker/API**| Mensagem MercadoLibre | 1  | motivo = texto da API; ledger vazio (inconclusivo) |

**Causa mais provável da rejeição dos 5 que estavam em processando:**  
O **worker** (processPendingWithdrawals) tentou pagar via `createPixWithdraw`; o provedor retornou falha; o worker chamou `rollbackWithdraw` e marcou o saque como rejeitado com motivo **"payout falhou"**. A transição ocorreu em 2026-03-06 entre 11:56 e 11:58 UTC (`updated_at` / `processed_at`).

O **reconciler** rejeitou 1 saque por **timeout** (> 30 min em processando) em 2026-03-03; o reconciler **não chama** `rollbackWithdraw`, apenas atualiza o status para rejeitado.

---

## 3) Saldo foi devolvido?

- **Sim, para os 5 rejeitados pelo worker:** há registro de `rollback` no ledger (valor 10 por saque) e o fluxo `rollbackWithdraw` em processPendingWithdrawals devolve o valor ao saldo do usuário.
- **Não confirmado para 1 saque (timeout_reconciliacao):** reconciler não executa rollback; não há linhas de ledger para esse saque na auditoria. Se o saldo foi debitado na criação do saque, esse usuário pode não ter recebido a devolução.
- **Inconclusivo para 1 saque:** (motivo = mensagem API); ledger vazio na busca por referencia.

**Conclusão:**  
- **Rollback do saldo:** **NÃO OK** — existe pelo menos 1 rejeição (reconciler) sem rollback no código; possível débito sem devolução.

---

## 4) Ledger ficou inconsistente?

- **5 saques (payout falhou):** ledger contém `falha_payout` e `rollback` para o mesmo saque; **não** há `withdraw_request` na consulta por `referencia` = id (pode ser ambiente/schema ou criação anterior ao uso de withdraw_request). Para o fluxo de rejeição do worker, o ledger está **consistente** (falha + devolução registrada).
- **1 saque (timeout_reconciliacao):** nenhuma linha de ledger encontrada para o id do saque. Se houve débito na criação, falta crédito de rollback → **possível inconsistência**.
- **1 saque (erro API):** ledger vazio → **inconclusivo**.

**Conclusão:**  
- **Ledger:** **VERIFICAR** — 5 com rollback OK; 1 sem rollback (reconciler) e sem linhas de ledger; 1 inconclusivo.

---

## 5) Ainda existe bloqueio financeiro real?

- Os **5** saques rejeitados pelo worker tiveram rollback; não há bloqueio para esses.
- O **1** saque rejeitado por timeout do reconciler pode representar **bloqueio** se o saldo foi debitado na criação e nunca devolvido. O usuário afetado (mesmo dos 5) tem saldo atual 203 na amostra; sem histórico completo não é possível afirmar se 203 já reflete ou não a devolução do saque por timeout.

---

## 6) V1 pode seguir sem patch adicional?

- **Operacionalmente:** o worker e o fluxo de rollback estão corretos para o caso “payout falhou”. O count=0 após as rejeições é esperado.
- **Financeiro:** o reconciler não devolve o saldo ao rejeitar por timeout (e outros motivos). Para encerrar a etapa financeira V1 sem risco, é recomendável um **patch mínimo** que chame rollback (ou equivalente) quando o reconciler marcar saque como rejeitado.

---

## 7) Patch V1.2 mínimo recomendado (sem implementar)

- **Objetivo:** Garantir que, quando o **reconciler** marcar um saque como rejeitado (timeout_reconciliacao, valor_invalido_reconcile, pix_invalido_reconcile, erro_provedor_reconcile), o saldo seja devolvido e o ledger registre o rollback.
- **Ação:** Em `reconcileProcessingWithdrawals.js`, antes ou após cada `updateSaqueStatus(..., REJECTED, motivo_rejeicao: ...)`, chamar `rollbackWithdraw` com os dados do saque (usuario_id, amount, fee, correlation_id, motivo_rejeicao), de forma idempotente (ex.: verificar se já existe ledger tipo `rollback` para esse saque).
- **Observação:** O worker já faz rollback ao rejeitar; apenas o reconciler precisa ser alinhado.

---

## Respostas finais

| Pergunta | Resposta |
|----------|----------|
| **Causa mais provável da rejeição** | Worker (provedor retornou falha) para os 5; reconciler (timeout) para 1; erro de API para 1. |
| **Rollback do saldo** | **NÃO OK** — 1 rejeição do reconciler sem rollback; 5 do worker com rollback. |
| **Ledger** | **VERIFICAR** — 5 OK (falha_payout + rollback); 1 ausente/inconsistente (reconciler); 1 inconclusivo. |
| **GO / NO-GO para encerrar etapa financeira V1** | **NO-GO** até tratar rejeições do reconciler (rollback ou correção manual do 1 saque por timeout). Após patch V1.2 ou correção manual, **GO**. |

---

## Artefatos

| Artefato | Caminho |
|----------|----------|
| Relatório | docs/relatorios/PAYOUT-REJEITADOS-ROOTCAUSE-READONLY-2026-03-06.md |
| Transição de status | docs/relatorios/payout-rejeitados-status-transition.json |
| Saldo / rollback | docs/relatorios/payout-rejeitados-saldo-rollback.json |
| Ledger | docs/relatorios/payout-rejeitados-ledger-check.json |
| Logs (padrões) | docs/relatorios/payout-rejeitados-logs.json |
| Consistência | docs/relatorios/payout-rejeitados-consistencia.json |
| Script | scripts/payout-rejeitados-rootcause-readonly.js |
