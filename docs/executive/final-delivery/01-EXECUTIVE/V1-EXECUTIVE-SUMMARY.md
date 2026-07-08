# Gol de Ouro V1 — Resumo Executivo

**Documento:** Sumário para sócios e investidores  
**Data:** 19 de maio de 2026  
**Páginas equivalentes:** 2–4 (leitura ~10 minutos)  
**Modo:** documentação · **sem alteração de produção, banco, deploy ou código**

---

## Em uma frase

O **Gol de Ouro V1** é um jogo de penáltis com dinheiro real e PIX, **já em produção**, com backend **certificado com ressalvas** (88/100), baseline técnica congelada e governança operacional documentada — apto para operação contínua e captação **transparente**, não para narrativa de escala enterprise já provada.

---

## Visão

Posicionar o Gol de Ouro como plataforma de **entretenimento casual de alta frequência** com liquidez PIX, evoluindo de um título único (V1) para engine multi-game (V2). A V1 valida viabilidade técnica, financeira e operacional em ambiente real.

---

## Estado atual

| Indicador | Valor |
|-----------|-------|
| **Produção** | Ativa · `goldeouro.lol` |
| **Runtime** | SHA `a83c3cf` · Fly **v461** |
| **Player bundle** | `index-B6M2smS9.js` |
| **Certificação** | **CERTIFIED WITH RESSALVAS** |
| **Score** | **88 / 100** |
| **Classificação** | **GOVERNED** |
| **Maturidade** | **Semi-autonomous** |
| **V1 encerrada** | Sim (V1.6 + V1.FINAL · 2026-05-19) |

Validação rápida: `GET https://goldeouro-backend-v2.fly.dev/meta` → `gitCommit` = `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634`.

---

## Baseline certificada

A baseline congelada é o **contrato de produção** entre engenharia, operação e investidores:

- Qualquer deploy que altere SHA, release Fly ou bundle **invalida** a certificação até novo ciclo formal.
- Snapshots SQL e relatórios PRE-APPLY documentam rollback antes de mudanças em RPC/ledger.
- Referência: `docs/certification/V1-BASELINE-CERTIFIED.md`

---

## Diferenciais

1. **Produção real com governança** — raro em estágio seed no segmento; dezenas de missões auditadas (V1.1A → V1.6).
2. **Integridade financeira P0** — zero saldo negativo; zero duplicatas críticas no ledger; webhooks rejeitam requisições não assinadas (**401** live).
3. **RPC PIX hardened** — crédito atômico via `claim_and_credit_approved_pix_deposit` (patch M1).
4. **Runtime verificável** — três camadas: API `/meta`, Fly release, bundle Vercel.
5. **Operação governada** — 17+ runbooks, activation gates, verificação contínua read-only.
6. **Gameplay polido** — experiência emocional adequada para demo e retenção por sessão.
7. **Transparência institucional** — ressalvas documentadas, não ocultas.

---

## O produto (síntese)

- **Gameplay:** penáltis, fila, evento “gol de ouro”, áudio e UI mobile-first (PWA).
- **Economia real:** depósito PIX, saldo, chute pago, saque com taxa documentada.
- **Admin:** painel separado para operações.
- **Gap conhecido:** pós-PIX sem polling automático — roadmap V1.R.

---

## Arquitetura (síntese)

| Camada | Stack |
|--------|-------|
| Front | React / Vite · Vercel |
| API | Node.js / Express · Fly.io |
| Dados | Supabase PostgreSQL |
| Pagamentos | Mercado Pago PIX |
| CI/CD | GitHub Actions (gates em examples) |

---

## Score por domínio (V1.6)

| Domínio | Score | Nota |
|---------|------:|------|
| Runtime & deploy | 100 | Alinhado baseline |
| Integridade financeira | 85 | P0 ausente; legado documentado |
| Segurança webhooks | 100 | Hardening V1.1F live |
| Governança operacional | 100 | Runbooks, gates, incident flow |
| Observabilidade | 100 | Scripts; alertas externos dry-run |
| Resiliência | 96 | Simulada V1.5 |
| Readiness ativação | 82 | Gate REVIEW; externos pendentes |
| **Consolidado** | **88** | CERTIFIED WITH RESSALVAS |

---

## Riscos residuais (honestos)

| Risco | Impacto | Mitigação existente |
|-------|---------|---------------------|
| 34 PIX `approved` sem ledger | Legado estável U1–U4 | Runbook · não P0 |
| `payout_confirmado` = 0 | Transparência modelo | Documentado V1.1E |
| Monitoramento externo não ativo | Detecção tardia | Plano V1.5D · dry-run OK |
| Sem stress test | Escala não provada | Roadmap V2 |
| UX PIX sem polling | Confiança usuário | V1.R planejado |
| Gate pré-deploy REVIEW | Disciplina humana | Processo formal |

**Sem bloqueador P0** financeiro ou de segurança webhook na certificação V1.6.

---

## O que NÃO está coberto

- Teste de carga / stress em escala massiva  
- Pen test externo formal  
- SLA comercial 99.9%+  
- Alertas Slack/PagerDuty **live**  
- Automação CI **bloqueante** em `main` (apenas examples)

---

## Roadmap (síntese)

| Horizonte | Iniciativa |
|-----------|------------|
| **Imediato (V1.R)** | Polling PIX, onboarding, confiança UX, FTU |
| **Curto prazo** | Ativar monitoramento externo (checklist V1.5D) |
| **Médio prazo** | CI gate real; redução backlog U1–U4 controlada |
| **Estratégico (V2)** | Engine multi-game, contract tests, capacity planning |

Detalhe: `docs/audits/V1-X1-PRODUCT-IMPROVEMENT-ROADMAP.md` · `docs/executive/final-delivery/01-EXECUTIVE/GOLDEOURO-V1-MASTER-HANDBOOK.md` (§10–11).

---

## Respostas para investidor (30 segundos cada)

| Pergunta | Resposta |
|----------|----------|
| Está em produção? | **Sim** — domínio e API live |
| Está certificado? | **Sim — com ressalvas** (88/100) |
| É seguro financeiramente? | **Indicadores P0 OK**; backlog legado documentado |
| Dá para escalar amanhã? | **Crescimento controlado sim**; escala massiva **não provada** |
| Vale investir? | **Com transparência** — ativo operacional e auditável; riscos de setor e produto explícitos |

---

## Veredito final

| Campo | Valor |
|-------|-------|
| **Certificação** | CERTIFIED WITH RESSALVAS |
| **Operacional** | PASS COM RESSALVAS |
| **NO-GO** | Não aplicável (sem P0) |
| **Captação** | Adequada com due diligence e este pacote |
| **Expansão** | Controlada — respeitar baseline e gates |

A V1 é **apta para operação contínua, demonstração institucional e expansão controlada**. Não deve ser apresentada como plataforma **enterprise scale-tested**.

---

## Próximos passos recomendados

1. Ler o [Master Handbook](GOLDEOURO-V1-MASTER-HANDBOOK.md) para profundidade institucional.  
2. Usar o [Índice oficial de entrega](V1-OFFICIAL-DELIVERY-INDEX.md) para due diligence por área.  
3. Demo ao vivo: `docs/executive/final-delivery/04-DEMO/` (checklist + contingency).  
4. Q&A preparado: `docs/executive/final-delivery/08-QA/V1-EXECUTIVE-QA.md`.

---

```
┌─────────────────────────────────────────────────────────────┐
│  GOL DE OURO V1 — RESUMO EXECUTIVO                         │
│  CERTIFIED WITH RESSALVAS · 88/100 · GOVERNED              │
│  Baseline: a83c3cf · Fly v461                              │
│  2026-05-19                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento para distribuição rápida. Versão completa: GOLDEOURO-V1-MASTER-HANDBOOK.md.*
