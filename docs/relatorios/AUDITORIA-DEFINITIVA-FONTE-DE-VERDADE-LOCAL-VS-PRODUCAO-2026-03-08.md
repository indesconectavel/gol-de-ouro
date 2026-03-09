# AUDITORIA DEFINITIVA — FONTE DE VERDADE LOCAL VS PRODUÇÃO

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, branches, rotas, deploy ou arquivos)  
**Escopo:** Comparação entre produção validada (deploy FyKKeg6zb) e ambiente local atual; rota `/game` e páginas de jogo.  
**Objetivo:** Responder com evidência se o local está alinhado à baseline validada, qual é a fonte de verdade da rota `/game`, e como restaurar/alinhar sem quebrar o validado.

---

## 1. Fonte de verdade oficial

### 1.1 Documentação local que declara FyKKeg6zb como baseline

| Documento | Conteúdo |
|-----------|----------|
| **BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md** | “FyKKeg6zb é a **baseline oficial validada** do frontend do player”; “Deployment designado como baseline: FyKKeg6zb”; “Em caso de regressão, o deployment a re-promover é **FyKKeg6zb**”. |
| **baseline-frontend-rollback.json** | `rollback_deployment_id`: "FyKKeg6zb"; rollback recomendado em caso de regressão. |
| **baseline-frontend-bundles.json** | `deployment_baseline`: "FyKKeg6zb"; bundle JS oficial: index-qIGutT6K.js; CSS: index-lDOJDUAS.css. |
| **baseline-frontend-game.json** | Baseline oficial do `/game`; `bundle_carregado`: "/assets/index-qIGutT6K.js"; `layout_validado`: “O /game atual corresponde ao layout/experiência validada pelo usuário”. |
| **REVISAO-GERAL-V1-FINANCEIRO-E-FLUXO-2026-02-28** | Deploy **FyKKeg6zb** documentado como “deploy considerado válido em produção” (pós-rollback). |
| **INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04** | “Deploy estável conhecido: FyKKeg6zb”; produção atual passou a ser ez1oc96t1 (build do main, commit 7c8cf59). |
| **FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06** | Produção atual: ez1oc96t1; FyKKeg6zb **não** aparece na lista de prod; regressão vem da troca de deployment no Vercel. |

### 1.2 Relatórios que usam FyKKeg6zb como referência

- BACKUP-GAME-FYKKeg6zb-2026-03-04.md — backup estático do build (index-qIGutT6K.js).  
- INCIDENTE-FYKKeg6zb-NETWORK-ERROR-READONLY-2026-03-04.md — análise de “Network Error” no login quando se acessa o deployment FyKKeg6zb.  
- BASELINE-FYKKeg6zb-COMMIT-ORIGEM.md — commit de origem do FyKKeg6zb (inferido 0a2a5a1 ou 7dbb4ec; não determinável com exatidão).  
- COMPARE-PREVIEW-VS-BASELINE-FYKKeg6zb-2026-03-06.md — comparação bundle baseline (index-qIGutT6K.js) vs preview (index-DVt6EjKW.js).  
- DIFF-PR29-vs-FyKKeg6zb-PAGAMENTOS-SALDO.md — FyKKeg6zb como “deploy considerado válido em produção”.  
- RELEASE-CHECKPOINT/READONLY-auditoria-shouldShowWarning — “deploy estável FyKKeg6zb não será tocado”.

### 1.3 Associação da baseline a Game.jsx ou GameShoot.jsx

- **baseline-frontend-game.json** não identifica qual componente está montado em `/game`. Apenas registra: `indicios_funcionais_no_bundle`: `has_game`: true, `has_games_shoot`: true — ou seja, **ambos** os códigos (Game e GameShoot) estão presentes no bundle da baseline.  
- Nenhum documento local afirma explicitamente “no FyKKeg6zb a rota `/game` renderiza Game.jsx” ou “renderiza GameShoot.jsx”.  
- A documentação que descreve o “/game atual” (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-game.json) foi produzida quando produção servia o bundle index-qIGutT6K.js; não há registro do conteúdo do App.jsx **naquele** build (qual `<Route path="/game">` usava).

### 1.4 Telas efetivamente validadas contra produção

- **Rotas validadas:** /, /game, /dashboard (status 200, mesmo bundle, SPA).  
- **Elementos esperados no /game (baseline-frontend-game.json):** saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal.  
- **Não foi validado contra produção (com evidência documental):** qual componente (Game vs GameShoot) estava montado em `/game` no build FyKKeg6zb.

### 1.5 Resposta: qual deve ser considerada a fonte oficial de verdade?

**A) Produção FyKKeg6zb** — com a seguinte precisão:

- **Fonte de verdade para deploy e bundle:** o deployment **FyKKeg6zb** (bundle index-qIGutT6K.js, index-lDOJDUAS.css) é a **baseline oficial validada** pelos relatórios listados acima. Qualquer comparação de “produção validada” deve usar esse deployment (ou um redeploy que sirva o mesmo bundle).  
- **Limitação:** FyKKeg6zb **não** consta na lista atual de deployments de produção (vercel-deployments-snapshot.json: FyKKeg6zb_present: false; produção atual: ez1oc96t1). O alias www/app/goldeouro.lol foi associado em algum momento ao deployment **m38czzm4q** (id dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) — vercel-deployments-50.json. Ou seja, a “produção validada” é um deployment **anterior** ao atual, documentado como baseline.  
- **Local atual** não é fonte de verdade para “o que foi validado em produção”: o código local (e o build que ele gera) está **à frente** da baseline (BASELINE-FYKKeg6zb-COMMIT-ORIGEM); o build local gera bundle com hash diferente (ex.: index-DVt6EjKW.js no build do main pós-PR #30).

**Justificativa:** A documentação do projeto define de forma explícita e repetida FyKKeg6zb como baseline oficial e rollback em caso de regressão. O local (main ou branch atual) gera outro bundle e não foi designado como substituição validada dessa baseline.

---

## 2. Comparação de rotas entre baseline e local

### 2.1 Local atual (código-fonte lido)

- **Arquivo:** goldeouro-player/src/App.jsx.  
- **Rota `/game`:** `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />` → componente **GameShoot** (GameShoot.jsx).  
- **Rota `/gameshoot`:** `<Route path="/gameshoot" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />` → componente **GameShoot**.  
- **Game.jsx:** importado mas **não** usado em nenhuma rota.

### 2.2 Evidência documental sobre o deploy FyKKeg6zb

- Não há no escopo desta auditoria (read-only, sem checkout) inspeção do App.jsx no commit que gerou o FyKKeg6zb (inferido 0a2a5a1 ou 7dbb4ec).  
- baseline-frontend-game.json e BASELINE-FRONTEND-FYKKeg6zb-OFICIAL registram que o **bundle** da baseline contém referências a “game” e “games/shoot” (`has_game`, `has_games_shoot`), mas **não** qual deles está montado na rota `/game`.  
- Conclusão documental: **não é possível afirmar com evidência apenas da documentação** se no FyKKeg6zb a rota `/game` usava Game.jsx ou GameShoot.jsx.

### 2.3 Alinhamento local vs produção (quanto à rota)

- **Produção validada (FyKKeg6zb):** componente que servia `/game` **não identificado** pelos docs (apenas que o bundle inclui Game e GameShoot).  
- **Local atual:** `/game` e `/gameshoot` usam **GameShoot.jsx**.  
- **Divergência de rota:** Só seria confirmada se fosse conhecido que no build FyKKeg6zb `/game` montava **Game.jsx**. Na ausência dessa evidência, a comparação fica em: (1) local está consistente consigo mesmo (só GameShoot nas rotas de jogo); (2) não há prova documental de que o local “mudou” a rota em relação ao FyKKeg6zb.

### 2.4 Respostas objetivas

- **`/game` na produção validada corresponde a qual componente?**  
  **Não determinado.** A documentação associa a baseline ao bundle (index-qIGutT6K.js) e aos elementos esperados na página, mas não ao nome do componente montado em `/game`.

- **`/game` no local atual corresponde a qual componente?**  
  **GameShoot.jsx** (único componente usado em `/game` e `/gameshoot` no App.jsx atual).

- **Há divergência real (rota)?**  
  **Não comprovada.** Há divergência **de build** (bundle diferente: local/build atual ≠ index-qIGutT6K.js). Quanto à **rota**, a divergência só seria real se se confirmar que no FyKKeg6zb `/game` usava Game.jsx; isso não está documentado.

---

## 3. Comparação entre Game.jsx e GameShoot.jsx

| Critério | Game.jsx | GameShoot.jsx |
|----------|----------|----------------|
| **Finalidade aparente** | Página de jogo com GameField (estádio, 6 zonas, goleiro, bola), partida 10 chutes, BettingControls, resultados. | Página de jogo integrada ao backend (gameService, POST /api/games/shoot), valor fixo R$ 1 (V1), campo 400×300, zonas TL/TR/C/BL/BR, estatísticas e Gol de Ouro. |
| **Proximidade com print validado** | Mais próxima: campo em destaque, goleiro, alvos circulares, bola, botão “Menu” no canto. Não implementa barra superior exata (seletor R$1–R$10, “MENU PRINCIPAL”). | Menos próxima: campo fixo 400×300, Recarregar no header, “Dashboard” em vez de “MENU PRINCIPAL”; sem barra única com todos os elementos do print. |
| **Integração com backend** | Não: lógica local/simulada (useState, setTimeout); não chama /api/games/shoot. | Sim: gameService.initialize(), processShot(); POST /api/games/shoot; saldo e contador global do backend. |
| **Uso nas rotas (local atual)** | Nenhuma rota; importado no App mas não referenciado em `<Route>`. | Único componente usado em `/game` e `/gameshoot`. |
| **Alinhamento com baseline FyKKeg6zb** | Incerto: o bundle da baseline contém código “game” (has_game: true); não se sabe se era o componente montado em `/game`. | Incerto: o bundle contém “games_shoot” (has_games_shoot: true); não se sabe se era o componente montado em `/game`. |

Resumo: **Game.jsx** tende a corresponder melhor ao layout descrito no print validado; **GameShoot.jsx** é o que está de fato em uso nas rotas no código local e é o que integra com o backend real. A baseline FyKKeg6zb não define qual dos dois era a “página oficial” em `/game`.

---

## 4. Divergências entre local e produção

Divergências do **local (código e/ou build)** em relação à **baseline validada (FyKKeg6zb, bundle index-qIGutT6K.js)**:

| # | Divergência | Classificação | Evidência |
|---|-------------|---------------|-----------|
| 1 | **Bundle diferente** — O build a partir do código local (main ou branch atual) gera JS/CSS com hashes diferentes do baseline (ex.: index-DVt6EjKW.js vs index-qIGutT6K.js). Produção “atual” (ez1oc96t1) já serve esse outro bundle. | **Crítica** | COMPARE-PREVIEW-VS-BASELINE-FYKKeg6zb-2026-03-06; INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04; BASELINE-FYKKeg6zb-COMMIT-ORIGEM. |
| 2 | **Produção atual não é a baseline** — O deployment de produção listado (ez1oc96t1) não é FyKKeg6zb; FyKKeg6zb não aparece na lista de prod (vercel-deployments-snapshot.json). | **Crítica** | vercel-deployments-snapshot.json; FRONTEND-VERCEL-INVESTIGACAO-REGRESSAO-GAME-READONLY-2026-03-06. |
| 3 | **Código à frente da baseline** — HEAD/local contém commits posteriores ao estado que gerou o bundle oficial (0a2a5a1 / 7dbb4ec); correções de saque, depósito, CI, etc. | **Média** | BASELINE-FYKKeg6zb-COMMIT-ORIGEM; baseline-repo-state. |
| 4 | **Rota `/game` no local** — No código atual, `/game` monta apenas GameShoot; Game.jsx não está em nenhuma rota. Se a baseline tivesse `/game` → Game, seria divergência; isso não está comprovado. | **Baixa** (ou N/A até confirmação) | App.jsx local; AUDITORIA-PROFUNDA-CONFLITO-GAME-2026-03-08. |
| 5 | **VersionWarning e outros globais** — O App.jsx local monta VersionWarning, PwaSwUpdater, etc.; o comportamento exato no bundle index-qIGutT6K.js não foi inspecionado linha a linha. | **Baixa** | App.jsx; relatórios sobre barra de versão/regressão. |

Não foram listadas divergências de backend (server-fly.js, required-env.js) nesta auditoria, pois o foco é frontend/rota `/game` e baseline de produção.

---

## 5. Origem provável do problema

### Classificação da origem provável

**D) Produção e local perderam sincronização**  
e, em conjunto,  
**E) Múltiplas fontes de verdade coexistiram.**

### Justificativa técnica e documental

1. **Perda de sincronização:** O merge do PR #30 (commit 7c8cf59) em **main** disparou o pipeline e promoveu o deployment **ez1oc96t1** para produção (INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04). A partir daí, o domínio www.goldeouro.lol passou a servir um build **diferente** do FyKKeg6zb (bundle index-DVt6EjKW.js em vez de index-qIGutT6K.js). O “local” (código em main ou na branch atual) é a base desse novo build; a “produção validada” (FyKKeg6zb) deixou de ser o deployment ativo. Ou seja, produção e baseline documentada deixaram de ser o mesmo deployment.

2. **Múltiplas fontes de verdade:** A documentação trata **FyKKeg6zb** como baseline oficial e rollback; ao mesmo tempo, o **código no repositório** (e o build que ele gera) é o que está em uso após os merges recentes. Não há convenção explícita no escopo auditado de “só promover se o build for idêntico ao FyKKeg6zb”; o pipeline promove o build do main. Assim, coexistem: (a) fonte de verdade “deploy validado” = FyKKeg6zb (bundle index-qIGutT6K.js); (b) fonte de verdade “código atual” = main/branch atual, que gera outro bundle.

3. **Rota `/game`:** A confusão entre Game.jsx e GameShoot.jsx (AUDITORIA-PROFUNDA-CONFLITO-GAME-2026-03-08) agrava a dúvida: não está documentado qual componente estava em `/game` no FyKKeg6zb. Portanto, “restaurar a rota oficial” exige primeiro definir qual componente é o oficial (por exemplo, por comparação com o print validado ou por inspeção do bundle/commit da baseline).

4. **Não se enquadra como única causa:** (A) “local evoluiu em cima de base errada” — o local evoluiu em cima de main; a “base errada” seria não usar o commit que gera index-qIGutT6K como referência. (B) “/game redirecionada indevidamente” — possível, mas não provado por documentação. (C) “GameShoot substituiu Game sem validação final” — possível e coerente com a auditoria anterior de conflito, mas não há evidência de que no FyKKeg6zb `/game` usava Game. A combinação (D)+(E) descreve de forma mais fiel o estado atual: produção e baseline dessincronizadas e duas referências (deploy validado vs código atual) coexistindo.

---

## 6. Impacto nos blocos

| Bloco | Impacto da divergência | Validações contaminadas | O que continua válido (confirmado em produção) | O que reinterpretar com FyKKeg6zb como baseline |
|-------|------------------------|-------------------------|-----------------------------------------------|--------------------------------------------------|
| **BLOCO E — Gameplay** | Se produção atual (ez1oc96t1) servir código diferente do FyKKeg6zb, qualquer validação de “comportamento em produção” feita **após** a troca de deployment refere-se ao novo build, não à baseline. | Validações que assumem “produção = FyKKeg6zb” ou “bundle index-qIGutT6K” sem verificar o deployment atual. | O que foi validado **quando** www.goldeouro.lol servia o bundle index-qIGutT6K (layout /game, elementos esperados). | Qual componente (Game vs GameShoot) deve ser a referência de gameplay; qual build (qual hash) é o “oficial” para testes E2E. |
| **BLOCO F — Interface** | Layout, barra de versão, navegação podem diferir entre baseline e build atual. | Qualquer checklist de UI que não indique contra qual bundle/deployment foi validado. | Elementos e rotas documentados na baseline-frontend-game.json e no fingerprint do FyKKeg6zb. | Que “produção atual” pode não ser a baseline; comparar sempre contra fingerprint/bundle da baseline antes de concluir “igual à produção”. |
| **BLOCO G — Fluxo do jogador** | Fluxo login → dashboard → jogo → pagamentos/saque pode ter pequenas diferenças (comportamento de componentes, CTAs). | Fluxos E2E ou manuais que não fixem o deployment (ex.: “acessar www.goldeouro.lol” sem especificar se é FyKKeg6zb ou ez1oc96t1). | Fluxo geral (rotas /, /game, /dashboard) e que /game é rota SPA do mesmo bundle. | Destino do botão “Jogar” (/game) e qual tela o usuário vê; garantir que testes de fluxo usem a baseline desejada (FyKKeg6zb ou build atual). |

---

## 7. Ordem segura de solução

A sequência abaixo evita quebrar o que já foi validado e reduz retrabalho. **Nenhuma ação foi executada nesta auditoria.**

1. **Definir a baseline obrigatória**  
   Confirmar por decisão de projeto que a **produção validada** é o deployment **FyKKeg6zb** (ou o build index-qIGutT6K.js / index-lDOJDUAS.css). Documentar essa decisão no mesmo padrão dos relatórios já existentes.

2. **Recuperar o estado da baseline no repositório (se o objetivo for “reproduzir” o FyKKeg6zb)**  
   Obter o commit SHA associado ao FyKKeg6zb (via Vercel Dashboard/API, se possível). Se não for possível, usar o commit inferido (0a2a5a1 ou 7dbb4ec) conforme BASELINE-FYKKeg6zb-COMMIT-ORIGEM, fazer build do player a partir desse commit e comparar o hash do bundle gerado com index-qIGutT6K; ajustar o commit até reproduzir o bundle (ou aceitar “proxy” do commit mais próximo). **Não** alterar main nem branches em uso; usar branch de trabalho ou tag para esse estado.

3. **Alinhar o local à baseline (quando a decisão for “trabalhar a partir da baseline”)**  
   Se a decisão for desenvolver sempre a partir do estado que gera o bundle validado: fazer checkout do commit de referência (ou da tag que o represente) em uma branch dedicada; aplicar somente mudanças aprovadas (ex.: correções de saque/depósito, CI) em cima desse commit e validar que o build resultante mantém /game, /dashboard e login conforme baseline (fingerprint e bundles). Evitar mudar a rota `/game` ou trocar Game por GameShoot (ou vice-versa) sem critério explícito de “página oficial”.

4. **Restaurar a rota `/game` oficial (se aplicável)**  
   Se ficar definido (por print validado ou inspeção do bundle/commit da baseline) que a página oficial do jogo é **Game.jsx**: alterar **apenas** o App.jsx para que `<Route path="/game">` monte `<Game />` (e, se desejado, manter `/gameshoot` com GameShoot ou deprecar). Se a página oficial for **GameShoot.jsx**, manter o estado atual do App e apenas garantir que nenhuma alteração indevida troque para Game sem aprovação. Fazer essa alteração em branch, buildar, comparar com baseline e só então promover.

5. **Validar a página oficial do jogo**  
   Após qualquer mudança de rota ou de componente: abrir /game no build de preview/produção; conferir presença de saldo, apostas, campo, goleiro, bola, botões/zonas de chute e menu (ou equivalente), conforme baseline-frontend-game.json; registrar fingerprint (HTML, bundle) para comparação futura.

6. **Reaplicar somente mudanças aprovadas em cima da baseline**  
   Novas features ou correções devem ser aplicadas sobre o commit (ou branch) que representa a baseline, com build e comparação de bundle/fingerprint antes de promote; nenhum promote para produção sem validar /game, /dashboard e login contra a baseline (conforme baseline-frontend-rollback.json e BASELINE-FRONTEND-FYKKeg6zb-OFICIAL).

7. **Rollback em caso de regressão**  
   Se após um deploy a experiência em www.goldeouro.lol divergir do validado: promover novamente o deployment **FyKKeg6zb** para Production no Vercel (se ainda existir), ou fazer redeploy a partir do commit que gera index-qIGutT6K.js / index-lDOJDUAS.css e promover esse deployment (baseline-frontend-rollback.json).

---

## 8. Decisão final

### 8.1 O local atual é confiável como fonte de verdade?

**Não**, para o critério “fonte de verdade = o que foi validado em produção”. O código local (e o build que ele gera) está **à frente** da baseline FyKKeg6zb e gera bundle com hash diferente. A documentação do projeto define a baseline como o deployment FyKKeg6zb (bundle index-qIGutT6K.js). Portanto, o local é confiável como “estado atual do repositório”, mas **não** como substituto automático da “produção validada” sem comparação explícita de bundle e fingerprint.

### 8.2 O deploy FyKKeg6zb deve ser tratado como baseline obrigatória?

**Sim.** Os relatórios BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-rollback.json, baseline-frontend-bundles.json e baseline-frontend-game.json definem FyKKeg6zb como baseline oficial e rollback. Qualquer comparação “local vs produção validada” e qualquer decisão de “restaurar produção” devem usar essa baseline até que seja formalmente substituída por outra (com documentação equivalente).

### 8.3 Já existe evidência suficiente para um prompt cirúrgico depois desta auditoria?

**Sim.** Há evidência suficiente para um prompt que: (a) alinhe o repositório (ou uma branch) ao commit que gera o bundle da baseline; (b) restaure ou confirme a rota `/game` (Game vs GameShoot) com base em critério explícito; (c) defina o procedimento de promote e rollback em relação à baseline. A auditoria não determina **qual** componente deve ser a página oficial em `/game` (isso depende da decisão de produto/design com base no print validado ou na inspeção do build da baseline).

### 8.4 Alvo do próximo prompt cirúrgico

- **A) Alinhar o local à baseline de produção** — Se a decisão for “trabalhar a partir do estado validado”: checkout do commit de referência (0a2a5a1/7dbb4ec ou SHA do FyKKeg6zb se obtido), branch dedicada, reaplicar apenas mudanças aprovadas e validar bundle/fingerprint.  
- **B) Restaurar a rota `/game` oficial** — Se a decisão for “a página oficial é Game.jsx”: alterar App.jsx para que `/game` monte `<Game />`; validar em build de preview e só então promover.  
- **C) Eliminar a página de jogo “errada” do fluxo principal** — Se a decisão for que uma das duas (Game ou GameShoot) não deve ser a tela principal: remover ou desviar a rota que a usa e manter apenas a página oficial no fluxo (Dashboard → Jogar → /game).  
- **D) Outra ação** — Ex.: obter na Vercel o commit SHA do FyKKeg6zb; criar tag no repositório para esse commit; ou formalizar a substituição da baseline por um novo deployment (com novo documento de baseline e rollback).

Recomendação: **A** ou **B** (ou A seguido de B), conforme a prioridade — primeiro alinhar à baseline, depois ajustar a rota `/game` se ficar definido que a página oficial é Game.jsx.

---

## Classificação final

**BASELINE DE PRODUÇÃO CONFIRMADA / LOCAL DIVERGENTE**

- A **produção validada** (deploy FyKKeg6zb, bundle index-qIGutT6K.js) está **confirmada** como baseline oficial pela documentação do projeto.  
- O **ambiente local atual** (código e build) está **divergente**: gera outro bundle, e o deployment atualmente em produção (ez1oc96t1) não é o FyKKeg6zb.  
- A **fonte de verdade** para “o que foi validado” é a baseline FyKKeg6zb; o local deve ser alinhado a ela (ou a um commit que reproduza seu bundle) antes de ser tratado como substituto válido para comparações de produção.

---

*Auditoria realizada em modo read-only; nenhum arquivo, rota, branch ou deploy foi alterado.*
