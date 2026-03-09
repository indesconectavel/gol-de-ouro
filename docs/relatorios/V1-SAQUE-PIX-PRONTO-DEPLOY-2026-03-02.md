# V1 Saque PIX — Checklist e plano de deploy seguro (2026-03-02)

**Modo:** READ-ONLY + PATCH MÍNIMO CONTROLADO (não tocar /game nem Depósito PIX).  
**Objetivo:** Preparar V1 estável de Saque PIX no Fly, com evidência.

---

## TAREFA A — CHECKLIST AUTOMÁTICO (evidência)

| Item | Critério | Resultado | Evidência |
|------|----------|-----------|-----------|
| **A1** | INSERT pagamentos_pix usa status `'pending'` | **GO** | server-fly.js linha 1837: `status: 'pending',` (dentro do .insert de pagamentos_pix) |
| **A2** | Resposta JSON do handler pix/criar usa status `'pending'` | **GO** | server-fly.js linha 1862: `status: 'pending',` (em res.json data) |
| **A3** | reconcilePendingPayments usa `.in(['pending','pendente'])` | **GO** | server-fly.js linha 2360: `.in('status', ['pending', 'pendente'])` |
| **A4** | Handlers /game inalterados (corpo não modificado) | **GO** | Handlers nas linhas 1023 (/api/user/profile), 1168 (/api/games/shoot), 3139 (/api/fila/entrar); patch de saque não altera essas linhas |
| **A5** | reconcileProcessingWithdrawals.js existe | **GO** | src/domain/payout/reconcileProcessingWithdrawals.js presente |
| **A6** | processPendingWithdrawals.js contém updateSaqueStatus (export/uso) | **GO** | Linhas 50 (def), 106/292/324 (uso), 417–422 (module.exports updateSaqueStatus) |
| **A7** | payout-worker chama reconcileProcessingWithdrawals (runReconcileCycle + setInterval) | **GO** | Linhas 5 (require), 103 (runReconcileCycle), 112 (await reconcileProcessingWithdrawals), 129–130 (runReconcileCycle + setInterval) |
| **A8** | package.json tem envalid em dependencies | **GO** | package.json linha 21: `"envalid": "^8.1.1"` |
| **A9** | authMiddleware usa ../config/env | **GO** | middlewares/authMiddleware.js linha 2: `require('../config/env')` |
| **A10** | INSERT saques usa PENDING (domínio saque) | **GO** | server-fly.js linhas 1564 e 1652: `status: PENDING,` (tabela saques) |
| **A11** | Webhook saque (webhooks/mercadopago) usa COMPLETED/PROCESSING/REJECTED/normalizeWithdrawStatus | **GO** | Linhas 2192 (COMPLETED/REJECTED + normalizeWithdrawStatus), 2244 (COMPLETED), 2264 (PROCESSING), 2275+ (rejected/cancelled → rollbackWithdraw → REJECTED) |

**TAREFA B — PATCH MÍNIMO:** Nenhum patch necessário. Todos os itens A1–A11 passaram.

---

## Resumo final — GO/NO-GO

| Item | GO/NO-GO |
|------|----------|
| A1 | GO |
| A2 | GO |
| A3 | GO |
| A4 | GO |
| A5 | GO |
| A6 | GO |
| A7 | GO |
| A8 | GO |
| A9 | GO |
| A10 | GO |
| A11 | GO |

**Veredito:** **GO.** Nenhum bloqueador. Depósito PIX mantém status `'pending'` e `.in(['pending','pendente'])`; rotas /game intactas; saque V1 (reconciler, updateSaqueStatus, worker) presente; envalid e config/env corretos.

---

## Arquivos que entram no deploy (lista objetiva)

O deploy via `flyctl deploy` usa o **Dockerfile** (COPY . .), portanto todos os arquivos do repositório na raiz do backend são incluídos. Para **V1 Saque PIX** os arquivos críticos que precisam estar presentes e corretos são:

- **server-fly.js**
- **config/env.js**
- **config/required-env.js**
- **middlewares/authMiddleware.js**
- **src/domain/payout/processPendingWithdrawals.js**
- **src/domain/payout/reconcileProcessingWithdrawals.js**
- **src/domain/payout/withdrawalStatus.js**
- **src/workers/payout-worker.js**
- **services/pix-mercado-pago.js**
- **package.json**
- **package-lock.json**
- **Dockerfile**
- **fly.toml**

**PRONTO PARA DEPLOY.**

---

## TAREFA C — Plano de deploy seguro (PowerShell)

### 1) Testes locais mínimos (sintaxe / carga)

```powershell
Set-Location "e:\Chute de Ouro\goldeouro-backend"

# Sintaxe Node
node -c server-fly.js
node -c src/workers/payout-worker.js
node -c src/domain/payout/processPendingWithdrawals.js
node -c src/domain/payout/reconcileProcessingWithdrawals.js

# Carga mínima (sem secrets): só verificar que require não quebra
node -e "require('./config/required-env'); console.log('required-env ok');"
node -e "require('./src/domain/payout/withdrawalStatus'); console.log('withdrawalStatus ok');"
```

*(Se config/env.js for carregado sem ENV válidas, pode falhar; nesse caso pular ou rodar só em ambiente com .env.)*

### 2) Deploy

```powershell
Set-Location "e:\Chute de Ouro\goldeouro-backend"
flyctl deploy --remote-only --no-cache -a goldeouro-backend-v2
```

### 3) Validação pós-deploy

```powershell
# Status e máquinas
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
flyctl releases -a goldeouro-backend-v2

# Logs (app + payout_worker)
flyctl logs -a goldeouro-backend-v2 --no-tail

# Health
curl -s -o NUL -w "%{http_code}" https://goldeouro-backend-v2.fly.dev/health
# ou
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing | Select-Object StatusCode

# Depósito PIX — somente criar (não alterar nada); requer token JWT
# Substituir YOUR_JWT e valor/body conforme sua API
# $headers = @{ "Authorization" = "Bearer YOUR_JWT"; "Content-Type" = "application/json" }
# $body = '{"amount": 10}'  # ou o payload que sua rota exige
# Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Headers $headers -Body $body -UseBasicParsing

# Admin saques-presos (substituir YOUR_ADMIN_TOKEN)
$adminHeaders = @{ "x-admin-token" = "YOUR_ADMIN_TOKEN" }
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/admin/saques-presos" -Headers $adminHeaders -UseBasicParsing | Select-Object StatusCode, Content
```

### 4) Prova no container (SSH)

No PowerShell, aspas aninhadas para `node -e "require(...)"` costumam quebrar. Alternativas:

**Opção A — Comandos simples sem aspas complexas:**

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine <MACHINE_ID> -C "pwd"
flyctl ssh console -a goldeouro-backend-v2 --machine <MACHINE_ID> -C "ls -la src/domain/payout"
flyctl ssh console -a goldeouro-backend-v2 --machine <MACHINE_ID> -C "ls node_modules/envalid"
```

**Opção B — Usar WSL (recomendado para require):**

```bash
flyctl ssh console -a goldeouro-backend-v2 --machine <MACHINE_ID> -C 'node -e "require(\"envalid\"); console.log(\"envalid OK\")"'
flyctl ssh console -a goldeouro-backend-v2 --machine <MACHINE_ID> -C 'node -e "require(\"./config/env\"); console.log(\"env OK\")"'
```

Substituir `<MACHINE_ID>` por um ID de máquina **app** (ex.: da saída de `flyctl machines list`).

---

## Se tivesse sido NO-GO (referência)

- **Bloqueador:** Seria o item falho (ex.: A1 = INSERT pagamentos_pix com PENDING em vez de `'pending'`).
- **Patch mínimo:** Em server-fly.js, na rota POST /api/payments/pix/criar: (1) no .insert de pagamentos_pix, usar `status: 'pending'`; (2) na resposta JSON, usar `status: 'pending'`; (3) em reconcilePendingPayments, usar `.in('status', ['pending', 'pendente'])`. Nenhuma alteração em handlers de /game nem em lógica de saque além do já aplicado.

---

*Documento gerado em modo READ-ONLY + PATCH MÍNIMO CONTROLADO. Nenhuma alteração foi feita em handlers /game nem em depósito além da verificação de status/compatibilidade.*
