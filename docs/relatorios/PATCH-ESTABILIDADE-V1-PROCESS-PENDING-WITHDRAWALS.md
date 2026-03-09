# Patch mínimo estabilidade V1 – processPendingWithdrawals.js

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Objetivo:** Impedir duplicidade e saque preso em "processando". CHECK do banco: pendente, processando, concluido, rejeitado, cancelado.

---

## A) Diff unified completo

*(Diff em relação ao estado anterior do arquivo no repositório.)*

```diff
--- a/src/domain/payout/processPendingWithdrawals.js
+++ b/src/domain/payout/processPendingWithdrawals.js
@@ -44,9 +46,32 @@
  */
 const updateSaqueStatus = async ({ supabase, saqueId, userId, newStatus, motivo_rejeicao = null, processed_at = null, transacao_id = null, onlyWhenStatus = null }) => {
   const payload = { status: newStatus };
   ...
-  const { data, error } = await query.select('id').maybeSingle();
+  const runUpdate = () => { ... };
+  let result = await runUpdate();
+  let { data, error } = result;
+  if (error && (newStatus === COMPLETED || newStatus === REJECTED)) {
+    const delayMs = (ms) => new Promise((r) => setTimeout(r, ms));
+    for (let attempt = 1; attempt <= 2; attempt++) {
+      await delayMs(100 + Math.min(100, attempt * 50));
+      result = await runUpdate();
+      ...
+      if (!error) break;
+    }
+  }
   if (error) {
     ...
-    if (newStatus === PROCESSING) { return { success: false, error }; }
-    const { error: revertError } = await supabase.from('saques').update(...).eq('id', saqueId);
+    if (newStatus === PROCESSING) { return { success: false, error }; }
+    if (newStatus === COMPLETED || newStatus === REJECTED) { return { success: false, error }; }
+    const { error: revertError } = await supabase.from('saques').update(...).eq('id', saqueId).eq('status', PROCESSING);
     ...
   }
 };
@@ -82,6 +107,16 @@
 const rollbackWithdraw = async (...) => {
+  const markRejected = async (motivoRejeicao) => {
+    return await updateSaqueStatus({ ..., newStatus: REJECTED, motivo_rejeicao: ..., onlyWhenStatus: PROCESSING });
+  };
   try {
     ...
     if (userError || !userRow) {
-      return { success: false, error: userError };
+      const markResult = await markRejected(`rollback_saldo_falhou: ${...}`);
+      ...
+      return { success: false, error: userError };
     }
     const saldoReconstituido = ...;
-    const { error: saldoError } = await supabase.from('usuarios').update(...).eq('id', userId);
+    const { data: saldoUpdateData, error: saldoError } = await supabase.from('usuarios').update(...).eq('id', userId).eq('saldo', userRow.saldo).select('id').maybeSingle();
     if (saldoError) {
+      const markResult = await markRejected(`rollback_saldo_falhou: ${...}`);
+      ...
       return { success: false, error: saldoError };
     }
+    if (!saldoUpdateData) {
+      const markResult = await markRejected('rollback_saldo_concorrencia');
+      ...
+      return { success: false, error: { message: 'rollback_saldo_concorrencia' } };
+    }
     ...
-    const updateResult = await updateSaqueStatus({ ..., newStatus: REJECTED, motivo_rejeicao: motivoCurto });
+    const updateResult = await markRejected(motivoCurto);
     ...
   }
 };
```

Resumo das alterações aplicadas:

1. **updateSaqueStatus:** Não reverte para PENDING quando `newStatus` é COMPLETED ou REJECTED. Para COMPLETED/REJECTED em falha: retry 2x com delay 100–200 ms; depois apenas retorna `{ success: false }`. Revert para PENDING só para outros status e apenas se status atual for PROCESSING (`.eq('status', PROCESSING)`).
2. **rollbackWithdraw:** Helper `markRejected` usa `onlyWhenStatus: PROCESSING`. Em erro ao buscar usuário ou ao atualizar saldo: chama `markRejected('rollback_saldo_falhou: ...')` e retorna erro. Update de saldo com `.eq('saldo', userRow.saldo)` e `.select('id').maybeSingle()`; se `!saldoUpdateData` (concorrência), chama `markRejected('rollback_saldo_concorrencia')` e retorna.
3. **Logs:** Incluem saqueId, userId, correlationId, status_anterior/status_novo onde aplicável.

---

## B) Arquivo final completo

O arquivo final está em **`src/domain/payout/processPendingWithdrawals.js`** (377 linhas). O repositório é a fonte canônica. Principais trechos:

- **Linhas 1–100:** `createLedgerEntry`, `updateSaqueStatus` (retry para COMPLETED/REJECTED, revert condicional com `.eq('status', PROCESSING)`).
- **Linhas 101–196:** `rollbackWithdraw` com `markRejected(onlyWhenStatus: PROCESSING)`, tratamento de userError/saldoError/saldoUpdateData e update de saldo com `.eq('saldo', userRow.saldo)`.
- **Linhas 198–413:** `processPendingWithdrawals` com locked*, lock via `updateSaqueStatus`, sucesso → COMPLETED + processed_at + transacao_id, falha → rollbackWithdraw, catch → rollbackWithdraw com motivo.
- **Linhas 415–421:** `module.exports`.

---

## C) Checklist de testes rápidos (máx. 6 passos)

1. **Lock e idempotência**  
   Garantir que dois ciclos simultâneos não processem o mesmo saque: criar 1 saque pendente, disparar o worker 2x em paralelo (ou 2 instâncias); apenas 1 deve marcar como processando e concluir ou rejeitar; o outro deve retornar `duplicate: true` e o saque não pode ser pago duas vezes.

2. **Falha ao marcar COMPLETED (sem revert)**  
   Simular falha no update para concluído (ex.: timeout/erro do Supabase após `createPixWithdraw` retornar success): o código não deve reverter para pendente; deve logar "Falha ao marcar concluído (sem revert)" com saqueId, userId, correlationId e retornar `success: false`. Conferir no banco que o saque não volta para pendente (pode ficar em processando até correção manual ou webhook).

3. **Rollback com erro ao buscar usuário**  
   Simular `userError` em rollbackWithdraw (ex.: usuário inexistente ou Supabase indisponível): deve chamar `markRejected('rollback_saldo_falhou: ...')` e retornar erro. Conferir no banco que o saque em processando foi marcado como rejeitado com motivo_rejeicao prefixado "rollback_saldo_falhou".

4. **Rollback com concorrência de saldo**  
   Simular update de saldo com 0 linhas afetadas (outro processo alterou o saldo antes): deve chamar `markRejected('rollback_saldo_concorrencia')` e retornar erro. Conferir que o saque foi marcado rejeitado e que o saldo não foi incorretamente sobrescrito.

5. **Revert para PENDING só se PROCESSING**  
   Simular falha de update para um status “outro” (fora de PROCESSING/COMPLETED/REJECTED) com o saque já em outro status (ex.: concluído por webhook): o revert para PENDING deve usar `.eq('status', PROCESSING)` e não deve alterar o registro já concluído (0 rows updated).

6. **Catch pós-lock**  
   Após lock adquirido, simular exceção (ex.: throw em createPixWithdraw ou rede): o catch deve chamar `rollbackWithdraw` com lockedSaqueId, lockedUserId, correlationId, amount, fee e motivo; o saque deve terminar em rejeitado com motivo_rejeicao. Logs devem incluir saqueId, userId, correlationId, status_novo: rejeitado.