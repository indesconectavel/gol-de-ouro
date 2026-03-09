# Auditoria Forense — Gameplay Validado em Produção (READ-ONLY)

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, rotas, backend ou deploy)  
**Bloco:** BLOCO E — GAMEPLAY

---

## 1. Objetivo

Identificar, com evidências técnicas, qual implementação **real** gera a página `/game` validada em produção (estádio em imagem, goleiro/bola em imagem, HUD SALDO/CHUTES/GANHOS/GOLS DE OURO, R$1–R$10, MENU PRINCIPAL, Recarregar, áudio) e comparar com o que o repositório atual renderiza.

---

## 2. Componentes de gameplay encontrados

### Páginas (src/pages)

| Arquivo | Usado em rota? | Imagens reais | CSS/emoji | HUD tipo print |
|--------|-----------------|---------------|-----------|----------------|
| **GameShoot.jsx** | Sim — `/game`, `/gameshoot` | Não | Sim (campo 400×300, ⚽ 🥅) | Parcial (Saldo, Gols, Defesas, Sequência, Gols de Ouro; sem "CHUTES"/"GANHOS"; "Recarregar", "Áudio"; sem "MENU PRINCIPAL") |
| **Game.jsx** | Não | Não (GameField preload apenas) | GameField: goleiro/bola em CSS | Não (Aposta, Saldo, "Seus Chutes", "Total Partida", "Investimento"; botão "Menu") |
| **GameShootFallback.jsx** | Não | Não | Sim (gs-goalie, gs-defendeu, emoji) | Parcial (Saldo, Chutes, Precisão; "Nova Aposta"; usa game-shoot.css) |
| **GameShootSimple.jsx** | Não | Não | Sim (gs-goalie emoji) | Não |
| **GameShootTest.jsx** | Não | Não | — | — |

### Subcomponentes (src/components)

| Arquivo | Usado por | Imagens | Observação |
|---------|-----------|---------|------------|
| **GameField.jsx** | Apenas Game.jsx | Preload: stadium-background.jpg, goalkeeper-3d.png, ball.png, goal-net-3d.png; renderiza goleiro/bola em **CSS (divs)** | 6 zonas; useSimpleSound (kick, defesa, gol) |
| **GameAssets.jsx** | Nenhuma página de rota | Não (componentes CSS) | Ball, Goalkeeper, GoalPost, StadiumBackground, TargetCircle |
| **GameAssets3D.jsx** | Nenhuma página de rota | Não | Idem, variante 3D em CSS |
| **GameCanvas.jsx** | Nenhuma rota | Não | Canvas 2D; goleiro desenhado em canvas |
| **BettingControls.jsx** | Game.jsx | — | Controles de chutes |
| **SoundControls.jsx** | Game.jsx | — | Controle de áudio |

### CSS de cena (src/pages)

- **game-scene.css**: HUD com .hud-header, .hud-stats, .stat-label (SALDO, CHUTES, GANHOS, GOLS DE OURO), .bet-btn, .hud-actions; body[data-page="game"]; layout 16:9.
- **game-shoot.css**: .gs-wrapper, .gs-stage, .gs-hud, .gs-goalie, .gs-defendeu; usado por GameShootFallback e (no passado) por GameFinal.
- **game-locked.css**, **game-pixel.css**: variantes com .gs-goalie, .gs-defendeu.

**Conclusão:** Nenhum componente **atualmente montado em `/game`** usa imagens reais de goleiro/bola/estádio nem exibe o HUD exato "SALDO / CHUTES / GANHOS / GOLS DE OURO" com botão "MENU PRINCIPAL". O **GameShoot** atual (rota `/game`) usa campo CSS/emoji e labels "Gols", "Defesas", "Sequência", "Gols de Ouro".

---

## 3. Comparação com o print validado

Referência: produção validada com estádio em imagem, goleiro/bola em imagem, 5 alvos circulares, HUD superior (SALDO, CHUTES, GANHOS, GOLS DE OURO), R$1–R$10, MENU PRINCIPAL, Recarregar, áudio.

| Componente | Bate com print? | Elementos que coincidem | Elementos que divergem | Confiança |
|------------|------------------|--------------------------|--------------------------|-----------|
| **GameShoot (atual)** | Parcial | Saldo, apostas R$1–10, Recarregar, áudio, 5 zonas, Gols/Defesas/Sequência/Gols de Ouro | Campo/emoji (não imagem); sem "CHUTES"/"GANHOS"; sem "MENU PRINCIPAL"; botão "Dashboard" em vez de "Menu Principal" | 40% |
| **Game.jsx** | Parcial | Aposta, Saldo, botão Menu (não "MENU PRINCIPAL"), GameField com 6 zonas | HUD diferente (Seus Chutes, Total Partida, Investimento); sem imagens reais no render (só preload); lógica simulada | 35% |
| **GameShootFallback** | Parcial | HUD com Saldo, Chutes; game-shoot.css; 5 zonas | "MID" em vez de "C"; Precisão em vez de GANHOS/GOLS DE OURO; goleiro emoji; não está em rota | 35% |
| **GameFinal (commit 9056c2e)** | **Sim** | SALDO, CHUTES, GANHOS, MENU PRINCIPAL, Recarregar; imagens goalie_idle, goalie_dive_*, ball, bg_goal; overlays goool, defendeu, ganhou, golden-goal; layoutConfig; game-scene.css + game-shoot.css | Não existe mais no repositório atual (arquivo e rota removidos) | **95%** |

**Conclusão:** O componente que **mais corresponde** ao print validado é **GameFinal** (existente no commit **9056c2e**), que hoje **não está na árvore atual** e **não está associado a nenhuma rota** no código vigente.

---

## 4. Assets reais mapeados

### No commit 9056c2e (GameFinal — tela validada)

| Asset | Caminho no commit | Uso |
|-------|-------------------|-----|
| goalie_idle.png | goldeouro-player/src/assets/goalie_idle.png | Goleiro parado |
| goalie_dive_tl.png, _tr, _bl, _br, _mid.png | goldeouro-player/src/assets/ | Goleiro em direção ao canto |
| ball.png | goldeouro-player/src/assets/ball.png | Bola |
| bg_goal.jpg | goldeouro-player/src/assets/bg_goal.jpg | Fundo do gol/estádio |
| goool.png | goldeouro-player/src/assets/goool.png | Overlay "GOOOL!" |
| defendeu.png | goldeouro-player/src/assets/defendeu.png | Overlay defesa |
| ganhou.png | goldeouro-player/src/assets/ganhou.png | Overlay ganhou |
| golden-goal.png | goldeouro-player/src/assets/golden-goal.png | Overlay gol de ouro |

### No repositório atual

- **src/assets:** Apenas `golden-victory.png` e `golden-goal.png`. **Não existem** goalie_idle, goalie_dive_*, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png no diretório.
- **public/images/game:** stadium-background.jpg, goalkeeper-3d.png, ball.png, goal-net-3d.png, soccer-ball-3d.png — referenciados por **GameField.jsx** (apenas preload; goleiro/bola renderizados em CSS). Não usados por GameShoot nem por nenhuma rota que exiba a tela “premium”.

### Áudios

- **useSimpleSound:** /sounds/kick.mp3, defesa.mp3, gol.mp3, torcida, vaia, etc. — usados por Game/GameField (não na rota `/game`).
- GameShoot: áudio comentado; botão Áudio ON/OFF presente.

**Conclusão:** Os assets que **batem com a produção validada** (goalie_idle, goalie_dive_*, ball, bg_goal, goool, defendeu, ganhou) existiam em **9056c2e** em `goldeouro-player/src/assets/` e eram usados por **GameFinal**. No estado atual do repositório, a maioria **não existe** em `src/assets/`; apenas dois PNG de golden-goal permanecem.

---

## 5. Rota /game atual

| Pergunta | Resposta |
|----------|----------|
| O que `/game` usa hoje no código? | **GameShoot** (`goldeouro-player/src/pages/GameShoot.jsx`), dentro de `<ProtectedRoute>`. |
| O que `/gameshoot` usa? | **GameShoot** (mesmo componente). |
| Existe rota alternativa que gere a tela validada? | Não. Nenhuma rota atual aponta para GameFinal nem para componente que use imagens goalie_idle/ball/bg_goal e HUD SALDO/CHUTES/GANHOS/MENU PRINCIPAL. |
| Game.jsx está importado mas não usado em rota? | Sim. Está importado em App.jsx e **não** aparece em nenhum `<Route>`. |
| Evidência de que /game já apontou para outro componente? | Sim. No commit **9056c2e**: `<Route path="/game" element={<GameFinal />} />` e `<Route path="/gameshoot" element={<Game />} />`. No commit **def1d3b** (Initial commit v1.2.0): `/game` e `/gameshoot` já apontam para **GameShoot**. |

---

## 6. Histórico Git relevante

### Commits e branches

- **9056c2e** — `feat(game): versão VALIDADA da página /game (pré-scale mobile)`  
  - **/game → GameFinal**, /gameshoot → Game.  
  - GameFinal usa: game-scene.css, game-shoot.css, `../game/layoutConfig.js`, assets em `../assets/` (goalie_idle, goalie_dive_*, ball, bg_goal, goool, defendeu, ganhou, golden-goal).  
  - HUD: SALDO, CHUTES, GANHOS; botão MENU PRINCIPAL; Recarregar; 5 alvos; backend simulado no próprio componente.

- **def1d3b** — `Initial commit  Gol de Ouro v1.2.0 (Production Ready)`  
  - **/game → GameShoot**, /gameshoot → GameShoot.  
  - GameFinal e GameOriginalTest/GameOriginalRestored/GameCycle deixam de ser usados em rotas.

- **0d85202** — `feat(game): implementa layout exato da imagem - HUD superior com estatísticas, botões de aposta...`  
  - Alterou GameShoot.jsx e game-locked.css (não GameFinal).

Branches que contêm 9056c2e: `release-v1.0.0`, `backup/missao-e-final`, `fix/remove-version-banner`, `release-merge`, `rollback/pre-ux-adjustments` (e remotes).

### Conclusão do histórico

- A **implementação que corresponde à tela validada** (imagens reais, HUD completo, MENU PRINCIPAL) é a do **GameFinal** no commit **9056c2e**.
- Em algum momento entre 9056c2e e o “Initial commit” v1.2.0 (def1d3b), a rota `/game` foi alterada de **GameFinal** para **GameShoot**, e a árvore atual (main, baseline, feature/bloco-c-auth-certified) **não** inclui GameFinal em rotas nem o arquivo GameFinal.jsx na pasta pages (nem layoutConfig em src/game/ nem os assets completos em src/assets/).

---

## 7. Candidato mais provável à tela validada

| Item | Conclusão |
|------|-----------|
| **Componente que mais corresponde à tela validada** | **GameFinal** (como existia no commit **9056c2e**). |
| **Esse componente está hoje fora da rota /game?** | Sim. GameFinal **não existe** nas rotas atuais; `/game` usa **GameShoot**. |
| **Produção validada provavelmente veio de** | **GameFinal** (com layoutConfig, game-scene.css, game-shoot.css e assets em src/assets/). Não de Game.jsx, GameField nem GameShoot atual. |
| **O repositório atual preserva a implementação correta?** | **Só em parte.** Preserva game-scene.css, game-shoot.css e alguns backups (ex.: GameFinal.jsx.BACKUP-VALIDADO-2025-12-30, layoutConfig.js.BACKUP-VALIDADO-2025-12-30). **Não** preserva GameFinal.jsx ativo, nem layoutConfig.js em src/game/, nem a rota `/game` → GameFinal, nem a maioria dos assets (goalie_idle, goalie_dive_*, ball, bg_goal, goool, defendeu, ganhou) em src/assets/. |
| **Arquivo/decisão que causa a divergência** | **App.jsx**: a decisão de ter `<Route path="/game" element={<GameShoot />} />` em vez de um componente que renderize a tela “premium” (ex.: GameFinal). Além disso, a **ausência** de GameFinal.jsx, de layoutConfig.js e dos assets em src/assets/ no estado atual. |

---

## 8. Causa da divergência preview vs produção

- **Produção validada:** Provavelmente um deploy gerado a partir de um estado do repositório em que `/game` montava **GameFinal** (ex.: commit 9056c2e ou branch que o contém), com assets e layoutConfig presentes.
- **Preview / repositório atual:** `/game` monta **GameShoot** (campo CSS/emoji, HUD diferente, sem MENU PRINCIPAL e sem imagens reais de goleiro/bola/estádio).
- **Causa técnica:** (1) Troca da rota `/game` de **GameFinal** para **GameShoot**. (2) Remoção ou não-inclusão em main de GameFinal.jsx, layoutConfig.js e da maioria dos assets em src/assets/.

---

## 9. Plano técnico recomendado (sem executar)

Opções consideradas:

- **A.** Trocar `/game` para o componente “correto” (ex.: restaurar GameFinal e apontar /game para ele).  
- **B.** Adaptar GameShoot para ficar igual ao validado (HUD, imagens, MENU PRINCIPAL).  
- **C.** Restaurar commit específico (ex.: 9056c2e) para a página /game.  
- **D.** Criar branch gameplay-certified derivada da baseline certificada com GameFinal + assets + layoutConfig.

**Recomendação:** **D**, com elementos de **A** e **C**:

1. **Criar branch `gameplay-certified`** a partir da baseline certificada (ex.: baseline/fykkeg6zb-certified).
2. **Restaurar a implementação validada** nessa branch: recuperar GameFinal.jsx (do commit 9056c2e ou dos backups .BACKUP-VALIDADO), layoutConfig.js (idem), e os assets em src/assets/ (goalie_idle, goalie_dive_*, ball, bg_goal, goool, defendeu, ganhou; golden-goal já existe).
3. **Apontar `/game` para GameFinal** nessa branch (alterar apenas App.jsx na branch).
4. Validar em preview (build + testes) **sem** alterar produção até confirmar.
5. **Não** alterar GameShoot em main até que a decisão de “fonte da verdade” (GameFinal vs GameShoot adaptado) esteja fechada.

**Motivo:** Menor risco de regressão (mudança isolada em branch); máxima fidelidade à produção validada (restauração do componente e assets que batem com o print); retrabalho limitado à restauração de arquivos já existentes no histórico.

---

## 10. Conclusão final

- A tela **validada em produção** (estádio/goleiro/bola em imagem, 5 alvos, HUD SALDO/CHUTES/GANHOS/GOLS DE OURO, R$1–R$10, MENU PRINCIPAL, Recarregar, áudio) corresponde à implementação do **GameFinal** no commit **9056c2e**, com `game-scene.css`, `game-shoot.css`, `src/game/layoutConfig.js` e assets em `src/assets/` (goalie_idle, goalie_dive_*, ball, bg_goal, goool, defendeu, ganhou, golden-goal).
- No repositório **atual**, `/game` usa **GameShoot** (campo CSS/emoji, HUD diferente, sem MENU PRINCIPAL e sem essas imagens). GameFinal, layoutConfig e a maioria dos assets **não** estão presentes ou ativos.
- A **divergência** é causada pela **troca da rota `/game`** de GameFinal para GameShoot e pela **ausência** da árvore completa da “versão validada” (GameFinal + layoutConfig + assets) no estado atual do repositório.

Nenhum arquivo foi alterado nesta auditoria (modo READ-ONLY).

---

---

## SAÍDA FINAL OBRIGATÓRIA

1. **Rota /game atual:** Definida em `App.jsx`: `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />`.
2. **Componente usado hoje em /game:** **GameShoot** (`goldeouro-player/src/pages/GameShoot.jsx`).
3. **Componente mais parecido com a tela validada:** **GameFinal** (existente no commit **9056c2e**; não está mais na árvore atual como página ativa em rota).
4. **Assets reais identificados que batem com a produção:** goalie_idle.png, goalie_dive_tl/tr/bl/br/mid.png, ball.png, bg_goal.jpg, goool.png, defendeu.png, ganhou.png, golden-goal.png — presentes em **9056c2e** em `goldeouro-player/src/assets/`; no repo atual restam apenas golden-goal.png e golden-victory.png em src/assets/.
5. **Commits/branches candidatos:** Commit **9056c2e** (versão VALIDADA da página /game); branches **release-v1.0.0**, **backup/missao-e-final**, **fix/remove-version-banner**, **release-merge**, **rollback/pre-ux-adjustments** contêm 9056c2e.
6. **Causa mais provável da divergência atual:** Troca da rota `/game` de **GameFinal** para **GameShoot** (entre 9056c2e e def1d3b) e remoção/não-inclusão em main de GameFinal.jsx, layoutConfig.js e da maioria dos assets em src/assets/.
7. **Arquivo ou decisão técnica que está causando a tela errada no preview:** **App.jsx** (decisão de montar **GameShoot** em `/game`) e a **ausência** de GameFinal.jsx, layoutConfig e assets completos no estado atual do repositório.
8. **Melhor caminho recomendado para corrigir:** Criar branch **gameplay-certified** a partir da baseline certificada; restaurar GameFinal.jsx (do 9056c2e ou dos backups .BACKUP-VALIDADO), layoutConfig.js e assets em src/assets/; apontar `/game` para GameFinal nessa branch; validar em preview antes de qualquer mudança em produção.
9. **Nível de confiança da conclusão:** **Alta (90%)** — evidência direta no commit 9056c2e (GameFinal com SALDO, CHUTES, GANHOS, MENU PRINCIPAL, imagens goalie/ball/bg_goal); incerteza residual sobre qual deploy exato da Vercel corresponde a qual commit.
10. **Status final da auditoria:** **TELA VALIDADA IDENTIFICADA COM ALTA CONFIANÇA** — implementação correspondente: **GameFinal** no commit **9056c2e**; atualmente fora da rota e parcialmente ausente do repositório.

---

*Auditoria forense realizada em 2026-03-08. Apenas leitura e documentação.*
