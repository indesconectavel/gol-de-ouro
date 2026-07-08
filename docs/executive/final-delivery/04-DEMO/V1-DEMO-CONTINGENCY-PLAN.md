# GOL DE OURO V1 — Demo Contingency Plan

**Documento:** plano de contingência para reunião executiva oficial  
**Uso:** durante apresentação — falhas ao vivo ou perguntas difíceis  
**Modo:** read-only em produção · **não** aplicar fixes, deploy ou SQL na frente da sala  
**Tempo de reação alvo:** &lt; 30 segundos para trocar de trilha

**Companheiros:** [V1-DEMO-ENVIRONMENT-CHECKLIST.md](V1-DEMO-ENVIRONMENT-CHECKLIST.md) · [V1-DEMO-RUNTIME-VALIDATION.md](V1-DEMO-RUNTIME-VALIDATION.md) · [../08-QA/V1-EXECUTIVE-QA.md](../08-QA/V1-EXECUTIVE-QA.md)

**Confirmação:** este plano **não altera** produção, banco, deploy nem código funcional.

---

## Como usar

Para cada cenário: identifique **risco** e **impacto** → leia **resposta recomendada** → execute **plano B** → respeite **comportamento correto**.

---

## Cenários técnicos (falhas ao vivo)

### Player não abre

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Percepção de produto indisponível |
| **Impacto** | 🔴 Alto — núcleo da demo comprometido |
| **Resposta recomendada** | “O player está em produção para usuários reais; vamos validar o endpoint e usar o ambiente de backup preparado.” |
| **Plano B** | URL alternativa `app.goldeouro.lol` · segunda aba anônima pré-logada · vídeo 30–60s de gameplay gravado T-24h |
| **Comportamento correto** | F5 · limpar cache · trocar navegador; **não** alterar deploy ou Vercel ao vivo |

---

### Admin não abre

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Perda de credibilidade operacional |
| **Impacto** | 🟡 Médio — demo admin substituível por evidência |
| **Resposta recomendada** | “O painel admin está em produção; aqui está a visão consolidada desta manhã.” |
| **Plano B** | Screenshots T-24h (dashboard, financeiro, saques) · PDF certificação com métricas 0 neg / 0 dups |
| **Comportamento correto** | Refresh · logout/login; **não** resetar senha admin na sala; **não** mostrar stack trace |

---

### Internet cai

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Interrupção total da narrativa live |
| **Impacto** | 🔴 Crítico |
| **Resposta recomendada** | “A plataforma foi validada pelo SHA esta manhã; a rede local interrompeu o compartilhamento. Continuo com evidências offline.” |
| **Plano B** | Hotspot 4G · co-apresentador compartilha PDF + screenshots + vídeo gol · checar `/health` no celular (read-only) |
| **Comportamento correto** | Calma · não cancelar sem reagendar; **não** afirmar que produção caiu sem verificar health no 4G |

---

### PIX não atualiza

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Sala questiona se dinheiro é real |
| **Impacto** | 🔴 Alto |
| **Resposta recomendada** | “O Mercado Pago confirma em segundos; nosso backend credita **uma única vez** via RPC idempotente. Vou atualizar o saldo.” |
| **Plano B** | F5 no dashboard · aguardar **máx. 60s** com timer visível · abrir histórico PIX **approved** pré-existente: “Este é o fluxo validado ontem.” |
| **Comportamento correto** | **Não** repetir PIX · **não** culpar usuário · **não** abrir Supabase · **não** prometer “instantâneo na UI” sem polling V1.R |

---

### Dashboard demora

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Percepção de lentidão / instabilidade |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “O saldo é eventualmente consistente com o webhook; o histórico PIX mostra o crédito confirmado.” |
| **Plano B** | Mostrar histórico `/pagamentos` · narrar RPC · PDF relatório V1.2A |
| **Comportamento correto** | Uma espera com timer; pivotar em 60s; **não** múltiplos F5 agressivos |

---

### Gameplay falha

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Produto parece quebrado |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “O jogo está em produção na build certificada `index-B6M2smS9.js` — mostro o registro preparado.” |
| **Plano B** | Vídeo gol T-24h · conta reserva · F5 + landscape |
| **Comportamento correto** | **Não** trocar para rotas legadas sem teste; **não** debugar canvas na sala |

---

## Cenários de perguntas (sala)

### Pergunta jurídica

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Bloqueio regulatório percebido |
| **Impacto** | 🔴 Alto reputacional |
| **Resposta recomendada** | “Operamos com modelo documentado (+18, termos de uso). A estratégia jurídica específica é conduzida pela empresa; posso encaminhar material institucional após a reunião.” |
| **Plano B** | Não debater jurisprudência ao vivo; agendar call com assessoria se aplicável |
| **Comportamento correto** | Tom neutro; **não** afirmar “100% legal em todos os cenários” sem base documental |

---

### Pergunta financeira agressiva

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Perda de confiança do investidor |
| **Impacto** | 🔴 Alto |
| **Resposta recomendada** | “Temos certificação **88/100 com ressalvas conhecidas**, zero saldo negativo, zero duplicatas de ledger, webhooks que rejeitam requisições não assinadas, e backlog legado **documentado** — não escondido.” |
| **Plano B** | Enviar pacote V1-X2 + V1.1G + certificação oficial em 24h |
| **Comportamento correto** | Pausa 2s · tom calmo; **não** ficar na defensiva; **não** inventar números |

---

### Pergunta sobre 34 approved

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Parecer “dinheiro perdido” ou fraude |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “São **34 PIX aprovados** anteriores ao ledger unificado (maio/2026). Estáveis; **sem** duplicata; **sem** saldo negativo hoje; runbook U1–U4. Não é volume ativo nem double-credit.” |
| **Plano B** | Enviar relatório forense V1.1A / V1.1C pós-reunião |
| **Comportamento correto** | **Não** abrir grid Supabase ao vivo sem preparação; **não** minimizar como “bug irrelevante” |

---

### Pergunta sobre payout_confirmado = 0

| Campo | Conteúdo |
|-------|----------|
| **Risco** | “Saques não funcionam” |
| **Impacto** | 🟡 Médio-alto |
| **Resposta recomendada** | “O histórico de **`payout_confirmado` no ledger é zero** porque o modelo atual documenta saques via MP com eventos dominados por `falha_payout` e `rollback` no período auditado; o HMAC de payout está validado. A ressalva está na certificação — não é falha oculta.” |
| **Plano B** | Mostrar diagrama rollback V1.1E · form de saque **sem submeter** |
| **Comportamento correto** | **Não** prometer “milhares de saques processados”; **não** forçar saque live |

---

### Pergunta sobre escala

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Expectativa de crescimento imediato |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “A arquitetura é cloud-native e horizontalizável; a V1 foi certificada para **abertura controlada**. Stress test e alertas externos são marcos explícitos da V2, não promessas da V1.” |
| **Plano B** | Roadmap V2 + maturidade semi-autonomous |
| **Comportamento correto** | **Não** prometer “aguenta milhões hoje” |

---

### Pergunta sobre milhões de usuários

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Overcommit técnico |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “Milhões de usuários exigem fases: abertura controlada, métricas reais, stress financeiro, CDN/cache e observabilidade externa. A V1 prova **integridade e operação real** — a escala massiva é programa, não estado atual.” |
| **Plano B** | Relatório V1.6 + plano de activation gate |
| **Comportamento correto** | Separar **produto validado** de **capacidade de marketing massivo** |

---

### Pergunta sobre fraude

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Vetor de ataque mal compreendido |
| **Impacto** | 🟡 Médio |
| **Resposta recomendada** | “Webhook sem HMAC recebe **401** — atacante não credita via HTTP público. Ledger com idempotência `(correlation_id, tipo)`. Reconcile trata pending sem backfill automático do legado.” |
| **Plano B** | Demo curl 401 (se rede ok) |
| **Comportamento correto** | **Não** disparar webhook com secret na sala; **não** dizer “impossível hackear” |

---

### Pergunta sobre legalidade (“É golpe?”)

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Reputacional imediato |
| **Impacto** | 🔴 Crítico |
| **Resposta recomendada** | “Entendo a pergunta no setor. Por isso publicamos certificação **com ressalvas**, zero saldo negativo, webhooks que **rejeitam** fraude, e backlog legado **auditado** — operação que esconde não certifica; nós documentamos.” |
| **Plano B** | Pacote auditoria + certificação pós-call em 24h |
| **Comportamento correto** | **Não** atacar quem perguntou; **não** prometer parecer jurídico na hora |

---

## Cenário P0 — desvio de baseline

### Webhook retorna ≠ 401 (sem assinatura)

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Comprometimento de narrativa de segurança |
| **Impacto** | 🔴 **P0 — Crítico** |
| **Resposta recomendada** | “Este teste deveria retornar **401**. Detectamos desvio do baseline certificado; a equipe valida o runtime contra o SHA congelado após a call.” |
| **Plano B** | **Parar** demo de segurança financeira · mostrar relatório V1.6 com 401 histórico |
| **Comportamento correto** | **Não** continuar pitch “tudo seguro”; transparência imediata |

### `/health` down

| Campo | Conteúdo |
|-------|----------|
| **Risco** | Indisponibilidade real |
| **Impacto** | 🔴 Crítico |
| **Resposta recomendada** | “Temos indício de indisponibilidade — priorizamos honestidade sobre forçar demo live.” |
| **Plano B** | Slides V1.6 · status Fly read-only no celular · postergar demo live |
| **Comportamento correto** | **Não** deploy hotfix na frente de investidores |

---

## Matriz rápida (cartão de bolso)

| Sintoma / pergunta | Plano B em 1 linha |
|--------------------|-------------------|
| Player down | app.goldeouro.lol · vídeo backup |
| Admin down | Screenshots T-24h |
| Internet | Hotspot + PDF + vídeo |
| PIX lento | Histórico approved + F5 60s |
| Dashboard lento | Histórico PIX + relatório |
| Game trava | Vídeo gol certificado |
| 34 PIX | Legado U1–U4 · relatório pós-call |
| payout_confirmado 0 | Ressalva documentada · rollback |
| Escala / milhões | Abertura controlada · V2 |
| É golpe? | Certificação + auditoria |
| 401 ≠ 401 | **STOP** + investigar SHA |

---

## Escalonamento pós-reunião

| Severidade | Ação após call |
|------------|----------------|
| **P0** (health down, 401 ≠ 401) | Incidente formal · validar runtime vs baseline antes de novos usuários |
| **Demo UX** (PIX, game) | Backlog V1.R · não patch em prod sem gate |
| **Reputação / due diligence** | Email pacote auditoria + QA executivo em **24h** |

---

## Confirmação de escopo

Plano de contingência **somente documental**. Nenhuma ação deste arquivo modifica produção, banco, deploy ou código funcional.
