# Diagnóstico técnico da camada visual e plano de refinamento UI/UX

**Projeto:** Gol de Ouro  
**Data:** 2026-03-18  
**Modo:** UI/UX cirúrgico (pixel-perfect + arquitetura limpa)  
**Referências:** docs/RELATORIO-MESTRE-HANDOFF-GOLDEOURO-V1.md, docs/STATUS-GERAL-GOLDEOURO.md

---

## Parte 1 — Diagnóstico técnico da camada visual atual

### 1.1 Arquitetura atual (game viewport + overlays + scaling)

| Camada | Implementação atual | Arquivo(s) |
|--------|---------------------|------------|
| **Viewport** | `.game-viewport`: inline `width: 100vw`, `height: 100dvh`, `overflow: hidden`, `display: flex`, `alignItems: center`, `justifyContent: center`. Sem regras em CSS (apenas inline). | GameFinal.jsx ~546–555 |
| **Scale** | `.game-scale`: inline `transform: scale(gameScale)`, `transformOrigin: 'center center'`, `width: 1920`, `height: 1080`, `position: 'relative'`. Escala = `Math.min(innerWidth/1920, innerHeight/1080)`. | GameFinal.jsx ~523–529, 558–561 |
| **Stage** | `.game-stage`: inline `width`, `height` (1920×1080), `position: relative`, `overflow: hidden`, `background: '#0b3a1d'`. | GameFinal.jsx ~562–568 |
| **Overlays** | `createPortal(<img />, #game-overlay-root)`. Cada `<img>` com estilo inline: `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`, dimensões de `OVERLAYS.SIZE.*` (px fixos). | GameFinal.jsx ~762–865, index.html |
| **Config** | `layoutConfig.js`: STAGE 1920×1080, BALL.SIZE 90, GOALKEEPER.SIZE 423×500, TARGETS, OVERLAYS.SIZE (GOOOL 520×200, DEFENDEU 520×200, GANHOU 480×180, GOLDEN_GOAL 600×220), duração das animações. | layoutConfig.js |

**Fluxo de escala:** `window.innerWidth/innerHeight` → `calculateScale()` → `gameScale` → aplicado em `.game-scale` com `transform-origin: center center`. O stage mantém sempre 1920×1080 em px; o “zoom” é só o scale no container.

---

### 1.2 Pontos fortes (manter)

- **Desacoplamento overlays/jogo:** Overlays em `#game-overlay-root` (fora de `#root` e do stage); não sofrem `transform: scale()` do jogo; centralização viewport com fixed 50% + translate(-50%,-50%).
- **Única fonte de dimensões do stage:** `layoutConfig.js` (STAGE, OVERLAYS.SIZE, etc.); GameFinal usa esses valores.
- **Centralização do stage:** Flex no viewport centraliza o bloco escalado; comportamento correto em relação ao viewport.
- **Keyframes:** pop, gooolPop, ganhouPop preservam `translate(-50%,-50%)` em todos os passos; sem deslocamento durante animação.
- **Resize:** Debounce 200 ms, threshold 0.001 para evitar re-renders excessivos; escala recalculada em `resize`.

---

### 1.3 Pontos de melhoria identificados

#### A — Centralização visual absoluta (pixel-perfect)

| Aspecto | Estado atual | Risco / oportunidade |
|---------|--------------|----------------------|
| Viewport height | `100dvh` no container | `dvh` pode divergir de `window.innerHeight` em alguns browsers (mobile, barra de endereço). O scale usa `innerHeight` → possível desalinhamento fino entre “centro do container” e “centro usado no scale”. |
| Origem do scale | `transform-origin: center center` | Correto; o centro do stage é o centro do elemento. Garantir que nenhum padding/margin no viewport desloque o filho. |
| Overlays | Fixed 50% + translate(-50%,-50%) em px | Centralização matemática correta. Em telas com zoom do browser ou safe-area, o “centro visual” pode não coincidir com 50% em dispositivos com notch/barra. |

**Melhoria:** Alinhar referência de altura (viewport) ao mesmo valor usado no scale (ex.: usar `window.innerHeight` para definir altura do viewport via ref/style, ou documentar e aceitar dvh como padrão e manter scale com innerHeight). Opcional: considerar `env(safe-area-inset-*)` para evitar sobreposição em dispositivos com notch.

---

#### B — Responsividade real (além do scaling)

| Aspecto | Estado atual | Risco / oportunidade |
|---------|--------------|----------------------|
| Stage | Sempre 1920×1080 + scale | Em viewports muito estreitas ou muito largas, o stage fica muito pequeno ou com letterbox/pillarbox grande. Não há breakpoint ou escala mín/máx. |
| Overlays | Dimensões fixas em px (520×200, 480×180, etc.) | Em mobile, overlays podem ocupar boa parte da tela; em desktop 4K, podem parecer pequenos. Proporção viewport/overlay não escala com o tamanho da tela. |
| HUD / textos | layoutConfig em px; parte do CSS em rem/vw (game-scene.css) | Mistura de px fixos (stage) e variáveis/rem (HUD em game-scene). No GameFinal, HUD usa posições em px do layoutConfig; tamanhos de fonte/ícones podem vir do CSS (--stat-*). |
| Goleiro no CSS | `.gs-goalie` com `width: clamp(160px, 20vw, 260px)` (game-shoot.css) | Conflito conceitual: layoutConfig define GOALKEEPER.SIZE 423×500; o CSS usa clamp em vw. O inline no GameFinal (posição/dimensão do goleiro) pode sobrescrever; verificar qual prevalece. |

**Melhoria:** (1) Definir escala mínima e máxima (ex.: min 0.25, max 1.5) para evitar stage microscópico ou gigante. (2) Considerar tamanhos de overlay relativos à viewport (vw/vh ou clamp) em uma segunda fase, sem quebrar o contrato atual. (3) Unificar critério de tamanho do goleiro (só layoutConfig + inline, ou só CSS responsivo) após checagem de especificidade.

---

#### C — Desacoplamento jogo / overlays

| Aspecto | Estado atual | Risco / oportunidade |
|---------|--------------|----------------------|
| DOM | Overlays em `#game-overlay-root` (irmão de `#root`) | Correto; desacoplado. |
| Estilo | Overlays 100% inline no JSX; CSS em game-shoot.css só para keyframes e para `.game-stage .gs-*` (não atingem o portal) | Inline vence; nenhuma regra externa altera posição/tamanho do overlay no portal. |
| Dependência de resultado | Estado React (showGoool, showGanhou, etc.) + timers; sem lógica de jogo dentro do overlay | Correto. |

**Melhoria:** Manter como está. Opcional: extrair constantes de duração (GOOOL 1200, GANHOU 5000, etc.) para um único módulo (já existente em layoutConfig.OVERLAYS.ANIMATION_DURATION) e garantir que o JSX use apenas esse módulo para timing.

---

#### D — Proporções visuais (goal, ball, overlays)

| Elemento | Base (layoutConfig) | Observação |
|----------|---------------------|------------|
| Stage | 1920×1080 (16:9) | Fixo; proporção preservada pelo scale. |
| Bola | SIZE 90px | Proporção com stage: 90/1920 ≈ 4,7% da largura. |
| Goleiro | SIZE 423×500 (layoutConfig); CSS clamp(160px, 20vw, 260px) | Inconsistência: layoutConfig em px de stage; CSS em vw. No GameFinal o goleiro usa posições e possivelmente tamanho do layoutConfig via inline — confirmar se width/height do `<img>` do goleiro vêm do layoutConfig ou do CSS. |
| Overlays | GOOOL 520×200, DEFENDEU 520×200, GANHOU 480×180, GOLDEN_GOAL 600×220 | Proporções fixas; em 1920×1080, GOOOL ocupa ~27% da largura e ~18,5% da altura. |

**Melhoria:** (1) Revisar uso de GOALKEEPER.SIZE vs .gs-goalie no CSS; adotar uma única fonte (recomendado: layoutConfig + inline no GameFinal). (2) Se desejar sensação “premium” em telas grandes, considerar overlays com max-width/max-height em % ou vw/vh mantendo aspect-ratio, em fase posterior.

---

#### E — Timing e sequência do feedback visual

| Evento | Duração atual (layoutConfig) | Uso no código |
|--------|------------------------------|---------------|
| GOOOL | 1200 ms | gooolPop 1.2s; após 1200 ms setShowGanhou(true). |
| GANHOU | 5000 ms | ganhouPop 5s. |
| DEFENDEU | 800 ms | pop 0.8s. |
| GOLDEN_GOAL | 5500 ms | ganhouPop 5s. |

**Melhoria:** Durações já centralizadas em layoutConfig; o código usa OVERLAYS.ANIMATION_DURATION. Possível refinamento: pequenos ajustes (ex.: 1.1s para goool, 4.5s para ganhou) apenas após teste A/B ou validação com usuários; manter valores atuais como padrão estável.

---

#### F — Qualidade perceptiva (premium)

| Aspecto | Estado atual | Oportunidade |
|---------|--------------|--------------|
| Animações | gooolPop, ganhouPop, pop com scale + opacity + brightness | Adicionar easing mais “premium” (ex.: cubic-bezier custom) ou micro-delay entre goool → ganhou. |
| Som | Efeitos por tipo de resultado | Já existem; garantir sincronia com o aparecimento do overlay. |
| Overlays | Dimensões fixas | Em telas muito pequenas, considerar leve scale-down máximo para não cobrir a tela inteira; em telas muito grandes, considerar scale-up máximo. |
| Contraste / legibilidade | objectFit: contain; fundo do stage escuro | Overlays legíveis; possível sombra suave (filter: drop-shadow) nos overlays para destacar do fundo. |

---

### 1.4 Resumo do diagnóstico

| Área | Status | Prioridade de refinamento |
|------|--------|---------------------------|
| Centralização viewport/stage | Estável; possível alinhar 100dvh vs innerHeight | Média |
| Centralização overlays | Estável (fixed 50% + translate) | Baixa |
| Scaling (min/max) | Inexistente; scale pode ficar muito pequeno ou grande | Alta |
| Responsividade overlays | Dimensões fixas em px | Média |
| Goleiro (layoutConfig vs CSS) | Possível conflito de tamanho | Alta (consistência) |
| Timing/sequência | Centralizado em layoutConfig | Baixa (refino fino depois) |
| Sensação premium | Base boa; espaço para easing e proporções | Média |

---

## Parte 2 — Plano incremental de refinamento

Regras do plano: não quebrar o que funciona; não alterar lógica do jogo; não mexer em backend; cada passo validável visualmente; evitar hacks.

---

### Fase 1 — Consistência e limites (fundação)

**Objetivo:** Previsibilidade visual e limites claros de escala.

| # | Ação | Arquivos | Critério de sucesso | Risco |
|---|------|----------|----------------------|-------|
| 1.1 | Introduzir escala mínima e máxima no `calculateScale` (ex.: min 0.2, max 1.2). | GameFinal.jsx | Em viewports extremas, o stage não fica microscópico nem maior que a tela; escala permanece dentro do intervalo. | Baixo |
| 1.2 | Garantir que viewport e scale usem a mesma referência de altura: opção A — manter 100dvh e scale com innerHeight (documentar); opção B — definir altura do viewport com um ref que use innerHeight no mount/resize. | GameFinal.jsx (e opcionalmente 1 linha em CSS) | Sem mudança perceptível em desktop; em mobile, menos risco de “pulo” entre centro do container e centro do scale. | Baixo (opção A) / Médio (opção B) |
| 1.3 | Verificar uso de GOALKEEPER.SIZE no GameFinal (inline do goleiro) e regra .gs-goalie (clamp em vw). Decidir fonte única (recomendado: layoutConfig + inline) e remover ou ajustar a regra conflitante. | GameFinal.jsx, game-shoot.css | Goleiro com tamanho consistente em todos os viewports; uma única fonte de verdade. | Médio |

**Entrega Fase 1:** Scale limitado; possível alinhamento altura viewport/scale; goleiro com proporção consistente. Validação: abrir /game em viewport estreita, larga e normal; conferir que o stage não quebra e que o goleiro mantém proporção correta.

---

### Fase 2 — Overlays e proporções

**Objetivo:** Overlays previsíveis em qualquer viewport, sem quebrar centralização.

| # | Ação | Arquivos | Critério de sucesso | Risco |
|---|------|----------|----------------------|-------|
| 2.1 | Manter dimensões atuais em px como base; adicionar max-width e max-height em vw/vh para overlays (ex.: max-width: 90vw; max-height: 40vh) preservando aspect-ratio (object-fit: contain já ajuda). | GameFinal.jsx (estilo inline dos overlays) ou game-shoot.css (classe aplicada ao portal) | Em telas muito pequenas, overlays não cobrem 100% da tela; em telas grandes, não ficam desproporcionalmente pequenos se quisermos cap no futuro. | Baixo |
| 2.2 | Opcional: aplicar drop-shadow leve nos overlays para aumentar legibilidade sobre fundos variados. | game-shoot.css (nova regra para filhos de #game-overlay-root) ou inline | Overlays levemente destacados; sensação mais “premium”. | Baixo |

**Entrega Fase 2:** Overlays com teto de tamanho em viewports pequenas; opcionalmente sombra. Validação: redimensionar janela e testar gol/defesa/gol de ouro em mobile e desktop.

---

### Fase 3 — Refinamento de timing e animação

**Objetivo:** Sequência e sensação de feedback mais polidas.

| # | Ação | Arquivos | Critério de sucesso | Risco |
|---|------|----------|----------------------|-------|
| 3.1 | Revisar duração goool → ganhou (ex.: 1.2s goool + 0.1s gap + ganhou). Garantir que OVERLAYS.ANIMATION_DURATION seja a única fonte. | layoutConfig.js, GameFinal.jsx (setTimeout que chama setShowGanhou) | Transição goool → ganhou sem sobreposição estranha e sem atraso excessivo. | Baixo |
| 3.2 | Ajustar easing das keyframes (ex.: cubic-bezier(0.34, 1.56, 0.64, 1) para um “pop” mais satisfatório) apenas nas animações de overlay. | game-shoot.css (gooolPop, ganhouPop, pop) | Mesma sequência, sensação ligeiramente mais premium. | Baixo |

**Entrega Fase 3:** Timing centralizado e consistente; easing refinado. Validação: jogar alguns chutes e avaliar sensação da sequência.

---

### Fase 4 — Polimento e safe area (opcional)

**Objetivo:** Comportamento correto em dispositivos com notch e barras.

| # | Ação | Arquivos | Critério de sucesso | Risco |
|---|------|----------|----------------------|-------|
| 4.1 | Considerar env(safe-area-inset-top) / env(safe-area-inset-bottom) no viewport ou no container dos overlays para não cortar em dispositivos com notch. | game-scene.css ou GameFinal.jsx | Em iPhone/Android com notch, conteúdo não fica sob o notch. | Baixo |
| 4.2 | Revisão final: centralização pixel-perfect em 3–5 viewports de referência (ex.: 375×667, 1920×1080, 2560×1440) e documentar “aceito” ou “ajuste fino” por resolução. | N/A (validação) | Relatório curto ou checklist no playbook. | Nenhum |

---

### Ordem recomendada de execução

1. **Fase 1** (1.1 → 1.2 → 1.3): fundação estável e limites de escala.  
2. **Fase 2** (2.1 → 2.2): overlays seguros em qualquer viewport.  
3. **Fase 3** (3.1 → 3.2): timing e easing.  
4. **Fase 4** (4.1 → 4.2): safe area e validação final.

Cada passo deve ser commitado e testado visualmente antes do próximo. Nenhuma alteração em lógica de jogo, backend ou contrato de assets (gol_normal, ganhou_5/100, etc.).

---

*Documento gerado em 2026-03-18. Base para a fase de refinamento visual do projeto Gol de Ouro.*
