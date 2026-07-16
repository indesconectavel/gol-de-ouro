# PE.2B.2 — Deploy Controlado da Camada Shadow em Staging



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2B.2  

**Data:** 2026-07-09  

**Modo:** DEPLOY CONTROLADO — staging somente  

**Veredito:** **BLOCKED**



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** (permanece `b29d847`) |

| Deploy executado? | **NÃO** |

| Rollback executado? | **NÃO** |

| Health OK (pós-PE.2B)? | **NÃO** (deploy não realizado) |

| Meta OK (pós-PE.2B)? | **NÃO** |

| Smoke PASS? | **NÃO** |

| Shadow carregada (runtime)? | **NÃO** (não verificado) |

| Flag permanece false? | **INDETERMINADO** |

| Produção preservada? | **SIM** |

| Pronto para PE.2C? | **NO-GO** |



---



## Motivo do BLOCKED



1. **Terminal do agente indisponível** — impossível executar `fly deploy`, `fly secrets list` e `node scripts/pe2b-adapter-boundary-smoke.mjs`.

2. **`PE_ADAPTER_BOUNDARY_ENABLED=false` não confirmado** no Fly staging (pré-requisito obrigatório; regra: dúvida → abortar).

3. **Staging inalterado** — `/meta` ainda reporta `gitCommit=b29d847` (baseline pré-PE.2B).



---



## Pré-check (evidências obtidas)



| Check | Resultado |

|-------|-----------|

| Branch `pe/pe2b-staging-deploy` no GitHub | ✅ `a651de6…` |

| Tag `pe2b-adapter-boundary-safe` | ✅ → `73bca758…` |

| Workflow `backend-deploy-staging.yml` publicado | ✅ GitHub API 200 |

| `fly.staging.toml` publicado | ✅ GitHub API 200 |

| Produção intacta (pré) | ✅ `f21f310-p5pixout`, `productionRuntime=true` |

| Working tree clean | ⚠️ Indeterminado |

| Flag `PE_ADAPTER_BOUNDARY_ENABLED=false` | ❌ Não confirmado |



### Staging pré-deploy @ 2026-07-09T21:47Z



| Campo | Valor |

|-------|-------|

| `gitCommit` | `b29d847` |

| `gitTag` | `payment-engine-v1-runtime-baseline` |

| `environment` | `staging` |

| `productionRuntime` | `false` |

| `/health` | `ok`, DB connected |



---



## Deploy — NÃO EXECUTADO



Comando autorizado (para operador local):



```bat

cd /d "e:\Chute de Ouro\goldeouro-backend"

fly secrets list -a goldeouro-backend-staging

REM Confirmar PE_ADAPTER_BOUNDARY_ENABLED presente; se ausente:

REM fly secrets set PE_ADAPTER_BOUNDARY_ENABLED=false -a goldeouro-backend-staging



git checkout pe2b-adapter-boundary-safe

fly deploy --config fly.staging.toml --app goldeouro-backend-staging --build-arg GIT_COMMIT=73bca758789ad6ba23561f9f5695abb2b20a3a9d --remote-only



fly secrets set GIT_TAG=pe2b-adapter-boundary-safe NODE_ENV=staging DATABASE_ENV=staging -a goldeouro-backend-staging

```



**Proibido:** `fly.toml`, `goldeouro-backend-v2`.



Alternativa via GitHub Actions:



- Workflow: `Backend Deploy Staging (Fly.io)`

- `confirm` = `STAGING`

- `release_ref` = `pe2b-adapter-boundary-safe`

- `git_tag` = `pe2b-adapter-boundary-safe`



---



## Pós-deploy (pendente)



Após deploy bem-sucedido, executar:



```bat

curl -s https://goldeouro-backend-staging.fly.dev/health

curl -s https://goldeouro-backend-staging.fly.dev/meta

node scripts/pe2b-adapter-boundary-smoke.mjs

curl -s https://goldeouro-backend-v2.fly.dev/meta

fly releases -a goldeouro-backend-staging --limit 3

```



### Critérios de sucesso pós-deploy



| # | Critério |

|---|----------|

| 1 | Produção `f21f310-p5pixout` inalterada |

| 2 | Staging `/health` ok, `productionRuntime=false` |

| 3 | `/meta.environment=staging`, `gitCommit=73bca75…` |

| 4 | Smoke: `[PE.2B] adapter boundary smoke: PASS` |

| 5 | Flag permanece `false` (sem fluxos shadow ativos) |



---



## Rollback



Se deploy falhar ou pós-check falhar:



```bat

fly releases rollback -a goldeouro-backend-staging

```



Baseline conhecida: `b29d847` / `payment-engine-v1-runtime-baseline`.



**Nunca tocar produção.**



---



## Entregáveis



| Arquivo |

|---------|

| `docs/relatorios/PE.2B.2-STAGING-DEPLOY.md` |

| `docs/payment-engine/staging/deploy-report.json` |

| `docs/payment-engine/staging/runtime-validation.json` |

| `docs/payment-engine/staging/bootstrap-report.json` |

| `docs/payment-engine/staging/shadow-load-report.json` |

| `docs/relatorios/snapshots/pe2b2-staging-deploy.json` |



---



## Próximo passo



Executar o deploy **manualmente** (cmd externo ou workflow dispatch) e reabrir o gate com a saída dos comandos, ou corrigir o shell do Cursor e solicitar reexecução do PE.2B.2.

