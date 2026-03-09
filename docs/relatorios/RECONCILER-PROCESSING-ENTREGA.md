# Reconciler PROCESSING – Entrega

**Arquivo novo:** `src/domain/payout/reconcileProcessingWithdrawals.js`  
**Integração:** `src/workers/payout-worker.js`

---

## A) Diff unified

### Arquivo novo (reconcileProcessingWithdrawals.js)

```diff
diff --git a/src/domain/payout/reconcileProcessingWithdrawals.js b/src/domain/payout/reconcileProcessingWithdrawals.js
new file mode 100644
index 0000000..xxxxxxxx
--- /dev/null
+++ b/src/domain/payout/reconcileProcessingWithdrawals.js
@@ -0,0 +1,232 @@
+/**
+ * Reconciler mínimo: saques presos em PROCESSING.
+ * ... (conteúdo completo em B)
+ */
+const { PROCESSING, COMPLETED, REJECTED } = require('./withdrawalStatus');
+const { updateSaqueStatus } = require('./processPendingWithdrawals');
+...
+module.exports = {
+  reconcileProcessingWithdrawals,
+  getTransferStatusFromProvider,
+  RECONCILE_AGE_MINUTES,
+  RECONCILE_TIMEOUT_MINUTES,
+  RECONCILE_LIMIT
+};
```

### payout-worker.js

```diff
--- a/src/workers/payout-worker.js
+++ b/src/workers/payout-worker.js
@@ -2,6 +2,7 @@
 const { createPixWithdraw } = require('../../services/pix-mercado-pago');
 const { processPendingWithdrawals } = require('../domain/payout/processPendingWithdrawals');
+const { reconcileProcessingWithdrawals } = require('../domain/payout/reconcileProcessingWithdrawals');
@@ -14,6 +15,10 @@ const intervalMs = Math.max(
   parseInt(process.env.PAYOUT_WORKER_INTERVAL_MS || '30000', 10)
 );
+const reconcileIntervalMs = Math.max(
+  60 * 1000,
+  parseInt(process.env.PAYOUT_RECONCILE_INTERVAL_MS || '300000', 10)
+); // 5 min default
@@ -17,6 +22,7 @@ let running = false;
+let reconcileRunning = false;
@@ -96,5 +102,28 @@ async function runCycle() {
   }
 }
+
+async function runReconcileCycle() {
+  if (reconcileRunning) {
+    console.log('ℹ️ [RECONCILE] Ciclo anterior ainda em execução. Ignorando.');
+    return;
+  }
+  reconcileRunning = true;
+  try {
+    const payoutEnabled = String(process.env.PAYOUT_PIX_ENABLED || '').toLowerCase() === 'true';
+    const { error: pingError } = await supabase.from('saques').select('id').limit(1);
+    await reconcileProcessingWithdrawals({
+      supabase,
+      payoutEnabled,
+      isDbConnected: !pingError,
+      createPixWithdraw,
+      mercadoPagoClient: null
+    });
+  } catch (error) {
+    console.error('❌ [RECONCILE] Erro inesperado:', error);
+  } finally {
+    reconcileRunning = false;
+  }
+}
+
+console.log(`🕒 [PAYOUT][WORKER] Ativo. Intervalo ${intervalMs}ms; Reconciliação ${reconcileIntervalMs}ms`);
 runCycle();
 setInterval(runCycle, intervalMs);
+runReconcileCycle();
+setInterval(runReconcileCycle, reconcileIntervalMs);
```

---

## B) Arquivo novo completo

Ver: **`src/domain/payout/reconcileProcessingWithdrawals.js`** (232 linhas). Resumo:

- **Constantes:** RECONCILE_AGE_MINUTES = 10, RECONCILE_TIMEOUT_MINUTES = 30, RECONCILE_LIMIT = 10.
- **getTransferStatusFromProvider({ mercadoPagoClient, transacaoId }):** retorna null se o client não tiver `getTransfer`; senão chama e retorna o resultado (para log de precisa_revisao quando há transacao_id e client sem getTransfer).
- **reconcileProcessingWithdrawals({ supabase, payoutEnabled, isDbConnected, createPixWithdraw, mercadoPagoClient = null }):**
  - Early return se !payoutEnabled ou !supabase.
  - SELECT saques com status PROCESSING e created_at < now - 10 min, limit 10.
  - Para cada saque:
    - Se created_at < now - 30 min → update REJECTED com motivo_rejeicao "timeout_reconciliacao" (onlyWhenStatus: PROCESSING).
    - Se tem transacao_id → getTransferStatusFromProvider; se null → log "precisa_revisao" e pula; se status completed/credited → update COMPLETED com processed_at e transacao_id (onlyWhenStatus: PROCESSING).
    - Se não tem transacao_id e tem correlation_id → createPixWithdraw; se success → update COMPLETED; se erro 409/duplicate/idempotent → update COMPLETED com processed_at (transacao_id do response se houver).
  - Logs com saqueId, userId, correlationId, status_anterior, status_novo.
  - Retorno: { success: true, processed } ou { success: false, processed: 0, error }.
- **Export:** reconcileProcessingWithdrawals, getTransferStatusFromProvider, RECONCILE_AGE_MINUTES, RECONCILE_TIMEOUT_MINUTES, RECONCILE_LIMIT.

---

## C) Pontos para integrar no payout-worker (setInterval separado, ex.: a cada 5 min)

1. **Require do reconciler**  
   No topo do worker:  
   `const { reconcileProcessingWithdrawals } = require('../domain/payout/reconcileProcessingWithdrawals');`

2. **Intervalo de reconciliação**  
   Definir variável (ex.: a cada 5 min):  
   `const reconcileIntervalMs = Math.max(60 * 1000, parseInt(process.env.PAYOUT_RECONCILE_INTERVAL_MS || '300000', 10));`  
   (300000 ms = 5 min; mínimo 1 min.)

3. **Flag de corrida**  
   Evitar sobreposição de ciclos de reconciliação:  
   `let reconcileRunning = false;`

4. **Função runReconcileCycle**  
   - Se reconcileRunning === true → log "Ciclo anterior ainda em execução" e return.  
   - reconcileRunning = true.  
   - try: obter payoutEnabled e ping do Supabase; chamar reconcileProcessingWithdrawals({ supabase, payoutEnabled, isDbConnected: !pingError, createPixWithdraw, mercadoPagoClient: null }).  
   - catch: log do erro.  
   - finally: reconcileRunning = false.

5. **Início e agendamento**  
   - Rodar um ciclo de reconciliação na subida: `runReconcileCycle();`  
   - Agendar a cada reconcileIntervalMs: `setInterval(runReconcileCycle, reconcileIntervalMs);`  
   Manter o ciclo principal de processPendingWithdrawals inalterado (runCycle + setInterval(runCycle, intervalMs)).

6. **Variável de ambiente (opcional)**  
   `PAYOUT_RECONCILE_INTERVAL_MS` (default 300000 = 5 min).  
   Não é obrigatório; o worker funciona com o default.

**Resumo:** O worker fica com dois setIntervals independentes: um para processPendingWithdrawals (intervalMs) e outro para reconcileProcessingWithdrawals (reconcileIntervalMs, ex.: 5 min).
