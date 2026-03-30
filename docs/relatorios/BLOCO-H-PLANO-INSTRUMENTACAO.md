# BLOCO H — Plano de Instrumentação

**Data:** 2026-03-27  
**Modo:** auditoria read-only (documento de planeamento; sem alterações de código).  
**Base técnica:** `goldeouro-player/src/pages/GameFinal.jsx`, `App.jsx`, `gameService.js`, `InternalPageLayout.jsx`.

---

## 1. Objetivo

Definir **observabilidade mínima** para a V1 do Gol de Ouro: eventos discretos, fáceis de emitir a partir dos pontos já existentes no fluxo, **sem** analytics pesado, **sem** obrigatoriedade de ferramentas externas e **sem** alterar tempos de rede, ordem de operações ou arquitetura atual.

O foco é responder com dados simples: entradas/saídas do `/game`, intenção de jogo (“JOGAR”), chutes com resultado, erros e — onde for possível sem inferência frágil — marcos de ciclo de gol de ouro.

---

## 2. Eventos essenciais

| # | Nome sugerido | Momento de negócio | Prioridade |
|---|----------------|-------------------|------------|
| H1 | `game_ready` | Sessão de jogo pronta para interagir (`loading` → falso após `init` bem-sucedido) | Alta |
| H2 | `game_play_click` | Utilizador clicou em “JOGAR AGORA” (entrada na rota `/game` a partir do shell) | Alta |
| H3 | `shot_committed` | Chute **aceite** pelo cliente e enviado ao backend (`processShot` concluído com sucesso) | Alta |
| H4 | `shot_outcome` | Resultado conhecido após resposta: `goal` \| `goal_golden` \| `save` (defesa) | Alta |
| H5 | `golden_cycle_reset` | Contador de gol de ouro reposto / próximo ciclo (quando `isGoldenGoal` ou `shotsUntilNext` atualizado de forma inequívoca) | Média |
| H6 | `game_leave` | Saída do `/game` (navegação para outra rota ou desmontagem do componente) | Alta |
| H7 | `game_error` | Falha de `init`, falha de `processShot`, ou bloqueio por saldo (subtipos por `code`) | Alta |

**Nota sobre “final de lote”:** no código atual da V1 (`GameFinal`), o utilizador aposta **R$ 1 fixo** por chute; o `gameService` mantém conceitos de lote no serviço, mas **não há** um evento único “fim de lote” exposto no `GameFinal` como passo de UI. O equivalente útil para produto é:

- **H5** — quando o backend/devolução indicar **gol de ouro** ou quando `shotsUntilGoldenGoal` for reposto após um ciclo (correlacionar com resposta da API); ou  
- evento **opcional** futuro se o backend passar um identificador de lote na resposta de chute.

Sem inventar campos: usar apenas o que já vem em `result` / `gameInfo`.

---

## 3. Pontos de captura no código

### 3.1 `GameFinal.jsx`

| Evento | Local seguro | Observação |
|--------|----------------|------------|
| `game_ready` | Imediatamente antes ou depois de `setLoading(false)` no `finally` de `init`, **só** se não houve erro fatal que impeça jogar | Não colocar antes do perfil/`gameService.initialize()` se quiser métrica “pronto para jogar”. |
| `game_error` (init) | Bloco `catch` do `init` (~linhas 303–305) | Já existe `toast.error`; acrescentar emissão sem alterar fluxo. |
| `shot_committed` / `shot_outcome` | Após `result.success` e leitura de `isGoal`, `isGoldenGoal` (~linhas 392–400) | **Não** emitir no retorno antecipado por `gamePhase !== IDLE`, saldo ou direção inválida — ou emitir `shot_rejected` com motivo (opcional, menor prioridade). |
| `golden_cycle_reset` | Ramo `isGoldenGoal` ou quando `setShotsUntilGoldenGoal` recebe valor explícito de `result.gameInfo.goldenGoal` | Evitar duplicar se vários `setState` dispararem o mesmo facto; preferir um único ponto após resultado estável. |
| `game_error` (chute) | `catch` de `handleShoot` (~linhas 516–522) | Incluir mensagem ou código normalizado. |
| `game_leave` | `return` do `useEffect` de montagem (cleanup ~linhas 314–324) **e/ou** imediatamente antes de `navigate(...)` nos botões MENU / Recarregar | Dupla fonte: cleanup cobre fecho de aba/navegação lateral; `navigate` cobre intenção explícita. |

### 3.2 Fora de `GameFinal.jsx` (entrada “JOGAR”)

| Evento | Local | Observação |
|--------|--------|------------|
| `game_play_click` | `InternalPageLayout.jsx`, botão do footer que chama `navigate('/game')` | Único sinal claro de “clique em JOGAR” a partir do shell; não confundir com `game_ready`. |

### 3.3 Rotas e proteção

| Contexto | Nota |
|----------|------|
| `App.jsx` | Rota `/game` → `ProtectedRoute` → `GameFinal`; evento de “entrada na rota” pode duplicar `game_play_click` + `game_mount` — recomenda-se **um** evento de intenção (H2) e **um** de prontidão (H1). |

### 3.4 O que **não** é ponto ideal para V1

- **Dentro dos `setTimeout` dos overlays:** apenas marcam atraso de UI; o resultado já foi decidido antes — preferir o ponto pós-API.
- **Render condicional dos overlays:** redundante se `shot_outcome` já carrega o tipo.
- **`gameService.js` em duplicado com `GameFinal`:** risco de duplo disparo; preferir **uma** camada (recomendado: `GameFinal` + botão shell) a menos que se centralize num único `trackShot` no serviço.

---

## 4. Payload mínimo por evento

Convenção: campos opcionais entre parêntesis; nunca enviar PII desnecessária na V1.

| Evento | Campos mínimos sugeridos |
|--------|---------------------------|
| `game_ready` | `ts`, `source: "game"` |
| `game_play_click` | `ts`, `source: "shell"` |
| `shot_committed` | `ts`, `direction` (TL/TR/C/BL/BR), `betAmount: 1` |
| `shot_outcome` | `ts`, `direction`, `outcome`: `goal` \| `goal_golden` \| `save`, (`prizeCents` ou valor agregado se já existir no `result`) |
| `golden_cycle_reset` | `ts`, `shotsUntilNext` (número após o chute) |
| `game_leave` | `ts`, `reason`: `navigate` \| `unmount` (se distinguível) |
| `game_error` | `ts`, `phase`: `init` \| `shot`, `code`: string curta ou `message` truncada |

**Frequência:** no máximo **1 H3 + 1 H4 por chute bem-sucedido**; H1 uma vez por montagem bem-sucedida; H2 uma vez por clique; H6 no máximo uma vez por saída de sessão de rota.

---

## 5. Estratégia leve de tracking

1. **Um único módulo** (ex.: `utils/trackGameEvent.ts` ou `.js`) com função `track(name, payload)` que:
   - em desenvolvimento: `console.debug` opcional ou noop;
   - em produção: `navigator.sendBeacon` para um endpoint próprio **ou** fila em memória com flush em `pagehide` — **sem** bloquear a UI, **sem** `await` no caminho quente do chute.

2. **Chamadas síncronas mínimas:** construir objeto e enfileirar; custo O(1).

3. **Correlação:** opcional `sessionId` gerado em `sessionStorage` na primeira visita ao `/game` na sessão do browser — útil para ligar H1→H3→H4→H6 sem backend de analytics.

4. **Não** acoplar a Mixpanel/GA como obrigação; manter interface para, no futuro, plugar um adaptador.

---

## 6. Riscos a evitar

- **Duplo envio** do mesmo chute (ex.: `processShot` + efeito secundário).
- **Instrumentar o `resize`** ou outros handlers de alta frequência.
- **Alterar** `OVERLAYS.ANIMATION_DURATION`, ordem de `setState`, ou idempotência do `gameService`.
- **Bloquear** o retorno de `handleShoot` com I/O de rede síncrono.
- **Confundir** “clique JOGAR” com “jogo pronto” — métricas de funil ficam distorcidas se forem o mesmo evento.

---

## 7. Plano de execução

1. **Fase 0 — Contrato:** fixar nomes dos eventos (tabela da secção 2) e formato JSON mínimo.
2. **Fase 1 — Infra:** implementar `track()` + destino (beacon/log) **sem** chamadas a partir do jogo ainda.
3. **Fase 2 — Shell:** `game_play_click` no footer do `InternalPageLayout`.
4. **Fase 3 — Game:** `game_ready`, `shot_committed` + `shot_outcome`, `game_error`, `game_leave`; opcional H5.
5. **Fase 4 — QA:** verificar no Network/beacon que não há picos de latência e que contagens batem com número de chutes reais numa sessão de teste.

---

**Conclusão do plano:** a instrumentação mínima encaixa **naturalmente** em `GameFinal.jsx` (pós-API e cleanup) e num único botão do shell; não exige nova arquitetura nem dependências obrigatórias, desde que o transporte de eventos seja assíncrono e fora do caminho crítico do chute.
