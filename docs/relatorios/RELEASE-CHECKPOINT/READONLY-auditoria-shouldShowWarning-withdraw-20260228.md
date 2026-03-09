# Auditoria READ-ONLY: shouldShowWarning + saque PIX 500

**Data:** 2026-02-28  
**Escopo:** goldeouro-player (apenas leitura; deploy estável FyKKeg6zb não será tocado).  
**Objetivo:** Mapear causas do spam no console (`gn.shouldShowWarning is not a function`) e do POST /api/withdraw/request → 500, com evidências arquivo/linha e plano de correção sem execução.

---

## 1) Resumo executivo

- **Console:** O erro "Uncaught TypeError: gn.shouldShowWarning is not a function" ocorre porque o componente **VersionWarning** chama três métodos do **VersionService** que **não existem** na classe: `shouldShowWarning()`, `getWarningMessage()` e `getVersionInfo()`. O serviço foi implementado com outra API (verificação de compatibilidade com cache e intervalo periódico), mas o componente nunca foi ajustado. O `gn` no bundle é o export default do versionService (nome minificado). Um **setInterval de 1 segundo** no VersionWarning repete a chamada a `shouldShowWarning()` e gera o spam em todas as rotas (incluindo /game e /withdraw), pois o componente está montado no App.jsx.
- **Saque 500:** O frontend chama corretamente POST /api/withdraw/request via **withdrawService** e **apiClient**; baseURL vem de **environments.js** (produção: goldeouro-backend-v2.fly.dev). O código 500 é do **backend**; no frontend o erro é tratado de forma genérica: mostra `err.response?.data?.message` ou "Erro ao processar saque". Não há vazamento de stack nem detalhes técnicos na UI.
- **Produção FyKKeg6zb:** Confirmada referência em docs/relatorios e RELEASE-CHECKPOINT; esta auditoria não altera código, branch, commit ou deploy; é somente leitura.

---

## 2) Evidências do bug shouldShowWarning

### 2.1 Arquivo/linha e trecho relevante

**Chamada que quebra (caller):**  
`goldeouro-player/src/components/VersionWarning.jsx`

```jsx
  useEffect(() => {
    checkVersionCompatibility();
    versionService.startPeriodicCheck();
    const interval = setInterval(() => {
      if (versionService.shouldShowWarning()) {   // ← LINHA 19: método não existe
        setShowWarning(true);
        setWarningMessage(versionService.getWarningMessage());   // ← 21: não existe
        setVersionInfo(versionService.getVersionInfo());         // ← 22: não existe
      } else {
        setShowWarning(false);
        setWarningMessage('');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
```

**Definição do serviço (sem os métodos chamados):**  
`goldeouro-player/src/services/versionService.js`

- **Linhas 4–117:** Classe `VersionService` com: `checkVersionCompatibility`, `clearCache`, `getCacheStats`, `checkCompatibility`, `startPeriodicCheck`, `stopPeriodicCheck`.
- **Não existe:** `shouldShowWarning`, `getWarningMessage`, `getVersionInfo`.
- **Linhas 122–125:** Instância global e export default:
  - `const versionService = new VersionService();`
  - `export default versionService;`

O bundler (Vite) minifica o export default; em runtime o objeto pode aparecer como `gn` (ou outro nome). A chamada `gn.shouldShowWarning()` falha porque o método não existe na classe.

### 2.2 Fluxo que gera o erro

1. **App.jsx** (linha 32) renderiza `<VersionWarning />` dentro do Router, então o componente está montado em **todas** as rotas (/, /dashboard, /game, /withdraw, etc.).
2. No **mount**, VersionWarning executa o `useEffect` (linhas 10–29): chama `checkVersionCompatibility()`, inicia `versionService.startPeriodicCheck()` e cria um **setInterval(..., 1000)**.
3. A cada **1 segundo** o intervalo chama `versionService.shouldShowWarning()`. Como o método não existe, lança **TypeError: ... is not a function**.
4. O intervalo **não é interrompido** pelo erro (apenas a execução do callback falha); o próximo tick repete o erro → **spam** no console.
5. O cleanup `return () => clearInterval(interval)` existe, então ao desmontar o componente o intervalo para; mas enquanto qualquer rota estiver ativa o componente permanece montado e o spam continua.

### 2.3 Origem de "gn" e possível mismatch de export

- **gn:** Nome minificado do **export default** de `versionService.js` (objeto único exportado). Não há outro módulo com nome parecido envolvido; o import em VersionWarning é `import versionService from '../services/versionService'`, que é o mesmo objeto.
- **Export:** Há apenas **default export** em versionService.js; VersionWarning usa default import. Não há mismatch default vs named entre esses dois arquivos.
- **Conclusão:** O problema é **API incompleta**: o componente espera uma interface (shouldShowWarning, getWarningMessage, getVersionInfo) que o serviço nunca implementou. Possível refatoração antiga em que a classe perdeu esses métodos ou o componente foi escrito para uma API planejada e não implementada.

---

## 3) Evidências do fluxo de saque PIX (frontend)

### 3.1 Arquivo/linha do request

- **Serviço:** `goldeouro-player/src/services/withdrawService.js`  
  - **Linhas 12–30:** `requestWithdraw({ valor, chave_pix, tipo_chave })` chama `apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, { valor, chave_pix, tipo_chave })`.
- **Endpoint:** `goldeouro-player/src/config/api.js` linha 36: `WITHDRAW_REQUEST: '/api/withdraw/request'`.
- **Cliente:** `goldeouro-player/src/services/apiClient.js`: `baseURL` vem de `validateEnvironment()` (import de `../config/environments.js`). Em produção (hostname não localhost/staging) usa `environments.production.API_BASE_URL` = `https://goldeouro-backend-v2.fly.dev`. Request interceptor adiciona `Authorization: Bearer <token>` quando há `authToken` no localStorage.

### 3.2 Payload e headers esperados (a partir do código)

- **Método:** POST.  
- **URL:** `baseURL + '/api/withdraw/request'` → `https://goldeouro-backend-v2.fly.dev/api/withdraw/request`.  
- **Payload:** `{ valor: number, chave_pix: string, tipo_chave: string }` (withdrawService linhas 14–17).  
- **Headers:** `Content-Type: application/json`, `Accept: application/json`, `Authorization: Bearer <token>` (apiClient).

### 3.3 Tratamento de erro no UI

- **withdrawService.js linhas 24–29:** Em catch, monta `message = err.response?.data?.message || err.message || 'Erro ao processar saque'` e retorna `{ success: false, message }`.
- **Withdraw.jsx linhas 101–124:** Chama `withdrawService.requestWithdraw(...)`; se `result.success` é false, faz `throw new Error(result.message || 'Erro ao processar saque')`.
- **Withdraw.jsx linhas 119–122:** No catch do handleSubmit, faz `setError(err.message || 'Erro ao processar saque')`. O usuário vê apenas essa string; não há exibição de `err.response?.data` ou stack. Ou seja: o frontend **engole** detalhes do 500 e mostra texto genérico, a menos que o backend envie `response.data.message`.

---

## 4) Matriz de risco (produção FyKKeg6zb)

| Alteração | O que poderia quebrar | Isolada e segura? |
|-----------|------------------------|--------------------|
| Adicionar `shouldShowWarning`, `getWarningMessage`, `getVersionInfo` em VersionService | Nada esperado; restaura a API que o componente já usa. | Sim, desde que a lógica retorne valores coerentes (ex.: nunca mostrar aviso se não houver regra de min version). |
| Remover/desmontar VersionWarning do App.jsx | Para o spam e qualquer aviso de versão; usuário deixa de ver o aviso (se um dia funcionar). | Sim; impacto apenas nesse componente. |
| Trocar o setInterval por checagem única no mount (sem chamar shouldShowWarning) | Elimina o spam; aviso pode não atualizar a cada 1s. | Sim. |
| Alterar tratamento de erro em Withdraw.jsx para exibir err.response?.data | Pode expor detalhes internos do backend (mensagens de erro) na UI. | Só se limitar a message/detail e não logar stack. |
| Corrigir causa do 500 no backend | Fora do escopo do player; não alterar backend nesta auditoria. | N/A (backend). |

**Conclusão:** As mudanças **isoladas e seguras** são no frontend do player: (1) implementar os três métodos em VersionService **ou** (2) remover/desabilitar o uso deles em VersionWarning (ou o próprio componente). O deploy estável FyKKeg6zb não é alterado por esta auditoria; qualquer correção deve seguir branch + preview antes de produção.

---

## 5) Plano de correção proposto (SEM EXECUTAR)

### 5.1 Patch mínimo (lista de arquivos a alterar)

**Opção A — Implementar a API esperada (recomendada para manter funcionalidade):**

1. **goldeouro-player/src/services/versionService.js**  
   - Adicionar métodos:
     - `shouldShowWarning()` → retorna boolean (ex.: com base em `versionInfo.compatible` ou em cache de aviso).
     - `getWarningMessage()` → retorna string (ex.: mensagem do último result ou fixa).
     - `getVersionInfo()` → retorna objeto com `currentVersion` e `minRequiredVersion` (ex.: a partir do versionInfo em cache ou do result de checkVersionCompatibility).
   - Garantir que o objeto retornado por `checkVersionCompatibility`/`checkCompatibility` possa alimentar esses métodos (ex.: incluir `warningMessage`, `currentVersion`, `minRequiredVersion` no retorno, se fizer sentido).

2. **Nenhum outro arquivo** obrigatório; VersionWarning já chama esses métodos.

**Opção B — Eliminar o spam sem implementar aviso:**

1. **goldeouro-player/src/components/VersionWarning.jsx**  
   - Remover o setInterval que chama `shouldShowWarning()`/`getWarningMessage()`/`getVersionInfo()` (linhas 17–26), ou substituir por checagem única usando apenas `versionService.checkCompatibility()` e o `result` já tratado (linhas 33–41), sem chamar os três métodos inexistentes.  
   - Manter, se desejado, apenas a verificação ao montar e o startPeriodicCheck (que chama checkVersionCompatibility, que existe).

### 5.2 Estratégia de branch + preview

- Criar branch a partir de `preview/withdraw-merge-97e67b2` (ou main, conforme fluxo) apenas para esse fix.
- Alterar **somente** versionService.js **ou** VersionWarning.jsx (não ambos na mesma PR se quiser mudanças mínimas).
- Deploy em **Preview** na Vercel; validar:
  - Console sem "shouldShowWarning is not a function".
  - Fluxo de saque e demais rotas sem regressão.
- Depois merge e deploy para produção, sem tocar no deploy FyKKeg6zb até que o novo build seja promovido com procedimento padrão.

### 5.3 Validações antes do deploy

- [ ] Build do player sem erros (`npm run build`).
- [ ] Console do Preview sem TypeError em shouldShowWarning/getWarningMessage/getVersionInfo.
- [ ] Login e navegação em /withdraw e /game OK.
- [ ] POST /api/withdraw/request continua sendo chamado com payload e headers corretos; tratamento de erro 500 permanece genérico na UI (ou melhorado apenas com message, sem expor stack).

---

## 6) Checklist de auditoria (tudo que foi checado)

- [x] Busca por "shouldShowWarning", "VersionService", "compatibilidade", "setInterval" + VersionService, "warning"/"banner"/"version" no código do player.
- [x] Leitura integral de `versionService.js`: lista de métodos e export default.
- [x] Leitura integral de `VersionWarning.jsx`: useEffect, setInterval 1s, chamadas a shouldShowWarning, getWarningMessage, getVersionInfo.
- [x] Confirmação de que VersionWarning está em App.jsx e montado em todas as rotas.
- [x] Busca por "/withdraw/request", withdrawService, apiClient e leitura de withdrawService.js, api.js, apiClient.js, config/environments.js.
- [x] Documentação do payload/headers do POST /api/withdraw/request e do tratamento de erro em Withdraw.jsx e withdrawService.
- [x] Verificação de que o 500 é do backend; frontend apenas repassa message ou texto genérico.
- [x] Histórico git (versionService.js, VersionWarning.jsx, withdrawService.js, Withdraw.jsx) e referência ao deploy FyKKeg6zb em docs/relatorios e RELEASE-CHECKPOINT.
- [x] Nenhuma edição de arquivo, branch, commit ou deploy executada; auditoria 100% read-only.

---

## Hipóteses prováveis

1. **shouldShowWarning:** O VersionService foi implementado com foco em cache e verificação periódica (`checkVersionCompatibility`), mas a API pública esperada pelo VersionWarning (shouldShowWarning, getWarningMessage, getVersionInfo) nunca foi implementada ou foi removida em algum commit (ex.: GO6 handshake), gerando o TypeError e o spam.
2. **500 no saque:** Causa no **backend** (lógica, validação, integração PIX, etc.). O frontend está correto no endpoint, payload e headers; o tratamento de erro é genérico por design.

---

## Correções mínimas sugeridas (somente sugestões)

1. **VersionService:** Implementar `shouldShowWarning()`, `getWarningMessage()` e `getVersionInfo()` de forma que:
   - Usem o cache/result existente de `checkVersionCompatibility` (e, se aplicável, retornem `currentVersion`/`minRequiredVersion` a partir do backend/meta).
   - `shouldShowWarning()` retorne `false` quando não houver regra de aviso (evita aviso indevido).
2. **Alternativa:** Em VersionWarning, remover o setInterval que chama os três métodos e usar apenas `checkCompatibility()` no mount (e opcionalmente no startPeriodicCheck), derivando showWarning/warningMessage/versionInfo do `result` retornado, sem chamar métodos inexistentes.
3. **500:** Investigar e corrigir no **backend** (fora do escopo desta auditoria do player). No frontend, opcionalmente exibir `err.response?.data?.message` ou `err.response?.data?.detail` na UI, sem expor stack ou objetos completos.
