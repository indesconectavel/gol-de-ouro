# BLOCO B — SISTEMA DE APOSTAS

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Backend** | server-fly.js (batchConfigs 1/2/5/10, getOrCreateLoteByValue, winnerIndex, POST /api/games/shoot validação amount, isGoal = shotIndex === winnerIndex), utils/lote-integrity-validator.js (batchConfigs, validateBeforeShot, validateAfterShot) |
| **Frontend** | GameShoot.jsx (valor do chute R$ 1,00 exibido; currentBet; balance; botões zona TL/TR/C/BL/BR), gameService.js (processShot(direction, amount)), BettingControls.jsx (se existir e estiver em uso) |
| **Documentação** | docs/V1-VALIDATION.md, AUDITORIA-ENGINE-V1-REGRA-OFICIAL-READONLY-2026-03-07.md |

---

## 2. Fonte de verdade do bloco

- **Regra oficial V1 (V1-VALIDATION.md):** Todos os chutes custam R$ 1,00; não existe seleção de valores; lote de 10 chutes; gol no 10º chute; mesmo jogador pode chutar várias vezes.
- **Backend atual:** Aceita amount 1, 2, 5 e 10 (batchConfigs); winnerIndex = crypto.randomInt(0, config.size) (posição do gol **aleatória**). Para amount=1, size=10; para 2/5/10, size 5/2/1.
- **Frontend atual:** GameShoot exibe "Valor do Chute — R$ 1,00" e envia amount (gameService); valor fixo R$ 1 na UI não implica que o backend rejeite 2/5/10 se o cliente enviar.

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| batchConfigs backend | server-fly.js 376–381: 1→10 chutes, 2→5, 5→2, 10→1; winnerIndex aleatório |
| Validação amount | server-fly.js 1170–1176: batchConfigs[amount] existe; aceita 1,2,5,10 |
| winnerIndex | server-fly.js ~418: crypto.randomInt(0, config.size) — gol em posição aleatória |
| Regra V1 | Gol no último chute (índice 9); apenas R$ 1,00 (V1-VALIDATION.md) |
| GameShoot UI | Valor do Chute R$ 1,00; currentBet; zonas; processShot com amount |
| AUDITORIA-ENGINE-V1 | Divergências: valores 2,5,10 aceitos; winnerIndex aleatório (não último chute) |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- Baseline FyKKeg6zb não documenta se o bundle usava apenas R$ 1 ou múltiplos valores, nem se o gol era no último chute ou em posição aleatória. O **backend** que a baseline chamava (goldeouro-backend-v2.fly.dev) já tinha batchConfigs e winnerIndex; não há evidência de que a baseline tivesse backend “só V1”. Documentação de regra V1 (V1-VALIDATION.md) define comportamento desejado; não é descrição do que estava no FyKKeg6zb.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual (ez1oc96t1) usa o mesmo código: backend aceita 1,2,5,10 e winnerIndex aleatório; frontend GameShoot exibe R$ 1 e envia amount (tipicamente 1). Funcionalmente igual ao local.

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Funcional** | Backend aceita amount 2, 5, 10 e gol em posição aleatória; regra oficial V1 exige apenas R$ 1 e gol no 10º chute. Divergência entre **engine atual** e **regra oficial V1** (AUDITORIA-ENGINE-V1-REGRA-OFICIAL-READONLY-2026-03-07). |
| **Visual** | GameShoot mostra apenas R$ 1,00; não há botões R$2, R$5, R$10 na tela atual. Divergência é sobretudo **lógica/contrato** (API aceita outros valores). |
| **Estrutural** | batchConfigs e lote-integrity-validator têm 4 valores; para V1 estrita seria 1 valor (1) e winnerIndex = 9 fixo. |
| **Não deployado** | Nenhum bloco de apostas “não deployado” além do que já está no build; a divergência é em relação à **regra V1**, não ao deploy. |

---

## 7. Risco operacional

**Classificação:** **médio**

- Risco de **validação errada:** se a equipe assumir que “apostas = regra V1” (só R$ 1, gol no 10º), o comportamento real (aceita 2,5,10 e gol aleatório) diverge. Risco de **homologação:** testar localmente com R$ 1 e considerar “sistema de apostas igual à produção” está correto para o fluxo atual; considerar “igual à regra V1” está incorreto até ajustes no backend/validador.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim, com ressalvas**

- Para **comportamento atual** (produção ez1oc96t1 e local): sim — valor exibido R$ 1, envio de amount, e fluxo de chute são os mesmos. Para **regra oficial V1:** não — local/produção atual não implementam V1 estrita (apenas R$ 1, gol no último chute). Registrar ressalva: “Sistema de apostas = comportamento atual; não = regra V1 documentada”.

---

## 9. Exceções que precisam ser registradas

1. **Regra V1 vs engine:** Engine aceita amount 1,2,5,10 e winnerIndex aleatório. V1 exige amount=1 e winnerIndex=9 (último chute). Ajustes necessários documentados em AUDITORIA-ENGINE-V1-REGRA-OFICIAL-READONLY-2026-03-07 (seção 4).
2. **Valor apostado e fluxo real:** No fluxo atual, o frontend envia amount=1; o mesmo fluxo (POST /api/games/shoot) é usado. Se um cliente enviar amount=2 ou 10, o backend processa; a UI não oferece essa escolha.
3. **Bloqueio por saldo:** Backend valida saldo >= amount; frontend desabilita zonas quando balance < currentBet. Consistente para o valor exibido (R$ 1).

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim): valor R$ 1 na UI e fluxo de aposta/chute iguais. Alinhado com **baseline** (parcial — não confirmado se baseline era só R$ 1 ou multi-valor). **Não** alinhado com **regra oficial V1** (multi-valor e gol aleatório no backend). Pode usar local como referência para “comportamento atual de apostas”, com ressalva obrigatória sobre a regra V1.

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
