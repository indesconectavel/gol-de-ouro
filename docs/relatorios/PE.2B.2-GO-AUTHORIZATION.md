# PE.2B.2-GO — Autorização Final de Deploy



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2B.2-GO  

**Data:** 2026-07-09  

**Modo:** READ_ONLY_ABSOLUTO  

**Auditor:** Evidências GitHub API + probes HTTP live + análise estática



---



## Decisão



# NO-GO



---



## Respostas obrigatórias (Seção 8)



| Pergunta | Resposta |

|----------|----------|

| Produção será afetada? | **NÃO** (desde que deploy use exclusivamente staging) |

| Existe risco conhecido? | **SIM** |

| Existe bloqueador? | **SIM** |

| Deploy PE.2B.2 pode ser autorizado? | **NO-GO** |



---



## Justificativa técnica



A cadeia Git, o workflow staging, `fly.staging.toml`, a camada Shadow PE.2B, o rollback e o isolamento produção/staging estão **estruturalmente prontos**. Porém permanecem **dois bloqueadores operacionais** que impedem autorização incondicional:



### Bloqueador B-01 (mandatório)



**`PE_ADAPTER_BOUNDARY_ENABLED=false` não confirmado no Fly staging.**



- `fly secrets list` não pôde ser executado nesta auditoria (read-only remoto).

- O workflow valida apenas a **existência** do secret, não o valor `false`.

- Regra da série PE.2B: **dúvida sobre flag → abortar**.

- Sem confirmação objetiva, o deploy não pode ser autorizado.



**Desbloqueio:** `fly secrets list -a goldeouro-backend-staging` → confirmar `PE_ADAPTER_BOUNDARY_ENABLED` presente com valor `false` (ou setar antes do dispatch).



### Bloqueador B-02 (operacional)



**Tag `pe2b-adapter-boundary-safe` @ `73bca75` não contém `fly.staging.toml`.**



- O arquivo foi publicado no commit `a651de6` (FIXPIPE), posterior à tag técnica.

- O workflow default `release_ref=pe2b-adapter-boundary-safe` falhará no step `Validar artefatos staging` (`test -f fly.staging.toml`).

- Deploy manual com `git checkout pe2b-adapter-boundary-safe` + `fly deploy --config fly.staging.toml` também falha (arquivo ausente no ref).



**Desbloqueio:** usar `release_ref=pe/pe2b-staging-deploy` no workflow dispatch (head `a651de6`, ancestry inclui `73bca75`), **ou** retag após revisão formal.



---



## 1. Git



| Check | Resultado | Evidência |

|-------|-----------|-----------|

| Branch `pe/pe2b-staging-deploy` | ✅ | `a651de6563b09025adec91ceb84dfa7933088a48` |

| Tag `pe2b-adapter-boundary-safe` | ✅ | → `73bca758789ad6ba23561f9f5695abb2b20a3a9d` |

| Commit técnico | ✅ | `PE.2B: adapter boundary shadow layer (SAFE, flag default false)` |

| Commit documental `bd38019` | ✅ | Parent = `73bca75`; `docs: add PE.2B.2 FIXPRE git clean report` |

| Commit FIXPIPE `a651de6` | ✅ | Parent chain via `bd38019`; `ci(staging): publish PE.2B.2 staging pipeline` |

| Ancestry | ✅ | `73bca75` ← `bd38019` ← `a651de6` (linear, documental pós-técnico) |

| Merge em `main` | ✅ Ausente | `main` @ `22f75f71` ≠ branch @ `a651de6` |



---



## 2. Workflow (`backend-deploy-staging.yml`)



| Check | Resultado |

|-------|-----------|

| `workflow_dispatch` only | ✅ |

| Confirmação `STAGING` obrigatória | ✅ |

| `release_ref` default `pe2b-adapter-boundary-safe` | ✅ (com ressalva B-02) |

| App `goldeouro-backend-staging` | ✅ |

| Config `fly.staging.toml` exclusiva | ✅ |

| Guards anti-produção (`*v2*`, `fly.toml`) | ✅ |

| Gate produção read-only pós-deploy | ✅ |

| Deploy produção impossível neste workflow | ✅ |



Publicado no GitHub: ✅ `pe/pe2b-staging-deploy`



---



## 3. Fly (read-only) @ 2026-07-09T23:21Z



### Staging (`goldeouro-backend-staging`)



| Campo | Valor |

|-------|-------|

| App | `goldeouro-backend-staging` ✅ |

| `/health` | `ok`, DB connected |

| `environment` | `staging` |

| `gitCommit` | `b29d847` (baseline pré-PE.2B — deploy ainda não realizado) |

| `gitTag` | `payment-engine-v1-runtime-baseline` |

| `productionRuntime` | `false` ✅ |

| Provider efetivo | `mercadopago` (legacy) |

| `asaasEnv` | `sandbox` |

| Worker payout | OFF (`enabledByEnv: false`) ✅ |



### Produção (`goldeouro-backend-v2`)



| Campo | Valor |

|-------|-------|

| `/health` | `ok`, DB connected |

| `gitCommit` | `f21f310-p5pixout` |

| `environment` | `production` |

| `productionRuntime` | `true` |

| Provider | `asaas` primary |

| Intacta | ✅ |



---



## 4. Configuração (`fly.staging.toml`)



| Check | Resultado |

|-------|-----------|

| `app = goldeouro-backend-staging` | ✅ |

| `NODE_ENV = staging` | ✅ |

| `DATABASE_ENV = staging` | ✅ |

| Sem `goldeouro-backend-v2` | ✅ |

| Sem `DATABASE_URL` produção no manifest | ✅ |

| Sem `payout_worker` | ✅ (somente `app`) |

| Publicado no GitHub | ✅ branch `pe/pe2b-staging-deploy` |



---



## 5. Shadow Layer (PE.2B)



| Princípio | Status |

|-----------|--------|

| Shadow only (`SHADOW_COMPATIBILITY_FIRST`) | ✅ |

| Flag default `false` no código | ✅ `adapter-boundary-config.js` |

| `resolveAdapterBoundaryPorts()` → `null` quando flag off | ✅ |

| Interfaces produtivas preservadas | ✅ snapshot PE.2B |

| Zero alteração runtime produção | ✅ meta prod inalterada |

| Rollback documentado | ✅ `rollback-plan.md` |

| Produção flows ativados | ❌ (design) |



---



## 6. Rollback



| Camada | Mecanismo | Baseline |

|--------|-----------|----------|

| Fly runtime | `flyctl releases rollback -a goldeouro-backend-staging` | `b29d847` |

| Flag | `PE_ADAPTER_BOUNDARY_ENABLED=false` | default código |

| Git | `pe2b-adapter-boundary-safe` @ `73bca75` ou revert | tag técnica |

| Tag rollback | `payment-engine-v1-runtime-baseline` | `b29d847` |

| Release | `fly releases` listável | documentado |



Rollback **completo e documentado** — adequado para autorização condicional.



---



## 7. Matriz de risco



| Dimensão | Nível | Notas |

|----------|-------|-------|

| Risco produção | **BAIXO** | App/config/workflow isolados; gates read-only |

| Risco staging | **MÉDIO** | Primeiro deploy PE.2B; bootstrap only |

| Risco rollback | **BAIXO** | Baseline `b29d847` conhecida; `fly releases rollback` |

| Risco runtime | **BAIXO–MÉDIO** | Depende de flag=false; smoke pós-deploy obrigatório |

| Risco banco | **BAIXO** | PE.2B sem migrations; staging DB isolado (`uatszaqzdqcwnfbipoxg`) |

| Risco Payment Engine | **MÉDIO** | Shadow carrega no bundle; fluxos legados permanecem com flag off |



---



## Condições para GO (após desbloqueio)



Autorizar deploy **somente** quando:



1. ✅ `fly secrets list -a goldeouro-backend-staging` confirma `PE_ADAPTER_BOUNDARY_ENABLED` com valor `false`

2. ✅ Workflow dispatch com `confirm=STAGING`, `release_ref=pe/pe2b-staging-deploy` (não apenas tag)

3. ✅ `git_tag=pe2b-adapter-boundary-safe` para `/meta`

4. ✅ Pós-deploy: `/health`, `/meta`, smoke `pe2b-adapter-boundary-smoke.mjs`

5. ✅ Produção `/meta` permanece `f21f310-p5pixout`



---



## Integridade da auditoria



| Ação | Executada? |

|------|------------|

| Deploy | **NÃO** |

| Alteração Fly/Git/runtime | **NÃO** |

| Alteração código | **NÃO** (apenas este relatório + snapshot) |



---



## Referências



- `docs/relatorios/snapshots/pe2b2-go-authorization.json`

- `docs/relatorios/PE.2B.2-FINAL-PRE-READONLY.md`

- `docs/relatorios/PE.2B.2-FIXPIPE.md`

- `docs/payment-engine/staging/deployment-governance.md`

