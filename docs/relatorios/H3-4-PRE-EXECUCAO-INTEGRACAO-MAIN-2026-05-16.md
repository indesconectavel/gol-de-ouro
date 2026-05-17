# H3.4 — PRÉ-EXECUÇÃO READ-ONLY — INTEGRAÇÃO MAIN

**Data da análise:** 2026-05-16  
**Modo:** exclusivamente read-only — **sem** merge, rebase, PR, deploy ou alteração de ficheiros versionados.  
**Base:** [H3.2](H3-2-SOURCE-OF-TRUTH-V1-PLANEAMENTO-2026-05-16.md), [H3.3c](H3-3C-INVENTARIO-COMMITS-NAO-DEPLOYADOS-2026-05-16.md), push H3.3e.

---

## 1. Resumo executivo

A integração **`origin/fix/admin-financial-integrity-v1`** → **`origin/main`** é **estruturalmente viável** e **recomendada com ressalvas**, usando **merge commit** (não squash, não rebase).

| Verificação | Resultado |
|-------------|-----------|
| `7ecedca` (produção `/meta`) na linha da feature? | **Sim** — ancestral de `origin/fix/admin-financial-integrity-v1` |
| `7ecedca` na linha de `main`? | **Não** |
| Merge-base `main` ↔ feature | `68f8929` |
| Commits só na feature | **49** |
| Commits só em `main` | **1** (`a60bbf1` — merge PR #86) |
| Simulação `git merge-tree origin/main origin/fix/...` | **Sem conflitos** — árvore resultante `f9dba920…` |
| Diff agregado (three-dot) | **100 ficheiros**, +17371 / −82 linhas |

**Merge em `main` não altera produção Fly** até deploy (H3.6). Após merge, `main` passará a **conter** o histórico que inclui `7ecedca`, alinhando a fonte Git à linha já validada em runtime.

**Decisão final (secção 16):** **GO COM RESSALVAS** para abrir PR e executar merge; **NO-GO** para deploy.

---

## 2. Estado atual das branches

| Ref | SHA | Nota |
|-----|-----|------|
| **Produção** (`/meta`) | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` | Confirmado nesta sessão — inalterado |
| **`origin/main`** | `a60bbf1c38ab6dc20a5d48d7b0fe4fe534f89c32` | Merge PR #86 `hotfix/saque-manual-v1` |
| **`origin/fix/admin-financial-integrity-v1`** | `041a771ad341cbf60fc269978eaab1d5aca3d5be` | Sincronizado com local (H3.3e) |
| **Branch local** | `fix/admin-financial-integrity-v1` @ `041a771` | `git branch --show-current` |

---

## 3. Relação main ↔ feature

```
                    e0d0003 ─────┐
                                 ├── a60bbf1  origin/main  (único commit exclusivo main)
                    68f8929 ─────┘         \
                         \                   \
                          \───────────────────► … 49 commits … ──► 041a771  origin/fix/admin-financial-integrity-v1
                                                    │
                                                    ├── 7ecedca  ← PRODUÇÃO /meta
                                                    └── dac9f8b  (único código player recente não deployado)
```

| Relação | Detalhe |
|---------|---------|
| Divergência | **Assimétrica** — feature muito à frente; `main` só acrescenta o merge commit `a60bbf1` |
| `7ecedca` ∈ feature | **Sim** |
| `7ecedca` ∈ main | **Não** — merge trará `7ecedca` para o histórico de `main` sem apagar produção |
| Perda de histórico em `main` | **Não** — merge **adiciona** commits; não rewrite |

---

## 4. Merge-base

| Campo | Valor |
|-------|--------|
| **SHA** | `68f89291f0e3ee57c20dd19165a77b6d0167474f` |
| **Mensagem** | `V1: implementar saque manual administrativo` |
| **Tag associada** | `pre-admin-financial-integrity-2026-05-04` |

**Interpretação:** `main` e a feature divergiram após o mesmo ponto de saque manual V1; a feature continuou T14A, admin, H2, docs e H3; `main` recebeu apenas o merge formal PR #86.

---

## 5. Commits exclusivos da feature

**Contagem:** `git rev-list --count origin/main..origin/fix/admin-financial-integrity-v1` → **49**

**Amostra (mais recentes → mais antigos):**

| SHA | Mensagem (resumo) |
|-----|-------------------|
| `041a771` | docs: H3.3 |
| `b68dca3` | docs: governança H3 |
| `dac9f8b` | fix: game mobile H3.0B |
| … | docs F1–F3, H2, T14A, cirurgias admin … |
| `7ecedca` | fix(ci): GIT_COMMIT deploy Fly (H2) — **baseline produção** |
| … | cirurgias admin financeiro, saques, auth … |
| `819d31d` | docs: preparação admin financeiro |

**Conteúdo relevante não documental (na linha completa, não só pós-`7ecedca`):** `server-fly.js`, `processPendingWithdrawals.js`, `adminWithdrawController.js`, `adminAuditLogger.js`, migração `admin_logs`, gitlink `goldeouro-admin`, player H3.0B, workflows CI pontuais.

---

## 6. Commits exclusivos da main

**Contagem:** `git rev-list --count origin/fix/admin-financial-integrity-v1..origin/main` → **1**

| SHA | Mensagem | Pais |
|-----|----------|------|
| `a60bbf1` | Merge pull request #86 from indesconectavel/hotfix/saque-manual-v1 | `e0d0003` + `68f8929` |

**Nota:** o conteúdo de `68f8929` já está na ancestralidade da feature (merge-base). O merge `a60bbf1` integra a linha `main` pré-PR com o hotfix já **contido** na feature. **Risco de conflito por este commit único: baixo** (confirmado por `merge-tree`).

---

## 7. Arquivos potencialmente afetados

**Comando:** `git diff --stat origin/main...origin/fix/admin-financial-integrity-v1`

| Categoria | Ficheiros (three-dot) |
|-----------|------------------------|
| **docs** | ~88 |
| **backend** | `server-fly.js`, `src/domain/payout/processPendingWithdrawals.js`, `src/utils/adminAuditLogger.js`, `controllers/adminWithdrawController.js` |
| **database** | `database/migrations/20260512_create_admin_logs.sql` |
| **player** | `index.html`, `GameFinal.jsx`, `game-scene.css`, `game-shoot.css` |
| **admin** | `goldeouro-admin` (gitlink) |
| **CI** | `.github/workflows/deploy-on-demand.yml` |
| **outros** | `.cursor/commands/deploy-producao.md` |

**Total:** 100 paths, +17371 / −82 linhas.

**Ficheiros com impacto em runtime (se deployados depois):**

| Ficheiro | Impacto |
|----------|---------|
| `server-fly.js` | Backend — **já refletido em produção** a partir de `7ecedca` (na feature, não em `main`) |
| `processPendingWithdrawals.js` | Financeiro / saques |
| `adminWithdrawController.js` | Admin saques manuais |
| Player (4 ficheiros) | UX mobile — **só** com deploy Vercel |
| `20260512_create_admin_logs.sql` | Schema — requer migração aplicada em Supabase (fora deste merge) |

---

## 8. Conflitos previstos

### Simulação

```bash
git merge-tree origin/main origin/fix/admin-financial-integrity-v1
```

| Resultado | Valor |
|-----------|--------|
| Marcadores `CONFLICT (` | **Nenhum** |
| Árvore de merge simulada | `f9dba92029234fc1bf6d5fcac237e23c0dd99299` |

**Classificação:** **conflitos Git automáticos — baixa probabilidade** no merge `main` ← feature.

**Ressalva operacional (não Git):** após merge, validar CI, submodule `goldeouro-admin` (gitlink sem `.gitmodules`), e migrações SQL não aplicadas automaticamente pelo merge.

---

## 9. Estratégia de merge recomendada

| Opção | Recomendação |
|-------|----------------|
| **Merge normal (merge commit)** | **Preferido** — preserva os 49 commits, `7ecedca`, auditoria H2/H3 |
| **`--no-ff`** ao integrar PR em `main` | **Recomendado** — deixa explícito o nó de integração H3.4 na história de `main` |
| **Direção** | `fix/admin-financial-integrity-v1` → **`main`** (não o inverso) |
| **Squash merge** | **Não** — ver secção 10 |
| **Rebase** | **Não** — ver secção 10 |

**Fluxo sugerido (execução futura, fora deste documento):**

1. Abrir PR: base `main`, head `fix/admin-financial-integrity-v1`.
2. Revisão humana + CI.
3. Merge com **Create a merge commit** (GitHub) ou `git merge --no-ff`.
4. **Não** deploy até H3.6.
5. Confirmar que `main` contém `7ecedca`: `git merge-base --is-ancestor 7ecedca origin/main` → deve passar **após** merge.

---

## 10. Estratégias proibidas

| Estratégia | Motivo |
|------------|--------|
| **Rebase** da feature sobre `main` | Reescreve SHAs; risco de drift com `/meta` e tags (`pre-h2-*`); proibido pelo plano H3.2 |
| **Squash merge** | Perde granularidade (49 commits); dificulta rollback e correlação com relatórios H3 |
| **Force push** em `main` | Destrutivo; proibido |
| **Merge `main` → feature** como passo final de integração | Invertido; objetivo é promover **feature → main** |
| **Deploy automático** pós-merge | Bloqueado até H3.6 |

---

## 11. Riscos de regressão

| Risco | Nível | Nota |
|-------|-------|------|
| Conflitos Git no merge | **Baixo** | `merge-tree` limpo |
| Regressão backend ao mergear | **Baixo** no acto do merge | Código em `main` passa a igualar feature; produção **já** corre linha ~`7ecedca` |
| Regressão ao deployar `main` pós-merge sem testes | **Médio** | `dac9f8b` (player) + possível diferença entre `main` antigo e árvore merged |
| Submodule admin órfão | **Médio** | Clone/CI pode falhar — H3.7 |
| Migração `admin_logs` não aplicada | **Médio** | Merge não aplica SQL em Supabase |
| Confusão “main = produção” | **Alto** (processo) | Mitigar com `/meta` até H3.6 |

**Nenhum risco de “apagar” `7ecedca` do histórico** se o merge for fast-forward ou merge commit padrão para a feature.

---

## 12. Impacto potencial em produção

| Superfície | No momento do merge | Após merge sem deploy |
|------------|---------------------|------------------------|
| **Fly `/meta`** | `7ecedca` | **Inalterado** |
| **Backend comportamento** | Baseline `7ecedca` | **Inalterado** até `fly deploy` |
| **Player Vercel** | Não inclui `dac9f8b` se prod não deployou | **Inalterado** |
| **Git `main`** | Desatualizado vs produção | **Alinhado** à linha de integração (inclui `7ecedca`) |

**Conclusão:** merge em `main` é **governança Git**; **não sobrescreve produção** nem dispara deploy por si só (desde que pipeline `main` não faça deploy automático sem gate — ressalva: rever `main-pipeline.yml` antes de H3.6).

---

## 13. Pode abrir PR?

### **SIM — GO COM RESSALVAS**

**Ressalvas:**

- Descrever no PR que produção permanece `7ecedca` até H3.6.
- Listar ficheiros não-docs (`server-fly.js`, player, payout, admin gitlink).
- Referenciar este relatório e H3.3c.
- Não marcar PR como “deploy to production”.
- CI pode falhar em submodule — planear ou documentar.

---

## 14. Pode fazer merge?

### **SIM — GO COM RESSALVAS** (após revisão do PR)

**Condições:**

- [ ] PR aprovado por humano.
- [ ] CI verde ou falhas explicadas.
- [ ] Estratégia: **merge commit** (preferir **no-ff**).
- [ ] Plano pós-merge: **não** deploy; opcional tag em `main` pós-merge (H3.5).

**Não executar merge nesta etapa H3.4** — apenas pré-validação.

---

## 15. Pode fazer deploy?

### **NÃO — NO-GO**

Política H3.2 / H3.6: deploy bloqueado independentemente do merge em `main`.

---

## 16. Decisão final

| Pergunta | Decisão |
|----------|---------|
| Integração estruturalmente segura? | **Sim** |
| `7ecedca` preservado na linha integrada? | **Sim** (entra no histórico de `main`) |
| Conflitos previstos? | **Nenhum** na simulação |
| Estratégia | **Merge commit** (`--no-ff` recomendado); **proibir** squash e rebase |
| Abrir PR? | **GO COM RESSALVAS** |
| Executar merge? | **GO COM RESSALVAS** (fase seguinte, pós-revisão) |
| Deploy? | **NO-GO** |

### Classificação global H3.4

**PRÉ-EXECUÇÃO APROVADA — GO COM RESSALVAS PARA PR E MERGE | NO-GO PARA DEPLOY**

### Próxima etapa recomendada

1. **H3.4b (execução)** — abrir PR `fix/admin-financial-integrity-v1` → `main` com corpo baseado neste relatório.  
2. Após merge aprovado — **H3.5** tag em `main` / verificação `git merge-base --is-ancestor 7ecedca origin/main`.  
3. **H3.6** — deploy controlado com validação `/meta`.

---

*Fim do relatório H3.4 — nenhum merge, PR ou deploy executado.*
