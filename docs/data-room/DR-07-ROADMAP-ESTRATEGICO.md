# DR-07 — Roadmap Estratégico

**Projeto:** Gol de Ouro™  
**Versão de referência:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — roadmap consolidado a partir de evidências do repositório e documentação oficial  
**Documentos relacionados:** DR-02 a DR-06, `docs/audits/V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md`, `docs/arquitetura/PAYMENT-ENGINE-V1.md`, `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`, `V1-FINAL-FREEZE.md`  
**Repositório:** monorepo `goldeouro-backend`

---

## Legenda de status (obrigatória neste documento)

| Símbolo | Status | Significado |
|---------|--------|-------------|
| ✅ | **Concluído** | Implementado e evidenciado em produção ou documentação de encerramento |
| 🔄 | **Em andamento** | Código ou processo iniciado; não fechado end-to-end |
| 📋 | **Planejado / Pendente** | Documentado como próximo passo; **sem implementação completa** |

> **Regra:** itens 📋 **nunca** são apresentados como existentes. Itens 🔄 distinguem-se de ✅ pela ausência de validação E2E em produção ou encerramento formal.

---

# 1. Resumo Executivo

O Gol de Ouro™ percorreu uma trajetória de **produto de entretenimento com premiação financeira** a **ativo tecnológico certificado** (~95% V1), com produção real em `goldeouro.lol`, certificação **CERTIFIED WITH RESSALVAS** (score 88/100, 2026-05-19) e trilha de auditorias encerrada (H4.Z, 2026-05-25).

### Situação estratégica atual

| Dimensão | Estado |
|----------|--------|
| **Produto jogável** | ✅ Produção — gameplay, PIX IN, saque manual admin |
| **Financeiro automático OUT** | 📋 Código pronto; bloqueio onboarding MP Payouts |
| **Multi-PSP** | 🔄 Payment Engine parcial; Celcoin prep (F4/F4.1) |
| **Governança** | ✅ Certificação + runbooks; 🔄 branch protection incompleta |
| **Documentação / Data Room** | 🔄 DR-02 a DR-07; DR-01 referenciado mas ausente no repo |
| **Encerramento V1 a 100%** | 📋 ~5% residual documentado (Cash-Out prod, PSP, homologação) |

### Direção estratégica pós-V1 (evidência documental)

1. **Curto prazo (V1.R):** melhorias UX PIX e confiança (QR-01 a QR-07) — `V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md`
2. **Médio prazo:** conclusão Payment Engine (F4.2/F4.3), decisão PSP Cash-Out, Engine V2 parcial
3. **Longo prazo:** plataforma multi-game, compliance ampliado, escala — roadmap V2 e pós-dados

---

# 2. Evolução Histórica

Linha do tempo reconstruída a partir de DR-03 §16, certificação V1, relatórios F2/F4/H4 e handbook executivo.

```text
Concepção
    ↓  Penáltis + saldo real + PIX — README, handbook §2
Protótipo / MVP
    ↓  Monólito Node + Supabase + MP; player web inicial
Plataforma V1 (desenvolvimento)
    ↓  Wallet + ledger + RPC shoot_apply + admin panel
    ↓  Deploy Fly + Vercel; CI/CD H3.6C
Infraestrutura Cloud madura
    ↓  Health monitor, security CI, PWA player
Cirurgia Econômica (F2-2B/C — 2026-05)
    ↓  RPC shoot_apply refinada; patches V1-only produção
Pipeline Payout (F2-4* — 2026-05)
    ↓  Worker Fly + webhooks Ed25519 + admin saques
    ↓  Bloqueio institucional MP Payouts documentado
Programa Certificação (V1.1A → V1.6 — 2026-05)
    ↓  Hardening webhooks V1.1F; observabilidade V1.2*
    ↓  Certificação oficial 2026-05-19 (88/100)
Operação Controlada
    ↓  H4.0 GO/NO-GO — 2026-05-23
    ↓  Auditorias H4.* encerradas H4.Z — 2026-05-25
Payment Engine (F4.0E-S1+ — 2026-06)
    ↓  Factory + adapters; Celcoin prep F4 / OAuth F4.1
Conclusão parcial V1 (~95%)
    ↓  Freeze documental V1-FINAL-FREEZE
    ↓  Data Room DR-02 a DR-07 (consolidação 2026-06)
Ativo Tecnológico (estado atual)
    ↓  Patrimônio código + docs + certificação + governança
```

### Breve descrição das etapas

| Etapa | Evidência | Resultado |
|-------|-----------|-----------|
| **Concepção** | README, Master Handbook | Jogo de penáltis com economia real PIX |
| **Protótipo/MVP** | `server-fly.js`, player React | Stack full-stack funcional local |
| **Plataforma V1** | RPCs SQL, admin, domínios prod | Operação end-to-end depósito + jogo |
| **Infraestrutura** | `fly.toml`, workflows, certificação | Produção cloud-native documentada |
| **Cirurgia econômica** | Patches F2-2B/C | Gameplay estável em produção |
| **Payout pipeline** | Worker, F2-4* relatórios | Código OUT completo; PSP bloqueado |
| **Certificação** | V1.6, GOLDEOURO-V1-OFFICIAL-CERTIFICATION | CERTIFIED WITH RESSALVAS |
| **Operação Controlada** | H4.0 GO | Usuários reais viáveis com ressalvas |
| **Payment Engine** | `src/finance/`, PAYMENT-ENGINE-V1 | Fundação multi-PSP; migração parcial |
| **~95% V1** | DR-02, DR-03 conclusões | Pendências Cash-Out prod + PSP |

---

# 3. Estado Atual da Plataforma

## 3.1 Visão por status

| Status | Quantidade indicativa | Exemplos |
|--------|----------------------|----------|
| ✅ **Concluído** | ~85–90% escopo V1 funcional | Player, admin, gameplay, PIX IN, deploy, auditorias |
| 🔄 **Em andamento** | ~5–8% | Payment Engine parcial, Celcoin prep, Data Room |
| 📋 **Pendente / Planejado** | ~5–10% | PIX OUT prod E2E, Asaas, F4.2/F4.3, mobile, V1 100% |

## 3.2 Módulos principais

| Módulo | Status | Evidência |
|--------|--------|-----------|
| **Frontend Player** | ✅ Concluído (prod) | Vercel CI, `goldeouro.lol`, PWA |
| **Frontend Admin** | ✅ Concluído (prod) | `admin.goldeouro.lol`, deploy manual documentado |
| **Backend API** | ✅ Concluído (prod) | Fly `goldeouro-backend-v2`, `/health` OK |
| **Gameplay (RPC)** | ✅ Concluído (prod) | `shoot_apply`, patches F2-2C |
| **Wallet** | ✅ Concluído (prod) | `usuarios.saldo` |
| **Ledger** | ✅ Concluído (prod) | `ledger_financeiro` append-only |
| **PIX Cash-In** | ✅ Concluído (prod) | MP + webhook + RPC crédito |
| **PIX Cash-Out automático** | 📋 Pendente (prod) | Código ✅; validação E2E prod 📋; bloqueio PSP |
| **PIX Cash-Out manual admin** | ✅ Concluído (prod) | F2.3/F2.3C, `SaqueUsuarios.jsx` |
| **Payout worker** | ✅ Código / 📋 Prod E2E | Worker implementado; onboarding MP pendente |
| **Payment Engine** | 🔄 Em andamento | Payout parcial via factory; PIX IN 📋 |
| **Celcoin integration** | 🔄 Em andamento | Stubs F4 ✅; OAuth client F4.1 ✅; homologação 📋 |
| **Asaas integration** | 📋 Planejado | Zero código no repo |
| **Mobile Expo** | 📋 Planejado / parcial | `goldeouro-mobile/` sem CI prod |
| **CI/CD** | ✅ Concluído | Workflows canónicos H3.6C |
| **Certificação V1** | ✅ Concluída (com ressalvas) | 2026-05-19, score 88/100 |
| **Auditorias H4** | ✅ Concluídas | H4.Z 2026-05-25 |
| **Data Room** | 🔄 Em andamento | DR-02 a DR-07 presentes; DR-01 ausente |
| **Governança contínua** | 🔄 Em andamento | Scripts ✅; branch protection 📋 |

---

# 4. Marcos da V1

Entregas **realizadas** — evidência em certificação, H4.Z e inventário DR-02.

## 4.1 Produto e frontend

| Marco | Status | Evidência |
|-------|--------|-----------|
| Player SPA React + PWA | ✅ | `goldeouro-player/`, bundle baseline `index-B6M2smS9.js` |
| Admin panel operacional | ✅ | Saques, usuários, relatórios, auditoria |
| Domínios produção | ✅ | `goldeouro.lol`, `admin.goldeouro.lol` |
| Capacitor Android wrapper | 🔄 Parcial | Config presente; CI prod 📋 |

## 4.2 Backend e infraestrutura

| Marco | Status | Evidência |
|-------|--------|-----------|
| Monólito Express produção | ✅ | `server-fly.js`, Fly v461 |
| Worker payout processo Fly | ✅ | `payout_worker` em `fly.toml` |
| Docker + GIT_COMMIT trace | ✅ | `Dockerfile`, gates `/meta` |
| CI/CD backend + player | ✅ | `backend-deploy.yml`, `frontend-deploy.yml` |
| Health monitor 30min | ✅ | `health-monitor.yml` |
| Backup operacional H5-0C | ✅ | `backup/goldeouro-v1-operacional-2026-05-27/` |

## 4.3 Gameplay e financeiro

| Marco | Status | Evidência |
|-------|--------|-----------|
| RPC `shoot_apply` atômica | ✅ | `database/shoot_apply_atomic_transaction.sql` |
| Milestone Gol de Ouro | ✅ | `metricas_globais`, flag `goldenGoal` |
| Wallet + ledger dual-layer | ✅ | `usuarios.saldo`, `ledger_financeiro` |
| RPC crédito PIX IN | ✅ | `claim_and_credit_approved_pix_deposit` |
| PIX IN Mercado Pago prod | ✅ | Webhook HMAC, produção documentada |
| Pipeline PIX OUT (código) | ✅ | Request, worker, webhook, admin |
| Saque manual admin | ✅ | F2.3C cirurgia documentada |
| Webhook hardening payout | ✅ | V1.1F, Ed25519 |

## 4.4 Payment Engine e PSP

| Marco | Status | Evidência |
|-------|--------|-----------|
| Contratos PaymentProvider/PayoutProvider | ✅ | `src/finance/contracts/` |
| FinanceProviderFactory | ✅ | F4.0E-S1 |
| MercadoPagoPayoutProvider | ✅ | Adapter wired |
| Celcoin stubs + config guards | ✅ | F4 prep, `CELCOIN_ENABLED=false` |
| Celcoin OAuth HTTP client | ✅ | F4.1 — sandbox gate script |
| ADR-001 Payment Engine | ✅ | `PAYMENT-ENGINE-V1.md` §16 |

## 4.5 Governança, auditoria e documentação

| Marco | Status | Evidência |
|-------|--------|-----------|
| Programa V1.1A → V1.6 | ✅ | Certificação oficial |
| Trilha auditorias H4.* | ✅ | H4.Z encerramento 2026-05-25 |
| Runbooks operacionais (16) | ✅ | `docs/runbooks/` |
| Master Handbook executivo | ✅ | `GOLDEOURO-V1-MASTER-HANDBOOK.md` |
| V1-FINAL-FREEZE | ✅ | Baseline congelada 2026-05-19 |
| Data Room DR-02 a DR-06 | ✅ | `docs/data-room/` |
| Inventário ~130 ativos | ✅ | DR-02 |

---

# 5. Pendências da V1

Itens **realmente pendentes** — não confundir com roadmap pós-V1.

| # | Pendência | Status | Evidência | Bloqueador |
|---|-----------|--------|-----------|------------|
| 1 | **Validação PIX Cash-Out E2E em produção** | 📋 Pendente | DR-02 §16 lacuna 8; PAYMENT-ENGINE-V1 §15 | Onboarding MP Payouts |
| 2 | **Decisão PSP oficial Cash-Out** | 📋 Pendente | PAYMENT-ENGINE-V1 §17 "Decisão estratégica V1" | Comercial/técnico |
| 3 | **Homologação Celcoin sandbox (F4.2)** | 📋 Pendente | OAuth client F4.1 ✅; credenciais reais 📋 | Onboarding Celcoin |
| 4 | **Celcoin PIX Out prep (F4.3)** | 📋 Planejado | Endpoints DICT, webhook, schema provider-agnostic | Pós-F4.2 |
| 5 | **Integração Asaas** | 📋 Planejado | Zero código; aguardando API | Fornecedor |
| 6 | **Polling / verificação PIX pós-pagamento** | 📋 Planejado | V1-X1 QR-01/QR-02; handbook ressalva | UX — não bloqueador prod |
| 7 | **Mobile Expo publicado** | 📋 Planejado | Sem CI prod | Escopo opcional V1 |
| 8 | **Branch protection completa** | 📋 Pendente | `CONFIGURACAO-FINAL-BRANCH-PROTECTION.md` | Governança |
| 9 | **Encerramento formal V1 a 100%** | 📋 Pendente | Docs citam ~95%; certificação 2026-05-19 com ressalvas | Itens 1–2 principalmente |
| 10 | **Desacoplamento PIX IN do monólito** | 📋 Planejado | PAYMENT-ENGINE-V1 — migração incremental | Pós-payout provider |
| 11 | **Monitoramento externo alertas prod** | 📋 Planejado | Certificação §5 risco 3 — dry-run only | V1.5C/V1.5D |
| 12 | **DR-01 Resumo Executivo** | 📋 Pendente | Referenciado em DR-02/03; ausente em `docs/data-room/` | Documentação |

### O que **não** é pendência bloqueadora (ressalvas aceitas)

- 34 PIX `approved` sem ledger — backlog legado estável (certificação §5)
- Gate pré-deploy em REVIEW — processo documentado
- Worker liveness via logs — runbook existente

---

# 6. Roadmap Pós-V1

Organizado por horizonte — **somente itens fundamentados** em `V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md`, `PAYMENT-ENGINE-V1.md`, handbook e FINAL-DELIVERY.

## 6.1 Curto prazo (1–4 semanas) — V1.R

**Objetivo:** fechar gap UX PIX e confiança sem alterar gameplay estrutural.

| ID | Item | Status | Fonte |
|----|------|--------|-------|
| QR-01 | Botão "Já paguei — verificar" | 📋 Planejado | V1-X1 |
| QR-02 | Poll automático 5s status PIX pending | 📋 Planejado | V1-X1 |
| QR-03 | Toast "Saldo creditado +R$ X" | 📋 Planejado | V1-X1 |
| QR-04 | Modal "Como funciona" | 📋 Planejado | V1-X1 |
| QR-05 | Ocultar VersionBanner em prod | 📋 Planejado | V1-X1 |
| QR-06 | Footer saque taxa/mínimo destacado | 📋 Planejado | V1-X1 |
| QR-07 | Suporte WhatsApp/email dashboard | 📋 Planejado | V1-X1 |
| F4.2 | Validação OAuth Celcoin credenciais reais | 📋 Planejado | PAYMENT-ENGINE-V1 §17 |
| — | Completar DR-01 Data Room | 📋 Planejado | Lacuna DR-02/03 |
| — | Branch protection status checks | 📋 Planejado | DR-04 |

**Priorização documentada:** Sprint 0 = QR-01, QR-02, QR-03, QR-07 (V1-X1).

## 6.2 Médio prazo (1–3 meses)

**Objetivo:** destravar Cash-Out, completar Payment Engine, iniciar Engine V2.

| ID | Item | Status | Fonte |
|----|------|--------|-------|
| F4.3 | Celcoin DICT + PIX Out prep + webhook | 📋 Planejado | PAYMENT-ENGINE-V1 §17 |
| — | Decisão PSP Cash-Out (MP vs Celcoin vs Asaas) | 📋 Planejado | PAYMENT-ENGINE-V1 §17 |
| — | AsaasPayoutProvider (pós-liberação API) | 📋 Planejado | PAYMENT-ENGINE-V1 |
| — | Schema `saques` provider-agnostic | 📋 Planejado | F4.3+, PAYMENT-ENGINE-V1 §15 |
| — | Migrar PIX IN + webhooks para Payment Engine | 📋 Planejado | ADR-001 consequências |
| V2-01 | Websocket / realtime saldo | 📋 Planejado | V1-X1 |
| V2-04 | Limites jogo responsável configuráveis | 📋 Planejado | V1-X1 |
| V2-06 | Unificar rotas jogo (remover legado) | 📋 Planejado | V1-X1 |
| V2-08 | Contract tests baseline V1 | 📋 Planejado | V1-X1 |
| — | Ativar monitoramento externo alertas | 📋 Planejado | Certificação risco 3 |
| — | Encerramento formal V1 100% | 📋 Planejado | Critérios §11 |

## 6.3 Longo prazo (3–12+ meses)

**Objetivo:** plataforma multi-game, escala, novos mercados.

| ID | Item | Status | Fonte |
|----|------|--------|-------|
| V2-02 | Fila gameplay social UX | 📋 Planejado | V1-X1 |
| V2-03 | RTP / probabilidades página regulatória | 📋 Planejado | V1-X1, OC-INC-02 |
| V2-05 | Onboarding interativo + A/B | 📋 Planejado | V1-X1 |
| V2-07 | Push PWA retenção | 📋 Planejado | V1-X1 |
| — | Engine V2 multi-game | 📋 Planejado | Handbook §2, freeze §68 |
| — | Mobile Expo / app stores | 📋 Planejado | DR-02, `eas.json` |
| PO-* | Melhorias data-driven (bônus, load test 1k CCU) | 📋 Planejado | V1-X1 §3 |
| — | Novos PSPs / tesouraria dual IN+OUT | 📋 Planejado | PAYMENT-ENGINE-V1 §17 |
| — | Compliance premiação/jogos ampliado | 📋 Planejado | PAYMENT-ENGINE-V1 §15 risco 10 |

---

# 7. Evolução Arquitetural

Transformação documentada (DR-03 §16, handbook, PAYMENT-ENGINE-V1):

```text
PRODUTO
    Jogo de penáltis + PIX — conceito único
        ↓
PLATAFORMA V1
    Monólito + Supabase RPCs + wallet/ledger + admin
    Entretenimento com economia real operacional
        ↓
INFRAESTRUTURA COMPARTILHADA
    Fly + Vercel + Supabase + GitHub Actions
    Padrões deploy, health, rollback reutilizáveis
        ↓
CAMADA FINANCEIRA MODULAR (em curso)
    Payment Engine — factory, contratos, adapters
    Redução lock-in PSP; payout primeiro, IN depois
        ↓
ATIVO TECNOLÓGICO
    Código + RPCs + docs + certificação + Data Room
    Transferível, auditável, evoluível (Engine V2)
```

### Estado de cada camada

| Camada | Maturidade | Status |
|--------|------------|--------|
| Produto (gameplay) | Alta | ✅ |
| Plataforma V1 | Alta (~95%) | ✅ / 📋 OUT prod |
| Infra compartilhada | Alta | ✅ |
| Payment Engine | Média | 🔄 |
| Ativo tecnológico (IP + docs) | Alta | 🔄 Data Room |

---

# 8. Objetivos Estratégicos

Objetivos da **próxima fase** — derivados de documentação oficial, não inventados.

| # | Objetivo | Status atual | Meta |
|---|----------|--------------|------|
| 1 | **Concluir Payment Engine** | 🔄 Payout parcial | PIX IN + webhooks via factory |
| 2 | **Reduzir lock-in PSP** | 🔄 Prep Celcoin | PSP Cash-Out operacional alternativo |
| 3 | **Validar PIX OUT produção** | 📋 Bloqueado | E2E certificado ou aceite formal manual+PSP |
| 4 | **Completar Data Room** | 🔄 DR-02–07 | DR-01 + pacote investidor fechado |
| 5 | **Consolidar governança** | 🔄 Parcial | Branch protection + monitoramento externo prod |
| 6 | **Melhorar UX PIX (V1.R)** | 📋 QR-* backlog | Reduzir ansiedade pós-depósito |
| 7 | **Preparar Engine V2** | 📋 Roadmap | Multi-game, websocket, contract tests |
| 8 | **Encerrar V1 a 100%** | 📋 ~95% | Critérios §11 satisfeitos |
| 9 | **Decisão tesouraria multi-PSP** | 📋 Análise | IN e OUT PSPs distintos se necessário |
| 10 | **Escalar com dados reais** | 📋 Pós-usuários | PO-* métricas V1-X1 |

---

# 9. Riscos Estratégicos

| Categoria | Risco | Severidade | Mitigação documentada |
|-----------|-------|------------|----------------------|
| **Terceiros — PSP** | Dependência MP PIX IN; OUT bloqueado | Alta | Payment Engine; Celcoin/Asaas prep |
| **Terceiros — Cloud** | Fly/Vercel/Supabase lock-in | Média | Docker portable; SQL versionado |
| **Regulatório** | Premiação/jogos + PSP alternativo | Alta | Due diligence comercial PAYMENT-ENGINE §15 |
| **Operacional** | PIX OUT manual-only prolongado | Média | Admin operacional ✅; automação 📋 |
| **Operacional** | Gate deploy REVIEW | Baixa | Processo humano documentado |
| **Técnico** | Monólito + dívida legado routes | Média | Migração incremental; V2-06 |
| **Técnico** | Payment Engine híbrida | Média | ADR-001 — estado temporário aceito |
| **Comercial** | Asaas API não liberada | Média | Celcoin como alternativa B |
| **Comercial** | Celcoin onboarding/sandbox | Média | F4.2 gate antes prod |
| **Reputação/UX** | Sem polling PIX | Média | QR-01/QR-02 curto prazo |
| **Governança** | Certificação invalidada por drift | Média | Baseline + `/meta` gates |
| **Escala** | Fly 256MB / monólito | Média | PO-06 load test; upgrade Fly |

---

# 10. Oportunidades

| Oportunidade | Base evidência | Horizonte |
|--------------|----------------|-----------|
| **Reutilizar Payment Engine** | Factory + contratos em outros produtos financeiros | Médio |
| **Licenciar stack wallet+ledger** | DR-06 ativos reutilizáveis | Médio-longo |
| **White-label admin** | `goldeouro-admin/` completo | Médio |
| **PSP dual-track IN/OUT** | MP IN estável + Celcoin OUT | Curto-médio |
| **Engine V2 multi-game** | Handbook — "valida título; V2 plataforma" | Longo |
| **PWA + retenção** | V2-07 push; Capacitor Android | Médio |
| **Data Room como produto DD** | Metodologia auditoria H4 + certificação | Curto |
| **Mercados adjacentes** | Stack PIX + gameplay replicável | Longo — 📋 sem doc detalhado |
| **Parceiros BaaS** | Celcoin, Asaas, Efí spikes | Médio |
| **Melhorias conversão** | CV-* V1-X1 — funil FTU | Curto |

---

# 11. Critérios para Encerramento da V1

Lista **objetiva** — o que falta para considerar V1 **oficialmente 100% concluída** (além da certificação com ressalvas já emitida).

| # | Critério | Status | Obrigatório? |
|---|----------|--------|--------------|
| 1 | PIX IN operacional prod | ✅ Satisfeito | Sim |
| 2 | Gameplay + wallet + ledger prod | ✅ Satisfeito | Sim |
| 3 | Admin operacional prod | ✅ Satisfeito | Sim |
| 4 | Certificação V1.6 emitida | ✅ Satisfeito (com ressalvas) | Sim |
| 5 | Auditorias H4 encerradas | ✅ Satisfeito | Sim |
| 6 | Baseline congelada documentada | ✅ Satisfeito | Sim |
| 7 | **PSP Cash-Out escolhido e documentado** | 📋 Pendente | **Sim** — PAYMENT-ENGINE §17 |
| 8 | **PIX OUT validado E2E prod OU aceite formal modo manual** | 📋 Pendente | **Sim** — DR-02 lacuna 8 |
| 9 | Payment Engine payout provider homologado | 🔄 Parcial (MP código; prod bloqueado) | Sim |
| 10 | Data Room completo (DR-01 a DR-07) | 🔄 DR-01 ausente | Recomendado |
| 11 | Ressalvas certificação estáveis/monitoradas | ✅ Documentado | Sim |
| 12 | V1-X1 Sprint 0 (QR-01/02/03) | 📋 Planejado | Opcional para 100% técnico |
| 13 | Mobile publicado | 📋 Não iniciado | **Não** — fora escopo V1 freeze |

### Veredito encerramento

A V1 está **certificada para Operação Controlada** (2026-05-19) e **auditorias encerradas** (2026-05-25), porém documentação convergente indica **~95% completude técnica** — gap principal: **Cash-Out automático em produção + decisão PSP**. Encerramento **100%** requer resolução documentada dos critérios 7–8 (mínimo).

---

# 12. Próxima Grande Fase

## Fase identificada: **V1.R → Payment Engine completa → Engine V2**

Documentação oficial (`V1-FINAL-FREEZE`, handbook, `07-ROADMAP/README.md`) define que **pós-freeze** não há big-bang — sequência esperada:

### Fase A — V1.R (Residual + UX) · curto prazo

- Fechar pendências UX PIX (QR-*)
- F4.2 validação Celcoin sandbox
- Completar Data Room e governança (DR-01, branch protection)
- **Descongelamento** apenas com gate formal pós-decisão executiva (`V1-FINAL-FREEZE` §Descongelamento)

### Fase B — Payment Engine + Cash-Out · médio prazo

- Decisão PSP Cash-Out (comparativo MP vs Celcoin vs Asaas)
- F4.3 Celcoin ou integração Asaas
- Validação E2E payout produção
- Migração PIX IN/webhooks para factory
- Encerramento formal V1 **100%**

### Fase C — Engine V2 · longo prazo

- Plataforma multi-game (handbook: "V1 valida título; V2 evolui plataforma")
- Websocket saldo, fila social, compliance RTP
- Contract tests herdam baseline V1
- Novos jogos **fora escopo V1 freeze** — backlog documentado apenas

```text
V1 (~95%) ──► V1.R (UX + F4.2) ──► V1 100% (Cash-Out + PSP)
                                        │
                                        ▼
                              Engine V2 (plataforma multi-game)
```

---

# 13. Conclusão Executiva

## Como o roadmap reduz riscos e aumenta o valor estratégico do Gol de Ouro™?

Sob a ótica de **planejamento estratégico e Due Diligence**:

### Redução de riscos

1. **Transparência de status** — separação explícita ✅/🔄/📋 evita que comprador ou investidor confunda prep Celcoin com produção, ou certificação com V1 100% fechada.

2. **Pendências bounded** — o gap principal (Cash-Out prod) é **externo ao core IP** (onboarding PSP), com mitigação manual operacional ✅ e código ✅ já existente.

3. **Roteiro de destravamento** — F4.2 → F4.3 → decisão PSP é sequência documentada, não improviso.

4. **Freeze congelado** — V1-FINAL-FREEZE protege baseline certificada enquanto roadmap pós-V1 avança em gates.

5. **Ressalvas monitoradas** — backlog ledger, gate REVIEW e worker logs têm runbooks; não são surpresas.

### Aumento de valor estratégico

1. **Ativo quase completo com caminho claro** — ~95% + roadmap F4/V1-X1/Engine V2 demonstra **execução disciplinada**, não projeto abandonado.

2. **Opcionalidade PSP** — Payment Engine transforma bloqueio MP em **decisão comercial** entre alternativas preparadas.

3. **Plataforma vs produto único** — trajetória Engine V2 multi-game aumenta TAM além do penáltis.

4. **Data Room + certificação** — roadmap integrado a DR-02–07 reduz assimetria informacional na DD.

5. **Quick wins V1.R** — QR-* de baixo risco melhoram conversão PIX sem tocar gameplay certificado.

**Síntese:** o roadmap evidencia que o Gol de Ouro™ **já capturou valor operacional** (PIX IN + gameplay + governança) e possui **plano documentado e priorizado** para os ~5% residuais e expansão pós-V1 — perfil favorável para investidor que discounta incerteza, não ausência de plano.

---

## Metadados desta auditoria

| Campo | Valor |
|-------|-------|
| **Arquivo criado** | `docs/data-room/DR-07-ROADMAP-ESTRATEGICO.md` |
| **Modo** | READ-ONLY — nenhuma alteração em código, banco, configs ou docs preexistentes |
| **Fonte** | Repositório + documentação oficial citada |
| **Data** | 2026-06-23 |

### Resumo solicitado

| Item | Resultado |
|------|-----------|
| **Principais marcos identificados** | Certificação V1.6 (88/100), H4.Z, gameplay RPC, PIX IN prod, pipeline OUT código, Payment Engine F4, freeze baseline, Data Room |
| **Principais pendências** | PIX OUT E2E prod, decisão PSP, F4.2/F4.3 Celcoin, Asaas, encerramento V1 100%, DR-01 |
| **Próximos objetivos** | V1.R (QR-*), F4.2 OAuth Celcoin, decisão Cash-Out, F4.3, Engine V2 |
| **Código alterado** | **Nenhum** |
