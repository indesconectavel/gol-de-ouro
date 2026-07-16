# PE.2B.2-PIPELINE.2 — Hardening Determinístico do Pipeline Oficial



**Projeto:** Gol de Ouro™ V1  

**Engine:** Indesconectável Payment Engine™  

**Gate:** PE.2B.2-PIPELINE.2  

**Data:** 2026-07-10  

**Modo:** IMPLEMENTAÇÃO CONTROLADA  



---



## Veredito



# **HARDENED — PARCIAL (NO-GO para PIPELINE.3)**



O pipeline foi **endurecido no repositório**. Bloqueadores B-01, B-02 e B-04 estão **resolvidos no design do workflow**. B-03 requer **publicação** (commit, tag, cherry-pick para `main`) antes de PIPELINE.3.



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** |

| Deploy executado? | **NÃO** |

| Pipeline endurecido? | **SIM** |

| Release determinística? | **SIM** |

| Workflow certificado? | **PARCIAL** (pendente publicação em `main`) |

| Bloqueadores eliminados? | **PARCIAL** (3/4 no código; B-03 pendente publish) |

| Pipeline apto para PIPELINE.3? | **NO-GO** |



---



## Bloqueadores resolvidos



### B-01 — `PE_ADAPTER_BOUNDARY_ENABLED` determinístico



**Antes:** workflow verificava apenas existência do secret; valor `false` era inferido.



**Depois:** o workflow **sempre** executa:



```bash

flyctl secrets set PE_ADAPTER_BOUNDARY_ENABLED=false -a goldeouro-backend-staging

```



e confirma via `flyctl ssh console` (exit code, **sem exibir valor**).



Também reaplica `false` no step de metadata pós-deploy.



**Arquivo:** `.github/workflows/backend-deploy-staging.yml`



---



### B-02 — Release única e imutável



**Antes:** `release_ref` default `pe2b-adapter-boundary-safe` (sem `fly.staging.toml`); operador precisava override manual.



**Depois:**



| Campo | Valor |

|-------|-------|

| Tag única | `pe2b-staging-ready` |

| `release_ref` | Imutável (removido do `workflow_dispatch`) |

| `git_tag` (/meta) | `pe2b-staging-ready` |

| SHA | `docs/payment-engine/staging/release-manifest.json` |



Guard aborta se `HEAD != manifest.release.sha`.



**Arquivos:**

- `docs/payment-engine/staging/release-manifest.json`

- `.github/workflows/backend-deploy-staging.yml`



**Ação pendente:** criar tag `pe2b-staging-ready` no commit PIPELINE.2 e atualizar `manifest.release.sha`.



---



### B-03 — Workflow publicado para dispatch manual



**Implementado:**

- Workflow endurecido com 15 guards

- `workflow_dispatch` only

- Documentação de cherry-pick para `main` (governança §8)



**Pendente:**

1. Commit + push `pe/pe2b-staging-deploy`

2. Tag `pe2b-staging-ready` → remoto

3. Cherry-pick **somente** workflow + manifest para `main` (sem código PE funcional)



Sem workflow em `main`, a UI do GitHub Actions não lista o dispatcher (API: 13 workflows, staging ausente).



---



### B-04 — Auditoria `FLY_API_TOKEN` e `DATABASE_URL`



**Gates adicionados no workflow:**



| Check | Método |

|-------|--------|

| `FLY_API_TOKEN` | Presente em `secrets` + `flyctl secrets list` staging |

| `DATABASE_URL` existe | Nome na listagem Fly |

| `DATABASE_URL` staging | `ssh console` + node exit-code ref `uatszaqzdqcwnfbipoxg` |

| Bloqueio produção | Aborta se URL contém `gayopagjdrkcmkirmfvy` |



**Script local read-only:** `scripts/pe2b-staging-secrets-audit.mjs`



Valores **nunca** são impressos em logs de sucesso.



---



## Hardening adicional



| Guard | Descrição |

|-------|-----------|

| G-01 a G-15 | Ver `docs/payment-engine/staging/guard-analysis.json` |

| Validação local | `node scripts/pe2b-staging-pipeline-validate.mjs` |

| Fail-fast | `set -euo pipefail` em todos os steps shell |

| Inputs removidos | `release_ref`, `git_tag` — elimina erro humano |



---



## Arquivos criados/modificados



| Arquivo | Ação |

|---------|------|

| `.github/workflows/backend-deploy-staging.yml` | **Modificado** — hardening completo |

| `docs/payment-engine/staging/release-manifest.json` | **Criado** |

| `scripts/pe2b-staging-pipeline-validate.mjs` | **Criado** |

| `scripts/pe2b-staging-secrets-audit.mjs` | **Criado** |

| `docs/payment-engine/staging/deployment-governance.md` | **Atualizado** |



---



## Testes executados



| Teste | Resultado |

|-------|-----------|

| Deploy | **NÃO** executado |

| GitHub Actions | **NÃO** executado |

| `pe2b-staging-pipeline-validate.mjs` | **INDETERMINADO** (shell indisponível) |

| Validação estática YAML/workflow | **SIM** (análise manual + script escrito) |



---



## Próximos passos (PIPELINE.3)



```bash

# 1. Commit PIPELINE.2

git add .github/workflows/backend-deploy-staging.yml docs/payment-engine/staging/ scripts/pe2b-staging-*.mjs docs/relatorios/

git commit -m "ci(staging): PE.2B.2-PIPELINE.2 deterministic pipeline hardening"



# 2. Atualizar SHA no manifest para o novo commit

# jq '.release.sha = "<NOVO_SHA>"' docs/payment-engine/staging/release-manifest.json



# 3. Tag determinística

git tag -a pe2b-staging-ready -m "PE.2B staging ready (PIPELINE.2)" <NOVO_SHA>

git push origin pe/pe2b-staging-deploy

git push origin pe2b-staging-ready



# 4. Cherry-pick workflow para main (pipeline-only)

git checkout main

git checkout pe/pe2b-staging-deploy -- .github/workflows/backend-deploy-staging.yml docs/payment-engine/staging/release-manifest.json

git commit -m "ci(staging): publish hardened staging workflow (PIPELINE.2)"

git push origin main



# 5. Validar local

node scripts/pe2b-staging-pipeline-validate.mjs

node scripts/pe2b-staging-secrets-audit.mjs   # requer flyctl autenticado

```



---



## Integridade



| Ação | Executada? |

|------|------------|

| Produção tocada | **NÃO** |

| Staging runtime alterado | **NÃO** |

| Deploy | **NÃO** |

| Payment Engine produtiva alterada | **NÃO** |



---



## Entregáveis



| Arquivo |

|---------|

| `docs/relatorios/PE.2B.2-PIPELINE.2-HARDENING.md` |

| `docs/payment-engine/staging/pipeline-hardening.json` |

| `docs/payment-engine/staging/pipeline-determinism.json` |

| `docs/payment-engine/staging/release-hardening.json` |

| `docs/payment-engine/staging/security-hardening.json` |

| `docs/payment-engine/staging/guard-analysis.json` |

| `docs/payment-engine/staging/rollback-hardening.json` |

| `docs/relatorios/snapshots/pe2b2-pipeline2-hardening.json` |

