# 🔍 ANÁLISE DETALHADA - ERRO 500 NO LOGIN
# Gol de Ouro v1.2.1 - Investigação Técnica

**Data:** 17/11/2025  
**Status:** 🔍 **ANÁLISE EM ANDAMENTO**  
**Problema:** Erro 500 no endpoint `/api/auth/login`

---

## 📋 SUMÁRIO DO PROBLEMA

### ❌ ERRO CRÍTICO DETECTADO

- **Endpoint:** `POST /api/auth/login`
- **Status:** 500 Internal Server Error
- **Resposta:** Vazia (sem corpo)
- **Impacto:** Bloqueia autenticação de usuários
- **Severidade:** 🔴 CRÍTICA

---

## 🧪 TESTES REALIZADOS

### Teste 1: Registro → Login
- ✅ Registro: **201 Created** (funcionando)
- ❌ Login: **500 Internal Server Error** (falhando)

### Teste 2: Novo Usuário → Login Imediato
- ✅ Registro: **201 Created** (funcionando)
- ❌ Login: **500 Internal Server Error** (falhando)

**Conclusão:** O problema é específico do endpoint de login, não do registro.

---

## 🔍 ANÁLISE DO CÓDIGO

### Código do Login (`authController.js`):

```javascript
static async login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return response.validationError(res, 'Email e senha são obrigatórios.');
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, senha_hash, username, saldo, tipo, ativo')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return response.unauthorized(res, 'Credenciais inválidas.');
    }

    // Verificar status da conta
    if (user.ativo !== true) {
      return response.forbidden(res, 'Conta desativada.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.senha_hash);

    if (!isPasswordValid) {
      return response.unauthorized(res, 'Credenciais inválidas.');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.tipo || 'jogador'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return response.success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        saldo: user.saldo || 0,
        tipo: user.tipo || 'jogador'
      }
    }, 'Login realizado com sucesso!');

  } catch (error) {
    console.error('Erro no login:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
}
```

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Problema na Query do Supabase ⚠️

**Código:**
```javascript
const { data: user, error: userError } = await supabase
  .from('usuarios')
  .select('id, email, senha_hash, username, saldo, tipo, ativo')
  .eq('email', email)
  .single();
```

**Possíveis Problemas:**
- ⚠️ Coluna `senha_hash` pode não existir (pode ser `senha` ou outro nome)
- ⚠️ Coluna `ativo` pode não existir ou ter tipo diferente
- ⚠️ `.single()` pode estar retornando erro se houver múltiplos usuários
- ⚠️ RLS (Row Level Security) pode estar bloqueando a query

**Teste Recomendado:**
- Verificar schema da tabela `usuarios` no Supabase
- Verificar se colunas existem e têm nomes corretos
- Verificar políticas RLS

---

### 2. Problema na Comparação de Senha ⚠️

**Código:**
```javascript
const isPasswordValid = await bcrypt.compare(password, user.senha_hash);
```

**Possíveis Problemas:**
- ⚠️ `user.senha_hash` pode ser `null` ou `undefined`
- ⚠️ Hash pode estar em formato incorreto
- ⚠️ Senha pode não ter sido hashada corretamente no registro

**Teste Recomendado:**
- Verificar se `senha_hash` está sendo salvo corretamente no registro
- Verificar formato do hash no banco

---

### 3. Problema na Geração do JWT ⚠️

**Código:**
```javascript
const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email, 
    role: user.tipo || 'jogador'
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);
```

**Possíveis Problemas:**
- ⚠️ `JWT_SECRET` pode ser `undefined` ou inválido
- ⚠️ `user.id` pode ser `null` ou `undefined`
- ⚠️ `JWT_EXPIRES_IN` pode ter formato inválido

**Teste Recomendado:**
- Verificar se `JWT_SECRET` está configurado no Fly.io
- Verificar se `JWT_EXPIRES_IN` está configurado corretamente

---

### 4. Problema no Response Handler ⚠️

**Código:**
```javascript
return response.success(res, {...}, 'Login realizado com sucesso!');
```

**Possíveis Problemas:**
- ⚠️ Response handler pode estar com erro
- ⚠️ Resposta pode estar sendo interceptada

**Teste Recomendado:**
- Verificar se response handler está funcionando corretamente
- Verificar se há interceptors que podem estar causando problema

---

## 🎯 DIAGNÓSTICO MAIS PROVÁVEL

### Causa Mais Provável: Problema na Query do Supabase

**Razão:**
1. Registro funciona (cria usuário corretamente)
2. Login falha imediatamente após busca do usuário
3. Resposta vazia indica que erro está sendo capturado no catch

**Hipóteses:**
1. **Coluna `senha_hash` não existe** - Pode ser `senha` ou outro nome
2. **RLS bloqueando query** - Política de segurança pode estar impedindo acesso
3. **`.single()` retornando erro** - Se houver múltiplos usuários ou nenhum usuário

---

## ✅ AÇÕES RECOMENDADAS

### 1. Verificar Schema da Tabela `usuarios` 🔴 URGENTE

**Ação:**
```sql
-- Executar no Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
```

**Verificar:**
- ✅ Nome da coluna de senha (`senha_hash`, `senha`, `password_hash`, etc.)
- ✅ Nome da coluna de status (`ativo`, `active`, `status`, etc.)
- ✅ Tipos de dados corretos

---

### 2. Verificar Políticas RLS 🔴 URGENTE

**Ação:**
```sql
-- Executar no Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

**Verificar:**
- ✅ Se RLS está ativado
- ✅ Se há políticas que bloqueiam acesso
- ✅ Se service role tem acesso completo

---

### 3. Verificar Logs do Fly.io 🔴 URGENTE

**Ação:**
```bash
fly logs -a goldeouro-backend-v2 | grep -i "login\|auth\|error\|supabase"
```

**Verificar:**
- ✅ Erros específicos do Supabase
- ✅ Erros de query
- ✅ Stack traces completos

---

### 4. Testar Query Manualmente 🔴 URGENTE

**Ação:**
Criar endpoint de teste temporário para verificar query:

```javascript
// Endpoint temporário de teste
router.post('/test-login-query', async (req, res) => {
  try {
    const { email } = req.body;
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, senha_hash, username, saldo, tipo, ativo')
      .eq('email', email)
      .single();
    
    return res.json({ data, error, hasData: !!data });
  } catch (err) {
    return res.json({ error: err.message, stack: err.stack });
  }
});
```

---

## 📊 RESUMO DA ANÁLISE

### Problema Identificado:
- ❌ Erro 500 no endpoint `/api/auth/login`
- ✅ Registro funciona corretamente
- ❌ Login falha consistentemente

### Causa Mais Provável:
- ⚠️ Problema na query do Supabase (coluna não existe ou RLS bloqueando)

### Próximos Passos:
1. 🔴 Verificar schema da tabela `usuarios`
2. 🔴 Verificar políticas RLS
3. 🔴 Verificar logs do Fly.io
4. 🔴 Testar query manualmente

---

**Data:** 17/11/2025  
**Versão:** v1.2.1  
**Status:** 🔍 **ANÁLISE COMPLETA - AGUARDANDO CORREÇÃO**

