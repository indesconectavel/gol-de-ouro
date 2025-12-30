# 🔍 AUDITORIA CRÍTICA: Sistema de Lotes vs Fila/Partidas

**Data:** 2025-01-12  
**Status:** ⚠️ **CONFLITO IDENTIFICADO**  
**Prioridade:** 🔴 **CRÍTICA**

---

## 📋 RESUMO EXECUTIVO

**PROBLEMA IDENTIFICADO:**
- O sistema atual usa **LOTES** (sem fila, sem espera)
- A Fase 3 implementou **FILA e PARTIDAS** (com espera, 10 jogadores)
- **Há um conflito arquitetural** entre os dois sistemas

**DECISÃO NECESSÁRIA:**
- Confirmar qual sistema deve ser usado
- Remover ou adaptar o sistema conflitante
- Garantir consistência no código e banco de dados

---

## 🎮 SISTEMA ATUAL: LOTES (Implementado e Funcionando)

### **Como Funciona:**

1. **Jogador chuta diretamente** via `/api/games/shoot`
2. **Não há fila** - jogador não precisa esperar
3. **Sistema cria lotes automaticamente** baseado no valor apostado:
   - **R$ 1:** Lote de 10 jogadores (10% chance)
   - **R$ 2:** Lote de 5 jogadores (20% chance)
   - **R$ 5:** Lote de 2 jogadores (50% chance)
   - **R$ 10:** Lote de 1 jogador (100% chance)

4. **Ganhador pré-determinado:**
   - Quando lote é criado, um `winnerIndex` é escolhido aleatoriamente
   - O jogador que chuta na posição `winnerIndex` ganha

5. **Finalização do lote:**
   - Quando alguém faz gol → lote encerra imediatamente
   - Quando lote atinge tamanho máximo → lote encerra
   - Prêmio: R$5 fixo + R$100 se for Gol de Ouro (a cada 1000 chutes)

### **Código Implementado:**

**Arquivo:** `server-fly.js`

```javascript
// Linha 348-406
let lotesAtivos = new Map();

const batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1 },
  2: { size: 5, totalValue: 10, winChance: 0.2 },
  5: { size: 2, totalValue: 10, winChance: 0.5 },
  10: { size: 1, totalValue: 10, winChance: 1.0 }
};

function getOrCreateLoteByValue(amount) {
  // Busca lote ativo ou cria novo
  // Retorna lote com winnerIndex pré-determinado
}
```

**Endpoint:** `POST /api/games/shoot`
- Valida saldo
- Obtém ou cria lote
- Determina se é gol baseado em `shotIndex === winnerIndex`
- Salva chute na tabela `chutes` com `lote_id`
- Ajusta saldo do vencedor

### **Persistência:**

**Tabela `chutes`:**
- `lote_id` - ID do lote
- `usuario_id` - ID do jogador
- `valor_aposta` - Valor apostado (1, 2, 5 ou 10)
- `resultado` - 'goal' ou 'miss'
- `premio` - R$5 se ganhou
- `premio_gol_de_ouro` - R$100 se for Gol de Ouro

**Armazenamento em Memória:**
- `lotesAtivos` (Map) - Lotes ativos em memória
- **PROBLEMA:** Se servidor reiniciar, lotes ativos são perdidos

### **Vantagens:**
✅ Jogador não precisa esperar  
✅ Sistema dinâmico e rápido  
✅ Múltiplos valores de aposta  
✅ Já está funcionando em produção

### **Desvantagens:**
❌ Lotes em memória (perdidos se servidor reiniciar)  
❌ Não há persistência de lotes ativos  
❌ Não há histórico completo de lotes

---

## 🎯 SISTEMA IMPLEMENTADO NA FASE 3: FILA E PARTIDAS

### **Como Funciona:**

1. **Jogador entra na fila** via WebSocket `join_queue`
2. **Espera até ter 10 jogadores** na fila
3. **Partida inicia automaticamente** quando completa
4. **Todos os 10 jogadores chutam simultaneamente** (30 segundos)
5. **Vencedor é determinado** pelo maior número de gols

### **Código Implementado:**

**Arquivo:** `src/websocket.js`
- `joinQueue()` - Adiciona jogador à fila
- `startGame()` - Inicia partida quando completa
- `handleKick()` - Processa chute durante partida
- `checkGameCompletion()` - Verifica se todos chutaram
- `finishGame()` - Finaliza partida e determina vencedor

**Arquivo:** `services/queueService.js` (NOVO)
- `joinQueue()` - Persiste entrada na fila
- `startGame()` - Cria partida no banco
- `finishGame()` - Finaliza partida

**Arquivo:** `database/schema-queue-matches.sql` (NOVO)
- Tabela `queue_board` - Fila de jogadores
- Tabela `matches` - Partidas criadas
- Tabela `match_players` - Jogadores da partida
- Tabela `match_events` - Eventos da partida

### **Persistência:**

**Tabelas Criadas:**
- `queue_board` - Fila persistente
- `matches` - Partidas persistidas
- `match_players` - Jogadores da partida
- `match_events` - Eventos da partida

**RPC Functions:**
- `rpc_add_to_queue` - Adiciona à fila
- `rpc_remove_from_queue` - Remove da fila
- `rpc_get_next_players_from_queue` - Obtém próximos jogadores
- `rpc_mark_players_matched` - Marca jogadores como matched
- `rpc_update_queue_heartbeat` - Atualiza heartbeat

### **Vantagens:**
✅ Persistência completa no banco  
✅ Sobrevive a reinicializações  
✅ Histórico completo de partidas

### **Desvantagens:**
❌ Jogador precisa esperar na fila  
❌ Sistema menos dinâmico  
❌ Não compatível com sistema de lotes atual

---

## ⚠️ CONFLITO IDENTIFICADO

### **1. Dois Sistemas Diferentes:**

| Aspecto | Sistema de Lotes (Atual) | Sistema Fila/Partidas (Fase 3) |
|---------|-------------------------|--------------------------------|
| **Entrada** | Chuta diretamente | Entra na fila |
| **Espera** | Não espera | Espera até ter 10 jogadores |
| **Valor** | R$ 1, 2, 5 ou 10 | Não especificado |
| **Ganhador** | Pré-determinado por lote | Maior número de gols |
| **Persistência** | Apenas chutes | Fila + Partidas + Eventos |
| **Endpoint** | `/api/games/shoot` | WebSocket `join_queue` |

### **2. Código Conflitante:**

**`server-fly.js`:**
- ✅ Sistema de lotes implementado e funcionando
- ❌ Não usa WebSocket para fila/partidas

**`src/websocket.js`:**
- ✅ Sistema de fila/partidas implementado
- ❌ Não usa sistema de lotes
- ⚠️ Tem eventos `join_queue` e `leave_queue` que não são usados pelo sistema de lotes

**`services/queueService.js`:**
- ✅ Criado para persistir fila/partidas
- ❌ Não é usado pelo sistema de lotes atual

**`database/schema-queue-matches.sql`:**
- ✅ Criado para persistir fila/partidas
- ❌ Não é usado pelo sistema de lotes atual

### **3. Banco de Dados:**

**Tabelas Existentes (Lotes):**
- ✅ `chutes` - Usada pelo sistema de lotes
- ✅ `lotes` - Existe no schema (mas não é usada em memória)

**Tabelas Criadas (Fase 3):**
- ⚠️ `queue_board` - Não usada pelo sistema de lotes
- ⚠️ `matches` - Não usada pelo sistema de lotes
- ⚠️ `match_players` - Não usada pelo sistema de lotes
- ⚠️ `match_events` - Não usada pelo sistema de lotes

---

## 🔍 ANÁLISE DO QUE ESTÁ SENDO USADO

### **Sistema de Lotes (ATIVO):**

**Evidências:**
1. ✅ `server-fly.js` tem `getOrCreateLoteByValue()` implementado
2. ✅ `POST /api/games/shoot` usa sistema de lotes
3. ✅ Tabela `chutes` tem campo `lote_id`
4. ✅ `batchConfigs` define configurações de lotes
5. ✅ `lotesAtivos` Map armazena lotes em memória

**Uso Real:**
- Mobile app chama `/api/games/shoot` diretamente
- Não há espera em fila
- Sistema funciona com lotes

### **Sistema Fila/Partidas (INATIVO):**

**Evidências:**
1. ⚠️ `src/websocket.js` tem código de fila/partidas
2. ⚠️ `services/queueService.js` foi criado mas não é usado
3. ⚠️ `database/schema-queue-matches.sql` foi criado mas não aplicado
4. ❌ Mobile app não usa WebSocket para entrar na fila
5. ❌ Não há integração entre fila/partidas e sistema de lotes

**Uso Real:**
- Código existe mas não é usado
- WebSocket tem eventos mas não são chamados
- Tabelas não foram aplicadas ao banco

---

## 🎯 RECOMENDAÇÕES

### **OPÇÃO 1: Manter Sistema de Lotes (Recomendado)**

**Ações:**
1. ✅ **Manter** sistema de lotes atual
2. ❌ **Remover** código de fila/partidas do WebSocket
3. ❌ **Não aplicar** `schema-queue-matches.sql`
4. ✅ **Persistir lotes** no banco (criar tabela `lotes` e usar)
5. ✅ **Melhorar** persistência de lotes ativos

**Vantagens:**
- Sistema já funciona
- Jogadores não esperam
- Mais dinâmico

**Desvantagens:**
- Perde código de fila/partidas
- Precisa criar persistência de lotes

### **OPÇÃO 2: Migrar para Sistema Fila/Partidas**

**Ações:**
1. ❌ **Remover** sistema de lotes
2. ✅ **Usar** sistema de fila/partidas
3. ✅ **Aplicar** `schema-queue-matches.sql`
4. ✅ **Integrar** WebSocket com mobile app
5. ✅ **Remover** endpoint `/api/games/shoot` ou adaptar

**Vantagens:**
- Persistência completa
- Histórico de partidas
- Sistema mais estruturado

**Desvantagens:**
- Jogadores precisam esperar
- Quebra sistema atual funcionando
- Requer mudanças no mobile app

### **OPÇÃO 3: Sistema Híbrido (Complexo)**

**Ações:**
1. ✅ **Manter** sistema de lotes para apostas rápidas
2. ✅ **Adicionar** sistema de fila/partidas para torneios
3. ✅ **Criar** modo de jogo selecionável

**Vantagens:**
- Flexibilidade
- Dois modos de jogo

**Desvantagens:**
- Complexidade alta
- Manutenção difícil
- Confusão para jogadores

---

## 📊 DECISÃO NECESSÁRIA

**Perguntas para o Usuário:**

1. **Qual sistema deve ser usado?**
   - [ ] Sistema de Lotes (atual, sem espera)
   - [ ] Sistema Fila/Partidas (com espera, 10 jogadores)
   - [ ] Sistema Híbrido (ambos)

2. **Se manter Lotes:**
   - [ ] Persistir lotes no banco?
   - [ ] Remover código de fila/partidas?
   - [ ] Não aplicar `schema-queue-matches.sql`?

3. **Se migrar para Fila/Partidas:**
   - [ ] Remover sistema de lotes?
   - [ ] Aplicar `schema-queue-matches.sql`?
   - [ ] Adaptar mobile app?

---

## ✅ PRÓXIMOS PASSOS

1. **Aguardar decisão do usuário**
2. **Remover código não utilizado**
3. **Aplicar correções conforme decisão**
4. **Garantir consistência no código e banco**

---

**Status:** ⚠️ **AGUARDANDO DECISÃO DO USUÁRIO**

