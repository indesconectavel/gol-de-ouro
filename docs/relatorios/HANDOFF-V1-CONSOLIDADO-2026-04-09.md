# Handoff consolidado — V1 — Gol de Ouro (chat + repositório)

**Data:** 2026-04-09  
**Finalidade:** memória única para abrir **novo chat** sem perder contexto — o que foi feito nesta linha de trabalho, estado da V1, blocos, decisões e continuidade.

**Nota metodológica:** a letra **A–S** abaixo mistura blocos **nomeados em relatório** (`BLOCO A`, `C`, `F`…) com letras **sem ficheiro dedicado** na pasta `docs/relatorios/` desta data — nesses casos o estado é explicitado como *não formalizado*, para não inventar histórico.

---

## 1. Resumo executivo

| Dimensão | Síntese |
|----------|---------|
| **Estado geral** | Monorepo `goldeouro-backend` com player em `goldeouro-player`, backend (`server-fly.js`, Fly), Supabase; produção documentada em `www.goldeouro.lol` com smoke manual OK e Vercel *Current* alinhado a `main` após PR #56 (`HANDOFF-COMPLETO-V1-GOLDEOURO-2026-04-09.md`, `ENCERRAMENTO-OFICIAL-V1-2026-04-09.md`). |
| **Núcleo transacional** | Fase **2.2B** — função SQL `shoot_apply` em lote transacional, handler de chute no backend; validação **APROVADA COM RESSALVAS** (`VALIDACAO-FASE2-2B-LOTE-TRANSACIONAL-2026-04-09.md`). |
| **V1** | **Quase pronta para produção controlada** / **pronta para testes reais alargados:** núcleo operacional e encerramento oficial documentados; o trabalho deste chat fechou **honestidade de UI (BLOCO F + F2-B)** e registou **commit** `00b32a3` na branch `snapshot/v1-estavel-2026-04-09` (F2-B). Merge/deploy de `Dashboard.jsx` (Fase F original) e relatórios F não incluídos nesse commit podem ainda estar pendentes em outras branches — **confirmar `main` vs branch de trabalho** antes de declarar produção alinhada a F completo. |

**Classificação final (secção 9):** **V1 PRONTA PARA PRODUÇÃO CONTROLADA** — com smoke, monitorização e confirmação de SHA/deploy após integrar F/F2-B na linha que vai a produção.

---

## 2. Pipeline executado (neste chat + continuidade documentada)

| Fase | O que ocorreu |
|------|----------------|
| **Diagnóstico** | Identificação de fallbacks **enganosos** em `catch` (`free10signer`, saldo/identidade fictícios) em `Dashboard.jsx` e `Profile.jsx`; confirmado impacto só em estado React (sem alterar JWT/saldo real no servidor). |
| **Pré-execução** | Mapeamento read-only de escopo, riscos, ficheiros autorizados; pré-execução **F2-B** sobre placeholders no ramo de sucesso e `AdvancedStats`. |
| **Cirurgias** | **F:** remoção de identidade/saldo fictícios em erro, `profileLoadError`, retry, render segura com `user` ausente (`Dashboard`, `Profile`). **F2-B:** placeholders honestos (`—`, saldo só se finito), conquistas sem array mock, `AdvancedStats` sem dados simulados. |
| **Validações** | Read-only sobre escopo e cruzamento com **BLOCO A** (sem reabertura); relatório `VALIDACAO-BLOCO-F-FALLBACKS-ENGANOSOS-V1-2026-04-09.md`; build Vite **validado** no ambiente onde existia `node_modules` completo (F2-B). |
| **Git** | Commit com mensagem `bloco-f-f2b-placeholders-sucesso-build-validado-2026-04-09`, SHA **`00b32a375d40fff825b2160d9223a976f328fa87`**, push para `origin` em **`snapshot/v1-estavel-2026-04-09`** (apenas 3 ficheiros: `Profile.jsx`, `AdvancedStats.jsx`, relatório F2-B). |

---

## 3. Status dos blocos (A → S)

| Bloco | Status | Observação |
|-------|--------|------------|
| **A** | **ESTÁVEL** | Blindagem financeira Fase 1 (`CIRURGIA-BLOCO-A-*`, `VALIDACAO-BLOCO-A-*`). Não impactada pelo frontend F/F2-B. |
| **B** | **N/C** | Sem documento `BLOCO-B` dedicado em `docs/relatorios/` nesta onda; não atribuir trabalho fictício. |
| **C** | **ESTÁVEL (com ressalvas)** | Hardening auth Fase 1 (`VALIDACAO-BLOCO-C-*`); aprovação condicionada a SMTP / `FRONTEND_URL` em staging/produção. |
| **D** | **N/C** | Ver nota; usar **Fase 2.2B** para núcleo transacional de chute. |
| **E** | **N/C** | Idem. |
| **F** | **ENCERRADO** | Fallbacks em erro removidos (Dashboard + Profile); F2-B placeholders sucesso + build validado; relatórios `CIRURGIA-BLOCO-F-*`, `VALIDACAO-BLOCO-F-*`, `CIRURGIA-BLOCO-F-F2B-*`. |
| **G** | **N/C** | Sem letra dedicada nos relatórios citados. |
| **H** | **BACKLOG V2** | Métricas/retenção — referência em handoffs como área futura. |
| **I** | **BACKLOG V2** | Escalabilidade (filas, rate limit, custos) — `HANDOFF-COMPLETO` BLOCO 10. |
| **J** | **N/C** | — |
| **K** | **N/C** | — |
| **L** | **ACEITÁVEL (V1)** | `ENCERRAMENTO-BLOCO-L-V1-2026-04-09.md`: sem persistência auditável de aceite no backend nesta V1. |
| **M** | **ESTÁVEL (V1)** | Corte mínimo debug token (`CIRURGIA-BLOCO-M-*`). |
| **N** | **N/C** | — |
| **O** | **N/C** | — |
| **P** | **N/C** | — |
| **Q** | **N/C** | — |
| **R** | **N/C** | — |
| **S** | **N/C** | — |

**Núcleo transacional (não é letra única):** **Fase 2.2B** — **APROVADA COM RESSALVAS** (índice único parcial em comentário no repo; confirmar catálogo em produção). Artefactos: `database/shoot_apply_atomic_transaction.sql`, `server-fly.js` (zona shoot).

**Baseline player (não é letra única):** merge **PR #56**, `main` @ `277cf16`, GameFinal em `/game`, `vercel.json` sem `cleanUrls`.

---

## 4. Cirurgias realizadas (registo)

| Área | Conteúdo |
|------|-----------|
| **BLOCO A** | Ajustes / blindagem financeira no backend (SQL + rotas sensíveis) — documentado nos relatórios A; **sem** alteração motivada pelo BLOCO F. |
| **BLOCO C** | Auth hardening Fase 1 — validação condicionada a env operacional. |
| **BLOCO M** | Corte mínimo de exposição de token / debug. |
| **BLOCO F** | **Fase 1:** remoção de fallbacks enganosos em erro (`Dashboard.jsx`, `Profile.jsx`). **Fase F2-B:** placeholders honestos no sucesso (`Profile.jsx`), `AdvancedStats.jsx` sem séries simuladas; build player validado no ambiente disponível. |
| **Fase 2.2B** | Lote transacional do chute (`shoot_apply`) — cirurgia/validação em relatórios Fase 2.2B. |

---

## 5. Decisões importantes

1. **BLOCO L:** não será “corrigido” na V1 com persistência de aceite no servidor — **aceitável para V1** com UI obrigatória e `/terms` + `/privacy` (`ENCERRAMENTO-BLOCO-L-V1-2026-04-09.md`).
2. **BLOCO F:** tratado como **correção obrigatória de confiança** (UI não pode simular identidade/saldo após erro nem inventar email/data em sucesso após F2-B).
3. **BLOCO A:** **não reaberto** por alterações de frontend F/F2-B (apenas percepção e estado React).
4. **V1 vs V2:** V1 fecha com **operacional + honestidade mínima + compliance aceitável**; V2 absorve compliance completo, mocks, UX avançada, escala e observabilidade.

---

## 6. Riscos remanescentes

| Risco | Nota |
|-------|------|
| **Build / CI** | Depende de `npm install` saudável e de pipeline; validação local pode falhar por ambiente (histórico no início do BLOCO F). |
| **Mocks fora do escopo** | `Leaderboard.jsx` com dados mock se for ligado a rotas; `Withdraw` com `setBalance(0)` em erro (mencionado em pré-execução F); HTML/scripts na raiz com `free10signer` para testes manuais. |
| **BLOCO L** | Ausência de **persistência auditável** de aceite no backend. |
| **Alinhamento branch** | F2-B commitado em `snapshot/v1-estavel-2026-04-09`; produção documentada em `main` @ `277cf16` — **integrar/merge** antes de assumir F2-B em `www.goldeouro.lol`. |
| **Gamificação** | Hook e badges podem misturar catálogo estático com dados de API — não objecto deste handoff; revisar na V2 se necessário. |

---

## 7. Backlog V2 (sugerido)

- Compliance completo (**BLOCO L**): prova de consentimento persistida e auditável.
- Limpeza de mocks (`Leaderboard`, artefactos de teste, documentação legada).
- Melhorias UX (erros de rede, onboarding, feedback).
- Escalabilidade (**BLOCO I**): filas, idempotência webhooks/saques, rate limiting.
- Métricas e retenção (**BLOCO H**): produto + técnica.
- Testes E2E críticos e observabilidade unificada (`HANDOFF-COMPLETO` BLOCO 10).

---

## 8. Checklist final V1

| Item | Estado |
|------|--------|
| Backend estável | **Sim** (com evidência `/health` e relatórios; revalidar na data de uso). |
| Frontend honesto | **Sim** após integração **F + F2-B** na linha deployada (sem fallbacks enganosos; placeholders sucesso honestos). |
| Financeiro íntegro | **Sim** no âmbito BLOCO A + Fase 2.2B documentados; monitorizar em produção. |
| UX aceitável | **Sim** para smoke documentado; melhorias contínuas V2. |
| Sem dados enganosos nas rotas principais tratadas | **Sim** após F/F2-B na build que vai a produção. |

---

## 9. Classificação final

**V1 PRONTA PARA PRODUÇÃO CONTROLADA**

**Condições:** smoke pós-deploy, SHA correcto no Vercel (`goldeouro-player`), variáveis de ambiente (C, PIX, URLs) confirmadas, e linha Git que inclui **F + F2-B** quando se pretender honestidade total no player em produção.

---

## Referências cruzadas (ficheiros)

- `HANDOFF-COMPLETO-V1-GOLDEOURO-2026-04-09.md`
- `ENCERRAMENTO-OFICIAL-V1-2026-04-09.md`
- `ENCERRAMENTO-BLOCO-L-V1-2026-04-09.md`
- `CIRURGIA-BLOCO-A-FASE1-BLINDAGEM-FINANCEIRA-2026-04-09.md`
- `VALIDACAO-BLOCO-C-FASE1-HARDENING-2026-04-09.md`
- `CIRURGIA-BLOCO-M-CORTE-MINIMO-V1-2026-04-09.md`
- `CIRURGIA-BLOCO-F-FALLBACKS-ENGANOSOS-V1-2026-04-09.md`
- `VALIDACAO-BLOCO-F-FALLBACKS-ENGANOSOS-V1-2026-04-09.md`
- `CIRURGIA-BLOCO-F-F2B-PLACEHOLDERS-SUCESSO-V1-2026-04-09.md`
- `VALIDACAO-FASE2-2B-LOTE-TRANSACIONAL-2026-04-09.md`
- `MERGE-FINAL-PR56-ALINHAMENTO-MAIN-2026-04-09.md`

---

*Documento gerado para consolidação; estados operacionais (deploy, SHA, health) devem ser revalidados na data de uso.*
