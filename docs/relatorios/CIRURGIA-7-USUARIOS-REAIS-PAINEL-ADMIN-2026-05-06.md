# CIRURGIA 7 - USUARIOS REAIS NO PAINEL ADMIN (2026-05-06)

## Objetivo
Conectar a tela de usuarios (`Users.jsx`) aos dados reais do Supabase via novo endpoint admin, removendo dependencia de rota legada inexistente e fallbacks enganosos.

## Escopo executado
- Backend: `GET /api/admin/users/list` em `server-fly.js` com `authenticateToken` + `requireAdministradorDb`.
- Frontend: `goldeouro-admin/src/pages/Users.jsx` consumindo o endpoint via `getData`, com loading, erro real, vazio e filtros.
- Correcao incidental: rota `GET /api/admin/withdraw/list` restaurada apos correcao estrutural no mesmo arquivo (comportamento preservado; apenas variavel local do map para `classifyWithdrawLedgerState` renomeada para clareza).
- Sem alteracoes em player, login, financeiro, saques funcionais além da restauracao acima.

## Endpoint criado

### Rota
`GET /api/admin/users/list`

### Query params
| Param | Descricao |
|-------|-----------|
| `limit` | Opcional, padrao **50**, minimo 1, maximo **200** |
| `search` | Opcional, texto em **email**, **nome** e **username** (se a coluna existir), via `ilike` |
| `status` | Opcional: **`all`** (padrao), **`active`** (`ativo = true`), **`blocked`** (`ativo = false`) |

### Contrato de resposta
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "nome": "Nome ou username",
      "saldo": 0,
      "tipo": "jogador",
      "account_status": "active",
      "ativo": true,
      "created_at": "2026-05-06T00:00:00.000Z",
      "blocked_at": null
    }
  ],
  "meta": {
    "limit": 50,
    "count": 10,
    "status": "all",
    "search": null
  }
}
```

### Mapeamento e privacidade
- `account_status`: `active` se `ativo === true`, senao `blocked`.
- `blocked_at`: sempre **`null`** (coluna nao assumida no schema base; sem inventar dados).
- Campos **nao** expostos: `senha_hash`, tokens, `cpf_cnpj` ou outros sensiveis — apenas colunas explicitas no `select`.
- Se a coluna **`username`** nao existir no banco, segunda tentativa automatica sem `username` no `select` e na clausula `or` de busca.

## Frontend (`Users.jsx`)

### Alteracoes
- Substituicao de `POST /admin/usuarios` por `GET /api/admin/users/list?limit=50` (com `search` e `status` quando aplicavel).
- Estados: carregamento inicial, atualizacao com lista ja carregada, erro exibido, lista vazia com mensagem honesta.
- Busca com debounce (**400 ms**) ao digitar; filtro de status com recarregamento imediato quando `search` vazio.
- Tabela: nome, email, saldo, tipo, status da conta (`account_status`), data de criacao.
- Cards de resumo explicitamente rotulados como totais **da pagina atual** (evita falsa sensacao de totais globais com `limit`).

### Remocoes
- Imports e referencias a mocks (`mockData`, helpers de environment nao utilizados).
- Endpoint legado inexistente.

## Validacoes tecnicas
- `node --check server-fly.js` — **OK**
- `npm run build` (pasta `goldeouro-admin`) — **OK**

## GO / NO-GO deploy controlado
- **GO** para deploy controlado (backend + admin), apos merge/push da branch e smoke com JWT admin na rota nova e tela `/usuarios` (ou rota equivalente no painel).
