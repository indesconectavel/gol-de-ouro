# PE.2H — WebhookStorePort Contracts



## WebhookStorePort



Path: `src/payment-engine/ports/WebhookStorePort.js`



| Método | Papel |

|--------|-------|

| `registerReceived` | Registra recebimento |

| `findByEventId` / `findByProviderEvent` | Consulta |

| `exists` | Existência |

| `markProcessing` | Em processamento |

| `markProcessed` | Concluído (equivale DryRun.markProcessed) |

| `markFailed` | Falha (inclui timeout via errorCode) |

| `recordRetry` | Incrementa retry |



## Status oficiais (PE.2H.1)



`received` | `processing` | `processed` | `failed`



**Não existe** status `TIMEOUT`.



## Timeout — Opção B (oficial)



```text

status:          failed

lastErrorCode:   TIMEOUT

metadata.reason: TIMEOUT (opcional)

```



## Separação PE.2G



| Contrato | Responsabilidade |

|----------|------------------|

| IdempotencyStore | Reserva / duplicidade financeira |

| WebhookStorePort | Rastreabilidade / ciclo de vida do evento |



## Modelos



`src/payment-engine/types/WebhookStoreRecord.js` — input + record + `errorCode` preservado na normalização.

