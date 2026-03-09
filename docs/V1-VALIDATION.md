# Gol de Ouro — V1 Validation

Data de criação: 2026-03-07  
Status geral: EM AUDITORIA

Este documento registra o status de validação de todos os blocos do sistema Gol de Ouro V1.

---

# BLOCO A — Financeiro

Status: EM AUDITORIA

Itens a validar:

- [ ] Criação de PIX
- [ ] Webhook de confirmação
- [ ] Atualização de saldo do usuário
- [ ] Solicitação de saque
- [ ] Worker de payout
- [ ] Webhook de payout
- [ ] Rollback de saque falho
- [ ] Histórico de saques

---

# BLOCO B — Engine do jogo

**Status: VALIDADO**

**Regra oficial da Engine V1:**

- Valor do chute fixo: **R$ 1,00**
- Lote com **10 chutes**
- Arrecadação por lote: **R$ 10,00**
- Gol sempre no **10º chute**
- Chutes 1 a 9 = **erro**
- Chute 10 = **gol**
- Mesmo jogador pode chutar várias vezes no mesmo lote

**Itens validados:**

- [x] Valor fixo do chute (R$ 1,00); sem seleção de valor
- [x] Lote com exatamente 10 chutes; arrecadação R$ 10,00 por lote
- [x] Gol somente no 10º chute; chutes 1 a 9 = erro
- [x] Registro de chutes e premiação do gol
- [x] Atualização de saldo (débito/crédito)
- [x] Permissão de múltiplos chutes do mesmo jogador no mesmo lote

**Auditoria realizada:**

- Relatório: [VALIDACAO-FINAL-ENGINE-V1-READONLY-2026-03-07.md](relatorios/VALIDACAO-FINAL-ENGINE-V1-READONLY-2026-03-07.md) — confirma alinhamento da engine (server-fly.js, validador, frontend) à regra oficial V1.

**Patch aplicado:**

- Relatório: [PATCH-V1-ENGINE-REGRA-OFICIAL-2026-03-07.md](relatorios/PATCH-V1-ENGINE-REGRA-OFICIAL-2026-03-07.md) — SAFE PATCH em 2026-03-07; arquivos: server-fly.js, utils/lote-integrity-validator.js, goldeouro-player (gameService.js, GameShoot.jsx).

**Observação técnica (resíduos):**

- Resíduos de lógica antiga (valores 2, 5, 10 ou batchConfigs múltiplos) foram encontrados em: **server-fly-deploy.js**, **testes automatizados** e **Cypress E2E**. Esses resíduos **não impactam a engine em produção**, pois o entrypoint ativo é **server-fly.js**.
- **Limpeza de resíduos (2026-03-07):** Foi aplicado patch para alinhar arquivos residuais à regra V1. Ver [PATCH-LIMPEZA-RESIDUOS-ENGINE-V1-2026-03-07.md](relatorios/PATCH-LIMPEZA-RESIDUOS-ENGINE-V1-2026-03-07.md). Alterados: server-fly-deploy.js (batchConfigs apenas 1, winnerIndex = size-1, rejeição amount ≠ 1), testes (contracts, sistema-testes-automatizados, test-servidor-real-avancado com amount = 1), Cypress E2E (valor fixo R$ 1,00, sem seletor bet-amount).

---

# BLOCO D — Sistema de saldo

**Status: PATCH APLICADO — AGUARDANDO VALIDAÇÃO FINAL**

Foi aplicado patch cirúrgico no handler real de produção `POST /api/games/shoot` em `server-fly.js` para corrigir o débito de saldo em chutes perdidos (`miss`). A auditoria confirmou que o banco de produção não possuía trigger de débito em `public.chutes`, e que o backend só ajustava saldo em `goal`. O patch adiciona débito explícito em `miss` no Node, com lock otimista para reduzir risco de concorrência, preservando a lógica atual de `goal` e `gol de ouro`.

**Itens auditados:**
- [x] Depósito PIX (crédito de saldo, idempotência, claim atômico)
- [x] Chute: débito em MISS (agora no Node, com lock otimista); GOAL inalterado
- [x] Saque (débito, ledger, idempotência, rollback)
- [x] Histórico financeiro (fontes: usuarios, saques, pagamentos_pix)
- [x] Patch aplicado: débito de MISS em server-fly.js (2026-03-07)

**Relatórios:**
- [AUDITORIA-BLOCO-D-SISTEMA-DE-SALDO-READONLY-2026-03-07.md](relatorios/AUDITORIA-BLOCO-D-SISTEMA-DE-SALDO-READONLY-2026-03-07.md)
- [CONFIRMACAO-TRIGGER-SALDO-CHUTES-READONLY-2026-03-07.md](relatorios/CONFIRMACAO-TRIGGER-SALDO-CHUTES-READONLY-2026-03-07.md)
- [CONFIRMACAO-TRIGGER-PRODUCAO-BLOCO-D-2026-03-07.md](relatorios/CONFIRMACAO-TRIGGER-PRODUCAO-BLOCO-D-2026-03-07.md)
- [AUDITORIA-SUPREMA-PRE-PATCH-BLOCO-D-READONLY-2026-03-07.md](relatorios/AUDITORIA-SUPREMA-PRE-PATCH-BLOCO-D-READONLY-2026-03-07.md)
- [PATCH-CIRURGICO-BLOCO-D-2026-03-07.md](relatorios/PATCH-CIRURGICO-BLOCO-D-2026-03-07.md)
- [ROLLBACK-PATCH-BLOCO-D-2026-03-07.md](relatorios/ROLLBACK-PATCH-BLOCO-D-2026-03-07.md)

**Próximo passo:** Validar em produção ou staging que, após um chute com `result: "miss"`, o saldo do usuário diminui em R$ 1,00; e que um chute `goal` continua com saldo_final = saldo_anterior - 1 + premio + premioGolDeOuro.

---

# BLOCO A / D — RECONCILIAÇÃO FINANCEIRA V1

**Status: MONITORAMENTO DE CONSISTÊNCIA ATIVADO**

Foi implementado detector administrativo para identificar divergências entre saldo em `usuarios` e soma de movimentos no `ledger_financeiro`. O mecanismo é somente leitura e não altera dados automaticamente.

**Itens do patch (ledger nos fluxos):**
- [x] Ledger para depósito aprovado (webhook PIX e reconcile): tipo `deposito_aprovado`, idempotência por id do pagamento
- [x] Ledger para chute MISS: tipo `chute_miss`, valor negativo
- [x] Ledger para chute GOAL: tipos `chute_aposta` (débito) e `chute_premio` (crédito)
- [x] Totalizadores `total_apostas` e `total_ganhos` atualizados no Node no fluxo do chute
- [x] Insert em `chutes` retorna `id` para uso como referência no ledger

**Itens do patch (retry de ledger falho):**
- [x] Módulo `src/domain/ledger/reconcileMissingLedger.js`: detecção (depósitos aprovados, chutes miss/goal sem ledger) e retry idempotente
- [x] Endpoint admin `POST /api/admin/reconcile-ledger` (JWT + tipo admin): executa reconciliação e retorna relatório de contagens

**Itens do patch (detector de divergência saldo vs ledger):**
- [x] Módulo `src/domain/ledger/detectBalanceLedgerMismatch.js`: somente leitura; compara `usuarios.saldo` com soma de `ledger_financeiro` por usuário
- [x] Endpoint admin `POST /api/admin/check-ledger-balance` (JWT + tipo admin): retorna `totalUsersChecked` e `mismatches` (não altera saldo nem ledger)

**Relatórios:**
- [AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md](relatorios/AUDITORIA-SUPREMA-RECONCILIACAO-FINANCEIRA-READONLY-2026-03-07.md)
- [PATCH-CIRURGICO-RECONCILIACAO-FINANCEIRA-2026-03-07.md](relatorios/PATCH-CIRURGICO-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
- [ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md](relatorios/ROLLBACK-PATCH-RECONCILIACAO-FINANCEIRA-2026-03-07.md)
- [AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md](relatorios/AUDITORIA-SUPREMA-LEDGER-FINANCEIRO-2026-03-08.md)
- [PATCH-CIRURGICO-RETRY-LEDGER-2026-03-08.md](relatorios/PATCH-CIRURGICO-RETRY-LEDGER-2026-03-08.md)
- [ROLLBACK-PATCH-RETRY-LEDGER-2026-03-08.md](relatorios/ROLLBACK-PATCH-RETRY-LEDGER-2026-03-08.md)
- [PATCH-DETECTOR-DIVERGENCIA-LEDGER-2026-03-08.md](relatorios/PATCH-DETECTOR-DIVERGENCIA-LEDGER-2026-03-08.md)
- [ROLLBACK-PATCH-DETECTOR-DIVERGENCIA-2026-03-08.md](relatorios/ROLLBACK-PATCH-DETECTOR-DIVERGENCIA-2026-03-08.md)

**Próximo passo:** Usar `POST /api/admin/check-ledger-balance` para monitorar consistência saldo vs ledger; usar `POST /api/admin/reconcile-ledger` para retry de ledger faltante quando apropriado.

---

# BLOCO C — Cadastro

Status: VALIDADO (prévio)

Itens:

- [x] Registro de usuário
- [x] Login
- [x] JWT
- [x] Proteção de rotas

---

# BLOCO E — Gameplay

Status: EM DEFINIÇÃO

Itens:

- [ ] Campo do jogo
- [ ] Sistema de chute
- [ ] Goleiro
- [ ] Resultado do chute
- [ ] Animação da bola

---

# BLOCO F — Interface

Status: EM REVISÃO

Itens:

- [ ] Página inicial
- [ ] Página de depósito
- [ ] Página de saque
- [ ] Página do jogo
- [ ] Navegação entre páginas

---

# BLOCO G — Fluxo do jogador

**Status: AJUSTES FINAIS APLICADOS — AGUARDANDO VALIDAÇÃO FINAL**

Foi aplicado patch cirúrgico no frontend (goldeouro-player) com duas correções mínimas de contrato de API: (1) Dashboard passa a consumir `data.payments` em GET `/api/payments/pix/usuario` (em vez de `historico_pagamentos`); (2) AuthContext passa a guardar `response.data.data` no estado `user` após GET `/api/user/profile` (em vez de `response.data`), alinhando ao formato do backend e ao login/register.

**Relatórios e rollback:**
- [AUDITORIA-DUAS-CORRECOES-FRONTEND-2026-03-08.md](relatorios/AUDITORIA-DUAS-CORRECOES-FRONTEND-2026-03-08.md)
- [PATCH-DUAS-CORRECOES-FRONTEND-2026-03-08.md](relatorios/PATCH-DUAS-CORRECOES-FRONTEND-2026-03-08.md)
- [ROLLBACK-DUAS-CORRECOES-FRONTEND-2026-03-08.md](relatorios/ROLLBACK-DUAS-CORRECOES-FRONTEND-2026-03-08.md)

Fluxo esperado:

1. Login
2. Depósito PIX
3. Atualização de saldo
4. Jogar
5. Ganhar
6. Solicitar saque
7. Receber PIX

**Próximo passo:** Validar em ambiente de demo que o Dashboard exibe "Apostas Recentes" quando houver pagamentos PIX e que, após refresh com token, o usuário continua identificado (nome/e-mail) no header/Dashboard.

---

# BLOCO PRÉ-PRODUÇÃO — AUDITORIA ULTRA PROFUNDA

**Status:** VALIDADO COM RESSALVAS

**Resumo:**

A auditoria ultra profunda confirmou que o sistema Gol de Ouro V1 possui mecanismos adequados de rastreabilidade financeira, deduplicação de ledger e reconciliação de inconsistências, tornando-o aceitável para demonstração pública e uso controlado.

**Principais riscos remanescentes:**

1. rollback de saque não idempotente podendo gerar crédito duplo de saldo
2. lógica de lotes e contador global do jogo mantida em memória (insegura em multi-instância)

3. bloqueio de saque não considerando status PROCESSING

“já rollback” → múltiplos “goal” e contadores divergentes. (3) Bloqueio de saque que não inclui processando → segundo saque pode ser criado e saldo debitado duas vezes.
Implementar em `rollbackWithdraw` a verificação `ledgerHasRollback(saqueId)` no início e, se já existir rollback, não atualizar saldo (apenas status do saque para REJECTED). Em seguida: incluir `processando`/PROCESSING no bloqueio de “já existe saque pendente” em POST /api/withdraw/request.

**Conclusão:**

O sistema está apto para demo e uso controlado em instância única.  
Para produção em escala será necessário tornar rollback idempotente, reforçar o bloqueio de saque e persistir o controle de lotes do jogo fora da memória do processo.

**Referência completa da auditoria:**

- [AUDITORIA-ULTRA-PROFUNDA-PRE-PRODUCAO-2026-03-08.md](relatorios/AUDITORIA-ULTRA-PROFUNDA-PRE-PRODUCAO-2026-03-08.md)

---

# Observações

Este documento será atualizado conforme cada bloco for validado.

Nenhuma alteração crítica pode ser aplicada no sistema sem atualização deste arquivo.
