# Preparação de PR para main — Release CHANGE #2/#3/#4 + PIX UI

**Data:** 2026-02-06  
**Branch:** `feat/payments-ui-pix-presets-top-copy`  
**Objetivo:** Promoção segura para produção via merge em `main`, com validação e rollback documentado.

---

## FASE 0 — Precheck (executado)

| Item | Resultado |
|------|-----------|
| **git status -sb** | `## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy` — 1 arquivo untracked: `docs/relatorios/RELEASE-CHECKPOINT/DEPLOY-AUDIT-PLAYER-readonly.md` |
| **git fetch --all --tags** | OK |
| **Branch atual** | `feat/payments-ui-pix-presets-top-copy` |
| **Upstream** | `origin/feat/payments-ui-pix-presets-top-copy` |

### Commits do CHANGE no branch (confirmados no log)

| Hash | Mensagem |
|------|----------|
| 0361d48 | CHANGE #2: mensagem amigável ao jogar sem saldo (frontend) |
| 7f73abd | CHANGE #3: destaque no botão Recarregar ao jogar sem saldo (frontend) |
| 2ad4825 | CHANGE #4: gatilho semântico p/ saldo insuficiente (frontend) |
| b4aa303 | feat: payments UI pix presets + copy-top + default 200 (v1 safe) |
| c5d5d6c | docs: relatório CHANGE #4 com hash correto para rollback (2ad4825) |
| bb11bf7 | docs: adicionar relatórios de auditoria e checkpoint (CHANGE #2/#3) |
| 2195be8 | docs: auditoria global de pendências (readonly) |
| 3b16284 | docs: relatórios finais de higiene e cleanup (release checkpoint) |

---

## FASE 1 — Tag pré-merge (criada e enviada)

| Item | Valor |
|------|--------|
| **Tag** | `PRE_MERGE_MAIN_2026-02-06_0152` |
| **Commit** | HEAD do branch no momento da tag = `3b16284` |
| **Comando criação** | `git tag PRE_MERGE_MAIN_2026-02-06_0152` |
| **Push** | `git push origin PRE_MERGE_MAIN_2026-02-06_0152` — executado com sucesso |

**Uso para rollback:** Em caso de problema após o merge, é possível voltar ao estado anterior a este PR fazendo checkout da tag ou revertendo no `main` até o commit anterior ao merge. A tag marca o último commit do branch de feature antes de entrar em `main`.

---

## FASE 2 — Pipeline (READ-ONLY)

| Workflow | Gatilho | Efeito no frontend (player) |
|----------|---------|-----------------------------|
| **frontend-deploy.yml** | `push` em `main` ou `dev` (paths: `goldeouro-player/**` ou o próprio workflow) | Se branch = `main`: deploy produção Vercel (`--prod --yes`). Se branch = `dev`: deploy preview. |
| **main-pipeline.yml** | `push` em `main` ou `workflow_dispatch` | Deploy backend (Fly.io) + deploy frontend em `./goldeouro-player` com `npx vercel --prod --yes`. |

**Conclusão:** Push em `main` após o merge dispara deploy do player no Vercel (por um ou ambos os workflows). Não é necessário deploy manual.

---

## FASE 3 — PR: título e corpo

### Título sugerido

```
Release: PIX UI + saldo insuficiente UX (CHANGE #2/#3/#4) — frontend only
```

### Corpo do PR (copiar/colar no GitHub ou usar com `gh pr create --body-file`)

```markdown
## Resumo do que entra

- **CHANGE #2:** Mensagem amigável ao jogar sem saldo (frontend) — prioriza `error.response?.data?.message`, exibe "Você está sem saldo. Adicione saldo para jogar." quando aplicável.
- **CHANGE #3:** Destaque no botão Recarregar ao jogar sem saldo (frontend) — highlight temporário no botão Recarregar quando a API retorna saldo insuficiente.
- **CHANGE #4:** Gatilho semântico para saldo insuficiente (frontend) — uso de código de erro `INSUFFICIENT_BALANCE` em vez de comparação por string; maior robustez.
- **Payments UI:** Presets PIX, copy-top, default 200, bloco PIX no topo (já no branch).

Escopo: **apenas frontend (goldeouro-player)**. Sem alteração de backend, endpoints, PIX ou fluxo financeiro.

## Risco

**Baixo** — frontend only; sem mudança de contrato de API.

## Evidência e rastreabilidade

- Relatórios e specs em `docs/relatorios/RELEASE-CHECKPOINT/`:
  - CHANGE-2-implementacao-frontend.md, CHANGE-3-highlight-recarregar-frontend.md, CHANGE-4-robustez-gatilho-sem-string.md
  - GIT-AUDIT-CHANGE2-CHANGE3-readonly.md, DEPLOY-AUDIT-PLAYER-readonly.md
- Tag de checkpoint (pré-merge): `PRE_MERGE_MAIN_2026-02-06_0152` (commit 3b16284).

## Checklist de validação em produção (após merge)

- [ ] Aguardar conclusão do workflow de deploy (frontend-deploy ou main-pipeline) no commit em `main`.
- [ ] Abrir https://www.goldeouro.lol e testar fluxo de chute sem saldo:
  - [ ] Mensagem amigável ("Você está sem saldo. Adicione saldo para jogar." ou equivalente).
  - [ ] Destaque temporário no botão Recarregar.
- [ ] Validar página de Pagamentos: presets PIX, bloco PIX no topo, default 200.

## Rollback

- **Vercel:** No [Dashboard](https://vercel.com/goldeouro-admins-projects/goldeouro-player/deployments), promover o deployment anterior a este merge para Production ("Promote to Production").
- **Git:** No repo, reverter o merge em `main` e dar push para disparar novo deploy:
  ```bash
  git checkout main
  git pull origin main
  git revert -m 1 <merge-commit-hash> --no-edit
  git push origin main
  ```
- **Referência de estado anterior:** tag `PRE_MERGE_MAIN_2026-02-06_0152` (estado do branch antes do merge).
```

---

## Lista de commits incluídos (últimos 15)

```
3b16284 docs: relatórios finais de higiene e cleanup (release checkpoint)
2195be8 docs: auditoria global de pendências (readonly)
bb11bf7 docs: adicionar relatórios de auditoria e checkpoint (CHANGE #2/#3)
c5d5d6c docs: relatório CHANGE #4 com hash correto para rollback (2ad4825)
2ad4825 CHANGE #4: gatilho semântico p/ saldo insuficiente (frontend)
7f73abd CHANGE #3: destaque no botão Recarregar ao jogar sem saldo (frontend)
0361d48 CHANGE #2: mensagem amigável ao jogar sem saldo (frontend)
b4aa303 feat: payments UI pix presets + copy-top + default 200 (v1 safe)
d8ceb3b chore: checkpoint pre-v1 stable
3624a19 release: payout worker + correção supabase ping (1.2.1)
0a2a5a1 Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities
7dbb4ec fix: corrigir CSP para permitir scripts externos (PostHog e GTM)
31fbc7c fix: correções finais - 404 backend/frontend, workflow e auditoria completa
754040f fix(vercel): adicionar cleanUrls e trailingSlash para corrigir 404 na rota raiz
5f2cf5d fix(vercel): corrigir erros 404 para arquivos estáticos (favicons)
```

---

## Passo a passo para merge e validação

1. Abrir o PR no GitHub (base: `main`, head: `feat/payments-ui-pix-presets-top-copy`) com o título e corpo acima.
2. Revisar e aprovar (e garantir que o CI esteja verde, se aplicável).
3. Fazer **merge** em `main` (merge commit ou squash, conforme padrão do repositório).
4. Aguardar o deploy automático (push em `main` dispara frontend-deploy e/ou main-pipeline).
5. Validar em produção conforme o checklist no corpo do PR.
6. Opcional: criar tag de release no commit de merge em `main` (ex.: `v1.2.2`) após validação.

---

## Rollback resumido

| Método | Ação |
|--------|------|
| **Vercel promote** | Dashboard → Deployments → deployment anterior → "Promote to Production". |
| **Git revert** | `git checkout main && git pull && git revert -m 1 <merge-commit> --no-edit && git push origin main`. |
| **Tag de referência** | `PRE_MERGE_MAIN_2026-02-06_0152` — estado do branch antes do merge; pode ser usado para abrir branch de rollback ou comparar. |

---

---

## PR criado (gh CLI)

- **URL:** https://github.com/indesconectavel/gol-de-ouro/pull/29
- **Título:** Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only
- **Base:** `main` | **Head:** `feat/payments-ui-pix-presets-top-copy`

*Relatório gerado em 2026-02-06. Tag criada e enviada; PR #29 criado via `gh pr create`.*
