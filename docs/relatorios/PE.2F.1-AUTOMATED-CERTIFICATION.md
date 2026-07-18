# PE.2F.1 — Certificação Automatizada (Deposit Claim Port)

**Gate:** PE.2F.1  
**Modo:** CI only (`workflow_dispatch`)  
**Runtime alvo:** Indesconectável Payment Engine™ — deposit claim port  
**Data de publicação do workflow:** 2026-07-14

---

## Escopo

Este artefato documenta a **automação de certificação** PE.2F.1 via GitHub Actions.
Não executa deploy, não usa Fly, não consome secrets de finance/db.

### Workflow

| Campo | Valor |
|-------|-------|
| Arquivo | `.github/workflows/pe2f1-automated-certification.yml` |
| Trigger | `workflow_dispatch` somente |
| Node | 20 |
| Timeout | 15 min |
| Fail-fast | sim |
| Permissions | `contents: read`, `actions: write` |
| Flags | `PE_DEPOSIT_CLAIM_PORT_ENABLED=false`, `PE_ADAPTER_BOUNDARY_ENABLED=false` |

### Checks obrigatórios

1. Guard estático: o YAML do workflow não pode conter padrões de deploy Fly / app de produção proibidos
2. Scripts presentes:
   - `scripts/pe2f-claim-deposit-port-smoke.mjs`
   - `scripts/verify-pe2f-deposit-claim-port.mjs`
3. Estrutural: `src/payment-engine/core/claimApprovedDeposit.js` **não** casa `/supabase/i`
4. Execução smoke + verify (Node)
5. Artefatos em `artifacts/pe2f1-certification/`:
   - `smoke-output.txt`
   - `verify-output.txt`
   - `certification-result.json`
   - `environment-report.json`
   - `dependency-audit.json`

### Disparo

```bash
gh workflow run pe2f1-automated-certification.yml --ref <branch>
gh run watch
```

### Restrições

- Sem secrets de finance/db
- Sem deploy
- Certificação é evidência estrutural + smoke/verify; não altera runtime produtivo

### Status da sessão 2026-07-14

Ver relatório completo: [`PE.2F.1-CERTIFICATION-RESULT.md`](./PE.2F.1-CERTIFICATION-RESULT.md).

- Workflow **publicado em `main`** (PR #104 merged).
- `gh workflow run` **BLOCKED** com `HTTP 403: Resource not accessible by integration`.
- Fontes PE.2F.1 (core + scripts) **ausentes** no tree → mesmo com dispatch, o run falharia no gate de presença.
