# BLOCO F — FORENSE DO STAGE / SCALE / VIEWPORT

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, deploy, banco ou assets. Apenas auditoria comparativa e diagnóstico técnico.

**Referências de código analisadas:**
- `goldeouro-player/src/App.jsx` (rota `/game` → `GameFinal`)
- `goldeouro-player/src/pages/GameFinal.jsx` (componente atual / preview)
- `goldeouro-player/src/pages/GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx` (referência visual validada)
- `goldeouro-player/src/game/layoutConfig.js`
- `goldeouro-player/src/pages/game-scene.css`, `game-shoot.css`
- `docs/relatorios/COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW-2026-03-17.md`

---

## 1. Resumo executivo

A rota `/game` é renderizada pelo componente **GameFinal** (arquivo `GameFinal.jsx`), que desenha um palco fixo **1920×1080** escalado para caber na viewport. A auditoria identificou:

- **Estrutura real no preview:** `game-viewport` (apenas estilo inline) → `game-scale` (transform scale + 1920×1080) → `game-stage` (1920×1080). Não há uso de `.game-page`, `.game-stage-wrap` nem `#stage-root` no DOM.
- **CSS existente** (game-scene.css, game-shoot.css) define `.game-page`, `.game-stage-wrap`, `#stage-root` e variáveis `--pf-w`, `--pf-h`, `--pf-ox`, `--pf-oy` para geometria 16:9 e centralização, mas **nenhum seletor para `.game-viewport` ou `.game-scale`**.
- **Consequência:** O bloco escalado (1920×1080) não é centralizado no viewport: o container `.game-viewport` não possui `display: flex`, `align-items: center`, `justify-content: center` (nem em CSS nem em inline). O palco fica ancorado no canto superior esquerdo; o `transform-origin: center center` apenas faz a escala pelo centro do próprio elemento, sem deslocar o conjunto para o centro da tela.
- **Diferença vista entre backup “visual validado” e atual:** No backup, `.game-viewport` não tem estilos inline; no atual tem `width: 100vw`, `height: 100dvh`, `overflow: hidden`. Em ambos os casos **não há regra CSS que centralize o conteúdo** de `.game-viewport`, portanto a causa raiz da regressão (palco quebrado, escala incorreta, conteúdo fora do centro) é a **ausência de centralização do stage escalado** no viewport, agravada pela possível divergência de altura (`100dvh` vs `100vh`) e pela desconexão entre a árvore DOM usada (viewport/scale/stage) e a árvore para a qual o CSS foi escrito (game-page/stage-wrap/stage-root).

---

## 2. Componente oficial da rota /game

- **Rota:** `/game` (definida em `goldeouro-player/src/App.jsx`).
- **Componente carregado:** `GameFinal` (import direto, não lazy).
- **Arquivo:** `goldeouro-player/src/pages/GameFinal.jsx`.
- **Imports de estilo:** `./game-scene.css`, `./game-shoot.css` (não importa `game-pixel.css` nem `game-page.css`).
- **Fonte de verdade de coordenadas:** `../game/layoutConfig.js` — `STAGE.WIDTH = 1920`, `STAGE.HEIGHT = 1080`; posições de bola, goleiro, targets e overlays em pixels fixos.

---

## 3. Estrutura do viewport em produção

A “produção” é tomada como referência estável. Como não há acesso em tempo real ao DOM de produção, a referência de estrutura é o **backup visual validado** (`GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx`) e o relatório de comparação forense já existente.

**Estrutura referenciada (backup / produção esperada):**

- Raiz do return: `<div className="game-viewport">` **sem estilos inline**.
- Filho: `<div className="game-scale" style={gameScaleStyle}>` com:
  - `transform: scale(${gameScale})`
  - `transformOrigin: 'center center'`
  - `width: stageWidth` (1920)
  - `height: stageHeight` (1080)
  - `position: 'relative'`
- Filho do `game-scale`: `<div className="game-stage" style={{ width, height, position, overflow, background }}>` com 1920×1080.

Ou seja, em produção a árvore é a mesma: **game-viewport → game-scale → game-stage**. Não há no código do backup uso de `.game-page`, `.game-stage-wrap` ou `#stage-root`. O CSS carregado (game-scene.css) define regras para `.game-page` e `.game-stage-wrap` (flex, altura com `--vh`), mas essas classes **não aparecem no JSX** do GameFinal. Conclusão: em produção, **não há regra CSS aplicada a `.game-viewport`** nos arquivos auditados; qualquer centralização estável em produção dependeria de (1) regra global/outro arquivo não encontrado, ou (2) build/deploy com versão anterior que usasse outra estrutura.

---

## 4. Estrutura do viewport no preview

No **preview** (branch `feature/bloco-e-gameplay-certified`, arquivo `GameFinal.jsx` atual):

- Raiz:  
  `<div className="game-viewport" style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>`
- Filho:  
  `<div className="game-scale" style={gameScaleStyle}>` (mesmo `gameScaleStyle` que no backup).
- Filho do `game-scale`:  
  `<div className="game-stage" style={{ width: stageWidth, height: stageHeight, position: 'relative', overflow: 'hidden', background: '#0b3a1d' }}>`.

**Árvore DOM real no preview:**

```
div.game-viewport (inline: width 100vw, height 100dvh, overflow hidden)
  └─ div.game-scale (inline: transform scale(n), transform-origin center center, width 1920, height 1080, position relative)
       └─ div.game-stage (inline: width 1920, height 1080, position relative, overflow hidden, background #0b3a1d)
            ├─ img.scene-bg (background do campo)
            ├─ div.hud-header
            ├─ botões gs-zone (TL, TR, C, BL, BR)
            ├─ img.gs-goalie
            ├─ img.gs-ball
            ├─ div.hud-bottom-left
            └─ div.hud-bottom-right
```

Overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) são renderizados via `createPortal(..., document.body)`, fora da árvore do viewport.

---

## 5. Diferenças exatas encontradas

| Aspecto | Produção (referência / backup) | Preview (atual) |
|--------|---------------------------------|------------------|
| Classe da raiz | `game-viewport` | `game-viewport` |
| Estilo inline na raiz | Nenhum | `width: '100vw', height: '100dvh', overflow: 'hidden'` |
| Uso de `100dvh` | Não (sem inline) | Sim |
| Estrutura game-scale / game-stage | Idêntica | Idêntica |
| Uso de .game-page / .game-stage-wrap / #stage-root | Não no JSX | Não no JSX |
| Regras CSS para .game-viewport / .game-scale | Nenhuma em nenhum arquivo auditado | Nenhuma |

Conclusão: a **única diferença de código** na árvore do viewport entre backup e atual é o **estilo inline no `.game-viewport`** (100vw, 100dvh, overflow hidden). Não há em nenhum CSS auditado regra que centralize o conteúdo de `.game-viewport`; portanto, em ambos os casos o bloco 1920×1080 escalado tenderia a ficar alinhado ao canto superior esquerdo, a menos que produção use outro bundle/CSS. No preview, o uso de `100dvh` pode ainda alterar a altura útil da viewport (barra de endereço móvel) em relação a `100vh`, afetando o cálculo de escala e a sensação de “layout 1920×1080 não respeitado” ou “responsividade comprometida”.

---

## 6. Auditoria do cálculo de scale

- **Onde:** `GameFinal.jsx`, função `calculateScale` (useCallback).
- **Fórmula:**  
  `stageWidth = STAGE?.WIDTH || 1920`  
  `stageHeight = STAGE?.HEIGHT || 1080`  
  `scaleX = window.innerWidth / stageWidth`  
  `scaleY = window.innerHeight / stageHeight`  
  `return Math.min(scaleX, scaleY) || 1`
- **Aplicação:** O valor é guardado em estado `gameScale` e aplicado em `gameScaleStyle.transform = scale(${gameScale})`. O elemento que recebe o scale é o `div.game-scale` com dimensões fixas 1920×1080.
- **Resize:** Um listener `resize` com debounce (200 ms) recalcula e atualiza `gameScale`; a escala é estável e proporcional à viewport.
- **Diferença preview vs produção:** Nenhuma no cálculo em si; produção e preview usam o mesmo `calculateScale`. Possível divergência indireta: se no preview a altura do viewport for `100dvh` e o navegador calcular `window.innerHeight` de forma diferente da altura real do container (ex.: em mobile), o scale pode ficar inconsistente com o espaço visível.

---

## 7. Auditoria de transform / transform-origin / centralização

- **Onde a escala é aplicada:** No `div.game-scale` via estilo inline:  
  `transform: scale(${gameScale})`, `transformOrigin: 'center center'`, `width: 1920`, `height: 1080`, `position: 'relative'`.
- **Comportamento:** O `transform-origin: center center` faz o scaling pelo centro **do próprio elemento** (o retângulo 1920×1080). Isso não move o elemento para o centro da tela; o elemento continua posicionado pelo fluxo normal (block), ou seja, no canto superior esquerdo do pai.
- **Pai (.game-viewport):** Não tem `display: flex`, `align-items: center`, `justify-content: center` em nenhum arquivo CSS auditado nem no estilo inline do backup. No atual, o inline é apenas `width: 100vw`, `height: 100dvh`, `overflow: hidden` — ainda sem centralização.
- **Conclusão:** O palco 1920×1080 escalado **não está centralizado** no viewport. Para centralizar seria necessário, por exemplo: (1) no `.game-viewport`: `display: flex; align-items: center; justify-content: center;` e o filho com `transform: scale(...)`; ou (2) `.game-scale` com `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(...)` (e o viewport com `position: relative`). Hoje isso não existe nem em CSS nem em inline.

---

## 8. Possíveis causas raiz

1. **Ausência de centralização do stage no viewport**  
   `.game-viewport` não centraliza o `.game-scale`. O bloco 1920×1080 escalado fica ancorado no canto superior esquerdo → “conteúdo fora do centro”, “palco quebrado”, “layout 1920×1080 não respeitado” na percepção do usuário.

2. **Divergência entre DOM e CSS**  
   O CSS (game-scene.css, game-pixel.css) foi escrito para uma árvore com `.game-page` > `.game-stage-wrap` (com flex e, em game-pixel, `align-items: center; justify-content: center`) e `#stage-root` ou `.game-stage`. O GameFinal não usa essas classes/ids, então regras de centralização e geometria 16:9 (`--pf-*`) **não se aplicam** ao DOM real.

3. **Uso de `100dvh` no preview**  
   No atual, o viewport usa `height: 100dvh`. Em navegadores que diferenciam `dvh` de `vh`, a altura pode mudar (ex.: barra de endereço), alterando a relação entre a área visível e o cálculo de scale (baseado em `window.innerHeight`), podendo gerar letterbox/pillarbox ou escala inconsistente.

4. **Nenhuma regra para `.game-viewport` ou `.game-scale`**  
   Busca em todos os `.css` do player não encontrou nenhum seletor para essas classes. A estrutura viewport → scale → stage depende exclusivamente de estilos inline; qualquer expectativa de centralização ou comportamento “fixo” 1920×1080 depende de código que hoje não existe.

---

## 9. Classificação de severidade

| Item | Severidade | Descrição |
|------|------------|------------|
| Palco não centralizado | **Crítica** | O stage escalado não está centralizado no viewport; causa direta da regressão visual. |
| DOM sem correspondência no CSS | **Alta** | Uso de .game-viewport/.game-scale sem regras; .game-page/.game-stage-wrap/#stage-root não usados no JSX. |
| Uso de 100dvh sem consistência com scale | **Média** | Pode gerar diferença de altura e escala entre ambientes ou dispositivos. |
| Overlays (createPortal no body) | **Conforme relatório anterior** | Já documentado (overlay no canto inferior esquerdo no preview); fora do escopo desta auditoria de stage/scale/viewport. |

---

## 10. Riscos para overlays e responsividade

- **Overlays:** São renderizados em `document.body` com `position: fixed` e `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`. Teoricamente independem do viewport do jogo; se no preview aparecem deslocados (ex.: canto inferior esquerdo), a causa pode ser outro container com transform/stacking context ou viewport meta, não a árvore game-viewport/game-scale (conforme relatório COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW).
- **Responsividade:** O scale é recalculado no `resize`; a base lógica permanece 1920×1080. O risco é a falta de centralização e o possível desencontro entre `100dvh` e `window.innerHeight` em alguns dispositivos, dando impressão de “responsividade comprometida” ou “escala incorreta”.

---

## 11. Correção recomendada (conceitual, sem aplicar)

- **Centralizar o stage no viewport:**  
  Garantir que o elemento que contém o palco escalado (o `div.game-scale`) fique centralizado no viewport. Por exemplo:  
  - No container raiz da `/game` (ou no próprio `.game-viewport`):  
    `display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: hidden;`  
  - Manter no `.game-scale` o `transform: scale(...)` e `transform-origin: center center`, sem alterar a base 1920×1080.
- **Unificar estrutura e CSS:**  
  Ou (a) passar a usar no JSX a árvore que o CSS já descreve (`.game-page` > `.game-stage-wrap` > `.game-stage` ou `#stage-root`) e garantir que o scale 1920×1080 seja aplicado no nível correto com centralização; ou (b) adicionar regras explícitas para `.game-viewport` (e se necessário `.game-scale`) para centralização e dimensão, sem depender de classes não utilizadas.
- **Altura do viewport:**  
  Avaliar se manter `100dvh` é desejado (melhor em mobile) ou se voltar a não forçar altura no viewport (como no backup) e deixar o body/root controlar; em qualquer caso, alinhar a lógica de scale (e eventualmente variável `--vh`) à altura realmente usada pelo container.
- **Não alterar:** layoutConfig.js (STAGE 1920×1080), posições em pixels, createPortal dos overlays no body; apenas corrigir container/viewport e centralização.

---

## 12. Veredito final: APROVADO ou BLOQUEADO

**BLOQUEADO**

O estado atual do preview (branch feature/bloco-e-gameplay-certified) apresenta falha de arquitetura de renderização do palco da rota `/game`: o stage 1920×1080 escalado não está centralizado no viewport e a árvore DOM utilizada (game-viewport → game-scale → game-stage) não possui regras CSS correspondentes, enquanto o CSS existente foi escrito para outra árvore (game-page, game-stage-wrap, stage-root) que não é usada. Isso explica de forma consistente as regressões reportadas (palco quebrado, escala incorreta, layout 1920×1080 não respeitado, conteúdo fora do centro, responsividade comprometida). Até que a centralização e a coerência entre DOM e CSS sejam corrigidas e validadas visualmente, o preview permanece **bloqueado** para promoção à produção.

---

## Anexo — Lista objetiva e sequência recomendada

- **Causas mais prováveis:**  
  1) Falta de centralização do `.game-scale` dentro do `.game-viewport`.  
  2) Inexistência de regras CSS para `.game-viewport` e `.game-scale`.  
  3) Divergência entre a árvore DOM (viewport/scale/stage) e a árvore para a qual o CSS foi escrito (game-page/stage-wrap/stage-root).  
  4) Possível efeito colateral do uso de `100dvh` na altura do viewport em relação ao cálculo de scale.

- **Elemento estrutural mais suspeito:**  
  **`div.game-viewport`** — é o container raiz do palco e não possui nenhuma regra de layout (flex/grid/centralização) nem no CSS nem no backup; no atual recebe apenas inline de tamanho e overflow, insuficiente para centralizar o filho.

- **Hipótese principal da regressão:**  
  O palco é desenhado em um bloco 1920×1080 escalado por CSS `transform: scale()`, mas o container que o envolve nunca foi configurado para centralizar esse bloco na tela; em algum ambiente/build anterior pode ter havido outra camada ou regra que compensava isso, e no preview atual essa compensação não existe.

- **Sequência recomendada de correção (conceitual):**  
  1) Adicionar ao container raiz do `/game` (ou definir em CSS para `.game-viewport`) layout flex com centralização (align-items: center; justify-content: center) e dimensão 100% da viewport.  
  2) Manter o `div.game-scale` com width/height 1920/1080 e transform scale; garantir que seja o único filho direto do viewport (ou que a centralização se aplique a ele).  
  3) Revisar uso de `100dvh` vs `100vh` e consistência com `window.innerHeight` no cálculo de scale.  
  4) Validar visualmente em preview: palco centralizado, proporção 16:9 respeitada, overlays no centro (já tratados no relatório de overlays).  
  5) Opcional: alinhar a árvore DOM às regras existentes em game-scene/game-pixel (game-page, stage-wrap) ou documentar e manter apenas viewport/scale com regras próprias.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, deploy, banco, env ou assets.*
