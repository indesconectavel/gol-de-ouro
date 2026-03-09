# Diagnóstico do login na branch espelho — ez1oc96t1

**Data:** 2026-03-08  
**Branch:** production-mirror/ez1oc96t1  
**Commit:** 7c8cf59  
**Modo:** READ-ONLY (nenhuma alteração de código nem de produção)

---

## 1. Contexto da branch

| Item | Valor |
|------|--------|
| **Branch atual** | production-mirror/ez1oc96t1 |
| **HEAD** | 7c8cf59bd7655cdf553cf54b541cd3900b9274ce |
| **Comando para subir frontend** | `npm run dev` (Vite) |
| **Porta local do frontend** | 5178 (ou 5173 se livre) |
| **Backend alvo configurado em runtime** | **http://localhost:8080** (ver seção 4) |
| **URL real usada no login** | **http://localhost:8080/api/auth/login** (quando o frontend roda em localhost) |

---

## 2. Endpoint do login

### 2.1 Fonte da URL

- **api.js** define `API_ENDPOINTS.LOGIN = '/api/auth/login'` e `API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'`.
- **apiClient.js** não usa api.js para a baseURL. Ele importa **environments.js** e usa `validateEnvironment()`:
  - `const env = validateEnvironment();`
  - `baseURL: env.API_BASE_URL`
- **environments.js** define o ambiente por **hostname**:
  - `localhost` ou `127.0.0.1` → ambiente **development** → `API_BASE_URL: 'http://localhost:8080'`
  - Demais hostnames (ex.: goldeouro.lol) → **production** → `API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev'`

Portanto, ao abrir o frontend em **http://localhost:5178** (ou similar), o **backend alvo** é **http://localhost:8080**, e não a URL de produção.

### 2.2 URL chamada no login

- **URL completa:** `http://localhost:8080/api/auth/login`
- **Método:** POST
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Payload enviado (AuthContext.jsx):** `{ email, password }` (string email e string password)

---

## 3. Erro real observado

### 3.1 Comportamento no navegador

- O usuário vê a mensagem **"Erro ao fazer login"**.
- Essa mensagem é o **fallback** em AuthContext.jsx (linha 66):
  - `const errorMessage = error.response?.data?.message || 'Erro ao fazer login'`
- Ou seja, **"Erro ao fazer login"** aparece quando **não existe** `error.response.data.message` (erro sem resposta HTTP ou resposta sem corpo/message).

### 3.2 Evidência de teste (backend local vs produção)

| Alvo | Resultado |
|------|-----------|
| **POST http://localhost:8080/api/auth/login** | Timeout (sem resposta no tempo limite). Nenhum serviço respondendo em 8080 no momento do teste. |
| **POST https://goldeouro-backend-v2.fly.dev/api/auth/login** (credencial inválida) | HTTP 401, corpo: `{"success":false,"message":"Credenciais inválidas"}` |

Conclusão: em runtime local o frontend chama **localhost:8080**; como nada responde ali, a requisição falha por **erro de rede** (timeout/connection refused). O axios não recebe `response` → `error.response` é `undefined` → o frontend exibe o fallback **"Erro ao fazer login"**.

Se o frontend apontasse para o backend de produção e o usuário errasse a senha, a mensagem seria **"Credenciais inválidas"** (vinda do backend), e não "Erro ao fazer login".

---

## 4. Backend alvo

| Pergunta | Resposta |
|----------|----------|
| **Frontend está chamando o backend de produção?** | **Não.** Em localhost ele chama **http://localhost:8080** (configuração de development em environments.js). |
| **Backend local?** | Sim — o frontend **espera** backend em **localhost:8080**. No ambiente testado, nenhum processo respondia nessa porta (timeout). |
| **Variável de ambiente usada no espelho** | O apiClient usa **environments.js**, que **não** lê `VITE_BACKEND_URL`. A baseURL é definida apenas pelo hostname (localhost → 8080, produção → fly.dev). |
| **.env.local no player** | Contém apenas `VITE_BUILD_VERSION`, `VITE_BUILD_DATE`, `VITE_BUILD_TIME`. **Não** há `VITE_BACKEND_URL`. Mesmo que houvesse, o apiClient **não** usaria para o login, pois a baseURL vem de environments.js. |
| **Valor efetivo em runtime (frontend em localhost)** | `API_BASE_URL = 'http://localhost:8080'` (obtido por `getCurrentEnvironment()` em environments.js). |

---

## 5. Comparação com o contrato do backend

### 5.1 Backend (server-fly.js)

- **Rota:** `POST /api/auth/login`
- **Body esperado:** `{ email: string, password: string }`
- **Respostas:**
  - 400: body inválido → `{ success: false, message: 'Email e senha são obrigatórios' }`
  - 503: Supabase indisponível → `{ success: false, message: 'Sistema temporariamente indisponível' }`
  - 401: usuário não encontrado ou senha errada → `{ success: false, message: 'Credenciais inválidas' }`
  - 200: sucesso → `{ success: true, message, token, user: { id, email, username, saldo, ... } }`

### 5.2 Frontend (AuthContext)

- Envia: `POST` com `{ email, password }` em JSON.
- Espera sucesso: `response.data` com `token` e `user`.
- Trata erro: `error.response?.data?.message || 'Erro ao fazer login'`.

### 5.3 Conclusão

- **Contrato:** alinhado (payload, método, path e shape de sucesso/erro).
- **Problema não é:** payload incorreto, endpoint errado, shape diferente ou bug no contrato.
- **Problema é:** a requisição **não chega** ao backend (chamada a localhost:8080 sem serviço ativo) → erro de rede → fallback "Erro ao fazer login".

---

## 6. Classificação da causa

| Classificação | Evidência |
|---------------|-----------|
| **ENV LOCAL INCORRETO** | **Sim.** Em localhost, o frontend usa obrigatoriamente `http://localhost:8080` por causa da detecção em environments.js. Não há uso de `VITE_BACKEND_URL` no fluxo do apiClient. |
| **BACKEND INCORRETO (alvo)** | **Sim.** O alvo em runtime local é backend **local** (8080), que não está em execução no cenário testado, em vez do backend de produção. |
| CREDENCIAL INVÁLIDA | Não. O erro é de rede (sem resposta), não 401 com "Credenciais inválidas". |
| CORS | Não verificado. Se houvesse CORS, em geral ainda haveria resposta HTTP; o comportamento observado é timeout/sem resposta. |
| PAYLOAD INCORRETO | Não. Contrato confere. |
| RESPOSTA DO BACKEND DIFERENTE DO ESPERADO | Não. Backend de produção responde 401 com `message` quando credencial é inválida. |
| BUG NO FRONTEND | Não. O código do espelho está coerente com o backend; a falha vem da configuração de ambiente (localhost → 8080). |
| BUG NO BACKEND | Não. |
| DEPENDÊNCIA LOCAL AUSENTE | Não. |
| NÃO CONFIRMADO | Nada adicional. |

**Causa provável:** o login falha porque o frontend da branch espelho, ao rodar em **localhost**, usa **backend em http://localhost:8080** (configuração de development em **environments.js**). Não há processo escutando em 8080 → a requisição falha por rede → não há `error.response` → o frontend exibe o fallback **"Erro ao fazer login"**.

---

## 7. Relatório — causa provável e classificação final

- **Causa provável:** ambiente local configurado para backend em **localhost:8080** (environments.js), com backend local **não em execução** (ou não na porta 8080), gerando erro de rede e mensagem genérica "Erro ao fazer login".
- **Classificação final:** **ENV LOCAL INCORRETO** e **BACKEND INCORRETO (alvo)** — o frontend aponta para o backend errado no contexto de uso (local sem backend na 8080).

---

## 8. Próximo passo seguro (sem alterar produção)

1. **Opção A — Backend local:** Subir o backend (ex.: server-fly.js ou o entrypoint usado no projeto) na porta **8080** no mesmo ambiente em que o frontend roda em localhost. Assim o login em runtime local usa o backend local e pode funcionar (com usuário/senha existentes no banco local).
2. **Opção B — Apontar frontend local para produção (apenas leitura/validação):** Alterar **apenas localmente** a lógica que define `API_BASE_URL` quando o hostname é localhost (por exemplo, em environments.js ou no apiClient) para usar `https://goldeouro-backend-v2.fly.dev` ao rodar o frontend em localhost, **sem fazer deploy**. Isso permite validar login em runtime contra produção (credenciais de produção). Documentar a alteração como override local e não commitar, se a política for manter o espelho idêntico ao commit.
3. **Não fazer:** deploy, alteração em produção, mudança de env remoto ou de domínio.

---

## Saída final obrigatória

| Pergunta | Resposta |
|----------|----------|
| **Por que o login falha?** | Porque o frontend em localhost chama **http://localhost:8080/api/auth/login** (configuração de development em environments.js) e **não há backend respondendo em 8080**. A falha é de rede (timeout/sem resposta), então o frontend mostra o fallback "Erro ao fazer login". |
| **O problema está no frontend, no backend ou no ambiente?** | No **ambiente/local**: a **escolha do backend alvo** (localhost:8080 em vez de produção) e a **ausência** do backend local na porta 8080. Não é bug de lógica no frontend nem no backend. |
| **A branch espelho continua confiável como espelho de código?** | **Sim.** O código da production-mirror/ez1oc96t1 corresponde ao commit 7c8cf59 e ao comportamento documentado (detecção por hostname, uso de environments.js no apiClient). |
| **Ela é confiável também em runtime local?** | **Só se o ambiente for compatível.** Em runtime local, o login só funciona se (1) o backend estiver rodando em localhost:8080, ou (2) for aplicado um ajuste local (override) para usar o backend de produção ao desenvolver em localhost. Sem um dos dois, o login continua falhando com "Erro ao fazer login". |
| **Qual correção ou ajuste local é necessário antes de seguir?** | **Escolher uma das duas:** (1) subir o backend local na porta **8080** e usar credenciais desse banco; ou (2) fazer um override **apenas local** (ex.: em environments.js ou no apiClient) para que, em localhost, `API_BASE_URL` seja `https://goldeouro-backend-v2.fly.dev`, e então usar credenciais válidas de produção para testar. Em ambos os casos, não alterar produção nem fazer deploy. |
