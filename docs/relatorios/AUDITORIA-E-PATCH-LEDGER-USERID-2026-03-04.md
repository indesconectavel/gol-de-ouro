# Auditoria e patch: ledger_financeiro user_id vs usuario_id

**Data:** 2026-03-04  
**Tipo:** READ-ONLY (auditoria) + patch mínimo localizado  
**Objetivo:** Corrigir divergência `ledger_financeiro.user_id` vs `usuario_id` sem alterar schema, migrations, deploy ou outros fluxos já validados.

---

## 1. Resumo da causa

- **Produção:** a tabela `ledger_financeiro` tem a coluna **user_id** e **não** tem **usuario_id**.
- **Código (repo):** `createLedgerEntry` em `src/domain/payout/processPendingWithdrawals.js` insere com **usuario_id**, o que gera erro no Supabase/Postgres (`column ledger_financeiro.usuario_id does not exist`) e leva o POST `/api/withdraw/request` a retornar 500 (ou o ledger a falhar).
- **Outras tabelas** (saques, transacoes, pagamentos_pix, chutes) usam `usuario_id` e estão alinhadas; a divergência é **isolada** no ledger.

---

## 2. Auditoria READ-ONLY — referências a ledger_financeiro / usuario_id / user_id

### 2.1 Tabela: arquivo, linha, ação, coluna, observação

| Arquivo | Linha(s) | Ação | Coluna | Observação |
|---------|----------|------|--------|------------|
| `src/domain/payout/processPendingWithdrawals.js` | 7–12 | SELECT | — | Dedup por correlation_id, tipo, referencia (sem filtro por usuário). |
| `src/domain/payout/processPendingWithdrawals.js` | 23–32 | INSERT | **usuario_id** | Único ponto de escrita no ledger no domínio payout; causa falha em prod. |
| `server-fly.js` | 2181–2186 | SELECT | — | Idempotência webhook: correlation_id, referencia, tipo; não usa usuario_id/user_id. |
| `server-fly.js` | 2207–2213 | (chamada) | — | Chama `createLedgerEntry` (insert feito em processPendingWithdrawals). |
| `scripts/release-audit-pix-saques-readonly.js` | 85 | SELECT | — | tipo, correlation_id, referencia; não usa coluna de usuário. |
| `scripts/audit-financeira-total-prod-readonly.js` | 138, 147 | SELECT | — | tipo; correlation_id, referencia, tipo; não usa coluna de usuário. |
| `database/schema-ledger-financeiro.sql` | 7, 13 | CREATE TABLE / INDEX | **usuario_id** | Schema do repo define ledger com usuario_id. |

### 2.2 Leitura do ledger por usuario_id

- **Nenhum** código no repositório filtra ou lê `ledger_financeiro` por `usuario_id` (nem por `user_id`).
- Todas as leituras usam `correlation_id`, `referencia` e/ou `tipo`. A alteração do nome da coluna no **insert** não quebra leituras existentes.

---

## 3. Como o patch funciona (fallback + cache + airbag)

1. **Cache em memória:** `ledgerUserIdColumn = null | 'user_id' | 'usuario_id'`. Após a primeira inserção bem-sucedida, as seguintes usam sempre a mesma coluna.
2. **Helper `insertLedgerRow(supabase, payloadBase, usuarioId)`:**
   - Se o cache estiver definido, insere com essa coluna apenas.
   - Senão: tenta primeiro com **user_id** (ambiente de produção); em caso de sucesso, grava cache `'user_id'`.
   - Se a tentativa com user_id falhar, tenta com **usuario_id** (ambiente com schema do repo); em sucesso, grava cache `'usuario_id'`.
   - Se as duas falharem: retorna `{ success: false, error }` **sem lançar exceção**.
3. **createLedgerEntry:** Mantém a dedup (select por correlation_id/tipo/referencia). O bloco de insert passa a usar `insertLedgerRow`. **Nunca** dá throw; em falha do Supabase retorna `{ success: false, error }`.
4. **Logs (airbag):** Em falha de insert, `console.warn('[LEDGER] insert falhou (airbag)', { step, code, message })` sem tokens nem correlationId completo (no máximo prefixo).

Assim o mesmo código funciona em ambientes com `user_id` ou com `usuario_id`, sem piorar o comportamento em caso de falha (não derruba request nem gera throw).

---

## 4. Por que não quebra ambientes antigos

- Ambientes com **usuario_id** (schema do repo): a primeira tentativa (user_id) falha; a segunda (usuario_id) sucede e o cache fica `'usuario_id'`; as próximas inserções usam usuario_id.
- Ambientes com **user_id** (produção): a primeira tentativa (user_id) sucede e o cache fica `'user_id'`; não se tenta usuario_id.
- Nenhuma outra função ou fluxo do worker é alterada; apenas o trecho do `.insert({...})` dentro de `createLedgerEntry` é substituído pela chamada ao helper.

---

## 5. Arquivos alterados

- **Único arquivo modificado:** `src/domain/payout/processPendingWithdrawals.js`
- Nenhuma alteração em: server-fly.js, routes, migrations, Supabase, Fly, secrets, deploy.

---

## 6. Diff resumido (trecho antes/depois)

**Antes (insert fixo com usuario_id):**

```js
const { data, error } = await supabase
  .from('ledger_financeiro')
  .insert({
    tipo,
    usuario_id: usuarioId,
    valor: parseFloat(valor),
    referencia,
    correlation_id: correlationId,
    created_at: new Date().toISOString()
  })
  .select('id')
  .single();
```

**Depois (uso do helper com fallback e cache):**

- Cache `let ledgerUserIdColumn = null` no topo do módulo.
- Novo helper `async function insertLedgerRow(supabase, payloadBase, usuarioId)` que:
  - Se `ledgerUserIdColumn` está setado, insere com essa coluna.
  - Senão, tenta insert com `user_id`; sucesso → cache `'user_id'`.
  - Falha → tenta com `usuario_id`; sucesso → cache `'usuario_id'`.
  - Ambas falham → retorna `{ success: false, error }` (sem throw).
- Em `createLedgerEntry`, após o bloco de dedup, monta `payloadBase` (tipo, valor, referencia, correlation_id, created_at) e chama `insertLedgerRow(supabase, payloadBase, usuarioId)`; trata retorno `success: false` com o mesmo comportamento atual (retorno `{ success: false, error }`) e log airbag quando aplicável.

(O relatório não cola o arquivo completo; o arquivo completo atualizado é entregue separadamente.)

---

## 7. ROLLBACK

Para reverter o patch:

1. Restaurar em `src/domain/payout/processPendingWithdrawals.js` o insert antigo que usa apenas **usuario_id**:
   - Remover o cache `ledgerUserIdColumn` e o helper `insertLedgerRow`.
   - Em `createLedgerEntry`, recolocar o `.insert({ tipo, usuario_id: usuarioId, valor: parseFloat(valor), referencia, correlation_id: correlationId, created_at: new Date().toISOString() })` diretamente, com o mesmo `.select('id').single()` e a mesma lógica de retorno `{ success: true, id }` / `{ success: false, error }`.

Isso restaura o comportamento anterior (válido apenas em ambientes onde a tabela tem `usuario_id`).

---

## 8. Evidências (referências em código)

- **createLedgerEntry:** definido e usado em `src/domain/payout/processPendingWithdrawals.js` (definição ~L5–43; chamadas em L166, L176, L363; export L424).
- **server-fly.js:** usa `createLedgerEntry` no webhook MP (payout_confirmado); leitura do ledger apenas por correlation_id/referencia/tipo (L2181–2186).
- **Schema repo:** `database/schema-ledger-financeiro.sql` define `usuario_id`; produção tem `user_id` (conforme relatórios PROVA-LEDGER-FINANCEIRO e AUDITORIA-USUARIO_ID-VS-USER_ID de 2026-03-04).

---

*Fim do relatório. Patch aplicado apenas em `src/domain/payout/processPendingWithdrawals.js`; nenhum deploy, migração ou alteração de infraestrutura.*
