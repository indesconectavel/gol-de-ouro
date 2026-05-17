# H3.5b — SMOKE READ-ONLY — PLAYER PRODUÇÃO

**Data:** 2026-05-16  
**Contexto:** validação rápida pós-baseline [H3.5](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md) (`460ba4e`).  
**Modo:** read-only — sem alteração de código, commit, deploy, SQL, backend ou pipeline.  
**Escopo:** player público `https://www.goldeouro.lol` + confirmação backend Fly.

---

## 1. Resumo executivo

O player em **produção Vercel** está **acessível**, as **rotas SPA principais respondem HTTP 200**, os **assets do build referenciados no `index.html` carregam**, e o **backend Fly** reporta **`/meta` = `460ba4e`** e **`/health` = ok**, alinhado à baseline H3.5.

Testes visuais (browser automatizado, viewport mobile **390×844**) confirmam:
- tela de **login** em `/`;
- **dashboard** funcional (com sessão já presente no browser de teste — ver ressalvas);
- overlay H3.0B **“Gire o celular”** em `/game` em **retrato**, sem erro fatal de abertura do app.

**Não foram observados HTTP 404 ou 500** nas rotas testadas. Rotas desconhecidas devolvem **200 + `index.html`** (rewrite SPA esperado no Vercel).

**Decisão final:** **PASS COM RESSALVAS**

---

## 2. URLs testadas

| URL | Método / ferramenta |
|-----|---------------------|
| `https://www.goldeouro.lol/` | HTTP HEAD + browser |
| `https://www.goldeouro.lol/game` | HTTP HEAD + browser |
| `https://www.goldeouro.lol/dashboard` | HTTP HEAD + browser |
| `https://www.goldeouro.lol/login` | HTTP HEAD + browser |
| `https://goldeouro.lol/` (apex) | HTTP HEAD |
| `https://www.goldeouro.lol/rota-inexistente-smoke-h35b` | HTTP GET (SPA fallback) |
| `https://www.goldeouro.lol/assets/index-ByS331OU.js` | HTTP HEAD |
| `https://www.goldeouro.lol/assets/index-DMJTzLg7.css` | HTTP HEAD |
| `https://goldeouro-backend-v2.fly.dev/meta` | REST |
| `https://goldeouro-backend-v2.fly.dev/health` | REST |

---

## 3. Resultado HTTP

| URL | Status | Notas |
|-----|--------|--------|
| `/` | **200** | `index.html` (~1319 bytes) |
| `/game` | **200** | SPA shell |
| `/dashboard` | **200** | SPA shell |
| `/login` | **200** | SPA shell |
| `goldeouro.lol/` (apex) | **200** | |
| `/rota-inexistente-smoke-h35b` | **200** | Rewrite para `index.html` (comportamento SPA Vercel; **não** é 404 HTTP) |
| `/assets/index-ByS331OU.js` | **200** | Bundle referenciado no HTML actual |
| `/assets/index-DMJTzLg7.css` | **200** | CSS de produção |

**404 / 500:** nenhum nas rotas acima.

**HTML de produção (`/`):**
- `viewport-fit=cover` presente (H3.0B / safe-area).
- Script principal: `/assets/index-ByS331OU.js`.

---

## 4. Resultado visual

| Rota | Viewport | Observação |
|------|----------|------------|
| `/` | 390×844 | Formulário de login (email, senha, “Entrar”, cadastro). App abre sem tela branca. |
| `/dashboard` | 390×844 | Menu “Início”, saldo, botões Jogar / Depositar / Sacar / Perfil. **Requer sessão** — browser de teste já tinha cookie (utilizador de teste genérico; sem credenciais novas introduzidas). |
| `/game` | 390×844 (retrato) | Overlay **“Gire o celular”** / “Use o modo horizontal (paisagem) para jogar.” — comportamento H3.0B esperado em retrato. `GameService` inicializa (consola). |
| `/login` | 390×844 | Carregamento mínimo no snapshot; provável **redirect** por sessão activa (mesmo padrão SPA). |
| `/game` | 844×390 / 1280×720 | Overlay H3.0B ainda presente na árvore acessível do browser automatizado — **emulação de orientação limitada** (ver §5). |

**Consola (browser):** sem `error` de runtime crítico; apenas warnings de áudio/GameService e logs de debug PIX marcados como `error` no nível de consola (não bloqueiam UI).

---

## 5. Estado mobile

| Verificação | Resultado |
|-------------|-----------|
| Viewport emulado 390×844 | OK — login e navegação renderizam |
| H3.0B retrato em `/game` | OK — overlay de rotação visível |
| `viewport-fit=cover` no HTML | OK |
| Paisagem real / jogo sem overlay | **Não validado de forma conclusiva** no browser desktop (resize não reproduz fiavelmente `orientation: landscape` vs. dispositivo físico) |
| Fullscreen / safe-area em hardware | Fora do âmbito deste smoke |

**Recomendação operacional (não bloqueante):** smoke complementar em telemóvel físico para `/game` em paisagem e safe-area (notch).

---

## 6. Estado backend

**`GET https://goldeouro-backend-v2.fly.dev/meta`** (2026-05-16):

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3",
    "environment": "production"
  }
}
```

| Endpoint | Esperado | Observado |
|----------|----------|-----------|
| `/meta` → `gitCommit` | `460ba4e` | **`460ba4e6412b9e66b2eb67f4e8cb06ac0b4552e3`** ✅ |
| `/health` → `status` | `ok` | **`ok`** ✅ |
| `/health` → `database` | conectado | **`connected`** ✅ |

Timestamp `/health` na sessão de teste: `2026-05-16T15:03:37.774Z`.

**Alinhamento com baseline H3.5:** backend de produção coincide com `origin/main` / tag `v1-baseline-460ba4e-2026-05-16`.

---

## 7. Erros encontrados

| ID | Severidade | Descrição |
|----|------------|-----------|
| E1 | Info | Rota fictícia devolve **200** (SPA rewrite) — não é falha de deploy; client-side routing trata 404 lógico. |
| E2 | Baixa | Browser de automação carregou ocasionalmente **`index-QE2VypN5.js`** (hash antigo) enquanto o HTML actual referencia **`index-ByS331OU.js`** — possível **cache / service worker**; não reproduzido em HEAD do HTML fresco. |
| E3 | Baixa | `/dashboard` e `/game` testados com **sessão pré-existente** no profile do browser — não houve login com credenciais reais (conforme regra do prompt). |
| E4 | Baixa | Logs `🔍 [PIX DEBUG]` emitidos como `console.error` no dashboard — ruído de debug, sem impacto HTTP. |
| E5 | Observação | Emulação landscape/desktop não confirmou cena de jogo **sem** overlay; retrato mobile confirmou overlay H3.0B. |

**Nenhum HTTP 500.** **Nenhum 404** nas rotas listadas. **Nenhuma falha de abertura** do app em mobile emulado (retrato).

---

## 8. Decisão final

### **PASS COM RESSALVAS**

| Critério do prompt | Status |
|--------------------|--------|
| URL pública abre | ✅ |
| Rotas principais respondem | ✅ (200) |
| Build Vercel produção acessível | ✅ (assets 200) |
| Sem 404/500 em rotas SPA testadas | ✅ |
| Layout mobile H3.0B não quebrou abertura | ✅ (retrato; overlay OK) |
| Viewport mobile testado | ✅ parcial (390×844) |
| `/meta` = `460ba4e` | ✅ |
| `/health` = ok | ✅ |

**Ressalvas para fechar 100% do smoke:**
1. Validar `/game` em **paisagem em dispositivo real** (fora do browser desktop).
2. Confirmar ausência de bundle antigo após limpar SW/cache (E2).
3. Smoke autenticado controlado (opcional, fase posterior) — fora do escopo “sem login sensível”.

---

## Metodologia

- **HTTP:** `Invoke-WebRequest` (PowerShell), HEAD/GET em produção.
- **Visual / mobile:** MCP `cursor-ide-browser`, resize 390×844 e 844×390, navegação nas rotas.
- **Backend:** `Invoke-RestMethod` em Fly production.
- **Sem** alterações no repositório além deste relatório.

**Relacionado:** [H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md) · [H3-4D-MERGE-CONTROLADO-PR87-2026-05-16.md](H3-4D-MERGE-CONTROLADO-PR87-2026-05-16.md)
