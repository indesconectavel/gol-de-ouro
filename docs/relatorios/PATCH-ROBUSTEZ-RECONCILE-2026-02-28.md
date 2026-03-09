# Patch robustez reconcileProcessingWithdrawals – 2026-02-28

## Resumo

- **Arquivo alterado:** `src/domain/payout/reconcileProcessingWithdrawals.js`
- **processPendingWithdrawals.js:** não alterado (`updateSaqueStatus` já exportado).

## Diff unificado (unified)

```diff
--- a/src/domain/payout/reconcileProcessingWithdrawals.js
+++ b/src/domain/payout/reconcileProcessingWithdrawals.js
@@ -52,6 +52,11 @@ async function reconcileProcessingWithdrawals({
   if (!isDbConnected || !supabase) {
     console.warn('⚠️ [RECONCILE] Supabase indisponível');
     return { success: false, processed: 0, error: 'Supabase indisponível' };
   }
+
+  if (typeof updateSaqueStatus !== 'function') {
+    console.error('❌ [RECONCILE] updateSaqueStatus indisponível');
+    return { success: false, processed: 0, error: 'updateSaqueStatus indisponível' };
+  }
 
   const sinceIso = new Date(Date.now() - RECONCILE_AGE_MINUTES * 60 * 1000).toISOString();
@@ -76,12 +81,14 @@ async function reconcileProcessingWithdrawals({
   console.log('🟦 [RECONCILE] Início', { total: rows.length, status_anterior: PROCESSING });
 
   let processed = 0;
+  const validPixTypes = ['cpf', 'cnpj', 'email', 'phone', 'random', 'evp'];
 
   for (const saque of rows) {
     const saqueId = saque.id;
     const userId = saque.usuario_id;
     const correlationId = saque.correlation_id;
-    const transacaoId = saque.transacao_id ? String(saque.transacao_id).trim() : null;
+
+    try {
+      const transacaoId = saque.transacao_id ? String(saque.transacao_id).trim() : null;
     const created_at = saque.created_at;
     const isTimeout = created_at && new Date(created_at) < new Date(timeoutIso);
 
     if (isTimeout) {
@@ -148,17 +155,42 @@ async function reconcileProcessingWithdrawals({
     if (!correlationId) {
       console.warn('⚠️ [RECONCILE] Sem transacao_id e sem correlation_id, pulando', { saqueId, userId });
       continue;
     }
 
     const netAmount = parseFloat(saque.net_amount ?? (parseFloat(saque.amount ?? saque.valor ?? 0) - parseFloat(saque.fee ?? 0)));
+    if (!Number.isFinite(netAmount) || netAmount <= 0) {
+      const updateResult = await updateSaqueStatus({
+        supabase, saqueId, userId, newStatus: REJECTED,
+        motivo_rejeicao: 'valor_invalido_reconcile', onlyWhenStatus: PROCESSING
+      });
+      if (updateResult.success) { console.warn('⚠️ [RECONCILE] Valor inválido, rejeitado', { saqueId, userId, correlationId, netAmount, status_novo: REJECTED }); processed++; }
+      continue;
+    }
+
+    const pixKeyRaw = saque.pix_key ?? saque.chave_pix;
+    const pixKey = typeof pixKeyRaw === 'string' ? pixKeyRaw.trim() : '';
+    const pixType = ((saque.pix_type ?? saque.tipo_chave) || 'cpf').toLowerCase().trim();
+    if (!pixKey || !pixType || !validPixTypes.includes(pixType)) {
+      const updateResult = await updateSaqueStatus({
+        supabase, saqueId, userId, newStatus: REJECTED,
+        motivo_rejeicao: 'pix_invalido_reconcile', onlyWhenStatus: PROCESSING
+      });
+      if (updateResult.success) { console.warn('⚠️ [RECONCILE] PIX inválido, rejeitado', { saqueId, userId, correlationId, status_novo: REJECTED }); processed++; }
+      continue;
+    }
+
+    let payoutResult;
+    try {
+      payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId);
+    } catch (err) {
+      console.error('❌ [RECONCILE] createPixWithdraw lançou exceção', { saqueId, userId, correlationId, error: err?.message });
+      const updateResult = await updateSaqueStatus({
+        supabase, saqueId, userId, newStatus: REJECTED, motivo_rejeicao: 'erro_provedor_reconcile', onlyWhenStatus: PROCESSING
+      });
+      if (updateResult.success) { processed++; }
+      continue;
+    }
-    const pixKey = saque.pix_key ?? saque.chave_pix;
-    const pixType = (saque.pix_type ?? saque.tipo_chave || 'cpf').toLowerCase();
-    if (!pixKey || !pixType) {
-      console.warn('⚠️ [RECONCILE] Sem chave PIX, pulando', { saqueId, userId, correlationId });
-      continue;
-    }
-
-    const payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId);
 
     if (payoutResult?.success === true) {
       ...
@@ -190,20 +222,26 @@ async function reconcileProcessingWithdrawals({
     const rawErr = payoutResult?.error;
     const errMsg = (typeof rawErr === 'string' ? rawErr : (rawErr && rawErr.message ? rawErr.message : '')).toLowerCase();
     const is409 = errMsg.includes('409') || errMsg.includes('duplicate') || errMsg.includes('idempotent');
     if (is409) {
-      const now = new Date().toISOString();
-      const txIdFromResponse = payoutResult?.data?.id ? String(payoutResult.data.id) : null;
-      const updateResult = await updateSaqueStatus({
-        supabase, saqueId, userId, newStatus: COMPLETED, processed_at: now, transacao_id: txIdFromResponse, onlyWhenStatus: PROCESSING
-      });
-      if (updateResult.success) {
-        console.log('✅ [RECONCILE] Idempotência 409 tratada como sucesso', { ... });
-        processed++;
-      }
+      const txIdFromResponse = payoutResult?.data?.id ? String(payoutResult.data.id) : null;
+      if (txIdFromResponse) {
+        const now = new Date().toISOString();
+        const updateResult = await updateSaqueStatus({ ... });
+        if (updateResult.success) { ... processed++; }
+      } else {
+        console.warn('⚠️ [RECONCILE] precisa_revisao_409_sem_transacao_id', { saqueId, userId, correlationId, status_anterior: PROCESSING });
+      }
     }
+    } catch (err) {
+      console.error('❌ [RECONCILE] Erro ao processar saque', { saqueId, userId, correlationId, error: err?.message });
+      continue;
+    }
   }
```

## Alterações aplicadas

1. **updateSaqueStatus:** validação no início; se não for função, log + `return { success: false, processed: 0, error: 'updateSaqueStatus indisponível' }`.
2. **Ciclo à prova de falha:** corpo do `for (const saque of rows)` dentro de `try/catch`; no catch, log com `saqueId`, `userId`, `correlationId` e `continue`.
3. **Validação antes de createPixWithdraw:**
   - `netAmount`: se `!Number.isFinite(netAmount) || netAmount <= 0` → REJECTED `valor_invalido_reconcile`, log, processed++, continue.
   - PIX: `pixKey` (trim) e `pixType` em lista `validPixTypes`; se inválido → REJECTED `pix_invalido_reconcile`, log, processed++, continue.
4. **createPixWithdraw à prova de throw:** chamada em `try/catch`; em exceção → log, REJECTED `erro_provedor_reconcile`, processed++ (se update ok), continue.
5. **409/duplicate:** COMPLETED só se `payoutResult.data.id` existir; senão log `precisa_revisao_409_sem_transacao_id` e não atualiza status (permanece PROCESSING).

## Arquivo final completo

O arquivo final está em: **`src/domain/payout/reconcileProcessingWithdrawals.js`** (303 linhas). Não foi alterado `processPendingWithdrawals.js` (export de `updateSaqueStatus` já existia).
