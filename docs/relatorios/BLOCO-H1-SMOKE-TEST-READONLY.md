# BLOCO H.1 — Plano READ-ONLY de smoke test operacional dos analytics

**Data:** 2026-03-27  
**Modo:** orientação operacional — **nenhuma** alteração de código ou variáveis neste documento.

---

## 1. Resumo executivo

O smoke test V1 deve provar que **`track()`** envia **`POST`** com JSON para o backend **`POST /api/analytics`**, com **origem permitida no CORS**, **HTTP 200** e linhas de log **`[client_analytics_event]`**. O teste mínimo cobre: abrir o shell, **JOGAR AGORA**, carregar **`/game`**, **um chute válido** com saldo suficiente, sair da rota do jogo e confirmar eventos no **Network** e nos **logs do servidor**. Não há objetivo de medir estatísticas agregadas — apenas **fluxo real ponta a ponta** e **recebimento** no backend.

---

## 2. Estado atual do fluxo ponta a ponta

| Camada | Estado |
|--------|--------|
| **Frontend** | `goldeouro-player/src/utils/analytics.js` — `track(eventName, payload)` monta `{ event, ...payload, ts, sessionId }`; usa **`navigator.sendBeacon(url, Blob)`** se `VITE_ANALYTICS_BEACON_URL` for string não vazia e `sendBeacon` existir. |
| **Variável** | **`VITE_ANALYTICS_BEACON_URL`** — lida em build via Vite (`import.meta.env`). Deve ser definida no ambiente de **build** do player (ficheiros `.env*` do projeto Vite, variáveis do painel do host de preview/produção, etc.). |
| **URL** | Deve ser **absoluta** e terminar no path do ingestor: **`https://<host-do-backend>/api/analytics`** (protocolo e host reais do deploy do API, ex.: Fly.io conforme o projeto). |
| **Backend** | `server-fly.js` monta **`app.use('/api/analytics', require('./routes/analyticsIngest'))`** após **`express.json`**. `routes/analyticsIngest.js` valida **`event`** (string não vazia), responde **`200 { ok: true }`**, regista **`logger.info('[client_analytics_event]', JSON.stringify(body))`**. Rate limit principal tem **`skip`** para **`/api/analytics`**. |
| **CORS** | `server-fly.js`: allowlist (`CORS_ORIGIN` CSV ou lista por defeito), mais previews **`https://*.vercel.app`**. A origem do **browser** (URL do player) tem de ser aceite por essa política. |

---

## 3. Ambiente recomendado para o teste

| Decisão | Recomendação prática |
|---------|----------------------|
| **Onde testar** | Preferir um **preview do player** em **`https://*.vercel.app`** (já coberto pelo CORS do backend **se** o código deployado for o analisado) **ou** um domínio já listado / acrescentado em **`CORS_ORIGIN`** no deploy do API. Evitar testar de `localhost` contra API de produção **sem** confirmar que `CORS_ORIGIN` inclui `http://localhost:5173` (ou a porta usada) — o código por defeito **não** inclui localhost na lista explícita. |
| **Backend** | Instância **real** já exposta (ex.: URL pública do `server-fly.js` em produção/staging). |
| **URL do beacon** | **`VITE_ANALYTICS_BEACON_URL=https://<API-PÚBLICO>/api/analytics`** no build do player que se vai abrir no browser. |

**Melhor alvo operacional:** preview Vercel do front + API pública com `CORS_ORIGIN` alinhado **ou** preview + API com regra `.vercel.app` válida — minimiza surpresas de CORS relativamente a um front local não listado.

---

## 4. Passo a passo do smoke test

Checklist executável (uma pessoa, um browser):

1. **Preparação:** confirmar que o **build do player** usado no teste foi gerado com **`VITE_ANALYTICS_BEACON_URL`** apontando para **`https://<seu-backend>/api/analytics`**. Abrir DevTools → **Network** (preservar log ativado).
2. **Filtrar:** por nome de host do API ou por texto `analytics` / método **POST**.
3. **Shell:** carregar a app até aparecer o layout com **JOGAR AGORA** (`InternalPageLayout`).
4. **Clicar** em **JOGAR AGORA** — espera-se **`game_play_click`** (ver secção 5).
5. **Navegar** até **`/game`** carregar (`GameFinal`).
6. **Aguardar** o jogo sair de loading e inicializar — com sucesso espera-se **`game_ready`**; se o init falhar, espera-se **`game_error`** (fase init) e **não** `game_ready`.
7. **Chute:** com saldo suficiente para a aposta, executar **um chute válido** (direção válida). Espera-se **`shot_committed`** seguido de **`shot_outcome`**.
8. **Sair:** navegar para fora de **`/game`** (ex.: voltar ao shell ou outra rota) para disparar cleanup — espera-se **`game_leave`** com `reason: 'unmount'` no payload.
9. **Backend:** nos logs do processo/servidor, procurar **`[client_analytics_event]`** com JSON contendo os mesmos `event` / `sessionId` visíveis no Network.

---

## 5. Eventos mínimos esperados

Origem no código:

| Evento | Onde |
|--------|------|
| `game_play_click` | `InternalPageLayout.jsx` — ao clicar **JOGAR AGORA** antes de `navigate('/game')`. |
| `game_ready` | `GameFinal.jsx` — no `finally` do `init`, **só se** `initSucceeded` for verdadeiro (perfil + `gameService.initialize()` sem exceção). |
| `game_error` | `GameFinal.jsx` — falha no `init` (`phase: 'init'`, …), saldo insuficiente no chute (`phase: 'shot'`, `insufficient_balance`), ou erro no fluxo do chute (código noutro ramo). |
| `shot_committed` | `GameFinal.jsx` — ao iniciar chute válido (saldo e direção OK). |
| `shot_outcome` | `GameFinal.jsx` — após resposta bem-sucedida do `gameService.processShot`. |
| `golden_cycle_reset` | `GameFinal.jsx` — **apenas** se o resultado for **gol de ouro** e `getShotsUntilGoldenGoal()` devolver número. |
| `game_leave` | `GameFinal.jsx` — cleanup do `useEffect` de montagem, `track('game_leave', { reason: 'unmount' })`. |

**Ordem mínima típica (happy path):**

1. `game_play_click`  
2. `game_ready` — **depois** do carregamento bem-sucedido de `/game` (pode aparecer **depois** de alguns pedidos XHR ao API de jogo).  
3. `shot_committed`  
4. `shot_outcome`  
5. `golden_cycle_reset` — **opcional** (só em cenário de gol de ouro).  
6. `game_leave` — ao sair de `/game`.

**Nota:** a ordem exata no Network pode ser **intercalada** com outros pedidos; o importante é **existência** e **payload** coerentes, não o milissegundo exato entre beacons.

---

## 6. O que verificar no navegador

| Verificação | Critério |
|-------------|----------|
| **Pedidos** | Um ou mais pedidos **POST** para **`…/api/analytics`** (ou URL configurada). |
| **Status** | **200** na resposta (backend devolve `{ ok: true }`). |
| **Payload (Request payload)** | JSON com **`event`** (string), **`ts`**, **`sessionId`**, e campos extra conforme o evento (`direction`, `outcome`, `reason`, etc.). |
| **CORS** | Sem erro vermelho de CORS na consola; pedido **não** bloqueado antes de chegar ao servidor. Se falhar, frequentemente **não** há linha de log no backend — o bloqueio é no browser. |
| **Falha silenciosa** | `sendBeacon` **não** devolve Promise útil; ausência de POST pode ser rede/CORS/adblock — usar Network como fonte de verdade. |

---

## 7. O que verificar no backend

| Verificação | Critério |
|-------------|----------|
| **Log** | Linhas contendo **`[client_analytics_event]`** seguidas de string JSON com o corpo (mesmo conteúdo lógico que no cliente). |
| **Erros 400** | Se o corpo não tiver **`event`** string não vazia — não deve ocorrer no fluxo normal do `track()` atual. |
| **Erros 429** | O path **`/api/analytics`** está no **`skip`** do rate limit analisado — **não** deve ser limitado por esse limiter; se aparecer 429 neste path, investigar configuração/deploy (versão diferente do ficheiro, proxy, etc.). |

---

## 8. Riscos / limitações conhecidas

| Tema | Descrição |
|------|-----------|
| **sendBeacon** | Falhas **não** são reportadas ao JS; validação depende do **Network** e dos **logs**. |
| **game_ready** | Só ocorre se **init** completo sem exceção (perfil + `gameService.initialize()`). Falha de API ou sessão pode gerar **`game_error`** e **não** `game_ready`. |
| **game_leave** | Dispara no **unmount** de `GameFinal`. Em **React Strict Mode (dev)**, montagem/desmontagem dupla pode gerar **`game_leave`** extra ou ordem confusa — comparar com comportamento em **build de produção** se houver dúvida. |
| **golden_cycle_reset** | **Raro** — só com **gol de ouro** no chute; não exigir no smoke test mínimo. |
| **game_play_click** | Apenas no botão **JOGAR AGORA** do footer do `InternalPageLayout`; outros caminhos para `/game` **não** disparam esse evento. |
| **game_error** | Pode aparecer em init ou shot; presença **não** implica falha do pipeline de analytics — interpretar contexto (`phase`, `code`). |
| **Variável de ambiente** | Se **`VITE_ANALYTICS_BEACON_URL`** estiver vazia no **build**, o código **não** chama `sendBeacon` (em DEV pode haver `console.debug` apenas). |
| **Trailing slash** | URL do beacon **sem** barra final desnecessária: **`…/api/analytics`** (alinhado ao path do servidor). |

---

## 9. Critério GO / NO-GO

**GO (V1 operável para analytics ponta a ponta):**

- Pelo menos **um** POST para **`/api/analytics`** com **200** no Network, origin compatível com CORS.
- Payload com **`event`**, **`sessionId`**, **`ts`** coerentes com a ação (ex.: `game_play_click` após clique, `shot_committed` após chute).
- Log no backend com **`[client_analytics_event]`** correspondente (mesmo evento / mesma sessão observável).
- Happy path mínimo: **`game_play_click`** + **`game_ready`** + **`shot_committed`** + **`shot_outcome`** + **`game_leave`** (aceitando **uma** execução de `game_leave` ao sair).

**NO-GO:**

- **Nenhum** POST para o endpoint configurado durante o fluxo **e** confirmação de que a variável estava no build **ou**
- Erros **CORS** persistentes na consola **ou**
- Apenas **400** no endpoint durante uso normal do `track()` **ou**
- Backend deployado **sem** a rota / versão errada do servidor.

---

## 10. Próximos passos após o smoke test

| Resultado | Ação sugerida |
|-----------|----------------|
| **GO** | Documentar URL do API, origem do front e commit/build usados; considerar monitorização leve de volume/erros 400 nos logs; manter escopo V1 (sem dashboard obrigatório). |
| **NO-GO** | Verificar **valor efetivo** de `VITE_ANALYTICS_BEACON_URL` no artefacto (build); **CORS** (`CORS_ORIGIN` vs URL do player); **URL exata** (`/api/analytics`); **rede** e **versão** do backend deployado; repetir teste em **preview** com origem `.vercel.app` se o problema for CORS com localhost. |

---

*Documento apenas de planeamento operacional; não substitui execução do teste nem alterações de configuração.*
