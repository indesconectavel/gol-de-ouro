# AUDITORIA PROFUNDA — CONFLITO DA PÁGINA /game

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, rotas ou arquivos)  
**Escopo:** Frontend goldeouro-player (src/App.jsx, páginas de jogo, componentes, documentação local)  
**Objetivo:** Identificar qual é a verdadeira página do jogo validada pelo projeto e por que a rota `/game` está apontando para uma página que o usuário não reconhece como oficial.

---

## 1. Mapa completo das rotas do jogo

### Fontes analisadas

- **goldeouro-player/src/App.jsx** (arquivo em uso)
- **goldeouro-player/src/App-backup.jsx** (backup com lazy loading)

### Tabela de rotas

| Rota        | Componente | Arquivo                |
|------------|------------|------------------------|
| `/game`    | GameShoot  | src/pages/GameShoot.jsx |
| `/gameshoot` | GameShoot | src/pages/GameShoot.jsx |

### Rotas inexistentes ou não utilizadas

- **Nenhuma rota** no App.jsx (nem no App-backup.jsx) renderiza o componente **Game** (Game.jsx).
- O componente **Game** é importado em ambas as versões do App (`import Game from './pages/Game'`) mas **nunca é referenciado em nenhum `<Route>`**.

### Respostas objetivas

- **Hoje, qual arquivo renderiza `/game`?**  
  **GameShoot.jsx** (via `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />`).

- **Hoje, qual arquivo renderiza `/gameshoot`?**  
  **GameShoot.jsx** (mesmo componente; mesma definição de rota).

- **Existe rota antiga, backup ou esquecida para página de jogo?**  
  Não. Não há rota para `Game.jsx`, `GameShootSimple`, `GameShootFallback` ou `GameShootTest` no App.jsx atual. O App-backup.jsx também só declara `/game` e `/gameshoot` para GameShoot.

---

## 2. Inventário de todas as páginas de jogo

| Arquivo            | Finalidade aparente | Usa campo/goleiro/bola? | Usa saldo/chutes/ganhos? | Usa seletor de aposta? | Usa botão menu principal? |
|--------------------|---------------------|--------------------------|---------------------------|-------------------------|----------------------------|
| **Game.jsx**       | Página de jogo com GameField, partida 10 chutes, zonas numéricas | Sim (GameField: estádio, goleiro, 6 alvos circulares, bola) | Sim (saldo, Seus Chutes, Total Partida, Investimento, Ganhos Totais) | Parcial (BettingControls: +/- para quantidade; valor R$ 1 no estado) | Sim: botão "Menu" fixed bottom-left; "Voltar ao Dashboard" |
| **GameShoot.jsx**  | Página de jogo integrada ao backend (gameService, POST /api/games/shoot) | Sim (campo 400×300, zonas TL/TR/C/BL/BR, goleiro, bola) | Sim (saldo, Gols, Defesas, Sequência, Gols de Ouro; valor R$ 1 fixo V1) | Não (V1: valor fixo R$ 1,00; sem R$2/R$5/R$10) | Não: "Recarregar" no header; "Dashboard" nos controles |
| **GameShootSimple.jsx** | Versão simples do jogo (CSS gs-wrapper, simulação local) | Sim (zonas, goleiro, bola) | Parcial (HUD com Saldo, Chutes 0/10; sem ganhos/gols de ouro) | Não | Não (Nova Aposta no HUD) |
| **GameShootFallback.jsx** | Fallback do jogo (game-shoot.css, lógica similar ao GameShoot) | Sim (zonas, goleiro, bola) | Sim (balance, shotsTaken, etc.) | Não | Não |
| **GameShootTest.jsx** | Página de teste de roteamento (só texto "Gol de Ouro - Teste") | Não | Não | Não | Não |

### Componentes que representam “telas completas” de jogo

- **Game.jsx**: tela completa (header, status da partida, BettingControls, GameField, resultados, botões Menu/Dashboard). **Não está ligada a nenhuma rota.**
- **GameShoot.jsx**: tela completa (header, valor do chute, campo, estatísticas, sistema Gol de Ouro, controles). **É a única página de jogo usada nas rotas `/game` e `/gameshoot`.**

### Backup / variantes do App

- **App-backup.jsx**: usa lazy loading; rotas `/game` e `/gameshoot` também apontam para **GameShoot**. Não referencia Game em rotas.
- **App-simple.jsx**: não define rotas `/game` nem `/gameshoot`; só Login e Dashboard simples.

---

## 3. Comparação visual com o print validado

Referência: print validado pelo usuário com os elementos abaixo.

### Tabela de comparação

| Elemento do print validado     | Game.jsx | GameShoot.jsx | Outro arquivo |
|-------------------------------|----------|---------------|----------------|
| Barra superior com logo       | Parcial (Logo + "Gol de Ouro" no header) | Parcial ("⚽ Gol de Ouro" no header) | — |
| Saldo                         | Sim (na seção Status da Partida e BettingControls) | Sim (header: "Saldo" + R$) | — |
| Chutes                        | Sim ("Seus Chutes", "Total Partida") | Não na barra (estatísticas abaixo: Gols, Defesas) | GameShootSimple: "Chutes 0/10" no HUD |
| Ganhos                        | Sim ("Ganhos Totais" em seção de resultados) | Não na barra (sessionWins como "Gols") | — |
| Gols de ouro                  | Não na barra | Sim (estatística "Gols de Ouro" + bloco "Sistema Gol de Ouro") | — |
| Seletor de aposta R$1,R$2,R$5,R$10 | Não (só +/- com valor R$ 1) | Não (V1: R$ 1,00 fixo) | Nenhum no código |
| Botão MENU PRINCIPAL          | Não (tem "Menu" e "Voltar ao Dashboard") | Não (tem "Recarregar", "Dashboard") | Nenhum arquivo usa o texto "MENU PRINCIPAL" |
| Campo em tela cheia           | Parcial (GameField ocupa área grande, não fullscreen) | Não (campo fixo 400×300px) | — |
| Goleiro central               | Sim (GameField: goleiro à direita do campo) | Sim (goleiro no campo) | — |
| Alvos/redes circulares no gol | Sim (GameField: 6 círculos clicáveis no gol) | Sim (5 zonas TL/TR/C/BL/BR como botões circulares) | — |
| Bola central embaixo          | Sim (GameField: bola no campo) | Sim (bola no campo) | — |
| Botão Recarregar canto inf. esq. | Não (canto inf. esq.: "Menu") | Não (Recarregar no header) | — |
| Botão de áudio canto inf. dir. | Parcial (SoundControls/AudioTest no topo do conteúdo) | Sim (botão "🔊 Áudio ON/OFF" nos controles centrais) | — |

### Respostas

- **Qual arquivo corresponde melhor à tela que o usuário validou?**  
  **Game.jsx** aproxima-se mais do layout “campo em destaque + goleiro + alvos circulares + bola + botão Menu no canto”, mas **nenhum arquivo** implementa a barra superior exata do print (logo + saldo + chutes + ganhos + gols de ouro + seletor R$1–R$10 + “MENU PRINCIPAL”). O código não contém o texto “MENU PRINCIPAL” nem seletor explícito R$1/R$2/R$5/R$10 na UI.

- **Qual arquivo NÃO corresponde ao print validado?**  
  **GameShoot.jsx** não corresponde ao print em vários pontos: campo não é “tela cheia” (é 400×300); não há barra única com chutes/ganhos/gols de ouro/seletor de aposta; “Recarregar” está no header, não no canto inferior esquerdo; não há “MENU PRINCIPAL”.

---

## 4. Conflito entre Game.jsx e GameShoot.jsx

### Análise

- **Game.jsx**
  - Layout mais rico: GameField com estádio, gramado, gol com rede, 6 zonas circulares, goleiro estilizado, bola.
  - Lógica de jogo **local/simulada** (useState, setTimeout, sem chamada a `/api/games/shoot`).
  - Usa BettingControls, SoundControls, RecommendationsPanel, useGamification, usePlayerAnalytics.
  - **Não está ligado a nenhuma rota** no App atual.

- **GameShoot.jsx**
  - Layout mais enxuto: header, valor fixo R$ 1, campo 400×300, zonas TL/TR/C/BL/BR, estatísticas, integração com backend.
  - Lógica **integrada ao backend**: gameService.initialize(), gameService.processShot(), POST /api/games/shoot.
  - Comentário no código: “COMPONENTE GAMESHOOT CORRIGIDO - GOL DE OURO v1.2.0”, “INTEGRAÇÃO COMPLETA COM BACKEND REAL”.
  - **É o único componente de jogo usado nas rotas `/game` e `/gameshoot`.**

### Respostas

- **Existe conflito real entre Game.jsx e GameShoot.jsx?**  
  **Sim.** Dois componentes distintos representam “a página do jogo”: um (Game) com visual mais próximo do print e jogo simulado; outro (GameShoot) com backend real e em uso nas rotas. O Game é importado mas nunca usado nas rotas.

- **Qual dos dois parece ser a página legítima validada (pelo layout descrito)?**  
  **Game.jsx** (via GameField) é o que mais se aproxima da descrição visual (campo em destaque, goleiro, alvos circulares, bola, botão tipo menu no canto). Porém a “barra superior” exata do print (com seletor R$1–R$10 e “MENU PRINCIPAL”) não existe em nenhum dos dois.

- **Qual dos dois parece ser a página “errada” no contexto do projeto?**  
  No contexto **funcional e de produção**, **GameShoot.jsx** é a escolha correta (backend real, lotes, saldo). No contexto **visual/validado pelo usuário**, a que está “errada” na rota é **GameShoot.jsx**, pois a rota `/game` poderia ser a que o usuário associa à tela com campo/goleiro/bola/Menu que mais se parece com **Game.jsx**.

---

## 5. Evidências documentais

### Documentos que mencionam /game, GameShoot, Game.jsx

- **docs/relatorios/baseline-frontend-game.json**  
  - Diz: “O /game atual corresponde ao layout/experiência validada pelo usuário” e lista “menu principal”.  
  - O “/game atual” no código é **GameShoot**. Ou seja, a documentação tratou **GameShoot** como a experiência validada.

- **docs/relatorios/AUDITORIA-READONLY-VERSIONWARNING-WITHDRAW-PIX-500-2026-03-02.md**  
  - Explicita: “Rota /game: … O componente renderizado é **GameShoot** (página de jogo), não Game.jsx diretamente.”

- **docs/relatorios/AUDITORIA-COMPLETA-SIDEBAR-2026-03-08.md**  
  - Lista GameShoot.jsx e Game.jsx como páginas que usariam Navigation/useSidebar; cita Game.jsx como “página alternativa do jogo” e “se a rota continuar em uso”.

- **docs/relatorios/AUDITORIA-FINAL-PRE-PATCH-BLOCO-F-2026-03-08.md**  
  - Trata GameShoot como a tela de jogo em /game e Game.jsx como “página alternativa” / “se a rota continuar em uso”.

- **docs/relatorios/FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06.md**  
  - Foca em qual deployment Vercel serve /game; não discute Game vs GameShoot.

- **docs/auditorias/auditoria-deploy-2025-09-02.json**  
  - Cita “src/pages/Game.jsx” em checklist; não define qual rota o usa.

- **docs/correcoes/CORRECAO-PROBLEMA-LOGIN-JOGADOR.md**  
  - Referência a `<Route path="/game"` sem especificar componente.

### Respostas

- **A documentação do projeto aponta qual página como oficial?**  
  O **baseline-frontend-game.json** e os relatórios de auditoria tratam o **/game atual** (que no código é **GameShoot**) como a experiência validada ou a página de jogo em produção. Nenhum documento declara **Game.jsx** como a única página oficial do jogo.

- **Há relatórios anteriores contraditórios?**  
  Sim, no sentido de que o usuário agora descreve uma tela validada com elementos (barra única, MENU PRINCIPAL, seletor R$1–R$10, Recarregar no canto) que **não existem** no GameShoot atual e só parcialmente no Game.jsx. Ou seja, há contradição entre “/game = layout validado” (doc) e a descrição visual do usuário.

- **Houve momentos em que /game foi tratado como Game.jsx e outros como GameShoot.jsx?**  
  Nos arquivos **App.jsx e App-backup.jsx** analisados, **/game sempre** renderiza **GameShoot**. Não foi encontrado commit ou versão do App em que /game apontasse para Game.jsx. A menção a Game.jsx em auditorias é como “página alternativa” ou “se a rota continuar em uso”, não como rota atual.

---

## 6. Origem provável do desvio

### Classificação da causa provável

**B) GameShoot.jsx foi promovido indevidamente como página principal**  
e, em conjunto,  
**E) Houve substituição progressiva sem validação final.**

### Justificativa com evidência

1. **Game.jsx** existe, tem layout mais rico (GameField, estádio, alvos circulares, goleiro, bola, botão Menu) e é importado no App, mas **nunca foi associado a nenhuma rota** nos arquivos atuais. Isso é consistente com uma decisão de “usar GameShoot em /game” sem remover ou redirecionar o Game.

2. **GameShoot.jsx** foi explicitamente integrado ao backend (v1.2.0, “INTEGRAÇÃO COMPLETA COM BACKEND REAL”) e é o único componente usado em `/game` e `/gameshoot`. A documentação (baseline, auditorias) passou a considerar “/game atual” = GameShoot como “validado”, sem distinguir entre “validado visualmente” e “validado funcionalmente”.

3. Não há no código nenhuma rota que aponte para **Game.jsx**. Portanto não houve “redirecionamento de /game para o componente errado” no sentido de uma linha que antes era `<Game />` e foi trocada por `<GameShoot />` no mesmo App; o que existe é **GameShoot como única opção em /game** e Game como componente órfão de rota.

4. O usuário descreve uma tela com elementos (barra única, MENU PRINCIPAL, seletor R$1–R$10, Recarregar no canto) que **não estão implementados** em nenhum arquivo. Isso sugere que a “validação visual” pode referir-se a um mockup, outro deployment (ex.: FyKKeg6zb citado na investigação Vercel) ou uma versão antiga não presente no código atual, e que a “fonte de verdade” em código foi fixada em GameShoot sem alinhar com essa referência visual.

---

## 7. Fonte de verdade oficial

### Respostas objetivas

- **Qual arquivo deve ser considerado a FONTE DE VERDADE da página do jogo?**  
  **Depende do critério.**  
  - **Funcional / produção (backend, saldo, lotes):** **GameShoot.jsx** — é o único usado em `/game` e integrado ao backend.  
  - **Visual / layout descrito pelo usuário (campo, goleiro, alvos, bola, menu):** o que mais se aproxima é **Game.jsx** (com GameField), mas não implementa a barra superior completa do print.

- **Qual arquivo deve deixar de ser tratado como tela principal?**  
  Se a decisão for “a tela validada é a do Game (GameField)”, então **GameShoot.jsx** deve deixar de ser a **única** tela principal em `/game`. Se a decisão for “a tela oficial é a integrada ao backend”, então **Game.jsx** não deve ser tratado como tela principal e pode permanecer sem rota ou ser usado apenas como referência/fallback.

- **Qual rota deveria apontar para a tela validada?**  
  Se a tela validada for a que mais se parece com o print (campo, goleiro, alvos, bola, menu), a rota **/game** deveria, em princípio, apontar para **Game.jsx** (ou para uma página que una o layout do Game com a integração de backend do GameShoot). Hoje **/game** aponta apenas para **GameShoot.jsx**.

**Importante:** Nenhuma alteração foi feita; a conclusão é apenas com base nas evidências lidas.

---

## 8. Impacto nos blocos do projeto

| Bloco | Descrição | Contaminação pela confusão |
|-------|-----------|----------------------------|
| **BLOCO E — Gameplay** | Engine, animações, gol de ouro | **Alto.** Não está claro se o “gameplay validado” é o de Game.jsx (simulado) ou GameShoot.jsx (backend). Qualquer validação de regras ou UX deve especificar qual componente é o alvo. |
| **BLOCO F — Interface** | Navegação, páginas, layout | **Alto.** A rota `/game` e os links (ex.: Dashboard “Jogar”) levam a GameShoot; se a referência visual for Game.jsx, toda validação de “tela do jogo” e acessibilidade pode estar sendo feita na tela “errada”. |
| **BLOCO G — Fluxo do jogador** | Login → dashboard → jogo → pagamentos/saque | **Médio.** O fluxo “Jogar” → `/game` → GameShoot está consistente no código; a confusão afeta a **expectativa** do usuário (qual tela verá) e a interpretação de testes E2E ou manuais que assumem “/game = tela validada”. |

### Validações a reinterpretar

- **baseline-frontend-game.json**: afirma que “/game atual” é o layout validado; na prática “/game atual” = GameShoot. Se a validação visual foi feita em outra tela (ex.: antiga ou com layout tipo Game), o baseline está associado ao componente “errado” para esse critério.
- **Relatórios que citam “GameShoot como tela de jogo”**: continuam corretos para o estado atual do código; mas se o contrato com o usuário for “tela do jogo = layout do print”, esses relatórios não garantem que a tela validada seja a que está em produção.
- **E2E ou smoke que só checam HTTP 200 em /game**: validam que a rota responde, não que o conteúdo seja o “jogo validado” pelo usuário.

---

## 9. Decisão final e próximo passo seguro

### Respostas

- **O problema está completamente identificado?**  
  **Sim.** Está identificado que: (1) `/game` e `/gameshoot` renderizam apenas **GameShoot.jsx**; (2) **Game.jsx** não está em nenhuma rota; (3) a tela descrita no print (barra com logo, saldo, chutes, ganhos, gols de ouro, seletor R$1–R$10, MENU PRINCIPAL; campo tela cheia; Recarregar e áudio nos cantos) **não existe** integralmente em nenhum arquivo; (4) Game.jsx é o que mais se aproxima do layout “campo + goleiro + alvos + bola + menu”.

- **Já há evidência suficiente para um prompt cirúrgico depois desta auditoria?**  
  **Sim.** Um prompt cirúrgico pode: (a) alterar a rota `/game` para renderizar **Game** em vez de GameShoot; (b) ou unificar layout (ex.: usar GameField/barra do Game em GameShoot e manter backend); (c) ou criar uma rota alternativa (ex.: `/game-classic`) para Game.jsx. A decisão depende de qual tela será considerada “oficial” (visual vs funcional).

- **Próximo passo seguro deve ser:**  
  **A) Corrigir rota `/game`** — se a decisão for que a tela validada é a de **Game.jsx**: fazer `/game` renderizar `<Game />` (e eventualmente manter `/gameshoot` para GameShoot ou deprecar).  
  **Ou B) Restaurar Game.jsx como fonte oficial** — no sentido de designar Game.jsx como referência visual e então: ou passá-lo para `/game`, ou portar o layout/componentes dele para dentro de GameShoot e depois descontinuar Game.jsx.  
  **Ou C) Remover GameShoot do fluxo principal** — apenas se a decisão for que GameShoot não é a tela desejada; isso exigiria substituir o conteúdo de `/game` por Game (ou por uma fusão) e manter GameShoot apenas em rota alternativa ou removê-lo do fluxo.  
  **Ou D) Outra ação** — por exemplo, implementar a barra superior exata do print (com seletor R$1–R$10 e “MENU PRINCIPAL”) em um dos componentes e então definir esse como oficial.

**Nenhuma alteração foi implementada nesta auditoria.**

---

## Classificação final

**CONFLITO REAL IDENTIFICADO**

- Duas páginas de jogo distintas existem: **Game.jsx** (não usada em rotas) e **GameShoot.jsx** (usada em `/game` e `/gameshoot`).
- A rota `/game` aponta apenas para GameShoot; o usuário associa a “tela validada” a um layout que mais se assemelha a Game.jsx (e a uma barra superior que não existe em nenhum arquivo).
- A documentação tratou “/game atual” (GameShoot) como validado, gerando contradição com a descrição visual do usuário.

---

*Auditoria realizada em modo read-only; nenhum arquivo foi alterado.*
