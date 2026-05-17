# H3.5h — FORENSE GEOMÉTRICA DO PALCO `/game`

**Data:** 2026-05-16  
**Modo:** 100% read-only — sem alteração de código, CSS, commit, PR ou deploy.  
**Produção referência:** `/meta.gitCommit` = `1a2f8d3` · CSS `index-D7hr6dPE.css`  
**SHAs comparados:** `7ecedca` (pré-H3.0B em main) · `460ba4e` (H3.0B em main) · `1a2f8d3` (H3.5d merge PR #88)

**Relacionado:** [H3-5C](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md) · [H3-5E](H3-5E-VALIDACAO-VISUAL-PR88-GAME-2026-05-16.md) · [H3-5G](H3-5G-MERGE-CONTROLADO-PR88-2026-05-16.md)

---

## 1. Resumo executivo

A forense geométrica indica que o deslocamento horizontal percebido **não é causado por `background-position` CSS nem por crop de `object-fit: cover`** no palco actual (imagem `bg_goal.jpg` = **1920×1080**, igual ao stage).

O elemento que **perdeu o centro geométrico original face ao fundo** é a **camada interactiva (zonas / referência de trave)** relativamente à **arte do JPEG**, por exposição das posições reais de `layoutConfig.js` após **H3.0B** neutralizar `transform: translate(-50%, -50%)` legado.

| Pergunta | Resposta |
|----------|----------|
| **A. Elemento desalinhado?** | **Camada interactiva** (zonas `gs-zone`, referência C do gol) vs **centro óptico da trave no `img.scene-bg`** — não o container `.game-scale` (este permanece centrado no viewport). |
| **B. Commit que alterou geometria visível?** | **`dac9f8b` (H3.0B)** — `game-shoot.css` `transform: none` em bola/zonas. `460ba4e` acrescentou deslocamento **global** via safe-area no viewport (revertido em `1a2f8d3`). |
| **C. Propriedade causal?** | **`transform: none`** (remove offset legado de −50% em zonas de 100px) + **calibração pré-existente** `TARGETS.C.x = 1020` (centro de grupo ≈ **1020**) vs **stage/goleiro** em **960**. |
| **D. Tipo** | **Desalinhamento estrutural** (layout vs arte) **amplificado por correção CSS**, não crop de cover nem `calculateScale()`. |
| **E. Correção cirúrgica mais segura (descrição)** | Ajustar **`object-position`** só em `img.scene-bg` **ou** recalibrar `TARGETS` (−60px em X) — ver §10. |

**Classificação:** causa raiz **estrutural + legado CSS**; H3.5d removeu safe-area mas **não** restaura o offset visual pré-H3.0B das zonas.

---

## 2. Hierarquia visual real (`GameFinal.jsx`)

Não existe classe `.game-scene` no DOM activo. Árvore efectiva:

```text
body[data-page="game"]
└── #root
    └── .game-viewport                    ← flex center; 100vw × 100dvh; overflow hidden
        ├── .game-rotate                  ← overlay portrait (fixed; fora do palco em landscape)
        └── .game-scale                   ← transform: scale(gameScale); origin center; 1920×1080 lógico
            └── .game-stage               ← position relative; 1920×1080; overflow hidden
                ├── img.scene-bg          ← fundo estádio (Z=1)
                ├── .hud-header           ← HUD topo (Z=10)
                ├── button.gs-zone ×5      ← alvos (Z=5)
                ├── img.gs-goalie         ← goleiro (Z=3)
                ├── img.gs-ball           ← bola (Z=4)
                ├── .hud-bottom-left      ← Recarregar
                └── .hud-bottom-right     ← áudio
#game-overlay-root (body, fora de #root)   ← overlays gol/defesa (fixed)
```

**Nota:** regras CSS legadas `#stage-root`, `.game-stage-wrap` e variáveis `--pf-w` / `--pf-ox` aplicam-se ao fluxo **GameShoot**, **não** ao `GameFinal` (sem `#stage-root` no DOM).

---

## 3. Propriedades geométricas por camada (estado `1a2f8d3`)

| Elemento | width / height | position | transform | overflow | padding/margin | scale |
|----------|----------------|----------|-----------|----------|----------------|-------|
| `.game-viewport` | `100vw` × `100dvh` | flex filho centrado | — | `hidden` | **0** (H3.5d) | — |
| `.game-scale` | **1920 × 1080** (inline) | `relative` | `scale(min(iw/1920, ih/1080))` | — | 0 | uniforme, `origin: center center` |
| `.game-stage` | 1920 × 1080 | `relative` | — | `hidden` | 0 | herda scale |
| `img.scene-bg` | 1920 × 1080 | `left:0; top:0` | **nenhum** | — | 0 | herda scale |
| `img.scene-bg` fit | — | — | — | — | `object-fit: cover` (inline) | `object-position: 50% 50%` (default) |
| `button.gs-zone` | 100 × 100 (inline) | `left: adjustedX−50` | **`none`** (H3.5d) | — | 0 | herda scale |
| `img.gs-goalie` | 423 × 500 (inline) | `left: x−w/2` | **`rotate()`** inline only | — | 0 | herda scale |
| `img.gs-ball` | 90 × 90 | `left: x−45` | **`none !important`** | — | 0 | herda scale |

**`calculateScale()`** (inalterado em todos os SHAs):

```javascript
scaleX = window.innerWidth / 1920;
scaleY = window.innerHeight / 1080;
return Math.min(scaleX, scaleY);
```

Usa **viewport inteiro**, não o content box após padding (relevante só quando H3.0B tinha safe-area no viewport).

---

## 4. Comparação de SHAs — o que mudou no palco

| Ficheiro | `7ecedca` | `460ba4e` (H3.0B) | `1a2f8d3` (H3.5d) |
|----------|-----------|-------------------|-------------------|
| `GameFinal.jsx` — `scene-bg` | `left:0`, `objectFit:'cover'`, 1920×1080 | **igual** + overlay `.game-rotate` | **igual** |
| `layoutConfig.js` | **igual** | **igual** | **igual** |
| `bg_goal.jpg` | 1920×1080 | **igual** | **igual** |
| `index.html` viewport | sem `viewport-fit=cover` | **`viewport-fit=cover`** | mantido |
| `.game-viewport` padding | — | **safe-area 4 lados** | **removido** |
| `game-shoot.css` zonas/bola | `translate(-50%,-50%)` legado + inline | **`transform:none`** H3.0B | `transform:none` (H3.5d limpa duplicatas) |

**Conclusão Git:** nenhum commit alterou geometria do **`img.scene-bg`**. A mudança visual reportada pós-H3.0B coincide com **`dac9f8b`** (transform) e, transitivamente, com **`460ba4e`** (safe-area global, já revertida em `1a2f8d3`).

---

## 5. Investigação por hipótese

### 5.A `background-size` / `object-fit`

| Item | Evidência |
|------|-----------|
| Implementação | **`<img class="scene-bg">`**, não `background-image` |
| Inline | `objectFit: 'cover'`, `width/height: 1920×1080` |
| Asset | **`bg_goal.jpg` = 1920×1080** (ratio **1.7778** = 16:9) |
| Crop horizontal | **Não** — com dimensões idênticas ao stage, `cover` ≡ preenchimento 1:1 sem letterbox interno |

**Veredicto:** **descartado** como causa do drift residual pós-H3.5d (pode afectar percepção só se o ficheiro de arte tiver a trave **pintada** fora do centro pixel 960).

### 5.B `background-position` / `object-position`

| Item | Evidência |
|------|-----------|
| `scene-bg` inline | **sem** `objectPosition` → browser usa **`50% 50%`** |
| CSS global `#stage-root .scene-bg` | não aplica (sem `#stage-root` no GameFinal) |
| Diff 7ecedca→1a2f8d3 | **zero** alterações |

**Veredicto:** **não introduzido** por H3.0B/H3.5d; eventual ajuste seria **correcção nova** (`object-position`), não regressão de propriedade.

### 5.C `aspect-ratio` / largura efectiva

| Item | Valor |
|------|--------|
| Stage lógico | 16:9 fixo (1920×1080) |
| Viewport típico desktop | após `scale`, palco centrado com letterbox simétrico se aspect ≠ 16:9 |
| Largura visual `.game-scale` | `1920 × scale` px, centrada no flex |

Medição browser (produção, sessão forense, viewport efectivo ~**1123×630** após chrome UI):

| Zona | bbox (px) | Centro X |
|------|-----------|----------|
| TL | x=270, w=55 | **297.5** |
| C | x=534, w=55 | **561.5** |
| TR | x=798, w=55 | **825.5** |
| Midpoint (TL+TR)/2 | — | **561.5** |

O par TL/TR é **simétrico** em torno do centro do viewport → **`.game-scale` está centrado**. O palco não está “empurrado” horizontalmente no estado `1a2f8d3`.

**Veredicto:** aspect-ratio / centering do **container** — **OK**; desvio está **dentro** do conteúdo do stage.

### 5.D `transform` / parents

| Camada | H3.0B impacto |
|--------|----------------|
| `.game-scale` | inalterado (`scale` uniforme, `origin: center`) |
| `.gs-zone` | **`transform: none`** → remove `translate(-50%,-50%)` de `game-shoot.css` |
| `.gs-ball` | idem + anula `scale(0.8)` mobile legado em `game-scene.css` |
| `.gs-goalie` | inline `transform: rotate()` **substitui** CSS legado `.gs-goalie { left:50%; transform:… }` (variáveis `--pf-*` **inactivas** sem `#stage-root`) |

**Efeito mensurável em zona C (SIZE=100):**

| Modo | Centro X lógico (stage 1920) |
|------|------------------------------|
| `layoutConfig` + inline (`7ecedca` **intento**) | **1020** |
| Com `translate(-50%,-50%)` legado (visual `7ecedca`) | **970** (−50 px) |
| Após H3.0B/1a2f8d3 (`transform:none`) | **1020** |

**Δ visual H3.0B:** zonas movem **+50 px para a direita** no espaço do stage (bola similar: START.x=1000).

Goleiro `IDLE.x = **960**` (centro matemático do stage) — **inalterado** em todos os SHAs.

**Veredicto:** **`transform` legado** é o culpado directo da mudança pós-H3.0B; não é translate no background.

### 5.E `calculateScale()`

| Verificação | Resultado |
|-------------|-----------|
| Código | **idêntico** 7ecedca / 460ba4e / 1a2f8d3 |
| Inputs | `window.innerWidth`, `window.innerHeight` |
| vs content width | com safe-area H3.0B, área útil < viewport mas escala usava viewport cheio → **dessincronia temporária** (corrigida em H3.5d) |

**Veredicto:** não explica drift **residual** após `1a2f8d3`; explicava drift **global** em `460ba4e` apenas.

---

## 6. Centros matemáticos (`layoutConfig` + arte)

| Referência | X no stage (1920) | Δ vs centro stage (960) |
|------------|-------------------|-------------------------|
| Centro geométrico stage | **960** | 0 |
| Goleiro `IDLE` | **960** | 0 |
| Bola `START` | **1000** | +40 |
| Zona **C** (após offsets) | **1020** | **+60** |
| Média centros TL/TR/BL/BR/C | **1020** | **+60** |
| `TARGETS` (blame `cff8cdc`, 2026-04-08) | C.x=1020 desde então | pré-H3.0B |

**Interpretação visual:** a **trave pintada** no JPEG está alinhada ao eixo ~**960**; as **zonas** após H3.0B alinham-se ao eixo ~**1020**. O utilizador descreve “fundo/trave deslocados para a **esquerda**” porque a **camada interactiva** ficou **+50–60 px à direita** face ao estado mascarado por `translate(-50%,-50%)` (centro visual antigo ~970, mais próximo da arte).

**Pixel drift estimado (desktop scale≈1):**

| Comparação | ΔX (px stage) |
|------------|----------------|
| Zona C: legado visual → pós-H3.0B | **+50** |
| Zona C: centro stage → pós-H3.0B | **+60** |
| Goleiro (960) → zona C (1020) | **+60** |

---

## 7. Screenshot forense

| Artefacto | Descrição |
|-----------|-----------|
| Produção `www.goldeouro.lol/game` | captura `h35h-game-forensic-prod.png` (browser automatizado) |
| Viewport | ~1123×630 útil (não 1920×1080 fullscreen) |
| Observação | zonas TL/TR simétricas vs centro viewport; descrição visual ainda nota tensão bola↔gol — consistente com **arte vs layout**, não com container descentrado |

**Limitação:** sem print de regressão versionado no repo; comparação `7ecedca` vs `1a2f8d3` via **Git + matemática**, não pixel-diff histórico.

---

## 8. Respostas finais (A–E)

### A. Qual elemento está desalinhado?

**`img.scene-bg` (arte)** permanece ancorado `left:0` no stage; **zonas `button.gs-zone`** (e parcialmente bola em x=1000) estão calibradas **~60 px à direita** do centro óptico da trave/goleiro (960). HUD usa `left/right` no stage e **não** participa do mesmo sistema de coordenadas das zonas — por isso “HUD parece correcto”.

### B. Qual commit introduziu a mudança visível?

| Commit | Efeito geométrico |
|--------|-------------------|
| **`dac9f8b` (H3.0B)** | **Principal** — `transform:none` nas zonas/bola |
| **`460ba4e`** | safe-area no `.game-viewport` (shift global, revertido) |
| **`1a2f8d3`** | remove safe-area; **mantém** `transform:none` |

Nenhum commit entre `7ecedca` e `1a2f8d3` alterou `scene-bg` ou `layoutConfig`.

### C. Qual propriedade causa isso?

1. **`transform: none !important`** em `body[data-page="game"] .game-stage img.gs-ball` / `button.gs-zone` (`game-shoot.css`, H3.0B/H3.5d)  
2. **`TARGETS.*.x`** e `HORIZONTAL_OFFSET` com centro de grupo em **x≈1020** vs arte ~**960** (`layoutConfig.js`, desde Abr/2026)

**Não causa:** `background-position`, crop `cover` (ratio igual), `calculateScale()`.

### D. Classificação do problema

| Tipo | Aplica? |
|------|---------|
| crop `object-fit` | **Não** (1:1 1920×1080) |
| scale / `calculateScale` | **Não** (residual); **Sim** (safe-area época 460ba4e, já revertido) |
| translate | **Sim** — remoção de translate legado nas zonas |
| aspect-ratio container | **Não** |
| width / padding viewport | **Só em 460ba4e** |
| **layout vs arte (estrutural)** | **Sim** — eixo 1020 vs 960 |
| outro | `viewport-fit=cover` — efeito marginal em `100vw` mobile |

### E. Correção cirúrgica MAIS SEGURA (apenas descrição)

| Opção | Acção | Risco | Notas |
|-------|--------|-------|-------|
| **1 (recomendada)** | `img.scene-bg`: `object-position: calc(50% - 31.25px) center` (~−60px em 1920) ou valor empírico | **Baixo** | Não mexe em `layoutConfig` / gameplay; só arte |
| **2** | `layoutConfig`: deslocar `TARGETS` −60px em X (manter offsets) | **Médio** | Afecta hitboxes e goleiro jumps relativos |
| **3** | Reintroduzir `translate(-50%,-50%)` **sem** inline `−size/2` | **Alto** | Repete bug P1 H3.0A — **não recomendado** |
| **4** | `object-position` + validação em mobile landscape com notch | **Baixo** | Complementa H3.5d (HUD safe-area já separado) |

**Não implementado** — conforme instrução H3.5h.

---

## 9. Problemas / limitações da forense

| ID | Nota |
|----|------|
| L1 | Print original da regressão não está no repositório |
| L2 | Medições browser em viewport reduzido (~1123px), não fullscreen 1920 |
| L3 | Emulação `orientation: portrait` no desktop continua não fiável |
| L4 | Análise do eixo óptico da trave no JPEG não usou editor de imagem (inferência por layout 960 vs 1020) |

---

## 10. Decisão forense

### **CAUSA RAIZ PROVÁVEL (evidência objectiva)**

**Desalinhamento estrutural entre `layoutConfig` (centro de interacção ≈ X=1020) e arte do estádio (eixo ≈ X=960), tornado visível pelo commit `dac9f8b` ao aplicar `transform: none` nas zonas (removendo −50px de compensação acidental do CSS legado).**

H3.5d corrigiu o **container** (safe-area); **não** reconcilia **arte ↔ hitboxes**.

**Baseline visual:** estável ao nível de **centragem do palco**; **não** ao nível de **sobreposição trave JPEG ↔ zonas**.

---

## Metodologia

- `git diff` / `git show` / `git blame` — `7ecedca`, `460ba4e`, `1a2f8d3`
- Leitura `GameFinal.jsx`, `layoutConfig.js`, `game-scene.css`, `game-shoot.css`
- Dimensões JPEG via parser Node
- Cálculo analítico de centros e drift
- MCP browser: `getBoundingClientRect` vía `browser_get_bounding_box` em produção
- Inspecção CSS minificado `index-D7hr6dPE.css` (sem safe-area no viewport)

**Sem commits. Sem PR. Sem deploy.**
