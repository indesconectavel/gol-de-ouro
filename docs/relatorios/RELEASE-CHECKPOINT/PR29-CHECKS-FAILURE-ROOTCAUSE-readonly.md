# Auditoria READ-ONLY — Causa raiz dos checks falhos do PR #29

**Data:** 2026-02-06  
**Modo:** READ-ONLY (nenhum arquivo editado; apenas coleta de evidências e relatório).  
**PR:** [#29](https://github.com/indesconectavel/gol-de-ouro/pull/29) — Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only

---

## 1) Confirmação do PR e checks

| Campo | Valor |
|-------|--------|
| number | 29 |
| url | https://github.com/indesconectavel/gol-de-ouro/pull/29 |
| title | Release: PIX UI + saldo insuficiente UX (CHANGE 2/3/4) - frontend only |
| headRefName | feat/payments-ui-pix-presets-top-copy |
| baseRefName | main |

**Checks com conclusão FAILURE:**
- **🧪 Testes Frontend** (workflow: 🎨 Frontend Deploy (Vercel)) — detailsUrl: https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739371587/job/62711444457  
- **CodeQL** — detailsUrl: https://github.com/indesconectavel/gol-de-ouro/runs/62711540702  

---

## 2) Workflow "🎨 Frontend Deploy (Vercel)" — check 🧪 Testes Frontend

### Run utilizado

- **Workflow run ID:** 21739371587  
- **Link:** https://github.com/indesconectavel/gol-de-ouro/actions/runs/21739371587  
- **Log salvo (local):** `docs/relatorios/RELEASE-CHECKPOINT/PR29-frontend-tests-failure.log`

### Step que falhou

- **Nome do step:** 🔍 Análise de segurança frontend  
- **Arquivo do workflow:** `.github/workflows/frontend-deploy.yml` (steps do job "🧪 Testes Frontend")  
- **Comando executado:** `cd goldeouro-player && npm audit --audit-level=moderate`

### Erro principal (trecho do log)

```text
# npm audit report
...
11 vulnerabilities (4 moderate, 7 high)
...
##[error]Process completed with exit code 1.
```

O step **não** usa `continue-on-error`; quando `npm audit --audit-level=moderate` encontra vulnerabilidades de nível moderate ou superior, o npm sai com código 1 e o job falha.

### Pacotes citados no audit (exemplos do log)

- @isaacs/brace-expansion (high)  
- @remix-run/router / react-router-dom (high)  
- esbuild (moderate)  
- glob (high)  
- js-yaml (moderate)  
- lodash (moderate)  
- tar (high, via @capacitor/cli)  

### Diagnóstico provável

A falha do check **🧪 Testes Frontend** deve-se ao step **"🔍 Análise de segurança frontend"**: o workflow exige que `npm audit --audit-level=moderate` passe, mas em `goldeouro-player` há 11 vulnerabilidades (4 moderate, 7 high), então o comando retorna exit 1 e o job falha. Não é falha de build, testes unitários nem ESLint — é exclusivamente o audit de segurança.

### Próximo passo mínimo (sugestão, sem executar)

1. **Opção A (rápida):** No workflow `.github/workflows/frontend-deploy.yml`, no step "🔍 Análise de segurança frontend", usar `continue-on-error: true` (como em `security.yml`) ou trocar para `npm audit --audit-level=high` para que apenas high/critical falhem o step.  
2. **Opção B (corretiva):** Em `goldeouro-player`, rodar `npm audit fix` (ou `npm audit fix --force` com cuidado) e commitar as alterações em `package-lock.json` (e em `package.json` se houver mudança de versão) para reduzir/eliminar as vulnerabilidades e fazer o step passar sem relaxar o nível de audit.

---

## 3) CodeQL — check CodeQL

### Run / log

- **DetailsUrl do check:** https://github.com/indesconectavel/gol-de-ouro/runs/62711540702  
- O ID `62711540702` corresponde a um **check run** (job), não ao **workflow run**. O comando `gh run view 62711540702 --log` retornou **404** (Not Found).  
- **Log salvo (local):** `docs/relatorios/RELEASE-CHECKPOINT/PR29-codeql-failure.log` — contém apenas nota explicando que o log não foi obtido via `gh run view` e o link para abrir no navegador.

### Erro principal

Não foi possível extrair do CLI. Para ver a causa exata: abrir no navegador  
**https://github.com/indesconectavel/gol-de-ouro/runs/62711540702**

### Contexto no repositório

- O workflow **🔒 Segurança e Qualidade** (`.github/workflows/security.yml`) inclui steps de CodeQL (init, autobuild, analyze) com `continue-on-error: true`, então falhas nesses steps não costumam falhar o job.  
- O check "CodeQL" que aparece no PR pode vir de **Code scanning** padrão do GitHub (Security tab), com workflow próprio, ou de outro workflow. Não há arquivo dedicado `codeql.yml` na lista de workflows do repo.

### Diagnóstico provável

Sem o log, só é possível estimar: falhas comuns do CodeQL incluem **autobuild** não conseguir construir o projeto (ex.: monorepo, paths, linguagem), **configuração** (linguagens, queries), **permissões** ou **timeout**. Ver o run no link acima é necessário para a causa exata.

### Próximo passo mínimo (sugestão, sem executar)

1. Abrir https://github.com/indesconectavel/gol-de-ouro/runs/62711540702 e identificar o step que falhou e a mensagem de erro.  
2. Se for autobuild: ajustar configuração do CodeQL para o monorepo (ex.: `paths` para o código relevante) ou adicionar step de build explícito antes do autobuild.  
3. Se for análise/query: ajustar `config-file` ou variáveis do action conforme a mensagem.

---

## 4) Resumo

| Check | Step que falhou | Causa raiz (evidência) | Arquivo/etapa |
|-------|------------------|-------------------------|---------------|
| 🧪 Testes Frontend | 🔍 Análise de segurança frontend | `npm audit --audit-level=moderate` sai com 1 por 11 vulnerabilidades (4 moderate, 7 high) em `goldeouro-player` | `.github/workflows/frontend-deploy.yml` — step "Análise de segurança frontend"; comando: `npm audit --audit-level=moderate` em `goldeouro-player` |
| CodeQL | (não identificado sem log) | Log não obtido (run ID do check ≠ workflow run ID) | Ver link do run no navegador |

---

## 5) Logs salvos

| Arquivo | Conteúdo | Tamanho (aprox.) |
|---------|----------|-------------------|
| `docs/relatorios/RELEASE-CHECKPOINT/PR29-frontend-tests-failure.log` | Log completo do run 21739371587 (Frontend Deploy) | ~36 KB |
| `docs/relatorios/RELEASE-CHECKPOINT/PR29-codeql-failure.log` | Nota de que o log não foi obtido + link do run | < 1 KB |

---

## 6) Confirmação READ-ONLY

Nenhum arquivo de código ou de configuração foi alterado. Nenhum commit nem push foi realizado. Apenas coleta de evidências (gh pr view, gh run list, gh run view --log) e geração deste relatório e dos arquivos de log/nota acima.

---

*Relatório gerado em 2026-02-06.*
