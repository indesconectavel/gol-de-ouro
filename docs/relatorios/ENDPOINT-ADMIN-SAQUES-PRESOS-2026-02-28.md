# Endpoint admin GET /api/admin/saques-presos (read-only) – 2026-02-28

## Resumo

- **Path:** `GET /api/admin/saques-presos`
- **Auth:** mesmo mecanismo admin existente: header **`x-admin-token`** (middleware `authAdminToken` em `middlewares/authMiddleware.js`).
- **Comportamento:** apenas leitura em `public.saques`; lista saques presos em PROCESSING com `created_at` &lt; now − 10 min.

## Arquivos modificados / criados

| Arquivo | Ação |
|--------|------|
| `server-fly.js` | Adicionado require `authAdminToken` e handler GET `/api/admin/saques-presos`. |
| `routes/adminRoutes.js` | Adicionada rota GET `/saques-presos` com `authAdminToken` e `adminSaquesController.saquesPresos`. |
| `controllers/adminSaquesController.js` | **Novo.** Controller read-only com `saquesPresos(req, res)`. |

**Nota:** Em `server-fly.js` o endpoint está definido inline; o servidor atual **não** monta `adminRoutes`. Assim, a rota que responde em runtime é a de `server-fly.js`. A rota em `adminRoutes.js` fica disponível quando o router for montado em `app.use('/api/admin', adminRoutes)`.

## Diff unificado (trechos relevantes)

### server-fly.js

- Inclusão do require do middleware admin e da rota:

```diff
 } = require('./src/domain/payout/processPendingWithdrawals');
+const { PENDING, PROCESSING, COMPLETED, REJECTED, normalizeWithdrawStatus } = require('./src/domain/payout/withdrawalStatus');
+const { authAdminToken } = require('./middlewares/authMiddleware');
 // Logger opcional
```

- Novo endpoint (inserido após o bloco `app.post('/api/admin/bootstrap', ...)`):

```diff
 });

+// GET /api/admin/saques-presos - listar saques presos em PROCESSING (read-only, x-admin-token)
+const SAQUES_PRESOS_THRESHOLD_MINUTES = 10;
+const SAQUES_PRESOS_LIMIT = 50;
+app.get('/api/admin/saques-presos', authAdminToken, async (req, res) => {
+  try {
+    if (!dbConnected || !supabase) {
+      return res.status(503).json({ success: false, error: 'Supabase indisponível' });
+    }
+    const now = new Date();
+    const sinceIso = new Date(now.getTime() - SAQUES_PRESOS_THRESHOLD_MINUTES * 60 * 1000).toISOString();
+    const { data: rows, error: listError } = await supabase
+      .from('saques')
+      .select('id, usuario_id, amount, valor, fee, net_amount, correlation_id, transacao_id, created_at')
+      .eq('status', PROCESSING)
+      .lt('created_at', sinceIso)
+      .order('created_at', { ascending: true })
+      .limit(SAQUES_PRESOS_LIMIT);
+
+    if (listError) {
+      console.error('❌ [ADMIN-SAQUES-PRESOS] Erro na query:', listError.message);
+      return res.status(500).json({ success: false, error: 'Erro ao listar saques' });
+    }
+
+    const list = Array.isArray(rows) ? rows : [];
+    const buckets = { '10_30': 0, '30_60': 0, '60_plus': 0 };
+    const data = list.map((row) => {
+      const created = row.created_at ? new Date(row.created_at) : null;
+      const ageMinutes = created ? Math.floor((now.getTime() - created.getTime()) / 60000) : 0;
+      if (ageMinutes >= 10 && ageMinutes < 30) buckets['10_30']++;
+      else if (ageMinutes >= 30 && ageMinutes < 60) buckets['30_60']++;
+      else if (ageMinutes >= 60) buckets['60_plus']++;
+      return {
+        id: row.id,
+        usuario_id: row.usuario_id,
+        amount: row.amount != null ? Number(row.amount) : null,
+        valor: row.valor != null ? Number(row.valor) : null,
+        fee: row.fee != null ? Number(row.fee) : null,
+        net_amount: row.net_amount != null ? Number(row.net_amount) : null,
+        correlation_id: row.correlation_id ?? null,
+        transacao_id: row.transacao_id ?? null,
+        created_at: row.created_at ?? null,
+        age_minutes: ageMinutes
+      };
+    });
+
+    return res.json({
+      success: true,
+      meta: {
+        threshold_minutes: SAQUES_PRESOS_THRESHOLD_MINUTES,
+        now: now.toISOString(),
+        total: data.length,
+        buckets
+      },
+      data
+    });
+  } catch (err) {
+    console.error('❌ [ADMIN-SAQUES-PRESOS] Erro:', err?.message);
+    return res.status(500).json({ success: false, error: 'Erro interno' });
+  }
+});
+
 // Endpoint para verificar se sistema está em produção real
```

### routes/adminRoutes.js

```diff
 const exportController = require('../controllers/exportController');
+const adminSaquesController = require('../controllers/adminSaquesController');
 const { authAdminToken } = require('../middlewares/authMiddleware');
 
+// Saques presos em PROCESSING (read-only)
+router.get('/saques-presos', authAdminToken, adminSaquesController.saquesPresos);
+
 // Relatórios e estatísticas
```

### controllers/adminSaquesController.js (novo)

Arquivo completo está em `controllers/adminSaquesController.js`: usa `PROCESSING` de `withdrawalStatus`, `supabaseAdmin` de `database/supabase-unified-config`, threshold 10 min, limit 50, buckets 10_30 / 30_60 / 60_plus, resposta no formato pedido.

## Contrato da resposta

- **200:** `{ success: true, meta: { threshold_minutes: 10, now: "<iso>", total: N, buckets: { "10_30", "30_60", "60_plus" } }, data: [ { id, usuario_id, amount, valor, fee, net_amount, correlation_id, transacao_id, created_at, age_minutes }, ... ] }`
- **401:** sem `x-admin-token`.
- **403:** token inválido.
- **503:** Supabase indisponível (`!dbConnected || !supabase`).
- **500:** erro na query ou exceção; mensagem curta no JSON; detalhe apenas em log (sem dados sensíveis).

## Hardening

- Não são selecionados nem retornados `pix_key` / `pix_type` (nem outros dados sensíveis).
- Erro de query: log com `listError.message`; resposta 500 com mensagem genérica.
- Buckets: `10_30` (10 ≤ age &lt; 30 min), `30_60` (30 ≤ age &lt; 60), `60_plus` (age ≥ 60).

## Lógica de saque/worker

Nenhuma alteração em fluxo de saque, worker ou reconciler; apenas leitura e exposição via endpoint admin.
