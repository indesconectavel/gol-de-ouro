# HOTFIX CONTROLADO (ENV-only) — Reconciler de depósitos PIX (V308)

**Data:** 2026-03-03  
**Modo:** Execução controlada + relatório com evidências  
**Objetivo:** Habilitar o reconciler de depósitos (`MP_RECONCILE_ENABLED`) e verificar se o pagamento 148697499270 sai de pending → approved e se o saldo do usuário é creditado.

**Alvos:**
- App Fly: `goldeouro-backend-v2`
- APP_HEALTHY_ID: `2874551a105768`
- WORKER_ID: `e82794da791108`
- Pagamento alvo: `pagamentos_pix.id` = 87ee8545-e56d-4978-85d0-d0bd22240eeb, `payment_id` = 148697499270, `usuario_id` = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5

---

## A) Snapshot infra

### flyctl status -a goldeouro-backend-v2 (antes do hotfix)

```
App
  Name     = goldeouro-backend-v2
  Owner    = personal
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	ROLE        	CHECKS            	LAST UPDATED
app          	2874551a105768	308    	gru   	started	    	1 total, 1 passing	2026-03-03T15:11:41Z
app          	e82d445ae76178	308    	gru   	stopped	    	1 total, 1 warning	2026-03-03T15:11:54Z
payout_worker	e82794da791108	308    	gru   	started	    	                  	2026-03-03T15:11:40Z
```

### flyctl machines list -a goldeouro-backend-v2 (antes)

- 2874551a105768 (app, started, 1/1)
- e82d445ae76178 (app, stopped)
- e82794da791108 (payout_worker, started)

### flyctl releases -a goldeouro-backend-v2 (amostra)

- v308 failed, v307 failed, v306 failed, v305 complete (Feb 25 2026), …

---

## B) DB_BEFORE (READ-ONLY)

Script executado no container (STDIN → `/app/db.js`, `node db.js` a partir de `/app`).

### Env Supabase (boolean/len)

- ENV_SUPABASE_URL_PRESENT true, LEN 40  
- ENV_SUPABASE_SERVICE_ROLE_KEY_PRESENT true, LEN 219  

### pagamentos_pix id = 87ee8545-e56d-4978-85d0-d0bd22240eeb

```json
{
  "id": "87ee8545-e56d-4978-85d0-d0bd22240eeb",
  "status": "pending",
  "amount": 10,
  "payment_id": "148697499270",
  "external_id": "148697499270",
  "created_at": "2026-03-03T20:32:29.162628+00:00",
  "updated_at": "2026-03-03T20:32:29.162628+00:00",
  "usuario_id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5"
}
```

### usuarios id = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5

```json
{
  "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
  "saldo": 79,
  "updated_at": "2026-03-02T21:22:08.544164+00:00"
}
```

---

## C) ENV_BEFORE (READ-ONLY)

Valores lidos no container da app:

| Variável | Valor |
|----------|--------|
| MP_RECONCILE_ENABLED | "false" |
| MP_RECONCILE_INTERVAL_MS | undefined |
| MP_RECONCILE_MIN_AGE_MIN | undefined |
| NODE_ENV | "production" |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | PRESENT, LEN 74 |

**Critério de ação:** MP_RECONCILE_ENABLED estava `"false"` → prosseguir com HOTFIX.

---

## D) AÇÃO (secrets set + restart)

### Comando executado

```bash
flyctl secrets set -a goldeouro-backend-v2 \
  MP_RECONCILE_ENABLED=true \
  MP_RECONCILE_INTERVAL_MS=30000 \
  MP_RECONCILE_MIN_AGE_MIN=1
```

**Nota:** O `flyctl secrets set` dispara **rolling update** de todas as máquinas da app (incluindo a 2874551a105768). Não foi necessário executar `flyctl machine restart` separadamente.

### Saída registrada (resumo)

- Updating existing machines with rolling strategy  
- [2/3] Machine 2874551a105768 [app] has state: started  
- ✔ [2/3] Machine 2874551a105768 [app] update succeeded  
- ✔ [3/3] Machine e82794da791108 [payout_worker] update succeeded  

### Confirmação pós-restart

- **flyctl status:** app 2874551a105768 em VERSION **309**, state **started**, checks **1 total, 1 passing** (LAST UPDATED 2026-03-03T23:28:19Z).  
- **Health HTTP:** `Invoke-WebRequest https://goldeouro-backend-v2.fly.dev/health -UseBasicParsing` → status 200, body contém `"status":"ok"`, `"database":"connected"`, `"mercadoPago":"connected"`.

---

## E) Logs pós-restart (janela curta)

Amostra de logs após o restart (app 2874551a105768). Trechos relevantes:

- **Reconciler ativo:**  
  `🕒 [RECON] Reconciliação de PIX pendentes ativa a cada 30s`
- **App e dependências:**  
  Supabase e Mercado Pago conectados; servidor na porta 8080; health check passando.
- **Erro recorrente no RECON (não relacionado ao pagamento alvo):**  
  `❌ [RECON] ID de pagamento inválido (não é número): deposito_4ddf8330-ae94-4e92-a010-bdc7fa254ad5_1765383727057`  
  (repetido a cada ciclo ~30s)

**Interpretação:** O reconciler processa apenas os **10 registros pendentes mais antigos** (ordenados por `created_at` ascendente). Um deles tem `external_id` no formato `deposito_<uuid>_<timestamp>` em vez de ID numérico do MP, por isso é rejeitado a cada ciclo. O pagamento alvo (87ee8545, created_at 2026-03-03T20:32:29) **não está** entre os 10 mais antigos (que são de dez/2025 e jan/2026), portanto **não entra no batch** do reconciler na janela observada. Nenhum log "Claim ganhou" ou "approved" para 148697499270 nesta amostra.

---

## F) DB_AFTER (READ-ONLY)

Mesma consulta do DB_BEFORE, reexecutada após ~90s da subida da app (vários ciclos de 30s).

### pagamentos_pix id = 87ee8545-e56d-4978-85d0-d0bd22240eeb

```json
{
  "id": "87ee8545-e56d-4978-85d0-d0bd22240eeb",
  "status": "pending",
  "amount": 10,
  "payment_id": "148697499270",
  "external_id": "148697499270",
  "created_at": "2026-03-03T20:32:29.162628+00:00",
  "updated_at": "2026-03-03T20:32:29.162628+00:00",
  "usuario_id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5"
}
```

### usuarios id = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5

```json
{
  "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
  "saldo": 79,
  "updated_at": "2026-03-02T21:22:08.544164+00:00"
}
```

**Conclusão:** Status do pagamento continua **pending**; **updated_at** inalterado; **saldo** continua **79** (não houve +10).

---

## G) Veredito e próximos passos

### Veredito: **PARCIAL**

- **GO** não atingido: o pagamento 87ee8545 **não** passou para approved; saldo **não** aumentou em +10.  
- **NO-GO** não se aplica: app subiu, health OK, sem erro de conexão MP/DB.  
- **PARCIAL:** Reconciler foi **habilitado com sucesso** (ENV aplicada, log "Reconciliação de PIX pendentes ativa a cada 30s"). O pagamento alvo não foi processado porque o código processa apenas os **10 pendentes mais antigos** por ciclo; o registro 87ee8545 é mais novo que esses 10, portanto fica fora do batch. Além disso, um dos 10 mais antigos tem `external_id` não numérico e gera o log de "ID de pagamento inválido" a cada ciclo, sem afetar o registro alvo.

### Critérios (resumo)

| Critério | Esperado (GO) | Observado |
|----------|----------------|-----------|
| pagamentos_pix 87ee... status | approved | pending |
| updated_at > created_at | sim | não (inalterado) |
| saldo usuario +10 | 89 | 79 (inalterado) |

### Próximos passos sugeridos (fora do escopo ENV-only)

1. **Aumentar o limite por ciclo** (ex.: `MP_RECONCILE_LIMIT` > 10) para que mais pendentes entrem no batch, incluindo o 87ee8545, ou  
2. **Corrigir/ignorar** registros com `external_id` no formato `deposito_*` para liberar “vagas” no batch para registros com `payment_id` numérico, ou  
3. **Processamento pontual** do pagamento 148697499270 (script ou ação administrativa one-off), sem alterar o código em produção, se a política permitir.

---

## Declaração formal

**Nenhuma alteração de código, deploy ou escrita direta no DB foi realizada.** Apenas alteração de ENV (Fly Secrets) e restart/rolling update do processo app decorrente do `secrets set`. Nenhum token ou secret foi incluído no relatório; apenas boolean/len quando aplicável.

---

**Arquivo do relatório:** `docs/relatorios/HOTFIX-RECONCILER-DEPOSITO-PIX-V308-2026-03-03.md`
