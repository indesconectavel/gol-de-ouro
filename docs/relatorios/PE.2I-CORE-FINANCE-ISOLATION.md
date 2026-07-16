# PE.2I — Core-to-Finance Isolation™



## Veredito: PASS COM RESSALVAS



| Campo | Valor |

|-------|-------|

| Gate | PE.2I |

| Bloqueador | **B7** |

| Data | 2026-07-14 |

| Flag | `PE_CORE_FINANCE_BOUNDARY_ENABLED=false` |

| Produção | **Intacta** |

| PE.2C | **NO-GO** |



### Ressalvas



1. Smoke/verify **não executados no agente** (shell `LanguagePrimitives`) → certificação por testes **pendente local**.

2. `providers/` e `config/` ainda importam `finance/*` (fora de `core/` — residual D, não reabre B7).

3. `core/withdraw|webhooks|reconciliation` carregam finance **transitivamente** via `financeLegacySurface` (classe B — Compatibility Layer), sem `require(...finance/)`.



Scripts: `pe2i-core-finance-smoke.mjs` · `verify-pe2i-core-finance-boundary.mjs`



---



## Objetivo cumprido (arquitetural)



```text

ANTES:  Core → finance/*

DEPOIS: Core → Compat (financeLegacySurface) / Ports → Adapters → Finance legado

```



Auditoria estática em `src/payment-engine/core/**`: **0** matches de `require(...finance/)`.



Fachada `PaymentEngine` e scheduler Asaas usam `getFinanceSurface()` / `financeLegacySurface`.



Flag OFF/ON → **mesma** surface (identidade de objeto); nenhum comportamento financeiro muda.



---



## Entregáveis



| Artefato | Path |

|----------|------|

| Dependency map | `docs/payment-engine/core-isolation/dependency-map.json` |

| Imports / audit | `imports-report.json`, `imports-audit.json` |

| Coupling | `finance-coupling.json` |

| Boundary | `boundary-report.json` |

| Compat / risk / diff | `compatibility-report.json`, `risk-register.json`, `architecture-diff.json` |

| Baseline / rollback | `architecture-baseline.md`, `rollback-plan.md` |

| Package readiness (PE.2I) | `docs/payment-engine/core-isolation/package-readiness.json` |

| Snapshot | `docs/relatorios/snapshots/pe2i-core-finance-isolation.json` |



---



## Package Readiness



| Dimensão | Antes | Depois |

|----------|-------|--------|

| Overall | 6.1 | **~6.3** |

| Arquitetura | 6.5 | **7.0** |

| Acoplamento | 4.0 | **5.0** |

| Ports | 7.0 | 7.0 |

| Banda | QUASE_PRONTO | QUASE_PRONTO |



- **B7 eliminado** da lista de blockers PE.2C (arquiteturalmente).

- Restam: PB-01, PB-02, domain payout, worker bypass, MP coupling, staging deploy, residual providers/config.



---



## GO / NO-GO PE.2C



| Item | Status |

|------|--------|

| B7 core→finance direto | **Eliminado** |

| Package readiness ≥ 7.0 | **Não** (~6.3) |

| Package físico isolado | **Não** |

| PE.2C | **NO-GO** |



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** |

| Produção alterada? | **NÃO** |

| Deploy? | **NÃO** |

| Banco / Schema / Runtime / Secrets? | **NÃO** |

| Regras financeiras? | **NÃO** |

| Core conhece finance/* (require direto)? | **NÃO** |

| Core conhece Supabase / controllers / workers? | **NÃO** |

| Bridge criada? | **SIM** (`financeLegacySurface` + `resolveFinanceSurface`) |

| Compatibilidade preservada? | **SIM** |

| Flag default FALSE? | **SIM** |

| Rollback preservado? | **SIM** |

| Smoke PASS? | **NÃO EXECUTADO** (shell) |

| Verify PASS? | **NÃO EXECUTADO** (shell) |

| B7 eliminado? | **SIM (arquitetural)** / **não certificado por testes** |

| Package Readiness? | **~6.3** |

| PE.2C autorizado? | **NO-GO** |



---



## Como certificar localmente



```bash

node scripts/pe2i-core-finance-smoke.mjs

node scripts/verify-pe2i-core-finance-boundary.mjs

```



Nenhum teste acessa produção.

