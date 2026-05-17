# H3.7 — CERTIFICAÇÃO OPERACIONAL V1 — GOL DE OURO

**Data da certificação:** 2026-05-17 (UTC ~05:17Z)  
**Modo:** 100% READ-ONLY — sem alteração de código, workflows em produção, deploy, Git remoto, tags ou variáveis  
**Objetivo:** certificar oficialmente a **V1 operacional** após H3.6A (financeiro), H3.6B (runtime/deploy), H3.6C (hardening pipeline) e H3.6C-FIX (blindagem frontend deploy)  
**Referências:** [H3.6A Financeiro](H3-6A-AUDITORIA-FINANCEIRA-FORENSE-V1-2026-05-17.md) · [H3.6B Runtime](H3-6B-AUDITORIA-RUNTIME-DEPLOY-V1-2026-05-17.md) · [H3.6C Hardening](H3-6C-HARDENING-PIPELINE-V1-2026-05-17.md) · [H3.6C-FIX](H3-6C-FIX-BLINDAGEM-FRONTEND-DEPLOY-V1-2026-05-17.md) · [H3.6C-PRE](H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md) · [V1 Encerramento](V1-ENCERRAMENTO-OFICIAL-GOLDEOURO-2026-05-16.md)

---

## 1. Resumo executivo

Foi executada a **certificação operacional read-only H3.7** da V1 Gol de Ouro: consolidação das auditorias H3.6, validação ao vivo da baseline declarada pelo operador e confirmação de que **produção permaneceu preservada** após os merges de pipeline (PR #94 e PR #95).

| Dimensão | Resultado |
|----------|-----------|
| Baseline runtime (`/meta`, Fly, bundle) | **✅ Confirmada** |
| H3.6A financeiro | **PASS COM RESSALVAS** (herdado) |
| H3.6B runtime/deploy | **PASS COM RESSALVAS** (herdado) |
| H3.6C + H3.6C-FIX | **PASS** (governança; PR #95 sem redeploy player) |
| Produção após hardening | **Preservada** (`cacc127` · v460 · `B6M2smS9`) |
| Geometria `/game` | **490 / 710 / 980** no bundle activo |

# **VEREDITO H3.7: V1 CERTIFICADA OPERACIONALMENTE — COM RESSALVAS**

A V1 está **oficialmente certificada** para operação contínua, suporte e rollback documentado. Ressalvas **não bloqueantes**: smoke autenticado humano pendente, drift intencional `origin/main` (governança) vs `/meta` (runtime), e dívida estrutural financeira já catalogada na H3.6A.

---

## 2. Baseline certificada (operador)

| Camada | Baseline declarada | Evidência H3.7 (2026-05-17) | Status |
|--------|-------------------|------------------------------|--------|
| Backend `/meta` | `cacc127` | `cacc12718bb4b7ee971b49fa5b2fb6119275bc67` | ✅ |
| Fly release | **v460** | `flyctl releases` → v460 `complete` (3h55m) | ✅ |
| Frontend bundle | `index-B6M2smS9.js` | `/`, `/game`, apex — todos **200** | ✅ |
| H3.6C | PASS | PR #94 merged; gates documentados | ✅ |
| Produção | Preservada | Pós PR #95: `/meta` e Fly **inalterados**; `frontend-deploy` **não** correu | ✅ |

---

## 3. Matriz GO — pré-requisitos H3.6

| Etapa | Veredito documentado | Evidência consolidada H3.7 | Gate H3.7 |
|-------|---------------------|----------------------------|-----------|
| **H3.6A** — Auditoria financeira forense | PASS COM RESSALVAS | Código financeiro `460ba4e..cacc127` sem diff; `/health` ok; workers payout enabled | ✅ Aceite |
| **H3.6B** — Runtime & deploy | PASS COM RESSALVAS | Probes repetidos; coerência por camada confirmada | ✅ Aceite |
| **H3.6C-PRE** — Snapshot & rollback | GO COM RESSALVAS | Runbook Fly v459 / Vercel manual válido | ✅ Aceite |
| **H3.6C** — Hardening pipeline | PASS COM RESSALVAS → **efectivo pós-merge** | PR #94; `main-pipeline` só CI; único deployer Fly em `backend-deploy.yml` | ✅ Aceite |
| **H3.6C-FIX** — Blindagem frontend | PASS | PR #95; sem self-path no trigger | ✅ Aceite |

**Interpretação:** todos os gates H3.6 necessários para certificação estão **fechados** ao nível documental e operacional. Ressalvas herdadas **não revertem** o certificado.

---

## 4. Evidências runtime (produção)

### 4.1 Fly — backend

**`GET https://goldeouro-backend-v2.fly.dev/meta`**

| Campo | Valor |
|-------|--------|
| `gitCommit` | **`cacc12718bb4b7ee971b49fa5b2fb6119275bc67`** |
| `environment` | `production` |
| `version` | `1.2.1` |
| `features.pix` / `goldenGoal` / `monitoring` | `true` |

**`GET /health`**

| Campo | Valor |
|-------|--------|
| `status` | **`ok`** |
| `database` | **`connected`** |
| `mercadoPago` | **`connected`** |
| `contadorChutes` | `431` |

**`GET /health/workers`**

| Flag | Valor |
|------|--------|
| `payoutWorker.enabledByEnv` | `true` |
| `payoutWorker.payoutPixProcessingEnabled` | `true` |

**Fly releases (topo):** **v460** activa · v459 · v458 …

### 4.2 Player — Vercel

| URL | HTTP | JS | CSS |
|-----|------|----|-----|
| `https://www.goldeouro.lol/` | 200 | `index-B6M2smS9.js` | `index-D7hr6dPE.css` |
| `https://www.goldeouro.lol/game` | 200 | `index-B6M2smS9.js` | `index-D7hr6dPE.css` |
| `https://goldeouro.lol/` | 200 | `index-B6M2smS9.js` | `index-D7hr6dPE.css` |

**Bundle `index-B6M2smS9.js` (assets):**

| Prova | Resultado |
|-------|-----------|
| Coords **490 / 710 / 980** | ✅ presentes |
| Coords antigas **495** (pré-H3.5p) | ❌ ausentes |
| `sw.js` precache | ✅ referencia `B6M2smS9` |

**Admin** (`https://admin.goldeouro.lol/`): **200** · bundle próprio `index-d541bc94.js` (esperado — app separada).

### 4.3 Rotas críticas (anónimo)

| Rota | Método | Esperado | Observado |
|------|--------|----------|-----------|
| `/api/admin/audit/logs` | GET | 401 | **401** ✅ |
| `/api/admin/users/list` | GET | 401 | **401** ✅ |
| `/api/withdraw/history` | GET | 401 | **401** ✅ |
| `/api/payments/pix/criar` | POST | 401 | **401** ✅ |

*Nota: `GET /api/admin/users` → 404 é **correcto** (rota canónica é `/list` ou `/:id`).*

---

## 5. Evidências Git & CI (read-only)

### 5.1 Git

| Ref | SHA | Nota |
|-----|-----|------|
| **Produção (`/meta`)** | **`cacc127`** | Freeze runtime V1 certificado |
| **`origin/main`** | **`636309f`** | Merge PR #95 (H3.6C-FIX) — **só governança** |
| HEAD local (sessão) | `00140f9` | Branch de trabalho ≠ `main` |

**Drift Git vs runtime:** **intencional e aceite** — merges #94/#95 alteraram apenas `.github/workflows/**` e docs; **não** houve novo deploy Fly. A verdade operacional permanece **`/meta.gitCommit`**.

**Financeiro:** `git diff 460ba4e..origin/main` em `server-fly.js`, `src/domain/payout`, `services/pix-mercado-pago.js`, `database/` → **sem alterações** (exit 0, stat vazio).

### 5.2 Workflows pós-H3.6C (GitHub Actions)

| Merge | `main-pipeline` | `backend-deploy` | `frontend-deploy` |
|-------|-----------------|------------------|-------------------|
| PR #95 (`636309f`) | ✅ success · **~13s** (CI only) | ⚠️ failure 0s (*workflow file issue* — sem deploy) | ❌ **não listado** ✅ |
| PR #94 (`4ee150c`) | ✅ success · CI | ⚠️ idem | ✅ success → bundle `B6M2smS9` |
| PR #93 (`cacc127`) | ✅ deploy histórico | — | ❌ |

**Confirmação H3.6C-FIX:** merge PR #95 **não** republicou o player — requisito crítico para «produção preservada».

### 5.3 Hierarquia de verdade (certificada)

1. **`/meta.gitCommit`** — SHA backend em Fly  
2. **Bundle `index-*.js` no HTML** — frontend player em CDN  
3. **`origin/main`** — fonte Git; pode estar à frente do runtime após merges só-pipeline  
4. **Tag `v1-baseline-460ba4e-2026-05-16`** — âncora financeira em código (`460ba4e`)

---

## 6. Mapa de baselines por camada (V1 congelada)

| Camada | SHA / artefacto | Papel na V1 certificada |
|--------|-----------------|-------------------------|
| Freeze documental + Fly | **`cacc127`** | Encerramento oficial V1 (PR #93) |
| Runtime funcional `/game` | **`7156ea2`** | Geometria estabilizada (PR #91) |
| Financeiro (código) | **`460ba4e`** | Integridade admin/PIX/saques (PR #87) |
| Bundle player canónico | **`index-B6M2smS9.js`** | Pós PR #94; baseline operacional actual |
| Bundle histórico pré-#94 | `index-CZOAOs6A.js` | Rollback Vercel documentado em H3.6C-PRE |

**Regra certificada:** alterações que movam dinheiro exigem confirmação **`/meta` + smoke financeiro + relatório GO** — inalterada face ao [V1 Encerramento](V1-ENCERRAMENTO-OFICIAL-GOLDEOURO-2026-05-16.md).

---

## 7. Ressalvas certificadas (não bloqueantes)

| ID | Ressalva | Origem | Impacto na certificação |
|----|----------|--------|-------------------------|
| R-H7-01 | **Smoke autenticado** admin/player não executado nesta sessão | H3.6B, Cirurgia 11 | Aceite formal humano pendente |
| R-H7-02 | **`origin/main` (`636309f`) ≠ `/meta` (`cacc127`)** | Pós H3.6C | Esperado; runtime estável |
| R-H7-03 | **PWA/cache** — clientes podem ver bundle antigo | H3.6C-FIX M-F1 | Mitigado parcialmente por SW + `PwaSwUpdater` |
| R-H7-04 | **Hardening financeiro estrutural** (webhook payout, ledger depósitos, RPC SQL) | H3.6A | Dívida V1.1 — não impede certificação |
| R-H7-05 | **`backend-deploy` failure 0s** em push só-workflow | PR #95 | Sem efeito em produção; higiene CI |
| R-H7-06 | Branch **`dev`** ainda pode publicar no mesmo app Fly | H3.6C M2 | V1.1 — governança |

---

## 8. O que NÃO faz parte desta certificação

| Item | Estado |
|------|--------|
| Engine V2 / novas features | **Fora de escopo** |
| Refatoração de `server-fly.js` | **Fora de escopo** |
| Deploy manual ou rollback executado | **Não realizado** |
| Submodule admin órfão | **Adiado** (H3.7 legado planeamento → V1.1) |
| Alteração de produção para «alinhar tags» | **Explicitamente não recomendado** |

---

## 9. Rollback documentado (referência — não executado)

| Superfície | Comando / acção | Alvo |
|------------|-----------------|------|
| Fly backend | `flyctl releases rollback v459` + validar `/meta` | Pré-v460 se necessário |
| Vercel player | `frontend-rollback-manual.yml` ou `vercel rollback` | `index-CZOAOs6A.js` ou snapshot `dpl_5CiXu7nXm…` |
| Git | `git checkout cacc127` | Reproduzir freeze documental |

Ver detalhes: [H3.6C-PRE Snapshot](H3-6C-PRE-SNAPSHOT-ROLLBACK-V1-2026-05-17.md).

---

## 10. Sign-off operacional

| Papel | Decisão H3.7 | Data |
|-------|--------------|------|
| Auditoria automatizada (probes + CI + Git read-only) | **CERTIFICADO COM RESSALVAS** | 2026-05-17 |
| Operador humano (smoke autenticado / pixel `/game`) | **Pendente recomendado** | — |

**Classificação oficial V1 pós-H3.7:**

> **V1 OPERACIONAL CERTIFICADA** — produção estável, baseline por camada coerente, pipeline hardened merged, rollback documentado. Próxima fase sugerida: **V1.1** (smoke formal, app Fly `dev` separado, hardening financeiro residual) ou **Engine V2** apenas após gate explícito de negócio.

---

## 11. Próximos passos recomendados (pós-certificação)

| Prioridade | Acção |
|------------|--------|
| P1 | Smoke humano ~30 min: login player → `/game` (5 zonas) → admin `/auditoria` |
| P2 | Corrigir aviso CI `backend-deploy` em push só-workflow (higiene, sem deploy) |
| P3 | V1.1: separar deploy `dev` · GitHub Environment `production` com approval |
| P4 | Tag opcional `v1-certified-cacc127-2026-05-17` (só se operador solicitar) |

**Não recomendado agora:** deploy manual para igualar `/meta` a `636309f` sem mudança funcional backend.

---

## Anexo A — Comandos / probes utilizados

```text
git fetch / rev-parse / log / diff 460ba4e..origin/main
Invoke-RestMethod  → /meta, /health, /health/workers
Invoke-WebRequest  → www.goldeouro.lol/, /game, goldeouro.lol/, sw.js, assets/index-B6M2smS9.js
Invoke-WebRequest  → rotas admin/financeiro (401/404 esperados)
flyctl releases -a goldeouro-backend-v2
gh run list → main-pipeline, backend-deploy, frontend-deploy
gh run view 25981376898 (PR #95 CI)
```

---

*Relatório H3.7 — Certificação Operacional V1. Nenhum deploy, commit ou alteração de produção executados nesta sessão.*
