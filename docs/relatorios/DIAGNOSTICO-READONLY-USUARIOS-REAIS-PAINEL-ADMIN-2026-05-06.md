# DIAGNOSTICO READ-ONLY - USUARIOS REAIS PAINEL ADMIN (2026-05-06)

## Objetivo
Diagnosticar o modulo `Users.jsx` antes da cirurgia de conexao com backend real, sem alterar codigo, deploy ou banco.

## 1) Revisao da tela atual (`goldeouro-admin/src/pages/Users.jsx`)

### Lista exibida
- A tela renderiza tabela de usuarios a partir do estado `users`.
- Possui busca por `name` e `email`.

### Campos mostrados
- `name` (Nome)
- `email`
- `status` (badge: `active`/`blocked`)
- `balance` (Saldo)
- `createdAt`
- `lastLogin`

### Acoes disponiveis
- Nao ha botoes de acao por linha (ex.: bloquear, editar, resetar senha).
- Tela hoje e basicamente de listagem + busca.

## 2) Endpoint atual usado pela tela
- Chamada atual: `postData('/admin/usuarios', {})`.
- Metodo atual: **POST**.
- Auth: passa JWT via cliente global (`Authorization: Bearer`) quando token existe.

## 3) Situacao de backend real (server-fly.js)
- Nao foi encontrado endpoint `POST /admin/usuarios`.
- Nao foi encontrado endpoint `GET /api/admin/users` ou equivalente de listagem de usuarios admin.
- Portanto, a rota consumida por `Users.jsx` esta **inexistente** no backend ativo.

## 4) Fallback/mock atual
- `Users.jsx` importa `shouldUseMockData`, `shouldFallbackToMock` e `mockUsers`, mas **nao aplica fallback real no catch**.
- No erro de API, apenas loga erro e encerra loading; resultado pratico: tabela vazia (sem dados reais e sem mock funcional).
- Classificacao de fallback no modulo: **PARCIAL/INCONSISTENTE** (imports de mock existem, uso efetivo nao).

## 5) Comparacao com estrutura de usuarios no backend

### Evidencias no backend
- Endpoints recentes (`withdraw/list`) consultam `usuarios` com `id, email, nome, username`.
- Outros trechos usam `usuarios.tipo`, `usuarios.saldo`, `usuarios.ativo`, `usuarios.created_at`, `usuarios.last_login`.
- Nao ha evidencia no backend atual de colunas `account_status` e `blocked_at` como contrato consolidado.

### Observacao de modelagem
- Em schema historico, status de conta aparece mais como `ativo` (boolean) e tipo com valores como `jogador/admin/moderador`.
- Para o painel admin, pode-se mapear `account_status` derivado de `ativo`.

## 6) Endpoint minimo recomendado

### Proposta
- **GET `/api/admin/users/list`**

### Seguranca
- Middlewares: `authenticateToken` + `requireAdministradorDb`.
- Sem fallback fake em producao.

### Contrato recomendado
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "saldo": 0,
      "tipo": "admin|user",
      "account_status": "active|blocked",
      "created_at": "2026-05-06T00:00:00.000Z",
      "blocked_at": null
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Regras de mapeamento sugeridas
- `tipo`:
  - `admin` quando `usuarios.tipo = 'admin'`
  - `user` para demais perfis (ex.: `jogador`, `moderador`) no contrato minimo do painel
- `account_status`:
  - `active` quando `usuarios.ativo = true`
  - `blocked` quando `usuarios.ativo = false`
- `blocked_at`:
  - usar coluna real se existir
  - se nao existir, retornar `null` no contrato minimo (sem inventar dado)

## 7) Classificacao (OK / MOCK / QUEBRADO)
- **Status da tela Users hoje: QUEBRADO**
  - Motivo: endpoint consumido pela UI nao existe no backend real ativo.
- **Mock/Fallback: INCONSISTENTE**
  - imports de mock existem, mas nao ha fallback efetivo na listagem.

## 8) Risco

### Operacional
- Alto: painel pode aparentar ausencia total de usuarios por falha de integracao, impactando operacao administrativa.

### Seguranca
- Medio/Alto: visao incompleta de usuarios prejudica auditoria e resposta a incidentes (contas admin, contas bloqueadas, rastreabilidade basica).

## 9) GO / NO-GO para cirurgia usuarios reais
- **GO** para iniciar a cirurgia de usuarios reais com endpoint dedicado e contrato minimo acima.
- **NO-GO** para depender do modulo atual em operacao real enquanto `Users.jsx` permanecer em `POST /admin/usuarios`.
