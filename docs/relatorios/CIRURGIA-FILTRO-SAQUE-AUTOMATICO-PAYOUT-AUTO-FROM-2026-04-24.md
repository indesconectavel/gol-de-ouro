# Cirurgia — Filtro seguro para saque automático (`PAYOUT_AUTO_FROM_AT`)

**Data:** 2026-04-24  
**Modo:** cirurgia controlada (código apenas; sem deploy, sem ativar worker, sem commit obrigatório no momento do relatório).

## Objetivo

Garantir que o processamento de saque automático (função `processPendingWithdrawals`) **só considere** linhas com `created_at >=` ao valor de `PAYOUT_AUTO_FROM_AT`, após **validação de data/hora ISO-8601**.

## Regra implementada

1. Lê `process.env.PAYOUT_AUTO_FROM_AT` (obrigatório para “processar” a fila).
2. String vazia, ausente ou `Date.parse` inválido → log de erro explícito, retorno imediato **sem** query de pagamento e **sem** chamada ao Mercado Pago.
3. Válida → `new Date(t).toISOString()` como valor comparado; query em `saques` com:
   - `status IN ('pendente', 'pending')`
   - `.gte('created_at', isoNormalizada)`
   - `order('created_at', { ascending: true })`
   - `limit(1)`  
4. O corte efetivo é logado: `Corte mínimo created_at (PAYOUT_AUTO_FROM_AT) aplicado: { payoutAutoFromAt: '<iso>' }`.

## Arquivos

| Ficheiro | Alteração |
|----------|-----------|
| `src/domain/payout/processPendingWithdrawals.js` | `parsePayoutAutoFromAt()`, validação, early return, `.gte('created_at', ...)`, logs |
| `src/workers/payout-worker.js` | Log de arranque com valor (ou indicação de ausência) de `PAYOUT_AUTO_FROM_AT` |

## Comportamento esperado

| Cenário | Comportamento |
|--------|---------------|
| `PAYOUT_AUTO_FROM_AT` ausente ou vazia | Erro claro, retorno com `payoutAutoFromAtInvalid: true` (e `error`), **0** saques processados, **0** chamadas MP |
| `PAYOUT_AUTO_FROM_AT` com texto inválido | Idem (não-ISO) |
| `PAYOUT_AUTO_FROM_AT` ISO válida | Filtro `created_at >=` aplicado; se não houver linhas no intervalo, “Nenhum saque pendente” no fluxo normal |

**Nota:** `PAYOUT_PIX_ENABLED` falso ainda desliga o payout antes de validar a env (comportamento anterior).

## Risco financeiro

- **Rebaixado (controlo):** com env vazia/inválida, **não** há pagamento automático; com env correta, só entram saques a partir do corte — evita pagar a fila antiga por engano ao reativar o worker.
- **Operacional:** se a env for esquecida após reativar `PAYOUT_PIX_ENABLED` e o worker, nenhum saque será pago até configurar `PAYOUT_AUTO_FROM_AT` (falha segura, mas requer ação consciente).

## Validação recomendada

- `node --check` nos `.js` alterados  
- `git diff` de revisão  
- Teste manual: sem env → log de erro e retorno; com `PAYOUT_AUTO_FROM_AT=2026-01-01T00:00:00.000Z` → query com `.gte` coerente

## Decisão

- **PRONTO PARA COMMIT** após passar `node --check` e review do diff (dependente only da execução local).
