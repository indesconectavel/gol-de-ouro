# VALIDAÇÃO I5 — IDEMPOTÊNCIA DO CHUTE (FASE 1)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco ou deploy. Apenas análise de comportamento.

**Objetivo:** Validar a implementação da idempotência do chute (Fase 1) no fluxo Frontend → API → Backend → Banco → Resposta.

---

## 1. HEADER DE IDEMPOTÊNCIA

### 1.1 Todo POST /api/games/shoot envia X-Idempotency-Key?

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Header presente em toda chamada de chute | **OK** | `goldeouro-player/src/services/gameService.js` linhas 89–105: antes do `apiClient.post` é gerada `idempotencyKey` e passada em `headers: { 'X-Idempotency-Key': idempotencyKey }`. Não há ramo que chame `/api/games/shoot` sem esse header. |
| Valor diferente por chute | **OK** | Chave gerada com `shot-${Date.now()}-${Math.random().toString(36).slice(2)}-${direction}-${betValue}`. Cada invocação de `processShot()` gera nova key (novo timestamp e novo random). |
| Valor igual em retries | **OK** | No interceptor de erro do `apiClient.js` (linhas 152–167), o retry usa `axios.request(directConfig)` com `directConfig` derivado de `error.config`. O `config` original da chamada inclui os `headers` enviados em `processShot()`; o retry reenvia o mesmo config, portanto a **mesma** key. |

**Validação no DevTools (a fazer em preview):** Aba Network → filtrar por `shoot` → inspecionar Request Headers do POST e confirmar presença de `X-Idempotency-Key` e que dois cliques distintos mostram valores diferentes.

---

## 2. TESTE DE DUPLICIDADE (CRÍTICO)

### 2.1 Comportamento esperado

- **Primeiro request** (com key K) → **200** (chute processado, débito aplicado, 1 INSERT em `chutes`).
- **Segundo request** (mesma key K, dentro do TTL 120s) → **409** (mensagem “Chute já processado com esta chave de idempotência”).
- **Saldo:** debitado **uma vez** apenas.
- **Tabela `chutes`:** **um** registro para essa key.

### 2.2 Análise de código (read-only)

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Backend rejeita key já processada antes de debitar | **OK** | `server-fly.js` linhas 1168–1177: leitura de `x-idempotency-key`; se key existe em `idempotencyProcessed` e `Date.now() - entry.ts < IDEMPOTENCY_TTL_MS`, responde 409 e **return** sem executar leitura de saldo, lote, UPDATE ou INSERT. |
| Key é registrada só após sucesso | **OK** | Linhas 1374–1376: `idempotencyProcessed.set(idempotencyKey, { ts: Date.now() })` só é executado após UPDATE de saldo, push no lote, INSERT em chutes e montagem da resposta 200. |
| Retry do axios envia o mesmo config (mesma key) | **OK** | `apiClient.js`: retry usa `error.config`; headers do request original são preservados no config do axios. |

**Simulação em ambiente de preview:**  
- Opção A: forçar erro de rede (throttling/offline) no primeiro POST e deixar o interceptor reenviar → segundo request deve levar a mesma key e receber 409.  
- Opção B: reenviar manualmente o mesmo POST (ex.: via DevTools “Replay” ou script) com os mesmos headers → esperado 409.  
- Confirmar no banco: um único registro em `chutes` para esse usuário/horário e saldo debitado uma vez.

---

## 3. TESTE DE CHUTES DISTINTOS

### 3.1 Comportamento esperado

- Dois cliques separados → duas keys diferentes → dois chutes válidos → dois débitos corretos e dois registros em `chutes`.

### 3.2 Análise de código

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Cada chamada a processShot() gera nova key | **OK** | `gameService.js` linha 91: `idempotencyKey` é criada dentro do `processShot` a cada chamada; não há reuso de key entre chamadas. |
| Backend não rejeita keys distintas | **OK** | Só há 409 quando a **mesma** key já está em `idempotencyProcessed`. Keys diferentes são processadas normalmente. |

**Validação em preview:** Dois cliques em zonas (ou direções) diferentes; em DevTools, dois POSTs com `X-Idempotency-Key` diferentes; ambos 200; saldo e `chutes` refletindo dois chutes.

---

## 4. RETROCOMPATIBILIDADE

### 4.1 Request sem X-Idempotency-Key

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Backend aceita request sem header | **OK** | `server-fly.js` linha 1169: `idempotencyKey = (req.headers['x-idempotency-key'] || '').trim()`. Se ausente, string vazia. Linha 1170: `if (idempotencyKey)` — bloco de checagem de duplicata só roda quando há key; sem key o fluxo segue normalmente (leitura de saldo, lote, UPDATE, INSERT). |
| Comportamento idêntico ao atual (sem key) | **OK** | Nenhuma outra condição no handler exige a key; resposta 200 e persistência como antes. |

**Validação em preview:** Enviar POST `/api/games/shoot` sem header `X-Idempotency-Key` (ex.: curl ou Postman); esperado 200 e chute registrado.

---

## 5. IMPACTO NO FRONTEND

### 5.1 Análise de código

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Nenhuma nova trava no GameFinal | **OK** | Nenhuma alteração em `GameFinal.jsx`; guardas `gamePhase !== GAME_PHASE.IDLE` e `balance < betAmount` e `setGamePhase(GAME_PHASE.SHOOTING)` permanecem como antes. |
| gamePhase e fluxo intactos | **OK** | Apenas `gameService.processShot()` passou a receber um terceiro argumento (config com headers); a assinatura e o uso em `GameFinal.jsx` (await gameService.processShot(direction, betAmount)) não mudaram. |
| UI e resposta ao usuário | **OK** | Tratamento de resposta (success, error, toast) e atualização de estado (balance, overlays) seguem iguais; apenas o conteúdo do request inclui o header. |

**Validação em preview:** Jogar alguns chutes na tela `/game`; confirmar que a tela não trava, que as fases (IDLE → SHOOTING → RESULT) avançam e que a UI responde normalmente.

---

## 6. ANÁLISE DE RISCO

| Risco | Avaliação | Observação |
|-------|-----------|------------|
| Colisão de key | **Muito baixo** | Formato `shot-${Date.now()}-${Math.random().toString(36).slice(2)}-${direction}-${betValue}` torna colisão (mesma key em duas tentativas distintas) extremamente improvável. |
| Perda de key em retry | **Não ocorre** | O retry do axios usa o mesmo `config` da requisição original, que já contém os headers definidos em `processShot()`. |
| Bloqueio indevido de chute válido | **Não esperado** | 409 só ocorre quando a **mesma** key é reenviada dentro do TTL (120s). Chutes novos têm keys novas; clientes sem key não passam pelo bloco de idempotência. |
| Key reutilizada entre gestos | **Não ocorre** | A key é gerada por chamada dentro de `processShot()`; não há armazenamento de key entre chamadas no cliente. |

---

## 7. FLUXO COMPLETO (RESUMO)

```
Frontend (GameFinal) → handleShoot(direction)
  → gameService.processShot(direction, betAmount)
  → gera idempotencyKey
  → apiClient.post('/api/games/shoot', body, { headers: { 'X-Idempotency-Key': idempotencyKey } })
  → (em retry: mesmo config → mesma key)

Backend (POST /api/games/shoot)
  → lê x-idempotency-key
  → se key presente e já em idempotencyProcessed (TTL 120s) → 409, fim
  → senão: saldo, lote, contador, UPDATE saldo, push lote, INSERT chutes
  → se key presente → idempotencyProcessed.set(key)
  → 200 + shootResult
```

---

## 8. EVIDÊNCIAS E LOGS

- **Evidência de implementação:** análise estática dos arquivos `goldeouro-player/src/services/gameService.js`, `goldeouro-player/src/services/apiClient.js` e `server-fly.js` (trechos do endpoint `/api/games/shoot` e do cache `idempotencyProcessed`).
- **Prints/logs em ambiente real:** a serem obtidos em **preview** (build da branch com Fase 1), via:
  - DevTools → Network → POST `shoot` → Request Headers (`X-Idempotency-Key`).
  - Resposta 200 vs 409 conforme cenário (primeiro request vs retry com mesma key).
  - Consulta ao banco (contagem em `chutes`, saldo do usuário) antes/depois do teste de duplicidade.

---

## 9. RESULTADO POR PONTO DE VALIDAÇÃO

| # | Ponto | Resultado | Observação |
|---|--------|-----------|------------|
| 1 | Header enviado em todo POST shoot | **OK** | Código garante; conferir no DevTools em preview. |
| 2 | Valor diferente por chute | **OK** | Código garante; conferir no DevTools em preview. |
| 3 | Valor igual em retries | **OK** | Config do axios preserva headers no retry; conferir em preview com retry. |
| 4 | Duplicata → 409, um débito, um registro | **OK** | Backend implementado assim; validar em preview + banco. |
| 5 | Chutes distintos → keys diferentes, dois chutes | **OK** | Código garante; validar em preview. |
| 6 | Sem key → aceito normalmente | **OK** | Backend implementado assim; validar com request sem header. |
| 7 | Jogo fluido, sem travas, gamePhase ok | **OK** | Nenhuma mudança em GameFinal nem em fases; validar em preview. |
| 8 | Riscos (colisão, perda de key, bloqueio) | **OK** | Análise indica risco muito baixo e sem bloqueio indevido. |

---

## 10. CONCLUSÃO FINAL

Com base **apenas na análise de código** (read-only), a implementação da Fase 1 está **consistente** com:

- envio de `X-Idempotency-Key` em todo chute pelo cliente oficial;
- deduplicação no backend (409 para mesma key no TTL) sem segundo débito nem segundo INSERT;
- retrocompatibilidade (requests sem key aceitos);
- ausência de alteração em fluxo de fases ou em lógica de transação/contador/lotes.

**Para considerar a Fase 1 aprovada para deploy em produção**, é necessário:

- Executar em **ambiente de preview** os testes manuais descritos acima (DevTools, retry, dois chutes, request sem key, fluidez da UI).
- Confirmar na prática: 200 no primeiro request com key, 409 no segundo com a mesma key, saldo e tabela `chutes` consistentes.

Enquanto essa validação manual em preview não for realizada:

- [ ] **APROVADO PARA DEPLOY** — marcar quando os testes em preview forem executados e estiverem OK.
- [ ] **BLOQUEADO** — marcar se algum teste em preview falhar ou se houver regressão.

**Recomendação:** A análise de código **apoia** que a implementação está correta. Recomenda-se rodar a checklist em preview e, se tudo passar, assinalar **APROVADO PARA DEPLOY** e então promover para produção com rollback disponível para a tag `pre-fase1-idempotencia-2026-03-17`.

---

*Relatório gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco ou deploy durante a validação.*
