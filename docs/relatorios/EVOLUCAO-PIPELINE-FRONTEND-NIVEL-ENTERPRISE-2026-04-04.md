# EVOLUÇÃO DO PIPELINE FRONTEND — NÍVEL ENTERPRISE

## 1. Resumo executivo

O job `🚀 Deploy Produção` em `.github/workflows/frontend-deploy.yml` foi reforçado com um **gate explícito** após o deploy Vercel (URL de deployment obrigatória + registo em `GITHUB_STEP_SUMMARY`), **smoke HTTP** com seguimento de redirects (`curl -fsSL`), **health check** adicional (HTTP 200 final após redirects, corpo descomprimido com `--compressed`, validação mínima de HTML), **outputs do job** (`deploy-sha`, `deploy-url`) e **resumo final** apenas se toda a cadeia passar.

Foi criado o workflow manual **`frontend-rollback-manual.yml`** (Vercel CLI 50, confirmação `ROLLBACK`, smoke pós-rollback com `-L`). O `rollback.yml` existente continua **sem** rollback automático do frontend; a mensagem de log foi alinhada para apontar o novo caminho manual.

Correção pontual após o primeiro deploy enterprise: o apex `https://goldeouro.lol/` devolvia **307** sem `-L` no health; o smoke já tolerava o comportamento anterior do `curl -f`; alinhou-se **`-L`** e **`--compressed`** para critérios estáveis (PR #44).

## 2. Auditoria do estado anterior

| Pergunta | Resposta |
|----------|----------|
| **A. Gate existente** | **Fato:** `needs: test-frontend`, verificação de tokens, deploy via `amondnet/vercel-action`, smoke www+apex com retries, sem `continue-on-error` no deploy. **Não havia:** verificação de URL de deployment não vazia, health semântico além do smoke, outputs do job, sumário estruturado de evidências. |
| **B. Falta enterprise** | **Hipótese:** gate explícito pós-deploy, rastreabilidade em `GITHUB_STEP_SUMMARY`, health alinhado a redirects/gzip, rollback documentado e acionável sem “promote” automático opaco. |
| **C. Reaproveitamento** | **Fato:** `health-monitor.yml` já faz polling HTTP ao frontend; `main-pipeline.yml` / `backend-deploy.yml` usam `/health` do **backend** (Fly) — não foram alterados. O smoke e os domínios canónicos foram **reutilizados e endurecidos** (`-L`). |
| **D. Evitar** | **Risco:** reativar rollback automático de frontend no `rollback.yml`; duplicar deploy em `deploy-on-demand.yml` para produção; health checks que falhem por **gzip** ou **307** sem seguir redirects; alterar código do player ou backend sem necessidade. |

## 3. Melhorias aplicadas

1. **Outputs do job** `deploy-production`: `deploy-sha`, `deploy-url` (via step `deploy_evidence`).
2. **Step “Gate — evidências obrigatórias”:** falha se `preview-url` estiver vazio; grava `GITHUB_OUTPUT` e **`GITHUB_STEP_SUMMARY`** com Run ID, SHA, ref, URL Vercel, domínios.
3. **Smoke:** `curl -fsSL` em www e apex (segue redirects até resposta final).
4. **Health:** `curl -sSL --compressed` + código **200** final + `grep` insensível a maiúsculas para `<html` ou `<!DOCTYPE`.
5. **Resumo final:** `if: success()` apenas após health; referência ao workflow de rollback manual.
6. **Novo workflow** `frontend-rollback-manual.yml`: `workflow_dispatch`, input `confirm` = `ROLLBACK`, opcional `deployment_target`, `npx vercel@50.38.3 rollback`, smoke pós-rollback com `-L`.
7. **`rollback.yml`:** texto atualizado a referir `frontend-rollback-manual.yml`.

**Integração:** PR #43 (hardening inicial), PR #44 (correção health/smoke apex + gzip).

## 4. Estratégia de rollback

- **Automático (frontend):** permanece **desativado** no `rollback.yml` (decisão pré-existente; apenas mensagem atualizada).
- **Manual controlado:** workflow **🔙 Frontend — rollback manual (Vercel)** (`frontend-rollback-manual.yml`):
  1. Actions → workflow → “Run workflow”.
  2. Preencher **`confirm`** com exatamente `ROLLBACK`.
  3. Opcionalmente **`deployment_target`** (URL ou ID Vercel); vazio = rollback para o deployment de produção **imediatamente anterior** (semântica da CLI Vercel; limites de plano aplicam-se no painel Vercel).
  4. Validar smoke pós-rollback (www + apex) no próprio job.

**Nota:** a primeira execução real em incidente deve ser feita em janela controlada; este repositório **não** executou rollback contra produção na validação de 2026-04-04 (apenas deploy + health + smoke).

## 5. Teste controlado

| Run | Evento | ID | Conclusão | Notas |
|-----|--------|-----|-----------|--------|
| Merge PR #43 | `push` | `23980612593` | **failure** | Health falhou: apex HTTP **307** sem `-L` no health (corrigido na PR #44). Deploy e smoke passaram; evidências e gate de URL OK. |
| Merge PR #44 | `push` | `23980726132` | **success** | Deploy + gate + smoke + health + resumo. |
| Manual | `workflow_dispatch` | `23980761562` | **success** | HEAD `51e17515bccbd01785330c12cc5393130fe9b660`. |

Evidências: `::notice` com SHA, URL Vercel e `run_id`; sumário do job com tabela Markdown; logs agrupados com `::group::` no smoke e no health.

## 6. Garantias adicionadas

- Produção **não** avança para “sucesso de negócio” sem **URL de deployment** válida no output da action.
- Smoke e health exigem **200** na resposta **final** após redirects, com corpo HTML legível (gzip descomprimido no health).
- **Rastreabilidade** explícita (SHA, Run ID, URL) no sumário do GitHub Actions.
- **Caminho de reversão** documentado e acionável via workflow manual (sem reabrir rollback automático opaco no `rollback.yml`).

## 7. Riscos remanescentes

- **Rollback manual** não foi **exercido** contra produção nesta validação (apenas definido e revisto por sintaxe).
- **Plano/limites Vercel** podem restringir rollback a “deployment anterior” apenas (documentação Vercel).
- **Health por HTML mínimo** não substitui testes E2E nem validação de conteúdo dinâmico da SPA após hidratação.
- Avisos do runner (Node 20 nas actions; anotações `git` 128) persistem sem bloquear o job de deploy.

## 8. Classificação final

**PIPELINE ENTERPRISE VALIDADO COM RESSALVAS**

*(Ressalva principal: rollback manual preparado mas não executado em produção nesta bateria de testes.)*

## 9. Conclusão objetiva

O pipeline canónico do frontend passou a ter **camadas explícitas** de gate (evidências), smoke e health **coerentes com redirects e gzip**, mais **outputs** para integrações futuras e um **workflow de rollback manual** alinhado à CLI Vercel 50. O nível de maturidade é **enterprise-grade operacional** para deploy e verificação pós-deploy; a disciplina de **rollback em incidente** fica **procedimentalmente pronta**, devendo ser **ensaiada** quando houver janela segura.
