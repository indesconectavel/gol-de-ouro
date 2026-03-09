# Merge Hotfix Withdraw — Produção 2026-02-28

**Data/hora:** 2026-02-28  
**Objetivo:** Colocar o hotfix withdraw (branch `hotfix/withdraw-real-endpoints`, commit 8f4dec1) em produção com risco mínimo, preservando rastreabilidade. Sem mudanças extras fora do hotfix (somente merge).

---

## Hashes antes / depois

| Momento | Branch | Commit | Descrição |
|---------|--------|--------|-----------|
| **Antes** | main | **7afa349** | fix(cors): allow goldeouro-player vercel previews |
| **Antes** | hotfix/withdraw-real-endpoints | **8f4dec1** | fix(withdraw): use real withdraw endpoints and reload profile |
| **Depois** | main | **97e67b2** | Merge branch 'hotfix/withdraw-real-endpoints' into main - withdraw real endpoints |

- **Merge commit (full hash):** `97e67b2a1cf4052b942950a1f50036693705c953`  
- **Parents:** 7afa349 (main anterior), 8f4dec1 (hotfix).

---

## Arquivos alterados (pelo merge)

O diff entre main e hotfix continha **apenas** estes arquivos (confirmado em FASE 0):

| Arquivo | Alteração |
|---------|------------|
| goldeouro-player/src/config/api.js | +2 linhas (WITHDRAW_REQUEST, WITHDRAW_HISTORY) |
| goldeouro-player/src/pages/Withdraw.jsx | alterado (withdrawService; requestWithdraw/getWithdrawHistory; sem createPix no saque) |
| goldeouro-player/src/services/withdrawService.js | **novo** (59 linhas) |

- **Confirmação pós-merge:** `withdrawService.js` existe em main (`git show main:goldeouro-player/src/services/withdrawService.js` retorna conteúdo).

---

## FASE 0 — Pré-checagens (executadas)

- **git status:** Branch hotfix/withdraw-real-endpoints, up to date com origin; untracked em docs/relatorios.
- **git branch --show-current:** hotfix/withdraw-real-endpoints (antes do checkout).
- **git log -1 main:** 7afa349 fix(cors): allow goldeouro-player vercel previews
- **git log -1 hotfix/withdraw-real-endpoints:** 8f4dec1 fix(withdraw): use real withdraw endpoints and reload profile
- **git diff --name-only main..hotfix/withdraw-real-endpoints:**  
  `goldeouro-player/src/config/api.js`  
  `goldeouro-player/src/pages/Withdraw.jsx`  
  `goldeouro-player/src/services/withdrawService.js`  
- **Confirmação:** O diff envolve **apenas** os três arquivos acima. Nenhum outro arquivo do hotfix.

---

## FASE 1 — Validar Preview (antes de produção)

### 1.1 Branch de preview (commit 97e67b2, sem push em main)

Para validar na Vercel com risco mínimo **sem** empurrar `origin/main`:

- **Branch criado:** `preview/withdraw-merge-97e67b2` a partir do main local (97e67b2).
- **Push executado:** `git push -u origin preview/withdraw-merge-97e67b2` — **origin/main não foi alterado.**
- **PR sugerido:** https://github.com/indesconectavel/gol-de-ouro/pull/new/preview/withdraw-merge-97e67b2

### 1.2 Onde obter a URL do Preview (Vercel)

- **Opção 1 — GitHub:** Abra o PR do branch `preview/withdraw-merge-97e67b2` para `main`. O comentário do bot da Vercel no PR contém o link do Preview (ex.: `https://goldeouro-player-xxxxx.vercel.app`). Clique em "View Preview" ou no link do deployment.
- **Opção 2 — Vercel Dashboard:** Vercel → projeto **goldeouro-player** → **Deployments**. Localize o deployment do branch `preview/withdraw-merge-97e67b2` (ou commit 97e67b2). Abra o deployment e use a URL de Preview.
- **Opção 3 — Vercel CLI (somente leitura):** Com CLI instalado e logado, no diretório do player: `vercel ls` para listar deployments; identifique o do branch e anote a URL.

- **URL do Preview (preencher após obter):** ________________________________

### 1.3 Checklist de runtime no Preview (DevTools → Network, Fetch/XHR)

| # | Ação | Esperado | OK? |
|---|------|----------|-----|
| 1 | Abrir /withdraw (LOAD) | GET /api/user/profile e GET /api/withdraw/history | |
| 2 | Clicar "Solicitar Saque" (SUBMIT) | POST /api/withdraw/request; depois novo GET profile e GET history | |
| 3 | No momento do saque | **Não** deve haver POST /api/payments/pix/criar | |

### 1.4 Prova de bundle no Preview

- Abrir o JS principal (ex.: `assets/index-*.js`) na aba Network → Response.
- Buscar (Ctrl+F): **`/api/withdraw/request`** OU **`withdrawService`**.
- **Encontrou?** SIM / NÃO

### 1.5 Evidências (preencher após validar)

- Data/hora da validação Preview: ________________
- URL do Preview usada: ________________
- Resultado: PASS / FAIL. Observações: ________________

**Mini-checklist (Q1–Q5) — preencher OK/FAIL:**

| # | Item | OK/FAIL |
|---|------|---------|
| Q1 | LOAD /withdraw: GET .../api/user/profile | |
| Q2 | LOAD /withdraw: GET .../api/withdraw/history | |
| Q3 | SUBMIT: POST .../api/withdraw/request + novo GET profile e GET history | |
| Q4 | Não aparece POST .../api/payments/pix/criar no saque | |
| Q5 | No index-*.js encontra "/api/withdraw/request" OU "withdrawService" | |

**Se falhou:** Item que falhou: Q___ . Motivo provável: ________________

**Se Preview OK:** `git checkout main` e `git push origin main`. Depois validar produção (FASE 3).

**(Opcional)** Limpeza do branch de preview: manter como registro ou `git push origin --delete preview/withdraw-merge-97e67b2`.

---

## FASE 2 — Merge controlado em main (executado)

- **Comando:** `git checkout main` e `git merge hotfix/withdraw-real-endpoints --no-ff -m "Merge branch 'hotfix/withdraw-real-endpoints' into main - withdraw real endpoints"`.
- **Resultado:** Merge feito pela estratégia 'ort'. 3 arquivos alterados, 125 inserções, 54 deleções; `withdrawService.js` criado.
- **main após merge:** `git log -1 --oneline main` → **97e67b2** Merge branch 'hotfix/withdraw-real-endpoints' into main - withdraw real endpoints.
- **Confirmação:** `withdrawService.js` existe em main (conteúdo exibido via `git show main:goldeouro-player/src/services/withdrawService.js`).

**Próximo passo (você):** Fazer **push** de main para origin para disparar o deploy de produção na Vercel:  
`git push origin main`

---

## FASE 3 — Produção (Vercel) + Validação

### 3.1 Confirmação de que produção builda main

- Se tiver Vercel CLI: `vercel inspect https://www.goldeouro.lol` (ou listar deployments e ver qual está no domínio) e confirmar que o deployment ativo usa o commit **97e67b2** (ou superior).
- Sem CLI: Vercel Dashboard → projeto do player → Settings → Git → **Production Branch** deve ser `main`. Após o push, o último deployment de main deve ser o que serve www.goldeouro.lol.

### 3.2 Checklist em www.goldeouro.lol (após deploy)

| # | Ação | Esperado | OK? |
|---|------|----------|-----|
| 1 | Abrir https://www.goldeouro.lol (aba anônima, Disable cache). Ir em /withdraw. | GET /api/user/profile e GET /api/withdraw/history | |
| 2 | Clicar "Solicitar Saque" | POST /api/withdraw/request; depois GET profile e GET history | |
| 3 | No momento do saque | **Não** deve haver POST /api/payments/pix/criar | |

### 3.3 OK para go-live do saque

- **Data/hora validação produção:** ________________
- **Checklist produção:** PASS / FAIL
- **Declaração:** [ ] Confirmado: em www.goldeouro.lol o fluxo de saque usa POST /api/withdraw/request e não usa POST /api/payments/pix/criar. **OK para go-live do saque.**

---

## FASE 4 — Rollback rápido (se algo der errado)

### 4.1 Comando de revert (merge commit)

O merge foi **no-ff**, então o commit de merge é **97e67b2**. Para reverter o merge (voltar main ao estado anterior ao hotfix):

```bash
git checkout main
git revert -m 1 97e67b2a1cf4052b942950a1f50036693705c953 --no-edit
git push origin main
```

- **-m 1** mantém o primeiro parent (7afa349 = main anterior) como linha principal; o revert desfaz as alterações do hotfix em main.
- Após o push, a Vercel fará deploy do novo commit de revert; www.goldeouro.lol voltará a servir o bundle anterior (createPix no /withdraw).

### 4.2 Validação pós-rollback

- Abrir www.goldeouro.lol → /withdraw → Network.
- Esperado após rollback: ao solicitar saque pode voltar a aparecer POST /api/payments/pix/criar (comportamento antigo). Confirmar que o app não quebrou (login, navegação, depósitos).

### 4.3 Resumo do plano de rollback

| Passo | Ação |
|-------|------|
| 1 | `git checkout main` |
| 2 | `git revert -m 1 97e67b2a1cf4052b942950a1f50036693705c953 --no-edit` |
| 3 | `git push origin main` |
| 4 | Aguardar deploy na Vercel; validar www.goldeouro.lol |

---

## Resumo

- **Pré-checagens:** OK; diff apenas nos 3 arquivos do hotfix.
- **Merge:** Realizado em main (commit **97e67b2**). `withdrawService.js` existe em main.
- **Preview:** Checklist e prova de bundle documentados; preencher evidências após validar no deployment de preview do branch hotfix (ou do main pós-merge, se preferir).
- **Produção:** Após `git push origin main`, validar em www.goldeouro.lol com o checklist da FASE 3 e marcar "OK para go-live do saque" quando confirmado.
- **Rollback:** Revert do merge com `git revert -m 1 97e67b2...` + push; validar produção após o deploy.
