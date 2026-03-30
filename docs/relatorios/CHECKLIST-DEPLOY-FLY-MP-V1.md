# Checklist de deploy — Fly.io + Mercado Pago (V1)

**Objetivo:** sequência operacional para levantar o backend documentado (`Dockerfile` → `node server-fly.js`) com Supabase e Mercado Pago, sem retrabalho no dia do orçamento Fly.  
**Base:** `CHECKLIST-GO-NO-GO-V1.md`, `INVENTARIO-ENV-V1.md`, `RUNBOOK-OPERACIONAL-V1.md`, `AUDITORIA-MERCADOPAGO-REAL-V1.md`, `fly.toml` (app `goldeouro-backend-v2`).  
**Data:** 2026-03-29  

Marcar cada passo: **OK** / **N/A** / **PENDENTE**.

---

## 0. Pré-requisitos (antes do Fly)

| # | Item | Notas |
|---|------|--------|
| 0.1 | Conta Supabase ativa; URL + keys disponíveis | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (validação no boot — ver inventário). |
| 0.2 | SQL RPC financeira aplicada (se se pretende caminho atómico V1) | Script `database/rpc-financeiro-atomico-2026-03-28.sql`; função `creditar_pix_aprovado_mp` + grants; alinhado ao checklist GO/NO-GO. |
| 0.3 | Constraint **UNIQUE** em `pagamentos_pix.payment_id` em **produção** | Confirmar no catálogo do Postgres/Supabase (pode divergir de `database/schema*.sql` se migrações antigas). |
| 0.4 | Migração opcional `reconcile_skip` | `database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql` — recomendada para reconcile limpo. |
| 0.5 | Conta Mercado Pago (produção ou sandbox conforme política) | Token de aplicação + segredo de webhook configurável no painel «Suas integrações». |

---

## 1. Secrets obrigatórios no Fly (`fly secrets set`)

Definir **todos** antes ou logo após o primeiro deploy estável. Nunca commitar valores.

### 1.1 Arranque e base de dados

| Secret | Obrigatório | Nota |
|--------|-------------|------|
| `JWT_SECRET` | Sim | Forte; único por ambiente. |
| `SUPABASE_URL` | Sim | |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | |
| `SUPABASE_ANON_KEY` | Sim | Exigido pela validação unificada no boot (`INVENTARIO-ENV-V1`). |

### 1.2 Produção Node + Mercado Pago

| Secret | Obrigatório | Nota |
|--------|-------------|------|
| `NODE_ENV` | Sim | Deve ser `production` (imagem já define; confirmar que não é sobrescrito por valor vazio). |
| `MERCADOPAGO_ACCESS_TOKEN` | Sim | `assertRequiredEnv` em produção; sem isto o processo **não inicia**. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Sim (ambiente público) | Sem isto, HMAC do webhook **não corre**; checklist GO marca bloqueio. Igual ao segredo do painel MP. |
| `BACKEND_URL` | Sim | Origem HTTPS **sem** path `/api/...` (ex.: `https://goldeouro-backend-v2.fly.dev`). O código acrescenta `/api/payments/webhook`. Se omitido, há fallback fixo no código que **pode ser o host errado** noutro app. |

### 1.3 Admin

| Secret | Obrigatório | Nota |
|--------|-------------|------|
| `ADMIN_TOKEN` | Sim | Mínimo **16** caracteres; igual ao usado no build do admin (`VITE_ADMIN_TOKEN` / header `x-admin-token`). |

### 1.4 Opcionais (comportamento documentado)

| Secret | Default / efeito |
|--------|-------------------|
| `FINANCE_ATOMIC_RPC` | Omitir ou ≠ `false` → tentar RPC; `false` → preferência só JS. |
| `MP_RECONCILE_ENABLED` | `false` desliga job periódico. |
| `MP_RECONCILE_INTERVAL_MS` | Intervalo (mín. efetivo ~30 s no código). |
| `MP_RECONCILE_MIN_AGE_MIN` | Idade mínima de `pending` para reconcile. |
| `MP_RECONCILE_LIMIT` | Máximo de linhas por ciclo. |
| `MP_WEBHOOK_TS_SKEW_SEC` | Janela do `ts` na assinatura MP (validador). |

---

## 2. Ordem sugerida de configuração no Fly

1. **Criar / associar app** ao repositório (`fly launch` ou `fly apps create`), região coerente com `fly.toml` (ex.: `gru`).  
2. **Aplicar no Supabase** itens da secção 0 (RPC, UNIQUE, migração opcional).  
3. **Definir secrets** na ordem: JWT + Supabase (3 chaves) → `NODE_ENV` → `ADMIN_TOKEN` → `MERCADOPAGO_ACCESS_TOKEN` → `MERCADOPAGO_WEBHOOK_SECRET` → `BACKEND_URL` → opcionais.  
4. **Primeiro deploy:** `fly deploy` (usa `Dockerfile` → `server-fly.js`).  
5. **Escala:** garantir **1 máquina** para o processo do jogo (ver secção 4).  
6. **Mercado Pago:** configurar URL de notificação e segredo (secção 3).  
7. **Frontends:** rebuild player/admin com `VITE_BACKEND_URL` / `VITE_API_URL` apontando para a URL pública real do backend.  
8. **Smoke test:** `docs/relatorios/SMOKE-TEST-PRODUCAO-V1.md`.

---

## 3. Webhook Mercado Pago

| # | Verificação |
|---|-------------|
| 3.1 | URL de notificação = `{BACKEND_URL}/api/payments/webhook` (HTTPS). |
| 3.2 | Segredo de assinatura no painel MP = valor de `MERCADOPAGO_WEBHOOK_SECRET`. |
| 3.3 | Após deploy, usar **teste de notificação** do painel (se disponível) ou PIX mínimo. |
| 3.4 | Em produção com secret: POST falso sem `x-signature` válido → **401** (comportamento documentado). |
| 3.5 | O handler responde **200** `{ received: true }` antes do crédito; falhas posteriores exigem retentativas MP ou **reconcile** (`RUNBOOK-OPERACIONAL-V1`). |

---

## 4. Validação de instância única

| # | Verificação |
|---|-------------|
| 4.1 | `fly scale show` (ou equivalente): **count = 1** para a máquina que corre `server-fly.js`. |
| 4.2 | Documentar por escrito se alguma decisão futura permitir scale > 1 (risco R2 na `MATRIZ-RISCOS-V1.md`). |

---

## 5. Health e readiness

| Endpoint | Esperado |
|----------|----------|
| `GET /health` | `200`; `database` e `mercadoPago` coerentes com estado real (atenção: expõe dados operacionais — `MAPA-ENDPOINTS-V1`). |
| `GET /ready` | `200` `{ "status": "ready" }` após bootstrap completo; `503` se `not ready`. |

Check Fly **HTTP check** em `fly.toml`: path `/health`, porta interna 8080.

---

## 6. Teste de admin

| # | Ação | Esperado |
|---|------|----------|
| 6.1 | `GET {BACKEND_URL}/api/admin/stats` com header `x-admin-token: {ADMIN_TOKEN}` | `200` e payload JSON coerente. |
| 6.2 | Sem header ou token errado | `401`. |
| 6.3 | `ADMIN_TOKEN` ausente ou &lt; 16 chars no servidor | `503` (mensagem explícita no código). |

---

## 7. Teste de PIX (R$ 1,00 ou valor mínimo permitido pela política)

| # | Passo | Critério de sucesso |
|---|--------|---------------------|
| 7.1 | Login jogador → JWT válido | `POST /api/auth/login` OK. |
| 7.2 | `POST /api/payments/pix/criar` com `amount: 1` | `200`; corpo com dados PIX; **sem** `500` com `PIX-ORFAO-MP`. |
| 7.3 | Supabase | Nova linha `pagamentos_pix` com `status = pending` e `payment_id` = ID MP. |
| 7.4 | Pagar no fluxo MP (app/banco conforme ambiente) | Pagamento `approved` no painel MP. |
| 7.5 | Webhook / reconcile | Linha `approved`; `usuarios.saldo` aumentado; log `💰 [PIX-CREDIT]` (RPC ou fallback JS). |
| 7.6 | Idempotência | Segundo processamento do mesmo pagamento → `already_processed` ou equivalente nos logs (`RUNBOOK`). |

---

## 8. Critérios de rollback

Acionar **rollback de release** (deploy anterior no Fly) ou **pausa** do tráfego se:

| Situação | Motivo (auditorias) |
|----------|---------------------|
| Processo em loop de crash | Token MP inválido menos provável; verificar assert env e Supabase. |
| Créditos duplicados ou incoerência grave | Suspeita de schema sem UNIQUE em `payment_id` (R16) ou intervenção manual incorreta. |
| `scale > 1` ativado por engano | Lotes/contador/idempotência inconsistentes entre processos (R2). |
| Webhooks a apontar para host errado | `BACKEND_URL` ou fallback incorreto para o app real (R4). |
| Secret MP exposto | Rotação imediata no MP + `fly secrets set`; revalidar assinaturas. |
| RPC financeira ausente **e** política exige atómico | Até aplicar SQL no Supabase ou aceitar fallback JS por escrito (R7). |

Após rollback: repetir secções 5–7; consultar `RUNBOOK-OPERACIONAL-V1.md` para órfãos e webhook.

---

## Referências cruzadas

- Decisão GO / NO-GO: `CHECKLIST-GO-NO-GO-V1.md`  
- Variáveis detalhadas: `INVENTARIO-ENV-V1.md`  
- Mercado Pago (comportamento real): `AUDITORIA-MERCADOPAGO-REAL-V1.md`  

---

*Fim do checklist de deploy.*
