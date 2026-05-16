# CIRURGIA 9 — BLOQUEIO / DESBLOQUEIO REAL DE USUÁRIOS (PAINEL ADMIN)

**Data da execução técnica:** 2026-05-12  
**Escopo:** `server-fly.js` (novos endpoints), `goldeouro-admin/src/pages/Users.jsx`, chave de lista em `TableTemplate.jsx`. **Fora de escopo:** player, financeiro/saques/gameplay, auth/login, mocks, deploy.

## Endpoints criados

| Método | Rota | Middleware |
|--------|------|-------------|
| `POST` | `/api/admin/users/block` | `authenticateToken`, `requireAdministradorDb` |
| `POST` | `/api/admin/users/unblock` | `authenticateToken`, `requireAdministradorDb` |

## Contrato da API

### Pedido (JSON)

```json
{
  "userId": "<uuid>",
  "reason": "opcional"
}
```

- `userId`: obrigatório, UUID válido.
- `reason`: opcional, texto (até 500 caracteres no backend).

### Respostas

- **200** — `{ "success": true, "data": { ... } }`  
  `data` contém **apenas** campos seguros (sem `senha_hash`):  
  `id`, `email`, `nome`, `saldo`, `tipo`, `account_status` (`active` | `blocked`), `ativo`, `created_at`, `blocked_at` (quando existir no schema / select).

- **400** — validação ou regra de negócio (ex.: `userId` inválido, bloquear a própria conta, bloquear utilizador com `tipo` admin).
- **404** — utilizador alvo inexistente.
- **500** — erro interno ou falha Supabase.

### Regras de negócio (backend)

- Não bloquear nem desbloquear **a própria** conta (`userId === JWT.userId`).
- Não **bloquear** utilizadores com `tipo` admin (desbloquear admin bloqueado por dados legados continua permitido).
- Atualização de estado: `ativo` + colunas opcionais quando existirem (`account_status`, `blocked_at`, `block_reason`, `motivo_bloqueio`) via tentativas em cascata compatíveis com schema variável.
- Log estruturado (JSON em consola): `admin_id`, `target_user_id`, `action` (`block` | `unblock`), `reason`, `timestamp`.

### Refactor associado

- Lista `GET /api/admin/users/list` passou a usar `USUARIO_ADMIN_SELECT_ATTEMPTS` partilhado e `mapUsuarioRowToAdminListItem`, expondo `blocked_at` quando a coluna existir.

## Alterações no frontend (`Users.jsx`)

- Import de `postData` e estado `listVersion` / `rowActionId` para **recarregar a lista** após sucesso e **loading por linha**.
- Colunas: **Bloqueado em** (`blocked_at`), **Ações** com **Bloquear** (ativos, não-admin) e **Desbloquear** (bloqueados; para `tipo` admin só **Desbloquear** se a conta estiver bloqueada).
- `window.confirm` antes de cada ação; `window.prompt` opcional para motivo (enviado como `reason` se preenchido).
- Erros: `result.message` do backend ou mensagem genérica; `setError` visível no topo da página.

## `TableTemplate.jsx`

- `key` da linha da tabela: `row.id` quando existir (melhor estabilidade com atualizações por linha).

## Validações executadas

| Verificação | Resultado |
|-------------|------------|
| `node --check server-fly.js` | **PASSOU** |
| `npm run build` (goldeouro-admin) | **PASSOU** |

## Commits Git

| Repositório | Branch | Referência |
|-------------|--------|------------|
| Raiz `goldeouro-backend` | `fix/admin-financial-integrity-v1` | Commit com mensagem `fix(admin): adicionar bloqueio real de usuarios` (inclui `server-fly.js`, relatório e ponteiro do submodule `goldeouro-admin`). |
| Submodule `goldeouro-admin` | `painel-protegido-v1.1.0` | `562c4fc` |

## GO / NO-GO para deploy controlado

**GO** — código consistente com o contrato, build e verificação de sintaxe do servidor concluídos; deploy deve ser feito em janela controlada com smoke test em `POST /api/admin/users/block` e `unblock` + UI `/lista-usuarios`.
