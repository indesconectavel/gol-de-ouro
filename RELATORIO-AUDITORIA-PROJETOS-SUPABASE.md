# 🔍 RELATÓRIO DE AUDITORIA - DOIS PROJETOS SUPABASE

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### Situação Atual:

**Projeto Configurado no Código:**
- URL: `https://gayopagjdrkcmkirmfvy.supabase.co`
- **Este projeto NÃO corresponde a nenhum dos dois projetos mencionados!**

**Projetos Identificados no Supabase Dashboard:**
1. `goldeouro-db` 
2. `goldeouro-production`

**Erro Atual:**
- ❌ `Invalid API key` - As credenciais não estão funcionando
- ❌ Projeto configurado não corresponde aos projetos existentes

---

## 🔍 ANÁLISE DETALHADA

### 1. Projeto Configurado Atualmente

**Identificador:** `gayopagjdrkcmkirmfvy`

**Status:**
- ⚠️ **NÃO corresponde a `goldeouro-db`**
- ⚠️ **NÃO corresponde a `goldeouro-production`**
- ❌ **Credenciais inválidas** (Invalid API key)

**Possíveis Cenários:**
1. Projeto antigo que foi deletado ou renomeado
2. Projeto de desenvolvimento/teste que não está mais ativo
3. Credenciais de um projeto diferente

---

### 2. Projetos no Supabase Dashboard

#### Projeto 1: `goldeouro-db`
- **Descrição:** Possivelmente projeto de desenvolvimento/testes
- **Status:** Ativo (visível no dashboard)
- **Região:** AWS | sa-east-1
- **Plano:** NANO

#### Projeto 2: `goldeouro-production`
- **Descrição:** Projeto de produção
- **Status:** Ativo (visível no dashboard)
- **Região:** AWS | sa-east-1
- **Plano:** NANO

---

## 🎯 PROBLEMAS IDENTIFICADOS

### Problema 1: Projeto Errado Configurado
- O código está tentando conectar a um projeto que não existe ou não está mais ativo
- As credenciais podem estar desatualizadas

### Problema 2: Confusão Entre Projetos
- Não está claro qual projeto deveria ser usado
- Pode haver dados em um projeto e código apontando para outro

### Problema 3: Credenciais Inválidas
- `SUPABASE_SERVICE_ROLE_KEY` pode estar incorreta
- Pode ser de um projeto diferente

---

## 🔧 SOLUÇÕES NECESSÁRIAS

### SOLUÇÃO 1: Identificar Qual Projeto Usar

**Perguntas a responder:**
1. Qual projeto contém os dados de produção?
2. Qual projeto tem o usuário `free10signer@gmail.com`?
3. Qual projeto tem as RPCs instaladas?
4. Qual projeto tem as migrations V19 aplicadas?

**Ação:**
- Verificar manualmente em cada projeto no Supabase Dashboard
- Comparar dados entre os dois projetos

---

### SOLUÇÃO 2: Atualizar Credenciais

**Passo 1:** Acessar o projeto correto no Supabase Dashboard

**Passo 2:** Obter credenciais corretas:
1. Ir em **Settings** → **API**
2. Copiar:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

**Passo 3:** Atualizar variáveis de ambiente:
- No arquivo `.env` local
- No Fly.io (via `fly secrets set`)

---

### SOLUÇÃO 3: Verificar Qual Projeto Tem os Dados

**No Supabase SQL Editor de cada projeto, executar:**

```sql
-- Verificar usuário de teste
SELECT id, email, saldo 
FROM usuarios 
WHERE email = 'free10signer@gmail.com';

-- Verificar RPCs instaladas
SELECT proname 
FROM pg_proc 
WHERE proname IN ('rpc_add_balance', 'rpc_deduct_balance', 'rpc_transfer_balance', 'rpc_get_balance');

-- Verificar tabelas críticas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'transacoes', 'lotes', 'chutes', 'premios', 'pagamentos_pix', 'system_heartbeat');
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Para `goldeouro-db`:
- [ ] Verificar se tem usuário `free10signer@gmail.com`
- [ ] Verificar se tem RPCs instaladas
- [ ] Verificar se tem migrations V19 aplicadas
- [ ] Verificar se tem dados de produção

### Para `goldeouro-production`:
- [ ] Verificar se tem usuário `free10signer@gmail.com`
- [ ] Verificar se tem RPCs instaladas
- [ ] Verificar se tem migrations V19 aplicadas
- [ ] Verificar se tem dados de produção

### Para Projeto Atual (`gayopagjdrkcmkirmfvy`):
- [ ] Verificar se projeto ainda existe
- [ ] Verificar se credenciais estão corretas
- [ ] Decidir se deve continuar usando ou migrar

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### Passo 1: Verificar Projetos Manualmente (URGENTE)
1. Acessar Supabase Dashboard
2. Verificar cada projeto individualmente
3. Identificar qual tem os dados corretos

### Passo 2: Decidir Qual Projeto Usar
- Se `goldeouro-production` tem tudo → usar este
- Se `goldeouro-db` tem tudo → usar este
- Se nenhum tem tudo → aplicar migrations no projeto escolhido

### Passo 3: Atualizar Configuração
- Atualizar `.env` com credenciais corretas
- Atualizar Fly.io secrets
- Testar conexão

### Passo 4: Validar Dados
- Verificar se usuário existe
- Verificar se RPCs funcionam
- Verificar se endpoints funcionam

---

## 📝 SCRIPTS ÚTEIS

### Script para Verificar Projeto Específico:

```bash
# Definir credenciais do projeto
export SUPABASE_URL="https://PROJETO.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Executar auditoria
node src/scripts/auditoria_projetos_supabase.js
```

### Script para Comparar Projetos:

Criar script que:
1. Conecta a `goldeouro-db`
2. Lista usuários, RPCs, tabelas
3. Conecta a `goldeouro-production`
4. Lista usuários, RPCs, tabelas
5. Compara resultados

---

## ⚠️ CONCLUSÃO

**PROBLEMA PRINCIPAL:**
O código está configurado para um projeto (`gayopagjdrkcmkirmfvy`) que não corresponde aos dois projetos existentes (`goldeouro-db` e `goldeouro-production`), e as credenciais estão inválidas.

**AÇÃO IMEDIATA NECESSÁRIA:**
1. ✅ Identificar qual projeto deve ser usado
2. ✅ Obter credenciais corretas desse projeto
3. ✅ Atualizar configuração no código e no Fly.io
4. ✅ Validar que tudo funciona após correção

---

**Data:** 2025-12-10 12:05 UTC  
**Status:** 🚨 PROBLEMA CRÍTICO IDENTIFICADO  
**Prioridade:** 🔴 ALTA - Bloqueia funcionamento do sistema

