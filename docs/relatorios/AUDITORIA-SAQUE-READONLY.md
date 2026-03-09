# Auditoria READ-ONLY — Tela /withdraw (Saque) — Player Gol de Ouro

**Data:** 2026-02-28  
**Modo:** Estritamente read-only. Nenhum arquivo foi modificado.  
**Objetivo:** Explicar por que a tela /withdraw exibe “Saque solicitado!” mas não dispara request HTTP de saque e por que o histórico fica vazio.

---

## (A) Resumo executivo

A tela /withdraw está **integrada ao fluxo errado**: o botão “Solicitar Saque” chama `paymentService.createPix()`, que faz **POST para `/api/payments/pix/criar`** (criação de **depósito** PIX), e não **POST para `/api/withdraw/request`** (solicitação de **saque**). O backend expõe saque em `POST /api/withdraw/request` e histórico em `GET /api/withdraw/history`, mas o frontend **não chama nenhum deles**. O “Histórico de Saques” usa `paymentService.getUserPix()`, que chama **GET `/api/payments/pix/usuario`** (lista de **pagamentos/depósitos** PIX), e além disso o código trata `result.data` como array quando a API devolve um objeto (ex.: `data.payments`), o que deixa a lista vazia. O modal “Saque solicitado!” aparece quando `createPix` retorna sucesso — ou seja, quando a criação de um PIX de **depósito** dá 200, não quando um saque é de fato solicitado. Causa raiz: **uso do serviço de depósito PIX no lugar do fluxo de saque e ausência de chamadas aos endpoints de withdraw no player**.

---

## (B) Evidências e rastreio do fluxo do saque

### B.1 Framework e entrada

- **Arquivo:** `goldeouro-player/package.json`  
- **Trecho:** `"vite": "^5.0.8"`, `"react": "^18.2.0"`, `"react-router-dom": "^6.8.1"`, `"axios": "^1.11.0"`  
- **Explicação:** Player é **Vite + React**; rotas via React Router; HTTP via axios (apiClient).

### B.2 Rota /withdraw e componente

- **Arquivo:** `goldeouro-player/src/App.jsx`  
- **Trecho:**
```jsx
<Route path="/withdraw" element={
  <ProtectedRoute>
    <Withdraw />
  </ProtectedRoute>
} />
```
- **Explicação:** A rota `/withdraw` renderiza o componente `Withdraw` (protegido).

### B.3 Botão “Solicitar Saque” e handler

- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx`  
- **Trecho (botão submit):**
```jsx
<button
  type="submit"
  disabled={isSubmitting || !formData.amount || !formData.pixKey}
  className="..."
>
  {isSubmitting ? ( ... ) : ( '💸 Solicitar Saque' )}
</button>
```
- **Trecho (form onSubmit → handleSubmit):**
```jsx
<form onSubmit={handleSubmit} className="space-y-6">
```
- **Explicação:** O clique em “Solicitar Saque” submete o formulário e chama `handleSubmit`.

### B.4 Handler handleSubmit — chamada ao serviço errado

- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx`  
- **Trecho (linhas 86–127):**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)
  setError(null)
  try {
    // ... validações amount, pixKey, balance ...
    const result = await paymentService.createPix(
      amount,
      formData.pixKey,
      `Saque Gol de Ouro - ${formData.pixType}`
    )
    if (result.success) {
      setShowSuccess(true)
      setBalance(prev => prev - amount)
      await loadWithdrawalHistory()
      setTimeout(() => { setFormData({ ... }); setShowSuccess(false) }, 3000)
    } else {
      throw new Error(result.error || 'Erro ao processar saque')
    }
  } catch (err) { ... }
  finally { setIsSubmitting(false) }
}
```
- **Explicação:** O handler chama **apenas** `paymentService.createPix(...)`. Não há chamada a `apiClient.post(..., API_ENDPOINTS.WITHDRAW)` nem a `/api/withdraw/request`. O modal “Saque solicitado!” é exibido quando `result.success === true` após `createPix`.

### B.5 paymentService.createPix — qual request é feita

- **Arquivo:** `goldeouro-player/src/services/paymentService.js`  
- **Trecho (linhas 74–105):**
```javascript
async createPix(amount, pixKey, description = 'Saque Gol de Ouro') {
  // ...
  const payload = { amount, pixKey, description, environment: this.config.pixProvider, ... };
  const response = await apiClient.post(this.config.pixEndpoint, payload, { timeout: this.config.timeout });
  return { success: true, data: response.data, environment: this.config.pixProvider };
}
```
- **Trecho (config):** `pixEndpoint: '/api/payments/pix/criar'` (linhas 26, 43, 59).  
- **Explicação:** `createPix` faz **POST para `/api/payments/pix/criar`**. Esse endpoint no backend cria um **depósito** PIX (QR para o usuário pagar), não um saque. Portanto o frontend **não dispara nenhuma request HTTP de saque**; a única request é de criação de PIX de depósito.

### B.6 Histórico de saques — qual request é feita

- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx`  
- **Trecho (linhas 56–78):**
```javascript
const loadWithdrawalHistory = async () => {
  try {
    setHistoryLoading(true)
    setHistoryError(null)
    const result = await paymentService.getUserPix()
    if (result.success) {
      setWithdrawalHistory(Array.isArray(result.data) ? result.data : [])
    } else {
      setHistoryError(result.error)
      setWithdrawalHistory([])
    }
  } catch (err) { ... }
  finally { setHistoryLoading(false) }
}
```
- **Explicação:** O histórico é carregado com **`paymentService.getUserPix()`**, que chama **GET `/api/payments/pix/usuario`** (lista de **pagamentos/depósitos** PIX do usuário). O backend de saques expõe **GET `/api/withdraw/history`** para histórico de saques; esse endpoint **não é usado** no Withdraw.

### B.7 Formato da resposta de getUserPix vs uso no Withdraw

- **Arquivo:** `goldeouro-player/src/services/paymentService.js` (getUserPix)  
- **Trecho:** `return { success: true, data: response.data, ... }` — ou seja, `result.data` = corpo da resposta do backend.  
- No backend, GET `/api/payments/pix/usuario` devolve estrutura do tipo `{ data: { payments: [...], ... } }` (ver uso em `Pagamentos.jsx`: `response.data.data.payments`).  
- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx`  
- **Uso:** `setWithdrawalHistory(Array.isArray(result.data) ? result.data : [])`. Como `result.data` é um **objeto** (ex.: `{ data: { payments: [...] } }`), `Array.isArray(result.data)` é **false** e a lista fica **sempre** `[]`. Além disso, mesmo que se usasse `result.data.data.payments`, seriam **depósitos** PIX, não saques.  
- **Explicação:** O histórico fica vazio por (1) endpoint errado (pagamentos PIX em vez de withdraw/history) e (2) formato de resposta não mapeado para array de saques.

### B.8 Modal “Saque solicitado!”

- **Arquivo:** `goldeouro-player/src/pages/Withdraw.jsx` (linhas 403–416)  
- **Trecho:**
```jsx
{showSuccess && (
  <div className="fixed inset-0 ...">
    <h3 className="...">Saque Solicitado!</h3>
    <p className="...">Sua solicitação foi enviada com sucesso. Você receberá o valor em até 24 horas.</p>
    ...
  </div>
)}
```
- **Explicação:** O modal é controlado por `showSuccess`, que é `true` quando `paymentService.createPix()` retorna `result.success === true`. Ou seja, “Saque solicitado!” aparece quando a **criação de PIX de depósito** retorna sucesso, não quando um saque é efetivamente solicitado ao backend.

---

## (C) Mapa de endpoints esperados vs usados

| Ação | Endpoint correto (backend) | O que o frontend usa | Arquivo |
|------|----------------------------|----------------------|---------|
| Solicitar saque | **POST** `/api/withdraw/request` (body: valor, chave_pix, tipo_chave) | **POST** `/api/payments/pix/criar` via `paymentService.createPix()` | Withdraw.jsx → paymentService.js |
| Histórico de saques | **GET** `/api/withdraw/history` | **GET** `/api/payments/pix/usuario` via `paymentService.getUserPix()` | Withdraw.jsx → paymentService.js |

- **config/api.js:** existe `WITHDRAW: '/api/withdraw'` (linha 35), mas **nenhum código** no Withdraw ou no paymentService chama `API_ENDPOINTS.WITHDRAW` nem `/api/withdraw/request` ou `/api/withdraw/history`.  
- Conclusão: os endpoints de saque estão configurados apenas em `api.js`; a página de saque não os utiliza e usa apenas os endpoints de PIX de depósito.

---

## (D) Conclusão técnica — causa raiz

**Causa raiz mais provável:**

1. **Integração errada do “Solicitar Saque”:** O fluxo de saque foi implementado reutilizando o serviço de **depósito** PIX (`createPix` → POST `/api/payments/pix/criar`). Não há chamada a POST `/api/withdraw/request`. Por isso:
   - Se o usuário filtra a aba Network por “withdraw”, não aparece nenhuma request.
   - A única request que pode aparecer é POST para `/api/payments/pix/criar`; se essa request retornar 200, o modal “Saque solicitado!” é exibido mesmo sem nenhum saque ter sido criado no backend.

2. **Histórico de saques nunca implementado para o recurso correto:** O histórico usa `getUserPix()` → GET `/api/payments/pix/usuario` (depósitos). O endpoint GET `/api/withdraw/history` não é chamado em nenhum lugar do Withdraw. Além disso, o código trata `result.data` como array, enquanto a API de pagamentos devolve um objeto; assim a lista fica sempre vazia.

**Evidência resumida:** Em `Withdraw.jsx` não há ocorrência de `apiClient.post`, `API_ENDPOINTS.WITHDRAW`, `withdraw/request` ou `withdraw/history`. As únicas chamadas de rede na página são `apiClient.get(API_ENDPOINTS.PROFILE)` e, no submit e no histórico, as funções do `paymentService` que apontam para `/api/payments/pix/*`.

---

## (E) Cache e interceptors (não causam “nenhuma request”)

- **Arquivo:** `goldeouro-player/src/services/apiClient.js`  
- Cache: aplicado **apenas a GET** (request interceptor: `if (config.method === 'get')` usa `requestCache.get`; response interceptor armazena com TTL 30s para GET). POST não é cacheado.  
- **Arquivo:** `goldeouro-player/src/utils/requestCache.js` — `defaultTTL = 30000`; mensagem “Cache armazenado … TTL: 30s”.  
- **Explicação:** O cache pode fazer com que um GET (ex.: perfil ou getUserPix) não apareça na rede em até 30s; não impede a existência de um POST. O fato de não haver request HTTP de saque deve-se à **não utilização** do endpoint de saque no código, não ao cache.

---

## (F) Lista de ações corretivas (plano apenas; sem aplicar código)

1. **Substituir a chamada de “Solicitar Saque”:** No `handleSubmit` de `Withdraw.jsx`, em vez de `paymentService.createPix(...)`, chamar o backend de saque com **POST** para `/api/withdraw/request` (via apiClient), enviando o body esperado pelo backend (ex.: `valor`, `chave_pix`, `tipo_chave` e, se documentado, `correlation_id`). Manter validações locais (valor, saldo, chave PIX) antes do POST.

2. **Criar ou reutilizar endpoint de histórico de saques no frontend:** Implementar carga do histórico com **GET** `/api/withdraw/history` (apiClient com token). Mapear a resposta do backend (lista de saques com id, valor, status, data, chave PIX etc.) para o estado `withdrawalHistory` e para os campos usados na UI (ex.: `withdrawal.amount`, `withdrawal.status`, `withdrawal.date`, `withdrawal.pixKey`).

3. **Ajustar formato de dados no loadWithdrawalHistory:** Remover o uso de `paymentService.getUserPix()` para o bloco “Histórico de Saques”. Usar exclusivamente GET `/api/withdraw/history` e tratar o corpo da resposta conforme o contrato do backend (ex.: `response.data.data.saques` ou equivalente) para preencher a lista.

4. **Manter createPix apenas para depósito:** Deixar `paymentService.createPix` e GET `/api/payments/pix/usuario` para a tela de **depósito** (/pagamentos). Não usar esses métodos na tela de saque.

5. **Revisar API_ENDPOINTS:** Em `config/api.js` (ou equivalente), definir explicitamente, por exemplo, `WITHDRAW_REQUEST: '/api/withdraw/request'` e `WITHDRAW_HISTORY: '/api/withdraw/history'`, e usar essas constantes nas chamadas da página Withdraw para facilitar manutenção e auditoria.

6. **Testes manuais após correção:** Após as alterações, abrir /withdraw, solicitar um saque de teste e inspecionar a aba Network: deve aparecer POST para `/api/withdraw/request` e GET para `/api/withdraw/history`. O modal de sucesso deve ser exibido apenas quando o POST de saque retornar sucesso; o histórico deve listar os itens retornados por GET `/api/withdraw/history`.

---

**Fim do relatório.** Nenhum arquivo foi alterado; apenas leitura e documentação.
