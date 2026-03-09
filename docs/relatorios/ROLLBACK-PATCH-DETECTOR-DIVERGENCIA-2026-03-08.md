# ROLLBACK — PATCH DETECTOR DE DIVERGÊNCIA SALDO VS LEDGER

**Data:** 2026-03-08  

---

## Quando usar

Use este rollback para remover o detector de divergência saldo vs ledger (endpoint e módulo), mantendo apenas leitura e relatório em outro meio se desejado.

---

## Alterações a reverter

### 1. server-fly.js

**Remover** o require do detector:

```javascript
const { detectBalanceLedgerMismatch } = require('./src/domain/ledger/detectBalanceLedgerMismatch');
```

**Remover** todo o bloco da rota `POST /api/admin/check-ledger-balance`:

- Desde o comentário `// =====================================================`
- `// DETECTOR DE DIVERGÊNCIA SALDO VS LEDGER (somente leitura)`
- até o fechamento `});` da rota, **mantendo** o trecho seguinte (`app.get('/api/production-status'`).

### 2. Arquivo a apagar

- **src/domain/ledger/detectBalanceLedgerMismatch.js**

---

## Aplicação manual

1. Abrir `server-fly.js`, remover a linha que faz require de `detectBalanceLedgerMismatch`.
2. Localizar e remover o bloco completo da rota `POST /api/admin/check-ledger-balance` (entre o fim de `reconcile-ledger` e o início de `production-status`).
3. Apagar `src/domain/ledger/detectBalanceLedgerMismatch.js`.
4. Salvar e fazer deploy/reinício conforme processo do projeto.

Após o rollback, o endpoint `/api/admin/check-ledger-balance` deixa de existir. Nenhum fluxo financeiro é alterado.
