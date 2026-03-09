# VALIDAÇÃO FINAL — DETECTOR SALDO VS LEDGER

**Data:** 2026-03-08  
**Modo:** READ-ONLY  
**Objetivo:** Validar se o detector de divergência saldo vs ledger foi implementado corretamente.

---

## 1. Módulo detectBalanceLedgerMismatch existe

**Sim.**

- **Arquivo:** `src/domain/ledger/detectBalanceLedgerMismatch.js`
- **Exporta:** `detectBalanceLedgerMismatch` e `getLedgerUserColumn`
- **Integração:** server-fly.js linha 28: `const { detectBalanceLedgerMismatch } = require('./src/domain/ledger/detectBalanceLedgerMismatch');`

---

## 2. Consulta compara saldo vs soma do ledger

**Sim.**

- O módulo não executa SQL bruto; a lógica é equivalente à query descrita no patch:
  - **Ledger:** SELECT da coluna de usuário (`user_id` ou `usuario_id`, detectada) e `valor` em `ledger_financeiro`.
  - **Usuários:** SELECT `id, saldo` em `usuarios`.
  - **Agregação:** Em memória, soma dos `valor` por usuário (Map key = id do usuário).
  - **Comparação:** Para cada usuario, `saldo` (numérico) é comparado com a soma do ledger para aquele `id`; quando `saldo !== ledgerSum`, o usuário é incluído em `mismatches` com `userId`, `saldo`, `ledgerSum` e `diff = saldo - ledgerSum`.

Equivalente lógico documentado no próprio módulo (linhas 22–26):  
`WITH ledger_soma AS (SELECT user_id, SUM(valor) AS soma ...) ... WHERE u.saldo IS DISTINCT FROM COALESCE(l.soma,0)`.

---

## 3. Endpoint admin /api/admin/check-ledger-balance existe

**Sim.**

- **Rota:** `app.post('/api/admin/check-ledger-balance', authenticateToken, async (req, res) => { ... })`
- **Local:** server-fly.js, linhas 3013–3045
- **Método e path:** POST `/api/admin/check-ledger-balance`

---

## 4. Endpoint exige admin

**Sim.**

- **authenticateToken** aplicado na rota (JWT obrigatório).
- Após verificar `dbConnected` e `supabase`, o handler faz SELECT em `usuarios` por `req.user.userId` e lê o campo `tipo`.
- Se `userErr || userRow?.tipo !== 'admin'`, responde **403** com mensagem "Acesso restrito a administradores".
- Só então chama `detectBalanceLedgerMismatch` e retorna o resultado.

---

## 5. Endpoint não altera dados

**Sim.**

- O handler apenas: verifica disponibilidade do sistema, confere tipo admin, chama `detectBalanceLedgerMismatch({ supabase })` e envia `res.status(200).json({ success: true, totalUsersChecked, mismatches })`.
- Nenhum UPDATE, INSERT ou DELETE no handler; o módulo chamado também não altera dados (ver item 6).

---

## 6. Apenas SELECTs são executados

**Sim.**

- **detectBalanceLedgerMismatch.js:**
  - `getLedgerUserColumn`: dois `.select('user_id').limit(1).maybeSingle()` e `.select('usuario_id').limit(1).maybeSingle()` em `ledger_financeiro` (somente leitura).
  - `detectBalanceLedgerMismatch`: `.from('usuarios').select('id, saldo')` e `.from('ledger_financeiro').select(userCol + ', valor')`. O restante é processamento em memória (Map, comparação).
- Não há chamadas a `.insert()`, `.update()`, `.upsert()` ou `.delete()` em nenhum dos dois arquivos do detector.

---

## 7. Resposta retorna mismatches

**Sim.**

- O endpoint responde com:
  - `res.status(200).json({ success: true, totalUsersChecked, mismatches })`
- `mismatches` é o array retornado por `detectBalanceLedgerMismatch`, cujo formato é:
  - `mismatches[].userId` (string)
  - `mismatches[].saldo` (number)
  - `mismatches[].ledgerSum` (number)
  - `mismatches[].diff` (number, igual a saldo - ledgerSum)

---

## Classificação

**VALIDADO**

Todos os itens verificados foram atendidos: o módulo existe e está integrado; a lógica compara saldo com a soma do ledger por usuário; o endpoint existe, exige admin, não altera dados, usa apenas SELECTs e retorna `mismatches` no formato esperado.
