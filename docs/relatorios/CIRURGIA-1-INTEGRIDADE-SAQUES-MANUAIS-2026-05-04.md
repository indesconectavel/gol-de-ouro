# Cirurgia 1 — Integridade financeira dos saques manuais (approve / cancel)

**Data:** 2026-05-04  
**Branch:** `fix/admin-financial-integrity-v1`  
**Escopo:** Apenas fluxo admin de **aprovação manual** e **cancelamento manual** do saque. Sem listagem admin, mocks, dashboard, relatórios genéricos, exportações nem rotas não relacionadas.

## Problema endereçado

Evitar e expor explicitamente o estado impossível / incoerente:

- `ledger_financeiro.tipo ∈ { payout_confirmado, payout_manual_confirmado }` para o par `referencia` / `correlation_id` do saque, enquanto `saques.status` permanece **`pendente`**, por gravação de ledger **antes** de confirmar atualização persistente em `saques`.

## Alterações realizadas

### 1. `src/domain/payout/processPendingWithdrawals.js`

#### `approveWithdrawManualAdmin`

- **Validações mantidas/reforçadas:** saque existe, `correlation_id` presente, status permitido (pendente ou já `pago_manual` para deduplicação), bloqueio com rollback prévio (`HAS_ROLLBACK`).
- **Detecção de inconsistência prévia (`INVARIANT_BROKEN`):** existe linha de payout no ledger (`payout_confirmado` ou `payout_manual_confirmado`) para o mesmo `correlation_id` + `referencia` (saque), e o saque segue pendente → retorno explícito com código `INVARIANT_BROKEN` (não tenta nova gravação).
- **Nova ordem transacional (servidor):**
  1. `UPDATE saques`: `pendente`/`pending` → `pago_manual` com `processed_at` / `updated_at` (com filtros `.in('status', ['pendente','pending'])` para não atualizar estado inválido).
  2. Só então `createLedgerEntry` com `payout_manual_confirmado`.
  3. Se o ledger falhar: **compensação explícita** — `UPDATE` reverte `saques` para `pendente`, `processed_at = null`, condicionado a `status = 'pago_manual'`. Retorno `LEDGER_WRITE_FAILED` com `compensated: true/false`.
- **Idempotência:** `createLedgerEntry` já deduplica por `correlation_id` + `tipo` + `referencia`. Se corrida faz com que o `UPDATE` não afete linhas, releitura do saque como `pago_manual` → sucesso deduplicado.
- **Logs seguros (`logManualWithdraw`):** `withdrawal_id`, `user_id`, `correlation_id`, `status_previous`, `status_final`, `operation`, `code` quando aplicável — sem valor monetário detalhado, chave Pix ou outros PII em payload.

#### `cancelWithdrawManualAdmin`

- **`TERMINAL_SAQUE_PAGO`:** bloqueio antecipado se `saques.status` já for terminal de pagamento conhecido no domínio (`pago_manual`, `processado`, `concluido`, etc.), com `ALREADY_PAID`, além da checagem existente no ledger (`payout_confirmado` / `payout_manual_confirmado`).
- **Logs** nas entradas/saídas e bloqueios (mesmo padrão do approve).
- **Delegação:** continua usando `rollbackWithdrawManualAdmin` para crédito de saldo + ledger `rollback_manual` + `cancelado_manual` (comportamento de domínio já existente; não reordenado nesta cirurgia).

### 2. `controllers/adminWithdrawController.js`

- **`INVARIANT_BROKEN`:** HTTP **409** com mensagem orientando suporte.
- **`LEDGER_WRITE_FAILED`:** HTTP **503** se compensação bem-sucedida; HTTP **500** se `compensated === false` (reversão do saque falhou após falha de ledger).

## Ordem transacional resumida (approve manual)

```text
1) SELECT saque (+ checagens ledger / rollback / invariante)
2) UPDATE saques pendente → pago_manual  (atômico no sentido de filtro de status)
3) INSERT ledger payout_manual_confirmado (idempotente via createLedgerEntry)
   Se falha → UPDATE saques pago_manual → pendente (compensação)
```

**Nota:** O Supabase client HTTP não oferece transação única multi-tabela sem RPC; a estratégia é **ordem segura + compensação explícita** no approve.

## Validações executadas

| Verificação | Resultado |
|-------------|-----------|
| `node --check src/domain/payout/processPendingWithdrawals.js` | OK |
| `node --check controllers/adminWithdrawController.js` | OK |
| `npm test` | Falhou: `supabaseUrl is required` (ambiente sem variáveis Supabase no runner) |
| `npm run lint` | Script inexistente no `package.json` |

## Riscos remanescentes

1. **`rollbackWithdrawManualAdmin`** ainda grava ledger / saldo / `saques` em múltiplos passos via REST (sem transação única). Falhas parciais no cancel podem exigir intervenção; fora do recorte desta cirurgia, que focou o bug do **approve** (ledger antes de `saques`).
2. **`INVARIANT_BROKEN`:** registros já corrompidos no banco continuam exigindo correção manual ou job de reconciliação.
3. **Compensação do approve:** se `processed_at` for `NOT NULL` sem default aceitando `NULL` no schema, o revert pode falhar — validar contrato da coluna em produção.
4. **Status desconhecidos:** novos status de “pago” não listados em `TERMINAL_SAQUE_PAGO` podem passar pelo guard de status mas ainda ser bloqueados pelo ledger.

## Referências de diagnóstico (base)

- `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`
- `docs/relatorios/PRE-EXECUCAO-BLOCO-FINANCEIRO-SAQUES-MANUAIS-2026-05-04.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-PAINEL-ADMIN-COMPLETO-2026-05-04.md`
- `docs/relatorios/ISOLAMENTO-ESCOPO-PRE-CIRURGIA-ADMIN-FINANCEIRO-2026-05-04.md`

## Deploy

**Não realizado** nesta entrega, conforme instrução.
