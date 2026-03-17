# BLOCO F — CONSOLIDAÇÃO FINAL (READ-ONLY)

**Projeto:** Gol de Ouro  
**Documento:** Revisão final consolidada — auditoria read-only antes da cirurgia geral  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)

---

## 1. Resumo executivo

A **cirurgia do BLOCO F já foi executada** (relatório em `BLOCO-F-CIRURGIA-EXECUTADA-2026-03-09.md`). Este documento consolida o **estado real atual** da interface, o que está **implementado**, **decidido** ou **apenas discutido**, e fornece a visão definitiva para eventuais **ajustes pós-cirurgia** (cirurgia geral da interface).

**Conclusões principais:**

- **Implementado:** Jogo em `/game` com backend real; HUD com totais da conta; ToastContainer; TopBar em todas as páginas protegidas exceto `/game`; sidebar removida dessas páginas; Pagamentos com saldo correto e `useCallback`; viewport fullscreen no container da `/game`.
- **Decidido e mantido:** `/game` como tela oficial; layout interno da `/game` (layoutConfig, stage 1920×1080, posições, HUD, overlays) não deve ser alterado; navegação fora da `/game` via TopBar.
- **Ainda em aberto ou recomendado:** Consistência visual da página Pagamentos (claro vs escuro); ErrorBoundary com link para início/dashboard; micro melhorias visuais na `/game` (pulse nas zonas, reflexo goleiro, etc.) — parte discutida, parte pendente de decisão final; padronização global de botões; históricos vazios no Perfil e “Ver todas” no Dashboard.

---

## 2. Estado real atual da interface (após cirurgia executada)

### 2.1 Rotas e componentes

| Rota | Componente | Sidebar | Navegação | Backend jogo |
|------|------------|---------|-----------|--------------|
| `/` | Login | Não | — | — |
| `/dashboard` | Dashboard | **Não** | **TopBar** | — |
| `/game` | **GameFinal** | Não | Botões MENU PRINCIPAL / Recarregar | **Real** (gameService + API) |
| `/gameshoot` | GameShoot | **Não** | **TopBar** | Real |
| `/profile` | Profile | **Não** | **TopBar** | — |
| `/withdraw` | Withdraw | **Não** | **TopBar** | — |
| `/pagamentos` | Pagamentos | **Não** | **TopBar** | — |

- **Navigation (sidebar):** Componente ainda existe em `components/Navigation.jsx`, mas **não é usado** em nenhuma rota ativa. Apenas `Game.jsx` importa Navigation; `Game.jsx` **não tem rota** em `App.jsx`.
- **TopBar:** Usado em Dashboard, Profile, Withdraw, Pagamentos, GameShoot. **Não** usado em `/game` (GameFinal permanece imersivo).

### 2.2 Dados e integração

- **GameFinal:** Inicialização com `apiClient.get(API_ENDPOINTS.PROFILE)` (saldo, total_apostas, total_ganhos, total_gols_de_ouro) e `gameService.initialize()` (métricas/shotsUntilGoldenGoal). Chute via `gameService.processShot()`. HUD exibe **totais da conta** (totalChutes, totalWinnings, totalGoldenGoals).
- **Pagamentos:** Saldo com `response.data.data.saldo`; `carregarDados` em `useCallback`; `useEffect([carregarDados])`; histórico de `historico_pagamentos` ou `payments`.
- **App.jsx:** `ToastContainer` (react-toastify) presente; tema dark, top-right, autoClose 4000.

### 2.3 Viewport e proteção da /game

- **Container da /game:** `style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}` no `.game-viewport`.
- **layoutConfig.js, stage 1920×1080, scale, posições, HUD layout, overlays, animações, sons:** Não alterados pela cirurgia.

---

## 3. O que já está implementado

| Item | Onde está | Estado atual | Decidido? | Implementado? | Risco alteração | Recomendação | Cirurgia geral agora? |
|------|-----------|--------------|-----------|----------------|------------------|--------------|-------------------------|
| Backend real na /game | GameFinal.jsx | apiClient + gameService; sem simulate* | SIM | SIM | ALTO | Não reverter | NÃO |
| HUD com totais da conta | GameFinal.jsx | totalChutes, totalWinnings, totalGoldenGoals do perfil/API | SIM | SIM | ALTO | Manter | NÃO |
| ToastContainer | App.jsx | Montado após VersionWarning | SIM | SIM | BAIXO | Manter | NÃO |
| TopBar fora da /game | Dashboard, Profile, Withdraw, Pagamentos, GameShoot | TopBar no topo; sem sidebar | SIM | SIM | MÉDIO | Manter | NÃO |
| Sidebar removida | Todas as páginas protegidas exceto /game | Navigation não renderizada nessas rotas | SIM | SIM | MÉDIO | Manter | NÃO |
| Saldo real em Pagamentos | Pagamentos.jsx | response.data.data.saldo | SIM | SIM | BAIXO | Manter | NÃO |
| useCallback/useEffect em Pagamentos | Pagamentos.jsx | carregarDados estável; sem loop | SIM | SIM | BAIXO | Manter | NÃO |
| Viewport fullscreen /game | GameFinal.jsx .game-viewport | 100vw, 100dvh, overflow hidden | SIM | SIM | BAIXO | Manter | NÃO |
| Saldo fake R$ 150 removido | Navegação | TopBar sem saldo; sidebar não usada | SIM | SIM | — | — | NÃO |

---

## 4. O que já está oficialmente decidido

- **Tela oficial do jogo:** `/game` com GameFinal; não redesenhar o jogo.
- **Estrutura visual da /game:** Não alterar layoutConfig, stage 1920×1080, transform/scale, posições do goleiro/bola/alvos, layout do HUD, overlays, animações, sons. Alterações apenas na origem dos dados, integração com backend e container/viewport externo.
- **HUD:** Títulos SALDO, CHUTES, GANHOS, GOLS DE OURO; valores da conta (backend).
- **Navegação fora da /game:** Sem sidebar; TopBar ou equivalente (já implementado como TopBar).
- **Aposta fixa:** R$ 1 por chute; sem seletor R$1/R$2/R$5/R$10 nas telas ativas.
- **Backup visual:** Preservado em GameFinal_BACKUP_*, layoutConfig_BACKUP_*, CSS _BACKUP_BLOCO_F (referência).

---

## 5. O que foi apenas discutido e ainda precisa decisão final

| Item | Onde está | Estado atual | Decidido? | Implementado? | Risco | Recomendação | Cirurgia geral agora? |
|------|-----------|--------------|-----------|----------------|-------|--------------|-------------------------|
| Pulse nas zonas de chute | /game (layoutConfig/CSS) | Não existe | NÃO | NÃO | MÉDIO | Decidir se entra; se sim, só CSS/animacao nas zonas, sem mexer em posições | Definir |
| Iluminação/reflexo no goleiro | /game (assets ou CSS) | Não existe | NÃO | NÃO | MÉDIO | Decidir; se sim, overlay ou shader sutil | Definir |
| Efeito visual sutil na bola | /game | Não existe | NÃO | NÃO | BAIXO | Decidir | Definir |
| Microefeitos de feedback no HUD | /game HUD | Não existe | NÃO | NÃO | BAIXO | Decidir (ex.: destaque ao atualizar valor) | Definir |
| Aviso “Gol de Ouro” (próximo chute) | /game | Não verificado como obrigatório nos docs | PARCIAL | NÃO | BAIXO | Confirmar se é requisito; se sim, texto/ícone no HUD | Definir |
| Pagamentos: dark mode / glassmorphism | Pagamentos.jsx | Hoje bg-gray-50, cards brancos | NÃO | NÃO | MÉDIO | Alinhar ao resto do app ou manter claro por decisão de produto | Definir |
| ErrorBoundary: link início/dashboard | ErrorBoundary.jsx | Só “Recarregar Página” | NÃO | NÃO | BAIXO | Recomendado em auditorias | SIM (baixo risco) |
| Withdraw: navegação em estado de erro | Withdraw.jsx | TopBar já está; conteúdo de erro pode ter “Voltar” | PARCIAL | PARCIAL | BAIXO | Garantir botão “Voltar ao Dashboard” na área de erro | SIM |
| Profile: toasts em vez de alert() | Profile.jsx | handleSave usa alert() | NÃO | NÃO | BAIXO | Recomendado | SIM |
| Dashboard “Ver todas” (Apostas) | Dashboard.jsx | alert('em breve') | NÃO | NÃO | BAIXO | Implementar tela ou remover botão | DEPOIS |
| Perfil: abas Apostas/Saques vazias | Profile.jsx | Arrays vazios | NÃO | NÃO | MÉDIO | Integrar backend ou ocultar abas | DEPOIS |

---

## 6. Análise específica da /game

### 6.1 Estrutura visual atual

- **Stage:** 1920×1080 (layoutConfig); escala JS (min(scaleX, scaleY)); transform no `.game-scale`.
- **Container raiz:** `.game-viewport` com 100vw × 100dvh, overflow hidden.
- **HUD:** Logo, SALDO, CHUTES, GANHOS, GOLS DE OURO, aposta R$ 1,00, MENU PRINCIPAL, Recarregar.
- **Zonas:** TL, TR, C, BL, BR; posições e tamanhos via layoutConfig; botões desabilitados quando saldo < aposta ou fase !== IDLE.
- **Overlays:** goool, defendeu, ganhou, golden-goal via createPortal; áudio kick, gol, defesa, torcida; mute no HUD.

### 6.2 O que já foi implementado após a cirurgia

- Backend real (perfil + gameService.initialize + gameService.processShot).
- HUD com saldo e totais da conta (totalChutes, totalWinnings, totalGoldenGoals).
- Viewport fullscreen no container.
- Nenhuma alteração em layoutConfig, stage, scale, posições, overlays, assets.

### 6.3 O que ainda falta (se aplicável)

- **Aviso “Gol de Ouro” (próximo chute):** Documentos citam “Chutes até próximo Gol de Ouro”; no código, `shotsUntilGoldenGoal` existe e pode ser exibido no HUD. Verificar se já está na UI (ex.: texto no HUD).
- **Micro melhorias discutidas:** pulse nas zonas, reflexo goleiro, efeito na bola, microefeitos no HUD — nenhuma implementada; dependem de decisão.

### 6.4 Viabilidade de melhorias sem quebrar layout

- **Pulse nas zonas:** Viável via CSS (animation) nos botões das zonas, **sem alterar** posições ou tamanhos do layoutConfig. Risco: BAIXO.
- **Iluminação/reflexo no goleiro:** Viável com overlay ou classe CSS na imagem do goleiro; não alterar posição/tamanho. Risco: BAIXO a MÉDIO.
- **Efeito visual sutil na bola:** Viável (sombra, brilho, escala leve em CSS). Risco: BAIXO.
- **Microefeitos no HUD:** Viável (transição de opacidade/cor ao atualizar valor). Risco: BAIXO.

### 6.5 O que NÃO deve ser tocado na /game

- layoutConfig.js (incl. STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, getTargetPosition, etc.).
- Dimensões e proporção do stage (1920×1080).
- Cálculo de scale e transform.
- Posições do goleiro, da bola e dos alvos.
- Layout do HUD (estrutura e títulos).
- Overlays (imagens, createPortal, durações).
- Assets do jogo (imagens, sons).
- Animações de resultado (sequência goool/ganhou/golden-goal).

---

## 7. Análise específica da /pagamentos

### 7.1 Estrutura e estilo atuais

- **Layout:** TopBar no topo; conteúdo em cards (bg-white, border-gray-200); fundo `bg-gray-50`.
- **Header:** “Pagamentos PIX”; “Saldo atual” + valor em destaque (R$ {saldo.toFixed(2)}); botão “← Voltar”.
- **Fluxo:** Valores pré-definidos + valor customizado → “Recarregar R$ X” → criação PIX; instruções “Como funciona o PIX”; pagamento atual (código/QR); histórico em tabela.

### 7.2 “Saldo atual R$ 0.00”

- **Estado:** O valor exibido é **dinâmico**: `R$ {saldo.toFixed(2)}`, com `saldo` vindo de `response.data.data.saldo`. Pode ser 0.00 quando a conta realmente tem saldo zero ou quando a API falha (aí mantém 0). O **bug anterior** (response.data.balance) foi corrigido.
- **Recomendação:** Manter o rótulo “Saldo atual” e o valor; não remover. Se houver falha de carregamento, considerar mensagem “Não foi possível carregar o saldo” e retry (já há try/catch em carregarDados).

### 7.4 Alterações já decididas/recomendadas

- **Decidido e feito:** Saldo via `response.data.data.saldo`; `useCallback` + `useEffect` estável; histórico de `historico_pagamentos` ou `payments`; TopBar; remoção da sidebar.
- **Recomendado (não obrigatório):** Alinhar estilo ao restante do app (fundo escuro + glassmorphism) — decisão de produto; clareza dos botões e do fluxo está ok; mensagens de erro/sucesso via toast já usadas.

### 7.5 Consistência visual

- **Atual:** Pagamentos é a única página com tema claro (gray-50, branco). Demais páginas protegidas usam fundo escuro e glassmorphism.
- **Recomendação:** Definir se Pagamentos permanece “clara” (ex.: área financeira) ou se entra no padrão escuro; em ambos os casos documentar a decisão.

---

## 8. Análise da navegação global

### 8.1 Estado real atual

- **Fora da /game:** TopBar (logo, Início, Jogar, Depositar, Sacar, Perfil, Sair); menu hamburger no mobile; sem sidebar; sem saldo na barra.
- **Na /game:** Sem TopBar; botões MENU PRINCIPAL (→ /dashboard) e Recarregar (→ /pagamentos).
- **Navigation.jsx:** Existe mas não é usado em nenhuma rota ativa.

### 8.2 Comparação de opções (fora da /game)

| Opção | Clareza | Consistência | Mobile | Espaço | Risco visual | Manutenção | Estado atual |
|-------|---------|--------------|--------|--------|--------------|------------|--------------|
| 1. TopBar | Boa | Boa | Boa (hamburger) | Pouco | Baixo | Fácil | **Implementada** |
| 2. Header simples com poucos botões | Boa | Média | Depende | Pouco | Baixo | Fácil | Não |
| 3. Só botões dentro de cada página | Média | Variável | Variável | Zero | Baixo | Dispersa | Parcial (ex.: Voltar) |
| 4. Híbrida (TopBar + botões locais) | Boa | Boa | Boa | Pouco | Baixo | Média | **Atual:** TopBar + botões (Voltar, etc.) |

### 8.3 Padrão final adotado

- **Padrão em uso e recomendado:** **TopBar** fora da `/game`, com links principais; em cada página, botões de ação locais (ex.: Voltar, Recarregar) quando fizer sentido. **Não** reintroduzir sidebar nas páginas protegidas.

---

## 9. Análise da padronização de botões

### 9.1 Mapeamento resumido

- **Primário (ação principal):** Verde em várias páginas (bg-green-600, hover:bg-green-700) — Pagamentos “Recarregar”, GameShoot “Recarregar”, ResetPassword “Redefinir”, etc.
- **Secundário / navegação:** Azul (bg-blue-600, hover:bg-blue-700) — Pagamentos “Voltar”, “Verificar Status”, GameShoot “Dashboard”.
- **Destrutivo / erro:** Vermelho ou borda vermelha (bg-red-500/20, text-red) — mensagens de erro; TopBar “Sair” em vermelho no mobile.
- **Amarelo/dourado (identidade):** bg-yellow-400/500 em Login, ForgotPassword, ResetPassword, ErrorBoundary “Recarregar Página”.
- **Inconsistências:** Tamanhos variados (px-4 py-2 vs px-6 py-3 vs py-3 px-4); alguns rounded-lg, outros rounded-xl; Pagamentos usa mais azul/verde “admin”; Dashboard/Profile usam glassmorphism (bg-white/10, border-white/20).

### 9.2 Recomendações de padrão

- **Primário:** Manter verde (green-600/700) para ações principais (Recarregar, Confirmar, Salvar).
- **Secundário:** Azul (blue-600/700) para navegação secundária (Voltar, Verificar, Dashboard).
- **Destrutivo:** Vermelho ou outline vermelho para Sair e ações destrutivas.
- **Identidade:** Amarelo/dourado (yellow-400/500) para CTA de login/recuperação e ErrorBoundary.
- **Páginas a revisar (consistência):** Pagamentos (cores mais “admin”); GameShoot (alinhar a primário/secundário acima). Revisão pode ser feita na cirurgia geral, sem mudar comportamento.

### 9.3 Resposta direta

- **Padrão visual a adotar:** Primário verde, secundário azul, destrutivo vermelho, identidade amarelo; tamanhos padronizados (ex.: primário py-3 px-6, secundário px-4 py-2).
- **Páginas que precisam de revisão:** Pagamentos (estilo e, se desejado, tema); GameShoot (botões); manter Dashboard/Profile/Withdraw como referência de glassmorphism.

---

## 10. Estados de erro

| Onde | Mensagens | Ações | Rotas de saída | Clareza | Consistência |
|------|-----------|-------|----------------|---------|--------------|
| ErrorBoundary | “Ops! Algo deu errado” | Recarregar Página | Nenhuma (só reload) | Boa | — |
| Withdraw | ErrorMessage + onRetry | Tentar Novamente | TopBar visível (pode ir a outras páginas) | Boa | Boa |
| Pagamentos | toast.error | — | TopBar | Boa | Boa |
| GameFinal | toast.error / toast.success / toast.info | — | MENU PRINCIPAL, Recarregar | Boa | Boa |
| GameShoot | toast | — | TopBar | Boa | Boa |
| Profile | alert() no save | — | TopBar | Média | Baixa (alert vs toast) |

- **ErrorBoundary:** Falta link “Voltar ao início” ou “Ir ao Dashboard” para não depender só de reload. Risco de alteração: BAIXO.
- **Withdraw:** Com TopBar, já há saída; opcionalmente, na área de erro, botão explícito “Voltar ao Dashboard”.
- **Profile:** Trocar alert() por toast no handleSave aumenta consistência.

---

## 11. Lista de micro melhorias visuais seguras (para a /game)

- Aplicar **apenas** em CSS ou atributos de estilo/className; **não** alterar layoutConfig, posições, tamanhos do stage.
- Pulse sutil nas zonas de chute (animation no botão).
- Brilho/reflexo leve na imagem do goleiro (overlay ou filter CSS).
- Sombra ou brilho sutil na bola (box-shadow ou animação leve).
- Transição suave no HUD ao atualizar valor (opacity ou color).
- Exibir “Chutes até próximo Gol de Ouro” no HUD se ainda não estiver visível (apenas texto/valor já existente no estado).

Todas: **risco BAIXO** se restritas a efeitos visuais sem mudar layout ou lógica.

---

## 12. Lista de itens que NÃO devem ser tocados

- **layoutConfig.js** (todo o arquivo).
- **Stage 1920×1080** e proporção.
- **Cálculo de scale** e `transform: scale()` no .game-scale.
- **Posições** do goleiro, bola e alvos (em px no layoutConfig e no stage).
- **Layout do HUD** (estrutura, títulos SALDO/CHUTES/GANHOS/GOLS DE OURO).
- **Overlays** (imagens, createPortal, durações).
- **Assets** do jogo (goalie_*, ball, bg_goal, goool, defendeu, ganhou, golden-goal, sons).
- **Animações** de resultado (sequência e timing).
- **Lógica** de handleShoot (validação de fase, saldo, direção) e integração com gameService.

---

## 13. Lista final

### 13.1 Implementar agora (cirurgia geral, baixo risco)

- ErrorBoundary: adicionar link “Voltar ao início” ou “Ir ao Dashboard”.
- Withdraw: garantir botão “Voltar ao Dashboard” na área de erro (se ainda não estiver óbvio pela TopBar).
- Profile: substituir alert() por toast no fluxo de salvar perfil.

### 13.2 Implementar depois

- Dashboard “Ver todas” (Apostas): implementar tela de histórico ou remover o botão.
- Perfil: integrar abas Apostas/Saques ao backend ou ocultar até haver dados.
- Padronização global de botões (cores e tamanhos) nas páginas que ainda divergem (ex.: Pagamentos, GameShoot).
- Pagamentos: decisão e, se for o caso, aplicação de dark mode/glassmorphism.
- Micro melhorias visuais na /game (pulse zonas, reflexo goleiro, efeito bola, HUD) após decisão explícita.

### 13.3 Não implementar (ou manter como está)

- Reintroduzir sidebar (Navigation) nas páginas protegidas.
- Alterar layoutConfig, stage, scale, posições, overlays ou assets da /game.
- Voltar a usar backend simulado na /game.
- Exibir saldo fixo (ex.: R$ 150) na navegação.
- Remover ou esconder “Saldo atual” em Pagamentos (manter rótulo e valor dinâmico).

---

## 14. Recomendação final para a cirurgia geral da interface

1. **Não alterar** a estrutura visual da `/game` (layoutConfig, stage, posições, HUD layout, overlays, animações, assets). Qualquer melhoria na `/game` deve ser apenas **microefeitos** (CSS/estilo) ou **texto** (ex.: “Chutes até próximo Gol de Ouro”) sem mudar layout.
2. **Manter** o padrão de navegação atual: TopBar fora da `/game`; `/game` imersiva com botões MENU PRINCIPAL e Recarregar.
3. **Aplicar** na cirurgia geral os itens de “Implementar agora”: ErrorBoundary com link de saída, Withdraw com saída clara em erro, Profile com toast em vez de alert().
4. **Decidir** formalmente: (a) micro melhorias visuais na `/game` (quais e se entram); (b) tema da página Pagamentos (claro vs escuro/glassmorphism); (c) padronização global de botões (quais páginas e nível de rigor).
5. **Deixar para ciclo posterior:** Histórico completo de apostas, abas de histórico do Perfil integradas, e refinamentos de copy/UX que não impactem fluxo ou dados.

Com isso, o BLOCO F fica com estado **consolidado e documentado**: já validado o que foi implementado na cirurgia; claros os itens decididos, em aberto e não tocados; e definido o que pode ser feito na cirurgia geral sem risco para a experiência visual validada da `/game`.

---

## Referências

- `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`
- `docs/ROADMAP-V1-GOLDEOURO.md`
- `docs/relatorios/AUDITORIA-BLOCO-F-INTERFACE-2026-03-09.md`
- `docs/relatorios/BLOCO-F-REVISAO-FINAL-READONLY-2026-03-09.md`
- `docs/relatorios/BLOCO-F-GAME-READONLY-PROFUNDO-2026-03-09.md`
- `docs/relatorios/BLOCO-F-BACKUP-GAME-2026-03-09.md`
- `docs/relatorios/BLOCO-F-CIRURGIA-EXECUTADA-2026-03-09.md`
- Código analisado: `goldeouro-player/src/` (App.jsx, main.jsx, GameFinal, GameShoot, Dashboard, Profile, Withdraw, Pagamentos, TopBar, ErrorBoundary, gameService, apiClient).

---

*Consolidação read-only. Nenhum arquivo ou código foi alterado.*
