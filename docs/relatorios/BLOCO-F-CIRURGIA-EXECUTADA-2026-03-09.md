# BLOCO F — CIRURGIA EXECUTADA
**Data:** 2026-03-09  
**Projeto:** Gol de Ouro  
**Modo:** Cirúrgico (Surgical Mode)

---

## 1. Resumo

Execução cirúrgica final do BLOCO F (Interface do Jogo) para deixar a interface do jogador pronta para a V1 real, **sem alterar** a estrutura visual já validada da tela `/game`. Alterações restritas a: origem dos dados, integração com backend, container/viewport externo, navegação e toasts.

---

## 2. Arquivos modificados

| Arquivo | Alterações |
|--------|------------|
| `goldeouro-player/src/pages/GameFinal.jsx` | Backend real no lugar de simuladores; HUD com totais da conta; viewport fullscreen no container raiz |
| `goldeouro-player/src/App.jsx` | Inclusão de `ToastContainer` (react-toastify) e import do CSS |
| `goldeouro-player/src/components/TopBar.jsx` | **Novo** — barra superior com links (Início, Jogar, Depositar, Sacar, Perfil) e Sair |
| `goldeouro-player/src/pages/Dashboard.jsx` | Sidebar removida; uso de `TopBar`; remoção de `useSidebar` e margens `ml-16`/`ml-72` |
| `goldeouro-player/src/pages/Profile.jsx` | Sidebar removida; uso de `TopBar`; remoção de `useSidebar` e margens |
| `goldeouro-player/src/pages/Withdraw.jsx` | Sidebar removida; uso de `TopBar`; remoção de `useSidebar` e margens; estados de loading/erro atualizados |
| `goldeouro-player/src/pages/Pagamentos.jsx` | Sidebar removida; uso de `TopBar`; saldo via `response.data.data.saldo`; `carregarDados` com `useCallback` e `useEffect` estável; histórico de `historico_pagamentos` ou `payments` |
| `goldeouro-player/src/pages/GameShoot.jsx` | Sidebar removida; uso de `TopBar`; remoção de `useSidebar` e margens; imports não usados removidos |

---

## 3. O que foi alterado

### 3.1 GameFinal.jsx
- **Removido:** `simulateInitializeGame()` e `simulateProcessShot()` (simuladores).
- **Adicionado:** Imports de `gameService`, `apiClient`, `API_ENDPOINTS`.
- **Inicialização:** Na montagem, chamada a `apiClient.get(API_ENDPOINTS.PROFILE)` para obter `saldo`, `total_apostas`, `total_ganhos`, `total_gols_de_ouro`; em seguida `gameService.initialize()` para métricas (ex.: `shotsUntilGoldenGoal`). HUD preenchido com esses dados (fallback 0 quando ausentes).
- **Estado:** `shotsTaken` renomeado para `totalChutes` e tratado como total da conta.
- **handleShoot:** Chamada a `gameService.processShot(direction, betAmount)`; atualização de `balance`, `totalChutes`, `totalWinnings`, `totalGoldenGoals` e `shotsUntilGoldenGoal` a partir da resposta; lógica de animação, overlays e áudio mantida.
- **Viewport:** No container raiz `.game-viewport` aplicado `style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}`.

### 3.2 App.jsx
- Import de `ToastContainer` (react-toastify) e `react-toastify/dist/ReactToastify.css`.
- Renderização de `<ToastContainer position="top-right" autoClose={4000} theme="dark" />` após `VersionWarning`.

### 3.3 TopBar (novo)
- Componente de navegação no topo: logo, links (Início, Jogar, Depositar, Sacar, Perfil), botão Sair.
- Menu hamburger no mobile; links horizontais no desktop.
- Sem sidebar; sem saldo fixo (R$ 150 removido).

### 3.4 Dashboard, Profile, Withdraw, Pagamentos, GameShoot
- Remoção de `Navigation` e `useSidebar()`.
- Uso de `TopBar` no topo da página.
- Conteúdo sem margens laterais da sidebar (`ml-16`/`ml-72`/`ml-64`); layout com `flex flex-col` e `flex-1` onde aplicável.

### 3.5 Pagamentos.jsx
- Saldo: `setSaldo(Number(response.data.data.saldo) || 0)` (não mais `response.data.balance`).
- `carregarDados` definido com `useCallback` e dependências vazias; `useEffect(() => { carregarDados(); }, [carregarDados])` para evitar loop.
- Histórico: `data.historico_pagamentos` ou `data.payments`.

---

## 4. O que foi mantido (proteção /game)

- **layoutConfig.js:** não alterado.
- **Stage 1920x1080:** não alterado.
- **Cálculo de scale e transform:** não alterado.
- **Posições do goleiro, bola e alvos:** não alteradas.
- **Layout do HUD (títulos e estrutura):** mantido (SALDO, CHUTES, GANHOS, GOLS DE OURO).
- **Overlays, animações e sons:** não alterados.
- **Assets e CSS do jogo:** não alterados.

A tela `/game` continua visualmente igual; apenas a origem dos dados e o container externo foram alterados.

---

## 5. Impactos da mudança

- **Jogo:** Saldo, chutes, ganhos e gols de ouro passam a vir do backend; chutes processados via `POST /api/games/shoot`; mobile com viewport fullscreen (100vw × 100dvh) no container da página.
- **Toasts:** Mensagens em GameFinal, Pagamentos e GameShoot passam a ser exibidas pelo `ToastContainer` global.
- **Navegação:** Páginas fora de `/game` passam a usar apenas TopBar; sidebar removida; saldo fake (R$ 150) eliminado.
- **Pagamentos:** Saldo correto via perfil e sem loop no `useEffect` de carregamento.

---

## 6. Confirmação

- A estrutura visual interna da página `/game` **não foi alterada** (layoutConfig, stage, scale, posições, HUD layout, overlays, animações, sons).
- Alterações limitadas a: origem dos dados, integração com backend e container/viewport externo da `/game`.

---

*Relatório gerado em 2026-03-09 — BLOCO F Cirurgia Executada.*
