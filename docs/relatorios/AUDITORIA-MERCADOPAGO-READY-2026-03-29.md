# Auditoria READ-ONLY — Prontidão Mercado Pago (PIX + webhook)

**Projeto:** Gol de Ouro (backend)  
**Data:** 2026-03-29  
**Escopo:** Apenas leitura do código; sem alterações nem recomendações de implementação.  
**Runtime de produção assumido pelo repositório:** `Dockerfile` executa `node server-fly.js` com `NODE_ENV=production`.

---

## 1. Configuração obrigatória

### `MERCADOPAGO_ACCESS_TOKEN`

| Onde é usado | Comportamento se ausente / frágil |
|--------------|-----------------------------------|
| `config/required-env.js` + arranque em `server-fly.js` | Em **`NODE_ENV=production`**, `assertRequiredEnv` inclui esta chave em `onlyInProduction`; ausência → **lança erro** no startup (`Variáveis de ambiente ausentes: …`). Fora de produção, **não** é obrigatória pelo assert. |
| `server-fly.js` | `testMercadoPago()`; criação PIX (`Authorization: Bearer …`); webhook (`GET /v1/payments/{id}`); reconcile. |
| `controllers/paymentController.js` | `MercadoPagoConfig({ accessToken: … })` — **caminho alternativo**; ver nota abaixo. |

**Fallback perigoso:** não há token “default” no código de `server-fly.js`; sem token em produção o processo nem sobe (assert). Em não-produção, PIX pode falhar em runtime ao chamar a API MP.

### `MERCADOPAGO_WEBHOOK_SECRET`

| Onde é usado | Comportamento se ausente |
|--------------|--------------------------|
| `utils/webhook-signature-validator.js` | `this.secret = process.env.MERCADOPAGO_WEBHOOK_SECRET`; `validateMercadoPagoWebhook` retorna erro se secret ausente **quando invocado**, mas o handler só invoca se a env estiver definida. |
| `server-fly.js` — `POST /api/payments/webhook` | Se **`process.env.MERCADOPAGO_WEBHOOK_SECRET`** é falsy, **todo o bloco de validação é ignorado**; o fluxo segue sem HMAC. |

**Fallback perigoso:** **sim** — ausência do secret **não** impede o arranque e **não** rejeita POST; o endpoint fica processável por qualquer cliente que envie corpo plausível (o crédito ainda depende de `GET` na API MP com token, mas a superfície de abuso e custo de chamadas aumenta).

### `BACKEND_URL`

| Onde é usado | Comportamento se ausente |
|--------------|--------------------------|
| `server-fly.js` (criação PIX) | Campo `notification_url`: usa env `BACKEND_URL`; se vazia, cai no literal `https://goldeouro-backend-v2.fly.dev` e acrescenta `/api/payments/webhook`. |
| `controllers/paymentController.js` | Campo `notification_url`: só `BACKEND_URL` + `/api/payments/webhook`, **sem** fallback; env ausente gera URL com trecho `undefined`. Não é o caminho do `server-fly.js` em produção. |

**Fallback perigoso:** **sim** — se `BACKEND_URL` não estiver definida no `server-fly.js`, o MP recebe **URL fixa** nesse host Fly. Deploy noutro sítio sem env correto pode enviar webhooks para o destino errado.

### `NODE_ENV`

| Onde é usado | Efeito |
|--------------|--------|
| `Dockerfile` | `ENV NODE_ENV=production` |
| `server-fly.js` — webhook | Com secret definido e assinatura inválida: **`production` → 401**; caso contrário apenas `console.warn` e segue. |
| `config/required-env.js` | Ativa exigência extra de `MERCADOPAGO_ACCESS_TOKEN` só em produção. |

**Fallback perigoso:** se produção correr **sem** `NODE_ENV=production`, assinaturas inválidas podem ser **apenas logadas** e o fluxo continuar.

---

## 2. Criação de PIX

| Item | Evidência no código |
|------|---------------------|
| **Endpoint (fluxo alinhado ao player)** | `POST /api/payments/pix/criar` em `server-fly.js`, autenticado (`authenticateToken`). O frontend referencia o mesmo path em `goldeouro-player/src/config/api.js`. |
| **`notification_url`** | Incluída no `paymentData` enviado ao MP, sufixo `/api/payments/webhook` (ver secção 1). |
| **Consistência de valores** | `transaction_amount: parseFloat(amount)` e insert em `pagamentos_pix` com `amount: parseFloat(amount)` — mesma origem (`req.body.amount`). Limite handler: 1–1000 BRL. |
| **Pré-requisito MP “ligado”** | Se `!mercadoPagoConnected` → **503** (“Sistema de pagamento temporariamente indisponível”). `mercadoPagoConnected` vem de `testMercadoPago()` no startup. |
| **Supabase após MP OK** | Se DB indisponível após MP criar cobrança → **503** e log `❌ [PIX] MP criou cobrança mas Supabase indisponível`. |
| **Logs** | Sucesso: `💰 [PIX] PIX real criado: …`; erro MP: `❌ [PIX] Erro Mercado Pago:`; opcional diagnóstico se `debug=1` / `debug: true` no body. |
| **Idempotência MP** | Header `X-Idempotency-Key` único por pedido (prefixo `pix_`, userId, timestamp e bytes aleatórios; ver `server-fly.js`). |

---

## 3. Webhook

| Item | Evidência no código |
|------|---------------------|
| **Rota** | `POST /api/payments/webhook` em `server-fly.js`. |
| **Validação de assinatura** | Só executada se `MERCADOPAGO_WEBHOOK_SECRET` está definida; usa `webhookSignatureValidator.validateMercadoPagoWebhook(req)` (manifest `id` + `ts`, HMAC-SHA256, janela `MP_WEBHOOK_TS_SKEW_SEC`, default 600 s). |
| **Comportamento sem secret** | Ramo de validação **não corre**; não há 401 por falta de assinatura. |
| **Resposta HTTP** | **`res.status(200).json({ received: true })` imediatamente** no início do handler assíncrono; processamento (consulta MP + crédito) ocorre **depois** da resposta. |
| **Dependência do MP para confirmação** | **Sim.** Após notificação, o código faz `GET https://api.mercadopago.com/v1/payments/{id}` com `Bearer MERCADOPAGO_ACCESS_TOKEN` e só prossegue se `payment.data.status === 'approved'`. |
| **Erros** | Assinatura inválida em produção: **401** + JSON de erro. Falhas internas: `❌ [WEBHOOK] Erro:` no log. |

---

## 4. Crédito

| Item | Evidência no código |
|------|---------------------|
| **Função central** | `creditarPixAprovadoUnicoMpPaymentId(paymentIdStr)` em `server-fly.js`. Usada pelo **webhook** e por **`reconcilePendingPayments`**. |
| **Preferência RPC** | Se `FINANCE_ATOMIC_RPC !== 'false'` (default), chama `supabase.rpc('creditar_pix_aprovado_mp', { p_payment_id: paymentIdStr })`. |
| **Idempotência** | RPC em `database/rpc-financeiro-atomico-2026-03-28.sql`: `FOR UPDATE` em `pagamentos_pix`, retorno `already_processed` se já `approved`, transação saldo + `approved` atómica; motivos `claim_lost`, `saldo_race`, etc. |
| **Fallback JS** | `creditarPixAprovadoUnicoMpPaymentIdJsLegacy`: claim `pending`→`approved` + update saldo com lock otimista; reverte para `pending` se utilizador/saldo falharem. |
| **Relação com `pagamentos_pix`** | Sem linha com `payment_id` ou `external_id` correspondente → **`pix_not_found`** (RPC e legado). Webhook/reconcile **não** creditam pagamento “órfão” só no MP. |
| **Logs** | `💰 [PIX-CREDIT] RPC crédito OK …`; avisos/erros `⚠️/❌ [PIX-CREDIT] …`; webhook loga `❌ [WEBHOOK] creditar PIX:` com `reason`. |

---

## 5. PIX órfão (MP OK, sem linha local)

| Item | Evidência no código |
|------|---------------------|
| **Detecção** | Após `POST` MP bem-sucedido, falha do `insert` em `pagamentos_pix` em `server-fly.js`. |
| **Logs** | `console.error` com prefixo **`❌ [PIX-ORFAO-MP]`** e `JSON.stringify` com `tag: 'PIX_ORFAO_MP'`, `mercado_pago_payment_id`, `usuario_id`, `amount_brl`, erro Supabase. |
| **Resposta ao cliente** | **500** com mensagem de suporte e `data: { mercado_pago_payment_id: payment.id }`. |
| **Recuperação automática no código** | **Não** para este caso: `reconcilePendingPayments` só percorre linhas **`pending`** já existentes em `pagamentos_pix`. Pagamento aprovado no MP sem linha local **não** entra nesse ciclo. Recuperação depende de **ação manual** (operador + MP + base), usando o `payment_id` exposto no erro/log. |

**Nota:** `src/domain/ledger/reconcileMissingLedger.js` trata **ledger** para depósitos já `approved` na tabela; **não** substitui insert falhado nem cria linha em `pagamentos_pix`.

---

## 6. Logs — presença das tags pedidas

| Tag / prefixo | Presente no código (referência) |
|---------------|----------------------------------|
| **PIX-ORFAO-MP** | Sim — mensagem e objeto JSON no fluxo de falha de insert após MP OK (`server-fly.js`). |
| **WEBHOOK** | Sim — `📨 [WEBHOOK]`, `❌ [WEBHOOK] Signature inválida`, `⚠️ [WEBHOOK]`, `❌ [WEBHOOK] creditar PIX`, etc. (`server-fly.js`; também mensagens em `webhook-signature-validator.js` no middleware genérico, não usado pelo handler principal da mesma forma). |
| **RECON** | Sim — `[RECON]` na reconciliação periódica, erros, avisos de coluna `reconcile_skip`, sucesso `✅ [RECON]` (`server-fly.js`). |

---

## 7. Código paralelo no repositório (não é o caminho do `server-fly.js`)

- `controllers/paymentController.js`, `services/pix-*.js`, `routes/mpWebhook.js`, `server-fly-deploy.js` contêm fluxos ou URLs alternativas (ex.: `PIX_WEBHOOK_URL`, preference API, paths `/api/payments/pix/webhook`). **O entrypoint de produção documentado no `Dockerfile` não monta `paymentRoutes` no `server-fly.js`** (nenhum `require` de `paymentController`/`paymentRoutes` encontrado). A auditoria de “prontidão” do deploy atual baseia-se no monólito **`server-fly.js`**.

---

## Classificação final

**PRONTO COM RESSALVAS**

**Motivação (somente com base no código):**

- O fluxo **criar PIX → `notification_url` → webhook → consulta MP → `creditarPixAprovadoUnicoMpPaymentId`** está **implementado de forma coerente** no `server-fly.js`, com **idempotência** forte quando a RPC `creditar_pix_aprovado_mp` existe e fallback JS documentado.
- **Ressalvas objetivas:** (1) validação HMAC **opcional** à presença de `MERCADOPAGO_WEBHOOK_SECRET`; (2) **`BACKEND_URL`** com **fallback fixo** para um host Fly concreto; (3) **`NODE_ENV`** fora de `production` **suaviza** rejeição de assinatura; (4) **órfão MP** sem linha em `pagamentos_pix` **não** tem recuperação automática no código; (5) operação “ótima” assume **RPC aplicada** no Supabase (senão usa legado JS com janela diferente da RPC).

Não foi classificado **PRONTO PARA PRODUÇÃO** porque o arranque **não exige** `MERCADOPAGO_WEBHOOK_SECRET` nem `BACKEND_URL`, e o webhook **aceita tráfego sem HMAC** se o secret não estiver definido.

Não foi classificado **NÃO PRONTO** porque, **com as variáveis corretas e RPC disponível**, o desenho do caminho principal é utilizável e alinhado ao cliente que chama `/api/payments/pix/criar`.

---

*Fim do relatório.*
