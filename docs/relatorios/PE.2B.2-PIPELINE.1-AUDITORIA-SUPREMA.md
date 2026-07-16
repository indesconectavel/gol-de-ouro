# PE.2B.2-PIPELINE.1 — Auditoria Suprema Read-Only do Pipeline Oficial



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2B.2-PIPELINE.1  

**Data:** 2026-07-10  

**Modo:** READ_ONLY_ABSOLUTO  

**Repositório:** `indesconectavel/gol-de-ouro`  

**Auditor:** Cursor Agent — evidências GitHub API + probes HTTP live + análise estática



---



## Declaração de integridade



| Ação proibida | Executada? |

|---------------|------------|

| Deploy | **NÃO** |

| Alteração de código | **NÃO** |

| Alteração Git (commit/push/tag/branch) | **NÃO** |

| Alteração Fly / secrets / runtime | **NÃO** |

| Alteração banco | **NÃO** |

| Execução de GitHub Actions | **NÃO** |

| Alteração de documentação pré-existente | **NÃO** |



**Limitação do ambiente:** shell local indisponível (`PowerShell LanguagePrimitives`). Evidências obtidas via GitHub API, HTTP probes e leitura read-only de arquivos locais.



---



## Resposta à pergunta principal



> O pipeline oficial está tecnicamente certificado para realizar o primeiro deploy da camada Shadow exclusivamente em staging?



# **NÃO**



O pipeline está **estruturalmente apto** e **isolado de produção**, mas **não está certificado** para execução imediata devido a bloqueadores operacionais e evidências críticas não verificadas.



---



## Decisão obrigatória



| Pergunta | Resposta |

|----------|----------|

| Pipeline certificado? | **NÃO** |

| Existe bloqueador? | **SIM** |

| Existe risco conhecido? | **SIM** |

| Existe risco para produção? | **SIM** (baixo, mitigável) |

| Existe risco não comprovado? | **SIM** |

| Pipeline apto para executar PE.2B.2? | **NO-GO** |



---



## ETAPA 1 — Auditoria Git



### Refs remotas (GitHub API @ 2026-07-10T17:57Z)



| Ref | SHA | Mensagem |

|-----|-----|----------|

| `pe/pe2b-staging-deploy` | `a651de6563b09025adec91ceb84dfa7933088a48` | `ci(staging): publish PE.2B.2 staging pipeline and governance docs` |

| `pe2b-adapter-boundary-safe` (tag) | `73bca758789ad6ba23561f9f5695abb2b20a3a9d` | `PE.2B: adapter boundary shadow layer (SAFE, flag default false)` |

| `main` | `22f75f71ce60b60474de8470a4fee7ddfcc5d88f` | (sem merge da branch PE) |



### Ancestry (linear, validado)



```

… → 73bca75 (PE.2B técnico, tag)

      └── bd38019 (FIXPRE documental)

            └── a651de6 (FIXPIPE pipeline)

```



| Check | Status | Evidência |

|-------|--------|-----------|

| Linearidade | **VALIDADO** | Compare API: `ahead_by: 2`, `behind_by: 0` tag→branch |

| Merge inesperado | **VALIDADO** | Ausente; `main` ≠ branch PE |

| Parent `bd38019` | **VALIDADO** | Parent = `73bca75` (GitHub commit API) |

| Parent `a651de6` | **VALIDADO** | Parent = `bd38019` (GitHub commit API) |

| Commits ausentes | **VALIDADO** | Nenhum gap na cadeia tag→branch |

| Referências quebradas | **VALIDADO** | Tag e branch resolvem no GitHub |

| Divergência `main` vs PE | **VALIDADO** | Branch PE não mergeada em `main` |

| Working tree local | **INDETERMINADO** | Shell indisponível; git status não executado |

| HEAD local | **VALIDADO** | `.git/refs/heads/pe/pe2b-staging-deploy` = `a651de6` |



---



## ETAPA 2 — Auditoria da Release



### Release Candidate certificada



**Branch `pe/pe2b-staging-deploy` @ `a651de6`** — representa a **release completa** para deploy staging.



A tag `pe2b-adapter-boundary-safe` @ `73bca75` é **âncora técnica do código PE.2B**, mas **insuficiente** para deploy (ausência de artefatos de pipeline).



### Comparação TAG vs BRANCH



| Artefato | Tag `73bca75` | Branch `a651de6` |

|----------|---------------|------------------|

| Código PE.2B (adapter boundary) | ✅ | ✅ (herdado) |

| Smoke `pe2b-adapter-boundary-smoke.mjs` | ✅ | ✅ |

| Rollback `rollback-plan.md` | ✅ | ✅ |

| `fly.staging.toml` | ❌ **404** | ✅ **200** |

| `backend-deploy-staging.yml` | ❌ **404** | ✅ **200** |

| Governança pipeline | ❌ | ✅ |

| git-clean-report.json | ❌ | ✅ |



**Evidência tag sem fly.staging.toml:**  

`GET .../contents/fly.staging.toml?ref=pe2b-adapter-boundary-safe` → **404**



**Evidência branch com fly.staging.toml:**  

`GET .../contents/fly.staging.toml?ref=pe/pe2b-staging-deploy` → **200**



### Parâmetros de deploy certificados



```

confirm       = STAGING

release_ref   = pe/pe2b-staging-deploy    ← OBRIGATÓRIO (não usar default)

git_tag       = pe2b-adapter-boundary-safe

```



---



## ETAPA 3 — Auditoria Completa do Pipeline



**Arquivo:** `.github/workflows/backend-deploy-staging.yml`  

**Publicado em:** `pe/pe2b-staging-deploy` @ `a651de6` (GitHub Contents API 200)



### Validação estrutural



| Componente | Status | Detalhe |

|------------|--------|---------|

| `workflow_dispatch` only | **VALIDADO** | Sem `push`/`pull_request` |

| Confirmação `STAGING` | **VALIDADO** | Fail-fast se ≠ `STAGING` |

| `release_ref` default | **VALIDADO** ⚠️ | `pe2b-adapter-boundary-safe` — **incompatível** com artefatos |

| `git_tag` default | **VALIDADO** | `pe2b-adapter-boundary-safe` |

| Checkout `release_ref` | **VALIDADO** | `actions/checkout@v4` |

| Build | **VALIDADO** | `npm ci` + `node -c server-fly.js` |

| Deploy | **VALIDADO** | `flyctl deploy --config fly.staging.toml --app goldeouro-backend-staging` |

| Rollback documentado | **VALIDADO** | Mensagem em gate `/health` |

| Guards anti-produção | **VALIDADO** | App, config, confirmação |

| Gate produção read-only | **VALIDADO** | Curl `/meta` produção pós-deploy |

| `permissions: contents: read` | **VALIDADO** | Mínimo necessário |

| `FLY_API_TOKEN` | **INDETERMINADO** | Presença no repo não verificável remotamente |

| Fail-fast (`set -euo pipefail`) | **VALIDADO** | Todos os steps críticos |

| Timeout | **VALIDADO** | 35 minutos |

| Concurrency | **VALIDADO** | `fly-staging-deploy-goldeouro-backend-staging`, `cancel-in-progress: false` |

| Environment GitHub | **VALIDADO** | Nenhum `environment:` prod declarado |

| Migrations | **VALIDADO** | Ausente no workflow |



### Caminhos para produção



| Cenário | Probabilidade | Impacto | Mitigação |

|---------|---------------|---------|-----------|

| Deploy em `goldeouro-backend-v2` | **Nula** (código) | Crítico | `FLY_APP_NAME` hardcoded staging + guards |

| Uso de `fly.toml` prod | **Nula** (código) | Crítico | Guard aborta se config ≠ `fly.staging.toml` |

| `flyctl secrets set` em produção | **Nula** (código) | Alto | `-a goldeouro-backend-staging` explícito |

| Trigger automático em push PE | **Nula** | Alto | Somente `workflow_dispatch` |

| `backend-deploy.yml` disparado por PE | **Baixa** | Crítico | PE não mergeada em `main`; prod workflow paths-filtered |

| Operador usa default `release_ref` | **Alta** | Médio | Falha em `test -f fly.staging.toml` — **não atinge produção** |

| `FLY_API_TOKEN` com escopo prod | **INDETERMINADO** | Crítico | Token Fly org-wide — depende de permissões do token |



### Bloqueador operacional adicional



O workflow **não aparece** na lista de workflows registrados do GitHub Actions API (`total_count: 13`, sem staging). O arquivo existe apenas na branch `pe/pe2b-staging-deploy`, **não em `main`**. Dispatch via UI pode exigir seleção explícita da branch ou API.



---



## ETAPA 4 — Auditoria Fly



**Arquivo:** `fly.staging.toml` (branch `a651de6`, GitHub 200)



| Check | Valor | Status |

|-------|-------|--------|

| App | `goldeouro-backend-staging` | **VALIDADO** |

| Processos | `app = node server-fly.js` only | **VALIDADO** |

| Worker payout | Ausente | **VALIDADO** |

| Memória | 512 MB | **VALIDADO** |

| CPU | 1 shared | **VALIDADO** |

| Health check | `/health`, 30s | **VALIDADO** |

| `NODE_ENV` | `staging` | **VALIDADO** |

| `DATABASE_ENV` | `staging` | **VALIDADO** |

| Referência `goldeouro-backend-v2` | Ausente | **VALIDADO** |

| Referência `fly.toml` prod | Ausente | **VALIDADO** |

| Mounts | Ausentes | **VALIDADO** |



**Produção (`fly.toml`):** `app = goldeouro-backend-v2`, `payout_worker` ON — **não referenciado** pelo pipeline staging.



---



## ETAPA 5 — Auditoria Runtime



**Probe live @ 2026-07-10T17:57Z**



### Staging (`goldeouro-backend-staging`)



| Campo | Valor |

|-------|-------|

| `/health.status` | `ok` |

| `database` | `connected` |

| `/meta.environment` | `staging` |

| `gitCommit` | `b29d847` (baseline pré-PE.2B) |

| `gitTag` | `payment-engine-v1-runtime-baseline` |

| `productionRuntime` | `false` |

| `asaasEnv` | `sandbox` |

| `paymentProvider` | `mercadopago` (legacy) |

| `/health/workers.payoutWorker.enabledByEnv` | `false` |



### Produção (`goldeouro-backend-v2`)



| Campo | Valor |

|-------|-------|

| `/health.status` | `ok` |

| `/meta.environment` | `production` |

| `gitCommit` | `f21f310-p5pixout` |

| `productionRuntime` | `true` |

| `paymentProvider` | `asaas` (primary) |

| `asaasEnv` | `production` |

| PIX OUT | habilitado |



### Comparação staging vs produção



| Dimensão | Staging | Produção | Isolamento |

|----------|---------|----------|------------|

| App Fly | `goldeouro-backend-staging` | `goldeouro-backend-v2` | **VALIDADO** |

| `productionRuntime` | `false` | `true` | **VALIDADO** |

| PSP | sandbox/legacy | production/asaas | **VALIDADO** |

| Worker payout | OFF | ON | **VALIDADO** |

| Deploy PE.2B executado | **NÃO** | N/A | **VALIDADO** |



---



## ETAPA 6 — Auditoria Banco



| Check | Status | Evidência |

|-------|--------|-----------|

| Supabase staging ref documentado | **VALIDADO** | `uatszaqzdqcwnfbipoxg` (governança H2A/G2) |

| Supabase produção ref documentado | **VALIDADO** | `gayopagjdrkcmkirmfvy` |

| `DATABASE_ENV=staging` no manifest | **VALIDADO** | `fly.staging.toml` |

| `DATABASE_URL` no manifest staging | **VALIDADO** | Ausente (correto — via Fly secrets) |

| Staging acessa banco produção | **INDETERMINADO** | `DATABASE_URL` Fly não inspecionável remotamente |

| Runtime staging DB connected | **VALIDADO** | `/health` staging |

| Migrations no pipeline | **VALIDADO** | Ausentes |

| PE.2B altera schema | **VALIDADO** | Shadow only; sem migrations |



**Nota:** Isolamento de banco inferido por `DATABASE_ENV=staging` + refs documentadas + runtime sandbox; valor real de `DATABASE_URL` em Fly secrets é **INDETERMINADO**.



---



## ETAPA 7 — Auditoria Secrets



| Secret | Escopo | Status |

|--------|--------|--------|

| `FLY_API_TOKEN` | Repositório GitHub | **INDETERMINADO** (não listável via API pública) |

| `PE_ADAPTER_BOUNDARY_ENABLED` | Fly staging | **INDETERMINADO** (valor não verificável) |

| `GIT_TAG` | Fly staging (set pelo workflow) | **VALIDADO** (comportamento documentado) |

| `NODE_ENV` | Fly staging | **VALIDADO** (`staging` no manifest + workflow set) |

| `DATABASE_ENV` | Fly staging | **VALIDADO** (`staging`) |

| Secrets produção alteradas | — | **VALIDADO** (nenhuma operação de escrita) |



### Bloqueador B-01



`PE_ADAPTER_BOUNDARY_ENABLED=false` **não confirmado** live.



- Workflow valida apenas **existência** do secret, não valor `false`.

- `git-clean-report.json` (FIXPRE) afirma `false`, mas é evidência **documental**, não independente.

- Regra PE.2B: **dúvida → abortar**.



---



## ETAPA 8 — Auditoria Rollback



| Camada | Mecanismo | Status |

|--------|-----------|--------|

| Fly runtime | `flyctl releases rollback -a goldeouro-backend-staging` | **VALIDADO** (documentado) |

| Baseline conhecida | `b29d847` / `payment-engine-v1-runtime-baseline` | **VALIDADO** (runtime live) |

| Flag | `PE_ADAPTER_BOUNDARY_ENABLED=false` | **VALIDADO** (código default + doc) |

| Git técnico | `pe2b-adapter-boundary-safe` @ `73bca75` | **VALIDADO** |

| Release completa | `pe/pe2b-staging-deploy` @ `a651de6` | **VALIDADO** |

| Workflow rollback step | Mensagem em falha `/health` | **VALIDADO** |

| Lista releases Fly | — | **INDETERMINADO** |

| Tempo estimado rollback | 2–5 min (Fly) + 1–2 min (health gate) | **VALIDADO** (documental) |



### Critérios de abort (workflow + governança)



1. Confirmação ≠ `STAGING`

2. `fly.staging.toml` ausente no ref

3. `PE_ADAPTER_BOUNDARY_ENABLED` ausente

4. `/health` ou `/meta` falham pós-deploy

5. `productionRuntime=true` em staging

6. Produção `/meta` alterada



---



## ETAPA 9 — Auditoria de Segurança



| Cenário | Prob. | Impacto | Mitigação |

|---------|-------|---------|-----------|

| Alterar produção via pipeline | **Muito baixa** | Crítico | Guards app/config; hardcoded staging |

| Usar `fly.toml` prod | **Nula** (código) | Crítico | Guard explícito |

| Usar app produção | **Nula** (código) | Crítico | `FLY_APP_NAME` fixo |

| Usar banco produção | **Baixa** | Crítico | `DATABASE_ENV=staging`; verificar `DATABASE_URL` manualmente |

| Alterar secrets produção | **Nula** (código) | Alto | Workflow só escreve em staging app |

| Executar worker produção | **Nula** | Alto | `fly.staging.toml` sem `payout_worker` |

| Ativar flag indevida | **Média** | Alto | Workflow não seta flag; valor **INDETERMINADO** |

| Executar migrations | **Nula** | Alto | Ausente no pipeline e PE.2B |



**Risco residual para produção:** existe em cenário de **erro operacional humano** (deploy manual com `fly.toml` + `goldeouro-backend-v2`). O pipeline oficial **não contém** esse caminho.



---



## ETAPA 10 — Mapa de Evidências



Ver `docs/payment-engine/staging/pipeline-evidence-map.json`.



Classificação geral:



| Categoria | VALIDADO | INDETERMINADO | NÃO VALIDADO |

|-----------|----------|---------------|--------------|

| Git refs/ancestry | 9 | 1 | 0 |

| Release candidate | 8 | 0 | 2 (tag incompleta — by design) |

| Workflow estrutura | 18 | 2 | 0 |

| Fly config | 11 | 0 | 0 |

| Runtime live | 14 | 0 | 0 |

| Secrets/flags | 3 | 4 | 0 |

| Rollback | 7 | 1 | 0 |



---



## Matriz de Risco



Ver `docs/payment-engine/staging/pipeline-risk-matrix.json`.



| Dimensão | Nível (1–5) |

|----------|-------------|

| Risco Git | 2.0 |

| Risco Workflow | 2.5 |

| Risco Fly | 1.5 |

| Risco Runtime | 2.0 |

| Risco Banco | 2.0 |

| Risco Secrets | 3.5 |

| Risco Rollback | 2.0 |

| Risco Produção | 1.5 |

| Risco Payment Engine | 2.5 |

| **Índice geral** | **2.2 / 5** |



---



## Bloqueadores (NO-GO)



| ID | Descrição | Severidade |

|----|-----------|------------|

| **B-01** | `PE_ADAPTER_BOUNDARY_ENABLED=false` não confirmado live em staging | **BLOQUEADOR** |

| **B-02** | Default `release_ref=pe2b-adapter-boundary-safe` falha validação (`fly.staging.toml` ausente na tag) | **BLOQUEADOR OPERACIONAL** |

| **B-03** | Workflow staging não registrado em `main` (ausente na API de 13 workflows) | **BLOQUEADOR OPERACIONAL** |

| **B-04** | `FLY_API_TOKEN` e `DATABASE_URL` staging não verificados | **INDETERMINADO CRÍTICO** |



---



## Desbloqueio mínimo para GO



1. `fly secrets list -a goldeouro-backend-staging` → confirmar `PE_ADAPTER_BOUNDARY_ENABLED` presente; operador confirma valor `false`.

2. Dispatch com `release_ref=pe/pe2b-staging-deploy` (nunca apenas tag default).

3. Selecionar branch `pe/pe2b-staging-deploy` no GitHub Actions (ou merge workflow em `main`).

4. Pós-deploy: `/health`, `/meta`, smoke `pe2b-adapter-boundary-smoke.mjs`.

5. Confirmar produção `/meta` permanece `f21f310-p5pixout`.



---



## Entregáveis



| Arquivo |

|---------|

| `docs/relatorios/PE.2B.2-PIPELINE.1-AUDITORIA-SUPREMA.md` |

| `docs/payment-engine/staging/pipeline-supreme-audit.json` |

| `docs/payment-engine/staging/pipeline-risk-matrix.json` |

| `docs/payment-engine/staging/pipeline-evidence-map.json` |

| `docs/payment-engine/staging/pipeline-certification.json` |

| `docs/relatorios/snapshots/pe2b2-pipeline1-supreme-audit.json` |



---



## Veredito final



# **NO-GO**



O pipeline oficial de staging é **tecnicamente bem projetado**, **publicado na branch certificada** e **não possui caminho conhecido no código para atingir produção**. Porém, pelos critérios de aprovação deste gate, **não emite PASS** porque:



1. Evidência crítica de flag staging é **INDETERMINADA**.

2. O default do workflow é **operacionalmente perigoso** (falha previsível com tag).

3. O workflow **não está em `main`** e não aparece na lista oficial de workflows.

4. Secrets Fly e token GitHub **não foram verificados** objetivamente.



**Produção permanece intocada** nesta auditoria e não será afetada enquanto o deploy não for executado.

