# 🎯 GUIA FINAL - RESOLVER PROBLEMA DA RPC

## ✅ CONFIRMAÇÕES

### Usuário Encontrado no Projeto de Produção:
- ✅ **ID:** `4ddf8330-ae94-4e92-a010-bdc7fa254ad5`
- ✅ **Email:** `free10signer@gmail.com`
- ✅ **Saldo:** R$ 50,00
- ✅ **Projeto:** `goldeouro-production` (gayopagjdrkcmkirmfvy)

### Configuração:
- ✅ Código aponta para projeto correto (produção)
- ✅ Usuário existe no banco
- ✅ RPCs estão instaladas

---

## 🔍 PROBLEMA IDENTIFICADO

O problema **NÃO é**:
- ❌ Projeto errado (está correto)
- ❌ Usuário não existe (existe)
- ❌ RPCs não instaladas (estão instaladas)

O problema **PODE ser**:
- ⚠️ Tipo de dados do UUID na chamada da RPC
- ⚠️ Formato dos parâmetros passados
- ⚠️ Problema específico na RPC em si

---

## 🧪 TESTE DIRETO NO SQL EDITOR

### Passo 1: Testar RPC com UUID Real

No **Supabase SQL Editor** do projeto `goldeouro-production`, execute:

```sql
SELECT public.rpc_deduct_balance(
  '4ddf8330-ae94-4e92-a010-bdc7fa254ad5'::UUID,
  5.00::DECIMAL,
  'Teste de débito'::TEXT,
  NULL::INTEGER,
  'aposta'::VARCHAR,
  false::BOOLEAN
);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "old_balance": 50.00,
  "new_balance": 45.00,
  "transaction_id": 123,
  "amount": 5.00
}
```

**Se der erro:**
- Anotar mensagem de erro exata
- Verificar se o problema é na RPC em si

---

## 🔧 VERIFICAÇÕES NO CÓDIGO

### Verificar Como o Código Chama a RPC

**Arquivo:** `src/modules/financial/services/financial.service.js`

**Linha 120:**
```javascript
const { data, error } = await supabaseAdmin.rpc('rpc_deduct_balance', {
  p_user_id: userId,  // ← Verificar formato do userId
  p_amount: parseFloat(amount),
  p_description: options.description || null,
  p_reference_id: options.referenceId || null,
  p_reference_type: options.referenceType || null,
  p_allow_negative: options.allowNegative || false
});
```

**Verificar:**
1. ✅ `userId` está no formato UUID correto?
2. ✅ `amount` está sendo convertido corretamente?
3. ✅ Todos os parâmetros estão sendo passados?

---

## 🐛 DEBUGGING

### Adicionar Logs Temporários

**No arquivo:** `src/modules/financial/services/financial.service.js`

**Antes da chamada RPC (linha 119):**
```javascript
console.log('🔍 [DEBUG] Chamando RPC com:');
console.log('  userId:', userId);
console.log('  userId type:', typeof userId);
console.log('  userId length:', userId?.length);
console.log('  amount:', amount);
console.log('  amount type:', typeof amount);
```

**Após a chamada RPC (linha 128):**
```javascript
console.log('🔍 [DEBUG] Resposta da RPC:');
console.log('  data:', JSON.stringify(data, null, 2));
console.log('  error:', error ? JSON.stringify(error, null, 2) : 'null');
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

### 1. Testar RPC Diretamente no SQL Editor
- [ ] Executar query acima
- [ ] Verificar resultado
- [ ] Se der erro, anotar mensagem

### 2. Verificar Logs do Servidor
- [ ] Acessar Fly.io Dashboard → Logs
- [ ] Procurar por `[SHOOT]` ou `[FINANCIAL]`
- [ ] Verificar mensagens de erro específicas

### 3. Verificar Formato do UUID
- [ ] Confirmar que `req.user.userId` está no formato UUID
- [ ] Verificar se não há espaços ou caracteres extras
- [ ] Confirmar que é string válida

### 4. Testar Endpoint Manualmente
- [ ] Fazer login e obter token
- [ ] Chamar `/api/games/shoot` com token
- [ ] Verificar resposta completa

---

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Testar RPC no SQL Editor (URGENTE)

Execute a query acima no Supabase SQL Editor e me informe o resultado.

### Passo 2: Se RPC Funcionar no SQL Editor

O problema está na chamada do código. Verificar:
- Formato do UUID
- Tipos de dados dos parâmetros
- Configuração do Supabase client

### Passo 3: Se RPC Não Funcionar no SQL Editor

O problema está na RPC em si. Verificar:
- Código da RPC
- Permissões
- Estrutura da tabela `usuarios`

---

## 📝 INFORMAÇÕES IMPORTANTES

### UUID do Usuário:
```
4ddf8330-ae94-4e92-a010-bdc7fa254ad5
```

### Projeto:
```
goldeouro-production (gayopagjdrkcmkirmfvy)
```

### Saldo Atual:
```
R$ 50,00
```

---

## 🎯 CONCLUSÃO

**Status Atual:**
- ✅ Configuração correta
- ✅ Usuário existe
- ✅ RPCs instaladas
- ⚠️ **Próximo passo:** Testar RPC diretamente no SQL Editor

**Ação Imediata:**
1. Executar query de teste no SQL Editor
2. Compartilhar resultado
3. Com base no resultado, corrigir problema específico

---

**Data:** 2025-12-10 12:30 UTC  
**Status:** ✅ USUÁRIO CONFIRMADO - ⏳ AGUARDANDO TESTE DA RPC  
**Próximo passo:** Testar RPC diretamente no SQL Editor

