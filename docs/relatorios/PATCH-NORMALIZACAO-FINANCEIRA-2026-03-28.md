# PATCH DE NORMALIZAÇÃO FINANCEIRA

**Data:** 2026-03-28  
**Objetivo:** padrão interno **EN** (`amount`, `pix_key`, `pix_type`, `payment_id`) com **dual write** PT+EN e **dual read** (`??` / normalização) sem alterar schema, regras de negócio do crédito/saque, jogo ou contratos HTTP externos.

---

## 1. Resumo executivo

Foi introduzido o módulo **`utils/financialNormalization.js`** com `normalizePagamentoPixRead`, `normalizeSaqueRead`, `normalizeFinancialRecord(table, row)`, `dualWritePagamentoPixRow` e `dualWriteSaqueRow`. O **`server-fly.js`** passa a inserir PIX e saques apenas via **dual write**; leituras expostas ao cliente (lista PIX / histórico de saques) devolvem registos **normalizados**. O crédito PIX resolve primeiro por **`payment_id`**, com **`external_id`** só como **fallback**, alinhado à decisão de chave canónica. Serviços auxiliares (`history-service`, `paymentController`, métricas, ledger) foram alinhados onde havia leitura/escrita relevante.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| **`utils/financialNormalization.js`** | **Novo** — helpers de leitura/escrita. |
| **`server-fly.js`** | Require helpers; insert PIX/saque; listagens; `creditarPixAprovadoUnicoMpPaymentId`; `reconcilePendingPayments`. |
| **`services/history-service.js`** | Map de depósitos/saques com normalizadores. |
| **`controllers/paymentController.js`** | Insert dual write; listagem/consulta com leitura normalizada. |
| **`src/domain/ledger/reconcileMissingLedger.js`** | Valor de depósito via registo normalizado. |
| **`monitoring/flyio-custom-metrics.js`** | Somas com `amount ?? valor`. |

---

## 3. Alterações na leitura

- **`normalizePagamentoPixRead`:** `amount` e `valor` iguais ao canónico numérico (prioridade `amount`, senão `valor`); aviso se divergência &gt; 0,02.
- **`normalizeSaqueRead`:** idem para dinheiro; `pix_key`/`chave_pix` e `pix_type`/`tipo_chave` alinhados ao par não vazio; avisos se conflito entre pares.
- **`normalizeFinancialRecord('pagamentos_pix' \| 'saques', row)`:** entrada única por tabela.
- Aplicado em: respostas **`GET /api/payments/pix/usuario`**, **`GET /api/withdraw/history`**, `HistoryService.getUserDepositHistory` / `getUserWithdrawHistory`, listagem em `paymentController`, fluxo de status em `consultarStatusPagamento`, e cálculo de valor em `reconcileMissingLedger`.

---

## 4. Alterações na escrita

- **`dualWritePagamentoPixRow`:** define `amount` = `valor`; `payment_id` e `external_id` espelhados (MP: mesmo id em ambos no fluxo atual).
- **`dualWriteSaqueRow`:** define os três pares EN/PT com os mesmos valores.
- **`POST /api/payments/pix/criar`** e **`POST /api/withdraw/request`:** passam a usar estes builders no `.insert()`.
- **`paymentController.criarPagamentoPix`:** insert alinhado (incl. `external_id` = `payment_id` para consistência de colunas).

Nenhum `UPDATE` de status em PIX foi alterado (só `status`/`updated_at`).

---

## 5. PIX — ajustes de chave

- **`creditarPixAprovadoUnicoMpPaymentId`:** consulta **`payment_id` primeiro**, depois **`external_id`**.
- **`reconcilePendingPayments`:** id MP para a API: **`payment_id` primeiro**, depois `external_id` (após `normalizePagamentoPixRead` no registo pendente).
- Webhook não mudou o contrato; continua a passar o id MP numérico para a função acima.

---

## 6. Saque — ajustes

- Insert único via **`dualWriteSaqueRow`** com `amount`, `pix_key`, `pix_type` e espelhos PT obrigatórios.
- Histórico **`GET /api/withdraw/history`** devolve linhas normalizadas (mesmos campos, valores alinhados).

---

## 7. Riscos mitigados

- Ambiguidade **qual coluna ler** para valor/chave/tipo em listagens e ledger.
- Lookup PIX por **`external_id`** quando **`payment_id`** é a chave estável no fluxo Mercado Pago.
- Métricas que somavam só `amount` ou só `valor` ignorando o par.

---

## 8. Riscos remanescentes

- Registos legados com **`payment_id`** ausente e só **`external_id`** não numérico continuam **fora** do reconcile MP (comportamento já existente).
- **`paymentController`** e fluxos alternativos de preferência MP não são o entrypoint do **Dockerfile** atual; mantidos alinhados por consistência de repositório.
- Conflitos reais PT≠EN (improváveis pós-saneamento) geram **warn** em log, sem correção automática.

---

## 9. Veredito

**PATCH CONCLUÍDO — PRONTO PARA CORREÇÃO FINANCEIRA**

O backend passa a tratar **EN como padrão interno**, com **PT só como espelho** nas escritas e **fallback** nas leituras via normalização, **sem** DDL e **sem** alterar a lógica de crédito, débito ou estados — preparando terreno para os patches da janela `approved`/rollback.

---

*Fim do relatório.*
