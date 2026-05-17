# H3.5j — Validação visual e funcional — PR #89 `/game`

**Data:** 2026-05-16  
**Modo:** read-only — sem merge, deploy manual, commit ou alteração de código.  
**PR:** https://github.com/indesconectavel/gol-de-ouro/pull/89  
**Branch:** `fix/h3-5i-game-geometry-alignment` · HEAD `69085ef`  
**Baseline produção (pré-merge):** `/meta.gitCommit` = `1a2f8d3`  
**Relacionado:** [H3-5I](H3-5I-CORRECAO-GEOMETRICA-GAME-2026-05-16.md) · [H3-5H](H3-5H-FORENSE-GEOMETRICA-GAME-2026-05-16.md)

---

## 1. Resumo executivo

A PR #89 altera **apenas** `layoutConfig.js` (−60px em X para `TARGETS` e `BALL.START`) e documentação. **Todos os checks GitHub/Vercel estão verdes.** Build local e de CI passam; o bundle gerado **não contém** coordenadas antigas `1020`/`1530` e **contém** `960`/`1470`/`450`.

A validação **determinística** da geometria pós-correção é **PASS** (zona C = eixo 960; simetria TL/TR e BL/BR; bola e goleiro idle no mesmo eixo).

A validação **pixel-autenticada do bundle da PR** em `/game` ficou **parcialmente bloqueada**: preview Vercel do monorepo retorna **404**; `vite dev` local exige login e aponta para `localhost:8080` (indisponível); credenciais de teste documentadas retornam **401** na API Fly.

Foi executado smoke **funcional** em `https://www.goldeouro.lol/game` (produção **`1a2f8d3`**, ainda **sem** a PR) com sessão autenticada: **5/5 zonas** responderam; HUD e overlay retrato OK. Esse smoke confirma que o jogo **não regrediu** mecanicamente, mas **não substitui** a prova visual do bundle `69085ef` — recomenda-se revalidar após merge/deploy do player.

**Decisão:** **PASS COM RESSALVAS** — aprovável para merge do ponto de vista técnico/CI, com ressalva de validação visual pós-deploy e monitorização de `GOALKEEPER.JUMPS`.

---

## 2. Checks PR #89

| Check | Resultado |
|-------|-----------|
| CI — Build e Auditoria | **SUCCESS** |
| CI — Verificação Backend | **SUCCESS** |
| Testes Backend / Frontend / Segurança / Performance | **SUCCESS** |
| CodeQL · GitGuardian | **SUCCESS** |
| Vercel | **SUCCESS** (deployment preview) |
| Deploy Produção (workflow) | **SKIPPED** (branch ≠ main) |

Nenhum check falhou ou pendente crítico.

---

## 3. Build

| Ambiente | Comando | Resultado |
|----------|---------|-----------|
| Local (branch `69085ef`) | `cd goldeouro-player && npm run build` | **Exit 0** (~20s) |
| CI (GitHub Actions) | workflow PR | **SUCCESS** |

**Artefatos locais:**

| Asset | Hash |
|-------|------|
| JS | `index-D5vfqxqL.js` |
| CSS | `index-D7hr6dPE.css` (inalterado vs `1a2f8d3`) |

**Verificação do bundle (layout embutido):**

| Valor | Presente no `index-D5vfqxqL.js` |
|-------|--------------------------------|
| `1020` | **Não** |
| `1530` | **Não** |
| `960` | **Sim** |
| `1470` | **Sim** |
| `450` | **Sim** |

*(Nota: `510` e `1000` ainda aparecem no bundle por outros contextos não relacionados a `TARGETS`.)*

---

## 4. Ambiente validado

| Ambiente | URL | Bundle / commit | Uso na validação |
|----------|-----|-----------------|------------------|
| **Produção backend** | `https://goldeouro-backend-v2.fly.dev` | `1a2f8d3` | `/meta`, `/health` |
| **Produção player** | `https://www.goldeouro.lol` | **`1a2f8d3`** (pré-PR) | Smoke funcional + visual referência |
| **Vercel preview PR** | `goldeouro-backend-git-fix-h3-5-eb3890-…vercel.app` | PR branch | **`/login` e `/` → 404** (monorepo backend, sem SPA player) |
| **Vite dev local** | `http://localhost:5174` | `69085ef` (código-fonte) | Login falhou (`localhost:8080` / 401 Fly) |
| **Análise estática** | `layoutConfig.js` + Node import | `69085ef` | Geometria determinística |

---

## 5. Produção atual (confirmação)

### `/meta`

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "gitCommit": "1a2f8d3dc499bb9d63fd132f474f4f148383cf3d",
    "environment": "production"
  }
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

**Confirmado:** produção permanece em **`1a2f8d3`**; PR #89 **não** está mergeada.

---

## 6. Resultado visual

### 6.1 Análise determinística (bundle PR — `layoutConfig` em `69085ef`)

| Elemento | Centro X lógico (stage 1920) | Observação |
|----------|------------------------------|------------|
| Zona **C** | **960** | = `GOALKEEPER.IDLE.x` |
| Zona **TL** (com offset +30) | **480** | |
| Zona **TR** (com offset −30) | **1440** | |
| Zona **BL** | **480** | |
| Zona **BR** | **1440** | |
| **Bola** `START` | **960** | |
| Média centros zonas | **960** | Simetria perfeita |
| Par TL/TR | Δ centro = **960px** | Espelhados em X=960 |
| Par BL/BR | Δ centro = **960px** | Espelhados em X=960 |

**Veredicto geométrico (código):** **PASS** — critérios H3.5i atendidos no modelo de coordenadas.

### 6.2 Browser — produção `1a2f8d3` (referência, não é o bundle da PR)

| Viewport | Resultado |
|----------|-----------|
| **Desktop ~1920×1080** | Palco visível; bola, goleiro e zona C **colineares** no eixo central; TL/TR e BL/BR **aparentemente simétricos** (screenshot + inspeção). |
| **Mobile retrato 390×844** | Overlay **«Gire o celular»** activo; toast de jogo («Defesa!») visível — overlay **funcional**. |
| **Mobile paisagem 844×390** | Jogo jogável; 5 zonas + HUD presentes; árvore a11y ainda lista overlay retrato (comportamento conhecido em viewports limítrofes). |

**Medição viewport (produção, zona C):** `getBoundingClientRect` → centro ≈ **(492, 447)** px; TL ≈ **(261, 447)**; TR ≈ **(724, 447)** → midpoint lateral ≈ **492,5** ≈ centro C (**simetria OK** no viewport actual).

**Limitação:** estes píxeis reflectem **`TARGETS.C.x = 1020`** (baseline). Após merge, espera-se deslocamento **≈ −60px × scale** no eixo X das zonas (≈ −31px neste viewport se scale ≈ 0,52).

### 6.3 Browser — bundle PR

**Não executado** em `/game` autenticado com JS `index-D5vfqxqL.js` (bloqueios §4).

---

## 7. Resultado funcional

| Teste | Ambiente | Resultado |
|-------|----------|-----------|
| Clique dispara fase de chute (zonas `disabled`) | Produção `1a2f8d3` | **OK** (5/5) |
| Bola anima / feedback («Defesa!» / saldo) | Produção | **OK** (observado em C, TL, TR, BL, BR) |
| HUD (saldo, chutes, ganhos) | Produção | **OK** (valores actualizados após chutes) |
| Backend responde ao chute | Produção → Fly | **OK** |
| Funcional no bundle PR (`69085ef`) | Local | **Não testado** (sem sessão) |

**Conclusão funcional:** mecânica do jogo **íntegra** na baseline actual; **nenhuma regressão** observada nos cliques. A PR **não altera** `GameFinal.jsx`, CSS nem API — risco funcional **baixo**.

---

## 8. Teste das 5 zonas

| Zona | Clique | Resposta observada | Estado |
|------|--------|-------------------|--------|
| **C** | Sim | Zonas disabled; saldo −R$1; chutes +1 | **OK** |
| **TL** | Sim | Zonas disabled; animação/feedback | **OK** |
| **TR** | Sim | Zonas disabled; animação/feedback | **OK** |
| **BL** | Sim | Zonas disabled; animação/feedback | **OK** |
| **BR** | Sim | Zonas disabled; toast «Defesa!» (retrato) | **OK** |

*Executado em `www.goldeouro.lol` (baseline `1a2f8d3`). Hitboxes pós-PR deslocam −60px em X mas mantêm a mesma lógica `getTargetPosition` + offsets.*

---

## 9. Animações / goleiro / JUMPS

| Item | Resultado |
|------|-----------|
| **Goleiro idle** | Centralizado visualmente na produção; `IDLE.x = 960` **inalterado** na PR |
| **Pulos (`JUMPS`)** | **Não recalibrados** na PR (ressalva H3.5i mantida) |
| **Animação bola → target** | Usa os mesmos offsets que as zonas; **coerente** com `layoutConfig` pós-−60px |
| **Defesa observada** | Goleiro reagiu (toast «Defesa!»); sem evidência de jump desalinhado **grave** em smoke rápido |

**Recomendação pós-merge:** validar visualmente pulos TL/TR/BL/BR/C em desktop; se divergirem das novas zonas, follow-up H3.5k com −60px em `GOALKEEPER.JUMPS.x`.

---

## 10. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| P1 | Média | **Preview Vercel PR → 404** — impossível smoke do player no URL do PR (igual H3.5e). |
| P2 | Média | **Sem sessão no `vite dev`** — não foi possível jogar `/game` com código `69085ef` localmente. |
| P3 | Baixa | **Smoke visual em produção ≠ bundle PR** — `www.goldeouro.lol` ainda em `1a2f8d3`. |
| P4 | Baixa | **`GOALKEEPER.JUMPS` não ajustados** — possível desvio visual na animação de defesa (não bloqueante no smoke). |
| P5 | Info | Credenciais `test@example.com` / `password123` → **401** na API Fly (documentação desactualizada). |

**Nenhum bug bloqueante** encontrado nos checks, build ou smoke funcional da baseline.

---

## 11. Decisão

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| Checks PR #89 | **PASS** |
| Build | **PASS** |
| Geometria (análise `layoutConfig` + bundle) | **PASS** |
| Visual desktop/mobile (bundle PR) | **RESSALVA** — não validado pixel-a-pixel no artefato da PR |
| Funcional 5 zonas | **PASS** (baseline); **RESSALVA** para bundle PR |
| Produção `/meta` = `1a2f8d3` | **CONFIRMADO** |
| Merge automático neste passo | **NÃO** (conforme instrução) |

**Condições recomendadas antes de considerar baseline visual fechada:**

1. Após merge + deploy do player: smoke `/game` em `www.goldeouro.lol` com CSS/JS novo (hash ≠ `index-D5vfqxqL.js` ou sucessor).
2. Confirmar zona C no eixo da trave em **1920×1080** e simetria TL/TR após deploy.
3. Observar animação de defesa do goleiro nas 5 direcções.

---

## Metodologia

- `gh pr view` / `gh pr checks` / `gh pr diff`
- `npm run build` (local)
- `Invoke-RestMethod` → `/meta`, `/health`
- Node ESM import de `layoutConfig.js`
- Grep no bundle `dist/assets/index-D5vfqxqL.js`
- MCP browser: `www.goldeouro.lol/game` (desktop, 390×844, 844×390); preview Vercel; `localhost:5174`

**Sem merge. Sem commit. Sem alteração de código.**
