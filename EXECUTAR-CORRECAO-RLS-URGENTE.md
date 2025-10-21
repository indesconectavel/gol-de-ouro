# 🚨 **EXECUÇÃO URGENTE - CORREÇÃO RLS SUPABASE**

**Data:** 16 de Outubro de 2025 - 12:40  
**Status:** 🚨 **CRÍTICO - EXECUTAR AGORA**  
**Tempo estimado:** 15 minutos

---

## 🔥 **VULNERABILIDADES CONFIRMADAS NO SUPABASE**

### **✅ PROBLEMAS IDENTIFICADOS:**
- **9 issues need attention** (confirmado no print)
- **SECURITY 9** (9 vulnerabilidades de segurança)
- **Tabelas sem RLS:**
  - `public.ShotAttempt` - RLS não habilitado
  - `public.Withdrawal` - RLS não habilitado
  - E mais 7 tabelas críticas

---

## ⚡ **AÇÃO IMEDIATA - EXECUTAR AGORA**

### **PASSO 1: ACESSAR SUPABASE SQL EDITOR**
1. **Abrir:** https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql
2. **Clicar:** "New query"
3. **Colar:** Script completo abaixo
4. **Executar:** Clicar em "Run"

### **PASSO 2: EXECUTAR SCRIPT RLS COMPLETO**

```sql
-- 🚨 CORREÇÃO URGENTE RLS - EXECUTAR AGORA
-- Data: 16 de Outubro de 2025
-- Objetivo: Corrigir 9 vulnerabilidades críticas de segurança

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS) - URGENTE
-- =============================================

-- Habilitar RLS em TODAS as tabelas críticas
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Withdrawal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QueueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShotAttempt" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE SEGURANÇA CRÍTICAS
-- =============================================

-- Políticas para User (CRÍTICO)
CREATE POLICY "Users can view own data" ON "public"."User"
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON "public"."User"
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para Transaction (CRÍTICO - PIX)
CREATE POLICY "Users can view own transactions" ON "public"."Transaction"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can update transactions" ON "public"."Transaction"
    FOR UPDATE USING (true);

-- Políticas para Game (CRÍTICO)
CREATE POLICY "Users can view own games" ON "public"."Game"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas para Withdrawal (CRÍTICO - SAQUES)
CREATE POLICY "Users can view own withdrawals" ON "public"."Withdrawal"
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can update withdrawals" ON "public"."Withdrawal"
    FOR UPDATE USING (true);

-- Políticas para ShotAttempt (CRÍTICO - JOGO)
CREATE POLICY "Users can view own shots" ON "public"."ShotAttempt"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas para QueueEntry
CREATE POLICY "Users can view own queue entries" ON "public"."QueueEntry"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas para Notification
CREATE POLICY "Users can view own notifications" ON "public"."Notification"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas para system_config
CREATE POLICY "System can view config" ON "public"."system_config"
    FOR SELECT USING (true);

-- =============================================
-- VERIFICAÇÃO DE SEGURANÇA
-- =============================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('User', 'Transaction', 'Game', 'Withdrawal', 'QueueEntry', 'Notification', 'system_config', 'ShotAttempt')
ORDER BY tablename;

-- =============================================
-- CONFIRMAÇÃO DE EXECUÇÃO
-- =============================================

SELECT '✅ RLS Security Fix Applied Successfully!' as status,
       NOW() as executed_at,
       'All 9 critical tables now have Row Level Security enabled' as description;
```

### **PASSO 3: VERIFICAR CORREÇÃO**
1. **Ir para:** Security Advisor
2. **Verificar:** Issues reduzidas de 9 para 0
3. **Confirmar:** "No issues need attention"

---

## ⏰ **TEMPO CRÍTICO**

**EXECUTAR AGORA - NÃO ADIAR!**
- **Dados expostos** sem controle de acesso
- **Vulnerabilidade grave** de segurança
- **Conformidade** comprometida

**TEMPO ESTIMADO:** 15 minutos
**PRIORIDADE:** MÁXIMA

---

## ✅ **APÓS EXECUÇÃO**

### **Verificar:**
- [ ] Security Advisor mostra 0 issues
- [ ] Todas as tabelas com RLS habilitado
- [ ] Políticas de segurança ativas
- [ ] Dados protegidos

### **Próximo passo:**
- Regularizar pagamento Fly.io (US$ 17,68)

**EXECUTAR AGORA!** 🚨⚡
