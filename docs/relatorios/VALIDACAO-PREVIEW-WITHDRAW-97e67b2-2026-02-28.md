# Validação Runtime — Preview withdraw (97e67b2)

**Branch:** preview/withdraw-merge-97e67b2 (já com push; origin/main **não** alterado)  
**Objetivo:** Obter a URL do Preview, executar Q1–Q5 e decidir APROVADO ou REPROVADO para `git push origin main`.  
**Regras:** Sem alterar código, sem merge, sem push em main. Apenas DevTools (Network).

---

## PARTE 1 — Como pegar a URL do Preview

Escolha **um** dos caminhos (o mais rápido para você):

### A) GitHub (recomendado)

1. Abra: **https://github.com/indesconectavel/gol-de-ouro/pull/new/preview/withdraw-merge-97e67b2**
2. Crie o PR (título ex.: `preview: withdraw merge 97e67b2`), base = `main`. **Não** faça merge.
3. Espere o comentário do bot da Vercel com o link **Preview** (ex.: `https://goldeouro-player-xxxxx.vercel.app`).
4. Copie essa URL e preencha abaixo.

### B) Vercel Dashboard

1. Acesse **Vercel** → projeto **goldeouro-player** → **Deployments**.
2. Filtre/localize o deployment do branch **preview/withdraw-merge-97e67b2** (ou commit **97e67b2**).
3. Abra o deployment e copie a **URL do Preview**.
4. Preencha abaixo.

### C) Vercel CLI

- No diretório do player: `vercel login` (se ainda não estiver logado), depois `vercel ls`.
- Identifique na lista o deployment desse branch/commit e anote a URL.
- *(Na máquina do auditor o CLI não estava autenticado; use A ou B.)*

---

**URL do Preview (preencher após obter):**

```
_________________________________________________
```

---

## PARTE 2 — Validação Q1–Q5 (DevTools > Network > Fetch/XHR)

**Preparação:** Abra a URL do Preview em **aba anônima**. F12 → **Network** → **Fetch/XHR** → marque **Disable cache** → **Clear**.

| # | O que fazer | Critério de sucesso | Resultado (OK/FAIL) |
|---|-------------|----------------------|---------------------|
| **Q1** | Ir para **/withdraw** | Aparece **GET** .../api/user/profile (status 200; response tem saldo). Aparece **GET** .../api/withdraw/history (status 200; response tem array). | |
| **Q2** | **Clear** na Network. Preencher valor e chave PIX. Clicar **Solicitar Saque**. | Aparece **POST** .../api/withdraw/request. Depois aparece novo **GET** profile e novo **GET** history. | |
| **Q3** | No momento do saque (mesmo passo do Q2) | **Não** aparece **POST** .../api/payments/pix/criar. | |
| **Q4** | Na Network, abrir o arquivo **assets/index-*.js** (ou nome do JS principal) → aba **Response**. Ctrl+F buscar **"/api/withdraw/request"** OU **"withdrawService"**. | A busca encontra pelo menos uma das strings. | |
| **Q5** | Evidência: (i) lista de requests no SUBMIT com POST withdraw/request + GETs, sem POST pix/criar; (ii) busca no index-*.js encontrando a string. | Conseguiu descrever ou anexar as duas evidências (print ou descrição curta). | |

**Anotar só se precisar (sem token):** status code + URL + nome do request (ex.: `200`, `https://..../api/withdraw/request`, `withdraw/request`).

---

## PARTE 3 — Decisão final

Preencha após executar Q1–Q5:

- **Q1:** OK / FAIL  
- **Q2:** OK / FAIL  
- **Q3:** OK / FAIL  
- **Q4:** OK / FAIL  
- **Q5:** OK / FAIL  

---

### Se Q1, Q2, Q3, Q4 e Q5 = OK

**APROVADO.** Pode executar:

```powershell
git checkout main
git push origin main
```

Em seguida, validar produção em https://www.goldeouro.lol (checklist da FASE 3 do relatório MERGE-HOTFIX-WITHDRAW-PROD-2026-02-28.md).

---

### Se algum Q = FAIL

**REPROVADO.** Preencha:

- **Qual Q falhou:** Q___
- **O que apareceu no lugar:** _(ex.: apareceu POST .../api/payments/pix/criar no saque; ou não apareceu GET withdraw/history; ou a busca no index-*.js não encontrou a string)_
- **Provável causa:** _(ex.: deploy não é do branch preview/withdraw-merge-97e67b2; cache/SW; branch errado no deployment)_
- **Próximo passo mínimo:** _(ex.: abrir o deployment correto na Vercel e usar a URL desse branch; ou aba anônima + Disable cache e repetir; ou conferir no GitHub qual commit a Vercel buildou)_

**Não** execute `git push origin main` até que todos os Q estejam OK no Preview (ou até que a causa do FAIL seja corrigida e a validação repetida).

---

*Nenhum código foi alterado. Apenas guia de validação e registro de evidências.*
