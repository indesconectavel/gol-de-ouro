# F3 — AUDITORIA GLOBAL FINAL V1
# FRONTEND + PAINEL + UX + GOVERNANÇA

**Modo:** READ-ONLY (sem alterações de código, deploy, banco, workflows ou commits)  
**Data da auditoria:** 2026-05-15 (sessão F3)  
**Branch (repo backend):** `fix/admin-financial-integrity-v1`  
**HEAD:** `deec98d8161c7e6e69d5c98415922665ae065ae6` (`deec98d`)  
**Contexto:** F1 e F2 versionadas · runtime Fly v452 · T14A validado com ressalvas (relatório 2026-05-12)

---

## 1. Resumo executivo

Auditoria **F3** do ecossistema visual e operacional V1: **player** (`www` / `app`), **painel admin** (`admin.goldeouro.lol`), **UX crítica** (código-fonte + probes HTTP públicos) e **governança** (Git, Vercel, repositórios).

**Conclusão:** ambos os frontends estão **disponíveis em produção** (HTTP **200**, shell SPA com bundle JS válido). O admin está **alinhado ao backend T14A** (`/api/admin/*` no bundle de produção; literal legado `/admin/lista-usuarios` **ausente**). O player aponta para **`https://goldeouro-backend-v2.fly.dev`** e expõe rotas críticas no código (`/pagamentos`, `/withdraw`, `/game`, auth).

**Limitações desta sessão:** sem credenciais de admin/jogador — **não** foi repetido smoke autenticado completo (login → todas as páginas → Network). Evidência de dashboard com dados reais provém de **T14A** e de **probes de bundle/rotas**.

**Classificação oficial F3:** **F3 APROVADO COM RESSALVAS**

| Dimensão | Resultado |
|----------|-----------|
| Player disponível | ✅ |
| Admin disponível | ✅ |
| Deep links admin (HTTP) | ✅ 200 (rewrite SPA) |
| Rotas críticas no código | ✅ |
| `/admin/...` legado no bundle prod | ✅ Ausente |
| UX autenticada E2E nesta F3 | ⚠️ Não executada |
| Governança Git / monorepo admin | ⚠️ Ressalvas |

---

## 2. Estado Git

### Comandos

```text
git status --short
git branch --show-current
git log -5 --oneline
```

### Registo

| Campo | Valor |
|-------|--------|
| **HEAD** | `deec98d` — *docs: registrar F2 auditoria financeiro ledger pix saques V1* |
| **Branch** | `fix/admin-financial-integrity-v1` |
| **`vercel.json` modificado** | `goldeouro-player/vercel.json` — diff de conteúdo **vazio** no Git; apenas aviso **CRLF/LF** no working copy |
| **Arquivos `??`** | 18 relatórios `docs/relatorios/`, 1 SQL `database/`, 5 `scripts/` (operacionais, fora F3) |
| **`.gitmodules`** | **Ausente** no repo parent |

### Repositório `goldeouro-admin`

| Item | Valor |
|------|--------|
| Pasta no monorepo | `goldeouro-admin/` |
| **`.git` aninhado** | **Sim** — repositório Git **separado** |
| **HEAD local admin** | `bb41c40` — *fix: alinhar painel admin V1 ao runtime real T14A* |
| **No índice do parent** | Código presente em disco; **governança dual-repo** (parent + admin) |

### Baseline

- F1/F2 documentadas em `fe7b7ac` / `deec98d`.
- Painel admin em produção com bundle **`index-d541bc94.js`** (pode divergir do `dist/` local `index-760a96d3.js`).

---

## 3. Frontend Player

### 3.1 Domínios

| Domínio | HTTP | Content-Type | Tamanho shell |
|---------|------|--------------|---------------|
| `https://www.goldeouro.lol` | **200** | `text/html` | ~1299 B |
| `https://app.goldeouro.lol` | **200** | `text/html` | ~1299 B |
| `https://goldeouro.lol` (apex) | **307** redirect | — | — |

**Bundle produção (www):** `/assets/index-CoJBA5Cq.js` + CSS `index-B3MUvJMy.css`  
**Título:** «Gol de Ouro - Jogador» · PWA (`manifest.webmanifest`, `registerSW.js`)

### 3.2 Rotas HTTP (shell SPA — todas 200)

Probes em `www` e `app` (comportamento idêntico):

| Path | HTTP | Rota React em `App.jsx` |
|------|------|-------------------------|
| `/` | 200 | ✅ Login |
| `/register` | 200 | ✅ |
| `/dashboard` | 200 | ✅ (protegida) |
| `/game` | 200 | ✅ → `GameFinal` |
| `/withdraw` | 200 | ✅ |
| `/login` | 200 | ⚠️ **Sem Route** — shell carrega, router não mapeia |
| `/deposit` | 200 | ⚠️ **Sem Route** — depósito real é **`/pagamentos`** |
| `/manifest.webmanifest` | 200 | — |
| `/api/health` | 200 | ⚠️ Resposta **não** é JSON de backend nesta sessão (proxy/HTML); app usa **Fly direto** |

### 3.3 Integração backend (código)

| Área | Implementação |
|------|----------------|
| **Base URL** | `VITE_BACKEND_URL` ou default `https://goldeouro-backend-v2.fly.dev` (`goldeouro-player/src/config/api.js`) |
| **Login/registro** | `/api/auth/login`, `/api/auth/register` |
| **PIX** | `POST /api/payments/pix/criar`, `GET /api/payments/pix/usuario` (`Pagamentos.jsx`) |
| **Saque** | `POST ${API_ENDPOINTS.WITHDRAW}/request` → `/api/withdraw/request` (`Withdraw.jsx`) |
| **Jogo** | `/api/games/shoot` |
| **Auth** | JWT `localStorage.authToken`; `ProtectedRoute` com loading + redirect `/` |
| **Erros globais** | `ErrorBoundary`, `react-toastify` |
| **Versão** | `VersionWarning` (banner só se `VITE_SHOW_VERSION_BANNER=true`) |

### 3.4 UX crítica (código)

| Fluxo | Estados |
|-------|---------|
| Auth | Loading «Verificando autenticação…»; redirect se não autenticado |
| Saque | Validação PIX, taxa R$ 2, histórico via API, `idempotency` implícita no client |
| Depósito | Valores pré-definidos; toast em erro |
| Jogo | Múltiplas variantes de página (`GameFinal`, `GameShoot`, fallbacks) — rota prod **`/game`** |

### 3.5 Riscos player

| Risco | Nível |
|-------|-------|
| URLs incorretas (`/login`, `/deposit`) → ecrã vazio no router | Médio (UX) |
| PWA/cache (`PwaSwUpdater`, SW) | Leve |
| CSP removido no HTML prod («MVP») | Médio (segurança front) |
| Dependência CORS direta Fly (não `/api` proxy em www) | Mitigado se CORS backend OK |

**Tela branca:** **não** observada nos shells HTML; risco residual em **rotas não mapeadas** após load JS.

---

## 4. Frontend Admin

### 4.1 Domínio produção

| Item | Valor |
|------|--------|
| URL | `https://admin.goldeouro.lol` |
| HTTP `/` | **200** (~1466 B HTML) |
| Bundle prod | `/assets/index-d541bc94.js` |
| CSP (index local dist) | `connect-src` inclui `goldeouro-backend-v2.fly.dev` |
| API default | `getApiUrl()` → `VITE_API_URL` ou **`https://goldeouro-backend-v2.fly.dev`** (`env.js`) |

### 4.2 Deep links HTTP (rewrite SPA)

Todas **200** (correção pós diagnóstico 2026-05-04 que reportava **404** em `/painel` e `/saque-usuarios`):

| Path | HTTP | Rota em `AppRoutes.jsx` |
|------|------|-------------------------|
| `/painel` | 200 | ✅ Dashboard |
| `/lista-usuarios` | 200 | ✅ Users |
| `/saque-usuarios` | 200 | ✅ SaqueUsuarios |
| `/auditoria` | 200 | ✅ |
| `/logs` | 200 | ✅ LogsSistema |
| `/chutes` | 200 | ✅ ChutesRecentes |
| `/transacoes` | 200 | ✅ |
| `/relatorio-financeiro` | 200 | ✅ |
| `/exportar-dados` | 200 | ✅ |
| `/usuarios-bloqueados` | 200 | ✅ |
| `/login` | 200 | ✅ |
| `/users`, `/dashboard`, `/saques` | 200 shell | ⚠️ **Sem Route** — UI vazia se navegado |

### 4.3 Endpoints reais (fonte + bundle produção)

Verificação no JS **`index-d541bc94.js`** em produção:

| Literal | No bundle prod |
|---------|----------------|
| `/api/admin/users/list` | ✅ **FOUND** |
| `lista-usuarios` | ✅ (path React) |
| `/admin/lista-usuarios` | ✅ **NOT FOUND** |

### 4.4 Mapa página → API

| Página | Rota | Endpoint / comportamento |
|--------|------|-------------------------|
| Dashboard | `/`, `/painel` | `GET /api/admin/dashboard/stats` |
| Usuários | `/lista-usuarios` | `GET /api/admin/users/list`; block/unblock POST |
| Relatório por usuário | `/relatorio-por-usuario/:id` | `GET /api/admin/users/:id` |
| Auditoria | `/auditoria` | `GET /api/admin/audit/logs` |
| Logs sistema | `/logs` | `GET /api/admin/audit/logs` (mesma fonte) |
| Chutes | `/chutes` | `GET /api/admin/chutes/recentes` |
| Transações | `/transacoes` | `GET /api/admin/financial/report` |
| Saques admin | `/saque-usuarios` | `GET /api/admin/withdraw/list`; approve/cancel POST |
| Relatório geral | `/relatorio-geral` | stats + financial report |
| Exportar | `/exportar-dados` | Aviso: legado `/admin/exportar` **não** existe |
| **Fallback honesto** | `/fila`, `/backup`, `/top-jogadores`, `/configuracoes`, `/relatorio-semanal` | Mensagem explícita «sem endpoint» — **sem mock enganoso** |
| Login | `/login` | `POST /api/auth/login` → token `admin-token` |

### 4.5 Auth e proteção

- `MainLayout`: `isAuthenticated()` → redirect `/login`; estado loading.
- `api.js`: **401/403** → logout + redirect login.
- Login admin valida `tipo === 'admin'` (fluxo em `Login.jsx` pós resposta).

### 4.6 Evidência T14A (sessão anterior, citada)

Dashboard autenticado com métricas reais (ex.: 464 utilizadores, saldos, ledger) — ver `VALIDACAO-FUNCIONAL-T14A-PAINEL-ADMIN-V1-2026-05-12.md`. **Não repetido** nesta F3 por falta de credenciais.

---

## 5. UX e estados

### 5.1 Classificação por padrão

| Padrão | Admin | Player |
|--------|-------|--------|
| **Loading** | ✅ Dashboard, listas, StandardLoader no login | ✅ ProtectedRoute, formulários |
| **Empty state** | ✅ Várias páginas («Nenhum dado…») | ✅ Withdraw histórico vazio |
| **Error state** | ✅ `error` em vermelho (Dashboard, listas) | ✅ toast + ErrorBoundary |
| **Sessão expirada** | ✅ redirect login em 401 | ✅ logout / redirect `/` |
| **Logout** | ✅ Sidebar + `/logout` | ✅ TopBar / contexto auth |
| **Refresh** | ✅ Re-fetch em várias páginas | ✅ Pagamentos `skipCache` |
| **Responsividade** | ✅ Sidebar mobile (código) | ✅ Layouts internos |
| **Botões críticos** | ✅ Aprovar/cancelar saque com loading por id | ✅ Saque disabled até validação |

### 5.2 UX aprovada (crítico operacional)

- Login admin e player **existem** e comunicam com Fly v2.
- Rotas **oficiais** admin (`/lista-usuarios`, `/saque-usuarios`, `/auditoria`) mapeadas.
- Player: `/`, `/dashboard`, `/pagamentos`, `/withdraw`, `/game` mapeadas.
- Páginas sem backend **declaram** limitação (não inventam dados).

### 5.3 UX com ressalvas

- Rotas «conveniência» HTTP 200 mas **sem componente** (`/users`, `/deposit`, `/login` no player).
- Relatório semanal / top jogadores / backup — **apenas** mensagem informativa.
- Validação autenticada **incompleta** nesta sessão F3.

### 5.4 UX crítica (bloqueio)

- **Nenhuma** tela branca no shell HTML inicial.
- **Nenhum** 404 HTTP em deep links admin (regressão maio/2026 **corrigida** em runtime atual).

---

## 6. Governança frontend

| Tópico | Estado F3 |
|--------|-----------|
| **Vercel player** | Projeto no monorepo `goldeouro-player/`; `vercel.json` com CSP, cache, rewrite SPA `/* → index.html` |
| **Vercel admin** | Deploy documentado: projeto `goldeouro-admin`; domínio `admin.goldeouro.lol` |
| **`vercel.json` local** | Modificado só em finais de linha (warning CRLF); **não** staged |
| **Admin repo aninhado** | `goldeouro-admin/.git` — risco de **drift** parent vs admin remoto |
| **`.gitmodules`** | Ausente — admin **não** é submódulo formal do backend |
| **Bundle drift** | Local admin `index-760a96d3.js` ≠ prod `index-d541bc94.js` |
| **Deploy acidental** | Risco **médio** se `vercel --prod` for executado da pasta errada ou com env errado |
| **Dependabot** | GitHub reporta **114** vulnerabilidades na branch default (informativo no push) |
| **CORS preview Vercel** | URLs `*.vercel.app` podem falhar login (documentado Cirurgia 8); produção custom domain OK |

---

## 7. Integração geral

```text
┌─────────────────┐     JWT      ┌──────────────────────────────┐
│  Player SPA     │─────────────►│ goldeouro-backend-v2.fly.dev │
│  www / app      │   /api/*     │ F1 ✅  F2 ✅  v452           │
└─────────────────┘              └──────────────────────────────┘
┌─────────────────┐     JWT      │  /api/admin/*  (401 s/ token) │
│  Admin SPA      │─────────────►│  /meta gitCommit 7ecedca     │
│  admin.…lol     │              └──────────────────────────────┘
└─────────────────┘
```

| Verificação | Resultado |
|-------------|-----------|
| Player → backend URL | ✅ `goldeouro-backend-v2.fly.dev` |
| Admin → backend URL | ✅ Normalizado para v2 em `env.js` |
| Endpoints admin F1 | ✅ 401 anónimo (rotas vivas) |
| Endpoints financeiros F2 | ✅ Protegidos |
| Runtime rastreável | ✅ `/meta` com `gitCommit` (H2) |
| Regressão 404 admin API | ✅ Mitigada (T14A) |
| Regressão 404 admin SPA deep link | ✅ Mitigada (probes 2026-05-15) |

---

## 8. Riscos críticos

**Nenhum** risco crítico aberto que impeça disponibilidade dos dois frontends ou exposição óbvia de rotas legado `/admin/*` no bundle de produção.

---

## 9. Riscos médios

| ID | Risco | Domínio |
|----|-------|---------|
| M1 | `goldeouro-admin` como repo Git **separado** sem submódulo | Governança |
| M2 | Smoke E2E autenticado **não** repetido na F3 | Admin / UX |
| M3 | Rotas HTTP 200 sem match React (`/deposit`, `/users`, …) | UX |
| M4 | CSP removido no player prod (comentário MVP) | Player / segurança |
| M5 | Drift bundle local vs produção (admin) | Deploy |
| M6 | `vercel.json` player com alteração CRLF não commitada | Governança Git |
| M7 | Login admin depende de CORS só em domínio custom | Vercel / domínio |

---

## 10. Riscos leves

| ID | Risco | Domínio |
|----|-------|---------|
| L1 | Páginas admin «placeholder» (fila, backup, top jogadores) | UX |
| L2 | Duplicação `/logs` e `/auditoria` (mesma API) | UX |
| L3 | Apex `goldeouro.lol` 307 → www | Domínio |
| L4 | Version banner player desligado por default | Observabilidade |
| L5 | Many `??` docs/scripts no parent repo | Governança |

---

## 11. Riscos mitigados

| Risco histórico | Mitigação |
|-----------------|-----------|
| 404 SPA admin em deep links | Probes 2026-05-15: **200** em `/painel`, `/saque-usuarios` |
| POST `/admin/lista-usuarios` | **Ausente** do bundle prod; uso de `/api/admin/users/list` |
| Mock/fake data no admin | Páginas com aviso honesto; Dashboard usa API real |
| Tela branca login admin | T14A: formulário OK |
| Painel chamando backend v1 fly.dev errado | `env.js` força normalização v2 |
| Player saque URL errada | `Withdraw.jsx` usa `/api/withdraw/request` |
| Integração PIX player | `Pagamentos.jsx` → `/api/payments/pix/criar` |

---

## 12. Diagnóstico global

Os frontends V1 estão **publicados, alcançáveis e estruturalmente alinhados** ao backend pós-T14A/F1/F2. O painel evoluiu de diagnósticos de **404 Vercel** (início maio) para **rewrite SPA funcional** e **cliente API moderno**. O player mantém fluxos críticos no código com **backend v2** explícito.

A **governança** continua a ser o principal gap: monorepo «visual» no disco vs **dois repositórios Git**, working tree suja, e validação autenticada dependente de operador humano.

```text
Disponibilidade CDN     ████████████████████  Alta
Alinhamento API admin   ███████████████████░  Alta
Player fluxos críticos  ██████████████████░░  Alta
UX E2E homologada       ████████░░░░░░░░░░░░  Parcial
Governança repo/deploy  ████████░░░░░░░░░░░░  Média
```

---

## 13. Recomendação oficial

### Classificação F3: **F3 APROVADO COM RESSALVAS**

**Critérios F3 APROVADO:**

| Critério | Cumprido |
|----------|----------|
| Frontend player disponível | ✅ |
| Frontend admin disponível | ✅ |
| UX crítica funcional (código + shell) | ✅ |
| Sem tela branca no load inicial | ✅ |
| Rotas críticas respondem HTTP | ✅ |
| Governança sem bloqueio crítico | ⚠️ Ressalvas (dual-repo, tree suja) |

**Ressalvas para fechamento V1:** executar **gate smoke autenticado** (admin + player) com checklist T14A; decidir versionamento/arquivo dos `??`; alinhar ou submodularizar `goldeouro-admin`; commit ou descartar `vercel.json` CRLF.

**Não iniciar F4 neste documento** — aguardar decisão de pipeline global pós-F3.

---

## Anexo A — Probes HTTP (2026-05-15)

```text
www.goldeouro.lol          -> 200  bundle index-CoJBA5Cq.js
app.goldeouro.lol          -> 200
admin.goldeouro.lol        -> 200  bundle index-d541bc94.js
admin /painel              -> 200
admin /lista-usuarios      -> 200
player /withdraw           -> 200
player /pagamentos (code)  -> route exists (not probed as alias /deposit)
fly.dev /meta              -> gitCommit 7ecedca...
```

---

*Fim do relatório F3 — Frontend + Painel + UX + Governança — Gol de Ouro V1.*
