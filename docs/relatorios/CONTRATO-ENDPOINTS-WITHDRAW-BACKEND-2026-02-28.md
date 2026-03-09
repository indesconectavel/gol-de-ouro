# Contrato dos endpoints de saque — Backend (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** Somente leitura. Nenhum arquivo alterado.  
**Objetivo:** Validar o contrato real de POST /api/withdraw/request e GET /api/withdraw/history.

---

## 1) Local exato onde as rotas de withdraw são registradas

**Arquivo:** `server-fly.js`  
**Router:** Não há arquivo de rotas separado; as rotas são registradas diretamente no Express com `app.post` e `app.get`.

**Trecho:**
```javascript
// Linha ~1388-1394
// SISTEMA DE SAQUES PIX COM VALIDAÇÃO
// Solicitar saque PIX
app.post('/api/withdraw/request', authenticateToken, async (req, res) => { ... });

// Linha ~1666-1667
// Buscar saques do usuário
app.get('/api/withdraw/history', authenticateToken, async (req, res) => { ... });
```

**Explicação:** As rotas de saque estão no **server-fly.js** (entrypoint Fly). Não há `router.js` ou `routes/withdraw.js`; tudo é inline no mesmo arquivo.

---

## 2) Controller/handler do POST /api/withdraw/request

### 2.1 Localização

- **Arquivo:** `server-fly.js`  
- **Linhas:** 1394–1665 (handler completo).

### 2.2 Campos obrigatórios do body

O handler lê **apenas** do `req.body`:

| Campo no body | Tipo esperado | Uso |
|---------------|----------------|-----|
| **valor** | number (ou string numérica) | Valor do saque em reais. Passado para o validator como `amount`. |
| **chave_pix** | string | Chave PIX de destino (CPF, CNPJ, e-mail, telefone ou chave aleatória). |
| **tipo_chave** | string | Tipo da chave: `cpf`, `cnpj`, `email`, `phone` ou `random`. |

**Trecho (linhas 1395–1411):**
```javascript
const { valor, chave_pix, tipo_chave } = req.body;
const userId = req.user.userId;
// ...
const withdrawData = {
  amount: valor,
  pixKey: chave_pix,
  pixType: tipo_chave,
  userId: userId
};
const validation = await pixValidator.validateWithdrawData(withdrawData);
```

**Explicação:** O backend espera **valor**, **chave_pix** e **tipo_chave**. Não usa `amount` nem `pixKey`/`pixType` no body; o mapeamento para o validator é interno.

### 2.3 Validações

1. **PixValidator** (`utils/pix-validator.js`, `validateWithdrawData`):  
   - Valor entre **0,50 e 1.000,00** (no validator); formato e disponibilidade da chave PIX conforme `tipo_chave`.  
   - Tipos aceitos: `cpf`, `cnpj`, `email`, `phone`, `random`.

2. **No handler (server-fly.js):**  
   - Valor mínimo **R$ 10,00** (linha 1420: `minWithdrawAmount = 10.00`).  
   - Taxa de saque: `PAGAMENTO_TAXA_SAQUE` (default 2.00); valor líquido deve ser > 0.  
   - Supabase conectado; idempotência por `correlation_id`; sem saque pendente para o usuário; saldo suficiente; débito de saldo com condição de concorrência (`eq('saldo', usuario.saldo)`).

**Trecho (validação valor mínimo, linhas 1420–1427):**
```javascript
const minWithdrawAmount = 10.00;
const requestedAmount = parseFloat(valor);
if (requestedAmount < minWithdrawAmount) {
  return res.status(400).json({
    success: false,
    message: `Valor mínimo para saque é R$ ${minWithdrawAmount.toFixed(2)}`
  });
}
```

### 2.4 Autenticação

- **Middleware:** `authenticateToken` (server-fly.js, linhas 349–371).  
- **Header:** `Authorization: Bearer <token>`.  
- **Token:** JWT verificado com `process.env.JWT_SECRET`; o payload deve conter **userId** (definido em `jwt.sign` como `userId: user.id`).  
- **Uso no handler:** `const userId = req.user.userId;`.

**Trecho (authenticateToken):**
```javascript
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
if (!token) return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  if (err) return res.status(403).json({ success: false, message: 'Token inválido' });
  req.user = user;
  next();
});
```

### 2.5 O que grava no banco

- **Tabela `usuarios`:**  
  - **Update** de `saldo` e `updated_at` (débito do valor solicitado) **na hora do request** (linhas 1530–1536). Condição de concorrência: `.eq('saldo', usuario.saldo)`.

- **Tabela `saques`:**  
  - **Insert** com: `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status: 'pendente'`, `created_at`.

- **Tabela `ledger_financeiro`:**  
  - Duas entradas via `createLedgerEntry`: uma para o saque (`tipo: 'saque'`, valor = valor solicitado, referencia = id do saque) e outra para a taxa (`tipo: 'taxa'`, referencia = `{id}:fee`).

**Trecho (insert saques, linhas 1546–1568):**
```javascript
const { data: saque, error: saqueError } = await supabase
  .from('saques')
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
  .select()
  .single();
```

### 2.6 Formato do response (sucesso)

- **Status:** 201 (criação nova) ou 200 (idempotência: saque já existente para o mesmo `correlation_id`).  
- **Corpo:**
```json
{
  "success": true,
  "message": "Saque solicitado com sucesso",
  "data": {
    "id": "<uuid do saque>",
    "amount": <number>,
    "fee": <number>,
    "net_amount": <number>,
    "pix_key": "<string normalizada>",
    "pix_type": "<string>",
    "status": "pending",
    "created_at": "<ISO string>",
    "correlation_id": "<string>"
  }
}
```

**Observação:** No 201 o handler envia `status: 'pending'` no JSON (linha 1655); na tabela o valor é `'pendente'`.

### 2.7 Headers opcionais (idempotência)

- **x-idempotency-key** ou **x-correlation-id**: se enviados, são usados como `correlationId`; caso contrário é gerado um `crypto.randomUUID()`. Mesmo `correlation_id` retorna o saque já existente (200) em vez de criar outro.

---

## 3) Handler do GET /api/withdraw/history

### 3.1 Localização

- **Arquivo:** `server-fly.js`  
- **Linhas:** 1667–1720.

### 3.2 Query / limites / ordenação

- **Query string:** Nenhum parâmetro é lido; não há paginação por query.  
- **Filtro:** `usuario_id = req.user.userId`.  
- **Ordenação:** `order('created_at', { ascending: false })`.  
- **Limite:** `.limit(50)`.

**Trecho (linhas 1678–1684):**
```javascript
const { data: saques, error: saquesError } = await supabase
  .from('saques')
  .select('*')
  .eq('usuario_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

### 3.3 Formato do response

- **Status:** 200.  
- **Corpo:** O array de saques está em **`data.saques`**; há também **`data.total`** (número de itens retornados).

```json
{
  "success": true,
  "data": {
    "saques": [ ... ],
    "total": <number>
  }
}
```

**Trecho (linhas 1693–1711):**
```javascript
const historico = (saques || []).map((row) => ({
  id: row.id,
  valor: row.valor ?? row.amount ?? 0,
  amount: row.amount ?? row.valor ?? 0,
  fee: row.fee ?? row.taxa ?? null,
  net_amount: row.net_amount ?? row.valor_liquido ?? null,
  status: row.status,
  pix_key: row.pix_key ?? row.chave_pix ?? null,
  pix_type: row.pix_type ?? row.tipo_chave ?? null,
  created_at: row.created_at
}));
res.json({
  success: true,
  data: {
    saques: historico,
    total: historico.length
  }
});
```

---

## 4) Lista de campos do item de histórico (cada elemento de `data.saques`)

| Campo        | Tipo   | Origem no banco / observação |
|-------------|--------|------------------------------|
| id          | string | row.id                       |
| valor       | number | row.valor ?? row.amount       |
| amount      | number | row.amount ?? row.valor       |
| fee         | number \| null | row.fee ?? row.taxa   |
| net_amount  | number \| null | row.net_amount ?? row.valor_liquido |
| status      | string | row.status (ex.: pendente, processando, processado, falhou) |
| pix_key     | string \| null | row.pix_key ?? row.chave_pix |
| pix_type    | string \| null | row.pix_type ?? row.tipo_chave |
| created_at  | string | row.created_at (ISO)         |

O frontend deve consumir **`response.data.data.saques`** (array) e, para exibição, usar por exemplo `amount` ou `valor`, `status`, `pix_key`, `pix_type`, `created_at`.

---

## 5) Atualização de saldo: no request ou só no payout?

- **No request (POST /api/withdraw/request):** O saldo **é debitado na hora**. O handler:  
  1. Lê `usuarios.saldo`;  
  2. Verifica se é suficiente;  
  3. Faz **update** em `usuarios` com `saldo: novoSaldo` (e `updated_at`) **antes** de inserir em `saques`;  
  4. Insere o saque com `status: 'pendente'`;  
  5. Registra entradas no `ledger_financeiro`.  

**Trecho (débito no request, linhas 1526–1544):**
```javascript
const novoSaldo = parseFloat(usuario.saldo) - requestedAmount;
const { data: saldoAtualizado, error: saldoUpdateError } = await supabase
  .from('usuarios')
  .update({ saldo: novoSaldo, updated_at: new Date().toISOString() })
  .eq('id', userId)
  .eq('saldo', usuario.saldo)
  .select('saldo')
  .single();
```

- **No payout:** O worker e o webhook Mercado Pago apenas **atualizam o status** do saque (`saques.status`: ex. `processado`, `aguardando_confirmacao`, `falhou`). Se falhar, o **rollback** devolve o saldo em `usuarios` (função `rollbackWithdraw` em `src/domain/payout/processPendingWithdrawals.js` e uso no webhook).  

**Conclusão:** O saldo é debitado **no request**; o payout não debita de novo, só confirma ou reverte (rollback).

---

## 6) Evidência das colunas/tabelas usadas

### 6.1 Tabela `saques`

- **Select (idempotência e pendentes):** `id`, `amount`, `valor`, `fee`, `net_amount`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`, `correlation_id`, `usuario_id`.  
- **Insert:** `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`.  
- **Update (worker/webhook):** `status` (ex.: `processado`, `aguardando_confirmacao`, `falhou`, `processando`).

### 6.2 Tabela `usuarios`

- **Select (saldo):** `saldo`.  
- **Update (débito no request):** `saldo`, `updated_at`.  
- **Condição:** `.eq('id', userId)` e, no update de débito, `.eq('saldo', usuario.saldo)`.

### 6.3 Tabela `ledger_financeiro`

- **Insert** (via `createLedgerEntry`): `tipo`, `usuario_id`, `valor`, `referencia`, `correlation_id`, `created_at`.  
- Tipos usados no fluxo de saque: `saque`, `taxa`, `rollback`, `payout_confirmado`, `falha_payout` (conforme processPendingWithdrawals e webhook).

**Resumo para mapping no frontend:**  
- **POST request:** body com `valor`, `chave_pix`, `tipo_chave`; header `Authorization: Bearer <token>`; opcional `x-idempotency-key` ou `x-correlation-id`. Resposta: `data.id`, `data.amount`, `data.fee`, `data.net_amount`, `data.pix_key`, `data.pix_type`, `data.status`, `data.created_at`, `data.correlation_id`.  
- **GET history:** mesmo header de auth; resposta: **`data.saques`** (array) e **`data.total`**; cada item com `id`, `valor`/`amount`, `fee`, `net_amount`, `status`, `pix_key`, `pix_type`, `created_at`.

---

**Fim do relatório.** Nenhum arquivo foi alterado.
