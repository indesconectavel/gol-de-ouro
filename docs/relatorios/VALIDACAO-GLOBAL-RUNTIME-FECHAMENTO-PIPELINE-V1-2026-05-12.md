# VALIDAÇÃO GLOBAL DE RUNTIME — FECHAMENTO PIPELINE V1

**Data da validação:** 2026-05-15 (execução read-only)  
**Modo:** read-only — sem alteração de código, deploy, base, frontends ou commits.  
**Contexto:** pós-**T14A** (painel admin `/api/admin/...`) e pós-**H2** (rastreabilidade `gitCommit` em `/meta`, Fly **v452**).

---

## 1. Resumo executivo

O **runtime público de produção** responde de forma coerente com o fecho esperado do pipeline V1: backend Fly em **v452** (`complete`), **`/health` 200** com base **connected**, **`/meta` 200** com **`gitCommit` não nulo** e igual ao SHA da cirurgia/execução H2 (**`7ecedca...`**), **versão `1.2.1`**, endpoints admin críticos **401** sem token (rotas vivas, não 404), **admin** e **player** acessíveis (**HEAD/GET 200** nos domínios testados).

**Não** foi executado smoke autenticado no browser (limitação documentada). O repositório local mantém **`goldeouro-player/vercel.json` modificado** e diversos ficheiros **`??`** — **fora do runtime de produção**, mas relevante para governança antes do fecho oficial do Git.

**Classificação (secção 13):** **RUNTIME GLOBAL APROVADO COM RESSALVAS**.

---

## 2. Estado Git

| Item | Valor |
|------|--------|
| `git status --short` | ` M goldeouro-player/vercel.json`; 19 relatórios `??` em `docs/relatorios/`; 1 SQL `??`; 5 scripts `??` |
| Branch | `fix/admin-financial-integrity-v1` |
| `HEAD` | `a94a70b551c5217278adbe36182a016239908ea3` — *docs: registrar H2 execucao controlada gitCommit runtime* |
| Tags recentes (amostra) | `pre-h2-runtime-traceability-2026-05-12`, `t14a-runtime-alignment-admin-v1-2026-05-12`, `pre-t14a-painel-admin-v1-2026-05-12`, … |

**Arquivos fora do escopo ainda presentes localmente:** confirmado — `vercel.json` do player **não** commitado; bloco de relatórios/scripts/SQL órfãos permanece em `??`.

**SHA de referência H2 (runtime em `/meta`):** `7ecedca98d1f5d5d7c1878aa043ec724e422dd41` (commit da cirurgia CI H2; imagem Fly v452).

---

## 3. Backend Fly

| Verificação | Resultado |
|-------------|-----------|
| `fly releases -a goldeouro-backend-v2` | **v452** — `complete` (~17h antes da checagem desta validação) |
| Release anterior | v451 `complete` (pré-H2 deploy com `gitCommit` null) |
| App | `goldeouro-backend-v2` |
| URL | `https://goldeouro-backend-v2.fly.dev` |

---

## 4. Healthcheck

| Request | HTTP | Notas |
|---------|------|--------|
| `GET /health` | **200** | Corpo observado (resumo abaixo) |

**Payload resumido (`/health`):**

```json
{
  "status": "ok",
  "version": "1.2.1",
  "database": "connected",
  "mercadoPago": "connected",
  "contadorChutes": 384,
  "ultimoGolDeOuro": 0
}
```

`timestamp` presente no corpo completo da resposta.

---

## 5. Meta e rastreabilidade

| Campo | Esperado (H2) | Observado |
|-------|----------------|-----------|
| HTTP | 200 | **200** |
| `data.version` | `1.2.1` | **`1.2.1`** |
| `data.build` | literal histórico | **`2025-10-21`** |
| `data.gitCommit` | não null; SHA H2 | **`7ecedca98d1f5d5d7c1878aa043ec724e422dd41`** |
| Match SHA H2 | sim | **Sim** (igual ao deploy documentado em `H2-EXECUCAO-CONTROLADA-RUNTIME-GITCOMMIT-2026-05-12.md`) |
| `environment` | production | **production** |

**Antes de H2 (referência histórica):** `gitCommit: null` em v451. **Após v452:** rastreabilidade **ativa** em produção.

---

## 6. Endpoints admin protegidos

Testes **sem** `Authorization` (anónimo). Critério: **401** (auth exigida), **não** 404 de rota fantasma.

| Endpoint | HTTP |
|----------|------|
| `GET /api/admin/chutes/recentes` | **401** |
| `GET /api/admin/users/00000000-0000-0000-0000-000000000001` | **401** |
| `GET /api/admin/audit/logs?limit=50` | **401** |
| `GET /api/admin/dashboard/stats` | **401** |
| `GET /api/admin/users/list` | **401** |
| `GET /api/admin/financial/report` | **401** |
| `GET /api/admin/withdraw/list` | **401** |

Rotas mapeadas em `server-fly.js` com `authenticateToken` + `requireAdministradorDb` (amostra T14A/H2).

---

## 7. Frontend admin

| URL | HEAD | GET | Notas |
|-----|------|-----|--------|
| `https://admin.goldeouro.lol/` | **200** | **200** | Shell SPA alcançável |
| `https://admin.goldeouro.lol/login` | **200** | **200** | Rota de login alcançável |

**Limitação:** não foi usado browser MCP nesta validação. **`/auditoria` autenticada**, fluxo lista → relatório individual, e Network DevTools **não** foram revalidados aqui — dependem de smoke humano com sessão admin (ressalva herdada da validação funcional T14A).

**Proteção SPA:** inferida por disponibilidade de `/login` 200 e padrão do projeto; **não** prova de ausência de regressão de rotas internas sem login.

---

## 8. Frontend player

| URL | HEAD | GET | Notas |
|-----|------|-----|--------|
| `https://www.goldeouro.lol/` | **200** | **200** | Site público OK |
| `https://app.goldeouro.lol/` | **200** | **200** | App player OK |

**Deploy player nesta etapa:** **nenhum** executado nesta validação (read-only).  
**`goldeouro-player/vercel.json`:** continua **modificado localmente** e **fora** de commits do pipeline T14A/H2 — **confirmado** no `git status`.

---

## 9. Supabase

| Indicador | Resultado |
|-----------|-----------|
| `/health` → `database` | **`connected`** |
| Regressão evidente de ligação | **Não** observada nesta checagem |

Validação **indireta** via health público; sem query SQL nem painel Supabase nesta etapa.

---

## 10. Evidências runtime

| # | Evidência |
|---|-----------|
| 1 | Fly **v452** `complete` |
| 2 | `/health` **200**, `database: connected`, `version: 1.2.1` |
| 3 | `/meta` **200**, `gitCommit: 7ecedca98d1f5d5d7c1878aa043ec724e422dd41` |
| 4 | Sete endpoints admin anónimos → **401** |
| 5 | Admin `admin.goldeouro.lol` e `/login` → **200** |
| 6 | Player `www` e `app` → **200** |
| 7 | HEAD Git: `a94a70b` (docs execução H2); runtime SHA em meta: `7ecedca` (commit da cirurgia/deploy Fly) |

---

## 11. Ressalvas

| Tipo | Detalhe |
|------|---------|
| **Git local** | `goldeouro-player/vercel.json` modificado; ~25 ficheiros `??` (relatórios, SQL Plano B, scripts) |
| **Fly deploy (histórico)** | Warning “not listening on expected address `0.0.0.0:8080`” durante deploy v452 — machine checks passaram; health público OK |
| **Meta estática** | `build: 2025-10-21` permanece literal no JSON; não substitui `gitCommit` para rastreio |
| **Browser / MCP** | Sem validação autenticada admin (`/auditoria`, `/lista-usuarios`, Network `/api/admin/...`) |
| **Player** | Sem validação de gameplay, PIX ou saldo nesta etapa |
| **HEAD vs meta SHA** | `HEAD` local (`a94a70b`) é commit de **documentação** pós-deploy; `gitCommit` em produção reflete imagem built com **`7ecedca`** — **coerente** com deploy Fly da H2, não exige igualdade com `HEAD` atual |

---

## 12. Riscos remanescentes

1. **Drift Git local** — risco de commit acidental (`git add .`) antes de merge/fecho V1.  
2. **Deploy Fly sem `--build-arg`** em caminhos legados (scripts/docs antigos) — pode reintroduzir `gitCommit: null` se operador não seguir runbook H2.  
3. **Smoke admin autenticado incompleto** — regressões de UI/Network não detetadas por HTTP anónimo.  
4. **Higiene documental** — relatórios `??` ainda não versionados em lote.

---

## 13. Diagnóstico final

**RUNTIME GLOBAL APROVADO COM RESSALVAS**

| Critério de aprovação | Cumprido |
|------------------------|----------|
| Backend 200 (`/health`) | Sim |
| `/meta` com `gitCommit` real | Sim |
| `gitCommit` = SHA H2 esperado | Sim (`7ecedca...`) |
| Endpoints críticos protegidos (401) | Sim |
| Admin 200 | Sim (shell + login) |
| Player 200 | Sim (`www`, `app`) |
| Supabase connected (via `/health`) | Sim |
| Sem regressão crítica evidente em produção | Sim (HTTP anónimo) |

**Não** classificado como **BLOQUEADO**: produção responde e rastreabilidade H2 está ativa em `/meta`.

**Não** classificado como **APROVADO** pleno: working tree suja + smoke autenticado admin pendente + aviso Fly histórico.

---

## 14. Recomendação oficial

1. **Aceitar fecho de runtime V1** para backend, rastreabilidade H2 e proteção de rotas admin **no critério HTTP/Fly** desta validação.  
2. **Antes do encerramento formal do repositório / merge:** executar higiene Git (decisão sobre `vercel.json`, lote de relatórios `??`, sem misturar com features).  
3. **Opcional mas recomendado:** smoke humano curto em `https://admin.goldeouro.lol` (login → dashboard → lista → auditoria) com DevTools confirmando **`/api/admin/...`** e ausência de `/admin/...` legado.  
4. **Manter** em todo deploy Fly manual ou CI: `--build-arg GIT_COMMIT=<sha>` (workflow `deploy-on-demand.yml` já alinhado na cirurgia H2).  
5. **Tag sugerida para marco de fecho** (decisão humana, não executada aqui): por exemplo `v1-runtime-fechamento-pipeline-2026-05-12` apontando para commit de documentação + nota de Fly **v452**.

---

*Fim da validação global read-only — fechamento pipeline V1.*
