# 🔧 PROPOSTA DE CORREÇÃO - ERRO 500 NO LOGIN
# Gol de Ouro v1.2.1 - Correção Técnica

**Data:** 17/11/2025  
**Status:** 📋 **PROPOSTA DE CORREÇÃO**  
**Problema:** Erro 500 no endpoint `/api/auth/login`

---

## 📋 ANÁLISE DO PROBLEMA

### Comparação: Registro vs Login

**REGISTRO (funciona):**
```javascript
.select('id, email, username, saldo, tipo')
```

**LOGIN (falha):**
```javascript
.select('id, email, senha_hash, username, saldo, tipo, ativo')
```

### Diferenças Identificadas:
1. Login tenta selecionar `senha_hash` (não selecionado no registro)
2. Login tenta selecionar `ativo` (não selecionado no registro)

---

## 🔍 CAUSA PROVÁVEL

### Problema: Colunas Não Existem ou RLS Bloqueando

**Hipóteses:**
1. ⚠️ Coluna `senha_hash` não existe na tabela `usuarios`
2. ⚠️ Coluna `ativo` não existe na tabela `usuarios`
3. ⚠️ RLS está bloqueando acesso a essas colunas
4. ⚠️ Nome das colunas está diferente no banco

---

## ✅ PROPOSTA DE CORREÇÃO

### Opção 1: Verificar Schema e Ajustar Query (RECOMENDADO)

**Ação:**
1. Verificar schema real da tabela `usuarios` no Supabase
2. Ajustar query do login para usar nomes corretos das colunas
3. Se necessário, criar/adicionar colunas faltantes

**Código Proposto:**
```javascript
// Verificar primeiro quais colunas existem
// Ajustar select baseado no schema real
const { data: user, error: userError } = await supabase
  .from('usuarios')
  .select('id, email, senha_hash, username, saldo, tipo, ativo')
  .eq('email', email)
  .single();
```

---

### Opção 2: Usar SupabaseAdmin no Login (SE RLS BLOQUEAR)

**Ação:**
Se RLS estiver bloqueando, usar `supabaseAdmin` em vez de `supabase`:

**Código Proposto:**
```javascript
// Usar supabaseAdmin para bypass de RLS
const { data: user, error: userError } = await supabaseAdmin
  .from('usuarios')
  .select('id, email, senha_hash, username, saldo, tipo, ativo')
  .eq('email', email)
  .single();
```

---

### Opção 3: Adicionar Tratamento de Erro Mais Detalhado

**Ação:**
Adicionar logs mais detalhados para identificar erro específico:

**Código Proposto:**
```javascript
// Buscar usuário
const { data: user, error: userError } = await supabase
  .from('usuarios')
  .select('id, email, senha_hash, username, saldo, tipo, ativo')
  .eq('email', email)
  .single();

if (userError) {
  console.error('Erro ao buscar usuário:', userError);
  console.error('Detalhes:', {
    code: userError.code,
    message: userError.message,
    details: userError.details,
    hint: userError.hint
  });
  return response.unauthorized(res, 'Credenciais inválidas.');
}

if (!user) {
  console.error('Usuário não encontrado para email:', email);
  return response.unauthorized(res, 'Credenciais inválidas.');
}
```

---

## 🎯 RECOMENDAÇÃO FINAL

### Passo 1: Verificar Schema (URGENTE)

**Executar no Supabase SQL Editor:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
```

### Passo 2: Verificar RLS (URGENTE)

**Executar no Supabase SQL Editor:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

### Passo 3: Aplicar Correção

**Baseado nos resultados:**
- Se colunas não existem → Criar/adicionar colunas
- Se RLS bloqueando → Usar `supabaseAdmin` ou ajustar políticas
- Se nomes diferentes → Ajustar query para usar nomes corretos

---

## ⚠️ IMPORTANTE

**NÃO MODIFICAR CÓDIGO SEM:**
1. ✅ Verificar schema real da tabela
2. ✅ Verificar políticas RLS
3. ✅ Verificar logs do Fly.io
4. ✅ Validar impacto da correção

---

**Data:** 17/11/2025  
**Versão:** v1.2.1  
**Status:** 📋 **PROPOSTA DE CORREÇÃO - AGUARDANDO VALIDAÇÃO**

