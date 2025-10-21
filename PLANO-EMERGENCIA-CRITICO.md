# 🚨 **PLANO DE EMERGÊNCIA CRÍTICO - AÇÃO IMEDIATA**

**Data:** 16 de Outubro de 2025 - 09:22  
**Status:** 🚨 **CRÍTICO - AÇÃO IMEDIATA NECESSÁRIA**  
**Prioridade:** MÁXIMA

---

## 🔥 **PROBLEMAS CRÍTICOS IDENTIFICADOS**

### **1. 💳 FALHA DE PAGAMENTO FLY.IO - CRÍTICO**
- **Status:** Backend em risco de suspensão
- **Valor:** US$ 17,68
- **Falha:** Recorrente (não é a primeira vez)
- **Impacto:** Jogo inacessível se suspenso

### **2. 🗄️ PAUSA DO SUPABASE - CRÍTICO**
- **Status:** Banco será pausado em alguns dias
- **Motivo:** Inatividade por 7+ dias
- **Impacto:** Dados inacessíveis, autenticação falha

### **3. 🔒 VULNERABILIDADES DE SEGURANÇA - CRÍTICO**
- **Status:** 8 erros de RLS desabilitado
- **Impacto:** Dados expostos, vulnerabilidade grave
- **Tabelas:** User, Transaction, Game, Withdrawal

---

## ⚡ **AÇÕES IMEDIATAS (PRÓXIMAS 2 HORAS)**

### **AÇÃO 1: REGULARIZAR PAGAMENTO FLY.IO (15 MIN)**
1. **Acessar:** https://fly.io/dashboard
2. **Ir para:** Billing > Payment Methods
3. **Atualizar:** Informações de pagamento
4. **Verificar:** Status do pagamento de US$ 17,68
5. **Confirmar:** Backend funcionando

### **AÇÃO 2: ATIVAR SUPABASE (15 MIN)**
1. **Acessar:** https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg
2. **Verificar:** Status do projeto goldeouro-db
3. **Ativar:** Se pausado
4. **Configurar:** Keep-alive para evitar pausas futuras

### **AÇÃO 3: CORRIGIR VULNERABILIDADES RLS (30 MIN)**
1. **Acessar:** Supabase > SQL Editor
2. **Executar:** Scripts de RLS para todas as tabelas
3. **Verificar:** Security Advisor
4. **Testar:** Acesso aos dados

### **AÇÃO 4: IMPLEMENTAR KEEP-ALIVE (30 MIN)**
1. **Criar:** Script de keep-alive
2. **Configurar:** Execução automática
3. **Testar:** Funcionamento
4. **Monitorar:** Status

---

## 🔧 **SCRIPTS DE CORREÇÃO**

### **Script 1: RLS para Tabelas Críticas**
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Withdrawal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."QueueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShotAttempt" ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS
CREATE POLICY "Users can view own data" ON "public"."User"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON "public"."User"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON "public"."Transaction"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own games" ON "public"."Game"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own withdrawals" ON "public"."Withdrawal"
    FOR SELECT USING (auth.uid() = user_id);
```

### **Script 2: Keep-Alive Backend**
```javascript
// keep-alive-backend.js
const https = require('https');

const keepAlive = () => {
  const options = {
    hostname: 'goldeouro-backend.fly.dev',
    port: 443,
    path: '/health',
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Keep-alive: ${res.statusCode} - ${new Date().toISOString()}`);
  });

  req.on('error', (e) => {
    console.error(`❌ Keep-alive error: ${e.message}`);
  });

  req.end();
};

// Executar a cada 5 minutos
setInterval(keepAlive, 5 * 60 * 1000);

// Executar imediatamente
keepAlive();

console.log('🔄 Keep-alive iniciado - Backend será mantido ativo');
```

### **Script 3: Keep-Alive Supabase**
```javascript
// keep-alive-supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const keepAliveSupabase = async () => {
  try {
    // Fazer uma consulta simples para manter o banco ativo
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ Supabase keep-alive error: ${error.message}`);
    } else {
      console.log(`✅ Supabase keep-alive: OK - ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error(`❌ Supabase keep-alive error: ${err.message}`);
  }
};

// Executar a cada 10 minutos
setInterval(keepAliveSupabase, 10 * 60 * 1000);

// Executar imediatamente
keepAliveSupabase();

console.log('🔄 Supabase keep-alive iniciado');
```

---

## 📊 **MONITORAMENTO CONTÍNUO**

### **Checklist de Verificação (A cada 2 horas)**
- [ ] Backend Fly.io funcionando
- [ ] Supabase ativo
- [ ] RLS habilitado
- [ ] Keep-alive executando
- [ ] Pagamentos em dia

### **Alertas Configurados**
- [ ] E-mail para falhas de pagamento
- [ ] Notificação para pausas do Supabase
- [ ] Monitoramento de Security Advisor

---

## 🎯 **RESULTADO ESPERADO**

### **Após 2 horas:**
- ✅ Backend estável e funcionando
- ✅ Banco de dados ativo
- ✅ Segurança corrigida
- ✅ Keep-alive implementado
- ✅ Sistema monitorado

### **Após 24 horas:**
- ✅ Pagamentos regularizados
- ✅ Vulnerabilidades corrigidas
- ✅ Sistema estável
- ✅ Monitoramento ativo

---

## 🚨 **CONTATOS DE EMERGÊNCIA**

- **Fly.io Support:** billing@fly.io
- **Supabase Support:** support@supabase.com
- **Stripe Support:** support@stripe.com

**AÇÃO IMEDIATA NECESSÁRIA!** 🚨⚡
