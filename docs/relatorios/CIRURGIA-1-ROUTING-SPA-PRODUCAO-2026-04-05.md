# CIRURGIA 1 — ROUTING SPA EM PRODUÇÃO

**Data:** 2026-04-05  
**Checkpoint Git pré-cirúrgico:** tag `pre-cirurgia-routing-spa-producao-2026-04-05` → commit `45291ad56f3e257a8dfd4403bba68434d3f2a10c`  
**Baseline visual (referência):** `baseline-player-validada-p3dBCTxRr-2026-04-02` → commit `a3fff5ed93690f39e6083e0b78c921276ce2c57b`; deployment `dpl_p3dBCTxRrmyHBnsovJaT5n2UpWfd`

---

## 1. Resumo executivo

Foi executada a **validação de pré-condições operacionais** e **evidência HTTP** sobre `https://www.goldeouro.lol`. **Não foi possível confirmar** no âmbito desta sessão (sem acesso ao dashboard Vercel nem aos secrets do GitHub) os itens obrigatórios: **projeto Vercel** que serve o domínio, **deployment** de produção ativo, **Root Directory**, **overrides** no painel nem **coerência de `VERCEL_PROJECT_ID`** com o CI.

Por **BLOQUEIO AUTOMÁTICO** definido no prompt cirúrgico, **não se aplicou alteração** a `goldeouro-player/vercel.json`, `.github/workflows/frontend-deploy.yml` nem qualquer outro artefacto de deploy: qualquer mudança seria **especulativa** e poderia agravar drift entre Git, CI e produção.

A evidência pública confirma que o **sintoma persiste** em 2026-04-05 (`/register` → 404 `X-Vercel-Error: NOT_FOUND`; `/` → 200). O **build local** do player conclui com sucesso; **nenhuma** alteração de gameplay, router ou baseline visual foi feita.

---

## 2. GO operacional confirmado ou bloqueado

**BLOQUEADO — GO OPERACIONAL INCOMPLETO**

| Pré-condição obrigatória | Estado |
|--------------------------|--------|
| 1. Qual projeto Vercel serve `www.goldeouro.lol` | **Não confirmado** (requer dashboard ou API autenticada) |
| 2. Qual deployment está ativo em produção | **Não confirmado** (requer dashboard; `X-Vercel-Id` no HTTP não identifica `dpl_…`) |
| 3. Root Directory configurado | **Não confirmado** (só no painel / `.vercel` local não versionado) |
| 4. Redirects/rewrites/overrides no painel | **Não confirmado** |
| 5. `VERCEL_PROJECT_ID` / org / token do CI = mesmo projeto do domínio | **Não confirmado** (secrets não visíveis no repositório) |

---

## 3. Evidências do projeto/deployment correto

**Disponíveis nesta sessão:**

- **HTTP (público), ~2026-04-05 UTC:**
  - `GET https://www.goldeouro.lol/` → **200**, `Content-Type: text/html`, `Server: Vercel`, cabeçalhos de segurança alinhados ao padrão descrito em `goldeouro-player/vercel.json` (ex.: CSP).
  - `GET https://www.goldeouro.lol/register` → **404**, `Content-Type: text/plain`, `X-Vercel-Error: NOT_FOUND`, `Server: Vercel`, `X-Vercel-Id: gru1::…` (identificador de pedido edge, **não** substitui `prj_` / `dpl_`).

**Não disponível:** nome ou ID do projeto, lista de deployments, captura de Settings → General → Root Directory, nem export de Routing do painel.

---

## 4. Causa real confirmada

**Não fechada com prova de painel.**  
A **causa operacional mais consistente** com o sintoma (**`/` OK, sub-rotas 404 Vercel**) continua a ser: **fallback SPA (`rewrites` → `index.html`) não aplicado** no deployment que atende pedidos a caminhos sem ficheiro estático — tipicamente por **projeto / Root Directory / overrides** em desalinhamento com `goldeouro-player/vercel.json`, **ou** deployment que não incorpora essa configuração.

**Não há evidência nesta sessão** que invalide o `vercel.json` versionado como texto; apenas que **produção não se comporta** como se o catch-all estivesse ativo.

---

## 5. Arquivos alterados

**Nenhum** (cirurgia bloqueada antes de qualquer alteração versionada).

---

## 6. Correção aplicada

**Nenhuma** no repositório nem no painel (sem acesso).  
**Próximo passo operacional recomendado** (fora do âmbito desta execução bloqueada): no projeto Vercel que serve `www.goldeouro.lol`, confirmar **Root Directory = `goldeouro-player`**, remover **conflitos** em Redirects/Rewrites do dashboard se existirem, e validar que o **próximo deployment** aplica o `vercel.json` do player; em último caso **promover** explicitamente um deployment conhecido bom (ex.: baseline `dpl_p3dBCTxRr…`) após verificação de equivalência de artefacto.

---

## 7. O que não foi tocado

- `goldeouro-player/vercel.json` (inalterado)  
- `.github/workflows/frontend-deploy.yml` (inalterado)  
- `App.jsx`, `BrowserRouter`, `GameFinal`, `GameShoot`, auth, saldo, histórico, withdraw, PIX, backend, CSS/layout de jogo  

---

## 8. Riscos eliminados

- **Risco de regressão visual ou de gameplay** por alteração prematura no repositório: **eliminado** ao não commitar mudanças sem GO operacional.  
- **Risco de “correção” no projeto errado**: mitigado ao **não** forçar alterações sem identificação do projeto.

---

## 9. Riscos remanescentes

- **Produção continua** com deep links e refresh em sub-rotas **quebrados** até o alinhamento Vercel.  
- **Drift** Git vs edge **não foi resolvido**.  
- **Links de e-mail** (ex.: reset de password) continuam **vulneráveis** a 404 em abertura directa da URL.

---

## 10. Testes mínimos executados

| Teste | Resultado |
|-------|-----------|
| `GET https://www.goldeouro.lol/` | **200** |
| `GET https://www.goldeouro.lol/register` | **404**, `X-Vercel-Error: NOT_FOUND` |
| `npm run build` em `goldeouro-player` | **Sucesso** (Vite; `dist/index.html` e assets gerados) |

*Não foi feito deploy nesta sessão.*

---

## 11. Diagnóstico final da cirurgia

**BLOQUEADA**

**Motivo:** GO operacional incompleto — impossível confirmar, com evidência suficiente neste contexto, projeto Vercel, deployment, Root Directory, overrides de painel e coerência dos secrets do CI com o domínio de produção.

---

## 12. Conclusão objetiva

A cirurgia **não avançou** para alteração de configuração ou código porque as **pré-condições explícitas do prompt** não foram satisfeitas sem acesso ao **painel Vercel** e **secrets**. O problema em produção **reproduz-se** por HTTP público; a **correção mínima** continua a ser **operacional na plataforma**, seguida de smoke em rotas profundas. A **Execução Controlada** seguinte deve ser conduzida por um operador com acesso ao dashboard e aos secrets, usando este relatório e o checkpoint Git `pre-cirurgia-routing-spa-producao-2026-04-05` como linha de segurança.

---

*Relatório cirúrgico — sessão 2026-04-05 — sem commits associados a esta classificação BLOQUEADA.*
