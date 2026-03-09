# E2E Saque PIX controlado V308 — Produção Fly (2026-03-03)

**Data/hora:** 2026-03-03  
**App:** goldeouro-backend-v2  
**Objetivo:** Criar 1 saque mínimo real (R$ 10) via API, capturar DB_BEFORE, observar logs ~180 s, capturar DB_AFTER e declarar E2E GO/NO-GO/PARCIAL.

---

## Regras absolutas (respeitadas)

- Não alterar código.
- Não alterar secrets/env.
- Não fazer deploy.
- Não reiniciar máquinas.
- Não escrever no banco diretamente.
- Única escrita permitida: 1 saque via POST `/api/withdraw/request`.
- Tudo documentado com outputs reais.

---

## Contexto (máquinas e release)

**Comandos executados:**

```powershell
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
```

**Output relevante (status):**

```
App
  Name     = goldeouro-backend-v2
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines
PROCESS      	ID            	VERSION	STATE  	CHECKS
app          	2874551a105768	308    	started	1 total, 1 passing
app          	e82d445ae76178	308    	stopped	1 total, 1 warning
payout_worker	e82794da791108	308    	started
```

**Identificadores registrados:**

| Item | Valor |
|------|--------|
| **APP_HEALTHY_ID** | `2874551a105768` (withered-cherry-5478, app com 1/1 passing) |
| **WORKER_ID** | `e82794da791108` (weathered-dream-1146, payout_worker started) |
| Imagem / release | `goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH`, V308 |

---

## Guarda do token (PREPARAÇÃO)

**Verificação executada:**

```powershell
if ($env:BEARER -and $env:BEARER -match '^Bearer ') { Write-Output 'TOKEN_OK' } else { Write-Output 'TOKEN_NAO_DEFINIDO' }
```

**Resultado:** `TOKEN_NAO_DEFINIDO`

**Decisão:** Conforme regras, **não prosseguir** sem token. O endpoint POST `/api/withdraw/request` **não foi chamado**. Nenhum saque foi criado. Passos 2 (DB_BEFORE), 3 (logs), 4 (DB_AFTER) e 5 (veredito por transição de status) **não foram executados**.

**Instrução para o operador (sem vazar token):**  
Definir no PowerShell **variável de ambiente** (não local):

```powershell
$env:BEARER = "Bearer <JWT_do_usuario_de_teste>"
```

O valor deve começar com `Bearer ` (com espaço). Obter o JWT com o usuário logado (ex.: DevTools → Application → Local Storage / Session Storage → token/accessToken/jwt/idToken).

---

## PASSO 1 — Criar 1 saque controlado

**Status:** **Não executado** (guarda do token falhou).

- Endpoint: `POST https://goldeouro-backend-v2.fly.dev/api/withdraw/request`
- Headers: `Authorization: $env:BEARER`, `Content-Type: application/json`
- Body utilizado (contrato pt-br):  
  `{"valor":10,"chave_pix":"teste-e2e-chave-random-123","tipo_chave":"random"}`
- Status HTTP: N/A  
- Body de resposta: N/A  
- **SAQUE_ID:** N/A  

---

## PASSO 2 — Snapshot DB_BEFORE (READ-ONLY)

**Status:** **Não executado** (sem SAQUE_ID).

Script previsto: Node READ-ONLY em Base64, executado via:

`flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C 'node -e "eval(Buffer.from(process.argv[1],\"base64\").toString())" <BASE64> <SAQUE_ID>'`

**DB_BEFORE (output):** N/A  

---

## PASSO 3 — Logs do payout_worker (~180 s)

**Status:** **Não executado** (E2E encerrado na guarda).

Filtro planejado: `[PAYOUT]`, `[SAQUE]`, PENDING, PROCESSING, processando, COMPLETED, REJECTED, erro, fail, exception, reconcile.

**Trechos de logs:** N/A  
**Intervalo observado:** N/A  

---

## PASSO 4 — Snapshot DB_AFTER (READ-ONLY)

**Status:** **Não executado** (sem SAQUE_ID).

**DB_AFTER (output):** N/A  

---

## PASSO 5 — Veredito (E2E GO / PARCIAL / NO-GO / INCONCLUSIVO)

**Veredito final:** **INCONCLUSIVO**

**Motivo:** A variável de ambiente `$env:BEARER` não estava definida (ou não começava com `Bearer `). Sem token válido, o saque não foi criado e não houve SAQUE_ID para consultar no banco nem para avaliar transição de status após ciclos do worker. Portanto não foi possível concluir o E2E (nem GO, nem PARCIAL, nem NO-GO com base em evidência de processamento).

---

## Tabela de comparação

| Item | Esperado | Nesta execução |
|------|----------|----------------|
| Guarda token | $env:BEARER definido e começando com "Bearer " | TOKEN_NAO_DEFINIDO |
| PASSO 1 | HTTP 200/201 + SAQUE_ID | Não executado |
| DB_BEFORE | Snapshot do saque recém-criado | N/A |
| Logs | ≥ 2 ciclos do worker em ~180 s | N/A |
| DB_AFTER | Mesmo SAQUE_ID com status/processed_at/transacao_id | N/A |
| Veredito | GO / PARCIAL / NO-GO conforme transição | INCONCLUSIVO |

---

## Declaração formal

**Nenhuma alteração de código, deploy, secrets/env ou restart foi feita. Nenhum saque foi criado (endpoint não chamado). Foram feitas apenas a verificação do token, a coleta do status e da lista de máquinas do Fly e a redação deste relatório.**

Para reexecutar o E2E: definir `$env:BEARER` no PowerShell, rodar PASSO 1 (POST com o body acima), anotar SAQUE_ID, executar PASSO 2 (script Base64 no app healthy), PASSO 3 (logs ~180 s), PASSO 4 (mesmo script, DB_AFTER) e então aplicar os critérios de PASSO 5 para declarar GO/PARCIAL/NO-GO.
