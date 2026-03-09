# Auditoria visual da branch espelho — ez1oc96t1

**Data:** 2026-03-08  
**Branch auditada:** `production-mirror/ez1oc96t1`  
**Commit:** 7c8cf59 (Merge PR #30 — hotfix/ledger-userid-fallback)  
**Modo:** READ-ONLY (nenhuma alteração de código, produção ou recurso remoto)

---

## 1. Objetivo

Validar visual e funcionalmente se a branch local `production-mirror/ez1oc96t1` reproduz corretamente a produção atual (deploy ez1oc96t1), nas áreas principais do frontend, para que a equipe possa usá-la como referência exata da produção.

---

## 2. Contexto da branch

| Item | Valor |
|------|--------|
| **Branch atual** | `production-mirror/ez1oc96t1` |
| **HEAD** | `7c8cf59bd7655cdf553cf54b541cd3900b9274ce` |
| **Status git** | Apenas arquivos untracked (??); nenhum arquivo tracked modificado |
| **Commit da branch espelho** | 7c8cf59 |

**Respostas Etapa 1:**
- **Estamos realmente na branch espelho?** Sim.
- **O HEAD é 7c8cf59?** Sim.
- **O working tree está adequado para validação?** Sim (código versionado idêntico ao commit de produção; untracked não afetam o build do player).

---

## 3. Inicialização local

| Item | Valor |
|------|--------|
| **Comando utilizado** | `npm run dev` (script `vite` no goldeouro-player) |
| **Porta local** | 5178 (Vite tentou 5173–5177, em uso; abriu em 5178) |
| **Resultado** | Aplicação iniciou com sucesso |
| **Mensagem no terminal** | `VITE v5.4.20 ready in 2525 ms` → `Local: http://localhost:5178/` |
| **Erro relevante** | Nenhum |
| **Warning relevante** | `[baseline-browser-mapping] The data in this module is over two months old...` (não crítico para validação) |

---

## 4. Validação por tela

Validação baseada em **inspeção de código** da branch espelho (commit 7c8cf59). Validação visual direta no navegador **não foi executada pelo agente**; itens que dependem de inspeção manual são marcados como **NÃO CONFIRMADO**.

### 4.1 Login (/)

| Item | Código na branch espelho | Validação visual |
|------|---------------------------|------------------|
| Rota | `/` → `<Login />` | COINCIDE com doc |
| Logo | `<Logo size="xlarge" />` em Login.jsx | NÃO CONFIRMADO |
| Background | `Gol_de_Ouro_Bg01.jpg` + gradient, overlay | NÃO CONFIRMADO |
| Formulário | email, password, remember me, botão entrar | NÃO CONFIRMADO |
| Banner | `<VersionBanner showTime={true} />` na página; `<VersionWarning />` em App.jsx | NÃO CONFIRMADO |
| Links | Registrar, Esqueci a senha (presentes no código) | NÃO CONFIRMADO |
| Coerência visual | Tailwind, glassmorphism, tema escuro | NÃO CONFIRMADO |

### 4.2 Register

| Item | Código na branch espelho | Validação visual |
|------|---------------------------|------------------|
| Rota | `/register` → `<Register />` | COINCIDE |
| Estrutura | Formulário registro, termos | NÃO CONFIRMADO |
| Banner | VersionWarning global em App | NÃO CONFIRMADO |
| Coerência com login | Mesmo tema (AuthContext, api) | NÃO CONFIRMADO |

### 4.3 Forgot Password / Reset Password

| Item | Código na branch espelho | Validação visual |
|------|---------------------------|------------------|
| Rotas | `/forgot-password`, `/reset-password` | COINCIDE |
| ForgotPassword | VersionBanner, Link retorno, apiClient FORGOT_PASSWORD | NÃO CONFIRMADO |
| ResetPassword | Página presente em App.jsx | NÃO CONFIRMADO |

### 4.4 Dashboard

| Item | Código na branch espelho | Validação visual |
|------|---------------------------|------------------|
| Rota | `/dashboard` protegida, `<Dashboard />` | COINCIDE |
| Layout | ProtectedRoute, sidebar (Navigation) | NÃO CONFIRMADO |
| Saldo | API PROFILE → saldo (conforme Bloco F) | NÃO CONFIRMADO |
| Banner/warnings | VersionWarning em App | NÃO CONFIRMADO |
| Navegação | Sidebar com Dashboard, Jogar, Perfil, Saque | NÃO CONFIRMADO |

### 4.5 Game (/game)

| Item | Código na branch espelho | Validação visual |
|------|---------------------------|------------------|
| Rota | `/game` e `/gameshoot` → `<GameShoot />` protegido | COINCIDE |
| Tela montada | GameShoot importado e usado | COINCIDE |
| Header, saldo, botões aposta, cenário, goleiro, bola, zonas | Presentes em GameShoot/GameField (código) | NÃO CONFIRMADO |
| Áudio, navegação | Hooks e componentes no código | NÃO CONFIRMADO |

### 4.6 Profile / Pagamentos / Withdraw

| Tela | Rota | Código | Validação visual |
|------|------|--------|------------------|
| Profile | `/profile` | ProtectedRoute, Profile.jsx | NÃO CONFIRMADO |
| Pagamentos | `/pagamentos` | ProtectedRoute, Pagamentos.jsx, toast usado | NÃO CONFIRMADO |
| Withdraw | `/withdraw` | ProtectedRoute, Withdraw.jsx | NÃO CONFIRMADO |

---

## 5. Validação funcional básica

Comportamento **esperado pelo código** (não testado em browser pelo agente):

| Item | Código na branch espelho | Documentação produção |
|------|---------------------------|------------------------|
| Navegação entre páginas | React Router, Routes e Links | COINCIDE |
| Redirects de auth | ProtectedRoute redireciona para login | COINCIDE (Bloco F) |
| Rota protegida sem login | ProtectedRoute → verificação token/sessão | COINCIDE |
| Login/logout | AuthContext login; Navigation handleLogout → navigate('/') | COINCIDE |
| Carregamento de sessão | AuthContext, token em localStorage | COINCIDE |
| Acesso dashboard/game | Via ProtectedRoute | COINCIDE |
| Saldo na sidebar | **Valor fixo "R$ 150,00"** em Navigation.jsx (linha 150) | COINCIDE (Bloco F documenta isso) |
| Toasts | `toast` usado em GameShoot e Pagamentos; **ToastContainer não está em App.jsx nem main.jsx** | COINCIDE (Bloco F: toasts não aparecem por falta de ToastContainer) |
| Banner verde / VersionWarning | `<VersionWarning />` em App.jsx; VersionBanner em Login/ForgotPassword | COINCIDE (produção documenta banner de versão/avisos) |

**Resposta:** O comportamento local, inferido pelo código, corresponde ao que já foi documentado para a produção atual (Bloco F, COMMIT-PRODUCAO-REAL). Não foi identificada divergência de código. Divergência visual ou de runtime não foi confirmada (inspeção no navegador não realizada pelo agente).

---

## 6. Comparação com produção atual documentada

Referências: COMMIT-PRODUCAO-REAL.md, AUDITORIA-BLOCO-F-INTERFACE-2026-03-08.md, AUDITORIA-FINAL-GAME-PRODUCAO-READONLY-2026-03-06.md, DIAGNOSTICO-ESPELHO-LOCAL-REAL-2026-03-08.md.

| Área | Branch espelho local (código) | Produção atual documentada | Status |
|------|------------------------------|----------------------------|--------|
| Commit / deploy | 7c8cf59 | ez1oc96t1 = 7c8cf59 | COINCIDE |
| Rota / (login) | Login | Login | COINCIDE |
| Rotas protegidas | /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos | Mesmas rotas | COINCIDE |
| VersionWarning / banner | Presente em App.jsx | Documentado (avisos de versão) | COINCIDE |
| ToastContainer | Ausente (App.jsx, main.jsx) | Bloco F: toasts não exibidos | COINCIDE |
| Saldo na sidebar | Fixo "R$ 150,00" | Bloco F: valor fixo, desatualizado | COINCIDE |
| Logout | navigate('/') | Documentado | COINCIDE |
| /game | GameShoot, ProtectedRoute | Produção preservada, mesmo comportamento | COINCIDE |
| Fonte do saldo (telas) | API /api/user/profile (PROFILE) | Bloco F: mesma fonte | COINCIDE |

Nenhum item analisado **divergiu** da documentação de produção. Itens não verificados no browser constam como **NÃO CONFIRMADO** na seção 4.

---

## 7. Divergências encontradas

- **Nenhuma divergência de código** entre a branch espelho (7c8cf59) e a produção documentada (ez1oc96t1).
- **Não foi realizada** validação visual/funcional no navegador pelo agente; portanto, eventuais diferenças de renderização, CSS ou comportamento em tempo de execução **não foram confirmadas nem descartadas**.

---

## 8. Conclusão final

**ESPELHO PARCIALMENTE CONFIRMADO**

- **Código e startup:** A branch `production-mirror/ez1oc96t1` está alinhada ao commit 7c8cf59; o frontend sobe localmente (Vite em 5178) sem erros; a estrutura de rotas, componentes (VersionWarning, sem ToastContainer), saldo fixo na sidebar e fluxos de auth coincidem com a documentação da produção atual.
- **Visual e funcional no browser:** Não confirmado pelo agente (requer inspeção manual no navegador em http://localhost:5178/).

Recomendação: usar a branch como **referência exata de código** da produção; para garantir 100% de identidade visual e funcional, realizar uma inspeção manual das telas principais no ambiente local.

---

## Saída final obrigatória

| Pergunta | Resposta |
|----------|----------|
| **A branch espelho realmente reproduz a produção atual?** | No que diz respeito ao **código** e à **documentação** da produção: sim. Quanto à reprodução **visual/funcional em runtime**, não foi confirmada (validação no navegador não executada). |
| **O banner verde faz parte da produção atual ou não?** | Sim. O componente **VersionWarning** está em App.jsx e **VersionBanner** em Login/ForgotPassword; a documentação (Bloco F e relatórios de produção) descreve avisos de versão/banner. Portanto o banner faz parte da produção documentada e está presente na branch espelho. |
| **A tela /game local da branch espelho bate com a produção documentada?** | Em **código**: sim (mesma rota, GameShoot, ProtectedRoute, API do jogo). Em **validação visual no browser**: NÃO CONFIRMADO. |
| **A equipe já pode usar essa branch como referência exata da produção?** | Sim como **referência de código e commit** (7c8cf59 = ez1oc96t1). Para uso como referência **visual/funcional exata**, recomenda-se uma passagem manual nas telas principais no local (http://localhost:5178/). |
| **Próximo passo seguro recomendado** | (1) Manter a branch espelho apenas local; não fazer deploy nem push para produção. (2) Para comparação visual: abrir http://localhost:5178/ com o servidor da branch espelho rodando e conferir login, dashboard, /game, profile, pagamentos e withdraw. (3) Usar a branch para diffs e análises de código contra main ou outras branches, sem alterar produção. |
