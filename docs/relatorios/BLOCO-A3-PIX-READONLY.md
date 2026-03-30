# BLOCO A3 — Auditoria READ-ONLY: crédito PIX e concorrência

**Data:** 2026-03-27  
**Fonte:** `server-fly.js` (trechos `POST /api/payments/pix/criar`, `POST /api/payments/webhook`, função `reconcilePendingPayments`).  
**Escopo:** apenas leitura; sem alteração de código.

---

## 1. Resumo do fluxo de PIX

1. **Criação:** `POST /api/payments/pix/criar` — chama API Mercado Pago, insere linha em `pagamentos_pix` com `status: 'pending'`; **não** altera `usuarios.saldo`.
2. **Confirmação:** Mercado Pago notifica `POST /api/payments/webhook` (e/ou o job **`reconcilePendingPayments`** consulta MP para pendentes antigos).
3. **Crédito:** após confirmar `approved` no MP, o código **atualiza** `pagamentos_pix` para `approved` e **soma** o valor em `usuarios.saldo` (webhook e reconciliação em caminhos separados).

---

## 2. Onde o saldo é creditado

| # | Local | Arquivo | Endpoint / função | Operação no saldo |
|---|--------|---------|-------------------|-------------------|
| C1 | Webhook | `server-fly.js` ~1972–1989 | `POST /api/payments/webhook` (handler async após `next`) | `select saldo` → `novoSaldo = user.saldo + credit` → `update({ saldo: novoSaldo }).eq('id', usuario_id)` **sem** `.eq('saldo', …)` |
| C2 | Reconciliação | `server-fly.js` ~2093–2105 | `reconcilePendingPayments()` (intervalo via `setInterval`, ~2125+) | `select saldo` → `novoSaldo = Number(userRow.saldo) + Number(credit)` → `update({ saldo: novoSaldo }).eq('id', usuario_id)` **sem** lock otimista |

**Não credita saldo:** `POST /api/payments/pix/criar` — apenas `insert` em `pagamentos_pix`.

**Serviços externos:** nenhum outro arquivo foi necessário para mapear estes créditos; o fluxo está **inline** em `server-fly.js`.

---

## 3. Comportamento do webhook

**Arquivo:** `server-fly.js` ~1845–2002.

**Ordem das operações (trecho `type === 'payment'` e `data.id`):**

1. Resposta **200** com `{ received: true }` **imediatamente** (~1871) — processamento continua **após** enviar a resposta (mesmo tick / continuação async).
2. Leitura de `pagamentos_pix` por `external_id` ou `payment_id` (~1875–1888).
3. Se registro existe e **`status === 'approved'`** → **return** (não credita de novo) (~1890–1892).
4. Validação de `data.id` como string numérica (~1895–1904).
5. `GET` MP `v1/payments/{id}` (~1907–1917).
6. Se `payment.data.status === 'approved'` (~1919):
   - `update` em `pagamentos_pix` para `approved` (~1922–1943).
   - Lógica confusa em ~1946–1949: se `updateError` na primeira tentativa, pode `return` mesmo após `upd2` bem-sucedido — **risco de encerrar antes do crédito** em certos erros parciais (comportamento a observar em testes).
   - Busca `pixRecord` (~1953–1965).
   - Busca `user.saldo`, calcula `novoSaldo = user.saldo + credit` (~1984–1985).
   - `update usuarios` com `novoSaldo` só `.eq('id', …)` (~1986–1989).

**Assinatura:** se `MERCADOPAGO_WEBHOOK_SECRET` existir, produção **rejeita** assinatura inválida (~1852–1857); fora de produção pode apenas logar (~1858–1859).

**Pode rodar mais de uma vez?** Sim — o Mercado Pago pode **reenviar** notificações; o código tenta evitar crédito repetido com o check `status === 'approved'` **antes** de processar (~1890), mas isso **não** é um lock transacional.

---

## 4. Idempotência (existe ou não)

| Aspecto | Situação |
|---------|----------|
| Idempotência de **crédito de saldo** | **Parcial / fraca.** Depende de ler `pagamentos_pix.status === 'approved'` **antes** de creditar. Não há “claim” atômico tipo `UPDATE … WHERE status = 'pending' RETURNING`. |
| Dois webhooks **sequenciais** | O segundo costuma ver `approved` e **não** creditar (~1890–1892). |
| Dois webhooks **concorrentes** (ambos leem `pending`) | Ambos podem passar do check ~1890 e ambos **creditarem** — **duplicação possível**. |
| Reconciliação vs webhook | Ambos podem processar o **mesmo** pagamento pendente em paralelo — ver §5. |
| Idempotency na criação do pagamento (MP) | Header `X-Idempotency-Key` na criação (~1653–1656) — evita **pagamento duplicado no MP**, não controla crédito duplicado no webhook. |

**Resposta direta à missão §4:** idempotência **não** é garantida de forma forte; há apenas **leitura prévia** de status e atualização de status **sem** condição `WHERE status = 'pending'` explícita no update antes do crédito.

---

## 5. Concorrência

### 5.1 Lock otimista no saldo (pergunta 5)

**Não.** Tanto no webhook (~1986–1989) quanto na reconciliação (~2102–2105) o `update` em `usuarios` usa **apenas** `.eq('id', …)`, **sem** `.eq('saldo', valorAnterior)`.

### 5.2 Webhook × reconciliação (pergunta 6)

- **Webhook** marca `approved` e credita.
- **Reconciliação** lista `.eq('status', 'pending')` (~2043–2044), consulta MP; se `approved`, atualiza `pagamentos_pix` e credita (~2077–2110).

Se **webhook** e **reconciliação** processam o mesmo ID **quase ao mesmo tempo** (pendente ainda na lista do reconcile antes do commit do webhook, ou janela entre leitura e update):

- Ambos podem ver **pending**, ambos aprovar e **dois créditos** no saldo para o **mesmo** pagamento — risco **real** se a ordem e o timing colidirem.

A flag `reconciling` (~2032–2033) **só** impede **duas execuções simultâneas do job** de reconcile, **não** impede reconcile paralelo ao webhook.

### 5.3 Webhook × shoot / saque (pergunta 7)

- **Shoot** usa lock otimista no saldo.
- **Webhook** faz read-modify-write **sem** versão do saldo: pode **sobrescrever** o resultado de outra operação se houver intercalamento (lost update no sentido de somar sobre saldo **stale**), ou somar corretamente se a leitura ocorrer após o commit anterior — **não** há garantia formal de ordem.

**Pergunta 7 (saldo sobrescrito):** o update do webhook **substitui** `saldo` por `user.saldo + credit` com base em **leitura antiga**; sob concorrência com outra escrita, pode haver **saldo incorreto** (clássico lost update se outra thread alterou saldo entre read e write).

### 5.4 Validação antes de creditar (pergunta 8)

**Sim**, no sentido de **confirmar no Mercado Pago** que `payment.status === 'approved'` (~1919, e reconcile ~2076–2077) **antes** de atualizar registro e creditar.

### 5.5 Garantia “uma vez por pagamento” (pergunta 9)

**Não garantida** de forma estrita no código analisado. A combinação **check `approved` + update status** reduz retrys sequenciais, mas **não** provê exclusão mútua nem update condicional atômico `WHERE status = 'pending'` no mesmo passo do crédito.

---

## 6. Riscos identificados

1. **Duplo crédito — webhooks concorrentes** com mesmo `payment id` e status ainda `pending` nos dois reads (~1890).
2. **Duplo crédito — webhook + reconciliação** no mesmo pagamento pendente (~2077–2110 vs ~1919–1989).
3. **Crédito sem lock otimista** — corrida com shoot/saque/outro PIX (~1986–1989, ~2102–2105).
4. **`user.saldo + credit`** (~1985) sem `Number()` em ambos — risco teórico de concatenação de string se `saldo` vier como string do driver.
5. **Resposta 200 antes do processamento** (~1871) — MP considera entregue; falhas posteriores dependem de reconciliação (com os próprios riscos acima).
6. **Trecho ~1946–1949:** lógica de `updateError` pode retornar cedo em cenários onde uma segunda atualização teria corrigido — possível **não crédito** ou fluxo inconsistente (requer rastreio fino; registrado como risco operacional, não como duplicação).

---

## 7. Classificação de risco

| Tema | Nível |
|------|--------|
| Duplicação de crédito (webhook/reconcile/corrida) | **ALTO** a **CRÍTICO** (volume/concorrência real) |
| Sobrescrita / saldo incorreto por read-modify-write sem lock | **ALTO** |
| Dependência só de `status === 'approved'` pré-check | **ALTO** (mitigação parcial) |
| Validação `approved` via API MP antes de creditar | **MÉDIO** positivo (reduz crédito indevido por status falso) |

---

## Respostas objetivas (lista da missão)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Onde o saldo é creditado após PIX? | **Webhook** `POST /api/payments/webhook` e função **`reconcilePendingPayments`** em `server-fly.js`. |
| 2 | O webhook pode rodar mais de uma vez? | **Sim** (reenvios MP). |
| 3 | Verificação para impedir crédito duplicado? | **Parcial:** skip se `pagamentos_pix.status === 'approved'`; **não** atômico com o crédito. |
| 4 | Idempotência? | **Fraca** no crédito; idempotency key só na **criação** do pagamento no MP. |
| 5 | Lock otimista no update do saldo? | **Não.** |
| 6 | Risco webhook / reconcile / outras ops? | **Sim** — especialmente webhook∥reconcile e webhook∥webhook concorrente. |
| 7 | Saldo pode ser sobrescrito (race)? | **Sim** — padrão read-modify-write sem versão. |
| 8 | Validação de status antes de creditar? | **Sim** — consulta MP `payment.status === 'approved'`. |
| 9 | Garantia de um crédito por pagamento? | **Não** garantida pelo código analisado. |

---

*Fim do relatório BLOCO A3.*
