# BLOCO G — Plano de polimento premium

**Data:** 2026-03-27  
**Modo:** auditoria read-only (sem alterações de código neste documento).  
**Base factual:** `goldeouro-player/src/pages/GameFinal.jsx`, `game-scene.css`, `game-shoot.css`, `InternalPageLayout.jsx`, `layoutConfig.js` (OVERLAYS).

---

## 1. Estado atual da experiência

A rota `/game` monta `GameFinal` com `body[data-page="game"]`, stage 1920×1080 escalado por viewport, HUD absoluto em px (`layoutConfig.HUD`), imports de `game-scene.css` e `game-shoot.css`. Perceptivamente, a experiência já transmite **produto estruturado**: cartão superior com vidro (`backdrop-filter`, borda suave), estatísticas com escala responsiva via variáveis CSS, valores em dourado (`#fbbf24`), linha de aposta legível com blindagem `body[data-page="game"] .hud-header .bet-*`, botão **MENU PRINCIPAL** amarelo em pílula com hover (levanta + sombra), **Recarregar** como pílula grande dourada com hover dedicado, controle de áudio como botão quadrado com hover. Os overlays de resultado vão para `#game-overlay-root` (fora de transforms do stage), com animações definidas em `game-shoot.css` (`gooolPop`, `ganhouPop`, `pop`) e durações alinhadas a `OVERLAYS.ANIMATION_DURATION` no fluxo JS.

O **chute** é lido como: som de kick imediato, transição da bola e do goleiro com `cubic-bezier` e durações vindas de `layoutConfig`, feedback de acerto/erro por imagem central + áudio escalonado (gol) ou defesa com delay de som. A **tela de carregamento** é minimalista (Tailwind, texto “Carregando jogo...”), sem micro-marca ou skeleton.

Ponto perceptivo técnico: as **zonas de chute** (`.gs-zone`) usam estilos **inline** em `GameFinal.jsx` para `background` e `border`; isso **prevalece** sobre `.gs-zone:hover` em `game-shoot.css`, pelo que o realce de hover documentado no CSS **não altera o fundo** das zonas na implementação atual — as zonas tendem a parecer mais “estáticas” do que o sistema legado/`GameShootFallback` sem inline equivalente.

---

## 2. Oportunidades de melhoria

| Área | Observação (evidência no código) |
|------|----------------------------------|
| Micro-interações | HUD principal: hover existe em `.btn-dashboard`, `.hud-btn`, `.control-btn`; não há `:active` explícito nos mesmos blocos em `game-scene.css` (feedback de “pressionar” discreto). |
| Hover nas zonas | `game-shoot.css` define `.gs-zone:hover`, mas `background` inline em `GameFinal.jsx` anula o efeito no hover — oportunidade de alinhar intenção CSS com markup (sem mudar gameplay). |
| Feedback de clique | Botões do footer/header do HUD: transições `0.2s`–`0.3s`; falta camada opcional `:active` / `focus-visible` para teclado e toque. |
| Profundidade dos botões | `.btn-dashboard` e `.hud-btn.primary` já usam sombra e hover; `.control-btn` é mais “plano” (aceitável, mas uniformizável levemente). |
| Transições | Bola/goleiro: transições inline consistentes com `layoutConfig`; overlays: animações CSS já presentes. |
| Entrada/saída | Loading: transição abrupta para o jogo (sem fade-in do stage). Overlays: já com keyframes; entrada do golden goal no stage (`goldenGoalPop`) existe em `game-scene.css` para `.game-stage .gs-golden-goal` — uso no portal de `GameFinal` é via classe `gs-golden-goal` com animação inline `ganhouPop` (coerência visual a revisar numa micro-cirurgia, sem mudar tempos de negócio). |
| Percepção de performance | Resize com debounce 200 ms e atualização de escala só se delta > 0.001 — bom; nada a “corrigir”, apenas eventual polish no loading. |
| Impacto visual do chute | Já há kick sound + movimento; reforço visual opcional seria só camada não invasiva (ex.: brilho breve na zona — exigiria retirar conflito inline/CSS). |
| Acerto/erro | Overlays + toasts + sons; defesa com timing de som 400 ms — já narrado; polish seria só refinamento de easing/duração **se** mantidos os mesmos `ANIMATION_DURATION` de negócio. |
| Micro-animações seguras | Keyframes `goldenGoalPop` / `goldenVictoryPop` no stage; footer **JOGAR AGORA** no app shell já tem gradiente + ring (`InternalPageLayout.jsx`) — não reabrir BLOCO F; apenas harmonizar “nível premium” entre shell e `/game` se desejado. |

---

## 3. Prioridade (alto impacto / baixo risco)

1. **Corrigir percepção de hover nas zonas `.gs-zone`** — mover cor de fundo/borda para classes em `game-scene.css` (escopo `body[data-page="game"]`) ou usar variáveis CSS, preservando posição/tamanho inline. **Impacto:** alto no “feel” do chute. **Risco:** baixo se só estética.  
2. **`:active` e `focus-visible` discretos** em `.btn-dashboard`, `.hud-btn`, `.control-btn` — só CSS. **Impacto:** médio-alto em sensação tátil. **Risco:** muito baixo.  
3. **Estado de loading** — substituir texto solto por skeleton leve ou fade-in do stage (CSS + possivelmente classe wrapper). **Impacto:** médio na primeira impressão. **Risco:** baixo se não tocar em dados.  
4. **Alinhar animação do overlay Gol de Ouro** — verificar se classe `gs-golden-goal` + `animation` inline duplica ou diverge de `goldenGoalPop` em `game-scene.css`. **Impacto:** médio na coerência. **Risco:** baixo se só CSS/durações já contratadas.  
5. **`.btn-partida` em `game-scene.css`** — estilizado junto a `.btn-dashboard`, mas **não** referenciado em `GameFinal.jsx`; manter ou limpar é decisão de housekeeping (risco zero funcional se não usado na `/game`).  

---

## 4. Estratégia de execução

- **Uma micro-cirurgia por PR/commit**, reversível por revert.  
- **Ordem:** primeiro apenas CSS e/ou movimento de estilos inline → zonas e botões; depois loading; por último revisão fina de keyframes de overlay **sem** alterar `OVERLAYS.ANIMATION_DURATION` nem lógica em `handleShoot`.  
- **Testes manuais:** `/game` em desktop e mobile, teclado (Tab) nos botões, um chute acerto e um erro, golden goal se possível.  
- **Não** reabrir arquitetura de portal, `data-page`, ou encapsulamento `.gs-hud` vs `GameFinal`.

---

## 5. Primeiras micro-cirurgias sugeridas

| # | Ação | Onde | Risco | Impacto |
|---|------|------|-------|---------|
| G-1 | Remover `background`/`border` das zonas do inline para classes escopadas `body[data-page="game"] .gs-zone` / estados `:hover` `:disabled` | `GameFinal.jsx` (reduzir inline) + `game-scene.css` | Baixo | Alto no hover das zonas |
| G-2 | Adicionar `:active { transform: scale(0.98) }` ou `translateY(1px)` e `focus-visible { outline }` em `.btn-dashboard`, `body[data-page="game"] .hud-btn`, `.control-btn` | `game-scene.css` | Muito baixo | Médio-alto |
| G-3 | Opcional: `transition` unificada em variável `--hud-press-duration` para botões do HUD | `game-scene.css` | Baixo | Médio (consistência) |
| G-4 | Loading: wrapper com `opacity`/`animation` de entrada no primeiro paint do jogo (sem alterar fetch) | `GameFinal.jsx` (classe + CSS mínimo) ou só CSS na `div` existente | Baixo | Médio |
| G-5 | Auditar duplicação `animation` inline vs classe nos `<img>` de overlay; unificar para uma fonte (preferir classe em `game-shoot.css`) | `GameFinal.jsx` + CSS | Baixo | Médio (manutenção + nitidez) |

---

## 6. Arquivos críticos envolvidos

- `goldeouro-player/src/pages/GameFinal.jsx` — stage, HUD, zonas, bola, goleiro, portal de overlays, loading.  
- `goldeouro-player/src/pages/game-scene.css` — HUD `/game`, botões, footer HUD, regras `body[data-page="game"]`, keyframes stage para golden.  
- `goldeouro-player/src/pages/game-shoot.css` — keyframes de overlays (`gooolPop`, `pop`, `ganhouPop`), `.gs-zone` base, estilos `.gs-hud` (legado isolado).  
- `goldeouro-player/src/game/layoutConfig.js` — `OVERLAYS.SIZE`, `OVERLAYS.ANIMATION_DURATION`, durações de bola/goleiro.  
- `goldeouro-player/src/components/InternalPageLayout.jsx` — referência de polish do app shell (footer **JOGAR AGORA**); não obrigatório para BLOCO G do `/game`, útil para harmonia visual.  

---

## 7. Riscos a evitar

- **Não** alterar `handleShoot`, contratos de `gameService`, ou fases `GAME_PHASE` (gameplay).  
- **Não** mudar `OVERLAYS.ANIMATION_DURATION` sem alinhar timers em `GameFinal.jsx` (sincronismo áudio/toast/reset).  
- **Não** remover `data-page` ou `#game-overlay-root` / padrão de portal.  
- **Não** enfraquecer o isolamento `.gs-hud` / regras que blindam o HUD contra cascata (BLOCO F).  
- **Não** aplicar `transform`/`filter` em ancestrais do overlay root (quebraria `position: fixed` dos overlays).  
- **Não** grandes refactors de componentes nem troca de `GameFinal` por outra página.

---

## Referência rápida (constatações de código)

- Zonas: `GameFinal.jsx` — `className` `gs-zone`, estilos inline incl. `background` e `transition: 'all 0.2s ease'`.  
- Hover CSS zonas: `game-shoot.css` — `.gs-zone:hover { background: rgba(255,255,255,.36) }` (pode não aplicar ao `background` por especificidade do inline).  
- Menu principal: `game-scene.css` — `.btn-dashboard:hover` com `translateY(-2px)` e sombra.  
- Overlays: `GameFinal.jsx` — `createPortal` para `#game-overlay-root`; animações nomeadas alinhadas a `@keyframes` em `game-shoot.css`.

---

# Resumo executivo

O `/game` já apresenta **nível visual sólido** (vidro no HUD, tipografia responsiva, botões principais com hover e sombras, overlays animados e pipeline de portal correto). O maior gap perceptivo **verificável no código** é o **hover das zonas de chute**, onde estilos inline competem com `game-shoot.css`. O segundo gap é **micro-feedback de pressão/foco** nos botões do HUD. O terceiro é a **entrada do loading**, ainda neutra. Tudo isso admite **micro-cirurgias pequenas e reversíveis** sem tocar na arquitetura nem no BLOCO F.

---

## Lista priorizada das micro-cirurgias

1. **G-1** — Zonas: tirar conflito inline/CSS para hover real.  
2. **G-2** — `:active` + `focus-visible` nos botões do HUD.  
3. **G-4** — Polish mínimo do loading / entrada do stage.  
4. **G-5** — Unificar declaração de animações dos overlays.  
5. **G-3** — Variáveis de transição (consistência).

---

## Melhor ponto de partida

Começar por **G-1 (zonas `.gs-zone`)**: é o único item com **alto impacto imediato** no “feel” do chute, explicação técnica clara (especificidade CSS vs inline) e **baixo risco** se apenas estilos visuais forem movidos para o escopo `body[data-page="game"]` sem alterar posicionamento nem lógica de `canShoot`.
