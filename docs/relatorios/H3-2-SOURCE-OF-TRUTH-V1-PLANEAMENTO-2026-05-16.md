# H3.2 — SOURCE OF TRUTH V1 — PLANEAMENTO

**Data do documento:** 2026-05-16  
**Tipo:** planeamento e governança operacional — **sem implementação**  
**Base:** diagnóstico [H3.1](H3-1-DIAGNOSTICO-READONLY-GOVERNANCA-GIT-SOURCE-OF-TRUTH-2026-05-16.md)  
**Regras desta etapa:** não alterar código de aplicação; não fazer deploy; não corrigir; não limpar ficheiros; não resolver submódulo/admin.

**Propósito:** definir a **Source of Truth V1** — regras que qualquer pessoa ou agente deve seguir **antes** de cirurgia, commit de código, deploy ou merge — preservando a produção validada em **`7ecedca`**.

---

## 1. Resumo executivo

A **verdade operacional atual** do backend em produção é o que o runtime reporta em **`GET /meta`** → **`gitCommit: 7ecedca98d1f5d5d7c1878aa043ec724e422dd41`**, na app Fly **`goldeouro-backend-v2`**. Esta referência **não deve ser alterada** nesta fase.

A **verdade Git desejada a médio prazo** é **`main`** no repositório `indesconectavel/gol-de-ouro`, contendo **toda** a linha que hoje vive em `fix/admin-financial-integrity-v1` (incluindo o ancestral de `7ecedca`), de forma que **push em `main`** volte a significar “candidato oficial a produção”.

Até essa convergência, a **linha de integração autorizada** é **`fix/admin-financial-integrity-v1`** @ **`dac9f8b`** (sincronizada com remoto), tratada como **branch de release V1** — não como branch descartável.

**Produção permanece congelada** em `7ecedca` até uma etapa futura **H3.3+** com gate explícito; os **9 commits** entre `7ecedca` e `dac9f8b` são **não deployados** e devem ser classificados antes de qualquer promoção.

Este documento **não autoriza** merge, deploy, limpeza de working tree, correção de submódulo nem execução de SQL — apenas **política e sequência segura** para quando a equipa decidir executar H3.3.

**Decisão formal (secção 15):** adoptar **Source of Truth V1** com **dupla referência temporária** — `/meta` para o que está no ar; `main` como norte Git após normalização planeada.

---

## 2. Diagnóstico herdado do H3.1

| # | Achado H3.1 | Implicação para o plano |
|---|-------------|-------------------------|
| 1 | Produção = `7ecedca`; não está em `origin/main` | `main` **não** é hoje fonte do que está no ar |
| 2 | Trabalho ativo = `fix/admin-financial-integrity-v1` @ `dac9f8b` | Branch de integração **oficial temporária** |
| 3 | `dac9f8b` está 9 commits à frente de produção (maioria docs) | Separar “documentado” de “deployado” |
| 4 | `origin/main` @ `a60bbf1`; 47 commits só na feature; 1 só em main | Merge planeado deve **absorver** a linha feature |
| 5 | `vercel.json` modificado (provável CRLF) | Não usar working tree local para deploy sem gate |
| 6 | 35 untracked (relatórios, scripts, SQL) | Política de versionamento antes de confiar em docs locais |
| 7 | `goldeouro-admin` = gitlink `bb41c40` sem `.gitmodules` | **Congelar** alterações de submódulo nesta fase |
| 8 | Tag `pre-h2-runtime-traceability-2026-05-12` → `77464f5` (pai de `7ecedca`) | Ponto de rollback Git documentado |
| 9 | Runtime estável (`/health` 200, DB/MP connected) | **Não tocar** em Fly nesta fase |

---

## 3. Verdade operacional atual

**Definição V1:** a verdade operacional é **o estado observável em produção**, não o `HEAD` local nem `origin/main`.

### 3.1 Hierarquia de evidência (ordem de autoridade)

| Prioridade | Fonte | Uso |
|------------|--------|-----|
| **1** | `GET https://goldeouro-backend-v2.fly.dev/meta` | SHA deployado, versão, ambiente |
| **2** | `GET .../health` | Saúde, ligação DB/MP (não substitui SHA) |
| **3** | `fly releases -a goldeouro-backend-v2` | Release/imagem Fly (quando disponível) |
| **4** | Tags Git próximas (`pre-h2-runtime-traceability-2026-05-12`) | Rollback e auditoria |
| **5** | Branch `fix/admin-financial-integrity-v1` | Código **candidato** que contém `7ecedca` |
| **6** | `origin/main` | **Não** descreve produção atual |

### 3.2 Registo canónico (baseline congelada)

| Campo | Valor oficial V1 |
|-------|------------------|
| **App Fly** | `goldeouro-backend-v2` |
| **URL backend** | `https://goldeouro-backend-v2.fly.dev` |
| **gitCommit produção** | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |
| **Versão runtime** | `1.2.1` |
| **Mensagem commit** | `fix(ci): injetar GIT_COMMIT no deploy on-demand Fly (H2)` |
| **Branch que contém o commit** | `fix/admin-financial-integrity-v1` |
| **Tag rollback imediato (Git)** | `pre-h2-runtime-traceability-2026-05-12` → `77464f5` |

### 3.3 O que **não** faz parte da verdade operacional atual

- `dac9f8b` e os 8 commits entre `7ecedca` e `dac9f8b` — **não estão no ar** até novo deploy com gate.
- Ficheiros **untracked** no disco — **não** fazem parte da baseline até commit.
- `origin/main` @ `a60bbf1` — **não** descreve o backend em produção.

**Regra de ouro:** antes de qualquer ação que afete utilizadores ou dinheiro, confirmar **`/meta.gitCommit === 7ecedca`** (ou documentar desvio se mudar).

---

## 4. Verdade Git desejada

**Definição V1 (alvo):** uma única linha **`main`** no monorepo `gol-de-ouro` que:

1. Contém **`7ecedca`** e todos os commits de valor da linha `fix/admin-financial-integrity-v1` até o ponto acordado de integração.
2. É a branch que dispara **pipeline oficial** (`main-pipeline.yml`, políticas de proteção).
3. Permite derivar o SHA de produção futuro via **`/meta`** após deploy **só** a partir de `main` (ou tag de release cortada em `main`).

### 4.1 Estados Git (modelo mental)

| Estado | Branch / ref | Papel |
|--------|--------------|--------|
| **A — Produção congelada** | `7ecedca` (via `/meta`) | O que está no ar **agora** |
| **B — Integração V1** | `fix/admin-financial-integrity-v1` @ `dac9f8b` | Onde se commita **até** merge em `main` |
| **C — Default GitHub (desalinhado)** | `main` @ `a60bbf1` | **Legado** até normalização |
| **D — Alvo** | `main` @ `≥ dac9f8b` (ou merge equivalente) | **Source of truth Git futura** |

### 4.2 Princípio de não-regressão

- Nenhum passo de normalização pode **remover** da história de `main` o conteúdo necessário para reconstruir **`7ecedca`**.
- Merge preferencial: **feature → main** (trazer 47 commits para `main`), não reescrever história da feature com `main` desatualizado por cima.

---

## 5. Política oficial de branches

### 5.1 `main` (futura — e única oficial após normalização)

| Regra | Detalhe |
|-------|---------|
| **Papel** | Branch de integração e release; protegida no GitHub |
| **Deploy backend** | Só após gate H3.3+ e confirmação `/meta` |
| **Estado atual** | **Desalinhada** com produção — tratar como **não representativa** do runtime |
| **Ação até normalização** | **Não** fazer deploy a partir de `main` |

### 5.2 `fix/admin-financial-integrity-v1` (temporária — integração V1)

| Regra | Detalhe |
|-------|---------|
| **Papel** | **Branch de integração autorizada** até merge em `main` |
| **HEAD atual** | `dac9f8b` (= `origin/fix/admin-financial-integrity-v1`) |
| **Contém produção?** | Sim — `7ecedca` é ancestral de `dac9f8b` |
| **Commits não deployados** | `7ecedca..dac9f8b` (9) — auditar antes de merge/deploy |
| **Renomeação** | Opcional futura para `release/v1-stabilization` — **não obrigatória** nesta fase |
| **Após merge em `main`** | Arquivar (read-only) ou apagar **só** com confirmação de que `main` contém o mesmo DAG |

### 5.3 Outras branches

| Regra | Detalhe |
|-------|---------|
| **Hotfixes** | A partir de **tag ou commit de produção** (`7ecedca` ou tag `pre-h2-*`), não de `main` isolado |
| **Novas features** | A partir de `fix/admin-financial-integrity-v1` **ou** `main` **depois** da normalização |
| **Branches antigas** | Não usar para deploy sem verificar contenção de `7ecedca` |

### 5.4 Fluxo alvo (pós-normalização)

```
fix/admin-financial-integrity-v1  ──(PR merge)──►  main  ──(deploy + gate)──►  Fly /meta
```

---

## 6. Política oficial de produção

### 6.1 Congelamento V1

| Item | Política |
|------|----------|
| **SHA em produção** | Manter **`7ecedca`** — sem redeploy, sem rollback, sem `fly deploy` nesta fase H3.2 |
| **Validação contínua** | Read-only: `curl /meta`, `curl /health` (cadência definida pela equipa) |
| **Novo deploy** | **Bloqueado** até critérios GO da secção 14 |
| **Rollback Fly** | **Bloqueado** salvo incidente P0 documentado fora deste plano |

### 6.2 Quando um deploy for autorizado (futuro — H3.3+)

1. Branch de origem = **`main`** (após normalização) ou tag `v1.x` em `main`.
2. Comando com rastreabilidade: `--build-arg GIT_COMMIT=$(git rev-parse HEAD)`.
3. Pós-deploy: **`/meta.gitCommit` === SHA esperado** (obrigatório).
4. Pós-deploy: `/health` 200, smoke admin/player conforme checklist.
5. Registar release Fly + SHA em relatório datado.

### 6.3 Impedir drift futuro

- Tratar **`/meta.gitCommit`** como contrato público interno após cada deploy.
- Proibir deploy “da máquina local” sem SHA registado.
- Pipeline `main`: remover ou rever **`continue-on-error: true`** no deploy — **tarefa H3.4** (fora deste documento).
- Não declarar “produção atualizada” só porque `main` ou feature avançou.

---

## 7. Política de documentação

### 7.1 Situação atual

- **35 ficheiros untracked** (maioria `docs/relatorios/*.md`, mais H3.0x, revisão geral, etc.).
- Relatórios H3.1 e H3.2 passam a existir no disco; até commit, **não** são source of truth para terceiros.

### 7.2 Classificação

| Classe | Exemplos | Política V1 |
|--------|----------|-------------|
| **A — Governança** | H3.1, H3.2, fechamento V1 | Versionar em commit **só docs** na branch de integração |
| **B — Evidência de cirurgia** | DEPLOY-CONTROLADO-*, DIAGNOSTICO-* | Versionar; manter em `docs/relatorios/` |
| **C — Rascunho / duplicado** | Relatórios obsoletos no disco | Revisar antes de commit; não apagar nesta fase |
| **D — Local-only** | Notas não listadas em H3.1 | Não usar para decisão |

### 7.3 Regras

1. **Decisão operacional** baseia-se em documentos **commitados** ou em **`/meta`** — não só em ficheiros `??`.
2. Próxima etapa segura (H3.3a): **um commit `docs:`** na branch `fix/admin-financial-integrity-v1` com relatórios A+B — **sem** código de aplicação.
3. Não misturar commit de docs com alterações em `vercel.json` até resolver CRLF em etapa dedicada.
4. Manter nomenclatura `H3-*`, `DIAGNOSTICO-*`, `DEPLOY-CONTROLADO-*` para rastreio.

### 7.4 `goldeouro-player/vercel.json` (modificado)

- **Não** incluir em commit de docs até etapa **H3.3b** (higiene working tree).
- **Não** usar para deploy manual enquanto `git diff` for ambíguo.

---

## 8. Política de scripts SQL

### 8.1 Inventário sensível (untracked)

| Ficheiro | Risco |
|----------|--------|
| `database/exec-plano-b-reversao-transacao-20260504.sql` | **Alto** — reversão financeira |
| Scripts em `scripts/*20260504*.js` | Execução contra DB real |

### 8.2 Regras V1

| Regra | Detalhe |
|-------|---------|
| **Execução** | **Bloqueada** nesta fase — read-only apenas |
| **Versionamento** | Commit **separado**, mensagem explícita, revisão humana dupla |
| **Localização** | Manter em `database/` ou `scripts/` — nunca só no disco |
| **Produção** | SQL de mutação exige relatório PRE-EXECUCAO + gate + backup |
| **Plano B reversão** | Tratar como **artefacto controlado**, não como “ficheiro solto” |

### 8.3 Migrações já na branch (exemplo)

- `database/migrations/20260512_create_admin_logs.sql` — **já** no histórico da feature; aplicabilidade em Supabase prod = verificar em etapa **read-only** separada, não neste plano.

---

## 9. Política para goldeouro-admin

**Estado (H3.1):** repositório separado `goldeouro-admin.git`, branch `painel-protegido-v1.1.0` @ `bb41c40`; monorepo tem gitlink **sem** `.gitmodules`.

### 9.1 Congelamento H3.2

| Ação | Política |
|------|----------|
| Corrigir `.gitmodules` | **Adiado** — fora de escopo |
| Atualizar gitlink no monorepo | **Bloqueado** |
| Deploy admin Vercel | **Bloqueado** salvo P0 |
| Desenvolvimento admin | No repo **`goldeouro-admin`**, não no monorepo expandido |

### 9.2 Verdade operacional admin (paralela)

| Camada | Fonte |
|--------|--------|
| **Runtime admin** | URL produção documentada (ex. `admin.goldeouro.lol`) + smoke HTTP |
| **Código admin** | Repo `indesconectavel/goldeouro-admin`, ref `bb41c40` |
| **Ponteiro monorepo** | Gitlink `bb41c40` — **informativo**, não confiável para clone sem submodule |

### 9.3 Etapa futura (H3.5 — só planeamento)

Escolher **uma** estratégia: (A) restaurar `.gitmodules` + submodule oficial; (B) remover gitlink e documentar dois repos; (C) subtree. **Não decidir na H3.2.**

---

## 10. Riscos se nada for feito

| Risco | Consequência |
|-------|----------------|
| Deploy acidental a partir de `main` | Código **diferente** de `7ecedca` em produção |
| Deploy a partir de `dac9f8b` sem revisão dos 9 commits | Mudança não auditada (incl. possível código em H3.0B) |
| Confiança em docs `??` | Decisões baseadas em ficheiros que outros clones não têm |
| Execução de SQL untracked | Dano financeiro / irreversível |
| Clone limpo do monorepo | `goldeouro-admin` inconsistente |
| Novo interveniente assume `main` = produção | Cirurgia na branch errada |
| Drift `/meta` vs Git sem registo | Impossível auditoria forense |

---

## 11. Plano seguro de normalização

Sequência **recomendada** — cada fase é uma etapa futura com gate próprio; **nenhuma** é executada por este documento.

### Fase 0 — H3.2 (esta etapa) ✅

- [x] Documento Source of Truth V1 (este ficheiro).

### Fase 1 — H3.3a: Documentação (baixo risco)

1. Commit **apenas** `docs/relatorios/` (incl. H3.1, H3.2, revisão geral, relatórios A/B).
2. Branch: `fix/admin-financial-integrity-v1`.
3. Sem alteração em `server-fly.js`, player, admin, SQL.
4. PR para revisão — **ainda sem merge em `main`**.

### Fase 2 — H3.3b: Higiene working tree (baixo risco)

1. Verificar `git diff goldeouro-player/vercel.json`.
2. Se só CRLF: normalizar ou `checkout` — **commit isolado** ou descarte documentado.
3. Decidir destino dos scripts `scripts/*20260504*` (commit read-only tools vs `.gitignore` explícito).

### Fase 3 — H3.3c: Inventário dos 9 commits `7ecedca..dac9f8b`

1. Listar ficheiros alterados por commit.
2. Classificar: docs-only vs código.
3. Se código em `dac9f8b` (ex. H3.0B): exigir teste antes de qualquer deploy.

### Fase 4 — H3.4: Integração `main` (risco médio — requer revisão)

1. Abrir PR: `fix/admin-financial-integrity-v1` → `main`.
2. Resolver o commit `a60bbf1` que só existe em `main` (merge commit PR #86) — **merge**, não rebase destrutivo.
3. CI verde; revisão humana.
4. **Ainda sem deploy.**

### Fase 5 — H3.5: Tag e baseline Git

1. Tag anotada em `main` pós-merge, ex.: `v1-source-of-truth-2026-05-16` apontando para commit que **contém** `7ecedca`.
2. Opcional: tag `production-7ecedca` imutável no commit exacto de `/meta`.

### Fase 6 — H3.6: Deploy controlado (alto risco — gate máximo)

1. Só após Fases 1–5 e critério GO (secção 14).
2. Deploy de `main` (ou tag) com `GIT_COMMIT`.
3. Validar `/meta` === SHA esperado.
4. Se falhar: rollback Fly para release que tinha `7ecedca` — **não** apagar tag `pre-h2-*`.

### Fase 7 — H3.7: Admin submodule (adiado)

- Resolver `.gitmodules` / estratégia — após backend e `main` estáveis.

---

## 12. O que está liberado

| # | Acção | Condição |
|---|--------|----------|
| L1 | Ler `/meta` e `/health` | Sempre |
| L2 | Ler histórico Git, tags, branches | Sempre |
| L3 | Escrever relatórios em `docs/relatorios/` | Sem commit ainda, ou via Fase 1 |
| L4 | Auditorias read-only (scripts que só leem Supabase) | Sem credenciais em log público |
| L5 | Planejar PRs e checklists | Sem merge |
| L6 | Desenvolvimento **local** em branch de integração | Sem deploy; sem SQL mutável em prod |
| L7 | Trabalhar no repo `goldeouro-admin` separado | Sem alterar gitlink no monorepo |
| L8 | Consultar este documento como autoridade de processo | Equipa e agentes |

---

## 13. O que está bloqueado

| # | Acção | Até quando |
|---|--------|------------|
| B1 | `fly deploy` / qualquer deploy backend | Gate H3.6 + GO secção 14 |
| B2 | Deploy Vercel player/admin | Idem ou gate específico front |
| B3 | `fly rollback` | Salvo P0 documentado |
| B4 | Merge para `main` sem PR revisado | Fase H3.4 |
| B5 | Cirurgia em `server-fly.js`, rotas financeiras, webhooks | Pós-normalização + auditoria |
| B6 | Execução SQL mutável em produção | Gate financeiro dedicado |
| B7 | Commit que mistura docs + código + vercel.json sem revisão | H3.3a/b separados |
| B8 | Corrigir submódulo / `.gitmodules` | H3.7 |
| B9 | Apagar branches ou limpar untracked | Decisão explícita pós-inventário |
| B10 | Declarar `main` ou `dac9f8b` como “produção” | Enquanto `/meta` = `7ecedca` |

---

## 14. Critério GO/NO-GO para próxima etapa

### 14.1 GO para **H3.3a** (commit só documentação)

Todos obrigatórios:

- [ ] Este documento H3.2 lido e aceite pela equipa.
- [ ] `/meta.gitCommit` ainda **`7ecedca`** (ou desvio registado).
- [ ] Nenhum deploy em curso.
- [ ] Lista de ficheiros `docs/` a commitar revista (sem segredos).

### 14.2 GO para **H3.4** (merge em `main`)

Todos obrigatórios:

- [ ] H3.3a e H3.3b concluídos.
- [ ] Inventário `7ecedca..dac9f8b` concluído (H3.3c).
- [ ] PR aprovado; CI executado (mesmo com ressalvas documentadas).
- [ ] Plano de rollback: tag `pre-h2-runtime-traceability-2026-05-12` + release Fly actual identificada.

### 14.3 GO para **H3.6** (deploy)

Todos obrigatórios:

- [ ] `main` contém `7ecedca` e commits acordados.
- [ ] SHA de deploy escolhido e registado **antes** do comando.
- [ ] Janela de manutenção / responsável definido.
- [ ] Smoke pós-deploy definido (meta, health, admin 401, PIX read-only).
- [ ] Rollback Fly ensaiado (`fly releases`).

### 14.4 NO-GO (qualquer fase)

- `/health` não 200 ou DB desconectado.
- Incerteza sobre conteúdo dos 9 commits não deployados.
- Pressão para “só fazer merge rápido” sem PR.
- SQL de reversão prestes a ser executado sem PRE-EXECUCAO.

---

## 15. Decisão final

### Adoptar **Source of Truth V1** com as seguintes definições vinculativas:

| Pergunta | Decisão V1 |
|----------|------------|
| **Qual é a verdade operacional actual?** | **`GET /meta` → `7ecedca`** no app `goldeouro-backend-v2`. Produção **não se altera** nesta fase. |
| **Qual é a verdade Git desejada?** | **`main`** no monorepo `gol-de-ouro`, após absorver a linha `fix/admin-financial-integrity-v1`. |
| **Qual branch usar agora para commits?** | **`fix/admin-financial-integrity-v1`** até merge em `main` (Fase H3.4). |
| **Como tratar `7ecedca`?** | **Baseline congelada**; referência de rollback; ancestral obrigatório de qualquer `main` futuro. |
| **Como tratar `dac9f8b`?** | **Integração**, não produção; auditar 9 commits antes de deploy. |
| **Como tratar `main` @ `a60bbf1`?** | **Desatualizada** relativamente à produção; normalizar via merge, não deploy directo. |
| **Untracked docs?** | Versionar em commit `docs:` dedicado (H3.3a). |
| **Untracked SQL?** | Não executar; versionar com gate ou arquivar em processo controlado. |
| **Admin?** | Repo separado; gitlink **congelado**; resolver em H3.7. |

### Classificação

**Política aprovada para orientação** — implementação **pendente** nas fases H3.3–H3.7.

### Próxima etapa recomendada (única, mais segura)

**H3.3a** — commit **somente** de documentação na branch `fix/admin-financial-integrity-v1`, **sem** código, **sem** deploy, **sem** SQL — desde que checklist 14.1 esteja verde.

---

*Documento de governança — Gol de Ouro V1 — H3.2. Nenhuma implementação realizada nesta etapa.*
