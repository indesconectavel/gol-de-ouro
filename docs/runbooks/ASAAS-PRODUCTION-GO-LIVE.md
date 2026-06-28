# RUNBOOK — Asaas Production Go-Live (P1.0)

**Projeto:** Gol de Ouro™ Backend  
**Escopo:** Ativação controlada do PSP Asaas em produção  
**Gate principal:** `ASAAS_PRODUCTION_ENABLED` — **permanece `false` até decisão explícita do operador**

---

## 1. Pré-check (obrigatório)

### 1.1 Gates e flags

| Variável | Valor pré-go-live | Valor go-live |
|----------|-------------------|---------------|
| `ASAAS_PRODUCTION_ENABLED` | `false` | `true` (último passo) |
| `PAYMENT_WEBHOOK_ENGINE_ENABLED` | `false` em prod MP | `true` |
| `ASAAS_WEBHOOK_ENABLED` | `false` | `true` |
| `ASAAS_ENABLED` | `false` | `true` |
| `ASAAS_ENV` | `sandbox` | `production` |
| `ASAAS_API_KEY` | — | chave produção Asaas |
| `ASAAS_WEBHOOK_TOKEN` | — | token configurado no painel Asaas |
| `ALLOW_ASAAS_SANDBOX_WEBHOOK` | `0` | `0` (produção não usa sandbox) |

### 1.2 Credenciais Asaas produção

- [ ] Conta Asaas produção aprovada e verificada
- [ ] `ASAAS_API_KEY` produção configurada no Fly.io (secrets)
- [ ] Webhook URL registrada no painel Asaas: `https://<dominio>/webhooks/asaas`
- [ ] `ASAAS_WEBHOOK_TOKEN` idêntico entre painel Asaas e runtime

### 1.3 Infraestrutura

- [ ] Deploy backend com wire P1.0 (`processPaymentWebhook` + `server-fly.js`)
- [ ] Supabase acessível (`claim_and_credit_approved_pix_deposit` disponível)
- [ ] Health check Fly: `GET /health` retorna 200
- [ ] Script local: `node scripts/verify-asaas-production-webhook-wire.mjs` → PASS

### 1.4 Homologação sandbox concluída

- [ ] F4.7 E2E sandbox PASS
- [ ] F4.6 controlled credit PASS
- [ ] F4.5 webhook engine PASS
- [ ] Relatório P1.0 homologação PASS

---

## 2. Sequência de go-live (ordem estrita)

```text
1. Confirmar rollback documentado (§3)
2. PAYMENT_WEBHOOK_ENGINE_ENABLED=true
3. ASAAS_WEBHOOK_ENABLED=true
4. ASAAS_ENABLED=true + ASAAS_ENV=production + credenciais prod
5. Validar webhook de teste (evento não financeiro ou valor mínimo)
6. ASAAS_PRODUCTION_ENABLED=true  ← ÚLTIMO PASSO
7. Monitorar 30 min (§5)
8. Checklist P1.0 pós-go-live
```

**Nunca** abrir `ASAAS_PRODUCTION_ENABLED=true` antes dos passos 1–5.

---

## 3. Rollback

### 3.1 Rollback imediato (< 2 min)

| Ação | Comando / valor |
|------|-----------------|
| Fechar gate Asaas | `fly secrets set ASAAS_PRODUCTION_ENABLED=false` |
| Desabilitar webhook Asaas | `fly secrets set ASAAS_WEBHOOK_ENABLED=false` |
| Restaurar MP efetivo | omitir `PAYMENT_PROVIDER` ou `PAYMENT_PROVIDER=mercadopago` |
| Reiniciar máquinas | `fly apps restart goldeouro-backend` |

### 3.2 Rollback completo

1. `ASAAS_PRODUCTION_ENABLED=false`
2. `PAYMENT_WEBHOOK_ENGINE_ENABLED=false` (volta handler MP legado inline)
3. Remover URL webhook no painel Asaas (ou desativar eventos)
4. Verificar depósitos pendentes Asaas não creditados indevidamente
5. Documentar incidente conforme `docs/runbooks/INCIDENT-RESPONSE-FLOW.md`

### 3.3 Critérios para rollback automático

- Crédito duplicado detectado (ledger / saldo)
- Taxa de webhook 401/403 > 10% em 5 min
- `CLAIM_HANDLER_MISSING` ou `deposit_claim_sql_error` em logs
- Saldo negativo em usuário pós-go-live

---

## 4. Flags — referência rápida

```env
# Produção MP (estado atual — seguro)
NODE_ENV=production
ASAAS_PRODUCTION_ENABLED=false
PAYMENT_WEBHOOK_ENGINE_ENABLED=false

# Go-live Asaas (estado alvo)
NODE_ENV=production
ASAAS_PRODUCTION_ENABLED=true
PAYMENT_WEBHOOK_ENGINE_ENABLED=true
ASAAS_WEBHOOK_ENABLED=true
ASAAS_ENABLED=true
ASAAS_ENV=production
PRIMARY_PSP=asaas
```

**Comportamento por gate:**

| `ASAAS_PRODUCTION_ENABLED` | `NODE_ENV` | Rota `/webhooks/asaas` | Crédito |
|----------------------------|------------|------------------------|---------|
| `false` | `production` | **403 bloqueada** | nenhum |
| `true` | `production` | ativa (com flags webhook) | Supabase real |
| `false` | `development` | sandbox dry-run / F4.6 | controlado |

---

## 5. Health checks

### 5.1 Runtime

```bash
curl -s https://<dominio>/health
```

Esperado: HTTP 200.

### 5.2 Webhook engine desabilitado (estado seguro)

```bash
curl -s -X POST https://<dominio>/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_RECEIVED"}'
```

Esperado com engine OFF: `404 payment_webhook_engine_disabled`.

### 5.3 Gate produção fechado

Com `PAYMENT_WEBHOOK_ENGINE_ENABLED=true` e `ASAAS_PRODUCTION_ENABLED=false` em produção:

Esperado: `403 asaas_webhook_blocked`.

### 5.4 Logs financeiros

Filtrar eventos:

- `deposit_webhook_claim` — crédito aplicado
- `deposit_webhook_duplicate` — idempotência OK
- `deposit_webhook_rejected` — assinatura/token inválido
- `deposit_claim_sql` — RPC atômico

---

## 6. Monitoramento pós-go-live

| Métrica | Threshold alerta | Ação |
|---------|------------------|------|
| Webhooks Asaas/min | baseline + 3σ | Verificar replay / flood |
| `deposit_webhook_duplicate` | > 20% do volume | Investigar idempotência |
| `deposit_claim_user_error` | qualquer ocorrência | P1 — pausar gate |
| Saldo usuário vs ledger | divergência | RUNBOOK-duplicata-ledger |
| Latência POST /webhooks/asaas | p95 > 3s | Escalar engenharia |

**Janela crítica:** primeiros 30 minutos após `ASAAS_PRODUCTION_ENABLED=true`.

---

## 7. Validação pós-go-live

### 7.1 Teste controlado (valor mínimo)

1. Criar depósito PIX IN via Asaas produção (valor simbólico)
2. Confirmar webhook `PAYMENT_RECEIVED` recebido (log)
3. Verificar `pagamentos_pix.status = approved`
4. Verificar `usuarios.saldo` incrementado
5. Verificar ledger `tipo=deposito` (se RPC R3 ativo)
6. Reenviar mesmo webhook → resposta `idempotent: true`, saldo inalterado

### 7.2 Queries read-only

```sql
SELECT id, payment_id, external_id, status, provider, updated_at
FROM pagamentos_pix
WHERE provider = 'asaas'
ORDER BY updated_at DESC
LIMIT 10;

SELECT tipo, count(*) FROM ledger_financeiro
WHERE created_at > now() - interval '1 hour'
GROUP BY 1;
```

### 7.3 Checklist formal

Completar `docs/checklists/P1.0-PRODUCTION-GO-LIVE-CHECKLIST.md` e arquivar em `docs/relatorios/`.

---

## 8. Contatos e escalonamento

| Nível | Responsável | Gatilho |
|-------|-------------|---------|
| P3 | Ops | Webhook ignorado / evento desconhecido |
| P2 | Engenharia backend | 403/401 spike |
| P1 | Financeiro + Eng | crédito duplicado ou saldo divergente |
| P0 | Rollback imediato | double credit confirmado |

Ver também: `docs/runbooks/financeiro/RUNBOOK-duplicata-ledger.md`, `RUNBOOK-rollback-spike.md`.

---

## 9. Fluxo arquitetural (referência)

```text
POST /webhooks/asaas (server-fly.js)
        ↓
processPaymentWebhookCompat({ provider: 'asaas' })
        ↓
validateAsaasWebhook() + normalizeAsaasPaymentWebhook()
        ↓
[ASAAS_PRODUCTION_ENABLED=true + NODE_ENV=production]
        ↓
checkSupabaseDepositIdempotency()
        ↓
claimAndCreditApprovedPixDeposit()  ← Supabase RPC / fallback
        ↓
Wallet real (usuarios.saldo) + Ledger (RPC R3)
```

---

**Documento:** P1.0 — preparação go-live Asaas  
**Produção Asaas:** FECHADA até operador executar §2 passo 6
