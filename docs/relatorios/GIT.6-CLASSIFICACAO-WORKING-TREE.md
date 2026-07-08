# GIT.6 — Classificação e Isolamento da Working Tree™

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Gate:** GIT.6  
**Data:** 2026-07-08  
**Modo:** READ-ONLY ABSOLUTO  
**Base:** `_p19_status.txt` · HEAD `d79a2e8` · GIT.5 · globs  
**Snapshot:** `docs/relatorios/snapshots/git6-working-tree-classification.json`

---

## Declarações limitadoras

Nenhuma mutação Git, arquivo, deploy ou cloud. Shell D0 — inventário via snapshot forense + filesystem. Snapshot `_p19_status.txt` capturado na branch; patrimônio H0–GIT.3 **já commitado** em `d79a2e8` (não aparece como untracked no snapshot base).

### Flags obrigatórias

```
code_changed=false
git_mutated=false
deploy_executed=false
database_altered=false
runtime_altered=false
fly_altered=false
supabase_altered=false
vercel_altered=false
github_actions_executed=false
production_changed=false
```

---

## Veredito

# **PASS COM RESSALVAS**

Mapa operacional **completo** construído: 28 modified, ~280 untracked classificados em 8 lotes com dependências e sequência de commits. Ressalvas: inventário live indisponível; código WIP financeiro não deve misturar com lotes documentais.

| Índice | Nota | Justificativa |
|--------|:----:|---------------|
| **Organização** | **5,5** | Classes misturadas fisicamente; lógica de lotes restaura ordem |
| **Patrimonial** | **8,5** | Núcleo H0–H3.5 seguro; executive/GIT gates pendentes |
| **Reprodutibilidade** | **6,0** | ~280 arquivos só em disco local |
| **Versionamento** | **6,5** | +1 commit local (`d79a2e8`) não pushed |
| **Risco** | **3,5** | Baixo para prod; alto para perda local de untracked |

---

# ETAPA 1 — Inventário absoluto

## Estado Git

| Item | Valor |
|------|-------|
| Branch | `chore/f2-4e-2-mp-log` |
| HEAD | `d79a2e8` — patrimônio H0–H3.5 |
| Ahead remote | **+1** |
| Deleted | **0** |
| Renamed | **0** |
| Modified tracked | **28** |
| Untracked (snapshot) | **255 entradas** (~280 arquivos expandidos) |

## Agrupamento por pasta

| Pasta | Modified | Untracked | Domínio | Classe dominante |
|-------|:--------:|:---------:|---------|:----------------:|
| **Raiz** | 0 | 12 | Forense / config | E |
| `.cursor/` | 1 | 0 | IDE | E |
| `controllers/` | 1 | 0 | Backend admin | D |
| `database/` | 3 | 17 | SQL cirúrgico | B |
| `docs/` | 3 | ~200 | Patrimônio + evidência | A/B |
| `.github/` | 0 | 8 | CI/staging | D |
| `goldeouro-player/` | 3 | 6 | Frontend | D |
| `scripts/` | 1 | ~55 | Homologação | B/D |
| `src/` | 11 | 7 | Payment Engine | D |
| `services/` | 1 | 0 | MP legacy | C |
| `package.*` | 2 | 0 | Deps | D |
| `server-fly.js` | 1 | 0 | Runtime | D |

### Modified tracked (28) — lista completa

```
.cursor/mcp.json
.dockerignore
controllers/adminWithdrawController.js
database/patches/V1.1B-M1-R3-PROD-BASELINE-claim_and_credit_approved_pix_deposit.sql
database/patches/V1.1B-M1-R3-claim_and_credit_approved_pix_deposit.sql
database/shoot_apply_atomic_transaction.sql
docs/relatorios/V1-1B-M1-R3-STAGING-PATCH-CIRURGICO-REAL-2026-05-17.md
docs/relatorios/V1-1B-M1-R4-FECHAMENTO-PRE-PR-RPC-PIX-LEDGER-2026-05-17.md
docs/relatorios/V1-1F-STAGING-WEBHOOK-PAYOUT-HMAC-DATA-2026-05-18.json
goldeouro-player/index.html
goldeouro-player/vercel.json
goldeouro-player/vite.config.ts
package-lock.json
package.json
scripts/v1-1b-m1-r3-staging-exec.js
server-fly.js
services/pix-mercado-pago.js
src/domain/payout/processPendingWithdrawals.js
src/finance/compat/createPixWithdrawCompat.js
src/finance/deposit/createPixDeposit.js
src/finance/factory/FinanceProviderFactory.js
src/finance/providers/asaas/AsaasPaymentProvider.js
src/finance/providers/asaas/AsaasProvider.js
src/finance/providers/asaas/asaas-config.js
src/finance/providers/asaas/asaas-http-client.js
src/finance/webhooks/processAsaasTransferWebhook.js
src/finance/webhooks/processPaymentWebhook.js
src/workers/payout-worker.js
```

### Untracked — blocos principais

| Bloco | Qtd. | Exemplos |
|-------|:----:|----------|
| `docs/relatorios/` F2 | 52 | F2-2A … F2-6 |
| `docs/relatorios/` V1 | 54 | V1-1A … V1-6 |
| `docs/relatorios/` ASAAS | 6 | PIPELINE.2 … 5A |
| `docs/relatorios/` H4/H5/OC | 20 | Auditorias maio |
| `docs/executive/` | 33 | final-delivery |
| `docs/` dirs operacionais | 7 dirs | analytics, audits, chaos… |
| `database/` SQL novo | 17 | F2/F6 patches, P15D migration |
| `scripts/` | ~55 | f2-*, v1-*, f6-*, p15y-* |
| `src/finance/` novo | 7 | Asaas PIX OUT |
| Raiz forense | 12 | `_p19_*`, `_health*` |
| GIT gates pendentes | 8 | GIT.1, GIT.2, GIT.4–GIT.6 |

---

# ETAPA 2 — Classificação patrimonial (A–E)

Cada arquivo recebe **exatamente uma** classe.

## Classe A — Patrimônio crítico

| Grupo | Status | Arquivos |
|-------|--------|----------|
| H0→H3.5, P0, GIT.3, DR-01…11 | ✅ `d79a2e8` | 30 commitados |
| GIT.1, GIT.2, GIT.4, GIT.5, GIT.6 | ⏳ untracked | 6 MD + 4 JSON |
| `docs/executive/**` | ⏳ | 33 arquivos |
| DEPLOY.PIPELINE.1, P1.6D, P1.8, PE-BACKUP-1 | ⏳ | 4 relatórios |

## Classe B — Documentação operacional

- **F2*** (52 MD) — cirurgias econômicas, PIX OUT, payouts
- **V1*** (54 MD/JSON) — governança operacional, continuous verification
- **ASAAS.PIPELINE*** (6 MD)
- **F5/F6/H4/H5/OC-INC*** (~25 MD)
- **docs/audits, operational, external-monitoring, analytics, autonomous, chaos**
- **database/** patches e migrations (evidência SQL)
- **scripts/** homologação readonly (f2-*, v1-*, f6-*)

## Classe C — Código definitivo

| Arquivo | Nota |
|---------|------|
| `services/pix-mercado-pago.js` | Legacy MP — baseline prod |

> Demais código modified é **WIP Asaas** → reclassificado **D** por segurança.

## Classe D — Código experimental / WIP

| Domínio | Arquivos |
|---------|----------|
| `src/finance/` + workers | 18 (11M + 7??) |
| `server-fly.js` | 1 |
| `controllers/adminWithdrawController.js` | 1 |
| `package.json` / lock | 2 |
| `goldeouro-player/` | 9 |
| `.github/workflows/backend-deploy-staging.yml` | 1 |
| `.github/examples/` | 7 |
| `.dockerignore` | 1 |

## Classe E — Temporários (nunca versionar)

```
_p19_status.txt          _p19_core_diff.txt       _p19_diffnames.txt
_p19_diffstat.txt        _p19_finance_diffstat.txt _p19_head_factory.txt
_p19_tracked.txt         _health1_code.txt        _pe3_files.txt
database/patches/_r3_staging_baseline_tmp.sql
docs/relatorios/snapshots/fly-logs-raw-2026-05-29.txt
docs/relatorios/snapshots/f2-4e-2a-fly-*.txt
scripts/f2-4e-2a-fly-remote.b64.txt
.cursor/mcp.json
```

**Também nunca versionar:** `.env.production`, `.env.tmp` (tracked ⚠️), `goldeouro-player/.env.prod`

---

# ETAPA 3 — Lotes para futuros commits

| Lote | Nome | Classe | Arquivos | Prioridade | Objetivo |
|:----:|------|:------:|:--------:|:----------:|----------|
| **0** | *(executado)* | A | 30 | — | H0–H3.5 @ `d79a2e8` |
| **1** | Patrimônio Executivo | A | ~45 | **P0** | GIT gates + executive + certificações |
| **2** | Documentação Técnica | B | ~165 | **P1** | F2, V1, ASAAS, F6, audits (3 sub-commits) |
| **3** | Database | B | ~20 | **P1** | Patches F2/F6/V1 + migration P15D |
| **4** | Payment Engine | D | ~22 | **P2** | Asaas PIX OUT WIP isolado |
| **5** | Frontend | D | ~9 | **P2** | Player UX 5B |
| **6** | GitHub Actions | D | ~9 | **P2** | Staging deploy + examples |
| **7** | Scripts | B/D | ~55 | **P2** | Homologação reutilizável |
| **8** | Temporários | E | ~20 | **P3** | **Não commitar** — remover/gitignore |

---

# ETAPA 4 — Dependências

| Origem | Depende de | Tipo |
|--------|------------|------|
| `scripts/f2-2c-1-apply-prod.mjs` | `database/patches/F2-2C-1-*.sql` | script→SQL |
| `scripts/f6-1c-apply-rls-remediation.mjs` | `database/patches/F6-1C-*.sql` | script→SQL |
| `scripts/apply-p15d-schema-production.cjs` | `migrations/20260628_p15d_*.sql` | script→SQL |
| `src/finance/config/asaas-pix-out-config.js` | migration P15D | código→schema |
| `src/finance/deposit/claimApprovedPixDeposit.js` | patch V1.1B-M1-R3 | código→RPC |
| `docs/relatorios/F2-2C-*` | patches F2-2C SQL | doc→SQL |
| `docs/relatorios/V1-1B-M1-*` | `claim_and_credit_*.sql` | doc→SQL |
| `docs/relatorios/P1.8-*` | `src/finance/**` uncommitted | doc→código drift |
| `.github/workflows/backend-deploy-staging.yml` | `fly.staging.toml` | workflow→infra |
| LOTE 7 scripts `verify-*` | LOTE 4 código | script→runtime |

**Regra:** LOTE 3 antes de LOTE 4 e LOTE 7; LOTE 1–2 antes de qualquer código.

---

# ETAPA 5 — Riscos

| Risco | Existe? | Severidade | Mitigação |
|-------|:-------:|:----------:|-----------|
| Misturar patrimônio com WIP | **SIM** | ALTO | LOTE 1–2 antes de LOTE 4 |
| Misturar staging com produção | **SIM** | MÉDIO | Workflow staging isolado; não tocar `fly.toml` |
| Misturar documentação com código | **SIM** | ALTO | Commits por domínio |
| Misturar SQL definitivo com testes | **SIM** | MÉDIO | Excluir `_r3_staging_baseline_tmp.sql` |
| Workflows incompletos | **NÃO** | BAIXO | Review antes de push |

---

# ETAPA 6 — Índices (0–10)

| Índice | Nota | Justificativa |
|--------|:----:|---------------|
| Organização | 5,5 | Tree fisicamente caótica; lotes lógicos restauram |
| Patrimonial | 8,5 | Núcleo commitado; executive/GIT pendentes |
| Reprodutibilidade | 6,0 | Clone sem untracked perde evidência |
| Versionamento | 6,5 | 1 commit local; push pendente |
| Risco | 3,5 | Prod não afetado; risco = perda local |

---

# ETAPA 7 — Plano de execução (NÃO EXECUTAR)

| # | Commit | Lote |
|---|--------|:----:|
| 0 | `docs(patrimony): preserve H0-H3.5 consolidated asset package` | ✅ `d79a2e8` |
| 1 | `docs(patrimony): preserve executive and git gate evidence` | LOTE 1 |
| 2 | `docs(evidence): preserve F2 economic surgery chain` | LOTE 2a |
| 3 | `docs(evidence): preserve V1 operational governance chain` | LOTE 2b |
| 4 | `docs(evidence): preserve ASAAS pipeline and F6 RLS audits` | LOTE 2c |
| 5 | `chore(database): preserve F2 F6 V1 and P15D SQL patches` | LOTE 3 |
| 6 | `chore(scripts): preserve homologation tooling` | LOTE 7 |
| 7 | `feat(finance): Asaas PIX OUT WIP isolated batch` | LOTE 4 |
| 8 | `chore(player): preserve UX 5B assets` | LOTE 5 |
| 9 | `ci(staging): add deploy workflow and examples` | LOTE 6 |
| 10 | *(local)* remover LOTE 8 + atualizar `.gitignore` | LOTE 8 |
| 11 | **Push** após review humano — sem force | — |

---

# ETAPA 8 — Segurança

Produção, backend, frontend, banco, Fly, Supabase, runtime, GitHub: **nenhuma alteração**. Jogadores: **não impactados**. Risco financeiro/operacional por estado Git: **nenhum** (mudanças locais não deployadas).

---

# Respostas definitivas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Estrutura real da Working Tree? | **28M + ~280 untracked** em 9 domínios; núcleo patrimonial em `d79a2e8` |
| 2 | Patrimônio permanente? | H0–GIT.3 + DR (commitado) + executive/GIT/F2/V1/ASAAS (pendente LOTE 1–2) |
| 3 | Nunca entrar no Git? | Classe E: `_p19_*`, logs fly, tmp SQL, `.env` secrets, b64 payloads |
| 4 | Sequência perfeita de commits? | 11 passos — ver ETAPA 7 |
| 5 | Estratégia menor risco? | **Docs → SQL → Scripts → Código WIP → CI → Cleanup → Push** |
| 6 | Pronto para evoluir com segurança? | **SIM COM RESSALVAS** — seguir lotes; não `git add .` |

---

## Tabela — Modified × Classe × Lote

| Arquivo | Classe | Lote |
|---------|:------:|:----:|
| `.cursor/mcp.json` | E | 8 |
| `.dockerignore` | D | 6 |
| `controllers/adminWithdrawController.js` | D | 4 |
| `database/*` (3 modified) | B | 3 |
| `docs/relatorios/V1-1B*` (3 modified) | B | 2 |
| `goldeouro-player/*` (3 modified) | D | 5 |
| `package.json` / lock | D | 4 |
| `scripts/v1-1b-m1-r3-staging-exec.js` | B | 7 |
| `server-fly.js` | D | 4 |
| `services/pix-mercado-pago.js` | C | 4 |
| `src/**` (11 modified) | D | 4 |

---

## Assinatura

| Campo | Valor |
|-------|-------|
| Gate | GIT.6 — Classificação e Isolamento da Working Tree™ |
| Data | 2026-07-08 |
| Veredito | **PASS COM RESSALVAS** |
| Mutações | **Nenhuma** |

---

*GIT.6 — 2026-07-08 — mapa operacional read-only para preservação seletiva futura.*
