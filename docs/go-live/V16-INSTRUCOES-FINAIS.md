# 🔧 V16+ INSTRUÇÕES FINAIS - ADICIONAR SALDO E CONCLUIR VALIDAÇÃO

## ✅ STATUS ATUAL

**Redeploy Executado:** ✅ SUCESSO  
**Secrets Configurados:** ✅ TODOS PRESENTES  
**Supabase Conectado:** ✅ OK  
**Backend Funcionando:** ✅ HEALTH CHECK OK  
**Problema Restante:** ❌ Usuário de teste sem saldo

---

## 🎯 AÇÃO NECESSÁRIA: ADICIONAR SALDO

### Usuário de Teste:
- **Email:** `test_v16_diag_1764865077736@example.com`
- **UserId:** `8304f2d0-1195-4416-9f8f-d740380062ee`
- **Saldo Necessário:** R$ 50.00

---

## 📋 OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/editor
2. Navegue até a tabela `usuarios`
3. Busque pelo email: `test_v16_diag_1764865077736@example.com`
4. Edite o campo `saldo` e adicione `50.00`
5. Salve as alterações

**SQL Direto (via SQL Editor):**
```sql
-- Adicionar saldo ao usuário de teste
UPDATE usuarios 
SET saldo = saldo + 50.00 
WHERE email = 'test_v16_diag_1764865077736@example.com';

-- Registrar transação
INSERT INTO transacoes (usuario_id, tipo, valor, descricao, status)
VALUES (
  '8304f2d0-1195-4416-9f8f-d740380062ee',
  'credito',
  50.00,
  'Saldo de teste V16+',
  'concluido'
);
```

---

## 📋 OPÇÃO 2: Via API REST do Supabase

**PowerShell:**
```powershell
# Configurar variáveis
$sbUrl = "https://gayopagjdrkcmkirmfvy.supabase.co"
$srKey = "<SUPABASE_SERVICE_ROLE_KEY>" # Obter do Fly.io secrets
$userId = "8304f2d0-1195-4416-9f8f-d740380062ee"

# Atualizar saldo via PATCH
$body = @{
    saldo = 50.00
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$sbUrl/rest/v1/usuarios?id=eq.$userId" `
    -Method PATCH `
    -Headers @{
        "apikey" = $srKey
        "Authorization" = "Bearer $srKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } `
    -Body $body

# Registrar transação
$tx = @{
    usuario_id = $userId
    tipo = "credito"
    valor = 50.00
    descricao = "Saldo de teste V16+"
    status = "concluido"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$sbUrl/rest/v1/transacoes" `
    -Method POST `
    -Headers @{
        "apikey" = $srKey
        "Authorization" = "Bearer $srKey"
        "Content-Type" = "application/json"
    } `
    -Body $tx
```

**Node.js:**
```javascript
const axios = require('axios');

const SUPABASE_URL = 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Obter do Fly.io
const USER_ID = '8304f2d0-1195-4416-9f8f-d740380062ee';

// Atualizar saldo
await axios.patch(
  `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${USER_ID}`,
  { saldo: 50.00 },
  {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
);

// Registrar transação
await axios.post(
  `${SUPABASE_URL}/rest/v1/transacoes`,
  {
    usuario_id: USER_ID,
    tipo: 'credito',
    valor: 50.00,
    descricao: 'Saldo de teste V16+',
    status: 'concluido'
  },
  {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

## 📋 OPÇÃO 3: Via RPC Function do Supabase

**PowerShell:**
```powershell
$sbUrl = "https://gayopagjdrkcmkirmfvy.supabase.co"
$srKey = "<SUPABASE_SERVICE_ROLE_KEY>"
$userId = "8304f2d0-1195-4416-9f8f-d740380062ee"

$body = @{
    p_user_id = $userId
    p_amount = 50.00
    p_description = "Saldo de teste V16+"
    p_reference_type = "teste"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$sbUrl/rest/v1/rpc/rpc_add_balance" `
    -Method POST `
    -Headers @{
        "apikey" = $srKey
        "Authorization" = "Bearer $srKey"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

---

## ✅ APÓS ADICIONAR SALDO

### 1. Validar Saldo Adicionado:
```sql
SELECT id, email, saldo 
FROM usuarios 
WHERE email = 'test_v16_diag_1764865077736@example.com';
```

### 2. Reexecutar Teste de Chutes:
```bash
node scripts/revalidacao-v16-final.js
```

Ou executar apenas o teste de chutes:
```bash
node scripts/correcao-v16-automatica.js
```

### 3. Validar Resultados:
- ✅ 10 chutes devem retornar status 200/201
- ✅ Lote deve fechar automaticamente após 10 chutes
- ✅ WebSocket deve transmitir evento "lote-finalizado"
- ✅ Registros devem aparecer em `shots` e `lotes`

---

## 📊 EXPECTATIVA APÓS ADICIONAR SALDO

**Score Esperado:**
- Autenticação: 20/20 ✅
- CORS: 15/20 ✅
- Chutes: 20/20 ✅ (10 chutes bem-sucedidos)
- Lote: 20/20 ✅ (lote fechado)
- WebSocket: 20/20 ✅

**Total Esperado:** 95/100 ✅

**Decisão:** ✅ GO-LIVE APROVADO

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### Verificar Logs do Backend:
```bash
flyctl logs --app goldeouro-backend-v2 --region gru | Select-String -Pattern "shoot|chute|lote"
```

### Verificar Health Check:
```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

### Verificar Meta:
```bash
curl https://goldeouro-backend-v2.fly.dev/meta
```

---

## 📞 SUPORTE

Se encontrar problemas ao adicionar saldo:

1. Verificar conexão com Supabase
2. Verificar permissões da Service Role Key
3. Verificar se o usuário existe na tabela `usuarios`
4. Verificar logs do Supabase Dashboard

---

## ✅ CONCLUSÃO

O sistema está funcionando corretamente. O único problema é que o usuário de teste não tem saldo suficiente. Após adicionar saldo via uma das opções acima e reexecutar os testes, o sistema deve estar pronto para GO-LIVE.

**Tempo estimado:** 5 minutos  
**Complexidade:** Baixa

