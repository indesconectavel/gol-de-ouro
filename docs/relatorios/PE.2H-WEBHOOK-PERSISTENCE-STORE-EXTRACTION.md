# PE.2H — Webhook Persistence Store Extraction™



## Veredito: PASS COM RESSALVAS



| Campo | Valor |

|-------|-------|

| Gate | PE.2H |

| Bloqueador | **B10** |

| Data | 2026-07-14 |

| Flag | `PE_WEBHOOK_STORE_PORT_ENABLED=false` |

| Produção | **Intacta** |

| PE.2C | **NO-GO** |



### Ressalvas



1. Smoke/verify **não executados** (shell `LanguagePrimitives`) → B10 **não certificado por testes**.

2. Não existe tabela `webhook_events` no GDO; store concreto = DryRun in-memory (F4.5) atrás do port.

3. `PaymentWebhookControlledCreditStore` e raw de payout (`asaas_payout_raw`) permanecem fora deste corte.



Scripts: `pe2h-webhook-store-smoke.mjs` · `verify-pe2h-webhook-store-port.mjs`



---



## Objetivo cumprido (arquitetural)



Core `webhookStore.js` sem Supabase/schema. Persistência lifecycle em `GolDeOuroWebhookStore`. IdempotencyStore (PE.2G) permanece separado.



```text

Flag OFF → DryRun legado (idêntico)

Flag ON  → WebhookStorePort → GolDeOuroWebhookStore → DryRun backing

```



## Entregáveis



Todos em `docs/payment-engine/webhook-store/` + relatório + snapshot + scripts.



## Package Readiness



- Ports **7.0** · Overall **~6.1** · banda **QUASE_PRONTO**

- B10 removido da lista de blockers PE.2C

- Restam: **B7**, PB-01, PB-02, domain payout, worker bypass, MP coupling, staging deploy



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** |

| Produção / Staging / Banco / Schema / Deploy / Secrets? | **NÃO** |

| Regras financeiras alteradas? | **NÃO** |

| Fluxo legado preservado? / Flag default false? | **SIM** |

| Core sem Supabase / sem schema GDO? | **SIM** |

| WebhookStorePort / GolDeOuroWebhookStore? | **SIM** |

| IdempotencyStore preservado / responsabilidades separadas? | **SIM** |

| Consistência / Idempotência / Compat? | **SIM** |

| Smoke / Verify PASS? | **NÃO EXECUTADO** |

| Rollback disponível? | **SIM** |

| B10 eliminado arquiteturalmente? | **SIM** |

| B10 certificado por testes? | **NÃO** |

| Package Readiness pós-PE.2H | **~6.1 / ports 7.0** |

| Risco residual | DryRun-only store; ControlledCredit/payout raw fora; smoke pending |

| Bloqueadores restantes | B7, PB-01…05 |

| Próximo gate | **B7** isolamento core→finance |

| PE.2C autorizado? | **NO-GO** |

