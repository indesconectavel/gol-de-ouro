# ROADMAP V1 — GOL DE OURO

**Projeto:** Gol de Ouro  
**Documento:** Controle oficial de progresso da V1  
**Última atualização:** 2026-03-09  

---

Este roadmap define:

- **Estado atual do projeto** — Situação de cada bloco arquitetural em relação a auditorias e validação.
- **Progresso por bloco arquitetural** — Visão consolidada do que já foi validado, está em análise ou ainda não foi auditado.
- **Critérios de validação da V1** — Condições oficiais para considerar a V1 pronta (conforme `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`).
- **Próximos passos do desenvolvimento** — Auditorias prioritárias e blocos não obrigatórios para o lançamento inicial.

A referência de blocos e status está em [docs/ARQUITETURA-BLOCOS-GOLDEOURO.md](ARQUITETURA-BLOCOS-GOLDEOURO.md).

---

## Situação atual do projeto

| BLOCO | ÁREA | STATUS |
|-------|------|--------|
| A | Financeiro | VALIDADO |
| B | Sistema de apostas | VALIDADO |
| C | Autenticação | VALIDADO |
| D | Sistema de saldo | VALIDADO COM RESSALVAS |
| E | Gameplay | ENCERRADO PREMIUM |
| F | Interface | EM ANÁLISE |
| G | Antifraude | VALIDADO COM RISCOS MODERADOS |
| H | Economia e retenção | EM ANÁLISE |
| I | Escalabilidade | NÃO AUDITADO |
| J | Observabilidade | NÃO AUDITADO |
| K | Painel administrativo | NÃO AUDITADO |

---

## Progresso estimado da V1

| Área | Progresso |
|------|-----------|
| Infraestrutura | 95% |
| Backend | 95% |
| Engine do jogo | 95% |
| Sistema financeiro | 90% |
| Frontend | 75% |
| Antifraude | 75% |
| UX / Interface | 60% |

**Conclusão:** Estimativa geral de prontidão da V1: **aproximadamente 88%.**

---

## Critério para considerar a V1 validada

A V1 será considerada **pronta** quando os blocos abaixo atingirem os status indicados:

| BLOCO | Condição |
|-------|----------|
| A | VALIDADO |
| B | VALIDADO |
| C | VALIDADO |
| D | VALIDADO COM RESSALVAS |
| E | ENCERRADO PREMIUM |
| F | VALIDADO |
| G | VALIDADO |
| H | VALIDADO |

Os **blocos I, J e K** (Escalabilidade, Observabilidade, Painel administrativo) **não são obrigatórios** para lançamento da V1.

---

## Próximas auditorias prioritárias

Ordem recomendada para as próximas auditorias que impactam diretamente o critério de V1 validada:

**1 — BLOCO F — INTERFACE DO JOGO**  
Auditar telas do jogo, fluxo de navegação, UX do chute e feedback visual. Objetivo: levar o bloco de “EM ANÁLISE” para “VALIDADO” e garantir que a experiência do jogador esteja alinhada à engine e às regras da V1.

**2 — BLOCO G — BLINDAGEM ANTIFRAUDE**  
Refinar e implementar melhorias identificadas na auditoria read-only (ex.: exposição do contador em /health, uso de /api/debug/token, idempotency no cliente). Objetivo: evoluir de “VALIDADO COM RISCOS MODERADOS” para “VALIDADO”, com antifraude básico ativo.

**3 — BLOCO H — ECONOMIA E RETENÇÃO**  
Auditar engajamento, expectativa, retenção de jogadores e percepção de vitória. Objetivo: sair de “EM ANÁLISE” para “VALIDADO”, assegurando que a economia e a experiência estejam coerentes com a estratégia da V1.

---

## Blocos não obrigatórios para V1

Os blocos abaixo fazem parte da **maturidade do sistema**, não do lançamento inicial da V1:

- **BLOCO I — Escalabilidade** — Multi-instância, consistência distribuída, contador global, filas. Relevante quando houver necessidade de escalar horizontalmente.
- **BLOCO J — Observabilidade** — Logs, métricas, monitoramento, alertas. Reforça operação e diagnóstico em produção.
- **BLOCO K — Painel administrativo** — Controle de usuários, relatórios, exportação de dados, gestão operacional. Suporta operação e compliance após o lançamento.

Eles podem ser auditados e implementados em ciclos posteriores à V1.

---

## Critério para lançamento público

O jogo estará **apto para lançamento público** quando forem atendidos:

- **V1 validada** — Todos os blocos obrigatórios (A a H) no status definido no critério de V1 validada.
- **Sistema financeiro estável** — Depósitos, saques, webhooks e conciliação operando de forma confiável.
- **Antifraude básico ativo** — Medidas essenciais implementadas (ex.: restrição de exposição de dados sensíveis, idempotency no cliente onde aplicável).
- **Interface auditada** — Bloco F validado; fluxo e UX do chute alinhados à regra da V1.
- **Economia validada** — Bloco H validado; expectativa e retenção coerentes com o desenho do produto.

---

*Este documento é a referência oficial do progresso da V1 do Gol de Ouro. Atualizações de status devem refletir as conclusões das auditorias registradas em `docs/relatorios/` e em `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`.*
