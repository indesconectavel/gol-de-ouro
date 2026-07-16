# Current Flow — Payout (pré/pós PE.2J)



## Antes (PB-01)



```text

worker / PaymentEngine / admin

  → domain/payout/processPendingWithdrawals

    → Supabase (saques, ledger_financeiro, …)

    → PSP providers (Asaas / MP / Celcoin)

```



Core da Payment Engine reexportava withdraw via `financeLegacySurface` → `domain/payout`.



## Depois (PE.2J)



```text

Flag OFF (default / produção)

  PaymentEngine.withdraw / scheduler

    → payoutBoundaryBridge

      → domain/payout  (idêntico)



Flag ON (shadow / HITL)

  PaymentEngine.withdraw / scheduler

    → payoutBoundaryBridge

      → core/payout (ports only)

        → PayoutStorePort / PayoutRecoveryPort

          → GolDeOuroPayoutAdapter

            → domain/payout / asaasPayoutRecovery

```



## Preservado (não alterado neste gate)



- `src/workers/payout-worker.js` → ainda `domain/payout` direto (**PB-02**)

- Regras financeiras, PIX, wallet, ledger, fila, schema, Fly, Actions

- `WithdrawalPort` (leitura find/list — PE.2B)

- Webhooks Asaas transfer ainda podem importar `domain/payout` em `finance/` (fora do Core)



## Ports



| Port | Papel |

|------|--------|

| WithdrawalPort | Leitura (findById, listByAccount) |

| PayoutStorePort | processPending, ledger, rollback, admin |

| PayoutRecoveryPort | reconcile Asaas pending/single |

