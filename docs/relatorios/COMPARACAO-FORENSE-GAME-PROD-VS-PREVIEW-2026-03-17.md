## 1. Resumo executivo
A página `/game` está implementada via `goldeouro-player/src/pages/GameFinal.jsx`, usando `goldeouro-player/src/game/layoutConfig.js` como “fonte de verdade” para coordenadas fixas (base 1920x1080) e overlays de resultado (`goool`, `defendeu`, `ganhou`, `golden-goal`) exibidos via `createPortal` no `document.body`.

Com base na evidência de código da produção atual, a renderização esperada para overlays é **centralizada na tela** (`top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`) e os assets usados são explicitamente importados em `GameFinal.jsx` (`goool.png`, `defendeu.png`, `ganhou.png`, `golden-goal.png`).

No preview da branch `feature/bloco-e-gameplay-certified`, foram reportados indícios de regressão visual: (i) overlay de resultado aparecendo no **canto inferior esquerdo**, e (ii) possível divergência de asset no `GOOOL`. Essas ocorrências, caso confirmadas em runtime por print/vídeo, caracterizam **regressão bloqueadora** para promoção, pois quebram fidelidade ao layout aprovado (onde os overlays são centralizados).

## 2. Referência de produção (current aprovado)
### 2.1 Estrutura geral da tela `/game` (produção atual)
- Stage com layout fixo base 1920x1080: `STAGE.WIDTH=1920`, `STAGE.HEIGHT=1080`.
- Fundo do campo: `bg_goal.jpg` (`bgGoalImg`) renderizado como `img` absolutado sobre o stage.
- HUD superior e botão “MENU PRINCIPAL” (header): `MENU PRINCIPAL` navega para `/dashboard`.
- Zonas clicáveis: 5 botões (`TL`, `TR`, `C`, `BL`, `BR`) com posições derivadas de `TARGETS` e offsets de `HORIZONTAL_OFFSET`.
- Goleiro: sprite selecionado por pose (idle/dive por direção) e posição derivada de `GOALKEEPER`.
- Bola: sprite `ball.png` movida para o alvo calculado por `TARGETS` (com offsets idênticos aos visuais).

### 2.2 Overlays e feedbacks visuais (produção atual)
Overlays são renderizados em `GameFinal.jsx` por `createPortal` no `document.body` (fora do “game-scale”):
- `GOOOL`:
  - Asset: `goool.png` (`gooolImg`)
  - Render: `<img ... style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', width: OVERLAYS.SIZE.GOOOL.width, height: OVERLAYS.SIZE.GOOOL.height }} />`
  - Timing: `OVERLAYS.ANIMATION_DURATION.GOOOL` (1200ms)
- `GANHOU`:
  - Asset: `ganhou.png` (`ganhouImg`)
  - Timing: exibido após `goool` (timer baseado em `OVERLAYS.ANIMATION_DURATION.GOOOL`)
  - Render: central (`top/left 50%` + `translate(-50%, -50%)`)
- `DEFENDEU`:
  - Asset: `defendeu.png` (`defendeuImg`)
  - Timing: `OVERLAYS.ANIMATION_DURATION.DEFENDEU` (800ms) + buffer no reset
  - Render: central
- `GOLDEN GOAL`:
  - Asset: `golden-goal.png` (`goldenGoalImg`)
  - Timing: `OVERLAYS.ANIMATION_DURATION.GOLDEN_GOAL` (5500ms)
  - Render: central

### 2.3 Posicionamento (produção atual)
- Coordenadas dos elementos principais (bola/goleiro/targets) são definidas em pixels no `layoutConfig.js`.
- Overlays são centralizados por CSS inline + `position: fixed` no `document.body`.

## 3. Estado do preview (`feature/bloco-e-gameplay-certified`)
### 3.1 Estrutura geral
- O routing de `/game` em `goldeouro-player/src/App.jsx` referencia diretamente `GameFinal` (não há fallback/rota alternativa no código do `App.jsx`).
- O que foi reportado no preview indica discrepância **apenas na camada visual de overlays** (não na estrutura geral).

### 3.2 Overlays (reportado no preview)
Foram reportados:
- `GOOOL`/overlay de resultado aparecendo no **canto inferior esquerdo** (desvio de posição).
- Possível divergência de asset no `GOOOL` (imagem diferente da aprovada).

## 4. Comparação estrutural (produção vs preview)
### 4.1 Layout geral
- Produção: stage e HUD baseados em coordenadas fixas do `layoutConfig.js`.
- Preview: não há evidência no código base fornecido de mudança em `GameFinal.jsx`/`layoutConfig.js` (diferença estrutural não confirmada por delta de código durante esta auditoria).

Classificação (com evidência disponível):
- ✅ Igual / preservado: estrutura geral (stage/HUD/targets/goleiro/bola), pois `/game` usa `GameFinal` e o layoutConfig é “single source of truth” na produção.

### 4.2 Posicionamento
- Produção: overlays centralizados por `position: fixed` + `top/left 50%`.
- Preview: overlay no canto inferior esquerdo (regressão reportada).

Classificação:
- 🔴 Regressão crítica / bloqueadora: posicionamento de overlays de resultado (desalinhamento visual com o layout aprovado).

## 5. Comparação dos overlays (GOOOL / GANHOU / DEFENDEU / GOLDEN GOAL)
### 5.1 GOOOL
- Produção: `goool.png`, centralizado.
- Preview: reportado como deslocado para canto inferior esquerdo e possível asset divergente.

Classificação:
- 🔴 Regressão crítica / bloqueadora: (i) posição e (ii) possível asset.

### 5.2 GANHOU
- Produção: `ganhou.png`, centralizado e sequenciado após `GOOOL`.
- Preview: não foi informado asset/posição específica além do comportamento geral de overlay deslocado.

Classificação (por evidência reportada):
- 🟠 Regressão moderada: possível deslocamento/UX afetado (necessita confirmação com print/vídeo do estado `GANHOU`).

### 5.3 DEFENDEU
- Produção: `defendeu.png`, centralizado.
- Preview: não foi detalhado, mas o sintoma “overlay deslocado” tende a afetar a mesma camada.

Classificação (por evidência reportada):
- 🟠 Regressão moderada: possível deslocamento/UX afetado (necessita confirmação).

### 5.4 GOLDEN GOAL
- Produção: `golden-goal.png`, centralizado.
- Preview: não foi detalhado.

Classificação (por evidência reportada):
- 🟡 Diferente mas aceitável (provisório): sem confirmação específica do deslocamento/asset do Golden Goal no preview.

## 6. Regressões encontradas (o que piorou / mudou indevidamente)
1. Overlays de resultado no preview aparecem no canto inferior esquerdo (quando a produção espera centralização absoluta).
   - Impacto: quebra fidelidade visual ao layout aprovado e potencial interferência de UX (overlays fora do centro esperado).
   - Severidade: alta.
2. Possível divergência de asset do `GOOOL` no preview (imagem diferente da aprovada).
   - Impacto: falha de fidelidade aos assets aprovados.
   - Severidade: alta.

## 7. Itens preservados
- Roteamento `/game` apontando para `GameFinal`.
- Assets e timers de overlays definidos no `GameFinal.jsx`/`layoutConfig.js` na produção atual.
- Sequenciamento lógico esperado:
  - `GOOOL` → `GANHOU`
  - `DEFENDEU` em caso de derrota
  - `GOLDEN GOAL` em caso de vitória especial

## 8. Classificação de risco (por item)
- Estrutura geral (stage/HUD/targets/bola/goleiro): preservado ✅
- `GOOOL` (posição): regressão crítica 🔴
- `GOOOL` (asset): regressão crítica 🔴
- `GANHOU` (posição): regressão moderada 🟠 (precisa de confirmação visual)
- `DEFENDEU` (posição): regressão moderada 🟠 (precisa de confirmação visual)
- `GOLDEN GOAL` (posição): divergência não confirmada (risco moderado por evidência insuficiente) 🟡
- Fluxo visual (sequência e timing): não confirmado no preview por falta de evidência detalhada; presume-se preservado 🟡 (aguarda prints)

## 9. Bloqueadores de promoção (o preview pode ir para produção?)
**Bloqueado.**

Motivos objetivos (por evidência reportada):
- Overlay `GOOOL` deslocado para canto inferior esquerdo no preview (quebra layout aprovado).
- Possível troca de asset do `GOOOL` em relação ao aprovado na produção (falha de fidelidade aos assets).

## 10. Veredito final
**BLOQUEADO**

Para desbloquear, é necessário confirmar com evidência (prints/vídeo) que:
1. Os overlays `GOOOL`, `GANHOU`, `DEFENDEU`, `GOLDEN GOAL` estão centralizados como na produção (`top:50%/left:50%` + `translate(-50%, -50%)`).
2. O asset do `GOOOL` no preview corresponde exatamente ao asset aprovado (`goool.png`).

