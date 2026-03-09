# Reavaliação do PR #29 e tentativa de merge — 2026-02-06

**PR:** [#29](https://github.com/indesconectavel/gol-de-ouro/pull/29) — Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only  
**Base:** main | **Head:** feat/payments-ui-pix-presets-top-copy  
**Estado ao reavaliar:** OPEN

---

## 1) JSON resumido (reviewDecision + statusCheckRollup)

| Campo | Valor |
|-------|--------|
| number | 29 |
| url | https://github.com/indesconectavel/gol-de-ouro/pull/29 |
| state | OPEN |
| mergeable | MERGEABLE |
| **reviewDecision** | **REVIEW_REQUIRED** |
| headRefName | feat/payments-ui-pix-presets-top-copy |
| baseRefName | main |

### Checks (status + conclusion)

| Nome | Workflow / origem | status | conclusion |
|------|-------------------|--------|------------|
| 🔒 Análise de Segurança | 🔒 Segurança e Qualidade | **IN_PROGRESS** | (vazio) |
| 🔍 Build e Auditoria | CI | COMPLETED | SUCCESS |
| 🧪 Testes Frontend | 🎨 Frontend Deploy (Vercel) | COMPLETED | **SUCCESS** |
| 🧪 Testes e Análise | 🚀 Backend Deploy | COMPLETED | SUCCESS |
| 🧪 Testes Backend | 🧪 Testes Automatizados | COMPLETED | SUCCESS |
| 🚀 Deploy Produção | 🎨 Frontend Deploy | COMPLETED | SKIPPED |
| 🚀 Deploy Backend | 🚀 Backend Deploy | COMPLETED | SKIPPED |
| 🔍 Verificação Backend | CI | COMPLETED | SUCCESS |
| 📊 Análise de Qualidade | 🔒 Segurança e Qualidade | COMPLETED | SUCCESS |
| 🧪 Testes Frontend | 🧪 Testes Automatizados | COMPLETED | SUCCESS |
| (outros) | — | COMPLETED | SUCCESS / SKIPPED |
| Vercel / GitGuardian | — | SUCCESS | SUCCESS |

---

## 2) Checks pendentes

- **🔒 Análise de Segurança** — status: **IN_PROGRESS**, conclusion: (vazio).  
  [Detalhes](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739710289/job/62712464810)

---

## 3) Bloqueio por reviewDecision

- **Exigência do repositório:** Aprovação de review antes do merge.
- **Valor atual:** `REVIEW_REQUIRED` — PR **não** aprovado.
- **Decisão:** **Registrar e parar.** Merge **não** foi executado.

---

## 4) Bloqueio por status checks

- **Regra:** Não fazer merge se algum check obrigatório não estiver verde (SUCCESS ou SKIPPED conforme política).
- **Situação:** Um check estava **IN_PROGRESS** (🔒 Análise de Segurança) no momento da consulta; conclusion vazia não é considerada SUCCESS.
- **Decisão:** Mesmo sem o bloqueio de review, o merge seria adiado até todos os checks concluírem com sucesso.

---

## 5) Merge

- **Ação:** Merge **não** foi executado.
- **Motivo:** (1) reviewDecision = REVIEW_REQUIRED; (2) pelo menos um check não finalizado (IN_PROGRESS).
- **Comando que seria usado (apenas referência):** `gh pr merge 29 --merge --delete-branch`

---

## 6) Confirmação de main

- **Ação:** Não aplicável — merge não foi realizado; `main` não foi alterado por este PR.
- Para conferir `main` após um futuro merge:
  ```powershell
  git fetch origin main
  git log --oneline -n 5 origin/main
  ```

---

## 7) Resumo

| Item | Resultado |
|-------|-----------|
| **Merge ocorreu?** | **Não** |
| **Hash do merge** | — |
| **Evidência de main** | — |
| **Bloqueios atuais** | 1) **REVIEW_REQUIRED** — é necessário aprovar o PR. 2) No momento da verificação, **🔒 Análise de Segurança** estava IN_PROGRESS (pode ter concluído depois). |
| **Links** | [PR #29](https://github.com/indesconectavel/gol-de-ouro/pull/29) · [Run Frontend Deploy (🧪 Testes Frontend = SUCCESS)](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739710296) · [Run Segurança (Análise IN_PROGRESS)](https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739710289) |

---

**Próximo passo:** Obter **aprovação** do PR (review approve). Depois, reexecutar a checagem: se `reviewDecision` for APPROVED e todos os checks obrigatórios estiverem com conclusion SUCCESS (ou SKIPPED conforme regras do repo), executar `gh pr merge 29 --merge --delete-branch`.

---

*Relatório gerado em 2026-02-06. Nenhum merge foi executado.*
