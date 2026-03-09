# Atualização da branch do PR — Patch CI (2026-03-06)

**Data:** 2026-03-06

---

## Objetivo

Incluir o commit do patch de CI (`b0448dc`) na branch `release/frontend-player-demo-2026-03-06` para destravar os checks do PR e permitir revalidação e merge.

---

## 1) Branch atualizada?

**Sim.** A branch `release/frontend-player-demo-2026-03-06` foi atualizada via cherry-pick do commit `b0448dc9a7270c5b3c30e15fe2be02fb62baeef9`, gerando o commit `1f633be` na branch, e o push para `origin` foi concluído (ref: `200b416..1f633be`).

---

## 2) Cherry-pick aplicado?

**Sim.** O cherry-pick foi aplicado sem conflito. Commit resultante na branch: `1f633be` (fix(ci): frontend-deploy - nao bloquear PR por npm audit em devDeps antigas). Alterações: `.github/workflows/frontend-deploy.yml` e os dois relatórios em `docs/relatorios/`.

---

## 3) Push concluído?

**Sim.** `git push origin release/frontend-player-demo-2026-03-06` retornou sucesso. A branch remota aponta para `1f633be`.

---

## 4) Checks rerodando?

**Sim.** Imediatamente após o push, os workflow runs do PR #31 foram disparados e estavam em estado **in_progress**:
- CI  
- 🎨 Frontend Deploy (Vercel)  
- 🔒 Segurança e Qualidade  

O job **🧪 Testes Frontend** (dentro do Frontend Deploy) deve passar com o patch aplicado, pois o step de `npm audit` não falha mais o job.

---

## 5) Pronto para aguardar merge?

**Sim.** O PR #31 contém agora os 4 commits (3 de frontend + 1 de CI). Os checks estão rodando; quando todos passarem, o PR estará pronto para merge em `main` conforme as regras do repositório (reviews, branch protection).

---

## Resumo dos passos

| Passo | Resultado |
|-------|-----------|
| 1 – Gate | Branch remota existe; commit b0448dc existe; working tree tratada (stash) |
| 2 – Checkout + cherry-pick | Checkout em release/frontend-player-demo-2026-03-06; cherry-pick aplicado → 1f633be |
| 3 – Push | Push para origin concluído |
| 4 – Revalidação | PR #31 recebeu o commit; runs in_progress |
| 5 – Restaurar contexto | Checkout de volta para hotfix/financeiro-v1-stabilize |

---

## Entregas

- `docs/relatorios/pr-frontend-demo-ci-update-gate.json`
- `docs/relatorios/pr-frontend-demo-ci-update-push.json`
- `docs/relatorios/pr-frontend-demo-ci-update-status.json`

---

## PR

- **Número:** 31  
- **Título:** fix(player): withdraw endpoint fix + deposit demo simplification  
- **URL:** https://github.com/indesconectavel/gol-de-ouro/pull/31  

Aguardar conclusão dos workflow runs e, em seguida, realizar o merge conforme o processo do time.
