# ✅ IMPLEMENTAÇÃO: Persistência de Lotes

**Data:** 2025-01-12  
**Status:** ✅ **IMPLEMENTADO**  
**Prioridade:** 🔴 **CRÍTICA**

---

## 📋 RESUMO

Implementação completa de persistência de lotes ativos no banco de dados, garantindo que reinicialização do servidor não perca dados.

---

## ✅ ARQUIVOS CRIADOS/ATUALIZADOS

### **1. `database/schema-lotes-persistencia.sql`**
- Schema completo para persistência de lotes
- Tabela `lotes` atualizada com campo `completed_at`
- 3 RPC Functions:
  - `rpc_get_or_create_lote` - Criar ou obter lote ativo
  - `rpc_update_lote_after_shot` - Atualizar lote após chute
  - `rpc_get_active_lotes` - Sincronizar lotes ativos

### **2. `services/loteService.js`**
- Service completo para gerenciar lotes
- Métodos:
  - `getOrCreateLote()` - Criar ou obter lote
  - `updateLoteAfterShot()` - Atualizar após chute
  - `syncActiveLotes()` - Sincronizar ao iniciar servidor

### **3. `src/websocket.js`**
- ✅ Simplificado - removido código de fila/partidas
- Mantém apenas: auth, rooms, chat, ping/pong

### **4. `database/schema-queue-matches.sql`**
- ⚠️ Marcado como OBSOLETO
- Não aplicar ao banco

### **5. `services/queueService.js`**
- ⚠️ Marcado como OBSOLETO
- Não usar no código

---

## 🔧 PRÓXIMOS PASSOS NECESSÁRIOS

### **1. Aplicar Schema ao Supabase**

Execute no SQL Editor do Supabase:
```sql
-- Copiar conteúdo de database/schema-lotes-persistencia.sql
-- Aplicar no Supabase SQL Editor
```

### **2. Atualizar `server-fly.js`**

**Adicionar import:**
```javascript
const LoteService = require('./services/loteService');
```

**Atualizar função `getOrCreateLoteByValue`:**
```javascript
async function getOrCreateLoteByValue(amount) {
  const config = batchConfigs[amount];
  if (!config) {
    throw new Error(`Valor de aposta inválido: ${amount}`);
  }

  // Verificar se existe lote ativo em memória
  let loteAtivo = null;
  for (const [loteId, lote] of lotesAtivos.entries()) {
    const valorLote = typeof lote.valor !== 'undefined' ? lote.valor : lote.valorAposta;
    const ativo = typeof lote.ativo === 'boolean' ? lote.ativo : lote.status === 'active';
    if (valorLote === amount && ativo && lote.chutes.length < config.size) {
      loteAtivo = lote;
      break;
    }
  }

  // Se não existe em memória, buscar/criar no banco
  if (!loteAtivo) {
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const loteId = `lote_${amount}_${Date.now()}_${randomBytes}`;
    const winnerIndex = crypto.randomInt(0, config.size);

    // ✅ PERSISTIR NO BANCO
    const result = await LoteService.getOrCreateLote(loteId, amount, config.size, winnerIndex);
    
    if (!result.success) {
      throw new Error(`Erro ao criar lote: ${result.error}`);
    }

    // Criar objeto em memória
    loteAtivo = {
      id: result.lote.id,
      valor: amount,
      ativo: true,
      valorAposta: amount,
      config: config,
      chutes: [],
      status: 'active',
      winnerIndex: result.lote.indice_vencedor,
      createdAt: new Date().toISOString(),
      totalArrecadado: 0,
      premioTotal: 0
    };
    
    lotesAtivos.set(loteId, loteAtivo);
    console.log(`🎮 [LOTE] Novo lote criado e persistido: ${loteId} (R$${amount})`);
  }

  return loteAtivo;
}
```

**Atualizar endpoint `/api/games/shoot` após salvar chute:**
```javascript
// Após adicionar chute ao lote e salvar no banco (chutes)
// ✅ ATUALIZAR LOTE NO BANCO
const updateResult = await LoteService.updateLoteAfterShot(
  lote.id,
  amount,
  premio,
  premioGolDeOuro,
  isGoal
);

if (updateResult.success && updateResult.lote.is_complete) {
  // Lote foi finalizado no banco
  lote.status = 'completed';
  lote.ativo = false;
}
```

**Adicionar sincronização ao iniciar servidor:**
```javascript
// Após inicializar Supabase
async function syncLotesFromDatabase() {
  try {
    console.log('🔄 [SERVER] Sincronizando lotes do banco de dados...');
    const result = await LoteService.syncActiveLotes();
    
    if (result.success && result.count > 0) {
      console.log(`✅ [SERVER] ${result.count} lotes ativos encontrados no banco`);
      
      // Recriar lotes em memória
      for (const loteData of result.lotes) {
        const config = batchConfigs[loteData.valor_aposta];
        if (config) {
          const lote = {
            id: loteData.id,
            valor: loteData.valor_aposta,
            ativo: loteData.status === 'ativo',
            valorAposta: loteData.valor_aposta,
            config: config,
            chutes: [], // Será reconstruído conforme necessário
            status: loteData.status === 'ativo' ? 'active' : 'completed',
            winnerIndex: loteData.indice_vencedor,
            createdAt: loteData.created_at,
            totalArrecadado: parseFloat(loteData.total_arrecadado),
            premioTotal: parseFloat(loteData.premio_total)
          };
          
          lotesAtivos.set(loteData.id, lote);
        }
      }
    } else {
      console.log('✅ [SERVER] Nenhum lote ativo no banco');
    }
  } catch (error) {
    console.error('❌ [SERVER] Erro ao sincronizar lotes:', error);
  }
}

// Chamar após inicializar Supabase
if (dbConnected && supabase) {
  syncLotesFromDatabase();
}
```

---

## ✅ BENEFÍCIOS

1. **Persistência:** Lotes sobrevivem reinicialização do servidor
2. **Consistência:** Dados sempre sincronizados entre memória e banco
3. **Histórico:** Todos os lotes ficam registrados no banco
4. **Recuperação:** Sistema pode recuperar lotes ativos após falha

---

## ⚠️ IMPORTANTE

1. **Aplicar schema primeiro** no Supabase
2. **Testar RPC functions** antes de atualizar código
3. **Fazer backup** do banco antes de aplicar mudanças
4. **Monitorar logs** após deploy

---

**Status:** ✅ **SCHEMA E SERVICE PRONTOS - AGUARDANDO APLICAÇÃO E INTEGRAÇÃO**

