# Auditoria Git READ-ONLY — CHANGE #2 e CHANGE #3

**Data/hora da auditoria:** 2026-02-06 00:30:09  
**Modo:** READ-ONLY (nenhuma alteração, commit, tag ou push).

---

## 1. Estado geral

| Item | Valor |
|------|--------|
| **Branch atual** | `feat/payments-ui-pix-presets-top-copy` |
| **Remote** | `origin` → `https://github.com/indesconectavel/gol-de-ouro.git` (fetch e push) |

### Resumo do `git status`

- **Alterações não staged (modified):**
  - `goldeouro-player/src/pages/GameShoot.jsx`
  - `goldeouro-player/src/services/gameService.js`
- **Arquivos não rastreados (untracked):**
  - `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-implementacao-frontend.md`
  - `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-precheck-saldo-para-jogar-READONLY.md`
  - `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-verificacao-producao-readonly.md`
  - `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-3-highlight-recarregar-frontend.md`
  - `prod-assets-index.js`
  - `prod-index.html`
- **Conclusão:** Existem mudanças locais não commitadas; nenhuma alteração estava em stage no momento da auditoria.

---

## 2. Tags relevantes

**Listagem de tags (relevantes para esta auditoria):**

| Tag | Commit (decorate) |
|-----|--------------------|
| **PRE_V1_STABLE_2026-02-05-2224** | `d8ceb3b` (chore: checkpoint pre-v1 stable) |
| v1.2.1 | 3624a19 |
| v1.2.0 | 7dbb4ec |
| GAME_VALIDADO_2025_12_30 | 9056c2e |
| backup-pre-ux-adjustments-2026-01-16 | f1df2ee |
| (outras tags listadas no repositório) | — |

- **Tag CHANGE2 ou CHANGE3:** Nenhuma tag com esse nome foi encontrada.
- **PRE_V1_STABLE_2026-02-05-2224:** Existe e aponta para `d8ceb3b`.

---

## 3. Evidência dos commits (CHANGE #2 e CHANGE #3)

### Busca no histórico

- Foi executado: `git log --oneline -n 80 --all` com filtro por "CHANGE", "change", "#2", "#3", "saldo", "Recarregar", "highlight".
- **Resultado:** Nenhum commit no histórico recente contém mensagem referente a CHANGE #2 ou CHANGE #3.

### Últimos commits no branch atual

| Hash | Mensagem |
|------|-----------|
| **b4aa303** (HEAD → feat/payments-ui-pix-presets-top-copy) | feat: payments UI pix presets + copy-top + default 200 (v1 safe) |
| d8ceb3b (tag: PRE_V1_STABLE_2026-02-05-2224, release/v1-stability-ui) | chore: checkpoint pre-v1 stable |
| 3624a19 (tag: v1.2.1) | release: payout worker + correção supabase ping (1.2.1) |
| 0a2a5a1 (origin/main, main) | Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities |

- **Conclusão:** Não existe commit específico para CHANGE #2 nem para CHANGE #3. As implementações desses changes existem apenas como **alterações locais não commitadas** nos arquivos listados acima.

---

## 4. Mudanças locais não commitadas (o que representam)

### Arquivos modificados (git diff)

| Arquivo | O que representa | Linhas (diff --stat) |
|---------|-------------------|----------------------|
| **goldeouro-player/src/services/gameService.js** | **CHANGE #2:** Tratamento de erro no `catch` de `processShot`: priorizar `error.response?.data?.message`, substituir "Saldo insuficiente" por "Você está sem saldo. Adicione saldo para jogar." | +7 -1 |
| **goldeouro-player/src/pages/GameShoot.jsx** | **CHANGE #2 + CHANGE #3:** (1) Uso da mensagem retornada pelo gameService no toast; (2) **CHANGE #3:** estado `highlightRecharge`, timer, detecção da mensagem de saldo insuficiente, destaque visual temporário no botão "Recarregar", cleanup do timer. | +27 -2 |

**Total:** 2 arquivos alterados, 31 inserções, 3 deleções.

### Arquivos untracked

- Relatórios em `docs/relatorios/RELEASE-CHECKPOINT/` (CHANGE-2-*, CHANGE-3-*).
- `prod-assets-index.js` e `prod-index.html`: artefatos de auditoria de produção (GET dos assets), não fazem parte do CHANGE #2/#3.

---

## 5. Relação local vs origin

- **git fetch --all --tags:** Executado sem erros.
- **git status -sb:** Branch `feat/payments-ui-pix-presets-top-copy` com modificações locais (M) e untracked (??); não foi analisado diff em relação a `origin/feat/payments-ui-pix-presets-top-copy` (branch pode não existir no remote).
- **Conclusão:** As alterações de CHANGE #2 e CHANGE #3 não estão commitadas; portanto, não estão no remote. O que está no navegador em produção vem de outro build (outro branch/commit), que **não** inclui esses changes — daí “não aparece no navegador”.

---

## 6. Evidências de build/deploy local

### Diretórios verificados

| Caminho | Existe? | Observação |
|---------|---------|-------------|
| **goldeouro-player/dist** | Sim | Build Vite presente |
| **goldeouro-player/build** | Não | — |
| **goldeouro-player/dev-dist** | Sim | 1 arquivo (listagem anterior) |

### Datas relevantes em `goldeouro-player/dist`

- **dist/index.html, dist/manifest.webmanifest, dist/registerSW.js, dist/assets/index-B2FR4y37.js, dist/assets/index-sYayxj5X.css:** LastWriteTime **05/02/2026 23:20:14** (ou 23:20:19 para sw/workbox).
- **Conclusão:** O build local em `dist` é de 05/02/2026 ~23:20. Se esse build tiver sido gerado **com** as alterações atuais (GameShoot.jsx e gameService.js) no working tree, o bundle local incluiria CHANGE #2 e #3. Em produção (www.goldeouro.lol) o bundle servido era **index-qIGutT6K.js** (auditoria anterior), ou seja, outro hash — logo produção foi buildada a partir de outro commit/estado e **não** contém CHANGE #2 nem CHANGE #3.

---

## 7. Conclusão por change

| Change | Status no repositório | Conclusão |
|--------|------------------------|-----------|
| **CHANGE #2** (mensagem amigável “Você está sem saldo. Adicione saldo para jogar.”) | Implementado apenas em arquivos modificados localmente; **nenhum commit** encontrado. | **PENDENTE** (não commitado) |
| **CHANGE #3** (destaque temporário no botão Recarregar) | Implementado apenas em arquivos modificados localmente; **nenhum commit** encontrado. | **PENDENTE** (não commitado) |

---

## 8. Recomendação do próximo passo seguro (sem executar)

1. **Fazer commit das alterações de CHANGE #2 e CHANGE #3** no branch atual (`feat/payments-ui-pix-presets-top-copy`) ou em um branch dedicado (ex.: `feat/change2-change3-saldo-ux`):
   - Incluir: `goldeouro-player/src/services/gameService.js`, `goldeouro-player/src/pages/GameShoot.jsx`.
   - Opcional: incluir os relatórios em `docs/relatorios/RELEASE-CHECKPOINT/` (CHANGE-2-*, CHANGE-3-*) se quiser documentação versionada.
   - Mensagem sugerida (exemplo): `feat: CHANGE #2 e #3 - mensagem saldo insuficiente + highlight botão Recarregar (frontend only)`.
2. **Gerar novo build do frontend** após o commit (`npm run build` ou equivalente em `goldeouro-player`) para validar que o bundle inclui as alterações.
3. **Deploy do frontend** (Vercel/outro pipeline) a partir do branch/commit que contém CHANGE #2 e #3, para que a mensagem e o destaque apareçam no navegador em produção.
4. **Não** criar tags CHANGE2/CHANGE3 nem dar push até que o fluxo de revisão/deploy esteja alinhado com o processo do projeto.

---

*Auditoria realizada em modo READ-ONLY. Nenhum arquivo foi editado; nenhum commit, tag ou push foi executado.*
