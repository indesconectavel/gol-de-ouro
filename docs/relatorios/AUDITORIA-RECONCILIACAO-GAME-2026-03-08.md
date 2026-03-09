# AUDITORIA RECONCILIAÇÃO GAME — VISUAL vs FUNCIONAL

**Data:** 2026-03-08  
**Modo:** READ-ONLY total (nenhuma alteração de código, rotas, backend, deploy ou produção).  
**Objetivo:** Entender como reconciliar o layout validado visualmente (próximo de Game.jsx) com a lógica oficial do jogo (GameShoot.jsx) sem quebrar o gameplay.

---

## Contexto confirmado

- **Baseline oficial:** deploy FyKKeg6zb; `/game` e `/gameshoot` montam **GameShoot.jsx**; **Game.jsx** importado mas sem rota.
- **GameShoot** = tela funcional oficial (backend real, lotes, saldo, POST /api/games/shoot).
- **Game.jsx** = blueprint visual alternativo (layout rico, campo em destaque, goleiro/alvos/bola, mas **jogo simulado** sem API).
- **Problema:** O layout validado pelo usuário é muito mais parecido com Game.jsx do que com GameShoot.jsx, gerando confusão histórica.

---

## 1. Inventário completo das telas

### 1.1 Estrutura JSX e componentes

| Aspecto | Game.jsx | GameShoot.jsx |
|---------|----------|----------------|
| **Layout raiz** | `min-h-screen flex`; Navigation + conteúdo com margem sidebar | `min-h-screen` gradient; Navigation + conteúdo com margem sidebar |
| **Componentes usados** | Navigation, Logo, GameField, BettingControls, SoundControls, AudioTest, RecommendationsPanel | Navigation, Logo (não usado no JSX), nenhum componente de campo reutilizável |
| **Campo de jogo** | **GameField** (componente dedicado: estádio, gramado, gol com rede, 6 alvos, goleiro, bola) | **Inline** no JSX: div 400×300px, gramado, gol, 5 zonas (TL/TR/C/BL/BR), bola e goleiro como divs posicionadas |
| **Header** | Seta voltar + Logo + "Gol de Ouro" + espaçador | Card: "⚽ Gol de Ouro", "Escolha uma zona...", Saldo R$, botão "Recarregar" |
| **Controles de aposta** | BettingControls (+/- chutes, R$ fixo 1, saldo) + bloco "Status da Partida" (Seus Chutes, Total Partida, Investimento, barra progresso) | Grid de botões R$ 1, 2, 5, 10; texto "Valor da Aposta"; chance por aposta |
| **Navegação inferior** | Botão fixo "Menu" (canto inf. esq.) + "Nova Partida" / "Voltar ao Dashboard" condicionais | "🔊 Áudio ON/OFF" + "📊 Dashboard" (não fixos) |
| **Resultados/feedback** | Seção "Status do Jogo" (waiting/playing/result) + lista "Seus Resultados" + "Ganhos Totais" | Toasts (toast.success, toast.info, toast.error) + overlays "GOOOL!" / "DEFENDEU!" / "GOL DE OURO!" no campo |
| **Extras** | SoundControls, AudioTest, RecommendationsPanel (IA) | Sistema Gol de Ouro (chutes até próximo), estatísticas (Gols, Defesas, Sequência, Gols de Ouro) |

### 1.2 Hooks

| Game.jsx | GameShoot.jsx |
|----------|----------------|
| useNavigate, useSidebar | useNavigate, useSidebar |
| useSimpleSound (playButtonClick, playCelebrationSound, playCrowdSound, playBackgroundMusic) | — (áudio local via estado audioEnabled) |
| useGamification (addExperience, updateUserStats, getUserStats) | — |
| usePlayerAnalytics (updatePlayerData, getCurrentRecommendations) | — |
| useState (múltiplos: playerShots, totalShots, gameStatus, gameResults, currentShot, selectedZone, gameResult, balance, betAmount, isShooting, gameStats) | useState (balance, currentBet, shooting, error, loading, ballPos, targetStage, goaliePose, goalieStagePos, showGoool/showDefendeu/..., shotsTaken, sessionWins/Losses, streaks, gameInfo, globalCounter, shotsUntilGoldenGoal, audioEnabled) |
| useCallback (handleShoot, resetGame, addShots, removeShots) | — (handleShoot, resetAnimations, handleBetChange, toggleAudio como funções normais) |
| useMemo (goalZones, totalWinnings, totalInvestment) | — (GOAL_ZONES e DIRS constantes) |

### 1.3 Estado

| Game.jsx | GameShoot.jsx |
|----------|----------------|
| **Jogo** | playerShots, totalShots (0–10), gameStatus (waiting/playing/result), currentShot, selectedZone, gameResult, gameResults[], isShooting | shooting, balance, currentBet, ballPos, targetStage, goaliePose, goalieStagePos, showGoool/showDefendeu/showGoldenGoal/... |
| **Financeiro** | balance (inicial 21), betAmount (fixo 1) | balance (vindo do backend), currentBet (1–10) |
| **Stats** | gameStats (totalGoals, totalBets, currentWinStreak, dailyWinnings, goalsPerZone) | shotsTaken, sessionWins, sessionLosses, currentStreak, bestStreak, totalGoldenGoals |
| **Sistema** | — | gameInfo, globalCounter, shotsUntilGoldenGoal, loading, error |
| **Áudio** | via useSimpleSound | audioEnabled |

### 1.4 Handlers e integração backend

| Game.jsx | GameShoot.jsx |
|----------|----------------|
| **handleShoot(zoneId)** | **handleShoot(dir)** |
| Lógica local: setTimeout 2s, Math.random() > 0.4 para gol, atualiza balance/gameResults/gameStats, confetti, sons, updatePlayerData/addExperience/updateUserStats | Chama **gameService.processShot(dir, currentBet)** → POST /api/games/shoot; atualiza balance/globalCounter a partir da resposta; animações bola/goleiro; toasts |
| **resetGame** | resetAnimations (apenas estados visuais) |
| **addShots / removeShots** (BettingControls) | handleBetChange (valor 1–10) |
| **Nenhuma chamada a API de jogo** | **gameService.initialize()** (profile + metrics); **gameService.processShot()**; gameService.getShotsUntilGoldenGoal(), getBetConfig() |

---

## 2. Análise do gameplay real (GameShoot)

| Elemento | Implementação |
|----------|----------------|
| **Integração backend** | gameService (singleton): loadUserData (GET /api/user/profile), loadGlobalMetrics (GET /api/metrics), processShot (POST /api/games/shoot com direction + amount). |
| **POST /api/games/shoot** | Payload: `{ direction, amount }`. Resposta: novoSaldo, contadorGlobal, result (goal/defense), premio, premioGolDeOuro, isGolDeOuro, loteId, etc. |
| **Controle de saldo** | balance vindo de userData.saldo; atualizado por result.novoSaldo após cada chute; botões desabilitados se balance < currentBet. |
| **Estado do chute** | shooting (boolean); durante o chute: animação da bola (targetStage, ballPos), goleiro (goaliePose, goalieStagePos). |
| **Controle de tentativa** | Um chute por vez; shooting bloqueia novo chute; balance < currentBet desabilita zonas. |
| **Feedback visual** | Overlays "GOOOL!", "DEFENDEU!", "GOL DE OURO!" no campo; botões de zona desabilitados com estilo cinza. |
| **Toasts** | toast.success (gol, gol de ouro), toast.info (defesa), toast.error (erro de rede/saldo). |
| **Resultado do chute** | result.isWinner, prize, goldenGoalPrize; atualização de sessionWins/sessionLosses, currentStreak, totalGoldenGoals, shotsUntilGoldenGoal. |

**Game.jsx possui essa lógica?** **Não.** Game.jsx simula o resultado com Math.random e setTimeout; não chama API, não usa lotes, não usa contador global nem Gol de Ouro real. Saldo e estatísticas são apenas estado local.

---

## 3. Análise visual comparada

| Elemento | Game.jsx (via GameField) | GameShoot.jsx | Classificação |
|----------|---------------------------|---------------|----------------|
| **Campo** | Gramado em gradiente (green-800/600/500), linhas do campo, círculo central, áreas; altura ~3/4 do container; perspectiva estádio | Retângulo fixo 400×300px, gramado verde, linhas simples, gol no topo | Game: **visual** (destaque). GameShoot: **funcional** (compacto). |
| **Goleiro** | Goleiro estilizado (uniforme vermelho, braços, luvas, pernas), posição à direita do campo; animação de mergulho por zona; responsivo | Círculo azul com emoji 🥅; posição em %; animação para posição da zona | Game: **visual/decorativo**. GameShoot: **funcional**. |
| **Alvos** | 6 círculos no gol (zonas 1–6 com coordenadas x,y), borda branca/amarela, hover/scale | 5 zonas TL/TR/C/BL/BR, botões 8×8 com label; posição em % | Game: **visual + funcional**. GameShoot: **funcional**. |
| **Bola** | Bola estilizada (padrão preto/branco), posição “ready” / “shooting” com animação | Div com emoji ⚽; transição de posição (ballPos) | Game: **visual**. GameShoot: **funcional**. |
| **Gol** | Estrutura com rede (border, malha com círculos), à direita, altura relevante | Retângulo topo central (w-32 h-16), borda branca | Game: **visual**. GameShoot: **funcional**. |
| **Header** | Logo + “Gol de Ouro”; seta voltar | “⚽ Gol de Ouro” + Saldo + botão Recarregar | Game: **decorativo**. GameShoot: **funcional** (saldo, CTA). |
| **Menu / botões** | Botão fixo “Menu” canto inf. esq.; “Voltar ao Dashboard” / “Nova Partida” | “Recarregar” no header; “Dashboard” e “Áudio” no rodapé | Game: **visual** (alinhado ao print). GameShoot: **funcional**. |
| **Camadas** | Estádio (fundo) → gramado → gol → goleiro/bola → alvos → efeitos (gol, confetti) | Campo único → zonas → bola → goleiro → overlays resultado | Game: **visual** (profundidade). GameShoot: **funcional** (flat). |
| **Responsividade** | GameField com classes responsivas (w-12 h-16 sm:w-14…); container relativo | Largura/altura fixas 400×300 | Game: **visual**. GameShoot: **backend-dependente** (layout fixo). |

---

## 4. Componentes visuais reutilizáveis (Game.jsx → GameShoot)

Componentes ou blocos do Game.jsx que podem ser reutilizados ou adaptados para evoluir o visual do GameShoot:

| Componente / bloco | Onde está | Reutilização em GameShoot | Compatibilidade |
|--------------------|-----------|----------------------------|-----------------|
| **GameField** | Game.jsx | Substituir o bloco inline do campo (400×300) por GameField, alimentado por resultado do backend | **Média**: GameField hoje recebe onShoot(zoneId) e gameStatus/selectedZone/currentShot/totalShots; GameShoot usa dir (TL/TR/C/BL/BR) e shooting/balance. É necessário mapear 5 zonas do backend → 6 zonas do GameField (ou reduzir GameField a 5 zonas) e conectar onShoot a gameService.processShot. |
| **Campo/gramado** | GameField (linhas 122–141) | Extrair como componente “FieldBackground” (gramado + linhas) e usar no GameShoot | **Alta**: apenas JSX/CSS; sem estado de jogo. |
| **Gol com rede** | GameField (linhas 143–162) | Extrair “GoalNet” e usar no GameShoot em vez do retângulo simples | **Alta**: visual puro. |
| **Goleiro** | GameField (linhas 164–211) | Extrair “Goalkeeper” com props (pose, shootDirection); GameShoot passaria pose equivalente à zona | **Média**: animação hoje atada a zoneId (1–6); adaptar para TL/TR/C/BL/BR. |
| **Bola** | GameField (linhas 213–234) | Extrair “Ball” com posição/estado de animação | **Alta**: posição pode vir de estado (ex.: ballPos do GameShoot). |
| **Alvos (zonas)** | GameField (linhas 236–256) | Usar mesma ideia (círculos clicáveis) com 5 zonas e mapeamento TL/TR/C/BL/BR | **Alta**: apenas layout e onClick; lógica de desabilitar (shooting, balance < currentBet) já existe no GameShoot. |
| **BettingControls** | Game.jsx | Não substitui diretamente: Game usa “chutes” (+/-), GameShoot usa “valor da aposta” (R$ 1–10). Podem coexistir: área de aposta do GameShoot + bloco “Seus Chutes / Total Partida” se houver conceito de partida. | **Baixa** para substituição direta; **média** para inspiração de layout (grid, saldo, barra). |
| **Header com Logo** | Game.jsx (linhas 234–249) | Usar header com Logo + “Gol de Ouro” + saldo + Recarregar em um único bloco | **Alta**. |
| **Botão Menu fixo** | Game.jsx (linhas 314–320) | Adicionar botão fixo “Menu” no canto inf. esq. no GameShoot | **Alta**. |
| **Animações/confetti** | Game.jsx (createConfetti, GameField goal-effect) | Reutilizar efeito de gol e confetti no GameShoot após resultado do backend | **Alta**. |
| **SoundControls / AudioTest** | Game.jsx | Opcional: adicionar ao GameShoot se desejar mesma UX de áudio | **Média** (não crítico para reconciliação visual). |
| **RecommendationsPanel** | Game.jsx | Opcional: depende de usePlayerAnalytics e dados reais; pode ser adicionado depois | **Baixa** prioridade para reconciliação. |

**Resumo:** Os elementos de maior impacto visual e melhor compatibilidade são: **campo/gramado**, **gol com rede**, **goleiro**, **bola**, **alvos** (com mapeamento 5 zonas) e **layout de header/menu**. O **GameField** inteiro é reutilizável desde que se adapte a 5 zonas e à API (onShoot → processShot, estado vindo do backend).

---

## 5. Análise de riscos

| Risco | Descrição | Classificação |
|-------|-----------|----------------|
| **Migrar layout** | Trocar o bloco 400×300 do GameShoot por GameField ou componentes extraídos sem adaptar estado e handlers: quebra de fluxo (zonas não batem com backend, resultado não atualiza saldo). | **Alto** se feito sem mapeamento zona/direção e sem manter gameService como única fonte de verdade. |
| **Alterar estrutura JSX** | Reorganizar JSX do GameShoot (header, campo, stats) sem manter as mesmas chamadas a gameService e os mesmos estados (balance, shooting, etc.): risco de duplicar ou perder atualização de saldo/contador. | **Médio** se estados e efeitos forem preservados; **alto** se tocar na ordem de chamadas ou dependências. |
| **Misturar estados** | Introduzir estados do Game.jsx (gameStatus, playerShots, totalShots) no GameShoot sem unificar com shooting/balance/gameInfo: inconsistência entre UI e backend. | **Alto**. |
| **Quebrar hooks** | GameShoot não usa useGamification nem usePlayerAnalytics; GameField usa useSimpleSound e usePerformance. Incluir GameField ou seus filhos no GameShoot pode exigir esses hooks; remover ou alterar pode quebrar sons/performance. | **Médio** (depende de como GameField for integrado). |
| **Quebrar integração backend** | Substituir handleShoot do GameShoot por lógica local (como no Game) ou chamar processShot com parâmetros errados (ex.: zoneId 1–6 em vez de TL/TR/C/BL/BR): backend rejeita ou resultado errado. | **Alto**. |
| **Assets do GameField** | GameField usa ImageLoader com stadium-background, goalkeeper-3d, ball, goal-net-3d; se esses assets não existirem ou forem opcionais, fallback deve manter o jogo jogável. | **Médio**. |
| **Zonas 6 vs 5** | Backend usa 5 direções (TL, TR, C, BL, BR). GameField tem 6 zonas (ids 1–6). Usar GameField sem mapear 5→6 ou 6→5 quebra contrato da API. | **Alto** se não houver mapeamento explícito. |

---

## 6. Estratégia recomendada

**Abordagem mais segura:** **B) Fundir partes de Game.jsx em GameShoot** (com foco em componentes visuais reutilizáveis), complementada por **A) Evoluir GameShoot visualmente** e **C) Refatorar componentes visuais** para não duplicar código.

### Arquitetura recomendada

1. **Manter GameShoot como único dono da rota `/game`** e da integração com backend (gameService.initialize, gameService.processShot, saldo, lotes, Gol de Ouro). Nenhuma lógica de chute simulado do Game.jsx deve substituir a chamada à API.

2. **Extrair componentes visuais reutilizáveis** (a partir de GameField e Game.jsx):
   - **FieldBackground** (gramado + linhas).
   - **GoalNet** (gol com rede).
   - **Goalkeeper** (recebe pose/direção; animação compatível com TL/TR/C/BL/BR).
   - **Ball** (posição/estado de animação).
   - **GoalZones** (5 zonas clicáveis com mapeamento TL/TR/C/BL/BR, desabilitar quando shooting ou balance < currentBet).

3. **Compor o “campo” no GameShoot** com esses componentes, mantendo:
   - Estado atual do GameShoot (balance, shooting, ballPos, goaliePose, etc.).
   - handleShoot(dir) chamando apenas gameService.processShot(dir, currentBet).
   - Toasts e overlays de resultado (GOOOL!, DEFENDEU!, GOL DE OURO!) como estão.

4. **Ajustar layout da página** no GameShoot:
   - Header: Logo + “Gol de Ouro” + saldo + botão Recarregar (inspirado em Game.jsx).
   - Botão fixo “Menu” no canto inferior esquerdo (navegação para dashboard).
   - Opcional: bloco de “Status da partida” (Seus Chutes / Total Partida / Investimento) se for introduzido conceito de “partida” no backend; caso contrário, manter apenas estatísticas atuais (Gols, Defesas, Sequência, Gols de Ouro).

5. **Mapeamento de zonas:** Se usar um componente baseado nas 6 zonas do GameField, manter no backend apenas 5 direções: definir mapeamento fixo (ex.: zona 1→TL, 2→TR, 3→C, 4→BL, 5→BR e zona 6→C ou não usar) e enviar sempre TL/TR/C/BL/BR para a API.

6. **Não** trocar a rota `/game` para Game.jsx; **não** unificar estado do Game com o do GameShoot em um único componente sem refatoração explícita e testes de integração.

---

## 7. Resultado final — respostas diretas

1. **Qual parte do GameShoot deve permanecer intacta?**  
   Toda a **lógica de negócio e integração**: gameService.initialize(), gameService.processShot(), estado de balance, shooting, gameInfo, globalCounter, shotsUntilGoldenGoal; handlers handleShoot, handleBetChange; toasts e feedback de resultado; desabilitar chute quando balance < currentBet; contrato POST /api/games/shoot com direction (TL/TR/C/BL/BR) e amount.

2. **Quais partes do Game.jsx podem ser reutilizadas?**  
   **Componentes visuais:** GameField (ou suas partes: campo, gol com rede, goleiro, bola, alvos) desde que adaptados a 5 zonas e ao estado/handlers do GameShoot. **Layout:** header com Logo + título, bloco de status (se desejado), botão “Menu” fixo no canto inferior esquerdo. **Efeitos:** confetti e efeito de gol (goal-effect) após resultado vindo do backend.

3. **Qual estrutura final recomendada para `/game`?**  
   **Uma única página:** GameShoot, com o “campo” renderizado por componentes visuais extraídos/adaptados de Game.jsx/GameField (FieldBackground, GoalNet, Goalkeeper, Ball, GoalZones com 5 zonas), mantendo estado e handlers atuais do GameShoot; header e menu alinhados ao layout validado (Logo, saldo, Recarregar, botão Menu fixo).

4. **Qual abordagem deve ser seguida?**  
   **B) Fundir partes de Game.jsx em GameShoot** (componentes visuais e layout), com **C) Refatorar componentes visuais** (extrair do GameField para uso no GameShoot) e **A) Evoluir GameShoot visualmente** (melhorar tamanho do campo, goleiro, gol, alvos, header, menu) sem substituir a integração com o backend.

---

## 8. Documentação — resumo

- **Inventário:** Game.jsx usa GameField, BettingControls, SoundControls, AudioTest, RecommendationsPanel; estado local e jogo simulado. GameShoot usa apenas Navigation; campo inline 400×300; estado ligado a gameService e POST /api/games/shoot.
- **Comparação funcional:** GameShoot = backend real (saldo, lotes, Gol de Ouro, toasts). Game.jsx = simulação local; nenhuma chamada à API de jogo.
- **Comparação visual:** Game/GameField = campo em destaque, 6 alvos, goleiro estilizado, gol com rede, bola, botão Menu; GameShoot = campo fixo pequeno, 5 zonas, goleiro/bola simples, Recarregar no header.
- **Riscos:** Altos ao misturar estados, trocar handler de chute ou quebrar contrato da API; médios ao alterar JSX/hooks/assets.
- **Estratégia:** Manter GameShoot como dono da rota e da API; extrair componentes visuais de Game/GameField; compor o campo no GameShoot com 5 zonas mapeadas para TL/TR/C/BL/BR; alinhar header e menu ao layout validado.

---

## Classificação final

**RECONCILIAÇÃO COM RISCO CONTROLADO**

- A reconciliação é **técnica e arquiteturalmente viável** (fundir partes visuais de Game.jsx em GameShoot, mantendo GameShoot como única fonte de verdade para o backend).
- O risco é **controlado** desde que: (1) nenhuma lógica de chute ou saldo do Game substitua a do GameShoot; (2) o mapeamento de zonas (5 direções) seja explícito; (3) as alterações sejam feitas em etapas (extração de componentes, depois composição no GameShoot, depois ajustes de layout) com validação de fluxo e contrato da API.
- **Não** é necessária rearquitetura completa: a divisão “GameShoot = lógica, Game = visual” pode ser resolvida por extração e composição, sem reescrever o sistema de lotes nem o backend.

---

*Auditoria realizada em modo read-only; nenhum código, rota, backend ou produção foi alterado.*
