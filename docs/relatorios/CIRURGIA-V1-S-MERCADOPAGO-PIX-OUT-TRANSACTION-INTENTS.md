# CIRURGIA V1-S — Saque automático Mercado Pago (Pix Out / transaction-intents)

**Data:** 2026-04-24  
**Modo:** cirurgia de código concluída no repositório; **sem deploy**, **sem worker**, **sem execução de migração** nesta entrega.  
**Gate operacional:** produção permanece **BLOQUEADA** até Money Out habilitado no MP, migração SQL aplicada, `MP_PAYOUT_*` configurado e smoke test controlado.

---

## Resumo executivo

Substituição de `POST /v1/transfers` por **`POST /v1/transaction-intents/process`**, com `external_reference` curto (`wd_` + 24 hex), **`X-Idempotency-Key` estável** (`idem-saque-{saqueId}`), persistência de **`mp_transaction_intent_id`**, **`mp_payout_status`**, **`mp_payout_raw`** (sanitizado), webhook de payout alinhado à doc de [notificações Payouts](https://www.mercadopago.com.br/developers/pt/docs/payouts/notifications) + **GET** `/v1/transaction-intents/{id}` quando o corpo vier incompleto.

---

## Saída obrigatória (1–14)

### 1. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `services/pix-mercado-pago.js` | `createPixWithdraw` reimplementado; `getTransactionIntent`; assinatura Ed25519 opcional/obrigatória por env; depósito inalterado. |
| `src/domain/payout/processPendingWithdrawals.js` | `payout_external_reference`, idempotência, titular Pix (CPF perfil para chaves não-CPF/CNPJ), persistência MP pós-resposta, falhas terminais. |
| `server-fly.js` | Webhook `POST /webhooks/mercadopago` apenas payout; lookup por `payout_external_reference` + legado `uuid_uuid`; GET intent; depósito **não** alterado (`/api/payments/webhook`). |
| `database/migrations/20260424_mp_payout_transaction_intents.sql` | Colunas additive-only + índice único parcial em `payout_external_reference`. |
| `docs/relatorios/CIRURGIA-V1-S-MERCADOPAGO-PIX-OUT-TRANSACTION-INTENTS.md` | Este relatório. |

### 2. Migração SQL

Ver `database/migrations/20260424_mp_payout_transaction_intents.sql`. **Aplicar manualmente** no Supabase após revisão. Não altera CHECK de `status` (varia por ambiente).

### 3. Novo payload MP

`external_reference`, `point_of_interaction: { type: "PSP_TRANSFER" }`, `transaction.from.accounts`, `transaction.to.accounts` (Pix: `chave.type` CPF/CNPJ/EMAIL/PHONE/**PIX_CODE**, `owner.identification`), `total_amount`, opcional `seller_configuration.notification_info.notification_url`.

### 4. Headers obrigatórios

`Authorization`, `Content-Type`, `X-Idempotency-Key`, `X-Test-Token`, `X-Enforce-Signature`; em produção com enforce: **`X-signature`** (Ed25519 do body UTF-8, base64) + **`MP_PAYOUT_PRIVATE_KEY`** (PEM).

### 5. Status internos mapeados

| Origem MP / fluxo | `saques.status` |
|-------------------|-----------------|
| Sucesso sync (não terminal negativo) | `aguardando_confirmacao` |
| Webhook: pending / created / in_process | `aguardando_confirmacao` |
| Webhook: approved / credited ou processed+approved | `processado` + ledger `payout_confirmado` |
| Falha API ou status terminal negativo | `falhou` (via `rollbackWithdraw`) + `falha_payout` |

Confirmar **CHECK** real em produção para `aguardando_confirmacao`, `processado`, `falhou`, `pendente`, `pending`, `processando`.

### 6. `external_reference` curta

Prefixo `wd_` + 12 bytes hex (24 chars) ≈ 27 caracteres; unicidade com índice único parcial + retries no worker. Persistida em `saques.payout_external_reference`.

### 7. Idempotência

- Header **`X-Idempotency-Key`:** `idem-saque-{uuid_do_saque}` (estável por saque).  
- Webhook / ledger: inalterado (`payout_confirmado` / `falha_payout` por `correlation_id` + `referencia`).

### 8. Persistência do id MP

Coluna `mp_transaction_intent_id`; atualizada no worker após POST e no webhook quando aplicável; divergência intent vs persistido → **abort** (anti-confusão).

### 9. Validação do webhook

- Rota dedicada payout; ignora `type=payment` numérico (defesa em profundidade).  
- Corpo mínimo: complementar com **GET** `transaction-intents/{id}` usando token payout.  
- Assinatura específica do POST de notificação Payouts: **não documentada** como webhooks “Payments”; recomenda-se HTTPS, URL secreta, e confirmação via **GET** autoritativo. Opcional: alinhar com MP Integrações se houver segredo compartilhado para este canal.

### 10. Riscos financeiros

**Alto** se migração não aplicada (updates falham), se `PAYOUT_PIX_ENABLED=true` sem smoke test, ou se assinatura / conta Money Out incorretos (débito inesperado). Manter payout **desligado** até gate verde.

### 11. Riscos de compliance

Chave **EVP**/email/telefone exige **CPF no perfil** (`usuarios.cpf`) para `owner.identification` — pode bloquear saques até cadastro completo (comportamento desejado para Pix Out). Validar uso do produto MP com jogo + saques com jurídico/MP.

### 12. Plano de testes (não executados aqui)

1. `node --check` nos arquivos alterados — **OK** localmente.  
2. Payload gerado (unit/fixture) contra schema MP.  
3. `payout_external_reference.length <= 64`.  
4. Repetir POST com mesmo `X-Idempotency-Key` → mesma resposta esperada.  
5. Simular 4xx/5xx MP → `falha_payout` + rollback.  
6. Inserir saque de teste com cada `status` permitido pelo CHECK real.  
7. Webhook duplicado → ledger dedupe.  
8. Worker com `PAYOUT_PIX_ENABLED=false` → não chama MP.  
9. Um saque real mínimo + 1 worker (após aprovação explícita).

### 13. Plano de rollback

- `PAYOUT_PIX_ENABLED=false`; worker parado.  
- Reverter commit / release anterior.  
- Migração additive-only: **não** dropar colunas em rollback emergencial.  
- Saques presos em `processando`: procedimento manual já existente (cancelamento + estorno contábil).

### 14. Decisão

**BLOQUEADO POR CONTA/PRODUTO** para produção até: migração aplicada; Money Out + chave pública aceita pelo MP (quando `MP_PAYOUT_ENFORCE_SIGNATURE=true`); `MP_PAYOUT_WEBHOOK_URL` HTTPS; smoke em sandbox.  
**PRONTO PARA IMPLEMENTAÇÃO** no repositório (código + SQL + doc); **não** “pronto para dinheiro real” sem os gates acima.

---

## Variáveis de ambiente relevantes

| Variável | Função |
|----------|--------|
| `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` | Bearer payout (já existente). |
| `MP_PAYOUT_WEBHOOK_URL` | URL notificação (opcional; recomendado). |
| `MP_PAYOUT_TEST_TOKEN` | `true` → header `X-Test-Token: true` (sandbox). |
| `MP_PAYOUT_ENFORCE_SIGNATURE` | `true` → exige `MP_PAYOUT_PRIVATE_KEY` (produção real). |
| `MP_PAYOUT_PRIVATE_KEY` | PEM Ed25519 (privada), `\n` escapado permitido. |
| `PAYOUT_PIX_ENABLED` | Gate global (manter `false` até aprovação). |

---

## Reconciliação (Fase 9)

Não foi agendado `setInterval` no `server-fly.js`. Próximo passo sugerido: função batch (cron interno ou job externo) que lista `aguardando_confirmacao` com `mp_transaction_intent_id`, chama `getTransactionIntent`, aplica a mesma máquina de estados do webhook, com idempotência de ledger.
