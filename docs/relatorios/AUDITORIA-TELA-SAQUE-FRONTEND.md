# Auditoria READ-ONLY — Tela de Saque (Frontend)

**Tipo:** Auditoria técnica somente leitura (nenhuma alteração de código).  
**Data:** 2026-03-06.  
**Objetivo:** Verificar se a tela de saque do frontend chama o endpoint correto de saque (`POST /api/withdraw/request`) ou, por engano, o endpoint de depósito (`paymentService.createPix` → `POST /api/payments/pix/criar`).

---

## 1) Resumo executivo

- **Resultado:** A tela de saque **não** chama o endpoint correto de saque.
- **Fluxo real:** O botão "Solicitar Saque" chama `paymentService.createPix()`, que envia `POST /api/payments/pix/criar` (endpoint de **depósito** PIX).
- **Endpoint correto no backend:** `POST /api/withdraw/request` existe e não é chamado pelo frontend na tela de saque.
- **Histórico:** A tela carrega "histórico de saques" via `paymentService.getUserPix()` → `GET /api/payments/pix/usuario` (lista de **depósitos** PIX), e não `GET /api/withdraw/history`.
- **Classificação:** **POSSÍVEL ERRO** — correção recomendada para usar `POST /api/withdraw/request` e `GET /api/withdraw/history` na tela de saque.

---

## 2) Serviços de pagamento encontrados

| Arquivo | Funções / uso | Endpoint utilizado |
|--------|----------------|---------------------|
| `goldeouro-player/src/services/paymentService.js` | createPix, getPixStatus, getUserPix, validatePixKey, getConfig | POST /api/payments/pix/criar (createPix); GET /api/payments/pix/status/:id (getPixStatus); GET /api/payments/pix/usuario (getUserPix) |
| `goldeouro-player/src/services/apiClient.js` | Cliente axios genérico | Nenhum endpoint fixo; apenas baseURL e correção de URL para /api/payments/pix/usuario |
| `goldeouro-player/src/config/api.js` | Constantes API_ENDPOINTS | WITHDRAW: `/api/withdraw` (definido, **não usado** pela tela de saque); PIX_CREATE, PIX_USER |

**withdrawService.js:** Não existe no projeto. Não há serviço dedicado a saque que chame `POST /api/withdraw/request`.

---

## 3) Função createPix analisada

- **Arquivo:** `goldeouro-player/src/services/paymentService.js`
- **Assinatura:** `async createPix(amount, pixKey, description = 'Saque Gol de Ouro')`
- **Endpoint chamado:** `apiClient.post(this.config.pixEndpoint, payload)` com `pixEndpoint = '/api/payments/pix/criar'`
- **Método HTTP:** POST
- **Finalidade no backend:** Criar um PIX de **depósito** (gerar QR Code / código copy-paste para o usuário **pagar** e creditar saldo). Não é endpoint de solicitação de saque.

Trecho relevante (linhas 99–102):

```javascript
const response = await apiClient.post(this.config.pixEndpoint, payload, {
  timeout: this.config.timeout
});
```

E em `getPaymentConfig()` (linhas 26–28): `pixEndpoint: '/api/payments/pix/criar'`.

---

## 4) Função de saque encontrada (ou não)

- **Função que chama `POST /api/withdraw/request`:** **Não existe** no frontend.
- **Uso de `API_ENDPOINTS.WITHDRAW`:** A constante existe em `config/api.js` como `WITHDRAW: '/api/withdraw'` (e o backend expõe `/api/withdraw/request`), mas **nenhum arquivo** do player usa essa constante para enviar a solicitação de saque.
- **Conclusão:** Não há função no frontend que chame o endpoint correto de saque.

---

## 5) Páginas do frontend relacionadas a saque

| Página | Arquivo | Botão / ação | Função executada | Serviço chamado |
|--------|---------|--------------|------------------|-----------------|
| Solicitar Saque | `goldeouro-player/src/pages/Withdraw.jsx` | Submit do formulário "💸 Solicitar Saque" | handleSubmit | paymentService.createPix(amount, formData.pixKey, ...) |
| Histórico na mesma tela | Withdraw.jsx | Carregamento inicial (useEffect) | loadWithdrawalHistory | paymentService.getUserPix() |

O Dashboard e a Navigation apenas navegam para `/withdraw`; a única lógica de “solicitar saque” está em `Withdraw.jsx` e usa `paymentService.createPix`.

---

## 6) Fluxo real da tela de saque

Fluxo mapeado (submit do formulário):

```
Withdraw.jsx
  → handleSubmit(e)
  → paymentService.createPix(amount, formData.pixKey, `Saque Gol de Ouro - ${formData.pixType}`)
  → paymentService.js: createPix() → apiClient.post(this.config.pixEndpoint, payload)
  → pixEndpoint = '/api/payments/pix/criar'
  → POST /api/payments/pix/criar
```

Fluxo esperado para saque:

```
Withdraw.jsx
  → handleSubmit(e)
  → serviço de saque (ex.: requestWithdraw ou apiClient.post)
  → POST /api/withdraw/request
  (body: valor, chave_pix, tipo_chave)
```

O fluxo real está usando o endpoint de **depósito** PIX, não o de **saque**.

---

## 7) Endpoint chamado pelo botão de saque

| Item | Valor |
|------|--------|
| Endpoint realmente chamado | **POST /api/payments/pix/criar** |
| Endpoint correto para saque | POST /api/withdraw/request |
| Evidência no código | Withdraw.jsx linhas 107–111: `const result = await paymentService.createPix(amount, formData.pixKey, ...)`; paymentService.js usa `pixEndpoint: '/api/payments/pix/criar'`. |

---

## 8) Classificação final

**POSSÍVEL ERRO**

- A tela de saque chama o endpoint de **criação de PIX de depósito** (`POST /api/payments/pix/criar`), e não o endpoint de **solicitação de saque** (`POST /api/withdraw/request`).
- O “histórico de saques” usa lista de **pagamentos PIX** (depósitos), e não `GET /api/withdraw/history`.

---

## 9) Recomendação técnica

1. **Não alterar código nesta auditoria** (read-only). Para correção futura:
   - Implementar chamada a `POST /api/withdraw/request` no submit da tela de saque, com body conforme backend (ex.: `valor`, `chave_pix`, `tipo_chave`).
   - Trocar `loadWithdrawalHistory` para usar `GET /api/withdraw/history` em vez de `paymentService.getUserPix()`.
   - Opcional: criar um `withdrawService.js` que encapsule `POST /api/withdraw/request` e `GET /api/withdraw/history`, e usar `API_ENDPOINTS` (ajustando para `/api/withdraw/request` e `/api/withdraw/history` se necessário).
2. **Testes E2E:** Em `goldeouro-player/cypress/e2e/withdraw.cy.js` o intercept está em `POST **/api/payments/pix/criar`; após a correção, ajustar para interceptar `POST **/api/withdraw/request` (e o histórico para `GET **/api/withdraw/history`).

---

*Auditoria READ-ONLY. Nenhum arquivo foi modificado. JSONs em docs/relatorios/withdraw-frontend-*.json.*
