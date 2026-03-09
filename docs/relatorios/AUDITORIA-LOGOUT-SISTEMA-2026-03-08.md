# AUDITORIA LOGOUT — SISTEMA

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, banco ou deploy.  
**Escopo:** Frontend (goldeouro-player), Backend (server-fly.js), autenticação JWT.

---

## 1. Implementação no frontend

### Localização do código

| Arquivo | O que faz |
|---------|-----------|
| **src/contexts/AuthContext.jsx** | Define `logout()`: remove `authToken` do localStorage, `setUser(null)`, `setError(null)`. Não faz chamada HTTP nem redirecionamento. |
| **src/components/Navigation.jsx** | `handleLogout`: tenta POST `/auth/logout` com `{ token }`; em seguida remove `authToken` e `user` do localStorage e `navigate('/')`. No catch (ex.: 404), faz o mesmo: remove token e user, navega para `/`. |
| **src/pages/Dashboard.jsx** | `handleLogout`: idêntico ao da Navigation — POST `/auth/logout`, depois remove token e user, `navigate('/')`; em erro, logout local + redirect. |
| **src/config/api.js** | Exporta função `logout()`: remove `authToken` e `userData` do localStorage e `window.location.href = '/login'`. Não chama AuthContext nem backend. |

Os pontos de uso visível do logout são os botões que chamam `handleLogout` em Navigation e Dashboard (não o `logout` do AuthContext diretamente na navegação principal; o AuthContext.logout existe mas não é usado pelos handlers de clique que fazem redirect).

### Fluxo de logout (quando o usuário clica em Logout)

1. Usuário clica no item/botão de logout (Navigation ou Dashboard).
2. É executado `handleLogout` (local em cada componente).
3. Opcionalmente: `apiClient.post('/auth/logout', { token })` — o backend **não** implementa essa rota (retorno 404).
4. `localStorage.removeItem('authToken')` e `localStorage.removeItem('user')`.
5. `navigate('/')` (rota raiz, tipicamente login).

O AuthContext.logout (apenas remoção de token + setUser(null)) não redireciona; quem garante o redirect é o handleLogout das páginas.

---

## 2. Armazenamento do token

- **Onde é salvo:** `localStorage.setItem('authToken', token)` no AuthContext, após login (linha 63) e register (linha 90). Chave usada: `authToken`.
- **Onde é lido:** `localStorage.getItem('authToken')` no apiClient (interceptor de request, linha 38), no AuthContext (useEffect e logout), em Navigation e Dashboard (handleLogout), em api.js (getAuthToken) e em Pagamentos.jsx.
- **Onde é removido no logout:**
  - AuthContext.logout: `localStorage.removeItem('authToken')`.
  - Navigation/Dashboard handleLogout: `localStorage.removeItem('authToken')` e `localStorage.removeItem('user')`.
  - api.js logout(): `localStorage.removeItem('authToken')` e `localStorage.removeItem('userData')`.
  - apiClient (interceptor de response): em resposta 401, `localStorage.removeItem('authToken')` e `localStorage.removeItem('userData')`.

Não é usado `sessionStorage` para o token; apenas `localStorage`.

---

## 3. Chamadas HTTP

- **POST /auth/logout:** O frontend chama `apiClient.post('/auth/logout', { token })` em Navigation.jsx (linha 68) e Dashboard.jsx (linha 85).
- **Backend:** No server-fly.js **não existe** rota `POST /auth/logout`. Existem apenas rotas sob `/api/auth/` (register, login, forgot-password, reset-password, verify-email, change-password) e `/auth/login` (compatibilidade). Nenhuma delas é de logout.
- **Efeito:** A chamada ao backend resulta em 404 (ou erro de rede). O código trata o erro no catch e mesmo assim executa logout local (remove token e user) e redireciona para `/`. Do ponto de vista do usuário, o logout funciona; apenas a requisição ao backend falha.

---

## 4. Backend

- **Rotas de autenticação encontradas:**  
  - POST /api/auth/register  
  - POST /api/auth/login  
  - POST /api/auth/forgot-password  
  - POST /api/auth/reset-password  
  - POST /api/auth/verify-email  
  - PUT /api/auth/change-password (authenticateToken)  
  - POST /auth/login (compatibilidade, redireciona para mesma lógica)
- **Não existe:** POST /auth/logout, POST /api/auth/logout ou qualquer rota que invalide sessão/token.
- **Conclusão:** O backend não implementa logout; depende apenas da expiração do JWT e da remoção do token no cliente.

---

## 5. Segurança do JWT

- **Geração:** `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' })` nos fluxos de login e register (server-fly.js, linhas 750–757, 825–832, 974–977, 2896–2899). Payload inclui userId, email, username.
- **Validação:** `authenticateToken`: lê header `Authorization`, extrai Bearer token, `jwt.verify(token, process.env.JWT_SECRET)`; em erro (expirado ou inválido) responde 403 "Token inválido".
- **Expiração:** 24 horas. Após isso, qualquer requisição com esse token resulta em 403 e o interceptor do apiClient (401) remove authToken e userData.
- **Blacklist / invalidação no servidor:** Não existe. O backend não mantém lista de tokens revogados; um token válido e não expirado continua aceito até vencer.
- **Uso do token:** O apiClient envia o token apenas se existir em localStorage (`if (token) config.headers.Authorization = \`Bearer ${token}\``). Após logout local, o token é removido e as próximas requisições não levam Authorization; as rotas protegidas retornam 401.

---

## 6. Fluxo real do logout

```
PLAYER
  ↓
Clica em Logout (Navigation ou Dashboard)
  ↓
handleLogout()
  ↓
token = localStorage.getItem('authToken')
  ↓
Se token: apiClient.post('/auth/logout', { token })  → 404 (rota inexistente)
  ↓
catch (erro) ou após await
  ↓
localStorage.removeItem('authToken')
localStorage.removeItem('user')
  ↓
navigate('/')
  ↓
Usuário na rota raiz (login); sem token, rotas protegidas não são acessíveis com sucesso
```

- O AuthContext.logout (só limpeza de token e estado) não é acionado pelos botões de logout atuais; quem efetua a limpeza e o redirect é o handleLogout das páginas.
- Não há chamada HTTP bem-sucedida de logout; a tentativa POST /auth/logout falha e o fluxo continua com logout local e redirect.

---

## 7. Riscos identificados

1. **Rota POST /auth/logout inexistente:** Frontend chama um endpoint que não existe. Gera erro 404 (ou similar) em cada logout. Impacto: apenas log de erro e requisição falha; logout local e redirect ocorrem normalmente. **Risco funcional baixo para V1.**

2. **Token reutilizável até expirar:** Quem copiar o token antes do logout pode continuar usando-o até as 24h. Não há invalidação no servidor. Para a demo V1, com expiração de 24h e uso em ambiente controlado, isso é **aceitável** conforme critério informado (“Não é necessário invalidar JWT no servidor para V1”).

3. **Sessão persistente apenas no cliente:** Enquanto o token estiver no localStorage e não expirado, o usuário permanece “logado” para o frontend. O único “encerramento” de sessão é a remoção do token (logout ou 401). Não há risco adicional além do já descrito (token removido no logout).

4. **Inconsistência de chaves no localStorage:** Logout remove `authToken` e `user` (Navigation/Dashboard); AuthContext não grava `user` em localStorage; api.js e apiClient usam `userData`. Pode haver chave `user` ou `userData` restante após logout em alguns fluxos. **Risco baixo:** o que protege as rotas é a ausência de `authToken`; o backend não usa `user`/`userData` do cliente.

5. **AuthContext.logout sem redirect:** Se algum código chamar apenas AuthContext.logout() sem navigate, o usuário fica na mesma página sem token; a próxima chamada à API retornará 401 e o interceptor pode limpar token. **Risco baixo** para V1, pois os botões de logout usam handleLogout com redirect.

---

## 8. Classificação final

**SEGURO PARA V1**

- **Token é removido no frontend:** Sim; handleLogout e AuthContext.logout removem `authToken`; em 401 o apiClient também remove.
- **Sem token não há acesso às rotas protegidas:** Sim; o backend exige Authorization Bearer e retorna 401/403 sem token ou com token inválido; o cliente não envia token após remoção.
- **Backend valida JWT:** Sim; authenticateToken usa jwt.verify com JWT_SECRET.
- **Expiração existe:** Sim; 24h em todos os pontos de emissão do token.

Não é necessário invalidar o JWT no servidor para V1; logout local (remoção do token + redirect) é suficiente para a demo. A inexistência de POST /auth/logout no backend gera apenas uma requisição falha no console, sem impacto na segurança do logout nem no critério de validação adotado.
