# PE.2H.1 — Timeout Semantics Stabilization™



## Veredito: PASS COM RESSALVAS (semântica estabilizada; smoke/verify não executados no agente)



| Campo | Valor |

|-------|-------|

| Gate | PE.2H.1 |

| Tipo | Microgate de estabilização |

| Data | 2026-07-14 |

| Produção | Intacta |

| B7 / PE.2C | **Não autorizados** |



### Ressalva operacional



Shell do agente continua bloqueado (`LanguagePrimitives`). Scripts preparados; **não** declarar Smoke/Verify PASS neste ambiente.



---



## FASE 1 — Auditoria



| Fonte | Produzia / esperava |

|-------|---------------------|

| Contrato `WebhookStoreStatus` | `received\|processing\|processed\|failed` — **sem TIMEOUT** |

| Smoke | `status=failed` + `lastErrorCode=TIMEOUT` |

| Verify (antes) | `markFailed` genérico; ALL OK |

| Bug | `normalizeWebhookStoreInput` **descartava** `errorCode` → adapters gravavam default `FAILED`/`WEBHOOK_FAILED` |



Sintoma do smoke real:



```text

AssertionError: actual FAILED !== expected TIMEOUT

```



Campo em disputa: **`lastErrorCode`**, não o enum de status.



---



## FASE 2 — Decisão: **Opção B**



```text

status:        failed

lastErrorCode: TIMEOUT

```



| Critério | Por quê B |

|----------|-----------|

| Simplicidade | 4 statuses; causas em códigos |

| Retry | `failed` → `recordRetry` → `received` |

| Extensibilidade | novos códigos sem novo status |

| Package Readiness | superfície de ciclo de vida estável |



Rejeitado A (`status=TIMEOUT`) e C (`só metadata`).



---



## FASE 3 — Correção



1. `errorCode` preservado em `normalizeWebhookStoreInput`

2. `core.markFailed` garante `errorCode`

3. Adapters InMemory + GDO: `lastErrorCode = input.errorCode`

4. Contrato/port documenta Opção B + constantes

5. Smoke/verify reforçam assertions Opção B



Nenhuma regra financeira / persistência GDO / flag default alterada.



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** (semântica timeout only) |

| Produção / Deploy / Banco / Schema / Runtime? | **NÃO** |

| Semântica escolhida? | **Opção B** — `failed` + `lastErrorCode=TIMEOUT` |

| Motivo técnico? | Timeout é **causa**, não estágio de lifecycle |

| Core / Adapter consistentes? | **SIM** |

| Smoke / Verify preparados? | **SIM** |

| Smoke / Verify PASS? | **NÃO EXECUTADO** |

| Rollback preservado? | **SIM** |

| B10 certificado? | **NÃO** (aguarda smoke+verify reais) |

| PE.2H aprovado? | **Parcial** — semântica OK; certificação de testes pendente |



## Próximo passo para certificar B10



Executar localmente:



```bat

node scripts/pe2h-webhook-store-smoke.mjs

node scripts/verify-pe2h-webhook-store-port.mjs

```



Somente com ambos PASS → B10 totalmente certificado. **B7 não autorizado** antes disso.

