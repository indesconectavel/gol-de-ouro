# PIX-READY — PRÉ-TESTE (auditoria curta)

**Data:** 2026-03-28.  
**Escopo:** código atual no repositório (read-only).

---

## 1. Webhook

| Verificação | Resultado |
|-------------|-----------|
| Validação antiga `sha256=...` no fluxo MP | **`validateMercadoPagoWebhook` não chama** `parseSignature` nem `validateSignature`. O formato `sha256|sha1=<hex>` permanece só em `parseSignature`, usado por **`validateGenericWebhook`** / testes legados (`utils/webhook-signature-validator.js` ~117–131, ~257+). |
| Uso de `ts` + `v1` | **Sim** — parsing por partes de `x-signature` separadas por `,` (~163–172). |
| Manifest | **Sim** — `id:${dataID};` com `dataID` de `req.query['data.id']` ou `req.body.data.id` (~181–187); `request-id:${requestIdStr};` **só se** `x-request-id` não vazio (~198–205); `ts:${tsVal};` (~206); HMAC-SHA256 do `manifest` (~209). |

---

## 2. Reconcile

| Verificação | Resultado |
|-------------|-----------|
| Prioridade `payment_id` → `external_id` | **Sim** — `resolveMercadoPagoPaymentIdString`: dígitos em `payment_id` primeiro; senão dígitos em `external_id` (`server-fly.js` ~2131–2136). |
| IDs não numéricos → `reconcile_skip` | **Sim**, quando a coluna existe: `markPagamentoPixReconcileSkip` com `reconcile_skip: true` (~2140–2145, ~2208, ~2214). |
| Loop inútil | **Sem** chamadas repetidas ao MP com o mesmo ID inválido (faz `continue` antes do `axios.get`). Com **`reconcile_skip`** aplicado no Supabase, a linha deixa de entrar na query (`.eq('reconcile_skip', false)`). **Sem** a coluna: fallback lista todos os pending — o mesmo legado sem dígitos pode gerar **warn repetido** a cada ciclo, mas **não** insiste em `GET /v1/payments` com string inválida. |

---

## 3. PIX (`POST /api/payments/pix/criar`)

| Verificação | Resultado |
|-------------|-----------|
| `payment_id` = ID real MP | **Sim** — `dualWritePagamentoPixRow({ payment_id: String(payment.id), external_id: String(payment.id), ... })` após `POST /v1/payments` (`server-fly.js` ~1742–1748). |
| `external_id` como chave principal | **Não** — reconcile e RPC priorizam **`payment_id`**; `external_id` é fallback de lookup na RPC SQL (`rpc-financeiro-atomico-2026-03-28.sql` ~28–39). |

---

## 4. RPC

| Verificação | Resultado |
|-------------|-----------|
| Primeira tentativa `creditar_pix_aprovado_mp` | **Sim** — `preferRpc = process.env.FINANCE_ATOMIC_RPC !== 'false'` e `supabase.rpc('creditar_pix_aprovado_mp', { p_payment_id: paymentIdStr })` antes do fallback JS (`server-fly.js` ~2001–2029). |
| `FINANCE_ATOMIC_RPC` forçado a `false` | **Não** no código de exemplo: `.env.example` tem linha **comentada** `# FINANCE_ATOMIC_RPC=true` (não define `false`). Com variável **ausente**, `!== 'false'` é verdadeiro → RPC **tentada** por defeito. |

---

## 5. Veredito

**PIX READY**

O backend, pelo código, está alinhado para um teste PIX real via `server-fly.js` (webhook MP com `ts`/`v1` + manifest, insert com `payment.id`, crédito com RPC primeiro).  

**Pré-teste operacional recomendado:** `MERCADOPAGO_WEBHOOK_SECRET` correto no Fly; opcional mas útil: migração `migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql`; RPC `creditar_pix_aprovado_mp` presente no Supabase (já assumido pelo utilizador).
