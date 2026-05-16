# PRÉ-EXECUÇÃO T14A — CORREÇÃO ESTRUTURAL DO PAINEL ADMIN V1

**Data:** 2026-05-12  
**Tipo:** pré-execução (análise e plano; **sem** implementação, commit, deploy ou alteração de banco).  
**Relatório-base:** `docs/relatorios/DIAGNOSTICO-OPERACIONAL-COMPLETO-PAINEL-ADMIN-V1-2026-05-12.md`

---

## 1. Resumo executivo

A cirurgia **T14A** deve alinhar o painel admin ao **runtime real** (`server-fly.js` em `https://goldeouro-backend-v2.fly.dev`), eliminando chamadas que hoje resultam em **404**, corrigindo o **fluxo de relatório por utilizador** (router + eventual API), e substituindo **fallbacks que mascaram erro** por estados honestos.

A estratégia recomendada é **Opção A — padronizar no espaço de nomes `/api/admin/...`** no contrato observado pelo cliente, implementando no backend apenas o que faltar de forma **explícita** em `server-fly.js` (ou módulos `require` estáveis), **sem** “montar à cega” `routes/adminRoutes.js`: no estado atual do repositório esse router referencia **`controllers/adminController.js` e `controllers/exportController.js` inexistentes** na pasta ativa de controladores (existem apenas cópias arquivadas em `_archived_config_controllers/`). Montar `adminRoutes.js` sem resolver isso **quebraria o arranque do Node** com erro de módulo.

A **baseline Git** não está limpa: branch à frente do remoto, ficheiro modificado fora do admin, muitos ficheiros não rastreados (incluindo o próprio diagnóstico T14). A classificação final de prontidão é **PRONTO COM RESSALVAS** — plano e rollback são claros, mas há **sujeira de working tree** e **dependência quebrada** no router legado.

---

## 2. Baseline Git atual

| Item | Valor observado |
|------|------------------|
| **Branch** | `fix/admin-financial-integrity-v1` |
| **Tracking** | `...origin/fix/admin-financial-integrity-v1` **[ahead 10]** |
| **Último commit** | `99baaaf` — `docs: diagnostico read-only finalizacao V1 producao real` |
| **Modificado (tracked)** | `goldeouro-player/vercel.json` (**M**) |
| **Não rastreados (exemplos)** | Vários em `docs/relatorios/*.md`, `database/*.sql`, `scripts/*.js`, incluindo `DIAGNOSTICO-OPERACIONAL-COMPLETO-PAINEL-ADMIN-V1-2026-05-12.md` |
| **Relatório T14 (diagnóstico)** | Presente no disco; estado Git **`??` (não commitado)** na captura efetuada |

**Classificação da baseline:** **SUJA / RISCO** — há alteração tracked não relacionada com T14A e um conjunto grande de ficheiros `??`; o diagnóstico-base não está versionado no histórico local analisado.

**Recomendação pré-cirúrgica:** antes de qualquer implementação T14A, **normalizar** a árvore (stash/commit/descarte) e **commitar** os relatórios que devem fazer parte da linha de auditoria, ou criar **branch dedicada** `chore/t14a-admin-alignment` a partir de um commit limpo acordado com a equipa.

---

## 3. Relatório-base analisado

Ficheiro: `docs/relatorios/DIAGNOSTICO-OPERACIONAL-COMPLETO-PAINEL-ADMIN-V1-2026-05-12.md`

Síntese reutilizada na T14A:

- Núcleo **real** em `/api/admin/*` + login `/api/auth/login`.
- Chamadas **`/admin/...`** na raiz do host da API → **404** em Fly.
- `routes/adminRoutes.js` **não montado** em `server-fly.js`.
- Mocks / zeros em `catch` em várias páginas.
- Rota SPA `/relatorio-por-usuario` **sem** `:id`.

---

## 4. Arquivos potencialmente afetados

### 4.1 Frontend (`goldeouro-admin/src/`)

| Categoria | Caminhos |
|-----------|----------|
| Rotas | `AppRoutes.jsx` |
| Navegação | `components/Sidebar.jsx`, opcionalmente `components/SidebarResponsive.jsx`, `config/navigation.js` |
| Layout | **`components/MainLayout.jsx`** *(nota: não existe `layouts/MainLayout.jsx`; o pedido oficial referia esse caminho — o ficheiro real é em `components/`)* |
| Cliente HTTP | `js/api.js`, `services/api.js`, `config/env.js` |
| Auth | `js/auth.js`, `pages/Login.jsx`, `components/Logout.jsx` (se existir) |
| Páginas em `pages/` (rotas ativas em `AppRoutes`) | `Dashboard.jsx`, `Users.jsx`, `RelatorioUsuarios.jsx`, `RelatorioPorUsuario.jsx`, `RelatorioFinanceiro.jsx`, `RelatorioGeral.jsx`, `RelatorioSemanal.jsx`, `Estatisticas.jsx`, `EstatisticasGerais.jsx`, `Transacoes.jsx`, `SaqueUsuarios.jsx`, `UsuariosBloqueados.jsx`, `Fila.jsx`, `TopJogadores.jsx`, `Backup.jsx`, `Configuracoes.jsx`, `ExportarDados.jsx`, `LogsSistema.jsx`, `Auditoria.jsx`, `ChutesRecentes.jsx` |
| Páginas não roteadas (risco de confusão se alguém editar por engano) | Dezenas de `*Responsive*.jsx`, `Games.jsx`, `Payments.jsx`, etc. |
| Legado | `App.jsx` (não usado por `main.jsx`; risco se reativado) |

### 4.2 Backend

| Ficheiro | Papel na T14A |
|----------|----------------|
| `server-fly.js` | Ponto único de verdade em Fly; novas rotas `/api/admin/...` ou delegação segura |
| `routes/adminRoutes.js` | **Alto cuidado:** `require('../controllers/adminController')` e `exportController` — **módulos em falta** na árvore ativa |
| `controllers/adminWithdrawController.js` | Já usado por rotas de saque admin |
| `middlewares/auth.js` | `authenticateToken` (usado em `server-fly.js`) |
| `middlewares/authMiddleware.js` | `authAdminToken` (referenciado por `adminRoutes.js`; modelo de auth pode divergir do usado em Fly) |
| `src/utils/adminAuditLogger.js` | Auditoria persistida (já integrada no fluxo admin real) |

### 4.3 Documentação

- `docs/relatorios/DIAGNOSTICO-OPERACIONAL-COMPLETO-PAINEL-ADMIN-V1-2026-05-12.md` (base)
- Este ficheiro: `docs/relatorios/PRE-EXECUCAO-T14A-CORRECAO-ESTRUTURAL-PAINEL-ADMIN-V1-2026-05-12.md`

---

## 5. Mapa frontend ↔ backend (síntese)

| Área | Frontend (padrão atual) | Backend Fly (`server-fly.js`) |
|------|-------------------------|-------------------------------|
| Auth | `POST /api/auth/login` | Existente |
| Dashboard | `GET /api/admin/dashboard/stats` | Existente |
| Utilizadores | `GET/POST /api/admin/users/*` | Existente |
| Saques | `GET/POST /api/admin/withdraw/*` | Existente |
| Financeiro | `GET /api/admin/financial/report` | Existente |
| Auditoria | `GET /api/admin/audit/logs` | Existente |
| Resto do menu | `POST/GET` em `/admin/...` ou `/fila/...` via `getApiUrl()` | **Não mapeado** → 404 |

---

## 6. Contratos de rotas atuais

Legenda de decisão recomendada para a fase de implementação (T14A):

- **M** — migrar chamada no frontend para `/api/admin/...` alinhado a `server-fly.js`
- **B** — novo endpoint em `server-fly.js` (leitura segura, mesmo padrão de auth que as rotas admin atuais)
- **H** — esconder/ocultar menu até existir API (se não for prioridade V1)
- **X** — fora do escopo T14A (feature grande / dependência arquivada)

| Página (AppRoutes) | Rota visual (SPA) | Chamada atual (resumo) | Backend Fly real | Status | Decisão |
|--------------------|-------------------|-------------------------|------------------|--------|---------|
| Login | `/login` | `POST /api/auth/login` | Sim | OK | Manter |
| Dashboard | `/`, `/painel` | `GET /api/admin/dashboard/stats` | Sim | OK | Manter |
| Users | `/lista-usuarios` | `GET/POST /api/admin/users/*` | Sim | OK | Manter |
| RelatorioUsuarios | `/relatorio-usuarios` | `POST /admin/relatorio-usuarios` | Não | 404 | **M** ou **B** (se dados forem requisito V1) |
| RelatorioPorUsuario | `/relatorio-por-usuario` | `POST /admin/usuario/:id` + `useParams` sem rota | Não + router quebrado | Falha | **M** + **B** (detalhe utilizador) + corrigir rota `:id` |
| RelatorioFinanceiro | `/relatorio-financeiro` | `GET /api/admin/financial/report` | Sim | OK | Manter |
| RelatorioGeral | `/relatorio-geral` | `POST /admin/relatorio-geral` | Não | 404 | **M**/**B** ou **H** |
| RelatorioSemanal | `/relatorio-semanal` | `POST /admin/relatorio-semanal` | Não | 404 | **M**/**B** ou **H** |
| Estatisticas | `/estatisticas` | axios `GET /admin/estatisticas-gerais` | Não | 404 + zeros | **M**/**B** + remover zeros enganosos |
| EstatisticasGerais | `/estatisticas-gerais` | `POST /admin/estatisticas-gerais` | Não | 404 | **M**/**B** ou **H** |
| Transacoes | `/transacoes` | `POST /admin/transacoes-recentes` | Não | 404 | **M**/**B** ou **H** |
| SaqueUsuarios | `/saque-usuarios` | `/api/admin/withdraw/*` | Sim | OK | Manter |
| UsuariosBloqueados | `/usuarios-bloqueados` | `POST /admin/usuarios-bloqueados` | Não* | 404 | **M**: pode reutilizar filtros em `GET /api/admin/users/list?status=blocked` *sem novo endpoint* |
| Fila | `/fila` | `POST /fila/status` | Não | 404 | **B** mínimo ou **H** |
| TopJogadores | `/top-jogadores` | `POST /admin/top-jogadores` | Não | 404 | **M**/**B** ou **H** |
| Backup | `/backup` | vários `/admin/backup-*` | Não | 404 | **H** ou **X** (depende produto) |
| Configuracoes | `/configuracoes` | `/admin/configuracoes*` | Não | 404 | **H** ou **X** |
| ExportarDados | `/exportar-dados` | `POST /admin/...` + `window.open` sem `/api` | Não | 404 | **M**/**B** ou **X** (exportações são escopo sensível) |
| LogsSistema | `/logs` | `POST /admin/logs` | Não | 404 | **H** (diferenciar de **Auditoria**) ou **B** se “logs sistema” for requisito |
| Auditoria | `/auditoria` | `GET /api/admin/audit/logs` | Sim | OK | Manter |
| ChutesRecentes | `/chutes` | `POST /admin/chutes-recentes` | Não | 404 | **M** para `GET /api/games/chutes/recentes` *(já existe em `server-fly.js` para utilizador autenticado — validar se admin pode reutilizar o mesmo contrato)* ou **B** |

\* Lista de bloqueados pode ser satisfeita sem novo POST legacy.

---

## 7. Estratégia recomendada

### Escolha: **Opção A — padronizar `/api/admin/...`** (com implementação backend **pontual** em `server-fly.js` onde ainda não existir rota)

**Justificativa:**

1. **Compatibilidade com o runtime atual** — Fly já expõe e audita o padrão `/api/admin/*` com `authenticateToken` + `requireAdministradorDb`.
2. **Menor risco do que Opção B** — “Montar `adminRoutes.js`” **não é seguro** no estado do repo: faltam `controllers/adminController.js` e `controllers/exportController.js` na árvore ativa; o `require` falharia. Recuperar controladores arquivados implica **auditoria de segurança** e alinhamento com Supabase atual — **escopo maior** que T14A estrita.
3. **Opção C (híbrida)** pode ser **transição** (ex.: reescrever `/admin/*` → `/api/admin/*` num único middleware) mas adiciona **superfície dupla** e testes duplicados; só faz sentido se for necessário compatibilizar clientes externos legados **— não é o caso do SPA admin único**.

**Opção B** (`/admin/...` na raiz) **não recomendada** como estratégia principal: duplicaria convenções, aumentaria confusão com rotas não API-prefixed, e ainda exigiria resolver os controladores em falta se se reutilizar o router legado.

---

## 8. Mocks e fallbacks identificados

Padrões encontrados (amostra representativa; lista completa de linhas na análise por `Select-String` em `pages/*.jsx`):

| Ficheiro | Risco | Recomendação na cirurgia |
|----------|-------|---------------------------|
| `Estatisticas.jsx` | **Alto** — em `catch` preenche métricas **a zero**, simulando plataforma morta | Estado de erro explícito; desativar rota até API existir |
| `LogsSistema.jsx` | **Alto** — fallback com eventos fictícios após 404 | Remover mock; mensagem “indisponível”; ou ligar a API real distinta de auditoria |
| `Backup.jsx`, `Configuracoes.jsx`, `RelatorioGeral.jsx`, `RelatorioSemanal.jsx`, `RelatorioPorUsuario.jsx`, `ExportarDados.jsx`, `RelatorioUsuarios.jsx`, `Transacoes.jsx`, `TopJogadores.jsx`, `UsuariosBloqueados.jsx`, `ChutesRecentes.jsx`, `Fila.jsx` | **Alto** — `catch` com dados inventariados | Erro visível + telemetria; ou ocultar menu |
| Variantes `*Responsive*.jsx` | **Médio** — duplicam lógica; risco de editar ficheiro errado | **Não** roteadas hoje; fora do escopo salvo decisão de consolidar |

---

## 9. Fluxo de relatório individual

| Etapa | Estado atual |
|-------|----------------|
| Lista (`Users.jsx`) | **Sem** link “Ver relatório” para `/relatorio-por-usuario/:id` — o fluxo UX **nem sequer inicia** a partir da lista moderna |
| Sidebar | Link estático para `/relatorio-por-usuario` **sem** id |
| `AppRoutes.jsx` | Rota **sem** parâmetro dinâmico |
| `RelatorioPorUsuario.jsx` | `useParams().id` → `undefined`; `POST /admin/usuario/${id}` inválido; fallback fictício |

**Definições mínimas para a cirurgia:**

| Item | Recomendação |
|------|----------------|
| **Rota SPA correta** | `/relatorio-por-usuario/:id` (uuid ou id interno coerente com lista) |
| **Endpoint** | Novo **`GET /api/admin/users/:id`** (ou `GET /api/admin/users/detail?id=`) com `authenticateToken` + `requireAdministradorDb`, devolvendo agregados permitidos por política (sem expor dados sensíveis desnecessários) |
| **Comportamento esperado** | 200 + payload tipado; 404 se utilizador inexistente; 403 se não admin |
| **Validação mínima** | A partir da lista, navegar para relatório; rede mostra **200** e dados coerentes com a linha selecionada; **sem** objeto “João Silva” de mock |

---

## 10. Impacto em banco

| Questão | Avaliação T14A (alinhamento rotas + relatório + honestidade de erro) |
|---------|----------------------------------------------------------------------|
| Migration nova | **Não obrigatória** para o núcleo descrito |
| Alteração de tabela/coluna | **Não obrigatória** |
| Alteração de dados | **Não** |
| Permissões Supabase | **Não** — desde que novos endpoints usem o **mesmo** cliente servidor já usado nas rotas admin atuais |

**Classificação:** **SEM IMPACTO EM BANCO** *(para o escopo estrito de alinhar HTTP + router + remoção de mocks; se no futuro se exigirem novas tabelas para “logs sistema”, aí sim reclassificar)*.

---

## 11. Impacto em backend

| Ação | Necessária? | Risco |
|------|-------------|-------|
| Montar `adminRoutes.js` como está | **Desaconselhado / bloqueado** sem restaurar controladores | **ALTO** (crash `Cannot find module`) |
| Editar `server-fly.js` para novos `GET` admin (detalhe user, etc.) | Provável para relatório individual e algumas leituras | **MÉDIO** — regressão auth, vazamento de PII |
| Alterar middlewares | Possível se unificar claims; não obrigatório para MVP | **MÉDIO** |
| Remover endpoints | Não recomendado na T14A | **BAIXO** se não se remove nada |

**Classificação global backend:** **MÉDIO** (mudanças localizadas mas sensíveis a dados pessoais e autorização).

---

## 12. Impacto em frontend

| Área | Risco |
|------|-------|
| Páginas com `postData('/admin/...')` ou axios sem `/api` | **ALTO** — muitos ficheiros |
| `AppRoutes` + `Sidebar` | **MÉDIO** — coerência de URLs |
| `js/api.js` / `services/api.js` | **BAIXO** a **MÉDIO** — opcional normalizar `baseURL` com sufixo `/api` *(avaliar efeitos colaterais em chamadas que já passam path absoluto)* |
| Exportações (`window.open`) | **ALTO** — auth por query string ausente; URLs erradas |

**Classificação global frontend:** **ALTO** (volume de toques + risco de regressão visual/fluxo).

---

## 13. Plano de rollback

1. **Antes de qualquer commit T14A:** criar tag anotada no commit pré-cirúrgico acordado, por exemplo:  
   `git tag -a pre-t14a-admin-alignment-2026-05-12 -m "Baseline antes da T14A alinhamento admin"`  
   no SHA atual da branch (ex.: `99baaaf` ou commit limpo após normalização da árvore).

2. **Branch de trabalho:** `feature/t14a-admin-api-alignment` a partir da tag/commit baseline (não implementar diretamente em `main` se a política da equipa proibir).

3. **Se a cirurgia falhar após deploy:**
   - **Frontend (Vercel):** redeploy do deployment anterior estável (painel admin).
   - **Backend (Fly):** `fly releases` + rollback para release anterior, ou redeploy da imagem digest anterior.
   - **Git:** `git revert` do merge commit da T14A ou `git reset --hard` para `pre-t14a-admin-alignment-2026-05-12` **apenas** em branch de feature (nunca force-push em branch partilhada sem acordo).

4. **Ficheiros a proteger em revisão:** `server-fly.js` (blocos admin e auth), `goldeouro-admin/src/AppRoutes.jsx`, `goldeouro-admin/src/js/api.js`.

---

## 14. Critérios de validação pós-cirurgia

### Backend (automático + manual)

| Teste | Critério de sucesso |
|-------|---------------------|
| `GET /health` | 200 |
| `GET /meta` | 200 *(já existe; fora escopo T14A mas pode ser smoke global)* |
| Admin sem token | `401` em `/api/admin/dashboard/stats`, `/api/admin/users/list`, novos endpoints |
| Admin com token não-admin | `403` onde `requireAdministradorDb` aplicar |
| Admin com token admin | `200` + `success: true` nas rotas existentes e nas novas |
| Relatório individual | `GET` novo com id válido → 200; id inválido → 404 |

### Frontend

| Fluxo | Critério |
|-------|----------|
| Login → Painel | Dashboard carrega métricas reais |
| Lista utilizadores | Lista, filtros, block/unblock intactos |
| Relatório individual | Navegação com `:id`; rede sem 404; sem dados fictícios |
| Financeiro, Saques, Auditoria | Sem regressão |
| Logs | Ou oculto, ou erro honesto, ou API real documentada |
| Transações / estatísticas / exportações | Conforme escopo fechado na secção 15 — cada item **200 real** ou **UI desativada** |
| Refresh + Logout | Sessão consistente |

### Runtime

| Camada | Critério |
|--------|----------|
| Build admin | `npm run build` (ou script do projeto) sem erros |
| Deploy | Fly + Vercel com health estável pós-deploy |
| Rede browser | Zero `POST https://...fly.dev/admin/...` **404** nas páginas incluídas no escopo |

---

## 15. Escopo final recomendado para T14A

### ENTRA na T14A

1. Substituir chamadas **`/admin/...`** e **`/fila/...`** fantasmas nas **páginas listadas em `AppRoutes.jsx`** por **`/api/admin/...`** existentes **ou** por novos endpoints mínimos em `server-fly.js`.
2. Corrigir **`AppRoutes.jsx`** + **`Sidebar.jsx`** para **`/relatorio-por-usuario/:id`** e adicionar na **`Users.jsx`** (ou tabela equivalente) ação “Detalhe” / link.
3. Implementar **`GET /api/admin/users/:id`** (ou variante query) com mesma política de auth das rotas admin atuais.
4. Remover ou neutralizar **fallbacks enganosos** nas páginas do escopo (substituir por estado de erro / “indisponível”).
5. Alinhar **`config/navigation.js`** com rotas reais do router (evitar rotas fantasmas tipo `/jogo` se não existirem).
6. **Tela “Utilizadores bloqueados”:** preferir reutilizar **`GET /api/admin/users/list?status=blocked`** em vez de ressuscitar POST legacy.

### NÃO ENTRA na T14A

- Redesign visual, dark mode, i18n.
- **T13** ou expansão de `/meta` além de smoke opcional.
- Antifraude, PIX, webhooks, gameplay.
- Refatoração massiva de todas as variantes `*Responsive*.jsx` não roteadas.
- Montar **`routes/adminRoutes.js`** sem **projeto separado** de restauração e auditoria dos controladores em `_archived_config_controllers/`.
- Exportações CSV/PDF completas **salvo** se forem explicitamente priorizadas e desenhadas (auth em download, streaming, etc.).

---

## 16. Itens explicitamente fora do escopo

- Consolidação total de ficheiros duplicados responsive.
- Alteração de schema Supabase para novas entidades de “logs sistema”.
- Remoção do endpoint `POST /api/admin/bootstrap` (pode ser **governança futura**, não misturar com T14A).
- Alteração de `goldeouro-player/vercel.json` salvo decisão de produto **não** ligada ao admin.

---

## 17. Riscos remanescentes

1. **Working tree suja** — risco de misturar alterações não relacionadas no deploy.
2. **`adminRoutes.js` depende de módulos em falta** — qualquer tentação de “só montar o router” é armadilha.
3. **PII** — endpoint de detalhe de utilizador deve respeitar minimização de dados.
4. **`ExportarDados` e `window.open`** — difícil passar Bearer; provável necessidade de download autenticado por outro mecanismo (fora T14A mínima).
5. **Duplicação `/` e `/painel`** — baixo risco operacional, pode ficar para limpeza cosmética.

---

## 18. Classificação final

**PRONTO COM RESSALVAS**

**Motivos:** escopo e estratégia estão claros; rollback e critérios de validação definidos; **sem** impacto de banco no núcleo proposto. **Ressalvas:** baseline Git **suja**; `adminRoutes.js` **não montável** sem recuperar controladores; frontend com **muitos** pontos de contacto e exportações sensíveis.

**Autorização técnica:** seguir para **preparação automática** (scripts/CI, branch dedicada, tag de baseline) **após** normalizar a árvore e commitar/documentar o estado baseline acordado.

---

*Fim do relatório de pré-execução T14A.*
