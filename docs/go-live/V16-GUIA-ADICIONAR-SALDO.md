# 🔒 V16 GUIA COMPLETO - ADICIONAR SALDO AO USUÁRIO DE TESTE

## ⚠️ IMPORTANTE: CONFIGURAR SERVICE_ROLE_KEY

Antes de executar o script, você precisa configurar a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY`.

### Opção 1: Via arquivo .env.local (RECOMENDADO)

1. Crie ou edite o arquivo `.env.local` na raiz do projeto:
```bash
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
```

2. **NUNCA COMMITE** este arquivo no Git!

### Opção 2: Via variável de ambiente do sistema

**Windows PowerShell:**
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "sua_service_role_key_aqui"
```

**Windows CMD:**
```cmd
set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Linux/Mac:**
```bash
export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
```

### Opção 3: Obter do Fly.io Secrets

```bash
# Listar secrets
flyctl secrets list --app goldeouro-backend-v2

# Copiar manualmente e configurar localmente
```

---

## 🎯 EXECUTAR SCRIPT AUTOMATIZADO

### Pré-requisitos:
- ✅ Node.js instalado
- ✅ `SUPABASE_SERVICE_ROLE_KEY` configurada
- ✅ Conexão com internet

### Executar:
```bash
node scripts/correcao-saldo-v16-seguro.js
```

O script irá:
1. ✅ Fazer backup completo do usuário e transações
2. ✅ Adicionar R$ 50.00 ao saldo do usuário
3. ✅ Criar transação registrada
4. ✅ Verificar que a correção foi aplicada
5. ✅ Executar 10 chutes de teste
6. ✅ Gerar relatório completo

---

## 📋 EXECUÇÃO MANUAL (se script falhar)

### Opção 1: Via Supabase Dashboard SQL Editor (MAIS SEGURO)

1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/editor
2. Vá para SQL Editor
3. Execute:

```sql
BEGIN;

-- Pegar saldo atual e atualizar
WITH u AS (
  SELECT id, saldo 
  FROM usuarios 
  WHERE email = 'test_v16_diag_1764865077736@example.com' 
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + 50.00)
FROM u
WHERE usuarios.id = u.id;

-- Inserir transação
INSERT INTO transacoes(
  id, usuario_id, tipo, valor, saldo_anterior, saldo_posterior, descricao, status, created_at
)
SELECT
  gen_random_uuid(), 
  u.id, 
  'credito', 
  50.00, 
  u.saldo, 
  (u.saldo + 50.00), 
  'Saldo de teste V16+', 
  'concluido', 
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
```

---

### Opção 2: Via PowerShell REST API

```powershell
# Configurar variáveis
$SUPABASE_URL = "https://gayopagjdrkcmkirmfvy.supabase.co"
$SRK = "<SUA_SERVICE_ROLE_KEY>"
$USER_EMAIL = "test_v16_diag_1764865077736@example.com"
$USER_ID = "8304f2d0-1195-4416-9f8f-d740380062ee"

$headers = @{
    "apikey" = $SRK
    "Authorization" = "Bearer $SRK"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 1) Obter saldo atual
$user = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/usuarios?select=id,saldo&email=eq.$USER_EMAIL" -Headers $headers -Method Get
$current = [decimal]$user[0].saldo
Write-Host "Saldo atual: R$ $current"

# 2) Atualizar saldo
$new = $current + [decimal]50.00
$updateBody = @{ saldo = $new } | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/usuarios?id=eq.$($user[0].id)" -Headers $headers -Method Patch -Body $updateBody
Write-Host "Saldo atualizado: R$ $new"

# 3) Inserir transação
$txId = [guid]::NewGuid().ToString()
$payload = @{
    id = $txId
    usuario_id = $USER_ID
    tipo = "credito"
    valor = 50.00
    saldo_anterior = $current
    saldo_posterior = $new
    descricao = "Saldo de teste V16+"
    status = "concluido"
    created_at = (Get-Date).ToString("s")
} | ConvertTo-Json

$tx = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/transacoes" -Headers $headers -Method Post -Body $payload
Write-Host "Transação criada: $txId"

# 4) Verificar
$verify = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/usuarios?select=id,email,saldo&email=eq.$USER_EMAIL" -Headers $headers -Method Get
Write-Host "Saldo verificado: R$ $($verify[0].saldo)"
```

---

### Opção 3: Via Node.js Script Simples

Crie um arquivo `add-balance-manual.js`:

```javascript
require('dotenv').config();
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
const USER_ID = '8304f2d0-1195-4416-9f8f-d740380062ee';
const ADD_AMOUNT = 50.00;

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function addBalance() {
  try {
    // 1. Obter saldo atual
    const userResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/usuarios?select=id,saldo&email=eq.${USER_EMAIL}`,
      { headers }
    );
    
    const current = parseFloat(userResponse.data[0].saldo || 0);
    const newBalance = current + ADD_AMOUNT;
    
    console.log(`Saldo atual: R$ ${current}`);
    
    // 2. Atualizar saldo
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${USER_ID}`,
      { saldo: newBalance },
      { headers }
    );
    
    console.log(`Saldo atualizado: R$ ${newBalance}`);
    
    // 3. Inserir transação
    const { randomUUID } = require('crypto');
    const txResponse = await axios.post(
      `${SUPABASE_URL}/rest/v1/transacoes`,
      {
        id: randomUUID(),
        usuario_id: USER_ID,
        tipo: 'credito',
        valor: ADD_AMOUNT,
        saldo_anterior: current,
        saldo_posterior: newBalance,
        descricao: 'Saldo de teste V16+',
        status: 'concluido',
        created_at: new Date().toISOString()
      },
      { headers }
    );
    
    console.log(`Transação criada: ${txResponse.data.id}`);
    
    // 4. Verificar
    const verifyResponse = await axios.get(
      `${SUPABASE_URL}/rest/v1/usuarios?select=id,email,saldo&email=eq.${USER_EMAIL}`,
      { headers }
    );
    
    console.log(`Saldo verificado: R$ ${verifyResponse.data[0].saldo}`);
    console.log('✅ Saldo adicionado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Resposta:', error.response.data);
    }
    process.exit(1);
  }
}

addBalance();
```

Execute:
```bash
node add-balance-manual.js
```

---

## ✅ VALIDAÇÃO APÓS ADICIONAR SALDO

### 1. Verificar Saldo:
```sql
SELECT id, email, saldo 
FROM usuarios 
WHERE email = 'test_v16_diag_1764865077736@example.com';
```

### 2. Verificar Transação:
```sql
SELECT * 
FROM transacoes 
WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 3. Reexecutar Testes:
```bash
node scripts/correcao-v16-automatica.js
```

---

## 🔄 ROLLBACK (se necessário)

Se algo der errado, reverter:

```sql
-- Reverter saldo
UPDATE usuarios 
SET saldo = saldo - 50.00 
WHERE email = 'test_v16_diag_1764865077736@example.com';

-- Deletar transação de teste
DELETE FROM transacoes 
WHERE descricao = 'Saldo de teste V16+' 
AND usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verificar que `SUPABASE_SERVICE_ROLE_KEY` está configurada
2. Verificar conexão com Supabase
3. Verificar permissões da Service Role Key
4. Verificar se o usuário existe na tabela `usuarios`
5. Verificar logs do Supabase Dashboard

---

## ✅ CONCLUSÃO

Após adicionar saldo com sucesso, reexecutar os testes de validação V16. O sistema deve estar pronto para GO-LIVE.

