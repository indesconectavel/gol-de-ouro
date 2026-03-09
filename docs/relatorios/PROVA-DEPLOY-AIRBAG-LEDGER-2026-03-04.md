# Prova — Deploy do airbag ledger em produção (READ-ONLY)

**Data:** 2026-03-04  
**Objetivo:** Confirmar se o código do airbag (user_id → usuario_id) em `insertLedgerRow` está em produção no Fly (goldeouro-backend-v2).

---

## FASE A — Confirmação no código local

### 1) Onde server-fly.js chama createLedgerEntry (POST /api/withdraw/request)

**Arquivo:** `server-fly.js`

- **Import (linhas 21–26):**
```javascript
const {
  payoutCounters,
  createLedgerEntry,
  rollbackWithdraw,
  processPendingWithdrawals
} = require('./src/domain/payout/processPendingWithdrawals');
```
- **Chamada 1 (linhas 1577–1584):** `createLedgerEntry({ supabase, tipo: 'saque', usuarioId: userId, valor: requestedAmount, referencia: saque.id, correlationId })`
- **Chamada 2 (linhas 1602–1609):** `createLedgerEntry({ supabase, tipo: 'taxa', usuarioId: userId, valor: taxa, referencia: \`${saque.id}:fee\`, correlationId })`

Não há duplicata de rota nem import de outro path; a função vem exclusivamente de `./src/domain/payout/processPendingWithdrawals`.

### 2) Onde está insertLedgerRow / createLedgerEntry

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`

- **insertLedgerRow:** linhas 11–37 (função interna; não exportada).
- **createLedgerEntry:** linhas 40–74 (exportada no módulo e usada por server-fly.js).

**Ordem do airbag (confirmada):**

1. Se `ledgerUserIdColumn` já está em cache → um único insert com essa coluna (user_id ou usuario_id).
2. Senão: **primeiro** tenta insert com **user_id** (linhas 22–27); se sucesso, grava cache `ledgerUserIdColumn = 'user_id'` e retorna.
3. Se falhar: loga `[LEDGER] insert falhou (airbag)` com step `'user_id'`, code e message (linha 28).
4. **Depois** tenta insert com **usuario_id** (linhas 30–35); se sucesso, grava cache `ledgerUserIdColumn = 'usuario_id'` e retorna.
5. Se falhar: loga idem com step `'usuario_id'` (linha 36) e retorna `{ success: false, error: res2.error }`.

Conclusão: a ordem é **user_id primeiro, depois usuario_id**.

---

## Evidência do SHA/commit local que contém o airbag

- **Commit:** `a4b2e5495d1919fe8383f247122c2e0803e3712d`
- **Mensagem:** `hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry`
- **Data:** 2026-03-04 17:18:44 -0300
- **Arquivo alterado:** `src/domain/payout/processPendingWithdrawals.js` (insertLedgerRow + cache `ledgerUserIdColumn`).

**Branches que contêm esse commit:** `hotfix/ledger-userid-fallback`, `origin/main`.

**Histórico em main:** o merge do PR #30 está em `origin/main` como commit `7c8cf59` (Merge pull request #30 from indesconectavel/hotfix/ledger-userid-fallback), que tem como ancestral `a4b2e54`. Ou seja, **main contém o airbag**.

---

## Evidência do release/version no Fly

- **Comando:** `flyctl status -a goldeouro-backend-v2` e `flyctl releases -a goldeouro-backend-v2`.
- **Imagem atual:** `goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM`
- **VERSION nas máquinas:** **312** (app 2874551a105768 e payout_worker e82794da791108 em **started**; app e82d445ae76178 stopped).
- **Releases:** v312 listado como o mais recente (3h19m atrás); v311, v310, … anteriores.

O pipeline principal (main-pipeline) faz deploy do backend no Fly em todo push em `main`. O merge do PR #30 (commit 7c8cf59, contendo a4b2e54) foi feito em 2026-03-04; o release v312 foi gerado há ~3h, compatível com um deploy pós-merge. **Não foi possível inspecionar o conteúdo da imagem no Fly** (read-only); a correlação é por cronologia e por main conter o airbag.

---

## Conclusão: airbag está ou não está em produção?

**Conclusão: o airbag está em produção.**

- O código em **main** (e no repositório local) contém o airbag no commit **a4b2e54**, incorporado via merge **7c8cf59**.
- O **server-fly.js** importa **createLedgerEntry** apenas de `./src/domain/payout/processPendingWithdrawals` (sem paths antigos ou duplicatas).
- O deploy do backend é feito pelo pipeline em push para **main**; o release **v312** é o atual em execução e foi criado após o merge do hotfix.
- Portanto, a versão em execução no Fly (v312) deve conter o airbag; não há evidência de que outra versão de código esteja rodando.

Se o 500 "Erro ao registrar saque" ainda ocorrer após um novo teste de saque, a próxima etapa é **FASE C** (observabilidade): logar **details** e **hint** do erro Supabase no airbag (mascarados) para capturar a causa exata sem alterar schema nem /game.
