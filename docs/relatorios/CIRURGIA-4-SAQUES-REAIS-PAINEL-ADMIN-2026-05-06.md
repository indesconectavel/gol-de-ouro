# CIRURGIA 4 — SAQUES REAIS NO PAINEL ADMIN

**Data:** 2026-05-06  
**Escopo:** P0 saques reais no painel admin  
**Modo:** sem deploy durante implementação; validação local concluída

---

## 1) Objetivo executado

Implementado fluxo mínimo e seguro para `SaqueUsuarios.jsx` com dados reais:

- endpoint real de listagem admin no backend
- integração da tela com endpoint real
- remoção de fallback mock enganoso
- ações de approve/cancel usando endpoints reais já existentes

---

## 2) Endpoint criado

### `GET /api/admin/withdraw/list`

**Arquivo:** `server-fly.js`  
**Proteção:** `authenticateToken` + `requireAdministradorDb` (JWT Bearer + validação admin no banco)

### Contrato de entrada

- query `limit` (opcional)
  - default: `50`
  - mínimo: `1`
  - máximo: `200`
- query `status` (opcional)
  - filtro exato por status na tabela `saques`

### Contrato de saída (`success: true`)

`data[]` com:

- `id`
- `usuario_id`
- `user` (`id`, `email`, `nome`) quando disponível
- `amount`
- `valor`
- `fee`
- `status`
- `motivo_rejeicao`
- `correlation_id`
- `ledger_state` (`NONE`, `PAYOUT_ONLY`, `COMPENSATED`, `ROLLBACK_ONLY`)
- `processed_at`
- `created_at`
- `updated_at`

`meta`:

- `total`
- `limit`
- `status`

### Regras implementadas no endpoint

- ordenação por `created_at desc`
- sem exposição de dados sensíveis
- `ledger_state` calculado por `correlation_id` com apoio da tabela `ledger_financeiro`

---

## 3) Mudanças no frontend (`SaqueUsuarios.jsx`)

**Arquivo:** `goldeouro-admin/src/pages/SaqueUsuarios.jsx`

### Alterações principais

- busca real via `GET /api/admin/withdraw/list?limit=50`
- remoção da lista fixa fake (ids 1,2,3)
- sem fallback mock em erro
- estado de `loading`
- estado de erro real (`message` da falha)
- estado vazio real quando sem dados
- exibição de `ledger_state`
- ação `Aprovar` -> `POST /api/admin/withdraw/approve`
- ação `Cancelar` -> `POST /api/admin/withdraw/cancel`
- recarrega lista após approve/cancel

### Guardas de segurança de ação

- `Aprovar` habilitado apenas quando:
  - status pendente (`pendente|pending`)
  - `ledger_state === NONE`
- `Cancelar` habilitado apenas quando:
  - status pendente
  - `ledger_state` **não** em `PAYOUT_ONLY` ou `COMPENSATED`

---

## 4) Validações executadas

### Backend

- `node --check server-fly.js` -> **PASSOU**
- `node --check controllers/adminWithdrawController.js` -> **PASSOU**
- `npm test` -> **FALHOU** por ambiente sem `SUPABASE_URL` (erro de configuração, não de sintaxe da cirurgia)

### Frontend

- `npm run build` em `goldeouro-admin` -> **PASSOU**

---

## 5) Arquivos alterados

- `server-fly.js`
- `goldeouro-admin/src/pages/SaqueUsuarios.jsx`
- `docs/relatorios/CIRURGIA-4-SAQUES-REAIS-PAINEL-ADMIN-2026-05-06.md`

---

## 6) Conclusão

Escopo P0 de saques reais no painel admin foi implementado com autenticação JWT/admin e sem dados fake na tela de saques.

**Decisão para deploy controlado:** **GO**  
(recomendado validar smoke de `/api/admin/withdraw/list` + approve/cancel em ambiente controlado após publicação)

---

**Fim do relatório.**
