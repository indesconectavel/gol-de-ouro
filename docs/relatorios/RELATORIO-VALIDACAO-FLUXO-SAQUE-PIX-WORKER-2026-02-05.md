# Relatório de Validação – Fluxo Real de Saque PIX e Worker de Payout (Read-Only)

**Data:** 05/02/2026  
**Objetivo:** Validar o fluxo real de saque PIX com worker de payout, segurança financeira e consistência contábil (somente leitura).  
**Modo:** Nenhuma alteração de código, execução de worker, criação de saques, reenvio de webhooks ou variáveis de ambiente.

---

## 1) Solicitação de Saque

### Endpoint de criação
- **Rota:** `POST /api/withdraw/request`
- **Arquivo:** `server-fly.js` (linhas 1372–1644).
- **Autenticação:** `authenticateToken` (JWT). Corpo: `{ valor, chave_pix, tipo_chave }`.

### Regras validadas
| Regra | Implementação |
|-------|----------------|
| **Saldo disponível** | Consulta `usuarios.saldo`; se `saldo < valor` retorna 400 "Saldo insuficiente". Débito com lock otimista: `update(...).eq('saldo', usuario.saldo)`; se não afetar linha retorna 409 "Saldo atualizado recentemente". |
| **Valor mínimo** | R$ 10,00 (`minWithdrawAmount = 10.00`). Valor máximo implícito no `PixValidator`: R$ 1.000,00 (0,50–1000 no validator; o endpoint aplica só o mínimo 10). |
| **Chave PIX** | `PixValidator.validateWithdrawData(withdrawData)`: valida formato por tipo (cpf, cnpj, email, phone, random), normalização, CPF/CNPJ com dígitos verificadores, e `isPixKeyAvailable` (lista de chaves inválidas/teste e DDD para telefone). |

### Idempotência na solicitação
- **Correlation id:** `x-idempotency-key` ou `x-correlation-id` ou `crypto.randomUUID()`.
- Se já existir saque com o mesmo `correlation_id`, retorna 200 com o saque existente (não cria outro).
- **Um saque pendente por usuário:** consulta `saques` com `usuario_id` e `status in ('pendente','pending')`; se existir, retorna 409 "Já existe um saque pendente em processamento".

### Registros criados na solicitação

| Entidade | Criado? | Detalhe |
|----------|---------|---------|
| **saques** | Sim | `usuario_id`, `valor`/`amount`, `fee`, `net_amount`, `correlation_id`, `pix_key`/`chave_pix`, `pix_type`/`tipo_chave`, `status: 'pendente'`. |
| **transacoes** | **Não** | Comentário no código: "Transação contábil: delegada para processador externo/contábil (removida do backend direto)". Nenhum `insert` em `transacoes` no fluxo de saque em `server-fly.js`. |
| **ledger_financeiro (pré-débito)** | Sim | Dois lançamentos: (1) `tipo: 'saque'`, `valor: requestedAmount`, `referencia: saque.id`, `correlation_id`; (2) `tipo: 'taxa'`, `valor: taxa`, `referencia: saque.id + ':fee'`. Se falhar o ledger, chama `rollbackWithdraw` (recompõe saldo, ledger rollback, saque → `falhou`). |
| **usuarios.saldo** | Débito imediato | Saldo é debitado antes de criar o saque; em falha ao inserir saque ou ledger, o saldo é revertido. |

---

## 2) Worker de Payout

### Localização
- **Arquivo:** `src/workers/payout-worker.js`.
- **Processo Fly.io:** em `fly.toml` o processo `payout_worker` executa `node src/workers/payout-worker.js` (processo separado do `app`).

### Condições para rodar
- `ENABLE_PIX_PAYOUT_WORKER=true` (case-insensitive); caso contrário `process.exit(0)`.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` definidos; senão `process.exit(1)`.
- `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` definido; senão `process.exit(1)`.

### Lógica do worker
- **Intervalo:** `PAYOUT_WORKER_INTERVAL_MS` (default 30.000 ms), mínimo 1.000 ms.
- **Ciclo:** `runCycle()` chama `processPendingWithdrawals({ supabase, isDbConnected, payoutEnabled, createPixWithdraw })`.
- **Proteção de sobreposição:** se `running === true`, ignora o ciclo ("Ciclo anterior ainda em execução").
- **Payout habilitado:** se `PAYOUT_PIX_ENABLED !== 'true'`, retorna sem processar.

### Leitura de saques pendentes
- **Arquivo:** `src/domain/payout/processPendingWithdrawals.js`.
- Query: `saques` com `status in ('pendente', 'pending')`, ordenado por `created_at` asc, **limit 1** (um saque por ciclo).
- Campos lidos: `id`, `usuario_id`, `amount`, `valor`, `fee`, `net_amount`, `pix_key`/`chave_pix`, `pix_type`/`tipo_chave`, `status`, `correlation_id`, `created_at`.

### Chamada à API do Mercado Pago
- **Função:** `createPixWithdraw` em `services/pix-mercado-pago.js`.
- **Token:** `MP_CONFIG.accessToken` = `process.env.MERCADOPAGO_PAYOUT_ACCESS_TOKEN`.
- **API:** `POST https://api.mercadopago.com/v1/transfers` com `amount`, `description`, `external_reference: saqueId_correlationId`, `receiver: { pix_key, pix_key_type }`.
- Validações no serviço: valor entre 0,50 e 1.000, chave e tipo obrigatórios, tipos (cpf, cnpj, email, phone, random), formato por tipo, `saqueId` e `correlationId` obrigatórios.

### Tratamento de falhas e retries
- **Falha ao criar payout:** registra `ledger_financeiro` com `tipo: 'falha_payout'`, chama `rollbackWithdraw` (recompõe saldo, ledger rollback, saque → `falhou`), incrementa `payoutCounters.fail`. Não há retry automático no mesmo ciclo para o mesmo saque.
- **Worker:** não há retry com backoff no worker; no próximo ciclo outro saque pode ser pego. Um saque que falhou fica com status `falhou` e não será reprocessado (worker só busca `pendente`/`pending`).
- **Lock duplicado:** update `status = 'processando'` com `.in('status', ['pendente','pending'])`; se não afetar linha (outro worker ou ciclo já pegou), retorna sem erro ("Tentativa duplicada ignorada").
- **correlation_id ausente:** rollback do saque e retorno com erro.
- **Exceções:** `uncaughtException` e `unhandledRejection` apenas logam; `running` é liberado no `finally` do ciclo.

---

## 3) Webhook / Retorno do Mercado Pago

### Endpoint de confirmação de payout
- **Rota:** `POST /webhooks/mercadopago`
- **Arquivo:** `server-fly.js` (linhas 2136–2309).
- Resposta imediata: `200 { received: true }`; processamento segue de forma assíncrona no mesmo handler.

### Payload esperado
- `status` (ou `data.status` / `data.payment.status`).
- `external_reference` (ou `data.external_reference` / `data.payment.external_reference`) no formato `saqueId_correlationId`.
- `id` (ou `data.id` / `data.transfer_id`) como identificador do payout.

### Transição de status
| Status do provedor (normalizado) | Ação |
|----------------------------------|------|
| **approved / credited** | Verifica idempotência no ledger; insere `ledger_financeiro` `tipo: 'payout_confirmado'`; atualiza `saques.status = 'processado'`; incrementa `payoutCounters.success`. |
| **in_process** | Atualiza `saques.status = 'aguardando_confirmacao'`. |
| **rejected / cancelled** | Insere ledger `tipo: 'falha_payout'`; chama `rollbackWithdraw` (recompõe saldo, ledger rollback, saque → `falhou`); incrementa `payoutCounters.fail`. |
| Outros | Apenas log de "Status não tratado". |

Fluxo típico: **pendente → processando** (worker) → **aguardando_confirmacao** (MP aceita) → **processado** (webhook approved/credited) ou **falhou** (webhook rejected/cancelled ou rollback no worker).

### Impacto no ledger e saldo
- **Ledger:** criação de `payout_confirmado` ou `falha_payout` com deduplicação por `(correlation_id, tipo, referencia)` em `createLedgerEntry`. Webhook verifica se já existe ledger `payout_confirmado` ou `falha_payout` para o par (saqueId, correlationId) e ignora evento duplicado.
- **Saldo:** não é alterado no webhook de sucesso (já foi debitado na solicitação). Em rejeição/cancelamento, `rollbackWithdraw` devolve o valor (e taxa) ao saldo e registra rollback no ledger.

---

## 4) Segurança

### Idempotência
- **Solicitação:** por `correlation_id`; retorno do saque existente evita duplicar saque.
- **Worker:** lock por update condicional (`status in ('pendente','pending')` → `processando`); apenas uma instância “ganha” o saque.
- **Ledger:** `createLedgerEntry` consulta por `(correlation_id, tipo, referencia)` antes de inserir; se já existir, retorna `deduped: true`.
- **Webhook:** consulta `ledger_financeiro` por `(correlation_id, referencia, tipo in ('payout_confirmado','falha_payout'))`; se existir, ignora ("Evento duplicado ignorado"). Validação de `correlation_id` do saque no banco vs payload.

### Prevenção de duplo saque
- Um saque pendente por usuário (409 se já houver).
- Débito de saldo com condição `eq('saldo', usuario.saldo)` (evita uso de saldo desatualizado).
- Worker processa um saque por ciclo e só saques em `pendente`/`pending`; após falha, status `falhou` não é reprocessado.
- Webhook só aplica confirmação/rejeição se o saque não estiver já em `processado` ou `falhou`.

### Logs críticos
- Solicitação: "Início", "Idempotência - saque já existente", "Sucesso" (saqueId, userId, correlationId), erros de saldo/ledger/saque.
- Worker: início/fim de ciclo, saque selecionado (saqueId, userId, correlationId, amount, netAmount, pixKey mascarada), "Payout iniciado", "Tentativa duplicada ignorada", "PAYOUT][FALHOU] rollback acionado", "PAYOUT][EM_PROCESSAMENTO] aguardando confirmação", resumo (payouts_sucesso/payouts_falha).
- Webhook: recebimento do body, "PAYOUT][CONFIRMADO]", "PAYOUT][REJEITADO] rollback acionado", "Evento duplicado ignorado", "Saque já finalizado", "correlation_id divergente".
- Rollback: "SAQUE][ROLLBACK] Início/Concluído" com saqueId, userId, correlationId, motivo.

---

## 5) Riscos e Inconsistências (somente leitura)

1. **transacoes:** O fluxo real de saque **não** insere em `transacoes`. Extrato/relatórios baseados só em `transacoes` ficam sem os saques feitos por este fluxo.
2. **Worker operacional:** Depende de `ENABLE_PIX_PAYOUT_WORKER=true` e de o processo `payout_worker` estar ativo no Fly.io. Não é possível afirmar só pela leitura do código se está ligado em produção.
3. **PAYOUT_PIX_ENABLED:** Tanto o worker quanto o webhook checam `PAYOUT_PIX_ENABLED=true`. Se estiver `false`, saques ficam pendentes e o webhook ignora confirmações.
4. **Um saque por ciclo:** O worker processa apenas 1 saque a cada intervalo. Fila grande pode demorar a ser escoada.
5. **Webhook sem assinatura:** O endpoint `/webhooks/mercadopago` não foi encontrado com validação de assinatura (diferente do webhook de pagamento). Risco de chamadas forjadas se a URL vazar.
6. **Token de payout:** O worker exige `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` ao iniciar; `pix-mercado-pago.js` usa o mesmo token para `/v1/transfers`. Consistente.

---

## 6) Saída Obrigatória

| Item | Resultado |
|------|-----------|
| **Fluxo de saque validado** | **SIM** – Solicitação com validação de saldo, valor mínimo, chave PIX, idempotência e bloqueio de duplo pendente; débito de saldo com lock; criação em `saques` e `ledger_financeiro` (saque + taxa); rollback em falha. Worker lê pendentes, chama MP com token de payout, trata falha com rollback. Webhook confirma/rejeita e atualiza status e ledger; idempotência e prevenção de duplo saque implementadas. |
| **Worker operacional** | **INCERTO** – Lógica e integração com MP e banco estão implementadas e o processo está definido em `fly.toml`. Operação real depende de `ENABLE_PIX_PAYOUT_WORKER=true`, processo `payout_worker` em execução no Fly e `PAYOUT_PIX_ENABLED=true`. Não é possível confirmar só pela leitura do código. |
| **Riscos financeiros identificados** | (1) **Extrato incompleto:** saques não registrados em `transacoes`. (2) **Webhook sem assinatura:** `/webhooks/mercadopago` pode ser alvo de chamadas forjadas se a URL for conhecida. (3) **Configuração:** payout desativado ou worker não iniciado deixa saques pendentes sem processamento automático. (4) **Fila:** um saque por ciclo pode gerar atraso em picos de demanda. |

---

*Relatório gerado em modo somente leitura. Nenhum código, worker, saque, webhook ou variável de ambiente foi alterado ou executado.*
