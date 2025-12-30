# 🔧 GUIA: APLICAR RPC FUNCTIONS NO SUPABASE

**Data:** 2025-01-12  
**Prioridade:** 🔴 **CRÍTICA** - Sistema não funcionará sem isso  
**Tempo estimado:** 5 minutos

---

## ⚠️ IMPORTANTE

**As RPC functions DEVEM ser aplicadas no Supabase antes de usar o sistema financeiro ACID.**

Sem essas functions, todas as operações financeiras falharão.

---

## 📋 PASSO A PASSO

### Passo 1: Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **goldeouro-production** (ou o projeto correto)

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (ou use o editor existente)

### Passo 3: Copiar e Colar SQL

1. Abra o arquivo: `database/rpc-financial-acid.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase

### Passo 4: Executar SQL

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (deve levar alguns segundos)
3. Verifique se apareceu mensagem de sucesso

### Passo 5: Verificar Criação das Functions

Execute esta query para verificar:

```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'rpc_%'
ORDER BY routine_name;
```

**Resultado Esperado:**
Deve retornar 4 funções:
- `rpc_add_balance`
- `rpc_deduct_balance`
- `rpc_transfer_balance`
- `rpc_get_balance`

### Passo 6: Testar Function Manualmente (Opcional)

Teste rápido para garantir que funciona:

```sql
-- Substitua 'USER-UUID-AQUI' por um UUID real de usuário do seu banco
SELECT public.rpc_get_balance('USER-UUID-AQUI'::UUID, false);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "balance": 0.00
}
```

---

## ✅ VERIFICAÇÃO FINAL

Após aplicar, verifique:

- [ ] 4 funções criadas no Supabase
- [ ] Nenhum erro na execução do SQL
- [ ] Teste manual retorna JSON válido

---

## 🚨 TROUBLESHOOTING

### Erro: "function already exists"

**Solução:** As functions já existem. Isso é OK, elas serão atualizadas.

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando a conta com permissões de administrador do projeto.

### Erro: "relation usuarios does not exist"

**Solução:** Execute primeiro o schema completo (`SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql`).

---

## 📝 NOTAS

- As functions são `SECURITY DEFINER`, então executam com privilégios elevados
- Isso está correto - devem ser chamadas apenas pelo backend usando `service_role` key
- Nunca exponha essas functions diretamente ao frontend

---

**Após aplicar, o sistema financeiro ACID estará 100% funcional!**

