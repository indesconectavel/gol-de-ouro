# 🚀 AÇÃO IMEDIATA - CONFIGURAR CREDENCIAIS PRODUCTION

## ⚡ MÉTODO RÁPIDO (Recomendado)

Execute o script interativo:

```bash
node automation/configurar-credenciais-production.js
```

O script irá:
1. ✅ Verificar se `.env` existe
2. ✅ Mostrar status atual
3. ✅ Solicitar a Service Role Key de production
4. ✅ Salvar automaticamente
5. ✅ Opcionalmente testar a conexão

---

## 📋 MÉTODO MANUAL

### Passo 1: Obter a Service Role Key

1. Acesse: **https://app.supabase.com**
2. Faça login
3. Selecione o projeto **goldeouro-production**
4. Vá em **Settings** → **API**
5. Role até **Project API keys**
6. Localize **service_role** key (secret)
7. Clique em **Reveal**
8. **Copie a chave completa** (começa com `eyJ...`)

### Passo 2: Editar .env

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
# Supabase Production
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=sua_chave_aqui
```

**OU** se quiser usar a mesma chave para ambos:

```env
# Supabase (compartilhado)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
```

### Passo 3: Testar

```bash
node automation/teste_pix_v19.js production
```

---

## ✅ VALIDAÇÃO

Após configurar, execute:

```bash
# Teste rápido
node automation/teste_pix_v19.js production

# Teste completo
node automation/full_audit_v19.js

# Executar tudo
node automation/executar_v19.js
```

---

## 📝 ESTRUTURA DO .env RECOMENDADA

```env
# Supabase Staging (goldeouro-db)
SUPABASE_STAGING_URL=https://uatszaqzdqcwnfbipoxg.supabase.co
SUPABASE_STAGING_SERVICE_ROLE_KEY=chave_staging_aqui

# Supabase Production (goldeouro-production)
SUPABASE_PRODUCTION_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=chave_production_aqui

# Fallback (usa se não especificado)
SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chave_fallback_aqui
```

---

## ⚠️ IMPORTANTE

- ✅ **Nunca commite** o arquivo `.env` no Git
- ✅ **Mantenha a chave segura** e não compartilhe
- ✅ **A Service Role Key tem acesso total** ao banco

---

**Pronto para configurar? Execute:**

```bash
node automation/configurar-credenciais-production.js
```

