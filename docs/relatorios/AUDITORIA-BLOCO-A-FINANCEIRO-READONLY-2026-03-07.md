# Auditoria BLOCO A — FINANCEIRO (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhum arquivo alterado, sem commits, deploy ou mudança de configuração.  
**Escopo:** Exclusivamente o bloco financeiro (depósito PIX, saque, ledger, payout worker) em uso real na produção.

---

## 1. Arquivos financeiros em uso real na produção

### 1.1 Core (entrypoint e rotas)

| Arquivo | Uso em produção |
|---------|------------------|
| **server-fly.js** | Entrypoint único (`npm start` → Fly). Contém todas as rotas financeiras em linha: depósito PIX, webhook depósito, request/histórico de saque, webhook payout, reconciliação. Não monta `router.js`, `paymentRoutes.js` nem `mpWebhook.js`. |
| **package.json** | `main: "server-fly.js"`, `start: "node server-fly.js"`. |

### 1.2 Domínio e worker

| Arquivo | Uso em produção |
|---------|------------------|
| **src/domain/payout/processPendingWithdrawals.js** | `createLedgerEntry`, `rollbackWithdraw`, `processPendingWithdrawals`. Inserção em `ledger_financeiro` com fallback `user_id` / `usuario_id`. |
| **src/domain/payout/withdrawalStatus.js** | Constantes de status (PENDING, PROCESSING, COMPLETED, REJECTED) usadas pelo processamento de saques. |
| **src/workers/payout-worker.js** | Process group `payout_worker` no Fly (`node src/workers/payout-worker.js`). Loop com `setInterval`; chama `processPendingWithdrawals` e `createPixWithdraw`. Só ativo se `ENABLE_PIX_PAYOUT_WORKER=true`. |

### 1.3 Serviços e suporte

| Arquivo | Uso em produção |
|---------|------------------|
| **services/pix-mercado-pago.js** | `createPixWithdraw` (POST MP `/v1/transfers`) com `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`. Validação de valor e chave PIX. |
| **database/supabase-unified-config.js** | `supabaseAdmin` usado em server-fly.js para todas as operações de banco (usuarios, pagamentos_pix, saques, ledger_financeiro). |
| **config/required-env.js** | Validação de env na subida; em produção exige `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`. |
| **utils/pix-validator.js** | Validação de dados de saque (valor, chave PIX, tipo) em POST `/api/withdraw/request`. |
| **utils/webhook-signature-validator.js** | Validação opcional de assinatura no webhook de depósito (`/api/payments/webhook`) quando `MERCADOPAGO_WEBHOOK_SECRET` está definido. |
| **config/system-config.js** | `calculateInitialBalance`, `isProductionMode` (usado em server-fly). |

### 1.4 Arquivos NÃO usados em produção (referência)

- **routes/paymentRoutes.js** e **controllers/paymentController.js**: não montados em server-fly.js; rotas de pagamento estão inline no server-fly.
- **routes/mpWebhook.js**: rota `/mercadopago` não montada; webhook de depósito é POST `/api/payments/webhook` e de payout é POST `/webhooks/mercadopago`, ambos em server-fly.js.
- **router.js** e **router-producao.js**: não usados como entrypoint no Fly.

---

## 2. Rotas reais (confirmadas)

| Função | Método | Rota real | Auth | Observação |
|--------|--------|-----------|------|-------------|
| Depósito PIX (criar) | POST | `/api/payments/pix/criar` | JWT (Bearer) | Body: `amount`; notification_url aponta para `/api/payments/webhook`. |
| Webhook confirmação depósito | POST | `/api/payments/webhook` | Nenhum (MP chama) | Body: `type`, `data.id`; opcional validação por `MERCADOPAGO_WEBHOOK_SECRET`. |
| Request de saque | POST | `/api/withdraw/request` | JWT (Bearer) | Body: `valor`, `chave_pix`, `tipo_chave`; idempotência por `x-idempotency-key` ou `x-correlation-id`. |
| Histórico de saque | GET | `/api/withdraw/history` | JWT (Bearer) | Retorna saques do usuário (até 50). |
| Webhook de payout | POST | `/webhooks/mercadopago` | Nenhum (MP chama) | Atualiza status do saque e ledger (`payout_confirmado` / `falha_payout`); em rejeição chama `rollbackWithdraw`. |

Base URL em produção: `https://goldeouro-backend-v2.fly.dev`.

---

## 3. Fluxo de atualização de saldo

### 3.1 Crédito (depósito)

1. **Webhook** (`/api/payments/webhook`): ao receber `type === 'payment'` e status `approved` no MP:
   - Claim atômico em `pagamentos_pix` (update por `payment_id` ou `external_id` com `.neq('status','approved')`).
   - Se exatamente 1 linha afetada: busca `usuarios.saldo`, soma o valor do pagamento, update em `usuarios.saldo`.
2. **Reconciliação** (`reconcilePendingPayments` em server-fly.js): a cada `MP_RECONCILE_INTERVAL_MS` (default 60s) lista `pagamentos_pix` com status `pending` e `created_at` antigo; consulta MP; se `approved`, mesmo claim + crédito em `usuarios.saldo`.

Nenhum crédito é feito em `ledger_financeiro` no fluxo de depósito (apenas atualização de `usuarios.saldo` e `pagamentos_pix.status`).

### 3.2 Débito (saque)

1. **Request** (`/api/withdraw/request`): após validar e criar registro em `saques`:
   - Update em `usuarios`: `saldo = saldo - valor` com condição `.eq('saldo', usuario.saldo)` (otimistic lock).
   - Em seguida: `createLedgerEntry({ tipo: 'withdraw_request', valor: -requestedAmount, ... })`. Se o ledger falhar, é chamado `rollbackWithdraw` (restitui saldo, marca saque rejeitado, ledger `rollback`).

### 3.3 Restituição (rollback de saque)

- **rollbackWithdraw** (em `processPendingWithdrawals.js`): soma o `amount` de volta em `usuarios.saldo`, insere ledger `rollback`, atualiza `saques` para status rejeitado e `processed_at`.

---

## 4. Fluxo do ledger_financeiro

- **Tabela:** `ledger_financeiro`.
- **Coluna de usuário:** descoberta em runtime: tenta `user_id`; se falhar, tenta `usuario_id` e grava em cache (`ledgerUserIdColumn`).
- **Tipos usados:**
  - `withdraw_request`: no request de saque (valor negativo).
  - `payout_confirmado`: no webhook de payout quando status MP é approved/credited (valor líquido positivo).
  - `falha_payout`: quando payout é rejeitado/cancelado ou quando o worker falha ao enviar; antes do rollback.
  - `rollback`: em `rollbackWithdraw` (valor positivo, restituição).
- **Idempotência:** por `correlation_id` + `tipo` + `referencia`; se já existir linha, não insere de novo.
- **CorrelationId:** cliente envia UUID ou string; é normalizado para UUID via `toLedgerCorrelationId` (hash SHA256 se não for UUID).

---

## 5. Fluxo do payout worker

1. **Processo:** Fly.io process group `payout_worker` → `node src/workers/payout-worker.js` (definido em `fly.toml`).
2. **Condições para rodar:** `ENABLE_PIX_PAYOUT_WORKER=true` (senão o worker faz `process.exit(0)`); dentro do ciclo, `PAYOUT_PIX_ENABLED=true` e Supabase conectado.
3. **Ciclo:** `setInterval(runCycle, PAYOUT_WORKER_INTERVAL_MS)` (default 30s). Em cada ciclo:
   - Lista `saques` com status em `['pendente','pending','processando','processando']`, ordem `created_at` asc, limite 1.
   - Se já finalizado (concluido/rejeitado), skip.
   - Lock: update status para `processando` com condição `.in('status', [pendente, pending, processando])`.
   - Chama `createPixWithdraw` (pix-mercado-pago: POST MP `/v1/transfers`).
   - Se sucesso: atualiza saque para `concluido`, `processed_at`, `transacao_id`; incrementa `payoutCounters.success`.
   - Se falha: `createLedgerEntry(tipo: 'falha_payout')`, `rollbackWithdraw`, incrementa `payoutCounters.fail`.
4. **Confirmação externa:** o MP envia resultado para `/webhooks/mercadopago`; aí o backend atualiza status do saque e ledger (`payout_confirmado` ou rejeição + rollback). O worker não depende do webhook para marcar “concluído” quando a API de transfer retorna sucesso; o webhook alinha estados quando o MP notifica approved/rejected.

---

## 6. Riscos identificados

| Risco | Gravidade | Descrição |
|-------|-----------|------------|
| Worker desabilitado por env | Alta | Se `ENABLE_PIX_PAYOUT_WORKER` ou `PAYOUT_PIX_ENABLED` não forem `true`, saques ficam pendentes sem processamento. |
| Dois tokens MP | Média | Depósito: `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`; saque: `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`. Falta de um afeta só o fluxo correspondente. |
| Webhook depósito sem secret | Média | Se `MERCADOPAGO_WEBHOOK_SECRET` não estiver configurado, a validação de assinatura não é aplicada; em produção o código só rejeita por signature quando o secret existe. |
| Ledger user_id vs usuario_id | Mitigado | Fallback automático no código; depende do schema real da tabela em produção. |
| Reconciliação em paralelo ao webhook | Baixa | Webhook e reconciliação podem disputar o mesmo pagamento; o claim atômico (update + select 1 row) reduz duplicidade de crédito. |
| Uma máquina worker | Baixa | Um processo worker por grupo; se cair, saques pendentes só voltam a processar quando o worker subir de novo. |

---

## 7. Pendências identificadas

| Pendência | Tipo | Descrição |
|-----------|------|------------|
| Registro de depósito no ledger | Funcional | Depósito aprovado só atualiza `usuarios.saldo` e `pagamentos_pix`; não há linha em `ledger_financeiro` para depósito (dificulta auditoria contábil completa). |
| Documentação da URL do webhook payout no MP | Operacional | Garantir que no painel MP a URL de webhook para transfers seja `https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago`. |
| Confirmação do schema Supabase em produção | Dados | Confirmar se `ledger_financeiro` tem `user_id` ou `usuario_id` e se `saques` tem todas as colunas usadas (valor, amount, fee, net_amount, pix_key, chave_pix, correlation_id, status, processed_at, transacao_id). |
| Versão package vs runtime | Menor | package.json 1.2.0; server-fly expõe 1.2.1; alinhar se desejado. |

---

## 8. Status final do BLOCO A — FINANCEIRO

| Aspecto | Status |
|---------|--------|
| **Arquivos mapeados** | Definido: produção usa apenas server-fly.js + src/domain/payout/* + src/workers/payout-worker.js + services/pix-mercado-pago.js + utils (pix-validator, webhook-signature-validator) + config e database referenciados. |
| **Rotas** | Confirmadas: depósito PIX `/api/payments/pix/criar`, webhook depósito `/api/payments/webhook`, request saque `/api/withdraw/request`, histórico `/api/withdraw/history`, webhook payout `/webhooks/mercadopago`. |
| **Fluxo de saldo** | Crédito via webhook/reconciliação (claim atômico + update usuarios.saldo); débito no request (update saldo + ledger withdraw_request); restituição via rollbackWithdraw. |
| **Ledger** | Em uso para saque (withdraw_request, payout_confirmado, falha_payout, rollback); idempotência e fallback user_id/usuario_id implementados; depósito não grava no ledger. |
| **Payout worker** | Implementado e configurado no Fly (process group payout_worker); depende de env para estar ativo. |
| **Riscos** | Principal: env do worker; demais documentados e em parte mitigados. |
| **Pendências** | Ledger para depósito opcional; conferência de URL webhook e schema em produção. |

**Conclusão:** O BLOCO A — FINANCEIRO está implementado e em uso em produção de forma coerente com o código auditado. O sistema de depósito (PIX + webhook + reconciliação) e o de saque (request + ledger + worker + webhook payout + rollback) estão definidos em server-fly.js e nos módulos listados. As principais dependências são as variáveis de ambiente (tokens MP e flags do worker) e o schema Supabase alinhado ao código.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo, commit, deploy ou configuração foi alterado.*
