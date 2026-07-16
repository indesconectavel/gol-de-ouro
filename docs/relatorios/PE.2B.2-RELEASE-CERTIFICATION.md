# PE.2B.2-RELEASE — Certificação da Release de Staging



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2B.2-RELEASE  

**Data:** 2026-07-09  

**Modo:** READ_ONLY_ABSOLUTO  



---



## Resposta à pergunta principal



> Qual é a release correta e certificada para realizar o primeiro deploy PE.2B em staging?



# **Branch `pe/pe2b-staging-deploy` @ `a651de6`**



Com identidade técnica PE.2B ancorada em:



| Campo | Valor |

|-------|-------|

| Commit técnico PE.2B | `73bca758789ad6ba23561f9f5695abb2b20a3a9d` |

| Tag técnica (metadata) | `pe2b-adapter-boundary-safe` |

| Checkout para deploy | `pe/pe2b-staging-deploy` → `a651de6563b09025adec91ceb84dfa7933088a48` |



**Opção certificada: B** — não usar a tag sozinha para checkout/deploy.



---



## Veredito



# **PASS COM RESSALVAS**



| Pergunta | Resposta |

|----------|----------|

| Release certificada? | **SIM** (branch @ `a651de6`) |

| Existe inconsistência? | **SIM** (tag vs branch) |

| Existe bloqueador? | **SIM** |

| Deploy PE.2B pode utilizar esta release? | **NO-GO** (até precondições abaixo) |



---



## 1. Auditoria Git



### Refs remotas (GitHub API)



| Ref | SHA | Mensagem |

|-----|-----|----------|

| `pe/pe2b-staging-deploy` | `a651de6` | ci(staging): publish PE.2B.2 staging pipeline and governance docs |

| `pe2b-adapter-boundary-safe` | `73bca75` | PE.2B: adapter boundary shadow layer (SAFE, flag default false) |

| `main` | `22f75f7` | (sem merge da branch PE) |



### Ancestry (linear)



```

… → 73bca75 (PE.2B técnico, tag)

      └── bd38019 (FIXPRE documental)

            └── a651de6 (FIXPIPE pipeline)

```



| Check | Resultado |

|-------|-----------|

| Linearidade | ✅ 2 commits documentais/infra após tag técnica |

| Merge inesperado | ✅ Ausente |

| `bd38019` parent | ✅ `73bca75` |

| `a651de6` parent | ✅ `bd38019` (via commit API) |



---



## 2. Auditoria da Tag `pe2b-adapter-boundary-safe`



**SHA:** `73bca758789ad6ba23561f9f5695abb2b20a3a9d`



| Artefato | Na tag? |

|----------|---------|

| Adapter boundary (código PE.2B) | ✅ |

| Smoke `pe2b-adapter-boundary-smoke.mjs` | ✅ |

| Rollback `rollback-plan.md` | ✅ |

| Snapshots PE.2B | ✅ |

| Documentação adapter-boundary | ✅ |

| **Workflow staging** | ❌ **404 GitHub** |

| **fly.staging.toml** | ❌ **404 GitHub** |

| deployment-governance.md | ❌ |

| git-clean-report.json | ❌ (adicionado em `bd38019`) |



**Conclusão:** A tag é a **âncora técnica do código PE.2B**, mas **não é release completa** para deploy staging.



---



## 3. Auditoria da Branch `pe/pe2b-staging-deploy`



**SHA:** `a651de6563b09025adec91ceb84dfa7933088a48`



| Artefato | Na branch (GitHub)? |

|----------|---------------------|

| fly.staging.toml | ✅ |

| backend-deploy-staging.yml | ✅ |

| deployment-governance.md | ✅ |

| git-clean-report.json | ✅ |

| pipeline-audit.json | ✅ |

| workflow-validation.json | ✅ |

| fly-config-validation.json | ✅ |

| Adapter boundary | ✅ (via ancestry `73bca75`) |

| Rollback | ✅ |

| Smoke | ✅ |



**Nota:** Relatórios gerados em sessões posteriores (GO, STAGING-DEPLOY) podem existir apenas localmente — não invalidam a certificação da branch publicada em `a651de6`.



---



## 4. Comparação TAG vs BRANCH



| Categoria | Tag `73bca75` | Branch `a651de6` |

|-----------|---------------|------------------|

| Código PE.2B | ✅ | ✅ (herdado) |

| fly.staging.toml | ❌ | ✅ |

| Workflow staging | ❌ | ✅ |

| Governança pipeline | ❌ | ✅ |

| FIXPRE report | ❌ | ✅ |

| Arquivos exclusivos da tag | — | nenhum |

| Commits à frente | — | +2 (`bd38019`, `a651de6`) |



**Arquivos críticos ausentes na tag:**



1. `fly.staging.toml` — **BLOQUEADOR** (workflow aborta sem ele)

2. `.github/workflows/backend-deploy-staging.yml`



---



## 5. Workflow



Arquivo publicado em `pe/pe2b-staging-deploy` — validado via raw GitHub.



| Check | OK |

|-------|-----|

| `workflow_dispatch` only | ✅ |

| Confirmação `STAGING` | ✅ |

| `release_ref` default | `pe2b-adapter-boundary-safe` ⚠️ |

| `git_tag` default | `pe2b-adapter-boundary-safe` ✅ |

| `fly.staging.toml` exclusivo | ✅ |

| App `goldeouro-backend-staging` | ✅ |

| Deploy produção impossível | ✅ |

| Gate produção read-only | ✅ |

| Rollback documentado em governança | ✅ |



**Inconsistência:** default `release_ref` aponta para tag incompleta → operador **deve** usar `pe/pe2b-staging-deploy`.



---



## 6. Fly Config (`fly.staging.toml`)



| Check | Valor |

|-------|-------|

| App | `goldeouro-backend-staging` ✅ |

| NODE_ENV | `staging` ✅ |

| DATABASE_ENV | `staging` ✅ |

| Worker | OFF (somente `app`) ✅ |

| Memória | 512 MB ✅ |

| Referência produção | Ausente ✅ |



---



## 7. Release Candidate — Decisão



| Opção | Veredito |

|-------|----------|

| **A) tag `pe2b-adapter-boundary-safe`** | ❌ Insuficiente para deploy (sem `fly.staging.toml`) |

| **B) branch `pe/pe2b-staging-deploy`** | ✅ **CERTIFICADA** |

| **C) nova tag** | Recomendada pós-certificação (ver §8) |

| **D) nenhuma** | ❌ |



### Parâmetros de deploy certificados



**Workflow dispatch:**



```

confirm = STAGING

release_ref = pe/pe2b-staging-deploy

git_tag = pe2b-adapter-boundary-safe

```



**Deploy manual:**



```bat

git checkout pe/pe2b-staging-deploy

fly deploy --config fly.staging.toml --app goldeouro-backend-staging --build-arg GIT_COMMIT=73bca758789ad6ba23561f9f5695abb2b20a3a9d --remote-only

fly secrets set GIT_TAG=pe2b-adapter-boundary-safe NODE_ENV=staging DATABASE_ENV=staging -a goldeouro-backend-staging

```



---



## 8. Nova Tag Recomendada (NÃO CRIAR)



| Campo | Valor |

|-------|-------|

| Nome | `pe2b-staging-ready` |

| SHA alvo | `a651de6563b09025adec91ceb84dfa7933088a48` |

| Justificativa | Congela release completa (código PE.2B + pipeline + config), elimina ambiguidade tag vs branch, corrige default do workflow |



**Esta auditoria não cria nem move tags.**



---



## 9. Shadow Layer



| Princípio | Status |

|-----------|--------|

| Shadow only | ✅ |

| Flag default `false` | ✅ (código) |

| Rollback existente | ✅ |

| Interfaces preservadas | ✅ |

| Produção inalterada | ✅ (`f21f310-p5pixout`) |



---



## 10. Rollback



| Camada | Mecanismo |

|--------|-----------|

| Fly | `flyctl releases rollback -a goldeouro-backend-staging` |

| Runtime baseline | `b29d847` / `payment-engine-v1-runtime-baseline` |

| Flag | `PE_ADAPTER_BOUNDARY_ENABLED=false` |

| Git técnico | `pe2b-adapter-boundary-safe` @ `73bca75` |

| Release certificada | `pe/pe2b-staging-deploy` @ `a651de6` |



---



## 11. Matriz de Risco



| Dimensão | Nível |

|----------|-------|

| Produção | BAIXO |

| Staging | MÉDIO |

| Rollback | BAIXO |

| Runtime | BAIXO–MÉDIO |

| Banco | BAIXO |

| Payment Engine | MÉDIO |

| Git | MÉDIO |

| Workflow | MÉDIO |

| **Índice geral** | **2.6 / 5** (aceitável com ressalvas) |



### Bloqueadores operacionais (pré-deploy)



1. **R-GIT-01:** Tag técnica incompleta — usar branch no `release_ref`

2. **R-WF-01:** Workflow default `release_ref` incompatível — override obrigatório

3. **R-ENV-01:** `PE_ADAPTER_BOUNDARY_ENABLED=false` não confirmado live nesta auditoria



---



## 12. GO / NO-GO



| Decisão | Valor |

|---------|-------|

| Release certificada | **SIM** — branch `pe/pe2b-staging-deploy` @ `a651de6` |

| Inconsistência tag/branch | **SIM** |

| Bloqueador | **SIM** (3 itens acima) |

| **Deploy PE.2B.2** | **NO-GO** até desbloqueio |



### Desbloqueio mínimo



1. Confirmar `PE_ADAPTER_BOUNDARY_ENABLED=false` em staging (`fly secrets list`)

2. Dispatch com `release_ref=pe/pe2b-staging-deploy`

3. Revalidar com PE.2B.2-GO ou executar deploy



---



## Integridade



Nenhum código, Git, Fly, runtime ou secrets foi alterado. Apenas documentação certificadora.



---



## Entregáveis



| Arquivo |

|---------|

| `docs/relatorios/PE.2B.2-RELEASE-CERTIFICATION.md` |

| `docs/payment-engine/staging/release-certification.json` |

| `docs/payment-engine/staging/release-diff.json` |

| `docs/payment-engine/staging/release-candidate.json` |

| `docs/payment-engine/staging/release-risk-matrix.json` |

| `docs/relatorios/snapshots/pe2b2-release-certification.json` |

