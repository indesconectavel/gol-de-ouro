# Relatório — Migração da tabela `admin_logs` (2026-05-12)

## Contexto

Este documento descreve a **migration SQL** que materializa a auditoria administrativa persistida (Cirurgia 10). Serve de guia para revisão e aplicação no Supabase ou outro Postgres alinhado ao projeto. Relatórios complementares: `CIRURGIA-10-AUDITORIA-PERSISTIDA-ADMIN-2026-05-12.md`, `DEPLOY-CONTROLADO-CIRURGIA-10-AUDITORIA-PERSISTIDA-ADMIN-2026-05-12.md`, `DEPLOY-CONTROLADO-FINAL-CIRURGIA-10-AUDITORIA-ADMIN-2026-05-12.md`.

## Ficheiro fonte

| Item | Valor |
|------|--------|
| Caminho | `database/migrations/20260512_create_admin_logs.sql` |
| Idempotência | `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` |
| Comentário na tabela | Auditoria mínima de ações administrativas (sem segredos nem PII sensível) |

## Esquema criado

**Tabela** `public.admin_logs`:

| Coluna | Tipo | Restrições / notas |
|--------|------|---------------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `admin_id` | `uuid` | NOT NULL, FK `public.usuarios(id)` com `ON DELETE RESTRICT` |
| `action` | `text` | NOT NULL |
| `target_type` | `text` | opcional |
| `target_id` | `text` | opcional (identificador alvo, ex. UUID de utilizador) |
| `metadata` | `jsonb` | NOT NULL, default `'{}'::jsonb` |
| `ip` | `text` | opcional |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Índices:**

- `admin_logs_created_at_idx` em `(created_at DESC)`
- `admin_logs_admin_id_idx` em `(admin_id)`
- `admin_logs_action_idx` em `(action)`

## Dependências

- A tabela `public.usuarios` deve existir com coluna `id` do tipo compatível com a FK antes da migration (já é o caso no modelo atual do produto).
- O backend (`src/utils/adminAuditLogger.js`) faz `INSERT` nesta tabela via cliente Supabase com credencial de serviço; a leitura listada expõe `GET /api/admin/audit/logs` em `server-fly.js`. Sem esta tabela aplicada, os inserts falham de forma tratada (consola), e o endpoint de listagem pode devolver erro 500 conforme o estado do schema cache.

## Procedimento recomendado (produção)

1. **Backup ou snapshot** lógico do projeto Supabase (ou política interna equivalente) antes de DDL.
2. No **SQL Editor** do ambiente alvo, executar o conteúdo **integral** do ficheiro `20260512_create_admin_logs.sql` tal como está no repositório (sem adicionar colunas ou políticas não revistas em código).
3. **Validar** com as queries abaixo.

## Validação pós-aplicação

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

Smoke funcional mínimo (após deploy do backend com Cirurgia 10): login administrador, `GET /api/admin/audit/logs?limit=5`, executar uma mutação auditada (ex. bloquear/desbloquear utilizador de teste), voltar a chamar o `GET` e confirmar linhas com `action` esperado.

## Notas de segurança e dados

- O desenho assume que **não** se grava em `metadata` texto livre de motivos sensíveis, senhas, tokens ou dados bancários; o helper em código trunca e sanitiza metadados (ver `adminAuditLogger.js`).
- Esta migration **não** define RLS na tabela; o acesso à escrita/leitura em produção fica na responsabilidade do backend (service role) e das rotas autenticadas.

## Reversão

Não há script de rollback versionado neste repositório. Remover a tabela em produção (`DROP TABLE public.admin_logs CASCADE`) só deve ser considerado com coordenação explícita (perda de histórico de auditoria e impacto na FK). Para correções de esquema, preferir migrations adicionais idempotentes em ficheiros novos datados.

---

*Relatório de apoio à migration; alterações de código e deploy Fly estão documentadas nos relatórios de Cirurgia 10 citados no início.*
