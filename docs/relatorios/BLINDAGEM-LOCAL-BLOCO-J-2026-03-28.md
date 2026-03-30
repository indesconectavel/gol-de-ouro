# BLINDAGEM LOCAL — BLOCO J

**Data:** 2026-03-28  
**Modo:** ajuste preventivo controlado (env, CSP, base URL, documentação).  
**Escopo:** apenas painel admin e preparo para validação futura; sem alteração de contratos `/api/admin/*` nem cirurgia estrutural.

---

## 1. Resumo executivo

Foram aplicados ajustes **pontuais** para reduzir falhas de validação local e futura quando o backend não estiver no Fly: **CSP** passa a permitir chamadas HTTP ao backend em `localhost:8080` e `127.0.0.1:8080`; o cliente **`api.js`** normaliza a base da API (sem barra final, fallback `http://localhost:8080` se `VITE_API_URL` vazio); **`.env.example`** (raiz e admin) e **CORS** de exemplo alinham porta **8080** e origens Vite **5173**; **`vercel.json`** do admin alinha `connect-src` com os mesmos hosts locais; foi criado guia **`docs/operacional/PREPARO-PAINEL-ADMIN-LOCAL.md`**.

**Classificação final:** **PRONTO PARA VALIDAÇÃO FUTURA** (ver nota mínima em §7).

---

## 2. Variáveis de ambiente revisadas

### Admin — `goldeouro-admin/.env.example`

- Documentação expandida para **`VITE_API_URL`**: sem barra final, exemplos `localhost` / `127.0.0.1` / Fly, aviso para não terminar em `/api`.
- **`VITE_ADMIN_TOKEN`**: opcional, dev apenas, aviso explícito para não commitar.

### Backend — `.env.example` (raiz)

- **`PORT`**: exemplo alterado para **8080** com nota de que `server-fly.js` usa 8080 por omissão e de alinhar com `VITE_API_URL`.
- **`CORS_ORIGINS`**: inclui `http://localhost:5173` e `http://127.0.0.1:5173` (Vite padrão), mantendo 5174 e placeholder Vercel.

**Contrato `ADMIN_TOKEN`:** inalterado (mín. 16 caracteres, header `x-admin-token` no painel).

---

## 3. CSP revisada

### `goldeouro-admin/index.html`

- **`connect-src`:** acrescentados `http://localhost:8080` e `http://127.0.0.1:8080` antes dos hosts já existentes (`api.mercadopago.com`, `goldeouro-backend.fly.dev`).
- Demais diretivas **mantidas** (sem alargar `script-src` nem `default-src`).

### `goldeouro-admin/vercel.json`

- **`connect-src`** do header CSP: mesmos dois origins HTTP locais adicionados junto a `https://goldeouro-backend.fly.dev` e domínios goldeouro.lol já presentes.

**Nota:** API noutro host (staging próprio, novo domínio) continua a exigir **entrada manual** em CSP — evita lista aberta demasiado larga.

---

## 4. BaseURL e headers revisados

### `goldeouro-admin/src/js/api.js`

- Função interna **`getApiBase()`:** lê `VITE_API_URL`, remove barras finais, fallback **`http://localhost:8080`** se vazio.
- **`getData` / `postData` / `downloadAdminFile`:** usam `getApiBase() + endpoint`; endpoints oficiais mantêm prefixo **`/api/admin/...`** → **sem** `/api/api` desde que `VITE_API_URL` não termine em `/api`.

### `goldeouro-admin/src/config/env.js`

- **`getApiUrl()`:** mesma regra de trim e remoção de barra final (consistência com legado que importa este helper).

### `goldeouro-admin/src/services/api.js` (legado axios)

- Fallback de `baseURL` alinhado de `3000` para **8080** (coerência com `server-fly` local); **não** altera rotas oficiais do BLOCO J.

**Headers:** `x-admin-token` e `Content-Type: application/json` onde já existiam — **inalterados**.

---

## 5. Ajustes aplicados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-admin/index.html` | CSP `connect-src` + localhost/127.0.0.1:8080 |
| `goldeouro-admin/vercel.json` | Idem em `connect-src` do deploy |
| `goldeouro-admin/.env.example` | Documentação completa VITE_* |
| `.env.example` | PORT 8080, CORS com 5173/127.0.0.1:5173 |
| `goldeouro-admin/src/js/api.js` | `getApiBase()` + uso em todos os `fetch` |
| `goldeouro-admin/src/config/env.js` | `getApiUrl()` normalizado |
| `goldeouro-admin/src/services/api.js` | fallback 8080 |
| `docs/operacional/PREPARO-PAINEL-ADMIN-LOCAL.md` | **Novo** — guia de subida e login |

---

## 6. Riscos evitados

- **Fetch bloqueado por CSP** ao usar API em `localhost:8080` ou `127.0.0.1:8080` com admin no Vite.
- **URL inválida** `undefined/api/admin/...` se `VITE_API_URL` não estiver definida no build local.
- **Barra dupla** `http://host:8080//api/...` por `VITE_API_URL` com `/` final.
- **CORS** de exemplo ignorando a porta padrão do Vite (5173).
- **Desalinhamento** entre exemplo de `PORT` (3000) e omissão real do servidor (8080).

---

## 7. Estado final de preparo local

Com backend local a correr, `ADMIN_TOKEN` definido, `VITE_API_URL` alinhado à porta e CORS a incluir a origem do Vite, o painel está **preparado** para smoke manual **sem Fly**.

**Pequena ressalva:** se usar **porta diferente de 8080** ou **túnel HTTPS** com outro host, é necessário acrescentar essa origem em **CSP** (e em `CORS_ORIGINS` no backend). Isso é intencional para não alargar a política sem necessidade.

---

## 8. Checklist de subida futura

1. Copiar `.env.example` → `.env` na raiz; preencher `DATABASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`; ajustar `PORT` se não for 8080.
2. Copiar `goldeouro-admin/.env.example` → `.env.local`; definir `VITE_API_URL` igual ao URL do backend (**sem** `/` final).
3. Confirmar `CORS_ORIGINS` inclui a URL exata do `npm run dev` do admin.
4. `npm start` na raiz; `cd goldeouro-admin && npm run dev`.
5. Abrir `/login`, colar `ADMIN_TOKEN`, verificar rede: `GET .../api/admin/stats` com `x-admin-token`.
6. Se falhar só no browser: inspecionar consola por violação CSP → ajustar `index.html` / `vercel.json` conforme §7.

**Documentação detalhada:** [`docs/operacional/PREPARO-PAINEL-ADMIN-LOCAL.md`](../operacional/PREPARO-PAINEL-ADMIN-LOCAL.md).

---

## CLASSIFICAÇÃO FINAL

**PRONTO PARA VALIDAÇÃO FUTURA**

*(Com a ressalva operacional de sempre: portas ou hosts não listados na CSP exigem uma linha extra de configuração — ver §7.)*
