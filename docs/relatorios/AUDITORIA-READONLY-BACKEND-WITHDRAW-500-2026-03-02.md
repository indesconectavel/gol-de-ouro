# Auditoria 100% READ-ONLY — Backend Saque PIX (POST /api/withdraw/request → 500)

**Data:** 2026-03-02  
**Escopo:** Gol de Ouro Backend (somente leitura). Nenhuma alteração de código, branch, commit, push, deploy, migrations, .env ou banco.

---

## 1) Confirmação de modo READ-ONLY

**Modo READ-ONLY backend ativado.**

Comandos executados (somente leitura):

```
git rev-parse --abbrev-ref HEAD
chore/hotfix-versionwarning-spam-safe

git rev-parse HEAD
9fe91f4152f2374cc412246e63037a3e4cccaf3e

git status --porcelain
( várias linhas ?? docs/relatorios/... )

git remote -v
origin  https://github.com/indesconectavel/gol-de-ouro.git (fetch)
origin  https://github.com/indesconectavel/gol-de-ouro.git (push)
```

**Alterações pendentes:** `git status --porcelain` retornou conteúdo (arquivos untracked em docs/relatorios). Registrado; nenhuma correção aplicada.

---

## 2) Local exato do endpoint

| Item | Valor |
|------|--------|
| **Rota** | `POST /api/withdraw/request` |
| **Arquivo** | `server-fly.js` |
| **Linha** | 1394 |
| **Middleware** | `authenticateToken` |
| **Handler** | async (req, res) => { ... } (L1394–1665) |

Trecho relevante (L1393–1430):

```javascript
// Solicitar saque PIX
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    const { valor, chave_pix, tipo_chave } = req.body;
    const userId = req.user.userId;
    const correlationId = String(
      req.headers['x-idempotency-key'] ||
      req.headers['x-correlation-id'] ||
      crypto.randomUUID()
    );
    // ...
    const withdrawData = {
      amount: valor,
      pixKey: chave_pix,
      pixType: tipo_chave,
      userId: userId
    };
    const validation = await pixValidator.validateWithdrawData(withdrawData);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    // ...
    if (!dbConnected || !supabase) {
      return res.status(503).json({ success: false, message: 'Sistema temporariamente indisponível' });
    }
```

Não existe controller separado; o handler está inline em `server-fly.js`. Validação de payload é feita por `utils/pix-validator.js` → `validateWithdrawData(withdrawData)` (L478–523).

---

## 3) Fluxo completo do handler

### 3.1 Autenticação

- **Middleware:** `authenticateToken` (L1394). Se token inválido/ausente, o middleware responde (geralmente 401). Não é a origem do 500 dentro do handler.
- **req.user:** Handler usa `req.user.userId` (L1396). Se o middleware não preencher `req.user`, acesso a `req.user.userId` pode lançar exceção → capturada pelo `catch` final (L1658–1664) → **500 "Erro interno do servidor"**.

### 3.2 Validação de payload

- **Campos esperados do body:** `valor`, `chave_pix`, `tipo_chave` (L1396). São mapeados para `withdrawData`: `amount`, `pixKey`, `pixType`, `userId` (L1406–1411).
- **pix-validator.js L478–523:** `validateWithdrawData` espera `amount`, `pixKey`, `pixType`, `userId`. Valida valor entre 0,50 e 1.000, chave PIX e disponibilidade. Em falha retorna `{ valid: false, error }` → handler devolve **400** (L1415–1419). Se `valor` for `undefined`, `amount` fica `undefined` e a validação falha com 400, não 500.
- **Conclusão:** Validação de payload não gera 500; gera 400 com mensagem clara.

### 3.3 Verificação de saldo

- **Tabela:** `usuarios` (L1506–1510). **Coluna:** `saldo` (L1507).
- **Lógica:** `select('saldo').eq('id', userId).single()`. Se `userError || !usuario` → **404** "Usuário não encontrado". Se `parseFloat(usuario.saldo) < requestedAmount` → **400** "Saldo insuficiente". Nenhum desses caminhos retorna 500.

### 3.4 Inserção na tabela `saques`

- **Linhas:** 1545–1571.
- **Insert:** `.from('saques').insert({ usuario_id, valor, amount, fee, net_amount, correlation_id, pix_key, pix_type, chave_pix, tipo_chave, status: 'pendente', created_at }).select().single()`.

Colunas usadas no INSERT (conforme código):

- `usuario_id`, `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`

Se alguma coluna **não existir** na tabela `saques` em produção, o Supabase retorna erro → `saqueError` (L1569) → handler faz rollback de saldo e retorna **500** "Erro ao criar saque" (L1570–1583). **Este é um ponto crítico de possível 500.**

### 3.5 Ledger (createLedgerEntry)

- **Linhas:** 1590–1610 (débito saque) e 1612–1635 (taxa). `createLedgerEntry` vem de `src/domain/payout/processPendingWithdrawals.js` (L3–41). Insere em **`ledger_financeiro`** (tipo, usuario_id, valor, referencia, correlation_id).
- Se a tabela **`ledger_financeiro`** não existir ou a inserção falhar, `createLedgerEntry` retorna `{ success: false, error }`. O handler chama `rollbackWithdraw` e retorna **500** "Erro ao registrar saque" (L1598–1610 ou L1622–1634).
- **Conclusão:** Falha ao inserir em `ledger_financeiro` ou em rollback pode gerar 500.

### 3.6 Try/Catch global

- **L1658–1664:** `catch (error) { console.error('❌ [SAQUE] Erro:', error); res.status(500).json({ success: false, message: 'Erro interno do servidor' }); }`
- Qualquer exceção não tratada no try (ex.: `req.user` undefined, erro inesperado do Supabase, erro em `rollbackWithdraw`) cai aqui e vira **500** com mensagem genérica.

---

## 4) Estrutura de banco utilizada

### 4.1 Tabela `saques` — duas variantes de schema no repositório

**Variante A — SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql (L92–103):**

- Colunas: `id`, `usuario_id`, `valor`, `valor_liquido`, `taxa`, `chave_pix`, `tipo_chave`, `status`, `created_at`, `updated_at`.
- **Não possui:** `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`.

**Variante B — aplicar-schema-supabase-automated.js / schema que adiciona colunas (APLICAR-SCHEMA, etc.):**

- Colunas adicionais: `amount`, `pix_key`, `pix_type` (e em alguns scripts `correlation_id` via schema-ledger).

**database/schema-ledger-financeiro.sql:**

- `ALTER TABLE saques ADD COLUMN IF NOT EXISTS correlation_id text;`

### 4.2 Inconsistência código vs schema Consolidado

O handler insere:

- `valor`, `amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`, `pix_type`, `chave_pix`, `tipo_chave`, `status`, `created_at`

Se a base real tiver sido criada **apenas** com o schema Consolidado (variante A), sem as migrations/scripts que adicionam `amount`, `fee`, `net_amount`, `pix_key`, `pix_type`, `correlation_id`, o **INSERT falha** com erro do Postgres/Supabase (coluna inexistente) → **500 "Erro ao criar saque"**.

### 4.3 Tabela `ledger_financeiro`

- **Arquivo:** `database/schema-ledger-financeiro.sql`
- Colunas: `id`, `correlation_id`, `tipo`, `usuario_id`, `valor`, `referencia`, `created_at`.
- Se esta tabela não existir no ambiente, `createLedgerEntry` falha → 500 "Erro ao registrar saque".

---

## 5) Variáveis de ambiente

- **Obrigatórias (server-fly.js L50–53):** `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Validadas no boot por `assertRequiredEnv`. Se faltar em produção, o app pode não subir ou falhar cedo.
- **Saque (L1518):** `PAGAMENTO_TAXA_SAQUE` — usada como `parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00')`. Se ausente, usa 2.00; não gera 500.
- **Supabase:** Sem `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`, o cliente não é criado; o handler verifica `!dbConnected || !supabase` e retorna **503** (L1431–1436), não 500.
- **PIX/worker:** Payout e Mercado Pago usam variáveis próprias; o POST /api/withdraw/request **não** chama PIX diretamente (o worker processa depois). Falta de config de PIX não explica 500 neste endpoint.

---

## 6) Pontos que podem gerar 500 (ordenados por probabilidade)

| # | Ponto | Onde | Mensagem HTTP | Probabilidade |
|---|--------|------|----------------|----------------|
| 1 | **INSERT em `saques` falha por coluna inexistente** | L1546–1571 | "Erro ao criar saque" | **Alta** — Código usa colunas (amount, fee, net_amount, pix_key, pix_type, correlation_id) que não existem no schema Consolidado; se produção estiver nesse schema, o INSERT quebra. |
| 2 | **INSERT em `ledger_financeiro` falha** (tabela inexistente ou RLS) | L1591–1595, createLedgerEntry | "Erro ao registrar saque" | **Média** — Se ledger_financeiro não foi aplicado ou RLS bloquear insert. |
| 3 | **Exceção não tratada** (ex.: req.user undefined, erro inesperado) | Qualquer ponto do try | "Erro interno do servidor" | **Média** — catch genérico retorna 500. |
| 4 | **Erro na query de idempotência** (existingWithdrawError) | L1445–1450 | "Erro ao verificar idempotência do saque" | Baixa — Query simples; mais provável se tabela/coluna mudou. |
| 5 | **Erro na query de saques pendentes** (pendingError) | L1482–1486 | "Erro ao verificar saques pendentes" | Baixa — Idem. |

---

## 7) O que verificar nos logs do Fly (sem executar)

- Procurar por:
  - `❌ [SAQUE] Erro ao criar saque:` — seguido do objeto de erro do Supabase (código/mensagem). Indica falha no INSERT em `saques` (ex.: coluna inexistente).
  - `❌ [SAQUE] Erro ao registrar ledger (saque):` — falha em `createLedgerEntry` (tabela ledger_financeiro ou constraint).
  - `❌ [SAQUE] Erro:` — exceção no catch global; stack trace indica linha exata.
- Confirmar no log se o erro do Supabase é do tipo "column does not exist" ou "relation does not exist".
- Verificar se antes do 500 há linha `🔄 [SAQUE] Início` (confirma que o request chegou e passou pelo início do handler).

---

## 8) Plano de correção sugerido (SEM EXECUTAR)

1. **Confirmar schema real da tabela `saques` em produção** (via Supabase Dashboard ou query read-only em informação de colunas). Comparar com as colunas usadas no INSERT em server-fly.js L1552–1565.
2. **Se faltarem colunas:** Aplicar migration/script que adicione apenas as colunas faltantes (`amount`, `fee`, `net_amount`, `pix_key`, `pix_type`, `correlation_id` conforme necessário) com `ADD COLUMN IF NOT EXISTS`, sem dropar dados. Ou, alternativamente, alterar o handler para inserir **apenas** as colunas que existem no schema atual (ex.: só valor, valor_liquido, taxa, chave_pix, tipo_chave, status, created_at se for o caso), mantendo compatibilidade com o schema real.
3. **Confirmar existência de `ledger_financeiro`** no mesmo ambiente. Se não existir, aplicar `database/schema-ledger-financeiro.sql` (ou equivalente) em janela de manutenção.
4. **Melhorar resposta de erro no handler:** Em `saqueError` (L1569) e no catch global (L1659), logar o objeto de erro completo e, se seguro, devolver `message: saqueError.message` ou mensagem genérica sem vazar detalhes internos, para facilitar diagnóstico no frontend sem expor stack.
5. **Não alterar** fluxo do frontend (endpoint, payload valor/chave_pix/tipo_chave); o frontend está correto.

---

## Resumo executivo

- **Causa mais provável do 500:** Falha no **INSERT em `saques`** por **incompatibilidade de schema**: o código insere colunas `amount`, `fee`, `net_amount`, `pix_key`, `pix_type`, `correlation_id` que não existem no schema Consolidado documentado no repo. Se o banco de produção tiver sido criado a partir desse schema, o Supabase retorna erro e o handler responde 500 "Erro ao criar saque".
- **Tipo:** Bug de **schema/coluna** (tabela `saques` com conjunto de colunas diferente do que o código usa). Não é falha de validação de payload nem de integração PIX neste endpoint (o PIX é acionado depois pelo worker).
- **Frontend:** Está correto: envia POST /api/withdraw/request com `valor`, `chave_pix`, `tipo_chave`; o backend mapeia para amount/pixKey/pixType e valida; a quebra ocorre na escrita em banco.
- **Próximo passo recomendado:** Consultar logs do Fly para a mensagem exata do Supabase no "Erro ao criar saque" e, em seguida, alinhar o schema da tabela `saques` (e, se necessário, `ledger_financeiro`) ao que o handler usa, ou adaptar o handler ao schema real, com deploy e teste em ambiente de staging antes de produção.
