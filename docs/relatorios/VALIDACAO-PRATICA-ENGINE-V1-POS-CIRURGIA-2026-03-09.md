# VALIDAÇÃO PRÁTICA — ENGINE V1 — PÓS CIRURGIA

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — inspeção de código e rastreamento de fluxo. Nenhuma alteração de código, banco ou deploy.  
**Referência:** CIRURGIA-CONTROLADA-ENGINE-V1-2026-03-09.md

---

## 1. Resumo executivo

A validação prática da engine V1 foi realizada por **leitura do código** (server-fly.js, utils/lote-integrity-validator.js, GameShoot.jsx, GameFinal.jsx, gameService.js) e **rastreamento mental do fluxo** de POST /api/games/shoot e do ciclo do lote.  

**Conclusão:** A engine **implementa de fato** a regra oficial da V1: apenas R$ 1 é aceito (rejeição explícita de amount ≠ 1); o gol ocorre **sempre no 10º chute** (winnerIndex = config.size - 1); chutes 1 a 9 retornam *miss* e o 10º retorna *goal*; o lote permanece ativo do 1º ao 9º chute e encerra após o 10º; não há restrição por usuario_id, permitindo múltiplos chutes do mesmo jogador no mesmo lote; o frontend não exibe mais seletor de valor e o gameService envia sempre amount: 1; prêmio R$ 5 e Gol de Ouro (R$ 100 a cada 1000 chutes) estão preservados; a economia fecha (R$ 10 arrecadados, R$ 5 prêmio, R$ 5 lucro plataforma).  

**Diagnóstico final:** **ENGINE V1 VALIDADA** — o comportamento real do sistema corresponde às regras oficiais da V1 pós-cirurgia.

---

## 2. Validação do bloqueio de valores

### 2.1 Evidência no código

- **Arquivo:** server-fly.js, linhas 1139–1147.  
- **Lógica:** Após validar direção, o handler faz `amountNum = Number(amount)` e `if (amountNum !== 1)` → retorno imediato **400** com:
  - `success: false`
  - `message: 'V1 aceita apenas R$ 1,00 por chute. Outros valores ficam reservados para versões futuras.'`
- **Ordem:** A checagem ocorre **antes** de: conexão Supabase, leitura de saldo, getOrCreateLoteByValue, validateBeforeShot, contador global, INSERT, UPDATE de saldo. Nenhum desses passos é executado quando amount ≠ 1.

### 2.2 Simulação mental: POST com amount: 2

- **Request:** `POST /api/games/shoot` com body `{ "direction": "TL", "amount": 2 }` (token válido).  
- **Fluxo:** direction ok → directionNormalized "TL" → amountNum = 2 → 2 !== 1 → entra no if → `return res.status(400).json({ success: false, message: 'V1 aceita apenas R$ 1,00 por chute...' })`.  
- **Resposta HTTP:** **400**.  
- **Mensagem:** Exatamente a definida (“V1 aceita apenas R$ 1,00 por chute. Outros valores ficam reservados para versões futuras.”).  
- **Lote:** Não é chamado getOrCreateLoteByValue; nenhum lote é criado nem alterado.  
- **Saldo:** Não é feita consulta de saldo nem UPDATE; nenhum saldo é alterado.

### 2.3 Outros caminhos

- Não existe outro endpoint que registre chute com valor (apenas POST /api/games/shoot).  
- Dentro do shoot, após a validação amountNum !== 1, todo o restante do fluxo usa a constante **betAmount = 1** (linha 1147); não há uso do `amount` do body para valor da aposta a partir daí.  
- **Conclusão:** Apenas R$ 1 é aceito; valores diferentes de 1 são rejeitados com 400 e mensagem correta, sem efeito em lote ou saldo.

---

## 3. Sequência real do lote

### 3.1 Definição do resultado

- **shotIndex:** `lote.chutes.length` **antes** do push (server-fly.js, linha 1205). Ou seja, o 1º chute tem shotIndex 0, o 2º tem 1, …, o 10º tem 9.  
- **winnerIndex:** Na criação do lote, `winnerIndex: config.size - 1` (linha 414). Para valor 1, config.size = 10, logo **winnerIndex = 9**.  
- **isGoal:** `shotIndex === lote.winnerIndex` (linha 1208).  
- **result:** `isGoal ? 'goal' : 'miss'` (linha 1209).

### 3.2 Tabela chute × resultado

| Chute (ordem) | shotIndex (lote.chutes.length antes do push) | winnerIndex | isGoal | result |
|---------------|----------------------------------------------|-------------|--------|--------|
| 1º            | 0                                            | 9           | false  | miss   |
| 2º            | 1                                            | 9           | false  | miss   |
| 3º            | 2                                            | 9           | false  | miss   |
| 4º            | 3                                            | 9           | false  | miss   |
| 5º            | 4                                            | 9           | false  | miss   |
| 6º            | 5                                            | 9           | false  | miss   |
| 7º            | 6                                            | 9           | false  | miss   |
| 8º            | 7                                            | 9           | false  | miss   |
| 9º            | 8                                            | 9           | false  | miss   |
| 10º           | 9                                            | 9           | true   | goal   |

**Conclusão:** A sequência está correta: chutes 1 a 9 sempre *miss*, 10º chute sempre *goal*.

---

## 4. Fechamento do lote

### 4.1 Quando o lote permanece ativo (chutes 1 a 9)

- Antes de cada chute, **validateBeforeShot** é chamado (linhas 1182–1194). No validador (lote-integrity-validator.js, linhas 352–358): `if (lote.chutes.length >= config.tamanho)` → retorna "Lote já está completo". Para valor 1, config.tamanho = 10. Enquanto chutes.length for 0 a 8, a condição é falsa e o chute é aceito. Após o 9º chute, chutes.length = 9; 9 >= 10 é falso, então o **10º chute** ainda é aceito (validateBeforeShot roda antes de adicionar o 10º).  
- Após processar o 10º chute, o array tem 10 elementos; na próxima requisição, chutes.length = 10 e 10 >= 10 é verdadeiro → "Lote já está completo" → **11º chute bloqueado**.

### 4.2 Fechamento imediato após o 10º chute

- **Por gol:** Quando isGoal é true (10º chute), o bloco if (isGoal) (linhas 1214–1228) executa `lote.status = 'completed'` e `lote.ativo = false`.  
- **Por tamanho:** Após o INSERT e antes da resposta, o trecho linhas 1304–1309 verifica `lote.chutes.length >= lote.config.size && lote.status !== 'completed'`; se verdadeiro (lote cheio sem gol, cenário que na V1 não ocorre porque o 10º é sempre gol), também marca status completed e ativo false.  
- **Conclusão:** O lote encerra imediatamente após o 10º chute (por gol na V1); um 11º chute é impedido por validateBeforeShot (“Lote já está completo”).

---

## 5. Reentrada do mesmo jogador

### 5.1 Ausência de restrição por usuario_id

- No handler de shoot não há verificação de “usuário já chutou neste lote”. O lote é obtido por valor (betAmount = 1) e por “ter vaga” (chutes.length < config.size); não há filtro por req.user.userId nos chutes já existentes.  
- **validateBeforeShot** (lote-integrity-validator.js) exige direction, amount e userId presentes (linhas 361–366); em seguida há o comentário explícito: “Permitir múltiplos chutes do mesmo usuário no mesmo lote” (linhas 368–369). Não há checagem de unicidade de userId no lote.  
- **Conclusão:** O mesmo jogador pode enviar vários chutes no mesmo lote (posições 1 a 10 podem ser todas do mesmo usuario_id). O fluxo do lote e o validador permitem explicitamente essa reentrada.

---

## 6. Validação do prêmio

### 6.1 No 10º chute (goal)

- **premio:** Quando isGoal (linhas 1214–1216), `premio = 5.00`.  
- **premioGolDeOuro:** Se `contadorChutesGlobal % 1000 === 0` (linha 1219), `premioGolDeOuro = 100.00`; caso contrário, permanece 0.  
- **Persistência:** O INSERT em chutes (linhas 1271–1282) grava valor_aposta: betAmount (1), resultado: result, premio, premio_gol_de_ouro, is_gol_de_ouro.  
- **Saldo do vencedor:** Se isGoal (linhas 1334–1345), `novoSaldoVencedor = user.saldo - betAmount + premio + premioGolDeOuro`; é feito UPDATE em usuarios com esse saldo.  
- **Trigger:** O INSERT em chutes dispara o trigger update_user_stats no banco; o backend sobrescreve o saldo do vencedor com o UPDATE explícito, evitando duplo crédito.  
- **Conclusão:** No 10º chute o prêmio é R$ 5 (ou R$ 5 + R$ 100 em Gol de Ouro); a persistência e a atualização de saldo estão corretas.

---

## 7. Gol de Ouro

### 7.1 Contador e condição

- **Contador global:** `contadorChutesGlobal++` (linha 1196) é executado em todo chute aceito, antes da determinação do resultado.  
- **Condição Gol de Ouro:** `isGolDeOuro = contadorChutesGlobal % 1000 === 0` (linha 1210). Ou seja, no 1000º, 2000º, 3000º chute global, etc., isGolDeOuro é true.  
- **Bônus:** Se isGoal e isGolDeOuro (linhas 1218–1222), premioGolDeOuro = 100.00 e ultimoGolDeOuro é atualizado.  
- A lógica do gol (winnerIndex fixo no último chute) **não altera** o contador global nem o módulo 1000; o Gol de Ouro continua atrelado ao contador global de chutes.  
- **Conclusão:** O Gol de Ouro continua funcionando; a cirurgia (gol no 10º chute) não afetou o bônus a cada 1000 chutes.

---

## 8. Frontend

### 8.1 GameShoot.jsx

- **Valor da aposta:** Constante `betAmount = 1` (linha 29); comentário “V1: valor fixo R$ 1 por chute — sem seleção de valor”.  
- **UI:** Bloco “V1: Economia fixa” (linhas 309–314): título “Valor da Aposta”, texto “R$ 1,00 por chute” e “Cada lote tem 10 chutes. O gol sai no 10º chute. Prêmio: R$ 5,00.” Não há array betValues nem botões R$ 2, R$ 5 ou R$ 10.  
- **Chute:** `gameService.processShot(dir, betAmount)` (linha 164) — sempre envia 1.  
- **Conclusão:** Não existe seletor de aposta; não há botões para R$ 2, R$ 5 ou R$ 10; o valor enviado é sempre 1.

### 8.2 GameFinal.jsx

- **Valor:** Constante `betAmount = 1` (linha 113); comentário “V1: valor fixo R$ 1 por chute”.  
- **UI:** Seção “V1: Aposta fixa R$ 1” (linhas 654–659): “Aposta:” e “R$ 1,00 por chute”; não há betValues nem handleBetChange.  
- **Chute:** `simulateProcessShot(direction, betAmount)` (linha 420); canShoot usa `balance >= betAmount` (linha 574).  
- **Conclusão:** Mesmo padrão: sem seletor de valor, aposta fixa R$ 1.

### 8.3 gameService.js

- **processShot:** Assinatura `processShot(direction, amount = 1)`; internamente `const betValue = 1` (linha 80) e o body enviado ao backend é `{ direction, amount: betValue }` (linhas 90–92). Ou seja, **sempre amount: 1** na requisição.  
- **getGameInfo:** `config.availableBets: [1]` (linhas 258–259), com comentário “V1: apenas R$ 1 ativo”.  
- **Conclusão:** O serviço envia sempre amount: 1 e expõe apenas [1] como apostas disponíveis na V1.

---

## 9. Consistência econômica

### 9.1 Por lote (V1)

- **Arrecadação:** 10 chutes × R$ 1 = **R$ 10**. (lote.totalArrecadado += betAmount a cada chute; betAmount = 1.)  
- **Prêmio:** Um único gol por lote, prêmio base **R$ 5** (ou R$ 5 + R$ 100 em Gol de Ouro).  
- **Lucro plataforma:** R$ 10 − R$ 5 = **R$ 5** por lote (caso sem Gol de Ouro). Com Gol de Ouro, saída R$ 105; a economia continua bem definida (entrada fixa 10, saída 5 ou 105).

### 9.2 Cenários de inconsistência

- **Prêmio maior que arrecadação:** Só no Gol de Ouro (R$ 105 > R$ 10 por lote), por desenho do produto; não é bug.  
- **Saldo incorreto:** Perdedores são debitados pelo trigger (valor_aposta); vencedor é ajustado com `saldo - betAmount + premio + premioGolDeOuro`. Não há duplo crédito porque o UPDATE do vencedor sobrescreve o efeito do trigger.  
- **Crédito duplicado:** Apenas um gol por lote (winnerIndex único); apenas um UPDATE de saldo do vencedor por gol.  
- **Conclusão:** A economia da V1 fecha; não foi identificado cenário de prêmio indevido, saldo incorreto ou crédito duplicado além do que já depende do trigger em produção.

---

## 10. Diagnóstico final

**Classificação:** **ENGINE V1 VALIDADA**

- **Bloqueio de valor:** Apenas R$ 1 aceito; amount ≠ 1 retorna 400 com mensagem definida; nenhum lote ou saldo alterado.  
- **Sequência do lote:** Chutes 1–9 sempre *miss*, 10º sempre *goal*; shotIndex e winnerIndex conferem.  
- **Fechamento:** Lote ativo do 1º ao 9º chute; encerra após o 10º; 11º chute bloqueado por validateBeforeShot.  
- **Reentrada:** Mesmo jogador pode chutar várias vezes no mesmo lote; sem restrição por usuario_id.  
- **Prêmio:** R$ 5 (e +R$ 100 em Gol de Ouro) aplicados e persistidos corretamente.  
- **Gol de Ouro:** Contador global e condição % 1000 preservados.  
- **Frontend:** Sem seletor de valor; processShot envia sempre amount: 1; availableBets = [1].  
- **Economia:** Arrecadação R$ 10, prêmio R$ 5, lucro R$ 5 por lote; sem inconsistências identificadas.

A engine V1 pode ser considerada **tecnicamente validada para uso prático**, com a ressalva já documentada: a consistência do débito dos perdedores depende da existência do trigger update_user_stats no Supabase de produção.

---

*Validação conduzida em modo READ-ONLY. Nenhuma alteração de código, banco ou deploy foi realizada.*
