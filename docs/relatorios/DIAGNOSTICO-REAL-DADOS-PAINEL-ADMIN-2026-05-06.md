# DIAGNÓSTICO REAL — DADOS DO PAINEL ADMIN

**Data:** 2026-05-06  
**Escopo:** diagnóstico read-only de consumo de dados no `goldeouro-admin`  
**Regras:** sem alteração de código, sem deploy, sem mudanças em backend/banco

---

## 1) Referência de backend real (produção)

No `server-fly.js`, endpoints administrativos confirmados para saque manual:

- `POST /api/admin/withdraw/approve`
- `POST /api/admin/withdraw/cancel`

Não foi identificado endpoint real de **listagem admin de saques** no backend principal (`server-fly.js`) para os paths legacy usados pelo painel (`/admin/...`).

---

## 2) Mapeamento das páginas solicitadas

## 2.1 `SaqueUsuarios.jsx`

- **Arquivo:** `goldeouro-admin/src/pages/SaqueUsuarios.jsx`
- **Endpoint usado:** `POST /admin/relatorio-saques`
- **Export usado:** `GET /admin/exportar/saques-csv`
- **Backend real existe?**
  - `POST /admin/relatorio-saques`: **NÃO**
  - `GET /admin/exportar/saques-csv`: apenas em `routes/adminRoutes.js` (legado `x-admin-token`), não confirmado no `server-fly.js` ativo
- **Fallback/mock:** **SIM** (array fixo com 3 saques no `catch`)
- **Inconsistência de contrato:**
  - UI de listagem usa rota legacy `/admin/...`
  - backend real de operação usa `/api/admin/withdraw/*` com JWT
- **Classificação:** **MOCK + QUEBRADA**
- **Risco operacional:** **ALTO** (tela pode mostrar dados fictícios)
- **Prioridade:** **P0**

---

## 2.2 `RelatorioSaques.jsx`

- **Arquivo:** `goldeouro-admin/src/pages/RelatorioSaques.jsx`
- **Endpoint usado:** `POST /admin/relatorio-saques`
- **Export usado:** `GET /admin/exportar/saques-csv`
- **Backend real existe?**
  - `POST /admin/relatorio-saques`: **NÃO**
  - export legacy: não confirmado no backend principal ativo
- **Fallback/mock:** **NÃO explícito**, mas componente fica em `Loader` sem dados e sem tratamento de estado vazio
- **Inconsistência de contrato:** espera `saque.user_name`, `amount`, `created_at` em endpoint não exposto no backend real
- **Classificação:** **QUEBRADA**
- **Risco operacional:** **ALTO**
- **Prioridade:** **P0**

---

## 2.3 `RelatorioFinanceiro.jsx`

- **Arquivo:** `goldeouro-admin/src/pages/RelatorioFinanceiro.jsx`
- **Endpoint usado:** `POST /admin/relatorio-financeiro`
- **Backend real existe?** **NÃO** (não identificado em `server-fly.js`)
- **Fallback/mock:** **SIM** (objeto financeiro completo + transações fixas no `catch`)
- **Inconsistência de contrato:** usa estrutura camelCase local (`receitaTotal`, `transacoes[]`) sem endpoint real correspondente
- **Classificação:** **MOCK + QUEBRADA**
- **Risco operacional:** **ALTO**
- **Prioridade:** **P0**

---

## 2.4 `Dashboard.jsx`

- **Arquivo:** `goldeouro-admin/src/pages/Dashboard.jsx`
- **Endpoint usado indiretamente:** `dataService.getGeneralStats()` -> `GET /api/admin/stats`
- **Backend real existe?** **NÃO** (não identificado em `server-fly.js`)
- **Fallback/mock:** **SIM parcial** (`dataService` retorna métricas zeradas em erro)
- **Inconsistência de contrato:** tela declara “dados reais”, mas serviço aplica fallback silencioso de zeros quando endpoint falha/inexiste
- **Classificação:** **MOCK + QUEBRADA**
- **Risco operacional:** **MÉDIO/ALTO**
- **Prioridade:** **P1**

---

## 2.5 `Users.jsx`

- **Arquivo:** `goldeouro-admin/src/pages/Users.jsx`
- **Endpoint usado:** `POST /admin/usuarios`
- **Backend real existe?** **NÃO**
- **Fallback/mock:** **PARCIAL** (não injeta array mock, mas mantém fluxo com dados vazios e mensagem genérica)
- **Inconsistência de contrato:** espera campos (`name`, `status`, `balance`, `createdAt`) não casados com padrão observado em backend real atual
- **Classificação:** **QUEBRADA**
- **Risco operacional:** **MÉDIO**
- **Prioridade:** **P1**

---

## 3) Comparação específica com saque manual real

Fluxo real de saque manual no backend:

- `POST /api/admin/withdraw/approve` (existe)
- `POST /api/admin/withdraw/cancel` (existe)

Situação no painel:

- páginas analisadas de saque usam **listagens legacy** (`/admin/relatorio-saques`)
- não foi identificado consumo direto dos endpoints reais de approve/cancel nessas páginas

### Existe endpoint de LISTAGEM REAL de saques admin no backend principal?

- **Não identificado** no `server-fly.js` ativo para o contrato usado pelas telas analisadas.

---

## 4) Resumo executivo por página

| Página | Endpoint principal | Status |
|---|---|---|
| `SaqueUsuarios.jsx` | `POST /admin/relatorio-saques` | **MOCK/QUEBRADA** |
| `RelatorioSaques.jsx` | `POST /admin/relatorio-saques` | **QUEBRADA** |
| `RelatorioFinanceiro.jsx` | `POST /admin/relatorio-financeiro` | **MOCK/QUEBRADA** |
| `Dashboard.jsx` | `GET /api/admin/stats` | **MOCK/QUEBRADA** |
| `Users.jsx` | `POST /admin/usuarios` | **QUEBRADA** |

---

## 5) Risco operacional e prioridade

- **Módulo Saques/Financeiro:** risco **ALTO**, prioridade **P0**
- **Módulo Dashboard:** risco **MÉDIO/ALTO**, prioridade **P1**
- **Módulo Usuários (Users.jsx):** risco **MÉDIO**, prioridade **P1**

---

## 6) GO/NO-GO por módulo

- **Auth do painel:** **GO** (já funcional com JWT real)
- **Dados de Saques/Financeiro no painel:** **NO-GO**
- **Dashboard de métricas reais:** **NO-GO**
- **Tela `Users.jsx` para operação real:** **NO-GO**

---

## 7) Conclusão geral

O painel está autenticando corretamente, mas o consumo de dados administrativos permanece majoritariamente em contrato legado/mocks para as telas analisadas.  
Para operação real segura, é necessário alinhar essas páginas ao contrato backend efetivamente exposto em produção.

---

**Fim do diagnóstico.**
