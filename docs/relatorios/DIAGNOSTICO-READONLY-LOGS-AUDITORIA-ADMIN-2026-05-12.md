# DIAGNÓSTICO READ-ONLY — LOGS E AUDITORIA ADMIN (2026-05-12)

## Escopo e regras

- **Objetivo:** mapear como o backend regista (ou não) ações administrativas e financeiras sensíveis.
- **Restrições respeitadas:** sem alteração de código, sem deploy, sem alterações manuais na base de dados.
- **Foco principal:** `server-fly.js`, `controllers/adminWithdrawController.js`, domínio `src/domain/payout/processPendingWithdrawals.js`, middlewares de auth/admin referenciados no servidor Fly.

## 1. Arquitetura atual (onde vive o admin)

### 1.1 `server-fly.js` (produção Fly)

Rotas `/api/admin/*` estão **definidas inline** no mesmo ficheiro, com:

- `authenticateToken` — JWT em `Authorization: Bearer`.
- `requireAdministradorDb` — consulta `usuarios.tipo === 'admin'` no Supabase antes de seguir.

Rotas administrativas observadas:

| Método | Rota | Middleware |
|--------|------|------------|
| `GET` | `/api/admin/users/list` | `authenticateToken`, `requireAdministradorDb` |
| `POST` | `/api/admin/users/block` | idem |
| `POST` | `/api/admin/users/unblock` | idem |
| `GET` | `/api/admin/withdraw/list` | idem |
| `GET` | `/api/admin/dashboard/stats` | idem |
| `GET` | `/api/admin/financial/report` | idem |
| `POST` | `/api/admin/withdraw/approve` | idem |
| `POST` | `/api/admin/withdraw/cancel` | idem |
| `POST` | `/api/admin/bootstrap` | **apenas** `authenticateToken` (promoção one-shot a admin) |

### 1.2 `routes/adminRoutes.js` + `_archived_config_controllers/adminController.js`

Existe um **router legado** (`POST /logs`, `POST /bloquear`, `GET /lista-usuarios`, etc.) com `authAdminToken` e controladores em PostgreSQL direto (`pool`). **Não foi encontrado `app.use` deste router em `server-fly.js`** na pesquisa realizada: o painel atual em produção alinha-se às rotas **`/api/admin/...`** do ficheiro principal, não a este módulo arquivado.

### 1.3 `controllers/adminWithdrawController.js`

Orquestra chamadas a `approveWithdrawManualAdmin` e `cancelWithdrawManualAdmin`. Registos:

- **Erros:** `console.error('[ADMIN][WITHDRAW][APPROVE|CANCEL] ...')` em falhas genéricas ou exceções.
- **Sucesso:** sem log dedicado de “quem aprovou/cancelou”; o contexto HTTP (`req.user`) **não** é passado ao domínio.

## 2. Logs estruturados vs consola

### 2.1 Formato habitual

- **Prefixos textuais:** `❌ [ADMIN]...`, `🛡️ [ADMIN][USERS][ACTION]`, `💼 [FINANCE]`, `✅ [LOGIN]`, etc.
- **JSON em linha:** usado em pontos específicos (ver abaixo).
- **Destino:** **stdout/stderr** do processo Node (Fly logs, `fly logs`). Não há, no código analisado das rotas admin atuais, **INSERT** explícito numa tabela de auditoria administrativa.

### 2.2 Bloqueio / desbloqueio de utilizadores

Função `logAdminUserMutation` em `server-fly.js`:

- Emite `console.log('🛡️ [ADMIN][USERS][ACTION]', JSON.stringify({ admin_id, target_user_id, action, reason, timestamp }))`.
- **Cobertura:** apenas após mutação bem-sucedida (`block` / `unblock`).
- **Persistência:** só consola; **sem** `admin_id` ligado a IP ou user-agent no payload.

### 2.3 Aprovação / cancelamento manual de saque

Em `processPendingWithdrawals.js`, função `logManualWithdraw`:

- Prefixo fixo: `[ADMIN][WITHDRAW][MANUAL]`.
- Payload JSON (sem PII de Pix): `ts`, `event`, `withdrawal_id`, `user_id`, `correlation_id`, estados, `ledger_state`, `action`/`operation`, códigos de erro de domínio.
- **Lacuna crítica:** **não inclui `admin_id`** nem identificador do operador — o domínio só recebe `{ supabase, saqueId }` ou `{ supabase, saqueId, motivo }`. Ou seja, o rasto financeiro no `ledger_financeiro` pode existir, mas **não associa** a linha de log à conta admin que clicou no painel.

### 2.4 Eventos financeiros gerais (`financeLog` em `server-fly.js`)

- Função `financeLog(event, payload)` → `console.log('💼 [FINANCE]', ...)`.
- Usada sobretudo em fluxos de **depósito**, **webhook**, **pedido de saque** do jogador, reconciliação, etc.
- **Não** substitui auditoria admin por ação; é telemetria de domínio financeiro.

### 2.5 Login (`/api/auth/login`)

- Mensagens de consola: falhas (`usuário não encontrado`, password inválida) e sucesso genérico `✅ [LOGIN] Login realizado: <email sanitizado>`.
- **Não** distingue explicitamente “login admin” vs jogador na mensagem; **não** regista IP/`user_id` nesse log de sucesso no excerto analisado.

### 2.6 Middleware `authenticateToken` e `requireAdministradorDb`

- `authenticateToken`: logs em falhas de token (`401`/`403`).
- `requireAdministradorDb`: `console.error` em erro de Supabase; **403** silencioso em consola para “não é admin” (sem linha positiva de “acesso admin concedido a rota X”).
- **Leituras** (`GET` listagem, dashboard, relatório financeiro): em erro interno, `console.error` nas rotas; **sem** log de auditoria em pedidos bem-sucedidos.

### 2.7 `logging/sistema-logs-avancado.js`

- Módulo opcional: `server-fly.js` faz `require('./logging/sistema-logs-avancado').logger` com fallback para consola se falhar.
- **Uso em `server-fly.js`:** referência `logger` aparece de forma **marginal** (ex.: tratamento de erro global); a maior parte do código admin usa **`console.log` / `console.error` diretos**, não `logger.info` estruturado por ação.

### 2.8 Bootstrap admin (`POST /api/admin/bootstrap`)

- Em sucesso: `console.log('🛡️ [ADMIN-BOOTSTRAP] Usuário <id> promovido a admin')`.
- **Impacto:** elevado (primeiro admin); continua **só consola**.

## 3. Base de dados e endpoints de auditoria

### 3.1 Tabela `admin_logs`

- **Não** existe referência a `admin_logs` nos ficheiros SQL e migrações pesquisados neste diagnóstico.
- **Conclusão:** não há modelo dedicado “admin_logs” no repositório analisado.

### 3.2 Tabela `logs_sistema` (legado / utilitário)

- Definida em `database/schema.sql` (`nivel`, `mensagem`, `contexto` JSONB, `usuario_id`, `ip_address`, etc.).
- `database/supabase-config.js` referencia limpeza de linhas antigas em `logs_sistema`.
- **Ligação ao `server-fly.js` nas rotas `/api/admin/*`:** **não** identificada — as rotas atuais **não** escrevem nesta tabela no fluxo analisado.

### 3.3 `ledger_financeiro` e `saques`

- **Persistência forte** para **estado financeiro** e reconciliação (incluindo tipos manuais descritos nas migrações).
- **Auditoria de “ator humano admin”:** **não** modelada nos logs de consola nem, pelo contrato atual do domínio, no payload de `logManualWithdraw`.

### 3.4 Endpoint `GET /api/admin/audit/logs` (ou equivalente)

- **Não existe** no `server-fly.js` pesquisado.

## 4. Mapeamento de ações críticas

| Ação | Log em consola | Estruturado (JSON) | Persistência BD auditoria | Notas |
|------|------------------|--------------------|----------------------------|--------|
| Login (inclui admin) | Sim (sucesso/falha genéricos) | Parcial (mensagens texto) | Não | Sem flag explícita “admin”; sem IP no sucesso |
| `GET` listagens admin (users, withdraws, dashboard, financial) | Só em erro | Não (sucesso silencioso) | Não | Não dá para reconstruir “quem consultou o quê” |
| `POST` block/unblock user | Sim (`logAdminUserMutation`) | Sim | Não | Bom formato; falta BD e IP |
| `POST` withdraw approve/cancel | Erros + `logManualWithdraw` no domínio | Sim (sem admin) | Ledger/saques sim; auditoria admin não | Lacuna **admin_id** |
| Alterações financeiras (jogador/webhook) | `financeLog` + vários `console` | Parcial | Ledger/transações conforme fluxo | Não substitui trilho admin |
| `POST` bootstrap admin | Sim | Texto | Não | Ação rara mas sensível |
| Falhas auth/token | Sim | Texto | Não | — |

## 5. Classificação

### 5.1 Rastreabilidade atual

- **Baixa a média** para **responsabilização do operador** (quem fez o quê no painel).
- **Média a boa** para **integridade financeira** (ledger, estados de `saques`), independentemente de saber qual admin clicou.
- **Dependência total** de infraestrutura de **logs da Fly** (retenção, exportação, correlação) para qualquer investigação pós-facto.

### 5.2 Risco operacional

- **Incident response:** sem tabela de auditoria, correlacionar um cancelamento manual a um utilizador staff exige cruzar janelas temporais nos logs da plataforma — frágil.
- **Compliance / disputas:** difícil provar cadeia “decisão humana → efeito em conta” só com logs actuais.
- **Segurança interna:** leituras massivas de dados sensíveis (`financial/report`, listas) **não** deixam rasto dedicado.

### 5.3 Lacunas críticas

1. **Ausência de `admin_id` (e idealmente IP/UA)** nos fluxos manuais de saque (`approve`/`cancel`).
2. **Sem persistência** de eventos admin numa tabela consultável via API.
3. **Sem endpoint** de listagem de auditoria para o próprio painel.
4. **Leituras administrativas** sem registo — risco de exfiltração não detectável por aplicação.
5. **Login** sem distinção explícita e sem trilho mínimo (IP/session) ligado ao evento no código analisado.

## 6. Proposta mínima de arquitetura (apenas desenho — não implementado)

### 6.1 Tabela `admin_logs` (ou nome equivalente)

Campos mínimos sugeridos (alinhados ao pedido):

- `admin_id` (UUID, FK `usuarios`)
- `action` (texto curto, ex.: `user.block`, `withdraw.approve`)
- `target_type` (ex.: `user`, `withdrawal`, `system`)
- `target_id` (UUID ou texto nullable)
- `metadata` (JSONB — motivo, deltas, códigos de erro, etc.)
- `ip` (INET ou texto)
- `created_at` (timestamptz, default `now()`)

Índices sugeridos: `(created_at DESC)`, `(admin_id, created_at)`, `(target_type, target_id)`.

### 6.2 Endpoint

- `GET /api/admin/audit/logs` com `authenticateToken` + `requireAdministradorDb`, paginação, filtros por `action`, `admin_id`, intervalo de datas.

### 6.3 Pontos de instrumentação (para uma futura Cirurgia 10)

- Após sucesso (e opcionalmente falha controlada) em: `block`/`unblock`, `withdraw/approve`/`cancel`, `bootstrap`, e opcionalmente leituras de alto risco.
- Passar `req.user.userId`, `req.ip`, `req.get('user-agent')` a um helper `persistAdminLog(...)`.

## 7. Saída consolidada

| Pergunta | Resposta |
|----------|----------|
| **Estado actual dos logs** | Predominantemente **consola** (`console.log` / `console.error`); JSON estruturado só em **subconjuntos** (ex.: `logAdminUserMutation`, `logManualWithdraw`). |
| **Acções cobertas (algum rasto)** | Erros de auth/admin; mutações de utilizador (`block`/`unblock`) com JSON; eventos do domínio de saque manual com JSON **sem admin**; fluxos financeiros com `financeLog`; bootstrap em texto. |
| **Acções sem auditoria adequada** | Leituras admin bem-sucedidas; **identidade do admin** em approve/cancel; distinção clara login admin; persistência consultável. |
| **Persistência actual** | **Financeiro / negócio:** sim (`ledger_financeiro`, `saques`, etc.). **Auditoria admin dedicada:** **não** (sem `admin_logs`; `logs_sistema` não alimentada pelas rotas `/api/admin/*` analisadas). |
| **Proposta mínima** | Tabela `admin_logs` + `GET /api/admin/audit/logs` + instrumentação nas mutações críticas com `admin_id`, `ip`, `metadata`. |

## 8. GO / NO-GO para “Cirurgia 10” (auditoria admin)

- **GO** para **iniciar** uma Cirurgia 10 focada em **auditoria persistida + API de leitura**: o diagnóstico mostra valor claro, lacunas definidas e baixo risco de “reinventar” o que o ledger já faz para dinheiro — falta a camada **quem / quando / onde (IP)** nas decisões humanas.
- **NO-GO** hoje se o critério for **“pronto para auditoria enterprise só com o que está em produção”**: a rastreabilidade do **ator administrativo** é insuficiente para esse nível sem nova persistência.

---

*Documento read-only; alterações de código ou schema ficam fora do âmbito deste ficheiro.*
