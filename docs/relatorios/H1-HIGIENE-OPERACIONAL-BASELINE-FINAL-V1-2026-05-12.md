# H1 — HIGIENE OPERACIONAL E BASELINE FINAL V1

**Data do diagnóstico:** 2026-05-12  
**Modo:** read-only sobre código, deploy e base; **única escrita** permitida: este relatório.  
**Branch auditada:** `fix/admin-financial-integrity-v1`  
**HEAD no momento da auditoria:** `57d0c7bdace0bd8c65279a743939007fc8d92263` (`57d0c7b` — *docs: registrar validacao funcional T14A painel admin V1*).  
**Contexto operacional declarado:** T14A validada e versionada; Fly **v451**; admin em produção.

---

## 1. Resumo executivo

O repositório encontra-se **alinhado com `origin/fix/admin-financial-integrity-v1`** (sem commits locais à frente ou atrás). O histórico recente concentra-se em documentação T14A e correção estrutural do painel admin. Contudo, a **árvore de trabalho não está limpa**: existe **um ficheiro rastreado modificado** (`goldeouro-player/vercel.json`) e **26 ficheiros não rastreados** (`??`), sobretudo relatórios operacionais e artefactos de incidente (maio/2026 e anteriores), mais **SQL e scripts pontuais** ligados a “Plano B” / reconciliação de saque manual.

Isto gera **drift operacional visível** e **risco elevado de commit acidental** (`git add .` ou interfaces que agrupam alterações). O conteúdo lógico de `vercel.json` **coincide com o commit HEAD** na comparação textual; o estado `modified` é **compatível com drift de fim-de-linha (CRLF/LF)** e aviso do Git na working copy.

**Separador conceptual:** baseline **V1 em produção** (HEAD remoto + tags T14A) está **coerente**; a **higiene local** exige decisão explícita sobre o que versionar, arquivar, ignorar ou descartar — **não** misturar com commits de produto sem cirurgia dedicada.

**Classificação global (secção 16):** **BASELINE ESTÁVEL COM RESSALVAS**.

---

## 2. Estado Git atual

### Comandos e resultados

| Comando | Resultado |
|---------|-----------|
| `git status --short` | Ver tabela abaixo |
| `git status` | Branch `fix/admin-financial-integrity-v1`; **up to date** com `origin/fix/admin-financial-integrity-v1`; 1 modified; 26 untracked; **nothing staged** |
| `git branch --show-current` | `fix/admin-financial-integrity-v1` |
| `git log -5 --oneline` | `57d0c7b` docs validação T14A; `97d1d04` docs execução runtime T14A; `ca4c6a0` fix T14A; `8ba15cf` docs preparação T14A; `3798a08` docs preparação T14A |

### `git status --short` (snapshot)

**Modificado (tracked, não staged):**

- ` M goldeouro-player/vercel.json`

**Não rastreados (`??`):**

- `database/exec-plano-b-reversao-transacao-20260504.sql`
- `docs/relatorios/CIRURGIA-2-ALINHAMENTO-DEPLOY-PAINEL-ADMIN-VERCEL-2026-05-04.md`
- `docs/relatorios/DECISAO-CONTROLADA-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `docs/relatorios/DEPLOY-CONTROLADO-AUTH-REAL-PAINEL-ADMIN-2026-05-06.md`
- `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-4-SAQUES-REAIS-PAINEL-ADMIN-2026-05-06.md`
- `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-5-DASHBOARD-REAL-2026-05-06.md`
- `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-8-ROTA-USUARIOS-2026-05-06.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-404-PAINEL-ADMIN-VERCEL-2026-05-04.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-DASHBOARD-REAL-PAINEL-ADMIN-2026-05-06.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-LOGS-AUDITORIA-ADMIN-2026-05-12.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-RELATORIO-FINANCEIRO-REAL-2026-05-06.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-TELA-AUDITORIA-ADMIN-2026-05-12.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-USUARIOS-REAIS-PAINEL-ADMIN-2026-05-06.md`
- `docs/relatorios/DIAGNOSTICO-REAL-DADOS-PAINEL-ADMIN-2026-05-06.md`
- `docs/relatorios/EXECUCAO-CONTROLADA-PLANO-B-REVERSAO-2026-05-04.md`
- `docs/relatorios/GATE-FINAL-READONLY-RECONCILIACAO-SAQUE-MANUAL-2026-05-04.md`
- `docs/relatorios/PRE-EXECUCAO-ALINHAMENTO-DEPLOY-PAINEL-ADMIN-2026-05-04.md`
- `docs/relatorios/PRE-EXECUCAO-PLANO-B-REVERSAO-LEDGER-INDEVIDO-2026-05-04.md`
- `docs/relatorios/RELATORIO-MIGRACAO-TABELA-ADMIN-LOGS-2026-05-12.md`
- `docs/relatorios/TRIAGEM-INCONSISTENCIA-HISTORICA-SAQUE-MANUAL-2026-05-04.md`
- `docs/relatorios/VALIDACAO-2-BANCO-REAL-SAQUES-MANUAIS-READONLY-2026-05-04.md`
- `scripts/exec-plano-b-reversao-20260504.js`
- `scripts/gate-final-readonly-reconciliacao-20260504.js`
- `scripts/readonly-validacao2-saques-20260504.js`
- `scripts/test-withdraw-admin.js`
- `scripts/triagem-readonly-inconsistencia-saque-20260504.js`

### Staged / ahead / behind

| Métrica | Valor |
|---------|--------|
| **Staged** | Nenhum (`git status`: *no changes added to commit*) |
| **Ahead/behind** | **Up to date** com `origin/fix/admin-financial-integrity-v1` |

### Tags recentes (referência)

Ordem por `creatordate` (amostra): `t14a-runtime-alignment-admin-v1-2026-05-12`, `pre-t14a-painel-admin-v1-2026-05-12`, `pre-admin-financial-integrity-2026-05-04`, tags `v1-*` e `cirurgia-cors-*` anteriores.

### Nota de governança (submódulo)

`git submodule status` falhou com: *no submodule mapping found in .gitmodules for path 'goldeouro-admin'*. Isto indica **gitlink / histórico de submódulo sem `.gitmodules` presente** no estado atual — **risco de drift e de onboarding** (secção 8). Não foi corrigido (read-only).

---

## 3. Auditoria do `vercel.json`

**Ficheiro:** `goldeouro-player/vercel.json`  
**Estado Git:** `modified` (não staged).

### Comparação conteúdo vs `HEAD`

- `git show HEAD:goldeouro-player/vercel.json` e o ficheiro na working copy são **JSON equivalentes** na estrutura observada (headers CSP, rotas SPA, `/download`, etc.).
- `git diff --stat` / diff com `--ignore-cr-at-eol` **não mostraram alterações de linhas** nesta sessão; o Git emite aviso: *LF will be replaced by CRLF* na working copy.

### Determinações

| Questão | Conclusão |
|---------|-----------|
| Alteração legítima de produto? | **Não evidenciada** — sem delta semântico face ao HEAD. |
| Drift? | **Sim**, típico de **EOL / normalização Windows** ou toque acidental no ficheiro. |
| Esquecida no commit? | Possível no passado; hoje aparece como **ruído local**. |
| Crítica / risco de produção? | **Baixo** se o remoto já reflete o mesmo JSON; **médio** se alguém fizer commit sem revisão e misturar com outras alterações. |
| Deve entrar em commit agora? | **Não automaticamente** — sem mudança funcional, commit só **polui histórico** ou fixa EOL com política explícita (`core.autocrlf`). |
| Deve ser descartada? | **Recomendado** `git restore goldeouro-player/vercel.json` **após** confirmar visualmente que não há intenção de alterar CSP/rotas — **fora do âmbito H1** se read-only estrito à escrita zero; operador decide. |
| Cirurgia própria? | Opcional: **“normalização EOL + política .gitattributes”** como tarefa H2/higiene, não misturada com T14A/admin. |

---

## 4. Auditoria dos arquivos `??`

Classificação por ficheiro (categorias do pedido: 1–10). *Uma linha pode tocar duas categorias (ex.: válido + sensível).*

| Ficheiro | Categoria principal | Notas |
|----------|---------------------|--------|
| `database/exec-plano-b-reversao-transacao-20260504.sql` | **4** SQL temporário / **7** resíduo operacional | Plano B pontual; IDs de saque/ledger; **crítico** se executado sem revisão. |
| `docs/relatorios/CIRURGIA-2-ALINHAMENTO-...` | **1** relatório válido | Deploy/admin; candidato a versionar ou arquivar. |
| `docs/relatorios/DECISAO-CONTROLADA-RECONCILIACAO-...` | **1** | Decisão formal; **versionar**. |
| `docs/relatorios/DEPLOY-CONTROLADO-AUTH-...` | **1** | Evidência deploy; **versionar**. |
| `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-4-...` | **1** | Idem. |
| `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-5-...` | **1** | Idem. |
| `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-8-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-READONLY-404-...` | **1** | Diagnóstico; pode sobrepor tematicamente relatórios já existentes → ver secção 5. |
| `docs/relatorios/DIAGNOSTICO-READONLY-DASHBOARD-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-READONLY-LOGS-AUDITORIA-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-READONLY-RELATORIO-FINANCEIRO-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-READONLY-TELA-AUDITORIA-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-READONLY-USUARIOS-...` | **1** | Idem. |
| `docs/relatorios/DIAGNOSTICO-REAL-DADOS-...` | **1** | Idem. |
| `docs/relatorios/EXECUCAO-CONTROLADA-PLANO-B-...` | **1** + **2** | Execução sensível; **versionar** para trilho de auditoria **ou** arquivar fora do repo. |
| `docs/relatorios/GATE-FINAL-READONLY-RECONCILIACAO-...` | **1** | Gate formal; **versionar**. |
| `docs/relatorios/PRE-EXECUCAO-ALINHAMENTO-...` | **1** | Pré-execução; **versionar**. |
| `docs/relatorios/PRE-EXECUCAO-PLANO-B-REVERSAO-...` | **1** | Idem. |
| `docs/relatorios/RELATORIO-MIGRACAO-TABELA-ADMIN-LOGS-...` | **1** | Migração admin_logs; útil para V1; **versionar**. |
| `docs/relatorios/TRIAGEM-INCONSISTENCIA-HISTORICA-...` | **1** | Triagem; **versionar**. |
| `docs/relatorios/VALIDACAO-2-BANCO-REAL-SAQUES-...` | **1** | Validação readonly; **versionar**. |
| `scripts/exec-plano-b-reversao-20260504.js` | **6** script temporário + **9** sensível (`DATABASE_URL`, produção) | Par Plano B; não é pipeline CI. |
| `scripts/gate-final-readonly-reconciliacao-20260504.js` | **6** | Readonly gate pontual. |
| `scripts/readonly-validacao2-saques-20260504.js` | **6** | Validação pontual. |
| `scripts/test-withdraw-admin.js` | **8** artefato de teste / **6** | Smoke admin saques; risco se apontar a prod sem guardrails. |
| `scripts/triagem-readonly-inconsistencia-saque-20260504.js` | **6** | Triagem one-off. |

**Candidatos a `.gitignore` (10):** normalmente **não** ignorar estes relatórios se o objetivo é trilho de auditoria — melhor **commit controlado** ou pasta `docs/arquivo/` versionada. **Ignorar** apenas se a política for “evidências só fora do Git” (aí `.gitignore` por padrão `*-local.*` ou pasta `scratch/`).

---

## 5. Auditoria de documentação

### Relatórios já versionados

`git ls-files docs/relatorios` lista **centenas** de ficheiros `.md` (e alguns `.json`/`.js`), incluindo T14A (`CIRURGIA-T14A-*`, `EXECUCAO-CONTROLADA-RUNTIME-T14A-*`, `VALIDACAO-FUNCIONAL-T14A-*`, diagnósticos operacionais recentes, etc.). A **densidade histórica** já é alta.

### Relatórios ainda não versionados (lista `??` em `docs/relatorios`)

São **20** Markdown operacionais (maio e abril 2026), em grande parte **complementares** ao arco admin / saque manual / Plano B. **Não** são “temporários” no sentido de rascunho vazio: têm valor de **compliance e auditoria**.

### Duplicados / obsolescência

- **Duplicidade literal:** não foi feita comparação `diff` par a par nesta auditoria.
- **Sobreposição temática:** vários `DIAGNOSTICO-READONLY-*` e `DEPLOY-CONTROLADO-*` podem **cruzar narrativas** com relatórios já no Git com nomes semelhantes (ex.: outras CIRURGIAS admin). Risco: **dois documentos** para o mesmo incidente com **ligeira divergência** de conclusão.
- **Obsoletos:** um relatório pode ficar obsoleto **após** gate/execução; ainda assim pode **manter-se** como evidência temporal (marcar no título ou índice — backlog editorial).

### Recomendações (sem executar)

| Ação | Alvo |
|------|------|
| **Versionar** (commit dedicado “docs: arco admin/saque manual maio 2026”) | Bloco inteiro dos 20 `.md` em `??`, em lote controlado. |
| **Arquivar** | Se política interna exige separar “incident response” → `docs/relatorios/incidentes/2026-05/` (mudança de pastas = cirurgia futura, não H1). |
| **Ignorar** | Não recomendado para estes `.md` se forem prova formal; preferir versionar. |

### Este relatório H1

`H1-HIGIENE-OPERACIONAL-BASELINE-FINAL-V1-2026-05-12.md` após criação ficará **`??`** até commit explícito — alinhar com política “um commit = um relatório” ou agrupar com bloco acima.

---

## 6. Auditoria de scripts

O diretório `scripts/` contém **dezenas/centenas** de ficheiros (PowerShell, JS, SQL, `obsoletos/`, etc.) — muitos **já rastreados**.

### Scripts em `??` (missão atual)

| Ficheiro | Natureza |
|----------|----------|
| `exec-plano-b-reversao-20260504.js` | **Pontual**, produção-capable via `pg` + `DATABASE_URL`. |
| `gate-final-readonly-reconciliacao-20260504.js` | Readonly / gate. |
| `readonly-validacao2-saques-20260504.js` | Validação readonly. |
| `triagem-readonly-inconsistencia-saque-20260504.js` | Triagem. |
| `test-withdraw-admin.js` | Teste/smoke admin saques. |

**Classificação global do bucket `scripts/` (repositório):**

| Tipo | Descrição |
|------|-----------|
| **Ativos** | Scripts referenciados em docs, CI ou runbooks (validar por uso — fora do escopo grep total H1). |
| **Órfãos / sem uso** | Possível em `obsoletos/` e nomes genéricos `test-*.js`. |
| **Temporários** | Os cinco `??` com sufixo de data `20260504`. |
| **Perigosos** | Qualquer script que altere ledger/saques com credenciais reais sem confirmação humana. |
| **Fora do pipeline** | Scripts manuais locais; não substituem migrations nem Fly release. |

---

## 7. Auditoria SQL

### Migrations e SQL rastreados (amostra em `database/`)

Incluem `migrations/20260512_create_admin_logs.sql`, `20260424_mp_payout_transaction_intents.sql`, `20260428_add_cpf_cnpj_usuarios.sql`, `20260201_manual_withdraw_v1_ledger_and_status.sql`, schemas e utilitários — **maioria já no Git** (baseline schema).

### SQL em `??`

| Ficheiro | Classificação |
|----------|----------------|
| `database/exec-plano-b-reversao-transacao-20260504.sql` | **SQL pontual de incidente** (Plano B, transação `BEGIN`…, IDs fixos). **Não** é migration genérica. |
| Risco | **Crítico** se aplicado em produção sem revisão; **útil** como artefacto de auditoria se versionado com contexto. |

**“Nunca aplicado”:** não determinável remotamente sem registo em Supabase/fly — apenas trilho em docs + SQL versionado pode provar.

---

## 8. Drift operacional identificado

| Tipo de drift | Evidência |
|---------------|-----------|
| **Working tree vs HEAD** | `vercel.json` modificado; 26 `??`. |
| **Working tree vs remoto** | Igual ao acima (branch alinhada ao `origin`). |
| **Documentação fora do Git** | 20 relatórios `.md` + SQL + scripts de incidente. |
| **EOL / normalização** | Aviso Git sobre CRLF em `vercel.json`; diff semântico ausente. |
| **Submódulo / gitlink** | Erro `goldeouro-admin` sem entrada em `.gitmodules`. |
| **Risco `git add -A`** | Mistura **player**, **SQL de reversão** e **20 relatórios** num único commit acidental. |

---

## 9. Riscos críticos

1. **Execução acidental** de `exec-plano-b-reversao-20260504.js` ou SQL homónimo contra **produção** com `DATABASE_URL` válido.  
2. **`git commit -a` / stage em massa** incluindo `vercel.json` e artefactos de incidente sem revisão.  
3. **Governança do `goldeouro-admin`**: mapping de submódulo ausente pode levar a **clones incompletos** ou confusão de ponteiro.

---

## 10. Riscos médios

1. **Duplicação narrativa** entre relatórios versionados e `??` (leitores escolhem versão errada).  
2. **Scripts `test-withdraw-admin.js`** e similares: podem disparar fluxos financeiros se mal configurados.  
3. **Acúmulo de `??`**: mascara novos ficheiros importantes em futuras auditorias.

---

## 11. Riscos leves

1. Ruído visual em `git status` para desenvolvedores.  
2. Avisos CRLF repetidos no Windows.  
3. Tamanho do histórico de `docs/relatorios` (já extenso) — manutenção editorial futura.

---

## 12. Itens recomendados para commit futuro

1. **Lote de documentação:** os 20 `docs/relatorios/*.md` listados em `??` (commit(s) só docs).  
2. **Este H1** após revisão humana.  
3. **Opcional:** versionar SQL + scripts do Plano B **num único commit arquivístico** com mensagem explícita “artefactos incidente 2026-05-04” **ou** mover para repositório privado de compliance (política da equipa).

**Não** recomendado: commit “às cegas” de `vercel.json` sem prova de intenção.

---

## 13. Itens recomendados para descarte

- **Nenhum descarte automático** nesta auditoria (read-only e risco de perda de prova).  
- **Após** cópia segura ou commit: operador pode `git restore goldeouro-player/vercel.json` se confirmado como só EOL.

---

## 14. Itens recomendados para `.gitignore`

- **Não** ignorar em massa `docs/relatorios` se a política for auditoria no Git.  
- **Opcional:** pasta local não versionada (ex.: `local/` ou `scratch/`) no `.gitignore` para **futuros** rascunhos pessoais — **não** aplicado em H1.  
- Ficheiros `.env`, `.env.production` já devem estar ignorados (validar noutra tarefa — não inspecionado aqui em profundidade).

---

## 15. Hardening futuro H2

### H2 (pós-V1 baseline, hardening técnico)

- **`/meta`:** expor **`gitCommit`** real (hash do build) além de `version` estática — hoje produção pode reportar `gitCommit: null` (observado em validações anteriores).  
- **Observabilidade:** correlação request-id, níveis de log, métricas Fly.  
- **Logs estruturados** (JSON) no backend admin/financeiro.  
- **Rastreabilidade:** ligar admin actions a `admin_logs` com contexto mínimo (IP, rota, actor).  
- **Warning Fly listener:** investigar e documentar se o processo escuta `0.0.0.0:PORT` esperado; healthchecks consistentes.

### Fora da V1 (explícito)

- Novas features de jogo, antifraud pesado, redesign, refatorações amplas, novos produtos — **backlog pós-baseline**, não misturar com fecho H1.

---

## 16. Diagnóstico global da baseline

| Critério | Avaliação |
|----------|-----------|
| HEAD remoto + tags T14A | **Coerente** com “V1 admin operacional”. |
| Working tree local | **Suja** — drift documental e EOL. |
| Risco operacional | **Moderado** até higienização controlada. |

**Classificação:** **BASELINE ESTÁVEL COM RESSALVAS**

- **Não** “BASELINE INSTÁVEL”: não há evidência de branch divergente do remoto nem de commits corrompidos.  
- **Não** “BASELINE ESTÁVEL” pleno: working tree com incidente SQL/scripts fora do Git + `vercel.json` dirty.

---

## 17. Próxima etapa recomendada

1. **Decisão única** sobre `goldeouro-player/vercel.json`: restaurar para HEAD **ou** normalizar `.gitattributes` numa tarefa dedicada.  
2. **Commit controlado** dos 20 relatórios `docs/relatorios` em `??` (e opcionalmente SQL/scripts do Plano B) — **sem** misturar com código de produto.  
3. **Corrigir governança** `goldeouro-admin`: restaurar `.gitmodules` ou converter para dependência clara documentada.  
4. **Versionar este H1** após revisão.  
5. Iniciar planeamento **H2** conforme secção 15, após fecho explícito da baseline V1 em reunião/runbook.

---

*Fim do relatório H1 — apenas diagnóstico e recomendações; nenhuma alteração automática aplicada ao repositório além da criação deste ficheiro.*
