# Auditoria BLOCO E (Gameplay) — READ-ONLY

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, rotas, backend ou configuração)  
**Objetivo:** Documentar qual implementação da página `/game` está validada em produção e qual estrutura de arquivos representa a versão oficial.

---

## 1. Objetivo

Descobrir e documentar:
- qual componente React renderiza a tela do jogo em `/game`;
- quais assets visuais são utilizados;
- quais endpoints são chamados;
- qual lógica de gameplay está ativa;
- qual estrutura de arquivos representa a versão oficial validada.

Objetivo final: garantir que as próximas correções usem a mesma tela validada.

---

## 2. Rota /game

| Item | Valor |
|------|--------|
| **Arquivo que define a rota** | `goldeouro-player/src/App.jsx` |
| **Trecho exato** | `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />` |
| **Rota adicional** | `<Route path="/gameshoot" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />` |
| **Componente renderizado** | **GameShoot** (não Game, nem GameShootFallback) |

**Evidência:** Leitura de `App.jsx` nas branches `baseline/fykkeg6zb-certified`, `feature/bloco-c-auth-certified` e `main`. Em todas, `/game` e `/gameshoot` apontam para **GameShoot**. O componente **Game** está importado em `App.jsx` mas **não está associado a nenhuma rota**.

---

## 3. Componente utilizado

| Item | Valor |
|------|--------|
| **Nome do componente** | GameShoot |
| **Caminho completo** | `goldeouro-player/src/pages/GameShoot.jsx` |
| **Export** | `export default GameShoot` |

---

## 4. Árvore de componentes

O **GameShoot** não utiliza subcomponentes próprios de jogo (ex.: GameHUD, BetSelector como componentes separados). Tudo é renderizado inline no mesmo arquivo. A estrutura lógica é:

```
GameShoot (página)
 ├ Navigation (sidebar)
 ├ div (conteúdo principal)
 │   ├ Header (título "Gol de Ouro", Saldo, botão Recarregar)
 │   ├ Sistema de Apostas (Valor da Aposta: R$ 1, 2, 5, 10)
 │   ├ Campo de Futebol (div 400×300)
 │   │   ├ Campo (gramado, linhas, gol)
 │   │   ├ Zonas clicáveis (TL, TR, C, BL, BR) — botões
 │   │   ├ Bola (div com emoji ⚽)
 │   │   ├ Goleiro (div com emoji 🥅)
 │   │   ├ Overlays de resultado (GOOOL!, DEFENDEU!, GOL DE OURO!)
 │   ├ Estatísticas (Gols, Defesas, Sequência, Gols de Ouro)
 │   ├ Sistema Gol de Ouro (chutes até próximo)
 │   └ Controles (Áudio ON/OFF, Dashboard)
```

**Componentes importados por GameShoot:** `Logo`, `Navigation`, `gameService`, `apiClient`, `API_ENDPOINTS`. Não usa `GameField`, `BettingControls`, `GameCanvas`, `PenaltyGame` nem `GamePage`.

---

## 5. Assets utilizados

### No GameShoot.jsx (código atual)

- **Visuais:** Nenhuma imagem externa; campo e elementos são **CSS e emojis** (⚽ bola, 🥅 goleiro). Zonas são `div`/botões com estilo Tailwind.
- **Áudio:** Código comentado (`// audioManager.playKickSound();`). Não há referência ativa a `kick.mp3`, `shoot.mp3` ou `defesa.mp3` no fluxo de chute.

### No repositório (referências a assets de jogo)

| Tipo | Caminho / referência | Usado por |
|------|----------------------|-----------|
| Imagens | `public/images/game/stadium-background.jpg`, `goalkeeper-3d.png`, `ball.png`, `goal-net-3d.png` | **GameField.jsx** (usado apenas por **Game.jsx**, que não está em nenhuma rota) |
| Áudio | `useSimpleSound.jsx`: `/sounds/kick.mp3`, `/sounds/defesa.mp3` | GameField, Game (não montados em /game) |
| Áudio | `audioManager.js`, `musicManager.js`: `kick.mp3`, `defesa.mp3` | Diversos; GameShoot não chama esses módulos no chute |
| CSS | `game-shoot.css` (classes `.gs-defendeu`, etc.) | **GameShootFallback.jsx** (não montado em /game) |

**Conclusão:** A tela **validada em produção** (rota `/game` → GameShoot) usa **campo e goleiro em CSS/emoji**, sem imagens `goalie_idle_*.png` ou `defendeu_*.png` no código atual. Os assets `goalie_idle`, `defendeu`, `goalie_dive`, `kick.mp3`, `shoot.mp3`, `defesa.mp3` aparecem em documentação ou em outros componentes (GameField, GameShootFallback, useSimpleSound) que **não** são renderizados na rota `/game` no estado atual do repositório.

---

## 6. Lógica de gameplay

| Item | Valor |
|------|--------|
| **Função de disparo** | `handleShoot(dir)` em `GameShoot.jsx` (linha ~145) |
| **Fluxo** | `handleShoot(dir)` → valida saldo/aposta → animação da bola → `gameService.processShot(dir, currentBet)` → atualiza estados e exibe resultado (GOOOL / DEFENDEU / GOL DE OURO) |
| **Zonas** | `GOAL_ZONES`: TL, TR, C, BL, BR (5 zonas). Constante `DIRS = ["TL", "TR", "C", "BL", "BR"]` |
| **Valores de aposta** | `betValues = [1, 2, 5, 10]` (R$ 1, 2, 5, 10) |

---

## 7. Endpoint de chute

| Item | Valor |
|------|--------|
| **Serviço** | `gameService.processShot(direction, amount)` em `goldeouro-player/src/services/gameService.js` |
| **Método HTTP** | **POST** |
| **Path** | **/api/games/shoot** (relativo à baseURL do apiClient) |
| **URL completa** | `{API_BASE_URL}/api/games/shoot` — em produção `https://goldeouro-backend-v2.fly.dev/api/games/shoot` |
| **Payload** | `{ direction: string (TL|TR|C|BL|BR), amount: number (1|2|5|10) }` |
| **Definição em config** | `API_ENDPOINTS.GAMES_SHOOT` = `/api/games/shoot` em `config/api.js` |

---

## 8. Diferença preview vs produção

- **Preview (feature/bloco-c-auth-certified / baseline/fykkeg6zb-certified):** Rota `/game` → **GameShoot**. Mesmo `App.jsx` que em main e na baseline.
- **Produção validada (FyKKeg6zb / documentação):** Rota `/game` → **GameShoot** (confirmado em CONFIRMACAO-DEFINITIVA-BASELINE-GAME-2026-03-08 e baseline-commit-origin).

**Conclusão:** Não há diferença de **componente** entre preview e produção: ambos usam **GameShoot** para `/game`. A possível “tela errada” relatada pode referir-se a:
- diferença de **layout/estilo** entre o que está no código atual de GameShoot e um print/expectativa (ex.: layout descrito como “mais próximo de Game.jsx” em relatórios anteriores); ou
- uso de **assets** (goalie_idle, defendeu, sons) que existem no repositório mas são usados por **Game.jsx**/GameField/GameShootFallback, que **não** estão montados em `/game`.

**Arquivo que define qual tela é exibida:** **`goldeouro-player/src/App.jsx`** — é ele que decide que `<Route path="/game" element={...}>` usa **GameShoot**. Se em algum branch ou commit a rota apontasse para **Game** em vez de **GameShoot**, a tela seria a do Game (GameField, 6 zonas, botão Menu, estádio). No estado atual de main, baseline e feature/bloco-c-auth-certified, a rota aponta para GameShoot.

---

## 9. Componente correto identificado

| Pergunta | Resposta |
|----------|----------|
| **Qual componente corresponde à tela validada em produção?** | **GameShoot** (`goldeouro-player/src/pages/GameShoot.jsx`) |
| **Game.jsx está em alguma rota?** | **Não.** Está importado em App.jsx mas não é usado em nenhum `<Route>`. |
| **GameShootFallback / GameShootTest / GameShootSimple?** | Nenhum deles está associado à rota `/game` no App.jsx atual. |
| **GamePage / GameStage / GameCanvas / PenaltyGame?** | Não existem com esses nomes no repositório. O equivalente “página de jogo com campo rico” é **Game.jsx** (que usa GameField), mas não é a tela servida em `/game`. |

**Conclusão:** A implementação **oficial validada** da tela do jogo em produção (baseline FyKKeg6zb e documentação) é a do **GameShoot**: rota `/game` → **GameShoot**, backend **POST /api/games/shoot**, 5 zonas TL/TR/C/BL/BR, apostas R$ 1–10, estatísticas (Gols, Defesas, Sequência, Gols de Ouro).

---

## 10. Commit / branch de origem

| Item | Valor |
|------|--------|
| **Branch onde /game → GameShoot** | **main**, **baseline/fykkeg6zb-certified**, **feature/bloco-c-auth-certified** (e commit proxy 0a2a5a1 / 7dbb4ec) |
| **Commit de referência (baseline)** | **0a2a5a1** (Merge PR #18) ou **7dbb4ec** (fix CSP) — ambos com App.jsx usando GameShoot em `/game` |
| **Branch baseline certificada** | **baseline/fykkeg6zb-certified** (commit 78f90e2 e posteriores) — mesma rota e mesmo componente |

Não foi encontrado nenhum commit ou branch no repositório em que a rota `/game` aponte para **Game** em vez de **GameShoot**. A versão correta (validada) da tela do jogo está, portanto, no **GameShoot**, em qualquer um dos pontos acima.

---

## 11. Conclusão

- **Rota /game:** Definida em `App.jsx`; renderiza **GameShoot** (e **gameshoot** também).
- **Componente da tela validada:** **GameShoot** (`goldeouro-player/src/pages/GameShoot.jsx`).
- **Árvore:** GameShoot com Navigation, header, apostas, campo inline (zonas TL/TR/C/BL/BR, bola e goleiro em CSS/emoji), estatísticas e controles.
- **Assets no código da tela ativa:** Nenhuma imagem goalie_idle/defendeu no GameShoot; áudio de chute comentado. Assets de estádio/goleiro/bola e sons existem no repo mas são usados por Game/GameField, que não estão na rota `/game`.
- **Lógica:** `handleShoot` → `gameService.processShot` → **POST /api/games/shoot** com `{ direction, amount }`.
- **Preview vs produção:** Mesmo componente (GameShoot); nenhuma diferença de rota. Possível divergência apenas entre expectativa visual (ex.: layout “tipo Game”) e o que o GameShoot desenha hoje.
- **Arquivo que define a tela exibida:** **App.jsx** (escolha do elemento da rota `/game`). O componente correto para manter/restaurar como “tela oficial do jogo” é **GameShoot**.

Nenhum arquivo foi alterado nesta auditoria (modo READ-ONLY).

---

*Auditoria realizada em 2026-03-08. Apenas leitura e documentação.*
