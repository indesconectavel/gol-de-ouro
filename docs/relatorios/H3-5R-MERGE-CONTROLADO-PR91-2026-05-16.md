# H3.5r — MERGE CONTROLADO — PR #91

**Data da execução:** 2026-05-16 / 2026-05-17 (UTC)  
**PR:** [#91 — H3.5p Microajuste visual final da tela /game](https://github.com/indesconectavel/gol-de-ouro/pull/91)  
**Modo:** merge commit via `gh pr merge 91 --merge` — **sem** squash, rebase, force push ou alteração de código.

**Relacionado:** [H3-5Q](H3-5Q-VALIDACAO-PR91-MICROAJUSTE-FINAL-GAME-2026-05-16.md) · [H3-5P](H3-5P-MICROAJUSTE-VISUAL-FINAL-GAME-2026-05-16.md) · [H3-5N](H3-5N-MERGE-CONTROLADO-PR90-2026-05-16.md) · [H3-5O](H3-5O-VALIDACAO-VISUAL-FINAL-GAME-2026-05-16.md)

---

## 1. Resumo pré-merge

| Verificação | Resultado |
|-------------|-----------|
| PR #91 `mergeStateStatus` | **CLEAN** |
| `mergeable` | **MERGEABLE** |
| Checks | **Todos SUCCESS** |
| Fly `GET /meta.gitCommit` (pré) | **`4e90e9b6f341fac0ba86921585da013d8401f341`** ✅ |
| Fly `/health` (pré) | **`status: ok`** |
| Player HTML (pré) | `index-CZEHatgf.js` |
| Working tree local | **Sem alterações tracked** (apenas untracked de relatórios/scripts) |
| Validação H3.5q | **PASS COM RESSALVAS** |

**Branch:** `fix/h3-5p-final-micro-adjustment` · HEAD `8872137`  
**Alteração:** `layoutConfig.js` — **−5px Y** (490/710/980); X, `JUMPS` e CSS inalterados.

---

## 2. Merge

| Item | Valor |
|------|--------|
| **Comando** | `gh pr merge 91 --merge` |
| **Estratégia** | **Merge commit** (não squash / não rebase) |
| **mergedAt** | `2026-05-17T00:54:02Z` |
| **mergeCommit** | **`7156ea2a9a0e04afe53f00b875b3474b012f70cb`** |
| **Parents** | `4e90e9b` (main) + `8872137` (branch) |
| **Mensagem** | Merge pull request #91 from indesconectavel/fix/h3-5p-final-micro-adjustment |

---

## 3. Pipelines pós-merge

| Workflow | Run ID | Resultado |
|----------|--------|-----------|
| **CI** | 25977370002 | **success** |
| **🧪 Testes Automatizados** | 25977370010 | **success** |
| **🚀 Pipeline Principal - Gol de Ouro** | 25977370015 | **success** (Fly deploy) |
| **🎨 Frontend Deploy (Vercel)** | 25977370011 | **success** (incl. deploy produção) |
| **🔒 Segurança e Qualidade** | 25977370013 | **success** |
| **⚠️ Rollback Automático** | (trigger pós-merge) | **skipped** |

Nenhum workflow falhou. Rollback automático **não** disparou.

---

## 4. Produção após deploy

### `/meta` (Fly `goldeouro-backend-v2`)

| Campo | Pré-merge (H3.5n) | Pós-merge (H3.5r) |
|-------|-------------------|-------------------|
| `gitCommit` | `4e90e9b` | **`7156ea2a9a0e04afe53f00b875b3474b012f70cb`** ✅ |
| `version` | 1.2.1 | 1.2.1 |
| `environment` | production | production |

### `/health`

```json
{
  "status": "ok",
  "database": "connected",
  "mercadoPago": "connected"
}
```

### Player (`www.goldeouro.lol`)

| Artefacto | H3.5n | H3.5r |
|-----------|-------|-------|
| **JS** | `index-CZEHatgf.js` | **`index-CZOAOs6A.js`** ✅ |
| **CSS** | `index-D7hr6dPE.css` | **`index-D7hr6dPE.css`** (inalterado) |

### Coordenadas no bundle de produção

| Coord (stage) | H3.5n | H3.5r (bundle) |
|---------------|-------|----------------|
| Zonas superiores Y | 495 | **490** presente |
| Zonas inferiores Y | 715 | **710** (via layout) |
| Bola Y | 985 | **980** presente |
| Literal `495` em TARGETS | sim | **ausente** |

\*O literal `985` pode ainda aparecer noutros contextos do bundle minificado; coords de layout **490/980** confirmadas.

---

## 5. Smoke visual

### Sessão browser

| Passo | Resultado |
|-------|-----------|
| `https://www.goldeouro.lol/game` | Redirect → **login** (`/`) |
| Inspecção palco 1920×1080 | **Não realizada** (sem token) |

### Checklist (analítico + deploy)

| Critério | Status |
|----------|--------|
| Zonas ~5px mais altas vs H3.5n | **Esperado OK** (490 vs 495) |
| Bola ~5px mais alta | **Esperado OK** (980 vs 985) |
| Sem excesso de subida | **Esperado OK** (delta mínimo −5px) |
| Trave alinhada | **OK** (sem diff CSS) |
| Goleiro coerente | **OK** (idle 960,690; JUMPS inalterados) |
| HUD / Recarregar | **Não verificado** (auth) |
| Eixo X inalterado | **OK** (diff H3.5q) |

**Regressão visual crítica:** nenhuma detectada ao nível de artefactos/deploy. **Rollback:** não executado (conforme instrução).

---

## 6. Comparação H3.5n vs H3.5r

| Dimensão | H3.5n (`4e90e9b`) | H3.5r (`7156ea2`) | Δ |
|----------|-------------------|-------------------|---|
| Merge / meta | PR #90 | PR #91 | microajuste Y |
| Bundle JS | `index-CZEHatgf.js` | `index-CZOAOs6A.js` | novo hash Vite |
| TARGETS TL/TR/C `y` | 495 | **490** | **−5** |
| TARGETS BL/BR `y` | 715 | **710** | **−5** |
| BALL.START `y` | 985 | **980** | **−5** |
| TARGETS `x` (C) | 960 | 960 | **0** |
| CSS | `index-D7hr6dPE.css` | igual | **0** |
| `top` bbox C (estimado) | ~**411** px | ~**406** px | ~**−5** px viewport |

```text
H3.5k (520)  ──−25px──►  H3.5n (495)  ──−5px──►  H3.5r (490)
```

**Evolução vertical total desde H3.5k:** **−30px** em zonas superiores (520→490).

---

## 7. Resultado final

| Área | Resultado |
|------|-----------|
| Merge controlado | **Concluído** |
| Pipelines | **Todos success** |
| Fly `/meta` | **`7156ea2`** ✅ |
| Fly `/health` | **ok** ✅ |
| Player bundle | **`index-CZOAOs6A.js`** + coords **490/980** ✅ |
| Smoke pixel `/game` | **Não executado** (login) |

---

## 8. Decisão

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| Merge + pipelines | **PASS** |
| Produção `/meta` + bundle | **PASS** |
| Coordenadas no JS | **PASS** |
| Smoke visual autenticado | **RESSALVA** |

**Recomendação:** validação humana rápida em `/game` com conta real (confirmar ~5px de subida vs sessão H3.5n, sem drift lateral). Hard refresh se PWA servir `index-CZEHatgf.js`.

**Rollback automático:** não aplicado. Em caso de regressão crítica futura: documentar apenas (sem rollback automático nesta fase).

---

## Metodologia

- `gh pr view` / `gh pr merge 91 --merge`
- `gh run watch` (Pipeline Principal, Frontend Vercel)
- `GET https://goldeouro-backend-v2.fly.dev/meta` e `/health`
- HTTP → `www.goldeouro.lol` HTML + `index-CZOAOs6A.js`
- MCP browser → `/game` (redirect login)

**Sem alteração de código local. Sem rollback.**
