# RELATÓRIO MISSÃO C — MAX SAFETY (Correção double credit depósitos PIX)

**Data:** 05/02/2026  
**Modo:** MAX SAFETY — alteração mínima, sem tocar em saque, criação PIX, schema ou contratos.

---

## 1) O que mudou (mínimo)

- **Webhook de depósito** (`server-fly.js`, bloco `if (payment.data.status === 'approved')`):
  - **Antes:** UPDATE em `pagamentos_pix` para `approved` (por external_id, fallback payment_id) sem condição de status; depois SELECT do registro e crédito em `usuarios.saldo`. Dois requests concorrentes podiam ambos passar do “já approved?” e ambos creditar.
  - **Depois:** “Claim” atômico: UPDATE `pagamentos_pix` SET status = 'approved' **WHERE payment_id = data.id AND status != 'approved'** (e, se 0 linhas, WHERE external_id = data.id AND status != 'approved'), com `.select('id, usuario_id, amount, valor')`. Só se **exatamente 1 linha** for retornada é que o saldo é creditado. Caso contrário: log “Claim perdeu” e saída sem crédito.

- **Reconciliação** (`server-fly.js`, função `reconcilePendingPayments()`):
  - **Antes:** UPDATE por external_id/payment_id (mpId) sem condição de status; depois crédito usando dados do loop (p).
  - **Depois:** UPDATE **WHERE id = p.id AND status != 'approved'** com `.select()`. Só se **exatamente 1 linha** for retornada é que o saldo é creditado (usando a linha retornada: amount/valor, usuario_id). Se 0 linhas, continua (já processado).

- **Valor do crédito:** Inalterado — continua `pixRecord.amount ?? pixRecord.valor` (webhook) e `Number(pixRecord.amount ?? pixRecord.valor ?? 0)` (recon).

- **Logs:** Um log por caminho: “Claim ganhou” quando crédito é aplicado; “Claim perdeu” quando nenhuma linha foi “claimed” (já processado ou não encontrado). Logs de erro existentes mantidos.

---

## 2) O que NÃO mudou (lista explícita)

- Endpoint e assinatura: `POST /api/payments/webhook` (mesmo path, mesmo body).
- Resposta do webhook: `res.status(200).json({ received: true })` antes do processamento (inalterado).
- Criação do PIX: endpoint, payload ao MP, `notification_url`, campos persistidos — **não alterados**.
- Comportamento para status “não approved”: continua ignorando (sem update de status nem crédito).
- Validação de assinatura (MERCADOPAGO_WEBHOOK_SECRET): inalterada.
- Valores, taxas, arredondamentos, limites (amount 1–1000): inalterados.
- Código de saque/payout: `/api/withdraw/*`, worker, `/webhooks/mercadopago`, `ledger_financeiro`, tabela `saques` — **não alterados**.
- Schema, migrations, triggers, policies: **não alterados**.
- Lookup do registro: mesma chave em uso (payment_id primeiro, fallback external_id no webhook; id do registro na reconciliação).

---

## 3) Como isso evita double credit

- **Webhook vs webhook:** O primeiro request que faz UPDATE com `status != 'approved'` afeta 1 linha e recebe essa linha no `.select()`. O segundo request faz o mesmo UPDATE com o mesmo payment_id/external_id; como a linha já está `approved`, a condição `status != 'approved'` não é satisfeita e **0 linhas** são afetadas. O segundo não credita (claim perdeu).
- **Webhook vs reconciliação:** Quem fizer o UPDATE primeiro (por payment_id/external_id no webhook ou por id na recon) “ganha” a linha (1 row). O outro, ao tentar atualizar a mesma lógica (recon por id do mesmo registro, ou webhook por payment_id), obtém 0 linhas e não credita.
- **Retry do MP:** Reenvio do mesmo evento resulta de novo em UPDATE com `status != 'approved'`; a linha já está approved, 0 linhas, sem segundo crédito.

O crédito de saldo ocorre **somente** quando o UPDATE condicional afetou exatamente uma linha, garantindo “uma vez por pagamento aprovado”.

---

## 4) Por que não quebra depósitos atuais

- Fluxo “feliz” (primeiro processamento): continua igual — 1 linha é afetada pelo UPDATE condicional, o código recebe 1 row, credita saldo e loga “Claim ganhou”.
- Pagamentos já aprovados: já têm status `approved`; o UPDATE condicional não afeta linhas; o código faz log “Claim perdeu” e sai sem crédito (idempotente).
- Lookup e valor do crédito: mesmos campos (payment_id, external_id, amount, valor) e mesma fórmula; apenas a **condição** do UPDATE e a decisão “só creditar se 1 linha” foram adicionadas.
- Resposta HTTP e ordem de execução (200 antes de processar) mantidas; integração com o MP não exige mudança.

---

## 5) Plano de rollback (redeploy)

- Reverter o deploy para a versão anterior do `server-fly.js` (commit anterior ao patch).
- Nenhuma migration ou alteração de banco foi feita; não é necessário rollback de schema.
- Após o rollback, o comportamento volta ao anterior (idempotência apenas por “já approved?” em SELECT, com janela de concorrência).

---

## 6) Plano de validação pós-deploy (somente leitura no banco)

- **Query 1 — Pagamentos approved recentes e consistência de saldo:**  
  Listar `pagamentos_pix` com `status = 'approved'` e `updated_at` nos últimos X dias (ex.: 7). Para cada um, conferir que existe exatamente um registro por `payment_id` (ou por external_id, conforme schema). Opcional: somar PIX aprovados por usuário e comparar com evolução de saldo (sem alterar dados).

- **Query 2 — Caso external_id duplicado (ex.: expired):**  
  Verificar se registros com mesmo `external_id` e status diferente de `approved` (ex.: expired) continuam **sem** crédito (nenhuma linha com status approved para esse external_id, ou apenas uma linha approved). O patch não altera esse caso: se duas linhas têm o mesmo external_id e apenas uma puder passar para approved (por payment_id único), só uma será “claimed”; se ambas tiverem status != 'approved', o claim por external_id pode afetar as duas — nesse caso o código só credita quando **exatamente 1** linha é retornada; se 2 linhas forem atualizadas, `claimedRows.length === 2` e não se credita (evitando double credit).

- **Script opcional:** `scripts/audit-c-postdeploy-readonly.js` — apenas SELECT; reporta duplicados por external_id/payment_id approved e alertas de diferença entre soma de PIX approved e saldo (top N usuários).

---

*Relatório Missão C — MAX SAFETY. Patch aplicado em server-fly.js (webhook de depósito e reconcilePendingPayments).*
