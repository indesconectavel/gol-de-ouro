# AUDITORIA READ-ONLY — LIMPEZA DE LEGADO DO PLAYER

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração em código, rotas, deploy, banco ou produção)  
**Escopo:** Frontend player (`goldeouro-player/src`)

---

## 1. Resumo executivo

A auditoria mapeou rotas, componentes de jogo, imports e arquivos do player para distinguir o que é **oficial** (V1), **auxiliar**, **legado** ou **órfão**. O jogo oficial é servido em **`/game`** pelo componente **`GameFinal`**. Existem **quatro componentes de jogo legado** (Game, GameShoot, GameShootFallback, GameShootTest, GameShootSimple), **quatro imports mortos** no `App.jsx`, **uma rota legado** (`/gameshoot`), **um utilitário órfão** (`lazyImports.js` com referência a página inexistente) e **vários arquivos BACKUP/simple** que podem confundir desenvolvedores. Nenhum link da UI aponta para `/gameshoot`; toda navegação vai para `/game`.

**Conclusão:** A arquitetura oficial está clara (/game → GameFinal). O legado é concentrado em imports não usados, rota /gameshoot, componentes de jogo antigos e arquivos de backup; a limpeza futura pode ser feita com base neste relatório.

---

## 2. Rotas oficiais

Definidas em `App.jsx` e efetivamente usadas pela aplicação.

| Rota | Componente | Uso |
|------|------------|-----|
| `/` | Login | Página inicial (login) |
| `/register` | Register | Cadastro |
| `/forgot-password` | ForgotPassword | Recuperação de senha |
| `/reset-password` | ResetPassword | Redefinição de senha |
| `/terms` | Terms | Termos de uso |
| `/privacy` | Privacy | Política de privacidade |
| `/download` | DownloadPage | Download do app |
| `/dashboard` | Dashboard | Início (protegida) |
| **`/game`** | **GameFinal** | **Jogo oficial (protegida)** |
| `/profile` | Profile | Perfil (protegida) |
| `/withdraw` | Withdraw | Saque (protegida) |
| `/pagamentos` | Pagamentos | Depósitos (protegida) |

Todas as rotas listadas possuem página real e componente correspondente. A rota oficial do jogo é **`/game`**, que renderiza **`GameFinal`**.

---

## 3. Rotas auxiliares

Não são “páginas principais” do fluxo do jogador, mas são rotas oficiais e necessárias.

| Rota | Componente | Observação |
|------|------------|------------|
| `/terms` | Terms | Auxiliar (legal) |
| `/privacy` | Privacy | Auxiliar (legal) |
| `/download` | DownloadPage | Auxiliar (download) |
| `/forgot-password` | ForgotPassword | Auxiliar (auth) |
| `/reset-password` | ResetPassword | Auxiliar (auth) |

Nenhuma delas é legado nem de teste.

---

## 4. Rotas legado

| Rota | Componente | Classificação | Observação |
|------|------------|---------------|------------|
| **`/gameshoot`** | GameShoot | **Legado** | Alternativa antiga do jogo; **nenhum link na UI** aponta para ela (Dashboard, InternalPageLayout, Navigation e TopBar usam apenas `/game`). Acessível apenas digitando a URL. |

Não há rotas declaradas que apontem para componentes inexistentes. Não foram encontradas rotas explicitamente de “teste” no `App.jsx` atual (GameShootTest não possui rota).

---

## 5. Componentes oficiais

| Componente | Arquivo | Rotas | Papel |
|------------|---------|--------|--------|
| **GameFinal** | `pages/GameFinal.jsx` | `/game` | **Componente oficial do jogo.** Versão estável com stage 1920x1080, `layoutConfig.js`, backend real, `game-scene.css` e `game-shoot.css`. Comentário no topo: "GAME FINAL - VERSÃO DEFINITIVA E ESTÁVEL" (BLOCO F, 2026-03-09). |

**Dependências relevantes de GameFinal:**  
`../game/layoutConfig`, `gameService`, `apiClient`, `API_ENDPOINTS`, `./game-scene.css`, `./game-shoot.css`, assets em `../assets/`.

---

## 6. Componentes legado

| Componente | Arquivo | Usado em rota? | Descrição |
|------------|---------|----------------|-----------|
| **Game** | `pages/Game.jsx` | Não | Jogo antigo com GameField, BettingControls, simulação de partida (ex.: totalShots), gamificação e RecommendationsPanel. **Importado no App.jsx mas não usado em nenhuma rota.** |
| **GameShoot** | `pages/GameShoot.jsx` | Sim (`/gameshoot`) | Versão alternativa do jogo com InternalPageLayout, backend real, layout próprio (GOAL_ZONES, posições em %). Usado apenas na rota legado `/gameshoot`. |
| **GameShootFallback** | `pages/GameShootFallback.jsx` | Não | Fallback/minimal do jogo (usa `game-shoot.css`, goalToStage, etc.). **Importado no App.jsx mas não usado em nenhuma rota.** |
| **GameShootTest** | `pages/GameShootTest.jsx` | Não | Tela de teste: título "Gol de Ouro - Teste" e mensagem de roteamento. **Importado no App.jsx mas não usado em nenhuma rota.** |
| **GameShootSimple** | `pages/GameShootSimple.jsx` | Não | Versão simplificada com simulação (Math.random), sem backend. **Importado no App.jsx mas não usado em nenhuma rota.** |

Resumo:

- **Componente oficial do jogo:** `GameFinal` (rota `/game`).
- **Legado com rota:** `GameShoot` (`/gameshoot`).
- **Legado sem rota (imports mortos):** `Game`, `GameShootFallback`, `GameShootTest`, `GameShootSimple`.

Componentes que **poderiam ser removidos no futuro** (após V1):  
Game, GameShootFallback, GameShootTest, GameShootSimple.  
A rota **`/gameshoot`** pode virar **redirect para `/game`** e o componente **GameShoot** pode ser removido quando não houver mais necessidade de manter a URL antiga.

---

## 7. Imports mortos e arquivos órfãos

### 7.1 Imports mortos no `App.jsx`

Os seguintes componentes são importados em `App.jsx` mas **não são usados em nenhuma `<Route>`**:

- `Game` (`./pages/Game`)
- `GameShootFallback` (`./pages/GameShootFallback`)
- `GameShootTest` (`./pages/GameShootTest`)
- `GameShootSimple` (`./pages/GameShootSimple`)

Remoção futura: apagar esses quatro imports (e, quando for o caso, as páginas/rotas associadas) para reduzir ruído e risco de uso acidental.

### 7.2 Páginas sem rota

- **Game.jsx** — sem rota; só importada no App (e referenciada em `__tests__/Game.test.jsx` e em `lazyImports.js`).
- **GameShootFallback.jsx** — sem rota.
- **GameShootTest.jsx** — sem rota.
- **GameShootSimple.jsx** — sem rota.

Nenhuma outra página em `pages/` está sem rota; Login, Register, Dashboard, Profile, Withdraw, Pagamentos, GameFinal, GameShoot (legado), Terms, Privacy, DownloadPage, ForgotPassword, ResetPassword possuem rota.

### 7.3 Componentes órfãos / uso restrito

- **Navigation** (`components/Navigation.jsx`): usado **apenas** por `Game.jsx` (legado). Dashboard, Profile, Withdraw e Pagamentos usam **InternalPageLayout** + **TopBar**.
- **GameField** (`components/GameField.jsx`): usado apenas por `Game.jsx` e por `components/__tests__/GameField.test.jsx`. Em produção “oficial” (GameFinal) não é usado.
- **RecommendationsPanel** (`components/RecommendationsPanel.jsx`): usado apenas por `Game.jsx`. Se Game for removido, RecommendationsPanel fica órfão para o fluxo principal.

### 7.4 Utilitário órfão e referência quebrada

- **`utils/lazyImports.js`**:  
  - Não é importado por `App.jsx` nem por nenhum arquivo atual do fluxo principal (apenas por si mesmo).  
  - Expõe `loadRouteModule('/game')` → `import('../pages/Game')` (página legado **Game**, não **GameFinal**).  
  - Referencia `../pages/Admin` (LazyAdmin e em `loadRouteModule('/admin')`); **não existe `pages/Admin.jsx`** no projeto.  
  Conclusão: arquivo órfão e com referência quebrada; se for mantido, deve ser atualizado; caso contrário, candidato à remoção.

### 7.5 Arquivos de teste esquecidos / legado

- `pages/__tests__/Game.test.jsx` — testa o componente legado `Game`.
- `components/__tests__/GameField.test.jsx` — testa `GameField` (usado só pelo Game legado).

Não foram encontrados outros arquivos de teste óbvios “esquecidos” nas páginas do player.

---

## 8. Riscos de confusão futura

- **Vários “games” no mesmo app:**  
  Nomes como Game, GameShoot, GameFinal, GameShootFallback, GameShootTest, GameShootSimple podem levar um novo dev a achar que “GameShoot” ou “Game” é a tela oficial. **Tela oficial = GameFinal em `/game`.**

- **GameShoot parece tela oficial mas não é:**  
  Tem backend real e layout completo; porém a UI (Dashboard, TopBar, InternalPageLayout) só envia para `/game` (GameFinal). Quem abrir `GameShoot.jsx` pode assumir que é a tela principal.

- **Rota `/gameshoot` sem link:**  
  Existe e renderiza GameShoot, mas não há botão/link na aplicação. Pode gerar dúvida (“essa rota é usada?”). Está documentada aqui como legado; idealmente no futuro virar redirect para `/game` ou ser removida.

- **`lazyImports.js` aponta `/game` para Game (antigo):**  
  Se alguém passar a usar `loadRouteModule` ou lazy de `lazyImports` para “game”, carregaria o componente errado (Game em vez de GameFinal). Risco médio enquanto o arquivo estiver órfão; alto se for reativado sem correção.

- **Arquivos BACKUP e -simple:**  
  Podem ser confundidos com versões ativas:
  - `GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx`
  - `game-scene_BACKUP_BLOCO_F.css`, `game-scene-mobile_BACKUP_BLOCO_F.css`, `game-shoot_BACKUP_BLOCO_F.css`
  - `layoutConfig_BACKUP_BLOCO_F.js`
  - `App-backup.jsx`, `App-simple.jsx`
  - `usePerformance-backup.jsx`, `usePerformance-simple.jsx`  
  Nenhum deles é importado pelo `App.jsx` atual. Recomendação: manter apenas para histórico ou mover para pasta `_legacy/`/`_backup/` e documentar.

- **Fluxos duplicados:**  
  Dois fluxos de jogo “completos”: GameFinal (oficial) e GameShoot (legado em `/gameshoot`). Manter os dois sem documentação clara aumenta risco de alteração na tela errada.

- **Risco operacional:**  
  Baixo no estado atual: usuários só chegam ao jogo por `/game` (GameFinal). O risco seria reintroduzir links para `/gameshoot` ou reativar `lazyImports` sem atualizar para GameFinal.

---

## 9. Arquitetura final recomendada para V1

- **Rota oficial do jogo:**  
  **`/game`**

- **Componente oficial do jogo:**  
  **`GameFinal`** (`pages/GameFinal.jsx`)

- **Rotas auxiliares (oficiais):**  
  - `/dashboard` — Dashboard  
  - `/profile` — Profile  
  - `/pagamentos` — Pagamentos  
  - `/withdraw` — Withdraw  
  - `/terms`, `/privacy`, `/download`, `/forgot-password`, `/reset-password` — conforme seção 2 e 3.

- **Rotas legado (conhecidas):**  
  - `/gameshoot` → atualmente renderiza **GameShoot**. Recomendação pós-V1: redirect para `/game` ou remoção.

- **Componentes de jogo:**  
  - **Único oficial:** GameFinal.  
  - **Legado:** Game, GameShoot, GameShootFallback, GameShootTest, GameShootSimple (podem ser removidos ou movidos para legado após V1).

---

## 10. Recomendações de limpeza futura

(Implementar apenas **após** V1 estável e com backup; esta auditoria não altera código.)

1. **App.jsx**  
   - Remover imports: `Game`, `GameShootFallback`, `GameShootTest`, `GameShootSimple`.  
   - Manter apenas `GameFinal` e `GameShoot` até decidir o que fazer com `/gameshoot`.

2. **Rota `/gameshoot`**  
   - Opção A: substituir por `<Navigate to="/game" replace />`.  
   - Opção B: remover a rota e o import de `GameShoot` quando não houver mais necessidade da URL.

3. **Páginas/componentes legado (remover ou mover para `_legacy/`):**  
   - Game.jsx  
   - GameShoot.jsx (após redirect ou remoção da rota)  
   - GameShootFallback.jsx  
   - GameShootTest.jsx  
   - GameShootSimple.jsx  

4. **Componentes usados só pelo Game legado:**  
   - Se remover Game.jsx: avaliar remoção ou legado de Navigation, GameField, RecommendationsPanel (e testes associados).

5. **lazyImports.js**  
   - Ou remover (se não for usado em nenhum lugar), ou atualizar:  
     - `loadRouteModule('/game')` → `import('../pages/GameFinal')`  
     - Remover/corrigir referência a `../pages/Admin` (página inexistente).

6. **Arquivos BACKUP e -simple**  
   - Marcar claramente como legado (ex.: mover para `_backup/` ou `_legacy/`) e documentar no README ou neste doc para não serem usados como base de novas features.

7. **Testes**  
   - `Game.test.jsx` e `GameField.test.jsx` cobrem código legado; se as páginas/componentes forem removidos, os testes podem ser removidos ou adaptados para GameFinal, conforme estratégia do time.

---

## 11. Conclusão

- **O que fica (arquitetura limpa V1):**  
  - Rota **`/game`** com componente **`GameFinal`**.  
  - Rotas de auth, dashboard, profile, pagamentos, withdraw, terms, privacy, download.  
  - Componentes atuais de layout (InternalPageLayout, TopBar, etc.) e serviços usados por GameFinal (gameService, apiClient, layoutConfig, CSS do jogo).

- **O que é legado:**  
  - Rota **`/gameshoot`** e componente **GameShoot**.  
  - Componentes **Game**, **GameShootFallback**, **GameShootTest**, **GameShootSimple** (importados mas sem rota).  
  - Uso de **Navigation** e **GameField** apenas no fluxo do Game antigo.  
  - **lazyImports.js** (órfão e com `/game` → Game e Admin inexistente).  
  - Arquivos **BACKUP** e **-simple** listados na seção 8.

- **O que deve ser removido ou redirecionado depois da V1:**  
  - Imports mortos no App (Game, GameShootFallback, GameShootTest, GameShootSimple).  
  - Rota `/gameshoot` (virar redirect para `/game` ou remover).  
  - Páginas/componentes legado de jogo e, se aplicável, Navigation/GameField/RecommendationsPanel e testes associados.  
  - Ajuste ou remoção de `lazyImports.js`.  
  - Organização ou remoção de arquivos BACKUP/simple.

- **Arquitetura final limpa do player (referência):**  
  - Uma única tela de jogo: **`/game`** → **`GameFinal`**.  
  - Demais telas: Login, Register, Dashboard, Profile, Withdraw, Pagamentos, Terms, Privacy, Download, Forgot/Reset password.  
  - Sem rotas duplicadas de jogo e sem imports de componentes de jogo não utilizados no roteador.

Este documento serve como referência **read-only** para decisões de limpeza futura sem alterar código, rotas, deploy, banco ou produção no momento da auditoria.
