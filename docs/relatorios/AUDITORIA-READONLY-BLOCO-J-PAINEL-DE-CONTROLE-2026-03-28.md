# AUDITORIA READ-ONLY — BLOCO J — PAINEL DE CONTROLE

**Projeto:** Gol de Ouro — `goldeouro-admin` (dentro do repositório `goldeouro-backend`)  
**Modo:** somente leitura (nenhuma alteração de código aplicada nesta etapa)  
**Data do relatório:** 2026-03-28  
**Evidências:** leitura de arquivos-fonte, `grep` no backend, execução pontual de `npm run build` em `goldeouro-admin` (build concluiu com sucesso no ambiente da auditoria).

---

## 1. Resumo executivo

O painel administrativo (`goldeouro-admin`) possui uma **malha de rotas React relativamente coerente** em `src/AppRoutes.jsx`, com **Sidebar alinhada às rotas declaradas** na maior parte dos itens. Porém, o BLOCO J está **estruturalmente contaminado por legado**: dezenas de páginas duplicadas (“Responsive”, “Padronizada”), um segundo arquivo de rotas morto (`src/routes/index.jsx`), um `App.jsx` alternativo **não usado** pelo entrypoint real, e **múltiplas camadas de cliente HTTP** (`src/js/api.js`, `src/services/api.js`, `src/services/dataService.js`) com **contratos e autenticação diferentes**.

A integração com o backend **oficial em produção** (`server-fly.js`, `package.json` → `"main": "server-fly.js"`) está **gravemente desalinhada**: o servidor ativo **não monta** `routes/adminRoutes.js` e **não expõe** os endpoints `/admin/*` que a maior parte das páginas chama. Além disso, `routes/adminRoutes.js` referencia `controllers/adminController` e `controllers/exportController` que **não existem** em `controllers/` (há cópias apenas em `_archived_config_controllers/`), ou seja, o arquivo de rotas admin legado **não é carregável** como está, caso fosse incluído no servidor.

Há **bugs funcionais evidentes no código**: `RelatorioPorUsuario` usa `useParams()` sem rota com `:id`; `Dashboard` passa `stats` para `GameDashboard`, mas o componente **ignora props**; `dataService` em produção monta URL `base + '/api/admin/...'` com `base === '/api'`, gerando caminho **`/api/api/admin/...`**; login do painel é **client-side** (`admin123` + token fictício) **desconectado** do `x-admin-token` esperado pelo middleware admin do backend.

**Conclusão de alto nível:** o painel **compila**, a navegação interna **existe**, mas o BLOCO J **não está pronto para validação funcional fiel ao backend real** nem para produção com dados administrativos reais sem uma etapa de **saneamento estrutural e de integração**.

---

## 2. Escopo auditado

- Árvore e entrypoints: `goldeouro-admin/src/main.jsx`, `src/AppRoutes.jsx`, `src/App.jsx`, `index.html`, `vite.config.ts`, `vercel.json`, `package.json`.
- Layout e auth: `src/components/MainLayout.jsx`, `src/components/Sidebar.jsx`, `src/components/ProtectedRoute.jsx`, `src/components/Logout.tsx`, `src/js/auth.js`, `src/pages/Login.jsx`.
- Rotas alternativas / legado: `src/routes/index.jsx`.
- Clientes API e config: `src/js/api.js`, `src/services/api.js`, `src/services/dataService.js`, `src/config/env.js`, `src/config/environment.js`, `src/config/navigation.js`, `src/utils/navigation.js`.
- Páginas: inventário em `src/pages/*.jsx` (62 arquivos listados pelo glob).
- Componentes compartilhados relevantes: `StandardPageLayout.jsx`, `GameDashboard.jsx`, templates em `src/templates/`, `designSystem.js`, `index.css`.
- Backend (cruzamento): `server-fly.js` (montagem de rotas), `routes/adminRoutes.js`, `middlewares/authMiddleware.js`, existência de controllers referenciados, `package.json` do backend.

---

## 3. Arquitetura real do painel

### 3.1 Entrada e roteamento

- **`main.jsx`** monta `BrowserRouter` e renderiza **somente** `AppRoutes` (import explícito `./AppRoutes.jsx`). **`App.jsx` não participa** do fluxo real.
- **`AppRoutes.jsx`** define todas as rotas “oficiais” do SPA: `/login`, `/logout`, `/` e `/painel` (ambos com `Dashboard` dentro de `MainLayout`), demais rotas com `MainLayout` + página.
- Comentário em `AppRoutes.jsx`: *“Removido ProtectedRoute - usando proteção direta no MainLayout”* — a proteção efetiva está em **`MainLayout`** via `isAuthenticated()` de `js/auth.js`.

### 3.2 Layout e autenticação

- **`MainLayout`**: se não autenticado, `navigate('/login')`; se autenticado, renderiza `Sidebar` + `<main>` com wrapper `.card` e `children`.
- **`Login.jsx`**: validação **local** com lista `validPasswords` contendo `admin123`; grava token via `login()` em `auth.js` (token + timestamp).
- **`auth.js`**: autenticação baseada em `admin-token` + `admin-token-timestamp` (24h). **Não** valida JWT do backend admin.

### 3.3 Organização de pastas (visão prática)

- **`src/pages/`**: conjunto grande de telas, incluindo muitas variantes não referenciadas em `AppRoutes.jsx`.
- **`src/components/`**: UI compartilhada; coexistem componentes com **nomes que colidem conceitualmente** com páginas (`components/Dashboard.jsx`, `components/Saques.jsx`, `components/Usuarios.jsx`) — risco de confusão e import errado em manutenção.
- **`src/templates/`**: `PageTemplate`, `CardTemplate`, `TableTemplate`, `GridTemplate` — padrão parcialmente adotado por várias páginas.
- **`src/config/designSystem.js`**: design tokens e classes para `StandardPageLayout`.
- **Backups e assets legados** dentro de `goldeouro-admin/` (`BACKUP-*`, `assets/*.js` antigos): aumentam ruído e risco de alguém copiar código obsoleto.

### 3.4 PWA / build

- **`vite-plugin-pwa`** configurado em `vite.config.ts` com `navigateFallback: '/index.html'` — adequado para SPA.
- Build de produção **foi executado** e **completou** (`vite build`, ✓ módulos transformados, artefatos em `dist/`).

---

## 4. Mapa de rotas do painel

### 4.1 Rotas declaradas em `src/AppRoutes.jsx` (oficiais no SPA)

| Caminho | Componente | Layout |
|--------|------------|--------|
| `/login` | `Login` | sem `MainLayout` |
| `/logout` | `Logout` | sem `MainLayout` |
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

**Observações de rota:**

- **Não há** `Navigate` catch-all, rota `*` ou redirecionamento global para 404; URLs desconhecidas dependem do comportamento padrão do React Router (tela em branco / sem match).
- **`/relatorio-por-usuario` sem parâmetro `:id`**, enquanto a página usa `useParams()` — evidência de rota **logicamente incompleta** (ver seção 6).

### 4.2 Arquivo legado `src/routes/index.jsx`

- Declara rotas diferentes (`/usuarios`, `/saques`, `/transacoes`, `/relatorio`) e importa páginas como `RelatorioSaques`, `RelatorioTransacoes`.
- **Não é importado** por `main.jsx` — trata-se de **roteador morto** no build atual.

### 4.3 `navigation.js` (`validRoutes`)

- Inclui **`/jogo`**, que **não existe** em `AppRoutes.jsx` — configuração **desalinhada** das rotas reais.
- Não lista explicitamente `/` (dashboard raiz), embora a rota exista.

---

## 5. Auditoria da Sidebar (`src/components/Sidebar.jsx`)

### 5.1 Itens vs rotas

| Seção | Link | Destino | Existe em `AppRoutes`? |
|-------|------|---------|-------------------------|
| Painel | Painel de Controle | `/painel` | Sim |
| Usuários | Lista de Usuários | `/lista-usuarios` | Sim |
| Usuários | Relatório dos Usuários | `/relatorio-usuarios` | Sim |
| Usuários | Relatório Individual | `/relatorio-por-usuario` | Sim (com ressalva funcional) |
| Usuários | Usuários Bloqueados | `/usuarios-bloqueados` | Sim |
| Estatísticas | Estatísticas | `/estatisticas` | Sim |
| Estatísticas | Estatísticas Gerais | `/estatisticas-gerais` | Sim |
| Estatísticas | Top Jogadores | `/top-jogadores` | Sim |
| Estatísticas | Fila de Chute | `/fila` | Sim |
| Relatórios | Financeiro | `/relatorio-financeiro` | Sim |
| Relatórios | Transações | `/transacoes` | Sim |
| Relatórios | Saques | `/saque-usuarios` | Sim |
| Relatórios | Relatório Geral | `/relatorio-geral` | Sim |
| Relatórios | Relatório Semanal | `/relatorio-semanal` | Sim |
| Sistema | Chutes Recentes | `/chutes` | Sim |
| Sistema | Logs do Sistema | `/logs` | Sim |
| Sistema | Backup | `/backup` | Sim |
| Sistema | Configurações | `/configuracoes` | Sim |
| Sistema | Exportar Dados | `/exportar-dados` | Sim |

### 5.2 Coerência e problemas

- **Alinhamento geral:** os links da Sidebar **batem** com as rotas de `AppRoutes.jsx` (não foram encontrados links para paths inexistentes no router principal).
- **Destaque ativo (“active”):** `linkClasses('/painel')` não considera `/` como equivalente ao painel — usuário em **`/`** pode ver o item “Painel de Controle” **sem estado ativo**, apesar de exibir o mesmo `Dashboard`.
- **Logout:** combina `navigate('/login')` com `setTimeout` + `window.location.href = '/login'` — redundante; além disso **`Logout.tsx` não remove `admin-token-timestamp`**, enquanto `Sidebar` usa `logout()` de `env.js` que limpa outras chaves — **inconsistência de limpeza de sessão** entre fluxos.
- **Logo:** `src="/logo-gol.png"` com fallback DOM manipulando `nextElementSibling` — se a estrutura mudar, risco de **runtime error** (acesso a nó inexistente).
- **Mobile:** overlay + botão fixo; padrão razoável, porém dependente de classes Tailwind e do mesmo conjunto de links acima.

---

## 6. Inventário de páginas

### 6.1 Classificação — **oficiais** (registradas em `AppRoutes.jsx`)

`Dashboard`, `Login`, `ListaUsuarios`, `RelatorioUsuarios`, `RelatorioPorUsuario`, `RelatorioFinanceiro`, `RelatorioGeral`, `RelatorioSemanal`, `Estatisticas`, `EstatisticasGerais`, `Transacoes`, `SaqueUsuarios`, `UsuariosBloqueados`, `Fila`, `TopJogadores`, `Backup`, `Configuracoes`, `ExportarDados`, `LogsSistema`, `ChutesRecentes` — mais `Logout` como componente de rota.

### 6.2 **Duplicadas / variantes** (mesma função aproximada, arquivos paralelos — não roteadas)

Exemplos diretos (não importados por `AppRoutes.jsx`):  
`*Responsive.jsx`, `*ResponsivePadronizada.jsx`, `*Padronizada.jsx` para Lista, Transações, Estatísticas, Backup, Top Jogadores, Chutes, Fila, Usuários bloqueados, Saques, etc.; `TransacoesPadronizada.jsx`; `TopJogadoresResponsive.jsx`; `ListaUsuariosResponsive.jsx`; …

**Risco:** divergência de endpoint entre variantes (ex.: `Transacoes.jsx` usa `POST /admin/transacoes-recentes`; `TransacoesResponsivePadronizada.jsx` referencia `POST /admin/transacoes` no grep) — **contratos diferentes para a “mesma” tela**.

### 6.3 **Órfãs** (existem em `pages/` mas sem rota no `AppRoutes.jsx` atual)

Incluem, entre outras: `Users.jsx`, `Saques.jsx`, `SaquesPendentes.jsx`, `Withdrawals.jsx`, `Payments.jsx`, `RelatoriosPagamentos.jsx`, `Notifications.jsx`, `Profile.jsx`, `System.jsx`, `Games.jsx`, `MetricasJogos.jsx`, `ControleFila.jsx`, `HistoricoDeSaques.jsx`, `RelatorioCompleto.jsx`, `RelatorioSaques.jsx`, `RelatorioTransacoes.jsx`, `Bloqueados.jsx`, `GameResponsive.jsx`, `TestePadronizacao.jsx`, etc.

### 6.4 **Obsoletas / suspeitas**

- **`src/routes/index.jsx`**: roteador antigo — **obsoleto** em relação ao entrypoint.
- **`src/App.jsx`**: fluxo login/dashboard com **credenciais hardcoded** — **obsoleto em relação ao app real** e **inaceitável** como referência de segurança.
- **`EXEMPLO-FALLBACK-CONDICIONAL.jsx`** (raiz do admin): nome indica **exemplo**, não produto.

### 6.5 **Placeholders / incompletas (por evidência no código)**

- Várias páginas usam `alert`, `confirm`, comentários “implementar API”, ou **fallbacks fictícios** após erro de rede — indicam **UI existente** com **lógica de negócio incompleta**.
- **`RelatorioPorUsuario`**: depende de `id` na URL; rota **sem `:id`** ⇒ comportamento **placeholder/quebrado** para relatório individual real.
- **`GameDashboard`**: funções internas retornam **zeros fixos** (“DADOS ZERADOS PARA PRODUÇÃO”) e **não consomem** o `stats` que o pai tenta passar.

### 6.6 **Desalinhadas com backend** (evidência objetiva)

- Qualquer página que chama `/admin/...` está **desalinhada** do `server-fly.js` atual, que **não define** essas rotas (exceto contexto separado de `/api/admin/bootstrap` com outro tipo de auth).
- Páginas que chamam **`/fila/status`** não correspondem a `POST /admin/controle-fila` definido em `routes/adminRoutes.js` (mesmo este arquivo não estando montado no servidor ativo).

---

## 7. Consistência visual e estrutural

### 7.1 Tema dark e base global

- `index.css` força **fundo escuro** em `html, body, #root` com gradiente e imagem remota — **base visual coerente** com o objetivo dark.
- `:root` do Tailwind ainda define tokens **claros** por padrão, com variante `.dark` — depende do uso de `dark` no HTML; há **mistura** entre utilitários explícitos (`bg-slate-900`, `text-white`) e tokens semânticos.

### 7.2 Layout por página

- **`Dashboard`** usa `StandardPageLayout` + componentes responsivos — referência mais alinhada ao “design system”.
- **Várias páginas** usam apenas `CardTemplate` / `TableTemplate` **sem** `StandardPageLayout` — hierarquia visual **heterogênea**.
- **Páginas com `bg-white` e `ml-64`** (ex.: `SaquesPendentes.jsx`, `HistoricoDeSaques.jsx`, `RelatorioCompleto.jsx`): **quebram** o padrão dark e assumem layout com sidebar fixa no CSS da própria página — risco de **duplicar** estrutura com `MainLayout` (padding/offset).

### 7.3 Componentes compartilhados

- **Existentes:** `StandardPageLayout`, `StandardLoader`, `EmptyState`, `DashboardCards` / `DashboardCardsResponsive`, `ResponsiveTable`, templates, `MemoizedComponents`.
- **Problema de coerência:** nem todas as telas “oficiais” usam o mesmo esqueleto; parte recria **cards/tabelas** via templates, parte usa estilos ad hoc.

---

## 8. Integração com backend

### 8.1 Servidor ativo vs expectativa do painel

- Backend Node configurado para produção: **`server-fly.js`**.
- Busca por montagem de `adminRoutes` ou rotas `/admin/` em `server-fly.js`: **sem ocorrências** além de **`POST /api/admin/bootstrap`** (JWT de usuário, não painel legado).
- **Conclusão:** as páginas que consomem **`${VITE_API_URL}/admin/...`** **não têm** correspondência garantida no servidor principal deste repositório.

### 8.2 Arquivo `routes/adminRoutes.js` (legado no repo)

- Referencia **`../controllers/adminController`** e **`../controllers/exportController`**, que **não existem** em `controllers/` (apenas arquivos homônimos em `_archived_config_controllers/`).
- Mesmo que fosse montado, o `require` **falharia** até restaurar/mover controllers.

### 8.3 Autenticação admin no backend (`middlewares/authMiddleware.js`)

- Espera header **`x-admin-token`** comparado a `env.ADMIN_TOKEN`.

### 8.4 Autenticação no frontend

- **`src/js/api.js` `postData` / `getData`:** enviam `x-admin-token: import.meta.env.VITE_ADMIN_TOKEN` — **não** o token de sessão do `Login.jsx`.
- **`src/services/api.js` (axios):** `baseURL: import.meta.env.VITE_API_URL`, header fixo **`x-admin-token: 'goldeouro123'`** — valor **hardcoded**, independente de env.
- **`dataService`:** em produção usa `getApiUrl()` → **`/api`**, `Authorization: Bearer` com **`admin-token-*` do localStorage**, e paths **`/api/admin/users`**, etc. ⇒ URL efetiva **`/api/api/admin/...`** e esquema **Bearer** incompatível com o middleware admin citado.

### 8.5 Divergências método/path (exemplos)

- `routes/adminRoutes.js` define **`GET /lista-usuarios`** (relativo ao prefixo de montagem).  
- `ListaUsuarios.jsx` chama **`postData('/admin/lista-usuarios', {})`** ⇒ **POST** — **incompatível** com o legado em arquivo, mesmo que montado.

### 8.6 CORS / CSP

- **`vercel.json`** define `connect-src` incluindo `https://goldeouro-backend.fly.dev`.
- **`index.html`** meta CSP inclui `connect-src` com o mesmo host Fly.
- `environment.js` cita **`https://goldeouro-backend-v2.fly.dev`** em PRODUCTION — **possível divergência** de hostname entre camadas (CSP vs env vs documentação interna).

---

## 9. Riscos técnicos e operacionais

| Área | Risco |
|------|--------|
| **Tela branca / rota** | Ausência de rota `*`; `RelatorioPorUsuario` com `useParams` sem `:id`; possível exceção no `onError` da logo se `nextElementSibling` for `null`. |
| **Build produção** | Build atual **ok**; risco operacional está mais em **runtime** (API/CSP) do que em compilação. |
| **CSP / fetch bloqueado** | `connect-src` fixo no `index.html` pode **bloquear** API se `VITE_API_URL` apontar para outro domínio não listado. |
| **PWA / cache** | Service worker pode interferir em atualizações; `runtimeCaching` para `.fly.dev` pode servir respostas antigas em cenários de rede (já é um fator de “dados estranhos”, não necessariamente tela branca). |
| **Segurança** | Senha `admin123` no código-fonte do `Login.jsx`; `App.jsx` legado com credenciais em texto; axios com token fixo; login **não** prova acesso admin real no backend. |
| **Dados incorretos** | Muitas telas engolem erro e preenchem **mock** — o operador pode achar que o sistema está íntegro com **dados fictícios**. |
| **auth / logout** | Limpeza inconsistente de chaves (`admin-token-timestamp`, `admin_user` vs `admin-user`). |
| **Duplicação de código** | Múltiplas versões da mesma página com endpoints diferentes — manutenção **confusa** e regressões silenciosas. |

---

## 10. Débitos arquiteturais

1. **Unificar um único cliente HTTP** com política clara de `baseURL`, prefixo `/api`, headers (`x-admin-token` vs JWT) e tratamento de erro.
2. **Remover ou isolar legado**: `App.jsx` standalone, `src/routes/index.jsx`, páginas `*Responsive*` não usadas, backups gigantes dentro do app (ou mover para fora do repo de produto).
3. **Alinhar rotas e parâmetros**: `RelatorioPorUsuario` precisa de `:id` (ou query) coerente com a UI de listagem.
4. **Conectar `GameDashboard` ao modelo de dados** real ou remover a prop morta e a seção redundante.
5. **Corrigir `dataService`**: paths não devem duplicar `/api`; alinhar autenticação com o contrato real do backend.
6. **Decisão de produto/backend**: ou **reexpõe** rotas admin no `server-fly.js` com controllers válidos, ou **atualiza** o painel para os endpoints que de fato existem.
7. **Normalizar layout**: eliminar páginas com `ml-64` + `bg-white` ou encapsular em um layout único.
8. **CSP e env**: uma única fonte de verdade para URL da API e hosts permitidos.

---

## 11. Classificação de criticidade

### Crítico

- **Ausência de endpoints `/admin/*` no `server-fly.js`** vs dependência massiva do painel nesses caminhos.
- **`routes/adminRoutes.js` quebrado por requires** (controllers ausentes).
- **`dataService` gerando `/api/api/admin/...` em produção** + Bearer com token de login fictício.
- **Login admin apenas client-side** com senha fraca no repositório.

### Alto

- **`RelatorioPorUsuario` sem `:id` na rota** com `useParams`.
- **`ListaUsuarios` POST** vs **GET** no legado `adminRoutes.js`.
- **Múltiplos clientes API** com regras diferentes (axios hardcoded vs `postData` vs `dataService`).
- **`GameDashboard` ignora `stats`** e retorna zeros fixos — promessa de “métricas detalhadas” **não cumprita** pelo código.

### Médio

- Sidebar active state não cobre `/` como painel.
- Logout duplo / limpeza inconsistente de storage.
- `navigation.js` com rota `/jogo` inexistente no router.
- Heterogeneidade de layout (`StandardPageLayout` vs templates crus).

### Baixo

- `console.log` na Sidebar (ruído).
- Browserslist / baseline warnings no build.
- Arquivo `.env.example` do admin é placeholder (“Placeholder for .env.example”).

---

## 12. Diagnóstico final do BLOCO J

**Classificação aplicável:** **EXIGE CIRURGIA ESTRUTURAL** — com subestado **“FUNCIONAL COM RESSALVAS”** apenas no sentido **limitado** de: o SPA **navega**, **compila** e renderiza telas com **fallbacks** e dados locais; **não** “funcional” no sentido de **operação administrativa fiel ao backend oficial**.

**Não** se aplica “ESTRUTURALMENTE LIMPO” nem “pronto para produção” com backend real neste estado documentado.

---

## 13. Próxima etapa recomendada

1. **Congelar escopo funcional:** lista única de endpoints admin **realmente** suportados pelo `server-fly.js` (ou plano explícito para reintroduzir controllers + `app.use` com prefixo estável).
2. **Especificar contrato único:** método (GET/POST), path (`/api/admin/...` vs `/admin/...`), header (`x-admin-token` ou JWT), formato JSON.
3. **Refatoração em camadas:** (a) cliente HTTP único; (b) remoção/arquivamento de páginas duplicadas; (c) correção de rotas com parâmetros; (d) alinhamento CSP/`VITE_API_URL`.
4. **Só então** executar **validação funcional** ponta a ponta (login real admin, cada item da Sidebar, exportações CSV se aplicável).

---

*Fim do relatório read-only do BLOCO J — Painel de Controle.*
