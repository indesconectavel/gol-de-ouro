# Hotfix Ledger user_id Fallback — Merge PR #30

**Data:** 2026-03-04  
**PR:** [#30](https://github.com/indesconectavel/gol-de-ouro/pull/30) — hotfix(ledger): fallback user_id/usuario_id for createLedgerEntry  
**Repo:** indesconectavel/gol-de-ouro  
**App Fly:** goldeouro-backend-v2  

---

## 1) Evidência pré-merge (confirmação no GitHub)

### Estado do PR #30 (capturado antes do merge)

| Critério | Valor | Evidência |
|----------|--------|-----------|
| **Mergeable** | SIM | `mergeable: "MERGEABLE"` (gh pr view --json mergeable) |
| **Conflitos** | Nenhum | `mergeStateStatus: "CLEAN"` (gh pr view --json mergeStateStatus) |
| **All checks have passed** | SIM | `gh pr checks 30 --repo indesconectavel/gol-de-ouro` — todos com conclusão SUCCESS/pass |

### Checks (todos pass)

```
CodeQL	pass
GitGuardian Security Checks	pass
Vercel Preview Comments	pass
Vercel – goldeouro-backend	pass
Vercel – goldeouro-player	pass
⚡ Testes de Performance	pass
📊 Análise de Qualidade	pass
📊 Relatório de Segurança	pass
📊 Relatório de Testes	pass
🔍 Build e Auditoria	pass
🔍 Verificação Backend	pass
🔒 Análise de Segurança	pass
🔒 Testes de Segurança	pass
🧪 Testes Backend	pass
🧪 Testes Frontend	pass
🧪 Testes de Segurança	pass
```

**Comando usado para captura:**  
`gh pr view 30 --repo indesconectavel/gol-de-ouro --json number,title,state,mergeable,mergeStateStatus,url,statusCheckRollup,baseRefName,headRefName`  
`gh pr checks 30 --repo indesconectavel/gol-de-ouro`

---

## 2) Merge executado

**Comando:** `gh pr merge 30 --merge --repo indesconectavel/gol-de-ouro`  
**Resultado:** concluído com sucesso (exit 0).

---

## 3) Pós-merge (SHA em main, run do GitHub Actions, status)

| Item | Valor |
|------|--------|
| **SHA do merge em main** | `7c8cf59` — *Merge pull request #30 from indesconectavel/hotfix/ledger-userid-fallback* |
| **Link do run do GitHub Actions (push main)** | https://github.com/indesconectavel/gol-de-ouro/actions/runs/22689155294 (workflow: 🚀 Pipeline Principal - Gol de Ouro) |
| **Status final do run** | Ao fechar o relatório: `status: in_progress`, `conclusion: ""`. Verificar resultado em: https://github.com/indesconectavel/gol-de-ouro/actions/runs/22689155294 |

---

**Para obter o status final do run quando concluir:**  
`gh run view 22689155294 --repo indesconectavel/gol-de-ouro --json status,conclusion`

---

*Regras: deploy não manual; sem alteração de schema; máquina parada e82d... não tocada.*
