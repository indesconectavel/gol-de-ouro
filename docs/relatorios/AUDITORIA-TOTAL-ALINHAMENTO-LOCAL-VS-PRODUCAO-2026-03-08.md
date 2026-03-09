# AUDITORIA TOTAL DE ALINHAMENTO — LOCAL vs PRODUÇÃO (READ-ONLY ABSOLUTO)

**Data:** 2026-03-08  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, build, deploy, env ou produção).  
**Objetivo:** Estabelecer, com evidência, o que no local está alinhado à produção validada, o que diverge, o que é legítimo ou perigoso, e se o local pode ser tratado como espelho confiável da produção.

---

## 1. Escopo e método

### Modo read-only

- Apenas leitura de arquivos, grep, inspeção de rotas/componentes/serviços/configs.  
- Nenhuma alteração de código, env, build, deploy ou produção.  
- Toda conclusão aponta para arquivo, rota, import, componente, condição ou evidência documental já existente.

### Limitações

- O build exato da produção validada (FyKKeg6zb) não foi reproduzido nesta sessão; a comparação usa documentação (baseline-frontend-*, relatórios) e o código atual do repositório.  
- Não foi feita inspeção do bundle minificado em produção; inferências sobre componente em /game na baseline baseiam-se em relatórios e no commit proxy.  
- Variáveis de ambiente em produção (Vercel) não foram lidas; apenas .env* e config no repositório.

### Fonte de verdade de produção

- **Referência oficial:** Deploy Vercel **FyKKeg6zb**.  
- **Fingerprint documentado:** JS **index-qIGutT6K.js**, CSS **index-lDOJDUAS.css**.  
- **Evidência:** baseline-frontend-bundles.json, baseline-frontend-fingerprint.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, VARREDURA-TOTAL-LOCAL-PRODUCAO-BASELINE-2026-03-08.md.  
- **Nota:** O deployment **em uso** atualmente em www.goldeouro.lol é **ez1oc96t1** (bundle index-DVt6EjKW.js / index-BplTpheb.css), não FyKKeg6zb. A baseline FyKKeg6zb é a referência **validada** para comparação; produção atual ≠ baseline.

---

## 2. Produção validada

| Item | Valor | Evidência |
|------|--------|-----------|
| **Deploy** | FyKKeg6zb (id longo dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) | baseline-frontend-rollback.json, baseline-commit-origin.json |
| **Bundle JS** | index-qIGutT6K.js | baseline-frontend-bundles.json, baseline-frontend-fingerprint.json |
| **Bundle CSS** | index-lDOJDUAS.css | idem |
| **SHA256 HTML raiz** | BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0 | compare-preview-vs-baseline-fingerprint.json (baseline) |
| **Build date** | 2026-01-16T05:25:34Z (Last-Modified) | baseline-build-info.json, POST-ROLLBACK-VERCEL-FyKKeg6zb |
| **Elementos /game (documentados)** | saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal | baseline-frontend-game.json |

### Prints e evidências conhecidas

- Login sem banner verde; jogo com header (Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO), botões R$1–R$10, MENU PRINCIPAL; estádio, gol com rede, goleiro, bola, alvos; Recarregar, Som (enunciados de prompts e baseline-frontend-game.json).  
- CONFIRMACAO-DEFINITIVA-BASELINE-GAME-2026-03-08: no commit proxy (0a2a5a1/7dbb4ec) a rota /game monta **GameShoot**; o bundle local não reproduziu o hash qIGutT6K (variação de build).

---

## 3. Mapa completo de rotas reais

Evidência: leitura de `goldeouro-player/src/App.jsx` (único arquivo de rotas usado por `main.jsx`).

| Path | Componente montado | Arquivo | Proteção | Wrappers | Redirecionamento |
|------|--------------------|---------|----------|----------|------------------|
| / | Login | pages/Login.jsx | Nenhuma | — | — |
| /register | Register | pages/Register.jsx | Nenhuma | — | — |
| /forgot-password | ForgotPassword | pages/ForgotPassword.jsx | Nenhuma | — | — |
| /reset-password | ResetPassword | pages/ResetPassword.jsx | Nenhuma | — | — |
| /terms | Terms | pages/Terms.jsx | Nenhuma | — | — |
| /privacy | Privacy | pages/Privacy.jsx | Nenhuma | — | — |
| /download | DownloadPage | pages/DownloadPage.jsx | Nenhuma | — | — |
| /dashboard | Dashboard | pages/Dashboard.jsx | ProtectedRoute | AuthProvider | !user → / |
| /game | GameShoot | pages/GameShoot.jsx | ProtectedRoute | idem | !user → / |
| /gameshoot | GameShoot | pages/GameShoot.jsx | ProtectedRoute | idem | !user → / |
| /profile | Profile | pages/Profile.jsx | ProtectedRoute | idem | !user → / |
| /withdraw | Withdraw | pages/Withdraw.jsx | ProtectedRoute | idem | !user → / |
| /pagamentos | Pagamentos | pages/Pagamentos.jsx | ProtectedRoute | idem | !user → / |

**Rota /login:** Não existe; login está em **/** (App.jsx linha 35).

**Wrappers globais (App.jsx):** ErrorBoundary → AuthProvider → SidebarProvider → Router; dentro do Router: div com VersionWarning (linha 32), PwaSwUpdater (linha 33), Routes.

---

## 4. Componentes ativos vs não ativos

### Páginas reais (roteadas e ativas)

| Página | Rota(s) | Evidência |
|--------|---------|-----------|
| Login | / | App.jsx linha 35 |
| Register | /register | linha 36 |
| ForgotPassword | /forgot-password | linha 37 |
| ResetPassword | /reset-password | linha 38 |
| Terms | /terms | linha 39 |
| Privacy | /privacy | linha 40 |
| DownloadPage | /download | linha 41 |
| Dashboard | /dashboard | linhas 44–46 |
| GameShoot | /game, /gameshoot | linhas 47–51, 52–56 |
| Profile | /profile | linhas 58–61 |
| Withdraw | /withdraw | linhas 63–66 |
| Pagamentos | /pagamentos | linhas 68–71 |

### Páginas importadas mas não roteadas

| Página | Classificação | Evidência |
|--------|----------------|-----------|
| **Game.jsx** | Blueprint visual / alternativa não ativa | App.jsx linha 13: import; nenhum `<Route>` usa `<Game />` |
| **GameShootFallback.jsx** | Legado / fallback | App.jsx linha 15: import; não referenciado em Route |
| **GameShootTest.jsx** | Experimental / teste | App.jsx linha 16: import; não referenciado em Route |
| **GameShootSimple.jsx** | Legado / alternativo | App.jsx linha 17: import; não referenciado em Route |

### Respostas

- **Tela de jogo ativa de verdade:** **GameShoot.jsx** (rotas /game e /gameshoot).  
- **Alternativas não ativas:** Game.jsx, GameShootFallback, GameShootTest, GameShootSimple.  
- **Telas que podem causar confusão histórica:** **Game.jsx** — layout mais próximo da descrição validada (estádio, gol com rede, Menu) mas **não está em nenhuma rota**; quem assume que /game mostra Game está errado no código atual.

---

## 5. Banners, warnings e camadas de dev

### VersionBanner (banner verde)

| Atributo | Valor |
|----------|--------|
| **Arquivo** | goldeouro-player/src/components/VersionBanner.jsx |
| **Texto** | "VERSÃO ATUALIZADA", "DEPLOY REALIZADO EM", opcionalmente HORÁRIO e ACESSO (linhas 29–36) |
| **Estilo** | fixed top-0, bg-green-600, z-50 (linha 25) |
| **Condição** | Sem condicional no código; renderizado sempre onde importado |
| **Valores** | Props ou import.meta.env.VITE_BUILD_VERSION, VITE_BUILD_DATE, VITE_BUILD_TIME (linhas 11–16) |

**Onde aparece:** Login.jsx (42–43), Dashboard.jsx (107–108), Register.jsx (67–68), Profile.jsx (157–158), Pagamentos.jsx (126–127), ForgotPassword.jsx (48–49, 71–72), ResetPassword.jsx (79–80, 101–102).  
**Onde NÃO aparece:** GameShoot.jsx (não importa VersionBanner).

**Impacto:** Rotas /, /register, /forgot-password, /reset-password, /dashboard, /profile, /pagamentos exibem o banner verde no local. Produção validada descrita com login **sem** banner verde — divergência visual documentada.

### VersionWarning (aviso amarelo)

| Atributo | Valor |
|----------|--------|
| **Arquivo** | goldeouro-player/src/components/VersionWarning.jsx |
| **Montagem** | App.jsx linha 32 — em **todas** as rotas |
| **Estilo** | fixed top-4 right-4, bg-yellow-500/90 (linhas 62–63) |
| **Condição** | Só renderiza se showWarning === true (linha 57); showWarning vem de versionService.shouldShowWarning() e checkCompatibility() (linhas 19, 34–38) |
| **Observação** | versionService.js **não** define shouldShowWarning(), getWarningMessage(), getVersionInfo() — **NÃO CONFIRMADO** se existem em outro módulo ou se o aviso aparece em runtime |

**Rotas afetadas:** Todas (incluindo /game), quando showWarning for true.  
**Risco de falsa leitura:** Se o aviso aparecer em produção, pode ser interpretado como “versão desatualizada”; a produção validada não descreve esse aviso.

### PwaSwUpdater

| Atributo | Valor |
|----------|--------|
| **Arquivo** | goldeouro-player/src/pwa-sw-updater.tsx |
| **Texto** | "Uma nova versão está disponível." (linha 29) |
| **Condição** | Só renderiza se isUpdateAvailable === true (linha 25), quando o Service Worker emite "waiting" (linhas 12–15) |
| **Impacto** | Camada de atualização PWA; não é banner de “versão deploy” e sim de update disponível via SW |

---

## 6. Comparação local vs produção por área

### Login (/)

| Aspecto | Local (código) | Produção validada | Divergência? | Tipo |
|---------|----------------|-------------------|--------------|------|
| Componente | Login.jsx | — | Não | — |
| Logo | Logo (Gol_de_Ouro_logo.png) | Esperado | Não | — |
| Background | url(/images/Gol_de_Ouro_Bg01.jpg) + gradient | — | Não | — |
| Formulário | email, senha, lembrar | — | Não | — |
| Banner verde | VersionBanner renderizado (Login.jsx 42–43) | Login sem banner verde | **Sim** | Visual / camada dev |
| VersionWarning | No App (todas as rotas) | Não documentado | NÃO CONFIRMADO | Condicional |

### Dashboard (/dashboard)

| Aspecto | Local | Produção validada | Divergência? | Tipo |
|---------|--------|-------------------|--------------|------|
| Componente | Dashboard.jsx | — | Não | — |
| VersionBanner | Sim (linhas 107–108) | Não documentado | Possível | Visual |
| Background | Gol_de_Ouro_Bg02.jpg | — | Não | — |
| Navegação | Navigation, SidebarProvider | — | Não | — |

### Game (/game, /gameshoot)

| Aspecto | Local (GameShoot.jsx) | Produção validada (descrição) | Divergência? | Tipo |
|---------|------------------------|-------------------------------|--------------|------|
| Componente montado | GameShoot | — (baseline não documenta nome) | — | — |
| Header | "⚽ Gol de Ouro", Saldo, Recarregar (linhas 303–320) | Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO, MENU PRINCIPAL | **Sim** | Visual / estrutural |
| Botões aposta | R$ 1, 2, 5, 10 (linhas 324–343) | R$1–R$10 | Não | — |
| Cenário | div 400×300, gramado verde, gol simples, 5 zonas, emoji ⚽ 🥅 (348–411) | Estádio, gol com rede, goleiro, bola, alvos, gramado | **Sim** | Visual (Game.jsx/GameField tem estádio/rede; não está em rota) |
| Botões inferiores | Áudio ON/OFF, Dashboard (377–391) | Recarregar, Som; MENU PRINCIPAL | **Sim** | Visual |
| VersionBanner em /game | GameShoot não usa | — | Não (banner não na tela de jogo) | — |

### Pagamentos (/pagamentos)

| Aspecto | Local | Produção | Divergência? | Tipo |
|---------|--------|----------|--------------|------|
| Componente | Pagamentos.jsx | — | Não | — |
| VersionBanner | Sim | Não documentado | Possível | Visual |
| API | apiClient, API_ENDPOINTS (PIX_CREATE, PIX_STATUS, PIX_USER) | — | Não | — |

### Profile (/profile)

| Aspecto | Local | Produção | Divergência? | Tipo |
|---------|--------|----------|--------------|------|
| Componente | Profile.jsx | — | Não | — |
| VersionBanner | Sim | Não documentado | Possível | Visual |
| API | apiClient, API_ENDPOINTS.PROFILE | — | Não | — |

### Withdraw (/withdraw)

| Aspecto | Local (código lido) | Produção (documentado) | Divergência? | Tipo |
|---------|----------------------|--------------------------|--------------|------|
| Componente | Withdraw.jsx | — | Não | — |
| Serviço | paymentService (createPix, getUserPix) — Withdraw.jsx linhas 6, 62, 109 | Relatórios: produção ez1oc96t1 sem withdrawService; saque usa createPix | Alinhado se local = mesmo commit que prod; divergente se local tiver branch com withdrawService | Funcional |
| VersionBanner | Withdraw não importa VersionBanner (grep) | — | Não | — |

### Register, Forgot Password, Reset Password

- Todas usam VersionBanner; estrutura e fluxo alinhados ao esperado. Divergência possível apenas pelo banner verde em relação à produção validada (login sem banner).

### Auth

| Aspecto | Local | Produção | Divergência? |
|---------|--------|----------|--------------|
| AuthContext | user, loading, token em localStorage, PROFILE para validar | — | Não |
| ProtectedRoute | !user → Navigate to="/" | — | Não |
| Login redirect | navigate('/dashboard') (Login.jsx 35) | — | Não |
| Comportamento “local abre em login, produção em game” | Explicado por estado de sessão: sem token no local → /; com token em prod → /game acessível | Não é bug; é estado do usuário | Não |

### Assets

| Uso | Arquivos | Onde |
|-----|----------|------|
| Login | /images/Gol_de_Ouro_Bg01.jpg, Logo → /images/Gol_de_Ouro_logo.png | Login.jsx 48, Logo.jsx 26 |
| Dashboard, Withdraw, Terms, Privacy, Profile | Gol_de_Ouro_Bg02.jpg | Respectivos jsx |
| Register | Gol_de_Ouro_Bg01.jpg | Register.jsx 62 |
| GameShoot | Nenhum /images/ para campo — inline divs, emoji ⚽ 🥅 | GameShoot.jsx 348–411 |
| Game (não roteado) | GameField → /images/game/stadium-background.jpg, goalkeeper-3d.png, ball.png, goal-net-3d.png | GameField.jsx 97–100 |

**Divergência de assets:** A tela **ativa** em /game (GameShoot) não usa imagens de estádio/goleiro/bola do /images/game; a tela que usa (Game + GameField) não está em rota. Qualquer diferença visual “estádio vs quadro simples” vem do **componente** (GameShoot vs Game), não de asset diferente na mesma tela.

### API / integração

| Config | Valor | Evidência |
|--------|--------|-----------|
| Base URL | import.meta.env.VITE_BACKEND_URL \|\| 'https://goldeouro-backend-v2.fly.dev' | config/api.js linha 9 |
| Endpoints | LOGIN, REGISTER, PROFILE, PIX_*, GAMES_SHOOT, WITHDRAW, etc. | api.js 11–41 |
| Serviços usados | apiClient (todas as páginas protegidas), gameService (GameShoot), paymentService (Withdraw, Pagamentos), versionService (VersionWarning) | Imports nas páginas |

**Alinhamento:** Local e produção (build do main) usam o mesmo config; base URL pode variar por VITE_BACKEND_URL em build. **Dependente de env.**

### Navegação global

- Navigation (sidebar) usada em Dashboard, GameShoot, Profile, Withdraw, Pagamentos (useSidebar). Login/Register não usam Navigation. Alinhado ao fluxo esperado.

---

## 7. Comparação por blocos

| Bloco | Alinhado com produção? | Divergência visual? | Divergência funcional? | Divergência esperada (trabalho não deployado)? | Local como referência? |
|-------|------------------------|----------------------|--------------------------|-----------------------------------------------|------------------------|
| **A — Financeiro** | Sim (mesmo código que ez1oc96t1) | Possível (banner em algumas telas) | Withdraw: se local tiver withdrawService em branch, sim; no código lido usa paymentService | Sim (correção saque em branch) | Sim com ressalva |
| **B — Sistema de apostas** | Sim | Não (GameShoot = tela ativa) | Não | Não | Sim |
| **C — Autenticação / acesso** | Sim | Não | Não | Não | Sim |
| **D — Saldo / perfil / pagamentos** | Sim | Banner em várias telas | Não | Não | Sim |
| **E — Gameplay** | Sim (GameShoot em /game) | Sim — layout diferente da descrição validada (header, cenário, Menu vs Dashboard) | Não (POST /api/games/shoot) | Não | Sim para fluxo; não para “layout validado” |
| **F — Interface** | Sim (rotas e componentes) | Sim — VersionBanner no login e outras; layout /game = GameShoot | Não | Parcial (banner) | Sim com exceção do banner e do layout do jogo |
| **G — Fluxo do jogador** | Sim | Banner e layout do jogo | Não | Não | Sim |

---

## 8. Divergências legítimas vs perigosas

### Legítimas (esperadas ou aceitáveis)

- **Banner verde em telas no local:** Inclusão de VersionBanner no código atual; produção validada (FyKKeg6zb) descrita sem esse banner. Legítimo como “diferença de versão de código” desde que documentado.  
- **Produção atual (ez1oc96t1) ≠ baseline (FyKKeg6zb):** Documentado; produção em uso é outro deploy; baseline é referência para rollback/validação.  
- **Local à frente da baseline (commits posteriores):** Correções, CI, possíveis branches com withdrawService; legítimo até deploy aprovado.  
- **Estado de sessão (local sem token → login, prod com token → game):** Comportamento esperado de auth; não é divergência de código.

### Perigosas ou indevidas

- **Tratar /game como se mostrasse Game.jsx:** No código, /game monta GameShoot; Game não está em rota. Usar Game como referência de “o que está em produção” é **indevido** sem evidência do bundle/App da baseline.  
- **Presumir que produção atual = baseline:** Produção em uso é ez1oc96t1; baseline é FyKKeg6zb. Confundir os dois pode invalidar rollback ou critérios de aceite.  
- **Deploy sem registrar fingerprint ou sem comparar com baseline:** Risco de regressão não detectada.  
- **Remover ou alterar rotas/componentes sem definir qual é a tela oficial do jogo:** Pode quebrar fluxo ou alinhamento com validação.

---

## 9. Itens que confundem a leitura do projeto

| Item | Motivo |
|------|--------|
| **Game.jsx** | Importado no App, layout próximo da “tela validada”, mas **não está em nenhuma rota**; dá impressão de que /game poderia ser Game. |
| **GameShootFallback, GameShootTest, GameShootSimple** | Importados no App e não usados em Route; aumentam ruído sobre “qual tela de jogo”. |
| **Dois nomes de produção** | “Produção validada” (FyKKeg6zb) vs “produção atual” (ez1oc96t1); sem cuidado gera ambiguidade. |
| **VersionWarning** | Depende de métodos não definidos no versionService.js lido; comportamento em runtime **NÃO CONFIRMADO**. |
| **Baseline “/game atual corresponde ao layout validado”** | baseline-frontend-game.json não diz qual componente; “atual” pode ser interpretado como GameShoot ou Game. |
| **App-backup.jsx e App-simple.jsx** | Outros arquivos de rotas no src; não são usados por main.jsx (que importa App.jsx); podem confundir se alguém abrir por engano. |

---

## 10. Matriz final de alinhamento

| Área | Local = Produção? | Tipo de diferença | Evidência | Risco | Observação |
|------|-------------------|--------------------|-----------|--------|------------|
| Login | Não (banner) | Visual | VersionBanner em Login.jsx 42–43; produção validada sem banner | Baixo | Exceção documentada |
| Register | Parcial (banner) | Visual | VersionBanner | Baixo | Idem |
| Forgot/Reset Password | Parcial (banner) | Visual | VersionBanner | Baixo | Idem |
| Dashboard | Parcial (banner) | Visual | VersionBanner | Baixo | Idem |
| Profile | Parcial (banner) | Visual | VersionBanner | Baixo | Idem |
| Pagamentos | Parcial (banner) | Visual | VersionBanner | Baixo | Idem |
| Withdraw | Sim (se mesmo commit) / Funcional (se branch com fix) | Funcional em branch | Withdraw usa paymentService; docs dizem prod sem withdrawService | Médio se branch | Depende do estado do repo |
| Game | Estrutural (componente) / Visual (layout) | Componente + visual | /game → GameShoot; layout diferente da descrição validada; Game não roteado | Médio | Tela ativa = GameShoot |
| Rotas | Sim | — | App.jsx; mesmo conjunto de paths e componentes que build ez1oc96t1 | Nenhum | — |
| Auth | Sim | — | AuthContext, ProtectedRoute, redirect to / | Nenhum | — |
| Versionamento | Parcial | Camada dev | VersionBanner em várias telas; VersionWarning global (comportamento NÃO CONFIRMADO) | Baixo | Documentado |
| Banners | Não (verde no login) | Visual | VersionBanner.jsx; Login e outras páginas | Baixo | Exceção oficial |
| Assets | Sim (mesmos paths) | — | /images/ usados conforme código; GameShoot não usa /images/game | Nenhum | — |
| Integração API | Sim / Dependente de env | Env | api.js VITE_BACKEND_URL ou fallback fly.dev | Baixo | — |
| Service Worker / PWA | Sim | — | PwaSwUpdater; mensagem apenas quando update disponível | Nenhum | — |
| Navegação global | Sim | — | Navigation, SidebarProvider nas páginas protegidas | Nenhum | — |

---

## 11. Nível de confiança operacional

**Escolha:** **MÉDIO**

**Justificativa:**

- **Pontos que sustentam confiança:** Rotas, componentes montados, auth, integração com backend (gameService, apiClient, endpoints), fluxo do jogador e blocos B, C, D, G estão alinhados ao código que gerou a produção atual (ez1oc96t1). O local é espelho **adequado** da produção **atual** (ez1oc96t1) quando o repositório está no mesmo commit/estado.
- **Pontos que reduzem confiança:** (1) Produção **validada** é FyKKeg6zb (bundle diferente); local/build atual ≠ baseline. (2) Banner verde no login (e outras telas) não está na descrição da produção validada. (3) Layout da tela de jogo (GameShoot) difere da descrição validada (que se aproxima mais de Game.jsx, não roteado). (4) Possível trabalho em branch (ex.: withdraw) ainda não deployado. (5) VersionWarning depende de métodos não encontrados no versionService.js — NÃO CONFIRMADO.
- **Conclusão:** O local pode ser usado como referência para **produção atual (ez1oc96t1)** e para continuar desenvolvimento, **desde que** as exceções (banner, layout do jogo, baseline vs atual) estejam documentadas e que não se use Game.jsx como referência de “o que está em produção” sem evidência.

---

## 12. Classificação final obrigatória

**LOCAL PARCIALMENTE ALINHADO COM EXCEÇÕES DOCUMENTADAS**

- **Alinhado:** Rotas, auth, navegação, integração API, serviços, assets (paths), fluxo geral e blocos na sua maior parte. O local reflete o código do build ez1oc96t1 (produção atual).
- **Exceções documentadas:** (1) VersionBanner (banner verde) no login e em outras páginas — não na descrição da produção validada. (2) Tela de jogo em /game = GameShoot; layout distinto da descrição validada (que aproxima de Game.jsx). (3) Produção validada = FyKKeg6zb (fingerprint qIGutT6K/lDOJDUAS); produção em uso = ez1oc96t1 (outro bundle). (4) Possível divergência funcional em /withdraw se houver branch com withdrawService não deployado.
- **Não classificado como “LOCAL ALINHADO”** porque existem exceções visuais e de referência (baseline vs atual).  
- **Não classificado como “LOCAL DIVERGENTE” ou “NÃO CONFIÁVEL”** porque a estrutura, rotas e comportamento funcional estão alinhados ao build em produção atual e o local é utilizável como base de desenvolvimento com as ressalvas acima.

---

## 13. Próximo passo seguro

**Sem alterar código, build ou produção:**

1. **Formalizar exceções:** Registrar em documento de referência: (a) login (e outras telas) exibem VersionBanner no código atual; (b) /game monta GameShoot; Game.jsx é blueprint visual não roteado; (c) produção validada = FyKKeg6zb; produção em uso = ez1oc96t1.  
2. **Decisão de produto:** Definir se a tela oficial do jogo deve ser GameShoot (atual) ou Game (ou fusão); se for Game, planejar alteração de rota em branch e validação em preview.  
3. **Banner:** Se a decisão for “produção sem banner verde no login”, planejar em branch a remoção ou condicional de VersionBanner no Login (e onde fizer sentido), com validação antes de deploy.  
4. **Withdraw:** Confirmar se o repositório atual usa paymentService ou withdrawService para /withdraw; se houver branch com withdrawService, documentar como “bloco ainda não deployado” até o deploy.  
5. **Antes de qualquer novo deploy:** Comparar fingerprint do build candidato com a baseline (qIGutT6K/lDOJDUAS) ou com o fingerprint desejado; registrar decisão de “manter baseline” ou “evoluir a partir de ez1oc96t1” com critérios claros.

---

## Saída final obrigatória

### O que no local está 100% alinhado com produção (build ez1oc96t1 / mesmo estado de código)

- Conjunto de rotas e componentes montados (/, /register, /forgot-password, /reset-password, /terms, /privacy, /download, /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos).  
- Uso de GameShoot em /game e /gameshoot.  
- AuthContext, ProtectedRoute, redirect para / quando não autenticado.  
- Config de API (base URL e endpoints) e uso de apiClient, gameService, paymentService conforme código.  
- Assets (paths /images/...) utilizados nas páginas que os referenciam.  
- Navegação (Navigation, SidebarProvider) nas páginas protegidas.  
- PwaSwUpdater e lógica de Service Worker (mensagem só quando há update).

### O que no local diverge de produção (baseline FyKKeg6zb ou descrição validada)

- **Banner verde (VersionBanner)** no login e em Dashboard, Register, Profile, Pagamentos, ForgotPassword, ResetPassword — produção validada descrita com login sem banner.  
- **Layout da tela de jogo:** GameShoot (header com Recarregar/Dashboard, cenário 400×300, Áudio e Dashboard) vs descrição validada (Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO, MENU PRINCIPAL, estádio, gol com rede, Recarregar, Som).  
- **Bundle/fingerprint:** Local (build atual) gera hashes distintos da baseline (index-qIGutT6K/lDOJDUAS).

### O que diverge apenas por camada dev/env

- Valores de VersionBanner (VITE_BUILD_VERSION/DATE/TIME) podem vir de .env.local em dev; em build de produção podem ser injetados ou ausentes.  
- VersionWarning depende de versionService; comportamento em produção **NÃO CONFIRMADO** (métodos não encontrados no versionService.js lido).  
- Base URL da API: VITE_BACKEND_URL pode diferir entre local e build de produção.

### O que diverge por blocos ainda não deployados

- **Withdraw:** Se existir branch/commit com withdrawService (POST /api/withdraw/request, GET /api/withdraw/history), essa versão do Withdraw não está em produção (ez1oc96t1 documentado como createPix/getUserPix).  
- Qualquer alteração em branch (banner, rota /game, etc.) ainda não mergeada/deployada.

### O que não pode mais ser usado como referência

- **Game.jsx** como “a tela de jogo em produção” — não está em nenhuma rota; a tela em produção (e no local) é GameShoot.  
- **“Produção” sem distinguir** FyKKeg6zb (baseline validada) vs ez1oc96t1 (produção atual).  
- **App-backup.jsx e App-simple.jsx** como definição de rotas — o App em uso é App.jsx (importado por main.jsx).  
- **versionService** como garantia de que VersionWarning “não aparece” — métodos usados por VersionWarning não estão definidos no versionService.js lido (NÃO CONFIRMADO).

### Se o local pode ou não ser tratado como base confiável para seguir o projeto

- **Sim**, como base confiável para o **estado de código que gerou a produção atual (ez1oc96t1)** e para evoluir o projeto, **desde que**:  
  - as exceções (banner verde, layout do jogo vs descrição validada, baseline vs produção atual) sejam tratadas como **exceções documentadas**;  
  - não se use Game.jsx como referência do que está em produção;  
  - e que, antes de deploy, se compare o build com a baseline ou com o fingerprint desejado e se registre a decisão.  
- **Não** como espelho **exato** da **produção validada (FyKKeg6zb)**, porque o bundle e o fingerprint atuais são diferentes e a descrição validada (login sem banner, jogo com header completo e estádio) não coincide em tudo com o código atual (VersionBanner no login, GameShoot com layout distinto).

---

*Auditoria realizada em modo read-only; nenhum arquivo, configuração ou deploy foi alterado. Todas as conclusões referem-se a arquivo, rota, import, componente ou evidência documental.*
