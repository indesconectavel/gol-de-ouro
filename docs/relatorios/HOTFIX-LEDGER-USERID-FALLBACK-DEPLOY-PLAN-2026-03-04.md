# Hotfix ledger user_id/usuario_id fallback — Plano de deploy e evidências

**Data:** 2026-03-04  
**Branch:** hotfix/ledger-userid-fallback  
**Commit:** a4b2e5495d1919fe8383f247122c2e0803e3712d  
**Arquivo alterado:** somente `src/domain/payout/processPendingWithdrawals.js`

---

## FASE 0 — Safe precheck (read-only)

### Branch e status antes do hotfix

- **Branch atual (antes da criação da hotfix):** chore/hotfix-versionwarning-spam-safe  
- **Status:** Vários arquivos modificados (incl. processPendingWithdrawals.js); untracked em docs/relatorios e outros.

### Confirmação de que o patch NÃO estava em commits

- `git log -S "ledgerUserIdColumn" --oneline --all` → **nenhum commit** (confirmado na auditoria anterior).  
- `git log -S "insertLedgerRow" --oneline --all` → **nenhum commit**.  
- `git log --all --oneline -- "**/processPendingWithdrawals.js"` → **apenas 3624a19** (release: payout worker + correção supabase ping 1.2.1). O conteúdo em 3624a19 e em main **não** contém ledgerUserIdColumn nem insertLedgerRow.

**Registro:** O patch existia apenas em working tree; nenhum commit no repositório o continha antes deste hotfix.

---

## FASE 1 — Implementação

- Branch criada: `git checkout -b hotfix/ledger-userid-fallback origin/main`  
- Editado **apenas** `src/domain/payout/processPendingWithdrawals.js`:
  - Cache em escopo de módulo: `let ledgerUserIdColumn = null;`
  - Função `insertLedgerRow(supabase, payloadBase, usuarioId)` com tentativa `user_id`, fallback `usuario_id`, cache e logs airbag (message limitada a 80 chars; sem dados sensíveis).
  - `createLedgerEntry` passou a montar `payloadBase` e chamar `insertLedgerRow`; sem alteração na dedup (correlation_id + tipo + referencia) nem no restante do fluxo.

---

## FASE 2 — Provas locais

### Diff (apenas arquivo alterado)

```text
diff --git a/src/domain/payout/processPendingWithdrawals.js b/src/domain/payout/processPendingWithdrawals.js
index 8d7a86a..7c2d30b 100644
--- a/src/domain/payout/processPendingWithdrawals.js
+++ b/src/domain/payout/processPendingWithdrawals.js
@@ -1,5 +1,43 @@
 const payoutCounters = { success: 0, fail: 0 };
 
+/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
+let ledgerUserIdColumn = null;
+
+/**
+ * Insere uma linha no ledger usando a coluna de usuário existente no ambiente.
+ * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
+ * Nunca lança exceção; em falha retorna { success: false, error }.
+ */
+async function insertLedgerRow(supabase, payloadBase, usuarioId) {
+  if (ledgerUserIdColumn) {
+    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
+    ...
+  }
+  const rowUser = { ...payloadBase, user_id: usuarioId };
+  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
+  if (!res1.error) {
+    ledgerUserIdColumn = 'user_id';
+    return { success: true, data: res1.data };
+  }
+  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: ..., message: (res1.error?.message || '').slice(0, 80) });
+  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
+  ...
+  return { success: false, error: res2.error };
+}
+
 const createLedgerEntry = async (...) => {
   ...
-    const { data, error } = await supabase.from('ledger_financeiro').insert({ tipo, usuario_id: usuarioId, ... })...
+    const payloadBase = { tipo, valor: parseFloat(valor), referencia, correlation_id, created_at };
+    const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);
+    if (!insertResult.success) return { success: false, error: insertResult.error };
+    return { success: true, id: insertResult.data?.id };
 };
```

### Status (apenas um arquivo modificado no commit)

- `git status --porcelain` (após patch, antes do commit): **M src/domain/payout/processPendingWithdrawals.js** como único arquivo staged/modificado para o commit. Demais linhas eram untracked (??).

### Grep (presença do patch)

- `ledgerUserIdColumn`: linhas 4, 12, 13, 26, 34  
- `insertLedgerRow`: linhas 11 (definição), 66 (chamada em createLedgerEntry)

---

## FASE 3 — Commit único (rastreável)

- **Comando:**  
  `git add src/domain/payout/processPendingWithdrawals.js`  
  `git commit -m "hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry"`

- **Saída:**
  ```text
  [hotfix/ledger-userid-fallback a4b2e54] hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry
   1 file changed, 50 insertions(+), 16 deletions(-)
  ```

- **git show --stat:**
  ```text
  commit a4b2e5495d1919fe8383f247122c2e0803e3712d
  Author: Fred S. Silva <indesconectavel@gmail.com>
  Date:   Wed Mar 4 17:18:44 2026 -0300

      hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry

   src/domain/payout/processPendingWithdrawals.js | 66 +++++++++++++++++++-------
   1 file changed, 50 insertions(+), 16 deletions(-)
  ```

- **SHA completo:** `a4b2e5495d1919fe8383f247122c2e0803e3712d`

---

## FASE 4 — Plano de deploy (NÃO executado aqui)

1. **Abrir PR** da branch `hotfix/ledger-userid-fallback` para `main`.  
2. **Revisão:** Confirmar que apenas `src/domain/payout/processPendingWithdrawals.js` foi alterado e que o comportamento (dedup, tipos, rollback, worker) permanece o mesmo, exceto o insert no ledger (user_id/usuario_id).  
3. **Merge em main** após aprovação.  
4. **Deploy** via pipeline normal (Fly): push em main dispara o deploy do backend.  
5. **Rollback (se necessário):**  
   - `git revert a4b2e5495d1919fe8383f247122c2e0803e3712d` em main  
   - Commit do revert e push; pipeline fará redeploy da versão anterior.  
6. **Critérios GO:**  
   - CI verde; sem alteração de schema/env; patch contém apenas ledger fallback.  
7. **Critérios NO-GO:**  
   - Falha de testes; mudança em rotas/controllers/worker além do arquivo alvo; alteração em schema ou secrets.

---

*Relatório gerado após execução das fases 0–3. Deploy e PR não foram executados pelo agente.*
