# 🚨 CONFIGURAÇÃO URGENTE DE CREDENCIAIS REAIS - GOL DE OURO v1.1.1

## ⚡ **CONFIGURAÇÃO EM 15 MINUTOS**

### **🔥 SUPABASE (5 minutos)**

1. **Acesse:** https://supabase.com
2. **Clique:** "New Project"
3. **Configure:**
   - Nome: `goldeouro-production`
   - Senha: `GolDeOuro2025!`
   - Região: `South America (São Paulo)`

4. **Aguarde** a criação do projeto (2-3 minutos)

5. **Vá em:** Settings > API
6. **Copie:**
   - Project URL: `https://xxxxx.supabase.co`
   - anon public: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - service_role: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

7. **Execute Schema:**
   - Vá em SQL Editor
   - Cole o conteúdo de `database/schema.sql`
   - Execute o script

8. **Configure Secrets:**
   ```bash
   fly secrets set SUPABASE_URL="https://xxxxx.supabase.co"
   fly secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

### **🔥 MERCADO PAGO (5 minutos)**

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Clique:** "Criar aplicação"
3. **Configure:**
   - Nome: `Gol de Ouro`
   - Descrição: `Sistema de apostas esportivas`

4. **Vá em:** Credenciais
5. **Copie:**
   - Access Token: `APP_USR-xxxxx`
   - Public Key: `APP_USR-xxxxx`

6. **Configure Webhook:**
   - Vá em Webhooks
   - URL: `https://goldeouro-backend.fly.dev/api/payments/webhook`
   - Eventos: `payment`

7. **Configure Secrets:**
   ```bash
   fly secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxx"
   fly secrets set MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxx"
   ```

### **🔥 DEPLOY E TESTE (5 minutos)**

1. **Deploy:**
   ```bash
   fly deploy
   ```

2. **Aguarde** o deploy (2-3 minutos)

3. **Teste:**
   ```bash
   # Health check
   curl https://goldeouro-backend.fly.dev/health
   
   # Login
   curl -X POST https://goldeouro-backend.fly.dev/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@goldeouro.lol","password":"test123"}'
   
   # PIX
   curl -X POST https://goldeouro-backend.fly.dev/api/payments/pix/criar \
     -H "Content-Type: application/json" \
     -d '{"valor":50,"email_usuario":"test@goldeouro.lol","cpf_usuario":"12345678901"}'
   ```

---

## 🎯 **RESULTADO ESPERADO**

Após a configuração, você deve ver:

### **✅ Health Check:**
```json
{
  "ok": true,
  "message": "Gol de Ouro Backend REAL Online",
  "banco": "REAL",
  "pix": "REAL"
}
```

### **✅ Login:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso!",
  "banco": "real"
}
```

### **✅ PIX:**
```json
{
  "success": true,
  "real": true,
  "banco": "real"
}
```

---

## 🚨 **COMANDOS URGENTES**

### **Configurar Supabase:**
```bash
fly secrets set SUPABASE_URL="https://xxxxx.supabase.co"
fly secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Configurar Mercado Pago:**
```bash
fly secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxx"
fly secrets set MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxx"
```

### **Deploy:**
```bash
fly deploy
```

### **Verificar:**
```bash
fly secrets list
fly status
fly logs
```

---

## 📞 **SUPORTE URGENTE**

Se houver problemas:

1. **Verificar Secrets:**
   ```bash
   fly secrets list
   ```

2. **Verificar Logs:**
   ```bash
   fly logs
   ```

3. **Verificar Status:**
   ```bash
   fly status
   ```

4. **Redeploy:**
   ```bash
   fly deploy --force
   ```

---

**🎯 TEMPO TOTAL: 15 MINUTOS**  
**🚀 RESULTADO: MVP 100% REAL E FUNCIONAL**
