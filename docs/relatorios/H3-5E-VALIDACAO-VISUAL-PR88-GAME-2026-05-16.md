# H3.5e — VALIDAÇÃO VISUAL — PR #88 `/game`

**Data:** 2026-05-16  
**PR:** [#88 — H3.5d Corrigir alinhamento visual da tela /game](https://github.com/indesconectavel/gol-de-ouro/pull/88)  
**Branch:** `fix/h3-5d-game-visual-alignment` (`38673cd`)  
**Baseline produção (intocada):** `460ba4e`  
**Modo:** read-only — sem merge, deploy manual, commit ou alteração de código.

**Relacionado:** [H3-5C forense](H3-5C-FORENSE-VISUAL-GAME-REGRESSION-2026-05-16.md) · [H3-5D correção](H3-5D-CORRECAO-VISUAL-GAME-PREVIEW-2026-05-16.md)

---

## 1. Resumo executivo

A **PR #88** está **tecnicamente pronta** (checks CI/Vercel verdes, build local OK, diff CSS alinhado à forense H3.5c). A validação visual **completa do bundle H3.5d em preview dedicado** ficou **parcialmente bloqueada** por limitações de ambiente (guard `USE_MOCKS` no `vite preview`, login local sem backend `localhost:8080`, preview Vercel com proteção 401).

**Evidência forte da correção:** o CSS de produção (`index-DMJTzLg7.css`) **ainda contém** `padding` + `safe-area` em `.game-viewport`; o build da PR (`index-D7hr6dPE.css`) **não contém** esse padding no palco.

**Smoke visual em produção (`460ba4e`, pré-merge da PR):** em viewport **1920×1080** e **390×844**, a cena `/game` com sessão activa mostra **trave, fundo, bola e cinco zonas simétricas** no centro — sem deslocamento horizontal óbvio no browser de teste (pode não reproduzir notch/safe-area real).

**Decisão:** **PASS COM RESSALVAS** — aprovar merge **após** smoke complementar do artefacto PR (preview Vercel player ou dispositivo físico em paisagem).

**Merge:** **não realizado** (conforme instrução).

---

## 2. Checks PR #88

| Check | Resultado |
|-------|-----------|
| 🔍 Build e Auditoria | **pass** |
| 🔍 Verificação Backend | **pass** |
| 🧪 Testes Frontend (CI + Automatizados) | **pass** |
| 🧪 Testes Backend | **pass** |
| 🔒 Análise / Testes de Segurança | **pass** |
| 📊 Análise de Qualidade / Relatórios | **pass** |
| ⚡ Testes de Performance | **pass** |
| CodeQL / GitGuardian | **pass** |
| **Vercel** | **pass** (deploy preview) |
| 🚀 Deploy Produção | **skipped** (esperado em PR) |

**Estado PR:** `OPEN` · base `main` · head `fix/h3-5d-game-visual-alignment`

---

## 3. Ambiente validado

| Ambiente | URL / artefacto | Branch / commit | Notas |
|----------|-----------------|-----------------|-------|
| **Git PR** | [#88](https://github.com/indesconectavel/gol-de-ouro/pull/88) | `38673cd` | Escopo H3.5d |
| **Build local** | `goldeouro-player/dist/` | `38673cd` | `npm run build` → exit **0** (~29s); CSS `index-D7hr6dPE.css` |
| **Preview `4176`** | `http://127.0.0.1:4176/` | build PR | **Bloqueado** — tela preta; `USE_MOCKS=true` + `import.meta.env.DEV=false` → erro crítico em `environments.js` |
| **Dev Vite** | `http://localhost:5173/` | fontes PR | Login renderiza; login API falha (`localhost:8080` indisponível) |
| **Produção player** | `https://www.goldeouro.lol` | **`460ba4e`** (main) | Sessão de teste já presente no browser; CSS `index-DMJTzLg7.css` |
| **Fly `/meta`** | `goldeouro-backend-v2.fly.dev/meta` | **`460ba4e`** | Inalterado durante validação |
| **Vercel preview PR** | `goldeouro-backend-git-fix-h3-5-…vercel.app` | PR branch | **401** sem credenciais; projecto Vercel = backend monorepo |

---

## 4. Viewports testados

| Viewport | Ambiente | Rotas | Resultado |
|----------|----------|-------|-----------|
| **Desktop 1920×1080** | Produção `/game` | `/game` | Palco visível; HUD + zonas; trave centrada (screenshot) |
| **Mobile 390×844** | Produção `/game` | `/game` | Palco ainda visível no browser automatizado*; overlay no DOM |
| **Mobile 844×390** | Produção `/game` | `/game` | Emulação `orientation` **não fiável** (ver §7) |
| **Desktop** | Dev `5173` | `/` | Login OK |
| **—** | Preview `4176` | todas | App não monta (guard mocks) |

\*O browser de automação mantém `orientation: portrait` de forma inconsistente; por isso o overlay “Gire o celular” pode coexistir no DOM mesmo com jogo visível.

---

## 5. Resultado `/game`

### 5.1 Produção actual (`460ba4e` — linha de base da regressão reportada)

Com sessão autenticada e viewport **1920×1080**:

| Critério | Observação |
|----------|------------|
| Trave centralizada | **Sim** — gol ao centro; simetria esquerda/direita na captura |
| Fundo alinhado | **Sim** — estádio sem “empurrão” lateral evidente |
| Bola / zonas | **Sim** — bola no meio; 5 botões `Chutar para TL/TR/C/BL/BR` dentro da baliza |
| HUD | **OK** — saldo, chutes, ganhos, aposta R$ 1, MENU PRINCIPAL, Recarregar, áudio |
| Erros consola | Apenas logs `GameService` / métricas; sem erro fatal de layout |

### 5.2 Artefacto PR #88 (H3.5d)

| Método | Resultado |
|--------|-----------|
| Inspecção CSS build | **Padding safe-area removido** de `.game-viewport` vs produção |
| Preview `4176` | **Não validado visualmente** (app não inicializa) |
| Dev `5173` + login | **Não validado** em `/game` (API local indisponível) |

**Conclusão técnica:** a alteração da PR ataca directamente a causa raiz identificada em H3.5c; validação pixel-a-pixel do bundle PR depende de preview funcional ou merge em staging.

---

## 6. Resultado overlay retrato

| Teste | Resultado |
|-------|-----------|
| Produção, primeira carga mobile estreita | Overlay **“Gire o celular”** + subtítulo visíveis (confirmado na sessão) |
| Textos acessíveis | `Gire o celular` / `Use o modo horizontal (paisagem) para jogar.` |
| PR #88 (CSS fonte) | Regras `.game-rotate` e `display:none` em `.game-scale` em portrait **preservadas** em `game-scene.css` |

**Overlay retrato:** **OK** (comportamento H3.0B mantido).

---

## 7. Resultado paisagem

| Teste | Resultado |
|-------|-----------|
| `844×390` + reload | Browser automatizado **não** alterna fiavelmente para `orientation: landscape` (mesma limitação [H3.5b](H3-5B-SMOKE-PLAYER-PRODUCAO-2026-05-16.md)) |
| `1920×1080` em `/game` | Palco **liberado** (sem bloqueio total; jogo jogável na árvore) |
| Safe-area lateral (notch) | **Não testado** em hardware |

**Paisagem real em telemóvel:** **pendente** — ressalva para fechar validação.

---

## 8. Comparação com regressão anterior

| Fonte | Conteúdo |
|-------|----------|
| Relato operacional / H3.5c | Trave/cenário deslocados à **esquerda**; fundo “puxado”; pós-H3.0B (`dac9f8b`) |
| Print anexado pelo utilizador | **Não encontrado** no repositório (`docs/`, issues) |
| CSS produção vs PR | **Produção:** `.game-viewport { padding: env(safe-area-inset-*) }` **confirmado** · **PR:** padding **ausente** no palco |
| Smoke browser produção (esta sessão) | Em desktop largo, cena **centrada** mesmo em `460ba4e` — sugere regressão **mais acentuada em mobile com insets** ou em condições não reproduzidas aqui |

**Interpretação:** a PR #88 corrige o mecanismo forense (padding no contentor do palco). A comparação visual “antes/depois” lado a lado **não foi possível** no mesmo bundle; produção actual ainda é o “antes” até merge.

---

## 9. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| E1 | **Média** | `vite preview` em `127.0.0.1:4176` — crash `USE_MOCKS=true em ambiente de produção` (guard pré-existente + env `development` em hostname local) |
| E2 | **Média** | Não foi possível abrir `/game` no build PR nem no dev com credenciais documentadas (`test@example.com`) — API `localhost:8080` offline |
| E3 | **Baixa** | Preview Vercel da PR — HTTP **401** (protecção); projecto ligado ao monorepo `goldeouro-backend`, não URL player dedicada |
| E4 | **Baixa** | Emulação `orientation` no browser desktop — não substitui telemóvel real |
| E5 | **Info** | `/meta` produção permanece `460ba4e` — **correcto** (PR não merged) |
| E6 | **Info** | Sem print de regressão no repo para diff pixel-a-pixel |

**Nenhum defeito novo** introduzido pela PR foi detectado em código ou CI. Bloqueios são **de ambiente de validação**, não de regressão funcional reportada nos checks.

---

## 10. Decisão final

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| Checks PR #88 | ✅ Todos verdes |
| Build PR | ✅ |
| Correção CSS vs forense | ✅ Confirmada por diff de bundle |
| `/meta` produção = `460ba4e` | ✅ |
| Overlay retrato preservado | ✅ (código + smoke parcial) |
| Validação visual bundle PR em preview | ⚠️ Incompleta |
| Paisagem + notch em hardware | ⚠️ Pendente |
| Comparação com print de regressão | ⚠️ Print indisponível; comparação indirecta |

### Recomendações pós-validação (sem merge automático)

1. Validar **preview Vercel do player** (ou `vite dev` apontando API Fly) com `/game` em **paisagem** e dispositivo com notch.
2. Opcional: corrigir em fase futura o guard `USE_MOCKS` para `vite preview` em `127.0.0.1` (fora do escopo desta PR).
3. Após merge: repetir smoke H3.5b em produção e confirmar CSS `index-D7hr6dPE.css` (ou hash novo) em `www.goldeouro.lol`.

---

## Metodologia

- `gh pr view 88` / `gh pr checks 88`
- `npm run build` na branch `fix/h3-5d-game-visual-alignment`
- Comparação CSS minificado produção vs `dist/` PR
- `Invoke-RestMethod` → Fly `/meta`
- MCP browser: `www.goldeouro.lol` (`/`, `/game`, `/dashboard`) e `localhost:5173` / `127.0.0.1:4176`
- Viewports: 1920×1080, 390×844, 844×390

**Merge:** **não executado.**
