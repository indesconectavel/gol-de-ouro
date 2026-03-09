# PATCH CIRÚRGICO — RETRY DE LEDGER (RECONCILIAÇÃO AUTOMÁTICA)

**Data:** 2026-03-08  
**Modo:** Patch cirúrgico; não altera saldo nem fluxos já validados.

---

## 1. Risco corrigido

**Risco:** Saldo já foi atualizado (depósito aprovado ou chute) mas o ledger não foi gravado (falha de insert, timeout, crash). O sistema hoje só registra warning/log e não recompõe o ledger.

**Correção:** Mecanismo que detecta movimentos sem contrapartida em `ledger_financeiro` e executa retry idempotente via `createLedgerEntry`, sem alterar saldo e sem duplicar lançamentos.

---

## 2. Estratégia aplicada

- **Detecção por queries:** Listar pagamentos_pix aprovados e chutes (miss/goal); para cada um, verificar se existe linha no ledger com a referência e o tipo esperado.
- **Retry idempotente:** Chamar `createLedgerEntry` com os mesmos parâmetros do fluxo original (referencia = id do pagamento ou do chute, correlationId = mesma referência). A deduplicação já existente em `createLedgerEntry` evita duplicata.
- **Escopo limitado:** Apenas depósito aprovado, chute miss e chute goal (aposta + prêmio). Não corrige automaticamente saldo divergente da soma do ledger, rollback inconsistente ou casos ambíguos.
- **Execução:** Função reutilizável `runReconcileMissingLedger` + endpoint admin `POST /api/admin/reconcile-ledger` (autenticação JWT + tipo admin). Sem job periódico no código; um cron externo pode chamar o endpoint se desejar.

---

## 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| **src/domain/ledger/reconcileMissingLedger.js** | Novo. Contém `ledgerExists`, `runReconcileMissingLedger`. Detecção e retry para depósitos, chutes miss e chutes goal. |
| **server-fly.js** | Require do módulo; novo endpoint `POST /api/admin/reconcile-ledger` (authenticateToken + verificação tipo admin). |

Nenhuma alteração em: lógica de saldo, engine, saque, createLedgerEntry, fluxos de depósito/chute já validados.

---

## 4. Código final completo (trechos relevantes)

### reconcileMissingLedger.js

- **ledgerExists(supabase, referencia, tipo):** SELECT em `ledger_financeiro` por `referencia` e `tipo`, retorna true se existir linha.
- **runReconcileMissingLedger({ supabase, createLedgerEntry }):**
  - Lista `pagamentos_pix` com status `approved`; para cada um, se não existir ledger `deposito_aprovado` com referencia = id do pagamento, chama `createLedgerEntry` (tipo deposito_aprovado, valor amount/valor, referencia e correlationId = id).
  - Lista `chutes` com resultado `miss`; para cada um, se não existir ledger `chute_miss`, chama `createLedgerEntry` (tipo chute_miss, valor -valor_aposta, referencia e correlationId = id do chute).
  - Lista `chutes` com resultado `goal`; para cada um, verifica ledger `chute_aposta` e `chute_premio`; para cada tipo faltante, chama `createLedgerEntry` (aposta negativa, prêmio = premio + premio_gol_de_ouro).
  - Acumula contagens em objeto `report` (deposits: found, created, deduped, failed; miss: idem; goal: found, apostaCreated, premioCreated, deduped, failed).
  - Retorna o relatório; em erro de listagem loga e retorna relatório parcial.

### server-fly.js

- **Require:** `const { runReconcileMissingLedger } = require('./src/domain/ledger/reconcileMissingLedger');`
- **Rota:** `app.post('/api/admin/reconcile-ledger', authenticateToken, async (req, res) => { ... })`
  - Verifica dbConnected e supabase (503 se não).
  - Busca usuario por req.user.userId e confere tipo === 'admin' (403 se não).
  - Chama `runReconcileMissingLedger({ supabase, createLedgerEntry })`.
  - Responde 200 com `{ success: true, message, report }` ou 500 em exceção.

---

## 5. Como funciona a detecção

1. **Depósitos:** `SELECT id, usuario_id, amount, valor FROM pagamentos_pix WHERE status = 'approved'`. Para cada linha, consulta `ledger_financeiro` com `referencia = String(p.id)` e `tipo = 'deposito_aprovado'`. Se não houver linha, considera “sem ledger”.
2. **Chutes miss:** `SELECT id, usuario_id, valor_aposta FROM chutes WHERE resultado = 'miss'`. Para cada linha, consulta ledger com `referencia = String(c.id)` e `tipo = 'chute_miss'`. Se não houver, considera “sem ledger”.
3. **Chutes goal:** `SELECT id, usuario_id, valor_aposta, premio, premio_gol_de_ouro FROM chutes WHERE resultado = 'goal'`. Para cada linha, consulta ledger para `chute_aposta` e para `chute_premio` com a mesma referencia. Se algum faltar, considera “sem ledger” para aquele(s) tipo(s).

Todas as consultas ao ledger usam a função interna `ledgerExists(supabase, referencia, tipo)` (SELECT id, limit 1, maybeSingle).

---

## 6. Como funciona o retry

Para cada inconsistência detectada:

- **Depósito:** `createLedgerEntry({ supabase, tipo: 'deposito_aprovado', usuarioId: p.usuario_id, valor: amount/valor, referencia: String(p.id), correlationId: String(p.id) })`.
- **Chute miss:** `createLedgerEntry({ supabase, tipo: 'chute_miss', usuarioId: c.usuario_id, valor: -valor_aposta, referencia: String(c.id), correlationId: String(c.id) })`.
- **Chute goal (aposta):** `createLedgerEntry({ supabase, tipo: 'chute_aposta', usuarioId: c.usuario_id, valor: -valor_aposta, referencia: ref, correlationId: ref })`.
- **Chute goal (prêmio):** `createLedgerEntry({ supabase, tipo: 'chute_premio', usuarioId: c.usuario_id, valor: premio + premio_gol_de_ouro, referencia: ref, correlationId: ref })`.

O `createLedgerEntry` existente faz SELECT por (correlation_id, tipo, referencia) antes do insert; se já existir, retorna `{ success: true, deduped: true }`. Não há duplicidade.

---

## 7. O que ficou fora do retry automático

- **Saldo divergente da soma do ledger:** Apenas detectável por query (ex.: auditoria); não corrigido automaticamente neste patch.
- **Rollback de saque inconsistente (saldo restaurado, ledger rollback faltando):** Não incluso no retry; cenário mais complexo e dependente de saque_id/correlation_id do saque.
- **Ledger com schema incompatível / referencia nula:** Não tratado; apenas detecção em auditoria.
- **Casos ambíguos** em que não seja possível reconstruir com certeza o lançamento correto: não corrigidos automaticamente.

---

## 8. Logs / observabilidade

- **Durante a execução:** Para cada falha de `createLedgerEntry`, `console.warn('[RECONCILE-LEDGER] deposito_aprovado falhou', { ref, error })` (e equivalente para chute_miss).
- **Ao final:** `console.log('[RECONCILE-LEDGER] Concluído', { deposits, miss, goal })` com os objetos de contagem.
- **Resposta do endpoint:** O corpo da resposta inclui `report` com:
  - `deposits`: found, created, deduped, failed
  - `miss`: found, created, deduped, failed
  - `goal`: found, apostaCreated, premioCreated, deduped, failed

Assim é possível saber quantos depósitos/chutes sem ledger foram encontrados, quantos lançamentos foram criados, quantos foram deduplicados e quantos falharam.

---

## 9. Rollback

Ver [ROLLBACK-PATCH-RETRY-LEDGER-2026-03-08.md](ROLLBACK-PATCH-RETRY-LEDGER-2026-03-08.md). Resumo: remover o require de `reconcileMissingLedger`, remover o bloco da rota `POST /api/admin/reconcile-ledger` e apagar o arquivo `src/domain/ledger/reconcileMissingLedger.js`.

---

## 10. Atualização do docs/V1-VALIDATION.md

A seção **BLOCO A / D — RECONCILIAÇÃO FINANCEIRA V1** foi atualizada para status **PATCH APLICADO — AGUARDANDO VALIDAÇÃO FINAL DO RETRY DE LEDGER** e resumo incluindo o mecanismo de retry de ledger.

---

## 11. Prompt de validação final

1. **Admin:** Fazer login como usuário com `tipo = 'admin'`. Chamar `POST /api/admin/reconcile-ledger` com header `Authorization: Bearer <JWT>`. Deve retornar 200 e corpo com `report` (deposits, miss, goal).
2. **Não-admin:** Chamar o mesmo endpoint com JWT de usuário não admin. Deve retornar 403.
3. **Idempotência:** Chamar o endpoint duas vezes seguidas. Na segunda, os números de `created` devem ser 0 (ou não aumentar) para os mesmos dados; `deduped` pode aumentar se houver alguma race.
4. **Cobertura:** Inserir manualmente um pagamento aprovado sem ledger (ou simular falha no fluxo) e rodar a reconciliação; deve aparecer em `deposits.found` e em `deposits.created` ou `deposits.deduped`, e deve existir linha em `ledger_financeiro` com tipo `deposito_aprovado` e referencia = id do pagamento.

---

## Referências

- [AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md](AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md)
- [VALIDACAO-FINAL-RECONCILIACAO-FINANCEIRA-2026-03-07.md](VALIDACAO-FINAL-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
