# BLOCO G — Cirurgia 01 (G-1 Zonas de chute)

**Data:** 2026-03-27  
**Objetivo:** feedback visual premium nas zonas `.gs-zone` do `GameFinal` (`/game`), sem alterar lógica, handlers ou geometria do palco.

---

## 1. Resumo executivo

**Problema:** Em `GameFinal.jsx`, as zonas de chute usavam `background` (e outros estilos visuais) em `style` inline. Em CSS, declarações inline têm prioridade sobre folhas de estilo; assim, regras como `.gs-zone:hover { background: … }` em `game-shoot.css` **não alteravam o fundo** no hover — a interação ficava “morta”.

**Solução:** Remover do JSX apenas propriedades visuais que bloqueavam o CSS (`background`, `border`, `borderRadius`, `cursor`, `zIndex`, `transition`), mantendo **inalterados** `position`, `left`, `top`, `width` e `height`. Em `game-shoot.css`, adicionar bloco escopado `body[data-page="game"] .game-stage button.gs-zone` com estados base, desativado, hover (apenas em dispositivos com hover fino), active e respeito a `prefers-reduced-motion`. Os estados `:hover` e `:active` usam `transform: translate(-50%, -50%) scale(…)` para **preservar** o mesmo `translate` herdado do seletor global `.gs-zone` e apenas acrescentar escala — sem mudar `left`/`top`/tamanhos.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/GameFinal.jsx` | Redução do `style` inline das zonas ao bloco posicional (position + caixa). |
| `goldeouro-player/src/pages/game-shoot.css` | Novas regras G-1 após o bloco `.gs-zone` legado. |
| `docs/relatorios/BLOCO-G-CIRURGIA-01.md` | Este relatório. |

---

## 3. Correção técnica aplicada

- **Inline vs hover:** `background` (e borda/cursor/transição) em estilo inline impede que o motor CSS aplique mudanças de `background` vindas de `:hover` em classes.
- **Resolução:** Estilos de superfície passam a ser definidos só no CSS, com especificidade maior no escopo `body[data-page="game"] .game-stage button.gs-zone`, garantindo hover/active efetivos e coexistência com o `.gs-zone` global usado noutras rotas (ex.: `GameShootFallback` sem `data-page="game"` continua com o comportamento anterior).

---

## 4. Melhorias visuais implementadas

- **Hover** (apenas `@media (hover: hover) and (pointer: fine)`): `scale(1.05)`, `brightness(1.12)`, fundo e borda ligeiramente mais presentes — evita hover “preso” em muitos toques.
- **Active:** `scale(0.97)`, `brightness(1.08)`, transição um pouco mais curta (120 ms) para sensação de pressão.
- **Transição:** 150 ms `ease-out` nas propriedades animadas (com duração reduzida em `prefers-reduced-motion`).
- **Mobile:** `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`; feedback principal via `:active`.

---

## 5. O que NÃO foi alterado

- Handlers (`onClick`, `handleShoot`), `disabled`, `canShoot`, mapeamento de zonas, `className` condicional `disabled`.
- `left`, `top`, `width`, `height` (mesma geometria em px).
- Estrutura do stage, escala do jogo, portal de overlays, HUD, `layoutConfig`, serviços e backend.

---

## 6. Riscos evitados

- Sem novas dependências, sem timers, sem mudança de fluxo de jogo.
- Escopo estrito a `/game` via `body[data-page="game"]` e `.game-stage`, sem reabrir conflitos do BLOCO F no HUD.
- `translate(-50%, -50%)` mantido em cadeia com `scale` nos estados interativos para não deslocar as zonas relativamente ao comportamento anterior do seletor global `.gs-zone`.

---

## 7. Impacto perceptivo esperado

- Zonas **reagem** ao passar o rato (desktop) e ao toque (`:active` em mobile).
- Sensação de **profundidade** leve (escala + brilho) sem animações pesadas.
- Jogo perceptivelmente mais **responsivo** visualmente, sem alterar tempos de rede ou de resultado.

---

## 8. Checklist de validação

1. Abrir `/game` autenticado; confirmar que as cinco zonas aparecem no mesmo sítio que antes.
2. Com saldo e fase IDLE: passar o rato sobre cada zona — hover com leve aumento e claridade.
3. Clicar numa zona — feedback de pressão (`active`) breve; chute continua a funcionar.
4. Durante animação de chute (`!canShoot`): zonas desativadas, sem hover, cursor coerente.
5. (Opcional) Ativar “reduzir movimento” no SO — transições quase instantâneas, sem escala em hover/active.
6. Regressão: abrir rota que use `GameShootFallback` (se existir no fluxo) e confirmar que zonas **não** dependem deste bloco novo (só `data-page="game"`).

---

## 9. Conclusão

A cirurgia G-1 está **implementada** e pronta para validação em preview: o bloqueio de hover por inline foi removido, estados hover/active foram adicionados com escopo seguro e risco estrutural mínimo.
