# ELIMINAÇÃO DO DUPLO PIPELINE DE DEPLOY

**Data:** 2026-04-02  
**Modo:** diagnóstico, decisão e plano de bloqueio de canal paralelo (sem alterações ao painel Vercel neste ficheiro).  
**Evidência crítica:** `docs/relatorios/MERGE-PR33-E-VALIDACAO-PRIMEIRO-RUN-PIPELINE-2026-04-02.md`.

---

## 1. Diagnóstico do problema

### 1.1 Facto comprovado

Após o merge do **PR #33** na **`main`**:

| Canal | Resultado |
|--------|-----------|
| **GitHub Actions** (`vercel-action`) | **Falhou** com `Error! Project not found` (run **`23904839727`**) |
| **Produção pública** (`https://www.goldeouro.lol/`) | **Mudou** o bundle de `index-brxfDf0E.js` para **`index-1R6cMUpD.js`** com `Last-Modified` na mesma janela temporal do push |

**Conclusão lógica:** existe **pelo menos um segundo mecanismo** que publica em produção **sem** depender do sucesso do job de deploy no Actions. O candidato dominante é a **integração nativa GitHub → Vercel** (deploy automático ao receber commits na branch de produção), comportamento **padrão** quando o repositório está ligado ao projeto Vercel.

### 1.2 O que não foi lido nesta sessão (painel)

Sem acesso ao dashboard **Vercel** neste relatório, **não** se confirmam aqui os toggles exactos (*Git*, *Production Branch*, *Deploy Hooks*). Devem ser **validados manualmente** em:

**Vercel → projeto `goldeouro-player` → Settings → Git**

---

## 2. Mapeamento dos dois pipelines

### Fluxo A — GitHub Actions (`.github/workflows/frontend-deploy.yml`)

| Aspeto | Descrição |
|--------|-----------|
| **Dispara quando** | `push` em `main` ou `dev` (com paths `goldeouro-player/**` ou alteração ao workflow); em PRs para `main` corre só *test-frontend*. |
| **Deploy produção** | Job `deploy-production` **só** se `github.ref == refs/heads/main`. |
| **Como faz deploy** | `amondnet/vercel-action@v25` → `npx vercel` com token e `working-directory: goldeouro-player`, `vercel-args: '--prod'`. |
| **CLI?** | **Sim** (via `npx vercel` dentro do action). |
| **Depende de secrets?** | **Sim:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. |
| **Ignora o outro fluxo?** | **Não** — é independente; falha ou sucesso **não** impede o Fluxo B se este estiver activo. |

### Fluxo B — Integração Vercel + GitHub (nativa)

| Aspeto | Descrição |
|--------|-----------|
| **Dispara quando** | Tipicamente **push** (ou merge) na **Production Branch** ligada ao projeto (em geral **`main`**), conforme documentação Vercel e prática habitual. |
| **Como faz deploy** | Infraestrutura Vercel **clona** o commit, corre **build** conforme `vercel.json` / settings (Root Directory `goldeouro-player`, etc.) e publica. |
| **CLI no GitHub?** | **Não** no repositório; o build corre nos servidores Vercel. |
| **Ignora Actions?** | **Sim** no sentido de **não** esperar pelo resultado do workflow — corre em **paralelo** ao push. |
| **Evidência no PR** | Checks **“Vercel – goldeouro-player”** aparecem nos PRs (commits de integração). |

---

## 3. Causa raiz

1. **Dupla subscrição ao mesmo evento:** o **push em `main`** acciona **simultaneamente** (a) o workflow `frontend-deploy.yml` e (b) o **Git integration** do Vercel, cada um com o seu pipeline de build/deploy.

2. **Secrets do Actions incorrectos** (`VERCEL_PROJECT_ID` → `Project not found`) tornam o Fluxo A **frágil**, mas **não** impedem o Fluxo B — daí **produção mudar** mesmo com Actions vermelho.

3. **Rollbacks / drift históricos:** qualquer combinação de **promote manual**, **aliases**, **deploy automático** e **Actions** explica **produção ≠ intenção única** documentada — o incidente do merge PR #33 **confirma** o modelo de **dois portões**.

---

## 4. Decisão tomada (recomendação obrigatória)

### Opção adoptada (documental): **OPÇÃO 1**

**Desactivar ou neutralizar o deploy automático de produção via integração Git no Vercel** (ou restringir a **preview**), mantendo **produção** apenas quando o **pipeline controlado** (GitHub Actions) **concluir com sucesso** — **depois** de corrigidos os **secrets** e, se necessário, o `VERCEL_PROJECT_ID`.

| Opção | Veredicto |
|-------|-----------|
| **1 — Produção só via Actions** | **Recomendada:** uma **única** porta lógica; rastreabilidade no GitHub; alinhamento com o trabalho já feito no PR #33. |
| **2 — Só Vercel automático** | **Não recomendada:** perde-se smoke test e gates no YAML; o repositório já investiu em `frontend-deploy.yml`. |
| **3 — Outra** | Possível **Ignored Build Step** no Vercel para **saltar** build automático quando `VERCEL_DEPLOY_SOURCE=actions` (requer coordenação); mais complexa. |

**Porquê Opção 1:** minimiza **surpresas** em `www`; o merge PR #33 provou que **só** o Actions honesto **não** basta se o Vercel continuar a publicar **sempre**.

---

## 5. Novo modelo de deploy (estado alvo)

| Pergunta | Estado alvo |
|----------|-------------|
| **Quem pode deployar produção?** | Apenas o **workflow** `Frontend Deploy (Vercel)` em **`main`**, com secrets correctos e job **verde**. |
| **Quando acontece?** | Após **merge/push** que altere `goldeouro-player/**` ou o workflow, **e** o job de produção **passar** (incl. smoke). |
| **O que bloqueia deploy?** | Falha de build, falha do `vercel-action`, falha do smoke, ou **cancelamento** manual. |
| **Integração Git Vercel** | **Desligada** para Production **ou** configurada para **não** gerar deployment de produção em push (conforme opções do painel). |
| **Baseline visual** | Não é garantida **só** por CI — exige **política de produto** (tag, promote, aliases). Depois de **uma** porta de deploy, alinha-se **SHA** esperado ao **bundle** em `www`. |

### Passos operacionais (fora deste documento)

1. **Vercel → Settings → Git:** desactivar *Automatic deployments* para Production **ou** limitar a branch / usar *Ignored Build Step*.
2. **GitHub → Secrets:** corrigir `VERCEL_PROJECT_ID` para `prj_…` real.
3. **Validar** um push de teste: **só** o Actions deve mover produção (ou **nenhum** se não houver push em paths).

---

## 6. Riscos eliminados (quando a Opção 1 estiver implementada)

| Risco | Após implementação |
|-------|---------------------|
| **Deploy com Actions falhado** | **Eliminado** — não haverá segundo canal silencioso. |
| **Dois bundles candidatos ao mesmo push** | **Reduzido a um.** |
| **Impossibilidade de correlacionar “verde” com `www`** | **Melhorada** — um único caminho a auditar. |

---

## 7. Classificação

**PROBLEMA IDENTIFICADO MAS NÃO RESOLVIDO**

- **Identificado:** duplo pipeline e prova empírica (merge PR #33).
- **Não resolvido:** alterações no **painel Vercel** e **secrets** não foram executadas neste relatório; até lá, **dois canais** podem continuar activos.

---

## 8. Conclusão objetiva

**Sim:** existe **mais do que um** pipeline de deploy para o player em produção; **sim:** isso **explica** rollbacks e mudanças de bundle **sem** alinhamento com o gate do Actions.

**Sim:** está **claro** qual pipeline **deve** ser o único (**Opção 1 — Actions**), **mas** a **implementação** no Vercel **ainda é obrigatória**.

**Sim:** a **causa raiz** foi identificada correctamente: **paralelismo Git integration + Actions** + **secret incorrecto** no Actions.

---

### Veredito (Etapa 5)

| | Resposta |
|--|----------|
| **A. Existe hoje mais de um pipeline de deploy?** | **SIM** |
| **B. Isso explica os rollbacks?** | **SIM** (em conjunto com promotes/aliases já documentados) |
| **C. Já está claro qual pipeline será o único?** | **SIM** (recomendação: **Actions** após corrigir secrets; **Vercel Git** não deve publicar produção sozinho) |
| **D. O problema raiz foi identificado correctamente?** | **SIM** |

---

*Sem uma única porta de entrada em produção, não se deve avançar desenvolvimento crítico nem confiar em validação de UX como “prova única”.*

---

## Fechamento oficial (referência cruzada — 2026-04-04)

Estado enterprise do pipeline frontend (incluindo validação de rollback em produção e restauração) consolidado em:  
`docs/relatorios/FECHAMENTO-OFICIAL-PIPELINE-FRONTEND-ENTERPRISE-2026-04-04.md`.  
*O histórico e a análise deste documento mantêm-se válidos como contexto do problema do duplo pipeline.*

---

*Fim do relatório.*
