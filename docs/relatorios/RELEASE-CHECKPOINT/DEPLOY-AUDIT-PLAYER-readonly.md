# Auditoria READ-ONLY — Deploy do frontend (goldeouro-player)

**Data:** 2026-02-06  
**Modo:** READ-ONLY absoluto (nenhuma alteração, commit, tag, push ou deploy).  
**Objetivo:** Identificar plataforma, branch/commit em produção, trigger de deploy, domínio e método seguro de promover o branch atual para produção, incluindo plano de rollback.

---

## 1. Plataforma que hospeda o player

| Item | Conclusão |
|------|-----------|
| **Plataforma** | **Vercel** |
| **Projeto Vercel** | `goldeouro-player` (ID usado nos workflows e docs) |

### Evidências (arquivos/config)

- **`goldeouro-player/vercel.json`** — Configuração explícita: `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`, rewrites SPA (`/(.*)` → `/index.html`), headers (CSP, cache).
- **`.github/workflows/frontend-deploy.yml`** — Nome: "🎨 Frontend Deploy (Vercel)"; usa `amondnet/vercel-action@v25` com `vercel-project-id: goldeouro-player`, `vercel-args: '--prod --yes'` para produção.
- **`.github/workflows/main-pipeline.yml`** — Deploy do frontend em `./goldeouro-player` com `npx vercel --prod --yes` e secrets Vercel.
- **`.github/workflows/deploy-on-demand.yml`** — Job "Player (Vercel)" com `vercel-action`, `working-directory: ./goldeouro-player`, `vercel-args: "--prod"`; usa secret `VERCEL_PROJECT_ID_PLAYER`.
- **`.github/workflows/rollback.yml`** — Rollback frontend: `npx vercel ls`, `npx vercel promote` para deployment anterior; referência ao Dashboard: `https://vercel.com/goldeouro-admins-projects/goldeouro-player/deployments`.
- **`goldeouro-player/package.json`** — Script `deploy:safe`: `npm run audit:pre-deploy && npm run build && npx vercel --prod`.
- **Docs:** `docs/relatorios/RELATORIO-FINAL-COMPLETUDE-MCP-READ-ONLY-2026-02-05.md` cita "Frontend: goldeouro-player (deploy Vercel)"; `docs/vercel/` e `docs/auditorias/AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md` confirmam domínio e projeto.
- **Ausências:** Não há `netlify.toml`, `wrangler.toml` (Cloudflare Pages), `firebase.json`, `cloudbuild.yaml` para o player. O `fly.toml` na raiz é do **backend** (Fly.io). O `render.yaml` na raiz referencia URLs do player em Vercel, não deploy do player no Render.

---

## 2. Branch e commit buildados em produção

| Item | Valor |
|------|--------|
| **Branch de produção** | **`main`** |
| **Último commit em `main` (local/auditoria)** | `0a2a5a1` — "Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities" |
| **Branch atual (auditoria)** | `feat/payments-ui-pix-presets-top-copy` |

### Evidência

- **frontend-deploy.yml:** `on.push.branches: [ main, dev ]`; job `deploy-production` só roda quando `github.ref == 'refs/heads/main'`; job `deploy-development` quando `refs/heads/dev`.
- **main-pipeline.yml:** `on.push.branches: [ main ]` — push em `main` dispara backend (Fly.io) + frontend (Vercel) a partir do mesmo commit em `main`.
- **Conclusão:** O que está em **produção** no player (goldeouro.lol) foi buildado a partir do **branch `main`** no momento do último deploy. O commit exato em produção só pode ser confirmado no Vercel Dashboard (Deployments → Production) ou por evidência de bundle (ex.: hash do JS em prod).
- **Evidência de bundle em produção (auditoria anterior):** Relatório `CHANGE-2-verificacao-producao-readonly.md`: em produção foi servido `https://www.goldeouro.lol/assets/index-qIGutT6K.js`; o build local em `goldeouro-player/dist` tinha hash diferente (`index-B2FR4y37.js` em 05/02/2026), confirmando que produção foi buildada a partir de outro commit/estado que **não** é o do branch atual nem o do working tree com CHANGE #2/#3.

---

## 3. Como o deploy é disparado

| Gatilho | Workflow | O que acontece |
|---------|----------|-----------------|
| **Push em `main`** | `main-pipeline.yml` | Deploy backend (Fly.io) + deploy frontend (Vercel) a partir de `./goldeouro-player` com `npx vercel --prod --yes`. |
| **Push em `main` ou `dev`** (só paths `goldeouro-player/**` ou o próprio workflow) | `frontend-deploy.yml` | Testes + build; se branch é `main` → deploy produção Vercel; se branch é `dev` → deploy preview. |
| **Push em `main`** (qualquer path) | Pipeline principal | Pode acionar `rollback.yml` em caso de falha do workflow "🚀 Pipeline Principal - Gol de Ouro" (rollback automático backend + frontend). |
| **Manual (workflow_dispatch)** | `deploy-on-demand.yml` | Deploy backend Fly.io + depois player Vercel (production). |
| **Manual (workflow_dispatch)** | `main-pipeline.yml` | Permite rodar o pipeline principal manualmente. |

- **Auto-deploy por branch:** Sim — push em `main` dispara deploy de **produção** do player (via main-pipeline e/ou frontend-deploy). Push em `dev` dispara apenas **preview** no Vercel.
- **Branch atual `feat/payments-ui-pix-presets-top-copy`:** **Não** tem auto-deploy para produção. Esse branch não está em `on.push.branches` para produção; o deploy de produção depende de estar em `main` (ou de deploy manual a partir de outro branch, se configurado no Vercel).

---

## 4. Onde está configurado o domínio (goldeouro.lol)

- **Domínio em uso:** `https://goldeouro.lol` e `https://www.goldeouro.lol` (evidência nos relatórios e no workflow que testa `https://goldeouro.lol` após deploy).
- **Onde está configurado:** No **Vercel** (Dashboard do projeto `goldeouro-player`). A configuração de domínio (CNAME para `cname.vercel-dns.com`, alias `goldeouro.lol` / `www.goldeouro.lol`) não está versionada no repositório; está no painel Vercel (Settings → Domains).
- **Evidência em docs:** `docs/auditorias/AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md` descreve DNS (cname.vercel-dns.com) e uso de `vercel alias` para vincular deploy ao domínio; `docs/vercel/` e referências em `server-fly.js` (CORS) e `middlewares/security-performance.js` listam `https://goldeouro.lol` e `https://www.goldeouro.lol`.
- **Conclusão:** O domínio goldeouro.lol (e www) está configurado no projeto Vercel `goldeouro-player`; alterações de domínio são feitas no Vercel Dashboard, não em arquivos do repo.

---

## 5. Método mais seguro de promover o branch atual para produção (sem executar)

- **Branch atual:** `feat/payments-ui-pix-presets-top-copy`.
- **Objetivo:** Levar as alterações (incl. CHANGE #2, #3, #4 quando aplicável) para o que os usuários veem em https://www.goldeouro.lol.

**Recomendação (somente leitura — não executar):**

1. **Commitar** todas as alterações desejadas no branch atual (ex.: `goldeouro-player/src/pages/GameShoot.jsx`, `goldeouro-player/src/services/gameService.js`, e demais arquivos do CHANGE #2/#3/#4 e da feature de pagamentos).
2. **Abrir PR** do branch `feat/payments-ui-pix-presets-top-copy` (ou branch derivado) para `main`.
3. **Revisar e fazer merge** em `main` (após aprovação e CI verde).
4. **Deploy automático:** O push em `main` dispara `frontend-deploy.yml` e/ou `main-pipeline.yml`, que fazem build e deploy no Vercel com `--prod`. Assim, produção fica sempre alinhada a um commit em `main` e há histórico claro.
5. **Alternativa (deploy manual):** Usar "Deploy On Demand" (workflow_dispatch) **após** merge em `main`, ou configurar no Vercel um deploy de produção a partir de outro branch (menos rastreável; não recomendado como padrão).

**Risco menor:** Promover via **merge para `main`** e deixar o CI fazer o deploy evita deploy direto de branch de feature e mantém produção = `main`.

---

## 6. Plano de rollback (por commit/tag)

### Rollback no Vercel (frontend)

- **Automático:** O workflow `rollback.yml` é acionado quando o "Pipeline Principal" falha; ele tenta promover o **penúltimo deployment** de produção para produção (`vercel promote <uid>`). Não é por commit Git e sim por deployment ID.
- **Manual (recomendado para auditoria):**
  1. **Pelo Dashboard:** Acessar https://vercel.com/goldeouro-admins-projects/goldeouro-player/deployments, localizar um deployment estável anterior e usar "Promote to Production".
  2. **Por Git (reverter o que está em produção):** Se produção = commit X em `main`, reverter em `main` e dar push para gerar novo deploy a partir do commit anterior:
     - Exemplo (só documentar; não executar):
       ```powershell
       git checkout main
       git pull origin main
       git revert <commit-problemático> --no-edit
       git push origin main
       ```
     - O CI fará o deploy; o resultado será o estado de `main` antes do commit revertido.
  3. **Por tag:** Se houver tag (ex.: `v1.2.1`, `PRE_V1_STABLE_2026-02-05-2224`) no commit desejado, fazer checkout desse commit em um branch, merge em `main` (ou abrir PR desse branch para `main`) e deixar o CI fazer o deploy:
     - Exemplo (só documentar):
       ```powershell
       git checkout -b rollback/to-<tag> <tag>
       # Abrir PR rollback/to-<tag> -> main; após merge, deploy automático.
       ```

### Comandos Git sugeridos (somente referência)

- Ver último commit em produção (se main = produção): `git log -1 --oneline main`
- Listar tags: `git tag -l`
- Ver commit de uma tag: `git log -1 --oneline <tag>`
- Criar branch de rollback a partir de tag: `git checkout -b rollback/to-<tag> <tag>`

---

## 7. Checklist final para publicar CHANGE #2 / #3 / #4 no navegador

- [ ] Alterações de CHANGE #2, #3 e #4 commitadas no branch (ex.: `feat/payments-ui-pix-presets-top-copy`).
- [ ] Build local validado: `cd goldeouro-player; npm run build` (verificar que `dist/` contém os assets esperados e que o bundle reflete as mudanças).
- [ ] PR aberto para `main` e revisado.
- [ ] Merge em `main` (após aprovação).
- [ ] Aguardar conclusão do workflow de deploy (frontend-deploy ou main-pipeline) para o commit em `main`.
- [ ] Verificar em produção: abrir https://www.goldeouro.lol e validar mensagem de saldo insuficiente (CHANGE #2), highlight no botão Recarregar (CHANGE #3) e demais comportamentos (CHANGE #4 se aplicável).
- [ ] Opcional: criar tag de release no commit em `main` após validação (ex.: `v1.2.2`) para referência de rollback.

---

## 8. Resumo em bullets

- **Plataforma:** Vercel; projeto `goldeouro-player`. Evidência: `goldeouro-player/vercel.json`, `.github/workflows/frontend-deploy.yml`, `main-pipeline.yml`, `deploy-on-demand.yml`, `rollback.yml`, `package.json` (deploy:safe).
- **Branch buildado em produção:** `main`. Commit em produção = último deploy a partir de `main` (confirmável no Vercel ou pelo hash do bundle; auditoria anterior: bundle `index-qIGutT6K.js`).
- **Deploy disparado por:** push em `main` (auto), ou workflow_dispatch (main-pipeline / deploy-on-demand). Branch `feat/payments-ui-pix-presets-top-copy` **não** tem auto-deploy para produção.
- **Domínio goldeouro.lol:** Configurado no Vercel (projeto goldeouro-player); DNS/alias no Dashboard, não versionado no repo.
- **Promover com menor risco:** Merge do branch de feature em `main` e deixar o CI fazer o deploy (evita deploy direto de branch de feature).
- **Rollback:** Pelo Vercel Dashboard (Promote to Production de um deployment anterior) ou por Git (revert/merge de tag em `main` e novo deploy via CI).

---

**Caminho do relatório:** `docs/relatorios/RELEASE-CHECKPOINT/DEPLOY-AUDIT-PLAYER-readonly.md`

*Auditoria realizada em modo READ-ONLY. Nenhum arquivo de código ou config foi alterado; nenhum commit, tag, push ou deploy foi executado.*
