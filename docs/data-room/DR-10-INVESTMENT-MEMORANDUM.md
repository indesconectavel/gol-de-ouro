# DR-10 — Investment Memorandum

**Projeto:** Gol de Ouro™  
**Documento:** Memorando Executivo — Data Room V1  
**Data:** 2026-06-23  
**Classificação:** Uso interno — sócios, investidores qualificados e processos de M&A  
**Modo:** consolidação READ-ONLY — síntese dos documentos DR-02 a DR-09  
**Base analítica:** Repositório `goldeouro-backend` + certificação V1.6 + handbook executivo  

---

## Declarações limitadoras

- Este memorando **não constitui** oferta de investimento, assessoria jurídica, fiscal ou valuation.
- **Não contém** estimativas de receita, EBITDA, valuation ou múltiplos de mercado.
- Todas as afirmações derivam de evidências documentadas no Data Room; lacunas estão explicitadas.
- DR-01 (Resumo Executivo) é referenciado na série mas **não está presente** em `docs/data-room/` no momento desta consolidação.

### Mapa do Data Room

| Doc | Título | Função |
|-----|--------|--------|
| DR-02 | Inventário Oficial | O que existe |
| DR-03 | Arquitetura Geral | Como funciona tecnicamente |
| DR-04 | Governança | Como é administrado |
| DR-05 | Infraestrutura | Onde roda |
| DR-06 | Propriedade Intelectual | O que é proprietário |
| DR-07 | Roadmap | Para onde vai |
| DR-08 | Modelo Operacional e Financeiro | Como circula o dinheiro |
| DR-09 | Avaliação Estratégica | Fatores de valor e risco |
| **DR-10** | **Investment Memorandum** | **Síntese executiva (este documento)** |

---

# 1. Resumo Executivo

O **Gol de Ouro™** é uma plataforma de **entretenimento digital com economia real em reais (BRL)**: o usuário deposita via **PIX**, joga penáltis consumindo saldo interno, recebe prêmios creditados na wallet e solicita **saque PIX** quando elegível. Opera como **PWA mobile-first** em produção pública.

### Tese do ativo (uma frase)

Plataforma **~95% concluída**, **certificada para Operação Controlada**, com **PIX IN operacional**, **motor de jogo proprietário no PostgreSQL**, **sistema financeiro auditável (wallet + ledger)** e **documentação excepcional** — gap principal concentrado em **destravar Cash-Out via PSP**, não em ausência de arquitetura.

### Indicadores-chave (evidência certificação V1.6, 2026-05-19)

| Indicador | Valor |
|-----------|-------|
| Completude V1 | ~95% |
| Score consolidado | **88 / 100** |
| Veredito | **CERTIFIED WITH RESSALVAS** |
| Operação | **PASS COM RESSALVAS** — Operação Controlada (H4.0 GO) |
| Runtime produção | Fly v461 · SHA `a83c3cf` · bundle `index-B6M2smS9.js` |
| Domínios | `goldeouro.lol` · `admin.goldeouro.lol` |
| PIX IN | ✅ Operacional (Mercado Pago) |
| PIX OUT automático | 📋 Código completo; bloqueio onboarding PSP |
| Documentação | **956** arquivos `.md` · Data Room 8 docs |

### Por que representa ativo tecnológico relevante?

O comprador ou investidor adquire **plataforma deployada + IP gameplay + stack financeiro auditável + governança documentada + roadmap bounded** — não repositório experimental. A combinação **produção + certificação + ledger + Data Room** reduz assimetria de informação típica em DD de startups pré-escala.

---

# 2. Visão Geral da Plataforma

## O que é

| Dimensão | Descrição |
|----------|-----------|
| **Produto** | Jogo de penáltis com saldo real, depósitos e saques PIX |
| **Público** | Jogadores mobile-first; operadores via painel admin |
| **Modelo** | Entretenimento com premiação financeira — aposta por chute, prêmio por gol, milestone **Gol de Ouro** (+R$100 a cada 1.000 chutes globais) |
| **Stack** | React (player + admin) · Node.js monólito · PostgreSQL Supabase · Fly.io · Vercel |
| **Monetização técnica** | Depósitos PIX IN operacionais; taxa de saque documentada (default R$ 2,00) |

## Jornada resumida

Cadastro → login JWT → depósito PIX → wallet creditada → gameplay (`shoot_apply`) → prêmios → solicitação saque → execução manual admin ou worker PSP (automático 📋 prod).

## Posicionamento documentado

Handbook executivo: V1 **valida um título**; **Engine V2** evolui para plataforma multi-game — escopo pós-V1 explicitamente fora do freeze atual.

---

# 3. Estágio Atual

## Maturidade

| Camada | Estágio | Evidência |
|--------|---------|-----------|
| **Produto jogável** | Produção | Domínios live; certificação runtime 100 |
| **Financeiro IN** | Produção | PIX IN MP; RPC claim idempotente |
| **Financeiro OUT** | Pré-produção E2E | Código ✅; PSP 📋; manual admin ✅ |
| **Governança** | Semi-autônoma GOVERNED | Score governança 100; branch protection 🔄 |
| **Documentação** | Institucional | 956 docs; trilha H4.Z encerrada |
| **Mobile nativo** | Experimental | Expo parcial; sem CI prod |

## Infraestrutura

Cloud-native: **Fly.io** (backend + worker, GRU, 256MB) · **Vercel** (player CI + admin manual) · **Supabase** (PostgreSQL) · **GitHub Actions** (deploy canónico, health monitor 30min, security CI).

## Documentação

- Certificação oficial V1.6 + freeze baseline
- ~956 relatórios, runbooks, auditorias
- Data Room DR-02 a DR-10
- Master Handbook executivo

## Operação

- **Operação Controlada** aprovada (H4.0 GO, 2026-05-23)
- Auditorias encerradas (H4.Z, 2026-05-25)
- Saque operacional via **aprovação manual admin** enquanto PSP OUT não destravado
- Riscos residuais **quantificados e aceitos** na certificação (34 approved_sem_ledger estáveis, saldo_negativo=0)

---

# 4. Arquitetura

Síntese — detalhe em DR-03.

```text
Player/Admin (Vercel) ──HTTPS/JWT──► server-fly.js (Fly.io)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              RPC shoot_apply      usuarios.saldo         Payment Engine
              (gameplay ACID)      ledger_financeiro      (payout parcial)
                    │                     │                     │
                    └─────────────────────┴─────────────────────┘
                                          ▼
                                   Supabase PostgreSQL
                                          ▼
                              Mercado Pago (PIX IN prod / OUT prep)
```

| Componente | Síntese | Status |
|------------|---------|--------|
| **Plataforma** | Monorepo full-stack; monólito HTTP + extração financeira incremental | ✅ Prod |
| **Backend** | `server-fly.js` ~4.700 linhas; worker `payout_worker` separado | ✅ Prod |
| **Frontend** | Player PWA (CI) + Admin ops (manual deploy) | ✅ Prod |
| **Wallet** | `usuarios.saldo` — mutável; optimistic lock saques | ✅ Prod |
| **Ledger** | `ledger_financeiro` append-only; 6 tipos; idempotência | ✅ Prod |
| **Payment Engine** | Factory + contratos + MP adapter + Celcoin prep | 🔄 Parcial |

**Princípio arquitetural distintivo:** operações que não podem falhar parcialmente (gameplay, crédito PIX) vivem em **RPCs PostgreSQL atômicas** — independentes do runtime Node.

---

# 5. Diferenciais Competitivos

| # | Diferencial | Por que importa |
|---|-------------|-----------------|
| 1 | **Produção certificada** | Runtime score 100; não é MVP local |
| 2 | **Ledger + wallet dual-layer** | Auditabilidade exigida em premiação real |
| 3 | **Gameplay IP no PostgreSQL** | Barreira reprodução; separável de PSP |
| 4 | **Documentação forense** | 956 docs + certificação; ↓ risco DD |
| 5 | **PIX IN hardened** | Webhook 401 sem assinatura; score segurança 100 |
| 6 | **Payment Engine + ADR-001** | Caminho multi-PSP sem reescrita |
| 7 | **Governança operacional** | Runbooks, FP-01..09, H4.Z encerrado |
| 8 | **Transparência de riscos** | Gap OUT documentado; não oculto |
| 9 | **Admin ops completo** | Saque manual viável sem engenharia 24/7 |
| 10 | **Baseline congelada** | Herança Engine V2 rastreável |

---

# 6. Patrimônio Tecnológico

Consolidação DR-02 + DR-06 — inventário estratégico.

| Categoria | Conteúdo | Volume indicativo |
|-----------|----------|-------------------|
| **Código** | Player, admin, backend, worker, Payment Engine, SQL | ~593 arquivos fonte |
| **IP gameplay** | RPC `shoot_apply`, lotes, milestone Gol de Ouro | SQL proprietário |
| **IP financeiro** | Wallet, ledger, RPC claim, domínio payout | Dual-layer |
| **Payment Engine** | 12 módulos `src/finance/`; ADR-001 | 🔄 parcial |
| **Scripts ops** | Certificação, auditoria, payouts, governança | ~200+ |
| **Documentação** | Auditorias, runbooks, certificação, Data Room | 956 `.md` |
| **Marca** | Gol de Ouro™; `goldeouro.lol`; `com.goldeouro.app` | Documental |
| **Infra config** | fly.toml, Dockerfile, vercel.json, workflows | Cloud-native |

**Reutilizável:** wallet+ledger, Payment Engine, admin template, scripts certificação, stack Fly/Vercel/Supabase (DR-06 §10).

**Não incluído no Git:** credenciais PSP, contas cloud, contratos comerciais.

---

# 7. Governança

Síntese DR-04 — maturidade documental.

| Pilar | Estado | Score cert. |
|-------|--------|-------------|
| **Certificação V1.6** | Emitida 2026-05-19 | 88/100 |
| **Auditorias H4** | Encerradas H4.Z | GO Operação Controlada |
| **CI/CD** | Deployers canónicos H3.6C; gates `/health`+`/meta` | Runtime 100 |
| **Runbooks** | 16 ativos — financeiro, runtime, workers, segurança | Governança 100 |
| **Prova financeira** | FP-01..09 automatizada | Integridade 85 |
| **Freeze V1** | Baseline congelada; descongelamento gated | Ativo |
| **Branch protection** | 🔄 Incompleta | Gap governança |
| **Monitor externo alertas** | 📋 Dry-run only | Risco aceito cert. |

**Classificação:** **GOVERNED** · maturidade **semi-autônoma** — acima de startups equivalentes em documentação operacional; abaixo de enterprise com SOC/SRE dedicado.

---

# 8. Roadmap

Síntese DR-07 — status explícito.

## Pendências V1 (~5%)

| Item | Status |
|------|--------|
| PIX OUT E2E produção | 📋 PSP onboarding |
| Decisão PSP Cash-Out | 📋 MP vs Celcoin vs Asaas |
| Homologação Celcoin F4.2/F4.3 | 📋 OAuth client ✅ |
| Encerramento formal V1 100% | 📋 |
| DR-01 Data Room | 📋 Ausente |

## Próximas fases

```text
V1 (~95%) ──► V1.R (UX PIX: QR-01..07) ──► V1 100% (Cash-Out + PSP)
                                                │
                                                ▼
                                      Engine V2 (multi-game, websocket, compliance)
```

| Horizonte | Foco |
|-----------|------|
| **Curto (1–4 sem)** | V1.R UX depósito; F4.2 Celcoin sandbox; governança |
| **Médio (1–3 meses)** | F4.3 Celcoin OUT; Payment Engine completa; OUT prod |
| **Longo (3–12+ meses)** | Engine V2; mobile; RTP/compliance; escala PO-06 |

---

# 9. Oportunidades Estratégicas

| Oportunidade | Base | Horizonte |
|--------------|------|-----------|
| **Destravar Cash-Out** | Código worker+factory pronto | Médio — pós-PSP |
| **Multi-PSP** | Payment Engine + Celcoin prep | Médio |
| **Engine V2 multi-game** | Handbook; IP gameplay separável | Longo |
| **Reutilização stack** | Wallet, ledger, admin, certificação scripts | Médio-longo |
| **V1.R conversão PIX** | QR-01/02 polling; ↓ abandono depósito | Curto |
| **White-label / licenciamento técnico** | Módulos isolados DR-06 | Longo — não evidenciado comercial |
| **Mobile app stores** | Capacitor + Expo config | Médio |
| **Expansão compliance** | RTP, jogo responsável V2-03/04 | Longo |
| **Tesouraria dual IN/OUT PSP** | MP IN estável + OUT alternativo | Médio |

---

# 10. Principais Riscos

Apenas riscos **evidenciados** — sem catastrofização.

| Risco | Severidade | Mitigação documentada |
|-------|------------|-------------------------|
| **PIX OUT prod bloqueado (PSP)** | Alta | Admin manual ✅; Celcoin/Asaas prep |
| **Dependência Mercado Pago PIX IN** | Alta | Payment Engine roadmap |
| **Monólito server-fly.js** | Média | Migração incremental; RPCs no DB |
| **Processos manuais (saque, SQL patches)** | Média | Runbooks; admin ops |
| **~5% V1 pendente** | Média | Roadmap F4/V1.R explícito |
| **Branch protection incompleta** | Média | Documentado; endereçável |
| **Recursos Fly 256MB** | Média | Upgrade path |
| **DD jurídica (LICENSE, marca, cessão)** | Média | Fora repo — validar separado |
| **Regulatório premiação/jogos** | Alta | Due diligence comercial PSP |
| **Backlog 34 approved_sem_ledger** | Baixa-média | Estável; FP-03 monitorado |
| **Credenciais não no Git** | Média | Transferência negociada M&A |

**Ausência de bloqueadores P0** não monitorados — certificação formal.

---

# 11. Considerações para Investidores

## Por que este ativo merece atenção?

### 1. Redução de risco de descoberta

Data Room estruturado (DR-02 a DR-10), certificação scored, trilha H4.Z e ledger auditável **antecipam perguntas de DD** — economia de tempo e custo de diligência.

### 2. Produção, não promessa

PIX IN operacional, domínios live, score runtime 100 — receita de depósitos **tecnicamente viável** pós-close (sujeito a contratos PSP e operação comercial, fora deste memo).

### 3. Gap principal bounded

~5% residual = **PSP Cash-Out + decisão provider** — não reescrita de plataforma. Código interno completo; operação manual sustenta continuidade.

### 4. Option value de plataforma

Payment Engine, roadmap Engine V2 e componentes reutilizáveis permitem **upside além do jogo atual** — não apenas aquisição de SKU único.

### 5. Governança como ativo

Runbooks, FP-01..09, freeze baseline e backup H5-0C facilitam **transição de equipe** e **herança técnica** pós-aquisição.

### 6. Perfil de investidor alinhado (inferência técnica)

- Operador iGaming/premiação buscando plataforma quase pronta
- Fintech/adtech reutilizando stack wallet+ledger+PIX
- Investidor tech valorizando **auditabilidade** sobre **hype de MVP**

## O que validar além deste memorando

| Área | Ação DD |
|------|---------|
| Credenciais PSP e cloud | Transferência contas |
| Contratos e IP | Assessoria jurídica |
| Custos infra + taxas MP | Modelo econômico separado |
| Runtime vs baseline | `GET /meta` live |
| Prova financeira | `financial-proof-engine.js` |
| Regulatório | Elegibilidade premiação + PSP |

---

# 12. Conclusão

## Estágio de maturidade

| Pergunta | Resposta |
|----------|----------|
| **Estágio** | **V1 ~95% concluída** — certificada **CERTIFIED WITH RESSALVAS** para **Operação Controlada** |
| **Classificação** | Ativo tecnológico **operacional** — entre MVP e escala enterprise |
| **Maturidade operacional** | **Semi-autônoma GOVERNED** (score 88/100) |
| **Pronto para usuários reais?** | **Sim, com ressalvas documentadas** (H4.0 GO; saque manual; polling PIX UX) |
| **Pronto para escala massiva?** | **Não ainda** — OUT automático, recursos Fly, APM externo pendentes |

## Potencial estratégico

| Dimensão | Potencial |
|----------|-----------|
| **Produto atual** | Penáltis + PIX — validado em produção |
| **Plataforma** | Engine V2 multi-game; stack reutilizável |
| **Financeiro** | Multi-PSP; tesouraria dual; módulo licenciável |
| **DD / M&A** | Documentação excepcional — ativo transacionável |
| **Evolução** | Roadmap F4/V1.R/V2 documentado — não improviso |

### Síntese final

O Gol de Ouro™ representa um **ativo tecnológico relevante** porque combina, de forma rara em estágio pré-escala:

- **Operação comprovada** (não slide deck)
- **Integridade financeira estrutural** (ledger, não só saldo opaco)
- **IP diferenciada** (gameplay no PostgreSQL)
- **Governança auditável** (certificação + H4.Z + Data Room)
- **Gap residual delimitado** (PSP OUT — externo, mitigável)
- **Opcionalidade de plataforma** (Payment Engine, Engine V2)

Para investidor ou comprador, o ativo oferece **base sólida para monetização imediata (PIX IN + gameplay)** e **caminho claro para completar V1 e escalar** — sem necessidade de construir do zero.

**Próximo passo recomendado pós-leitura:** aprofundar DR-08 (fluxo financeiro) e DR-09 (fatores valor/risco); executar checklist DD §11 DR-09; validar credenciais e contratos fora do repositório.

---

## Metadados

| Campo | Valor |
|-------|-------|
| **Arquivo** | `docs/data-room/DR-10-INVESTMENT-MEMORANDUM.md` |
| **Série Data Room** | DR-02 a DR-10 (9 documentos; DR-01 pendente) |
| **Modo** | READ-ONLY — nenhuma alteração em código ou docs preexistentes |
| **Valuation** | **Não realizado** |
| **Data** | 2026-06-23 |

### Resumo solicitado

| Item | Resultado |
|------|-----------|
| **Principais diferenciais** | Produção certificada; ledger+wallet; RPC gameplay; docs forenses; PIX IN hardened; Payment Engine prep; governança H4.Z |
| **Principais oportunidades** | Cash-Out pós-PSP; multi-PSP; Engine V2; reutilização stack; V1.R UX; mobile |
| **Principais riscos** | PSP OUT bloqueado; lock-in MP IN; monólito; processos manuais; DD jurídica; ~5% V1 |
| **Código alterado** | **Nenhum** |

---

*Gol de Ouro™ — Investment Memorandum · Data Room V1 · Documento de síntese executiva. Detalhe técnico nos DR-02 a DR-09.*
