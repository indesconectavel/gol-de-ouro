# Dossiê READ-ONLY — Módulo Financeiro (Depósito PIX + Saque PIX + Ledger + Admin)

**Data:** 2026-03-02  
**Escopo:** Backend goldeouro-backend (entrypoints, rotas, saques, depósitos, worker, reconciler, provedor, ledger, admin, normalização de status).  
**Regra:** Apenas leitura e inspeção; evidências com caminho e trechos (máx. 20–30 linhas por trecho).

---

## Respostas diretas (bullets)

- **Onde ficam as rotas admin hoje (fonte da verdade)?**  
  No **server-fly.js**: rotas admin estão **inline**. Não há `app.use('/api/admin', adminRoutes)` em server-fly.js. O arquivo `routes/adminRoutes.js` existe e define GET `/saques-presos` e outras rotas com `authAdminToken`, mas **não é montado** no servidor principal. Em runtime ativo: **POST /api/admin/bootstrap** (JWT) e **GET /api/admin/saques-presos** (x-admin-token), ambos definidos diretamente em server-fly.js (linhas ~2901 e ~2944).

- **Quais arquivos escrevem status em saques?**  
  (1) **server-fly.js**: INSERT com `status: PENDING` (linha ~1563); UPDATE para COMPLETED/PROCESSING no webhook Mercado Pago (linhas ~2244, 2264); (2) **src/domain/payout/processPendingWithdrawals.js**: `updateSaqueStatus` (UPDATE com PENDING/PROCESSING/COMPLETED/REJECTED, linhas 57–99, 88, 292–297, 324–330, etc.); rollback com REJECTED (linhas 106–112, 185); (3) **src/domain/payout/reconcileProcessingWithdrawals.js**: UPDATE REJECTED/COMPLETED via `updateSaqueStatus` (timeout, sucesso createPixWithdraw, 409 com transacao_id, valor_invalido, pix_invalido, erro_provedor).

- **Como garantimos que não fica preso em processando?**  
  (1) **Worker** marca PENDING→PROCESSING com `onlyWhenStatus: PENDING`; em sucesso marca COMPLETED; em falha faz rollback (REJECTED + saldo + ledger). (2) **Reconciler** (`reconcileProcessingWithdrawals.js`): seleciona PROCESSING com `created_at` &lt; 10 min; timeout &gt; 30 min → REJECTED `timeout_reconciliacao`; sem transacao_id re-chama `createPixWithdraw` (idempotência) ou trata 409; try/catch por saque para não derrubar o ciclo. (3) **Webhook** `/webhooks/mercadopago`: confirma approved/credited → COMPLETED; in_process → PROCESSING (atualização de estado, não “preso”).

- **Onde está a idempotência real (provedor + correlationId)?**  
  (1) **API de saque** (`/api/withdraw/request`): idempotência por `correlation_id` — se já existe saque com mesmo correlation_id, retorna o existente (server-fly.js ~1440–1471). (2) **Worker**: lock com `updateSaqueStatus(..., onlyWhenStatus: PENDING)`; um único saque por ciclo (limit 1); em falha reverte para PENDING ou marca REJECTED. (3) **Provedor** (`services/pix-mercado-pago.js`): `createPixWithdraw` envia `external_reference: \`${saqueId}_${correlationId}\`` (linha 262); não envia header X-Idempotency-Key para transfers; 409/duplicidade tratados no reconciler e no worker por resposta do MP. (4) **Webhook payout**: idempotência por ledger — verifica `ledger_financeiro` por correlation_id + referencia + tipo (payout_confirmado/falha_payout) antes de atualizar saque (server-fly.js ~2200–2218).

- **Quais variáveis env são obrigatórias e onde são consumidas?**  
  **server-fly.js / boot:** `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (assertRequiredEnv, linha 52–55); produção: `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`. **Worker (payout-worker.js):** `ENABLE_PIX_PAYOUT_WORKER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`; opcionais: `PAYOUT_WORKER_INTERVAL_MS`, `PAYOUT_RECONCILE_INTERVAL_MS`, `PAYOUT_PIX_ENABLED`. **Admin (authMiddleware → config/env.js):** `ADMIN_TOKEN`, `JWT_SECRET`, `NODE_ENV` (config/env.js usa envalid; server-fly não usa config/env para JWT, usa process.env). **Depósito PIX:** `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`; webhook: `MERCADOPAGO_WEBHOOK_SECRET` (opcional em dev). **Saque/reconciler em server-fly:** `PAYOUT_PIX_ENABLED`, `PAGAMENTO_TAXA_SAQUE`, `MP_RECONCILE_*`, `BACKEND_URL`.

- **Qual é o risco #1 remanescente para duplicidade?**  
  **Provedor (MP) não envia idempotency key no POST /v1/transfers**: o backend envia apenas `external_reference`. Se o MP não garantir idempotência por external_reference, retentativas (worker ou reconciler) podem gerar dois transfers para o mesmo saque. Mitigações atuais: lock PENDING→PROCESSING (onlyWhenStatus); reconciler só marca COMPLETED quando `payoutResult.data.id` existe ou 409 com transacao_id; webhook verifica ledger antes de creditar. **Risco secundário:** ledger_financeiro não tem unique constraint (correlation_id + tipo + referencia) no código auditado; a deduplicação é por select+maybeSingle antes do insert (processPendingWithdrawals.js e server-fly webhook).

- **O que falta para V1 estável (mínimo)?**  
  (1) Garantir que config/env (envalid) não quebre boot quando admin routes forem usadas (require já corrigido para `../config/env` no authMiddleware). (2) Documentar e validar em produção: PAYOUT_PIX_ENABLED, intervalos do worker e do reconciler, e que o worker está rodando (ENABLE_PIX_PAYOUT_WORKER=true). (3) Confirmar que o webhook de payout (`/webhooks/mercadopago`) está registrado no MP e recebendo eventos. (4) Validar endpoint GET /api/admin/saques-presos (x-admin-token) para monitorar presos em PROCESSING. (5) Checklist de logs (início/fim de ciclo worker, lock, sucesso/falha, rollback, reconcile timeout/409).

---

## PARTE 1 — Entrypoints e montagem de rotas

### 1.1 Entrypoints reais

| Arquivo | express() | listen / start |
|---------|-----------|----------------|
| **server-fly.js** | Linha 59: `const app = express();` | Linha 3215–3217: `const server = http.createServer(app);` … `server.listen(PORT, '0.0.0.0', () => { ... });` (startServer(); require.main === module, linha 3231–3233) |
| server-fly-deploy.js | Linha 19: `const app = express();` | Linha 979: `app.listen(PORT, '0.0.0.0', ...)` |
| monitoring-system.js | Linha 528 | — |
| proxy-cors.js | Linha 6 | Linha 37: app.listen |
| fix-memory-issue.js | Linha 15 | Linha 89: app.listen |

**Fonte da verdade para produção:** `server-fly.js` (main: server-fly.js no package.json; start: `node server-fly.js`).

Trecho (server-fly.js):

```javascript
// 59
const app = express();
// ...
// 3214-3222
const server = http.createServer(app);
const wss = new WebSocketManager(server);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [SERVER] Servidor iniciado na porta ${PORT}`);
  // ...
});
```

### 1.2 Montagem de rotas (fonte da verdade)

Busca por `app.use(` em server-fly.js: **não há** `app.use('/api/admin', ...)` nem `require('adminRoutes')`. Rotas são registradas com `app.get`/`app.post` diretamente.

| prefixo | router/handler | arquivo | evidência | ativo em runtime? |
|---------|----------------|---------|-----------|-------------------|
| (global) | limiter, helmet, cors, express.json, etc. | server-fly.js | app.use(limiter), app.use('/api/', limiter), app.use('/api/auth/', authLimiter) (linhas 311–314, 317, 327) | Sim |
| /api/admin/bootstrap | authenticateToken + handler inline | server-fly.js | app.post('/api/admin/bootstrap', authenticateToken, async (req, res) => { ... }) (linha 2901) | Sim |
| /api/admin/saques-presos | authAdminToken + handler inline | server-fly.js | app.get('/api/admin/saques-presos', authAdminToken, async (req, res) => { ... }) (linha 2944) | Sim |
| /api/admin/* (outras) | adminRoutes (router) | routes/adminRoutes.js | router.get('/saques-presos', ...), router.post('/relatorio-semanal', ...) | **Não** (router não montado em server-fly.js) |

**Conclusão:** Rotas admin em runtime vêm **só de server-fly.js**. `routes/adminRoutes.js` **não é montado**; não há `app.use('/api/admin', adminRoutes)` no servidor principal.

---

## PARTE 2 — Depósito PIX (pagamentos_pix)

### 2.1 Endpoints de depósito PIX

| Rota | Método | Arquivo | Handler | Tabela | Status escrito/lido |
|------|--------|---------|---------|--------|----------------------|
| /api/payments/pix/criar | POST | server-fly.js (~1729) | authenticateToken + inline | pagamentos_pix | Insert: status PENDING (constante withdrawalStatus; no trecho visto usa PENDING = 'pendente'), external_id, payment_id, amount, valor, qr_code* |
| /api/payments/webhook | POST | server-fly.js (~1992) | webhookSignatureValidator (se MERCADOPAGO_WEBHOOK_SECRET), depois inline | pagamentos_pix | Select por external_id/payment_id; update status 'approved'; creditar saldo em usuarios |
| /api/payments/pix/usuario | GET | server-fly.js (~1894) | authenticateToken + inline | pagamentos_pix | Apenas leitura (listagem por usuario_id) |

Trecho insert depósito (server-fly.js ~1826–1835):

```javascript
const { data: pixRecord, error: insertError } = await supabase
  .from('pagamentos_pix')
  .insert({
    usuario_id: req.user.userId,
    external_id: String(payment.id),
    payment_id: String(payment.id),
    amount: parseFloat(amount),
    valor: parseFloat(amount),
    status: PENDING,  // constante = 'pendente'
    qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
    // ...
  })
```

### 2.2 Status 'pending' em depósito vs saques

- **pagamentos_pix:** insert com `status: PENDING` (constante = 'pendente' em server-fly); webhook atualiza para `'approved'`. Leitura no webhook: `existingPayment.status === 'approved'` e `.neq('status', 'approved')` no update.
- **saques:** status oficiais são 'pendente'|'processando'|'concluido'|'rejeitado'|'cancelado' (withdrawalStatus.js). Nenhum insert em saques usa string 'pending'; todos usam constante PENDING = 'pendente'.
- **Separação:** Depósito usa tabela `pagamentos_pix`; saque usa tabela `saques`. Colunas e fluxos distintos; não há cruzamento de status entre as duas tabelas.

---

## PARTE 3 — Saque PIX (saques): criação e atualização de status

### 3.1 Pontos que CRIAM saque (INSERT)

| Arquivo | Linha | Campos relevantes do insert |
|---------|-------|-----------------------------|
| server-fly.js | ~1547–1566 | usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, **status: PENDING**, created_at |

Trecho (server-fly.js):

```javascript
const { data: saque, error: saqueError } = await supabase
  .from('saques')
  .insert({
    usuario_id: userId,
    valor: requestedAmount,
    amount: requestedAmount,
    fee: taxa,
    net_amount: valorLiquido,
    correlation_id: correlationId,
    pix_key: validation.data.pixKey,
    pix_type: validation.data.pixType,
    chave_pix: validation.data.pixKey,
    tipo_chave: validation.data.pixType,
    status: PENDING,
    created_at: new Date().toISOString()
  })
  .select()
  .single();
```

Nenhum outro arquivo do escopo principal (server-fly, src/domain/payout, controllers ativos) faz insert em `saques`. processPendingWithdrawals.js não insere; apenas atualiza status.

### 3.2 Pontos que ATUALIZAM status do saque

| Arquivo | Linha | Constante/valor | Contexto |
|---------|-------|------------------|-----------|
| processPendingWithdrawals.js | 57–59, 88, 292–297, 324–330, 106–112, etc. | PENDING, PROCESSING, COMPLETED, REJECTED | updateSaqueStatus; lock (onlyWhenStatus: PENDING); conclusão; rollback |
| server-fly.js | ~2244, 2264 | COMPLETED, PROCESSING | Webhook Mercado Pago: approved/credited → COMPLETED; in_process → PROCESSING |
| server-fly.js | ~2290+ | REJECTED | Webhook: rejected/cancelled → rollback (rollbackWithdraw marca REJECTED) |
| reconcileProcessingWithdrawals.js | múltiplas | PROCESSING, REJECTED, COMPLETED | Timeout, sucesso createPixWithdraw, 409 com transacao_id, rejeições por valor/pix/erro |

Status oficiais (withdrawalStatus.js, linhas 6–9): PENDING='pendente', PROCESSING='processando', COMPLETED='concluido', REJECTED='rejeitado', CANCELED='cancelado'. Comentário no arquivo: "Valores permitidos: pendente | processando | concluido | rejeitado | cancelado" (CHECK no Supabase).

---

## PARTE 4 — Worker (processPendingWithdrawals.js): invariantes e segurança

### 4.1 Seleção de pendentes

- **Arquivo:** `src/domain/payout/processPendingWithdrawals.js`
- **Trecho (linhas 234–239):** `.from('saques').select(...).eq('status', PENDING).order('created_at', { ascending: true }).limit(1)`
- Comentário na linha 234: "Selecionar somente status 'pendente' (CHECK do banco); não usar 'pending'."

### 4.2 Lock (onlyWhenStatus)

- **Trecho (linhas 291–298):** `updateSaqueStatus({ supabase, saqueId, userId, newStatus: PROCESSING, onlyWhenStatus: PENDING })`. Se a atualização não afetar nenhuma linha (status já mudou), `lockResult.success` é false e o ciclo retorna sem processar (duplicate: true).

### 4.3 Chamada ao provedor e contrato

- **createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId)** (linha 318).
- Contrato esperado (services/pix-mercado-pago.js): retorno `{ success: true, data: { id, status, amount, ... } }` ou `{ success: false, error }`. O `data.id` é usado como transacao_id ao marcar COMPLETED (linhas 322–323, 325–330).
- 409/duplicidade: o serviço não trata 409 explicitamente; o reconciler trata erro com mensagem contendo 409/duplicate/idempotent e só marca COMPLETED se existir `payoutResult.data.id`.

### 4.4 Marcação de concluído

- **Trecho (linhas 320–334):** Se `payoutResult?.success === true`, chama `updateSaqueStatus` com newStatus: COMPLETED, processed_at: now, transacao_id: payoutResult?.data?.id. Se o update falhar, log de falha e retorno sem reverter para PENDING (saque fica em PROCESSING para o reconciler).

### 4.5 Rollback

- **rollbackWithdraw** (linhas 103–189): marca REJECTED com onlyWhenStatus: PROCESSING; reconstitue saldo em usuarios; cria ledger 'falha_payout' ou equivalente; usa createLedgerEntry com correlation_id + referencia para deduplicação.

### 4.6 Idempotência e “pagar duas vezes”

- Lock PENDING→PROCESSING garante que apenas um worker processa o mesmo saque em um ciclo.
- Um saque por ciclo (limit 1) reduz concorrência; próximo ciclo pega outro pendente.
- Se createPixWithdraw retornar sucesso mas o update para COMPLETED falhar, o saque permanece em PROCESSING; o reconciler pode re-chamar createPixWithdraw (idempotência no MP depende de external_reference) ou marcar timeout.
- **Risco remanescente:** se o MP não for idempotente por external_reference, uma retentativa (reconciler ou worker em outro processo) poderia gerar segundo transfer. Não há evidência no código de “duas vezes” no mesmo fluxo síncrono; o risco é entre ciclos/processos.

### 4.7 Logs importantes

- Início ciclo: "🟦 [PAYOUT][WORKER] Saque selecionado" (saqueId, userId, correlationId, amount, netAmount, pixType, pixKey mascarado).
- Lock: "🟦 [PAYOUT][WORKER] Payout iniciado" (status_anterior, status_novo: PROCESSING).
- Tentativa duplicada: "ℹ️ [SAQUE][WORKER] Tentativa duplicada ou falha no lock".
- Sucesso: "✅ [PAYOUT][WORKER] Saque concluído" (saqueId, userId, correlationId, status_anterior, status_novo: COMPLETED).
- Falha/rollback: "↩️ [SAQUE][ROLLBACK] Início" e "✅ [SAQUE][ROLLBACK] Concluído" (status_novo: REJECTED).
- Falha ao marcar concluído: "❌ [SAQUE][WORKER] Falha ao marcar concluído (sem revert)".
- Catch: "❌ [SAQUE][WORKER] Falha ao reverter no catch".

---

## PARTE 5 — Reconciler (reconcileProcessingWithdrawals.js)

### 5.1 Critérios de seleção

- **Constantes (linhas 13–15):** RECONCILE_AGE_MINUTES = 10, RECONCILE_TIMEOUT_MINUTES = 30, RECONCILE_LIMIT = 10.
- **Query (linhas 65–70):** `.from('saques').select(...).eq('status', PROCESSING).lt('created_at', sinceIso).order('created_at', { ascending: true }).limit(RECONCILE_LIMIT)`.
- Ou seja: status PROCESSING e created_at &lt; now - 10 min, até 10 registros.

### 5.2 Timeout → rejeitado

- Se `created_at` &lt; timeoutIso (30 min), chama updateSaqueStatus(REJECTED, motivo_rejeicao: 'timeout_reconciliacao', onlyWhenStatus: PROCESSING) (linhas 96–117).

### 5.3 Com transacao_id

- getTransferStatusFromProvider(mercadoPagoClient, transacaoId). Se provider retornar completed/credited, update COMPLETED com processed_at e transacao_id (onlyWhenStatus: PROCESSING). Se mercadoPagoClient não tiver getTransfer, log "precisa_revisao" e continua (linhas 119–157).

### 5.4 Sem transacao_id: re-call createPixWithdraw e 409

- Re-chama createPixWithdraw; se success, marca COMPLETED com transacao_id de payoutResult.data.id (linhas 221–247).
- Se erro 409/duplicate/idempotent: só marca COMPLETED se existir payoutResult.data.id (txIdFromResponse); senão log "precisa_revisao_409_sem_transacao_id" e não atualiza status (linhas 251–284).

### 5.5 Validações e robustez

- Valida updateSaqueStatus como função no início.
- netAmount: se !Number.isFinite(netAmount) || netAmount <= 0 → REJECTED 'valor_invalido_reconcile'.
- pixKey (trim) e pixType em lista válida (cpf, cnpj, email, phone, random, evp); senão REJECTED 'pix_invalido_reconcile'.
- createPixWithdraw em try/catch; em exceção → REJECTED 'erro_provedor_reconcile'.
- Corpo do for em try/catch por saque; no catch log (saqueId, userId, correlationId) e continue.

### 5.6 Integração no payout-worker

- **Arquivo:** `src/workers/payout-worker.js`
- **Trecho (linhas 17–20, 22–23, 101–128):** reconcileIntervalMs = parseInt(process.env.PAYOUT_RECONCILE_INTERVAL_MS || '300000', 10); reconcileRunning; runReconcileCycle() verifica reconcileRunning, chama reconcileProcessingWithdrawals({ supabase, payoutEnabled, isDbConnected, createPixWithdraw, mercadoPagoClient: null }); runReconcileCycle() na subida e setInterval(runReconcileCycle, reconcileIntervalMs).

---

## PARTE 6 — Provedor PIX (Mercado Pago)

### 6.1 createPixWithdraw

- **Arquivo:** `services/pix-mercado-pago.js`
- **Assinatura (linha 222):** createPixWithdraw(amount, pixKey, pixKeyType, userId, saqueId, correlationId)
- **Idempotência:** external_reference = `${saqueId}_${correlationId}` (linha 262); enviado no body do POST para `/v1/transfers`. Não há header X-Idempotency-Key no código.
- **Sucesso:** retorno { success: true, data: { id: transfer?.id, status, amount, external_reference, ... } } (linhas 310–319).
- **Erro:** { success: false, error: error.response?.data?.message || error.message }. 409 viria no error; tratamento de 409 está no reconciler e no worker (checagem de mensagem).

### 6.2 Webhook/confirmador de payout

- **Rota:** POST `/webhooks/mercadopago` (server-fly.js ~2131).
- Verifica saque por id no body; se status já COMPLETED/REJECTED (normalizeWithdrawStatus), ignora.
- Verifica ledger por correlation_id + referencia + tipo (payout_confirmado/falha_payout); se já existe, ignora (idempotência).
- approved/credited: createLedgerEntry('payout_confirmado'); update saques COMPLETED + processed_at (linhas 2241–2259).
- in_process: update saques PROCESSING (linha 2264).
- rejected/cancelled: createLedgerEntry('falha_payout'); rollbackWithdraw (marca REJECTED, restaura saldo).
- Status finais escritos são constantes COMPLETED, REJECTED, PROCESSING; normalização só em leitura (logs e comparações).

---

## PARTE 7 — Ledger e saldo

### 7.1 Ledger (ledger_financeiro)

- **Escrita:** (1) processPendingWithdrawals.js: createLedgerEntry — insert com tipo, usuario_id, valor, referencia, correlation_id (linhas 23–32). Tipos usados no fluxo de saque: 'saque', 'taxa', 'payout_confirmado', 'falha_payout' (e equivalentes no rollback). (2) server-fly.js: createLedgerEntry no /api/withdraw/request (saque, taxa) e no webhook (payout_confirmado, falha_payout).
- **Deduplicação:** select por correlation_id + tipo + referencia (.eq('correlation_id', correlationId).eq('tipo', tipo).eq('referencia', referencia).maybeSingle()); se existing?.id, retorna { success: true, deduped: true } sem insert (processPendingWithdrawals.js linhas 7–20).
- **Risco:** Não foi verificada existência de UNIQUE (correlation_id, tipo, referencia) no schema do banco; a lógica atual evita duplicata por select prévio. Possível race se duas requisições iguais concorrerem antes do insert.

### 7.2 Saldo (usuarios)

- **Débito no pedido de saque:** server-fly.js ~1531–1536: update usuarios set saldo = novoSaldo com `.eq('id', userId).eq('saldo', usuario.saldo)` (otimistic lock). Se nenhuma linha afetada, retorna 409 "Saldo atualizado recentemente".
- **Reconstituição no rollback:** rollbackWithdraw em processPendingWithdrawals.js (e chamado no webhook): lê saldo atual, soma amount (valor do saque), update com onlyWhenStatus PROCESSING e marca saque REJECTED; createLedgerEntry para falha.

---

## PARTE 8 — Admin: rotas, auth, env

### 8.1 Rotas admin

- **Em runtime (server-fly.js):** POST /api/admin/bootstrap (authenticateToken); GET /api/admin/saques-presos (authAdminToken). Nenhuma outra rota /api/admin é registrada em server-fly.js.
- **adminRoutes.js:** Define GET /saques-presos e outras (relatorio-semanal, exportar/*, etc.) com authAdminToken e controllers; **não é montado** (não há app.use('/api/admin', adminRoutes) em server-fly.js).

### 8.2 authAdminToken

- **Arquivo:** middlewares/authMiddleware.js
- **Token:** req.headers['x-admin-token'] (linha 7); compara com env.ADMIN_TOKEN (linha 16).
- **env:** require('../config/env') (linha 2); variáveis: ADMIN_TOKEN, NODE_ENV, JWT_SECRET (para verifyJWT no mesmo arquivo).

### 8.3 config/env.js e envalid

- **Arquivo:** config/env.js
- **Trecho (linhas 1–26):** const { cleanEnv, str, num, url } = require('envalid'); cleanEnv(process.env, { DATABASE_URL, PORT, JWT_SECRET, ADMIN_TOKEN, CORS_ORIGINS, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, NODE_ENV }).
- **Impacto no boot:** Se server-fly carregar authMiddleware (para GET /api/admin/saques-presos), o require('../config/env') é executado e envalid é necessário. Se envalid não estiver instalado, o boot falha com MODULE_NOT_FOUND. Não há fallback sem envalid no authMiddleware; server-fly usa process.env diretamente para JWT e demais variáveis.

---

## PARTE 9 — Normalização de status (aliases)

### 9.1 Aliases (apenas leitura/normalização)

- **withdrawalStatus.js (linhas 26–37):** normalizeWithdrawStatus mapeia: 'pending' → PENDING; 'processado' → COMPLETED; 'falhou' → REJECTED; 'aguardando_confirmacao' → PROCESSING.
- **Uso em escrita:** Nenhum; escrita usa constantes PENDING, PROCESSING, COMPLETED, REJECTED.
- **Uso em leitura:** server-fly.js (resposta do withdraw/request, withdraw/history, webhook logs); processPendingWithdrawals.js (logs status_anterior).

### 9.2 Status oficiais e escrita

- **Oficiais:** pendente, processando, concluido, rejeitado, cancelado (withdrawalStatus.js).
- **Onde se escreve:** processPendingWithdrawals.js (updateSaqueStatus), reconcileProcessingWithdrawals.js (via updateSaqueStatus), server-fly.js (insert PENDING; webhook COMPLETED/PROCESSING/REJECTED). Todos usam constantes do withdrawalStatus.

---

## PARTE 10 — Mapas arquiteturais e checklist V1

### 10.1 Arquitetura atual (as-is) — diagrama texto

```
[Player/Front]
      |
      | POST /api/withdraw/request (JWT)     POST /api/payments/pix/criar (JWT)
      | GET /api/withdraw/history            GET /api/payments/pix/usuario
      v
[server-fly.js]
      |
      | idempotência correlation_id          insert pagamentos_pix (PENDING)
      | debita saldo (usuarios)              POST /api/payments/webhook (depósito)
      | insert saques (PENDING)              GET MP payment -> update approved, credita saldo
      | createLedgerEntry (saque, taxa)
      v
[Supabase]
   saques, usuarios, ledger_financeiro, pagamentos_pix
      ^
      | select PENDING limit 1, update PROCESSING (onlyWhenStatus PENDING)
      | createPixWithdraw -> MP /v1/transfers (external_reference = saqueId_correlationId)
      | update COMPLETED / rollback REJECTED + saldo + ledger
[processPendingWithdrawals.js] <- [payout-worker.js] setInterval
      ^
      | POST /webhooks/mercadopago (payout)
      | approved -> COMPLETED + ledger payout_confirmado
      | in_process -> PROCESSING; rejected -> rollback REJECTED + falha_payout
[Provedor MP]
      |
[reconcileProcessingWithdrawals.js] <- setInterval (payout-worker)
      | PROCESSING + created_at < 10 min; timeout 30 min -> REJECTED
      | com transacao_id -> getTransfer (se existir); sem -> createPixWithdraw, 409 com transacao_id -> COMPLETED
      v
[Admin] GET /api/admin/saques-presos (x-admin-token) -> server-fly.js inline
        POST /api/admin/bootstrap (JWT) -> server-fly.js inline
```

### 10.2 Arquitetura ideal (to-be) — módulo financeiro

- **Ledger atômico (double-entry):** entradas e saídas pareadas; constraint de saldo por usuario/periodo; evitar saldo negativo por regra no ledger.
- **Outbox/eventos:** após debitar saldo e inserir saque, publicar evento “SaqueSolicitado”; worker consome outbox e chama provedor; confirmação do provedor publica “PayoutConfirmado”; um único consumidor por correlation_id.
- **Idempotência end-to-end:** correlation_id em toda a cadeia; provedor com idempotency key (header ou external_reference garantido pelo MP); reconhecimento 409 com transacao_id para marcar COMPLETED sem re-enviar.
- **Antifraude:** limites por usuário/periodo (valor e quantidade); KYC light (documento/telefone); velocity (saques por hora/dia); device fingerprint e lista de bloqueio.
- **Reconciliação provedor:** job periódico que lê transferências no MP (getTransfer ou list) e alinha status em saques (COMPLETED/REJECTED); alertas para divergências.

### 10.3 Checklist objetivo V1 estável (read-only)

- [ ] **Rotas:** GET /api/admin/saques-presos retorna 200 com x-admin-token válido; POST /api/withdraw/request e GET /api/withdraw/history exigem JWT e retornam dados esperados.
- [ ] **Env:** JWT_SECRET, SUPABASE_*, MERCADOPAGO_DEPOSIT_ACCESS_TOKEN, MERCADOPAGO_PAYOUT_ACCESS_TOKEN (onde aplicável); PAYOUT_PIX_ENABLED e ENABLE_PIX_PAYOUT_WORKER quando worker ativo; ADMIN_TOKEN para admin.
- [ ] **Worker:** Processo payout-worker em execução (ENABLE_PIX_PAYOUT_WORKER=true); logs “Início do ciclo” / “Fim do ciclo”; nenhum crash em loop.
- [ ] **Reconciler:** PAYOUT_RECONCILE_INTERVAL_MS configurado; logs “RECONCILE Início/Fim”; saques em PROCESSING &gt; 30 min diminuem (timeout) ou viram COMPLETED.
- [ ] **Admin endpoint:** Resposta com meta.total e data[] sem campos sensíveis (sem pix_key na lista).
- [ ] **Logs:** Presença de saqueId, userId, correlationId nos logs de saque/worker/reconciler; rollback e timeout registrados.

**Comandos de verificação sugeridos (somente leitura):**

- `rg -n "app\.(get|post)\('/api/admin" server-fly.js` — confirma rotas admin inline.
- `rg -n "from\(['\"]saques['\"]\)" server-fly.js src/domain/payout/*.js` — confirma quem acessa saques.
- `rg -n "onlyWhenStatus|PROCESSING|RECONCILE" src/domain/payout/*.js` — confirma lock e reconciler.
- `rg -n "correlation_id|external_reference" services/pix-mercado-pago.js server-fly.js` — confirma idempotência.
- `rg -n "process\.env\.|ADMIN_TOKEN|JWT_SECRET|PAYOUT" server-fly.js src/workers/payout-worker.js middlewares/authMiddleware.js` — confirma consumo de env.

---

*Fim do dossiê. Documento gerado por inspeção read-only do repositório.*
