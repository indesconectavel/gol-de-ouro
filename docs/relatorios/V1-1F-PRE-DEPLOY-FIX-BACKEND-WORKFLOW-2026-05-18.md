# V1.1F-PRE-DEPLOY-FIX — backend-deploy.yml (workflow file issue)

**Data:** 2026-05-18  
**Modo:** Correção CI · **sem deploy Fly** · **sem alteração de produção**

**PR:** (a abrir) `fix/v1-1f-pre-deploy-backend-workflow`  
**Contexto:** Após merge PR #98, `backend-deploy.yml` falhou com **0 jobs / 0s** e mensagem *workflow file issue* (runs `26063104787`, `26048286638`, etc.).

---

## 1. Causa raiz

| Item | Detalhe |
|------|---------|
| **Sintoma** | Run `failure` em **0s**, **0 jobs**; nome registado no GitHub como `.github/workflows/backend-deploy.yml` em vez de `🚀 Backend Deploy (Fly.io)` |
| **Ferramenta** | [actionlint](https://github.com/rhysd/actionlint) v1.7.7 |
| **Erro** | `context "env" is not allowed here` em `concurrency.group` |
| **Linhas** | L91 (`deploy-backend`), L188 (`deploy-dev`) |
| **Introduzido** | H3.6C (`77b6262` / `448d325`) — `group: fly-production-${{ env.FLY_APP_NAME }}` |

O schema do GitHub Actions **não permite** o contexto `env` em `concurrency.group` (apenas `github`, `inputs`, `matrix`, `needs`, `strategy`, `vars`). O ficheiro falha validação **antes** de criar jobs.

**Nota:** PyYAML local parseava o ficheiro como válido — o problema é específico do **schema Actions**, não de indentação YAML.

---

## 2. Correção aplicada

Substituir expressões inválidas por literais alinhados a `env.FLY_APP_NAME: goldeouro-backend-v2`:

```diff
- group: fly-production-${{ env.FLY_APP_NAME }}
+ group: fly-production-goldeouro-backend-v2

- group: fly-dev-${{ env.FLY_APP_NAME }}
+ group: fly-dev-goldeouro-backend-v2
```

**Diff:** 1 ficheiro, +3 / −2 linhas (comentário explicativo na prod).

---

## 3. Validação local

| Check | Resultado |
|-------|-----------|
| actionlint `backend-deploy.yml` | **0 erros** (pós-fix) |
| PyYAML `safe_load` | **OK** |
| Paths funcionais (`server-fly.js`, `utils/**`, …) | **Inalterados** |
| Docs-only / `scripts/**` / `.github/**` | **Fora dos paths** (sem deploy automático) |
| Gates `/health` + `/meta.gitCommit` | **Inalterados** |
| Deployer único Fly | **Inalterado** (`deploy-backend` só `main` + `workflow_dispatch`) |
| `rollback.yml` trigger | Continua `🚀 Backend Deploy (Fly.io)` — nome volta a registar após fix |

---

## 4. Comportamento esperado pós-merge deste fix

| Evento | `backend-deploy` |
|--------|------------------|
| Push `main` **só** `.github/workflows/backend-deploy.yml` | **Não dispara** (path filter) — **sem deploy** |
| Push `main` `server-fly.js` / `utils/**` | Dispara **test-and-analyze** + **deploy-backend** |
| `workflow_dispatch` | Deploy manual com `release_sha` opcional |
| PR só workflow | **Não dispara** (paths PR iguais) |

---

## 5. Produção (read-only, durante esta missão)

| Probe | Valor |
|-------|-------|
| `/meta` `gitCommit` | `cacc127` |
| Fly release | `v460` |
| Player bundle | `index-B6M2smS9.js` |
| Deploy executado nesta missão | **Não** |

---

## 6. Veredito

| Veredito | **GO** para merge deste PR de fix |
|----------|-----------------------------------|
| Motivo | Causa raiz identificada e corrigida; actionlint limpo; escopo H3.6C preservado |
| Deploy controlado V1.1F | **Após** merge deste fix **e** janela explícita (`workflow_dispatch` ou push com paths backend) — não automático neste PR |

**NO-GO** para deploy Fly imediato só com este merge — path filter não republica runtime; V1.1F (`a83c3cf`) ainda não está em `/meta`.

---

## 7. Próximo passo (pós-merge do fix)

1. Merge PR fix workflow.  
2. `workflow_dispatch` em `backend-deploy.yml` com `release_sha=a83c3cf` (deploy controlado V1.1F) **ou** push que toque `server-fly.js` com gate humano.  
3. Validar `/meta.gitCommit` === SHA publicado e gates `/health`.

---

*Relatório V1.1F-PRE-DEPLOY-FIX — 2026-05-18.*
