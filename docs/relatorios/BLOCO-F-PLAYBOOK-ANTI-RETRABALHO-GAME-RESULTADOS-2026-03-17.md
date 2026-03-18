# BLOCO F — Playbook anti-retrabalho da /game

**Documento oficial.** Evitar retrabalho futuro no sistema visual da rota `/game`.  
**Data:** 2026-03-17 | **Referência:** Produção https://www.goldeouro.lol/game é intocável.

---

## 1. Contexto

- **Rota /game:** única página do jogo de chute ao gol. Componente usado: **GameFinal** (App.jsx).
- **Problema enfrentado:** overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) apareciam **deslocados** (ex.: para a direita ou para o canto), em vez de centralizados na viewport.
- **Objetivo do sistema:** overlays 100% relativos à viewport, centralizados, independentes do scale do palco e de qualquer container com `transform`.

---

## 2. Sintomas

- Overlay de resultado (GOOOL, GANHOU, DEFENDEU ou GOLDEN GOAL) **deslocado para a direita** ou para um canto.
- `position: fixed` com `top: 50%` e `left: 50%` **não** centralizando na tela.
- Em alguns builds: overlays no **canto inferior esquerdo** ou palco ancorado no canto (problema de centralização do stage, não do overlay).
- Sensação de “dois centros” ou overlay que “pula” no início da animação.

---

## 3. Falsos caminhos que consumiram tempo

| Falsa hipótese | Por que não era a causa |
|----------------|--------------------------|
| **Renderização duplicada** | Forense confirmou: uma única camada (createPortal para #game-overlay-root). Não há segundo overlay dentro do stage. |
| **Asset errado** (goool.png, ganhou_100, etc.) | GameFinal usa só goool.png, ganhou.png, defendeu.png, golden-goal.png. Assets estão corretos; arquivos extras no repo não são usados na /game. |
| **Toast competindo com overlay** | Toast é texto no canto (top-right); overlay é imagem central. São camadas distintas e complementares. |
| **Falta de #game-overlay-root no HTML** | index.html já tinha o nó como filho direto de body. O problema era o **fallback para document.body** no JS quando o nó não era usado. |
| **Keyframes “errados”** | Keyframes estavam sem `translate(-50%,-50%)` e sobrescreviam o transform inicial; isso foi corrigido. Não era “animação errada” e sim **posicionamento durante a animação**. |
| **Regra .gs-golden-goal “ativa”** | A regra em game-scene.css era legado; inline do GameFinal prevalece. O risco era edge case; neutralizamos escopando a regra ao `.game-stage`. |

---

## 4. Causa raiz final

**Posicionamento incorreto**, por duas partes:

1. **Containing block:** O portal usava `document.getElementById('game-overlay-root') || document.body`. Com fallback para `body`, os nós podiam ficar em contexto onde um ancestral (ex.: wrapper com `transform`) cria novo containing block para `position: fixed`, deslocando o overlay.
2. **Keyframes:** Em game-shoot.css, os keyframes `gooolPop`, `ganhouPop` e `pop` usavam só `transform: scale(...)`, sobrescrevendo o `translate(-50%,-50%)` inicial e deslocando o centro durante a animação.

**Não era:** duplicação de overlay, asset incorreto ou toast.

---

## 5. Arquivos críticos

| Arquivo | Função |
|---------|--------|
| **goldeouro-player/src/App.jsx** | Rota `/game` → `<GameFinal />`. Não usar GameShoot/GameShootSimple/GameShootFallback na /game. |
| **goldeouro-player/index.html** | Deve ter `<div id="game-overlay-root" aria-hidden="true"></div>` como **filho direto de body**, após `#root`. |
| **goldeouro-player/src/pages/GameFinal.jsx** | Único componente da /game. Overlays via createPortal **somente** para `document.getElementById('game-overlay-root')` (sem fallback para body). |
| **goldeouro-player/src/pages/game-scene.css** | `#game-overlay-root` sem transform/filter; regras `.gs-golden-goal` e `.gs-golden-victory` **escopadas** a `.game-stage` para não afetar o portal. |
| **goldeouro-player/src/pages/game-shoot.css** | Keyframes `pop`, `gooolPop`, `ganhouPop` devem incluir `translate(-50%,-50%)` em **todos** os passos da animação. |
| **goldeouro-player/src/game/layoutConfig.js** | OVERLAYS.SIZE (dimensões); não define posição do overlay (posição é fixed 50% + translate no JSX). |

---

## 6. Assets oficiais

**Overlays de resultado (usados pelo GameFinal):**

- `goool.png`
- `ganhou.png`
- `defendeu.png`
- `golden-goal.png`

**Palco e gameplay:**

- `bg_goal.jpg`, `ball.png`, `goalie_idle.png`, `goalie_dive_tl.png`, `goalie_dive_tr.png`, `goalie_dive_bl.png`, `goalie_dive_br.png`, `goalie_dive_mid.png`

**Não usados na /game (não trocar por estes):** ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png.

---

## 7. Camadas visuais corretas

| Camada | O que é | Onde | Papel |
|--------|---------|------|--------|
| **Overlay central** | Imagens GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL | createPortal → `#game-overlay-root` (fora do stage) | Única camada de **resultado visual** centralizado. position: fixed; top/left 50%; transform translate(-50%,-50%). |
| **Toast** | Texto (“GOL! Você ganhou R$ X”, “Defesa!”) | ToastContainer no App; disparado por toast.success/toast.info no GameFinal | Complementar; top-right. Não substitui o overlay. |
| **Palco** | .game-viewport → .game-scale → .game-stage | Dentro do React tree em #root | Bola, goleiro, fundo, HUD. Pode ter transform: scale(); overlays **não** devem estar aqui. |

Na /game **não** existe overlay de resultado dentro do stage; GameShootSimple/GameShootFallback não são usados na rota /game.

---

## 8. Ordem correta de debug

1. **Confirmar rota:** App.jsx → `/game` deve renderizar **GameFinal**.
2. **Confirmar destino do portal:** GameFinal deve usar **apenas** `document.getElementById('game-overlay-root')` (sem fallback para body).
3. **Confirmar HTML:** index.html com `#game-overlay-root` filho direto de body.
4. **Confirmar CSS do container:** `#game-overlay-root` com position: static; transform: none; filter: none (sem criar containing block).
5. **Confirmar keyframes:** Em game-shoot.css, `pop`, `gooolPop`, `ganhouPop` com `translate(-50%,-50%)` em todos os passos.
6. **Confirmar regras legadas:** Em game-scene.css, `.gs-golden-goal` e `.gs-golden-victory` escopadas a `.game-stage` (não globais).
7. **Descartar duplicação:** Uma única chamada createPortal por tipo de overlay; nenhum overlay de resultado dentro de .game-stage.
8. **Descartar asset errado:** Imports em GameFinal = goool, ganhou, defendeu, golden-goal.

---

## 9. Ordem correta de correção

1. **Estrutura:** Garantir `#game-overlay-root` no index.html (filho direto de body). Garantir portal **sem** fallback para body no GameFinal.jsx.
2. **Container:** Garantir em game-scene.css que `#game-overlay-root` não cria containing block (static, transform none, filter none, will-change auto, contain none).
3. **Keyframes:** Em game-shoot.css, em todo keyframe que altera `transform` nos overlays, usar `transform: translate(-50%,-50%) scale(...)` (ou o valor desejado), nunca só `scale()`.
4. **Legado:** Escopar ou remover regras que apliquem position/transform a `.gs-golden-goal` / `.gs-golden-victory` fora do portal (ex.: `.game-stage .gs-golden-goal`).
5. **Validar:** Build, preview, chute gol/defesa/gol de ouro, redimensionar janela; overlays centralizados.

---

## 10. Checklist de validação

Antes de considerar a /game estável ou antes de qualquer deploy:

- [ ] **Build:** `cd goldeouro-player && npm run build` — sucesso.
- [ ] **HTML:** index.html contém `<div id="game-overlay-root">` como filho direto de body.
- [ ] **Portal:** GameFinal usa somente `getElementById('game-overlay-root')`; nenhum fallback para `document.body`.
- [ ] **Gol:** Overlay GOOOL no centro da tela (horizontal e vertical).
- [ ] **Ganhou:** Após GOOOL, overlay GANHOU centralizado.
- [ ] **Defesa:** Overlay DEFENDEU centralizado.
- [ ] **Gol de ouro:** Overlay GOLDEN GOAL centralizado (sem desvio para cima/lados).
- [ ] **Redimensionar:** Janela redimensionada; overlays permanecem centralizados.
- [ ] **Produção:** Nenhuma alteração em produção sem seguir este playbook.

---

## 11. Regras para futuras alterações

- **Não** usar `document.body` como destino do portal de overlays. Usar **só** `#game-overlay-root`.
- **Não** colocar overlays de resultado dentro de `.game-scale` ou `.game-stage` (evitar containing block por transform).
- **Não** adicionar `transform`, `filter` ou `perspective` em `#game-overlay-root` nem em seus ancestrais até body.
- **Não** criar keyframes de overlay que sobrescrevam o transform sem manter `translate(-50%,-50%)` quando o elemento for centralizado com top/left 50%.
- **Não** adicionar regras CSS globais para `.gs-goool`, `.gs-ganhou`, `.gs-defendeu`, `.gs-golden-goal` que forcem position/transform diferente do inline do GameFinal; se precisar de regra, escopar ao stage (ex.: `.game-stage .gs-golden-goal`).
- **Não** trocar a rota /game para GameShoot, GameShootSimple ou GameShootFallback sem documentar e validar overlays.
- **Sempre** que alterar overlays ou CSS da /game, rodar o checklist da seção 10.

---

## 12. Lições aprendidas

- **position: fixed** é relativo ao **containing block**; se um ancestral tiver `transform`, o fixed passa a ser relativo a esse ancestral, não à viewport. Por isso o portal deve ir para um nó fora de qualquer container com transform (ex.: #game-overlay-root, filho direto de body).
- **Keyframes** que definem `transform` substituem o valor inicial do elemento durante a animação. Para manter centralização, incluir `translate(-50%,-50%)` em todos os passos do keyframe, não só `scale()`.
- **Fallback para body** parece inofensivo mas acopla os overlays à árvore do app; um único wrapper com transform quebra o posicionamento. Destino único e dedicado (#game-overlay-root) evita isso.
- **Regras legadas** em CSS (ex.: .gs-golden-goal com position absolute) podem “acordar” em edge cases ou em builds diferentes. Escopar ao contexto antigo (.game-stage) ou remover evita conflito com o overlay no portal.
- **Forense antes de corrigir:** confirmar se o problema é duplicação, asset ou posicionamento evita correções no lugar errado (ex.: trocar assets ou remover “overlay duplicado” que não existia).
- **Produção como referência:** não alterar produção; usar como verdade visual e comparar o preview contra ela após cada correção.

---

*Documento oficial. Atualizar este playbook quando houver mudanças estruturais na /game ou no sistema de overlays.*
