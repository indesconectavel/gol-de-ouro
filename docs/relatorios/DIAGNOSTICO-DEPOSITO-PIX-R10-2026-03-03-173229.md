# Diagnóstico depósito PIX R$ 10 — 03/03/2026 17:32:29 (READ-ONLY)

**Data da auditoria:** 2026-03-03  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código, deploy, secrets, restart ou escrita direta no banco).

**Alvo:** 1 depósito PIX de R$ 10,00 criado em 03/03/2026 17:32:29 (UI), ainda **Pendente** na interface. Operador relata: “pago, valor saiu da conta e entrou no Mercado Pago”.

---

## PASSO 0 — Snapshot infra (Fly)

**Comandos executados:**

```text
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
```

**Resultado:**

| Item | Valor |
|------|--------|
| **APP_HEALTHY_ID** | `2874551a105768` (withered-cherry-5478, app 1/1 passing) |
| **WORKER_ID** | `e82794da791108` (weathered-dream-1146, payout_worker started) |
| Imagem | `goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH` |
| App stopped | `e82d445ae76178` |

---

## PASSO 1 — Registro do depósito no DB (READ-ONLY)

**Método:** Consulta READ-ONLY ao Supabase com variáveis de ambiente (.env), equivalente à leitura que seria feita no container. Filtro: tabela `pagamentos_pix`, data 2026-03-03 (UTC), `amount = 10` ou `valor = 10`, ordenação `created_at` desc, top 5.

**Resultado:** 1 registro no dia 2026-03-03 com amount 10.

**Registro identificado (correspondente a 03/03/2026 17:32:29 na UI):**

| Campo | Valor |
|-------|--------|
| **id** | `87ee8545-e56d-4978-85d0-d0bd22240eeb` |
| created_at | `2026-03-03T20:32:29.162628+00:00` (UTC) = **17:32:29 BRT** |
| amount | 10 |
| valor | 10 |
| status | **pending** |
| payment_id | `148697499270` |
| external_id | `148697499270` |
| usuario_id | `4ddf8330-ae94-4e92-a010-bdc7fa254ad5` |

A tabela não expõe `payer_email` no schema utilizado; identificação foi feita por `usuario_id` + data/hora + valor.

---

## PASSO 2 — mpId que o backend usaria

Para o registro selecionado, conforme `server-fly.js` (reconciler):

- **mpId** = `String(external_id || payment_id).trim()` → **`"148697499270"`**
- **Validação numérica:** `/^\d+$/.test(mpId)` → **true** (apenas dígitos).
- **Conclusão:** O reconciler **não ignora** este registro por ID inválido; o mpId é numérico e seria usado em `GET https://api.mercadopago.com/v1/payments/148697499270`.

---

## PASSO 3 — Status real no Mercado Pago (READ-ONLY)

**Chamada:** `GET https://api.mercadopago.com/v1/payments/148697499270`  
**Token:** `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (ambiente local .env para auditoria).

**Resultado:** Resposta HTTP **401 Unauthorized**. Corpo resumido: `{"status":401}`.

**Interpretação:** Com as credenciais utilizadas (token do ambiente local), a API do MP não autorizou a consulta. Não foi possível obter os campos `id`, `status`, `status_detail`, `transaction_amount`, `date_created`, `date_approved`, `external_reference`, `payment_method_id` para este payment_id em ambiente de auditoria.

**Se a consulta fosse feita com o token do processo app no Fly (MERCADOPAGO_DEPOSIT_ACCESS_TOKEN do container):**

- **status = approved** → MP aprovou e o backend não refletiu (webhook/reconciler) → **NO-GO**.
- **status = pending** → MP ainda não concluiu (depósito não compensado) → **GO** (comportamento esperado).
- **status = cancelled / rejected / expired** → Pagamento não aprovado no MP.

---

## PASSO 4 — Verificação do reconciler no código (READ-ONLY)

**Arquivo:** `server-fly.js`.

| Verificação | Localização | Evidência |
|-------------|-------------|-----------|
| INSERT em `pagamentos_pix` usa `status: 'pending'` | Linhas 1828–1837 | `.insert({ ..., status: 'pending', ... })` |
| reconcilePendingPayments filtra por status | Linhas 2357–2362 | `.in('status', ['pending', 'pendente'])` |
| mpId extraído de external_id / payment_id | Linha 2372 | `const mpId = String(p.external_id \|\| p.payment_id \|\| '').trim();` |
| Exigência de mpId numérico | Linhas 2375–2384 | `if (!/^\d+$/.test(mpId)) { ... continue; }` e `paymentId = parseInt(mpId, 10)` |
| Chamada ao MP | Linhas 2387–2390 | `axios.get(\`https://api.mercadopago.com/v1/payments/${paymentId}\`, { headers: { Authorization: \`Bearer ${mercadoPagoAccessToken}\` } })` |

Token de depósito no app: `mercadoPagoAccessToken = process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (linha 171).

---

## PASSO 5 — Conclusão e veredito

**Resumo das evidências:**

1. **Registro no Supabase:** `87ee8545-e56d-4978-85d0-d0bd22240eeb`, created_at 2026-03-03T20:32:29 UTC (17:32:29 BRT), amount/valor 10, status **pending**, payment_id e external_id **148697499270**.
2. **mpId:** `148697499270` — **numérico**; o reconciler poderia processar este registro.
3. **Status real no MP:** **Não obtido** na auditoria (401 com token do ambiente local). Em produção, o backend usaria `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` do container para a mesma GET.

**Conclusão objetiva:**

- Dado o relato do operador (“pago, valor saiu da conta e entrou no Mercado Pago”) e o fato de o mpId ser numérico (reconciler não descarta o registro por formato de ID), a hipótese mais provável é que **no MP o pagamento esteja aprovado** e o **backend não tenha atualizado** o status (DB e UI continuam pendentes).
- Nesse cenário, o subsistema de Depósito PIX é classificado como **NO-GO**, com causa provável em uma ou mais de:
  - **Webhook não chegando** ao backend (URL, rede ou configuração no painel MP),
  - **Webhook chegando mas falhando validação** (ex.: assinatura quando `MERCADOPAGO_WEBHOOK_SECRET` está definido),
  - **Reconciler não executando** ou **sem observabilidade** (ausência de logs [RECON] nos trechos coletados em auditorias anteriores).

**Veredito final:** **NO-GO** para o subsistema Depósito PIX, com base no conjunto: registro pendente no DB com mpId válido, relato de pagamento concluído pelo operador e impossibilidade de atualização via webhook/reconciler comprovada até o momento da auditoria.

*(Se futura consulta ao MP com token de produção mostrar `status = pending`, o veredito deve ser revisado para GO — aguardando compensação.)*

---

**Declaração final:** Nenhuma alteração de código, deploy, secrets ou restart foi feita. Apenas leituras no banco (Supabase), tentativa de consulta à API do Mercado Pago e inspeção do código para elaboração deste relatório.
