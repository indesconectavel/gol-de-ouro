# H3.5q — Validação PR #91 — microajuste final `/game`

**Data:** 2026-05-16  
**Modo:** read-only — sem merge, deploy, commit ou alteração de código.  
**PR:** https://github.com/indesconectavel/gol-de-ouro/pull/91  
**Branch:** `fix/h3-5p-final-micro-adjustment` · HEAD `a12eb02`  
**Baseline produção:** `4e90e9b` · `index-CZEHatgf.js` (H3.5n)  
**Relacionado:** [H3-5P](H3-5P-MICROAJUSTE-VISUAL-FINAL-GAME-2026-05-16.md) · [H3-5O](H3-5O-VALIDACAO-VISUAL-FINAL-GAME-2026-05-16.md) · [H3-5N](H3-5N-MERGE-CONTROLADO-PR90-2026-05-16.md)

---

## 1. Resumo executivo

A PR #91 aplica **−5px Y uniforme** (490/710/980) sobre H3.5n, **sem alterar X**, goleiro idle, `JUMPS` ou CSS.

| Área | Resultado |
|------|-----------|
| Checks PR #91 | **Todos SUCCESS** · CLEAN / MERGEABLE |
| Diff | **Apenas** `layoutConfig.js` + relatório H3.5p |
| Build | **PASS** (local exit 0; CI verde) |
| Produção actual | `/meta` = **`4e90e9b`** · `/health` = **ok** · HTML = `index-CZEHatgf.js` |
| Bundle PR (coords) | **490 / 710 / 980** confirmados no código e bundle local |
| Visual pixel `/game` | **Não executado** (sem sessão — redirect login) |

**Decisão:** **PASS COM RESSALVAS** — aprovável para merge técnico; confirmação visual humana pós-deploy recomendada (~2–3px viewport vs H3.5n).

---

## 2. Checks PR #91

| Check | Resultado |
|-------|-----------|
| CI — Build e Auditoria | **SUCCESS** |
| CI — Verificação Backend | **SUCCESS** |
| Testes Automatizados (BE/FE/seg/perf) | **SUCCESS** |
| Segurança e Qualidade | **SUCCESS** |
| CodeQL · GitGuardian · Vercel | **SUCCESS** |
| Deploy Produção (workflow) | **SKIPPED** |

`mergeStateStatus`: **CLEAN** · `mergeable`: **MERGEABLE**

---

## 3. Diff validado

### Ficheiros alterados (2)

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-player/src/game/layoutConfig.js` | **−5px Y** em `TARGETS` e `BALL.START` |
| `docs/relatorios/H3-5P-MICROAJUSTE-VISUAL-FINAL-GAME-2026-05-16.md` | Documentação |

### Confirmações de escopo

| Regra | Diff PR #91 |
|-------|-------------|
| **X intacto** | ✅ Apenas linhas `y:` mudam (450/960/1470 mantidos) |
| **JUMPS intactos** | ✅ Bloco `GOALKEEPER` **fora** do diff |
| **Goleiro idle** | ✅ `(960, 690)` inalterado |
| **CSS** | ✅ Nenhum `game-shoot.css` / `game-scene.css` |
| **GameFinal.jsx** | ✅ Ausente do diff |
| **Backend / pipeline** | ✅ Ausente do diff |

### Tabela before / after (stage 1920×1080)

| Elemento | H3.5n (base PR) | PR #91 | Δ Y |
|----------|-----------------|--------|-----|
| TL / TR / C | y: **495** | y: **490** | −5 |
| BL / BR | y: **715** | y: **710** | −5 |
| BALL.START | y: **985** | y: **980** | −5 |
| Todos **X** | inalterados | inalterados | 0 |

**Distância TL↔BL:** 715−495 = 220 → 710−490 = **220** (mantida).

---

## 4. Build

| Ambiente | Resultado |
|----------|-----------|
| CI (GitHub Actions) | **SUCCESS** |
| Local (`a12eb02`) | **Exit 0** (~13s) |

| Artefacto | Hash |
|-----------|------|
| **JS (commit H3.5p / relatório)** | `index-q8gJxEfC.js` |
| **JS (rebuild local H3.5q)** | `index-C6XiPvjm.js`* |
| **CSS** | `index-D7hr6dPE.css` (**inalterado**) |

\*Rebuild local inclui `inject-build-info` com timestamp novo; **coordenadas 490/980** confirmadas em `index-C6XiPvjm.js`. Hash pode variar entre builds; conteúdo de layout é equivalente.

---

## 5. Estado produção

### `/meta`

```
gitCommit: 4e90e9b6f341fac0ba86921585da013d8401f341
```

**Confirmado:** produção ainda **H3.5n** (PR #91 **não** mergeada).

### `/health`

`status: ok` · `database: connected` · `mercadoPago: connected`

### HTML player

| Item | Valor |
|------|--------|
| JS servido | `index-CZEHatgf.js` |
| Coords activas em prod | **495 / 715 / 985** (`495` presente; `490` ausente) |

---

## 6. Resultado visual

### Sessão browser

| Passo | Resultado |
|-------|-----------|
| `www.goldeouro.lol/game` | Redirect → **login** (sem token) |
| Inspecção palco 1920×1080 | **Não realizada** |

### Análise esperada pós-merge (vs H3.5n)

Referência [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) / [H3-5O](H3-5O-VALIDACAO-VISUAL-FINAL-GAME-2026-05-16.md):

| Item | H3.5n (prod) | H3.5p esperado (após merge) |
|------|--------------|-----------------------------|
| Zonas superiores `top` bbox | ~**411px** (após cache H3.5n) | ~**406px** (−5px stage × ~0,48) |
| Eixo X (`left` C) | ~**439** | **439** (inalterado) |
| Bola | mais alta −25px vs k | **+5px** adicional vs n |
| Trave / goleiro / HUD | OK documentado | **Esperado OK** (sem diff CSS) |
| «Excesso de subida» | — | **Baixo risco** (apenas 5px; total −30px desde k) |

### Checklist visual (analítico)

| Critério | Status |
|----------|--------|
| Zonas levemente mais altas | **Esperado OK** |
| Bola proporcional | **Esperado OK** |
| Sem excesso de subida | **Esperado OK** (delta mínimo) |
| Trave / fundo | **OK** (inalterado) |
| Goleiro coerente | **OK** (690 idle) |
| HUD / Recarregar | **Não verificado** (auth) |
| Eixo X | **OK** (diff confirma) |

---

## 7. Riscos remanescentes

| ID | Risco | Mitigação |
|----|-------|-----------|
| R1 | Validação pixel sem sessão automatizada | Smoke humano pós-deploy com conta real |
| R2 | PWA/cache (`index-CZEHatgf.js`) | Hard refresh; confirmar `index-*` novo no Network |
| R3 | `JUMPS` não recalibrados | Monitorar animação defesa (pré-existente) |
| R4 | Hash JS varia entre builds Vite | Validar coords 490/980, não só nome do ficheiro |

**Regressão crítica:** nenhuma detectada em checks, diff ou análise estática.

---

## 8. Decisão

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| Checks + mergeability | **PASS** |
| Diff escopo estrito | **PASS** |
| X / JUMPS / CSS intactos | **PASS** |
| Build | **PASS** |
| Produção pré-merge | **PASS** (`4e90e9b`) |
| Visual pixel | **RESSALVA** |

**Recomendação:** merge após aceitação de ressalvas; smoke visual em `/game` pós-deploy confirmando `490/980` no bundle e ~5px de subida vs H3.5n sem drift lateral.

**Merge:** **não executado** (conforme instrução).

---

## Metodologia

- `gh pr view` / `gh pr checks` / `gh pr diff`
- `npm run build` (branch `a12eb02`)
- `Invoke-RestMethod` → `/meta`, `/health`
- Node import `layoutConfig.js`
- Grep bundle local `index-C6XiPvjm.js`
- HTTP → `www.goldeouro.lol` HTML + `index-CZEHatgf.js`
- MCP browser → tentativa `/game` (login)

**Sem alteração de código. Sem commit. Sem merge.**
