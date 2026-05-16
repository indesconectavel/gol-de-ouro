# CIRURGIA 11 — TELA REAL DE AUDITORIA ADMIN (2026-05-12)

## Escopo

- **Painel:** `goldeouro-admin` apenas.
- **Backend, base de dados, player:** **não** alterados nesta cirurgia.
- **Legado:** `LogsSistema.jsx`, rota **`/logs`** e página de logs do sistema **mantidos**; fluxo de auditoria persistida em **paralelo** em **`/auditoria`**.

## Implementação

| Ficheiro | Descrição |
|----------|-----------|
| `goldeouro-admin/src/pages/Auditoria.jsx` | Lista via `getData` (Bearer JWT em `src/js/api.js`) em **`GET /api/admin/audit/logs?limit=50`** e `&action=` quando o filtro tem texto; debounce 400 ms no filtro; botão **Atualizar** (`bumpList`); ordenação cliente `created_at` descendente; colunas `action`, `admin_id`, `target_type`, `target_id`, `ip`, `created_at`, `metadata`; `metadata` com `JSON.stringify(..., null, 2)` e ramos seguros para **`null`**, **objeto** e **string** (incl. JSON em string); estados loading, erro real, vazio honesto; sem mocks nem fallback fake. |
| `goldeouro-admin/src/AppRoutes.jsx` | Rota **`/auditoria`** com `MainLayout` + `Auditoria`. |
| `goldeouro-admin/src/components/Sidebar.jsx` | Item de menu **Auditoria** → `/auditoria` (secção Sistema, antes de Logs do Sistema). |
| `goldeouro-admin/src/components/SidebarResponsive.jsx` | Idem + `handleNavigation('/auditoria')`. |
| `goldeouro-admin/src/config/navigation.js` | **`/auditoria`** em `validRoutes`. |

## Contrato UI — API

- **Endpoint:** `GET /api/admin/audit/logs?limit=50` (query `action` opcional, valor exato no servidor).
- **Autenticação:** cabeçalho `Authorization: Bearer <JWT>` via cliente existente `getData`.

## Build

- Comando: `npm run build` no diretório `goldeouro-admin`.
- **Resultado:** **SIM** — concluído com sucesso (Vite produção).

## Commits

- **Submodule `goldeouro-admin`:** `90331e0` — `fix(admin): adicionar tela real de auditoria admin`
- **Repositório raiz (`goldeouro-backend`):** mesma mensagem; inclui apontador do submodule (`90331e0`) + este relatório. Hash curto na sua cópia: `git rev-parse --short HEAD` na raiz do repositório.

## GO / NO-GO — deploy controlado (admin, ex.: Vercel)

- **GO** — alterações só no bundle admin; backend com `GET /api/admin/audit/logs` já validado; build local verde. Recomendação: smoke pós-deploy em `/auditoria` (login, lista, filtro por `action`, **Atualizar**).

---

## Saída final (checklist)

| Item | Valor |
|------|--------|
| **Arquivos alterados (admin)** | `src/pages/Auditoria.jsx`, `src/AppRoutes.jsx`, `src/components/Sidebar.jsx`, `src/components/SidebarResponsive.jsx`, `src/config/navigation.js` |
| **Rota criada** | **`/auditoria`** |
| **Endpoint consumido** | **`GET /api/admin/audit/logs?limit=50`** (+ `action` quando aplicável) |
| **Build passou** | **SIM** |
| **Hash commit (submodule)** | `90331e0` |
| **Hash commit (raiz)** | `git rev-parse --short HEAD` na raiz (mensagem: `fix(admin): adicionar tela real de auditoria admin`) |
| **GO deploy controlado** | **GO** |
