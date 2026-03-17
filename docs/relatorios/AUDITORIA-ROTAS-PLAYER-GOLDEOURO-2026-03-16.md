# AUDITORIA DE ROTAS — PLAYER GOLDEOURO

**Data:** 2026-03-16  
**Modo:** READ-ONLY (nenhum código alterado)  
**Escopo:** Frontend Player — `goldeouro-player/`  
**Objetivo:** Mapear rotas oficiais, auxiliares e legado; decidir sobre `/gameshoot`.

---

## 1. Resumo executivo

O player declara **13 rotas** no `App.jsx`. O fluxo real do jogador usa **uma única rota de jogo: `/game`**, que renderiza **GameFinal**. A rota **`/gameshoot`** existe no router mas **não é referenciada por nenhum botão, link ou `navigate()`** em todo o projeto; apenas o acesso direto pela URL leva a ela. Portanto:

- **Rota oficial do jogo na V1:** `/game` (componente **GameFinal**).
- **`/gameshoot`:** classificada como **legado** — pode ser removida ou mantida apenas para compatibilidade/desenvolvimento, conforme decisão de produto.

Há ainda **imports não utilizados** no `App.jsx`: `Game`, `GameShootFallback`, `GameShootTest`, `GameShootSimple` (nenhum vinculado a rota).

---

## 2. Lista completa de rotas

Todas as rotas vêm de `goldeouro-player/src/App.jsx`.

| Rota | Componente | Protegida | Observação |
|------|------------|-----------|------------|
| `/` | Login | Não | Entrada principal |
| `/register` | Register | Não | Cadastro |
| `/forgot-password` | ForgotPassword | Não | Recuperação de senha |
| `/reset-password` | ResetPassword | Não | Redefinição de senha |
| `/terms` | Terms | Não | Termos de uso |
| `/privacy` | Privacy | Não | Política de privacidade |
| `/download` | DownloadPage | Não | Página de download |
| `/dashboard` | Dashboard | Sim (ProtectedRoute) | Hub pós-login |
| `/game` | **GameFinal** | Sim | **Tela oficial do jogo** |
| `/gameshoot` | GameShoot | Sim | **Nenhuma navegação aponta para aqui** |
| `/profile` | Profile | Sim | Perfil do jogador |
| `/withdraw` | Withdraw | Sim | Saque |
| `/pagamentos` | Pagamentos | Sim | Depósito PIX |

**Observação:** O arquivo importa também `Game`, `GameShootFallback`, `GameShootTest` e `GameShootSimple`, mas **nenhum deles** está associado a nenhuma `<Route>`.

---

## 3. Fluxo real do jogador

Fluxo reconstruído a partir de `navigate()`, `Link` e menus:

```
Login (/)
  → (sucesso) → /dashboard

Dashboard (/dashboard)
  → "Jogar" → /game
  → "Depositar" → /pagamentos
  → "Sacar" → /withdraw
  → "Perfil" → /profile

Game (/game) — GameFinal
  → "MENU PRINCIPAL" → /dashboard
  → "Recarregar" → /pagamentos
  → (após resultado) botão Pagamentos → /pagamentos

Pagamentos (/pagamentos)
  → "Voltar" / equivalente → /dashboard

Withdraw (/withdraw)
  → "Voltar" / equivalente → /dashboard

Profile (/profile)
  → "Voltar" / equivalente → /dashboard
```

**Respostas diretas:**

- **Qual rota inicia o jogo?** `/game` (acessada pelo botão "Jogar" no Dashboard e pelo footer "JOGAR AGORA" no InternalPageLayout).
- **Qual rota dispara o chute?** O chute ocorre **dentro** da tela `/game` (GameFinal); não há navegação para outra rota para chutar.
- **Qual rota mostra o resultado?** A mesma `/game` (GameFinal) exibe resultado (gol, defesa, ganhou, gol de ouro) na própria tela.

**Conclusão:** Não existe no fluxo nenhum passo que leve o usuário a `/gameshoot`. A única forma de chegar em `/gameshoot` é digitar a URL manualmente.

---

## 4. Auditoria das rotas do jogo

Comparação entre **GameFinal** (rota `/game`) e **GameShoot** (rota `/gameshoot`):

| Item | GameFinal | GameShoot |
|------|-----------|-----------|
| Usado na rota principal do fluxo | **Sim** (`/game`) | Não (nenhum link/navigate) |
| Usado no fluxo do jogador | **Sim** (Dashboard → Jogar) | Não |
| Contém gameplay real | **Sim** (stage fixo 1920×1080, animações) | Sim (campo em %, layout simples) |
| Usa gameService | **Sim** (initialize, processShot, getShotsUntilGoldenGoal) | Sim |
| Usa layoutConfig | **Sim** (STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, getTargetPosition) | **Não** (GOAL_ZONES em % no próprio componente) |
| Usa HUD (layoutConfig) | **Sim** (hud-header, hud-bottom-left, hud-bottom-right com saldo, chutes, ganhos, gols de ouro) | Não (header próprio via InternalPageLayout + blocos de estatísticas no corpo) |
| Layout | Tela cheia, stage em px, assets (goleiro, bola, gol, overlays) | InternalPageLayout + conteúdo em cards (Tailwind), campo 400×300 px com posições em % |

**Determinação:** A **tela real do jogo** na V1 é **GameFinal** em `/game`. GameShoot é uma implementação alternativa/antiga do mesmo jogo (mesmo backend via gameService), com UI e layout diferentes e fora do fluxo de navegação.

---

## 5. Rotas não utilizadas / potencialmente legado

- **`/gameshoot`**  
  - Declarada no `App.jsx` e funciona se acessada por URL.  
  - **Nenhuma ocorrência** de `navigate('/gameshoot')`, `Link to="/gameshoot"` ou referência em menus (Dashboard, TopBar, Navigation, InternalPageLayout usam apenas `/game`).  
  - **Classificação:** rota **não utilizada no fluxo** = **legado**.

**Busca global realizada:**

- `navigate('/gameshoot')` ou equivalente: **0 ocorrências**.
- `Link to="/gameshoot"` ou `to="/gameshoot"`: **0 ocorrências**.
- Menus (TopBar, Navigation, InternalPageLayout, Dashboard): apenas **`/game`** para “Jogar”.
- Únicas ocorrências de `"/gameshoot"`: definição da rota no `App.jsx` e no `App-backup.jsx` (backup).

**Componentes/páginas importados no App e não usados em nenhuma rota:**

- `Game` (página `Game.jsx`) — importado no App, **não** usado em nenhuma `<Route>`.
- `GameShootFallback`, `GameShootTest`, `GameShootSimple` — importados no App, **não** usados em nenhuma `<Route>`.

Esses componentes podem ser considerados **código morto** em termos de rotas (e, no caso de Game, a rota `/game` já está ocupada por GameFinal).

---

## 6. Classificação das rotas

**Rotas oficiais (fluxo principal do jogador):**

- `/` — Login  
- `/register` — Registro  
- `/dashboard` — Hub após login  
- `/game` — **Jogo (GameFinal)**  
- `/pagamentos` — Depósito  
- `/withdraw` — Saque  
- `/profile` — Perfil  

**Rotas auxiliares (suporte / navegação secundária):**

- `/forgot-password`, `/reset-password` — Recuperação/redefinição de senha  
- `/terms`, `/privacy` — Legal  
- `/download` — Download (ex.: app)  

**Rotas legado (fora do fluxo real):**

- `/gameshoot` — Tela de jogo alternativa; nenhum ponto de entrada na aplicação.

---

## 7. Decisão sobre `/gameshoot`

**A rota `/gameshoot` é necessária para a V1?**

- **Resposta: NÃO — rota legado.**

**Justificativa:**

- O fluxo oficial do jogo é: Dashboard → “Jogar” → **`/game`** (GameFinal).  
- Nenhum botão, link ou menu leva a `/gameshoot`.  
- GameShoot usa o mesmo backend (gameService) mas tem layout e UX diferentes (InternalPageLayout, campo em %, sem layoutConfig/HUD da versão final).  
- A versão de produção do jogo, após a cirurgia do Bloco F, é a **GameFinal** em `/game`.

**Pode ser removida futuramente?**

- **Sim.** A remoção da rota `/gameshoot` e, se desejado, do componente `GameShoot.jsx` (e de imports relacionados) não quebra o fluxo atual do jogador.  
- Se houver links externos ou bookmarks apontando para `/gameshoot`, pode-se optar por:  
  - redirecionar `/gameshoot` → `/game`, ou  
  - manter a rota apenas para compatibilidade até um ciclo de limpeza definido.

---

## 8. Recomendações

1. **Consolidar uma única rota de jogo:** manter **`/game`** como rota oficial e **GameFinal** como único componente de gameplay no fluxo.
2. **Tratar `/gameshoot` como legado:** remover da navegação e, em uma próxima etapa, remover a rota (e eventualmente o componente) ou redirecionar `/gameshoot` → `/game`.
3. **Limpar imports não usados no App.jsx:** remover `Game`, `GameShootFallback`, `GameShootTest`, `GameShootSimple` se não forem usados em nenhuma rota ou outro ponto de entrada.
4. **Documentar no projeto** que a “tela do jogo” da V1 é **GameFinal** em **`/game`**, para evitar nova duplicidade de rotas de jogo no futuro.

---

## 9. Conclusão objetiva

- **Rotas declaradas:** 13 no `App.jsx`; uma delas (`/gameshoot`) não é utilizada no fluxo.
- **Única rota oficial do jogo na V1:** **`/game`**, componente **GameFinal**.
- **GameShoot** em **`/gameshoot`** é **legado**: não é necessário para a V1 e pode ser removido ou redirecionado para `/game` em uma evolução futura, sem impacto no fluxo atual do jogador.

A auditoria foi realizada em modo **READ-ONLY**; nenhum arquivo do projeto foi modificado.
