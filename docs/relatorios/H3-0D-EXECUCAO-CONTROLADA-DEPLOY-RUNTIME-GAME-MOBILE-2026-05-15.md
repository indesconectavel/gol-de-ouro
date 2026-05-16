# H3.0D — EXECUÇÃO CONTROLADA /GAME MOBILE

**Data:** 2026-05-15 / 2026-05-16 UTC  
**Objetivo:** publicar **H3.0B** (`dac9f8b`) no player em produção (`www.goldeouro.lol`) e validar runtime.  
**Escopo aplicado:** apenas **`goldeouro-player`** + deploy Vercel — **sem** alterações a backend Fly, `server-fly.js`, Supabase, `gameService`, `layoutConfig`, regras financeiras (read-only confirmação).  
**Deploy backend:** **não executado.**

---

## 1. Resumo executivo

Foi realizado **`npm run build`** local com sucesso e, em seguida, **`npx vercel deploy --prod`** a partir da **raiz do monorepo** (`goldeouro-backend`), com **`.vercel`** apontando para o projeto oficial **`goldeouro-player`** (`prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v`) e **`rootDirectory: goldeouro-player`** (coerente com a configuração remota da Vercel). Foi adicionado **`.vercelignore`** na raiz para **evitar upload do monorepo completo** (~GiB de backups).

Após propagação, **`https://www.goldeouro.lol/`** passou a servir:

- **`<meta viewport … viewport-fit=cover>`**
- bundle JS **`/assets/index-QE2VypN5.js`** contendo **`Gire`**, **`game-rotate`** e **`Saldo insuficiente`** (evidência de **H3.0B + fluxo saldo** no bundle público).

**Smoke visual completo** em `/game` (portrait/landscape/chute) **não foi fechado nesta sessão via MCP** por falta de sessão autenticada estável no browser integrado após o deploy; recomenda-se **validação humana** no telemóvel + hard refresh / limpeza de cache PWA.

**Classificação final:** **APROVADO COM RESSALVAS** — runtime público alinhado com **H3.0B** por evidência objetiva; **ressalvas:** smoke autenticado manual pendente e possível **cache de Service Worker** em clientes antigos.

---

## 2. Estado Git

| Item | Valor |
|------|--------|
| **Branch** | `fix/admin-financial-integrity-v1` |
| **HEAD** | `dac9f8ba012c13607116af7bf15d58a95d242c35` (**`dac9f8b`**) |
| **`dac9f8b` ancestral de HEAD** | Sim |
| **`goldeouro-player/vercel.json`** | **` M `** (alteração local **não** incluída em commit nesta execução — conforme política de não promover `vercel.json` ao Git sem decisão explícita) |
| **Commits criados nesta H3.0D** | **Nenhum** |

**Artefactos locais adicionados para deploy (não versionados por omissão):**

- `goldeouro-backend/.vercel/` (link projeto na **raiz** do repo para CLI)
- `goldeouro-backend/.vercelignore` (redução de payload)

---

## 3. Build local

**Comando:** `cd goldeouro-player && npm run build`  
**Resultado:** **OK** (~26s)

| Artefacto local (exemplo) | Observação |
|---------------------------|------------|
| `dist/index.html` | contém **`viewport-fit=cover`** |
| `dist/assets/index-Bp_GpQhP.js` | contém **`Gire`** e **`game-rotate`** (validação local por substring) |
| `dist/assets/index-DMJTzLg7.css` | CSS agregado |

*Nota:* o hash do JS **no servidor Vercel** (`index-QE2VypN5.js`) **difere** do hash local (`index-Bp_GpQhP.js`) porque a Vercel **voltou a executar `vite build`** no ambiente remoto (timestamps injetados por `inject-build-info.cjs` diferentes).

---

## 4. Deploy Vercel

### 4.1 Projeto oficial

| Campo | Valor |
|-------|--------|
| **Organização** | `goldeouro-admins-projects` |
| **Projeto** | **`goldeouro-player`** |
| **Project ID** | `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v` |
| **Root Directory (remoto)** | `goldeouro-player` |

### 4.2 Problema CLI corrigido nesta execução

- **`vercel deploy`** **dentro** de `goldeouro-player/` falhava com path duplicado `...\goldeouro-player\goldeouro-player` (Root Directory remoto + CWD).
- **Solução aplicada:** `.vercel` na **raiz** `goldeouro-backend` + **`npx vercel deploy --prod`** a partir dessa raíz + **`.vercelignore`** para não ultrapassar limite de upload.

### 4.3 Deployment (produção)

| Campo | Valor |
|-------|--------|
| **Comando** | `cd goldeouro-backend && npx vercel deploy --prod --yes` |
| **Inspect** | `https://vercel.com/goldeouro-admins-projects/goldeouro-player/Cqsmvr7FQ1aaaJuz5pKLUrh8fZAQ` |
| **URL deployment (alias técnico)** | `https://goldeouro-player-h6sha9hxu-goldeouro-admins-projects.vercel.app` |
| **Projeto temporário `dist`** | **Evitado** para este deploy de produção oficial |

**Build remoto (extracto logs):** `npm install` + `npm run build` em `/vercel/path0/goldeouro-player/` — commit Git **não** foi inferido automaticamente neste relatório; fonte é o **filesystem enviado** + branch local **`dac9f8b`** sem mudanças em `src/` do player.

---

## 5. Runtime em produção

**Verificação:** `GET https://www.goldeouro.lol/` — **HTTP 200**

**Trechos observados no HTML público:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<script type="module" crossorigin src="/assets/index-QE2VypN5.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-DMJTzLg7.css">
```

**Bundle JS público** (`/assets/index-QE2VypN5.js`):

| Substring | Presente |
|-----------|----------|
| `Gire` | Sim |
| `game-rotate` | Sim |
| `Saldo insuficiente` | Sim |

**Conclusão:** o runtime em **`www.goldeouro.lol`** **incorpora os marcadores da H3.0B** que antes faltavam no diagnóstico H3.0C REAL.

---

## 6. Bundle/HASH validado

| Ambiente | JS principal | CSS principal |
|----------|--------------|---------------|
| **Produção (`www`) pós-deploy** | `index-QE2VypN5.js` | `index-DMJTzLg7.css` |
| **Build local imediato pré-CLI** | `index-Bp_GpQhP.js` | `index-DMJTzLg7.css` |

*Hashes JS diferentes entre local e remoto:* esperado devido a **rebuild na Vercel** + **metadados de build injetados**.

---

## 7. Smoke desktop

| Critério | Resultado |
|----------|-----------|
| `/game` carregado no MCP sem login | **«Verificando autenticação…»** (`ProtectedRoute`) — esperado |
| Regressão óbvia HTML/`/` | Não verificável neste passo sem sessão |

**Recomendação:** repetir smoke desktop **autenticado** pelo utilizador.

---

## 8. Smoke mobile portrait

| Critério | Resultado |
|----------|-----------|
| Overlay **«Gire o celular»** em retrato real | **Não automatizado** nesta sessão MCP |
| Runtime contém strings/DOM necessários | **Sim** (bundle público) |

**Recomendação:** testar **telemóvel físico** em retrato após **hard refresh** ou “limpar dados do site” se o PWA/cache segurar bundle antigo.

---

## 9. Smoke mobile landscape

| Critério | Resultado |
|----------|-----------|
| Jogo + HUD após rotação | **Pendente** validação humana autenticada |

---

## 10. Validação saldo/chute

**Frontend (`GameFinal.jsx`, commit `dac9f8b`):**

- `canShoot = gamePhase === IDLE && balance >= betAmount`
- Zonas com **`disabled={!canShoot}`**
- **`toast.error`** com mensagem **`Saldo insuficiente…`** se `balance < betAmount` no handler

**Backend (`server-fly.js`, não alterado — confirmação read-only):**

- `POST /api/games/shoot` valida saldo e responde **`Saldo insuficiente`** quando aplicável.

**Execução nesta sessão:** **não** foi feita prova transacional de saldo zero em produção (evitar impacto em conta real).

---

## 11. Console/runtime

| Critério | Resultado |
|----------|-----------|
| **`USE_MOCKS` crash em `www.goldeouro.lol`** | **Não esperado** — hostname produção força env sem mocks; substring da mensagem pode existir **no código morto** mas **não** indica disparo por si só |
| **Evidência MCP pós-deploy** | Mistura de mensagens antigas de bundles pré-deploy na mesma sessão de browser — **não usar como prova única** |

**Recomendação:** consola limpa numa **janela privada** + `/game` após deploy.

---

## 12. Rollback

### 12.1 Vercel

1. Painel **Deployments** do projeto **`goldeouro-player`**.
2. Selecionar deployment **estável anterior** ao **`Cqsmvr7FQ1aaaJuz5pKLUrh8fZAQ`**.
3. **Promote to Production** / **Rollback** conforme UI atual da org.

### 12.2 Git

- **Tag rollback referida:** `pre-h3-0b-game-mobile-2026-05-12` (baseline documentado na série H3).
- **Reverter código:** `git checkout <tag ou commit anterior>` **apenas** se política de release exigir — **não** executado aqui.

---

## 13. Classificação final

## **APROVADO COM RESSALVAS**

**Motivos do “aprovado”:**

- Deploy **produção** concluído no projeto **oficial** `goldeouro-player`.
- `www.goldeouro.lol` passou a expor **`viewport-fit=cover`** e bundle com **`Gire`** / **`game-rotate`** — critério objetivo de **H3.0B live**.

**Motivos das “ressalvas”:**

- Smoke **`/game`** autenticado (desktop/mobile/chute/refresh) **não fechado automaticamente** nesta sessão.
- Possível **cache PWA/Service Worker** em utilizadores — pode exigir **atualização forçada**.
- **`goldeouro-player/vercel.json`** permanece **modificado localmente** e **fora do Git** — confirmar se headers CSP/cache desejados em prod coincidem com o ficheiro local antes de futuros commits.

---

**Executado por:** agente (build + Vercel CLI + verificações HTTP + browser MCP parcial)  
**Commits Git:** nenhum criado nesta H3.0D  
