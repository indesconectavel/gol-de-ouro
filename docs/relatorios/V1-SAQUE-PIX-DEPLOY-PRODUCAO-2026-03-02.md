# V1 Saque PIX — Deploy em Produção (relatório formal com evidências)

**Data:** 2026-03-02  
**Modo:** Execução controlada + documentação total. Nenhuma alteração de código além do já aprovado (GO); nenhuma alteração de rotas /game nem de lógica de depósito PIX.

---

## 1) Contexto do deploy

- **Objetivo:** Colocar em produção a V1 estável de Saque PIX (worker + reconciler + patch V1), com validação do sistema financeiro (Saque + Depósito + /game).
- **App Fly:** goldeouro-backend-v2.
- **Comando executado:** `flyctl deploy --remote-only --no-cache -a goldeouro-backend-v2`.
- **Regra:** Se qualquer etapa falhasse, interromper e declarar NO-GO.

---

## 1.1) FASE 1 — Pré-deploy (resumo)

- **Sintaxe:** `node -c` executado para server-fly.js, payout-worker.js, processPendingWithdrawals.js, reconcileProcessingWithdrawals.js, authMiddleware.js — todos sem erro (exit 0).
- **Checklist:** package.json com envalid; server-fly.js com status 'pending' no insert/resposta de pagamentos_pix e .in(['pending','pendente']) em reconcilePendingPayments; updateSaqueStatus e reconcileProcessingWithdrawals presentes e integrados no worker; rotas /game nas linhas 1023, 1168, 3139 sem alteração. **Todos os itens GO.**

---

## 2) Evidência do build

- **Validação fly.toml:** `Configuration is valid`.
- **Builder:** Depot (remote).
- **Dockerfile:** 5 estágios (FROM node:20-alpine, WORKDIR /app, COPY package*.json, RUN npm install --only=production, COPY . .).
- **npm install:** concluído (154 packages, 3s). Avisos de vulnerabilidades e de `npm fund` presentes; build não falhou por isso.
- **Imagem gerada:**  
  `registry.fly.io/goldeouro-backend-v2:deployment-01KJT2D2PZX22M3C5BC0G0W5M7`  
  **Tamanho:** 61 MB.  
  **Manifest/config:** sha256:42a7bc1c41e09c4c5cec2a37c68da831044e7e2042a496946e8ffb0c5bcf1110 (manifest), sha256:1f4fd8c5cbc09a5e9c8433c160b0603ddcb7a2ca936009f796b980822132bc30 (config).
- **Push:** layers e manifest enviados para registry.fly.io com sucesso.
- **Tempo aproximado de build (até “Building image done”):** ~6 min (build + push).

---

## 2.1) Pós-deploy — Comandos e outputs (evidência bruta)

**flyctl status -a goldeouro-backend-v2:**  
App Name = goldeouro-backend-v2, Hostname = goldeouro-backend-v2.fly.dev, Image = goldeouro-backend-v2:deployment-01KJT2D2PZX22M3C5BC0G0W5M7.  
Machines: app 2874551a105768 v305 gru started 1 total 1 passing; app e82d445ae76178 v306 gru **stopped** 1 total 1 warning; payout_worker e82794da791108 v306 gru started.

**flyctl machines list:**  
e82794da791108 (payout_worker) started, IMAGE = deployment-01KJT2D2PZX22M3C5BC0G0W5M7.  
2874551a105768 (app) started 1/1, IMAGE = deployment-01KJB5K9MPDYQ49P82YF2P3J3D (antiga).  
e82d445ae76178 (app) **stopped** 0/1, IMAGE = deployment-01KJT2D2PZX22M3C5BC0G0W5M7.

**flyctl releases:** v306 failed (5m47s ago), v305 complete (Feb 25 2026 19:50).

---

## 3) Evidência do novo release

- **Release criado:** **v306** (status **failed**).
- **Rolling update:**  
  - Máquina **e82794da791108** (payout_worker): atualizada, “reached started state”, smoke/health OK.  
  - Máquina **e82d445ae76178** (app): atualizada para a nova imagem; **health check timeout**; aviso: “The app is not listening on the expected address 0.0.0.0:8080”.  
  - Máquina **2874551a105768** (app): **não atualizada** (rollout interrompido após falha em e82d445ae76178).
- **Saída do deploy (exit code 1):**  
  `Error: failed to update machine e82d445ae76178: Unrecoverable error: timeout reached waiting for health checks to pass for machine e82d445ae76178: failed to get VM e82d445ae76178: Get "https://api.machines.dev/...": net/http: request canceled`
- **Conclusão:** O **deploy em si (build + push + início do rollout) foi executado**, mas o **release v306 está em estado failed** porque uma máquina app (e82d445ae76178) não passou nos health checks e o comando terminou com erro.

---

## 4) Health checks

- **URL:** https://goldeouro-backend-v2.fly.dev/health  
- **Resultado (após o deploy):** HTTP 200. Corpo (exemplo):  
  `{"status":"ok","timestamp":"2026-03-03T14:49:12.277Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":209,"ultimoGolDeOuro":0}`  
- **Interpretação:** O tráfego está sendo atendido por uma máquina **app** que ainda está na **imagem anterior (v305)** — 2874551a105768 — e que continua saudável. A máquina que recebeu a nova imagem (e82d445ae76178) está **stopped** e não atende requisições; por isso o /health continua respondendo OK.

---

## 5) Validação Depósito PIX (prova que não regrediu)

- **Estado do deploy:** Release v306 falhou; a única máquina app que está em produção ativa (2874551a105768) permanece na **imagem v305**.  
- **Código de depósito no repositório (já verificado na FASE 1):**  
  - INSERT em `pagamentos_pix` com **status: 'pending'** (server-fly.js ~1837).  
  - Resposta JSON com **status: 'pending'** (~1862).  
  - `reconcilePendingPayments` com **.in('status', ['pending', 'pendente'])** (~2360).  
- **Em produção efetiva (v305):** O comportamento atual de Depósito PIX é o da imagem antiga. A **nova imagem (v306)** não está servindo tráfego; portanto **não houve mudança em produção** no fluxo de depósito.  
- **Conclusão:** Depósito PIX **não regrediu** no ambiente atual; a nova versão (com patch de status) ainda não está ativa em nenhuma máquina app.

---

## 6) Validação /game (prova que não quebrou)

- Rotas críticas (/api/user/profile, /api/games/shoot, /api/fila/entrar) **não foram alteradas** no patch (evidência da FASE 1).  
- O **/health** retorna 200 e dados consistentes (database, mercadoPago, version), indicando que o processo app que está no ar (v305) segue operando.  
- Como **nenhuma máquina app está rodando a nova imagem**, não foi possível validar /game **na V306** em produção. Em relação ao código: **/game não foi alterado**; em relação ao ambiente: o app que responde é ainda o da v305.

---

## 7) Validação Saque PIX (prova de funcionamento)

- **payout_worker (e82794da791108):** Atualizado para a **nova imagem** (deployment-01KJT2D2PZX22M3C5BC0G0W5M7) e em estado **started**.  
- **Logs do worker (evidência):**  
  - Ciclos regulares: `[PAYOUT][WORKER] Início do ciclo`, `Nenhum saque pendente`, `Resumo { payouts_sucesso: 0, payouts_falha: 0 }`, `Fim do ciclo`.  
  - Não há mensagens de erro no worker; não há log explícito de `reconcileProcessingWithdrawals` nos trechos capturados, mas o processo é o da nova imagem (com reconciler integrado).  
- **App (processo HTTP):** A nova imagem **não está rodando** em nenhuma máquina app (uma falhou e ficou stopped, a outra não foi atualizada). Portanto **não foi possível** validar em produção o fluxo completo de saque (endpoints + worker + reconciler) na V306.  
- **Conclusão:** O **worker** da V1 está em produção e executando ciclos; o **app** da V306 não está ativo, então a validação funcional completa de Saque PIX (incluindo GET /api/admin/saques-presos e fluxo de saque) na nova versão **não foi realizada**.

---

## 8) Prova no container (código presente)

- **Restrição:** Não foi executado SSH no container nesta sessão (evidência de código no container seria obtida via `fly ssh console` + `ls`/`grep`).  
- **Evidência indireta:**  
  - O **build** incluiu todo o contexto (COPY . .), portanto os arquivos do repositório (incl. `src/domain/payout/reconcileProcessingWithdrawals.js`, `processPendingWithdrawals.js` com `updateSaqueStatus`, `node_modules/envalid`) estão na imagem **deployment-01KJT2D2PZX22M3C5BC0G0W5M7**.  
  - O **payout_worker** com essa imagem sobe e roda ciclos, o que é consistente com a presença de `reconcileProcessingWithdrawals` e do restante do código de payout na imagem.  
- **Prova definitiva no container:** Pendente (execução de comandos via `fly ssh console` em uma máquina app ou worker, conforme plano de validação).

---

## 9) Diagnóstico da falha (causa raiz)

- **Logs da máquina app e82d445ae76178 (nova imagem):**  
  - Processo inicia: `node server-fly.js`.  
  - Em seguida: **crash** com:  
    `Error: ADMIN_TOKEN deve ter pelo menos 16 caracteres`  
    `at Object.<anonymous> (/app/config/env.js:60:9)`  
    `at Object.<anonymous> (/app/middlewares/authMiddleware.js:2:13)`  
  - O processo encerra com código 1; a máquina reinicia e o erro se repete até “machine has reached its max restart count of 10”, resultando em estado **stopped**.
- **Cadeia de carregamento:**  
  `server-fly.js` → `require('./middlewares/authMiddleware')` (authAdminToken) → `require('../config/env')` → `config/env.js` valida `env.ADMIN_TOKEN.length >= 16` (linha 59–61) e lança se falhar.
- **Conclusão:** Nas máquinas que receberam a **nova imagem**, o processo **app** carrega **config/env.js** (via authMiddleware). A variável de ambiente **ADMIN_TOKEN** no Fly, para o processo **app**, está **ausente ou com menos de 16 caracteres**, o que provoca o crash antes do servidor escutar em 0.0.0.0:8080. Daí o aviso “The app is not listening on the expected address” e o timeout do health check.
- **Por que a máquina antiga (v305) segue OK:** A imagem v305 pode não carregar config/env no boot (ou não validar ADMIN_TOKEN da mesma forma), ou as secrets da app já estavam corretas na época do deploy anterior; a máquina 2874551a105768 não foi atualizada e continua com a imagem antiga.

---

## 10) Riscos residuais

- **Release v306 em estado failed:** Uma máquina app está **stopped** (e82d445ae76178); outra (2874551a105768) permanece na v305. Ambiente em estado **parcial/misto**.  
- **Secrets/ENV:** O processo **app** da nova imagem exige **ADMIN_TOKEN** com pelo menos 16 caracteres (e as demais variáveis validadas por config/env.js e required-env). Se ADMIN_TOKEN não estiver definido ou for curto no Fly para o app, qualquer novo deploy ou restart que use a nova imagem reproduzirá o crash.  
- **Rollback:** O comando de deploy terminou com erro; não foi executado rollback explícito. O tráfego continua sendo atendido pela máquina ainda na v305.

---

## 11) Veredito final

**NO-GO — V1 não está estável em produção no release v306.**

**Motivo resumido:**  
O deploy (build + push + rolling update) foi executado, mas o **release v306 falhou**: a máquina app **e82d445ae76178** recebeu a nova imagem e passou a **crashar ao iniciar** com `ADMIN_TOKEN deve ter pelo menos 16 caracteres` (config/env.js via authMiddleware). O health check dessa máquina deu timeout, o comando `flyctl deploy` retornou erro e a máquina entrou em estado **stopped**. Nenhuma alteração de secrets foi feita (conforme regras). O sistema continua respondendo via máquina **2874551a105768** (imagem v305). O **payout_worker** está na nova imagem e rodando ciclos normalmente.

**O que é necessário para GO:**  
1. Garantir no Fly que o secret **ADMIN_TOKEN** (e demais variáveis exigidas por config/env.js e required-env) está definido para o processo **app** e que **ADMIN_TOKEN** tem pelo menos 16 caracteres.  
2. Reexecutar o deploy ou reiniciar a máquina e82d445ae76178 após corrigir as secrets, e confirmar que as máquinas app passam nos health checks e que Depósito, /game e Saque (incl. GET /api/admin/saques-presos) se comportam conforme esperado na nova versão.

---

**Declaração:**  
**SISTEMA FINANCEIRO V1 NÃO DECLARADO ESTÁVEL EM PRODUÇÃO** — Deploy da V1 (v306) falhou por falha de boot do processo app (ADMIN_TOKEN). Depósito e /game seguem operando na versão anterior (v305). Worker da V1 está em execução na nova imagem; app da V306 não está em produção ativa.

---

*Relatório gerado com evidências reais (outputs de flyctl, logs, health). Nenhum código foi alterado; nenhuma secret foi modificada.*
