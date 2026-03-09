# Mapa de escritas em balance/saldo — READ-ONLY

**Data:** 2026-03-05  
**Modo:** READ-ONLY (consolidado a partir de AUDITORIA-ORIGEM-BALANCE-READONLY).  
**Objetivo:** Inventário único de todos os pontos do backend que alteram `usuarios.saldo` ou `users.balance`.

---

## 1. Tabela `usuarios` (coluna `saldo`) — produção

| # | Arquivo | Linhas | Operação | Tipo | Função/contexto |
|---|---------|--------|----------|------|-----------------|
| 1 | server-fly.js | 806 | INSERT | registro | Criação de usuário: `saldo: calculateInitialBalance('regular')` (= 0) |
| 2 | server-fly.js | 953-954 | UPDATE | login | Se `user.saldo === 0 \|\| null`: `saldo = calculateInitialBalance('regular')` (= 0) |
| 3 | server-fly.js | 1355-1356 | UPDATE | prêmio jogo | Após chute com gol: `saldo = saldo - aposta + premio + premioGolDeOuro` |
| 4 | server-fly.js | 1522-1523 | UPDATE | saque | Débito ao solicitar saque; `.eq('saldo', usuario.saldo)` para concorrência |
| 5 | server-fly.js | 1565-1566 | UPDATE | saque (rollback) | Reverter saldo se INSERT do saque falhar |
| 6 | server-fly.js | 2103 | UPDATE | depósito | Webhook MP (payments): claim ganhou → crédito |
| 7 | server-fly.js | 2410-2411 | UPDATE | depósito | reconcilePendingPayments: PIX aprovado no MP → crédito (após claim atômico em pagamentos_pix) |
| 8 | server-fly-deploy.js | 619 | UPDATE | prêmio jogo | Shoot vencedor (arquivo alternativo, não usado no Fly) |
| 9 | server-fly-deploy.js | 852 | UPDATE | depósito | Webhook PIX (arquivo alternativo, não usado no Fly) |
| 10 | controllers/paymentController.js | 266 | UPDATE | depósito | Pagamento aprovado: `saldo = saldo + pagamento.valor` |
| 11 | src/domain/payout/processPendingWithdrawals.js | 153 | UPDATE | saque (rollback) | rollbackWithdraw: reconstituir saldo (`saldo + amount`) |

**Em produção Fly:** apenas **server-fly.js** e **processPendingWithdrawals.js** (usado pelo payout_worker) são executados. **server-fly-deploy.js** e **controllers/paymentController.js** não são o entrypoint do app (app = `npm start` → server-fly.js).

---

## 2. Tabela `users` (coluna `balance`) — legado/alternativo

| # | Arquivo | Linhas | Operação | Observação |
|---|---------|--------|----------|------------|
| 12 | services/pix-service-real.js | 220-222 | UPDATE | Crédito PIX: `balance + amount` (coluna `balance`; se produção usa `usuarios.saldo`, não é usado) |
| 13 | services/pix-service-real.js | 391-392 | UPDATE | Débito saque (idem) |
| 14 | router.js | 403 | UPDATE | Prêmio: `balance + prize - platformFee` (schema alternativo) |
| 15 | models/User.js | 70 | UPDATE | Modelo legado |
| 16 | _archived_config_controllers/*.js | vários | UPDATE | Arquivos arquivados |

---

## 3. Apenas INSERT inicial (sem UPDATE posterior de saldo)

| Arquivo | Linha | Uso |
|---------|--------|-----|
| controllers/authController.js | 54 | INSERT com `saldo: 0.00` |
| services/auth-service-unified.js | 82 | INSERT com `saldo: 0.00` |
| router.js | 226 | INSERT com `saldo: 0.00` |

---

## 4. Resumo por tipo (produção — server-fly.js + processPendingWithdrawals)

| Tipo | Escritas | Arquivo(s) |
|------|----------|------------|
| **Depósito** | 2 (webhook 2103, recon 2410) | server-fly.js |
| **Saque** | 2 (débito 1522, rollback 1565) + 1 (rollback domínio 153) | server-fly.js, processPendingWithdrawals.js |
| **Prêmio jogo** | 1 (1355) | server-fly.js |
| **Login** | 1 (953, quando saldo 0/null) | server-fly.js |
| **Registro** | 1 (806 INSERT) | server-fly.js |

---

## 5. Fonte da verdade em produção

- **Entrypoint app:** `fly.toml` → `app = "npm start"` → `package.json` "start": "node server-fly.js" → **server-fly.js**.
- **Entrypoint worker:** `payout_worker = "node src/workers/payout-worker.js"` → chama `processPendingWithdrawals` (que pode fazer rollback de saldo em processPendingWithdrawals.js).
- **Arquivos que NÃO rodam no Fly como app:** server-fly-deploy.js, paymentController.js (se não montado em server-fly), router.js (se não montado), pix-service-real.js (se não chamado por server-fly).

Este mapa deve ser usado como referência para o plano de reconstrução e para o plano cirúrgico (quais arquivos alterar na fase 2).
