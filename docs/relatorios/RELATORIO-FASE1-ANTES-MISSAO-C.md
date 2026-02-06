# FASE 1 — Prova de localização (ANTES) — Missão C MAX SAFETY

**Data:** 05/02/2026  
**Objetivo:** Localizar exatamente onde o webhook e a reconciliação atualizam `pagamentos_pix` e creditam `usuarios.saldo`, antes de qualquer alteração.

---

## A) Localização exata

| Item | Arquivo | Linhas |
|------|---------|--------|
| **POST /api/payments/webhook (depósito)** | `server-fly.js` | 1969–2132 |
| **reconcilePendingPayments()** | `server-fly.js` | 2339–2434 |
| **Onde pagamentos_pix é atualizado para approved (webhook)** | `server-fly.js` | 2051–2074 (update por external_id; fallback por payment_id) |
| **Onde usuarios.saldo é incrementado (webhook)** | `server-fly.js` | 2112–2122 (select saldo; credit = amount ?? valor; update saldo) |
| **Onde pagamentos_pix é atualizado para approved (recon)** | `server-fly.js` | 2388–2410 (update por external_id; fallback por payment_id) |
| **Onde usuarios.saldo é incrementado (recon)** | `server-fly.js` | 2405–2422 (select saldo; novoSaldo; update saldo) |

---

## B) Colunas reais usadas no código

| Uso | Colunas |
|-----|--------|
| **Identificador do pagamento** | `external_id` (primeiro); fallback `payment_id`. Em criação PIX (L1810–1811): ambos = `String(payment.id)`. Webhook usa `data.id` (MP) em `eq('external_id', data.id)` e `eq('payment_id', String(data.id))`. |
| **Valor do crédito** | `amount` e `valor` — código usa `pixRecord.amount ?? pixRecord.valor` (webhook L2112) e `p.amount ?? p.valor` (recon L2402). |
| **Status** | `status` — valores usados: `'approved'`, `'pending'`. Verificação de idempotência: `existingPayment.status === 'approved'`. Recon lista `.eq('status', 'pending')`. |

---

## C) Status em `pagamentos_pix` (schema do repositório)

- **database/schema.sql** (L96): `CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))`.
- Em produção (B2) também foi observado `expired`. O patch condiciona a **status != 'approved'** para o claim; outros valores não são alterados.

---

## D) Trechos exatos (ANTES)

**Webhook — update approved (L2051–2074):**
```javascript
let { error: updateError } = await supabase
  .from('pagamentos_pix')
  .update({ status: 'approved', updated_at: new Date().toISOString() })
  .eq('external_id', data.id);
// ... fallback por payment_id se checkAfterUpdate não encontrou
```

**Webhook — crédito de saldo (L2112–2122):**
```javascript
const credit = pixRecord.amount ?? pixRecord.valor ?? 0;
const novoSaldo = user.saldo + credit;
const { error: saldoError } = await supabase
  .from('usuarios')
  .update({ saldo: novoSaldo })
  .eq('id', pixRecord.usuario_id);
```

**Recon — update approved (L2388–2410):** update por `external_id` (mpId), fallback por `payment_id` (mpId).

**Recon — crédito (L2412–2415):** `novoSaldo = Number(userRow.saldo || 0) + Number(credit)`; `update({ saldo: novoSaldo }).eq('id', p.usuario_id)`.

---

*Fim do relatório FASE 1 — estado ANTES do patch.*
