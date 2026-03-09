# Auditoria 100% READ-ONLY — VersionWarning (spam) e Saque PIX 500

**Data:** 2026-03-02  
**Escopo:** goldeouro-player (somente leitura).  
**Produção atual (NÃO TOCADA):** FyKKeg6zb (estável). Nenhuma ação que gere deploy foi executada.

---

## 1) Contexto

- Esta auditoria é **exclusivamente de leitura**: nenhum arquivo de código foi editado, nenhuma branch criada, nenhum commit/push/merge, nenhum npm/vercel/build.
- Objetivos: (A) Causa raiz do spam no console `"gn.shouldShowWarning is not a function"` e (B) Mapear o fluxo do saque PIX e confirmar que o 500 é do backend.
- O repositório está na branch **chore/hotfix-versionwarning-spam-safe** (commit 9fe91f4). O arquivo **VersionWarning.jsx** já contém a correção aplicada anteriormente (uma única chamada a `checkCompatibility()` no mount, sem setInterval nem métodos inexistentes). A causa raiz e o comportamento **antes** do hotfix são documentados com base em evidências de código e no relatório READONLY-auditoria-shouldShowWarning-withdraw-20260228.md.

---

## 2) Provas do modo READ-ONLY

Saída dos comandos de verificação executados:

```
git rev-parse --abbrev-ref HEAD
chore/hotfix-versionwarning-spam-safe

git rev-parse HEAD
9fe91f4152f2374cc412246e63037a3e4cccaf3e

git status --porcelain
( múltiplas linhas ?? docs/relatorios/... e ?? docs/relatorios/evidencias/ )

git remote -v
origin	https://github.com/indesconectavel/gol-de-ouro.git (fetch)
origin	https://github.com/indesconectavel/gol-de-ouro.git (push)

git branch --show-current
chore/hotfix-versionwarning-spam-safe
```

**Repo “sujo”:** `git status --porcelain` retornou conteúdo (vários arquivos untracked em `docs/relatorios/` e `docs/relatorios/evidencias/`). Conforme regra, **nenhuma correção foi aplicada**; apenas registrado no relatório.

---

## 3) Seção A — Spam no console: "gn.shouldShowWarning is not a function"

### 3.1 Origem exata do erro (código atual e causa raiz histórica)

**Estado atual (após hotfix):**  
Em `goldeouro-player/src/components/VersionWarning.jsx` (L1–L40) **não há** chamadas a `shouldShowWarning`, `getWarningMessage` ou `getVersionInfo`, nem `setInterval` no componente. O `useEffect` executa uma única vez no mount e usa apenas `versionService.checkCompatibility()` (L16).

**Causa raiz do bug (comportamento anterior ao hotfix):**  
Antes da correção, o componente:

- Chamava **versionService.shouldShowWarning()**, **versionService.getWarningMessage()** e **versionService.getVersionInfo()** dentro de um **setInterval(..., 1000)** (a cada 1 segundo).
- Chamava **versionService.startPeriodicCheck()** no mount.

Trecho que gerava o erro (padrão original, referência de linhas típicas L10–L29):

```jsx
useEffect(() => {
  checkVersionCompatibility();
  versionService.startPeriodicCheck();
  const interval = setInterval(() => {
    if (versionService.shouldShowWarning()) {        // ← método inexistente → TypeError
      setShowWarning(true);
      setWarningMessage(versionService.getWarningMessage());
      setVersionInfo(versionService.getVersionInfo());
    } else { ... }
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 3.2 versionService.js — métodos existentes e ausentes

**Arquivo:** `goldeouro-player/src/services/versionService.js`

**Métodos existentes na classe VersionService (L4–117):**

- `checkVersionCompatibility()` (L13)
- `clearCache()` (L71)
- `getCacheStats()` (L78)
- `checkCompatibility()` (L88) — alias para checkVersionCompatibility
- `startPeriodicCheck(interval)` (L93)
- `stopPeriodicCheck()` (L110)

**Ausentes (nunca definidos):**

- `shouldShowWarning`
- `getWarningMessage`
- `getVersionInfo`

**Export (L120–124):**

```js
const versionService = new VersionService();
export default versionService;
```

### 3.3 App.jsx — VersionWarning global

**Arquivo:** `goldeouro-player/src/App.jsx`

- **L5:** `import VersionWarning from './components/VersionWarning'`
- **L31–L32:** Dentro de `<Router>`, antes de `<Routes>`, o componente é montado uma vez para toda a árvore:

```jsx
<div className="min-h-screen bg-slate-900">
  <VersionWarning />
  <PwaSwUpdater />
  <Routes>
    ...
    <Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />
    <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
    ...
  </Routes>
</div>
```

Conclusão: **VersionWarning está montado globalmente** em todas as rotas (/, /game, /withdraw, etc.).

### 3.4 Hipótese do "gn"

- No bundle de produção (Vite/build), o **export default** de um módulo é minificado e pode ser referido por um nome curto (ex.: `gn`).
- O único objeto exportado de `versionService.js` é a instância `versionService`. Portanto, **"gn"** no erro do console corresponde a essa instância minificada.
- A mensagem `gn.shouldShowWarning is not a function` indica que o código está chamando `.shouldShowWarning()` em cima do export default do versionService, método que não existe na classe.

### 3.5 Mecanismo do spam e impacto

- **Mecanismo:** Componente montado globalmente + **setInterval(1000)** no useEffect + chamada a **versionService.shouldShowWarning()** (inexistente) → a cada 1s o callback lança **TypeError** → o intervalo continua rodando → **spam** no console.
- **Impacto:** O erro se repete em qualquer rota (/, /game, /withdraw, etc.) enquanto o app estiver aberto, pois VersionWarning não é desmontado ao trocar de rota. A UI do jogo ou do saque pode parecer “estranha” ou “quebrada” por causa do console cheio de erros, mesmo que a interface em si não quebre.

### 3.6 Correções possíveis (sem executar)

- **Opção 1 (já aplicada nesta branch):** Corrigir **apenas VersionWarning.jsx** para não chamar métodos inexistentes: uma única verificação no mount com `checkCompatibility()`, sem setInterval e sem `shouldShowWarning`/`getWarningMessage`/`getVersionInfo`. Não alterar versionService.js.
- **Opção 2 (futura):** Implementar no **versionService.js** os métodos `shouldShowWarning()`, `getWarningMessage()` e `getVersionInfo()` de forma consistente com o retorno de `checkVersionCompatibility()` (ex.: usar cache/resultado existente) e manter o componente chamando esses métodos. Exige alteração em dois arquivos e testes de regressão.

---

## 4) Seção B — Saque PIX: POST /api/withdraw/request → 500

### 4.1 Fluxo do request (evidências com arquivo/linha)

| Etapa | Arquivo | Linhas | Evidência |
|-------|---------|--------|-----------|
| UI dispara saque | Withdraw.jsx | 101–106, 119–122 | handleSubmit chama withdrawService.requestWithdraw({ valor, chave_pix: formData.pixKey, tipo_chave: formData.pixType }); em erro faz setError(err.message \|\| 'Erro ao processar saque'). |
| Serviço | withdrawService.js | 12–29 | requestWithdraw faz apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, { valor, chave_pix, tipo_chave }); em catch retorna { success: false, message: err.response?.data?.message \|\| err.message \|\| 'Erro ao processar saque' }. |
| Endpoint | api.js | 36 | WITHDRAW_REQUEST: '/api/withdraw/request'. |
| BaseURL | apiClient.js | 3–6, 10 | import validateEnvironment from '../config/environments.js'; baseURL: env.API_BASE_URL. |
| Escolha do ambiente | environments.js | 47–99, 103–108 | getCurrentEnvironment() por hostname: localhost → development (API_BASE_URL 8080); staging/test → staging; senão → production (API_BASE_URL https://goldeouro-backend-v2.fly.dev). validateEnvironment() retorna esse env. |
| Headers | apiClient.js | 38–41 | Interceptor adiciona Authorization: Bearer <token> quando existe localStorage.getItem('authToken'). Content-Type e Accept já em create(). |

**Payload esperado:** `{ valor: number, chave_pix: string, tipo_chave: string }` (withdrawService.js L14–17).  
**URL final em produção/preview:** `https://goldeouro-backend-v2.fly.dev/api/withdraw/request` (baseURL de environments.production + path relativo).

### 4.2 Tratamento do erro no UI

- **withdrawService.js L24–29:** Em catch, monta `message = err.response?.data?.message || err.message || 'Erro ao processar saque'` e retorna `{ success: false, message }`.
- **Withdraw.jsx L116–122:** Se `!result.success`, lança `new Error(result.message || 'Erro ao processar saque')`; no catch do handleSubmit faz `setError(err.message || 'Erro ao processar saque')`.

Conclusão: O usuário vê **sempre uma string**: ou a `message` vinda do backend (`err.response?.data?.message`), ou a mensagem do axios, ou o fallback genérico **"Erro ao processar saque"**. Em caso de 500 sem corpo legível ou sem `data.message`, a UI mostra o texto genérico.

### 4.3 Onde o 500 acontece e conclusão

- O **código HTTP 500** é retornado pelo **servidor** (backend) que atende `POST /api/withdraw/request`. O frontend apenas recebe a resposta e trata no interceptor de resposta do apiClient e no catch de requestWithdraw.
- **Frontend está chamando o endpoint correto:** WITHDRAW_REQUEST = `/api/withdraw/request`, baseURL de produção = `https://goldeouro-backend-v2.fly.dev`, payload e headers conforme acima.
- **Evidências:** (1) Nenhum redirecionamento para outro path no fluxo de saque; (2) withdrawService usa apenas API_ENDPOINTS.WITHDRAW_REQUEST; (3) apiClient não reescreve esse path (ao contrário de /pix/usuario que é corrigido para /api/payments/pix/usuario). Para **diagnosticar a causa do 500 no backend** seria necessário inspecionar logs do servidor, stack trace e corpo da resposta (ex.: err.response?.data) no Network do navegador; esta auditoria não executa app nem acessa backend.

### 4.4 Diagrama em texto do fluxo

```
UI (Withdraw.jsx handleSubmit)
  → withdrawService.requestWithdraw({ valor, chave_pix, tipo_chave })
    → apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, payload)
      → baseURL = env.API_BASE_URL (environments.js: production = goldeouro-backend-v2.fly.dev)
      → URL final: https://goldeouro-backend-v2.fly.dev/api/withdraw/request
      → headers: Content-Type, Accept, Authorization: Bearer <token>
    ← resposta do servidor (ex.: 500 Internal Server Error)
  ← catch: message = err.response?.data?.message || err.message || 'Erro ao processar saque'
  ← return { success: false, message }
UI setError(result.message) → usuário vê mensagem ou "Erro ao processar saque"
```

---

## 5) Seção /game e relação com o spam do console

- **Rota /game:** Em App.jsx L48–51, `<Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />`. O componente renderizado é **GameShoot** (página de jogo), não Game.jsx diretamente.
- **VersionWarning:** Está em L32, **fora** das rotas, no mesmo nível do `<Routes>`, então é montado **uma vez** e permanece em todas as rotas, incluindo /game e /withdraw.
- **Embed/iframe:** Não foi feita busca exaustiva em GameShoot; a auditoria não rodou o app. Não há evidência neste relatório de embed/iframe na rota /game.
- **Conclusão:** O bug do VersionWarning (chamada a método inexistente no setInterval) **afeta todas as rotas**, pois o componente é global. Em /game o mesmo setInterval rodaria e geraria o mesmo TypeError a cada 1s, poluindo o console e podendo dar sensação de “quebra” ou “app instável” mesmo que a UI do jogo continue renderizando.

---

## 6) Matriz de risco (o que seria seguro mexer depois, sem executar nada)

| Alteração | Risco | Observação |
|-----------|--------|------------|
| Manter VersionWarning.jsx como está (após hotfix) | Baixo | Já não chama métodos inexistentes; uma verificação no mount. |
| Adicionar shouldShowWarning/getWarningMessage/getVersionInfo em versionService.js | Médio | Altera contrato do serviço; exige testes em todos os consumidores. |
| Alterar tratamento de erro em Withdraw.jsx para exibir mais detalhes do 500 | Baixo se só UI | Cuidado para não expor stack ou dados sensíveis na tela. |
| Alterar withdrawService / api.js / environments.js para fluxo de saque | Alto | Pode mudar endpoint, baseURL ou payload; impacto direto no saque. |
| Tocar em produção (FyKKeg6zb) ou fazer deploy sem validação em preview | Proibido | Não executado nesta auditoria. |

---

## 7) Plano de correção sugerido (duas opções, sem implementar)

**Opção 1 — Corrigir apenas VersionWarning.jsx (já aplicada nesta branch)**  
- Remover setInterval e chamadas a shouldShowWarning(), getWarningMessage() e getVersionInfo().  
- Fazer uma única verificação no mount com versionService.checkCompatibility().  
- Derivar exibição do aviso a partir do retorno (ex.: result.compatible === false) e mensagem fallback ("Atualize para continuar.").  
- Não alterar versionService.js.  
- **Vantagem:** Mudança mínima, um arquivo; elimina o spam e o TypeError.  
- **Desvantagem:** O aviso de versão depende apenas do formato atual de retorno de checkCompatibility (current, compatible, etc.).

**Opção 2 — Implementar os métodos no versionService (alteração futura)**  
- Em versionService.js, implementar shouldShowWarning(), getWarningMessage() e getVersionInfo() com base no cache/resultado de checkVersionCompatibility (e, se existir, em regra de versão mínima do backend).  
- Manter ou reintroduzir no VersionWarning.jsx as chamadas a esses métodos, eventualmente com um único check no mount ou com intervalo maior, **sem** setInterval de 1s.  
- **Vantagem:** API do serviço alinhada ao que o componente espera; possibilidade de reutilizar em outros lugares.  
- **Desvantagem:** Dois arquivos; mais superfície de teste; risco de regressão se o backend não expuser versão mínima.

Nenhum patch ou código foi escrito neste relatório; apenas descrição das opções.

---

## 8) Resumo

- **Modo READ-ONLY ativado.** Comandos de verificação executados; repo com arquivos untracked em docs/relatorios; nenhuma correção aplicada.
- **A (shouldShowWarning):** Causa raiz = VersionWarning chamava, a cada 1s, métodos inexistentes no versionService (shouldShowWarning, getWarningMessage, getVersionInfo). versionService exporta apenas a instância e não define esses métodos. "gn" = export default minificado. Spam em todas as rotas por componente global + setInterval. Na branch atual o componente já está corrigido (apenas checkCompatibility no mount).
- **B (Saque 500):** Fluxo mapeado de Withdraw.jsx → withdrawService → apiClient → environments (baseURL produção) → POST /api/withdraw/request. Payload e headers documentados. O 500 é do backend; o frontend mostra err.response?.data?.message ou texto genérico. Para diagnosticar o 500 é preciso inspecionar resposta e logs do backend.
- **/game:** Rota usa GameShoot; VersionWarning é global, portanto o spam (antes do hotfix) afetava também /game.
- **Próximos passos recomendados (sem executar):** Validar em preview o hotfix da branch chore/hotfix-versionwarning-spam-safe (console limpo, /game e /withdraw normais). Para o 500, investigar no backend (logs, corpo da resposta 500) e, se desejado, melhorar a mensagem exibida no frontend sem expor detalhes sensíveis.
