# Correção da integração da tela de saque (frontend) — V1

**Data:** 2026-03-06  
**Escopo:** Apenas tela de saque; sem alteração em /game, login, depósito PIX, backend ou Vercel.

---

## 1) Resumo

A tela de saque foi corrigida para usar o fluxo de saque do backend (`POST /api/withdraw/request` e `GET /api/withdraw/history`) em vez do fluxo de depósito PIX (`paymentService.createPix` e `getUserPix`).

---

## 2) Arquivos alterados

| Arquivo | Ação |
|--------|------|
| `goldeouro-player/src/services/withdrawService.js` | **Criado** — serviço com `requestWithdraw` e `getWithdrawHistory` |
| `goldeouro-player/src/config/api.js` | **Alterado** — adicionados `WITHDRAW_REQUEST` e `WITHDRAW_HISTORY` |
| `goldeouro-player/src/pages/Withdraw.jsx` | **Alterado** — submit e histórico passam a usar withdrawService |

**Não alterados:** `paymentService.js`, rotas /game, login, depósito, backend, Vercel.

---

## 3) Diff resumido

### withdrawService.js (novo)
- `requestWithdraw(amount, pixKey, pixType)` → `POST /api/withdraw/request` com body `{ valor, chave_pix, tipo_chave }`.
- `getWithdrawHistory()` → `GET /api/withdraw/history`; normaliza resposta para o formato da UI (amount, method, pixKey, date, status em português).

### config/api.js
- Inclusão de:
  - `WITHDRAW_REQUEST: '/api/withdraw/request'`
  - `WITHDRAW_HISTORY: '/api/withdraw/history'`

### Withdraw.jsx
- Import: `import { requestWithdraw, getWithdrawHistory } from '../services/withdrawService'`.
- `loadWithdrawalHistory`: de `paymentService.getUserPix()` para `getWithdrawHistory()`.
- `handleSubmit`: de `paymentService.createPix(...)` para `requestWithdraw(amount, formData.pixKey, formData.pixType)`.
- Após sucesso: chama `loadUserData()` e `loadWithdrawalHistory()` (saldo e histórico vindos do backend).

---

## 4) Fluxo antigo (errado)

```
Tela de saque (Withdraw.jsx)
  → handleSubmit()
  → paymentService.createPix(amount, pixKey, description)
  → POST /api/payments/pix/criar  (depósito)
Histórico:
  → loadWithdrawalHistory()
  → paymentService.getUserPix()
  → GET /api/payments/pix/usuario  (lista de depósitos)
```

---

## 5) Fluxo novo (correto)

```
Tela de saque (Withdraw.jsx)
  → handleSubmit()
  → requestWithdraw(amount, pixKey, pixType)
  → POST /api/withdraw/request
Histórico:
  → loadWithdrawalHistory()
  → getWithdrawHistory()
  → GET /api/withdraw/history
```

---

## 6) Por que isso não afeta /game, login nem depósito

- **/game:** Nenhum import ou rota de jogo foi tocado; apenas `Withdraw.jsx`, `withdrawService.js` e `config/api.js` (novos endpoints de saque).
- **Login:** Não alterado.
- **Depósito PIX:** `paymentService.js` e todas as chamadas a `createPix`/`getUserPix` fora da tela de saque permanecem iguais. A tela de depósito continua usando `paymentService.createPix` e endpoints `/api/payments/pix/*`.

---

## 7) Plano de rollback

1. Reverter os commits da correção (ver SHA no checklist).
2. Ou manualmente:
   - Remover `goldeouro-player/src/services/withdrawService.js`.
   - Em `config/api.js`, remover as linhas `WITHDRAW_REQUEST` e `WITHDRAW_HISTORY`.
   - Em `Withdraw.jsx`:
     - Remover o import de `withdrawService`.
     - Em `loadWithdrawalHistory`, voltar a usar `paymentService.getUserPix()` e o mapeamento anterior de `result.data`.
     - Em `handleSubmit`, voltar a usar `paymentService.createPix(amount, formData.pixKey, ...)` e, após sucesso, `setBalance(prev => prev - amount)` e `loadWithdrawalHistory()` (sem `loadUserData()` no meio).

---

*Relatório da correção V1 da tela de saque. Commit SHA(s) no checklist.*
