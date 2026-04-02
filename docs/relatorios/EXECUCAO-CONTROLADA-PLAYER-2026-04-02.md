# EXECUÇÃO CONTROLADA — PLAYER

**Data:** 2026-04-02  
**Objetivo:** alinhar o frontend Vercel com a cirurgia (`novoSaldo`, `GET /api/games/chutes/recentes`, cache) e provar runtime em `https://app.goldeouro.lol`.

---

## 1. Origem do deploy

| Item | Evidência |
|------|-----------|
| **Repositório** | Monorepo GitHub `indesconectavel/gol-de-ouro`; código do player em **`goldeouro-player/`**. |
| **Produção Vercel (workflow)** | `.github/workflows/frontend-deploy.yml`: job `deploy-production` só roda em **`github.ref == 'refs/heads/main'`** e com alterações em `goldeouro-player/**`. |
| **Branch com a cirurgia** | `migracao-canonica-gamefinal-main-2026-04-01` contém **`af72ce9746773a0163409427826cc5f468654d95`** (`fix: saldo real no shoot + apostas recentes via chutes`) e commits seguintes de documentação. |
| **`origin/main` antes do merge local** | **`b66867f`** — *não* ancestral de `af72ce9` (`git merge-base --is-ancestor af72ce9 origin/main` → **não**). Logo o **deploy automático de produção** que acompanha `main` **não** incluía a cirurgia até haver merge na `main` remota. |
| **Commit “em produção” (inferido)** | Enquanto `main` remota estiver em `b66867f` (ou equivalente sem merge), o bundle público reflete esse estado — **não** o `af72ce9`. |

**Nota Vercel Dashboard:** o “Production Branch” efetivo segue o que está configurado no projeto (em geral `main`). O ID exato do deployment em produção só aparece no painel Vercel; não foi lido via API nesta sessão.

---

## 2. Alinhamento de código

| Ação | Resultado |
|------|-----------|
| Merge local `migracao-canonica-gamefinal-main-2026-04-01` → `main` | **Fast-forward** até `847473f` (inclui `af72ce9` e docs). |
| **`git push origin main`** | **Rejeitado** — `main` é **branch protegida** (GitHub: alterações apenas via **pull request** + checks obrigatórios). |
| **Deploy via `npx vercel deploy --prod`** (diretório `goldeouro-player/` ou raiz com path) | **Falhou** — erro do projeto Vercel: path inexistente **`…\goldeouro-backend\goldeouro-player\goldeouro-player`** (Root Directory duplicado no painel, alinhado a `docs/relatorios/DIAGNOSTICO-DEPLOY-FRONTEND-VERCEL-2026-04-01.md`). |

**Estado após tentativas:** `main` **local** foi revertida com `git reset --hard origin/main` para não divergir do remoto; a branch de feature continua **4 commits à frente** de `origin/main` com a cirurgia.

**Próximo passo operacional (recomendado):** abrir **PR** `migracao-canonica-gamefinal-main-2026-04-01` → `main`, passar checks, mergear — isso dispara o workflow e publica produção **ou** corrigir **Root Directory** do projeto `goldeouro-player` no Vercel e usar CLI a partir do diretório correto.

---

## 3. Deploy realizado

| Campo | Valor |
|-------|--------|
| **Vercel produção** | **Não concluído** nesta sessão (bloqueios acima). |
| **GitHub Actions** | **Não disparado** para produção (push em `main` não aceito). |
| **Deployment id / URL / READY** | **N/A** |

---

## 4. Bundle validado

| Ambiente | Método | Resultado |
|----------|--------|-----------|
| **Build local** | `npm run build` em `goldeouro-player` (working tree com alterações não commitadas de migração GameFinal, se presentes) → artefato `dist/assets/index-DG9Sg3GZ.js` | Substring **`chutes/recentes`:** **SIM** — prova de que o **código-fonte atual** gera bundle com o endpoint da cirurgia. |
| **Produção** `https://app.goldeouro.lol/assets/index-brxfDf0E.js` | Download e busca por `chutes/recentes` | **NÃO** — bundle **ainda antigo** em relação à cirurgia. |

---

## 5. Teste real do jogador

| Teste | Estado |
|-------|--------|
| Login + dashboard “Apostas Recentes” com chutes | **Não executado** (produção sem bundle novo). |
| Saldo 1 → miss → `novoSaldo: 0` + UI + aviso | **Não executado** (idem). |

---

## 6. Problemas encontrados

1. **`main` protegida** — impede push direto; exige **PR** e CI verde.  
2. **Configuração Vercel (Root Directory)** — impede `vercel deploy` local até alinhar dashboard ou usar fluxo só via Actions.  
3. **Stash local** — alterações WIP do player foram guardadas em `git stash` (`wip player migration`) antes de testar merge em `main`; recuperar com `git stash pop` na branch desejada se necessário.

---

## 7. Classificação final

**REPROVADO** — critério do prompt: produção do player **não** foi atualizada; **não há** prova de runtime com bundle novo nem teste E2E.

---

## 8. Conclusão

O **backend Fly** pode estar alinhado com a cirurgia; o **player em `app.goldeouro.lol`** **não está**, até que:

1. a **`main` remota** incorpore os commits da cirurgia (**via PR**), **e**  
2. o workflow **frontend-deploy** conclua o deploy de produção, **ou**  
3. o **Root Directory** no Vercel seja corrigido e um deploy CLI/manual bem-sucedido seja feito.

**Evidência mínima para aprovar depois:** o JS servido em produção contém `chutes/recentes` (ou hash de ficheiro diferente do `index-brxfDf0E.js` atual) **e** teste manual autenticado do fluxo saldo/miss/dashboard.
