# E2E Withdraw/Ledger — Automação

**RunId:** e2e-1772730626913  
**Timestamp:** 2026-03-05T17:10:26.913Z

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
- **statusCode:** 403
- **success:** false
- **message:** Token inválido
- **saqueId:** (não retornado)

## 7. Logs filtrados
Logs coletados com: fallback (flyctl sem --since): --no-tail
Motivo fallback: unknown flag: --since

### App
  (nenhuma linha correspondente aos filtros)

### Payout worker
  (nenhuma linha correspondente aos filtros)

### Contagens
- "invalid input syntax for type uuid": 0
- "22P02": 0
- "Erro ao registrar ledger": 0
- "[LEDGER] insert falhou": 0
- "insert falhou (airbag)": 0
- "rollbackWithdraw": 0
- "falha_payout": 0

## 8. Heurística PASS/FAIL
- **Veredito:** FAIL
- **Justificativa:** Chamada ao saque retornou success=false. message: Token inválido

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
