# AUDITORIA DE CONCORRÊNCIA — CHUTES E SALDO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — inspeção de código, sem alterações.  
**Escopo:** server-fly.js (POST /api/games/shoot, saque, webhook/reconciliação de depósito), lote em memória, tabelas chutes e usuarios.

---

## 1. Resumo executivo

A auditoria de concorrência foi feita por **leitura do código** do endpoint POST /api/games/shoot, do fluxo de saque, do webhook e da reconciliação de depósitos, e da gestão do lote em memória (lotesAtivos, getOrCreateLoteByValue).  

**Conclusão:** O sistema **não** usa transação que una INSERT em `chutes` e UPDATE em `usuarios`; **não** há lock (nem otimista nem pessimista) sobre saldo; **não** há idempotência no endpoint de chute (sem request id, idempotency key nem deduplicação). O saldo é **lido uma vez** no início do request e **gravado** muito depois, após vários awaits (validação, contador global, INSERT). Com isso: (1) **dois chutes simultâneos do mesmo usuário** podem ambos ler o mesmo saldo e o segundo UPDATE sobrescrever o primeiro → **lost update** (apenas um débito efetivo). (2) **Retry/replay** pode gerar **dois INSERTs em chutes** e dois UPDATEs de saldo (ou um, conforme ordem) → **chute duplicado** e possível débito incorreto. (3) **Chute e depósito** (ou reconciliação) podem fazer read-modify-write concorrente → **lost update** em saldo. (4) **Chute e saque:** o request de saque só insere em `saques` e não debita `usuarios` neste arquivo; o débito do saque ocorre em processo externo/worker — a colisão é entre UPDATE do chute e UPDATE do worker, com o mesmo padrão de lost update. (5) **Lote em memória:** em **uma única instância** Node, entre `shotIndex = lote.chutes.length` e `lote.chutes.push(chute)` não há await, então não há intercalação de outro request no mesmo processo; em **múltiplas instâncias**, cada processo tem seu próprio `lotesAtivos` → lotes duplicados e inconsistência lote/banco.  

**Diagnóstico final:** **RISCO CONCORRENTE MODERADO**. O risco mais sério hoje é **lost update em saldo** (dois chutes ou chute + outra operação usando o mesmo saldo), seguido de **chute duplicado por retry** e de **multi-instância** (lotes e contador global não compartilhados).

---

## 2. Fluxo atual do chute

### 2.1 Sequência real do endpoint POST /api/games/shoot

| # | Etapa | Operação | Await? | Onde saldo é lido/escrito |
|---|--------|----------|--------|----------------------------|
| 1 | Autenticação | authenticateToken (req.user.userId) | sim (middleware) | — |
| 2 | Validação entrada | direction, amount === 1 | não | — |
| 3 | Conexão DB | dbConnected, supabase | não | — |
| 4 | **Leitura do usuário/saldo** | supabase.from('usuarios').select('saldo').eq('id', userId).single() | **sim** | **Saldo lido → user.saldo** |
| 5 | Validação saldo | user.saldo < betAmount → 400 | não | — |
| 6 | Obtenção/criação lote | getOrCreateLoteByValue(betAmount) — Map em memória | não | — |
| 7 | Validação pré-chute | loteIntegrityValidator.validateBeforeShot(lote, …) | não | — |
| 8 | Contador global | contadorChutesGlobal++; saveGlobalCounter() | **sim** | — |
| 9 | Cálculo do resultado | shotIndex = lote.chutes.length; isGoal = shotIndex === lote.winnerIndex; result | não | — |
| 10 | Prêmios (se goal) | premio, premioGolDeOuro; lote.status/ativo | não | — |
| 11 | Chute em memória | lote.chutes.push(chute); totalArrecadado; premioTotal | não | — |
| 12 | Validação pós-chute | validateAfterShot(lote, …) | não | — |
| 13 | **INSERT em chutes** | supabase.from('chutes').insert({…}) | **sim** | — |
| 14 | Fechamento lote (se completo) | lote.status, lote.ativo | não | — |
| 15 | **Cálculo novo saldo** | novoSaldo = user.saldo - betAmount [+ premio + premioGolDeOuro] | não | **Baseado em user.saldo (lido no passo 4)** |
| 16 | **UPDATE em usuarios** | supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', userId) | **sim** | **Saldo gravado** |
| 17 | Resposta HTTP | res.status(200).json({…}) | não | — |

### 2.2 Pontos críticos

- **Onde o saldo é lido:** Uma única vez, no passo 4 (linhas 1159–1163).  
- **Onde é recalculado:** No passo 15 (linhas 1335 ou 1347), usando **sempre** o valor de `user.saldo` do passo 4.  
- **Onde é gravado:** No passo 16 (linhas 1337–1340 ou 1348–1351), com **um** UPDATE por request.  
- **Lock:** Nenhum. Não há SELECT FOR UPDATE, nem lock em aplicação, nem mutex em memória no fluxo de saldo.  
- **Transação:** Nenhuma. INSERT em `chutes` e UPDATE em `usuarios` são duas operações independentes; não há BEGIN/COMMIT que as agrupe.  
- **Idempotência:** Nenhuma. Não há X-Idempotency-Key, request-id nem chave de deduplicação no endpoint de chute (o header X-Idempotency-Key existe no CORS e é usado em fluxo PIX, não no shoot).

---

## 3. Concorrência de saldo

### 3.1 Mesmo usuário, dois chutes quase simultâneos

- **Request A e B:** Ambos passam na validação de saldo se, no momento do SELECT, o saldo for ≥ 1 (ex.: 10).  
- **Ambos podem ler o mesmo saldo inicial:** Sim. A faz SELECT → user.saldo = 10; antes de A fazer o UPDATE, B faz SELECT → usuario.saldo = 10.  
- **Ambos podem inserir chute:** Sim. Cada um tem seu shotIndex (em uma instância, a ordem dos awaits serializa quem faz push primeiro; veja seção 6). O INSERT não tem constraint UNIQUE que impeça dois chutes no mesmo “slot”.  
- **Ambos podem atualizar saldo com base no mesmo valor antigo:** Sim. A calcula novoSaldo = 10 - 1 = 9 e faz UPDATE 9; B calcula novoSaldo = 10 - 1 = 9 e faz UPDATE 9. O segundo UPDATE **sobrescreve** o primeiro.  
- **Saldo final incorreto:** Sim. Esperado: 10 - 1 - 1 = 8. Real: 9 (um débito “perdido”).  
- **Dois chutes aceitos com saldo para um só:** Sim. Com saldo 1, A lê 1 e B lê 1; ambos passam em user.saldo >= 1; ambos inserem chute e ambos fazem UPDATE saldo = 0. Resultado: dois chutes, um único débito; saldo 0 (deveria ser -1 para o segundo, ou o segundo deveria ser rejeitado).

**Conclusão:** **Lost update** é possível: duas operações que debitam saldo podem ambas usar o mesmo valor lido e apenas a última escrita prevalecer.

---

## 4. Retry, timeout e replay

### 4.1 Ausência de proteção

- Não há **request id** nem **idempotency key** no corpo ou no header do POST /api/games/shoot.  
- Não há **hash de ação** (ex.: lote_id + usuario_id + shot_index) usado como chave única para ignorar duplicata.  
- Não há **trava por usuário** (mutex por userId) nem **trava por lote** (lock no lote antes de ler shotIndex e dar push).  
- A tabela **chutes** não impõe UNIQUE (lote_id, shot_index) nem (usuario_id, lote_id, created_at com janela) que rejeite inserção duplicada.

### 4.2 Cenário: cliente reenvia após timeout

- Cliente envia POST shoot; backend processa (INSERT + UPDATE) e a resposta se perde ou atrasa.  
- Cliente reenvia o **mesmo** chute (mesma direção, mesmo amount).  
- Backend trata como **novo** request: valida de novo, obtém o mesmo lote (já com um chute a mais), calcula novo shotIndex (ex.: 1), insere **segundo** registro em `chutes` e faz **segundo** UPDATE de saldo.  
- **Efeitos:** Dois registros em `chutes` para o mesmo “logical shot”; dois débitos se o saldo lido na segunda vez já for o atualizado (ex.: 9 → 8), ou um débito perdido se a segunda leitura for ainda 10 (concorrência com outro request).  
- **Prêmio duplicado:** Se por engano o retry coincidir com a posição de goal em outro lote (ou reutilização de lote), o cenário seria atípico; o caso típico de retry é **duplicar chute e possivelmente débito incorreto**.

**Conclusão:** O sistema **pode** processar o mesmo chute duas vezes (replay/retry); não há idempotência. Risco: **chute duplicado** e **saldo incorreto** (um ou dois débitos conforme ordem de leitura/escrita).

---

## 5. Concorrência com saque e depósito

### 5.1 Saque (POST /api/withdraw/request)

- **Fluxo em server-fly.js:** SELECT saldo → valida saldo >= valor → INSERT em `saques`. **Não** há UPDATE em `usuarios` neste endpoint; o débito do saque é delegado a processo externo/contábil (comentário no código).  
- **Colisão com chute:** Se em outro processo (worker) o saque debitar `usuarios.saldo`, a sequência pode ser: (1) Chute lê saldo 100; (2) Worker do saque lê 100, debita 50 → saldo 50; (3) Chute grava saldo 99 (100 - 1), **sobrescrevendo** 50. Resultado: usuário fica com 99 em vez de 49 (perda do débito do saque). Ou na ordem inversa: chute grava 99; worker lê 99 e debita 50 → 49 (correto). A **condição de corrida existe**: o resultado depende da ordem de execução; **lost update** é possível.

### 5.2 Depósito (webhook / reconciliação)

- **Webhook:** SELECT saldo → novoSaldo = user.saldo + credit → UPDATE usuarios SET saldo = novoSaldo.  
- **Reconciliação:** Mesmo padrão (SELECT saldo, novoSaldo = saldo + credit, UPDATE).  
- **Colisão com chute:** Chute lê 10, depósito lê 10 e grava 60 (10+50). Chute grava 9 (10-1) e **sobrescreve** 60 → saldo final 9 (perda do crédito do depósito). Ou: chute grava 9; depósito lê 9 e grava 59 (correto). **Lost update** possível.  
- **Chute usando saldo antigo:** Sim. O chute usa o saldo lido no início do request; se um depósito for commitado entre a leitura e o UPDATE do chute, o UPDATE do chute pode sobrescrever o saldo já creditado.

**Conclusão:** Existe **condição de corrida** entre gameplay e saque (no worker) e entre gameplay e depósito/webhook/reconciliação. Saldo final pode ficar **menor ou maior** que o correto (lost update em qualquer sentido).

---

## 6. Concorrência do lote

### 6.1 Uso de lote em memória

- **shotIndex:** Definido como `lote.chutes.length` **antes** do push (linha 1206).  
- **Mutação:** `lote.chutes.push(chute)` (linha 1245); em seguida validação e INSERT no banco.  
- Entre `shotIndex = lote.chutes.length` e `lote.chutes.push(chute)` **não há await** no mesmo handler. Em **Node (uma instância)**, o event loop não intercala outra requisição nesse trecho; a próxima requisição só roda após um await. Portanto, em **uma única instância**, dois requests que usem o mesmo lote tendem a ser serializados nos awaits (ex.: saveGlobalCounter, INSERT), e cada um vê um `lote.chutes.length` já atualizado pelo anterior quando retoma → **shotIndex** em geral distinto (0, 1, 2, …).  
- **Risco remanescente em uma instância:** Se houver algum ponto em que o lote seja compartilhado e lido/escrito de forma assíncrona sem serialização, ainda assim poderia haver duplicidade; no fluxo atual, o maior risco em single-instance é **saldo**, não o índice do chute.  
- **11º chute:** O validador exige `lote.chutes.length < config.tamanho`. Após o 10º chute o lote fica completed/ativo false e o próximo request obtém ou cria **outro** lote. Em uma instância, não há evidência de 11º chute no mesmo lote; em multi-instância (abaixo) o cenário muda.

### 6.2 Ausência de lock por lote

- Não há mutex, lock nem fila por `lote_id` ou por valor de aposta. Vários requests podem entrar no mesmo lote em paralelo (até o próximo await). Em Node single-threaded, a concorrência é “cooperativa” nos awaits; em múltiplas instâncias, cada uma tem seu próprio `lotesAtivos` (Map em memória), então **não** compartilham o mesmo objeto lote.

### 6.3 Multi-instância (resumo para seção 7)

- Cada processo tem seu próprio `lotesAtivos`. Dois chutes para “valor 1” em instâncias diferentes podem criar **dois lotes** (um em cada instância) e inserir em `chutes` com `lote_id` diferentes. Não há “um único lote” global; o risco é **lotes duplicados** e **inconsistência** entre estado em memória e registros no banco.

---

## 7. Multi-instância

### 7.1 Lotes e contador em memória

- **lotesAtivos:** Variável em memória do processo (Map). Outra instância do backend tem outro Map. Não há Redis nem fila compartilhada para “lote ativo por valor”.  
- **contadorChutesGlobal:** Variável em memória; cada instância incrementa a sua; `saveGlobalCounter()` faz upsert em `metricas_globais` (id 1), então **a última escrita vence** → contador pode ficar incorreto (ex.: duas instâncias leem 100, ambas escrevem 101) e **Gol de Ouro** pode ser atribuído mais de uma vez ou nunca, conforme ordem.  
- **Lotes duplicados:** Duas instâncias podem ter cada uma um lote “ativo” para valor 1; os INSERTs em `chutes` referenciam `lote_id` diferentes; a regra de negócio “um lote de 10 chutes” deixa de ser única globalmente.  
- **Perda de consistência:** O banco tem N chutes com N `lote_id` distintos; em memória cada instância vê apenas seus próprios lotes. Consistência entre memória e banco **não** é garantida em escala horizontal.

### 7.2 Classificação

- **Risco atual:** Se a aplicação rodar hoje com **uma única instância**, o risco multi-instância não se manifesta; é **risco futuro** ao escalar.  
- **Risco futuro:** **Alto** ao subir mais de uma instância sem fila única por valor, lock distribuído ou persistência do estado do lote.  
- **Risco aceitável:** Para V1 com uma instância, documentado como limitação conhecida.  
- **Risco bloqueador:** Pode ser **bloqueador** se a operação exigir várias instâncias e consistência estrita de lote e contador global.

---

## 8. Proteções existentes e ausentes

### 8.1 O que existe hoje

| Item | Situação |
|------|----------|
| Validação de saldo antes do chute | Existe (user.saldo >= betAmount); evita aprovar quando saldo já insuficiente **no momento da leitura**. |
| Validação de lote cheio | Existe (validateBeforeShot: chutes.length < tamanho). |
| Rollback em memória se INSERT chutes falhar | Existe (pop, ajuste totalArrecadado/premioTotal, reabertura do lote se goal). |
| CORS com X-Idempotency-Key | Header permitido; usado em fluxo PIX, **não** no shoot. |

### 8.2 O que não existe (concorrência e atomicidade)

| Item | Situação |
|------|----------|
| Transação (BEGIN; INSERT chutes; UPDATE usuarios; COMMIT) | Não existe. |
| Row lock (SELECT FOR UPDATE) | Não existe. |
| Optimistic locking (UPDATE … WHERE saldo = valor_esperado) | Não existe; UPDATE é por id com valor absoluto. |
| Idempotência (chave por request ou por ação) | Não existe no endpoint de chute. |
| UNIQUE constraint (ex.: lote_id + shot_index) | Não existe na tabela chutes (apenas id UUID). |
| Deduplicação de request | Não existe. |
| Serialização por usuário (mutex por userId) | Não existe. |
| Serialização por lote (lock por lote_id) | Não existe. |
| Fila (um chute por vez por lote ou por usuário) | Não existe. |
| Mutex em memória para lote ou saldo | Não existe. |
| Compare-and-swap de saldo (UPDATE … SET saldo = saldo - 1 WHERE id = ? AND saldo >= 1) | Não existe; o código usa valor calculado (user.saldo - 1). |

---

## 9. Top riscos remanescentes

1. **Lost update em saldo (dois chutes ou chute + outra operação)**  
   Duas operações leem o mesmo saldo, calculam novo valor e fazem UPDATE; a última sobrescreve a anterior. **Risco real** com requisições simultâneas (mesmo usuário ou usuário + depósito/saque worker).

2. **Chute duplicado por retry/replay**  
   Sem idempotência, um segundo request idêntico pode gerar segundo INSERT em `chutes` e segundo UPDATE de saldo (ou lost update). **Risco real** em redes instáveis ou clientes que reenviam.

3. **Chute e saque (worker)**  
   Se o worker que debita o saque fizer read-modify-write sem lock, a ordem entre UPDATE do chute e UPDATE do saque pode gerar saldo errado (ex.: débito do saque perdido). **Risco real** onde o débito do saque for feito em processo separado.

4. **Chute e depósito (webhook/reconciliação)**  
   Mesmo padrão read-modify-write; depósito pode ser perdido ou chute pode sobrescrever saldo já creditado. **Risco real**.

5. **Multi-instância: lotes e contador**  
   Lotes duplicados por processo; contador global com “last write wins”. **Risco futuro** ao escalar horizontalmente.

6. **INSERT chutes + UPDATE usuarios não atômicos**  
   Se o INSERT succeed e o UPDATE falhar (ou o contrário), estado fica inconsistente (chute registrado sem débito, ou débito sem registro). Já documentado como melhoria futura no encerramento do BLOCO E.

---

## 10. Diagnóstico final

### Classificação dos cenários

| Cenário | Classificação | Motivo |
|---------|----------------|--------|
| Mesmo usuário, dois chutes simultâneos | **PROVÁVEL** | Ambos podem ler o mesmo saldo; segundo UPDATE sobrescreve o primeiro → lost update (um débito perdido). |
| Retry/replay do request | **PROVÁVEL** | Sem idempotência; reenvio gera segundo INSERT em chutes e segundo ou incorreto UPDATE de saldo. |
| Chute + saque | **POSSÍVEL MAS BAIXO** | Saque não debita neste endpoint; colisão com worker que debita → lost update possível, dependendo da ordem. |
| Chute + depósito | **PROVÁVEL** | Webhook/reconciliação e chute fazem read-modify-write; um pode sobrescrever o outro. |
| Concorrência no lote | **POSSÍVEL MAS BAIXO** (single instance) | Em uma instância Node, awaits serializam; shotIndex tende a ser único. Sem lock explícito; edge cases possíveis. |
| Multi-instância | **CRÍTICO** (se houver >1 instância) | Lotes e contador por processo; lotes duplicados; contador e Gol de Ouro inconsistentes. |

**Classificação geral:** **RISCO CONCORRENTE MODERADO**

- **Risco alto** seria: perda sistemática de saldo, prêmio duplicado frequente, ou corrupção explícita de dados. Hoje o comportamento é **dependente de timing** (requisições simultâneas ou retry), e em cenário de baixa concorrência e uma instância muitos usuários podem nunca ver o problema.  
- **Risco baixo** seria: apenas teórico, com proteções suficientes. Não é o caso: não há transação, nem optimistic lock, nem idempotência no chute.  
- **Moderado** reflete: (1) lost update em saldo **possível** mas não garantido; (2) retry pode duplicar chute e afetar saldo; (3) colisão com saque/depósito possível; (4) single-instance mitiga parte do risco de lote; (5) multi-instância agrava o quadro mas pode não estar em uso hoje.

---

## 11. Conclusão objetiva

**Pode o saldo quebrar com requisições simultâneas?**  
**Sim.** Dois chutes (ou chute + depósito/saque) podem ler o mesmo saldo e um dos UPDATEs sobrescrever o outro, gerando saldo final incorreto (lost update).

**O lote pode quebrar com concorrência?**  
Em **uma instância**, o fluxo atual tende a serializar o uso de `lote.chutes.length` e push nos awaits, reduzindo risco de dois chutes com o mesmo shotIndex no mesmo lote. Em **múltiplas instâncias**, o lote é por processo (lotes duplicados) e a consistência do “um lote de 10” quebra.

**Retry pode duplicar chute?**  
**Sim.** Não há idempotência; um reenvio pode gerar segundo INSERT em `chutes` e segundo (ou incorreto) UPDATE de saldo.

**Saque e chute podem colidir?**  
**Sim.** O request de saque não debita em server-fly.js; o débito é em outro processo. A colisão é entre esse processo e o UPDATE do chute, com o mesmo padrão de read-modify-write e lost update.

**Esse risco é só futuro ou já existe hoje?**  
**Já existe hoje** para saldo (dois chutes simultâneos, chute + depósito, chute + worker de saque) e para retry (chute duplicado). O risco de **multi-instância** (lotes e contador) é futuro se hoje houver apenas uma instância.

**Próximo risco estrutural mais importante do Gol de Ouro:**  
**Atomicidade e concorrência de saldo:** unir INSERT em `chutes` e UPDATE em `usuarios` em uma única transação ou usar **optimistic locking** (UPDATE usuarios SET saldo = saldo - 1 WHERE id = ? AND saldo >= 1; verificar rows afetados e falhar se 0) e, onde possível, **idempotência** no endpoint de chute (ex.: chave por usuário+lote+posição ou idempotency key) para reduzir lost update e duplicação por retry.

---

*Auditoria conduzida em modo READ-ONLY. Nenhuma alteração de código, banco ou deploy foi realizada.*

**Caminho do relatório:** `docs/relatorios/AUDITORIA-CONCORRENCIA-CHUTES-E-SALDO-READONLY-2026-03-09.md`
