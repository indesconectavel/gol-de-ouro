# 🚀 APLICAR SCHEMA DE RECOMPENSAS AGORA

**Data:** 2025-01-12  
**Status:** ⏳ **PRONTO PARA APLICAR**

---

## 📋 INSTRUÇÕES RÁPIDAS

### **1. Abrir Supabase SQL Editor**
- Acesse: https://supabase.com/dashboard
- Projeto: `goldeouro-production`
- Clique em **SQL Editor** (menu lateral esquerdo)
- Clique em **New query** ou selecione uma query existente

### **2. Copiar Schema**
- Abra o arquivo: `database/schema-rewards-PARA-COPIAR.sql`
- **Selecione TODO o conteúdo** (Ctrl+A)
- **Copie** (Ctrl+C)

### **3. Colar e Executar**
- **Cole** no Supabase SQL Editor (Ctrl+V)
- Clique em **Run** ou pressione **CTRL + Enter**
- Aguarde execução
- Deve aparecer: **Success. No rows returned**

---

## ✅ VERIFICAÇÃO RÁPIDA

Após executar, rode este SQL para verificar:

```sql
-- Verificar tabela
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'rewards';
-- Deve retornar: rewards

-- Verificar funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'rpc_%reward%'
ORDER BY routine_name;
-- Deve retornar: rpc_get_user_rewards, rpc_mark_reward_credited, rpc_register_reward
```

---

## 📄 ARQUIVO PRONTO PARA COPIAR

**Arquivo:** `database/schema-rewards-PARA-COPIAR.sql`

Este arquivo contém TODO o SQL necessário, pronto para copiar e colar.

---

## ⚠️ IMPORTANTE

- ✅ Execute TODO o conteúdo de uma vez
- ✅ Não execute apenas partes
- ✅ Verifique se não há erros após executar

---

**Status:** ⏳ **AGUARDANDO APLICAÇÃO NO SUPABASE**

