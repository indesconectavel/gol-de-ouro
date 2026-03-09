# Patch Withdraw Isolado — Endpoints reais de saque

**Data:** 2026-02-25  
**Objetivo:** Corrigir exclusivamente a tela `/withdraw` para usar os endpoints reais de saque, sem afetar depósitos PIX.

---

## 1. Resumo executivo

- **Alterado:** `Withdraw.jsx` (usa `withdrawService` em vez de `paymentService` para saque e histórico), novo `withdrawService.js`, constantes em `config/api.js`.
- **Não alterado:** `paymentService.js`, `Pagamentos.jsx`, `apiClient.js` e qualquer lógica de `/api/payments/pix/*`.
- **Comportamento após o patch:**
  - `/withdraw` chama **POST /api/withdraw/request** (body: `valor`, `chave_pix`, `tipo_chave`) e **GET /api/withdraw/history** (histórico em `data.data.saques`).
  - Saldo é recarregado via **GET /api/user/profile** após sucesso; não há mais débito local (`setBalance(prev => prev - amount)`).
  - Histórico usa o array retornado por `getWithdrawHistory()` (que lê `response.data.data.saques` com fallback seguro).
- **Depósitos:** `/pagamentos` continua usando `apiClient.post('/api/payments/pix/criar', ...)` sem alteração.

---

## 2. Lista de arquivos alterados

| Arquivo | Ação |
|--------|------|
| `goldeouro-player/src/services/withdrawService.js` | **NOVO** |
| `goldeouro-player/src/pages/Withdraw.jsx` | Modificado |
| `goldeouro-player/src/config/api.js` | Modificado (apenas adição de constantes) |

---

## 3. Prova de que depósito NÃO foi alterado

### 3.1 Arquivos com ZERO alterações

- **paymentService.js** — Nenhuma linha alterada. Continua com `createPix`, `getUserPix`, `pixEndpoint`, `pixStatusEndpoint`, `pixUserEndpoint` e lógica de `/api/payments/pix/*`.
- **Pagamentos.jsx** — Nenhuma linha alterada. Continua usando `apiClient.get(API_ENDPOINTS.PIX_USER)` e `apiClient.post('/api/payments/pix/criar', ...)` para depósitos.
- **apiClient.js** — Nenhuma linha alterada. Interceptors, cache e auth inalterados.

### 3.2 Verificações realizadas

| Verificação | Resultado |
|-------------|-----------|
| `paymentService.createPix(` em Withdraw.jsx | Não aparece (removido) |
| `'/api/payments/pix'` em Withdraw.jsx | Não aparece |
| `/api/withdraw/request` | Apenas em `withdrawService.js` e `config/api.js` (constante) |
| `/api/withdraw/history` | Apenas em `withdrawService.js` e `config/api.js` (constante) |

---

## 4. Alterações técnicas resumidas

### 4.1 withdrawService.js (novo)

- **requestWithdraw({ valor, chave_pix, tipo_chave }):**  
  POST `/api/withdraw/request` com body exato; usa `apiClient` (Bearer já no interceptor). Retorna `{ success, data, message }`.
- **getWithdrawHistory():**  
  GET `/api/withdraw/history`; retorna `response.data.data.saques` com fallback para `[]` se estrutura inesperada.

### 4.2 Withdraw.jsx

- Substituído uso de `paymentService.createPix(...)` por `withdrawService.requestWithdraw({ valor, chave_pix, tipo_chave })`.
- Substituído `paymentService.getUserPix()` por `withdrawService.getWithdrawHistory()` em `loadWithdrawalHistory`.
- Removido `setBalance(prev => prev - amount)`.
- Após sucesso: `loadWithdrawalHistory()` e `loadUserData()` (GET /api/user/profile para saldo real).
- Histórico: array de `getWithdrawHistory()` (origem `data.data.saques`); não usa `Array.isArray(result.data)`.
- Renderização do histórico ajustada para campos do backend: `valor`/`amount`, `pix_key`/`chave_pix`, `created_at`, `status` (pendente, processado, falhou, etc.) com funções de formatação.

### 4.3 config/api.js

- Adicionadas constantes (sem remover existentes):  
  `WITHDRAW_REQUEST: '/api/withdraw/request'`,  
  `WITHDRAW_HISTORY: '/api/withdraw/history'`.

---

## 5. Checklist de testes manuais

- [ ] **Depósitos:** Acessar `/pagamentos`, criar PIX, confirmar que recarga e histórico de pagamentos funcionam.
- [ ] **Saque:** Acessar `/withdraw`, preencher valor (≥ R$ 10), chave e tipo PIX, enviar; confirmar mensagem de sucesso.
- [ ] **Saldo:** Após solicitar saque, dar F5; saldo deve permanecer debitado (vindo do GET /api/user/profile).
- [ ] **Histórico:** Após saque, lista de saques deve mostrar o novo item imediatamente (valor, chave, data, status).
- [ ] **Erro:** Testar valor maior que saldo ou chave inválida; mensagem de erro exibida sem quebrar a tela.
- [ ] **Navegação:** Ir de `/withdraw` para `/pagamentos` e voltar; ambas as telas devem carregar normalmente.

---

**Fim do relatório.** Nenhuma alteração em paymentService.js, Pagamentos.jsx ou apiClient.js.
