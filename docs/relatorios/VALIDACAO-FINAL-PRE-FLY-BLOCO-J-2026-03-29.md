# VALIDAÇÃO FINAL PRÉ-FLY — BLOCO J

**Data:** 2026-03-29  
**Modo:** read-only (sem alteração de código; inspeção estática + `npm run build` no admin).  
**Backend:** assumido indisponível (Fly.io); sem chamadas HTTP reais.

---

## 1. Resumo executivo

A malha oficial do painel (`main.jsx` → `BrowserRouter` → `AppRoutes.jsx` → `MainLayout` + `Sidebar`) está **coerente**: rotas alinhadas, proteção por sessão local, cliente HTTP único (`src/js/api.js`) com paths `/api/admin/...`, token `x-admin-token`, página **Lotes** em `/lotes`, redirect `/fila` → `/lotes`, e `routes/adminApiFly.js` expõe endpoints que correspondem ao consumo das páginas oficiais.

**Não foi encontrada inconsistência estrutural que impeça** ligar o backend e executar validação real. Os pontos restantes são **esperados em pré-produção** (URL base, CORS, token servidor, rede) ou **legado/arquivos paralelos** que **não** entram no bundle oficial.

**Classificação final:** **PRONTO PARA VALIDAÇÃO REAL** (ver secção 13).

---

## 2. Estrutura geral

| Verificação | Resultado |
|-------------|-----------|
| Organização `goldeouro-admin` | `src/pages`, `src/components`, `src/js`, `src/legacy` — clara. |
| Malha oficial única | **Sim:** `src/main.jsx` importa apenas `AppRoutes.jsx`. |
| Routers conflitantes **ativos** | **Não** no entrypoint. Existem ficheiros paralelos (`App.jsx`, `AppRoutes-simple.jsx`, `AppRoutes-working.jsx`, etc.) que **não** são referenciados por `main.jsx` — ruído histórico, não duplicam runtime se o build usa `main.jsx`. |
| Duplicidade funcional crítica | Páginas alternativas (`*Responsive*.jsx`, `Users.jsx`, `Games.jsx`, …) com padrões antigos coexistem no repo mas **não** são importadas por `AppRoutes.jsx`. Risco: **baixo** para o bundle oficial; risco de **confusão humana** se alguém apontar imports para elas no futuro. |

---

## 3. Rotas e navegação

| Rota / comportamento | Evidência |
|---------------------|-----------|
| Rotas oficiais em `AppRoutes.jsx` | `/`, `/painel`, `/lista-usuarios`, relatórios, `/transacoes`, `/saque-usuarios`, `/usuarios-bloqueados`, `/estatisticas*`, `/lotes`, `/top-jogadores`, `/backup`, `/configuracoes`, `/exportar-dados`, `/logs`, `/chutes`, `/login`, `/logout`. |
| `Sidebar.jsx` | Links `to="..."` conferidos: correspondem às rotas acima (incl. **Lotes ativos** → `/lotes`). **Sem** link para `/fila` como destino. **Sem** ocorrências de texto “Fila” na sidebar. |
| `/lotes` | Rota com `MainLayout` + componente `Lotes`. |
| `/fila` | `<Navigate to="/lotes" replace />` apenas. |
| `/relatorio-por-usuario` | Redireciona para `/relatorio-usuarios`. |
| `/relatorio-por-usuario/:id` | `RelatorioPorUsuario` com `useParams().id`. |
| Rota quebrada óbvia na malha | **Nenhuma** entre sidebar e `AppRoutes` (o item “Relatório Individual” aponta para `/relatorio-por-usuario` sem `:id` e cai no redirect — comportamento consistente, embora o utilizador não vá direto a um ID). |

---

## 4. Integração HTTP

| Verificação | Resultado |
|-------------|-----------|
| Cliente oficial | `src/js/api.js`: `fetch`, `getApiBase()` a partir de `VITE_API_URL` (trim, remove barra final), paths passados como `'/api/admin/...'`. |
| Páginas importadas em `AppRoutes.jsx` | Uso de `getData` / `postData` / `downloadAdminFile` de `../js/api` com prefixo **`/api/admin/`** (grep nas páginas oficiais). |
| `/api/api` nas páginas `.jsx` | **Nenhuma** ocorrência em `src/pages` (grep). |
| Axios / `services/api` na malha oficial | **Não** nas páginas ligadas a `AppRoutes.jsx`. `import api from '../services/api'` aparece só em ficheiros `*Responsive*.jsx` / relatórios paralelos **não** roteados oficialmente. |
| `.env.example` | Documenta `VITE_API_URL` sem `/api` final; alinhado ao código. |

---

## 5. Autenticação

| Verificação | Resultado |
|-------------|-----------|
| Header | `api.js` envia `x-admin-token` em GET/POST. |
| Persistência | `js/auth.js`: `login()` grava `admin-token` + `admin-token-timestamp`; validade 24h; mín. 16 caracteres. |
| Logout | `logout()` remove chaves conhecidas + `sessionStorage.clear()` (try). `Logout.tsx` chama `logout()` e navega para `/login`. `Sidebar` chama `logout()` de `js/auth`. |
| Rotas protegidas | `MainLayout` usa `isAuthenticated()`; se falso, redireciona `/login`. Rotas com conteúdo sensível estão sob `MainLayout` exceto `/login` e `/logout`. |
| Login | Não há prova de **validação prévia** do token contra o servidor no submit (grava localmente após validação de tamanho); a **primeira** chamada `GET/POST` admin confirma o token — aceitável e típico para pré-Fly. |

---

## 6. Semântica (Lotes vs Fila)

| Verificação | Resultado |
|-------------|-----------|
| UI oficial | Sidebar: **“Lotes ativos”**; `DashboardCards.jsx`: cartão **“Lotes ativos (memória)”** (campo `queue` do payload como número). |
| “Fila” na UI oficial | **Sem** “Fila” em `Sidebar.jsx` e `Dashboard.jsx` (grep). |
| Backend | `GET /api/admin/lotes` e `GET /api/admin/fila` no mesmo router; comentários em `adminApiFly.js` documentam alias e significado de `totalNaFila` / `queueLength` como contagem de lotes — **sem ambiguidade operacional** se a documentação for seguida; contrato JSON mantém nomes legados por compatibilidade. |

---

## 7. Legado

| Verificação | Resultado |
|-------------|-----------|
| Localização | `goldeouro-admin/src/legacy/` (páginas + `README.md`). |
| Imports da malha oficial → `legacy` | **Nenhum** `import` de `legacy/` fora da própria pasta (grep em `src/**/*.jsx,js`). |
| Uso acidental no bundle | `AppRoutes.jsx` **não** referencia `legacy`. O Vite inclui apenas o grafo a partir de `main.jsx` — os ficheiros legacy **não** entram no bundle salvo import futuro. |
| Nota | `FilaResponsive.jsx` (legacy) importa `../../pages/Lotes` — dependência **de legado para oficial**, não o contrário; não arrasta legado para a app principal. |

---

## 8. Backend (consistência estática)

| Endpoint (prefixo `/api/admin`) | Usado no frontend oficial (amostra) |
|-----------------------------------|-------------------------------------|
| `GET /stats` | `Dashboard`, `Estatisticas`, `EstatisticasGerais` |
| `GET /usuarios`, `GET /usuarios/:id`, `GET /usuarios-bloqueados`, `POST /usuarios/:id/reativar` | Lista, Relatório por usuário, Bloqueados |
| `GET /relatorios/*` | Relatórios financeiro, geral, semanal, usuários |
| `GET /transacoes`, `GET /saques` | Transacoes, SaqueUsuarios |
| `GET /chutes`, `GET /logs`, `GET /top-jogadores` | Chutes, Logs, Top |
| `GET /lotes` | `Lotes.jsx` |
| `GET /fila` | Alias (não obrigatório no browser; redirect SPA usa `/lotes`) |
| `GET|POST /configuracoes` | Configuracoes |
| `GET /exportacao` (+ download) | Exportar, relatórios com CSV |
| `GET|POST /backup` | Backup |

| Verificação | Resultado |
|-------------|-----------|
| Middleware | `authAdminToken` em `adminApiFly.js` (header `x-admin-token`). |
| Montagem | `server-fly.js` monta router admin; `POST /api/admin/bootstrap` documentado como antes do `use` do router — coerente com comentários existentes. |
| `/api/games/*` | Presente no servidor (ex.: `POST /api/games/shoot`); **fora** do âmbito do painel admin; não há evidência nesta validação de que o BLOCO J o tenha alterado. |

---

## 9. UX de erro

| Área | Resultado |
|------|-----------|
| Páginas com `ApiErrorAlert` + retry | Lista ampla (Lotes, Configurações, relatórios, transações, etc.) — erros de carregamento **não** são silenciados sem mensagem. |
| `RelatorioPorUsuario` | Erro de rede/API → `ApiErrorAlert`; “não encontrado” → `EmptyState` com mensagem explícita (via `isAdminNotFoundMessage`). |
| `Dashboard` | Falha em `GET /api/admin/stats` → bloco vermelho com mensagem; **não** renderiza cards com dados falsos nesse caso. |
| `DashboardCards` / `DashboardCardsResponsive` | Caminho **legado** sem `adminCardsData` pode ir a `/api/public/dashboard` e, em falha, preencher **zeros** (fallback). Na malha atual, com stats OK, `adminCardsData={stats?.dashboardCards}` é passado — caminho principal **correto**. Residual: se `dashboardCards` viesse ausente com `stats` definido, poderia cair em fallbacks; depende do contrato do backend (esperado íntegro). |
| `ListaUsuarios` | Erro → `ApiErrorAlert`; sucesso com lista vazia → `EmptyState` (distinto de erro). |

---

## 10. Build

| Verificação | Resultado |
|-------------|-----------|
| `npm run build` (`goldeouro-admin`) | **OK** (2026-03-29 nesta sessão): bundle gerado, sem falha de compilação. |
| Avisos | `baseline-browser-mapping` / `browserslist` desatualizados — **não** bloqueiam. |
| Imports inválidos no grafo oficial | **Nenhum** detectado pelo build. |

---

## 11. Isolamento (admin vs player)

| Verificação | Resultado |
|-------------|-----------|
| `goldeouro-player` | Sem referências a `goldeouro-admin` no `src` do player (grep). Repositórios/pastas separados. |
| Âmbito BLOCO J | Validação limitada ao painel admin + `routes/adminApiFly.js` / montagem em `server-fly.js` apenas como leitura de consistência. |
| Gameplay / financeiro | Nenhuma alteração efetuada nesta sessão (read-only); relatório não assume refactors fora do histórico já consolidado. |

---

## 12. Riscos ao ativar backend

Estes **não** são defeitos estruturais do BLOCO J, mas **falhas prováveis** se o ambiente Fly não estiver alinhado:

1. **`VITE_API_URL`** incorreto ou com `/api` duplicado no env de build — quebra todas as chamadas.
2. **CORS**: origem do admin (Vercel/domínio) deve estar permitida no servidor Fly.
3. **`ADMIN_TOKEN`**: ausente ou &lt; 16 chars no servidor → 503/401 conforme `adminApiFly.js`.
4. **Certificados / HTTPS / mixed content** se admin e API estiverem em esquemas diferentes.
5. **Primeiro login**: token só validado na primeira request — esperar erro claro se token errado.

---

## 13. Diagnóstico final

- **Estrutura do BLOCO J:** coerente e pronta para testes com backend ativo.  
- **Inconsistências críticas:** **nenhuma** identificada na malha oficial.  
- **Dependência do player:** não afetada pelo admin nesta arquitetura.  
- **Pendência única para “validação real”:** backend acessível com URL, token e CORS corretos.

### Inconsistências / fragilidades **não bloqueantes**

- Ficheiros `App*.jsx` / `AppRoutes-*.jsx` não usados pelo entry — podem confundir mantenedores.  
- Páginas fora da malha com `services/api` e paths `/admin/...` sem `/api` — **não** usadas por `AppRoutes.jsx`.  
- Fallback numérico em ramos responsivos legados do dashboard se alguma vez `adminCardsData` não for passado (cenário marginal se o payload `stats` estiver incompleto).

---

## CLASSIFICAÇÃO FINAL

**PRONTO PARA VALIDAÇÃO REAL**

**Motivo:** não há obstáculo estrutural identificado; o build passa; a malha única está alinhada com o router admin e com `src/js/api.js`. O que falta é **runtime** contra Fly.io (rede, env, CORS, token), o que **não** invalida esta aprovação pré-Fly conforme regra pedida.
