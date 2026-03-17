# AUDITORIA BLOCO I — ESCALABILIDADE

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco, infraestrutura ou arquitetura. Apenas análise e documentação.

---

## 1. Resumo executivo

A auditoria do **Bloco I — Escalabilidade** avaliou se o sistema Gol de Ouro permanece **consistente, correto e financeiramente seguro sob carga e concorrência**. Foram analisados o endpoint POST /api/games/shoot, o sistema de lotes em memória (`lotesAtivos`), o contador global (`contadorChutesGlobal`), a persistência em Supabase (usuarios, chutes, metricas_globais) e o comportamento em cenários de concorrência, múltiplas instâncias e alta carga.

**Conclusão resumida:** Em **instância única** e carga moderada o sistema é **operável com ressalvas**: o **saldo do usuário** é protegido por optimistic locking (UPDATE com .eq('saldo', user.saldo)), o que evita dois créditos para o mesmo “slot” de chute e garante que no máximo um request “vencedor” por disputa de 10º chute efetive pagamento. Porém **(1)** o **contador global não é atualizado atomicamente** — em concorrência dois requests podem incrementar e apenas um persistir chute, gerando deriva do contador e risco de Gol de Ouro disparar no momento errado ou não disparar; **(2)** o **índice do chute no lote** (`shotIndex = lote.chutes.length`) é lido sem lock — dois requests podem ver o mesmo índice (ex.: 9) e ambos considerar-se “10º”, mas só um passa no UPDATE de saldo, mantendo um único vencedor por lote e expondo o outro a 409; **(3)** **lotes e contador vivem em memória** — restart perde lotes ativos; múltiplas instâncias levariam a lotes e contador divergentes e a comportamento indefinido; **(4)** o **cliente oficial não envia X-Idempotency-Key**, então retry/duplicidade pode gerar dois débitos ou inconsistência; **(5)** não há **transação atômica** entre UPDATE de saldo e INSERT em chutes — falha entre as duas operações pode deixar saldo debitado sem registro de chute.

**Classificação final:** **SEGURO COM RESSALVAS** para operação atual (instância única, volume controlado). **RISCO ALTO** se o sistema for escalado horizontalmente (múltiplas instâncias) sem alteração de arquitetura.

---

## 2. Arquitetura de concorrência

### 2.1 Fluxo do chute (POST /api/games/shoot)

Ordem observada no código (`server-fly.js`, ~linhas 1128–1392):

1. Validação de entrada (direction, amount).
2. V1: amount deve ser 1; caso contrário 400.
3. Idempotência: se header `X-Idempotency-Key` estiver presente e já processado no TTL (120s), responde 409.
4. Leitura do saldo do usuário (SELECT saldo FROM usuarios WHERE id = userId).
5. Obtenção ou criação do lote: `getOrCreateLoteByValue(betAmount)` — itera sobre `lotesAtivos` (Map em memória), reutiliza lote ativo com mesmo valor e com `chutes.length < config.size` ou cria novo e faz `lotesAtivos.set(loteId, lote)`.
6. Validação de integridade antes do chute: `loteIntegrityValidator.validateBeforeShot(lote, ...)`.
7. **Incremento do contador global:** `contadorChutesGlobal++` (variável em memória, sem lock).
8. **Persistência do contador:** `await saveGlobalCounter()` (upsert em `metricas_globais`, id: 1).
9. Cálculo do resultado: `shotIndex = lote.chutes.length`, `isGoal = (shotIndex === lote.winnerIndex)` (V1: winnerIndex = 9 para lote de 10).
10. Cálculo de prêmios: goal → R$ 5; se `contadorChutesGlobal % 1000 === 0` → Gol de Ouro + R$ 100.
11. **Reserva de saldo (optimistic lock):**  
    `UPDATE usuarios SET saldo = novoSaldo WHERE id = userId AND saldo = user.saldo`; se nenhuma linha for afetada, responde 409 e **não** adiciona chute ao lote nem persiste.
12. Atualização do lote em memória: `lote.chutes.push(chute)`, `lote.totalArrecadado += betAmount`, etc.; se goal, `lote.status = 'completed'`, `lote.ativo = false`.
13. Validação pós-chute: `validateAfterShot`; em falha há reversão de saldo (UPDATE), `lote.chutes.pop()` e retorno 400.
14. **Persistência do chute:** INSERT em `chutes` (usuario_id, lote_id, resultado, premio, contador_global, etc.); em erro há reversão de saldo e pop no lote, retorno 500.
15. Resposta 200 com resultado, novoSaldo, contadorGlobal, etc. Se o cliente enviou idempotency key, ela é registrada em `idempotencyProcessed`.

Não há mutex, lock distribuído nem fila serializada por lote ou por contador. O event loop do Node processa requests em paralelo (até o primeiro await); após cada await outro request pode executar. Assim, dois requests podem intercalar execução em qualquer ponto antes do UPDATE de saldo.

### 2.2 Fontes de estado compartilhado

| Recurso | Localização | Compartilhado entre requests? | Compartilhado entre instâncias? |
|--------|-------------|-------------------------------|----------------------------------|
| `lotesAtivos` | Memória (Map) | Sim (mesmo processo) | Não |
| `contadorChutesGlobal` | Memória (variável) | Sim | Não |
| `ultimoGolDeOuro` | Memória | Sim | Não |
| `idempotencyProcessed` | Memória (Map) | Sim | Não |
| Saldo do usuário | Supabase (usuarios) | Sim (banco) | Sim |
| Chutes | Supabase (chutes) | Sim | Sim |
| Métricas globais | Supabase (metricas_globais, id=1) | Sim (banco) | Sim |

Em instância única, o “estado crítico” do jogo (quem é o 10º, valor do contador) está em memória e é compartilhado entre todos os requests do mesmo processo, sem mecanismo de serialização.

---

## 3. Análise de race conditions

### 3.1 Dois jogadores podem ser o “10º chute” ao mesmo tempo?

**Sim, em leitura.** Dois requests A e B podem:

- Obter o **mesmo lote** em `getOrCreateLoteByValue(1)` (lote com 9 chutes).
- Ler **o mesmo** `shotIndex = lote.chutes.length` = 9 (antes de qualquer um fazer push).
- Calcular **os dois** `isGoal = (9 === 9)` = true.
- Calcular os dois `novoSaldo` (débito + R$ 5 e eventual Gol de Ouro).

**Efeito no saldo:** O UPDATE usa optimistic lock: `.eq('id', userId).eq('saldo', user.saldo)`. O primeiro request (ex.: A) atualiza o saldo; o segundo (B) não encontra linha (saldo já alterado) e recebe 409, retornando “Saldo insuficiente ou alterado” **sem** fazer push em `lote.chutes` e **sem** INSERT em `chutes`. Resultado: **apenas um** recebe o prêmio; **não há dois vencedores** para o mesmo lote em termos de crédito. O lote em memória recebe **apenas um** novo chute (o do A). Dois “10º” simultâneos não geram dois pagamentos.

### 3.2 O lote pode gerar dois vencedores?

**Não.** Como acima, só o request que conseguir atualizar o saldo (um único) completa o fluxo e faz push + INSERT. O outro retorna 409 e não altera lote nem chutes.

### 3.3 O lote pode gerar nenhum vencedor?

**Teoricamente sim em cenários de falha,** não por race de “dois 10º”. Ex.: o request que “venceria” (é o 10º) faz UPDATE de saldo com sucesso mas o processo morre antes do INSERT em chutes; a reversão não roda. O lote em memória pode já estar marcado completed e com 10 chutes; no banco, o último chute pode não existir. O “vencedor” foi debitado e deveria ter sido creditado e registrado — fica um vencedor “perdido” do ponto de vista de auditoria (saldo debitado, sem registro do chute goal). Não é “nenhum vencedor” no lote em memória, mas sim inconsistência saldo vs chutes.

### 3.4 O contador de lote pode “quebrar”?

O **tamanho do lote em memória** (`lote.chutes.length`) só aumenta quando um request passa no UPDATE de saldo e faz push. Quem recebe 409 não faz push. Assim, em instância única o número de chutes no lote permanece consistente com “um chute por request que passou no saldo”. O risco é **contador global** (ver seção 4), não o tamanho do array do lote em si.

### 3.5 Race no contador global

Dois requests podem executar `contadorChutesGlobal++` de forma não atômica: ambos leem o mesmo valor (ex.: 999), ambos incrementam (1000 e 1000 em duas variáveis locais ou 1000 e 1001 dependendo da ordem de escrita). O resultado final em memória pode ser 1000 ou 1001; em qualquer caso **cada request que passa no fluxo incrementa uma vez**, mas se dois requests leem 999, podemos ter **dois** incrementos (1000 e 1001) com **um só** chute persistido (o que levou 409 não faz INSERT). Consequência: **deriva do contador** (contador em memória à frente do número real de chutes persistidos) e impacto no Gol de Ouro (ver seção 4).

---

## 4. Análise do contador global

### 4.1 O contador é atualizado atomicamente?

**Não.** É uma variável em memória atualizada com `contadorChutesGlobal++`. Não há lock, não há atomic compare-and-swap, não há incremento atômico no banco (ex.: `UPDATE metricas_globais SET contador_chutes_global = contador_chutes_global + 1`). Em concorrência, dois requests podem ler o mesmo valor, incrementar e escrever; um incremento pode ser “perdido” ou podemos ter dois incrementos para um único chute persistido (como no cenário 409 acima).

### 4.2 Risco de dois chutes lerem o mesmo valor?

**Sim.** Dois chutes podem ler o mesmo `contadorChutesGlobal` antes de qualquer um incrementar. Ambos incrementam; o valor final pode ficar correto (1000, 1001) ou incorreto (1000, 1000 com uma escrita sobrescrevendo a outra, dependendo do modelo de execução). O problema adicional é a combinação com o 409: um request incrementa e depois recebe 409 (não persiste chute); o contador já foi incrementado e já foi persistido por `saveGlobalCounter()`. Resultado: contador no banco pode estar à frente do número real de chutes em `chutes`.

### 4.3 O Gol de Ouro pode ser disparado duas vezes?

**Em instância única, na prática é mitigado pelo saldo.** O Gol de Ouro é pago junto com o crédito do goal no UPDATE de saldo. Só um request “ganha” o UPDATE por disputa de 10º. Se por bug o contador permitisse dois “1000” no mesmo momento, ainda assim dois requests teriam que passar no mesmo UPDATE de saldo para o mesmo usuário (ou dois usuários diferentes receberem o bônus do mesmo “1000”) — o fluxo atual associa o Gol de Ouro ao request que efetivamente faz o goal e atualiza o saldo, então **dois pagamentos de Gol de Ouro para o mesmo “slot” 1000** exigiriam dois requests com isGoal e isGolDeOuro e ambos passando no UPDATE; com optimistic lock no saldo, apenas um passa. O risco remanescente é **contador desalinhado** (ex.: contador 1000 e 1001 para um único chute real), podendo fazer o **próximo** Gol de Ouro disparar no número errado (ex.: 1999 em vez de 2000) ou “pular”.

### 4.4 O Gol de Ouro pode não disparar?

**Sim.** Se o contador sofrer deriva (incrementos sem chute persistido), o valor em memória pode “pular” de 999 para 1001 (dois incrementos, um chute com 409). O chute que de fato foi o 1000º não teria `contadorChutesGlobal % 1000 === 0` se o outro request incrementou antes; ou o sistema pode carregar do banco após restart um valor menor que o real (se `saveGlobalCounter` falhou antes do crash), atrasando o 1000º real. Em ambos os casos o Gol de Ouro pode não ser atribuído no momento correto.

### 4.5 Persistência e startup

- `saveGlobalCounter()` faz upsert em `metricas_globais` (id: 1) com `contador_chutes_global` e `ultimo_gol_de_ouro`. Não há retry; em erro apenas log. Se falhar, a memória fica à frente do banco.
- No startup, o servidor carrega `metricas_globais` e define `contadorChutesGlobal` e `ultimoGolDeOuro`. Lotes **não** são carregados do banco; `lotesAtivos` começa vazio. Após restart, o contador reflete o último valor persistido (possivelmente atrás do real se houve falha de escrita).

---

## 5. Análise financeira sob carga

### 5.1 Pagamento duplicado

- **Mesmo chute processado duas vezes (retry):** O cliente oficial **não envia** `X-Idempotency-Key` (verificado em `goldeouro-player/src/services/gameService.js`: apenas `direction` e `amount` no body). Se o cliente reenviar o POST por timeout/retry, o backend trata como novo chute. O segundo request debita de novo e pode persistir segundo chute → **débito duplicado** para a mesma ação do usuário. Se o segundo request disputar o mesmo “slot” (ex.: 10º) com outro e levar 409, o usuário pode ter sido debitado uma vez e recebido 409 na segunda — comportamento confuso e possível inconsistência.
- **Dois créditos para o mesmo goal:** Mitigado pelo optimistic lock no saldo: só um request por “disputa” de 10º efetiva o crédito.

### 5.2 Saldo incorreto

- **Concorrência no mesmo usuário:** Dois requests para o mesmo userId leem o mesmo `user.saldo`. O primeiro UPDATE com `novoSaldo` e `.eq('saldo', user.saldo)` passa; o segundo não encontra linha e retorna 409. Saldo permanece consistente com “um chute por request que passou”.
- **Falha entre UPDATE e INSERT:** Se o processo falhar após UPDATE e antes do INSERT, o usuário fica com saldo já debitado (ou creditado) sem registro em `chutes`. Não há transação SQL; reversão só ocorre em caminhos de erro explícitos (validateAfterShot inválido, chuteError).

### 5.3 Inconsistência entre tabela chutes e saldo

Possível quando: (a) crash entre UPDATE e INSERT; (b) retry sem idempotency (dois chutes registrados para uma ação); (c) reversão de saldo falhar em algum caminho de erro. O sistema não mantém transação atômica entre `usuarios` e `chutes`; a ordem UPDATE → INSERT e as reversões manuais reduzem, mas não eliminam, o risco.

### 5.4 Garantias transacionais

Não há transação explícita (BEGIN/COMMIT) envolvendo UPDATE em `usuarios` e INSERT em `chutes`. As operações são chamadas Supabase separadas. Em falha intermediária não há rollback automático.

### 5.5 Corrida no pagamento do prêmio

A “corrida” é resolvida pelo optimistic lock: dois requests que disputam o mesmo 10º não conseguem os dois atualizar o saldo; um recebe 409 e não credita. O risco de corrida que sobra é **retry sem idempotency** (dois processamentos do mesmo ato do usuário) e **falha entre UPDATE e INSERT** (saldo alterado, chute não registrado ou reversão não aplicada).

---

## 6. Análise de múltiplas instâncias

### 6.1 Estado do lote é compartilhado?

**Não.** `lotesAtivos` é um Map em memória por processo. Cada instância tem seu próprio conjunto de lotes. Não há Redis nem tabela de lotes no banco compartilhada entre instâncias.

### 6.2 Lotes em memória podem “quebrar” com múltiplas instâncias?

**Sim.** Com duas ou mais instâncias:

- Cada uma cria e preenche seus próprios lotes. Dois usuários na instância A podem estar no lote X; dois na instância B no lote Y. Não há “um único lote global” por valor.
- O 10º chute do lote é determinado **por instância**. Pode haver dois “10º” em duas instâncias diferentes no “mesmo” momento lógico, com dois pagamentos de R$ 5 (e possivelmente dois Gol de Ouro se o contador também for por instância).
- Após restart de uma instância, seus lotes somem; a outra continua com os dela. Estado do jogo fica fragmentado.

### 6.3 Contador global com múltiplas instâncias

Cada processo tem sua própria variável `contadorChutesGlobal`. Ambas incrementam localmente e chamam `saveGlobalCounter()`, que faz upsert em `metricas_globais` (id: 1). Resultado: **last write wins**. O valor no banco não reflete a soma dos chutes de todas as instâncias; pode estar atrás ou à frente, e cada instância pode ter um valor em memória diferente do banco e das outras. Gol de Ouro (contador % 1000) fica incorreto ou duplicado entre instâncias.

### 6.4 Risco de lote “duplicado”

Não no sentido de mesmo id em duas instâncias (o id é gerado por instância com timestamp e random). O risco é **lógica duplicada**: várias instâncias criando lotes independentes e cada uma tendo seu 10º chute e seu prêmio, com contador global inconsistente e economia quebrada.

### 6.5 Idempotência entre instâncias

`idempotencyProcessed` é um Map em memória por processo. Uma chave de idempotência processada na instância A não é vista pela instância B. O mesmo POST reenviado pode ser aceito por B se for roteado para B. Idempotência não é compartilhada entre instâncias.

**Conclusão:** O sistema **não deve ser escalado horizontalmente** (múltiplas instâncias) sem introduzir store compartilhado para lotes, contador e idempotência (ex.: Redis ou banco com locks/transações), e sem serialização ou worker único para o fluxo de chute.

---

## 7. Dependência de memória do servidor

### 7.1 Estruturas em memória

- **lotesAtivos** (Map): todos os lotes “vivos” (id, chutes[], status, winnerIndex, totalArrecadado, premioTotal, etc.). Fonte da verdade para “qual é o próximo índice no lote” e “lote completo ou não”.
- **contadorChutesGlobal**, **ultimoGolDeOuro**: contador global e último Gol de Ouro.
- **idempotencyProcessed** (Map): chaves já processadas (TTL 120s).

Nenhuma dessas estruturas é persistida de forma que o processo as reconstrua no startup. Apenas o contador (e ultimo_gol_de_ouro) é lido de `metricas_globais` na subida.

### 7.2 O sistema perde consistência após restart?

- **Contador:** Restaurado de `metricas_globais`. Se a última escrita tiver falhado ou atrasado, o valor pode estar atrás do que estava em memória antes do restart.
- **Lotes:** Não restaurados. `lotesAtivos` inicia vazio. Lotes que estavam “em andamento” deixam de existir; chutes já persistidos com aquele `lote_id` continuam no banco, mas o lote ativo em memória não existe mais. Novos chutes criam novos lotes. Não há “dois vencedores” por lote por causa disso (o 10º já foi pago antes do restart ou o lote ficou órfão com menos de 10 chutes), mas a auditoria histórica pode ver lotes incompletos.
- **Idempotência:** Map limpo. Retries após restart podem ser tratados como novos chutes.

### 7.3 Múltiplas instâncias geram divergência?

Sim. Cada instância tem seu próprio Map de lotes e seu próprio contador. Não há reconciliação; escrita em `metricas_globais` é upsert por id 1, resultando em last write wins e valor sem sentido para o sistema como um todo.

---

## 8. Comportamento sob alta carga

### 8.1 100 / 1.000 / 10.000 jogadores simultâneos

- **Lógica do lote:** Em instância única, mais concorrência aumenta a chance de dois requests lerem o mesmo `lote.chutes.length` e o mesmo `contadorChutesGlobal`. O optimistic lock no saldo mantém um único “vencedor” por disputa, mas o contador pode sofrer mais deriva (mais 409s → mais incrementos sem chute persistido). A lógica “um 10º por lote” continua respeitada em termos de pagamento; a lógica “Gol de Ouro a cada 1000 chutes” pode desviar.
- **Banco:** Muitos UPDATEs concorrentes em `usuarios` (por userId) e um único row de `metricas_globais` (id 1) atualizado a cada chute. O upsert em `metricas_globais` e os UPDATEs em `usuarios` (com condição de saldo) podem gerar contenção e aumento de 409 legítimos (concorrência) ou tempo de resposta maior. INSERTs em `chutes` são por linha; tendem a escalar melhor, mas o volume total pode pressionar conexões e disco.
- **Gargalo óbvio:** (1) **Contador e lote em memória sem lock** → mais races e deriva. (2) **metricas_globais** — uma única linha atualizada a cada chute. (3) **Conexões Supabase** — pool por processo; muitas requisições simultâneas podem esgotar ou enfileirar. (4) **Ausência de idempotency no cliente** → sob carga, timeouts e retries aumentam a chance de chutes duplicados.

### 8.2 Resumo de gargalos

| Gargalo | Descrição | Impacto em alta carga |
|--------|-----------|------------------------|
| Contador em memória | `contadorChutesGlobal++` não atômico | Deriva do contador; Gol de Ouro no momento errado |
| Índice no lote | `shotIndex = lote.chutes.length` sem lock | Dois requests podem ver mesmo índice; um leva 409 |
| metricas_globais | Upsert em uma linha a cada chute | Contenção e latência no Supabase |
| Saldo (optimistic lock) | UPDATE com .eq('saldo', user.saldo) | Muitos 409 sob concorrência; correto, mas mais retries |
| Sem idempotency no cliente | gameService não envia X-Idempotency-Key | Retries duplicam chutes/débitos |
| Lotes só em memória | Não compartilhados entre instâncias | Multi-instância inviável |

---

## 9. Classificação final do risco

### 9.1 Critérios considerados

- Consistência dos lotes (um 10º, um prêmio por lote).
- Atomicidade do contador global e correção do Gol de Ouro.
- Consistência financeira (saldo, pagamento único, coerência com chutes).
- Comportamento com múltiplas instâncias.
- Dependência de memória e efeito de restart.
- Comportamento sob alta carga (100–10k jogadores).

### 9.2 Classificação

- **Operação atual (instância única, volume controlado):** **SEGURO COM RESSALVAS.**  
  - **Seguro:** Optimistic lock no saldo evita dois créditos para o mesmo “slot”; apenas um request por disputa de 10º efetiva pagamento; reversão em falhas explícitas (validação pós-chute, erro de INSERT) preserva saldo quando o código é executado.  
  - **Ressalvas:** Contador global não atômico (deriva e risco de Gol de Ouro errado); possível inconsistência saldo vs chutes em crash entre UPDATE e INSERT; cliente não envia idempotency (retry pode duplicar); lotes perdidos no restart; GET /health expõe contador (risco de exploração).

- **Escala horizontal (múltiplas instâncias) sem alteração:** **RISCO ALTO.**  
  Lotes e contador por processo; idempotência não compartilhada; metricas_globais em last write wins; múltiplos “10º” e múltiplos Gol de Ouro entre instâncias; economia e auditoria quebradas.

### 9.3 Justificativa técnica resumida

O design atual (lotes e contador em memória, uma instância) é **consistente com a premissa operacional da V1** documentada no mapa de riscos. Dentro dessa premissa, o sistema é **operável** e **financeiramente controlado** pelo optimistic lock no saldo, com riscos **conhecidos e documentados** (contador, idempotência, transação, restart, /health). Fora dessa premissa (múltiplas instâncias ou carga muito alta sem ajustes), os riscos de inconsistência e de comportamento incorreto sob concorrência sobem para **alto**.

---

## 10. Referências no código (read-only)

| Tema | Arquivo | Trechos relevantes |
|------|---------|---------------------|
| Lotes e contador em memória | server-fly.js | 367–370 (lotesAtivos, contadorChutesGlobal), 389–434 (getOrCreateLoteByValue) |
| Fluxo do chute | server-fly.js | 1128–1392 (POST /api/games/shoot) |
| Optimistic lock saldo | server-fly.js | 1204–1267 (UPDATE usuarios .eq('saldo', user.saldo)) |
| Contador e Gol de Ouro | server-fly.js | 1220–1226, 1243–1245, 1327, 1362 |
| saveGlobalCounter | server-fly.js | 1976–1995 |
| Startup (carregar contador) | server-fly.js | 2231–2247 |
| /health (exposição contador) | server-fly.js | 2122–2149 |
| Idempotência | server-fly.js | 374–379, 1169–1177, 1374–1376 |
| Cliente (sem idempotency) | goldeouro-player/src/services/gameService.js | 89–92 (POST sem X-Idempotency-Key) |

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, infraestrutura ou arquitetura.*
