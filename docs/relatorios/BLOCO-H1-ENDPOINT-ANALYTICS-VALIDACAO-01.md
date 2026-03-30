# BLOCO H.1 — Validação 01 do endpoint de analytics

**Data:** 2026-03-27  
**Modo:** validação estática de código — **nenhuma** alteração de implementação.  
**Fontes revistas:** `server-fly.js` (trechos de CORS, rate limit, parsers, montagem), `routes/analyticsIngest.js`, `goldeouro-player/src/utils/analytics.js` (cópia no monorepo/backend).

---

## 1. Resumo executivo

A implementação **confere** com o desenho da cirurgia V1: **`POST /api/analytics`** está registado após **`express.json`** / **`urlencoded`**, valida **`event`** como string não vazia, responde **`200`** com **`{ ok: true }`**, erros com **`400`** JSON curto, registo apenas **após** validação bem-sucedida, **sem** base de dados e **sem** novas dependências npm. O **`skip`** do `limiter` inclui **`/api/analytics`**, pelo que o tráfego deste path **não** incrementa o contador do rate limit configurado. O payload montado pelo **`track()`** do player inclui **`event`**, **`ts`**, **`sessionId`** e é **compatível** com o validador.

**Resultado global:** implementação **adequada** para smoke test e V1, com **ressalvas operacionais** esperadas (CORS por ambiente, endpoint público, ausência de rate limit neste path).

---

## 2. Endpoint validado

| Verificação | Estado |
|-------------|--------|
| **Path / método** | `app.use('/api/analytics', require('./routes/analyticsIngest'))` + `router.post('/')` ⇒ **`POST /api/analytics`** |
| **Body JSON** | Parsers globais (`express.json` 10MB) aplicam-se **antes** da montagem da rota (ordem correta). |
| **Validação** | Rejeita se `body` não for objeto literal (inclui `null`, array); exige **`typeof body.event === 'string'`** e **`trim() !== ''`**. |
| **Sucesso** | **`res.status(200).json({ ok: true })`** |
| **Erro** | **`400`** com **`{ success: false, message: 'Corpo inválido' }`** ou **`'event inválido'`** |
| **Logging** | **`logger.info('[client_analytics_event]', JSON.stringify(body))`** apenas no ramo após validação (linhas 29–33); falha de log não impede **`200`**. |
| **BD / deps** | Nenhuma chamada Supabase ou ORM; apenas **`express`** já existente e logger interno com fallback. |

---

## 3. Compatibilidade com o frontend

| Verificação | Estado |
|-------------|--------|
| **Contrato** | Em `goldeouro-player/src/utils/analytics.js`, `track()` monta **`{ event: eventName, ...payload, ts, sessionId }`** — **`event`** é sempre string derivada do primeiro argumento; alinha com a validação do backend. |
| **sendBeacon** | Uso de **`Blob`** com **`type: 'application/json'`** + **`JSON.stringify`** é compatível com **`express.json()`** quando o browser envia **`Content-Type: application/json`**. |
| **Auth** | Rota **sem** `authenticateToken` — compatível com beacon **sem** cabeçalho `Authorization`. |
| **`VITE_ANALYTICS_BEACON_URL`** | Deve ser URL absoluta terminando em **`/api/analytics`** (ex.: `https://<api>/api/analytics`); coerente com a montagem no servidor. |

**Nota:** Se no futuro algum chamador passar `eventName` vazio (`''`), o backend responderá **`400`** — comportamento defensivo aceitável.

---

## 4. Compatibilidade com o backend atual

| Verificação | Estado |
|-------------|--------|
| **Ponto de inserção** | Rota registada **depois** dos parsers de body e **antes** dos blocos seguintes de rotas — ordem adequada. |
| **`routes/analyticsRoutes.js`** | **Não** referenciado em `server-fly.js` (grep sem ocorrências) — legado **não** reutilizado. |
| **Rotas / auth / jogo** | Alterações localizadas: novo ficheiro + `skip` + uma linha `app.use`; **não** há reescrita de rotas antigas. |
| **Middlewares** | **`helmet`**, **`cors`**, **`compression`**, **`trust proxy`** aplicam-se na ordem habitual; a rota nova não exige middleware adicional. |

---

## 5. Rate limit e segurança operacional

| Verificação | Estado |
|-------------|--------|
| **`skip` para `/api/analytics`** | Condição **`req.path === '/api/analytics'`** no **mesmo** objeto **`limiter`** usado em **`app.use(limiter)`** e **`app.use('/api/', limiter)`** — o pedido a este path **não** é contado nas duas camadas que partilham esse limiter. |
| **Efeito colateral** | Demais rotas **mantêm** o comportamento anterior; **`authLimiter`** continua só em **`/api/auth/`** e **`/auth/`** — **não** afeta `/api/analytics`. |
| **Segurança** | Endpoint **público** por desenho V1; **`skip`** elimina também a **proteção** por rate limit neste path — volume de pedidos pode aumentar carga de CPU/IO em logs (aceite como trade-off da cirurgia). |

---

## 6. Problemas encontrados

**Nenhum defeito de implementação** foi identificado face aos requisitos da V1 (rota, validação, resposta, logging, ausência de BD, montagem e rate limit).

**Observação de contrato (não bloqueante):** respostas de sucesso usam **`{ ok: true }`** e erros usam **`{ success: false, message }`** — pequena **inconsistência de chaves** entre ramos; não impede o smoke test.

---

## 7. Riscos remanescentes

| Risco | Descrição |
|-------|-----------|
| **CORS** | O browser envia **`Origin`** em pedidos cross-origin; a origem do player tem de estar em **`CORS_ORIGIN`**, na lista explícita, ou em **preview `.vercel.app`** — caso contrário o cliente pode falhar **antes** de chegar ao handler. |
| **sendBeacon** | Falhas de rede/CORS são **silenciosas** no JS — validação real depende de **Network tab** e logs do servidor. |
| **Endpoint público** | Sem autenticação nem rate limit neste path, **qualquer cliente** pode enviar POST JSON válido — risco de ruído ou abuso de volume de logs (mitigação futura fora do escopo desta validação). |
| **Monitoramento** | Middleware que intercepta **`res.send`** (documentado na auditoria READ-ONLY) — **`res.json`** em Express usa **`res.send`**; resposta **`200`** com JSON deve integrar-se no padrão existente. |
| **Trailing slash** | Se a URL configurada fosse **`/api/analytics/`**, **`req.path`** poderia não coincidir com o **`skip`** (`/api/analytics` sem slash) — usar URL **sem** barra final na variável de ambiente. |

---

## 8. Classificação

**APROVADO COM RESSALVAS**

**Ressalvas:** dependência de configuração CORS por ambiente; endpoint sem rate limit e sem auth (esperado na V1); pequena inconsistência **`ok`** vs **`success`** nas respostas; validação de extremo a extremo ainda depende de smoke test.

---

## 9. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| A rota está correta? | **Sim** — **`POST /api/analytics`**. |
| O contrato está certo? | **Sim** para o **`track()`** atual; **`event`** obrigatório como string não vazia. |
| O frontend consegue usar? | **Sim**, desde que **`VITE_ANALYTICS_BEACON_URL`** aponte para o backend com origem **permitida** no CORS. |
| O limiter não vai atrapalhar? | **Não** — este path está no **`skip`** e **não** consome quota do limiter analisado. |
| Pronto para smoke test e V1? | **Sim**, com as **ressalvas** da secção 7 e teste real de rede/CORS. |

O endpoint está **pronto para uso na V1** no sentido de implementação mínima e compatibilidade com o instrumento do player; a **confirmação final** fica condicionada a um **smoke test** no ambiente-alvo (preview/produção).
