# DIAGNÓSTICO READ-ONLY — ADMIN SAQUES

**Data:** 2026-05-04  
**Escopo:** Tela admin `https://admin.goldeouro.lol/saque-usuarios` — integridade financeira e alinhamento com backend.  
**Modo:** Somente leitura (sem alteração de código, sem deploy, sem correção).

---

## 1. Resumo executivo

A página ativa **`/saque-usuarios`** no repositório é **`goldeouro-admin/src/pages/SaqueUsuarios.jsx`**. Ela tenta `POST` em **`/admin/relatorio-saques`**, rota **não declarada** em `routes/adminRoutes.js` e **não montada** em `server-fly.js`. Em falha de rede (ou exceção no `fetch`), o componente substitui a lista por **três registros fixos** (ids 1–3, usuário literal `"Usuário"`, datas em 2025-01-17, totais somando **R$ 425,50**), compatíveis com relatos de “mock em produção”.

A tela **não** chama `POST /api/admin/withdraw/approve` nem `POST /api/admin/withdraw/cancel` e **não** exibe ledger, `correlation_id` ou divergência ledger × `saques`.

No backend, o fluxo **`approveWithdrawManualAdmin`** grava primeiro **`ledger_financeiro`** com tipo **`payout_manual_confirmado`** e **só depois** atualiza **`saques.status`** para **`pago_manual`**. Se a persistência do ledger tiver sucesso e a atualização da linha em `saques` falhar ou não casar o filtro `status IN ('pendente','pending')`, o sintoma **ledger com payout manual confirmado + `saques` ainda pendente + cancel retornando “já pago”** é **tecnicamente plausível** no código de domínio — **independente** da tela admin de listagem.

**Classificação de risco (painel + operação):** **BLOQUEADOR FINANCEIRO** para confiar na tela como fonte de verdade; o incidente descrito (ledger ≠ saques) exige correção **cirúrgica** no fluxo transacional do approve (e instrumentação), não apenas no front.

---

## 2. Arquivo real da tela /saque-usuarios

| Item | Valor |
|------|--------|
| **Caminho completo (repo)** | `goldeouro-admin/src/pages/SaqueUsuarios.jsx` |
| **Import na app** | `import SaqueUsuarios from "./pages/SaqueUsuarios";` em `goldeouro-admin/src/AppRoutes.jsx` |
| **Outros arquivos no repo** | `RelatorioSaques.jsx`, `SaquesPendentes.jsx`, `Withdrawals.jsx`, variantes `*Responsive*` — **não** referenciados pelo `AppRoutes.jsx` usado em `main.jsx` para essa URL |

---

## 3. Rota frontend identificada

- **Router:** `react-router-dom` via `BrowserRouter` em `goldeouro-admin/src/main.jsx` → `AppRoutes.jsx`.
- **Rota:** `path="/saque-usuarios"` com `element={<MainLayout><SaqueUsuarios /></MainLayout>}`.

**Sidebar:** `goldeouro-admin/src/components/Sidebar.jsx` — seção Relatórios, link **“Saques”** → `to="/saque-usuarios"`.

---

## 4. Dados exibidos pela tela

**Classificação:** **Mockados** (caminho garantido no código) **ou** **indeterminado** se a API respondesse com array real (o contrato e a rota não existem no backend analisado).

| Origem | Descrição |
|--------|-----------|
| **Reais** | Não há garantia no código de que a lista seja real; depende de `POST /admin/relatorio-saques` existir no deploy e retornar array no formato esperado. |
| **Mockados** | Array fixo no `catch` do `useEffect` (ids 1–3, `"Usuário"`, valores 150 / 75,5 / 200, status `aprovado` / `pendente` / `rejeitado`, `created_at` 2025-01-17). |
| **Híbridos** | Possível se `postData` retornar algo que não seja array e o estado quebrar ou for parcialmente interpretado; `postData` não valida `response.ok`. |
| **Indeterminado** | Se a produção usar outro bundle/commit não refletido neste workspace. |

A tela **não** mostra ledger, `correlation_id`, `processed_at` do backend real, nem alerta de **inconsistência** entre ledger e `saques`.

---

## 5. Endpoint usado pela tela

| Campo | Valor |
|--------|--------|
| **Helper** | `postData` de `goldeouro-admin/src/js/api.js` |
| **Método HTTP** | `POST` |
| **Path relativo** | `/admin/relatorio-saques` |
| **URL final** | `{VITE_API_URL}/admin/relatorio-saques` (prefixo vem de variável de build Vite) |
| **Payload** | `{}` |
| **Headers** | `Content-Type: application/json`, `x-admin-token: import.meta.env.VITE_ADMIN_TOKEN` |
| **Variáveis de ambiente** | `VITE_API_URL`, `VITE_ADMIN_TOKEN` |

**Exportar CSV:** `window.open(import.meta.env.VITE_API_URL + '/admin/exportar/saques-csv', '_blank')` — `GET`, mesmo header **não** aplicado automaticamente na nova aba (depende de cookie ou auth na URL; típico: download falha ou 401).

**Estado / efeitos:** `useState` para `saques`, `loading`; `useEffect` uma vez montado chama `fetchSaques`; sem approve/cancel.

---

## 6. Backend real disponível para saques

### 6.1 `server-fly.js` (aplicação principal analisada)

Rotas **`/api/admin/...`** encontradas relacionadas a saque administrativo:

- `POST /api/admin/withdraw/approve` — `authenticateToken`, `requireAdministradorDb` → `adminWithdrawController.approveManualWithdraw`
- `POST /api/admin/withdraw/cancel` — idem → `cancelManualWithdraw`
- `POST /api/admin/bootstrap` — não é listagem de saques

Listagem para **jogador:** `GET /api/withdraw/history` consulta `saques` por `usuario_id` (não equivale a “todos os saques admin”).

**Observação:** `server-fly.js` **não** faz `app.use` de `routes/adminRoutes.js` neste repo; rotas legado com `authAdminToken` (`x-admin-token`) não aparecem acopladas ao Fly neste arquivo.

### 6.2 `routes/adminRoutes.js` (legado / referência)

Inclui export:

- `GET /exportar/saques-csv` (relativo ao prefixo onde o router for montado)

**Não inclui** `POST /relatorio-saques`. Os módulos `adminController` e `exportController` referenciados não estão presentes como arquivos ativos em `controllers/` neste snapshot (há versões arquivadas em `_archived_config_controllers/`).

### 6.3 Domínio payout / approve manual (`src/domain/payout/processPendingWithdrawals.js`)

- **Approve:** insere ledger `tipo: 'payout_manual_confirmado'` (`createLedgerEntry`), depois `UPDATE saques` para `status: 'pago_manual'` com filtro `.in('status', ['pendente', 'pending'])`.
- **Cancel:** se existir linha em `ledger_financeiro` com `tipo` em `payout_confirmado` / `payout_manual_confirmado` para o mesmo `correlation_id` e `referencia` = id do saque → `code: 'ALREADY_PAID'` (“Saque já pago”).

Tabela **`saques`** usa campos alinhados a **`usuario_id`**, **`amount`** / **`valor`**, **`status`**, **`correlation_id`**, etc. Ledger: tabela **`ledger_financeiro`**, campo **`tipo`**, **`correlation_id`**, **`referencia`**, coluna de usuário resolvida dinamicamente (`user_id` vs `usuario_id`).

---

## 7. Comparação frontend vs backend

| Aspecto | Frontend (`SaqueUsuarios.jsx`) | Backend real (Fly + domínio) |
|---------|--------------------------------|-----------------------------|
| **Listagem admin** | `POST /admin/relatorio-saques` | **Não existe** no router legado declarado nem no `server-fly.js` analisado |
| **Autenticação chamada de lista** | `x-admin-token` (env build) | Approve/cancel: **Bearer JWT** + `tipo === 'admin'` no banco |
| **Status na UI** | `aprovado`, `pendente`, `rejeitado` | Domínio: `pendente`/`pending`, `pago_manual`, `cancelado_manual`, outros |
| **Identificador de usuário** | Exibe `user_id` na tabela | Modelo Supabase: **`usuario_id`** em `saques` |
| **Approve/Cancel na tela** | **Ausente** | `POST /api/admin/withdraw/approve` / `cancel` |
| **Ledger / correlation** | **Não exibido** | Essencial para diagnóstico e para regra de cancel |

---

## 8. Inconsistências encontradas

1. **Rota de listagem inexistente** no backend mapeado: `/admin/relatorio-saques`.
2. **Fallback mock** mascarando falhas operacionais (risco de decisão sobre dados falsos).
3. **Dois mundos de auth:** lista/export legado (`VITE_ADMIN_TOKEN`) vs operações financeiras JWT — a tela analisada nem chega nas operações reais.
4. **Nomenclatura:** `aprovado`/`rejeitado` vs `pago_manual`/`cancelado_manual`.
5. **Ordem transacional no approve manual:** ledger **antes** de atualizar `saques` → janela de **ledger sem status coerente** em `saques` se o segundo passo falhar; cancel usa presença de `payout_manual_confirmado` no ledger → **“Saque já pago”** mesmo com `saques` ainda **pendente**.
6. **A tela não detecta nem alerta** divergência ledger × `saques`.

---

## 9. Risco financeiro operacional

- **Dados falsos como se fossem reais:** sim, pelo fallback programado e por IDs/datas genéricas coerentes com o mock.
- **Aprovar pela tela analisada:** **não** — não há botões; approve ocorre por **outro** cliente (Postman, outra UI, script). A tela **não** reflete o estado pós-approve nem o ledger.
- **Ocultar ledger ≠ saques:** sim — a UI não mostra ledger; o operador não vê a inconsistência na própria tela.
- **Decisão com base em mock:** **risco alto** se a listagem for usada para priorizar ou conferir saques.

---

## 10. Evidências técnicas

### 10.1 Rota e página

`AppRoutes.jsx` (trecho):

```jsx
<Route
  path="/saque-usuarios"
  element={
    <MainLayout>
      <SaqueUsuarios />
    </MainLayout>
  }
/>
```

### 10.2 Chamada e mock — `SaqueUsuarios.jsx`

- `postData('/admin/relatorio-saques', {})`
- Em `catch`: `setSaques([...])` com três linhas fixas (total R$ 425,50, datas 2025-01-17, `user_id: 'Usuário'`).

### 10.3 `postData` — `goldeouro-admin/src/js/api.js`

```javascript
export const postData = async (endpoint, body) => {
  const response = await fetch(import.meta.env.VITE_API_URL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN,
    },
    body: JSON.stringify(body)
  });
  return await response.json();
};
```

**Limitação:** não há `if (!response.ok) throw ...` — erros HTTP frequentemente **não** entram no `catch` do componente.

### 10.4 `adminRoutes.js` — ausência de `relatorio-saques`

O arquivo declara `POST /relatorio-usuarios`, `POST /transacoes-recentes`, `GET /exportar/saques-csv`, etc., **sem** `relatorio-saques`.

### 10.5 Approve manual — ordem ledger → `saques`

Trecho de `src/domain/payout/processPendingWithdrawals.js` (`approveWithdrawManualAdmin`):

1. `createLedgerEntry` com `tipo: 'payout_manual_confirmado'`
2. `UPDATE saques` → `status: 'pago_manual'` com `.in('status', ['pendente', 'pending'])`
3. Se `!updated?.id` → retorno com `code: 'CONFLICT'` (e o controller pode mapear para 500)

Trecho de `cancelWithdrawManualAdmin`: consulta `ledger_financeiro` por `payout_manual_confirmado` → `ALREADY_PAID` se existir linha.

### 10.6 Comando de verificação no repo (read-only)

Exemplos úteis para quem for validar localmente (não executados como parte deste arquivo):

- Buscar rotas admin no Fly: `rg "admin/withdraw" server-fly.js`
- Buscar rota relatorio saques: `rg "relatorio-saques" .` (esperado: só no front)

---

## 11. Diagnóstico final

**Classificação:** **BLOQUEADOR FINANCEIRO** (em conjunto: **painel de listagem não confiável** + **padrão transacional no approve manual que permite ledger adiantado sem atualização de `saques`**, reproduzindo o cenário relatado).

Subdivisão:

- **Tela `/saque-usuarios` (repo):** **RISCO ALTO** — mock e endpoint inexistente no backend mapeado.
- **Fluxo approve/cancel no domínio:** **RISCO ALTO / BLOQUEADOR** para consistência ledger × `saques` sob falha parcial.

---

## 12. Próximo passo recomendado

**Apenas preparação para correção cirúrgica (não implementar neste documento):**

1. **Fonte de verdade da listagem:** definir um único endpoint administrativo autenticado (JWT + role) que leia `saques` (e, se necessário, enriqueça com último evento de ledger por `correlation_id`) — **sem** dados fictícios em caso de erro.
2. **Transação atômica ou ordem segura no approve manual:** garantir que **`payout_manual_confirmado`** e **`saques.status = pago_manual`** não fiquem dessincronizados (transação DB, compensação se update falhar, ou ledger só após update conforme política de risco).
3. **Idempotência e diagnóstico:** respostas 500 do approve devem ser correlacionáveis a `saqueId` / `correlation_id` em log; painel deve exibir `correlation_id` e status ledger para o operador.
4. **Remover ou isolar mock** da build de produção da tela de saques.
5. **Alinhar enums** na UI aos valores reais (`pago_manual`, `cancelado_manual`, `pendente`, etc.).

---

*Fim do relatório.*
