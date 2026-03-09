# Validação E2E V1 Financeiro (Depósito PIX + Saque PIX)

**Data:** 2026-02-28  
**Modo:** 100% READ-ONLY / auditável. Nenhum código, env ou deploy foi alterado.  
**Baseline:** Player FyKKeg6zb (Vercel) + Backend Fly release `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`.

---

## 1) Contexto capturado (READ-ONLY)

### 1.1 Health do backend

**Comando:** `curl.exe -s "https://goldeouro-backend-v2.fly.dev/health"`

**Resposta (exemplo):**
```json
{"status":"ok","timestamp":"2026-02-28T16:08:20.694Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":207,"ultimoGolDeOuro":0}
```

**Status HTTP:** 200  
**Conclusão:** Backend ok; database e Mercado Pago conectados.

### 1.2 Fly — release e máquinas

**Comando:** `flyctl status --app goldeouro-backend-v2`

**Registro (evidência textual):**
- **App:** goldeouro-backend-v2  
- **Hostname:** goldeouro-backend-v2.fly.dev  
- **Image:** goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D  
- **Machines:**  
  - app (2874551a105768) — VERSION 305, gru, started, 1 total 1 passing  
  - app (e82d445ae76178) — VERSION 305, gru, started, 1 total 1 passing  
  - payout_worker (e82794da791108) — VERSION 305, gru, started  

**Conclusão:** Release atual = `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`; 3 máquinas ativas (2 app + 1 payout_worker).

---

## 2) Pre-check de endpoints (CORS — somente OPTIONS)

Comando usado (PowerShell):
```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -H "Origin: <ORIGIN>" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

| Origin | Status HTTP | access-control-allow-origin | Observação |
|--------|-------------|-----------------------------|------------|
| https://www.goldeouro.lol | 204 | https://www.goldeouro.lol | OK — preflight permitido. |
| https://app.goldeouro.lol | 404 | (não aplicável) | Resposta 404 (rota ou CORS não configurado para esta origem). |

**Conclusão:** Produção **www.goldeouro.lol** está permitida para preflight em `/api/payments/pix/criar`. **app.goldeouro.lol** retornou 404 (verificar se o player em produção usa www ou app e se essa origem está na lista CORS do backend).

---

## 3) Checklist manual guiado — Depósito PIX (evidência a preencher pelo operador)

*Não preencher dados sensíveis (e-mail completo, chave PIX, valor real).*

| ID | Passo | Horário | Status observado | Print/HAR | Observação |
|----|--------|---------|------------------|-----------|------------|
| DEP-01 | Abrir produção do player (FyKKeg6zb — www.goldeouro.lol ou URL do deployment) | _preencher_ | _OK / Falha_ | _opcional_ | |
| DEP-02 | Ir em /pagamentos | _preencher_ | _OK / Falha_ | _opcional_ | |
| DEP-03 | Gerar PIX de teste (valor mínimo) | _preencher_ | _OK / Falha_ | _opcional_ | |
| DEP-04 | Pagar PIX (app banco/MP) | _preencher_ | _OK / Falha_ | _opcional_ | |
| DEP-05 | Em até ~5 min: saldo no player atualizou? | _preencher_ | **SIM / NÃO** | | |
| DEP-06 | Histórico PIX do usuário aparece na tela? | _preencher_ | **SIM / NÃO** | | |
| DEP-07 | Console/Network sem erro CORS ou 5xx? | _preencher_ | **SIM / NÃO** | | |

**Critério de sucesso depósito:** DEP-05 = SIM, DEP-06 = SIM, DEP-07 = SIM.

---

## 4) Checklist manual guiado — Saque PIX (evidência a preencher pelo operador)

*Não preencher chave PIX, valor real ou dados sensíveis.*

| ID | Passo | Horário | Status observado | Print/HAR | Observação |
|----|--------|---------|------------------|-----------|------------|
| SAQ-01 | Abrir /withdraw (Withdraw.jsx) no player produção | _preencher_ | _OK / Falha_ | _opcional_ | |
| SAQ-02 | Solicitar saque (valor de teste; chave PIX válida mascarada) | _preencher_ | _OK / Falha_ | _opcional_ | |
| SAQ-03 | Request retorna sucesso (status 200 e mensagem de sucesso)? | _preencher_ | **SIM / NÃO** (status: _) | | |
| SAQ-04 | GET /api/withdraw/history mostra o saque na lista? | _preencher_ | **SIM / NÃO** | | |
| SAQ-05 | Worker processou (status do saque mudou para processando/processado)? | _preencher_ | **SIM / NÃO / INDETERMINADO** | | |
| SAQ-06 | Status final do saque atualizado via webhook MP? | _preencher_ | **SIM / NÃO** | | |
| SAQ-07 | Sem erro CORS/500 no console? | _preencher_ | **SIM / NÃO** | | |

**Critério de sucesso saque:** SAQ-03 = SIM, SAQ-04 = SIM, SAQ-07 = SIM; SAQ-05/SAQ-06 conforme expectativa (worker + webhook ativos).

---

## 5) Coleta read-only de evidências técnicas (sem credenciais)

### 5.1 Logs Fly

- **Comando (se já autenticado):** `flyctl logs --app goldeouro-backend-v2` (ou `--instance <id>`).
- **Registro:** Não foi executado nesta sessão para evitar exposição de dados em log. Se o operador tiver flyctl autenticado, pode rodar localmente e anotar apenas indicadores de sucesso/erro (ex.: “[PIX] PIX criado”, “[WEBHOOK] Claim ganhou”, “[PAYOUT][WORKER]”) sem colar trechos que contenham tokens ou dados pessoais.
- **Se não estiver autenticado:** Registrar “Logs Fly: indisponível sem login” e não tentar login para esta auditoria.

### 5.2 Endpoints públicos de status

- **Código (server-fly.js):** Existem `/health`, `/api/monitoring/health`, `/api/production-status`. Apenas `/health` foi chamado (público; sem auth).
- **Uso nesta validação:** Nenhum GET em endpoints de PIX/saque (todos exigem autenticação); nenhum endpoint público de “status de PIX/saque” foi inventado.

---

## 6) Verificação de config (sem expor valores)

### 6.1 Variáveis de ambiente relevantes (nomes)

- **PAYOUT_PIX_ENABLED** — ativa o worker de saque PIX (server-fly.js, processPendingWithdrawals).  
- **MERCADOPAGO_DEPOSIT_ACCESS_TOKEN** — token para criar PIX (depósito) no server-fly.js.  
- **MERCADOPAGO_WEBHOOK_SECRET** — validação de assinatura do webhook (server-fly.js, webhook-signature-validator).  
- **MERCADOPAGO_ACCESS_TOKEN** — referenciado em outros arquivos; em produção o entrypoint é server-fly.js (depósito usa MERCADOPAGO_DEPOSIT_ACCESS_TOKEN).

### 6.2 Existência no Fly (flyctl secrets list — somente EXISTE / NÃO EXISTE)

**Comando:** `flyctl secrets list --app goldeouro-backend-v2` (executado com credencial ativa).

| Nome da secret | Existência |
|----------------|------------|
| PAYOUT_PIX_ENABLED | **EXISTE** |
| MERCADOPAGO_ACCESS_TOKEN | **EXISTE** |
| MERCADOPAGO_WEBHOOK_SECRET | **EXISTE** |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | **EXISTE** |
| ENABLE_PIX_PAYOUT_WORKER | **EXISTE** |
| MERCADOPAGO_PAYOUT_ACCESS_TOKEN | **EXISTE** |

*Valores não foram impressos nem armazenados no relatório.*

---

## 7) Conclusão GO/NO-GO (V1 Financeiro)

### 7.1 Critérios

- **GO:** Depósito E2E OK + Saque E2E OK (incluindo worker/webhook quando aplicável) + CORS OK para origem de produção do player. Admin pode estar em mock.
- **NO-GO:** Saldo não credita após PIX; saque não processa; erro de webhook; payout desabilitado quando necessário; CORS bloqueando produção.

### 7.2 Resultado automático (pré-manual)

Com base apenas na coleta read-only (sem execução dos checklists manuais DEP e SAQ):

- **Health e release:** OK (200, database e Mercado Pago connected; release deployment-01KJB5K9MPDYQ49P82YF2P3J3D; 3 máquinas).
- **CORS:** OK para **https://www.goldeouro.lol** (204 + allow-origin). **https://app.goldeouro.lol** retornou 404 no preflight.
- **Secrets:** PAYOUT_PIX_ENABLED, MERCADOPAGO_* e relacionados existem no app (valores não verificados).
- **E2E depósito/saque:** **Pendente** — depende do preenchimento dos checklists manuais (seções 3 e 4).

**Conclusão pré-manual:** **GO condicional** para infra e config (backend ok, CORS ok para www, secrets presentes). **GO/NO-GO final** deve ser definido após o operador preencher DEP-01 a DEP-07 e SAQ-01 a SAQ-07.

### 7.3 Bloqueadores potenciais (máximo 5)

1. **Origem app.goldeouro.lol** — Preflight 404; se o player em produção usar essa origem, pode haver bloqueio CORS até incluir no backend.
2. **DEP-05 = NÃO** — Saldo não atualiza após pagar PIX (webhook ou crédito no backend).
3. **SAQ-03 = NÃO** — Request de saque falha (validação, saldo, ou endpoint).
4. **SAQ-05/SAQ-06 = NÃO** — Worker ou webhook de payout não atualizam status (PAYOUT_PIX_ENABLED=false ou falha de integração).
5. **DEP-07 ou SAQ-07 = NÃO** — Erro CORS ou 5xx no console/Network durante fluxo.

### 7.4 Próximo passo recomendado (sem alterar código)

1. Executar os checklists manuais (seções 3 e 4) no player de produção (FyKKeg6zb) e preencher as tabelas com horário, status e observações.
2. Se DEP-05, DEP-06, DEP-07 = SIM e SAQ-03, SAQ-04, SAQ-07 = SIM (e SAQ-05/06 conforme esperado): marcar **GO** para V1 Financeiro e arquivar este relatório como evidência.
3. Se algum item falhar: marcar **NO-GO**, anotar o número do bloqueador (1–5) e a causa observada; em seguida planejar correção (config, CORS, webhook ou worker) sem alterar código nesta fase de auditoria.

---

**Fim do relatório.** Nenhum código, env ou deploy foi alterado. Apenas criado `docs/relatorios/VALIDACAO-E2E-FINANCEIRO-V1-2026-02-28.md`.
