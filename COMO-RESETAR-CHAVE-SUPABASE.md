# 🔐 Como Resetar a Service Role Key no Supabase

**Baseado no seu print do Supabase Dashboard**

---

## 📋 **OPÇÕES PARA RESETAR A CHAVE**

### **OPÇÃO 1: Usar a Aba "API Keys" (Nova Interface)**

1. No topo da página, você vê duas abas:
   - ✅ "Legacy API Keys" (atual)
   - ⭐ **"API Keys"** (clique aqui!)

2. Clique na aba **"API Keys"** (não Legacy)

3. Procure por:
   - "Secret API keys" ou
   - "Service Role" ou
   - Algum botão de "Reset" ou "Regenerate"

---

### **OPÇÃO 2: Resetar via JWT Secret**

1. No menu lateral esquerdo, procure por:
   - **"JWT Keys"** (pode estar em Settings ou Configuration)

2. Clique em **"JWT Keys"**

3. Procure por opção de:
   - "Regenerate JWT Secret" ou
   - "Reset JWT Secret" ou
   - "Rotate Secret"

⚠️ **ATENÇÃO:** Resetar o JWT Secret vai invalidar TODAS as chaves (anon e service_role), então você precisará atualizar ambas!

---

### **OPÇÃO 3: Usar o Botão "Reveal" Primeiro**

1. Na chave "service_role secret", clique no botão **"Reveal"**

2. Depois de revelar, pode aparecer um botão de **"Reset"** ou **"Regenerate"**

---

### **OPÇÃO 4: Verificar em General Settings**

1. No menu lateral, clique em **"General"** (em PROJECT SETTINGS)

2. Procure por:
   - "JWT Settings" ou
   - "API Settings" ou
   - "Security"

---

## 🎯 **RECOMENDAÇÃO**

**Tente nesta ordem:**

1. ✅ **Primeiro:** Clique na aba **"API Keys"** (não Legacy)
2. ✅ **Segundo:** Clique em **"Reveal"** na chave service_role e veja se aparece opção de reset
3. ✅ **Terceiro:** Vá em **Settings > JWT Keys** e procure por reset/regenerate

---

## 📸 **O QUE PROCURAR**

Procure por botões ou links com texto como:
- "Reset"
- "Regenerate"
- "Rotate"
- "Generate New"
- "Refresh"
- "Renew"

---

## ⚠️ **IMPORTANTE**

Se você resetar o JWT Secret (Opção 2), você precisará:
1. Atualizar `SUPABASE_SERVICE_ROLE_KEY` no Fly.io
2. Atualizar `SUPABASE_ANON_KEY` no Fly.io (se estiver usando)
3. Atualizar no frontend (se necessário)

---

**Me avise qual opção funcionou ou se encontrou o botão em outro lugar!**

