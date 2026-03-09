# Auditoria financeira total — Plano de reconstrução (READ-ONLY)

**Data:** 2026-03-05  
**Modo:** READ-ONLY absoluto (nenhum código alterado, commit ou deploy).  
**Objetivo:** Auditar e desenhar a reconstrução completa do sistema financeiro (depósito PIX, saldo, prêmios, saque, worker, webhook, reconcile, ledger) com segurança máxima, e gerar plano cirúrgico + checklist + backup + rollback.

---

## PASSO A — Congelar “fonte da verdade”

### A1) Estado Fly (read-only, 2026-03-05)

**flyctl status -a goldeouro-backend-v2:**
```
App     Name     = goldeouro-backend-v2
        Hostname = goldeouro-backend-v2.fly.dev
        Image    = goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM

Machines
PROCESS       ID             VERSION  REGION  STATE   CHECKS
app           2874551a105768  312      gru     started 1 total, 1 passing
app           e82d445ae76178  312      gru     stopped 1 total, 1 warning
payout_worker e82794da791108  312      gru     started
```

**flyctl scale show:**
```
NAME          COUNT  KIND   CPUS  MEMORY  REGIONS
app           2      shared 1     256 MB  gru(2)
payout_worker 1      shared 1     256 MB  gru
```

**flyctl releases (últimas):**
```
VERSION  STATUS   DATE
v312     failed   23h46m ago
v311     failed   Mar 3 2026 23:54
v305     complete Feb 25 2026 19:50
v302     complete Feb 3 2026 22:42
```
(Máquinas em execução usam VERSION 312; releases listadas como “failed” podem ser do deploy; as que estão “started” estão na imagem atual.)

### A2) Arquivos realmente usados no start

| Componente | Arquivo de verdade | Evidência |
|------------|--------------------|-----------|
| **fly.toml** | `app = "npm start"`, `payout_worker = "node src/workers/payout-worker.js"` | fly.toml linhas 13-14 |
| **App HTTP** | **server-fly.js** | package.json "start": "node server-fly.js"; Dockerfile CMD ["node", "server-fly.js"] |
| **Worker payout** | **src/workers/payout-worker.js** | fly.toml processes.payout_worker |
| **Não usado como app** | server-fly-deploy.js | Não referenciado em package.json nem fly.toml |

**Conclusão:** Em produção o backend HTTP é **server-fly.js**. O worker é **payout-worker.js**, que chama `processPendingWithdrawals` de `src/domain/payout/processPendingWithdrawals.js`.

---

## PASSO B — Auditoria de arquitetura financeira

### B1) Diagrama E2E do dinheiro

```
[Depósito PIX]
  Criar PIX: POST /api/payments/pix/criar (server-fly.js)
    → Mercado Pago create payment
    → INSERT pagamentos_pix (external_id=payment.id, payment_id=payment.id, status='pending')
  Webhook MP: POST /api/payments/webhook (server-fly.js)
    → Se status approved: UPDATE pagamentos_pix approved, depois UPDATE usuarios.saldo += valor
  Reconciliação: reconcilePendingPayments (setInterval em server-fly.js)
    → SELECT pagamentos_pix WHERE status='pending'
    → Para cada: GET MP /v1/payments/{id} (mpId deve ser numérico; external_id deposito_uuid_* falha e não credita)
    → Se approved: claim atômico UPDATE pagamentos_pix approved, depois UPDATE usuarios.saldo += valor

[Saldo]
  Leitura: GET /api/user/profile (server-fly.js) → SELECT usuarios.saldo
  Escritas: ver FINANCEIRO-MAPA-ESCRITAS-BALANCE-READONLY-2026-03-05.md (login, registro, depósito webhook/recon, prêmio shoot, saque débito/rollback)

[Jogo]
  Aposta: implícita no shoot (valor da aposta descontado no cálculo do vencedor)
  Prêmio: POST /api/games/shoot (server-fly.js) → se gol: UPDATE usuarios SET saldo = saldo - aposta + premio + premioGolDeOuro

[Saque]
  POST /api/withdraw/request (server-fly.js)
    → UPDATE usuarios SET saldo = saldo - valor (.eq('saldo', usuario.saldo))
    → INSERT saques (status='pendente')
    → createLedgerEntry (saque, taxa)
  Worker: payout-worker.js → processPendingWithdrawals
    → SELECT saques pendentes, createPixWithdraw (MP), updateSaqueStatus, createLedgerEntry (payout_confirmado)
  Webhook MP (payout): POST /webhooks/mercadopago
    → UPDATE saques status concluído + processed_at + transacao_id
  Rollback (falha após débito): server-fly ou processPendingWithdrawals → UPDATE usuarios.saldo += valor

[Ledger]
  Tabela: ledger_financeiro. Coluna usuário: user_id (produção) ou usuario_id (fallback no código).
  Idempotência: createLedgerEntry verifica por correlation_id + tipo + referencia; insert usa coluna detectada (user_id/usuario_id).
  Tipos: saque, taxa_saque, payout_confirmado, rollback, deposito_pix (onde aplicável).
```

### B2) Escritas no saldo (consolidado)

Ver documento **docs/relatorios/FINANCEIRO-MAPA-ESCRITAS-BALANCE-READONLY-2026-03-05.md**. Resumo produção: server-fly.js (login, registro, prêmio, saque, webhook depósito, reconcile depósito) e processPendingWithdrawals.js (rollback saque).

### B3) Divergências de schema e nomes

| Aspecto | Produção / código | Observação |
|---------|-------------------|------------|
| Coluna saldo | usuarios.saldo | server-fly e processPendingWithdrawals usam `saldo` |
| Coluna balance | users.balance | pix-service-real, router, models/User (legado/alternativo) |
| Ledger usuário | user_id (prod) / usuario_id (fallback) | processPendingWithdrawals detecta no insert (user_id primeiro) |
| Status saques | pendente, processando, concluido, rejeitado | CHECK no banco pode restringir valores; código usa 'pendente' no INSERT |
| Status pagamentos_pix | pending, approved | Reconciliação filtra .eq('status','pending'); insert usa 'pending' |
| processed_at / transacao_id | Webhook payout preenche em saques | Para rastreio do payout no MP |

### B4) Risco de duplo crédito (depósito)

- **Webhook (2103) + Recon (2410):** Ambos podem creditar se o mesmo pagamento for aprovado: webhook credita ao receber notificação; recon credita ao consultar MP e fazer claim. Mitigação atual: claim atômico no recon (UPDATE pagamentos_pix .neq('status','approved').select); se webhook já tiver aprovado, recon não afeta linhas e não credita. Risco residual: ordem de execução e race; garantir que apenas um dos dois credite por payment_id (ex.: checagem “já creditado” antes de UPDATE saldo).
- **Reconcile com ID inválido:** external_id no formato `deposito_uuid_timestamp` não é numérico; o recon valida `/^\d+$/.test(mpId)` e não chama a API MP nem credita → evita crédito indevido mas gera ruído de log (“ID de pagamento inválido”). Pendências com esse external_id nunca são resolvidas pelo recon até que exista outro mecanismo (ex.: webhook com payment_id numérico ou normalização de external_id).
- **Ausência de UNIQUE:** Não há UNIQUE em (payment_id, status) ou constraint que impeça dois approved para o mesmo payment_id; a idempotência é por lógica (claim atômico). Recomendação: idempotência explícita por payment_id (ou external_id válido) antes de creditar (ex.: “só credita se for o primeiro a marcar approved para esse payment_id”).

---

## PASSO C — Provas read-only no banco

### C1) Ambiente e tabelas

- **Ambiente:** Scripts com dotenv (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) apontam para o projeto configurado localmente (produção ou staging conforme .env).
- **Tabelas:** usuarios, pagamentos_pix, saques, transacoes, ledger_financeiro, chutes existem (evidência de scripts anteriores e auditorias).
- **Ledger:** Coluna de usuário em produção é **user_id** (script prova-origem-creditos-ledger-readonly.js detecta user_id; usuario_id não existe na tabela em prod).

### C2) Resultados de scripts read-only (2026-03-05)

**audit-c-postdeploy-readonly.js:**
- **external_id_duplicados_approved:** [] (nenhum external_id com mais de um approved).
- **payment_ids_com_mais_de_um_approved:** [] (nenhum payment_id com mais de um registro approved).
- **top_diferencas:** Vários usuários com saldo_atual > soma_pix_approved (ex.: 1000 vs 0; 122 vs 6; 153 vs 79). Consistente com saldo inicial, prêmios de jogo ou créditos antigos fora da janela PIX.

**Conclusão C2:** Não há duplicidade entre registros approved em pagamentos_pix. GAP (saldo - soma PIX approved) existe e é explicado por outras fontes (saldo inicial, jogo, etc.).

---

## PASSO D — Backup e rollback (especificação)

Ver documento **docs/relatorios/FINANCEIRO-ROLLBACK-PLAN-READONLY-2026-03-05.md**.

- **Backup:** pg_dump com connection string em variável de ambiente; arquivo `backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql`; validação por tamanho e restore dry-run.
- **Rollback Fly:** `flyctl releases rollback -a goldeouro-backend-v2 --version N`; validar /health e fluxo /game; opcional plano canário (escala 1 → rollback → validar → escala 2).

---

## PASSO E — Plano de reconstrução (sem implementar)

### E1) Single Source of Truth (ledger)

- **Objetivo:** Toda mutação de saldo (depósito, aposta, prêmio, saque, taxa, rollback) deve gerar registro em **ledger_financeiro** antes ou no mesmo passo que o UPDATE em usuarios.saldo.
- **Idempotência ledger:** correlation_id + tipo + referencia (já usado em createLedgerEntry). Garantir que não haja dois inserts iguais (buscar existente antes de inserir).

### E2) Idempotência de depósito

- **Regra:** Somente 1 crédito por payment_id (ou por external_id quando for o identificador único do pagamento no MP).
- **Reconcile:** Usar **payment_id numérico** do Mercado Pago para consultar `/v1/payments/{id}`. external_id no formato `deposito_uuid_timestamp` **não** é payment_id; não tentar consultar MP com esse valor (ou normalizar origem do payment_id no insert de pagamentos_pix para sempre gravar o id numérico do MP).
- **Webhook e recon:** Antes de creditar, checar se já existe crédito para esse payment_id (ex.: ledger com tipo deposito_pix e referencia = payment_id, ou flag em pagamentos_pix “saldo_creditado”). Creditar apenas uma vez.

### E3) Idempotência de saque

- **Status:** Alinhar com CHECK da tabela (pendente, processando, concluido, rejeitado ou equivalentes).
- **processed_at e transacao_id:** Preencher no webhook de payout e no worker quando concluído.
- **Worker + webhook:** Redundância sem duplicidade: apenas um caminho atualiza status final (ex.: webhook confirma e preenche processed_at; worker não marca concluído se já estiver concluído).

### E4) Compat layer user_id / usuario_id

- **Atual:** processPendingWithdrawals (createLedgerEntry) detecta coluna (user_id primeiro, depois usuario_id) e grava em cache. Manter esse comportamento e garantir que o schema do repositório (migrações/docs) reflita produção (user_id em prod).

### E5) Checklist de aceitação

- [ ] Depósito credita exatamente 1 vez por payment_id (webhook ou recon, não ambos).
- [ ] Abrir /dashboard não altera saldo (nenhum UPDATE de saldo em GET profile ou rotas de leitura).
- [ ] POST /api/withdraw/request não retorna 500 (débito + insert saque + ledger).
- [ ] Worker processa saques pendentes e conclui (status + ledger).
- [ ] Webhook MP confirma payout (status concluído, processed_at, transacao_id).
- [ ] Ledger tem trilha completa (depósito, saque, taxa, payout, rollback quando aplicável).

---

## Plano Cirúrgico V1 (mudança mínima, impacto zero em /game)

**Objetivo:** Reduzir risco de duplo crédito em depósito e alinhar reconcile ao payment_id, sem alterar fluxo de jogo nem de saque já estável.

**Premissas:** Backup Supabase executado e validado; plano de rollback Fly revisado (Go/No-Go = Go).

### Alterações propostas (fase 2 — NÃO executadas nesta auditoria)

1. **server-fly.js (webhook depósito ~2090-2110):** Antes de UPDATE usuarios.saldo, checar idempotência: por exemplo, existência de registro em ledger_financeiro com tipo `deposito_pix` e referencia = payment_id (ou external_id do registro). Se já existir, não creditar de novo.
2. **server-fly.js (reconcile ~2382-2416):** Manter claim atômico em pagamentos_pix; antes de UPDATE usuarios.saldo, mesma checagem de idempotência (ledger já tem esse payment_id como deposito_pix?). Opcional: usar payment_id do registro (p.payment_id) para consultar MP quando external_id não for numérico (se no insert estiver preenchido payment_id com id do MP).
3. **server-fly.js (insert pagamentos_pix em /api/payments/pix/criar):** Garantir que payment_id e external_id recebam o id numérico retornado pelo MP (já é String(payment.id)), para que o recon possa usar payment_id para GET /v1/payments/{payment_id}.
4. **Nenhuma alteração** em POST /api/games/shoot, GET /api/user/profile, GET /api/fila/entrar, ou na lógica de saque (withdraw/request, worker, webhook payout).

### Arquivos a alterar no prompt cirúrgico (fase 2)

| Arquivo | Alteração |
|---------|-----------|
| server-fly.js | Idempotência de crédito depósito (webhook + reconcile): checar ledger (ou flag) antes de UPDATE saldo; garantir uso de payment_id numérico no recon. |

**Nenhum outro arquivo** (processPendingWithdrawals, payout-worker, config, fly.toml, package.json) é alterado no V1.

### Gate Go/No-Go

- **Go:** Backup do Supabase realizado e validado; plano de rollback Fly documentado e testado (comando de rollback conhecido); aceitação de que apenas server-fly.js será modificado no V1.
- **No-Go:** Backup não feito ou inválido; rollback não possível ou não documentado. Não aplicar mudanças em produção até Go.

---

## Documentos gerados nesta auditoria

| Documento | Conteúdo |
|-----------|----------|
| **FINANCEIRO-RECONSTRUCAO-PLANO-READONLY-2026-03-05.md** | Este relatório (auditoria total + plano + cirúrgico V1). |
| **FINANCEIRO-ROLLBACK-PLAN-READONLY-2026-03-05.md** | Backup (pg_dump) e rollback Fly (comandos e validação). |
| **FINANCEIRO-MAPA-ESCRITAS-BALANCE-READONLY-2026-03-05.md** | Inventário de todos os pontos que alteram balance/saldo. |

Todos os passos foram executados em modo READ-ONLY; nenhum código foi alterado, nem commit nem deploy realizado.
