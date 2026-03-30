# BLOCO G — Cirurgia 03 (G-4 Loading + Entrada)

**Data:** 2026-03-27  
**Objetivo:** Suavizar a percepção do ecrã de carregamento e da primeira entrada do viewport do jogo, sem alterar a lógica de `loading`, tempos de API ou estrutura do `GameFinal`.

---

## 1. Resumo executivo

Foi adicionado um bloco **G-4** em `game-scene.css` com: (1) **fade-in** de 200 ms no contentor de loading; (2) **pulsação leve** de opacidade no texto “Carregando jogo…”; (3) **entrada** do `.game-viewport` com `opacity` 0→1 e `translateY(6px)`→0 em 200 ms, com o mesmo easing já usado no HUD (`cubic-bezier(0.22, 1, 0.36, 1)`). Em `GameFinal.jsx`, apenas classes utilitárias (`game-loading-screen`, `game-loading-label`) foram acrescentadas ao JSX existente do loading — **a condição `if (loading)` e o fluxo de `init` permanecem iguais.**

---

## 2. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/pages/game-scene.css` | Secção G-4: keyframes `gameG4LoadingIn`, `gameG4LoadingPulse`, `gameG4StageEnter`; regras para `.game-loading-screen`, label; `body[data-page="game"] .game-viewport`; `prefers-reduced-motion`. |
| `goldeouro-player/src/pages/GameFinal.jsx` | Classes `game-loading-screen` e `game-loading-label` no ramo de loading. |
| `docs/relatorios/BLOCO-G-CIRURGIA-03.md` | Este relatório. |

---

## 3. Micro-cirurgias executadas

### Loading

- Contentor com classe `game-loading-screen`: animação **opacity** 0→1 em **200 ms** `ease-out`.
- Texto com classe `game-loading-label`: **pulse** subtil de opacidade (~2,2 s, infinito) apenas enquanto o loading está visível.

### Entrada do stage

- `body[data-page="game"] .game-viewport`: animação única ao montar o viewport do jogo — **200 ms**, opacidade + **translateY(6px)**→0, `forwards` para manter o estado final.

### Transições

- Sem `setTimeout`, sem atraso artificial no fim do fetch: a transição corre **após** o estado `loading` passar a `false`, como antes.
- `prefers-reduced-motion: reduce`: animações desligadas com `!important` para não forçar movimento.

---

## 4. O que NÃO foi alterado

- `useState(loading)`, `setLoading`, `init`, chamadas a API, `gamePhase`, zonas, HUD, overlays, portal, `gameScale`, `layoutConfig`, handlers.
- Ordem dos elementos no JSX principal; apenas classes no ramo de loading.
- `game-shoot.css`; regras G-1 e G-2; BLOCO F.

---

## 5. Riscos evitados

- Overlays em `#game-overlay-root` (fora do `.game-viewport`) **não** são filhos do elemento animado — `position: fixed` dos overlays mantém-se relativo à viewport conforme arquitetura existente.
- Duração **200 ms** — abaixo do limiar de “atraso” perceptível como espera extra.
- Escopo `body[data-page="game"]` no viewport evita aplicar entrada a qualquer outro uso futuro da classe noutro contexto (hoje só `GameFinal`).

---

## 6. Impacto perceptivo esperado

- Loading deixa de parecer um “corte” seco; o texto respira levemente.
- O jogo **entra** com um movimento curto e premium, reforçando continuidade sem tempo morto adicional.

---

## 7. Checklist de validação

1. Abrir `/game` com rede normal: ver fade-in do loading e pulse do texto.
2. Após dados carregarem: ver entrada suave do canvas/HUD (uma vez por visita à rota).
3. Ativar “reduzir movimento” no SO: animações devem desaparecer; jogo igual funcionalmente.
4. Confirmar que chutes, overlays e áudio comportam-se como antes.

---

## 8. Conclusão

A cirurgia **G-4** está **aplicada** e **pronta para validação** em preview: apenas CSS e duas classes no loading, sem alterar o comportamento funcional do carregamento.
