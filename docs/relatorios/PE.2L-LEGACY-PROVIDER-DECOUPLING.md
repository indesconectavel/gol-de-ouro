# PE.2L — Legacy Provider Decoupling™

## Veredito: PASS COM RESSALVAS

| Campo | Valor |
|-------|-------|
| Gate | PE.2L |
| Bloqueador | **PB-03** |
| Flag | `PE_PROVIDER_BOUNDARY_ENABLED=false` |
| Produção | **Intacta** |
| PE.2C | **NO-GO** (físico) |

### Ressalvas

1. Smoke/verify podem falhar no agente (shell).
2. `services/pix-mercado-pago` permanece atrás do provider finance MP (encapsulado; suporte MP **não** removido).
3. `mpDepositReconcile` ainda chama HTTP MP (residual de produto GDO, fora do ProviderResolver).

---

## Objetivo

```text
Core / Facade
  → ProviderResolver
      → PaymentProviderPort / TransferProviderPort
          → Asaas | MercadoPago | Celcoin | Efí(stub) adapters
              → legado
```

Core: **0** requires Asaas/MP/SDK/factory.

---

## Scores vs PE.2K

| | PE.2K | PE.2L |
|--|------:|------:|
| Package Readiness | 6,8 | **~7,0** |
| Technology Readiness | 7,3 | **~7,5** |

**PB-03 eliminado** na superfície da Engine. PE.2C físico permanece NO-GO (`physical_zero_gdo`, PB-05).

**PE.2M:** **GO** (próximo: residual reconcile MP / package C0 lógico / staging).

---

## Respostas obrigatórias

| | |
|--|--|
| Código alterado? | **SIM** |
| Produção / Deploy / Banco / Schema / Runtime / Secrets / Regras? | **NÃO** |
| Core conhece MP / Asaas? | **NÃO** |
| ProviderResolver / PaymentProviderPort / Adapters? | **SIM** |
| Compat / Flag FALSE / Rollback? | **SIM** |
| Smoke / Verify? | **PENDENTE (shell)** |
| PB-03 eliminado? | **SIM (arquitetural)** |
| Package / Technology? | **~7,0 / ~7,5** |
| PE.2M autorizado? | **GO** |

```bash
node scripts/pe2l-provider-boundary-smoke.mjs
node scripts/verify-pe2l-provider-boundary.mjs
```
