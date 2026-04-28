# CORRECAO UPDATE STATUS TERMINAL SAQUE V1 (2026-04-28)

## Objetivo
Corrigir o cenário em que o auto-heal identifica saque com rollback existente, mas não consegue finalizar o status terminal.

## Causa provável
- O fluxo de auto-heal chegava até a chamada de rollback/status, porém faltava visibilidade detalhada das tentativas de update por status terminal.
- Em ambientes com constraints/schema diferentes, a tentativa de update podia falhar sem trilha suficiente para identificar se a falha era por:
  - status não permitido no CHECK;
  - coluna não disponível (ex.: `mp_payout_status`);
  - outra rejeição do banco.

## Alterações aplicadas (escopo mínimo)
- Arquivo: `src/domain/payout/processPendingWithdrawals.js`

### 1) `setSaqueTerminalStatus` robusto e observável
- Passa a tentar status em ordem canônica:
  1. `falhou`
  2. `cancelado`
  3. `rejeitado`
- Loga cada tentativa com:
  - status tentado
  - erro `code`
  - erro `message`
  - erro `details`
  - erro `hint`
- Para cada status:
  - tenta update com `mp_payout_status = 'failed'`;
  - se falhar por problema de schema/coluna, tenta fallback sem `mp_payout_status`.
- Retorno detalhado:
  - `success`
  - `statusApplied`
  - `attempts`
  - `lastError`

### 2) Auto-heal em modo `statusOnly` quando rollback já existe
- No caminho de auto-heal (onde já existe rollback e não há `payout_confirmado`):
  - chama `rollbackWithdraw` com `statusOnly: true`;
  - força `amount: 0` e `fee: 0` nesse caminho.
- Efeito:
  - não cria novo ledger;
  - não altera saldo;
  - não chama payout;
  - apenas tenta fechamento de status terminal.
- Log adicional:
  - retorno completo de `rollbackWithdraw` por saque (`[AUTO-HEAL] Retorno rollbackWithdraw`).

## Garantias preservadas
- Sem alteração de depósito.
- Sem alteração de gameplay/frontend.
- Sem reprocessamento de payout.
- Sem novo estorno financeiro no caminho de auto-heal status-only.

## Risco financeiro
- Baixo.
- Mudança focada em fechamento operacional de status e observabilidade.
- Sem mudanças em cálculo financeiro, sem débito/crédito adicional e sem novas integrações externas.

## Validações locais
- `node --check src/domain/payout/processPendingWithdrawals.js` deve passar.
- Diff restrito ao arquivo de domínio de payout + este relatório.
