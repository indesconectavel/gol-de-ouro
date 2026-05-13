# CIRURGIA T14A — CORREÇÃO ESTRUTURAL DO PAINEL ADMIN V1

**Data:** 2026-05-12 (execução: 2026-05-13)  
**Branch:** `fix/admin-financial-integrity-v1`  
**Baseline de segurança:** tag `pre-t14a-painel-admin-v1-2026-05-12` → commit `4f1a4a5`

---

## 1. Resumo executivo

O painel admin deixou de depender de chamadas fantasmas `POST/GET /admin/...` na raiz da API para as páginas cobertas nesta cirurgia: o cliente usa **`/api/admin/...`** alinhado ao `server-fly.js`. Foram removidos **fallbacks com dados fictícios ou zeros enganosos** em favor de mensagens de erro ou de **indisponibilidade explícita**. O fluxo **relatório individual** passou a usar **`/relatorio-por-usuario/:id`**, link na lista de utilizadores e **`GET /api/admin/users/:id`**. Novos endpoints de leitura **`GET /api/admin/chutes/recentes`** e **`GET /api/admin/users/:id`** foram adicionados em `server-fly.js` (auth admin existente). **Build do admin** e **`node --check server-fly.js`** concluídos com sucesso.

---

## 2. Baseline usada

| Item | Valor |
|------|--------|
| Tag | `pre-t14a-painel-admin-v1-2026-05-12` |
| Commit da tag | `4f1a4a5` |
| HEAD de trabalho (antes do commit desta cirurgia) | `8ba15cf` (referência do pedido) |

---

## 3. Arquivos alterados

| Caminho |
|---------|
| `server-fly.js` |
| `goldeouro-admin/src/AppRoutes.jsx` |
| `goldeouro-admin/src/components/Sidebar.jsx` |
| `goldeouro-admin/src/pages/Users.jsx` |
| `goldeouro-admin/src/pages/RelatorioPorUsuario.jsx` |
| `goldeouro-admin/src/pages/LogsSistema.jsx` |
| `goldeouro-admin/src/pages/ChutesRecentes.jsx` |
| `goldeouro-admin/src/pages/Transacoes.jsx` |
| `goldeouro-admin/src/pages/UsuariosBloqueados.jsx` |
| `goldeouro-admin/src/pages/RelatorioUsuarios.jsx` |
| `goldeouro-admin/src/pages/RelatorioGeral.jsx` |
| `goldeouro-admin/src/pages/RelatorioSemanal.jsx` |
| `goldeouro-admin/src/pages/Estatisticas.jsx` |
| `goldeouro-admin/src/pages/EstatisticasGerais.jsx` |
| `goldeouro-admin/src/pages/Fila.jsx` |
| `goldeouro-admin/src/pages/TopJogadores.jsx` |
| `goldeouro-admin/src/pages/Backup.jsx` |
| `goldeouro-admin/src/pages/Configuracoes.jsx` |
| `goldeouro-admin/src/pages/ExportarDados.jsx` |
| `docs/relatorios/CIRURGIA-T14A-CORRECAO-ESTRUTURAL-PAINEL-ADMIN-V1-2026-05-12.md` |

**Não alterados (conforme escopo):** `goldeouro-player/vercel.json` (permanece `M` local fora do commit), `routes/adminRoutes.js`, migrations, scripts `??`.

---

## 4. Rotas corrigidas

| Antes | Depois |
|-------|--------|
| `/relatorio-por-usuario` sem `id` | `/relatorio-por-usuario` → redireciona para `/lista-usuarios`; rota real em **`/relatorio-por-usuario/:id`** |
| Sidebar “Relatório Individual” → URL sem id | Aponta para **`/lista-usuarios`** com `title` explicativo |
| `RelatorioUsuarios` link errado `/relatorio-usuario/:id` | **`/relatorio-por-usuario/:id`** |

---

## 5. Endpoints alinhados

| Página | Chamada anterior | Chamada atual |
|--------|------------------|----------------|
| Logs (admin) | `POST /admin/logs` | **`GET /api/admin/audit/logs`** (mapeamento para tabela existente) |
| Chutes recentes | `POST /admin/chutes-recentes` | **`GET /api/admin/chutes/recentes`** |
| Transações | `POST /admin/transacoes-recentes` | **`GET /api/admin/financial/report`** (`transacoes_recentes`) |
| Usuários bloqueados | `POST /admin/usuarios-bloqueados` | **`GET /api/admin/users/list?status=blocked`** + **`POST /api/admin/users/unblock`** |
| Relatório utilizadores | `POST /admin/relatorio-usuarios` | **`GET /api/admin/users/list?limit=200`** |
| Relatório geral | `POST /admin/relatorio-geral` | **`GET /api/admin/dashboard/stats`** + **`GET /api/admin/financial/report`** (visão parcial) |
| Estatísticas / Estatísticas gerais | `/admin/estatisticas-gerais` (404 / zeros) | **`GET /api/admin/dashboard/stats`** |
| Relatório individual | `POST /admin/usuario/:id` | **`GET /api/admin/users/:id`** |
| Dashboard, Users, Saques, Financeiro, Auditoria | já `/api/admin/*` | inalterados |

---

## 6. Fallbacks/mocks removidos

- Remoção de imports/uso de `mockData`, `shouldFallbackToMock` e objetos inventados nas páginas reescritas.
- **Estatísticas:** removidos “zeros para produção”.
- **Logs:** removido array fictício de eventos.
- **Backup / Configurações / Exportar / Fila / Top jogadores / Relatório semanal:** substituídos por mensagens de **indisponibilidade** (sem simular dados).

---

## 7. Relatório individual

- **Rota:** `/relatorio-por-usuario/:id`
- **Lista:** coluna “Ver” em `Users.jsx`
- **API:** `GET /api/admin/users/:id` — devolve dados do utilizador + contagens opcionais de chutes (`activity.total_chutes`, `activity.total_gols` com `premio > 0`)
- **UI:** erros explícitos; sem mock “João Silva”.

---

## 8. Backend alterado, se aplicável

**Sim.** `server-fly.js`:

- `GET /api/admin/users/:id` — leitura `usuarios` + contagens em `chutes` (sem alteração de schema).
- `GET /api/admin/chutes/recentes` — leitura global de `chutes` + enriquecimento com `usuarios` (email/nome).

Ambos com `authenticateToken` e `requireAdministradorDb`.

---

## 9. Testes executados

| Comando | Resultado |
|---------|-----------|
| `npm run build` (em `goldeouro-admin/`) | **OK** |
| `node --check server-fly.js` | **OK** |

Testes de integração em browser/Fly **não** executados nesta etapa (sem deploy).

---

## 10. Itens fora do escopo preservados

- `goldeouro-player/vercel.json` e todo o player.
- `routes/adminRoutes.js` não montado.
- Ficheiros `??` (scripts, outros relatórios).
- Deploy, Supabase schema, T13 `/meta`.

---

## 11. Riscos remanescentes

- **`GET /api/admin/users/:id`:** contagem “gols” como `premio > 0` é **aproximação** operacional, não definição de negócio formal.
- **Transações:** mapeamento `tipo` → crédito/débito é heurístico para leitura na UI.
- **Logs vs auditoria:** a página “Logs” passou a refletir **`admin_logs`** (mesma fonte que Auditoria), com rótulo claro.
- **Exportações CSV:** continuam por desenhar (endpoint + download autenticado).

---

## 12. Próxima etapa obrigatória

1. **Smoke em produção** após deploy controlado: login admin, lista, relatório individual, chutes, transações, logs, bloqueados.  
2. **Commit** apenas dos ficheiros desta cirurgia (sem incluir `vercel.json` nem `??` não revisados).  
3. Opcional: endpoint dedicado para ranking / fila / exportações.

---

## Classificação final

**PRONTO PARA EXECUÇÃO CONTROLADA DE RUNTIME**

Critérios do pedido: sem player, sem `vercel.json` no diff intencional, sem montar `adminRoutes`, sem banco, sem deploy nesta etapa, build OK, mocks críticos removidos, rotas `/admin/...` substituídas nas páginas tratadas.

---

*Fim do relatório.*
