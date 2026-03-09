# Validação Runtime — Hotfix Withdraw (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** READ-ONLY (repositório não alterado; validação apenas via DevTools > Network e Response).  
**Objetivo:** Provar com evidências que o deploy (preview/produção) está servindo o bundle novo do hotfix e que o saque usa os endpoints reais, sem impactar depósitos. Tudo validável só pela aba Network e pelo conteúdo das responses; sem uso de console.

---

## 1. Evidências esperadas no Network

| Momento | Método | URL (sufixo) | Esperado |
|---------|--------|----------------|----------|
| Ao abrir /withdraw | GET | `/api/user/profile` | 200; body com `data.saldo`. |
| Ao abrir /withdraw | GET | `/api/withdraw/history` | 200; body com `data.data.saques` (array). |
| Ao clicar "Solicitar Saque" | POST | `/api/withdraw/request` | 200; body com `success: true` em sucesso. |
| Após sucesso do saque (UI) | GET | `/api/user/profile` | Novo request; saldo deve ser anterior − valor do saque (e taxa se aplicável). |
| Após sucesso do saque (UI) | GET | `/api/withdraw/history` | Novo request; array deve incluir o saque recém-criado. |
| Ao solicitar saque | POST | `/api/payments/pix/criar` | **Não** deve aparecer (esse é depósito). |

Host esperado das chamadas de API: mesmo do backend (ex.: `https://goldeouro-backend-v2.fly.dev`). Filtro na Network: **Fetch/XHR**.

---

## 2. CHECKLIST — Validação Preview (/withdraw)

Use apenas **DevTools > Network**; filtro **Fetch/XHR**. Limpe a lista (ícone de limpar) antes de cada bloco.

### 2.1 Preparação

1. Abra a URL do deploy (preview ou produção).
2. Faça login se necessário.
3. Abra DevTools (F12) → aba **Network** → selecione **Fetch/XHR**.
4. Clique em **Clear** (limpar).

### 2.2 LOAD da página /withdraw

5. Navegue para **/withdraw** (Solicitar Saque).
6. Aguarde a página carregar por completo.
7. Na lista de requests, confira:
   - [ ] Existe **GET** cujo nome ou URL contém **`/api/user/profile`**. Clique na linha → aba **Response**: deve haver JSON com `success` e `data.saldo`.
   - [ ] Existe **GET** cujo nome ou URL contém **`/api/withdraw/history`**. Clique na linha → aba **Response**: deve haver JSON com `data.data.saques` (pode ser array vazio).
8. Confirme que **não** há **POST** para **`/api/payments/pix/criar`** neste momento (só ao carregar a tela).

### 2.3 SUBMIT do saque

9. Clique em **Clear** na Network.
10. Preencha valor e chave PIX e clique em **Solicitar Saque**.
11. Aguarde a resposta da tela (sucesso ou erro).
12. Na lista de requests, confira:
    - [ ] Existe **POST** cujo nome ou URL contém **`/api/withdraw/request`**. Clique na linha → aba **Response**: copie o JSON (para diagnóstico, seção 4). Em sucesso, deve ter `success: true`.
    - [ ] Existe novo **GET** para **`/api/user/profile`** (após o POST). Clique → **Response**: copie o JSON; confira `data.saldo`.
    - [ ] Existe novo **GET** para **`/api/withdraw/history`**. Clique → **Response**: copie o JSON; confira `data.data.saques`.
13. Confirme que **não** há **POST** para **`/api/payments/pix/criar`** ao solicitar o saque (se houver, o bundle é antigo).

### 2.4 Provar que o bundle é novo

14. Na aba **Network**, localize o arquivo JS principal do app (nome do tipo **`index-*.js`** ou **`*.js`** em **assets/**).
15. Clique no nome do arquivo.
16. Abra a aba **Response** (ou **Preview**).
17. Use **Ctrl+F** (ou Cmd+F) e busque **exatamente** uma destas strings:
    - **`/api/withdraw/request`**
    - **`withdrawService`**
18. **Se encontrar** pelo menos uma: o bundle contém o hotfix (saque usa endpoints reais).
19. **Se não encontrar** e ao solicitar saque aparecer POST para `/api/payments/pix/criar`: bundle antigo ou cache; teste em aba anônima ou com "Disable cache" marcado na Network.

---

## 3. CHECKLIST — Validação Depósitos (/pagamentos)

Garante que depósitos PIX não foram impactados: a tela de depósitos continua usando apenas endpoints de pagamento PIX.

### 3.1 Preparação

1. Abra a URL do deploy.
2. DevTools > **Network** > **Fetch/XHR**; **Clear**.

### 3.2 LOAD da página /pagamentos

3. Navegue para **/pagamentos** (ou a rota da tela de Depósitos).
4. Aguarde o carregamento.
5. Confira:
   - [ ] Existe **GET** cujo URL contém **`/api/payments/pix/usuario`**. Response: JSON com dados de pagamentos/usuário PIX.
   - [ ] **Não** deve haver request para **`/api/withdraw/request`** nem para **`/api/withdraw/history`** ao carregar /pagamentos.

### 3.3 SUBMIT de depósito (criar PIX)

6. **Clear** na Network.
7. Na tela de depósitos, preencha valor (e dados se pedido) e acione o botão que **gera/cria** o PIX de depósito.
8. Confira:
   - [ ] Existe **POST** cujo URL contém **`/api/payments/pix/criar`**. Response: JSON de criação de PIX (ex.: QR code, transactionId).
   - [ ] **Não** deve haver **POST** para **`/api/withdraw/request`** ao criar depósito.

**Resumo:** Em /pagamentos devem existir **POST** `/api/payments/pix/criar` e **GET** `/api/payments/pix/usuario`; **não** devem existir **/api/withdraw/request** nem **/api/withdraw/history**.

---

## 4. Diagnóstico determinístico — “Saldo voltou”

Use **apenas** os 3 conteúdos de **Response** (JSON) copiados do Network:

| # | Request | O que copiar |
|---|---------|--------------|
| (1) | **POST** `/api/withdraw/request` | Todo o corpo da Response (JSON). |
| (2) | **GET** `/api/user/profile` | Todo o corpo da Response (último após o saque). |
| (3) | **GET** `/api/withdraw/history` | Todo o corpo da Response (último após o saque). |

### 4.1 Tabela de decisão

| Caso | Condição (só com os 3 responses e a lista Network) | Diagnóstico | Próximo passo |
|------|-----------------------------------------------------|-------------|----------------|
| **1** | **POST** `/api/withdraw/request` **não aparece** na Network ao clicar em "Solicitar Saque". | Bundle antigo, cache (SW/CDN) ou request bloqueada (ex.: CORS). O front não está chamando o endpoint de saque. | Confirmar bundle (seção 2.4): buscar `/api/withdraw/request` ou `withdrawService` no `assets/index-*.js`. Testar em aba anônima com "Disable cache". |
| **2** | **POST** aparece; na Response (1) tem **`success: true`**; na Response (2) o **`data.saldo`** é **igual** ao saldo que estava antes do saque. | Backend não debitou (bug/condição de concorrência), rollback após o request, ou Response (2) é de outro usuário/token/cache. | Comparar identificador do usuário em (1) e (2) (ex.: id no profile). Verificar se (3) contém o saque com valor e status. Revisar logs do backend para o correlation_id do POST. |
| **3** | Na Response (3) **existe** um item em `data.data.saques` com o saque recém-feito (valor e `created_at` coerentes), mas na Response (2) o **`data.saldo`** está **maior** do que o esperado (saldo “voltou”). | Rollback do saque (worker/webhook devolveu o saldo) ou profile retornando dado incorreto/cache. | Verificar no backend se o saque teve rollback (status do saque, logs do worker/webhook). Garantir que o GET profile não está em cache (request direto ao Fly). |

### 4.2 Como preencher a tabela na prática

- **Caso 1:** Olhe a lista Network no momento do clique em "Solicitar Saque". Se não houver linha de **POST** com URL contendo `withdraw/request` → Caso 1.
- **Caso 2:** Há POST com Response (1) `success: true`. Abra a Response (2) do GET profile (o último após o saque). Compare `data.saldo` com o saldo exibido antes do saque; se forem iguais → Caso 2.
- **Caso 3:** Response (3) tem pelo menos um elemento em `data.data.saques` com valor e data do saque que você acabou de fazer. Response (2) mostra um saldo que já deveria ter sido debitado mas está “de volta” → Caso 3.

---

## 5. Próximo passo seguro

1. **Validar em preview** primeiro: deploy da branch `hotfix/withdraw-real-endpoints` (link de preview do PR ou Vercel). Executar o **Checklist Validação Preview** (seção 2) e o **Checklist Validação Depósitos** (seção 3).
2. **Confirmar bundle:** Passos 14–19 da seção 2.4 no deploy de preview.
3. Se **todos** os itens dos checklists passarem e o bundle for o novo: fazer **merge** para o branch de produção e repetir a validação em produção (ou amostra).
4. Se ocorrer **“saldo voltou”:** copiar os 3 responses (POST request, GET profile, GET history) e aplicar a **Tabela de decisão** (seção 4) para identificar Caso 1, 2 ou 3 e seguir o próximo passo indicado na tabela.

---

**Regra:** Nenhum arquivo do repositório foi alterado. Validação apenas por DevTools > Network e conteúdo das abas Response; sem uso de console.
