# DIAGNÓSTICO FINAL — GARGALO ACTIONS vs VERCEL

**Data:** 2026-04-02  
**Modo:** diagnóstico read-only (sem alterações a workflows, secrets ou painel Vercel).  
**Base:** `.github/workflows/frontend-deploy.yml`, `docs/relatorios/TESTE-CONTROLADO-FINAL-PIPELINE-CANONICO-PLAYER-2026-04-02.md` e relatórios anteriores do repositório.

---

## 1. Resumo executivo

O fechamento do problema **ainda não ocorre** porque coexistem **dois fenómenos independentes**:

1. **GitHub Actions (`frontend-deploy.yml`)** falha no passo **`vercel-action`** com **`Error! Project not found`**, ou seja, o CLI Vercel **não consegue resolver** o par **projeto + equipa** com os valores injectados pelos secrets (`VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`) no contexto do token.
2. **Integração Git ↔ Vercel** continua a **gerar deployments de produção** para commits na **`main`**, **mesmo quando o Actions falha** — como documentado no teste controlado (deployment `production` com SHA do merge, enquanto o run `23916780177` falhava no deploy).

Enquanto **(1)** não estiver corrigido, o pipeline canónico **não** publica por Actions. Enquanto **(2)** não estiver alinhado à política desejada, **qualquer merge na `main`** pode continuar a **mover o Production Current** sem passar por um deploy verde do Actions.

---

## 2. Análise do erro `Project not found`

### O que o workflow faz (evidência no YAML)

- **`amondnet/vercel-action@v25`** com:
  - `vercel-token: ${{ secrets.VERCEL_TOKEN }}`
  - `vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}`
  - `vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}`
  - `working-directory: goldeouro-player`
  - `vercel-args: '--prod'`
- Comentário explícito no ficheiro: o ID real do projeto deve ser **`prj_…`**, não o nome **`goldeouro-player`**.

### O erro do CLI

Mensagem registada nos logs: **`Error! Project not found ({"VERCEL_PROJECT_ID":"***","VERCEL_ORG_ID":"***"})`** após **“Retrieving project…”**.

### Interpretação técnica (causa mais provável)

O Vercel CLI, com o token fornecido, **não encontra** um projeto que corresponda ao **par** `(VERCEL_ORG_ID, VERCEL_PROJECT_ID)` — típico quando:

| Causa | Porquê encaixa |
|--------|----------------|
| **`VERCEL_PROJECT_ID` não é um `prj_…` válido** para essa equipa | Secret com **nome do projeto** (`goldeouro-player`) ou valor truncado/errado — já foi apontado em `MERGE-PR33-…` e `CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`. |
| **`VERCEL_ORG_ID` não é o ID da equipa** que contém o projeto | Uso de slug em vez de `team_…` ou equipa errada. |
| **Token sem permissão** sobre essa equipa/projeto | Menos comum com “Project not found” (costuma ser 403), mas possível em políticas de token. |
| **`working-directory`** | **Improvável** como causa de *Project not found* — o erro ocorre na **resolução do projeto**, antes do build local ser decisivo. |

**Conclusão:** o padrão mais consistente com a documentação interna e o texto do erro é **mismatch de IDs nos secrets** (sobretudo **`VERCEL_PROJECT_ID`** ≠ `prj_…` do projeto `goldeouro-player` na equipa certa, ou **`VERCEL_ORG_ID`** incoerente).

### O workflow chama o Vercel “do jeito certo”?

**Sim, em estrutura:** uso de `vercel-action`, `working-directory` no player, `vercel-args` sem `--yes` indevido. O problema **não** é o formato geral do YAML, é a **combinação de credenciais** no GitHub.

---

## 3. Coerência entre secrets e projeto real

### FACTO

- Existe no repositório (relatórios de operações anteriores, p.ex. `RESTAURACAO-CONTROLADA-LINHA-BASE-PLAYER-2026-04-02.md`) referência ao projeto **`goldeouro-player`** com ID **`prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v`** e equipa **`team_7BSTR9XAt3OFEIUUMqSpIbdw`**.
- O workflow espera **`secrets.VERCEL_PROJECT_ID`** e **`secrets.VERCEL_ORG_ID`** — valores **reais** não são legíveis no repo.
- **`deploy-on-demand.yml`** usa **`VERCEL_PROJECT_ID_PLAYER`** — **outro** secret, com risco de divergência (`AUDITORIA-WORKFLOWS-FRONTEND-INTERFERENCIA-2026-04-02.md`).

### RISCO

- Os secrets no GitHub podem ainda conter **nome** em vez de **`prj_…`**, ou um **`prj_`** de **outro** projeto/equipa, reproduzindo **“Project not found”** indefinidamente.

### HIPÓTESE

- **`VERCEL_ORG_ID`** no Actions pode não ser **`team_7BSTR9XAt3OFEIUUMqSpIbdw`** (ou equivalente), enquanto o projeto no dashboard está sob essa equipa.

**O que “bate” e o que “não bate”:** o **YAML** “bate” com as boas práticas; a **combinação secreta** **não bate** com um projeto resolvível — evidência **indireta** pelo erro e pelos relatórios que já falham na mesma mensagem.

---

## 4. Análise da promoção automática no Vercel

### Por que a produção ainda muda com merge na `main`?

Porque o **projeto Vercel ligado ao repositório GitHub** está configurado (por defeito ou explicitamente) para **criar deployments a partir de alterações na branch de produção** (`main`). Esse fluxo **não** passa pelo sucesso do GitHub Actions: é **outro pipeline** (build remoto nos servidores Vercel).

### Sobre o `Ignored Build Step`

- **FACTO do teste:** após merge na `main`, houve **novo deployment `production`** alinhado ao commit de merge (`TESTE-CONTROLADO-FINAL-…`).
- **Interpretação:** ou o **Ignored Build Step não está a impedir** a criação/atribuição de deployment de **produção** para essa branch, ou a política configurada **não cobre** o caso testado (por exemplo, só evita *build* duplicado mas **não** impede promoção, ou aplica-se a outro ambiente). **Sem leitura do script exacto no painel**, não se pode afirmar o bug linha a linha — mas **o resultado observado** foi **produção a avançar sem Actions verde**.

### Isto indica

- **Configuração insuficiente ou não equivalente** a “produção só via Actions” — **provável**.
- **Comportamento normal do Vercel** para Git na `main` — **FACTO** em muitos projetos (produção automática).
- **Outro canal** para o mesmo domínio — **RISCO** secundário (outro projeto), a validar no dashboard se houver dúvida.

---

## 5. Gargalo principal restante

### A. O gargalo principal agora é:

**Ambos:**

- **Actions a falhar** impede que **`frontend-deploy.yml`** seja a ferramenta que publica.
- **Integração Git do Vercel a promover/atualizar produção** na `main` impede que exista **uma única porta** enquanto essa integração continuar a empurrar produção **independentemente** do resultado do Actions.

### B. O que resolver primeiro?

**Uma única prioridade estratégica:** **alinhar a política no Vercel** para que **produção não dependa só do push à `main`** (ou seja, **desligar / restringir** o deploy automático de produção por Git **antes** de celebrar o pipeline canónico). Em paralelo lógico (segunda prioridade operacional): **corrigir secrets** para o Actions deixar de falhar com `Project not found`.

*(Ordem discutida na secção 7.)*

---

## 6. FATO vs RISCO vs HIPÓTESE

| Afirmação | Tipo |
|-----------|------|
| `frontend-deploy` falhou com `Project not found` no run documentado | **FACTO** |
| Produção atualizou com merge na `main` via integração Git (deployment `production` + SHA) | **FACTO** |
| `VERCEL_PROJECT_ID` no GitHub é exactamente `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v` | **HIPÓTESE** (não visível no repo) |
| Ignored Build Step não bloqueia produção como esperado | **RISCO** / **PROVÁVEL** face ao teste |
| Token sem permissão é a causa principal | **HIPÓTESE** (menos provável que IDs errados) |

---

## 7. Próxima ação recomendada

**Opção C — Ambos, com ordem explícita:**

1. **Primeiro (Vercel — política):** garantir que **produção pública** não é atualizada **automaticamente** por cada push/merge na `main` **apenas** pela integração Git (ajustar **Production Branch**, **Ignored Build Step**, ou desligar auto-assign de domínio de produção a builds Git — conforme o modelo desejado). *Motivo:* sem isto, **corrigir só os secrets** cria **dois** canais de produção bem-sucedidos (Git + Actions).

2. **Segundo (GitHub — secrets):** definir **`VERCEL_PROJECT_ID`** = **`prj_…`** do projeto `goldeouro-player` e **`VERCEL_ORG_ID`** = **`team_…`** da equipa correcta, validados no dashboard Vercel (Settings → General), e validar um run verde do **`frontend-deploy`**.

Se for **obrigatório** escolher **uma única** letra do enunciado: **B** (política Vercel primeiro), porque **A** sozinha **não** encerra o problema estrutural do duplo canal; **A** é indispensável a seguir para o canónico funcionar.

---

## 8. Classificação final

**GARGALO IDENTIFICADO COM CLAREZA** quanto a:

- Falha **`Project not found`** = **incoerência dos secrets / IDs** no Actions (padrão clássico + confirmação por logs).
- Produção a mover-se pela **integração Git** com **Actions vermelho** = **dois canais** em paralelo.

**GARGALO PROVÁVEL** quanto ao detalhe exacto do **Ignored Build Step** (sem captura de ecrã do script nesta etapa).

---

## 9. Conclusão objetiva

Para que **`frontend-deploy.yml`** seja a **única porta real de produção**, falta:

1. **Fazer o Actions conseguir resolver o projeto** — corrigindo **`VERCEL_PROJECT_ID`** e **`VERCEL_ORG_ID`** (e validando o token) até o passo **`vercel-action`** passar.
2. **Impedir que a integração Git continue a ser um segundo portão de produção** — configurando o Vercel para que **merge na `main`** **não** atualize sozinha o **Production Current** até que essa seja a política acordada (caso contrário, o canónico será sempre **opcional** em relação ao Git).

Sem **(1)**, o canónico não publica. Sem **(2)**, a produção **não** fica sob uma única governação.

---

## Referências internas

- `docs/relatorios/TESTE-CONTROLADO-FINAL-PIPELINE-CANONICO-PLAYER-2026-04-02.md`
- `docs/relatorios/MERGE-PR33-E-VALIDACAO-PRIMEIRO-RUN-PIPELINE-2026-04-02.md`
- `docs/relatorios/CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`
- `docs/relatorios/RESTAURACAO-CONTROLADA-LINHA-BASE-PLAYER-2026-04-02.md`
- `docs/relatorios/ELIMINACAO-DUPLO-PIPELINE-DEPLOY-2026-04-02.md`
- `docs/relatorios/FECHAMENTO-OFICIAL-PIPELINE-FRONTEND-ENTERPRISE-2026-04-04.md` — consolidação e fechamento governança (pós-validação rollback)
