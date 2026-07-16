# PE.2F — Atomicidade e Consistência (Claim Deposit)



## Perguntas obrigatórias



### O fluxo atual é transacional?



**Parcialmente.**



| Caminho | Transacional? |

|---------|----------------|

| RPC `claim_and_credit_approved_pix_deposit` | **Sim** — função SQL GDO |

| JS fallback (`claimApprovedPixDepositJsFallback`) | **Não** — sequência claim → ledger → wallet sem BEGIN/COMMIT único |



### Se não for, qual mecanismo evita saldo sem ledger?



No JS fallback a **ordem é ledger antes de wallet**. Falha de wallet após ledger bem-sucedido deixa ledger sem crédito de saldo (janela conhecida pré-PE.2F). O inverso (saldo sem ledger) é mitigado por:



1. Claim de linha (`status ≠ approved`) — no máximo um claim vencedor

2. Idempotência por `correlation_id` no ledger

3. Dedup de `createLedgerEntry`



### O adapter mantém a mesma garantia?



**Sim.** `GolDeOuroDepositClaimAdapter.claimApprovedDeposit` delega ao legado homologado — mesma RPC, mesmo fallback, mesma ordem.



### Existe janela de dupla execução?



| Cenário | Proteção |

|---------|----------|

| Dois webhooks concorrentes | Claim `UPDATE … WHERE status ≠ approved` + ledger correlation |

| Retry após crédito | Ledger idempotent → `credited: false, idempotent: true` |

| Flag ON + OFF no mesmo request | Impossível — bridge escolhe um caminho |



### Existe condição de corrida?



Sim, no JS fallback (pré-existente): entre ledger append e wallet update. **Não introduzida por PE.2F.**



RPC path: tratado no banco.



### O port permite implementação transacional futura?



**Sim.** `DepositClaimPort.claimApprovedDeposit` pode ser implementado com transação única (RPC, unit of work, outbox). `claimApprovedDepositOrchestrated` existe para adapters granulares futuros sem acoplar o core ao schema GDO.



## Regressão?



**Nenhuma** com `PE_DEPOSIT_CLAIM_PORT_ENABLED=false` (default produção).

