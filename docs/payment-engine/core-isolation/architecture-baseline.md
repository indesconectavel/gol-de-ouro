# Architecture Baseline — PE.2I Core↔Finance Isolation



## Target



```text

Payment Engine Core

  → Ports / Types / Compat interfaces

    → Adapters (Gol de Ouro™)

      → Compatibility Layer (financeLegacySurface)

        → Finance legado



Nunca: Core → finance/*

```



## Flag



`PE_CORE_FINANCE_BOUNDARY_ENABLED` default **false**



- OFF → `mode: legacy_direct` (mesma surface)

- ON → `mode: core_bridge` (mesma surface; só marca path documentado)



Nenhuma regra financeira muda.



## Before



`core/deposit|withdraw|webhooks|reconciliation` importavam `finance/*` e/ou `domain/payout`.



## After



- Core **zero** `require(...finance/...)`

- `withdraw|webhooks|reconciliation` → `compat/financeLegacySurface` (classe B)

- `deposit` → ports + `depositClaimPortBridge` (PE.2F)

- Facade `PaymentEngine` → `getFinanceSurface()`

- Scheduler Asaas → `financeLegacySurface`



## Residual (fora do Core)



- `providers/` → `finance/factory`

- `config/` → `finance/config`

- Adapters GDO → finance (esperado)



Isso **não** reabre B7 (escopo B7 = Core).



## Produção



Intacta. Sem deploy, schema, secrets, Fly, Actions.

