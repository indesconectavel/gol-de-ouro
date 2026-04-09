# MERGE CONTROLADO — PR #55 — GOL DE OURO PLAYER

## 1. Resumo executivo

O [Pull Request #55](https://github.com/indesconectavel/gol-de-ouro/pull/55) foi integrado em `main` por **merge commit** (sem squash e sem rebase), após confirmação de estado **aberto**, **mergeável** e **`mergeable_state: clean`**, sem falhas novas nos checks consultados. O ramo `main` local e `origin/main` foram sincronizados no **SHA** `d72e21d0fb39959ad4856c3e839d5c8c7bafd34b`. Não foram alterados aliases Vercel nem disparado deploy adicional no âmbito desta operação (apenas merge via GitHub CLI).

## 2. Estado do PR antes do merge

| Campo | Valor |
|--------|--------|
| Número | 55 |
| URL | https://github.com/indesconectavel/gol-de-ouro/pull/55 |
| Título | fix(vercel): remover cleanUrls e alinhar fallback SPA com produção |
| Estado | `OPEN` |
| `mergeable` | `true` |
| `mergeable_state` (REST) | `clean` |
| `mergeStateStatus` (GraphQL) | `CLEAN` |
| Draft | não |
| Checks | sem linhas `fail` na saída de `gh pr checks` no momento da confirmação |

## 3. Operação de merge executada

- **Comando:** `gh pr merge 55 --repo indesconectavel/gol-de-ouro --merge`
- **Estratégia:** merge commit normal (histórico preservado; não squash; não rebase).
- **Commit de merge (GitHub):** `d72e21d0fb39959ad4856c3e839d5c8c7bafd34b`
- **Horário de merge (API):** `2026-04-09T00:47:45Z` (UTC)

## 4. SHA final do `main`

| Referência | SHA |
|------------|-----|
| `HEAD` (local, após `git pull`) | `d72e21d0fb39959ad4856c3e839d5c8c7bafd34b` |
| `origin/main` | `d72e21d0fb39959ad4856c3e839d5c8c7bafd34b` |

Sincronização executada: `git fetch origin main`, `git checkout main`, `git pull origin main` (fast-forward `992ff8f..d72e21d`).

## 5. Paridade `main` vs produção

- **`goldeouro-player/vercel.json` em `main`:** não contém `cleanUrls` (verificação por pesquisa no ficheiro no working tree após pull — nenhuma ocorrência de `cleanUrls`).
- **Conteúdo do merge:** alinhado ao pacote auditado (4 ficheiros: `vercel.json`, dois relatórios em `docs/relatorios/`, `.github/workflows/configurar-seguranca.yml`).
- **Produção:** o contexto operacional pré-merge indicava que o comportamento desejado já estava refletido no edge; com `main` atualizado, o **drift crítico de configuração** (`cleanUrls` em `main` vs produção corrigida) fica **eliminado** ao nível do repositório. Deploy automático adicional não faz parte deste relatório.

## 6. Riscos remanescentes

- **Baixo** para regressão de routing SPA: alteração é remoção de `cleanUrls` e documentação; CI já tinha passado no PR.
- **Validação pós-merge** em URLs reais e preview/produção continua recomendada (smoke em rotas críticas).
- Workflows ou gates futuros em `main` podem voltar a executar em novos pushes; não há impacto direto deste merge sobre aliases Vercel.

## 7. Pode seguir para validação pós-merge?

**Sim.** O merge está concluído, `main` está no SHA indicado e o `vercel.json` em `main` reflete o fix. Recomenda-se validação manual curta (rotas `/`, `/game`, `/dashboard`, etc.) no ambiente de produção ou preview conforme processo interno, sem obrigatoriedade técnica adicional imposta por este documento.
