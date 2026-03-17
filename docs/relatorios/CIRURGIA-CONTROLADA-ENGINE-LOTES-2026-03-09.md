# CIRURGIA CONTROLADA — ENGINE DE LOTES

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Referência:** AUDITORIA-ENGINE-LOTES-READONLY-2026-03-09.md  
**Objetivo:** Elevar a engine de **SEGURO COM RESSALVAS** para **ESTÁVEL E CONFIÁVEL PARA VALIDAÇÃO PRÁTICA**, com o mínimo de alterações e sem regressões.

---

## 1. Resumo executivo

Foi executada uma **cirurgia controlada** nas ressalvas da Engine de Lotes identificadas na auditoria read-only. As alterações restringem-se ao arquivo **server-fly.js** e cobrem: (1) **validação explícita de direção** no backend (TL, TR, C, BL, BR), com 400 e sem alterar estado quando inválida; (2) **tratamento seguro da falha no INSERT** em `chutes`: rollback do estado em memória do lote (pop do chute, reversão de totalArrecadado/premioTotal e reabertura do lote em caso de gol), retorno 500 e ausência de resposta de sucesso ou premiação quando a persistência falha; (3) **documentação no código** da dependência crítica do trigger `update_user_stats` para o débito do perdedor. Não foi alterada a lógica matemática do jogo, os valores dos lotes, os prêmios, o contrato da API nem o frontend. Os riscos de **lotes em memória** e **múltiplas instâncias** foram **documentados como limitação da fase atual** (sem reengenharia). **Classificação final: PRONTA PARA VALIDAÇÃO PRÁTICA.**

---

## 2. Arquivos alterados

| Arquivo | Motivo | Escopo |
|---------|--------|--------|
| **server-fly.js** | Único arquivo modificado | Validação de direção, rollback em falha de INSERT, comentário sobre trigger |

**Arquivos não alterados (intencionalmente):**

- utils/lote-integrity-validator.js — validação de direção já existe nos chutes do lote; backend passou a validar na entrada.
- goldeouro-player (frontend) — contrato preservado; nenhuma mudança necessária.
- Esquemas SQL, rotas de auth, PIX, saque, admin — fora do escopo.

---

## 3. Problemas corrigidos

| # | Problema (auditoria) | Solução aplicada |
|---|----------------------|-------------------|
| 1 | Direção não validada no backend | Constante `VALID_DIRECTIONS = ['TL','TR','C','BL','BR']`; validação após presença de direction/amount; 400 "Direção inválida. Use: TL, TR, C, BL ou BR"; uso de direção normalizada (trim + uppercase) no lote, insert e resposta. Nenhum estado em memória alterado quando direção inválida. |
| 2 | Falha no INSERT apenas logada; lote e resposta de sucesso mesmo com erro | Em `chuteError`: rollback (lote.chutes.pop(), totalArrecadado -= amount, premioTotal -= premio+premioGolDeOuro; se isGoal, lote.status = 'active', lote.ativo = true); retorno imediato 500 com mensagem "Falha ao registrar chute. Tente novamente."; não executa bloco de saldo do vencedor nem resposta 200. |
| 3 | Dependência do trigger não explícita no código | Comentário no bloco de ajuste de saldo documentando que o trigger `update_user_stats` (AFTER INSERT em chutes) é **pressuposto crítico** para débito do perdedor e que deve existir no Supabase de produção. |

---

## 4. Alterações aplicadas

### 4.1 Validação de direção (server-fly.js)

- Inclusão da constante `VALID_DIRECTIONS = ['TL', 'TR', 'C', 'BL', 'BR']` antes do handler de shoot.
- Após validar presença de `direction` e `amount`, cálculo de `directionNormalized = String(direction).trim().toUpperCase()` e checagem `VALID_DIRECTIONS.includes(directionNormalized)`.
- Se inválida: `return res.status(400).json({ success: false, message: 'Direção inválida. Use: TL, TR, C, BL ou BR' })` — sem obter lote, sem alterar memória.
- No restante do handler: uso de `directionNormalized` em validateBeforeShot, objeto chute, INSERT em chutes (direcao) e shootResult (direction), garantindo persistência e resposta com valor normalizado.

### 4.2 Tratamento de falha no INSERT (server-fly.js)

- Substituição do bloco que apenas logava `chuteError` por:
  - `lote.chutes.pop()`
  - `lote.totalArrecadado -= amount`
  - `lote.premioTotal -= premio + premioGolDeOuro`
  - Se `isGoal`: `lote.status = 'active'`, `lote.ativo = true`
  - `return res.status(500).json({ success: false, message: 'Falha ao registrar chute. Tente novamente.' })`
- Com isso: nenhuma premiação indevida (não entra no `if (isGoal)` de saldo), nenhum lote corrompido em memória, nenhuma resposta de sucesso quando a persistência falha.

### 4.3 Documentação do trigger (server-fly.js)

- No comentário do bloco de ajuste de saldo: descrição de que perdas dependem do trigger `update_user_stats` em chutes e que esse trigger é **pressuposto crítico** da engine; vitórias continuam com UPDATE explícito que sobrescreve o saldo para o valor correto.

---

## 5. Riscos mitigados

| Risco | Status |
|-------|--------|
| Direção inválida persistida ou aceita | **Corrigido** — Backend rejeita com 400 e não altera lote nem persiste. |
| Falha no INSERT com lote evoluído e/ou sucesso retornado | **Corrigido** — Rollback em memória e resposta 500; vencedor não é creditado quando o INSERT falha. |
| Dependência do trigger pouco visível | **Documentado** — Comentário no código deixa explícito que o trigger é pressuposto crítico em produção. |

---

## 6. Riscos que permaneceram

| Risco | Tratamento nesta etapa |
|-------|-------------------------|
| **Trigger ausente em produção** | Não foi alterado o banco nem adicionada lógica duplicada no Node. O código **pressupõe** que o trigger existe. Recomendação: confirmar no Supabase de produção a existência de `update_user_stats` em `chutes` (débito de valor_aposta em resultado <> 'goal'). **Documentado como pressuposto crítico.** |
| **INSERT e UPDATE saldo não em transação única** | Mantida a ordem atual (INSERT → depois UPDATE do vencedor). Com o novo tratamento, se o INSERT falhar não há UPDATE de vencedor nem sucesso. Transação distribuída Node+Supabase não foi introduzida. **Mitigado** pelo rollback e pela não-resposta de sucesso. |
| **Lotes apenas em memória** | Sem mudança de arquitetura. Aceitável na fase atual; reinício do processo recria lotes. **Documentado como limitação da fase atual.** |
| **Múltiplas instâncias** | Sem sincronização de `lotesAtivos` entre processos. Cada instância tem seus próprios lotes; probabilidade e economia por lote permanecem corretas. **Assumido operacionalmente / documentado como limitação da fase atual.** |
| **Contador global em falha de INSERT** | Em falha de INSERT, `contadorChutesGlobal` e `saveGlobalCounter()` já foram executados; não foram revertidos para evitar impacto em concorrência. O lote é revertido e a resposta é 500. **Documentado** como trade-off aceitável (contador pode avançar um a mais em falha rara). |

---

## 7. Impacto na compatibilidade da API

- **POST /api/games/shoot:** Contrato preservado. Body continua `{ direction, amount }`; em direção inválida retorna 400 com nova mensagem clara; em falha de persistência retorna 500 com mensagem genérica.
- **Resposta 200:** Formato inalterado: `{ success: true, data: { loteId, direction, amount, result, premio, premioGolDeOuro, isGolDeOuro, contadorGlobal, timestamp, playerId, loteProgress, isLoteComplete, novoSaldo? } }`. O campo `direction` passa a ser sempre um dos valores normalizados (TL, TR, C, BL, BR).
- **Frontend (gameService.js):** Continua enviando as mesmas direções (goalZones); recebe 400 em direção inválida ou 500 em erro de servidor; não exige alteração.
- **Cálculo de prêmios, contador global, Gol de Ouro:** Sem alteração.

---

## 8. Estado final da engine

- **Consistência do chute:** Direção validada na entrada; falha no INSERT gera rollback em memória e 500, sem sucesso nem premiação indevida.
- **Validação de entrada:** Backend defende sozinho as direções TL, TR, C, BL, BR.
- **Trigger:** Documentado como pressuposto crítico; sem alteração de schema ou duplicação de lógica no Node.
- **Lotes em memória e multi-instância:** Limitações assumidas e documentadas; sem reengenharia nesta etapa.
- **Compatibilidade:** Contrato do POST /api/games/shoot e shape da resposta preservados.

---

## 9. Conclusão objetiva

A cirurgia foi **mínima e cirúrgica**: um único arquivo (server-fly.js), três frentes (validação de direção, tratamento de falha no INSERT com rollback, documentação do trigger). Nenhuma regra matemática, valor de lote, prêmio ou fluxo de autenticação/PIX/saque foi alterado. Os riscos de direção inválida e de falha no INSERT com estado inconsistente foram **corrigidos**; a dependência do trigger foi **documentada**; lotes em memória e multi-instância permanecem **documentados como limitação da fase atual**. A engine está **compatível** com o frontend e com o contrato atual da API.

---

**Classificação final da engine:** **PRONTA PARA VALIDAÇÃO PRÁTICA**

- Riscos corrigidos: validação de direção; tratamento seguro de falha no INSERT com rollback.
- Riscos documentados: trigger como pressuposto crítico; lotes em memória e multi-instância como limitação aceita na fase atual.
- Nenhuma regressão introduzida; contrato da API preservado.
