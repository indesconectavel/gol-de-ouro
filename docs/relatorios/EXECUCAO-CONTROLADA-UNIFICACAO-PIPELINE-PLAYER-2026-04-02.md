# EXECUÇÃO CONTROLADA — UNIFICAÇÃO DO PIPELINE DO PLAYER

**Data:** 2026-04-02

---

## 1. Resumo executivo

Registou-se no Git a **neutralização** dos deploys paralelos do player (`main-pipeline`, `deploy-on-demand` prod, `vercel promote` no `rollback`, `git push` no `health-monitor`), a consolidação do passo **`notify vercel`** no workflow canónico `frontend-deploy.yml`, o relatório de cirurgia e este relatório de execução. Criou-se a tag **`pos-unificacao-pipeline-player-2026-04-02`** e fez-se **push** da branch e da tag para `origin`.

---

## 2. Estado local antes do commit

| Campo | Valor |
|--------|--------|
| **Branch** | `ci/pipeline-frontend-correcao-2026-04-02` |
| **Escopo revisto** | Apenas alterações em `.github/workflows/` (5 ficheiros) alinhadas à cirurgia; `frontend-deploy.yml` inclui o passo `notify vercel` (integração checks). Não foram incluídos no commit outros `docs/relatorios` untracked nem alterações em `goldeouro-player/src`. |

---

## 3. Commit realizado

| Campo | Valor |
|--------|--------|
| **Mensagem** | `ci: unifica pipeline do player e neutraliza deploys paralelos` |
| **SHA** | `f4a5c55d29d53256e70fc4b168211bc1eafe9e42` |
| **Ficheiros** | Os cinco workflows acima + `CIRURGIA-UNIFICACAO-PIPELINE-FRONTEND-2026-04-02.md` + `EXECUCAO-CONTROLADA-UNIFICACAO-PIPELINE-PLAYER-2026-04-02.md` |

---

## 4. Tag criada

| Campo | Valor |
|--------|--------|
| **Nome** | `pos-unificacao-pipeline-player-2026-04-02` |
| **Alvo** | `f4a5c55d29d53256e70fc4b168211bc1eafe9e42` (leve; `git show pos-unificacao-pipeline-player-2026-04-02`). *A tag marca o commit de unificação; pode existir commit posterior só em docs na mesma branch.* |

---

## 5. Push realizado

| Campo | Valor |
|--------|--------|
| **Branch** | `ci/pipeline-frontend-correcao-2026-04-02` → `origin` |
| **Tag** | `pos-unificacao-pipeline-player-2026-04-02` → `origin` |

Push concluído em 2026-04-02: branch e tag enviadas a `origin`. Confirmar com `git ls-remote --tags origin` se necessário.

---

## 6. Estado da unificação no Git

- **`main-pipeline.yml`:** sem passo de deploy Vercel do player.
- **`deploy-on-demand.yml`:** player com `--target preview` (não produção).
- **`rollback.yml`:** sem `vercel promote` automático; rollback Fly mantido.
- **`health-monitor.yml`:** sem `git push origin main` no passo de relatórios.
- **`frontend-deploy.yml`:** canónico com `vercel-action`, smoke, `notify vercel`.

---

## 7. Próxima ação recomendada

**Abrir PR** da branch `ci/pipeline-frontend-correcao-2026-04-02` para **`main`** e, após merge, validar os comportamentos listados na secção 9 (ETAPA 5 do pedido).

---

## 8. Classificação final

**REGISTRADO E PRONTO** — commit e tag criados; push executado conforme ambiente.

*(Se o push falhar por rede ou permissões, reclassificar para **REGISTRADO COM RESSALVAS** e repetir o push.)*

---

## 9. Conclusão objetiva

A **unificação do pipeline do player** ficou **formalmente registada no Git** (commit + tag). A **proteção completa em produção** continua a depender do **alinhamento no painel Vercel** (integração Git / produção automática), fora do âmbito deste commit.

---

## ETAPA 5 (planeamento) — Respostas

### A. O diff está limpo o suficiente para PR?

**SIM** — alterações focadas em CI e documentação da cirurgia; sem código de jogo nem backend além do necessário.

### B. O próximo passo correto é PR para `main`?

**SIM.**

### C. O que validar depois do merge?

- **`main-pipeline`:** não executa deploy Vercel do player (só Fly + validações).
- **`rollback`:** não promove player via `vercel promote`; backend Fly continua a ser revertido quando aplicável.
- **`deploy-on-demand`:** player só **preview**, não produção.
- **`health-monitor`:** não faz push à `main`; artifacts de relatório continuam.
- Opcional: run de **`frontend-deploy`** em `main` com alteração em `goldeouro-player/**` e secrets `VERCEL_*` correctos.

---

## Referências

- `docs/relatorios/AUDITORIA-FINAL-ANTES-CIRURGIA-UNIFICACAO-PIPELINE-2026-04-02.md`
- `docs/relatorios/CIRURGIA-UNIFICACAO-PIPELINE-FRONTEND-2026-04-02.md`
