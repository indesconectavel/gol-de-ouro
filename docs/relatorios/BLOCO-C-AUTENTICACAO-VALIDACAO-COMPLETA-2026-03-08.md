# 📦 BLOCO C — AUTENTICAÇÃO — Validação técnica completa

**Projeto:** Gol de Ouro  
**Data:** 2026-03-08  
**Objetivo:** Validação anti-regressão de toda a autenticação no preview atual (branch própria + Vercel Preview + backend Fly.io).

**Contexto oficial:** Backend goldeouro-backend-v2 (Fly.io), /health 200, CORS para *.vercel.app, login 500 corrigido (commit 95bbfd0, server-fly.js). Frontend goldeouro-player, branch feature/bloco-e-gameplay-certified, preview ativo.

---

## 1. RESUMO EXECUTIVO DO BLOCO C

Para a **autenticação** ser considerada **aprovada**, é necessário validar de forma objetiva:

| Área | O que deve estar correto |
|------|--------------------------|
| **Cadastro** | Novo usuário criado no Supabase (tabela `usuarios`), token retornado, redirecionamento/destino correto, mensagens de erro/sucesso coerentes, e-mail duplicado tratado (400 + mensagem ou login automático). |
| **Login** | Credenciais válidas → 200 + token + user; credenciais inválidas → **401** (nunca 500); token armazenado e enviado no header; redirecionamento pós-login (ex.: /dashboard). |
| **Esqueceu a senha** | Fluxo completo: tela/modal de recuperação, validação de e-mail, POST `/api/auth/forgot-password` integrado, mensagem única ao usuário (não revelar se e-mail existe), e opcionalmente envio real de e-mail ou link de recuperação; reset com token válido alterando senha no banco. |
| **Proteção de rota** | Acesso a `/game` (e demais rotas protegidas) sem login → redirecionamento para `/`; com login → conteúdo da rota exibido. |
| **Sessão** | Após refresh, sessão mantida (token em localStorage + GET `/api/user/profile` válido); formato do `user` no contexto consistente (evitar `user` com estrutura `{ success, data }` após refresh). |
| **Logout** | Limpeza de token e estado; redirecionamento para `/`; chamadas subsequentes sem token retornando 401 onde aplicável. |
| **Consistência** | Preview usando backend correto (goldeouro-backend-v2); sem CORS inesperado; sem 401/500 indevidos no console; mensagens exibidas ao usuário alinhadas ao backend. |

O BLOCO C **só fecha** quando **todos** os itens acima estiverem validados no **preview atual**, incluindo o fluxo **Esqueceu a senha** de ponta a ponta.

---

## 2. CHECKLIST MESTRE DE VALIDAÇÃO

Ordem ideal de execução (evita estados inconsistentes e reduz retrabalho).

### Fase 0 — Ambiente
- [ ] **0.1** Preview do frontend acessível (URL *.vercel.app da branch de validação).
- [ ] **0.2** Backend respondendo: `GET https://goldeouro-backend-v2.fly.dev/health` → 200.
- [ ] **0.3** Console do navegador aberto (aba Network e Console); sem erros de CORS ao carregar o preview.

### Fase 1 — Cadastro
- [ ] **1.1** Acessar rota de cadastro (/register).
- [ ] **1.2** Deixar campos vazios e submeter → mensagem de erro ou campos obrigatórios destacados.
- [ ] **1.3** E-mail inválido (ex.: `teste`) → validação de e-mail.
- [ ] **1.4** Senha fraca (ex.: 3 caracteres) → validação de senha (se houver regra no frontend).
- [ ] **1.5** Cadastro com dados válidos (e-mail novo, senha ≥6 caracteres, username) → 201 ou 200, token e user retornados; criação do usuário no Supabase (usuarios).
- [ ] **1.6** Comportamento visual após sucesso: loading, mensagem de sucesso, redirecionamento (ex.: dashboard ou home).
- [ ] **1.7** Tentar cadastrar mesmo e-mail novamente → 400 com mensagem tipo "Email já cadastrado" ou login automático; sem 500.
- [ ] **1.8** Layout do formulário sem regressão (campos alinhados, botões visíveis).

### Fase 2 — Login
- [ ] **2.1** Acessar rota de login (/) e inserir credenciais **válidas**.
- [ ] **2.2** Resposta: status 200, body com `success: true`, `token`, `user`; sem 500.
- [ ] **2.3** Token armazenado (localStorage `authToken` ou equivalente); redirecionamento correto (ex.: /dashboard).
- [ ] **2.4** Login com **senha errada** → status **401**, mensagem tipo "Credenciais inválidas"; **nunca 500**.
- [ ] **2.5** Login com **e-mail inexistente** → 401, mesma mensagem genérica.
- [ ] **2.6** E-mail com espaços em branco / maiúsculas: backend ou frontend normaliza (ex.: trim, lowercase); comportamento consistente.
- [ ] **2.7** Loading durante requisição; mensagem de erro exibida em caso de falha; console sem erros críticos.

### Fase 3 — Esqueceu a senha
- [ ] **3.1** Na tela de login, clicar em "Esqueceu a senha?" (ou equivalente).
- [ ] **3.2** Navegação para tela/modal de recuperação (/forgot-password ou equivalente); link "Voltar" leva para **/** (tela de login), não para /login inexistente.
- [ ] **3.3** Campo e-mail: válido → submit; inválido → validação (frontend ou backend 400).
- [ ] **3.4** Envio com e-mail **existente** → resposta 200, mensagem genérica (ex.: "Se o email existir, você receberá um link de recuperação"); sem vazamento de existência de conta.
- [ ] **3.5** Envio com e-mail **inexistente** → mesma resposta 200 e mesma mensagem (não diferenciar).
- [ ] **3.6** Comportamento visual após envio: feedback (sucesso ou erro de rede); sem tela quebrada.
- [ ] **3.7** Integração real: POST `/api/auth/forgot-password` chamado com body `{ email }`; resposta tratada (não apenas UI fake).
- [ ] **3.8** (Opcional) E-mail recebido com link de reset ou token exibido em log/fallback; link no formato esperado (ex.: goldeouro.lol/reset-password?token=...).
- [ ] **3.9** Reset de senha: acessar /reset-password?token=TOKEN_VALIDO; nova senha (≥6 caracteres); POST `/api/auth/reset-password` com token e newPassword → 200; login com nova senha funciona.

### Fase 4 — Proteção de rota
- [ ] **4.1** Sem estar logado, acessar diretamente URL da rota protegida (ex.: /game) → redirecionamento para `/` (login).
- [ ] **4.2** Logar e acessar /game → página do jogo exibida.
- [ ] **4.3** Outras rotas protegidas (/dashboard, /profile, /withdraw, /pagamentos): sem login → redirect para `/`; com login → conteúdo exibido.
- [ ] **4.4** Após "expiração" de sessão (token inválido/expirado): ao acessar rota protegida ou ao fazer ação que chama API → 401 tratado e redirect para `/` ou limpeza de sessão.
- [ ] **4.5** Recarregar a página estando logado → permanece na rota atual (ex.: /game) com sessão válida; sem loop de redirect.

### Fase 5 — Sessão e logout
- [ ] **5.1** Após login, dar refresh (F5): sessão mantida (não volta para tela de login); user/perfil disponível.
- [ ] **5.2** Formato do user após refresh: componentes que usam `user.email` / `user.id` continuam funcionando (se backend retorna `{ success, data }`, frontend deve setar `user = response.data.data`).
- [ ] **5.3** Logout (botão/ligação): token removido do localStorage; estado do usuário limpo; redirecionamento para `/`.
- [ ] **5.4** Após logout, tentar acessar /game → redirect para `/`.
- [ ] **5.5** Após logout, chamada a API protegida (ex.: GET profile) → 401; frontend não envia token; sem "meio logado".

### Fase 6 — Anti-regressão e consistência
- [ ] **6.1** Tela /game carrega; GameFinal/componente principal do jogo restaurado; sem tela em branco.
- [ ] **6.2** Banner de versão (se existir) conforme esperado ou oculto conforme combinado.
- [ ] **6.3** Áudio do jogo (se aplicável) funciona.
- [ ] **6.4** Preview usa bundle e backend corretos: requisições de API indo para goldeouro-backend-v2.fly.dev (ou URL configurada para o preview).
- [ ] **6.5** Console: sem CORS bloqueando; sem 401 em chamadas que deveriam ter token; sem 500 em login/cadastro/forgot/reset.
- [ ] **6.6** Mensagens exibidas ao usuário (erro/sucesso) coerentes com as retornadas pelo backend (ex.: "Credenciais inválidas", "Email já cadastrado").

---

## 3. RISCOS ESCONDIDOS

Problemas que podem fazer o bloco **parecer** aprovado sem estar de fato validado:

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Login OK, cadastro quebrado** | Foco só no login pós-fix 500; cadastro pode retornar 500 ou não criar usuário no Supabase. | Executar cadastro novo de ponta a ponta e conferir registro em `usuarios`. |
| **Esqueceu senha só visual** | Botão e tela existem, mas POST não é chamado ou URL do backend errada; usuário vê "sucesso" sem integração. | Verificar na aba Network a chamada POST `/api/auth/forgot-password` e resposta 200. |
| **Reset sem integração** | Página de reset exibe formulário, mas envia para endpoint inexistente ou com contrato diferente. | Confirmar POST `/api/auth/reset-password` com `token` e `newPassword`; depois login com nova senha. |
| **User após refresh com formato errado** | Backend profile retorna `{ success, data: { id, email, ... } }`; frontend faz `setUser(response.data)` → `user` vira `{ success, data }`; componentes que usam `user.email` quebram após F5. | Validar persistência de sessão com um componente que exibe `user.email` após refresh; ou corrigir AuthContext para `setUser(response.data.data)`. |
| **Link "Voltar ao Login" quebrado** | ForgotPassword/Reset usam `to="/login"` mas App não define rota `/login` (login está em `/`). | Clicar em "Voltar ao Login" e confirmar que chega na tela de login (/) e não em 404 ou tela em branco. |
| **Preview com build/backend antigo** | Preview pode estar servindo bundle antigo ou apontando para outro backend; login "funciona" em outro ambiente. | Confirmar URL do backend nas requisições (Network) e variável de ambiente do build (VITE_BACKEND_URL ou equivalente). |
| **Sessão no frontend, inválida no backend** | Token em localStorage mas JWT expirado ou secret diferente; API retorna 403 e frontend não limpa estado → "meio logado". | Após expirar token (ou trocar JWT_SECRET), acessar rota protegida e confirmar redirect + limpeza de token. |
| **401 em login tratado como 500** | Backend retorna 401; frontend exibe "Erro 500" ou mensagem genérica errada. | Testar login inválido e conferir mensagem exibida = "Credenciais inválidas" (ou equivalente). |
| **Cadastro sem validação de backend** | Register não usa express-validator; e-mail malformado ou senha vazia podem gerar 500 ou inserção incorreta. | Testar cadastro com e-mail inválido e senha vazia; esperar 400 ou validação no frontend. |
| **Diferença preview vs produção** | CORS, URL do backend ou env diferentes entre preview e prod; fluxo validado só em um. | Documentar qual URL de backend o preview usa; se possível, um smoke no domínio de produção. |

---

## 4. CRITÉRIO OFICIAL DE APROVAÇÃO

O **BLOCO C** pode ser marcado como **VALIDADO** quando:

1. **Cadastro:** Novo usuário criado com sucesso no Supabase; token e user retornados; e-mail duplicado tratado (400 ou login automático); mensagens e destino pós-cadastro corretos.
2. **Login:** Login válido → 200 + token + redirecionamento; login inválido → **401** com mensagem "Credenciais inválidas"; **nenhum 500** em login.
3. **Esqueceu a senha:** Navegação até tela de recuperação; POST `/api/auth/forgot-password` integrado; mensagem única ao usuário; reset com token alterando senha e login com nova senha funcionando.
4. **Proteção de rota:** Acesso a /game (e demais protegidas) sem login → redirect para `/`; com login → conteúdo exibido; após refresh logado, permanece na rota.
5. **Sessão:** Persistência após refresh; user no contexto utilizável (sem quebra por formato `{ success, data }`); logout limpa token e redireciona para `/`.
6. **Anti-regressão:** /game e demais telas carregam; console sem CORS/401/500 indevidos; mensagens alinhadas ao backend.
7. **Consistência:** Preview usando backend correto; sem divergência crítica entre frontend e backend (rotas, contratos, mensagens).

Qualquer item acima **não atendido** implica em **não aprovar** o bloco até correção ou ressalva documentada.

---

## 5. CRITÉRIO OFICIAL DE REPROVAÇÃO

O **BLOCO C** deve ser considerado **REPROVADO** se ocorrer **qualquer** um dos itens abaixo, mesmo que parte do fluxo funcione:

- **Login com credenciais inválidas retorna 500** (obrigatório: 401).
- **Cadastro com dados válidos retorna 500** ou não cria usuário no banco.
- **Esqueceu a senha:** POST não é chamado ou retorna erro não tratado; link "Voltar ao Login" leva a rota inexistente (ex.: /login) e quebra a navegação.
- **Acesso a /game sem login não redireciona** para tela de login (ex.: exibe jogo ou tela em branco).
- **Sessão não persiste** após refresh (sempre cai na tela de login mesmo com token válido) por bug de formato do user (ex.: `user` com estrutura errada quebra a UI).
- **Logout não limpa** token ou não redireciona para `/`; após logout ainda é possível acessar rota protegida sem novo login.
- **Console com CORS** bloqueando chamadas ao backend no preview (origem *.vercel.app permitida).
- **Preview apontando para backend diferente** do combinado (ex.: produção vs goldeouro-backend-v2) sem estar documentado como intencional.
- **Regressão crítica:** /game não carrega, tela em branco em rotas protegidas, ou erros críticos no console que impeçam uso da autenticação.

---

## 6. ROTEIRO PRÁTICO DE TESTE

Execução objetiva no **preview** (uma sessão contínua sugerida):

1. **Preparar:** Abrir preview (*.vercel.app); abrir DevTools (Network + Console); confirmar /health do backend 200.
2. **Cadastro:** Ir em /register → cadastrar usuário novo (e-mail único, senha ≥6, username) → confirmar sucesso e destino; em seguida tentar mesmo e-mail → confirmar 400 ou login automático.
3. **Login:** Ir em / → login com usuário válido → confirmar 200, token, redirect; depois login com senha errada → confirmar **401** e mensagem; login com e-mail inexistente → 401.
4. **Esqueceu a senha:** Em / clicar "Esqueceu a senha?" → ir para /forgot-password → enviar e-mail válido → conferir Network (POST forgot-password 200); clicar "Voltar ao Login" → deve ir para /. Opcional: usar token de reset (e-mail ou log) e testar /reset-password.
5. **Proteção:** Sem login, acessar diretamente /game → deve redirecionar para /. Fazer login → acessar /game → deve exibir jogo. Dar F5 em /game → deve continuar logado.
6. **Logout:** Clicar em Logout → deve ir para / e token sumir; tentar /game de novo → redirect para /.
7. **Anti-regressão:** Navegar por /dashboard, /game, /profile; conferir console sem CORS/500; mensagens de erro/sucesso coerentes.

Ao final, preencher o **Modelo de relatório final** (seção 7) com status de cada área e resultado: Validado / Validado com ressalvas / Reprovado.

---

## 7. MODELO DE RELATÓRIO FINAL

Preencher após executar o checklist e o roteiro.

**Data da validação:** _______________  
**Preview URL:** _______________  
**Branch frontend:** _______________  
**Backend (confirmado na Network):** _______________

### Resultado por área

| Área | Status | Observações |
|------|--------|-------------|
| Cadastro | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Login | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Esqueceu a senha | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Proteção de rota | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Sessão e persistência | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Logout | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |
| Anti-regressão e consistência | [ ] Validado / [ ] Validado com ressalvas / [ ] Reprovado | |

### Resultado global do BLOCO C

- [ ] **VALIDADO** — Todas as áreas validadas; critérios de aprovação atendidos.
- [ ] **VALIDADO COM RESSALVAS** — Funcionalidade atendida com ressalvas documentadas (ex.: link /login, formato user após refresh); nenhum critério de reprovação atingido.
- [ ] **REPROVADO** — Ao menos um critério de reprovação atingido; listar falhas abaixo.

**Falhas que reprovam (se houver):**  
_________________________________________________________________  
_________________________________________________________________

**Ressalvas (se válido com ressalvas):**  
_________________________________________________________________  
_________________________________________________________________

**Assinatura / responsável:** _______________

---

*Documento gerado para validação técnica completa do BLOCO C (Autenticação), projeto Gol de Ouro. Foco exclusivo em autenticação; sem mistura com pagamentos ou saldo.*
