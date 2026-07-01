# Indesconectável Payment Engine™ — Hardening

**Versão:** P2.1  
**Data:** 2026-07-01  
**Base:** V1 CERTIFICADA (`payment-engine-v1-certified` / `eab1d74`)  
**Modo:** HARDENING CONTROLADO — sem alteração funcional

---

## 1. Objetivo

Auditoria estrutural completa da Payment Engine™ certificada, identificando riscos, acoplamentos, dívida técnica e recomendações para evolução V1.1 — preservando integralmente o comportamento certificado em P1.9 e congelado em P2.0B.

---

## 2. Inventário por Classificação

### 2.1 CORE (19 arquivos)

Motor reutilizável, independente de PSP e de domínio do jogo.

| Componente | Arquivo |
|------------|---------|
| Contrato PIX IN | `src/finance/contracts/PaymentProvider.js` |
| Contrato PIX OUT | `src/finance/contracts/PayoutProvider.js` |
| Factory | `src/finance/factory/FinanceProviderFactory.js` |
| Config PSP primário | `src/finance/config/primary-psp.js` |
| Config webhook | `src/finance/config/payment-webhook-config.js` |
| Config PIX OUT Asaas | `src/finance/config/asaas-pix-out-config.js` |
| Config transfer auth | `src/finance/config/asaas-transfer-auth-config.js` |
| PIX IN entry | `src/finance/deposit/createPixDeposit.js` |
| Claim depósito | `src/finance/deposit/claimApprovedPixDeposit.js` |
| Webhook engine | `src/finance/webhooks/processPaymentWebhook.js` |
| Transfer webhook | `src/finance/webhooks/processAsaasTransferWebhook.js` |
| Idempotency | `src/finance/webhooks/paymentWebhookIdempotency.js` |
| Dry-run store | `src/finance/webhooks/paymentWebhookDryRunStore.js` |
| Transfer authorization | `src/finance/webhooks/asaasTransferAuthorization.js` |
| Recovery Asaas | `src/finance/reconciliation/asaasPayoutRecovery.js` |
| Mock PIX IN | `src/finance/providers/mock/MockPaymentProvider.js` |
| Mock PIX OUT | `src/finance/providers/mock/MockPayoutProvider.js` |
| Payout orchestrator | `src/domain/payout/processPendingWithdrawals.js` |
| RPC claim | `database/claim_and_credit_approved_pix_deposit.sql` |

### 2.2 CORE + ADAPTER (11 arquivos)

Ponte, normalização ou persistência provider-aware.

| Arquivo | Papel |
|---------|-------|
| `src/finance/compat/createPixDepositCompat.js` | Monólito → factory PIX IN |
| `src/finance/compat/createPixWithdrawCompat.js` | Monólito → factory PIX OUT |
| `src/finance/compat/processPaymentWebhookCompat.js` | Monólito → webhook engine |
| `src/domain/payout/payoutProviderPersistence.js` | Normalização refs MP/Asaas |
| `src/finance/webhooks/paymentWebhookControlledCreditStore.js` | Store in-memory F4.6 |
| `src/finance/providers/mercadopago/mercadopago-webhook-validator.js` | Wrapper validação MP |
| `src/finance/providers/mercadopago/mercadopago-webhook-normalizer.js` | Normalização MP |
| `src/finance/providers/asaas/asaas-webhook-normalizer.js` | Normalização PAYMENT |
| `src/finance/providers/asaas/asaas-transfer-webhook-normalizer.js` | Normalização TRANSFER |
| `src/finance/providers/asaas/asaas-webhook-validator.js` | Validação token Asaas |
| `src/finance/providers/asaas/asaas-webhook-handler.js` | Handler auxiliar |

### 2.3 PROVIDER (14 arquivos)

Adapters PSP — isolados em `src/finance/providers/`.

| PSP | Arquivos |
|-----|----------|
| Asaas | `AsaasProvider.js`, `AsaasPaymentProvider.js`, `AsaasPayoutProvider.js`, `asaas-http-client.js`, `asaas-config.js` |
| Mercado Pago | `MercadoPagoPaymentProvider.js`, `MercadoPagoPayoutProvider.js` |
| Celcoin | `CelcoinProvider.js`, `CelcoinPaymentProvider.js`, `CelcoinPayoutProvider.js`, `celcoin-http-client.js`, `celcoin-config.js` |
| MP legado (payout) | `services/pix-mercado-pago.js` — ativo via `MercadoPagoPayoutProvider` |

### 2.4 GOL DE OURO (3 artefatos)

Acoplados ao domínio do jogo ou montagem HTTP do monólito.

| Artefato | Escopo |
|----------|--------|
| `server-fly.js` | Rotas financeiras inline, schedulers, reconcile MP, recovery interval |
| `src/workers/payout-worker.js` | Worker Fly dedicado |
| `controllers/adminWithdrawController.js` | Admin saques do painel Gol de Ouro |

### 2.5 LEGADO (5 arquivos + exports mortos)

Não montados no runtime de produção.

| Arquivo | Evidência |
|---------|-----------|
| `controllers/paymentController.js` | MP SDK antigo; não referenciado por `server-fly.js` |
| `routes/paymentRoutes.js` | ~90 rotas; maioria sem implementação no controller |
| `routes/mpWebhook.js` | Webhook PG paralelo; substituído |
| `services/pix-service.js` | Marcado `LEGADO` linha 1 |
| `services/pix-service-real.js` | Marcado `LEGADO` linha 1 |
| `pix-mercado-pago.js` exports | `createPixPayment`, `processWebhook` sem `require` ativo |

**Total inventariado:** 52 artefatos no escopo Payment Engine.

---

## 3. Acoplamentos ao Gol de Ouro

### Alta prioridade

| Acoplamento | Motivo | Arquivos |
|-------------|--------|----------|
| Tabela `usuarios` + coluna `saldo` | Wallet é coluna do jogador; compartilhada com `shoot_apply` | `claimApprovedPixDeposit.js`, `processPendingWithdrawals.js`, `server-fly.js` |
| Tabela `saques` | Naming PT-BR; schema do domínio do jogo | `processPendingWithdrawals.js`, `asaasPayoutRecovery.js`, `server-fly.js` |
| HTTP inline em `server-fly.js` | ~800 linhas financeiras no monólito; impede deploy independente | `server-fly.js` L1631–3950 |
| `shoot_apply` RPC | Debita mesmo `usuarios.saldo` das apostas | `database/shoot_apply_atomic_transaction.sql` |

### Média prioridade

| Acoplamento | Motivo | Arquivos |
|-------------|--------|----------|
| Tabela `pagamentos_pix` | Naming PT-BR; FK `usuario_id` | `paymentWebhookIdempotency.js`, `server-fly.js` |
| Branding "Gol de Ouro" em descriptions | Hardcoded em providers e compat | `createPixDepositCompat.js` L35, `AsaasPaymentProvider.js`, `MercadoPagoPaymentProvider.js` |
| `goldeouro_*` external refs | IDs de referência PSP amarrados ao produto | `asaas-http-client.js`, providers MP/Asaas |
| `PAYOUT_USUARIOS_CPF_*` env | Assume schema `usuarios` com colunas CPF | `processPendingWithdrawals.js` |
| Admin withdraw controller | Fluxo painel admin do jogo | `adminWithdrawController.js` |

### Baixa prioridade

| Acoplamento | Motivo | Arquivos |
|-------------|--------|----------|
| URLs/domínios default | `goldeouro.lol`, `goldeouro-backend-v2.fly.dev` | `server-fly.js`, providers |
| User-Agent `GolDeOuro-Backend/1.0` | Identificação HTTP ao PSP | `asaas-config.js` |
| Flags `integratedInGolDeOuro` | Metadata de integração | `AsaasProvider.js`, `AsaasPayoutProvider.js` |
| Ledger tipos PT-BR | `deposito`, `saque`, `taxa` | `ledger_financeiro` schema |

---

## 4. Dívida Técnica

### 4.1 TODO / FIXME

| Local | Conteúdo | Escopo |
|-------|----------|--------|
| `server-fly.js` L118 | `TODO: Re-habilitar após backend estável` | Monitoramento (fora do core finance) |

**Zero** TODO/FIXME em `src/finance/` e `src/domain/payout/`.

### 4.2 Código morto (remoção segura recomendada em V1.1)

| Artefato | Risco de remoção | Recomendação |
|----------|------------------|--------------|
| `routes/paymentRoutes.js` | Baixo — não montado | Deprecar + remover em V1.1 |
| `controllers/paymentController.js` | Baixo — não usado em produção | Deprecar + remover em V1.1 |
| `routes/mpWebhook.js` | Baixo — substituído | Remover em V1.1 |
| `services/pix-service.js` | Nenhum — marcado LEGADO | Remover em V1.1 |
| `services/pix-service-real.js` | Nenhum — marcado LEGADO | Remover em V1.1 |
| `pix-mercado-pago.js` exports mortos | Baixo — `createPixPayment`, `processWebhook` | Limpar exports em V1.1 |

**P2.1:** nenhum arquivo removido (preservação da certificação).

### 4.3 Duplicações monólito ↔ Engine

| # | Padrão | Impacto |
|---|--------|---------|
| 1 | `normalizeMercadoPagoPaymentResourceId` duplicado em `server-fly.js` e normalizer | Manutenção dupla |
| 2 | Idempotência depósito MP duplicada (legacy webhook vs `paymentWebhookIdempotency.js`) | Risco de divergência se engine OFF |
| 3 | Fetch MP GET payment duplicado (legacy vs `processPaymentWebhook.js`) | Idem |
| 4 | PIX IN MP: provider ativo vs `createPixPayment` morto em `pix-mercado-pago.js` | Confusão arquitetural |
| 5 | Webhook MP usa engine direto; Asaas usa compat — assimetria | Inconsistência de padrão |
| 6 | Reconcile MP em `server-fly.js` — não extraído para `src/finance/reconciliation/` | Acoplamento monólito |
| 7 | Webhook payout MP ~200 linhas inline — `MercadoPagoPayoutProvider.handlePayoutWebhook` lança erro | Provider incompleto |

### 4.4 Logging ad-hoc

| Área | Ocorrências `console.*` | Recomendação V1.1 |
|------|-------------------------|-------------------|
| `processPendingWithdrawals.js` | ~45 | Migrar para `financeLog` estruturado |
| `payout-worker.js` | ~18 | Idem |
| `pix-mercado-pago.js` | ~14 | Idem |
| `server-fly.js` (finance) | ~80+ | Idem |
| `src/finance/` | 5 | Baixo volume; padronizar |

---

## 5. Padronização

| Domínio | Estado atual | Consistência |
|---------|--------------|:------------:|
| **Logs** | `financeLog()` estruturado + `console.*` ad-hoc misturados | ⚠️ Parcial |
| **Exceptions** | `throw new Error(...)` com mensagens descritivas | ✅ Adequado |
| **Errors HTTP** | JSON `{ success, message }` padronizado | ✅ Consistente |
| **Naming** | PT-BR no domínio (`saques`, `deposito`); inglês no core (`PaymentProvider`) | ⚠️ Misto |
| **Providers** | Contrato uniforme; MP payout incompleto (`handlePayoutWebhook` throw) | ⚠️ Parcial |
| **Factories** | Singleton cache em `FinanceProviderFactory` | ✅ Consistente |
| **Schedulers** | Intervals em `server-fly.js` + worker separado | ⚠️ Disperso |
| **Config** | Centralizada em `src/finance/config/` + env espalhado em monólito | ⚠️ Parcial |
| **Webhooks** | Validação por PSP; MP HMAC + Asaas token | ✅ Adequado |
| **Middlewares** | Rate limit global; auth JWT | ⚠️ Webhooks sem skip |

---

## 6. Variáveis de Ambiente

### 6.1 Inventário por domínio (70+ variáveis)

| Grupo | Variáveis principais | Qtd |
|-------|---------------------|:---:|
| **Provider routing** | `PRIMARY_PSP`, `PAYMENT_PROVIDER`, `PAYOUT_PROVIDER`, `MOCK_FINANCE_ENABLED` | 4 |
| **PAYMENT_*** | `PAYMENT_WEBHOOK_ENGINE_ENABLED`, `PAYMENT_WEBHOOK_CONTROLLED_CREDIT`, `PAYMENT_ENGINE_PIXOUT_ENABLED` | 3 |
| **ASAAS_*** | `ASAAS_API_KEY`, `ASAAS_PRODUCTION_ENABLED`, `ASAAS_PAYOUT_RECOVERY_*`, `ASAAS_TRANSFER_AUTH_*`, gates sandbox | 25+ |
| **MP_*/MERCADOPAGO_*** | Tokens depósito/payout, webhook secret, reconcile, payout keys | 15+ |
| **CELCOIN_*** | `CELCOIN_ENABLED`, OAuth, mTLS paths | 8 |
| **PAYOUT_*** | `PAYOUT_PIX_ENABLED`, `PAYOUT_AUTO_FROM_AT`, `PAYOUT_MODE`, worker flags | 8 |
| **Recovery** | `ASAAS_PAYOUT_RECOVERY_*`, `MP_RECONCILE_*` | 8 |
| **Outros** | `PAGAMENTO_TAXA_SAQUE`, `BACKEND_URL`, `SUPABASE_*` | 5+ |

### 6.2 Achados

| Tipo | Variável | Observação |
|------|----------|------------|
| Duplicada conceitual | `ASAAS_TRANSFER_AUTH_ENABLED` / `ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED` | Alias legado |
| Duplicada conceitual | `ASAAS_TRANSFER_AUTH_TOKEN` / `ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN` | Alias legado |
| Hardcoded default | `PIX_WEBHOOK_URL` em `pix-mercado-pago.js` | URL fly.dev fixa |
| Não documentada em `.env.example` | Algumas `ALLOW_ASAAS_SANDBOX_*` | Documentar em V1.1 |
| Obsoleta potencial | `CONTROLLED_CREDIT_STORE` | Usar apenas sandbox F4.6 |

---

## 7. Estabilidade de Interfaces

### PaymentProvider

| Método | Estável | Nota |
|--------|:-------:|------|
| `createPixDeposit` | ✅ | Input genérico (`userId`, `amount`) |
| `getPixDepositStatus` | ✅ | Provider-agnostic |
| `handleDepositWebhook` | ✅ | Delegação correta |

### PayoutProvider

| Método | Estável | Nota |
|--------|:-------:|------|
| `requestPixPayout` | ✅ | Campo `saqueId` acoplado ao naming Gol de Ouro |
| `getPayoutStatus` | ✅ | Provider-agnostic |
| `handlePayoutWebhook` | ⚠️ | MP lança `not wired`; Asaas via handler separado |

### FinanceProviderFactory

| Método | Estável | Nota |
|--------|:-------:|------|
| `resolvePaymentProvider` | ✅ | Cache singleton |
| `resolvePayoutProvider` | ✅ | Boot assert robusto |
| `assertBootConfig` | ✅ | Proíbe mock em produção |

### Quebra potencial para novos PSPs?

**Baixa.** Contratos são suficientes. Riscos:
- `saqueId` no input PayoutProvider (renomear em V2)
- `handlePayoutWebhook` não unificado para MP (webhook inline no monólito)
- Recovery per-PSP (cada PSP precisa de job próprio — design correto)

---

## 8. Recovery — Auditoria

| Aspecto | Implementação | Avaliação |
|---------|---------------|-----------|
| Lock ciclo | `asaasPayoutRecovering` / `reconciling` in-memory | ⚠️ Single-process only |
| Lock por saque | Optimistic via `isIdempotentReplay()` + ledger dedup | ✅ Mitigado |
| Retries | Implícito no próximo ciclo scheduler | ✅ Adequado para V1 |
| Idempotência | `processAsaasTransferWebhook` reutilizado | ✅ Forte (comprovado P1.9) |
| Race webhook vs recovery | Sem `FOR UPDATE`; mitigado por idempotência | ⚠️ Writes redundantes possíveis |
| Timeout HTTP Asaas | **Ausente** em `asaas-http-client.js` | ❌ Gap |
| Timeout MP reconcile | 5000ms axios | ✅ |
| Intervalos | Recovery 120s, MP reconcile 60s, worker 30s | ✅ Documentados |

### Cenários não cobertos

| Cenário | Cobertura | Mitigação futura |
|---------|-----------|------------------|
| Recovery MP PIX OUT | ❌ Não implementado | V1.1 |
| Multi-instância Fly (2+ máquinas) | ⚠️ Locks in-memory insuficientes | Advisory lock DB |
| Fetch Asaas pendurado | ❌ Sem timeout | Timeout explícito V1.1 |
| Backlog > 100 saques stale | ⚠️ Batch limitado | Aumentar ou paginar |

---

## 9. Performance

| Área | Estado | Gargalo |
|------|--------|---------|
| Payout worker | 1 saque/ciclo (`LIMIT 1`) | Throughput limitado por design |
| Recovery batch | Max 20–100 saques/ciclo | Backlog grande = múltiplos ciclos |
| Índices `saques` | `status`, `usuario_id`, `created_at`, parciais Asaas | ⚠️ Sem composite `(status, updated_at)` para recovery |
| Índices `ledger` | UNIQUE `(correlation_id, tipo, referencia)` | ✅ |
| Índices `pagamentos_pix` | `status`, `created_at` | ✅ Adequado para reconcile |
| Cache | Factory singleton; sem cache de queries | N/A para V1 |
| Polling | Schedulers fixos (30s–120s) | Latência máxima = intervalo |

---

## 10. Segurança

| Área | Estado | Risco |
|------|--------|-------|
| Secrets em env | Boot assert; masking em logs Asaas/MP | ✅ Baixo |
| Webhook MP | HMAC + timestamp skew | ✅ |
| Webhook Asaas | Token timing-safe; strict default ON | ✅ |
| Transfer auth | Token isolado + IP check opcional | ✅ |
| Rate limit webhooks | **Sujeitos ao limiter global 100/15min** | ⚠️ Médio |
| Debug MP | `MERCADOPAGO_WEBHOOK_DEBUG_LOG=1` loga payload completo | ⚠️ Médio em prod |
| Asaas sem replay window | Apenas token, sem timestamp | ⚠️ Baixo |
| Logs sanitização | MP/Asaas mascaram credenciais | ✅ |
| Auth endpoints PIX | JWT `authenticateToken` | ✅ |

### Vazamento de informações?

**Risco baixo a médio.** Credenciais são mascaradas nos logs estruturados. Riscos remanescentes:
- `MERCADOPAGO_WEBHOOK_DEBUG_LOG` em produção
- `console.*` ad-hoc pode logar objetos não sanitizados em edge cases
- Arquivos `.env` no workspace (governança, não código)

---

## 11. Validação Arquitetural (P2.0B)

| Princípio P2.0B | Status P2.1 |
|-----------------|:-----------:|
| Separação em camadas | ⚠️ Parcial — monólito HTTP concentra API + scheduler |
| Isolamento providers | ✅ Adapters isolados em `providers/` |
| Desacoplamento Recovery | ⚠️ Módulo isolado; scheduler no monólito |
| Independência Core | ⚠️ Core puro existe; persistência acoplada |
| Reutilização multi-produto | ❌ Schema e HTTP acoplados ao Gol de Ouro |

---

## 12. Riscos Consolidados

| # | Risco | Severidade | Fase |
|---|-------|:----------:|------|
| R1 | Schema acoplado (`usuarios`, `saques`, `pagamentos_pix`) | Alta | V2.0 |
| R2 | Monólito HTTP (`server-fly.js`) | Alta | V1.2 |
| R3 | Locks in-memory em multi-instância | Média | V1.1 |
| R4 | Fetch Asaas sem timeout | Média | V1.1 |
| R5 | Webhooks sob rate limit global | Média | V1.1 |
| R6 | MP payout webhook fora do provider | Média | V1.1 |
| R7 | Código legado órfão (5 arquivos) | Baixa | V1.1 |
| R8 | Logging ad-hoc (~90+ console.*) | Baixa | V1.1 |
| R9 | Branding Gol de Ouro hardcoded | Baixa | V1.1 |
| R10 | Índice composite recovery ausente | Baixa | V1.1 |

---

## 13. Recomendações (V1.1)

| Prioridade | Ação | Impacto |
|:----------:|------|---------|
| 1 | Extrair rotas financeiras para `src/finance/routes/` | Desacoplamento HTTP |
| 2 | Remover legado (`paymentRoutes`, `paymentController`, `pix-service*`) | Reduz confusão |
| 3 | Consolidar MP payout em `MercadoPagoPayoutProvider` | Provider Layer completa |
| 4 | Adicionar timeout em `asaas-http-client.js` | Resiliência recovery |
| 5 | Skip rate limit para `/webhooks/*` e `/api/payments/webhook` | Disponibilidade PSP |
| 6 | Parametrizar descriptions (remover "Gol de Ouro") | Multi-produto |
| 7 | Migrar `console.*` → `financeLog` no orchestrator | Observabilidade |
| 8 | Repository pattern sobre tabelas atuais | Preparação V2 |
| 9 | Índice composite recovery `(status, updated_at)` | Performance |
| 10 | Recovery MP PIX OUT | Paridade Asaas |

---

## 14. Checklist Hardening

| Item | P2.1 |
|------|:----:|
| Inventário completo (52 artefatos) | ✅ |
| Matriz de classificação | ✅ |
| Acoplamentos priorizados | ✅ |
| Dívida técnica mapeada | ✅ |
| ENV inventariadas (70+) | ✅ |
| Interfaces auditadas | ✅ |
| Recovery auditado | ✅ |
| Performance auditada | ✅ |
| Segurança auditada | ✅ |
| Arquitetura validada vs P2.0B | ✅ |
| Nenhuma alteração funcional | ✅ |
| Nenhuma regressão | ✅ |

---

## 15. Critério GOLD

> A Payment Engine™ V1 CERTIFICADA está pronta para servir simultaneamente múltiplos produtos sem depender do Gol de Ouro?

## NÃO

**Justificativa técnica:**

1. **Wallet** reside em `usuarios.saldo` — tabela do jogador, compartilhada com `shoot_apply`.
2. **Persistência** usa `saques`, `pagamentos_pix` — naming e FK do domínio Gol de Ouro.
3. **HTTP** está inline em `server-fly.js` — não há API independente nem multi-tenant.
4. **Branding** hardcoded em providers ("Depósito Gol de Ouro", refs `goldeouro_*`).
5. **Admin** acoplado ao painel do jogo (`adminWithdrawController`).
6. **Sem tenant routing** — single-tenant por design V1.

O **Core lógico** (factory, providers, webhooks, recovery, idempotência) é reutilizável. A **montagem e persistência** ainda dependem do Gol de Ouro. Prontidão multi-produto requer V1.2 (repository) + V2.0 (schema genérico, deploy independente).

---

*Indesconectável Payment Engine™ — Hardening P2.1 · Base `payment-engine-v1-certified`*
