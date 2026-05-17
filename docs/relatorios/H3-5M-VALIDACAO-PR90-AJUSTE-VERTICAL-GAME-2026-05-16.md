# H3.5m — Validação visual — PR #90 ajuste vertical `/game`

**Data:** 2026-05-16  
**Modo:** read-only — sem merge, deploy manual, commit ou alteração de código.  
**PR:** https://github.com/indesconectavel/gol-de-ouro/pull/90  
**Branch:** `fix/h3-5l-game-vertical-fine-tuning` · HEAD `399f7d2`  
**Baseline produção (pré-merge PR #90):** `/meta.gitCommit` = **`b4b5aa0`** (H3.5k) · player `index-BSHHrtG4.js`  
**Relacionado:** [H3-5L](H3-5L-AJUSTE-FINO-VERTICAL-GAME-2026-05-16.md) · [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) · [H3-5J](H3-5J-VALIDACAO-PR89-GAME-GEOMETRIA-2026-05-16.md)

---

## 1. Resumo executivo

A PR #90 aplica **−25px uniformes em Y** nas cinco zonas (`TARGETS`) e na bola (`BALL.START`), **sem alterar X**, goleiro, CSS ou backend.

| Área | Resultado |
|------|-----------|
| Checks PR #90 | **Todos SUCCESS** |
| Build (local + CI) | **PASS** — `index-B-LBIk_X.js` |
| Produção `/meta` / `/health` | **OK** — ainda **`b4b5aa0`** (PR não mergeada) |
| Geometria (código) | **PASS** — delta Y=25; espaçamento TL↔BL mantido (220px) |
| Visual pixel `/game` (bundle PR) | **Ressalva** — sessão browser indisponível; preview Vercel **404** |
| Funcional 5 zonas (bundle PR) | **Não testado** (auth) |
| Comparação vs print H3.5k | **Coerente** — deslocamento esperado **~12px para cima** no viewport (~0,48 scale) |

**Decisão:** **PASS COM RESSALVAS** — aprovável para merge técnico; confirmar visualmente em produção após deploy (zonas/bola mais altas, eixo X inalterado).

---

## 2. Checks PR #90

| Check | Resultado |
|-------|-----------|
| CI — Build e Auditoria | **SUCCESS** |
| CI — Verificação Backend | **SUCCESS** |
| Testes Automatizados (BE/FE/segurança/performance) | **SUCCESS** |
| Segurança e Qualidade | **SUCCESS** |
| CodeQL · GitGuardian | **SUCCESS** |
| Vercel | **SUCCESS** |
| Deploy Produção (workflow) | **SKIPPED** |

`mergeStateStatus`: **CLEAN** · `mergeable`: **MERGEABLE**

---

## 3. Build

| Ambiente | Comando | Resultado |
|----------|---------|-----------|
| Local (branch `399f7d2`) | `cd goldeouro-player && npm run build` | **Exit 0** (~22s) |
| CI | GitHub Actions PR | **SUCCESS** |

| Artefacto | Hash |
|-----------|------|
| **JS** | `index-B-LBIk_X.js` |
| **CSS** | `index-D7hr6dPE.css` (inalterado) |

**Bundle PR:** contém valores **495**, **715**, **985** (grep). Produção actual (`index-BSHHrtG4.js`) ainda reflecte **520 / 740 / 1010** até merge.

---

## 4. Ambiente validado

| Ambiente | URL / commit | Uso |
|----------|--------------|-----|
| **Produção Fly** | `goldeouro-backend-v2.fly.dev` | `/meta`, `/health` |
| **Produção player** | `www.goldeouro.lol` | `index-BSHHrtG4.js` · **`b4b5aa0`** |
| **Vite dev** | `http://localhost:5175` | Código `399f7d2` — login **falhou** |
| **Vercel preview PR** | `…77fcf6…vercel.app` | **`/game` → 404** |
| **Análise estática** | `layoutConfig.js` | Antes/depois Y |

---

## 5. Produção atual (pré-merge PR #90)

### `/meta`

```json
{
  "gitCommit": "b4b5aa083c781323af806cbf58ff5d8ac55a2a11",
  "environment": "production",
  "version": "1.2.1"
}
```

### `/health`

```json
{
  "status": "ok",
  "database": "connected",
  "mercadoPago": "connected"
}
```

**Confirmado:** produção em **H3.5k** (`b4b5aa0`); PR #90 **ainda não** em `main`/Fly.

---

## 6. Resultado visual

### 6.1 Modelo de coordenadas (stage 1920×1080)

| Elemento | H3.5k (antes) | PR #90 (depois) | Δ Y |
|----------|---------------|-----------------|-----|
| TL / TR / C | y = **520** | y = **495** | **−25** |
| BL / BR | y = **740** | y = **715** | **−25** |
| Bola `START` | y = **1010** | y = **985** | **−25** |
| Todos **X** | 450 / 960 / 1470 / 960 | **igual** | **0** |
| Goleiro idle | (960, **690**) | **igual** | **0** |

**Distância vertical entre fileiras:** 740−520 = **220** → 715−495 = **220** (**proporção mantida**).

### 6.2 Viewport esperado (referência H3.5k)

Medições documentadas em [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) (pós-H3.5i, pré-H3.5l), viewport ~1920×1080 efectivo, `scale ≈ 0,48`:

| Zona | `left` (H3.5k) | `top` bbox (H3.5k) | `top` esperado PR #90 (−25 stage) |
|------|----------------|---------------------|-----------------------------------|
| **TL** | 208 | **423** | **~411** |
| **C** | 439 | **423** | **~411** |
| **TR** | 671 | **423** | **~411** |

**Δ viewport Y ≈ −12px** (25 × 0,48) — zonas e bola sobem na mesma proporção visual.

### 6.3 Comparação com feedback / print anterior

| Observação (contexto H3.5l) | Avaliação PR #90 |
|-----------------------------|------------------|
| Eixo X já correcto (H3.5k) | **Não alterado** ✅ |
| Zonas «um pouco baixas» vs trave | **−25px Y** endereça o pedido ✅ |
| Bola deve subir na mesma proporção | **Mesmo ΔY (−25)** ✅ |
| Trave / fundo centralizados | **Sem alteração** de `scene-bg` / CSS ✅ |
| Goleiro idle | **Inalterado** (690) — coerente com pedido ✅ |

### 6.4 Browser (limitação)

- `www.goldeouro.lol/game`: redireccionou para **login** (sessão expirada).
- `localhost:5175`: login **não concluiu** (API dev `localhost:8080`).
- **Inspecção pixel do bundle PR #90 em `/game`:** não realizada nesta sessão.

---

## 7. Resultado funcional

| Teste | Ambiente | Resultado |
|-------|----------|-----------|
| Clique 5 zonas | Bundle PR | **Não testado** (sem auth) |
| Bola → alvo | Lógica `GameFinal` inalterada | **Risco baixo** (só Y em `layoutConfig`) |
| HUD / overlay | Sem diff CSS/JSX | **OK** (por omissão de alteração) |
| Regressão mecânica | Produção `b4b5aa0` | **Não re-testada** nesta sessão |

**Nota:** `handleShoot` usa `getTargetPosition` + offsets — hitboxes movem com os novos Y; comportamento de API inalterado.

---

## 8. Comparação antes / depois

```text
                    H3.5k (produção)          PR #90 (código)
                    ─────────────────         ───────────────
Zona C (stage)      (960, 520)                (960, 495)  ↑25px
Zona BL (stage)     (450, 740)                (450, 715)  ↑25px
Bola (stage)        (960, 1010)               (960, 985)  ↑25px
Goleiro idle        (960, 690)                (960, 690)  =
Eixo X zonas        480 / 960 / 1440*         igual       =
                    *com offsets ±30
```

**Print / baseline visual:** screenshots H3.5k ([H3-5K §5](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md)) mostram alinhamento horizontal correcto; feedback pós-deploy indicou necessidade de **subir** zonas/bola — PR #90 implementa exactamente **−25px Y** uniforme.

---

## 9. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| P1 | Média | Preview Vercel PR → **404** (monorepo; igual H3.5e/j) |
| P2 | Média | **Sem sessão** para smoke visual/funcional do bundle PR |
| P3 | Baixa | Produção ainda **`b4b5aa0`** — comparação pixel só após merge |
| P4 | Info | `GOALKEEPER.JUMPS` não ajustados (escopo H3.5l) |
| P5 | Info | `1010` pode aparecer no bundle minificado por outros contextos; coords de jogo usam **985** |

**Nenhuma regressão crítica detectada** em checks, build ou análise estática.

---

## 10. Decisão

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| Checks PR #90 | **PASS** |
| Build | **PASS** |
| Delta Y uniforme (−25) | **PASS** |
| Eixo X preservado | **PASS** |
| Visual pixel bundle PR | **RESSALVA** |
| Funcional 5 zonas (PR) | **RESSALVA** |
| Comparação vs H3.5k / print | **Coerente** (esperado ↑~12px viewport) |

**Recomendação:** merge após aceitação de ressalvas; **smoke visual obrigatório** em `www.goldeouro.lol/game` pós-deploy (confirmar zonas/bola mais altas sem descentrar X).

**Merge:** **não executado** (conforme instrução).

---

## Metodologia

- `gh pr view` / `gh pr checks` / `gh pr diff`
- `npm run build` (local, branch `399f7d2`)
- `Invoke-RestMethod` → `/meta`, `/health`
- Node import `layoutConfig.js` (antes/depois)
- Grep bundle `index-B-LBIk_X.js`
- MCP browser: tentativa `www.goldeouro.lol`, `localhost:5175`, preview Vercel
- Referência medições [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md)

**Sem merge. Sem commit. Sem alteração de código.**
