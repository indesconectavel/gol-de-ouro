# H3.0E — DIAGNÓSTICO PERFORMANCE /GAME MOBILE

**Data:** 2026-05-15 / 2026-05-16  
**Modo:** READ-ONLY (sem alteração de código, deploy, backend ou financeiro).  
**Contexto:** H3.0B em produção após H3.0D; queixa de **/game pesada ou travando** em celular; smoke humano portrait/landscape ainda pendente; possível **Service Worker / cache PWA**.

---

## 1. Resumo executivo

O runtime público em `www.goldeouro.lol` continua a servir o bundle **`index-QE2VypN5.js`** e CSS **`index-DMJTzLg7.css`**, com **`viewport-fit=cover`** no HTML — alinhado ao que foi validado na série H3.0D.

A análise estática do **`GameFinal.jsx`** e dos CSS **`game-scene.css`** / **`game-shoot.css`** aponta **várias fontes simultâneas de custo em mobile**, sem um único “culpado” comprovado sem trace em hardware:

- **Stage virtual 1920×1080** com `transform: scale()` sobre um subtree grande (compositing).
- **Muitas texturas PNG/JPG** (goleiro, bola, fundo, overlays) com **tamanho agregado relevante em disco** e, após decode, **pressão de memória de GPU/bitmap**.
- **`backdrop-filter: blur(...)`** no HUD e no cartão “Gire o celular” — historicamente **caro em GPUs móveis**, especialmente sobre conteúdo que muda (animações/transições).
- **Áudio em loop** (`torcida.mp3`) + **vários `Audio`** pontuais (chute, gol com `timeupdate`, defesa).
- **PWA (vite-plugin-pwa)** com precache amplo de estáticos e caching de imagens — risco de **clientes com SW/cache antigo** e de **primeira carga pesada** após updates.

**Lighthouse mobile / Performance trace** não foi obtido como artefacto fechado neste runner (tentativa com Lighthouse headless **não concluiu no tempo observado**). A classificação final reflete **hipóteses bem fundamentadas em código + pesos de ficheiros**, não medição de FPS/long tasks em aparelho alvo.

**Classificação final:** **OTIMIZAÇÃO COM RESSALVAS** (ver secção 13).

---

## 2. Runtime atual

| Verificação | Resultado |
|-------------|-----------|
| `GET https://www.goldeouro.lol/` | HTTP 200 |
| Meta viewport | contém **`viewport-fit=cover`** |
| JS principal (referência no HTML) | `/assets/index-QE2VypN5.js` |
| CSS principal | `/assets/index-DMJTzLg7.css` |
| Marcadores H3.0B no bundle | validados na H3.0D por substring no JS público (`Gire`, `game-rotate`, `Saldo insuficiente`); **minificado numa linha** — grep por linha no Windows falha por limite do `findstr` |

**Nota técnica:** o ficheiro JS minificado é servido com **`Content-Encoding: br`** (Brotli). O **`Content-Length`** sem compressão reportado pelo servidor foi **401040 bytes** (~391 KiB) para o corpo “raw” documentado no HEAD sem negociação igual à do browser.

---

## 3. Bundle e assets

### 3.1 Bundles principais (produção)

| Recurso | Tamanho (corpo indicado pelo servidor, conforme HEAD) | Observação |
|---------|---------------------------------------------------------|------------|
| `index-QE2VypN5.js` | **401040** bytes | App React + rotas + jogo empacotados num único entry significativo |
| `index-DMJTzLg7.css` | **110985** bytes (~108 KiB) | Inclui estilos globais do projeto + `/game` |

**Interpretação:** o JS **não é gigante** para uma SPA moderna; o “peso percebido” em mobile tende a vir mais de **decode de imagens**, **compositing**, **blur GPU** e **áudio** do que só do número de KB transferidos do bundle.

### 3.2 Imagens importadas por `GameFinal.jsx` (ficheiros em `src/assets/`)

| Ficheiro | Bytes (aprox.) |
|----------|----------------|
| `goalie_dive_tl.png` | 143191 |
| `goalie_dive_tr.png` | 125144 |
| `goalie_dive_mid.png` | 103754 |
| `goalie_dive_br.png` | 100808 |
| `goalie_dive_bl.png` | 99780 |
| `goalie_idle.png` | 95777 |
| `ball.png` | 129074 |
| `bg_goal.jpg` | 422810 |
| `gol_de_ouro.png` | 285511 |
| `gol_normal.png` | 278907 |
| `ganhou_5.png` | 325513 |
| `ganhou_100.png` | 247669 |
| `defendeu.png` | 103368 |

**Total bruto em disco (ordem de grandeza): ~2,15 MiB** só nestas texturas referenciadas pelo `/game`. Em runtime, o custo relevante é o **decode + mantimento em memória** quando as imagens são usadas ou pré-carregadas pelo navegador, não só o download.

### 3.3 Áudio (`public/sounds/` — relevante ao fluxo /game)

| Ficheiro | Bytes | Uso típico em `/game` |
|----------|-------|------------------------|
| `torcida.mp3` | 763287 | Loop em `<audio>` persistente (`crowdAudioRef`) quando não muted e não loading |
| `gol.mp3` | 551459 | Gol — listeners `loadedmetadata` / `timeupdate` |
| `kick.mp3` | 6245 | Chute |
| `defesa.mp3` | 10466 | Defesa (via callback) |
| `music.mp3` | 6082388 | **Não** é tocada na rota `/game` porque `musicManager.stopMusic()` corre ao montar `GameFinal` |
| `torcida_2.mp3` | 1220353 | Usada pelo `musicManager` em outros fluxos; **não** é o loop principal do `GameFinal` |

### 3.4 Service Worker / PWA

Configuração em **`vite.config.ts`** (`vite-plugin-pwa`):

- **`registerType: 'autoUpdate'`** — atualiza SW quando há novo build, mas **clientes podem manter assets antigos até reload/atualização efetiva**.
- **`workbox.globPatterns`**: `**/*.{js,css,html,svg,png,webp,woff2}` — precache **amplo** de estáticos (impacto na **primeira instalação/atualização** do cache).
- **Runtime caching** para `.fly.dev` (NetworkFirst) e imagens (StaleWhileRevalidate).

O **`dist/index.html`** injeta **`/registerSW.js`** (script `vite-plugin-pwa`), ou seja, **SW está ativo em builds de produção**.

---

## 4. Análise GameFinal

**Ficheiro:** `goldeouro-player/src/pages/GameFinal.jsx`

Pontos com impacto em performance:

1. **Stage fixo 1920×1080** (`layoutConfig.STAGE`) com **`transform: scale(gameScale)`** aplicado ao wrapper `.game-scale` — escala toda a árvore visual; em mobile isso força **camadas grandes** e pode aumentar custo de **paint/composite** quando há blur/transitions sobrepostos.

2. **`calculateScale`** depende de `window.innerWidth` / `innerHeight`; **`resize` com debounce 200ms** atualiza `gameScale` só se diferença > 0.001 — **bom** para evitar re-render em excesso; **troca de orientação** continua a disparar **recálculo + possível repintura completa** ao voltar para landscape.

3. **Imagens grandes absolutas:** fundo `bg_goal.jpg` cobre `stageWidth × stageHeight`; goleiro com **`willChange: 'transform'`** — ajuda a animação do goleiro mas não reduz o custo do cenário inteiro.

4. **Áudio:** loop `torcida.mp3` + instâncias `new Audio(...)` em sons pontuais — **threads de áudio/decodificação** e possível contenção em aparelhos fracos.

5. **`musicManager`** importado **singleton** (`musicManager.js`): no carregar do módulo tenta criar **`AudioContext`** — custo inicial pequeno mas não zero; em `/game` a música de página é parada explicitamente.

6. **Sem `requestAnimationFrame` contínuo** nem `setInterval` de game loop **encontrados** neste ficheiro pelos greps orientados a timers — o jogo é **centrado em CSS transitions + atualizações de estado React por fase**.

---

## 5. Análise CSS / animações

### `game-scene.css`

- Animações curtas de entrada (`gameG4LoadingIn`, `gameG4StageEnter`) + **pulse infinito** no loading (`gameG4LoadingPulse`) — só relevante ao ecrã “Carregando jogo…”.
- **`backdrop-filter: blur(8px)`** em `.hud-header` — custo GPU elevado em muitos Android/WebView.
- Em **portrait**, `.rotate-card` usa **`backdrop-filter: blur(6px)`** — overlay fullscreen com blur.
- Media query **`prefers-reduced-motion`** desliga parte das animações — **bom**, mas depende do SO/browser respeitar preferência.

### `game-shoot.css`

- **`animation: pulse 2s infinite`** em `.queue-status` (escopo legado/.gs-hud — pode não estar ativo no HUD atual do GameFinal, mas o CSS está incluído no bundle global).
- Keyframes **`gooolPop`**, **`ganhouPop`**, **`pop`** para overlays de resultado — animações de transform/opacity **localizadas**, tipicamente aceitáveis se não combinadas com blur fullscreen.

**Reflow/layout thrashing:** o modelo usa **posicionamento absoluto** em px dentro do stage escalado — menos thrashing clássico de flex que reflow constante, mas **mudanças de escala** podem invalidar composição da árvore inteira.

---

## 6. Áudio / imagens / cache

| Área | Diagnóstico |
|------|-------------|
| **Imagens** | Muitas PNGs grandes + JPG de fundo; custo de **decode** e **memória** é o principal suspeito visual |
| **Áudio** | Loop `torcida.mp3` (~745 KiB) contínuo; `gol.mp3` grande (~538 KiB) com listener `timeupdate` durante reprodução |
| **Cache PWA** | Precache amplo + SW pode **atrasar percepção de update** e manter assets antigos até ciclo de atualização |
| **Rede** | MP3 **não** está no `globPatterns` do precache listado; mesmo assim o browser pode manter cache HTTP/SW conforme políticas |

---

## 7. Performance mobile

| Artefacto | Estado |
|-----------|--------|
| **Lighthouse (mobile)** | **Não disponível neste relatório** — execução headless iniciada mas **sem conclusão observada no tempo útil** |
| **Performance trace / long tasks** | **Não capturado** — recomenda-se Chrome DevTools ou Safari Web Inspector no dispositivo |
| **FPS / memória** | **Não medido** |
| **Console warnings** | Diagnóstico READ-ONLY sem sessão estável instrumentada aqui; recomenda-se validar em janela anónima pós-limpeza de dados do site |

**Inferência:** sintomas “pesado/travando” em celular são **compatíveis** com combinação de **blur + stage escalado + texturas grandes + áudio**, especialmente em **WebViews antigas** ou terminais de entrada.

---

## 8. Orientação portrait / landscape

| Modo | Comportamento (CSS H3.0B + JSX) |
|------|--------------------------------|
| **Portrait** | Overlay **“Gire o celular”** fullscreen; **palco oculto** (`display:none` em `.game-scale`) — reduz trabalho de pintura do jogo, mas overlay usa **blur** |
| **Landscape** | Palco visível; resize/orientation dispara **listener `resize`** (debounced) → possível **picos de jank** ao rodar o aparelho |
| **Smoke humano** | **Pendente** (conforme H3.0D): refresh, alternância de orientação, um chute visual |

---

## 9. Regra saldo para chutar

**Frontend (`GameFinal.jsx`):**

- `canShoot = gamePhase === GAME_PHASE.IDLE && balance >= betAmount`
- Botões das zonas: **`disabled={!canShoot}`**
- No handler: se `balance < betAmount`, **`toast.error`** com texto **`Saldo insuficiente. Seu saldo: R$ … Aposta: R$ …`** — mensagem **explícita e adequada** ao utilizador.

**Backend (`server-fly.js`, apenas confirmação READ-ONLY):**

- `POST /api/games/shoot` valida saldo em Supabase; respostas com **`message: 'Saldo insuficiente'`** em saldo baixo e também via erro RPC `SHOOT_APPLY_SALDO_INSUFICIENTE`.

**Conclusão:** dupla camada **frontend + backend** está presente; não há alteração recomendada neste modo READ-ONLY.

---

## 10. Causas prováveis (ordenadas por plausibilidade combinada em mobile)

1. **Decode e memória de imagens** (várias PNG grandes + fundo JPG em stage “full”).  
2. **`backdrop-filter` no HUD** (e no overlay portrait) sobre grandes áreas / compositing complexo.  
3. **`transform: scale()` do palco inteiro 1920×1080** — camada grande e sensível a repaint.  
4. **Áudio em loop + picos de decode** (`torcida`, `gol`).  
5. **Service Worker / cache** — percepção de “app velho” ou dupla carga durante atualização.  
6. **Limitações normais de browser/WebView** em hardware fraco — sintomas exacerbadas pelos itens acima.  
7. **React re-renders** — mitigados por `useMemo` no estilo de escala e debounce no resize; **não** há loop contínuo evidente no código.

---

## 11. Riscos

- **Falso diagnóstico sem trace:** o utilizador pode estar em **rede lenta**, **bateria baixa (throttling)** ou **WebView empresarial** com políticas agressivas — não distinguível só por revisão de código.
- **Regressão visual:** remover blur ou alterar assets sem mockups pode mudar identidade UI — fora do escopo deste modo READ-ONLY.
- **PWA:** push de novos builds sem comunicação pode gerar **suporte** (“ainda não atualizou”) até flush de cache.

---

## 12. Recomendações de correção mínima (para fase futura, **não** aplicadas aqui)

Ordem sugerida por **custo/benefício relativo** (a validar com medição):

1. **Medir primeiro:** Lighthouse mobile + Performance recording no **mesmo aparelho** que reproduz o problema; identificar **Main thread long tasks** vs **GPU**.
2. **Reduzir custo de blur em mobile:** fallback sem `backdrop-filter` (sólido semi-transparente) **apenas abaixo de breakpoint ou `prefers-reduced-transparency`** se suportado.
3. **Imagens:** converter sprites/fundo para **WebP/AVIF** + dimensões máximas coerentes com o palco; lazy-loading das texturas de **resultado** até ao primeiro uso.
4. **Áudio:** bitrate menor nos MP3 longos; opcionalmente **pausar** torcida quando documento não está visível (`visibilitychange`).
5. **PWA:** documentação operacional para QA (“limpar dados do site”) após releases críticos; avaliar se precache pode ser **menos amplo**.

---

## 13. Classificação final

### **OTIMIZAÇÃO COM RESSALVAS**

**Justificativa:**

- Há **evidência objetiva** de **vários fatores de custo** no frontend atual (texturas grandes, blur, stage escalado, áudio, PWA).
- **Não** foi demonstrado bug lógico único nem regressão financeira; o comportamento é compatível com **otimização incremental**.
- **Ressalva principal:** falta **telemetria de performance em dispositivo alvo** (Lighthouse/trace/FPS) para priorizar uma única causa dominante.

---

**Elaborado por:** agente (auditoria READ-ONLY: HTTP, HEAD, leitura de código, pesos de ficheiros).  
**Commits:** nenhum (conforme pedido).
