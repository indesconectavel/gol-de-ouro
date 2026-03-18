# BLOCO F — Validação final absoluta do sistema de resultado (/game)

**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhum arquivo alterado. Apenas auditoria, inspeção e prova.

---

## 1. Diagnóstico final (curto)

O sistema de overlay de resultado da `/game` está **tecnicamente correto** no código: o portal usa **exclusivamente** `#game-overlay-root` (sem fallback para `document.body`), cada overlay é uma única `<img>` com estilo inline `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`, e o container `#game-overlay-root` tem CSS que **não** cria containing block (`position: static`, `transform: none`, `filter: none`, `will-change: auto`, `contain: none`). A árvore DOM coloca o overlay **fora** de `#root` e **fora** de `.game-stage`, portanto **não** sofre o `transform: scale()` do `.game-scale`. Os assets usados são os do contrato da produção (gol_normal, ganhou_5/ganhou_100, defendeu, gol_de_ouro; goool mantido no bundle). **Nenhum bug de código ou containing block foi encontrado.** Qualquer dúvida visual restante (“overlay parecer alinhado ao palco”) só pode ser confirmada ou descartada por inspeção em runtime no browser (computed styles, boundingClientRect do overlay vs viewport).

---

## 2. Estrutura real do overlay

### 2.1 Estilo exato aplicado ao overlay (GameFinal.jsx)

Cada overlay (GOOOL, GANHOU, DEFENDEU, GOL DE OURO) é uma **única** `<img>` sem wrapper, com estilo inline idêntico (exceto dimensões e animação):

| Propriedade   | Valor |
|---------------|--------|
| position      | `'fixed'` |
| top           | `'50%'` |
| left          | `'50%'` |
| transform     | `'translate(-50%, -50%)'` |
| zIndex        | 10000 (DEFENDEU/GOOOL), 10001 (GANHOU), 10002 (GOL DE OURO) |
| pointerEvents | `'none'` |
| width/height  | Conforme `OVERLAYS.SIZE.*` em px |
| objectFit     | `'contain'` |
| animation     | `gooolPop` / `ganhouPop` / `pop` conforme o tipo |
| display       | `'block'` |
| visibility    | `'visible'` |
| opacity       | `1` |

Não há uso de `inset` no inline. Não há `div` envolvendo a imagem: o primeiro argumento de `createPortal` é diretamente a `<img>`.

### 2.2 Portal e destino

- **Uso:** `createPortal(<img ... />, overlayContainer)` com `overlayContainer = document.getElementById('game-overlay-root')`.
- **Fallback para document.body:** **Ausente.** Código exato (linhas 764–766):  
  `const overlayContainer = typeof document !== 'undefined' ? document.getElementById('game-overlay-root') : null;`  
  `return overlayContainer ? (...) : null;`  
  Não há `|| document.body`. As únicas referências a `document.body` no arquivo são `setAttribute('data-page', 'game')` e `removeAttribute('data-page', 'game')` (linhas 249–250 e 311–312), não relacionadas ao portal.
- **Renderização dentro de .game-stage:** **Nenhuma.** O overlay é renderizado no nó `#game-overlay-root`, que no HTML é **irmão** de `#root`, não filho do stage.

### 2.3 Múltiplos overlays simultâneos

Não há dois overlays de resultado visíveis ao mesmo tempo: a lógica de estado (`showGoool`, `showGanhou`, `showDefendeu`, `showGoldenGoal`) é mutuamente excludente no fluxo (gol normal mostra gol depois ganhou em sequência; defesa ou gol de ouro mostram um só). Cada `createPortal` monta uma única `<img>` por vez no mesmo container.

---

## 3. Resultado da auditoria de CSS

### 3.1 Arquivos que o GameFinal carrega

- `game-scene.css` (import direto em GameFinal.jsx)
- `game-shoot.css` (import direto em GameFinal.jsx)

GameFinal **não** importa `game-locked.css`, `game-pixel.css`, `game-page.css`, `game-scene-desktop.css`, `game-scene-mobile.css`. Regras nesses arquivos só afetariam o overlay se fossem carregadas globalmente e aplicáveis por seletor; não há seletor global que aplique ao overlay em `#game-overlay-root` nesses arquivos de forma a sobrescrever o inline.

### 3.2 #game-overlay-root (game-scene.css, linhas 4–12)

```css
#game-overlay-root {
  pointer-events: none;
  position: static;
  transform: none;
  filter: none;
  will-change: auto;
  contain: none;
}
```

**Conclusão:** O container **não** cria containing block para `position: fixed`. Os filhos com `position: fixed` são relativos à viewport.

### 3.3 Regras .gs-* que poderiam atingir o overlay

| Arquivo        | Seletor                 | Escopo        | Atinge overlay em #game-overlay-root? |
|----------------|-------------------------|---------------|--------------------------------------|
| game-shoot.css | `.game-stage .gs-goool` | .game-stage  | **Não** — overlay não está em .game-stage |
| game-shoot.css | `.game-stage .gs-defendeu` | .game-stage | **Não** |
| game-shoot.css | `.game-stage .gs-ganhou`  | .game-stage | **Não** |
| game-scene.css | `.game-stage .gs-golden-goal` | .game-stage | **Não** |

O overlay tem classes `gs-goool`, `gs-ganhou`, etc., mas está dentro de `#game-overlay-root`, **não** dentro de `.game-stage`. Portanto nenhuma dessas regras se aplica ao overlay; o inline (position, top, left, transform) permanece o único efetivo.

### 3.4 Keyframes (game-shoot.css)

- `pop`, `gooolPop`, `ganhouPop` incluem `transform: translate(-50%, -50%)` em **todos** os passos (0%, 100% e intermediários). A centralização é preservada durante a animação.

### 3.5 Transform em container global

Nenhuma regra em `game-scene.css` ou `game-shoot.css` aplica `transform` a `body`, `html` ou a um wrapper que seja ancestral de `#game-overlay-root`. O único `transform` relevante no layout do jogo está em `.game-scale` (scale do palco), que pertence à árvore dentro de `#root`; o overlay está fora de `#root`, logo **não** é afetado.

---

## 4. Resultado da auditoria de assets

### 4.1 Imports reais em GameFinal.jsx (linhas 46–51)

| Import       | Arquivo        | Uso no overlay |
|-------------|----------------|----------------|
| gooolImg    | goool.png      | Não (apenas `data-bundle-goool` para paridade de bundle) |
| golNormalImg| gol_normal.png | Overlay “gol” (showGoool) |
| defendeuImg | defendeu.png   | Overlay defesa |
| ganhou5Img  | ganhou_5.png   | Overlay “ganhou” quando prêmio < 100 |
| ganhou100Img| ganhou_100.png | Overlay “ganhou” quando prêmio ≥ 100 ou gol de ouro |
| golDeOuroImg| gol_de_ouro.png| Overlay gol de ouro |

### 4.2 Uso em runtime (mapeamento lógico)

- **Gol normal:** primeiro overlay = `gol_normal`; segundo = `ganhou_5` ou `ganhou_100` conforme `ganhouVariant100`.
- **Defesa:** overlay = `defendeu`.
- **Gol de ouro:** overlay = `gol_de_ouro`.

### 4.3 Contrato produção (defendeu, ganhou_5, ganhou_100, gol_normal, gol_de_ouro, goool)

- **Preview usa exatamente os mesmos arquivos:** sim (gol_normal, ganhou_5, ganhou_100, defendeu, gol_de_ouro; goool no bundle).
- **Asset usado incorretamente:** não identificado.
- **Asset morto no fluxo da /game:** `ganhou.png` e `golden-goal.png` não são mais importados nem usados no GameFinal; apenas os seis do contrato (incluindo goool para o bundle) são referenciados.

**Conclusão:** Assets 100% alinhados com o contrato da produção.

---

## 5. Resultado da análise de containing block

### 5.1 Busca por transform / filter / perspective / will-change

Foram considerados apenas estilos que possam afetar **ancestrais do overlay**. O overlay no DOM é: `img` → `#game-overlay-root` → `body` → `html`.

| Local                         | transform / filter / perspective / will-change | Ancestral do overlay? | Impacto no overlay |
|------------------------------|------------------------------------------------|------------------------|--------------------|
| game-scene.css #game-overlay-root | transform: none; filter: none; will-change: auto | Sim (#game-overlay-root) | **Nenhum** — explicitamente neutro |
| game-scene.css .game-scale   | (aplicado via inline no JSX: scale(n))         | **Não** — .game-scale está dentro de #root | Nenhum |
| game-scene.css .game-stage  | Várias regras com transform                   | **Não** — overlay fora do stage | Nenhum |
| index.css, Dashboard, Login, etc. | Vários (hover, utilidades)                  | **Não** — não são ancestrais de #game-overlay-root | Nenhum |

### 5.2 Estrutura DOM (index.html)

```html
<body>
  <div id="root">...</div>
  <div id="game-overlay-root" aria-hidden="true"></div>
</body>
```

O overlay é filho direto de `#game-overlay-root`. O único ancestral até a viewport é `body`. Em `game-scene.css`, `body[data-page="game"]` tem apenas `margin: 0; overflow: hidden; background: transparent` — **sem** transform, filter ou perspective. Portanto **nenhum** ancestral do overlay cria containing block; `position: fixed` do overlay é relativo à **viewport**.

### 5.3 Conclusão

**Não existe containing block interferindo.** O overlay está centralizado em relação à viewport pelo código e pelo CSS auditado.

---

## 6. Simulação de runtime

### 6.1 Caminho do overlay no DOM

```
img.gs-goool / .gs-ganhou / .gs-defendeu / .gs-golden-goal
  → div#game-overlay-root
    → body
      → html
```

O overlay **não** está dentro de `#root`, `.game-viewport`, `.game-scale` nem `.game-stage`. Ele está **fora do stage** e **fora da árvore** que contém o scale.

### 6.2 Influência de transform

O único `transform` do layout do jogo está em `.game-scale` (inline no GameFinal: `transform: scale(${gameScale})`). Esse nó é descendente de `#root`. O overlay é descendente de `#game-overlay-root`, irmão de `#root`. Portanto o overlay **não sofre** o scale do palco.

### 6.3 Centralização: viewport ou ancestor?

Com:

- `position: fixed`
- `top: 50%` e `left: 50%`
- `transform: translate(-50%, -50%)`
- Ancestrais (`#game-overlay-root`, `body`) **sem** transform/filter/perspective/contain que criem novo containing block

o `position: fixed` é relativo ao **initial containing block** (viewport). Os 50% são da viewport; o translate(-50%, -50%) centraliza o elemento em relação à viewport. **Está sendo relativo à viewport.**

---

## 7. Veredito final (SIM/NÃO resolvido)

### 1. O overlay está tecnicamente correto?

**SIM.** Código, CSS e estrutura DOM estão corretos para overlay viewport-fixed centralizado.

### 2. Está centralizado na viewport ou no stage?

**Na viewport.** Ancestrais não criam containing block; fixed + 50% + translate(-50%, -50%) é viewport-relative.

### 3. Existe containing block interferindo?

**NÃO.** Nenhum ancestral do overlay (até body) tem transform/filter/perspective que altere o containing block.

### 4. Os assets estão 100% alinhados com produção?

**SIM.** Uso de gol_normal, ganhou_5, ganhou_100, defendeu, gol_de_ouro e presença de goool no bundle conforme contrato.

### 5. Existe qualquer bug restante?

**Não foi identificado bug de código ou layout.** Se na prática o overlay “parecer” alinhado ao palco em algum dispositivo/build, a causa não está no código auditado (por exemplo: zoom do browser, viewport meta, extensão, ou inspeção em build antigo). A confirmação definitiva exige inspeção em runtime (computed style do overlay, boundingClientRect vs viewport).

---

## 8. Se NÃO resolvido: causa exata (1 linha)

**N/A** — Bloco considerado **resolvido** com base na evidência de código e CSS; nenhuma causa exata de bug restante foi encontrada.

---

**Critério de sucesso:**

- Overlay centralizado na viewport pelo desenho do código e CSS: **SIM**
- Independente de layout/scale do palco (overlay fora de #root): **SIM**
- Sem influência de transform externo (containing block): **SIM**
- Uso dos mesmos assets da produção: **SIM**

**BLOCO F considerado ENCERRADO** do ponto de vista desta validação read-only. Qualquer dúvida puramente visual deve ser fechada com inspeção em runtime no ambiente real (preview/produção).

---

*Documento gerado em 2026-03-17. Nenhum arquivo foi alterado. Apenas auditoria e prova.*
