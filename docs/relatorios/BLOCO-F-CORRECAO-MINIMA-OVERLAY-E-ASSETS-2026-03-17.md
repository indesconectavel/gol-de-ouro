# BLOCO F — Correção mínima overlay de resultado + restauração de assets

**Data:** 2026-03-17  
**Modo:** Apenas branch de preview; produção e backend intocados.

---

## 1. Diagnóstico curto

- **Problema:** As regras `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` em `game-shoot.css` usam `position: absolute; inset: 0; margin: auto` e podem competir com o posicionamento inline dos overlays renderizados em `#game-overlay-root` (portal do GameFinal), causando risco de deslocamento em edge cases.
- **Complementar:** Faltavam em `src/assets` os arquivos `goool.png`, `defendeu.png`, `ganhou.png`, necessários ao GameFinal e ao rebuild.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/game-shoot.css` | Regras `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` escopadas para `.game-stage .gs-goool`, `.game-stage .gs-defendeu`, `.game-stage .gs-ganhou`. |
| `goldeouro-player/src/assets/goool.png` | Restaurado do commit `cb274c2`. |
| `goldeouro-player/src/assets/defendeu.png` | Restaurado do commit `cb274c2`. |
| `goldeouro-player/src/assets/ganhou.png` | Restaurado do commit `cb274c2`. |

---

## 3. Explicação objetiva da correção

- **CSS:** Os seletores passaram de globais (`.gs-goool`, etc.) para escopados (`.game-stage .gs-goool`, etc.). Os overlays da /game são renderizados via createPortal como filhos de `#game-overlay-root`, que não contém a classe `.game-stage`. Assim, essas regras **nunca** se aplicam aos overlays do portal e deixam de competir com o inline (position: fixed; top/left 50%; transform translate(-50%,-50%)). Continuam válidas para qualquer uso legado dentro de `.game-stage` (ex.: /gameshoot).
- **Keyframes:** Não foram alterados; já preservam `translate(-50%,-50%)`.
- **Assets:** Os três PNGs usados pelo GameFinal foram restaurados a partir do histórico (commit `cb274c2`), garantindo que o build e o preview tenham os arquivos corretos.

---

## 4. Código completo dos trechos alterados (game-shoot.css)

```css
/* gol overlay - escopo stage: NUNCA afeta overlay em #game-overlay-root */
.game-stage .gs-goool{ position:absolute; inset:0; margin:auto;
  width:min(49%,504px); z-index:8; pointer-events:none;
  animation:gooolPop 1.2s ease-out forwards; }

/* defendeu overlay - escopo stage */
.game-stage .gs-defendeu{ position:absolute; inset:0; margin:auto;
  width:200px; height:200px; z-index:8; pointer-events:none;
  animation:pop .6s ease-out forwards; }

/* ganhou overlay - aparece após o goool.png - escopo stage */
.game-stage .gs-ganhou{ position:absolute; inset:0; margin:auto;
  width:200px; height:200px; z-index:9; pointer-events:none;
  animation:ganhouPop 5s ease-out forwards; }
```

(keyframes `pop`, `gooolPop`, `ganhouPop` permanecem inalterados)

---

## 5. Lista dos assets restaurados

- `goldeouro-player/src/assets/goool.png`
- `goldeouro-player/src/assets/defendeu.png`
- `goldeouro-player/src/assets/ganhou.png`

**Origem:** commit `cb274c2` (referência já usada no projeto). GameFinal continua importando apenas goool.png, defendeu.png, ganhou.png e golden-goal.png; nenhum import foi alterado.

---

## 6. Checklist final de validação no preview

- [ ] Fazer build do player a partir da branch de preview (`npm run build` em goldeouro-player).
- [ ] Abrir a /game no preview (logado), disparar chutes que resultem em **DEFENDEU**, **GOOOL**, **GANHOU** e (se aplicável) **GOL DE OURO**.
- [ ] Verificar se o overlay aparece **centralizado** na tela (sem deslocamento para a direita ou para o canto).
- [ ] No DevTools, com overlay visível, confirmar: elemento dentro de `#game-overlay-root`, computed `position: fixed`, `transform` com `translate(-50%, -50%)` (ou no keyframe).
- [ ] Confirmar que os assets carregam (sem 404 para goool/defendeu/ganhou).
- [ ] Não validar em produção; não alterar backend.

---

## 7. Resumo

Correção mínima aplicada: (1) escopo das regras de overlay em **game-shoot.css** para `.game-stage`, eliminando interferência com o portal; (2) restauração dos três assets em **src/assets** a partir do histórico. Preview pronto para validação final; produção e backend não foram alterados.
