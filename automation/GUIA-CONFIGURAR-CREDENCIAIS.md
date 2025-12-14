# 🔐 GUIA RÁPIDO - CONFIGURAR CREDENCIAIS PRODUCTION

## Método 1: Script Interativo (Recomendado)

```bash
node automation/configurar-credenciais-production.js
```

O script irá:
1. Verificar se `.env` existe
2. Mostrar status atual das credenciais
3. Solicitar a Service Role Key de production
4. Salvar no arquivo `.env`
5. Opcionalmente testar a conexão

---

## Método 2: Manual

### Passo 1: Obter a Service Role Key

1. Acesse: https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto **goldeouro-production**
4. Vá em **Settings** → **API**
5. Role até **Project API keys**
6. Localize **service_role** key (secret)
7. Clique em **Reveal** para mostrar a chave
8. **Copie a chave completa** (começa com `eyJ...`)

### Passo 2: Configurar no .env

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione ou atualize a linha:

```env
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**Exemplo:**
```env
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoyMDk5OTk5OTk5fQ.abc123...
```

### Passo 3: Configurar Staging (se necessário)

Se você quiser usar chaves diferentes para staging e production:

```env
SUPABASE_STAGING_SERVICE_ROLE_KEY=chave_staging_aqui
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=chave_production_aqui
```

Ou use a mesma chave para ambos:

```env
SUPABASE_SERVICE_ROLE_KEY=chave_compartilhada_aqui
```

---

## Validação

Após configurar, teste a conexão:

```bash
# Testar PIX em production
node automation/teste_pix_v19.js production

# Testar Premiação em production
node automation/teste_premiacao_v19.js production

# Executar auditoria completa
node automation/full_audit_v19.js
```

---

## ⚠️ IMPORTANTE

1. **Nunca commite o arquivo `.env`** no Git
2. **A Service Role Key tem acesso total** ao banco de dados
3. **Mantenha a chave segura** e não compartilhe
4. **Use variáveis de ambiente** em produção (Fly.io, Vercel, etc.)

---

## Troubleshooting

### Erro: "Invalid API key"

**Causas possíveis:**
- Chave incorreta ou incompleta
- Chave expirada ou revogada
- Chave do projeto errado (staging vs production)

**Solução:**
1. Verificar se copiou a chave completa
2. Obter nova chave no Supabase Dashboard
3. Verificar se está usando a chave do projeto correto

### Erro: "Could not find the function"

**Causa:** RPC não existe ou tem assinatura diferente

**Solução:**
1. Verificar se o RPC existe no Supabase
2. Verificar assinatura do RPC
3. Ajustar scripts de teste se necessário

---

## Estrutura do .env Recomendada

```env
# Supabase Staging (goldeouro-db)
SUPABASE_STAGING_URL=https://uatszaqzdqcwnfbipoxg.supabase.co
SUPABASE_STAGING_SERVICE_ROLE_KEY=chave_staging_aqui

# Supabase Production (goldeouro-production)
SUPABASE_PRODUCTION_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=chave_production_aqui

# Fallback (usa a mesma chave para ambos se não especificado)
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chave_fallback_aqui
```

---

**Última atualização:** 2025-12-11

