# H3.5o — Validação visual final — produção `/game`

**Data:** 2026-05-16  
**Modo:** read-only — sem alteração de código, commit, deploy, SQL ou rollback.  
**URL:** https://www.goldeouro.lol/game  
**Baseline esperada (H3.5n):** `/meta` = `4e90e9b` · player `index-CZEHatgf.js`  
**Relacionado:** [H3-5N](H3-5N-MERGE-CONTROLADO-PR90-2026-05-16.md) · [H3-5M](H3-5M-VALIDACAO-PR90-AJUSTE-VERTICAL-GAME-2026-05-16.md) · [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md)

---

## 1. Resumo executivo

A **produção está alinhada com H3.5n**: Fly `/meta` = **`4e90e9b`**, `/health` = **ok**, HTML e service worker servem **`index-CZEHatgf.js`** com coordenadas **495 / 715 / 985** embutidas.

A **validação pixel completa em `/game`** nesta sessão ficou **bloqueada por autenticação**: o browser automatizado (tab limpa + tentativa de login `test@example.com`) foi redireccionado para a página de login; API Fly retorna **401** para essas credenciais.

Com base em **deploy confirmado** + **modelo de coordenadas** + **referência H3.5k** (medições com sessão), o ajuste vertical **−25px** está **implementado em produção** e é **coerente** com o objectivo (zonas/bola mais altas, X inalterado). **Confirmação visual humana com conta real** continua recomendada.

**Decisão:** **PASS COM RESSALVAS**

---

## 2. Estado da produção

### `/meta`

```json
{
  "gitCommit": "4e90e9b6f341fac0ba86921585da013d8401f341",
  "version": "1.2.1",
  "environment": "production"
}
```

**Confirmado:** `4e90e9b` ✅

### `/health`

```json
{
  "status": "ok",
  "database": "connected",
  "mercadoPago": "connected"
}
```

### Bundle no HTML (`www.goldeouro.lol/`)

| Artefacto | Esperado H3.5n | Observado |
|-----------|----------------|-----------|
| **JS** | `index-CZEHatgf.js` | **`index-CZEHatgf.js`** ✅ |
| **CSS** | `index-D7hr6dPE.css` | **`index-D7hr6dPE.css`** ✅ |

### Coordenadas no bundle (`index-CZEHatgf.js`)

| Padrão (layout activo H3.5l) | Presente |
|------------------------------|----------|
| `x:960,y:985` (bola) | **Sim** |
| `x:960,y:495` (zona C) | **Sim** |
| `x:450,y:495` / `x:1470,y:715` | **Sim** |
| `x:960,y:520` (legado H3.5k) | Também no ficheiro minificado* |

\*Strings legadas podem coexistir noutros contextos; `layoutConfig` em `main` usa **495 / 715 / 985** (confirmado via `git show origin/main:…/layoutConfig.js`).

---

## 3. Cache / PWA

| Verificação | Resultado |
|-------------|-----------|
| Navegação com query cache-bust (`?v=h35o-final-4e90e9b`) | Utilizada |
| `index.html` referencia | **`index-CZEHatgf.js`** (não `index-BSHHrtG4.js`) |
| `sw.js` (precache) | Referencia **`index-CZEHatgf.js`** — **sim** |
| `sw.js` referencia `index-BSHHrtG4.js` | **Não** |

**Conclusão:** deploy Vercel/PWA aponta para o bundle H3.5n. Utilizadores com cache antigo podem precisar de **hard refresh** ou limpar dados do site até ver `index-CZEHatgf.js` no DevTools → Network.

---

## 4. Resultado visual

### 4.1 Sessão e acesso `/game`

| Passo | Resultado |
|-------|-----------|
| Abrir `https://www.goldeouro.lol/game` | Redirect → **`/`** (login) |
| Login `test@example.com` / `password123` | **Falhou** (permanece em login) |
| `POST /api/auth/login` (Fly) | **401** Credenciais inválidas |
| Inspecção pixel 1920×1080 com palco | **Não realizada** nesta sessão |

### 4.2 Checklist visual (estado do deploy + análise)

| Critério | Resultado nesta sessão |
|----------|------------------------|
| Trave centralizada | **Esperado OK** (sem alteração CSS/fundo desde H3.5k) |
| Fundo alinhado | **Esperado OK** |
| Zonas na altura correta (−25px vs H3.5k) | **Deploy OK** · **pixel não medido** |
| Bola na altura correta | **Deploy OK** · **pixel não medido** |
| Goleiro coerente (690 idle) | **Esperado OK** (inalterado) |
| HUD intacto | **Esperado OK** (sem diff) |
| Botão Recarregar | **Não verificado** (sem `/game` autenticado) |
| Sem deslocamento lateral | **Esperado OK** (X inalterado desde H3.5i/k) |
| Sem necessidade de subir/descer mais | **Pendente** validação humana |

### 4.3 Medições esperadas (se sessão disponível)

Referência [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) — **H3.5k** (`index-BSHHrtG4.js`), zonas superiores `top` bbox ≈ **423px**:

| Zona | `left` (estável) | `top` H3.5k | `top` esperado H3.5o |
|------|------------------|-------------|----------------------|
| **TL** | 208 | 423 | **~411** |
| **C** | 439 | 423 | **~411** |
| **TR** | 671 | 423 | **~411** |

**Δ ≈ −12px** no viewport (25px stage × scale ~0,48). **Eixo X:** sem alteração.

---

## 5. Comparação com prints / baselines anteriores

| Fase | Bundle | Zonas superiores Y (stage) | Observação visual documentada |
|------|--------|----------------------------|-------------------------------|
| **H3.5k** (pós-H3.5i) | `index-BSHHrtG4.js` | **520** | Eixo X corrigido; screenshots: alinhamento horizontal bom; feedback: zonas/bola **um pouco baixas** |
| **H3.5n** (actual) | `index-CZEHatgf.js` | **495** | **−25px** uniforme; bola **1010→985** |
| **H3.5o** (esta validação) | Deploy confirmado | **495** em produção | Pixel `/game` **não capturado** (auth) |

**Evolução vertical:**

```text
H3.5k (520)  ──−25px──►  H3.5n/o (495)   ← objectivo H3.5l atendido no código/bundle
```

**Prints anteriores (H3.5k):** zonas colineares com goleiro no eixo X; pedido subsequente foi **subir** — PR #90 mergeada e bundle em produção reflecte essa subida.

---

## 6. Problemas encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| P1 | **Alta** (para esta sessão) | **Sem credenciais válidas** — impossível abrir `/game` no browser automatizado |
| P2 | Média | Validação pixel final **depende de conta real** ou credenciais de smoke actualizadas |
| P3 | Baixa | Cache PWA residual possível em clientes antigos (mitigação: hard refresh) |
| P4 | Info | `test@example.com` documentado em Cypress **não** autentica na API Fly de produção |

**Regressão visual crítica em produção:** **nenhuma** detectada ao nível de deploy/artefactos. **Rollback:** não executado.

---

## 7. Decisão

### **PASS COM RESSALVAS**

| Critério | Status |
|----------|--------|
| `/meta` = `4e90e9b` | **PASS** |
| `/health` ok | **PASS** |
| Bundle `index-CZEHatgf.js` no HTML/SW | **PASS** |
| Coordenadas H3.5l no bundle / `main` | **PASS** |
| Visual pixel `/game` (sessão real) | **RESSALVA** — não executado |
| «Não precisa subir/descer mais» | **RESSALVA** — confirmar com olho humano |

**Recomendação:** utilizador com sessão válida abrir `/game` (janela anónima ou após limpar cache), confirmar `index-CZEHatgf.js` no Network e verificar zonas/bola **~12px mais altas** que o print H3.5k, mantendo simetria horizontal.

**Merge adicional:** não aplicável (H3.5n já em produção).

---

## Metodologia

- `Invoke-RestMethod` → Fly `/meta`, `/health`
- HTTP → `www.goldeouro.lol` HTML, `index-CZEHatgf.js`, `sw.js`
- `git show origin/main:goldeouro-player/src/game/layoutConfig.js`
- MCP browser → login + `/game` (sem sessão válida)
- `POST /api/auth/login` (Fly) — 401
- Referência [H3-5K](H3-5K-MERGE-CONTROLADO-PR89-2026-05-16.md) · [H3-5N](H3-5N-MERGE-CONTROLADO-PR90-2026-05-16.md)

**Sem alteração de código. Sem commit. Sem deploy. Sem rollback.**
