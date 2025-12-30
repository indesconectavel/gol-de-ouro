# 🔧 GUIA RÁPIDO - CORRIGIR API KEY DO SUPABASE
## Para alcançar Chave de Ouro (90%+)

**Tempo Estimado:** 15 minutos  
**Dificuldade:** Fácil

---

## 🎯 OBJETIVO

Corrigir a `SUPABASE_SERVICE_ROLE_KEY` que está retornando "Invalid API key" para alcançar a **Chave de Ouro** (90%+).

---

## 📋 PASSOS

### **PASSO 1: Obter API Key Correta** (5 minutos)

1. **Acessar Supabase Dashboard:**
   - URL: `https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api`
   - Fazer login se necessário

2. **Localizar Service Role Key:**
   - Na seção "Project API keys"
   - Procurar por `service_role` key
   - **⚠️ ATENÇÃO:** Esta é uma chave sensível, não compartilhe!

3. **Copiar a chave:**
   - Clicar em "Reveal" para mostrar a chave
   - Copiar a chave completa (começa com `eyJ...`)

---

### **PASSO 2: Atualizar no Fly.io** (5 minutos)

```bash
# 1. Fazer login no Fly.io (se necessário)
fly auth login

# 2. Atualizar secret
fly secrets set SUPABASE_SERVICE_ROLE_KEY="cole_a_chave_aqui" --app goldeouro-backend-v2

# 3. Verificar se foi atualizado
fly secrets list --app goldeouro-backend-v2

# 4. Reiniciar aplicação (opcional, mas recomendado)
fly apps restart goldeouro-backend-v2
```

**Exemplo:**
```bash
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --app goldeouro-backend-v2
```

---

### **PASSO 3: Atualizar no .env Local** (3 minutos)

1. **Abrir arquivo `.env`** na raiz do projeto

2. **Localizar linha:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. **Atualizar com a chave correta:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Salvar arquivo**

---

### **PASSO 4: Reexecutar Verificação** (2 minutos)

```bash
# Executar script de verificação
node src/scripts/executar_plano_acao_rapido_final.js
```

**Resultado Esperado:**
- ✅ Supabase conectado corretamente
- ✅ Backup verificado
- ✅ Migrations validadas
- ✅ Pontuação: 90/100 (90%+)
- ✅ Certificação: CHAVE_DE_OURO

---

## ✅ VERIFICAÇÃO

### **Verificar se funcionou:**

1. **Backend Health Check:**
   ```bash
   curl https://goldeouro-backend-v2.fly.dev/health
   ```
   - Deve retornar status 200 OK

2. **Reexecutar Script:**
   ```bash
   node src/scripts/executar_plano_acao_rapido_final.js
   ```
   - Verificar se Supabase está "OK"
   - Verificar se pontuação aumentou para 90%+

---

## ⚠️ PROBLEMAS COMUNS

### **Problema 1: "Invalid API key" ainda aparece**

**Solução:**
- Verificar se a chave foi copiada completamente (sem espaços)
- Verificar se a chave é a `service_role` key (não a `anon` key)
- Aguardar alguns segundos após atualizar no Fly.io

### **Problema 2: Fly.io não atualiza**

**Solução:**
- Verificar se está logado: `fly auth whoami`
- Verificar nome do app: `fly apps list`
- Reiniciar app: `fly apps restart goldeouro-backend-v2`

### **Problema 3: Script ainda mostra erro**

**Solução:**
- Verificar se `.env` local foi atualizado
- Verificar se não há espaços extras na chave
- Tentar novamente após alguns segundos

---

## 🎯 RESULTADO ESPERADO

Após corrigir a API key:

- ✅ **Pontuação:** 90/100 (90%+)
- ✅ **Certificação:** CHAVE_DE_OURO
- ✅ **Status:** Sistema 100% pronto para jogadores reais

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs do Fly.io: `fly logs --app goldeouro-backend-v2`
2. Verificar Supabase Dashboard → Logs
3. Reexecutar script de verificação

---

**Guia criado em:** 2025-12-09  
**Tempo estimado:** 15 minutos  
**Dificuldade:** Fácil

