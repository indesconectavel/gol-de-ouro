# Auditoria Hotfix Withdraw em Produção (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** READ-ONLY absoluto (nenhum arquivo do repositório alterado; nenhum comando destrutivo).  
**Objetivo:** Validar com evidências que o hotfix `hotfix/withdraw-real-endpoints` está no Git e definir como provar no bundle/runtime que o fluxo de saque chama os endpoints reais do Fly sem afetar depósitos PIX.

---

## 1. Resumo executivo

- **Patch no Git:** O commit `8f4dec1` na branch `hotfix/withdraw-real-endpoints` contém o patch: novo `withdrawService.js`, alterações em `Withdraw.jsx` (usa `withdrawService.requestWithdraw`/`getWithdrawHistory`) e em `api.js` (+`WITHDRAW_REQUEST`, +`WITHDRAW_HISTORY`). A tela de saque **não** chama mais `createPix` para solicitar saque.
- **Depósitos:** O commit **não** altera `paymentService.js`, `Pagamentos.jsx` nem `apiClient.js`; depósitos PIX continuam usando `/api/payments/pix/*`.
- **Produção/Preview:** Para afirmar que o hotfix está no bundle servido pela Vercel, é necessário validar na **Network** (e, opcionalmente, no JS do bundle) conforme os checklists abaixo. Este relatório não altera ambiente nem executa deploy.
- **“Saldo voltou”:** O backend debita o saldo **no request** (POST `/api/withdraw/request`); GET `/api/user/profile` deve refletir o novo saldo. Se o saldo “volta” após sucesso na UI, as causas possíveis estão na matriz de hipóteses e na árvore de decisão (bundle antigo, cache, rollback, token/perfil errado).

---

## 2. Evidências Git (Patch no repositório)

### 2.1 Comandos de inspeção executados

```text
# Estado e branch
git status
git branch --show-current
git log -1 --oneline hotfix/withdraw-real-endpoints
git show hotfix/withdraw-real-endpoints --name-only

# Provar conteúdo do patch
git show HEAD:goldeouro-player/src/services/withdrawService.js
git show HEAD:goldeouro-player/src/config/api.js | rg "WITHDRAW_REQUEST|WITHDRAW_HISTORY"
git show HEAD:goldeouro-player/src/pages/Withdraw.jsx | rg "withdrawService|requestWithdraw|getWithdrawHistory"
git show HEAD:goldeouro-player/src/pages/Withdraw.jsx | rg "createPix\("

# Provar depósitos intactos (arquivos não no commit + conteúdo inalterado)
git show HEAD:goldeouro-player/src/pages/Pagamentos.jsx | rg "/api/payments/pix"
git show HEAD:goldeouro-player/src/services/paymentService.js | rg "createPix|getUserPix|/api/payments/pix"
```

### 2.2 Resultados (resumidos)

| Verificação | Resultado |
|-------------|-----------|
| **git status** | Branch `hotfix/withdraw-real-endpoints`, up to date com origin; apenas untracked em `docs/relatorios/`. |
| **git branch --show-current** | `hotfix/withdraw-real-endpoints` |
| **git log -1 hotfix/withdraw-real-endpoints** | `8f4dec1 fix(withdraw): use real withdraw endpoints and reload profile` |
| **git show --name-only** | Apenas 3 arquivos: `goldeouro-player/src/config/api.js`, `goldeouro-player/src/pages/Withdraw.jsx`, `goldeouro-player/src/services/withdrawService.js` |
| **withdrawService.js no commit** | Existe; contém `requestWithdraw`, `getWithdrawHistory`, `API_ENDPOINTS.WITHDRAW_REQUEST`, `API_ENDPOINTS.WITHDRAW_HISTORY`, POST `/api/withdraw/request`, GET `/api/withdraw/history`. |
| **api.js WITHDRAW_** | `WITHDRAW_REQUEST: \`/api/withdraw/request\`,` e `WITHDRAW_HISTORY: \`/api/withdraw/history\`` |
| **Withdraw.jsx withdrawService** | Linhas com `import withdrawService`, `withdrawService.getWithdrawHistory()`, `withdrawService.requestWithdraw({` |
| **Withdraw.jsx createPix(** | **0 ocorrências** (saque não usa mais createPix) |
| **Pagamentos.jsx /api/payments/pix** | Continua usando `apiClient.post('/api/payments/pix/criar', ...)` |
| **paymentService.js** | Continua com `createPix`, `getUserPix`, endpoints `pix/criar`, `pix/status`, `pix/usuario` (não modificado pelo commit) |
| **apiClient.js no commit** | **Não** está em `--name-only` do commit; nenhuma alteração no hotfix. |

**Conclusão:** O patch está presente e isolado no Git; depósitos PIX não foram alterados por este commit.

---

## 3. Checklist de evidência “Patch no Bundle” (validação em produção/preview)

### 3.1 Guia DevTools Network (sem depender de console)

Abra o site (produção ou preview da Vercel) → DevTools (F12) → aba **Network** → filtro **Fetch/XHR**. Limpe a lista (ícone 🚫) e siga os passos abaixo.

**Ao abrir a página /withdraw (LOAD):**

| # | O que verificar | Esperado |
|---|------------------|----------|
| 1 | Requisições ao carregar a tela | Pelo menos **GET** para `.../api/user/profile` (saldo). |
| 2 | Requisição de histórico | **GET** para `.../api/withdraw/history`. |
| 3 | Host | Ambas para o mesmo host do backend (ex.: `https://goldeouro-backend-v2.fly.dev`). |

**Ao clicar em “Solicitar Saque” (SUBMIT):**

| # | O que verificar | Esperado |
|---|------------------|----------|
| 4 | Requisição de saque | **POST** para `.../api/withdraw/request` com body contendo `valor`, `chave_pix`, `tipo_chave`. |
| 5 | Após sucesso na UI | Novo **GET** para `.../api/user/profile` e novo **GET** para `.../api/withdraw/history` (reload de saldo e histórico). |
| 6 | O que NÃO deve aparecer ao solicitar saque | **Nenhum POST** para `.../api/payments/pix/criar` no momento do clique em “Solicitar Saque”. (POST para pix/criar é só na tela de **Depósito**.) |

**Como confirmar que o bundle é o novo (hotfix):**

1. Na aba **Network**, localize o arquivo JS principal do app (ex.: `assets/index-XXXXX.js` ou `index-[hash].js`).
2. Clique no nome do arquivo → aba **Response** (ou **Preview**).
3. Use Ctrl+F (ou Cmd+F) e busque:
   - **`/api/withdraw/request`** OU
   - **`withdrawService`**
4. **Se encontrar:** o bundle contém o código do hotfix (chamadas ao endpoint real de saque).  
5. **Se não encontrar** e ainda aparecer POST para `/api/payments/pix/criar` ao solicitar saque: o bundle é antigo ou há cache (Service Worker / CDN). Teste em aba anônima ou com “Disable cache” e, se existir SW, Application → Service Workers → Unregister.

---

## 4. Checklist de evidência “Backend debitou saldo”

Com base no contrato do backend (CONTRATO-ENDPOINTS-WITHDRAW-BACKEND-2026-02-28.md):

- O saldo é **debitado no request**: no handler do POST `/api/withdraw/request` o backend faz update em `usuarios.saldo` (e `updated_at`) **antes** de inserir em `saques`. GET `/api/user/profile` lê esse mesmo `usuarios` e deve refletir o saldo já debitado.
- O payout/worker/webhook apenas **atualizam status** do saque; em falha pode haver **rollback** (devolução do saldo).

**Os 3 responses (JSON) que você deve copiar do DevTools para comprovar:**

| # | Requisição | Onde copiar | O que guardar (para análise) |
|---|------------|-------------|-------------------------------|
| **i)** | **POST** `/api/withdraw/request` | Network → clique na linha do POST → aba **Response** | JSON completo da resposta (ex.: `{ "success": true, "data": { ... }, "message": "..." }`). Confirmar `success === true` e, se houver, `data.id` ou `data.correlation_id`. |
| **ii)** | **GET** `/api/user/profile` | Network → linha do GET profile (o **último** após o saque, se houver reload) → **Response** | JSON completo. Conferir `data.data.saldo` (valor numérico). Esse valor deve ser **saldo anterior − valor do saque** (e, se houver taxa, após dedução da taxa conforme regra do backend). |
| **iii)** | **GET** `/api/withdraw/history` | Network → linha do GET history (o **último** após o saque) → **Response** | JSON completo. Conferir `data.data.saques` (array). Deve existir um item com o saque recém-criado (valor, status ex.: `pendente` ou `aguardando_confirmacao`, `created_at`). |

**Importante:** Não incluir no relatório tokens nem dados sensíveis; se precisar anexar evidência, mascarar Bearer token e dados pessoais (CPF, e-mail, etc.).

---

## 5. Diagnóstico do “Saldo voltou”

**Por que o “saldo Mercado Pago” não deveria afetar o saldo do jogo:**  
O saldo exibido na tela de saque vem de **GET /api/user/profile**, que lê a tabela **usuarios** (Supabase). O débito ocorre **no request** (POST /api/withdraw/request). O Mercado Pago (payout/webhook) só atualiza o **status** do saque; em caso de falha no payout, o backend pode fazer **rollback** (devolver o saldo em `usuarios`). Ou seja: se o saldo “volta”, pode ser rollback, ou o front não estar chamando o backend correto, ou perfil/token incorreto.

**Árvore de decisão com base nos 3 responses:**

```
1) POST /api/withdraw/request NEM APARECE na Network ao clicar em "Solicitar Saque"
   → Causa provável: bundle antigo, cache (SW/CDN) ou CORS bloqueando.
   → Ação: Validar bundle (buscar /api/withdraw/request ou withdrawService no index-*.js);
            testar em aba anônima / Disable cache; verificar se há SW.

2) POST aparece e Response tem success: true, mas GET /api/user/profile (após o saque) mostra saldo IGUAL ao anterior
   → Causa provável: bug no backend (débito não persistiu), rollback após request, concorrência (outra operação creditou),
      ou token/usuário diferente entre request e profile.
   → Ação: Comparar userId (ou id no profile) com o usuário logado; conferir GET /api/withdraw/history se o saque aparece;
            revisar logs do backend (Fly) para o correlation_id do request.

3) GET /api/withdraw/history mostra o saque como pendente/processado, mas GET /api/user/profile ainda mostra saldo “antigo” (voltou)
   → Causa provável: rollback do saque (worker/webhook devolveu o saldo) ou profile retornando dado em cache/origem errada.
   → Ação: Verificar no backend se houve rollback (status do saque, logs do worker/webhook);
            confirmar que o profile não está sendo servido por cache (request direto ao Fly).
```

---

## 6. Matriz de hipóteses (“Saldo voltou”)

| Hipótese | Descrição | Como verificar |
|----------|-----------|----------------|
| **(A) Bundle em produção ainda antigo** | O deploy não inclui o hotfix; o front chama createPix (depósito) em vez de withdraw/request. | Network: não aparece POST para `/api/withdraw/request`; aparece POST para `/api/payments/pix/criar` ao solicitar saque. Ou: no `assets/index-*.js` não existe `/api/withdraw/request` nem `withdrawService`. |
| **(B) Backend não debitou** | POST retornou 200/success mas o update de saldo falhou (ex.: condição de concorrência). | Response (i) success true; Response (ii) saldo inalterado. Conferir logs do Fly e tabela usuarios/saques. |
| **(C) Rollback do saque** | Débito ocorreu; depois worker ou webhook falhou e executou rollback (devolução do saldo). | Response (iii) pode mostrar saque com status de falha ou rollback. Backend: logs do worker e do webhook Mercado Pago. |
| **(D) Perfil/token errado** | GET profile retorna saldo de outro usuário ou sessão (token/cache). | Comparar id/userId no body do POST request com o `data` do GET profile; garantir mesmo token em todas as requisições. |

---

## 7. Próximos passos recomendados (segurança)

1. **Testar em preview do hotfix**  
   Fazer deploy de **preview** na Vercel a partir da branch `hotfix/withdraw-real-endpoints` (ou abrir o PR e usar o link de preview). Não fazer merge em `main` antes de validar.

2. **Validação em preview**  
   - Aba **anônima** ou perfil de teste.  
   - Executar o checklist da seção 3 (Network: GET profile, GET history no load; POST withdraw/request no submit; sem POST pix/criar no saque).  
   - Opcional: confirmar no bundle (seção 3.1) que `assets/index-*.js` contém `/api/withdraw/request` ou `withdrawService`.  
   - Copiar os 3 responses (seção 4) e conferir: POST success, profile com saldo debitado, history com o saque.

3. **Depósitos**  
   Na tela de **Depósitos/Pagamentos**, confirmar que ainda aparecem POST para `/api/payments/pix/criar` e GET para `/api/payments/pix/usuario`; nenhuma chamada a `/api/withdraw/request` ou `/api/withdraw/history` nessa tela.

4. **Merge para produção**  
   Só após a validação em preview: merge do PR `hotfix/withdraw-real-endpoints` em `main` (ou branch de produção) e deploy. Após o deploy, repetir o checklist em produção e, se o usuário reportar “saldo voltou”, usar a árvore de decisão e a matriz de hipóteses com os 3 responses.

5. **Service Worker / cache**  
   Se após o merge o comportamento for inconsistente, pedir ao usuário (ou testar) com “Disable cache” e recarregar; ou Application → Service Workers → Unregister e recarregar, para descartar cache de bundle antigo.

---

## 8. Comandos usados (referência)

```bash
git status
git branch --show-current
git log -1 --oneline hotfix/withdraw-real-endpoints
git show hotfix/withdraw-real-endpoints --name-only
git show HEAD:goldeouro-player/src/services/withdrawService.js
git show HEAD:goldeouro-player/src/config/api.js | rg "WITHDRAW_REQUEST|WITHDRAW_HISTORY"
git show HEAD:goldeouro-player/src/pages/Withdraw.jsx | rg "withdrawService|requestWithdraw|getWithdrawHistory"
git show HEAD:goldeouro-player/src/pages/Withdraw.jsx | rg "createPix\("
git show HEAD:goldeouro-player/src/pages/Pagamentos.jsx | rg "/api/payments/pix"
git show HEAD:goldeouro-player/src/services/paymentService.js | rg "createPix|getUserPix|/api/payments/pix"
```

Nenhum comando de escrita (commit, push, checkout de branch que descarte alterações, etc.) foi executado. Nenhum arquivo do repositório foi alterado; apenas criado este relatório em `docs/relatorios/`.
