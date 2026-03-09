# Auditoria READ-ONLY — Origem de usuarios.balance / saldo

**Data:** 2026-03-05  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, deploy ou commit).  
**Objetivo:** Descobrir exatamente quais partes do backend alteram `usuarios.balance` / `usuarios.saldo`.

---

## 1. Arquivos e linhas que alteram saldo/balance

### 1.1 Tabela `usuarios` (coluna `saldo`)

| Arquivo | Linhas | Operação | Função/contexto |
|---------|--------|----------|-----------------|
| **server-fly.js** | 953-954 | `UPDATE usuarios SET saldo = calculateInitialBalance('regular')` | **Login:** quando `user.saldo === 0 \|\| null` |
| **server-fly.js** | 806 | `INSERT` com `saldo: calculateInitialBalance('regular')` | **Registro:** criação de usuário |
| **server-fly.js** | 1355-1356 | `.update({ saldo: novoSaldoVencedor })` | **Prêmio jogo:** após chute com gol (novoSaldo = saldo - aposta + premio + premioGolDeOuro) |
| **server-fly.js** | 1522-1523 | `.update({ saldo: novoSaldo, updated_at })` | **Saque:** débito ao solicitar saque (com `.eq('saldo', usuario.saldo)` para concorrência) |
| **server-fly.js** | 1565-1566 | `.update({ saldo: usuario.saldo })` | **Saque (rollback):** reverter saldo se criação do saque falhar |
| **server-fly.js** | 2103 | `.update({ saldo: novoSaldo })` | **Depósito:** webhook Mercado Pago (claim ganhou – pagamento aprovado) |
| **server-fly.js** | 2410-2411 | `.update({ saldo: novoSaldo })` | **Depósito:** reconciliação (`reconcilePendingPayments`) – PIX aprovado no MP |
| **server-fly-deploy.js** | 619 | `.update({ saldo: novoSaldo })` | **Prêmio jogo:** lógica alternativa de shoot (vencedor) |
| **server-fly-deploy.js** | 852 | `.update({ saldo: novoSaldo })` | **Depósito:** webhook PIX aprovado (alternativo) |
| **controllers/paymentController.js** | 266 | `.update({ saldo: novoSaldo })` | **Depósito:** pagamento aprovado (novoSaldo = usuario.saldo + pagamento.valor) |
| **src/domain/payout/processPendingWithdrawals.js** | 153 | `.update({ saldo: saldoReconstituido, updated_at })` | **Saque (rollback):** reconstituir saldo em rollback de saque |

### 1.2 Tabela `users` (coluna `balance`) — código legado/alternativo

| Arquivo | Linhas | Operação | Observação |
|---------|--------|----------|------------|
| **services/pix-service-real.js** | 220-222 | `.update({ balance: supabase.raw('balance + ...') })` | Crédito PIX; tabela `usuarios` pode usar coluna `saldo` em produção |
| **services/pix-service-real.js** | 391-392 | `.update({ balance: supabase.raw('balance - ...') })` | Débito saque; idem |
| **router.js** | 403 | `balance: supabase.raw(\`balance + ${prize} - ${platformFee}\`)` | Prêmio (schema com `balance`) |
| **models/User.js** | 70 | `UPDATE users SET balance = $2 ...` | Modelo legado |
| **_archived_config_controllers/gameController.js** | 78, 320, 335 | `UPDATE users SET balance = ...` | Arquivo arquivado |
| **_archived_config_controllers/paymentController.js** | 141-142, 223-224 | `SET balance = balance + $1` | Arquivo arquivado |

### 1.3 Apenas leitura ou INSERT inicial (sem UPDATE de saldo depois)

| Arquivo | Linhas | Uso |
|---------|--------|-----|
| **controllers/authController.js** | 54 | `INSERT` com `saldo: 0.00` (registro) |
| **services/auth-service-unified.js** | 82 | `INSERT` com `saldo: 0.00` (registro) |
| **router.js** | 226 | `INSERT` com `saldo: 0.00` (registro) |

---

## 2. Classificação por tipo

| Tipo | Onde ocorre | Arquivo(s) |
|------|-------------|------------|
| **Depósito** | Webhook MP (claim ganhou), reconciliação PIX, paymentController (pagamento aprovado), server-fly-deploy webhook, pix-service-real (crédito) | server-fly.js (2103, 2410), server-fly-deploy.js (852), controllers/paymentController.js (266), services/pix-service-real.js (220) |
| **Saque** | Débito ao solicitar saque; rollback ao falhar criação do saque; processPendingWithdrawals (rollback); pix-service-real (débito) | server-fly.js (1522, 1565), processPendingWithdrawals.js (153), services/pix-service-real.js (391) |
| **Prêmio jogo** | Após chute com gol: novoSaldo = saldo - aposta + premio + premioGolDeOuro | server-fly.js (1355), server-fly-deploy.js (619) |
| **Ajuste admin** | Não encontrado no código ativo (nenhum endpoint que faça UPDATE em saldo por admin) | — |
| **Login** | Se `user.saldo === 0 \|\| null`, atualiza para `calculateInitialBalance('regular')` | server-fly.js (953) |
| **Registro** | INSERT com `saldo: calculateInitialBalance('regular')` (server-fly) ou `saldo: 0.00` (authController, auth-service-unified, router) | server-fly.js (806), controllers/authController.js (54), services/auth-service-unified.js (82), router.js (226) |

---

## 3. Lógica de saldo inicial

- **Função:** `calculateInitialBalance(userType)` em **config/system-config.js** (linhas 36-45).
- **Valores atuais:** `initialBalance.regular = 0`, `premium = 0`, `vip = 0`, `admin = 0`.
- **Uso:**
  - **Registro (server-fly.js ~806):** `saldo: calculateInitialBalance('regular')` no INSERT → **0**.
  - **Login (server-fly.js ~948-954):** Se `user.saldo === 0 || user.saldo === null`, faz `UPDATE usuarios SET saldo = calculateInitialBalance('regular')` → **0**.
- **Conclusão:** Não existe no código atual nenhum lugar que defina saldo inicial como 1000 (ou outro valor positivo). Qualquer valor inicial diferente de zero viria de alteração em `config/system-config.js` (initialBalance) ou de dados/migração fora desses fluxos.

---

## 4. Código que define saldo de forma fixa (ex.: 1000)

- **Não foi encontrado** nenhum trecho no backend ativo com:
  - `user.balance = 1000` ou `user.saldo = 1000`
  - `UPDATE usuarios SET balance = 1000` ou `SET saldo = 1000`
- Scripts de teste/seed/backup (fora do fluxo de produção):
  - **backup-pre-limpeza-.../scripts/test-supabase-direct.js:** insert com `saldo: 50` (teste).
  - **backup-pre-limpeza-.../scripts/add-test-balance.js:** `UPDATE users SET balance = balance + 10.00` (teste).
  - **scripts/seed-database.js:** INSERT em `users` com `balance` por usuário de seed; depois `UPDATE users SET balance = $1` (seed, não produção).
  - **criar-usuario-beta-tester.js:** INSERT com `saldo: 0.00`.
- Nenhum deles é rota ou serviço de produção que altere saldo em ambiente real.

---

## 5. Funções responsáveis (resumo)

| Função / fluxo | Arquivo | O que faz com saldo |
|----------------|---------|----------------------|
| Login (quando saldo 0 ou null) | server-fly.js | UPDATE saldo = calculateInitialBalance('regular') (0) |
| Registro | server-fly.js, authController, auth-service-unified, router | INSERT com saldo 0 ou calculateInitialBalance('regular') |
| POST /api/shoot (gol) | server-fly.js | UPDATE saldo do vencedor (saldo - aposta + premio + premioGolDeOuro) |
| POST /api/withdraw/request | server-fly.js | UPDATE debita saldo; em falha, rollback UPDATE restaura saldo |
| rollbackWithdraw | processPendingWithdrawals.js | UPDATE saldo = saldo + amount (reconstituir) |
| Webhook MP (payments, claim) | server-fly.js | UPDATE saldo = saldo + valor do PIX aprovado |
| reconcilePendingPayments | server-fly.js | Para cada PIX aprovado no MP: UPDATE saldo = saldo + crédito |
| Processar pagamento aprovado | paymentController.js | UPDATE saldo = saldo + pagamento.valor |
| Webhook / deploy alternativo | server-fly-deploy.js | UPDATE saldo no shoot e no webhook PIX |
| PixService (approve/reject) | pix-service-real.js | UPDATE `balance` (coluna legada) em crédito/débito |

---

## 6. Riscos

1. **Múltiplos pontos de crédito por depósito:** Webhook MP (2103), reconciliação (2410) e paymentController (266) podem, em cenários de retry ou dupla notificação, creditar mais de uma vez o mesmo pagamento se não houver idempotência forte (ex.: checagem por payment_id/external_id já processado).
2. **Login reescreve saldo zero:** No login, se `saldo === 0 || null`, o backend faz UPDATE para `calculateInitialBalance('regular')` (hoje 0). Não altera valor positivo, mas acopla “inicialização” ao login; em cenários de cache/race, teórico efeito colateral.
3. **Reconciliação e webhook em paralelo:** Reconciliação e webhook podem processar o mesmo pagamento; depende de atualização de status (approved) e de quem credita primeiro; risco de duplo crédito se ambos creditarem.
4. **Schema híbrido (saldo vs balance):** server-fly e controllers usam `usuarios.saldo`; pix-service-real e router usam `balance` (e possivelmente tabela `users`). Se dois caminhos forem usados no mesmo ambiente, inconsistência ou coluna errada.
5. **Rollback de saque:** processPendingWithdrawals e server-fly fazem rollback de saldo; falha após débito e antes de persistir o saque pode deixar saldo revertido sem registro consistente de “saque cancelado” em algumas rotas.

---

## 7. Conclusão

- **Onde o saldo é alterado (produção, tabela `usuarios`):**  
  **server-fly.js** (login com saldo 0, registro, prêmio no shoot, saque + rollback, webhook PIX, reconciliação PIX), **server-fly-deploy.js** (shoot e webhook), **controllers/paymentController.js** (pagamento aprovado), **src/domain/payout/processPendingWithdrawals.js** (rollback de saque).
- **Saldo inicial:** Definido por `calculateInitialBalance('regular')` (config/system-config.js), hoje **0**. Não há código que defina saldo = 1000 (ou outro valor fixo positivo) no backend ativo.
- **Recomendações (sem implementar aqui):**  
  (1) Garantir idempotência em depósito (webhook + recon + paymentController) por payment_id/external_id;  
  (2) Unificar schema (só `usuarios.saldo` ou só `users.balance`) e garantir que pix-service-real e router não escrevam em coluna/tabela errada;  
  (3) Revisar necessidade de “ajustar saldo no login” quando já é 0;  
  (4) Documentar qual servidor (server-fly vs server-fly-deploy) é o de produção para evitar dois caminhos de atualização de saldo em uso simultâneo.
