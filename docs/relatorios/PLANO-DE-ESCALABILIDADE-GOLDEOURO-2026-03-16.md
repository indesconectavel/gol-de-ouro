# PLANO DE ESCALABILIDADE SEGURA DO GOL DE OURO (BLOCO I.1)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco ou arquitetura. Apenas análise e planejamento técnico.

**Contexto:** Este documento é o plano técnico decorrente da auditoria BLOCO I — Escalabilidade, cuja classificação final foi **FUNCIONAL APENAS EM BAIXA ESCALA**. O objetivo é descrever **o que precisa mudar** para que o sistema possa crescer sem quebrar a economia do jogo.

---

## 1. Situação atual da arquitetura

### Resumo da arquitetura V1

- **Frontend (React, goldeouro-player):** Tela oficial do jogo em `/game` (componente GameFinal). O `gameService.js` envia POST `/api/games/shoot` com `direction` e `amount`; **não envia** `X-Idempotency-Key`.
- **Backend (Node.js, server-fly.js):** Um processo por instância. Estado crítico **em memória**: `lotesAtivos` (Map de lotes ativos), `contadorChutesGlobal`, `ultimoGolDeOuro`, `idempotencyProcessed` (Map com TTL 120s).
- **Engine de lotes:** Função `getOrCreateLoteByValue(amount)` itera sobre `lotesAtivos`, reutiliza lote ativo com mesmo valor e `chutes.length < config.size` ou cria novo. Sem lock. V1: valor 1 → lote de 10 chutes; 10º chute = gol (prêmio R$ 5); Gol de Ouro a cada 1000 chutes (R$ 100).
- **Banco (Supabase/PostgreSQL):** Tabelas `usuarios` (saldo), `chutes` (um registro por chute: usuario_id, lote_id, resultado, premio, contador_global, etc.), `metricas_globais` (uma linha, id 1: contador_chutes_global, ultimo_gol_de_ouro). **Não existe tabela de lotes** persistida; lotes existem apenas em memória.
- **Fluxo do chute:** Validação → leitura de saldo → getOrCreateLoteByValue → validateBeforeShot → `contadorChutesGlobal++` → saveGlobalCounter() → cálculo de shotIndex/isGoal/prêmio → **UPDATE usuarios (optimistic lock: WHERE saldo = user.saldo)** → atualização do lote em memória (push) → validateAfterShot → INSERT em `chutes` → resposta. Não há transação entre UPDATE e INSERT; não há lock/mutex no lote nem no contador.
- **Fonte da verdade:** Para “quem é o 10º” e “lote completo” → **memória**. Para saldo e histórico de chutes → **banco**. O contador é escrito no banco a cada chute, mas o incremento é feito em memória; não há incremento atômico no banco.

---

## 2. Principais limitações de escala

| Limitação | Descrição |
|-----------|-----------|
| Estado crítico em memória | Lotes e contador global vivem no processo; não compartilhados entre instâncias. |
| Contador não atômico | `contadorChutesGlobal++` e persistência separada; deriva e Gol de Ouro incorreto sob concorrência. |
| Sem transação saldo + chute | UPDATE em usuarios e INSERT em chutes são operações separadas; falha entre elas gera inconsistência. |
| Cliente sem idempotency | Retry/duplo clique pode gerar dois débitos e dois registros para a mesma ação. |
| Múltiplas instâncias inviáveis | Cada instância tem seus próprios lotes e contador; metricas_globais em last write wins; economia quebrada. |
| Restart perde lotes | Lotes ativos não são persistidos; após restart o Map inicia vazio. |
| Idempotência em memória | idempotencyProcessed não é compartilhado entre instâncias; restart zera o cache. |

---

## 3. Bloqueadores técnicos de escala

Itens que **precisam mudar** antes de escalar (horizontalmente ou sob carga alta). Classificação: 🔴 **BLOQUEADOR DE ESCALA**.

| # | Bloqueador | Onde | Impacto se não corrigido |
|---|------------|------|---------------------------|
| 1 | **Lotes apenas em memória** | server-fly.js: `lotesAtivos` (Map) | Com 2+ instâncias, cada uma tem seus lotes; múltiplos “10º” e múltiplos prêmios; economia quebrada. |
| 2 | **Contador global não atômico** | server-fly.js: `contadorChutesGlobal++`, saveGlobalCounter() | Deriva do contador; Gol de Ouro no número errado ou duplicado entre instâncias; last write wins em metricas_globais. |
| 3 | **Ausência de store compartilhado para lotes e contador** | Arquitetura | Múltiplas instâncias não têm como coordenar “um lote global” nem “um contador global”. |
| 4 | **Idempotência não compartilhada** | server-fly.js: idempotencyProcessed (Map em memória) | Mesmo POST reenviado pode ser aceito por outra instância; débito/chute duplicado. |
| 5 | **Sem transação entre UPDATE saldo e INSERT chutes** | server-fly.js: fluxo do shoot | Crash entre as duas operações deixa saldo alterado sem registro de chute (ou crédito sem registro) → inconsistência contábil. |

**O que pode permanecer como está (na premissa instância única):** O optimistic lock no saldo (.eq('saldo', user.saldo)) **impede dois pagamentos para o mesmo 10º chute** e está correto; a validação de integridade do lote (validateBeforeShot / validateAfterShot) e as reversões manuais em erro são adequadas para instância única. Esses mecanismos não precisam ser removidos; precisam ser **complementados** por atomicidade de contador, persistência de lotes e transação quando se escalar.

---

## 4. Riscos de inconsistência financeira

Situações que podem gerar **pagamento duplicado**, **saldo incorreto** ou **divergência econômica**. Classificação por severidade.

### 4.1 Pagamento duplicado

| Situação | Classificação | Descrição |
|----------|----------------|-----------|
| Dois créditos para o mesmo 10º chute | 🟢 **OK** (mitigado) | Optimistic lock no saldo garante que só um request por disputa efetive o crédito. |
| Mesmo chute processado duas vezes (retry sem idempotency) | 🟠 **RISCO ALTO** | Cliente não envia X-Idempotency-Key; reenvio pode debitar duas vezes e registrar dois chutes. |
| Dois Gol de Ouro para o mesmo “slot” 1000 (multi-instância) | 🔴 **BLOQUEADOR** | Com 2+ instâncias, cada uma pode considerar seu chute como o 1000º; contador em last write wins. |

### 4.2 Saldo incorreto

| Situação | Classificação | Descrição |
|----------|----------------|-----------|
| Concorrência no mesmo usuário (dois chutes simultâneos) | 🟢 **OK** (mitigado) | Optimistic lock faz o segundo request receber 409; saldo permanece consistente. |
| Crash após UPDATE e antes do INSERT | 🟠 **RISCO ALTO** | Saldo já alterado; chute não registrado; reversão não roda (não há transação). |
| Retry duplicando débito | 🟠 **RISCO ALTO** | Usuário pode ser debitado duas vezes para uma única ação (clique/retry). |

### 4.3 Divergência econômica

| Situação | Classificação | Descrição |
|----------|----------------|-----------|
| Arrecadação vs distribuição (lote em memória) | 🟡 **MELHORIA RECOMENDADA** | totalArrecadado e premioTotal no lote não são reconciliados automaticamente com o banco; sob falhas pode haver divergência. |
| Contador à frente do número real de chutes | 🟠 **RISCO ALTO** | Incremento sem chute persistido (ex.: request que recebe 409 já incrementou); Gol de Ouro pode “pular” ou disparar no número errado. |

---

## 5. Problemas de concorrência

Race conditions e disputas simultâneas. Classificação.

| Problema | Classificação | Descrição |
|----------|----------------|-----------|
| Dois requests leem o mesmo `lote.chutes.length` (ex.: 9) e ambos calculam isGoal = true | 🟢 **OK** (resolvido) | Optimistic lock no saldo faz só um passar; o outro recebe 409 e não faz push nem INSERT. |
| Dois requests leem o mesmo `contadorChutesGlobal` antes de incrementar | 🟠 **RISCO ALTO** | Contador pode derivar; um request pode incrementar e depois receber 409 (contador já incrementado/persistido). |
| getOrCreateLoteByValue sem lock | 🟡 **MELHORIA RECOMENDADA** | Dois requests podem obter o mesmo lote; a disputa é resolvida no UPDATE de saldo, mas serialização explícita por lote reduziria 409 e tornaria o comportamento mais previsível. |
| saveGlobalCounter() não atômico com o incremento | 🔴 **BLOQUEADOR** (para escala) | Em multi-instância vira last write wins; em single-instância gera deriva quando há 409. |
| Retry sem idempotency | 🟠 **RISCO ALTO** | Dois processamentos do mesmo ato → dois débitos e dois registros. |

---

## 6. Dependência de memória

Impacto do estado em memória no sistema.

| Estrutura | Persistida? | Compartilhada entre instâncias? | Impacto |
|-----------|-------------|----------------------------------|---------|
| **lotesAtivos** | Não | Não | Restart perde lotes ativos; múltiplas instâncias = lotes diferentes por processo. Bloqueador para escala horizontal. |
| **contadorChutesGlobal** | Sim (metricas_globais), mas escrita não atômica | Não (cada processo incrementa local e escreve) | Deriva; last write wins em multi-instância. Bloqueador. |
| **ultimoGolDeOuro** | Sim (metricas_globais) | Não | Mesmo problema que o contador. |
| **idempotencyProcessed** | Não | Não | Retry após restart ou em outra instância pode duplicar chute. Bloqueador para escala horizontal; risco alto para retry em single. |

**Conclusão:** A dependência de memória é **bloqueador** para escala horizontal e **risco alto** para consistência do contador e do Gol de Ouro mesmo em instância única sob carga. Para crescer, lotes e contador precisam ter fonte da verdade no banco (ou em store compartilhado como Redis) com operações atômicas.

---

## 7. Escala horizontal

Avaliação: **múltiplas instâncias seriam possíveis hoje?**

**Não.** Com 2 ou mais backends:

- Cada processo tem seu próprio `lotesAtivos` → não existe “um único lote” por valor; cada instância pode ter seu próprio “10º chute” e pagar prêmio.
- Cada processo incrementa seu `contadorChutesGlobal` e chama `saveGlobalCounter()` → upsert em `metricas_globais` (id 1) → **last write wins**; o valor no banco não reflete a soma dos chutes; Gol de Ouro (contador % 1000) fica incorreto ou duplicado.
- `idempotencyProcessed` é por processo → mesma chave pode ser aceita em outra instância.

**O que precisaria existir para escala horizontal:**

- **Lotes** persistidos ou em store compartilhado (ex.: tabela `lotes` no banco com contador de chutes atômico por lote, ou Redis).
- **Contador global** com incremento atômico (ex.: `UPDATE metricas_globais SET contador_chutes_global = contador_chutes_global + 1 RETURNING contador_chutes_global`, ou Redis INCR).
- **Idempotência** em store compartilhado (ex.: tabela ou Redis com chave e TTL).
- **Transação** ou sequência atômica (saldo + chute + contador/lote) para evitar estado parcial em falha.

Sem essas mudanças, múltiplas instâncias **quebram** a lógica de lotes e a economia do jogo.

---

## 8. Arquitetura recomendada para escalar

Descrição de **como deveria ser** uma arquitetura escalável para o Gol de Ouro, **sem alterar o sistema atual** (apenas planejamento).

### 8.1 Fonte da verdade no banco (ou store compartilhado)

- **Lotes:** Tabela `lotes` no banco (ou estrutura equivalente em Redis) com: id, valor_aposta, status (active/completed), contador_chutes (inteiro), tamanho_max (ex.: 10), created_at, etc. “Próximo índice no lote” = contador_chutes + 1; “10º chute” = contador_chutes + 1 === tamanho_max. Inserção de chute no lote = **UPDATE lotes SET contador_chutes = contador_chutes + 1 WHERE id = ? AND status = 'active' AND contador_chutes < tamanho_max RETURNING contador_chutes** (ou equivalente atômico). Quem conseguir a linha atualizada é o dono da posição.
- **Contador global:** Incremento atômico no banco (ex.: `UPDATE metricas_globais SET contador_chutes_global = contador_chutes_global + 1 WHERE id = 1 RETURNING contador_chutes_global`). Gol de Ouro = valor retornado % 1000 === 0. Nenhum incremento em memória antes da persistência.
- **Idempotência:** Tabela `idempotency_keys` (idempotency_key PK, user_id, created_at, resultado resumido opcional) ou Redis SET com TTL. Todas as instâncias consultam o mesmo store antes de processar o chute.

### 8.2 Fluxo do chute serializado por recurso

- Obter ou criar lote no **banco** (SELECT lote ativo por valor OU INSERT novo lote com status active).
- **Transação** (ou procedimento armazenado):  
  (a) Checar idempotency (se key presente).  
  (b) SELECT saldo do usuário.  
  (c) Reservar posição no lote (UPDATE lotes SET contador_chutes = contador_chutes + 1 ... RETURNING contador_chutes).  
  (d) Incrementar contador global atômico (UPDATE metricas_globais ... RETURNING contador_chutes_global).  
  (e) Calcular isGoal (contador_chutes retornado === tamanho_max), isGolDeOuro (contador_global % 1000 === 0), prêmio.  
  (f) UPDATE usuarios SET saldo = saldo - valor + premio WHERE id = ? AND saldo >= valor (ou com versão).  
  (g) INSERT em chutes (lote_id, usuario_id, shot_index, resultado, premio, contador_global, ...).  
  (h) Se lote completou, UPDATE lotes SET status = 'completed'.  
  (i) Se idempotency key presente, INSERT em idempotency_keys.  
  COMMIT. Em falha, ROLLBACK.

- Assim, **uma única transação** garante: um débito/crédito por chute, um registro por chute, contador e lote consistentes, e idempotência consultada/registrada no mesmo store por todas as instâncias.

### 8.3 Cliente

- Enviar **X-Idempotency-Key** em todo POST `/api/games/shoot` (ex.: hash de userId + timestamp do clique ou UUID por tentativa). Backend rejeita (409) se a chave já foi processada.

### 8.4 Múltiplas instâncias

- Com lotes e contador no banco (ou Redis) com operações atômicas, e idempotência compartilhada, várias instâncias podem processar chutes concorrentes; a disputa pelo “10º” e pelo “1000º” é resolvida no banco (UPDATE com condição), não em memória. Load balancer pode distribuir requests entre instâncias.

---

## 9. Caminho de evolução

### Curto prazo (ajustes mínimos)

- **Cliente:** Passar a enviar **X-Idempotency-Key** em todo POST de chute (ex.: UUID por tentativa ou hash de userId + timestamp). Reduz débito duplicado por retry/clique duplo. 🟠 → 🟢
- **Backend:** Manter suporte a X-Idempotency-Key (já existe); opcionalmente aumentar TTL ou documentar uso obrigatório pelo app. 🟡
- **Operacional:** Manter **uma única instância** e carga controlada; monitorar 409 e erros entre UPDATE e INSERT para detectar inconsistências. 🟢

Não exige mudança de banco nem de engine de lotes; melhora robustez em instância única.

### Médio prazo (mudanças estruturais)

- **Contador global atômico:** Trocar `contadorChutesGlobal++` + saveGlobalCounter() por **um** UPDATE atômico no banco (ex.: `UPDATE metricas_globais SET contador_chutes_global = contador_chutes_global + 1 WHERE id = 1 RETURNING contador_chutes_global, ultimo_gol_de_ouro`). Usar o valor retornado para decidir isGolDeOuro e para gravar em chutes. Elimina deriva do contador em single-instância. 🔴 → 🟢
- **Transação saldo + chute:** Envolver UPDATE em usuarios e INSERT em chutes em transação (BEGIN/COMMIT no Supabase ou stored procedure). Em falha, rollback. Reduz risco de saldo alterado sem registro. 🟠 → 🟢
- **Persistir lotes:** Criar tabela `lotes` e passar a “obter/criar lote” e “reservar posição no lote” via UPDATE atômico no banco (contador_chutes por lote). Remover ou reduzir dependência de `lotesAtivos` em memória; permite restaurar estado após restart e prepara escala horizontal. 🔴
- **Idempotência em banco (ou Redis):** Persistir idempotency keys em tabela ou Redis compartilhado; todas as instâncias consultam o mesmo store. Necessário para múltiplas instâncias. 🔴

### Longo prazo (arquitetura ideal)

- **Lotes e contador 100% no banco (ou Redis):** Nenhum estado crítico de jogo em memória do app; “próximo índice” e “10º chute” e “1000º chute” decididos por operações atômicas no store compartilhado.
- **Fluxo do chute em uma transação (ou sequência atômica):** Idempotência + reserva de posição no lote + incremento do contador global + débito/crédito de saldo + INSERT em chutes + atualização de status do lote, tudo em uma transação ou com compensação em falha.
- **Cliente sempre com idempotency key** e tratamento de 409 (retry com mesma key = não reenviar; nova tentativa = nova key).
- **Múltiplas instâncias** atrás de load balancer; pool de conexões e rate limits ajustados; monitoramento de consistência (reconciliação periódica saldo vs chutes, contador vs COUNT(chutes)).

---

## 10. Classificação final da arquitetura

**NÃO ESCALÁVEL NA FORMA ATUAL**

- **Escalável:** Não. Estado crítico (lotes, contador, idempotência) em memória por processo; múltiplas instâncias quebram a economia; contador não atômico; sem transação entre saldo e chute.
- **Escalável com ajustes:** Sim, **após** as mudanças de médio e longo prazo (contador atômico, transação, lotes e idempotência no banco/store compartilhado, cliente com idempotency key). O plano acima descreve o caminho.
- **Não escalável na forma atual:** Reflete a realidade hoje: a arquitetura V1 é **funcional apenas em baixa escala** (instância única, carga controlada). Para “escalar com segurança”, é necessário seguir o plano de evolução (curto → médio → longo prazo) sem alterar o sistema neste documento — apenas planejamento.

**Resumo:**

| Pergunta | Resposta |
|----------|----------|
| O que impede o sistema de escalar hoje? | Lotes e contador em memória; contador não atômico; idempotência não compartilhada; ausência de transação saldo+chute. |
| O que pode causar prejuízo financeiro em escala? | Retry sem idempotency (débito duplicado); multi-instância (múltiplos prêmios e Gol de Ouro); crash entre UPDATE e INSERT (saldo inconsistente). |
| O que precisa ser corrigido antes de crescimento real? | Contador atômico; transação; persistência de lotes e idempotência compartilhada; cliente com idempotency key. |
| O que pode esperar para versão futura? | Reconciliação automática arrecadação/distribuição; serialização explícita por lote (lock por lote) para reduzir 409; otimizações de throughput. |
| O que deve permanecer como está? | Optimistic lock no saldo (ou equivalente em transação); validação de integridade do lote; regras de prêmio (R$ 5, Gol de Ouro R$ 100 a cada 1000). |

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, deploy ou arquitetura. Apenas análise e planejamento técnico.*
