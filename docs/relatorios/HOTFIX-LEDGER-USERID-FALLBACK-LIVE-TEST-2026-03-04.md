# Hotfix Ledger user_id Fallback — Teste controlado ao vivo (payout)

**Data:** 2026-03-04  
**App Fly:** goldeouro-backend-v2  
**Máquina payout_worker:** e82794da791108  
**Regras:** Não alterar schema. Não reiniciar máquinas. Não tocar na máquina parada (e82d445ae76178).

---

## 1) Verificação de saques pendentes

**Query (somente leitura):** equivalente a  
`select id, usuario_id, status, created_at from saques where status in ('pendente','pending') order by created_at desc limit 5`

*(Na base o backend usa a coluna `usuario_id` na tabela `saques`.)*

**Execução:** script `scripts/check-pending-saques-live-test.js` (Supabase read-only com .env).

**Resultado:**
```json
{"pending":[],"count":0}
```

**Conclusão:** Nenhum saque pendente no momento da verificação.

---

## 2) Criação de saque de teste (quando não há pendentes)

**Ação:** Criar 1 saque de teste (valor mínimo R$ 10) para usuário válido via API:  
`POST /api/withdraw/request` com `Authorization: Bearer <JWT>`.

**Execução:** script `scripts/create-test-withdraw-live.js` (requer `BEARER=Bearer <jwt>`).

**Resultado:**
```json
{"error":"BEARER ausente ou inválido. Defina BEARER=Bearer <jwt>","saqueId":null}
```

**Conclusão:** Saque de teste **não foi criado** — variável `BEARER` não estava definida no ambiente. Para repetir o teste com execução real do fluxo: definir JWT (ex.: via `scripts/get-bearer-from-browser.ps1` ou login) e executar:

```powershell
$env:BEARER = "Bearer <seu-jwt>"
node scripts/create-test-withdraw-live.js
```

**ID do saque criado:** N/A (nenhum saque criado nesta execução).

---

## 3) Logs do payout_worker

**Comando:** `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail`

**Período (amostra):** 2026-03-04T21:15:27Z a 2026-03-04T21:23:27Z.

**Trechos relevantes (padrão repetido a cada ciclo):**
```
2026-03-04T21:22:27Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Início do ciclo
2026-03-04T21:22:27Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Nenhum saque pendente
2026-03-04T21:22:27Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Resumo { payouts_sucesso: 0, payouts_falha: 0 }
2026-03-04T21:22:27Z app[e82794da791108] gru [info] ℹ️ [PAYOUT][WORKER] Nenhum saque processado neste ciclo
2026-03-04T21:22:27Z app[e82794da791108] gru [info] 🟦 [PAYOUT][WORKER] Fim do ciclo
```

- Nenhuma linha com `ERROR`, `column`, `user_id`, `usuario_id` (erro) ou exceção.
- Nenhuma mensagem de falha de inserção no ledger (path de ledger só é executado quando há saque processado ou rollback).

---

## 4) Confirmações

| Item | Resultado |
|------|-----------|
| Status transiciona corretamente | N/A — nenhum saque foi processado (0 pendentes). |
| Nenhuma falha de coluna | Sim — nenhum erro de coluna nos logs. |
| Nenhuma exceção | Sim — apenas logs [info]. |
| Ledger insert executado sem erro | N/A — nenhum saque passou pelo fluxo de insert no ledger neste período. |

**Status das máquinas (flyctl status):**
```
payout_worker  e82794da791108  started
app            2874551a105768  started
app            e82d445ae76178  stopped  (não tocada)
```

---

## 5) Conclusão

**Teste controlado com execução real do fluxo de payout não realizado** nesta rodada: não havia saque pendente e não foi definido `BEARER` para criar um saque de teste via API. O **payout_worker** está em execução, os ciclos completam sem erro (Início → Nenhum saque pendente → Resumo → Fim do ciclo) e **não foi registrado nenhum erro de ledger, coluna ou exceção** nos logs.

Para obter a conclusão **"Hotfix validado com execução real do fluxo de payout"** é necessário:
1. Definir `BEARER` com JWT de usuário válido (saldo ≥ R$ 10).
2. Executar `node scripts/create-test-withdraw-live.js` (ou `POST /api/withdraw/request` com valor 10 e chave PIX válida).
3. Aguardar o worker processar (ciclo ~30s) e coletar novamente os logs com `flyctl logs -a goldeouro-backend-v2 --machine e82794da791108 --no-tail`.
4. Confirmar nos logs: transição para processando/aguardando_confirmacao ou rollback, sem erro de coluna e sem exceção; em caso de rollback ou falha_payout, o insert no ledger (airbag user_id/usuario_id) deve ter sido executado sem erro.

**Conclusão registrada para esta execução:**

Worker executando sem erro de ledger no período observado. Execução real do fluxo de payout (com saque pendente e possível insert no ledger) não foi exercitada por ausência de saque pendente e de JWT para criação do saque de teste.

---

## Scripts utilizados

| Script | Uso |
|--------|-----|
| `scripts/check-pending-saques-live-test.js` | Query read-only de saques pendentes (requer .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). |
| `scripts/create-test-withdraw-live.js` | Cria 1 saque de teste via API (requer BEARER=Bearer \<jwt\>). |

---

*Schema não alterado. Máquinas não reiniciadas. Máquina parada e82d445ae76178 não tocada.*
