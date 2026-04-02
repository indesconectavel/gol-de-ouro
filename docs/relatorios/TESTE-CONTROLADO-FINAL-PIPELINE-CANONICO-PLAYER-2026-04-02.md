# TESTE CONTROLADO FINAL — PIPELINE CANÔNICO DO PLAYER

**Data:** 2026-04-02  
**Repositório:** `indesconectavel/gol-de-ouro`

---

## 1. Resumo executivo

Foi confirmado que o **PR #34** está **mergeado** na `main` e que o **PR #35** (commit de teste) também foi integrado. O push **direto** à `main` está **bloqueado** por branch protection; o teste seguiu via **branch** `test/validar-pipeline-canonico-2026-04-02` + **PR #35** + **merge automático** após checks.

Após o merge na `main`, o workflow **`frontend-deploy.yml` disparou** e o job **`🚀 Deploy Produção` falhou** no passo `vercel-action` com **`Error! Project not found`** (combinação `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID` no Actions). O **`main-pipeline`** concluiu **com sucesso** e **não** contém mais deploy Vercel do player. A **API Vercel** mostrou novo deployment **`production`** associado ao **merge commit `6cfb7d3`** na **`main`**, e o domínio público **mudou** de bundle (incluindo o comentário HTML de teste). **Conclusão factual:** a produção **não** ficou dependente de um deploy **bem-sucedido** do Actions; o **canal Git ↔ Vercel** continua a **atualizar produção** em push/merge na `main`, enquanto o pipeline canónico no GitHub **falha** no deploy.

---

## 2. Estado do PR #34

| Campo | Valor |
|--------|--------|
| **Estado** | **MERGED** |
| **Merge commit (PR #34)** | `f42f82a7aa48fc7cbc50cb8a04855a8666497d85` |
| **mergedAt (API)** | `2026-04-02T18:41:31Z` |
| **Unificação na `main`** | **Sim** — workflows neutralizados e `frontend-deploy` canónico estão na branch principal desde esse merge. |

**PR #35 (teste):** **MERGED** em `2026-04-02T18:54:47Z`, merge commit **`6cfb7d3fd2409ee41f600949a7745413253ecff5`** (inclui o comentário em `goldeouro-player/index.html`).

---

## 3. Commit de teste

| Campo | Valor |
|--------|--------|
| **Ficheiro** | `goldeouro-player/index.html` |
| **Alteração** | Comentário HTML: `<!-- test: validar pipeline canônico do player 2026-04-02 (sem impacto funcional) -->` |
| **Mensagem** | `test: validar pipeline canônico do player` |
| **SHA do commit na branch** | `49b0a38` (histórico antes do merge) |
| **Nota** | `git push origin main` foi **recusado** (`protected branch`); usado **PR #35** para integrar na `main`. |

---

## 4. Workflows disparados

### Após push da branch de teste / PR #35

| Workflow | Evento | Run ID (exemplo) | Notas |
|----------|--------|------------------|--------|
| **🎨 Frontend Deploy (Vercel)** | `pull_request` | `23916676131` | Só **`🧪 Testes Frontend`**; deploy prod **skipped** (correto para PR). |
| **CI**, **Testes**, **Segurança** | `pull_request` | vários | Conforme política do repo. |
| **configurar-seguranca.yml** | `push` | `23916666530` | **failure** instantâneo (já observado noutros fluxos). |

### Após merge do PR #35 na `main` (push `main`)

| Workflow | Run ID | Resultado (observado) |
|----------|--------|------------------------|
| **🎨 Frontend Deploy (Vercel)** | `23916780177` | **Falha global** — `🚀 Deploy Produção` falhou em **📤 Deploy Vercel**; `notify vercel` executou (`if: always()`). Duração total ~3 min. SHA anotado: `6cfb7d3`. |
| **🚀 Pipeline Principal** | `23916780191` | **Sucesso** ~1 min — sem passo Vercel do player. |
| **CI** | `23916780245` | **Sucesso** |
| **Testes Automatizados** | `23916780198` | **Sucesso** |
| **Segurança e Qualidade** | `23916780239` | Em curso / completar no GitHub |
| **Rollback** | — | Esperado **skipped** se o Pipeline Principal for **success** (padrão `workflow_run`). |
| **health-monitor** | — | **Não** disparado pelo merge (só `schedule` / `dispatch`). |

**Respostas objetivas**

- **`frontend-deploy.yml` na `main`?** **Sim** (run `23916780177`), com **falha** no deploy.
- **`main-pipeline.yml`?** **Sim** (`23916780191`), **sucesso**, **sem** tocar no player via Vercel.
- **`rollback.yml`?** Não como deploy; só se pipeline principal falhar — não evidenciado como execução corretiva do player.
- **`health-monitor`?** **Não** interferiu no evento de merge.
- **Outro canal?** **Integração Git → Vercel** continua a gerar build de **produção** para `main` (ver secção 5).

---

## 5. Efeito no Vercel

**Fonte:** API `GET /v6/deployments` (projeto `goldeouro-player`, limite recente), após o teste.

| Observação | Evidência |
|------------|-----------|
| **Novo deployment** | Sim — topo da lista com **`target: production`**, **`ref: main`**, **`sha: 6cfb7d3`**, ready ~`2026-04-02 18:55:23 UTC`. |
| **Preview da branch de teste** | Deployment com **`ref: test/validar-pipeline-canonico-2026-04-02`**, **`sha: 49b0a38`**, sem `target=production` na listagem (comportamento de preview). |
| **Production Current** | **Mudou** relativamente ao estado anterior ao merge do teste — passou a apontar para o commit de merge **`6cfb7d3`**. |
| **Produção só por Actions?** | **Não** — Actions **falhou** com `Project not found`; mesmo assim houve **production** ligada ao merge na `main` via integração Git. |

**Respostas**

- **Preview automático continua?** **Sim** (deployment da branch de teste + fluxo habitual de PR).  
- **Produção automática bloqueada só pelo Ignored Build Step?** **Não comprovado neste teste** — **produção na `main` atualizou** com o merge.

---

## 6. Efeito no domínio público

**Antes** (amostra imediatamente antes do procedimento de teste documentado nesta sessão):

| Campo | Valor |
|--------|--------|
| **Last-Modified** | `Thu, 02 Apr 2026 18:51:23 GMT` |
| **Bundle** | `/assets/index-CZ8ZCsle.js` |
| **Comentário de teste no HTML** | Não presente |

**Depois** (após merge do PR #35 e propagação):

| Campo | Valor |
|--------|--------|
| **Last-Modified** | `Thu, 02 Apr 2026 18:58:11 GMT` |
| **Bundle** | `/assets/index-HNaCMuX_.js` |
| **Comentário de teste no HTML** | **Presente** (`pipeline canônico` detetado no HTML) |

**Resposta:** a **produção pública mudou** alinhada ao novo deployment, **sem** depender de um deploy **bem-sucedido** do `frontend-deploy` no Actions.

---

## 7. Veredito final

**PIPELINE AINDA NÃO VALIDADO**

**Motivo:** o critério “**produção só via `frontend-deploy.yml`**” **não** se cumpre na prática: o **GitHub Actions falhou** no deploy e a **produção moveu-se** via **Vercel + Git**. Além disso, **`VERCEL_PROJECT_ID` / org no Actions** ainda produzem **`Project not found`** neste run — o secret ou o contexto do projeto **não** está alinhado com o deploy canónico.

---

## 8. Conclusão objetiva

A **produção do player não deixou de mudar “sozinha”** no sentido de **um único portão**: continua a **mudar com merge/push na `main`** através da **integração Vercel**, **independentemente** do sucesso do **`frontend-deploy.yml`**. O **`frontend-deploy.yml` ainda não é a única porta real de produção** até que (1) o deploy por **Actions funcione** (`Project not found` resolvido) **e** (2) a **integração Git do Vercel** deixe de promover produção na `main` (ou fique equivalente ao mesmo artefato sob política explícita).

---

## Veredito SIM/NÃO (ETAPA 6)

| Pergunta | Resposta |
|----------|----------|
| **A. PR #34 ativo na `main`?** | **SIM** |
| **B. Push/merge de teste disparou `frontend-deploy` na `main`?** | **SIM** |
| **C. Vercel criou apenas preview automático?** | **NÃO** — também **production** para `main`/`6cfb7d3`. |
| **D. Production Current ficou estável?** | **NÃO** — atualizou com o merge de teste. |
| **E. Produção deixou de mudar sozinha (só Actions)?** | **NÃO** |
| **F. Uma única porta real de produção?** | **NÃO** |

---

## Referências úteis

- PR #34: https://github.com/indesconectavel/gol-de-ouro/pull/34  
- PR #35: https://github.com/indesconectavel/gol-de-ouro/pull/35  
- Run falho canónico: https://github.com/indesconectavel/gol-de-ouro/actions/runs/23916780177  
- Run pipeline principal: https://github.com/indesconectavel/gol-de-ouro/actions/runs/23916780191  
