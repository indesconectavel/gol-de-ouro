# 🎯 PRÓXIMA FASE: Sistema de Recompensas (Fase 5)

**Data:** 2025-01-12  
**Status:** ⏳ **PRÓXIMA FASE**  
**Prioridade:** 🔴 **ALTA**

---

## 📋 RESUMO DA SITUAÇÃO ATUAL

### **✅ O Que Já Existe:**

1. **Prêmios Funcionando:**
   - Prêmio normal: R$5 fixo quando faz gol
   - Gol de Ouro: R$100 adicional (a cada 1000 chutes)
   - Saldo atualizado manualmente no código

2. **Código Atual (`server-fly.js`):**
```javascript
if (isGoal) {
  premio = 5.00;
  if (isGolDeOuro) {
    premioGolDeOuro = 100.00;
  }
  // Atualização manual de saldo
  const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
  await supabase.from('usuarios').update({ saldo: novoSaldoVencedor });
}
```

### **❌ O Que Falta:**

1. **Tabela `rewards`** - Não existe para histórico de recompensas
2. **Uso do FinancialService** - Não usa ACID para garantir integridade
3. **Registro Completo** - Recompensas não são registradas em tabela dedicada
4. **Transações ACID** - Atualização de saldo não usa transações seguras

---

## 🎯 OBJETIVO DA FASE 5

**Implementar sistema completo de recompensas com:**
- ✅ Tabela `rewards` para histórico
- ✅ Uso do `FinancialService` para garantir ACID
- ✅ Registro completo de todas as recompensas
- ✅ Integridade financeira garantida

---

## 📊 FASES COMPLETADAS

### **✅ Fase 1: Sistema Financeiro ACID**
- RPC Functions criadas (`rpc_add_balance`, etc.)
- `FinancialService` implementado
- Transações ACID funcionando

### **✅ Fase 2: Idempotência Webhook**
- Tabela `webhook_events` criada
- `WebhookService` implementado
- Idempotência garantida

### **✅ Fase 3: Persistência de Lotes** (Adaptada)
- Schema de lotes criado e aplicado
- `LoteService` implementado
- Lotes persistidos no banco

### **⏳ Fase 4: Persistência de Partidas** (Removida)
- Não aplicável (sistema de lotes mantido)

---

## 🚀 FASE 5: Sistema de Recompensas

### **O Que Será Implementado:**

#### **1. Schema de Recompensas**
- Criar tabela `rewards` no banco
- Campos: `id`, `usuario_id`, `lote_id`, `chute_id`, `tipo`, `valor`, `descricao`, `status`, `created_at`
- Índices para performance

#### **2. Service de Recompensas**
- Criar `services/rewardService.js`
- Métodos:
  - `registerReward()` - Registrar recompensa
  - `creditReward()` - Creditar recompensa com ACID
  - `getUserRewards()` - Histórico de recompensas

#### **3. Integração no Código**
- Atualizar `/api/games/shoot` para usar `RewardService`
- Usar `FinancialService.addBalance()` para crédito ACID
- Registrar todas as recompensas na tabela `rewards`

#### **4. Tipos de Recompensas**
- `gol_normal` - R$5 por gol normal
- `gol_de_ouro` - R$100 por Gol de Ouro
- `bonus` - Bônus futuros (se necessário)

---

## 📋 CHECKLIST DA FASE 5

### **Schema:**
- [ ] Criar `database/schema-rewards.sql`
- [ ] Tabela `rewards` com campos corretos
- [ ] Índices para performance
- [ ] RPC Functions (se necessário)

### **Service:**
- [ ] Criar `services/rewardService.js`
- [ ] Método `registerReward()`
- [ ] Método `creditReward()` usando `FinancialService`
- [ ] Método `getUserRewards()`

### **Integração:**
- [ ] Atualizar `server-fly.js` para usar `RewardService`
- [ ] Substituir atualização manual por `FinancialService.addBalance()`
- [ ] Registrar recompensas na tabela `rewards`
- [ ] Testar fluxo completo

### **Documentação:**
- [ ] Documentar schema
- [ ] Documentar service
- [ ] Documentar integração
- [ ] Guia de aplicação no Supabase

---

## 🔧 IMPACTO NO CÓDIGO ATUAL

### **Antes (Atual):**
```javascript
if (isGoal) {
  premio = 5.00;
  if (isGolDeOuro) {
    premioGolDeOuro = 100.00;
  }
  // Atualização manual (sem ACID)
  const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
  await supabase.from('usuarios').update({ saldo: novoSaldoVencedor });
}
```

### **Depois (Fase 5):**
```javascript
if (isGoal) {
  premio = 5.00;
  if (isGolDeOuro) {
    premioGolDeOuro = 100.00;
  }
  
  // ✅ Usar RewardService para registrar e creditar
  await RewardService.creditReward(
    req.user.userId,
    lote.id,
    chute.id,
    'gol_normal',
    premio
  );
  
  if (isGolDeOuro) {
    await RewardService.creditReward(
      req.user.userId,
      lote.id,
      chute.id,
      'gol_de_ouro',
      premioGolDeOuro
    );
  }
}
```

---

## ✅ BENEFÍCIOS DA FASE 5

1. **Integridade Financeira** - Usa `FinancialService` para garantir ACID
2. **Histórico Completo** - Todas as recompensas registradas
3. **Rastreabilidade** - Pode rastrear todas as recompensas dadas
4. **Auditoria** - Facilita auditoria financeira
5. **Extensibilidade** - Fácil adicionar novos tipos de recompensas

---

## 📚 DEPENDÊNCIAS

### **Já Implementadas:**
- ✅ `FinancialService` (Fase 1)
- ✅ Sistema de lotes persistido (Fase 3 adaptada)
- ✅ Tabela `chutes` funcionando

### **A Criar:**
- ⏳ Tabela `rewards`
- ⏳ `RewardService`
- ⏳ Integração no código

---

## 🎯 PRÓXIMOS PASSOS

1. **Criar Schema** - `database/schema-rewards.sql`
2. **Criar Service** - `services/rewardService.js`
3. **Aplicar Schema** - No Supabase SQL Editor
4. **Integrar Código** - Atualizar `server-fly.js`
5. **Testar** - Validar fluxo completo

---

## 📊 ESTIMATIVA

- **Tempo:** 1-2 horas
- **Complexidade:** Média
- **Risco:** Baixo (usa código já testado)

---

**Status:** ⏳ **PRONTO PARA INICIAR**

**Deseja que eu implemente a Fase 5 agora?**

