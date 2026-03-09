# Validação READ-ONLY — Tela de Saque (pós-correção)

**Data:** 2026-03-06  
**Tipo:** Auditoria técnica somente leitura. Nenhum código, commit ou deploy foi alterado.

---

## 1) Objetivo

Confirmar que a tela de saque utiliza os endpoints corretos do backend:
- **POST /api/withdraw/request** (solicitação de saque)
- **GET /api/withdraw/history** (histórico de saques)

---

## 2) Arquivos lidos

| Arquivo | Conteúdo verificado |
|--------|----------------------|
| `goldeouro-player/src/pages/Withdraw.jsx` | Submit, histórico, imports |
| `goldeouro-player/src/services/withdrawService.js` | requestWithdraw, getWithdrawHistory, endpoints |
| `goldeouro-player/src/config/api.js` | WITHDRAW_REQUEST, WITHDRAW_HISTORY |

---

## 3) Função chamada no submit

- **Handler:** `handleSubmit` (Withdraw.jsx, linha 85).
- **Chamada:** `requestWithdraw(amount, formData.pixKey, formData.pixType)` (linhas 105-109).
- **Serviço:** `withdrawService.requestWithdraw`.
- **Endpoint:** `API_ENDPOINTS.WITHDRAW_REQUEST` → **POST /api/withdraw/request** (withdrawService.js linha 44; config/api.js linha 36).

**Evidência:** Não há chamada a `paymentService.createPix` no submit. O fluxo de depósito PIX não é utilizado na solicitação de saque.

---

## 4) Endpoint usado no submit

| Item | Valor |
|------|--------|
| Endpoint | **POST /api/withdraw/request** |
| Body | `{ valor, chave_pix, tipo_chave }` |
| Fonte | withdrawService.js: `apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, { valor, chave_pix, tipo_chave })` |

---

## 5) Função e endpoint do histórico

- **Função:** `loadWithdrawalHistory` (Withdraw.jsx, linhas 57-76).
- **Chamada:** `getWithdrawHistory()` (linha 62).
- **Serviço:** `withdrawService.getWithdrawHistory`.
- **Endpoint:** `API_ENDPOINTS.WITHDRAW_HISTORY` → **GET /api/withdraw/history** (withdrawService.js linha 70; config/api.js linha 37).

**Evidência:** Não há chamada a `paymentService.getUserPix` no carregamento do histórico. A lista exibida é de saques, não de depósitos PIX.

---

## 6) Uso de paymentService na tela de saque

- **Import:** Withdraw.jsx ainda importa `paymentService` (linha 6).
- **Uso:** Apenas `paymentService.getConfig().minAmount` (linha 231) e `paymentService.isSandboxMode()` (linha 232) para exibição (valor mínimo e indicador sandbox).
- **Não utilizado no fluxo de saque:** `createPix` e `getUserPix` não são chamados na tela de saque.

---

## 7) Classificação

| Critério | Resultado |
|----------|-----------|
| Submit usa POST /api/withdraw/request? | **Sim** |
| Histórico usa GET /api/withdraw/history? | **Sim** |
| Ainda usa createPix no submit? | **Não** |
| Ainda usa endpoint de depósito no histórico? | **Não** |

**Classificação:** **OK**

---

## 8) Entregas JSON

- `docs/relatorios/withdraw-frontend-validation-flow.json` — fluxo submit e histórico.
- `docs/relatorios/withdraw-frontend-validation-services.json` — serviços e endpoints.
- `docs/relatorios/withdraw-frontend-validation-risk.json` — risco residual e conclusão.

---

*Validação READ-ONLY. Nenhuma alteração de código foi realizada.*
