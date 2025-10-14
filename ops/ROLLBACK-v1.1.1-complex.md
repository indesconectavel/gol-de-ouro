# 🔄 ROLLBACK v1.1.1 Complexo - GOL DE OURO

**Data:** 2025-01-27  
**Versão:** v1.1.1 Complexo  
**Status:** Backup completo criado

---

## **📋 COMO REVERTER PARA v1.1.1 COMPLEXO**

### **1️⃣ Git (Código)**
```bash
# Voltar para o branch de backup
git checkout backup/v1.1.1-complex

# Ou voltar para a tag específica
git checkout v1.1.1-complex

# Forçar push se necessário
git push origin backup/v1.1.1-complex --force
```

### **2️⃣ Vercel (Frontend)**

#### **Player Frontend**
```bash
# Deploy com configuração original
vercel --prod --cwd goldeouro-player

# Ou via dashboard Vercel:
# 1. Acesse https://vercel.com/dashboard
# 2. Selecione projeto "goldeouro-player"
# 3. Deploy → "Redeploy" → Commit: f7250bf
```

#### **Admin Frontend**
```bash
# Deploy com configuração original
vercel --prod --cwd goldeouro-admin

# Ou via dashboard Vercel:
# 1. Acesse https://vercel.com/dashboard
# 2. Selecione projeto "goldeouro-admin"
# 3. Deploy → "Redeploy" → Commit: f7250bf
```

### **3️⃣ Fly.io (Backend)**

#### **Deploy Backend Original**
```bash
# Deploy com configuração original
fly deploy --app goldeouro-backend-v2

# Ou via dashboard Fly.io:
# 1. Acesse https://fly.io/dashboard
# 2. Selecione app "goldeouro-backend-v2"
# 3. Deploy → "Redeploy" → Commit: f7250bf
```

### **4️⃣ Variáveis de Ambiente**

#### **Backend (.env)**
```env
NODE_ENV=production
PORT=8080
SESSION_SECRET=<<segredo_original>>
SUPABASE_URL=<<url_original>>
SUPABASE_ANON_KEY=<<key_original>>
SUPABASE_SERVICE_KEY=<<service_key_original>>
# Remover SIMPLE_MVP=true se existir
```

#### **Vercel (Player)**
```env
VITE_API_URL=https://goldeouro-backend-v2.fly.dev/api
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_USE_SANDBOX=false
VITE_LOG_LEVEL=error
```

#### **Vercel (Admin)**
```env
VITE_API_URL=https://goldeouro-backend-v2.fly.dev/api
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_USE_SANDBOX=false
VITE_LOG_LEVEL=error
```

### **5️⃣ Webhooks (Mercado Pago)**

#### **Configurar Webhook Original**
```
URL: https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook
Eventos: payment
```

### **6️⃣ Verificação Pós-Rollback**

#### **Health Checks**
```bash
# Backend
curl https://goldeouro-backend-v2.fly.dev/health

# Player
curl https://www.goldeouro.lol

# Admin
curl https://admin.goldeouro.lol
```

#### **Teste de Login**
```bash
# Player
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"password"}'

# Admin
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"G0ld3@0ur0_2025!"}'
```

---

## **📁 ARQUIVOS DE BACKUP**

### **Configurações Salvas em `ops/snapshots/v1.1.1-complex/`**
- `player-vercel.json` - Configuração Vercel Player
- `admin-vercel.json` - Configuração Vercel Admin
- `fly.toml` - Configuração Fly.io Backend
- `Dockerfile` - Docker Backend
- `.env.example` - Exemplo de variáveis

### **Commit de Backup**
- **Hash:** `f7250bf`
- **Branch:** `backup/v1.1.1-complex`
- **Tag:** `v1.1.1-complex`

---

## **⚠️ OBSERVAÇÕES IMPORTANTES**

1. **Dados do Banco:** Não serão afetados pelo rollback
2. **Usuários:** Permanecerão intactos
3. **Transações:** Histórico preservado
4. **PIX:** Volta para simulação (não real)
5. **Admin:** Volta para dados fictícios

---

## **🚨 EM CASO DE PROBLEMAS**

### **Rollback de Emergência (5 minutos)**
```bash
# 1. Voltar código
git checkout backup/v1.1.1-complex

# 2. Deploy backend
fly deploy --app goldeouro-backend-v2

# 3. Deploy frontends
vercel --prod --cwd goldeouro-player
vercel --prod --cwd goldeouro-admin

# 4. Verificar
curl https://goldeouro-backend-v2.fly.dev/health
```

### **Contato de Suporte**
- **WhatsApp:** +55 11 99999-9999
- **Email:** suporte@goldeouro.lol
- **Discord:** #gol-de-ouro

---

**Rollback documentado em:** 2025-01-27 15:45 BRT  
**Próxima etapa:** Implementação SIMPLE_MVP