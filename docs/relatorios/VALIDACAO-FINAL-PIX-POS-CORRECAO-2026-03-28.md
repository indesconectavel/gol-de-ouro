# VALIDAÇÃO FINAL — PIX PÓS-CORREÇÃO

**Data:** 2026-03-28.  
**Modo:** auditoria **read-only** sobre o **código final** no repositório.  
**Limite explícito:** não foram executados nesta validação testes PIX reais contra o Mercado Pago nem leitura de logs do Fly/Supabase após o deploy da correção; onde isso importa, está indicado como **não comprovado em runtime**.

---

## 1. Resumo executivo

O código pós-correção implementa validação de webhook compatível com o formato oficial do Mercado Pago (`ts` / `v1` + *manifest* HMAC-SHA256), mantém a persistência do ID numérico do pagamento no fluxo principal (`server-fly.js` → API de pagamentos), encadeia o crédito via `creditarPixAprovadoUnicoMpPaymentId` (RPC primeiro, fallback JS) e endurece o reconcile com prioridade a `payment_id` numérico, marcação `reconcile_skip` quando a coluna existe e fallback documentado quando não existe.

**Conclusão prática:** o **desenho** do fluxo “webhook → consulta MP → crédito” e “reconcile → GET MP → crédito” está **coerente** com a restauração do processamento. A **confirmação de que produção já se comporta assim** exige novo teste PIX + inspeção de logs (`[WEBHOOK]`, `[PIX-CREDIT]`, `[RECON]`).

---

## 2. Webhook

### Parsing e headers

- `x-signature`: divisão por `,`, extração de `ts` e `v1` por `chave=valor` (`utils/webhook-signature-validator.js`, ~163–172).
- `data.id`: `req.query['data.id']` **em primeiro lugar**, depois `req.body.data.id` (~181–187), alinhado à prioridade de query da documentação MP.
- `x-request-id`: incluído no *manifest* apenas se não vazio (~198–205).
- *Manifest:* `id:${dataID};` + opcional `request-id:${requestIdStr};` + `ts:${tsVal};` (~202–207).

### Assinatura

- HMAC-SHA256 sobre o *manifest* (não sobre o corpo JSON) (~209).
- Comparação `timingSafeEqual` entre `v1` (hex) e digest esperado (~211–225).

### Caminho feliz (código)

1. `MERCADOPAGO_WEBHOOK_SECRET` definido → `validateMercadoPagoWebhook` retorna `valid: true`.
2. Primeiro handler chama `next()`; segundo handler responde `200` com `{ received: true }` (`server-fly.js` ~2058–2063).
3. `type === 'payment'`, `data.id` numérico → `GET /v1/payments/{id}`; se `approved` → `creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)` (~2065–2089).

### Logs esperados (comportamento)

- Sucesso assinatura: não há `console.log` explícito de “signature válida” nesse handler (apenas `req.webhookValidation`); entrada típica: `📨 [WEBHOOK] PIX recebido:` (~2061).
- Crédito RPC OK: `💰 [PIX-CREDIT] RPC crédito OK mp ...` (em `creditarPixAprovadoUnicoMpPaymentId`, ~2007–2008).
- Falha assinatura (produção): `❌ [WEBHOOK] Signature inválida:` + `401` (~2041–2048).

### Resposta à pergunta 1 — *O webhook agora aceita corretamente eventos legítimos do MP?*

- **Por análise estática:** **sim, em princípio**, para notificações que seguem o contrato oficial (header `x-signature` no formato `ts=...,v1=...`, `data.id` coerente com o assinado, secret correto, `x-request-id` alinhado ao que o MP usou no *manifest*).
- **Não comprovado aqui:** recebimento real em produção (proxy que remove `x-request-id`, skew de `ts`, ou variações de payload não documentadas podem ainda reprovar assinatura).

---

## 3. Criação PIX

### Fluxo principal (Fly / `server-fly.js`)

- Criação via `POST https://api.mercadopago.com/v1/payments` (~1712–1727).
- Persistência: `payment_id: String(payment.id)`, `external_id: String(payment.id)` (~1745–1748).
- `external_reference` enviado ao MP: `goldeouro_${userId}_${Date.now()}` (~1702) — não substitui o ID gravado nas colunas de pagamento.

### Resposta à pergunta 2 — *A criação do PIX grava o `payment_id` canónico corretamente?*

- **Para o caminho real em `server-fly.js`:** **sim** — o canónico é o `payment.id` devolvido pela API de **pagamentos**.
- **Ressalva:** `controllers/paymentController.criarPagamentoPix` grava `payment_id` / `external_id` com `result.id` da **preferência** (Checkout Pro), que **não** é o mesmo conceito que o ID do **pagamento** na API `/v1/payments/{id}` quando o utilizador paga depois. Esse caminho **não** foi alterado para sincronizar com o ID do pagamento real; se o player em produção usar só `server-fly.js`, o risco é menor.

---

## 4. Reconcile

### Seleção

- Filtro `status = 'pending'`, `created_at` abaixo do limite de idade, `reconcile_skip = false` quando a coluna existe (`server-fly.js` ~2166–2173).

### Filtro de inválidos

- `resolveMercadoPagoPaymentIdString`: só dígitos; `payment_id` antes de `external_id` (~2130–2136).
- Sem ID numérico: `warn` + `markPagamentoPixReconcileSkip` **se** `reconcileSkipColumnAvailable` (~2205–2208).

### Consulta ao MP

- `GET /v1/payments/{id}` só com inteiro positivo (~2218+).

### Loop inútil

- **Com migração aplicada** (`reconcile_skip`): a mesma linha legada **não** deve voltar ao *pool* após `reconcile_skip = true` — **insistência infinita eliminada** para esse caso.
- **Sem migração:** fallback de listagem sem `reconcile_skip`; não há `UPDATE` de skip → o mesmo pending inválido pode gerar **warn repetido** a cada ciclo (comportamento documentado no código ~2189–2192).

### Resposta à pergunta 3 — *O reconcile parou de insistir em IDs legados inválidos?*

- **Com coluna `reconcile_skip` no banco:** **sim**, após a primeira passagem que marca a linha.
- **Sem coluna:** **não totalmente** — só deixa de chamar o MP com ID inválido, mas pode repetir avisos.

---

## 5. Dados legados

- Linhas com `payment_id` / `external_id` não numéricos dependem de `reconcile_skip` + `markPagamentoPixReconcileSkip` para sair do ciclo de reconcile.
- A migração `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql` é **pré-condição operacional** para o comportamento “marcar e esquecer” no job.
- Saneamento do **conteúdo** dos IDs legados (corrigir para o ID MP verdadeiro) **não** faz parte desta correção e continua manual / script separado se necessário.

---

## 6. Riscos eliminados (em relação ao estado pré-correção)

- Rejeição sistemática por “Formato de signature inválido” devido ao formato `sha256=...` incompatível com o MP.
- HMAC calculado sobre o corpo JSON em vez do *manifest* oficial.
- Uso indistinto de `payment_id` e `external_id` sem priorizar o canónico numérico.
- Possibilidade de, com migração, o reconcile voltar a processar indefinidamente a mesma linha com ID não numérico.

---

## 7. Riscos remanescentes

| Risco | Nota |
|--------|------|
| Assinatura ainda inválida em produção | Secret errado, *manifest* divergente (ex.: `x-request-id` ausente no request mas presente na assinatura MP, ou o inverso), ou `data.id` query vs body desalinhado face ao que o MP assinou. |
| Migração `reconcile_skip` não aplicada | Ruído periódico em logs para legados; skip persistente não ocorre. |
| `FINANCE_ATOMIC_RPC=false` ou RPC indisponível | Crédito depende do fallback JS; atomicidade por RPC não usada. |
| Fluxo Checkout Pro (`paymentController`) | ID na tabela pode ser de **preferência**, não de **pagamento**; webhook com `data.id` = payment pode não encontrar linha (`pix_not_found`). |
| Janela `MP_WEBHOOK_TS_SKEW_SEC` | `ts` fora da janela → `401` legítimo pelo código atual. |

---

## 8. Veredito operacional

**GO COM RESSALVAS**

---

## 9. Justificativa do veredito

### Respostas diretas às perguntas do objetivo

| # | Pergunta | Avaliação |
|---|----------|-----------|
| 1 | Webhook aceita eventos legítimos MP? | **Código alinhado ao contrato oficial;** eficácia em produção **não verificada** com logs reais nesta validação. |
| 2 | Criação grava `payment_id` canónico? | **Sim** em `server-fly.js` (ID do pagamento MP). **Ressalva** no fluxo preferência do `paymentController`. |
| 3 | Reconcile deixou de insistir em legados? | **Sim** se `reconcile_skip` existir e o `UPDATE` funcionar; **parcial** sem migração. |
| 4 | Pagamentos reais podem sair de `pending` para `approved`? | **O caminho existe** (webhook + GET status `approved` + crédito; ou reconcile equivalente). **Não há evidência** nesta sessão de um PIX real já concluído pós-deploy. |
| 5 | RPC atômico é acionado no fluxo real? | **Sim no código**, desde `FINANCE_ATOMIC_RPC !== 'false'` e RPC instalada: `supabase.rpc('creditar_pix_aprovado_mp', ...)` é a primeira tentativa (`server-fly.js` ~2001–2010). **Sucesso** depende do PostgREST/Supabase e da função no banco. |
| 6 | Pronto para novo teste PIX real? | **Sim, com ressalvas:** confirmar secret, migração opcional mas recomendada, monitorizar logs, preferir fluxo `server-fly.js` para o teste de ponta a ponta. |

### Por que não “GO PARA NOVO TESTE PIX REAL” puro

Exigiria **evidência** de um ciclo completo já observado (webhook 200 + crédito + linha `approved`) após a correção. Esta validação é **só código + raciocínio**; não substitui o teste.

### Por que não “NO-GO”

Não há falha lógica evidente que torne o webhook **necessariamente** tão incorreto quanto o estado pré-correção; o encadeamento até `creditarPixAprovadoUnicoMpPaymentId` está íntegro e o reconcile foi endurecido conforme especificado.

**Recomendação operacional imediata:** executar um PIX real de valor mínimo no ambiente que usa `POST /api/payments/pix/criar` do `server-fly.js`, com `MERCADOPAGO_WEBHOOK_SECRET` configurado, e validar em sequência: resposta `200` do webhook, ausência de `Signature inválida`, log `[PIX-CREDIT] RPC crédito OK` ou fallback sem erro, e linha em `pagamentos_pix` como `approved`.
