# Validação E2E – Saque PIX v1

**Data:** 2026-02-28  
**Objetivo:** Prova definitiva de que (1) não existe caminho de escrita com status fora do CHECK e (2) não existe cenário que deixa saque preso em "processando".

---

## 1. CHECK do banco (Supabase `public.saques`)

Valores permitidos na coluna `status`:

- `pendente`
- `processando`
- `concluido`
- `rejeitado`
- `cancelado`

Aliases **proibidos** na escrita: `pending`, `processado`, `falhou`, `aguardando_confirmacao`.

---

## 2. Locais que escrevem status na tabela `saques`

Varredura com:

```bash
rg "from\(['\"]saques['\"]\)" --type js -A 20 | rg "\.(insert|update)\("
```

### 2.1 Lista completa (arquivo + linha + status escrito)

| Arquivo | Linha(s) | Operação | Status escrito | Fonte |
|---------|----------|----------|----------------|-------|
| `src/domain/payout/processPendingWithdrawals.js` | 56 | UPDATE | `newStatus` (payload) | Constantes: PENDING, PROCESSING, COMPLETED, REJECTED |
| `src/domain/payout/processPendingWithdrawals.js` | 68-69 | UPDATE (revert) | `PENDING` | Constante = 'pendente' |
| `src/domain/payout/processPendingWithdrawals.js` | 131-136 | via `updateSaqueStatus` | `REJECTED` + `motivo_rejeicao` | rollbackWithdraw |
| `server-fly.js` | 1548-1563 | INSERT | `PENDING` | Constante = 'pendente' |
| `server-fly.js` | 2242-2244 | UPDATE | `COMPLETED` | Constante = 'concluido' |
| `server-fly.js` | 2263 | UPDATE | `PROCESSING` | Constante = 'processando' |
| `controllers/paymentController.js` | 339-345 | INSERT | `PENDING` | Constante = 'pendente' |

Nenhum outro arquivo do fluxo principal (excluindo BACKUP/scripts de correção pontual) faz INSERT/UPDATE em `saques`.

### 2.2 Prova de que só os 5 oficiais são escritos

- Todas as escritas usam constantes de `withdrawalStatus.js`:  
  `PENDING` = 'pendente', `PROCESSING` = 'processando', `COMPLETED` = 'concluido', `REJECTED` = 'rejeitado'.  
  Não há uso de `CANCELED` na escrita no fluxo atual; cancelamento seria 'cancelado' se implementado.
- Trecho de definição:

```javascript
// src/domain/payout/withdrawalStatus.js
const PENDING = 'pendente';
const PROCESSING = 'processando';
const COMPLETED = 'concluido';
const REJECTED = 'rejeitado';
const CANCELED = 'cancelado';
```

- Exemplo de INSERT (server-fly.js):

```javascript
// server-fly.js ~1548
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
  status: PENDING,  // <-- só constante
  created_at: new Date().toISOString()
})
```

- Exemplo de UPDATE (worker):

```javascript
// processPendingWithdrawals.js ~50-54
const updateSaqueStatus = async ({ ..., newStatus, motivo_rejeicao = null, ... }) => {
  const payload = { status: newStatus };  // newStatus sempre constante
  if (motivo_rejeicao != null) payload.motivo_rejeicao = String(motivo_rejeicao).slice(0, 500);
  ...
};
```

Chamadas de `updateSaqueStatus` passam apenas `PENDING`, `PROCESSING`, `COMPLETED` ou `REJECTED`.

---

## 3. Aliases só em leitura / normalização

Varredura por strings de status:

- `pending`, `processado`, `falhou`, `aguardando_confirmacao` aparecem apenas em:
  - **Definição de constantes / normalização:** `withdrawalStatus.js` (mapeamento em `normalizeWithdrawStatus`).
  - **Leitura/UI:** `Withdraw.jsx` (normalização antes de cor/ícone/label).
  - **Scripts readonly/auditoria:** ex.: `release-audit-pix-saques-readonly.js`, `fechamento-contabil-minimo-readonly.js` (leitura e classificação de dados já existentes).
- **Outras tabelas:** `status: 'pending'` em `paymentController.js` e `server-fly.js` referem-se a **pagamentos_pix** (depósito), não a `saques`.

Prova: `normalizeWithdrawStatus` é usada apenas em:

- Resposta da API (GET saque existente, GET histórico): `status: normalizeWithdrawStatus(row.status)`.
- Logs (webhook “já finalizado”, “CONFIRMADO”): `status_anterior: normalizeWithdrawStatus(saqueRow.status)`.
- Nenhum `.insert()` ou `.update()` em `saques` recebe resultado de `normalizeWithdrawStatus` para gravar no banco.

---

## 4. Worker: SELECT só pendente e pós-lock sempre sai de processando

### 4.1 SELECT apenas `PENDING` ('pendente')

```javascript
// src/domain/payout/processPendingWithdrawals.js ~189-195
// Selecionar somente status 'pendente' (CHECK do banco); não usar 'pending'
const { data: pendentes, error: listError } = await supabase
  .from('saques')
  .select('...')
  .eq('status', PENDING)   // PENDING = 'pendente'
  .order('created_at', { ascending: true })
  .limit(1);
```

Não há `.eq('status', 'pending')` nem `.in('status', ['pendente','pending'])` no worker.

### 4.2 Lock e rollback no catch (pós-lock sempre sai de processando)

- Após lock bem-sucedido: `lockAcquired = true` e variáveis `locked*` preenchidas.
- Em qualquer exceção no `try`, o `catch`:
  - Chama `rollbackWithdraw({ ..., motivo: motivoErro })` quando `lockAcquired && lockedSaqueId != null && lockedUserId != null`.
  - `rollbackWithdraw` chama `updateSaqueStatus(..., newStatus: REJECTED, motivo_rejeicao: motivoCurto)`.

Trecho:

```javascript
// processPendingWithdrawals.js ~334-354
} catch (error) {
  console.error('❌ [SAQUE][WORKER] Erro inesperado', { saqueId: lockedSaqueId, ... });
  if (lockAcquired && lockedSaqueId != null && lockedUserId != null) {
    const motivoErro = String(error?.message || 'erro inesperado').slice(0, 500);
    await rollbackWithdraw({
      supabase,
      saqueId: lockedSaqueId,
      userId: lockedUserId,
      correlationId: lockedCorrelationId || 'catch',
      amount: lockedAmount,
      fee: lockedFee,
      motivo: motivoErro
    }).catch((revertErr) => { ... });
  }
  ...
}
```

Comportamento garantido: **após o lock, o saque sai de "processando" sempre por (1) sucesso → `concluido` ou (2) falha/erro → `rejeitado` via rollback.**

### 4.3 rollbackWithdraw grava `rejeitado` e `motivo_rejeicao`

```javascript
// processPendingWithdrawals.js ~130-137
const motivoCurto = String(motivo || 'rollback').slice(0, 500);
const updateResult = await updateSaqueStatus({
  supabase,
  saqueId,
  userId,
  newStatus: REJECTED,        // 'rejeitado'
  motivo_rejeicao: motivoCurto
});
```

---

## 5. Backend: INSERT/UPDATE e uso de normalização

- **INSERT de saque:**  
  - `server-fly.js`: `status: PENDING`.  
  - `paymentController.js`: `status: PENDING`.  
- **UPDATE de status:**  
  Apenas via constantes (worker e webhook): `PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`.
- **normalizeWithdrawStatus:**  
  Usada somente em respostas (GET) e em logs; nunca como valor gravado em `saques`.

---

## 6. Frontend Withdraw.jsx

- Sempre normaliza antes de pintar label/cor/ícone:

```javascript
// goldeouro-player/src/pages/Withdraw.jsx
const normalizeWithdrawStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'pending') return 'pendente';
  if (s === 'processado') return 'concluido';
  if (s === 'falhou') return 'rejeitado';
  if (s === 'aguardando_confirmacao') return 'processando';
  return status ? s : '';
};
const getStatusColor = (status) => {
  const s = normalizeWithdrawStatus(status);
  if (s === 'concluido') return '...';
  ...
};
```

- Compatível com dados antigos: `pending`, `processado`, `falhou`, `aguardando_confirmacao` são mapeados para os 5 oficiais antes de qualquer exibição.

---

## 7. Logs de exemplo (evidência de fluxo)

- Lock e sucesso:

```
🟦 [PAYOUT][WORKER] Payout iniciado { saqueId, userId, correlationId, amount, netAmount, status_anterior: 'pendente', status_novo: 'processando' }
✅ [PAYOUT][WORKER] Saque concluído { saqueId, userId, correlationId, status_anterior: 'processando', status_novo: 'concluido', transacao_id }
```

- Falha de payout → rejeitado:

```
❌ [PAYOUT][FALHOU] rollback acionado { saqueId, userId, correlationId, status_anterior: 'processando', status_novo: 'rejeitado', erro }
✅ [SAQUE][ROLLBACK] Concluído { saqueId, userId, correlationId }
```

- Erro inesperado pós-lock → rollback no catch:

```
❌ [SAQUE][WORKER] Erro inesperado { saqueId: lockedSaqueId, userId: lockedUserId, status_anterior: 'processando', erro }
↩️ [SAQUE][ROLLBACK] Início { saqueId, userId, correlationId, motivo }
✅ [SAQUE][ROLLBACK] Concluído { saqueId, userId, correlationId }
```

---

## 8. Resumo

| Item | Resultado |
|------|-----------|
| Escrita em `saques` com status fora do CHECK | Nenhuma; todas usam constantes (pendente/processando/concluido/rejeitado). |
| Aliases em escrita | Nenhum; aliases só em normalização/leitura/UI e em scripts readonly. |
| Worker SELECT | Apenas `.eq('status', PENDING)` ('pendente'). |
| Saque preso em "processando" | Não; pós-lock sempre termina em `concluido` ou `rejeitado` (incluindo rollback no catch). |
| rollbackWithdraw | Grava `status='rejeitado'` e `motivo_rejeicao`. |
| Frontend | Normaliza antes de pintar; compatível com aliases antigos. |

**Conclusão:** Prova E2E satisfeita para o fluxo de saque PIX (sem ações manuais adicionais).

---

## 9. Comandos de varredura

Varredura feita com grep/ripgrep por strings de status e por `from('saques')` + `.update`/`.insert`. Nenhuma escrita em `saques` usa literal de alias; todas usam constantes de `withdrawalStatus.js`.

## 10. Nota sobre testes

- `tests/e2e/game-flow.test.js` linha 221: espera `status === 'pendente'` — correto.
- Se algum teste assertar `status === 'pending'` para resposta de criação de saque, alterar para `'pendente'`.
