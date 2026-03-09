# Pacote de contexto final — Pré-patch CORS (ambientes + rollback)

**Data:** 2026-02-25  
**Modo:** 100% READ-ONLY (nenhuma alteração aplicada; apenas criação deste relatório)  
**Objetivo:** Estado real de ambientes e plano de rollback para garantir segurança antes do patch de CORS no backend.

---

## 1. Resumo executivo

O backend em produção roda no **Fly.io** com entrypoint **`server-fly.js`**, onde o CORS está configurado (lista de origens via `CORS_ORIGIN` ou default). O **player** em produção usa **goldeouro.lol** / **www.goldeouro.lol** e chama o backend em **https://goldeouro-backend-v2.fly.dev** (fallback de `VITE_BACKEND_URL`). Os **previews** do player na Vercel usam URLs **goldeouro-player-*.vercel.app** e hoje falham por CORS. O **admin** em produção usa **admin.goldeouro.lol** e resolve a API via **proxy `/api`** (getApiUrl() retorna `/api` em PROD). O patch de CORS afetará **apenas** a lógica de `origin` em `server-fly.js`; produção (incluindo deploy FyKKeg6zb), admin e variáveis de ambiente permanecem inalterados. O rollback seguro é **git revert** do commit do patch + redeploy no Fly.io; a validação é feita com **curl OPTIONS** para preview (deve voltar a bloquear) e para produção (deve continuar permitido).

---

## 2. Mapa de ambientes (Player / Admin / Backend)

### 2.1 Player

| Item | Evidência (arquivo + trecho) |
|------|------------------------------|
| **API base (definição)** | `goldeouro-player/src/config/api.js` linha 9: `const API_BASE_URL = import.meta.env.VITE_BACKEND_URL \|\| 'https://goldeouro-backend-v2.fly.dev';` |
| **Fallback quando VITE_BACKEND_URL ausente** | `https://goldeouro-backend-v2.fly.dev` (mesmo arquivo). |
| **Uso no cliente** | `goldeouro-player/src/services/apiClient.js`: `baseURL: env.API_BASE_URL` (env vem de `validateEnvironment()` que usa api.js / environments.js). |
| **Produção (domínios)** | Docs e config: **https://goldeouro.lol**, **https://www.goldeouro.lol**. README-DEPLOY.md: "Player Mode: https://goldeouro.lol". |
| **Preview (domínios)** | Vercel gera URLs do tipo **https://goldeouro-player-&lt;id&gt;-&lt;scope&gt;.vercel.app** ou **goldeouro-player-git-&lt;branch&gt;-&lt;scope&gt;.vercel.app**. No preview, em geral **VITE_BACKEND_URL** não é redefinido, então as chamadas vão para **goldeouro-backend-v2.fly.dev** (cross-origin). |
| **Staging (referência)** | `goldeouro-player/src/config/environments.js`: staging usa `https://goldeouro-backend.fly.dev`. |

### 2.2 Admin

| Item | Evidência (arquivo + trecho) |
|------|------------------------------|
| **Resolução da API em produção** | `goldeouro-admin/src/config/env.js` linhas 51–57: `getApiUrl()` retorna **`/api`** quando `import.meta.env.PROD` é true (proxy Vercel; mesma origem). |
| **Em desenvolvimento** | `import.meta.env.VITE_API_URL \|\| 'http://localhost:8080'`. |
| **Uso** | `goldeouro-admin/src/services/dataService.js`: `const API_BASE_URL = getApiUrl();` e `fetch(\`${API_BASE_URL}${endpoint}\`, ...)`. |
| **Domínio produção** | **https://admin.goldeouro.lol** (README-DEPLOY.md e whitelist CORS do backend). |

### 2.3 Backend

| Item | Evidência (arquivo + trecho) |
|------|------------------------------|
| **Entrypoint em produção (Fly.io)** | `Dockerfile` (raiz do backend) linha 16: `CMD ["node", "server-fly.js"]`. |
| **App Fly** | `fly.toml` linha 2: `app = "goldeouro-backend-v2"`. |
| **Onde o CORS está ativo** | `server-fly.js` linhas 235–251: função `parseCorsOrigins()` e `app.use(cors({ origin: parseCorsOrigins(), credentials: true, methods: [...], allowedHeaders: [...] }))`. Não há outro middleware CORS usado por este entrypoint (security-performance.js não é requerido pelo server-fly.js). |
| **URL pública** | **https://goldeouro-backend-v2.fly.dev** (health, api/auth/login, etc.). |

---

## 3. Variáveis de ambiente e fontes (arquivos e trechos)

### 3.1 CORS_ORIGIN

| Onde | Evidência |
|------|-----------|
| **Leitura no backend** | `server-fly.js` linhas 236–237: `const csv = process.env.CORS_ORIGIN \|\| '';` dentro de `parseCorsOrigins()`. |
| **Comportamento** | CSV por vírgula, trim, filter(Boolean). Se lista vazia, default: `['https://goldeouro.lol', 'https://www.goldeouro.lol', 'https://admin.goldeouro.lol']`. |
| **Documentação** | **README-DEPLOY.md** não menciona `CORS_ORIGIN`. Documentado em: `docs/relatorios/RELATORIO-PROBLEMA-CORS-LOGIN-2026-02-02.md` (recomendação `CORS_ORIGIN=https://www.goldeouro.lol,https://goldeouro.lol,https://admin.goldeouro.lol`); `docs/configuracoes/` e scripts `implementar-credenciais-reais*.js` (exemplos com CORS_ORIGIN). |
| **Outros arquivos** | `config/production.js` usa **CORS_ORIGINS** (array de FRONTEND_URL, ADMIN_URL, localhost) — não é usado por server-fly.js, que lê **CORS_ORIGIN** (string CSV). `render.yaml` lista `CORS_ORIGIN` e `NODE_ENV`. `monitoring/flyio-config-backup.js` referencia `process.env.CORS_ORIGIN`. |
| **Como deve estar configurado (recomendação dos relatórios)** | No Fly.io: `CORS_ORIGIN=https://goldeouro.lol,https://www.goldeouro.lol,https://admin.goldeouro.lol` (ou igual). O patch futuro pode passar a aceitar também previews via regex no código, sem depender de listar cada URL de preview na env. |

### 3.2 NODE_ENV

| Onde | Evidência |
|------|-----------|
| **Fly.io** | `fly.toml` [env]: `NODE_ENV = "production"`. |
| **Dockerfile** | `ENV NODE_ENV=production`. |
| **README-DEPLOY** | `flyctl secrets set NODE_ENV="production" --app goldeouro-backend`. |
| **Uso no server-fly.js** | Ex.: webhook (linha ~1990) e log de startup (linha ~3139). |

### 3.3 URLs do backend usadas pelo player / admin

| Contexto | Variável / fonte | Valor típico |
|----------|------------------|--------------|
| **Player (build)** | `VITE_BACKEND_URL` (opcional) | Se ausente: `https://goldeouro-backend-v2.fly.dev` (api.js). |
| **Player (environments.js)** | production.API_BASE_URL | `https://goldeouro-backend-v2.fly.dev`. |
| **Admin (prod)** | getApiUrl() | `/api` (proxy). |
| **Admin (dev)** | VITE_API_URL | `http://localhost:8080` (env.js). |
| **Backend (webhook)** | BACKEND_URL | server-fly.js: `process.env.BACKEND_URL \|\| 'https://goldeouro-backend-v2.fly.dev'` (notification_url). |

---

## 4. Checklist de segurança (pré e pós patch)

### 4.1 Pré-patch (antes de aplicar o patch de CORS)

- [ ] Confirmar que produção do player (goldeouro.lol / www) e admin (admin.goldeouro.lol) estão funcionando (login e chamadas à API).
- [ ] Anotar o commit atual do branch que será alterado (ou o SHA do deploy atual no Fly) para referência de rollback.
- [ ] Confirmar que o único arquivo a ser alterado é `server-fly.js` (bloco CORS `origin`).
- [ ] Garantir que não há alteração em `CORS_ORIGIN` nas secrets do Fly no mesmo momento (evitar efeito duplo).

### 4.2 Pós-patch (após deploy do backend com patch)

- [ ] **Produção:** curl OPTIONS com `Origin: https://www.goldeouro.lol` em `https://goldeouro-backend-v2.fly.dev/api/auth/login` → deve retornar `Access-Control-Allow-Origin: https://www.goldeouro.lol`.
- [ ] **Preview:** curl OPTIONS com `Origin: https://goldeouro-player-&lt;exemplo&gt;.vercel.app` → deve retornar `Access-Control-Allow-Origin` com essa origem (não bloquear).
- [ ] **Login no browser:** Testar login no preview Vercel (sem erro de CORS) e login em produção (sem regressão).
- [ ] **Admin:** Testar fluxo do admin em produção (proxy /api) sem regressão.

---

## 5. Plano de rollback (passo a passo)

### 5.1 Quando fazer rollback

- Se o patch causar regressão em produção (ex.: origens de produção deixam de receber `Access-Control-Allow-Origin`).
- Se surgir problema de segurança (ex.: origens não desejadas passando na regex).
- Por decisão operacional (reverter e reavaliar o desenho do patch).

### 5.2 Rollback seguro (git revert + deploy)

1. **Identificar o commit do patch**
   - Ex.: `git log -1 --oneline` no branch onde o patch foi aplicado, ou o SHA do commit que alterou `server-fly.js` (CORS).

2. **Reverter o commit**
   - `git revert <SHA_DO_COMMIT_DO_PATCH> --no-edit`
   - Resolver conflitos, se houver, e concluir o revert.

3. **Validar localmente (opcional)**
   - Rodar o backend localmente a partir do estado pós-revert e conferir que `parseCorsOrigins()` volta a ser a lista fixa (sem regex de preview).

4. **Deploy no Fly.io**
   - Fazer deploy do branch com o revert (ex.: `flyctl deploy` ou pipeline que faz deploy a partir desse branch/release).
   - Garantir que o app em produção passa a rodar o código revertido.

5. **Validação pós-rollback**
   - **Preview deve voltar a ser bloqueado (comportamento anterior):**
     - `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-xxx.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v`
     - Esperado: resposta **sem** header `Access-Control-Allow-Origin` (ou CORS negado), e no browser o preflight volta a falhar.
   - **Produção deve continuar permitida:**
     - `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v`
     - Esperado: status 204/200 e `Access-Control-Allow-Origin: https://www.goldeouro.lol`.

### 5.3 Alternativa: rollback apenas no Fly (releases)

- Se o Fly.io tiver histórico de releases: `flyctl releases rollback --app goldeouro-backend-v2` (ou equivalente) para voltar à release anterior ao deploy do patch. Validar com os mesmos curls acima.

---

## 6. Riscos e o que NÃO será afetado

### 6.1 O que NÃO será afetado pelo patch (com justificativa)

| Item | Justificativa |
|------|----------------|
| **Produção do player (Vercel, ex.: deploy FyKKeg6zb)** | O patch **não altera** a lista de origens já permitidas (goldeouro.lol, www.goldeouro.lol). A lógica atual de match exato para essas origens é mantida; no máximo acrescenta-se uma condição extra (regex para preview). O build e o domínio servido pela Vercel (goldeouro.lol / www) continuam iguais; apenas o backend passa a aceitar também previews. |
| **Admin (admin.goldeouro.lol)** | Admin em produção usa `getApiUrl()` = `/api` (proxy). A origem que o backend vê é a do domínio do admin, já incluída na whitelist atual. O patch não remove nem altera essa origem. |
| **Variáveis de ambiente (CORS_ORIGIN, NODE_ENV)** | O patch é apenas em código (`origin` no cors). Não é necessário mudar secrets no Fly; se CORS_ORIGIN estiver definido, continua sendo respeitado para match exato; a regex só acrescenta permissão para previews. |
| **Outros serviços (Supabase, Mercado Pago, webhooks)** | Nenhuma alteração em URLs de webhook, BACKEND_URL ou integrações; apenas o middleware CORS do Express. |
| **Frontends (código do player/admin)** | Nenhuma alteração em VITE_BACKEND_URL, getApiUrl() ou apiClient; continuam apontando para o mesmo backend. |

### 6.2 Riscos mitigados pelo desenho do patch

- **Regressão em produção:** Evitada mantendo a lista atual (e/ou CORS_ORIGIN) com o mesmo comportamento de match exato para as origens já permitidas.
- **Abrir CORS demais:** Regex restrita apenas a `goldeouro-player-*.vercel.app` (não `*.vercel.app` genérico).
- **Rollback difícil:** Um único commit, um único arquivo (server-fly.js); rollback via `git revert` + deploy é direto e validável com curl OPTIONS.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo do projeto foi alterado exceto a criação deste documento.*
