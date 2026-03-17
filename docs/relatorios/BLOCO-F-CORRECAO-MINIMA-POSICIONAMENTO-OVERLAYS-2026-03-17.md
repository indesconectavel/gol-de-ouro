# BLOCO F — Correção mínima final do posicionamento dos overlays de resultado (/game)

**Data:** 2026-03-17  
**Modo:** Apenas preview; produção intocada. Sem backend, sem refatoração ampla.

---

## 1. Diagnóstico curto

O forense apontou a regra legada `.gs-golden-goal` (e `.gs-golden-victory`) em `game-scene.css` como suspeita: `position: absolute`, `top: 20%`, `transform: translateX(-50%)` podem conflitar com o overlay centralizado do GameFinal em edge cases. Na /game o overlay de Gol de Ouro é renderizado via createPortal em `#game-overlay-root` com estilos inline (fixed, 50%, translate(-50%,-50%)). O elemento tem a classe `gs-golden-goal`, então a regra do CSS poderia, por ordem de aplicação ou em cenários específicos, interferir no posicionamento. **Não há** outras regras de overlay de resultado neste arquivo (apenas `#game-overlay-root` e `.stat-item.golden-goal` para o HUD, que não foram alteradas).

---

## 2. Arquivo alterado

- **Único arquivo:** `goldeouro-player/src/pages/game-scene.css`
- **GameFinal.jsx, assets, toast, backend:** não alterados.

---

## 3. Explicação objetiva da correção

As regras `.gs-golden-goal` e `.gs-golden-victory` foram **escopadas ao stage**: de `.gs-golden-goal` para `.game-stage .gs-golden-goal` e de `.gs-golden-victory` para `.game-stage .gs-golden-victory`. O overlay de resultado da /game é renderizado em `#game-overlay-root` (filho direto de `body`), **fora** de `.game-stage`. Assim, essas regras **nunca** se aplicam ao overlay do portal; continuam disponíveis para qualquer uso legado dentro do stage. Nenhuma regra foi removida; os keyframes `goldenGoalPop` e `goldenVictoryPop` permanecem inalterados.

---

## 4. Trecho alterado (game-scene.css)

**Antes (linhas 334-355):**
```css
/* ===== ANIMAÇÕES GOL DE OURO ===== */
.gs-golden-goal {
  position: absolute;
  ...
}

.gs-golden-victory {
  position: absolute;
  ...
}
```

**Depois (linhas 334-355):**
```css
/* ===== ANIMAÇÕES GOL DE OURO (escopo stage: NUNCA aplicado ao overlay em #game-overlay-root) ===== */
.game-stage .gs-golden-goal {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  max-width: 80%;
  height: auto;
  animation: goldenGoalPop 1.5s ease-out;
}

.game-stage .gs-golden-victory {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  max-width: 80%;
  height: auto;
  animation: goldenVictoryPop 2s ease-out;
}
```

O restante do arquivo (incl. `@keyframes goldenGoalPop` e `@keyframes goldenVictoryPop`) permanece igual.

---

## 5. Checklist final de validação visual

- [ ] Build: `cd goldeouro-player && npm run build` — sucesso.
- [ ] Preview: abrir `/game`, fazer login, dar chute até gol; overlay **GOOOL** centralizado.
- [ ] Após GOOOL: overlay **GANHOU** centralizado.
- [ ] Chute que resulte em defesa: overlay **DEFENDEU** centralizado.
- [ ] Quando aplicável: overlay **GOL DE OURO** centralizado (sem desvio para cima nem para os lados).
- [ ] Redimensionar janela: overlays permanecem centralizados na viewport.
- [ ] Produção: nenhuma alteração.

---

## 6. Mini relatório

Correção mínima aplicada: escopo das regras legadas `.gs-golden-goal` e `.gs-golden-victory` em `game-scene.css` para `.game-stage`, eliminando qualquer possibilidade de conflito com o overlay centralizado renderizado em `#game-overlay-root`. Nenhuma remoção de código; apenas seletor mais específico. A /game continua usando apenas o overlay central via portal, sem regra legada competindo por posicionamento.

---

*Documento gerado em 2026-03-17. Apenas branch de preview.*
