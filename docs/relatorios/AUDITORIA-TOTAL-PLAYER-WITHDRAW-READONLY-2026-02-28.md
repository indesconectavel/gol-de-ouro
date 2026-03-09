# Auditoria total player — /withdraw não chama backend Fly em produção (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** READ-ONLY (nenhum arquivo alterado)  
**Objetivo:** Mapear por que `/withdraw` não está chamando o backend Fly em produção.

---

## ETAPA 1 — BASE_URL real usada em produção

### Arquivos analisados
- `goldeouro-player/src/config/api.js`
- `goldeouro-player/src/config/environments.js`
- `goldeouro-player/src/services/apiClient.js`

### api.js
- **API_BASE_URL:** `import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'`
- Usa **import.meta.env** (Vite). Fallback hardcoded: `https://goldeouro-backend-v2.fly.dev`
- **Não há** fallback para `/api` (path relativo)
- Exporta `API_ENDPOINTS` (inclui `WITHDRAW_REQUEST`, `WITHDRAW_HISTORY`) e `API_CONFIG.baseURL` — **o apiClient não usa api.js para baseURL**

### environments.js
- Objeto **hardcoded** por ambiente:
  - **development:** `API_BASE_URL: 'http://localhost:8080'`
  - **staging:** `API_BASE_URL: 'https://goldeouro-backend.fly.dev'`
  - **production:** `API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev'`
- Detecção de ambiente: **runtime**, por `window.location.hostname` (localhost → development; staging/test → staging; resto → production)
- Não usa `import.meta.env` nem `process.env` para `API_BASE_URL`; valores são fixos no código

### apiClient.js
- **baseURL do axios:** `env.API_BASE_URL` onde `env = validateEnvironment()` → **getCurrentEnvironment()** de `environments.js`
- Ou seja: **quem define a base da URL das requisições é `environments.js`**, não `api.js`
- Em produção (hostname diferente de localhost/staging/test), usa `environments.production.API_BASE_URL` = `https://goldeouro-backend-v2.fly.dev`

### Respostas ETAPA 1

| Pergunta | Resposta |
|----------|----------|
| **BASE_URL definido como** | Em **api.js**: `import.meta.env.VITE_BACKEND_URL \|\| 'https://goldeouro-backend-v2.fly.dev'`. No **apiClient** (efetivo): `environments.production.API_BASE_URL` = `'https://goldeouro-backend-v2.fly.dev'` (hardcoded em `environments.js`). |
| **Ambiente de produção usa** | `environments.production` (detectado por hostname em runtime). |
| **Em produção o player chama** | `https://goldeouro-backend-v2.fly.dev` + path (ex.: `/api/withdraw/request`). Ou seja, **chamadas vão para o Fly**, não para path relativo `/api` no próprio player. |

---

## ETAPA 2 — Endpoint usado no Withdraw

### Arquivos analisados
- `goldeouro-player/src/pages/Withdraw.jsx`
- `goldeouro-player/src/services/withdrawService.js`

### Withdraw.jsx
- **Importa:** `withdrawService` e `API_ENDPOINTS` (de `../config/api`)
- **Solicitar saque:** `withdrawService.requestWithdraw({ valor, chave_pix, tipo_chave })` (linha 101)
- **Histórico:** `withdrawService.getWithdrawHistory()` (linha 63)
- **Não chama** `paymentService.createPix` para saque no código atual

### withdrawService.js
- **requestWithdraw:** `apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, { valor, chave_pix, tipo_chave })`
- **getWithdrawHistory:** `apiClient.get(API_ENDPOINTS.WITHDRAW_HISTORY)`
- **API_ENDPOINTS** importado de `../config/api` → `WITHDRAW_REQUEST: '/api/withdraw/request'`, `WITHDRAW_HISTORY: '/api/withdraw/history'`
- **URL final:** `baseURL` do apiClient (Fly) + path → `https://goldeouro-backend-v2.fly.dev/api/withdraw/request` e `.../api/withdraw/history`

### Respostas ETAPA 2

| Pergunta | Resposta |
|----------|----------|
| **Withdraw request chama** | `POST` para `API_ENDPOINTS.WITHDRAW_REQUEST` = `/api/withdraw/request` (via apiClient). |
| **Withdraw history chama** | `GET` para `API_ENDPOINTS.WITHDRAW_HISTORY` = `/api/withdraw/history` (via apiClient). |
| **Usa API_ENDPOINTS.WITHDRAW_REQUEST?** | **SIM.** |
| **URL final resolvida** | `https://goldeouro-backend-v2.fly.dev/api/withdraw/request` (POST) e `https://goldeouro-backend-v2.fly.dev/api/withdraw/history` (GET). |

---

## ETAPA 3 — Build e uso de withdrawService

### Buscas realizadas
- `withdrawService` → presente em `Withdraw.jsx` (import + `requestWithdraw` + `getWithdrawHistory`) e em `withdrawService.js`
- `WITHDRAW_REQUEST` → em `config/api.js` e `withdrawService.js`
- `/api/withdraw/request` → em `withdrawService.js` (comentário), `config/api.js` (constante), docs e testes

### Respostas ETAPA 3

| Pergunta | Resposta |
|----------|----------|
| **withdrawService presente** | **SIM** — arquivo existe e está importado. |
| **Withdraw.jsx usa withdrawService** | **SIM** — para saque e histórico. |
| **Existe código antigo chamando paymentService.createPix para saque** | **NÃO** — em `Withdraw.jsx` atual não há chamada a `createPix` para saque; há apenas `paymentService.getConfig().minAmount` e `paymentService.isSandboxMode()` (exibição). `paymentService.createPix` existe em `paymentService.js` (depósito PIX), mas não é usado na tela de saque. |

**Observação:** Documentos como `AUDITORIA-SAQUE-READONLY.md` e `CHECKLIST-GO-LIVE` descrevem o fluxo antigo (createPix para saque). O código fonte atual já está corrigido para usar `withdrawService` e os endpoints de withdraw. Se em produção ainda falha, pode ser **build/deploy desatualizado** (bundle antigo no ar).

---

## ETAPA 4 — Rotas no backend Fly

### Arquivo analisado
- `server-fly.js` (trechos das linhas 1388–1720)

### Rotas
- **POST** `/api/withdraw/request` — linha 1394, `authenticateToken`, handler completo (validação PixValidator, idempotência, débito saldo, Supabase)
- **GET** `/api/withdraw/history` — linha 1667, `authenticateToken`, retorna `data.saques` do Supabase
- **Condição interna:** ambas checam `if (!dbConnected || !supabase)` e retornam **503** se o DB não estiver disponível; **não** dependem de feature flag ou ENV para serem registradas (são `app.post` / `app.get` diretos)

### Respostas ETAPA 4

| Pergunta | Resposta |
|----------|----------|
| **Rota POST withdraw registrada** | **SIM** — linha 1394. |
| **Rota GET history registrada** | **SIM** — linha 1667. |
| **Dependem de ENV** | **NÃO** — rotas sempre registradas; apenas resposta 503 se DB indisponível. |

---

## ETAPA 5 — Deploy e variáveis

### Arquivos verificados
- `goldeouro-player/.env.production` — contém apenas `VERCEL_OIDC_TOKEN`; **não** define `VITE_BACKEND_URL`
- `goldeouro-player/vercel.json` — `buildCommand`, `outputDirectory`, `framework`, headers, rewrites; **nenhuma** variável de ambiente
- Base URL em produção no **código** vem de `environments.js` (hardcoded), não de `.env.production`; o apiClient **não** usa `api.js` para baseURL

### Respostas ETAPA 5

| Pergunta | Resposta |
|----------|----------|
| **Produção aponta para** | `https://goldeouro-backend-v2.fly.dev` (via `environments.production.API_BASE_URL` em runtime). |
| **Backend esperado** | Fly (goldeouro-backend-v2.fly.dev). |
| **Existe divergência entre ambiente local e produção** | **Não na base URL do apiClient** — local usa `localhost:8080`, produção usa Fly; origem da URL é a mesma (`environments.js`). Divergência possível apenas se no Vercel existir `VITE_BACKEND_URL` definida (não verificável só com repositório); em qualquer caso, o **apiClient** ignora `api.js` e usa só `environments.js`. |

---

## ETAPA 6 — Player batendo nele mesmo / proxy

### vercel.json (player)
- **rewrites:** apenas `"/download"` → `"/download.html"` e `"/(.*)"` → `"/index.html"`
- **Não há** rewrite `"/api/(.*)"` → backend
- **Não há** proxy para `https://goldeouro-backend-v2.fly.dev`

### Requisições do player
- apiClient usa **baseURL absoluta** (`env.API_BASE_URL` = Fly), então as requisições são **cross-origin** para o Fly, **não** para o mesmo domínio do player
- Ou seja: o player **não** envia requisições para `/api` no próprio origin; envia para `https://goldeouro-backend-v2.fly.dev/api/...`

### Respostas ETAPA 6

| Pergunta | Resposta |
|----------|----------|
| **Vercel intercepta /api** | **NÃO** — não existe rewrite nem regra para `/api` no `vercel.json` do player. |
| **/api está sendo servido pelo player** | **NÃO** — o front não chama path relativo `/api`; chama URL completa do Fly. |

---

## Resultado esperado — Diagnóstico

### Causa raiz (hipóteses por ordem de probabilidade)

1. **Build/deploy desatualizado**  
   O código atual usa `withdrawService` e Fly. Se o deploy na Vercel estiver servindo um build antigo (antes do patch de withdraw), o bundle ainda pode estar chamando `paymentService.createPix` (depósito) em vez de `withdrawService.requestWithdraw` (saque). **Onde quebra:** no asset JS servido (página /withdraw executa código antigo).

2. **CORS**  
   O browser faz a requisição para `https://goldeouro-backend-v2.fly.dev` (cross-origin). Se o backend Fly não incluir o origin do player (ex.: `https://goldeouro.lol` ou domínio Vercel) em `Access-Control-Allow-Origin`, o browser bloqueia e a chamada "não chega" ao backend do ponto de vista do front. **Onde quebra:** na resposta CORS do Fly (preflight ou resposta sem header adequado).

3. **Ambiente/URL errada apenas em build antigo**  
   Se por engano algum build antigo usasse `api.js` com `VITE_BACKEND_URL` vazia e algum fallback diferente, ou se houvesse um proxy antigo que deixou de existir, o player poderia estar chamando outro host. No código **atual** isso não ocorre: baseURL vem de `environments.js` e em produção é sempre o Fly.

4. **Backend Fly retornando 503**  
   Se `dbConnected` ou `supabase` estiverem falsos no Fly, as rotas de withdraw retornam 503. O front "chama" o backend, mas a resposta é erro. **Onde quebra:** no Fly (estado do DB/Supabase).

5. **Rota não publicada**  
   Improvável: as rotas estão em `server-fly.js` sem condição de ENV; o mesmo arquivo é o que sobe no Fly.

### Onde exatamente pode estar quebrando

- **Se a requisição nem aparece na aba Network (produção):** provável CORS (preflight bloqueado) ou JS antigo (outro endpoint ou erro antes do request).
- **Se aparece POST para outro host ou para `/api/payments/pix/criar`:** build antigo (código de depósito no lugar do saque).
- **Se aparece POST para `.../api/withdraw/request` com status 4xx/5xx:** problema no backend (auth, validação, 503 por DB, etc.).

### Classificação do problema

| Tipo | Sim/Não |
|------|--------|
| BaseURL | **NÃO** — em código atual produção usa Fly. |
| Build não atualizado | **POSSÍVEL** — se deploy não refletir o patch de withdraw. |
| Rota não publicada | **NÃO** — rotas existem em server-fly.js. |
| CORS | **POSSÍVEL** — cross-origin para Fly; depende da config do Fly. |
| Ambiente errado | **NÃO** — no código, produção = Fly. |

### Correção mínima necessária (para aplicar depois, fora desta auditoria)

- **Se for build:** garantir deploy na Vercel com o código atual (Withdraw.jsx + withdrawService + apiClient com baseURL via environments.js) e validar na aba Network que o POST vai para `https://goldeouro-backend-v2.fly.dev/api/withdraw/request`.
- **Se for CORS:** no backend Fly, garantir que o origin do player (ex.: `https://goldeouro.lol` e, se aplicável, domínios Vercel de preview) esteja em `Access-Control-Allow-Origin` (e headers de preflight se necessário).
- **Se for 503:** checar no Fly conexão com Supabase e variáveis de ambiente do DB.

---

**Regra respeitada:** nenhum arquivo foi alterado; apenas mapeamento da realidade do código e configuração.
