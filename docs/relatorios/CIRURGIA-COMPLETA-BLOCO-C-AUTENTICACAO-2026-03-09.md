# CIRURGIA COMPLETA — BLOCO C — AUTENTICAÇÃO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Escopo:** Autenticação (login, cadastro, sessão, logout, forgot password, reset password, e-mail)  
**Referência:** BLOCO-C-AUTENTICACAO-VALIDACAO-COMPLETA-2026-03-08.md, AUDITORIA-READONLY-BLOCO-C-AUTENTICACAO-2026-03-09.md, VALIDACAO-AUTOMATICA-CONSISTENCIA-BLOCO-C-2026-03-09.md, AUDITORIA-READONLY-RECUPERACAO-SENHA-EMAIL-BLOCO-C-2026-03-09.md

---

## 1. Resumo executivo

Foi executada a **cirurgia completa do BLOCO C (Autenticação)** conforme as ressalvas confirmadas nos relatórios de auditoria. As correções aplicadas cobrem:

- **Rotas e navegação:** Eliminada a referência à rota inexistente `/login`; toda navegação "voltar ao login" e logout redireciona para `/`.
- **Sessão (AuthContext):** Contrato do `user` unificado: login, cadastro e refresh (GET profile) passam a produzir o mesmo shape de objeto (`{ id, email, username, ... }`).
- **Logout:** Centralizado em `AuthContext.logout()`; Navigation e Dashboard passam a usar apenas `logout()` + `navigate('/')`; removida a chamada ao endpoint inexistente POST `/auth/logout`.
- **Forgot password:** Backend passa a retornar **503** quando o envio de e-mail falhar ou o serviço não estiver configurado; o frontend deixa de receber sucesso falso.
- **Serviço de e-mail:** Link de reset usa `FRONTEND_URL` (ou `FRONTEND_BASE_URL`); quando não configurado, retorna `{ success: false }`; inicialização confiável com await da verificação na primeira chamada; token completo não é logado em produção.
- **Reset password:** Marcação do token como usado feita com retry (até 2 tentativas) para maior consistência.

Nenhuma alteração foi feita fora do escopo do BLOCO C (financeiro, saldo, PIX, gameplay, ranking, admin permanecem intocados).

---

## 2. Arquivos alterados

| Arquivo | Alterações |
|---------|------------|
| **Backend** | |
| `server-fly.js` | Forgot-password: retorno 503 quando `!emailResult.success`; reset-password: marcação do token com retry (2 tentativas). |
| `services/emailService.js` | Base URL via `FRONTEND_URL`/`FRONTEND_BASE_URL`; sem sucesso falso quando não configurado; inicialização com `_verifyPromise` e await na primeira chamada; log de token apenas truncado em dev; `sendVerificationEmail` e `getStats` alinhados. |
| **Frontend** | |
| `goldeouro-player/src/pages/ForgotPassword.jsx` | Links "Voltar ao Login" alterados de `to="/login"` para `to="/"`. |
| `goldeouro-player/src/config/api.js` | Função `logout()`: redirecionamento de `'/login'` para `'/'`. |
| `goldeouro-player/src/contexts/AuthContext.jsx` | Profile: `setUser(response.data?.data ? response.data.data : response.data)`; logout: `localStorage.removeItem('userData')`. |
| `goldeouro-player/src/components/Navigation.jsx` | Uso de `useAuth().logout()`; `handleLogout` = `logout()` + `navigate('/')`; removida chamada POST `/auth/logout` e limpeza manual de token/user. |
| `goldeouro-player/src/pages/Dashboard.jsx` | Uso de `useAuth().logout()`; `handleLogout` = `logout()` + `navigate('/')`; removida chamada POST `/auth/logout` e limpeza manual de localStorage. |

**Não alterados (revisados apenas):** `ResetPassword.jsx` (já consome `response.data.success` e `error.response?.data?.message`), `ProtectedRoute.jsx`, `App.jsx`, `config/production.js`, `apiClient.js`.

---

## 3. Correções aplicadas

### 3.1 Rotas

- **ForgotPassword.jsx:** Os dois `<Link to="/login">` foram alterados para `to="/"`. "Voltar ao Login" passa a levar à tela de login real.
- **api.js:** Em `logout()`, `window.location.href = '/login'` foi alterado para `window.location.href = '/'`. Consistência caso essa função seja usada em outro ponto.

### 3.2 Sessão (formato do user)

- **AuthContext.jsx:** No `useEffect` que chama GET `/api/user/profile`, o valor passado a `setUser` passou a ser `response.data?.data ? response.data.data : response.data`. Assim, após refresh, `user` mantém o mesmo shape de login/cadastro (`{ id, email, username, ... }`) em vez de `{ success, data }`.

### 3.3 Logout

- **AuthContext.jsx:** `logout()` já limpava `authToken` e `setUser(null)`; foi adicionado `localStorage.removeItem('userData')` para alinhar com o interceptor e evitar estado residual.
- **Navigation.jsx:** Removidos import e uso de `apiClient` para POST `/auth/logout`; adicionado `useAuth()`; `handleLogout` passou a ser apenas `logout()` + `navigate('/')`.
- **Dashboard.jsx:** Adicionado `useAuth()`; `handleLogout` passou a ser apenas `logout()` + `navigate('/')`; removidos POST `/auth/logout` e limpeza manual de localStorage.

### 3.4 Endpoint fantasma /auth/logout

- **Decisão:** Logout é apenas local (JWT no cliente). Não foi criada rota no backend.
- **Ação:** Remoção da chamada POST `/auth/logout` em Navigation e Dashboard. Nenhuma referência a esse endpoint permanece no fluxo principal de logout.

### 3.5 Forgot password (resposta honesta)

- **server-fly.js:** Após `emailService.sendPasswordResetEmail(...)`, se `!emailResult.success` o handler responde **503** com a mensagem: "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde." Removido o bloco que em caso de falha ainda respondia 200 e logava o link com token.

### 3.6 E-mail (emailService)

- **Base URL:** Constante `FRONTEND_BASE_URL = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || 'https://goldeouro.lol'`. Links de reset e verificação usam `${FRONTEND_BASE_URL}/reset-password?token=...` e equivalente para verify-email.
- **Sem sucesso falso:** Quando não há credenciais (SMTP_PASS/GMAIL_APP_PASSWORD) ou transporter não está configurado, `sendPasswordResetEmail` retorna `{ success: false, error: '...' }`. Não retorna mais `success: true` com "email simulado".
- **Inicialização:** `_verifyPromise` guarda a Promise de `transporter.verify()`. Na primeira chamada a `sendPasswordResetEmail`, se o transporter existir mas `isConfigured` ainda for false, o código aguarda `_verifyPromise` antes de decidir; assim a primeira requisição não recebe sucesso simulado por corrida com o callback.
- **Log de token:** Em produção não se loga o token completo; em desenvolvimento pode ser logado truncado (primeiros 20 caracteres + '...').
- **sendVerificationEmail:** Passou a retornar `{ success: false, error }` quando não configurado e a usar `FRONTEND_BASE_URL` para o link.
- **getStats:** Incluído `frontendBaseUrl: FRONTEND_BASE_URL` para inspeção.

### 3.7 Reset password (token usado)

- **server-fly.js:** A marcação do token como usado (`password_reset_tokens.update({ used: true })`) passou a ser feita em loop com até 2 tentativas, com pequeno delay entre elas, para reduzir falhas transitórias e deixar o estado do token mais consistente após alteração da senha.

---

## 4. Contratos finais após a cirurgia

| Fluxo | Request | Resposta sucesso | Resposta erro | Frontend |
|-------|---------|------------------|---------------|----------|
| **Login** | POST `/api/auth/login` { email, password } | 200 { success, message, token, user: { id, email, username, ... } } | 401 credenciais inválidas | setUser(user); localStorage authToken |
| **Cadastro** | POST `/api/auth/register` { username, email, password } | 201/200 { success, token, user: { id, email, username, ... } } | 400/409 conforme regra | Idem login |
| **Profile** | GET `/api/user/profile` Authorization Bearer | 200 { success: true, data: { id, email, username, ... } } | 401 | setUser(response.data.data) → mesmo shape que login |
| **Forgot password** | POST `/api/auth/forgot-password` { email } | 200 { success, message } (apenas se e-mail foi enviado ou email não existe) | 503 se envio falhar; 400 dados inválidos | setIsSent(true) só com success; erro com message |
| **Reset password** | POST `/api/auth/reset-password` { token, newPassword } | 200 { success, message } | 400 token inválido/expirado; 500 atualização senha | setIsSuccess(true); navigate('/') |
| **Logout** | — | — | — | AuthContext.logout() (limpa token, userData, setUser(null)); navigate('/') |

- **user no contexto:** Sempre objeto plano `{ id, email, username, ... }` após login, cadastro ou refresh.
- **Logout:** Apenas local; nenhuma chamada a backend.

---

## 5. Riscos eliminados

| # | Risco anterior | Status |
|---|-----------------|--------|
| 1 | Rota `/login` inexistente; link "Voltar ao Login" quebrado | Eliminado (todos os links vão para `/`) |
| 2 | User no contexto com formato `{ success, data }` após refresh; user.email/user.id undefined | Eliminado (profile normaliza para response.data.data) |
| 3 | Logout (Navigation/Dashboard) não limpava AuthContext; acesso a /game após "Sair" | Eliminado (logout centralizado no contexto) |
| 4 | POST `/auth/logout` chamado e inexistente (404) | Eliminado (chamada removida) |
| 5 | E-mail não enviado mas resposta 200 no forgot | Eliminado (503 quando envio falha) |
| 6 | Link de reset fixo (goldeouro.lol) em todos os ambientes | Eliminado (FRONTEND_URL/FRONTEND_BASE_URL) |
| 7 | isConfigured assíncrono; primeira requisição "simulada" | Mitigado (await _verifyPromise na primeira chamada) |
| 8 | Token completo logado quando não configurado | Eliminado (apenas truncado em dev) |
| 9 | Erro ao marcar token como usado não tratado | Mitigado (retry na marcação) |
| 10 | api.js logout() redirecionando para /login | Corrigido (redireciona para `/`) |

---

## 6. Riscos remanescentes

| # | Risco | Depende de |
|---|-------|------------|
| 1 | Envio real de e-mail no preview | SMTP_USER e SMTP_PASS (ou GMAIL_APP_PASSWORD) configurados no ambiente; validação manual de recebimento. |
| 2 | Link de reset correto no preview | Variável `FRONTEND_URL` (ou `FRONTEND_BASE_URL`) definida no backend para o domínio do preview. |
| 3 | Interceptor 401 não chama setUser(null) | Decisão de produto: hoje o 401 remove token/userData; na próxima navegação ou uso de rota protegida o usuário é redirecionado por ProtectedRoute se user for null; como o profile falha e o catch do useEffect remove token e setUser(null), o estado tende a ficar consistente após um refresh. Pode ser melhorado no futuro com callback do apiClient para o AuthContext. |
| 4 | Tabelas password_reset_tokens e email_verification_tokens no Supabase | Schema e RLS já existentes no projeto; validação em ambiente real. |

---

## 7. Checklist de validação prática pós-cirurgia

- [ ] **Login:** Credenciais inválidas → 401; válidas → redirecionamento e exibição de dados.
- [ ] **Refresh (F5)** na rota protegida: sessão mantida; `user` com id, email, username utilizáveis (ex.: exibição no header).
- [ ] **Logout** (sidebar ou botão Sair no Dashboard): redirecionamento para `/`; tentativa de acessar `/dashboard`, `/game` ou `/profile` sem novo login deve redirecionar para `/`.
- [ ] **Forgot password:** Com e-mail configurado e usuário existente: mensagem de sucesso e recebimento do e-mail; com envio falho ou serviço não configurado: mensagem de erro (503) e nenhuma tela de "Email Enviado!".
- [ ] **Link no e-mail:** Abre a aplicação no domínio configurado em FRONTEND_URL (preview ou produção) em `/reset-password?token=...`.
- [ ] **Reset password:** Token válido → alteração de senha e redirecionamento; token inválido/expirado → 400 com mensagem; após sucesso, reutilizar o mesmo token → 400.
- [ ] **Voltar ao Login** em ForgotPassword: leva à tela `/` (login).
- [ ] Console/rede: nenhuma chamada a `/auth/logout` (404).

---

## 8. Diagnóstico final do BLOCO C

**Classificação: PRONTO PARA VALIDAÇÃO FINAL**

As ressalvas críticas apontadas nos relatórios (rota /login, formato do user, logout centralizado, endpoint fantasma, forgot honesto, link de reset por ambiente, inicialização do e-mail, marcação do token no reset) foram tratadas no código. O BLOCO C está coeso entre frontend e backend, sem rotas quebradas, sem endpoint fantasma, sem sucesso falso no forgot e com contratos de sessão e logout definidos. O que resta é validação prática no preview (credenciais de e-mail, FRONTEND_URL, e testes manuais do checklist acima).

---

## 9. Conclusão objetiva

O **BLOCO C pode seguir para teste final no preview.** As alterações foram aplicadas nos arquivos listados, os contratos estão documentados e os riscos eliminados ou listados como remanescentes (dependentes de configuração de ambiente ou validação manual). Recomenda-se executar o checklist da seção 7 no ambiente de preview e configurar `FRONTEND_URL` e credenciais SMTP quando o envio real de e-mail for necessário.

---

*Cirurgia aplicada em 2026-03-09. Nenhuma alteração fora do escopo do BLOCO C.*
