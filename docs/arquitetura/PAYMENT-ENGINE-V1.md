# Payment Engine V1 — Gol de Ouro

**Versão:** 1.1  
**Data:** 2026-06-27 (atualizado F4.3C)  
**Status:** Documento oficial de arquitetura (Data Room V1)  
**Escopo:** camada financeira de pagamentos — PIX Cash-In, PIX Cash-Out e roteamento multi-PSP  
**Entry point backend:** `server-fly.js`  
**Módulo Payment Engine:** `src/finance/`

---

## 1. Resumo Executivo

A **Payment Engine V1** é a camada de abstração financeira do Gol de Ouro, introduzida na fatia **F4.0E-S1** para reduzir a dependência de um único PSP (Payment Service Provider) e permitir suporte progressivo a múltiplos provedores sem reescrever wallet, ledger ou gameplay.

Na V1 (~95% concluída), a plataforma opera com:

- **PIX Cash-In em produção** via Mercado Pago (monólito — legado operacional)
- **Saques (PIX Cash-Out)** com fluxo completo desenhado (request → worker → webhook), porém com **bloqueio institucional** no payout automático Mercado Pago
- **Wallet interna** (`usuarios.saldo`) e **ledger imutável** (`ledger_financeiro`) como fonte de verdade operacional
- **Asaas** como **PSP primário arquitetural** V1 (F4.3C) — resolvível em sandbox; produção gated por `ASAAS_PRODUCTION_ENABLED`
- **Mercado Pago** como **legado/fallback** — provider efetivo em produção enquanto gate Asaas fechado
- **Celcoin** preparado em modo secundário (stubs + OAuth sandbox client — fatias F4 / F4.1)

A Payment Engine **não substitui** o monólito HTTP: parte significativa do fluxo financeiro (PIX IN e webhooks) permanece inline em `server-fly.js`. A abstração está **parcialmente implementada**, concentrada no envio de payout (POST ao PSP).

---

## 2. Objetivo Estratégico

| Objetivo | Descrição |
|----------|-----------|
| **Resiliência** | Evitar lock-in total em um único PSP |
| **Continuidade operacional** | Manter PIX IN estável enquanto se destrava PIX OUT |
| **Evolução incremental** | Adicionar providers (Asaas, Celcoin, futuros) sem big-bang |
| **Auditabilidade** | Preservar ledger, correlation IDs e rastreio por provider |
| **Segurança operacional** | Feature flags explícitas; sem fallback silencioso entre PSPs |

A estratégia é **dual-track**: operação V1 com Mercado Pago no PIX IN + **Asaas como direção arquitetural** para IN/OUT via factory, com gate explícito entre sandbox e produção.

### Distinção F4.3C — Arquitetura × Produção

| Dimensão | Valor |
|----------|-------|
| PSP primário arquitetural | `PRIMARY_PSP=asaas` |
| Provider efetivo produção | Mercado Pago (sem `ASAAS_PRODUCTION_ENABLED=true`) |
| Módulo de resolução | `src/finance/config/primary-psp.js` |

---

## 3. Problema Resolvido

### 3.1 Antes da Payment Engine

Todo o fluxo financeiro estava acoplado diretamente ao Mercado Pago no monólito:

- Criação de cobrança PIX inline (`POST /v1/payments`)
- Webhooks MP-specific com validação HMAC/Ed25519 inline
- Payout via `services/pix-mercado-pago.js` importado diretamente pelo worker
- Impossibilidade de trocar PSP sem refatoração ampla e arriscada

### 3.2 Depois da Payment Engine (estado atual — F4.3C)

- Contratos formais `PaymentProvider` e `PayoutProvider`
- `FinanceProviderFactory` seleciona provider por env + `primary-psp`
- Adapters por PSP (`AsaasPaymentProvider`, `AsaasPayoutProvider`, `MercadoPagoPayoutProvider`, `CelcoinPayoutProvider`, `MockPayoutProvider`)
- **Asaas promovido a PSP primário arquitetural**; Mercado Pago legado/fallback
- Guards e flags impedem ativação acidental de Asaas em produção
- Celcoin isolado em `src/finance/providers/celcoin/` com HTTP client OAuth sandbox
- Worker e admin payout usam `createPixWithdrawCompat` → factory

### 3.3 O que ainda não está resolvido

- Crédito wallet Asaas em ambiente controlado (F4.6); E2E sandbox completo F4.7; produção real permanece dry-run/legado MP
- PIX OUT automático não validado end-to-end em produção
- Homologação Asaas produção para PIX IN/webhook efetivo

---

## 4. Arquitetura Conceitual

### 4.1 Diagrama de camadas

```text
Gol de Ouro Backend (server-fly.js + payout-worker)
   ↓
Domínio financeiro (saques, depósitos, ledger — inalterado pela Engine)
   ↓
Payment Engine (src/finance/)
   ↓
FinanceProviderFactory
   ↓
AsaasPaymentProvider | AsaasPayoutProvider (primário arquitetural)
MercadoPagoPayoutProvider (legado/fallback) | CelcoinPayoutProvider (secundário) | MockPayoutProvider
   ↓
HTTP / SDK do PSP
```

### 4.2 Mapa de módulos

```text
src/finance/
├── config/
│   └── primary-psp.js              # PSP primário vs provider efetivo (F4.3C)
├── contracts/
│   ├── PaymentProvider.js      # Contrato PIX IN (JSDoc)
│   └── PayoutProvider.js       # Contrato PIX OUT (JSDoc)
├── factory/
│   └── FinanceProviderFactory.js
    ├── compat/
    │   ├── createPixWithdrawCompat.js   # Ponte legado → factory (payout)
    │   └── createPixDepositCompat.js    # Ponte monólito → factory (PIX IN — F4.4)
    ├── deposit/
    │   └── createPixDeposit.js          # Entry point PIX IN provider-agnostic
└── providers/
    ├── asaas/
    │   ├── asaas-config.js
    │   ├── AsaasPaymentProvider.js
    │   └── AsaasPayoutProvider.js
    ├── mercadopago/
    │   ├── MercadoPagoPayoutProvider.js
    │   └── MercadoPagoPaymentProvider.js   # PIX IN legado/fallback (F4.4)
    ├── celcoin/
    │   ├── celcoin-config.js
    │   ├── celcoin-http-client.js
    │   ├── CelcoinProvider.js
    │   ├── CelcoinPayoutProvider.js
    │   └── CelcoinPaymentProvider.js
    └── mock/
        ├── MockPayoutProvider.js
        └── MockPaymentProvider.js
```

### 4.3 Fluxos fora da Engine (monólito)

| Fluxo | Rota / arquivo | Provider |
|-------|----------------|----------|
| PIX IN — criar cobrança | `POST /api/payments/pix/criar` → `createPixDepositCompat` (F4.4) | Factory → Asaas ou MP fallback |
| PIX IN — webhook | `POST /api/payments/webhook` | MP legado default; engine F4.5 quando flag |
| PIX IN — webhook Asaas | `POST /webhooks/asaas` | Engine F4.5 — dry-run sandbox, flags |
| PIX OUT — solicitar saque | `POST /api/withdraw/request` | Domínio interno (wallet/ledger) |
| PIX OUT — processar | `payout-worker.js` → `processPendingWithdrawals.js` | Factory → PSP |
| PIX OUT — webhook | `POST /webhooks/mercadopago` | Mercado Pago (inline) |
| Admin saques | `/api/admin/withdraw/*` | Manual ou factory |

---

## 5. Separação de Responsabilidades

| Componente | Responsabilidade | Localização |
|------------|------------------|-------------|
| **PaymentProvider** | Contrato PIX IN: criar cobrança, consultar status, webhook depósito | `src/finance/contracts/PaymentProvider.js` |
| **PayoutProvider** | Contrato PIX OUT: enviar payout, consultar status, webhook saque | `src/finance/contracts/PayoutProvider.js` |
| **Config** | Leitura de env, guards, defaults sandbox | `celcoin-config.js` (Celcoin); env global para MP |
| **HTTP Client** | Chamadas OAuth/API isoladas do domínio | `celcoin-http-client.js`; `services/pix-mercado-pago.js` (MP) |
| **Factory** | Seleção de provider ativo por env + boot validation | `FinanceProviderFactory.js` |
| **Feature Flags** | Gates explícitos (`CELCOIN_*`, `PAYOUT_PROVIDER`, `MOCK_FINANCE_ENABLED`) | `.env` / Fly secrets |
| **Guards** | Bloqueio com erro explícito — nunca fallback silencioso | `_guard()` em `CelcoinProvider`; `assertBootConfig()` na factory |
| **Compat** | Ponte assinatura legada → contrato novo | `createPixWithdrawCompat.js` |
| **Wallet / Ledger** | Saldo interno e auditoria — **fora** da Payment Engine | `usuarios.saldo`, `ledger_financeiro` |

---

## 6. Fluxo de Autenticação OAuth (Celcoin)

Implementado na fatia **F4.1**. Aplica-se apenas ao provider Celcoin; Mercado Pago usa access tokens estáticos por app.

### 6.1 Diagrama

```text
Script de teste (scripts/test-celcoin-auth.mjs)
   ↓  [ALLOW_CELCOIN_SANDBOX_AUTH=1]
CelcoinProvider.authenticate()
   ↓  [_guard: CELCOIN_ENABLED + credenciais]
   ↓  [CELCOIN_HTTP_ENABLED?]
CelcoinHttpClient.requestAccessToken()
   ↓
POST {authBaseUrl}/v5/token
   ↓  (application/x-www-form-urlencoded)
   ↓  client_id + grant_type=client_credentials + client_secret
Access Token (JWT)
   ↓
Cache in-memory (expires_in − 30s skew)
```

### 6.2 Matriz de decisão — `authenticate()`

| `CELCOIN_ENABLED` | `CELCOIN_HTTP_ENABLED` | Credenciais | Resultado |
|-------------------|------------------------|-------------|-----------|
| `false` | * | * | `CELCOIN_DISABLED` |
| `true` | `false` | * | `CELCOIN_STUB_NOT_IMPLEMENTED` |
| `true` | `true` | incompletas | `CELCOIN_NOT_CONFIGURED` |
| `true` | `true` | OK | Token OAuth real (sandbox) |

### 6.3 Segurança

- Credenciais **nunca** aparecem em logs
- Token logado apenas como preview mascarado (`abcd1234...xyz9`)
- Script de teste exige gate `ALLOW_CELCOIN_SANDBOX_AUTH=1`
- mTLS **não** implementado nesta fatia (obrigatório em produção Celcoin)

---

## 7. Fluxo da Factory

`FinanceProviderFactory` (`src/finance/factory/FinanceProviderFactory.js`) centraliza a seleção do provider de **payout**.

### 7.1 Algoritmo de resolução

```text
assertBootConfig()
   ↓
MOCK_FINANCE_ENABLED=true AND NODE_ENV≠production?
   → MockPayoutProvider
   ↓
PAYOUT_PROVIDER=celcoin AND CELCOIN_ENABLED=true?
   → CelcoinPayoutProvider
   ↓
default
   → MercadoPagoPayoutProvider
```

### 7.2 Variáveis de seleção

| Env | Default | Efeito |
|-----|---------|--------|
| `PAYOUT_PROVIDER` | `mercadopago` | Provider de payout ativo |
| `CELCOIN_ENABLED` | `false` | Obrigatório para `PAYOUT_PROVIDER=celcoin` |
| `MOCK_FINANCE_ENABLED` | `false` | Mock em dev/test (proibido em produção) |

### 7.3 PaymentProvider (PIX IN)

`resolvePaymentProvider()` retorna **`null`** — contrato definido, **não wired**. PIX IN continua inline no monólito via Mercado Pago.

### 7.4 Health snapshot

`getHealthSnapshot()` expõe observabilidade:

```json
{
  "paymentProvider": null,
  "payoutProvider": "mercadopago",
  "mercadoPagoPayout": true,
  "celcoinEnabled": false,
  "celcoinHttpEnabled": false,
  "celcoinPayoutConfigured": false
}
```

---

## 8. Fluxo de PaymentProvider (PIX Cash-In)

### 8.1 Contrato

```javascript
// PaymentProvider — métodos esperados
createPixDeposit(input)      → { success, providerRef, qrCode, copyPaste, status }
getPixDepositStatus(ref)     → { success, status, amount }
handleDepositWebhook(req)    → { valid, providerRef }
```

### 8.2 Estado V1

| Item | Status |
|------|--------|
| Contrato JSDoc | ✅ Definido |
| Implementação MP | ❌ Fora da Engine — inline em `server-fly.js` |
| `MercadoPagoPaymentProvider` | ❌ Não existe |
| `CelcoinPaymentProvider` | ⚠️ Stub adapter — não wired |
| `MockPaymentProvider` | ⚠️ Existe — não wired |
| Factory PIX IN | ❌ `resolvePaymentProvider()` → `null` |

### 8.3 Fluxo operacional atual (produção)

```text
Jogador → POST /api/payments/pix/criar
   ↓
server-fly.js → Mercado Pago POST /v1/payments
   ↓
pagamentos_pix (status pending)
   ↓
Webhook POST /api/payments/webhook
   ↓
RPC claim_and_credit_approved_pix_deposit
   ↓
usuarios.saldo += valor | ledger tipo=deposito
```

---

## 9. Fluxo de PayoutProvider (PIX Cash-Out)

### 9.1 Contrato

```javascript
// PayoutProvider — métodos esperados
requestPixPayout(input)      → { success, data: { id, status, external_reference } }
getPayoutStatus(providerRef) → { success, data }
handlePayoutWebhook(req)     → { valid, externalReference, status, providerRef }
```

### 9.2 Fluxo operacional V1

```text
Jogador → POST /api/withdraw/request
   ↓
Debita usuarios.saldo + INSERT saques (pendente) + ledger saque/taxa
   ↓
payout-worker.js (ENABLE_PIX_PAYOUT_WORKER=true)
   ↓
processPendingWithdrawals.js
   ↓
createPixWithdrawCompat → FinanceProviderFactory → PayoutProvider
   ↓
Mercado Pago POST /v1/transaction-intents/process
   ↓
saques.status = aguardando_confirmacao
   ↓
Webhook POST /webhooks/mercadopago
   ↓
CONFIRMED → ledger payout_confirmado + status processado
FAILED    → ledger falha_payout + rollback saldo
```

### 9.3 Modos operacionais

| Modo | Env | Comportamento |
|------|-----|---------------|
| Manual | `PAYOUT_MODE=manual` | Admin aprova/paga manualmente |
| Automático | `PAYOUT_MODE=auto` + worker | Worker envia ao PSP |
| Mock | `MOCK_FINANCE_ENABLED=true` | Respostas simuladas (dev) |

---

## 10. Estratégia Multi-PSP

### 10.1 Princípios

1. **Um provider default por vez** em produção (`PAYOUT_PROVIDER=mercadopago`)
2. **PIX IN e PIX OUT podem usar PSPs diferentes** na V1, com ressalva de tesouraria
3. **Homologação sandbox obrigatória** antes de switch em produção
4. **Rollback por env** — trocar `PAYOUT_PROVIDER` sem migration destrutiva
5. **Sem fallback silencioso** — erro explícito se provider indisponível

### 10.2 Roadmap por provider

| Provider | Papel V1 | Cash-In | Cash-Out | Observação |
|----------|----------|---------|----------|------------|
| **Mercado Pago** | Default produção | ✅ Ativo | ⚠️ Bloqueio institucional Payouts | PIX IN estável |
| **Asaas** | Candidato Cash-Out | Pendente | Aguardando liberação API | Sem código no repo |
| **Celcoin** | Alternativa BaaS | Futuro | Sandbox em preparação | OAuth client F4.1 |
| **Futuros PSPs** | Extensível | Via `PaymentProvider` | Via `PayoutProvider` | Factory + adapter |

### 10.3 Recomendação arquitetural V1

- **Manter Mercado Pago no PIX IN** (funcionando, menor risco)
- **Validar Cash-Out** primeiro em Asaas ou Celcoin (whichever libera primeiro)
- **Unificar IN+OUT no mesmo PSP** apenas após estabilizar tesouraria e conciliação

---

## 11. Estado Atual dos Providers

| Provider | Cash-In | Cash-Out | Status técnico | Produção |
|----------|---------|----------|----------------|----------|
| **Mercado Pago** | Ativo | Parcial / bloqueio PIX Out institucional | Default — apps separadas depósito/payout | **Sim** |
| **Asaas** | Pendente | Aguardando liberação de API | Candidato comercial — **sem implementação no repositório** | Não |
| **Celcoin** | Não ativo | Preparado (stubs) | OAuth sandbox client F4.1 — payout stub | Não |
| **Mock** | Stub | Stub | Dev/test only (`MOCK_FINANCE_ENABLED`) | Não |
| **Efí** | — | — | `PAYOUT_PROVIDER=efi` → erro explícito | Não |

---

## 12. O que está em produção

| Capacidade | Provider | Evidência |
|------------|----------|-----------|
| PIX Cash-In (QR + webhook) | Mercado Pago | `server-fly.js`, `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` |
| Wallet interna | Domínio Gol de Ouro | `usuarios.saldo` |
| Ledger financeiro | Domínio Gol de Ouro | `ledger_financeiro` |
| Solicitação de saque | Domínio Gol de Ouro | `POST /api/withdraw/request` |
| Saque manual admin | Domínio Gol de Ouro | `pago_manual` |
| Payout factory (default MP) | Mercado Pago | `PAYOUT_PROVIDER=mercadopago` (default) |
| Deploy backend | Fly.io | `goldeouro-backend-v2` — processos `app` + `payout_worker` |

---

## 13. O que está desabilitado

| Item | Gate | Motivo |
|------|------|--------|
| Celcoin geral | `CELCOIN_ENABLED=false` | Preparatório — não homologado |
| Celcoin HTTP | `CELCOIN_HTTP_ENABLED=false` | Impede chamadas OAuth/API reais |
| Celcoin payout ativo | `PAYOUT_PROVIDER≠celcoin` | Default mercadopago |
| PIX IN via factory | `resolvePaymentProvider()→null` | Não implementado |
| Asaas | — | Sem código / API pendente |
| Mock finance prod | `MOCK_FINANCE_ENABLED` forbidden in prod | Segurança |
| Efí payout | `PAYOUT_PROVIDER=efi` → throw | Não implementado |

---

## 14. Feature Flags

### 14.1 Celcoin

| Flag | Default | Descrição |
|------|---------|-----------|
| `CELCOIN_ENABLED` | `false` | Habilita provider Celcoin no backend |
| `CELCOIN_HTTP_ENABLED` | `false` | **Impede chamadas HTTP reais** quando `false`; `authenticate()` retorna stub |
| `CELCOIN_BASE_URL` | (vazio → sandbox default) | Base URL da API Celcoin |
| `CELCOIN_CLIENT_ID` | — | OAuth client_id sandbox/prod |
| `CELCOIN_CLIENT_SECRET` | — | OAuth client_secret |
| `CELCOIN_MTLS_CERT_PATH` | — | Certificado mTLS (produção — futuro) |
| `CELCOIN_MTLS_KEY_PATH` | — | Chave mTLS (produção — futuro) |
| `CELCOIN_WEBHOOK_SECRET` | — | Validação webhook (futuro) |
| `ALLOW_CELCOIN_SANDBOX_AUTH` | (ausente) | Gate do script `test-celcoin-auth.mjs` — exige `=1` |

### 14.2 Payout geral

| Flag | Default | Descrição |
|------|---------|-----------|
| `PRIMARY_PSP` | `asaas` | PSP primário **arquitetural** V1 |
| `ASAAS_PRODUCTION_ENABLED` | `false` | Gate produção — `true` necessário para Asaas efetivo em prod |
| `PAYMENT_PROVIDER` | *(implícito)* | Dev: `asaas`; Prod sem gate: `mercadopago` |
| `PAYOUT_PROVIDER` | *(implícito)* | Dev: `asaas`; Prod sem gate: `mercadopago` |
| `PAYOUT_PIX_ENABLED` | — | Habilita processamento PIX OUT |
| `PAYOUT_MODE` | — | `manual` \| `auto` |
| `ENABLE_PIX_PAYOUT_WORKER` | — | Worker background Fly |
| `MOCK_FINANCE_ENABLED` | `false` | Mock providers (dev only) |

### 14.3 Mercado Pago (produção ativa)

| Flag | Função |
|------|--------|
| `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` | PIX IN |
| `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` | PIX OUT |
| `MP_PAYOUT_WEBHOOK_URL` | Webhook payout |

---

## 15. Riscos e Limitações

| # | Risco / limitação | Severidade | Mitigação atual |
|---|-------------------|------------|-----------------|
| 1 | PIX IN acoplado ao Mercado Pago no monólito | Alta | Contrato `PaymentProvider` pronto para migração futura |
| 2 | Webhooks inline — não isolados por provider | Alta | Rotas MP-specific; Celcoin exigirá `/webhooks/celcoin` |
| 3 | PIX OUT automático não validado E2E | Alta | Modo manual admin operacional; onboarding MP Payouts pendente |
| 4 | Credenciais Celcoin sandbox pendentes | Média | Stubs + OAuth client pronto; script de teste com gate |
| 5 | Asaas aguardando homologação produção | Média | Sandbox E2E validado F4.3A/B; gate `ASAAS_PRODUCTION_ENABLED` |
| 6 | Split tesouraria (MP IN + Asaas OUT) | Alta | Gate produção; migração IN planejada F4.4+ |
| 7 | Colunas `mp_*` em `saques` — acoplamento schema | Média | Migration provider-agnostic planejada (F4.4+) |
| 8 | Monólito PIX IN ainda MP | Alta | Fora da factory — dívida F4.4+ |
| 9 | mTLS Celcoin produção | Média | Documentado; não implementado |
| 10 | Compliance premiação/jogos com PSP alternativo | Alta | Due diligence comercial antes de go-live |

---

## 16. ADR — Architecture Decision Record

### ADR-002 — Asaas como PSP Primário Arquitetural V1

Ver [`ADR-002-PRIMARY-PSP-ASAAS.md`](ADR-002-PRIMARY-PSP-ASAAS.md) — aceita em F4.3C.

| Campo | Conteúdo |
|-------|----------|
| **Status** | Aceita |
| **Decisão** | `PRIMARY_PSP=asaas`; Mercado Pago legado/fallback; produção gated |
| **Consequência** | Factory resolve Asaas quando `isAsaasProviderResolvable()`; fallback MP com `legacyFallbackActive` |

---

### ADR-001 — Adoção de Payment Engine Multi-PSP

| Campo | Conteúdo |
|-------|----------|
| **Status** | Aceita |
| **Data** | 2026-06 (fatia F4.0E-S1) |
| **Contexto** | Gol de Ouro V1 dependia 100% do Mercado Pago. PIX IN operacional; PIX OUT bloqueado por onboarding institucional MP Payouts. Necessidade de alternativas (Asaas, Celcoin) sem reescrever wallet/ledger/gameplay. |
| **Decisão** | Introduzir Payment Engine em `src/finance/` com contratos `PaymentProvider` / `PayoutProvider`, factory por env, adapters por PSP, feature flags explícitas e guards sem fallback silencioso. Migração incremental: payout primeiro, PIX IN e webhooks depois. |
| **Consequências positivas** | Reduz lock-in; permite POC paralelo; rollback por env; código Celcoin isolado; mock para dev; documentação e testes de verificação (`verify-celcoin-prep.mjs`). |
| **Consequências negativas** | Arquitetura híbrida temporária (monólito + engine parcial); duplicação de caminhos MP; schema DB ainda MP-centric; complexidade operacional multi-PSP. |
| **Alternativas rejeitadas** | (1) Big-bang rewrite financeiro — risco alto na V1; (2) Manter MP exclusivo — não resolve bloqueio payout; (3) Substituir MP no PIX IN imediatamente — risco desnecessário com IN estável. |

---

## 17. Próximos Passos

### F4.2 — Validação OAuth Sandbox Celcoin (credenciais reais)

- Obter `client_id` / `client_secret` sandbox via onboarding Celcoin
- Executar `scripts/test-celcoin-auth.mjs` com `ALLOW_CELCOIN_SANDBOX_AUTH=1`
- Confirmar token JWT e cache in-memory
- Documentar evidências no Data Room

> **Nota:** O client HTTP OAuth (F4.1) já está implementado. F4.2 é a **validação operacional** com credenciais reais.

### F4.3 — Endpoints protegidos e PIX Out preparatório

- Implementar consulta DICT (`GET /baas/v2/pix/dict/...`)
- Stub/evolução de `createPixWithdraw()` com `POST /baas/v2/pix/payment`
- Rota webhook `POST /webhooks/celcoin`
- Colunas provider-agnostic em `saques`
- Mapeamento status Celcoin → state machine interna
- **Não** ativar em produção sem homologação completa

### Asaas (F4.3C — primário arquitetural)

- Sandbox E2E validado (F4.2A–F4.3B)
- Produção: aguardar `ASAAS_PRODUCTION_ENABLED=true` + homologação operador
- Próximo: wiring PIX IN monólito → `AsaasPaymentProvider`

### Decisão estratégica V1

- **PSP primário arquitetural:** Asaas (ADR-002)
- **Provider efetivo produção:** Mercado Pago até gate Asaas
- Modelar tesouraria se IN e OUT usarem PSPs distintos durante transição

---

## 18. Referências internas

| Documento | Conteúdo |
|-----------|----------|
| `docs/relatorios/F4-CELCOIN-PAYMENT-ENGINE-PREP.md` | Preparação Celcoin (stubs F4) |
| `docs/relatorios/F4.1-CELCOIN-OAUTH-SANDBOX.md` | OAuth HTTP client F4.1 |
| `docs/relatorios/F4.0A-MAPA-FINANCEIRO-ATUAL.md` | Mapa financeiro completo |
| `docs/configuracoes/CONFIGURACAO-MERCADO-PAGO.md` | Guia MP |
| `docs/relatorios/F4.3C-PRIMARY-PSP-PROMOTION.md` | Promoção Asaas PSP primário F4.3C |
| `docs/arquitetura/ADR-002-PRIMARY-PSP-ASAAS.md` | ADR PSP primário |
| `scripts/verify-primary-psp.mjs` | Verificação F4.3C |
| `scripts/test-celcoin-auth.mjs` | Smoke OAuth sandbox |

---

## 19. Glossário

| Termo | Definição |
|-------|-----------|
| **PSP** | Payment Service Provider — provedor de serviços de pagamento |
| **PIX IN / Cash-In** | Depósito via Pix (cobrança + QR) |
| **PIX OUT / Cash-Out / Payout** | Saque/transferência Pix para chave do usuário |
| **Wallet interna** | Saldo virtual `usuarios.saldo` — não é conta bancária |
| **Ledger** | Registro imutável `ledger_financeiro` para auditoria |
| **Factory** | `FinanceProviderFactory` — seleção de provider por env |
| **Guard** | Validação que bloqueia operação com erro explícito |
| **Stub** | Implementação placeholder — sem efeito financeiro real |
| **BaaS** | Banking as a Service — modelo Celcoin com conta real |

---

*Documento gerado para composição do Data Room Gol de Ouro V1. Atualizado em 2026-06-27 (F4.3C). Nenhum deploy ou alteração de produção durante esta atualização.*
