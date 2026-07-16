# PE.2L.1 — Provider Fallback Semantics Stabilization™



## Veredito: PASS COM RESSALVAS (semântica estabilizada; smoke/verify não executados no agente)



| Campo | Valor |

|-------|-------|

| Gate | PE.2L.1 |

| Tipo | Microgate de estabilização semântica |

| Data | 2026-07-14 |

| Produção | **Intacta** |

| PE.2M | **NO-GO** (aguarda smoke+verify locais) |

| PB-03 | **Não certificado** sem evidência executável |



### Ressalva operacional



Shell do agente bloqueado (`LanguagePrimitives`). Scripts preparados e alinhados; **não** declarar Smoke/Verify PASS neste ambiente.



Após este relatório, execute somente:



```bat

node scripts/pe2l-provider-boundary-smoke.mjs

node scripts/verify-pe2l-provider-boundary.mjs

```



Sem deploy, merge, push ou alteração de flags.



---



## FASE 1 — Auditoria read-only



| Item | Evidência |

|------|-----------|

| Arquivo | `scripts/pe2l-provider-boundary-smoke.mjs` ~L109 |

| Comparação | `assert.equal(/pix-mercado-pago/.test(mpAdapter), false)` |

| LHS | boolean do `RegExp.test` sobre o **fonte** do adapter MP |

| Produtor | `MercadoPagoTransferAdapter.js` |

| Valor atual | `true` (substring no **comentário** de encapsulamento) |

| Esperado | `false` |

| Sintoma | `AssertionError: true !== false` |

| Logs próximos | `requested=asaas` → `effective=mercadopago` → `legacyFallback=true` |



### Mapa causal



```text

PRIMARY_PSP/default → requested=asaas

→ gates Asaas não resolvíveis

→ FinanceProviderFactory → effective=mercadopago + legacyFallback=true

→ ProviderResolver (selection intacta)

→ smoke lê adapter MP

→ regex ampla casa comentário "pix-mercado-pago"

→ AssertionError true !== false

```



### Classificação



| Camada | Tipo |

|--------|------|

| Falha do smoke | **bug de teste** (asserção ampla demais) |

| `legacyFallback=true` nos logs | **comportamento correto** (não era o valor sob teste) |

| Contrato | ambiguidade de nomenclatura smoke↔observability — resolvida neste gate |



---



## FASE 2 — Semântica oficial



| Conceito | Definição |

|----------|-----------|

| `requestedProvider` | Provider solicitado pela config efetiva |

| `effectiveProvider` | Provider selecionado após gates |

| `fallbackApplied` | `true` se fallback controlado aplicado |

| `legacyFallback` / `legacyFallbackApplied` | **A** — o fallback legado foi aplicado |



Rejeitados B/C/D/E (disponibilidade, boundary off, compat mode, significados mistos).



### Decisão técnica



Situação: `requested=asaas`, `effective=mercadopago`, gates bloquearam Asaas.



**Valor correto de `fallbackApplied` / `legacyFallback` = `true`.**



Justificativa: alinha factory homologada, logs críticos `[PSP][GATE]`, observabilidade, troubleshooting e package readiness. Não foi escolhido “para fazer o smoke passar”.



---



## FASE 3 — Correção cirúrgica



1. `ProviderResolver.deriveResolutionSide` + `getResolutionMetadata` (somente metadata).

2. Exports em `providers/index` + `PaymentEngine.providers().resolution` / `health.pe2l.resolution`.

3. Smoke: asserção por `require(...pix-mercado-pago)` + matriz semântica + casos integração.

4. Verify: testes PE.2L.1 dedicados.

5. Documentação de contrato / matriz / rollback.



**Não alterados:** seleção produtiva, gates Asaas, fallback MP, factory, adapters concretos, regras financeiras, flags default, deploy.



---



## FASE 4 — Testes



| Script | Neste ambiente |

|--------|----------------|

| `node scripts/pe2l-provider-boundary-smoke.mjs` | **NÃO EXECUTADO** |

| `node scripts/verify-pe2l-provider-boundary.mjs` | **NÃO EXECUTADO** |



---



## Não regressão (estrutural)



PaymentProviderPort · TransferProviderPort · ProviderResolver · Adapters PSP · RuntimeBoundary · façade · scheduler · worker · payout · webhook · factory legada · flags — intactos quanto à seleção.



- Provider efetivo **não** mudou.

- Mercado Pago **preservado**.

- Asaas **não** ativado.

- Rollback: reverter só PE.2L.1; manter PE.2L + flag false.



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** |

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** |

| Runtime produtivo alterado? | **NÃO** |

| Banco / Schema / Secrets alterados? | **NÃO** |

| Deploy executado? | **NÃO** |

| Regras financeiras alteradas? | **NÃO** |

| Provider efetivo alterado? | **NÃO** |

| Mercado Pago preservado? | **SIM** |

| Gates Asaas preservadas? | **SIM** |

| Causa da falha identificada? | **SIM** |

| Falha era de implementação ou teste? | **Teste** (asserção regex; semântica de fallback já correta) |

| Semântica oficial escolhida? | **`fallbackApplied=true` quando Asaas→MP por gate; `legacyFallback`=significado A** |

| requested / effective / fallback consistentes? | **SIM** (contrato + helpers) |

| Smoke PASS? | **NÃO EXECUTADO** |

| Verify PASS? | **NÃO EXECUTADO** |

| Rollback preservado? | **SIM** |

| PB-03 certificado? | **NÃO** |

| PE.2L aprovado? | **Parcial** — arquitetura OK; certificação de testes pendente |

| PE.2M autorizado? | **NO-GO** |

| Risco residual | Shell bloqueado; certificação local pendente; residual de produto `mpDepositReconcile` (fora deste gate) |



---



## Critério



Emitido **PASS COM RESSALVAS**: causa comprovada, semântica única, produção intacta, scripts alinhados — mas sem execução real de smoke/verify no agente.

