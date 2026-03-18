# BLOCO F — FORENSE DOS OVERLAYS DA /GAME

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, deploy, banco ou assets. Apenas auditoria e documentação.

**Referências de código analisadas:**
- `goldeouro-player/src/pages/GameFinal.jsx` (preview atual)
- `goldeouro-player/src/pages/GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx` (referência produção)
- `goldeouro-player/src/game/layoutConfig.js` (HUD, OVERLAYS, STAGE)
- `goldeouro-player/src/pages/game-scene.css`, `game-shoot.css`, `game-locked.css`
- `docs/relatorios/BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT-2026-03-17.md`
- `docs/relatorios/COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW-2026-03-17.md`

---

## 1. Resumo executivo

A rota `/game` concentra **dois tipos de overlays**: (1) **HUDs e elementos ancorados ao palco** (header, rodapé esquerdo/direito, targets, bola, goleiro, background), todos dentro de `.game-scale` > `.game-stage` em coordenadas fixas 1920×1080; (2) **Overlays de resultado** (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL), renderizados via `createPortal(..., document.body)` com `position: fixed` e centralização por `top/left 50%` + `transform: translate(-50%, -50%)`, ou seja, em sistema de coordenadas da **viewport do documento**, não do stage.

A auditoria identificou que **em código** a ancoragem é a mesma entre preview e referência de produção (backup): HUDs no stage com pixels do `layoutConfig.js`; overlays de resultado no `body` com fixed. As diferenças são: (a) no preview a raiz `.game-viewport` ganhou estilo inline `width: 100vw; height: 100dvh; overflow: hidden`; (b) o CSS (game-scene.css) contém regras que dependem de `#stage-root` e variáveis `--pf-ox`, `--pf-w`, `--pf-h`, `--pf-oy`, mas o DOM real **não usa** `#stage-root`, apenas `.game-viewport` > `.game-scale` > `.game-stage`, então essas variáveis **não estão definidas** no contexto dos HUDs; (c) o game-shoot.css define `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` com `position: absolute; inset: 0; margin: auto`, em conflito conceitual com o inline `position: fixed` do JSX (o inline vence na especificidade). O desalinhamento reportado no preview (overlay no canto inferior esquerdo) não é explicado por diferença de ancoragem no código atual; a causa provável é **stacking context / containing block** (ex.: ancestral com `transform`) ou efeito indireto do stage não centralizado e da altura `100dvh`, conforme relatório forense do stage/scale/viewport.

---

## 2. Inventário dos overlays

Todos os elementos “acima do palco” ou sobrepostos à cena, listados por tipo e container.

| # | Nome / Classe | Tipo | Container (ancoragem) | Fonte de posição |
|---|----------------|------|------------------------|------------------|
| 1 | `.scene-bg` (img) | Background do campo | `.game-stage` | Inline: `position: absolute`, `left: 0`, `top: 0`, `width/height: stageWidth/Height` |
| 2 | `.hud-header` | Barra superior (logo, stats, aposta, MENU PRINCIPAL) | `.game-stage` | Inline + layoutConfig: `HUD.HEADER` → `top: 20`, `left: 20`, `right: 20` (px) |
| 3 | `.gs-zone` (×5) | Botões de zona (TL, TR, C, BL, BR) | `.game-stage` | Inline: `TARGETS` + offsets, `position: absolute`, left/top em px |
| 4 | `.gs-goalie` | Imagem do goleiro | `.game-stage` | Inline: `GOALKEEPER` + pose, `position: absolute`, left/top em px |
| 5 | `.gs-ball` | Imagem da bola | `.game-stage` | Inline: estado `ballPos`, `position: absolute`, left/top em px |
| 6 | `.hud-bottom-left` | Botão “Recarregar” etc. | `.game-stage` | Inline: `HUD.BOTTOM_LEFT` → `left: 20`, `bottom: 20` (px) |
| 7 | `.hud-bottom-right` | Áudio e controles | `.game-stage` | Inline: `HUD.BOTTOM_RIGHT` → `right: 20`, `bottom: 20` (px) |
| 8 | `.gs-goool` (img) | Overlay “GOL!” | `document.body` (createPortal) | Inline: `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)` |
| 9 | `.gs-ganhou` (img) | Overlay “Ganhou” | `document.body` (createPortal) | Idem (fixed 50% + translate -50%) |
| 10 | `.gs-defendeu` (img) | Overlay “Defendeu” | `document.body` (createPortal) | Idem |
| 11 | `.gs-golden-goal` (img) | Overlay “Gol de Ouro” | `document.body` (createPortal) | Idem |

Elementos adicionais referenciados apenas em CSS (não usados no JSX atual do GameFinal): `.game-rotate` (retrato), `.hud-actions`, `.hud-footer`, `.chat-panel` (game-scene.css). O GameFinal não renderiza `.game-page`, `.game-stage-wrap` nem `#stage-root`.

---

## 3. Estrutura de ancoragem em produção

Referência: `GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx` e relatório COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW.

- **Raiz:** `<div className="game-viewport">` **sem** estilos inline.
- **Filho:** `div.game-scale` com `transform: scale(n)`, `transformOrigin: center center`, `width: 1920`, `height: 1080`, `position: relative`.
- **Filho do scale:** `div.game-stage` com `width/height` 1920/1080, `position: relative`, `overflow: hidden`, `background: #0b3a1d`.

Overlays 1–7 estão **dentro** de `.game-stage`; coordenadas em pixels do `layoutConfig.js` (sistema 1920×1080). Overlays 8–11 são renderizados em `document.body` com `createPortal`, com estilo inline `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`, referindo-se à viewport do documento.

Em produção (referência), não há regra CSS para `.game-viewport` nem `.game-scale` nos arquivos auditados; a árvore real não usa `#stage-root`, portanto as variáveis `--pf-w`, `--pf-h`, `--pf-ox`, `--pf-oy` definidas em `#stage-root` no game-scene.css **não se aplicam** ao DOM de produção. Os HUDs dependem dos estilos inline (left/right/top/bottom em px) para posição.

---

## 4. Estrutura de ancoragem no preview

Branch `feature/bloco-e-gameplay-certified`, arquivo `GameFinal.jsx` atual.

- **Raiz:** `<div className="game-viewport" style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>`.
- **Filho:** `div.game-scale` (mesmo `gameScaleStyle` que no backup).
- **Filho do scale:** `div.game-stage` (mesmo inline: 1920×1080, relative, overflow hidden, background).

Overlays 1–7: mesma ancoragem ao `.game-stage` com valores do `layoutConfig.js` via inline. Overlays 8–11: mesma técnica (createPortal no body, fixed 50% + translate -50%).

**Única diferença de ancoragem entre produção (backup) e preview:** estilo inline na raiz `.game-viewport` (100vw, 100dvh, overflow hidden). Nenhum overlay muda de container nem de sistema de coordenadas entre os dois.

---

## 5. Diferenças encontradas

| Aspecto | Produção (backup) | Preview (atual) |
|--------|--------------------|------------------|
| Container raiz | `.game-viewport` sem inline | `.game-viewport` com `width: 100vw`, `height: 100dvh`, `overflow: hidden` |
| HUDs (header, bottom-left, bottom-right) | Dentro `.game-stage`, posição por inline (px) | Idem |
| Overlays de resultado (goool, ganhou, defendeu, golden-goal) | createPortal no `body`, fixed 50% + translate -50% | Idem |
| Uso de `#stage-root` / `.game-page` / `.game-stage-wrap` | Não no JSX | Não no JSX |
| Variáveis CSS `--pf-*` | Definidas apenas em `#stage-root` (não presente no DOM) | Idem |

Conclusão: **não há diferença de ancoragem dos overlays entre preview e produção no código**. A diferença está apenas no viewport (100dvh e overflow). O relatório de comparação forense já descreveu overlays no canto inferior esquerdo no preview; isso não é causado por mudança de container ou de posicionamento explícito dos overlays no JSX.

---

## 6. Riscos de desalinhamento

- **Variáveis `--pf-*` indefinidas no contexto real**  
  O game-scene.css define `--pf-w`, `--pf-h`, `--pf-ox`, `--pf-oy` em `#stage-root`. O GameFinal não renderiza `#stage-root`. Assim, dentro de `.game-stage` essas variáveis não existem (ou herdam valor inicial). Regras que as usam:
  - `.hud-actions`: `left/right: calc(var(--pf-ox) + var(--pf-w) * 0.02)` (GameFinal não usa `.hud-actions`).
  - `.hud-bottom-left`: `left: calc(var(--pf-ox) + var(--pf-w) * 0.04)`.
  - `.hud-bottom-right`: `right: calc(var(--pf-ox) + var(--pf-w) * 0.04)`.
  - `.gs-goalie` (game-scene.css): `transform` com `var(--pf-h)`; `.gs-ball`: `top: calc(var(--pf-oy) + var(--pf-h) * 0.875)`.

  O GameFinal aplica **estilos inline** aos HUDs e ao goleiro/bola (left, top, width, height, transform), que têm maior especificidade que as regras de classe. Enquanto o inline estiver presente, as regras com `--pf-*` não alteram a posição final. **Risco:** se no futuro o inline for removido ou sobrescrito, esses elementos passariam a usar `--pf-*` indefinidas (comportamento indefinido ou 0), podendo desalinhar.

- **Conflito CSS vs inline nos overlays de resultado**  
  No game-shoot.css: `.gs-goool`, `.gs-defendeu`, `.gs-ganhou` com `position: absolute; inset: 0; margin: auto`. No JSX os mesmos elementos têm estilo inline `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`. O inline vence. **Risco:** em builds ou ordem de carregamento onde o inline não seja aplicado, o overlay passaria a `absolute` com containing block do viewport (quando no body), ainda centralizado por `inset:0; margin:auto`. Menor risco de desalinhamento por isso; maior risco é **stacking context** (ver abaixo).

- **Stacking context / containing block para `position: fixed`**  
  Se algum ancestral do `body` (ex.: root da app, wrapper com `transform`, `filter`, `perspective`) tiver `transform` diferente de `none`, isso cria novo containing block para descendentes com `position: fixed`. Os overlays então ficariam “fixos” em relação a esse bloco, não à viewport, podendo aparecer deslocados (ex.: canto inferior esquerdo) se esse bloco não cobrir a tela ou estiver deslocado. **Risco alto** como explicação para a regressão reportada no preview.

- **Altura `100dvh` e escala**  
  O relatório BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT já descreveu que o stage não está centralizado e que `100dvh` pode divergir de `window.innerHeight`. Isso afeta a área visível e a sensação de alinhamento; não altera diretamente a ancoragem dos overlays no body, mas pode contribuir para a percepção de “overlay fora do lugar” se o conteúdo do stage estiver deslocado.

---

## 7. Causa principal provável

- **Para HUDs (header, bottom-left, bottom-right):** Estão corretamente ancorados ao `.game-stage` em pixels. O único risco é a dependência futura de regras CSS que usam `--pf-*` inexistentes no DOM atual; hoje o inline protege.
- **Para overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL):** O código (preview e backup) é o mesmo: body + fixed + 50% + translate -50%. A causa mais provável do desalinhamento no preview é **containing block alterado por um ancestral com `transform`** (ou outro criador de stacking context), fazendo o “fixed” ser relativo a um retângulo que não é a viewport, ou **interação com o layout quebrado** (stage não centralizado + 100dvh) na percepção do usuário. Em segundo plano, não se descarta bug de viewport (meta, zoom, barra de endereço) em ambiente de preview.

---

## 8. Correção conceitual recomendada

(Sem alterar código; apenas direção para correção futura.)

1. **Centralizar o stage no viewport**  
   Conforme BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT: garantir que `.game-viewport` centralize o `.game-scale` (ex.: flex + align-items/justify-content center ou position absolute + top/left 50% + translate -50% no scale).

2. **Alinhar DOM e CSS**  
   Ou passar a usar no JSX a árvore para a qual o CSS foi escrito (`.game-page` > `.game-stage-wrap` > `#stage-root` / `.game-stage`) e aplicar scale/centralização no nível correto, ou adicionar regras explícitas para `.game-viewport` e, se necessário, `.game-scale`, e definir `--pf-*` em um ancestral que exista no DOM (ex.: `.game-viewport` ou `:root`) para evitar regras “órfãs”.

3. **Overlays de resultado**  
   Manter createPortal no body com fixed 50% + translate -50%. Garantir que nenhum ancestral do body (root da app, wrappers de rota) tenha `transform`, `filter` ou `will-change` que crie containing block para fixed. Se for necessário transform em um wrapper global, considerar renderizar o portal em um nó que seja filho direto do body e que não tenha ancestral com transform.

4. **Consistência de altura**  
   Avaliar uso de `100dvh` vs `100vh` e alinhar ao cálculo de escala (`window.innerHeight`), conforme relatório de stage/scale.

5. **Não alterar**  
   layoutConfig.js (STAGE 1920×1080, HUD/OVERLAYS em px), posições em pixels dos HUDs no stage, nem a decisão de portal no body para os overlays de resultado; apenas garantir que o contexto (viewport, centralização, ausência de transform no ancestral) seja correto.

---

## 9. Veredito final

**BLOQUEADO** (mantido, em linha com o forense do stage/scale/viewport).

Os overlays da `/game` estão, em código, **ancorados de forma idêntica** em preview e na referência de produção: HUDs no stage em px; overlays de resultado no body com fixed centralizado. Não foi encontrada **regressão própria das camadas** (mudança de container ou de posicionamento dos overlays). O desalinhamento reportado no preview (overlay no canto inferior esquerdo) é explicável por: (1) **containing block / stacking context** criado por ancestral com transform (ou similar), ou (2) efeito indireto do **stage não centralizado** e do uso de **100dvh**, que tornam o layout da página inconsistente. Além disso, o CSS atual depende de `#stage-root` e `--pf-*`, que **não existem** no DOM real, gerando risco futuro se os inlines forem removidos.

Recomenda-se aplicar as correções conceituais acima (centralização do stage, coerência DOM/CSS, garantia de que fixed seja em relação à viewport) e validar visualmente em preview antes de nova promoção à produção.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, deploy, banco, env ou assets.*
