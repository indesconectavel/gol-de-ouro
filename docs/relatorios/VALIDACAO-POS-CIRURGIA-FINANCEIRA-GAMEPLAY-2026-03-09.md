# VALIDAÇÃO PÓS-CIRURGIA FINANCEIRA — GAMEPLAY

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — inspeção de código e rastreamento de fluxo.  
**Referência:** CIRURGIA-FLUXO-FINANCEIRO-GAMEPLAY-2026-03-09.md, server-fly.js (POST /api/games/shoot)

---

## 1. Resumo executivo

A validação foi feita por **leitura do código** do endpoint POST /api/games/shoot em server-fly.js (linhas 1124–1362).  

**Conclusão:** A correção **resolve o problema financeiro real**. O backend passou a debitar o perdedor (MISS) com `novoSaldoPerdedor = user.saldo - betAmount` e um único UPDATE em `usuarios`; o vencedor (GOAL) continua com `novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro` e um único UPDATE. Não há ramo que deixe de atualizar saldo (MISS ou GOAL); não há referência a trigger para essa lógica; não há RPC no fluxo de chute. A economia do lote passa a fechar no backend: 9× débito de R$ 1 e 1× (débito R$ 1 + crédito R$ 5 ou R$ 105). A regra V1 (R$ 1, 10 chutes, gol no 10º, prêmio R$ 5, mesmo jogador pode repetir) e o gameplay (lote, shotIndex, winnerIndex, persistência) permanecem intactos.  

**Diagnóstico final:** **FLUXO FINANCEIRO CORRIGIDO**.

---

## 2. Validação do fluxo MISS

### 2.1 Evidência no código

- **Ordem:** Após o INSERT em `chutes` (linhas 1271–1284), o bloco de ajuste de saldo (1331–1357) é executado. Para resultado **miss**, `isGoal` é false (linha 1208: `isGoal = shotIndex === lote.winnerIndex`; em miss, shotIndex ≠ lote.winnerIndex). O código entra no **else** (linhas 1346–1357).
- **Cálculo:** `novoSaldoPerdedor = user.saldo - betAmount` (linha 1347). `user.saldo` é o valor lido antes do processamento (linhas 1159–1163); `betAmount` é constante 1 (linha 1148).
- **UPDATE:** `supabase.from('usuarios').update({ saldo: novoSaldoPerdedor }).eq('id', req.user.userId)` (1348–1351). Um único UPDATE por request de chute com resultado miss.
- **Trigger:** O comentário (1331–1333) declara "100% no backend — sem dependência de trigger"; não há chamada a função SQL nem RPC; o débito é feito apenas por esse UPDATE.
- **Crédito indevido:** No ramo else não há adição de prêmio; apenas o débito da aposta. Nenhum outro trecho do handler executa UPDATE em `usuarios` para o mesmo usuário após esse bloco.

### 2.2 Cenário obrigatório (simulação mental)

- **Entrada:** saldo inicial = 10 (valor lido em `user.saldo`), betAmount = 1, resultado = miss (isGoal = false).
- **Fluxo:** Entra no else → novoSaldoPerdedor = 10 - 1 = 9 → UPDATE usuarios SET saldo = 9 WHERE id = userId.
- **Saldo final esperado:** **9**. ✓

---

## 3. Validação do fluxo GOAL

### 3.1 Evidência no código

- **Condição:** `isGoal` true (shotIndex === lote.winnerIndex, ou seja, 10º chute na V1).
- **Prêmios:** premio = 5.00 (linha 1216); premioGolDeOuro = 100.00 se isGolDeOuro (linhas 1219–1221).
- **Cálculo:** `novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro` (linha 1335). O vencedor paga a aposta (termo - betAmount) e recebe prêmio base e, se for o caso, Gol de Ouro.
- **UPDATE:** Um único UPDATE com esse valor (1336–1340). Não há segundo crédito no mesmo handler; não há referência a trigger para crédito.
- **Duplo crédito:** O comentário deixa claro que a lógica é "debitar aposta e creditar prêmio" em um único cálculo; não existe ramo que some prêmio duas vezes.

### 3.2 Cenários obrigatórios (simulação mental)

**Cenário A — Goal sem Gol de Ouro**

- saldo inicial = 10, betAmount = 1, premio = 5, premioGolDeOuro = 0.
- novoSaldoVencedor = 10 - 1 + 5 + 0 = **14**. ✓

**Cenário B — Goal com Gol de Ouro**

- saldo inicial = 10, betAmount = 1, premio = 5, premioGolDeOuro = 100.
- novoSaldoVencedor = 10 - 1 + 5 + 100 = **114**. ✓

---

## 4. Validação da economia do lote

### 4.1 Fórmula esperada

- Arrecadação: 10 × R$ 1 = R$ 10.
- Saída ao vencedor: R$ 5 (ou R$ 5 + R$ 100 no Gol de Ouro).
- Lucro plataforma (caso sem Gol de Ouro): R$ 10 - R$ 5 = R$ 5.

### 4.2 Verificação no código

- **9 chutes miss:** Cada um executa o else → UPDATE saldo = user.saldo - 1. Ou seja, 9 débitos de R$ 1 (total R$ 9 debitados dos perdedores).
- **1 chute goal:** Executa o if (isGoal) → UPDATE saldo = user.saldo - 1 + 5 (+ 100 se Gol de Ouro). Ou seja, 1 débito de R$ 1 e 1 crédito de R$ 5 (ou R$ 105).
- **Total movimentado:** 10 apostas de R$ 1 entram (conceitualmente) via débito; R$ 5 (ou R$ 105) saem para o vencedor. A matemática do backend permite que a economia feche: arrecadação 10, saída 5, lucro 5 (caso padrão).

---

## 5. Verificação de duplo débito / duplo crédito

### 5.1 Duplo débito

- Por request, apenas **um** dos ramos é executado: `if (isGoal)` ou `else`. Não há segundo UPDATE em `usuarios` para o mesmo userId no mesmo handler após esse bloco. O perdedor é debitado uma única vez (no else).

### 5.2 Duplo crédito

- No GOAL há um único cálculo e um único UPDATE com (saldo - betAmount + premio + premioGolDeOuro). Não há outro ponto no endpoint que adicione prêmio ao saldo. O vencedor é creditado uma única vez.

### 5.3 Trigger / mecanismo oculto

- O comentário (1331–1333) declara que o ajuste é "100% no backend — sem dependência de trigger". No código não há invocação de RPC nem menção a função SQL para saldo no fluxo do chute. A auditoria anterior confirmou que a tabela `chutes` no Supabase não possui triggers. Portanto, mesmo que no futuro exista trigger, hoje não há; e a lógica atual não **depende** dele para débito/crédito.

### 5.4 Update redundante

- Não há dois UPDATEs de saldo para o mesmo usuário no mesmo request. Rollback em caso de erro no INSERT (1286–1300) não altera saldo; apenas reverte estado do lote em memória.

### 5.5 Resíduo de comentário

- Linha 1270: comentário "(usar tabela 'chutes' para acionar gatilhos de métricas/saldo)" é legado; a lógica de saldo não depende mais desses gatilhos. Não caracteriza duplo débito/crédito nem dependência funcional de trigger.

---

## 6. Impacto no gameplay

### 6.1 Itens verificados

- **Formação do lote:** `getOrCreateLoteByValue(betAmount)` (1179); betAmount = 1. Inalterado.
- **Fechamento no 10º chute:** `isGoal = shotIndex === lote.winnerIndex`; lote.status = 'completed' e lote.ativo = false quando isGoal (1226–1228); validador bloqueia 11º chute. Inalterado.
- **Resultado chutes 1–9:** shotIndex 0..8, winnerIndex 9 na V1 → result = 'miss'. Inalterado.
- **Gol no chute 10:** shotIndex 9, winnerIndex 9 → result = 'goal'. Inalterado.
- **Reentrada do mesmo jogador:** Validador permite múltiplos chutes do mesmo userId no mesmo lote; não há checagem de unicidade. Inalterado.
- **Persistência em chutes:** INSERT com usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, etc. (1273–1283). Inalterado.

A cirurgia alterou apenas o bloco de ajuste de saldo (1331–1357); não modificou lote, shotIndex, isGoal, result, INSERT nem validadores. A engine de gameplay permanece intacta.

---

## 7. Gol de Ouro

### 7.1 Cálculo do bônus

- `isGolDeOuro = contadorChutesGlobal % 1000 === 0` (1199); `premioGolDeOuro = 100.00` quando isGolDeOuro (1219–1221). O valor é incluído em `novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro` (1335). Portanto o bônus de R$ 100 continua aplicado ao saldo do vencedor.

### 7.2 Cenário validado

- saldo 10, betAmount 1, premio 5, premioGolDeOuro 100 → saldo final 114. Correto.

### 7.3 Efeito da correção do MISS

- A correção adicionou apenas o ramo else (MISS). O ramo GOAL não foi alterado na fórmula; premio e premioGolDeOuro continuam sendo somados no cálculo do vencedor. O Gol de Ouro não foi afetado.

---

## 8. Dependência de banco

### 8.1 Trigger

- O código não invoca trigger; o comentário explicita "sem dependência de trigger". A lógica de débito/crédito está toda no bloco if/else com UPDATE em `usuarios`.

### 8.2 Função SQL

- Nenhuma função SQL é chamada no endpoint para atualizar saldo. Apenas SELECT (saldo) e UPDATE (saldo) via cliente Supabase.

### 8.3 RPC

- Nenhuma chamada a supabase.rpc no handler do shoot. O fluxo financeiro do gameplay não usa RPC.

### 8.4 Migration ausente

- A correção não exige migration; não há criação de trigger nem de função. O banco pode continuar sem triggers na tabela `chutes`.

**Resposta objetiva:** Sim. O gameplay financeiro (débito do perdedor e crédito do vencedor por chute) está **autossuficiente no backend** e não depende de trigger, função SQL, RPC nem migration para essa lógica.

---

## 9. Diagnóstico final

**Classificação:** **FLUXO FINANCEIRO CORRIGIDO**

- Perdedor: debitado corretamente (novoSaldoPerdedor = user.saldo - betAmount, um UPDATE).
- Vencedor: creditado corretamente (novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro, um UPDATE).
- Economia do lote: fecha no backend (9× -1, 1× (-1+5) ou (-1+105)); lucro plataforma R$ 5 no caso padrão.
- Sem duplo débito nem duplo crédito; sem dependência de trigger/função/RPC no código; gameplay e regra V1 preservados; Gol de Ouro correto.

---

## 10. Conclusão objetiva

**A economia do lote agora fecha corretamente no sistema?**

**Sim.** O backend passa a debitar cada perdedor em R$ 1 (MISS) e a ajustar o vencedor com débito da aposta e crédito do prêmio (GOAL) em um único UPDATE por chute. Não há dependência de trigger, função SQL ou RPC para essa lógica. Por lote: 10 apostas de R$ 1 são debitadas (9 perdedores + 1 vencedor); 1 vencedor recebe R$ 5 (ou R$ 105); a plataforma retém R$ 5 no caso padrão. A correção é mínima, localizada e consistente com a regra V1 e com a validação pós-cirurgia descrita neste relatório.

---

*Validação conduzida em modo READ-ONLY. Nenhuma alteração de código ou banco foi realizada.*
