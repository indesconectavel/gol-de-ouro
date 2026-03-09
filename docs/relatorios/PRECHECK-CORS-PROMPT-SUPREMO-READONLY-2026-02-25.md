# Pré-check CORS Vercel Preview — READ-ONLY

**Data:** 2026-02-25  
**Modo:** 100% READ-ONLY (nenhuma alteração aplicada)  
**Objetivo:** Responder com evidência às perguntas críticas antes de qualquer alteração de CORS, garantindo risco zero para produção e admin.

---

## 1. Resumo executivo

O login no preview do Vercel falha por **bloqueio CORS no preflight (OPTIONS)**: a origem do preview (`https://goldeouro-player-*.vercel.app`) não está na whitelist do backend. O backend usa **apenas header `Authorization: Bearer`** (sem cookies); o frontend usa **`withCredentials: false`** e armazena o token em **localStorage**. O CORS está configurado em **um único ponto efetivo** (`server-fly.js`); `credentials: true` no backend é **redundante** para o fluxo atual mas não causa problema. O patch mínimo seguro é **estender a lógica de `origin`** para aceitar, além da lista atual, origens que casem com o padrão `https://goldeouro-player-*.vercel.app` (regex restrita), mantendo produção e admin inalterados.

---

## 2. Evidências do frontend (player)

### 2.1 Onde o axios é configurado

**Arquivo:** `goldeouro-player/src/services/apiClient.js`

```9:16:goldeouro-player/src/services/apiClient.js
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  withCredentials: false, // Desabilitar credentials para evitar CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

### 2.2 withCredentials

**Evidência:** `withCredentials: false` (linha 12 do mesmo arquivo). Comentário no código: "Desabilitar credentials para evitar CORS".

### 2.3 Interceptor adicionando Authorization: Bearer

**Arquivo:** `goldeouro-player/src/services/apiClient.js`

```38:41:goldeouro-player/src/services/apiClient.js
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
```

### 2.4 Onde o token é armazenado

- **Login/registro:** `goldeouro-player/src/contexts/AuthContext.jsx` — após resposta do login/register, o token é gravado em **localStorage**:

```62:64:goldeouro-player/src/contexts/AuthContext.jsx
      const { token, user: userData } = response.data
      localStorage.setItem('authToken', token)
      setUser(userData)
```

- **Config/helpers:** `goldeouro-player/src/config/api.js` — `getAuthToken()` retorna `localStorage.getItem('authToken')`; `logout()` faz `localStorage.removeItem('authToken')` e `localStorage.removeItem('userData')`.

**Conclusão:** Token em **localStorage** (`authToken`), não em cookie HTTPOnly. Nenhum uso de cookie para autenticação no player.

### 2.5 URL base da API (player)

**Arquivo:** `goldeouro-player/src/config/api.js`

```9:9:goldeouro-player/src/config/api.js
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
```

O `apiClient` usa `env.API_BASE_URL` vindo de `validateEnvironment()` que usa essa mesma base. Em preview Vercel, normalmente `VITE_BACKEND_URL` não é redefinido, então o player chama **https://goldeouro-backend-v2.fly.dev** (cross-origin em relação ao preview).

---

## 3. Evidências do backend

### 3.1 Login: cookie ou apenas JSON com token?

**Arquivo:** `server-fly.js` — endpoint `POST /api/auth/login` (aprox. linhas 584–1005).

Resposta do login:

```984:996:server-fly.js
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        ...
      }
    });
```

**Evidência:** Não há `res.cookie(...)` nem `res.setHeader('Set-Cookie', ...)` no fluxo de login. O backend **não seta cookie**; devolve o token no corpo JSON.

### 3.2 Autenticação: o que o backend espera?

**Arquivo:** `server-fly.js` — middleware `authenticateToken` (linhas 341–364):

```341:344:server-fly.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  ...
```

**Evidência:** O backend espera **header `Authorization`** com formato `Bearer <token>`. Não há leitura de `req.cookies` para autenticação.

---

## 4. Matriz de decisão: cookie vs header, credentials ou não

| Pergunta | Resposta | Evidência |
|----------|----------|-----------|
| Login usa cookie HTTPOnly? | **Não** | Backend não chama `res.cookie`; resposta é só `res.json({ token, user })`. |
| Login usa Authorization header? | **Sim** | Frontend interceptor adiciona `Authorization: Bearer ${token}`; backend lê `req.headers['authorization']`. |
| Token armazenado onde? | **localStorage** | `localStorage.setItem('authToken', token)` no AuthContext após login/register. |
| Frontend usa withCredentials? | **Não** | `withCredentials: false` em apiClient.js. |
| Backend CORS tem credentials: true? | **Sim** | server-fly.js linha 248: `credentials: true`. |
| credentials é necessário para o fluxo atual? | **Não** | Como não há cookies e o token vai no header, o navegador não envia cookies; `credentials: true` no servidor apenas exige que, se no futuro o cliente enviar cookies, a origem precise estar na whitelist. Não é necessário para o fluxo atual (header + localStorage). Manter ou remover é decisão de segurança conservadora: manter não quebra nada. |

---

## 5. Como a whitelist de origins é definida HOJE

### 5.1 Onde CORS_ORIGIN é lido

**Arquivo:** `server-fly.js` — função `parseCorsOrigins` (linhas 236–244):

```236:244:server-fly.js
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};
```

- **Leitura:** `process.env.CORS_ORIGIN` (uma única vez ao carregar o app; não é reavaliado por request).
- **Parse:** CSV por vírgula, depois `trim()` em cada item e `filter(Boolean)` para remover vazios.
- **Default quando ENV não existe ou está vazio:** lista de três origens: `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`.

### 5.2 Como o matching é feito

O resultado de `parseCorsOrigins()` é passado como `origin` para o pacote `cors`:

```246:251:server-fly.js
app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

Com `origin` sendo um **array de strings**, o pacote `cors` faz **match exato** do valor de `req.headers.origin` contra essa lista (equivalente a `allowedOrigins.includes(origin)`). Não há regex, nem `startsWith` nem wildcard no código atual.

---

## 6. Existe mais de um ponto de CORS?

### 6.1 server-fly.js (entry point em produção no Fly)

- **CORS ativo:** Sim. Único `app.use(cors(...))` que o processo em produção usa (Dockerfile: `CMD ["node", "server-fly.js"]`).

### 6.2 middlewares/security-performance.js

- **Conteúdo:** Define `corsOptions` e `secureCors = cors(corsOptions)` com whitelist fixa (inclui `https://goldeouro-player.vercel.app`).
- **Uso:** Nenhum `require('./middlewares/security-performance')` ou equivalente em `server-fly.js` foi encontrado. Esse middleware **não é usado** pelo servidor atual.

### 6.3 server-fly-deploy.js

- **Conteúdo:** Outro arquivo que usa `cors` (linhas 120–121). É um **entry point alternativo**; o Fly.io usa `server-fly.js`, não este. Não é ponto efetivo no deploy atual.

### 6.4 fly.toml

- **Conteúdo:** Apenas `[env] NODE_ENV = "production"`. Nenhuma configuração de headers HTTP ou CORS.

### 6.5 nginx (player / admin)

- **goldeouro-player/nginx.conf:** Contém um bloco `location /api/` com `add_header Access-Control-Allow-Origin *` e outros headers CORS. Esse nginx é usado pelo **Dockerfile do player** para servir o build estático; em deploy na **Vercel** o player não passa por esse nginx. As requisições do browser no preview vão **diretamente** para `https://goldeouro-backend-v2.fly.dev`, então o CORS relevante é o do **backend** (server-fly.js), não o do nginx do player.

### 6.6 Conclusão

**Único ponto efetivo de CORS** para a requisição cross-origin (preview Vercel → Fly.io) é o middleware `cors` em **server-fly.js**. Os outros (security-performance, server-fly-deploy, nginx do player) não participam do fluxo atual do preview.

---

## 7. O mesmo backend atende Player e Admin?

### 7.1 Player

- **URL base:** `import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'` (`goldeouro-player/src/config/api.js`).
- **Variáveis:** `VITE_BACKEND_URL` (opcional). Se ausente, usa `https://goldeouro-backend-v2.fly.dev`.

### 7.2 Admin

- **URL base:** Em produção, `getApiUrl()` em `goldeouro-admin/src/config/env.js` retorna **`/api`** (proxy do Vercel, mesma origem). Em desenvolvimento, `import.meta.env.VITE_API_URL || 'http://localhost:8080'`.
- **Variáveis:** `VITE_API_URL` (dev). Em prod o admin não chama o Fly diretamente; chama `/api`, que o Vercel faz proxy para o backend.

**Conclusão:** O **mesmo** backend (goldeouro-backend-v2.fly.dev) é a API de dados. O **player** chama esse backend diretamente (cross-origin). O **admin** em produção chama via proxy (`/api`), então a origem que o backend vê pode ser a do domínio do admin (ex.: admin.goldeouro.lol). Produção e admin continuam cobertos pelas origens atuais (goldeouro.lol, www, admin). O patch deve **apenas** acrescentar o padrão de preview do **player**, sem alterar o tratamento das origens já permitidas.

---

## 8. O erro atual do preview é 100% CORS (preflight)?

### 8.1 Relatório existente

**Arquivo:** `docs/relatorios/RELATORIO-PROBLEMA-CORS-LOGIN-2026-02-02.md`

- Mensagem: "Response to preflight request doesn't pass access control check: **No 'Access-Control-Allow-Origin' header**..."
- Request: **OPTIONS** (preflight) e depois o POST não chega a ser enviado.
- Endpoint: **/api/auth/login**.
- Conclusão do relatório: "não é quebra de jogo/conta, é **bloqueio de CORS** no backend".

### 8.2 Código do frontend (tratamento de CORS)

**Arquivo:** `goldeouro-player/src/services/apiClient.js` (linhas 152–173): em erro de resposta, se a mensagem inclui "Failed to fetch" ou "CORS", o código tenta uma segunda requisição direta para `https://goldeouro-backend-v2.fly.dev` com `withCredentials: false`. Isso não contorna o bloqueio do preflight: o preflight já falhou, então o navegador nem envia o POST.

**Conclusão:** O erro observado no preview é **100% CORS (preflight)**: origem do preview não permitida → preflight OPTIONS sem `Access-Control-Allow-Origin` → navegador bloqueia → POST de login não é enviado. Não há evidência de outro tipo de erro (ex.: 401, 500) como causa primária no preview; qualquer outro erro só poderia aparecer depois de o CORS ser corrigido.

---

## 9. Descrição do patch mínimo seguro (NÃO APLICAR)

### 9.1 O que mudar

- **Arquivo:** `server-fly.js`.
- **Bloco:** Configuração do `cors`, em particular a opção `origin`.

### 9.2 Comportamento desejado

- **Produção e admin inalterados:** Manter exatamente a lista atual (CORS_ORIGIN ou default: goldeouro.lol, www.goldeouro.lol, admin.goldeouro.lol). Qualquer origem que hoje é permitida deve continuar permitida.
- **Preview do player:** Aceitar **somente** origens que casem com o padrão do projeto **goldeouro-player** na Vercel, por exemplo:
  - `https://goldeouro-player-<sufixo>.vercel.app` (ex.: commit ou branch).
  - Regex restrita sugerida (conceitual): algo como `^https://goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$` para não permitir qualquer `*.vercel.app`, apenas subdomínios que comecem com `goldeouro-player`.

### 9.3 Implementação sugerida (apenas descrição)

- Trocar `origin: parseCorsOrigins()` por uma **função** `(origin, callback)` (ou equivalente com Promise) que:
  1. Se não houver `origin` (ex.: same-origin, Postman), permitir (`callback(null, true)` ou retorno que indique sucesso).
  2. Se `origin` estiver na lista retornada por `parseCorsOrigins()`, permitir (comportamento idêntico ao atual).
  3. Se `origin` casar com a regex restrita de preview (ex.: `goldeouro-player-...vercel.app`), permitir.
  4. Caso contrário, não permitir (callback com erro ou `false`).
- **Não** adicionar `*` nem qualquer domínio genérico. **Não** alterar métodos, allowedHeaders nem credentials no CORS (a menos que se decida remover `credentials: true` por consistência com o frontend; isso é opcional e separado).

### 9.4 Justificativa

- Risco zero para produção e admin: a lista atual e a lógica de match exato para essas origens permanecem.
- O preview passa a funcionar porque a origem do deployment Vercel do player entra na whitelist por regex restrita ao nome do projeto.
- Não se abre para outros projetos Vercel nem para outros domínios.

---

## 10. Checklist de validação pós-fix

### 10.1 Curl preflight (OPTIONS)

```bash
# Substituir ORIGIN_PREVIEW pela URL real do preview (ex.: https://goldeouro-player-abc123xyz.vercel.app)
curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" \
  -H "Origin: ORIGIN_PREVIEW" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Esperado:** Status 204 ou 200; header `Access-Control-Allow-Origin: <ORIGIN_PREVIEW>`; `Access-Control-Allow-Methods` incluindo POST; `Access-Control-Allow-Headers` incluindo Content-Type e Authorization; `Access-Control-Allow-Credentials: true` (se mantido).

### 10.2 Teste real no browser

1. Abrir o preview no Vercel (ex.: `https://goldeouro-player-xxx.vercel.app`).
2. Abrir DevTools → Network.
3. Tentar login (email/senha).
4. Verificar: OPTIONS para `/api/auth/login` com status 2xx e headers CORS corretos; em seguida POST para `/api/auth/login` executado; login concluído sem erro de CORS no console.

### 10.3 Produção e admin inalterados

- Em **https://www.goldeouro.lol** (ou **https://goldeouro.lol**): login e uso normal.
- Em **admin** (ex.: **https://admin.goldeouro.lol** ou fluxo via proxy): login admin e uso normal.
- Nenhuma alteração de comportamento para origens já permitidas.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo do projeto foi alterado.*
