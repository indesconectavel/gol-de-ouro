# CORRECAO CIRÚRGICA — WEBHOOK + RECONCILE PIX

**Data:** 2026-03-28.  
**Escopo:** webhook Mercado Pago, reconcile de `pagamentos_pix`, prefixo `external_reference` no controller legado; sem saque, sem jogo.

---

## 1. Resumo executivo

- A validação do webhook passou a seguir o protocolo oficial do Mercado Pago: header `x-signature` com `ts` e `v1`, *manifest* `id:...;` + `request-id:...;` (se existir) + `ts:...;`, HMAC-SHA256 com `MERCADOPAGO_WEBHOOK_SECRET`, comparação segura com `v1`.
- O reconcile passa a priorizar **`payment_id` numérico** e só então `external_id` numérico; linhas sem ID MP numérico deixam de ser reprocessadas em loop quando a coluna `reconcile_skip` existir (migração SQL incluída).
- Novas preferências criadas via `paymentController` deixam de usar o prefixo `deposito_` em `external_reference`, alinhando ao padrão `goldeouro_` já usado em `server-fly.js` na criação direta de pagamento.
- RPC `creditar_pix_aprovado_mp`, fallback JS e contratos de resposta do PIX em `server-fly.js` **não** foram alterados.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `utils/webhook-signature-validator.js` | `validateMercadoPagoWebhook` reimplementado (formato MP `ts,v1` + manifest); fluxo `sha256=` mantido para `validateGenericWebhook` / testes legados. |
| `server-fly.js` | Reconcile: `resolveMercadoPagoPaymentIdString`, `markPagamentoPixReconcileSkip`, filtro `reconcile_skip = false`, fallback se coluna ausente, logs mais claros. |
| `controllers/paymentController.js` | `external_reference`: `goldeouro_${userId}_${Date.now()}` (antes `deposito_...`). |
| `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql` | **Novo:** coluna `reconcile_skip` + índice parcial. |
| `.env.example` | Comentários opcionais `MERCADOPAGO_WEBHOOK_SECRET` e `MP_WEBHOOK_TS_SKEW_SEC`. |

---

## 3. Correção do webhook

- **Antes:** regex `sha256=...` / `sha1=...` e HMAC sobre o corpo JSON → rejeição sistemática com `Formato de signature inválido`.
- **Agora:** parse de `x-signature` em partes `ts` e `v1`; `data.id` obtido de `req.query['data.id']` ou `req.body.data.id`; `x-request-id` incluído no manifest apenas quando presente (conforme documentação MP); HMAC-SHA256 do manifest; validação de janela temporal do `ts` (segundos ou ms) com limite configurável `MP_WEBHOOK_TS_SKEW_SEC` (padrão 600 s).
- **Arquivo:** `utils/webhook-signature-validator.js`, método `validateMercadoPagoWebhook`.

---

## 4. Correção da criação do PIX

- **`server-fly.js`** (`POST /api/payments/pix/criar`): inalterado — já persiste `payment_id` e `external_id` com `String(payment.id)` do Mercado Pago (chave canónica do pagamento).
- **`paymentController.criarPagamentoPix`:** apenas `external_reference` deixou de usar `deposito_<user>_<timestamp>`, evitando novo ruído semântico alinhado a legados `deposito_...`. O que continua gravado em BD é o ID da preferência (`result.id`) em `payment_id` / `external_id` (comportamento existente do SDK).

---

## 5. Correção do reconcile

- **Seleção:** `status = pending`, `created_at` antigo, `reconcile_skip = false` (quando a coluna existe).
- **ID consultado no MP:** somente dígitos; ordem **`payment_id`** depois **`external_id`** (`resolveMercadoPagoPaymentIdString`).
- **Legado:** se não houver ID numérico, um `console.warn` explica o caso e, se a coluna existir, `reconcile_skip = true` para não repetir o mesmo pending indefinidamente.
- **Fallback:** se a coluna `reconcile_skip` ainda não existir no banco, o código volta à listagem antiga e emite aviso para aplicar a migração (sem tentar `UPDATE` na coluna inexistente).

---

## 6. Tratamento dos dados legados

- Migração: `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql` — adiciona `reconcile_skip boolean NOT NULL DEFAULT false` e índice para pendentes elegíveis.
- Linhas já quebradas (ex.: `deposito_...` em `payment_id`) passam a ser marcadas com `reconcile_skip = true` na primeira passagem **após** a migração, até intervenção manual ou saneamento separado.
- Registros antigos com `deposito_` **não** são corrigidos automaticamente para um ID MP válido (fora do escopo mínimo).

---

## 7. Riscos eliminados

- Webhooks legítimos do MP deixam de falhar só pelo formato do header.
- HMAC deixa de ser calculado sobre o corpo errado.
- Reconcile deixa de logar erro repetido para o mesmo ID não numérico quando `reconcile_skip` está disponível.
- Novos fluxos via `paymentController` não reintroduzem o prefixo `deposito_` em `external_reference`.

---

## 8. Riscos remanescentes

- **Migração não aplicada:** reconcile continua listando todos os pending; IDs legados inválidos geram `warn` a cada ciclo (sem `UPDATE` de skip).
- **Assinatura ainda inválida após correção:** possíveis causas — secret diferente do painel, proxy que remove `x-request-id`, ou `data.id` só em formato que não bate com o que o MP assinou; exige inspeção de um payload real.
- **Notificações MP sem assinatura** (casos especiais documentados pelo MP para alguns QR): com `MERCADOPAGO_WEBHOOK_SECRET` definido, o endpoint continua exigindo validação; mitigação seria produto/config (fora deste patch).
- **Fluxo Checkout Pro (`preference`)** ainda grava ID de **preferência**, não o ID do **pagamento** efetivo; crédito via webhook/reconcile depende do pagamento MP bater na linha — risco pré-existente se o modelo de dados não for alinhado ao pagamento real.

---

## 9. Checklist de validação

1. Aplicar `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql` no Supabase (produção/staging).
2. Confirmar `MERCADOPAGO_WEBHOOK_SECRET` igual à assinatura secreta do app no painel MP (Suas integrações → Webhooks).
3. Pagamento PIX de teste: webhook deve retornar `200` (e logs sem `Formato de signature inválido`); após aprovação no MP, `pagamentos_pix.status` → `approved` e saldo atualizado (RPC ou fallback).
4. Verificar logs `[RECON]` sem repetição infinita para o mesmo `id` de linha legada após marcação `reconcile_skip`.
5. Opcional: ajustar `MP_WEBHOOK_TS_SKEW_SEC` se houver skew grande entre relógios.

---

## 10. Veredito

**CORREÇÃO CONCLUÍDA**

As alterações mínimas no código estão aplicadas; o comportamento pleno de exclusão de legados no reconcile depende da execução da migração SQL (documentada e versionada).
