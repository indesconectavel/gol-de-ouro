# CORREÇÃO DO PIPELINE DE DEPLOY DO FRONTEND

**Data:** 2026-04-02  
**Ficheiro alterado:** `.github/workflows/frontend-deploy.yml`  
**Continuidade:** baseline oficial (`baseline-player-validada-p3dBCTxRr-2026-04-02`, branch `canonica/player-baseline-p3dBCTxRr`).

---

## 1. Problema atual

O workflow **Frontend Deploy (Vercel)** permitia:

- **Falso positivo:** passos críticos com **`continue-on-error: true`**, pelo que o job podia aparecer **verde** mesmo com falha do **CLI Vercel** ou da verificação HTTP.
- **CLI inválido:** `vercel-args: '--prod --yes'` — o **`--yes`** não é aceite pela versão do CLI usada (erro já documentado em relatórios anteriores).
- **Rastreabilidade fraca:** não havia **registo explícito** do `GITHUB_SHA` / `GITHUB_REF` antes do deploy.
- **Ambiente enganador:** `env.VERCEL_PROJECT_ID: goldeouro-player` usava o **nome** do projeto; o ID real em Vercel é **`prj_…`** em **`secrets.VERCEL_PROJECT_ID`**.
- **Smoke test permissivo:** falha após tentativas **não** falhava o job (por `continue-on-error`).

---

## 2. Falhas identificadas

| # | Falha | Efeito |
|---|--------|--------|
| 1 | **`continue-on-error: true`** no deploy Vercel (produção e dev) | Deploy pode falhar e o workflow **continua** como sucesso. |
| 2 | **`continue-on-error: true`** no smoke test | Site pode estar offline; job **verde**. |
| 3 | **`--yes`** em `vercel-args` | Argumento **inválido**; falha no CLI. |
| 4 | Ausência de **SHA** explícito no log | Difícil correlacionar **run** ↔ **commit** ↔ **deployment** no Vercel. |
| 5 | `VERCEL_PROJECT_ID` no `env` global com valor **nome** | Confusão com `secrets.VERCEL_PROJECT_ID` (**prj_xxx**). |

**Por que o workflow podia “publicar versão errada”:** integração GitHub→Vercel ou **promote manual** pode servir outro artefacto; com **`continue-on-error`**, falhas do passo Vercel **não** quebravam o job.

**Por que “success” não garantia deploy correcto:** o passo **`vercel-action`** podia falhar e o job **mantinha-se** verde.

**Como o drift Git ↔ Vercel acontecia:** **aliases** e **promotes** no painel **não** aparecem no YAML; o pipeline só reflecte o que **executa com sucesso** e **sem** erros mascarados.

**Onde se perdia rastreabilidade:** faltava **marco** de commit antes do deploy; **deployment ID** continua a ser confirmado no **dashboard Vercel** (output `preview-url` do action ajuda, não substitui auditoria completa).

---

## 3. Correções aplicadas

| Alteração | Detalhe |
|-----------|---------|
| `vercel-args` (produção) | **`--prod` apenas** (removido `--yes`). |
| `continue-on-error` | **Removido** do deploy Vercel (prod e dev) e do smoke test. |
| Passo **Rastreabilidade** | Imprime `GITHUB_SHA`, `GITHUB_REF`, `git log -1` e `::notice`. |
| Deploy produção | `id: vercel_production`; passo seguinte regista output `preview-url` + lembrete para validar SHA no dashboard. |
| Smoke test | `curl -fsS` em **www** e **apex**; **exit 1** se falhar após 6 tentativas. |
| `env` global | Removido **`VERCEL_PROJECT_ID: goldeouro-player`**; comentário sobre **`secrets.VERCEL_PROJECT_ID`**. |
| **Concurrency** | `group: frontend-vercel-production`, `cancel-in-progress: false` no job de produção. |
| Dev | `id: vercel_preview`, rastreabilidade + URL; **sem** `continue-on-error`. |

**Regra de branch (produção):** deploy automático **só** em **`push` para `main`** (paths `goldeouro-player/**`). A branch **`canonica/player-baseline-p3dBCTxRr`** **não** foi adicionada ao trigger — integração da baseline deve ser via **PR → `main`** quando a equipa reconciliar.

---

## 4. Novo fluxo de deploy

1. **Push** em `main` ou `dev` (ou **PR** para `main`) com alterações em `goldeouro-player/**` dispara o workflow.
2. **`test-frontend`:** `npm ci`, audit, testes se existirem, eslint, **build** → **`goldeouro-player/dist/`**.
3. **`deploy-production`** (só `refs/heads/main`):
   - **Rastreabilidade** (SHA/ref).
   - Verificação de **secrets**.
   - **`vercel-action`** (`working-directory: goldeouro-player`, **`--prod`**), **sem** `continue-on-error`.
   - Registo da **URL** do deployment (output do action).
   - **Smoke test** `https://www.goldeouro.lol/` e `https://goldeouro.lol/` — falha **falha o job**.
4. **`deploy-development`** (`refs/heads/dev`): preview `--target preview`; falha **falha** o job.

---

## 5. Garantias de antirregressão

| Garantia | Como |
|----------|------|
| Falha de deploy = pipeline falha | Removido `continue-on-error` nos passos Vercel e no smoke test. |
| Commit rastreável | Passo dedicado com `GITHUB_SHA` e `::notice`. |
| Build no caminho certo | `goldeouro-player`, `npm run build`, verificação de `dist/` (produção). |
| Menos deploys concorrentes | `concurrency` no job de produção. |
| Baseline não sobrescrita sem governação | CI alinhado à **`main`**; **promotes/aliases manuais** continuam sujeitos a **processo** + tag baseline. |

**Limitação:** o YAML **não** bloqueia **promote manual** no Vercel — exige disciplina e, se necessário, **proteções** no GitHub Environments ou revisão dupla.

---

## 6. Classificação final

**PIPELINE ENDURECIDO — PRONTO PARA CONFIANÇA OPERACIONAL**

- **Corrigido:** `continue-on-error` abusivo, `--yes` inválido, smoke test sem falha real, `VERCEL_PROJECT_ID` enganador no `env`.
- **Validação estática:** estrutura YAML e triggers revistos; **deploy real** deve ser observado no **próximo push** a `main` que altere o player, para confirmar estabilidade do **vercel-action** e do **smoke test** (DNS/SSL).

**Conclusão:** o pipeline deixa de **mascarar** falhas e regista o **SHA** por run. A correspondência **exacta** “commit = produção” para **todo** o tráfego depende também de **não haver** divergência por **painel Vercel** (aliases/promotes) sem registo.

---

*Fim do relatório.*
