# PE.2F.1 — Resultado da Certificação Automatizada

**Gate:** PE.2F.1  
**Status final desta sessão:** **BLOCKED**  
**Data:** 2026-07-14  
**Branch:** `cursor/pe-2f-1-certification-automation-e385`  
**SHA (workflow/docs):** `6e26eb0bf88451b370ddcde25c6ad92e1f2d0d16`  
**SHA em `main` (workflow registrado):** `257b9c02ccff1bf4c9dd63f6294e1a1f82787137`  
**PR de registro:** https://github.com/indesconectavel/gol-de-ouro/pull/104 (MERGED)

---

## Capabilities (pré-flight)

| Item | Resultado |
|------|-----------|
| Git status | clean após commits |
| Branch de trabalho | `cursor/pe-2f-1-certification-automation-e385` |
| Remote | `origin` → `indesconectavel/gol-de-ouro` |
| `gh auth status` | OK (conta `cursor`, token `ghs_*`) |
| Push feature branch | OK |
| Merge do workflow em `main` | OK (PR #104) |
| Workflow ativo em `main` | OK — id `313084049` / name `PE.2F.1 Automated Certification` |
| `gh workflow run` / dispatch API | **FAIL 403** |

---

## BLOCKED — erro exato do dispatch

```text
could not create workflow dispatch event: HTTP 403: Resource not accessible by integration
(https://api.github.com/repos/indesconectavel/gol-de-ouro/actions/workflows/313084049/dispatches)
```

API direta:

```text
{"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event","status":"403"}
```

**Causa:** o token da integração Cursor (`ghs_*`) autentica e consegue push/merge/leitura, mas **não possui permissão** `actions: write` para criar evento `workflow_dispatch`.

Antes do merge em `main`, o erro inicial era:

```text
HTTP 404: workflow pe2f1-automated-certification.yml not found on the default branch
```

Esse 404 foi resolvido publicando o workflow via PR #104 → `main`. O bloqueio residual é o **403 de dispatch**.

---

## Resultados locais equivalentes (gates do workflow)

Como o run remoto não pôde ser disparado, os gates foram avaliados localmente no tip da branch:

| Gate | Resultado |
|------|-----------|
| Static guard (sem padrões proibidos no YAML) | **PASS** |
| `scripts/pe2f-claim-deposit-port-smoke.mjs` | **MISSING** |
| `scripts/verify-pe2f-deposit-claim-port.mjs` | **MISSING** |
| `src/payment-engine/core/claimApprovedDeposit.js` | **MISSING** |
| Smoke exit | **n/a** (não executado) |
| Verify exit | **n/a** (não executado) |
| Artifact list (CI) | **n/a** (sem run) |
| Run URL | **n/a** |
| Conclusion (CI) | **BLOCKED** (dispatch 403) |

> Nota: mesmo que o dispatch fosse permitido, o run falharia no gate “scripts exist” / “core present”, porque os artefatos de runtime PE.2F.1 (core + smoke/verify) **não estão no tree**. Nenhum runtime do payment engine foi alterado nesta sessão (somente workflow + docs), conforme escopo.

---

## Artefatos publicados

- `.github/workflows/pe2f1-automated-certification.yml`
- `docs/relatorios/PE.2F.1-AUTOMATED-CERTIFICATION.md`
- `docs/payment-engine/pe2f1/README.md`
- Este relatório: `docs/relatorios/PE.2F.1-CERTIFICATION-RESULT.md`

### Desbloqueio necessário (fora do token atual)

1. Disparo por humano/PAT com `actions: write`, **ou**
2. Ampliar permissões da GitHub App Cursor no repositório para Actions write  
3. Em seguida: `gh workflow run pe2f1-automated-certification.yml --ref cursor/pe-2f-1-certification-automation-e385`
4. Aterrisar os fontes PE.2F.1 (`claimApprovedDeposit.js` port-puro + scripts smoke/verify) para o certificar passar
