# Diagnóstico READ-ONLY — Saque PIX / Worker / Status (processando travado)

**Data:** 2026-03-02  
**Modo:** READ-ONLY. Nenhum arquivo alterado.  
**Objetivo:** Diagnosticar por que saques ficam travados em "processando" e por que colunas como `processed_at`/`transacao_id` podem não estar sendo preenchidas.

---

## 1) Referências ao fluxo de saque PIX e worker

### Arquivos localizados

| Arquivo | Papel |
|---------|--------|
| **server-fly.js** | Rota POST /api/withdraw/request, INSERT em saques, webhook Mercado Pago (UPDATE status), runProcessPendingWithdrawals (exportado; não chamado por setInterval no app). |
| **src/domain/payout/processPendingWithdrawals.js** | Lógica do worker: SELECT pendentes, UPDATE processando → createPixWithdraw → UPDATE aguardando_confirmacao ou rollback (UPDATE falhou). |
| **src/workers/payout-worker.js** | Processo standalone: setInterval que chama processPendingWithdrawals; usa createPixWithdraw de pix-mercado-pago. |
| **services/pix-mercado-pago.js** | createPixWithdraw (transfers MP); createPixPayment (depósito). Provedor: Mercado Pago. |
| **controllers/paymentController.js** | INSERT alternativo em saques (valor, chave_pix, tipo_chave, status 'pendente'). |
| **database/schema-ledger-financeiro.sql** | ADD COLUMN correlation_id em saques. |
| **database/corrigir-supabase-security-warnings.sql** | Função saques_sync_valor_amount (NEW.amount = NEW.valor). |

Não há referências a Asaas ou Gerencianet no fluxo de saque; apenas Mercado Pago (pix-mercado-pago.js).

### Todo UPDATE/INSERT na tabela `saques` e colunas escritas

| Arquivo | Linhas | Operação | Colunas escritas |
|---------|--------|----------|-------------------|
| **server-fly.js** | 1546-1565 | INSERT | usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status, created_at |
| **server-fly.js** | 2240 | UPDATE | status = 'processado' |
| **server-fly.js** | 2253 | UPDATE | status = 'aguardando_confirmacao' |
| **processPendingWithdrawals.js** | 189-195 | UPDATE | status = 'processando' |
| **processPendingWithdrawals.js** | 209-212 | UPDATE | status = 'aguardando_confirmacao' |
| **processPendingWithdrawals.js** | 88-92 (rollbackWithdraw) | UPDATE | status = 'falhou' |
| **paymentController.js** | 337-345 | INSERT | usuario_id, valor, chave_pix, tipo_chave, status |

**Colunas nunca escritas pelo código:** `processed_at`, `transacao_id`, `valor_liquido`, `taxa`, `motivo_rejeicao`, `updated_at` (apenas trigger no schema). O backend não preenche `processed_at` nem `transacao_id` em nenhum ponto.

---

## 2) Schema real da tabela `saques` no projeto

### Fonte principal: CREATE TABLE

**Arquivo:** `SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql` (L92-103)

```sql
CREATE TABLE IF NOT EXISTS public.saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    valor_liquido DECIMAL(10,2) NOT NULL,
    taxa DECIMAL(10,2) NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    tipo_chave VARCHAR(50) NOT NULL CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Colunas no Consolidado:** id, usuario_id, valor, valor_liquido, taxa, chave_pix, tipo_chave, status, created_at, updated_at.  
**Não há no Consolidado:** amount, fee, net_amount, correlation_id, pix_key, pix_type, processed_at, transacao_id, motivo_rejeicao.

### ALTER TABLE e colunas adicionais (outros arquivos)

| Arquivo | Alteração |
|---------|-----------|
| database/schema-ledger-financeiro.sql L18 | ADD COLUMN correlation_id text |
| APLICAR-SCHEMA-SUPABASE-FINAL.sql, SCHEMA-FORCA-CACHE-PIX-SAQUE.sql, etc. | ADD COLUMN amount, pix_key, pix_type (e depois NOT NULL após backfill) |

Nenhum CREATE/ALTER no repositório adiciona `processed_at` nem `transacao_id` na tabela saques; se existirem em PROD, vêm de migration externa ou manual.

### Constraint/CHECK para `status`

- **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql L99:**  
  `CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado'))`.

Outros schemas (SCHEMA-CORRECAO-COMPLETA-FINAL, SCHEMA-CORRECAO-ESPECIFICA-FINAL) usam ou citam status; o Consolidado é a referência principal no repo.

### Lista de colunas (consolidada no projeto)

| Coluna (schema Consolidado) | Coluna (código / outros SQL) | Observação |
|-----------------------------|------------------------------|------------|
| id | id | SERIAL PK |
| usuario_id | usuario_id | UUID, FK usuarios |
| valor | valor | INSERT em ambos os handlers |
| valor_liquido | — | Não enviada no INSERT (schema exige NOT NULL no Consolidado) |
| taxa | — | Não enviada no INSERT (schema exige NOT NULL no Consolidado) |
| chave_pix | chave_pix | INSERT |
| tipo_chave | tipo_chave | INSERT; CHECK cpf/cnpj/email/phone/random |
| status | status | INSERT/UPDATE; CHECK ver seção 3 |
| created_at | created_at | INSERT (server-fly) ou default |
| updated_at | updated_at | Apenas trigger update_updated_at_column |
| — | amount, fee, net_amount, correlation_id, pix_key, pix_type | Adicionados em outros SQL; usados no INSERT em server-fly.js |
| — | processed_at, transacao_id | Não existem no schema do repo; nunca escritas pelo código |

---

## 3) Status no código vs status permitido no banco

| Status usado no código | Onde (arquivo:linha) | Permitido no CHECK Consolidado? |
|------------------------|---------------------|----------------------------------|
| pendente | server-fly.js:1563, paymentController.js:344, processPendingWithdrawals.js:134 (filtro) | Sim |
| pending | server-fly.js:1478, 1651, 1836, 1861, 2349; processPendingWithdrawals.js:134, 193 | Não (CHECK = pendente, processando, aprovado, rejeitado) |
| processando | processPendingWithdrawals.js:191 | Sim |
| aguardando_confirmacao | processPendingWithdrawals.js:211, server-fly.js:2253 | Não |
| processado | server-fly.js:2191, 2240 | Não (CHECK tem 'aprovado', não 'processado') |
| falhou | processPendingWithdrawals.js:92, server-fly.js:2191 | Não (CHECK tem 'rejeitado', não 'falhou') |
| aprovado | — (só no CHECK) | Sim |
| rejeitado | — (só no CHECK) | Sim |

**CHECK no repositório (Consolidado):**  
`status IN ('pendente', 'processando', 'aprovado', 'rejeitado')`.

**Divergências:**

- Código grava **aguardando_confirmacao** → não está no CHECK → UPDATE pode falhar.
- Código grava **processado** → não está no CHECK (existe 'aprovado') → UPDATE pode falhar.
- Código grava **falhou** → não está no CHECK (existe 'rejeitado') → UPDATE pode falhar.
- Código filtra por **pending** (leitura); se algum registro tiver status 'pending', o CHECK do Consolidado não o permite em novos INSERTs; em PROD o CHECK pode ser diferente (ex.: incluir concluido, cancelado).

---

## 4) Pontos que podem deixar travado em "processando"

### 4.1 Ordem: UPDATE para 'processando' antes da chamada externa

**Evidência:** processPendingWithdrawals.js L189-206.

```javascript
const { data: locked, error: lockError } = await supabase
  .from('saques')
  .update({ status: 'processando' })
  .eq('id', saqueId)
  .in('status', ['pendente', 'pending'])
  ...
console.log('🟦 [PAYOUT][WORKER] Payout iniciado', ...);
const payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, ...);
```

O UPDATE para `processando` ocorre **antes** de createPixWithdraw. Se a chamada ao MP falhar ou o UPDATE seguinte falhar, o registro permanece em `processando`.

### 4.2 Try/catch que não reverte status em falha

**Evidência:** processPendingWithdrawals.js L207-221.

Após createPixWithdraw bem-sucedido, o código faz:

```javascript
const { error: awaitingError } = await supabase
  .from('saques')
  .update({ status: 'aguardando_confirmacao' })
  .eq('id', saqueId);
if (awaitingError) {
  console.error('❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:', awaitingError);
  ...
  return { success: false, error: awaitingError };
}
```

Se `awaitingError` for verdadeiro (ex.: violação de CHECK), o código **não** reverte o status para `pendente`; apenas retorna. O registro fica em `processando`. Não há try/catch que faça rollback do status nesse caminho.

### 4.3 UPDATE seguinte que pode falhar por constraint

**Evidência:** O UPDATE para `aguardando_confirmacao` (L209-212) é o primeiro UPDATE após o lock em `processando`. Se o banco tiver CHECK restritivo (apenas pendente, processando, aprovado, rejeitado), esse UPDATE falha e o row permanece em `processando`. O mesmo vale para rollbackWithdraw (L88-92): UPDATE `status = 'falhou'` pode falhar se 'falhou' não estiver no CHECK, deixando o registro em `processando`.

---

## 5) Evidências (trechos curtos)

### INSERT saques (server-fly.js L1546-1565)

```javascript
.insert({
  usuario_id: userId,
  valor: requestedAmount,
  amount: requestedAmount,
  fee: taxa,
  net_amount: valorLiquido,
  correlation_id: correlationId,
  pix_key: validation.data.pixKey,
  pix_type: validation.data.pixType,
  chave_pix: validation.data.pixKey,
  tipo_chave: validation.data.pixType,
  status: 'pendente',
  created_at: new Date().toISOString()
})
```

### Lock + chamada externa (processPendingWithdrawals.js L189-212)

```javascript
.update({ status: 'processando' })
.eq('id', saqueId)
.in('status', ['pendente', 'pending'])
...
const payoutResult = await createPixWithdraw(...);
if (payoutResult?.success === true) {
  const { error: awaitingError } = await supabase
    .from('saques')
    .update({ status: 'aguardando_confirmacao' })
    .eq('id', saqueId);
  if (awaitingError) {
    console.error('❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:', awaitingError);
    return { success: false, error: awaitingError };
  }
```

### Rollback (processPendingWithdrawals.js L88-92)

```javascript
await supabase
  .from('saques')
  .update({ status: 'falhou' })
  .eq('id', saqueId);
```

### CHECK status (SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql L99)

```sql
status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado'));
```

---

## 6) Resumo de colunas escritas e status

**Colunas escritas em INSERT/UPDATE em saques:**

- INSERT (server-fly): usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status, created_at.
- INSERT (paymentController): usuario_id, valor, chave_pix, tipo_chave, status.
- UPDATE (worker/webhook/rollback): apenas **status** (valores: processando, aguardando_confirmacao, processado, falhou).

**Colunas nunca escritas:** processed_at, transacao_id (e no Consolidado valor_liquido/taxa não são enviadas pelo INSERT atual).

**Status usados no código (escritos em saques):** pendente, processando, aguardando_confirmacao, processado, falhou.  
**Status permitidos no CHECK (Consolidado):** pendente, processando, aprovado, rejeitado.

---

## 7) Hipóteses

### Hipótese principal

**O UPDATE para `aguardando_confirmacao` (ou, no rollback, para `falhou`) falha por violação do CHECK de status no banco.** O worker já atualizou o registro para `processando`; em seguida tenta gravar `aguardando_confirmacao` ou `falhou`, valores que não existem no CHECK do schema Consolidado (pendente, processando, aprovado, rejeitado). O UPDATE falha, o código loga `Falha ao mover para aguardando_confirmacao` e retorna sem reverter o status, deixando o saque travado em `processando`. As colunas `processed_at` e `transacao_id` não são preenchidas porque o código nunca as utiliza em nenhum INSERT/UPDATE.

### Hipótese secundária 1

**createPixWithdraw falha (timeout, 4xx/5xx do MP, token inválido) e o rollback tenta UPDATE `status = 'falhou'`.** Se o CHECK não permitir `falhou`, esse UPDATE falha e o registro permanece em `processando`. O worker não tenta voltar para `pendente` nesse caso.

### Hipótese secundária 2

**O processo `payout_worker` não está rodando ou está com PAYOUT_PIX_ENABLED=false.** Nesse cenário não haveria novos registros saindo de pendente para processando; os que já estão em `processando` teriam sido deixados por uma execução anterior do worker (em que o UPDATE seguinte falhou por CHECK ou o processo caiu após o UPDATE para processando e antes do próximo UPDATE).

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo foi alterado.*
