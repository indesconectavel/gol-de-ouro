# DIAGNÓSTICO READ-ONLY — RELATÓRIO FINANCEIRO REAL

**Data:** 2026-05-06  
**Escopo:** diagnóstico técnico do módulo `RelatorioFinanceiro.jsx` (somente leitura)

---

## 1) Revisão de `RelatorioFinanceiro.jsx`

Arquivo analisado:

- `goldeouro-admin/src/pages/RelatorioFinanceiro.jsx`

Fluxo atual:

- chama `postData('/admin/relatorio-financeiro', {})`
- se falhar, entra em fallback com objeto financeiro fixo e transações fixas
- renderiza cards e tabela com base nesse objeto

---

## 2) Métricas/cards/tabelas exibidas atualmente

### Cards principais

- `Receita Total`
- `Despesas Total`
- `Lucro Total`

### Cards de período

- `Receita Hoje`
- `Receita Semana`
- `Receita Mês`

### Tabela

- `Transações Recentes` com colunas:
  - `ID`
  - `Tipo` (Entrada/Saída)
  - `Valor`
  - `Data`
  - `Status`

---

## 3) Endpoints chamados

Endpoint atual na tela:

- `POST /admin/relatorio-financeiro`

Cliente HTTP usado:

- `postData` de `goldeouro-admin/src/js/api.js` (já com `Authorization: Bearer <JWT>` quando token existe)

---

## 4) Mocks/fallbacks/dados fixos identificados

No `catch` da requisição a tela injeta dados fictícios:

- `receitaTotal: 125430.50`
- `despesasTotal: 45680.30`
- `lucroTotal: 79750.20`
- `receitaHoje`, `receitaSemana`, `receitaMes`
- `transacoes` fixas com IDs `1..5`

Conclusão:

- módulo atual usa fallback enganoso (dados financeiros fake)
- risco de leitura operacional incorreta é alto

---

## 5) Comparação com backend real ativo

No `server-fly.js` ativo:

- **não foi encontrado** endpoint `POST /admin/relatorio-financeiro`
- já existem fontes reais para compor relatório:
  - `usuarios` (saldo)
  - `saques`
  - `ledger_financeiro`
- já existe endpoint agregado real de dashboard (`/api/admin/dashboard/stats`), o que confirma viabilidade de agregações leves no backend

Conclusão:

- endpoint atual da tela é legado/inexistente no backend principal em produção

---

## 6) Endpoint mínimo recomendado

Endpoint proposto:

- `GET /api/admin/financial/report`

Segurança recomendada:

- `authenticateToken`
- `requireAdministradorDb`

---

## 7) Contrato recomendado (mínimo viável)

```json
{
  "success": true,
  "data": {
    "receitas_depositos_total": 0,
    "saques_total": 0,
    "taxas_total": 0,
    "saldo_total_usuarios": 0,
    "volume_ledger_total": 0,
    "resultado_liquido_estimado": 0,
    "ultimas_transacoes": [
      {
        "id": "uuid",
        "tipo": "deposito|saque|payout_manual_confirmado|rollback_manual",
        "valor": 0,
        "correlation_id": "uuid",
        "referencia": "string",
        "created_at": "2026-05-06T00:00:00.000Z"
      }
    ],
    "updated_at": "2026-05-06T00:00:00.000Z"
  }
}
```

### Mapeamento recomendado das métricas

- `receitas_depositos_total`: soma do ledger para tipos de depósito
- `saques_total`: soma relacionada a saques/payouts no ledger ou saques processados
- `taxas_total`: soma de taxas (`fee`) em `saques` (ou equivalente financeiro oficial)
- `saldo_total_usuarios`: soma de `usuarios.saldo`
- `volume_ledger_total`: soma de `ledger_financeiro.valor` em tipos financeiros relevantes
- `resultado_liquido_estimado`: fórmula conservadora (ex.: `receitas_depositos_total - saques_total - taxas_total`)
- `ultimas_transacoes`: últimas linhas do `ledger_financeiro` (limitado, ex.: 20)

---

## 8) Risco operacional atual

Classificação: **ALTO**

Motivos:

- tela pode exibir valores financeiros fictícios sem indicação explícita de mock
- endpoint consumido não existe no backend real ativo
- decisões financeiras podem ser tomadas com números incorretos

---

## 9) GO/NO-GO para Cirurgia Relatório Financeiro Real

- **GO** para iniciar a cirurgia (escopo e contrato já bem definidos)
- **NO-GO** para uso operacional do módulo atual em produção

---

## 10) Saída objetiva solicitada

- **métricas atuais:** receita/despesa/lucro + período + tabela transações
- **quais são mockadas:** fallback completo do módulo (objeto financeiro + transações fixas)
- **endpoint necessário:** `GET /api/admin/financial/report`
- **contrato recomendado:** seção 7
- **GO/NO-GO:** **GO** para cirurgia, **NO-GO** para operação com estado atual

---

**Fim do diagnóstico.**
