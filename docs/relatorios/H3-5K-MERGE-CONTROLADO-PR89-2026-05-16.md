# H3.5k — MERGE CONTROLADO — PR #89

**Data da execução:** 2026-05-16  
**PR:** [#89 — H3.5i Corrigir geometria visual da tela /game](https://github.com/indesconectavel/gol-de-ouro/pull/89)  
**Modo:** merge commit via `gh pr merge 89 --merge` — **sem** squash, rebase, force push ou alteração de código.

**Relacionado:** [H3-5I](H3-5I-CORRECAO-GEOMETRICA-GAME-2026-05-16.md) · [H3-5J](H3-5J-VALIDACAO-PR89-GAME-GEOMETRIA-2026-05-16.md) · [H3-5H](H3-5H-FORENSE-GEOMETRICA-GAME-2026-05-16.md)

---

## 1. Resumo pré-merge

| Verificação | Resultado |
|-------------|-----------|
| PR #89 `mergeStateStatus` | **CLEAN** |
| `mergeable` | **MERGEABLE** |
| Checks | **Todos SUCCESS** (CI, testes, segurança, Vercel, CodeQL, GitGuardian) |
| Fly `/meta.gitCommit` (pré) | **`1a2f8d3dc499bb9d63fd132f474f4f148383cf3d`** ✅ |
| Fly `/health` (pré) | **`status: ok`** |
| Working tree local | **Sem alterações staged** em ficheiros tracked (apenas untracked de relatórios/scripts) |
| Validação H3.5j | **PASS COM RESSALVAS** |

**Branch:** `fix/h3-5i-game-geometry-alignment` · HEAD `69085ef`  
**Alteração:** `layoutConfig.js` (−60px X em `TARGETS` e `BALL.START`) + relatório H3.5i.

---

## 2. Merge

| Item | Valor |
|------|--------|
| **Comando** | `gh pr merge 89 --merge` |
| **Estratégia** | **Merge commit** (não squash / não rebase) |
| **mergedAt** | `2026-05-16T18:16:47Z` |
| **mergeCommit** | **`b4b5aa083c781323af806cbf58ff5d8ac55a2a11`** |
| **Parents** | `1a2f8d3` (main) + `69085ef` (branch) |
| **Mensagem** | Merge pull request #89 from indesconectavel/fix/h3-5i-game-geometry-alignment |

---

## 3. Pipelines pós-merge

| Workflow | Run ID | Resultado |
|----------|--------|-----------|
| **CI** | 25969324173 | **success** |
| **🧪 Testes Automatizados** | 25969324167 | **success** |
| **🚀 Pipeline Principal - Gol de Ouro** | 25969324161 | **success** (Fly deploy + validação endpoints) |
| **🎨 Frontend Deploy (Vercel)** | 25969324178 | **success** (incl. **🚀 Deploy Produção**) |
| **🔒 Segurança e Qualidade** | 25969324172 | **success** |
| **⚠️ Rollback Automático** | 25969348903 | **skipped** |

Nenhum workflow falhou. Rollback automático **não** disparou.

---

## 4. Produção após deploy

### `/meta`

| Campo | Pré-merge | Pós-merge |
|-------|-----------|-----------|
| `gitCommit` | `1a2f8d3` | **`b4b5aa083c781323af806cbf58ff5d8ac55a2a11`** ✅ |
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

| Artefacto | Pré-merge (H3.5g) | Pós-merge (H3.5k) |
|-----------|-------------------|-------------------|
| **JS** | `index-ByS331OU.js` / `index-Dk25r7n1.js` (dev) | **`index-BSHHrtG4.js`** ✅ |
| **CSS** | `index-D7hr6dPE.css` | **`index-D7hr6dPE.css`** (inalterado) |

**Bundle produção (`index-BSHHrtG4.js`):**

| Coordenada legada | Presente |
|-------------------|----------|
| `1020` | **Não** |
| `1530` | **Não** |
| `960` / `1470` | **Sim** |

Backend Fly e `/meta` alinhados ao merge commit **`b4b5aa0`**.

---

## 5. Smoke visual

**URL:** `https://www.goldeouro.lol/game` · viewport **1920×1080** · sessão autenticada.

### 5.1 Cache / PWA

Primeira carga após deploy manteve posições antigas das zonas (centro C ≈ **492px** viewport — bundle em cache). Após navegação com reload efectivo (`?v=h35k-b4b5aa0`), medições reflectem o **novo** `index-BSHHrtG4.js`.

### 5.2 Medições pós-cache (novo bundle)

| Zona | `left` (bbox) | Centro X viewport | Δ vs pré-merge (~492 centro C) |
|------|---------------|-------------------|--------------------------------|
| **TL** | 208 | **232** | ≈ −29px |
| **C** | 439 | **463** | ≈ −29px |
| **TR** | 671 | **695** | ≈ −29px |

**Simetria:** (232 + 695) / 2 = **463,5** ≈ centro C (**463**) — **OK**.

Deslocamento ≈ **−29px** no viewport actual é consistente com **−60px** no stage 1920×1080 com `scale ≈ 0,48`.

### 5.3 Checklist visual

| Critério | Resultado |
|----------|-----------|
| Zona C alinhada com goleiro / eixo central | **OK** (inspeção + medição) |
| TL/TR simétricas | **OK** |
| BL/BR (estrutura) | **OK** (mesmo padrão de offsets) |
| Bola no eixo central | **OK** |
| HUD (saldo, chutes, menu) | **OK** |
| Fundo / trave coerentes | **OK** (screenshot pós-deploy) |

### 5.4 Ressalvas smoke

| ID | Nota |
|----|------|
| R1 | **PWA/cache:** utilizadores podem ver bundle antigo até hard refresh; documentar se houver tickets de “zonas desalinhadas” pós-deploy. |
| R2 | **`GOALKEEPER.JUMPS`** não foram alterados na PR — monitorar animação de defesa (H3.5i/j). |
| R3 | Overlay «Gire o celular» continua no DOM em alguns viewports landscape limítrofes (comportamento pré-existente). |

**Regressão crítica:** **nenhuma** observada. **Rollback não executado** (conforme instrução).

---

## 6. Resultado final

| Camada | Estado |
|--------|--------|
| Git `main` | **`b4b5aa0`** |
| Fly `/meta` | **`b4b5aa0`** ✅ |
| Player JS | **`index-BSHHrtG4.js`** com coords **960** ✅ |
| Pipelines | **Todos success** |
| Smoke `/game` | **Alinhamento melhorado** vs baseline `1a2f8d3`; simetria mantida |

**Baseline visual pós-H3.5k:** merge commit **`b4b5aa0`** · player **`index-BSHHrtG4.js`**.

---

## 7. Decisão

### **PASS COM RESSALVAS**

- Merge e deploy **concluídos com sucesso**.
- Produção (`/meta`, `/health`, bundle JS) **confirma** promoção da correção geométrica.
- Smoke visual em produção **positivo** após bundle actualizado.
- **Ressalvas:** cache PWA no cliente; `JUMPS` não recalibrados; validação mobile fullscreen recomendada em monitorização ordinária.

**Não foi executado rollback automático nem manual.**

---

## Metodologia

- `gh pr view` / `gh pr merge 89 --merge` / `gh run list` / `gh run watch`
- `git log origin/main` (dois parents)
- `Invoke-RestMethod` → `/meta`, `/health`
- HTTP → `www.goldeouro.lol` assets
- MCP browser → `/game` (medições `getBoundingClientRect` via bounding box)

**Sem alteração de código. Sem rollback.**
