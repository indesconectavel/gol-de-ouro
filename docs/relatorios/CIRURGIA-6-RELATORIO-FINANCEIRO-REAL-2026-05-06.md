# CIRURGIA 6 - RELATORIO FINANCEIRO REAL (2026-05-06)

## Objetivo
- Substituir o modulo de relatorio financeiro mockado por dados reais do backend.
- Garantir protecao por JWT admin e remover fallback fake em producao.

## Escopo Executado
- Backend: criacao do endpoint `GET /api/admin/financial/report` em `server-fly.js`.
- Frontend: refatoracao de `goldeouro-admin/src/pages/RelatorioFinanceiro.jsx` para consumo real.
- Sem alteracoes em player, PIX ou gameplay.

## Backend Implementado

### Endpoint
- `GET /api/admin/financial/report`
- Middlewares: `authenticateToken` + `requireAdministradorDb`

### Contrato de Resposta
```json
{
  "success": true,
  "data": {
    "receitas_depositos": 0,
    "saques_total": 0,
    "taxas_total": 0,
    "saldo_total_usuarios": 0,
    "volume_ledger": 0,
    "resultado_liquido_estimado": 0,
    "transacoes_recentes": [],
    "updated_at": "2026-05-06T00:00:00.000Z"
  }
}
```

### Regras de Calculo Aplicadas
- `receitas_depositos`: soma de `ledger_financeiro.valor` com `tipo = 'deposito'`.
- `saques_total`: soma de `ledger_financeiro.valor` com `tipo IN ('saque', 'payout_manual_confirmado')`.
- `taxas_total`: soma de `ledger_financeiro.valor` com `tipo = 'taxa'`.
- `volume_ledger`: soma geral de `ledger_financeiro.valor`.
- `resultado_liquido_estimado`: `receitas_depositos + taxas_total - saques_total`.
- `saldo_total_usuarios`: soma de `usuarios.saldo`.
- `transacoes_recentes`: ultimas 20 linhas de `ledger_financeiro` por `created_at desc`.

## Frontend Implementado
- Troca de `postData('/admin/relatorio-financeiro', {})` para `getData('/api/admin/financial/report')`.
- Remocao completa do fallback de dados fixos.
- Adicao de estados reais:
  - loading
  - erro real de API
  - estado vazio quando nao ha dados/transacoes
- Cards atualizados para exibir metricas reais do contrato novo.
- Tabela de transacoes atualizada para `transacoes_recentes` reais do ledger.
- Campo de atualizacao exibindo `updated_at`.

## Validacoes Tecnicas
- Backend: `node --check server-fly.js` -> **OK**
- Frontend: `npm run build` (goldeouro-admin) -> **OK**
  - Build concluiu com sucesso.
  - Apenas avisos informativos de browserslist/baseline mapping desatualizados.

## Risco Atual
- Sem fallback fake no modulo financeiro.
- Falhas de API agora ficam explicitas para o operador.

## GO / NO-GO
- **GO** para deploy controlado da Cirurgia 6.
- Condicao: manter validacao pos-deploy do endpoint com JWT admin e tela `/relatorio-financeiro`.
