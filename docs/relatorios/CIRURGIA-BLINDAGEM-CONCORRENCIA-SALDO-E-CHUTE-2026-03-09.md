# CIRURGIA — BLINDAGEM DE CONCORRÊNCIA DE SALDO E CHUTE

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Cirúrgico, mínimo e controlado.  
**Referência:** AUDITORIA-CONCORRENCIA-CHUTES-E-SALDO-READONLY-2026-03-09.md

---

## 1. Problema identificado

A auditoria de concorrência confirmou:

- **Lost update em saldo:** Dois chutes (ou chute + depósito/saque) podiam ler o mesmo saldo e o segundo UPDATE sobrescrever o primeiro.
- **Retry/replay:** Sem idempotência, reenvio do mesmo request gerava segundo INSERT em `chutes` e segundo ou incorreto UPDATE de saldo.
- **Ordem das operações:** INSERT em `chutes` antes do UPDATE em `usuarios`; em caso de falha no INSERT o saldo já podia ter sido alterado em outro request, e não havia reversão consistente.
- **Ausência de proteção:** Nenhum optimistic locking, idempotency key nem reversão de saldo em falha de persistência.

Diagnóstico oficial: **RISCO CONCORRENTE MODERADO**.

---

## 2. Estratégia adotada

- **Saldo (Prioridade 1):** **Optimistic locking** — UPDATE somente se o saldo atual for igual ao lido no início do request (`.eq('saldo', user.saldo)`). Se nenhuma linha for atualizada, retornar **409** "Saldo insuficiente ou alterado. Tente novamente." Assim, dois requests que leiam o mesmo saldo não conseguem ambos aplicar o débito; o segundo falha de forma controlada.
- **Retry/replay (Prioridade 2):** **Idempotency key** — header opcional `X-Idempotency-Key`. Chaves processadas com sucesso são guardadas em memória com TTL de 120 segundos; requisição repetida com a mesma chave retorna **409** "Chute já processado com esta chave de idempotência."
- **Atomicidade prática (Prioridade 3):** **Ordem invertida** — primeiro **UPDATE de saldo** (com optimistic lock); só depois **push no lote**, validação pós-chute e **INSERT em chutes**. Se o INSERT ou a validação pós-chute falhar, o saldo é **revertido** (UPDATE de volta para `user.saldo`) e o lote em memória é desfeito (pop e restauração de status se goal). Assim reduz-se o estado parcial “débito sem registro de chute”.

---

## 3. Arquivos alterados

| Arquivo | Alterações |
|---------|------------|
| **server-fly.js** | (1) Mapa `idempotencyProcessed` e intervalo de limpeza (TTL 120s). (2) Checagem de `X-Idempotency-Key` no início do handler; 409 se chave já processada. (3) Cálculo de `novoSaldo` após definir isGoal/premio; UPDATE em `usuarios` com `.eq('saldo', user.saldo)` e `.select('saldo').single()`; 409 se nenhuma linha atualizada. (4) Definição de `lote.status`/`lote.ativo` para goal após o UPDATE de saldo; push e INSERT em seguida. (5) Em falha de `validateAfterShot` ou de INSERT em `chutes`: reversão de saldo (UPDATE para `user.saldo`), rollback do lote em memória, retorno 400 ou 500. (6) Em sucesso: `shootResult.novoSaldo = saldoAposUpdate`; gravação da idempotency key no mapa. |

Nenhum outro arquivo foi modificado (frontend, engine, PIX, saque, schema).

---

## 4. Correções aplicadas no saldo

- **Antes:** SELECT saldo → (vários passos) → cálculo `novoSaldo = user.saldo - betAmount` ou `+ premio + premioGolDeOuro` → UPDATE `usuarios` SET saldo = novoSaldo WHERE id = userId. Qualquer request concorrente podia ler o mesmo saldo e o último UPDATE prevalecia (lost update).
- **Depois:** Mantida a leitura inicial para validação (saldo >= betAmount). Após definir resultado e prêmios, é calculado `novoSaldo`. O UPDATE passa a ser **condicional**:  
  `update({ saldo: novoSaldo }).eq('id', userId).eq('saldo', user.saldo).select('saldo').single()`.  
  Só atualiza se o saldo atual no banco for igual ao que foi lido (`user.saldo`). Se nenhuma linha for atualizada (resposta vazia ou erro), o handler retorna **409** e **não** avança o lote nem insere em `chutes`. Assim, o segundo de dois requests simultâneos que tenham lido o mesmo saldo falha com 409 em vez de sobrescrever o primeiro (redução forte de lost update).
- **Compatibilidade com depósito/saque:** Outros fluxos que alteram saldo (webhook, reconciliação, worker de saque) continuam com read-modify-write. O chute deixa de “vencer” cegamente a corrida: se o saldo tiver sido alterado entre a leitura e o UPDATE do chute, o chute recebe 409 e o cliente pode tentar de novo. Não se introduz lock global; a blindagem é apenas no endpoint de chute.

---

## 5. Correções aplicadas contra replay/retry

- **Mecanismo:** Cache em memória `idempotencyProcessed` (Map): chave = valor do header `X-Idempotency-Key` (trim), valor = `{ ts }`. TTL 120 segundos; a cada 60 segundos remove entradas expiradas.
- **Fluxo:** Se o cliente envia `X-Idempotency-Key` e essa chave já consta no mapa com timestamp dentro da janela, o handler responde **409** com a mensagem “Chute já processado com esta chave de idempotência. Use outra chave ou aguarde antes de reenviar.” e **não** processa o chute. Após processamento com sucesso (resposta 200), a chave é armazenada no mapa.
- **Alcance:** A proteção só existe quando o cliente envia o header. Recomenda-se que o frontend (ou clientes da API) gerem uma chave por “ação de chute” (ex.: uuid) e a enviem no retry; assim evita-se duplicar chute e débito em caso de timeout/replay.
- **Limitação:** O cache é por instância do backend; em múltiplas instâncias, a mesma chave em instâncias diferentes pode ser aceita duas vezes. Melhoria futura: armazenar chaves em Redis ou em banco com TTL.

---

## 6. Impacto na ordem das operações

- **Antes:** Validação → lote → shotIndex/isGoal/premio → push no lote → validateAfterShot → INSERT em `chutes` → UPDATE em `usuarios` (saldo). Risco: INSERT ok e UPDATE falhar (ou concorrência) → chute registrado com saldo inconsistente; ou UPDATE ok e INSERT falhar → débito sem chute.
- **Depois:** Validação → lote → shotIndex/isGoal/premio → **UPDATE saldo (optimistic lock)** → se 409, fim (não avança lote) → definição de status do lote se goal → push → validateAfterShot → INSERT em `chutes`. Se validateAfterShot ou INSERT falhar: **reversão de saldo** (UPDATE para `user.saldo`) + rollback do lote em memória + 400 ou 500.
- **Efeito:** (1) Só avançamos o lote e inserimos chute depois de “reservar” o saldo com sucesso. (2) Dois requests concorrentes: o segundo falha em 409 e não insere. (3) Falha após o UPDATE mas antes do INSERT: revertemos o saldo e desfazemos o lote, reduzindo estado parcial (débito sem chute). (4) Não há transação SQL única (INSERT + UPDATE no mesmo COMMIT); a atomicidade é “prática” por ordem e compensação.

---

## 7. Compatibilidade com a engine V1

- **Preservado:** Valor R$ 1; 10 chutes por lote; 1º ao 9º miss, 10º goal; mesmo jogador pode repetir; prêmio base R$ 5; Gol de Ouro; formação e fechamento do lote; `getOrCreateLoteByValue`, `shotIndex`, `winnerIndex`, `validateBeforeShot`/`validateAfterShot`; contrato da API (body, resposta 200 com `data.result`, `data.novoSaldo`, etc.).
- **Alterado apenas:** Momento e condição do UPDATE de saldo (antes do push/INSERT; com optimistic lock); resposta 409 em conflito de saldo ou idempotência; reversão de saldo em falha de validação ou INSERT. Nenhuma mudança de regra de produto.

---

## 8. Limitações remanescentes

- **Transação única:** INSERT em `chutes` e UPDATE em `usuarios` continuam sendo duas operações; em falha de rede após o UPDATE e antes do INSERT, a reversão depende do handler executar o UPDATE de volta. Não há transação BEGIN/COMMIT no banco.
- **Idempotência multi-instância:** O cache de idempotency key é por processo; com várias instâncias, a mesma chave em instâncias diferentes pode ser aceita mais de uma vez. Solução futura: store compartilhado (Redis ou tabela com UNIQUE + TTL).
- **Depósito/saque:** Esses fluxos não foram alterados; continuam com read-modify-write. A blindagem do chute reduz a chance de o chute “sobrescrever” um depósito (o chute falha com 409 se o saldo tiver mudado), mas o depósito/saque não usam optimistic lock; melhorias futuras podem estender o padrão.
- **Multi-instância e lote:** Lotes e contador global continuam em memória por processo; múltiplas instâncias ainda implicam lotes duplicados e contador não centralizado (documentado no encerramento do BLOCO E e na auditoria de concorrência).

---

## 9. Diagnóstico final

**Classificação:** **CONCORRÊNCIA BLINDADA COM RESSALVAS**

- **Blindagem de saldo:** Optimistic locking implementado; dois chutes simultâneos com o mesmo saldo não conseguem ambos aplicar o débito; o segundo recebe 409. Lost update no endpoint de chute é fortemente reduzido.
- **Proteção contra retry:** Idempotency key opcional implementada; quando usada, evita reprocessar o mesmo chute na mesma instância na janela de 120s. Ressalva: depende do cliente enviar o header e não cobre multi-instância.
- **Ordem e reversão:** UPDATE antes de INSERT; reversão de saldo em falha de validação ou INSERT; redução de estado parcial.
- **Ressalvas:** Idempotência não compartilhada entre instâncias; ausência de transação única no banco; depósito/saque não blindados neste escopo.

---

## 10. Conclusão objetiva

O **principal risco concorrente do gameplay** (lost update em saldo e dois chutes consumindo o mesmo saldo) foi **reduzido com sucesso** no endpoint POST /api/games/shoot: o UPDATE de saldo passou a ser condicional ao valor lido (optimistic lock) e a ordem das operações foi alterada para reservar saldo antes de avançar o lote e persistir o chute, com reversão em caso de falha. A proteção contra replay/retry foi introduzida de forma opcional via `X-Idempotency-Key`. A regra oficial da V1 foi preservada. Limitações remanescentes (transação única, idempotência multi-instância, outros fluxos financeiros) ficam como melhorias futuras.

---

*Cirurgia aplicada em 2026-03-09. Apenas server-fly.js foi modificado.*
