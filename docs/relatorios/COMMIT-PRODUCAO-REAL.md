# Commit da Produção Real — Deploy ez1oc96t1

**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de repositório, Vercel ou deploy)

---

## 1. Fonte da verdade

- **Deploy em produção (referência):** ez1oc96t1  
- **Documentação usada:** INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md (inspeção Vercel e alias), vercel.json do goldeouro-player (apenas configuração de build, sem SHA).

---

## 2. Commit SHA que gerou o deploy ez1oc96t1

| Campo | Valor |
|-------|--------|
| **Commit SHA (completo)** | 7c8cf59bd7655cdf553cf54b541cd3900b9274ce |
| **Commit (curto)** | 7c8cf59 |
| **Mensagem** | Merge pull request #30 from indesconectavel/hotfix/ledger-userid-fallback |
| **Data do commit** | 2026-03-04 18:02:15 -0300 |
| **Branch** | main |
| **Deploy criado** | 2026-03-04 18:02:19 GMT-0300 (INCIDENTE-REGRESSAO-GAME) |

**Evidência:** O relatório INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md registra que o alias `goldeouro-player-git-main-goldeouro-admins-projects.vercel.app` indica build a partir da branch **main**, que o merge do PR #30 (commit **7c8cf59**) ocorreu em 2026-03-04 18:02:15 -0300 e que o deploy foi criado às 18:02:19. Conclusão documentada: *"o deployment atual em produção é o build do main pós-merge do PR #30 (commit 7c8cf59)"*.

---

## 3. O que não contém commit

- **vercel.json** (goldeouro-player): contém apenas `version`, `buildCommand`, `outputDirectory`, `framework`, `headers`, `rewrites` — nenhum campo de commit ou gitSourceRevision.
- **Build metadata / manifest no repositório:** Nenhum arquivo no escopo (goldeouro-player) grava o SHA do commit no build; não foi feita inspeção ao vivo da API do Vercel para obter `gitSourceRevision` do deployment ez1oc96t1.
- **dist/index-*.js:** Não há pasta `dist` versionada no repositório (build de produção é gerado no deploy). Não foi executado build local nesta auditoria.

---

## 4. Resumo

| Item | Valor |
|------|--------|
| **Deploy produção** | ez1oc96t1 |
| **Commit que gerou o deploy** | **7c8cf59** (Merge PR #30 — hotfix/ledger-userid-fallback) |
| **Branch** | main |
| **Fonte** | Documentação existente (INCIDENTE-REGRESSAO-GAME-READONLY-2026-03-04.md); não foi feita nova chamada à API Vercel. |

---

*Documento gerado em modo read-only. Nenhum deploy, repositório ou Vercel foi alterado.*
