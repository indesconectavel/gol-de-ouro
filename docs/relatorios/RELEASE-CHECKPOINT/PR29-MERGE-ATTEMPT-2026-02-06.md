# Tentativa de merge PR #29 — 2026-02-06

**PR:** [#29](https://github.com/indesconectavel/gol-de-ouro/pull/29) — Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only  
**Base:** `main` | **Head:** `feat/payments-ui-pix-presets-top-copy`  
**Estado ao verificar:** OPEN

---

## 1) Output do `gh pr view 29 --json ...`

| Campo | Valor |
|-------|--------|
| **number** | 29 |
| **state** | OPEN |
| **mergeable** | MERGEABLE |
| **reviewDecision** | **REVIEW_REQUIRED** |
| **title** | Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only |
| **headRefName** | feat/payments-ui-pix-presets-top-copy |
| **baseRefName** | main |
| **url** | https://github.com/indesconectavel/gol-de-ouro/pull/29 |

### statusCheckRollup (resumo)

| Check | Workflow / origem | conclusion |
|-------|-------------------|------------|
| 🧪 Testes Frontend | 🎨 Frontend Deploy (Vercel) | **FAILURE** |
| CodeQL | (CodeQL) | **FAILURE** |
| 🔍 Build e Auditoria | CI | SUCCESS |
| 🔒 Análise de Segurança | 🔒 Segurança e Qualidade | SUCCESS |
| 🧪 Testes e Análise | 🚀 Backend Deploy | SUCCESS |
| 🧪 Testes Backend | 🧪 Testes Automatizados | SUCCESS |
| 🚀 Deploy Produção | 🎨 Frontend Deploy | SKIPPED |
| 🚀 Deploy Backend | 🚀 Backend Deploy | SKIPPED |
| 🔍 Verificação Backend | CI | SUCCESS |
| 📊 Análise de Qualidade | 🔒 Segurança e Qualidade | SUCCESS |
| 🧪 Testes Frontend | 🧪 Testes Automatizados | SUCCESS |
| Vercel (preview) | — | SUCCESS |
| GitGuardian Security Checks | — | SUCCESS |
| (outros) | — | SUCCESS / SKIPPED |

---

## 2) Checagem de aprovação (reviewDecision)

- **Exigência:** Repositório exige aprovação de review antes do merge.
- **Valor:** `REVIEW_REQUIRED` — PR **não** está aprovado.
- **Decisão:** **Registrar e parar.** Merge não permitido enquanto não houver aprovação.

---

## 3) Checagem de status (checks)

- **Regra:** Não fazer merge se os checks não estiverem verdes.
- **Falhas identificadas:**
  1. **🧪 Testes Frontend** (workflow "🎨 Frontend Deploy (Vercel)") — `conclusion: FAILURE`  
     - [Detalhes](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739371587/job/62711444457)
  2. **CodeQL** — `conclusion: FAILURE`  
     - [Detalhes](https://github.com/indesconectavel/gol-de-ouro/runs/62711540702)
- **Decisão:** **Registrar e parar.** Merge não permitido com checks falhando.

---

## 4) Merge

- **Ação:** Merge **não** foi executado.
- **Motivo:** Condições não satisfeitas: (1) review required e não aprovado, (2) pelo menos dois checks em falha (Testes Frontend, CodeQL).
- **Comando que seria usado (apenas referência):** `gh pr merge 29 --merge --delete-branch`

---

## 5) Confirmação de main

- **Ação:** Não aplicável — merge não foi feito; `main` não foi alterado por este PR.
- Para conferir main após um futuro merge:
  ```powershell
  git fetch origin main
  git log --oneline -n 5 origin/main
  ```

---

## 6) Resultado e próximo passo

| Item | Resultado |
|------|-----------|
| **Sucesso do merge** | **Não** — merge não foi tentado por política (checks + aprovação). |
| **Próximo passo** | 1) Corrigir falha do job **🧪 Testes Frontend** no workflow "🎨 Frontend Deploy (Vercel)" (ver logs no link acima). 2) Corrigir falha do **CodeQL** ou avaliar se é falso positivo / se o repo permite merge com CodeQL falhando. 3) Obter **aprovação** do PR (review approve). 4) Reexecutar as checagens e, se `reviewDecision` for APPROVED e os checks obrigatórios estiverem verdes, tentar novamente: `gh pr merge 29 --merge --delete-branch`. |

---

*Relatório gerado em 2026-02-06. Nenhum merge foi executado; nenhuma alteração em produção.*
