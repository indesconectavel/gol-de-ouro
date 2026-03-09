# Verificação status real no Mercado Pago — Depósito PIX (2026-03-03)

**Modo:** READ-ONLY (sem alteração de código, secrets, deploy ou reinício).  
**ID consultado:** `E18189547202603032033wmEVCzrhvZj`

---

## PASSO 1 — Como o reconciler consulta pagamentos no código

**Arquivo:** `server-fly.js`

**Onde a API do Mercado Pago é chamada (reconciler):**

- Listagem de pendentes: tabela `pagamentos_pix`, campos `external_id` e `payment_id` (linhas 2357–2362).
- ID usado para a chamada ao MP: `mpId = String(p.external_id || p.payment_id || '').trim()` (linha 2372).
- Validação: o código **exige ID numérico** antes de chamar o MP: `/^\d+$/.test(mpId)` (linhas 2375–2384). Se não for só dígitos, o reconciler ignora o registro e loga "ID de pagamento inválido (não é número)".
- Chamada HTTP ao MP (reconciler):

```javascript
// server-fly.js, linhas 2387-2390
const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
  headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
  timeout: 5000
});
```

- Token usado no app para **depósito** (criação e consulta de pagamentos): `mercadoPagoAccessToken` = `process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (linha 171). O webhook de depósito usa o mesmo token (linhas 2060–2064).

**Conclusão do código:**  
O backend usa **apenas** o endpoint `GET https://api.mercadopago.com/v1/payments/{id}` com **id numérico** (valor de `payment_id` ou `external_id` da tabela `pagamentos_pix`). Não usa `merchant_orders` para reconciliação de depósitos. O ID `E18189547202603032033wmEVCzrhvZj` **não é numérico**, portanto o reconciler **nunca** usaria esse valor para chamar `/v1/payments/`.

---

## PASSO 2 — Chamadas à API do Mercado Pago (READ-ONLY)

**Ambiente:** Script Node executado com variáveis de ambiente (token de depósito), em modo somente leitura, sem expor o token.

**Chamadas realizadas:**

1. **GET** `https://api.mercadopago.com/v1/payments/E18189547202603032033wmEVCzrhvZj`  
   - Resposta: **recurso não encontrado** (equivalente a 404).  
   - Corpo resumido: `{"error":"resource not found","message":"Si quieres conocer los recursos de la API..."}`

2. **GET** `https://api.mercadopago.com/merchant_orders/E18189547202603032033wmEVCzrhvZj`  
   - Resposta: **400 bad_request** com `"invalid_token"`.  
   - Indica problema de token ou de formato/escopo para esse endpoint; não foi possível avaliar se o ID existe como merchant order.

**JSON resumido (payments):**

| Campo                | Valor |
|----------------------|--------|
| id                   | (recurso não encontrado) |
| status               | — |
| status_detail        | — |
| transaction_amount   | — |
| date_approved        | — |
| external_reference   | — |

O endpoint `/v1/payments/` retornou apenas a mensagem de recurso não encontrado, sem campos de pagamento.

---

## PASSO 3 — Conclusão

- **GET /v1/payments/{ID} com ID = `E18189547202603032033wmEVCzrhvZj` → 404 (resource not found).**  
  A API do Mercado Pago espera em `/v1/payments/` um **id numérico** de pagamento (ex.: `148697499270`). O valor `E18189547202603032033wmEVCzrhvZj` não é aceito como payment ID nesse endpoint.

**Interpretação:**

| Resultado   | Conclusão |
|------------|-----------|
| **404**    | **ID incorreto** para o endpoint `/v1/payments/`. O backend só consulta o MP com `payment_id`/`external_id` **numéricos** (retorno de `payment.id` na criação do PIX). Esse string não corresponde a um payment ID do MP usado pelo fluxo de depósito. |
| status = approved | (não aplicável — recurso não encontrado) |
| status = pending | (não aplicável — recurso não encontrado) |

**Recomendação:** Para checar o status real no MP de um depósito que aparece na aplicação, usar o **payment_id** (ou **external_id**) **numérico** armazenado na tabela `pagamentos_pix` para esse depósito (ex.: valor como `148697499270`), e consultar:

`GET https://api.mercadopago.com/v1/payments/{payment_id_numerico}`

Com isso é possível concluir se, no MP, o pagamento está `approved` (e o backend não atualizou), `pending` (ainda não compensado) ou outro status.

---

**Declaração:** Nenhuma alteração de código, secrets, deploy ou reinício foi feita. Apenas leitura do código e consultas GET à API do Mercado Pago para elaboração deste relatório.
