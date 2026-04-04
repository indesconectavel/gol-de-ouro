# Fechamento oficial — pipeline frontend (nível enterprise)

**Data (UTC):** 2026-04-04  
**Modo:** governação e consolidação documental (sem alteração de lógica de jogo nem de comportamento de workflows além do já mergeado).  
**Âmbito:** `goldeouro-player`, GitHub Actions (`frontend-deploy.yml`, `frontend-rollback-manual.yml`), Vercel (`goldeouro-player`, equipa `goldeouro-admins-projects`).

---

## 1. Histórico resumido do problema original

| Fase | O que ocorreu |
|------|----------------|
| **Incidente PR #33 / pós-merge** | Produção pública (`www`) **mudou** o bundle mesmo com o job de deploy no Actions **a falhar** (`Project not found` ou erros CLI), evidenciando **mais do que um canal** até produção. |
| **Diagnóstico 2026-04-02** | Mapeamento do **duplo pipeline**: integração **Git ↔ Vercel** em paralelo a `frontend-deploy.yml`; no Actions, **incoerência de secrets** (`VERCEL_PROJECT_ID` / `VERCEL_ORG_ID`) impedia resolução estável do projeto. |
| **Bloqueio técnico adicional** | Avisos/erros ligados a **`vercel.json` vs root directory** e `working-directory` na action em conflito com o **Root Directory** no painel Vercel; necessidade de **alinhar CLI**, paths e versão. |
| **Correção e unificação** | Ajustes documentados em `CORRECAO-BLOQUEIO-VERCEL-CLI-FRONTEND-DEPLOY-2026-04-02.md` e `VALIDACAO-AUTOMATICA-PIPELINE-FRONTEND-VERCEL.md` (runs verdes, smoke 200). Política recomendada: **produção canónica via Actions** após secrets correctos e desalinhamento do segundo portão (Vercel Git) conforme `ELIMINACAO-DUPLO-PIPELINE-DEPLOY-2026-04-02.md`. |
| **Endurecimento enterprise** | PRs #43 / #44: gate pós-deploy, smoke com redirects (`-L`), health com gzip, outputs e sumário; workflow manual `frontend-rollback-manual.yml` (CLI 50, confirmação `ROLLBACK`). Ver `EVOLUCAO-PIPELINE-FRONTEND-NIVEL-ENTERPRISE-2026-04-04.md`. |
| **Última lacuna** | Rollback manual **tinha de ser provado em produção** com rastreabilidade; primeira tentativa sem **`--scope`** correcto falhou ou não alterou estado verificável (`Deployment belongs to a different team` / `Etag` inalterado). |

---

## 2. Causa raiz (consolidada)

1. **Governança de deploy:** dois gatilhos independentes (Actions e integração Vercel) sobre o mesmo repositório/branch, com **rastreabilidade e gates** só num deles — permitindo **drift** de produção sem “verde” no canónico.  
2. **Credenciais e contexto CLI no Actions:** par **org/projeto/token** incorrecto ou desalinhado → `Project not found` e pipelines frágeis.  
3. **Contexto de filesystem vs dashboard:** `working-directory` / root do projecto em conflito com onde o Vercel espera `vercel.json` e build — corrigido alinhando **root** e **versão da CLI** na action.  
4. **Rollback em CI:** invocação `vercel rollback` **sem** `--scope` da equipa correcta → CLI assume contexto errado → **“different team”** ou efeito não observável em `www`.

---

## 3. Correções aplicadas (síntese)

| Área | Acção |
|------|--------|
| **Secrets / IDs** | `VERCEL_PROJECT_ID` como `prj_…` e `VERCEL_ORG_ID` coerente com a equipa do projeto (validação operacional até deploy verde). |
| **Deploy canónico** | `frontend-deploy.yml`: versão pinada da CLI na action, remoção de `working-directory` em conflito com Root Directory Vercel; testes + build + deploy produção + smoke + health. |
| **Política de canais** | Documentação e decisão: **uma porta lógica** para produção (Actions), com desactivação/neutralização do deploy automático de produção via Git no Vercel conforme plano em relatórios de 2026-04-02. |
| **Enterprise** | Gate de URL de deployment, `GITHUB_STEP_SUMMARY`, smoke `-fsSL`, health `--compressed` + `-L`, workflow `frontend-rollback-manual.yml`. |
| **Rollback** | PR #46: `npx vercel@50.38.3 rollback … --scope goldeouro-admins-projects` (e variável `SCOPE` no YAML). |

---

## 4. Validação do deploy canónico

- **Evidência:** runs de sucesso após correção (ex.: referidos em `VALIDACAO-AUTOMATICA-PIPELINE-FRONTEND-VERCEL.md`: `23923449517`, `23923532565`); endurecimento posterior **verde** em merge PR #44 e `workflow_dispatch` (`23980726132`, `23980761562`) em `EVOLUCAO-PIPELINE-FRONTEND-NIVEL-ENTERPRISE-2026-04-04.md`.  
- **Critérios:** deploy produção concluído, smoke **www + apex** OK, health alinhado a redirects/gzip.  
- **Conclusão:** **deploy canónico validado** no período analisado.

---

## 5. Validação do rollback

- **Relatório detalhado:** `docs/relatorios/TESTE-REAL-ROLLBACK-FRONTEND-VERCEL-2026-04-04.md`.  
- **Execução:** `frontend-rollback-manual.yml`, `confirm=ROLLBACK`, `deployment_target=dpl_FQQ77aRVhaKp6g8pYWCehxuQQNfQ`, run **`23981435945`**.  
- **Prova:** mensagem CLI de sucesso + alteração verificável do estado servido em `www` (ex.: `Etag` distinto do pré-rollback).  
- **Conclusão:** **rollback validado em produção** com `--scope` correcto.

---

## 6. Validação da restauração

- **Acção:** `workflow_dispatch` em **Frontend Deploy (Vercel)** — run **`23981452088`**.  
- **Resultado:** novo deployment de produção (`dpl_G7hGaFuX65aZeFvkhX4tHkLvoMaB`), commit incluindo merge do workflow de rollback; gate + smoke + health **OK**.  
- **Conclusão:** **restauração ao estado pós-correção confirmada**; indisponibilidade não prolongada.

---

## 7. Dependências críticas (operacionais)

| Dependência | Motivo |
|-------------|--------|
| **Vercel CLI `50.38.3` (pinada no rollback)** | Comportamento estável e alinhado ao ensaiado em `npx vercel@50.38.3 rollback` no workflow manual. |
| **Deploy canónico sem `working-directory` em conflito** | O Root Directory no Vercel deve coincidir com a árvore onde está `vercel.json` e o build; `working-directory` incorrecto na action gerou avisos/erros documentados em 2026-04-02. |
| **`--scope goldeouro-admins-projects` no rollback** | Sem scope, a CLI pode resolver **outra equipa** → `Deployment belongs to a different team` ou rollback sem efeito observável em produção. |

*Secrets:* `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` permanecem **obrigatórios** e devem permanecer coerentes com o projeto real.

---

## 8. Referências cruzadas (trilho documental)

| Documento | Papel |
|-----------|--------|
| `ELIMINACAO-DUPLO-PIPELINE-DEPLOY-2026-04-02.md` | Duplo pipeline e decisão de canónico. |
| `DIAGNOSTICO-FINAL-GARGALO-ACTIONS-VERCEL-2026-04-02.md` | Gargalo Actions vs Vercel Git. |
| `CORRECAO-BLOQUEIO-VERCEL-CLI-FRONTEND-DEPLOY-2026-04-02.md` | Correção CLI/root. |
| `VALIDACAO-AUTOMATICA-PIPELINE-FRONTEND-VERCEL.md` | Estado pós-correção do deploy. |
| `EVOLUCAO-PIPELINE-FRONTEND-NIVEL-ENTERPRISE-2026-04-04.md` | Hardening e workflows enterprise. |
| `TESTE-REAL-ROLLBACK-FRONTEND-VERCEL-2026-04-04.md` | Prova de rollback + restauração. |

---

## 9. Veredito final

**PIPELINE ENTERPRISE VALIDADO**

O pipeline frontend encontra-se, nesta data de fechamento, **documental e operacionalmente** alinhado com: deploy canónico com gates e verificações HTTP, **rollback manual rastreável** em produção **comprovado**, **restauração** por redeploy verificada, e **dependências críticas** explícitas (CLI pinada, root/sem conflito de `working-directory`, `--scope` no rollback).

---

*Fim do fechamento oficial.*
