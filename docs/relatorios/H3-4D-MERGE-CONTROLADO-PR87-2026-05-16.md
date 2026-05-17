# H3.4d — MERGE CONTROLADO — PR #87

**Data da execução:** 2026-05-16  
**PR:** https://github.com/indesconectavel/gol-de-ouro/pull/87  
**Modo:** merge remoto via GitHub CLI — **sem** squash, rebase, force push ou deploy manual local.

---

## 1. PR merged ou não

| Item | Valor |
|------|--------|
| **Merged?** | **Sim** |
| **mergedAt** | `2026-05-16T14:48:17Z` |
| **state** | `MERGED` |
| **Comando** | `gh pr merge 87 --merge` |

---

## 2. Estratégia usada

| Opção | Usada? |
|-------|--------|
| **Merge commit** (`--merge`) | **Sim** |
| Squash | **Não** |
| Rebase | **Não** |
| Force push | **Não** |

Estratégia alinhada ao plano H3.4 / corpo do PR #87.

---

## 3. SHA de merge em main

| Ref | SHA | Mensagem |
|-----|-----|----------|
| **mergeCommit (GitHub)** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` | Merge pull request #87 from indesconectavel/fix/admin-financial-integrity-v1 |
| **`origin/main` (pós-fetch)** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` | Idem |
| **`main` anterior** | `a60bbf1c38ab6dc20a5d48d7b0fe4fe534f89c32` | Merge PR #86 |

**Intervalo publicado:** `a60bbf1..460ba4e` em `main`.

---

## 4. Confirmação de que 7ecedca pertence à main

```bash
git merge-base --is-ancestor 7ecedca98d1f5d5d7c1878aa043ec724e422dd41 origin/main
```

| Resultado |
|-----------|
| **Sim** — `7ecedca` é ancestral de `origin/main` após o merge |

Objetivo de governança Git do H3.4 **cumprido**: a linha de produção validada (`7ecedca`) passa a fazer parte do histórico de `main`.

---

## 5. Estado de /meta após merge

### Antes do merge (checklist)

| Campo | Valor |
|-------|--------|
| `gitCommit` | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |

### Imediatamente após merge (~14:48:27Z)

| Campo | Valor |
|-------|--------|
| `gitCommit` | `7ecedca` *(ainda)* |

### Após workflows de deploy em `main` (~14:49–14:51Z)

| Campo | Valor |
|-------|--------|
| `gitCommit` | **`460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3`** |
| `version` | `1.2.1` |
| `environment` | `production` |

### `/health` (final desta sessão)

| Campo | Valor |
|-------|--------|
| status | ok |
| database | connected |
| mercadoPago | connected |

**Interpretação:** o **rótulo** `/meta.gitCommit` passou de `7ecedca` para `460ba4e` (SHA do **merge commit** injetado no build Fly). O código de **backend** entre `7ecedca` e `041a771` não tinha alterações em `server-fly.js` (H3.3c); o deploy pode ser **equivalente** em comportamento de API, mas a **rastreabilidade** e o **player Vercel** mudaram de baseline.

---

## 6. Workflows disparados

Push em `main` (merge PR #87) acionou workflows (~`2026-05-16T14:48:20Z`):

| Run ID | Workflow | Evento | Estado final (observado) |
|--------|----------|--------|---------------------------|
| [25964846203](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846203) | CI | push `main` | concluído |
| [25964846212](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846212) | 🧪 Testes Automatizados | push `main` | concluído |
| [25964846213](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846213) | 🚀 Backend Deploy (Fly.io) | push `main` | **success** |
| [25964846220](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846220) | 🔒 Segurança e Qualidade | push `main` | concluído |
| [25964846232](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846232) | 🚀 Pipeline Principal - Gol de Ouro | push `main` | **success** |
| [25964846247](https://github.com/indesconectavel/gol-de-ouro/actions/runs/25964846247) | 🎨 Frontend Deploy (Vercel) | push `main` | **success** |

---

## 7. Se houve deploy automático ou não

### Resposta: **SIM — deploy automático de produção ocorreu**

| Alvo | Job | Evidência |
|------|-----|-----------|
| **Fly.io** `goldeouro-backend-v2` | `🚀 Deploy Backend` (run 25964846213) | `flyctl deploy` — **success** |
| **Fly.io** | `🚀 Deploy Backend (Fly.io)` (run 25964846232, main-pipeline) | **success** |
| **Vercel produção** (player) | `🚀 Deploy Produção` (run 25964846247) | `📤 Deploy Vercel (produção)` — **success** |
| **APK** | `📱 Build APK` | **success** (artefacto; não confundir com Fly) |

**Não** foi executado deploy manual nesta etapa H3.4d. Os deploys foram **disparados pelo pipeline** em `push` para `main` (`if: github.ref == 'refs/heads/main'`).

### Classificação

| Tipo | Avaliação |
|------|-----------|
| Incidente técnico grave (health down) | **Não observado** — `/health` ok |
| **Drift de governança H3.2** (“deploy bloqueado até H3.6”) | **Sim** — merge em `main` **antecipou** deploy formal |
| Incidente de pipeline (registo obrigatório) | **Sim** — deploy real Fly + Vercel prod **sem** gate H3.6 |

**Rollback:** **não** executado nesta etapa (conforme instrução: só com decisão explícita ou incidente grave confirmado).

### Impacto provável

| Superfície | Impacto |
|----------|---------|
| Backend Fly | Imagem com `GIT_COMMIT=460ba4e`; código servidor ~linha feature (≈ `7ecedca` para `server-fly.js`) |
| Player Vercel | **Pode** incluir `dac9f8b` (H3.0B mobile) — **não** estava em produção antes do merge |
| `/meta` | SHA de rastreio **alterado** |

---

## 8. Decisão final

| Pergunta | Decisão |
|----------|---------|
| Merge PR #87 executado? | **Sim** — merge commit `460ba4e` |
| Estratégia correta? | **Sim** (`--merge`) |
| `7ecedca` ∈ `main`? | **Sim** |
| Deploy manual? | **Não** |
| Deploy automático pós-merge? | **Sim** — Fly + Vercel prod |
| Produção saudável após deploy? | **Sim** (`/health` ok) |
| Alinhado com “NO-GO deploy até H3.6”? | **Não** — **drift de processo** |

### Classificação global H3.4d

**MERGE CONCLUÍDO COM SUCESSO — GOVERNANÇA DEPLOY: RESSALVA CRÍTICA**

O merge cumpre o objectivo Git (main alinhada à linha V1). O pipeline em `main` **executou deploy real** não planeado para esta fase — **registar**, **não** reverter automaticamente.

### Próximas etapas recomendadas

1. **H3.5** — tag em `main` / documentar nova baseline operacional: `/meta` = `460ba4e` (ou revalidar se rollback desejado).  
2. **Smoke** player (H3.0B / `dac9f8b`) em produção Vercel — agora potencialmente live.  
3. **H3.6** — redefinir gate de deploy ou desactivar deploy automático em `push` a `main` até validação explícita.  
4. Commit opcional deste relatório + H3.4c em `docs:` na branch de integração ou `main`.  
5. Se a equipa quiser **restaurar** rótulo `7ecedca` em Fly: `fly releases` + rollback **com decisão humana** — fora do âmbito automático.

---

*Fim do relatório H3.4d — merge PR #87 executado; deploy automático registado.*
