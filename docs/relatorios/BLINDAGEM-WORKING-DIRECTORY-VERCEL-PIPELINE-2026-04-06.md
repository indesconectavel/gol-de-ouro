# BLINDAGEM WORKING DIRECTORY — VERCEL PIPELINE

**Projeto:** Gol de Ouro — `goldeouro-player`  
**Data:** 2026-04-06  
**Ficheiro alterado:** `.github/workflows/frontend-deploy.yml` (job Deploy Produção, step `📤 Deploy Vercel (produção)`)

---

## 1. Problema identificado

O job de produção executava `npm ci` e `npm run build` dentro de `goldeouro-player/`, mas o passo de deploy com `amondnet/vercel-action@v25` **não** fixava o diretório de trabalho do contexto de deploy. Isso criava **ambiguidade** entre o local onde o artefacto é gerado e o directório a partir do qual a CLI Vercel resolve `vercel.json` e o contexto de deploy, em monorepo sem `vercel.json` na raiz.

---

## 2. Evidência

- O erro observado em produção foi deep link SPA **404** em `https://www.goldeouro.lol/dashboard` com **`x-vercel-error: NOT_FOUND`**, enquanto o contrato SPA exige servir `index.html` para rotas de cliente.
- **Ficheiro:** `goldeouro-player/vercel.json` — **correcto** para SPA (rewrites catch-all, `outputDirectory` `dist`).
- **Project Settings** na Vercel: **Root Directory** já configurado como `goldeouro-player` (referência operacional).
- **Workflow:** o deploy de produção **não** explicitava `working-directory` no step da action, ao contrário de outro workflow no repositório que já usa `./goldeouro-player` para o mesmo tipo de action.

---

## 3. Risco técnico

- **Aplicação não determinística** do `vercel.json` versionado relativamente ao cwd do processo de deploy na CLI.
- **Drift** entre configuração versionada no subdirectório do player e o snapshot efectivo de routing no edge.
- **Falha de deep links** (gate de blindagem em CI) e experiência de utilizador quebrada em URLs partilhadas fora de `/`.

---

## 4. Solução aplicada

No step **📤 Deploy Vercel (produção)** de `frontend-deploy.yml`, foi adicionado **`working-directory: ./goldeouro-player`** ao bloco `with:` de `amondnet/vercel-action@v25`, mantendo `vercel-token`, `vercel-org-id`, `vercel-project-id`, `vercel-version` e `vercel-args: '--prod'` inalterados.

---

## 5. Impacto esperado

- **Maior determinismo:** o deploy de produção corre a partir do mesmo directório que contém `vercel.json` e o build local do job.
- **Alinhamento** explícito monorepo ↔ contexto de invocação da CLI no runner.
- **Redução do risco** de `NOT_FOUND` em rotas SPA por desalinhamento de contexto no passo de deploy.
- **Blindagem** do pipeline enterprise: o gate de deep links continua a ser a prova no domínio; o cwd passa a ser explícito no pipeline.

---

## 6. Classificação final

**BLINDAGEM DEFINITIVA DE CONTEXTO DE DEPLOY**

---

*Fim do relatório.*
