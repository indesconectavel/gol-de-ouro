# Diagnóstico — Erro 500 "Erro ao registrar saque"

**Data:** 2026-03-04  
**Objetivo:** Descobrir exatamente por que POST /api/withdraw/request retorna "Erro ao registrar saque".

---

## 1) Código completo da rota

A rota está em **server-fly.js**, linhas **1386–1656**:

```text
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    // 1) Extrai body e userId
    const { valor, chave_pix, tipo_chave } = req.body;
    const userId = req.user.userId;
    const correlationId = ... (header ou UUID)

    // 2) Validação PixValidator (valor, chave PIX, disponibilidade)
    const validation = await pixValidator.validateWithdrawData(withdrawData);
    if (!validation.valid) return 400 (validation.error);

    // 3) Valor mínimo R$ 10
    if (requestedAmount < 10) return 400;

    // 4) Checagem dbConnected/supabase → 503 se não

    // 5) Idempotência por correlation_id (select saques) → 500 se erro, 200 se já existe

    // 6) Bloqueio saque duplicado pendente (select saques por usuario_id, status pendente/pending) → 500/409

    // 7) Verificação saldo (select usuarios.saldo) → 404 se usuário não existe, 400 se saldo insuficiente

    // 8) Cálculo taxa (PAGAMENTO_TAXA_SAQUE), valorLiquido → 400 se <= 0

    // 9) Débito de saldo (update usuarios com .eq('saldo', usuario.saldo)) → 409 se conflito

    // 10) INSERT em saques (campos abaixo) → se saqueError: rollback saldo, return 500 "Erro ao criar saque"

    // 11) createLedgerEntry(tipo: 'saque') → se !success: rollbackWithdraw, return 500 "Erro ao registrar saque"

    // 12) createLedgerEntry(tipo: 'taxa') → se !success: rollbackWithdraw, return 500 "Erro ao registrar saque"

    // 13) 201 + data do saque
  } catch (error) {
    return 500 "Erro interno do servidor"
  }
});
```

---

## 2) Função que cria o saque no banco

O saque é criado **no próprio handler** da rota, com **Supabase**:

- **Arquivo:** server-fly.js  
- **Linhas:** 1537–1561  
- **Chamada:** `supabase.from('saques').insert({ ... }).select().single()`

Não existe uma função separada tipo `createWithdraw()`; o `insert` é feito diretamente no handler.

Em caso de erro nesse `insert`, a resposta é **"Erro ao criar saque"** (linhas 1562–1575), não "Erro ao registrar saque".

---

## 3) Tabela usada

- **Saque:** tabela **`saques`** (select para idempotência e pendentes, insert para novo saque).
- **Ledger:** tabela **`ledger_financeiro`** (insert via `createLedgerEntry`, em **src/domain/payout/processPendingWithdrawals.js**).

A mensagem **"Erro ao registrar saque"** não vem do insert em `saques`; vem do **registro no ledger** (passos 11 ou 12).

---

## 4) Campos obrigatórios no INSERT do saque

O insert em **saques** (server-fly.js 1539–1559) envia:

| Campo            | Origem                    | Obrigatório no código |
|------------------|----------------------------|------------------------|
| usuario_id       | userId (req.user.userId)   | Sim                    |
| valor            | requestedAmount            | Sim                    |
| amount           | requestedAmount            | Sim                    |
| fee              | taxa                       | Sim                    |
| net_amount       | valorLiquido               | Sim                    |
| correlation_id   | correlationId              | Sim                    |
| pix_key          | validation.data.pixKey     | Sim                    |
| pix_type         | validation.data.pixType    | Sim                    |
| chave_pix        | validation.data.pixKey     | Sim                    |
| tipo_chave       | validation.data.pixType    | Sim                    |
| status           | 'pendente'                 | Sim                    |
| created_at       | new Date().toISOString()   | Sim                    |

Se o **schema** da tabela `saques` exiger outros campos (ex.: NOT NULL sem default) ou tiver CHECK/constraint que rejeite algum valor, o insert falha e a API retorna **"Erro ao criar saque"**, não "Erro ao registrar saque".

---

## 5) Valor mínimo de saque

- **Linhas:** 1413–1420 (server-fly.js).  
- **Valor mínimo:** **R$ 10,00** (`minWithdrawAmount = 10.00`).  
- Se `requestedAmount < minWithdrawAmount` → **400** com mensagem `"Valor mínimo para saque é R$ 10.00"`.

---

## 6) Verificação de saldo

- **Linhas:** 1486–1507 (server-fly.js).  
- **Fluxo:** select em `usuarios` por `id = userId` para obter `saldo`.  
- Se usuário não existe ou erro no select → **404** "Usuário não encontrado".  
- Se `parseFloat(usuario.saldo) < requestedAmount` → **400** "Saldo insuficiente".  
- Em seguida (1518–1525) é feito update de saldo com `.eq('saldo', usuario.saldo)`; se outro request alterou o saldo, o update não afeta linhas e retorna 409 "Saldo atualizado recentemente. Tente novamente."

---

## 7) Onde exatamente sai "Erro ao registrar saque"

A string **"Erro ao registrar saque"** aparece **só** em dois pontos, ambos após o insert em `saques` ter **sucesso**:

| Local   | Linhas (server-fly.js) | Condição |
|--------|-------------------------|----------|
| Bloco 1 | 1585–1600               | `createLedgerEntry` para **tipo 'saque'** retorna `!ledgerDebit.success` |
| Bloco 2 | 1611–1626               | `createLedgerEntry` para **tipo 'taxa'** retorna `!ledgerFee.success` |

Ou seja: o 500 "Erro ao registrar saque" indica falha no **registro contábil no ledger** (insert em `ledger_financeiro`), não na criação do saque em `saques`.

---

## 8) Por que createLedgerEntry pode falhar

`createLedgerEntry` está em **src/domain/payout/processPendingWithdrawals.js** (linhas 41–74).

Fluxo resumido:

1. Select em `ledger_financeiro` por `correlation_id`, `tipo`, `referencia` (dedup). Se `existingError` → retorna `{ success: false, error }`.
2. Se já existe linha com esses dados → retorna success (deduped).
3. Monta `payloadBase`: `tipo`, `valor`, `referencia`, `correlation_id`, `created_at`.
4. Chama **insertLedgerRow(supabase, payloadBase, usuarioId)**.
5. Se `insertLedgerRow` falha → retorna `{ success: false, error }`.
6. Qualquer exceção no try → `catch` retorna `{ success: false, error }`.

**insertLedgerRow** (linhas 11–37):

- Se já tem cache `ledgerUserIdColumn`: faz um único insert com `[ledgerUserIdColumn]: usuarioId`.
- Senão: tenta insert com **user_id**; se falhar, tenta com **usuario_id**; grava em cache a coluna que funcionar.
- Se **os dois** inserts falharem → retorna `{ success: false, error }` (o último erro).

Possíveis causas de falha no ledger (e portanto "Erro ao registrar saque"):

1. **Coluna de usuário:** a tabela `ledger_financeiro` em produção tem **user_id** OU **usuario_id**; o código tenta os dois. Se a tabela tiver outro nome (ex.: `usuario_id` com underscore diferente) ou só uma coluna que não seja essas duas, ambos os inserts podem falhar (ex.: "column does not exist" ou "null value in column \"user_id\" violates not-null constraint" no ambiente que tem a outra coluna).
2. **RLS (Row Level Security):** política no Supabase pode negar o insert em `ledger_financeiro` mesmo com service role (dependendo da configuração).
3. **Outras constraints:** NOT NULL em outra coluna não preenchida, CHECK, FK, etc.
4. **Erro no select de dedup:** `existingError` (ex.: coluna inexistente, permissão).
5. **Exceção não esperada** dentro de `createLedgerEntry` (ex.: parseFloat, tipo de dado).

O hotfix do ledger (airbag `user_id` / `usuario_id`) foi feito justamente para quando produção tem `user_id` e outros ambientes `usuario_id`; se mesmo assim ambos falharem, o motivo estará em `insertResult.error` (e nos logs `[LEDGER] insert falhou (airbag)` com step e message).

---

## 9) Resumo diagnóstico

| Pergunta | Resposta |
|----------|----------|
| Onde está a rota? | server-fly.js, linhas 1386–1656. |
| Quem cria o saque no banco? | O próprio handler com `supabase.from('saques').insert(...)`. |
| Tabela do saque? | **saques**. |
| Tabela do “registro” que gera a mensagem de erro? | **ledger_financeiro** (via createLedgerEntry). |
| Campos obrigatórios no insert do saque? | usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status, created_at. |
| Valor mínimo? | R$ 10,00 (retorno 400 se menor). |
| Verificação de saldo? | Sim: select em usuarios, 400 se saldo insuficiente; update com .eq('saldo', usuario.saldo) para evitar concorrência. |
| Por que "Erro ao registrar saque"? | Sempre que **createLedgerEntry** (insert em ledger_financeiro) falha **depois** do saque já ter sido criado em `saques` — seja no débito (tipo 'saque') ou na taxa (tipo 'taxa'). |
| Próximo passo para confirmar causa | Ver nos logs do Fly o texto `❌ [SAQUE] Erro ao registrar ledger` e o detalhe em `[LEDGER] insert falhou (airbag)` (step: user_id / usuario_id, code, message) e, se possível, o objeto `insertResult.error` / `saqueError` para ver código e mensagem exata do Supabase. |

---

## 10) Mensagens de erro distintas

| Mensagem retornada pela API | Onde ocorre | Tabela / etapa |
|-----------------------------|------------|-----------------|
| "Erro ao verificar idempotência do saque" | Erro no select por correlation_id em saques | saques |
| "Erro ao verificar saques pendentes" | Erro no select de pendentes por usuario_id | saques |
| "Erro ao criar saque" | Erro no **insert** em saques | saques |
| **"Erro ao registrar saque"** | Falha em **createLedgerEntry** (débito ou taxa) | **ledger_financeiro** |
| "Erro interno do servidor" | Qualquer exceção não tratada no try da rota | — |

Conclusão: para o 500 com **"Erro ao registrar saque"**, é necessário inspecionar a falha no insert em **ledger_financeiro** (createLedgerEntry / insertLedgerRow) via logs e, se possível, schema e políticas RLS da tabela no Supabase.
