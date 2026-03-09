# Validação Runtime — Preview e Produção Hotfix Withdraw (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** READ-ONLY (repositório não alterado; validação só via DevTools Network/Response; sem console).  
**Objetivo:** Validar com evidências do DevTools (Network/Response) se o deploy **Preview** do hotfix e depois o deploy **Produção** estão servindo o bundle novo e usando os endpoints corretos de saque, sem impactar depósitos.

---

## 1. Checklist Preview (hotfix)

URL do preview: ________________________________ (ex.: link do PR ou Vercel preview)

| # | Ação | OK? |
|---|------|-----|
| 1 | Abrir a URL do preview em **janela anônima**. | |
| 2 | DevTools (F12) → aba **Network** → filtro **Fetch/XHR** → marcar **Disable cache**. | |
| 3 | Limpar a lista (Clear). Navegar para **/withdraw**. | |
| 4 | Confirmar: existe **GET** com URL contendo **/api/user/profile**. Abrir Response: JSON com `data.saldo`. | |
| 5 | Confirmar: existe **GET** com URL contendo **/api/withdraw/history**. Abrir Response: JSON com `data.data.saques`. | |
| 6 | Limpar. Preencher valor e chave PIX. Clicar **Solicitar Saque**. | |
| 7 | Confirmar: existe **POST** com URL contendo **/api/withdraw/request**. Copiar o **Response** (JSON) → colar no Template (seção 4). | |
| 8 | Confirmar: existe novo **GET** **/api/user/profile** após o POST. Copiar o **Response** (último) → colar no Template. | |
| 9 | Confirmar: existe novo **GET** **/api/withdraw/history** após o POST. Copiar o **Response** (último) → colar no Template. | |
| 10 | Confirmar: **não** há **POST** para **/api/payments/pix/criar** no momento do saque. | |
| 11 | Na Network, abrir o arquivo **assets/index-*.js** (ou o JS principal) → aba **Response** → Ctrl+F buscar **/api/withdraw/request** OU **withdrawService**. Encontrou? Anotar: SIM / NÃO. | |
| 12 | Navegar para **/pagamentos**. Limpar Network. | |
| 13 | Confirmar: existe **GET** **/api/payments/pix/usuario**. | |
| 14 | Criar um depósito (gerar PIX): existe **POST** **/api/payments/pix/criar**. | |
| 15 | Confirmar: **não** há request para **/api/withdraw/request** nem **/api/withdraw/history** em /pagamentos. | |

**Resultado Preview:** Todos OK = bundle novo e endpoints corretos em preview. Algum não OK = anotar qual passo falhou.

---

## 2. Checklist Production

URL de produção: ________________________________ (ex.: https://www.goldeouro.lol)

| # | Ação | OK? |
|---|------|-----|
| 1 | Abrir a URL de produção em **janela anônima**. | |
| 2 | DevTools → **Network** → **Fetch/XHR** → **Disable cache**. Limpar. | |
| 3 | Navegar para **/withdraw**. | |
| 4 | Confirmar: **GET** **/api/user/profile** e **GET** **/api/withdraw/history**. | |
| 5 | Limpar. Solicitar saque (valor + chave). Clicar **Solicitar Saque**. | |
| 6 | Confirmar: **POST** **/api/withdraw/request**; depois novo **GET** profile e novo **GET** history. | |
| 7 | Confirmar: **não** há **POST** **/api/payments/pix/criar** no saque. | |
| 8 | Abrir **assets/index-*.js** → Response → buscar **/api/withdraw/request** OU **withdrawService**. Encontrou? SIM / NÃO. | |
| 9 | Em **/pagamentos**: **GET** **/api/payments/pix/usuario** e **POST** **/api/payments/pix/criar** (ao criar depósito); **não** há **/api/withdraw/** em /pagamentos. | |

**Resultado Production:** Todos OK = produção com bundle novo. Se Preview OK e Production não OK = problema de merge/deploy ou cache de produção.

---

## 3. Template de evidências (preencher colando)

### 3.1 Response — POST /api/withdraw/request

(Colar aqui o JSON completo da aba Response do POST; em produção mascarar token/dados sensíveis se necessário.)

```
```

---

### 3.2 Response — GET /api/user/profile (último após o saque)

(Colar aqui o JSON da última resposta do GET profile após clicar em Solicitar Saque.)

```
```

---

### 3.3 Response — GET /api/withdraw/history (último após o saque)

(Colar aqui o JSON da última resposta do GET history após o saque.)

```
```

---

### 3.4 Evidência em print ou descrição

- **(i) Lista de requests (XHR/Fetch) após SUBMIT do saque**  
  Descrever ou anexar print: após clicar em Solicitar Saque, a lista deve mostrar POST `.../api/withdraw/request` e em seguida GET `.../api/user/profile` e GET `.../api/withdraw/history`. Não deve aparecer POST `.../api/payments/pix/criar` nesse momento.

- **(ii) Busca no index-*.js por /api/withdraw/request**  
  Descrever ou anexar print: na aba Network, arquivo `assets/index-*.js` (ou equivalente) → Response → Ctrl+F com o texto `/api/withdraw/request` (ou `withdrawService`). Deve haver pelo menos um resultado se o bundle for o novo.

---

## 4. Tabela de decisão (preencher SIM/NÃO → classificação)

Responda às perguntas com **SIM** ou **NÃO** (com base no que você viu no Network e nas responses). Use a linha que bater com suas respostas para obter o Caso e o próximo passo.

| # | Pergunta | Sua resposta (SIM/NÃO) |
|---|----------|------------------------|
| Q1 | Ao clicar em "Solicitar Saque", apareceu **POST** para **/api/withdraw/request** na Network? | |
| Q2 | A Response do POST tinha **success: true** (ou equivalente de sucesso)? | |
| Q3 | A Response do **GET /api/user/profile** (última após o saque) mostra **data.saldo** menor do que o saldo antes do saque (saldo debitado)? | |
| Q4 | A Response do **GET /api/withdraw/history** (última após o saque) contém o saque recém-feito em **data.data.saques**? | |
| Q5 | No **index-*.js** (Response), a busca por **/api/withdraw/request** ou **withdrawService** encontrou resultado? | |

### Classificação por combinação (preencher após Q1–Q5)

| Combinação | Caso | Diagnóstico | Próximo passo |
|------------|------|-------------|----------------|
| **Q1 = NÃO** | **Caso 1** | Bundle antigo, cache ou request bloqueada. Front não chama o endpoint de saque. | Confirmar bundle (Q5). Se Q5 = NÃO: redeploy/cache; testar aba anônima + Disable cache. Se Preview OK e Prod não: merge não feito ou cache de produção. |
| **Q1 = SIM, Q2 = SIM, Q3 = NÃO** | **Caso 2** | Backend não debitou, rollback ou profile de outro usuário/cache. | Comparar usuário nas responses (1) e (2). Ver (3) se tem o saque. Revisar logs do backend (correlation_id). |
| **Q1 = SIM, Q2 = SIM, Q3 = NÃO, Q4 = SIM** | **Caso 3** | History tem o saque mas saldo “voltou”. Rollback do saque ou profile incorreto. | Verificar no backend se houve rollback (worker/webhook). Garantir que GET profile não está em cache. |
| **Q1 = SIM, Q2 = SIM, Q3 = SIM** | **OK** | Fluxo correto: POST sucesso, saldo debitado, history atualizado. | Nenhum; validação passou. |

**Seu resultado:** Q1 = ____ , Q2 = ____ , Q3 = ____ , Q4 = ____ , Q5 = ____ → **Caso:** ________

---

## 5. Próximo passo seguro

1. **Executar primeiro o Checklist Preview** (seção 1). Se todos os itens OK → preview está com bundle novo e endpoints corretos.
2. **Executar o Checklist Production** (seção 2). Se todos OK → produção está correta.
3. **Se Preview OK e Production não OK:** concluir que o problema é merge não feito, deploy de produção desatualizado ou cache de produção (Service Worker/CDN). Fazer merge do hotfix para o branch de produção, redeploy e repetir Production em aba anônima com Disable cache.
4. **Preencher o Template de evidências** (seção 3 e 3.4) e a **Tabela de decisão** (seção 4) com as respostas SIM/NÃO para ter o Caso e o próximo passo registrados.
5. Se **Caso 2 ou 3** (“saldo voltou”): usar as 3 responses coladas no template e seguir o próximo passo indicado na tabela (backend/logs/rollback).

---

**Regra:** Nenhum arquivo do repositório foi alterado. Validação apenas por DevTools Network e Response; sem console.
