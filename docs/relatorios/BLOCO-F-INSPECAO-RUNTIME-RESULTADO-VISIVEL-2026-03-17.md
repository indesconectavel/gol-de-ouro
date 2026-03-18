# BLOCO F — Inspeção runtime do elemento visível de resultado (/game)

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código.  
**Objetivo:** Identificar o elemento EXATO que o usuário vê quando aparece DEFENDEU / GOOOL / GANHOU.

---

## Inspeção real em runtime (obrigatória para confirmar)

A inspeção automatizada no browser (MCP) não teve acesso à página /game logada nem à execução de script na página para obter `getComputedStyle`. Para obter dados reais de runtime, use o **protocolo abaixo** no preview quando o overlay estiver visível.

### Protocolo de inspeção manual

1. Abra o **preview** da /game, faça login e dispare um chute que resulte em **DEFENDEU** (ou GOOOL/GANHOU).
2. Com o overlay visível na tela, abra **DevTools** (F12) → aba **Console**.
3. Cole e execute o script abaixo (uma vez por overlay visível):

```javascript
(function() {
  const sel = 'img.gs-defendeu, img.gs-goool, img.gs-ganhou, img.gs-golden-goal';
  const imgs = document.querySelectorAll(sel);
  if (!imgs.length) {
    console.warn('Nenhum overlay de resultado encontrado no DOM.');
    return;
  }
  imgs.forEach((el, i) => {
    const c = getComputedStyle(el);
    const parentChain = [];
    let p = el.parentElement;
    while (p && parentChain.length < 15) {
      parentChain.push(p.tagName + (p.id ? '#' + p.id : '') + (p.className ? '.' + p.className.split(' ').join('.') : ''));
      p = p.parentElement;
    }
    console.log('=== Overlay #' + (i+1) + ' ===');
    console.log('tag:', el.tagName);
    console.log('className:', el.className);
    console.log('src:', el.currentSrc || el.src);
    console.log('parent chain:', parentChain.join(' > '));
    console.log('in #game-overlay-root:', !!el.closest('#game-overlay-root'));
    console.log('in .game-stage:', !!el.closest('.game-stage'));
    console.log('computed position:', c.position);
    console.log('computed top/left/right/bottom:', c.top, c.left, c.right, c.bottom);
    console.log('computed transform:', c.transform);
    console.log('computed animation-name:', c.animationName);
    console.log('computed z-index:', c.zIndex);
    console.log('computed width/height:', c.width, c.height);
  });
  console.log('Total overlays encontrados:', imgs.length);
})();
```

4. Copie a saída do Console e preencha as seções 1–7 abaixo com os valores **reais**. Até lá, as respostas são **inferidas a partir do código**.

---

## 1. Elemento encontrado (inferência a partir do código)

- **Tag:** `img`
- **className:** `gs-defendeu` | `gs-goool` | `gs-ganhou` | `gs-golden-goal` (conforme o resultado exibido)
- **Única origem no código:** GameFinal.jsx, createPortal( `<img src={…} className="gs-defendeu" style={{…}} />`, overlayContainer ), com `overlayContainer = document.getElementById('game-overlay-root')`.

**Após inspeção real:** substituir pela saída do Console (tag, className, ref do elemento).

---

## 2. Src real do asset (inferência)

- **Código:** GameFinal importa `defendeuImg from '../assets/defendeu.png'` e usa `src={defendeuImg}`. Em build Vite, o src final é tipicamente um path absoluto com hash (ex.: `/assets/defendeu-xxxx.png`).
- **Asset aprovado:** `defendeu.png` (e equivalentemente goool.png, ganhou.png, golden-goal.png). O nome do arquivo na URL pode ter hash; o importante é que o recurso seja o da pasta `src/assets/`.

**Após inspeção real:** conferir `el.currentSrc || el.src` no Console e confirmar se termina em `defendeu` (e hash) ou outro nome.

---

## 3. Parent chain real (inferência)

- **Código:** createPortal renderiza o `<img>` como filho **direto** do nó passado como segundo argumento, que é `overlayContainer` = `document.getElementById('game-overlay-root')`. No index.html, `#game-overlay-root` é irmão de `#root`, filho direto de `body`.
- **Cadeia esperada:**  
  `img` → `div#game-overlay-root` → `body` → `html`.

**Após inspeção real:** conferir a saída “parent chain” do script. Se aparecer algo como `… > div.game-scale > div.game-stage > …`, o elemento visível **não** é o do portal e há outro caminho de renderização (bug).

---

## 4. Computed styles (inferência)

- **Inline no GameFinal:**  
  `position: 'fixed'`, `top: '50%'`, `left: '50%'`, `transform: 'translate(-50%, -50%)'`, `zIndex: 10000` (ou 10001/10002 para ganhou/golden), `width`/`height` em px (OVERLAYS.SIZE), `animation: 'pop 0.8s …'` (defendeu) ou `gooolPop`/`ganhouPop`.
- **CSS em game-shoot.css:**  
  `.gs-defendeu { position: absolute; inset: 0; margin: auto; width: 200px; height: 200px; z-index: 8; animation: pop .6s … }`. A especificidade de estilo **inline** é maior que classe, então o esperado é: **position: fixed**, **top: 50%**, **left: 50%**, **transform: translate(-50%, -50%)** (ou o valor do keyframe no momento da animação).
- **Se o elemento estiver dentro de .game-stage:**  
  game-scene.css tem `.game-stage .gs-golden-goal` (escopado); para .gs-defendeu/.gs-goool/.gs-ganhou não há regra escopada ao stage neste arquivo; as regras em game-shoot.css são globais (`.gs-defendeu` etc.) e definem `position: absolute`.

**Após inspeção real:** anotar os valores de `position`, `top`, `left`, `transform`, `animation-name`, `z-index`, `width`, `height`. Se **position** for `absolute` em vez de `fixed`, o elemento está sendo controlado pelo CSS de game-shoot.css (ou está dentro de um container que não é #game-overlay-root).

---

## 5. Está no overlay root ou no stage?

- **Inferência:** O único código que desenha overlays de resultado na /game é o createPortal para `#game-overlay-root`. Portanto o elemento visível **deveria** estar em `#game-overlay-root` e **não** dentro de `.game-stage`.
- **Critério de diagnóstico:**  
  - `el.closest('#game-overlay-root')` → truthy e `el.closest('.game-stage')` → falsy: elemento do portal; problema então é containing block, keyframes ou outra regra CSS aplicada a esse mesmo elemento.  
  - `el.closest('.game-stage')` → truthy: elemento dentro do stage (não deveria existir na /game); indica outro componente ou markup legado.

**Após inspeção real:** preencher com true/false para “dentro de #game-overlay-root” e “dentro de .game-stage”.

---

## 6. Existe duplicidade?

- **Inferência (código):** Não há segundo lugar no GameFinal que renderize o mesmo overlay dentro do stage. Não há uso de GameShoot/GameShootSimple/GameShootFallback na rota /game (App.jsx → GameFinal). Portanto **não** se espera mais de um `<img>` de resultado visível ao mesmo tempo para o mesmo tipo (ex.: um DEFENDEU).
- **Critério:** O script acima conta todos os `img.gs-defendeu` (e demais classes). Se **Total overlays encontrados** > 1 para o mesmo tipo de resultado, há duplicidade.

**Após inspeção real:** indicar o número de elementos encontrados e se há mais de um visível para o mesmo resultado.

---

## 7. Arquivo/CSS responsável

- **Posicionamento (inline):** GameFinal.jsx, objeto `style` do `<img>` (position, top, left, transform).
- **Animação:** GameFinal.jsx (animation no inline) + game-shoot.css (keyframes `pop`, `gooolPop`, `ganhouPop`).
- **Regras que podem competir:**  
  - **game-shoot.css:** `.gs-defendeu`, `.gs-goool`, `.gs-ganhou` com `position: absolute; inset: 0; margin: auto`. Se por qualquer motivo o inline não aplicar (ex.: build antigo, hidração), essas regras fazem o elemento ser posicionado como “bloco central” no **containing block do pai**. Se o pai for `#game-overlay-root` (position: static), o containing block é o viewport, mas “inset:0; margin:auto” centraliza dentro do viewport; se o pai tiver tamanho/posição diferente, o resultado pode ser deslocado.  
  - **game-scene.css:** `.game-stage .gs-golden-goal` já está escopado ao stage; não se aplica ao portal.

**Regra que pode estar “empurrando para a direita” (inferência):**

1. **Containing block:** Se o elemento estiver sob um ancestral com `transform`/`filter`/`perspective`, `position: fixed` deixa de ser relativo à viewport e passa a ser relativo a esse ancestral; dependendo do layout, o overlay pode aparecer deslocado (ex.: à direita).  
2. **Keyframes sem translate(-50%,-50%):** Se em algum build ou CSS carregado os keyframes `pop`/`gooolPop`/`ganhouPop` ainda forem só `scale(...)` sem `translate(-50%,-50%)`, o centro do elemento desloca durante a animação.  
3. **Fallback para body:** Se o portal estiver usando `document.body` como destino (código antigo), um wrapper com transform em volta de #root pode criar containing block e deslocar o overlay.

---

## 8. Correção mínima recomendada (conceitual, sem aplicar)

- **Se a inspeção real mostrar o elemento no portal (#game-overlay-root) com position: fixed e ainda assim deslocado:**  
  Verificar no mesmo ambiente (preview) se `#game-overlay-root` ou algum ancestral até `body` tem `transform`, `filter` ou `perspective` (via Console: `getComputedStyle(document.getElementById('game-overlay-root')).transform` etc.). Garantir que o portal use **apenas** `#game-overlay-root` (sem fallback para body) e que game-scene.css mantenha `#game-overlay-root` sem transform/filter. Revisar keyframes em game-shoot.css para garantir `translate(-50%,-50%)` em todos os passos.

- **Se a inspeção real mostrar o elemento dentro de .game-stage:**  
  Há renderização fora do portal (legado ou outro componente). Solução: garantir que a /game use só GameFinal e que o único desenho de overlays de resultado seja via createPortal para `#game-overlay-root`; remover ou desativar qualquer markup/componente que desenhe .gs-defendeu/.gs-goool/.gs-ganhou dentro do stage.

- **Se houver mais de um elemento de resultado no DOM:**  
  Identificar a segunda origem no código (ex.: outro componente ou condição) e desativar/remover a camada duplicada.

---

## Respostas objetivas (inferência até inspeção real)

| Pergunta | Resposta (código) |
|----------|-------------------|
| O elemento visível é o do portal? | **Sim, esperado.** Única origem é createPortal para #game-overlay-root. Confirmar em runtime com o script. |
| Ou é outro elemento? | Só seria “outro” se existir markup/componente que desenhe o mesmo class dentro de .game-stage ou em outro nó; no código atual da /game não há. |
| O src é o asset aprovado? | **Sim.** GameFinal usa defendeu.png, goool.png, ganhou.png, golden-goal.png (imports de `../assets/`). Em runtime, o src pode ter hash; o recurso deve ser o desses arquivos. |
| Qual regra está empurrando para a direita? | **(1)** Containing block: ancestral com transform/filter faz fixed ser relativo a ele. **(2)** Keyframes sem translate(-50%,-50%) deslocam o centro durante a animação. **(3)** Regras .gs-* em game-shoot.css com position:absolute + inset:0+margin:auto só “empurram” se o inline não aplicar ou se o containing block do pai não for a viewport. |

**Após executar o protocolo de inspeção no preview:** preencher este documento com os valores reais (parent chain, computed position/transform, se está no overlay-root ou no stage, total de elementos) e atualizar as respostas acima com base nos dados coletados.

---

*Documento gerado em 2026-03-17. READ-ONLY. Nenhuma alteração de código aplicada.*
