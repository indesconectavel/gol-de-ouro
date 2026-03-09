# VARREDURA TOTAL — LOCAL vs PRODUÇÃO vs BASELINE

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, rotas, backend, deploy, produção ou Vercel).  
**Objetivo:** Varredura total e definitiva para responder com evidência o que está em produção atual, o que compõe a baseline oficial, o que existe no local, onde divergem, e qual o procedimento definitivo para alinhar o local sem tocar na produção.

---

## 1. Produção atual — identidade real

### 1.1 Evidência nos artefatos

| Artefato | Afirmação |
|----------|-----------|
| vercel-deployments-snapshot.json | `current_production_deployment_id`: **ez1oc96t1**; `FyKKeg6zb_present`: **false**. Primeiro deployment da lista de produção = ez1oc96t1 (1d). |
| INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md | Deployment atual em produção: **ez1oc96t1**; build do main pós-merge PR #30 (commit **7c8cf59**); aliases www.goldeouro.lol, app.goldeouro.lol. Assets no HTML: **index-DVt6EjKW.js**, **index-BplTpheb.css**. |
| compare-preview-vs-baseline-fingerprint.json | Preview/deployment **ez1oc96t1**: bundle_js = **/assets/index-DVt6EjKW.js**, bundle_css = **/assets/index-BplTpheb.css**; sha256_html diferente da baseline; GET direto /game e /dashboard no preview retornam 404. |
| compare-preview-vs-baseline-risk.json | ez1oc96t1 = preview com risco alto de promote; bundle distinto da baseline; regressão documentada (barra de versão, layout). |

### 1.2 Respostas

- **Qual deployment está em produção AGORA?**  
  **ez1oc96t1** (id completo: dpl_4T2WpqnXxYcCbokKrwM6o69da51p, conforme INCIDENTE-REGRESSAO-GAME). Lista de produção (vercel-deployments-snapshot.json) tem `current_production_deployment_id`: "ez1oc96t1"; FyKKeg6zb não aparece na lista.

- **Qual bundle está em produção AGORA?**  
  **index-DVt6EjKW.js** (JS principal) e **index-BplTpheb.css** (CSS principal). Evidência: INCIDENTE-REGRESSAO-GAME (HTML servido em www com esses scripts); compare-preview-vs-baseline-fingerprint (preview ez1oc96t1 com esses hashes).

- **Fingerprint associado à produção atual:**  
  HTML raiz com tamanho e SHA256 **diferentes** da baseline: compare-preview registra para o preview (ez1oc96t1) html_length_bytes 1132, sha256_html FD63C907...; baseline tem 8985 bytes e BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0.

- **Produção atual = baseline?**  
  **Não.** A baseline oficial é o deployment **FyKKeg6zb** com bundle **index-qIGutT6K.js** e **index-lDOJDUAS.css**. A produção atual é **ez1oc96t1** com bundle **index-DVt6EjKW.js** e **index-BplTpheb.css**. Bundles e fingerprints são distintos; FyKKeg6zb não é o deployment de produção atual.

---

## 2. Baseline oficial — identidade real

### 2.1 Consolidação

| Elemento | Valor / evidência |
|----------|--------------------|
| **Deployment** | FyKKeg6zb (designado como baseline oficial e alvo de rollback). |
| **ID longo** | dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX (baseline-frontend-current.json, baseline-commit-origin.json). |
| **Bundle JS** | index-qIGutT6K.js (path /assets/index-qIGutT6K.js; tamanho ~478903 bytes). |
| **Bundle CSS** | index-lDOJDUAS.css. |
| **Fingerprint** | SHA256 HTML raiz: BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0; html_length_bytes 8985; server Vercel; rotas /, /game, /dashboard com status 200 (SPA mesmo shell). |
| **Data do build** | 16 Jan 2026 (Last-Modified do bundle JS 05:25:34 UTC, POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION). |
| **Commit inferido** | 0a2a5a1 (Merge PR #18) ou 7dbb4ec (fix CSP); não há SHA exato do Vercel (RECUPERACAO-COMMIT-FyKKeg6zb-2026-03-08). |
| **Nível de confiança do commit** | Médio (inferência por cronologia e documentação; sem confirmação por build local nem por API Vercel). |

### 2.2 Respostas

- **A baseline oficial está bem definida?**  
  **Sim**, pelo **bundle** e pelo **fingerprint**. O deployment FyKKeg6zb está documentado como baseline em múltiplos relatórios e JSONs; o bundle (index-qIGutT6K.js, index-lDOJDUAS.css) e o SHA256 do HTML raiz identificam a baseline de forma inequívoca para comparação. O **commit** exato não está definido (apenas inferido).

- **Quais elementos a identificam de forma inequívoca?**  
  (1) Deployment ID FyKKeg6zb (id longo dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX). (2) Bundle JS index-qIGutT6K.js e CSS index-lDOJDUAS.css. (3) SHA256 do HTML raiz BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0. (4) Elementos esperados no /game: saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal (baseline-frontend-game.json).

---

## 3. Local atual — identidade real

### 3.1 Rotas no App.jsx (código lido)

- **Arquivo:** goldeouro-player/src/App.jsx.
- **Rotas relevantes:**  
  - `/game` → `<ProtectedRoute><GameShoot /></ProtectedRoute>` (GameShoot.jsx).  
  - `/gameshoot` → `<ProtectedRoute><GameShoot /></ProtectedRoute>` (GameShoot.jsx).  
- **Game.jsx:** importado (`import Game from './pages/Game'`) mas **não usado em nenhuma rota**.
- **Outras rotas:** /, /register, /dashboard, /profile, /withdraw, /pagamentos, etc., conforme App.jsx.

### 3.2 Relação com baseline e produção

- **Local está à frente da baseline:** baseline-commit-origin e BASELINE-FYKKeg6zb-COMMIT-ORIGEM indicam que o repositório atual (HEAD) contém commits posteriores ao estado que gerou o bundle index-qIGutT6K (ex.: 0a2a5a1/7dbb4ec). baseline-repo-state: "HEAD atual está à frente da baseline".
- **Build local:** Um build a partir do código local (main ou branch atual) gera bundle com **hash diferente** do baseline (ex.: index-DVt6EjKW no build do main pós-PR #30, conforme compare-preview-vs-baseline e INCIDENTE-REGRESSAO-GAME). Ou seja, o **código local** é a base do deployment **ez1oc96t1** (produção atual).

### 3.3 Respostas

- **O local atual coincide com a baseline?**  
  **Não.** O local gera (ou gerou) o bundle index-DVt6EjKW.js / index-BplTpheb.css quando buildado a partir do main atual; a baseline é index-qIGutT6K.js / index-lDOJDUAS.css. O commit inferido da baseline é 0a2a5a1 ou 7dbb4ec; o local está à frente desses commits.

- **O local atual coincide com a produção atual?**  
  **Sim**, no sentido de que a **produção atual (ez1oc96t1)** é o build do **main** (commit 7c8cf59 e estado subsequente); o código no repositório (main / branch atual) é a base desse build. Portanto o local e a produção atual derivam do mesmo estado de código (main), enquanto a baseline deriva de um estado anterior (commit inferido 0a2a5a1/7dbb4ec).

- **Ou é um terceiro estado independente?**  
  **Não.** O local e a produção atual são o **mesmo** estado de código (main); a **baseline** é um estado **anterior** (outro deployment, outro bundle). Há portanto **dois** estados em jogo: (1) baseline FyKKeg6zb (bundle index-qIGutT6K); (2) local = produção atual ez1oc96t1 (bundle index-DVt6EjKW).

---

## 4. Mapa completo da rota `/game`

### 4.1 Tabela por ambiente

| Ambiente        | Rota /game | Componente / evidência | Grau de certeza |
|-----------------|------------|-------------------------|------------------|
| **Produção atual** | /game     | **Não determinado apenas por artefatos.** O bundle servido é index-DVt6EjKW.js; esse bundle contém o código do App e das páginas no estado do main (commit 7c8cf59+). No código desse estado, App.jsx monta **GameShoot** em /game. Inferência: produção atual serve **GameShoot**. | **Alta** (inferência por consistência: mesmo build que o código local, onde /game → GameShoot). |
| **Baseline**    | /game     | **Não documentado.** baseline-frontend-game.json registra elementos esperados (saldo, apostas, campo, goleiro, bola, etc.) e indicios_funcionais_no_bundle: has_game true, has_games_shoot true. Não há registro de qual componente (Game ou GameShoot) estava montado em /game no App.jsx do build index-qIGutT6K. | **Baixa** (não sabemos qual componente servia /game na baseline). |
| **Local atual** | /game     | **GameShoot.jsx** — evidência direta: App.jsx linha 49–53, `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />`. | **Total** (código-fonte lido). |

### 4.2 Tabela para `/gameshoot`

| Ambiente        | Rota /gameshoot | Componente / evidência | Grau de certeza |
|-----------------|------------------|-------------------------|------------------|
| **Produção atual** | /gameshoot     | Mesmo bundle que /game; inferência: **GameShoot** (como no código local). | **Alta**. |
| **Baseline**    | /gameshoot     | Não documentado; bundle contém has_games_shoot. | **Baixa**. |
| **Local atual** | /gameshoot     | **GameShoot.jsx** — App.jsx linha 54–58. | **Total**. |

### 4.3 Respostas objetivas

- **Sabemos com certeza qual componente servia `/game` na baseline?**  
  **Não.** A documentação da baseline não contém o App.jsx nem a declaração de rotas do build index-qIGutT6K; apenas que o bundle contém referências a "game" e "games/shoot". Não há evidência direta de que era Game.jsx ou GameShoot.jsx.

- **Sabemos com certeza qual componente serve `/game` em produção atual?**  
  **Não com evidência direta.** A conclusão é por **inferência**: produção atual serve o build do main (ez1oc96t1), e no código do main o App.jsx monta GameShoot em /game; portanto é muito provável que produção atual sirva **GameShoot**. Não foi feita inspeção do bundle em produção para extrair o componente montado.

- **Sabemos com certeza qual componente serve `/game` no local?**  
  **Sim.** No App.jsx atual, `/game` monta **GameShoot** (Game.jsx não está em nenhuma rota).

---

## 5. Inventário completo das telas de jogo

| Página/componente | Campo/goleiro/bola | Placar/saldo/ganhos/gols ouro | Menu principal | Seletor aposta | Integração backend | Em rota? |
|--------------------|-------------------|--------------------------------|----------------|----------------|--------------------|----------|
| **Game.jsx**       | Sim (GameField: estádio, 6 alvos, goleiro, bola) | Sim (saldo, Seus Chutes, Total Partida, Investimento, Ganhos Totais) | Sim (botão "Menu" canto inf. esq.) | Parcial (+/- R$1) | Não (simulado) | **Não** |
| **GameShoot.jsx**  | Sim (campo 400×300, zonas TL/TR/C/BL/BR, goleiro, bola) | Sim (saldo, Gols, Defesas, Sequência, Gols de Ouro) | Não ("Recarregar", "Dashboard") | Não (R$1 fixo V1) | Sim (gameService, POST /api/games/shoot) | **Sim** (/game, /gameshoot) |
| **GameShootSimple.jsx** | Sim (zonas, goleiro, bola) | Parcial (Saldo, Chutes 0/10) | Não | Não | Não | Não |
| **GameShootFallback.jsx** | Sim | Sim | Não | Não | Não (simulado) | Não |
| **GameShootTest.jsx** | Não | Não | Não | Não | Não | Não |

### Respostas

- **Qual é a tela funcional (integrada ao backend)?**  
  **GameShoot.jsx** — usa gameService e POST /api/games/shoot; saldo e contador vindos do backend.

- **Qual é a tela visualmente mais próxima da validada (print)?**  
  **Game.jsx** — GameField com campo em destaque, goleiro, alvos circulares, bola, botão "Menu" no canto; saldo, chutes, ganhos na UI. Nenhum arquivo implementa a barra exata do print (seletor R$1–R$10, "MENU PRINCIPAL").

- **Qual é a tela efetivamente em uso?**  
  **GameShoot.jsx** — é a única usada nas rotas `/game` e `/gameshoot` no App.jsx atual; produção atual (build do main) serve esse mesmo código.

---

## 6. Comparação com o print validado

- **Print validado:** barra superior com logo, saldo, chutes, ganhos, gols de ouro, seletor R$1/R$2/R$5/R$10, botão "MENU PRINCIPAL"; campo tela cheia; goleiro central; alvos circulares no gol; bola central; botão Recarregar canto inf. esq.; botão áudio canto inf. dir.

- **Game.jsx:** mais próximo em layout (campo em destaque, goleiro, alvos, bola, botão Menu no canto); não tem barra única completa nem "MENU PRINCIPAL" nem seletor R$1–R$10.

- **GameShoot.jsx:** mais distante (campo 400×300, Recarregar no header, "Dashboard" em vez de menu principal; sem barra com chutes/ganhos/gols de ouro no formato do print).

- **Baseline:** documentação espera "saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal"; não descreve qual componente implementa isso. **Produção atual** serve GameShoot (inferido). **Local** usa GameShoot. O print validado **alinha-se mais** com a descrição de **Game.jsx** (e com os elementos esperados da baseline em termos de "menu principal" e campo), mas não há evidência de que a baseline montava Game.jsx em /game; portanto não é possível afirmar se o print se alinha mais com a baseline, com a produção atual ou com o local — apenas que **visualmente** Game.jsx é o mais próximo do print.

---

## 7. Cadeia de divergência

Linha do tempo técnica (com base nos relatórios e artefatos):

1. **Baseline validada:** Deployment **FyKKeg6zb** servindo www.goldeouro.lol com bundle **index-qIGutT6K.js**, index-lDOJDUAS.css; build 16 Jan 2026; documentado como "layout/experiência validada" e baseline oficial. Commit inferido: 0a2a5a1 ou 7dbb4ec.

2. **Promoção de outro deployment:** Merge do **PR #30** (commit 7c8cf59, hotfix ledger user_id) em **main** (2026-03-04) disparou o pipeline; o frontend foi deployado e o deployment **ez1oc96t1** foi promovido a Production (INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04). O domínio www.goldeouro.lol passou a apontar para **ez1oc96t1** em vez de FyKKeg6zb.

3. **Estado atual da produção:** Produção = **ez1oc96t1**; bundle **index-DVt6EjKW.js**, index-BplTpheb.css; regressão visual/layout e barra de versão reportadas; FyKKeg6zb não aparece na lista de prod (vercel-deployments-snapshot).

4. **Estado atual do local:** Código = main (ou branch atual); App.jsx monta **GameShoot** em /game e /gameshoot; **Game.jsx** importado mas sem rota; build local gera bundle com hash distinto da baseline.

5. **Duplicidade Game/GameShoot:** Dois componentes de jogo coexistem: Game (GameField, simulado, não em rota) e GameShoot (backend real, em /game e /gameshoot). A documentação não define qual estava em /game na baseline; no código atual e no build do main só GameShoot está nas rotas.

6. **Remoção de sidebar / mudanças recentes:** Relatórios (AUDITORIA-COMPLETA-SIDEBAR, AUDITORIA-FINAL-PRE-PATCH-BLOCO-F) citam remoção de Navigation/sidebar em algumas telas; não é o foco desta varredura. Mudanças recentes relevantes: PR #30 → ez1oc96t1 em produção; local à frente da baseline por commits de saque, depósito, CI.

### Respostas

- **Em que momento a baseline e a produção deixaram de coincidir?**  
  No **merge do PR #30** (2026-03-04), quando o pipeline promoveu **ez1oc96t1** a Production e o domínio www passou a servir esse deployment em vez do FyKKeg6zb.

- **Em que momento o local se afastou da baseline?**  
  Quando o repositório recebeu commits **posteriores** ao estado que gera o bundle index-qIGutT6K (ex.: sequência do PR #29, depois PR #30, depois correções de saque/depósito/CI). O "local" passou a ser o estado desses commits; a baseline permaneceu fixada no deployment FyKKeg6zb (e no commit inferido 0a2a5a1/7dbb4ec).

- **Origem mais provável da confusão atual:**  
  **Produção e local perderam sincronização com a baseline** (AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE): o pipeline promove o build do main automaticamente; não houve convenção de "só promover se o build for igual à baseline". Assim, **baseline** (FyKKeg6zb, bundle index-qIGutT6K) ficou como referência "validada" e **local/produção atual** (ez1oc96t1, bundle index-DVt6EjKW) ficaram como estado "atual", sem alinhamento explícito. A **duplicidade Game/GameShoot** agrava a dúvida sobre qual tela é a "oficial" em /game, pois a baseline não documenta qual componente estava montado.

---

## 8. Impacto por bloco

| Bloco | Continua válido? | Válido com ressalvas? | Contaminado? | Reinterpretar com baseline? |
|-------|------------------|------------------------|--------------|----------------------------|
| **A — Financeiro** | Backend e fluxos PIX/saque validados em outros relatórios. | Sim: frontend em produção (ez1oc96t1) pode não ter as correções de saque/depósito do bundle pós-merge (compare-preview-vs-baseline-risk). | Parcialmente: quem testa em www vê o build atual, não a baseline. | Sim: validar fluxo financeiro contra o bundle que se queira como referência (baseline vs atual). |
| **B — Sistema de apostas** | Backend (POST /api/games/shoot, lotes) validado. | Sim: a tela de jogo em produção é GameShoot (inferido); a baseline não define qual tela estava em /game. | Sim: dúvida se a "tela validada" era Game ou GameShoot. | Sim: definir qual componente é o oficial para /game e comparar com baseline. |
| **C — Conta do usuário** | Login, perfil, registro funcionam. | Sim: dependem do mesmo bundle em produção. | Baixo. | Opcional. |
| **D — Sistema de saldo** | Backend e triggers validados. | Sim. | Baixo. | Opcional. |
| **E — Gameplay** | Lógica de chute/backend válida. | Sim: UI do jogo em produção = GameShoot; baseline não identifica componente. | Sim: conflito Game vs GameShoot; qual era o "gameplay validado" fica ambíguo. | Sim: usar baseline (fingerprint/bundle) para definir qual tela de jogo é a referência. |
| **F — Interface** | Estrutura geral de rotas. | Sim: produção e local usam GameShoot em /game; baseline não documenta. | Sim: layout/barra de versão divergem da baseline (regressão documentada). | Sim: qualquer checklist de UI deve indicar contra qual bundle/deployment foi validado. |
| **G — Fluxo do jogador** | Fluxo login → dashboard → jogo existe. | Sim: destino "Jogar" = /game = GameShoot no código atual e na produção atual. | Sim: se a "experiência validada" for a do Game.jsx, o fluxo atual entrega outra tela. | Sim: validar fluxo contra a tela considerada oficial (baseline ou decisão explícita). |

---

## 9. Riscos de ação prematura

- **O que NÃO deve ser feito agora (com base nas evidências):**  
  (1) **Alterar produção** (www.goldeouro.lol, aliases, deployment em uso) — a auditoria é apenas diagnóstico; não promover rollback nem novo deploy. (2) **Presumir** que a produção atual "é" a baseline ou que o local "é" a baseline sem validar por fingerprint. (3) **Trocar a rota /game** no código (ex.: de GameShoot para Game) sem definir por decisão explícita qual é a página oficial e sem validar em build de preview. (4) **Promover** qualquer outro deployment a produção sem comparar bundle/fingerprint com a baseline. (5) **Remover ou renomear** Game.jsx ou GameShoot.jsx sem decisão documentada sobre qual é a fonte de verdade da tela do jogo.

- **Ações perigosas sem alinhamento prévio:**  
  (1) Fazer deploy do estado atual do main como "substituição" da baseline sem validar que o resultado é aceitável e sem registrar o novo fingerprint. (2) Alterar rotas ou componentes de jogo em main e fazer promote sem teste em preview e sem critério de aceite baseado na baseline ou no print validado. (3) Tratar "produção atual" como fonte de verdade para requisitos sem reconhecer que a baseline documentada é FyKKeg6zb (bundle diferente).

- **Mudanças que poderiam quebrar produção ou invalidar a baseline:**  
  (1) Rollback para FyKKeg6zb **sem** confirmar que esse deployment ainda existe e que os aliases apontarão corretamente. (2) Alterar o backend (ex.: contratos de /api/games/shoot) sem garantir que o frontend em produção (ou o que for promovido) seja compatível. (3) Remover Game.jsx ou GameShoot.jsx sem garantir que a rota /game não quebre e sem definir qual componente é o oficial.

---

## 10. Fonte de verdade definitiva

**Resposta:** **B) Baseline FyKKeg6zb** (com precisão abaixo).

**Justificativa com evidência:**

- A documentação do projeto define de forma **explícita e repetida** o deployment **FyKKeg6zb** (bundle index-qIGutT6K.js, index-lDOJDUAS.css) como **baseline oficial validada** e como **alvo de rollback** (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-rollback.json, baseline-frontend-bundles.json, AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE). Nenhum relatório designa "produção atual" (ez1oc96t1) nem "local atual" como substituição validada dessa baseline.

- **Produção atual** (ez1oc96t1) é o estado **em uso** no domínio www, mas os relatórios classificam esse estado como **regressão** em relação à baseline (barra de versão, layout, compare-preview-vs-baseline-risk) e recomendam **não** promover ez1oc96t1 como substituição da baseline. Portanto produção atual **não** deve ser a fonte de verdade para "o que foi validado".

- **Local atual** está **à frente** da baseline e gera bundle **diferente**; foi a base do build que **substituiu** a baseline em produção. Usar o local como fonte de verdade sem alinhamento prévio à baseline perpetuaria a divergência.

- **Combinação controlada (D)** seria aceitável **depois** de alinhamento: por exemplo, "fonte de verdade para o que foi validado = baseline FyKKeg6zb; para novas mudanças = aplicar somente sobre o estado que reproduz a baseline (commit inferido ou build que bata o fingerprint), e validar antes de qualquer promote".

**Conclusão:** A fonte de verdade definitiva para orientar **qualquer mudança** que pretenda restaurar ou preservar a experiência validada é a **baseline FyKKeg6zb** (fingerprint: index-qIGutT6K.js, index-lDOJDUAS.css, SHA256 HTML BEBE03...). Produção atual e local devem ser **comparados** a essa baseline e alinhados conforme estratégia abaixo, sem alterar produção nesta fase.

---

## 11. Estratégia definitiva de alinhamento

Proposta operacional, por etapas, **sem executar nada** (apenas descrever com base nas evidências):

1. **Congelar a baseline**  
   Manter a definição atual: baseline = FyKKeg6zb (ou deployment que sirva index-qIGutT6K.js / index-lDOJDUAS.css). Não alterar documentação que designa esse bundle como referência. Não promover nenhum deployment a produção sem critério explícito de comparação com essa baseline.

2. **Reproduzir commit/build da baseline no local**  
   Em branch de trabalho (sem alterar main): checkout do commit inferido **0a2a5a1** (ou 7dbb4ec); rodar `vite build` no goldeouro-player com variáveis de ambiente alinhadas à produção (ex.: VITE_BACKEND_URL). Comparar o hash do JS/CSS gerado com **qIGutT6K** / **lDOJDUAS**. Se coincidir, esse commit é o proxy da baseline no repo. Se não coincidir, testar 7dbb4ec ou outros ancestrais; opcionalmente obter o SHA do Vercel para FyKKeg6zb (dashboard/API) e usar como referência definitiva.

3. **Validar `/game`**  
   No build gerado no passo 2 (ou no backup do bundle baseline, se disponível), abrir /game e conferir: elementos esperados (saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal); qual componente está montado (inspeção do bundle ou do código no commit). Registrar qual componente (Game ou GameShoot) servia /game na baseline, se determinável.

4. **Reaplicar somente mudanças aprovadas**  
   A partir do commit que reproduz a baseline (ou da branch que o representa), aplicar **apenas** as mudanças já aprovadas (ex.: correções de saque/depósito, CI) em branches separadas, com revisão. Evitar alterar a rota /game ou trocar Game por GameShoot (ou vice-versa) sem decisão explícita de qual é a página oficial.

5. **Comparar bundles/fingerprints**  
   Antes de qualquer deploy: para cada build candidato, comparar bundle JS/CSS e, se possível, SHA256 do HTML raiz com a baseline (index-qIGutT6K, index-lDOJDUAS, BEBE03...). Se a intenção for **manter** a experiência da baseline, o build que será promovido deve ter fingerprint idêntico ou alterações documentadas e aprovadas. Se a intenção for **evoluir** a partir da baseline, registrar o novo fingerprint e o critério de aceite.

6. **Só então considerar novo deploy**  
   Quando existir um build (a) alinhado à baseline (mesmo fingerprint ou proxy do commit inferido) **ou** (b) deliberadamente evoluído a partir dele com mudanças aprovadas e fingerprint registrado, considerar promote para produção **apenas** após validação em preview e com procedimento que não quebre a produção atual (ex.: promote em janela de manutenção, com rollback definido para FyKKeg6zb ou para o deployment que sirva o mesmo bundle).

7. **Não tocar na produção durante o alinhamento**  
   Durante toda a fase de reprodução da baseline no local, validação de /game e reaplicação de mudanças, **não** alterar o deployment servido em www.goldeouro.lol; a produção atual permanece como está até que haja decisão explícita e procedimento seguro de rollback ou promote.

---

## 12. Decisão final

- **Já temos informações suficientes para agir com segurança?**  
  **Sim**, para **alinhar o local** e para **definir critérios** de qualquer deploy futuro. As informações suficientes são: identidade da produção atual (ez1oc96t1, bundle index-DVt6EjKW); identidade da baseline (FyKKeg6zb, bundle index-qIGutT6K); identidade do local (App.jsx com /game → GameShoot; código à frente da baseline); commit inferido da baseline (0a2a5a1 ou 7dbb4ec); e procedimento de comparação por fingerprint. **Não** temos informação suficiente para afirmar **qual componente** servia /game na baseline (Game vs GameShoot) sem inspecionar o bundle ou o código no commit da baseline.

- **O que ainda continua incerto?**  
  (1) Qual componente (Game ou GameShoot) estava montado em /game no build da baseline. (2) Confirmação por build local de que o commit 0a2a5a1 (ou 7dbb4ec) gera exatamente o bundle index-qIGutT6K. (3) Se o deployment FyKKeg6zb ainda existe no Vercel e pode ser promovido em caso de rollback.

- **Qual é o próximo prompt cirúrgico correto após esta auditoria?**  
  Um prompt que: (a) **reconstrua o local a partir da baseline** (checkout 0a2a5a1 ou 7dbb4ec, build, comparação de hash com qIGutT6K/lDOJDUAS) **ou** (b) **valide visualmente** qual componente corresponde ao print validado e ao /game da baseline (inspeção do bundle ou do código no commit) **e** (c) **documente** qual componente deve ser a página oficial em /game e, se for o caso, altere a rota no código (em branch) para alinhar à decisão, **sem** alterar produção até que um build aprovado seja promovido com procedimento seguro.

- **Alvo do próximo prompt:**  
  **A) Reconstrução local a partir da baseline** — prioridade para eliminar a incoerência entre local e baseline: reproduzir o build da baseline no repositório (commit inferido + validação por fingerprint), depois reaplicar somente mudanças aprovadas. Complementar com **B) Validação visual comparativa do /game** se for necessário decidir entre Game e GameShoot como página oficial.

---

## Classificação final

**DIVERGÊNCIA TOTALMENTE MAPEADA**

- **Produção atual:** deployment ez1oc96t1, bundle index-DVt6EjKW.js / index-BplTpheb.css; **não** é a baseline.  
- **Baseline oficial:** deployment FyKKeg6zb, bundle index-qIGutT6K.js / index-lDOJDUAS.css; bem definida por fingerprint e documentação; commit inferido 0a2a5a1 ou 7dbb4ec.  
- **Local atual:** código à frente da baseline; /game e /gameshoot montam **GameShoot**; **Game.jsx** não está em nenhuma rota; build local = mesmo estado que produção atual (main).  
- **Divergência:** produção e local divergem da baseline (bundle e fingerprint diferentes); único ponto não determinado por evidência direta é **qual componente** servia /game na baseline (Game vs GameShoot).  
- **Fonte de verdade:** baseline FyKKeg6zb. **Estratégia:** alinhar o local à baseline (reproduzir commit/build, validar /game, reaplicar mudanças aprovadas, comparar fingerprints) **sem tocar na produção** até decisão e procedimento seguros.

---

*Auditoria realizada em modo read-only; nenhum código, rota, backend, deploy, produção ou Vercel foi alterado.*
