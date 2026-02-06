# RELATÓRIO — AUDITORIA DE LOGIN & REGISTRO (READ-ONLY) — MISSÃO L1

**Data:** 2026-02-05  
**Sistema:** Gol de Ouro · Produção real  
**Modo:** READ-ONLY TOTAL (nenhuma escrita, alteração de código/schema).  
**Objetivo:** Auditar o fluxo de autenticação (registro, login, perfil) para garantir ausência de criação indevida de usuários, bypass de autenticação, escalada de privilégio e efeitos colaterais não documentados.

---

## 1. Regras aplicadas

- **Proibido:** INSERT, UPDATE, DELETE, UPSERT, RPC, triggers, migrations, reset de senha, criação de usuários.
- **Permitido:** Leitura de código, SELECT no Supabase (tabelas públicas), geração de relatório e scripts read-only.
- **Escopo:** Apenas descrever fatos; não sugerir correções nem executar ações corretivas.

---

## 2. FASE 0 — Prova de localização (código)

### 2.1 Onde ocorre o registro de usuário

| Componente | Arquivo | Linhas | Descrição |
|------------|---------|--------|-----------|
| Endpoint de registro | server-fly.js | 689-844 | `POST /api/auth/register` — implementação direta no servidor principal. |
| Verificação de email existente | server-fly.js | 701-714 | SELECT em `usuarios` por `email`; se existir, tenta login automático (722-767) ou retorna 400. |
| Inserção do usuário | server-fly.js | 785-813 | INSERT em `usuarios` (email, username, senha_hash, saldo, tipo, ativo, email_verificado, total_apostas, total_ganhos). |
| Controller alternativo (rotas) | controllers/authController.js | 15-99 | `AuthController.register` — INSERT com saldo 0, tipo 'jogador'; usado por routes/authRoutes.js. |
| Rotas que expõem register | routes/authRoutes.js | 6 | `router.post('/register', authController.register)`. |

**Fluxo real em produção:** O servidor principal (`server-fly.js`) define **diretamente** `POST /api/auth/register` (não repassa para authController). Portanto, o fluxo de registro em produção é o de **server-fly.js** (linhas 689-844).

**Auth / Supabase:** Não há uso de Supabase Auth (signUp/signIn) para registro ou login. Autenticação e perfil residem na tabela **usuarios** (senha em `senha_hash`, JWT gerado no backend).

### 2.2 Onde ocorre o login

| Componente | Arquivo | Linhas | Descrição |
|------------|---------|--------|-----------|
| Endpoint de login principal | server-fly.js | 852-991 | `POST /api/auth/login` — valida body (email, password), SELECT em usuarios por email e ativo=true, bcrypt.compare, opcional UPDATE de saldo se 0, geração de JWT. |
| Endpoint de compatibilidade | server-fly.js | 2783-2860 | `POST /auth/login` — mesma lógica de busca e bcrypt; sem crédito automático de saldo. |
| Controller alternativo | controllers/authController.js | 105-179 | `AuthController.login` — SELECT, verificação ativo, bcrypt, JWT. |
| Rotas | routes/authRoutes.js | 7 | `router.post('/login', authController.login)`. |

**Fluxo real em produção:** O servidor principal expõe `POST /api/auth/login` (server-fly.js 852-991) e `POST /auth/login` (2783-2860). Em produção, o fluxo de login é o de **server-fly.js**.

### 2.3 Onde o perfil é criado (tabela usuarios)

| Onde | Arquivo | Linhas |
|------|---------|--------|
| Único ponto de criação de perfil (registro) | server-fly.js | 785-813 |
| Criação alternativa (se rotas usassem controller) | controllers/authController.js | 47-57 |

O perfil é a própria linha em **usuarios**. Não existe tabela separada de “perfil”; não há trigger de criação de perfil pós-Auth porque não há Supabase Auth.

### 2.4 Middleware de autenticação (JWT)

| Item | Arquivo | Linhas |
|------|---------|--------|
| authenticateToken | server-fly.js | 327-349 |
| Comportamento | — | Extrai Bearer token; `jwt.verify(token, process.env.JWT_SECRET)`; em erro retorna 403 “Token inválido”; em sucesso define `req.user` e chama `next()`. |

**Dependências:** Supabase (client para tabela usuarios), bcrypt (hash/compare), jsonwebtoken (JWT), `config/system-config.js` (calculateInitialBalance).

### 2.5 Campos obrigatórios e derivados no registro (server-fly.js)

- **Obrigatórios (body):** email, password, username (linhas 691, 701-705).
- **Derivados no INSERT:** senha_hash (bcrypt, 776-777), saldo = `calculateInitialBalance('regular')` (792), tipo = 'jogador' (793), ativo = true (794), email_verificado = false (795), total_apostas = 0, total_ganhos = 0.00 (796-797).
- **Saldo inicial (config):** `config/system-config.js` — `initialBalance.regular: 0` (linha 5). Ou seja, saldo inicial em produção é **0** (não há crédito automático no registro).

### 2.6 Fluxo resumido de criação de perfil

1. Cliente chama `POST /api/auth/register` com email, password, username.
2. Backend verifica se existe usuário com mesmo email em `usuarios`; se existir, tenta login automático ou retorna “Email já cadastrado”.
3. Senão: gera senha_hash (bcrypt), insere uma linha em `usuarios` com email, username, senha_hash, saldo (0), tipo 'jogador', ativo true, etc.
4. Gera JWT (userId, email, username) e retorna token + dados do usuário. Não há criação em Supabase Auth.

---

## 3. FASE 1 — Modelo de dados (READ-ONLY)

Script executado: `scripts/audit-login-registro-readonly.js` (somente SELECT).

| Métrica | Resultado |
|---------|-----------|
| **Total de usuários (usuarios)** | 427 |
| **Usuários sem perfil em usuarios** | N/A (perfil = tabela usuarios) |
| **Perfis sem usuário Auth** | N/A (auth = tabela usuarios; não há Supabase Auth) |
| **Duplicados por email** | 0 chaves duplicadas |
| **Duplicados por telefone** | 0 chaves duplicadas |
| **Distribuição por tipo** | jogador: 426, admin: 1 |
| **Distribuição por ativo** | true: 427 |
| **Usuários com saldo zero** | 399 |

**Campos sensíveis observados:** tipo (role), saldo, ativo (status). Nenhum dado sensível (email, telefone, nome) foi exposto no relatório; contagens e agregados apenas.

---

## 4. FASE 2 — Segurança lógica (somente leitura de código)

### 4.1 Criação automática de usuário sem validação

- **Registro:** Há validação de email obrigatório e verificação de email já existente antes do INSERT. Não há criação “automática” sem body; o único INSERT em usuarios no fluxo de registro exige email, password e username.
- **Risco:** Criação só ocorre após checagem de duplicidade e hash de senha. **🟢 Seguro** no fluxo analisado.

### 4.2 Endpoints que aceitam JWT inválido

- **authenticateToken (server-fly.js 327-349):** Em token ausente retorna 401; em `jwt.verify` com falha retorna 403 “Token inválido”. Rotas protegidas usam esse middleware.
- **Conclusão:** JWT inválido ou expirado é rejeitado. **🟢 Seguro**.

### 4.3 Caminhos de criação de perfil fora do fluxo esperado

- **Único ponto de criação de perfil no servidor principal:** INSERT em registro (server-fly.js 785-813). Não foi encontrado outro INSERT em `usuarios` no fluxo de auth (login não cria usuário).
- **authController.register** (controllers/authController.js 47-57): Também faz INSERT em usuarios (saldo 0, tipo 'jogador'). Se as rotas montadas em server-fly incluírem `authRoutes` com prefixo `/api/auth`, poderia haver dois caminhos (server-fly inline e controller). No código do server-fly, as rotas `/api/auth/register` e `/api/auth/login` estão definidas **inline**; a existência de authRoutes não altera o fato de que o fluxo principal em produção é o inline.
- **🟢 Seguro** para o fluxo principal; **🟡 Atenção** se em algum ambiente as rotas de auth forem as do controller (saldo 0 no controller vs saldo calculateInitialBalance no server-fly — hoje ambos 0 por config).

### 4.4 Defaults perigosos (role, saldo inicial, flags)

| Item | Valor | Fonte | Classificação |
|------|--------|--------|----------------|
| tipo (role) no registro | 'jogador' fixo | server-fly.js 793 | 🟢 Não há default admin no registro. |
| saldo inicial no registro | calculateInitialBalance('regular') | server-fly.js 792; config: 0 | 🟢 Saldo inicial 0 em produção. |
| ativo | true | server-fly.js 794 | 🟢 Contas ativas por default; sem escalada. |
| Bootstrap admin | POST /api/admin/bootstrap | server-fly.js 2868-2904 | 🟡 Qualquer usuário autenticado pode chamar; só promove se count(admin)=0. Primeiro usuário que chamar pode virar admin (one-shot). Comportamento documentado no código; risco controlado se o endpoint for conhecido e restrito operacionalmente. |

---

## 5. FASE 3 — Classificação de risco

| Item | Classificação | Motivo |
|------|----------------|--------|
| Registro: validação de email e duplicidade | 🟢 Seguro | Verificação antes do INSERT; sem duplicados por email nos dados. |
| Registro: tipo fixo 'jogador', saldo 0 | 🟢 Seguro | Sem default admin; saldo inicial 0. |
| Login: verificação de senha e ativo | 🟢 Seguro | bcrypt.compare; ativo=true obrigatório na busca. |
| Middleware JWT | 🟢 Seguro | Token inválido rejeitado (403). |
| Único caminho de criação de perfil (server-fly) | 🟢 Seguro | INSERT apenas no registro. |
| Bootstrap admin (one-shot) | 🟡 Atenção | Escalada possível apenas para primeiro admin; requer autenticação; documentado. |
| Duplicados email/telefone em produção | 🟢 Seguro | 0 duplicados. |
| Login com UPDATE de saldo (saldo 0 → inicial) | 🟡 Atenção | Efeito colateral em login (UPDATE em usuarios); saldo inicial = 0 por config, então impacto financeiro nulo em produção. |

Nenhum item classificado como **🔴 Risco crítico**.

---

## 6. Limitações explícitas

1. **Supabase Auth:** Não utilizado; toda a auth é via tabela `usuarios` e JWT gerado no backend. Não foi auditado Supabase Auth.
2. **Rotas alternativas:** Se em algum deploy forem montadas `authRoutes` (authController) em paralelo ao server-fly, pode haver dois caminhos de registro/login; a auditoria considerou o fluxo do server-fly como o principal.
3. **Bootstrap admin:** Não foi testado em ambiente real; análise apenas estática. O risco de escalada é limitado ao primeiro admin.
4. **Rate limiting / lockout:** Existe rate limit por IP para tentativas de login (server-fly.js 270-283); não foi validado em runtime.

---

## 7. Veredito

**APTO COM RESSALVAS**

- **Não há** criação indevida de usuários no fluxo principal: registro exige email, username e senha e verifica duplicidade.
- **Não há** bypass de autenticação: JWT inválido é rejeitado; login exige senha válida e conta ativa.
- **Escalada de privilégio:** Limitada ao endpoint `/api/admin/bootstrap` (primeiro usuário autenticado pode virar admin); comportamento documentado no código — ressálva aceitável se o uso for controlado.
- **Efeitos colaterais em login:** Existe UPDATE de saldo no login quando saldo é 0 (atribuição de saldo inicial); em produção o saldo inicial configurado é 0, portanto sem impacto financeiro.

O sistema está **apto** para uso do ponto de vista de login e registro, com **ressalvas** documentadas (bootstrap admin e UPDATE de saldo no login). Nenhuma correção foi sugerida nem executada; apenas fatos e classificação.

---

**Script READ-ONLY utilizado:** `scripts/audit-login-registro-readonly.js`  
**Data do relatório:** 2026-02-05
