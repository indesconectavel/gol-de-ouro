# BLOCO G — Cirurgia 02 (G-2 Botões HUD + Shell)

**Data:** 2026-03-27  
**Objetivo:** Refinar estados `:hover`, `:active` e `:focus-visible` e timing dos botões do HUD em `/game` e dos botões do `InternalPageLayout` (app shell), sem alterar layout, handlers, palco, overlays ou lógica.

---

## 1. Resumo executivo

Foram introduzidas variáveis de tempo `--go-hud-tx` / `--go-hud-ease` em `body[data-page="game"]` e aplicadas a `.btn-dashboard`, `.hud-btn`, `.control-btn` e ao botão **Recarregar** (`.hud-btn.primary` escopado). Estados **active** e **focus-visible** foram adicionados com compressão visual leve (sombra mais baixa, `translateY` / `scale` subtis, `filter: brightness` onde faz sentido). No **app shell**, `InternalPageLayout.jsx` recebeu `duration-150`, estados `active:` e contornos `focus-visible` nos três botões (voltar, sair quando visível, **JOGAR AGORA** no footer).

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/game-scene.css` | Variáveis G-2; `.btn-dashboard`, `.hud-btn`, `.hud-btn.secondary`, `.hud-btn.primary` (Recarregar), `.control-btn`; extensão da regra de cor do `.btn-dashboard` no header para `:active` / `:focus-visible`. |
| `goldeouro-player/src/components/InternalPageLayout.jsx` | Classes Tailwind: timing 150 ms, `active:` e `focus-visible` nos botões do header e footer. |
| `docs/relatorios/BLOCO-G-CIRURGIA-02.md` | Este relatório. |

---

## 3. Micro-cirurgias executadas

### Active state

- **`.btn-dashboard`:** `translateY(1px)`, sombra mais curta, `brightness(0.97)`, fundo ligeiramente mais escuro.
- **`.hud-btn`:** `translateY(0)` vs hover `-2px`, sombra reduzida, verde mais escuro, `brightness(0.96)`.
- **`.hud-btn.secondary`:** fundo mais escuro no active + `brightness(0.95)`.
- **`body...hud-btn.primary` (Recarregar):** `translateY(1px)`, sombra neutra, `brightness(0.97)`, alinhado à identidade amarela.
- **`.control-btn`:** `translateY(1px) scale(0.97)`, sombra mínima, `brightness(0.94)`.
- **InternalPageLayout:** `active:opacity-90 active:scale-[0.99]` nos links do header; footer **JOGAR AGORA** com `active:translate-y-0.5`, sombra mais contida e `active:brightness-[0.98]`.

### Focus-visible

- **`.btn-dashboard`:** contorno dourado `outline` 2 px + offset 3 px; `focus:not(:focus-visible)` sem outline para rato.
- **`.hud-btn`:** anel verde-esmeralda (`rgba(52, 211, 153, …)`).
- **`body...hud-btn.primary`:** outline 3 px dourado + offset 4 px (área grande do Recarregar).
- **`.control-btn`:** outline amarelo claro para contraste no fundo escuro.
- **InternalPageLayout:** header com `outline` âmbar suave; sair com vermelho suave; footer mantém `ring` existente (BLOCO F).

### Timing

- Variáveis **`--go-hud-tx: 150ms`** e **`--go-hud-ease: cubic-bezier(0.22, 1, 0.36, 1)`** em `body[data-page="game"]`.
- Transições explícitas em `background`, `transform`, `box-shadow`, `filter` (e `border-color` no control) em vez de `all 0.2s` / `all 0.3s`.
- Shell: **`duration-150`** e **`ease-out`** onde aplicável.

### Profundidade visual

- **`.btn-dashboard`:** sombra base `0 2px 8px` antes do hover; hover mantém elevação; active “aperta” para somba mais baixa.
- **`.control-btn`:** hover com `translateY(-1px)`; active rebaixa.

### Consistência entre botões

- Mesma família de easing via `--go-hud-ease` no HUD do jogo.
- Hover dos `.hud-btn` qualificado com `:not(:disabled)` para não animar estado desativado.
- Cores do texto do **MENU PRINCIPAL** no header preservadas para `:active` e `:focus-visible` (regra existente estendida).

---

## 4. O que NÃO foi alterado

- Textos, ícones, `padding` estrutural dos botões, posicionamento do HUD, stage, escala, overlays, `handleShoot`, `canShoot`, `gamePhase`, APIs, backend.
- `game-shoot.css`, zonas G-1, `#game-overlay-root`.
- Legado `.gs-hud` em ficheiros não tocados.
- Fluxo de navegação e handlers em `InternalPageLayout`.

---

## 5. Riscos evitados

- Apenas CSS e classes utilitárias; sem JS novo.
- Sem keyframes pesados; transições curtas (≈150 ms).
- `focus-visible` evita anel agressivo para utilizadores de rato quando não é necessário.
- Recarregar com `disabled` continua excluído de hover/active/focus-visible interativo via `:not(:disabled)`.

---

## 6. Impacto perceptivo esperado

- Cliques e toques com **resposta imediata** e sensação de **botão físico**.
- Navegação por teclado com **foco legível** e alinhado à paleta dourada/verde.
- HUD e footer com **ritmo visual** mais coerente (150 ms).

---

## 7. Checklist de validação

1. `/game`: hover e clique em **MENU PRINCIPAL**, **Recarregar** (ativo e desativado durante chute), **áudio** (control).
2. Tab: foco visível em cada botão do HUD sem sobrepor leitura.
3. Páginas com `InternalPageLayout`: header (voltar, sair), footer **JOGAR AGORA** — active e focus.
4. Confirmar que nenhum overlay ou zona de chute mudou.

---

## 8. Conclusão

A cirurgia **G-2** está aplicada e **pronta para validação** em preview: refinamento premium de interação nos botões acordados, com escopo delimitado e sem alteração de comportamento funcional.
