# DIAGNÓSTICO READ-ONLY — TELA DE AUDITORIA ADMIN (2026-05-12)

## Contexto assumido

- Backend em produção com `admin_logs` e `GET /api/admin/audit/logs` operacionais (Cirurgia 10).
- Painel admin (`goldeouro-admin`) ainda **sem** tela dedicada a essa API.

## 1. Rotas do painel (`src/AppRoutes.jsx`)

- Rotas declaradas com `MainLayout` + páginas em `src/pages/` (Dashboard, Users, relatórios, saques, etc.).
- **Não existe** rota `/auditoria` nem import de componente de auditoria administrativa.
- Rota existente relacionada a “logs”: **`/logs`** → componente `Logs` importado como **`./pages/LogsSistema`** (alias `Logs`).

## 2. `Sidebar.jsx`

- Navegação em secções colapsáveis (`painel`, `usuarios`, `estatisticas`, `relatorios`, `sistema`).
- Secção **Sistema** inclui link **`/logs`** com rótulo **“Logs do Sistema”** (ícone/configuração não distingue auditoria admin de logs técnicos).
- **Não há** link para `/auditoria` nem menção a “Auditoria”.

## 3. `SidebarResponsive.jsx`

- Paridade com desktop: entrada para **`/logs`** (“Logs do Sistema”) na área equivalente a Sistema (linhas ~395–397 no ficheiro).
- Qualquer nova rota de auditoria deverá replicar-se aqui (e eventualmente em `SidebarFixed.jsx` se ainda for usado em algum layout).

## 4. Existe tela atual de auditoria administrativa?

| Pergunta | Resposta |
|----------|----------|
| Tela que consome **`GET /api/admin/audit/logs`**? | **NÃO** |
| Tela “logs” genérica? | **SIM** — `/logs` renderiza `LogsSistema.jsx` |

## 5. Página antiga de “Logs” e endpoint

- **Ficheiro:** `src/pages/LogsSistema.jsx` (export default `LogsSistema`).
- **Chamada de dados:** `postData('/admin/logs', {})` — **POST** para path **`/admin/logs`**, **não** alinhado ao contrato novo `GET /api/admin/audit/logs`.
- **Comportamento em erro:** fallback para lista **mock** hardcoded (`LOGIN`, `USER_CREATE`, etc.) em `catch`, o que mascara falhas de API e **não** reflete `admin_logs`.
- **Ficheiro auxiliar:** `LogsSistemaResponsive.jsx` — em desktop delega para `LogsSistema`; **não** está ligado em `AppRoutes.jsx` atual (a rota `/logs` usa diretamente `LogsSistema`). Conclusão: variante responsiva existe no repositório mas **a rota principal não a importa**; relevo para Cirurgia 11 alinhar responsivo se necessário.

## 6. Contrato UI proposto (alinhamento backend)

- **Método e URL:** `GET /api/admin/audit/logs?limit=50` (e opcionalmente `action`, `admin_id` conforme backend).
- **Autenticação:** igual às outras páginas reais — `getData` em `src/js/api.js` envia `Authorization: Bearer <token>` para `API_BASE_URL`.
- **Resposta esperada:** `{ success: true, data: [ ... ] }` onde cada elemento inclui pelo menos: `id`, `admin_id`, `action`, `target_type`, `target_id`, `metadata`, `ip`, `created_at` (shape já devolvido pelo Fly).

## 7. Proposta de rota e componente (apenas desenho)

| Item | Proposta |
|------|-----------|
| **Rota React** | **`/auditoria`** (nova `Route` em `AppRoutes.jsx` com `MainLayout` + novo componente). |
| **Componente** | **`src/pages/Auditoria.jsx`** — lista tabular (padrão `Users.jsx` / `TableTemplate`: `getData`, estados loading/erro, formatação de datas PT-BR, `metadata` como JSON colapsável ou texto truncado). |
| **Navegação** | Novo `Link` na secção **Sistema** do `Sidebar.jsx` / `SidebarResponsive.jsx`, por exemplo **“Auditoria admin”**, para não confundir com “Logs do Sistema” legado. |
| **Legado `/logs`** | Manter ou deprecar em Cirurgia 11 conforme produto: hoje é **legado/mock**; auditoria real vive na **nova** rota. |

## 8. Campos a exibir na UI (conforme pedido)

| Campo | Notas |
|--------|--------|
| `action` | Texto (ex.: `user.block`, `withdraw.approve`). |
| `admin_id` | UUID; opcional futuro resolver email/nome via lista de users (fora do escopo mínimo). |
| `target_type` | ex.: `user`, `withdrawal`. |
| `target_id` | UUID ou id string. |
| `ip` | Pode ser nulo; exibir “—”. |
| `created_at` | `toLocaleString('pt-BR')`. |
| `metadata` | Objeto JSON — `JSON.stringify` formatado ou coluna com tooltip; evitar PII desnecessária (já filtrado no backend). |

## 9. Arquivos candidatos à alteração (Cirurgia 11 — não executada aqui)

| Ficheiro | Motivo |
|----------|--------|
| `src/AppRoutes.jsx` | Registar rota `/auditoria` e import de `Auditoria`. |
| `src/pages/Auditoria.jsx` | **Novo** — UI + `getData('/api/admin/audit/logs?limit=50')`. |
| `src/components/Sidebar.jsx` | Link “Auditoria” → `/auditoria`. |
| `src/components/SidebarResponsive.jsx` | Idem. |
| `src/utils/navigation.js` | `isRouteActive` pode depender de paths conhecidos — alinhar com nova rota se necessário. |
| `src/config/navigation.js` | Array **`navigationConfig.validRoutes`** inclui `/logs` mas **não** `/auditoria`; para `safeNavigate` considerar rota “válida”, é preciso **adicionar** `/auditoria` aqui (senão `safeNavigate('/auditoria')` loga “Rota inválida”). |

## 10. Saída final solicitada

| Pergunta | Resposta |
|----------|----------|
| **Existe tela atual de auditoria (`audit/logs`)?** | **NÃO** |
| **Rota recomendada** | **`/auditoria`** |
| **Arquivos candidatos** | `AppRoutes.jsx`, novo `Auditoria.jsx`, `Sidebar.jsx`, `SidebarResponsive.jsx`; referência legada: `LogsSistema.jsx` (`POST /admin/logs`). |
| **Contrato UI** | `GET /api/admin/audit/logs?limit=50` via `getData`, resposta `{ success, data[] }`, campos listados na secção 8. |
| **GO / NO-GO Cirurgia 11** | **GO** — rotas e sidebar estão centralizadas; padrão de dados reais já existe (`Users.jsx`); legado `/logs` está claramente isolado para substituição ou coexistência documentada. |

---

*Diagnóstico read-only; nenhuma alteração de código nem deploy realizados neste ficheiro.*
