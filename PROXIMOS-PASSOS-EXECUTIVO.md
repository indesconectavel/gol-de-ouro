# 🚀 Próximos Passos - Resumo Executivo

## ✅ Correções Aplicadas (Aguardando Deploy)

1. ✅ **prom-client** - Movido para dependencies
2. ✅ **Tabela transacoes** - Todas as colunas adicionadas
3. ✅ **Heartbeat API Key** - Corrigido para usar `supabase-unified-config`
4. ✅ **Débito de saldo** - Código adicionado ao `GameController`

## 🎯 Próximos Passos (Ordem de Execução)

### 1️⃣ DEPLOY DAS CORREÇÕES 🔴 PRIORIDADE ALTA

**Ação:**
```bash
fly deploy --app goldeouro-backend-v2 --remote-only
```

**O que será deployado:**
- Correção do Heartbeat (não mais erro "Invalid API key")
- Código de débito de saldo no jogo
- Todas as correções anteriores

**Tempo estimado:** 2-3 minutos

---

### 2️⃣ VERIFICAR LOGS APÓS DEPLOY 🟡 PRIORIDADE ALTA

**Ação:** Acessar Fly.io Dashboard → Logs & Errors

**Verificar:**
- ✅ Ausência de erros `[HEARTBEAT] Erro ao enviar heartbeat: Invalid API key`
- ✅ Mensagens `✅ [HEARTBEAT] Heartbeat enviado: instance_xxx`
- ✅ Servidor iniciando sem crashes
- ✅ Máquinas estáveis (1/1 health checks)

**Tempo estimado:** 2-3 minutos

---

### 3️⃣ VERIFICAR USUÁRIO NO SUPABASE 🟡 PRIORIDADE MÉDIA

**Ação:** No Supabase SQL Editor, execute:

```sql
-- Verificar se usuário existe
SELECT id, email, saldo 
FROM usuarios 
WHERE email = 'free10signer@gmail.com';
```

**Se usuário não existir:**
- Criar usuário manualmente OU
- Usar outro email de usuário existente

**Se usuário existir:**
- Anotar o UUID correto
- Usar esse UUID nos testes

**Tempo estimado:** 1-2 minutos

---

### 4️⃣ TESTAR RPC DIRETAMENTE NO SUPABASE 🟡 PRIORIDADE MÉDIA

**Ação:** No Supabase SQL Editor, execute (usando UUID real do usuário):

```sql
SELECT public.rpc_deduct_balance(
  'UUID_DO_USUARIO_AQUI'::UUID,  -- Substituir pelo UUID real
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
- Verificar mensagem de erro específica
- Verificar se usuário tem saldo suficiente
- Verificar se RPC está instalada corretamente

**Tempo estimado:** 2-3 minutos

---

### 5️⃣ RETESTAR ENDPOINT /api/games/shoot 🟡 PRIORIDADE ALTA

**Ação:** Execute no terminal:

```bash
node src/scripts/testar_funcionalidades_principais.js
```

**OU teste manualmente:**

```bash
# 1. Login
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"Free10signer"}'

# 2. Fazer chute (usar token do passo 1)
curl -X POST https://goldeouro-backend-v2.fly.dev/api/games/shoot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"direction":"left","amount":5.00}'
```

**Resultado Esperado:**
- ✅ Status 200
- ✅ Resposta com resultado do chute
- ✅ Saldo debitado corretamente

**Tempo estimado:** 2-3 minutos

---

### 6️⃣ VALIDAÇÃO FINAL 🟢 PRIORIDADE MÉDIA

**Ação:** Teste completo end-to-end

**Fluxo:**
1. Login → Obter token
2. Verificar saldo inicial
3. Criar PIX → Gerar QR Code
4. Fazer múltiplos chutes (3-5 chutes)
5. Verificar que cada chute debita corretamente
6. Verificar prêmios quando há gol
7. Confirmar transações no banco

**Tempo estimado:** 5-10 minutos

---

## 📋 Checklist Rápido

### Antes do Deploy:
- [x] Correção do Heartbeat aplicada
- [x] Código de débito adicionado
- [x] Tabela transacoes corrigida

### Após Deploy:
- [ ] Servidor iniciou sem erros
- [ ] Heartbeat funcionando (sem erros)
- [ ] Endpoint /api/games/shoot funcionando
- [ ] Saldo sendo debitado

### Validação Final:
- [ ] Todas as funcionalidades testadas
- [ ] Sistema financeiro ACID garantido
- [ ] Jogo 100% funcional

---

## 🚨 Se Algo Der Errado

### Problema: Deploy falha
- Verificar logs do deploy
- Verificar se há erros de sintaxe
- Tentar deploy novamente

### Problema: Heartbeat ainda com erro
- Verificar variáveis de ambiente no Fly.io
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verificar logs detalhados

### Problema: RPC ainda retorna erro
- Verificar se RPC está instalada
- Verificar se usuário existe
- Verificar tipos de dados dos parâmetros

### Problema: Endpoint ainda falhando
- Verificar logs do servidor
- Verificar se RPC está funcionando
- Verificar se saldo está sendo debitado

---

## 📝 Arquivos de Referência

- `PLANO-ACAO-COMPLETO.md` - Plano detalhado completo
- `PROXIMOS-PASSOS-RESOLVER-JOGO.md` - Guia específico do jogo
- `CORRECAO-HEARTBEAT-API-KEY.md` - Correção do Heartbeat
- `RESUMO-CORRECOES-APLICADAS.md` - Resumo das correções

---

**Data:** 2025-12-10 11:52 UTC  
**Status:** ✅ CORREÇÕES APLICADAS - ⏳ AGUARDANDO DEPLOY  
**Próximo passo:** Deploy e verificação

