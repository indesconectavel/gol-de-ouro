# BLOCO H.1 — Cirurgia 01 do endpoint de analytics

**Data:** 2026-03-27  
**Escopo:** endpoint mínimo `POST /api/analytics` para o beacon do `goldeouro-player`, sem BD, sem alteração de autenticação ou lógica de jogo.

---

## 1. Resumo executivo

Foi implementada a ingestão pública mínima em **`routes/analyticsIngest.js`**, montada em **`server-fly.js`** em `/api/analytics`. O corpo JSON é validado (`event` string não vazia), o evento é registrado com **`logger.info`** (mesmo padrão de fallback do servidor) sob o prefixo **`[client_analytics_event]`**, e a resposta é **`200`** com **`{ ok: true }`**. O **rate limit** existente passa a **ignorar** explicitamente **`/api/analytics`**, evitando penalidade indevida e a contagem dupla típica de `app.use(limiter)` + `app.use('/api/', limiter)`.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| **`routes/analyticsIngest.js`** | **Novo** — router Express com `POST /` (URL final `POST /api/analytics`). |
| **`server-fly.js`** | `skip` do rate limit inclui `/api/analytics`; `app.use('/api/analytics', require('./routes/analyticsIngest'))` após parsers de body. |
| **`docs/relatorios/BLOCO-H1-ENDPOINT-ANALYTICS-CIRURGIA-01.md`** | Este relatório. |

---

## 3. Endpoint criado

| Campo | Valor |
|-------|--------|
| **Path** | `/api/analytics` |
| **Método** | `POST` |
| **Content-Type** | `application/json` (via `express.json` global) |
| **Contrato esperado** | Objeto JSON com pelo menos **`event`** (string não vazia). Campos opcionais como `ts`, `sessionId` e outros são aceites e logados no corpo. |
| **Resposta sucesso** | `200` — `{ "ok": true }` |
| **Resposta erro** | `400` — `{ "success": false, "message": "Corpo inválido" }` ou `{ "success": false, "message": "event inválido" }` |
| **Autenticação** | Nenhuma (público, alinhado ao `sendBeacon`). |

---

## 4. Validação mínima aplicada

- `req.body` deve ser objeto (não `null`, não array).
- `req.body.event` deve ser `string` com `trim()` não vazio.

---

## 5. Estratégia de registro

- Uma linha por pedido: **`logger.info('[client_analytics_event]', JSON.stringify(body))`**.
- Se o logger avançado não carregar, usa-se o mesmo fallback já definido em `server-fly.js` (console).
- Sem ficheiro dedicado, sem Supabase, sem agregação — apenas observabilidade leve para smoke test e V1.

---

## 6. Ajustes de rate limit / compatibilidade

- Na função **`skip`** do **`limiter`** (único objeto usado em `app.use(limiter)` e `app.use('/api/', limiter)`), foi adicionada a condição **`req.path === '/api/analytics'`**.
- **CORS:** inalterado; pedidos do browser continuam sujeitos à política já configurada (origens permitidas / previews). O frontend deve definir **`VITE_ANALYTICS_BEACON_URL`** com a **URL absoluta** do backend (ex.: `https://<host-da-api>/api/analytics`) cujo domínio esteja coberto por **`CORS_ORIGIN`** ou pela regra de preview `.vercel.app`, conforme o ambiente.

---

## 7. O que NÃO foi alterado

- Autenticação JWT, rotas de jogo, PIX, webhooks e demais rotas existentes.
- **`routes/analyticsRoutes.js`** (legado/admin) — não montado nem importado.
- Frontend (`goldeouro-player`), contratos de eventos e nomes de eventos.
- Migrações SQL, Supabase, filas, workers, ferramentas externas de analytics.

---

## 8. Como testar

1. **Backend:** subir o processo que usa **`server-fly.js`** (ex.: `node server-fly.js` ou comando do projeto).
2. **Player:** no build/preview, definir **`VITE_ANALYTICS_BEACON_URL=https://<seu-backend>/api/analytics`** (ajustar host e protocolo).
3. Abrir o jogo no browser e gerar ações que chamem **`track()`** (ex.: navegar para o jogo, chutar).
4. **Network:** filtrar por `analytics` ou pelo host da API; confirmar **`POST 200`** e corpo `{ ok: true }`.
5. **Log do servidor:** procurar linhas com **`[client_analytics_event]`** e o JSON do evento.
6. **Negativo:** `POST` com `{}` ou sem `event` válido → esperar **`400`**.

Teste rápido com curl (substituir URL):

```bash
curl -s -X POST "https://SEU-BACKEND/api/analytics" -H "Content-Type: application/json" -d "{\"event\":\"smoke_test\",\"ts\":1,\"sessionId\":\"x\"}"
```

---

## 9. Riscos evitados

- Rate limit agressivo sobre eventos frequentes do cliente.
- Dependência do router legado de analytics admin.
- Persistência em BD ou migrações nesta fase.
- Resposta só com `204`/`end()` que não passa pelo patch de `res.send` do monitoramento (optou-se por **`200` + `json`**).
- Refatoração ampla do servidor ou novo pacote npm.

---

## 10. Conclusão objetiva

O backend expõe **`POST /api/analytics`** compatível com o payload JSON do frontend, com validação mínima, registro leve e **sem** penalidade de rate limit nas condições atuais. Está **pronto para validação** em preview e smoke test com **`VITE_ANALYTICS_BEACON_URL`** apontando para a origem correta e CORS alinhado ao domínio do player.
