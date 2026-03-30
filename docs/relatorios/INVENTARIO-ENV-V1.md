# INVENTÁRIO DE VARIÁVEIS DE AMBIENTE — V1 GOL DE OURO

**Modo:** READ-ONLY técnico (ficheiros inspecionados: `server-fly.js`, `config/required-env.js`, `database/supabase-unified-config.js`, `routes/adminApiFly.js`, `utils/webhook-signature-validator.js`, `controllers/paymentController.js`, frontends `goldeouro-player`, `goldeouro-admin`).  
**Data:** 2026-03-29  
**Entrypoint de produção referido:** `server-fly.js` (`Dockerfile`).

**Legenda — obrigatória?**

- **Sim (arranque):** `assertRequiredEnv` em `server-fly.js` falha se ausente (com a regra de `NODE_ENV` descrita).  
- **Sim (produção MP):** exigida só quando `NODE_ENV=production` pelo mesmo assert.  
- **Sim (funcional):** necessária para um subsistema operar corretamente, embora o processo possa subir.  
- **Não:** opcional; o código tem ramo alternativo ou uso limitado.

---

## Variáveis pedidas (matriz principal)

| Nome | Onde é usada | Obrigatória? | Impacto se ausente | Valor esperado |
|------|----------------|--------------|-------------------|----------------|
| **MERCADOPAGO_ACCESS_TOKEN** | `server-fly.js`: `testMercadoPago`, `POST /api/payments/pix/criar` (Bearer), webhook e reconcile (`GET /v1/payments/{id}`). `controllers/paymentController.js` (caminho não montado no `server-fly.js`). Vários scripts/serviços. | **Sim** em `NODE_ENV=production` (`onlyInProduction` em `assertRequiredEnv`). Fora disso, não bloqueia o arranque. | Produção: processo **não inicia** se vazia. Em dev: `mercadoPagoConnected` falso → **503** em criar PIX; webhook/reconcile não consultam MP com sucesso. | Token de acesso da aplicação MP (produção ou teste, conforme ambiente). Nunca commitar. |
| **MERCADOPAGO_WEBHOOK_SECRET** | `server-fly.js` (bloco do webhook só corre se definida). `utils/webhook-signature-validator.js` (`validateMercadoPagoWebhook`). `config/production.js` (espelho). | **Não** no assert. | **Validação HMAC desligada** — qualquer POST pode seguir para o handler (o crédito ainda exige consulta MP + linha em `pagamentos_pix`). Em produção com secret definido, assinatura inválida → **401**. | Segredo de assinatura de webhooks configurado no painel Mercado Pago (integração). |
| **BACKEND_URL** | `server-fly.js`: `notification_url` na criação PIX. `controllers/paymentController.js` (legado). Scripts diversos. `config/production.js` tem fallback diferente do `server-fly.js`. | **Não** no assert. | Em `server-fly.js` usa-se fallback literal `https://goldeouro-backend-v2.fly.dev` se vazio — **webhooks podem apontar para o host errado** noutro deploy. No `paymentController`, URL pode conter `undefined`. | URL HTTPS **pública** do backend **sem** path `/api/...` (só origem); o código acrescenta `/api/payments/webhook`. |
| **ADMIN_TOKEN** | `routes/adminApiFly.js`: `authAdminToken` — comparação com header `x-admin-token`. Scripts de validação (alguns com fallbacks locais). `router.js` / `router-database.js` (outros entrypoints). | **Sim** para `/api/admin/*` útil: sem token ou comprimento inferior a 16 caracteres → **503** com mensagem explícita; token errado → **401**. Não está no `assertRequiredEnv` do `server-fly.js`. | Painel/admin API **inutilizável** (503/401). | String secreta, **mínimo 16 caracteres**, alta entropia; igual à configurada no cliente admin (`VITE_ADMIN_TOKEN` no admin). |
| **JWT_SECRET** | `server-fly.js`: `authenticateToken`, emissão de JWT em login/registo/recuperação, `admin/bootstrap`, debug token; `startServer` faz `process.exit(1)` se ausente. `src/websocket.js`, `middlewares/auth.js`, `services/auth-service-unified.js`, etc. | **Sim** (`assertRequiredEnv` + verificação explícita no boot). | Servidor **não sobe** ou auth **quebrada**. | Segredo forte (tamanho adequado para HS256); único por ambiente. |
| **SUPABASE_URL** | `database/supabase-unified-config.js` (clientes Supabase). `assertRequiredEnv`. Conexão em `server-fly.js` via `connectSupabase`. Dezenas de serviços/scripts. | **Sim**. | Arranque falha (assert) ou validação Supabase falha → `dbConnected` falso → **503** em rotas que dependem de BD. | URL do projeto Supabase (`https://xxx.supabase.co`). |
| **SUPABASE_SERVICE_ROLE_KEY** | Idem; cliente `supabaseAdmin` no backend. | **Sim**. | Idem. | **Service role** do Supabase (privilegiada); apenas servidor/CI; nunca no browser. |
| **FINANCE_ATOMIC_RPC** | `server-fly.js`: crédito PIX (`creditarPixAprovadoUnicoMpPaymentId`) e ramo de saque (`preferAtomic`); lógica `!== 'false'` → RPC **preferida** por defeito. | **Não**. | Se a RPC **não existir** no BD, o código cai em **fallback JS** (logs `⚠️` / `❌` conforme erro). Crédito/saque podem funcionar sem transação única SQL. | `true`/omitido: tentar RPC. `false`: saltar preferência RPC e usar fluxo JS (útil em diagnóstico). |
| **VITE_API_URL** | **Admin:** `goldeouro-admin/src/js/api.js`, `src/services/api.js`, `src/config/env.js` — base URL do backend para chamadas `/api/admin/...`. **Player:** `goldeouro-player/src/utils/healthCheck.js` (default `http://localhost:3000` se ausente). | **Não** no backend; no **build** do admin/player conforme deploy. | Admin: fallback para `http://localhost:8080` em `services/api.js` ou erro em `js/api.js` se vazio em fluxos que exigem URL. Health check do player aponta para URL errada. | Origem do API **sem** barra final, ex.: `https://goldeouro-backend-v2.fly.dev`. Definir no `.env` do Vite **antes** do `npm run build`. |

---

## Nota sobre `VITE_API_URL` vs player

O **goldeouro-player** usa sobretudo **`VITE_BACKEND_URL`** em `src/config/api.js` (`API_BASE_URL`), com fallback para `https://goldeouro-backend-v2.fly.dev`.  
`VITE_API_URL` aparece no player apenas em `utils/healthCheck.js`. Para inventário completo do player, tratar **`VITE_BACKEND_URL`** como variável principal de API no build do jogador.

---

## Variável relacionada: `SUPABASE_ANON_KEY`

| Nome | Onde | Obrigatória? | Impacto |
|------|------|--------------|---------|
| **SUPABASE_ANON_KEY** | `database/supabase-unified-config.js`: cliente `supabase` “público” e **`validateSupabaseCredentials`** / `testSupabaseConnection` no arranque do `server-fly.js`. | **Sim** para passar na validação de credenciais Supabase do boot (não está na lista do `assertRequiredEnv`, mas a validação unificada exige as três chaves). | Se ausente ou placeholder, `connectSupabase` falha → `dbConnected` falso. |

---

## Outras variáveis usadas pelo mesmo fluxo V1 (resumo)

| Nome | Uso típico no `server-fly.js` / adjacente |
|------|-------------------------------------------|
| **NODE_ENV** | `production` → webhook rejeita assinatura inválida; afeta `assertRequiredEnv` para `MERCADOPAGO_ACCESS_TOKEN`. |
| **PORT** | Porta HTTP (default **8080**). |
| **MP_RECONCILE_ENABLED** | `!== 'false'` ativa `setInterval` de reconcile. |
| **MP_RECONCILE_INTERVAL_MS** | Intervalo do reconcile (mín. efetivo 30 s no código). |
| **MP_RECONCILE_MIN_AGE_MIN** | Idade mínima de `pending` para entrar no reconcile. |
| **MP_RECONCILE_LIMIT** | Máximo de linhas por ciclo. |
| **MP_WEBHOOK_TS_SKEW_SEC** | Janela do timestamp na assinatura MP (`webhook-signature-validator.js`). |
| **PLAYER_URL** | `paymentController` (back_urls); não é lido no trecho PIX principal do `server-fly.js`. |

---

## Mapa `assertRequiredEnv` (`server-fly.js`)

```text
Sempre: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Se NODE_ENV=production: também MERCADOPAGO_ACCESS_TOKEN
```

Chaves **não** validadas no arranque mas críticas operacionalmente: `MERCADOPAGO_WEBHOOK_SECRET`, `BACKEND_URL`, `ADMIN_TOKEN`, `SUPABASE_ANON_KEY` (via módulo unificado), `FINANCE_ATOMIC_RPC`.

---

*Fim do inventário.*
