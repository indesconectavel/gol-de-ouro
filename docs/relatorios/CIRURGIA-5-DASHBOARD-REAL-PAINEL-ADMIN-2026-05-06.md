# CIRURGIA 5 — DASHBOARD REAL PAINEL ADMIN

**Data:** 2026-05-06  
**Escopo:** conectar dashboard admin a um único endpoint real confiável

---

## 1) Endpoint criado

**Rota backend nova:**

- `GET /api/admin/dashboard/stats`

**Arquivo:**

- `server-fly.js`

**Segurança:**

- `authenticateToken`
- `requireAdministradorDb`

---

## 2) Queries usadas

Consultas agregadas implementadas:

- `total_users`: `count(*)` em `usuarios`
- `saldo_total`: `sum(saldo)` em `usuarios` (coalesce para 0 no processamento)
- `saques_pendentes`: `count(*)` em `saques` com `status in ('pendente', 'processando')`
- `saques_total`: `count(*)` em `saques`
- `ledger_transacoes_total`: `count(*)` em `ledger_financeiro`
- `volume_financeiro_total`: `sum(valor)` em `ledger_financeiro` filtrando `tipo in ('deposito','saque','payout_manual_confirmado')`
- `updated_at`: timestamp atual ISO (`new Date().toISOString()`)

---

## 3) Contrato de retorno

```json
{
  "success": true,
  "data": {
    "total_users": 0,
    "saldo_total": 0,
    "saques_pendentes": 0,
    "saques_total": 0,
    "ledger_transacoes_total": 0,
    "volume_financeiro_total": 0,
    "updated_at": "2026-05-06T00:00:00.000Z"
  }
}
```

Em falha:

- `503` quando sistema indisponível
- `500` com mensagem real (`Erro ao consolidar métricas do dashboard` / `Erro interno do servidor`)

---

## 4) Mudanças no `Dashboard.jsx`

**Arquivo:**

- `goldeouro-admin/src/pages/Dashboard.jsx`

Mudanças aplicadas:

- passou a consumir `GET /api/admin/dashboard/stats` (via `getData`)
- removeu dependência efetiva de:
  - `/api/public/dashboard`
  - `/api/admin/stats`
  - `/api/admin/game-stats`
- removeu fallback silencioso de zeros/fake
- estados explícitos:
  - `loading`
  - `error` (mensagem real visível)
  - `empty` (quando `stats` ausente)
- mapeamento de métricas:
  - usuários -> `total_users`
  - saldo -> `saldo_total`
  - saques pendentes -> `saques_pendentes`
  - total saques -> `saques_total`
  - transações -> `ledger_transacoes_total`
  - volume -> `volume_financeiro_total`

---

## 5) Validações

### Backend

- `node --check server-fly.js` -> **PASSOU**

### Frontend

- `npm run build` em `goldeouro-admin` -> **PASSOU**

---

## 6) Arquivos alterados

- `server-fly.js`
- `goldeouro-admin/src/pages/Dashboard.jsx`
- `docs/relatorios/CIRURGIA-5-DASHBOARD-REAL-PAINEL-ADMIN-2026-05-06.md`

---

## 7) Conclusão

Dashboard admin agora está conectado a um endpoint único real e protegido por JWT admin, sem fallback fake/silencioso na tela principal.

**GO/NO-GO para deploy controlado:** **GO**

---

**Fim do relatório.**
