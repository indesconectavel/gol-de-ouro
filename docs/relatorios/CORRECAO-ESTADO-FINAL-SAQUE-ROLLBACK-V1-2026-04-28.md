# CORRECAO ESTADO FINAL SAQUE ROLLBACK V1 - 2026-04-28

## 1. Causa exata da inconsistencia
- O fluxo de `rollbackWithdraw` podia concluir o estorno financeiro (saldo + ledger de rollback) e falhar na etapa de transicao de status do saque.
- Resultado observado: saque ficava em `processando` mesmo com `falha_payout` e `rollback` no ledger.
- Em retries, o risco era pior: sem guarda de idempotencia no saldo, um segundo rollback poderia tentar recompor saldo novamente.

## 2. Arquivo alterado
- `src/domain/payout/processPendingWithdrawals.js`

## 3. Regra corrigida
- `rollbackWithdraw` agora:
  - detecta rollback ja existente por `correlation_id` + `tipo='rollback'` + `referencia` (`saqueId` e `saqueId:fee`);
  - se rollback principal ja existe, **nao reestorna saldo** (idempotencia financeira);
  - cria ledger de rollback somente quando faltar;
  - finaliza saque em status terminal com fallback robusto (`falhou`, `cancelado`, `rejeitado`), preenchendo:
    - `motivo_rejeicao`
    - `processed_at`
    - `updated_at`
    - `mp_payout_status='failed'`
- Auto-heal adicionado no worker:
  - antes de processar pendentes, busca saques `processando` com rollback existente e sem `payout_confirmado`;
  - aplica `rollbackWithdraw` em modo idempotente para corrigir apenas estado final sem duplicar financeiro.

## 4. Risco financeiro
- **Baixo** apos a correcao:
  - elimina risco de saque preso em `processando` apos rollback;
  - elimina risco de dupla recomposicao de saldo em retrigger de rollback;
  - mantem contrato: sem marcar como `processado` sem confirmacao MP.

## 5. Tratamento do saque ja preso em processando
- Nao houve reprocessamento manual de payout.
- O proprio worker passa a auto-curar saques presos com rollback ja registrado, movendo para estado terminal e registrando motivo.
- Para o saque `9612c3c7-0b88-4de1-8617-4de66a3096eb`, a correção esperada e:
  - status terminal (`falhou` preferencial);
  - `motivo_rejeicao` preenchido;
  - `processed_at` preenchido;
  - sem novo `rollback` financeiro duplicado.
