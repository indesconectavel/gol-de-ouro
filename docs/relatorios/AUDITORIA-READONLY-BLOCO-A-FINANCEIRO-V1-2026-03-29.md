# AUDITORIA READ-ONLY — BLOCO A — FINANCEIRO V1

**Data:** 2026-03-29  
**Modo:** somente leitura.  
**Foco:** entrada de dinheiro (PIX Mercado Pago), `pagamentos_pix`, webhook, crédito em saldo, reconcile.  
**Entrada oficial:** `server-fly.js`, `utils/webhook-signature-validator.js`, `utils/financialNormalization.js`, `database/rpc-financeiro-atomico-2026-03-28.sql`, `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql`, `database/schema-completo.sql` (referência de schema legado no repositório).

---

## 1. Resumo executivo

O fluxo V1 em **`server-fly.js`** cobre: criação de cobrança via **API REST do Mercado Pago** (`POST v1/payments`), persistência em **`pagamentos_pix`** com **dual-write** `amount`/`valor`, **webhook** que valida assinatura (se secret configurado), consulta ao MP para confirmar `approved`, e **crédito** centralizado em **`creditarPixAprovadoUnicoMpPaymentId`** (RPC `creditar_pix_aprovado_mp` preferida, **fallback JS** se RPC indisponível ou resposta inválida). O **reconcile** percorre linhas `pending` antigas, consulta o MP e chama a **mesma** função de crédito.

Pontos fortes com evidência: **idempotência de crédito** por linha (`pending` → `approved` + saldo na RPC numa transação; no JS, claim condicional e reversão para `pending` se saldo falhar); **mesma função** no webhook e no reconcile reduz divergência lógica; **log estruturado** `[PIX-ORFAO-MP]` quando MP OK e insert local falha.

Fragilidades: **sem linha em `pagamentos_pix`**, webhook/reconcile **não creditam** (`pix_not_found`); se **`MERCADOPAGO_WEBHOOK_SECRET`** não estiver definido, o middleware de assinatura **não corre** e o webhook fica **aberto** a POST arbitrários; resposta **200 imediata** antes do processamento — correto para MP, mas falhas posteriores dependem de **retentativas** do MP e do reconcile; **fallback JS** tem janela teórica entre “marcar approved” e “creditar saldo” (compensação existe).

**Classificação final (obrigatória):** **BLOCO A COM RISCOS MODERADOS**.

---

## 2. Escopo auditado

| Incluído | Excluído |
|----------|----------|
| `POST /api/payments/pix/criar`, `POST /api/payments/webhook`, `creditarPixAprovadoUnicoMpPaymentId*`, `reconcilePendingPayments`, helpers `resolveMercadoPagoPaymentIdString`, `markPagamentoPixReconcileSkip` | Player, admin, saque (BLOCO D além do cruzamento com saldo), engine de jogo |
| `WebhookSignatureValidator.validateMercadoPagoWebhook` | `controllers/paymentController.js` e outros serviços PIX não montados em `server-fly.js` (mencionados só como legado de repositório) |
| SQL das RPCs no ficheiro de migração referenciado pelo fluxo | Estado real do schema Supabase em produção (não verificado em runtime) |

---

## 3. Criação de PIX

### 3.1 Chamada ao Mercado Pago

- `axios.post('https://api.mercadopago.com/v1/payments', paymentData, …)` com `Authorization: Bearer MERCADOPAGO_ACCESS_TOKEN`.
- `validateStatus: (status) => status < 500` — respostas **4xx** entram no corpo como “sucesso HTTP” para o axios; o código exige `payment.id` e `point_of_interaction.transaction_data.qr_code`; caso contrário **lança** e cai no `catch` com 500 ao cliente.

### 3.2 Idempotência (criação)

- Header **`X-Idempotency-Key`**: `pix_${userId}_${Date.now()}_${randomBytes}` — **nova chave por pedido**; não reutiliza chave do cliente. Protege **retries de rede no MP** para a **mesma** requisição só se o cliente repetir o mesmo POST com o mesmo corpo e o MP respeitar a chave (o backend **não** expõe chave estável por “intenção de depósito”).

### 3.3 Momento do insert em `pagamentos_pix`

- **Depois** de resposta MP válida (`payment.id` + QR). Antes disso, se `!dbConnected || !supabase`, responde **503** e regista log de MP criado sem registar localmente.

### 3.4 Cenários de falha

| Cenário | Comportamento no código |
|---------|-------------------------|
| **MP OK, DB falha** (insert) | **500** ao cliente; mensagem de suporte; `data.mercado_pago_payment_id`; log **`[PIX-ORFAO-MP]`** com JSON (`tag`, ids, valor, erro Supabase). |
| **MP indisponível / resposta inválida** | `catch` interno: 500 genérico ou diagnóstico com `debug`; **não** há cobrança MP válida persistida pelo fluxo feliz. |
| **MP OK, Supabase desligado antes do insert** | **503**; log `❌ [PIX] MP criou cobrança mas Supabase indisponível mp_id=` — **órfão** do ponto de vista local (igual família do caso anterior para reconciliação automática). |

### 3.5 `amount` / `valor`

- `dualWritePagamentoPixRow` define **`amount` e `valor` iguais** ao valor parseado (`parseMoney`). Leituras usam `normalizePagamentoPixRead` com aviso se divergirem além de `MONEY_WARN_EPS`.

---

## 4. Estrutura de `pagamentos_pix`

### 4.1 Campos essenciais (uso no fluxo V1)

- Identificação: `payment_id`, `external_id` (no insert atual ambos = `String(payment.id)`).
- Dono: `usuario_id`.
- Valores: `amount`, `valor` (dual-write).
- Estado: `status` — código usa **`pending`** na criação; crédito espera **`pending`** para processar; **`approved`** idempotente.
- QR / cópia: `qr_code`, `qr_code_base64`, `pix_copy_paste`.
- Reconcile: `reconcile_skip` (migração opcional; fallback de query se coluna ausente).

### 4.2 Unicidade

- Em **`database/schema-completo.sql`**: `payment_id VARCHAR(100) UNIQUE NOT NULL`. O schema efetivo em Supabase pode diferir; o repositório sugere **proteção contra duas linhas com o mesmo `payment_id`**.

### 4.3 Status e riscos

- Transições observadas: `pending` → `approved` (crédito); fallback JS pode `approved` → `pending` em erro de saldo.
- **`external_reference`** no payload MP (`goldeouro_${userId}_${Date.now()}`) **não** é campo obrigatório no insert local igual ao MP em todas as colunas — o crédito resolve por **`payment_id`** / **`external_id`** numéricos iguais ao id MP.

### 4.4 Duplicidade

- Duas linhas com o mesmo MP `id` seriam bloqueadas se `UNIQUE(payment_id)` existir. Sem essa constraint no ambiente real, risco de duplicidade **aumenta** (fora do código JS).

---

## 5. Webhook

### 5.1 Validação de assinatura

- Se **`process.env.MERCADOPAGO_WEBHOOK_SECRET`** está definido: `validateMercadoPagoWebhook(req)` — manifest HMP com `id`, `request-id` opcional, `ts`; comparação **timing-safe**; janela de tempo configurável (`MP_WEBHOOK_TS_SKEW_SEC`, default 600 s).
- Se **secret ausente**: o **bloco inteiro de validação é ignorado** — qualquer corpo pode prosseguir para o handler seguinte (**risco alto de configuração**).

### 5.2 Assinatura inválida

- **`NODE_ENV === 'production'`:** **401** e não processa.
- **Caso contrário:** aviso em log e **processamento continua** (comportamento documentado no código).

### 5.3 Payload incompleto / tipo inválido

- Responde **200** `{ received: true }` primeiro.
- Se `type !== 'payment'` ou `data.id` ausente/ inválido: **não** chama crédito; parte dos casos gera log de ID inválido; ausência de `type` pode **silenciar** processamento (sem crédito).

### 5.4 Pagamento não encontrado localmente

- `creditarPixAprovadoUnicoMpPaymentId` retorna `pix_not_found` — webhook regista erro **exceto** quando `reason === 'claim_lost'` (padrão de supressão de ruído).

### 5.5 Ordem: resposta vs processamento

- **`res.status(200).json({ received: true })` antes** da consulta MP e do crédito — alinhado à prática de notificações MP; falhas depois dependem de **novas entregas** e do **reconcile** para linhas já em `pagamentos_pix`.

### 5.6 Race com reconcile

- Ambos invocam a mesma função de crédito; **claim** `pending` ou RPC com `FOR UPDATE` serializa; segundo executor obtém `already_processed` ou `claim_lost` — **duplo crédito improvável** no desenho atual.

---

## 6. Crédito de pagamento

### 6.1 RPC `creditar_pix_aprovado_mp` (ficheiro SQL)

- Bloqueia linha `pagamentos_pix` com **`FOR UPDATE`**; se já `approved`, retorna **`already_processed`**.
- Crédito > 0: lock em `usuarios`, atualiza saldo com **lock otimista**, depois `UPDATE pagamentos_pix … approved`; se falhar o segundo update, **reverte saldo**.
- Crédito ≤ 0: apenas marca `approved` (sem alterar saldo).
- **Transação única** na função PL/pgSQL — atomicidade **real** no servidor de BD.

### 6.2 Fallback JS

- Ordem: **claim** `pending` → `approved` → ler usuário → atualizar saldo (optimistic lock) → se falhar saldo, **reverte** linha para `pending`.
- Janela: entre claim e saldo, outro leitor poderia ver `approved` sem saldo ainda — breve; em falha de saldo há compensação.

### 6.3 Idempotência do crédito

- **Sim** para o mesmo `payment_id`: segunda execução vê `approved` → `already_processed` (RPC) ou no JS no início.

### 6.4 Riscos específicos

| Risco | Mitigação no código |
|-------|---------------------|
| Crédito duplicado | Claim / RPC + status `approved` |
| Saldo sem `approved` estável (JS) | Reversão para `pending` se saldo falhar |
| `approved` sem crédito (valor 0) | Comportamento explícito `zero_credit` |

---

## 7. Reconcile

### 7.1 Identificação de pendentes

- `status = 'pending'`, `created_at < now - MP_RECONCILE_MIN_AGE_MIN` (default **2** minutos), `reconcile_skip = false` se coluna existir, limite `MP_RECONCILE_LIMIT` (default **10**).

### 7.2 Uso de `payment_id`

- `resolveMercadoPagoPaymentIdString`: prefere `payment_id` numérico; senão `external_id` numérico; vazio → marca skip (se coluna) ou aviso.

### 7.3 Consistência com webhook

- Mesma **`creditarPixAprovadoUnicoMpPaymentId(mpId)`** após `GET v1/payments/:id` com `status === 'approved'`.

### 7.4 Riscos

- **Duplicar crédito:** mitigado pela idempotência interna do crédito.
- **Não encontrar pagamento válido:** ID não numérico → skip + opcional `reconcile_skip`; MP ainda `pending` → não credita (correto).
- **Ignorar aprovado:** possível se linha **não existe** localmente (órfão MP) — reconcile **não** lista.

### 7.5 Concorrência entre processos

- Flag **`reconciling`** em memória **por processo Node** — várias VMs podem executar ciclos em paralelo; a serialização forte está no **banco** (claim/RPC), não no flag.

---

## 8. Pagamentos órfãos

**Definição (auditoria):** cobrança existente no MP com **sucesso**, mas **sem** (ou com falha de) registo em `pagamentos_pix`.

| Deteção automática | Tratamento automático |
|--------------------|------------------------|
| **Insert falhou:** log `[PIX-ORFAO-MP]` + resposta 500 com `mercado_pago_payment_id` | **Não** — sem linha, webhook/reconcile **não** creditam |
| **Supabase off após MP:** log com `mp_id` | Idem |

**Conclusão:** o sistema **deteta parcialmente** (logs + payload ao cliente no caso insert) mas **não** reconcilia órfãos só com MP; depende de **intervenção manual** ou ferramenta externa usando `payment_id`.

---

## 9. Idempotência

| Etapa | Mecanismo | Onde pode falhar |
|-------|-----------|------------------|
| Criação | `X-Idempotency-Key` por request no MP | Novo pedido = nova cobrança (por desenho) |
| Webhook | MP reenvia; crédito idempotente | Órfão sem linha |
| Crédito | Status `approved` / claim `pending` | RPC ausente → caminho JS mais longo |
| Reconcile | Mesma função de crédito | Só atua em linhas `pending` existentes |

---

## 10. Logs e rastreabilidade

**Presentes:** `[PIX]`, `[PIX-CREDIT]`, `[WEBHOOK]`, `[RECON]`, `[PIX-ORFAO-MP]` (JSON com `mercado_pago_payment_id`, `usuario_id`, `amount_brl`, erros), logs de reconcile com `mpId` e `usuario_id` em sucesso.

**Limitações:** webhook com payload mínimo pode não deixar rastro além do `console.log` inicial `{ type, data }`; `claim_lost` propositalmente **não** gera `console.error` no webhook para reduzir ruído.

**Estruturados:** parcialmente — órfão MP e erros críticos usam JSON stringify; maior parte é texto prefixado.

---

## 11. Dependência de configuração

| Variável | Papel | Risco se mal configurada |
|----------|--------|---------------------------|
| `MERCADOPAGO_ACCESS_TOKEN` | Criar cobrança, consultar pagamento | PIX indisponível ou falhas |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validação HMAC MP | **Ausente → webhook sem validação de assinatura** |
| `BACKEND_URL` | `notification_url` no payment | Webhooks podem ir para URL errada |
| `FINANCE_ATOMIC_RPC` | `!== 'false'` ativa RPC | `false` força JS (mais frágil) |
| `NODE_ENV` | Produção rejeita assinatura inválida | Staging permissivo |
| `MP_RECONCILE_*`, `MP_RECONCILE_ENABLED` | Intervalo, idade mínima, limite | Reconcile lento ou desligado |

---

## 12. Classificação de riscos

### Crítico

- Nenhum **dentro do fluxo feliz** com RPC ativa, linha local existente, secret configurado e schema com unicidade coerente.

### Alto

- **Webhook sem `MERCADOPAGO_WEBHOOK_SECRET`:** aceita notificações não autenticadas por HMP (o processamento ainda consulta MP com token, mas superfície de abuso aumenta).
- **Órfão MP / sem `pagamentos_pix`:** aprovado no MP **sem** crédito automático até intervenção.

### Médio

- Resposta **200** antes do crédito — dependência de retentativas + reconcile.
- **Múltiplas instâncias** com `reconciling` só local.
- **Fallback JS** vs RPC (janela e múltiplas round-trips).
- Schema real sem `UNIQUE(payment_id)` (não verificado aqui).

### Baixo

- `claim_lost` como condição de corrida benigna.
- Divergência futura `amount`/`valor` com warning em leitura.

---

## 13. Diagnóstico final

O **BLOCO A** na V1 está **bem desenhado para idempotência de crédito** e **alinhamento webhook/reconcile** através de uma função única de crédito e, quando implantada, **RPC transacional**. As **lacunas principais** são **órfãos** (MP sem linha local) e **validação opcional** do webhook quando o secret não está definido — ambas **configuração e operações**, não falhas do caminho feliz típico.

**Classificação final obrigatória:** **BLOCO A COM RISCOS MODERADOS**.

---

## 14. Próxima etapa recomendada

1. Garantir **`MERCADOPAGO_WEBHOOK_SECRET`** em todos os ambientes expostos à internet e revisar **`NODE_ENV`** para política de rejeição.
2. Confirmar no Supabase **constraint UNIQUE em `payment_id`** (ou equivalente) e presença das RPCs referenciadas.
3. Playbook de suporte para **`PIX_ORFAO_MP` / `mercado_pago_payment_id`**: criar linha ou creditar manualmente após verificação no MP.
4. Monitorizar logs **`[WEBHOOK] creditar PIX: pix_not_found`** para detetar órfãos ou referências incorretas.

---

*Fim do relatório. Base: `server-fly.js` (PIX, webhook, crédito, reconcile), `utils/webhook-signature-validator.js`, `utils/financialNormalization.js`, `database/rpc-financeiro-atomico-2026-03-28.sql`.*
