# PRÉ-EXECUÇÃO — CIRURGIA 1 — ROUTING SPA EM PRODUÇÃO

**Projeto:** Gol de Ouro — player  
**Data:** 2026-04-05  
**Modo:** read-only operacional + segurança (sem implementação, sem deploy, sem alteração de painel ou secrets)  
**Referência de diagnóstico:** `docs/relatorios/DIAGNOSTICO-READONLY-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md`

---

## 1. Resumo executivo

A Cirurgia 1 visa **corrigir 404 em deep links** da SPA em produção, mantendo **baseline visual** e **sem** abrir frentes de auth, jogo, saldo, PIX ou backend. A pré-execução confirma no **repositório local e em `origin`**:

- A **tag** e a **branch canónica** existem e **apontam para o commit oficial** `a3fff5ed93690f39e6083e0b78c921276ce2c57b` (o objeto anotado da tag tem SHA diferente; o **commit peeled** é o esperado).
- O **commit baseline** resolve localmente.
- Existe **caminho de rollback na Vercel** documentado e automatizável via workflow manual (`frontend-rollback-manual.yml`), complementado por **promoção explícita** do deployment validado `dpl_p3dBCTxRr…` quando a operação escolher essa rota.

A **proteção da baseline em Git** não depende da cirurgia: alterações típicas serão **painel Vercel e/ou alinhamento de projeto**; o código da baseline permanece endereçável por **tag/branch/commit**.

**Risco residual:** até que um operador com acesso ao **dashboard Vercel** e aos **secrets** confirme projeto, Root Directory e domínio, o item **GO operacional** permanece **condicionado** — isso não invalida o encerramento da pré-execução no plano técnico, mas **bloqueia** a cirurgia real até o checklist §7.

---

## 2. Baseline e pontos de rollback

### 2.1 Evidência Git (executada em 2026-04-05 neste workspace)

| Verificação | Resultado |
|-------------|-----------|
| Tag `baseline-player-validada-p3dBCTxRr-2026-04-02` existe **localmente** | **Sim** |
| Mesma tag em `origin` (`git ls-remote --tags`) | **Sim** → commit peeled alinhado abaixo |
| `baseline-player-validada-p3dBCTxRr-2026-04-02^{commit}` | **`a3fff5ed93690f39e6083e0b78c921276ce2c57b`** |
| Branch `canonica/player-baseline-p3dBCTxRr` (local) | **`a3fff5ed93690f39e6083e0b78c921276ce2c57b`** |
| Branch `origin/canonica/player-baseline-p3dBCTxRr` | **`a3fff5ed93690f39e6083e0b78c921276ce2c57b`** |
| `git rev-parse a3fff5ed93690f39e6083e0b78c921276ce2c57b^{commit}` | **Sucesso** (objeto existe) |

**Nota:** `git rev-parse <nome-da-tag>` sem `^{commit}` devolve o **hash do objeto tag** (anotada), não o commit; para rollback por Git use sempre **`tag^{commit}`** ou o SHA **`a3fff5e…`**.

### 2.2 Pontos de retorno se produção piorar

1. **Vercel (preferencial para esta cirurgia):**  
   - **Rollback CLI** via `.github/workflows/frontend-rollback-manual.yml` (`workflow_dispatch`, `confirm: ROLLBACK`), com `npx vercel@50.38.3 rollback` e `--scope goldeouro-admins-projects`; opcional `deployment_target` com URL ou ID.  
   - **Promover** explicitamente o deployment baseline **`dpl_p3dBCTxRrmyHBnsovJaT5n2UpWfd`** no dashboard Vercel (quando a política da equipa o permitir como “volta ao conhecido bom”).

2. **Git:** a baseline **não precisa ser revertida** se a cirurgia for só configuração Vercel; tag/branch/commit continuam válidos como referência imutável.

3. **Reversão de `vercel.json` / workflow:** só aplica se na fase futura alguém **tiver commitado** alterações; aí o retorno é **revert do commit** ou **redeploy a partir do estado anterior** — não confundir com rollback de deployment.

---

## 3. Arquivos e configs críticos

### A. Pode precisar alterar (só após GO e com escopo mínimo)

| Artefacto | Quando |
|-----------|--------|
| **`goldeouro-player/vercel.json`** | Se a pré-execução no painel concluir que o ficheiro precisa ajuste (ex.: regra em conflito, ordem, exclusões) **e** o Root Directory estiver correto mas o edge ainda não aplicar o esperado. **Nota:** o diagnóstico indica que o ficheiro **já** tem fallback SPA; muitas vezes **não** será necessário mudar o Git. |
| **`.github/workflows/frontend-deploy.yml`** | Apenas se houver **evidência** de que o CI publica noutro `VERCEL_PROJECT_ID` que o domínio usa, ou se for necessário **smoke** extra em rotas profundas **sem** alterar lógica de deploy (extensão de verificação, não mudança de destino do projeto sem alinhamento prévio). |

*Outro ficheiro versionado só se surgir evidência nova (ex.: `vercel.json` na raiz do monorepo) — hoje **não** há `vercel.json` na raiz do repo.*

### B. Deve ser apenas revisado (não é alvo da Cirurgia 1)

- **`goldeouro-player/vite.config.ts`** — confirmar ausência futura de `base` incorreto; hoje coerente com deploy na raiz do domínio.  
- **`goldeouro-player/package.json`** — scripts de build; sem necessidade para routing edge.  
- **`goldeouro-player/src/App.jsx`** — conferência de que rotas SPA existem; **não** alterar `BrowserRouter` nesta cirurgia.

### C. Não deve ser tocado (explícito)

Gameplay, páginas de jogo, `GameFinal`, auth, saldo, histórico, withdraw, PIX, backend — **fora de escopo**.

---

## 4. Dependências fora do Git

Confirmar **manualmente** (esta pré-execução não tem acesso ao painel):

| Item | Finalidade |
|------|------------|
| **Root Directory** do projeto Vercel | Deve coincidir com a árvore onde está `goldeouro-player/vercel.json` (tipicamente `goldeouro-player`). |
| **Production Deployment** ativo | Identificar qual `dpl_…` serve `www` e se corresponde ao último push/CI esperado. |
| **Domains** | `www.goldeouro.lol` / apex associados ao **mesmo** projeto que o CI usa. |
| **Redirects / Rewrites / Routes** no painel | Detetar overrides que anulam o `vercel.json`. |
| **Build & Output** | Framework Vite, output `dist`, comando de build alinhado ao repo. |
| **`VERCEL_PROJECT_ID` (GitHub Secrets)** | Deve ser o `prj_…` do projeto que serve o domínio (já documentado em relatórios históricos como ponto de falha comum). |
| **`VERCEL_ORG_ID` / token** | Equipa e token válidos para rollback e deploy. |
| **Coerência domínio ↔ projeto** | Provar que `www` não aponta para outro projeto/conta. |

---

## 5. Impacto operacional e riscos

| Área | Impacto |
|------|---------|
| **Frontend (código)** | **Nulo** se a correção for só plataforma; **baixo** se apenas smoke/CI for estendido. |
| **Infra / deploy** | **Médio** — mudança de routing edge afeta **todos** os GET a caminhos sem ficheiro estático. |
| **Produção** | **Alto** se mal executado (404 generalizado ou loops); **controlável** com rollback imediato. |
| **Caches** | CDN/browser podem atrasar percepção da correção; headers atuais no `vercel.json` já enfatizam no-cache em HTML — ainda assim, validar com janela anónima/curl após mudança. |
| **URLs públicas** | Deep links e refresh passam a funcionar como esperado **após** fallback correto. |
| **Links reset / download** | Hoje quebrados por HTTP direto (evidência em relatório 2026-04-04); **benefício** após correção. |
| **Baseline visual** | **Preservada** se o artefacto servido voltar a ser o mesmo deployment validado ou equivalente build; risco se um **novo** deployment com bundle diferente for promovido sem intenção. |
| **Drift** | Risco real se Git, CI e painel divergirem; a pré-execução exige **triangulação** dos três. |

---

## 6. Estratégia de rollback

Ordem prática recomendada:

1. **Imediato:** `vercel rollback` (workflow manual com scope correto) **ou** **Promote** o deployment `dpl_p3dBCTxRr…` no dashboard — o que a operação conseguir executar mais rápido com trilho auditado.  
2. **Se houve mudança só no painel (sem commit):** reverter as entradas no painel para o estado anterior (captura pré-mudança recomendada na preparação).  
3. **Se houve commit em `vercel.json` / workflow:** `git revert` + novo deploy **ou** redeploy de commit anterior — só nesse cenário.  
4. **Tag/branch baseline:** usadas como **referência** e **prova**, não como “rollback runtime” da Vercel; não substituem o passo 1.

---

## 7. Checklist GO / NO-GO

| # | Item | Estado na pré-execução (repo) |
|---|------|-------------------------------|
| 1 | Baseline protegida em Git (tag + branch + commit acessíveis) | **GO** (ver §2) |
| 2 | Rollback Vercel definido (CLI/dashboard + deployment baseline conhecido) | **GO** (processo documentado) |
| 3 | Escopo mínimo definido (edge/config; sem auth/jogo) | **GO** |
| 4 | Nenhum ficheiro fora do escopo será tocado sem novo gate | **GO** (regra de governação) |
| 5 | Projeto Vercel **correto** identificado (é o que serve `www`) | **NO-GO até confirmação humana** |
| 6 | Root Directory confirmado no painel | **NO-GO até confirmação humana** |
| 7 | Production deployment atual identificado (`dpl_…`) | **NO-GO até confirmação humana** |
| 8 | `VERCEL_PROJECT_ID` no GitHub = projeto do domínio | **NO-GO até confirmação humana** |
| 9 | Captura/registo do estado atual de Redirects/Rewrites no painel | **NO-GO até feito** (recomendado antes de mudar) |
| 10 | Plano de smoke pós-mudança: `/`, `/register`, `/reset-password?token=test`, `/download` | **GO** como requisito da cirurgia |

**Síntese:** **GO técnico-repositório**; **GO operacional completo** apenas após itens 5–9 no painel/secrets.

---

## 8. Escopo mínimo seguro da cirurgia

- **Menor mudança possível:** fazer o edge da Vercel servir **`index.html`** para rotas da SPA (equivalente ao que `goldeouro-player/vercel.json` já descreve), **sem** mudar bundle nem router.  
- **Onde primeiro:** **painel Vercel** (Root Directory, rewrites/redirecionamentos, projeto e domínio) — é a hipótese dominante do diagnóstico.  
- **Código versionado:** só se, após alinhar o painel, provar-se que o `vercel.json` precisa de ajuste fino **e** está a ser lido.  
- **Cenário em que `vercel.json` precisa edição:** conflito com regras, ordem de rewrites, necessidade de excluir paths estáticos, ou duplicação de política quando o painel não cobre o caso.  
- **Cenário em que não se deve tocar no Git:** quando o Root Directory ou projeto estiver errado — **corrigir plataforma** restaura o comportamento sem diff.

---

## 9. Classificação final

### PRONTO PARA PREPARAÇÃO AUTOMÁTICA

**Com condição explícita:** a “preparação automática” seguinte pode incluir scripts de smoke e checklist, mas **a cirurgia em produção** só inicia após **GO** nos itens **5–9** da secção 7 (confirmações fora do Git).

### AINDA NÃO PRONTO

**Apenas se** ninguém com acesso ao dashboard Vercel/GitHub Secrets puder executar o checklist **5–9** na janela planeada — sem isso, não há **GO operacional**.

---

## 10. Conclusão objetiva

- A **baseline em Git está referenciável e íntegra** (tag anotada → commit `a3fff5e…`, branch canónica alinhada, commit resolvível; tag presente em `origin`).  
- O **rollback real** é **predominantemente na Vercel** (rollback CLI com scope documentado e/ou **promote** do deployment `dpl_p3dBCTxRr…`), **sem** obrigar revert da baseline em Git para uma correção só de plataforma.  
- **Ficheiros que podem entrar na cirurgia:** no máximo **`goldeouro-player/vercel.json`** e, só com evidência, **`.github/workflows/frontend-deploy.yml`** (p.ex. smoke de deep links).  
- **Dependências fora do Git:** Root Directory, deployment de produção, domínios, overrides de rotas, build settings, `VERCEL_PROJECT_ID`/org/token.  
- **Risco principal:** aplicar mudança no **projeto ou domínio errado**, ou promover um deployment com **artefacto não equivalente** à baseline visual sem querer.  
- **Escopo mínimo:** alinhar **configuração Vercel** ao `vercel.json` já existente; evitar tocar em código de aplicação.  
- **Preparação automática:** **sim**, do ponto de vista de processo e evidência Git; **execução da cirurgia** depende do checklist humano **5–9**.

---

*Elaborado em modo read-only; sem alterações a repositório, painel, secrets ou deployments.*
