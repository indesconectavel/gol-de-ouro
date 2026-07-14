# PE.2F.1 Certification Package

Automatiza a certificação do port de *deposit claim* do Payment Engine.

- Workflow: `.github/workflows/pe2f1-automated-certification.yml`
- Relatório: `docs/relatorios/PE.2F.1-AUTOMATED-CERTIFICATION.md`
- Artefatos de run: `artifacts/pe2f1-certification/` (gerados no CI)

Pré-requisitos no tree (validados pelo workflow):

- `src/payment-engine/core/claimApprovedDeposit.js` (sem acoplamento supabase)
- `scripts/pe2f-claim-deposit-port-smoke.mjs`
- `scripts/verify-pe2f-deposit-claim-port.mjs`
