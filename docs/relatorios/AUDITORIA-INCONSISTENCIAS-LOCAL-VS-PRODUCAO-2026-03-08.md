# AUDITORIA DE INCONSISTÊNCIAS — LOCAL vs PRODUÇÃO

**Data:** 2026-03-08  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, rotas, deploy, Vercel ou produção).  
**Escopo:** Comparação entre **produção atual** (www.goldeouro.lol) e **ambiente local atual** (código do repositório); identificação de inconsistências sem confundir com a baseline FyKKeg6zb.  
**Produção atual não deve ser modificada.**

---

## 1. Identidade dos ambientes

| Ambiente | Deployment | Bundle JS | Bundle CSS | Status |
|----------|------------|-----------|------------|--------|
| **Produção atual** | ez1oc96t1 (dpl_4T2WpqnXxYcCbokKrwM6o69da51p) | index-DVt6EjKW.js | index-BplTpheb.css | Em uso em www.goldeouro.lol |
| **Baseline oficial** | FyKKeg6zb | index-qIGutT6K.js | index-lDOJDUAS.css | Documentada; não é o deploy atual |
| **Local atual (build)** | N/A (não deployado) | Gerado pelo build local; se build a partir do mesmo commit que originou ez1oc96t1: mesmo hash (index-DVt6EjKW) | idem | Código = base do build ez1oc96t1 quando derivado do main |

**Respostas:**

- **Qual deployment está servindo a produção atual?**  
  **ez1oc96t1** (evidência: vercel-deployments-snapshot.json, INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04, compare-preview-vs-baseline-fingerprint.json).

- **Qual bundle está servindo a produção atual?**  
  **index-DVt6EjKW.js** (JS principal) e **index-BplTpheb.css** (CSS principal). Evidência: HTML servido em www com esses scripts; compare-preview-vs-baseline-fingerprint (preview/deployment ez1oc96t1).

- **Qual bundle está associado ao local atual?**  
  O build a partir do **código local** (main ou branch atual) gera hashes que dependem do conteúdo dos módulos. Se o local for o **mesmo estado** que gerou ez1oc96t1 (main no momento do deploy), o bundle seria o mesmo (index-DVt6EjKW / index-BplTpheb). Se o local tiver commits ou alterações posteriores (ex.: hotfix/financeiro-v1-stabilize, correção de saque), o bundle gerado terá **hashes diferentes**.

- **Local atual coincide com produção atual?**  
  **Sim no estado de código que originou ez1oc96t1:** produção atual é o build do main (commit 7c8cf59 e equivalente); o repositório nesse estado é a base desse build (VARREDURA-TOTAL, INCIDENTE-REGRESSAO-GAME). **Com ressalva:** se o local estiver em branch ou commit **posterior** (ex.: correções de saque/depósito, CI), o código local **não** coincide exatamente com o que está em produção; nesse caso há inconsistência potencial (ex.: tela de saque).

- **Produção atual coincide com baseline?**  
  **Não.** A baseline oficial é FyKKeg6zb (index-qIGutT6K.js, index-lDOJDUAS.css). A produção atual é ez1oc96t1 (index-DVt6EjKW.js, index-BplTpheb.css). Bundles e fingerprints são distintos.

---

## 2. Mapa de rotas

Comparação entre rotas no código local e evidência documental da produção atual (mesmo bundle = mesmo App e rotas).

| Rota | Local atual | Produção atual (documentado/inferido) | Divergência? | Componente local | Certeza produção |
|------|-------------|----------------------------------------|--------------|-------------------|-------------------|
| / | Login | Login (bundle index-DVt6EjKW; SPA na raiz) | Não | Login.jsx | Alta |
| /register | Register | Mesmo bundle | Não | Register.jsx | Alta |
| /dashboard | Dashboard (ProtectedRoute) | 200 / SPA; conteúdo do bundle | Não | Dashboard.jsx | Alta |
| /game | GameShoot (ProtectedRoute) | GameShoot (inferido: mesmo build que local) | Não | GameShoot.jsx | Alta (inferência) |
| /gameshoot | GameShoot (ProtectedRoute) | GameShoot (inferido) | Não | GameShoot.jsx | Alta |
| /profile | Profile (ProtectedRoute) | Mesmo bundle | Não | Profile.jsx | Alta |
| /withdraw | Withdraw (ProtectedRoute) | Mesmo bundle; fluxo de saque pode diferir se local tiver correção não deployada | Funcional (ver seção 5) | Withdraw.jsx | Alta (rota); média (comportamento) |
| /pagamentos | Pagamentos (ProtectedRoute) | Mesmo bundle | Não | Pagamentos.jsx | Alta |
| /terms, /privacy, /download, /forgot-password, /reset-password | Respectivos componentes | Mesmo bundle | Não | Terms, Privacy, DownloadPage, etc. | Alta |

**Conclusão:** Não há divergência de **declaração de rotas** entre local e produção atual: o mesmo App (rotas e componentes) está no build ez1oc96t1. A única dúvida funcional é se o **comportamento** da tela de saque (/withdraw) em produção é idêntico ao do código local (ex.: local com withdrawService vs produção com createPix).

---

## 3. Inventário das páginas

Para cada página principal, comparação entre local e produção atual (inferida pelo mesmo bundle).

| Página | Local atual | Produção atual (documentado/inferido) | Diferença |
|--------|-------------|----------------------------------------|----------|
| / | Login; VersionWarning, PwaSwUpdater | Login; bundle index-DVt6EjKW; banner "VERSÃO ATUALIZADA" documentado no preview ez1oc96t1 | Nenhuma estrutural; HTML raiz menor (1132 bytes) que baseline (8985) — fingerprint distinto da baseline |
| /dashboard | Dashboard com Navigation, VersionBanner, saldo, dados PIX, retryLogic, quickDashboardTest | Mesmo componente (mesmo bundle) | Nenhuma |
| /game | GameShoot: campo 400×300, zonas TL/TR/C/BL/BR, saldo, Recarregar, Dashboard, gameService | GameShoot (inferido) | Nenhuma |
| /gameshoot | GameShoot (mesmo que /game) | GameShoot (inferido) | Nenhuma |
| /pagamentos | Pagamentos; fluxo depósito PIX | Mesmo (bundle); relatórios citam possível "Verificar Status" em versão antiga | Incerteza apenas se houver deploy intermediário com simplificação do depósito não em ez1oc96t1 |
| /withdraw | Withdraw; no código lido usa paymentService.createPix e getUserPix para histórico | Produção (ez1oc96t1) documentada como **sem** withdrawService; saque chama createPix/getUserPix | **Sim:** se local tiver branch/commit com withdrawService, local difere de produção (produção = fluxo antigo) |
| /profile | Profile | Mesmo bundle | Nenhuma |

**Nota:** O arquivo Withdraw.jsx lido no repositório usa `paymentService.createPix` (linha 109) e `paymentService.getUserPix` para histórico; portanto, se o local estiver nesse estado e sem withdrawService, local e produção são **consistentes** para /withdraw. A documentação (frontend-player-deploy-safe-withdraw-check.json, FRONTEND-PLAYER-DEPLOY-SAFE) afirma que o **commit da correção** (258b0cd, withdrawService) **não** está no build de produção; logo produção = createPix. Se no repositório atual existir branch/commit com withdrawService, esse estado local seria **à frente** da produção e inconsistente até o deploy.

---

## 4. Inconsistências visuais

Com base em relatórios anteriores, baseline, produção atual e estrutura do código.

| Área | Descrição | Severidade | Evidência |
|------|-----------|------------|-----------|
| **Barra de versão / VersionWarning** | Produção atual (ez1oc96t1) exibe banner "VERSÃO ATUALIZADA"; baseline (FyKKeg6zb) não ou com comportamento diferente. | Média | INCIDENTE-REGRESSAO-GAME; compare-preview-vs-baseline-routes |
| **Layout /game** | Tela do jogo em produção = GameShoot (campo 400×300, Recarregar no header). Print validado é mais próximo de Game.jsx (campo em destaque, Menu no canto). | Média | AUDITORIA-PROFUNDA-CONFLITO-GAME; ELIMINACAO-FINAL-INCERTEZAS; baseline-frontend-game.json |
| **Dashboard** | Estrutura e componentes iguais ao bundle; VersionBanner no local. | Baixa | Dashboard.jsx; mesmo bundle em prod |
| **Pagamentos** | Sem relato de diferença visual crítica entre local e produção atual para o mesmo bundle. | Baixa | — |
| **Withdraw** | Mesma página; diferença é de **fluxo** (createPix vs withdraw/request), não necessariamente layout. | Baixa (visual) | — |
| **Fingerprint HTML** | HTML raiz em produção atual (ez1oc96t1): 1132 bytes, SHA256 FD63C907...; baseline: 8985 bytes, BEBE03... | Média (para comparação com baseline; não para local vs prod) | compare-preview-vs-baseline-fingerprint |

**Respostas:**

- **Quais são as diferenças visuais mais importantes entre local e produção atual?**  
  Entre **local e produção atual** (mesmo código/bundle), não há diferença visual relevante documentada: ambos servem o mesmo App e as mesmas páginas. As diferenças visuais importantes são entre **produção atual e baseline** (barra de versão, layout /game vs print validado).

- **Quais afetam validações já feitas?**  
  As validações que assumiam "produção = baseline" (FyKKeg6zb) ficam afetadas, pois produção atual é ez1oc96t1. Validações feitas **contra produção atual** (www.goldeouro.lol no estado atual) permanecem válidas para esse estado.

---

## 5. Inconsistências funcionais

| Rota/Página | Local | Produção atual | Diferença funcional? | Evidência |
|-------------|-------|----------------|----------------------|-----------|
| /game | GameShoot; gameService.processShot; POST /api/games/shoot | Idem (inferido) | Não | Mesmo bundle |
| /dashboard | apiClient PROFILE; retryLogic; quickDashboardTest (DEV) | Idem | Não | Mesmo bundle |
| /withdraw | Código lido: paymentService.createPix, getUserPix | Documentado: createPix/getUserPix (sem withdrawService no build) | **Não** se local = mesmo commit que prod; **Sim** se local tiver withdrawService (branch/commit posterior) | Withdraw.jsx (createPix linha 109); frontend-player-deploy-safe-withdraw-check.json |
| /pagamentos | Fluxo depósito PIX | Idem (bundle) | Não | — |
| /profile | apiClient PROFILE | Idem | Não | — |

**Respostas:**

- **Existe alguma diferença funcional importante entre local e produção?**  
  **Depende do estado do repositório.** Se o local for **exatamente** o código que gerou ez1oc96t1 (main no momento do deploy), **não** há diferença funcional. Se o local tiver **commits ou alterações posteriores** (ex.: correção de saque com withdrawService, simplificação de depósito), então **sim**: em produção a tela de saque ainda usa createPix/getUserPix; no local (nesse branch) poderia usar POST /api/withdraw/request e GET /api/withdraw/history.

- **Se sim, onde?**  
  Na tela **/withdraw** (fluxo de saque e histórico), quando o código local inclui withdrawService e a produção não.

---

## 6. Inconsistências de componente

| Pergunta | Resposta |
|----------|----------|
| **Existe evidência de que produção atual use componente diferente do local em alguma rota?** | **Não.** O build de produção (ez1oc96t1) é o build do main (ou estado equivalente); o App e as rotas são os mesmos do código que gerou esse build. Não há documento que indique que em ez1oc96t1 a rota /game monta Game.jsx ou outro componente distinto do local. |
| **Inferência mais forte** | **Produção atual e local (no mesmo estado de código) usam os mesmos componentes:** /game e /gameshoot → GameShoot; /dashboard → Dashboard; /withdraw → Withdraw; etc. A única variação possível é de **comportamento** (ex.: Withdraw com createPix vs withdrawService) por diferença de commit/branch, não de componente montado na rota. |

---

## 7. Inconsistências de fluxo

Fluxo do jogador: login → dashboard → depositar → jogar → resultado → sacar → perfil.

| Etapa | Local | Produção atual | Coerente? |
|-------|-------|----------------|-----------|
| Login | / → Login | Idem | Sim |
| Dashboard | /dashboard → Dashboard | Idem | Sim |
| Depositar | /pagamentos → Pagamentos; fluxo PIX | Idem | Sim |
| Jogar | /game ou /gameshoot → GameShoot; POST /api/games/shoot | Idem | Sim |
| Resultado | Toasts; overlays GOOOL/DEFENDEU; saldo atualizado | Idem | Sim |
| Sacar | /withdraw → Withdraw; se código = prod: createPix/getUserPix; se local com fix: withdraw/request e history | Produção: createPix/getUserPix | Coerente se mesmo código; incoerente se local tiver fix não deployado |
| Perfil | /profile → Profile | Idem | Sim |

**Respostas:**

- **O fluxo local está coerente com a produção atual?**  
  **Sim**, quando o código local é o **mesmo** que o build em produção (mesmo commit/branch). **Com ressalva** quando o local está à frente (branch com correção de saque): aí o fluxo de **saque** no local pode ser diferente do da produção.

- **Há alguma quebra de jornada entre os modos?**  
  **Não** em termos de rotas e páginas servidas. **Possível** em termos de sucesso do saque (produção usando endpoint de depósito para saque até que seja feito deploy do fix).

---

## 8. Impacto nos blocos

| Bloco | Coerente entre local e produção? | Classificação | Observação |
|-------|----------------------------------|---------------|------------|
| **A — Financeiro** | Coerente com ressalvas | Coerente com ressalvas | Backend PIX/saque validado; frontend em produção (ez1oc96t1) pode não ter correção de saque (createPix no /withdraw). Local pode ter fix em branch. |
| **B — Sistema de apostas** | Sim | Coerente | POST /api/games/shoot; GameShoot em /game em ambos. |
| **C — Conta do usuário** | Sim | Coerente | Login, perfil, registro; mesmo bundle. |
| **D — Sistema de saldo** | Sim | Coerente | Backend e triggers; frontend consome profile/saldo igual. |
| **E — Gameplay** | Sim | Coerente | GameShoot; gameService; mesmo comportamento. |
| **F — Interface** | Sim | Coerente | Rotas e componentes iguais; diferença visual é em relação à baseline, não local vs prod. |
| **G — Fluxo do jogador** | Sim (com ressalva em saque se local à frente) | Coerente com ressalvas | Fluxo completo presente; saque pode diferir se local tiver withdrawService e produção não. |

---

## 9. O que está consistente

- **Deployment de produção:** ez1oc96t1 servindo www.goldeouro.lol; documentado e estável.
- **Bundle em produção:** index-DVt6EjKW.js, index-BplTpheb.css; identificado por fingerprint e relatórios.
- **Rotas:** Mesmo conjunto de rotas no App (/, /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos, etc.) no código que gerou ez1oc96t1 e no local quando no mesmo estado.
- **Componente em /game e /gameshoot:** GameShoot em ambos (local = código; produção = inferido pelo mesmo build).
- **Login, dashboard, profile, pagamentos (depósito):** Estrutura e integração iguais; mesmo bundle.
- **Gameplay:** gameService, POST /api/games/shoot, saldo, lotes, Gol de Ouro; comportamento alinhado quando mesmo código.
- **Navegação e proteção:** ProtectedRoute nas rotas protegidas; mesmo App.
- **Local = base do build de produção:** O código no repositório (main no momento do deploy) é a origem do ez1oc96t1; não há “terceiro” código em produção.

---

## 10. O que está inconsistente

Cada item com rota/página, tipo, severidade e evidência.

| # | Rota/Página | Tipo de inconsistência | Severidade | Evidência |
|---|-------------|------------------------|------------|-----------|
| 1 | /withdraw | **Funcional** — Se o local tiver commit/branch com withdrawService (POST /api/withdraw/request, GET /api/withdraw/history), produção ainda usa createPix/getUserPix. | **Crítica** (para fluxo de saque em produção) | frontend-player-deploy-safe-withdraw-check.json; FRONTEND-PLAYER-DEPLOY-SAFE; Withdraw.jsx (createPix no código lido) |
| 2 | Produção vs baseline | **Bundle/fingerprint** — Produção atual ≠ baseline (ez1oc96t1 ≠ FyKKeg6zb; hashes diferentes). Não é inconsistência local vs prod, mas entre prod e referência validada. | Média (para decisões de rollback/validação) | compare-preview-vs-baseline-fingerprint; VARREDURA-TOTAL |
| 3 | /game (vs print validado) | **Visual** — Layout em produção (GameShoot) difere do print validado (mais próximo de Game.jsx). Não é diferença local vs prod. | Média | AUDITORIA-PROFUNDA-CONFLITO-GAME; ELIMINACAO-FINAL-INCERTEZAS |

**Nota:** Se o repositório atual estiver **exatamente** no commit que gerou ez1oc96t1 e sem alterações em Withdraw.jsx (createPix), então **não** há inconsistência funcional entre local e produção; a única “inconsistência” listada seria a da produção em relação à baseline e ao print.

---

## 11. Riscos de agir sem realinhamento

- **Quais ações seriam perigosas sem corrigir essas inconsistências?**
  - **Alterar produção** (deploy, rollback, aliases) sem definir se o alvo é baseline (FyKKeg6zb) ou estado atual (ez1oc96t1).
  - **Presumir** que a tela de saque em produção usa POST /api/withdraw/request sem confirmar no Network (produção pode ainda usar createPix).
  - **Testar fluxos E2E** em www assumindo comportamento “corrigido” de saque sem confirmar o bundle/commit em produção.
  - **Trocar rota /game** (Game vs GameShoot) ou fazer mudanças visuais grandes sem critério de aceite e sem validar em preview.

- **O que não deve ser modificado ainda?**
  - Produção (www.goldeouro.lol, deployment, aliases).
  - Backend (contratos de /api/games/shoot, /api/withdraw/request) sem garantir compatibilidade com o frontend em produção.
  - Rotas ou componentes em main que alterem /game ou /withdraw sem deploy planejado e critério de aceite.

- **O que pode ser trabalhado localmente sem risco?**
  - Ajustes visuais em branch (ex.: reconciliação Game/GameShoot conforme AUDITORIA-RECONCILIACAO-GAME) sem merge nem deploy.
  - Correções e testes em branch (ex.: withdrawService) com validação em preview antes de qualquer promote.
  - Documentação, relatórios e análise de fingerprint/bundle sem alterar código em produção.

---

## 12. Decisão final

- **Local atual está suficientemente alinhado à produção atual para seguir com ajustes visuais?**  
  **Sim**, quando o **código local** é o mesmo que o build em produção (mesmo commit/branch): rotas, páginas e componentes são os mesmos; não há divergência de declaração de rotas nem de componente em /game. Nesse caso, ajustes visuais em branch (ex.: melhorar layout do GameShoot com partes do Game.jsx) podem ser feitos localmente sem conflito com “o que está em produção”.  
  **Com ressalva:** Se o local estiver em branch com correção de saque (withdrawService), há uma **inconsistência funcional** (saque) até que esse estado seja deployado ou que se opte por manter produção como está; isso não impede trabalhar ajustes visuais em paralelo, mas deve ser considerado para testes e demos.

- **Ou ainda existem inconsistências que precisam ser resolvidas antes?**  
  **Depende do estado do repositório.** Se a única diferença for “produção vs baseline” (e não “local vs produção”), não é obrigatório “resolver” antes de ajustes visuais — basta não confundir produção atual com baseline. Se houver branch local com withdrawService não deployado, a inconsistência **funcional** do saque existe até deploy ou decisão de não promover; não bloqueia trabalho visual em branch.

- **Próximo passo seguro recomendado:**
  - **A) Seguir com ajustes visuais locais** — **Sim**, em branch dedicada, sem alterar produção; validar em preview e comparar com critério de aceite (baseline ou produção atual, conforme decisão).
  - **B) Primeiro alinhar local e produção atual** — Necessário apenas se “alinhar” significar “garantir que o próximo deploy seja explícito e validado”; não exige reverter código local para igualar produção, e sim definir o que será promovido e quando.
  - **C) Isolar diferenças por página** — Útil para /withdraw (documentar “em produção = createPix; em branch X = withdrawService”) e para /game (documentar “produção e local = GameShoot; print validado = mais próximo de Game.jsx”).
  - **D) Outra ação** — Ex.: validar em produção (Network) se o saque chama createPix ou withdraw/request e documentar o resultado; ou congelar produção atual como referência e trabalhar apenas em branch até decisão de deploy.

**Recomendação:** **A) Seguir com ajustes visuais locais** em branch, mantendo produção intacta e documentando se há ou não correção de saque no estado local vs produção. Complementar com **C)** para deixar explícitas as diferenças por página (withdraw, /game vs print).

---

## Classificação final

**LOCAL E PRODUÇÃO CONSISTENTES COM RESSALVAS**

- **Consistentes:** Rotas, componentes montados (/game, /dashboard, /withdraw, etc.), bundle em produção (ez1oc96t1 = index-DVt6EjKW), e código local (no mesmo estado que originou esse build) são alinhados. Não há evidência de componente diferente em nenhuma rota entre local e produção atual.
- **Ressalvas:** (1) Se o local tiver commits/branch com correção de saque (withdrawService), há inconsistência **funcional** até deploy. (2) Produção atual não é a baseline (FyKKeg6zb); comparações de “validação” ou “rollback” devem usar a baseline, não apenas “produção atual”. (3) Layout do /game (GameShoot) difere do print validado (mais próximo de Game.jsx); isso não é inconsistência local vs prod, mas entre experiência validada e estado atual.
- **Conclusão:** É seguro trabalhar **localmente** em ajustes visuais e em branches, sem alterar produção. O alinhamento entre local e produção atual é suficiente para esse fim, desde que se tenha clareza sobre o estado do repositório (mesmo commit que prod ou branch à frente) e sobre o que não modificar (produção, baseline como referência).

---

*Auditoria realizada em modo read-only; nenhum código, rota, deploy ou produção foi alterado. Foco exclusivo em produção atual (ez1oc96t1) vs local atual.*
