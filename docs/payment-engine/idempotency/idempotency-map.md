# PE.2G — Idempotency Map (Auditoria)



## Escopo



Mapa read-only dos pontos de idempotência/duplicidade no ecossistema Payment Engine + finance (pré-extração B2).



## Hot paths de depósito (B2 primário)



| Local | Mecanismo | Persistência |

|-------|-----------|--------------|

| `finance/webhooks/paymentWebhookIdempotency.js` | `checkSupabaseDepositIdempotency` — status `approved` em `pagamentos_pix` | Supabase GDO |

| `finance/webhooks/processPaymentWebhook.js` | MP + Asaas prod credit — chama check acima | via função |

| `payment-engine/adapters/goldeouro/GolDeOuroWebhookAdapter.js` | `checkDepositIdempotency` | delegava finance |

| `finance/deposit/claimApprovedPixDeposit.js` | ledger `correlation_id` + claim row + RPC | Supabase / RPC |

| `finance/webhooks/paymentWebhookDryRunStore.js` | Map in-memory `provider:eventId` | memória |

| `finance/webhooks/paymentWebhookControlledCreditStore.js` | Set de keys in-memory | memória |



## Withdraw / payout (fora do corte PE.2G runtime — documentado)



| Local | Mecanismo |

|-------|-----------|

| `domain/payout/processPendingWithdrawals.js` | `correlation_id` ledger, locks, `idempotencyKey` PSP |

| `finance/webhooks/processAsaasTransferWebhook.js` | status terminal + ledger dedupe |

| `finance/webhooks/asaasTransferAuthorization.js` | replay idempotente |



## PSP keys (request idempotency, não store interno)



| Provider | Campo |

|----------|-------|

| Asaas / MP Payment & Payout | `idempotencyKey` / `X-Idempotency-Key` |



## Correlação



- Depósito: `payment_id` / `external_id` ↔ `ledger_financeiro.correlation_id`

- Saque: `saques.correlation_id` ↔ ledger tipo saque/rollback



## Pós-PE.2G (alvo)



```

flag OFF → checkSupabaseDepositIdempotency (legado)

flag ON  → IdempotencyStore → GolDeOuroIdempotencyStore → legado

```

