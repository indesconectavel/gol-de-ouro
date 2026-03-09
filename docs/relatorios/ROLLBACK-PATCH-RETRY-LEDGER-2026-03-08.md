# ROLLBACK — PATCH RETRY DE LEDGER

**Data:** 2026-03-08  
**Escopo:** Reverter o mecanismo de reconciliação automática / retry de ledger falho.

---

## Quando usar

Use este rollback se for necessário remover o endpoint de reconciliação de ledger e o módulo de detecção/retry (por exemplo: decisão de tratar reconciliação por outro meio ou por job externo).

---

## Alterações a reverter

### 1. server-fly.js

**Remover** a linha de require do módulo de reconciliação:

```javascript
const { runReconcileMissingLedger } = require('./src/domain/ledger/reconcileMissingLedger');
```

**Remover** todo o bloco que contém:

- O comentário `// =====================================================`
- `// RECONCILIAÇÃO AUTOMÁTICA — RETRY DE LEDGER FALHO`
- até o fechamento da rota `app.post('/api/admin/reconcile-ledger', ...)` e o `});` correspondente.

Ou seja, remover desde:

```javascript
// =====================================================
// RECONCILIAÇÃO AUTOMÁTICA — RETRY DE LEDGER FALHO
// ...
app.post('/api/admin/reconcile-ledger', authenticateToken, async (req, res) => {
  ...
});
```

até o `});` que fecha essa rota, **mantendo** o trecho seguinte (Endpoint para verificar se sistema está em produção real).

### 2. Arquivo a apagar

- **src/domain/ledger/reconcileMissingLedger.js** — apagar o arquivo.

Se a pasta `src/domain/ledger` ficar vazia, pode opcionalmente removê-la.

---

## Aplicação manual do rollback

1. Abrir `server-fly.js`.
2. Remover a linha que faz require de `reconcileMissingLedger`.
3. Localizar o bloco da rota `POST /api/admin/reconcile-ledger` (entre o fim da rota `/api/admin/bootstrap` e o início de `app.get('/api/production-status'`) e removê-lo por completo.
4. Apagar o arquivo `src/domain/ledger/reconcileMissingLedger.js`.
5. Salvar e fazer deploy/reinício conforme processo do projeto.

Após o rollback, o endpoint `/api/admin/reconcile-ledger` deixa de existir e não haverá execução automática de detecção/retry de ledger pelo backend. A lógica de saldo, depósito, chute e saque permanece inalterada.
