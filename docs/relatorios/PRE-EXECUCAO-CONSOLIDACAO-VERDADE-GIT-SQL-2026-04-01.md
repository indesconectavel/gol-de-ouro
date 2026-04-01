# PRÉ-EXECUÇÃO — CONSOLIDAÇÃO DE VERDADE

**Data:** 2026-04-01  
**Modo:** verificação read-only (comandos Git e leitura de ficheiros locais; sem deploy, sem migração aplicada, sem alteração de código nesta etapa).  
**Branch analisada:** `feature/bloco-e-gameplay-certified` @ `b44f0ce`

---

## 1. Estado atual do Git

| Verificação | Resultado |
|-------------|-----------|
| **Branch atual** | `feature/bloco-e-gameplay-certified` |
| **Relação com remoto** | **Ahead 7** de `origin/feature/bloco-e-gameplay-certified` (7 commits locais não publicados no `origin` desta branch). |
| **Ficheiros modificados (tracked)** | **Nenhum** — working tree limpa relativamente a ficheiros já rastreados. |
| **Staged** | Nada em stage. |
| **Últimos 5 commits (`git log -n 5 --oneline`)** | `b44f0ce` docs(relatorio): execucao controlada final gameplay/saque/auth 2026-03-31 · `c25dd82` fix(finance): align chutes v1 schema and complete saque rpc/fallback · `d7abeb6` docs(relatorio): baseline pré-cirurgia… · `8976d70` chore(baseline): estado pré-cirurgia… · `3525ce8` chore(release): fechamento limpo para teste real pix/webhook/reconcile |

**Interpretação:** O núcleo de código e SQL já integrado na branch (incl. `migration-2026-03-31-chutes-v1-align.sql` e `rpc-financeiro-atomico-2026-03-28.sql`) está **commitado**. Existem **apenas ficheiros não rastreados** (ver secção 2).

---

## 2. Arquivos fora de versionamento

**Todos os itens abaixo aparecem como *Untracked* em `git status` (evidência da sessão de verificação).**

### SQL (`database/`)

| Ficheiro | Estado Git |
|----------|------------|
| `migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql` | **Não rastreado** |
| `migration-2026-04-01-chutes-resultado-legacy-jsonb-nullable.sql` | **Não rastreado** |

### Documentação (`docs/relatorios/`)

| Ficheiro | Estado Git |
|----------|------------|
| `AUDITORIA-SUPREMA-READONLY-ESTADO-GERAL-BLOCOS-2026-04-01.md` | Não rastreado |
| `BLOCO-S-DISTRIBUICAO-ESCALA-ANALISE-2026-04-01.md` | Não rastreado |
| `CORRECAO-SQL-CHUTES-LEGADO-DIRECAO-2026-04-01.md` | Não rastreado |
| `DIAGNOSTICO-CIRURGICO-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | Não rastreado |
| `ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md` | Não rastreado |
| `PRE-EXECUCAO-CIRURGICA-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | Não rastreado |
| `PREPARACAO-AUTOMATICA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | Não rastreado |
| `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` | Não rastreado |
| `VALIDACAO-FINAL-GAMEPLAY-POS-CORRECAO-SQL-2026-04-01.md` | Não rastreado |
| `VALIDACAO-FINAL-PONTA-A-PONTA-GAMEPLAY-SAQUE-HISTORICO-2026-04-01.md` | Não rastreado |
| `PRE-EXECUCAO-CONSOLIDACAO-VERDADE-GIT-SQL-2026-04-01.md` | Este relatório (gerado nesta etapa) — **não rastreado** até `git add` |

**Presença de relatórios 2026-04-01:** existem no disco e estão listados acima; **não** estão no histórico Git enquanto permanecerem *untracked*.

---

## 3. Situação das migrations

### O que está **no repositório** (tracked) — amostra relevante (`git ls-files database/`)

Inclui, entre outros:

- `database/migration-2026-03-31-chutes-v1-align.sql`
- `database/rpc-financeiro-atomico-2026-03-28.sql`
- `database/migrate-pagamentos-pix-*.sql`, `migrate-consentimento-bloco-l-2026-03-30.sql`
- `database/schema*.sql`, correções RLS, etc.

### Padrão `migration-2026-04-01-*`

| Ficheiro | No repo (Git)? | Conteúdo resumido (evidência ficheiro local) |
|----------|----------------|-----------------------------------------------|
| `migration-2026-04-01-chutes-resultado-legacy-jsonb-nullable.sql` | **Não** (untracked) | `ALTER ... resultado_legacy_jsonb DROP NOT NULL`; default `'{}'::jsonb`; rollback documentado no script |
| `migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql` | **Não** (untracked) | `ALTER ... direcao_legacy_int DROP NOT NULL`; default `0`; rollback documentado no script |

### O que a documentação diz sobre o **banco** (sem ligação direta nesta etapa)

Relatórios como `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` e `CORRECAO-SQL-CHUTES-LEGADO-DIRECAO-2026-04-01.md` descrevem **DDL aplicada em produção** (Supabase SQL Editor) para alinhar `NOT NULL`/defaults — ou seja, **execução manual** fora de um pipeline Git-only.

**Conclusão desta secção:**

- Existem **migrations de 2026-04-01 no disco local** que **não** fazem parte do histórico Git.
- A documentação indica **scripts aplicados manualmente** em produção — **reprodutibilidade via clone do repo fica incompleta** até esses ficheiros serem versionados (e, idealmente, o estado do schema ser correlacionado com um commit/tag).

---

## 4. Dependência do banco vs código

| Componente | Dependência |
|------------|-------------|
| **`POST /api/games/shoot`** (`server-fly.js`) | Inserts em `public.chutes` no contrato **V1**; colunas legado `resultado_legacy_jsonb`, `direcao_legacy_int` devem aceitar INSERT sem preenchimento explícito — conforme migrações 2026-04-01 (nullable + default). **Se** o banco em produção **não** tiver essa DDL, comportamento documentado: erro **23502** / HTTP 500. |
| **Saque / PIX / RPC** | Alinhamento com `rpc-financeiro-atomico-2026-03-28.sql` (tracked) + código em `c25dd82`. |
| **Deploy novo (Fly)** | Binário Node segue o código commitado; **não** aplica SQL automaticamente salvo processo externo. Risco: **código assume schema** já migrado; ambiente novo sem aplicar **toda** a cadeia SQL (31/03 + 04/01 conforme necessário) **quebra** na primeira escrita em `chutes`. |

---

## 5. Análise de drift

| Par | Classificação | Justificativa |
|-----|----------------|----------------|
| **Código local vs Git (tracked)** | **Sem drift** | Sem alterações não commitadas em ficheiros rastreados. |
| **Git local vs `origin` (branch atual)** | **Drift leve** | **7 commits** à frente do remoto da mesma branch — outro clone do `origin` não vê esse trabalho até `push`. |
| **Git vs produção (código)** | **Drift moderado** (hipótese) | **Evidência insuficiente** para afirmar qual commit está deployado no Fly neste momento; o handoff referiu releases anteriores (ex. v344) — **validação runtime/deploy record** não foi refeita aqui. |
| **Código vs banco** | **Drift moderado a crítico** | **Crítico** se: produção foi alterada manualmente e o repositório **não** contém os SQL de 2026-04-01 — qualquer novo ambiente ou auditoria por repo **diverge** do estado real da BD. **Moderado** se: os ficheiros 2026-04-01 forem commitados e a BD documentada como igual aos scripts. |

**Resumo:** O principal problema de verdade é **migrations 2026-04-01 fora do Git** + **DDL manual em produção descrita nos docs** → **drift de reprodutibilidade** elevado até consolidação.

---

## 6. Capacidade de rollback

| Critério | Situação |
|----------|----------|
| **Commit estável recente?** | Sim — histórico linear com commits datados 2026-03-31; exemplo de referência pré-cirurgia: tag `pre-cirurgia-gameplay-saque-auth-2026-03-31` → `8976d70` (baseline com falha reproduzida, *antes* do fix `c25dd82`). |
| **Tag de segurança?** | Sim — várias tags no repo (ex.: `pre-cirurgia-gameplay-saque-auth-2026-03-31`, `v1.2.0`, `v1.2.1`, …). |
| **Rollback só de código** | **Possível** via `git checkout` / revert para commit ou tag — **com ressalvas:** regressão funcional esperada se o código voltar atrás mas o **schema** permanecer no estado pós-DDL de abril (ou o inverso). |
| **Rollback do banco** | Os scripts 2026-04-01 incluem secções **ROLLBACK** comentadas; **reverter DDL em produção** exige janela operacional e validação — **não** é automático com deploy. |

**Classificação:** rollback **Git** — **boa capacidade**. Rollback **ponta a ponta (app + BD)** — **risco médio** se não houver runbook e backup/schema snapshot alinhados.

---

## 7. Riscos antes da execução

1. **Migrations 2026-04-01 não versionadas** — clone limpo **não** reproduz o estado documentado de produção só com `git checkout` na branch atual.
2. **7 commits não enviados ao `origin`** — perda local ou fork de verdade se não houver backup remoto.
3. **Deploy** assumindo schema sem checklist SQL — risco de **500/23502** em `chutes` em ambiente novo ou após regressão de código.
4. **Produção vs commit deployado** — sem evidência recolhida nesta etapa (Fly release ID), permanece **hipótese** a coincidência exata.

---

## 8. Pode prosseguir para execução?

**SIM COM RESSALVAS**

- **SIM** para continuar o **pipeline de documentação e consolidação** (incluir este relatório e os SQL no Git quando a equipa autorizar a etapa de versionamento).
- **NÃO** para **deploy/migração/cirurgia em produção** com critério estrito de “repo = fonte única da verdade” **enquanto** `migration-2026-04-01-*.sql` permanecerem **untracked** — nesse sentido restrito:

**❌ EXECUÇÃO BLOQUEADA** — *deploy ou migração nova em produção sem antes versionar os SQL de 2026-04-01 e alinhar processo ao repositório.*

---

## 9. Ações obrigatórias antes da cirurgia

1. **`git add` + commit** (ou equivalente aprovado) dos ficheiros `database/migration-2026-04-01-*.sql` e dos relatórios de handoff/validação que forem considerados canónicos.
2. **`git push`** da branch `feature/bloco-e-gameplay-certified` (ou merge para branch estável) para eliminar o **drift local vs origin** dos 7 commits.
3. **Confirmar** no Supabase/produção (read-only ou checklist) que o schema atual corresponde ao **último** script versionado (colunas nullable/defaults como nos `.sql`).
4. **Registar** qual commit/tag está associado ao deploy Fly atual (dashboard ou CI) para fechar o triângulo **Git ↔ deploy ↔ BD**.
5. Manter **backup** ou export `information_schema` / snapshot antes de qualquer nova DDL.

---

*Fim do relatório de pré-execução — consolidação Git + SQL + risco (2026-04-01).*
