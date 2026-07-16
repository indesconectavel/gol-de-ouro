# PE.2C-PRE — Auditoria Suprema Read-Only da Package Boundary™



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2C-PRE  

**Data:** 2026-07-11  

**Modo:** READ-ONLY ABSOLUTO  



---



## Veredito



# **NO-GO — PE.2C NÃO AUTORIZADO**



A Payment Engine™ possui **identidade arquitetural madura** (fachada P2.2, factory multi-PSP, adapters GDO, ports shadow PE.2B), porém **não possui isolamento suficiente** para reorganização física ou package C0 independente. **Qualquer dúvida sobre isolamento → NO-GO** (regra máxima aplicada).



**Auditoria:** **PASS COM RESSALVAS** (evidências completas; bloqueadores declarados).



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **NÃO** |

| Runtime alterado? | **NÃO** |

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** |

| Git alterado? | **NÃO** |

| Banco alterado? | **NÃO** |

| Package pronto? | **NÃO** |

| Nota de maturidade? | **5,7 / 10** |

| PE.2C autorizado? | **NÃO** |



---



## Declarações de integridade



```

code_changed = false

runtime_altered = false

production_touched = false

staging_touched = false

git_mutated = false

database_altered = false

workflows_executed = false

documentation_existing_altered = false

```



---



## 1. Objetivo e escopo



Auditar a **fronteira arquitetural** da IPE™ antes de reorganização física de diretórios ou criação do package C0. Responder com evidências se a engine já possui isolamento suficiente para pacote independente.



**Artefatos gerados (somente documentação nova):**



| Arquivo |

|---------|

| `docs/payment-engine/package-boundary/package-map.md` |

| `docs/payment-engine/package-boundary/public-api.md` |

| `docs/payment-engine/package-boundary/breaking-analysis.md` |

| `docs/payment-engine/package-boundary/package-readiness.json` |

| `docs/payment-engine/package-boundary/dependency-graph.json` |

| `docs/payment-engine/package-boundary/risk-matrix.json` |

| `docs/relatorios/PE.2C-PRE-PACKAGE-BOUNDARY.md` |

| `docs/relatorios/snapshots/pe2c-pre-package-boundary.json` |



---



## 2. Imports cruzados



### 2.1 Matriz de dependência



| Origem | Destino | Count | Circular? |

|--------|---------|:-----:|:---------:|

| `payment-engine/*` | `finance/*` | 12 | — |

| `finance/*` | `payment-engine/*` | **0** | ✅ Não |

| `payment-engine/core/withdraw` | `domain/payout/*` | 1 | — |

| `domain/payout/*` | `finance/*` | 4+ | — |

| `finance/providers/mp` | `services/pix-mercado-pago` | 1 | — |

| `server-fly.js` | PaymentEngine + finance + domain/payout | 3 vias | **Bypass** |

| `payout-worker.js` | finance + domain/payout | 2 | **Bypass** |

| `goldeouro-player/admin` | — | 0 | HTTP only |



**Dependências circulares de módulo:** **Nenhuma** detectada.



### 2.2 Imports proibidos (vs Core puro ideal)



| Violação | Severidade | Status |

|----------|:----------:|--------|

| `core/withdraw` → `domain/payout` | **ALTO** | OPEN |

| `finance/deposit/claim*` → schema GDO | **CRÍTICO** | OPEN |

| `MercadoPagoPayoutProvider` → `services/pix-mercado-pago` | **ALTO** | OPEN |

| Runtime bypass facade (3 consumidores) | **ALTO** | OPEN |



### 2.3 Acoplamentos ocultos



- **ENV global** (`process.env`) em `FinanceProviderFactory` e configs

- **RPC Supabase** `claim_and_credit_approved_pix_deposit` hardcoded

- **Express.Request** em contratos PSP produtivos (B1)

- **Schedulers** acoplados a `GolDeOuroDepositRepository`



**Evidência:** `dependency-graph.json`, `docs/payment-engine/adapter-boundary/risk-register.json`



---



## 3. Package Boundary



### 3.1 Classificação de arquivos



| Camada | Paths | Arquivos ~ |

|--------|-------|:----------:|

| **CORE** | `src/finance/**`, `payment-engine/api`, `core`, `providers`, `config`, `scheduler` | ~55 |

| **PORTS** | `ports/`, `boundary/`, `compat/`, `types/WebhookPayload` | ~10 |

| **ADAPTERS** | `adapters/goldeouro/*`, PSP providers, `domain/payout` | ~30 |

| **RUNTIME** | `server-fly.js`, workers, controllers, routes, frontends | — |



### 3.2 Resposta: o package pode existir isoladamente?



| Dimensão | Resposta |

|----------|----------|

| Logicamente (npm workspace) | **SIM COM RESSALVAS** |

| Fisicamente (zero GDO) | **NÃO** |

| Produção segura pós-move imediato | **NÃO** |

| Segundo produto / licenciamento | **NÃO** |



---



## 4. Dependências externas



| Dependência | Classificação | Uso |

|-------------|---------------|-----|

| `axios` | ADAPTER | Webhooks MP, scheduler reconcile |

| `crypto` / `node:crypto` | CORE | Idempotência, tokens, payout |

| `@supabase/supabase-js` | ADAPTER | Injetado runtime/worker |

| `express` | RUNTIME | Webhook routes; contratos JSDoc |

| `fetch` (native) | ADAPTER | Asaas HTTP client |

| `dotenv` | RUNTIME | Boot server-fly |

| `process.env` | RUNTIME | Factory, gates, PSP config |

| Asaas API | ADAPTER | Provider primário |

| Mercado Pago API | ADAPTER | Provider legado |

| Fly.io | RUNTIME | Hosting — fora package |

| Node.js | RUNTIME | — |



**PROIBIDA no Core puro:** `services/pix-mercado-pago`, queries diretas `usuarios`/`saques`/`pagamentos_pix`, `express.Request` em contratos exportados.



---



## 5. Public API



API existente documentada em `public-api.md`. Fachada `PaymentEngine` (P2.2) cobre deposit, withdraw, webhooks, reconcile, providers, health.



| Gap crítico | Detalhe |

|-------------|---------|

| Ports PUBLIC | Shadow only — flag=false |

| `processPendingWithdrawals` | Fora facade boundary |

| `WebhookPayload` | Não substitui Express em prod |

| `createPaymentEngine()` | Não existe — usa `configure()` |



---



## 6. Package Readiness Score



| Dimensão | Nota |

|----------|:----:|

| Arquitetura | 6,5 |

| Acoplamento | 4,0 |

| Reutilização | 5,5 |

| Testabilidade | 6,0 |

| Ports | 5,0 |

| Adapters | 6,0 |

| Governança | 8,0 |

| Documentação | 8,5 |

| SDK Readiness | 4,0 |

| Licenciamento | 6,0 |

| **Média ponderada** | **5,7** |



**Faixa:** PREPARACAO (4–5) tendendo a QUASE_PRONTO. **Mínimo PE.2C GO:** 7,0. **Gap:** 1,3.



---



## 7. Breaking Changes



Ver `breaking-analysis.md`.



| Categoria | Impacto |

|-----------|---------|

| Path move sem proxy | **CRÍTICO** — boot + worker + 40 scripts |

| domain/payout fora package | **CRÍTICO** — payout automático |

| Schema GDO no Core | **CRÍTICO** — segundo produto |

| MP legacy service | **ALTO** |

| ENV global | **MÉDIO** |



**Continua funcionando** com re-exports + bridges, sem alteração lógica — **desde que** entry points unificados e ports extraídos.



---



## 8. Riscos



| Severidade | Count |

|:----------:|:-----:|

| CRÍTICO | 2 |

| ALTO | 7 |

| MÉDIO | 5 |

| BAIXO | 2 |



**Índice residual:** 3,4 (escala PE.2B: 2,8 → **piorou** por análise package explícita).



Detalhes: `risk-matrix.json`.



---



## 9. Critério de Go — PE.2C



# **NÃO AUTORIZADO**



### Bloqueadores restantes (exatos)



| ID | Bloqueador | Origem |

|----|------------|--------|

| **B1** | Contratos PSP produção usam `express.Request` | PE.2A / risk-register R3 |

| **B2** | IdempotencyStore formal ausente | PE.2A / risk-register |

| **B7** | `payment-engine/core/*` → imports `finance/*` (12 refs) | PE.2A / thin facade |

| **B8** | `claimApprovedPixDeposit` sem port extraction | PE.2A / finance/deposit |

| **B10** | GolDeOuroWebhookStore / persistence port | PE.2A |

| **PB-01** | `domain/payout` fora boundary — 32 queries GDO | PE.2C-PRE |

| **PB-02** | Runtime bypass facade (server-fly, worker, admin) | PE.2C-PRE |

| **PB-03** | `services/pix-mercado-pago` acoplamento MP | PE.2C-PRE |

| **PB-04** | Ports shadow inativos (`PE_ADAPTER_BOUNDARY_ENABLED=false`) | PE.2B |

| **PB-05** | PE.2B.2 staging deploy **NO-GO** | PIPELINE.2 |

| **PB-06** | Package Readiness 5,7 < 7,0 threshold | PE.2C-PRE |



### Pré-requisitos antes de PE.2C



```text

1. PE.2B.2 staging deploy PASS (PIPELINE.3 HITL)

2. PE.2E — WebhookPayload em produção (substituir Express.Request)

3. B8 + B2 + B10 — ports persistência

4. Unificar entry points payout → PaymentEngine

5. Decouple MP legacy → adapter interno

6. Readiness score ≥ 7.0 em re-auditoria PE.2C-PRE.2

```



---



## 10. Conclusão arquitetural



A IPE™ **não precisa ser reconstruída** — precisa de **extração incremental** já mapeada desde PE.2A/PE.2B:



- **Preservar:** factory multi-PSP, Recovery GOLD, fachada PaymentEngine, certificação P1.9

- **Completar:** ports em produção, eliminar bypass runtime, extrair schema GDO para adapters

- **Então:** move físico package C0 com bridges compat



**Nenhuma reorganização física do código poderá ocorrer antes desta certificação — certificação emitida: NO-GO.**



---



## Referências



- `docs/payment-engine/adapter-boundary/adapter-boundary-map.json`

- `docs/payment-engine/adapter-boundary/risk-register.json`

- `docs/payment-engine/adapter-boundary/compatibility-report.json`

- `docs/governance/PROPRIETARY-SCOPE.md`

- `src/payment-engine/api/PaymentEngine.js`

- `server-fly.js` L21–41, L200, L3800–3801

