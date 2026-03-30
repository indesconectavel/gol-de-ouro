# BLOCO H — Validação 01

**Data:** 2026-03-27  
**Objeto:** Instrumentação 01 (`utils/analytics.js`, `GameFinal.jsx`, `InternalPageLayout.jsx`).  
**Método:** revisão estática do código-fonte (sem execução em runtime).

---

## 1. Resumo executivo

A implementação **confere** com `BLOCO-H-CIRURGIA-01.md` nos pontos centrais: `track()` síncrono, encapsulado em `try/catch`, sem `await`; `sessionId` via `sessionStorage` (`go_analytics_session_id`); payload unificado com `event`, `ts`, `sessionId` e campos do segundo argumento; beacon condicionado a URL não vazia e existência de `sendBeacon`; fallback `console.debug` apenas em `DEV`.

Os sete tipos de evento previstos estão presentes nos ficheiros indicados. **Ressalvas:** (a) `game_ready` depende de `initSucceeded` ser `true` — **apenas** quando o `try` do `init` não lança; se `gameService.initialize()` devolver `{ success: false }` **sem** `throw`, o código atual **não** define `initSucceeded = false`, pelo que `game_ready` pode disparar mesmo com init lógico falhado; (b) `game_play_click` só cobre o botão **JOGAR AGORA** do `InternalPageLayout`, não outras navegações possíveis para `/game`; (c) em React 18 Strict Mode (dev), montagem/desmontagem dupla pode duplicar `game_ready` / `game_leave` — efeito de ambiente, não de lógica de produção típica.

**Classificação:** **APROVADO COM RESSALVAS** (secção 7).

---

## 2. Eventos validados

| Evento | Confirmação no código |
|--------|------------------------|
| `game_ready` | `GameFinal.jsx` — `finally` do `init`, `if (initSucceeded) { track('game_ready', {}); }` (aprox. linhas 313–317). |
| `game_error` (init) | `catch` do `init` com `phase: 'init'` (305–312). |
| `game_leave` | Cleanup do `useEffect` inicial: `track('game_leave', { reason: 'unmount' })` (333). |
| `game_error` (saldo) | Antes do `return` por saldo insuficiente: `code: 'insufficient_balance'` (368). |
| `shot_committed` | Após validação de direção, antes de `setGamePhase(SHOOTING)` (379–382). |
| `shot_outcome` | Após `result.success` e cálculo de `isGoal` / `isGoldenGoal` (418–425). |
| `golden_cycle_reset` | Se `isGoldenGoal` e `getShotsUntilGoldenGoal()` retorna número (426–430). |
| `game_error` (shot) | `catch` de `handleShoot` (550–553). |
| `game_play_click` | `InternalPageLayout.jsx` antes de `navigate('/game')` (58–60). |

---

## 3. Pontos de captura confirmados

| Evento | Ficheiro / local |
|--------|------------------|
| `game_ready` / `game_error` (init) | `GameFinal.jsx`, função `init` dentro do `useEffect` de montagem. |
| `game_leave` | Mesmo `useEffect`, função de cleanup do `return`. |
| `shot_*` / `golden_cycle_reset` / `game_error` (shot) | `handleShoot` (`useCallback`). |
| `game_play_click` | `InternalPageLayout.jsx`, handler do footer. |

**Render:** não há chamadas a `track()` no corpo de render nem em JSX fora de handlers/`useEffect`/callbacks — conforme esperado.

---

## 4. Payloads confirmados

**Envelope (sempre):** `track` monta `{ event: eventName, ...payload, ts, sessionId }` (`analytics.js` linha 46).

| Evento | Campos extra no objeto final |
|--------|------------------------------|
| `game_ready` | apenas envelope |
| `game_play_click` | apenas envelope |
| `shot_committed` | `direction`, `shotNumber` |
| `shot_outcome` | `outcome` (`goal` \| `miss` \| `goal_golden`), `direction`, `reward` (número) |
| `golden_cycle_reset` | `shotsUntilNext` |
| `game_leave` | `reason: 'unmount'` |
| `game_error` | `phase` (`init` \| `shot`), `code` (string truncada a 200 chars onde aplicável) |

**Coerência:** nomes de eventos em string estáveis; sem PII explícita no payload além do que o plano permitia.

---

## 5. Problemas encontrados

**Nenhum bug de implementação** que impeça o uso da instrumentação conforme desenhado.

**Limitações / ressalvas objetivas:**

1. **`game_ready` vs `initialize()` sem exceção:** se `gameService.initialize()` retornar falha **sem** lançar erro, `initSucceeded` permanece `true` e `game_ready` dispara — possível desalinhamento semântico “pronto para jogar” vs “serviço não inicializado”.
2. **`game_play_click`:** cobre só o fluxo shell com `InternalPageLayout`; entradas em `/game` por outras rotas não geram este evento.
3. **`shot_committed` sem `shot_outcome`:** se `processShot` falhar após `shot_committed`, há tentativa registada sem outcome — útil para diagnóstico, não é duplicação.
4. **Strict Mode (dev):** possível duplicação de eventos ligados a mount/unmount.

---

## 6. Integridade do gameplay

- **Lógica:** condições de `loading`, `handleShoot`, `setGamePhase`, chamadas a API e toasts **mantêm-se**; apenas foram acrescentadas chamadas síncronas a `track()` e a variável `initSucceeded` no `init`.
- **`await`:** permanece apenas em `gameService.processShot` e no fluxo de `init` — **não** foi introduzido `await` em `track()`.
- **UI / CSS:** alterações limitam-se a import e linhas de tracking; **não** há mudança de classes G-1/G-2/G-4 nem de estrutura de overlays nesta revisão.
- **Re-renders:** `handleShoot` ganhou `totalChutes` nas dependências — recria o callback quando o total muda; comportamento esperado para `shotNumber` correto, impacto de performance negligenciável.

---

## 7. Segurança para produção

**Classificação: APROVADO COM RESSALVAS**

- **Pronto para V1** com: `VITE_ANALYTICS_BEACON_URL` apontando para endpoint que aceita `POST` + corpo JSON (e política CORS/beacon adequada); monitorização de taxa de erro se `sendBeacon` falhar silenciosamente.
- **Ressalvas:** ver secção 5; considerar no backlog endurecer `game_ready` só quando `initResult?.success === true` (sem alterar fluxo de `setLoading`).

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| Eventos implementados corretamente? | **Sim**, com ressalvas 1–2 acima. |
| Payloads adequados? | **Sim** — mínimos e consistentes. |
| Risco de duplicação indevida? | **Baixo** em navegação normal; possível em dev (Strict Mode). |
| Gameplay intacto? | **Sim** em leitura estática. |
| Seguro para V1? | **Sim**, com beacon configurado e aceitação das ressalvas. |

A instrumentação está **apta a uso** na V1 para observabilidade mínima, devendo o produto decidir se ajusta o critério de `game_ready` e a cobertura de `game_play_click` em iterações futuras.

---

**Assinatura:** validação por inspeção de código; testes de carga/rede do beacon não incluídos.
