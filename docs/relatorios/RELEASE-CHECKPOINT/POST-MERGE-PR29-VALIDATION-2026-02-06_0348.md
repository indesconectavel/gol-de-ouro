# Validação Pós-Merge PR #29 — Relatório de Auditoria

**Arquivo:** `POST-MERGE-PR29-VALIDATION-2026-02-06_0348.md`  
**Data/hora da validação:** 2026-02-06 (horário local da execução dos comandos)  
**Objetivo:** Confirmar merge do PR #29 no `main`, estado dos workflows, deploy do player (Vercel) e CSP report-only no backend; registrar evidências.  
**Regras:** 100% factual; não assumir; alterações apenas em docs (markdown); sem commit.

---

## 1. Identificação

| Item | Valor |
|------|--------|
| **Diretório de execução** | `e:\Chute de Ouro\goldeouro-backend` |
| **Branch local** | `main` |
| **HEAD local** | `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b` |
| **git log -1 --oneline** | `3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy` |
| **Remote** | `origin` → `https://github.com/indesconectavel/gol-de-ouro.git` (fetch/push) |
| **git status -sb** | `## main...origin/main` (+ arquivos untracked em `docs/relatorios/RELEASE-CHECKPOINT/`) |

---

## 2. Confirmação do merge no main

| Item | Valor |
|------|--------|
| **SHA do topo de origin/main** | `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b` |
| **Merge commit do PR #29** | **CONFIRMADO** — mesmo SHA `3ae3786` |
| **Mensagem do merge** | `Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy` |
| **Parents do merge** | `0a2a5a1` (main anterior), `d67f6b5` (branch do PR) |

### Commits relevantes presentes no histórico (origin/main)

- `3ae3786` — Merge pull request #29
- `d67f6b5` — fix(security): CSP report-only no helmet (CHANGE #5)
- `56189c1` — docs: PR #29 prep + audit fix report
- `0eb18af` — chore(frontend): corrigir vulnerabilidades (npm audit)
- `2ad4825` — CHANGE #4: gatilho semântico saldo insuficiente
- `7f73abd` — CHANGE #3: destaque botão Recarregar
- `0361d48` — CHANGE #2: mensagem amigável ao jogar sem saldo
- `b4aa303` — feat: payments UI pix presets + copy-top + default 200

### Branches remotos que contêm o commit d67f6b5 (CHANGE #5)

```
origin/HEAD -> origin/main
origin/feat/payments-ui-pix-presets-top-copy
origin/main
```

### Saída de `git show -1 --name-only 3ae3786`

(O merge não altera arquivos adicionais além do merge commit; arquivos vêm dos dois parents.)

---

## 2b. FASE F — Verificação do PR #29 (gh) e associação ao merge

**Comando:** `gh pr view 29 --json state,mergeCommit,mergedAt,baseRefName,headRefName,headRefOid,url,title`

### Resultado (JSON)

| Campo | Valor |
|-------|--------|
| state | **MERGED** |
| mergedAt | 2026-02-06T06:39:39Z |
| mergeCommit.oid | **3ae3786e4cc1896461df4b25713adfa6d3c4ad4b** |
| baseRefName | main |
| headRefName | feat/payments-ui-pix-presets-top-copy |
| headRefOid | d67f6b55c9404ff9dc2c577480487214e6464572 |
| url | https://github.com/indesconectavel/gol-de-ouro/pull/29 |
| title | Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only |

### Comparação com origin/main

| Item | PR #29 (gh) | origin/main |
|------|-------------|-------------|
| Merge commit SHA | 3ae3786e4cc1896461df4b25713adfa6d3c4ad4b | 3ae3786e4cc1896461df4b25713adfa6d3c4ad4b |

**Conclusão FASE F:** PR #29 está **MERGEADO**. `mergeCommit.oid` coincide com o SHA do topo de `origin/main`. Não é caso "NÃO MERGEADO".

---

## 3. Confirmação de Actions no commit do main

**headSha usado:** `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b`  
**gh CLI:** `gh version 2.83.0 (2025-11-04)`

### Runs do branch main para o SHA do merge (3ae3786)

| workflowName | databaseId | status | conclusion | updatedAt (UTC) |
|--------------|------------|--------|------------|------------------|
| ⚠️ Rollback Automático – Gol de Ouro | 21741447819 | completed | **skipped** | 2026-02-06T06:43:39Z |
| Dependabot Updates | 21741366486 | completed | success | 2026-02-06T06:40:36Z |
| Dependabot Updates | 21741366487 | completed | success | 2026-02-06T06:40:37Z |
| Dependabot Updates | 21741366491 | completed | success | 2026-02-06T06:40:38Z |
| CI | 21741363810 | completed | **success** | 2026-02-06T06:39:56Z |
| 🧪 Testes Automatizados | 21741363819 | completed | **success** | 2026-02-06T06:40:18Z |
| 🎨 Frontend Deploy (Vercel) | 21741363822 | completed | **success** | 2026-02-06T06:40:54Z |
| 🔒 Segurança e Qualidade | 21741363806 | completed | **success** | 2026-02-06T06:42:10Z |
| 🚀 Backend Deploy (Fly.io) | 21741363814 | completed | **failure** | 2026-02-06T06:43:16Z |
| 🚀 Pipeline Principal - Gol de Ouro | 21741363811 | completed | **success** | 2026-02-06T06:43:36Z |
| .github/workflows/configurar-seguranca.yml | 21741363521 | completed | **failure** | 2026-02-06T06:39:42Z |

### Conclusão dos workflows

- **Verdes (success):** CI, Testes Automatizados, Frontend Deploy (Vercel), Segurança e Qualidade, Pipeline Principal, Dependabot (vários).
- **Falhas:**  
  - **🚀 Backend Deploy (Fly.io)** — [run 21741363814](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21741363814)  
  - **.github/workflows/configurar-seguranca.yml** — [run 21741363521](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21741363521)
- **Skipped:** Rollback Automático (esperado quando não há rollback).

**Estado geral:** **NÃO todos os workflows verdes** — 2 runs com `conclusion: failure` no commit do merge.

---

## 4. Evidência de produção (player Vercel)

**URL:** https://www.goldeouro.lol

### HEAD na raiz

| Campo | Valor |
|-------|--------|
| StatusCode | 200 |
| X-Vercel-Cache | **HIT** |
| X-Vercel-Id | gru1::w5hlr-1770360459468-91966ff10e19 |
| Last-Modified | **Fri, 06 Feb 2026 06:40:25 GMT** |
| ETag | "c1ec1674a7f5400872b7f55b9490534d" |
| Cache-Control | no-cache, no-store, must-revalidate |
| Content-Type | text/html; charset=utf-8 |
| Server | Vercel |
| Strict-Transport-Security | max-age=63072000 |
| Content-Security-Policy | default-src 'self' 'unsafe-inline' ... (presente no HTML servido) |

**Interpretação:** `Last-Modified` (06:40:25 UTC) é posterior ao merge e coincide com o horário de conclusão do **Frontend Deploy (Vercel)** (06:40:54Z). **CONFIRMADO** que produção está servindo build pós-merge.

### Assets extraídos do HTML

| Asset | Observação |
|-------|------------|
| `/assets/index-D2C-cADa.js` | Bundle JS principal (hash do build) |
| `/assets/index-BplTpheb.css` | CSS principal (hash do build) |

### HEAD no bundle JS principal

| Campo | Valor |
|-------|--------|
| URL | https://www.goldeouro.lol/assets/index-D2C-cADa.js |
| StatusCode | 200 |
| ETag | "3ff885af9974a84050b5adc6cd97c91f" |
| Cache-Control | public, max-age=0, must-revalidate |
| Last-Modified | **Fri, 06 Feb 2026 06:40:17 GMT** |
| X-Vercel-Cache | HIT |
| Date (resposta) | Fri, 06 Feb 2026 06:48:21 GMT |

**Conclusão:** Build do frontend com assets hasheados e datas de 06 Feb 2026 ~06:40 UTC — **evidência de que o player em produção está com o build novo (pós-merge PR #29).**

### HEAD em /assets/ (diretório)

Não executado com sucesso para listagem; evidência suficiente obtida via HTML + bundle JS.

---

## 5. Checklist funcional

| Item | Resultado | Nota |
|------|-----------|------|
| Login / fluxo de jogo | **NÃO CONFIRMADO** | Sem credenciais e sem navegador; não testado. |
| Health/endpoints públicos | **CONFIRMADO** | Backend `/health` retorna 200 (ver seção 6). |
| Player carrega (HTTP 200 + HTML + assets) | **CONFIRMADO** | Raiz 200, HTML com assets, JS/CSS com Last-Modified do dia do merge. |

Não há endpoint público de “version” ou meta tag de release consultada nesta validação; nenhum teste de comportamento in-app foi realizado.

---

## 6. Verificação CSP report-only no backend

**URL:** https://goldeouro-backend-v2.fly.dev/health  
**Método:** HEAD

### Resultado

| Campo | Valor |
|-------|--------|
| StatusCode | 200 |
| Server | Fly/bb3b4cf3 (2026-02-05) |
| fly-request-id | 01KGRV9QBG6K4H0B0FKHCYG8T5-gru |

### Headers de segurança observados (lista)

- cross-origin-opener-policy: same-origin  
- cross-origin-resource-policy: same-origin  
- referrer-policy: no-referrer  
- strict-transport-security: max-age=31536000; includeSubDomains; preload  
- x-content-type-options: nosniff  
- x-frame-options: SAMEORIGIN  
- x-xss-protection: 0  

### CSP

- **Content-Security-Policy** (enforce): **ausente** na resposta de `/health` — **CONFIRMADO** (não há CSP enforcing).
- **Content-Security-Policy-Report-Only**: **ausente** na resposta de `/health`.

**Conclusão:** **NÃO CONFIRMADO** que o backend em produção está servindo CSP Report-Only. O workflow **Backend Deploy (Fly.io)** falhou no commit do merge; portanto o backend em Fly pode ainda estar na revisão anterior ao CHANGE #5. A verificação foi apenas no endpoint `/health`; outros endpoints não foram testados.

---

## 7. FASE G — Decisão GO/NO-GO (critérios estritos)

| Critério | Resultado |
|----------|-----------|
| Merge do PR #29 no main | **GO** — SHA 3ae3786 confirmado. |
| Todos os workflows verdes | **NO-GO** — 2 falhas: Backend Deploy (Fly), configurar-seguranca. |
| Deploy do player (Vercel) com build novo | **GO** — Last-Modified e assets de 06 Feb 2026 ~06:40 UTC. |
| CSP report-only no backend em produção | **NO-GO** — Não confirmado; deploy Fly falhou; header não observado em `/health`. |
| Checklist funcional (login/jogo) | **NÃO CONFIRMADO** — Não testado. |

**Veredicto:**  
- **Release do frontend (player):** considerada **validada** para o que foi possível verificar (merge no main, Frontend Deploy success, produção servindo build novo).  
- **Release “completa” (incluindo backend + todos os checks):** **não validada** — Backend Deploy e configurar-seguranca falharam; CSP report-only no backend não está confirmado em produção.

---

## 8. FASE H — Rollback documentado

1. **Vercel (player):** Projeto no dashboard: **goldeouro-player**. Usar “Promote to Production” no dashboard Vercel para reverter para o deployment anterior ao commit 3ae3786 (se necessário).  
2. **Git (revert do merge commit):** executar em sequência:
   ```powershell
   git checkout main
   git pull origin main
   git revert -m 1 3ae3786e4cc1896461df4b25713adfa6d3c4ad4b --no-edit
   git push origin main
   ```
   Merge SHA: `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b`. `-m 1` mantém o primeiro parent (main); `--no-edit` usa mensagem de revert padrão.  
3. **Backend (Fly):** Deploy do merge falhou; versão em Fly é anterior ao merge. Nenhuma ação de rollback de backend necessária. **Tag PRE:** Se existir tag do merge (ex.: pre-release-29), usar como referência no Vercel; não verificada nesta validação.

---

## 9. Conclusão final (GO/NO-GO)

**GO/NO-GO:** **NO-GO**

**Evidências chave:** (1) Merge: PR #29 MERGED, mergeCommit.oid = 3ae3786 = origin/main. (2) Workflows: 2 failures (Backend Deploy Fly, configurar-seguranca). (3) Player: 200, assets no HTML, Last-Modified 06 Feb 2026 ~06:40 UTC. (4) Backend: /health 200; Content-Security-Policy-Report-Only ausente.

**Próximo passo recomendado:** Corrigir Backend Deploy (Fly) e configurar-seguranca; redeploy do backend; revalidar (checar header Report-Only em /health) para obter GO. Opcional: rollback conforme FASE H (Vercel promote + git revert).

---

## 10. Apêndice — Outputs brutos relevantes

### FASE A — Precheck local

```
Get-Location        → (diretório atual: e:\Chute de Ouro\goldeouro-backend)
git status -sb      → ## main...origin/main + untracked docs
git branch          → main
git rev-parse HEAD  → 3ae3786e4cc1896461df4b25713adfa6d3c4ad4b
git log -1 --oneline → 3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy
git remote -v       → origin https://github.com/indesconectavel/gol-de-ouro.git (fetch/push)
```

### FASE F — gh pr view 29

```
gh pr view 29 --json state,mergeCommit,mergedAt,baseRefName,headRefName,headRefOid,url,title
{"baseRefName":"main","headRefName":"feat/payments-ui-pix-presets-top-copy","headRefOid":"d67f6b55c9404ff9dc2c577480487214e6464572","mergeCommit":{"oid":"3ae3786e4cc1896461df4b25713adfa6d3c4ad4b"},"mergedAt":"2026-02-06T06:39:39Z","state":"MERGED","title":"Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only","url":"https://github.com/indesconectavel/gol-de-ouro/pull/29"}
```

### FASE B — origin/main (após fetch)

```
git log --oneline -n 20 origin/main
3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy
d67f6b5 fix(security): CSP report-only no helmet (destravar CodeQL sem regressão)
56189c1 docs: PR #29 prep + audit fix report (release checkpoint)
...
```

### FASE C — Runs do headSha 3ae3786 (resumo JSON filtrado)

Runs com headSha `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b`: CI success, Testes Automatizados success, Frontend Deploy (Vercel) success, Segurança e Qualidade success, Backend Deploy (Fly) failure, Pipeline Principal success, configurar-seguranca failure, Rollback skipped (+ Dependabot).

### FASE D — Player (resumo)

- HEAD https://www.goldeouro.lol → 200, Last-Modified Fri, 06 Feb 2026 06:40:25 GMT, X-Vercel-Cache HIT.  
- GET HTML → assets: `/assets/index-D2C-cADa.js`, `/assets/index-BplTpheb.css`.  
- HEAD do JS → 200, ETag "3ff885af9974a84050b5adc6cd97c91f", Last-Modified Fri, 06 Feb 2026 06:40:17 GMT.

### FASE E — Backend /health

Headers listados na seção 6; sem `Content-Security-Policy` nem `Content-Security-Policy-Report-Only`.

---

*Fim do relatório. Nenhuma alteração de código ou commit foi realizado.*
