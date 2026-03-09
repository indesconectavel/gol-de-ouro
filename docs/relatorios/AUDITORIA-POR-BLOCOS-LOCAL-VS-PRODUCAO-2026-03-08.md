# AUDITORIA POR BLOCOS — LOCAL VS PRODUÇÃO

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Objetivo:** Validação ultracirúrgica por blocos (A → G) com três referências distintas, sem alterar código, build, deploy ou produção.

---

## Referências

| Referência | Descrição |
|------------|-----------|
| **1 — Baseline validada** | Deploy FyKKeg6zb. Bundle JS: index-qIGutT6K.js. Bundle CSS: index-lDOJDUAS.css. Documentada em BASELINE-FRONTEND-FYKKeg6zb-OFICIAL-2026-03-06.md, baseline-frontend-rollback.json. |
| **2 — Produção atual** | Deployment em uso: **ez1oc96t1**. Pode divergir da baseline (bundle diferente; compare-preview-vs-baseline-risk.json). |
| **3 — Código local** | Estado atual do repositório (backend + goldeouro-player). Pode conter camadas de dev, banners, warnings, telas blueprint e código legado. |

---

## Execução por bloco

A auditoria foi executada na ordem de prioridade sugerida: **C → D → A → E → B → F → G**. Para cada bloco foi gerado um relatório no formato exigido (escopo, fonte de verdade, evidências, alinhamento baseline/produção, diferenças, risco, pode usar local?, exceções, classificação final).

### Resumo por bloco

| Bloco | Nome | Relatório detalhado |
|-------|------|---------------------|
| **C** | Autenticação / Acesso | docs/relatorios/BLOCO-C-AUTH-READONLY-2026-03-08.md |
| **D** | Saldo / Perfil / Pagamentos | docs/relatorios/BLOCO-D-SALDO-PERFIL-PAGAMENTOS-READONLY-2026-03-08.md |
| **A** | Financeiro | docs/relatorios/BLOCO-A-FINANCEIRO-READONLY-2026-03-08.md |
| **E** | Gameplay | docs/relatorios/BLOCO-E-GAMEPLAY-READONLY-2026-03-08.md |
| **B** | Sistema de Apostas | docs/relatorios/BLOCO-B-APOSTAS-READONLY-2026-03-08.md |
| **F** | Interface | docs/relatorios/BLOCO-F-INTERFACE-READONLY-2026-03-08.md |
| **G** | Fluxo do Jogador | docs/relatorios/BLOCO-G-FLUXO-JOGADOR-READONLY-2026-03-08.md |

---

## MATRIZ FINAL OBRIGATÓRIA

| Bloco | Baseline validada | Produção atual | Local | Pode usar local? | Risco | Status |
|-------|--------------------|----------------|-------|-------------------|-------|--------|
| **A** — Financeiro | Parcial | Sim | Sim | Sim | Médio | BLOCO ALINHADO |
| **B** — Apostas | Parcial | Sim | Sim | Sim, com ressalvas | Médio | BLOCO ALINHADO COM RESSALVAS |
| **C** — Auth | Parcial | Sim | Sim | Sim | Baixo | BLOCO ALINHADO COM RESSALVAS |
| **D** — Saldo/Perfil/Pagamentos | Parcial | Sim | Sim | Sim, com ressalvas | Médio | BLOCO ALINHADO COM RESSALVAS |
| **E** — Gameplay | Não confirmado | Sim | Sim | Sim, com ressalvas | Médio | BLOCO ALINHADO COM RESSALVAS |
| **F** — Interface | Parcial | Sim | Sim | Sim, com ressalvas | Médio | BLOCO ALINHADO COM RESSALVAS |
| **G** — Fluxo do Jogador | Parcial | Sim | Sim | Sim, com ressalvas | Médio | BLOCO ALINHADO COM RESSALVAS |

**Legenda:**  
- **Baseline validada / Produção atual / Local:** Sim = alinhado; Parcial = alinhado em parte ou não confirmado para todos os aspectos; Não confirmado = sem evidência documental.  
- **Pode usar local?** Sim = pode usar como referência para o bloco; Sim, com ressalvas = usar com exceções obrigatórias registradas nos relatórios; Não = não homologar pelo local.  
- **Risco:** Baixo / Médio / Alto.  
- **Status:** Classificação final do bloco conforme seção 10 de cada relatório.

---

## CRITÉRIO FINAL DE DECISÃO

### Quais blocos já podem ser usados com confiança pela equipe?

- **BLOCO A (Financeiro):** Sim, para validar depósito PIX, saque, histórico e endpoints. Exceções: ledger sem depósito, env do worker, URL webhook payout.
- **BLOCO C (Auth):** Sim, para validar login, logout, register, rotas protegidas e perfil. Exceção: baseline não confirma fluxo exato de auth no bundle.

### Quais blocos exigem ressalvas obrigatórias?

- **BLOCO B (Apostas):** Usar local como referência do **comportamento atual** (R$ 1 na UI, fluxo de chute). Não considerar igual à **regra oficial V1** (backend aceita 2,5,10 e gol aleatório).
- **BLOCO D (Saldo/Perfil/Pagamentos):** Não usar o **saldo exibido na sidebar** como referência (valor fixo). Fonte de dados (PROFILE) é única e correta nas demais telas.
- **BLOCO E (Gameplay):** Usar local como referência da **produção atual** (/game = GameShoot). Não afirmar alinhamento com baseline — componente /game na baseline não foi identificado.
- **BLOCO F (Interface):** Registrar **ToastContainer ausente** e **saldo fixo na sidebar**; não homologar feedback por toasts nem saldo pela sidebar. VersionWarning/PwaSwUpdater tratados como diferença em relação à baseline.
- **BLOCO G (Fluxo do Jogador):** Definir se a validação é contra **FyKKeg6zb** ou **ez1oc96t1**. Local = ez1oc96t1. Registrar pontos de abandono e CTA pós-PIX.

### Quais blocos não devem ser homologados pelo local ainda?

- **Nenhum bloco** foi classificado como “não homologar pelo local”. Todos podem ser usados como referência **com** as ressalvas e exceções acima. O que **não** deve ser feito: homologar “local = baseline FyKKeg6zb” sem evidência; usar saldo da sidebar para conferência; assumir que toasts funcionam; assumir que sistema de apostas cumpre regra V1.

### Ordem mais segura para continuar a validação do projeto

1. **BLOCO C (Auth)** — Garantir que login, logout e rotas protegidas estão corretos em qualquer ambiente.  
2. **BLOCO D (Saldo/Perfil/Pagamentos)** — Validar fonte única de saldo (PROFILE) e não usar sidebar para saldo.  
3. **BLOCO A (Financeiro)** — Validar PIX e saque contra produção atual e conferir env do worker.  
4. **BLOCO E (Gameplay)** — Validar /game = GameShoot e POST /api/games/shoot; fixar referência (baseline vs produção atual).  
5. **BLOCO B (Apostas)** — Validar valor R$ 1 e fluxo; registrar divergência em relação à regra V1.  
6. **BLOCO F (Interface)** — Validar layout e navegação; registrar ToastContainer e saldo sidebar; decidir tratamento de VersionWarning.  
7. **BLOCO G (Fluxo do Jogador)** — Validar jornada completa com deployment de referência definido e exceções registradas.

---

## Exceções consolidadas (registro formal)

| # | Bloco | Exceção |
|---|-------|---------|
| 1 | C | Baseline não documenta fluxo exato de auth no bundle; forgot/reset password não validados contra produção/baseline. |
| 2 | D | Saldo na sidebar é valor fixo; não usar para homologação. Depósito/chute não geram ledger. |
| 3 | A | Depósito aprovado não insere em ledger_financeiro. Worker depende de env. Webhook payout: conferir URL no MP. |
| 4 | E | Componente montado em /game na baseline não identificado. Game.jsx existe mas não está em rota. |
| 5 | B | Engine aceita amount 2,5,10 e winnerIndex aleatório; regra V1 exige apenas R$ 1 e gol no 10º chute. |
| 6 | F | ToastContainer ausente; saldo fixo na sidebar; VersionWarning/PwaSwUpdater divergem da baseline; tema claro só em Pagamentos. |
| 7 | G | Definir deployment de referência (FyKKeg6zb vs ez1oc96t1). Pontos de abandono e CTA pós-PIX registrados. |

---

## Regras de rigor aplicadas

- Nenhuma conclusão assumida sem evidência (arquivo, rota, relatório existente).  
- Baseline validada (FyKKeg6zb) não foi confundida com produção atual (ez1oc96t1).  
- Game.jsx não foi tratado como tela ativa sem prova (não está em nenhuma rota no App.jsx).  
- Banner/VersionWarning foi registrado como impacto possível na validação, não ignorado como “apenas detalhe”.  
- Divergência funcional (regra V1 vs engine) foi separada de divergência visual (toasts, tema).  
- Onde não foi possível comprovar: marcado como **não confirmado** ou **parcial**.

---

*Auditoria realizada em modo READ-ONLY absoluto. Nenhum arquivo, build, deploy ou configuração foi alterado.*
