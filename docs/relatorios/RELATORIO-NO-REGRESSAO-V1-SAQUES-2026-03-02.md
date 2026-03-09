# Relatório de não-regressão V1 — Patch Saques PIX (worker + reconciler + patch V1)

**Data:** 2026-03-02  
**Tipo:** Auditoria READ-ONLY (sem edição, deploy, restart ou alteração de secrets/env).  
**Objetivo:** Provar com evidência se o deploy do patch de Saques PIX quebra /game ou Depósito PIX e listar exatamente o que muda em produção.

---

## 1) BASELINE PRODUÇÃO (Fly)

### Comandos executados

```powershell
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
flyctl releases -a goldeouro-backend-v2
flyctl logs -a goldeouro-backend-v2 --no-tail
```

### Resultados

| Item | Valor |
|------|--------|
| **App** | goldeouro-backend-v2 |
| **Hostname** | goldeouro-backend-v2.fly.dev |
| **Imagem atual** | goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D |
| **Versão (release)** | v305 (complete, Feb 25 2026) |
| **Processos** | **app** (2 máquinas, 1/1 checks passing), **payout_worker** (1 máquina, started) |
| **Crash-loop?** | Não. Logs mostram apenas ciclos do worker (Início/Fim do ciclo, Nenhum saque pendente). |

### Releases (últimos)

```
v305    complete   Feb 25 2026 19:50
v304    failed     Feb 6 2026 06:42
v303    failed     Feb 6 2026 06:42
v302    complete   Feb 3 2026 22:42
...
```

**Conclusão:** Produção estável (v305), sem crash-loop; imagem e processos identificados.

---

## 2) PROVA DO QUE /GAME USA (backend)

### Rotas localizadas (server-fly.js)

```text
# Grep: app.(get|post)\(\s*['\"]\/api
server-fly.js  1023:  app.get('/api/user/profile', ...)
server-fly.js  1073:  app.put('/api/user/profile', ...)
server-fly.js  1168:  app.post('/api/games/shoot', ...)
server-fly.js  3139:  app.get('/api/fila/entrar', ...)
```

Todas as rotas críticas para /game estão **no mesmo arquivo** `server-fly.js` (não em `routes/*`).

### Rotas críticas para /game

| Rota | Uso no player | Arquivo |
|------|----------------|---------|
| `GET /api/user/profile` | Perfil/saldo | server-fly.js |
| `PUT /api/user/profile` | Atualizar perfil | server-fly.js |
| `POST /api/games/shoot` | Chute no jogo | server-fly.js |
| `GET /api/fila/entrar` | Compatibilidade fila | server-fly.js |

**Conclusão:** Rotas críticas para /game: `/api/user/profile`, `/api/games/shoot`, `/api/fila/entrar`. Todas em `server-fly.js`. Nenhuma em arquivos separados de domínio payout (processPendingWithdrawals, reconcileProcessingWithdrawals, payout-worker).

---

## 3) DEPÓSITO PIX — ROTAS, TABELAS E IMPACTO DO PATCH

### Endpoints e tabelas de depósito PIX

| Endpoint | Função | Tabela principal |
|---------|--------|-------------------|
| `POST /api/payments/pix/criar` | Criar PIX depósito | pagamentos_pix |
| `GET /api/payments/pix/usuario` | Listar PIX do usuário | pagamentos_pix |
| `POST /api/payments/webhook` | Webhook MP (depósito) | pagamentos_pix |

Arquivo: **server-fly.js** (linhas ~1729, ~1894, ~1992). Função de reconciliação de depósitos: `reconcilePendingPayments` (linha ~2344), que usa `.eq('status', 'pending')` (linha 2360).

### Arquivos alterados (patch vs main) que mencionam payments/pix/deposit

- **git diff --name-only (uncommitted):** `controllers/paymentController.js` (não é usado pelo server-fly.js em produção; rotas de depósito estão inline em server-fly.js).
- **git diff origin/main -- server-fly.js:** **Sim, server-fly.js é alterado** e inclui mudanças no fluxo de **depósito**:
  - Em `POST /api/payments/pix/criar`: `status: 'pending'` → `status: PENDING`.
  - Em `app.post('/api/payments/webhook')` não há mudança de lógica de depósito; mudanças são no webhook de **saque** (webhooks/mercadopago).

### Risco identificado para Depósito PIX

- **config/env.js / withdrawalStatus:** `PENDING` (em `withdrawalStatus.js`) = `'pendente'` (domínio de **saques**).
- **pagamentos_pix:** Fluxo de depósito historicamente usa status `'pending'` (string).
- **reconcilePendingPayments** (depósito): usa `.eq('status', 'pending')` (linha 2360).

Se o patch for deployado como está, novos registros em **pagamentos_pix** passam a ser criados com `status: PENDING` = `'pendente'`, e **reconcilePendingPayments** continua filtrando por `'pending'`. Logo, **novos depósitos podem não ser encontrados** pelo reconciler de depósito.

**Conclusão objetiva:** **Depósito PIX É tocado.** Arquivo: `server-fly.js`. Alteração: uso de `PENDING` (='pendente') no insert de `pagamentos_pix` em `/api/payments/pix/criar`. Risco: regressão na reconciliação de depósitos (novos PIX com status 'pendente' não batem com `.eq('status', 'pending')`).

---

## 4) ESCOPO EXATO DO PATCH DE SAQUE (o que muda)

### Arquivos do patch

| Arquivo | Tipo de mudança |
|---------|------------------|
| `src/domain/payout/processPendingWithdrawals.js` | Modificado (updateSaqueStatus, rollback, withdrawalStatus) |
| `src/domain/payout/reconcileProcessingWithdrawals.js` | **Novo** (untracked) |
| `src/workers/payout-worker.js` | Modificado (reconciler, runReconcileCycle) |
| `server-fly.js` | Modificado (withdrawalStatus, authAdminToken, CORS preview, normalização de status em withdraw e **em pagamentos_pix**; GET /api/admin/saques-presos) |
| `services/pix-mercado-pago.js` | Presente em HEAD~50..HEAD; não analisado linha a linha |
| `src/domain/payout/withdrawalStatus.js` | Não alterado no diff; usado pelo patch |

### git diff --name-only (branch atual vs origin/main) — arquivos relevantes ao patch

- server-fly.js  
- src/domain/payout/processPendingWithdrawals.js  
- src/workers/payout-worker.js  
- reconcileProcessingWithdrawals.js (untracked, novo)

### Trechos críticos do diff (máx. ~30 linhas por arquivo)

**processPendingWithdrawals.js:** introdução de `updateSaqueStatus`, uso de `withdrawalStatus` (PENDING, PROCESSING, COMPLETED, REJECTED, normalizeWithdrawStatus), e rollback passando a usar `updateSaqueStatus` para marcar REJECTED com `onlyWhenStatus: PROCESSING`.

**payout-worker.js:** require de `reconcileProcessingWithdrawals`; variável `reconcileIntervalMs`; função `runReconcileCycle()` que chama `reconcileProcessingWithdrawals(...)`; `runReconcileCycle()` + `setInterval(runReconcileCycle, reconcileIntervalMs)`.

**server-fly.js:** require de `withdrawalStatus` e `authAdminToken`; CORS com regex para preview Vercel; em withdraw/request e withdraw/history uso de `PENDING`/`normalizeWithdrawStatus`; em **payments/pix/criar** e resposta: `status: 'pending'` → `status: PENDING`; em webhook Mercado Pago (saque): uso de COMPLETED/REJECTED/normalizeWithdrawStatus e atualização de status via lógica alinhada ao domínio; novo endpoint `GET /api/admin/saques-presos` com `authAdminToken`.

---

## 5) ENV / ENVALID (risco de boot)

### Onde config/env.js é carregado no startup

- **server-fly.js** não faz `require('./config/env')` direto.
- **server-fly.js** usa `require('./config/required-env')` (linhas 53–55) e `assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], { onlyInProduction: ['MERCADOPAGO_DEPOSIT_ACCESS_TOKEN'] })`.
- **middlewares/authMiddleware.js** (linha 2): `const env = require('../config/env');`
- **server-fly.js** (linha 27): `const { authAdminToken } = require('./middlewares/authMiddleware');`

Cadeia: **server-fly.js** → **authMiddleware** → **config/env.js** → `require('envalid')`. Se `envalid` faltar ou se `config/env.js` falhar (env obrigatória ausente), o boot falha ao carregar o middleware.

### config/env.js — variáveis e regras

- **envalid** em **package.json** (dependencies): `"envalid": "^8.1.1"`.
- **config/env.js** usa `cleanEnv(process.env, { ... })` com:
  - DATABASE_URL (url, sem default)
  - PORT (num, default 3000)
  - JWT_SECRET (str, sem default)
  - ADMIN_TOKEN (str, sem default)
  - CORS_ORIGINS (str, com default)
  - MERCADOPAGO_ACCESS_TOKEN (str, sem default)
  - MERCADOPAGO_WEBHOOK_SECRET (str, sem default)
  - NODE_ENV (str, default 'development')
- Validações adicionais: JWT_SECRET.length >= 32, ADMIN_TOKEN.length >= 16.

**Conclusão:** O boot falha se faltar (sem default em env): DATABASE_URL, JWT_SECRET, ADMIN_TOKEN, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET. Checklist de secrets para produção: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, MERCADOPAGO_DEPOSIT_ACCESS_TOKEN (onlyInProduction em required-env), e demais usados por config/env.js.

---

## 6) PROVA DE NÃO-REGRESSÃO — TABELA FINAL

| Área | Arquivos envolvidos | Algum arquivo tocado pelo patch? | Risco residual | Motivo |
|------|---------------------|-----------------------------------|----------------|--------|
| **/game** | server-fly.js (profile, games/shoot, fila/entrar) | Sim (server-fly.js) | **Baixo** | Patch não altera handlers de /api/user/profile, /api/games/shoot nem /api/fila/entrar; apenas adiciona requires (withdrawalStatus, authMiddleware) e CORS. Lógica do jogo intacta. |
| **Depósito PIX** | server-fly.js (pix/criar, pix/usuario, webhook, reconcilePendingPayments) | **Sim** (server-fly.js) | **Alto** | status em pagamentos_pix alterado de 'pending' para PENDING ('pendente'); reconcilePendingPayments continua com .eq('status', 'pending'). Novos depósitos podem não ser reconciliados. |
| **Saques PIX** | server-fly.js (withdraw/request, withdraw/history, webhooks/mercadopago), processPendingWithdrawals.js, reconcileProcessingWithdrawals.js, payout-worker.js, withdrawalStatus.js, pix-mercado-pago.js | Sim (óbvio) | **Médio** | Escopo intencional do patch; risco residual por nova lógica (reconciler, updateSaqueStatus) e dependência de env/worker. |

---

## 7) VEREDITO GO/NO-GO

### Critérios para GO (resumo)

- Depósito PIX não tocado **ou** tocado com justificativa e risco explícito.  
- Rotas críticas do /game não tocadas **ou** justificativa.  
- Patch de saque isolado em worker/domínio payout.  
- envalid em dependencies e checklist de env documentado.

### Avaliação

- **/game:** Rotas críticas **não** alteradas em lógica; apenas requires e CORS. **OK para GO.**
- **Depósito PIX:** **É tocado.** Alteração de status em pagamentos_pix de 'pending' para PENDING ('pendente') sem ajuste em reconcilePendingPayments. **Risco de regressão direto.** Não atende ao critério “Depósito PIX não tocado”.
- **Patch de saque:** Isolado em domínio payout + worker + server-fly (apenas partes de saque e admin saques-presos). **OK.**
- **envalid:** Em dependencies; checklist de env documentado acima. **OK.**

### Veredito: **NO-GO**

**Motivo:** O patch altera o fluxo de **Depósito PIX** em `server-fly.js` (status inicial em `/api/payments/pix/criar` de `'pending'` para `PENDING` = `'pendente'`), enquanto `reconcilePendingPayments` continua usando `.eq('status', 'pending')`. Isso pode impedir que novos depósitos sejam reconciliados. Até essa inconsistência ser corrigida (por exemplo: manter `'pending'` no fluxo de pagamentos_pix ou passar a tratar também `'pendente'` em reconcilePendingPayments), o deploy não é considerado seguro para produção.

### Plano de deploy seguro sugerido (apenas texto)

1. **Corrigir risco de depósito:** Garantir que o fluxo de depósito (pagamentos_pix) continue usando status `'pending'` no insert e que reconcilePendingPayments siga encontrando esses registros; ou então padronizar para um único valor e ajustar tanto o insert quanto o reconciler.
2. **Build e imagem:** Incluir `envalid` e todos os arquivos do patch (incluindo `reconcileProcessingWithdrawals.js`) na imagem e garantir que o lockfile/package.json de produção contenha envalid.
3. **Canary / rollout gradual no Fly:** Fazer deploy para uma máquina ou grupo canary; validar health, um fluxo de depósito PIX (criar + webhook ou reconciler) e um fluxo de /game (profile + shoot) após o canary.
4. **Após validação do canary:** Liberar rollout completo para as demais máquinas.
5. **Secrets:** Conferir no Fly todos os itens do checklist de env (JWT_SECRET, SUPABASE_*, ADMIN_TOKEN, MERCADOPAGO_*, etc.) antes do deploy.

---

### Checklist final (GO/NO-GO)

| # | Critério | Atende? | Observação |
|---|----------|---------|------------|
| 1 | Depósito PIX não tocado | ❌ Não | server-fly.js altera status em pix/criar para PENDING ('pendente'); reconciler usa 'pending'. |
| 2 | Rotas críticas /game não tocadas | ✅ Sim | Nenhuma alteração de lógica em profile, games/shoot, fila/entrar. |
| 3 | Patch de saque isolado em worker/domínio payout | ✅ Sim | processPendingWithdrawals, reconcileProcessingWithdrawals, payout-worker; server-fly só engancha saque e admin. |
| 4 | envalid em dependencies + checklist env documentado | ✅ Sim | package.json: envalid ^8.1.1; lista de env obrigatórias na seção 5. |

**Resultado:** 3 de 4 critérios atendidos. **NO-GO** devido ao item 1.

---

*Relatório gerado em modo read-only. Nenhum arquivo foi editado; nenhum deploy, restart ou alteração de secrets/env foi realizado.*
