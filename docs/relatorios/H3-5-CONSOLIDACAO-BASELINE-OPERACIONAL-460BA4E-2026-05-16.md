# H3.5 — CONSOLIDAÇÃO DA BASELINE OPERACIONAL `460ba4e`

**Data da consolidação:** 2026-05-16  
**Contexto:** pós-merge [PR #87](https://github.com/indesconectavel/gol-de-ouro/pull/87) e deploy automático em `main` ([H3.4d](H3-4D-MERGE-CONTROLADO-PR87-2026-05-16.md)).  
**Modo:** verificação read-only + **tag anotada** (única mutação Git autorizada nesta etapa).  
**Sem:** novo deploy, rollback, SQL, alteração de código ou pipelines.

---

## 1. Resumo executivo

A **nova baseline operacional V1** fica oficialmente definida como:

| Camada | Referência |
|--------|------------|
| **Git `main`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| **Runtime Fly `/meta`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| **Tag de rollback/rastreio** | `v1-baseline-460ba4e-2026-05-16` → `460ba4e` |

Todas as verificações pedidas **passaram**. A baseline anterior de produção (`7ecedca`) permanece no **histórico** de `main` (ancestral), mas deixa de ser o rótulo activo em `/meta`.

**Decisão final:** **BASELINE V1 CONSOLIDADA — GO**

---

## 2. SHA baseline

| Identificador | SHA completo | SHA curto |
|---------------|----------------|-----------|
| **Baseline oficial H3.5** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` | `460ba4e` |
| **Mensagem** | Merge pull request #87 from indesconectavel/fix/admin-financial-integrity-v1 | |
| **Pais do merge** | `a60bbf1` + `041a771` | |
| **Baseline histórica (pré-merge Fly)** | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` | `7ecedca` |

---

## 3. Estado de main

| Verificação | Resultado |
|-------------|-----------|
| `git fetch origin` | OK |
| `git rev-parse origin/main` | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| `git log -1 origin/main` | `460ba4e Merge pull request #87...` |
| Alinhamento com baseline esperada | **100%** |

**`main` remoto é a fonte Git oficial** pós-H3.4, conforme [H3.2](H3-2-SOURCE-OF-TRUTH-V1-PLANEAMENTO-2026-05-16.md).

---

## 4. Estado de /meta

**`GET https://goldeouro-backend-v2.fly.dev/meta`** (2026-05-16, sessão H3.5):

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3",
    "environment": "production",
    "features": { "pix": true, "goldenGoal": true, "monitoring": true }
  }
}
```

| Campo | Esperado | Observado |
|-------|----------|-----------|
| `gitCommit` | `460ba4e…` | **`460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3`** ✅ |

**Verdade operacional actual** = `/meta` = **`460ba4e`** (actualizado face a `7ecedca`).

---

## 5. Estado de /health

**`GET https://goldeouro-backend-v2.fly.dev/health`**:

| Campo | Valor |
|-------|--------|
| `status` | **ok** |
| `version` | `1.2.1` |
| `database` | **connected** |
| `mercadoPago` | **connected** |
| `timestamp` | `2026-05-16T14:58:25.123Z` |

**Fly produção estável** no momento da consolidação.

---

## 6. Confirmação de ancestralidade de 7ecedca

```bash
git merge-base --is-ancestor 7ecedca98d1f5d5d7c1878aa043ec724e422dd41 origin/main
```

| Resultado |
|-----------|
| **Sim** — `7ecedca` ∈ histórico de `main` |

A produção validada anterior (H2) **não foi apagada** do DAG; apenas substituída como **rótulo** de runtime activo.

---

## 7. Estado do PR #87

| Campo | Valor |
|-------|--------|
| **URL** | https://github.com/indesconectavel/gol-de-ouro/pull/87 |
| **state** | **MERGED** |
| **mergedAt** | `2026-05-16T14:48:17Z` |
| **mergeCommit.oid** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |

---

## 8. Estado dos workflows

Workflows disparados pelo **push em `main`** (merge PR #87):

| Workflow | Run (amostra) | Conclusão |
|----------|---------------|-----------|
| CI | [25964846203](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846203) | **success** |
| 🧪 Testes Automatizados | [25964846212](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846212) | **success** |
| 🚀 Backend Deploy (Fly.io) | [25964846213](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846213) | **success** |
| 🔒 Segurança e Qualidade | [25964846220](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846220) | **success** |
| 🚀 Pipeline Principal | [25964846232](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846232) | **success** |
| 🎨 Frontend Deploy (Vercel) | [25964846247](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846247) | **success** |
| ⚠️ Rollback Automático | [25964880870](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964880870) | **skipped** |

**Falhas críticas:** **nenhuma** nos runs de merge/deploy observados.

### Fly e Vercel produção

| Superfície | Estabilidade (evidência) |
|------------|---------------------------|
| **Fly** | `/health` ok; `/meta` = `460ba4e`; deploy backend **success** |
| **Vercel** | Workflow `Deploy Produção` **success**; sem falha reportada nesta consolidação |

**Nota H3.5:** player em produção pode incluir alterações `dac9f8b` (H3.0B) — smoke humano recomendado como follow-up, **fora** desta etapa.

---

## 9. Tag criada

| Item | Valor |
|------|--------|
| **Nome** | `v1-baseline-460ba4e-2026-05-16` |
| **Tipo** | Anotada (`-a`) |
| **Aponta para** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| **Mensagem** | `V1 baseline operacional após H3.4` |
| **Push remoto** | **Sim** — `git push origin v1-baseline-460ba4e-2026-05-16` |
| **Tagger (local)** | Fred S. Silva |

**Uso recomendado:** referência de rollback Git, auditoria e correlação com `/meta` futuro.

**Tags históricas relacionadas (referência):**

| Tag | Commit | Nota |
|-----|--------|------|
| `pre-h2-runtime-traceability-2026-05-12` | `77464f5` | Pré-deploy H2 |
| **`v1-baseline-460ba4e-2026-05-16`** | **`460ba4e`** | **Baseline H3.5 actual** |

---

## 10. Decisão final

| Critério | Status |
|----------|--------|
| `origin/main` = `460ba4e` | ✅ |
| `/meta` = `460ba4e` | ✅ |
| `/health` OK | ✅ |
| `7ecedca` ancestral de `main` | ✅ |
| PR #87 merged | ✅ |
| Workflows pós-merge sem falha crítica | ✅ |
| Fly/Vercel estáveis (evidência runtime + CI) | ✅ |
| Tag `v1-baseline-460ba4e-2026-05-16` criada e publicada | ✅ |

### **BASELINE OPERACIONAL V1 CONSOLIDADA — GO**

**Source of truth actualizada (H3.5):**

| Prioridade | Fonte |
|------------|--------|
| 1 | `/meta.gitCommit` → **`460ba4e`** |
| 2 | `origin/main` → **`460ba4e`** |
| 3 | Tag **`v1-baseline-460ba4e-2026-05-16`** |

### Próximas etapas recomendadas (sem executar aqui)

1. Commit `docs:` com relatórios H3.4c, H3.4d, H3.5 (opcional).  
2. Smoke player/mobile em produção (H3.0B).  
3. H3.6 revisitado — política de deploy automático em `push` a `main` (governança pipeline).  
4. Migração `admin_logs` em Supabase — só com gate dedicado.

---

*Fim da consolidação H3.5 — baseline `460ba4e` oficial.*
