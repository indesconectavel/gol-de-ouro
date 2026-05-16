# CIRURGIA 3 — Travar saque manual na origem

**Data:** 2026-05-05  
**Escopo:** backend de saque manual/admin (sem painel, sem alteração de dados, sem migration)

## Causa raiz

- O fluxo manual permitia transições perigosas quando existia `payout_manual_confirmado` no ledger sem status terminal coerente no saque.
- O cancelamento manual tratava alguns casos compensados como "já pago", gerando resposta ambígua para cenário com `rollback_manual`.
- O insert no ledger aceitava fallback para `usuario_id`, mas o schema real observado exige `user_id` como campo obrigatório.

## Arquivos alterados

- `src/domain/payout/processPendingWithdrawals.js`
- `controllers/adminWithdrawController.js`

Arquivo revisado sem alteração:

- `server-fly.js` (rotas já delegam para controller correto)

## Regra nova de approve manual

- Aprovação manual agora calcula `ledger_state` antes de qualquer escrita.
- Bloqueia com `INVARIANT_BROKEN` quando há `payout_manual_confirmado` com saque ainda pendente (`PAYOUT_ONLY + pendente`).
- Bloqueia com `OK_COMPENSATED` quando já existe compensação (`payout_manual_confirmado + rollback_manual`), evitando marcar como pago real.
- Mantém ordem segura:
  1. valida status (`pendente|pending`);
  2. atualiza saque para `pago_manual`;
  3. grava ledger `payout_manual_confirmado`;
  4. se ledger falhar, reverte saque para `pendente` e retorna erro explícito (`LEDGER_WRITE_FAILED`).
- Detecta rollback prévio (`ROLLBACK_ONLY`) e retorna erro seguro (`HAS_ROLLBACK`).

## Regra nova de cancel manual

- Cancelamento calcula `ledger_state` e diferencia pagamento real x estado compensado:
  - `PAYOUT_ONLY` => bloqueia com `INVARIANT_BROKEN` (não cancela silenciosamente).
  - `COMPENSATED` + status cancelado/cancelado_manual => retorna sucesso idempotente (`OK_COMPENSATED`), sem mensagem "já pago".
  - status pago terminal sem compensação => mantém bloqueio `ALREADY_PAID`.
- Continua exigindo status pendente para operação efetiva de cancelamento com rollback administrativo.

## Tratamento de estados compensados

Classificação defensiva implementada:

- `NONE`
- `PAYOUT_ONLY`
- `ROLLBACK_ONLY`
- `COMPENSATED`

Interpretação operacional:

- `payout_manual_confirmado + saque pendente` => **INVARIANT_BROKEN**
- `payout_manual_confirmado + rollback_manual` => **COMPENSATED** (não pago real)
- `saque cancelado/cancelado_manual + rollback_manual` => **OK_COMPENSATED**
- status fora do esperado => **INVALID_STATUS**

## Ajuste de schema no ledger

- `insertLedgerRow` agora usa **somente `user_id`** no `ledger_financeiro`.
- Foi removido fallback automático para `usuario_id`.
- Isso evita gravar novos registros incompatíveis com o schema real observado.

## Logs estruturados reforçados

Os eventos de approve/cancel agora incluem, além de `withdrawal_id`, `user_id`, `correlation_id`:

- `status`
- `status_previous`
- `status_final`
- `ledger_state`
- `action`
- `code` (quando aplicável)

## Validações executadas

- `node --check src/domain/payout/processPendingWithdrawals.js` ✅
- `node --check controllers/adminWithdrawController.js` ✅
- `node --check server-fly.js` ✅
- `npm test` ⚠️ falhou por ambiente local sem `supabaseUrl` (`Error: supabaseUrl is required.`)
- `npm run lint` ⚠️ não executado (projeto sem script/config de lint)

## Riscos remanescentes

- `rollbackWithdrawManualAdmin` ainda finaliza em `cancelado_manual`; se regra de negócio exigir convergência para `cancelado` em todo fluxo, precisa alinhamento de contrato (fora desta cirurgia).
- Testes automatizados dependem de variáveis de ambiente Supabase válidas; sem isso, não há validação E2E local.
- Não houve mudança no painel/admin UI (por regra de escopo), então mensagens novas dependem da camada API já ajustada.

## Checklist de teste recomendado

- [ ] Approve com saque pendente e sem ledger prévio => `pago_manual` + `payout_manual_confirmado`.
- [ ] Approve com `payout_manual_confirmado` + pendente => 409 `INVARIANT_BROKEN`.
- [ ] Approve com `rollback_manual` existente => 409 (`HAS_ROLLBACK` ou `OK_COMPENSATED` conforme estado).
- [ ] Cancel com `payout_manual_confirmado` sem rollback => 409 `INVARIANT_BROKEN`.
- [ ] Cancel com saque já compensado (`rollback_manual`) => 200 idempotente `OK_COMPENSATED`.
- [ ] Verificar logs estruturados contendo `withdrawal_id`, `user_id`, `correlation_id`, `status`, `ledger_state`, `action`.

## Parecer

- **GO condicionado** para deploy controlado do backend, com validação em staging/produção monitorada.
- **NO-GO** para deploy sem variáveis de ambiente Supabase corretas e sem checklist manual dos cenários de invariantes.
