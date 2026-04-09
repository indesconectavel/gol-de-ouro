# Dossiê de encerramento e handoff — V1 — Gol de Ouro

**Data:** 2026-04-09  
**Modo de elaboração:** **READ-ONLY** (sem alterações a código, infra, base de dados ou deploys; validações por leitura de ficheiros, `git`, pedidos HTTP e relatórios existentes.)

**Propósito:** documento único para **abrir um novo chat sem perda de contexto** — estado real de produção, código, deploy, histórico, riscos e continuidade operacional.

---

## BLOCO 1 — Produção (realidade actual)

### Domínio canónico

- **URL:** `https://www.goldeouro.lol`

### Validação HTTP (HEAD, 2026-04-09 — ambiente de auditoria)

| Rota | HTTP | `X-Vercel-Error` |
|------|------|------------------|
| `/` | **200** | ausente |
| `/game` | **200** | ausente |
| `/dashboard` | **200** | ausente |
| `/profile` | **200** | ausente |
| `/register` | **200** | ausente |

### SPA e montagem React

- O `index.html` do player define `<div id="root"></div>` e `game-overlay-root` para overlays; o bundle Vite monta a aplicação em `#root` (`goldeouro-player/index.html`, `main.jsx`).
- **Rotas directas** (`/game`, `/dashboard`, etc.) respondem **200** com `text/html`: o `vercel.json` usa fallback `/(.*) → /index.html` após `filesystem`, compatível com SPA (sem `cleanUrls`).

### Regressão visual (evidência)

- Relatório operacional e capturas em `ENCERRAMENTO-OFICIAL-V1-2026-04-09.md`: login, dashboard, jogo tipo penalty, pagamentos, saque, perfil; **sem** banner de versão indesejado nas vistas testadas; **sem** “tela antiga” como experiência principal em `/game`.

**Síntese BLOCO 1:** produção **alcançável**, **HTTP 200** nas rotas verificadas, **sem** cabeçalho `X-Vercel-Error` nesses pedidos; SPA coerente com configuração actual.

---

## BLOCO 2 — Experiência do utilizador

### Código-fonte (fonte da verdade)

| Verificação | Evidência |
|-------------|-----------|
| `/game` → **GameFinal** | `App.jsx`: rota `/game` renderiza `<GameFinal />` dentro de `ProtectedRoute`. `GameShoot` existe como módulo legacy e rota separada `/gameshoot`. |
| Banner | `VersionWarning.jsx`, `VersionBanner.jsx` e `vite.config.ts`: exibição apenas se `import.meta.env.VITE_SHOW_VERSION_BANNER === 'true'`; default injecção `'false'`. |
| Fluxo login → dashboard → jogo → pagamento → saque | Rotas: `/` (login), `/dashboard`, `/game`, `/pagamentos`, `/withdraw`; `AuthContext` + `apiClient` para API. |

### Classificação

| Critério | Classificação |
|----------|----------------|
| Jogo principal em `/game` | **OK** — GameFinal |
| Banner | **OK** — gate explícito |
| Fluxo completo (código + smoke manual documentado) | **OK** — smoke em janela anónima referido no encerramento oficial |

**Síntese BLOCO 2:** **OK** (com nota: rotas legacy `/gameshoot` e ficheiros `GameShoot*` mantidos no repo para compatibilidade/diagnóstico; não são o caminho principal de `/game`.)

---

## BLOCO 3 — Git (fonte da verdade)

### Estado verificado localmente (`goldeouro-backend`)

| Campo | Valor |
|-------|--------|
| **HEAD** | `277cf1629f41582bdda396b4b3f12668faa314e1` |
| **Último commit** | `Merge pull request #56 from indesconectavel/fix/restaurar-baseline-player-2026-04-09` |
| **PR #56** | Mergeado (mensagem de merge presente no histórico) |

### Conteúdo do player em `main` (confirmação por ficheiros)

| Requisito | Estado |
|-----------|--------|
| `GameFinal` na rota `/game` | Sim (`App.jsx`) |
| Gate de banner (`VITE_SHOW_VERSION_BANNER`) | Sim (`vite.config.ts`, componentes de versão) |
| `vite.config.ts` com `define` correcto | Sim |
| `vercel.json` **sem** `cleanUrls` | Sim — ficheiro actual não contém `cleanUrls`; inclui `routes` com fallback SPA |

### `main` vs produção

- A linha de `main` em **`277cf16`** foi documentada como alinhada ao deployment **Current** do projecto **`goldeouro-player`** após o merge do PR #56 (`MERGE-FINAL-PR56-…`, `ENCERRAMENTO-OFICIAL-V1-…`).
- **Confirmação:** assumir que `origin/main` está sincronizado com o mesmo SHA após `git pull` habitual; o handoff assume **main = linha de produção do player** na data do encerramento.

---

## BLOCO 4 — Vercel

### Projecto

- **Nome:** `goldeouro-player` (equipa `goldeouro-admins-projects` — referência nos relatórios de restore/promote).

### Deployment Current (evidência documentada)

- **Commit** associado ao *Current* em produção: **`277cf16`** (merge PR #56), estado **Ready**, branch **`main`** — conforme dashboard capturado e `ENCERRAMENTO-OFICIAL-V1-2026-04-09.md`.

### Pipeline

- Merge em `main` dispara workflow de **Frontend Deploy** (GitHub Actions) com deploy de produção (`MERGE-FINAL-PR56-…`).
- **Promote manual** foi usado **antes** do merge final para alinhar produção à linha `2785aae` (`RESTAURACAO-PRODUCAO-DEFINITIVA-2026-04-09.md`); após PR #56, o *Current* passou a refletir o deploy **automático** a partir de `main` com **`277cf16`**.

**Síntese BLOCO 4:** projecto correcto; *Current* alinhado a **`main`** pós-PR56; histórico inclui interveneção manual pontual seguida de estabilização por merge.

---

## BLOCO 5 — Histórico crítico (narrativa operacional)

1. **Problema original (resumo):** regressão de experiência no player (incl. confusão SPA / `cleanUrls`, risco de deploy com build errado ou linha não desejada).
2. **Dois mundos:** repositório **backend** (`goldeouro-backend`) vs app **player** em subpasta `goldeouro-player`; projecto Vercel **`goldeouro-player`** vs outros projectos (ex. nomes com *backend*) — fácil inspeccionar o deploy errado ou aplicar bypass ao host incorrecto.
3. **Rollback / linha incorrecta:** produção pode ficar num deployment mais recente porém **regressivo** em conteúdo; necessidade de **promote** para um SHA conhecido bom (`2785aae`).
4. **Desalinhamento `main` vs produção:** código em `main` não reflectia o que os utilizadores viam até alinhar Git + Vercel (merge PR #56 + deploy automático).
5. **Correcção:** branch `fix/restaurar-baseline-player-2026-04-09`, PR #56, merge **`277cf16`**, saneamento e restauração da baseline (GameFinal, banner gate, `vercel.json` sem `cleanUrls`).
6. **Estabilização final:** smoke manual em InPrivate; Vercel *Current* em `277cf16`; tag **`PRODUCAO-ESTAVEL-2026-04-09`** referida no encerramento.

---

## BLOCO 6 — Arquitetura actual

### Frontend (player)

- **Stack:** React, Vite, React Router, Tailwind (padrão do projecto), PWA (plugin Vite).
- **Hospedagem:** Vercel (`vercel.json`: build `npm run build`, saída `dist`, headers de segurança, rotas SPA).
- **Domínios:** `www.goldeouro.lol`, `goldeouro.lol`, `app.goldeouro.lol` (aliases documentados nos relatórios de restore).

### Backend

- **Runtime:** Node.js (Express — `server-fly.js` / variantes de deploy).
- **Hospedagem:** Fly.io — `fly.toml`: app **`goldeouro-backend-v2`**, região `gru`, health check `GET /health`, processo worker de payouts.
- **API base (player):** default `https://goldeouro-backend-v2.fly.dev` (`goldeouro-player/src/config/api.js`, variável `VITE_BACKEND_URL`).

### Base de dados e auth

- **Supabase (Postgres)** via `@supabase/supabase-js` no backend (`database/supabase-unified-config.js`, `server-fly.js`); credenciais por ambiente.

### Fluxo de negócio (alto nível)

1. **Registo / login** → token JWT armazenado no cliente; `AuthContext` mantém sessão.
2. **Saldo** → API backend + dados de utilizador/transacções.
3. **Jogo** (`/game`, GameFinal) → interacção com API/WebSocket conforme implementação (penalty / chutes).
4. **Pagamentos** → PIX / Mercado Pago (variáveis e webhooks no backend).
5. **Saque** → pedidos e worker de processamento (`payout_worker` no Fly).

---

## BLOCO 7 — Riscos

| Risco | Classificação | Nota |
|-------|----------------|------|
| Deploy de produção com build errado ou branch incorrecta | **MÉDIO** | Mitigar com PRs, checks CI, e **sempre** confirmar projecto `goldeouro-player` e commit no Vercel. |
| Confusão entre projectos Vercel (player vs backend) | **MÉDIO** | Nomenclatura e bookmarks; inspeccionar **githubCommitSha** no deployment. |
| Backend Fly não monitorizado neste dossiê além de `/health` pontual | **BAIXO–MÉDIO** | Health respondeu **200** com DB/MercadoPago *connected* no momento do check; auditoria completa requer dashboard Fly + logs. |
| Filas / consistência de trabalhos (saques, webhooks) | **MÉDIO** | Worker dedicado existe; escala e idempotência devem ser revisados na V2. |
| Antifraude / abuso | **ALTO** (negócio) | Produto financeiro; camada antifraude não detalhada neste documento — prioridade V2. |
| Dependência de promote manual em incidentes | **BAIXO** | Útil como pára-quedas; risco é **procedimento** mal documentado — este handoff reduz esse risco. |

---

## BLOCO 8 — Status final da V1

**Classificação:** **OPERACIONAL E ESTÁVEL**

Justificativa: rotas principais com **HTTP 200** e sem `X-Vercel-Error` nos testes; backend com **`/health` OK** e DB/MercadoPago reportados como ligados; `main` em **`277cf16`** com GameFinal e configuração SPA acordada; evidência manual e Vercel *Current* documentados nos relatórios de 2026-04-09.

---

## BLOCO 9 — Contexto para continuidade (onboarding rápido)

### O que é o projecto

**Gol de Ouro** é uma aplicação web de jogo/apostas desportivas (penalty) com carteira: o **jogador** usa o **player** (React) em Vercel; o **backend** em Fly expõe API REST (e recursos auxiliares) e liga-se ao **Supabase**.

### Como funciona (uma frase)

O browser carrega a SPA, autentica-se contra o backend, e todas as operações sensíveis (saldo, chutes, PIX, saques) passam pelo backend e pela base de dados.

### Como fazer deploy (fluxo correcto)

1. Alterações no player: trabalhar em branch, PR para `main`, passar CI.
2. Merge em `main` → GitHub Actions faz deploy Vercel de **`goldeouro-player`** (confirmar workflow e scope).
3. Backend: deploy Fly tipicamente via pipeline ou `fly deploy` (fora do âmbito deste doc read-only).

### Como evitar o erro anterior

- **Nunca** confundir o projecto Vercel **goldeouro-player** com projectos só de diagnóstico/backend.
- **Evitar** reintroduzir `cleanUrls` se quebrar o fallback SPA (histórico PR55/56).
- Garantir que **`/game`** continua a apontar para **GameFinal** em `App.jsx` ao integrar novas features.
- Usar **promote** apenas como medida de emergência com SHA conhecido e registo em `docs/relatorios/`.

### Fluxo de desenvolvimento recomendado

Feature branch → PR → revisão → checks verdes → merge `main` → validar deploy e smoke nas rotas canónicas (idealmente InPrivate).

---

## BLOCO 10 — Próxima fase (V2) — sugestões

| Área | Ideias |
|------|--------|
| **Técnica** | Testes E2E críticos (login, `/game`, PIX); observabilidade unificada (logs Fly + Vercel); revisão de cache PWA vs freshness de API. |
| **Produto** | Onboarding, limites responsáveis, melhor feedback de erro de rede. |
| **Monetização** | Bundles de chutes, campanhas; sempre com conformidade legal e registo. |
| **Escala** | Filas persistentes (Redis/SQS) para webhooks e saques; rate limiting; revisão de custos Fly/Vercel. |

---

## Evidência suplementar — backend Fly (read-only)

Pedido **GET** `https://goldeouro-backend-v2.fly.dev/health` (2026-04-09, auditoria):

- **HTTP 200**, corpo JSON com `"status":"ok"`, `"database":"connected"`, `"mercadoPago":"connected"`, versão reportada **1.2.1**.

*(Valores dinâmicos — `timestamp`, contadores — variam no tempo.)*

---

## Referências internas (leitura)

- `docs/relatorios/ENCERRAMENTO-OFICIAL-V1-2026-04-09.md`
- `docs/relatorios/MERGE-FINAL-PR56-ALINHAMENTO-MAIN-2026-04-09.md`
- `docs/relatorios/RESTAURACAO-PRODUCAO-DEFINITIVA-2026-04-09.md`
- `goldeouro-player/src/App.jsx`, `goldeouro-player/vercel.json`, `goldeouro-player/vite.config.ts`
- `fly.toml` (raiz do backend)

---

## Classificação final

**V1 FINALIZADA — PRONTA PARA ESCALA**

---

*Documento gerado para handoff; qualquer número de deployment, run de CI ou estado de fila deve ser revalidado na data de uso em produção.*
