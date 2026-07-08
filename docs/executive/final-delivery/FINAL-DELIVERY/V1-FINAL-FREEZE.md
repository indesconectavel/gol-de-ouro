# V1 — Freeze final (baseline congelada)

**Documento:** V1-FINAL-FREEZE  
**Pacote:** V1.FINAL.F — FINAL DELIVERY ASSEMBLY  
**Data:** 2026-05-19  
**Status:** ATIVO até decisão formal pós-reunião

---

## Declaração de freeze

A linha **Gol de Ouro V1** está em **freeze operacional e documental** para entrega institucional. Nenhuma alteração em produção, banco, deploy ou código funcional deve ocorrer entre a montagem deste pacote e a reunião executiva (e, salvo gate formal, após a reunião).

Este freeze **não bloqueia** correções de incidente P0 documentadas em runbook — mas **exclui** deploys de conveniência, “ajustes rápidos” ou escopo novo.

---

## Baseline congelada

| Item | Valor oficial |
|------|----------------|
| **Versão** | V1 (entrega final institucional) |
| **Runtime SHA (git)** | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` |
| **Fly release** | v461 |
| **Player bundle** | `index-B6M2smS9.js` |
| **Score operacional** | 88/100 |
| **Certificação** | CERTIFIED WITH RESSALVAS |
| **Maturidade** | Semi-autonomous |
| **Classificação** | GOVERNED |

**Verificação (read-only):**

- `GET /health` — serviço respondendo
- `GET /meta` — `gitCommit` e bundle alinhados à tabela acima
- Webhook sem assinatura válida — **401** esperado (superfície endurecida)

---

## Runtime oficial

- **Backend:** Fly.io `goldeouro-backend-v2` (release v461)
- **Player:** bundle `index-B6M2smS9.js` em domínios de produção documentados no dossiê técnico
- **Financeiro:** RPC PIX/ledger e webhooks conforme relatórios V1.1B–V1.1G (sem novo apply neste freeze)

Referência técnica: [../../V1-FINAL-TECHNICAL-DOSSIER.md](../../V1-FINAL-TECHNICAL-DOSSIER.md)

---

## Estado operacional (resumo)

| Dimensão | Estado |
|----------|--------|
| Ledger / PIX | Certificado com ressalvas documentadas (V1.1G, V1.X2) |
| Webhooks / payout | Hardening V1.1F aplicado; evidências em relatórios |
| Observabilidade | V1.2A–V1.2E; verificação contínua documentada |
| Governança | GOVERNED; gates de ativação V1.5A+ |
| Certificação produção | V1.6 (2026-05-19) |

Veredito operacional: [../../V1-FINAL-OPERATIONAL-VERDICT.md](../../V1-FINAL-OPERATIONAL-VERDICT.md)

---

## Riscos residuais (transparência na reunião)

1. **Score 88/100** — certificação com ressalvas; itens residuais listados em V1.6 e roadmap V1.1+.
2. **Maturidade semi-autônoma** — monitoramento e runbooks existem; automação plena é evolução pós-V1.
3. **Dependência de rede na demo** — mitigar com `10-BACKUPS` e `12-VIDEOS`.
4. **Escopo pós-V1** — Engine V2, novos jogos e expansão **não** fazem parte desta entrega; apenas roadmap.

Não minimizar ressalvas na apresentação — elas estão documentadas e fazem parte da governança GOVERNED.

---

## Regras obrigatórias antes (e durante) a reunião

| Regra | Motivo |
|-------|--------|
| **Não deployar** | Preservar SHA/bundle certificados |
| **Não alterar runtime** | Evitar drift vs. `/meta` e certificação |
| **Não alterar financeiro** | Ledger/PIX fora de gate formal |
| **Não abrir escopo** | V1 fechada; melhorias → roadmap |
| **Não improvisar** | Seguir `04-DEMO` e checklist |

---

## O que este freeze não alterou

- Produção em execução (mesmo release v461)
- Banco de dados (sem patches SQL nesta montagem)
- Pipelines de deploy / CI
- Código funcional da aplicação

Apenas a **estrutura documental** em `FINAL-DELIVERY/` foi criada para a entrega executiva.

---

## Descongelamento

Somente após:

1. Ata ou decisão formal da reunião;
2. Gate documentado (ex.: V1.5A pré-deploy, rollback checklist);
3. Novo relatório de certificação se houver mudança de runtime.

Até lá: [FINAL-DELIVERY-CHECKLIST.md](FINAL-DELIVERY-CHECKLIST.md) é a lista de controle.
