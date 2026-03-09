# Auditoria Suprema READ-ONLY — Saque PIX (Gol de Ouro)

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto. Nenhuma alteração de código, git, banco ou deploy.  
**Contexto:** Player em produção estável FyKKeg6zb (não tocar). POST /api/withdraw/request retorna 500 (backend).

---

## Resumo executivo (10 linhas)

- O handler do saque está em **server-fly.js:L1394–1582**; o INSERT em **saques** (L1546–1566) envia `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status: 'pendente'`, `created_at`. Todos os campos NOT NULL informados para PROD são preenchidos; o INSERT em si pode não ser a causa do 500 se o schema PROD estiver alinhado.
- O **CHECK de status em PROD** (pendente | processando | concluido | rejeitado | cancelado) **não inclui** os valores usados pelo worker e pelo webhook: **aguardando_confirmacao**, **processado**, **falhou**. O worker grava `processando` (OK) e depois tenta `aguardando_confirmacao` (viola CHECK); o webhook grava `processado` (viola CHECK); o rollback grava `falhou` (viola CHECK). Isso gera falhas de UPDATE e deixa saques travados ou rollback sem atualizar status.
- O 500 retornado ao client é genérico (`message: 'Erro ao criar saque'`) e **não inclui correlation_id** na resposta, o que dificulta rastreio nos logs.
- **Recomendação única:** Normalizar no **código** todos os status para os 5 permitidos em PROD (pendente → pendente; processando → processando; aguardando_confirmacao → processando; processado → concluido; falhou → cancelado; rejeitado → rejeitado) e incluir **correlation_id** na resposta 500. Em seguida, rodar o SQL READ-ONLY PACK no Supabase para confirmar constraints e dados antes de qualquer alteração.

---

## 1) Mapa do fluxo do saque

```
[REQUEST]
  POST /api/withdraw/request (server-fly.js:L1394)
  → auth (authenticateToken), body: valor, chave_pix, tipo_chave
  → correlationId = header x-idempotency-key | x-correlation-id | randomUUID()
  → PixValidator.validateWithdrawData (L1413)
  → validação valor mínimo 10, saldo, taxa, valorLiquido > 0
  → débito em usuarios.saldo (L1529)
  → INSERT saques (L1546-L1566)  ← possível ponto de 500
  → createLedgerEntry (saque)    ← possível ponto de 500
  → createLedgerEntry (taxa)    ← possível ponto de 500
  → em qualquer falha pós-débito: rollbackWithdraw (devolve saldo + UPDATE saques.status = 'falhou')
  → resposta 201 com data do saque

[DB]
  Tabela public.saques (PROD): id(uuid), usuario_id(NN), transacao_id, valor, chave_pix(NN), tipo_chave(NN),
  status(default 'pendente'), motivo_rejeicao, processed_at, created_at, updated_at,
  amount(NN), pix_key(NN), pix_type(NN), correlation_id, fee(NN default 0), net_amount(NN).
  CHECK status: pendente | processando | concluido | rejeitado | cancelado.

[WORKER]
  processPendingWithdrawals (src/domain/payout/processPendingWithdrawals.js)
  → SELECT saques WHERE status IN ('pendente','pending') (L133-L137)
  → UPDATE status = 'processando' (L189-L195)  ← permitido no CHECK
  → createPixWithdraw (provedor PIX)
  → UPDATE status = 'aguardando_confirmacao' (L209-L212)  ← NÃO permitido no CHECK PROD
  → em falha: rollbackWithdraw → UPDATE status = 'falhou' (L89-L92)  ← NÃO permitido no CHECK PROD

[PROVEDOR / WEBHOOK]
  server-fly.js handler webhook Mercado Pago (L2151 em diante)
  → approved/credited → UPDATE saques.status = 'processado' (L2240)  ← NÃO permitido (PROD tem 'concluido')
  → in_process → UPDATE saques.status = 'aguardando_confirmacao' (L2253)  ← NÃO permitido
  → rejected/cancelled → rollbackWithdraw → UPDATE status = 'falhou'  ← NÃO permitido (PROD tem 'cancelado')

[ROLLBACK]
  rollbackWithdraw (processPendingWithdrawals.js:L43-L98)
  → devolve saldo em usuarios
  → createLedgerEntry tipo 'rollback'
  → UPDATE saques.status = 'falhou'  ← viola CHECK PROD
```

---

## 2) Hipóteses ranqueadas para o 500

| # | Sintoma | Causa provável | Como provar | Fix mínimo |
|---|--------|----------------|-------------|------------|
| **1** | 500 ao solicitar saque | **INSERT em saques** falha por constraint (CHECK status, tipo_chave, FK usuario_id) ou trigger | Log Fly: `❌ [SAQUE] Erro ao criar saque:` + objeto saqueError (code, message, details). Rodar SQL pack 1 e 2 para ver constraints e FK. | Garantir que INSERT use apenas status 'pendente' (já usa). Garantir tipo_chave dentro do CHECK (PixValidator já restringe a cpf/cnpj/email/phone/random). Verificar se usuario_id é UUID válido e existe em usuarios. |
| **2** | 500 ao solicitar saque | **createLedgerEntry** falha (tabela ledger_financeiro ausente, constraint, ou coluna) | Log Fly: `❌ [SAQUE] Erro ao registrar ledger (saque):` ou `(taxa):`. INSERT em saques já teve sucesso nesse caso. | Verificar schema de ledger_financeiro em PROD; ajustar insert ou criar tabela/colunas se faltando. |
| **3** | 500 ao solicitar saque | **rollbackWithdraw** (após falha de ledger) tenta UPDATE status = 'falhou' e falha por CHECK em PROD | Log: `❌ [SAQUE] Erro ao registrar ledger` seguido de `[SAQUE][ROLLBACK]` e possivelmente erro ao atualizar saques. | Normalizar status no rollback para 'cancelado' (ou ampliar CHECK). |
| **4** | Saque criado mas fica travado / rollback não atualiza | Worker ou webhook tenta gravar **aguardando_confirmacao** ou **processado** ou **falhou** e CHECK rejeita | Log worker: `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` ou erro no UPDATE. Log webhook ao atualizar saque. | Normalizar no código: aguardando_confirmacao → processando, processado → concluido, falhou → cancelado. |
| **5** | 500 por falha antes do INSERT | **existingWithdrawError** ou **pendingError** (SELECT em saques) retorna erro (ex.: coluna inexistente, RLS) | Log: `❌ [SAQUE] Erro ao verificar idempotência` ou `Erro ao verificar saques pendentes`. | Confirmar que todas as colunas do SELECT existem em PROD; backend usa service role (RLS não deveria bloquear). |

---

## 3) Conformidade de status

### Status usados no código (com arquivo e linha)

| Origem | Status gravado | Arquivo:linha | Permitido no CHECK PROD? |
|--------|----------------|---------------|---------------------------|
| Request (INSERT) | pendente | server-fly.js:L1562 | Sim |
| Request (idempotência / pendentes) | — (filtra pendente, pending) | server-fly.js:L1441, L1476 | — |
| Worker (lock) | processando | processPendingWithdrawals.js:L191 | Sim |
| Worker (após PIX ok) | aguardando_confirmacao | processPendingWithdrawals.js:L211 | **Não** |
| Worker (rollback) | falhou | processPendingWithdrawals.js:L91 | **Não** |
| Webhook (aprovado) | processado | server-fly.js:L2240 | **Não** (PROD tem concluido) |
| Webhook (in_process) | aguardando_confirmacao | server-fly.js:L2253 | **Não** |
| Webhook (rejected/cancelled) | via rollback → falhou | server-fly.js + rollbackWithdraw | **Não** |

### CHECK em PROD (informado)

- **Permitidos:** pendente | processando | concluido | rejeitado | cancelado.

### Divergências

- **aguardando_confirmacao** → não existe no CHECK; código usa em worker e webhook.
- **processado** → não existe no CHECK; PROD usa **concluido**.
- **falhou** → não existe no CHECK; PROD usa **cancelado**.
- **pending** → usado apenas em filtros (.in('status', ['pendente', 'pending'])); não é gravado no INSERT; se houver linhas com status 'pending' em PROD, o CHECK atual pode já rejeitá-las (conforme definição exata do CHECK).

---

## 4) Plano de correção

### Opção 1 — Normalizar status no código (recomendado)

- **Objetivo:** Usar apenas os 5 valores do CHECK PROD em todos os UPDATE/INSERT em `saques`.
- **Alterações (apenas descrição; não aplicar):**
  - **INSERT (já correto):** Manter `status: 'pendente'`.
  - **Worker (processPendingWithdrawals.js):**
    - Manter UPDATE para `processando` (L191).
    - Trocar UPDATE para `aguardando_confirmacao` (L211) por **processando** (ou manter um único “em processamento” como processando).
    - Trocar rollback UPDATE `status: 'falhou'` (L91) por **cancelado**.
  - **Webhook (server-fly.js):**
    - Trocar UPDATE `status: 'processado'` (L2240) por **concluido**.
    - Trocar UPDATE `status: 'aguardando_confirmacao'` (L2253) por **processando**.
    - Garantir que rollbackWithdraw (chamado pelo webhook) atualize status para **cancelado** em vez de **falhou** (alterar em processPendingWithdrawals.js rollbackWithdraw).
  - **Frontend (Withdraw.jsx):** Se exibir labels por status, mapear concluido → “Processado”, cancelado → “Cancelado/Falhou” para não quebrar UX.
  - **Resposta 500:** Incluir `correlation_id` no JSON de erro (ex.: `res.status(500).json({ success: false, message: 'Erro ao criar saque', correlation_id: correlationId })`) para rastreio nos logs (L1569–1582 e demais 500 do fluxo de saque).

### Opção 2 — Ampliar CHECK no Supabase (apenas sugerir SQL; não executar)

- **Objetivo:** Incluir no CHECK os valores que o código já usa.
- **SQL sugerido (READ-ONLY aqui; não executar pelo Cursor):**
  - Primeiro identificar o nome da constraint atual (ex.: via query 1 do SQL READ-ONLY PACK).
  - Depois, em janela de manutenção e com backup, algo como (ajustar nome da constraint conforme PROD):

```sql
-- Exemplo: remover CHECK antigo e criar novo (substituir <nome_do_check> pelo nome real).
-- ALTER TABLE public.saques DROP CONSTRAINT IF EXISTS <nome_do_check>;
-- ALTER TABLE public.saques ADD CONSTRAINT saques_status_check
--   CHECK (status IN (
--     'pendente', 'pending', 'processando', 'aguardando_confirmacao',
--     'concluido', 'processado', 'rejeitado', 'cancelado', 'falhou'
--   ));
```

- **Risco:** Qualquer valor novo no código exigiria nova alteração de CHECK; Opção 1 centraliza regra no código e mantém PROD estável.

---

## 5) Plano de teste (smoke tests)

- **Pré-requisito:** Não alterar o deploy estável FyKKeg6zb; testes em ambiente de staging/preview ou em produção com cuidado (apenas leitura onde possível).
- **Passos (manuais):**
  1. **Antes da correção:** Reproduzir o 500 (POST /api/withdraw/request com payload válido); anotar no Fly log a linha `❌ [SAQUE] Erro ao criar saque:` e, se houver, `Erro ao registrar ledger`; confirmar se a resposta 500 inclui ou não correlation_id.
  2. **Após aplicar Opção 1 (staging/preview):**  
     - Fazer POST /api/withdraw/request com valor válido, chave_pix e tipo_chave válidos; esperar 201 e registro em saques com status pendente.  
     - (Se worker estiver ativo) Aguardar ciclo do worker; confirmar que o saque passa a processando e, quando aplicável, concluido (sem erro de CHECK).  
     - Simular falha de payout (ou usar webhook de teste) e confirmar que o rollback atualiza status para cancelado e que não há 500 por constraint.  
     - Verificar GET /api/withdraw/history com o mesmo usuário e confirmar que os status exibidos são coerentes (concluido/cancelado/rejeitado etc.).
  3. **Produção (após go-live da correção):** Repetir um fluxo mínimo de saque (request → 201 → histórico) sem alterar o player FyKKeg6zb; monitorar logs por qualquer novo 500 ou mensagem de constraint.

---

## 6) Evidências detalhadas (Passo a Passo A–E)

### A) Handler e INSERT

- **Rota:** server-fly.js:L1394 — `app.post('/api/withdraw/request', authenticateToken, async (req, res) => {`
- **Payload:** L1396 — `const { valor, chave_pix, tipo_chave } = req.body;`
- **userId:** L1397 — `req.user.userId` (vem do JWT em authenticateToken).
- **correlation_id:** L1398–1402 — header `x-idempotency-key` ou `x-correlation-id` ou `crypto.randomUUID()`.
- **Validações antes do INSERT:**
  - PixValidator.validateWithdrawData (L1413) — valida valor, chave PIX, tipo (cpf/cnpj/email/phone/random).
  - Valor mínimo 10 (L1421–1427).
  - dbConnected e supabase (L1430–1435).
  - Idempotência por correlation_id (L1439–1469).
  - Pendentes por usuario_id (L1474–1492).
  - Usuário existe e saldo suficiente (L1496–1514).
  - Taxa e valorLiquido (L1518–1524).
  - Débito de saldo com condição otimista (L1527–1543).
- **INSERT exato (L1546–1566):**

```javascript
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
  status: 'pendente',
  created_at: new Date().toISOString()
})
```

- **Campos que podem ser NULL no PROD (se existirem):** transacao_id, motivo_rejeicao, processed_at — o código não envia; created_at/updated_at têm default. O INSERT não envia valor_liquido nem taxa como colunas (usa net_amount e fee), alinhado ao que você descreveu para PROD.

### B) FKs / constraints

- **usuario_id:** Vem de `req.user.userId` (UUID do JWT). Se o token for válido, o usuário existe; o SELECT em usuarios (L1496) falharia antes do INSERT em caso de usuário inexistente (404).
- **tipo_chave:** PixValidator (utils/pix-validator.js) restringe a cpf, cnpj, email, phone, random; o INSERT usa `validation.data.pixType`. Se PROD tiver CHECK com esses mesmos valores, está alinhado.
- **NOT NULL em PROD:** usuario_id, chave_pix, tipo_chave, amount, pix_key, pix_type, fee, net_amount — todos enviados pelo INSERT.

### C) Worker payout

- **Módulo:** src/domain/payout/processPendingWithdrawals.js; invocado por src/workers/payout-worker.js (L75).
- **SELECT saques:** L133–137 — colunas: id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at. Filtro: `.in('status', ['pendente', 'pending'])`.
- **UPDATE status:** L189–195 `status = 'processando'`; L209–212 `status = 'aguardando_confirmacao'`; L89–92 (rollback) `status = 'falhou'`.
- **Divergência com CHECK PROD:** aguardando_confirmacao e falhou não permitidos; ver seção 3.

### D) Webhook provedor

- **Handler:** server-fly.js (webhook Mercado Pago); trecho do saque a partir de L2145 (extração de saqueId/correlationId de external_reference).
- **UPDATE status:** L2240 `status: 'processado'`; L2253 `status: 'aguardando_confirmacao'`; em caso de rejected/cancelled chama rollbackWithdraw → `status: 'falhou'`.
- **Conflito com CHECK PROD:** processado, aguardando_confirmacao, falhou não estão no CHECK; ver seção 3.

### E) Observabilidade

- **Log quando INSERT falha:** server-fly.js:L1570 — `console.error('❌ [SAQUE] Erro ao criar saque:', saqueError);`
- **Resposta 500 ao client:** L1580–1582 — `res.status(500).json({ success: false, message: 'Erro ao criar saque' });` — **não inclui correlation_id**.
- **Log quando ledger falha:** L1602 — `❌ [SAQUE] Erro ao registrar ledger (saque):`; L1619 — `Erro ao registrar ledger (taxa):`. Em ambos os casos o handler chama rollbackWithdraw e retorna 500 com mensagem genérica (L1611, L1634) também sem correlation_id na resposta.

---

## 7) SQL READ-ONLY PACK (para rodar manualmente no Supabase)

**Você (Cursor) NÃO executa; apenas gerar. O usuário cola no Supabase.**

### 1) Constraints completas da tabela saques

```sql
SELECT c.conname AS constraint_name,
       c.contype AS type,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'saques'
ORDER BY c.contype, c.conname;
```

### 2) FK usuario_id e amostra de usuario_id de saque recente

```sql
-- FK (já listada na 1; esta query mostra a FK explicitamente)
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'saques'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Amostra: usuario_id de um saque recente
SELECT id, usuario_id, status, created_at
FROM public.saques
ORDER BY created_at DESC NULLS LAST
LIMIT 5;
```

### 3) Valores distintos de tipo_chave e pix_type

```sql
SELECT tipo_chave, COUNT(*) AS cnt
FROM public.saques
GROUP BY tipo_chave
ORDER BY cnt DESC;

SELECT pix_type, COUNT(*) AS cnt
FROM public.saques
GROUP BY pix_type
ORDER BY cnt DESC;
```

### 4) Saques recentes com correlation_id, status, motivo_rejeicao, processed_at

```sql
SELECT id, usuario_id, correlation_id, status, motivo_rejeicao, processed_at, created_at, updated_at
FROM public.saques
ORDER BY created_at DESC NULLS LAST
LIMIT 20;
```

### 5) Verificar linhas com pix_key ou pix_type NULL

```sql
SELECT COUNT(*) AS total,
       COUNT(pix_key) AS with_pix_key,
       COUNT(pix_type) AS with_pix_type
FROM public.saques;

SELECT id, usuario_id, status, pix_key, pix_type, created_at
FROM public.saques
WHERE pix_key IS NULL OR pix_type IS NULL
LIMIT 10;
```

---

## Recomendação única — Próxima ação

Com base nas evidências: o CHECK de status em PROD (pendente | processando | concluido | rejeitado | cancelado) é a única restrição que sabemos que o código viola em vários pontos (worker e webhook gravam aguardando_confirmacao, processado, falhou). O INSERT do request usa apenas 'pendente', que é permitido. Por isso, a **próxima ação** recomendada é: **(1)** Rodar o SQL READ-ONLY PACK no Supabase para confirmar o nome exato da constraint de status e que não há outras causas (ex.: tipo_chave CHECK diferente, FKs). **(2)** Aplicar a **Opção 1** (normalizar status no código) nos arquivos server-fly.js e processPendingWithdrawals.js, mapeando aguardando_confirmacao → processando, processado → concluido, falhou → cancelado, e incluir correlation_id nas respostas 500 do fluxo de saque. **(3)** Fazer deploy do backend em staging/preview, executar o plano de teste (smoke tests) e só então promover para produção, sem alterar o deploy estável FyKKeg6zb do player.
