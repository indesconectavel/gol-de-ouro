# ✅ SOLUÇÃO: Como Resetar a Service Role Key no Supabase

**Baseado nos seus prints, aqui está a solução definitiva:**

---

## 🎯 **SOLUÇÃO 1: Resetar via JWT Secret (MAIS SIMPLES)**

Esta é a forma mais direta. Resetar o JWT Secret vai gerar novas chaves automaticamente.

### **Passo a Passo:**

1. **No menu lateral esquerdo, clique em "JWT Keys"** (está logo abaixo de "API Keys")

2. **Você verá duas abas:**
   - "Legacy JWT Secret" (selecione esta)
   - "JWT Signing Keys"

3. **Na aba "Legacy JWT Secret", procure por:**
   - Um botão ou dropdown que diz **"Change legacy JWT secret"**
   - Ou um botão **"Regenerate"** ou **"Reset"**

4. **Clique nesse botão**

5. **Confirme a ação** (pode aparecer um aviso)

6. **Uma NOVA chave será gerada automaticamente**

7. **Depois de resetar:**
   - Vá em **Settings > API Keys > Legacy API Keys**
   - Clique em **"Reveal"** na chave "service_role secret"
   - **COPIE A NOVA CHAVE** (ela será diferente!)

---

## 🎯 **SOLUÇÃO 2: Criar Nova Secret Key (Alternativa)**

Se não conseguir resetar, podemos criar uma nova chave:

1. **Vá em Settings > API Keys**

2. **Clique na aba "API Keys"** (não Legacy)

3. **Na seção "Secret keys", clique no botão "+ New secret key"**

4. **Dê um nome** (ex: "backend-production")

5. **Copie a nova chave gerada**

6. **Use essa nova chave no Fly.io**

⚠️ **Nota:** Você precisará atualizar o código para usar a nova chave format (começa com `sb_secret_`)

---

## 🎯 **SOLUÇÃO 3: Via API (Se você tiver Access Token)**

Se você tiver o Access Token do Supabase, posso ajudar a resetar via API.

**Você tem o Access Token do Supabase?** (geralmente está em Settings > Access Tokens)

---

## 📋 **DEPOIS DE OBTER A NOVA CHAVE:**

Depois que você conseguir a nova chave, execute este comando no PowerShell:

```powershell
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE_AQUI]" --app goldeouro-backend-v2
```

**Substitua `[NOVA_CHAVE_AQUI]` pela chave que você copiou.**

---

## ✅ **VERIFICAÇÃO:**

Depois de atualizar, verifique se funcionou:

```powershell
# Verificar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# Deve mostrar: {"status":"ok","database":"connected",...}
```

---

## 🚨 **SE NADA FUNCIONAR:**

**Opção de último recurso:**

1. Crie um **novo projeto Supabase**
2. Copie o schema do banco atual
3. Use as novas credenciais

Mas isso é mais trabalhoso. Tente primeiro a Solução 1 (JWT Keys).

---

**Me avise qual solução funcionou ou se precisa de mais ajuda!**

