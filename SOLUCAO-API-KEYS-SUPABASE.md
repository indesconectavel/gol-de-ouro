# 🔐 SOLUÇÃO - API KEYS SUPABASE
## Problema: Invalid API key
## Data: 2025-12-09

---

## ⚠️ PROBLEMA IDENTIFICADO

As JWT keys fornecidas estão retornando "Invalid API key". O Supabase agora usa **novas API keys** (`sb_publishable_*` e `sb_secret_*`) além das JWT keys legadas.

---

## 🔍 DIAGNÓSTICO

### Keys Fornecidas:
1. ✅ Service Role Key (JWT): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
2. ✅ Anon Key (JWT): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. ✅ Publishable Key: `sb_publishable_L4F6RNXqOk8YURbZMBpXUQ_ttymssoV`
4. ✅ Secret Key: `sb_secret_wyF1tfHA_Btxf__WToUuSA_wllQ_nCF`

### Erro:
```
Invalid API key
Hint: Double check your Supabase `anon` or `service_role` API key.
```

---

## ✅ SOLUÇÕES POSSÍVEIS

### SOLUÇÃO 1: Usar Legacy API Keys (Recomendado)

O Supabase ainda suporta as JWT keys legadas. Verifique:

1. **Acessar Supabase Dashboard:**
   - Settings → API → **"Legacy anon, service_role API keys"**
   - Verificar se as keys estão corretas

2. **Copiar Service Role Key correta:**
   - Deve começar com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
   - Deve ter 3 partes separadas por ponto (`.`)

3. **Atualizar .env:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### SOLUÇÃO 2: Usar Novas API Keys (Se necessário)

Se as JWT keys não funcionarem, podemos adaptar o código para usar as novas keys `sb_*`:

1. **Atualizar .env:**
   ```env
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_L4F6RNXqOk8YURbZMBpXUQ_ttymssoV
   SUPABASE_SECRET_KEY=sb_secret_wyF1tfHA_Btxf__WToUuSA_wllQ_nCF
   ```

2. **Adaptar código** (se necessário):
   - As novas keys podem funcionar diretamente com `createClient`
   - Testar se `sb_secret_*` funciona como service_role

### SOLUÇÃO 3: Regenerar API Keys

Se nenhuma das keys funcionar:

1. **Acessar Supabase Dashboard:**
   - Settings → API
   - Clicar em **"Reset"** na Service Role Key
   - **⚠️ ATENÇÃO:** Isso invalidará a key antiga
   - Copiar a nova key

2. **Atualizar .env com nova key**

---

## 🧪 TESTE RÁPIDO

Execute para testar conexão:

```bash
node src/scripts/testar_conexao_supabase.js
```

**Resultado esperado:**
- ✅ Conexão estabelecida com sucesso

---

## 📋 CHECKLIST

- [ ] Verificar Legacy API Keys no Supabase Dashboard
- [ ] Copiar Service Role Key correta
- [ ] Atualizar .env
- [ ] Testar conexão
- [ ] Se não funcionar, tentar novas keys sb_*
- [ ] Se ainda não funcionar, regenerar keys

---

## 🎯 PRÓXIMOS PASSOS

1. **Verificar keys no Dashboard:**
   - Acessar: https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/settings/api-keys/legacy
   - Verificar se as keys estão corretas

2. **Atualizar .env:**
   - Usar as keys corretas do Dashboard

3. **Testar novamente:**
   ```bash
   node src/scripts/testar_conexao_supabase.js
   ```

4. **Se funcionar:**
   - Executar validação Migration
   - Aplicar correções de segurança

---

## 📝 NOTA IMPORTANTE

As JWT keys fornecidas podem estar:
- ✅ Corretas mas precisando de validação no Dashboard
- ⚠️ Expired ou regeneradas
- ⚠️ Do projeto errado

**Ação:** Verificar no Supabase Dashboard se as keys estão ativas e corretas.

---

**Documento criado em:** 2025-12-09  
**Status:** ⚠️ **AGUARDANDO VALIDAÇÃO DAS KEYS**

