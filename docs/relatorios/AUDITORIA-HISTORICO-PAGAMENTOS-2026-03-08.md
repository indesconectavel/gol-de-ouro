# AUDITORIA HISTORICO_PAGAMENTOS

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, banco ou deploy.  
**Objetivo:** Diagnosticar a inconsistência entre o campo esperado pelo frontend (`historico_pagamentos`) e o retornado pelo backend (`payments`).

---

## 1. Implementação no frontend

### Arquivos envolvidos

| Arquivo | Uso da API PIX / propriedade lida |
|---------|-----------------------------------|
| **src/pages/Dashboard.jsx** | Chama `apiClient.get(API_ENDPOINTS.PIX_USER)` (retry via `retryDataRequest`). Lê **`pixResponse.data.data.historico_pagamentos`** e atribui a `setRecentBets(...)`. Em erro ou ausência, usa fallback `[]`. |
| **src/pages/Pagamentos.jsx** | Chama `apiClient.get(API_ENDPOINTS.PIX_USER)` em `carregarDados()`. Lê **`pagamentosResponse.data.data.payments`** e atribui a `setPagamentos(...)`. |
| **src/config/api.js** | Define `PIX_USER: '/api/payments/pix/usuario'`. Não define `historico_pagamentos` nem `payments`. |
| **src/services/paymentService.js** | Método `getUserPix()` chama `apiClient.get(this.config.pixUserEndpoint)` (mesmo path). Retorna **`response.data`** inteiro, sem extrair `payments` nem `historico_pagamentos`. Quem chama `getUserPix()` precisaria acessar `data.payments` ou `data.data.payments` conforme o contrato. |
| **src/services/apiClient.js** | Interceptor apenas garante que URLs `/pix/usuario` sejam enviadas como `/api/payments/pix/usuario`. Não altera o corpo da resposta nem renomeia propriedades. |

**Resumo frontend:**  
- **Dashboard.jsx** consome **`response.data.data.historico_pagamentos`**.  
- **Pagamentos.jsx** consome **`response.data.data.payments`**.  
- **Mesmo endpoint:** ambos usam `API_ENDPOINTS.PIX_USER` → `GET /api/payments/pix/usuario`.  
- **Nenhuma camada** (apiClient, paymentService, utils) renomeia `payments` para `historico_pagamentos` nem o contrário.

---

## 2. Implementação no backend

### Endpoints analisados

| Rota | Arquivo | Comportamento relevante |
|------|---------|-------------------------|
| **POST /api/payments/pix/criar** | server-fly.js ~1735 | Cria registro em `pagamentos_pix`, retorna dados do pagamento (QR, etc.) em `res.json({ success, data: { ... } })`. Não retorna lista de pagamentos. |
| **GET /api/payments/pix/usuario** | server-fly.js ~1900 | Consulta Supabase `pagamentos_pix` por `usuario_id`, ordena por `created_at` desc, limita 50. Resposta: **`res.json({ success: true, data: { payments: payments \|\| [], total: payments?.length \|\| 0 } })`** (linhas 1969–1975). Em erros (tabela inexistente ou falha na query), retorna `data: { payments: [], total: 0, message: '...' }`. |
| **GET /api/payments/pix/status** | server-fly.js | **Não existe.** Nenhuma rota GET com path `/api/payments/pix/status` ou `/api/payments/pix/status/:id` foi encontrada. O config do frontend define `PIX_STATUS: '/api/payments/pix/status'`, mas esse endpoint não está implementado no backend. |
| **POST /api/payments/webhook** | server-fly.js ~1998 | Recebe notificação do Mercado Pago, atualiza `pagamentos_pix` e saldo. Não retorna lista de pagamentos para o cliente. |

**Conclusão backend:** A única rota que devolve lista de pagamentos PIX do usuário é **GET /api/payments/pix/usuario**, e ela envia sempre o array sob a propriedade **`data.payments`**. A propriedade **`historico_pagamentos`** **não existe** em nenhuma resposta do server-fly.js para PIX.

---

## 3. Estrutura real da resposta da API

Para **GET /api/payments/pix/usuario**:

```json
{
  "success": true,
  "data": {
    "payments": [ /* array de registros de pagamentos_pix */ ],
    "total": 0
  }
}
```

Em caso de erro (tabela inacessível ou erro interno), o backend ainda retorna `success: true` e `data: { payments: [], total: 0, message: "..." }` para não quebrar o cliente.

Cada item de `data.payments` vem do Supabase `pagamentos_pix` (select `*`), tipicamente com campos como: `id`, `usuario_id`, `external_id`, `payment_id`, `amount`, `valor`, `status`, `qr_code`, `created_at`, etc. Não há propriedade `historico_pagamentos` no JSON.

---

## 4. Consumo da API no frontend

| Componente | Endpoint | Propriedade lida | Valor efetivo |
|------------|----------|------------------|----------------|
| **Dashboard.jsx** | GET /api/payments/pix/usuario | `response.data.data.historico_pagamentos` | **undefined** (não existe no JSON) → uso de `\|\| []` resulta em **array vazio** |
| **Pagamentos.jsx** | GET /api/payments/pix/usuario | `response.data.data.payments` | **array retornado pelo backend** → lista correta |

Não há transformação intermediária: Dashboard e Pagamentos recebem o mesmo `response.data`; apenas a propriedade que cada um lê é diferente. Nenhum service padroniza o nome (ex.: “sempre expor como `historico_pagamentos`”) antes de passar aos componentes.

---

## 5. Mapa completo do fluxo

```
PLAYER
  │
  ├─ Dashboard.jsx (loadUserData)
  │     │
  │     ├─ retryDataRequest(() => apiClient.get(API_ENDPOINTS.PIX_USER))
  │     │     → apiClient.get('/api/payments/pix/usuario')
  │     │     → Header: Authorization Bearer <token>
  │     │
  │     └─ pixResponse.data.data.historico_pagamentos  → undefined → setRecentBets([])
  │
  └─ Pagamentos.jsx (carregarDados)
        │
        └─ apiClient.get(API_ENDPOINTS.PIX_USER)
              → apiClient.get('/api/payments/pix/usuario')
              → Header: Authorization Bearer <token>
              │
              └─ pagamentosResponse.data.data.payments  → array → setPagamentos([...])
```

```
server-fly.js
  GET /api/payments/pix/usuario (authenticateToken)
    │
    └─ Supabase: from('pagamentos_pix').select('*').eq('usuario_id', req.user.userId)...
    │
    └─ res.json({ success: true, data: { payments: payments || [], total: ... } })
```

- **Backend:** retorna sempre **`data.payments`**.  
- **Dashboard:** lê **`data.historico_pagamentos`** → nunca preenche a lista.  
- **Pagamentos:** lê **`data.payments`** → lista funciona.

---

## 6. Inconsistência encontrada

- **Backend:** envia **apenas** a propriedade **`payments`** dentro de `data`.  
- **Frontend:**  
  - **Dashboard.jsx** usa **`historico_pagamentos`**, que **não é enviada** pelo backend.  
  - **Pagamentos.jsx** usa **`payments`**, alinhado ao backend.

Não existe endpoint alternativo que devolva `historico_pagamentos`; não há transformação no frontend que crie essa propriedade a partir de `payments`. A inconsistência é **apenas de nomenclatura no consumo**: um único arquivo (Dashboard.jsx) espera um nome que o backend nunca envia.

---

## 7. Impacto no sistema

**Classificação: IMPACTO VISUAL**

- **Dashboard:** O bloco “Apostas Recentes” usa `recentBets`, que é sempre `[]` porque `historico_pagamentos` é undefined. O usuário **sempre** vê “Nenhuma transação encontrada” nesse bloco, mesmo quando existem pagamentos PIX. Não há impacto em saldo, depósito, saque ou outras rotas.
- **Pagamentos.jsx:** Lista de pagamentos e criação de PIX funcionam; a tela de Pagamentos reflete corretamente os dados do backend.
- **Fluxo de depósito/jogo/saque:** Não depende do bloco “Apostas Recentes” do Dashboard; continua funcional.

Ou seja: **bug real de integração (propriedade errada)** com **impacto limitado à exibição** do histórico no Dashboard.

---

## 8. Conclusão técnica

**Classificação: AJUSTE MENOR**

- **Causa raiz:** Dashboard.jsx usa a propriedade **`historico_pagamentos`**, que o backend **não envia**. O backend expõe apenas **`payments`** em GET /api/payments/pix/usuario.
- **Não é:** problema de backend, de banco, de migration ou de endpoint alternativo. Não há transformação que esconda ou renomeie `payments`.
- **É:** uso de um nome de propriedade incorreto em um único ponto do frontend (Dashboard.jsx), com impacto apenas visual (lista vazia no Dashboard).

Diagnóstico encerrado. Nenhuma correção ou alteração de código foi sugerida ou aplicada.
