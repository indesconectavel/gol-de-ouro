# Frontend Player — Deploy Final Demo

**Data:** 2026-03-06

---

## 1) Resumo executivo

- **Objetivo:** Publicar em produção a correção da tela de saque e a simplificação da tela de depósito para a demo, sem afetar jogo, login, depósito PIX principal, backend ou /game.
- **Commits a publicar:** 8f51edc04fa293ee06c25a21b499ca8e29b04ed3, 8c020af4d798e460af8d94d8e1b58edfe665a6e7.
- **Gate do código:** PASS — arquivos e contratos confirmados (withdrawService, Withdraw.jsx, api.js, Pagamentos.jsx; POST/GET withdraw; sem "Verificar Status" nem GET pix/status).
- **Build:** PASS — build do player concluído (Vite), bundle e assets em `dist/`.
- **Deploy Vercel:** **FAIL** — CLI falhou por configuração do projeto (Root Directory = goldeouro-player gera path duplicado ao deployar a partir da pasta player). Nenhum deployment_id/url novo gerado.
- **Smoke test:** PASS — produção atual (/, /game, /dashboard) retorna HTTP 200 e conteúdo carregado.
- **Saque/Depósito validados:** No código e no build local — sim; em produção — não (deploy não foi efetivado).
- **Rollback:** Não necessário (produção não foi alterada).
- **Resultado final:** **FAIL** — objetivo de publicar as duas correções não foi atingido; para publicar, é necessário disparar o deploy via **Git push** na branch conectada ao Vercel.

---

## 2) Commits publicados

- **8f51edc** — docs: checklist withdraw fix - preencher SHA 258b0cd  
- **8c020af** — fix(deposito): simplificar tela Pagamentos para demo V1 - remove Verificar Status e leitura saldo não exibida  

O estado do repositório (HEAD atual) contém esses commits e o código da correção de saque (258b0cd / withdrawService, Withdraw.jsx, api.js).

---

## 3) Build

- **Comando:** `npm run build` em `goldeouro-player`.
- **Resultado:** Sucesso (~10 s).
- **Saída:** `dist/index.html`, `dist/assets/index-CIQ16Xuf.js`, `dist/assets/index-BJY9w-Z5.css`, PWA (sw.js, registerSW.js), manifest.

---

## 4) Deployment publicado

- **Deployment_id:** — (não gerado)  
- **Deployment_url:** — (não gerado)  
- **Estratégia usada:** `vercel deploy --prod` a partir de `goldeouro-player`; em seguida tentativa a partir da raiz com `./goldeouro-player`.  
- **Erro:** O projeto Vercel tem Root Directory = `goldeouro-player`. Ao rodar o CLI de dentro de `goldeouro-player`, o path resolvido fica `...\goldeouro-player\goldeouro-player`, que não existe.  
- **Recomendação:** Fazer push dos commits para a branch conectada ao Vercel (ex.: main) para disparar o build no Vercel a partir do repositório (Root Directory aplicado corretamente no ambiente da Vercel).

---

## 5) Smoke test

- **URLs:** https://www.goldeouro.lol/ , /game , /dashboard  
- **Status:** Todas retornaram conteúdo (página de login quando não autenticado).  
- **Resultado:** PASS. Produção atual estável; sem regressão crítica observada.

---

## 6) Saque validado

- **No código/build local:** Withdraw usa POST /api/withdraw/request e GET /api/withdraw/history (withdrawService.requestWithdraw e getWithdrawHistory). Confirmado.  
- **Em produção:** A correção ainda não está em produção; novo deploy não foi publicado.

---

## 7) Depósito validado

- **No código/build local:** Criação de PIX, QR/copia e cola e histórico presentes; botão "Verificar Status" removido; não há chamada a GET /api/payments/pix/status. Confirmado.  
- **Em produção:** A simplificação ainda não está em produção; novo deploy não foi publicado.

---

## 8) Houve rollback?

**Não.** Nenhuma nova versão foi publicada; produção permanece em **ez1oc96t1**. Em caso de um futuro deploy com problema, promover novamente **ez1oc96t1** para Production no Vercel.

---

## 9) PASS/FAIL

**FAIL** — O deploy seguro não foi concluído. Gate e build passaram; o passo de publicação na Vercel falhou por limitação do ambiente CLI com o Root Directory configurado no projeto.

---

## 10) Frontend pronto para demo?

**Não** — As alterações estão no repositório e no build local, mas **não estão publicadas** em www.goldeouro.lol. Para deixar o frontend pronto para demo, é necessário publicar via Git (push na branch conectada ao Vercel) ou ajustar o deploy conforme a recomendação acima.

---

## Entregas

| Arquivo | Descrição |
|--------|-----------|
| `frontend-player-deploy-final-demo-gate.json` | Gate do código |
| `frontend-player-deploy-final-demo-result.json` | Resultado do deploy (FAIL) |
| `frontend-player-deploy-final-demo-smoke.json` | Smoke test produção atual |
| `frontend-player-deploy-final-demo-withdraw.json` | Verificação tela saque (código) |
| `frontend-player-deploy-final-demo-deposit.json` | Verificação tela depósito (código) |
| `frontend-player-deploy-final-demo-rollback.json` | Plano/execução de rollback |

---

*Relatório gerado em 2026-03-06. Deploy via Git push recomendado para publicar as correções.*
