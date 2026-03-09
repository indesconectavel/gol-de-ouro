# ESPECIFICAÇÃO EXECUTIVA — DEMO V1 GOL DE OURO

**Projeto:** Gol de Ouro — Web Player  
**Versão do documento:** 1.0  
**Data:** 2026-03-08  
**Modo de elaboração:** READ-ONLY ABSOLUTO (análise e documentação; nenhuma alteração de código)

**Escopo:** Frontend `goldeouro-player/src` (React, Tailwind, Axios, Supabase Auth, Node backend). Consolidação das auditorias de 2026-03-08 e verificação do estado atual para a Demo V1.

---

## 1. Arquitetura atual

### 1.1 Stack e estrutura

| Camada | Tecnologia / Origem |
|--------|----------------------|
| Frontend | React, React Router, Tailwind CSS, Axios, react-toastify |
| Auth (UI) | AuthContext (token em localStorage), Login, Register, ForgotPassword, ResetPassword |
| API | apiClient (baseURL via VITE_BACKEND_URL), API_ENDPOINTS em `config/api.js` |
| Backend | Node (server-fly.js), JWT 24h, rotas `/api/auth/*`, `/api/user/profile`, `/api/payments/pix/*`, `/api/games/shoot`, `/api/withdraw/*` |
| Saldo | Única fonte: `GET /api/user/profile` → `data.saldo` (Dashboard, GameShoot, Withdraw, Profile) |

### 1.2 Blocos no sistema

| Bloco | Descrição | Componentes / Serviços principais |
|-------|-----------|-----------------------------------|
| **A — Financeiro** | Depósito PIX, saque, saldo | Pagamentos.jsx, Withdraw.jsx, paymentService.js, withdrawService.js, backend PIX e withdraw |
| **B — Sistema de apostas** | Lógica de chutes, lotes, prêmio | gameService.js, backend /api/games/shoot, lotes (10 chutes, gol no 10º), Gol de Ouro (R$ 100 a cada 1000 chutes) |
| **C — Conta do usuário** | Cadastro, login, recuperação, e-mails | Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, AuthContext, backend /api/auth/* |
| **D — Sistema de saldo** | Ledger, saldo exibido, atualização | Backend: ledger, triggers; Frontend: profile em Dashboard, GameShoot, Withdraw, Profile; sidebar com valor fixo (inconsistente) |
| **E — Gameplay** | Animação, chute, goleiro, resultado | GameShoot.jsx, overlays GOOOL/DEFENDEU/GOL DE OURO, animação ~950 ms, reset em 3 s |
| **F — Interface** | Layout, cores, botões, feedback | Navigation, glassmorphism (Dashboard, GameShoot, Withdraw, Profile), tema claro apenas em Pagamentos |
| **G — Fluxo do jogador** | Jornada e micro-loop | Dashboard → Depositar/Jogar → Pagamentos → GameShoot → chute → resultado → repetir; sem CTAs explícitos de retorno |

### 1.3 Rotas e navegação

- **Públicas:** `/`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/download`
- **Protegidas:** `/dashboard`, `/game` e `/gameshoot` (ambas GameShoot), `/profile`, `/withdraw`, `/pagamentos`
- **Sidebar:** Dashboard, Jogar, Perfil, Saque. Não há link para Depositar/Pagamentos (acesso só pelo Dashboard).

---

## 2. Blueprint do micro-loop

### 2.1 Loop ideal (referência)

```
PIX aprovado
    ↓
saldo creditado
    ↓
Jogar agora
    ↓
chute
    ↓
resultado
    ↓
chutar novamente
    ↓
loop contínuo
```

### 2.2 Onde o sistema atual está alinhado

- **Saldo creditado (backend):** Webhook/reconciler credita saldo e ledger; fonte única é o perfil.
- **Chute → resultado:** GameShoot processa chute, exibe overlay (GOOOL / DEFENDEU / GOL DE OURO), atualiza saldo no header e estatísticas; feedback visual suficiente.
- **Chutar novamente (técnico):** Após 3 s, `resetAnimations()` libera as zonas; o jogador pode clicar em outra zona na mesma tela. O ciclo chute → resultado → próximo chute funciona na mesma página.

### 2.3 Onde o sistema diverge do blueprint

1. **PIX aprovado:** Na tela Pagamentos não há confirmação em tempo real (sem polling/websocket). O bloco do pagamento criado permanece com badge "Pendente"; aprovação só aparece no histórico ao recarregar ou reentrar.
2. **Saldo creditado (feedback):** Não há mensagem "Saldo atualizado" ou "Pagamento aprovado!" na tela de Pagamentos. O usuário só vê o novo saldo ao ir ao Dashboard ou ao GameShoot (que refazem fetch do perfil).
3. **Jogar agora:** Não existe CTA "Jogar agora" ou "Voltar ao jogo" em Pagamentos. Apenas "← Voltar" para o Dashboard; o jogador deve escolher "Jogar" no Dashboard ou no menu.
4. **Chutar novamente (UX):** Não há CTA "Chutar novamente" nem copy de continuidade; apenas a liberação dos botões após 3 s. A continuidade é implícita.

---

## 3. Divergências encontradas

### 3.1 Confirmação de depósito

| Verificação | Resultado |
|-------------|-----------|
| Existe confirmação clara de PIX aprovado na tela? | **Não.** Sem polling nem atualização em tempo real do bloco "Pagamento PIX Criado"; badge permanece "Pendente". |
| Saldo aparece atualizado imediatamente na tela de Pagamentos? | **Não.** Saldo não é exibido em Pagamentos; atualização só em Dashboard/GameShoot ao navegar. |
| Existe CTA para jogar após depósito? | **Não.** Nenhum botão "Jogar agora" ou "Voltar ao jogo" em Pagamentos. |

### 3.2 Retorno ao jogo

| Verificação | Resultado |
|-------------|-----------|
| Botão "Jogar agora"? | **Não.** |
| Botão "Voltar ao jogo"? | **Não.** |
| Navegação implícita? | **Sim.** Usuário pode usar "← Voltar" e depois Dashboard → Jogar ou menu → Jogar. Recondução não é explícita. |

### 3.3 Transição entre chutes

| Verificação | Resultado |
|-------------|-----------|
| CTA explícito pós-resultado? | **Não.** Nenhum "Chutar novamente" ou "Próximo chute". |
| Copy de continuidade? | **Não.** |
| Dependência da iniciativa do jogador? | **Sim.** Após 3 s as zonas ficam clicáveis; o jogador precisa inferir que pode chutar de novo. |

### 3.4 Outras divergências

- **ToastContainer ausente:** `react-toastify` é usado (GameShoot, Pagamentos) mas `<ToastContainer />` não está em App.jsx/main.jsx; toasts de sucesso/erro não aparecem.
- **Saldo na sidebar:** Navigation.jsx exibe valor fixo "R$ 150,00" no rodapé; não reflete saldo real; gera inconsistência com Dashboard, GameShoot e Withdraw.
- **Tema em Pagamentos:** Única tela em tema claro (bg-gray-50, cards brancos); quebra a unidade visual com o restante do app (escuro, glassmorphism).
- **Valor padrão PIX:** Estado inicial R$ 200 com presets [1, 5, 10, 25, 50, 100]; usuário pode gerar PIX de R$ 200 sem perceber.

---

## 4. Melhorias obrigatórias

Itens mínimos para uma demo profissional:

| # | Melhoria | Bloco | Justificativa |
|---|----------|--------|----------------|
| 1 | Confirmação de PIX aprovado (polling ou mensagem quando aprovado) na tela Pagamentos | A, G | Fecha a lacuna "paguei — caiu?" e reduz abandono pós-pagamento. |
| 2 | CTA "Jogar agora" ou "Voltar ao jogo" na tela Pagamentos (após criar PIX ou quando pagamento aprovado) | G, F | Recondução explícita do depósito ao jogo. |
| 3 | Renderizar `<ToastContainer />` no App para toasts de sucesso/erro (jogo e Pagamentos) | F | Feedback de "PIX criado", "Saldo insuficiente", "GOL!" etc. |
| 4 | Corrigir saldo na sidebar: usar saldo real (perfil/contexto) ou remover valor fixo "R$ 150,00" | D, F | Consistência e confiança. |
| 5 | CTA ou copy pós-resultado do chute ("Chutar novamente" ou "Clique em uma zona para o próximo chute") | E, G | Reduz hesitação e reforça o loop. |
| 6 | Copy explicativa no Dashboard quando saldo = 0 (ex.: "Cada chute custa R$ 1,00 — recarregue para jogar") e destaque para "Depositar" | G, F | Orienta primeiro uso e reduz descoberta tardia no jogo. |

---

## 5. Melhorias recomendadas

| # | Melhoria | Bloco | Benefício |
|---|----------|--------|-----------|
| 1 | Unificar tema visual em Pagamentos (fundo escuro, glassmorphism) com o resto do app | F | Continuidade e sensação de um único produto. |
| 2 | Valor padrão de recarga alinhado ao uso (ex.: R$ 10 ou R$ 20 em vez de R$ 200) | A, F | Menor risco de susto e desistência. |
| 3 | Onboarding inicial (uma tela ou modal: "R$ 1 por chute, gol no 10º do lote, Gol de Ouro R$ 100") | G | Compreensão antecipada das regras. |
| 4 | Destaque ou reordenação no Dashboard quando saldo = 0 (Depositar como CTA primário) | G, F | Alinha primeira decisão ao fluxo esperado. |
| 5 | Mensagem pós-pagamento: "Quando seu saldo atualizar, clique aqui para jogar" com link para /game | G | Reduz abandono após pagar no banco. |
| 6 | Loading inicial consistente no Dashboard e em Pagamentos (evitar exibir 0 / "Carregando..." sem spinner) | F | Percepção de solidez. |

---

## 6. Verificação "Adicione saldo para chutar"

### 6.1 Onde a mensagem é exibida

- **Texto exato no código:** "Você está sem saldo. **Adicione saldo para jogar.**" (não "para chutar").
- **Arquivo:** `goldeouro-player/src/services/gameService.js` (linhas 133–136).
- **Condição:** No `catch` de `processShot`, quando o backend retorna `message === 'Saldo insuficiente'`; a mensagem é substituída pela frase amigável e o retorno inclui `code: 'INSUFFICIENT_BALANCE'`.

### 6.2 Em qual componente e condição

- **Componente:** GameShoot.jsx.
- **Condição:** Após tentativa de chute com saldo insuficiente (bloqueio local `balance < currentBet` ou resposta 400 do backend). O `result` do gameService retorna `success: false` e `error: { code: 'INSUFFICIENT_BALANCE', message }`.
- **Uso:** `toast.error(message)` (linha 255) e ativação de `highlightRecharge` por 3 s no botão "Recarregar" (linhas 256–261).

### 6.3 Bloqueio do chute e CTA para recarregar

| Verificação | Resultado |
|-------------|-----------|
| A mensagem bloqueia o chute? | **Sim.** Zonas desabilitadas quando `balance < currentBet` (currentBet = 1). Se o usuário de alguma forma disparar o chute, o backend retorna 400 e o frontend exibe a mensagem. |
| Existe botão/CTA para recarregar? | **Sim.** Botão "💳 Recarregar" no header do GameShoot, levando a `/pagamentos`; com saldo insuficiente recebe destaque (ring + pulse) por 3 s após o erro INSUFFICIENT_BALANCE. |
| Toasts aparecem? | **Não.** ToastContainer ausente; a mensagem é chamada via `toast.error(message)` mas não é exibida. Overlays do jogo (GOOOL, DEFENDEU) também usam toast e não aparecem; apenas os overlays visuais funcionam. |

### 6.4 Avaliação da implementação

- **Lógica:** Correta: bloqueio por saldo, mensagem amigável, código INSUFFICIENT_BALANCE e destaque no "Recarregar".
- **Problema:** O usuário não vê o texto no toast; só percebe o destaque no botão "Recarregar" e as zonas desabilitadas. Para a demo, é desejável que a mensagem apareça (via ToastContainer ou mensagem inline).

---

## 7. Estado do BLOCO C (conta do usuário)

### 7.1 Funcionalidades presentes

| Funcionalidade | Estado | Observação |
|----------------|--------|------------|
| **Cadastro** | ✅ Implementado | Register.jsx, POST /api/auth/register, termos, validação de senha. |
| **Login** | ✅ Implementado | Login.jsx, AuthContext, token em localStorage, redirect para /dashboard. |
| **Logout** | ✅ Implementado | Navigation e Dashboard: handleLogout remove token/user e navega para `/`. POST /auth/logout não existe no backend (404); logout é apenas local. Seguro para V1. |
| **Recuperação de senha** | ✅ Implementado | ForgotPassword.jsx: envia email via POST /api/auth/forgot-password; tela "Email Enviado!" e link "Voltar ao Login". |
| **Redefinição de senha** | ✅ Implementado | ResetPassword.jsx: lê token da query; POST /api/auth/reset-password com token e newPassword; sucesso e redirect para `/` em 3 s. |
| **Verificação de e-mail** | ⚠️ Backend existe, frontend não | Backend expõe /api/auth/verify-email; não há página dedicada no player para o link de verificação no e-mail (fluxo não guiado na UI). |

### 7.2 Páginas e fluxos

- **Recuperação:** Página ForgotPassword com formulário de e-mail, feedback "Email Enviado!" e link para login. Fluxo completo de "esqueci minha senha" até envio está adequado para demo.
- **Redefinição:** Página ResetPassword com token em query, campos nova senha e confirmação, validações e redirect após sucesso. Adequado para demo.
- **E-mails:** Envio depende do backend (forgot-password, reset-password). Não foi analisado provedor de e-mail; assume-se que o backend está configurado para envio.

### 7.3 UX para demo

- Login e Register seguem o mesmo padrão visual (fundo gradiente, glassmorphism).
- ForgotPassword e ResetPassword usam o mesmo estilo e mensagens claras em português.
- Para demo profissional, o BLOCO C está suficiente; a verificação de e-mail pode permanecer apenas no backend até haver tela específica.

---

## 8. Fluxo final esperado da demo

### 8.1 Jornada completa (referência)

```
Cadastro
    ↓
Login
    ↓
Dashboard
    ↓
Depósito PIX
    ↓
Saldo creditado (com confirmação na UI)
    ↓
Primeiro chute (CTA "Jogar agora" ou navegação clara)
    ↓
Resultado (overlay + feedback de prêmio visível)
    ↓
Segundo chute (CTA ou copy "Chutar novamente")
    ↓
Saque (opcional)
```

### 8.2 Avaliação do estado atual

| Etapa | Clareza | Fricção | Ponto de abandono |
|-------|---------|---------|--------------------|
| Cadastro → Login | ✅ Boa | Baixa | — |
| Login → Dashboard | ✅ Boa | Baixa | — |
| Dashboard (saldo 0) | ⚠️ Média | Média | Não explica custo nem destaca Depositar; usuário tende a clicar em Jogar. |
| Dashboard → Depósito | ✅ Ok | Baixa | — |
| Pagamentos (criar PIX) | ✅ Ok | Média | Valor padrão R$ 200; toast de sucesso não aparece. |
| Pós-PIX (aguardar / voltar) | ❌ Fraca | Alta | Sem confirmação de "Aprovado"; sem CTA "Jogar agora"; dúvida "caiu?". |
| Depósito → Jogo | ⚠️ Implícita | Média | Usuário deve voltar e clicar em Jogar. |
| Primeiro chute | ✅ Boa | Baixa | Custo e saldo visíveis no GameShoot. |
| Resultado | ✅ Boa | Baixa | Overlays funcionam; toasts de prêmio não aparecem. |
| Segundo chute | ⚠️ Implícita | Baixa | Sem CTA; usuário descobre que pode clicar de novo. |
| Saque | ✅ Boa | Baixa | Transparência de valor, taxa e prazo. |

### 8.3 Consistência de saldo

| Local | Origem dos dados | Observação |
|-------|-------------------|------------|
| Dashboard | GET /api/user/profile → saldo | ✅ Correto. |
| GameShoot | gameService.initialize() → profile → saldo | ✅ Correto. |
| Withdraw | GET /api/user/profile → saldo | ✅ Correto. |
| Profile | GET /api/user/profile → saldo | ✅ Correto. |
| Sidebar (Navigation) | Valor fixo "R$ 150,00" | ❌ Não usa API; risco de saldo inconsistente e desconfiança. |

Conclusão: mesma origem de dados (perfil) em todas as telas principais; exceção é a sidebar, que deve ser corrigida.

### 8.4 Estado final desejado (resumo)

Para a demo V1 ficar **pronta** do ponto de vista executivo:

1. **Confirmação de depósito:** Feedback na tela Pagamentos quando o PIX for aprovado (ou mensagem orientando "Quando aprovar, seu saldo será atualizado no Dashboard/Jogo").
2. **Recondução ao jogo:** CTA "Jogar agora" ou "Voltar ao jogo" em Pagamentos.
3. **Toasts visíveis:** Inclusão de ToastContainer para sucesso/erro no jogo e em Pagamentos.
4. **Saldo na sidebar:** Exibir saldo real ou remover o valor fixo.
5. **Continuidade pós-chute:** CTA ou copy "Chutar novamente" / "Próximo chute".
6. **Dashboard com saldo zero:** Copy explicativa (R$ 1 por chute) e destaque para Depositar.

---

## CLASSIFICAÇÃO FINAL

**DEMO QUASE PRONTA**

- **O que está pronto:** Cadastro, login, logout, recuperação e redefinição de senha; fluxo de depósito PIX (criar, copiar, instruções); jogo com valor R$ 1, chutes, lotes, Gol de Ouro, overlays e atualização de saldo; saque com formulário e histórico; mesma fonte de saldo (perfil) nas telas principais; mensagem "Adicione saldo para jogar" e botão Recarregar com destaque quando saldo insuficiente.
- **O que falta para "DEMO PRONTA":** Confirmação clara de PIX aprovado na UI, CTA "Jogar agora" pós-depósito, exibição de toasts (ToastContainer), saldo correto na sidebar, CTA/copy pós-resultado para próximo chute e tratamento de saldo zero no Dashboard (copy + hierarquia de CTA). Sem esses ajustes, há risco de abandono e percepção de produto incompleto em pontos críticos do loop de monetização.
- **Não se classifica como "DEMO NECESSITA AJUSTES CRÍTICOS"** porque o núcleo (auth, depósito, jogo, saque, ledger/saldo no backend) está funcional e a jornada é completável; as falhas são sobretudo de UX, recondução e feedback visual, não de quebra de fluxo técnico.

---

*Documento gerado em modo read-only. Nenhuma alteração de código, rotas, backend ou banco de dados foi realizada.*
