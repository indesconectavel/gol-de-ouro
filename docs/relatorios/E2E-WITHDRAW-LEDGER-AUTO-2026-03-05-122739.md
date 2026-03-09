# E2E Withdraw/Ledger — Automação

**RunId:** e2e-1772724459222  
**Timestamp:** 2026-03-05T15:27:39.222Z

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
- BEARER: MISSING
- PIX_KEY: MISSING
- PIX_KEY_TYPE: MISSING
- WITHDRAW_AMOUNT: MISSING

## 6. Exec do saque
- **statusCode:** (não disponível)
- **success:** false
- **message:** BEARER ausente ou inválido. Defina BEARER=Bearer <jwt>
- **saqueId:** (não retornado)
- **NO-CALL:** sim (falta de credenciais)

## 7. Logs filtrados
Logs coletados com: --since 15m (janela ampliada).

### App
        --verbose               Verbose outputError: unknown flag: --since

### Payout worker
        --verbose               Verbose outputError: unknown flag: --since

### Contagens
- "invalid input syntax for type uuid": 0
- "22P02": 0
- "Erro ao registrar ledger": 0
- "[LEDGER] insert falhou": 0
- "insert falhou (airbag)": 0
- "rollbackWithdraw": 0
- "falha_payout": 0

## 8. Heurística PASS/FAIL
- **Veredito:** INCONCLUSIVO (sem credenciais)
- **Justificativa:** BEARER ou PIX_KEY ausentes; saque não foi chamado. Defina as envs e execute novamente.

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
