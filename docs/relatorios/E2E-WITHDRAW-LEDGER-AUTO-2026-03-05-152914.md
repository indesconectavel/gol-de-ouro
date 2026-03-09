# E2E Withdraw/Ledger — Automação

**RunId:** e2e-1772735354902  
**Timestamp:** 2026-03-05T18:29:14.902Z

---

## 1. Contexto e objetivo

Execução automática do fluxo de saque/ledger em produção: precheck, health, fly status, env assert, execução do saque (create-test-withdraw-live.js), coleta de logs e decisão PASS/FAIL/INCONCLUSIVO.
## 2. Precheck frontend
| URL | Status |
|-----|--------|
| https://www.goldeouro.lol/ | HTTP 200 OK |
| https://www.goldeouro.lol/game | HTTP 200 OK |

## 3. Health backend
| URL | Status |
|-----|--------|
| https://goldeouro-backend-v2.fly.dev/health | HTTP 200 OK |

## 4. Fly status
- **VERSION:** REGION	STATE  	ROLE	CHECKS            	LAST UPDATED
- **IMAGE:** goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM
- **Machines:**
  - app 2874551a105768 | version 312 | gru
  - app e82d445ae76178 | version 312 | gru
  - payout_worker e82794da791108 | version 312 | gru

## 5. Env assert
- BEARER: OK
- PIX_KEY: OK
- PIX_KEY_TYPE: email
- WITHDRAW_AMOUNT: 10

## 6. Exec do saque
- **statusCode:** 500
- **success:** false
- **message:** Erro ao registrar saque
- **saqueId:** (não retornado)

## 7. Logs filtrados
Logs coletados com: fallback (flyctl sem --since): --no-tail
Motivo fallback: unknown flag: --since

### App
  [2m2026-03-05T18:21:40Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]🔄 [SAQUE] Início {
  [2m2026-03-05T18:21:40Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772734901392'
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]❌ [SAQUE] Erro ao registrar ledger (saque): {
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  code: '22P02',
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  message: 'invalid input syntax for type uuid: "hotfix-ledger-live-test-1772734901392"'
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]↩️ [SAQUE][ROLLBACK] Início {
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772734901392',
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  motivo: 'Erro ao registrar ledger do saque'
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]✅ [SAQUE][ROLLBACK] Concluído {
  [2m2026-03-05T18:21:41Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772734901392'
  [2m2026-03-05T18:29:15Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]🔄 [SAQUE] Início {
  [2m2026-03-05T18:29:15Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772735356949'
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]❌ [SAQUE] Erro ao registrar ledger (saque): {
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  code: '22P02',
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  message: 'invalid input syntax for type uuid: "hotfix-ledger-live-test-1772735356949"'
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]↩️ [SAQUE][ROLLBACK] Início {
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772735356949',
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  motivo: 'Erro ao registrar ledger do saque'
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]✅ [SAQUE][ROLLBACK] Concluído {
  [2m2026-03-05T18:29:16Z[0m app[2874551a105768] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772735356949'

### Payout worker
  [2m2026-03-05T18:21:55Z[0m app[e82794da791108] [32mgru[0m [[34minfo[0m]✅ [SAQUE][ROLLBACK] Concluído {
  [2m2026-03-05T18:21:55Z[0m app[e82794da791108] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772734901392'
  [2m2026-03-05T18:21:55Z[0m app[e82794da791108] [32mgru[0m [[34minfo[0m]❌ [PAYOUT][FALHOU] rollback acionado {
  [2m2026-03-05T18:21:55Z[0m app[e82794da791108] [32mgru[0m [[34minfo[0m]  correlationId: 'hotfix-ledger-live-test-1772734901392',

### Contagens
- "invalid input syntax for type uuid": 2
- "22P02": 2
- "Erro ao registrar ledger": 4
- "[LEDGER] insert falhou": 0
- "insert falhou (airbag)": 0
- "rollbackWithdraw": 0
- "falha_payout": 0

## 8. Heurística PASS/FAIL
- **Veredito:** FAIL
- **Justificativa:** Detectado erro 22P02 ou "invalid input syntax for type uuid" nos logs (2 + 2 ocorrências). Causa: correlation_id não-UUID no INSERT do ledger.

## 9. Próximos passos
- Se INCONCLUSIVO: defina BEARER e PIX_KEY no PowerShell e rode novamente `npm run test-withdraw-e2e`.
- Se FAIL: verifique os logs filtrados e a causa (22P02, ledger, rollback).
- Se PASS: saque/ledger E2E em produção está ok; opcional limpar envs (ver instrução abaixo).

---

### Higiene (PowerShell)

Remover envs após o teste:

```powershell
Remove-Item Env:BEARER -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue
Remove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue
```
