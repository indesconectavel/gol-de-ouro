# Auditoria Git Global — Pendências (READ-ONLY)

**Data/hora da auditoria:** 2026-02-06 00:58:15  
**Modo:** READ-ONLY absoluto (nenhuma edição, commit, tag, push, merge ou rebase).  
**Objetivo:** Verificar pendências de sincronização, branches, tags, worktree e integridade do release history.

---

## FASE 0 — IDENTIFICAÇÃO

| Item | Valor |
|------|--------|
| **Data/hora local** | 2026-02-06 00:58:15 |
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
  - `docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-GLOBAL-READONLY.md`

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
docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-GLOBAL-READONLY.md
```

---

## FASE 2 — SINCRONIZAÇÃO READ-ONLY COM ORIGIN

- **git fetch --all --tags --prune:** executado (referências atualizadas).
- **git status -sb (após fetch):** inalterado — `## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy` + mesmos untracked.

---

## FASE 3 — BRANCHES E UPSTREAMS

### 10) git branch -vv (resumo)

- Branch atual: `feat/payments-ui-pix-presets-top-copy` com upstream `origin/feat/payments-ui-pix-presets-top-copy` (sem ahead/behind).
- Alguns branches com upstream **gone** (removido no remote): `feat/game-landscape-safe`, `fix/game-layout-locked`, `fix/game-locked-16x9`, `hotfix/restore-stable-player`.
- `fix/remove-version-banner` rastreia `origin/release-v1.0.0` e está **behind 1** (path de outro repo indicado no -vv).
- `release-merge` e `rollback/pre-ux-adjustments` apontam para outros diretórios (worktrees).

### 11) for-each-ref (upstream por branch)

Branches **sem upstream** (segunda coluna vazia):

- backup/missao-e-final  
- backup/pre-safe-patch-rollback-20250109-143000  
- backup/pre-safe-patch-rollback-20250914-075948  
- backup/v1.1.1-complex  
- dev  
- docs/atualizar-status-branch-protection  
- docs/resumo-configuracao-seguranca  
- feat/game-16x9-tailwind-safe  
- fix/frontend-production-clean  
- fix/game-16x9-hud-safe  
- fix/game-layout-safe  
- fix/game-pixel-perfect  
- fix/game-pixel-perfect-v2  
- fix/game-pixel-v10  
- fix/game-pixel-v3 até fix/game-pixel-v9  
- fix/prod-csp-api-rewrite  
- fix/prod-vercel-proxy-csp  
- hotfix/revert-player-ui  
- nova-branch  
- release/v1-stability-ui  
- security/fix-ssrf-vulnerabilities  
- test/branch-protection-config  
- wip/* (todos)

Branches **com upstream:** feat/payments-ui-pix-presets-top-copy, main, release-v1.0.0, release-merge, fix/remove-version-banner; e os com [gone]: feat/game-landscape-safe, fix/game-layout-locked, fix/game-locked-16x9, hotfix/restore-stable-player.

### 12) Branch atual — rev-list left-right

- **git rev-list --left-right --count @{upstream}...HEAD:** `0	0`  
- **Conclusão:** branch atual não está ahead nem behind do upstream.

---

## FASE 4 — COMMITS NÃO ENVIADOS (AHEAD) E DIVERGÊNCIA (BEHIND)

### 13–14) Branch atual

- **Ahead:** 0  
- **Behind:** 0  
- **git log @{upstream}..HEAD:** (vazio)  
- **git log HEAD..@{upstream}:** (vazio)  

**Outros branches (evidência):** Nenhum branch com commits pendentes de push foi listado como “ahead” no branch atual. O único “behind” observado é `fix/remove-version-banner` (behind 1 em relação a `origin/release-v1.0.0`).

---

## FASE 5 — TAGS (LOCAL vs REMOTE)

### 15) Tags locais (primeiras 40 por data)

```
CHANGE4_DONE_2026-02-06_0050 2026-02-06
CHANGE3_DONE_2026-02-06_0041 2026-02-06
PRE_CHANGE4_2026-02-06_0050 2026-02-06
CHANGE2_DONE_2026-02-06_0041 2026-02-06
PRE_CHANGE2_CHANGE3_2026-02-06_0041 2026-02-05
PRE_V1_STABLE_2026-02-05-2224 2026-02-05
v1.2.1 2026-02-02
backup-pre-ux-adjustments-2026-01-16 2026-01-16
missao-e-aprovado 2026-01-05
... (demais tags mais antigas)
```

### 16) Tags no remote (origin)

- Listadas via `git ls-remote --tags origin` (nomes únicos, sem peeled).

### 17) Comparação

**Tags locais que NÃO existem no remote:**

- `PRE_V1_STABLE_2026-02-05-2224`
- `missao-e-aprovado`
- `v1.2.1`

**Tags recentes PRE_* / CHANGE*_DONE_* / releases v* no remote:**  
PRE_CHANGE2_CHANGE3_2026-02-06_0041, PRE_CHANGE4_2026-02-06_0050, CHANGE2_DONE_2026-02-06_0041, CHANGE3_DONE_2026-02-06_0041, CHANGE4_DONE_2026-02-06_0050 e v1.0.0-pre-deploy, v1.1.1, v1.1.2, v1.2.0, v2.0.0-pix-complete, v3.0.0-golden-goal estão no origin. **v1.2.1** e **PRE_V1_STABLE_2026-02-05-2224** existem apenas localmente.

---

## FASE 6 — STASH E WIP ESCONDIDO

### 18) git stash list

- **Quantidade:** 2 entradas  
- **Títulos:**
  - `stash@{0}: On fix/frontend-production-clean: WIP admin local before frontend clean PR`
  - `stash@{1}: WIP on test/branch-protection-config: a1059dc fix: Melhorar workflow build APK com tratamento de erros e fallbacks`

---

## FASE 7 — BUILD ARTIFACTS (READ-ONLY)

### 19) Existência de builds

| Caminho | Existe |
|---------|--------|
| goldeouro-player/dist | Sim |
| goldeouro-player/build | Não |
| goldeouro-player/.vite | Não |

### 20) 30 arquivos mais recentes em goldeouro-player/dist (timestamp)

Os arquivos mais recentes em `dist` têm **LastWriteTime** em **06/02/2026 00:49:32–00:49:36** (ex.: workbox-6e5f094d.js, sw.js, index.html, assets/index-CkupLFPm.js, etc.).

### 21) Timestamp do commit HEAD

- **git show -s --format=%ci HEAD:** `2026-02-06 00:53:15 -0300`

### 22) Comparação

- **dist:** arquivos mais recentes ~00:49 (06/02/2026).  
- **HEAD:** 00:53:15 (06/02/2026).  
- **Conclusão:** dist tem timestamps **anteriores** ao commit HEAD. Não há evidência de “dist gerado após HEAD”; dist pode estar ligeiramente desatualizado em relação ao último commit (apenas evidência, sem conclusões fortes sobre deploy).

---

## FASE 8 — INTEGRIDADE DO HISTÓRICO RECENTE (EVIDÊNCIA)

### 23) Últimos 30 commits (--decorate --oneline)

```
c5d5d6c (HEAD -> feat/payments-ui-pix-presets-top-copy, origin/feat/payments-ui-pix-presets-top-copy) docs: relatório CHANGE #4 com hash correto para rollback (2ad4825)
2ad4825 (tag: CHANGE4_DONE_2026-02-06_0050) CHANGE #4: gatilho semantico p/ saldo insuficiente (frontend)
7f73abd (tag: PRE_CHANGE4_2026-02-06_0050, tag: CHANGE3_DONE_2026-02-06_0041) CHANGE #3: destaque no botão Recarregar ao jogar sem saldo (frontend)
0361d48 (tag: CHANGE2_DONE_2026-02-06_0041) CHANGE #2: mensagem amigável ao jogar sem saldo (frontend)
b4aa303 (tag: PRE_CHANGE2_CHANGE3_2026-02-06_0041) feat: payments UI pix presets + copy-top + default 200 (v1 safe)
d8ceb3b (tag: PRE_V1_STABLE_2026-02-05-2224, release/v1-stability-ui) chore: checkpoint pre-v1 stable
3624a19 (tag: v1.2.1, fix/frontend-production-clean) release: payout worker + correção supabase ping (1.2.1)
0a2a5a1 (origin/main, origin/HEAD, main) Merge pull request #18 ...
... (até 30)
```

### 24) Grafo curto (--oneline --decorate --graph --all -n 40)

- Grafo capturado: branch atual alinhado com origin; stash e branches release/rollback visíveis; sem anomalias de merge aparentes no trecho exibido.

---

## FASE 9 — RELATÓRIO CONSOLIDADO

### Resumo

| Campo | Valor |
|--------|--------|
| **Data/hora** | 2026-02-06 00:58:15 |
| **Branch atual** | feat/payments-ui-pix-presets-top-copy |
| **HEAD** | c5d5d6c3e31e318de9a38444e6cd2a3dd0cc208c |
| **Status worktree** | Clean (sem modified); **untracked:** 3 arquivos em docs/relatorios/RELEASE-CHECKPOINT |
| **Upstream do branch atual** | Sim — origin/feat/payments-ui-pix-presets-top-copy |
| **Ahead / Behind** | 0 / 0 |
| **Branches sem upstream** | Vários (backup/*, dev, docs/*, feat/game-*, fix/*, hotfix/*, nova-branch, release/v1-stability-ui, security/*, test/*, wip/*) — ver lista na Fase 3 |
| **Branches ahead com commits pendentes** | Nenhum no branch atual; outros branches não auditados quanto a push |
| **Tags locais não enviadas** | PRE_V1_STABLE_2026-02-05-2224, missao-e-aprovado, v1.2.1 |
| **Stash pendente** | Sim — 2 entradas (fix/frontend-production-clean; test/branch-protection-config) |
| **Untracked relevantes** | docs/relatorios/RELEASE-CHECKPOINT: CHANGE2-CHANGE3-versionamento-e-rollback.md, GIT-AUDIT-CHANGE2-CHANGE3-readonly.md, GIT-AUDIT-GLOBAL-READONLY.md |
| **Evidência dist** | dist existe; timestamps de dist anteriores ao HEAD; sem evidência de dist gerado após HEAD |

---

### Conclusão final

**PENDENTE**

Checklist do que falta (para correção futura, sem executar nesta auditoria):

- [ ] **Untracked:** Decidir se os 3 arquivos em `docs/relatorios/RELEASE-CHECKPOINT` devem ser commitados e, em caso positivo, adicionar e dar push (após commit no branch apropriado).
- [ ] **Tags locais não enviadas:** Enviar ao origin, se desejado: `PRE_V1_STABLE_2026-02-05-2224`, `missao-e-aprovado`, `v1.2.1` (ex.: `git push origin <tag>` para cada uma).
- [ ] **Stash:** Revisar os 2 stashes; aplicar ou descartar conforme necessidade (não executado nesta auditoria).
- [ ] **Branches sem upstream:** Opcional — configurar upstream ou remover branches obsoletos; não bloqueante para o branch atual.
- [ ] **Build dist:** Opcional — rodar build após o HEAD se quiser dist alinhado ao último commit (apenas evidência; não é pendência de push/tag/commit).

---

### Recomendações (sem executar)

1. **Untracked em docs/relatorios:**  
   Se os relatórios forem parte do release checkpoint:  
   `git add docs/relatorios/RELEASE-CHECKPOINT/<arquivos>` → commit → push no branch atual (ou em branch de documentação).

2. **Tags não enviadas:**  
   Para publicar as tags no origin:  
   `git push origin PRE_V1_STABLE_2026-02-05-2224 missao-e-aprovado v1.2.1`  
   (ou uma por vez).

3. **Stash:**  
   `git stash list` → `git stash show -p stash@{n}` para inspecionar; depois `git stash pop` ou `git stash drop` conforme o caso.

4. **Branches com upstream [gone]:**  
   Considerar `git branch -d` ou `git remote prune origin` + limpeza local após revisão.

5. **Dist:**  
   Se for necessário artefato de build alinhado ao HEAD: `npm run build` (ou comando equivalente) dentro de `goldeouro-player`.

---

**Relatório gerado em:** `docs/relatorios/RELEASE-CHECKPOINT/GIT-GLOBAL-PENDING-AUDIT-readonly.md`  
**Fim da auditoria READ-ONLY.**
