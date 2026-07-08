# GOL DE OURO V1 — EXECUTIVE Q&A & INVESTOR DEFENSE PACKAGE

**Documento:** pacote de perguntas e respostas para reuniões institucionais  
**Público:** sócios, investidores qualificados, C-level e due diligence  
**Data:** 2026-05-19  
**Modo:** somente documentação — **produção, banco, deploy e código funcional não foram alterados**

**Baseline oficial:** `a83c3cf` · Fly **v461** · bundle `index-B6M2smS9.js`  
**Referências:** [GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md](../../../certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md) · [V1-FINAL-OPERATIONAL-VERDICT.md](../../V1-FINAL-OPERATIONAL-VERDICT.md) · [README executivo](../../README.md)

---

# 1. Objetivo

Este documento centraliza **respostas executivas, técnicas, operacionais e estratégicas** preparadas para reuniões com sócios e investidores do projeto **Gol de Ouro V1**.

Ele não substitui relatórios de auditoria nem runbooks operacionais; funciona como **roteiro de defesa institucional** — objetivo, verificável e alinhado à baseline certificada. O objetivo é permitir tomada de decisão informada, sem improviso e sem promessas fora do que foi auditado e documentado.

**Como usar:** leia as seções 2–8 antes da reunião; use as seções 9–11 para postura e narrativa; encerre com o veredito da seção 12.

---

# 2. Estado atual do projeto

| Pergunta | Resposta executiva |
|----------|-------------------|
| **A V1 está pronta?** | **Sim, como baseline oficial encerrada** (2026-05-19), com programa V1.1A → V1.6 concluído e pacote V1.FINAL emitido. “Pronta” significa **certificada e governada**, não “perfeita” nem “enterprise-scale”. |
| **O sistema está online?** | **Sim.** API em `https://goldeouro-backend-v2.fly.dev`; player em `https://www.goldeouro.lol`; admin em `https://admin.goldeouro.lol`. |
| **O sistema está operacional?** | **Sim.** `/health` reporta serviço e conectividade (DB, Mercado Pago). Fluxos de depósito, jogo e saque estão em produção real com volume moderado documentado. |
| **O sistema está certificado?** | **Sim — CERTIFIED WITH RESSALVAS.** Score consolidado **88/100** (V1.6). Sem bloqueador P0 financeiro ou de segurança webhook. |
| **Qual a maturidade atual?** | **Semi-autonomous** — automação, scripts e gates documentados; monitoramento externo em produção e CI bloqueante ainda **não ativados** (plano e dry-run existem). |
| **Qual o score operacional?** | **88/100** — runtime/deploy e governança em patamar alto; integridade financeira e readiness de ativação com pontos de melhoria documentados. |
| **Qual a baseline oficial?** | Commit **`a83c3cffcc998ed3d1bd8d2e88619a9b03afb634`** (`a83c3cf`) · Fly release **v461** · classificação **GOVERNED**. Validação: `GET /meta` → `gitCommit` deve coincidir. |

**Síntese em uma frase:** a V1 é uma plataforma **online, operacional, certificada com ressalvas conhecidas e governada**, apta a evolução controlada — não a escala massiva imediata sem fases adicionais.

---

# 3. Perguntas técnicas

## Como o sistema evita double-credit?

O crédito de depósito PIX passa pela RPC PostgreSQL **`claim_and_credit_approved_pix_deposit`**, hardened na missão V1.1B: transação atômica, **`ON CONFLICT (correlation_id, tipo)`** no ledger e ramo de self-heal que **não** credita saldo duas vezes. Novos pagamentos `approved` só entram no fluxo idempotente; o backlog legado (34 casos) **não** é auto-creditado por design (runbook U1–U4). Evidência: **0 duplicatas** `(correlation_id, tipo)` em produção (V1.1A, V1.1G, V1.6).

## Como funciona o ledger financeiro?

O **`ledger_financeiro`** é a fonte de verdade contábil: cada movimento tem `tipo` (`deposito`, `saque`, `rollback`, `falha_payout`, etc.) e `correlation_id` (payment_id, saque_id). Índice único em `(correlation_id, tipo)` impede duplicata. Saldo do usuário é derivado/atualizado em conjunto com regras de negócio e RPCs — auditoria V1.1A mapeou o modelo completo.

## Como funciona o PIX?

1. Jogador solicita depósito no player → backend cria cobrança **Mercado Pago**.  
2. Usuário paga via PIX.  
3. MP envia webhook → backend valida **HMAC** → chama RPC de crédito se `approved`.  
4. Reconcile trata casos `pending` em ciclo controlado (V1.1D) — **não** faz backfill automático do backlog `approved` sem ledger.

## Como funcionam os webhooks?

Dois endpoints principais: **`/api/payments/webhook`** (depósito) e **`/webhooks/mercadopago`** (payout). Ambos exigem assinatura válida do Mercado Pago. Sem assinatura → **HTTP 401** — corpo não é processado (hardening V1.1F, verificado live em v461). Isso fecha o vetor de crédito/saque forjado via HTTP público.

## Como o sistema evita replay/fraude?

- **HMAC** nos webhooks (integridade e autenticidade da origem MP).  
- **Idempotência** no ledger e nas APIs críticas (ex.: chute com `X-Idempotency-Key`).  
- **401** antes de qualquer efeito colateral em webhook inválido.  
- Rate limiting e auth JWT nas rotas de usuário (detalhes no dossiê técnico V1.FINAL).

## Como funciona rollback?

Em falha de payout, o sistema registra **`falha_payout`** e **`rollback`** no ledger, restaurando coerência de saldo conforme lógica documentada em V1.1E. Há histórico legado de saques (22 registros) com inconsistências pré-modelo atual — **mitigado** por fila vazia atual e HMAC payout; não é drift ativo em novos fluxos.

## Como funciona o payout?

Usuário solicita saque → reserva de saldo / registro `saques` → **worker** processa fila → MP executa transferência → webhook confirma ou falha → ledger atualizado. **`payout_confirmado` histórico = 0** em produção (modelo documentado; HMAC validado; falta evidência de evento MP real recente em escala — ressalva V1.1G).

## Como funciona o backend?

Node.js em **Fly.io** (`goldeouro-backend-v2`), release **v461**, SHA **`a83c3cf`**. Camadas: rotas REST, controllers, middlewares (auth, rate limit), integração Supabase e MP, workers de payout/reconcile. Endpoints de prova: **`/meta`** (versão deploy), **`/health`** (liveness + dependências).

## Como funciona o banco?

**Supabase (PostgreSQL)** — projeto prod documentado nas auditorias. Auth Supabase + JWT no backend; **RLS** em tabelas sensíveis. Tabelas críticas: `usuarios`, `pagamentos_pix`, `ledger_financeiro`, `saques`. RPCs no SQL (patches versionados em `database/patches/`). **Nenhum DDL foi aplicado** na emissão deste pacote executivo.

## O sistema possui auditoria?

**Sim.** Programa formal **V1.1A → V1.6** mais auditoria suprema **V1.FINAL** e trilhas **V1.X1–X3** (produto/demo). Relatórios em `docs/relatorios/`, certificação em `docs/certification/`, auditorias de jornada em `docs/audits/`.

## Existe observabilidade?

**Sim, em camada documentada e scriptável:** V1.2A (saúde financeira runtime), V1.2B (alertas read-only), V1.2C (drift deploy), V1.2E (verificação contínua), snapshots JSON consolidados. **Alertas externos reais** (Slack/Discord/PagerDuty) permanecem em **plano + dry-run** (V1.5C/V1.5D) — não ativos em produção.

## Existe certificação?

**Sim.** Certificado oficial: **CERTIFIED WITH RESSALVAS**, score **88/100**, missão final **V1.6** (2026-05-19). Script reprodutível: `node scripts/certification/v1-6-operational-production-certification.js`.

## O runtime é verificável?

**Sim.** `GET https://goldeouro-backend-v2.fly.dev/meta` expõe `gitCommit` — deve ser **`a83c3cf…`**. Fly release **v461** e bundle player **`index-B6M2smS9.js`** cruzam a baseline de três camadas (API, Fly, front).

## Existe freeze operacional?

**Sim, por política de baseline:** alterações em produção que divergem do SHA certificado **invalidam** a certificação até novo ciclo formal. Documento: `docs/certification/V1-BASELINE-CERTIFIED.md`.

## Existe controle de deploy?

**Sim.** Gate pré-deploy **V1.5A** (`pre-deploy-gate.js`) — estado atual **REVIEW** (aprovação humana obrigatória). Exemplos CI em `.github/examples/` (não bloqueante em `main` hoje). Deploy V1.1F documentado com run e rollback referenciados.

---

# 4. Perguntas financeiras

## O dinheiro fica onde?

Saldo do jogador na plataforma (**conta interna** em `usuarios`), movimentações rastreadas no **`ledger_financeiro`**. Depósitos e saques transitam pelo **Mercado Pago** (PIX). A plataforma não substitui instituição financeira — opera como produto de entretenimento com dinheiro real integrado via PSP.

## Como o usuário deposita?

Player → `/pagamentos` → valor preset → QR/copia-e-cola PIX MP → pagamento → webhook → RPC credita (se `approved`). Instruções em 4 passos na UI (auditoria V1.X1).

## Como o usuário recebe?

Player → `/withdraw` → dados PIX → solicitação → worker + MP → webhook de confirmação/falha. Taxa e mínimo documentados (ex.: mínimo R$ 10, taxa R$ 2 — validar copy na demo).

## Existe risco financeiro?

**Sim, como em qualquer produto com saldo real** — mitigado por ledger, idempotência, HMAC e governança. Riscos **residuais aceitos** estão na certificação oficial (backlog legado, payout histórico, monitoramento externo pendente). Não há P0 ativo (saldo negativo ou duplicata crítica).

## Existe saldo negativo?

**Não.** **0** utilizadores com saldo negativo em produção (V1.1G, V1.6).

## Existem duplicatas?

**Não** em chave crítica `(correlation_id, tipo)` no ledger. **0** duplicatas inbound documentadas.

## O sistema já foi auditado?

**Sim.** Auditoria ledger (V1.1A), PIX/RPC (V1.1B–C), webhooks (V1.1D), payout (V1.1E–F), certificação financeira pós-hardening (V1.1G), certificação operacional V1.6.

## O financeiro é seguro?

**Seguro para continuidade controlada da V1**, com ressalvas explícitas. Fluxos **novos** passam por RPC hardened e webhooks com HMAC. O que não é “zerado” é **dívida histórica documentada**, não falha silenciosa em produção atual.

## Existem riscos residuais?

**Sim**, declarados formalmente:

1. 34 PIX `approved` sem ledger (legado).  
2. Zero `payout_confirmado` histórico no ledger.  
3. Monitoramento externo não ativado.  
4. Gate pré-deploy em REVIEW.  
5. Validação operacional de heartbeat do worker via logs Fly.

## Existe backlog legado?

**Sim.** Documentado, estável, com runbook (`docs/runbooks/financeiro/RUNBOOK-approved-sem-ledger.md`) e casos U1–U4 fora de auto-heal de saldo.

## Por que existem 34 approved sem ledger?

São pagamentos **anteriores ao modelo hardened atual** (e padrões U1–U4): aprovados em `pagamentos_pix` sem linha `deposito` correspondente no ledger. O patch V1.1B **não** credita saldo retroativamente em massa — política consciente para evitar double-credit e disputas. Contagem live na certificação V1.1G: 42 approved, 8 deposito, **34 gap**.

## Isso compromete os fluxos atuais?

**Não os fluxos novos hardened.** Compromete apenas a **narrativa de “ledger 100% alinhado desde o dia zero”** e exige transparência com investidores. Janela recente: **0** novos `approved` sem tratamento em 72h na última certificação financeira — backlog **não crescente** na janela medida. Fluxo atual: webhook → RPC → idempotência.

---

# 5. Perguntas de produto

## Como funciona o jogo?

Jogo de **penáltis** (`GameFinal`): aposta **R$ 1** por chute, 5 zonas de direção, resultado **server-side** via `POST /api/games/shoot` com idempotência. Feedback rico (gol, defesa, gol de ouro após sequência de chutes).

## Como funciona a fila?

Na rota principal **`/game` não há fila** — entrada imediata (positivo para casual). API de fila existe como legado/futuro multiplayer; **não integrada** na UX principal (V1.X1).

## Como funciona o gol?

Usuário escolhe zona → backend determina resultado → animação e som alinhados → saldo atualizado em caso de prêmio. **Gol de ouro** é mecânica de pico emocional após contador de chutes.

## Como o usuário ganha?

Prêmios por acerto (incl. overlays de ganhos maiores e gol de ouro conforme regras de sessão). RTP/probabilidade **não exibidos** na UI — ressalva de percepção de justiça (V1.X1).

## Qual o diferencial?

Gameplay emocional forte + **dinheiro real** + PIX brasileiro + stack já em produção certificada. Identidade visual premium (glassmorphism, estádio) vs. concorrentes amadores.

## Existe potencial de retenção?

**Sim, técnico e de loop** (chutes rápidos, gol de ouro). **Retenção de produto ainda em refinamento** — falta onboarding educativo, polling pós-PIX e validação em massa de FTU.

## O produto já foi validado em massa?

**Não.** Auditoria V1.X1 por jornada e código — **não** por teste com centenas de usuários reais nem eye-tracking. Plataforma operacional certificada ≠ produto validado em escala de mercado.

## Qual o maior risco UX hoje?

**Ansiedade pós-pagamento PIX:** não há polling automático nem botão “Já paguei” — `consultarStatusPagamento` existe no código mas **não é chamada** na UI. Usuário depende de webhook assíncrono e voltar ao dashboard. Segundo risco: fricção de taxa/mínimo de saque e ausência de transparência de odds.

---

# 6. Perguntas de operação

## Existe monitoramento?

**Sim** — scripts read-only, relatórios V1.2, snapshots consolidados (`docs/operational/snapshots/`). Monitoramento **externo 24/7 em produção**: plano V1.5D, **não ativado**; dry-run V1.5C concluído.

## Existe alertas?

**Sim, definidos** (matriz P0–P3, V1.2B). Roteamento real para Slack/Discord/email: **preparado, não ligado** em produção.

## Existe runbook?

**Sim.** 17+ runbooks em `docs/runbooks/` (financeiro, runtime, segurança, workers) + fluxo de incidente V1.2D.

## Existe plano de contingência?

**Sim.** Classificação de incidentes, templates operacionais (`docs/operational/templates/`), runbooks de rollback e drift, plano de monitoramento externo controlado.

## Existe rollback?

**Sim, documentado** — rollback de deploy Fly e lógica de rollback financeiro em falha de payout. Procedimentos em relatórios V1.1F e runbooks runtime.

## Existe backup?

**Snapshots SQL documentais** de funções críticas em `docs/relatorios/snapshots/`; backups de infraestrutura seguem política Supabase/Fly (não alterada neste pacote). Pasta **10-BACKUPS** do pacote final-delivery referencia artefatos aprovados.

## Existe freeze?

**Sim** — baseline congelada; deploy fora do SHA exige novo ciclo de certificação.

## Existe governança?

**Sim — GOVERNED.** V1.3 (governança autônoma), V1.4 (resiliência externa), V1.5 (ativação + gates), V1.6 (certificação produção). Modelos em `docs/governance/`, `docs/autonomous/`, `docs/reliability/`.

**Mapa rápido de fases citadas:**

| Fase | Foco |
|------|------|
| **V1.2** | Observabilidade, alertas, drift, runbooks, verificação contínua |
| **V1.3** | Governança operacional autônoma |
| **V1.4** | Operações externas e certificação de canais |
| **V1.5** | Gates pré-deploy, CI exemplos, alertas dry-run, plano monitoramento |
| **Certification** | V1.6 + GOLDEOURO-V1-OFFICIAL-CERTIFICATION |

---

# 7. Perguntas estratégicas

## O projeto escala?

**Arquitetura cloud-native permite escala progressiva** (Fly, Supabase, workers). **Escala massiva não foi validada** — sem stress test documentado. Recomendação: crescimento por fases com gates e métricas.

## A arquitetura suporta novos jogos?

**Parcialmente hoje; plenamente na visão V2.** Backend modular em rotas/controllers; jogo atual acoplado ao modelo penáltis. **Engine V2** prevê modularização e filas nativas.

## O Gol de Ouro pode virar plataforma?

**Sim, como direção estratégica** — V1 entrega um produto completo (PIX + ledger + jogo + admin). V2 transforma baseline certificada em **plataforma de engine**, não reescrita do zero.

## Existe visão de Engine V2?

**Sim.** Herda baseline `a83c3cf`, RPC/ledger como contrato, gates V1.5A+, observabilidade nativa, possível fila competitiva com UX dedicada. Documentado em certificação e roadmap executivo.

## Existe potencial de captação?

**Sim, com transparência.** Narrativa forte: produção real, certificação 88/100, HMAC live, governança. Investidor deve ver ressalvas e roadmap — não apenas score.

## Qual o modelo de expansão?

1. Abertura / tráfego **controlado** na baseline V1.  
2. Fechar dívida residual (backlog ledger, monitoramento externo, CI gate).  
3. **Engine V2** para novos jogos e escala.  
4. Validação de produto (V1.X1 → melhorias UX).

## Qual o potencial comercial?

Produto **monetizável** (depósito → jogo → saque) já em produção. Nicho casual apostado + PIX BR. Potencial depende de aquisição, retenção refinada e compliance de mercado — não só de engenharia.

## Qual o objetivo da V2?

Modularizar engine de jogo, melhorar observabilidade e filas, reduzir dívida operacional (monitoramento real, stress tests), expandir catálogo de jogos mantendo **integridade financeira** herdada da V1.

---

# 8. Perguntas críticas/difíceis

## O projeto está pronto para milhões de usuários?

**Não ainda.** A V1 está pronta para **operação real controlada** e evolução incremental. Milhões exigem stress tests, CDN/edge, filas, observabilidade externa ativa, equipe de plantão e validação de produto em massa — itens no roadmap, não concluídos.

## O sistema já foi stress-tested?

**Não de forma documentada nesta V1.** Há simulações de resiliência (engines V1.5) e probes read-only; **não** há relatório de carga com N usuários concorrentes em produção.

## Existe risco jurídico?

**Existe risco inerente** a produtos de entretenimento com dinheiro real no Brasil (+18, termos, PSP). A plataforma implementa cadastro com termos e maioridade; **não substitui assessoria jurídica regulatória** (apostas, jogos, LGPD, KYC conforme escala). Postura institucional: **conformidade em evolução** com assessoria especializada antes de escala agressiva.

## Existe risco operacional?

**Sim, controlado.** Riscos residuais listados na certificação; mitigação por runbooks, gates e baseline. Classificação **GOVERNED** — não “zero risco operacional”.

## O sistema é perfeito?

**Não.** Score 88/100 e **CERTIFIED WITH RESSALVAS** expressam maturidade honesta: excelente em runtime, segurança webhook e governança; pontos abertos em legado ledger, monitoramento externo e validação de escala.

## O que ainda falta?

| Item | Descrição |
|------|-----------|
| **V1.R (residual)** | Pacote pós-certificação: zerar ou tratar backlog 34 approved, ativar monitoramento, provar payout MP E2E, alinhar drift repo local |
| **Monitoramento externo real** | Plano V1.5D pronto; canais não ligados |
| **Payout real em escala** | HMAC OK; histórico `payout_confirmado` = 0 |
| **UX refinements** | Polling pós-PIX, onboarding, transparência odds (V1.X1) |
| **Stress tests** | Carga e concorrência formal |
| **Ativação CI** | Gate bloqueante em `main` (hoje só exemplos) |
| **V2 / Engine V2** | Modularização e expansão de catálogo |

---

# 9. Como apresentar os riscos corretamente

1. **Não esconder** — citar upfront: 34 approved/ledger, monitoramento externo pendente, sem stress test.  
2. **Mostrar governança** — runbooks, gates, freeze de baseline, programa V1.1A–V1.6.  
3. **Mostrar controle** — 0 saldo negativo, 0 duplicata, 401 em webhooks forjados, SHA verificável em `/meta`.  
4. **Mostrar maturidade** — “CERTIFIED WITH RESSALVAS” não é falha; é **classificação honesta** superior a “tudo verde” sem evidência.

**Frase modelo:** *“Temos dívida legado estável e conhecida; fluxos novos são hardened; riscos estão no registro oficial da certificação.”*

---

# 10. Como responder perguntas sem improviso

| Regra | Ação |
|-------|------|
| **Objetividade** | Resposta em 2–4 frases; aprofundar só se pedirem evidência. |
| **Não inventar** | Se não está em relatório ou baseline, dizer “não documentado / fora do escopo V1”. |
| **Não prometer** | Evitar datas de escala, receita ou “zero bug” — usar “roadmap” e “fase controlada”. |
| **Usar baseline** | Sempre que questionarem produção: `a83c3cf`, Fly v461, `/meta`. |
| **Usar auditorias** | Referir V1.1G (financeiro), V1.6 (operacional), V1.X1 (produto), V1.FINAL (executivo). |
| **Separar domínios** | Plataforma certificada ≠ produto validado em massa ≠ pronto para milhões. |
| **Demonstração** | Preferir `/health`, `/meta`, admin read-only, jogo com conta de teste — não SQL nem .env. |

---

# 11. Narrativa recomendada para a reunião

**Abertura (2 min):**  
“O Gol de Ouro V1 é uma baseline **operacional, certificada e governada**, em produção real, com commit e release congelados e auditados de ponta a ponta.”

**Corpo (10 min):**  
1. **Produto** — jornada completa PIX → penáltis → saque; gameplay forte; UX com melhorias claras no roadmap.  
2. **Engenharia** — ledger + RPC idempotente + webhooks HMAC; programa V1.1A–V1.6.  
3. **Operação** — score 88/100, semi-autonomous, runbooks e gates; monitoramento externo na próxima ativação controlada.  
4. **Honestidade** — backlog legado de 34 casos estável; não bloqueia fluxos novos.

**Fechamento (2 min):**  
“A V1 não é o fim — é o **contrato técnico** para expansão: Engine V2, mais jogos e escala com o mesmo rigor de change control.”

**Tom:** institucional, confiante sem hype, dados verificáveis.

---

# 12. Veredito executivo final

| Pergunta | Veredito |
|----------|----------|
| **Pronto para reunião com sócios/investidores?** | **Sim** — com este pacote e transparência sobre ressalvas. |
| **Pronto para abertura controlada?** | **Sim** — tráfego moderado, baseline monitorada, gates humanos. |
| **Pronto para investidores?** | **Sim, com due diligence** — entregar certificação + este Q&A + riscos residuais. |
| **Pronto para expansão futura?** | **Sim, como baseline** — V2 e escala exigem fases adicionais documentadas. |

**Conclusão:**

A **V1** representa uma **baseline operacional certificada, hardened e governada**, apta para **evolução controlada e expansão futura** — não para promessa de perfeição nem escala instantânea sem investimento nas fases residuais e V2.

```
┌────────────────────────────────────────────────────────────┐
│  CERTIFICAÇÃO:     CERTIFIED WITH RESSALVAS                │
│  SCORE:            88 / 100                                │
│  MATURIDADE:       Semi-autonomous                         │
│  CLASSIFICAÇÃO:    GOVERNED                                │
│  BASELINE:         a83c3cf · Fly v461                      │
│  PRODUÇÃO ALTERADA NESTE DOCUMENTO:  NÃO                   │
└────────────────────────────────────────────────────────────┘
```

---

## Referências rápidas

| Documento | Caminho |
|-----------|---------|
| Certificação oficial | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| Baseline congelada | `docs/certification/V1-BASELINE-CERTIFIED.md` |
| Veredito operacional | `docs/executive/V1-FINAL-OPERATIONAL-VERDICT.md` |
| Dossiê técnico | `docs/executive/V1-FINAL-TECHNICAL-DOSSIER.md` |
| Auditoria jornada (V1.X1) | `docs/audits/V1-X1-REAL-USER-JOURNEY-AUDIT.md` |
| Índice executivo | `docs/executive/README.md` |

---

_Documento V1.FINAL — Executive Q&A — 2026-05-19. Somente documentação._
