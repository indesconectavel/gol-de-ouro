# BLOCO J — Auditoria do painel administrativo / controle operacional

**Data:** 2026-03-27  
**Modo:** somente leitura do repositório (sem execução de deploy).

---

## 1. Resumo executivo

O projeto contém **vários vestígios** de um painel administrativo e de APIs operacionais (`routes/adminRoutes.js`, `router.js`, `routes/analyticsRoutes.js`, app React em `src/App.jsx`, CORS permitindo `admin.goldeouro.lol`). Porém, no **entrypoint de produção analisado** (`server-fly.js`), o painel **não está integrado**: há apenas **`POST /api/admin/bootstrap`** (promoção one-shot do primeiro usuário a `tipo: admin` via JWT). O arquivo `routes/adminRoutes.js` define um conjunto amplo de rotas protegidas por `x-admin-token`, mas **não há `app.use('/api/admin', …)`** registrado em `server-fly.js` na árvore atual.

No frontend do monorepo, `src/App.jsx` descreve um **“Gol de Ouro Admin”** (login + rotas `/dashboard`, `/usuarios`, `/saques`), mas os componentes importados (`./components/Dashboard`, `Usuarios`, `Saques`) **não existem** em `src/components/` (apenas outros 8 componentes genéricos). Ou seja: **UI admin local está incompleta / quebrada** em relação ao `App.jsx`.

**Conclusão:** painel administrativo **parcial no código**, **não operacional de ponta a ponta** no backend principal atual; risco de **expectativa falsa** se documentação externa ou deploys antigos prometerem telas que o repo não sustenta sozinho.

---

## 2. Existe painel?

| Aspecto | Veredito |
|---------|----------|
| **UI dedicada no repo** | **Parcial / quebrada** — `src/App.jsx` existe, componentes de página **ausentes**. |
| **Backend integrado em `server-fly.js`** | **Quase inexistente** para gestão — só `POST /api/admin/bootstrap`. |
| **Módulos não montados** | **Existentes no código** — `routes/adminRoutes.js`, `router.js`, `controllers/adminSaquesController.js`, `routes/analyticsRoutes.js` (legado/analytics). |
| **Painel do jogador** | `goldeouro-player` tem `/dashboard` (usuário), **não** é admin operacional. |

**Classificação geral:** **parcial** (artefatos + rotas definidas; **painel completo e acoplado ao servidor principal: inexistente** no estado verificado).

---

## 3. Funcionalidades encontradas

### 3.1 `server-fly.js` (produção)

- **`POST /api/admin/bootstrap`** — `authenticateToken`; se não existir usuário com `tipo === 'admin'`, promove o usuário autenticado a admin; caso contrário 403.

### 3.2 `routes/adminRoutes.js` (não montado em `server-fly.js`)

Proteção: `authAdminToken` (`middlewares/authMiddleware.js` + `x-admin-token`). Inclui:

- Relatórios: `relatorio-semanal`, `estatisticas-gerais`, `top-jogadores`, `transacoes-recentes`, `chutes-recentes`, `relatorio-usuarios`, `logs`.
- Usuários: `lista-usuarios` (GET), bloqueio/suspensão (`/suspender/:id`, `/bloquear`, `/desbloquear`), `usuarios-bloqueados`.
- Fila: `controle-fila`.
- Backup: `backup-status`.
- Exportações CSV: usuários, chutes, transações, saques, relatórios.

**Observação:** `controllers/adminController.js` não foi encontrado no caminho esperado pelo `require` (pode estar em outro local ou arquivo ausente); isso reforça risco de **import quebrado** se alguém montar a rota sem ajustar.

### 3.3 `controllers/adminSaquesController.js`

- **`saquesPresos`** — documentado como `GET /api/admin/saques-presos`, leitura de saques em status `PROCESSING` antigos (read-only). **No `server-fly.js` atual não há ocorrência** de `saques-presos` nem de `authAdminToken` (busca por string vazia). Relatórios em `docs/relatorios/` descrevem esse endpoint em versões anteriores; **no código atual do entrypoint analisado, não está presente.**

### 3.4 `router.js` (router alternativo / legado)

- Rotas `POST /admin/lista-usuarios`, `relatorio-usuarios`, `chutes-recentes`, `top-jogadores`, `usuarios-bloqueados` com `authenticateAdmin` e colunas tipo `name`, `balance`, tabela `games` — **não batem** com o schema Supabase usado em `server-fly.js` (`username`, `saldo`, `chutes`). Indica **legado ou outro banco**.
- **`GET /api/public/dashboard`** — contagens públicas (sem auth no trecho lido).

### 3.5 `routes/analyticsRoutes.js`

- Várias rotas `GET` com `requireAdmin` (`x-admin-token`): `/dashboard`, `/health`, `/logs`, `/events`, `/bets/stats`, `/alerts`, `/thresholds` — dependem de `config/env` e utilitários em `src/utils/`. **Não constatado `app.use` dessas rotas em `server-fly.js`** (apenas `analyticsIngest` em `/api/analytics`).

### 3.6 `server-fly.js` — monitoramento

- **`GET /api/monitoring/metrics`**, **`GET /api/monitoring/health`** — expõem métricas internas; **sem middleware de admin** nos trechos analisados (superfície operacional/informacional).

### 3.7 `src/App.jsx` (React “admin”)

- Login com **credenciais fixas no código-fonte** (`goldeouro_admin` / senha literal).
- **Navegação** para Dashboard, Usuários, Saques — **componentes ausentes** no diretório `src/components/`.

### 3.8 Endpoints financeiros relevantes (usuário, não admin)

- `POST /api/withdraw/request`, `GET /api/withdraw/history` — autenticação JWT usuário; **não** são aprovação operacional no painel.
- PIX: `POST /api/payments/pix/criar`, webhook, etc.

---

## 4. Capacidades operacionais

| Capacidade | Situação no código atual |
|------------|---------------------------|
| Listagem de usuários (admin) | Definida em `adminRoutes.js` / `router.js`, **não ativa** em `server-fly.js`. |
| Visualização de saldo | Idem; perfil usuário é `/api/user/profile` (JWT). |
| Histórico de chutes | Definido em rotas admin não montadas; dados reais em `chutes` via shoot. |
| Pedidos de saque (fila operacional) | **Não** há endpoint em `server-fly.js` para aprovar/rejeitar; `adminSaquesController` só leitura **se** rota existir (não está no entrypoint atual). |
| Aprovação/rejeição de saque | **Não evidenciado** no `server-fly.js`. |
| Depósitos PIX (visão operacional) | Apenas fluxo usuário + webhook; **sem painel** no servidor principal. |
| Logs | `analyticsRoutes` (não montado) + ingestão mínima `analyticsIngest` (POST beacon, não é painel). |

**Responder diretamente:** **não** é possível, no **servidor principal analisado**, “operar o sistema financeiro” via painel integrado (aprovações, filas, auditoria completa). O que existe são **peças soltas** e **monitoramento parcial** sem UI admin consolidada no repo.

---

## 5. Segurança

| Item | Evidência |
|------|-----------|
| Painel protegido por auth | **Não aplicável** à UI incompleta; login **hardcoded** em `src/App.jsx` (crítico se algum build usar esse arquivo). |
| Roles / admin no backend | `tipo: admin` no Supabase + `POST /api/admin/bootstrap`; **não** há rotas admin JWT por `tipo` em `server-fly.js` analisado. |
| `x-admin-token` | Padrão em `adminRoutes.js`, `analyticsRoutes.js`, `router.js`; **rotas não montadas** no entrypoint principal. |
| Endpoints expostos | `GET /api/monitoring/metrics` e `/api/monitoring/health` **sem** `x-admin-token` no trecho visto; `GET /api/public/dashboard` em `router.js` é **público** se esse router for usado. |
| CORS | `admin.goldeouro.lol` na allowlist de `server-fly.js` — indica **intenção** de hospedar admin separado, não implementação completa aqui. |

---

## 6. Lacunas críticas

1. **Backend principal sem montagem de `routes/adminRoutes.js`** — operação via API admin (token) **não disponível** no processo `server-fly.js` verificado.
2. **UI admin referenciada mas não implementada** (`Dashboard`, `Usuarios`, `Saques` ausentes).
3. **Credenciais de login no código** (`src/App.jsx`) — **inaceitável** para produção se esse app for deployado.
4. **Sem fluxo único de aprovação de saque** no servidor principal analisado.
5. **Inconsistência** entre documentação histórica (`GET /api/admin/saques-presos`) e **ausência** no `server-fly.js` atual — risco de confusão operacional.
6. **Legado** (`router.js`, `adminController` arquivado em `_archived_config_controllers`) vs **schema atual** Supabase — reaproveitamento direto provavelmente quebrado.

---

## 7. Impacto na V1

| Tema | Impacto |
|------|---------|
| Demonstração do jogo + PIX para sócios | **NÃO BLOQUEIA** — não depende de painel admin no repo. |
| Operação diária (aprovar saque, bloquear usuário pela UI) | **CRÍTICO** — não há painel operacional integrado ao entrypoint atual. |
| Auditoria e suporte via API/admin | **IMPORTANTE** — peças existem mas não estão ativas; Supabase console vira dependência externa. |
| Segurança se `src/App.jsx` for publicado | **CRÍTICO** — credenciais em claro. |

---

## 8. Classificação final

**Painel administrativo: parcial e não integrado ao `server-fly.js`; UI admin no repo incompleta; controle financeiro operacional pela aplicação: não disponível no estado analisado.**

Para operar um produto real com processos internos (saques, bloqueios, auditoria), falta **ou** usar **Supabase + ferramentas externas** de forma consciente, **ou** montar e testar as rotas admin existentes + UI + alinhamento de schema, **sem** depender de credenciais hardcoded.

---

*Fim do relatório BLOCO J.*
