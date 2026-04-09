# Saneamento PR #56 — antes da validação — 2026-04-09

## 1. Resumo executivo

Foi aplicada **cirurgia mínima** no branch `fix/restaurar-baseline-player-2026-04-09`: remoção de ficheiros que não pertenciam à baseline funcional ou que eram lixo técnico, entrada em `.gitignore` para `dev-dist`, ajuste do ficheiro de backup que importava assets removidos, e **correção do alerta CodeQL** `js/insecure-randomness` em `analytics.js` (substituição de `Math.random()` por `crypto.getRandomValues` na geração do id de sessão).

**Preservado intencionalmente:** rota `/game` → `GameFinal`, gates de banner, `vite.config.ts` com `VITE_SHOW_VERSION_BANNER`, `vercel.json` sem `cleanUrls` (não alterado neste commit).

---

## 2. Arquivos extras identificados

| Caminho | Motivo |
|---------|--------|
| `goldeouro-player/src/services/withdrawService.js` | Não referenciado pela `Withdraw.jsx` da baseline; herdado da linha `main`. |
| `goldeouro-player/dev-dist/registerSW.js` | Artefacto Vite PWA dev; não deve ser versionado. |
| `goldeouro-player/src/assets/golden-goal.png`, `golden-victory.png` | Ficheiros de texto com extensão `.png` (placeholders inválidos). |
| `goldeouro-player/src/assets/ganhou.png`, `goool.png` | Não usados por `GameFinal.jsx` (baseline ativa); apenas por cópia de backup / histórico. |

---

## 3. O que foi removido

- **`withdrawService.js`** — serviço morto relativamente ao fluxo actual da página de saque (baseline usa `apiClient` + `API_ENDPOINTS` directamente).
- **`dev-dist/registerSW.js`** — removido do controlo de versões; pasta coberta por `.gitignore`.
- **Quatro assets** listados acima — ruído ou placeholders; `GameFinal.jsx` continua a usar `gol_normal.png`, `ganhou_5.png`, `ganhou_100.png`, `gol_de_ouro.png`, etc.

**Ajuste em ficheiro mantido:** `GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx` — imports dos PNG removidos substituídos por assets reais da baseline (`gol_normal`, `ganhou_5`, `gol_de_ouro`) para não deixar referências quebradas se o ficheiro for analisado no futuro.

---

## 4. O que foi preservado

- Comportamento de **`App.jsx`**, **`GameFinal.jsx`**, **`VersionBanner.jsx` / `VersionWarning.jsx`**, **`vite.config.ts`**, **`vercel.json`** (sem `cleanUrls`, rotas com `filesystem` + fallback SPA).
- **Backend** — sem alterações.
- Nenhuma alteração a aliases, Vercel ou produção fora do repositório.

---

## 5. Estado do alinhamento com `2785aae`

Após o commit de saneamento **chore(player): limpar extras e preparar baseline para validação**, o diff **`2785aae..HEAD`** restrito a `goldeouro-player/` ficou:

```text
 goldeouro-player/.gitignore                                     |  3 +++
 .../src/pages/GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx      |  7 ++++---
 goldeouro-player/src/utils/analytics.js                         | 10 +++++++++-
 3 files changed, 16 insertions(+), 4 deletions(-)
```

| Ficheiro | Motivo da diferença |
|----------|---------------------|
| `.gitignore` | **Intencional** — ignorar `dev-dist/` (não existia em `2785aae`). |
| `GameFinal_BACKUP_*.jsx` | **Intencional** — imports ajustados após remoção de PNGs placeholder. |
| `analytics.js` | **Intencional** — `2785aae` não contém este ficheiro; foi introduzido no ramo de restauro; agora sem `Math.random` na sessão (CodeQL). |

**Conclusão:** paridade com a árvore `goldeouro-player` de **`2785aae`** para ficheiros partilhados está **essencialmente alinhada**; só restam estes três deltas justificáveis.

---

## 6. Diagnóstico do CodeQL

- **Alerta:** [#53](https://github.com/indesconectavel/gol-de-ouro/security/code-scanning/53) (aberto no merge do PR #56).
- **Regra:** `js/insecure-randomness` (CWE-338).
- **Local original:** `goldeouro-player/src/utils/analytics.js` — uso de `Math.random()` ao gerar sufixo do id de sessão em `sessionStorage`.
- **Classificação:** problema **real** segundo o modelo CodeQL (uso de PRNG fraco num identificador de sessão enviado em eventos de analytics). Impacto operacional limitado (não é geração de password), mas o check de segurança falha até corrigir ou dispensar.

---

## 7. Correção aplicada no CodeQL

- **Alteração:** geração do id de sessão com `crypto.getRandomValues` (browser) quando disponível; fallback sem `Math.random()` (`Date.now()` + `performance.now()`).
- **Objectivo:** satisfazer a regra sem mudar o contrato de `track()` / `sendBeacon`.

Recomenda-se rever no próximo push do PR se o check **CodeQL** passa a **SUCCESS** (ou se surge novo alerta noutro ficheiro).

---

## 8. Branch pronto para validação?

- **CI / build local:** `npm ci` neste ambiente Windows falhou com **EPERM** em `node_modules` (já documentado noutros relatórios); a validação de instalação deve ser feita no **GitHub Actions** (Linux).
- **Estruturalmente:** alterações são pequenas, focadas e reversíveis; adequadas para preview Vercel e QA no browser.

---

## 9. Próximo passo

1. Push do branch e verificação dos checks (em especial **CodeQL** e **Frontend**).
2. Smoke manual em `/`, `/game`, `/dashboard`, `/register` no preview.
3. Merge para `main` quando a equipa aceitar o risco residual (diff vs `2785aae` não nulo para ficheiros históricos/backups).

---

## Saída final obrigatória

**PR #56 SANEADO — PRONTO PARA VALIDAÇÃO**

*(Revalidar no GitHub após push: se CodeQL continuar em falha por outro motivo, reclassificar para **AINDA BLOQUEADO**.)*
