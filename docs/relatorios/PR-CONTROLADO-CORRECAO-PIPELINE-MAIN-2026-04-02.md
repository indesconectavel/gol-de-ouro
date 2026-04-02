# PR CONTROLADO — CORREÇÃO DO PIPELINE NA MAIN

**Data:** 2026-04-02  
**Continuidade:** `docs/relatorios/EXECUCAO-CONTROLADA-CORRECAO-PIPELINE-FRONTEND-2026-04-02.md`

---

## 1. Resumo executivo

Foi aberto o **Pull Request [#33](https://github.com/indesconectavel/gol-de-ouro/pull/33)** de **`ci/pipeline-frontend-correcao-2026-04-02`** → **`main`**, para integrar **apenas** a correção do workflow **`.github/workflows/frontend-deploy.yml`** e os relatórios **`CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`** e **`EXECUCAO-CONTROLADA-CORRECAO-PIPELINE-FRONTEND-2026-04-02.md`**, **sem** alterações ao código do **player** (`goldeouro-player/**`).

A integração foi feita por **branch limpa** a partir de **`origin/main`** com **cherry-pick** (equivalente à **estratégia B**), evitando arrastar commits ou trabalho local não relacionado da branch `migracao-canonica-gamefinal-main-2026-04-01`.

---

## 2. Escopo do PR

| Aspeto | Detalhe |
|--------|---------|
| **Commits na branch PR** (4) | `52545e7` (ci pipeline) + `b0054bb` + `f0058c0` + `f258fcd` (docs de execução) — *SHAs locais após cherry-pick; o primeiro corresponde ao conteúdo de `46355bc…` na linha antiga.* |
| **Ficheiros alterados vs `main`** | Apenas **3:** `.github/workflows/frontend-deploy.yml`, `docs/relatorios/CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`, `docs/relatorios/EXECUCAO-CONTROLADA-CORRECAO-PIPELINE-FRONTEND-2026-04-02.md` |
| **Commit histórico `46355bc`** | Conteúdo reproduzido em **`52545e7`** (mesma mensagem e diff de pipeline + relatório CORRECAO). |
| **Fora de escopo** | Nenhum ficheiro em `goldeouro-player/**`; **não** reaplicação do PR #32. |

### Etapa 1 — Veredito sobre “PR limpo?”

- **O PR fica limpo?** **Sim** — `git diff --stat origin/main..HEAD` mostra **só** os 3 ficheiros acima.
- **A branch `migracao-canonica-gamefinal-main-2026-04-01` estava “contaminada” para este objetivo?** **Para um PR direto**, traria **apenas** 4 commits extra de pipeline/docs após o merge-base com `main`, **sem** código de jogo — porém a equipa tinha **alterações locais** e **histórico** confundível. Por isso optou-se por **não** usar essa branch como cabeça do PR e sim **cherry-pick** sobre **`main`** atual.

---

## 3. Estratégia escolhida

**B — Branch limpa a partir de `main` + cherry-pick**

| Critério | Motivo |
|----------|--------|
| **Segurança** | Garante que o diff para `main` é **exclusivamente** workflow + docs acordados. |
| **Mínimo risco visual/regressão de player** | **Zero** linhas em `goldeouro-player`. |
| **vs estratégia A** | PR directo de `migracao-…` poderia ser aceitável em diff, mas a branch de trabalho estava **ahead/behind** `main` e com **WIP** local; **B** é mais previsível. |
| **vs C** | Não foi necessário rebase interactivo nem outro mecanismo. |

---

## 4. Execução realizada

| Passo | Acção |
|-------|--------|
| 1 | `git fetch origin` |
| 2 | `git checkout -B ci/pipeline-frontend-correcao-2026-04-02 origin/main` |
| 3 | `git cherry-pick 46355bc87c508aa595f2996c7bce0d9fcb364a11` → commit `52545e7` |
| 4 | Cherry-pick sequencial: `f791f00`, `8d72482`, `a4733bb` (docs execução) → `b0054bb`, `f0058c0`, `f258fcd` |
| 5 | `git push -u origin ci/pipeline-frontend-correcao-2026-04-02` |
| 6 | `gh pr create` → **PR #33** |

**URL do PR:** https://github.com/indesconectavel/gol-de-ouro/pull/33  

**Nota:** este ficheiro (`PR-CONTROLADO-…`) deve ser **commitado na mesma branch** e **empurrado** para aparecer no PR (commit seguido de push se ainda não integrado).

---

## 5. Checklist do primeiro run em `main`

Após **merge** do PR #33, no próximo **push** a `main` que altere `goldeouro-player/**` ou o workflow:

1. O workflow **Frontend Deploy (Vercel)** dispara para **`main`** (paths corretos).
2. No log do passo Vercel, **não** aparece `--yes` em `vercel-args`.
3. Se o **deploy Vercel** falhar, o job **falha** (sem `continue-on-error` nesse passo).
4. Se o **smoke test** (www + apex) falhar após retentativas, o job **falha**.
5. O passo **Rastreabilidade** mostra **`GITHUB_SHA`** e **`GITHUB_REF`**; o passo **URL de deploy** mostra o output `preview-url` do action.
6. O resultado do workflow **reflete** falhas reais — **não** “success” com deploy quebrado.

---

## 6. Riscos remanescentes

| Risco | Nota |
|-------|------|
| **Promote / alias manual** no Vercel | Continua possível **fora** do GitHub; o pipeline honesto **não** impede isso sozinho. |
| **Smoke test** | Depende de DNS/SSL/redirecionamentos; falso negativo possível (ajustar URLs se necessário). |
| **`gh`/secrets** | Falha de autenticação ou secrets em falta no repositório — verificar se `gh pr create` e Actions estão OK na conta. |

---

## 7. Classificação final

**PR LIMPO E PRONTO**

- Diff **restrito** a workflow + 2 relatórios; **sem** código de player.
- **PR #33** criado com base **estratégia B**.

---

## 8. Conclusão objetiva

**Sim:** a correção do pipeline **pode** entrar na **`main`** via **PR #33** **sem** reabrir o “caos” de regressão visual do player, porque **não há** alterações em `goldeouro-player`. O **merge** deve ser seguido da **observação do primeiro run** real do workflow em `main` (checklist acima).

---

### Veredito (Etapa 5)

| | Resposta |
|----|----------|
| **A. A correção do pipeline já está pronta para entrar na `main`?** | **SIM** (via PR #33, após merge). |
| **B. O PR ficou limpo e seguro?** | **SIM** (só 3 ficheiros, sem player). |
| **C. O próximo passo após o merge será observar o primeiro run em `main`?** | **SIM** |

---

*Fim do relatório.*
