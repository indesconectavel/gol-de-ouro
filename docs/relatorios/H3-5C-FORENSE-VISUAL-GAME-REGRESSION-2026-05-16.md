# H3.5c — FORENSE VISUAL READ-ONLY — REGRESSÃO `/game`

**Data:** 2026-05-16  
**Modo:** 100% read-only — sem alteração de CSS, código, commit, deploy, rollback ou PR.  
**Contexto:** pós-merge [PR #87](https://github.com/indesconectavel/gol-de-ouro/pull/87), baseline [H3.5](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md) (`460ba4e`), promoção H3.0B em produção.  
**Baseline estável anterior (Fly):** `7ecedca`  
**Sintoma reportado:** trave/cenário deslocados na horizontal; fundo aparenta deslocado à esquerda; ausente antes de H3.0B.

---

## 1. Resumo executivo

Entre `7ecedca` e `460ba4e`, existe **um único commit** que altera ficheiros do player em `goldeouro-player/`:

| Commit | Mensagem |
|--------|----------|
| **`dac9f8b`** | `fix: polir game mobile H3.0B` |

`dac9f8b` **não** é ancestral de `7ecedca` e **é** ancestral de `460ba4e` — a regressão visual reportada coincide temporalmente com a **primeira entrada de H3.0B em `main`**, via merge `460ba4e`.

**Causa mais provável (conjunto):**

1. **Primária — `game-scene.css`:** `padding` com `env(safe-area-inset-*)` em `body[data-page="game"] .game-viewport` (linhas ~41–45), combinado com `viewport-fit=cover` em `index.html`, desloca o contentor flex que centra `.game-scale` (palco inteiro: fundo + trave + alvos).
2. **Secundária — `game-shoot.css`:** bloco H3.0B (~627–677) com `transform: none !important` em `.gs-ball` / `.gs-zone` — corrige conflito documentado em [H3.0A](H3-0A-DIAGNOSTICO-GAME-MOBILE-V1-2026-05-12.md) (P1), mas altera alinhamento bola/zonas face ao CSS legado `translate(-50%, -50%)` que existia em `7ecedca`.
3. **Baixa — cache/SW:** evidência E2 em [H3.5b](H3-5B-SMOKE-PLAYER-PRODUCAO-2026-05-16.md) (bundle antigo ocasional); não explica sozinho deslocamento estrutural consistente.

**Classificação:** regressão **CSS + viewport mobile** (não backend, não `layoutConfig.js`, não `calculateScale()` em JS — estes **não mudaram** no intervalo).

**Risco de correção futura:** **médio** — cirurgia escopada em 2–3 ficheiros do player; exige validação em dispositivo real (paisagem + notch).

---

## 2. Baseline actual (evidências)

### 2.1 Tabela de camadas

| Camada | SHA | Evidência |
|--------|-----|-----------|
| **`origin/main`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` | `git fetch origin main` + `git rev-parse origin/main` (2026-05-16) |
| **Fly `/meta.gitCommit`** | `460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3` | `GET https://goldeouro-backend-v2.fly.dev/meta` |
| **Player Vercel (`www.goldeouro.lol`)** | Build alinhado a `main` pós-H3.5 | `index.html` com `viewport-fit=cover`; assets `index-ByS331OU.js`, `index-DMJTzLg7.css` (200); `Last-Modified` 2026-05-16 |
| **Baseline histórica (pré-H3.0B em main)** | `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` | Documentada em H3.5; **sem** `dac9f8b` no histórico |
| **Working tree local (sessão)** | `041a771` | `HEAD` local ≠ `origin/main` (apenas docs H3.3); **não** afecta produção |

### 2.2 `/meta` (produção)

```json
{
  "success": true,
  "data": {
    "gitCommit": "460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3",
    "environment": "production",
    "version": "1.2.1"
  }
}
```

Backend e Git `main` estão **alinhados** em `460ba4e`. O player não expõe `/meta`; o HTML de produção reflecte o build com H3.0B (`viewport-fit=cover`).

---

## 3. Commits candidatos (`7ecedca..460ba4e`)

### 3.1 Filtro pedido (paths do player)

```bash
git log --oneline 7ecedca..460ba4e -- \
  goldeouro-player/src \
  goldeouro-player/public \
  goldeouro-player/index.html
```

**Resultado:** apenas **`dac9f8b`**.

### 3.2 Histórico completo do intervalo (contexto)

| Commit | Tipo | Risco visual `/game` |
|--------|------|----------------------|
| `460ba4e` | Merge PR #87 | **Nenhum** (sem diff player) |
| `041a771`, `b68dca3` | Docs governança | Nenhum |
| **`dac9f8b`** | **H3.0B — game mobile** | **ALTO** — único diff de código player |
| `079bfd6`, `b475647` | Docs H3.0B backup/diagnóstico | Nenhum |
| `10a25cc` … `a60bbf1` | Docs auditorias / merge PR #86 | Nenhum |

### 3.3 Destaque `dac9f8b` (H3.0B)

| Ficheiro | Δ linhas | Conteúdo relevante |
|----------|----------|-------------------|
| `goldeouro-player/index.html` | +1 | `viewport-fit=cover` na meta viewport |
| `goldeouro-player/src/pages/GameFinal.jsx` | +15 | Overlay `.game-rotate` (portrait) |
| `goldeouro-player/src/pages/game-scene.css` | +56 | Safe-area no `.game-viewport`; portrait gate `.game-scale`; HUD landscape |
| `goldeouro-player/src/pages/game-shoot.css` | +52 | Neutralizar `transform` legado em bola/zonas/goleiro |
| `docs/relatorios/H3-0B-CIRURGIA-...` | doc | Registo da cirurgia |

**Estatística Git (player, código):** 4 ficheiros, **+121 / −4** linhas.

**Nota de paths:** o prompt referia `goldeouro-player/src/styles/game-scene.css` — no repositório os ficheiros activos são **`goldeouro-player/src/pages/game-scene.css`** e **`game-shoot.css`** (importados por `GameFinal.jsx`). Não existe diff em `src/styles/` para este intervalo.

---

## 4. Diff cirúrgico `/game` (`7ecedca..460ba4e`)

### 4.1 Propriedades pedidas — o que mudou

| Propriedade / tema | Alterado? | Onde |
|--------------------|-----------|------|
| `background-position` | **Não** | — |
| `background-size` | **Não** | — |
| `transform` | **Sim** | `game-shoot.css` (H3.0B: `transform: none` em bola/zonas; hover/active sem `translate(-50%,-50%)`) |
| `overflow` | **Não** | — |
| `width` / `max-width` | **Sim (HUD)** | `game-scene.css` landscape mobile — logo 120px |
| `object-fit` | **Não** | `scene-bg` inline em `GameFinal.jsx` inalterado (`cover`) |
| `justify-content` / `align-items` | **Não** | Inline em `.game-viewport` inalterado (`center`) |
| `safe-area` | **Sim** | `game-scene.css` `.game-viewport` + overlay portrait + HUD bottom |
| `viewport-fit` | **Sim** | `index.html` |
| `translateX` | **Indirecto** | Remoção de `translate(-50%,-50%)` em `.gs-*` |
| `margins` / `padding` | **Sim** | `padding` safe-area em `.game-viewport` |
| `scale` / responsivo | **Parcial** | `transform: none` anula `scale(0.8)` mobile legado em `.gs-ball` (`game-scene.css` ~809–811) via regra H3.0B |

### 4.2 `index.html`

```diff
- <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+ <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 4.3 `GameFinal.jsx`

- Inclusão do bloco **`.game-rotate`** (overlay portrait).
- **Sem alteração** a `calculateScale()`, `gameScaleStyle`, posições inline de bola/zonas/goleiro (`left: x - size/2`), nem `scene-bg` (`left: 0`, `objectFit: 'cover'`).

### 4.4 `game-scene.css` (trechos críticos)

**Safe-area no viewport (afecta todo o palco):**

```css
body[data-page="game"] .game-viewport {
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}
```

**Portrait — oculta palco (não explica desvio em paisagem):**

```css
@media (orientation: portrait) {
  body[data-page="game"] .game-viewport > .game-scale {
    display: none !important;
  }
}
```

### 4.5 `game-shoot.css` (trechos críticos)

```css
/* H3.0B — neutralizar translate legado */
body[data-page="game"] .game-stage img.gs-ball {
  transform: none !important;
  left: auto;
  top: auto;
  width: auto;
  height: auto;
}
body[data-page="game"] .game-stage button.gs-zone {
  transform: none;
  /* hover/active: scale() sem translate(-50%,-50%) */
}
```

Em `7ecedca`, as mesmas entidades já tinham **centro calculado no JSX** (`left: pos.x - size/2`) **e** CSS `transform: translate(-50%, -50%)` — conflito P1 do [H3.0A](H3-0A-DIAGNOSTICO-GAME-MOBILE-V1-2026-05-12.md). H3.0B remove o segundo offset.

---

## 5. Causa mais provável

### 5.1 Tabela de probabilidade

| Alteração | Probabilidade | Notas |
|-----------|---------------|--------|
| **Safe-area CSS em `.game-viewport`** | **Alta** | Desloca área útil do flex que centra `.game-scale`; `calculateScale()` usa `window.innerWidth/Height` **sem** descontar padding → possível desalinhamento global (fundo + trave) |
| **`viewport-fit=cover`** | **Alta (mobile)** / **Baixa (desktop)** | Habilita `env(safe-area-inset-*)` ≠ 0 em dispositivos com notch; sozinho não desloca se insets forem 0 |
| **Neutralização `transform` (`game-shoot.css`)** | **Alta (elementos interactivos)** / **Média (cenário inteiro)** | Explica bola/zonas vs. gramado; se fundo e trave “andam juntos”, menos provável como causa única |
| **Overlay orientation** | **Baixa (paisagem)** | Só bloqueia UI em `orientation: portrait` |
| **`background-position`** | **Nula** | Sem diff |
| **Scaling responsivo (`calculateScale`)** | **Nula (código)** | Função idêntica em `7ecedca` e `460ba4e`; interacção indirecta com padding |
| **Cache antigo / SW** | **Baixa–média** | Pode amplificar confusão; não explica diff Git único |

### 5.2 Resposta objectiva

| Pergunta | Resposta |
|----------|----------|
| **Ficheiro mais suspeito** | **`goldeouro-player/src/pages/game-scene.css`** (padding safe-area em `.game-viewport`) |
| **Segundo ficheiro** | **`goldeouro-player/src/pages/game-shoot.css`** (bloco H3.0B ~627+) |
| **Linha/alteração provável (deslocamento global)** | `game-scene.css` **L41–45** — `padding-*: env(safe-area-inset-*)` em `.game-viewport` |
| **Linha/alteração provável (bola/zonas vs. trave)** | `game-shoot.css` **L628–645** — `transform: none` / `left: auto` |
| **Natureza do problema** | **CSS + viewport mobile** (safe-area + flex centering); componente **estrutural** do contentor, não API/backend |

### 5.3 Hipótese de reconciliação com “antes estava certo”

Em `7ecedca`, o conflito P1 (inline + `translate(-50%,-50%)`) podia **compensar visualmente** arte do campo desalinhada no bundle. H3.0B “corrige” o offset lógico, expondo desvio fundo/trave **ou** o padding safe-area desloca o palco inteiro. Ambos foram introduzidos **no mesmo commit** `dac9f8b`.

---

## 6. Impacto por ambiente (inferência a partir do diff + H3.0A/H3.5b)

| Ambiente | Impacto | Fundamentação |
|----------|---------|---------------|
| **Desktop** (sem notch) | **Possível** | Safe-area tipicamente 0; **transform:none** ainda muda bola/zonas vs. `7ecedca` |
| **Mobile retrato** | **Overlay apenas** | Palco oculto (`.game-scale { display:none }`); desvio de trave **não observável** em jogo |
| **Mobile paisagem** | **Alto** | Safe-area lateral + padding viewport + escala; cenário de jogo real |
| **Apenas `/game`** | **Sim** | Regras escopadas `body[data-page="game"]` + rota `GameFinal` |
| **Outras páginas** | **Mínimo** | `viewport-fit=cover` é global no `index.html`; padding safe-area do jogo **não** aplicado fora de `.game-viewport` |

**Limitação:** este forense **não** inclui captura visual comparativa `7ecedca` vs `460ba4e` em browser (modo read-only sem deploy de preview). Smoke H3.5b não validou paisagem real em hardware.

---

## 7. O que NÃO foi alterado (exclusões)

| Área | Estado no intervalo |
|------|---------------------|
| `layoutConfig.js` | Intocado |
| `calculateScale()` / `gameScaleStyle` | Intocado |
| `scene-bg` inline (`left: 0`, `objectFit: cover`) | Intocado |
| Backend / Fly / PR #87 (admin/financeiro) | Sem relação causal com layout `/game` |
| `vercel.json` player | Sem diff em `dac9f8b` |

---

## 8. Classificação de risco

| Dimensão | Nível |
|----------|--------|
| **Impacto utilizador** | Médio — jogo utilizável mas alinhamento visual/competitivo degradado |
| **Impacto financeiro/API** | Baixo — sem mudança em `gameService` / `handleShoot` |
| **Risco de fix agressivo** | Médio — reverter H3.0B inteiro perde portrait gate e safe-area úteis |
| **Confiança causal** | **Alta** quanto ao commit (`dac9f8b` único); **média-alta** quanto ao mecanismo (safe-area + transform) |

---

## 9. Estratégia segura futura (recomendação — sem implementação)

1. **Não** reverter `460ba4e` / backend — isolamento no **player**.
2. **Validar em hardware:** iPhone/Android, **paisagem**, com e sem notch; desktop Chrome largura típica — screenshots lado a lado.
3. **Correcção cirúrgica sugerida (fase posterior):**
   - **Opção A:** remover ou aplicar safe-area só em HUD (botões), **não** em `.game-viewport` que envolve `.game-scale`.
   - **Opção B:** manter padding mas fazer `calculateScale()` usar dimensões do contentor **após** padding (`clientWidth`/`clientHeight` do viewport).
   - **Opção C:** afinar só `game-shoot.css` H3.0B se o desvio for **só** bola/zonas (ex.: `transform: translate(-50%, -50%)` removido apenas onde inline não faz `- size/2`).
4. **Teste de regressão:** checklist H3.0A P1–P4 + comparar com tag `pre-h3-0b-game-mobile-2026-05-12` / commit `7ecedca` no player.
5. **Cache:** após deploy, validar bundle único (mitigar E2 H3.5b).

---

## 10. Metodologia

- `git fetch origin main`, `git rev-parse`, `git log`, `git diff`, `git show dac9f8b`
- `git merge-base --is-ancestor` para posicionar `dac9f8b` vs `7ecedca` / `460ba4e`
- `Invoke-RestMethod` → Fly `/meta`
- `Invoke-WebRequest` → `https://www.goldeouro.lol/` (HEAD + amostra HTML)
- Leitura de `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`, [H3.0A](H3-0A-DIAGNOSTICO-GAME-MOBILE-V1-2026-05-12.md), [H3.0B cirurgia](H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md), [H3.5](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md), [H3.5b](H3-5B-SMOKE-PLAYER-PRODUCAO-2026-05-16.md)

**Relacionado:** [H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md) · [H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md](H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md)
