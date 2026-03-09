# Auditoria: depósito approved no MP e pending no Supabase (V308)

**Data:** 2026-03-03  
**Modo:** READ-ONLY ABSOLUTO  
**Objetivo:** Descobrir por evidência por que o depósito aprovado no Mercado Pago permaneceu com status pending no Supabase.

**Referências:**
- `payment_id` (MP): **148697499270**
- `pagamentos_pix.id`: **87ee8545-e56d-4978-85d0-d0bd22240eeb**
- Prova de status MP: ver relatório **`PROVA-STATUS-MP-PAYMENT-148697499270-2026-03-03-R2.md`** (status no MP = **approved**).

---

## 0) Snapshot infra

### flyctl status -a goldeouro-backend-v2

```
App
  Name     = goldeouro-backend-v2
  Owner    = personal
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	ROLE        	CHECKS            	LAST UPDATED
app          	2874551a105768	308    	gru   	started	    	1 total, 1 passing	2026-03-03T15:11:41Z
app          	e82d445ae76178	308    	gru   	stopped	    	1 total, 1 warning	2026-03-03T15:11:54Z
payout_worker	e82794da791108	308    	gru   	started	    	                  	2026-03-03T15:11:40Z
```

### flyctl machines list -a goldeouro-backend-v2

- **APP_HEALTHY_ID usado:** `2874551a105768` (process group `app`, state `started`, checks 1/1 passing).

---

## 1) Prova DB (READ-ONLY) do registro exato

Script executado no container (STDIN → `/app/db.js` → `node db.js` a partir de `/app` para resolver `@supabase/supabase-js`).

### Env Supabase (apenas boolean/len; sem vazar valor)

- `SUPABASE_URL_PRESENT` true, `SUPABASE_URL_LEN` 40  
- `SUPABASE_SERVICE_ROLE_KEY_PRESENT` true, `SUPABASE_SERVICE_ROLE_KEY_LEN` 219  

### Registro `pagamentos_pix` id = 87ee8545-e56d-4978-85d0-d0bd22240eeb

```json
{
  "id": "87ee8545-e56d-4978-85d0-d0bd22240eeb",
  "status": "pending",
  "amount": 10,
  "payment_id": "148697499270",
  "external_id": "148697499270",
  "created_at": "2026-03-03T20:32:29.162628+00:00",
  "updated_at": "2026-03-03T20:32:29.162628+00:00",
  "usuario_id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5"
}
```

### Saldo do usuário (usuarios.saldo)

- **USUARIO_SALDO:** 79  

**Conclusão:** No DB o pagamento está **pending**; no MP está **approved** (ver R2). O saldo atual do usuário (79) não inclui os R$ 10 deste depósito, pois o backend nunca aprovou o registro.

---

## 2) Prova de ENV do reconciler (READ-ONLY)

Valores lidos no mesmo container (app):

| Variável | Valor |
|----------|--------|
| **MP_RECONCILE_ENABLED** | **false** |
| MP_RECONCILE_INTERVAL_MS | undefined |
| MP_RECONCILE_MIN_AGE_MIN | undefined |
| NODE_ENV | production |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | presente (LEN 74) |

**Conclusão:** O reconciler de depósitos PIX está **desativado** em produção (`MP_RECONCILE_ENABLED === 'false'`). O token de depósito existe; o intervalo e idade mínima não estão definidos porque o reconciler nem é agendado quando está desligado.

---

## 3) Prova de “candidatos” do reconciler (READ-ONLY)

Query no Supabase: `pagamentos_pix` com `status in ('pending','pendente')` e `created_at < now - 2 min`.

- **CANDIDATES_COUNT:** 40  

Os **10 mais antigos** (id, status, payment_id, created_at):

| id | status | payment_id | created_at |
|----|--------|------------|------------|
| 943f8d64-d185-42ef-aba8-bfef0d5f35c5 | pending | 136671361121 | 2025-12-10T16:22:07.088319+00:00 |
| 33d7348c-85a0-4021-8721-1ab424fe2145 | pending | 137865197605 | 2025-12-18T23:00:36.245436+00:00 |
| af2e65ef-e90d-4aa9-a3a2-7958395d3a19 | pending | 137865577381 | 2025-12-18T23:00:37.447251+00:00 |
| ebd32880-be70-4df5-be0a-3f7ad934e33d | pending | 138525037308 | 2025-12-19T01:21:26.218609+00:00 |
| 87d55aa7-5502-4dbb-af7a-def2cf695dbe | pending | 138526350220 | 2025-12-19T01:21:27.378217+00:00 |
| fa5b2d31-92d3-4e81-a158-665691c34f17 | pending | 138604034392 | 2025-12-19T15:44:03.602903+00:00 |
| b3250e7b-7967-4b85-bfd7-12b1f7955004 | pending | 138603664736 | 2025-12-19T15:44:04.844428+00:00 |
| 60a2e5ba-fb37-4625-a268-28e3ebcb9c89 | pending | 138051566541 | 2025-12-20T01:11:04.500996+00:00 |
| 4761c32b-4943-459f-8db6-fa8c19def8d2 | pending | 139992840129 | 2026-01-04T19:27:11.048331+00:00 |
| 73534bd4-bae7-4d50-8ba5-f5bce9955c0e | pending | 140889861086 | 2026-01-06T16:04:20.723001+00:00 |

O registro **87ee8545-e56d-4978-85d0-d0bd22240eeb** (payment_id 148697499270) é um dos 40 candidatos (created_at 2026-03-03T20:32:29), mas não aparece nos 10 mais antigos por ter sido criado depois.

---

## 4) Logs: webhook e reconcile

Logs do Fly (app) consultados para os padrões abaixo. Janela disponível: logs recentes; não foi possível garantir janela cobrindo o horário exato do pagamento (aprox. 2026-03-03 20:32–20:35 UTC).

| Padrão | Resultado |
|--------|-----------|
| `/api/payments/webhook` | **não encontrado** |
| "Webhook signature inválida" | **não encontrado** |
| "x-signature" / "x-timestamp" | **não encontrado** |
| "[RECON]" | **não encontrado** |
| "Claim ganhou" / "Claim perdeu" | **não encontrado** |
| "ID de pagamento inválido" | **não encontrado** |

**Observação:** Com `MP_RECONCILE_ENABLED === 'false'`, o `setInterval` de reconciliação **não é registrado** (código em `server-fly.js`), portanto não há logs de "[RECON]" nem de "Reconciliação de PIX pendentes ativa...". A ausência de logs de webhook pode indicar que o MP não chamou o endpoint, que a chamada foi rejeitada (ex.: 401 por assinatura) ou que os logs desse horário já saíram do buffer.

---

## 5) Diagnóstico por hipótese

### Causa raiz identificada

- **`MP_RECONCILE_ENABLED === 'false'`** em produção ⇒ o reconciler de depósitos PIX **não roda**.  
- O pagamento 148697499270 está **approved** no MP (relatório R2) e **pending** no DB; o único mecanismo que poderia atualizar o DB sem webhook é o reconciler, e ele está desligado.

### Outros fatores (evidência)

- **Candidatos pendentes:** 40 registros (incluindo 87ee8545) com status pending/pendente e created_at &gt; 2 min atrás.  
- **Token de depósito:** presente (LEN 74).  
- **Webhook:** não há evidência nos logs de chamada ao `/api/payments/webhook` nem de "Claim ganhou" para este payment_id. Possíveis explicações: webhook não enviado pelo MP, rejeição por assinatura (401) ou logs do horário do evento não disponíveis.

### Resumo

| Hipótese | Conclusão |
|----------|-----------|
| Reconciler desligado (`MP_RECONCILE_ENABLED == 'false'`) | **Causa provável:** sim — reconciler não executa; não há fallback para refletir approved no DB. |
| Candidatos pendentes + token existe | Reconciler **deveria** poder agir se estivesse habilitado; ausência de logs [RECON] é esperada porque o reconciler está desativado. |
| Logs 401/assinatura | Não encontrados na janela consultada; não descarta rejeição de webhook no momento do evento. |

---

## Declarações finais

- **MP approved:** Comprovado no relatório **`PROVA-STATUS-MP-PAYMENT-148697499270-2026-03-03-R2.md`** (GET no container com token de produção; status = approved, status_detail = accredited).  
- **DB still pending:** Comprovado neste relatório (SELECT em `pagamentos_pix` id 87ee8545-e56d-4978-85d0-d0bd22240eeb; status = pending; saldo do usuário não inclui os R$ 10 deste depósito).  

**READ-ONLY:** Nenhuma alteração de código, deploy, secrets, restart ou escrita direta no DB foi realizada. O script `/app/db.js` foi usado apenas de forma temporária no container para esta auditoria.
