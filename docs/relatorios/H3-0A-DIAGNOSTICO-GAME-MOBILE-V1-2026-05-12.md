# H3.0A — DIAGNÓSTICO /GAME MOBILE — V1

**Data:** 2026-05-15  
**Modo:** READ-ONLY — sem alteração de código, deploy, banco, backend ou lógica de jogo/financeiro  
**Escopo:** `goldeouro-player` · rota `/game` · responsividade mobile  
**Branch:** `fix/admin-financial-integrity-v1`  
**HEAD:** `10a25cc` — *docs: registrar fechamento oficial V1 goldeouro*

---

## 1. Resumo executivo

A rota de produção **`/game`** monta **`GameFinal.jsx`** com palco fixo **1920×1080** (`layoutConfig.js`) e escala uniforme via `transform: scale(min(innerWidth/1920, innerHeight/1080))` dentro de `.game-viewport` (**100vw × 100dvh**, `overflow: hidden`).

O diagnóstico identifica **dois sistemas de layout sobrepostos e incompatíveis**:

1. **Ativo (GameFinal):** coordenadas em px no palco + wrapper `.game-scale`.
2. **Legado (CSS de `GameShoot` / `#stage-root`):** regras em `game-scene.css` e `game-shoot.css` que assumem `--pf-w`, `--pf-h`, `left: 50%` e `transform: translate(-50%, -50%)` — **não alinhadas** ao posicionamento inline atual.

**Problemas reais (código):**

| # | Problema | Impacto mobile |
|---|----------|----------------|
| P1 | Conflito CSS `translate(-50%,-50%)` em `.gs-ball` / `.gs-zone` vs posição inline já centrada | Alvos e bola deslocados; pior em telas pequenas |
| P2 | Regras `.gs-goalie` em `game-scene.css` usam `--pf-*` **inexistentes** no DOM do GameFinal | Comportamento imprevisível; `transform` inline do goleiro **substitui** escala CSS legada |
| P3 | Overlay portrait `.game-rotate` existe no CSS mas **não** no JSX do GameFinal | Jogo jogável em retrato com palco muito pequeno (letterboxing extremo) |
| P4 | Sem `safe-area-inset` / `viewport-fit=cover` na página do jogo | Botões inferiores podem ficar sob barra do iOS / gestos |
| P5 | HUD denso (4 stats + logo ~200px) em palco que no portrait pode ter **~220px** de altura útil após scale | Header ocupa proporção excessiva; overflow/wrap |
| P6 | Ficheiros `game-scene-mobile.css` / hook `useResponsiveGameScene` **não ligados** ao GameFinal | Documentação e CSS órfãos; expectativa vs realidade |

**Não há relatório F4 / F4.1** no repositório; histórico Git cita branches `feat/game-landscape-safe`, `fix/game-locked-16x9` (remotas **gone**). Screenshots versionados de `/game` mobile **não** encontrados — apenas menções a validação visual **pendente** (abr/2026).

**Classificação:** **CORREÇÃO COM RESSALVAS** — caminho de correção é **CSS/layout escopado** (baixo risco para API/saldo), mas exige disciplina para não misturar com `gameService` / `handleShoot`.

---

## 2. Estado Git

```text
git status --short (amostra relevante)
 M goldeouro-player/vercel.json
?? docs/relatorios/... (vários)
```

| Campo | Valor |
|-------|--------|
| **Branch** | `fix/admin-financial-integrity-v1` |
| **HEAD** | `10a25cc27b8296798281ea015e96bfe7531aee52` |
| **Sincronia origin** | Alinhado (sessão anterior) |
| **Player `vercel.json`** | Modificado (CRLF; sem delta semântico conhecido) |

Nada no estado Git **bloqueia** o diagnóstico; alteração local em `vercel.json` é irrelevante para layout `/game`.

---

## 3. Arquivos envolvidos

### Roteamento

| Ficheiro | Função |
|----------|--------|
| `goldeouro-player/src/App.jsx` | `path="/game"` → `<ProtectedRoute><GameFinal /></ProtectedRoute>` |
| `goldeouro-player/index.html` | `viewport` width=device-width; `#game-overlay-root` para overlays |

### Componente ativo

| Ficheiro | Função |
|----------|--------|
| **`GameFinal.jsx`** | UI, escala, HUD, chute (`handleShoot` → `gameService`) |
| **`game/layoutConfig.js`** | STAGE 1920×1080; BALL, GOALKEEPER, TARGETS, HUD em **px fixos** |
| `gameService.js` | `POST /api/games/shoot` — **fora do escopo de correção visual** |

### CSS importado por GameFinal

| Ficheiro | Import |
|----------|--------|
| `game-scene.css` | `body[data-page="game"]`, HUD, media queries, regras legado `#stage-root` / `.gs-*` |
| `game-shoot.css` | `.gs-zone`, `.gs-ball`, `.gs-goalie` (modelo GameShoot) |

### CSS **não** importado por GameFinal (órfão / legado)

| Ficheiro | Nota |
|----------|------|
| `game-locked.css` | Portrait gate + 16:9; não usado |
| `game-pixel.css` | Variante pixel-perfect; não usado |
| `game-page.css` | `--vh` hook; não usado |
| `game-scene-mobile.css` | Mobile GameShoot; não usado |
| `game-scene-tablet.css` / `game-scene-desktop.css` | Idem |
| `useResponsiveGameScene.js` + `gameSceneConfig.js` | Só para `GameShoot.jsx` |

### Alternativas (não em produção em `/game`)

`GameShoot.jsx`, `GameShootFallback.jsx`, `Game.jsx`, backups `GameFinal_BACKUP_*`, `game-scene_BACKUP_*`.

### Relatórios consultados (sem F4)

| Documento | Relevância mobile /game |
|-----------|-------------------------|
| `VALIDACAO-FINAL-V1-PRODUCAO-GOLDEOURO-2026-04-08.md` | `/game` → GameFinal; HUD visual **pendente** |
| `DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md` | Saldo/banner (backend); não layout |
| `SANEAMENTO-PR56-...` | Preserva GameFinal na rota |
| `RELEASE-CHECKPOINT/GIT-AUDIT-GLOBAL-READONLY.md` | Branches `fix/game-locked-16x9`, `feat/game-landscape-safe` |
| `goldeouro-player/src/pages/README-RESPONSIVE-GAME-SCENE.md` | Descreve sistema **GameShoot**, não GameFinal |
| `AUDITORIA-FORENSE-FINAL-V1-PENDENCIAS-GERAIS-2026-05-12.md` | UX-01 rotas fantasma; não mobile game |

**Screenshots / F4.1:** **não encontrados** no repo para `/game` mobile.

---

## 4. Estrutura atual da tela /game

### Árvore DOM (GameFinal — simplificada)

```text
body[data-page="game"]          ← setado no mount; overflow:hidden (game-scene.css)
└─ #root
   └─ App (min-h-screen bg-slate-900)   ← fundo externo; GameFinal cobre com fixed implícito via viewport
      └─ .game-viewport                 ← 100vw × 100dvh, flex center, overflow hidden
         └─ .game-scale                 ← transform: scale(gameScale); 1920×1080px
            └─ .game-stage             ← palco lógico
               ├─ .scene-bg (bg_goal.jpg)
               ├─ .hud-header (+ stats, logo, MENU)
               ├─ button.gs-zone ×5    ← posição inline px
               ├─ img.gs-goalie        ← posição inline px + rotate inline
               ├─ img.gs-ball          ← posição inline px
               ├─ .hud-bottom-left     ← Recarregar
               └─ .hud-bottom-right    ← mute
#game-overlay-root (body)              ← portals fixed para overlays de resultado
```

### Cálculo de escala (problema real — bem implementado no núcleo)

```javascript
// GameFinal.jsx — calculateScale
scaleX = window.innerWidth / 1920
scaleY = window.innerHeight / 1080
gameScale = Math.min(scaleX, scaleY)
```

| Orientação | Exemplo | gameScale ≈ | Palco visível ≈ |
|------------|---------|-------------|-----------------|
| Portrait 390×844 | iPhone | **0,20** | 390×219 px |
| Landscape 844×390 | iPhone | **0,36** | 304×390 px |
| Desktop 1920×1080 | | **1,0** | fullscreen |

**Dependência 1920×1080:** **sim**, explícita em `layoutConfig.js` e `STAGE`.

### Viewport / altura

- `index.html`: `width=device-width, initial-scale=1.0` — **sem** `viewport-fit=cover`.
- `.game-viewport` usa **`100dvh`** (bom para barra dinâmica moderna).
- Variável `--vh` definida em CSS legado mas **não atualizada** por JS no GameFinal (ao contrário do que `game-page.css` comenta).

---

## 5. Problemas identificados

### 5.1 Problemas reais (evidência no código)

#### P1 — Conflito de posicionamento bola e zonas (CRÍTICO UX)

**GameFinal** posiciona com canto superior-esquerdo já ajustado ao centro:

```javascript
left: ballPos.x - ballSize / 2,
top: ballPos.y - ballSize / 2,
```

**`game-shoot.css`** / **`game-scene.css`** aplicam ainda:

```css
.gs-ball { transform: translate(-50%, -50%); /* + left:50% legado em game-scene */ }
.gs-zone { transform: translate(-50%, -50%); }
```

**Efeito:** deslocamento adicional de metade do elemento → alvos e bola **fora** das coordenadas de `layoutConfig.js`. Em desktop o erro pode ser parcialmente mascarado; em mobile, com `scale(0.8)` extra em `.gs-ball` (@media max-width 767px em `game-scene.css`), o erro **amplifica**.

**Tipo:** problema real.

---

#### P2 — CSS legado `#stage-root` / `--pf-*` sem DOM

`game-scene.css` define:

```css
#stage-root { --pf-w: min(100vw, ...); --pf-h: ...; }
.gs-goalie { left: 50%; transform: translate(-50%,0) translateY(30px) scale(...); }
.hud-bottom-left { left: calc(var(--pf-ox) + ...); }
```

**GameFinal não renderiza `#stage-root` nem `.game-stage-wrap`.** Variáveis `--pf-ox`, `--pf-w` ficam **indefinidas** para seletores que ainda possam aplicar (ex.: regras de rodapé em CSS, se usadas).

**Goleiro:** inline `transform: rotate(deg)` **substitui** o `transform` completo do CSS → regras de escala do goleiro em `game-scene.css` **não aplicam**; só contam `left`/`top` inline.

**Tipo:** problema real (dívida de migração GameShoot → GameFinal).

---

#### P3 — Portrait: sem gate de rotação

`game-scene.css` linhas 79–83:

```css
@media (orientation: portrait) {
  .game-rotate { display: grid; ... }
  .game-stage-wrap { display: none; }
}
```

**GameFinal não inclui `.game-rotate` nem `.game-stage-wrap`.** Em portrait o jogo **mostra-se**, com scale ~0,2 — palco minúsculo, faixas pretas grandes.

**Hipótese de produto (histórico Git):** branches `feat/game-landscape-safe` / `fix/game-locked-16x9` sugerem intenção de **landscape-only**; implementação atual **não** aplica isso no componente ativo.

**Tipo:** problema real se o requisito for landscape; hipótese se o produto aceitar portrait “letterboxed”.

---

#### P4 — Safe area ausente

- Nenhum `padding-*: env(safe-area-inset-*)` em `.game-viewport`, `.hud-bottom-left`, `.hud-bottom-right`.
- `InternalPageLayout.jsx` (outras páginas) usa safe-area no footer; **/game não**.

**Tipo:** problema real em iPhone com notch / home indicator.

---

#### P5 — HUD denso vs palco escalado

Dentro do palco 1080px de altura, `.hud-header` tem `min-height: 5.75rem` (~92px) + 4 blocos de estatísticas + logo até **200px** de largura (`game-scene.css`). Após `scale(0.2)` em portrait, a área útil do campo fica **muito reduzida**; risco de:

- wrap / sobreposição de stats;
- zonas de chute (`TARGETS` y≈520–740) competindo com header visualmente;
- botões inferiores (`HUD.BOTTOM_*` 20px do fundo do **palco**) próximos da borda física do telemóvel.

**Tipo:** problema real em portrait; moderado em landscape.

---

#### P6 — Overflow

| Camada | overflow |
|--------|----------|
| `body[data-page="game"]` | `hidden` |
| `.game-viewport` | `hidden` |
| `.game-stage` | `hidden` |
| `App` wrapper | `min-h-screen` sem overflow — OK |

**Overflow de página (scroll):** improvável; **overflow visual** (elementos cortados ou sobrepostos) **sim**, por conflitos P1/P5.

---

#### P7 — Artefactos não ligados

- `game-scene-mobile.css`, `useResponsiveGameScene` — documentados para **GameShoot**, não GameFinal.
- Múltiplos `.css` de backup na mesma pasta aumentam risco de edição no ficheiro errado na correção.

**Tipo:** risco de processo / confusão.

---

### 5.2 Hipóteses (requerem validação em dispositivo)

| ID | Hipótese | Como validar |
|----|----------|--------------|
| H1 | Em Safari iOS, `100dvh` ainda deixa barra de URL a sobrepor parte inferior | Device real + screenshot |
| H2 | Autoplay `torcida.mp3` falha até gesto — não é layout, mas parece “travado” | Console |
| H3 | PWA instalado comporta-se diferente de browser | Comparar standalone vs Safari |
| H4 | `ProtectedRoute` loading troca layout antes do jogo | Gravar vídeo do primeiro paint |
| H5 | Deploy Vercel antigo sem GameFinal | Confirmar bundle contém `GameFinal` (F3 já indicou bundle recente) |

---

### 5.3 O que **não** é problema de layout mobile (fora de escopo H3.0A)

- `gameService.processShot` / saldo / `novoSaldo` — backend + contrato API (já documentado em `DIAGNOSTICO-FLUXO-JOGADOR`).
- PIX, saques, admin.
- Rotas alternativas `/gameshoot` (não são `/game` prod).

---

## 6. Riscos de UX

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| Alvos de chute desalinhados | **Alta** | P1 — utilizador clica num sítio, bola vai a outro |
| Portrait injogável / frustrante | **Alta** | Palco ~20% da altura do ecrã |
| Botões “Recarregar” / mute cortados | **Média** | P4 safe-area |
| HUD ilegível (texto pequeno após scale) | **Média** | P5 — stats com `white-space: nowrap` podem sair do card |
| Expectativa “rode o telemóvel” não cumprida | **Média** | CSS existe, JSX não |
| Regressão visual desktop ao “limpar CSS” | **Média** | Desktop é referência atual estável |

---

## 7. Riscos técnicos

| Risco | Mitigação na correção futura |
|-------|------------------------------|
| Editar `handleShoot` / `gameService` por engano | Limitar diff a `.css` + JSX de `style`/`className` |
| Remover `game-scene.css` inteiro | Escopar regras sob `body[data-page="game"] .game-stage` do GameFinal |
| Duplicar lógica de scale | Manter **um** mecanismo: `.game-scale` + layoutConfig |
| Quebrar overlays em `#game-overlay-root` | Não mover portals; já usam `position:fixed` + `90vw` |
| Testar só Chrome desktop | Matriz obrigatória §10 |

---

## 8. Itens que NÃO devem ser alterados

Na futura cirurgia **H3.0B** (polimento mobile):

| Área | Ficheiros / comportamento |
|------|---------------------------|
| API de chute | `gameService.js` — `processShot`, endpoints |
| Lógica de fases | `GAME_PHASE`, `handleShoot` (fluxo, timers, backend) |
| Validação saldo | `balance < betAmount`, `betAmount = 1` |
| Backend | `server-fly.js`, `/api/games/shoot` |
| Financeiro | PIX, saques, ledger |
| Admin | — |
| Coordenadas de gameplay | `layoutConfig.js` — **evitar** re-tuning de TARGETS/BALL salvo prova em 1920×1080 |
| Portais de overlay | Padrão `#game-overlay-root` + `createPortal` |
| Auth / ProtectedRoute | — |

**Permitido:** CSS, classes, wrapper layout, safe-area, portrait gate (JSX), ajuste fino de `calculateScale` (ex.: usar `visualViewport`), remoção/neutralização de regras `.gs-*` conflituosas, media queries HUD.

---

## 9. Estratégia recomendada

### Princípio: uma arquitetura, um palco

Manter **GameFinal + layoutConfig + .game-scale`** como fonte da verdade. Não reativar `useResponsiveGameScene` sem adaptação explícita.

### Fase mínima (H3.0B sugerida)

1. **Neutralizar conflitos CSS (P1)**  
   - Sob `body[data-page="game"] .game-stage img.gs-ball` e `button.gs-zone`: `transform: none` (ou remover `translate` legado).  
   - Garantir que hover/active de zonas use o mesmo modelo de posição (centro via inline **ou** via CSS, não ambos).

2. **Isolar legado (P2)**  
   - Comentar ou prefixar regras `#stage-root`, `.game-stage-wrap`, `.gs-goalie`/`gs-ball` baseadas em `--pf-*` para não aplicarem ao GameFinal.  
   - Manter regras de `.hud-header`, cores, animações G-4.

3. **Decisão de orientação (P3)**  
   - **Opção A (recomendada para jogo 16:9):** adicionar ao JSX o overlay `.game-rotate` em portrait (texto “Rode o dispositivo”) — reutilizar CSS existente.  
   - **Opção B:** permitir portrait mas aumentar legibilidade (HUD compacto, scale mínimo floor) — mais trabalho.

4. **Safe area (P4)**  
   - `padding` com `env(safe-area-inset-*)` em `.game-viewport` ou botões inferiores.  
   - Opcional: `viewport-fit=cover` no `index.html` (testar PWA).

5. **HUD mobile (P5)**  
   - Media query `max-width: 767px` **dentro do palco escalado**: reduzir stats visíveis (2+2), logo menor, `flex-wrap` controlado.  
   - Não alterar valores em `layoutConfig` para targets.

6. **Higiene (P7)**  
   - Marcar README `README-RESPONSIVE-GAME-SCENE.md` como “só GameShoot / legado”.  
   - Não apagar backups nesta fase; evitar imports acidentais.

### Solução mínima vs ideal

| | Mínima | Ideal |
|---|--------|--------|
| Esforço | 1–2 ficheiros CSS + bloco JSX portrait | + HUD compact + `visualViewport` resize |
| Risco | Baixo | Baixo-médio |
| Portrait | Bloqueio ou palco pequeno aceite | Bloqueio + mensagem clara |

---

## 10. Testes mínimos futuros

Executar **após** H3.0B; **sem** alterar saldo real além de chutes de teste em conta de staging/dev.

| # | Cenário | Critério de sucesso |
|---|---------|-------------------|
| T1 | **Desktop** 1920×1080 Chrome | Palco centralizado; 5 zonas alinhadas ao gol; chute 1x sem erro JS |
| T2 | **Mobile portrait** iPhone Safari | Comportamento conforme decisão (overlay rotate **ou** layout aceitável); sem scroll da página |
| T3 | **Mobile landscape** | Palco ocupa área útil; botões Recarregar/mute clicáveis; safe-area respeitada |
| T4 | **Refresh** em `/game` autenticado | Sem tela branca; `data-page="game"`; scale recalculada |
| T5 | **Fluxo de chute** | Um chute (goal ou miss): animação bola/goleiro; toast; **não** validar valor financeiro além do já existente |
| T6 | **Resize** desktop → estreito | Debounce resize sem loop; elementos estáveis |
| T7 | **Overlay resultado** | Imagem centrada; não cortada; some após timeout |

**Ferramentas:** DevTools device mode (insuficiente sozinho) + **1 dispositivo físico** iOS + 1 Android.

**Não testar nesta cirurgia:** depósito PIX, saque, alteração de aposta, admin.

---

## 11. Classificação final

# **CORREÇÃO COM RESSALVAS**

| Classificação | Aplica? | Motivo |
|---------------|---------|--------|
| **CORREÇÃO SIMPLES** | Parcial | Ajustes CSS pontuais (P1, P4) são simples |
| **CORREÇÃO COM RESSALVAS** | **Sim** | Conflito de duas arquiteturas; decisão portrait/landscape; HUD denso; validação só em dispositivo real |
| **BLOQUEADO** | Não | Não há dependência externa nem mudança de backend |

**Ressalvas principais:**

1. Decisão de produto: **bloquear portrait** vs **suportar portrait**.
2. Confirmação em hardware real (safe-area, `100dvh`).
3. Disciplina de escopo — não misturar com correções de saldo/API na mesma PR.

**Escopo da futura correção (H3.0B):** apenas `GameFinal.jsx` (mínimo), `game-scene.css`, `game-shoot.css` (regras `.gs-*`), opcionalmente `index.html` viewport; **não** `layoutConfig.js` salvo media queries de HUD que não movam targets.

---

*Diagnóstico H3.0A encerrado em modo read-only. Nenhum ficheiro de código foi alterado.*
