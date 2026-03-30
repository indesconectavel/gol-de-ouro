# MELHORIA DE UX DE ERRO — BLOCO J

**Data:** 2026-03-28  
**Modo:** melhoria pontual controlada (feedback honesto, sem alterar rotas nem contratos de API).

---

## 1. Resumo executivo

As páginas oficiais do painel admin passaram a **separar explicitamente** três situações: carregamento, **falha de API** (com mensagem e, na maioria dos casos, **“Tentar novamente”**), e **vazio / não encontrado** (sem mascarar erro de rede ou token como “lista vazia”). Foi introduzido o componente reutilizável **`ApiErrorAlert`** e o helper **`isAdminNotFoundMessage`** para distinguir **404 / “não encontrado”** de **outras falhas** em `RelatorioPorUsuario`.

O **`Dashboard`** já expunha erro de `GET /api/admin/stats` de forma explícita; **não foi alterado**.

**Classificação final:** **UX DE ERRO ADEQUADA** (ver §8).

---

## 2. Páginas revisadas

Todas as rotas oficiais em `AppRoutes.jsx` que faziam `getData`/`pickData` com `catch` silencioso ou mensagem ambígua foram alinhadas, exceto `Dashboard` (já correto) e `Login`/`Logout` (fluxo distinto).

Incluídas: **ListaUsuarios**, **RelatorioUsuarios**, **RelatorioPorUsuario**, **Backup**, **Transacoes**, **SaqueUsuarios**, **UsuariosBloqueados**, **Fila**, **TopJogadores**, **ChutesRecentes**, **LogsSistema**, **ExportarDados**, **RelatorioFinanceiro**, **RelatorioGeral**, **RelatorioSemanal**, **Estatisticas**, **EstatisticasGerais**, **Configuracoes**.

---

## 3. Problemas de UX corrigidos

| Antes | Depois |
|-------|--------|
| `catch` → lista `[]` / `null` e UI de “vazio” ou texto genérico | Estado **`loadError`** (ou **`fetchError`**) com **`ApiErrorAlert`** e mensagem da exceção |
| **RelatorioPorUsuario:** um único `EmptyState` para rede, 401 e 404 | **Erro de API** → alerta vermelho; **“não encontrado”** (mensagem típica 404) → `EmptyState` específico |
| **Backup:** falha no `GET` inicial sem destaque | Ecrã dedicado com erro + **retry** |
| **RelatorioFinanceiro / Semanal / Geral:** confusão entre erro e “sem dados” | Ramos separados: erro de rede/API vs resposta vazia ou sem shape esperado |
| **Estatisticas / EstatisticasGerais:** falha parecia “dados em falta” | Erro explícito vs texto neutro quando o bloco JSON simplesmente não vem na resposta |
| **Fila:** `null` após erro igual a “não carregou” genérico | Erro explícito antes do ramo de snapshot vazio |
| **Configuracoes:** “Erro ao carregar” sem detalhe nem retry | **`ApiErrorAlert`** + **`loadConfig`** reutilizado no “Recarregar” |

Não foram introduzidos **mocks** nem dados fictícios em caso de falha.

---

## 4. Estados de erro diferenciados

| Estado | Comportamento |
|--------|----------------|
| **Loading** | Mantido (`StandardLoader`, spinners ou `Loader` existentes). |
| **Erro de API** | `ApiErrorAlert` com `error.message` (rede, 401, 503, JSON inválido, etc.). |
| **Vazio real** | `EmptyState` ou texto cinza **apenas** quando a carga foi **bem-sucedida** e a lista/dados são vazios. |
| **Não encontrado (utilizador)** | `RelatorioPorUsuario`: heurística `isAdminNotFoundMessage` → mensagem dedicada, sem tratar como falha genérica do servidor. |

---

## 5. Arquivos alterados

**Novos**

- `goldeouro-admin/src/components/ApiErrorAlert.jsx`
- `goldeouro-admin/src/utils/adminApiErrors.js`

**Atualizados**

- `goldeouro-admin/src/pages/ListaUsuarios.jsx` (removido bloco de loading duplicado)
- `goldeouro-admin/src/pages/RelatorioUsuarios.jsx`
- `goldeouro-admin/src/pages/RelatorioPorUsuario.jsx`
- `goldeouro-admin/src/pages/Backup.jsx`
- `goldeouro-admin/src/pages/Transacoes.jsx`
- `goldeouro-admin/src/pages/SaqueUsuarios.jsx`
- `goldeouro-admin/src/pages/UsuariosBloqueados.jsx`
- `goldeouro-admin/src/pages/TopJogadores.jsx`
- `goldeouro-admin/src/pages/ChutesRecentes.jsx`
- `goldeouro-admin/src/pages/LogsSistema.jsx`
- `goldeouro-admin/src/pages/ExportarDados.jsx`
- `goldeouro-admin/src/pages/RelatorioFinanceiro.jsx`
- `goldeouro-admin/src/pages/RelatorioGeral.jsx`
- `goldeouro-admin/src/pages/RelatorioSemanal.jsx`
- `goldeouro-admin/src/pages/Estatisticas.jsx`
- `goldeouro-admin/src/pages/EstatisticasGerais.jsx`
- `goldeouro-admin/src/pages/Fila.jsx`
- `goldeouro-admin/src/pages/Configuracoes.jsx`

**Rotas, `AppRoutes.jsx`, `api.js` e endpoints `/api/admin/*`:** sem alterações.

---

## 6. Build final

- Comando: `npm run build` em `goldeouro-admin`
- **Resultado:** sucesso (Vite 4.5.14, ~36 s nesta execução).
- Avisos apenas de Browserslist / baseline (pré-existentes).

---

## 7. Riscos reduzidos

- Operador deixa de interpretar **queda de API** como **“não há utilizadores”** ou **“relatório vazio”**.
- **Token inválido** e **503** passam a surgir na mensagem propagada por `parseJsonResponse` / `fetch`.
- **Retry** reduz necessidade de refresh manual após falha transitória.

**Ressalva residual:** mensagens de “não encontrado” dependem do texto devolvido pelo backend; o helper cobre os padrões atuais (`não encontrado`, `404`). Se o servidor mudar o texto sem `404` na mensagem, pode voltar a cair no ramo de erro genérico (ainda honesto, menos específico).

---

## 8. Estado final de honestidade operacional

O painel oficial comunica **falhas de integração** de forma **visível e acionável**, sem simular sucesso. Listas vazias legítimas continuam distinguíveis de erros.

---

## CLASSIFICAÇÃO FINAL

**UX DE ERRO ADEQUADA**
