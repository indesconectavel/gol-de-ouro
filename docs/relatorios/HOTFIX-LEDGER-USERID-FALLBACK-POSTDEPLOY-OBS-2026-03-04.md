# Hotfix Ledger user_id Fallback — Observação pós-deploy (validação funcional)

**Data:** 2026-03-04  
**App Fly:** goldeouro-backend-v2  
**Máquina payout_worker:** e82794da791108  
**Regras:** Apenas leitura e evidência. Não alterar código. Não reiniciar máquinas. Não tocar na máquina parada (e82d445ae76178).

---

## 1) Status da máquina payout_worker

**Comando:** `flyctl status -a goldeouro-backend-v2`

**Output:**
```
App
  Name     = goldeouro-backend-v2
  Owner    = personal
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	ROLE	CHECKS            	LAST UPDATED
app          	2874551a105768	312    	gru   	started	    	1 total, 1 passing	2026-03-04T21:03:26Z
app          	e82d445ae76178	312    	gru   	stopped	    	1 total, 1 warning	2026-03-04T21:03:40Z
payout_worker	e82794da791108	312    	gru   	started	    	                  	2026-03-04T21:03:26Z
```

**Confirmação:** A máquina do **payout_worker** (e82794da791108) está **running** (STATE = started). A máquina parada e82d445ae76178 não foi tocada.

---

## 2) Logs do payout_worker

**Comando:** `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail`

*(Nota: flyctl não aceita `--since`; foi usado snapshot com `--no-tail`. Filtro por máquina: `--machine`.)*

**Período dos logs (amostra):** 2026-03-04T21:10:57Z a 2026-03-04T21:18:57Z (ciclos a cada ~30s).

---

## 3) Busca nos logs (processPendingWithdrawals, ledger, ERROR, column, user_id, usuario_id)

- **processPendingWithdrawals:** não aparece como string nos logs (o worker loga `[PAYOUT][WORKER]`; o código que chama é processPendingWithdrawals).
- **ledger:** não aparece nos trechos coletados (nenhum saque pendente → nenhuma inserção no ledger foi tentada neste período).
- **ERROR:** nenhuma linha contém "ERROR" ou "[34merror[0m" nos logs coletados.
- **column:** não aparece.
- **user_id / usuario_id:** não aparecem (sem tentativa de insert no ledger neste intervalo).

Conclusão da busca: **nenhum erro de ledger, coluna ou user_id/usuario_id** nos logs. Todos os ciclos terminam com "Nenhum saque pendente" e "Fim do ciclo" em nível info.

---

## 4) Trechos relevantes dos logs

Padrão repetido a cada ciclo (exemplo):

```
2026-03-04T21:10:57Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Nenhum saque pendente
2026-03-04T21:10:57Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Resumo { payouts_sucesso: 0, payouts_falha: 0 }
2026-03-04T21:10:57Z app[e82794da791108] gru [info] ℹ️ [PAYOUT][WORKER] Nenhum saque processado neste ciclo
2026-03-04T21:10:57Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Fim do ciclo
2026-03-04T21:11:27Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Início do ciclo
...
```

*(O mesmo padrão se repete em 21:11:27, 21:11:57, 21:12:27, 21:12:57, 21:13:27, 21:13:57, 21:14:27, 21:14:57, 21:15:27, 21:15:57, 21:16:27, 21:16:57, 21:17:27, 21:17:57, 21:18:27, 21:18:57.)*

Todos os níveis são `[info]`. Nenhuma linha com `ERROR`, `[error]` ou falha de inserção no ledger.

---

## 5) Conclusão objetiva

**a) Worker executando sem erro de ledger.**

O payout_worker (e82794da791108) está em execução, os ciclos completam com "Início do ciclo" → "Nenhum saque pendente" ou processamento → "Resumo" → "Fim do ciclo", sem nenhuma mensagem de erro relacionada a ledger, coluna, user_id ou usuario_id. No período observado não houve saque pendente, portanto não houve tentativa de inserção no ledger; a ausência de erros é consistente com o hotfix em produção e com ciclos que não chegam ao path de insert.

---

## Registro de evidência (resumo)

| Item | Valor / Observação |
|------|--------------------|
| Data/hora da observação | 2026-03-04 (logs até 21:18:57Z) |
| Período dos logs | ~21:10–21:18 UTC (snapshot com --no-tail) |
| Falhas de inserção no ledger? | Não |
| Trechos de log relevantes | Ciclos [PAYOUT][WORKER] apenas info; Resumo payouts_sucesso: 0, payouts_falha: 0 |
| Stack/erro | Nenhum |
| Proposta de patch seguinte | N/A (apenas diagnóstico) |

---

*Saque não testado. Nenhum patch adicional aplicado. Máquina parada e82d445ae76178 não tocada. Apenas diagnóstico e evidência.*
