# Patch GO — Status de depósito PIX (mínimo)

**Data:** 2026-03-02  
**Objetivo:** Corrigir a inconsistência de status do depósito PIX para permitir veredito **GO** sem regressão em /game nem em Depósito PIX. Apenas `server-fly.js` foi alterado.

---

## O problema

O patch de Saques PIX passou a usar a constante `PENDING` do domínio de saques (`withdrawalStatus`) em todo o `server-fly.js`. Em **depósito** PIX, isso fez o insert em `pagamentos_pix` gravar `status: PENDING` (= `'pendente'`), enquanto a função `reconcilePendingPayments` continuava filtrando com `.eq('status', 'pending')`. Novos depósitos ficavam com status `'pendente'` e não eram encontrados pelo reconciler, gerando risco de regressão e veredito **NO-GO**. O patch mínimo mantém o domínio de **saques** intacto e corrige apenas o fluxo de **depósito**: insert e resposta usam a string `'pending'`, e o reconciler aceita tanto `'pending'` quanto `'pendente'`.

---

## Alterações realizadas (apenas em `server-fly.js`)

### PATCH 1 — Insert e resposta de depósito PIX (POST /api/payments/pix/criar)

**Local:** handler `POST /api/payments/pix/criar`; insert em `pagamentos_pix` e objeto `data` da resposta JSON.

- **Insert (linha ~1837):** `status: PENDING` → `status: 'pending'`.
- **Resposta (linha ~1862):** `status: PENDING` → `status: 'pending'`.

Trecho após o patch (insert):

```javascript
.from('pagamentos_pix')
.insert({
  usuario_id: req.user.userId,
  external_id: String(payment.id),
  payment_id: String(payment.id),
  amount: parseFloat(amount),
  valor: parseFloat(amount),
  status: 'pending',
  qr_code: ...
})
```

Trecho após o patch (resposta):

```javascript
data: {
  id: payment.id,
  amount: parseFloat(amount),
  ...
  status: 'pending',
  created_at: new Date().toISOString()
}
```

### PATCH 2 — reconcilePendingPayments (depósito)

**Local:** função `reconcilePendingPayments`; query em `pagamentos_pix`.

- **Antes:** `.eq('status', 'pending')`
- **Depois:** `.in('status', ['pending', 'pendente'])`

Trecho após o patch:

```javascript
const { data: pendings, error: listError } = await supabase
  .from('pagamentos_pix')
  .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
  .in('status', ['pending', 'pendente'])
  .lt('created_at', sinceIso)
  ...
```

Assim, novos depósitos usam `'pending'` e o reconciler continua encontrando tanto registros antigos com `'pendente'` quanto novos com `'pending'`.

---

## Prova de não-regressão (/game não alterado)

Rotas críticas do /game permanecem inalteradas (nenhuma linha de handler foi modificada):

```
server-fly.js  1023:  app.get('/api/user/profile', authenticateToken, async (req, res) => {
server-fly.js  1168:  app.post('/api/games/shoot', authenticateToken, async (req, res) => {
server-fly.js  3139:  app.get('/api/fila/entrar', authenticateToken, async (req, res) => {
```

Nenhuma alteração foi feita em lógica de saque (tabela `saques`, constantes do domínio payout, webhook de saque, etc.); apenas o fluxo de **depósito** (tabela `pagamentos_pix` e `reconcilePendingPayments`) foi ajustado.

---

## Validação rápida

- `node -e "console.log('ok')"` → `ok`
- Presença do novo filtro no arquivo: `server-fly.js` contém `.in('status', ['pending', 'pendente'])` (linha 2360).

---

## Resumo do diff (apenas as duas correções)

1. **Insert e resposta em POST /api/payments/pix/criar:** uso de `status: 'pending'` em vez de `PENDING` (apenas para `pagamentos_pix` / depósito).
2. **reconcilePendingPayments:** filtro de status alterado de `.eq('status', 'pending')` para `.in('status', ['pending', 'pendente'])`.

Nenhum outro arquivo foi modificado.

### Evidência do diff (trechos)

**Alteração 1 — insert em pagamentos_pix (linha ~1837):**
```diff
-            status: PENDING,
+            status: 'pending',
```

**Alteração 2 — resposta JSON do mesmo handler (linha ~1862):**
```diff
-          status: PENDING,
+          status: 'pending',
```

**Alteração 3 — reconcilePendingPayments (linha ~2360):**
```diff
-      .eq('status', 'pending')
+      .in('status', ['pending', 'pendente'])
```

---

## Veredito final: **GO**

Com este patch mínimo:

- Depósito PIX volta a gravar e retornar `'pending'` e é reconciliado corretamente; registros já gravados com `'pendente'` continuam sendo considerados.
- Rotas do /game não foram tocadas.
- Lógica de saque permanece inalterada.

O veredito de não-regressão para o deploy do patch de Saques PIX (worker + reconciler + patch V1) passa a **GO**, desde que este ajuste de status de depósito esteja incluído no mesmo deploy.
