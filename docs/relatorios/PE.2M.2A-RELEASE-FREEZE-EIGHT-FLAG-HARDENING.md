# PE.2M.2A — Release Freeze & Eight-Flag Hardening™



## Veredito: **PASS COM RESSALVAS**



| Campo | Valor |

|-------|-------|

| Gate | PE.2M.2A |

| Data | 2026-07-14 |

| Deploy | **NÃO** |

| Produção | **Intacta** |

| Workflow endurecido | **SIM** |

| Oito flags explícitas | **SIM** (YAML) |

| Release congelada/publicada | **NÃO** — pendente HITL |

| Tag criada | **NÃO** |

| SHA pinado | **NÃO** (`PENDING_HITL_FREEZE_COMMIT`) |

| PE.2M.2-RECHECK | **NO-GO** até freeze publish |

| PE.2M.3 | **NO-GO** |

| PB-05 | **Permanece aberto** |



### Ressalvas



1. Shell do agente bloqueado — sem `git commit` / `git tag` / `git push` neste ambiente.

2. Working tree historicamente suja (risco de mistura de escopo) — HITL deve commitar **somente** PE.2E–PE.2M.

3. Manifest permanece `frozen:false` até `node scripts/pe2m2a-release-freeze.mjs` + tag.



---



## FASE 1 — Git (auditoria)



| Item | Classificação |

|------|---------------|

| Branch candidata `pe/pe2b-staging-deploy` | **PASS** (`.git/HEAD`) |

| HEAD tip local `a651de65…` | **PASS** (ref file) — tip pré-RC |

| UMA release candidata nomeada | **PASS** → `pe2m-shadow-staging-ready` |

| Código fora do escopo na árvore | **FAIL risco** — possible mix; HITL filter |

| Commit pendente / arquivos pendentes | **INDETERMINADO** live (shell) / esperado **SIM** |

| Tag `pe2m-shadow-staging-ready` | **FAIL** (não criada) |

| Remoto sincronizado | **INDETERMINADO** |



---



## FASE 2 — Release Freeze (preparado)



- Tag candidata: **`pe2m-shadow-staging-ready`**

- Série declarada: PE.2E → PE.2M

- Manifest workflow: `docs/payment-engine/staging/release-manifest.json`

- Mirror: `docs/payment-engine/staging-final/release-manifest.json`

- Helper: `scripts/pe2m2a-release-freeze.mjs`

- Supersede: `pe2b-staging-ready` (incompleta para PE.2E–L)



**Oficialmente congelada?** **NÃO** até HITL pin.



---



## FASE 3–4 — Workflow + 8 flags



Arquivo: `.github/workflows/backend-deploy-staging.yml`



- `RELEASE_REF` / `GIT_TAG` = `pe2m-shadow-staging-ready`

- Exige `release.frozen == true` e SHA ≠ pending

- Pré e pós-deploy: **oito** `PE_*=false` via `flyctl secrets set` + verificação SSH

- Inputs: somente `confirm=STAGING` (sem app/config/release/SHA)



---



## FASE 5 — Banco



| Ambiente | Ref |

|----------|-----|

| Staging | `uatszaqzdqcwnfbipoxg` |

| Produção (guard) | `gayopagjdrkcmkirmfvy` |



Sem cruzamento no desenho.



---



## FASE 7 — Rollback



Documentado: Fly rollback app staging · flags all false · baseline `b29d847` · sem produção.



---



## HITL — fechar o freeze



```bat

cd /d "E:\Chute de Ouro\goldeouro-backend"

git checkout pe/pe2b-staging-deploy

REM stage SOMENTE arquivos PE.2E–PE.2M + workflow + docs staging

git commit -m "feat(pe): PE.2E-PE.2M shadow staging release candidate"

node scripts/pe2m2a-release-freeze.mjs

git add docs/payment-engine/staging/release-manifest.json docs/payment-engine/staging-final/release-manifest.json

git commit -m "chore(staging): pin pe2m-shadow-staging-ready"

node scripts/pe2m2a-release-freeze.mjs

REM ajuste final do SHA no manifesto para o commit pinado, se necessário

git tag -a pe2m-shadow-staging-ready -m "PE.2M shadow staging ready"

git push origin pe/pe2b-staging-deploy pe2m-shadow-staging-ready

```



Depois: **PE.2M.2-RECHECK** (read-only). **Sem deploy** até GO do recheck.



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Código alterado? | **SIM** (workflow + script + docs/manifests) |

| Produção / Deploy / Banco / Schema / Secrets / Runtime? | **NÃO** |

| Release congelada? | **NÃO** (preparada) |

| SHA pinado? | **NÃO** |

| Tag criada? | **NÃO** |

| Workflow endurecido? | **SIM** |

| Oito flags explícitas? | **SIM** |

| Banco staging confirmado? | **SIM** (desenho) |

| Rollback pronto? | **SIM** (documentado) |

| Release reproduzível / determinística? | **SIM no desenho** — falta pin publicado |

| PB-05 permanece? | **SIM** |

| PE.2M.2 autorizado? | **NO-GO** (recheck) |

| PE.2M.3 autorizado? | **NO-GO** |



### GO/NO-GO final



| Destino | Veredito |

|---------|----------|

| RC oficialmente congelada? | **NÃO** |

| Workflow pronto para 1º Shadow Deploy (estrutura)? | **SIM** |

| Bloqueador restante? | **SIM** — commit/tag/push HITL + tree limpa |

| **PE.2M.2-RECHECK** | **NO-GO** até freeze publish |


