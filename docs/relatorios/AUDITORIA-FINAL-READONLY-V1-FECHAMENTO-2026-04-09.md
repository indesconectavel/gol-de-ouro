# AUDITORIA FINAL READ-ONLY — FECHAMENTO DA V1

**Projeto:** Gol de Ouro (monorepo, player + backend)  
**Data:** 2026-04-09  
**Modo:** somente leitura (sem alterações a código, infra, secrets ou produção).

---

## 1. Resumo executivo

Nesta sessão consolidaram-se **evidências objectivas** de:

- **Produção do player** (`www.goldeouro.lol`): rotas principais com **200**, **HTML**, **sem `X-Vercel-Error`**, shell SPA presente.
- **Paridade Git:** `origin/main` em **`277cf16`** (merge PR #56), com **routing `/game` → `GameFinal`**, gates de banner, `vite.config` e **`vercel.json` sem `cleanUrls`** no código actual.
- **Vercel:** *Current* em **`goldeouro-player`** alinhado ao deployment **Production** associado ao commit **`277cf16`** (`dpl_63YpTTryM8pnKvoQ7zL3pht3TtkC` / `fbqfiydum`).
- **Tag:** **`PRODUCAO-ESTAVEL-2026-04-09`** → **`277cf1629f41582bdda396b4b3f12668faa314e1`** (checkpoint coerente com o merge final).
- **CI pós-merge:** workflows em **`main`** para o SHA **`277cf16`** com conclusão **success** (incl. Frontend Deploy).

**Não** foi possível, neste modo, auditar **Fly.io** (CLI sem token) nem substituir **validação visual humana** completa.

---

## 2. Estado final da produção (player)

Base: **`https://www.goldeouro.lol`** (`curl -sSL`, redirects seguidos).

| Rota | HTTP | Content-Type | `X-Vercel-Error` | Shell SPA (`<!DOCTYPE` + `#root`) |
|------|------|--------------|------------------|-------------------------------------|
| `/` | 200 | `text/html; charset=utf-8` | ausente | Sim |
| `/game` | 200 | idem | ausente | Sim |
| `/dashboard` | 200 | idem | ausente | Sim |
| `/profile` | 200 | idem | ausente | Sim |
| `/register` | 200 | idem | ausente | Sim |

**Coerência:** respostas compatíveis com **SPA Vite/React** servida pelo edge (sem `NOT_FOUND` nos cabeçalhos verificados).

---

## 3. Estado visual/UX da V1

| Tema | Validado por código (`main` / `goldeouro-player`) | Validado por HTTP | Validado por evidência visual humana |
|------|---------------------------------------------------|-------------------|--------------------------------------|
| Banner oculto por defeito (`VITE_SHOW_VERSION_BANNER`) | Sim — `VersionBanner.jsx` / `VersionWarning.jsx` + `vite.config.ts` | Não inferível só com HTML estático | **Pendente** (confirmar no browser com build actual) |
| `/game` = `GameFinal` | Sim — `App.jsx` | Não aparece no HTML inicial | **Pendente** (fluxo autenticado) |
| Login / dashboard UX | Rotas e componentes presentes no código | 200 nas rotas | **Pendente** (jornada completa) |
| Regressão visual evidente | — | — | **Pendente** (critério subjectivo) |

**Separador:** o **código** da V1 na `main` está alinhado à baseline acordada; a **experiência** final depende de **smoke manual** curto.

---

## 4. Paridade Git ↔ produção

| Item | Estado |
|------|--------|
| **`origin/main` SHA** | `277cf1629f41582bdda396b4b3f12668faa314e1` |
| **Mensagem** | `Merge pull request #56 …` |
| **`/game` → `GameFinal`** | Sim (`App.jsx`) |
| **Gates banner** | Sim (`VersionBanner` / `VersionWarning`) |
| **`vite.config.ts`** | `define` com `VITE_SHOW_VERSION_BANNER` default `'false'` |
| **`vercel.json`** | Sem `cleanUrls` (grep sem ocorrências) |
| **Produção vs `main`** | `vercel ls -m githubCommitSha=277cf16…` devolve o deployment **Production** que serve **www**; paridade **coerente**. |
| **Tag `PRODUCAO-ESTAVEL-2026-04-09`** | Aponta para **`277cf16`** — útil como **marco** de encerramento do ciclo PR #56 + deploy. |

---

## 5. Estado do Vercel e do fluxo de deploy

| Pergunta | Resposta |
|----------|----------|
| **Current** (inspect `www`) | `goldeouro-player-fbqfiydum-…` · `dpl_63YpTTryM8pnKvoQ7zL3pht3TtkC` |
| **Commit em produção (meta)** | **`277cf16`** (merge PR #56), filtro `githubCommitSha` confirmado |
| **`main` → deploy** | Push a `main` com alterações em `goldeouro-player/**` dispara **Frontend Deploy** → `vercel-action --prod` com `secrets.VERCEL_PROJECT_ID` — **uma** origem canónica para produção via GitHub |
| **Risco “linha errada”** | Reduzido: **`main`** contém a baseline; próximo deploy segue o **mesmo** repositório. Risco residual: **merge sem revisão** ou **secret/project ID errado** (mitigação: revisão + secrets correctos). |
| **`goldeouro-player` vs `goldeouro-backend`** | Integração Git pode gerar previews noutro projecto; **produção canónica** dos domínios listados no inspect está em **`goldeouro-player`**. Manter **documentação** de qual projecto liga ao repo para evitar confusão em PRs. |

**Classificação:** **fluxo estabilizado** para produção do player, com ressalva documental sobre o segundo projecto.

---

## 6. Estado de CI / workflows / proteções

**Último push relevante (`277cf16`):** runs em `main` com **success** para CI, testes, pipeline principal, **Frontend Deploy (Vercel)**.

**Branch protection (`main`) — API GitHub (leitura):**

- `required_status_checks.strict`: **true**
- Contextos exigidos (amostra): Análise de Segurança, Relatório de Segurança, Testes Backend, Testes Frontend, Testes de Segurança
- `required_pull_request_reviews.required_approving_review_count`: **0** (aprovações obrigatórias **não** exigidas pelo ruleset clássico)
- `required_conversation_resolution`: **true**
- `enforce_admins`: **true**

**Gates:** úteis para **não** partir `main` às cegas; **não** incluem verificação automática explícita de **`/game` → GameFinal** no bundle (lacuna já discutida em relatórios anteriores).

**Workflows:** não foram modificados nesta auditoria; **Rollback Automático** apareceu como **skipped** num run recente — verificar política interna se for crítico.

---

## 7. Estado do backend / Fly.io

| Verificação | Resultado |
|-------------|-----------|
| `flyctl status` / máquinas / `payout_worker` | **Não executável** — `flyctl` sem token (`flyctl auth login` necessário). |
| Conclusão para esta auditoria | **Estabilidade do backend não comprovada** neste relatório. |

**Classificação:** **estável com ressalvas** do ponto de vista desta sessão — **exige** verificação no dashboard Fly ou login CLI para fechar com rigor operacional **full-stack**.

---

## 8. Pendências reais da V1

### CRÍTICAS *(bloqueiam afirmação “stack completa fechada”)*

- **Nenhuma** identificada **no frontend** com base em Git + HTTP + Vercel nesta sessão.

### IMPORTANTES *(não bloqueiam encerramento “player + merge”, mas devem ser tratadas)*

- **Smoke visual/manual** (banner, `/game` autenticado, login/dashboard) — **não** substituível por curl.
- **Saúde Fly / backend** — **não** auditada aqui; recomendável antes de declarar **V1 produto completo** se o scope incluir API.

### OPCIONAIS *(V2 / melhoria)*

- Gate CI que valide rota `/game` ou string de bundle (evitar regressão de routing).
- Revisão de **aprovação obrigatória** em `main` (`required_approving_review_count` = 0 hoje).
- Documentação única **qual** projecto Vercel recebe previews de PR vs produção.

---

## 9. Riscos remanescentes

1. **Regressão futura em `main`** se merges futuros alterarem `goldeouro-player` sem critério (mitigação: revisão + gates adicionais opcionais).
2. **Dois projectos Vercel** — risco operacional de olhar para o projecto errado em incidentes (mitigação: runbook).
3. **Backend** não validado nesta auditoria — risco residual se a V1 incluir SLA de API.

---

## 10. Veredicto final

**B) V1 OPERACIONAL, MAS AINDA NÃO 100% ENCERRADA** no sentido **estrito full-stack + UX humana + Fly**:

- **Player + Git + produção Vercel + tag:** alinhados e estáveis segundo evidências acima.
- **Último passo** para “encerramento 100%” depende da definição de scope:
  - *Só frontend / release player:* pode considerar-se **fechada** após **smoke manual** registado.
  - *Produto com backend:* falta **validação Fly** + smoke API.

---

## 11. Próximo passo recomendado

1. **Único passo mínimo** antes de declarar V1 encerrada em comité alargado: **checklist manual** (15 min): login, `/game`, banner ausente, dashboard — em **produção**; opcional: screenshot/arquivo interno.  
2. Se a V1 incluir backend: **abrir dashboard Fly** (ou `fly status` autenticado) e confirmar **app + payout_worker** saudáveis.

---

## Saída final obrigatória

**V1 OPERACIONAL — FALTA ÚLTIMO PASSO**

*(Último passo = smoke visual/manual em produção e, se o scope V1 incluir API, confirmação de saúde Fly — não executáveis em modo read-only sem browser/credenciais Fly.)*
