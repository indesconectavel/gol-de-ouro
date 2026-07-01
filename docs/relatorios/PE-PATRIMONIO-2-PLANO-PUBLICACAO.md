# PE.PATRIMÔNIO.2 — Plano de Publicação Patrimonial

**Projeto:** Indesconectável Payment Engine™ V1  
**Produto de referência:** Gol de Ouro™ V1  
**Data:** 2026-07-01  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração executada  
**Branch auditada:** `chore/f2-4e-2-mp-log`  
**HEAD:** `d188ca6`  
**Remote HEAD:** `6e24318`  
**Auditor:** Agente Cursor (PE.PATRIMÔNIO.2)

---

## Veredito

# PASS COM RESSALVAS

É **seguro e recomendado** publicar os **5 commits PE já existentes** via fast-forward push — risco **NULO/BAIXO** para a baseline certificada, pois são commits exclusivamente patrimoniais (documentação + namespace P2.2) e o remote está **0 behind / 5 ahead**.

Porém a **publicação institucional completa** exige ressalvas: **463 arquivos untracked**, **27 modificados fora da baseline**, **tags não publicadas**, **tag P2.2 inexistente**, **P1.9/P2.1 sem commit**, e **hash P2.2 desalinhado** no relatório oficial. Publicar hoje apenas o push dos 5 commits resolve ~30% do patrimônio documental; o restante exige curadoria prévia.

---

## Estado Git

### Snapshot (2026-07-01)

| Campo | Valor |
|-------|-------|
| Branch atual | `chore/f2-4e-2-mp-log` |
| HEAD | `d188ca6fb6a30ae9a883685d5f5e30d0f69254c3` |
| Upstream | `origin/chore/f2-4e-2-mp-log` |
| Remote HEAD | `6e24318` — `fix(finance): desacoplar webhook Asaas dos gates PIX OUT (P1.6W)` |
| Ahead / Behind | **5 ahead · 0 behind** |
| Working tree | 490 entradas (27 modificados · 463 untracked) |
| Stash | **13 entradas** (branches antigas — não afetam branch PE) |
| Reflog HEAD | Cadeia de 5+ `commit (amend)` → `d188ca6`; objeto `29ebaf8` preservado |

### Resposta — Etapa 1

**Existe risco de perda caso um push seja executado hoje?**

**Não.** O push é **aditivo** (fast-forward). O remote não possui commits que seriam sobrescritos. O risco real é o **inverso**: **não** publicar é que mantém o risco de perda patrimonial na máquina local.

**Riscos residuais do push (não são perda):**

| Risco | Severidade | Mitigação |
|-------|:----------:|-----------|
| Expor commits PE a terceiros via GitHub | Baixa | Comportamento desejado |
| Branch protection bloquear push | Média | Verificar regras no GitHub antes |
| Confusão com 116 tags locais | Baixa | Publicar apenas tags PE explicitamente |
| Commit acidental de secrets antes do push | Crítica | **Não** `git add` em `secrets/`; auditar staging |

---

## Estado dos Commits

### Commits locais não publicados (5)

| # | Hash | Título | Arquivos | Classificação | PE? | Gol de Ouro? | Docs? | Ambiente? |
|---|------|--------|----------|---------------|:---:|:------------:|:-----:|:---------:|
| 1 | `eab1d74` | `release(payment-engine): certify Indesconectável Payment Engine™ V1` | 12 (+2489) | **PATRIMONIAL** | ✅ | ❌ | ✅ | ❌ |
| 2 | `7e1d00d` | `docs(payment-engine): sync freeze commit hash eab1d74 in manifests` | 4 (+4/−4) | **PATRIMONIAL** | ✅ | ❌ | ✅ | ❌ |
| 3 | `261e810` | `docs(payment-engine): add commit hash to architecture signature block` | 1 (+1) | **PATRIMONIAL** | ✅ | ❌ | ✅ | ❌ |
| 4 | `ae319df` | `docs(payment-engine): finalize P2.0B freeze report with tagged commit ref` | 1 (+2/−1) | **PATRIMONIAL** | ✅ | ❌ | ✅ | ❌ |
| 5 | `d188ca6` | `release(payment-engine): decouple core via PaymentEngine facade` | 30 (+1394/−151) | **PATRIMONIAL** | ✅ | ⚠️ adapters | ✅ | ⚠️ `server-fly.js` |

### Detalhamento por commit

#### `eab1d74` — P2.0B / Certificação V1

| Atributo | Valor |
|----------|-------|
| Escopo | Somente documentação institucional |
| Arquivos | `CHANGELOG_PAYMENT_ENGINE.md`, `docs/payment-engine/01–10`, `P2.0B-CONGELAMENTO-OFICIAL-V1.md` |
| `src/finance/**` alterado | **0** |
| Código alterado | **0** |
| Tag alvo | `payment-engine-v1-certified`, `ipe-v1-certified` |

#### `7e1d00d`, `261e810`, `ae319df` — Sincronização documental P2.0B

| Atributo | Valor |
|----------|-------|
| Escopo | Correção de hashes nos manifestos 08–10 e relatório P2.0B |
| Classificação | **PATRIMONIAL** — metadados de rastreabilidade |
| Risco de publicação | **NULO** |

#### `d188ca6` — P2.2 Desacoplamento

| Atributo | Valor |
|----------|-------|
| Escopo | `src/payment-engine/**` (26 arquivos), delegação em `server-fly.js`, docs 12 + relatórios P2.2 |
| `src/finance/**` alterado | **0** — core certificado preservado |
| Delegação | `server-fly.js` chama facade; sem alteração funcional do core |
| Inconsistência | `P2.2-COMMIT-OFICIAL.md` declara hash `29ebaf8`; HEAD real é `d188ca6` |

### Diff agregado origin..HEAD

```
42 arquivos, +3885 / −151 linhas
```

Nenhum commit local classificado como TEMPORÁRIO ou OPERACIONAL (WIP). Todos os 5 são **PATRIMONIAL**.

---

## Estado das Tags

### Tags PE

| Tag | Existe local? | Commit | Existe no remote? | Ação necessária |
|-----|:-------------:|--------|:-----------------:|-----------------|
| `payment-engine-v1-certified` | ✅ | `eab1d74` | ❌ | Publicar após push da branch |
| `ipe-v1-certified` | ✅ | `eab1d74` | ❌ | Publicar após push da branch |
| `payment-engine-p2.2` | ❌ | — | ❌ | **Criar** em `d188ca6` antes de publicar |
| Tag genérica "P2.2" | ❌ | — | ❌ | Usar nome `payment-engine-p2.2` |

### Demais tags

| Métrica | Valor |
|---------|-------|
| Total de tags locais | **116** |
| Tags PE no remote | **0** (query `git ls-remote --tags origin payment-engine* ipe-v1*` vazia) |
| Conflito de nome no remote | **Nenhum** — tags PE ainda não existem no `origin` |

### Respostas diretas — Etapa 3

| Pergunta | Resposta |
|----------|----------|
| Quais não existem no remoto? | `payment-engine-v1-certified`, `ipe-v1-certified`; P2.2 ainda não foi criada |
| Quais precisam ser publicadas? | As 2 existentes + criar e publicar `payment-engine-p2.2` |
| Existe conflito? | **Não** — remote não possui tags PE |

---

## Working Tree

### Resumo

| Grupo | Qtd | Publicável? |
|-------|-----|:-----------:|
| A — Patrimônio permanente (untracked) | ~15 arquivos `src/finance/` novos | ⚠️ Curadoria |
| B — Documentação institucional | `docs/payment-engine/11`, `docs/data-room/`, `docs/governance/`, `docs/arquitetura/` | ⚠️ Commits dedicados |
| C — Relatórios | ~200+ em `docs/relatorios/` | ⚠️ Lotes cronológicos |
| D — Scripts | ~80 em `scripts/` | ⚠️ Seletivo |
| E — Configuração | `.github/examples/`, `.vercelignore`, `.gitignore`, `.dockerignore`, `.cursor/mcp.json` | ⚠️ Revisar cada um |
| F — Temporários | ~20 (`_agent_*`, `_health*`, `spike-*`, `P15Y-*`, `0`) | ❌ Nunca |
| G — Backups | `backup/goldeouro-v1-operacional-2026-05-27/` | ❌ Arquivar externamente |
| H — Secrets | `secrets/`, `spike-f5-0c-oauth.json` | ❌ **Nunca** |
| Modificados (27) | `src/finance/**`, player, SQL, etc. | ❌ **Não misturar** com push PE |

### Grupo A — Patrimônio permanente (untracked, avaliar)

```
src/finance/reconciliation/
src/finance/deposit/claimApprovedPixDeposit.js
src/finance/config/asaas-pix-out-config.js
src/finance/config/asaas-transfer-auth-config.js
src/finance/providers/asaas/asaas-transfer-webhook-normalizer.js
src/finance/webhooks/asaasTransferAuthorization.js
src/domain/payout/payoutProviderPersistence.js
```

**Ação:** Verificar se correspondem ao estado certificado em produção (Fly v536+). Se sim, commit **separado** e **após** push dos 5 commits PE. Se não, isolar em branch WIP.

### Grupo B — Documentação (commitar em lotes)

| Lote | Conteúdo | Publicação |
|------|----------|:----------:|
| B1 | `docs/payment-engine/11-Hardening.md` + `P2.1-HARDENING-PAYMENT-ENGINE.md` | Imediata após revisão |
| B2 | `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` | Imediata |
| B3 | `docs/data-room/DR-02` a `DR-11` | Curadoria |
| B4 | `docs/governance/`, `docs/arquitetura/` | Curadoria |
| B5 | `docs/runbooks/**`, `docs/checklists/`, `docs/operacao/` | Curadoria |
| B6 | `PE-PATRIMONIO-1-CONSOLIDACAO.md`, `GIT-AUDIT-*`, este relatório | Imediata |

### Grupo C — Relatórios (~200+ untracked)

Publicação em **6 lotes cronológicos** (F4.x → P1.0–P1.4 → P1.5–P1.6 → P1.7–P1.8 → H/V1/F2 → snapshots JSON). Exige curadoria para excluir PDFs duplicados e dados sensíveis em snapshots.

### Grupo D — Scripts (~80 untracked)

| Prioridade | Scripts | Ação |
|:----------:|---------|------|
| Alta | `scripts/p19-certification.cjs`, `scripts/verify-p*.mjs`, `scripts/p1*.cjs` | Commitar |
| Média | `scripts/certification/`, `scripts/reliability/`, `scripts/operational/` | Commitar |
| Baixa | `scripts/f2-4e-2a-fly-*` (one-off) | Avaliar caso a caso |

### Grupo E — Configuração (27 modificados + untracked)

| Arquivo | Publicável? | Nota |
|---------|:-----------:|------|
| `.gitignore` | ⚠️ | Revisar entradas PE; commit separado |
| `.dockerignore` | ⚠️ | Revisar |
| `.cursor/mcp.json` | ❌ | Config local IDE |
| `.github/examples/` | ✅ | Exemplos CI — commitar |
| `.vercelignore` | ⚠️ | Se relevante ao deploy |
| `package.json` / `package-lock.json` | ❌ | Modificados — não misturar sem gate |
| `goldeouro-player/**` | ❌ | Fora do escopo PE |

### Grupos F, G, H — Nunca publicar

| Grupo | Padrão | Ação pré-publicação |
|-------|--------|---------------------|
| F | `_agent_*`, `_health*`, `spike-*`, `P15Y-*`, `0` | Adicionar ao `.gitignore` + remover |
| G | `backup/goldeouro-v1-operacional-2026-05-27/` | Ignorar; arquivar externamente |
| H | `secrets/`, `spike-f5-0c-oauth.json` | Verificar `.gitignore`; nunca `git add` |

### Respostas — Etapa 4

| Pergunta | Resposta |
|----------|----------|
| Publicáveis imediatamente? | Os **5 commits já existentes** (via push). Docs B1, B2, B6 após commits dedicados. |
| Exigem curadoria? | ~463 untracked, 27 modificados, snapshots JSON, backups, secrets. |

---

## Sequência Recomendada

> **Princípio:** Publicar primeiro o que já está commitado e validado. Só depois criar novos commits documentais. Nunca misturar WIP financeiro com baseline PE.

---

### Passo 0 — Pré-voo (READ-ONLY)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Confirmar estado antes de qualquer mutação |
| **Comandos** | `git fetch origin` · `git status -sb` · `git rev-list --left-right --count origin/chore/f2-4e-2-mp-log...HEAD` · `git log origin/chore/f2-4e-2-mp-log..HEAD --oneline` · `git diff --stat origin/chore/f2-4e-2-mp-log..HEAD` |
| **Pré-condições** | Nenhuma |
| **Risco** | **NULO** |
| **Rollback** | N/A |
| **Resultado esperado** | Confirmação: 5 ahead, 0 behind, diff exclusivamente PE |

---

### Passo 1 — Snapshot de segurança local

| Campo | Valor |
|-------|-------|
| **Objetivo** | Criar ponto de restauração antes de qualquer mutação |
| **Comando** | `git tag pe-patrimonio2-pre-publish-20260701 d188ca6` |
| **Pré-condições** | Passo 0 OK |
| **Risco** | **NULO** |
| **Rollback** | Tag local serve como referência; `git reset --hard pe-patrimonio2-pre-publish-20260701` |
| **Resultado esperado** | Tag local de backup (não publicar esta tag) |

---

### Passo 2 — Isolar WIP da working tree

| Campo | Valor |
|-------|-------|
| **Objetivo** | Impedir contaminação acidental da baseline PE |
| **Comando** | `git stash push -m "PE.PATRIMONIO.2: WIP fora da baseline PE" -- controllers/ database/ goldeouro-player/ package.json package-lock.json scripts/v1-1b-m1-r3-staging-exec.js services/ src/ docs/relatorios/F4-0E-S1-CIRURGIA-WRAPPER-MP-PAYOUT.md docs/relatorios/V1-1B-* docs/relatorios/snapshots/ .cursor/ .dockerignore .gitignore` |
| **Pré-condições** | Passo 1 OK |
| **Risco** | **BAIXO** — stash é reversível |
| **Rollback** | `git stash pop` |
| **Resultado esperado** | Working tree limpa de modificados; untracked permanecem (não entram no stash por padrão) |

---

### Passo 3 — Publicar branch (5 commits PE)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Replicar patrimônio PE commitado no GitHub |
| **Comando** | `git push -u origin chore/f2-4e-2-mp-log` |
| **Pré-condições** | Passos 0–2 OK; staging vazio (`git diff --cached` vazio) |
| **Risco** | **BAIXO** — fast-forward; 0 behind |
| **Rollback** | Remote: `git push origin 6e24318:chore/f2-4e-2-mp-log` (somente se necessário e autorizado) |
| **Resultado esperado** | Remote em `d188ca6`; 5 commits PE visíveis no GitHub |

---

### Passo 4 — Corrigir hash P2.2 (commit documental)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Alinhar `P2.2-COMMIT-OFICIAL.md` com HEAD real `d188ca6` |
| **Comandos** | Editar hash no relatório → `git add docs/relatorios/P2.2-COMMIT-OFICIAL.md` → `git commit -m "docs(payment-engine): align P2.2 official hash to d188ca6"` |
| **Pré-condições** | Passo 3 OK |
| **Risco** | **BAIXO** — somente documentação |
| **Rollback** | `git revert HEAD` |
| **Resultado esperado** | Relatório P2.2 consistente com HEAD |

---

### Passo 5 — Commits documentais P1.9 e P2.1

| Campo | Valor |
|-------|-------|
| **Objetivo** | Rastreabilidade dos marcos operacionais |
| **Comandos** | |
| 5a | `git add docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` → `git commit -m "docs(payment-engine): P1.9 operational certification evidence"` |
| 5b | `git add docs/payment-engine/11-Hardening.md docs/relatorios/P2.1-HARDENING-PAYMENT-ENGINE.md` → `git commit -m "docs(payment-engine): P2.1 hardening structural audit"` |
| **Pré-condições** | Passo 4 OK |
| **Risco** | **BAIXO** |
| **Rollback** | `git revert` por commit |
| **Resultado esperado** | P1.9 e P2.1 versionados |

---

### Passo 6 — Commits documentais em lote (data room + relatórios)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Publicar patrimônio documental restante |
| **Comandos** | Sequência de `git add` + `git commit` por lote (ver PE-PATRIMÔNIO.1 seção Plano Fase B) |
| **Pré-condições** | Auditoria de secrets em cada arquivo antes do `git add` |
| **Risco** | **MÉDIO** — volume alto; risco de incluir snapshot com dado sensível |
| **Rollback** | `git revert` por lote; ou reset para tag do Passo 1 |
| **Resultado esperado** | Data room, P1.0–P1.8, runbooks, scripts de certificação versionados |

---

### Passo 7 — Reforçar `.gitignore`

| Campo | Valor |
|-------|-------|
| **Objetivo** | Impedir commit futuro de temporários, backups e secrets |
| **Comandos** | Adicionar entradas: `_agent_*`, `_health*`, `_p15y_*`, `_where_*`, `backup/`, `secrets/`, `spike-f5-0c-*`, `P15Y-R1-*`, `p15y-r1-report*.json` → commit dedicado |
| **Pré-condições** | Passo 6 OK |
| **Risco** | **BAIXO** |
| **Rollback** | `git revert HEAD` |
| **Resultado esperado** | `.gitignore` protege patrimônio futuro |

---

### Passo 8 — Push dos commits documentais

| Campo | Valor |
|-------|-------|
| **Objetivo** | Publicar lotes dos Passos 4–7 |
| **Comando** | `git push origin chore/f2-4e-2-mp-log` |
| **Pré-condições** | Todos os commits revisados; `git log origin/chore/f2-4e-2-mp-log..HEAD` inspecionado |
| **Risco** | **BAIXO** |
| **Rollback** | Reverter remote para commit específico (somente se autorizado) |
| **Resultado esperado** | Patrimônio documental no GitHub |

---

### Passo 9 — Criar e publicar tags

| Campo | Valor |
|-------|-------|
| **Objetivo** | Versionamento institucional imutável |
| **Comandos** | |
| 9a | `git tag -a payment-engine-p2.2 d188ca6 -m "Indesconectavel Payment Engine P2.2 — Core Decoupling"` |
| 9b | `git push origin payment-engine-v1-certified ipe-v1-certified payment-engine-p2.2` |
| **Pré-condições** | Passo 8 OK; tags V1 já existem localmente em `eab1d74` |
| **Risco** | **BAIXO** — sem conflito no remote |
| **Rollback** | `git push origin :refs/tags/<tag>` (deletar tag remote — somente se autorizado) |
| **Resultado esperado** | 3 tags PE no GitHub apontando para commits corretos |

---

### Passo 10 — Release GitHub

| Campo | Valor |
|-------|-------|
| **Objetivo** | Marco institucional visível para terceiros |
| **Comando** | `gh release create payment-engine-v1-certified --title "Indesconectável Payment Engine™ V1 CERTIFICADA" --notes-file CHANGELOG_PAYMENT_ENGINE.md` |
| **Pré-condições** | Passo 9 OK |
| **Risco** | **NULO** — operação GitHub, não altera código |
| **Rollback** | `gh release delete payment-engine-v1-certified` |
| **Resultado esperado** | Release oficial V1 com CHANGELOG |

---

### Passo 11 — Restaurar WIP (opcional)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Retomar trabalho em andamento fora da baseline PE |
| **Comando** | `git stash pop` |
| **Risco** | **BAIXO** |
| **Rollback** | `git stash` novamente |
| **Resultado esperado** | 27 modificados de volta; baseline PE já publicada |

---

## Matriz de Riscos

| Operação | Risco | Justificativa |
|----------|:-----:|---------------|
| Criar commit documental (P1.9, P2.1, data room) | **BAIXO** | Somente markdown; sem alteração funcional. Risco médio apenas em lotes grandes com snapshots JSON. |
| Criar commit histórico (relatórios F4/P1) | **MÉDIO** | Volume alto; possível inclusão acidental de evidência com metadados sensíveis. Exige revisão por lote. |
| Publicar branch (push fast-forward) | **BAIXO** | 0 behind; commits exclusivamente PE; sem force push. |
| Publicar tags | **BAIXO** | Tags novas; sem conflito no remote. |
| Push (geral) | **BAIXO** | Aditivo; não sobrescreve histórico remoto. |
| Release GitHub | **NULO** | Metadado publicado; não altera repositório. |
| Commit de `src/finance/**` modificado | **ALTO** | Pode contaminar baseline certificada com estado não homologado. |
| Commit de `secrets/` ou `spike-*.json` | **ALTO** | Exposição irreversível de credenciais. |
| Commit de `backup/` | **MÉDIO** | Duplicação massiva; infla repositório sem valor incremental. |
| `git push --force` | **ALTO** | **PROIBIDO** neste plano. |

---

## Rollback

### Por etapa

| Etapa falhou | Restauração | Perda patrimonial? |
|--------------|-------------|:------------------:|
| Passo 2 (stash) | `git stash pop` | Não |
| Passo 3 (push branch) | `git push origin 6e24318:chore/f2-4e-2-mp-log` | Não — commits locais preservados |
| Passo 4–7 (commits docs) | `git reset --hard pe-patrimonio2-pre-publish-20260701` | Não — se não fez push |
| Passo 8 (push docs) | `git revert` dos commits documentais + push | Não — histórico preservado |
| Passo 9 (tags) | `git tag -d <tag>` local; `git push origin :refs/tags/<tag>` remote | Não |
| Passo 10 (release) | `gh release delete` | Não |

### Restauração ao estado atual (2026-07-01)

```text
Estado de referência:
  Branch:  chore/f2-4e-2-mp-log
  HEAD:    d188ca6
  Tags:    payment-engine-v1-certified → eab1d74
           ipe-v1-certified → eab1d74
  Remote:  6e24318 (5 commits behind local)
  WIP:     27 modificados + 463 untracked
```

**Comando de restauração total (se algo der errado antes do push):**

```bash
git reset --hard d188ca6
git stash pop   # se stash foi criado no Passo 2
```

**Objetos preservados no reflog:** `29ebaf8`, `22a2e12`, `e88638a`, `b1daecc` — cadeia de amends P2.2 recuperável via `git reflog`.

---

## Certificação de Maturidade para Publicação

### Publicação parcial (5 commits + tags)?

# SIM

**Justificativa:** Commits auditados, escopo exclusivamente PE, `src/finance/**` intocado nos 5 commits, fast-forward seguro, tags sem conflito. Equivalente a publicar P2.0B + P2.2 já homologados localmente.

### Publicação institucional completa (data room + P1.x + scripts)?

# NÃO — ainda

**Justificativa:** 463 untracked não curados, P1.9/P2.1 sem commit, hash P2.2 desalinhado, 27 modificados em `src/finance/**` não reconciliados com produção, `.gitignore` incompleto para `secrets/` e temporários.

---

## Próximos Tijolos

| Fase | Objetivo | Dependência |
|------|----------|-------------|
| **PE.PATRIMÔNIO.2.EXEC** | Executar Passos 0–11 deste plano | Este documento |
| **PE.PATRIMÔNIO.3** | Baseline protegida, branch protection, índice due diligence | PE.PATRIMÔNIO.2.EXEC concluído |
| **PE.V1.2** | Cleanup provider, deprecar legado | PE.PATRIMÔNIO.3 |

---

## Conclusão

### Respostas explícitas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Podemos publicar o patrimônio hoje? | **Parcialmente, sim.** Os 5 commits PE e as tags podem ser publicados hoje com risco baixo. A publicação documental completa exige Passos 4–8 (curadoria). |
| 2 | Qual é o primeiro comando Git a executar? | **Pré-voo (read-only):** `git fetch origin` — seguido de validação `git rev-list --left-right --count origin/chore/f2-4e-2-mp-log...HEAD`. **Primeiro comando mutante:** `git tag pe-patrimonio2-pre-publish-20260701 d188ca6` (snapshot de segurança). |
| 3 | Qual será o último comando? | **Publicação mínima:** `git push origin payment-engine-v1-certified ipe-v1-certified payment-engine-p2.2`. **Publicação completa:** `gh release create payment-engine-v1-certified --title "Indesconectável Payment Engine™ V1 CERTIFICADA" --notes-file CHANGELOG_PAYMENT_ENGINE.md` |
| 4 | Qual será o estado final esperado? | |

### Estado final esperado (publicação completa)

```text
Remote branch chore/f2-4e-2-mp-log → HEAD com todos os commits PE + documentais
Tags no GitHub:
  payment-engine-v1-certified → eab1d74
  ipe-v1-certified            → eab1d74
  payment-engine-p2.2         → d188ca6 (ou HEAD pós-correção documental)
Release GitHub: V1 CERTIFICADA com CHANGELOG
Working tree: WIP isolado em stash; untracked sensíveis ignorados
Clone de terceiro: reproduz patrimônio PE completo sem acesso à máquina local
Baseline src/finance: inalterada desde certificação; WIP financeiro fora dos commits PE
```

### Estado final esperado (publicação mínima — apenas Passos 0–3 + 9)

```text
Remote: d188ca6 com 5 commits PE
Tags: 3 tags PE publicadas
Documentação P1.x, data room, P1.9, P2.1: ainda apenas local
Risco residual: patrimônio documental continua dependente da máquina local
```

---

## Anexo — Comandos de auditoria executados (read-only)

```powershell
git branch -vv
git log -1 --format=fuller
git rev-list --left-right --count origin/chore/f2-4e-2-mp-log...HEAD
git log origin/chore/f2-4e-2-mp-log..HEAD --format="%H|%s"
git stash list
git reflog -5
git tag -l "payment-engine*" "ipe-v1*"
git rev-list -n 1 payment-engine-v1-certified
git ls-remote --tags origin "payment-engine*" "ipe-v1*"
git status --porcelain
git show --stat -1 eab1d74 7e1d00d 261e810 ae319df d188ca6
git rev-parse origin/chore/f2-4e-2-mp-log
git diff --stat origin/chore/f2-4e-2-mp-log..HEAD
```

---

*Relatório gerado em modo READ-ONLY ABSOLUTO. Nenhum commit, tag, push, alteração de arquivo ou operação GitHub foi executada durante esta auditoria.*
