# PE.2M.2 — Preflight Final do Deploy Shadow em Staging



## Veredito: **NO-GO**



| Campo | Valor |

|-------|-------|

| Gate | PE.2M.2 |

| Modo | READ-ONLY ABSOLUTO |

| Data | 2026-07-14 |

| Deploy neste gate | **NÃO** |

| Produção alterada | **NÃO** |

| Staging alterado | **NÃO** |

| PB-05 | **Permanece aberto** |

| `STAGING_RUNTIME` | **NOT_CERTIFIED** |



### Por que NO-GO (dúvida → NO-GO)



1. **Release não congelada:** `release-manifest.json` tem `sha: PENDING_PIPELINE2A_COMMIT`; `tag-certification.json` → `tag_exists_remote: false`, `frozen: false`.

2. **Workflow abortaria:** checkout `pe2b-staging-ready` + comparação SHA do manifest falharia com placeholder.

3. **Release candidata atual é era PE.2B** — não comprovadamente inclui PE.2E→PE.2L.1/PE.2M.

4. **Git live / publish remoto:** shell do agente bloqueado → ancestry/remote **INDETERMINADO** onde não há evidência de arquivo.

5. **Oito flags em staging runtime:** só `PE_ADAPTER_BOUNDARY_ENABLED` é forçada `false` no workflow; as outras sete **INDETERMINADAS** no Fly até auditoria HITL de secrets.



---



## Respostas objetivas (objetivo do gate)



| # | Pergunta | Resposta |

|---|----------|----------|

| 1 | Qual release exata implantar? | **Nenhuma certificada.** Candidata histórica planejada: tag `pe2b-staging-ready` — **não publicada / SHA pending**. Para PE.2E→L seria necessária **nova** release congelada (fora deste gate). |

| 2 | Pipeline íntegro e executável? | **Estruturalmente endurecido; operacionalmente não executável** até freeze da tag + SHA real no manifest. |

| 3 | App Fly correto garantido? | **SIM no YAML** — `goldeouro-backend-staging` hardcode + guards. |

| 4 | Banco staging isolado? | **SIM no desenho** — refs `uatszaqzdqcwnfbipoxg` vs `gayopagjdrkcmkirmfvy`; gate pré-deploy via ssh console. Valor live DATABASE_URL: **INDETERMINADO** (secrets não lidos). |

| 5 | Oito flags explicitamente controladas? | **NÃO** — apenas adapter forçada; demais default código `false`, runtime Fly **INDETERMINADO**. |

| 6 | Rollback pronto? | **SIM em desenho** — `flyctl releases rollback -a goldeouro-backend-staging`; baseline documentada `b29d847`. |

| 7 | Caminho conhecido para produção? | **CI staging → app prod: bloqueado por guards.** Token Fly compartilhado = risco residual operacional. Scripts legados fora do workflow: risco HITL. |

| 8 | Deploy Shadow pode receber GO? | **NO-GO** |



---



## FASE 1 — Git



| Check | Classificação | Evidência |

|-------|---------------|-----------|

| Branch candidata | **VALIDADO** (local ref) | `.git/HEAD` → `pe/pe2b-staging-deploy` |

| HEAD local tip | **VALIDADO** (ref file) | `.git/refs/heads/pe/pe2b-staging-deploy` = `a651de6563b09025adec91ceb84dfa7933088a48` |

| packed-refs branch | **INDETERMINADO** drift | packed-refs ainda lista `bd38019…` para mesma branch |

| Tag `pe2b-adapter-boundary-safe` | **VALIDADO** local | packed-refs → `73bca758789ad6ba23561f9f5695abb2b20a3a9d` |

| Tag `pe2b-staging-ready` | **NÃO VALIDADO** | ausente em packed-refs; certificação doc = não criada |

| HEAD remoto / ancestry PE.2E–L | **INDETERMINADO** | shell/`ls-remote` bloqueados |

| Working tree limpa | **NÃO VALIDADO** | shell bloqueado; snapshot conversacional inicial indicava árvore suja com artefatos PE.2* |

| PE.2E→PE.2L no filesystem workspace | **VALIDADO** (presente) | ex.: `ProviderResolver.js`, `IdempotencyStore.js`, scripts PE.2M — **não prova inclusão na release pinada** |

| Referência imutável publicada | **NÃO VALIDADO** | freeze PIPELINE.2A NO-GO histórico |



---



## FASE 2 — Release candidate



| Candidata | SHA | Contém PE.2E–L? | Status |

|-----------|-----|-----------------|--------|

| `pe2b-adapter-boundary-safe` | `73bca75…` | **Não comprovado** (âncora PE.2B) | tag local existe |

| `pe2b-staging-ready` | **PENDING** | **Não** | tag não criada; manifest inválido para deploy |

| Branch tip `a651de65…` | tip pré-freeze | **Não comprovado** PE.2E–L | incompleta vs PE.2M |

| Workspace sujo PE.2E–M | n/a | Código presente localmente | **não é release** |



**Referência a usar hoje:** **nenhuma** — freeze obrigatório HITL antes de qualquer deploy Shadow da série PE.2E→L.



**Risco de checkout incompleto:** **ALTO** se alguém dispara o workflow agora (tag ausente / SHA placeholder).



---



## FASE 3 — Workflow



Arquivo: `.github/workflows/backend-deploy-staging.yml`



| Requisito | Status |

|-----------|--------|

| Somente `workflow_dispatch` | **OK** |

| Confirm `STAGING` | **OK** |

| App fixo staging | **OK** |

| Config `fly.staging.toml` | **OK** |

| Sem deploy em `goldeouro-backend-v2` | **OK** (só gate read-only `/meta` prod) |

| Timeout 35 / concurrency staging | **OK** |

| permissions `contents: read` | **OK** |

| Checkout pin `RELEASE_REF` | **OK desenho / FAIL dados** (ref não published + SHA pending) |

| Input não troca app/config/release | **OK** — único input `confirm` |

| Health / meta pós-deploy | **OK** |

| Produção read-only gate | **OK** |

| Rollback automático no fail | **Parcial** — mensagem recomenda rollback; não executa auto-rollback |

| Oito flags `false` | **PARCIAL** — só `PE_ADAPTER_BOUNDARY_ENABLED` |

| Smoke PE.2M pós-deploy | **AUSENTE** no workflow |

| Mutação secrets no workflow | **SIM** (`flyctl secrets set`) — esperado no deploy futuro, não neste gate |



`PROD_DB_REF` no YAML serve para **bloquear cruzamento**, não para apontar staging a prod.



---



## FASE 4 — Fly staging vs prod



| | Staging (`fly.staging.toml`) | Prod (`fly.toml`) |

|--|------------------------------|-------------------|

| app | `goldeouro-backend-staging` | `goldeouro-backend-v2` |

| NODE_ENV | staging | production |

| DATABASE_ENV | staging | (ausente no toml; prod via secrets) |

| processes | só `app` | `app` + `payout_worker` |

| memory | 512 MB | 256 MB |

| productionRuntime | via código/`NODE_ENV` | production |

| health | `/health` | `/health` |

| ref prod app | **ausente** | — |



---



## FASE 5 — Banco



| Ref | Uso |

|-----|-----|

| `uatszaqzdqcwnfbipoxg` | Staging (workflow) |

| `gayopagjdrkcmkirmfvy` | Produção (somente guard anti-cruzamento) |



Schema/migration exigidos pelo primeiro deploy Shadow (flags OFF): **nenhum** documentado.  

DATABASE_URL live: **INDETERMINADO** (não listar secrets).



---



## FASE 6 — Oito flags



| Flag | Default código | Staging predeploy esperado | Shadow phase 1 | Rollback |

|------|----------------|----------------------------|----------------|----------|

| `PE_ADAPTER_BOUNDARY_ENABLED` | false | **false** (workflow set) | false | set false |

| `PE_DEPOSIT_CLAIM_PORT_ENABLED` | false | **false** (explícito HITL) | false | unset/false |

| `PE_IDEMPOTENCY_PORT_ENABLED` | false | **false** | false | unset/false |

| `PE_WEBHOOK_STORE_PORT_ENABLED` | false | **false** | false | unset/false |

| `PE_CORE_FINANCE_BOUNDARY_ENABLED` | false | **false** | false | unset/false |

| `PE_PAYOUT_BOUNDARY_ENABLED` | false | **false** | false | unset/false |

| `PE_RUNTIME_BOUNDARY_ENABLED` | false | **false** | false | unset/false |

| `PE_PROVIDER_BOUNDARY_ENABLED` | false | **false** | false | unset/false |



**Lacuna documentada (não corrigida neste gate):** workflow não seta as 7 flags além do adapter.



Ordem segura futura (após GO): todas OFF no deploy → health/meta → só então HITL selecione flags ON uma a uma.



---



## FASE 7 — Secrets / permissões



| Item | Status |

|------|--------|

| `FLY_API_TOKEN` no repo | esperado pelo workflow; presença live **INDETERMINADO** daqui |

| Escopo token só staging | **INDETERMINADO** (mesmo secret tipicamente opera ambos apps) |

| Proteção contra app arbitrário | **via YAML guards**, não via token |

| Secrets prod no workflow staging | **não referenciados** como secrets de deploy prod |

| Flags booleanas via `secrets list` | **não prova valor** (regra do gate) |



---



## FASE 8 — Runtime baseline (read-only HTTP 2026-07-14)



### Staging `goldeouro-backend-staging`



| Campo | Valor |

|-------|-------|

| /health | `status=ok`, `database=connected` |

| environment | staging |

| productionRuntime | **false** |

| gitCommit | `b29d847` |

| gitTag | `payment-engine-v1-runtime-baseline` |

| paymentProvider | mercadopago (fallback legado ativo) |

| mercadoPago health | disconnected |

| payout_worker | não no toml staging |



### Produção `goldeouro-backend-v2` (somente referência)



| Campo | Valor |

|-------|-------|

| /health | `status=ok`, `database=connected` |

| environment | production |

| productionRuntime | **true** |

| gitCommit | `f21f310-p5pixout` |

| paymentProvider | asaas (primary) |

| mercadoPago | connected |



Produção **não** deve mudar neste deploy futuro.



---



## FASE 9 — Rollback (pré-certificado em desenho)



| # | Pergunta | Resposta |

|---|----------|----------|

| 1 | Commit/tag rollback | Baseline staging atual: **`b29d847` / `payment-engine-v1-runtime-baseline`** (ou release Fly anterior) |

| 2 | Comando | `flyctl releases rollback -a goldeouro-backend-staging` |

| 3 | Exige alteração de banco? | **NÃO** (flags OFF / sem migration) |

| 4 | Exige migration? | **NÃO** |

| 5 | Exige secret change? | Preferível reafirmar `PE_*=false`; não obrigatório se defaults |

| 6 | Tempo | ~2–5 min (doc rollback-hardening) |

| 7 | Sinais abort | ver Fase 10 |



Responsável: operador HITL. Sem tocar produção.



---



## FASE 10 — Abort imediato



Abort se: app ≠ staging · config ≠ `fly.staging.toml` · `productionRuntime=true` · `environment=production` · banco prod · qualquer PE flag `true` no 1º deploy · payout_worker ativo · health ≠ ok · DB disconnected · commit/tag divergente · migration pedida · secret ausente · rollback indisponível · referência indevida a produção · mutação financeira inesperada.



---



## FASE 11 — Plano exato do deploy FUTURO (não executar)



```text

STATUS = NO-GO — parâmetros abaixo são INTENT / gap analysis, não autorização



workflow     = backend-deploy-staging.yml

confirm      = STAGING

app          = goldeouro-backend-staging

config       = fly.staging.toml

all_pe_flags = false   # TODAS as oito — HITL deve garantir antes/depois



# BLOQUEADO até freeze HITL:

release_ref  = pe2b-staging-ready   # atualmente NÃO publicada / SHA PENDING

git_tag      = pe2b-staging-ready

git_commit   = <SHA real no release-manifest.json após freeze>



# Lacuna PE.2M: release acima é PE.2B — série PE.2E→L exige nova release pinada

# com ProviderResolver, RuntimeBoundary, ports, scripts PE.2M, etc.



health = https://goldeouro-backend-staging.fly.dev/health

meta   = https://goldeouro-backend-staging.fly.dev/meta

smoke  = node scripts/pe2m-shadow-final-smoke.mjs (pós-deploy local/CI — não no YAML)

verify = node scripts/verify-pe2m-shadow-final.mjs

rollback = flyctl releases rollback -a goldeouro-backend-staging

```



### Pré-requisitos HITL antes de reavaliar GO



1. Congelar commit que contenha PE.2E→PE.2L.1 + PE.2M estrutural.

2. Publicar tag imutável + SHA real em `release-manifest.json`.

3. Alinhar workflow `RELEASE_REF`/guards a essa release (fora deste gate — só documentado).

4. Garantir oito `PE_*=false` no app staging.

5. Working tree limpa no SHA de release.

6. Smoke/verify locais PASS no SHA.

7. Só então novo gate de autorização de deploy.



---



## Integridade deste gate



| Ação | Feita? |

|------|--------|

| Alterar código / workflow / fly.toml | **NÃO** |

| Commit / tag / push / deploy | **NÃO** |

| Secrets / banco / runtime | **NÃO** |

| Somente documentação | **SIM** |

