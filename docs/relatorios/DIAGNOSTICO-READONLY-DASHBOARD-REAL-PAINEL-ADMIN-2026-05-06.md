# DIAGNÓSTICO READ-ONLY — DASHBOARD REAL PAINEL ADMIN

**Data:** 2026-05-06  
**Escopo:** diagnóstico técnico do dashboard admin, sem alterações de código/deploy/banco

---

## 1) Revisão de `Dashboard.jsx`

Arquivo: `goldeouro-admin/src/pages/Dashboard.jsx`

Fluxo atual:
- carrega estado `stats` com campos:
  - `totalUsers`
  - `activeUsers`
  - `totalGames`
  - `totalTransactions`
  - `totalRevenue`
  - `totalWithdrawals`
  - `netBalance`
- chama `dataService.getGeneralStats()`
- renderiza:
  - `DashboardCardsResponsive`
  - `GameDashboard`

Observação crítica:
- `DashboardCardsResponsive` e `GameDashboard` **não usam efetivamente** esse `stats` passado pela página (dependem de fluxos internos próprios).

---

## 2) Cards/métricas exibidos atualmente

## 2.1 `DashboardCardsResponsive` / `DashboardCards`

Arquivos:
- `goldeouro-admin/src/components/DashboardCardsResponsive.jsx`
- `goldeouro-admin/src/components/DashboardCards.jsx`

Métricas exibidas:
- Usuários
- Jogos
- Apostas
- Na Fila
- tabela “Jogos Recentes” com linhas sintéticas derivadas de `games.total`

Fonte de dados:
- chama `GET /api/public/dashboard`

Fallbacks/mocks:
- em erro, usa `defaultData` (zeros + estrutura fixa)
- em ambiente com mock habilitado, usa `mockDashboardData`
- tabela de “Jogos Recentes” usa conteúdo sintético (ex.: `Jogo #total-2`)

## 2.2 `GameDashboard`

Arquivo: `goldeouro-admin/src/components/GameDashboard.jsx`

Métricas exibidas:
- Total de Jogos
- Total de Jogadores
- Prêmios Pagos
- Total de Chutes
- Gol de Ouro / próximo gol
- Total Apostado

Fonte de dados:
- atualmente `fetchStats()` e `fetchGames()` retornam **dados zerados fixos**

Fallbacks/mocks:
- comportamento inteiro está hardcoded para zero/array vazio em produção
- não há consumo real de endpoint nesse componente hoje

---

## 3) Endpoints chamados e existência no backend real

Backend real considerado: `server-fly.js` ativo.

### Chamadas do dashboard atual

1. `GET /api/public/dashboard`
   - usado por `DashboardCardsResponsive`/`DashboardCards`
   - **não identificado** no `server-fly.js` ativo
   - existe apenas em arquivos legados/alternativos (`router.js`, `router-database.js`, `routes/publicDashboard.js`)

2. `GET /api/admin/stats`
   - usado por `dataService.getGeneralStats()`
   - **não identificado** no `server-fly.js` ativo

3. `GET /api/admin/game-stats`
   - usado por `dataService.getGameStats()` (não usado pelo fluxo atual do `GameDashboard`)
   - **não identificado** no `server-fly.js` ativo

Conclusão:
- fluxo atual do dashboard depende de endpoints inexistentes no backend principal ou de dados fixos.

---

## 4) O que está mockado/fallback hoje

- `DashboardCardsResponsive.jsx`: fallback para zeros quando API falha
- `DashboardCards.jsx`: fallback para `mockDashboardData`/zeros + jogos recentes sintéticos
- `GameDashboard.jsx`: dados zerados fixos em toda execução
- `dataService.getGeneralStats()`: fallback para zeros quando `GET /api/admin/stats` falha

---

## 5) Contrato mínimo recomendado

Endpoint proposto:
- `GET /api/admin/dashboard/stats`

Auth:
- `Authorization: Bearer <JWT>`
- middleware admin real (`authenticateToken` + `requireAdministradorDb`)

## 5.1 Resposta recomendada (payload mínimo)

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

## 5.2 Mapeamento das métricas ao banco (recomendado)

- `total_users`: `usuarios` (count)
- `saldo_total`: soma de `usuarios.saldo`
- `saques_pendentes`: count em `saques` com status pendente/pending
- `saques_total`: count total em `saques`
- `ledger_transacoes_total`: count em `ledger_financeiro`
- `volume_financeiro_total`: soma de valor monetário do ledger (coluna vigente no schema, conforme padrão financeiro atual)

---

## 6) Risco operacional atual

Classificação: **ALTO**

Motivos:
- dashboard pode aparentar “funcionar” com zeros/mock sem refletir produção real
- endpoints usados não existem no backend principal
- decisões operacionais podem ser tomadas com números não confiáveis

---

## 7) GO/NO-GO para Cirurgia Dashboard Real

- **GO** para iniciar cirurgia de Dashboard Real (escopo técnico claro)
- **NO-GO** para considerar dashboard atual como fonte confiável de operação

---

## 8) Saída objetiva solicitada

- **métricas atuais:** usuários, jogos, apostas, fila, jogos recentes sintéticos, blocos financeiros/jogo zerados
- **quais são mockadas:** maioria do dashboard atual (fallback zeros, mockData e dados hardcoded)
- **endpoint necessário:** `GET /api/admin/dashboard/stats`
- **contrato recomendado:** seção 5
- **GO/NO-GO Cirurgia Dashboard Real:** **GO** (cirurgia), **NO-GO** (estado atual para operação)

---

**Fim do diagnóstico.**
