# Auditoria READ-ONLY — Mercado Pago: configuração e uso reais (V1)

**Modo:** leitura do repositório apenas (sem alterações de código).  
**Data de referência:** 2026-03-29.  
**Runtime de produção documentado:** `Dockerfile` → `CMD ["node", "server-fly.js"]`; `fly.toml` → `app = "goldeouro-backend-v2"`.

---

## 1. Configuração real (não teórica)

### 1.1 Onde aparecem as três variáveis (inventário)

| Símbolo | Ficheiros relevantes (código ativo V1) | Notas |
|--------|----------------------------------------|--------|
| `MERCADOPAGO_ACCESS_TOKEN` | `server-fly.js` (assert, teste de ligação, PIX, webhook, reconcile); `config/required-env.js` (via `onlyInProduction`); `config/production.js` (espelho `process.env`); `controllers/paymentController.js` (legado); `server-fly-deploy.js` (entrada alternativa não usada pelo `Dockerfile` atual) | Não está no `.env.example` raiz (ficheiro principal de exemplo atual); existe em `env.example` (legado/alternativo). |
| `MERCADOPAGO_WEBHOOK_SECRET` | `server-fly.js` (condicional no webhook); `utils/webhook-signature-validator.js` | `.env.example` raiz: linha comentada `# MERCADOPAGO_WEBHOOK_SECRET=`; `env.example` com placeholder. |
| `BACKEND_URL` | `server-fly.js` (`notification_url` com fallback); `controllers/paymentController.js` (sem fallback); `config/production.js` (fallback **diferente** do `server-fly.js`); vários `scripts/*.js` com constantes próprias | `fly.toml` **não** define estas chaves (secrets vão no runtime Fly). |

### 1.2 Estão definidas “em algum lugar”?

- **No repositório:** apenas **nomes** e **exemplos** (`.env.example`, `env.example`, documentação). **Valores reais de produção não devem existir no Git** (esperado).
- **Em runtime:** definidas pelo operador (ex.: `fly secrets set`, painel da plataforma). O código lê sempre `process.env.*`.

### 1.3 Estão sendo lidas corretamente?

- **Sim**, no caminho ativo `server-fly.js`: leitura direta de `process.env.MERCADOPAGO_ACCESS_TOKEN`, `process.env.MERCADOPAGO_WEBHOOK_SECRET`, `process.env.BACKEND_URL`.
- O validador instanciado no arranque (`new WebhookSignatureValidator()`) fixa `this.secret` a partir de `process.env.MERCADOPAGO_WEBHOOK_SECRET` **na construção**; alterações posteriores à env em runtime não atualizam essa instância sem reinício do processo (comportamento normal de processo Node de longa duração).

### 1.4 Existe fallback?

| Variável | Fallback no `server-fly.js`? |
|----------|------------------------------|
| `MERCADOPAGO_ACCESS_TOKEN` | **Não** para chamadas MP: usa `process.env` direto. Arranque: em `NODE_ENV=production`, `assertRequiredEnv` **falha** se vazio. Fora de produção, o processo pode arrancar sem token, mas `testMercadoPago()` falha e `mercadoPagoConnected` fica falso. |
| `MERCADOPAGO_WEBHOOK_SECRET` | **Não**: se ausente, o ramo de validação HMAC **não executa**. |
| `BACKEND_URL` | **Sim**: `` `${process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'}/api/payments/webhook` `` na criação do PIX. |

### 1.5 Múltiplas definições conflitantes?

- **`config/production.js`** define `BACKEND_URL` com fallback `https://goldeouro-backend.fly.dev` (sem `-v2`), enquanto **`server-fly.js`** usa fallback `https://goldeouro-backend-v2.fly.dev`.  
- O monólito em produção pelo `Dockerfile` é **`server-fly.js`**, que **não** importa `config/production.js` no fluxo verificado para PIX/webhook. O conflito é **entre ficheiros de configuração legado/espelho e o servidor ativo**, não dentro do mesmo ficheiro.
- **`controllers/paymentController.js`**: `notification_url` sem `||` — com `BACKEND_URL` ausente gera URL com `undefined`. Esta rota **não** está montada em `server-fly.js` (não há `require` de `paymentRoutes`); trata-se de **caminho legado / testes**, não do fluxo V1 do deploy atual.

---

## 2. Uso real no sistema

### 2.1 PIX — criação

- **Endpoint:** `POST /api/payments/pix/criar` (JWT `authenticateToken`).
- **`MERCADOPAGO_ACCESS_TOKEN`:** enviado como `Authorization: Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` no `POST https://api.mercadopago.com/v1/payments`.
- **`notification_url`:** base `process.env.BACKEND_URL` com fallback literal para `https://goldeouro-backend-v2.fly.dev`, sufixo fixo `/api/payments/webhook`.
- **Pré-condição operacional:** `mercadoPagoConnected === true` (derivado de `testMercadoPago()` no startup, que exige token); caso contrário resposta **503** na criação.

### 2.2 Webhook

- **Endpoint:** `POST /api/payments/webhook`.
- **Validação de assinatura:** só se `process.env.MERCADOPAGO_WEBHOOK_SECRET` for truthy; chama `webhookSignatureValidator.validateMercadoPagoWebhook(req)` (manifest HMAC-SHA256 conforme cabeçalho `x-signature`, `data.id`, `x-request-id`, janela `MP_WEBHOOK_TS_SKEW_SEC`).
- **Comportamento se o secret NÃO existir:** o bloco de validação é **omitido por completo**; o handler segue para `next()` e processa o corpo como hoje.
- **Com secret definido e assinatura inválida:** em `NODE_ENV === 'production'` → **401**; em ambiente **não** produção → aviso em log e **`next()` continua** (o fluxo assíncrono após 200 ainda pode processar o pagamento).

### 2.3 Consulta Mercado Pago `GET /v1/payments/{id}`

- **Webhook:** após `type === 'payment'` e `data.id` numérico válido, `axios.get('https://api.mercadopago.com/v1/payments/${paymentId}', …)` com Bearer `process.env.MERCADOPAGO_ACCESS_TOKEN`; só credita se `payment.data.status === 'approved'`.
- **Reconcile:** `reconcilePendingPayments()` usa o mesmo padrão de URL e header para pendentes antigos; desativável via `MP_RECONCILE_ENABLED=false`.

### 2.4 Crédito de saldo

- Função central: `creditarPixAprovadoUnicoMpPaymentId` → RPC `creditar_pix_aprovado_mp` se `FINANCE_ATOMIC_RPC !== 'false'`, senão fallback JS `creditarPixAprovadoUnicoMpPaymentIdJsLegacy`.

---

## 3. Validação real vs checklist (tabela pedida)

| Item | Implementado no código? | Funcional sem env? | Depende de runtime? | Pode estar OK no checklist como PENDENTE? |
|------|-------------------------|--------------------|---------------------|-------------------------------------------|
| `MERCADOPAGO_ACCESS_TOKEN` | **Sim** (PIX, GET pagamento, teste MP) | **Não** em produção (assert impede arranque se vazio). Em dev, arranque pode ocorrer mas PIX retorna **503** se MP não “ligado”. | **Sim** | **Sim** — “pendente” no checklist costuma significar **não confirmado no ambiente** ou **não documentado no `.env.example` principal**, não ausência de implementação. |
| `MERCADOPAGO_WEBHOOK_SECRET` | **Sim** (validação condicional) | **Sim** no sentido de o servidor **aceitar** webhooks sem HMAC; **não** “OK” do ponto de vista de segurança operacional. | **Sim** | **Sim** — pendente = **config operacional não garantida** pelo repositório; o código **permite** ausência. |
| `BACKEND_URL` | **Sim** (`notification_url`) | **Sim** via fallback fixo para `goldeouro-backend-v2.fly.dev` no `server-fly.js`. | **Sim** (URL correta por deploy) | **Sim** — se o deploy real for outro host, “pendente” no checklist reflete **risco de URL errada apesar do código compilar**. |

---

## 4. Falsos positivos

1. **`BACKEND_URL` “faltando” no env local:** o código **não** deixa `notification_url` vazia no caminho `server-fly.js`; usa fallback. “Pendente” pode ser **validação humana** de que a URL aponta para **este** deploy.
2. **`MERCADOPAGO_WEBHOOK_SECRET`:** checklist marca risco operacional; **não** significa que o webhook “não está implementado” — significa que **a autenticação HMAC pode estar desligada**.
3. **Conflito `config/production.js` vs `server-fly.js`:** falso problema **se** nada importar `production.js` no processo real; verificação: entrada é `server-fly.js` pelo `Dockerfile`.
4. **`paymentController.js`:** pode sugerir URL quebrada sem `BACKEND_URL`, mas **não** é o servidor Fly atual.

---

## 5. Fluxo real de execução (passo a passo)

1. **Criação do PIX:** cliente autenticado chama `POST /api/payments/pix/criar` → validações de valor → se `mercadoPagoConnected`, monta `paymentData` com `notification_url` → `POST /v1/payments` com Bearer token e idempotency key.
2. **Envio ao Mercado Pago:** resposta deve conter `id` e dados PIX (`point_of_interaction.transaction_data`).
3. **Persistência local:** insert em `pagamentos_pix` com `pending`; falha após MP OK → log `[PIX-ORFAO-MP]` e 500 com `mercado_pago_payment_id`.
4. **Webhook recebido:** MP chama `POST /api/payments/webhook` → opcional HMAC → resposta **200** `{ received: true }` **de imediato**.
5. **Validação:** se `type === 'payment'` e `data.id` válido → `GET /v1/payments/{id}` com Bearer; se status ≠ `approved`, retorna sem creditar.
6. **Crédito:** `creditarPixAprovadoUnicoMpPaymentId` (RPC ou JS) com idempotência por pagamento MP.
7. **Reconcile:** job periódico (se habilitado) repete consulta MP + mesma função de crédito para pendentes antigos.

---

## 6. Pontos críticos reais (prática)

| Pergunta | Resposta objetiva |
|----------|-------------------|
| O sistema funciona **sem** webhook secret? | **Sim**, no sentido de **processar** notificações: o código **não** bloqueia o fluxo se o secret estiver ausente. O crédito continua a depender de **GET MP** + linha em `pagamentos_pix` + status `approved`. |
| O sistema funciona **sem** `BACKEND_URL`? | **Sim** no `server-fly.js`, com **URL de notificação fixa** no fallback (`goldeouro-backend-v2.fly.dev`). Pode estar **errado** para outro ambiente. |
| O sistema funciona **sem** `ACCESS_TOKEN`? | **Em produção, não** arranca (`assertRequiredEnv`). **Em dev**, pode arrancar; criação PIX **503** se MP não conectado; webhook/reconcile falham nas chamadas à API MP sem token válido. |
| Obrigatório vs opcional **na prática** | **Obrigatório para fluxo MP real:** token válido + Supabase. **Obrigatório para segurança do POST público:** secret + `NODE_ENV=production` (para rejeitar assinatura inválida quando secret existe). **Opcional no código mas crítico por deploy:** `BACKEND_URL` alinhada ao host público real. |

---

## 7. Conclusão final

### STATUS REAL DO MERCADOPAGO NA V1

**CONFIGURADO MAS DEPENDE DE ENV (Fly / produção)**

**Justificativa única:** o repositório contém **integração completa** (criação PIX, webhook, consulta `GET /v1/payments/{id}`, reconcile, crédito idempotente). Não há “integração por implementar” no caminho `server-fly.js`. O que **não** pode ser inferido só pelo código é se **no Fly** estão definidos token, secret e URL corretos para **esse** deploy — isso é **runtime**, não ficheiro no Git.

---

## Diferença: “PENDENTE NO CHECKLIST” vs “REALMENTE FALTANDO”

| Situação | Interpretação |
|----------|----------------|
| Checklist **PENDENTE** para `MERCADOPAGO_WEBHOOK_SECRET` / `BACKEND_URL` | Na maior parte dos casos: **item operacional não verificado** ou **não exigido no arranque pelo código** — **não** prova que falta implementação. |
| **Realmente faltando** | Ausência de **token** em produção (processo não sobe) ou token inválido; ou URL de notificação que o MP não consegue atingir; ou secret omitido quando a política de segurança exige HMAC. |

---

## Por que apareceu como pendente (resposta final)

- Os checklists tratam **secrets e URL pública** como **verificação manual / ambiente**, porque **não estão** (nem devem estar) no repositório com valores reais.
- O código **não falha no arranque** por falta de `MERCADOPAGO_WEBHOOK_SECRET` nem de `BACKEND_URL`, logo qualquer checklist rigoroso marca esses pontos como **PENDENTE** até haver **prova no runtime** (Fly secrets, teste de webhook, URL no painel MP).
- Isso é em grande parte **ausência de validação automática no repositório**, não ausência de integração Mercado Pago no código.

---

## Referências de código (âncoras)

```48:53:e:\Chute de Ouro\goldeouro-backend\server-fly.js
// Validação das variáveis de ambiente obrigatórias
const { assertRequiredEnv, isProduction } = require('./config/required-env');
assertRequiredEnv(
  ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] }
);
```

```162:191:e:\Chute de Ouro\goldeouro-backend\server-fly.js
async function testMercadoPago() {
  if (!mercadoPagoAccessToken) {
    console.log('⚠️ [MERCADO-PAGO] Token não configurado');
    return false;
  }
  // ...
}
```

```1736:1774:e:\Chute de Ouro\goldeouro-backend\server-fly.js
      const paymentData = {
        // ...
        notification_url: `${process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'}/api/payments/webhook`
      };
      // ...
      const response = await axios.post(
        'https://api.mercadopago.com/v1/payments',
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
```

```2094:2156:e:\Chute de Ouro\goldeouro-backend\server-fly.js
app.post('/api/payments/webhook', async (req, res, next) => {
  // Validar signature apenas se MERCADOPAGO_WEBHOOK_SECRET estiver configurado
  if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    const validation = webhookSignatureValidator.validateMercadoPagoWebhook(req);
    if (!validation.valid) {
      // ...
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
```

```2134:2147:e:\Chute de Ouro\goldeouro-backend\server-fly.js
      const payment = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
```

```2276:2283:e:\Chute de Ouro\goldeouro-backend\server-fly.js
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
          timeout: 5000
        });
        const status = resp?.data?.status;
        if (status === 'approved') {
          const creditResult = await creditarPixAprovadoUnicoMpPaymentId(mpId);
```

```27:30:e:\Chute de Ouro\goldeouro-backend\config\production.js
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://goldeouro.vercel.app',
  ADMIN_URL: process.env.ADMIN_URL || 'https://admin.goldeouro.vercel.app',
  BACKEND_URL: process.env.BACKEND_URL || 'https://goldeouro-backend.fly.dev',
```

```14:16:e:\Chute de Ouro\goldeouro-backend\Dockerfile
EXPOSE 8080

CMD ["node", "server-fly.js"]
```

---

*Fim do relatório.*
