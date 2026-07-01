# Indesconectável Payment Engine™ — Roadmap

**Versão:** P2.0A  
**Data:** 2026-07-01  
**Horizonte:** V1 (certificada) → V2 (plataforma)

---

## 1. Visão Geral

```text
V1 ────────── V1.1 ────────── V1.2 ────────── V2.0 ────────── V2.1
 │              │                │                │                │
Certificada   Melhorias      Desacoplamento   Plataforma      Ecossistema
(P1.9 PASS)   Cleanup        Repository       Multi-tenant    SDK + Licença
              Parametrize    Pattern          REST pública    Marketplace
```

---

## 2. V1 — Certificada ✅

**Status:** PASS (P1.9, 2026-07-01)  
**Deploy:** Fly v536 · `goldeouro-backend-v2`

### Componentes entregues

| Componente | Status | Evidência |
|------------|--------|-----------|
| Wallet operacional | ✅ | `usuarios.saldo` + RPC claim |
| Ledger operacional | ✅ | `ledger_financeiro` imutável |
| PIX IN homologado | ✅ | MP + Asaas via factory |
| PIX OUT homologado | ✅ | Asaas transfers P1.7 |
| Reconciliação automática | ✅ | P1.8 Recovery Job |
| Recovery Job | ✅ | P1.9 — sobrevive sem webhook |
| Idempotência | ✅ | Ledger UNIQUE + claim RPC |
| Compat Layer | ✅ | Ponte monólito → factory |
| Scheduler | ✅ | MP reconcile + Asaas recovery |
| Provider Factory | ✅ | Asaas, MP, Celcoin, Mock |
| Webhook Engine | ✅ | MP + Asaas (PAYMENT + TRANSFER) |
| Transfer Authorization | ✅ | P1.6 Asaas |
| Produção validada | ✅ | Fly v536, health OK |
| Certificação automatizada | ✅ | `scripts/p19-certification.cjs` |

### Limitações conhecidas (V1)

| Limitação | Impacto |
|-----------|---------|
| Embutida no monólito Gol de Ouro | Não reutilizável por outros sistemas |
| Schema acoplado (`usuarios`, `saques`) | Naming e FK do domínio do jogo |
| Sem API REST versionada | Endpoints inline em `server-fly.js` |
| Sem multi-tenant | Single-tenant Gol de Ouro |
| Celcoin stub | Provider não operacional |
| MP payout via service legado | Código fora de `src/finance/` |
| `paymentRoutes.js` legado | ~90 rotas não montadas |

---

## 3. V1.1 — Melhorias

**Horizonte:** Q3 2026  
**Objetivo:** Hardening e cleanup sem breaking changes

### 3.1 Cleanup

| Item | Ação | Prioridade |
|------|------|:----------:|
| `paymentRoutes.js` | Deprecar formalmente; documentar rotas mortas | Alta |
| `paymentController.js` | Remover ou marcar `@deprecated` | Alta |
| `services/pix-service.js` | Remover (LEGADO confirmado) | Média |
| `services/pix-service-real.js` | Remover (LEGADO confirmado) | Média |
| `routes/mpWebhook.js` | Remover (substituído) | Baixa |

### 3.2 Consolidação Provider

| Item | Ação | Prioridade |
|------|------|:----------:|
| MP payout legado | Migrar lógica de `services/pix-mercado-pago.js` para `MercadoPagoPayoutProvider` | Alta |
| `payoutProviderPersistence` | Generalizar refs `mp_*` / `asaas_*` para `providerRef` genérico | Média |
| Celcoin | Completar implementação ou remover stubs | Baixa |

### 3.3 Parametrização

| Item | Ação |
|------|------|
| Descrição de depósito | Remover default "Depósito Gol de Ouro"; aceitar `description` do caller |
| Fee policy | Extrair taxa de saque para config (`WITHDRAW_FEE_AMOUNT`, `WITHDRAW_FEE_PERCENT`) |
| Recovery MP | Implementar recovery para PIX OUT Mercado Pago (hoje só Asaas) |

### 3.4 Observabilidade

| Item | Ação |
|------|------|
| Métricas financeiras | Prometheus/OpenTelemetry para deposit/withdraw/recovery cycles |
| Alerting | Integrar recovery failures com Sentry/PagerDuty |
| `/api/meta` | Restaurar ou documentar substituto definitivo |

### Critérios de conclusão V1.1

- [ ] Zero rotas legadas não montadas referenciadas em docs ativos
- [ ] MP payout 100% dentro de `src/finance/providers/mercadopago/`
- [ ] Fee policy configurável por env
- [ ] Recovery MP PIX OUT implementado
- [ ] Métricas financeiras exportadas

---

## 4. V1.2 — Desacoplamento Interno

**Horizonte:** Q4 2026  
**Objetivo:** Repository pattern sem alterar schema

| Item | Ação |
|------|------|
| `AccountRepository` | Abstrair `usuarios.saldo` |
| `DepositRepository` | Abstrair `pagamentos_pix` |
| `WithdrawalRepository` | Abstrair `saques` |
| `LedgerRepository` | Abstrair `ledger_financeiro` |
| Extrair schedulers | Mover intervals de `server-fly.js` para módulo `src/finance/scheduler/` |
| Extrair rotas financeiras | Router dedicado `src/finance/routes/` montado em `server-fly.js` |

### Critérios de conclusão V1.2

- [ ] Nenhuma query SQL financeira direta em `server-fly.js`
- [ ] Repositories testáveis com mock
- [ ] Schedulers em módulo próprio
- [ ] Rotas financeiras em router dedicado

---

## 5. V2.0 — Plataforma

**Horizonte:** Q1-Q2 2027  
**Objetivo:** Produto tecnológico independente

### 5.1 Multi-tenant

| Item | Descrição |
|------|-----------|
| `tenants` table | Isolamento por cliente/empresa |
| `accounts` table | Substitui `usuarios` — `owner_id` + `owner_type` |
| `withdrawals` / `deposits` | Schema genérico em inglês |
| Tenant routing | API Key → tenant → provider config |
| Provider per tenant | Cada tenant pode ter PSP diferente |

### 5.2 REST API Pública

| Item | Descrição |
|------|-----------|
| `/v2/accounts/*` | CRUD de contas |
| `/v2/deposits/*` | PIX IN |
| `/v2/withdrawals/*` | PIX OUT |
| `/v2/webhooks/*` | Recebimento multi-tenant |
| `/v2/health` | Health + provider status |
| OpenAPI 3.1 | Spec gerada automaticamente |
| Rate limiting | Por tenant e por endpoint |
| Versioning | Header `X-API-Version` |

### 5.3 Deploy Independente

| Opção | Descrição |
|-------|-----------|
| Microserviço | `payment-engine-service` em Fly/Railway |
| Sidecar | Container adjacente ao cliente |
| npm package | `@indesconectavel/payment-engine` para embed |
| Supabase Edge | Functions para webhooks leves |

### 5.4 Providers V2

| Provider | Status V2 |
|----------|-----------|
| Asaas | Produção |
| Mercado Pago | Produção |
| Celcoin | Operacional |
| Efí (Gerencianet) | Novo |
| Banco próprio | SPI direto (longo prazo) |
| Stripe (internacional) | Avaliação |

### Critérios de conclusão V2.0

- [ ] Deploy independente do Gol de Ouro
- [ ] Multi-tenant funcional com 2+ clientes
- [ ] REST API `/v2/*` documentada (OpenAPI)
- [ ] Schema genérico migrado
- [ ] Gol de Ouro consome Engine como cliente

---

## 6. V2.1 — Ecossistema

**Horizonte:** Q3 2027+  
**Objetivo:** Plataforma comercializável

### 6.1 SDK

| SDK | Linguagem | Escopo |
|-----|-----------|--------|
| `@indesconectavel/payment-engine` | TypeScript/Node | Full API |
| `payment-engine-python` | Python | Deposits + Withdrawals |
| `payment-engine-php` | PHP | Webhooks + Deposits |

### 6.2 Documentação

| Artefato | Descrição |
|----------|-----------|
| Developer Portal | docs.indesconectavel.com |
| Quickstart guides | Por linguagem e por PSP |
| Sandbox environment | Tenant de teste com Mock provider |
| Postman collection | Importável |

### 6.3 Licenciamento

| Modelo | Descrição |
|--------|-----------|
| Open Core | Engine core open source; providers premium |
| SaaS | Hospedagem gerenciada por transação |
| Enterprise | On-premise + SLA + suporte dedicado |
| White-label | Engine com branding do cliente |

### 6.4 Marketplace

| Item | Descrição |
|------|-----------|
| Provider marketplace | Terceiros implementam adapters |
| Plugin system | Hooks para KYC, AML, fraud |
| Webhook relay | Encaminhamento configurável |

---

## 7. Timeline Visual

```text
2026 Q3          2026 Q4          2027 Q1-Q2       2027 Q3+
   │                │                  │                │
   ▼                ▼                  ▼                ▼
┌──────┐       ┌──────┐          ┌──────────┐    ┌──────────┐
│ V1.1 │       │ V1.2 │          │   V2.0   │    │   V2.1   │
│Cleanup│       │Repos │          │ Platform │    │Ecosystem │
│Param │       │Router│          │Multi-ten │    │SDK       │
│MP mig│       │Sched │          │REST /v2  │    │License   │
└──────┘       └──────┘          └──────────┘    └──────────┘
   ▲
   │
 V1 ✅ P1.9
```

---

## 8. Riscos do Roadmap

| Risco | Fase | Mitigação |
|-------|------|-----------|
| Breaking change no schema | V2.0 | Migrations incrementais; dual-write period |
| Gol de Ouro downtime na migração | V2.0 | Feature flag; rollback plan |
| PSP API changes | Contínuo | Adapter pattern isola impacto |
| Multi-tenant complexity | V2.0 | Começar com 2 tenants (Gol de Ouro + 1 piloto) |
| SDK maintenance burden | V2.1 | Gerar SDKs a partir de OpenAPI spec |

---

*Indesconectável Payment Engine™ — Roadmap P2.0A*
