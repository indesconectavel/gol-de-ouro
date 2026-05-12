# CIRURGIA 11 — TELA REAL DE AUDITORIA ADMIN (2026-05-12)

## Escopo

- **Painel:** `goldeouro-admin` apenas.
- **Backend / player:** não alterados.
- **Legado:** `LogsSistema.jsx` e rota `/logs` **mantidos**; novo fluxo em paralelo.

## Alterações

| Ficheiro | Descrição |
|----------|-----------|
| `goldeouro-admin/src/pages/Auditoria.jsx` | **Novo** — lista real via `getData('/api/admin/audit/logs?limit=50')`; filtros `action` (debounce 400 ms); botão **Atualizar**; ordenação `created_at` descendente no cliente; `metadata` com `JSON.stringify(..., null, 2)` em `<pre>`; estados loading / erro / vazio honesto; `TableTemplate` alinhado ao padrão de `Users.jsx`. |
| `goldeouro-admin/src/AppRoutes.jsx` | Rota **`/auditoria`** com `MainLayout` + `Auditoria`. |
| `goldeouro-admin/src/components/Sidebar.jsx` | Link **Auditoria admin** → `/auditoria` (secção Sistema, antes de Logs do Sistema). |
| `goldeouro-admin/src/components/SidebarResponsive.jsx` | Idem + `handleNavigation`. |
| `goldeouro-admin/src/config/navigation.js` | **`/auditoria`** em `validRoutes`. |

## Contrato UI

- **GET** `/api/admin/audit/logs?limit=50` (+ `&action=` quando o filtro não está vazio).
- Campos na tabela: `action`, `admin_id`, `target_type`, `target_id`, `ip`, `created_at`, `metadata`.

## Build

- Comando: `npm run build` em `goldeouro-admin`.
- Resultado: **sucesso** (Vite, ~20 s).

## Commits

- **Submodule `goldeouro-admin`:** `e5dc5f1` — `fix(admin): adicionar tela real de auditoria admin`
- **Repositório raiz (`goldeouro-backend`):** commit na branch `fix/admin-financial-integrity-v1` com a mesma mensagem; inclui apontador do submodule (`e5dc5f1`) + este relatório. Hash exato: `git log -1 --oneline` na raiz após pull.

## GO / NO-GO deploy controlado (admin Vercel)

- **GO** — alterações confinadas ao bundle admin; dependência apenas do backend já exposto (`GET /api/admin/audit/logs`); build local verde. Recomenda-se smoke em `https://admin.goldeouro.lol/auditoria` após deploy (login + lista + filtro).
