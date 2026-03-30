# AUDITORIA CIRÚRGICA — WEBHOOK + RECONCILE PIX

**Escopo:** somente webhook Mercado Pago + reconcile PIX (read-only no código).  
**Data:** 2026-03-28.  
**Entrada de produção referenciada:** `server-fly.js` é o `main` / `npm start` em `package.json`.

---

## 1. Resumo executivo

- O webhook **é atingido**, mas em `NODE_ENV === 'production'` com `MERCADOPAGO_WEBHOOK_SECRET` definido a validação **falha antes de qualquer crédito**, com `401` e log `❌ [WEBHOOK] Signature inválida: Formato de signature inválido`.
- A causa não é “secret errado” nem HMAC que “não bate” ainda: o parser **nunca aceita** o formato real do header `x-signature` do Mercado Pago, e o HMAC calculado no projeto usa **mensagem errada** (corpo JSON em vez do *manifest* oficial).
- O reconcile (`reconcilePendingPayments`) lista `pagamentos_pix` pendentes e usa `payment_id` ou `external_id` como ID numérico da API `/v1/payments/{id}`. Valores não numéricos (ex.: string estilo `deposito_...`) geram `❌ [RECON] ID de pagamento inválido (não é número)` e são ignorados — **ruído e falha de reconciliação** para essas linhas.
- O fluxo **canónico atual** em `server-fly.js` para criar PIX grava o **ID real** do pagamento MP em `payment_id` / `external_id`. A string `deposito_<user>_<timestamp>` aparece no código como **`external_reference` enviado ao MP** em outro fluxo (`paymentController.js`), não como ID MP; linhas com esse padrão nas colunas de ID indicam **dados legados / contaminação / outro caminho**, não o insert atual do `server-fly.js`.

---

## 2. Fluxo real do webhook no código

### 2.1 Rota e stack

| Item | Valor |
|------|--------|
| Rota HTTP | `POST /api/payments/webhook` |
| Arquivo | `server-fly.js` |
| Primeiro handler | Valida assinatura (condicional) e chama `next()` |
| Segundo handler | Processa `req.body`, responde `200` imediatamente, depois consulta MP e credita |

Trecho da montagem da rota e da resposta em falha de assinatura (produção):

```2037:2056:e:\Chute de Ouro\goldeouro-backend\server-fly.js
app.post('/api/payments/webhook', async (req, res, next) => {
  // Validar signature apenas se MERCADOPAGO_WEBHOOK_SECRET estiver configurado
  if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    const validation = webhookSignatureValidator.validateMercadoPagoWebhook(req);
    if (!validation.valid) {
      console.error('❌ [WEBHOOK] Signature inválida:', validation.error);
      // Em produção, rejeitar; em desenvolvimento, apenas logar
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          error: 'Webhook signature inválida',
          message: validation.error
        });
      } else {
        console.warn('⚠️ [WEBHOOK] Signature inválida ignorada em modo não-produção');
      }
    } else {
      req.webhookValidation = validation;
    }
  }
  next();
}, async (req, res) => {
```

**Middlewares globais relevantes:** `express.json` com `verify` que preenche `req.rawBody` (necessário para qualquer validação baseada em bytes do corpo — embora o MP oficial use *manifest*, não o corpo cru).

```310:320:e:\Chute de Ouro\goldeouro-backend\server-fly.js
// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString('utf8');
    } catch (e) {
      req.rawBody = undefined;
    }
  }
}));
```

**Nota:** `routes/paymentRoutes.js` também declara `POST /webhook` ligado a `PaymentController.webhookMercadoPago`, mas o **`package.json` aponta `server-fly.js`**; não há evidência no escopo auditado de que esse router substitua a rota inline no deploy Fly. O webhook efetivo da stack atual é o de `server-fly.js`.

### 2.2 Leitura de headers e payload na validação

Implementação em `validateMercadoPagoWebhook`:

```144:160:e:\Chute de Ouro\goldeouro-backend\utils\webhook-signature-validator.js
  validateMercadoPagoWebhook(req) {
    try {
      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];
      const payload = typeof req.rawBody === 'string' && req.rawBody.length > 0 
        ? req.rawBody 
        : JSON.stringify(req.body);

      if (!signature) {
        return {
          valid: false,
          error: 'Header X-Signature não encontrado'
        };
      }

      const validation = this.validateSignature(payload, signature, timestamp);
```

**Headers que o código usa hoje**

- `x-signature` — sim.
- `x-timestamp` — usado opcionalmente; **o Mercado Pago documenta o timestamp dentro de `x-signature` como `ts=...`, não como `x-timestamp`** (ver doc oficial citada na seção 5).
- **Não usa** `x-request-id`, exigido pelo *manifest* oficial.
- **Não usa** `data.id` da query string, que o doc oficial pode exigir para montar o `id:` do template.

### 2.3 Parsing da signature e condição exata do erro

```117:130:e:\Chute de Ouro\goldeouro-backend\utils\webhook-signature-validator.js
  parseSignature(signature) {
    try {
      // Formato esperado: "sha256=hash" ou "sha1=hash"
      const match = signature.match(/^(sha256|sha1)=([a-f0-9]+)$/i);
      
      if (!match) {
        return null;
      }

      return {
        algorithm: match[1].toLowerCase(),
        hash: match[2].toLowerCase()
      };
```

Se `parseSignature` retorna `null`, `validateSignature` devolve exatamente:

```42:48:e:\Chute de Ouro\goldeouro-backend\utils\webhook-signature-validator.js
      const signatureParts = this.parseSignature(signature);
      if (!signatureParts) {
        return {
          valid: false,
          error: 'Formato de signature inválido'
        };
      }
```

Isso corresponde **literalmente** ao log visto no Fly: `Formato de signature inválido`.

### 2.4 Algoritmo de hash esperado pelo código atual (incompatível com MP)

```137:142:e:\Chute de Ouro\goldeouro-backend\utils\webhook-signature-validator.js
  calculateHash(payload, algorithm) {
    const hmac = crypto.createHmac(algorithm, this.secret);
    hmac.update(payload, 'utf8');
    return hmac.digest('hex');
  }
```

Ou seja: HMAC-SHA256 (ou SHA1) do **`payload` = corpo bruto JSON**, comparado ao que o parser extrairia como `sha256=...`. O Mercado Pago **não** envia esse formato; envia `ts=...,v1=<hex>` e o HMAC é sobre o **template *manifest***, não sobre o body.

### 2.5 Resposta HTTP em falha

- **Produção + secret configurado + validação inválida:** `401` com JSON `{ success: false, error: 'Webhook signature inválida', message: <erro> }` — ver `server-fly.js` acima.
- O segundo handler **não executa** nesse caso (não há `next()` após o `return`).

---

## 3. Fluxo real da criação do PIX no código

### 3.1 Rota canónica no deploy atual (`server-fly.js`)

| Item | Valor |
|------|--------|
| Rota | `POST /api/payments/pix/criar` |
| Auth | `authenticateToken` |
| API MP | `POST https://api.mercadopago.com/v1/payments` |
| `external_reference` | `` `goldeouro_${req.user.userId}_${Date.now()}` `` |
| `notification_url` | `` `${process.env.BACKEND_URL || '...'}/api/payments/webhook` `` |

Insert em `pagamentos_pix` (ID MP real):

```1742:1754:e:\Chute de Ouro\goldeouro-backend\server-fly.js
      const { data: pixRecord, error: insertError } = await supabase
        .from('pagamentos_pix')
        .insert(
          dualWritePagamentoPixRow({
            usuario_id: req.user.userId,
            payment_id: String(payment.id),
            external_id: String(payment.id),
            amount: parseFloat(amount),
            status: 'pending',
            qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code || null
          })
        )
```

### 3.2 Onde nasce `deposito_<user>_<timestamp>`

No **controller** legado/alternativo (não inline no `server-fly.js`):

```60:75:e:\Chute de Ouro\goldeouro-backend\controllers\paymentController.js
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        external_reference: `deposito_${userId}_${Date.now()}`
      };

      const result = await preference.create({ body: preferenceData });

      // Salvar pagamento no banco
      const pid = String(result.id);
      const { data: pagamento, error } = await supabase
        .from('pagamentos_pix')
        .insert(
          dualWritePagamentoPixRow({
            usuario_id: userId,
            payment_id: pid,
            external_id: pid,
```

Aqui `deposito_...` é só o **`external_reference` da preferência** no Mercado Pago. No banco, **nesse trecho**, `payment_id` / `external_id` recebem `result.id` (ID da preferência retornado pelo SDK), **não** a string `deposito_...`.

### 3.3 `payment_id` vs `external_id` vs `external_reference`

| Conceito | Onde vive |
|----------|-----------|
| `external_reference` | Payload enviado ao MP (Checkout Pro preference ou Payments API); **não** é coluna mapeada em `dualWritePagamentoPixRow` |
| `payment_id` / `external_id` (DB) | Colunas em `pagamentos_pix`; `dualWritePagamentoPixRow` espelha ambas com o mesmo ID quando só um é passado |

```114:117:e:\Chute de Ouro\goldeouro-backend\utils\financialNormalization.js
  const row = {
    usuario_id,
    payment_id: pid || ext,
    external_id: ext || pid,
```

### 3.4 Onde o ID real do MP “deixa de ser usado”

- No fluxo **`server-fly.js`**, o ID numérico do pagamento **é** persistido; o problema de crédito observado alinha-se ao **webhook barrado**, não a esse insert.
- Se em produção existirem linhas com `payment_id` / `external_id` **não numéricos**, o ponto de contaminação **não** é o insert atual de `server-fly.js` (linhas 1747–1748); é **outro período/código/manual** ou confusão entre colunas vs campo `external_reference` no painel MP.

---

## 4. Fluxo real do reconcile no código

### 4.1 Função e agendamento

| Item | Valor |
|------|--------|
| Função | `reconcilePendingPayments` |
| Arquivo | `server-fly.js` |
| Ativação | `setInterval` se `MP_RECONCILE_ENABLED !== 'false'` (padrão: ativo) |
| Env | `MP_RECONCILE_MIN_AGE_MIN` (default 2), `MP_RECONCILE_LIMIT` (default 10), `MP_RECONCILE_INTERVAL_MS` (default 60000) |

### 4.2 Critério de seleção

```2138:2144:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    const { data: pendings, error: listError } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
      .eq('status', 'pending')
      .lt('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(limit);
```

### 4.3 Campo usado para consultar o MP

```2152:2172:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    for (const p of pendings) {
      const np = normalizePagamentoPixRead(p);
      const mpId = String(np.payment_id || np.external_id || '').trim();
      if (!mpId) continue;

      // ✅ CORREÇÃO SSRF: Validar mpId antes de usar na URL
      if (!/^\d+$/.test(mpId)) {
        console.error('❌ [RECON] ID de pagamento inválido (não é número):', mpId);
        continue;
      }
      
      const paymentId = parseInt(mpId, 10);
      ...
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
```

Ordem: **`payment_id`**, depois **`external_id`** (via `||`).

### 4.4 Crédito após status `approved`

Chama `creditarPixAprovadoUnicoMpPaymentId(mpId)` — mesma função usada pelo webhook após buscar o pagamento no MP (`server-fly.js` ~2089).

### 4.5 Lógica “correta” vs dados

- A lógica **está coerente** com a API MP: só faz sentido `GET /v1/payments/{id}` com **ID numérico** de pagamento.
- O erro `deposito_...` é **sintoma de dados incompatíveis** com esse endpoint (ou ID de preferência/ string errada gravada como se fosse payment id), **não** de um bug na expressão regular em si.

---

## 5. Causa raiz do erro de signature inválida

**Veredito técnico:** implementação **incompatível** com o protocolo documentado do Mercado Pago.

1. **Formato do header**  
   Documentação oficial (Webhooks — validação): `x-signature` no formato `ts=<valor>,v1=<hex>` (partes separadas por vírgula), com HMAC-SHA256 do *manifest*  
   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`  
   (com ressalvas se algum valor ausente).  
   O código só aceita `sha256=<hex>` ou `sha1=<hex>` (`webhook-signature-validator.js` linhas 117–121), logo **falha imediata** com `Formato de signature inválido`.

2. **Conteúdo assinado**  
   O projeto calcula HMAC sobre **`req.rawBody` / `JSON.stringify(req.body)`** (`calculateHash`), não sobre o *manifest*. Mesmo que o parser fosse corrigido, **a comparação com `v1` continuaria errada** sem trocar a mensagem assinada.

3. **Headers auxiliares**  
   Uso de `x-timestamp` separado não corresponde ao fluxo oficial (timestamp em `ts` dentro de `x-signature`).  
   Falta integrar `x-request-id` e o `data.id` conforme o template oficial (incluindo query `data.id` quando a notificação vier assim).

4. **Secret**  
   Variável usada: `MERCADOPAGO_WEBHOOK_SECRET` (`webhook-signature-validator.js` linha 7). Não é a causa do erro atual (que ocorre **antes** de comparar hashes). Há divergência de nome em outro arquivo (`pix-service-real.js` referencia `MERCADO_PAGO_WEBHOOK_SECRET`), risco de configuração inconsistente em outros módulos, **fora** do validador principal.

**Classificação da falha:** **parser errado** + **algoritmo/mensagem de assinatura errados** + **headers/template não alinhados ao MP**; não é validação “rígida demais” no sentido de segurança — é **especificação errada**.

---

## 6. Causa raiz do ID legado não numérico

- O reconcile usa `payment_id` ou `external_id` como string e exige `/^\d+$/` (`server-fly.js` linhas 2154–2160).
- Qualquer valor como `deposito_<uuid>_<timestamp>` nessas colunas **não** é um ID de `/v1/payments/`; o código **corretamente** recusa e loga.
- A string `deposito_...` **é definida** no código como **`external_reference`** em `paymentController.criarPagamentoPix` (linha 62), não como valor gravado nesse mesmo fluxo para `payment_id` (linhas 68–75 usam `result.id`).  
  Portanto, registros com esse padrão em `payment_id`/`external_id` indicam **legado, migração manual, outro serviço ou bug histórico**, não o caminho atual de `server-fly.js` POST `/api/payments/pix/criar`.

---

## 7. Dados legados impactados

- Linhas `pagamentos_pix` com `status = pending`, `approved_at` null e **`payment_id` ou `external_id` não numéricos** permanecem **inreconciliáveis** pelo job atual e geram **ruído** nos logs `[RECON]`.
- Esses registros **não** serão creditados pelo webhook enquanto o webhook retornar `401` por assinatura.
- Estratégias possíveis (apenas recomendação; sem execução nesta auditoria): marcar como `legacy_invalid_id` / `cancelled` / `manual_review`, ou corrigir IDs com base em consultas ao MP (se houver rastreio externo), ou excluir do *pool* do reconcile com filtro SQL `payment_id ~ '^[0-9]+$'` / equivalente.

**Ressalva documental MP:** a documentação menciona limitações de validação por assinatura para alguns fluxos de QR; validar no painel/integração se aplica ao seu tipo de notificação — **independentemente disso**, o código atual **não** implementa nem o formato `ts,v1` nem o *manifest*.

---

## 8. Correção mínima recomendada

1. **Webhook**  
   - Substituir a validação em `WebhookSignatureValidator` pela lógica oficial: parsear `x-signature` (`ts`, `v1`), ler `x-request-id`, obter `data.id` do body **e/ou** query conforme doc, montar o *manifest*, `HMAC-SHA256(secret, manifest)` em hex, comparação *timing-safe* com `v1`.  
   - Opcional: validar janela temporal com `ts` (atenção a segundos vs milissegundos conforme exemplos reais recebidos).  
   - Garantir que a rota do webhook tenha acesso a **query string** e corpo exatamente como o MP envia.

2. **Persistência do ID canónico**  
   - Manter o insert de `server-fly.js` (payment.id em `payment_id` / `external_id`) como referência; após webhook funcionar, o fluxo `creditarPixAprovadoUnicoMpPaymentId` / RPC encontrará a linha pelo ID MP.

3. **Reconcile e ruído legado**  
   - No *loop*, **pular** silenciosamente ou marcar registros com ID não numérico (em vez de só `console.error` repetido), **ou** filtrar na query Supabase com predicado “somente dígitos”, para não poluir logs e CPU.  
   - Tratar dados legados com política explícita (status ou coluna auxiliar), evitando misturar com pendentes “saudáveis”.

---

## 9. Arquivos que precisarão mudar

| Arquivo | Motivo |
|---------|--------|
| `utils/webhook-signature-validator.js` | Implementar validação compatível com MP (`ts,v1` + *manifest* + headers corretos). |
| `server-fly.js` | Possível ajuste na rota do webhook (ordem de parsers, acesso a `req.query['data.id']`, testes de produção). |
| `.env.example` (se existir) | Documentar um único nome canónico do secret alinhado ao painel MP. |
| Opcional: script SQL / job de saneamento | Marcar ou corrigir linhas `pagamentos_pix` com IDs não numéricos. |

**Fora do caminho crítico Fly mas confusão de produto:** `controllers/paymentController.js` e `routes/paymentRoutes.js` se ainda forem usados em algum deploy — alinhar assinatura e IDs ao mesmo padrão.

---

## 10. Veredito final

**PRONTO PARA CORREÇÃO CIRÚRGICA**

Motivo: as causas raiz estão **localizadas em código e contrato MP** (formato `x-signature`, *manifest*, headers), com linhas e funções identificáveis; o reconcile comporta-se como esperado para IDs numéricos, e o ruído `deposito_...` é **dados/caminho legado**, tratável com filtro ou saneamento após o webhook deixar de retornar `401`.
