# BLOCO F — AUDITORIA PROFUNDA EXCLUSIVA DA PÁGINA /game (READ-ONLY)

**Projeto:** Gol de Ouro  
**Documento:** Auditoria exclusiva da rota /game — candidata a tela oficial final V1  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)

---

## 1. RESUMO EXECUTIVO

A página **/game** é servida pelo componente **GameFinal** e opera **100% com backend simulado** (sem chamadas a API, apiClient ou gameService). O saldo, os chutes, os ganhos e os gols de ouro exibidos no HUD são **todos de sessão/local**, com valores iniciais **hardcoded** (saldo R$ 100,00, shotsUntilNext 10). A estrutura visual e a navegação (sem sidebar, botões MENU PRINCIPAL e RECARREGAR) estão alinhadas às decisões; a responsividade usa escala JS (transform: scale) sobre um stage fixo 1920×1080, com CSS condicional para retrato (aviso "gire o dispositivo").  

**Conclusão objetiva:** A **/game pode ser mantida como tela oficial final da V1** desde que seja submetida a **ajustes cirúrgicos** obrigatórios: trocar a simulação pelo backend real (gameService/API), alimentar o HUD com totais da conta (saldo, chutes, ganhos, gols de ouro vindos do perfil/API) e garantir que o viewport ocupe o máximo da tela no mobile (100dvh/100vh explícitos). **Não é necessário redefinição estrutural** do componente; a base (layout, HUD, overlays, botões, áudio) está válida e pode ser reaproveitada.

---

## 2. ESTRUTURA REAL DA ROTA /game

### 2.1 Definição no App.jsx

```jsx
<Route path="/game" element={
  <ProtectedRoute>
    <GameFinal />
  </ProtectedRoute>
} />
```

- **Rota:** `/game` (exata; não há subrotas).
- **Proteção:** Envolvida por `ProtectedRoute`; usuário não autenticado é redirecionado para `/`.
- **Componente renderizado:** `GameFinal` (import: `import GameFinal from './pages/GameFinal'`).
- **Contextos aplicados:** AuthProvider e SidebarProvider (pai); GameFinal **não** usa `useSidebar()` nem renderiza `Navigation`.

### 2.2 Cadeia de renderização

```
App
  └── Router > Routes
        └── Route path="/game"
              └── ProtectedRoute
                    └── GameFinal
                          ├── Logo (componente filho)
                          ├── layoutConfig (STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, getTargetPosition, etc.)
                          ├── Assets locais (imagens goleiro, bola, fundo, overlays)
                          └── createPortal (overlays no document.body)
```

Nenhum outro componente de página (Game, GameShoot, etc.) é usado na rota `/game`.

---

## 3. COMPONENTE REAL USADO

- **Arquivo:** `goldeouro-player/src/pages/GameFinal.jsx`
- **Nome do componente:** `GameFinal`
- **Comentário no código (linhas 1–7):** "Backend simulado | Estado único | Sem loops | Sem travamentos"
- **Imports relevantes:**
  - React, hooks (useState, useEffect, useCallback, useRef, useMemo)
  - createPortal (react-dom)
  - useNavigate (react-router-dom)
  - toast (react-toastify)
  - Logo (../components/Logo)
  - layoutConfig (../game/layoutConfig.js)
  - game-scene.css, game-shoot.css
  - Imagens locais (goalie_*, ball, bg_goal, goool, defendeu, ganhou, golden-goal)

**Não há import de:** apiClient, gameService, fetch, axios ou qualquer módulo que chame API. A busca no arquivo por `apiClient|gameService|fetch|axios|/api/` não retorna ocorrências.

---

## 4. ORIGEM REAL DE CADA DADO DO HUD

| Item do HUD        | Variável/estado em GameFinal       | Origem real                                                                 |
|--------------------|------------------------------------|-----------------------------------------------------------------------------|
| **Logo**           | Componente `<Logo size="small" />` | Asset `/images/Gol_de_Ouro_logo.png` (ou fallback em texto).                |
| **SALDO**         | `balance` (useState)               | **Simulado.** Inicializado por `simulateInitializeGame()` → `userData.saldo` (hardcoded 100.00). Atualizado em cada chute por `simulateProcessShot()` → `user.newBalance` (fórmula local). |
| **CHUTES**         | `shotsTaken` (useState)             | **Sessão.** Contador local incrementado no handleShoot (`setShotsTaken(prev => prev + 1)`). Não vem de API nem de totais da conta. |
| **GANHOS**         | `totalWinnings` (useState)         | **Sessão.** Acumulado local no handleShoot quando isGoal (`setTotalWinnings(prev => prev + totalPrize)`). Não reflete ganhos totais da conta. |
| **GOLS DE OURO**   | `totalGoldenGoals` (useState)      | **Sessão.** Contador local incrementado quando isGoldenGoal. Não reflete total da conta. |
| **Aposta**         | `betAmount` (const = 1)           | **Hardcoded.** R$ 1,00 por chute; sem seletor.                               |
| **MENU PRINCIPAL** | Botão → `navigate('/dashboard')`   | Navegação correta.                                                          |
| **Recarregar**     | Botão → `navigate('/pagamentos')` | Navegação correta.                                                          |

Resumo: **Saldo é simulado (valor fixo inicial + atualização local). CHUTES, GANHOS e GOLS DE OURO são totais de sessão.** Nenhum dado do HUD vem do backend real nem do perfil da conta.

---

## 5. CONFIRMAÇÃO: BACKEND REAL OU SIMULADO

- **Tipo:** **100% backend simulado.** Não há híbrido nem fallback para API.

### 5.1 Inicialização

- **Função:** `simulateInitializeGame()` (definida no próprio GameFinal.jsx, linhas 39–53).
- **Comportamento:** `await new Promise(resolve => setTimeout(resolve, 500))`; retorna objeto fixo:
  - `userData.saldo: 100.00`
  - `gameInfo.goldenGoal.shotsUntilNext: 10`
- **Uso:** No useEffect de montagem, `const result = await simulateInitializeGame(); setBalance(result.userData?.saldo || 100.00)`; em erro, `setBalance(100.00)`.

Nenhuma chamada a `/api/user/profile`, `/api/games/*` ou equivalente.

### 5.2 Processamento do chute

- **Função:** `simulateProcessShot(direction, betAmount)` (linhas 55–79).
- **Comportamento:** Delay 50 ms; `isGoal = Math.random() < 0.2`; `globalCounter = Math.floor(Math.random() * 100)`; `isGoldenGoal = isGoal && (globalCounter % 10 === 0)`; retorna objeto com prize, goldenGoalPrize, newBalance (fórmula local).
- **Uso:** Em `handleShoot`, `const result = await simulateProcessShot(direction, betAmount)`.

Nenhuma chamada a `apiClient.post('/api/games/shoot', ...)` ou gameService.

### 5.3 Dados fake / mockados / hardcoded

- Saldo inicial: **100.00** (simulateInitializeGame e fallback no catch).
- shotsUntilNext: **10** (simulateInitializeGame).
- newBalance em simulateProcessShot: fórmula com base em 100 e valores do resultado (não persiste em servidor).
- Nenhum placeholder de texto no HUD; os valores exibidos são os dos estados locais acima.

---

## 6. AUDITORIA DE RESPONSIVIDADE E FULLSCREEN

### 6.1 Estrutura de escala (GameFinal.jsx)

- **Stage fixo:** 1920×1080 px (STAGE.WIDTH, STAGE.HEIGHT do layoutConfig).
- **Escala:** `calculateScale()` usa `scaleX = window.innerWidth / 1920`, `scaleY = window.innerHeight / 1080`, `scale = Math.min(scaleX, scaleY)`.
- **Aplicação:** O stage está dentro de um div com `style={{ transform: `scale(${gameScale})`, transformOrigin: 'center center', width: 1920, height: 1080 }}` (gameScaleStyle).
- **Resize:** listener com debounce 200 ms atualiza gameScale; diferença < 0.001 não atualiza para evitar re-renders.

Efeito: **Letterboxing ou pillarboxing** conforme a proporção da janela; o stage mantém 16:9 e é centralizado pelo transform-origin.

### 6.2 Viewport e fullscreen

- **Classe do container:** `game-viewport` (apenas className no JSX; não há regra em game-scene.css, game-shoot.css ou index.css definindo altura/largura para `.game-viewport`).
- **Consequência:** O div é block e ocupa a largura do pai; a altura segue o conteúdo (o div escalado). Não há uso de `100vh`, `100dvh`, `100svh` ou `viewport-fit` no container da /game.
- **body quando em /game:** `body[data-page="game"]` em game-scene.css tem `margin:0; overflow:hidden; background:transparent`. Não define height da página.
- **Mobile/retrato:** Em `@media (orientation: portrait)` o mesmo CSS exibe `.game-rotate` (aviso para girar) e esconde `.game-stage-wrap`. GameFinal não usa a classe `game-stage-wrap`; usa `game-viewport` > `game-scale` > `game-stage`. Portanto o aviso de rotação **pode não aparecer** na estrutura atual (as classes aplicadas são outras). O stage continua visível em retrato, apenas escalado.

### 6.3 Variáveis CSS e breakpoints

- **game-scene.css:** Define `--vh: 1vh` e variáveis para stat gaps, ícones, labels, etc., com breakpoints 768px e 1024px para o HUD. Há referências a `--pf-w`, `--pf-h`, `--pf-ox`, `--pf-oy` em regras de `.game-stage-wrap` e `#stage-root`; GameFinal não usa `#stage-root` nem `.game-stage-wrap`, então essas variáveis **não são aplicadas** ao layout atual da /game.
- **game-shoot.css:** Contém `.gs-wrapper`, `.gs-stage` com tamanhos fixos (1200×675, depois 1000×562, etc. em media queries). GameFinal não usa a classe `gs-wrapper`; usa `game-viewport` e `game-scale`, então essas regras de tamanho fixo **não se aplicam** ao componente.

Conclusão responsividade: a /game depende da escala JS e do tamanho do pai (App). Para **ocupar o máximo da tela no mobile** e tratar barra do navegador/notch, será necessário definir explicitamente altura (ex.: 100dvh) no container da /game e, se desejado, alinhar o aviso de rotação à estrutura real (game-viewport/game-scale/game-stage).

### 6.4 Overflow e touch

- body com `overflow: hidden` quando `data-page="game"` evita scroll da página.
- Zonas de chute são botões com tamanho fixo em px (targetSize do layoutConfig, ex. 60 ou 100); em telas muito pequenas podem ficar apertadas.

---

## 7. PROBLEMAS ENCONTRADOS

### 7.1 Críticos (impedem uso como V1 real)

1. **Backend 100% simulado** — Saldo e chutes não persistem no servidor; jogador não joga “de verdade” na rota principal.
2. **Saldo do HUD simulado** — Início em R$ 100,00 e atualização local; não reflete conta real.
3. **CHUTES e GANHOS de sessão** — Decisão exige totais da conta; hoje são contadores locais.
4. **GOLS DE OURO de sessão** — Mesmo caso; deve refletir total da conta.

### 7.2 Importantes (UX / decisões)

5. **ToastContainer ausente no App** — GameFinal usa `toast.success` / `toast.error` / `toast.info`; sem container as notificações podem não aparecer.
6. **Viewport sem altura explícita** — `.game-viewport` não tem 100vh/100dvh; /game pode não ocupar toda a tela no mobile.
7. **Aviso de rotação em retrato** — CSS usa `.game-stage-wrap` e `.game-rotate`; GameFinal usa outra estrutura, então o aviso pode não ser exibido.
8. **Variáveis de playfield (--pf-*) não usadas** — Parte do CSS de game-scene assume #stage-root / .game-stage-wrap; não se aplica ao DOM atual.

### 7.3 Menores

9. **shotsUntilGoldenGoal** — Inicializado em 10 pela simulação; após chute usa `10 - (globalCounter % 10)` (lógica local, não alinhada à regra real de 1 a cada 1000 chutes).
10. **sessionWins** — Estado existe mas não é exibido no HUD; sem impacto direto na decisão.

---

## 8. ITENS JÁ VALIDADOS

- **Componente em /game:** GameFinal (confirmado no App.jsx).
- **Sem sidebar:** GameFinal não importa nem renderiza Navigation; navegação por botões (MENU PRINCIPAL, Recarregar).
- **HUD contém:** Logo, Saldo, Chutes, Ganhos, Gols de Ouro, aposta fixa R$ 1,00, MENU PRINCIPAL — estrutura alinhada à decisão.
- **Sem seleção de múltiplas apostas:** betAmount = 1; nenhum seletor R$1/R$2/R$5/R$10.
- **Aposta fixa:** R$ 1 por chute.
- **Tela imersiva:** Sem menu lateral; apenas HUD, zonas de chute, goleiro, bola e botões de ação.
- **Overlays de resultado:** goool, defendeu, ganhou, golden-goal via createPortal no body; animações e durações definidas no layoutConfig.
- **Áudio:** kick, gol, defesa, torcida; controle de mute no HUD.
- **Zonas de chute:** TL, TR, C, BL, BR; posições e tamanhos via layoutConfig; botões desabilitados quando saldo < aposta ou fase !== IDLE.
- **Navegação dos botões:** MENU PRINCIPAL → /dashboard; Recarregar → /pagamentos.
- **Proteção da rota:** /game só acessível com usuário autenticado (ProtectedRoute).

---

## 9. ITENS QUE PRECISARÃO SER MODIFICADOS

### 9.1 Obrigatórios para V1 oficial

1. **Substituir simulação por backend real** — Inicialização: buscar saldo e dados do jogo (ex.: gameService.initialize() ou API de perfil + métricas). Chute: chamar API (ex.: gameService.processShot ou POST /api/games/shoot) e atualizar estado com a resposta.
2. **Saldo real no HUD** — Fonte: resposta da API de perfil (ou equivalente). Remover simulateInitializeGame e fallback 100.00.
3. **CHUTES como total da conta** — Fonte: perfil ou endpoint de estatísticas (ex.: total_chutes / total_apostas). Remover uso exclusivo de shotsTaken de sessão no HUD (ou manter contador de sessão apenas como complemento, se definido).
4. **GANHOS como total da conta** — Fonte: perfil (ex.: total_ganhos). Remover uso exclusivo de totalWinnings de sessão no HUD.
5. **GOLS DE OURO como total da conta** — Fonte: perfil ou métricas. Remover uso exclusivo de totalGoldenGoals de sessão no HUD.
6. **Garantir toasts** — Adicionar ToastContainer no App (ou layout que envolva as rotas) para que feedback de gol, defesa e erros apareça.

### 9.2 Recomendados

7. **Viewport fullscreen no mobile** — Definir no container da /game (ex.: .game-viewport) altura mínima 100dvh (ou 100vh) e garantir que o stage escalado preencha o máximo da tela.
8. **Aviso de rotação** — Ajustar game-scene.css (ou estrutura) para que, em orientation: portrait, o aviso “gire o dispositivo” apareça na árvore real (game-viewport / game-scale / game-stage) ou aplicar classes usadas pelo GameFinal.
9. **shotsUntilGoldenGoal** — Passar a vir da API (ex.: métricas globais / regra 1 a cada 1000 chutes) em vez da lógica local atual.

### 9.3 O que não deve ser tocado (estrutura estável)

- Arquitetura do stage 1920×1080 com escala JS (calculateScale + transform).
- layoutConfig.js (posições, tamanhos, durações de overlay).
- Estrutura do HUD (logo, estatísticas, aposta fixa, botões).
- Overlays (createPortal, imagens, animações).
- Zonas de chute (TL, TR, C, BL, BR) e handleShoot (validação de fase, saldo, direção).
- Botões MENU PRINCIPAL e Recarregar e respectivas rotas.
- Áudio (sons de chute, gol, defesa, torcida; mute).
- Componente Logo e assets locais do jogo.

---

## 10. CONCLUSÃO OBJETIVA

- **/game pronta para cirurgia final?** **Não** — ainda depende de integração com backend real e de HUD com totais da conta (saldo, chutes, ganhos, gols de ouro).
- **/game não pronta?** **Sim** — no estado atual é apenas protótipo/demo com simulação; não atende critério de “tela oficial V1” com persistência e dados reais.
- **/game precisa de redefinição estrutural?** **Não** — O layout, o HUD, os overlays, a navegação e a responsividade por escala estão coerentes com as decisões. Basta **trocar a fonte dos dados** (simulação → API) e **ajustar viewport/aviso de rotação** para que **/game possa ser mantida como tela oficial final da V1** após os ajustes cirúrgicos descritos.

---

## REFERÊNCIAS

- `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`
- `docs/ROADMAP-V1-GOLDEOURO.md`
- `docs/relatorios/AUDITORIA-BLOCO-F-INTERFACE-2026-03-09.md`
- `docs/relatorios/BLOCO-F-REVISAO-FINAL-READONLY-2026-03-09.md`
- Código: `goldeouro-player/src/App.jsx`, `pages/GameFinal.jsx`, `game/layoutConfig.js`, `pages/game-scene.css`, `pages/game-shoot.css`, `pages/game-scene-mobile.css`, `components/Logo.jsx`, `index.css`

---

*Auditoria read-only. Nenhum arquivo ou código foi alterado.*
