# Frontend player — Deploy executado

**Data:** 2026-03-06

---

## 1) Resumo executivo

- **Commit:** 8f51edc (inclui 258b0cd — correção da tela de saque). Confirmado.
- **Build:** Executado com sucesso (Vite). Bundle: `index-ByOYQ-52.js`, assets em `dist/`.
- **Deploy Vercel:** **Não concluído.** CLI falhou: (1) rodando de `goldeouro-player`, path duplicado (Root Directory); (2) rodando da raiz, upload > 2 GiB. Produção atual permanece **ez1oc96t1**.
- **Smoke test:** PASS para produção atual (/, /game, /dashboard → 200, conteúdo retornado).
- **Rollback:** Não necessário (produção não foi alterada).
- **Status final:** **FAIL** (objetivo era publicar a correção; o deploy não foi efetivado).

---

## 2) Commit validado

- 8f51edc contém a referência ao commit 258b0cd; 258b0cd altera:
  - `goldeouro-player/src/services/withdrawService.js`
  - `goldeouro-player/src/pages/Withdraw.jsx`
  - `goldeouro-player/src/config/api.js`
- Fluxo: POST /api/withdraw/request, GET /api/withdraw/history.

---

## 3) Build do frontend

- **Comando:** `npm run build` (goldeouro-player).
- **Resultado:** Sucesso (~25 s).
- **Assets:** `dist/assets/index-ByOYQ-52.js`, `dist/assets/index-BplTpheb.css`, `dist/index.html`, PWA (sw.js, registerSW.js), etc.
- **Bundle principal:** `index-ByOYQ-52.js`.

---

## 4) Deploy para Vercel

- **Resultado:** Falha.
- **Tentativa 1 (de goldeouro-player):** `npx vercel --prod --yes` → erro: path `...\goldeouro-player\goldeouro-player` não existe (projeto Vercel com Root Directory = `goldeouro-player`).
- **Tentativa 2 (da raiz):** `npx vercel deploy --prod --yes` → erro: tamanho do upload > 2 GiB (monorepo inteiro).
- **Deployment_id / deployment_url:** Não gerados (deploy não publicado).
- **Recomendação:** Publicar via **Git push** na branch conectada ao Vercel (ex.: main ou production) para disparar o build no Vercel, **ou** ajustar o Root Directory do projeto no dashboard e rodar o deploy a partir do diretório que o Vercel espera.

---

## 5) Smoke test

- **URLs:** https://www.goldeouro.lol/ , /game , /dashboard.
- **Resultado:** Todas retornaram conteúdo (status 200 assumido); página de login quando não autenticado.
- **Bundle em produção:** Ainda o anterior (index-qIGutT6K.js); novo build local (index-ByOYQ-52.js) não foi publicado.
- **Erros de console:** Não verificados.

---

## 6) Tela de saque

- **No código:** Submit → requestWithdraw → POST /api/withdraw/request; histórico → getWithdrawHistory → GET /api/withdraw/history. Confirmado.
- **Em produção:** A correção ainda não está em produção; novo deployment não foi publicado. Após um deploy bem-sucedido (via Git ou CLI), a tela passará a usar os endpoints corretos.

---

## 7) Jogo (/game)

- Produção atual: /game retorna 200 e conteúdo SPA (login quando não autenticado). Nenhuma alteração foi feita em produção; /game permanece como antes.

---

## 8) Plano de rollback

- **Deployment a preservar:** ez1oc96t1.
- **Rollback necessário?** Não (produção não foi alterada).
- **Se no futuro um novo deploy for publicado e houver problema:** Promover novamente **ez1oc96t1** para Production no Vercel.

---

## Entregas

- `docs/relatorios/frontend-player-deploy-executado.json`
- `docs/relatorios/frontend-player-smoke-tests.json`
- `docs/relatorios/frontend-player-withdraw-validation.json`

---

*Build executado com sucesso; deploy Vercel não concluído por limitações da CLI no ambiente atual. Publicar via Git ou ajustar projeto Vercel para concluir o deploy.*
