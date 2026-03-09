# RELATÓRIO READ-ONLY — DIFERENÇAS PR #29 (3ae3786) vs ESTÁVEL (FyKKeg6zb)

**Objetivo:** Identificar alterações entre main@PR29 e estado estável, mapear /pagamentos (Saldo atual, origem do saldo) e gerar checklist de validação e causas prováveis para "saldo 0.00".  
**Regras:** Apenas leitura; nenhuma alteração de código.  
**Data:** 2026-02-06.

---

## 1. Referências de commit e “estável”

| Ref | Descrição |
|-----|-----------|
| **main@3ae3786** | Merge do PR #29 (`feat/payments-ui-pix-presets-top-copy`). Commit atual de `origin/main`. |
| **FyKKeg6zb** | ID de **deploy na Vercel** (não é SHA git). Documentado como “deploy considerado válido em produção” no pós-rollback. Build associado: **16 Jan 2026** (Last-Modified do HTML/JS em produção), assets `index-qIGutT6K.js` e `index-lDOJDUAS.css`. |
| **Estável (git)** | Por não existir ref git para FyKKeg6zb, o **commit estável de referência** usado para diff é **d8ceb3b** (`chore: checkpoint pre-v1 stable`, 2026-02-05). É o checkpoint explícito “pre-v1 stable” antes da sequência do PR #29. Commits de 16 Jan 2026 não aparecem no histórico consultado; o build de 16 Jan na Vercel pode corresponder a um deploy a partir de main na época (ex.: 0a2a5a1 ou anterior). |

**Resumo:**  
- **Diff abaixo:** `d8ceb3b` (estável) → `3ae3786` (PR #29).  
- **FyKKeg6zb** = deploy Vercel estável (build 16 Jan); equivalência exata com SHA não verificada neste relatório.

---

## 2. Arquivos que mudaram entre estável (d8ceb3b) e PR #29 (3ae3786)

Lista completa (apenas nomes; sem alterar código):

```
.gitignore
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-implementacao-frontend.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-precheck-saldo-para-jogar-READONLY.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-verificacao-producao-readonly.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-3-highlight-recarregar-frontend.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-4-robustez-gatilho-sem-string.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE-payments-ui-pix-presets-top-copy-2026-02-05.md
docs/relatorios/RELEASE-CHECKPOINT/CHANGE2-CHANGE3-versionamento-e-rollback.md
docs/relatorios/RELEASE-CHECKPOINT/DEPLOY-AUDIT-PLAYER-readonly.md
docs/relatorios/RELEASE-CHECKPOINT/DOCS-FINAL-CLEANUP-2026-02-06.md
docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-CHANGE2-CHANGE3-readonly.md
docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-GLOBAL-READONLY.md
docs/relatorios/RELEASE-CHECKPOINT/GIT-GLOBAL-PENDING-AUDIT-readonly.md
docs/relatorios/RELEASE-CHECKPOINT/PR-PREP-MAIN-2026-02-06.md
docs/relatorios/RELEASE-CHECKPOINT/PR29-AUDIT-FIX-2026-02-06.md
docs/relatorios/RELEASE-CHECKPOINT/PRECHECK-2026-02-05-2224.md
docs/relatorios/RELEASE-CHECKPOINT/PROTOCOLO-MUDANCAS-V1.md
docs/relatorios/RELEASE-CHECKPOINT/RELEASE-HYGIENE-TAGS-DOCS-2026-02-06.md
goldeouro-player/package-lock.json
goldeouro-player/package.json
goldeouro-player/src/pages/GameShoot.jsx
goldeouro-player/src/pages/Pagamentos.jsx
goldeouro-player/src/services/gameService.js
server-fly.js
```

**Arquivos com impacto direto em /pagamentos e saldo:**

- **goldeouro-player/src/pages/Pagamentos.jsx** — UI de Pagamentos PIX, presets, bloco PIX no topo, **remoção do bloco “Saldo atual” no header** (no PR #29).
- **goldeouro-player/src/pages/GameShoot.jsx** — Mensagens/UX ao jogar sem saldo e navegação para /pagamentos.
- **goldeouro-player/src/services/gameService.js** — Lógica de saldo/jogo.
- **server-fly.js** — Backend (perfil, PIX, saques); não altera contrato do profile para “balance” (veja seção 3).

---

## 3. Mapeamento de /pagamentos: “Saldo atual”, origem do saldo, default e quando vira 0.00

### 3.1 Onde a rota /pagamentos é definida e o que renderiza

- **Rota:** `App.jsx`: `<Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />`.
- **Componente:** `goldeouro-player/src/pages/Pagamentos.jsx`.

### 3.2 Onde “Saldo atual” era/são exibidos

| Versão | Onde aparece “Saldo atual” |
|--------|----------------------------|
| **Estável (d8ceb3b)** | No **header** da página Pagamentos, à direita (ao lado do botão “← Voltar”): label “Saldo atual” e valor “R$ {saldo.toFixed(2)}”. Trecho removido no PR #29: `<div className="text-right"><p className="text-sm text-gray-500">Saldo atual</p><p className="text-2xl font-bold text-green-600">R$ {saldo.toFixed(2)}</p></div>`. |
| **PR #29 (3ae3786)** | Esse bloco foi **removido** da página Pagamentos (documentado em CHANGE-payments-ui-pix-presets-top-copy-2026-02-05.md). O estado `saldo` e a chamada que carrega o saldo continuam no componente; apenas a exibição no header foi retirada. Em outras telas (Dashboard, Profile, GameShoot, Withdraw) o saldo continua sendo exibido com base em seus próprios requests ao perfil. |

Ou seja: em **main atual**, em **/pagamentos** não há mais o texto “Saldo atual” na UI; o saldo ainda é carregado em memória no componente (e usado apenas em lógica/toast), mas não é mostrado no header.

### 3.3 De onde vem o saldo em /pagamentos

- **Endpoint:** `GET /api/user/profile` (constante `API_ENDPOINTS.PROFILE` = `/api/user/profile`).
- **Chamada:** Em `Pagamentos.jsx`, dentro de `carregarDados()`:
  - `const response = await apiClient.get(API_ENDPOINTS.PROFILE);`
  - `setSaldo(response.data.balance || 0);`
- **Backend (server-fly.js):** A rota `/api/user/profile` retorna:
  - `res.json({ success: true, data: { id, email, username, nome, **saldo**, tipo, total_apostas, total_ganhos, created_at, updated_at } });`
  - Ou seja: o backend envia o saldo em **`data.saldo`**; **não** envia `balance` em lugar nenhum.

**Consequência crítica:**  
O frontend em Pagamentos usa **`response.data.balance`**. No axios, `response.data` é o corpo da resposta, ou seja `{ success: true, data: { saldo, ... } }`. Não existe `response.data.balance`; o valor correto é **`response.data.data.saldo`**.  
Portanto: **em /pagamentos, `response.data.balance` é sempre `undefined`**, e `setSaldo(undefined || 0)` resulta em **saldo sempre 0.00** naquele componente, independentemente do saldo real no backend.

- **Store / localStorage:** Nenhum store global (Redux etc.) foi consultado para este relatório. O componente não usa localStorage para saldo; usa apenas estado local `saldo` preenchido pela chamada ao profile.
- **Fallback:** O único fallback é o operador `|| 0` na linha acima; como `response.data.balance` é undefined, o fallback é **sempre** 0.

**Comparação com outras telas (que exibem saldo corretamente):**

- **Dashboard.jsx:** `setBalance(profileResponse.data.data.saldo || 0)` — usa **data.data.saldo**.
- **Profile.jsx:** `balance: userData.saldo || 0` com `userData = response.data.data` — usa **data.data.saldo**.

Ou seja: a causa provável de “saldo 0.00” **na página /pagamentos** (quando ainda existia o bloco “Saldo atual”) é o **uso de `response.data.balance` em vez de `response.data.data.saldo`** em `Pagamentos.jsx`.

### 3.4 Default e quando o valor vira 0.00

- **Estado inicial no componente:** `const [saldo, setSaldo] = useState(0);` → default de exibição é **0**.
- **Quando passa a ser 0.00 na prática:**
  1. **Sempre em PR #29 (e já no estável), na página Pagamentos:** porque o código usa `response.data.balance`, que não existe na resposta do backend, então o valor efetivo é sempre o fallback **0**.
  2. Erro na chamada a `GET /api/user/profile` (rede, 4xx/5xx): o `catch` não chama `setSaldo`; o estado permanece no valor inicial **0**.
  3. Backend retorna usuário sem saldo (`data.saldo === null` ou `0`): se no futuro a página for corrigida para usar `response.data.data.saldo`, aí sim o valor exibido seria 0 quando o backend realmente devolver 0 ou null.

---

## 4. Checklist de validação manual (saldo e /pagamentos)

- [ ] **Login** com usuário que tem saldo > 0 no backend (confirmar em `usuarios.saldo` ou em outra tela que use `data.data.saldo`, ex.: Dashboard).
- [ ] **Dashboard:** conferir se o saldo exibido (R$ X,XX) bate com o saldo do usuário no backend.
- [ ] **Acessar /pagamentos** (com usuário logado).
- [ ] **Antes (se comparar com build estável com “Saldo atual” no header):** verificar se “Saldo atual” em /pagamentos mostra 0.00 mesmo com saldo > 0 no backend (reproduzindo o bug do `response.data.balance`).
- [ ] **Depois (build PR #29):** confirmar que o header de /pagamentos não exibe mais “Saldo atual” (comportamento esperado pela remoção do bloco).
- [ ] **Network:** em /pagamentos, inspecionar `GET /api/user/profile`; confirmar que o body tem `data.saldo` e que não existe `balance` no primeiro nível de `response.data`.
- [ ] **Console:** em /pagamentos, verificar se há erros (Error Boundary, “Ops! Algo deu errado”) ou avisos relacionados a perfil/saldo.
- [ ] **Fluxo PIX:** criar um PIX, aprovar no MP, verificar se em Dashboard ou outra tela o saldo atualiza; em /pagamentos (se no futuro o saldo voltar a ser exibido com fonte correta) conferir se atualiza após recarregar.

---

## 5. Causas prováveis para “saldo 0.00”

| # | Causa | Onde verificar | Observação |
|---|--------|----------------|------------|
| 1 | **Uso de `response.data.balance` em Pagamentos.jsx** (backend envia apenas `data.saldo`) | `Pagamentos.jsx` → `carregarDados()` → `setSaldo(response.data.balance \|\| 0)` | **Causa mais provável** para a página /pagamentos exibir sempre 0.00. Corrigir lendo `response.data.data.saldo` (como em Dashboard e Profile). |
| 2 | **Erro na chamada GET /api/user/profile** (timeout, 401, 503, rede) | Aba Network; resposta e status da requisição | O `catch` não atualiza `saldo`; o estado permanece 0. |
| 3 | **Usuário realmente com saldo 0 ou null no backend** | Tabela `usuarios`, coluna `saldo` | Se a fonte do saldo for corrigida (item 1), aí sim 0.00 refletiria o dado real. |
| 4 | **Token inválido/expirado** | localStorage `authToken`; status 401 no profile | Pode levar a erro e estado de saldo não atualizado (0). |
| 5 | **Cache do apiClient** (requestCache) servindo resposta antiga sem `data` completo | `utils/requestCache.js`; interceptor em `apiClient` | Improvável como causa única de 0.00; mas se a resposta em cache tiver estrutura diferente, pode afetar. |
| 6 | **Build/CDN desatualizado** (usuário com JS antigo) | Hash do `<script src="/assets/index-*.js">` no DOM vs deployment esperado | Pode misturar comportamentos de versões (ex.: estável vs PR #29). |

---

## 6. Resumo executivo

- **Diff de referência:** estável **d8ceb3b** → PR #29 **3ae3786**. **FyKKeg6zb** é o deploy Vercel estável (build 16 Jan 2026); equivalente git usada para diff: d8ceb3b.
- **Arquivos relevantes para /pagamentos e saldo:** `Pagamentos.jsx`, `GameShoot.jsx`, `gameService.js`, `server-fly.js` (lista completa na seção 2).
- **“Saldo atual”:** No estável, aparecia no header de /pagamentos; no PR #29 esse bloco foi **removido**. O saldo continua sendo carregado no componente, mas a origem está **incorreta** (`response.data.balance` em vez de `response.data.data.saldo`), então mesmo antes da remoção o valor exibido seria 0.00.
- **Origem do saldo em /pagamentos:** endpoint `GET /api/user/profile`; backend retorna `data.saldo`; frontend em Pagamentos usa `response.data.balance` (errado) e faz fallback para 0.
- **Causa provável de “saldo 0.00” na página Pagamentos:** uso de `response.data.balance` em `Pagamentos.jsx` (backend não envia `balance`).  
**Sugestão de correção (apenas documental; sem alterar código neste relatório):** em `carregarDados()` de `Pagamentos.jsx`, usar `response.data.data?.saldo ?? 0` (ou equivalente) em vez de `response.data.balance || 0`.

---

*Relatório read-only. Nenhuma alteração foi feita no código.*
