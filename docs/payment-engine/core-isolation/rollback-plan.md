# Rollback Plan — PE.2I



## Princípio



Comportamento financeiro **não** depende da flag. Rollback é estrutural/documental.



## Opção 1 — Instantânea (runtime)



```bash

# já é o default

unset PE_CORE_FINANCE_BOUNDARY_ENABLED

# ou

export PE_CORE_FINANCE_BOUNDARY_ENABLED=false

```



Surface permanece `financeLegacySurface` → mesmos módulos finance.



## Opção 2 — Remover PE.2I (código)



1. Restaurar requires diretos em `core/withdraw|webhooks|reconciliation|deposit` a partir do commit pré-PE.2I.

2. Reverter `api/PaymentEngine.js` e `scheduler/asaasPayoutRecoveryScheduler.js`.

3. Remover `compat/financeLegacySurface.js`, `boundary/core-finance-boundary-config.js`, `boundary/resolveFinanceSurface.js`.

4. Remover scripts/docs PE.2I.



## O que NÃO fazer no rollback



- Não tocar finance legado

- Não alterar schema/banco

- Não deploy emergency só por esta flag



## Verificação pós-rollback



```bash

node scripts/pe2i-core-finance-smoke.mjs   # se ainda existir

# ou smoke historicos pe2f/pe2g/pe2h

```

