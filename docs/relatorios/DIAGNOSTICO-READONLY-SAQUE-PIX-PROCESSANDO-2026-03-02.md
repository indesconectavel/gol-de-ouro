# Diagnóstico READ-ONLY — Saques PIX “processando” com processed_at IS NULL

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto. Nenhuma alteração de código, banco, deploy ou infra.  
**Objetivo:** Coletar evidências para diagnosticar por que existem registros em `public.saques` com `status='processando'` e `processed_at IS NULL`.

---

## A) COLETA DE EVIDÊNCIAS NO CÓDIGO

### A1) Fluxo de saque — localização e trechos

| O que | Arquivo:linhas | Trecho / resumo |
|-------|----------------|------------------|
| **Rota POST saque** | server-fly.js:L1394 | `app.post('/api/withdraw/request', authenticateToken, async (req, res) => {` |
| **INSERT em saques** | server-fly.js:L1546-L1566 | `.from('saques').insert({ usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status: 'pendente', created_at })` — **não envia** `processed_at` nem `transacao_id`. |
| **Mudança de status (worker)** | processPendingWithdrawals.js:L189-L195 | `UPDATE status = 'processando'` (lock); L209-L212 `UPDATE status = 'aguardando_confirmacao'` (após PIX ok). |
| **Mudança de status (rollback)** | processPendingWithdrawals.js:L89-L92 | `UPDATE status = 'falhou'`. |
| **Mudança de status (webhook)** | server-fly.js:L2240, L2253 | `UPDATE status = 'processado'` (aprovado); `UPDATE status = 'aguardando_confirmacao'` (in_process). |
| **processed_at** | **Não encontrado** | Nenhum arquivo do backend faz `UPDATE saques SET processed_at = ...`. A coluna **nunca é preenchida** pelo código. |
| **transacao_id** | **Não encontrado** | Nenhum arquivo faz `UPDATE saques SET transacao_id = ...` ou inclui `transacao_id` no INSERT. Permanece NULL pelo código. |
| **correlation_id** | server-fly.js:L1398-L1402 | Gerado por header `x-idempotency-key` ou `x-correlation-id` ou `crypto.randomUUID()`. Inserido em saques (L1555); usado no worker e no webhook para idempotência. |

**Resumo do fluxo (código):**  
Request → INSERT com status `pendente` (sem processed_at/transacao_id). Worker SELECT onde status IN ('pendente','pending') → UPDATE status `processando` → createPixWithdraw (MP) → UPDATE status `aguardando_confirmacao` (ou rollback → `falhou`). Webhook atualiza para `processado` ou `aguardando_confirmacao`. Em nenhum ponto o código escreve `processed_at` ou `transacao_id`.

---

### A2) Motor do worker (job loop)

| Aspecto | Evidência |
|---------|-----------|
| **Função principal** | `processPendingWithdrawals` em src/domain/payout/processPendingWithdrawals.js:L101-L268. |
| **SELECT em saques** | L131-L136: `.from('saques').select('id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at').in('status', ['pendente', 'pending']).order('created_at', { ascending: true }).limit(1)`. **Não filtra por processed_at**; não usa `FOR UPDATE SKIP LOCKED`. |
| **Lock** | Lock “otimista”: UPDATE `status = 'processando'` com `.in('status', ['pendente', 'pending'])` (L189-L195). Quem conseguir a atualização “ganha”; se lockError ou !locked, trata como duplicata e retorna (L196-L203). Não usa advisory lock nem SKIP LOCKED. |
| **Retry/backoff** | Não há retry explícito no módulo; o ciclo é repetido pelo setInterval no payout-worker.js (intervalo PAYOUT_WORKER_INTERVAL_MS, default 30000 ms). Não há critério de “abandonar” além do ciclo atual. |
| **Env flag** | `PAYOUT_PIX_ENABLED` (processPendingWithdrawals.js:L109, L122; payout-worker.js:L63). Se não for `'true'`, retorna sem processar. |
| **Logs “início/fim do ciclo”** | processPendingWithdrawals.js:L108 — `console.log('🟦 [PAYOUT][WORKER] Início do ciclo')`. payout-worker.js:L61 — `🟦 [PAYOUT][WORKER] Início do ciclo`; L93 — `🟦 [PAYOUT][WORKER] Fim do ciclo`. |

**Resumo do algoritmo:** Busca 1 saque com status pendente/pending, ordenado por created_at. Tenta “lock” com UPDATE para processando. Se falhar, considera duplicata. Chama createPixWithdraw; se sucesso, tenta UPDATE para aguardando_confirmacao; se esse UPDATE falhar (ex.: CHECK no banco), loga `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` e retorna. Se createPixWithdraw falhar, chama rollbackWithdraw (UPDATE status = 'falhou'). Nenhum passo preenche processed_at.

---

### A3) Inicialização do worker no runtime

| Aspecto | Evidência |
|---------|-----------|
| **server-fly.js** | Define `runProcessPendingWithdrawals` (L121-L129) e exporta (L3164). **Não** chama setInterval para runProcessPendingWithdrawals. Apenas inicia HTTP em startServer (L2549-L3156). |
| **Processo “app”** | package.json L7: `"start": "node server-fly.js"`. fly.toml L13: `app = "npm start"`. Dockerfile CMD: `["node", "server-fly.js"]`. Ou seja: o processo “app” **só** roda o servidor HTTP; **não** roda o loop do worker. |
| **Processo “worker”** | fly.toml L14: `payout_worker = "node src/workers/payout-worker.js"`. O worker é um **processo separado** (process group no Fly). |
| **Comando que inicia o worker** | `node src/workers/payout-worker.js` (quando Fly inicia o process group `payout_worker`). |
| **Condicional no worker** | payout-worker.js:L6-L9: se `ENABLE_PIX_PAYOUT_WORKER !== 'true'`, faz `process.exit(0)`. L21-L24: se faltar SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY, process.exit(1). L26-L29: se faltar MERCADOPAGO_PAYOUT_ACCESS_TOKEN, process.exit(1). |
| **NODE_ENV / FLY_PROCESS_GROUP** | Código não verifica FLY_PROCESS_GROUP. NODE_ENV não é checado no worker; fly.toml define NODE_ENV=production para o app. |

**Conclusão:** O worker **só** roda se o Fly tiver máquina(s) para o process group `payout_worker`. O app (server-fly.js) **não** executa o ciclo de payout; apenas o script `src/workers/payout-worker.js` faz o setInterval(runCycle, intervalMs).

---

## B) INFRA / FLY (READ-ONLY)

**Comando tentado:** `fly version` (PowerShell não aceitou `&&`/`||`).  
**Resultado:** Fly CLI considerado **indisponível** neste ambiente para execução de comandos. Não foi possível rodar `fly status`, `fly scale show`, `fly machines list` nem `fly logs`.

**Recomendação (manual):** Rodar no seu ambiente:
- `fly status` / `fly scale show` — confirmar se existe process group `payout_worker` e quantas máquinas.
- `fly machines list` — listar máquinas e processo (app vs payout_worker).
- `fly logs -n 200` — logs gerais; filtrar por `[PAYOUT][WORKER]` ou `Falha ao mover para aguardando_confirmacao` para confirmar se o worker está rodando e se o UPDATE para aguardando_confirmacao falha.

---

## C) SUPABASE / BANCO (READ-ONLY)

### C1) Introspecção da tabela saques

**Queries SELECT (para você rodar manualmente no Supabase):**

```sql
-- Colunas e tipos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques'
ORDER BY ordinal_position;

-- Índices
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'saques';

-- Constraints e FKs
SELECT c.conname, c.contype, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'saques';

-- Triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'saques';

-- Policies RLS
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saques';
```

**Do repositório (schema consolidado):** SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql L92-L103 define saques **sem** colunas `processed_at` nem `transacao_id`. Se em PROD essas colunas existem, vêm de migration posterior. O código **nunca** as preenche.

---

### C2) Auditoria dos saques “travados”

**SELECTs sugeridos (somente leitura):**

```sql
-- Saques processando com processed_at NULL
SELECT id, usuario_id, amount, fee, net_amount,
       LEFT(pix_key::text, 4) || '***' || RIGHT(pix_key::text, 4) AS pix_key_masked,
       pix_type, correlation_id, transacao_id, status, motivo_rejeicao,
       created_at, updated_at, processed_at
FROM public.saques
WHERE status = 'processando' AND processed_at IS NULL
ORDER BY created_at;

-- Saques pendente antigos (nunca viraram processando)
SELECT id, usuario_id, status, created_at
FROM public.saques
WHERE status IN ('pendente', 'pending')
ORDER BY created_at
LIMIT 20;

-- Duplicidade de correlation_id
SELECT correlation_id, COUNT(*) AS cnt
FROM public.saques
WHERE correlation_id IS NOT NULL
GROUP BY correlation_id
HAVING COUNT(*) > 1;
```

**Interpretação objetiva:** Se existem linhas com status='processando' e processed_at IS NULL, o worker conseguiu fazer o UPDATE para `processando` (L191). O código **nunca** seta processed_at; portanto processed_at NULL é esperado. O “travamento” é: o registro ficou em `processando` e **não** foi atualizado para o próximo estado (aguardando_confirmacao ou falhou). As causas mais prováveis no código são: (1) o segundo UPDATE (para aguardando_confirmacao) falhou (ex.: CHECK em PROD não permite esse valor); (2) createPixWithdraw falhou e o rollback tentou UPDATE status = 'falhou', que também pode falhar por CHECK; (3) o worker não está rodando em seguida (sem máquina payout_worker ou env desativado).

---

### C3) Permissão de UPDATE do worker

| Pergunta | Evidência |
|----------|-----------|
| **Qual cliente Supabase o backend usa?** | database/supabase-unified-config.js L48-L57: `supabaseAdmin = createClient(url, serviceRoleKey, ...)`. server-fly.js L118: `let supabase = supabaseAdmin`. O worker standalone usa payout-worker.js L31: `createClient(supabaseUrl, supabaseServiceRoleKey, ...)`. Ou seja: **service role** em ambos. |
| **RLS em saques** | Se RLS estiver ativo, políticas que permitem UPDATE apenas com auth.uid() = usuario_id podem bloquear o service role dependendo da configuração. No Supabase, **service role** normalmente **bypassa RLS**. Evidência no código: uso consistente de service role; não há JWT de usuário no worker. |
| **Variáveis de ambiente** | required-env.js (server-fly) exige JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. payout-worker.js exige SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MERCADOPAGO_PAYOUT_ACCESS_TOKEN e ENABLE_PIX_PAYOUT_WORKER=true. Não exponho valores; no código as chaves estão referenciadas (process.env.SUPABASE_SERVICE_ROLE_KEY etc.). |

**Conclusão:** O worker usa **SUPABASE_SERVICE_ROLE_KEY** (supabase-js). Em configuração padrão do Supabase, service role ignora RLS. Se em PROD alguma policy ou trigger bloquear UPDATE, a evidência seria mensagem de erro nos logs do worker (ex.: "permission denied" ou "violates check constraint").

---

## D) LOGS DE APLICAÇÃO (READ-ONLY)

**Mensagens relevantes e onde são emitidas:**

| Mensagem / padrão | Arquivo:linha |
|-------------------|----------------|
| `🔄 [SAQUE] Início` | server-fly.js:L1404 |
| `❌ [SAQUE] Erro ao criar saque:` | server-fly.js:L1570 (saqueError) |
| `❌ [SAQUE][WORKER] Erro ao listar saques pendentes:` | processPendingWithdrawals.js:L141 |
| `🟦 [PAYOUT][WORKER] Início do ciclo` | processPendingWithdrawals.js:L108; payout-worker.js:L61 |
| `🟦 [PAYOUT][WORKER] Fim do ciclo` | payout-worker.js:L93 |
| `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` | processPendingWithdrawals.js:L215 (awaitingError) |
| `❌ [PAYOUT][FALHOU] rollback acionado` | processPendingWithdrawals.js:L249 |
| `✅ [PAYOUT][CONFIRMADO]` | server-fly.js:L2242 (webhook) |
| `⚠️ [PAYOUT][EM_PROCESSAMENTO]` | server-fly.js:L2254 (webhook); processPendingWithdrawals.js:L223 |

**Erros a procurar nos logs:** 401/403 (RLS), 400/422 (payload), timeouts do axios (createPixWithdraw), “violates check constraint”, “permission denied”, “duplicate key”. O log `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` indica que o UPDATE para aguardando_confirmacao falhou (candidato forte a CHECK de status em PROD).

---

## E) CHECKLIST DE HIPÓTESES (com evidência)

| Hipótese | Evidência coletada |
|----------|--------------------|
| **1. Worker existe, mas NÃO está rodando (infra)** | fly.toml define `payout_worker = "node src/workers/payout-worker.js"` (L14). Se não houver máquina para esse process group, o worker não roda. Dockerfile CMD só inicia server-fly.js; app e worker são processos distintos. Fly CLI não foi executado — confirmar com `fly scale show` / `fly machines list`. |
| **2. Worker roda, mas NÃO encontra registros (query/filters)** | SELECT filtra por `.in('status', ['pendente', 'pending'])` (processPendingWithdrawals.js:L134). Se todos os registros já estiverem em processando/outros, o worker não encontra nada e loga "Nenhum saque pendente". Para haver status='processando', o worker **já** encontrou e atualizou ao menos uma vez. |
| **3. Worker roda e encontra, mas NÃO consegue dar UPDATE (RLS/perm)** | Worker usa service role (payout-worker.js L31). Service role costuma bypassar RLS. Evidência contrária seria log de erro do Supabase (ex.: permission denied) no UPDATE. |
| **4. Worker roda e atualiza status, mas falha ao criar transação/MP e deixa “processando”** | Fluxo: UPDATE processando (L191) → createPixWithdraw (L206). Se createPixWithdraw falhar, o código chama rollbackWithdraw (L246), que tenta UPDATE status = 'falhou' (L91). Se esse UPDATE falhar (ex.: CHECK em PROD não permite 'falhou'), o registro permanece em processando. processPendingWithdrawals.js:L215: se o UPDATE para aguardando_confirmacao falhar, loga `Falha ao mover para aguardando_confirmacao` e retorna sem atualizar processed_at (que nunca é setado). |
| **5. Worker roda, cria transação, mas não seta processed_at (bug lógico)** | **Confirmado:** não existe em todo o repositório nenhum `processed_at` nem `transacao_id` sendo escrito em saques. Não é bug de “esquecer” um UPDATE; a coluna **não é usada** pelo código. processed_at IS NULL é esperado. |
| **6. Status “processando” é escrito por outro lugar (bug no endpoint)** | O único lugar que grava `processando` é processPendingWithdrawals.js L191 (worker). O endpoint POST /api/withdraw/request só faz INSERT com status 'pendente' (server-fly.js L1562). Não há outro ponto que escreva processando. |

---

## F) SAÍDA FINAL

### 1) Estado do worker

- **Existe?** Sim. Implementado em `src/domain/payout/processPendingWithdrawals.js` e invocado por `src/workers/payout-worker.js`. Definido no Fly como process group `payout_worker` (fly.toml L14).
- **Roda?** Só se o Fly tiver máquina(s) para `payout_worker` e as env ENABLE_PIX_PAYOUT_WORKER=true, PAYOUT_PIX_ENABLED=true, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e MERCADOPAGO_PAYOUT_ACCESS_TOKEN estiverem setadas. Não foi possível confirmar no ambiente (Fly CLI indisponível).
- **Logs?** Mensagens esperadas: `🟦 [PAYOUT][WORKER] Início do ciclo`, `🟦 [PAYOUT][WORKER] Fim do ciclo`, e, em caso de falha no segundo UPDATE, `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` (processPendingWithdrawals.js:L215).

---

### 2) Estado do banco

- **Schema:** O repositório (SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql) não define `processed_at` nem `transacao_id` em saques; em PROD essas colunas podem existir por migration. O código nunca as preenche.
- **RLS/triggers/índices:** Não foram consultados em PROD; as queries de C1 devem ser executadas manualmente para listar constraints (em especial CHECK de status), triggers e policies.
- **Saques “travados”:** Qualquer linha com status='processando' e processed_at IS NULL é coerente com o código: o worker setou processando e **nunca** seta processed_at; o passo seguinte (UPDATE para aguardando_confirmacao ou falhou) pode ter falhado (ex.: CHECK) ou o worker ter parado antes.

---

### 3) Fluxo no código (passo a passo)

1. **Criação:** POST /api/withdraw/request (server-fly.js L1394) → validação, débito de saldo, INSERT em saques com status `pendente`, correlation_id, sem processed_at/transacao_id.
2. **Processamento:** Processo `payout_worker` (node src/workers/payout-worker.js) em loop (setInterval) → processPendingWithdrawals → SELECT 1 saque com status IN ('pendente','pending') → UPDATE status = 'processando' → createPixWithdraw (Mercado Pago) → se sucesso, UPDATE status = 'aguardando_confirmacao'; se falha, rollbackWithdraw → UPDATE status = 'falhou'.
3. **Finalização:** Webhook Mercado Pago (server-fly.js) → UPDATE status = 'processado' ou 'aguardando_confirmacao' ou rollback com 'falhou'. Nenhum passo escreve processed_at nem transacao_id.

---

### 4) Diagnóstico provável (TOP 1)

**Causa mais provável:** O worker **consegue** dar UPDATE para `processando` (por isso existem registros nesse status). O **próximo** UPDATE (para `aguardando_confirmacao` ou, no rollback, para `falhou`) **falha** no banco — por exemplo porque o CHECK de status em PROD só permite (pendente | processando | concluido | rejeitado | cancelado) e **não** permite `aguardando_confirmacao` nem `falhou`. Quando esse UPDATE falha, o código loga `❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:` (processPendingWithdrawals.js:L215) e o registro permanece em `processando`. A coluna `processed_at` **nunca** é escrita pelo código, então processed_at IS NULL é esperado em todos os registros.

**Evidência:** (1) Único lugar que escreve `processando` é o worker (processPendingWithdrawals.js L191). (2) Em seguida o código tenta UPDATE para `aguardando_confirmacao` (L209-L212); em PROD esse valor não está no CHECK informado em auditorias anteriores. (3) processed_at e transacao_id não aparecem em nenhum INSERT/UPDATE em saques no repositório.

---

### 5) Próximos passos (ainda READ-ONLY)

1. **Confirmar no Supabase:** Rodar as queries de C1 e C2 e anotar o **CHECK exato** de status em `public.saques` e se há políticas RLS de UPDATE. Confirmar se existem linhas com status='processando' e processed_at IS NULL e há quantas.
2. **Confirmar no Fly:** Com Fly CLI, rodar `fly scale show` e `fly machines list` para o app goldeouro-backend-v2 e ver se existe pelo menos uma máquina no process group `payout_worker`. Rodar `fly logs -n 300` e buscar por `[PAYOUT][WORKER]` e `Falha ao mover para aguardando_confirmacao` para ver se o worker está ativo e se o erro de UPDATE aparece.
3. **Confirmar env do worker:** Se o worker rodar em processo separado, confirmar (sem expor valores) se no painel do Fly as variáveis ENABLE_PIX_PAYOUT_WORKER, PAYOUT_PIX_ENABLED, SUPABASE_SERVICE_ROLE_KEY e MERCADOPAGO_PAYOUT_ACCESS_TOKEN estão definidas para o process group `payout_worker` (ou para o app, se as máquinas do worker herdarem as mesmas env).

---

*Relatório gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco ou deploy.*
