# SMOKE TEST — BLOCO J — PAINEL DE CONTROLE

**Data:** 2026-03-28  
**Ambiente alvo (pré-condições):** `server-fly.js` local, `ADMIN_TOKEN` definido, `goldeouro-admin` via Vite, `VITE_API_URL` → base do backend (ex.: `http://localhost:8080`, **sem** barra final).  
**Execução nesta sessão:** teste de conectividade HTTP real contra `http://127.0.0.1:8080`; **build** de produção do admin; **revisão de código** alinhada ao roteiro E2E (browser **não** instrumentado nesta sessão).

---

## 1. Resumo geral

| Área | Resultado nesta sessão |
|------|-------------------------|
| Backend HTTP vivo (`:8080`) | **Não** — `Invoke-WebRequest` falhou com *“Impossível conectar-se ao servidor remoto”*. |
| Build `goldeouro-admin` | **OK** (Vite 4.5.14, ~16,6 s). |
| Rastreabilidade rota UI → `fetch` → `/api/admin/*` | **OK** (tabela na §4). |
| Contrato `x-admin-token` no cliente | **OK** (`src/js/api.js`). |
| Rotas Express admin | **OK** (`routes/adminApiFly.js` — grep de handlers). |
| Navegação real + rede no Chrome | **Não executado** aqui. |

**Classificação final:** **APROVADO COM RESSALVAS** (ver §14).

**Mensagem direta:** o painel está **alinhado em código** com um smoke completo; **não foi possível provar** nesta sessão que login, dashboards e listas funcionam **em runtime** com o seu backend, porque o servidor **não estava a escuta** no momento do teste. Deve repetir o mesmo checklist com `node server-fly.js` + `npm run dev` no admin antes de considerar **APROVADO** “fechado”.

---

## 2. Login

| Verificação | Evidência (código / esperado) |
|-------------|-------------------------------|
| Rota `/login` | `AppRoutes.jsx` → `<Route path="/login" element={<Login />} />`. |
| Token ≥ 16 caracteres | `Login.jsx` (`MIN_TOKEN_LEN = 16`); `auth.js` `login()` idem. |
| Persistência | `localStorage` `admin-token` + `admin-token-timestamp`. |
| Redirecionamento pós-login | `navigate("/painel", { replace: true })`. |
| Já autenticado abre login | `useEffect` → `navigate("/painel")` se `isAuthenticated()`. |
| Bloqueio sem token (área autenticada) | `MainLayout.jsx` → `!isAuthenticated()` → `navigate('/login')`. |
| Fluxo “fake” (credenciais fixas) | **Ausente** na malha oficial — `Login` grava token; não há axios legado nesta página. |
| `x-admin-token` | Não enviado no login (esperado); enviado em **todas** as chamadas `getData`/`postData`/`downloadAdminFile` após login. |

**Runtime:** não testado no browser nesta sessão.

---

## 3. Dashboard

| Verificação | Evidência |
|-------------|-----------|
| Rota | `/` e `/painel` → `MainLayout` + `Dashboard`. |
| Chamada | `Dashboard.jsx` → `getData('/api/admin/stats')`. |
| Método | GET (`api.js`). |
| Header | `x-admin-token` + `Content-Type: application/json`. |
| Erro não silencioso (stats) | `catch` → `setError(e.message)` + faixa vermelha; não usa mock como sucesso. |

**Backend:** `adminApiFly.js` → `GET /stats` (montado em `/api/admin` → path efetivo **`GET /api/admin/stats`**).

---

## 4. Navegação por páginas

Para cada rota oficial: componente, endpoint(s), método — conforme `AppRoutes.jsx` + ficheiros em `src/pages` e router `routes/adminApiFly.js`.

| Rota UI | Página | Endpoint principal | Método |
|---------|--------|-------------------|--------|
| `/lista-usuarios` | ListaUsuarios | `/api/admin/usuarios` | GET |
| `/relatorio-usuarios` | RelatorioUsuarios | `/api/admin/relatorios/usuarios` | GET |
| `/relatorio-usuarios` | (+ export) | `/api/admin/exportacao?format=csv&tipo=usuarios` | GET (`downloadAdminFile`) |
| `/relatorio-por-usuario/:id` | RelatorioPorUsuario | `/api/admin/usuarios/:id` | GET |
| `/relatorio-financeiro` | RelatorioFinanceiro | `/api/admin/relatorios/financeiro` | GET |
| `/relatorio-geral` | RelatorioGeral | `/api/admin/relatorios/geral` | GET |
| `/relatorio-geral` | (+ export) | `/api/admin/exportacao?format=csv&tipo=transacoes` | GET |
| `/relatorio-semanal` | RelatorioSemanal | `/api/admin/relatorios/semanal` | GET |
| `/estatisticas` | Estatisticas | `/api/admin/stats` | GET |
| `/estatisticas-gerais` | EstatisticasGerais | `/api/admin/stats` | GET |
| `/transacoes` | Transacoes | `/api/admin/transacoes` | GET |
| `/saque-usuarios` | SaqueUsuarios | `/api/admin/saques` | GET |
| `/saque-usuarios` | (+ export) | `/api/admin/exportacao?format=csv&tipo=saques` | GET |
| `/usuarios-bloqueados` | UsuariosBloqueados | `/api/admin/usuarios-bloqueados` | GET |
| `/usuarios-bloqueados` | (reativar) | `/api/admin/usuarios/:id/reativar` | POST |
| `/lotes` | Lotes | `/api/admin/lotes` (ou alias `GET /api/admin/fila`, mesmo payload) | GET |
| `/fila` | — | *(redirect `Navigate` → `/lotes`)* | — |
| `/top-jogadores` | TopJogadores | `/api/admin/top-jogadores` | GET |
| `/backup` | Backup | `/api/admin/backup` | GET / POST |
| `/configuracoes` | Configuracoes | `/api/admin/configuracoes` | GET / POST |
| `/exportar-dados` | ExportarDados | `/api/admin/exportacao` | GET (+ download com query) |
| `/logs` | LogsSistema | `/api/admin/logs` | GET |
| `/chutes` | ChutesRecentes | `/api/admin/chutes` | GET |

**URL base:** `import.meta.env.VITE_API_URL + endpoint` — com `endpoint` começando por `/api/admin/...` **não** há duplicação do padrão errado `/api/api/...` desde que `VITE_API_URL` **não** inclua sufixo `/api`.

**Renderização / tela branca:** não verificado em browser; **build** passou (bundling de todas as páginas acima).

---

## 5. Relatório por usuário

| Cenário | Comportamento esperado (código) |
|---------|--------------------------------|
| `/relatorio-por-usuario` sem `:id` | `AppRoutes.jsx` → `<Navigate to="/relatorio-usuarios" replace />`. |
| `/relatorio-por-usuario/:id` | `RelatorioPorUsuario` → `getData(\`/api/admin/usuarios/${encodeURIComponent(id)}\`)`. |
| ID inválido / erro de API | `catch` → `usuario` null → `EmptyState` *“Usuário não encontrado ou sem dados disponíveis”* — **pode confundir** erro de rede/401 com 404 (ressalva de honestidade). |

---

## 6. Exportação

| Verificação | Evidência |
|-------------|-----------|
| Função | `downloadAdminFile(endpoint, filename)` em `api.js`. |
| Método | GET; header **`x-admin-token`** (sem `Content-Type` JSON no body — adequado para ficheiro). |
| Erro HTTP | `!response.ok` → `throw new Error(t \|\| status)`. |
| Páginas | `RelatorioUsuarios`, `RelatorioGeral`, `SaqueUsuarios`, `ExportarDados` (queries documentadas na §4). |

**Runtime:** download depende do browser e CORS/CSP; não testado aqui.

---

## 7. Backup

| Verificação | Evidência |
|-------------|-----------|
| GET | `Backup.jsx` → `getData('/api/admin/backup')`. |
| POST criar | `postData('/api/admin/backup', { action: 'create' })`. |
| POST apagar | `postData('/api/admin/backup', { action: 'delete', backupId })`. |
| Erro em load | `catch` → `setBackups([])` + `console.error` — **lista vazia sem banner** de falha (ressalva). |
| Erro em ação | `alert(error.message \|\| ...)` em create. |

**Backend:** `router.get('/backup')` e `router.post('/backup')` em `adminApiFly.js`.

---

## 8. Estados de erro

| Cenário | Comportamento (código) |
|---------|-------------------------|
| Token ausente antes do `fetch` | `getData`/`postData` → `throw` *“Token administrativo ausente…”*. |
| Token inválido (servidor 401) | `parseJsonResponse` → `throw` com `json.message` típico do middleware admin. |
| Resposta não JSON | `throw` *“Resposta inválida do servidor (não é JSON).”*. |
| Backend offline | `fetch` rejeita; páginas com `try/catch` variam: **Dashboard** mostra erro; **várias listas** só esvaziam dados (**§13**). |
| Resposta vazia | Depende do endpoint; `pickData` devolve `data` ou objeto raiz conforme shape. |

**Simulação “UI não mente”:** **parcialmente cumprida** — risco conhecido de confundir falha com lista vazia em algumas vistas.

---

## 9. Logout

| Verificação | Evidência |
|-------------|-----------|
| Rota `/logout` | `Logout.tsx` → `logout()` + `navigate('/login')`. |
| Sidebar | Botão → `logout()` + `navigate('/login')`. |
| Limpeza | `auth.js` remove `admin-token`, timestamp e chaves legadas; `sessionStorage.clear()` em `try`. |
| Pós-logout | `MainLayout` redireciona se aceder a rota protegida sem sessão. |

**Runtime:** não testado no browser nesta sessão.

---

## 10. Integração com backend

| Verificação | Estado |
|-------------|--------|
| Montagem `/api/admin` | `server-fly.js` — `app.use('/api/admin', createAdminApiRouter(...))` **após** `POST /api/admin/bootstrap`. |
| Ordem vs bootstrap | Comentário explícito no código; `adminApiFly.js` **sem** rota `bootstrap`. |
| Auth servidor | `authAdminToken` — compara `x-admin-token` a `process.env.ADMIN_TOKEN` (mín. 16). |
| Teste HTTP real nesta sessão | **Falhou** — nenhuma resposta de `127.0.0.1:8080` (servidor não disponível). |

---

## 11. Uso de API (inspeção de rede simulada)

| Ponto | Resultado |
|-------|-----------|
| Prefixo de path no cliente | `/api/admin/...` em todas as páginas oficiais mapeadas. |
| Duplicação `/api/api` | **Não** introduzida pelo padrão atual (`VITE_API_URL` + path absoluto desde `/api`). |
| Header crítico | `x-admin-token` em `getData`, `postData`, `downloadAdminFile`. |
| Status esperado com token válido | 200 + JSON `{ success, data? }` na maioria dos GETs (conforme implementação do router). |
| Status sem token / token errado | 401 ou 503 se `ADMIN_TOKEN` não configurado no servidor. |

---

## 12. Interferência de legado

| Artefato | Páginas oficiais (`AppRoutes`)? |
|----------|----------------------------------|
| `services/api.js` | **Não** — grep nas páginas oficiais listadas (ficheiros canónicos `.jsx` dos mesmos nomes) → **0 ocorrências**. |
| `dataService.js` | **Não** nas páginas oficiais acima (validação por exclusão no mesmo conjunto). |
| `App.jsx` | **Não** no entrypoint — `main.jsx` importa só `AppRoutes`. |
| `src/routes/index.jsx` | **Não** referenciado no `src` do admin (validação anterior por grep). |

*Nota:* existem páginas paralelas (`*Responsive*`, etc.) que ainda importam `services/api.js`; **não** fazem parte da malha oficial validada neste smoke.

---

## 13. Problemas encontrados

1. **Crítico para *esta execução*:** backend **inacessível** em `http://127.0.0.1:8080` — impossível validar login real, JSONs e códigos HTTP nesta sessão.
2. **UX / honestidade:** várias listagens tratam erro de API como lista vazia sem mensagem destacada (ex.: `ListaUsuarios`, load inicial de `Backup`).
3. **`RelatorioPorUsuario`:** mensagem única para “não encontrado” **vs** falha de rede/token.
4. **CSP (`goldeouro-admin/index.html`):** `connect-src` pode **bloquear** `fetch` para API em host não listado (ex.: `localhost:8080` com admin em `localhost:5173`) — verificar em E2E real no browser.
5. **E2E browser:** não realizado (sem Playwright/Cypress nem MCP browser nesta tarefa).

---

## 14. Diagnóstico final

**Classificação:** **APROVADO COM RESSALVAS**

- **O painel “funciona de verdade”?** Em termos de **código e contrato API**, **sim**. Em termos de **prova empírica completa nesta sessão**, **não** (servidor parado).
- **Consigo operar o admin?** **Sim**, desde que suba o backend com `ADMIN_TOKEN`, configure `VITE_API_URL` e confirme que o browser permite `connect-src` à origem da API.
- **Bugs críticos identificados no código?** Nenhum bloqueador estrutural novo neste smoke; **riscos operacionais**: CSP, mensagens de erro ambíguas, e necessidade de **re-teste com servidor vivo**.
- **Posso avançar para ambiente real?** **Sim, com ressalvas:** executar primeiro o **mesmo roteiro** contra staging/produção com rede aberta e token válido; corrigir CSP se a URL da API não estiver permitida.

### Roteiro rápido para fechar o smoke com servidor local

1. Terminal A (raiz do repo): `node server-fly.js` (ou `npm start`) com `.env` contendo `ADMIN_TOKEN` e Supabase OK.  
2. Terminal B: `cd goldeouro-admin && npm run dev` com `VITE_API_URL=http://localhost:8080` (ajuste à `PORT`).  
3. Browser: `/login` → colar `ADMIN_TOKEN` → percorrer Sidebar na ordem da §4.  
4. DevTools → rede: confirmar `x-admin-token` e status 200 nas chamadas `/api/admin/*`.  
5. `/logout` → confirmar limpeza de `localStorage` e bloqueio ao voltar a `/painel`.

---

## Respostas ao “resultado esperado”

| Pergunta | Resposta |
|----------|----------|
| Painel funciona de verdade? | **Contrato e build validados; runtime completo depende de repetir o teste com backend ativo.** |
| Consigo operar o admin? | **Sim**, após pré-condições e verificação de CSP. |
| Há bugs críticos? | **Nenhum novo crítico de integração detectado no código**; **falha de conectividade** impediu validação final de API. |
| Posso avançar para ambiente real? | **Sim com ressalvas** — smoke manual em ambiente real recomendado antes de dar “APROVADO” pleno. |
