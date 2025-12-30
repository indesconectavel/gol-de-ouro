# ✅ GUIA DEFINITIVO: Resetar Service Role Key no Supabase

**Baseado nos seus prints - Solução Confirmada**

---

## 🎯 **SOLUÇÃO: Resetar JWT Secret**

Pelos seus prints, vejo que você está na aba "Legacy API Keys" e não há botão de reset direto. A solução é resetar o **JWT Secret**, que vai gerar novas chaves automaticamente.

---

## 📋 **PASSO A PASSO DETALHADO:**

### **PASSO 1: Ir para JWT Keys**

1. No menu lateral esquerdo, clique em **"JWT Keys"** (está logo abaixo de "API Keys")

2. Você verá duas abas:
   - **"Legacy JWT Secret"** ← **CLIQUE AQUI**
   - "JWT Signing Keys"

### **PASSO 2: Resetar o JWT Secret**

1. Na aba **"Legacy JWT Secret"**, procure por:
   - Um botão ou dropdown que diz **"Change legacy JWT secret"**
   - Ou um botão **"Regenerate"** ou **"Reset"**

2. **Clique nesse botão/dropdown**

3. Uma mensagem de confirmação pode aparecer avisando que isso vai invalidar as chaves atuais

4. **Confirme a ação**

5. ⚠️ **AGUARDE** - O Supabase vai gerar um novo JWT Secret e novas chaves automaticamente

### **PASSO 3: Copiar a Nova Service Role Key**

1. Depois de resetar, volte para **Settings > API Keys > Legacy API Keys**

2. Na chave **"service_role secret"**, clique no botão **"Reveal"**

3. **COPIE A NOVA CHAVE COMPLETA** (ela começa com `eyJhbGci...`)

4. ⚠️ **IMPORTANTE:** A última parte da chave (após o último ponto) será **DIFERENTE** da chave antiga!

   **Chave antiga (comprometida):**
   ```
   ...BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU
   ```

   **Nova chave (segura):**
   ```
   ...[OUTRA_ASSINATURA_DIFERENTE]
   ```

### **PASSO 4: Atualizar no Fly.io**

Depois de copiar a nova chave, **me envie aqui** e eu atualizo no Fly.io automaticamente!

Ou execute você mesmo:

```powershell
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[NOVA_CHAVE_AQUI]" --app goldeouro-backend-v2
```

### **PASSO 5: Verificar**

```powershell
# Verificar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Deve mostrar: `{"status":"ok","database":"connected",...}`

---

## ⚠️ **IMPORTANTE:**

Ao resetar o JWT Secret:
- ✅ A chave `service_role` será regenerada (nova)
- ✅ A chave `anon` também será regenerada (nova)
- ⚠️ Você precisará atualizar **ambas** no Fly.io se estiver usando

---

## 🔄 **ALTERNATIVA: Criar Nova Secret Key (Se não conseguir resetar)**

Se não conseguir resetar o JWT Secret:

1. Vá em **Settings > API Keys**

2. Clique na aba **"API Keys"** (não Legacy)

3. Na seção **"Secret keys"**, clique em **"+ New secret key"**

4. Dê um nome (ex: "backend-production-v2")

5. **COPIE A NOVA CHAVE** (começa com `sb_secret_`)

6. ⚠️ **Nota:** Essa chave tem formato diferente (`sb_secret_` ao invés de `eyJhbGci...`)

7. Você precisará atualizar o código para usar essa nova chave

---

## 📞 **PRECISA DE AJUDA?**

Se ainda não conseguir:

1. **Me envie um print** da página "JWT Keys" > "Legacy JWT Secret"
2. Ou me diga **exatamente** o que você vê quando clica em "JWT Keys"
3. Posso ajudar a fazer via API se você tiver o Access Token do Supabase

---

**Tente primeiro resetar o JWT Secret (Passo 1-3) e me envie a nova chave quando conseguir!**

