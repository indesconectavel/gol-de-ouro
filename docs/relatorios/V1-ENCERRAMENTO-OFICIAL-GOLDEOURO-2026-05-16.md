# V1 — ENCERRAMENTO OFICIAL — GOL DE OURO

**Data do documento:** 2026-05-16 / 2026-05-17 (UTC)  
**Tipo:** relatório executivo final — encerramento da V1  
**Modo:** exclusivamente documental / read-only  
**Repositório:** `indesconectavel/gol-de-ouro` (monorepo)

**Sem:** alteração de código, pipelines, produção, commits automáticos ou deploy manual nesta etapa.

---

# 1. Resumo executivo

A **V1 do Gol de Ouro** conclui o ciclo de estabilização de um produto real em produção: jogo de penáltis com saldo, depósitos PIX, saques, painel administrativo, rastreabilidade de runtime e governança Git documentada.

| Dimensão | Conclusão |
|----------|-----------|
| **Produto** | Player, admin, backend e integrações financeiras **operacionais** |
| **Produção** | Validada em ambiente real (`www.goldeouro.lol`, Fly, Vercel) |
| **Financeiro** | Integridade administrativa promovida (PR #87, baseline `460ba4e`) |
| **Jogo `/game`** | Geometria estabilizada em fases H3.5 (PRs #88–#91) |
| **Mobile** | H3.0B — portrait bloqueado, landscape com safe-area |
| **Documentação** | Linha H3 completa em `docs/relatorios/` + este encerramento |
| **Encerramento operacional** | Baseline Git, `/meta` e relatórios consolidados em `main` |

A V1 **não** significa ausência de risco: deploy automático em `main`, validação pixel limitada sem credenciais de smoke e hardening de pipeline (H3.6) permanecem como trabalho da fase seguinte.

**Classificação oficial:** ver secção 10.

---

# 2. Baseline oficial

*Captura read-only: 2026-05-17T01:10Z.*

## 2.1 Runtime actual (Fly)

**`GET https://goldeouro-backend-v2.fly.dev/meta`**

| Campo | Valor |
|-------|--------|
| `gitCommit` | **`b55c0e8daa70a1368ac1244617ee1c11912449b7`** |
| `version` | `1.2.1` |
| `build` | `2025-10-21` |
| `environment` | `production` |
| `features.pix` | `true` |
| `features.goldenGoal` | `true` |
| `features.monitoring` | `true` |

**`GET https://goldeouro-backend-v2.fly.dev/health`**

| Campo | Valor |
|-------|--------|
| `status` | **`ok`** |
| `database` | **`connected`** |
| `mercadoPago` | **`connected`** |

## 2.2 Git `origin/main`

| Ref | SHA | Nota |
|-----|-----|------|
| **`origin/main` HEAD** | **`b55c0e8`** | Merge PR #92 — consolidação documental H3.5s |
| Último merge funcional `/game` | **`7156ea2`** | Merge PR #91 — microajuste final Y (H3.5p/r) |
| Baseline financeira/admin | **`460ba4e`** | Merge PR #87 — integridade financeira |
| Baseline histórica (pré-H3.4) | **`7ecedca`** | Ancestral em `main`; tag `pre-h2-runtime-traceability-2026-05-12` |

## 2.3 Player em produção

| URL | `https://www.goldeouro.lol` |
|-----|------------------------------|
| **JS** | `index-CZOAOs6A.js` |
| **CSS** | `index-D7hr6dPE.css` |
| **Coords layout (bundle)** | **490 / 710 / 980** (zonas/bola) confirmadas |

## 2.4 Tags de referência

| Tag | Aponta para | Uso |
|-----|-------------|-----|
| `v1-baseline-460ba4e-2026-05-16` | `460ba4e` | Baseline pós-integridade financeira |
| `pre-h2-runtime-traceability-2026-05-12` | `77464f5` | Rollback Git documentado (H2) |
| `pre-h3-0b-game-mobile-2026-05-12` | `b475647` | Pré-cirurgia mobile `/game` |

## 2.5 Hierarquia de verdade operacional

Conforme [H3.2](H3-2-SOURCE-OF-TRUTH-V1-PLANEAMENTO-2026-05-16.md) e consolidação [H3.5](H3-5-CONSOLIDACAO-BASELINE-OPERACIONAL-460BA4E-2026-05-16.md):

1. **`/meta.gitCommit`** — SHA deployado no Fly  
2. **`/health`** — saúde runtime (não substitui SHA)  
3. **`origin/main`** — fonte Git oficial pós-normalização H3.4  
4. **Bundle player** (`index-*.js`) — evidência do frontend em CDN/Vercel  

---

# 3. Arquitetura consolidada

```text
┌─────────────────────────────────────────────────────────────────┐
│                        UTILIZADOR FINAL                          │
└────────────┬──────────────────────────────┬─────────────────────┘
             │                              │
             ▼                              ▼
   ┌──────────────────┐           ┌──────────────────┐
   │  Player (Vercel) │           │  Admin (Vercel)  │
   │ www.goldeouro.lol│           │admin.goldeouro.lol│
   │ React + Vite PWA │           │ React + painel   │
   └────────┬─────────┘           └────────┬─────────┘
            │         REST / JWT           │
            └──────────────┬───────────────┘
                           ▼
              ┌────────────────────────────┐
              │   Backend API (Fly.io)      │
              │ goldeouro-backend-v2        │
              │ Node.js · server-fly.js     │
              └─────┬──────────────┬───────┘
                    │              │
         ┌──────────┘              └──────────┐
         ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│    Supabase     │                 │  Mercado Pago   │
│  PostgreSQL     │                 │  PIX / webhooks │
│  users, ledger  │                 │  pagamentos     │
└─────────────────┘                 └─────────────────┘
```

| Camada | Tecnologia | Deploy | Domínio / app |
|--------|------------|--------|----------------|
| **Frontend player** | React, Vite, PWA | Vercel (`frontend-deploy.yml`) | `www.goldeouro.lol` |
| **Frontend admin** | React (submódulo/pasta `goldeouro-admin`) | Vercel | `admin.goldeouro.lol` |
| **Backend** | Node.js, Express | Fly.io (`goldeouro-backend-v2`) | `goldeouro-backend-v2.fly.dev` |
| **Base de dados** | PostgreSQL (Supabase) | Gerido Supabase | — |
| **Pagamentos** | Mercado Pago API | Integração backend | webhooks + `/health` |

**Monorepo:** `goldeouro-backend` (API), `goldeouro-player` (jogo), `goldeouro-admin` (operações), workflows em `.github/workflows/`.

---

# 4. Sistema financeiro

Baseline de integridade promovida em **PR #87** (`460ba4e`), documentada em [H3-4D](H3-4D-MERGE-CONTROLADO-PR87-2026-05-16.md) e auditorias F2.

| Área | Estado V1 |
|------|-----------|
| **Depósitos** | PIX via Mercado Pago; crédito em saldo após confirmação |
| **Saques** | Fluxo administrativo com validação; scripts de triagem/reconciliação documentados (read-only, não executados neste encerramento) |
| **Ledger** | Movimentos registados em Supabase; painel admin com visão financeira |
| **Auditoria** | Relatórios F2, gates readonly, reconciliação documentada |
| **Reconcile** | Procedimentos e scripts em `scripts/` (uso operacional sob governação) |
| **Idempotência** | Webhooks e operações críticas com salvaguardas no backend (linha `fix/admin-financial-integrity-v1`) |

**Regra operacional:** qualquer alteração que mova dinheiro exige confirmação de `/meta` + smoke financeiro + relatório GO.

---

# 5. Runtime e rastreamento

| Endpoint | Função |
|----------|--------|
| **`GET /meta`** | `gitCommit`, `version`, `environment`, `features` |
| **`GET /health`** | `status`, `database`, `mercadoPago`, métricas operacionais |

**Mecanismo:** `GIT_COMMIT` injetado no build Docker (`--build-arg GIT_COMMIT=${{ github.sha }}`) → exposto em runtime.

**Baseline e releases:**

- Produção segue **`main`** após merge (deploy automático).  
- Tags anotadas para marcos (`v1-baseline-460ba4e-2026-05-16`).  
- Relatórios H3.x registram cada merge controlado com SHA, pipelines e evidências.

---

# 6. Pipeline operacional actual

Fonte: [H3.6A](H3-6A-AUDITORIA-PIPELINE-REAL-DEPLOY-V1-2026-05-16.md), [H3.6B](H3-6B-PLANEJAMENTO-HARDENING-PIPELINE-V1-2026-05-16.md).

## 6.1 CI e deploy

| Workflow | Função |
|----------|--------|
| `ci.yml` | Build e auditoria |
| `tests.yml` | Testes BE/FE, performance |
| `security.yml` | Segurança, CodeQL, GitGuardian |
| `backend-deploy.yml` | Deploy Fly (main) |
| `frontend-deploy.yml` | Deploy Vercel prod (main) |
| `main-pipeline.yml` | Pipeline principal (+ deploy Fly redundante) |
| `rollback.yml` | Rollback automático (Fly, condicionado) |
| `health-monitor.yml` | Monitorização periódica |

## 6.2 Comportamento actual

- **`push` em `main`** dispara CI + deploy Fly + deploy Vercel produção.  
- **PRs** executam checks; deploy produção **SKIPPED** até merge.  
- **Merge commit** é a estratégia adoptada (sem squash nos merges controlados H3.4–H3.5).

## 6.3 Riscos conhecidos (pipeline)

| ID | Risco |
|----|-------|
| P1 | Deploy automático em qualquer merge `main` (incl. docs) |
| P2 | Dois workflows podem deployar Fly (`backend-deploy` + `main-pipeline`) |
| P3 | Sem GitHub Environment / aprovação humana obrigatória |
| P4 | Rollback frontend automático desactivado |

## 6.4 Observações H3.6

Plano **H3.6c** (futuro): um único deployer Fly, `main` = integração (não release), gatilho `workflow_dispatch` ou tag `v1-release-*`, concurrency global, validação pós-deploy `/meta === SHA`.

**Maturidade actual:** nível ~2 (CI + deploy auto). **Alvo pós-hardening:** nível ~4.

---

# 7. Correções estruturais realizadas

## 7.1 H3.0B — Cirurgia mobile `/game`

[Relatório H3-0B](H3-0B-CIRURGIA-GAME-MOBILE-V1-2026-05-12.md)

- Neutralização de `translate(-50%,-50%)` conflituoso em bola/zonas/goleiro.  
- Overlay portrait (Opção A — bloquear retrato).  
- `viewport-fit=cover`, safe-area, HUD compacto em landscape.  
- Palco 1920×1080 e `layoutConfig.js` preservados como fonte de geometria.

## 7.2 H3.4 — Integração `main` e financeiro

- PR #87 → baseline **`460ba4e`** (integridade financeira admin).  
- `main` alinhada com produção; `/meta` rastreável.

## 7.3 H3.5 — Estabilização geométrica `/game`

| Fase | PR | Alteração principal |
|------|-----|---------------------|
| H3.5d | #88 | Correção visual preview |
| H3.5i | #89 | **−60px X** (alinhamento horizontal, eixo 960) |
| H3.5l | #90 | **−25px Y** (zonas 495/715, bola 985) |
| H3.5p/r | #91 | **−5px Y** (zonas 490/710, bola 980) |
| H3.5q | — | Validação PR #91 |
| H3.5s | #92 | Consolidação relatórios em `main` |

**Estado final `layoutConfig.js` (stage 1920×1080):**

| Elemento | X | Y |
|----------|---|---|
| TL / TR / C | 450 / 1470 / **960** | **490** |
| BL / BR | 450 / 1470 | **710** |
| Bola START | **960** | **980** |
| Goleiro idle | **960** | **690** |
| `JUMPS` | — | **não recalibrados** nesta linha |

**Evolução vertical desde H3.5k:** 520 → 495 → **490** (−30px total nas zonas superiores).

---

# 8. Produção validada

| Superfície | Evidência | Resultado |
|------------|-----------|-----------|
| **Smoke API** | `/health` 200, DB + MP connected | **OK** |
| **Rastreio** | `/meta` com SHA de `main` | **OK** |
| **Frontend player** | HTML serve `index-CZOAOs6A.js`; coords 490/980 no bundle | **OK** |
| **Backend** | Fly estável; versão 1.2.1 | **OK** |
| **Admin** | Baseline `460ba4e`; domínio `admin.goldeouro.lol` | **OK** (integridade mergeada) |
| **Mobile** | H3.0B deployado; portrait bloqueado | **OK** com ressalva (smoke físico limitado) |
| **Pixel `/game`** | Redirect login sem credenciais smoke | **RESSALVA** — validação humana recomendada |

Relatórios de suporte: [H3-5B](H3-5B-SMOKE-PLAYER-PRODUCAO-2026-05-16.md), [H3-5O](H3-5O-VALIDACAO-VISUAL-FINAL-GAME-2026-05-16.md), [H3-5R](H3-5R-MERGE-CONTROLADO-PR91-2026-05-16.md).

---

# 9. Riscos conhecidos remanescentes

| ID | Risco | Mitigação recomendada |
|----|-------|------------------------|
| R1 | **Deploy automático em `main`** | Implementar H3.6c (release controlado) |
| R2 | **`GOALKEEPER.JUMPS` não recalibrados** após ajuste Y | Teste de defesa em todas as zonas; recalibração futura se necessário |
| R3 | **Preview Vercel** monorepo → `/game` pode 404 | Usar produção ou preview com root correcto |
| R4 | **Smoke mobile físico** não coberto por automação | Sessão manual landscape + safe-area |
| R5 | **Credenciais smoke** (`test@example.com`) inválidas em prod | Conta dedicada ou ambiente staging |
| R6 | **PWA/cache** pode servir bundle antigo | Hard refresh; validar Network tab |
| R7 | **Duplo deploy Fly** | Consolidar em `backend-deploy.yml` (H3.6) |

Nenhum destes riscos invalida o encerramento da V1 como **operacionalmente aprovada**, desde que monitorizados na fase seguinte.

---

# 10. Decisão final

## Classificação oficial

# **V1 OPERACIONALMENTE APROVADA**

| Critério | Avaliação |
|----------|-----------|
| Produção real estável | **Sim** |
| Financeiro integrado e documentado | **Sim** |
| Player `/game` geometricamente estabilizado | **Sim** |
| Rastreabilidade `/meta` | **Sim** |
| Governança Git (`main` + relatórios) | **Sim** |
| Ausência total de risco | **Não** — ver secção 9 |

**Data de encerramento documental:** 2026-05-17.

---

# 11. Próxima fase recomendada

## 11.1 H3 Hardening (prioridade operacional)

- Implementar plano [H3.6B](H3-6B-PLANEJAMENTO-HARDENING-PIPELINE-V1-2026-05-16.md): deploy único, aprovação humana, `main` ≠ release.  
- Fechar gaps de smoke (credenciais, `/game` autenticado).  
- Recalibração opcional de `JUMPS` após feedback visual.

## 11.2 Engine V2

- Separar motor de jogo de `layoutConfig` monolítico.  
- Testes visuais automatizados (viewport fixo + screenshots).  
- Performance mobile (H3.0E diagnóstico como entrada).

## 11.3 Sistemas Digitais Indesconectável

- Produto V1 como **base estável** para portfólio, marketing e novos módulos.  
- Documentação executiva (este ficheiro) como referência de entrega.  
- Novos produtos não devem alterar baseline V1 sem gate explícito.

---

## Índice de relatórios H3.5 (geometria `/game`)

| Relatório | Conteúdo |
|-----------|----------|
| H3-5B | Smoke player produção |
| H3-5C | Forense regressão visual |
| H3-5D / E / G | PR #88 preview e merge |
| H3-5H / I / J / K | Geometria horizontal PR #89 |
| H3-5L / M / N | Ajuste vertical PR #90 |
| H3-5O | Validação visual pós-H3.5n |
| H3-5P / Q / R | Microajuste PR #91 |
| H3-5-CONSOLIDACAO | Baseline `460ba4e` |

---

## Metodologia deste documento

- `GET` Fly `/meta` e `/health` (2026-05-17)  
- `git fetch` + `origin/main` @ `b55c0e8`  
- HTTP `www.goldeouro.lol` (bundle JS/CSS)  
- Síntese de relatórios `docs/relatorios/H3-*`  
- Leitura `goldeouro-player/src/game/layoutConfig.js`

**Nenhum commit. Nenhum deploy. Nenhuma alteração de código ou pipeline.**

---

*Documento gerado no âmbito do encerramento oficial da V1 — Gol de Ouro.*
