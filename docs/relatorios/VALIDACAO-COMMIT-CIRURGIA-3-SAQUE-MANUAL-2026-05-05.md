# VALIDAÇÃO + COMMIT — CIRURGIA 3 SAQUE MANUAL

**Data:** 2026-05-05

## 1) Comandos solicitados executados

- `git status --short`
- `git diff -- src/domain/payout/processPendingWithdrawals.js controllers/adminWithdrawController.js`
- `git diff -- docs/relatorios/CIRURGIA-3-TRAVAR-SAQUE-MANUAL-NA-ORIGEM-2026-05-05.md`
- `node --check src/domain/payout/processPendingWithdrawals.js`
- `node --check controllers/adminWithdrawController.js`
- `node --check server-fly.js`

## 2) Confirmações obrigatórias

- Ledger usa `user_id` no insert: **SIM** (`LEDGER_USER_COLUMN = 'user_id'` + `insertLedgerRow` usando essa coluna).
- `usuario_id` no INSERT de ledger: **NÃO** (fallback removido no `insertLedgerRow`).
- `OK_COMPENSATED`: **SIM** (domínio + controller).
- `INVARIANT_BROKEN`: **SIM** (domínio + controller).
- Cancel em estado compensado não retorna “já pago”: **SIM** (retorna sucesso idempotente com mensagem de compensado no controller).

## 3) Checks executados

- `node --check src/domain/payout/processPendingWithdrawals.js` ✅
- `node --check controllers/adminWithdrawController.js` ✅
- `node --check server-fly.js` ✅

Observação: `npm test` não faz parte da lista desta validação/commit final.

## 4) Arquivos preparados para commit desta cirurgia

- `src/domain/payout/processPendingWithdrawals.js`
- `controllers/adminWithdrawController.js`
- `docs/relatorios/CIRURGIA-3-TRAVAR-SAQUE-MANUAL-NA-ORIGEM-2026-05-05.md`
- `docs/relatorios/VALIDACAO-COMMIT-CIRURGIA-3-SAQUE-MANUAL-2026-05-05.md`

## 5) Parecer

- **GO** para deploy controlado apenas após janela operacional e monitoramento.
- **NO-GO** para deploy sem checklist de invariantes compensados no ambiente alvo.
