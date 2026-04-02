# PR CONTROLADO — UNIFICAÇÃO DO PIPELINE DO PLAYER NA MAIN

**Data:** 2026-04-02  
**PR:** https://github.com/indesconectavel/gol-de-ouro/pull/34  

---

## 1. Resumo executivo

Integra na **`main`** a **unificação do pipeline do player** já registada na branch `ci/pipeline-frontend-correcao-2026-04-02`: neutralização de deploys paralelos (`main-pipeline`, `deploy-on-demand` prod, `rollback` frontend, `health-monitor` push) e consolidação do workflow canónico **`frontend-deploy.yml`** (incl. passo `notify vercel`), com relatórios de cirurgia e de execução controlada. **Sem** alterações ao código do jogo nem ao backend além do já planeado para o player.

---

## 2. Escopo do PR

**Comparação:** `origin/main`…`origin/ci/pipeline-frontend-correcao-2026-04-02` (estado remoto após `git fetch`).

| Ficheiro | Natureza |
|----------|----------|
| `.github/workflows/deploy-on-demand.yml` | Player só `--target preview` |
| `.github/workflows/frontend-deploy.yml` | Passo `notify vercel` + canónico existente |
| `.github/workflows/health-monitor.yml` | Sem `git push origin main` |
| `.github/workflows/main-pipeline.yml` | Sem deploy Vercel do player |
| `.github/workflows/rollback.yml` | Sem `vercel promote` automático no frontend |
| `docs/relatorios/CIRURGIA-UNIFICACAO-PIPELINE-FRONTEND-2026-04-02.md` | Relatório da cirurgia |
| `docs/relatorios/EXECUCAO-CONTROLADA-UNIFICACAO-PIPELINE-PLAYER-2026-04-02.md` | Relatório de execução |
| `docs/relatorios/PR-CONTROLADO-UNIFICACAO-PIPELINE-PLAYER-MAIN-2026-04-02.md` | Este relatório (commit posterior ao abrir o PR #34) |

**Nota:** o diff exacto `main…branch` no GitHub incluirá **8** ficheiros após o push do relatório PR; antes eram **7** (só workflows + dois relatórios de cirurgia/execução).

**Commits na branch relativamente à `main` (ordem):** `f4a5c55` (unificação) → commits de docs → `8d360db` (este relatório PR), entre outros.

**O PR está limpo?** **SIM** — apenas workflows e os dois relatórios acima; **não** há `goldeouro-player/src` nem outros ficheiros de produto neste diff.

**Risco de misturar mudanças indevidas?** **Baixo** para o escopo pedido; a branch **não** reaplica PR #32 nem altera lógica do jogo neste diff.

---

## 3. Estado do PR

| Campo | Valor |
|--------|--------|
| **Número** | **#34** |
| **Título** | `ci: unifica pipeline do player e remove deploys paralelos` |
| **Head** | `ci/pipeline-frontend-correcao-2026-04-02` |
| **Base** | `main` |
| **Link** | https://github.com/indesconectavel/gol-de-ouro/pull/34 |
| **Mergeability (API)** | `MERGEABLE` |
| **Merge state** | `BEHIND` — a branch está **atrás** da `main`; recomenda-se **atualizar a branch** (merge ou rebase da `main`) antes do merge final, ou usar merge com atualização no GitHub conforme política do repo. |
| **Checks** | Vários workflows disparam no PR; estado exacto depende do momento — consultar o separador **Checks** no PR. |

*Nota: valores de merge/checks registados no momento da criação do PR; rever no GitHub antes de merge.*

---

## 4. Prontidão para merge

| Critério | Avaliação |
|----------|------------|
| Escopo | Adequado (só CI + docs da unificação). |
| Conflitos | Não indicados (`MERGEABLE`). |
| Branch atrás da `main` | **Ressalva:** `BEHIND` — alinhar com `main` antes ou no merge. |
| Checks | Aguardar **verde** nos obrigatórios do repositório. |

**Conclusão:** **pronto para merge com ressalvas** — sobretudo **sincronizar com `main`** e **confirmar checks** antes do botão de merge.

---

## 5. Checklist pós-merge

1. **`main-pipeline`:** ao correr na `main`, **não** deve existir passo de deploy Vercel do player (só Fly + validações).
2. **`rollback`:** em falha do Pipeline Principal, **não** deve executar `vercel promote` no frontend; rollback Fly pode continuar.
3. **`deploy-on-demand`:** job do player deve usar **`--target preview`** apenas (não produção pública).
4. **`health-monitor`:** passo de relatórios **não** deve fazer `git push origin main`.
5. **`frontend-deploy`:** permanece o único workflow com **`vercel-action`** + `--prod` para o player na `main` (com paths `goldeouro-player/**`).
6. **Produção pública:** alterações neste PR **não** desligam a integração Git ↔ Vercel; confirmar no painel Vercel que a política de produção está alinhada (risco residual).

---

## 6. Riscos remanescentes

- **Integração Git Vercel:** continua a poder publicar produção em push à `main` independentemente destes YAML; não é corrigido só com merge do PR.
- **Segredos `VERCEL_*`:** o deploy canónico continua a depender de `VERCEL_PROJECT_ID` correto.
- **`notify vercel`:** depende de configuração da app/check no GitHub/Vercel.

---

## 7. Classificação final

**PR PRONTO COM RESSALVAS** — escopo limpo e mergeável; **ressalvas:** branch **BEHIND** `main` e necessidade de **checks verdes** + eventual **update branch** antes do merge.

---

## 8. Conclusão objetiva

A unificação do pipeline do player **pode entrar na `main`** através do **PR #34** sem misturar código de jogo, **desde que** se trate a **sincronização com `main`** e se valide **checks** antes do merge. O **caos de múltiplos canais no Actions** fica **mitigado** pelo conteúdo do PR; a **governança total em produção** continua a exigir **configuração no Vercel** (produção automática em Git).

---

## Referências

- `docs/relatorios/EXECUCAO-CONTROLADA-UNIFICACAO-PIPELINE-PLAYER-2026-04-02.md`
- Tag: `pos-unificacao-pipeline-player-2026-04-02` → `f4a5c55d29d53256e70fc4b168211bc1eafe9e42`
