# 📦 V18 SISTEMA DE LOTES ATUAL - ANÁLISE COMPLETA
## Data: 2025-12-05

---

## 🔍 COMO OS LOTES SÃO CRIADOS HOJE

### Processo de Criação

1. **Função Principal:** `getOrCreateLoteByValue(amount)` em `server-fly.js:459`
2. **Verificação em Memória:**
   - Busca em `lotesAtivos` Map por lote ativo do mesmo valor
   - Verifica: `valor === amount && ativo && chutes.length < config.size`
3. **Se Não Existe:**
   - Gera `loteId` único: `lote_${amount}_${Date.now()}_${randomBytes}`
   - Gera `winnerIndex` aleatório: `crypto.randomInt(0, config.size)`
   - Chama `LoteService.getOrCreateLote()` para persistir no banco
   - Cria objeto em memória e armazena em `lotesAtivos.set(loteId, loteAtivo)`

### Estrutura do Lote em Memória

```javascript
{
  id: "lote_1_1764886820121_854142aa4818",
  valor: 1,
  valorAposta: 1,
  ativo: true,
  config: { size: 10, totalValue: 10, winChance: 0.1 },
  chutes: [],
  status: 'active',
  winnerIndex: 5, // Índice do ganhador (0-9)
  createdAt: "2025-12-05T00:30:00Z",
  totalArrecadado: 0,
  premioTotal: 0
}
```

---

## 🔒 COMO SÃO FECHADOS

### Condições de Fechamento

1. **Gol Marcado (Imediato):**
   - Quando `shotIndex === lote.winnerIndex`
   - `lote.status = 'completed'`
   - `lote.ativo = false`
   - Persistência via `LoteService.updateLoteAfterShot()`

2. **Tamanho Máximo Atingido:**
   - Quando `lote.chutes.length >= lote.config.size`
   - `lote.status = 'completed'`
   - `lote.ativo = false`
   - Persistência via `LoteService.updateLoteAfterShot()`

### Processo de Fechamento

```javascript
// Em gameController.js:404
if (lote.chutes.length >= lote.config.size && lote.status !== 'completed') {
  lote.status = 'completed';
  lote.ativo = false;
  // Persistência no banco
  await LoteService.updateLoteAfterShot(...);
}
```

---

## 💾 ONDE FICAM ARMAZENADOS

### Memória (RAM)
- **Variável:** `lotesAtivos` Map (global em `server-fly.js`)
- **Vantagem:** Acesso rápido, sem query ao banco
- **Desvantagem:** Perdido em reinicialização (mitigado com sincronização)

### Banco de Dados (Supabase)
- **Tabela:** `lotes`
- **Campos Principais:**
  - `id` VARCHAR(100) PRIMARY KEY
  - `valor_aposta` DECIMAL(10,2)
  - `tamanho` INTEGER
  - `posicao_atual` INTEGER
  - `indice_vencedor` INTEGER
  - `status` VARCHAR(20) ('ativo', 'finalizado', 'pausado')
  - `total_arrecadado` DECIMAL(10,2)
  - `premio_total` DECIMAL(10,2)

### Sincronização
- **Ao Iniciar:** `LoteService.syncActiveLotes()` carrega lotes ativos do banco
- **Após Chute:** `LoteService.updateLoteAfterShot()` atualiza banco
- **Risco:** Estado em memória pode divergir do banco

---

## 🎯 COMO O BACKEND DECIDE QUANDO FECHAR

### Lógica de Fechamento

1. **Gol Marcado:**
   ```javascript
   const shotIndex = lote.chutes.length;
   const isGoal = shotIndex === lote.winnerIndex;
   if (isGoal) {
     lote.status = 'completed';
     lote.ativo = false;
   }
   ```

2. **Tamanho Máximo:**
   ```javascript
   if (lote.chutes.length >= lote.config.size) {
     lote.status = 'completed';
     lote.ativo = false;
   }
   ```

### Validação
- **Pré-chute:** `LoteIntegrityValidator.validateBeforeShot()`
- **Pós-chute:** `LoteIntegrityValidator.validateAfterShot()`
- **Reversão:** Se validação falhar, chute é revertido

---

## ⚠️ POR QUE LOTES FICAM EM MEMÓRIA

### Razões Técnicas

1. **Performance:**
   - Acesso instantâneo sem query ao banco
   - Reduz latência em operações frequentes

2. **Sincronização:**
   - Estado atualizado em tempo real
   - Facilita validações e verificações

3. **Complexidade:**
   - Lógica de negócio mais simples em memória
   - Facilita manipulação de arrays e objetos

### Riscos

1. **Perda de Dados:**
   - Reinicialização do servidor perde estado em memória
   - **Mitigação:** Sincronização ao iniciar

2. **Divergência:**
   - Estado em memória pode divergir do banco
   - **Mitigação:** Atualização após cada chute

3. **Escalabilidade:**
   - Múltiplas instâncias não compartilham memória
   - **Mitigação:** Cada instância sincroniza do banco

---

## ✅ EXISTE PERSISTÊNCIA REAL?

### Sim, Existe Persistência

1. **Criação:** `LoteService.getOrCreateLote()` persiste no banco
2. **Atualização:** `LoteService.updateLoteAfterShot()` atualiza após cada chute
3. **Chutes:** Salvos na tabela `chutes` com `lote_id`
4. **Sincronização:** `syncActiveLotes()` ao iniciar servidor

### Mas Há Limitações

1. **Estado em Memória:** Pode divergir do banco
2. **Reinicialização:** Perde estado em memória (mas recupera do banco)
3. **Múltiplas Instâncias:** Cada instância tem seu próprio estado em memória

---

## 🎮 O QUE ACONTECE APÓS O CHUTE 10

### Fluxo Completo

1. **Chute 10 é Processado:**
   - Adicionado ao array `lote.chutes`
   - Salvo no banco na tabela `chutes`
   - `lote.chutes.length` agora é 10

2. **Verificação de Fechamento:**
   ```javascript
   if (lote.chutes.length >= lote.config.size) {
     lote.status = 'completed';
     lote.ativo = false;
   }
   ```

3. **Persistência:**
   - `LoteService.updateLoteAfterShot()` atualiza banco
   - Status muda para `'finalizado'` no banco

4. **WebSocket (se implementado):**
   - Evento `lote-finalizado` é broadcastado
   - Clientes são notificados

---

## ❌ O QUE ACONTECE COM ERROS

### Validação Pré-Chute

- **Função:** `LoteIntegrityValidator.validateBeforeShot()`
- **Verifica:** Estrutura do lote, configuração, índice do vencedor, chutes existentes
- **Se Falhar:** Retorna erro 400, chute não é processado

### Validação Pós-Chute

- **Função:** `LoteIntegrityValidator.validateAfterShot()`
- **Verifica:** Resultado do chute, consistência
- **Se Falhar:** Chute é revertido do lote

### Erros de Persistência

- **Chute:** Se falhar ao salvar, erro é logado mas chute continua em memória
- **Lote:** Se falhar ao atualizar, erro é logado mas lote continua em memória
- **Risco:** Divergência entre memória e banco

---

## 🔄 EXISTE REINÍCIO AUTOMÁTICO?

### Sincronização ao Iniciar

- **Função:** `LoteService.syncActiveLotes()`
- **Processo:**
  1. Busca lotes ativos no banco
  2. Recria objetos em memória
  3. Reconstrói estado

### Limitações

- **Chutes em Memória:** Não são reconstruídos (apenas contagem)
- **Estado Completo:** Apenas metadados são recuperados
- **Risco:** Estado pode estar incompleto após reinicialização

---

## 📊 RESUMO DO CICLO DE VIDA

```
1. Criação → Banco + Memória
2. Chute 1-9 → Atualização em Memória + Banco
3. Chute 10 ou Gol → Fechamento em Memória + Banco
4. Reinicialização → Sincronização do Banco para Memória
```

---

**Gerado em:** 2025-12-05T00:30:00Z  
**Versão:** V18.0.0

