# H3.5g — MERGE CONTROLADO — PR #88

**Data da execução:** 2026-05-16  
**PR:** [#88 — H3.5d Corrigir alinhamento visual da tela /game](https://github.com/indesconectavel/gol-de-ouro/pull/88)  
**Modo:** merge commit via GitHub CLI — **sem** squash, rebase, force push ou deploy manual local.

**Relacionado:** [H3-5D correção](H3-5D-CORRECAO-VISUAL-GAME-PREVIEW-2026-05-16.md) · [H3-5E validação](H3-5E-VALIDACAO-VISUAL-PR88-GAME-2026-05-16.md) · [H3-5C forense](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md)

---

## 1. Estado pré-merge

| Verificação | Resultado |
|-------------|-----------|
| PR #88 `state` | **OPEN** → merge executado |
| `mergeable` | **MERGEABLE** |
| `mergeStateStatus` | **CLEAN** |
| Checks | **Todos SUCCESS** (CI, testes, segurança, Vercel, CodeQL, GitGuardian) |
| `origin/main` (pré) | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| Fly `/meta.gitCommit` | **`460ba4e`** |
| Fly `/health` | **`status: ok`** · `database: connected` · `mercadoPago: connected` |

---

## 2. SHA anterior (baseline H3.5)

| Camada | SHA |
|--------|-----|
| **Git `main`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| **Fly `/meta`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` |
| **Player CSS (produção)** | `index-DMJTzLg7.css` (bundle com safe-area no `.game-viewport`) |

---

## 3. Merge executado

| Item | Valor |
|------|--------|
| **Comando** | `gh pr merge 88 --merge` |
| **Estratégia** | **Merge commit** (não squash / não rebase) |
| **mergedAt** | `2026-05-16T17:06:15Z` |
| **mergeCommit** | **`1a2f8d3dc499bb9d63fd132f474f4f148383cf3d`** |
| **Parents** | `460ba4e` (main) + `38673cd` (branch `fix/h3-5d-game-visual-alignment`) |
| **Mensagem** | Merge pull request #88 from indesconectavel/fix/h3-5d-game-visual-alignment |

**Commit da correção (branch):** `38673cd` — `fix(player): corrigir alinhamento visual da tela de jogo H3.5d`

---

## 4. SHA novo (pós-merge)

| Camada | SHA / artefacto |
|--------|-----------------|
| **`origin/main`** | **`1a2f8d3dc499bb9d63fd132f474f4f148383cf3d`** |
| **Fly `/meta.gitCommit`** | **`1a2f8d3dc499bb9d63fd132f474f4f148383cf3d`** ✅ |
| **Player CSS (produção)** | **`index-D7hr6dPE.css`** (H3.5d) · `Last-Modified` 2026-05-16 ~17:08 UTC |

`/meta` **diferente** de `460ba4e` — alinhamento operacional confirmado.

---

## 5. Workflows executados (push merge → `main`)

| Workflow | Run ID | Resultado | Notas |
|----------|--------|-----------|--------|
| **CI** | 25967868926 | **success** | Build e auditoria |
| **🧪 Testes Automatizados** | 25967868927 | **success** | |
| **🚀 Pipeline Principal - Gol de Ouro** | 25967868916 | **success** | Job `build-and-deploy`: Fly deploy + validação endpoints |
| **🎨 Frontend Deploy (Vercel)** | 25967868942 | **success** | Testes frontend + **🚀 Deploy Produção** + smoke HTTP |
| **🔒 Segurança e Qualidade** | 25967868925 | **success** | |
| **⚠️ Rollback Automático** | 25967895554 | **skipped** | Sem disparo de rollback |

### Pipeline Principal — passos relevantes

- 🚀 Deploy Backend (Fly.io) — **success**
- ✅ Validar endpoints principais — **success**

### Frontend Deploy — passos relevantes

- 🏗️ Build para produção — **success**
- 📤 Deploy Vercel (produção) — **success**
- 🧪 Smoke test HTTP (prod) — **success**
- ❤️ Health check pós-deploy — **success**

**Sem falha crítica** · **sem rollback automático activo**.

---

## 6. Resultado Fly

**`GET https://goldeouro-backend-v2.fly.dev/meta`** (pós-deploy, 2026-05-16):

```json
{
  "success": true,
  "data": {
    "gitCommit": "1a2f8d3dc499bb9d63fd132f474f4f148383cf3d",
    "environment": "production",
    "version": "1.2.1"
  }
}
```

Deploy Fly executado pelo Pipeline Principal; runtime reporta o **merge commit** `1a2f8d3`.

---

## 7. Resultado Vercel

| Verificação | Resultado |
|-------------|-----------|
| Workflow **🚀 Deploy Produção** | **success** |
| `www.goldeouro.lol/` | HTTP **200** |
| CSS referenciado | **`/assets/index-D7hr6dPE.css`** (bundle H3.5d) |
| Inspecção CSS | **`padding` safe-area em `.game-viewport`** → **ausente** (correcção activa) |

Player em produção **actualizado** com o CSS da PR #88.

---

## 8. Resultado `/meta`

| Campo | Antes | Depois |
|-------|-------|--------|
| `gitCommit` | `460ba4e` | **`1a2f8d3`** ✅ |
| `environment` | production | production |
| `version` | 1.2.1 | 1.2.1 |

---

## 9. Resultado `/health`

**`GET https://goldeouro-backend-v2.fly.dev/health`** (pós-deploy):

| Campo | Valor |
|-------|--------|
| `status` | **ok** ✅ |
| `database` | **connected** ✅ |
| `mercadoPago` | **connected** ✅ |
| `timestamp` | `2026-05-16T17:08:58.178Z` |

---

## 10. Smoke `/game` (produção pós-deploy)

**URL:** `https://www.goldeouro.lol/game` · viewport **1920×1080** · sessão autenticada no browser de teste.

| Critério | Resultado |
|----------|-----------|
| Trave centralizada | **Sim** — gol centrado; simetria esquerda/direita |
| Fundo alinhado | **Sim** — estádio sem deslocamento lateral evidente |
| Bola / zonas | **Sim** — 5 alvos `Chutar para TL/TR/C/BL/BR` + bola no centro |
| HUD | **OK** — saldo, chutes, ganhos, aposta, MENU PRINCIPAL, Recarregar, áudio |
| Overlay retrato (DOM) | Textos **“Gire o celular”** presentes; emulação desktop limitada para `orientation: portrait` (ver H3.5b/H3.5e) |
| Erros runtime | Nenhum fatal observado; `GameService` inicializa |

---

## 11. Comparação visual antes/depois

| Aspecto | Antes (`460ba4e` / H3.0B) | Depois (`1a2f8d3` / H3.5d) |
|---------|---------------------------|----------------------------|
| CSS `.game-viewport` | `padding` + `env(safe-area-inset-*)` no palco | **Removido** do palco |
| Bundle CSS | `index-DMJTzLg7.css` | **`index-D7hr6dPE.css`** |
| Sintoma reportado (H3.5c) | Cenário/trave deslocados horizontalmente | Smoke desktop: **centrado** |
| Print de regressão no repo | Não disponível | Comparação indirecta + CSS + smoke |

**Interpretação:** a correção cirúrgica prevista está **em produção**; smoke automatizado em desktop **não reproduz** desvio horizontal. Validação em **telemóvel real (paisagem + notch)** permanece recomendada como ressalva operacional leve.

---

## 12. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| — | — | **Nenhum bloqueante** pós-merge |

**Observações não bloqueantes:**

- Emulação `orientation: portrait` no browser desktop continua **não fiável** (pré-existente).
- Print original da regressão **não** versionado no repositório.

---

## 13. Decisão final

### **PASS**

| Critério | Status |
|----------|--------|
| Merge commit controlado | ✅ |
| Pipelines verdes | ✅ |
| Fly `/meta` = `1a2f8d3` | ✅ |
| `/health` ok + DB + MP | ✅ |
| Vercel player com CSS H3.5d | ✅ |
| Smoke `/game` produção | ✅ (desktop; ressalva mobile físico) |
| Sem rollback / sem falha crítica | ✅ |

### Baseline operacional

**Baseline visual H3.5g estabilizada**

| Camada | Referência oficial |
|--------|-------------------|
| **Git `main`** | `1a2f8d3dc499bb9d63fd132f474f4f148383cf3d` |
| **Fly `/meta`** | `1a2f8d3dc499bb9d63fd132f474f4f148383cf3d` |
| **Player produção** | `index-D7hr6dPE.css` em `www.goldeouro.lol` |
| **Baseline anterior** | `460ba4e` (H3.5 V1 financeiro/admin + H3.0B player) |

**Próximo passo sugerido (governança, opcional):** tag anotada `v1-baseline-visual-1a2f8d3-2026-05-16` + smoke em dispositivo físico (paisagem).

---

## Metodologia

- `gh pr view` / `gh pr merge 88 --merge` / `gh pr checks`
- `git fetch` · `git log origin/main`
- `gh run list` · `gh run view` (Pipeline Principal, Frontend Deploy)
- `Invoke-RestMethod` → Fly `/meta`, `/health`
- HTTP + inspecção CSS em `www.goldeouro.lol`
- MCP browser — smoke `/game` pós-deploy

**Merge:** executado. **Deploy:** automático via CI/CD. **Sem** alterações adicionais de código nesta etapa.
