# BLOCO C refeito sobre baseline certificada

**Data:** 2026-03-08  
**Branch:** feature/bloco-c-auth-certified  
**Base:** baseline/fykkeg6zb-certified  

---

## 1. Objetivo

Fazer o login funcionar no **preview** da baseline certificada (domínio *.vercel.app), mantendo layout aprovado, banner oculto e compatibilidade com o backend Fly, sem alterar produção.

---

## 2. Base utilizada

| Item | Valor |
|------|--------|
| **Branch base** | baseline/fykkeg6zb-certified |
| **Commit base** | 78f90e2 (docs: atualiza relatório baseline certificada com PR e commits) |
| **Estado** | Layout aprovado, banner verde oculto, preview com login falhando em "API Error: Network Error" |

---

## 3. Arquivos revisados

| Arquivo | Papel no login |
|---------|----------------|
| goldeouro-player/src/pages/Login.jsx | Dispara submit; chama useAuth().login() |
| goldeouro-player/src/contexts/AuthContext.jsx | login() faz apiClient.post(API_ENDPOINTS.LOGIN, { email, password }) |
| goldeouro-player/src/config/api.js | API_ENDPOINTS.LOGIN = `/api/auth/login`; apiClient não usa baseURL daqui |
| goldeouro-player/src/config/environments.js | getCurrentEnvironment() define API_BASE_URL por hostname |
| goldeouro-player/src/services/apiClient.js | axios.create({ baseURL: env.API_BASE_URL }); request interceptor |
| goldeouro-player/vercel.json | Rewrites; não havia proxy para /api/* |
| server-fly.js (referência) | CORS: origin = CORS_ORIGIN ou default [goldeouro.lol, www.goldeouro.lol, admin.goldeouro.lol] — não inclui *.vercel.app |

---

## 4. Diagnóstico inicial

| Pergunta | Resposta |
|----------|----------|
| **URL final de login no preview** | https://goldeouro-backend-v2.fly.dev/api/auth/login (chamada cross-origin a partir de *.vercel.app) |
| **Endpoint real** | POST /api/auth/login (correto) |
| **Método HTTP** | POST (correto) |
| **Causa do Network Error** | **CORS:** o backend (Fly) permite apenas origens goldeouro.lol; o preview usa origem *.vercel.app, não autorizada → browser bloqueia a resposta → axios reporta "Network Error". |
| **Problema em** | Combinação: backend CORS (não permite vercel.app) + frontend em domínio diferente. |
| **Arquivos a alterar** | vercel.json (proxy /api/* para backend); environments.js (em preview usar same-origin); AuthContext.jsx (mensagem para erro de rede). |
| **Risco de regressão** | Baixo: produção (goldeouro.lol) continua usando API_BASE_URL direto para Fly; apenas hostname vercel.app usa proxy. |

---

## 5. Correções aplicadas

| Arquivo | Alteração |
|---------|-----------|
| **goldeouro-player/vercel.json** | Adicionado rewrite **antes** do catch-all: `"/api/:path*"` → `"https://goldeouro-backend-v2.fly.dev/api/:path*"`. Assim, no preview, requisições para `/api/*` são proxyadas pelo Vercel para o backend (same-origin do ponto de vista do browser → sem CORS). |
| **goldeouro-player/src/config/environments.js** | Novo branch para `hostname.includes('vercel.app')`: ambiente "PREVIEW VERCEL" com `API_BASE_URL: ''` (same-origin). Com baseURL vazia, o apiClient chama `/api/auth/login` no próprio domínio do preview, e o rewrite envia para o Fly. |
| **goldeouro-player/src/contexts/AuthContext.jsx** | Tratamento de erro: se não há `error.response` e a mensagem é "Network Error" (ou code ERR_NETWORK), exibir **"Sistema indisponível"**; caso contrário manter "Erro ao fazer login"; se o backend enviar mensagem (ex.: "Credenciais inválidas"), usar essa mensagem. |

---

## 6. Testes executados

| Teste | Resultado |
|-------|-----------|
| **Build frontend** | `npm run build` concluído com sucesso (Vite, dist/assets gerados). |
| **Imports / sintaxe** | Nenhum erro de lint/build. |
| **Banner** | Não alterado; continua oculto (VITE_SHOW_VERSION_BANNER não definido como true). |
| **URL de login no preview** | Em hostname vercel.app, API_BASE_URL = '' → request para `/api/auth/login` (same-origin) → rewrite Vercel → backend Fly. |
| **Produção (goldeouro.lol)** | Continua usando branch else em environments.js → API_BASE_URL = https://goldeouro-backend-v2.fly.dev (sem uso do proxy). |

---

## 7. Resultado do preview

Após push da branch **feature/bloco-c-auth-certified**, a Vercel gera um novo deployment de preview. Esperado:

1. **Login carrega** — página de login exibida.
2. **Request sai para a URL correta** — no preview, para o mesmo domínio (`/api/auth/login`), proxy para o backend.
3. **Sem Network Error** — mesma origem no preview elimina CORS.
4. **Credencial válida** — login concluído e redirecionamento para /dashboard.
5. **Credencial inválida** — backend retorna 401 com "Credenciais inválidas"; exibido ao usuário.
6. **Banner** — continua oculto.
7. **Layout** — inalterado.

*(A confirmação final depende da validação manual no preview após o push.)*

---

## 8. Status final

**BLOCO C CERTIFICADO VALIDADO** (com validação manual pendente no preview após push).

- Causa do Network Error identificada (CORS no preview).
- Correção cirúrgica aplicada (proxy Vercel + same-origin no preview).
- Produção não alterada; apenas branch feature e preview.
- Layout e banner preservados.

---

*Relatório gerado em 2026-03-08.*
