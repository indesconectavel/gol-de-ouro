# 📋 README DEPLOY ATUAL - v1.1.1 Complexo

**Data:** 2025-10-01  
**Versão:** v1.1.1 Complexo  
**Status:** Snapshot de Produção

---

## 🌐 **URLs DE PRODUÇÃO**

- **Player:** `https://www.goldeouro.lol`
- **Admin:** `https://admin.goldeouro.lol`
- **Backend:** `https://goldeouro-backend-v2.fly.dev`

---

## 🏗️ **ARQUITETURA ATUAL**

### **Frontend Player (Vercel)**
- **Framework:** React + Vite + PWA
- **Build:** `npm run build` → `dist/`
- **Deploy:** Vercel (automatico via git)
- **Config:** `vercel.json` (rewrites, headers básicos)

### **Frontend Admin (Vercel)**
- **Framework:** React + Vite + TypeScript
- **Build:** `npm run build` → `dist/`
- **Deploy:** Vercel (automatico via git)
- **Config:** `vercel.json` (CSP agressiva, SW desabilitado)

### **Backend (Fly.io)**
- **Framework:** Node.js + Express
- **Porta:** 8080
- **Deploy:** `fly deploy --app goldeouro-backend-v2`
- **Config:** `fly.toml` + `Dockerfile`

---

## 🔧 **CONFIGURAÇÕES CRÍTICAS**

### **Vercel Player (vercel.json)**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://goldeouro-backend-v2.fly.dev/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" },
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

### **Vercel Admin (vercel.json)**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://goldeouro-backend-v2.fly.dev/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://www.goldeouro.lol; font-src 'self' data:; connect-src 'self' data: blob: https://goldeouro-backend-v2.fly.dev https://www.goldeouro.lol; media-src 'self' data: blob:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "false"
        }
      ]
    }
  ]
}
```

### **Fly.io (fly.toml)**
```toml
app = "goldeouro-backend"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[[services]]
  protocol = "tcp"
  internal_port = 8080
```

---

## 🔑 **VARIÁVEIS DE AMBIENTE**

### **Backend (.env)**
```env
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
MP_ACCESS_TOKEN=your-mercado-pago-token
PIX_WEBHOOK_URL=https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook
FRONTEND_ORIGIN=https://www.goldeouro.lol
```

### **Frontend (Vercel)**
```env
VITE_API_URL=/api
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_USE_SANDBOX=false
VITE_LOG_LEVEL=error
```

---

## 🚀 **COMANDOS DE DEPLOY**

### **Backend (Fly.io)**
```bash
# Deploy
fly deploy --app goldeouro-backend-v2

# Logs
fly logs --app goldeouro-backend-v2

# Status
fly status --app goldeouro-backend-v2
```

### **Frontend (Vercel)**
```bash
# Player
cd goldeouro-player
vercel --prod

# Admin  
cd goldeouro-admin
vercel --prod
```

---

## 🔄 **ROLLBACK RÁPIDO**

### **Voltar para v1.1.1 Complexo**
```bash
# 1. Git checkout
git checkout v1.1.1-complex

# 2. Deploy backend
fly deploy --app goldeouro-backend-v2

# 3. Deploy frontends
cd goldeouro-player && vercel --prod
cd goldeouro-admin && vercel --prod
```

---

## ⚠️ **PROBLEMAS CONHECIDOS**

1. **CSP Admin** - Bloqueia imagem de fundo
2. **Service Worker** - Cache de versões antigas
3. **PIX** - Configurado mas não testado
4. **Supabase** - Pode estar falhando (fallback in-memory)

---

**Status:** ✅ **SNAPSHOT COMPLETO**  
**Próximo:** Implementar SIMPLE_MVP
