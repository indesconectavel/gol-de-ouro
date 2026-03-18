# BLOCO F — FORENSE DE ASSETS E INTEGRIDADE VISUAL DO /GAME

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, deploy, banco ou assets. Apenas auditoria e documentação.

**Referências de código e relatórios analisados:**
- `goldeouro-player/src/App.jsx` (rota `/game` → `GameFinal`)
- `goldeouro-player/src/pages/GameFinal.jsx`
- `goldeouro-player/src/game/layoutConfig.js`
- `goldeouro-player/src/pages/game-scene.css`, `game-shoot.css`
- `goldeouro-player/src/components/Logo.jsx`
- `docs/relatorios/AUDITORIA-ASSETS-GAME-PROD-VS-PREVIEW-2026-03-17.md`
- `docs/relatorios/COMPARACAO-FORENSE-GAME-PROD-VS-PREVIEW-2026-03-17.md`
- `docs/relatorios/BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT-2026-03-17.md`
- `docs/relatorios/BLOCO-F-FORENSE-OVERLAYS-CAMADAS-GAME-2026-03-17.md`

---

## 1. Resumo executivo

A rota **/game** é servida pelo componente **GameFinal.jsx**, que utiliza **12 imagens** importadas de `../assets/`, **1 logo** em path público (`/images/Gol_de_Ouro_logo.png`), **4 sons** em `/sounds/` e um **layout fixo 1920×1080** definido em `layoutConfig.js`. O **layoutConfig** não referencia assets (apenas dimensões e coordenadas em pixels).

- **Produção (referência):** Em `main`, **GameFinal.jsx pode não existir**; a rota `/game` em alguns contextos foi documentada como servida por **GameShoot**. No estado atual do repositório (branch com GameFinal), produção é tomada como “current aprovado” e preview como branch **feature/bloco-e-gameplay-certified** (ou equivalente) onde o palco aparece quebrado, escala estranha e possível divergência de assets.
- **Preview:** Palco quebrado, overlay de resultado no canto inferior esquerdo, possível divergência do asset **goool.png** e presença de assets extras não usados pelo GameFinal (`gol_normal.png`, `gol_de_ouro.png`, `ganhou_100.png`, `ganhou_5.png`).
- **Conclusão da auditoria de assets:** Existe **risco crítico** por (i) divergência reportada do GOOOL (conteúdo do arquivo ou contexto de renderização), (ii) assets alternativos no preview que podem ser confundidos com os aprovados, (iii) **ausência de centralização do stage** no viewport (causa estrutural já documentada no forense stage/scale) e (iv) **object-fit/object-position**: fundo com `object-fit: cover` sem `object-position` explícito (proporção do `bg_goal.jpg` pode agravar corte visual); overlays com `object-fit: contain` e dimensões fixas em px — se as imagens tiverem proporção diferente do container, o aspecto visual pode diferir entre ambientes. **Preload** dos assets da /game (goool, defendeu, bg_goal, goalie_*, etc.) **não** está incluído nos scripts de preload crítico (apenas logo e backgrounds gerais); **fallback** existe apenas para a logo (Logo.jsx: onError → bloco CSS “GOL DE OURO”). Imagens do GameFinal não possuem fallback nem preload dedicado.

---

## 2. Inventário de assets principais

Origen: **GameFinal.jsx** (imports e uso), **Logo.jsx** (path público), **layoutConfig.js** (dimensões), sons e CSS.

### 2.1 Imagens (imports de `../assets/`)

| # | Asset | Caminho no código | Uso na /game | Dimensões aplicadas (layoutConfig/JSX) | object-fit |
|---|-------|------------------|--------------|----------------------------------------|------------|
| 1 | goalie_idle.png | `import … from '../assets/goalie_idle.png'` | Sprite goleiro parado | GOALKEEPER.SIZE (423×500) ou fallback 220×260 | contain (inline) |
| 2 | goalie_dive_tl.png | `import … from '../assets/goalie_dive_tl.png'` | Goleiro pulo TL | Idem | contain |
| 3 | goalie_dive_tr.png | idem | Goleiro pulo TR | Idem | contain |
| 4 | goalie_dive_bl.png | idem | Goleiro pulo BL | Idem | contain |
| 5 | goalie_dive_br.png | idem | Goleiro pulo BR | Idem | contain |
| 6 | goalie_dive_mid.png | idem | Goleiro pulo centro | Idem | contain |
| 7 | ball.png | `import … from '../assets/ball.png'` | Bola em jogo | BALL.SIZE = 90px | contain |
| 8 | bg_goal.jpg | `import … from '../assets/bg_goal.jpg'` | Fundo do campo | stageWidth×stageHeight (1920×1080) | cover (inline) |
| 9 | goool.png | `import … from '../assets/goool.png'` | Overlay "GOOOL!" | OVERLAYS.SIZE.GOOOL 520×200 | contain |
| 10 | defendeu.png | `import … from '../assets/defendeu.png'` | Overlay defesa | OVERLAYS.SIZE.DEFENDEU 520×200 | contain |
| 11 | ganhou.png | `import … from '../assets/ganhou.png'` | Overlay "Ganhou" | OVERLAYS.SIZE.GANHOU 480×180 | contain |
| 12 | golden-goal.png | `import … from '../assets/golden-goal.png'` | Overlay Gol de Ouro | OVERLAYS.SIZE.GOLDEN_GOAL 600×220 | contain |

### 2.2 Logo (path público)

| Asset | Caminho | Uso | Fallback |
|-------|---------|-----|----------|
| Gol_de_Ouro_logo.png | `src="/images/Gol_de_Ouro_logo.png"` (Logo.jsx) | HUD da /game (brand-small) | Sim: onError → bloco CSS "GOL DE OURO" |

### 2.3 Áudio (paths públicos)

| Asset | Caminho no código | Uso |
|-------|-------------------|-----|
| kick.mp3 | `new Audio('/sounds/kick.mp3')` | Som do chute |
| gol.mp3 | `new Audio('/sounds/gol.mp3')` | Som de gol (corte 4s–10s) |
| defesa.mp3 | `new Audio('/sounds/defesa.mp3')` | Som de defesa |
| torcida.mp3 | (referenciado para loop de torcida) | Ambiente |

### 2.4 layoutConfig.js — dimensões (sem referência a paths de assets)

- **STAGE:** WIDTH 1920, HEIGHT 1080  
- **BALL:** START { x: 1000, y: 1010 }, SIZE 90  
- **GOALKEEPER:** IDLE { x: 960, y: 690 }, SIZE { width: 423, height: 500 }, JUMPS por direção  
- **TARGETS:** TL/TR/C/BL/BR em px, SIZE 100  
- **OVERLAYS.SIZE:** GOOOL 520×200, DEFENDEU 520×200, GANHOU 480×180, GOLDEN_GOAL 600×220  

Nenhum path de imagem ou áudio é definido no layoutConfig.

### 2.5 Assets em `src/assets` NÃO usados pelo GameFinal (presentes no preview)

| Asset | Status |
|-------|--------|
| golden-victory.png | Legado; classe .gs-golden-victory no CSS; GameFinal usa apenas golden-goal.png |
| ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png | Suspeitos: apenas no preview; risco de troca/uso indevido; gol_normal pode ser confundido com goool |

### 2.6 Assets em `public/images/game/` (não usados pela /game atual)

Usados por **GameField.jsx** / **Game.jsx** (não montados na rota `/game` no App.jsx atual):

- stadium-background.jpg, goalkeeper-3d.png, ball.png, goal-net-3d.png, soccer-ball-3d.png  

A rota `/game` usa **GameFinal**, que depende exclusivamente de `src/assets/` (bundled) e `/images/Gol_de_Ouro_logo.png`.

---

## 3. Assets em produção

- **Referência de “produção”:** branch `main` ou ambiente “current” aprovado.
- Em `main`, a árvore de `goldeouro-player/src/assets/` foi documentada com **13 arquivos** (ball, bg_goal, defendeu, ganhou, goalie_dive_*, goalie_idle, golden-goal, golden-victory, goool).
- **GameFinal.jsx** pode existir apenas em branches de feature; quando existente, usa os 12 imports listados e a logo em `/images/`.
- **Preload em produção:** `cdn.js` e `usePerformance-simple.jsx` preloadam `/images/Gol_de_Ouro_logo.png`, `/images/Gol_de_Ouro_Bg01.jpg`, `/images/Gol_de_Ouro_Bg02.jpg`, `/sounds/background.mp3`, `/sounds/button-click.mp3` — **não** preloadam bg_goal, goool, defendeu, ganhou, golden-goal nem sprites do goleiro/bola.
- **Fallback:** Apenas o componente **Logo** tem onError → fallback visual. As `<img>` do GameFinal (scene-bg, goleiro, bola, overlays) **não** têm onError; asset quebrado ou 404 resulta em ícone quebrado.

---

## 4. Assets no preview

- **Branch típico:** feature/bloco-e-gameplay-certified (ou equivalente com GameFinal na rota /game).
- **GameFinal.jsx** existe e importa os mesmos 12 assets de `../assets/`.
- Em `src/assets/` do preview há **17 arquivos** nos relatórios: os 13 da main **mais** ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png — estes **não são referenciados** por GameFinal.jsx.
- **Divergência reportada:** overlay GOOOL com aparência diferente e/ou posicionado no **canto inferior esquerdo** (causa atribuída a stacking context/containing block e/ou stage não centralizado, não a path/import diferente).
- **Paths e imports:** Idênticos ao da produção (mesmos nomes e `../assets/`). A diferença visual pode ser (a) **conteúdo binário** do `goool.png` diferente, (b) **contexto de renderização** (viewport, transform no ancestral, centralização do stage), (c) **build/cache** servindo outra versão.

---

## 5. Divergências encontradas

| Tipo | Produção | Preview | Impacto |
|------|----------|--------|--------|
| **Path/import** | goool.png, defendeu.png, etc. em `../assets/` | Idêntico | Nenhum no código |
| **Conteúdo do arquivo goool.png** | Aprovado | Relatado diferente | Crítico — overlay incorreto |
| **Assets extras** | Ausentes em main | ganhou_100, ganhou_5, gol_de_ouro, gol_normal | Alto — risco de uso indevido/troca |
| **Posição dos overlays** | Central (fixed 50% + translate -50%) | Canto inferior esquerdo (relatado) | Crítico — causa estrutural/stacking context |
| **Centralização do palco** | Esperada (ou compensada por outro meio) | Ausente (.game-viewport não centraliza .game-scale) | Crítico — palco quebrado / escala estranha |
| **object-fit / object-position** | scene-bg: cover, sem object-position | Idêntico no código | Se bg_goal.jpg tiver proporção ≠ 16:9, corte pode variar por resolução/arquivo |
| **Preload** | Logo e backgrounds gerais | Idêntico — assets do jogo não preloadados | Médio — possível atraso ou flash ao trocar de tela |
| **Fallback** | Apenas Logo | Idêntico — imagens do stage sem fallback | Médio — asset quebrado = ícone quebrado |

---

## 6. Impacto visual das divergências

- **Palco “quebrado” / escala estranha:** Explicado pelo forense de stage/scale/viewport: o bloco 1920×1080 escalado não está centralizado no viewport; o CSS existente foi escrito para outra árvore (`.game-page`, `#stage-root`), que o GameFinal não usa. Isso gera conteúdo ancorado no canto superior esquerdo e sensação de proporção incorreta.
- **Overlay no canto inferior esquerdo:** Em código os overlays usam `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`. A causa provável é **containing block** alterado por ancestral com `transform` (ou outro criador de stacking context), fazendo o “fixed” ser relativo a um retângulo que não é a viewport — agravado pela possível diferença de estrutura entre preview e produção (ex.: wrappers, 100dvh).
- **GOOOL com imagem diferente:** Se o **conteúdo** de `goool.png` no preview for distinto do aprovado (mesmo path), a fidelidade visual quebra. Se houver uso indevido de `gol_normal.png` em algum build ou fallback não identificado, o overlay exibido seria o errado.
- **Proporção do fundo:** `bg_goal.jpg` com `object-fit: cover` e **sem** `object-position` usa o padrão (center). Se a imagem tiver proporção muito diferente de 16:9, o corte pode ser mais perceptível em certas resoluções ou se o arquivo for diferente entre prod e preview.
- **Overlays com dimensões fixas (520×200, etc.):** Com `object-fit: contain`, se a imagem natural tiver proporção diferente do retângulo definido, aparecerá letterbox interno; isso pode fazer o overlay parecer menor ou deslocado dependendo do arquivo exato usado.

---

## 7. Causas prováveis

1. **Estrutural (já documentadas):**  
   - Falta de centralização do `.game-scale` dentro do `.game-viewport`.  
   - Inexistência de regras CSS para `.game-viewport` e `.game-scale`; regras existentes para `#stage-root` / `.game-page` não se aplicam ao DOM real.  
   - Uso de `100dvh` no preview pode divergir de `window.innerHeight` usado no cálculo de escala.

2. **Assets:**  
   - Conteúdo do arquivo `goool.png` diferente entre produção e preview (mesmo path).  
   - Presença de `gol_normal.png`, `gol_de_ouro.png`, etc. no preview com risco de uso acidental ou build apontando para asset errado.  
   - Nenhuma divergência de **nome de arquivo** ou **path de import** encontrada no código da /game.

3. **Renderização dos overlays:**  
   - Containing block para `position: fixed` alterado por ancestral com `transform`/`filter`/`perspective`, fazendo overlays ficarem “fixos” em relação a um bloco deslocado (ex.: canto inferior esquerdo).

4. **Visual/UX (parcialmente):**  
   - Proporção do `bg_goal.jpg` incompatível com 16:9 agrava corte com `object-fit: cover`; ausência de `object-position` explícito deixa o corte dependente do padrão do navegador.  
   - Overlays com proporção natural diferente das dimensões em px podem gerar aspecto diferente (contain + letterbox).

5. **Preload / fallback:**  
   - Ausência de preload dos assets da /game pode causar atraso ou flash ao abrir o jogo.  
   - Ausência de fallback nas imagens do stage (goool, defendeu, bg_goal, etc.) deixa a tela vulnerável a 404 ou asset corrompido.

---

## 8. Correção conceitual recomendada

(Sem aplicar alterações; apenas direção para correção futura.)

1. **Centralização do stage (prioritário):**  
   Garantir que o container raiz da /game (ou `.game-viewport`) centralize o `.game-scale`: por exemplo `display: flex; align-items: center; justify-content: center;` e dimensão 100% da viewport, ou `.game-scale` com `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(...)`.

2. **Alinhar DOM e CSS:**  
   Ou usar no JSX a árvore para a qual o CSS foi escrito (`.game-page` > `.game-stage-wrap` > `#stage-root` / `.game-stage`) e aplicar scale/centralização no nível correto, ou adicionar regras explícitas para `.game-viewport` e `.game-scale` e definir variáveis `--pf-*` em um ancestral que exista no DOM.

3. **Overlays de resultado:**  
   Manter createPortal no body com fixed 50% + translate -50%. Garantir que nenhum ancestral do body (root da app, wrappers de rota) tenha `transform`, `filter` ou `will-change` que crie novo containing block para fixed.

4. **Assets:**  
   - Garantir que o arquivo `goool.png` no preview (e em runtime) seja **exatamente** o asset aprovado em produção (comparação binária ou checksum).  
   - Decidir sobre os arquivos ganhou_100, ganhou_5, gol_de_ouro, gol_normal: remover do repositório do preview ou documentar como não usados e garantir que o build não os utilize na rota /game.

5. **object-fit / object-position:**  
   - Para `bg_goal.jpg`: se a proporção natural não for 16:9, considerar `object-position` explícito (ex.: `center top`) para previsibilidade do corte; opcionalmente validar dimensões naturais da imagem.  
   - Overlays: manter `object-fit: contain`; garantir que as artes estejam na proporção esperada (ex.: 520×200 para GOOOL) para evitar letterbox inesperado.

6. **Preload e fallback:**  
   - Incluir na lista de preload crítico (se usado na /game) os assets do GameFinal (bg_goal, goool, defendeu, ganhou, golden-goal e, se viável, sprites do goleiro e bola) para reduzir atraso ao abrir o jogo.  
   - Adicionar onError/fallback (placeholder ou texto) nas `<img>` do stage para evitar tela quebrada em caso de asset 404 ou corrompido.

7. **Não alterar (conceitual):**  
   layoutConfig.js (STAGE 1920×1080, OVERLAYS/HUD em px), posições em pixels dos elementos no stage, nem a decisão de renderizar overlays de resultado via createPortal no body — apenas garantir que o contexto (viewport, centralização, ausência de transform no ancestral) e os arquivos de asset estejam corretos.

---

## 9. Veredito final

**BLOQUEADO**

- **Estrutural:** O preview apresenta palco não centralizado e escala/viewport incorretos por falta de regras de layout no container real (game-viewport / game-scale) e possível efeito de `100dvh`. Isso explica “palco quebrado” e “escala estranha” independentemente de assets.
- **Assets:** Há risco crítico pela divergência reportada do GOOOL (conteúdo ou contexto de exibição) e pela presença de assets não aprovados/duplicados no preview (gol_normal, gol_de_ouro, ganhou_100, ganhou_5). Não foi encontrada divergência de **nomes** ou **paths** de imports na rota /game; as diferenças são de conteúdo do arquivo, contexto de renderização (stacking context/containing block) e possivelmente proporção/object-fit.
- **Integridade visual:** O problema percebido é **parcialmente visual** (overlay deslocado, possível asset GOOOL errado) e **parcialmente estrutural** (stage não centralizado, viewport/scale). Ambos devem ser corrigidos e validados visualmente em preview antes de promoção à produção.
- **Preload/fallback:** Inconsistência de preload (assets da /game não preloadados) e ausência de fallback para imagens do stage aumentam o risco de experiência quebrada ou diferente entre ambientes.

Nenhuma alteração foi feita em código, deploy, banco ou assets. Esta auditoria é somente leitura e documentação.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, deploy, banco, env ou assets.*
