# CIRURGIA — UNIFICAÇÃO DO PIPELINE DO FRONTEND (PLAYER)

**Data:** 2026-04-02  
**Workflow canónico:** `.github/workflows/frontend-deploy.yml`

---

## O que foi alterado

| Ficheiro | Alteração |
|----------|-----------|
| `main-pipeline.yml` | Removido o passo **“Deploy Frontend (Vercel)”** (`npx vercel --prod --yes`). Comentário no YAML a indicar que o deploy do frontend passou a ser exclusivo de `frontend-deploy.yml`. |
| `deploy-on-demand.yml` | Job **Player (Vercel):** `vercel-args` alterado de `--prod` para **`--target preview`**. Comentário a documentar que produção pública fica só no workflow canónico. |
| `rollback.yml` | Removido o rollback automático com **`npx vercel promote`**. Removido o passo **Configurar Node.js** (só servia o `npx vercel` do frontend). Substituído por passo informativo **desativado**. Mantido **Rollback Backend (Fly.io)**. |
| `health-monitor.yml` | Passo **“Commitar relatórios”:** removidos `git add` / `git commit` / **`git push origin main`**; mantida mensagem informativa; relatórios continuam disponíveis via **artifacts**. |
| `frontend-deploy.yml` | **Sem alterações** — validado como canónico (ver secção abaixo). |

### Validação de `frontend-deploy.yml` (ETAPA 5)

| Critério | Estado |
|----------|--------|
| Deploy produção com `vercel-action` (`amondnet/vercel-action@v25`) | Sim |
| `vercel-args` de produção **sem** `--yes` (usa `--prod` apenas) | Sim; comentário no YAML explica não usar `--yes` na CLI |
| Smoke test HTTP (`www` + apex) | Sim, job `deploy-production` |
| `notify vercel` (`vercel/repository-dispatch/actions/status@v1`, `name: vercel-deploy`) | Sim, `if: always()` |
| `vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}` | Sim |

---

## Workflows neutralizados

- **`main-pipeline.yml`:** já não publica o player em produção por CLI Vercel.
- **`deploy-on-demand.yml`:** player deixa de receber deploy **`--prod`**; apenas **preview**.
- **`rollback.yml`:** já não promove automaticamente um deployment Vercel anterior para produção.
- **`health-monitor.yml`:** já não empurra commits para `main` (evita `push` que relançava outros workflows).

---

## Novo fluxo oficial

1. **Produção do player (`www` / apex):** apenas quando corre **`.github/workflows/frontend-deploy.yml`** na `main`, com alterações em `goldeouro-player/**` ou no próprio workflow (conforme `paths`).
2. **Pipeline principal (`main-pipeline.yml`):** continua a fazer deploy **Fly.io**; frontend na mensagem final continua a referir o URL público como informação, não como passo de deploy.
3. **On-demand:** backend Fly inalterado; player gera **preview** no Vercel.
4. **Rollback automático:** só **backend** (Fly); frontend manual / `frontend-deploy` / dashboard.

---

## Garantias de segurança

- **Backend (Fly.io)** não foi alterado nos passos de deploy (apenas removido Vercel e Node extra no rollback).
- **Monitoramento:** health-monitor mantém curls e artifacts; só deixou de alterar o histórico Git no remoto.
- **Código do player** não foi tocado.

---

## Riscos residuais

1. **Integração Git ↔ Vercel (painel):** pushes à `main` podem continuar a gerar deployments de produção **fora** destes workflows — mitigação é política no Vercel, não só YAML.
2. **Segredos:** `VERCEL_PROJECT_ID` no `frontend-deploy` deve estar correto (`prj_…`) para o deploy canónico funcionar.
3. **`deploy-on-demand`:** usa `VERCEL_PROJECT_ID_PLAYER`; deve apontar ao **mesmo** projeto que o canónico se o preview for do mesmo repositório, ou um projeto de staging — configurado nos secrets.
4. **`notify vercel`:** depende de integração Checks; não alterado nesta cirurgia.
5. **Health monitor:** deixou de persistir relatórios em `main`; histórico passa a depender de **artifacts** e logs do Actions.

---

## Referências

- `docs/relatorios/AUDITORIA-FINAL-ANTES-CIRURGIA-UNIFICACAO-PIPELINE-2026-04-02.md`
- `docs/relatorios/AUDITORIA-WORKFLOWS-FRONTEND-INTERFERENCIA-2026-04-02.md`
