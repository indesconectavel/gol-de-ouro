# HIGIENIZAÇÃO DO WORKING TREE — ADMIN FINANCEIRO

**Data:** 2026-05-04  
**Branch:** `fix/admin-financial-integrity-v1`  
**Referência:** `docs/relatorios/PREPARACAO-AUTOMATICA-ADMIN-FINANCEIRO-2026-05-04.md`  

**Escopo:** classificar alterações locais, inspecionar diffs, remover artefatos temporários claramente descartáveis, e registrar commit **somente documental** alinhado à preparação pré-cirurgia admin/financeiro. **Nenhuma** alteração de lógica aplicada nem correção funcional neste passo.

---

## 1. Resumo executivo

- Executado `git status --short` antes e depois da higienização.  
- Removidos **22** ficheiros **`.tmp_*`** na raiz do repositório (logs/evidências temporárias; inclui nome sugestivo de segredos — **nunca** versionar).  
- **Commit documental criado** contendo apenas **5** ficheiros em `docs/relatorios/` do trilho explícito **admin financeiro / painel**.  
- **Não incluídos** no commit (mantidos modificados ou por rastrear): `database/shoot_apply_atomic_transaction.sql`, `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md`, `goldeouro-player/vercel.json`, dezenas de relatórios e pastas `docs/` ainda não rastreados, SQL em `database/` não rastreado, etc.  

**Árvore após esta fase:** ainda **não está totalmente limpa** (restam modificados não commitados + muito `??` em `docs/`) — ver secção GO/NO-GO.

---

## 2. Categorização inicial (`git status --short`)

### 2.1 Relatórios válidos — trilho admin financeiro (alvo do commit único)

| Ficheiro |
|----------|
| `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md` |
| `docs/relatorios/PRE-EXECUCAO-BLOCO-FINANCEIRO-SAQUES-MANUAIS-2026-05-04.md` |
| `docs/relatorios/DIAGNOSTICO-READONLY-PAINEL-ADMIN-COMPLETO-2026-05-04.md` |
| `docs/relatorios/PREPARACAO-AUTOMATICA-ADMIN-FINANCEIRO-2026-05-04.md` |
| `docs/relatorios/HIGIENIZACAO-WORKING-TREE-ADMIN-FINANCEIRO-2026-05-04.md` *(este ficheiro, após gravado)* |

### 2.2 Arquivos temporários `.tmp_*` (removidos)

Raiz do repo — **22 ficheiros** (lista completa no registo da operação):

- `.tmp_after_merge_full_logs.txt` … `.tmp_worker_866e9e59_logs.txt`  
- Destaque de risco: **`.tmp_d3_secrets.txt`** (nome implícito de material sensível — remoção local reduz superfície de vazamento acidental por `git add .`).

### 2.3 Arquivos modificados críticos (fora do commit documental)

| Ficheiro | Decisão |
|----------|---------|
| `database/shoot_apply_atomic_transaction.sql` | **Manter fora do commit documental** — alterações substanciais (idempotência `shoot_idempotency`, assinatura `shoot_apply`, `extensions.gen_random_bytes`). Requer revisão própria / PR técnico. |
| `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md` | **Manter fora deste commit** — doc de outro trilho (jogador); diff pequeno (precisão sobre triggers / psql). Pode entrar num commit só docs jogador quando desejado. |
| `goldeouro-player/vercel.json` | **Manter fora do commit documental** — `git diff` não mostrou alteração textual substantiva nesta cópia; Git alertou apenas **LF/CRLF**. Tratar como config de deploy quando houver revisão explicitamente de player/deploy. |

### 2.4 Não rastreados relevantes (mantidos como `??`; não fazem parte do commit narra ao admin financeiro único)

- `database/claim_and_credit_approved_pix_deposit.sql`, `database/ledger_financeiro_cirurgia_add_usuario_id.sql` — **SQL cirúrgico**; revisão própria.  
- `docs/arquitetura/`, `docs/empresa/`, `docs/engine/`, `docs/operacao/`, `docs/pipeline/`, `docs/releases/`, `docs/sistema/` — coleções grandes; entrada em Git pode ser um **commit(es) só docs separado(s)** quando a equipa quiser canonicalizar documentação.  
- Dezenas de outros `docs/relatorios/*.md` não rastreados — idem.  

### 2.5 Lixo / artefatos descartáveis

- Toda a família **`.tmp_*`** na raiz — **removida** após listagem.

---

## 3. `git diff` por ficheiro modificado (resumo técnico)

### 3.1 `database/shoot_apply_atomic_transaction.sql`

- Introduz tabela **`public.shoot_idempotency`** e fluxo de idempotência com `p_idempotency_key`, `pg_advisory_xact_lock(hashtextextended(...))`.  
- Altera assinatura de **`shoot_apply`** para **4** argumentos (`uuid, text, numeric, text` default null).  
- Substitui `gen_random_bytes` por **`extensions.gen_random_bytes`**.  
- Ajusta `COMMENT`, `REVOKE`, `GRANT` para a nova assinatura.  

**Decisão:** não commitar neste passo documental.

### 3.2 `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md`

- Uma linha de documentação: esclarece validação de triggers e que **`\dS` é meta-comando psql**, não SQL Editor web.  

**Decisão:** não commitar neste commit (escopo “admin financeiro”); opcional futuro commit `docs:` jogador.

### 3.3 `goldeouro-player/vercel.json`

- Na execução de `git diff`, **saída vazia** além dos avisos de **normalização CRLF** — trabalhar linha endings / diferença só no working tree vs index numa revisão futura focada deploy.  

**Decisão:** fora deste commit.

---

## 4. Decisão por categoria — aplicada

| Categoria | Ação aplicada |
|-----------|----------------|
| Docs admin financeiro (5 ficheiros) | **`git add` + commit** com mensagem acordada |
| `.tmp_*` | **Eliminação física** (22 ficheiros) |
| SQL shoot / modificação forte | **Deixado por rastrear / modificado**, sem stage |
| Doc jogador modificada | **Deixado modificado**, sem stage |
| `vercel.json` | **Sem stage** |
| Bulk `docs/**` não rastreado | **Permanece `??`**; decisão equipa posterior |

---

## 5. Commit documental

**Mensagem:**

```text
docs: registrar preparação admin financeiro pré-cirurgia
```

**Ficheiros incluídos:** os cinco listados na secção 2.1.

**Commit documental:** mensagem `docs: registrar preparação admin financeiro pré-cirurgia`. O identificador exato é sempre o **`HEAD`** desta branch depois do passo 5 — confirmar com:

`git log -1 --oneline` e `git rev-parse HEAD`

*(Evita referência estática a um hash que mudaria com `git commit --amend`.)*

---

## 6. `git status --short` (final, após remoção `.tmp_*` e commit)

Ver saída capturada no terminal após as operações. Esperado:

- **Nada** a mostrar para `.tmp_*`.  
- **3** linhas ` M` se ainda não restaurados: `database/...`, `docs/...FLUXO-JOGADOR...`, `goldeouro-player/vercel.json`.  
- Muitas linhas `??` para `docs/` e `database/` não rastreados.  

---

## 7. Riscos residuais

| Risco | Mitigação sugerida |
|-------|---------------------|
| Working tree ainda suja | Commit separado “docs: sync relatórios pendentes” ou `.gitignore` + política |
| Shoot SQL modificado não commitado | Arriscado esquecer em deploy — etiquetar Issue ou PR próprio |
| `??` docs massivos | `git add docs/relatorios` em lote quando aprovado pela governança |

---

## 8. Critério para próxima etapa

- **GO (parcial):** trabalho cirúrgico **admin pode começar** em cima da branch atual com **tag anterior** (`pre-admin-financial-integrity-2026-05-04`) + **segundo compromisso** (este commit só docs).  
- **NO-GO (árvore “limpa”)** até: resolver os **3 modificados restantes** (commit, stash ou restore) **e** decidir política para o **bulk `docs/**` não rastreado**.

---

## 9. Rollback

- **`git revert HEAD`** — reverte apenas o último commit se for só docs.  
- **`git checkout -- arquivos`** — para descartar modificação local específica (não aplicado aqui).  
- **Irreversível local:** ficheiros `.tmp_*` apagados; se necessários como evidência forense, deverão existir só fora do repo ou em backup já controlado pela equipa.

---

*Fim do relatório de higienização.*
