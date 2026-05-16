# CIRURGIA 10 — AUDITORIA PERSISTIDA ADMIN (2026-05-12)

## Objetivo

Trilho mínimo de auditoria administrativa: tabela `admin_logs`, helper central, integração em mutações críticas e endpoint de leitura protegido por JWT admin.

## Alterações entregues

### Banco

- **Ficheiro:** `database/migrations/20260512_create_admin_logs.sql`
- **Tabela:** `public.admin_logs` com campos: `id` (uuid, PK, `gen_random_uuid()`), `admin_id` (uuid, FK `usuarios(id)`), `action` (text), `target_type` (text), `target_id` (text), `metadata` (jsonb, default `{}`), `ip` (text), `created_at` (timestamptz, default `now()`).
- **Índices:** `created_at DESC`, `admin_id`, `action`.

### Backend

- **Helper:** `src/utils/adminAuditLogger.js`
  - `logAdminAction({ supabase, adminId, action, targetType, targetId, metadata, ip })` — INSERT em `admin_logs`; falhas só em consola (não quebra o fluxo HTTP).
  - `getClientIp(req)` — `X-Forwarded-For` (primeiro hop) ou `req.ip`; truncagem de tamanhos; metadata limitada em bytes para evitar payloads excessivos.
  - **Não** persiste senhas, tokens ou dados bancários/PIX; motivos de texto apenas como comprimento (`reason_len` / `motivo_len`), não o texto integral.

- **`server-fly.js`**
  - `POST` fluxos `user.block` / `user.unblock`: após `logAdminUserMutation`, chama `logAdminAction` com `action` `user.block` / `user.unblock`, `targetType` `user`, `targetId` = UUID do alvo.

- **`controllers/adminWithdrawController.js`**
  - Passa `adminActorId: req.user.userId` a `approveWithdrawManualAdmin` e `cancelWithdrawManualAdmin`.
  - Após sucesso HTTP (`result.success`), chama `logAdminAction` com `withdraw.approve` ou `withdraw.cancel`.
  - Resposta `200` em `OK_COMPENSATED` (cancel) também regista auditoria com `outcome: ok_compensated`.

- **`src/domain/payout/processPendingWithdrawals.js`**
  - `approveWithdrawManualAdmin({ supabase, saqueId, adminActorId })` e `cancelWithdrawManualAdmin({ ..., adminActorId })`.
  - `logManualWithdraw` inclui `admin_actor_id` no JSON de consola quando fornecido (trilho operacional em Fly logs).

- **Novo endpoint:** `GET /api/admin/audit/logs`
  - Middlewares: `authenticateToken`, `requireAdministradorDb`.
  - Query: `limit` (default 50, min 1, max 200), `action` (filtro exato), `admin_id` (UUID opcional; validação 400 se inválido).
  - Resposta: `{ success: true, data: [...] }` com linhas da tabela (campos selecionados).

### Frontend / player

- **Não** criada página nova (contrato API pronto para cirurgia futura).
- **Player:** não alterado.

## Validações locais (sem deploy)

Comandos executados com sucesso (exit code 0):

- `node --check server-fly.js`
- `node --check src/utils/adminAuditLogger.js`
- Adicionalmente: `node --check controllers/adminWithdrawController.js`, `node --check src/domain/payout/processPendingWithdrawals.js`

## Pré-requisito de deploy

1. Aplicar a migration `20260512_create_admin_logs.sql` no Supabase (ou pipeline SQL equivalente) **antes** de colocar o backend que faz `INSERT` em `admin_logs` em produção; caso contrário, inserts falham (erro tratado em consola; respostas de negócio podem continuar OK mas **sem** auditoria persistida).
2. Após a tabela existir, smoke: login admin → `GET /api/admin/audit/logs?limit=5` → mutação de teste → novo `GET` com filtro `action`.

## GO / NO-GO deploy controlado

- **GO** após migration aplicada no ambiente alvo e smoke mínimo de `INSERT` + `GET /api/admin/audit/logs`.
- **NO-GO** deploy de código sem migration: inserts falham silenciosamente no helper (auditoria perdida).

## Commit

- Mensagem: `fix(admin): adicionar auditoria persistida admin`
- Identificador do objeto commit: usar `git rev-parse HEAD` no repositório após pull (evita divergência com amend).
