# CORREÇÃO DO BLOQUEIO VERCEL CLI — FRONTEND DEPLOY

## 1. Resumo executivo

O deploy de produção falhava no step `📤 Deploy Vercel (produção)` por **dois fatores combinados**:

1. **`amondnet/vercel-action@v25`** invoca por omissão **`vercel@25.1.0`**, desatualizado face à API atual da Vercel — sintoma típico: aviso sobre `vercel.json` / root e erro genérico `Unexpected error` durante o build remoto.
2. Com **CLI 50+**, ao manter **`working-directory: goldeouro-player`** num repositório cujo projeto Vercel já define **Root Directory = `goldeouro-player`**, o caminho efetivo duplicava-se (`…/goldeouro-player/goldeouro-player`), gerando erro explícito de path inexistente.

Correção: fixar **`vercel-version: '50.38.3'`** nos dois usos da action e **remover `working-directory`** desses steps (mantendo build/`npm ci` em `goldeouro-player` nos passos anteriores). O CLI passa a correr na raiz do checkout; o subdiretório vem só das definições do projeto no dashboard.

## 2. Diagnóstico técnico

| Tópico | Fato |
|--------|------|
| `vercel.json` | Presente em `goldeouro-player/vercel.json`, coerente com app Vite (`dist`, rewrites, headers). |
| `.vercel/project.json` | Não versionado no repo (esperado em CI com `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`). |
| `working-directory` (antes) | `goldeouro-player` nos steps `amondnet/vercel-action` — correto para “app local”, mas **conflita** com Root Directory igual no painel Vercel quando o CLI resolve caminhos de projeto. |
| Action | `amondnet/vercel-action@v25` com `options.cwd = working-directory` e `npx vercel@…` (versão explícita ou fallback `25.1.0` na dependência da action). |
| Evidência (CLI 25) | Logs: aviso *“The vercel.json file should be inside of the provided root directory.”* e *“Error! Unexpected error. Please try again later. ()”*. |
| Evidência (CLI 50 + cwd antigo) | *“The provided path …/goldeouro-player/goldeouro-player does not exist.”* |

**Risco (mitigado):** alterar apenas a action sem alinhar cwd poderia manter falha; alinhar cwd sem atualizar CLI manteria incompatibilidade de API.

**Hipótese inicial parcial:** o problema era só `vercel.json`/root — **refinada** após o primeiro merge (PR #38): a causa dominante de path foi a **duplicação Root Directory + `working-directory`**.

## 3. Correção aplicada

Ficheiro: `.github/workflows/frontend-deploy.yml`

- Nos steps **📤 Deploy Vercel (produção)** e **🔐 Configurar Vercel (Dev)**:
  - `vercel-version: '50.38.3'`
  - remoção de `working-directory: goldeouro-player`

Sem alteração de secrets, de jobs de build/teste do player, de backend ou de outros workflows.

## 4. Commit e integração

| Item | Detalhe |
|------|---------|
| PR #38 | [ci: alinha Vercel CLI no frontend-deploy](https://github.com/indesconectavel/gol-de-ouro/pull/38) — adiciona `vercel-version`. |
| PR #39 | [ci: corrige cwd do vercel-action vs Root Directory](https://github.com/indesconectavel/gol-de-ouro/pull/39) — remove `working-directory` dos deploys. |
| Merge | Ambos integrados em `main`. |
| HEAD de referência (testes abaixo) | `d10d6c8734a749965608382ded77bb0ea615b241` |

## 5. Teste controlado

| Run | Trigger | ID | Conclusão | Notas |
|-----|---------|-----|-----------|--------|
| Push pós-merge PR #39 | `push` | `23923449517` | **success** | `📤 Deploy Vercel (produção)` OK; `🧪 Smoke test HTTP (prod)` OK. |
| Manual | `workflow_dispatch` | `23923532565` | **success** | Deploy `target production`, aliases incluem `www.goldeouro.lol` e `goldeouro.lol`; smoke na 1.ª tentativa. |

Logs do deploy manual: sem a mensagem *“vercel.json file should be inside…”*; upload + build remoto + `status ● Ready`.

## 6. Veredito final

**DEPLOY CANÔNICO VALIDADO**

## 7. Conclusão objetiva

O workflow **🎨 Frontend Deploy (Vercel)** em `main` conclui o step **`📤 Deploy Vercel (produção)`** com sucesso, publica para **produção** na Vercel e o **smoke test** HTTP em `https://www.goldeouro.lol` e `https://goldeouro.lol` passa. Avisos anexos do runner (Node 20 em actions; `git` exit 128 em alguns jobs) permanecem como ruído conhecido e **não bloqueiam** este pipeline.
