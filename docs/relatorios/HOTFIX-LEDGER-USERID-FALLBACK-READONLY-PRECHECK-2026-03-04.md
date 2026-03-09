# Hotfix Ledger user_id Fallback — Precheck READ-ONLY

**Data:** 2026-03-04  
**Branch:** hotfix/ledger-userid-fallback  
**Commit:** a4b2e5495d1919fe8383f247122c2e0803e3712d  
**App Fly:** goldeouro-backend-v2  
**Regra:** Zero improviso; evidências locais e Git apenas.

---

## FASE 0 — CONTRATO: Dúvidas e Respostas com Evidência

### Dúvida A) Commit a4b2e549... na branch hotfix/ledger-userid-fallback e altera apenas 1 arquivo?

**Resposta: SIM.**

- `git log -1 --oneline a4b2e5495d1919fe8383f247122c2e0803e3712d`:
  ```
  a4b2e54 hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry
  ```
- `git branch -a --contains a4b2e5495d1919fe8383f247122c2e0803e3712d`:
  ```
  * hotfix/ledger-userid-fallback
  ```
- `git show a4b2e5495d1919fe8383f247122c2e0803e3712d --stat`:
  ```
  src/domain/payout/processPendingWithdrawals.js | 66 +++++++++++++++++++-------
  1 file changed, 50 insertions(+), 16 deletions(-)
  ```

---

### Dúvida B) Mudança é "airbag": user_id primeiro, fallback usuario_id, sem throw, cache ledgerUserIdColumn, sem alterar rotas/controllers/schema?

**Resposta: SIM.**

Trechos do arquivo alterado (evidência em `src/domain/payout/processPendingWithdrawals.js`):

- Cache e comentário:
  ```js
  /** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
  let ledgerUserIdColumn = null;
  ```
- Tentativa `user_id` e fallback `usuario_id`, sem throw (retorno `{ success: false, error }`):
  ```js
  async function insertLedgerRow(supabase, payloadBase, usuarioId) {
    if (ledgerUserIdColumn) {
      const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
      // ... insert ...
      if (error) return { success: false, error };
      return { success: true, data };
    }
    const rowUser = { ...payloadBase, user_id: usuarioId };
    const res1 = await supabase.from('ledger_financeiro').insert(rowUser)...
    if (!res1.error) {
      ledgerUserIdColumn = 'user_id';
      return { success: true, data: res1.data };
    }
    console.warn('[LEDGER] insert falhou (airbag)', ...);
    const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
    const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario)...
    if (!res2.error) {
      ledgerUserIdColumn = 'usuario_id';
      return { success: true, data: res2.data };
    }
    return { success: false, error: res2.error };
  }
  ```
- `createLedgerEntry` usa `insertLedgerRow` (fallback):
  ```js
  const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);
  if (!insertResult.success) return { success: false, error: insertResult.error };
  return { success: true, id: insertResult.data?.id };
  ```

Nenhum arquivo de rotas, controllers ou schema foi alterado; apenas domínio de payout.

---

### Dúvida C) Existe outro patch no main que toque no mesmo arquivo com conflitos?

**Resposta: NÃO.**

- Merge-base: `git merge-base origin/main hotfix/ledger-userid-fallback` → `3ae3786`
- Commits no main que alteram o arquivo após o merge-base:
  ```bash
  git log 3ae3786..origin/main --oneline -- src/domain/payout/processPendingWithdrawals.js
  ```
  **(saída vazia)**  
- Último commit no main que toca no arquivo (histórico): `3624a19 release: payout worker + correção supabase ping (1.2.1)` — está na base do hotfix. Conclusão: nenhum patch concorrente no main no mesmo arquivo.

---

### Dúvida D) Deploy vai para o app correto (goldeouro-backend-v2) e o worker depende desse código?

**Resposta: SIM.**

- `fly.toml` (raiz do repo):
  ```toml
  app = "goldeouro-backend-v2"
  [processes]
  app = "npm start"
  payout_worker = "node src/workers/payout-worker.js"
  ```
- Pipeline principal (`.github/workflows/main-pipeline.yml`): `FLY_APP_NAME: goldeouro-backend-v2`; deploy em push para `main`.
- `src/workers/payout-worker.js`:
  ```js
  const { processPendingWithdrawals } = require('../domain/payout/processPendingWithdrawals');
  // ...
  const result = await processPendingWithdrawals({ supabase, isDbConnected, payoutEnabled, createPixWithdraw });
  ```
O payout_worker roda no mesmo app (Fly processes) e usa exatamente o arquivo alterado.

---

## Evidências Git (comandos e saídas)

### git log (branch hotfix)
```
a4b2e54 hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry
3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy
...
```

### git show --stat
```
commit a4b2e5495d1919fe8383f247122c2e0803e3712d
Author: Fred S. Silva <indesconectavel@gmail.com>
Date:   Wed Mar 4 17:18:44 2026 -0300

    hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry

 src/domain/payout/processPendingWithdrawals.js | 66 +++++++++++++++++++-------
 1 file changed, 50 insertions(+), 16 deletions(-)
```

### Diff (resumo)
- Adiciona `ledgerUserIdColumn` e `insertLedgerRow()` (tenta `user_id`, fallback `usuario_id`, cache, sem throw).
- `createLedgerEntry` deixa de inserir direto com `usuario_id` e passa a usar `insertLedgerRow(supabase, payloadBase, usuarioId)`.

---

## Conclusão FASE 0

| Dúvida | Resposta | Evidência |
|--------|----------|-----------|
| A) Commit na branch, 1 arquivo | SIM | git log, branch --contains, show --stat |
| B) Airbag, cache, sem throw, sem rotas/schema | SIM | Trechos do processPendingWithdrawals.js |
| C) Sem patch concorrente no main | SIM | git log 3ae3786..origin/main -- arquivo (vazio) |
| D) App correto e worker depende | SIM | fly.toml, main-pipeline.yml, payout-worker.js |

**Todas as dúvidas estão sanadas com evidências. Autorizado prosseguir para FASE 1 (EXEC).**

---

*Relatório READ-ONLY. Nenhuma ação de merge/deploy foi executada.*
