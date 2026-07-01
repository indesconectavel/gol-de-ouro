# ADR-002 — Asaas como PSP Primário Arquitetural da V1

| Campo | Conteúdo |
|-------|----------|
| **Status** | Aceita |
| **Data** | 2026-06-27 |
| **Fatia** | F4.3C |
| **Relacionado** | ADR-001 (Payment Engine Multi-PSP), F4.2H, F4.3A, F4.3B |

---

## Contexto

A Payment Engine V1 consolidou contratos, factory e adapters para três PSPs:

- **Mercado Pago** — PIX IN em produção; PIX OUT bloqueado por onboarding institucional (F2.4E*)
- **Asaas** — sandbox validado end-to-end (F4.2A–F4.3B): auth, PIX IN, PIX OUT, webhooks, wallet/ledger controlados
- **Celcoin** — preparação arquitetural (OAuth sandbox, stubs)

A auditoria F4.2H recomendou Mercado Pago como PSP **operacional** da V1. Com a conclusão das fatias F4.3A/B (Asaas primary sandbox + E2E com store local), a decisão arquitetural evolui: **Asaas passa a ser o PSP primário da arquitetura**, sem ativação automática em produção.

---

## Decisão

1. **`PRIMARY_PSP=asaas`** (default implícito) define o PSP primário **arquitetural** da V1.
2. **Mercado Pago** reclassificado como **legado/fallback** — permanece no repositório e como provider efetivo em produção até homologação Asaas.
3. **Celcoin** permanece **secundário/preparado** — ativação explícita via `PAYOUT_PROVIDER=celcoin`.
4. Distinção explícita:

```text
Arquitetura Primária          ×          Provider de Produção
PRIMARY_PSP=asaas                          NODE_ENV=production
                                           + ASAAS_PRODUCTION_ENABLED=false
                                           → provider efetivo = mercadopago
```

5. Resolução runtime centralizada em `src/finance/config/primary-psp.js` + `FinanceProviderFactory.js`.
6. Gate de produção: **`ASAAS_PRODUCTION_ENABLED=true`** + credenciais Asaas produção + `ASAAS_ENABLED` — obrigatório para trocar provider efetivo em produção.

---

## Consequências positivas

- Documentação, factory e health snapshot refletem a direção estratégica (Asaas first).
- Sandbox e dev resolvem Asaas quando `isAsaasProviderResolvable()` (modo F4.3A ou gate produção).
- Produção protegida: sem gate, Mercado Pago permanece efetivo sem alteração de secrets.
- Mercado Pago e Celcoin preservados — rollback e contingência arquiteturalmente suportados.

---

## Consequências negativas / dívida técnica remanescente

- Webhook Asaas: dry-run (F4.5 default) ou crédito controlado local (F4.6 com flags).
- Schema `saques` ainda MP-centric (`mp_*`).
- `legacyFallbackActive` pode mascarar configuração incompleta de Asaas em dev — mitigado por `assertBootConfig` quando `PAYMENT/PAYOUT_PROVIDER=asaas` explícito.
- Limitação sandbox Asaas (`authorized=false`) permanece operacional do Sandbox, não da integração.

---

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| Ativar Asaas em produção nesta fatia | Viola gate de segurança; exige homologação e credenciais prod |
| Manter MP como primário arquitetural | Desalinhado com evidência sandbox e roadmap pós-F4.2H |
| Remover Mercado Pago do repositório | Quebra produção PIX IN e fallback legado |
| Big-bang migração PIX IN para Asaas | Risco desnecessário com IN MP estável |

---

## Implementação

| Artefato | Função |
|----------|--------|
| `src/finance/config/primary-psp.js` | Defaults arquiteturais + gate produção |
| `src/finance/factory/FinanceProviderFactory.js` | Resolução Payment/Payout + health |
| `src/finance/providers/asaas/asaas-config.js` | `isAsaasProviderResolvable()` |
| `scripts/verify-primary-psp.mjs` | Verificação local F4.3C |

---

## Critério de aceite

- [x] Asaas promovido a PSP primário **arquitetural**
- [x] Mercado Pago classificado como **legado/fallback**
- [x] Celcoin **secundário/preparado**
- [x] Produção **não** alterada automaticamente
- [x] Documentação e auditoria F4.3C publicadas

---

*ADR aceita sem deploy, sem commit automático e sem alteração de credenciais ou banco de produção.*
