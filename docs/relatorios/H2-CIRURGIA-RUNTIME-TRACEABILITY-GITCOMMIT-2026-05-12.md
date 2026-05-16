# H2 — CIRURGIA RUNTIME TRACEABILITY — GITCOMMIT

**Data:** 2026-05-12  
**Branch:** `fix/admin-financial-integrity-v1`  
**Tag de segurança (pré-cirurgia):** `pre-h2-runtime-traceability-2026-05-12` → `77464f5a263f2f2c0fd5ae311277732d69815f72`  
**Relatórios-base:** `H2-DIAGNOSTICO-*`, `H2-PRE-EXECUCAO-*`, `H2-PREPARACAO-AUTOMATICA-*` (2026-05-12).

---

## 1. Resumo executivo

Foi corrigida a lacuna em **`.github/workflows/deploy-on-demand.yml`**: o passo de deploy Fly passa agora **`--build-arg GIT_COMMIT="${{ github.sha }}"`**, alinhado a `backend-deploy.yml` e `main-pipeline.yml`. O runbook **`.cursor/commands/deploy-producao.md`** foi atualizado com o **comando manual oficial** (Bash e PowerShell), app **`goldeouro-backend-v2`**, URLs de health/meta corretas e menção explícita à necessidade do *build-arg* para popular `/meta`.

**Não** foram alterados `server-fly.js`, `Dockerfile`, player, admin, `goldeouro-player/vercel.json`, nem foi executado deploy.

---

## 2. Baseline usada

| Referência | SHA / nota |
|------------|------------|
| `HEAD` antes do commit desta cirurgia | `77464f5` (*docs: preparar baseline H2 runtime traceability*) |
| Tag | `pre-h2-runtime-traceability-2026-05-12` → mesmo commit |

---

## 3. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `.github/workflows/deploy-on-demand.yml` | Acrescentado `--build-arg GIT_COMMIT="${{ github.sha }}"` ao `flyctl deploy`. |
| `.cursor/commands/deploy-producao.md` | Checklist e bloco “Comandos úteis” com deploy manual + PowerShell + URLs `goldeouro-backend-v2`. |
| `docs/relatorios/H2-CIRURGIA-RUNTIME-TRACEABILITY-GITCOMMIT-2026-05-12.md` | Este relatório. |

---

## 4. Correção aplicada no workflow

**Ficheiro:** `.github/workflows/deploy-on-demand.yml`  
**Job:** `deploy-backend-flyio` → step “Deploy Backend”.

**Linha efetiva (resumo):**

```text
flyctl deploy --config fly.toml --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="${{ github.sha }}"
```

- Mantidos: `fly.toml`, `--remote-only`, app `goldeouro-backend-v2`, autenticação por token existente.

---

## 5. Deploy manual oficial documentado

**Local:** `.cursor/commands/deploy-producao.md`

| Ambiente | Comando |
|----------|---------|
| **Bash / Git Bash** | `fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="$(git rev-parse HEAD)"` |
| **PowerShell** | `$sha = git rev-parse HEAD; fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT=$sha` |

**Verificação sugerida no mesmo runbook:** `curl` a `/health` e `/meta` em `https://goldeouro-backend-v2.fly.dev/`.

---

## 6. Arquivos preservados fora do escopo

- `server-fly.js`, `Dockerfile`, `fly.toml`
- `goldeouro-player/vercel.json` e restantes ficheiros do player/admin
- `backend-deploy.yml`, `main-pipeline.yml` (já corretos; sem alteração)
- Base, migrations, PIX, scripts soltos, restantes `??` no working tree

---

## 7. Validações locais

| Verificação | Resultado |
|-------------|-----------|
| `git diff` | Apenas os 2 ficheiros de configuração/runbook acima + este relatório (antes do commit). |
| YAML (`deploy-on-demand.yml`) | `yaml.safe_load` (Python/PyYAML) → **YAML_OK**. |
| `server-fly.js` / `Dockerfile` | Sem alterações no *diff*. |
| `goldeouro-player/vercel.json` | Continua `M` local; **não** incluído no commit da cirurgia. |

---

## 8. Riscos remanescentes

- Outros documentos ou scripts na árvore ainda podem mencionar `fly deploy` **sem** `--build-arg` (higiene futura).
- **`/meta`** só deixa de devolver `gitCommit: null` **após** um novo deploy Fly que construa imagem com o *build-arg* — esta cirurgia **não** incluiu deploy.

---

## 9. Próxima etapa obrigatória

1. **Commit + push** desta cirurgia (branch `fix/admin-financial-integrity-v1`) quando aprovado.  
2. **Execução controlada de runtime:** deploy Fly (CI on-demand ou manual com comando do runbook) e validar `GET /meta` → `data.gitCommit` não nulo e igual ao SHA esperado.  
3. Opcional: relatório `EXECUCAO-CONTROLADA-RUNTIME-H2-...` com evidências `curl`.

---

## 10. Classificação final

**PRONTO PARA EXECUÇÃO CONTROLADA DE RUNTIME**

Critérios do pedido cumpridos: workflow on-demand com `--build-arg GIT_COMMIT=${{ github.sha }}`; comando manual documentado; `Dockerfile` e `server-fly.js` intocados; `vercel.json` fora do commit; sem deploy nesta etapa; relatório criado.

---

*Fim do relatório de cirurgia H2.*
