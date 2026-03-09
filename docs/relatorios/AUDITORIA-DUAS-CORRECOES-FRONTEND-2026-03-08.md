# AUDITORIA — DUAS CORREÇÕES FRONTEND

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, patch, deploy, backend ou banco.  
**Objetivo:** Confirmar com evidência técnica as duas correções mínimas necessárias antes da demo.

---

## 1. Correção Dashboard

### Onde `recentBets` é preenchido

- **Arquivo:** `goldeouro-player/src/pages/Dashboard.jsx`  
- **Função:** `loadUserData` (linhas 36–76)  
- **Trecho:** após `retryDataRequest(() => apiClient.get(API_ENDPOINTS.PIX_USER))`, na linha 55:

```javascript
setRecentBets(pixResponse.data.data.historico_pagamentos || [])
```

### Propriedade usada no frontend

- O frontend lê **`pixResponse.data.data.historico_pagamentos`**.  
- Se ausente, usa fallback `|| []`.

### Propriedade retornada pelo backend

- **Rota:** GET `/api/payments/pix/usuario` (server-fly.js, ~1969–1975)  
- **Resposta real:**

```javascript
res.json({
  success: true,
  data: {
    payments: payments || [],
    total: payments?.length || 0
  }
});
```

- O backend **não** envia a propriedade `historico_pagamentos`; envia apenas **`data.payments`** (e `data.total`).

### Evidência

- Em server-fly.js não existe atribuição a `historico_pagamentos` na resposta de GET `/api/payments/pix/usuario`.  
- A única propriedade de lista no objeto `data` é **`payments`**.

### Correção mínima

- Trocar **`historico_pagamentos`** por **`payments`** na linha 55, mantendo o restante igual:  
  `setRecentBets(pixResponse.data.data.payments || [])`

### Impacto em outros componentes

- **recentBets** é estado local do Dashboard; não é passado como prop nem exportado.  
- O único uso é no próprio Dashboard (bloco “Apostas Recentes”, `recentBets.map` nas linhas 233–234).  
- **Pagamentos.jsx** já usa `response.data.data.payments` para listar PIX; não é afetado.  
- **Conclusão:** a troca para `payments` resolve apenas no Dashboard e não afeta outros componentes.

### Observação pós-correção

- Os itens de `data.payments` vêm de `pagamentos_pix` (campos como `id`, `amount`, `valor`, `status`, `created_at`).  
- O bloco “Apostas Recentes” espera por item: `bet.valor`, `bet.data`, `bet.status`, `bet.tipo`.  
- Se o backend não enviar `valor` ou `data` (e enviar `amount`/`created_at`), pode ser necessário mapeamento leve no Dashboard; isso fica fora do escopo desta correção mínima (apenas troca da chave da lista).

---

## 2. Correção AuthContext

### Onde o profile é lido após refresh / validação de sessão

- **Arquivo:** `goldeouro-player/src/contexts/AuthContext.jsx`  
- **Trecho:** no `useEffect` de inicialização (linhas 29–49), quando existe token no `localStorage`:

```javascript
apiClient.get(API_ENDPOINTS.PROFILE)
  .then(response => {
    setUser(response.data)
  })
```

- Ou seja, após refresh (ou reabrir aba) com token, o backend é chamado com GET `/api/user/profile` e o resultado é passado para **`setUser(response.data)`**.

### Formato real de GET /api/user/profile

- **Rota:** GET `/api/user/profile` (server-fly.js, ~1037–1050)  
- **Resposta real:**

```javascript
res.json({
  success: true,
  data: {
    id: user.id,
    email: user.email,
    username: user.username,
    nome: user.username,
    saldo: user.saldo,
    tipo: user.tipo,
    total_apostas: user.total_apostas,
    total_ganhos: user.total_ganhos,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
});
```

- Em axios, **`response.data`** é o corpo do JSON; portanto **`response.data`** = `{ success: true, data: { id, email, ... } }`.  
- O objeto de perfil do usuário está em **`response.data.data`**.

### Confirmação do erro

- **Código atual:** `setUser(response.data)` → o estado `user` fica **`{ success: true, data: { id, email, ... } }`**.  
- Com isso, **`user.id`**, **`user.email`**, **`user.nome`** são **undefined** (os dados estão em `user.data`).  
- No **login** e no **register** o código faz `setUser(userData)` com o objeto interno (linhas 63 e 90), então após login/registro o `user` tem o formato correto.  
- **Inconsistência:** após **refresh** com token, o formato de `user` fica errado; após **login/register**, fica correto.

### Correção mínima segura

- Usar o mesmo formato que login/register: guardar o objeto de perfil, não o envelope.  
- Trocar **`setUser(response.data)`** por **`setUser(response.data.data)`** na linha 36 (no `.then` do GET PROFILE).  
- Assim, após refresh, `user` = `{ id, email, username, nome, saldo, ... }`, alinhado ao contrato do backend e ao uso em login/register.

### Componentes que dependem de `useAuth().user`

- **ProtectedRoute:** usa apenas `user` e `loading`; faz `if (!user)` para redirecionar. Como `response.data` é um objeto truthy, a rota protegida continua deixando o usuário passar mesmo com o bug; não há quebra de acesso.
- **Login / Register:** usam `login` e `register`; não leem `user` para exibição antes do redirect.
- **Profile.jsx:** mantém estado local `user` e carrega perfil com `apiClient.get(PROFILE)` e `response.data.data`; **não** usa `useAuth().user` para nome/email. Portanto o bug do AuthContext não quebra a tela de Perfil hoje.
- Nenhum outro componente no projeto usa `useAuth().user` para exibir `user.id`, `user.email` ou `user.nome`.  
- **Conclusão:** a correção **`setUser(response.data.data)`** é a mínima e segura; alinha o estado ao contrato e evita quebras se no futuro algum componente (ex.: header) usar `user.email` ou `user.nome` do contexto.

---

## 3. Impacto técnico

### As duas correções são somente frontend

- **Dashboard:** altera apenas qual propriedade da **resposta** do GET `/api/payments/pix/usuario` é lida; não altera URL, método, headers nem backend.  
- **AuthContext:** altera apenas qual parte da **resposta** do GET `/api/user/profile` é guardada em estado; não altera URL, método nem backend.

### O que não é alterado

- **Saldo:** continua vindo de GET `/api/user/profile` (Dashboard usa `profileResponse.data.data.saldo`; AuthContext não altera saldo).  
- **PIX:** criação (POST `/api/payments/pix/criar`) e listagem (GET `/api/payments/pix/usuario`) inalteradas; apenas a chave lida na listagem no Dashboard muda de `historico_pagamentos` para `payments`.  
- **Saque:** fluxo usa GET PROFILE e POST/GET withdraw; nenhuma dessas chamadas ou respostas é alterada pelas duas correções.  
- **Jogo:** usa GET PROFILE e POST `/api/games/shoot`; inalterados.  
- **Autenticação no backend:** não há mudança de rotas, tokens, headers nem lógica no server-fly.js.

### Resumo

- As duas alterações são **isoladas ao frontend**, apenas alinhando o consumo das respostas já existentes ao contrato real do backend.  
- Não há mudança de comportamento de saldo, PIX (criação/backend), saque, jogo ou autenticação no backend.

---

## 4. Risco das correções

### Correção 1 — Dashboard: `historico_pagamentos` → `payments`

- **Risco: BAIXO.**  
- Motivo: troca de uma única propriedade na leitura da resposta; mesmo endpoint, mesma estrutura; apenas a lista passa a ser preenchida. Nenhum outro arquivo depende de `recentBets` nem da chave `historico_pagamentos`.  
- Regressão: improvável; hoje a lista já está sempre vazia por causa da chave errada.

### Correção 2 — AuthContext: `setUser(response.data)` → `setUser(response.data.data)`

- **Risco: BAIXO.**  
- Motivo: alinha o estado ao que login e register já fazem (objeto interno do usuário). Proteção de rota e fluxos atuais não dependem de `user.id`/`user.email` no contexto; Profile usa seu próprio estado.  
- Regressão: improvável; a única diferença é que, após refresh, `user` terá o formato correto em vez de `{ success, data }`.

### Classificação geral

- **Ambas as correções: risco BAIXO.**  
- Escopo limitado, sem alteração de backend, sem impacto em saldo/PIX/saque/jogo/autenticação; apenas consistência de contrato e formato de estado.

---

## 5. Conclusão

- **Correção Dashboard:** necessária e suficiente trocar `historico_pagamentos` por `payments` na linha 55 de Dashboard.jsx; evidência: backend retorna apenas `data.payments` em GET `/api/payments/pix/usuario`.  
- **Correção AuthContext:** necessária e suficiente trocar `setUser(response.data)` por `setUser(response.data.data)` na linha 36 de AuthContext.jsx; evidência: backend retorna `{ success, data: { id, email, ... } }` em GET `/api/user/profile`.  
- **Impacto:** apenas frontend; saldo, PIX, saque, jogo e autenticação no backend permanecem inalterados.  
- **Risco:** BAIXO para as duas alterações.

**Classificação final: CORREÇÕES SEGURAS**

- As duas alterações são mínimas, somente frontend, alinhadas ao contrato atual do backend e sem impacto em outras áreas.  
- Não é necessário ajuste adicional para aplicar essas duas correções.  
- Nenhuma alteração de código foi feita nesta auditoria; apenas diagnóstico e evidência técnica.
