# Auditoria frontend – Depósito / PIX Status e saldo

**Data:** 2026-03-06  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)  
**Escopo:** `goldeouro-player/src/pages`, `services`, `components`, `config`

---

## 1. Objetivo

Localizar no frontend:

1. Botão ou função **"Verificar Status"** do PIX  
2. Uso do endpoint **GET /api/payments/pix/status**  
3. Uso de **response.data.balance** na tela de Pagamentos  
4. Uso de **response.data.data.saldo** retornado pelo backend  
5. Componentes que **exibem saldo** na UI  
6. Chamadas a **paymentService** relacionadas ao depósito PIX  

---

## 2. Mapeamento – Verificar Status e GET pix/status

### 2.1 Onde aparece o botão "Verificar Status"

| Arquivo | Caminho completo | Linha inicial | Linha final | Trecho | Função |
|--------|-------------------|---------------|-------------|--------|--------|
| **Pagamentos.jsx** | `goldeouro-player/src/pages/Pagamentos.jsx` | 248 | 252 | `<button onClick={() => consultarStatusPagamento(pagamentoAtual.id)} ... >🔄 Verificar Status</button>` | Botão no bloco "Pagamento PIX Criado" |
| **Pagamentos.jsx** | idem | 364 | 368 | `<button onClick={() => consultarStatusPagamento(pagamento.id)} ... >Verificar</button>` | Botão na tabela de histórico (coluna Ações) |

**Resposta 1:** O botão "Verificar Status" é criado em **`goldeouro-player/src/pages/Pagamentos.jsx`** (linhas 248 e 364–368).

### 2.2 Função que chama GET /api/payments/pix/status

| Arquivo | Linhas | Trecho | Função |
|--------|--------|--------|--------|
| **Pagamentos.jsx** | 81–103 | `const response = await apiClient.get(\`${API_ENDPOINTS.PIX_STATUS}?paymentId=${paymentId}\`);` | **consultarStatusPagamento(paymentId)** |

**Resposta 2:** A função que chama GET pix/status é **consultarStatusPagamento(paymentId)** em **Pagamentos.jsx** (linha 90). A URL usada é **query string**: `GET /api/payments/pix/status?paymentId=<id>`.

**Observação:** Em **paymentService.js** (linhas 122–126), **getPixStatus(transactionId)** chama o mesmo endpoint com **path**: `GET /api/payments/pix/status/<id>`. A tela de Pagamentos **não** usa `paymentService.getPixStatus`; usa `apiClient.get` com `?paymentId=`.

### 2.3 Demais ocorrências de pix/status

- **config/api.js** – linha 22: `PIX_STATUS: \`/api/payments/pix/status\`` (constante).  
- **paymentService.js** – linhas 28, 44, 60: `pixStatusEndpoint: '/api/payments/pix/status'` (config por ambiente).  
- **paymentService.js** – linhas 122–126: `getPixStatus(transactionId)` que faz GET no endpoint com `/:id`.

Arquivo de referência: **docs/relatorios/frontend-pix-status-locations.json**.

---

## 3. Uso de balance e saldo

### 3.1 Onde o saldo é lido como response.data.balance

| Arquivo | Caminho | Linhas | Trecho | Função |
|--------|---------|--------|--------|--------|
| **Pagamentos.jsx** | `goldeouro-player/src/pages/Pagamentos.jsx` | 36–38 | `const response = await apiClient.get(API_ENDPOINTS.PROFILE);` e `setSaldo(response.data.balance \|\| 0);` | **carregarDados()** |

**Resposta 3:** O saldo é lido como **response.data.balance** em **Pagamentos.jsx**, linha **38**, dentro de **carregarDados()**.  
O backend retorna o saldo em **response.data.data.saldo**, portanto **response.data.balance** é `undefined` e o estado `saldo` fica **0**. Na página atual, o estado `saldo` **não é exibido** no JSX (apenas definido).

### 3.2 Onde já se usa response.data.data.saldo

| Arquivo | Linhas | Trecho | Função |
|--------|--------|--------|--------|
| **Withdraw.jsx** | 42–45 | `setBalance(response.data.data.saldo \|\| 0)` | loadUserData() |
| **Dashboard.jsx** | 44–46 | `setBalance(profileResponse.data.data.saldo \|\| 0)` | loadUserData() |
| **gameService.js** | 40, 250, 282 | `this.userBalance = response.data.data.saldo`; `saldo: userData.saldo`; `this.userBalance = userData.saldo` | getUserBalance / updateUserBalance |

**Resposta 4:** Sim. **Withdraw.jsx**, **Dashboard.jsx** e **gameService.js** já usam **response.data.data.saldo** (ou `userData.saldo` vindo do perfil). **Pagamentos.jsx** é o único que usa **response.data.balance**.

### 3.3 Componentes que exibem saldo na UI

| Arquivo | Linha | Elemento |
|--------|-------|----------|
| **Dashboard.jsx** | 175 | `R$ {balance.toFixed(2)}` |
| **Withdraw.jsx** | 231 | `R$ {balance.toFixed(2)}` |
| **Profile.jsx** | 215 | `R$ {user.balance.toFixed(2)}` |
| **GameShoot.jsx** | 340 | `R$ {balance.toFixed(2)}` |
| **GameShootFallback.jsx** | 142 | balance formatado em BRL |
| **Game.jsx** | 279 | `R$ {balance.toFixed(2)}` |

Arquivo de referência: **docs/relatorios/frontend-balance-usage.json**.

---

## 4. paymentService e fluxo de depósito

### 4.1 Quem usa paymentService.createPix

- **createPix** está definido em **paymentService.js** (linhas 74–119).  
- **Nenhuma página de depósito** chama **paymentService.createPix**.  
- **Pagamentos.jsx** chama **apiClient.post('/api/payments/pix/criar', { amount, description })** diretamente (linhas 57–60), sem usar o serviço.

**Resposta 6 (chamadas a paymentService no depósito):** Na tela de **depósito** (Pagamentos.jsx) **não há** chamada a **paymentService.createPix** nem a **getUserPix**. O fluxo de depósito usa apenas **apiClient** e **API_ENDPOINTS**.

**Arquivos que importam paymentService:**

- **Withdraw.jsx** – usa `getConfig()` e `isSandboxMode()` (saque), não createPix para depósito.  
- **withdrawService.js** – apenas comentário de documentação.

Arquivo de referência: **docs/relatorios/frontend-deposit-flow.json**.

---

## 5. Se remover o botão "Verificar Status" quebra algum fluxo?

**Resposta 5:**  
- **Não quebra** o fluxo de **criar** PIX nem de **exibir** QR/código e histórico.  
- **Quebra** apenas a **ação** “Verificar Status” (atualização manual do status do pagamento).  
- Se o backend **não** expuser GET `/api/payments/pix/status` (ou expuser com outro formato, ex.: path `/:id` em vez de `?paymentId=`), o botão hoje pode resultar em **404** ou resposta inesperada.  
- O usuário ainda pode **recarregar a página** ou **voltar ao Dashboard** para ver atualizações após o webhook; o histórico vem de GET `/api/payments/pix/usuario`.

**Conclusão:** Remover o botão tem **risco funcional baixo** para o fluxo principal de depósito (criar PIX + ver código + listar histórico). O risco é **médio** se a equipe quiser manter a opção “Verificar Status” como recurso de UX; nesse caso é preciso garantir que o backend implemente e mantenha o endpoint compatível com a chamada atual (query string).

---

## 6. Resumo das entregas

| Arquivo | Descrição |
|--------|-----------|
| **docs/relatorios/AUDITORIA-FRONTEND-DEPOSITO-FUNCOES-PIX-STATUS.md** | Este relatório. |
| **docs/relatorios/frontend-pix-status-locations.json** | Ocorrências de pix/status e botão Verificar Status. |
| **docs/relatorios/frontend-balance-usage.json** | Uso de balance/saldo e componentes que exibem saldo. |
| **docs/relatorios/frontend-deposit-flow.json** | Fluxo de depósito e uso de paymentService. |

---

*Auditoria READ-ONLY. Nenhum arquivo foi modificado.*
