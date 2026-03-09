# ESPECIFICAÇÃO EXECUTIVA — DEMO V2 GOL DE OURO

**Projeto:** Gol de Ouro — Web Player  
**Versão do documento:** 2.0  
**Data:** 2026-03-08  
**Modo de elaboração:** READ-ONLY ABSOLUTO (análise e documentação; nenhuma alteração de código)

**Escopo:** Frontend `goldeouro-player/src`. Consolidação das decisões estratégicas de UX da demo e auditoria do estado atual. Referência: ESPECIFICAÇÃO DEMO V1 e auditorias 2026-03-08.

---

## 1. Arquitetura atual

### 1.1 Stack e estrutura

| Camada | Tecnologia / Origem |
|--------|---------------------|
| Frontend | React, React Router, Tailwind CSS, Axios, react-toastify |
| Auth (UI) | AuthContext (token em localStorage), Login, Register, ForgotPassword, ResetPassword |
| API | apiClient (VITE_BACKEND_URL), API_ENDPOINTS em `config/api.js` |
| Backend | Node (server-fly.js), JWT 24h, rotas `/api/auth/*`, `/api/user/profile`, `/api/payments/pix/*`, `/api/games/shoot`, `/api/withdraw/*` |
| Saldo | Fonte única: `GET /api/user/profile` → `data.saldo` (Dashboard, GameShoot, Withdraw, Profile) |
| Navegação atual | Sidebar (Navigation.jsx) + SidebarContext; todas as telas protegidas usam `<Navigation />` e margem `ml-64` / `ml-72` |

### 1.2 Rotas

- **Públicas:** `/`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/download`
- **Protegidas:** `/dashboard`, `/game`, `/gameshoot`, `/profile`, `/withdraw`, `/pagamentos`
- **App.jsx:** Não renderiza `<ToastContainer />`; SidebarProvider envolve todas as rotas.

### 1.3 Blocos no sistema (referência)

| Bloco | Descrição | Componentes principais |
|-------|-----------|-------------------------|
| **A — Financeiro** | Depósito PIX, saque, saldo | Pagamentos.jsx, Withdraw.jsx, paymentService, withdrawService |
| **B — Sistema de apostas** | Chutes, lotes, prêmio | gameService.js, /api/games/shoot, lotes 10 chutes, Gol de Ouro |
| **C — Conta do usuário** | Cadastro, login, recuperação | Login, Register, ForgotPassword, ResetPassword, AuthContext |
| **D — Sistema de saldo** | Ledger, saldo exibido | Backend ledger; frontend profile em Dashboard, GameShoot, Withdraw, Profile; sidebar valor fixo |
| **E — Gameplay** | Animação, chute, goleiro, resultado | GameShoot.jsx, overlays, reset em 3 s |
| **F — Interface** | Layout, cores, botões, feedback | Navigation (sidebar), glassmorphism (Dashboard, GameShoot, Withdraw, Profile), Pagamentos tema claro |
| **G — Fluxo do jogador** | Jornada e micro-loop | Dashboard → Depositar/Jogar → Pagamentos → GameShoot → chute → resultado → repetir |

---

## 2. Decisões oficiais da demo

As definições abaixo são as metas de produto para a versão final da demo e devem orientar implementações futuras.

### 2.1 Remoção da sidebar

- **Decisão:** A sidebar **não** fará parte da versão final da demo.
- **Motivos:** Simplificação da interface, foco no fluxo principal, eliminação da inconsistência de saldo (valor fixo "R$ 150,00"), menos distração.
- **Impactos:** Navigation deve ser revisada (ou substituída por navegação inline/header); layout principal passa a ser full-width a partir do Dashboard; Dashboard se torna o centro da navegação.
- **Estado atual:** Sidebar **ainda presente** em todo o player (Navigation.jsx usada em Dashboard, GameShoot, Pagamentos, Withdraw, Profile); saldo no rodapé da sidebar permanece fixo "R$ 150,00".

### 2.2 Redesign da página Pagamentos

- **Decisão:** A página `/pagamentos` deve ser considerada **parte do jogo**, não um painel financeiro.
- **Diretrizes oficiais:**
  - Tema **dark**
  - **Glassmorphism** (bg-white/10, backdrop-blur, border-white/20)
  - Mesmo universo visual do GameShoot (fundo escuro, amarelo/dourado para destaque)
  - Foco em "depositar para jogar"
- **Problemas atuais a documentar:**
  - Tema **claro** (bg-gray-50, cards bg-white, text-gray-900)
  - Aparência **administrativa** (bordas gray-200, blue-600 em botões)
  - Falta de **CTA de retorno ao jogo** ("Jogar agora" / "Voltar ao jogo")
  - **Valor padrão alto** (valorRecarga = 200; presets [1, 5, 10, 25, 50, 100])

### 2.3 Padronização dos botões

- **Decisão:** Padrão visual **único** para CTAs principais: Depositar, Jogar, Sacar, Recarregar, Voltar.
- **Documentar:** Hierarquia (primário vs secundário), tamanho, estados (hover, disabled, loading), consistência entre telas.
- **Estado atual:** Dashboard usa quatro botões iguais (glassmorphism); GameShoot usa "Recarregar" verde e "Dashboard" azul; Pagamentos usa "Voltar" azul e "Recarregar" verde; Withdraw usa estilos próprios. Não há documento único de padrão de botões.

### 2.4 Nova navegação

- **Decisão:** Fluxo principal da demo:
  ```
  Dashboard
      ↓
  Depositar
      ↓
  Jogar
      ↓
  Resultado
      ↓
  Continuar jogando ou Sacar
  ```
- A navegação deve refletir essa jornada (sem sidebar; Dashboard como hub com links claros para Depositar, Jogar, Sacar, Perfil).

### 2.5 Continuidade do jogo (pós-chute)

- **Decisão:** **Não** usar botão grande "Chutar novamente".
- **Comportamento oficial:** Mostrar texto **discreto** "Tente novamente" e **destacar novamente as zonas de chute**.
- **Fluxo desejado:** resultado → zonas reativadas → novo chute (sem CTA gigante intermediário).

### 2.6 Melhorias definidas anteriormente (V1)

- Confirmação visual de **PIX aprovado** na tela Pagamentos
- CTA **"Jogar agora"** após depósito
- **ToastContainer** funcionando (sucesso/erro no jogo e em Pagamentos)
- **Correção do saldo exibido** (com remoção da sidebar, o problema do saldo fixo deixa de existir na nova navegação)
- **Copy explicativa** quando saldo = 0 no Dashboard (ex.: "Cada chute custa R$ 1,00 — recarregue para jogar") e destaque para Depositar

---

## 3. Blueprint atualizado do micro-loop

### 3.1 Loop oficial (pós-decisões)

```
PIX aprovado (com confirmação na UI)
    ↓
saldo creditado
    ↓
CTA "Jogar agora" (em Pagamentos ou Dashboard)
    ↓
Jogar (/game)
    ↓
chute
    ↓
resultado (overlay + feedback)
    ↓
zonas reativadas + texto discreto "Tente novamente"
    ↓
novo chute
    ↓
loop contínuo (ou Sacar)
```

### 3.2 Alinhamento atual vs blueprint

| Etapa | Alinhado? | Observação |
|-------|-----------|------------|
| PIX aprovado com confirmação | ❌ | Sem polling/atualização em tempo real em Pagamentos |
| Saldo creditado | ✅ (backend) | Frontend só reflete ao navegar para Dashboard/GameShoot |
| CTA "Jogar agora" | ❌ | Não existe em Pagamentos |
| Chute → resultado | ✅ | Overlays e atualização de saldo funcionam |
| Zonas reativadas | ✅ | Após 3 s, resetAnimations() libera zonas |
| Texto "Tente novamente" | ⚠️ | Existe apenas no toast ("Defesa! Tente novamente."); toast não aparece (ToastContainer ausente); não há texto discreto na tela |
| Destaque das zonas pós-resultado | ⚠️ | Zonas voltam ao estado normal (amarelo, hover); não há reforço visual explícito de "próximo chute" |

---

## 4. Redesign da navegação

### 4.1 Estado desejado (pós-decisão)

- **Sem sidebar:** Conteúdo principal ocupa toda a largura útil; navegação por header e/ou botões no próprio conteúdo.
- **Dashboard como centro:** Primeira tela após login; único hub com links para Depositar, Jogar, Sacar, Perfil.
- **Fluxo linear:** Dashboard → Depositar → (após PIX) CTA "Jogar agora" → /game → resultado → continuar na mesma tela (zonas + "Tente novamente") ou voltar ao Dashboard para Sacar.

### 4.2 Estado atual (auditoria)

- **Sidebar presente:** Navigation.jsx renderiza menu lateral (Dashboard, Jogar, Perfil, Saque); rodapé com "Jogador" e "R$ 150,00" fixo; botão Sair.
- **Uso:** Dashboard, GameShoot, Pagamentos, Withdraw e Profile importam e renderizam `<Navigation />`; conteúdo usa `ml-16` (sidebar recolhida) ou `ml-64`/`ml-72` (expandida).
- **Conclusão:** Redesign da navegação **não aplicado**; código ainda depende da sidebar e do SidebarContext.

---

## 5. Especificação da página Pagamentos

### 5.1 Especificação desejada (redesign oficial)

| Aspecto | Especificação |
|---------|----------------|
| **Tema** | Dark: fundo escuro (ex.: gradient gray-900/slate-900 ou imagem de estádio + overlay), sem bg-gray-50 |
| **Cards** | Glassmorphism: bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 |
| **Textos** | text-white, text-white/70, text-yellow-400 para destaque; sem text-gray-900 como padrão |
| **Botões** | Alinhados ao padrão do app (verde para ação primária "Recarregar"; secundário "Voltar" e CTA "Jogar agora" quando aplicável) |
| **Copy** | Orientado ao jogo: "Deposite para jogar", "Cada chute = R$ 1,00"; evitar "Pagamentos PIX" como título principal |
| **Valor padrão** | Reduzir de 200 para valor alinhado ao uso (ex.: 10 ou 20) |
| **Pós-PIX** | Confirmação de PIX aprovado (polling ou mensagem); CTA "Jogar agora" ou "Voltar ao jogo" |
| **Saldo** | Exibir saldo atual na página (opcional) para reforçar "depositar para jogar" |

### 5.2 Estado atual (auditoria)

| Aspecto | Estado atual |
|---------|--------------|
| **Tema** | Claro: `min-h-screen bg-gray-50`; cards `bg-white rounded-xl border border-gray-200` |
| **Header** | `text-gray-900`, `text-gray-600`; botão "← Voltar" `bg-blue-600` |
| **Bloco PIX criado** | Badge "Pendente" fixo; sem atualização para "Aprovado"; ID do pagamento em destaque |
| **Recarregar Saldo** | Cards brancos; presets [1,5,10,25,50,100]; valorRecarga inicial **200** |
| **Instruções** | "Como funciona o PIX" em bloco azul claro (bg-blue-50) |
| **CTA pós-PIX** | Nenhum "Jogar agora" ou "Voltar ao jogo"; apenas "← Voltar" no header |
| **Toast** | toast.success('Pagamento PIX criado com sucesso!') chamado mas ToastContainer ausente no App |

**Conclusão:** Redesign da página Pagamentos **não aplicado**; tema claro, aparência administrativa e ausência de CTA de retorno ao jogo permanecem.

---

## 6. Padronização de botões

### 6.1 Padrão desejado (documentação oficial)

| Botão | Hierarquia | Uso | Tamanho / Estados |
|-------|------------|-----|-------------------|
| **Jogar** | Primário (quando saldo > 0) | Dashboard, pós-depósito | Destacado; hover scale/brilho |
| **Depositar** | Primário (quando saldo = 0) | Dashboard | Mesmo destaque que Jogar quando for a ação principal |
| **Recarregar** | Primário (no jogo) | GameShoot header | Verde; destaque extra quando saldo insuficiente (ring + pulse) |
| **Sacar** | Secundário | Dashboard, Withdraw | Estilo consistente com outros secundários |
| **Voltar** | Secundário / terciário | Pagamentos, Withdraw, Profile | Menor destaque; não competir com CTA principal |
| **Jogar agora** | Primário (em Pagamentos) | Após criar PIX ou quando PIX aprovado | Destacado; conduz ao /game |

- **Estados:** hover (scale-105 ou bg mais claro), disabled (opacity-50, cursor-not-allowed), loading (texto "Criando...", "Processando..." com spinner se necessário).
- **Consistência:** Mesma família de classes (ex.: rounded-lg, py-2/3, px-4/6) entre telas; primário em verde ou amarelo/dourado; secundário em branco/10 ou outline.

### 6.2 Estado atual (auditoria)

| Local | Botões | Observação |
|-------|--------|------------|
| **Dashboard** | Jogar, Depositar, Sacar, Perfil — todos `bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6`; mesmo peso visual | Sem hierarquia por estado (saldo zero) |
| **GameShoot** | "Recarregar" `bg-green-600`; "Dashboard" `bg-blue-600`; "Áudio ON/OFF" verde/cinza | Recarregar recebe ring+pulse em INSUFFICIENT_BALANCE |
| **Pagamentos** | "← Voltar" `bg-blue-600`; "Recarregar R$ X" `bg-green-600`; "Copiar Código PIX" verde | Sem CTA "Jogar agora" |
| **Withdraw** | Estilo glassmorphism no conteúdo; botão enviar verde | Consistente com tema escuro |

**Conclusão:** Não há documento único de padrão; há variação (azul vs verde, tamanhos). A decisão de padronização deve ser implementada de forma unificada.

---

## 7. Comportamento pós-chute

### 7.1 Especificação oficial

- **Não** usar botão grande "Chutar novamente".
- Mostrar texto **discreto**: "Tente novamente".
- **Destacar novamente as zonas de chute** (reforço visual de que pode clicar em outra zona).
- Fluxo: resultado (overlay) → após ~3 s → overlay some → zonas reativadas + texto "Tente novamente" → jogador escolhe nova zona.

### 7.2 Estado atual (auditoria GameShoot.jsx)

| Comportamento | Implementado? | Detalhe |
|---------------|---------------|---------|
| Overlay de resultado (GOOOL / DEFENDEU / GOL DE OURO) | ✅ | animate-bounce / animate-pulse; ~3 s |
| Reset após 3 s (resetAnimations) | ✅ | setShooting(false); overlays false; zonas habilitadas |
| Botão grande "Chutar novamente" | ✅ Não existe | Conforme decisão |
| Texto "Tente novamente" na tela | ❌ | Apenas no toast `toast.info('🥅 Defesa! Tente novamente.')`; ToastContainer ausente, então usuário não vê |
| Destaque das zonas pós-resultado | ⚠️ Parcial | Zonas voltam ao estilo normal (amarelo, hover:scale-110); não há animação ou label "Tente novamente" próximo ao campo |

**Conclusão:** A decisão de não usar botão grande está respeitada. Faltam: (1) texto discreto "Tente novamente" visível na página (não só no toast) e (2) reforço visual opcional das zonas (ex.: breve destaque ou legenda) após o reset.

---

## 8. Auditoria atual da página /game

### 8.1 Componente e estrutura

- **Arquivo:** `goldeouro-player/src/pages/GameShoot.jsx`
- **Layout:** Navigation (sidebar) + área de conteúdo com `ml-64`/`ml-16`; fundo `bg-gradient-to-br from-gray-900 to-slate-900`.

### 8.2 Destaque das zonas

- **Zonas:** Cinco botões (TL, TR, C, BL, BR) com posições em % no campo.
- **Habilitado:** `bg-yellow-400 border-yellow-300 hover:bg-yellow-300 hover:scale-110 cursor-pointer`.
- **Desabilitado:** `shooting || balance < currentBet` → `bg-gray-500 border-gray-400 cursor-not-allowed`.
- **Conclusão:** Destaque das zonas existe (amarelo, hover scale); após resultado as zonas apenas voltam a ficar clicáveis, sem texto "Tente novamente" na UI nem animação extra de destaque.

### 8.3 Animações

- Bola: transição de posição em ~500 ms (transition-all duration-500 ease-out).
- Goleiro: transition-all duration-300 para posição/rotação.
- Resultado: overlays com animate-bounce (GOOOL, DEFENDEU) ou animate-pulse (GOL DE OURO); exibidos por ~3 s.
- **Conclusão:** Animações presentes e adequadas para a demo.

### 8.4 Feedback visual

- **Saldo:** Header com "Saldo" e `R$ {balance.toFixed(2)}` em amarelo.
- **Valor do chute:** Card "R$ 1,00" e texto do lote.
- **Resultado:** Overlays GOOOL / DEFENDEU / GOL DE OURO; toasts de prêmio/defesa **não aparecem** (ToastContainer ausente).
- **Recarregar:** Botão com ring+pulse por 3 s após INSUFFICIENT_BALANCE.
- **Conclusão:** Feedback visual do resultado é forte pelos overlays; feedback por toast está implementado no código mas não visível.

### 8.5 Estado pós-chute

- Após 950 ms do chute, overlays e estatísticas atualizam; após mais 3 s, `resetAnimations()` é chamado.
- Zonas ficam clicáveis de novo; não há mensagem "Tente novamente" na tela nem CTA adicional.
- **Conclusão:** Estado pós-chute funcional; falta apenas o texto discreto "Tente novamente" e, se desejado, reforço visual das zonas conforme decisão oficial.

---

## 9. Status atualizado dos BLOCOS A–G

### BLOCO A — Financeiro

| Item | Status | Observação |
|------|--------|------------|
| Depósito PIX (criar, copiar, instruções) | ✅ | Pagamentos.jsx; valor padrão 200; tema claro |
| Confirmação PIX aprovado na UI | ❌ | Sem polling; badge sempre "Pendente" no bloco ativo |
| Saque (formulário, histórico, taxa) | ✅ | Withdraw.jsx; saldo do profile |
| Saldo (fonte única) | ✅ | GET /api/user/profile em todas as telas principais |

### BLOCO B — Sistema de apostas

| Item | Status | Observação |
|------|--------|------------|
| Chute R$ 1, lotes 10 chutes, gol no 10º | ✅ | gameService + backend |
| Gol de Ouro (R$ 100 a cada 1000 chutes) | ✅ | Contador e overlays |
| Prêmio e débito no backend | ✅ | Ledger e saldo atualizados |

### BLOCO C — Conta do usuário

| Item | Status | Observação |
|------|--------|------------|
| Cadastro, Login, Logout | ✅ | Register, Login, handleLogout (local) |
| Recuperação e redefinição de senha | ✅ | ForgotPassword, ResetPassword |
| Verificação de e-mail (UI) | ⚠️ | Backend existe; sem tela dedicada no player |

### BLOCO D — Sistema de saldo

| Item | Status | Observação |
|------|--------|------------|
| Ledger e backend | ✅ | Conforme auditorias |
| Saldo exibido (Dashboard, GameShoot, Withdraw, Profile) | ✅ | Mesma origem (profile) |
| Sidebar (saldo fixo) | ❌ | Valor "R$ 150,00" fixo; decisão é remover sidebar |

### BLOCO E — Gameplay

| Item | Status | Observação |
|------|--------|------------|
| Animação bola/goleiro, overlays resultado | ✅ | 950 ms + 3 s reset |
| Zonas clicáveis, estados disabled | ✅ | balance < currentBet |
| Texto "Tente novamente" na tela | ❌ | Só no toast (não exibido) |
| Destaque das zonas pós-resultado | ⚠️ | Zonas reativadas sem copy nem reforço visual |

### BLOCO F — Interface

| Item | Status | Observação |
|------|--------|------------|
| Glassmorphism (Dashboard, GameShoot, Withdraw, Profile) | ✅ | Tema escuro consistente |
| Pagamentos tema dark / glassmorphism | ❌ | Ainda tema claro |
| ToastContainer | ❌ | Não renderizado no App |
| Sidebar | ⚠️ | Presente; decisão é remover |
| Padrão único de botões | ❌ | Não documentado nem unificado |

### BLOCO G — Fluxo do jogador

| Item | Status | Observação |
|------|--------|------------|
| Dashboard como hub | ✅ | Grid Jogar, Depositar, Sacar, Perfil |
| Navegação sem sidebar | ❌ | Ainda com sidebar |
| CTA "Jogar agora" em Pagamentos | ❌ | Não existe |
| Confirmação PIX + retorno ao jogo | ❌ | Sem confirmação; sem CTA |
| Copy saldo = 0 no Dashboard | ❌ | Sem copy explicativa; sem destaque para Depositar |
| Continuidade pós-chute (texto discreto) | ❌ | Sem "Tente novamente" visível na tela |

---

## 10. Classificação final da demo

### Critérios considerados

- **Decisões oficiais:** Remoção da sidebar, redesign Pagamentos (dark, glassmorphism, CTA "Jogar agora"), padronização de botões, comportamento pós-chute ("Tente novamente" discreto + zonas destacadas), melhorias V1 (confirmação PIX, ToastContainer, copy saldo zero).
- **Estado atual:** Sidebar presente; Pagamentos em tema claro; sem ToastContainer; sem CTA "Jogar agora"; sem texto "Tente novamente" na tela do jogo; sem copy para saldo zero no Dashboard; valor padrão PIX 200.

### Resumo executivo

- O **núcleo** da demo está funcional: auth, depósito PIX (criar/copiar), jogo (chute, resultado, saldo), saque, mesma fonte de saldo nas telas principais.
- Nenhuma das **decisões estratégicas de UX** (sidebar, redesign Pagamentos, CTA pós-depósito, texto pós-chute, ToastContainer, copy e hierarquia no Dashboard) foi ainda aplicada no código.
- A **especificação V2** define o alvo (blueprint, navegação, Pagamentos, botões, pós-chute); a **implementação** está atrás desse alvo.

---

## STATUS DA DEMO

**DEMO PRECISA AJUSTES**

- **Motivo:** As decisões estratégicas da demo (remoção da sidebar, redesign da página Pagamentos, CTA "Jogar agora", comportamento pós-chute com "Tente novamente" visível, ToastContainer, padronização de botões e copy/hierarquia no Dashboard) não estão refletidas no código. O produto funciona de ponta a ponta (cadastro, login, depósito, jogo, saque), mas a experiência não está alinhada à especificação executiva V2 nem à classificação "DEMO PRONTA".
- **Para evoluir para DEMO QUASE PRONTA:** Aplicar pelo menos: ToastContainer, CTA "Jogar agora" em Pagamentos, texto "Tente novamente" na tela do jogo (pós-resultado), e copy + destaque para Depositar quando saldo = 0 no Dashboard.
- **Para evoluir para DEMO PRONTA:** Além disso, aplicar redesign da navegação (sem sidebar), redesign da página Pagamentos (tema dark, glassmorphism, confirmação de PIX aprovado), padronização de botões e valor padrão de recarga alinhado ao uso.

---

*Documento gerado em modo read-only. Nenhuma alteração de código, rotas, backend ou banco de dados foi realizada.*
