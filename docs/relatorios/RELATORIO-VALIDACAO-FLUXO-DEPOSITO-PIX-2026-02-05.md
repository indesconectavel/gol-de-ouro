# Relatório de Validação – Fluxo Real de Depósito PIX (Read-Only)

**Data:** 05/02/2026  
**Objetivo:** Validar o fluxo REAL de depósito PIX ponta a ponta no projeto Gol de Ouro (somente leitura).  
**Modo:** Nenhuma alteração de código, deploy, pagamento, webhook ou banco.

---

## 1) Backend – Criação de Pagamento PIX

### Endpoint de criação
- **Rota:** `POST /api/payments/pix/criar`
- **Arquivo:** `server-fly.js` (linhas 1706–1867), implementação inline (não usa `paymentRoutes.js` nem `PaymentController.criarPagamentoPix`).
- **Autenticação:** `authenticateToken` (JWT).

### Uso do Mercado Pago
- **API direta** (sem SDK de Preference no fluxo ativo): `POST https://api.mercadopago.com/v1/payments`.
- **Token:** `process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (obrigatório em produção via `config/required-env.js`).

### Campos enviados ao MP
| Campo | Valor |
|-------|--------|
| `transaction_amount` | `parseFloat(amount)` do body |
| `description` | `'Depósito Gol de Ouro'` |
| `payment_method_id` | `'pix'` |
| `payer` | email, first_name, last_name, identification (CPF) |
| `external_reference` | `goldeouro_${req.user.userId}_${Date.now()}` |
| `statement_descriptor` | `'GOL DE OURO'` |
| **notification_url** | `${process.env.BACKEND_URL \|\| 'https://goldeouro-backend-v2.fly.dev'}/api/payments/webhook` |

- **X-Idempotency-Key:** enviado na criação (`pix_${userId}_${Date.now()}_${randomBytes}`), reduz duplicidade de criação no MP.

### URL real de webhook exposta (Fly.io)
- **URL efetiva:** `https://goldeouro-backend-v2.fly.dev/api/payments/webhook` (quando `BACKEND_URL` não está definido).
- **Path:** `/api/payments/webhook` (não `/api/payments/pix/webhook`).

---

## 2) Webhook de Depósito

### Endpoint que recebe notificações PIX
- **Rota:** `POST /api/payments/webhook`
- **Arquivo:** `server-fly.js` (linhas 1969–2132).

### Verificação de assinatura
- **Implementação:** `utils/webhook-signature-validator.js` (classe `WebhookSignatureValidator`).
- **Comportamento:** Se `MERCADOPAGO_WEBHOOK_SECRET` estiver definido:
  - Em **produção** (`NODE_ENV === 'production'`): webhook com assinatura inválida retorna **401** e não processa.
  - Fora de produção: apenas loga aviso e segue.
- **Headers usados:** `x-signature`, `x-timestamp`; payload usa `rawBody` quando existir, senão `JSON.stringify(req.body)`.

### Transição de status
- Webhook trata apenas `type === 'payment'` e `data.id`.
- Consulta o pagamento na API do MP (`GET /v1/payments/${paymentId}`).
- Se `status === 'approved'`:
  - Atualiza `pagamentos_pix`: `status = 'approved'`, `updated_at`.
  - Busca registro por `external_id` ou `payment_id`.
  - Atualiza `usuarios.saldo` (incremento com `amount` ou `valor` do registro PIX).
- **Não** há transição explícita “pending → approved” em máquina de estados; apenas leitura do status no MP e atualização no banco.

### Criação/atualização por entidade

| Entidade | Criação/atualização no webhook de depósito |
|----------|--------------------------------------------|
| **pagamentos_pix** | Sim – `update` de `status` e `updated_at`. |
| **transacoes** | **Não** – o webhook em `server-fly.js` **não** insere em `transacoes`. |
| **ledger_financeiro** | **Não** – não usado no fluxo de depósito (usado apenas em payout em `/webhooks/mercadopago`). |
| **Saldo do usuário** | Sim – `update` em `usuarios.saldo` (incremento). |

- O `PaymentController.processarPagamentoAprovado` (que insere em `transacoes`) **não é chamado** pelo fluxo real; o servidor usa apenas a lógica inline do webhook em `server-fly.js`.

---

## 3) Banco de Dados

### Consistência entre pagamento aprovado, transação e saldo
- **pagamentos_pix:** atualizado para `approved` e usado como fonte de `usuario_id` e valor.
- **usuarios.saldo:** atualizado de forma consistente com o valor do PIX.
- **transacoes:** **não** há registro de “depósito via PIX” gerado pelo webhook nem pela reconciliação. Extrato/auditoria baseados só em `transacoes` ficam incompletos para depósitos PIX do fluxo real.

### Idempotência
- **payment_id / external_id:**
  - Na **criação:** um registro em `pagamentos_pix` por chamada (com `external_id` e `payment_id` = id do MP).
  - No **schema** (`aplicar-schema-supabase-automated.js`): **não** há constraint UNIQUE em `external_id` nem em `payment_id`. Risco teórico de mais de um registro para o mesmo pagamento MP.
- **Webhook:**
  - Antes de processar, consulta `pagamentos_pix` por `external_id` ou `payment_id` e, se já existir com `status === 'approved'`, retorna sem creditar de novo (idempotência por status).
  - Não há tabela de “eventos processados” (ex.: `mp_events`) para o webhook de **depósito**; a rota `/webhooks/mercadopago` de payout usa `mp_events` e `ledger_financeiro` com `correlation_id`.

### Reconciliação (fallback)
- Função `reconcilePendingPayments()` em `server-fly.js`: varre `pagamentos_pix` com `status = 'pending'`, consulta o MP e, se `approved`, atualiza `pagamentos_pix` e `usuarios.saldo`.
- **Não** insere em `transacoes` nem em `ledger_financeiro`.

---

## 4) Riscos e Inconsistências (somente leitura)

### URLs divergentes de webhook
- **Fluxo ativo:** `BACKEND_URL` ou `https://goldeouro-backend-v2.fly.dev` + `/api/payments/webhook`.
- **Outros arquivos (não usados no fluxo ativo de depósito):**
  - `services/pix-service-real.js`: `PIX_WEBHOOK_URL` ou `https://goldeouro-backend.fly.dev/api/payments/pix/webhook` (host e path diferentes).
  - `services/pix-service.js` e `services/pix-mercado-pago.js`: `https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook` (path `/pix/webhook`).
- **config/production.js:** `BACKEND_URL` default `https://goldeouro-backend.fly.dev` (sem `-v2`).
- **Risco:** Se no painel do Mercado Pago for configurada uma URL desses outros trechos (path ou host errado), as notificações de depósito podem não chegar ao endpoint real.

### Falta de validação de status
- O webhook só processa quando o MP retorna `approved`. Outros status são ignorados (não há atualização explícita para `rejected`, `cancelled`, etc. em `pagamentos_pix` no trecho analisado).

### Possíveis duplicidades
- **Sem UNIQUE em `external_id`/`payment_id`:** em caso de bug ou dupla chamada na criação, podem existir dois registros para o mesmo pagamento; a idempotência por “já approved” reduz, mas não elimina o risco em cenários de concorrência (duas requisições de webhook antes de qualquer update).
- **Webhook responde 200 antes de processar:** correto para não retry desnecessário pelo MP, mas o processamento assíncrono após o `res.status(200)` depende de não falhar; em falha, não há retry automático pelo mesmo evento.

### Outros pontos
- **Ledger:** Depósito PIX não gera lançamento em `ledger_financeiro`; apenas saques/payout usam.
- **Transações:** Depósitos PIX do fluxo real não geram linha em `transacoes`, diferentemente do que faz `PaymentController.processarPagamentoAprovado` no outro fluxo (Preference).

---

## 5) Saída Obrigatória

### Fluxo validado: **PARCIALMENTE**
- **Sim** para: criação de PIX (endpoint, MP, campos, webhook URL), recebimento do webhook, atualização de `pagamentos_pix` e de `usuarios.saldo`, idempotência básica por status e reconciliação de pendentes.
- **Não** para: consistência completa com `transacoes` e `ledger_financeiro` (depósito não registra nesses lugares).

### Pontos de atenção
1. **Transacoes:** Inserir registro em `transacoes` quando o depósito for aprovado (webhook e reconciliação) para extrato e auditoria consistentes.
2. **Ledger:** Definir se depósitos devem gerar lançamento em `ledger_financeiro`; hoje não geram.
3. **URLs de webhook:** Unificar referências (e config no MP) para uma única URL: `https://goldeouro-backend-v2.fly.dev/api/payments/webhook`.
4. **Schema:** Considerar UNIQUE em `external_id` ou `payment_id` em `pagamentos_pix` para evitar registros duplicados do mesmo pagamento.
5. **Assinatura:** Garantir `MERCADOPAGO_WEBHOOK_SECRET` e `NODE_ENV=production` em produção para rejeitar webhooks não assinados.

### Depósito PIX confiável para produção?
- **Operacionalmente:** Sim – criação, notificação, atualização de saldo e reconciliação estão implementados e o fluxo é utilizável em produção.
- **Auditoria/consistência:** Com ressalvas – falta registro em `transacoes` e (se desejado) em `ledger_financeiro`, e há riscos menores de duplicidade e URLs divergentes. Recomenda-se corrigir o registro em `transacoes` e alinhar URLs/UNIQUE antes de considerar o fluxo totalmente “confiável” para auditoria e conformidade.

---

*Relatório gerado em modo somente leitura. Nenhum código, deploy ou dado foi alterado.*
