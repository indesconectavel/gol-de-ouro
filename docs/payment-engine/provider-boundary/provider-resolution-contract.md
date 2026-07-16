# PE.2L.1 — Provider Resolution Contract



Contrato oficial de metadados de resolução de PSP na Indesconectável Payment Engine™.



## Campos



| Campo | Tipo | Significado |

|-------|------|-------------|

| `requestedProvider` | string | Provider solicitado pela configuração efetiva (`PAYMENT_PROVIDER` / `PAYOUT_PROVIDER` ou default arquitetural via `PRIMARY_PSP`). |

| `effectiveProvider` | string | Provider realmente selecionado após gates Asaas / mock / registry. |

| `fallbackApplied` | boolean | `true` se o fallback controlado foi aplicado (`effective` ≠ resultado do pedido por causa de gate). |

| `legacyFallbackApplied` | boolean | **Mesmo fato** que `fallbackApplied`. Nome legado homologado (= significado **A**). |

| `fallbackReason` | string\|null | Motivo curto de observability (`ASAAS_GATE_NOT_RESOLVABLE`, etc.). Não altera seleção. |

| `boundaryEnabled` | boolean | `PE_PROVIDER_BOUNDARY_ENABLED`. |

| `boundaryMode` | string | `legacy_factory` \| `ports_adapters`. |



## `legacyFallback` — definição única



Significado oficial (**A**): o fallback legado foi aplicado.



Não significa:



- (B) que o provider legado está disponível;

- (C) que a boundary está desativada;

- (D) que o modo de compatibilidade está ativo.



Disponibilidade → campos `mercadoPagoPayout` / `mercadoPagoPayment` no health.  

Boundary → `boundaryEnabled` / `boundaryMode`.



## Matriz mínima



| requested | gate Asaas | effective | fallbackApplied |

|-----------|------------|-----------|-----------------|

| asaas | autorizado / resolvível | asaas | **false** |

| asaas | bloqueado / não resolvível | mercadopago | **true** |

| mercadopago | n/a | mercadopago | **false** |

| unknown | n/a | — | boot **erro** (sem fallback silencioso) |



## API



- `ProviderResolver.deriveResolutionSide({ requestedProvider, effectiveProvider, legacyFallbackActive })`

- `ProviderResolver.getResolutionMetadata()`

- `PaymentEngine.providers().resolution()`

- `PaymentEngine.health().pe2l.resolution`



Seleção produtiva continua 100% na `FinanceProviderFactory` (flag OFF default).

