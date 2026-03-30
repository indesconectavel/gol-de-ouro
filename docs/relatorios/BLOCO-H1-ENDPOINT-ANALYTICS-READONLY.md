# BLOCO H.1 — Auditoria READ-ONLY do endpoint de analytics

**Data:** 2026-03-27  
**Modo:** auditoria estática do repositório — **nenhuma** implementação realizada nesta etapa.  
**Foco:** onde e como encaixar `POST /api/analytics` mínimo no backend real, alinhado ao `sendBeacon` do `goldeouro-player/src/utils/analytics.js`.

---

## 1. Resumo executivo

O servidor **principal de produção** relevante é **`server-fly.js`**: aplicação Express **monolítica**, com middleware global (Helmet, CORS, rate limit, `express.json` 10MB) e rotas HTTP declaradas **inline** com `app.get` / `app.post`. **Não existe** hoje `POST /api/analytics` nem montagem de `routes/analyticsRoutes.js` neste ficheiro.

O caminho de **menor risco** para a V1 é: acrescentar **uma** rota pública `POST /api/analytics` em `server-fly.js` (ou extrair para um módulo pequeno `routes/clientAnalyticsBeacon.js` importado uma vez), **depois** de `express.json`, **sem** `authenticateToken`, espelhando o padrão já usado em **`POST /api/payments/webhook`** (POST público, resposta rápida, corpo JSON). Persistência inicial pode ser **append** a ficheiro de log ou `logger.info` estruturado — **sem** obrigar tabela nova na primeira cirurgia.

A variável do frontend **`VITE_ANALYTICS_BEACON_URL`** deverá apontar para a **origem do API** + caminho exato (ex.: `https://<host-da-api>/api/analytics`), garantindo que o domínio do front está na **allowlist CORS** (ou é preview `.vercel.app`).

---

## 2. Estado atual do backend

| Aspeto | Evidência |
|--------|-----------|
| **Entrada** | `server-fly.js` cria `app`, `httpServer`, carrega Supabase, Mercado Pago, etc. |
| **Rotas** | Definidas no mesmo ficheiro; não há `app.use('/api', router)` centralizado para analytics. |
| **`routes/index.js`** | `module.exports = {}` — não agrega rotas. |
| **`routes/analyticsRoutes.js`** | Existe no repositório (métricas admin, `requireAdmin`, `analyticsCollector` em `src/utils/analytics` **Node**), mas **não** está `require`/`app.use` em `server-fly.js` (grep sem matches). Trata-se de **legado / não montado** no servidor analisado. |
| **JSON body** | `app.use(express.json({ limit: '10mb', verify: ... rawBody }))` global. |
| **CORS** | `cors(corsOptions)` com `origin` dinâmico: `CORS_ORIGIN` CSV, lista explícita + `*.vercel.app` HTTPS; `credentials: true`; métodos incluem `POST`. |
| **Rate limit** | O **mesmo** `limiter` está aplicado **duas vezes**: `app.use(limiter)` (linha ~298) e `app.use('/api/', limiter)` (linha ~299). O `skip` ignora `/health`, `/meta`, `/auth/`, `/api/auth/`. Um futuro `/api/analytics` **não** está no skip e pode ser contado **duas vezes** por pedido (comportamento a validar em implementação). |
| **Middleware de monitoramento** | ~linhas 2261–2288: intercepta só `res.send`; `res.status(204).end()` **não** passa por esse patch (métricas/console podem não refletir o mesmo que rotas que usam `res.send`). |

---

## 3. Ponto ideal para implementação

| Opção | Recomendação |
|-------|----------------|
| **Ficheiro principal** | **`server-fly.js`** — é o que concentra as rotas reais do deploy descrito. |
| **Posição no ficheiro** | **Depois** de `express.json` / `urlencoded` (p. ex. após linha ~314) e **antes** ou junto de outros POST públicos; **referência de estilo:** próximo de **`POST /api/payments/webhook`** (~1812) — mesmo padrão “aceitar corpo, responder rápido, processamento assíncrono opcional”. |
| **Rota** | `app.post('/api/analytics', handler)` — path **livre** (grep não encontra `/api/analytics` em `server-fly.js`). |
| **Módulo auxiliar (opcional)** | Ficheiro novo `routes/clientAnalyticsBeacon.js` (ou `routes/analyticsBeacon.js`) exportando só `router.post('/', handler)` e `app.use('/api/analytics', router)` — reduz ruído no `server-fly.js` sem alterar arquitetura global. **Não** reutilizar `routes/analyticsRoutes.js` sem revisão: nome e dependências colidem semanticamente com analytics **admin**. |

**Porquê não** usar o `routes/analyticsRoutes.js` atual tal como está: depende de `../src/utils/analytics` (collector Node), rotas **GET** e **admin** — não é o contrato do beacon do cliente.

---

## 4. Compatibilidade com a arquitetura atual

| Tema | Análise |
|------|---------|
| **CORS** | `sendBeacon` com `Blob` `application/json` a partir do browser geralmente **origem** = domínio do player. Se estiver na allowlist ou `.vercel.app`, **OK**. Requisições sem `Origin` (algumas ferramentas) já são aceites pelo callback CORS. |
| **Autenticação** | Beacon **não** envia JWT por padrão; o endpoint deve ser **público** (como webhook) ou aceitar token opcional — para V1, **público + limitação opcional** (ex.: query secret, header estático) se abuso for problema. |
| **CSRF** | Endpoints públicos POST sem cookie de sessão não são o caso típico de CSRF; beacon é cross-site no sentido CORS, não form tradicional. |
| **Limite de body** | 10 MB é excessivo para um evento JSON; payload do cliente é pequeno — risco baixo. |
| **Helmet** | Não impede POST JSON por si; CSP aplica-se a respostas HTML — típico OK para API JSON. |
| **Conflito de path** | `/api/analytics` **não** existe — sem colisão. |
| **Conflito com `routes/analyticsRoutes`** | Apenas nominal; não existe montagem — ao implementar, escolher nome de ficheiro/rota claro (`clientBeacon`, `ingest`). |

---

## 5. Solução mínima recomendada para V1

1. **Handler HTTP:** `POST /api/analytics`  
   - Lê `req.body` (objeto com `event`, `ts`, `sessionId`, …).  
   - Validação mínima: `typeof req.body?.event === 'string'`; caso contrário `400` curto.  
   - **Resposta:** `204 No Content` ou `200` com `{ "ok": true }` — **imediata**, sem `await` a DB na primeira versão.  
2. **Persistência:**  
   - **Opção A:** `appendFile` assíncrono para `logs/client-analytics-events.ndjson` (uma linha JSON por evento).  
   - **Opção B:** `logger.info` / `console.log` JSON estruturado (já existe fallback de logger no topo de `server-fly.js`).  
   - **Sem** tabela Supabase na primeira cirurgia, salvo decisão explícita de produto.  
3. **Rate limit:** considerar `skip` para `/api/analytics` (ou limite dedicado) — eventos podem ser frequentes; atenção ao **duplo** `limiter` em rotas `/api/*`.  
4. **Segurança mínima:** opcionalmente `process.env.ANALYTICS_INGEST_SECRET` comparado a header `X-Analytics-Secret` — **não** obrigatório para smoke test interno.

---

## 6. Riscos a evitar

- **Montar** `routes/analyticsRoutes.js` antigo sem auditar — dependências e semântica de **admin** não coincidem com o beacon.  
- **Exigir** `authenticateToken` no beacon — o cliente `sendBeacon` **não** envia JWT; quebraria o fluxo.  
- **Ignorar** rate limit: muitos eventos podem esgotar o limite (100/15 min por IP), com possível **dupla contagem** pelo `limiter` global + `/api/`.  
- **Processamento pesado** síncrono no handler (DB, I/O bloqueante) — contraria “resposta rápida”.  
- **Alterar** `goldeouro-player` nesta auditoria — apenas documentar que `VITE_ANALYTICS_BEACON_URL` = URL absoluta do backend + `/api/analytics`.

---

## 7. Arquivos que provavelmente precisarão ser alterados (futuro)

| Ficheiro | Motivo |
|----------|--------|
| **`server-fly.js`** | Registro da rota `POST /api/analytics` e/ou `require` de um router mínimo; opcionalmente `skip` no rate limiter. |
| **Novo (opcional):** `routes/clientAnalyticsBeacon.js` ou `routes/analyticsIngest.js` | Isolar handler + teste unitário futuro. |
| **`.env.example` / documentação deploy** | `VITE_ANALYTICS_BEACON_URL` (player), `CORS_ORIGIN` (se novo domínio), opcional `ANALYTICS_INGEST_SECRET`. |

**Não** obrigatório na V1: migrações SQL, novos pacotes npm.

---

## 8. Plano cirúrgico sugerido (não executado)

1. Confirmar qual binário de deploy usa (tipicamente **`server-fly.js`**).  
2. Adicionar rota `POST /api/analytics` após parsers JSON.  
3. Implementar handler: validar corpo mínimo → escrever linha NDJSON ou log → `res.status(204).end()`.  
4. Ajustar **skip** do rate limit para `/api/analytics` ou monitorar 429 em QA.  
5. Configurar **CORS** se o front estiver em domínio novo (variável `CORS_ORIGIN`).  
6. Definir **`VITE_ANALYTICS_BEACON_URL`** no build do player para `https://<backend>/api/analytics`.  
7. Smoke test: Network tab + ficheiro log / stdout.  

---

## 9. Conclusão objetiva

O backend **está estruturalmente pronto** para receber uma **microimplementação**: Express já trata JSON e CORS; existe **precedente** de POST público (`/api/payments/webhook`); o path **`/api/analytics` está livre** em `server-fly.js`. O principal risco operacional a tratar na cirurgia é o **rate limit** (incluindo possível **dupla aplicação** em `/api/*`) e **não** confundir com o ficheiro **`routes/analyticsRoutes.js`** legado não montado. Na resposta HTTP, se se quiser métricas de monitoramento consistentes, usar padrão que passe pelo `res.send` patcheado ou aceitar que `204` via `end()` não dispara o mesmo caminho.

**Pronto para a próxima fase:** sim — desde que a implementação seja **mínima**, **pública** (ou com secret opcional) e **rápida**, alinhada ao payload já enviado pelo frontend.
