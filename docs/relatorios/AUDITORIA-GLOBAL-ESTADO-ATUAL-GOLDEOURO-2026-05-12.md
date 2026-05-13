# AUDITORIA GLOBAL — ESTADO ATUAL DO GOL DE OURO

**Data de referência:** 2026-05-12 (UTC-3 onde aplicável).  
**Tipo:** auditoria técnica e operacional com evidências de runtime onde disponíveis, sem alteração de código ou deploy nesta execução.

---

## 1. Resumo executivo

O sistema **Gol de Ouro V1** apresenta-se **operacional em produção** ao nível de **edge público** e **backend Fly**: health da API com base de dados ligada, frontends principais a responder **HTTP 200**, e rota de auditoria protegida por JWT a rejeitar pedidos anónimos de forma coerente (**401**). A **Cirurgia 11** está **implantada no código e no deploy documentado** do painel admin (`goldeouro-admin` @ `90331e0`), com **lacuna explícita** documentada em relatório anterior: **smoke autenticado no browser** (login real → `/auditoria` → rede → tabela) **ainda não fechado** neste ambiente automatizado por **ausência de credenciais** no agente.

No repositório raiz existem **alterações locais não commitadas** (`goldeouro-player/vercel.json` modificado; vários ficheiros em `docs/relatorios/` e `scripts/` por versionar), o que introduz **drift de working tree** face a um clone “limpo” e deve ser tratado em governança antes de assumir baseline única.

**Classificação global (secção 10):** **ESTÁVEL COM RESSALVAS**.

---

## 2. Arquitetura atual confirmada

| Camada | Tecnologia / repositório | Domínio ou endpoint oficial |
|--------|---------------------------|-----------------------------|
| Marketing / site | Vercel (presumido) | `https://www.goldeouro.lol` |
| Player (SPA) | Vercel; repo `goldeouro-player` | `https://app.goldeouro.lol` |
| Admin (SPA) | Vercel; submodule `goldeouro-admin` | `https://admin.goldeouro.lol` |
| Backend API | Fly.io; repo `goldeouro-backend` | `https://goldeouro-backend-v2.fly.dev` |
| Dados | Supabase PostgreSQL | acesso via backend (service role / pooler conforme desenho) |

**Pipeline oficial** (diagnóstico → … → relatório) está **refletido na cultura de `docs/relatorios/`**; parte dos artefactos permanece **fora do Git** no clone auditado (ver drift).

---

## 3. Estado real dos ambientes

### 3.1 Vercel (admin / inferência)

- **Evidência documental:** `DEPLOY-CONTROLADO-CIRURGIA-11-TELA-AUDITORIA-ADMIN-2026-05-12.md` regista deploy **Production Ready** e URL de deployment `https://goldeouro-admin-8n5o4jno7-goldeouro-admins-projects.vercel.app`.
- **Evidência HTTP (esta execução):** `GET https://admin.goldeouro.lol/auditoria` → **200**; `GET https://admin.goldeouro.lol/logs` → **200** (entrega do bundle; rotas tratadas pelo SPA).
- **Limite:** não foi invocada a API da Vercel para comparar **deployment ID** ↔ commit `90331e0`; coerência admin **código ↔ produção** assume-se alinhada com o processo de deploy já registado, com **ressalva** até confirmação explícita no dashboard.

### 3.2 Fly.io (backend)

**Comando:** `flyctl releases -a goldeouro-backend-v2` (execução local com token já configurado).

| Release | Estado | Idade aproximada (relatório) |
|---------|--------|------------------------------|
| **v450** | **complete** | ~3 h (mais recente na listagem) |

**Evidência HTTP:**

- `GET https://goldeouro-backend-v2.fly.dev/health` → **200** — corpo inclui `"status":"ok"`, `"database":"connected"`, `"version":"1.2.1"`.
- `GET https://goldeouro-backend-v2.fly.dev/meta` → **200** — `success: true`; nota: `data.gitCommit` veio **null** (ver drift).

### 3.3 Supabase

- **Evidência indireta:** `/health` reporta `database: connected`.
- **Evidência direta Supabase (nesta execução):** **não** realizada (sem chamadas Management/SQL com credencial neste passo).
- **Evidência documental prévia:** `DEPLOY-CONTROLADO-FINAL-CIRURGIA-10-AUDITORIA-ADMIN-2026-05-12.md` descreve leituras e smoke `admin_logs` alinhados ao backend em produção na data daquele relatório.

---

## 4. Estado dos módulos

### 4.1 Player

- HTTP **200** em `https://app.goldeouro.lol/`.
- **Working tree raiz:** `goldeouro-player/vercel.json` **modificado** (não commitado) — risco de divergência entre máquina local e remoto se não for intencional.

### 4.2 Admin

- **HEAD confirmado (submodule):** `90331e0` — `fix(admin): adicionar tela real de auditoria admin`.
- Rotas `/auditoria` e `/logs` **acessíveis** a nível HTTP 200.
- Tela **Auditoria** (`Auditoria.jsx`): consome `GET /api/admin/audit/logs?limit=50` com filtro `action` e botão **Atualizar**; **sem paginação** (limite fixo 50; alinhado ao backend `limit` máx. 200 mas UI não expõe).

### 4.3 Backend

- Release Fly **v450** ativa.
- Endpoint `GET /api/admin/audit/logs` **existe** e exige token: teste sem `Authorization` → **401** `{"success":false,"message":"Token de acesso requerido"}`.

### 4.4 Auditoria (persistida + UI)

- **Persistência e API:** validadas em relatório **Cirurgia 10** com smoke HTTP autenticado e leitura de `admin_logs`.
- **UI Cirurgia 11:** implementada e deploy documentado; **aceite formal UI+JWT em produção** depende do smoke autenticado pendente.

### 4.5 Financeiro / auth

- **Auth:** rejeição anónima ao endpoint de auditoria confirma camada de autenticação na rota sensível.
- **Financeiro:** sem novo teste nesta execução; estado “REAL” mantém-se por continuidade dos relatórios anteriores do painel, não por novo smoke aqui.

---

## 5. Drift identificado

| Área | Observação |
|------|------------|
| **Working tree raiz** | Ficheiros modificados / não rastreados (`git status`); baseline Git **não** é um snapshot único “limpo”. |
| **`/meta` vs Git** | `gitCommit: null` em produção — **perda de rastreabilidade runtime ↔ commit** no payload público (drift de observabilidade). |
| **Cirurgia 11 smoke** | Deploy e shell públicos OK; **comportamento pós-login** não reproduzido neste agente. |
| **Documentação** | Muitos relatórios `??` em `docs/relatorios/` — risco de **verdade operacional** espalhada fora do histórico Git partilhado. |

---

## 6. Riscos operacionais

1. **Aceitar Cirurgia 11 como “fechada” sem smoke autenticado** — risco baixo/médio de regressão CSP, CORS, `VITE_API_URL`, ou JWT não detetada só com GET anónimo.
2. **Working tree sujo** — merge/deploy a partir do estado errado ou perda de alterações locais.
3. **`gitCommit` nulo em `/meta`** — dificulta correlacionar incidentes com artefacto de build.
4. **Paginação pedida no smoke supremo mas inexistente na UI** — risco de **expectativa alinhada ao produto** (documentar como N/A ou backlog).

---

## 7. Riscos eliminados (ou fortemente mitigados)

- **Backend indisponível:** refutado por `/health` 200 e DB connected **nesta execução**.
- **Rota de auditoria inexistente no servidor:** refutado por 401 explícito (rota montada, guarda ativa).
- **Domínios principais offline:** refutados por HTTP 200 em www, app e admin (rotas testadas).

---

## 8. Pendências reais

### Críticas (bloqueiam “aceite zero ressalvas” da Cirurgia 11 UI)

- Smoke **browser** com login admin real: `/auditoria`, chamada `GET /api/admin/audit/logs?limit=50`, linhas reais, filtro `action`, refresh, logout/login, `/logs`.

### Leves

- Versionar ou descartar intencionalmente alterações locais (`vercel.json`, docs órfãos).
- Enriquecer `/meta` com commit hash em builds futuros (melhoria de governança).

### Cosméticas / observabilidade

- Avisos de tooling no build admin (browserslist, baseline-browser-mapping) — não bloqueiam.

---

## 9. Governança e rastreabilidade

| Artefacto | Referência |
|-----------|------------|
| Cirurgia 11 código admin | `90331e0` (`goldeouro-admin`) |
| Cirurgia 11 + relatório cirúrgico raiz | `1d3e8f7` (histórico raiz; inclui submodule + `CIRURGIA-11-…`) |
| Deploy controlado Cirurgia 11 | `docs/relatorios/DEPLOY-CONTROLADO-CIRURGIA-11-TELA-AUDITORIA-ADMIN-2026-05-12.md` |
| Commit só relatório deploy | `95a1210` |
| Cirurgia 10 auditoria persistida + API | `DEPLOY-CONTROLADO-FINAL-CIRURGIA-10-AUDITORIA-ADMIN-2026-05-12.md` |
| Fly release corrente (evidência CLI) | **v450** |

Rollback: Fly mantém histórico de releases; Vercel mantém deployments — **capacidade técnica de rollback presente**; procedimento documentado deve continuar a ser seguido por humanos em incidentes.

---

## 10. Diagnóstico técnico global

**Classificação: ESTÁVEL COM RESSALVAS**

**Justificativa:** produção responde, base de dados ligada ao health, autenticação na API de auditoria comporta-se como esperado, admin e player alcançáveis. As **ressalvas** são: working tree não limpo, metadados de build (`gitCommit`) ausentes em `/meta`, e **gate final da Cirurgia 11 em modo utilizador autenticado** não executado nesta sessão.

---

## 11. Recomendação oficial da próxima etapa

1. **Operador humano:** executar o checklist de smoke autenticado descrito em `SMOKE-FINAL-CIRURGIA-11-AUDITORIA-ADMIN-2026-05-12.md` (ou equivalente interno), com captura de evidência (DevTools rede + ecrã).
2. **Governança Git:** decidir sobre `goldeouro-player/vercel.json` e ficheiros `docs/` / `scripts/` não rastreados — commit, `.gitignore` ou eliminação, para fixar **baseline V1**.
3. **Só após (1)+(2):** planear **T13 / próxima cirurgia** com escopo estrito; até lá, tratar a V1 como **estável com ressalvas de aceite UI auditoria**.

---

*Auditoria produzida sem deploy nem alteração de código; evidências HTTP e Fly CLI obtidas em 2026-05-13T00:01Z aproximadamente (ver timestamps nos JSON de `/health`).*
