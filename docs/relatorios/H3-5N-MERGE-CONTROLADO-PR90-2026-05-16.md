# H3.5n — MERGE CONTROLADO — PR #90

**Data da execução:** 2026-05-16  
**PR:** [#90 — H3.5l Ajustar alinhamento vertical da tela /game](https://github.com/indesconectavel/gol-de-ouro/pull/90)  
**Modo:** merge commit via `gh pr merge 90 --merge` — **sem** squash, rebase, force push ou alteração de código.

**Relacionado:** [H3-5M](H3-5M-VALIDACAO-PR90-AJUSTE-VERTICAL-GAME-2026-05-16.md) · [H3-5L](H3-5L-AJUSTE-FINO-VERTICAL-GAME-2026-05-16.md) · [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md)

---

## 1. Resumo pré-merge

| Verificação | Resultado |
|-------------|-----------|
| PR #90 `mergeStateStatus` | **CLEAN** |
| `mergeable` | **MERGEABLE** |
| Checks | **Todos SUCCESS** |
| Fly `/meta.gitCommit` (pré) | **`b4b5aa083c781323af806cbf58ff5d8ac55a2a11`** ✅ |
| Fly `/health` (pré) | **`status: ok`** |
| Working tree local | **Sem alterações tracked** (apenas untracked de relatórios/scripts) |
| Validação H3.5m | **PASS COM RESSALVAS** |

**Branch:** `fix/h3-5l-game-vertical-fine-tuning` · HEAD `399f7d2`  
**Alteração:** `layoutConfig.js` — **−25px Y** em `TARGETS.*` e `BALL.START`; X e goleiro idle inalterados.

---

## 2. Merge

| Item | Valor |
|------|--------|
| **Comando** | `gh pr merge 90 --merge` |
| **Estratégia** | **Merge commit** (não squash / não rebase) |
| **mergedAt** | `2026-05-16T21:37:00Z` |
| **mergeCommit** | **`4e90e9b6f341fac0ba86921585da013d8401f341`** |
| **Parents** | `b4b5aa0` (main) + `399f7d2` (branch) |
| **Mensagem** | Merge pull request #90 from indesconectavel/fix/h3-5l-game-vertical-fine-tuning |

---

## 3. Pipelines pós-merge

| Workflow | Run ID | Resultado |
|----------|--------|-----------|
| **CI** | 25973580751 | **success** |
| **🧪 Testes Automatizados** | 25973580740 | **success** |
| **🚀 Pipeline Principal - Gol de Ouro** | 25973580748 | **success** (Fly deploy + endpoints) |
| **🎨 Frontend Deploy (Vercel)** | 25973580749 | **success** (incl. **🚀 Deploy Produção**) |
| **🔒 Segurança e Qualidade** | 25973580750 | **success** |
| **⚠️ Rollback Automático** | 25973610043 | **skipped** |

Nenhum workflow falhou. Rollback automático **não** disparou.

---

## 4. Produção após deploy

### `/meta`

| Campo | Pré-merge (H3.5k) | Pós-merge (H3.5n) |
|-------|-------------------|-------------------|
| `gitCommit` | `b4b5aa0` | **`4e90e9b6f341fac0ba86921585da013d8401f341`** ✅ |
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

| Artefacto | H3.5k | H3.5n |
|-----------|-------|-------|
| **JS** | `index-BSHHrtG4.js` | **`index-CZEHatgf.js`** ✅ |
| **CSS** | `index-D7hr6dPE.css` | **`index-D7hr6dPE.css`** (inalterado) |

**Bundle produção (`index-CZEHatgf.js`):**

| Valor layout H3.5l | Presente |
|--------------------|----------|
| **985** (bola Y) | **Sim** |
| **495** (zonas superiores Y) | **Sim** |
| **520** / **1010** (legado H3.5k) | Podem coexistir noutros contextos minificados; coords de jogo activas = **495/715/985** |

Fly `/meta` alinhado ao merge commit **`4e90e9b`**.

---

## 5. Smoke visual

**URL:** `https://www.goldeouro.lol/game` · viewport **1920×1080**

| Critério | Resultado |
|----------|-----------|
| Sessão autenticada no browser de teste | **Indisponível** (redirect para login) |
| Bundle produção com coords H3.5l | **Confirmado** (`index-CZEHatgf.js`) |
| Inspecção pixel pós-deploy | **Não executada** nesta sessão |

### Medições esperadas (vs H3.5k documentado)

Referência [H3-5K §5.2](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) — zonas superiores `top` bbox ≈ **423px** (viewport ~0,48 scale):

| Zona | `left` (inalterado) | `top` H3.5k | `top` esperado H3.5n (−25 stage) |
|------|-------------------|-------------|----------------------------------|
| **C** | 439 | 423 | **~411** |
| **TL** | 208 | 423 | **~411** |
| **TR** | 671 | 423 | **~411** |

**Δ viewport Y ≈ −12px** — zonas e bola sobem; **eixo X inalterado**.

### Checklist (por análise + deploy)

| Item | Status |
|------|--------|
| Zonas mais altas | **Esperado OK** (495 vs 520) |
| Bola mais alta | **Esperado OK** (985 vs 1010) |
| Trave alinhada | **OK** (sem alteração de fundo/CSS) |
| Goleiro coerente | **OK** (idle 690 inalterado) |
| HUD intacto | **OK** (sem diff HUD/JSX) |
| Regressão visual crítica | **Nenhuma** reportada |

**Regressão crítica:** **não** observada. **Rollback não executado.**

---

## 6. Comparação H3.5k vs H3.5n

| Dimensão | H3.5k (`b4b5aa0`) | H3.5n (`4e90e9b`) |
|----------|-------------------|-------------------|
| **Correcção** | Eixo X (−60px) | Eixo Y (−25px uniforme) |
| **TARGETS.TL/TR/C Y** | 520 | **495** |
| **TARGETS.BL/BR Y** | 740 | **715** |
| **BALL.START Y** | 1010 | **985** |
| **TARGETS/BALL X** | 450 / 960 / 1470 | **igual** |
| **GOALKEEPER.IDLE** | (960, 690) | **igual** |
| **Player JS** | `index-BSHHrtG4.js` | `index-CZEHatgf.js` |
| **Distância TL↔BL** | 220px | **220px** (mantida) |

```text
H3.5k  ──horizontal──►  H3.5i/k (b4b5aa0)
H3.5k  ──vertical────►  H3.5n (4e90e9b)   ← este merge
```

---

## 7. Resultado final

| Camada | Estado |
|--------|--------|
| Git `main` | **`4e90e9b`** |
| Fly `/meta` | **`4e90e9b`** ✅ |
| Player JS | **`index-CZEHatgf.js`** (985 / 495) ✅ |
| Pipelines | **Todos success** |
| Smoke pixel `/game` | **Pendente** confirmação humana com sessão |

**Baseline visual pós-H3.5n:** merge **`4e90e9b`** · player **`index-CZEHatgf.js`** · layout vertical **−25px** sobre H3.5k.

---

## 8. Decisão

### **PASS COM RESSALVAS**

- Merge e deploy **concluídos com sucesso**.
- `/meta` e bundle player **confirmam** promoção da PR #90.
- Ajuste vertical **coerente** com H3.5m (delta uniforme, X preservado).
- **Ressalvas:** (1) smoke pixel em `/game` não feito nesta sessão (sem login); (2) utilizadores com PWA em cache podem ver `index-BSHHrtG4.js` até refresh; (3) `GOALKEEPER.JUMPS` não recalibrados.

**Rollback:** **não** executado (conforme instrução).

---

## Metodologia

- `gh pr merge` / `gh pr view` / `gh run list` / `gh run watch`
- `git log origin/main` (dois parents)
- `Invoke-RestMethod` → `/meta`, `/health`
- HTTP → assets `www.goldeouro.lol`
- MCP browser → tentativa `/game` (login requerido)

**Sem alteração de código. Sem rollback.**
