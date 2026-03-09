# E2E Withdraw — Prova Ledger (exec controlado)

**Data:** 2026-03-04  
**Modo:** EXEC CONTROLADO + EVIDÊNCIAS  
**Proibido:** player, Vercel, workflows, deploy, schema/migrations, reinício Fly. Não colar JWT nem PIX_KEY completa no relatório.

---

## PASSO 0 — Pré-check rápido (read-only)

**Comandos executados:**
- `Invoke-WebRequest -Uri "https://www.goldeouro.lol/game" -Method Head`
- `Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method Head`
- `flyctl status -a goldeouro-backend-v2`

| Verificação | Resultado |
|-------------|-----------|
| **/game** | **200** (esperado) |
| **/health** | **200** (esperado) |
| **VERSION** | 312 |
| **IMAGE** | goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM |
| **app** (2874551a105768) | started, 1 passing |
| **payout_worker** (e82794da791108) | started |

---

## PASSO 1 — Preparar variáveis (NÃO registrar valores)

As variáveis devem ser definidas pelo **operador** no PowerShell antes de rodar o script de saque:

```powershell
$env:BEARER="Bearer <TOKEN_DO_NETWORK>"
$env:PIX_KEY="<SUA_CHAVE_PIX_REAL>"
$env:PIX_KEY_TYPE="email"
$env:WITHDRAW_AMOUNT="10"
```

**Nesta execução automática** (sem credenciais no ambiente):
- BEARER definido? [ ] SIM  *(não definido no shell de automação)*
- PIX_KEY definido? [ ] SIM  *(não definido no shell de automação)*
- PIX_KEY_TYPE: email
- WITHDRAW_AMOUNT: 10

*Para prova E2E real: o operador marca [X] SIM após definir BEARER e PIX_KEY no próprio terminal.*

---

## PASSO 2 — Baseline: pendentes antes

**Comando:** `node scripts/check-pending-saques-live-test.js`

**Saída:**
```json
{"pending":[],"count":0}
```

- **count:** 0  
- **ids:** (lista vazia)

---

## PASSO 3 — Criar 1 saque de teste (exec)

**Comando:** `node scripts/create-test-withdraw-live.js`

**Execução nesta sessão:** rodado **sem** BEARER/PIX_KEY no ambiente (automação não tem acesso a credenciais). O script falha na validação local **antes** de chamar a API.

**Saída registrada:**
```json
{"success":false,"error":"BEARER ausente ou inválido. Defina BEARER=Bearer <jwt>","saqueId":null}
```

- **statusCode:** (não houve chamada HTTP; script exit 1)  
- **success:** false  
- **message/error:** BEARER ausente ou inválido. Defina BEARER=Bearer &lt;jwt&gt;  
- **saqueId:** null  

**Importante:** Isso **não** é resposta 500 "Erro ao registrar saque" da API; é falha de pré-requisito do script. Para obter **prova E2E real** (API não retorna 500, ledger aceito, saque registrado), o operador deve definir BEARER e PIX_KEY no PowerShell e executar novamente `node scripts/create-test-withdraw-live.js`, depois preencher aqui: statusCode (ex.: 200), success (true/false), message, saqueId (sem colar token nem PIX_KEY).

---

## PASSO 4 — Prova: logs APP e payout_worker (read-only)

**4.1) Logs APP** — `flyctl logs -a goldeouro-backend-v2 --machine 2874551a105768 --no-tail`

Busca por: `[SAQUE]`, `Erro ao registrar saque`, `[LEDGER]`, `airbag`, `user_id`, `usuario_id`, `42703`.

**Resultado:** Nenhuma linha contendo esses termos no snapshot. Apenas linhas de `[RECON]` (ID de pagamento inválido) e `[WEBHOOK]` (Signature inválida). **Sem ocorrências relevantes para ledger/saque** no snapshot.

**4.2) Logs payout_worker** — `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail`

**Resultado:** Apenas `[PAYOUT][WORKER]`: "Nenhum saque pendente", "Resumo { payouts_sucesso: 0, payouts_falha: 1 }", "Fim do ciclo". **Sem ocorrências de [LEDGER], airbag, user_id, usuario_id ou 42703** no snapshot.

---

## PASSO 5 — Verificar pendentes depois

**Comando:** `node scripts/check-pending-saques-live-test.js` (após execução; não houve saque criado nesta sessão).

**Saída:**
```json
{"pending":[],"count":0}
```

- **count:** 0  
- **saqueId:** N/A (nenhum saque foi criado nesta run; se o operador rodar PASSO 3 com credenciais, aqui pode aparecer o id ou o saque pode ter saído de pendente).

---

## PASSO 6 — Encerrar (higiene)

**Comandos:**
```powershell
Remove-Item Env:BEARER -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue
Remove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue
```

**Env limpas:** OK

---

## CONCLUSÃO

**Critérios PASS:**
1. create-test-withdraw-live.js **não** retorna 500 "Erro ao registrar saque"  
2. Logs **não** mostram erro de coluna/ledger (user_id/usuario_id) ligado ao saque  
3. Pendentes depois indica avanço (saque sumiu ou mudou conforme fluxo)

**Nesta execução:**
- **PASSO 3** foi executado **sem** BEARER/PIX_KEY → script retornou erro de pré-requisito (não chamou a API). Portanto **não há** evidência nesta run de que a API retornou 200 nem de que o saque foi registrado.
- **Logs (PASSO 4):** Não há nenhuma ocorrência de "Erro ao registrar saque", [LEDGER] airbag, user_id/usuario_id ou 42703 nos snapshots do app e do payout_worker.
- **Pendentes:** 0 antes e 0 depois (nenhum saque criado).

**Status:**

- **PASS** — Não aplicável nesta run: prova E2E real do saque (1)(2)(3) **requer** que o operador defina BEARER e PIX_KEY e execute `node scripts/create-test-withdraw-live.js`; registrar então statusCode, success, message e saqueId neste relatório (sem secrets).  
- **FAIL** — Não: não houve 500 "Erro ao registrar saque" nem erro de ledger visível nos logs.

**Recomendação:** Para **prova E2E completa**, executar manualmente no PowerShell (com BEARER e PIX_KEY definidos) o PASSO 3 e atualizar este relatório com a resposta da API (statusCode, success, message, saqueId). Se statusCode for 200 e success true com saqueId preenchido, e os logs continuarem sem "[LEDGER] insert falhou" ou 42703, considerar **PASS**.
