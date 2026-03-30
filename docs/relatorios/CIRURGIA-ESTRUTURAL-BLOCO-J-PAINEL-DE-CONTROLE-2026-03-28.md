# CIRURGIA ESTRUTURAL — BLOCO J — PAINEL DE CONTROLE

**Data:** 2026-03-28  
**Escopo:** `goldeouro-admin` + `server-fly.js` (API `/api/admin/*`)  
**Decisões fixas aplicadas:** prefixo `/api/admin/`, auth `x-admin-token` alinhado a `ADMIN_TOKEN`, backend ativo `server-fly.js`, sem reativação de `routes/adminRoutes.js` nem dependência de `_archived_`.

---

## 1. Resumo executivo

O painel passou a consumir **uma única camada HTTP** (`goldeouro-admin/src/js/api.js` — `getData` / `postData` / `pickData` / `downloadAdminFile`), com **URLs absolutas** `VITE_API_URL + '/api/admin/...'` (sem `/api/api`). O backend ativo expõe um **router novo** `routes/adminApiFly.js`, montado em `server-fly.js` **após** `POST /api/admin/bootstrap`, com dados **reais do Supabase** onde aplicável e mensagens explícitas onde não há tabela de auditoria. O login do painel grava o **mesmo segredo** configurado como `ADMIN_TOKEN` no servidor (mínimo 16 caracteres). Build do admin: **`npm run build` concluído com sucesso**.

---

## 2. Decisão arquitetural aplicada

- **Contrato HTTP:** `{ success: boolean, data?: any, message?: string }` nas respostas JSON do grupo admin (exceto CSV em `exportacao?format=csv`, corpo texto).
- **Auth:** middleware inline em `adminApiFly.js` (mesma regra que `authAdminToken`: comparação com `process.env.ADMIN_TOKEN`, mín. 16 caracteres).
- **Frontend:** malha inalterada em estrutura (`main.jsx` → `AppRoutes.jsx` → `MainLayout` / `Sidebar`); **sem** `App.jsx` / `src/routes/index.jsx` no fluxo.
- **Correção de path:** `middlewares/authMiddleware.js` passou a `require('../config/env')` (path válido a partir de `middlewares/`).

---

## 3. Backend implementado

Arquivo **`routes/adminApiFly.js`**, montado com:

`app.use('/api/admin', createAdminApiRouter({ getSupabase, isDbConnected, getQueueSnapshot }))`

**Endpoints (todos sob `/api/admin`, após o prefixo):**

| Método | Rota | Função |
|--------|------|--------|
| GET | `/stats` | Agregações (usuários, chutes, PIX aprovados, saques, top jogadores, snapshot fila) |
| GET | `/usuarios` | Lista; query `?ativo=false` filtra inativos |
| GET | `/usuarios-bloqueados` | Usuários com `ativo = false` |
| POST | `/usuarios/:id/reativar` | `ativo: true` |
| GET | `/usuarios/:id` | Detalhe + agregados de chutes/PIX/saques |
| GET | `/relatorios/usuarios` | Linhas para relatório |
| GET | `/relatorios/financeiro` | Totais + amostra de transações |
| GET | `/relatorios/geral` | Resumo consolidado |
| GET | `/relatorios/semanal` | Janela desde início da semana (lógica JS) |
| GET | `/transacoes` | PIX + saques mesclados (limite) |
| GET | `/saques` | Lista normalizada |
| GET | `/logs` | **Sem tabela de log:** `entries: []` + métricas reais do processo |
| GET | `/chutes` | Últimos chutes com nome de usuário |
| GET | `/top-jogadores` | Ranking por gols |
| GET | `/fila` | Snapshot de `lotesAtivos` + `contadorChutesGlobal` |
| GET | `/configuracoes` | JSON em `data/admin-panel-settings.json` (defaults se ausente) |
| POST | `/configuracoes` | Merge e gravação do JSON |
| GET | `/exportacao` | Contagens; `?format=csv&tipo=usuarios|chutes|transacoes|saques` |
| GET | `/backup` | Lista em memória |
| POST | `/backup` | `action: 'create' \| 'delete'` + `backupId` |

**Mantido:** `POST /api/admin/bootstrap` (JWT) **antes** do `app.use` do router novo.

---

## 4. Camada de API final

- **Canônica:** `goldeouro-admin/src/js/api.js`
- **Token:** `localStorage['admin-token']` (login) ou `VITE_ADMIN_TOKEN` (opcional dev), sempre header `x-admin-token`.
- **Não usado pelas páginas oficiais:** `services/dataService.js` (sem imports restantes nas rotas oficiais).
- **`services/api.js`:** permanece no repositório para páginas legadas não roteadas; **não** faz parte da malha oficial.

---

## 5. Arquivos alterados

**Backend:** `server-fly.js`, `routes/adminApiFly.js` (novo), `middlewares/authMiddleware.js`, `data/.gitkeep` (novo).

**Admin:** `src/js/api.js`, `src/js/auth.js`, `src/config/env.js`, `src/config/navigation.js`, `src/AppRoutes.jsx`, `src/components/Sidebar.jsx`, `src/components/Logout.tsx`, `src/components/DashboardCards.jsx`, `src/components/DashboardCardsResponsive.jsx`, `src/components/GameDashboard.jsx`, `src/pages/*` (todas as oficiais listadas na seção 6), `src/App.jsx` (comentário), `src/routes/index.jsx` (comentário), `.env.example`.

**Documentação:** este relatório.

---

## 6. Páginas corrigidas

`Dashboard`, `Login`, `ListaUsuarios`, `RelatorioUsuarios`, `RelatorioPorUsuario`, `RelatorioFinanceiro`, `RelatorioGeral`, `RelatorioSemanal`, `Estatisticas`, `EstatisticasGerais`, `Transacoes`, `SaqueUsuarios`, `UsuariosBloqueados`, `Fila`, `TopJogadores`, `Backup`, `Configuracoes`, `ExportarDados`, `LogsSistema`, `ChutesRecentes`.

---

## 7. Rotas corrigidas

- **`/relatorio-por-usuario/:id`** adicionada com `RelatorioPorUsuario`.
- **`/relatorio-por-usuario`** (sem id) → `Navigate` para `/relatorio-usuarios`.
- **Link** em `RelatorioUsuarios` corrigido para `/relatorio-por-usuario/:id`.

---

## 8. Autenticação final

- **Login:** campo único “token administrativo” (≥ 16 caracteres), gravado via `auth.login` em `admin-token` + timestamp.
- **API:** `getData` / `postData` exigem token; alinhado ao `ADMIN_TOKEN` do servidor.
- **Logout unificado:** `auth.logout()` limpa chaves de sessão; `Logout.tsx` e `Sidebar` usam o mesmo fluxo; `config/env.js` delega a `auth.logout`.

---

## 9. Integração frontend x backend

Todas as telas oficiais chamam apenas paths **`/api/admin/...`** documentados na seção 3. Respostas tratadas com **`pickData`** quando o backend retorna `{ success, data }`. Exportações CSV usam **`downloadAdminFile`** com o mesmo header `x-admin-token`.

---

## 10. Legado neutralizado

- Comentários explícitos em **`App.jsx`** e **`src/routes/index.jsx`** (não importados por `main.jsx`).
- Páginas `*Responsive*` / duplicadas **não** foram apagadas; continuam **fora** de `AppRoutes.jsx` e ainda referenciam `services/api.js` (fora do escopo da malha oficial).

---

## 11. Riscos eliminados

- Múltiplos clientes HTTP nas **páginas oficiais** (axios + dataService + fetch divergentes).
- URLs **`/admin/*`** sem backend correspondente no servidor ativo.
- **`/api/api`** via `getApiUrl() === '/api'` + paths `/api/admin` no `dataService` (fluxo removido do Dashboard).
- **Mocks silenciosos** substituídos por listas vazias ou mensagens de erro nas telas alteradas.
- **Token hardcoded** `goldeouro123` removido do fluxo oficial (arquivo axios legado ainda contém string, mas não é usado pelas rotas oficiais).

---

## 12. Riscos remanescentes

- **`services/api.js`** ainda contém token fixo — risco apenas se alguém importar em nova página oficial sem revisar.
- **Logs de auditoria:** não há persistência em banco; a tela mostra diagnóstico do processo.
- **Backup:** registros em memória + mensagem honesta sobre ausência de binário/restore real.
- **Performance:** alguns endpoints agregam volumes grandes em memória (ex.: todos os `chutes` para ranking); pode exigir paginação/RPC em produção com muito dado.
- **`middlewares/authMiddleware.js`** agora carrega `config/env.js` (envalid): se outro entrypoint passar a importar esse middleware sem as env exigidas, o processo pode falhar no boot (hoje `server-fly` não importa `authMiddleware`).

---

## 13. Build e sanidade

- Comando: `cd goldeouro-admin && npm run build` — **êxito** (Vite, PWA, sem erro de compilação).

---

## 14. Diagnóstico final

**Classificação obrigatória:** **PRONTO COM RESSALVAS**

Motivos: integração real com Supabase nos relatórios principais; contrato único nas páginas oficiais; build OK. Ressalvas: backup superficial, logs sem tabela, agregações pesadas possíveis, legado axios em arquivos não roteados.

---

## 15. Checklist de validação

- [ ] Definir `ADMIN_TOKEN` (≥16) e `VITE_API_URL` no ambiente do admin alinhado ao host do `server-fly.js`.
- [ ] Login no painel com o mesmo `ADMIN_TOKEN`.
- [ ] `GET /api/admin/stats` com header `x-admin-token` → 200 e `success: true`.
- [ ] Percorrer cada item da **Sidebar** e confirmar ausência de erro de rede óbvio.
- [ ] Exportar CSV (usuarios / chutes / transacoes / saques) e abrir arquivo.
- [ ] Reativar um usuário bloqueado (fluxo `POST .../reativar`) e conferir no banco.
- [ ] Confirmar que `POST /api/admin/bootstrap` ainda responde (não regressão).

---

*Fim do relatório de cirurgia estrutural — BLOCO J.*
