# AUDITORIA READ-ONLY — BLOCO I — ESCALABILIDADE

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco, infraestrutura ou arquitetura. Apenas análise e documentação.

---

## 1. Resumo executivo

A auditoria do **Bloco I — Escalabilidade** avaliou se o sistema Gol de Ouro permanece **consistente, seguro e financeiramente correto** sob concorrência entre jogadores, múltiplas requisições simultâneas, aumento de carga e eventual uso de múltiplas instâncias do backend.

**Conclusão:** Em **instância única** e carga moderada o sistema é **operável com ressalvas**. O saldo do usuário é protegido por **optimistic locking** (UPDATE com `.eq('saldo', user.saldo)`), evitando dois créditos para o mesmo “slot” de 10º chute e garantindo que no máximo um request por disputa efetive pagamento. Porém: **(1)** o **contador global não é atômico** — deriva possível e risco de Gol de Ouro no momento errado; **(2)** o **índice do chute no lote** (`shotIndex = lote.chutes.length`) é lido sem lock — dois requests podem ver o mesmo índice, mas só um passa no UPDATE de saldo (409 para o outro); **(3)** **lotes e contador vivem em memória** — restart perde lotes ativos; múltiplas instâncias levariam a estado fragmentado e economia quebrada; **(4)** o **cliente oficial não envia X-Idempotency-Key** — retry pode duplicar débito; **(5)** não há **transação atômica** entre UPDATE de saldo e INSERT em chutes — falha entre as duas operações pode deixar saldo alterado sem registro de chute.

**Classificação final:** **FUNCIONAL APENAS EM BAIXA ESCALA** (instância única, volume controlado). A arquitetura atual **não é segura para escala horizontal** sem mudanças estruturais.

---

## 2. Escopo e metodologia

- **Escopo:** Backend (`server-fly.js`), engine de lotes em memória, endpoint POST `/api/games/shoot`, lógica do Gol de Ouro, cálculo de prêmio, atualização de saldo, validador de integridade de lote (`utils/lote-integrity-validator.js`), persistência em Supabase (usuarios, chutes, metricas_globais), frontend (fluxo de chute em `goldeouro-player/src/services/gameService.js`).
- **Metodologia:** Leitura do código-fonte, rastreamento do fluxo de dados, identificação de estado compartilhado e pontos de concorrência, análise de atomicidade e consistência, avaliação de impacto de múltiplas instâncias e de carga (100 / 1.000 / 10.000 jogadores). Nenhum código, banco, deploy ou infraestrutura foi alterado.
- **Referências:** server-fly.js (linhas 363–434, 1128–1392, 1976–1995, 2231–2247), lote-integrity-validator.js, gameService.js, SCHEMA-CORRECAO-ESPECIFICA-FINAL.sql (chutes, metricas_globais).

---

## 3. Arquitetura atual sob perspectiva de escalabilidade

- **Frontend (React)** → chama POST `/api/games/shoot` com `direction` e `amount`; **não envia** `X-Idempotency-Key`.
- **Backend (Node.js, server-fly.js)** → um processo por instância; estado crítico em memória: `lotesAtivos` (Map), `contadorChutesGlobal`, `ultimoGolDeOuro`, `idempotencyProcessed` (Map com TTL 120s).
- **Engine de lotes** → `getOrCreateLoteByValue(amount)` itera sobre `lotesAtivos`, reutiliza lote ativo com mesmo valor e `chutes.length < config.size` ou cria novo; sem lock; V1: valor 1 → lote de 10 chutes, 10º = gol, prêmio R$ 5; Gol de Ouro a cada 1000 chutes (R$ 100).
- **Banco (Supabase/PostgreSQL)** → `usuarios` (saldo), `chutes` (registro por chute), `metricas_globais` (id 1: contador_chutes_global, ultimo_gol_de_ouro). Não há tabela de “lotes” persistida; lotes existem apenas em memória.
- **Fonte da verdade:** Para “quem é o 10º” e “lote completo” a fonte é **memória** (lote.chutes.length, lote.status). Para saldo e histórico de chutes a fonte é o **banco**. O contador é escrito no banco a cada chute (`saveGlobalCounter()`), mas o incremento é feito em memória antes; não há incremento atômico no banco.

---

## 4. Fluxo real do chute sob concorrência

Ordem no código (server-fly.js, POST `/api/games/shoot`):

1. Validação de entrada (direction, amount); V1: amount deve ser 1.
2. Se header `X-Idempotency-Key` presente e já processado no TTL → 409.
3. SELECT saldo do usuário.
4. **getOrCreateLoteByValue(betAmount)** — sem lock; dois requests podem obter o mesmo lote “ativo”.
5. **validateBeforeShot(lote, …)** — valida lote e que `lote.chutes.length < config.size`.
6. **contadorChutesGlobal++** — não atômico; dois requests podem ler o mesmo valor.
7. **await saveGlobalCounter()** — upsert em metricas_globais (id 1).
8. **shotIndex = lote.chutes.length**, **isGoal = (shotIndex === lote.winnerIndex)** — leitura sem lock; dois requests podem ver o mesmo shotIndex (ex.: 9).
9. Cálculo de prêmio (goal → R$ 5; se contador % 1000 === 0 → Gol de Ouro R$ 100).
10. **UPDATE usuarios SET saldo = novoSaldo WHERE id = userId AND saldo = user.saldo** — optimistic lock; só um request por disputa afeta uma linha; o outro recebe 409 e **não** faz push no lote nem INSERT em chutes.
11. Atualização do lote em memória (lote.chutes.push, status completed se goal).
12. validateAfterShot; em falha → reversão de saldo, pop no lote, 400.
13. INSERT em `chutes`; em erro → reversão de saldo, pop no lote, 500.
14. Resposta 200; se idempotency key presente, registro em idempotencyProcessed.

Não há mutex, lock distribuído nem fila serializada. O event loop do Node permite intercalação de requests entre awaits; a única serialização “efetiva” é a disputa pelo UPDATE de saldo (um vencedor por disputa).

---

## 5. Consistência do lote

- **Exatamente 10 chutes por lote (V1):** Em memória, o lote só recebe um chute por request que passa no UPDATE de saldo; quem recebe 409 não faz push. Assim, em instância única o número de chutes no lote permanece consistente com um chute por request que passou. O validador `validateBeforeShot` exige `lote.chutes.length < config.size`; `validateAfterShot` e validação de estrutura impedem mais de 10 chutes no mesmo objeto lote. **Risco:** não há constraint no banco que limite chutes por lote_id; a consistência é garantida apenas pela lógica em memória.
- **Exatamente 1 gol por lote:** O 10º chute (shotIndex === winnerIndex, winnerIndex = 9) é o único que recebe isGoal. Dois requests podem calcular isGoal = true para o mesmo “slot”, mas só um efetiva o crédito (optimistic lock); o outro recebe 409. **Não há dois gols no mesmo lote** em termos de pagamento.
- **Lote fechado com 9 ou 11 chutes:** Em instância única, 9 chutes ocorre apenas se um lote ficar “órfão” (ex.: restart antes do 10º) ou se um request que seria o 10º falhar após UPDATE e antes do push (cenário de crash). 11 chutes não deve ocorrer porque validateBeforeShot bloqueia quando length >= size. O risco de 9 é **lote incompleto** após restart ou falha; o de 11 é mitigado pela validação.
- **Lote travado / sobrescrito:** Não há lock; “travado” no sentido de deadlock não se aplica (não há locks). Sobrescrita do estado do lote: dois requests podem ler o mesmo estado e ambos tentarem ser o 10º; um vence no saldo e faz push; o outro recebe 409 e não altera o lote. O lote não fica “sobrescrito” de forma incorreta; fica com exatamente um chute a mais (o do vencedor).

---

## 6. Atomicidade do contador

- **Contador que define posição do chute no lote:** A “posição” no lote é `lote.chutes.length` no momento da leitura. Não é um contador global de lote no banco; é o tamanho do array em memória. **Não é atômico:** dois requests podem ler o mesmo length.
- **Contador global (contadorChutesGlobal):** Variável em memória; `contadorChutesGlobal++` não é atômico. Dois requests podem ler o mesmo valor (ex.: 999), ambos incrementar; o valor final pode ser 1000 ou 1001; além disso, um request pode incrementar e depois receber 409 (não persiste chute), mas o contador já foi incrementado e possivelmente já persistido por saveGlobalCounter(). **Consequência:** deriva do contador (memória à frente do número real de chutes persistidos) e Gol de Ouro pode disparar no número errado ou “pular”.
- **Fechamento do lote / 10º chute / Gol de Ouro:** Dependem do contador em memória e do shotIndex em memória. O 10º chute está “protegido” no sentido de **pagamento único** pelo optimistic lock no saldo; não está protegido no sentido de **contador global correto** (incremento não atômico, possível incremento sem chute persistido).
- **Persistência:** saveGlobalCounter() faz upsert em metricas_globais; não há “incremento atômico” no banco (ex.: UPDATE SET contador_chutes_global = contador_chutes_global + 1). No startup o servidor carrega contador e ultimo_gol_de_ouro do banco; lotes não são carregados.

---

## 7. Dependência de memória do servidor

- **lotesAtivos (Map):** Todos os lotes “vivos”; fonte da verdade para próximo índice no lote e para lote completo ou não. **Não persistido;** após restart o Map inicia vazio; lotes em andamento deixam de existir.
- **contadorChutesGlobal, ultimoGolDeOuro:** Em memória; persistidos em metricas_globais (id 1) a cada chute; no startup são lidos do banco. Se a última escrita falhou ou atrasou, o valor após restart pode estar atrás do que estava em memória.
- **idempotencyProcessed (Map):** Chaves já processadas (TTL 120s). **Não compartilhado entre instâncias;** após restart o Map está vazio — retries podem ser tratados como novos chutes.
- **Comportamento após restart:** Contador restaurado de metricas_globais (possivelmente atrás); lotes perdidos; novos chutes criam novos lotes; idempotência zerada.
- **Risco de perda de estado:** Lotes ativos perdidos; contador pode estar desatualizado; não há “dois vencedores” por lote por causa disso, mas lotes históricos podem aparecer incompletos e o Gol de Ouro pode desalinhar.

---

## 8. Escalabilidade horizontal

- **2, 3 ou 10 backends:** Cada processo tem seu próprio `lotesAtivos`, `contadorChutesGlobal`, `ultimoGolDeOuro`, `idempotencyProcessed`. Não há Redis nem tabela de lotes compartilhada.
- **Memória isolada por instância:** Sim; cada instância cria e preenche seus próprios lotes. Não existe “um único lote global” por valor.
- **Falta de coordenação distribuída:** Contador: cada instância incrementa localmente e chama saveGlobalCounter(); upsert em metricas_globais (id 1) → **last write wins**. O valor no banco não reflete a soma dos chutes de todas as instâncias; Gol de Ouro (contador % 1000) fica incorreto ou duplicado entre instâncias. Idempotência: chave processada na instância A não é vista na B; mesmo POST reenviado pode ser aceito por B.
- **Duplicação de lotes:** Não no sentido de mesmo id (id é gerado por instância); no sentido **lógico**: várias instâncias com lotes independentes, cada uma com seu 10º chute e seu prêmio; contador global inconsistente; economia quebrada (múltiplos “10º” e múltiplos Gol de Ouro).
- **Conclusão:** O sistema **não deve ser escalado horizontalmente** sem store compartilhado para lotes, contador e idempotência (ex.: Redis ou banco com locks/transações) e sem serialização ou worker único para o fluxo de chute.

---

## 9. Consistência financeira sob carga

- **Prêmio duplicado (dois créditos para o mesmo 10º):** Mitigado pelo optimistic lock no saldo; só um request por disputa efetiva o crédito.
- **Prêmio não pago:** Possível se o request que “venceria” (10º) efetuar UPDATE de saldo e o processo falhar antes do INSERT em chutes; não há transação; reversão não roda; usuário pode ficar debitado sem registro de chute ou, em cenário de falha após crédito, com crédito sem registro — inconsistência saldo vs chutes.
- **Divergência entre arrecadação e distribuição:** Lote em memória mantém totalArrecadado e premioTotal; não há reconciliação automática com o banco; sob falhas ou múltiplas instâncias a divergência pode crescer.
- **Inconsistência de saldo:** Concorrência no mesmo userId: optimistic lock mantém um único “vencedor” por disputa; saldo permanece consistente com um chute por request que passou. Retry sem idempotency pode gerar dois débitos para a mesma ação do usuário.
- **Gol de Ouro:** Associado ao request que efetua o goal e atualiza o saldo; dois pagamentos para o mesmo “slot” 1000 exigiriam dois requests com isGoal e isGolDeOuro ambos passando no UPDATE; com optimistic lock apenas um passa. Risco remanescente é contador desalinhado (Gol de Ouro no número errado ou “pulado”).

---

## 10. Idempotência e retries

- **Backend:** Se o cliente enviar `X-Idempotency-Key` e a chave já foi processada no TTL (120s), responde 409 e não processa de novo. Cache em memória (idempotencyProcessed); não compartilhado entre instâncias.
- **Cliente oficial (gameService.js):** Envia apenas `direction` e `amount` no POST `/api/games/shoot`; **não envia** `X-Idempotency-Key`. Clique duplo, retry automático, timeout de rede ou reenvio podem resultar no **mesmo chute processado mais de uma vez** → débito duplicado e possível segundo registro em chutes.
- **Conclusão:** O sistema **pode** processar o mesmo ato do usuário mais de uma vez se o cliente reenviar o request; idempotência é opcional e não utilizada pelo player oficial.

---

## 11. Simulação por faixa de carga

| Cenário | Jogadores | Comportamento esperado | Gargalos / Riscos |
|--------|-----------|-------------------------|-------------------|
| **A** | 100 | Operável; mais disputas pelo mesmo lote e pelo mesmo “slot” de contador; mais 409 legítimos; contador pode sofrer deriva (incrementos sem chute persistido). | Contador não atômico; metricas_globais (uma linha por chute); sem idempotency no cliente. |
| **B** | 1.000 | Contenção maior em UPDATE usuarios (por userId) e em metricas_globais (id 1); mais 409; deriva do contador e risco de Gol de Ouro desalinhado; timeouts e retries aumentam chance de chutes duplicados. | Todos os anteriores; pool de conexões Supabase; rate limit (100 req/15 min por IP). |
| **C** | 10.000 | Limites da arquitetura: contador e lote em memória sem lock; uma linha de metricas_globais atualizada a cada chute; ausência de idempotency; risco alto de inconsistência e de experiência ruim (muitos 409, timeouts, possíveis duplicidades). | Arquitetura não desenhada para esse volume sem filas, workers e contador/lotes no banco ou em store compartilhado. |

---

## 12. Race conditions identificadas

1. **Dois requests leem o mesmo lote.chutes.length (ex.: 9)** → ambos calculam isGoal = true; ambos tentam UPDATE de saldo; um passa, outro 409; apenas um push e um INSERT. **Efeito:** um vencedor; o outro recebe 409 (correto).
2. **Dois requests leem o mesmo contadorChutesGlobal (ex.: 999)** → ambos incrementam; um pode receber 409 depois; contador já incrementado e possivelmente persistido. **Efeito:** deriva do contador; Gol de Ouro pode disparar no número errado ou não disparar.
3. **getOrCreateLoteByValue:** Dois requests podem obter o mesmo lote “ativo” (nenhum lock na iteração/criação); a disputa é resolvida depois no UPDATE de saldo.
4. **saveGlobalCounter():** Escrita não atômica com o incremento em memória; múltiplas instâncias → last write wins em metricas_globais.
5. **UPDATE saldo seguido de INSERT chutes:** Sem transação; crash entre os dois pode deixar saldo alterado sem registro de chute (ou crédito sem registro).
6. **Retry sem idempotency:** Dois processamentos do mesmo ato do usuário → dois débitos e dois registros em chutes.

---

## 13. Principais riscos estruturais

| Risco | Descrição | Mitigação atual |
|-------|-----------|-----------------|
| Contador não atômico | contadorChutesGlobal++ e persistência separada; deriva e Gol de Ouro incorreto | Nenhuma (apenas instância única reduz probabilidade). |
| Índice do chute sem lock | shotIndex = lote.chutes.length; dois requests podem ver o mesmo índice | Optimistic lock no saldo garante um único pagamento por disputa. |
| Lotes só em memória | Restart perde lotes; múltiplas instâncias fragmentam estado | Operação prevista: instância única. |
| Sem transação UPDATE+INSERT | Falha entre UPDATE saldo e INSERT chutes → inconsistência | Reversão manual em caminhos de erro explícitos; não cobre crash. |
| Cliente sem idempotency | Retry/duplo clique pode duplicar chute | Backend suporta X-Idempotency-Key mas o player não envia. |
| Múltiplas instâncias | Lotes e contador por processo; idempotência não compartilhada | Arquitetura atual não suporta; não usar sem redesign. |
| metricas_globais | Uma linha (id 1) atualizada a cada chute | Contenção e latência sob alta carga. |

---

## 14. Limites atuais de crescimento

- **Instância única:** Limite prático imposto por contenção no banco (metricas_globais, UPDATE em usuarios), por deriva do contador e por ausência de idempotency no cliente. Volume “moderado” (centenas de chutes/minuto) é o cenário onde os riscos permanecem contidos.
- **Escala horizontal:** Inviável sem store compartilhado para lotes, contador atômico (ex.: banco ou Redis) e idempotência compartilhada.
- **Alta carga (milhares de jogadores simultâneos):** Arquitetura não desenhada para; gargalos em memória (contador, lote), em metricas_globais e em conexões; risco alto de inconsistência e má experiência.

---

## 15. Classificação final do BLOCO I

**FUNCIONAL APENAS EM BAIXA ESCALA**

- O sistema é **consistente e financeiramente controlado** em **instância única** e **carga moderada** graças ao optimistic lock no saldo (um único vencedor por disputa de 10º, um único crédito por disputa).
- **Não** é “Escalável com segurança”: contador não atômico, sem transação UPDATE+INSERT, dependência forte de memória, cliente sem idempotency.
- **Não** é “Escalável com ressalvas” no sentido horizontal: múltiplas instâncias quebram lotes e contador; idempotência não compartilhada.
- **Não** foi classificado como “Arquitetura insegura para escala” porque, dentro da premissa operacional documentada (instância única, volume controlado), o desenho é operável e os riscos são conhecidos e mitigados em parte (optimistic lock, validações, reversões em erro).
- **Funcional apenas em baixa escala** reflete: adequado para a operação atual (uma instância, carga limitada); inadequado para escalar horizontalmente ou para carga muito alta sem alterações estruturais.

---

## 16. Conclusão técnica

A auditoria confirmou que o **fluxo de chute** depende criticamente de **estado em memória** (lotes e contador) e de **optimistic locking** no saldo para evitar dois prêmios por disputa. Em instância única e carga controlada, o sistema mantém **um 10º chute e um prêmio por lote** e evita **dois gols no mesmo lote** em termos de pagamento. Os principais pontos fracos são: **atomicidade do contador global** (deriva e Gol de Ouro incorreto), **falta de transação** entre atualização de saldo e registro do chute, **não uso de idempotency pelo cliente** e **inviabilidade de múltiplas instâncias** sem redesign. A economia do jogo permanece **correta sob carga** no sentido de “um pagamento por 10º chute” e “um Gol de Ouro por slot de 1000”, desde que se aceite a possibilidade de deriva do contador e de Gol de Ouro no número errado sob concorrência alta. O **maior risco oculto de escalabilidade** é assumir que o sistema pode rodar com várias instâncias ou com carga muito alta sem mudanças: lotes e contador por processo e idempotência em memória tornam esse cenário inseguro.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, deploy, infraestrutura ou arquitetura.*
