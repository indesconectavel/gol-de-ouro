# AUDITORIA FORENSE — LOCAL vs PRODUÇÃO (READ-ONLY TOTAL)

**Data:** 2026-03-08  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, build, deploy ou produção).  
**Objetivo:** Identificar com evidência exata as diferenças entre ambiente local e produção validada (FyKKeg6zb), origem do banner verde e causa provável da divergência.

---

## 1. Fonte de verdade

### Produção validada

| Item | Valor | Evidência |
|------|--------|-----------|
| **Deploy Vercel** | FyKKeg6zb | Documentação baseline (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-rollback.json, etc.) |
| **Status** | Production + Current (no momento da validação) | Relatórios de rollback e fingerprint; atualmente produção em uso é ez1oc96t1, não FyKKeg6zb |
| **Bundle JS confirmado** | index-qIGutT6K.js | baseline-frontend-bundles.json, baseline-frontend-fingerprint.json |
| **Bundle CSS confirmado** | index-lDOJDUAS.css | idem |

### Tela oficial validada em produção (descrição de referência)

- Login **sem** banner verde  
- Jogo com header: Logo Gol de Ouro, SALDO, CHUTES, GANHOS, GOLS DE OURO; botões de aposta R$1, R$2, R$5, R$10; MENU PRINCIPAL  
- Área visual: estádio, gol com rede, goleiro, bola, alvos no gol, gramado  
- Botões: Recarregar, Som  

*(Fonte: enunciado do prompt; cruzado com baseline-frontend-game.json — elementos esperados: saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal.)*

---

## 2. Rotas reais do local

Evidência: leitura direta de `goldeouro-player/src/App.jsx`.

| Rota | Componente montado | Arquivo | Linha / trecho |
|------|--------------------|---------|-----------------|
| **/** | Login | `element={<Login />}` | Linha 34 |
| **/login** | (não existe) | — | Nenhuma `<Route path="/login">` no App.jsx; login está em **/** |
| **/game** | GameShoot (dentro de ProtectedRoute) | `element={<ProtectedRoute><GameShoot /></ProtectedRoute>}` | Linhas 47–51 |
| **/gameshoot** | GameShoot (dentro de ProtectedRoute) | idem | Linhas 52–56 |
| **/dashboard** | Dashboard (ProtectedRoute) | Linhas 43–46 |
| **/register** | Register | Linha 35 |
| **/profile** | Profile (ProtectedRoute) | Linhas 58–61 |
| **/withdraw** | Withdraw (ProtectedRoute) | Linhas 63–66 |
| **/pagamentos** | Pagamentos (ProtectedRoute) | Linhas 68–71 |

**Wrappers globais (App.jsx):**  
- `ErrorBoundary` (linha 27)  
- `AuthProvider` (linha 28)  
- `SidebarProvider` (linha 29)  
- `Router` (linha 30)  
- Dentro do Router: **VersionWarning** (linha 32), **PwaSwUpdater** (linha 33); depois `<Routes>`.  

**Conclusão:** A rota de login é **/** e usa o componente **Login**. A rota **/game** monta **GameShoot** (não Game).

---

## 3. Componentes reais em uso

### Componente do login

- **Rota:** `/`  
- **Componente:** `Login`  
- **Arquivo:** `goldeouro-player/src/pages/Login.jsx`  
- **Evidência:** App.jsx linha 34: `<Route path="/" element={<Login />} />`.  
- **Import no Login:** Logo, VersionBanner, musicManager (linhas 4–6).  
- **Uso de banner:** Login.jsx linhas 42–43: `{/* Banner de Versão */}` e `<VersionBanner showTime={true} />`.  
- **Conclusão:** No local, a página de login **renderiza VersionBanner** (banner verde com "VERSÃO ATUALIZADA" e "DEPLOY REALIZADO EM").

### Componente do jogo

- **Rota:** `/game` (e `/gameshoot`)  
- **Componente:** `GameShoot`  
- **Arquivo:** `goldeouro-player/src/pages/GameShoot.jsx`  
- **Evidência:** App.jsx linhas 47–51 e 52–56.  
- **GameShoot não importa** VersionBanner nem VersionWarning; portanto o banner verde **não** é injetado pelo próprio GameShoot.  
- **Porém:** VersionWarning está no **App.jsx** (linha 32), então aparece em **todas** as rotas, incluindo /game, quando `versionService.shouldShowWarning()` retorna true (ver seção 4).

### Wrappers / guards

- **ProtectedRoute** — Arquivo: `goldeouro-player/src/components/ProtectedRoute.jsx`.  
  - Usa `useAuth()`; se `loading` → tela "Verificando autenticação..."; se `!user` → `<Navigate to="/" replace />`; caso contrário → renderiza `children`.  
  - Evidência: linhas 4–26.  
- **AuthProvider** — Arquivo: `goldeouro-player/src/contexts/AuthContext.jsx`.  
  - Estado: `user`, `loading`, `error`; verificação de token em `localStorage.getItem('authToken')` e chamada a `API_ENDPOINTS.PROFILE`; se não houver token, `loading` passa a false sem user.  
  - Login redireciona para `/dashboard` após sucesso (Login.jsx linha 35: `navigate('/dashboard')`).  
- **Não há redirecionamento automático** de `/` para `/game`; usuário não autenticado em `/game` é enviado para `/` pelo ProtectedRoute.

---

## 4. Origem do banner verde

### Arquivo responsável

- **Banner verde (texto "VERSÃO ATUALIZADA", "DEPLOY REALIZADO EM"):**  
  **Arquivo:** `goldeouro-player/src/components/VersionBanner.jsx`  
  **Evidência:** Linha 25: `className={... bg-green-600 ...}`; linhas 29–30: `<span>VERSÃO ATUALIZADA {resolvedVersion}</span>`, `<span>DEPLOY REALIZADO EM {resolvedDate}</span>`; linha 31: `DEPLOY REALIZADO EM`; opcionalmente `HORÁRIO` e `ACESSO` (currentTime).  

### Condição de renderização

- VersionBanner **não** tem condicional por ambiente no código lido: é sempre renderizado onde for importado.  
- Valores: `version`, `deployDate`, `deployTime` por props; ou `import.meta.env.VITE_BUILD_VERSION`, `VITE_BUILD_DATE`, `VITE_BUILD_TIME` quando existirem (linhas 11–16).  
- **Onde é usado:**  
  - Login.jsx (linhas 42–43)  
  - Dashboard.jsx (linhas 107–108)  
  - ForgotPassword.jsx, ResetPassword.jsx, Register.jsx, Profile.jsx, Pagamentos.jsx (grep anterior)  
- **Onde NÃO é usado:** GameShoot.jsx (grep sem ocorrências de VersionBanner/VersionWarning/banner).

### Impacto

- **Rotas afetadas pelo banner verde (VersionBanner):** `/`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/profile`, `/pagamentos`.  
- **Rota NÃO afetada pelo banner verde:** `/game` (e `/gameshoot`) — GameShoot não importa VersionBanner.  
- No local, ao abrir **/** (login), o usuário **sempre** vê o banner verde. Na **produção validada** (FyKKeg6zb), a descrição é "login sem banner verde"; portanto ou esse build não incluía VersionBanner no Login, ou não o exibia (condição/env não confirmada no código atual).

### Banner amarelo (VersionWarning)

- **Arquivo:** `goldeouro-player/src/components/VersionWarning.jsx`  
- **Montagem:** App.jsx linha 32 — **em todas as rotas**.  
- **Aparência:** `bg-yellow-500/90` (amarelo), texto "Aviso de Versão", "Versão atual", "Versão mínima" (linhas 63–82).  
- **Condição:** Só renderiza se `showWarning === true` (linha 57); `showWarning` é definido por `versionService.shouldShowWarning()` (linha 19) e por `versionService.checkCompatibility()` (linhas 34–38).  
- **Observação:** Em `goldeouro-player/src/services/versionService.js` **não** existem os métodos `shouldShowWarning()`, `getWarningMessage()` nem `getVersionInfo()` usados em VersionWarning.jsx (linhas 19–22, 79–81). Apenas `checkCompatibility()` e outros estão definidos. **NÃO CONFIRMADO** se esses métodos existem em outro arquivo ou build; se não existirem, a chamada pode falhar ou o aviso não aparecer.

---

## 5. Diferenças local vs produção

Comparação com a produção validada (FyKKeg6zb e descrição da tela oficial).

| Categoria | Item | Local (código lido) | Produção validada | Tipo | Observação |
|-----------|------|----------------------|-------------------|------|------------|
| **Login** | Banner verde | VersionBanner em Login.jsx (linhas 42–43); sempre renderizado | Login sem banner verde | Visual / condicional por build | Diferença confirmada no código |
| **Login** | Layout, logo, campos | Logo, formulário email/senha, background | Idem esperado | — | Alinhado |
| **Rota /game** | Componente | GameShoot (App.jsx 47–51) | Inferido GameShoot no build ez1oc96t1; baseline FyKKeg6zb não documenta componente | Estrutural | Local usa GameShoot; Game.jsx não está em nenhuma rota |
| **Jogo** | Header | GameShoot: "⚽ Gol de Ouro", "Escolha uma zona...", Saldo, botão "Recarregar" (linhas 303–320) | Header com Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO, R$1–R$10, MENU PRINCIPAL | Visual | Local não tem barra única com CHUTES/GANHOS/MENU PRINCIPAL no header |
| **Jogo** | Botões de aposta | GameShoot: grid R$ 1, 2, 5, 10 (linhas 324–343) | R$1, R$2, R$5, R$10 | — | Alinhado |
| **Jogo** | Cenário | GameShoot: div 400×300, gramado, gol simples, 5 zonas TL/TR/C/BL/BR, bola, goleiro emoji (linhas 348–411) | Estádio, gol com rede, goleiro, bola, alvos, gramado | Visual | Local tem cenário mais simples; Game.jsx (GameField) tem estádio/gol com rede/alvos 6 — mas Game não está em rota |
| **Jogo** | Botões inferiores | GameShoot: "🔊 Áudio ON/OFF", "📊 Dashboard" (linhas 377–391) | Recarregar, Som; MENU PRINCIPAL | Visual / funcional | Local tem "Dashboard" em vez de "MENU PRINCIPAL"; Recarregar está no header |
| **Global** | VersionWarning | App.jsx linha 32; em todas as rotas; amarelo quando showWarning | Produção validada sem referência a esse aviso | Condicional por ambiente / serviço | Pode depender de versionService (métodos não encontrados no versionService.js) |
| **Autenticação** | Fluxo inicial | / → Login; sem token → permanece em /; com token em /game → ProtectedRoute permite GameShoot | — | — | Comportamento esperado; sem evidência de diferença |

**Resumo:**  
- **Visual:** Banner verde no login no local; layout do jogo (header único, estádio/gol/alvos, MENU PRINCIPAL) no local difere da descrição da produção validada.  
- **Estrutural:** /game no local = GameShoot; a tela que mais se aproxima da descrição (header com CHUTES/GANHOS, estádio, Menu) é **Game.jsx**, que **não está roteada**.  
- **Condicional por ambiente:** VersionBanner não tem condicional no código; .env.local contém VITE_BUILD_* (VersionBanner usa import.meta.env). Em produção (build) essas variáveis podem não estar definidas ou ter outros valores; **não confirmado** se no build FyKKeg6zb o VersionBanner estava presente no Login.

---

## 6. Causa provável da divergência

### Hipótese 1: Banner verde no login (local vs produção validada)

- **Causa:** No código local, **Login.jsx** importa e renderiza **VersionBanner** sem condição. Na produção validada (FyKKeg6zb), o login foi descrito sem banner verde.  
- **Explicação possível:** (a) O build da baseline não incluía VersionBanner no Login (código anterior); ou (b) VersionBanner foi adicionado depois da validação; ou (c) existe condição em outro arquivo/build que oculta o banner em produção (não encontrada no código lido).  
- **Confiança:** **Alta** — evidência direta: Login.jsx linhas 42–43 e VersionBanner.jsx com bg-green-600 e texto "VERSÃO ATUALIZADA".

### Hipótese 2: Experiência do jogo diferente (layout / componente)

- **Causa:** No local, **/game** monta **GameShoot** (campo 400×300, header com Recarregar/Dashboard, estatísticas em grid, botões Áudio e Dashboard). A descrição da produção validada (Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO, R$1–R$10, MENU PRINCIPAL, estádio, gol com rede, goleiro, bola, alvos, Recarregar, Som) aproxima-se mais de **Game.jsx** (GameField, BettingControls, botão Menu, etc.), que **não está em nenhuma rota**.  
- **Explicação:** Ou (a) na baseline FyKKeg6zb a rota /game usava **Game** (e depois foi trocada para GameShoot no código atual), ou (b) a descrição validada mistura elementos de ambas as telas. A reconstrução local da baseline (CONFIRMACAO-DEFINITIVA-BASELINE-GAME-2026-03-08) concluiu que no commit proxy **0a2a5a1** o App já montava **GameShoot** em /game.  
- **Confiança:** **Alta** para “local usa GameShoot e não Game”; **média** para “produção validada era Game” (não há evidência direta no bundle/App da baseline).

### Hipótese 3: VersionWarning (aviso amarelo) em todas as rotas

- **Causa:** **VersionWarning** está no App.jsx (linha 32) e portanto é montado em **todas** as rotas. Ele depende de `versionService.shouldShowWarning()`, `getWarningMessage()`, `getVersionInfo()` — métodos **não** definidos no `versionService.js` lido.  
- **Efeito:** Se esses métodos não existirem, o comportamento em runtime é **NÃO CONFIRMADO** (erro ou aviso nunca exibido). Se em algum build eles existirem e retornarem true, o aviso amarelo apareceria em todas as páginas, incluindo /game.  
- **Confiança:** **Média** — evidência de montagem no App; lógica de exibição não confirmada no versionService lido.

### Causa mais provável da divergência (síntese)

- **Banner verde no login:** Uso explícito de **VersionBanner** em **Login.jsx** no código local; produção validada descrita sem esse banner — **causa: inclusão do VersionBanner nas páginas (incluindo Login) no código atual.**  
- **Experiência do jogo diferente:** **/game** no local usa **GameShoot**; a tela que mais se aproxima da descrição (header completo, estádio, Menu) é **Game.jsx**, que está **apenas importado e não roteado** — **causa: rota /game monta GameShoot e não Game; possível que a validação tenha sido feita com outra versão/componente.**

---

## 7. Itens legados ou não roteados

| Item | Tipo | Evidência |
|------|------|-----------|
| **Game.jsx** | Importado, não roteado | App.jsx linha 13: `import Game from './pages/Game'`; nenhum `<Route path="...">` usa `<Game />`. |
| **GameShootFallback.jsx** | Importado, não roteado | App.jsx linha 15; não referenciado em nenhuma Route. |
| **GameShootTest.jsx** | Importado, não roteado | App.jsx linha 16; não referenciado em nenhuma Route. |
| **GameShootSimple.jsx** | Importado, não roteado | App.jsx linha 17; não referenciado em nenhuma Route. |
| **GameField.jsx** | Usado apenas por Game.jsx | Game.jsx importa GameField; como Game não está em rota, GameField não aparece em nenhuma rota ativa. |
| **BettingControls, SoundControls, AudioTest, RecommendationsPanel** | Usados apenas por Game.jsx | Idem; não aparecem em GameShoot. |

**Classificação:**  
- **Game.jsx:** blueprint visual / tela alternativa; mais próximo da descrição da produção validada; **não usado** nas rotas atuais.  
- **GameShootFallback, GameShootTest, GameShootSimple:** legados ou experimentais; não roteados.  
- **O que é “fonte de verdade” no local para /game:** apenas **GameShoot.jsx** (e o que ele importa).  
- **O que NÃO deve ser usado como referência de rota ativa:** assumir que /game mostra Game.jsx; a rota atual monta GameShoot.

---

## 8. Conclusão final

### Respostas objetivas

| Pergunta | Resposta com evidência |
|----------|------------------------|
| Qual componente local monta **/game**? | **GameShoot** — App.jsx linhas 47–51: `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />`. |
| Qual componente local monta **/login**? | Não existe rota `/login`. O **login** está em **/** e o componente é **Login** — App.jsx linha 34: `<Route path="/" element={<Login />} />`. |
| Qual arquivo injeta o **banner verde**? | **VersionBanner.jsx** (bg-green-600, "VERSÃO ATUALIZADA", "DEPLOY REALIZADO EM"). É **usado** em Login.jsx (linhas 42–43), Dashboard, Register, Profile, Pagamentos, ForgotPassword, ResetPassword. **Não** é usado em GameShoot. |
| O banner verde é exclusivo de localhost/dev? | **Não** — no código lido não há condicional que desative VersionBanner em produção; ele usa `import.meta.env.VITE_BUILD_*` quando existir. Em .env.local há VITE_BUILD_VERSION/DATE/TIME. **NÃO CONFIRMADO** se no build de produção (FyKKeg6zb) o VersionBanner estava ausente ou desativado por outro meio. |
| O local está alinhado **visualmente** com a produção validada? | **Não** — no local: login **com** banner verde; /game = GameShoot (header e layout diferentes da descrição com CHUTES/GANHOS/MENU PRINCIPAL e estádio completo). |
| O local está alinhado **estruturalmente** com a produção validada? | **Parcialmente** — mesmas rotas principais (/, /game, /dashboard, etc.) e uso de GameShoot em /game; porém a **tela** que corresponde à descrição validada (Game com GameField) não está na rota /game. |
| Divergência principal é: autenticação / env / componente diferente / rota diferente / camada visual extra / legado ativo? | **Componente diferente** (/game mostra GameShoot, descrição validada aproxima-se de Game) + **camada visual extra** (VersionBanner no login e possivelmente VersionWarning global). |
| Causa mais provável | Inclusão de **VersionBanner** nas páginas (incluindo Login) no código atual; e **/game** definido com **GameShoot** em vez de Game, com Game mantido apenas como tela não roteada. |
| O que pode ser considerado “fonte de verdade local” | **App.jsx** (rotas e componentes montados); **GameShoot.jsx** para a tela de jogo em /game; **Login.jsx** para a tela em /. |
| O que NÃO deve ser usado como referência para “o que está em produção” | Assumir que /game renderiza **Game.jsx**; assumir que não há banner no login no código atual; usar GameShootFallback/GameShootTest/GameShootSimple como telas ativas. |

### Classificação final

**LOCAL PARCIALMENTE ALINHADO COM CAMADA EXTRA DE DEV**

- **Estrutura de rotas e componente de jogo:** Local usa GameShoot em /game e Login em /, alinhado ao que a documentação infere para o build em produção (ez1oc96t1) e ao commit proxy da baseline (0a2a5a1).  
- **Camada extra:** **VersionBanner** (banner verde) está presente no Login e em outras páginas no código local; a produção validada é descrita com login **sem** esse banner. **VersionWarning** (amarelo) está no App e pode aparecer em todas as rotas dependendo de versionService (não totalmente confirmado).  
- **Divergência visual do jogo:** A tela efetivamente montada em /game (GameShoot) não corresponde à descrição completa da produção validada (que se aproxima mais de Game.jsx); Game.jsx existe mas não está em nenhuma rota.

---

## 9. Recomendação estratégica

**Sem alterar código, build ou produção:**

- **Próximo passo seguro:** (1) **Documentar** que o banner verde vem de **VersionBanner.jsx** usado em **Login.jsx** (e outras páginas) e que **/game** no local monta **GameShoot**, não Game. (2) **Decidir** qual é a tela oficial do jogo (Game vs GameShoot) com base na baseline e no print validado; se for Game, planejar alteração de rota em branch e validação em preview. (3) **Não** presumir que produção validada (FyKKeg6zb) tinha o mesmo código atual do repositório; usar fingerprint (index-qIGutT6K.js) e reconstrução já documentada para comparar. (4) Para **remover** o banner verde do login em um futuro patch, seria necessário deixar de renderizar VersionBanner em Login.jsx (ou condicionar por env/build) em branch dedicada, sem tocar na produção até deploy aprovado.

---

*Auditoria realizada em modo read-only; nenhum arquivo, rota ou deploy foi alterado. Todas as conclusões apontam para arquivo, linha, import ou evidência concreta.*
