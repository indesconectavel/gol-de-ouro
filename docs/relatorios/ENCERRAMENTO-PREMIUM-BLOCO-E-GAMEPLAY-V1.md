# ENCERRAMENTO PREMIUM — BLOCO E — GAMEPLAY V1

**Projeto:** Gol de Ouro  
**Bloco:** E — Gameplay  
**Data:** 2026-03-09  
**Modo:** READ-ONLY ABSOLUTO — documentação definitiva. Nenhuma alteração de código, banco ou deploy.  
**Classificação:** ENGINE V1 VALIDADA PARA OPERAÇÃO CONTROLADA EM INSTÂNCIA ÚNICA

---

## 1. Resumo executivo

O **BLOCO E — Gameplay** compreende a engine do jogo (lotes, chutes, resultado goal/miss), a regra oficial da V1 (R$ 1, 10 chutes, gol no 10º, prêmio R$ 5, Gol de Ouro, mesmo jogador pode repetir), o fluxo financeiro (débito do perdedor e crédito do vencedor no backend) e as blindagens de concorrência (optimistic locking de saldo, idempotency key opcional, ordem UPDATE→INSERT e reversão em falha).  

Este documento registra o **estado real da engine**, as **regras oficiais da V1**, a **arquitetura utilizada**, as **blindagens existentes**, os **limites operacionais**, os **riscos aceitos** e o **caminho natural para V2**. Serve como registro técnico, base para auditorias futuras, proteção contra regressões e referência para novos desenvolvedores.  

**Status final:** **ENCERRADO — ENGINE V1 DOCUMENTADA E BLINDADA**. O sistema está matematicamente consistente, financeiramente seguro no escopo da V1, funcional e pronto para operação real em instância única.

---

## 2. Arquitetura da engine

### 2.1 Arquivo principal

- **Arquivo:** `server-fly.js`  
- **Endpoint de chute:** `POST /api/games/shoot` (autenticado por `authenticateToken`).

### 2.2 Componentes centrais

| Componente | Descrição |
|------------|-----------|
| **lotesAtivos** | `Map()` em memória: chave = loteId, valor = objeto lote (id, valor, config, chutes[], status, ativo, winnerIndex, totalArrecadado, premioTotal). |
| **contadorChutesGlobal** | Variável numérica em memória; incrementada a cada chute aceito; usada para Gol de Ouro (a cada 1000) e persistida em `metricas_globais`. |
| **ultimoGolDeOuro** | Variável em memória; valor do contador no último Gol de Ouro. |
| **idempotencyProcessed** | `Map()` em memória: chave = X-Idempotency-Key, valor = { ts }; TTL 120s; limpeza a cada 60s. |
| **batchConfigs** | Objeto fixo: `1: { size: 10, totalValue: 10, ... }`, `2: { size: 5, ... }`, etc. Na V1 apenas valor 1 é aceito; size 10. |
| **getOrCreateLoteByValue(amount)** | Percorre `lotesAtivos` em busca de lote ativo para o valor com `chutes.length < config.size`; se não houver, cria novo lote com `winnerIndex = config.size - 1` e insere no Map. |
| **loteIntegrityValidator** | Utilitário (`utils/lote-integrity-validator.js`): `validateBeforeShot(lote, shotData)` e `validateAfterShot(lote, shotResult)`; valida lote não cheio, dados completos, permite múltiplos chutes do mesmo usuário. |

### 2.3 Cálculo do gol

- **shotIndex** = `lote.chutes.length` (antes do push).  
- **winnerIndex** = `config.size - 1` (na criação do lote; para valor 1 → 9 em base 0 = 10º chute).  
- **isGoal** = `shotIndex === lote.winnerIndex`.  
- **result** = `isGoal ? 'goal' : 'miss'`.

### 2.4 Persistência e saldo

- **chutes:** INSERT em `public.chutes` (usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index).  
- **usuarios:** UPDATE `saldo` com **optimistic lock** (`.eq('saldo', user.saldo)`); se nenhuma linha for atualizada → 409.  
- **metricas_globais:** upsert do contador global e último Gol de Ouro via `saveGlobalCounter()`.

---

## 3. Fluxo do chute

Fluxo completo desde `POST /api/games/shoot` até a resposta ao player:

1. **Autenticação** — middleware `authenticateToken`; `req.user.userId` disponível.  
2. **Validação de entrada** — direction e amount obrigatórios; direction em VALID_DIRECTIONS (TL, TR, C, BL, BR); **amount === 1** (V1), senão 400.  
3. **Conexão** — exige `dbConnected` e `supabase`; senão 503.  
4. **Idempotency** — se header `X-Idempotency-Key` presente e chave já processada (TTL 120s), retorna 409.  
5. **Leitura de saldo** — SELECT `usuarios.saldo` WHERE id = userId; se não encontrado 404; se saldo < betAmount 400 "Saldo insuficiente".  
6. **Lote** — `getOrCreateLoteByValue(betAmount)` obtém ou cria lote ativo para valor 1.  
7. **Validação pré-chute** — `validateBeforeShot(lote, { direction, amount, userId })`; se lote cheio ou dados inválidos 400.  
8. **Contador global** — `contadorChutesGlobal++`; `isGolDeOuro = contadorChutesGlobal % 1000 === 0`; `saveGlobalCounter()`.  
9. **Resultado** — shotIndex = lote.chutes.length; isGoal = shotIndex === lote.winnerIndex; result = goal | miss; premio (5 se goal), premioGolDeOuro (100 se goal e isGolDeOuro).  
10. **Reserva de saldo** — novoSaldo = isGoal ? saldo - 1 + premio + premioGolDeOuro : saldo - 1; UPDATE usuarios SET saldo = novoSaldo WHERE id = userId **AND saldo = user.saldo**; SELECT saldo. Se nenhuma linha atualizada → 409 "Saldo insuficiente ou alterado. Tente novamente."  
11. **Lote em memória** — se goal: lote.status = 'completed', lote.ativo = false; build chute; push em lote.chutes; totalArrecadado += betAmount; premioTotal += premio + premioGolDeOuro.  
12. **Validação pós-chute** — validateAfterShot(lote, shotResult); se inválido: reversão de saldo (UPDATE para user.saldo), pop no lote, restauração de status se goal, 400.  
13. **INSERT chutes** — supabase.from('chutes').insert({ ... }). Se erro: reversão de saldo, rollback lote, 500.  
14. **Fechamento por tamanho** — se lote.chutes.length >= size e status !== completed, marca completed/ativo false.  
15. **Resposta** — 200 com { success: true, data: { loteId, direction, amount, result, premio, premioGolDeOuro, isGolDeOuro, contadorGlobal, timestamp, playerId, novoSaldo, loteProgress, isLoteComplete } }.  
16. **Idempotency** — se X-Idempotency-Key foi enviado, grava chave em idempotencyProcessed com timestamp.

---

## 4. Regra oficial da V1

| Regra | Definição |
|-------|------------|
| **Valor permitido** | `amount = 1` (R$ 1,00). Qualquer outro valor retorna 400. |
| **Tamanho do lote** | 10 chutes (para valor 1). |
| **Resultado** | Chutes 1 a 9 → **miss**. Chute 10 → **goal**. |
| **Prêmio base** | R$ 5 por goal. |
| **Gol de Ouro** | Bônus adicional R$ 100 a cada 1000 chutes globais (quando o goal coincide com contador global múltiplo de 1000). |
| **Repetição de jogador** | Permitida: o mesmo usuário pode chutar várias vezes no mesmo lote. |
| **Retry** | Proteção opcional via header **X-Idempotency-Key**: mesma chave em janela de 120s retorna 409 e não reprocessa. |

Essas regras constituem a **REGRA OFICIAL DA ENGINE V1** e não devem ser alteradas sem decisão de produto e atualização desta documentação.

---

## 5. Economia do jogo

### 5.1 Tabela matemática (por evento)

| Evento | Efeito no saldo |
|--------|------------------|
| **miss** | saldo **-1** |
| **goal** | saldo **-1 + 5** (= +4 líquido) |
| **goal + Gol de Ouro** | saldo **-1 + 5 + 100** (= +104 líquido) |

### 5.2 Por lote (caso padrão, sem Gol de Ouro)

- **Arrecadação:** 10 × R$ 1 = R$ 10.  
- **Saída:** R$ 5 (prêmio ao vencedor).  
- **Margem da plataforma:** R$ 5 por lote (50% da arrecadação).  

### 5.3 RTP aproximado

- Por chute: 9 miss (-1 cada) e 1 goal (+4) → total -9 + 4 = -5 para os jogadores; +5 para a casa.  
- **RTP (return to player) por lote:** 5/10 = 50% (metade retorna como prêmio). A margem da plataforma é 50%.

---

## 6. Blindagens implementadas

| Proteção | Implementação |
|----------|----------------|
| **Validação de aposta** | `amount === 1` (rigorosamente); qualquer outro valor → 400 com mensagem clara. |
| **Saldo mínimo** | Leitura de `usuarios.saldo`; `user.saldo < betAmount` → 400 "Saldo insuficiente". |
| **Concorrência de saldo** | **Optimistic locking:** UPDATE saldo somente se `saldo = user.saldo` (valor lido). Se nenhuma linha atualizada → 409. Reduz lost update entre dois chutes ou chute e outra operação. |
| **Retry / replay** | Header opcional **X-Idempotency-Key**; chaves processadas armazenadas em memória com TTL 120s; requisição duplicada com mesma chave → 409. |
| **Validação de lote** | **LoteIntegrityValidator:** validateBeforeShot (lote não cheio, dados completos); validateAfterShot (resultado consistente). Permite múltiplos chutes do mesmo usuário; bloqueia 11º chute (lote cheio). |
| **Ordem e reversão** | UPDATE de saldo **antes** de INSERT em chutes; em falha de validação pós-chute ou de INSERT, **reversão de saldo** (UPDATE de volta para user.saldo) e rollback do lote em memória. |

---

## 7. Limites operacionais da engine V1

### 7.1 Arquitetura atual

- **Lotes em memória:** O estado dos lotes (chutes, status, ativo, totalArrecadado, premioTotal) vive em `lotesAtivos` (Map) no processo Node. Não há persistência do estado do lote em banco além dos registros em `chutes`.  
- **Contador global em memória:** `contadorChutesGlobal` e `ultimoGolDeOuro` são variáveis do processo; persistidos em `metricas_globais` a cada chute, mas a fonte de verdade durante o request é a memória.  
- **Instâncias suportadas:** **1 instância.** O desenho atual (Map em memória, sem fila nem store compartilhado) é adequado para uma única instância do backend.  
- **Multi-instância:** **Não suportado oficialmente.** Várias instâncias implicam vários Maps independentes, lotes duplicados por valor e contador global divergente (cada processo incrementa o seu; a escrita em metricas_globais é “last write wins”).  
- **Atomicidade:** **Garantia prática**, não transação única SQL. INSERT em `chutes` e UPDATE em `usuarios` são duas operações separadas; a ordem (UPDATE antes INSERT) e a reversão em falha reduzem estado parcial, mas não há BEGIN/COMMIT envolvendo as duas escritas.

---

## 8. Riscos aceitos na V1

Os seguintes riscos são **documentados e aceitos** para a V1 em operação controlada (instância única):

| Risco | Descrição | Aceite |
|-------|-----------|--------|
| **Retry simultâneo sem idempotency key** | Se o cliente não enviar X-Idempotency-Key e reenviar o request (timeout/retry), o mesmo chute pode ser processado duas vezes. Probabilidade considerada muito baixa quando o cliente gera chave por ação. | Aceito para V1; mitigado quando o cliente usa idempotency key. |
| **Contador global divergente em multi-instância** | Com mais de uma instância, cada uma incrementa seu contador; o Gol de Ouro (a cada 1000) pode ser atribuído mais de uma vez ou em posição incorreta. | Aceito para V1; V1 opera em instância única. |
| **Dois servidores criando lotes paralelos** | Com mais de uma instância, cada uma tem seu próprio Map de lotes; podem existir dois “lotes ativos” para o mesmo valor, com INSERTs em chutes referenciando lote_id diferentes. | Aceito para V1; V1 não suporta multi-instância. |

Esses riscos **não impedem** a operação da V1 em ambiente controlado (uma instância, clientes que podem enviar idempotency key). São a base para evolução na V2.

---

## 9. Evolução para V2

Caminho natural de evolução arquitetural (sem alterar a regra do jogo):

| Aspecto | V1 (atual) | Evolução V2 |
|---------|------------|-------------|
| **Lotes** | Em memória (Map por processo) | Mover para **banco** ou **Redis** (estado do lote persistido e compartilhado). |
| **Contador global** | Em memória + persistência a cada chute | Contador **persistido** e atualizado de forma atômica (ex.: Redis INCR ou tabela com lock). |
| **Arquitetura ideal** | API monolítica, estado em memória | **API** → **fila** (ex.: Redis/Bull, SQS) → **game worker** (consome um chute por vez por lote ou por fila por valor) → **database**. Garante serialização e evita concorrência indevida no lote e no saldo. |
| **Idempotência** | Em memória, por instância | Store compartilhado (Redis ou tabela com UNIQUE + TTL) para chaves de idempotência. |
| **Atomicidade** | Ordem + reversão | Transação SQL (BEGIN; INSERT chutes; UPDATE usuarios; COMMIT) ou procedimento/RPC atômico no banco. |

A regra do jogo (R$ 1, 10 chutes, 10º = goal, prêmio R$ 5, Gol de Ouro, mesmo jogador pode repetir) pode ser mantida; a mudança é de **infraestrutura e robustez**, não de produto.

---

## 10. Classificação final

**BLOCO E — Gameplay** é classificado como:

**ENGINE V1 VALIDADA PARA OPERAÇÃO CONTROLADA EM INSTÂNCIA ÚNICA**

- O sistema está **matematicamente consistente**: economia do lote fecha (10 in, 5 out, 5 margem); miss -1, goal -1+5 (ou -1+5+100).  
- Está **financeiramente seguro** no escopo da V1: débito do perdedor e crédito do vencedor no backend; optimistic locking reduz lost update; reversão em falha de persistência.  
- É **funcional**: regra do 10º chute, prêmio, Gol de Ouro, reentrada do mesmo jogador, validação de lote e de saldo, idempotency opcional.  
- Está **pronto para V1 real** em ambiente de **instância única**, com limites operacionais e riscos aceitos documentados.

**Encerramento documental:** **ENCERRADO — ENGINE V1 DOCUMENTADA E BLINDADA.** O BLOCO E é dado por concluído com maestria técnica e documental; este arquivo é o registro oficial do estado final da engine e a base para auditorias futuras e evolução para V2.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração de código, banco ou deploy foi realizada.*

**Caminho:** `docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md`
