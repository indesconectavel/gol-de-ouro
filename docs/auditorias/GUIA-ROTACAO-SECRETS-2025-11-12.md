# 🔐 Guia de Rotação de Secrets Comprometidos - 12/11/2025

## 🚨 **URGENTE: Secret Comprometido Detectado**

O GitGuardian detectou que o **Supabase Service Role JWT** foi exposto no commit `def1d3b` no arquivo `implementar-credenciais-supabase-recentes.js`.

**Status:** ✅ Arquivo removido do repositório  
**Ação Necessária:** ⚠️ **ROTACIONAR SECRETS IMEDIATAMENTE**

---

## 📋 **Passo a Passo para Rotação**

### **1. Gerar Nova Service Role Key no Supabase**

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard
   - Projeto: `goldeouro-production` (ID: `gayopagjdrkcmkirmfvy`)

2. **Navegue até Settings > API:**
   - No menu lateral, clique em "Settings"
   - Selecione "API"

3. **Gere Nova Service Role Key:**
   - Role para `service_role`
   - Clique em "Reset" ou "Regenerate" na seção "Service Role Key"
   - ⚠️ **ATENÇÃO:** Isso invalidará a chave antiga imediatamente
   - Copie a nova chave (começa com `eyJhbGci...`)

4. **Anote a Nova Chave:**
   ```
   NOVA_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **2. Atualizar Secret no Fly.io**

Execute o comando abaixo substituindo `[NOVA_CHAVE]` pela chave gerada:

```bash
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE]" --app goldeouro-backend-v2
```

**Exemplo:**
```bash
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.NOVA_ASSINATURA_AQUI" --app goldeouro-backend-v2
```

---

### **3. Verificar Secrets Atualizados**

```bash
# Listar todos os secrets
flyctl secrets list --app goldeouro-backend-v2

# Verificar se SUPABASE_SERVICE_ROLE_KEY foi atualizado
# O DIGEST deve ser diferente do anterior
```

---

### **4. Reiniciar Aplicação (Opcional)**

Se a aplicação não reiniciar automaticamente após atualizar o secret:

```bash
flyctl apps restart goldeouro-backend-v2
```

---

### **5. Verificar Funcionamento**

1. **Verificar Health Check:**
   ```bash
   curl https://goldeouro-backend-v2.fly.dev/health
   ```

2. **Verificar Logs:**
   ```bash
   flyctl logs --app goldeouro-backend-v2
   ```

3. **Verificar Conexão com Supabase:**
   - Os logs devem mostrar: `✅ [SUPABASE] Conectado com sucesso`
   - Não deve haver erros de autenticação

---

## ⚠️ **Outros Secrets que Podem Estar Comprometidos**

Verifique se estes secrets também estavam no arquivo removido:

- ✅ `SUPABASE_URL` - Provavelmente seguro (URL pública)
- ⚠️ `SUPABASE_ANON_KEY` - Verificar se estava exposta
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` - **COMPROMETIDA - ROTACIONAR**
- ⚠️ `JWT_SECRET` - Verificar se estava exposta
- ⚠️ `MERCADOPAGO_ACCESS_TOKEN` - Verificar se estava exposta

---

## 🔍 **Verificação de Comprometimento**

### **Secrets Atuais no Fly.io:**

Execute para verificar quais secrets estão configurados:

```bash
flyctl secrets list --app goldeouro-backend-v2
```

### **Secrets que Estavam no Arquivo Removido:**

De acordo com o GitGuardian, o arquivo continha:
- `SUPABASE_URL`: `https://gayopagjdrkcmkirmfvy.supabase.co` ✅ (URL pública, OK)
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGci...` 🔴 (COMPROMETIDA)
- `SUPABASE_ANON_KEY`: `eyJhbGci...` ⚠️ (Verificar)
- `JWT_SECRET`: `Jc+pKwHQVwnF5YsprvcyKemtKeFQMCHYDPiIvgIkMHAug9DAa+Udf0hyUxug+vR7HTbOz3ouZq+bhpo201tNdg==` ⚠️ (Verificar)
- `MERCADOPAGO_ACCESS_TOKEN`: ⚠️ (Verificar se estava presente)

---

## 📝 **Checklist de Rotação**

- [ ] Gerar nova Service Role Key no Supabase
- [ ] Atualizar `SUPABASE_SERVICE_ROLE_KEY` no Fly.io
- [ ] Verificar se `SUPABASE_ANON_KEY` precisa ser rotacionada
- [ ] Verificar se `JWT_SECRET` precisa ser rotacionada
- [ ] Verificar se `MERCADOPAGO_ACCESS_TOKEN` precisa ser rotacionada
- [ ] Reiniciar aplicação se necessário
- [ ] Verificar health check
- [ ] Verificar logs para erros
- [ ] Testar funcionalidades críticas (login, pagamentos)

---

## 🚨 **Se Algo Der Errado**

### **Rollback da Service Role Key:**

Se precisar voltar à chave antiga (não recomendado):

1. No Supabase Dashboard, você pode ter salvo a chave antiga
2. Ou use a chave de backup se tiver uma

### **Verificar Status da Aplicação:**

```bash
# Status geral
flyctl status --app goldeouro-backend-v2

# Logs em tempo real
flyctl logs --app goldeouro-backend-v2 --follow

# Verificar máquinas
flyctl machines list --app goldeouro-backend-v2
```

---

## 📞 **Suporte**

Se encontrar problemas durante a rotação:

1. Verifique os logs: `flyctl logs --app goldeouro-backend-v2`
2. Verifique o status: `flyctl status --app goldeouro-backend-v2`
3. Consulte a documentação do Supabase: https://supabase.com/docs/guides/api
4. Consulte a documentação do Fly.io: https://fly.io/docs/reference/secrets/

---

**Data de Criação:** 12 de Novembro de 2025  
**Última Atualização:** 12 de Novembro de 2025  
**Status:** ⚠️ **AÇÃO URGENTE NECESSÁRIA**

