# PROVA — Ledger financeiro em produção (POST /api/withdraw/request 500)

**Data:** 2026-03-04  
**App Fly:** goldeouro-backend-v2  
**Objetivo:** Evidência READ-ONLY da causa do 500 "Erro ao registrar saque" (falha em `createLedgerEntry` / insert em `ledger_financeiro`).

---

## 1. Snapshot (versão e infra)

| Item | Valor |
|------|--------|
| App | goldeouro-backend-v2 |
| Máquina app (checks 1/1) | 2874551a105768 (withered-cherry-5478) |
| Process group | app |
| Região | gru |
| Imagem | goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J |
| Repo | goldeouro-backend (server-fly.js, processPendingWithdrawals.js) |

---

## 2. PASSO A — Levantamento local (repo)

### 2.1 Função createLedgerEntry

- **Arquivo:** `src/domain/payout/processPendingWithdrawals.js`
- **Linhas:** 5–43

Trecho relevante (insert):

```javascript
const { data, error } = await supabase
  .from('ledger_financeiro')
  .insert({
    tipo,
    usuario_id: usuarioId,
    valor: parseFloat(valor),
    referencia,
    correlation_id: correlationId,
    created_at: new Date().toISOString()
  })
  .select('id')
  .single();
```

- **Tabela:** `ledger_financeiro`
- **Colunas usadas no insert:** `tipo`, `usuario_id`, `valor`, `referencia`, `correlation_id`, `created_at`

### 2.2 Schema de referência (database/schema-ledger-financeiro.sql)

```sql
create table if not exists ledger_financeiro (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  tipo text not null check (tipo in ('deposito', 'saque', 'taxa', 'rollback', 'payout_confirmado', 'falha_payout')),
  usuario_id uuid not null,
  valor numeric(12,2) not null,
  referencia text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_financeiro_usuario_idx on ledger_financeiro (usuario_id);
create index if not exists ledger_financeiro_created_idx on ledger_financeiro (created_at);
create unique index if not exists ledger_financeiro_correlation_tipo_ref_idx on ledger_financeiro (correlation_id, tipo, referencia);
```

- **Constraints/checks:** CHECK em `tipo` com os valores listados.
- **Índice único:** `(correlation_id, tipo, referencia)`.

### 2.3 Uso de SUPABASE_SERVICE_ROLE_KEY em produção

- **Arquivo:** `database/supabase-unified-config.js` (linhas 49–58): `supabaseAdmin` é criado com `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- **server-fly.js** (linha 120): `let supabase = supabaseAdmin;` — o handler de saque usa o cliente admin.
- **Conclusão:** Em produção o server usa **SUPABASE_SERVICE_ROLE_KEY**; RLS é bypassado. A falha não é por RLS.

---

## 3. PASSO B — Prova no ambiente real (Fly container)

### 3.1 Máquina e método

- **Máquina:** 2874551a105768 (process group **app**), started, checks 1/1.
- **Script:** Enviado via `flyctl ssh sftp put` para `/tmp/ledger_probe.js`; executado com `NODE_PATH=/app/node_modules` para resolver `@supabase/supabase-js`.

### 3.2 Output completo do script (sem secrets)

```
SUPABASE_URL_PRESENT true
SUPABASE_URL_LEN 40
SERVICE_ROLE_PRESENT true
SERVICE_ROLE_LEN 219
TABLE_EXISTS true
TABLE_ROW_COUNT 0
SCHEMA_SELECT_OK false
SCHEMA_ERROR_MESSAGE column ledger_financeiro.usuario_id does not exist
SCHEMA_ERROR_DETAILS 
TIPO_SELECT_OK true
TIPO_DISTINCT_VALUES (nenhum)
LEDGER_PROBE_DONE ok
```

### 3.3 Evidência de existência da tabela

- **TABLE_EXISTS:** true — a tabela `ledger_financeiro` **existe** no projeto Supabase usado em produção.
- **TABLE_ROW_COUNT:** 0 — tabela vazia (nenhum insert bem-sucedido com o schema atual do código).

### 3.4 Evidência do schema real (divergência)

- **SCHEMA_SELECT_OK:** false.
- **SCHEMA_ERROR_MESSAGE:** `column ledger_financeiro.usuario_id does not exist`.
- **Conclusão:** No banco real a coluna **`usuario_id`** **não existe**. O código e o `database/schema-ledger-financeiro.sql` usam `usuario_id`; o schema aplicado no Supabase de produção não contém essa coluna (ou usa outro nome, ex.: `user_id`).
- **TIPO_SELECT_OK:** true — a coluna `tipo` existe; `select('tipo').limit(50)` funcionou.
- **Índice único (correlation_id, tipo, referencia):** Não foi possível provar via SELECT (apenas sintomas). A falha do insert ocorre antes por coluna ausente.

### 3.5 Logs Fly (erro real)

- Consultados logs recentes (janela curta) com padrões: "Erro ao registrar ledger", "ledger_financeiro", "usuario_id", "relation does not exist", "column does not exist", "permission denied", "violates check constraint".
- **Resultado:** Nenhuma linha encontrada com a mensagem exata do Supabase nessa janela.
- **Limitação:** Logs recentes não continham o erro; a causa raiz foi inferida pelo script de probe (SELECT com colunas esperadas).

---

## 4. PASSO C — Diagnóstico final com ranking

### 4.1 Top-1 causa raiz (com base no erro real encontrado)

**Divergência de schema: a coluna `usuario_id` não existe na tabela `ledger_financeiro` no Supabase de produção.**

- O insert em `createLedgerEntry` envia `usuario_id`. O Postgres/Supabase devolve erro do tipo "column ledger_financeiro.usuario_id does not exist", o que faz `createLedgerEntry` retornar `{ success: false, error }` e o handler (antes do patch S1) retornar 500 "Erro ao registrar saque".

### 4.2 Top-3 alternativas (se não houver erro real nos logs)

1. **Coluna `usuario_id` ausente no ambiente** (confirmado pelo probe — é a causa real).
2. **Tabela criada com outro nome de coluna (ex.: `user_id`)** — mesmo efeito: insert falha por coluna inexistente.
3. **Schema `ledger_financeiro` nunca aplicado por completo no projeto Supabase de produção** — apenas uma versão antiga ou parcial foi aplicada, sem `usuario_id`.

### 4.3 Próxima ação recomendada (mais segura, READ-ONLY não altera)

- **Recomendação:** Aplicar o schema de referência no Supabase correto (projeto usado por produção), garantindo a coluna `usuario_id` e as demais do `database/schema-ledger-financeiro.sql`.  
  Ou, se no banco real a coluna tiver outro nome (ex.: `user_id`), **ajustar o código** para usar o nome existente no banco, em vez de alterar o banco (conforme política de mudanças).
- **Verificação prévia:** No Supabase (SQL Editor ou migração), confirmar as colunas atuais de `ledger_financeiro`. Se existir `user_id` e não `usuario_id`, a correção mais segura pode ser apenas no código (mapear `usuario_id` → `user_id` no insert).
- **Não fazer:** Inserir/alterar dados ou schema durante esta missão (READ-ONLY).

---

## 5. Resumo executivo

- **Tabela:** `ledger_financeiro` **existe** em produção.
- **Credenciais:** SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY presentes no container (apenas boolean e LEN no relatório).
- **Erro real observado:** `column ledger_financeiro.usuario_id does not exist` (Supabase/Postgres), obtido via SELECT de prova no container.
- **Causa raiz:** O schema da tabela em produção não possui a coluna `usuario_id` esperada pelo código e pelo `schema-ledger-financeiro.sql`.
- **Próximo passo seguro:** Alinhar schema do banco ao `database/schema-ledger-financeiro.sql` (incluindo `usuario_id`) no projeto Supabase de produção, ou adaptar o código ao schema real (ex.: usar o nome de coluna já existente).
