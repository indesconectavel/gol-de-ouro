# DIAGNÓSTICO READ-ONLY — PAINEL ADMIN COMPLETO

**Data:** 2026-05-04  
**Base:** `DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`, `PRE-EXECUCAO-BLOCO-FINANCEIRO-SAQUES-MANUAIS-2026-05-04.md`  
**Escopo:** projeto `goldeouro-admin` e comparação com backend `server-fly.js`, `routes/adminRoutes.js`, controllers administrativos referenciados.  
**Modo:** somente leitura — sem alterações de código, migrations ou remoção de mocks.

---

## 1. Resumo executivo

O painel admin ativo (**`main.jsx` → `AppRoutes.jsx`**) expõe **~21 rotas autenticadas** (via `MainLayout`) mais **`/login`**, **`/logout`**, e **`/`** igual a **`/painel`**. Quase todas as páginas consomem caminhos legacy **`{VITE_API_URL}/admin/...`** com header **`x-admin-token`** (`VITE_ADMIN_TOKEN`) ou **`services/api.js`** com token **hardcoded** `goldeouro123` em alguns fluxos axios.

No backend **Fly** atual (**`server-fly.js`**), **não** há `app.use` de **`routes/adminRoutes.js`**. Só aparecem rotas administrativas reais **`POST /api/admin/withdraw/approve`**, **`POST /api/admin/withdraw/cancel`** e **`POST /api/admin/bootstrap`**, todas com **JWT Bearer** + **role admin na tabela `usuarios`**.

O ficheiro **`routes/adminRoutes.js`** lista dezenas de endpoints (POST relatórios, GET exports, etc.) dependentes de **`controllers/adminController`** e **`controllers/exportController`**, mas estes **não existem** no diretório `controllers/` ativo do repo (há apenas artefatos em `_archived_config_controllers/`). Ou seja: o contrato legacy documentado no router **não está acoplado** ao servidor de produção analisado.

**Conclusão consolidada:** a maturidade operacional do painel é **baixa**. Há **mocks e fallbacks enganosos**, **métodos HTTP incorretos** (GET vs POST), **URLs inexistentes** no Fly, **componente `Logout` importado mas ficheiro ausente** no inventário pesquisado, rota **`/relatorio-por-usuario` sem `:id`**, **`desbloquear` simulado** sem API, **`services/api.js` com segredo fixo**. O **impacto financeiro** concentra-se em **Saques**, **Exportações**, **Relatório geral/financeiro** e **dashboard** quando números falsos ou zero substituem a realidade.

---

## 2. Mapa geral de rotas do painel

**Fonte:** `goldeouro-admin/src/AppRoutes.jsx`

| Rota | Componente | MainLayout |
|------|-------------|------------|
| `/login` | `Login` | Não |
| `/logout` | `Logout` | Não |
| `/` | `Dashboard` | Sim |
| `/painel` | `Dashboard` | Sim |
| `/lista-usuarios` | `ListaUsuarios` | Sim |
| `/relatorio-usuarios` | `RelatorioUsuarios` | Sim |
| `/relatorio-por-usuario` | `RelatorioPorUsuario` | Sim |
| `/relatorio-financeiro` | `RelatorioFinanceiro` | Sim |
| `/relatorio-geral` | `RelatorioGeral` | Sim |
| `/relatorio-semanal` | `RelatorioSemanal` | Sim |
| `/estatisticas` | `Estatisticas` | Sim |
| `/estatisticas-gerais` | `EstatisticasGerais` | Sim |
| `/transacoes` | `Transacoes` | Sim |
| `/saque-usuarios` | `SaqueUsuarios` | Sim |
| `/usuarios-bloqueados` | `UsuariosBloqueados` | Sim |
| `/fila` | `Fila` | Sim |
| `/top-jogadores` | `TopJogadores` | Sim |
| `/backup` | `Backup` | Sim |
| `/configuracoes` | `Configuracoes` | Sim |
| `/exportar-dados` | `ExportarDados` | Sim |
| `/logs` | `LogsSistema` | Sim |
| `/chutes` | `ChutesRecentes` | Sim |

**Observações estruturais**

- **`RelatorioPorUsuario`** usa **`useParams().id`**, mas a rota registada é **`/relatorio-por-usuario`** **sem parâmetro** — quebra funcional ao não haver `:id`.
- **`RelatorioUsuarios`** inclui links para **`/relatorio-usuario/:id`** (singular), não coincidindo com qualquer rota em `AppRoutes.jsx`.
- Import **`./components/Logout`**: não foi encontrado ficheiro `Logout.jsx` em `src` via pesquisa no workspace — **risco de build quebrado** ou path externo não versionado.
- **`goldeouro-admin/src/routes/index.jsx`**, **`AppRoutes-simple.jsx`**, **`AppRoutes-working.jsx`** e dezenas de páginas `*Responsive*` / `Withdrawals.jsx` etc. são **órfãs** em relação ao `AppRoutes.jsx` atual (duplicação técnica / dívida).

---

## 3. Mapa de páginas e arquivos

**No Sidebar** (`Sidebar.jsx`): todas as rotas de conteúdo acima excepto **`/`** (root); o menu usa **`/painel`** para o dashboard.

| Página (rota) | Ficheiro | Sidebar |
|----------------|----------|---------|
| Dashboard | `pages/Dashboard.jsx` | Sim (`/painel`) |
| Login | `pages/Login.jsx` | Não |
| Lista usuários | `pages/ListaUsuarios.jsx` | Sim |
| Relatório usuários | `pages/RelatorioUsuarios.jsx` | Sim |
| Relatório por usuário | `pages/RelatorioPorUsuario.jsx` | Sim (*rota quebrada*) |
| Relatório financeiro | `pages/RelatorioFinanceiro.jsx` | Sim |
| Relatório geral | `pages/RelatorioGeral.jsx` | Sim |
| Relatório semanal | `pages/RelatorioSemanal.jsx` | Sim |
| Estatísticas | `pages/Estatisticas.jsx` | Sim |
| Estatísticas gerais | `pages/EstatisticasGerais.jsx` | Sim |
| Transações | `pages/Transacoes.jsx` | Sim |
| Saques | `pages/SaqueUsuarios.jsx` | Sim |
| Usuários bloqueados | `pages/UsuariosBloqueados.jsx` | Sim |
| Fila | `pages/Fila.jsx` | Sim |
| Top jogadores | `pages/TopJogadores.jsx` | Sim |
| Backup | `pages/Backup.jsx` | Sim |
| Configurações | `pages/Configuracoes.jsx` | Sim |
| Exportar dados | `pages/ExportarDados.jsx` | Sim |
| Logs | `pages/LogsSistema.jsx` | Sim |
| Chutes recentes | `pages/ChutesRecentes.jsx` | Sim |

**Órfãs (exemplos):** `pages/RelatorioSaques.jsx`, `SaquesPendentes.jsx`, `Withdrawals.jsx`, `Games.jsx`, `Payments.jsx`, … (não ligadas ao router ativo).

---

## 4. Mapa de endpoints chamados pelo frontend

### 4.1 Helpers

| Ficheiro | Base URL | Headers |
|----------|-----------|---------|
| `js/api.js` | `import.meta.env.VITE_API_URL` + path | `Content-Type`, **`x-admin-token: VITE_ADMIN_TOKEN`** (`getData`/`postData`) |
| `services/api.js` (axios) | `VITE_API_URL` ou `localhost:3000` | **`x-admin-token: 'goldeouro123'`** (fixo) |
| `services/dataService.js` | `config/env.js` → **`/api`** em PROD ou `VITE_API_URL` em dev | **`Authorization: Bearer` + token `localStorage`** (`admin-token`) |

### 4.2 Endpoints por página (resumo)

| Página | Chamada típica | Método (cliente) |
|--------|----------------|-------------------|
| Dashboard | `dataService.getGeneralStats()` → **`/api/admin/stats`** | GET |
| ListaUsuarios | `postData('/admin/lista-usuarios', {})` | POST (**backend legacy: GET**) |
| RelatorioUsuarios | `postData('/admin/relatorio-usuarios', {})` | POST |
| RelatorioPorUsuario | `postData(`/admin/usuario/${id}`, {})` | POST (**rota inexistente no router legacy**) |
| RelatorioFinanceiro | `postData('/admin/relatorio-financeiro', {})` | POST (**não no adminRoutes**) |
| RelatorioGeral | `postData('/admin/relatorio-geral', {})` | POST (**não listado**) |
| RelatorioSemanal | **`api.post('/admin/relatorio-semanal', {})`** | POST |
| Estatisticas | **`api.get('/admin/estatisticas-gerais')`** | **GET** (**backend espera POST**) |
| EstatisticasGerais | `postData('/admin/estatisticas-gerais', {})` | POST |
| Transacoes | `postData('/admin/transacoes-recentes', {})` | POST |
| SaqueUsuarios | `postData('/admin/relatorio-saques', {})` + CSV | POST + GET nova aba |
| UsuariosBloqueados | `postData('/admin/usuarios-bloqueados', {})` | POST |
| Fila | `postData('/fila/status', …)` (**não** `/admin`) | POST |
| TopJogadores | `postData('/admin/top-jogadores', {})` | POST |
| Backup | `postData('/admin/backup-status'`, `/admin/backup/create`, restore, delete) | POST |
| Configuracoes | `postData('/admin/configuracoes'`, `/admin/configuracoes/salvar`) | POST |
| ExportarDados | `postData('/admin/dados-exportacao', {})`; export `VITE_API_URL + '/admin/exportar/' + tipo` | POST + GET |
| Logs | `postData('/admin/logs', {})` | POST |
| Chutes | `postData('/admin/chutes-recentes', {})` | POST |

**Padrões de erro comuns**

- **`postData` não verifica `response.ok`** → erros HTTP muitas vezes **não** disparam `catch`.
- **`catch` preenche dados fictícios** em várias páginas (risco enganoso).
- **`credentials: 'include'`** em `dataService` sem evidência de cookies de sessão admin no mesmo domínio.

---

## 5. Mapa de endpoints reais do backend

### 5.1 `server-fly.js` (produção analisada)

| Método | Rota | Handler / notas |
|--------|------|------------------|
| POST | **`/api/admin/withdraw/approve`** | JWT + `requireAdministradorDb` → `adminWithdrawController.approveManualWithdraw`; **200** sucesso/dedupe; **400** body; **409** conflitos; **500** genérico |
| POST | **`/api/admin/withdraw/cancel`** | idem → `cancelManualWithdraw`; **409** `ALREADY_PAID`, etc.; **500** |
| POST | **`/api/admin/bootstrap`** | primeiro admin; JWT |

**Ausente:** montagem `adminRoutes.js`, **`/admin/*`** server-side, **`/api/admin/stats`**, **`/api/admin/users`**, listagens relatório, exports.

### 5.2 `routes/adminRoutes.js` (contrato legacy — **requer montagem + controllers**)

| Método | Rota relativa ao router\* | Controller (arquivo arquivado) |
|--------|---------------------------|--------------------------------|
| POST | `/relatorio-semanal` | relatorioSemanal |
| POST | `/controle-fila` | controleFila |
| POST | `/estatisticas-gerais` | estatisticasGerais |
| POST | `/top-jogadores` | topJogadores |
| POST | `/transacoes-recentes` | transacoesRecentes |
| POST | `/chutes-recentes` | chutesRecentes |
| POST | `/relatorio-usuarios` | relatorioUsuarios |
| POST | `/logs` | logsSistema |
| POST | `/usuarios-bloqueados` | usuariosBloqueados |
| POST | `/suspender/:id` | suspenderUsuario |
| POST | `/bloquear`, `/desbloquear` | bloquear/desbloquear |
| POST | `/backup-status` | statusBackup |
| GET | **`/lista-usuarios`** | listaUsuarios |
| GET | `/exportar/usuarios-csv`, `/chutes-csv`, `/transacoes-csv`, `/saques-csv`, `/relatorio-completo-csv`, `/relatorio-geral-csv` | exportController |

\*Prefixo habitual seria **`/admin`** ao montar; o front chama **`/admin/...`** já com prefixo absoluto sob `VITE_API_URL`.

**Autenticação legacy:** `authAdminToken` — header **`x-admin-token`** comparado com **`ADMIN_TOKEN`** no env do servidor (**não** JWT).

### 5.3 `controllers/adminWithdrawController.js` (ativo)

Único fluxo financeiro-admin explícito além das rotas acima — corpo esperado **`{ saqueId }`** ou **`{ id }`**, string UUID.

---

## 6. Matriz Frontend × Backend

Legenda endpoint no Fly legacy: **NÃO** = não há rota equivalente em `server-fly.js`; **ROUTER só** = existe em `adminRoutes.js` mas controllers não estão no tree ativo e router não montado no Fly.

| Página | Rota frontend | Ficheiro | Endpoint chamado | Existe Fly? | Contrato compatível? | Mock/fallback? | Risco |
|--------|----------------|----------|------------------|-------------|-------------------------|----------------|--------|
| Dashboard | `/painel` | `Dashboard.jsx` | `GET …/api/admin/stats` (dataService) | **NÃO** | **PARCIAL** (estrutura genérica vs inexistente) | Zeros ao falhar | **ALTO** |
| Lista usuários | `/lista-usuarios` | `ListaUsuarios.jsx` | POST `/admin/lista-usuarios` | **NÃO** | **NÃO** (legacy **GET**) | [] em erro | **ALTO** |
| Relatório usuários | `/relatorio-usuarios` | `RelatorioUsuarios.jsx` | POST `/admin/relatorio-usuarios` | **NÃO** | **PARCIAL** (Postgres snake_case vs camelCase UI) | Parcial/mock | **MÉDIO/ALTO** |
| Relatório por usuário | `/relatorio-por-usuario` | `RelatorioPorUsuario.jsx` | POST `/admin/usuario/:id` | **NÃO** | **NÃO** | Fallback fictício | **BLOQUEADOR** (rota+API) |
| Financeiro | `/relatorio-financeiro` | `RelatorioFinanceiro.jsx` | POST `/admin/relatorio-financeiro` | **NÃO** | **NÃO** | Mock | **BLOQUEADOR** financeiro |
| Relatório geral | `/relatorio-geral` | `RelatorioGeral.jsx` | POST `/admin/relatorio-geral` | **NÃO** | **NÃO** | Mock | **BLOQUEADOR** |
| Semanal | `/relatorio-semanal` | `RelatorioSemanal.jsx` | POST `/admin/relatorio-semanal` | **NÃO** (ROUTER só) | **PARCIAL** (shape JSON difere — ver controller arquivado) | Mock | **ALTO** |
| Estatísticas | `/estatisticas` | `Estatisticas.jsx` | **GET** `/admin/estatisticas-gerais` | **NÃO** | **NÃO** método | Zeros/mock | **ALTO** |
| Estatísticas gerais | `/estatisticas-gerais` | `EstatisticasGerais.jsx` | POST `/admin/estatisticas-gerais` | **NÃO** (ROUTER só) | **PARCIAL** (camelCase vs snake `_`) | Fallback zeros | **MÉDIO** |
| Transações | `/transacoes` | `Transacoes.jsx` | POST `/admin/transacoes-recentes` | **NÃO** (ROUTER só) | **PARCIAL** | Mock | **ALTO** |
| Saques | `/saque-usuarios` | `SaqueUsuarios.jsx` | POST `/admin/relatorio-saques` | **NÃO** | **NÃO** | Mock | **BLOQUEADOR** |
| Bloqueados | `/usuarios-bloqueados` | `UsuariosBloqueados.jsx` | POST `/admin/usuarios-bloqueados` | **NÃO** (ROUTER só) | **PARCIAL**; **desbloquear só simula** | Mock condicional | **BLOQUEADOR** segurança |
| Fila | `/fila` | `Fila.jsx` | POST `/fila/status` | **NÃO** garantido | **NÃO** | Mock | **MÉDIO** |
| Top jogadores | `/top-jogadores` | `TopJogadores.jsx` | POST `/admin/top-jogadores` | **NÃO** (ROUTER só) | **PARCIAL** (`goals_scored` vs UI) | [] | **MÉDIO** |
| Backup | `/backup` | `Backup.jsx` | POST `/admin/backup-*` | **NÃO** (ROUTER parcial backup-status) | **NÃO** create/restore/delete | Mock forte | **BLOQUEADOR** operação |
| Configurações | `/configuracoes` | `Configuracoes.jsx` | POST `/admin/configuracoes*` | **NÃO** | **NÃO** | Mock | **BLOQUEADOR** |
| Exportar | `/exportar-dados` | `ExportarDados.jsx` | POST `/admin/dados-exportacao`; GET `/admin/exportar/{tipo}` | **NÃO / ROUTER só** | **PARCIAL** (tipo id alinha aos GET export) | Mock + delay falso | **ALTO** |
| Logs | `/logs` | `LogsSistema.jsx` | POST `/admin/logs` | **NÃO** (ROUTER só) | **PARCIAL** (`level` vs schema) | Mock | **MÉDIO** |
| Chutes | `/chutes` | `ChutesRecentes.jsx` | POST `/admin/chutes-recentes` | **NÃO** (ROUTER só) | **PARCIAL** (nomes colunas) | Mock condicional | **MÉDIO** |

**Painel não chama** `POST /api/admin/withdraw/approve|cancel` — operações só por ferramentas externas.

---

## 7. Páginas com dados mockados ou fallback enganoso

| Página | Comportamento |
|--------|----------------|
| SaqueUsuarios | Array fixo 3 linhas no `catch` |
| RelatorioGeral | Objeto grande fictício no `catch` |
| RelatorioFinanceiro | Idem |
| RelatorioPorUsuario | “João Silva” fictício no `catch` |
| RelatorioSemanal | Valores monetários/partidas fictícios |
| ListaUsuarios | [] (menos enganoso, mas vazio pode ocultar falha de rota) |
| Transacoes | Mock array no `catch` |
| Fila | Estado de fila fictício |
| Backup | Lista falsificada; create failure adiciona backup “falso” à UI |
| Configuracoes | JSON default; alert de sucesso mesmo com falha pode enganar após erro parcial |
| ExportarDados | Resumo contagens fictício; botão só `setTimeout` + `window.open` |
| LogsSistema | Vários eventos exemplo |
| Estatisticas | Zeros/formatos pré-definidos no erro |
| UsuariosBloqueados | `desbloquear` **simulado** (timeout) atualiza só estado local |

---

## 8. Páginas com endpoints inexistentes (Face ao `server-fly.js`)

**Todas** as linhas legacy `/admin/*` e `/fila/status` quando o deploy é apenas `server-fly.js` **sem proxy** para outro serviço admin.

Destaques de **URLs não declaradas** nem no `adminRoutes.js`:

- **`/admin/relatorio-saques`**, **`/admin/relatorio-financeiro`**, **`/admin/relatorio-geral`**, **`/admin/usuario/:id`**, **`/admin/dados-exportacao`**, **`/admin/configuracoes`**, **`/admin/configuracoes/salvar`**, **`/admin/backup/create|restore|delete`**.

---

## 9. Páginas com contrato incompatível

| Problema | Onde |
|----------|------|
| **GET vs POST** | `Estatisticas.jsx` vs `router.post('/estatisticas-gerais')` |
| **POST vs GET** | `ListaUsuarios` POST vs lista GET no router |
| **Shape JSON** | `relatorioSemanal` legado vs cards que esperam `credits/debits/totalGames` diretos (`RelatorioSemanal.jsx`) vs resposta nested no controller arquivado |
| **Ranking** | `topJogadores` SQL (`goals_scored`, `user_id`) vs UI (`totalGols`, `name`) |
| **`scored`** chutes (`ChutesRecentes`) vs modelo Supabase atual possivelmente outros nomes (`resultado`) |
| **Auth** | JWT real no Fly vs **`x-admin-token`** / Bearer falso |

---

## 10. Funcionalidades críticas por risco

| Domínio | Risco |
|---------|-------|
| **Financeiro** | Relatório financeiro, geral, saques, export, dashboard zeros — **BLOQUEADOR** |
| **Saques** | Mock + ausência approve/cancel na UI — **BLOQUEADOR** |
| **Transações / Relatórios** | Fallback e schema Postgres vs Supabase — **ALTO** |
| **Usuários / Bloqueados** | Desbloquear simulado — **BLOQUEADOR** operacional/legal |
| **Exportações** | URLs sem cookie token na nova aba; backend ausente Fly — **ALTO** |
| **Logs** | Auditoria falsificável — **MÉDIO** |
| **Backup/restore/delete** | Ações graves com APIs inexistentes e UI otimista — **BLOQUEADOR** |
| **Configurações** | Falsificação salva local — **BLOQUEADOR** |
| **Autenticação** | Login `admin123`, token fictício vs JWT — **BLOQUEADOR** |

---

## 11. Problemas estruturais encontrados

1. **`server-fly.js` não serve** o pacote **`adminRoutes`**.
2. **`adminController` / `exportController` ausentes** do `controllers/` ativo.
3. **Dois ou três stacks HTTP** (`js/api.js`, axios `api.js`, `dataService`).
4. **Token fixo em `services/api.js`** (`goldeouro123`).
5. **`VITE_ADMIN_TOKEN`** no bundle cliente.
6. **Rota `RelatorioPorUsuario` sem `:id`**; links **`/relatorio-usuario/`** inconsistentes.
7. **Logout.jsx** não localizado na pesquisa.
8. **`postData`** sem tratamento **`response.ok`**.
9. **Páginas duplicadas** não usadas aumentam erro humano ao editar arquivo errado.
10. **`dataService`**: em PROD `getApiUrl()` = **`'/api'`** + endpoints **`/api/admin/...`** → possível **`/api/api/admin/...`**.

---

## 12. Impacto financeiro e operacional

- Decisões com **números inventários** nos relatórios e saques.
- **Ausência** de vista consolidada ledger × `saques` no admin.
- **Risco reputacional/regulatório** exibir estado de utilizadores/backups configurados quando não refletem o sistema.
- **Segurança:** qualquer utilizador da senha **`admin123`** em build exposto obtém estado “autenticado” na UI mesmo sem JWT do backend real.

*(Detalhes do fluxo manual approve/cancel e ledger já constam nos documentos base.)*

---

## 13. Ordem recomendada de correção cirúrgica

1. **Autenticação** — remover senha/local fake; SSO ou login contra **`/api/auth/login`** armazenando JWT; alinhar `MainLayout`/interceptor **401**.
2. **`server-fly.js`** — expor **`GET/POST`** admin bem definidas (lista `saques`, stats agregadas read-only Supabase) com **JWT + tipo admin**.
3. **Fluxo payout manual transacional** (ver relatório pré-exec saques).
4. **Eliminar mocks** ou isolar apenas em **`import.meta.env.DEV`**.
5. **`js/api`** — `response.ok`, mensagens ao utilizador honestas.
6. **Unificar** client (`fetch` ou axios) **um** modelo de headers.
7. **Corrigir rotas** `:id`, links `RelatorioUsuarios`.
8. **Remover/desativar botões destrutivos** (restore/delete backup) até existir backend suportado.
9. **`dataService` base URL** Duplo `/api`.
10. **`Exportar`** — enviar auth na mesma política ou download autenticado server-side.

---

## 14. Critério GO/NO-GO por módulo

| Módulo | GO (usar dados para decisão?) | NO-GO |
|--------|------------------------------|-------|
| Saques lista | NO-GO | Até endpoint real sem mock |
| Approve/Cancel UI | NO-GO | Até integração + transação definida |
| Relatório financeiro/geral | NO-GO | |
| Dashboard | NO-GO | até `stats` real |
| Bloqueados ação desbloquear | NO-GO | |
| Backup restore/delete | NO-GO | |
| Configurações salvar | NO-GO | |
| Exportações | NO-GO | até CSV servido pelo Fly com auth |
| Logs | NO-GO** | **condicional** se só auditoria soft |
| Top jogadores / chutes | NO-GO** | **condicional** se só analytics |

---

## 15. Conclusão técnica

O painel admin no estado do repositório é **um protótipo acoplado a um backend legacy não implantado no `server-fly.js`**, com **múltiplas camadas de mock** e **riscos bloqueadores** em finanças, segurança e operações destrutivas. Não deve ser usado como **fonte de verdade** até existir **contrato único**, **autenticação JWT alinhada**, **listagens reais Supabase** e **remoção de fallbacks enganosos**.

---

*Fim do diagnóstico read-only — painel admin completo.*
