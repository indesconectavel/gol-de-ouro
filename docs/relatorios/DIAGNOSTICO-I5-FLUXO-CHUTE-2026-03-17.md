# DIAGNÓSTICO I.5 — FLUXO DE CHUTE (READ-ONLY)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — análise e documentação. Nenhuma alteração em código ou comportamento.

**Objetivo:** Mapear com precisão como o chute funciona hoje, onde a duplicidade pode ocorrer e onde a idempotência deve atuar, para preparar intervenção segura (Fase 1 do plano de execução).

---

## 1. Visão geral do fluxo atual

### Resumo do funcionamento do chute

1. **Usuário** escolhe uma direção (TL, TR, C, BL, BR) na tela oficial do jogo (`/game`, componente `GameFinal`).
2. **Frontend** chama `gameService.processShot(direction, betAmount)` que envia um **POST** para `/api/games/shoot` com body `{ direction, amount: 1 }`. Não envia header `X-Idempotency-Key` nem nenhum identificador único do gesto.
3. **Backend** recebe o request em `server-fly.js` (endpoint `POST /api/games/shoot`), valida usuário (JWT), direção e valor, lê saldo, obtém ou cria lote em memória, incrementa contador global, calcula se é gol (10º chute) e se é Gol de Ouro (contador % 1000), atualiza o saldo do usuário (optimistic lock), adiciona o chute ao lote em memória, insere o chute na tabela `chutes` e responde 200 com resultado e novo saldo.
4. **Frontend** recebe a resposta, atualiza saldo e estado local e exibe o resultado (gol, defesa, Gol de Ouro).

O fluxo **não** é idempotente do ponto de vista do usuário: dois requests com a mesma intenção (um chute) podem ser processados como dois chutes distintos, com dois débitos e dois registros em `chutes`.

---

## 2. Fluxo detalhado passo a passo

Do clique até a resposta, com referência ao código real.

| Passo | Onde | O que acontece |
|-------|------|----------------|
| 1 | **GameFinal.jsx** | Usuário clica em uma zona (TL, TR, C, BL, BR). `handleShoot(direction)` é chamado. |
| 2 | **GameFinal.jsx** | Guarda: `if (gamePhase !== GAME_PHASE.IDLE) return;` e `if (balance < betAmount) return;`. Em seguida `setGamePhase(GAME_PHASE.SHOOTING)` e `await gameService.processShot(direction, betAmount)`. |
| 3 | **gameService.js** | `processShot(direction, amount)` valida direção, valor e saldo local; chama `apiClient.post('/api/games/shoot', { direction, amount: betValue })` **sem** headers adicionais (nenhum `X-Idempotency-Key`). |
| 4 | **apiClient.js** | Axios envia POST com `Content-Type: application/json`, `Accept: application/json` e `Authorization: Bearer <token>` (token do localStorage). Timeout 30s. Não há retry configurado para POST; em erro de rede (CORS / Failed to fetch) o interceptor de resposta tenta **uma vez** novamente contra o backend direto. |
| 5 | **server-fly.js** | `authenticateToken` extrai e valida JWT; `req.user.userId` fica disponível. |
| 6 | **server-fly.js** | Lê `direction` e `amount` do body; valida direção (VALID_DIRECTIONS) e amount === 1. |
| 7 | **server-fly.js** | Lê header `x-idempotency-key`; se presente e se a chave já estiver em `idempotencyProcessed` com idade < 120s, responde **409** e **não processa**. Como o cliente **não envia** a chave, este bloco nunca é acionado na prática. |
| 8 | **server-fly.js** | SELECT saldo do usuário (`usuarios`). Se saldo < 1, responde 400. |
| 9 | **server-fly.js** | `getOrCreateLoteByValue(1)` — itera `lotesAtivos` (Map em memória), reutiliza lote ativo com valor 1 e `chutes.length < 10` ou cria novo. Retorna o objeto lote. |
| 10 | **server-fly.js** | `loteIntegrityValidator.validateBeforeShot(lote, …)` — valida que o lote aceita mais um chute. |
| 11 | **server-fly.js** | `contadorChutesGlobal++` (memória). `await saveGlobalCounter()` (upsert em `metricas_globais`). |
| 12 | **server-fly.js** | `shotIndex = lote.chutes.length`, `isGoal = (shotIndex === lote.winnerIndex)`, cálculo de `premio` e `premioGolDeOuro`. |
| 13 | **server-fly.js** | **DÉBITO/CRÉDITO:** `UPDATE usuarios SET saldo = novoSaldo WHERE id = userId AND saldo = user.saldo`. Se nenhuma linha afetada → 409 e **não** adiciona chute ao lote nem insere em `chutes`. |
| 14 | **server-fly.js** | Atualiza lote em memória: `lote.chutes.push(chute)`, `lote.totalArrecadado += betAmount`, etc. Se goal, `lote.status = 'completed'`, `lote.ativo = false`. |
| 15 | **server-fly.js** | `validateAfterShot`; em falha, reversão de saldo (UPDATE), `lote.chutes.pop()` e 400. |
| 16 | **server-fly.js** | **INSERT:** `supabase.from('chutes').insert({ usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index })`. Em erro, reversão de saldo, pop no lote e 500. |
| 17 | **server-fly.js** | Se request trouxe `idempotencyKey`, `idempotencyProcessed.set(idempotencyKey, { ts: Date.now() })`. Responde 200 com `shootResult`. |
| 18 | **gameService.js** | Recebe 200; atualiza `userBalance` e `globalCounter` a partir da resposta; retorna objeto `{ success, shot, lote, user, isGoldenGoal }`. |
| 19 | **GameFinal.jsx** | Atualiza `balance`, `gamePhase`, overlays e animações; em erro no try/catch, `setGamePhase(GAME_PHASE.IDLE)` e toast de erro. |

---

## 3. Comportamento do frontend

### Arquivo responsável pelo chute

- **gameService.js** — método `processShot(direction, amount = 1)`. É o único que envia o POST para o backend na tela oficial.
- **GameFinal.jsx** — chama `gameService.processShot(direction, betAmount)` dentro de `handleShoot(direction)`.

### Como o request é disparado

- Disparo único por chamada a `processShot`. Cada clique em uma zona (quando `gamePhase === IDLE` e saldo suficiente) resulta em **uma** chamada a `processShot` e portanto **um** POST.

### Existe retry automático?

- **No gameService:** Não. Não há retry em `processShot`.
- **No apiClient (axios):** Não há retry genérico para POST. Porém o **interceptor de resposta** em caso de erro (linhas 125–185) trata `Failed to fetch` ou CORS: faz **uma nova tentativa** com o mesmo `error.config` contra a URL direta do backend. Ou seja, um **único** retry automático pode ocorrer em cenário de CORS/falha de rede, com o **mesmo** body e **mesmos** headers (sem idempotency key). Se a primeira tentativa tiver de fato sido processada no servidor e a resposta se perdeu, a segunda pode ser processada como **segundo chute** → débito duplicado.

### Existe debounce?

- **Não.** Não há debounce no `handleShoot` nem no `processShot`. Cliques rápidos em sequência podem gerar múltiplas chamadas antes do primeiro `setGamePhase(SHOOTING)` refletir na UI (atraso de um ciclo de render).

### Existe proteção contra clique duplo?

- **Parcial.** A UI usa `canShoot = (gamePhase === GAME_PHASE.IDLE && balance >= betAmount)` e `disabled={!canShoot}` nas zonas, e no início de `handleShoot` há `if (gamePhase !== GAME_PHASE.IDLE) return;`. Assim que `setGamePhase(GAME_PHASE.SHOOTING)` é executado, a próxima renderização desabilita os botões. Porém entre dois cliques **muito rápidos** (antes da re-render), duas execuções de `handleShoot` podem ter passado da guarda com `gamePhase` ainda IDLE, resultando em **dois** `processShot` em voo. Não há lock assíncrono (ex.: ref “isShooting”) que impeça uma segunda chamada antes da primeira retornar.

### O request é idempotente hoje?

- **Não.** O body é apenas `{ direction, amount: 1 }`. Não há `X-Idempotency-Key`, nem `X-Request-Id`, nem qualquer identificador que associe o request a um “gesto único” do usuário. O backend trata cada POST como um novo chute.

---

## 4. Comportamento do backend

### Onde o endpoint é definido

- **Arquivo:** `server-fly.js`.  
- **Rota:** `app.post('/api/games/shoot', authenticateToken, async (req, res) => { ... })`.  
- **Linhas (referência):** aproximadamente 1128–1392.

### Como o request é recebido

- Body JSON: `{ direction, amount }`.  
- Headers: `Authorization: Bearer <JWT>`, `Content-Type: application/json`. Não é enviado `X-Idempotency-Key` pelo cliente oficial.

### Existe leitura de idempotency key?

- **Sim.** Código: `const idempotencyKey = (req.headers['x-idempotency-key'] || '').trim();`  
- Se `idempotencyKey` for não vazio, o backend consulta `idempotencyProcessed.get(idempotencyKey)`. Se existir entrada com `Date.now() - entry.ts < IDEMPOTENCY_TTL_MS` (120.000 ms), responde **409** com mensagem “Chute já processado com esta chave de idempotência” e **não** executa o restante do fluxo (nenhum débito, nenhum INSERT).  
- Como o cliente não envia a chave, essa verificação **nunca** é acionada na prática.

### Existe alguma verificação de duplicidade além da idempotency key?

- **Não.** Não há verificação por token de sessão, por par (userId, timestamp, direction), nem por outro identificador. A única deduplicação seria via `X-Idempotency-Key`, que hoje não é usada.

### Onde ocorre o débito

- **Exatamente:** após validação do lote, incremento do contador, cálculo de prêmio e **antes** de adicionar o chute ao array em memória.  
- **Operação:** `supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', req.user.userId).eq('saldo', user.saldo)`.  
- **Linhas (referência):** ~1244–1267. Se o UPDATE afetar uma linha, o débito (ou crédito em caso de gol) está efetivado.

### Onde ocorre o INSERT em chutes

- **Exatamente:** após o UPDATE de saldo, após o push no lote em memória e após `validateAfterShot`.  
- **Operação:** `supabase.from('chutes').insert({ usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index })`.  
- **Linhas (referência):** ~1316–1335. Não há transação com o UPDATE; se o processo falhar entre UPDATE e INSERT, fica saldo alterado sem registro de chute.

### Onde poderia ocorrer duplicidade (dois requests “iguais” processados)

- Dois POSTs com a **mesma intenção** (um único gesto do usuário) chegam ao backend em momentos diferentes (retry, duplo clique, timeout + novo clique).  
- **Cenário 1 — Retry CORS:** Request 1 é processado com sucesso (débito + INSERT); a resposta se perde (CORS/timeout). O interceptor do axios reenvia o mesmo request. O backend processa de novo: lê saldo já atualizado (ex.: 99), debita de novo (99 → 98) e insere outro chute. Resultado: **dois débitos e dois registros** para **uma** ação.  
- **Cenário 2 — Duplo clique:** Dois cliques muito rápidos; dois `handleShoot` passam da guarda antes de `gamePhase` mudar; dois POSTs. O primeiro processa (saldo 100 → 99, 1 chute). O segundo processa (saldo 99 → 98, mais 1 chute). Resultado: **dois débitos e dois registros**.  
- **Cenário 3 — Timeout + novo clique:** Usuário clica; o POST demora; usuário acha que não enviou e clica de novo. Dois POSTs; mesmo efeito que cenário 2.  
- Em todos esses casos não há identificador no request que permita ao backend tratar o segundo como “mesmo ato” e rejeitar (409).

---

## 5. Situação atual da idempotência

### Existe mecanismo de idempotência no backend?

- **Sim.** `idempotencyProcessed` é um `Map()` em memória. Chave = valor do header `X-Idempotency-Key`; valor = `{ ts: Date.now() }`. TTL de 120 segundos (limpeza a cada 60s em `setInterval`).  
- **Linhas (referência):** declaração ~367–379; leitura ~1169–1177; escrita ~1374–1376.

### Como funciona

- Se o request tiver header `X-Idempotency-Key` com valor não vazio:  
  - Antes de qualquer alteração de saldo ou lote, o backend verifica se essa chave já está no Map com `ts` dentro dos últimos 120s.  
  - Se sim → resposta **409**, sem débito e sem INSERT.  
  - Se não (ou se a chave expirou) → o fluxo segue; ao final, se a chave existir, faz `idempotencyProcessed.set(idempotencyKey, { ts: Date.now() })`.

### É usado de fato?

- **Não.** O cliente oficial (`gameService.js` e `apiClient`) **não envia** `X-Idempotency-Key`. Nenhum outro cliente do repositório envia esse header para `/api/games/shoot`. Portanto a proteção existe no backend mas **nunca é acionada**.

### Protege ou não protege?

- **Protege apenas quando a chave é enviada.** Com a chave enviada e reenviada no retry/duplicata, o segundo request receberia 409 e não geraria segundo débito nem segundo INSERT.  
- Na configuração atual (cliente sem chave), **não protege**: todo request é tratado como novo chute.

### Limitações

- Idempotência só em **memória** do processo: perdida em restart; não compartilhada entre instâncias.  
- TTL 120s: após 2 minutos a mesma chave pode ser reutilizada e um novo chute seria aceito (comportamento esperado para “nova tentativa” após tempo).  
- Depende 100% do **cliente** enviar uma chave estável por “gesto único” e reenviar a **mesma** chave em retries.

---

## 6. Pontos de vulnerabilidade

Lista direta: onde pode duplicar e onde não há proteção.

| # | Onde pode duplicar | Proteção atual |
|---|--------------------|----------------|
| 1 | **Cliente envia dois POSTs para o mesmo gesto** (duplo clique antes da re-render) | Apenas guarda de UI (`gamePhase === IDLE`); não há lock assíncrono. Dois requests podem ser disparados. |
| 2 | **Cliente reenvia o POST após timeout** (usuário clica de novo) | Nenhuma. Cada POST é independente. |
| 3 | **Axios reenvia o POST no interceptor** (CORS / Failed to fetch) | Nenhuma. Mesmo body e mesmos headers; backend processa como segundo chute. |
| 4 | **Backend recebe dois requests com mesma intenção** | Nenhuma deduplicação sem `X-Idempotency-Key`. Cada request gera um débito e um INSERT. |
| 5 | **Dois requests do mesmo usuário em sequência** | O segundo lê saldo já atualizado pelo primeiro; gera **segundo** débito e **segundo** chute. Não há “um chute por gesto”, há “um chute por POST”. |

Onde **não** há proteção:

- **Frontend:** Nenhum identificador único por gesto; nenhum debounce; nenhum lock que impeça segundo `processShot` antes do primeiro retornar; retry do axios pode duplicar POST.  
- **Backend:** Nenhuma deduplicação quando o header de idempotência está ausente; a ordem de operações (contador, saldo, lote, INSERT) não inclui verificação de “este ato já foi processado”.

---

## 7. Local ideal para aplicar idempotência

Sem implementar, apenas indicar **em qual ponto do fluxo** a proteção deve acontecer.

### Onde a proteção deve acontecer

- **No backend, na entrada do fluxo de chute**, **antes** de qualquer operação que altere estado (antes de ler saldo para uso no UPDATE, ou pelo menos antes do UPDATE em `usuarios`).  
- **Motivo:** A decisão “este request é duplicata de um já processado” deve ser tomada **uma única vez**, no início, e em função de um identificador **enviado pelo cliente** (idempotency key). Se a chave já estiver registrada como processada → responder 409 e não executar o restante (nem débito nem INSERT).  
- O código **já** faz isso quando a chave está presente (linhas 1167–1177). O ponto ideal é **exatamente esse**: manter a verificação no início, **e** fazer com que o cliente envie uma chave estável por “gesto de chute” e reutilize a mesma chave em retries.

### Onde a chave deve ser gerada e enviada

- **No frontend**, no momento do gesto (quando o usuário escolhe a direção e o chute é disparado). Uma chave por “tentativa de chute” (ex.: UUID por clique, ou hash de userId + timestamp do clique), **mantida** para o mesmo gesto e **reutilizada** se o mesmo request for reenviado (retry com o mesmo `config` no axios). Assim, o segundo request (retry ou duplicata) levará a mesma chave e o backend responderá 409 sem debitar de novo.

### Resumo do ponto de intervenção

- **Backend:** Manter a verificação atual de `X-Idempotency-Key` no início do handler de `/api/games/shoot`; ela já é o ponto correto. Não é necessário “mover” a idempotência para outro lugar no fluxo.  
- **Frontend:** Gerar e enviar `X-Idempotency-Key` em todo POST de chute (e, em retry, reenviar a mesma chave). A intervenção é no **gameService** (ou no componente que chama) e no **apiClient** (para que o header seja anexado ao request de chute).

---

## 8. Conclusão objetiva

### O sistema hoje é idempotente?

- **Não.** Dois requests com a mesma intenção (um único chute do usuário) podem ser processados como dois chutes, com dois débitos e dois registros em `chutes`. O backend tem suporte a idempotência via header, mas o cliente não o utiliza.

### Onde está o maior risco?

- **Maior risco:** o mesmo ato do usuário (um clique, uma tentativa de chute) gerar **dois POSTs** — por duplo clique, por timeout seguido de novo clique ou por retry automático do axios (CORS/Failed to fetch). Como não há identificador de “gesto único”, o backend processa os dois e debita duas vezes.

### Qual é o ponto mais seguro para intervenção?

- **Ponto mais seguro:**  
  1. **Frontend:** Passar a enviar `X-Idempotency-Key` em todo POST de chute, com uma chave gerada por “tentativa de chute” e reutilizada em qualquer retry desse mesmo request.  
  2. **Backend:** Manter o comportamento atual: se a chave já estiver em `idempotencyProcessed` (dentro do TTL), responder 409 e não processar.  
- Assim a proteção é ativada **sem alterar** a lógica interna do backend (sem mudar ordem de operações, sem transação ainda) e com **blast radius** limitado ao fluxo de chute e ao header. Clientes antigos que não enviem a chave continuam sendo aceitos (um chute por POST, como hoje).

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código ou comportamento. Baseado em: gameService.js, apiClient.js, GameFinal.jsx, server-fly.js (endpoint POST /api/games/shoot e idempotencyProcessed).*
