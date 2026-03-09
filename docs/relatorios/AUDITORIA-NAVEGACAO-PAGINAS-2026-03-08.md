# AUDITORIA DE NAVEGAÇÃO

**Projeto:** Gol de Ouro — Web Player  
**Escopo:** Navegação entre páginas após remoção da sidebar  
**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de código)

**Objetivo:** Mapear como o usuário navega entre as páginas, identificar botões por tela, fluxos quebrados ou redundantes, e recomendar melhorias simples.

---

## 1. Mapa de rotas

### Rotas públicas (App.jsx)

| Rota | Página |
|------|--------|
| / | Login |
| /register | Register |
| /forgot-password | ForgotPassword |
| /reset-password | ResetPassword |
| /terms | Terms |
| /privacy | Privacy |
| /download | DownloadPage |

### Rotas protegidas (ProtectedRoute)

| Rota | Página |
|------|--------|
| /dashboard | Dashboard |
| /game | GameShoot |
| /gameshoot | GameShoot |
| /profile | Profile |
| /withdraw | Withdraw |
| /pagamentos | Pagamentos |

**Observação:** /game e /gameshoot renderizam o mesmo componente (GameShoot). A rota principal do jogo de chute ao gol é /game.

---

## 2. Navegação por página

| Página | Botão / Ação | Destino / Efeito |
|--------|--------------|-------------------|
| **Dashboard** | 👤 (ícone header) | Logout → navigate('/') |
| **Dashboard** | Jogar (Penalty Shootout) | /game |
| **Dashboard** | Depositar (PIX Instantâneo) | /pagamentos |
| **Dashboard** | Sacar (PIX 24h) | /withdraw |
| **Dashboard** | Perfil (Estatísticas) | /profile |
| **Dashboard** | Ver todas → (apostas recentes) | alert() — não navega |
| **GameShoot** | 💳 Recarregar | /pagamentos |
| **GameShoot** | 📊 Dashboard | /dashboard |
| **GameShoot** | Zonas do gol | handleShoot(zone) — jogo |
| **GameShoot** | (texto "Tente novamente") | Continuar na mesma tela; novo chute ao clicar na zona |
| **Pagamentos** | ← Voltar | /dashboard |
| **Pagamentos** | ⚽ Jogar agora (no card PIX) | /game |
| **Pagamentos** | 📋 Copiar Código PIX | Ação local (clipboard) |
| **Withdraw** | ← (voltar) | /dashboard |
| **Withdraw** | (outros botões) | Ações locais (formulário, sucesso) |
| **Profile** | ← (voltar) | /dashboard |
| **Profile** | Abas (Informações, Apostas, etc.) | setActiveTab — navegação interna |
| **Game** | ← (header) | /dashboard |
| **Game** | Voltar ao Dashboard (após resultado) | /dashboard |
| **Game** | 🏠 Menu (fixo canto inferior esquerdo) | /dashboard |
| **Game** | Nova Partida | resetGame — reinicia na mesma tela |

---

## 3. Dashboard como hub

### Botões principais

- **Jogar** → /game (GameShoot).  
- **Depositar** → /pagamentos.  
- **Sacar** → /withdraw.  
- **Perfil** → /profile.  
- **Logout** → ícone 👤 no header, title "Sair"; chama handleLogout → limpa token/user e navigate('/').

### Avaliação

O Dashboard concentra as quatro ações principais (Jogar, Depositar, Sacar, Perfil) e é o único ponto com logout visível. Todas as outras páginas protegidas oferecem "Voltar" ou "Dashboard" para retornar a ele.

**O Dashboard cumpre o papel de hub principal?** **Sim.** É a única tela com acesso direto a todas as seções e ao logout; as demais telas dependem dele para voltar e sair.

---

## 4. Fluxo principal do jogo

### Sequência

1. **Dashboard** — usuário vê saldo e clica em **Depositar** ou **Jogar** (se já tiver saldo).  
2. **Depositar** — vai para **Pagamentos** (/pagamentos); cria PIX; pode usar **Jogar agora** no card ou **← Voltar** para o Dashboard e depois **Jogar**.  
3. **Jogar** — vai para **GameShoot** (/game); escolhe zona, chuta; vê resultado (GOOOL / DEFENDEU / GOL DE OURO).  
4. **Resultado** — texto "Tente novamente" e destaque nas zonas; usuário clica em outra zona para novo chute (mesma tela).  
5. **Continuar** — pode **Recarregar** (/pagamentos) ou **📊 Dashboard** para voltar ao hub.

### Clareza

- O fluxo **Dashboard → Depositar → Pagamentos → Jogar agora → GameShoot → resultado → novo chute** está implementado e acessível.  
- O único passo que pode gerar dúvida é: após criar o PIX, o usuário precisa saber que pode clicar em **"Jogar agora"** no card ou voltar ao Dashboard e clicar em **Jogar**. O CTA "Jogar agora" no card de PIX deixa isso explícito.  
- Em GameShoot, "Tente novamente" é apenas texto; o novo chute é dado clicando de novo em uma zona — coerente com o patch de UX (sem botão grande "Chutar novamente").

**Esse fluxo está claro?** Sim. **Existe algum passo confuso?** Não crítico; o fluxo está navegável de forma linear.

---

## 5. Fluxos secundários

### Dashboard → Perfil

- Dashboard: botão **Perfil** (Estatísticas).  
- Profile: botão **←** para /dashboard.  
- **Conclusão:** Fluxo claro; ida e volta cobertos.

### Dashboard → Sacar

- Dashboard: botão **Sacar** (PIX 24h).  
- Withdraw: botão **←** para /dashboard.  
- **Conclusão:** Fluxo claro; ida e volta cobertos.

**Esses fluxos estão claros?** Sim.

---

## 6. Botões redundantes

### Duplicação de destino

- **Game.jsx:** Três formas de ir ao Dashboard: (1) **←** no header, (2) **Voltar ao Dashboard** após o resultado da partida, (3) **🏠 Menu** fixo no canto. Todas fazem `navigate('/dashboard')`.  
  **Classificação:** Redundância **média** — três botões para o mesmo destino na mesma tela; não quebra nada, mas pode ser simplificado (ex.: manter só Voltar no header e um CTA pós-resultado).

- **GameShoot:** Dois botões de saída: **Recarregar** (/pagamentos) e **📊 Dashboard** (/dashboard). Destinos diferentes; não é redundância, é oferta de atalhos. **OK.**

### Navegação duplicada

- Não há duas rotas diferentes para a mesma página com nomes distintos, exceto /game e /gameshoot (ambas GameShoot), já documentado.  
- Nenhum botão "fantasma" que não leve a lugar nenhum na navegação entre páginas.

### Resumo

- **Redundância baixa:** Nenhuma identificada além da já citada.  
- **Redundância média:** Game.jsx — três botões para Dashboard.  
- **Redundância alta:** Nenhuma.

---

## 7. Botões ausentes

### Telas sem logout visível

- **GameShoot, Pagamentos, Withdraw, Profile, Game:** Nenhuma exibe botão ou link "Sair" / "Logout".  
- Para sair, o usuário precisa **Voltar** (ou **Dashboard**) e no Dashboard clicar no ícone 👤.  
- **É bloqueante?** Não. A saída existe (via Dashboard). **É lacuna de UX?** Sim — quem não descobrir o ícone no Dashboard pode achar que não há como sair.

### Telas sem "Voltar" ou "Dashboard"

- Todas as páginas protegidas, exceto o Dashboard, têm pelo menos um botão que leva de volta ao Dashboard (Voltar, ← ou 📊 Dashboard).  
- **Existe alguma tela sem saída clara?** Não. Todas têm saída para /dashboard; apenas o logout não está visível em todas.

### Outros ausentes

- **Pagamentos:** Não tem link direto para Perfil ou Sacar; faz sentido para uma tela focada em depósito; usuário volta ao Dashboard para acessar o resto. **Aceitável.**  
- **Profile:** Não tem link para Jogar ou Depositar; usuário volta ao Dashboard. **Aceitável.**

---

## 8. Consistência de navegação

### Padrões observados

| Padrão | Dashboard | GameShoot | Pagamentos | Withdraw | Profile | Game |
|--------|-----------|-----------|------------|----------|---------|------|
| Botão voltar / Dashboard | — (é o hub) | 📊 Dashboard | ← Voltar | ← | ← | ← + Voltar ao Dashboard + 🏠 Menu |
| CTA Jogar | Jogar | — (é o jogo) | Jogar agora (no card PIX) | — | — | — |
| CTA Depositar/Recarregar | Depositar | Recarregar | — | — | — | — |
| Logout | 👤 (header) | — | — | — | — | — |

### Inconsistências

- **Voltar:** Pagamentos usa texto **"← Voltar"**; Withdraw e Profile usam só **"←"** (sem label). GameShoot usa **"📊 Dashboard"** em vez de "Voltar". Game tem **←**, **Voltar ao Dashboard** e **Menu**. Ou seja, há variação de rótulo e quantidade de botões, mas sempre com destino ao Dashboard.  
- **Logout:** Só no Dashboard; nas outras telas não há padrão repetido.  
- **Consistência geral:** Razoável — toda tela secundária permite voltar ao hub; o que varia é o rótulo e a presença de logout.

**A navegação é consistente entre as páginas?** **Parcialmente.** O conceito "voltar ao Dashboard" está presente em todas; a forma (texto vs ícone, um vs vários botões) e a oferta de logout não são padronizadas.

---

## 9. Navegação do jogo

### GameShoot.jsx (rota /game — jogo principal)

- **Voltar / Dashboard:** Botão **📊 Dashboard** no rodapé da tela (junto ao toggle de áudio); leva a /dashboard.  
- **Recarregar:** Botão **💳 Recarregar** no header; leva a /pagamentos.  
- **Menu:** Não existe botão "Menu"; o que existe é o botão "Dashboard".  
- **Novo chute:** Zonas clicáveis + texto "Tente novamente" após o reset; não há botão "Jogar novamente" separado.  
- **Conclusão:** Nenhum botão ficou sem função após a remoção da sidebar; Recarregar e Dashboard têm destino claro.

### Game.jsx (página alternativa do jogo)

- **Voltar:** **←** no header → /dashboard.  
- **Menu:** Botão fixo **🏠 Menu** (canto inferior esquerdo) → /dashboard. Após a remoção da sidebar, "Menu" não abre mais um drawer; apenas leva ao Dashboard. A função passou a ser "ir ao hub", não "abrir menu lateral". **Não ficou sem função** — continua navegando.  
- **Recarregar:** Não existe em Game.jsx; usuário pode ir ao Dashboard e depois Depositar ou Jogar.  
- **Voltar ao Dashboard:** Após resultado da partida; redundante com ← e Menu, mas reforça a saída.  
- **Conclusão:** Nenhum botão ficou sem função; o "Menu" agora equivale a "ir ao Dashboard".

**Algum botão ficou sem função após remover a sidebar?** **Não.** Todos os botões que usam navigate() levam a uma rota válida; o "Menu" em Game.jsx passou a funcionar como atalho ao Dashboard.

---

## 10. Avaliação de UX

### Clareza

- O hub (Dashboard) é óbvio; as ações principais estão em botões nomeados (Jogar, Depositar, Sacar, Perfil).  
- Nas telas secundárias, o retorno ao Dashboard está sempre presente (Voltar, ← ou Dashboard).  
- O fluxo depositar → jogar → resultado → tentar de novo está suportado por botões e CTAs identificáveis.

### Simplicidade

- Poucos níveis de profundidade: no máximo Dashboard → uma tela (Pagamentos, GameShoot, Withdraw, Profile).  
- Não há menu global; a navegação é por ação na tela atual. Simples, mas exige que o usuário conheça o Dashboard como ponto central.

### Lógica do fluxo

- Faz sentido: começar no Dashboard, ir a uma função (depositar, jogar, sacar, perfil) e voltar.  
- O único ponto menos óbvio é o logout apenas no Dashboard (ícone 👤 com title "Sair"), que pode ser invisível para quem não passa o mouse.

**A navegação atual é intuitiva?** **Sim, com ressalvas.** É intuitiva para quem entende que o Dashboard é o centro; para sair da conta, depende de descobrir o ícone no header do Dashboard. Melhorar a visibilidade do logout (ou repeti-lo em mais uma tela) aumentaria a intuitividade.

---

## 11. Melhorias recomendadas

| # | Melhoria | Prioridade | Justificativa |
|---|----------|------------|----------------|
| 1 | Tornar o logout mais visível no Dashboard (ex.: label "Sair" ao lado do ícone ou botão pequeno "Sair") | **Média** | Ícone 👤 com title "Sair" pode passar despercebido; label ou botão reduz dúvida. |
| 2 | Adicionar logout em pelo menos uma outra tela (ex.: Profile), ou em um header compartilhado | **Média** | Quem está em Perfil/Saque/Jogo pode querer sair sem voltar ao Dashboard; melhora a sensação de controle. |
| 3 | Padronizar o botão de voltar: sempre "← Voltar" ou sempre "←" com title "Voltar ao Dashboard" | **Baixa** | Consistência visual e de acessibilidade; não altera o fluxo. |
| 4 | Em Game.jsx, reduzir redundância: manter apenas ← no header e um CTA pós-resultado (ex.: "Voltar ao Dashboard"); remover ou repensar o botão "Menu" fixo | **Baixa** | Três formas de ir ao Dashboard na mesma tela são desnecessárias; simplifica a tela. |
| 5 | Em GameShoot, considerar adicionar um botão "Voltar" ou "←" no header (além de Recarregar e Dashboard) para alinhar com Withdraw/Profile | **Baixa** | Opcional; já existe "Dashboard"; melhora consistência com outras telas. |
| 6 | Garantir que "Ver todas →" (apostas recentes no Dashboard) navegue para uma tela de histórico quando existir, em vez de alert() | **Baixa** | Evita dead-end de UX; depende de existir tela de histórico. |

Nenhuma melhoria foi classificada como **alta** prioridade: a navegação atual é funcional e o fluxo principal está claro; as sugestões são refinamentos de consistência e visibilidade do logout.

---

## CLASSIFICAÇÃO FINAL

**NAVEGAÇÃO ADEQUADA COM MELHORIAS**

A navegação entre páginas está funcional após a remoção da sidebar: o Dashboard atua como hub, todas as telas têm retorno ao Dashboard, o fluxo principal do jogo (depositar → jogar → resultado → novo chute) está coberto, e não há botões sem função. As lacunas são: logout visível apenas no Dashboard, pequenas inconsistências de rótulos (Voltar vs ← vs Dashboard) e redundância em Game.jsx. Com as melhorias recomendadas (prioridade média: logout mais visível e/ou em mais uma tela; prioridade baixa: padronização e redução de redundância), a experiência fica mais clara e consistente.

---

*Auditoria realizada em modo read-only. Nenhum código foi alterado.*
