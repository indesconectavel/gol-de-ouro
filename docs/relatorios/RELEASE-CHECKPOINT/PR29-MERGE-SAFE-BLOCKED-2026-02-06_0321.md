# PR #29 — Merge seguro BLOQUEADO (gates não satisfeitos)

**Data/hora:** 2026-02-06_0321  
**Repo:** indesconectavel/gol-de-ouro  
**PR:** 29 | Base: main | Head: feat/payments-ui-pix-presets-top-copy

---

## FASE 0 — Precheck local (registrado)

| Item | Valor |
|------|--------|
| **Diretório** | e:\Chute de Ouro\goldeouro-backend |
| **git rev-parse --is-inside-work-tree** | true |
| **git fetch** | Executado (--all --tags --prune) |
| **git status -sb** | ## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy |
| **Branch** | feat/payments-ui-pix-presets-top-copy |
| **HEAD** | d67f6b55c9404ff9dc2c577480487214e6464572 |
| **git log -1 --oneline** | d67f6b5 fix(security): CSP report-only no helmet (destravar CodeQL sem regressão) |

---

## FASE 1 — Gates (API GitHub)

### PR #29 — JSON resumido

```json
{
  "url": "https://github.com/indesconectavel/gol-de-ouro/pull/29",
  "state": "OPEN",
  "mergeable": "MERGEABLE",
  "reviewDecision": "REVIEW_REQUIRED",
  "headRefName": "feat/payments-ui-pix-presets-top-copy",
  "baseRefName": "main",
  "headRefOid": "d67f6b55c9404ff9dc2c577480487214e6464572"
}
```

### Validação dos gates

| Gate | Regra | Resultado |
|------|--------|-----------|
| **Gate A** | reviewDecision == "APPROVED" | **FALHOU** — valor atual: **REVIEW_REQUIRED** |
| **Gate B** | Nenhum conclusion em FAILURE/CANCELLED/TIMED_OUT/ACTION_REQUIRED | **PASSOU** — apenas SUCCESS ou SKIPPED |
| **Gate C** | Nenhum status em IN_PROGRESS/QUEUED | **PASSOU** — todos COMPLETED (ou state SUCCESS no StatusContext) |

**statusCheckRollup:** 21 itens; conclusões: SUCCESS (maioria), SKIPPED (Deploy Produção, Deploy Backend, Deploy Desenvolvimento, Deploy Dev, Build APK). Nenhum FAILURE, CANCELLED, TIMED_OUT ou ACTION_REQUIRED. Nenhum IN_PROGRESS ou QUEUED.

---

## Resultado: BLOQUEADO

**Motivo:** Gate A falhou. O repositório exige aprovação de review (`reviewDecision == "APPROVED"`). O valor atual é **REVIEW_REQUIRED**.

**Ações não executadas (conforme regras):**
- Tag PRE **não** foi criada.
- Merge **não** foi executado.

---

## Próximos passos para desbloquear

1. Obter **aprovação** do PR #29 (um revisor com permissão deve dar "Approve" no GitHub).
2. Após `reviewDecision` passar a **APPROVED**, reexecutar o fluxo de merge seguro (FASE 0 → 1 → 2 tag PRE → 3 merge → 4 evidência main → 5 relatório SUCCESS).

---

## Confirmação

- Sem force push, rebase, stash ou edição de código.
- Relatório salvo em `docs/relatorios/RELEASE-CHECKPOINT/PR29-MERGE-SAFE-BLOCKED-2026-02-06_0321.md`.
