## Resumo do que entra

- **CHANGE #2:** Mensagem amigável ao jogar sem saldo (frontend) — prioriza `error.response?.data?.message`, exibe "Você está sem saldo. Adicione saldo para jogar." quando aplicável.
- **CHANGE #3:** Destaque no botão Recarregar ao jogar sem saldo (frontend) — highlight temporário no botão Recarregar quando a API retorna saldo insuficiente.
- **CHANGE #4:** Gatilho semântico para saldo insuficiente (frontend) — uso de código de erro `INSUFFICIENT_BALANCE` em vez de comparação por string; maior robustez.
- **Payments UI:** Presets PIX, copy-top, default 200, bloco PIX no topo (já no branch).

Escopo: **apenas frontend (goldeouro-player)**. Sem alteração de backend, endpoints, PIX ou fluxo financeiro.

## Risco

**Baixo** — frontend only; sem mudança de contrato de API.

## Evidência e rastreabilidade

- Relatórios e specs em `docs/relatorios/RELEASE-CHECKPOINT/`:
  - CHANGE-2-implementacao-frontend.md, CHANGE-3-highlight-recarregar-frontend.md, CHANGE-4-robustez-gatilho-sem-string.md
  - GIT-AUDIT-CHANGE2-CHANGE3-readonly.md, DEPLOY-AUDIT-PLAYER-readonly.md
- Tag de checkpoint (pré-merge): `PRE_MERGE_MAIN_2026-02-06_0152` (commit 3b16284).

## Checklist de validação em produção (após merge)

- [ ] Aguardar conclusão do workflow de deploy (frontend-deploy ou main-pipeline) no commit em `main`.
- [ ] Abrir https://www.goldeouro.lol e testar fluxo de chute sem saldo:
  - [ ] Mensagem amigável ("Você está sem saldo. Adicione saldo para jogar." ou equivalente).
  - [ ] Destaque temporário no botão Recarregar.
- [ ] Validar página de Pagamentos: presets PIX, bloco PIX no topo, default 200.

## Rollback

- **Vercel:** No [Dashboard](https://vercel.com/goldeouro-admins-projects/goldeouro-player/deployments), promover o deployment anterior a este merge para Production ("Promote to Production").
- **Git:** No repo, reverter o merge em `main` e dar push para disparar novo deploy (ver relatório PR-PREP-MAIN-2026-02-06.md).
- **Referência de estado anterior:** tag `PRE_MERGE_MAIN_2026-02-06_0152`.
