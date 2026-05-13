# DIAGNÓSTICO OPERACIONAL COMPLETO — PAINEL ADMIN V1

**Data:** 2026-05-12  
**Modo:** somente leitura (sem alteração de código, deploy ou correções).  
**Ambientes de referência:** painel `https://admin.goldeouro.lol`, backend `https://goldeouro-backend-v2.fly.dev`.  
**Fontes:** código em `goldeouro-admin/src`, `server-fly.js`, `routes/adminRoutes.js`; verificação HTTP (PowerShell); rede do browser MCP (aba autenticada).

---

## 1. Resumo executivo

O painel admin em produção entrega **núcleo operacional real** (login via `/api/auth/login`, dashboard, usuários com bloqueio/desbloqueio, saques com aprovação/cancelamento, relatório financeiro e auditoria persistida) sobre rotas **`/api/admin/*`** declaradas em `server-fly.js`.

Há, porém, **desalinhamento estrutural grave** entre o frontend e o backend em Fly: várias telas chamam caminhos **`/admin/...`** ou **`/fila/...`** na raiz do host da API, **inexistentes** no `server-fly.js` (resposta JSON de rota não encontrada, HTTP 404). Nesses casos o código do painel frequentemente **preenche a UI com dados fictícios ou zerados**, o que gera **falsa sensação de dados reais** sem indicação clara ao operador.

O ficheiro `routes/adminRoutes.js` (controladores legados + exportações CSV) **não está montado** no `server-fly.js` usado em produção (`package.json` → `main: server-fly.js`), logo as rotas definidas aí são **órfãs em relação ao runtime Fly**, salvo outro processo não analisado.

**Conclusão operacional:** o produto está **ESTÁVEL COM RESSALVAS** para o subconjunto homologado de rotas `/api/admin/*`; o painel como **mapa completo de menus** comporta-se de forma **instável ou enganosa** nas áreas que ainda dependem de contratos legados `/admin/*`.

---

## 2. Estrutura real do painel admin

| Área | Detalhe |
|------|---------|
| **Entrada** | `goldeouro-admin/src/main.jsx` monta `BrowserRouter` + `AppRoutes` (não usa `App.jsx` legado com credenciais hardcoded). |
| **Layout autenticado** | `MainLayout.jsx`: sidebar fixa + `children`; redireciona para `/login` se `isAuthenticated()` falhar. |
| **Navegação lateral** | `Sidebar.jsx` (versão usada em desktop e pelo `MainLayout`; existe `SidebarResponsive.jsx` para mobile/tablet mas **não** está referenciada no `MainLayout`). |
| **Rotas** | `AppRoutes.jsx` define todas as rotas do SPA. |
| **API cliente** | `js/api.js` (`fetch` + `getApiUrl()` de `config/env.js`) e `services/api.js` (axios com o mesmo `baseURL`). |
| **Lista de rotas “válidas”** | `config/navigation.js` (`validRoutes`) — pode divergir do router (ex.: inclui `/jogo`, `/backup`, etc.). |

**Nota:** `App.jsx` na raiz de `src` contém login com credenciais estáticas e dashboard mock; é **código morto** em relação ao `main.jsx` atual.

---

## 3. Rotas reais identificadas

Definidas em `goldeouro-admin/src/AppRoutes.jsx`:

| Rota SPA | Componente | Proteção |
|----------|--------------|----------|
| `/login` | `Login` | Pública |
| `/logout` | `Logout` | Pública |
| `/` | `Dashboard` dentro de `MainLayout` | `MainLayout` |
| `/painel` | `Dashboard` dentro de `MainLayout` | idem |
| `/lista-usuarios` | `Users` | idem |
| `/relatorio-usuarios` | `RelatorioUsuarios` | idem |
| `/relatorio-por-usuario` | `RelatorioPorUsuario` | idem |
| `/relatorio-financeiro` | `RelatorioFinanceiro` | idem |
| `/relatorio-geral` | `RelatorioGeral` | idem |
| `/relatorio-semanal` | `RelatorioSemanal` | idem |
| `/estatisticas` | `Estatisticas` | idem |
| `/estatisticas-gerais` | `EstatisticasGerais` | idem |
| `/transacoes` | `Transacoes` | idem |
| `/saque-usuarios` | `SaqueUsuarios` | idem |
| `/usuarios-bloqueados` | `UsuariosBloqueados` | idem |
| `/fila` | `Fila` | idem |
| `/top-jogadores` | `TopJogadores` | idem |
| `/backup` | `Backup` | idem |
| `/configuracoes` | `Configuracoes` | idem |
| `/exportar-dados` | `ExportarDados` | idem |
| `/logs` | `LogsSistema` | idem |
| `/auditoria` | `Auditoria` | idem |
| `/chutes` | `ChutesRecentes` | idem |

**Observações:**

- **Duplicidade:** `/` e `/painel` renderizam o mesmo `Dashboard`.
- **Sem rota catch-all:** URLs desconhecidas não redirecionam explicitamente (comportamento padrão do React Router v6: conteúdo vazio fora das rotas definidas).
- **`/relatorio-por-usuario` sem `:id`:** a página `RelatorioPorUsuario.jsx` usa `useParams()` esperando `id`, mas a rota declarada **não** inclui parâmetro dinâmico — o fluxo “relatório individual” está **logicamente quebrado** no router.

---

## 4. Páginas reais identificadas

“Página real” = ligada em `AppRoutes.jsx` + ficheiro em `src/pages/`.

| Nome (UI) | Rota | Ficheiro principal | Status operacional (produção Fly) |
|-----------|------|-------------------|-----------------------------------|
| Login | `/login` | `pages/Login.jsx` | **Real** — `POST /api/auth/login`. |
| Logout | `/logout` | `components/Logout` | Depende de `Logout` (não detalhado aqui). |
| Painel / Dashboard | `/`, `/painel` | `pages/Dashboard.jsx` | **Real** — `GET /api/admin/dashboard/stats`. |
| Lista de utilizadores | `/lista-usuarios` | `pages/Users.jsx` | **Real** — listagem + `POST` block/unblock em `/api/admin/users/*`. |
| Relatório dos utilizadores | `/relatorio-usuarios` | `pages/RelatorioUsuarios.jsx` | **Legacy / provável mock** — `POST /admin/relatorio-usuarios` (404 em Fly; ver secção 8). |
| Relatório individual | `/relatorio-por-usuario` | `pages/RelatorioPorUsuario.jsx` | **Quebrado + mock** — rota sem `id`; API legacy; fallback fictício. |
| Relatório financeiro | `/relatorio-financeiro` | `pages/RelatorioFinanceiro.jsx` | **Real** — `GET /api/admin/financial/report`. |
| Relatório geral | `/relatorio-geral` | `pages/RelatorioGeral.jsx` | **Legacy / mock** — `POST /admin/relatorio-geral`. |
| Relatório semanal | `/relatorio-semanal` | `pages/RelatorioSemanal.jsx` | **Legacy / mock** — `POST /admin/relatorio-semanal`. |
| Estatísticas | `/estatisticas` | `pages/Estatisticas.jsx` | **Enganoso** — axios `GET /admin/estatisticas-gerais`; em erro define **zeros fixos** (“DADOS ZERADOS PARA PRODUÇÃO”). |
| Estatísticas gerais | `/estatisticas-gerais` | `pages/EstatisticasGerais.jsx` | **Legacy** — `POST /admin/estatisticas-gerais`. |
| Transações | `/transacoes` | `pages/Transacoes.jsx` | **Legacy / mock** — `POST /admin/transacoes-recentes`. |
| Saques | `/saque-usuarios` | `pages/SaqueUsuarios.jsx` | **Real** — `GET/POST` em `/api/admin/withdraw/*`. |
| Utilizadores bloqueados | `/usuarios-bloqueados` | `pages/UsuariosBloqueados.jsx` | **Legacy / mock** — `POST /admin/usuarios-bloqueados`. |
| Fila de chute | `/fila` | `pages/Fila.jsx` | **Legacy** — `POST /fila/status` (não existe equivalente em `server-fly.js` analisado). |
| Top jogadores | `/top-jogadores` | `pages/TopJogadores.jsx` | **Legacy / mock** — `POST /admin/top-jogadores`. |
| Backup | `/backup` | `pages/Backup.jsx` | **Legacy / mock** — vários `POST /admin/backup-*`. |
| Configurações | `/configuracoes` | `pages/Configuracoes.jsx` | **Legacy / mock** — `POST /admin/configuracoes*`. |
| Exportar dados | `/exportar-dados` | `pages/ExportarDados.jsx` | **Legacy + URL manual** — `POST /admin/dados-exportacao`; export abre `VITE_API_URL + /admin/exportar/...` (sem `/api`). |
| Logs do sistema | `/logs` | `pages/LogsSistema.jsx` | **Legacy + mock** — `POST /admin/logs` (**404** confirmado; ver evidências). |
| Auditoria | `/auditoria` | `pages/Auditoria.jsx` | **Real** — `GET /api/admin/audit/logs` (tabela `admin_logs`). |
| Chutes recentes | `/chutes` | `pages/ChutesRecentes.jsx` | **Legacy / mock** — `POST /admin/chutes-recentes`. |

### Páginas órfãs (existem em `src/pages/` mas **não** há rota em `AppRoutes.jsx`)

Incluem dezenas de variantes `*Responsive*.jsx`, `Games.jsx`, `Payments.jsx`, `Withdrawals.jsx`, `Profile.jsx`, `MetricasJogos.jsx`, `HistoricoDeSaques.jsx`, `RelatorioCompleto.jsx`, etc. São **código não roteado** pelo SPA atual (potencial confusão em manutenção e duplicação funcional).

### Páginas duplicadas / inacessíveis

- **Duplicadas no router:** `Dashboard` em `/` e `/painel`.
- **Inacessível corretamente:** fluxo “Relatório individual” por falta de `/relatorio-por-usuario/:id` (e API legacy).

---

## 5. Endpoints reais identificados

### 5.1 Implementados em `server-fly.js` (runtime de produção)

Rotas administrativas explícitas encontradas:

| Método | Caminho | Função |
|--------|---------|--------|
| GET | `/api/admin/users/list` | Listagem paginada/filtrada de utilizadores. |
| POST | `/api/admin/users/block` | Bloqueio. |
| POST | `/api/admin/users/unblock` | Desbloqueio. |
| GET | `/api/admin/withdraw/list` | Lista de pedidos de saque. |
| POST | `/api/admin/withdraw/approve` | Aprovar saque manual. |
| POST | `/api/admin/withdraw/cancel` | Cancelar saque manual. |
| GET | `/api/admin/dashboard/stats` | Métricas do painel. |
| GET | `/api/admin/financial/report` | Relatório financeiro. |
| GET | `/api/admin/audit/logs` | Logs de auditoria administrativa (`admin_logs`). |
| POST | `/api/admin/bootstrap` | Promoção one-shot a admin (sem `requireAdministradorDb` no snippet analisado). |

**Autenticação:** estas rotas usam `authenticateToken` e, na maioria, `requireAdministradorDb` (conforme `server-fly.js`).

### 5.2 Definidos em `routes/adminRoutes.js` mas **não montados** em `server-fly.js`

Exemplos (prefixo típico seria `/api/admin` se alguma vez fosse feito `app.use('/api/admin', router)` — **não** encontrado no `server-fly.js`):

- `POST /relatorio-semanal`, `POST /estatisticas-gerais`, `POST /transacoes-recentes`, `POST /chutes-recentes`, `POST /relatorio-usuarios`, `POST /logs`, `POST /usuarios-bloqueados`, `POST /bloquear`, `POST /desbloquear`, …
- Exportações: `GET /exportar/usuarios-csv`, `GET /exportar/chutes-csv`, etc.

Estas rotas são **órfãs do processo Node atual em Fly** no estado do repositório analisado.

### 5.3 `routes/paymentRoutes.js` (admin de pagamentos)

Existem rotas como `/admin/todos` sob o router de pagamentos no ficheiro de rotas; **não** foram encontradas referências correspondentes em `server-fly.js` — tratam-se como **não expostas** no servidor de produção analisado.

---

## 6. Funcionalidades identificadas

| Funcionalidade | Onde | Estado em Fly |
|----------------|------|----------------|
| Login / sessão JWT | `Login.jsx` + `js/auth.js` | **Real** (`/api/auth/login`). |
| Logout | `Sidebar.jsx` → `logout()` + navegação | **Real** (limpeza de storage). |
| Dashboard | `Dashboard.jsx` | **Real**. |
| Utilizadores (lista, pesquisa, filtros) | `Users.jsx` | **Real** (com meta de paginação no backend). |
| Bloquear / desbloquear | `Users.jsx` | **Real**. |
| Auditoria (filtros, paginação) | `Auditoria.jsx` | **Real** (`admin_logs`). |
| “Logs do sistema” | `LogsSistema.jsx` | **Não real** (chamada 404 + fallback fictício). |
| Saques (lista, aprovar, cancelar) | `SaqueUsuarios.jsx` | **Real**. |
| Transações (tela) | `Transacoes.jsx` | **Legacy / não homologado** neste backend. |
| Estatísticas / estatísticas gerais | `Estatisticas.jsx`, `EstatisticasGerais.jsx` | **Não fiável** (path errado ou legacy; zeros/mock). |
| Relatórios (vários) | Vários ficheiros | Maioria **legacy/mock**. |
| Relatório financeiro | `RelatorioFinanceiro.jsx` | **Real**. |
| Fila de chute | `Fila.jsx` | **Não mapeado** para `server-fly.js`. |
| Top jogadores | `TopJogadores.jsx` | **Legacy**. |
| Backup / configurações | `Backup.jsx`, `Configuracoes.jsx` | **Legacy + mock**. |
| Exportações (CSV/PDF) | `ExportarDados.jsx` | Abre URLs `/admin/exportar/...` não alinhadas com `server-fly.js`; **não validado** como real. |
| Filtros / paginação | `Users.jsx`, `Auditoria.jsx` | Onde ligado a `/api/admin/*`, **real**. |
| Bootstrap admin | `POST /api/admin/bootstrap` | **Crítico operacionalmente** se exposto sem salvaguardas adicionais (já existe gate “só se não houver admin”). |

---

## 7. Integrações frontend ↔ backend

### Contrato alinhado (funciona com `server-fly.js`)

- `Login.jsx` → `POST https://.../api/auth/login`
- `Dashboard.jsx` → `GET /api/admin/dashboard/stats`
- `Users.jsx` → `GET /api/admin/users/list`, `POST /api/admin/users/block`, `POST /api/admin/users/unblock`
- `SaqueUsuarios.jsx` → `GET /api/admin/withdraw/list`, `POST /api/admin/withdraw/approve`, `POST /api/admin/withdraw/cancel`
- `RelatorioFinanceiro.jsx` → `GET /api/admin/financial/report`
- `Auditoria.jsx` → `GET /api/admin/audit/logs`

### Contrato desalinhado (frontend chama rotas **não** servidas por `server-fly.js`)

Padrão: `getApiUrl()` + caminho **`/admin/...`** ou **`/fila/...`** → URL final `https://goldeouro-backend-v2.fly.dev/admin/...` (sem prefixo `/api`).

**Evidência HTTP (sem token):**

- `POST https://goldeouro-backend-v2.fly.dev/admin/logs` → corpo JSON: `{"success":false,"message":"Rota não encontrada","path":"/admin/logs","method":"POST"}` (**404** lógico).
- `POST https://goldeouro-backend-v2.fly.dev/admin/chutes-recentes` → **404**.

**Evidência browser (sessão já autenticada na ferramenta):**

- Pedido `POST https://goldeouro-backend-v2.fly.dev/admin/logs` com **statusCode 404** (rede capturada ao abrir `/logs`).

### Contrato “órfão” no repositório

- `routes/adminRoutes.js` + `exportController` + vários métodos em `adminController` — **sem** `app.use` correspondente em `server-fly.js`.

---

## 8. Dados reais vs mock

| Página | Dados | Notas |
|--------|--------|------|
| Dashboard | **Reais** | Erro mostrado se API falhar (sem mock silencioso no próprio ficheiro). |
| Utilizadores | **Reais** | |
| Saques | **Reais** | Operações financeiras sensíveis. |
| Relatório financeiro | **Reais** | |
| Auditoria | **Reais** | Persistência em `admin_logs`. |
| Estatísticas (`Estatisticas.jsx`) | **Fallback enganoso** | Em erro: objeto com **tudo a zero** — parece “sem atividade”, não “falha de API”. |
| Logs sistema, Backup, Configurações, Relatório geral, Relatório semanal, Exportar, Relatório utilizadores, Transações, Bloqueados (tela), Top jogadores, Chutes | **Mock ou legacy** | Muitos blocos `// Dados fictícios como fallback` após falha; a falha é **esperada** em Fly pelos 404. |
| Relatório por utilizador | **Mock** | Rota SPA incorreta + API legacy. |

---

## 9. Páginas ainda NÃO homologadas

Para efeitos de “homologado = evidência de dados reais end-to-end neste backend Fly”:

- Relatório de utilizadores, relatório individual, relatório geral, relatório semanal.  
- Estatísticas, estatísticas gerais, transações, utilizadores bloqueados (tela dedicada), fila, top jogadores.  
- Backup, configurações, exportar dados, logs do sistema, chutes recentes.  
- Todas as páginas `*Responsive*` e outras não roteadas (órfãs de produto).

---

## 10. Endpoints ainda NÃO homologados (neste runtime)

- Todo o conjunto sob `routes/adminRoutes.js` não montado.  
- Rotas `POST /admin/*` e `GET /admin/*` chamadas pelo SPA e **ausentes** de `server-fly.js`.  
- `POST /api/admin/bootstrap` — requer política de uso e teste controlado (não é “feature de painel” diária, mas é superfície sensível).  
- Rotas admin de `paymentRoutes.js` se o deploy não as incluir.

---

## 11. Riscos críticos

1. **UI administrativa com dados fictícios após 404** — operador pode tomar decisões sobre “logs”, “backups” ou métricas que **não existem** na base de dados.  
2. **Saques aprovar/cancelar** — superfície financeira real; qualquer regressão em auth (`requireAdministradorDb`) ou em idempotência no controller é risco elevado (já é real; exige testes contínuos).  
3. **`POST /api/admin/bootstrap`** — reduzido por gate de contagem de admins, mas permanece vetor sensível se token de utilizador normal for obtido antes de existir admin.  
4. **Ficheiro `App.jsx` legado** com credenciais hardcoded — não está no bundle atual, mas é **risco de governança** se voltar a ser ligado por engano.

---

## 12. Riscos médios

- **Relatório por utilizador** rota mal definida (`id` em `useParams` sem parâmetro na rota).  
- **Duplicação** `/` vs `/painel` — confusão em bookmarks e caches.  
- **Dois clientes HTTP** (`fetch` em `js/api.js` e `axios` em `services/api.js`) — comportamentos ligeiramente diferentes (tratamento de erros, redirects).  
- **`ExportarDados`** constrói URLs com `VITE_API_URL` + `/admin/exportar/...` sem garantir prefixo `/api` nem token em `window.open` — risco de exportações falhadas ou não autorizadas.

---

## 13. Riscos leves

- `navigation.js` lista rotas (ex. `/jogo`) **sem** correspondência em `AppRoutes.jsx`.  
- Sidebar mobile: `MainLayout` não usa `SidebarResponsive` — UX inconsistente em telemóvel.  
- Logs de consola em `Sidebar.jsx` (`console.log` no toggle).

---

## 14. Pendências reais da V1

1. **Unificar contrato HTTP** do painel: ou montar `adminRoutes` no servidor Fly com prefixo `/api/admin`, ou **alterar todas** as chamadas legacy para `/api/admin/...` coerentes com `server-fly.js` (isto seria trabalho de implementação fora do âmbito deste diagnóstico).  
2. **Eliminar ou isolar mocks** em ecrãs administrativos — substituir por estados explícitos “indisponível / não implementado”.  
3. **Corrigir rota** de relatório individual (`/relatorio-por-usuario/:id`) ou remover o menu.  
4. **Decisão de produto** sobre exportações CSV/PDF e logs “sistema” vs “auditoria”.  
5. **Limpeza de repositório** — páginas órfãs ou fundir responsive numa só rota.

---

## 15. Diagnóstico global

**Classificação: ESTÁVEL COM RESSALVAS**

- **Estável:** autenticação admin, dashboard, utilizadores, saques, relatório financeiro, auditoria persistida — desde que apenas essas áreas sejam consideradas “V1”.  
- **Ressalvas:** grande parte do menu lateral aponta para integrações **não suportadas** pelo `server-fly.js` atual, com **fallbacks que simulam sucesso**.

---

## 16. Próxima etapa recomendada

1. **Congelar o âmbito da V1** numa lista curta de rotas já reais (`/api/auth/login` + conjunto `/api/admin/*` homologado).  
2. **Documentar no painel** (banner ou secção “Em desenvolvimento”) as entradas de menu não suportadas **ou** removê-las do `Sidebar` até existir endpoint — isto evita operação sobre dados fictícios.  
3. **Plano técnico** (fora deste modo read-only): alinhar `adminRoutes.js` com Fly **ou** refatorar chamadas do frontend; em ambos os casos incluir testes de contrato (smoke) por rota.  
4. **Revalidar** `RelatorioPorUsuario`, exportações e logs após alinhamento.

---

### Anexo A — Mapa rápido Sidebar ↔ rota (ficheiro `Sidebar.jsx`)

Secção Painel → `/painel`; Utilizadores → `/lista-usuarios`, `/relatorio-usuarios`, `/relatorio-por-usuario`, `/usuarios-bloqueados`; Estatísticas → `/estatisticas`, `/estatisticas-gerais`, `/top-jogadores`, `/fila`; Relatórios → `/relatorio-financeiro`, `/transacoes`, `/saque-usuarios`, `/relatorio-geral`, `/relatorio-semanal`; Sistema → `/chutes`, `/auditoria`, `/logs`, `/backup`, `/configuracoes`, `/exportar-dados`; botão Sair.

---

*Fim do relatório.*
