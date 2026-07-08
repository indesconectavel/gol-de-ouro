# GOL DE OURO V1 — Presentation Rehearsal Flow

**Documento:** roteiro executivo de ensaio e reunião oficial  
**Duração total:** **45–55 minutos**  
**Demo live (núcleo):** **18–22 minutos**  
**Tom:** institucional, transparente, orientado a valor — não palestra de engenharia  
**Modo:** somente documentação — sem alteração de produção, banco, deploy ou código funcional

**Baseline:** `a83c3cf` · Fly v461 · bundle `index-B6M2smS9.js` · certificação **88/100** (CERTIFIED WITH RESSALVAS)

**Companheiros:** [V1-DEMO-ENVIRONMENT-CHECKLIST.md](V1-DEMO-ENVIRONMENT-CHECKLIST.md) · [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) · [V1-DEMO-RUNTIME-VALIDATION.md](V1-DEMO-RUNTIME-VALIDATION.md)

---

## Mapa temporal consolidado

| Bloco | Tempo ideal | Acumulado | Risco |
|-------|------------:|----------:|:-----:|
| 1. Introdução | 3 min | 3 | 🟢 |
| 2. Problema e oportunidade | 7 min | 10 | 🟢 |
| 3. Demonstração do produto | 18 min | 28 | 🟡 |
| 4. Segurança e financeiro | 8 min | 36 | 🟡 |
| 5. Governança operacional | 5 min | 41 | 🟢 |
| 6. Estado atual da V1 | 4 min | 45 | 🟢 |
| 7. V1.R (refinamentos) | 3 min | 48 | 🟢 |
| 8. V2 (visão) | 3 min | 51 | 🟢 |
| 9. Captação | 2 min | 53 | 🟢 |
| 10. Perguntas | 5–10 min | 55 | 🟡 |

---

## 1. Introdução

**Tempo ideal:** 3 min · **Risco:** 🟢 · **Observações:** abrir com autoridade calma; não pedir desculpas pelo veredito “com ressalvas”.

**Objetivo da reunião**

> Apresentar a **V1 encerrada e certificada** do Gol de Ouro: penáltis com dinheiro real, PIX e operação em produção, com baseline congelada, governança documentada e score operacional **88 sobre 100**.

**Mostrar:** slide título · data · classificação **CERTIFIED WITH RESSALVAS** · URLs oficiais.

**Evitar:** começar por SQL, ledger ou arquitetura em detalhe.

---

## 2. Problema e oportunidade

**Tempo ideal:** 7 min · **Risco:** 🟢 · **Observações:** focar na dor do usuário brasileiro; não atacar concorrentes pelo nome.

### Mercado

> O casual gaming com dinheiro real exige **confiança no dinheiro** tanto quanto diversão no jogo. O mercado perde usuários quando o depósito não aparece ou o saque gera medo.

### Gamificação

> Penáltis de baixo ticket (ex.: R$ 1), feedback imediato, emoção de gol — mecânica simples e repetível.

### Retenção

> Retenção depende de **transparência financeira** (saldo claro, histórico PIX) e experiência fluida pós-depósito.

### Plataforma

> PWA premium + backend rastreável + painel admin — stack cloud-native (Vercel, Fly, Supabase, Mercado Pago).

| Dor | Como a V1 responde |
|-----|-------------------|
| PIX opaco | Webhook HMAC + RPC idempotente |
| Medo de saque | Rollback documentado; taxa explícita |
| Falta de seriedade | Certificação, runbooks, baseline SHA |

---

## 3. Demonstração do produto

**Tempo ideal:** 18 min · **Risco:** 🟡 · **Observações:** núcleo emocional da reunião; cronômetro visível; gameplay ≤ 5 min.

| Passo | Ação | Tempo |
|-------|------|------:|
| **Login** | Conta demo; dashboard com saldo visível | 2 min |
| **Dashboard** | Saldo, histórico, navegação principal | 2 min |
| **Gameplay** | `/game` — **obrigatório 1 gol**; +1 chute opcional | 5 min |
| **Gol** | Pausar 2s no feedback (som/overlay) | incluído |
| **Histórico** | PIX `approved` no histórico (preferir pré-existente) | 4 min |
| **Admin** | Dashboard, financeiro, saques — **read-only** | 5 min |

**Narrativa de abertura da demo:**
> “Aqui está o produto que o usuário paga para jogar — não um mockup.”

**PIX ao vivo:** opcional; preferir histórico `approved` + narrativa RPC. Se live: valor baixo (ex. R$ 5), timer 60s, plano B no [contingency](V1-DEMO-CONTINGENCY-PLAN.md).

**Evitar:** partida longa; sequência de derrotas; saque submetido; stress no servidor.

---

## 4. Segurança e financeiro

**Tempo ideal:** 8 min · **Risco:** 🟡 · **Observações:** “wow” técnico controlado; honestidade sobre legado.

| Tópico | Mensagem executiva |
|--------|-------------------|
| **Ledger** | Fonte de verdade contábil; `correlation_id` + `tipo`; **0 duplicatas** em produção |
| **HMAC** | Webhook sem assinatura válida → **401** — corpo não processado |
| **401** | Demonstrar ao vivo (curl ou terminal pré-configurado) — 2 min máx. |
| **Runtime** | `/meta` + `/health` — SHA e dependências verificáveis |
| **Certificação** | 88/100, GOVERNED, baseline congelada |

**Frase de honestidade (30s):**
> “Existem **34 PIX aprovados** anteriores ao ledger unificado de maio — estáveis, monitorados, runbook U1–U4. Não é perda ativa nem double-credit.”

**Evitar:** “zero risco”; omitir backlog legado; abrir Supabase na sala.

---

## 5. Governança operacional

**Tempo ideal:** 5 min · **Risco:** 🟢 · **Observações:** posicionar maturidade como força, não burocracia.

| Pilar | O que comunicar |
|-------|-----------------|
| **Auditorias** | Programa V1.1A → V1.6; relatórios forenses e financeiros |
| **Runbooks** | Incidentes PIX, payout, rollback — resposta documentada |
| **Observabilidade** | Health, meta, verificação contínua (output pré-gerado se terminal) |
| **Freeze** | Baseline congelada por SHA; mudanças exigem gate |
| **Gates** | Pré-deploy, certificação, activation gate — humano no loop |

**Narrativa:**
> “Não operamos no improviso: cada release rastreável; cada risco conhecido documentado.”

---

## 6. Estado atual da V1

**Tempo ideal:** 4 min · **Risco:** 🟢 · **Observações:** fechar ciclo “entrega real” antes de roadmap.

| Indicador | Valor / postura |
|-----------|-----------------|
| **Score** | **88/100** — CERTIFIED WITH RESSALVAS |
| **Baseline** | `a83c3cf` · Fly v461 · bundle certificado |
| **Governança** | Classificação **GOVERNED**; maturidade **semi-autonomous** |
| **Riscos** | Legado 34 PIX; `payout_confirmado` histórico = 0; sem P0 ativo |

**Distinção importante:**
> “Certificado e em produção ≠ testado para dezenas de milhões de usuários. Significa **abertura controlada** com evidências auditáveis.”

---

## 7. V1.R (refinamentos pós-baseline)

**Tempo ideal:** 3 min · **Risco:** 🟢 · **Observações:** roadmap de produto, não compromisso de data sem owner.

| Refinamento | Benefício |
|-------------|-----------|
| **Polling PIX** | Saldo atualiza na UI sem depender só de F5 pós-webhook |
| **Onboarding** | Primeiro depósito e primeiro chute guiados — menos abandono |
| **Confiança UX** | Histórico, estados claros, mensagens pós-pagamento |
| **Retenção** | Loops de retorno (notificações, metas leves) sem alterar core financeiro |

**Narrativa:**
> “A V1 entrega o núcleo seguro; a V1.R melhora **percepção e retenção** sem reabrir o ledger.”

---

## 8. V2

**Tempo ideal:** 3 min · **Risco:** 🟢 · **Observações:** visão; herda gates e SHA.

| Eixo | Direção |
|------|---------|
| **Engine** | Motor de jogo reutilizável; menor acoplamento ao penálti único |
| **Novos jogos** | Expansão de catálogo sobre mesma base financeira |
| **Expansão** | Escala de usuários com stress test e alertas externos (plano V1.5+) |

**Evitar:** prometer datas ou features sem priorização formal.

---

## 9. Captação

**Tempo ideal:** 2 min · **Risco:** 🟢 · **Observações:** só se a sala for investidores; sem valuation improvisada.

| Tema | Mensagem |
|------|----------|
| **Visão** | Ser referência em casual gaming com PIX nativo e operação auditável no Brasil |
| **Crescimento** | Abertura controlada → métricas reais → campanha gradual |
| **Expansão controlada** | Investimento em UX pós-PIX, observabilidade externa e capacidade — não “viralizar antes da confiança” |

**Narrativa:**
> “Buscamos parceiros que valorizem **transparência operacional** — já entregamos produção certificada, não slide deck.”

---

## 10. Perguntas

**Tempo ideal:** 5–10 min · **Risco:** 🟡 · **Observações:** respostas curtas; encaminhar detalhe para pacote pós-call.

### Como responder

| Princípio | Aplicação |
|-----------|-----------|
| **Objetivamente** | Número, SHA, relatório — não adjetivo vago |
| **Sem improviso** | Se não souber: “envio o relatório em 24h” |
| **Sem exagero** | Não prometer escala, legalidade absoluta ou “zero risco” |

### Perguntas prováveis (resposta em uma linha)

| Pergunta | Resposta |
|----------|----------|
| É legal? | Modelo +18 e termos; assessoria jurídica conforme estratégia da empresa |
| 34 PIX? | Legado pré-ledger unificado; estável; runbook U1–U4 |
| Escala? | Arquitetura cloud-native; stress test como marco V2 |
| Por que ressalvas? | Honestidade auditável; nenhum P0 ativo |
| Quando marketing massivo? | Após abertura controlada e melhoria UX pós-depósito |

**Plano B de Q&A:** co-apresentador com [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) e [../08-QA/V1-EXECUTIVE-QA.md](../08-QA/V1-EXECUTIVE-QA.md).

---

## Ordem ideal vs ordem a evitar

| ✅ Ideal | ❌ Evitar |
|---------|----------|
| Emoção (gol) → dinheiro → governança | Ledger SQL nos primeiros 10 min |
| 401 webhook como prova técnica breve | 20 min de arquitetura |
| Certificação após contexto de produto | Certificação no minuto 1 sem demo |
| Honestidade sobre legado | Esconder 34 PIX ou payout histórico |

---

## Checklist do apresentador (1 página)

- [ ] Sei a frase dos **34 PIX**
- [ ] Sei que **não** faço saque live
- [ ] Tenho **conta reserva** e vídeo backup
- [ ] Tenho **PDF certificação** offline
- [ ] Co-apresentador conhece **plano B** de rede
- [ ] Cronômetro: gameplay **≤ 5 min**
- [ ] Validei **SHA** em `/meta` no T-2h

---

## Confirmação de escopo

Este roteiro é documentação operacional da reunião. **Não altera** produção, banco, deploy nem código funcional.
