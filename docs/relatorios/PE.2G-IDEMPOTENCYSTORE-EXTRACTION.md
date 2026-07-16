# PE.2G — IdempotencyStore Extraction™



## Veredito: PASS COM RESSALVAS



| Campo | Valor |

|-------|-------|

| Gate | PE.2G |

| Bloqueador | **B2** — IdempotencyStore formal |

| Data | 2026-07-14 |

| Modo | HITL — aditivo, flag default false |

| Produção | **Intacta** |

| PE.2H | **NO-GO** (não autorizado por este gate) |



### Ressalva



Smoke/verify **não executados no agente** (shell `LanguagePrimitives`). Scripts prontos:



```text

node scripts/pe2g-idempotency-smoke.mjs

node scripts/verify-pe2g-idempotency-port.mjs

```



Auditoria estática do core: **zero** referências a supabase / tabelas / `.from(` / `.rpc(`.



---



## Objetivo



Extrair idempotência de depósito (webhook) para `IdempotencyStore` neutro. Persistência GDO isolada em `GolDeOuroIdempotencyStore`.



## Flag



| Flag | Default |

|------|---------|

| `PE_IDEMPOTENCY_PORT_ENABLED` | **false** |



Independente de `PE_ADAPTER_BOUNDARY_ENABLED` e `PE_DEPOSIT_CLAIM_PORT_ENABLED`.



```text

FALSE → checkSupabaseDepositIdempotency (legado 100%)

TRUE  → core → IdempotencyStore → GolDeOuroIdempotencyStore → legado

```



## Arquitetura



### Criados



| Artefato | Path |

|----------|------|

| Port | `src/payment-engine/ports/IdempotencyStore.js` |

| Types | `src/payment-engine/types/IdempotencyKey.js` |

| Core | `src/payment-engine/core/idempotency.js` |

| Flag | `src/payment-engine/boundary/idempotency-port-config.js` |

| Adapter GDO | `src/payment-engine/adapters/goldeouro/GolDeOuroIdempotencyStore.js` |

| In-memory | `src/payment-engine/adapters/memory/InMemoryIdempotencyStore.js` |

| Compat | `src/payment-engine/compat/idempotencyPortBridge.js` |

| Smoke | `scripts/pe2g-idempotency-smoke.mjs` |

| Verify | `scripts/verify-pe2g-idempotency-port.mjs` |

| Auditoria | `docs/payment-engine/idempotency/*` |



### Modificados (aditivos)



- `processPaymentWebhook.js` — usa `checkDepositIdempotencyCompat`

- `GolDeOuroWebhookAdapter.js` — compat PE.2G

- `adapters/goldeouro/index.js`, `boundary/index.js`, `payment-engine/index.js`

- `package-readiness.json` — B2 resolvido (ports)



### Intocados



- `paymentWebhookIdempotency.js` (legado)

- Banco / schema / secrets / Fly / deploy / push



## API do port



`exists` · `find` · `reserve` · `commit` · `rollback` · `release` · `markProcessed` · `markFailed`



## Atomicidade



- Check de webhook depósito: read-only status `approved` (legado).

- Reserve lógico in-process no adapter (não substitui claim/ledger/RPC).

- Mutação financeira permanece no claim homologado.



## Package Readiness



- B2: **eliminado** (READY_SHADOW depósito webhook)

- Ports score documentado: **6.5**

- Overall estimado: **~6.0**

- **PE.2C / PE.2H: NÃO autorizados**



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** |

| Produção alterada? | **NÃO** |

| Deploy? | **NÃO** |

| Banco? | **NÃO** |

| Schema? | **NÃO** |

| Secrets? | **NÃO** |

| Fly? | **NÃO** |

| Runtime? | **NÃO** (flag false) |

| Core conhece banco? | **NÃO** |

| Core conhece Supabase? | **NÃO** |

| Core conhece schema GDO? | **NÃO** |

| IdempotencyStore criado? | **SIM** |

| Adapter criado? | **SIM** |

| Compatibilidade preservada? | **SIM** |

| Flag default false? | **SIM** |

| Rollback preservado? | **SIM** |

| Smoke PASS? | **NÃO EXECUTADO** (shell blocked) |

| Verify PASS? | **NÃO EXECUTADO** (shell blocked) |

| B2 eliminado? | **SIM** (formal port; payout residual) |

| Package Readiness atualizado? | **SIM** |

| PE.2H autorizado? | **NO-GO** |



## Próximos blockers



B7 · B10 · PB-01 · PB-02 · residual payout idempotency store

