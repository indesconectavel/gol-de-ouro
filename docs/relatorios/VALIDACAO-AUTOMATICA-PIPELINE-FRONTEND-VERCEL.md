# Validação automática — pipeline Frontend Deploy (Vercel)

Data de referência: 2026-04-02 (UTC).

## Execução

| Campo | Valor |
|--------|--------|
| Branch usada (integração) | `main` |
| Branch de trabalho (PR) | `ci/workflow-dispatch-frontend-deploy` |
| Commit SHA (HEAD em `main` no disparo) | `d9b8edf7eadbc536e59e47a7551322a12ff67093` |
| Tipo de trigger (teste solicitado) | `workflow_dispatch` |
| Run ID (GitHub Actions) | `23922171726` |
| URL do run | https://github.com/indesconectavel/gol-de-ouro/actions/runs/23922171726 |
| Duração aproximada | ~1 min 44 s (criado 21:10:39Z → concluído 21:12:23Z) |

**Pull request:** https://github.com/indesconectavel/gol-de-ouro/pull/36 — merge em `main` concluído após checks obrigatórios.

## Resultado

| Item | Valor |
|------|--------|
| Status do workflow (run `workflow_dispatch`) | `completed` / conclusão **`failure`** |
| Job que falhou | `🚀 Deploy Produção` — step `📤 Deploy Vercel (produção)` |
| Deploy realizado pelo **step** Actions (produção `--prod`)? | **NÃO** (CLI saiu com código 1) |
| Observação adicional | O merge do PR #36 também disparou o workflow por **push** (alteração em `.github/workflows/frontend-deploy.yml` está nos `paths` do trigger); esse run (`23922161257`) também concluiu com **`failure`** no mesmo job de produção. |

## Diagnóstico

### Texto “Project not found” nos logs

**NÃO** — a busca nos logs da falha (`gh run view … --log-failed`) não encontrou a string `Project not found`.

### Erro observado (origem)

1. Aviso do Vercel CLI: *“The vercel.json file should be inside of the provided root directory.”* (contexto: `working-directory: goldeouro-player` na action.)
2. Erro fatal reportado pelo CLI: *“Error! Unexpected error. Please try again later. ()”* — origem **lado Vercel / CLI durante o build/deploy**, não autenticação explícita nem “projeto inexistente” no texto do log analisado.
3. Step de Git no job de testes (anotação no run): *“The process '/usr/bin/git' failed with exit code 128”* — presente como aviso no resumo do run; o job `🧪 Testes Frontend` marcou sucesso neste run.

### Smoke test HTTP (fora do Actions)

| URL | Resultado (HEAD) |
|-----|------------------|
| https://www.goldeouro.lol | **200** |
| https://goldeouro.lol | **200** |

*Nota:* resposta 200 indica que os domínios estão acessíveis no momento do teste; não prova que o deploy deste run específico os atualizou (o deploy via Actions falhou antes de concluir produção).

## Conclusão

- **`workflow_dispatch`** está presente em `.github/workflows/frontend-deploy.yml`, commitado e integrado em **`main`** (PR #36).
- O disparo manual via API/CLI (`gh workflow run`) **foi executado** e produziu run rastreável.
- O pipeline **não** concluiu com sucesso o deploy de **produção** neste run: falha no step Vercel CLI.

**Classificação:** **PIPELINE BLOQUEADO** (deploy de produção via GitHub Actions falhou; `workflow_dispatch` e integração em `main` estão OK).
