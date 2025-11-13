# 🔧 CORREÇÕES NECESSÁRIAS: usuario_id vs user_id

**Data:** 13 de Novembro de 2025  
**Hora:** 20:50 UTC  
**Versão:** 1.2.0  
**Status:** ⚠️ **CORREÇÕES IDENTIFICADAS**

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **1. router.js - Linha 426** 🔴 **CRÍTICO**

**Arquivo:** `router.js`  
**Linha:** 426  
**Código:**
```javascript
const { data, error } = await supabase
  .from('games')
  .select('id, game_type, result, bet_amount, prize, is_golden_goal, created_at')
  .eq('user_id', user_id)  // ❌ PROBLEMA: Tabela 'games' pode não existir ou usar coluna diferente
```

**Problema:**
- Tabela `games` não encontrada no schema atual
- Código usa `user_id` mas não há confirmação da estrutura da tabela
- Pode causar erro em produção

**Ação Necessária:**
1. ⏳ Verificar se tabela `games` existe no Supabase
2. ⏳ Verificar qual coluna ela usa (`user_id` ou `usuario_id`)
3. ⏳ Corrigir código se necessário

---

## ✅ VERIFICAÇÕES REALIZADAS

### **1. server-fly.js** ✅ **CORRETO**
- ✅ Usa `usuario_id` para tabelas principais
- ✅ Usa `user_id` apenas para `password_reset_tokens` (correto)

### **2. Script SQL Atual** ✅ **CORRETO**
- ✅ `corrigir-rls-supabase-completo.sql` usa `usuario_id` corretamente

### **3. Estrutura do Banco** ✅ **CORRETA**
- ✅ Todas as tabelas principais usam `usuario_id`
- ✅ `password_reset_tokens` usa `user_id` (correto)

---

## 📋 AÇÕES NECESSÁRIAS

### **1. Verificar Tabela `games`** ⏳ **URGENTE**

**Passos:**
1. Acessar Supabase SQL Editor
2. Executar query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games' 
AND table_schema = 'public';
```

3. Verificar se tabela existe e qual coluna usa

**Resultado Esperado:**
- Se tabela não existir: Remover código ou criar tabela
- Se tabela existir: Verificar coluna e corrigir código

---

### **2. Corrigir router.js (se necessário)** ⏳

**Se tabela `games` usar `usuario_id`:**
```javascript
// CORRIGIR:
.eq('usuario_id', user_id)
```

**Se tabela `games` não existir:**
- Remover endpoint ou criar tabela adequada

---

## 🎯 CONCLUSÃO

### **Status:**
- ✅ **Código Principal:** Correto (server-fly.js)
- ✅ **Script SQL:** Corrigido
- ⚠️ **router.js:** Precisa verificação da tabela `games`

### **Próximos Passos:**
1. ⏳ Verificar estrutura da tabela `games` no Supabase
2. ⏳ Corrigir router.js se necessário
3. ⏳ Testar endpoint após correção

---

**Atualizado em:** 13 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ⚠️ **AGUARDANDO VERIFICAÇÃO DA TABELA GAMES**

