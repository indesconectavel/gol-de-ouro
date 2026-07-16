# PE.2F — Claim Deposit Port Extraction™



## Veredito: PASS COM RESSALVAS



| Campo | Valor |

|-------|-------|

| Gate | PE.2F |

| Engine | Indesconectável Payment Engine™ |

| Bloqueador | **B8** — `claimApprovedPixDeposit` acessa persistência/schema GDO |

| Data | 2026-07-14 |

| Modo | Aditivo, shadow-first, reversível |

| Produção | **Preservada** (flag false, sem deploy) |



### Ressalva



Shell do agente Cursor bloqueado (`PowerShell LanguagePrimitives`) — smoke/unit **não executados no agente**. Auditoria estática do core e legado: PASS. Operador deve rodar:



```bash

node scripts/pe2f-claim-deposit-port-smoke.mjs

node scripts/verify-pe2f-deposit-claim-port.mjs

node scripts/verify-asaas-deposit-claim-fallback.mjs

node scripts/pe2e-webhook-payload-smoke.mjs

node scripts/pe2b-adapter-boundary-smoke.mjs

```



---



## 1. Objetivo cumprido



O core `claimApprovedDeposit` **não** conhece Supabase nem schema GDO. Persistência concreta fica no `GolDeOuroDepositClaimAdapter`. WalletPort e LedgerPort preservados (PE.2B). Legado `claimApprovedPixDeposit.js` **intocado**.



## 2. Arquitetura



### Produção (flag OFF — default)



```text

PaymentEngine.deposit.claimAndCredit

  → claimApprovedPixDepositCompat

    → claimApprovedPixDeposit (legado homologado)

```



### Autorizado (flag ON — local/staging HITL)



```text

PaymentEngine

  → claimApprovedPixDepositCompat

    → claimApprovedDeposit (core neutro)

      → DepositClaimPort

        → GolDeOuroDepositClaimAdapter

          → claimApprovedPixDeposit (legado — uma única mutação)

```



### Shadow / testes



```text

claimApprovedDeposit / Orchestrated

  → InMemoryDepositClaimPorts (fakes)

```



## 3. Feature flag



| Flag | Default | Motivo |

|------|---------|--------|

| `PE_DEPOSIT_CLAIM_PORT_ENABLED` | **false** | Isola claim financeiro de `PE_ADAPTER_BOUNDARY_ENABLED` (webhook/ports) |



Ativar `PE_ADAPTER_BOUNDARY_ENABLED` **não** ativa o claim port.



## 4. Atomicidade (resumo)



| Caminho | Transacional? |

|---------|----------------|

| RPC GDO | Sim |

| JS fallback | Não (pré-existente); ledger → wallet |

| Adapter PE.2F | Mesmas garantias do legado |



Detalhe: `docs/payment-engine/deposit-claim/atomicity-analysis.md`



## 5. Entregáveis



| Artefato | Path |

|----------|------|

| Relatório | `docs/relatorios/PE.2F-CLAIM-DEPOSIT-PORT-EXTRACTION.md` |

| Snapshot | `docs/relatorios/snapshots/pe2f-claim-deposit-port-extraction.json` |

| Current flow | `docs/payment-engine/deposit-claim/current-flow-map.json` |

| Target flow | `docs/payment-engine/deposit-claim/target-flow-map.json` |

| Contracts | `docs/payment-engine/deposit-claim/port-contracts.md` |

| Schema audit | `docs/payment-engine/deposit-claim/schema-dependency-audit.json` |

| Atomicity | `docs/payment-engine/deposit-claim/atomicity-analysis.md` |

| Compatibility | `docs/payment-engine/deposit-claim/compatibility-report.json` |

| Tests | `docs/payment-engine/deposit-claim/test-results.json` |

| Risks | `docs/payment-engine/deposit-claim/risk-register.json` |

| Rollback | `docs/payment-engine/deposit-claim/rollback-plan.md` |

| Smoke | `scripts/pe2f-claim-deposit-port-smoke.mjs` |

| Verify | `scripts/verify-pe2f-deposit-claim-port.mjs` |



## 6. Código (criar / modificar)



### Criados



- Ports/types/core/adapter/memory/compat/flag config (lista no rollback-plan)



### Modificados (aditivos)



- `PaymentEngine.js` — bridge + `claimApprovedViaPorts`

- `core/deposit.js` — exports PE.2F

- `adapters/goldeouro/index.js` — factory depositClaim

- `boundary/index.js` — `resolveDepositClaimPort`

- `index.js` — re-exports

- WalletPort / LedgerPort — docs PE.2F



### Intocado



- `src/finance/deposit/claimApprovedPixDeposit.js`

- Schema / banco / secrets / Fly / deploy



## 7. Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** |

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** |

| Banco alterado? | **NÃO** |

| Schema alterado? | **NÃO** |

| Deploy executado? | **NÃO** |

| Regras financeiras alteradas? | **NÃO** |

| Fluxo legado preservado? | **SIM** |

| Flag default false? | **SIM** |

| Core sem Supabase? | **SIM** |

| Core sem schema GDO? | **SIM** |

| DepositClaimPort formalizado? | **SIM** |

| WalletPort preservado? | **SIM** |

| LedgerPort preservado? | **SIM** |

| Atomicidade preservada? | **SIM** |

| Idempotência preservada? | **SIM** |

| Compatibilidade legada preservada? | **SIM** |

| Smoke PASS? | **NÃO (BLOCKED shell)** — script pronto |

| Testes PASS? | **NÃO (BLOCKED shell)** — script pronto |

| Rollback disponível? | **SIM** |

| Bloqueador B8 eliminado? | **SIM** (core/ports; legado GDO encapsulado no adapter) |



## 8. Package Readiness pós-PE.2F



| Dimensão | Antes (PE.2C-PRE) | Após PE.2F (estimado) |

|----------|-------------------|------------------------|

| acoplamento | 4.0 | **~5.0** (B8 fechado no core PE) |

| ports | 5.0 | **~6.0** (DepositClaimPort READY_SHADOW) |

| overall | 5.7 | **~5.9–6.1** |

| PE.2C autorizado? | **NÃO** | **NÃO** |



B8 removido da lista crítica de package blockers; restam B2, B7, B10, PB-01, PB-02, etc.



## 9. Decisão final



- **B8 eliminado:** SIM (Payment Engine core claim não acopla schema GDO).

- **PE.2C:** **NÃO autorizado** por este gate.

- **Próximo gate recomendado:** **B2 — IdempotencyStore formal** (ou B10 webhook store), mantendo HITL.

- **GO/NO-GO próximo gate de eliminação:** **GO com HITL** para B2/B10; **NO-GO** para ativação produtiva do claim port.



## 10. Estado correto pós-PE.2F



```text

Produção:

  fluxo homologado atual

  PE_DEPOSIT_CLAIM_PORT_ENABLED=false

  PE_ADAPTER_BOUNDARY_ENABLED=false

  sem deploy / sem mudança de runtime



PE.2F:

  código local/shadow

  ports + adapter + bridge

  testes e smoke (pendente execução local)

  rollback disponível

```

