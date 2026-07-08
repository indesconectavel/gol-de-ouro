# GIT.3 — Curadoria Patrimonial do Repositório™

**Projeto:** Gol de Ouro™ V1  
**Ativo Principal:** Indesconectável Payment Engine™  
**Gate:** GIT.3  
**Data:** 2026-07-08  
**Modo:** READ-ONLY ABSOLUTO — CURADORIA PATRIMONIAL  
**Prioridade:** MÁXIMA  
**Base:** P0 · GIT.1 · GIT.2 · PE.PATRIMÔNIO.1/2B/3 · globs do tree · leitura `.git/`  
**Snapshot:** `docs/relatorios/snapshots/git3-patrimonial-curation.json`

---

## Declarações limitadoras

1. **Nenhuma** mutação Git (`add`/`commit`/`restore`/`checkout`/`reset`/`clean`/`stash`/`merge`/`push`/`pull`/`rebase`).  
2. **Nenhuma** edição, move, delete, branch, alteração de `.gitignore`, deploy ou cloud.  
3. Shell do agente **inoperante** (D0) — inventário **sem** `git status --short` live. Classificação por **evidência documental + glob + estado `.git/`** (HEAD `110db9e` pós-A2R; **MERGE_HEAD ausente**).  
4. Contagens são **ordem de magnitude / por padrão**; onde a enumeração exacta exigir status live: **"Sem evidência suficiente para contagem exata."**

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
secrets_changed=false
production_changed=false
```

---

## Veredito

# **PASS COM RESSALVAS**

Curadoria patrimonial **estruturalmente completa** (mapa + classes + plano). Ressalvas: (1) falta inventário live da working tree; (2) volume histórico ainda denso; (3) misturam-se classes A/B/C no mesmo diretório `docs/relatorios/`.

| Índice | Nota (0–10) |
|--------|:-----------:|
| **Higiene Git** | **5,5** |
| **Patrimonial** | **8,0** |
| **Curadoria** | **7,5** |

### Repositório pronto para nova evolução?

# **SIM COM RESSALVAS**

Pode evoluir e redigir H4; **não** declarar working tree “limpa” até Fase 1 de higienização (futura, fora deste gate).

---

# 1. Contexto pós-GIT.2

| Item | Estado |
|------|--------|
| Merge aberto | **NÃO** (`MERGE_HEAD` ausente) |
| Branch | `chore/f2-4e-2-mp-log` |
| HEAD documentado | `110db9e` — `ci(a2r): add safe Asaas sandbox staging workflow` |
| Remote branch (ref local) | `origin/chore/f2-4e-2-mp-log` = `110db9e` |
| Working tree | **Provavelmente suja** (série H0–P0 + dumps `_p19_*` + patches/SQL — evidência sessão + globs); status short **não coletado** |

---

# 2. Mapa Patrimonial do Repositório

```text
goldeouro-backend/
├── [A] src/finance, src/payment-engine, src/domain/payout, src/workers
├── [A] server-fly.js, routes financeiras, LICENSE-PAYMENT-ENGINE, README-PAYMENT-ENGINE
├── [A] docs/payment-engine/01–12, docs/data-room/DR-01–11, docs/certification, docs/governance
├── [A/B] fly.toml, fly.staging.toml, Dockerfile*, .github/workflows (prod+staging+A2R)
├── [B] .github/examples, scripts/verify-*, scripts/p19*, scripts/s2*, s3*
├── [C] docs/relatorios/{F*,P1*,H4*,V1-*,S*,G*,PE-*,GIT.*,D0*,H0–P0 oficiais}
├── [C] docs/relatorios/snapshots/** (ops + patrimoniais)
├── [C] database/patches + rollback + staging SQL (históricos certificados)
├── [A] goldeouro-player / goldeouro-admin (produto)
├── [D] _p19_*.txt, _health*.txt, _pe3_files.txt (raiz)
├── [E] .env* locais (se existirem), secrets/, cache, dumps com tokens
└── [C/E] backup*/, backup-pre-limpeza-* (histórico / preferir fora do tip)
```

---

# 3. Classificação por famílias (cada padrão = 1 classe)

Legenda: **Imp.** = importância (Alta/Média/Baixa) · **Destino** = recomendação futura (não executar).

## 3.1 Classe A — Patrimônio Permanente

| Arquivo / padrão | Motivo | Valor | Risco remover | Risco versionar | Destino |
|------------------|--------|-------|---------------|-----------------|---------|
| `src/finance/**` certificado | Núcleo IPE | Crítico | Catastrófico | Baixo | Manter versionado |
| `src/payment-engine/**` | Facade P2.2 | Crítico | Alto | Baixo | Manter |
| `src/workers/payout-worker.js` | Runtime OUT | Crítico | Alto | Baixo | Manter |
| `src/domain/payout/**` | Domínio saques | Alto | Alto | Baixo | Manter |
| `server-fly.js` | Entry prod | Crítico | Catastrófico | Baixo | Manter |
| `LICENSE-PAYMENT-ENGINE.md` / `README-PAYMENT-ENGINE.md` / `CHANGELOG_PAYMENT_ENGINE.md` | IP / produto | Alto | Alto | Baixo | Manter |
| `docs/payment-engine/01–12` | Canônico PE | Alto | Alto | Baixo | Manter |
| `docs/data-room/DR-01`…`DR-11` + `INDICE-DUE-DILIGENCE.md` | DD | Alto | Alto | Baixo | Manter |
| `docs/certification/**` | Cert V1 | Alto | Alto | Baixo | Manter |
| `docs/governance/{BASELINE,PROPRIETARY,LICENSE-POLICY,CESAO,BRAND}*` | Governança IP | Alto | Médio | Baixo | Manter |
| `docs/arquitetura/{PAYMENT-ENGINE,ADR,HOMOLOGACAO}*` | Arquitetura | Alto | Médio | Baixo | Manter |
| `fly.toml` | Prod Fly | Crítico | Alto | Baixo | Manter |
| `Dockerfile*` (canônicos) | Build | Alto | Médio | Baixo | Manter |
| `.github/workflows/{ci,tests,security,backend-deploy,frontend-deploy,rollback,health-monitor,monitoring,main-pipeline}.yml` | CI/CD | Alto | Alto | Baixo | Manter |
| `goldeouro-player/**` / `goldeouro-admin/**` (código produto) | Produto | Alto | Alto | Baixo | Manter |
| `database/claim_and_credit*.sql` canônico / `shoot_apply*` oficial | SQL prod | Crítico | Alto | Médio (diffs WIP) | Manter baseline; isolar WIP |
| Relatórios oficiais série patrimonial `H0` `H1` `H2` `H2A` `H2.5` `H3` `H3.5` `P0` | Narrativa H4 | Alto | Alto | Baixo | Commitar em lote docs |

## 3.2 Classe B — Patrimônio Evolutivo

| Arquivo / padrão | Motivo | Valor | Risco remover | Risco versionar | Destino |
|------------------|--------|-------|---------------|-----------------|---------|
| `fly.staging.toml` | Homologação permanente | Alto | Alto | Baixo | Versionar |
| `.github/workflows/backend-deploy-staging.yml` | Deploy staging | Alto | Alto | Baixo | Versionar |
| `.github/workflows/a2r-staging-asaas-sandbox.yml` | A2R | Alto | Alto | Baixo | Já em HEAD `110db9e` |
| `.github/examples/**` | Gates exemplo | Médio | Baixo | Baixo | Versionar como examples |
| `.env.local.staging.example` / `.env.local.production.example` | Templates | Médio | Médio | Baixo se só exemplo | Versionar exemplos |
| `scripts/p19-certification.cjs` | Cert PE | Alto | Alto | Baixo | Versionar |
| `scripts/verify-*.mjs` | Homologação | Alto | Médio | Baixo | Versionar |
| `scripts/s2-*.mjs` / `s3.2-*.mjs` | Staging tooling | Médio–Alto | Médio | Baixo | Versionar |
| `database/staging/**` | Bootstrap staging | Médio | Médio | Médio | Versionar c/ label staging |
| `database/migrations/20260628_p15d_*` | Migração Asaas columns | Alto | Alto | Baixo | Versionar + rollback |
| Adendas H2.5 em DR-* | Sync Data Room | Alto | Médio | Baixo | Já no tree; versionar c/ DR |

## 3.3 Classe C — Patrimônio Histórico

| Arquivo / padrão | Motivo | Valor | Risco remover | Risco versionar | Destino |
|------------------|--------|-------|---------------|-----------------|---------|
| `docs/relatorios/P1.*` | Trilha produção | Alto evidência | Alto (perda DD) | Baixo–Médio (volume) | Lotes históricos versionados |
| `docs/relatorios/F4.*` / `F3.*` / `F2.*` / `F6.*` | Formação / cirurgias | Alto | Alto | Médio volume | Versionar |
| `docs/relatorios/S1*`…`S3*` / `G1*` `G2*` | Staging lineage | Alto | Médio | Baixo | Versionar |
| `docs/relatorios/PE-*` `D0*` `D1*` `GIT.*` `A2*` | Patrimônio/ops | Alto | Médio | Baixo | Versionar |
| Séries `H1-HIGIENE`…`H5-*` **maio** (ops) | Era V1 ops | Médio–Alto | Médio | Médio (colisão nome c/ H1 jul) | Versionar c/ glossário |
| `docs/relatorios/snapshots/**` (g2, s3, f2, f6, a2r, claim SQL) | Evidência | Alto | Alto | Médio (logs) | Versionar curated; excluir logs brutos |
| `docs/executive/**` `docs/audits/**` | Entrega V1 | Alto | Médio | Baixo | Versionar |
| `database/patches/F2-*` `F6-1C*` `V1.1B-M1-R*` | Patches hist. | Alto | Alto | Baixo | Versionar |
| `database/rollback/**` | Rollback | Alto | Alto | Baixo | Versionar |
| Snapshots patrimoniais `h0`…`h3.5` `p0` JSON | Trace Hx | Alto | Alto | Baixo | Versionar |

## 3.4 Classe D — Artefatos Temporários

| Arquivo / padrão | Motivo | Valor | Risco remover | Risco versionar | Destino |
|------------------|--------|-------|---------------|-----------------|---------|
| `_p19_*.txt` / `_p19_*.diff*` raiz | Diff dumps sessão | Nenhum | Baixo | Alto (ruído) | Não versionar; apagar depois |
| `_health1_code.txt` `_pe3_files.txt` | Outputs agente | Nenhum | Baixo | Alto | Não versionar |
| `docs/relatorios/snapshots/f2-4e-2a-fly-*.txt` / `fly-logs-raw*` | Logs brutos | Baixo ops | Baixo | Médio (secrets/PII) | Não tip; archive local |
| `database/patches/_r3_staging_baseline_tmp.sql` | TMP explícito | Baixo | Baixo | Médio | Não tip |
| Listagens `*_status*` `*_tracked*` `*_diffstat*` (padrão) | Scrap | Nenhum | Baixo | Alto | Descartar |
| `player-dist-deploy/` se legado congelado | Artefato build | Baixo | Baixo | Médio | Avaliar exclude |

## 3.5 Classe E — Candidatos a `.gitignore` (sem editar agora)

| Padrão / pasta | Motivo |
|----------------|--------|
| `.env` `.env.local` `.env.*.local` (não `*.example`) | Secrets |
| `secrets/` | Crítico (PE.PATRIMÔNIO R6) |
| `_agent_*` `_health*` `_p19_*` `spike-*` `P15Y-*` | Temporários |
| `*.log` / `fly-logs-raw*` | Logs |
| `node_modules/` `.next/` `dist/` locais | Build |
| `backup/` / `backup-pre-limpeza-*` no tip | Preferir archive externo (já duplica) |
| `.cursor/` configs locais se com tokens | Local |

---

# 4. Quantidades (estimativa por classe)

| Classe | Estimativa | Base |
|--------|-----------:|------|
| **A** Permanente | **~80–150** paths canônicos (código+docs oficiais+workflows core) | Tree estrutural |
| **B** Evolutivo | **~60–120** (staging, verify, examples, migrations recentes) | Globs scripts/workflows |
| **C** Histórico | **~400–900+** (relatórios+snapshots+patches) | PE.PATRIMÔNIO ~461 untracked hist.; corpus docs |
| **D** Temporários | **~20–80** (dumps raiz + logs snapshot) | Glob `_p19_*` + logs |
| **E** Ignorar | **~10–50** padrões + backups | PE.PATRIMÔNIO Grupo F/G |

**Contagem exacta arquivo-a-arquivo:** Sem evidência suficiente (sem `git status --short` live).

---

# 5. Top 50 — mais importantes (prioridade versionamento / DD)

1. `src/finance/**` (núcleo)  
2. `src/payment-engine/**`  
3. `server-fly.js`  
4. `src/workers/payout-worker.js`  
5. `src/domain/payout/**`  
6. `LICENSE-PAYMENT-ENGINE.md`  
7. `README-PAYMENT-ENGINE.md`  
8. `CHANGELOG_PAYMENT_ENGINE.md`  
9. `docs/payment-engine/01-Arquitetura.md`…`12-Core-Decoupling.md`  
10. `docs/data-room/DR-01-RESUMO-EXECUTIVO.md`  
11. `docs/data-room/INDICE-DUE-DILIGENCE.md`  
12–21. `DR-02` … `DR-11`  
22. `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`  
23. `docs/executive/V1-FINAL-OPERATIONAL-VERDICT.md`  
24. `fly.toml`  
25. `fly.staging.toml`  
26. `.github/workflows/backend-deploy.yml`  
27. `.github/workflows/backend-deploy-staging.yml`  
28. `.github/workflows/a2r-staging-asaas-sandbox.yml`  
29. `scripts/p19-certification.cjs`  
30. `scripts/verify-p18-payout-recovery.mjs`  
31. `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md`  
32. `docs/relatorios/F4.Z-CERTIFICACAO-OFICIAL-PAYMENT-ENGINE-V1.md`  
33. `docs/relatorios/G2-CERTIFICACAO-HOMOLOGACAO-PERMANENTE.md`  
34. `docs/relatorios/H0-CERTIFICACAO-FINAL-PLATAFORMA-ENGENHARIA.md`  
35. `docs/relatorios/H1-EMPACOTAMENTO-PATRIMONIAL-OFICIAL.md`  
36. `docs/relatorios/H3-VALUATION-TECNOLOGICO-DO-ATIVO.md`  
37. `docs/relatorios/H3.5-CONSOLIDACAO-PATRIMONIAL-FINAL.md`  
38. `docs/relatorios/P0-ESTABILIZACAO-PLATAFORMA-ENGENHARIA.md`  
39. `docs/governance/PROPRIETARY-SCOPE.md`  
40. `docs/governance/BASELINE-PROTECTION-POLICY.md`  
41. `docs/arquitetura/PAYMENT-ENGINE-V1.md`  
42. `docs/arquitetura/HOMOLOGACAO-PERMANENTE.md`  
43. `database/patches/F6-1C-enable-rls-class-a-tables-2026-06-12.sql`  
44. `database/patches/V1.1B-M1-R3-*claim*` (baseline)  
45. `docs/relatorios/PE-VALOR-1-AVALIACAO-ESTRATEGICA.md`  
46. `docs/relatorios/snapshots/g2-certificacao-staging-2026-07-06.json`  
47. `docs/relatorios/snapshots/h1-patrimonial-package.json`  
48. `goldeouro-player/` (app)  
49. `goldeouro-admin/` (app)  
50. `.env.example` / `.env.local.*.example` (templates)

---

# 6. Top 50 — temporários / não tip (amostra + padrões)

1–10. `_p19_diffstat.txt` `_p19_diffnames.txt` `_p19_core_diff.txt` `_p19_finance_diffstat.txt` `_p19_head_factory.txt` `_p19_status.txt` `_p19_tracked.txt` `_pe3_files.txt` `_health1_code.txt` (+ pares)  
11–20. `docs/relatorios/snapshots/f2-4e-2a-fly-m1.txt` `…-m2.txt` `…-logs-tail.txt` `fly-logs-raw-2026-05-29.txt`  
21–30. `database/patches/_r3_staging_baseline_tmp.sql` + futuros `*_tmp.sql`  
31–40. Padrões `_agent_*` `spike-*` `P15Y-*` (PE.PATRIMÔNIO Grupo F)  
41–50. Duplicatas em `backup-pre-limpeza-*/.github/workflows/*` no tip (preferir archive)

---

# 7. Verificações temáticas

### Documentação
| Pergunta | Resposta |
|----------|----------|
| Duplicados? | **SIM** — DR-09∩PE.VALOR; score 88 restated; backups duplicam workflows |
| Obsoleta? | **SIM** — corpos DR jun (mitigado adendas H2.5) |
| Substituída? | **SIM** — narrativa Asaas/OUT → H0/P1.9 |
| Virar oficial? | Série H0–P0 + DR-01 + Índice |
| Sair do Git? | Dumps `_p19_*`; logs brutos; `.env` reais |

### Scripts
| Tipo | Exemplos |
|------|----------|
| Permanentes / reutilizáveis | `verify-*`, `p19-certification`, certification/reliability |
| Homologação | `s2-*`, `s3.2-*`, `verify-asaas-*` |
| Históricos cirúrgicos | `f2-*`, `v1-1b-*` → Classe C |
| Descartáveis | one-off fly text dumps |

### SQL
| Tipo | Exemplos |
|------|----------|
| Definitivo / migração | claim RPC, F6-1C, p15d migrations |
| Rollback | `database/rollback/**`, `*-ROLLBACK-*` |
| Patch | F2-2B/C, F2-3C |
| Temporário | `_r3_staging_baseline_tmp.sql` |
| Duplicidades | R2 vs R3 claim — manter com rótulo; não misturar WIP |

### Workflows
| Tipo | Path |
|------|------|
| Produção | `backend-deploy.yml`, `frontend-deploy.yml` |
| Staging / A2R | `backend-deploy-staging.yml`, `a2r-staging-asaas-sandbox.yml` |
| CI | `ci.yml`, `tests.yml`, `security.yml` |
| Experimentais | `.github/examples/*` |
| Obsoletos em backup | `backup-pre-limpeza-*/.github/**` |

### Data Room
DR-01–11 + índice: **consistentes pós-H2.5** com adendas; drift residual corpo/adenda; sem duplicata DR-01.

### Relatórios
| Tipo | Exemplos |
|------|----------|
| Oficiais (A) | H0–H3.5, P0, H2.5 |
| Históricos (C) | P1, F4, S/G, PE, D0/D1, H ops maio |
| Transitórios | Em transição untracked→commit |
| Descartáveis (D) | dumps raiz |

### Snapshots
| Tipo | Exemplos |
|------|----------|
| Patrimoniais | `h0`…`h3.5`, `p0`, `h1-package` |
| Operacionais | `g2-*`, `s3.3-*`, `a2r-*`, f6/f2 curated |
| Temporários | fly-logs-raw, tails txt |

---

# 8. Top riscos

| Eixo | Risco | Severidade |
|------|-------|:----------:|
| Versionamento | Commitar dumps/`secrets`/logs | **ALTO** |
| Patrimônio | Perder untracked H0–P0 / P1 se máquina falhar | **ALTO** |
| Git | WIP `src/finance` misturado a baseline (histórico PE.PATRIMÔNIO) | **MÉDIO–ALTO** |
| Deploy | R7 `dev`→app prod; workflows untracked antes de tip | **MÉDIO** |
| Produção | Este gate **não** altera; risco só se higienização futura errada | **BAIXO** (neste modo) |

---

# 9. Plano de Higienização (NÃO EXECUTAR)

### FASE 1 — Preservar sem poluir
1. Inventariar live: `git status --short` (operador).  
2. Commitar **lotes Classe A/B docs** (H0–P0, DR, snapshots h*, staging manifests) — **sem** dumps.  
3. Confirmar `secrets/` e `.env` fora do stage.

### FASE 2 — Histórico controlado
4. Lotes Classe C (P1/F4/S/G restantes) conforme PE.PATRIMÔNIO.  
5. Snapshots curated; **excluir** logs brutos.  
6. Glossário: H* maio ≠ H0–H3.5 julho.

### FASE 3 — Limpeza local
7. Remover Classe D da working tree (após backup externo se quiser).  
8. Atualizar `.gitignore` (gate futuro) com padrões E.  
9. Archive `backup-*` fora do tip ou gitignore.

---

# 10. Respostas executivas

| Pergunta | Resposta |
|----------|----------|
| Veredito | **PASS COM RESSALVAS** |
| Higiene Git | **5,5 / 10** |
| Índice Patrimonial | **8,0 / 10** |
| Índice Curadoria | **7,5 / 10** |
| Pronto para nova evolução? | **SIM COM RESSALVAS** |
| Produção alterada? | **NÃO** — flags todas `false` |

---

## Assinatura

| Campo | Valor |
|-------|-------|
| Gate | GIT.3 — Curadoria Patrimonial do Repositório™ |
| Data | 2026-07-08 |
| Mutações | **Nenhuma** |
| Próximo (humano) | Status live + FASE 1 commits seletivos (outro gate) |

---

*GIT.3 — 2026-07-08 — curadoria read-only; inventário por padrão perante shell inoperante.*
