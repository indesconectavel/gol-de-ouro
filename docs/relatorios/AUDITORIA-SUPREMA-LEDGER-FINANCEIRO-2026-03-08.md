# AUDITORIA SUPREMA — LEDGER FINANCEIRO (FORENSE READ-ONLY)

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, banco, env ou deploy.  
**Objetivo:** Mapear a arquitetura real do ledger, pontos de criação/falha, idempotência, divergências e requisitos para reconciliação automática / retry seguro.

---

## 1. Estrutura da tabela ledger_financeiro

### Definição no repositório

**Arquivo:** `database/schema-ledger-financeiro.sql`

| Campo            | Tipo           | Restrições                          |
|------------------|----------------|-------------------------------------|
| id               | uuid           | PRIMARY KEY, default gen_random_uuid() |
| correlation_id   | text           | NOT NULL                            |
| tipo             | text           | NOT NULL, CHECK (tipo in (...))     |
| usuario_id       | uuid           | NOT NULL                            |
| valor            | numeric(12,2)  | NOT NULL                            |
| referencia       | text           | (opcional)                          |
| created_at       | timestamptz    | NOT NULL, default now()             |

**CHECK no schema file:** `tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout')`.

**Índices definidos:**
- `ledger_financeiro_usuario_idx` em `(usuario_id)`
- `ledger_financeiro_created_idx` em `(created_at)`
- **UNIQUE:** `ledger_financeiro_correlation_tipo_ref_idx` em `(correlation_id, tipo, referencia)`

### Uso no código (inferido)

- **Coluna de usuário:** o código tenta primeiro `user_id`, depois `usuario_id` (`processPendingWithdrawals.js`, `insertLedgerRow`). Em produção pode existir apenas uma das duas; o schema file usa `usuario_id`.
- **Tipos realmente usados no código:**  
  `deposito_aprovado`, `chute_miss`, `chute_aposta`, `chute_premio`, `withdraw_request`, `payout_confirmado`, `falha_payout`, `rollback`.  
  O CHECK do schema file **não** inclui: `deposito_aprovado`, `withdraw_request`, `chute_miss`, `chute_aposta`, `chute_premio`.  
  Conclusão: o schema no repositório está desatualizado em relação ao código; em produção o CHECK deve ter sido alterado ou removido, ou os inserts para esses tipos falhariam.

### Respostas diretas

- **Existe constraint que impede duplicidade?**  
  Sim: no schema file existe **unique index** `ledger_financeiro_correlation_tipo_ref_idx` em `(correlation_id, tipo, referencia)`. Assim, duplicata com mesma trinca é rejeitada pelo banco (insert falha com violação de unique).
- **Existe índice envolvendo correlation_id?**  
  Sim: no índice único `(correlation_id, tipo, referencia)`.
- **Existe índice envolvendo referencia?**  
  Sim: no mesmo índice único. Não há índice só em `referencia` no schema file.

---

## 2. Implementação de createLedgerEntry

**Arquivo:** `src/domain/payout/processPendingWithdrawals.js`  
**Linhas:** 64–99 (createLedgerEntry), 14–20 (toLedgerCorrelationId), 28–62 (insertLedgerRow).

### Parâmetros

- `supabase` — cliente Supabase
- `tipo` — string (tipo do lançamento)
- `usuarioId` — uuid do usuário
- `valor` — número (positivo ou negativo)
- `referencia` — string (id do pagamento, do chute, do saque, etc.)
- `correlationId` — string (normalizada para UUID pelo toLedgerCorrelationId quando não for UUID)

### Lógica interna

1. **Normalização:** `ledgerCorrelationId = toLedgerCorrelationId(correlationId)` — se não for UUID, gera UUID determinístico por SHA-256 da chave.
2. **Verificação pré-insert:**  
   `SELECT id FROM ledger_financeiro WHERE correlation_id = ? AND tipo = ? AND referencia = ?` (`.maybeSingle()`).
3. Se a query falhar → retorna `{ success: false, error: existingError }`.
4. Se já existir linha (`existing?.id`) → retorna `{ success: true, id: existing.id, deduped: true }` (não insere).
5. **Insert:** monta payload com `tipo`, `valor`, `referencia`, `correlation_id`, `created_at`; chama `insertLedgerRow(supabase, payloadBase, usuarioId)`.
6. `insertLedgerRow` usa coluna em cache (`user_id` ou `usuario_id`); na primeira vez tenta `user_id`, se falhar tenta `usuario_id`, grava em cache a que funcionar.
7. Se insert falhar → retorna `{ success: false, error }`.
8. Try/catch envolve tudo; em exceção retorna `{ success: false, error }`.

### Respostas diretas

- **createLedgerEntry faz UPSERT ou apenas INSERT?**  
  Apenas **INSERT**, após **SELECT** de deduplicação. Não há UPSERT (nem ON CONFLICT).
- **Existe verificação antes do insert?**  
  Sim: SELECT por `(correlation_id, tipo, referencia)`; se existir, retorna deduped sem inserir.
- **Existe retry interno?**  
  Não.
- **Existe tratamento de erro real?**  
  Sim: erros do SELECT e do INSERT são retornados em `{ success: false, error }`; exceções são capturadas e convertidas em mesmo formato. Não reverte saldo; o chamador decide o que fazer.

---

## 3. Pontos do código que geram ledger

Todos usam `createLedgerEntry` (importado de `processPendingWithdrawals.js` em server-fly.js).

| # | Arquivo | Função / contexto | Linha aprox. | tipo |
|---|---------|-------------------|--------------|------|
| 1 | server-fly.js | Webhook PIX (payment approved) | 2124 | deposito_aprovado |
| 2 | server-fly.js | reconcilePendingPayments | 2442 | deposito_aprovado |
| 3 | server-fly.js | POST /api/games/shoot (GOAL) | 1371 | chute_aposta |
| 4 | server-fly.js | POST /api/games/shoot (GOAL) | 1372 | chute_premio |
| 5 | server-fly.js | POST /api/games/shoot (MISS) | 1399 | chute_miss |
| 6 | server-fly.js | POST /api/withdraw/request | 1616 | withdraw_request |
| 7 | server-fly.js | Webhook Mercado Pago (payout approved) | 2243 | payout_confirmado |
| 8 | server-fly.js | Webhook Mercado Pago (payout rejected/cancelled) | 2291 | falha_payout |
| 9 | processPendingWithdrawals.js | rollbackWithdraw | 166 | rollback |
| 10 | processPendingWithdrawals.js | rollbackWithdraw (fee > 0) | 176 | rollback |
| 11 | processPendingWithdrawals.js | processPendingWithdrawals (payout falhou) | 387 | falha_payout |

**Referência e correlation usados:**

- Depósito: `referencia` e `correlationId` = id do registro em `pagamentos_pix`.
- Chute: `referencia` e `correlationId` = id do registro em `chutes` (refChute / chuteId).
- Saque request: `referencia` = saque.id, `correlationId` = header/idempotency.
- Payout/rollback: `referencia` = saqueId (ou `${saqueId}:fee` para fee); `correlationId` = saque.correlation_id.

---

## 4. Fluxos financeiros completos

Ordem real das operações (saldo vs ledger).

### DEPÓSITO (webhook PIX)

1. Claim atômico em `pagamentos_pix` (UPDATE status = 'approved').
2. SELECT saldo em `usuarios`.
3. **UPDATE** `usuarios.saldo` (crédito).
4. **createLedgerEntry** (deposito_aprovado).  
   Se falhar: apenas `console.warn`; saldo não é revertido.

**Saldo antes do ledger.** Não há transação SQL única envolvendo saldo + ledger; são operações independentes.

### DEPÓSITO (reconcilePendingPayments)

1. Claim atômico em `pagamentos_pix` por id do registro.
2. SELECT saldo em `usuarios`.
3. **UPDATE** `usuarios.saldo` (crédito).
4. **createLedgerEntry** (deposito_aprovado).  
   Se falhar: apenas `console.warn`.

**Saldo antes do ledger.** Operações independentes.

### CHUTE MISS

1. INSERT em `chutes` (com `.select('id').single()` → chuteId).
2. **UPDATE** `usuarios` (saldo, total_apostas) com lock otimista.
3. **createLedgerEntry** (chute_miss), somente se chuteId existir.

**Saldo antes do ledger.** Sem transação única.

### CHUTE GOAL

1. INSERT em `chutes` (chuteId).
2. **UPDATE** `usuarios` (saldo, total_apostas, total_ganhos).
3. **createLedgerEntry** (chute_aposta).
4. **createLedgerEntry** (chute_premio).

**Saldo antes do ledger.** Sem transação única.

### SAQUE (POST /api/withdraw/request)

1. **UPDATE** `usuarios.saldo` (débito, lock otimista).
2. INSERT em `saques`.
3. **createLedgerEntry** (withdraw_request).  
   Se falhar: chama **rollbackWithdraw** (restaura saldo + ledger rollback + atualiza saque).

**Saldo antes do ledger.** Se o ledger falhar, há reversão explícita (rollback).

### ROLLBACK (rollbackWithdraw)

1. SELECT saldo em `usuarios`.
2. **UPDATE** `usuarios.saldo` (restaura valor).
3. **createLedgerEntry** (rollback, valor principal).
4. Se fee > 0: **createLedgerEntry** (rollback, referencia `${saqueId}:fee`).
5. UPDATE `saques` (status rejeitado, etc.).

**Saldo antes do ledger.** Se createLedgerEntry falhar, não há retry nem reversão do saldo no próprio rollbackWithdraw.

### Respostas diretas

- **Saldo é atualizado antes ou depois do ledger?**  
  Em todos os fluxos, **saldo é atualizado antes** do(s) insert(s) no ledger.
- **Existe transação SQL envolvendo ambos?**  
  **Não.** Cada operação é um round-trip independente (Supabase/PostgREST).
- **Operações independentes?**  
  **Sim.** Não há BEGIN/COMMIT envolvendo update de saldo e insert no ledger.

---

## 5. Pontos de falha possíveis

Cenários em que **saldo já foi atualizado** e **ledger não é inserido** (ou não se sabe se foi):

| Cenário | Onde | Efeito |
|--------|------|--------|
| Erro Supabase no insert (rede, 5xx, constraint) | createLedgerEntry → insertLedgerRow | Retorna { success: false }; depósito/chute não revertem saldo. |
| Timeout entre update saldo e createLedgerEntry | Qualquer fluxo | Resposta pode não chegar; ledger pode não ser chamado ou não concluir. |
| Exception no Node após update e antes/durante createLedgerEntry | server-fly / rollbackWithdraw | Saldo já alterado; ledger pode não ser chamado ou falhar. |
| Crash do processo (kill, OOM) após update e antes de ledger | Qualquer fluxo | Saldo persistido; ledger não executado. |
| Falha de await (reject não tratado) antes do createLedgerEntry | Chamador não faz try/catch | Comportamento indefinido; pode não chegar ao ledger. |
| SELECT de dedup falhar (rede, timeout) | createLedgerEntry | Retorna erro; insert não é tentado; saldo já foi atualizado. |
| insertLedgerRow falhar por coluna errada (user_id vs usuario_id) | Primeira chamada por ambiente | Cache fica null; segunda tentativa com usuario_id; se ambas falharem, retorna erro. |
| Unique constraint violation (duplicata) | Insert | insert falha; createLedgerEntry retorna { success: false }; aplicação trata como falha (em saque faz rollback; em depósito/chute não reverte). |

**Rollback de saque:** Se rollbackWithdraw restaurar o saldo e depois createLedgerEntry(rollback) falhar, fica **saldo restaurado sem linha de rollback no ledger** (ledger órfão de “rollback esperado”).

---

## 6. Idempotência real

- **Depósito:**  
  Webhook e reconcile usam `referencia` e `correlationId` = id do registro em `pagamentos_pix`. createLedgerEntry deduplica por (correlation_id, tipo, referencia). O claim atômico garante que só um processador (webhook ou reconcile) altera o pagamento; o que gravar primeiro insere o ledger; o segundo encontra linha existente e retorna deduped. **Webhook duplicado** (mesmo payment_id) não cria segunda linha. **Retry manual** com mesmo payment_id também não duplica. **reconcilePendingPayments** para o mesmo pagamento já aprovado não credita saldo de novo (claim afeta 0 linhas) e, se por engano chamar createLedgerEntry com mesmo id, dedup evita segundo ledger.

- **Chute:**  
  referencia/correlationId = id do chute. Cada chute gera um insert em `chutes` com id novo. Retry do **mesmo** request HTTP sem idempotency key pode gerar **segundo** chute (segundo insert) e segundo par de updates/ledgers. O endpoint shoot **não** usa idempotency key; portanto **retry manual pode criar duplicidade de chute e de ledger** se o cliente reenviar o mesmo body. Dentro de uma única request: um chute, um id, um conjunto de ledgers; dedup por (correlation_id, tipo, referencia) evita apenas duplicata com **exatamente** a mesma trinca (ex.: mesmo chuteId duas vezes para chute_aposta).

- **Saque:**  
  correlationId vem de header (x-idempotency-key / x-correlation-id) ou UUID novo. Idempotência de saque é por correlation_id em `saques` (select existing withdraw); se já existe saque com esse correlation_id, retorna o existente sem debitar de novo. Ledger withdraw_request usa referencia = saque.id e correlationId do request; **retry com mesmo correlation_id** reutiliza o mesmo saque e não chama createLedgerEntry de novo (já retornou antes). **Webhook duplicado:** server-fly verifica se já existe ledger payout_confirmado ou falha_payout para (correlationId, saqueId); se existir, ignora. **reconcilePendingPayments** não cria ledger de saque; worker (processPendingWithdrawals) usa falha_payout + rollback; rollback usa mesmo correlationId do saque; createLedgerEntry deduplica por (correlation_id, tipo, referencia), então **segundo rollback para mesmo saque não insere segunda linha** de rollback.

---

## 7. Divergência possível saldo vs ledger

**Fórmula esperada:** saldo atual = soma dos `valor` em `ledger_financeiro` para o usuário (considerando saldo inicial zero ou saldo inicial + soma de ledger).

**Cenários em que saldo pode divergir do ledger:**

1. **Ledger falhou após update de saldo** (depósito, chute): saldo foi creditado/debitado e createLedgerEntry retornou erro ou não foi chamado → **saldo maior (ou menor) que a soma do ledger**.
2. **Rollback de saque:** saldo foi restaurado mas createLedgerEntry(rollback) falhou → **soma do ledger menor que o saldo** (falta o crédito de rollback no ledger).
3. **Crash entre update de saldo e createLedgerEntry:** mesmo efeito que (1).
4. **Ledger inserido mas saldo não atualizado:** teoricamente possível se o update de saldo falhar após o insert do ledger (em nenhum fluxo atual o ledger é escrito antes do saldo; em saque, se o ledger falhar, faz-se rollback de saldo). O único caso “ledger antes de saldo” seria um bug futuro ou fluxo alternativo.
5. **Duplicidade de ledger evitada por unique constraint:** segundo insert falha; aplicação pode interpretar como falha e, no saque, chamar rollbackWithdraw → saldo restaurado mas já existe uma linha withdraw_request no ledger → **divergência**: ledger tem withdraw_request, saldo foi “devolvido”.
6. **Múltiplos rollbacks para mesmo saque:** dedup evita segundo rollback no ledger; se por bug o saldo for restaurado duas vezes, **saldo maior que a soma do ledger**.

---

## 8. Ledgers órfãos

- **Ledger existente, saldo não atualizado:**  
  Não é o desenho atual (sempre saldo antes do ledger). Poderia ocorrer se, no futuro, alguém inserir no ledger sem passar pelo fluxo que atualiza saldo, ou se houver retry que insira ledger sem reaplicar o saldo.

- **Saldo atualizado, ledger inexistente:**  
  **Sim.** Sempre que:
  - createLedgerEntry não for chamado (crash, exception, timeout antes),
  - createLedgerEntry retornar success: false (insert falhou, SELECT de dedup falhou),
  - ou o insert falhar por constraint (ex.: unique) e o chamador não reverter saldo (depósito/chute não revertem).

Para **detectar**: comparar por usuário o saldo atual com a soma dos `valor` no ledger; ou listar movimentos “esperados” (pagamentos_pix aprovados, chutes, saques/rollbacks) e verificar existência do ledger correspondente.

---

## 9. Queries de reconciliação

Coluna de usuário no ledger: abaixo usa `user_id`; se produção usar apenas `usuario_id`, trocar `user_id` por `usuario_id` ou usar as duas com COALESCE.

### 1) Saldo divergente do ledger

```sql
-- Assumindo coluna de usuário = user_id (ou usuario_id)
WITH ledger_soma AS (
  SELECT user_id AS uid, SUM(valor) AS soma_ledger
  FROM ledger_financeiro
  GROUP BY user_id
)
SELECT u.id, u.saldo, COALESCE(l.soma_ledger, 0) AS soma_ledger,
       (u.saldo - COALESCE(l.soma_ledger, 0)) AS diff
FROM usuarios u
LEFT JOIN ledger_soma l ON l.uid = u.id
WHERE u.saldo IS DISTINCT FROM COALESCE(l.soma_ledger, 0);
```

(Se a coluna for `usuario_id`, substituir `user_id` por `usuario_id` em ledger_soma e no JOIN.)

### 2) Ledger duplicado (mesma trinca correlation_id, tipo, referencia)

```sql
SELECT correlation_id, tipo, referencia, COUNT(*) AS cnt
FROM ledger_financeiro
GROUP BY correlation_id, tipo, referencia
HAVING COUNT(*) > 1;
```

### 3) Ledger sem referencia válida

```sql
SELECT id, tipo, valor, referencia, correlation_id, created_at
FROM ledger_financeiro
WHERE referencia IS NULL OR TRIM(referencia) = '';
```

### 4) Ledger sem correlation_id

```sql
SELECT id, tipo, valor, referencia, created_at
FROM ledger_financeiro
WHERE correlation_id IS NULL OR TRIM(correlation_id) = '';
```

### 5) Ledger sem usuário (coluna de usuário nula)

```sql
SELECT id, tipo, valor, referencia, correlation_id, created_at
FROM ledger_financeiro
WHERE user_id IS NULL AND usuario_id IS NULL;
```

(Adaptar se a tabela tiver só uma das colunas.)

### 6) Chutes sem ledger (chutes sem linha chute_miss ou chute_aposta/chute_premio)

```sql
-- Chutes que não possuem nenhum ledger com referencia = chutes.id
SELECT c.id, c.usuario_id, c.resultado, c.valor_aposta, c.premio, c.premio_gol_de_ouro, c.created_at
FROM chutes c
WHERE NOT EXISTS (
  SELECT 1 FROM ledger_financeiro l
  WHERE (l.referencia = c.id::text OR l.referencia = c.id)
  AND l.tipo IN ('chute_miss', 'chute_aposta', 'chute_premio')
);
```

(Compatibilizar tipo de `c.id` com `referencia` conforme schema real.)

### 7) Depósitos aprovados sem ledger

```sql
SELECT p.id, p.usuario_id, p.amount, p.valor, p.status, p.created_at
FROM pagamentos_pix p
WHERE p.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM ledger_financeiro l
  WHERE l.referencia = p.id::text AND l.tipo = 'deposito_aprovado'
);
```

---

## 10. Requisitos para retry automático seguro

- **Não é necessário novo campo obrigatório** para retry básico: dá para usar `pagamentos_pix.id`, `chutes.id`, `saques.id` e `correlation_id` já existentes para identificar o que falta no ledger.

- **Fila de reconciliação:** útil para não reprocessar em loop e para priorização. Opcional; pode ser substituída por “tabela de inconsistências” (ver abaixo) com status (pendente/processando/concluído/erro).

- **Job worker:** sim. Um job periódico (ou sob demanda) que:
  1. Roda as queries de detecção (depósitos sem ledger, chutes sem ledger, saldo vs soma do ledger).
  2. Para cada inconsistência, chama createLedgerEntry com os mesmos parâmetros que o fluxo original (tipo, usuarioId, valor, referencia, correlationId). createLedgerEntry já é idempotente; se o ledger já tiver sido criado depois da detecção, o insert falhará por unique ou retornará deduped.

- **Tabela de inconsistências:** recomendável para auditoria e controle: registrar (user_id, tipo_evento, referencia, valor_esperado, status, created_at, resolved_at). O worker lê “pendentes”, tenta createLedgerEntry, e atualiza status. Evita reprocessar indefinidamente o mesmo evento e permite métricas.

- **Usar apenas queries de detecção:** sim, é possível. Um script que periodicamente executa as queries (1), (6), (7) e, para cada linha “sem ledger”, chama createLedgerEntry com os dados reconstruídos (ex.: para depósito: tipo deposito_aprovado, valor = pagamentos_pix.amount, referencia = pagamentos_pix.id, correlationId = pagamentos_pix.id; para chute: conforme resultado, chute_miss ou chute_aposta+chute_premio). Risco: se o evento for “saldo não foi atualizado” (ex.: falha antes do update), o retry só de ledger deixaria saldo e ledger consistentes apenas se o saldo tiver sido corrigido por outro meio. Por isso o ideal é: (a) detectar divergência saldo vs ledger, e (b) para “saldo atualizado mas ledger faltando”, fazer apenas o retry de ledger; para “ledger existe mas saldo não bate”, tratar como caso manual ou outro fluxo de correção.

**Resumo:** Retry seguro pode ser implementado com job + queries de detecção + chamadas idempotentes a createLedgerEntry. Tabela de inconsistências e (opcionalmente) fila ajudam a evitar duplicidade de trabalho e a auditar. Não é estritamente necessário novo campo na tabela ledger; os existentes (correlation_id, tipo, referencia) já suportam idempotência.

---

## 11. Classificação de risco financeiro

- **Pontos positivos:** Unique index (correlation_id, tipo, referencia) impede duplicata no banco; createLedgerEntry faz dedup em aplicação; saque reverte saldo se ledger falhar; depósito e chute usam referências estáveis (id do pagamento, id do chute).

- **Riscos:** (1) Saldo e ledger não estão em transação única → falha após update de saldo pode deixar ledger faltando. (2) Depósito e chute não revertem saldo se ledger falhar. (3) rollbackWithdraw não reverte o update de saldo se createLedgerEntry(rollback) falhar. (4) Schema no repositório desatualizado (CHECK de tipo e coluna user_id vs usuario_id) pode esconder diferenças de ambiente. (5) Chute sem idempotency key no endpoint permite duplicidade em retry do cliente.

**Classificação:** **MODERADO**

O desenho é auditável e a idempotência do ledger está bem definida; a principal fragilidade é a ausência de transação atômica entre saldo e ledger e a não reversão de saldo quando o ledger falha em depósito/chute/rollback. Para ambiente com volume e criticidade altas, evoluir para retry automático + detecção de divergência e, se possível, reduzir janela de falha (ex.: ledger o mais próximo possível do update, com retry automático para os casos detectados).
