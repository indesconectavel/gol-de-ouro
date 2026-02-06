# Auditoria Git Global — READ-ONLY

**Data/hora da auditoria:** 2026-02-06 00:54:53  
**Modo:** READ-ONLY absoluto (nenhuma edição, commit, tag, push, merge ou rebase).  
**Objetivo:** Verificar pendências de sincronização, branches, tags, worktree e integridade do release history.

---

## FASE 0 — IDENTIFICAÇÃO

| Item | Valor |
|------|--------|
| **Data/hora local** | 2026-02-06 00:54:53 |
| **Diretório** | `e:\Chute de Ouro\goldeouro-backend` |
| **É repositório Git?** | `true` |
| **Remote** | `origin` → `https://github.com/indesconectavel/gol-de-ouro.git` (fetch e push) |
| **Branch atual** | `feat/payments-ui-pix-presets-top-copy` |
| **HEAD (SHA)** | `c5d5d6c3e31e318de9a38444e6cd2a3dd0cc208c` |

---

## FASE 1 — STATUS DO WORKTREE

### 4) git status / git status -sb

- **Branch:** `feat/payments-ui-pix-presets-top-copy` → tracking `origin/feat/payments-ui-pix-presets-top-copy`
- **Mensagem:** "Your branch is up to date with 'origin/feat/payments-ui-pix-presets-top-copy'."
- **Staged:** nenhum arquivo
- **Modified (unstaged):** nenhum
- **Untracked:**
  - `docs/relatorios/RELEASE-CHECKPOINT/CHANGE2-CHANGE3-versionamento-e-rollback.md`
  - `docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-CHANGE2-CHANGE3-readonly.md`

### 5) Diffs unstaged

- **git diff --name-only:** (vazio)
- **git diff --stat:** (vazio)

### 6) Staged

- **git diff --cached --name-only:** (vazio)
- **git diff --cached --stat:** (vazio)

### 7) Untracked (excl. ignore)

```
docs/relatorios/RELEASE-CHECKPOINT/CHANGE2-CHANGE3-versionamento-e-rollback.md
docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-CHANGE2-CHANGE3-readonly.md
```

**Resumo Fase 1:** Nenhuma alteração staged ou unstaged. Apenas 2 arquivos untracked em `docs/relatorios/RELEASE-CHECKPOINT/` (relatórios).

---

## FASE 2 — SINCRONIZAÇÃO READ-ONLY COM ORIGIN

### 8) git fetch --all --tags --prune

Executado com sucesso (referências atualizadas, código local não alterado).

### 9) git status -sb (após fetch)

```
## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy
?? docs/relatorios/RELEASE-CHECKPOINT/CHANGE2-CHANGE3-versionamento-e-rollback.md
?? docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-CHANGE2-CHANGE3-readonly.md
```

- **Ahead:** 0  
- **Behind:** 0  
- **Conclusão:** Branch atual sincronizado com o upstream.

---

## FASE 3 — BRANCHES E UPSTREAMS

### 10) git branch -vv

Listagem completa obtida (vários branches locais; apenas resumo abaixo).

### 11) Upstream por branch (refname|upstream|track)

| Branch | Upstream | Track |
|--------|----------|--------|
| feat/payments-ui-pix-presets-top-copy (atual) | origin/feat/payments-ui-pix-presets-top-copy | (nenhum — sincronizado) |
| main | origin/main | (nenhum) |
| release-v1.0.0 | origin/release-v1.0.0 | (nenhum) |
| fix/remove-version-banner | origin/release-v1.0.0 | [behind 1] |
| release-merge | origin/release-v1.0.0 | (nenhum) |
| feat/game-landscape-safe | origin/feat/game-landscape-safe | [gone] |
| fix/game-layout-locked | origin/fix/game-layout-locked | [gone] |
| fix/game-locked-16x9 | origin/fix/game-locked-16x9 | [gone] |
| hotfix/restore-stable-player | origin/hotfix/restore-stable-player | [gone] |
| Demais branches listados | (vazio) | **sem upstream** |

### 12) Branch atual vs upstream

- **Branch atual:** `feat/payments-ui-pix-presets-top-copy`
- **Upstream:** `origin/feat/payments-ui-pix-presets-top-copy` (existe)
- **git rev-list --left-right --count origin/feat/payments-ui-pix-presets-top-copy...HEAD:** `0	0`
- **Conclusão:** 0 commits à frente, 0 atrás. Sincronizado.

**Branches sem upstream (exemplos):**  
backup/*, dev, docs/*, feat/game-16x9-tailwind-safe, fix/frontend-production-clean, fix/game-*, fix/prod-*, hotfix/revert-player-ui, nova-branch, release/v1-stability-ui, rollback/pre-ux-adjustments, security/*, test/*, wip/*.

**Branches com upstream [gone]:**  
feat/game-landscape-safe, fix/game-layout-locked, fix/game-locked-16x9, hotfix/restore-stable-player.

**Branch com behind:**  
fix/remove-version-banner → [behind 1] em relação a origin/release-v1.0.0.

---

## FASE 4 — COMMITS NÃO ENVIADOS (AHEAD) E DIVERGÊNCIA (BEHIND)

### 13–14) Branch atual

- **Ahead:** 0 (nenhum commit local não enviado)
- **Behind:** 0 (nenhuma divergência em relação ao origin)
- **HEAD = origin/feat/payments-ui-pix-presets-top-copy:**  
  `c5d5d6c docs: relatório CHANGE #4 com hash correto para rollback (2ad4825)`

**Outros branches com pendência:**  
- `fix/remove-version-banner`: **behind 1** em relação a `origin/release-v1.0.0` (não é o branch atual).

---

## FASE 5 — TAGS LOCAIS NÃO ENVIADAS AO ORIGIN

Comparação: tags existentes apenas localmente (não presentes no origin após fetch):

| Tag local não enviada |
|------------------------|
| PRE_V1_STABLE_2026-02-05-2224 |
| missao-e-aprovado |
| v1.2.1 |

**Resumo:** 3 tags locais não estão no origin. Recomenda-se decidir se devem ser enviadas (`git push origin <tag>`) ou se são apenas locais por decisão.

---

## FASE 6 — STASH PENDENTE

```
stash@{0}: On fix/frontend-production-clean: WIP admin local before frontend clean PR
stash@{1}: WIP on test/branch-protection-config: a1059dc fix: Melhorar workflow build APK com tratamento de erros e fallbacks
```

**Resumo:** 2 entradas de stash. Não foram aplicadas nem removidas durante esta auditoria (read-only).

---

## FASE 7 — BUILDS LOCAIS (dist)

- **Pasta `dist`:** **não existe** no repositório auditado.
- **Conclusão:** Nada a verificar quanto a dist fora de sincronia com HEAD.

---

## FASE 8 — INTEGRIDADE DO RELEASE HISTORY (TAGS PRE/DONE RECENTES)

Tags PRE/DONE listadas localmente:

| Tag | Tipo |
|-----|------|
| PRE_CHANGE2_CHANGE3_2026-02-06_0041 | PRE |
| PRE_CHANGE4_2026-02-06_0050 | PRE |
| PRE_V1_STABLE_2026-02-05-2224 | PRE (apenas local) |
| CHANGE2_DONE_2026-02-06_0041 | DONE |
| CHANGE3_DONE_2026-02-06_0041 | DONE |
| CHANGE4_DONE_2026-02-06_0050 | DONE |

As tags **CHANGE2_DONE**, **CHANGE3_DONE**, **CHANGE4_DONE** e **PRE_CHANGE2_CHANGE3**, **PRE_CHANGE4** estão presentes no origin (confirmado via `git ls-remote --tags origin`). A sequência PRE → DONE recente está consistente; **PRE_V1_STABLE_2026-02-05-2224** existe apenas localmente.

---

## RESUMO EXECUTIVO

| Verificação | Estado |
|-------------|--------|
| Commits locais não enviados (ahead) no branch atual | Nenhum |
| Branch atual atrás do upstream (behind) | Não |
| Branches locais sem upstream | Muitos (backup/*, dev, docs/*, feat/fix/wip/etc.) |
| Branches com upstream [gone] | 4 (feat/game-landscape-safe, fix/game-layout-locked, fix/game-locked-16x9, hotfix/restore-stable-player) |
| Tags locais não enviadas ao origin | 3 (PRE_V1_STABLE_2026-02-05-2224, missao-e-aprovado, v1.2.1) |
| Staged / unstaged changes | Nenhum |
| Untracked relevantes | 2 arquivos em docs/relatorios/RELEASE-CHECKPOINT/ |
| Stash pendente | 2 entradas |
| Pasta dist | Não existe |
| Release history (PRE/DONE recentes) | Integro; tags CHANGE* no origin; PRE_V1_STABLE só local |

**Conclusão:** O branch atual `feat/payments-ui-pix-presets-top-copy` está limpo e sincronizado com o origin. Pendências identificadas: 2 arquivos untracked em docs, 3 tags apenas locais, 2 stashes, vários branches sem upstream ou com [gone], e 1 branch (`fix/remove-version-banner`) behind em relação ao seu upstream.

---
*Auditoria realizada em modo READ-ONLY. Nenhum arquivo foi alterado e nenhum commit, tag ou push foi executado.*
