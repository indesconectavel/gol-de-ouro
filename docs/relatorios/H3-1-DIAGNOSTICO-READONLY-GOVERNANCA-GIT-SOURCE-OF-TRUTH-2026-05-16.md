# H3.1 — DIAGNÓSTICO READ-ONLY — GOVERNANÇA GIT E SOURCE OF TRUTH

**Data do diagnóstico:** 2026-05-16  
**Modo:** exclusivamente read-only — sem alteração de código de aplicação, sem commit, sem deploy, sem limpeza.  
**Exceção:** criação deste relatório (pedido explícito de saída obrigatória).  
**Repositório analisado:** `https://github.com/indesconectavel/gol-de-ouro.git` (monorepo backend + player, pasta local `goldeouro-backend`).

---

## 1. Resumo executivo

Existem **três referências distintas** de “verdade” no ecossistema, e **não coincidem**:

| Camada | Referência | SHA / estado |
|--------|------------|--------------|
| **Runtime produção (Fly)** | `GET /meta` → `gitCommit` | **`7ecedca98d1f5d5d7c1878aa043ec724e422dd41`** |
| **Linha de trabalho ativa (local = remoto)** | branch `fix/admin-financial-integrity-v1` | **`dac9f8ba012c13607116af7bf15d58a95d242c35`** |
| **Branch default GitHub** | `origin/main` (`origin/HEAD`) | **`a60bbf1c38ab6dc20a5d48d7b0fe4fe534f89c32`** |

**Fato crítico:** o commit em **produção** (`7ecedca`) **não é ancestral** de `origin/main` — o que está no ar foi construído a partir da linha `fix/admin-financial-integrity-v1` (deploy manual / `deploy-on-demand` documentado em H2), **não** a partir de um merge em `main`.

**Fato:** `HEAD` local está **sincronizado** com `origin/fix/admin-financial-integrity-v1` (sem commits ahead/behind), mas **9 commits à frente** do que Fly reporta em `/meta` (quase todos **documentação**).

**Fato:** working tree **suja** — 1 ficheiro marcado como modificado (`vercel.json`, sem diff de conteúdo visível — hipótese **EOL/CRLF**) e **35 ficheiros untracked** (relatórios, scripts, SQL sensível).

**Fato:** `goldeouro-admin` é **gitlink** (submódulo) no monorepo apontando para `bb41c40`, com repositório próprio em `goldeouro-admin/.git`, mas **sem** ficheiro `.gitmodules` — estado **órfão / inconsistente** para clones e CI.

**Classificação final (secção 15):** **RISCO** — operação em produção é coerente e rastreável via `/meta`, mas a **governança Git não tem uma única source of truth** até decisão explícita e alinhamento `main` ↔ linha de deploy ↔ runtime.

---

## 2. Estado Git local

| Item | Valor |
|------|--------|
| **Branch atual** | `fix/admin-financial-integrity-v1` |
| **HEAD local** | `dac9f8ba012c13607116af7bf15d58a95d242c35` |
| **Mensagem HEAD** | `fix: polir game mobile H3.0B` |
| **Tracking** | `fix/admin-financial-integrity-v1...origin/fix/admin-financial-integrity-v1` (sem ahead/behind) |
| **Últimos 5 commits (decorados)** | ver tabela abaixo |

| Commit | Descrição |
|--------|-----------|
| `dac9f8b` | fix: polir game mobile H3.0B |
| `079bfd6` | docs: preparar H3.0B game mobile com backup rollback |
| `b475647` | docs: registrar H3.0A diagnostico game mobile *(tag: `pre-h3-0b-game-mobile-2026-05-12`)* |
| `10a25cc` | docs: registrar fechamento oficial V1 goldeouro |
| `60bae48` | docs: registrar F3 auditoria frontend painel UX governanca V1 |

**Merge-base com `origin/main`:** `68f89291f0e3ee57c20dd19165a77b6d0167474f` — *V1: implementar saque manual administrativo* (tag `pre-admin-financial-integrity-2026-05-04`).

---

## 3. Estado Git remoto

| Item | Valor |
|------|--------|
| **Remote** | `origin` → `https://github.com/indesconectavel/gol-de-ouro.git` |
| **Branch principal remota (default)** | `origin/main` → `origin/HEAD` |
| **HEAD remoto `origin/main`** | `a60bbf1c38ab6dc20a5d48d7b0fe4fe534f89c32` |
| **Mensagem** | `Merge pull request #86 from indesconectavel/hotfix/saque-manual-v1` |
| **HEAD remoto branch ativa** | `origin/fix/admin-financial-integrity-v1` = **`dac9f8b`** (igual ao local) |

**Divergência `HEAD` (feature) vs `origin/main`:**

| Direção | Contagem | Interpretação |
|---------|----------|---------------|
| Commits em `origin/main` que **não** estão em `HEAD` | **1** | Apenas o merge commit `a60bbf1` |
| Commits em `HEAD` que **não** estão em `origin/main` | **47** | Toda a linha T14A, H1, H2, F1–F3, H3.0A/B, etc. |

**Divergência commit de **produção** (`7ecedca`) vs `origin/main`:**

| Direção | Contagem |
|---------|----------|
| Em `7ecedca` e não em `origin/main` | **38** |
| Em `origin/main` e não em `7ecedca` | **1** (`a60bbf1`) |

---

## 4. Estado runtime em produção

**Fonte:** `curl` read-only em 2026-05-16 (timestamp do servidor no `/health`).

### `GET https://goldeouro-backend-v2.fly.dev/meta`

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "7ecedca98d1f5d5d7c1878aa043ec724e422dd41",
    "environment": "production",
    "features": { "pix": true, "goldenGoal": true, "monitoring": true }
  }
}
```

| Campo | Valor |
|-------|--------|
| **Commit em produção** | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |
| **Mensagem (git local)** | `fix(ci): injetar GIT_COMMIT no deploy on-demand Fly (H2)` |
| **Branches que contêm `7ecedca`** | `fix/admin-financial-integrity-v1`, `remotes/origin/fix/admin-financial-integrity-v1` |
| **Ancestral de `HEAD` local?** | **Sim** |
| **Ancestral de `origin/main`?** | **Não** |

### `GET https://goldeouro-backend-v2.fly.dev/health`

| Campo | Valor |
|-------|--------|
| HTTP | 200 |
| `status` | `ok` |
| `version` | `1.2.1` |
| `database` | `connected` |
| `mercadoPago` | `connected` |
| `timestamp` | `2026-05-16T13:46:18.392Z` |

**Tag imediatamente anterior ao deploy H2:** `pre-h2-runtime-traceability-2026-05-12` → commit **`77464f5`** (pai direto de `7ecedca` na história linear observada).

---

## 5. Comparação local × remoto × produção

```
                    origin/main (a60bbf1)
                           |
                           |  [1 commit só em main]
                           |
    merge-base (68f8929) --+-- linha fix/admin-financial-integrity-v1
                           |
                           |  ... 29+ commits código/docs (T14A, cirurgias, admin)
                           |
                    7ecedca  ← PRODUÇÃO (/meta)  [H2 deploy]
                           |
                           |  9 commits (maioria docs: H2 exec, F1–F3, H3.0A/B)
                           |
                    dac9f8b  ← HEAD local = origin/fix/admin-financial-integrity-v1
```

| Par | Relação |
|-----|---------|
| Local HEAD ↔ remoto branch | **Idênticos** (`dac9f8b`) |
| Produção ↔ Local HEAD | Produção **atrás** em **9** commits |
| Produção ↔ `origin/main` | **Histórias divergentes** (38 vs 1 commit) |
| App Fly | `goldeouro-backend-v2` (alinhado a `fly.toml` e workflows) |

**Implicação para source of truth:**

- **Verdade do que está no ar:** `/meta.gitCommit` → **`7ecedca`**
- **Verdade do desenvolvimento V1 documentado:** branch **`fix/admin-financial-integrity-v1`** (remoto + local)
- **Verdade do default GitHub / pipeline `main`:** **`origin/main`** — **não** reflete produção nem HEAD de trabalho

---

## 6. Working tree

| Indicador | Estado |
|-----------|--------|
| Working tree limpa? | **Não** |
| Sincronizado com remoto da branch? | **Sim** (commits); **Não** (ficheiros não commitados) |
| Staged changes | Nenhum listado em `git status --short` |

---

## 7. Arquivos modificados

| Ficheiro | Estado | Observação |
|----------|--------|------------|
| `goldeouro-player/vercel.json` | `M` (modified) | **Fato:** `git diff` e `git diff --ignore-cr-at-eol` **sem alteração de conteúdo**; Git emite aviso *LF will be replaced by CRLF*. **Hipótese:** modificação fantasma por normalização de fim de linha no Windows, não mudança funcional de config Vercel. |

**Risco:** deploy Vercel a partir desta cópia local pode comportar-se de forma imprevisível se alguém assumir que `M` implica mudança real — convém confirmar com `git diff` antes de qualquer deploy manual.

---

## 8. Arquivos untracked

**Total:** **35** ficheiros (`git ls-files --others --exclude-standard`).

### Raiz
- `.vercelignore`

### Base de dados
- `database/exec-plano-b-reversao-transacao-20260504.sql` — **RISCO:** script de reversão fora do Git

### Scripts (6)
- `scripts/exec-plano-b-reversao-20260504.js`
- `scripts/gate-final-readonly-reconciliacao-20260504.js`
- `scripts/h3c-vercel-static-spa.json`
- `scripts/readonly-validacao2-saques-20260504.js`
- `scripts/test-withdraw-admin.js`
- `scripts/triagem-readonly-inconsistencia-saque-20260504.js`

### Relatórios `docs/relatorios/` (27)
Inclui auditorias, deploys controlados, diagnósticos admin, H3.0x game mobile, `REVISAO-GERAL-READONLY-GOL-DE-OURO-2026-05-15.md`, etc.

**Nota:** este relatório H3.1 será criado como novo ficheiro; após criação passará a contar como untracked até commit futuro (fora do escopo desta etapa).

**Classificação:** grande volume de documentação operacional **fora** da source of truth versionada — risco de decisões baseadas em ficheiros que outro clone não possui.

---

## 9. Tags e pontos de rollback

**Amostra (25 tags mais recentes por data de criação):**

| Tag | Uso provável |
|-----|----------------|
| `pre-h3-0b-game-mobile-2026-05-12` | Antes H3.0B (`b475647`) |
| `pre-h2-runtime-traceability-2026-05-12` | Antes deploy H2 (`77464f5`, 1 commit antes de produção) |
| `t14a-runtime-alignment-admin-v1-2026-05-12` | Baseline T14A (`ca4c6a0`) |
| `pre-t14a-painel-admin-v1-2026-05-12` | Pré-T14A |
| `pre-admin-financial-integrity-2026-05-04` | Merge-base com `main` (`68f8929`) |
| `v1-hardening-financeiro-mp-2026-04-28` | Marco financeiro |
| … | Tags de cirurgias abril/2026 |

**Rollback Fly (documentado):** `fly releases rollback` no app `goldeouro-backend-v2`; tag `pre-h2-runtime-traceability-2026-05-12` marca commit **anterior** ao que está em `/meta`.

**Hipótese:** tags antigas (`BACKUP-*`, `GAME_VALIDADO_*`) existem em quantidade elevada no repositório — podem confundir escolha de rollback se não houver política de tags “ativas”.

---

## 10. Análise do goldeouro-admin/.git

| Item | Valor |
|------|--------|
| **Existe `goldeouro-admin/.git`?** | **Sim** |
| **Remote do admin** | `https://github.com/indesconectavel/goldeouro-admin.git` |
| **Branch atual (admin)** | `painel-protegido-v1.1.0` |
| **HEAD admin** | `bb41c4062420f5408f7e6e3bd19fe49fc984400e` |
| **Tracking admin** | Sincronizado com `origin/painel-protegido-v1.1.0` |
| **Working tree admin** | **Limpa** (`git status --short` vazio) |
| **Último commit** | `fix: alinhar painel admin V1 ao runtime real T14A` |

### Relação com o monorepo

| Item | Valor |
|------|--------|
| Entrada no índice do monorepo | `160000 commit bb41c4062420f5408f7e6e3bd19fe49fc984400e goldeouro-admin` |
| Ficheiro `.gitmodules` | **Ausente** |
| `git submodule status` | **Falha:** *no submodule mapping found in .gitmodules for path 'goldeouro-admin'* |

**Classificação:** **RISCO** — submódulo “órfão”: o monorepo regista um gitlink, mas metadados de submódulo estão incompletos. Clones via `git clone` sem `--recurse-submodules` e sem documentação podem obter pasta vazia ou estado inconsistente.

**Source of truth do painel admin:** repositório **`goldeouro-admin`** (branch `painel-protegido-v1.1.0`), **não** o conteúdo expandido dentro do monorepo, salvo o ponteiro `bb41c40`.

---

## 11. Arquivos oficiais de runtime

| Componente | Ficheiro / config oficial | Evidência |
|------------|---------------------------|-----------|
| **Backend HTTP** | `server-fly.js` | `package.json` → `"main"`, `"start": "node server-fly.js"` |
| **Container** | `Dockerfile` → `CMD ["node", "server-fly.js"]` | Deploy Fly |
| **Orquestração Fly** | `fly.toml` → app `goldeouro-backend-v2`, processos `app` + `payout_worker` | Produção em `goldeouro-backend-v2.fly.dev` |
| **Worker payout** | `src/workers/payout-worker.js` | `fly.toml` `[processes]` |
| **Player (Vercel)** | `goldeouro-player/vercel.json` + build Vite `dist/` | Workflow `frontend-deploy.yml` |
| **Admin** | Repo separado + gitlink `goldeouro-admin` @ `bb41c40` | Deploy Vercel admin (domínio documentado) |
| **Rastreabilidade deploy** | `--build-arg GIT_COMMIT=<sha>` | `.github/workflows/deploy-on-demand.yml`, `main-pipeline.yml`, `backend-deploy.yml` |
| **Verificação pós-deploy** | `GET /meta`, `GET /health` | Runtime verificado neste diagnóstico |

**Pipeline `main`:** dispara em push para `main` apenas — **não** dispara automaticamente para `fix/admin-financial-integrity-v1`, reforçando drift entre `main` e produção.

---

## 12. Arquivos legados, duplicados ou ambíguos

| Item | Tipo | Risco |
|------|------|-------|
| `server-fly-deploy.js` | Duplicata/alternativa de servidor | Manutenção no ficheiro errado |
| `controllers/paymentController.js` | Lógica webhook paralela | Divergência vs `server-fly.js` |
| `middlewares/authMiddleware.js` vs `authenticateToken` inline | Auth duplicada | Comportamento inconsistente |
| `goldeouro-backend/Dockerfile` → `server.js` | Subpasta legado | Não é o Dockerfile raiz usado em Fly |
| `backup-pre-limpeza-20251023-172730/` | Snapshot antigo no repo | Confusão, tamanho |
| `ops/snapshots/`, múltiplos `server-fly` em backups | Histórico | Não são runtime |
| Centenas de branches locais/remotas | Histórico operacional | Escolha errada de branch |
| `goldeouro-admin` sem `.gitmodules` | Submódulo órfão | Clone/CI quebrados |

---

## 13. Riscos de drift

| ID | Drift | Tipo | Severidade |
|----|-------|------|------------|
| D1 | `origin/main` ≠ produção (`7ecedca` ∉ história de `main`) | **Fato** | Alta |
| D2 | `HEAD` local (`dac9f8b`) ≠ produção (+9 commits, maioritariamente docs) | **Fato** | Média |
| D3 | `vercel.json` marcado `M` sem diff de conteúdo | **Fato** + hipótese EOL | Baixa/Média |
| D4 | 35 untracked — docs/SQL/scripts não versionados | **Fato** | Média |
| D5 | Admin: gitlink `bb41c40` vs repo admin limpo — monorepo não reflete ficheiros fonte sem submodule init | **Fato** | Alta |
| D6 | Pipeline `main-pipeline.yml` com `continue-on-error: true` no deploy | **Fato** (código workflow) | Média |
| D7 | Deploy manual Fly (H2) a partir de branch feature, não merge em `main` | **Fato** (histórico + `/meta`) | Alta |

---

## 14. Recomendações sem implementação

1. **Decisão explícita de source of truth (escolher uma primária):**
   - **Opção A — Runtime:** tudo que importa deve ser rastreável a partir de `/meta.gitCommit` até tag/branch.
   - **Opção B — Branch de integração:** declarar `fix/admin-financial-integrity-v1` (ou renomear para `release/v1`) como linha oficial até merge.
   - **Opção C — `main`:** exige merge/rebase da linha de produção para `main` **antes** de tratar `main` como verdade — hoje **não** é válido.

2. **Congelar mapa em tabela viva** (sem commit agora): `produção / branch / main / admin repo` com SHAs — atualizar só após cada deploy.

3. **Resolver submódulo admin** (numa etapa futura): restaurar `.gitmodules` ou remover gitlink e documentar deploy só via `goldeouro-admin`.

4. **Política para untracked:** integrar relatórios H3 em commit dedicado **ou** mover para wiki/archive; **não** deixar SQL de reversão só no disco.

5. **Antes de cirurgia:** confirmar `git diff goldeouro-player/vercel.json`; se vazio, `git checkout --` (numa etapa **não** read-only) para working tree limpa.

6. **Próximo deploy backend:** usar SHA explícito; após deploy, validar `curl /meta` = SHA esperado.

7. **Não assumir** que push em `main` atualiza produção — produção está na linha feature até prova em contrário.

---

## 15. Decisão final: OK / OK COM RESSALVAS / RISCO / BLOQUEADOR

### **RISCO**

| Critério | Avaliação |
|----------|-----------|
| Runtime Fly saudável e rastreável | **OK** |
| HEAD local = remoto da branch de trabalho | **OK** |
| Uma única source of truth Git clara | **Não** — **RISCO** |
| `main` alinhado à produção | **Não** — **RISCO** |
| Working tree limpa | **Não** — **OK COM RESSALVAS** |
| Submódulo admin íntegro | **Não** — **RISCO** |

**Não classificado como BLOQUEADOR** para operação atual (produção responde, commit identificável). **É bloqueador processual** para **nova cirurgia ou deploy “oficial via main”** sem passo de alinhamento prévio.

**Próxima etapa mais segura (H3.2 sugerida, só planeamento):** workshop de decisão — fixar documento “Source of Truth v1” com os três SHAs acima e critério de promoção `feature → main → Fly`, **sem** alterar código até a decisão estar escrita e aceite.

---

*Fim do diagnóstico H3.1 — nenhuma correção aplicada.*
