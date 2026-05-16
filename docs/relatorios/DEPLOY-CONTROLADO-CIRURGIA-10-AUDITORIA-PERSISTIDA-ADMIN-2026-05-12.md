# DEPLOY CONTROLADO — CIRURGIA 10 AUDITORIA PERSISTIDA ADMIN (2026-05-12)

## Escopo

- **Incluído:** pré-check Git, revisão da migration, verificação remota da existência da tabela `admin_logs` em produção (via cliente Supabase), tentativa de preparação de ferramentas SQL, decisão de **não** publicar backend sem DDL aplicada.
- **Excluído:** alterações a `goldeouro-player`, painel admin, código backend (nenhuma alteração nesta sessão).
- **SQL:** apenas o ficheiro revisado `database/migrations/20260512_create_admin_logs.sql` como fonte de verdade; **nenhum** SQL ad hoc fora desse ficheiro.

## 1. Pré-check Git

**Comandos:** `git status --short`, `git log --oneline -5`

- Working tree: alterações locais não relacionadas (ex.: `goldeouro-player/vercel.json`, vários ficheiros `docs/` e `scripts/` não versionados) — **não** tocados neste deploy.
- **HEAD referência Cirurgia 10:** `3e416c0` — `fix(admin): adicionar auditoria persistida admin`

## 2. Revisão da migration

**Ficheiro:** `database/migrations/20260512_create_admin_logs.sql`

Conteúdo: `CREATE TABLE IF NOT EXISTS public.admin_logs` com colunas `id`, `admin_id` (FK `usuarios`), `action`, `target_type`, `target_id`, `metadata`, `ip`, `created_at`; comentário na tabela; três índices (`created_at DESC`, `admin_id`, `action`). Idempotente com `IF NOT EXISTS`.

## 3. Backup / snapshot lógico

- **Não executado** pelo agente (sem API de backup Supabase ou credencial Postgres de gestão no ambiente disponível).
- **Recomendação:** no painel Supabase (produção), usar fluxo de backup/snapshot suportado pelo projeto **antes** de executar o SQL da migration.

## 4. Aplicação da migration em produção

**Estado:** **NÃO aplicada** pelo agente nesta sessão.

**Verificação realizada:** script Node com `dotenv` (`.env` local), `SUPABASE_URL_PROD` + `SUPABASE_SERVICE_ROLE_KEY_PROD`, `from('admin_logs').select('id').limit(1)` → erro **PGRST205** — *Could not find the table 'public.admin_logs' in the schema cache* (tabela inexistente no projeto remoto).

**Motivo de bloqueio:** não há no ambiente do agente:

- URI Postgres (`DATABASE_URL` / pooler) para `psql` ou cliente `pg`, nem
- Supabase CLI ligado ao projeto (`supabase db push` / `sql`), nem
- token de Management API para executar DDL.

**Ação necessária (operador):** no **SQL Editor** do Supabase produção, colar e executar **exatamente** o conteúdo de `database/migrations/20260512_create_admin_logs.sql` (ficheiro do repositório, commit `3e416c0`).

## 5. Validação SQL pós-migration (referência — não executada aqui)

Queries pedidas no prompt (executar no SQL Editor após a migration):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_logs'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'admin_logs';
```

## 6. Deploy Fly (`goldeouro-backend-v2`)

**Estado:** **NÃO executado**.

**Motivo:** regra explícita *se a migration falhar, NÃO fazer deploy*; na prática a migration **não foi aplicada**, logo publicar o código novo faria com que `logAdminAction` falhasse em insert (erro tratado em consola) e **sem** auditoria persistida — incoerente com o objetivo do deploy controlado.

## 7. Validações backend pós-deploy

| Verificação | Resultado |
|-------------|-----------|
| `GET /health` | **Não repetido** nesta sessão após ausência de deploy (último estado conhecido do projeto: backend saudável em deploys anteriores). |
| `GET /meta` | idem |
| `GET /api/admin/audit/logs` com JWT admin | **Não validado** — código `3e416c0` **não** está no Fly atual; pedido de teste com token inválido devolveu **HTTP 404** (rota inexistente na versão publicada). |

## 8. Smoke persistência (`user.block` / `user.unblock` + lista de auditoria)

**Não executado** — depende de migration + deploy do commit com `admin_logs` e endpoint `GET /api/admin/audit/logs`.

## 9. `withdraw.cancel` (OK_COMPENSATED)

**Não executado** — requer backend com Cirurgia 10 e cenário seguro; sem deploy, sem smoke.

## 10. Saída final solicitada

| Campo | Valor |
|--------|--------|
| **Migration aplicada** | **NÃO** (bloqueio técnico; tabela confirmada ausente via API) |
| **Tabela `admin_logs` validada (colunas/índices)** | **NÃO** (queries não corridas; DDL não aplicada) |
| **Release Fly** | **N/A** — sem novo deploy nesta sessão |
| **Endpoint `GET /api/admin/audit/logs` validado** | **NÃO** (404 na versão atual do Fly) |
| **Eventos `user.block` / `user.unblock` gravados** | **NÃO** (sem migration + sem deploy) |
| **Eventos `withdraw.*` auditados** | **NÃO** |
| **Hash do commit deste relatório** | Ver `git log -1 --oneline` na branch (mensagem: `docs: registrar deploy controlado cirurgia 10 auditoria admin`). |
| **GO / NO-GO próximo módulo** | **NO-GO** para avançar funcionalidades que dependam de auditoria persistida até: (1) aplicar migration em prod, (2) `flyctl deploy`, (3) smoke `GET /api/admin/audit/logs` + `user.block`/`user.unblock`. **GO** para outras frentes que **não** dependam desta tabela. |

---

*Relatório honesto: deploy controlado interrompido na etapa DDL por falta de canal automatizado; nenhum código alterado nesta sessão.*
