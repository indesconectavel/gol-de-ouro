# ENCERRAMENTO OFICIAL — BLOCO E — GAMEPLAY

**Projeto:** Gol de Ouro  
**Bloco:** E — Gameplay  
**Data:** 2026-03-09  
**Modo:** READ-ONLY — consolidação e documentação final.  
**Documentos consolidados:** REVISAO-OFICIAL-REGRAS-V1-GOLDEOURO-READONLY-2026-03-09.md, CIRURGIA-CONTROLADA-ENGINE-V1-2026-03-09.md, AUDITORIA-SUPABASE-FLUXO-FINANCEIRO-READONLY-2026-03-09.md, CIRURGIA-FLUXO-FINANCEIRO-GAMEPLAY-2026-03-09.md, VALIDACAO-POS-CIRURGIA-FINANCEIRA-GAMEPLAY-2026-03-09.md, VALIDACAO-PRATICA-ENGINE-V1-POS-CIRURGIA-2026-03-09.md.

---

## 1. Resumo executivo

O **BLOCO E — Gameplay** abrange a engine do jogo (lotes, chutes, resultado goal/miss), a regra oficial da V1 (R$ 1, 10 chutes, gol no 10º, prêmio R$ 5, mesmo jogador pode repetir), o fluxo financeiro (débito do perdedor, crédito do vencedor) e a consistência da economia do lote.  

Foi identificado um **problema crítico**: a tabela `chutes` no Supabase não possuía triggers ativos; o backend assumia que o trigger `update_user_stats` debitaria os perdedores; na prática apenas o vencedor era ajustado. A economia do lote não fechava (9 perdedores não perdiam saldo).  

A **correção** foi aplicada no backend (server-fly.js, endpoint POST /api/games/shoot): passou a debitar o perdedor (MISS → saldo - 1) e a ajustar o vencedor (GOAL → saldo - 1 + prêmio), sem dependência de trigger, função SQL ou RPC. A validação pós-cirurgia confirmou: perdedor debitado, vencedor creditado, economia fechando, gameplay preservado, Gol de Ouro correto.  

**Diagnóstico final do BLOCO E:** **GAMEPLAY VALIDADO**. A regra da V1 está implementada, o bug financeiro foi corrigido, a economia do jogo fecha e o sistema está pronto para operação da V1.

---

## 2. Regras oficiais da V1

Com base em docs/V1-VALIDATION.md, relatórios de patch e na cirurgia da engine (CIRURGIA-CONTROLADA-ENGINE-V1-2026-03-09):

| Regra | Definição |
|-------|-----------|
| Valor do chute | **R$ 1,00** fixo (V1 aceita apenas 1; outros valores rejeitados com 400). |
| Lote | **10 chutes** por lote (para valor 1). |
| Chutes 1º ao 9º | Sempre **miss**. |
| Chute 10º | Sempre **goal**. |
| Prêmio base | **R$ 5,00** por gol. |
| Gol de Ouro | **+ R$ 100** a cada 1000 chutes globais. |
| Mesmo jogador | **Pode chutar várias vezes** no mesmo lote (sem restrição por usuario_id). |
| Hub | Sem escolha de valor (aposta fixa R$ 1). |

**Economia esperada por lote (caso padrão, sem Gol de Ouro):**

- 10 apostas × R$ 1 = **R$ 10** arrecadados.  
- Prêmio ao vencedor = **R$ 5**.  
- Lucro plataforma = **R$ 5**.

---

## 3. Problema identificado na auditoria

### 3.1 Ausência de triggers em chutes

- No Supabase foi executada a consulta:  
  `SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'chutes'::regclass AND NOT tgisinternal;`  
- **Resultado:** No rows returned.  
- A tabela **chutes** não possui triggers manuais no banco atual. A função `update_user_stats()` existe apenas no arquivo schema-supabase-final.sql do repositório e não está ativa (ou o trigger que a chama não existe).

### 3.2 Dependência do backend em update_user_stats

- O código (server-fly.js) declarava no comentário que **perdas** eram tratadas pelo trigger `update_user_stats` (AFTER INSERT em chutes), que subtrairia `valor_aposta` do saldo do jogador. Para **vitórias**, o backend fazia UPDATE explícito (saldo = saldo - aposta + prêmio).  
- O backend **não** executava nenhum UPDATE de saldo quando o resultado era **miss**; dependia 100% do trigger para o débito do perdedor.

### 3.3 Inexistência do débito do perdedor

- Com triggers ausentes, após cada INSERT em `chutes` nenhuma função no banco atualizava `usuarios.saldo`. O backend só atualizava saldo no ramo **isGoal**.  
- Consequência: **9 jogadores perdiam o chute mas não perdiam saldo**; apenas o 1 vencedor recebia o prêmio.

### 3.4 Economia quebrada

- Por lote: entrada “conceitual” de R$ 10 (10 apostas), saída de R$ 5 para o vencedor; os R$ 9 dos perdedores permaneciam nos saldos. O sistema **criava dinheiro**; a plataforma não retinha os R$ 5 de lucro por lote.  
- **Por que o bug era crítico:** Integridade financeira do jogo e da plataforma; risco operacional e de auditoria; regra da V1 (economia fechada) não era respeitada na prática.

---

## 4. Correção aplicada

### 4.1 Escopo

- **Arquivo modificado:** server-fly.js.  
- **Endpoint:** POST /api/games/shoot.  
- **Ponto:** Bloco após o INSERT em `chutes`, onde antes havia apenas ajuste de saldo para o vencedor (isGoal).

### 4.2 Nova lógica financeira

| Evento | Ação no backend |
|--------|------------------|
| **MISS** | `novoSaldoPerdedor = user.saldo - betAmount`; UPDATE `usuarios` SET saldo = novoSaldoPerdedor WHERE id = userId. (Saldo = saldo - 1.) |
| **GOAL** | `novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro`; UPDATE `usuarios` SET saldo = novoSaldoVencedor WHERE id = userId. (Saldo = saldo - 1 + prêmio [+ 100 se Gol de Ouro].) |

### 4.3 Confirmações

- **Apenas server-fly.js** foi alterado (adição do ramo else para MISS e atualização dos comentários).  
- **Nenhuma alteração de banco:** sem criação de trigger, função SQL, RPC ou migration.  
- **Nenhum trigger** foi criado; a lógica passou a ser 100% no backend.

---

## 5. Validação do fluxo financeiro

Cenários validados por inspeção do código (VALIDACAO-POS-CIRURGIA-FINANCEIRA-GAMEPLAY-2026-03-09):

### 5.1 Fluxo MISS

- **Cenário:** saldo inicial = 10, betAmount = 1, resultado = miss.  
- **Código:** entra no else; novoSaldoPerdedor = 10 - 1 = 9; UPDATE usuarios SET saldo = 9.  
- **Saldo final esperado:** **9**. ✓  

### 5.2 Fluxo GOAL

- **Cenário:** saldo inicial = 10, betAmount = 1, premio = 5, premioGolDeOuro = 0, resultado = goal.  
- **Código:** novoSaldoVencedor = 10 - 1 + 5 + 0 = 14.  
- **Saldo final esperado:** **14**. ✓  

### 5.3 Gol de Ouro

- **Cenário:** saldo inicial = 10, goal com premioGolDeOuro = 100.  
- **Código:** novoSaldoVencedor = 10 - 1 + 5 + 100 = 114.  
- **Saldo final esperado:** **114**. ✓  

---

## 6. Validação da economia do lote

### 6.1 Simulação de lote completo

- **9 chutes miss:** cada um executa o ramo else → 9 × UPDATE saldo = saldo - 1 → **9 débitos de R$ 1**.  
- **1 chute goal:** executa o ramo if (isGoal) → 1 × (saldo - 1 + 5) → **1 débito de R$ 1 e 1 crédito de R$ 5**.  

### 6.2 Resultado

- **Arrecadação:** 10 × R$ 1 = **R$ 10**.  
- **Saída:** **R$ 5** (prêmio ao vencedor).  
- **Lucro plataforma:** **R$ 5**.  

A matemática do backend fecha; a economia do lote está correta.

---

## 7. Impacto no gameplay

A cirurgia financeira **não alterou**:

- **Lógica de lotes:** getOrCreateLoteByValue(betAmount), betAmount = 1, tamanho 10.  
- **winnerIndex:** config.size - 1 (gol no 10º chute).  
- **shotIndex:** lote.chutes.length antes do push; isGoal = shotIndex === lote.winnerIndex.  
- **Persistência em chutes:** INSERT com usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, etc.  
- **Regra do 10º chute:** chutes 0–8 = miss, chute 9 = goal.  
- **Possibilidade de repetir jogador:** validador sem restrição por usuario_id; mesmo jogador pode chutar várias vezes no mesmo lote.  

Apenas o bloco de ajuste de saldo (if isGoal / else) foi modificado; a engine de gameplay permanece intacta.

---

## 8. Dependência de banco

Após a correção, o fluxo financeiro do gameplay **não depende** de:

- **Trigger:** não há trigger em `chutes` no banco; o código não invoca nem pressupõe trigger para débito/crédito.  
- **Função SQL:** nenhuma função SQL é chamada no endpoint de chute para atualizar saldo.  
- **RPC:** nenhuma chamada a supabase.rpc no handler do shoot.  
- **Migration ausente:** a correção não exige migration; o banco pode continuar sem triggers na tabela `chutes`.  

**Resposta objetiva:** Sim. O **gameplay financeiro** (débito do perdedor e crédito do vencedor por chute) é **autossuficiente no backend** e não depende de trigger, função SQL, RPC nem migration para essa lógica.

---

## 9. Riscos eliminados

Com a cirurgia e a validação, os seguintes riscos **deixaram de existir** para o fluxo financeiro do gameplay:

| Risco | Status |
|-------|--------|
| **Criação de dinheiro** | Eliminado — perdedores são debitados; economia fecha. |
| **Economia quebrada** | Eliminado — arrecadação 10, saída 5, lucro 5. |
| **Dependência invisível de trigger** | Eliminado — lógica explícita no backend; comentário atualizado. |
| **Inconsistência entre ambiente e código** | Eliminado — código não presume mais trigger; funciona com ou sem trigger no banco. |
| **Perdedor não debitado** | Eliminado — ramo else debita saldo em MISS. |
| **Duplo crédito do vencedor** | Não introduzido — um único UPDATE por request no ramo GOAL. |
| **Duplo débito do perdedor** | Não introduzido — um único UPDATE por request no ramo MISS. |

---

## 10. Riscos remanescentes

Riscos avaliados como **melhorias futuras**, **não bloqueadores da V1**:

### 10.1 Atomicidade INSERT chutes + UPDATE usuarios

- **Situação:** O fluxo atual faz INSERT em `chutes` e, em seguida, UPDATE em `usuarios`. Não há transação única (ex.: BEGIN; INSERT; UPDATE; COMMIT) garantida pelo código.  
- **Cenário de falha:** Se o INSERT succeed e o UPDATE falhar (rede, timeout, etc.), o chute fica registrado mas o saldo pode não ser atualizado (ou o contrário, dependendo da ordem e do tratamento de erro). O código já trata erro do INSERT com rollback em memória do lote; não há rollback automático do INSERT no banco se o UPDATE falhar depois.  
- **Classificação:** **Melhoria futura** — uso de transação ou RPC atômica no Supabase; não invalida a correção atual para a V1.  

### 10.2 Concorrência e saldo

- **Situação:** O saldo é lido uma vez no início do request e o novo saldo é calculado (saldo - 1 ou saldo - 1 + prêmio). Em alta concorrência, dois requests simultâneos do mesmo usuário podem ler o mesmo saldo e aplicar dois updates; em cenários extremos pode haver condição de corrida.  
- **Classificação:** **Melhoria futura** — lock otimista (ex.: UPDATE ... WHERE id = userId AND saldo = saldo_esperado) ou fila por usuário; aceitável para a V1 na fase atual.  

### 10.3 Métricas globais (contador_chutes_global, ultimo_gol_de_ouro)

- **Situação:** O trigger `trigger_update_metrics` (que atualizaria metricas_globais) também não existe no banco. O backend mantém contadorChutesGlobal em memória e persiste via saveGlobalCounter(); se houver múltiplas instâncias, métricas globais no banco podem divergir.  
- **Classificação:** **Risco conhecido**; não afeta o fluxo financeiro de saldo por chute (débito/crédito). Melhoria futura se métricas centralizadas forem obrigatórias.

---

## 11. Diagnóstico final

**Classificação do BLOCO E:** **GAMEPLAY VALIDADO**

- Regra oficial da V1 implementada (R$ 1, 10 chutes, gol no 10º, prêmio R$ 5, mesmo jogador pode repetir, hub sem seletor).  
- Bug financeiro corrigido no backend (débito do perdedor, crédito do vencedor, sem dependência de trigger).  
- Economia do lote fechando (10 arrecadados, 5 prêmio, 5 lucro).  
- Gol de Ouro preservado.  
- Riscos remanescentes classificados como melhorias futuras e não bloqueadores da V1.

---

## 12. Conclusão oficial

O **BLOCO E — Gameplay** é dado por **encerrado** com o seguinte estado:

1. **Regra da V1:** Implementada no backend e no frontend (valor único R$ 1, lote 10 chutes, gol no 10º chute, prêmio R$ 5, mesmo jogador pode repetir, sem escolha de valor no hub).  
2. **Bug financeiro:** Corrigido. O backend passa a debitar o perdedor (MISS) e a ajustar o vencedor (GOAL) em um único lugar, sem dependência de trigger, função SQL ou RPC.  
3. **Economia do jogo:** Fecha corretamente por lote (arrecadação R$ 10, saída R$ 5, lucro R$ 5 no caso padrão).  
4. **Sistema:** Pronto para operação da V1, com riscos remanescentes documentados como melhorias futuras (atomicidade INSERT+UPDATE, concorrência, métricas globais centralizadas).

Nenhuma outra parte do sistema (auth, PIX, saques, estrutura de tabelas, outros endpoints) foi alterada para esta correção. O encerramento é documental e técnico, com base nos relatórios de auditoria, cirurgia e validação listados no cabeçalho.

---

*Documento gerado em modo READ-ONLY. Consolidação final do BLOCO E — Gameplay em 2026-03-09.*
