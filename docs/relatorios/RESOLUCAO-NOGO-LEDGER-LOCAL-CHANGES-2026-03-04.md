# Resolução NO-GO — Mudanças locais no ledger

**Data:** 2026-03-04  
**Modo:** SAFE + AUDITÁVEL  
**Regras:** Não tocar em goldeouro-player, Vercel, .github/workflows; não deployar, não alterar schema/migrations, não reiniciar máquinas. Apenas `src/domain/payout/processPendingWithdrawals.js`.  
**Objetivo:** Voltar ao estado GO do precheck pré-E2E (reverter ou tornar a mudança baseline rastreável), sem risco para /game.

---

## PASSO 1 — Evidência do estado atual

**Comandos executados:**
- `git rev-parse --abbrev-ref HEAD`
- `git status --porcelain`
- `git diff --stat src/domain/payout/processPendingWithdrawals.js`
- `git diff src/domain/payout/processPendingWithdrawals.js`

**Branch:** `hotfix/ledger-userid-fallback`

**git status --porcelain (trecho relevante):**
```
 M src/domain/payout/processPendingWithdrawals.js
```
(+ arquivos untracked em docs/relatorios, scripts, etc.)

**git diff --stat src/domain/payout/processPendingWithdrawals.js:**
```
 src/domain/payout/processPendingWithdrawals.js | 10 ++++++++--
 1 file changed, 8 insertions(+), 2 deletions(-)
```

**git diff src/domain/payout/processPendingWithdrawals.js (completo):**
```diff
diff --git a/src/domain/payout/processPendingWithdrawals.js b/src/domain/payout/processPendingWithdrawals.js
index 7c2d30b..ffd6017 100644
--- a/src/domain/payout/processPendingWithdrawals.js
+++ b/src/domain/payout/processPendingWithdrawals.js
@@ -26,7 +26,13 @@ async function insertLedgerRow(supabase, payloadBase, usuarioId) {
     ledgerUserIdColumn = 'user_id';
     return { success: true, data: res1.data };
   }
-  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: res1.error?.code, message: (res1.error?.message || '').slice(0, 80) });
+  const safeErr = (e) => ({
+    code: e?.code,
+    message: (e?.message || '').slice(0, 80),
+    details: (e?.details || '').slice(0, 120),
+    hint: (e?.hint || '').slice(0, 120)
+  });
+  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', ...safeErr(res1.error) });
 
   const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
   const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
@@ -34,7 +40,7 @@ async function insertLedgerRow(supabase, payloadBase, usuarioId) {
     ledgerUserIdColumn = 'usuario_id';
     return { success: true, data: res2.data };
   }
-  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', code: res2.error?.code, message: (res2.error?.message || '').slice(0, 80) });
+  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', ...safeErr(res2.error) });
   return { success: false, error: res2.error };
 }
```

---

## PASSO 2 — Classificação do diff

**Regra objetiva:**
- **(A) OBSERVABILIDADE APENAS:** altera somente logs/helpers (ex.: safeErr, details/hint); **não** altera: ordem user_id → usuario_id, payloadBase/rowUser/rowUsuario, select/dedup (correlation_id/tipo/referencia), retornos success/fail.
- **(B) MUDANÇA DE LÓGICA:** toca em qualquer um dos pontos acima.

**Análise do diff:**
- Foi adicionado o helper `safeErr(e)` que retorna `{ code, message, details, hint }` (valores truncados).
- Os dois `console.warn` passam a usar `...safeErr(res1.error)` e `...safeErr(res2.error)` em vez de apenas `code` e `message`.
- **Não foi alterado:** ordem user_id → usuario_id; definição de rowUser/rowUsuario/payloadBase; select/dedup; retornos success/fail.

**Classificação:** **(A) OBSERVABILIDADE APENAS**

---

## PASSO 3 — Ação segura (classificação A)

Como a classificação é (A), foi aplicado: **commit único** para tornar a mudança rastreável.

**Comandos executados:**
```bash
git add src/domain/payout/processPendingWithdrawals.js
git commit -m "chore(ledger): improve airbag error logs (details/hint) for diagnostics"
```

**SHA do commit:** `93b502fb2dc2e3dacc3780b6f20d3abdf139ffee` (abreviado: `93b502f`)

**Confirmação de que só 1 arquivo entrou no commit (git show --stat):**
```
commit 93b502fb2dc2e3dacc3780b6f20d3abdf139ffee
Author: Fred S. Silva <indesconectavel@gmail.com>
Date:   Wed Mar 4 22:30:41 2026 -0300

    chore(ledger): improve airbag error logs (details/hint) for diagnostics
    
    Made-with: Cursor

 src/domain/payout/processPendingWithdrawals.js | 10 ++++++++--
 1 file changed, 8 insertions(+), 2 deletions(-)
```

**Push:** não foi executado (conforme regra).

---

## PASSO 4 — Confirmação final (volta ao GO)

**Comandos:** `git status --porcelain` e `git diff --stat`

**git status --porcelain:** Nenhuma linha com ` M src/domain/payout/processPendingWithdrawals.js`; apenas arquivos untracked (docs/relatorios, scripts, etc.).

**git diff --stat:** (saída vazia — nenhuma modificação em arquivos rastreados)

---

## STATUS FINAL

**GO**

Não há mais modificação local em `src/domain/payout/processPendingWithdrawals.js`. A alteração de observabilidade foi incorporada em um commit único e rastreável; o precheck pré-E2E que exige “não há mudanças inesperadas” passa (o arquivo está limpo em relação ao HEAD).

---

## Observação final

- Nenhuma alteração em player, Vercel, workflows, Fly ou schema foi feita.
- Nenhum deploy foi executado.
