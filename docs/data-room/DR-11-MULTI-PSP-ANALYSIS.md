# DR-11 — Análise Multi-PSP (Payment Service Providers)

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-27 (atualizado F4.3C)  
**Modo:** auditoria READ-ONLY + decisão arquitetural F4.3C  
**Documento técnico completo:** [`F4.2H-MULTI-PSP-AUDIT.md`](../relatorios/F4.2H-MULTI-PSP-AUDIT.md)  
**Promoção PSP primário:** [`F4.3C-PRIMARY-PSP-PROMOTION.md`](../relatorios/F4.3C-PRIMARY-PSP-PROMOTION.md)  
**Documentos relacionados:** DR-01, DR-07, DR-08, DR-09, **P1.9**, **G2**, **H2A**, F4.2H, F4.3C  
**Repositório:** monorepo `goldeouro-backend`

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> Corpo **2026-06-27 (F4.3C)** = decisão arquitetural **ainda válida** (Asaas primário arquitetural × runtime gated). Completar com evidências pós-F4:

| Fluxo | Estado oficial pós-P1.9 / G2 |
|-------|------------------------------|
| PIX IN Asaas | Homologação/produção controlada na trilha P1.4–P1.5 (não “sandbox only” como único fato) |
| PIX OUT Asaas | Homologado + **Recovery** (P1.8/P1.9) — **não** “apenas PENDING sandbox” |
| Staging | Provider pode estar MP legacy se `ASAAS_API_KEY` ausente (**G2**); A2R visando resolvível=true **pendente** |
| Produção (G2 snapshot) | `paymentProvider` Asaas primary observado na certificação staging G2 vs prod |
| Celcoin | Continua prep / parcial |

Matriz §3 do corpo que marca PIX OUT Asaas ❌ operacional = **HISTÓRICO** relativo a jun/2026 — substituir leitura pela linha P1.9.

Bloqueio §4 (MP Transaction Intents) permanece **relevante para rota MP OUT**, não como único bloqueio da V1 após Asaas OUT.

---

## 1. Resumo executivo

O Gol de Ouro V1 preparou **três PSPs** na Payment Engine: **Asaas** (primário arquitetural F4.3C), **Mercado Pago** (legado/fallback operacional em produção) e **Celcoin** (secundário/preparado). Mercado Pago continua PIX IN em produção com wallet e ledger integrados até migração F4.4+.

### Decisão arquitetural (F4.3C)

```text
PSP primário arquitetural V1: Asaas
Provider efetivo produção (gate fechado): Mercado Pago
```

| PSP | Maturidade | Papel V1 (pós-F4.3C) |
|-----|------------|----------------------|
| **Asaas** | **READY_WITH_LIMITATIONS** | **Primário arquitetural** — sandbox E2E; prod gated |
| Mercado Pago | **READY_WITH_LIMITATIONS** | **Legado/fallback** — IN prod; OUT aguardando onboarding |
| Celcoin | **PARTIAL** | **Secundário/preparado** — OAuth prep; sem PIX validado |

> **Nota F4.2H:** A auditoria F4.2H recomendou MP como PSP operacional na época. F4.3C **evolui a decisão arquitetural** sem ativar Asaas em produção automaticamente.

---

## 2. Situação por fluxo financeiro

```text
PIX IN (depósito)
    Mercado Pago  ──► ✅ Produção (wallet + ledger + webhook)
    Asaas         ──► ✅ Sandbox only (F4.2D/E)
    Celcoin       ──► ❌ Não testado

PIX OUT (saque automático)
    Mercado Pago  ──► 🔄 Código completo; bloqueio Payouts (F2.4E*)
    Asaas         ──► 🔄 Sandbox cria transfer; PENDING (F4.2G.3)
    Celcoin       ──► ❌ Stub

Saque manual admin
    Gol de Ouro   ──► ✅ Operacional (independente de PSP OUT)
```

---

## 3. Matriz comparativa (executiva)

| Critério | Mercado Pago | Asaas | Celcoin |
|----------|:------------:|:-----:|:-------:|
| PIX IN produção | ✅ | ❌ | ❌ |
| PIX OUT código | ✅ | ✅ | ❌ |
| PIX OUT operacional | ❌ | ❌ | ❌ |
| Webhook produção | ✅ IN | ❌ | ❌ |
| Sandbox validado | 🔄 | ✅ | 🔄 |
| Integrado V1 | ✅ IN | ❌ | ❌ |
| Dependência comercial OUT | Alta | Média | Alta |
| Risco | Médio | Médio-alto | Alto |
| **Maturidade** | **READY_WITH_LIMITATIONS** | **READY_WITH_LIMITATIONS** | **PARTIAL** |

---

## 4. Bloqueio crítico V1

O **~5% residual** da V1 concentra-se no **Cash-Out automático**:

| Fato | Evidência |
|------|-----------|
| Código payout implementado | F4.0E-S1, worker Fly, webhooks Ed25519 |
| Zero payouts confirmados em prod | F2.4E.4 — `mp_transaction_intent_id` sempre null |
| Causa | App Checkout não autorizada para Transaction Intents (F2.4E.6) |
| Desbloqueio | App Payouts dedicada + Integrations team MP |

**Implicação estratégica:** o ativo V1 é **tecnicamente maduro**; o gargalo é **contratual/operacional** com Mercado Pago, não engenharia.

---

## 5. Por que Mercado Pago (e não alternativas)

| Fator | Mercado Pago | Asaas | Celcoin |
|-------|--------------|-------|---------|
| Já em produção PIX IN | ✅ | ❌ | ❌ |
| Custo de migração IN | Zero | Alto | Alto |
| Evidência sandbox OUT | Parcial | **Forte** | Nenhuma |
| Evidência prod OUT | Bloqueada (externo) | Nenhuma | Nenhuma |
| Wallet/Ledger acoplados | ✅ | ❌ | ❌ |

**Asaas** é a melhor **plano B** documentada se MP Payouts não for liberado — capacidade sandbox comprovada em 15 fatias (F4.2A–G.3).

**Celcoin** permanece relevante apenas para estratégia **BaaS/conta própria** de longo prazo.

---

## 6. Lacunas e dependências

| Lacuna | Tipo | Responsável |
|--------|------|-------------|
| Habilitação MP Payouts | Comercial | Operador + MP Integrations |
| Smoke payout prod | Homologação | Engenharia |
| `TRANSFER_DONE` Asaas sandbox | Operacional Sandbox | Operador Asaas |
| Credenciais Celcoin | Parceiro | Celcoin onboarding |
| Wiring Payment Engine (Asaas/Celcoin) | Engenharia | Pós-decisão F4.2Z |

---

## 7. Plano de encerramento V1 (financeiro)

1. **F4.3C** — Asaas promovido PSP primário arquitetural *(concluído)*
2. Homologação Asaas produção (`ASAAS_PRODUCTION_ENABLED`) **ou** concluir onboarding MP Payouts
3. Executar 1 saque automático E2E em produção
4. Wiring PIX IN monólito → Payment Engine (F4.4+)
5. Remover ressalva Cash-Out da certificação V1

---

## 8. Estimativas de conclusão

| Escopo | % | Nota |
|--------|---|------|
| **V1 global** | **~95%** | DR-07/08/09; certificação 88/100 |
| **Payment Engine (V1 MP)** | **~85%** | Falta onboarding + smoke OUT |
| **Payment Engine (multi-PSP)** | **~88%** | PIX IN + webhook + crédito controlado + E2E F4.7 |

---

## 9. Riscos para investidor / adquirente

| Risco | Impacto | Probabilidade |
|-------|---------|---------------|
| MP não libera Payouts | Alto — saque manual permanece | Média |
| Homologação Asaas produção atrasada | Médio — MP legado continua IN | Média |
| Split tesouraria MP IN + Asaas OUT | Alto — conciliação | Média (transição) |
| Celcoin atraso | Baixo — não bloqueia V1 | Alta |

---

## 10. Confirmação de escopo

Esta análise foi atualizada em F4.3C com alterações **locais de arquitetura** (sem deploy, sem produção). Baseia-se em evidências F4.2A–F4.3C.

**Referências:** [`F4.2H-MULTI-PSP-AUDIT.md`](../relatorios/F4.2H-MULTI-PSP-AUDIT.md) · [`F4.3C-PRIMARY-PSP-PROMOTION.md`](../relatorios/F4.3C-PRIMARY-PSP-PROMOTION.md) · [`ADR-002-PRIMARY-PSP-ASAAS.md`](../arquitetura/ADR-002-PRIMARY-PSP-ASAAS.md)
