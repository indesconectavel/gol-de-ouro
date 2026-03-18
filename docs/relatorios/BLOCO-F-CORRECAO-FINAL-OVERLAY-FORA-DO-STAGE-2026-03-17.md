# BLOCO F — Correção final: overlay fora do stage (/game) — PREVIEW ONLY

**Data:** 2026-03-17  
**Modo:** Correção cirúrgica apenas na branch de trabalho. Produção intocada.

---

## 1. Problema encontrado

- Os overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) continuavam **deslocados para a direita** mesmo após a correção dos keyframes (translate(-50%, -50%) nos keyframes).
- Isso indica que **position: fixed** não estava se comportando como relativo à **viewport**, e sim a um **containing block** criado por um ancestral com `transform`, `filter` ou `perspective`.
- **Causa provável:** O portal usava **fallback para `document.body`**. Quando o destino era `body`, os overlays eram filhos diretos de `body`; em tese isso deveria ser viewport-relative. Porém, em builds ou ambientes onde `#game-overlay-root` não existia (ou não era encontrado), o fallback para `body` podia colocar os nós em um contexto onde outro código ou extensão altera `body` ou um irmão de `#root`. Além disso, **qualquer** uso de `document.body` como alvo mistura os overlays com a árvore em que o React monta `#root`; se houver qualquer wrapper com transform no futuro, o problema volta. A solução definitiva é **nunca** usar `body` como alvo e usar **somente** um nó dedicado, filho direto de `body` e fora de `#root`, garantido pelo HTML e pelo CSS.

---

## 2. Onde estava o erro estrutural

- **GameFinal.jsx:** O portal usava `document.getElementById('game-overlay-root') || document.body`. O fallback para `document.body` permitia que, na ausência de `#game-overlay-root`, os overlays fossem montados em `body`. Em alguns builds (ex.: preview sem o index.html atualizado), o elemento `#game-overlay-root` poderia não existir, e então o portal iria para `body`. Além disso, do ponto de vista de “desacoplamento total”, usar **apenas** `#game-overlay-root` elimina qualquer ambiguidade e garante que os overlays nunca dependam da árvore do React em `#root`.
- **index.html:** Já estava correto: `<div id="game-overlay-root">` é **irmão** de `#root`, ambos filhos diretos de `<body>`. Não havia erro estrutural no HTML.
- **CSS:** O container `#game-overlay-root` já tinha `position: static` e `transform: none`. Foram reforçadas as regras com `filter: none`, `will-change: auto` e `contain: none` para garantir que o container **nunca** crie um novo containing block para os filhos com `position: fixed`.

---

## 3. Correção aplicada

1. **GameFinal.jsx**
   - Removido o fallback para `document.body`.
   - O portal usa **somente** `document.getElementById('game-overlay-root')`.
   - Se o elemento não existir, os overlays não são renderizados (`return overlayContainer ? (...) : null`).

2. **game-scene.css**
   - Em `#game-overlay-root` foram adicionados `filter: none`, `will-change: auto` e `contain: none`, e o comentário foi atualizado para deixar explícito que o container é filho direto de body e que não deve criar containing block para `position: fixed`.

3. **index.html**
   - Nenhuma alteração necessária; a estrutura já estava correta.

---

## 4. Código alterado

### 4.1 GameFinal.jsx

**Antes:**
```jsx
{/* Overlays - Portal para container dedicado (evita containing block por ancestrais com transform) */}
{(() => {
  const overlayContainer = typeof document !== 'undefined'
    ? (document.getElementById('game-overlay-root') || document.body)
    : null;
  return overlayContainer && (
```

**Depois:**
```jsx
{/* Overlays - Portal SEMPRE em #game-overlay-root (filho direto de body, fora de #root e de qualquer transform) */}
{(() => {
  const overlayContainer = typeof document !== 'undefined'
    ? document.getElementById('game-overlay-root')
    : null;
  return overlayContainer ? (
```

E ao final do bloco, de `);` para `) : null;` no fechamento do return (para retornar explicitamente `null` quando não houver container).

### 4.2 game-scene.css

**Antes:**
```css
/* Container dedicado para overlays (createPortal): sem transform/filter para não alterar containing block do position:fixed */
#game-overlay-root {
  pointer-events: none;
  position: static;
  transform: none;
}
```

**Depois:**
```css
/* Container dedicado para overlays: filho direto de body, fora de #root. Sem transform/filter/perspective para que position:fixed dos filhos seja relativo à viewport */
#game-overlay-root {
  pointer-events: none;
  position: static;
  transform: none;
  filter: none;
  will-change: auto;
  contain: none;
}
```

### 4.3 index.html

**Nenhuma alteração.** Estrutura atual (válida):

```html
<body>
  <div id="root"></div>
  <!-- Container dedicado para overlays da /game (evita containing block por ancestrais com transform) -->
  <div id="game-overlay-root" aria-hidden="true"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
```

---

## 5. Por que isso resolve definitivamente

- **Único destino do portal:** Os overlays são montados **apenas** em `#game-overlay-root`. Esse nó existe no **index.html** como filho direto de `body` e **irmão** de `#root`, portanto **fora** da árvore do React e de qualquer container com transform (como `.game-scale`).
- **Containing block da viewport:** O único ancestral de `#game-overlay-root` é `body`. Com o CSS explícito (`position: static`, `transform: none`, `filter: none`, `will-change: auto`, `contain: none`), o container não cria um novo containing block. Assim, os filhos com `position: fixed` ficam **sempre** relativos à **viewport**.
- **Sem fallback para body:** Ao remover o fallback para `document.body`, evita-se qualquer cenário em que os overlays sejam montados em um alvo que não seja o container dedicado. Em builds onde `index.html` inclui `#game-overlay-root`, o comportamento é garantido; onde não incluir, os overlays simplesmente não aparecem em vez de aparecerem em um contexto potencialmente errado.
- **Centralização:** Com `position: fixed` relativo à viewport e `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)` (e keyframes que preservam esse translate), os overlays permanecem **centralizados na tela**, independentemente do scale do jogo ou de outros elementos da página.

---

## 6. Checklist de validação

- [ ] **index.html:** Confirmar que existe `<div id="game-overlay-root">` como filho direto de `body`, após `#root`.
- [ ] **Build:** `cd goldeouro-player && npm run build` — sucesso.
- [ ] **Preview:** Abrir `/game` no preview (logado), em aba anônima e com hard reload (Ctrl+Shift+R).
- [ ] **Gol:** Dar um chute que resulte em gol; overlay **GOOOL** deve aparecer **exatamente no centro da tela** (horizontal e vertical).
- [ ] **Ganhou:** Após o GOOOL, overlay **GANHOU** deve permanecer **centralizado**.
- [ ] **Defesa:** Chute que resulte em defesa; overlay **DEFENDEU** **centralizado**.
- [ ] **Gol de Ouro:** Se testar, overlay **GOLDEN GOAL** **centralizado**.
- [ ] **Redimensionar:** Redimensionar a janela; overlays continuam centralizados na viewport, independente do tamanho do palco.
- [ ] **Produção:** Nenhuma alteração no deployment Current.

---

*Documento gerado em 2026-03-17. Correção aplicada apenas no preview; produção intocada.*
