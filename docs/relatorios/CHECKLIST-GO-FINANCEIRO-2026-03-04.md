# Checklist GO-LIVE Financeiro — 2026-03-04

Checklist final para considerar o sistema financeiro “fechado” em produção com segurança.  
Executar **após** a auditoria READ-ONLY (docs/relatorios/AUDITORIA-FINANCEIRA-MASTER-E2E-READONLY-2026-03-04.md).

---

## 1. Pré-requisitos (código e deploy)

- [ ] Patch ledger (user_id/usuario_id) está no código em produção: `src/domain/payout/processPendingWithdrawals.js` com `insertLedgerRow` e cache `ledgerUserIdColumn`.
- [ ] Versão deployada no Fly (v311 ou superior) contém o patch; imagem confirmada em `flyctl status -a goldeouro-backend-v2`.
- [ ] Process groups **app** e **payout_worker** existem; pelo menos 1 máquina **app** e 1 **payout_worker** em estado **started**.

---

## 2. Configuração e segredos (sem alterar nesta fase)

- [ ] Variáveis obrigatórias presentes no Fly: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
- [ ] Depósito: MERCADOPAGO_DEPOSIT_ACCESS_TOKEN configurado (webhook + reconciler).
- [ ] Saque: PAYOUT_PIX_ENABLED=true; MERCADOPAGO_PAYOUT_ACCESS_TOKEN configurado (worker e webhook MP).
- [ ] CORS: CORS_ORIGIN ou default (goldeouro.lol, www, admin) adequado ao front.

---

## 3. Validação READ-ONLY (sem escrita)

- [ ] GET /health retorna 200 e database: connected (ou conforme esperado).
- [ ] GET /api/user/profile com Authorization Bearer &lt;JWT válido&gt; retorna 200 e dados do usuário (incl. saldo).
- [ ] GET /api/withdraw/history com Bearer retorna 200 e array de saques (ou vazio).
- [ ] OPTIONS em rotas críticas retorna headers CORS esperados (sem executar POST).

---

## 4. Testes E2E financeiros (exigem BEARER e ambiente controlado)

**Atenção:** Estes passos envolvem escrita (saldo, tabelas). Executar em ambiente de staging ou produção com conta de teste.

### 4.1 Depósito

- [ ] POST /api/payments/pix/criar (valor, chave PIX) com Bearer → 200/201 e payment_id.
- [ ] Simular ou aguardar aprovação no MP; webhook ou reconciler marca approved e credita saldo.
- [ ] GET /api/user/profile: saldo aumentou conforme valor aprovado; não creditar duas vezes o mesmo payment_id.

### 4.2 Jogo (shoot)

- [ ] Registrar saldo inicial (GET /api/user/profile).
- [ ] POST /api/games/shoot (direction, amount) duas vezes (ex.: amount=1).
- [ ] Saldo final = inicial - 2 (ou -2 + prêmios se houver gol); registros em chutes.

### 4.3 Saque

- [ ] POST /api/withdraw/request (valor ≥ 10, chave_pix, tipo_chave) com Bearer e opcionalmente X-Idempotency-Key.
- [ ] Resposta 201 e status pendente; ledger (saque + taxa) gravado (ver logs; não deve aparecer [LEDGER] insert falhou para user_id em prod com patch).
- [ ] GET /api/withdraw/history: saque listado com status pendente → após worker, processando ou concluído.
- [ ] Worker processa: logs com “Saque concluído” ou “rollback acionado”; saque com processed_at/transacao_id se concluído.
- [ ] Idempotência: mesmo X-Idempotency-Key (ou correlation_id) retorna 200 com mesmo saque, sem criar segundo.

---

## 5. Ledger e auditoria

- [ ] Nenhum log `[LEDGER] insert falhou (airbag)` com step user_id em produção após patch (ou apenas 1 fallback inicial se banco tiver user_id).
- [ ] Ledger contém registros tipo saque, taxa e, quando aplicável, rollback, payout_confirmado, falha_payout (dedup por correlation_id + tipo + referencia).

---

## 6. Rollback (se necessário)

- [ ] Plano documentado: restaurar insert antigo (apenas usuario_id) em processPendingWithdrawals.js e redeploy.
- [ ] Em produção com ledger **user_id**, rollback faria o insert do ledger falhar de novo até reaplicar patch; priorizar validação em staging.

---

## 7. Assinaturas de sucesso (logs)

- [ ] Worker: “🟦 [PAYOUT][WORKER] Início do ciclo”, “✅ [PAYOUT][WORKER] Saque concluído” ou “❌ [PAYOUT][FALHOU] rollback acionado”.
- [ ] Reconciler depósitos: “[RECON] approved aplicado” quando aplicável.
- [ ] Reconciler saques: “🟦 [RECONCILE] Início” ou “✅ [RECONCILE] Timeout marcado rejeitado”.

---

## 8. Veredito GO-LIVE

- [ ] Todos os itens obrigatórios das seções 1–3 marcados.
- [ ] Seções 4–5 executadas conforme política (staging primeiro; depois produção).
- [ ] Nenhum segredo (token, chave) exposto em logs ou relatórios; JWT mascarado (ex.: HEAD 12 / TAIL 8) se documentado.

**Data conclusão:** _________________  
**Responsável:** _________________  
**Observações:** _________________

---

*Checklist alinhado à auditoria READ-ONLY 2026-03-04 e ao relatório principal AUDITORIA-FINANCEIRA-MASTER-E2E-READONLY-2026-03-04.md.*
