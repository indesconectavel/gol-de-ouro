# RUNBOOK OPERACIONAL — V1 GOL DE OURO

**Modo:** operacional, alinhado ao código em `server-fly.js`, `routes/adminApiFly.js` e documentação de auditoria.  
**Data:** 2026-03-29  
**Público:** operações, suporte e administradores com acesso a logs de deploy, Supabase e painel Mercado Pago.

Este documento descreve **como o sistema se comporta** e **onde olhar**; alterações de schema ou SQL em produção são responsabilidade de quem tem permissões no Supabase, mantendo trilho de auditoria interno.

---

## 1. PIX órfão

**Definição (V1):** cobrança **criada no Mercado Pago** mas **sem linha correspondente** em `pagamentos_pix` no Supabase (ou linha impossível de associar ao ID do pagamento MP). O webhook e o reconcile **só creditam** quando encontram a linha por `payment_id` / `external_id` numérico igual ao ID MP.

### 1.1 Como identificar

| Fonte | O que procurar |
|-------|----------------|
| **Logs da aplicação** | Linha com prefixo **`❌ [PIX-ORFAO-MP]`** e JSON com `tag: "PIX_ORFAO_MP"`, `mercado_pago_payment_id`, `usuario_id`, `amount_brl`, erro Supabase (`server-fly.js`). |
| **Resposta HTTP ao jogador** | **500** com mensagem sobre falha ao registar localmente e, no corpo, `data.mercado_pago_payment_id` quando o MP já tinha criado o pagamento. |
| **Supabase** | Tabela `pagamentos_pix`: ausência de linha com `payment_id` = ID numérico do pagamento MP para o utilizador e valor esperados. |
| **Webhook** | Log **`❌ [WEBHOOK] creditar PIX: pix_not_found`** seguido do ID MP — indica notificação recebida mas **sem** linha local (inclui caso órfão ou ID incorreto). |

### 1.2 Como validar no Mercado Pago

1. No painel Mercado Pago (Conta / Pagamentos ou API), localizar o pagamento pelo **ID numérico** (`mercado_pago_payment_id` do log ou da resposta 500).
2. Confirmar **status** (`approved`, `pending`, etc.) e **valor** (`transaction_amount`).
3. Confirmar que o pagamento é **PIX** e corresponde ao período do incidente.
4. Opcional: consulta via API `GET /v1/payments/{id}` com o mesmo token usado pelo backend (`MERCADOPAGO_ACCESS_TOKEN`) — é o mesmo tipo de verificação que o próprio servidor faz após o webhook.

### 1.3 Como creditar manualmente

O backend **não** expõe, no código auditado, um endpoint público de “crédito manual” genérico. O caminho alinhado ao desenho V1:

1. **Só prosseguir se o pagamento estiver `approved` no MP** e o valor e o `usuario_id` forem inequívocos (log órfão ou suporte).
2. **Criar** em `pagamentos_pix` uma linha coerente com o que o código espera: `usuario_id`, `payment_id` e `external_id` como **string do ID MP**, `amount` e `valor` iguais ao valor em reais (o código usa *dual-write*; ver inserts em `server-fly.js` / `dualWritePagamentoPixRow` para o conjunto de colunas).
3. Estado inicial recomendado: **`pending`** se ainda for disparar o fluxo automático; em seguida:
   - **Opção A:** aguardar o **reconcile** (`reconcilePendingPayments`), que consulta o MP e chama `creditarPixAprovadoUnicoMpPaymentId` para pendentes antigos (parâmetros `MP_RECONCILE_MIN_AGE_MIN`, `MP_RECONCILE_INTERVAL_MS`, `MP_RECONCILE_ENABLED`).
   - **Opção B:** no Supabase SQL Editor, invocar a RPC **`creditar_pix_aprovado_mp`** com `p_payment_id` = ID MP em texto, **se** a função existir no projeto (`database/rpc-financeiro-atomico-2026-03-28.sql`).
4. **Evitar** apenas somar saldo em `usuarios` sem linha em `pagamentos_pix` **approved** — desalinha reconcile, relatórios e idempotência futura.

Registar **quem**, **quando** e **qual** `payment_id` foi corrigido.

---

## 2. Webhook falhou

### 2.1 Como verificar

| Verificação | Detalhe |
|-------------|---------|
| **Logs** | `❌ [WEBHOOK] Signature inválida` (produção com secret: **401** ao MP); `❌ [WEBHOOK] Erro:`; `❌ [WEBHOOK] creditar PIX:` + motivo (`pix_not_found`, `rpc_error`, etc.). |
| **Sucesso parcial** | O handler responde **200** `{ received: true }` **antes** de consultar o MP e creditar; falhas depois disso **não** mudam a resposta ao MP. |
| **Configuração** | `MERCADOPAGO_WEBHOOK_SECRET` alinhado ao painel MP; `MERCADOPAGO_ACCESS_TOKEN` válido para `GET /v1/payments/{id}`; `NODE_ENV=production` para rejeitar assinatura inválida. |
| **URL** | `BACKEND_URL` (ou fallback no código) deve ser a URL que o MP chama; path final **`/api/payments/webhook`**. |

### 2.2 Como reenviar

- O **Mercado Pago** retenta notificações conforme a política deles; no painel de integrações costuma existir opção de **reenviar notificação** para um pagamento.
- **Não** é necessário alterar código: novo POST ao webhook dispara de novo a consulta ao MP e o crédito idempotente (`already_processed` se já creditado).
- Se o problema foi **só** janela temporária (DB, timeout), o **reconcile** periódico pode creditar linhas `pending` com ID MP válido após o MP estar `approved`.

### 2.3 Como validar crédito

1. Em `pagamentos_pix`: linha com esse `payment_id` em **`approved`**.
2. Em `usuarios`: `saldo` refletindo o crédito (e consistente com histórico).
3. Logs: **`💰 [PIX-CREDIT] RPC crédito OK`** ou fallback JS equivalente; ou **`📨 [WEBHOOK] Pagamento já processado`** em reenvio.
4. Se usar RPC: resposta JSONB com `ok: true`, `reason: credited` ou `already_processed`.

---

## 3. Saldo incorreto

### 3.1 Onde verificar

| Camada | Onde |
|--------|------|
| **Fonte de verdade jogável** | Coluna **`usuarios.saldo`** (Supabase). |
| **Entradas** | `pagamentos_pix` com `status = approved` por `usuario_id` e valores `amount`/`valor`. |
| **Saídas / jogo** | Tabela **`chutes`**: `valor_aposta`, `premio`, `premio_gol_de_ouro`, `resultado`. |
| **Saques** | Tabela **`saques`** (estados e valores normalizados como nas auditorias financeiras). |
| **Ledger (se em uso)** | `ledger_financeiro` e rotinas como `reconcileMissingLedger` no repositório — **não** substituem sozinhas a correção de saldo; servem de cruzamento. |
| **Logs de chute** | `⚽ [SHOOT]`, `❌ [SHOOT]`; em falha de persistência após débito, fluxos de reversão documentados na auditoria do saldo (BLOCO D). |

### 3.2 Como corrigir

- **Primeiro:** identificar causa (PIX não creditado, duplicidade improvável, saque pendente, bug de interface vs backend).
- **Se falta crédito de PIX aprovado:** seguir secção 1 e 2 (linha + webhook/reconcile/RPC).
- **Ajuste direto de saldo** em `usuarios` só com **processo interno** (dupla verificação, registo de ticket, preferência por corrigir a **origem** — pagamento/chute/saque — antes de editar saldo à mão).

---

## 4. Backend caiu

### 4.1 Impacto

| Área | Efeito |
|------|--------|
| **Jogadores** | Login, perfil, chute, PIX, saque: indisponíveis ou **503** enquanto `dbConnected` / Supabase / processo falharem. |
| **PIX em criação** | Se o MP criou cobrança e o processo caiu **antes** do insert local → risco de **órfão** (secção 1). |
| **Webhooks** | MP continua a tentar entregas; quando o backend voltar, notificações podem ser reprocessadas ou reenviadas. |
| **Lotes / contador** | Estado em **memória** (`lotesAtivos`, contador global) perde-se no restart; ao subir, contador é carregado de `metricas_globais` quando possível; **lotes ativos em curso deixam de existir** até novos chutes recriarem lotes. |
| **Idempotência de chute** | Mapa em memória zera; TTL 120 s deixa de aplicar até novo tráfego. |

### 4.2 Recuperação

1. Verificar **orquestrador** (ex.: Fly.io): `fly status`, `fly logs`, reinício da máquina se necessário.
2. **`GET /ready`**: deve responder **200** `{ "status": "ready" }` após o bootstrap completo; **503** se ainda `not ready`.
3. **`GET /health`**: indica `database`, `mercadoPago` e outros campos expostos pelo código (atenção: inclui dados operacionais — ver auditoria de segurança).
4. Confirmar **variáveis de ambiente** e **Supabase** acessível.
5. Após estabilizar: smoke test **login**, **GET profile**, **criar PIX de teste mínimo** (se política permitir), **webhook** ou reconcile.

---

## 5. Admin fora do ar

### 5.1 Diagnóstico

| Sintoma | Causa provável (código) |
|---------|-------------------------|
| **503** nas rotas `/api/admin/*` | `ADMIN_TOKEN` ausente ou com **menos de 16 caracteres** no servidor (`routes/adminApiFly.js` → `authAdminToken`). |
| **401** | Header **`x-admin-token`** ausente ou diferente de `ADMIN_TOKEN`. |
| **Painel SPA não carrega dados** | URL base do admin incorreta; token no browser não é o do servidor; uso de cliente HTTP legado (auditoria BLOCO J: vários ficheiros `api.js` / `dataService` — o fluxo esperado usa o token igual ao `ADMIN_TOKEN` no header). |
| **CORS / rede** | Backend inacessível a partir do host do admin; mistura HTTP/HTTPS. |
| **Backend geral indisponível** | Mesma secção 4. |

Verificar também se o backend montado é **`server-fly.js`** com `createAdminApiRouter` em `/api/admin` (não confundir com rotas `/admin/*` legadas não montadas neste entrypoint).

---

## 6. Logs importantes

Prefixos observados no **`server-fly.js`** e módulos associados (formato exato pode incluir emojis nos logs).

### 6.1 PIX

| Padrão | Significado |
|--------|-------------|
| `💰 [PIX] PIX real criado` | Criação local bem-sucedida após MP. |
| `❌ [PIX] Erro Mercado Pago` | Falha na API MP na criação. |
| `❌ [PIX] MP criou cobrança mas Supabase indisponível` | Risco de órfão / inconsistência local. |
| **`❌ [PIX-ORFAO-MP]`** + JSON | MP OK, insert `pagamentos_pix` falhou — **ação manual** (secção 1). |

### 6.2 Webhook

| Padrão | Significado |
|--------|-------------|
| `📨 [WEBHOOK] PIX recebido` | Corpo recebido (tipo/dados). |
| `❌ [WEBHOOK] Signature inválida` | HMAC falhou; em produção → **401**. |
| `❌ [WEBHOOK] creditar PIX:` | Falha no crédito (ver motivo: `pix_not_found`, etc.). |
| `📨 [WEBHOOK] Pagamento já processado` | Idempotência: já estava creditado. |
| `❌ [WEBHOOK] Erro:` | Exceção no handler após 200. |

### 6.3 Reconcile (PIX pendente)

| Padrão | Significado |
|--------|-------------|
| `🕒 [RECON] Reconciliação … ativa` | Job agendado no arranque. |
| `✅ [RECON] Pagamento … aprovado e saldo aplicado` | Crédito via reconcile. |
| `❌ [RECON] creditar PIX:` | Falha ao creditar no ciclo. |
| `[RECON] pending id=… sem ID MP numérico` | Linha legada; pode marcar `reconcile_skip` se migração existir. |

### 6.4 Chutes

| Padrão | Significado |
|--------|-------------|
| `⚽ [SHOOT] Chute #…` | Chute registado com sucesso. |
| `❌ [SHOOT] …` | Erro (integridade, insert `chutes`, etc.). |
| `🏆 [GOL DE OURO]` | Prémio extra em múltiplo de 1000 no contador global. |
| `🏆 [LOTE] Lote … completado` | Lote fechado. |

### 6.5 Erros críticos (exemplos)

| Padrão | Contexto |
|--------|----------|
| `❌ [PIX-CREDIT]` / `⚠️ [PIX-CREDIT] RPC … indisponível` | Crédito PIX; fallback JS se RPC falhar. |
| `❌ [SAQUE]` / mensagens de rollback em saque | Fluxo de saque (auditoria financeira). |
| `❌ [AUTH]` | Token ausente ou inválido. |
| `❌ [SUPABASE]` | Conectividade / credenciais. |
| `📊 [MONITORING]` | Middleware de pedidos (tempo / status) — útil para picos de erros. |

---

## Referências no repositório

- `server-fly.js` — PIX, webhook, reconcile, shoot, health/ready.  
- `routes/adminApiFly.js` — admin.  
- `utils/webhook-signature-validator.js` — assinatura webhook MP.  
- `database/rpc-financeiro-atomico-2026-03-28.sql` — RPC de crédito.  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-A-FINANCEIRO-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-D-SALDO-V1-2026-03-29.md`  
- `docs/relatorios/CHECKLIST-GO-NO-GO-V1.md`

---

*Fim do runbook.*
