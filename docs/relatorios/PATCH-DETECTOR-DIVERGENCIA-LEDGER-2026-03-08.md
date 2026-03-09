# PATCH CIRÚRGICO — DETECTOR DE DIVERGÊNCIA SALDO VS LEDGER

**Data:** 2026-03-08  
**Modo:** Somente leitura — não altera saldo, ledger nem executa retries.

---

## 1. Objetivo

Implementar um mecanismo seguro para **detectar** divergências entre:

- `usuarios.saldo`
- soma dos `valor` em `ledger_financeiro` por usuário

O patch **não corrige** saldo automaticamente; apenas detecta e relata inconsistências para auditoria e monitoramento.

---

## 2. Estratégia aplicada

- **Módulo dedicado:** `src/domain/ledger/detectBalanceLedgerMismatch.js` com função `detectBalanceLedgerMismatch({ supabase })`.
- **Lógica equivalente à query SQL:** Agregação da soma do ledger por usuário (coluna `user_id` ou `usuario_id` conforme existente no ambiente) e comparação com `usuarios.saldo`; retorno apenas dos usuários em que `saldo !== soma_ledger`.
- **Somente SELECT:** Nenhum UPDATE/INSERT em `usuarios` nem em `ledger_financeiro`; nenhuma chamada a retry ou createLedgerEntry.
- **Endpoint admin:** `POST /api/admin/check-ledger-balance` com JWT e tipo admin; resposta JSON com `totalUsersChecked` e `mismatches`.
- **Logs:** `[LEDGER-AUDIT] usuários verificados` e `[LEDGER-AUDIT] divergências encontradas` no servidor.

---

## 3. Arquivos criados/alterados

| Arquivo | Alteração |
|---------|-----------|
| **src/domain/ledger/detectBalanceLedgerMismatch.js** | Novo. Contém `getLedgerUserColumn` e `detectBalanceLedgerMismatch`. |
| **server-fly.js** | Require do detector; nova rota `POST /api/admin/check-ledger-balance` (authenticateToken + tipo admin). |

Nenhuma alteração em: depósitos, chutes, saques, ledger, retry de ledger ou qualquer fluxo financeiro.

---

## 4. Código completo (trechos relevantes)

### detectBalanceLedgerMismatch.js

- **getLedgerUserColumn(supabase):** Tenta SELECT `user_id` e depois `usuario_id` em `ledger_financeiro` (limit 1); retorna o nome da coluna que existir ou null.
- **detectBalanceLedgerMismatch({ supabase }):**
  1. Obtém a coluna de usuário do ledger.
  2. SELECT `id, saldo` em `usuarios`.
  3. SELECT `{userCol}, valor` em `ledger_financeiro`.
  4. Em memória: agrupa ledger por usuário e soma `valor`.
  5. Para cada usuario: `ledgerSum = mapa.get(id) ?? 0`; se `saldo !== ledgerSum`, adiciona a `mismatches` com `userId`, `saldo`, `ledgerSum`, `diff = saldo - ledgerSum`.
  6. Retorna `{ totalUsersChecked, mismatches }`.
  7. Loga `[LEDGER-AUDIT] usuários verificados` e `[LEDGER-AUDIT] divergências encontradas`.

### server-fly.js

- **Require:** `const { detectBalanceLedgerMismatch } = require('./src/domain/ledger/detectBalanceLedgerMismatch');`
- **Rota:** `app.post('/api/admin/check-ledger-balance', authenticateToken, async (req, res) => { ... })` — verifica supabase e tipo admin; chama `detectBalanceLedgerMismatch({ supabase })`; responde com `{ success: true, totalUsersChecked, mismatches }`.

---

## 5. Como funciona a detecção

1. **Coluna do ledger:** A função tenta ler `user_id` e `usuario_id` em `ledger_financeiro` para descobrir qual coluna o ambiente usa.
2. **Usuários:** SELECT `id, saldo` de `usuarios` (todos).
3. **Ledger:** SELECT da coluna de usuário e `valor` de `ledger_financeiro` (todos os registros).
4. **Agregação:** Em Node, soma dos `valor` por usuário (chave = id do usuário).
5. **Comparação:** Para cada usuario, `saldo` (numérico) é comparado com a soma do ledger para aquele `id`; se forem diferentes, o usuário entra em `mismatches` com `userId`, `saldo`, `ledgerSum` e `diff = saldo - ledgerSum`.

Equivalente à query SQL (com `user_id` ou `usuario_id` conforme o caso):

```sql
WITH ledger_soma AS (
  SELECT user_id, SUM(valor) AS soma FROM ledger_financeiro GROUP BY user_id
)
SELECT u.id, u.saldo, COALESCE(l.soma,0) AS ledger_sum, (u.saldo - COALESCE(l.soma,0)) AS diff
FROM usuarios u
LEFT JOIN ledger_soma l ON l.user_id = u.id
WHERE u.saldo IS DISTINCT FROM COALESCE(l.soma,0)
```

---

## 6. Segurança da solução

- O módulo **não** executa UPDATE nem INSERT em nenhuma tabela.
- **Não** chama `createLedgerEntry`, `rollbackWithdraw` nem qualquer função que altere saldo ou ledger.
- Apenas SELECT em `usuarios` e `ledger_financeiro`.
- O endpoint é protegido por JWT e verificação de tipo admin; não altera dados.

---

## 7. Rollback

Ver [ROLLBACK-PATCH-DETECTOR-DIVERGENCIA-2026-03-08.md](ROLLBACK-PATCH-DETECTOR-DIVERGENCIA-2026-03-08.md). Resumo: remover o require de `detectBalanceLedgerMismatch`, remover a rota `POST /api/admin/check-ledger-balance` e apagar `src/domain/ledger/detectBalanceLedgerMismatch.js`.

---

## 8. Atualização do docs/V1-VALIDATION.md

A seção **BLOCO A / D — RECONCILIAÇÃO FINANCEIRA V1** foi atualizada para status **MONITORAMENTO DE CONSISTÊNCIA ATIVADO** e resumo incluindo o detector administrativo de divergência saldo vs ledger (somente leitura).

---

## 9. Prompt de validação final

1. **Admin:** Login como admin; `POST /api/admin/check-ledger-balance` com Bearer JWT. Deve retornar 200 e corpo com `success: true`, `totalUsersChecked` e `mismatches` (array).
2. **Não-admin:** Chamar com JWT de não admin; deve retornar 403.
3. **Somente leitura:** Confirmar que após a chamada não houve alteração em `usuarios.saldo` nem em `ledger_financeiro` (comparar estado antes/depois se necessário).
4. **Formato:** Cada item de `mismatches` deve ter `userId`, `saldo`, `ledgerSum` e `diff`; `diff` deve ser igual a `saldo - ledgerSum`.
