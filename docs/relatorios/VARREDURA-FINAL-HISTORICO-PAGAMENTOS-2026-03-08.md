# VARREDURA FINAL — HISTORICO_PAGAMENTOS

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, patch, deploy ou banco.  
**Objetivo:** Garantir que não existe nenhum outro ponto no projeto usando a propriedade `historico_pagamentos` (ou equivalente incorreto) para a resposta do endpoint PIX do backend.

---

## 1. Ocorrências encontradas

### Busca por termos

| Termo | Ocorrências | Localização |
|------|--------------|-------------|
| **historico_pagamentos** | Várias | 1 em código ativo (frontend); demais em documentação/relatórios. |
| **histórico_pagamentos** | 0 | Nenhuma. |
| **historico de pagamentos** | 0 | Nenhuma. |
| **paymentHistory** | 0 | Nenhuma. |
| **paymentsHistory** | 0 | Nenhuma. |
| **recentPayments** | 1 em backend arquivado | `_archived_config_controllers/analyticsController.js` — variável de analytics (query SQL), **não** relacionada ao GET /api/payments/pix/usuario. |
| **recentBets** | Várias | 1 arquivo de código ativo: `goldeouro-player/src/pages/Dashboard.jsx` (estado e uso da lista). Demais em docs/planos. |
| **ultimos pagamentos / últimos pagamentos** | 0 em código | Apenas em docs (VALIDACAO-FINAL-BLOCO-G, etc.). |

### Detalhamento por arquivo

| Arquivo | Tipo | Uso |
|---------|------|-----|
| **goldeouro-player/src/pages/Dashboard.jsx** | Código ativo | Linha 55: `setRecentBets(pixResponse.data.data.historico_pagamentos \|\| [])`. **Único ponto que consome a propriedade incorreta.** Linhas 16, 60, 73, 233–234: estado `recentBets` e renderização do bloco "Apostas Recentes". |
| **goldeouro-player/src/pages/Pagamentos.jsx** | Código ativo | Usa `pagamentosResponse.data.data.payments` — **correto**. |
| **goldeouro-player/src/utils/dashboardTest.js** | Código ativo | Chama `apiClient.get(API_ENDPOINTS.PIX_USER)` apenas para verificar sucesso da requisição; **não lê** `historico_pagamentos` nem `payments`. |
| **goldeouro-player/src/services/paymentService.js** | Código ativo | `getUserPix()` retorna `response.data` inteiro; não extrai nem renomeia propriedades. Nenhum consumidor em páginas usa `getUserPix()` para listar PIX (Pagamentos e Dashboard usam `apiClient.get(PIX_USER)` direto). |
| **docs/relatorios/AUDITORIA-HISTORICO-PAGAMENTOS-2026-03-08.md** | Documentação | Descreve a inconsistência; não é código. |
| **docs/relatorios/DIAGNOSTICO-HISTORICO-PAGAMENTOS-2026-03-08.md** | Documentação | Recomenda correção no Dashboard; não é código. |
| **docs/relatorios/VALIDACAO-FINAL-BLOCO-G-2026-03-08.md** | Documentação | Menciona a ressalva; não é código. |
| **docs/relatorios/RELATORIO-AUDITORIA-DEPOSITO-PIX-READONLY.md** | Documentação | Cita Dashboard e `historico_pagamentos`; não é código. |
| **RELATORIO-FINAL-EXECUCAO-TODOs-DASHBOARD-v1.2.0.md** | Documentação | Trecho de código citado; não é código executado. |
| **docs/auditorias/AUDITORIA-COMPLETA-DASHBOARD-IA-MCPs-v1.2.0.md** | Documentação | Trecho de código citado; não é código executado. |
| **docs/auditorias/AUDITORIA-CORRECAO-ERRO-500-FINAL.md** | Documentação | Descreve correção **no backend** (resposta com `historico_pagamentos`, `pix`, `payments`). O **server-fly.js atual** não implementa essa estrutura; retorna apenas `data.payments`. Documento legado ou correção não aplicada/revertida. |
| **_archived_config_controllers/analyticsController.js** | Código arquivado | `recent_payments` vem de query SQL em analytics; **não** é o endpoint GET /api/payments/pix/usuario. |
| **goldeouro-player/AUDITORIA-JOGADOR.md** | Documentação | Exemplo com `recentBets`; não é código da aplicação. |
| **goldeouro-player/PLANO-JOGADOR-NO-REGRESS.md** | Documentação / plano | Exemplo/mock com `recentBets`; não é código ativo. |

---

## 2. Ocorrências em código ativo

**Único ponto incorreto em código ativo:**

- **Arquivo:** `goldeouro-player/src/pages/Dashboard.jsx`  
- **Linha:** 55  
- **Trecho:** `setRecentBets(pixResponse.data.data.historico_pagamentos || [])`  
- **Contexto:** Dentro de `loadUserData()`, após `retryDataRequest(() => apiClient.get(API_ENDPOINTS.PIX_USER))`. A resposta do backend traz `data.payments`; o código lê `data.historico_pagamentos`, que não existe, resultando em lista sempre vazia.

**Consumo correto do mesmo endpoint:**

- **goldeouro-player/src/pages/Pagamentos.jsx** — usa `pagamentosResponse.data.data.payments`.

**Demais usos em código ativo:**

- **dashboardTest.js** — apenas verifica se o endpoint PIX responde; não acessa corpo da resposta para listar itens.
- **paymentService.js** — não transforma a resposta nem expõe `historico_pagamentos`.
- **apiClient.js** — não altera corpo da resposta.
- **config/api.js** — só define `PIX_USER`; não define nomes de propriedades.

Nenhum hook, componente de listagem, widget financeiro ou card de home/dashboard além do bloco "Apostas Recentes" do Dashboard.jsx consome o GET /api/payments/pix/usuario ou espera `historico_pagamentos`.

---

## 3. Ocorrências em código inativo ou docs

- **Documentação (relatórios, auditorias, validações):** Todas as outras menções a `historico_pagamentos` ou ao trecho do Dashboard estão em arquivos .md ou .json de documentação — descrevem o problema ou citam o código; não são código executado.
- **AUDITORIA-CORRECAO-ERRO-500-FINAL.md:** Documenta uma correção no backend (enviar `historico_pagamentos` na resposta). O backend atual (server-fly.js) **não** envia esse campo; envia apenas `data.payments`. Considerado documento legado ou correção não presente no código atual.
- **Código arquivado:** `_archived_config_controllers/analyticsController.js` — `recentPayments` é resultado de query SQL própria; não está ligado ao endpoint PIX usuario.
- **Planos/exemplos:** PLANO-JOGADOR-NO-REGRESS.md, AUDITORIA-JOGADOR.md — exemplos com `recentBets`; não fazem parte do fluxo de consumo da API PIX.

---

## 4. Existe outro consumo incorreto do endpoint PIX?

**Não.**

- **Chamadas a GET /api/payments/pix/usuario (ou PIX_USER):**  
  - **Dashboard.jsx** — consome **incorretamente** `data.historico_pagamentos`.  
  - **Pagamentos.jsx** — consome **corretamente** `data.payments`.  
  - **dashboardTest.js** — não consome o corpo para listar; só verifica sucesso.

- **Nenhum outro arquivo** (services, hooks, components, pages, configs) lê a resposta desse endpoint esperando `historico_pagamentos`.

- **Nenhuma transformação intermediária** monta o campo `historico_pagamentos` a partir de `payments`; o paymentService repassa `response.data` sem renomear propriedades.

---

## 5. Conclusão final

**APENAS UM PONTO INCORRETO**

- **Local:** `goldeouro-player/src/pages/Dashboard.jsx`, linha 55.  
- **Comportamento:** Uso de `pixResponse.data.data.historico_pagamentos` em vez de `pixResponse.data.data.payments`.  
- **Restante do projeto:** Nenhum outro arquivo de código ativo usa `historico_pagamentos` ou equivalente incorreto para a resposta do GET /api/payments/pix/usuario. Documentação e código arquivado não alteram essa conclusão.

Varredura encerrada. Nenhuma alteração de código foi feita.
