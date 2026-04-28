# HARDENING FINANCEIRO V1 — MERCADO PAGO (2026-04-28)

## 1. Problemas encontrados

1. Webhook de deposito aceitava modos permissivos em ambiente nao produtivo e podia prosseguir sem validacao estrita.
2. Falta de padrao unico de logs financeiros estruturados por evento (payment_id/correlation_id/user_id/tipo/status/valor).
3. Claim de deposito dependia de caminho app-first e tinha pouca observabilidade em cenarios idempotentes.
4. Reconcile de deposito tinha pouca telemetria de ciclo e limites sem clamp defensivo.
5. Fluxo de saque tinha validacoes robustas, mas faltava checagem final de consistencia minima do ledger por correlacao antes de responder sucesso.
6. Worker de payout nao bloqueava explicitamente valores financeiros invalidos (amount/fee/net).

## 2. Correcoes aplicadas

### Webhook de deposito (assinatura)
- Endpoint `POST /api/payments/webhook` alterado para **modo estrito**:
  - sempre valida assinatura;
  - rejeita com `401` em qualquer falha;
  - nao usa mais bypass por ambiente para processar evento invalido.
- Mantido contrato HTTP e rota existentes.

### Validacao de assinatura MP
- `utils/webhook-signature-validator.js`:
  - adicionado suporte a `x-request-id` e `x-requestid` para robustez de header;
  - mantida validacao do formato `ts=...,v1=...` + manifest oficial.

### Credito idempotente de deposito
- `claimAndCreditApprovedPixDeposit()`:
  - tenta primeiro RPC SQL `claim_and_credit_approved_pix_deposit` (caminho atomico);
  - fallback seguro para caminho legado quando RPC nao existe no ambiente;
  - reforco de logs por payment_id em todos os desfechos.

### Reconciliacao
- `reconcilePendingPayments()`:
  - clamp defensivo de `MP_RECONCILE_MIN_AGE_MIN` e `MP_RECONCILE_LIMIT`;
  - logs de inicio/fim de ciclo, ciclo vazio, claim aprovado/idempotente, skip por status.

### Saque (request + worker + webhook)
- `POST /api/withdraw/request`:
  - logs estruturados nas etapas criticas (inicio, idempotencia, bloqueio, conflito, erro, sucesso).
  - validacao de consistencia minima do ledger por `correlation_id` antes de concluir sucesso; em falha, rollback automatico.
- `src/domain/payout/processPendingWithdrawals.js`:
  - bloqueio de valores financeiros invalidos (`amount/fee/net`) com rollback e falha controlada.
- `POST /webhooks/mercadopago` (payout):
  - logs estruturados para duplicidade, confirmacao, aguardando confirmacao e falha com rollback.

## 3. Logs adicionados

Foi adicionado logger estruturado `financeLog(event, payload)` em `server-fly.js` com timestamp ISO e campos de auditoria.

Eventos principais:
- Deposito:
  - `deposit_created`
  - `deposit_webhook_rejected`
  - `deposit_webhook_duplicate`
  - `deposit_webhook_claim`
  - `deposit_claim_start`
  - `deposit_claim_sql`
  - `deposit_claim_idempotent_or_missing`
  - `deposit_reconcile_cycle_start|empty|end`
  - `deposit_reconcile_claim`
- Saque:
  - `withdraw_request_start`
  - `withdraw_request_idempotent`
  - `withdraw_request_created`
  - `withdraw_webhook_duplicate`
  - `withdraw_webhook_confirmed`
  - `withdraw_webhook_awaiting_confirmation`
  - `withdraw_webhook_failed_rollback`

## 4. Garantias implementadas

1. **Webhook invalido nao processa** no deposito (hard fail 401).
2. **1 pagamento = 1 credito** reforcado por claim atomico (RPC) e fallback idempotente.
3. **Reconcile sem duplicidade** (claim idempotente + logs por payment_id).
4. **Saque com consistencia minima obrigatoria** de ledger na conclusao da requisicao.
5. **Worker protegido contra payload financeiro invalido** com rollback.
6. **Rastreabilidade financeira** com logs estruturados por evento.

## 5. Riscos eliminados

- Processamento permissivo de webhook com assinatura invalida.
- Falta de rastreabilidade unificada dos eventos financeiros.
- Falta de telemetria detalhada de reconcile por ciclo.
- Possibilidade de concluir saque com ledger incompleto na mesma operacao.

## 6. Riscos restantes

1. Dependencia operacional da correta configuracao de `MERCADOPAGO_WEBHOOK_SECRET` e `x-request-id` no provedor.
2. Divergencias historicas pre-existentes entre saldo e ledger (fora do escopo da cirurgia atual) ainda exigem auditoria dedicada.
3. Reconciliacao cobre pending antigo, mas nao substitui monitoramento ativo de webhook em tempo real.

## 7. Checklist de teste real (deposito + saque)

### Deposito Pix (real)
- [ ] Criar PIX em `POST /api/payments/pix/criar`.
- [ ] Confirmar registro `pagamentos_pix` com `status=pending`.
- [ ] Simular webhook valido MP e confirmar `status=approved`.
- [ ] Verificar log `deposit_webhook_claim`.
- [ ] Garantir credito unico no saldo (sem duplicidade ao reenviar webhook).
- [ ] Forcar reconcile e validar `deposit_reconcile_claim` idempotente.

### Saque Pix (real)
- [ ] Solicitar saque em `POST /api/withdraw/request` com `x-idempotency-key`.
- [ ] Confirmar debito unico de saldo e ledger (`saque` + `taxa`) por `correlation_id`.
- [ ] Validar processamento do worker e transicao de status.
- [ ] Simular webhook payout terminal de sucesso e verificar `processado` + `payout_confirmado`.
- [ ] Simular webhook payout de falha e verificar rollback completo + `falha_payout`.
- [ ] Repetir chamada com mesma idempotency key e confirmar resposta idempotente.

## 8. Classificacao final

**RISCO BAIXO** (com as correcoes aplicadas neste hardening e validacao real obrigatoria do checklist acima antes de GO final).
