# PE.2F.1 — Stabilization & Smoke Fix™



## Veredito: BLOCKED (shell) — correções F1/F2 aplicadas



| Campo | Valor |

|-------|-------|

| Gate | PE.2F.1 |

| Escopo | Estabilização determinística PE.2F apenas |

| Data | 2026-07-14 |

| Produção | Intocada |

| PE.2G / PE.2C | **Não autorizados** |



### Por que não PASS



Critério do gate exige smoke/verify **PASS em execução**. O shell do agente Cursor falha na inicialização (`System.Management.Automation.LanguagePrimitives`, exit `-65536`) — Node não inicia. **Não é falha dos scripts**; é bloqueio de infraestrutura.



Operador deve confirmar:



```bat

node scripts/pe2f-claim-deposit-port-smoke.mjs

node scripts/verify-pe2f-deposit-claim-port.mjs

```



Com ambos PASS → este gate pode ser promovido a **PASS** e B8 reavaliado.



---



## Correções aplicadas (única tentativa)



### F1 — Core sem “supabase”



**Causa:** comentário em `claimApprovedDeposit.js` continha a palavra `Supabase`, falhando `/supabase/i` no smoke.



**Fix:** comentários do core reescritos sem nomear cliente de persistência, schema de produto, tabelas ou SQL.



Auditoria estática: **zero** matches de `supabase`, `pagamentos_pix`, `usuarios`, `ledger_financeiro` no core.



### F2 — Adapter find mapeia neutro



**Causa:** mock do verify usava `maybeSingle: async () =>` (arrow) → `this` não era o query builder → `find` retornava `found: false`.



**Fix:**

1. Verify: builder explícito com closure (mock correto).

2. Adapter: `trySelect` resolve `maybeSingle`/`single`/thenable e sempre passa por `mapPixRowToDepositRecord` (contrato `DepositRecord` neutro; sem `usuario_id`/`payment_id` no objeto retornado).



Comportamento financeiro do claim legado: **não alterado**.



---



## Não alterado



- Flags default (`PE_DEPOSIT_CLAIM_PORT_ENABLED=false`, `PE_ADAPTER_BOUNDARY_ENABLED=false`)

- `claimApprovedPixDeposit.js` legado

- Regras financeiras / PIX / Wallet / Ledger produtivos

- Payment Engine API pública (sem novos métodos)

- Produção / staging / Fly / deploy / runtime



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** (somente F1/F2 + mock verify) |

| Produção alterada? | **NÃO** |

| Runtime alterado? | **NÃO** |

| Banco alterado? | **NÃO** |

| Deploy executado? | **NÃO** |

| Regras financeiras alteradas? | **NÃO** |

| Core conhece Supabase? | **NÃO** (estático) |

| Adapter mapeia corretamente? | **SIM** (contrato DepositRecord; mock corrigido) |

| Smoke 1 PASS? | **NÃO EXECUTADO** (shell blocked) |

| Smoke 2 PASS? | **NÃO EXECUTADO** (shell blocked) |

| Rollback preservado? | **SIM** |

| Compatibilidade preservada? | **SIM** |



---



## Arquivos tocados



| Arquivo | Motivo |

|---------|--------|

| `src/payment-engine/core/claimApprovedDeposit.js` | F1 — comentários sem supabase |

| `src/payment-engine/adapters/goldeouro/GolDeOuroDepositClaimAdapter.js` | F2 — find + mapeamento neutro robusto |

| `scripts/verify-pe2f-deposit-claim-port.mjs` | F2 — mock builder + asserts do contrato |



---



## Próximo passo



1. Rodar os dois scripts acima num terminal local.

2. Se **ambos PASS** → promover PE.2F.1 a PASS e reavaliar B8.

3. Se **qualquer FAIL** → colar saída; **não** abrir PE.2G.

