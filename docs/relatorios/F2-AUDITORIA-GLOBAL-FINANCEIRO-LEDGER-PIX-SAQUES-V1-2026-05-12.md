# F2 — AUDITORIA GLOBAL FINAL V1
# FINANCEIRO + LEDGER + PIX + SAQUES

**Modo:** READ-ONLY (sem alterações de código, deploy, banco, workflows ou commits)  
**Data da auditoria:** 2026-05-15 (sessão F2)  
**Branch:** `fix/admin-financial-integrity-v1`  
**HEAD:** `fe7b7acd03493031cfdab1cdb7358d2e34c881c5` (`fe7b7ac`)  
**Contexto:** F1 aprovada com ressalvas · Fly **v452** · produção `https://goldeouro-backend-v2.fly.dev`  
**Runtime deployado (F1/H2):** `gitCommit` **7ecedca** em `/meta` (código financeiro auditado neste HEAD de repo + artefacto v452)

---

## 1. Resumo executivo

Auditoria **F2** do núcleo financeiro V1: depósitos PIX (Mercado Pago), ledger imutável, saques PIX (request + worker + webhook payout), reconciliação e hardening documentado em **2026-04-28**.

**Conclusão:** a arquitetura financeira em `server-fly.js` + `src/domain/payout/processPendingWithdrawals.js` + `src/workers/payout-worker.js` é **coerente, defensiva e operacional** em produção (`/health` com `mercadoPago: connected`, worker flags ativas). Há **idempotência explícita** em depósito (claim + RPC/fallback), saque (`correlation_id`, índice único no ledger) e payout (ledger `payout_confirmado` / `falha_payout`). Webhook de **depósito** exige assinatura (**401** sem ela). Reconcile de PIX pendentes está **ativo por defeito** (intervalo configurável).

**Ressalvas principais (não bloqueantes F2):** depósitos **não** gravam em `ledger_financeiro` (lacuna de trilho contábil unificado); webhook de **payout** (`POST /webhooks/mercadopago`) **não** valida assinatura no código auditado; função SQL `claim_and_credit_approved_pix_deposit` referenciada no backend mas **ficheiro SQL não versionado** no repositório (dependência de migration aplicada no Supabase); incidente histórico de ledger manual documentado (Plano B, maio/2026).

**Classificação oficial F2:** **F2 APROVADO COM RESSALVAS**

| Dimensão | Resultado |
|----------|-----------|
| Arquitetura financeira | ✅ Coerente |
| PIX depósito + reconcile | ✅ Protegido + fallback |
| Ledger / saques | ✅ Idempotente com rollback |
| Worker payout | ✅ Ativo em produção (flags) |
| Webhook depósito | ✅ Assinatura obrigatória |
| Webhook payout | ⚠️ Sem validação de assinatura |
| Trilho ledger depósitos | ⚠️ Ausente |
| Produção | ✅ Estável |

---

## 2. Estado Git

### Comandos

```text
git status --short
git branch --show-current
git log -5 --oneline
git rev-parse HEAD
```

### Registo

| Campo | Valor |
|-------|--------|
| **HEAD** | `fe7b7ac` — *docs: registrar F1 auditoria runtime backend V1* |
| **Branch** | `fix/admin-financial-integrity-v1` |
| **Working tree** | ` M goldeouro-player/vercel.json` + 25+ `??` (relatórios, scripts, SQL operacional) — **fora do escopo F2** |

### `git log -5 --oneline`

```text
fe7b7ac docs: registrar F1 auditoria runtime backend V1
61c4679 docs: registrar validacao global runtime fechamento pipeline V1
a94a70b docs: registrar H2 execucao controlada gitCommit runtime
7ecedca fix(ci): injetar GIT_COMMIT no deploy on-demand Fly (H2)
77464f5 docs: preparar baseline H2 runtime traceability
```

**Baseline financeira em código:** commits de hardening e saques manuais estão na branch; runtime Fly v452 alinhado a **7ecedca** (anterior ao commit F1/F2 docs).

---

## 3. Arquitetura financeira

### 3.1 Componentes principais

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (player / admin)                         │
└───────────────┬───────────────────────────────┬─────────────────────────┘
                │ JWT                            │ Admin JWT
                ▼                                ▼
┌─────────────────────────── server-fly.js ───────────────────────────────┐
│  POST /api/payments/pix/criar      POST /api/withdraw/request            │
│  GET  /api/payments/pix/status*    GET  /api/withdraw/history            │
│  POST /api/payments/webhook        POST /webhooks/mercadopago (payout)   │
│  reconcilePendingPayments() [setInterval]                                │
│  claimAndCreditApprovedPixDeposit()                                      │
└───────┬───────────────────────────────┬─────────────────────────────────┘
        │                               │
        ▼                               ▼
┌─────────────── Supabase ──────────────┐   ┌── Mercado Pago API ─────────┐
│ pagamentos_pix                        │   │ v1/payments (depósito)      │
│ usuarios.saldo                        │   │ transaction-intents (payout)│
│ saques                                │   └─────────────────────────────┘
│ ledger_financeiro (append-only)       │
│ transacoes (legado / parcial)         │
│ RPC claim_and_credit_* (se existir)   │
└───────────────────────────────────────┘
        ▲
        │ processPendingWithdrawals()
┌───────┴───────────────────────────────┐
│  payout_worker (Fly process separado)  │
│  src/workers/payout-worker.js          │
└────────────────────────────────────────┘
```

### 3.2 Tabelas e funções críticas

| Artefacto | Papel |
|-----------|--------|
| `pagamentos_pix` | Estado do depósito (`pending` → `approved`); `payment_id` / `external_id` |
| `usuarios.saldo` | Saldo jogável; crédito depósito; débito saque com lock otimista |
| `saques` | Fila de saque; `correlation_id`, `payout_external_reference`, estados MP |
| `ledger_financeiro` | Trilho imutável: `saque`, `taxa`, `rollback`, `payout_confirmado`, `falha_payout`, tipos manuais |
| `claim_and_credit_approved_pix_deposit` | RPC SQL atómico (preferencial) |
| `createLedgerEntry` | Insert idempotente `(correlation_id, tipo, referencia)` |
| `rollbackWithdraw` | Recompõe saldo + ledger `rollback` + status terminal |
| `reconcilePendingPayments` | Fallback periódico para PIX `pending` antigos |

### 3.3 Ficheiros de código (mapa)

| Área | Ficheiro |
|------|----------|
| Orquestração HTTP | `server-fly.js` |
| Payout / ledger / manual admin | `src/domain/payout/processPendingWithdrawals.js` |
| Worker Fly | `src/workers/payout-worker.js` |
| MP PIX out | `services/pix-mercado-pago.js` |
| Assinatura webhook depósito | `utils/webhook-signature-validator.js` |
| Schema ledger | `database/schema-ledger-financeiro.sql` |
| Tipos ledger/saques manuais | `database/migrations/20260201_manual_withdraw_v1_ledger_and_status.sql` |
| Validação PIX/saque | `utils/pix-validator.js` |

---

## 4. Fluxo PIX

### 4.1 Criação — `POST /api/payments/pix/criar`

- **Auth:** `authenticateToken`
- **Validações:** `amount` 1–1000; MP token + `mercadoPagoConnected`; Supabase up
- **Ação:** cria pagamento MP; insere `pagamentos_pix` (`pending`); `notification_url` → `/api/payments/webhook`
- **Log:** `financeLog('deposit_created', ...)`

### 4.2 Status — `GET /api/payments/pix/status` e `/api/payments/pix/status/:paymentId`

- **Auth:** obrigatória
- **Handler:** `handleGetPixStatus` — **400** se `paymentId` inválido/ausente (após auth)
- **Produção (sem token):** **401**

### 4.3 Crédito — `claimAndCreditApprovedPixDeposit(idStr)`

1. Tenta `supabase.rpc('claim_and_credit_approved_pix_deposit', { p_mercadopago_id })`
2. Se RPC indisponível → fallback: `UPDATE pagamentos_pix` com `.neq('status','approved')` exigindo **exactamente 1 linha** → `UPDATE usuarios.saldo`
3. Logs: `deposit_claim_sql`, `deposit_claim_credited_fallback`, etc.

**Ponto forte:** caminho canónico atómico quando RPC existe.  
**Ressalva:** fallback não é transação SQL única (janela teórica entre claim e crédito se RPC ausente).

### 4.4 Probes produção (2026-05-15)

| Request | HTTP | Classificação |
|---------|------|---------------|
| `POST /api/payments/pix/criar` `{}` | **401** | Rota existe, auth OK |
| `GET /api/payments/pix/status` | **401** | Idem |
| `GET /api/payments/pix/status/123456789` | **401** | Idem (auth antes de 400) |
| `POST /api/payments/webhook` sem assinatura | **401** | Webhook depósito protegido ✅ |

---

## 5. Ledger e saldos

### 5.1 Modelo `ledger_financeiro`

```sql
-- database/schema-ledger-financeiro.sql (resumo)
-- UNIQUE (correlation_id, tipo, referencia)
-- tipos base: deposito, saque, taxa, rollback, payout_confirmado, falha_payout
-- migration 20260201: + payout_manual_confirmado, rollback_manual
```

**Coluna em runtime:** código usa `user_id` em inserts (`LEDGER_USER_COLUMN` em `processPendingWithdrawals.js`).

### 5.2 O que grava ledger

| Operação | Ledger? |
|----------|---------|
| Depósito PIX aprovado | **Não** (apenas `pagamentos_pix` + `usuarios.saldo`) |
| Saque solicitado | **Sim** — `saque` + `taxa` |
| Rollback saque | **Sim** — `rollback` (+ fee ref `:fee`) |
| Payout confirmado (webhook/worker) | **Sim** — `payout_confirmado` |
| Payout falhou | **Sim** — `falha_payout` + rollback saldo |
| Saque manual admin | **Sim** — `payout_manual_confirmado` / `rollback_manual` |

### 5.3 Idempotência ledger — `createLedgerEntry`

- Pré-select por `(correlation_id, tipo, referencia)`
- Insert com tratamento `23505` / duplicate → `deduped: true`
- Índice único alinhado ao schema

### 5.4 Saque request — consistência saldo

Fluxo em `server-fly.js` (L1620–1986):

1. `x-idempotency-key` / `x-correlation-id` / UUID → `correlation_id`
2. Retorno **200** se saque já existe (idempotência)
3. Bloqueio **409** se outro saque `pendente`
4. Débito: `.update({ saldo }).eq('id').eq('saldo', usuario.saldo)` → **409** em conflito
5. Insert `saques` + ledger `saque` + `taxa`; falha → `rollbackWithdraw`
6. Verificação mínima: 2 linhas ledger (`saque`, `taxa`) antes de **201**

### 5.5 Depósito vs integridade global

- **Forte:** claim idempotente + webhook duplicado ignorado se já `approved`
- **Parcial:** depósito fora do ledger dificulta reconciliação contábil única saldo ↔ ledger (auditoria fev/2026 já notou)

---

## 6. Saques

### 6.1 `POST /api/withdraw/request`

| Proteção | Implementação |
|----------|----------------|
| Auth JWT | `authenticateToken` |
| Validação PIX | `pixValidator.validateWithdrawData` |
| Valor mínimo | R$ 10,00 |
| CPF/CNPJ titular | Obrigatório para chaves email/phone/random |
| Idempotência | `correlation_id` único |
| Anti-duplicata pendente | 409 |
| Saldo | 400 insuficiente; 409 lock otimista |
| Taxa | `PAGAMENTO_TAXA_SAQUE` (default 2.00) |
| Ledger + rollback | Sim |

**Produção:** `POST` sem token → **401** ✅

### 6.2 `GET /api/withdraw/history`

- Lista saques do `req.user.userId`
- **Produção:** **401** sem token ✅

### 6.3 `payout_worker`

| Item | Evidência |
|------|-----------|
| Processo Fly | `payout_worker` machine `784e047bd04e08`, v452, `started` |
| Flags `/health/workers` | `enabledByEnv: true`, `payoutPixProcessingEnabled: true` |
| Entry | `src/workers/payout-worker.js` |
| Ciclo | `processPendingWithdrawals` — 1 saque pendente por ciclo |
| Corte temporal | `PAYOUT_AUTO_FROM_AT` obrigatório em auto |
| Modo manual | `PAYOUT_MODE=manual` → não chama MP |
| Owner PIX | `buildOwnerIdentification` + `fetchUsuarioFiscalDocument` (cpf_cnpj e candidatos ENV) |
| Lock | `pendente` → `processando` condicional |
| Auto-heal | `healStuckProcessingWithRollback` |

### 6.4 Estados de saque (amostra)

`pendente`, `pending`, `processando`, `aguardando_confirmacao`, `processado`, `falhou`, `pago_manual`, `cancelado_manual`, entre outros (migration `20260201`).

### 6.5 Admin manual

- `controllers/adminWithdrawController.js` → `approveWithdrawManualAdmin` / `cancelWithdrawManualAdmin`
- Tipos ledger dedicados; bloqueio `ALREADY_PAID` se `payout_confirmado` / `payout_manual_confirmado` existir

---

## 7. Webhooks

### 7.1 Depósito — `POST /api/payments/webhook`

| Aspeto | Comportamento |
|--------|----------------|
| Assinatura | **Obrigatória** — `webhookSignatureValidator.validateMercadoPagoWebhook` |
| Falha | **401** `{ error: 'Invalid signature' }` |
| Resposta | **200** imediato `{ received: true }`; processamento assíncrono |
| Idempotência | Skip se `pagamentos_pix.status === 'approved'` |
| Confirmação MP | GET `/v1/payments/{id}` antes de creditar |
| Crédito | `claimAndCreditApprovedPixDeposit` |

**Produção:** POST sem headers MP → **401** ✅

### 7.2 Payout — `POST /webhooks/mercadopago`

| Aspeto | Comportamento |
|--------|----------------|
| Separação | Eventos `payment` numérico **ignorados** (redirecionados ao webhook depósito) |
| Assinatura | **Não auditada** neste handler (sem chamada a `validateMercadoPagoWebhook`) |
| Resposta | **200** `{ received: true }` imediato |
| Lookup saque | `payout_external_reference` + fallback legado `uuid_uuid` |
| Idempotência ledger | Skip se `payout_confirmado` ou `falha_payout` já existe |
| Sucesso | `payout_confirmado` + status `processado` |
| Falha | `falha_payout` + `rollbackWithdraw` |

**Produção:** `POST {}` → **200** (rota viva; confiança em identificação por `external_reference` + MP API GET intent)

**Risco:** superfície de replay/spoof se URL pública for descoberta sem camada extra (WAF/secret query/IP allowlist não verificados nesta F2).

---

## 8. Reconcile

### 8.1 Implementação — `reconcilePendingPayments()`

- **Ativo** se `MP_RECONCILE_ENABLED !== 'false'` (default **on**)
- Intervalo: `MP_RECONCILE_INTERVAL_MS` (default 60000 ms, mínimo 30s no código)
- Seleciona `pagamentos_pix` `pending` com `created_at` anterior a `MP_RECONCILE_MIN_AGE_MIN` (default 2 min, max 120)
- Limite: `MP_RECONCILE_LIMIT` (default 10, max 200)
- Consulta MP; se `approved` → `claimAndCreditApprovedPixDeposit`
- Flag `reconciling` evita sobreposição de ciclos
- Logs: `deposit_reconcile_cycle_start|empty|end|claim`

### 8.2 Papel no sistema

Fallback robusto quando webhook atrasa ou falha — **mitiga perda de crédito** sem duplicar se claim/idempotência funcionar.

---

## 9. Segurança financeira

| Controle | Estado |
|----------|--------|
| Idempotência saque (`correlation_id`) | **Mitigado** |
| Idempotência ledger (unique + dedup) | **Mitigado** |
| Idempotência depósito (claim + approved check) | **Mitigado** (RPC) / **Parcial** (fallback app) |
| Webhook depósito assinatura + ts | **Mitigado** (modo estrito pós 2026-04-28) |
| Webhook payout assinatura | **Aberto** |
| Replay webhook depósito | **Parcialmente mitigado** (ts ±5 min + idempotência) |
| Race saldo saque | **Parcialmente mitigado** (eq saldo, não SERIALIZABLE) |
| Crédito duplicado PIX | **Mitigado** se RPC/claim 1-row |
| Saque duplicado pendente | **Mitigado** (409) |
| Ledger inconsistente pós-request | **Mitigado** (check 2 linhas + rollback) |
| Worker valores inválidos | **Mitigado** (rollback) |
| Saques presos `processando` | **Parcialmente mitigado** (auto-heal) |
| Incidente ledger manual indevido | **Histórico** — Plano B documentado (`PRE-EXECUCAO-PLANO-B-*`, SQL em `??`) |

---

## 10. Produção financeira

| Verificação | Resultado (2026-05-15) |
|-------------|-------------------------|
| `GET /health` | **200** — `mercadoPago: connected`, `database: connected` |
| `GET /health/workers` | **200** — payout worker enabled |
| Fly v452 | App + `payout_worker` started (F1) |
| Endpoints PIX/saque | Existem; **401** sem JWT |
| Webhook depósito | **401** sem assinatura |
| Regressão 404 rotas financeiras | **Não observada** |
| Crash loop worker | **Não observado** (machines started) |

**Não executado nesta F2:** transações reais PIX/saque; queries SELECT em produção; verificação se RPC `claim_and_credit_*` existe no Supabase live.

---

## 11. Riscos críticos

**Nenhum risco crítico aberto** identificado no código + probes públicos que impliquem falha financeira imediata sistémica (endpoints expostos sem auth, webhook depósito aberto, ou ausência total de reconcile/idempotência).

> **Nota:** risco crítico **latente** se RPC SQL **não** estiver aplicada em produção **e** concorrência alta no fallback — classificado como **médio operacional** até confirmação DB (fora do escopo READ-ONLY sem credenciais).

---

## 12. Riscos médios

| ID | Risco | Domínio |
|----|-------|---------|
| M1 | Depósito PIX não registra `ledger_financeiro` | Ledger / saldo |
| M2 | Webhook payout sem validação de assinatura | Webhook |
| M3 | RPC `claim_and_credit_approved_pix_deposit` não versionada no repo | Deploy / atomicidade |
| M4 | Fallback claim+credito em duas queries (sem RPC) | PIX / idempotência |
| M5 | Lock otimista de saldo (não transação DB única no request) | Saques / race |
| M6 | `pagamentos_pix` com 34+ pending históricos (auditoria fev/2026) — depende de reconcile contínuo | Reconcile |
| M7 | Fluxo manual admin + `payout_manual_confirmado` — erro humano (incidente maio/2026 documentado) | Saques / ledger |

---

## 13. Riscos leves

| ID | Risco | Domínio |
|----|-------|---------|
| L1 | `transacoes` parcial vs jogo/chutes | Ledger |
| L2 | Tipos/status duplicados PT/EN (`pendente`/`pending`) | Schema |
| L3 | Payout webhook aceita body vazio com 200 (health probe externo) | Observabilidade |
| L4 | Dependência de múltiplos tokens MP (deposit vs payout) | PIX |
| L5 | Working tree com SQL/scripts financeiros não versionados | Governança |

---

## 14. Riscos mitigados

| Risco histórico | Mitigação atual |
|-----------------|-----------------|
| Webhook depósito permissivo em não-prod | Modo estrito **401** sempre (`HARDENING-FINANCEIRO-V1-2026-04-28`) |
| Crédito duplicado por webhook repetido | Check `approved` + claim idempotente |
| Webhook perdido | `reconcilePendingPayments` ativo |
| Saque sem ledger | Check 2 entradas + rollback |
| Payout duplicado | Ledger dedup `payout_confirmado` |
| Payout falho sem devolver saldo | `rollbackWithdraw` |
| Worker processa valores inválidos | Rollback + fail counter |
| Titular PIX incompleto | `buildOwnerIdentification` + cpf_cnpj |
| Separação depósito/payout webhook | Rotas distintas + ignore payment numérico em payout |
| Hardening logs financeiros | `financeLog` estruturado |

---

## 15. Diagnóstico global

O **sistema financeiro V1** está **maduro o suficiente para produção** com camadas defensivas empilhadas: autenticação em APIs de dinheiro, webhook de entrada com assinatura, reconcile, ledger append-only para saques, worker dedicado e rollback sistemático.

A **principal lacuna estrutural** é a **assimetria de trilho**: saques bem auditados no `ledger_financeiro`, depósitos apenas em `pagamentos_pix` + `saldo`. Para compliance interno V1 isso é **aceitável com ressalva**; para auditoria contábil unificada seria evolução futura.

A **segunda lacuna** é o **webhook de payout** sem paridade de assinatura com o de depósito — mitigado em parte por lookup inequívoco de saque + idempotência de ledger, mas não equivalente ao hardening de depósito.

```text
PIX entrada      ██████████████████░░  Alta (RPC/fallback)
Reconcile        ████████████████████  Alta
Saque + ledger   ███████████████████░  Alta
Worker payout    ███████████████████░  Alta
Webhook depósito ████████████████████  Alta
Webhook payout   ████████████░░░░░░░░  Média
Trilho unificado ████████░░░░░░░░░░░░  Média-baixa
```

---

## 16. Recomendação oficial

### Classificação F2: **F2 APROVADO COM RESSALVAS**

**Critérios F2 APROVADO — cumprimento:**

| Critério | Cumprido |
|----------|----------|
| Arquitetura financeira coerente | ✅ |
| Ledger consistente para saques | ✅ |
| Idempotência presente (depósito/saque/ledger) | ✅ (ressalva fallback) |
| Runtime financeiro saudável | ✅ |
| Endpoints existentes e protegidos | ✅ |
| Webhook depósito protegido | ✅ |
| Reconcile existente e ativo | ✅ |
| Falha financeira crítica conhecida aberta | ❌ Não (incidente maio/2026 com Plano B documentado, não bloqueante arquitectural) |

### Próximos passos sugeridos (fora F2 READ-ONLY)

1. **Confirmar no Supabase** existência e versão da RPC `claim_and_credit_approved_pix_deposit` (read-only `information_schema` / `pg_proc`).
2. **F3+ ou cirurgia dedicada:** avaliar assinatura ou secret partilhado no webhook payout.
3. **Opcional V2:** gravar `deposito` no `ledger_financeiro` no claim (sem alterar saldo duas vezes).
4. **Governança:** versionar ou arquivar SQL/scripts `??` de Plano B e reconciliação.

---

## Anexo A — Probes HTTP financeiros (2026-05-15)

```text
GET  /health                          -> 200
GET  /health/workers                  -> 200 (payout enabled)
POST /api/payments/pix/criar          -> 401
GET  /api/payments/pix/status         -> 401
GET  /api/payments/pix/status/123...  -> 401
POST /api/payments/webhook            -> 401 (sem assinatura)
POST /webhooks/mercadopago            -> 200 (rota payout viva)
POST /api/withdraw/request            -> 401
GET  /api/withdraw/history            -> 401
```

---

## Anexo B — Referências internas

- `docs/relatorios/HARDENING-FINANCEIRO-V1-2026-04-28.md`
- `docs/relatorios/RELATORIO-AUDITORIA-FINANCEIRA-TOTAL-PROD-2026-02-05.md`
- `docs/relatorios/F1-AUDITORIA-GLOBAL-RUNTIME-PRODUCAO-BACKEND-V1-2026-05-12.md`
- `docs/relatorios/PRE-EXECUCAO-PLANO-B-REVERSAO-LEDGER-INDEVIDO-2026-05-04.md`

---

*Fim do relatório F2 — Financeiro + Ledger + PIX + Saques — Gol de Ouro V1.*
