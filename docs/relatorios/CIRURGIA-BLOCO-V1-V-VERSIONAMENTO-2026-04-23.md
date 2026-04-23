# CIRURGIA — BLOCO V1 – V (VERSIONAMENTO)

**Data:** 2026-04-23  
**Modo:** diff preparado para revisão externa — **sem** commit, tag, push ou deploy na execução desta tarefa.

## Objetivo

Tornar o backend **rastreável** até um commit Git via imagem Docker e runtime, sem alterar lógica de negócio (PIX, saldo, shoot, auth, frontend, base de dados).

## Alterações realizadas

### 1. `Dockerfile`

- `ARG GIT_COMMIT=` (vazio se não for passado o *build-arg*).
- `ENV GIT_COMMIT=${GIT_COMMIT}` — disponível em `server-fly.js` em runtime.
- `LABEL org.opencontainers.image.revision="${GIT_COMMIT}"` — convenção OCI para auditoria de imagem.

### 2. `server-fly.js`

- Endpoint `GET /meta`: acrescenta `data.gitCommit` a partir de `process.env.GIT_COMMIT` (string não vazia) ou `null` se ausente (build local sem *build-arg*, imagem antiga, etc.).
- Outros campos de `/meta` mantidos (incl. `version` e `build` legados) para compatibilidade.

### 3. `.github/workflows/backend-deploy.yml`

- `flyctl deploy ... --build-arg GIT_COMMIT="${{ github.sha }}"` nos passos de deploy **produção** (`main`) e **dev** (`dev`).
- Removido `continue-on-error: true` **apenas** dos passos "Deploy para Fly.io" e "Deploy para desenvolvimento" — se o *deploy* falhar, o job falha (deixa de ser mascarado).
- **Não alterado:** `continue-on-error: true` no passo "Teste de saúde" pós-deploy (fora do escopo estrito do *deploy*; pode ser revisto noutro PR).

### 4. `deploy-on-demand.yml`

- **Não modificado** nesta cirurgia (fora do escopo explícito de ficheiros). Deploys *on-demand* continuam sem `GIT_COMMIT` na imagem até alinhamento futuro.

## Verificações recomendadas antes de merge

- `node --check server-fly.js`
- Build local: `docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -t gdo-test .` e inspecionar `GET /meta` (ou `docker inspect` para `Labels`).
- Após deploy real: `curl -sS https://<app>.fly.dev/meta | jq .data.gitCommit` deve refletir o `github.sha` do run.

## Riscos

- Workflows de produção passam a **falhar em vermelho** se o *deploy* Fly falhar (comportamento desejado para governança).
- Imagens feitas **sem** `--build-arg` terão `gitCommit: null` em `/meta` até novo deploy com pipeline atualizado.

## Classificação pós-revisão

- Estado do diff: **PRONTO PARA REVISÃO** (pendente de aprovação humana e de merge/deploy oficiais).

---

*Ficheiros tocados: `Dockerfile`, `server-fly.js`, `.github/workflows/backend-deploy.yml`, este relatório.*
