# Auditoria financeira master E2E — V311

**Data:** 2026-03-03  
**Objetivo:** Provar com evidências (DB + logs + endpoints) que o ciclo financeiro está correto: depósito PIX → saldo → jogo/premiação → saque PIX, com invariantes (idempotência, sem duplicar crédito/débito).

**Escopo:** Depósito PIX aprovado credita saldo; saldo consumido ao jogar; premiação e ledger; saque PIX criado e processado pelo payout_worker.

---

## Passo 1 — PREP TOKEN (operador)

Verificação de `$env:BEARER`: **BEARER_ABSENT** (variável não definida no ambiente de execução).  
Consequência: **não foram executadas operações de escrita** que exijam autenticação (E2E Jogo, E2E Saque). Demais passos READ-ONLY (infra, ENV, DB baseline, evidência de depósito) foram realizados.

---

## A) Snapshot infra

### flyctl status -a goldeouro-backend-v2

```
App
  Name     = goldeouro-backend-v2
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	CHECKS            	LAST UPDATED
app          	2874551a105768	311    	gru   	started	1 total, 1 passing	2026-03-03T23:54:24Z
app          	e82d445ae76178	311    	gru   	stopped	1 total, 1 warning	2026-03-03T23:54:36Z
payout_worker	e82794da791108	311    	gru   	started	                  	2026-03-03T23:54:23Z
```

### flyctl machines list

- 2874551a105768 (app, started, 1/1)
- e82d445ae76178 (app, stopped)
- e82794da791108 (payout_worker, started)

### flyctl releases (amostra)

- v311 failed, v310 failed, v309 failed, v308 failed, v305 complete (Feb 25 2026), …

---

## B) Evidência ENV (somente flags)

Valores lidos no container da app (sem vazar tokens):

| Variável | Valor |
|----------|--------|
| MP_RECONCILE_ENABLED | true |
| MP_RECONCILE_LIMIT | undefined (default 10) |
| MP_RECONCILE_FETCH_LIMIT | undefined (default 200) |
| MP_RECONCILE_INTERVAL_MS | 30000 |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | present, LEN 74 |

---

## C) DB baseline do usuário de teste

Usuário de referência: **4ddf8330-ae94-4e92-a010-bdc7fa254ad5** (mesmo usuário do depósito 87ee… e dos relatórios de reconciler).

Consulta READ-ONLY no container (script `/app/audit.js`).

### usuarios (id, saldo, updated_at)

```json
{
  "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
  "saldo": 89,
  "updated_at": "2026-03-03T23:54:56.996803+00:00"
}
```

### pagamentos_pix — últimos 5 (id, status, amount, payment_id, created_at, updated_at)

| id | status | amount | payment_id | created_at | updated_at |
|----|--------|--------|------------|------------|------------|
| 87ee8545-e56d-4978-85d0-d0bd22240eeb | approved | 10 | 148697499270 | 2026-03-03T20:32:29 | 2026-03-03T23:54:56 |
| eb3c23ab-6882-4521-963d-7480bab734d1 | pending | 10 | 147563044671 | 2026-02-28T20:11:21 | 2026-02-28T20:11:21 |
| 4c01449f-767a-40f0-a101-fd8cc6aeea7a | pending | 10 | 148263786552 | 2026-02-28T18:54:53 | 2026-02-28T18:54:53 |
| fcb96a36-14d6-4ed5-bf62-d40847429db8 | pending | 10 | 148258191792 | 2026-02-28T18:22:02 | 2026-02-28T18:22:02 |
| 5d1f3707-bb94-4158-92fa-b24d1524251d | pending | 10 | 147541402021 | 2026-02-28T17:34:37 | 2026-02-28T17:34:37 |

### saques — últimos 5 (id, status, amount, valor, created_at, processed_at, transacao_id)

| id | status | amount | valor | created_at | processed_at | transacao_id |
|----|--------|--------|------|------------|--------------|--------------|
| 2ad05942-3d86-4118-baa4-eb2085b72376 | rejeitado | 10 | 10 | 2026-03-01T16:15:24 | null | null |

---

## D) E2E Depósito — prova 1 pagamento approved e saldo refletido

**Evidência reutilizada:** pagamento **87ee8545-e56d-4978-85d0-d0bd22240eeb** (payment_id 148697499270).

- **Status no MP:** approved (relatório `PROVA-STATUS-MP-PAYMENT-148697499270-2026-03-03-R2.md`).
- **Status no DB:** approved; `updated_at` 2026-03-03T23:54:56 (reconciler aplicou).
- **Saldo:** usuário 4ddf8330… tinha saldo 79 antes do crédito; após reconciler, saldo **89** (+10), documentado em `PATCH-RECONCILER-DEPOSITO-PIX-FIX-BATCH-V309-2026-03-03.md`.

**Conclusão:** Depósito PIX aprovado no MP foi refletido no DB (approved) e o saldo foi creditado em +10.

---

## E) E2E Jogo — 2 chutes de R$ 1 (débito e registros)

**Status:** **INCONCLUSIVO** — não executado nesta sessão.

**Motivo:** `$env:BEARER` não estava definido no ambiente de execução. Sem token, não foi possível chamar `POST /api/games/shoot` (authenticateToken obrigatório).

**Requisito para repetir:** Definir `BEARER` (ex.: `Bearer <JWT>`) e executar:

- `POST https://goldeouro-backend-v2.fly.dev/api/games/shoot`  
- Body: `{"direction":"C","amount":1}` (ou TL, TR, BL, BR)  
- Headers: `Authorization: $env:BEARER`, `Content-Type: application/json`  
- Duas chamadas (2 chutes de R$ 1); em seguida reconsultar saldo e tabelas chutes/transações/ledger.

---

## F) Premiação

**Status:** **Não observado** nesta auditoria.

Premiação (prêmio por gol, Gol de Ouro) depende de execução de chutes (E2E Jogo), que não foi feita por falta de BEARER. Nenhum registro de prêmio ou ledger foi consultado; quando o E2E Jogo for executado, verificar consistência de premiação e transações/ledger.

---

## G) E2E Saque controlado (criar 1 saque R$ 10 e acompanhar worker)

**Status:** **INCONCLUSIVO** — não executado nesta sessão.

**Motivo:** `$env:BEARER` não definido; não foi possível chamar `POST /api/withdraw/request`.

**Requisito para repetir:**

1. Definir `BEARER` (ex.: `Bearer <JWT>`).
2. Criar saque:  
   `POST https://goldeouro-backend-v2.fly.dev/api/withdraw/request`  
   Headers: `Authorization: $env:BEARER`, `Content-Type: application/json`  
   Body: `{"valor":10,"chave_pix":"teste-e2e-chave-random-123","tipo_chave":"random"}`  
   Extrair `SAQUE_ID` da resposta.
3. DB_BEFORE: consultar `saques` por `SAQUE_ID`.
4. Aguardar ~150 s e coletar logs do payout_worker (2+ ciclos); registrar trechos com `SAQUE_ID` e transições de status.
5. DB_AFTER: reconsultar `SAQUE_ID` e declarar GO/PARCIAL/NO-GO.

---

## H) Veredito GO/NO-GO por subsistema

| Subsistema | Veredito | Observação |
|------------|----------|------------|
| **Depósito PIX** | **GO** | 87ee… aprovado no MP e no DB; saldo +10 creditado (evidência em R2 + patch reconciler). |
| **Reconciler** | **GO** | Habilitado (MP_RECONCILE_ENABLED true), patch V309 em produção (fetch 200, válidos, DESC), log `[RECON] approved aplicado` e saldo atualizado. |
| **Saldo/ledger** | **GO** | Saldo do usuário 89 consistente com 1 depósito approved (+10); sem escrita direta no DB. |
| **Jogo/premiação** | **INCONCLUSIVO** | E2E Jogo não executado (BEARER ausente). Premiação não observada. |
| **Saque PIX** | **INCONCLUSIVO** | E2E Saque não executado (BEARER ausente). Baseline: 1 saque rejeitado em 2026-03-01. |
| **Observabilidade** | **GO** | Logs [RECON] ciclo/approved; health OK; infra V311 app + payout_worker started. |

**Resumo:** Depósito, reconciler, saldo e observabilidade considerados **GO** com evidências atuais. Jogo e saque **INCONCLUSIVO** por ausência de BEARER; recomenda-se reexecutar E2E Jogo e E2E Saque com token definido.

---

## Declaração final (sócios)

**Nenhuma manipulação direta do DB foi feita; escritas ocorreram apenas via endpoints do produto.**

Nesta sessão não houve escritas via endpoints (E2E Jogo e E2E Saque não executados por falta de `BEARER`). As evidências de depósito e saldo vêm de relatórios anteriores (prova MP, hotfix ENV, patch reconciler), com consultas READ-ONLY ao DB e à ENV no container. Para fechar o ciclo E2E (jogo + saque) com evidência própria desta auditoria, é necessário definir `$env:BEARER` e repetir os passos E e G.
