# READ-ONLY ABSOLUTO — PRÉ-CIRURGIA — BLOCO J

**Projeto:** Gol de Ouro — painel `goldeouro-admin` (monorepo `goldeouro-backend`)  
**Backend ativo (evidência):** `package.json` → `"main": "server-fly.js"`  
**Modo:** congelamento técnico; nenhuma alteração de código foi feita na produção deste mapeamento além da criação deste arquivo de relatório.  
**Data:** 2026-03-28  
**Base documental anterior:** `docs/relatorios/AUDITORIA-READONLY-BLOCO-J-PAINEL-DE-CONTROLE-2026-03-28.md`

---

## 1. Resumo executivo operacional

O fluxo real do SPA admin é **`index.html` → `src/main.jsx` → `BrowserRouter` → `src/AppRoutes.jsx`**. **`src/App.jsx` não entra na cadeia de montagem.** A área autenticada usa **`MainLayout`** + **`Sidebar`**; a sessão do painel é **`js/auth.js`** (`admin-token` + `admin-token-timestamp`, 24h), alimentada por **`pages/Login.jsx`** (senha local `admin123`, token sintético `admin-token-${Date.now()}`) — **sem** validação contra o backend.

As telas oficiais dependem de **`/admin/*`** (via `VITE_API_URL + path`) ou de **`/api/admin/*`** (via `dataService`), enquanto **`server-fly.js` não expõe** essa superfície administrativa legada: há apenas **`POST /api/admin/bootstrap`** (JWT de usuário autenticado, propósito de promoção one-shot), além de APIs de jogo/auth/pagamentos compatíveis com o player. O arquivo **`routes/adminRoutes.js`** existe no repositório mas **não é montado** em `server-fly.js` e **quebra ao carregar** por `require` de **`controllers/adminController`** e **`controllers/exportController`** inexistentes em `controllers/` (há apenas `adminSaquesController.js` entre nomes relacionados).

**Três camadas HTTP** coexistem nas páginas oficiais: `js/api.js` (`x-admin-token: VITE_ADMIN_TOKEN`), `services/api.js` axios (**`x-admin-token: 'goldeouro123'` fixo**), e `dataService.js` (**`Authorization: Bearer` + token do `localStorage`** em paths `/api/admin/...`, com **`getApiUrl()` = `'/api'` em PROD** ⇒ URL efetiva **`/api/api/admin/...`**). Isso é bloqueador para integração previsível.

**Conclusão operacional:** a cirurgia mínima segura exige **decisão de contrato** (quais endpoints o backend real passará a servir), **implementação ou remoção** das rotas admin no servidor ativo, **cliente HTTP único** + **headers alinhados ao middleware real** (`middlewares/authMiddleware.js` usa **`x-admin-token`** comparado a `env`), e **correção de rota/param** em relatório por usuário.

---

## 2. Entry point e fluxo real do painel

| Elemento | Arquivo | Evidência |
|----------|---------|-----------|
| HTML entry | `goldeouro-admin/index.html` | `<script type="module" src="./src/main.jsx">` |
| React bootstrap | `goldeouro-admin/src/main.jsx` | Importa só `AppRoutes.jsx` dentro de `BrowserRouter` |
| Rotas SPA | `goldeouro-admin/src/AppRoutes.jsx` | Todas as rotas declaradas; sem `App.jsx` |
| Layout autenticado | `goldeouro-admin/src/components/MainLayout.jsx` | `isAuthenticated()` de `js/auth.js`; senão `navigate('/login')` |
| Navegação lateral | `goldeouro-admin/src/components/Sidebar.jsx` | Links para paths alinhados ao router principal |
| Login | `goldeouro-admin/src/pages/Login.jsx` | `validPasswords` + `login(token)` de `js/auth.js` |
| Auth de sessão painel | `goldeouro-admin/src/js/auth.js` | `admin-token`, `admin-token-timestamp` |
| Logout rota | `goldeouro-admin/src/components/Logout.tsx` | Remove `admin-token`, `admin-user`, etc.; **não** remove `admin-token-timestamp` |
| Logout Sidebar (alternativo) | `goldeouro-admin/src/config/env.js` → `logout()` | Remove outro conjunto de chaves (`admin_user`, etc.) |

**Não participam do fluxo real:** `goldeouro-admin/src/App.jsx`, `goldeouro-admin/src/routes/index.jsx`, `AppRoutes-working.jsx`, `AppRoutes-simple.jsx`, pastas `BACKUP-*`, e o app `goldeouro-player` (escopo fora do BLOCO J admin).

---

## 3. Rotas oficiais confirmadas

Fonte única: **`goldeouro-admin/src/AppRoutes.jsx`**.

| Path | Componente | Layout |
|------|------------|--------|
| `/login` | `Login` | — |
| `/logout` | `Logout` | — |
| `/` | `Dashboard` | `MainLayout` |
| `/painel` | `Dashboard` | `MainLayout` |
| `/lista-usuarios` | `ListaUsuarios` | `MainLayout` |
| `/relatorio-usuarios` | `RelatorioUsuarios` | `MainLayout` |
| `/relatorio-por-usuario` | `RelatorioPorUsuario` | `MainLayout` |
| `/relatorio-financeiro` | `RelatorioFinanceiro` | `MainLayout` |
| `/relatorio-geral` | `RelatorioGeral` | `MainLayout` |
| `/relatorio-semanal` | `RelatorioSemanal` | `MainLayout` |
| `/estatisticas` | `Estatisticas` | `MainLayout` |
| `/estatisticas-gerais` | `EstatisticasGerais` | `MainLayout` |
| `/transacoes` | `Transacoes` | `MainLayout` |
| `/saque-usuarios` | `SaqueUsuarios` | `MainLayout` |
| `/usuarios-bloqueados` | `UsuariosBloqueados` | `MainLayout` |
| `/fila` | `Fila` | `MainLayout` |
| `/top-jogadores` | `TopJogadores` | `MainLayout` |
| `/backup` | `Backup` | `MainLayout` |
| `/configuracoes` | `Configuracoes` | `MainLayout` |
| `/exportar-dados` | `ExportarDados` | `MainLayout` |
| `/logs` | `LogsSistema` | `MainLayout` |
| `/chutes` | `ChutesRecentes` | `MainLayout` |

**Desalinhamento de config auxiliar:** `goldeouro-admin/src/config/navigation.js` inclui **`/jogo`** em `validRoutes`, rota **inexistente** em `AppRoutes.jsx`.

---

## 4. Páginas oficiais confirmadas

Arquivos em `goldeouro-admin/src/pages/` **referenciados por `AppRoutes.jsx`** (mapeamento 1:1 com a tabela acima):

- `Dashboard.jsx`, `Login.jsx`, `ListaUsuarios.jsx`, `RelatorioUsuarios.jsx`, `RelatorioPorUsuario.jsx`, `RelatorioFinanceiro.jsx`, `RelatorioGeral.jsx`, `RelatorioSemanal.jsx`, `Estatisticas.jsx`, `EstatisticasGerais.jsx`, `Transacoes.jsx`, `SaqueUsuarios.jsx`, `UsuariosBloqueados.jsx`, `Fila.jsx`, `TopJogadores.jsx`, `Backup.jsx`, `Configuracoes.jsx`, `ExportarDados.jsx`, `LogsSistema.jsx`, `ChutesRecentes.jsx`

Componente de rota adicional: **`goldeouro-admin/src/components/Logout.tsx`** (`/logout`).

---

## 5. Legado fora da malha oficial

### 5.1 Roteadores mortos ou paralelos

- **`goldeouro-admin/src/routes/index.jsx`**: define `AppRoutes` com paths `/usuarios`, `/saques`, etc. — **não importado** por `main.jsx`.
- **`goldeouro-admin/src/AppRoutes-working.jsx`**, **`AppRoutes-simple.jsx`**: não referenciados pelo entrypoint.
- **`goldeouro-admin/src/App.jsx`**: fluxo login/dashboard autônomo com credenciais em código — **fora** do `main.jsx`.

### 5.2 Páginas em `src/pages/` sem rota em `AppRoutes.jsx` (42 arquivos)

Não fazem parte da malha oficial atual (inventário `glob` 62 arquivos − 20 oficiais): entre outras, variantes `*Responsive*.jsx`, `*Padronizada*.jsx`, `*ResponsivePadronizada*.jsx`, e páginas como `Users.jsx`, `System.jsx`, `Games.jsx`, `RelatorioSaques.jsx`, `RelatorioTransacoes.jsx`, `ControleFila.jsx`, `Payments.jsx`, `Profile.jsx`, `Bloqueados.jsx`, `TestePadronizacao.jsx`, etc.

### 5.3 Backend admin legado não ativo

- **`routes/adminRoutes.js`**: define handlers com prefixo relativo ao router (ex.: `POST /relatorio-semanal`, `GET /lista-usuarios`) — **não montado** em `server-fly.js`; **requires quebrados** para controllers inexistentes na pasta `controllers/`.

### 5.4 Pastas e artefatos de ruído

- **`goldeouro-admin/BACKUP-*`**: cópias históricas de `main.jsx` / `AppRoutes.jsx` — não participam do build alvo.
- **`EXEMPLO-FALLBACK-CONDICIONAL.jsx`** (raiz admin, se presente): exemplo, não produto.

### 5.5 Componente `GameDashboard` na malha oficial

- **`goldeouro-admin/src/components/GameDashboard.jsx`**: assinatura **`const GameDashboard = () =>`** — **não recebe** `stats`; estado interno e retornos fixos “zerados”; import de `api` existe mas o fluxo atual usa dados fixos nos callbacks. A página oficial `Dashboard.jsx` passa **`stats={stats}`**, que é **ignorado** pelo componente.

---

## 6. Camadas de API em uso real

### 6.1 `goldeouro-admin/src/js/api.js`

- **`getData` / `postData`:** `fetch(VITE_API_URL + endpoint, …)` com header **`x-admin-token: import.meta.env.VITE_ADMIN_TOKEN`**.

### 6.2 `goldeouro-admin/src/services/api.js`

- Axios **`baseURL: import.meta.env.VITE_API_URL`**, header fixo **`x-admin-token: 'goldeouro123'`**.

### 6.3 `goldeouro-admin/src/services/dataService.js`

- **`getApiUrl()`** (`config/env.js`): em **`import.meta.env.PROD`** retorna **`'/api'`**; requisições usam endpoints **`/api/admin/...`** ⇒ concatenação **`/api` + `/api/admin/...`**.
- Header **`Authorization: Bearer ${localStorage.getItem('admin-token')}`** (token do login client-side), **sem** `x-admin-token`.

### 6.4 Uso por página **oficial**

| Página | Camada | Chamadas (path relativo ao cliente) |
|--------|--------|-------------------------------------|
| `Dashboard.jsx` | `dataService` | `GET` implícito via `getGeneralStats()` → **`/api/admin/stats`** |
| `ListaUsuarios.jsx` | `postData` | **`POST /admin/lista-usuarios`** |
| `RelatorioUsuarios.jsx` | `postData` | **`POST /admin/relatorio-usuarios`** |
| `RelatorioPorUsuario.jsx` | `postData` | **`POST /admin/usuario/:id`** (`id` de `useParams`) |
| `RelatorioFinanceiro.jsx` | `postData` | **`POST /admin/relatorio-financeiro`** |
| `RelatorioGeral.jsx` | `postData` | **`POST /admin/relatorio-geral`** |
| `RelatorioSemanal.jsx` | axios `api` | **`POST /admin/relatorio-semanal`** |
| `Estatisticas.jsx` | axios `api` | **`GET /admin/estatisticas-gerais`** |
| `EstatisticasGerais.jsx` | `postData` | **`POST /admin/estatisticas-gerais`** |
| `Transacoes.jsx` | `postData` | **`POST /admin/transacoes-recentes`** |
| `SaqueUsuarios.jsx` | `postData` | **`POST /admin/relatorio-saques`** |
| `UsuariosBloqueados.jsx` | `postData` | **`POST /admin/usuarios-bloqueados`** |
| `Fila.jsx` | `postData` | **`POST /fila/status`** (corpo `{ userId }`, `userId` fixo `1` no estado) |
| `TopJogadores.jsx` | `postData` | **`POST /admin/top-jogadores`** |
| `Backup.jsx` | `postData` | **`POST /admin/backup-status`**, **`/admin/backup/create`**, **`/admin/backup/restore`**, **`/admin/backup/delete`** |
| `Configuracoes.jsx` | `postData` | **`POST /admin/configuracoes`**, **`POST /admin/configuracoes/salvar`** |
| `ExportarDados.jsx` | `postData` | **`POST /admin/dados-exportacao`** |
| `LogsSistema.jsx` | `postData` | **`POST /admin/logs`** |
| `ChutesRecentes.jsx` | `postData` | **`POST /admin/chutes-recentes`** |
| `Login.jsx` | — | Não chama API de autenticação backend |

**Observação:** `Estatisticas.jsx` (GET) e `EstatisticasGerais.jsx` (POST) disputam o mesmo recurso conceitual com **métodos diferentes** e **clientes diferentes**.

---

## 7. Mapa frontend x backend real

**Referência de servidor ativo:** `server-fly.js` (trechos verificados por `grep` de `app.get/post/use`).

**Único endpoint sob `/api/admin/*` no servidor ativo:** **`POST /api/admin/bootstrap`** (JWT `authenticateToken`, não `x-admin-token`).

**Endpoint de fila existente (player):** **`GET /api/fila/entrar`** (`authenticateToken`) — não equivale a **`POST /fila/status`**.

Demais rotas úteis ao domínio (não substituem o painel admin legado): `/api/auth/*`, `/api/user/*`, `/api/games/shoot`, `/api/withdraw/*`, `/api/payments/*`, `/api/analytics`, `/health`, `/ready`, etc.

### Tabela — telas oficiais vs backend

| Tela oficial | Endpoint esperado (pelo frontend) | Método | Arquivo que chama | Existe em `server-fly.js`? | Observação de desalinhamento |
|--------------|-----------------------------------|--------|-------------------|---------------------------|------------------------------|
| Dashboard | `/api/admin/stats` (base PROD `/api`) | GET (fetch) | `services/dataService.js` via `Dashboard.jsx` | **Não** | Duplicação `/api/api/...` em PROD; Bearer ≠ `x-admin-token` |
| Lista de usuários | `/admin/lista-usuarios` | POST | `ListaUsuarios.jsx` | **Não** | Legado `adminRoutes` usa **GET** `/lista-usuarios` se montado com prefixo `/admin` |
| Relatório usuários | `/admin/relatorio-usuarios` | POST | `RelatorioUsuarios.jsx` | **Não** | Presente só em `routes/adminRoutes.js` (não montado) |
| Relatório por usuário | `/admin/usuario/:id` | POST | `RelatorioPorUsuario.jsx` | **Não** | Rota SPA **sem `:id`** ⇒ `id` indefinido |
| Relatório financeiro | `/admin/relatorio-financeiro` | POST | `RelatorioFinanceiro.jsx` | **Não** | Não consta em `adminRoutes.js` auditado |
| Relatório geral | `/admin/relatorio-geral` | POST | `RelatorioGeral.jsx` | **Não** | Não consta nas rotas POST do trecho lido de `adminRoutes.js` |
| Relatório semanal | `/admin/relatorio-semanal` | POST | `RelatorioSemanal.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Estatísticas | `/admin/estatisticas-gerais` | GET | `Estatisticas.jsx` | **Não** | Mesmo nome que POST em outra página |
| Estatísticas gerais | `/admin/estatisticas-gerais` | POST | `EstatisticasGerais.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Transações | `/admin/transacoes-recentes` | POST | `Transacoes.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Saques usuários | `/admin/relatorio-saques` | POST | `SaqueUsuarios.jsx` | **Não** | Não listado no trecho de `adminRoutes.js` |
| Usuários bloqueados | `/admin/usuarios-bloqueados` | POST | `UsuariosBloqueados.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Fila | `/fila/status` | POST | `Fila.jsx` | **Não** | Backend expõe **`GET /api/fila/entrar`** (outro contrato) |
| Top jogadores | `/admin/top-jogadores` | POST | `TopJogadores.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Backup | `/admin/backup-*` (vários) | POST | `Backup.jsx` | **Não** | Existe só `backup-status` em `adminRoutes.js` (router morto) |
| Configurações | `/admin/configuracoes` (+ salvar) | POST | `Configuracoes.jsx` | **Não** | Fora do trecho de `adminRoutes.js` |
| Exportar dados | `/admin/dados-exportacao` | POST | `ExportarDados.jsx` | **Não** | CSVs em `adminRoutes.js` usam paths `/exportar/...` (não montado) |
| Logs | `/admin/logs` | POST | `LogsSistema.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Chutes recentes | `/admin/chutes-recentes` | POST | `ChutesRecentes.jsx` | **Não** | Existe POST homônimo em `adminRoutes.js` (router morto) |
| Login | — | — | `Login.jsx` | N/A | Auth local; não valida `ADMIN_TOKEN` do backend |

---

## 8. Arquivos que DEVEM ser alterados na cirurgia

Lista **mínima conceitual** (alinhamento FE↔BE ativo + cliente único + rotas corretas + navegação). Na prática, tocará **cadeia de importação** das páginas oficiais.

**Frontend — obrigatórios para o objetivo declarado:**

1. **`goldeouro-admin/src/js/api.js`** — unificação ou substituição pelo cliente canônico.
2. **`goldeouro-admin/src/services/api.js`** — remover token hardcoded; alinhar com política única.
3. **`goldeouro-admin/src/services/dataService.js`** — corrigir base URL/paths e esquema de auth; ou fundir em um só serviço.
4. **`goldeouro-admin/src/config/env.js`** — `getApiUrl()` e coerência com onde o admin será hospedado (proxy `/api` vs URL absoluta).
5. **`goldeouro-admin/src/AppRoutes.jsx`** — incluir parâmetro para relatório individual (ex. `:id`) ou ajustar página.
6. **`goldeouro-admin/src/pages/RelatorioPorUsuario.jsx`** — coerência com rota e contrato real.
7. **Todas as 19 páginas oficiais que fazem HTTP** (vide seção 6.4) — trocar imports e endpoints para o contrato final.
8. **`goldeouro-admin/src/components/GameDashboard.jsx`** — ou passar a consumir props/backend real ou deixar de ser usado como métrica oficial.
9. **`goldeouro-admin/src/pages/Login.jsx`** + **`goldeouro-admin/src/js/auth.js`** + **`goldeouro-admin/src/components/MainLayout.jsx`** — se o critério de “admin real” for backend (`x-admin-token` ou JWT admin).
10. **`goldeouro-admin/src/components/Logout.tsx`** + **`goldeouro-admin/src/config/env.js` (`logout`)** — limpeza consistente de chaves de sessão.
11. **`goldeouro-admin/index.html`** (CSP `connect-src`) e **`vercel.json`** (se deploy admin usar outro host) — alinjar com `VITE_API_URL` real.

**Backend — obrigatório se a cirurgia for “painel fiel ao `server-fly.js`” com APIs administrativas:**

12. **`server-fly.js`** — montar rotas admin reais **ou** novos endpoints sob prefixo estável (`/api/admin/...`) com implementação válida.
13. **Controllers/serviços** ausentes referenciados por **`routes/adminRoutes.js`** — restaurar, reescrever ou substituir por handlers inline documentados.
14. **`middlewares/authMiddleware.js`** — permanece referência para **`x-admin-token`** nas rotas admin legadas; qualquer novo contrato deve ser explicitado aqui ou em middleware dedicado.

*(Arquivos adicionais surgirão conforme a escolha: reaproveitar `adminRoutes.js` vs reimplementar; isso é decisão de arquitetura, não coberta por este congelamento.)*

---

## 9. Arquivos que NÃO DEVEM ser alterados nesta cirurgia

**Recomendação operacional:** congelar tudo que não participa da malha **`main.jsx` → `AppRoutes.jsx`** nem da camada HTTP/auth.

- **`goldeouro-player/**`** — produto distinto.
- **`goldeouro-admin/BACKUP-*/**`** — histórico; não editar durante cirurgia (arquivar/remover em fase posterior).
- **`goldeouro-admin/src/App.jsx`**, **`goldeouro-admin/src/routes/index.jsx`**, **`AppRoutes-working.jsx`**, **`AppRoutes-simple.jsx`** — legado não montado; não “consertar” até haver decisão de remoção.
- **Páginas não roteadas** em `src/pages/*` (42 arquivos) — não são necessárias para manter Sidebar+router oficial; tratar em fase de arquivo/remoção.
- **`goldeouro-admin/src/config/designSystem.js`**, **`src/templates/*`**, **`src/index.css`** / temas globais — salvo impacto direto de layout quebrado por mudança de rota (improvável na primeira fase de API).
- **Assets estáticos** (`assets/`, `public/`) — salvo troca de logo referenciada pela Sidebar.
- **`goldeouro-admin/src/config/navigation.js`** — pode ser ajustado **depois** da unificação de rotas; não é bloqueador de API.

---

## 10. Bloqueadores máximos

1. **Superfície `/admin/*` e `/api/admin/*` (exceto bootstrap) inexistente no `server-fly.js`** — todas as telas oficiais que dependem desses paths falham em integração real.
2. **`routes/adminRoutes.js` não carregável** — `require` de controllers inexistentes; router não montado no servidor ativo.
3. **Três estratégias de auth/token** (`VITE_ADMIN_TOKEN`, `goldeouro123`, Bearer com token do login local) — comportamento imprevisível e incompatível com `authMiddleware.js` (`x-admin-token` + `ADMIN_TOKEN`).
4. **`dataService` em PROD** — concatenação **`/api/api/admin/...`**.
5. **`RelatorioPorUsuario`** — `useParams().id` com rota **sem `:id`**.
6. **`Fila.jsx`** — **`POST /fila/status`** vs **`GET /api/fila/entrar`** no backend ativo.
7. **Divergência método** — exemplo: `ListaUsuarios` **POST** `/admin/lista-usuarios` vs **`GET /lista-usuarios`** no router legado.
8. **CSP** (`index.html` `connect-src` inclui `https://goldeouro-backend.fly.dev`) — risco de bloqueio se `VITE_API_URL` apontar para host não listado.
9. **Login client-side** — credenciais e token no browser; não prova privilégio admin no servidor.
10. **`GameDashboard`** — métricas exibidas não derivam do `stats` do `Dashboard` nem de API real no estado atual.

---

## 11. Ordem cirúrgica recomendada

1. **Congelar contrato:** lista fechada de endpoints que `server-fly.js` passará a expor (prefixo, método, payload, auth).
2. **Backend primeiro:** implementar ou reparar montagem de rotas admin no servidor ativo (incluindo controllers ou handlers mínimos) até `health` + um endpoint de smoke (`x-admin-token` ou JWT, conforme decisão).
3. **Cliente HTTP único** em `goldeouro-admin`: uma implementação (`fetch` ou axios), uma `baseURL`, uma política de headers.
4. **Corrigir `getApiUrl` / proxy** para eliminar **`/api/api`** e alinhar ambiente local vs PROD.
5. **Migrar página a página oficial** na ordem de dependência operacional: **Login/auth** → **Dashboard** → **ListaUsuarios** → relatórios → restante da Sidebar.
6. **Rotas React:** ajustar **`/relatorio-por-usuario/:id`** (ou query) + página.
7. **Logout unificado** — mesmas chaves que `auth.js` e `dataService` usam.
8. **CSP / env** — uma fonte de verdade para URL da API.
9. **Remoção/arquivamento em onda 2** — páginas duplicadas, `BACKUP-*`, roteadores mortos (não misturar com estabilização da malha oficial).

---

## 12. Critério de pronto para entrar na cirurgia

- [ ] Documento de contrato API admin aprovado (paths, métodos, auth, formatos de erro).
- [ ] Branch/ambiente isolado; build atual do admin reproduzível (`goldeouro-admin`).
- [ ] Plano de smoke: pelo menos **login admin real** (se aplicável) + **uma leitura** + **uma escrita** administrativa no `server-fly.js`.
- [ ] Decisão explícita: **reaproveitar** `adminRoutes.js` + controllers **ou** **reimplementar** sob `/api/admin/*` sem depender de arquivos mortos.
- [ ] Inventário de env: `VITE_API_URL`, `VITE_ADMIN_TOKEN`, `ADMIN_TOKEN` no backend, e coerência com CSP.

---

*Fim do mapa read-only pré-cirurgia — BLOCO J.*
