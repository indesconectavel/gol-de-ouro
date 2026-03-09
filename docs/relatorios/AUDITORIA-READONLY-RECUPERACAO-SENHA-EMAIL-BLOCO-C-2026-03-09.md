# AUDITORIA READ-ONLY — RECUPERAÇÃO DE SENHA E E-MAIL — BLOCO C

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código, env, build ou deploy)  
**Escopo:** Apenas forgot password, reset password, token de recuperação, armazenamento do token, envio de e-mail e dependências.

---

## 1. Resumo executivo

O fluxo de recuperação de senha está **implementado de ponta a ponta** no backend e no frontend: existe endpoint de forgot-password com validação de e-mail, geração de token JWT (1h), persistência na tabela `password_reset_tokens`, chamada ao serviço de e-mail e resposta uniforme ao cliente. O reset-password valida token no banco, expiração e uso único, atualiza a senha em `usuarios` e marca o token como usado. O **envio de e-mail** é feito pelo módulo `services/emailService.js` com **nodemailer** e **Gmail** (SMTP_USER / SMTP_PASS ou GMAIL_APP_PASSWORD). O link de reset está **fixo em código** como `https://goldeouro.lol/reset-password?token=...`, sem uso de variável de ambiente para o domínio. Quando o serviço de e-mail **não está configurado** (transporter.verify ainda não passou ou falhou), o código **não envia e-mail** e devolve `{ success: true }` e apenas **registra o token no log**; o backend continua respondendo 200 com a mesma mensagem ao frontend, portanto o usuário **nunca é informado** de que o e-mail não foi enviado. O estado do fluxo é **implementado com dependências pendentes**: depende de SMTP_USER e SMTP_PASS (ou GMAIL_APP_PASSWORD) configurados no ambiente e da tabela `password_reset_tokens` existente no Supabase; sem isso, o envio real não ocorre e o comportamento é de “sucesso” com fallback apenas em log.

---

## 2. Arquivos auditados

| Arquivo | Lido |
|---------|------|
| server-fly.js (trechos: forgot-password L430-527, reset-password L531-614, require emailService L72) | Sim |
| services/emailService.js (inteiro) | Sim |
| password-reset-tokens.sql | Sim |
| goldeouro-player/src/pages/ForgotPassword.jsx | Sim |
| goldeouro-player/src/pages/ResetPassword.jsx | Sim |
| goldeouro-player/src/config/api.js (trecho API_ENDPOINTS) | Sim |
| goldeouro-player/src/services/apiClient.js (trecho de uso) | Sim |
| config/production.js (referência FRONTEND_URL; não usado pelo emailService) | Sim |

---

## 3. Mapeamento completo do forgot password

| Etapa | Onde | Evidência |
|-------|------|-----------|
| 1. Tela | ForgotPassword.jsx | Formulário com estado email; handleSubmit valida `email` e `email.includes('@')`. |
| 2. Submit | ForgotPassword.jsx L27-29 | `apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email })`. |
| 3. Endpoint frontend | api.js | FORGOT_PASSWORD: `/api/auth/forgot-password`. |
| 4. Chamada real | apiClient | baseURL de environments.js; POST relativo a /api/auth/forgot-password. |
| 5. Backend rota | server-fly.js L430 | `app.post('/api/auth/forgot-password', [ body('email').isEmail().normalizeEmail() ], validateData, async (req, res) => { ... })`. |
| 6. Validação entrada | server-fly.js L320-329, L431 | validateData usa validationResult; se erro → 400 "Dados inválidos". |
| 7. DB conectado | server-fly.js L437-442 | Se !dbConnected ou !supabase → 503 "Sistema temporariamente indisponível". |
| 8. Consulta usuário | server-fly.js L446-451 | supabase.from('usuarios').select('id, email, username').eq('email', email).eq('ativo', true).single(). |
| 9. Usuário não existe | server-fly.js L452-461 | Retorna 200 { success: true, message: 'Se o email existir, você receberá um link de recuperação' }; não gera token nem envia e-mail. |
| 10. Geração token | server-fly.js L464-472 | jwt.sign({ userId, email, type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' }). Token JWT, não aleatório. |
| 11. Persistência token | server-fly.js L475-484 | supabase.from('password_reset_tokens').insert({ user_id, token: resetToken, expires_at: now + 1h, used: false, created_at }). |
| 12. Erro ao salvar token | server-fly.js L485-491 | tokenError → 500 "Erro interno do servidor". |
| 13. Envio e-mail | server-fly.js L494-495 | emailResult = await emailService.sendPasswordResetEmail(email, user.username, resetToken). |
| 14. Tratamento resultado e-mail | server-fly.js L500-518 | Se emailResult.success: log de sucesso. Senão: log de falha e log do link truncado no console. Resposta ao cliente **sempre** 200 { success, message } (mesma mensagem). |
| 15. Catch geral | server-fly.js L520-526 | Qualquer exceção → 500 "Erro interno do servidor". |
| 16. Frontend pós-resposta | ForgotPassword.jsx L31-32 | if (response.data.success) setIsSent(true); senão setError(response.data.message). |
| 17. UX sucesso | ForgotPassword.jsx L44-65 | Tela "Email Enviado!" e link "Voltar ao Login" (to="/login" — rota inexistente, já apontado em outros relatórios). |

---

## 4. Mapeamento completo do reset password

| Etapa | Onde | Evidência |
|-------|------|-----------|
| 1. Tela e token na URL | ResetPassword.jsx L9, L21-28 | useSearchParams(); tokenParam = searchParams.get('token'); setToken(tokenParam). Se !tokenParam → setError('Token de recuperação não encontrado'). |
| 2. Validações frontend | ResetPassword.jsx L34-48 | Senhas devem coincidir; newPassword.length >= 6; token obrigatório. |
| 3. Submit | ResetPassword.jsx L53-56 | apiClient.post(API_ENDPOINTS.RESET_PASSWORD, { token, newPassword: formData.newPassword }). |
| 4. Endpoint backend | server-fly.js L531 | app.post('/api/auth/reset-password', [ body('token').notEmpty(), body('newPassword').isLength({ min: 6 }) ], validateData, ...). |
| 5. Validação entrada | validateData | token vazio ou newPassword < 6 → 400 "Dados inválidos". |
| 6. DB conectado | server-fly.js L537-542 | !dbConnected ou !supabase → 503. |
| 7. Busca token | server-fly.js L546-553 | supabase.from('password_reset_tokens').select('user_id, expires_at, used').eq('token', token).eq('used', false).single(). |
| 8. Token inexistente ou já usado | server-fly.js L555-559 | tokenError ou !tokenData → 400 "Token inválido ou expirado". |
| 9. Token expirado | server-fly.js L562-567 | new Date() > new Date(tokenData.expires_at) → 400 "Token expirado". |
| 10. Hash nova senha | server-fly.js L570-571 | bcrypt.hash(newPassword, 10). |
| 11. Atualização senha | server-fly.js L574-580 | supabase.from('usuarios').update({ senha_hash, updated_at }).eq('id', tokenData.user_id). |
| 12. Erro ao atualizar senha | server-fly.js L582-587 | updateError → 500 "Erro ao atualizar senha". |
| 13. Marcar token usado | server-fly.js L590-597 | supabase.from('password_reset_tokens').update({ used: true }).eq('token', token). markUsedError só logado; resposta ao cliente ainda 200. |
| 14. Resposta sucesso | server-fly.js L601-604 | 200 { success: true, message: 'Senha alterada com sucesso' }. |
| 15. Frontend pós-sucesso | ResetPassword.jsx L58-63 | setIsSuccess(true); setTimeout(() => navigate('/'), 3000). |
| 16. Erro no frontend | ResetPassword.jsx L66-69 | setError(response.data.message ou error.response?.data?.message). |

---

## 5. Serviço de e-mail em uso real

| Aspecto | Evidência |
|---------|-----------|
| **Arquivo** | services/emailService.js |
| **Provider** | nodemailer com service: 'gmail' (L22-31). Não usa SMTP_HOST/SMTP_PORT de env; usa apenas auth.user e auth.pass. |
| **Função usada** | sendPasswordResetEmail(email, username, resetToken) (L52-86). Chamada em server-fly.js L495. |
| **Credenciais** | user: process.env.SMTP_USER \|\| 'goldeouro.game@gmail.com'; pass: process.env.SMTP_PASS \|\| process.env.GMAIL_APP_PASSWORD (L25-26). |
| **Configuração** | initializeTransporter() no constructor; transporter.verify(callback) define this.isConfigured de forma assíncrona (L34-42). |
| **Quando não configurado** | if (!this.isConfigured) (L52-55): não chama sendMail; retorna { success: true, message: 'Email simulado (serviço não configurado)' }; console.log do token completo para o e-mail. Ou seja: **fallback que mascara falha** e retorna sucesso. |
| **Link no e-mail** | resetLink = `https://goldeouro.lol/reset-password?token=${resetToken}` (L59). **Hardcoded**; nenhuma variável de ambiente (FRONTEND_URL, RESET_LINK_BASE, etc.) é usada no emailService. |
| **Remetente** | from: process.env.SMTP_USER \|\| 'goldeouro.game@gmail.com' (L61). |
| **Templates** | generatePasswordResetHTML(username, resetLink) e generatePasswordResetText (L126-221). Conteúdo fixo no código; aviso de validade de 1 hora. |
| **Envio real** | this.transporter.sendMail(mailOptions) (L69). Em caso de exceção, retorna { success: false, error: error.message } (L78-84). |
| **Mock / simulação** | Não há mock explícito; quando !isConfigured o método retorna sucesso sem enviar e apenas loga o token. |
| **Uso de config/production.js** | emailService não importa config/production.js; FRONTEND_URL definido em production.js não é usado para montar o link. |

---

## 6. Variáveis de ambiente e dependências necessárias

| Item | Onde aparece | Função | Impacto se faltar | Observação |
|------|----------------|--------|-------------------|------------|
| JWT_SECRET | server-fly.js L470 (jwt.sign) | Assinatura do token de recuperação | Token inválido ou erro ao gerar; forgot-password pode falhar em runtime se não definido em outro ponto de carga | assertRequiredEnv em server-fly inclui JWT_SECRET (L43-46) |
| SMTP_USER | emailService.js L25, L61 | Usuário SMTP / remetente | Fallback 'goldeouro.game@gmail.com'; envio pode usar conta padrão ou falhar se senha não bater | |
| SMTP_PASS ou GMAIL_APP_PASSWORD | emailService.js L26 | Senha/app password Gmail | pass vazio ou inválido → transporter.verify falha → isConfigured = false → envio não ocorre; retorno continua success: true (fallback em log) | Gmail em geral exige app password com 2FA |
| SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY | server-fly (Supabase) | Conexão ao banco | dbConnected false → 503 em forgot e reset | Fora do escopo de e-mail; necessário para todo o fluxo |
| FRONTEND_URL / RESET_LINK_BASE | Não usado no emailService | — | Link de reset não usa env; sempre https://goldeouro.lol | Divergência: config/production.js tem FRONTEND_URL mas emailService não o utiliza |
| Nodemailer (pacote) | emailService.js L8 | Envio SMTP | require falha se não instalado | Dependência do projeto |

---

## 7. Armazenamento e ciclo de vida do token

| Aspecto | Evidência |
|---------|-----------|
| **Tabela** | public.password_reset_tokens (password-reset-tokens.sql; server-fly.js L477, L548, L592). |
| **Campos inseridos (forgot)** | user_id (UUID ref usuarios.id), token (JWT string completo), expires_at (ISO string, now + 1h), used (false), created_at (ISO now). |
| **Token** | JWT assinado com JWT_SECRET; payload userId, email, type: 'password_reset'; expiresIn: '1h'. **Salvo em texto puro** na coluna token (não hash). |
| **Expiração** | expires_at no banco = Date.now() + 60*60*1000 (1h). No reset, verificação: new Date() > new Date(tokenData.expires_at) → 400 "Token expirado". |
| **Reutilização** | SELECT com .eq('used', false). Após atualizar senha, UPDATE SET used = true. Segundo uso do mesmo token → não encontrado (used true) → 400 "Token inválido ou expirado". |
| **Múltiplos tokens ativos** | Inserção não invalida tokens anteriores do mesmo usuário. Vários tokens podem coexistir até expirarem ou serem usados. Comportamento aceitável; risco operacional baixo. |
| **Limpeza de expirados** | Função cleanup_expired_password_tokens() no SQL (DELETE WHERE expires_at < NOW() OR used = true). Não foi verificado se é chamada por job/cron no servidor; tokens antigos podem permanecer na tabela até limpeza manual ou job. |

---

## 8. Comportamento em falhas

| Cenário | O que o código faz | Resposta ao cliente | Observação |
|---------|--------------------|---------------------|------------|
| Usuário não existe | Retorna 200 com mensagem genérica; não gera token nem envia e-mail | 200 { success, message } | Correto (não vazar existência). |
| Provider de e-mail falha (sendMail throw) | emailService retorna { success: false, error } | Backend ainda responde 200 { success, message } (server-fly não altera resposta por emailResult) | **Falha silenciosa**: usuário acha que recebeu e-mail. |
| Serviço não configurado (isConfigured false) | sendPasswordResetEmail retorna { success: true } e só loga token | 200 { success, message } | **Falha silenciosa**: mesmo efeito. |
| Token não salvo (insert error) | return 500 "Erro interno do servidor" | 500 | Cliente vê erro; token não é enviado por e-mail. |
| Token expirado | reset: 400 "Token expirado" | 400 | Frontend pode exibir error.response?.data?.message. |
| Token já usado | reset: SELECT used=false não acha; 400 "Token inválido ou expirado" | 400 | Comportamento correto. |
| URL de reset errada (ex.: preview) | Link no e-mail é sempre https://goldeouro.lol/...; em preview o usuário pode abrir produção; não há env para trocar domínio | — | Risco: link em e-mail não reflete ambiente preview. |
| Env SMTP ausente / inválida | transporter.verify falha ou sendMail falha; isConfigured false ou catch retorna failure | Backend ainda 200 no forgot | Falha silenciosa para o usuário. |
| Nova senha inválida (ex.: &lt; 6 caracteres) | validateData → 400 "Dados inválidos" | 400 | Frontend já valida ≥6; backend reforça. |
| Reset falha após validar token (ex.: update usuarios falha) | return 500 "Erro ao atualizar senha"; token **não** é marcado como usado (update de senha antes do update used) | 500 | Token continua utilizável; usuário pode tentar de novo. |
| markUsedError (erro ao marcar token usado) | Apenas console.error; resposta 200 mantida | 200 | Token pode ficar “não usado” no banco com senha já alterada; próximo uso do mesmo token falha por “senha incorreta” até entender que já trocou. |

---

## 9. O que está comprovado vs o que ainda não está comprovado

| Comprovado por código | Ainda depende de validação manual / operacional |
|------------------------|-------------------------------------------------|
| Endpoint POST /api/auth/forgot-password existe e valida e-mail | E-mail de fato chega na caixa de entrada do usuário |
| Endpoint POST /api/auth/reset-password existe e valida token + newPassword | SMTP_USER/SMTP_PASS (ou GMAIL_APP_PASSWORD) estão configurados no ambiente de preview/produção |
| Token é JWT com expiração 1h e é salvo em password_reset_tokens | transporter.verify() conclui com sucesso (isConfigured true) antes da primeira requisição de forgot |
| Tabela password_reset_tokens com user_id, token, expires_at, used existe no schema do repo | Tabela existe e tem RLS/policies aplicadas no Supabase real |
| Link no e-mail é https://goldeouro.lol/reset-password?token=... | Domínio do link está correto para o ambiente (preview usa produção?) |
| Frontend chama os endpoints corretos e envia token na query e no body do reset | Usuário consegue abrir o link no mesmo browser/origem em que o app está (CORS/cookie não afetam link de e-mail) |
| Quando e-mail não é enviado, backend ainda retorna 200 | Ausência de env não gera erro visível ao usuário (apenas log / fallback) |
| Reset invalida token (used = true) após atualizar senha | Cleanup de tokens expirados é executado (job/cron ou manual) |

---

## 10. Diagnóstico final do fluxo

**Classificação: IMPLEMENTADO COM DEPENDÊNCIAS PENDENTES**

O fluxo de recuperação de senha está implementado de ponta a ponta no código: validação, token JWT, persistência, chamada ao serviço de e-mail, reset com validação de token e expiração, atualização de senha e invalidação do token. O envio de e-mail depende de SMTP_USER e SMTP_PASS (ou GMAIL_APP_PASSWORD) e da verificação assíncrona do transporter; na ausência disso, o sistema devolve sucesso ao cliente e apenas loga o token, sem enviar e-mail. O link de reset está fixo em código (goldeouro.lol), o que pode ser inadequado para preview ou outros ambientes. Por isso o fluxo não é “incompleto” nem “não pronto” em termos de código, mas **não é comprovadamente funcional** para envio real de e-mail e para o domínio correto em todos os ambientes até que as dependências sejam configuradas e validadas na prática.

---

## 11. Top 7 riscos reais

| # | Risco | Gravidade |
|---|--------|-----------|
| 1 | **E-mail não enviado mas resposta 200** — Quando isConfigured é false ou sendMail falha, o backend ainda responde 200 com a mesma mensagem; o usuário não sabe que não receberá o e-mail. | Crítico |
| 2 | **Link de reset fixo (goldeouro.lol)** — Em preview ou outro domínio, o link no e-mail aponta sempre para produção; não há FRONTEND_URL/RESET_LINK_BASE no emailService. | Alto |
| 3 | **isConfigured definido de forma assíncrona** — transporter.verify() é callback; na primeira requisição de forgot, isConfigured pode ainda ser false e o envio ser “simulado” mesmo com env correta. | Alto |
| 4 | **Credenciais SMTP não configuradas** — Sem SMTP_PASS/GMAIL_APP_PASSWORD válido, Gmail não envia; o código trata como “não configurado” e retorna sucesso. | Alto |
| 5 | **Token completo logado quando não configurado** — console.log(`📧 [EMAIL] Token para ${email}: ${resetToken}`) expõe o token em logs; risco em ambientes compartilhados. | Médio |
| 6 | **Erro ao marcar token como usado não falha o reset** — Senha já alterada mas token não marcado; usuário pode tentar reutilizar e ver “Token inválido”; experiência confusa. | Médio |
| 7 | **Tabela password_reset_tokens** — Se a tabela não existir ou RLS bloquear no Supabase real, insert/select falham com 500 ou vazio; depende de deploy de schema e políticas. | Médio |

---

## 12. Conclusão objetiva

O fluxo de recuperação de senha **está pronto para ser validado no preview** do ponto de vista de código e integração (forgot → token → reset), mas **não está comprovadamente funcional** para envio real de e-mail até que: (1) SMTP_USER e SMTP_PASS (ou GMAIL_APP_PASSWORD) estejam configurados no ambiente; (2) se confirme na prática que o e-mail é recebido e que o link abre a tela de reset correta (incluindo decisão sobre uso de goldeouro.lol em preview); (3) se valide que, quando o e-mail falha, não se mantém resposta 200 sem nenhum indicativo ao usuário (ou se aceita esse comportamento como definido). Recomenda-se executar um teste de ponta a ponta no preview (forgot → checar caixa de entrada e logs do backend → reset com o token recebido) para classificar o fluxo como funcional ou documentar as dependências pendentes.

---

Nenhuma alteração foi realizada. Nenhum deploy foi executado. Esta análise foi conduzida em modo estritamente READ-ONLY.
