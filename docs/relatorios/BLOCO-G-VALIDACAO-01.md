# BLOCO G — Validação 01

**Data:** 2026-03-27  
**Objeto:** MICRO-CIRURGIA G-1 — zonas `.gs-zone` em `GameFinal` + bloco escopado em `game-shoot.css`.  
**Método:** revisão estática do código (JSX + CSS), comparação com `BLOCO-G-CIRURGIA-01.md` e critérios de escopo; **sem execução de browser** neste ambiente.

---

## 1. Resumo executivo

A implementação está **alinhada ao desenho reportado**: o inline deixou de fixar `background` e propriedades que bloqueavam o CSS; o bloco G-1 está corretamente escopado em `body[data-page="game"] .game-stage button.gs-zone`; hover e active declaram `transform` completo com `translate(-50%, -50%)` e `scale`, preservando o mesmo eixo de transformação do seletor global `.gs-zone`. Handlers e geometria inline (`left`, `top`, `width`, `height`) permanecem como antes.

**Ressalva única:** confirmação de **renderização e tacto** (desktop + mobile) cabe a teste manual no preview — aqui apenas se valida coerência técnica e ausência de alterações fora do escopo.

**Veredito geral:** **APROVADO COM RESSALVAS** (ver secção 6) — seguro para seguir para QA visual e, em seguida, próxima micro-cirurgia do plano.

---

## 2. Itens validados

| Item | Resultado |
|------|-----------|
| `GameFinal.jsx` — `style` das zonas só com `position`, `left`, `top`, `width`, `height` | **Confirmado** (linhas ~685–691). |
| Ausência de `background`, `border`, `borderRadius`, `cursor`, `zIndex`, `transition` no inline | **Confirmado**. |
| `onClick={() => handleShoot(zone)}` inalterado | **Confirmado**. |
| `disabled={!canShoot}` e `className` com `disabled` inalterados | **Confirmado**. |
| Bloco G-1 em `game-shoot.css` com escopo `body[data-page="game"] .game-stage button.gs-zone` | **Confirmado** (linhas ~509–561). |
| Variáveis `--zone-bg` / `--zone-bg-disabled` | **Confirmado**. |
| Hover em `@media (hover: hover) and (pointer: fine)` | **Confirmado**. |
| `:active` com `scale(0.97)` e `filter` | **Confirmado**. |
| Transição ~150 ms e `transition-duration: 120ms` no active | **Confirmado**. |
| `prefers-reduced-motion` | **Confirmado**. |
| `touch-action: manipulation` e `-webkit-tap-highlight-color` | **Confirmado**. |
| `translate(-50%, -50%)` repetido em `:hover` e `:active` | **Confirmado**. |
| Seletor global `.gs-zone` legado mantido (outras rotas) | **Confirmado** (linhas 502–507). |
| `game-scene.css` sem regras `.gs-zone` | **Confirmado** — HUD / BLOCO F não tocado por G-1. |

---

## 3. Ganhos perceptivos confirmados

**No código (não no pixel):**

- **Hover “real”:** sem `background` inline, as regras `:hover` do bloco G-1 podem alterar `background`, `border-color`, `filter` e `transform` — o bloqueio por especificidade inline foi removido.
- **Desktop:** combinação `scale(1.05)` + `brightness(1.12)` + borda/fundo mais claros no hover é um ganho perceptivo **plausível e intencional**.
- **Pressão / toque:** `:active` com `scale(0.97)` e transição ligeiramente mais curta transmite feedback tátil; em aparelhos só com toque, o `@media (hover: hover)` evita depender de hover fantasma — o utilizador vê sobretudo `:active`.
- **Alinhamento:** ao incluir `translate(-50%, -50%)` nos estados que redefinem `transform`, não se introduz `scale` isolado que anulasse o translate global — cadeia coerente com `.gs-zone`.

---

## 4. Regressões encontradas

**Nenhuma regressão estrutural ou de lógica** identificada na revisão:

- Não há mudança em `handleShoot`, `canShoot`, fases de jogo ou APIs.
- Geometria (`left`/`top`/`width`/`height`) igual à versão pré-G-1 no JSX.
- `z-index: 5` no bloco G-1 **reproduz** o valor que antes vinha do inline (o global `.gs-zone` tinha `z-index: 6`, mas o inline vencia com `5`).

**Observação menor (não classificada como regressão):** estado desativado usa `opacity: 0.55` no G-1 vs `opacity: .5` no `.gs-zone.disabled` global — diferença subtil; escopo mais específico aplica-se no `/game`.

**Regressões visuais em runtime:** **não verificáveis** sem teste no browser — registar como “não detetadas nesta validação”.

---

## 5. Integridade arquitetural

- **`/game` + `GameFinal`:** única alteração JSX nas zonas; stage, escala, overlays e restante HUD **não** aparecem modificados nesta leitura.
- **`body[data-page="game"]`:** escopo reforçado; estilos G-1 **não** aplicam sem essa condição + `.game-stage` + `button.gs-zone`.
- **BLOCO F:** `game-scene.css` sem impacto de G-1; isolamento `.gs-hud` e HUD **não** foram alterados por este diff.
- **Invasão fora do `/game`:** rotas que montam `.gs-zone` sem `data-page="game"` (ex. fluxo legado com `GameShootFallback`) continuam a depender só do bloco `.gs-zone` global — o G-1 **não** se aplica por desenho.

---

## 6. Segurança para a V1

**Classificação: APROVADO COM RESSALVAS**

- **Motivo do “com ressalvas”:** validação perceptiva final (pixels, latência de toque, contraste) **não** foi executada neste ambiente; a aprovação técnica do CSS/JSX é sólida.
- **Motivo de não reprovar:** critérios de hover/active, escopo e preservação de handlers/geometria estão satisfeitos no código; risco estrutural avaliado como baixo.

---

## 7. Próxima melhor micro-cirurgia

Conforme `BLOCO-G-PLANO-INICIAL.md`, o passo seguinte de **alto impacto / baixo risco** após G-1 é **G-2**: estados `:active` e `focus-visible` discretos nos botões do HUD (`btn-dashboard`, `hud-btn`, `control-btn`) **apenas em** `game-scene.css`, sem tocar em lógica — reforça feedback tátil e acessibilidade sem reabrir o BLOCO F nas zonas.

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| Hover ficou “real” (tecnicamente)? | **Sim** — o inline deixou de impedir que o CSS controle fundo e estados. |
| Active ficou adequado no código? | **Sim** — `scale(0.97)` + `filter` + transição curta. |
| Alinhamento preservado? | **Sim** — `translate(-50%, -50%)` mantido na cadeia com `scale` onde `transform` é redefinido. |
| Seguro para a V1? | **Sim, com QA visual recomendado** (ressalva). |
| Avançar para a próxima cirurgia? | **Sim** — após smoke test rápido no preview (zonas + chute + desativar durante animação). |

---

**Assinatura da validação:** revisão estática de repositório; **não** substitui teste manual no preview.
