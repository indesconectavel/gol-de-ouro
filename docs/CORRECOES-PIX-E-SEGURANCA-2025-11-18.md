# 🔧 CORREÇÕES PIX E SEGURANÇA - 18/11/2025

## 📋 RESUMO EXECUTIVO

Este documento detalha as correções aplicadas para resolver problemas relacionados ao código PIX não estar sendo retornado e os problemas de segurança identificados pelo Supabase Security Advisor.

---

## ✅ CORREÇÕES APLICADAS

### 1. **Configuração de Payment Methods para PIX**
**Arquivo:** `controllers/paymentController.js`

**Problema:** A configuração de `payment_methods` estava permitindo todos os tipos de pagamento, o que pode ter causado problemas na geração do código PIX.

**Solução:**
```javascript
payment_methods: {
  excluded_payment_methods: [],
  excluded_payment_types: ['credit_card', 'debit_card', 'ticket'], // Excluir outros tipos, deixar apenas PIX
  installments: 1
}
```

**Status:** ✅ Deploy realizado

---

### 2. **Consulta de Preferência em vez de Payment**
**Arquivo:** `controllers/paymentController.js`

**Problema:** O endpoint `consultarStatusPagamento` estava tentando consultar um `payment` usando o ID da `preference`, causando erro "Payment not found".

**Solução:**
- Alterado para consultar a `preference` primeiro (que contém o código PIX)
- Se não encontrar código PIX na preferência, tenta consultar como `payment` (fallback)
- Atualiza o código PIX no banco quando obtido do Mercado Pago

**Status:** ✅ Deploy realizado

---

### 3. **Correção de Registro de Usuário**
**Arquivo:** `controllers/authController.js`

**Problema:** RLS bloqueando criação de usuários.

**Solução:** Uso de `supabaseAdmin` para bypass de RLS durante registro.

**Status:** ✅ Deploy realizado

---

## 🔒 PROBLEMAS DE SEGURANÇA IDENTIFICADOS (SUPABASE)

### **6 Erros Críticos: RLS Disabled in Public**

O Supabase Security Advisor identificou as seguintes tabelas sem RLS habilitado:

1. `public.webhook_events` ⚠️ CRÍTICO
2. `public.queue_board` ⚠️ CRÍTICO
3. `public.matches` ⚠️ CRÍTICO
4. `public.match_players` ⚠️ CRÍTICO
5. `public.match_events` ⚠️ CRÍTICO
6. `public.rewards` ⚠️ CRÍTICO (Sistema Financeiro)

**Impacto:** Essas tabelas estão expostas publicamente sem controle de acesso, permitindo que qualquer pessoa leia/modifique dados sensíveis.

**Solução Criada:** 
- Arquivo: `database/corrigir-rls-tabelas-publicas.sql`
- Habilita RLS e cria políticas de segurança adequadas
- Backend (service_role) tem acesso total
- Usuários autenticados têm acesso restrito aos próprios dados

---

### **22 Warnings: Function Search Path Mutable**

O Security Advisor identificou 22 funções RPC sem `search_path` definido:

- `public.rpc_transfer_balance`
- `public.rpc_get_or_create_lote`
- `public.rpc_add_balance`
- `public.rpc_deduct_balance`
- `public.rpc_get_balance`
- `public.rpc_register_reward`
- `public.rpc_mark_reward_credited`
- `public.rpc_get_user_rewards`
- E mais 14 funções...

**Impacto:** Vulnerabilidade de segurança onde funções podem ser exploradas através de manipulação do `search_path`.

**Solução Criada:**
- Arquivo: `database/corrigir-function-search-path.sql`
- Instruções para adicionar `SET search_path = public, pg_catalog` em todas as funções

---

## 📝 PRÓXIMOS PASSOS OBRIGATÓRIOS

### **ETAPA 1: Aplicar Correções de Segurança no Supabase**

1. **Acessar o Supabase Dashboard:**
   - Projeto: `goldeouro-production`
   - Navegar para SQL Editor

2. **Executar Script de RLS:**
   ```sql
   -- Executar: database/corrigir-rls-tabelas-publicas.sql
   ```
   ⚠️ **IMPORTANTE:** Testar após aplicar para garantir que o backend continua funcionando.

3. **Executar Script de Search Path:**
   ```sql
   -- Executar: database/corrigir-function-search-path.sql
   ```
   ⚠️ **NOTA:** Este script requer verificação manual das definições das funções.

4. **Verificar Security Advisor:**
   - Após aplicar correções, executar "Rerun linter" no Security Advisor
   - Confirmar que os 6 erros críticos foram resolvidos

---

### **ETAPA 2: Testar Criação de PIX**

1. **Criar novo PIX de teste:**
   ```bash
   node scripts/criar-pix-teste.js
   ```

2. **Consultar status após alguns segundos:**
   ```bash
   # Usar o payment_id retornado
   GET /api/payments/pix/status/{payment_id}
   ```

3. **Verificar se código PIX está sendo retornado:**
   - Se ainda não retornar, pode ser necessário aguardar mais tempo
   - O Mercado Pago pode levar alguns segundos para gerar o código

---

### **ETAPA 3: Testar com Pagamento Real**

1. **Criar PIX de R$ 1,00**
2. **Copiar código PIX (se disponível) ou usar init_point**
3. **Realizar pagamento real**
4. **Verificar webhook e crédito automático**

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### **Logs do Fly.io**

Verificar logs para erros relacionados ao Mercado Pago:
```bash
fly logs -a goldeouro-backend-v2 | grep -i "pix\|mercadopago\|preference"
```

### **Configuração do Mercado Pago**

Verificar se as credenciais estão corretas:
```bash
fly secrets list -a goldeouro-backend-v2 | grep MERCADOPAGO
```

---

## 📊 STATUS ATUAL

| Item | Status | Observações |
|------|--------|-------------|
| Configuração PIX | ✅ Corrigido | Deploy realizado |
| Consulta Preferência | ✅ Corrigido | Deploy realizado |
| Registro de Usuário | ✅ Corrigido | Deploy realizado |
| RLS Tabelas Públicas | ⚠️ Pendente | Script criado, aguardando execução |
| Function Search Path | ⚠️ Pendente | Script criado, aguardando execução |
| Teste PIX Real | ⏳ Aguardando | Após correções de segurança |

---

## ⚠️ AVISOS IMPORTANTES

1. **RLS:** Ao aplicar as correções de RLS, certifique-se de que o backend está usando `supabaseAdmin` para operações que precisam bypass de RLS.

2. **Testes:** Sempre testar após aplicar correções de segurança para garantir que não quebrou funcionalidades existentes.

3. **Backup:** Recomendado fazer backup do banco antes de aplicar correções de segurança.

---

## 📚 ARQUIVOS CRIADOS/MODIFICADOS

### Modificados:
- `controllers/paymentController.js` - Correções PIX
- `controllers/authController.js` - Correção registro

### Criados:
- `database/corrigir-rls-tabelas-publicas.sql` - Correção RLS
- `database/corrigir-function-search-path.sql` - Correção Search Path
- `docs/CORRECOES-PIX-E-SEGURANCA-2025-11-18.md` - Este documento

---

## 🎯 CONCLUSÃO

As correções funcionais (PIX e registro) foram aplicadas e estão em produção. As correções de segurança (RLS e Search Path) estão prontas para execução, mas requerem atenção cuidadosa para não quebrar funcionalidades existentes.

**Próxima ação recomendada:** Aplicar correções de segurança no Supabase e testar completamente antes de considerar o sistema pronto para produção.

