# PE.2E — Webhook Payload Extraction™



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2E  

**Data:** 2026-07-14  

**Modo:** IMPLEMENTAÇÃO CONTROLADA E REVERSÍVEL  

**Fase:** B → C · Eliminação do bloqueador **B1**  

**Flag:** `PE_ADAPTER_BOUNDARY_ENABLED=false` (default — produção preservada)  

**Snapshot:** `docs/relatorios/snapshots/pe2e-webhook-payload-extraction.json`  

**Mapa:** `docs/payment-engine/webhook-payload/pe2e-audit-map.json`



---



## Declarações



```

code_changed = true          # somente escopo autorizado (contratos/bridges/fachada)

deploy_executed = false

production_secrets_altered = false

database_altered = false

schema_altered = false

financial_rules_altered = false

PE_ADAPTER_BOUNDARY_ENABLED = false   # default; path shadow opt-in

legacy_webhooks_removed = false

rollback_available = true

```



Shell do agente: **indisponível** (`LanguagePrimitives`) — smoke documentado para execução HITL local.



---



## Veredito



# **PASS COM RESSALVAS**



| Campo | Valor |

|-------|-------|

| B1 (express.Request nos contratos) | **MITIGADO** — contratos tipam `WebhookPayload` |

| Bridge HTTP GDO | **IMPLEMENTADO** |

| Núcleo aceita payload neutro | **SIM** |

| Fluxo legado preservado (flag=false) | **SIM** |

| Ativação automática em produção | **NÃO** |

| Smoke local executado neste ambiente | **PENDENTE** (SHELL-01) |



---



## Arquitetura resultante



```text

Express Request          (borda Gol de Ouro™ — server-fly.js)

        │

        ▼

GdoWebhookHttpBridge     (extraction; shadow se flag=true)

        │

        ▼

WebhookPayload           (contrato neutro PE.2E)

        │

        ▼

PaymentEngine.webhooks   (process / processFromPayload / processFromExpress)

        │

        ▼

processPaymentWebhook + providers (via resolveWebhookIngress / coerce HTTP-like)

```



Com `PE_ADAPTER_BOUNDARY_ENABLED=false`:



```text

Express Request → processFromExpress → {req} legado → mesmo comportamento pré-PE.2E

```



---



## Artefatos



| Artefato | Papel |

|----------|-------|

| `src/payment-engine/types/WebhookPayload.js` | Contrato + `createWebhookPayload` / `isWebhookPayload` |

| `src/payment-engine/compat/webhookPayloadFromExpress.js` | Mapper borda → payload |

| `src/payment-engine/bridges/http/GdoWebhookHttpBridge.js` | HTTP Bridge GDO |

| `src/finance/compat/resolveWebhookIngress.js` | Ingress body/headers/reqLike |

| `src/finance/compat/coerceHttpLikeWebhookInput.js` | Coerce para validators legados |

| `PaymentEngine.webhooks.processFromPayload` | API neutra |

| `PaymentEngine.webhooks.processFromExpress` | Borda HTTP (respeita flag) |

| `scripts/pe2e-webhook-payload-smoke.mjs` | Smoke local |



### Contratos atualizados (B1)



- `PaymentProvider.handleDepositWebhook` → `WebhookPayload \| object`

- `PayoutProvider.handlePayoutWebhook` → `WebhookPayload \| object`



### Rotas (`server-fly.js`)



- `POST /api/payments/webhook` e `POST /webhooks/asaas` passam por `processFromExpress`  

- Flag **false** ⇒ `req` legado; flag **true** ⇒ `webhookPayload` (shadow)



### Não alterado



- Regras financeiras, ledger, wallet, payout, recovery, schema, secrets, deploy



---



## O que a Payment Engine não deve mais depender



| Proibido no núcleo como contrato | Status pós-PE.2E |

|----------------------------------|------------------|

| `express` package runtime | ✅ Sem `require('express')` na PE |

| Tipagem `express.Request` nos contracts PSP | ✅ Removida |

| Obrigatoriedade de `input.req` no process | ✅ Opcional — `webhookPayload` suficiente |



Validators MP/Asaas ainda podem receber **HTTP-like duck-typed** gerado a partir do payload (sem pacote Express) — compat temporária, reversível.



---



## Rollback



1. Manter / setar `PE_ADAPTER_BOUNDARY_ENABLED=false`  

2. Se necessário: reverter commits PE.2E (git) — rotas voltam ao padrão anterior  

3. Baseline produtiva permanece o caminho legado enquanto flag=false  



Detalhe operacional: `docs/payment-engine/adapter-boundary/rollback-plan.md`



---



## Critérios HITL antes de ativar shadow em staging



- [ ] `node scripts/pe2e-webhook-payload-smoke.mjs` → PASS  

- [ ] `node scripts/pe2b-adapter-boundary-smoke.mjs` → PASS  

- [ ] Flag staging = `false` confirmada (`fly secrets list`)  

- [ ] Autorização HITL (PIPELINE.3) para teste shadow controlado  

- [ ] **Nunca** `PE_ADAPTER_BOUNDARY_ENABLED=true` em produção sem gate dedicado  



---



## Ressalvas



1. Smoke não executado neste ambiente (SHELL-01).  

2. `utils/webhook-signature-validator.js` ainda espera HTTP-like — atendido via coerce/bridge.  

3. Remoção total de HTTP-like nos validators PSP = gate futuro (pós-certificação shadow).  

4. PE.2C permanece **NO-GO** até isolamento de package (PE.2C-PRE).  



---



## Próximo gate sugerido



1. HITL: smoke local + (opcional) shadow staging com flag true  

2. PE.2B.2 deploy staging (se ainda bloqueado por B-01 flag)  

3. Depois: ports persistência B8/B2/B10 — não PE.2C prematuro  


