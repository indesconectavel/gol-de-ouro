# BLOCO F — Correção 2: Overlays / Containing Block (PREVIEW ONLY)

**Data:** 2026-03-17  
**Modo:** Correção cirúrgica apenas na branch de trabalho / preview. Produção intocada.

**Referência:** BLOCO-F-FORENSE-OVERLAYS-CAMADAS-GAME-2026-03-17.md, BLOCO-F-COMPARACAO-FORENSE-TOTAL-GAME-PROD-VS-PREVIEW-2026-03-17.md

---

## 1. Diagnóstico curto

- **Sintoma:** Overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) aparecem deslocados no preview (ex.: canto inferior esquerdo) em vez do centro da tela.
- **Código:** createPortal(..., document.body) com position: fixed, top/left 50%, transform translate(-50%, -50%) — igual à referência de produção.
- **Causa provável:** Containing block de `position: fixed` alterado por algum ancestral (transform/filter/perspective) entre o nó do portal e a viewport, ou necessidade de um alvo de portal dedicado e controlado.
- **Solução aplicada:** Container dedicado `#game-overlay-root` como filho direto de `body` no HTML, sem transform/filter; portal dos overlays passou a usar esse container (com fallback para `document.body`). Assim os overlays ficam em um nó de ancestralidade mínima e sem propriedades que criem novo containing block.

---

## 2. Arquivos exatos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/index.html` | Inclusão de `<div id="game-overlay-root" aria-hidden="true"></div>` após `#root`. |
| `goldeouro-player/src/pages/GameFinal.jsx` | Portal dos 4 overlays passou de `document.body` para `document.getElementById('game-overlay-root') \|\| document.body`. |
| `goldeouro-player/src/pages/game-scene.css` | Regra para `#game-overlay-root`: pointer-events: none; position: static; transform: none; |

Nenhum outro arquivo foi modificado. Backend, lógica do jogo, autenticação e produção não foram alterados.

---

## 3. Explicação objetiva da causa encontrada

- Os overlays já eram renderizados em `document.body` com `position: fixed` e centralização por 50% + translate(-50%, -50%).
- Em princípio, filhos diretos de `body` têm como containing block a viewport, a menos que algum ancestral (incluindo `body` ou um filho de `body`) tenha `transform`, `filter`, `perspective` ou `contain: paint`.
- Não foi identificado no código da app (App.jsx, ProtectedRoute, ErrorBoundary, root) nenhum `transform`/`filter` aplicado ao root ou a wrappers que sejam ancestrais do portal quando o alvo é `body` — pois o portal em `body` coloca os nós como filhos diretos de `body`, fora da árvore do React root.
- Mesmo assim, em ambiente de preview (build, cache, extensões, ou estilos de terceiros) um ancestral do nó do portal pode ter passado a criar novo containing block, deslocando os overlays.
- **Medida defensiva adotada:** Garantir um alvo de portal **dedicado** e **controlado**: um único elemento `#game-overlay-root` no HTML, filho direto de `body`, com estilos que **não** criem containing block (`position: static`, `transform: none`, sem `filter`/`perspective`). O portal passou a usar esse elemento (com fallback para `body`), mantendo a mesma semântica de posicionamento (fixed em relação à viewport) e reduzindo a superfície de interferência de estilos externos ou da árvore da app.

---

## 4. Código completo dos trechos alterados

### 4.1 index.html

```html
  <body>
    <div id="root"></div>
    <!-- Container dedicado para overlays da /game (evita containing block por ancestrais com transform) -->
    <div id="game-overlay-root" aria-hidden="true"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
```

### 4.2 GameFinal.jsx (bloco dos overlays)

O bloco que antes era:

```jsx
{typeof document !== 'undefined' && document.body && (
  <>
    {showGoool && createPortal(<img ... />, document.body)}
    ...
  </>
)}
```

Passou a:

```jsx
{(() => {
  const overlayContainer = typeof document !== 'undefined'
    ? (document.getElementById('game-overlay-root') || document.body)
    : null;
  return overlayContainer && (
    <>
      {showGoool && createPortal(<img ... />, overlayContainer)}
      {showGanhou && createPortal(<img ... />, overlayContainer)}
      {showDefendeu && createPortal(<img ... />, overlayContainer)}
      {showGoldenGoal && createPortal(<img ... />, overlayContainer)}
    </>
  );
})()}
```

(Estilos inline de cada overlay permanecem idênticos: position: fixed, top/left 50%, transform translate(-50%, -50%), etc.)

### 4.3 game-scene.css (adição)

```css
/* Container dedicado para overlays (createPortal): sem transform/filter para não alterar containing block do position:fixed */
#game-overlay-root {
  pointer-events: none;
  position: static;
  transform: none;
}
```

---

## 5. Checklist de validação visual no preview

Validar **apenas no preview** (deployment da branch de trabalho), sem tocar em produção:

- [ ] Abrir a rota `/game` no preview (logado).
- [ ] Fazer um chute que resulte em **gol**: overlay **GOOOL** deve aparecer **centralizado** na tela (horizontal e verticalmente).
- [ ] Após o GOOOL, overlay **GANHOU** (quando aplicável) deve aparecer **centralizado**.
- [ ] Fazer um chute que resulte em **defesa**: overlay **DEFENDEU** deve aparecer **centralizado**.
- [ ] Se houver cenário de **Gol de Ouro**, overlay **GOLDEN GOAL** deve aparecer **centralizado**.
- [ ] Redimensionar a janela e repetir: overlays continuam centralizados na viewport.
- [ ] Palco (stage 1920×1080) continua centralizado (Correção 1 já aplicada); HUD e botões inalterados.

Se todos os itens forem atendidos, a Correção 2 está validada no preview.

---

## 6. Regra de governança

- **Produção:** Intocada; nenhuma alteração no deployment Current.
- **Preview:** Único ambiente onde esta correção é aplicada e validada.

---

*Documento gerado na fase de correção cirúrgica do BLOCO F (overlays / containing block).*
