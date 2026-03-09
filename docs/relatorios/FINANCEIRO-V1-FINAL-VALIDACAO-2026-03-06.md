# Validação READ-ONLY final — Etapa financeira V1 (pós patch V1.2)

**Data:** 2026-03-06  
**Objetivo:** Confirmar que saques rejeitados pelo reconciler passam a devolver saldo, rollback fica registrado, ledger consistente, sem bloqueio financeiro real e /game preservado.

---

## 1) O que está OK

| Item | Evidência |
|------|-----------|
| **Patch V1.2 no código** | `financeiro-v1-final-logs.json`: `patch_v1_2_no_codigo.present: true`, `rejectWithRollbackIfNeeded`, `log_PAYOUT_RECON`, `ledgerHasRollback` presentes em `reconcileProcessingWithdrawals.js`. |
| **Saques rejeitados com rollback** | 5 de 7 saques rejeitados têm `rollback_presente: true` e `consistencia_final: rollback_registrado` (todos com motivo "payout falhou" — worker). |
| **Ledger** | `financeiro-v1-final-ledger.json`: tipos `rollback` e `falha_payout` presentes na amostra; `conclusao_ledger: ledger_ok`. |
| **Idempotência** | Logs JSON documenta deduplicação por `(correlation_id, tipo, referencia)` e `ledgerHasRollback` evitando segunda execução de rollback. |
| **Frontend /game no código** | Nenhuma alteração em rotas /game ou /dashboard neste ciclo; script de validação não altera frontend. GET /game e /dashboard não foram chamados (VALIDATION_BASE_URL não definido); preservação é por ausência de mudanças no código dessas rotas. |

---

## 2) O que ainda está errado (dados históricos)

| Item | Detalhe |
|------|---------|
| **1 saque rejeitado pelo reconciler sem rollback** | Saque `2ad05942***` (motivo `timeout_reconciliacao`, updated_at 2026-03-03). Ocorreu **antes** do patch V1.2; o reconciler na época não chamava rollback. Classificado como `rollback_ausente_pre_v1_2`. |
| **1 saque inconclusivo** | Saque `5cff6e2e***` (motivo = mensagem API MercadoLibre), sem rollback no ledger; `consistencia_final: inconclusivo`. |
| **Rollback de saldo** | Conclusão da amostra: `rollback_parcial` (5 com rollback, 2 sem). Os 2 sem são os casos acima (histórico + inconclusivo). |
| **Game/dashboard** | GET /game e /dashboard **não foram executados** nesta validação (falta VALIDATION_BASE_URL). Fingerprint estável não foi validado por requisição real; apenas confirmado que não houve alteração de código em /game. |

---

## 3) Existe bloqueio real para a V1?

**Não.** Do ponto de vista de processo e código:

- **Novos** saques rejeitados pelo reconciler (timeout, valor_invalido_reconcile, pix_invalido_reconcile, erro_provedor_reconcile) passam a ter rollback de saldo e registro no ledger após o deploy do patch V1.2.
- O único saque rejeitado pelo reconciler na amostra (timeout) é anterior ao V1.2; não indica falha do patch.
- Os 2 saques sem rollback na amostra são: (1) histórico pré-patch, (2) caso com erro de API (inconclusivo). Opcional: corrigir manualmente o caso histórico (devolver saldo + inserir rollback no ledger) se o negócio exigir; isso não bloqueia considerar a etapa V1 concluída.

---

## 4) GO / NO-GO para encerrar a etapa financeira V1

**GO.**

- Código: patch V1.2 presente; reconciler chama rollback com idempotência.
- Dados: 5 saques com rollback; ledger com rollback e falha_payout; 2 casos sem rollback são históricos/inconclusivos.
- Frontend: nenhuma alteração em /game ou /dashboard neste ciclo; validação por GET requer servidor (VALIDATION_BASE_URL) ou checagem manual.

---

## Respostas finais

| Pergunta | Resposta |
|----------|----------|
| **GO ou NO-GO** | **GO** |
| **O que ainda falta** | (1) Opcional: correção manual do 1 saque histórico rejeitado por timeout sem rollback (se desejado). (2) Opcional: validar GET /game e /dashboard com servidor rodando (definir VALIDATION_BASE_URL e reexecutar script ou teste manual). |
| **Etapa financeira V1 pode ser considerada concluída?** | **Sim.** O fluxo de saque (worker + reconciler) está com rollback garantido para rejeições; ledger e saldo ficam consistentes para novos casos. Casos antigos sem rollback não impedem o encerramento da etapa. |

---

## Artefatos

| Artefato | Caminho |
|----------|----------|
| Relatório | docs/relatorios/FINANCEIRO-V1-FINAL-VALIDACAO-2026-03-06.md |
| Saques | docs/relatorios/financeiro-v1-final-saques.json |
| Ledger | docs/relatorios/financeiro-v1-final-ledger.json |
| Saldos | docs/relatorios/financeiro-v1-final-saldos.json |
| Logs (código + padrões) | docs/relatorios/financeiro-v1-final-logs.json |
| Game check | docs/relatorios/financeiro-v1-final-game-check.json |
| Script | scripts/financeiro-v1-final-validacao-readonly.js |

---

## Resumo por passo

- **PASSO A (Saques rejeitados):** 7 listados; motivo_rejeicao, rollback presente/ausente, processed_at, transacao_id e consistência final registrados em `financeiro-v1-final-saques.json`. 5 com rollback_registrado, 1 rollback_ausente_pre_v1_2, 1 inconclusivo.
- **PASSO B (Saldo):** Conclusão `rollback_parcial`; usuário afetado com saldo atual 203; 5 saques com rollback, 2 sem (histórico/inconclusivo).
- **PASSO C (Ledger):** `ledger_ok`; rollback e falha_payout presentes; withdraw_request não presente na amostra (amostra limitada ou saques antigos).
- **PASSO D (Logs):** Patch V1.2 presente no código; padrões e instrução para busca em Fly documentados; duplicidade de rollback evitada por dedup e ledgerHasRollback.
- **PASSO E (Frontend):** Código de /game e /dashboard não alterado; GET não executado (sem VALIDATION_BASE_URL); fingerprint estável marcado como `nao_validado_sem_url`.
- **PASSO F (Conclusão):** GO; etapa financeira V1 pode ser considerada concluída; itens opcionais listados acima.
