# AUDITORIA READ-ONLY — BLOCO B — ENGINE V1

**Acesso:** no Cursor use **Ctrl+P** → `AUDITORIA-BLOCO-B` e abra [`docs/AUDITORIA-BLOCO-B.md`](../AUDITORIA-BLOCO-B.md) (atalho; evita links `file://` com espaço em `Chute de Ouro`). Ver também [`RELATORIO-BLOCO-B.md`](../../RELATORIO-BLOCO-B.md) na raiz do repositório.

**Data:** 2026-03-29  
**Modo:** somente leitura (código inspecionado; nenhuma alteração de aplicação).  
**Entrada oficial da API:** `package.json` → `"main": "server-fly.js"`, `"start": "node server-fly.js"`.  
**Escopo:** engine de apostas/chute/lote/gol/contador/prêmio implementada em `server-fly.js` e validador `utils/lote-integrity-validator.js`. Fly.io não é premissa; riscos de deploy multi-instância são citados apenas como consequência arquitetural do estado em memória.

---

## 1. Resumo executivo

A engine ativa em **V1** implementa **lotes em memória** (`lotesAtivos` como `Map`), **reaproveitamento** de lote pelo mesmo valor enquanto houver vaga, **fechamento** ao atingir gol (sempre no último índice do lote para R$ 1) ou ao completar tamanho, e **persistência** do chute na tabela `chutes` com `lote_id` e `contador_global`. O **valor de aposta efetivo** no endpoint de chute está **fixado em R$ 1,00**; `batchConfigs` prevê outros valores, mas o fluxo de `/api/games/shoot` não os utiliza.

Pontos que exigem atenção (com evidência no código): o **contador global é incrementado antes** da atualização otimista de saldo e do `insert` em `chutes`; em falhas subsequentes (ex.: 409 de saldo) **não há reversão** do contador nem falha dura se `saveGlobalCounter` não persistir. Isso pode **desalinhar** número global em memória, linha em `metricas_globais`, `contador_global` em `chutes` e o marco de **Gol de Ouro** (múltiplo de 1000). O endpoint público `/api/metrics` **zera** totais exibidos mesmo com leitura ao banco — comportamento observável, não da mecânica do chute em si.

**Classificação final (obrigatória):** **BLOCO B COM RISCOS MODERADOS** — modelo por lotes e regra de gol na V1 estão coerentes no caminho feliz; riscos concentram-se no **ciclo de vida do contador global** e em **estado só em RAM** por processo.

---

## 2. Escopo auditado

| Incluído | Excluído (pedido do solicitante) |
|----------|----------------------------------|
| `server-fly.js`: `lotesAtivos`, `getOrCreateLoteByValue`, `batchConfigs`, `POST /api/games/shoot`, `saveGlobalCounter`, carga do contador no boot | Alterações, patches, player, admin |
| `utils/lote-integrity-validator.js` | PIX, saque, webhook (fora do BLOCO B) |
| Referência cruzada: `routes/adminApiFly.js` (snapshot “fila” = lotes em memória) | Implementação visual do jogo |

Arquivos **não** usados como engine oficial pelo `npm start`, mas presentes no repositório: `server-fly-deploy.js` (lógica de `winnerIndex` diferente), `router.js` (chute com `Math.random`, tabela `games`) — mencionados só como **risco de deriva** se outro entrypoint for usado por engano.

---

## 3. Modelo de lotes

### 3.1 Criação

- **Onde:** `getOrCreateLoteByValue(amount)` em `server-fly.js`.
- **Quando:** não existe lote **ativo**, com o mesmo valor, com `chutes.length < config.size`.
- **ID:** `lote_${amount}_${Date.now()}_${randomBytes}` (bytes criptográficos).
- **Campos relevantes:** `valor` / `valorAposta`, `ativo: true`, `status: 'active'`, `config` (size, totalValue, winChance), `chutes: []`, `winnerIndex`, `totalArrecadado`, `premioTotal`.

### 3.2 Reaproveitamento

- Iteração sobre `lotesAtivos`; escolhe o primeiro lote com mesmo valor (`valor` ou `valorAposta`), `ativo`/status ativo e `chutes.length < config.size`.
- **Ordem:** depende da ordem de iteração do `Map` (primeiro encaixe).

### 3.3 Fechamento

- **Por gol:** se `isGoal`, antes do `push` o código define `lote.status = 'completed'` e `lote.ativo = false`.
- **Por tamanho:** após o `push`, se `lote.chutes.length >= lote.config.size` e o lote ainda não estava `completed`, fecha de novo (redundante se o gol já fechou no último chute da V1).

### 3.4 Relação jogador ↔ lote

- Não há entidade “inscrição” separada: o jogador **entra no lote no momento do chute** autenticado.
- O validador documenta explicitamente que **o mesmo usuário pode chutar várias vezes no mesmo lote** (`validateShots`).

### 3.5 Coerência com “modelo oficial por lotes”

- **Sim** para R$ 1: lote de **10 chutes**, arrecadação alinhada a `totalValue` conceitual (10 × R$ 1).
- **Observação:** `batchConfigs` para 2, 5 e 10 existe na engine, mas o endpoint de chute **força** `betAmount = 1`; os outros tamanhos **não participam** do fluxo atual da V1.

---

## 4. Regras do chute

### 4.1 Direção

- Corpo: `direction`; normalização `trim` + `toUpperCase`.
- **Válidas:** `TL`, `TR`, `C`, `BL`, `BR` (`VALID_DIRECTIONS`), alinhadas ao validador.
- **Efeito no resultado:** o gol/miss é determinado pela **posição no lote**, não pela direção (a direção é persistida e validada, mas **não altera** `isGoal`).

### 4.2 Amount

- `amountNum !== 1` → **400** com mensagem explícita de V1 só R$ 1,00.
- Internamente `betAmount = 1`.

### 4.3 Autenticação

- Rota protegida por `authenticateToken`; uso de `req.user.userId` para saldo e persistência.

### 4.4 Quando é aceito

- Supabase conectado; direção e amount válidos; idempotência (se header presente e chave já usada no TTL → **409**); usuário existe; `saldo >= betAmount`; `validateBeforeShot` do integrador OK; após isso segue fluxo de contador, saldo, lote e `insert`.

### 4.5 Quando é rejeitado

- **400:** dados obrigatórios, direção inválida, amount ≠ 1, integridade do lote, lote completo, falha pós-chute no validador.
- **403:** token inválido (middleware).
- **404:** usuário não encontrado.
- **409:** chave de idempotência duplicada; ou falha do **optimistic lock** no `update` de `saldo` (`saldo` não bate mais).
- **503:** banco indisponível.
- **500:** falha ao inserir em `chutes` (com rollback de saldo e estado do lote em memória).

### 4.6 Concorrência e duplicidade (tentativa)

- **Optimistic lock:** `update` de `usuarios.saldo` com `.eq('saldo', user.saldo)`.
- **Idempotência:** opcional via `X-Idempotency-Key`, cache em memória com TTL; sem header, retries podem gerar múltiplos chutes se o cliente gerar requisições distintas.

---

## 5. Regra do gol

### 5.1 Definição

- `shotIndex = lote.chutes.length` (0-based **antes** do push).
- `isGoal = shotIndex === lote.winnerIndex`.
- Para lote novo em V1: comentário e código fixam `winnerIndex: config.size - 1` (para R$ 1, **índice 9** = 10º chute).

### 5.2 Momento de fechamento do lote

- No **gol**, o lote é fechado **antes** de empilhar o chute (para o validador “ver” estado consistente).
- Com `winnerIndex` sempre no último slot, o **último chute do lote é sempre gol**; não há cenário de lote “cheio” sem gol nessa configuração.

### 5.3 Vencedor

- O jogador do chute na posição `winnerIndex` recebe `result === 'goal'` e prêmios associados (ver secção 7).

### 5.4 Relação com o contador global

- O contador **não** entra na fórmula `isGoal`; entra apenas em `isGolDeOuro` e metadados. A **regra de gol do lote** e o **Gol de Ouro** são ortogonais no código.

---

## 6. Contador global

### 6.1 Onde incrementa

- No handler de shoot, **após** validações iniciais e integridade pré-chute: `contadorChutesGlobal++`.
- **Não** há decremento em nenhum ramo de erro posterior.

### 6.2 Persistência

- `saveGlobalCounter()` faz `upsert` em `metricas_globais` (`id: 1`, `contador_chutes_global`, `ultimo_gol_de_ouro`).
- Em erro de Supabase: apenas **log**; a função **não propaga** exceção — o valor em memória já foi incrementado.

### 6.3 Carga no boot

- `startServer` lê `metricas_globais` e repõe `contadorChutesGlobal` e `ultimoGolDeOuro`.

### 6.4 Relação com Gol de Ouro

- `isGolDeOuro = contadorChutesGlobal % 1000 === 0` **no mesmo request**, após o incremento.
- Se for gol + marco, `premioGolDeOuro = 100` e `ultimoGolDeOuro = contadorChutesGlobal`.

### 6.5 Riscos de inconsistência (evidência)

1. **Incremento antes do commit do chute:** se o `update` de saldo falhar (**409**), o contador **permanece** avançado; o próximo chute bem-sucedido terá `contador_global` “pulando” um número sem linha correspondente no intervalo.
2. **`saveGlobalCounter` silencioso:** memória e banco de métricas podem divergir até o próximo upsert bem-sucedido ou restart (que recarrega do banco e pode **regredir** o contador em relação à memória se o banco estava defasado).
3. **Gol de Ouro:** o marco dos 1000 é atrelado ao **valor do contador após incremento naquele request**, não a um commit transacional único com o `insert` em `chutes`; falhas após o incremento alteram a **semântica** “cada N chutes registrados” vs “N incrementos após validação pré-chute”.
4. **Múltiplas instâncias Node:** cada processo tem seu próprio `contadorChutesGlobal` e seu próprio `lotesAtivos`; não há, neste arquivo, coordenação distribuída — para mais de uma réplica, o “modelo único de lote global” **deixa de valer** por construção.

### 6.6 Observação sobre `/health` e `/api/metrics`

- `/health` expõe `contadorChutes` e `ultimoGolDeOuro` da memória do processo.
- `/api/metrics` define `totalChutes` e `ultimoGolDeOuro` como **0** no payload mesmo consultando o banco — inconsistência **de API de leitura**, não da engine de chute.

---

## 7. Premiação

### 7.1 Crédito de saldo

- Um único `update` em `usuarios.saldo`: em gol, `novoSaldo = saldo - betAmount + premio + premioGolDeOuro`; em miss, apenas debita a aposta.
- Falhas no validador pós-chute ou no `insert` de `chutes`: **reversão** do saldo para `user.saldo` e desfaz push/agregados do lote quando aplicável.

### 7.2 Valores

- Gol normal: `premio = 5.00` (fixo no código).
- Gol de Ouro: `premioGolDeOuro = 100.00` adicional quando o contador (pós-incremento) é múltiplo de 1000.

### 7.3 Relação com o lote

- `lote.totalArrecadado += betAmount`; `lote.premioTotal += premio + premioGolDeOuro`.

### 7.4 Garantias contra duplicidade

- **Saldo:** optimistic lock reduz lost update; rollback em falhas após débito/crédito.
- **Chute:** um `insert` por request bem-sucedida; sem constraint citada no código auditado (depende do schema Supabase).
- **Idempotência:** mitiga replay **se** o cliente reutilizar a mesma chave dentro do TTL; não é obrigatória.

---

## 8. Invariantes da V1

| Invariante | Status no código oficial (`server-fly.js`) |
|------------|--------------------------------------------|
| Modelo por lotes (Map em memória + `chutes[]`) | **Sim** |
| Tamanho do lote R$ 1 = 10 | **Sim** (`batchConfigs[1].size`) |
| Regra “gol no último chute do lote” (V1) | **Sim** (`winnerIndex: config.size - 1`) |
| Aposta efetiva R$ 1 no endpoint | **Sim** (rejeição explícita de outros valores) |
| Sem “fila” de jogadores como motor do jogo | **Sim**; admin documenta que “fila” é legado nominal para snapshot de lotes |
| Direção afeta gol | **Não** (só posição no lote) |
| Contador global alinhado 1:1 com chutes persistidos em todo erro | **Não** (incremento antes do commit sem rollback) |
| Única fonte de verdade para lotes entre réplicas | **Não** (estado em memória por processo) |

Validador (`lote-integrity-validator.js`): impede chutes após o vencedor e exige consistência de resultado com `winnerIndex` — **coerente** com `winnerIndex` fixo no último índice.

---

## 9. Classificação de riscos

### Críticos

- **Nenhum** classificado como crítico **no caminho feliz** único-processo: prêmio e saldo são revertidos em falhas pós-update documentadas no próprio handler.
- **Ressalva:** em **várias instâncias** sem sharding de sessão de jogo, a quebra do invariante “um lote global por valor” é **crítica para o modelo de negócio** se a V1 assumir pool único — é risco **arquitetural condicional** ao topology, não ao arquivo isolado.

### Altos

- **Contador global:** incremento sem transação atômica com `insert`/`update` e sem rollback em 409 ou falhas após `saveGlobalCounter` — desvio entre memória, `metricas_globais`, `chutes.contador_global` e marco de Gol de Ouro.
- **Persistência de métricas:** falha no `upsert` não aborta o fluxo.

### Médios

- **`/api/metrics`:** resposta com totais zerados apesar de dados no banco — confusão operacional.
- **`server-fly-deploy.js` / `router.js`:** engine alternativa com regras diferentes — risco se deploy usar arquivo errado (mitigação operacional: `package.json` já aponta para `server-fly.js`).
- **`batchConfigs` 2/5/10:** mantidos na engine mas **inacessíveis** pelo shoot V1 — complexidade morta e possível fonte de mal-entendido em auditorias futuras.

### Baixos

- Ordem de escolha do lote reutilizável entre vários lotes abertos do mesmo valor (improvável com um lote ativo por valor, mas dependente do `Map`).
- Cache de validação no integrador (TTL 5 min) — impacto limitado às funções de validação completa, não ao `validateBeforeShot`/`validateAfterShot` que chamam `validateLoteIntegrity` (pode servir resultado cacheado para o mesmo `validationId`).

---

## 10. Diagnóstico final

A **engine V1 em `server-fly.js`** está **alinhada ao modelo por lotes** para a aposta efetiva de **R$ 1,00**: criação e reuso de lote, limite de 10 chutes, **gol determinístico no último slot**, fechamento do lote coerente, premiação fixa de gol e bônus de Gol de Ouro condicionado ao contador, persistência do chute com `lote_id` e metadados.

As **incoerências estruturais relevantes** concentram-se no **contador global** (momento do incremento, falta de rollback, persistência best-effort) e na natureza **efêmera e por processo** dos lotes. O restante do repositório contém **caminhos legados ou paralelos** que **não** são a engine oficial pelo `npm start`, mas aumentam o risco de deriva se usados inadvertidamente.

**Classificação final obrigatória:** **BLOCO B COM RISCOS MODERADOS**.

---

## 11. Próxima etapa recomendada

1. **Especificar formalmente** a invariante desejada para o contador: “por chute persistido” vs “por tentativa pós-validação pré-chute” e alinhar implementação (em outra etapa, fora deste modo read-only).
2. **Decisão de topologia:** uma réplica vs múltiplas; se múltiplas, definir se lotes e contador exigem camada compartilhada (DB/Redis) — hoje o código não oferece isso.
3. **Harmonizar ou isolar** `server-fly-deploy.js` e `router.js` (documentação de obsolescência ou remoção em projeto futuro) para evitar confusão com a V1 oficial.
4. **Revisar** `/api/metrics` para não contradizer `metricas_globais`/`health` quando métricas forem usadas para suporte.

---

*Fim do relatório. Evidências principais: `server-fly.js` (lotes, shoot, `saveGlobalCounter`, boot), `utils/lote-integrity-validator.js`, `routes/adminApiFly.js` (snapshot), `package.json` (entrypoint).*
