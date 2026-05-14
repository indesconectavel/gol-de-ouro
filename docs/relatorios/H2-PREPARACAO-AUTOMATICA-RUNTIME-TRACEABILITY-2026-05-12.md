# H2 — PREPARAÇÃO AUTOMÁTICA RUNTIME TRACEABILITY

**Data:** 2026-05-12  
**Branch:** `fix/admin-financial-integrity-v1`  
**Relatórios-base:** `H2-DIAGNOSTICO-RUNTIME-TRACEABILITY-GITCOMMIT-2026-05-12.md`, `H2-PRE-EXECUCAO-RUNTIME-TRACEABILITY-GITCOMMIT-2026-05-12.md` (já versionados no histórico Git).

---

## 1. Resumo executivo

Esta etapa **fecha a preparação automática** da cirurgia H2 (rastreabilidade `gitCommit` em `/meta`): baseline documental consolidada, **commit único** apenas com este relatório, **tag de segurança** `pre-h2-runtime-traceability-2026-05-12` apontando para esse commit, e **instruções de rollback** antes de qualquer alteração a `.github/workflows/deploy-on-demand.yml` ou deploy manual com `--build-arg`.

**Confirmado:** `goldeouro-player/vercel.json` **não** entrou em staging nem em commit.

**Classificação (secção 10):** **PRONTO PARA CIRURGIA H2**.

---

## 2. Estado Git inicial

| Item | Valor |
|------|--------|
| `git status --short` (antes deste commit) | ` M goldeouro-player/vercel.json`; múltiplos `??` (SQL, scripts, relatórios não H2) |
| Branch | `fix/admin-financial-integrity-v1` |
| `HEAD` anterior (pai deste commit) | `b5eb492` — *docs: registrar H2 pre-execucao gitCommit meta* |
| `git log -3 --oneline` (antes) | `b5eb492` pre-exec H2; `f136fc8` diagnóstico H2; `94d6054` H1 |

**Separação pedida:**

1. **Ficheiros H2 (já no Git antes desta preparação):** diagnóstico e pré-execução H2 nos commits `f136fc8` / `b5eb492`.
2. **Ficheiro H2 (novo nesta preparação):** este relatório `H2-PREPARACAO-AUTOMATICA-RUNTIME-TRACEABILITY-2026-05-12.md`.
3. **Fora do escopo:** todos os `??` listados (CIRURGIA-2, Plano B, scripts `20260504`, etc.).
4. **`goldeouro-player/vercel.json`:** modificado localmente — **explicitamente excluído** de qualquer commit.

---

## 3. Arquivos incluídos

| Ficheiro | Motivo |
|----------|--------|
| `docs/relatorios/H2-PREPARACAO-AUTOMATICA-RUNTIME-TRACEABILITY-2026-05-12.md` | Único ficheiro staged — baseline escrita da preparação automática H2. |

Nenhum workflow, `Dockerfile`, `server-fly.js` ou código de aplicação foi alterado nesta etapa.

---

## 4. Arquivos excluídos

| Categoria | Exemplos |
|-----------|----------|
| Player | `goldeouro-player/vercel.json` |
| Workflows | `.github/workflows/*` (incl. `deploy-on-demand.yml` — cirurgia seguinte) |
| Código runtime | `server-fly.js`, `Dockerfile`, `fly.toml` |
| Órfãos | `database/exec-plano-b-reversao-transacao-20260504.sql`, `scripts/*20260504.js`, restantes `docs/relatorios/*.md` em `??` |

---

## 5. Commit criado

| Campo | Valor |
|-------|--------|
| **Mensagem** | `docs: preparar baseline H2 runtime traceability` |
| **SHA** | O hash completo do commit que contém este ficheiro é o de `git rev-parse HEAD` na ref da tag `pre-h2-runtime-traceability-2026-05-12` (após push, deve coincidir com a ponta publicada). |

*(Validação: `git rev-parse pre-h2-runtime-traceability-2026-05-12`.)*

---

## 6. Tag criada

| Campo | Valor |
|-------|--------|
| **Nome** | `pre-h2-runtime-traceability-2026-05-12` |
| **Alvo** | O mesmo commit da secção 5 (ponta segura **antes** da edição do workflow na cirurgia H2). |
| **Validação** | `git tag --list "pre-h2-runtime-traceability-2026-05-12"` |

---

## 7. Push

- `git push` (branch `fix/admin-financial-integrity-v1`)
- `git push origin pre-h2-runtime-traceability-2026-05-12`

Registar no runbook se algum remoto rejeitar tag duplicada (já existente).

---

## 8. Rollback

### Git / código

| Cenário | Ação |
|---------|------|
| Reverter apenas o commit que alterar `deploy-on-demand.yml` (próximo passo) | `git revert <sha-do-commit-workflow>` ou reset controlado após acordo de equipa. |
| Voltar à baseline **pré-cirurgia H2** (documental + tag) | `git checkout pre-h2-runtime-traceability-2026-05-12` (read-only) ou deploy a partir desse ref se necessário. |

### Fly / runtime

| Cenário | Ação |
|---------|------|
| Deploy Fly após workflow manual mau | `fly releases -a goldeouro-backend-v2` e **rollback** para imagem anterior estável. |
| `/health` ou arranque falham | Idem — prioridade restaurar serviço; `gitCommit` em `/meta` é secundário face à disponibilidade. |

### Commit e tag “seguros” de referência

- **Antes desta preparação (histórico):** `b5eb492` — pré-execução H2 versionada.
- **Após esta preparação:** commit da secção 5 + tag `pre-h2-runtime-traceability-2026-05-12`.

---

## 9. Riscos remanescentes

- Operadores que continuem a usar **scripts ou docs** com `fly deploy` **sem** `--build-arg GIT_COMMIT` podem voltar a publicar imagem com `gitCommit: null` até higiene alargada (fora do núcleo desta preparação).
- A **cirurgia seguinte** (editar `deploy-on-demand.yml`) ainda **não** foi executada; o risco de regressão CI permanece até esse *merge*.

---

## 10. Classificação final

**PRONTO PARA CIRURGIA H2**

- Baseline documental completa (diagnóstico + pré-execução + preparação automática).
- Commit limpio **sem** `vercel.json` e **sem** mistura com `??` alheios.
- Tag de segurança criada e push de tag planeado.
- Rollback Git/Fly definido.

---

*Fim do relatório de preparação automática H2.*
