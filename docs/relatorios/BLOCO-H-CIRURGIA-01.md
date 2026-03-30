# BLOCO H — Instrumentação 01

**Data:** 2026-03-27  
**Objetivo:** Instrumentação mínima conforme `BLOCO-H-PLANO-INSTRUMENTACAO.md`, sem impacto no gameplay nem `await` extra nos caminhos críticos.

---

## 1. Resumo executivo

Foi criado o módulo `goldeouro-player/src/utils/analytics.js` com `track(eventName, payload)` síncrono, não bloqueante: usa `navigator.sendBeacon` quando `VITE_ANALYTICS_BEACON_URL` está definido; caso contrário, em **desenvolvimento** regista `console.debug` estruturado; em produção sem URL, noop. `sessionId` é gerado uma vez por aba via `sessionStorage` e anexado automaticamente a cada evento, juntamente com `ts`.

Foram adicionadas chamadas `track()` em `GameFinal.jsx` (`game_ready`, `game_error`, `shot_committed`, `shot_outcome`, `golden_cycle_reset`, `game_leave`) e em `InternalPageLayout.jsx` (`game_play_click`). Nenhum handler foi substituído — apenas expressões inline acrescentadas ou flags mínimas no `init`.

---

## 2. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/utils/analytics.js` | **Novo** — `track()`, `sessionId`, `sendBeacon` / fallback. |
| `goldeouro-player/src/pages/GameFinal.jsx` | Import `track`; `init` com `initSucceeded`; `game_ready` / `game_error` (init); cleanup `game_leave`; saldo insuficiente + `shot_committed` + `shot_outcome` + `golden_cycle_reset` + `game_error` (shot). |
| `goldeouro-player/src/components/InternalPageLayout.jsx` | `game_play_click` antes de `navigate('/game')`. |
| `docs/relatorios/BLOCO-H-CIRURGIA-01.md` | Este relatório. |

---

## 3. Eventos implementados

| Evento | Descrição |
|--------|-----------|
| `game_ready` | Init concluiu sem exceção; após `setLoading(false)`. |
| `game_play_click` | Clique no footer “JOGAR AGORA” do shell. |
| `shot_committed` | Validações de chute passaram; antes de `setGamePhase(SHOOTING)`. |
| `shot_outcome` | Após resposta bem-sucedida; `outcome`: `goal` \| `miss` \| `goal_golden`. |
| `golden_cycle_reset` | Só se `isGoldenGoal`; `shotsUntilNext` via `gameService.getShotsUntilGoldenGoal()` após resposta (alinhado ao serviço; `processShot` não expõe `gameInfo`). |
| `game_leave` | Cleanup do `useEffect` de montagem (desmontagem do `/game`). |
| `game_error` | `init` falhou; saldo insuficiente; `catch` do chute. |

---

## 4. Pontos de captura

- **`game_ready` / `game_error` (init):** `finally` / `catch` do `init` dentro do `useEffect` inicial.
- **`game_leave`:** `return` de cleanup do mesmo `useEffect` (evita duplicar com cada `navigate`).
- **`shot_committed`:** após validação de direção, antes da fase `SHOOTING`.
- **`shot_outcome` / `golden_cycle_reset`:** imediatamente após derivar `isGoal` / `isGoldenGoal` da resposta.
- **`game_error` (shot):** saldo; `catch` de `handleShoot`.
- **`game_play_click`:** handler do botão do footer em `InternalPageLayout`.

---

## 5. Payloads

Todos os eventos incluem automaticamente no objeto enviado: `event`, `ts`, `sessionId`, e campos extra de `payload`:

| Evento | Campos extra |
|--------|----------------|
| `game_ready` | — |
| `game_play_click` | — |
| `shot_committed` | `direction`, `shotNumber` |
| `shot_outcome` | `direction`, `outcome`, `reward` |
| `golden_cycle_reset` | `shotsUntilNext` |
| `game_leave` | `reason: "unmount"` |
| `game_error` | `phase` (`init` \| `shot`), `code` (string curta) |

---

## 6. Garantias de segurança

- `track()` é síncrono, sem `await`, envolvido em `try/catch` interno — não propaga erros.
- Não altera estado React nem retornos de funções.
- Não há I/O assíncrono à espera no chute; `sendBeacon` é fire-and-forget.
- `golden_cycle_reset` só dispara quando o backend devolve `shotsUntilNext` numérico — sem evento artificial.
- G-1 / G-2 / G-4: apenas import e chamadas pontuais; CSS e markup de zonas/HUD/loading inalterados na estrutura.

---

## 7. Como testar

1. **DEV sem URL:** abrir consola; navegar para `/game` após login; ver `[analytics] game_ready`, `game_play_click` ao clicar “JOGAR AGORA” noutra página, `shot_committed` / `shot_outcome` ao chutar, `game_leave` ao sair da rota.
2. **Produção / beacon:** definir `VITE_ANALYTICS_BEACON_URL` apontando para um endpoint que aceite `POST` body JSON (ajustar servidor às políticas CORS/beacon).
3. Confirmar que o jogo se comporta como antes (mesmos toasts, mesmos timings).

---

## 8. Riscos evitados

- **Duplicação `game_leave`:** não instrumentar `navigate` nos botões do HUD — só cleanup.
- **Duplicação `shot_outcome`:** um único bloco após resultado válido.
- **Latência:** sem fila bloqueante nem `await` em `track`.

---

## 9. Conclusão

A instrumentação H-01 está **implementada** e **pronta para validação**: base mensurável com custo negligenciável no runtime; configurar `VITE_ANALYTICS_BEACON_URL` quando existir backend para ingerir eventos.
