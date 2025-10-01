# 🔍 AUDITORIA DE PRODUÇÃO - GOL DE OURO v1.1.1

**Data:** 2025-01-27  
**Versão:** v1.1.1 Complexo  
**Status:** Pré-MVP (Simulação PIX)

---

## **🌐 DOMÍNIOS E HOSTING**

### **Frontend (Vercel)**
- **Player:** `https://www.goldeouro.lol`
- **Admin:** `https://admin.goldeouro.lol`

### **Backend (Fly.io)**
- **API:** `https://goldeouro-backend-v2.fly.dev`
- **Health:** `https://goldeouro-backend-v2.fly.dev/health`

---

## **⚙️ CONFIGURAÇÕES ATUAIS**

### **Vercel.json (Player)**
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
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### **Vercel.json (Admin)**
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
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### **Fly.toml (Backend)**
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
  [[services.ports]]
    handlers = ["http"]
    port = 80
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## **🔐 AUTENTICAÇÃO E SESSÃO**

### **Backend (server-fly.js)**
- **JWT:** Implementado com `jsonwebtoken`
- **Cookies:** `httpOnly: true`, `sameSite: 'lax'`
- **CORS:** Configurado para domínios de produção
- **Rate Limiting:** Implementado

### **Frontend**
- **Player:** Axios com `withCredentials: true`
- **Admin:** Fetch com `credentials: 'include'`

---

## **💳 PIX ATUAL (SIMULAÇÃO)**

### **Rotas Implementadas**
- `POST /api/payments/pix/criar` - Criação de PIX (simulação)
- `POST /api/payments/pix/webhook` - Webhook (simulação)

### **Configuração**
- **Provedor:** Simulação (sem Mercado Pago real)
- **Webhook:** `https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook`
- **Status:** Aguardando `MP_ACCESS_TOKEN` para produção

---

## **🎮 ENDPOINTS DO FLUXO ATUAL**

### **Autenticação**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro
- `GET /api/user/me` - Perfil do usuário
- `POST /api/auth/logout` - Logout

### **Jogo**
- `POST /api/games/shoot` - Jogar (chute)
- `GET /api/games/history` - Histórico de jogos

### **PIX (Simulação)**
- `POST /api/payments/pix/criar` - Criar PIX
- `POST /api/payments/pix/webhook` - Webhook PIX

### **Admin**
- `GET /api/admin/users` - Listar usuários
- `GET /api/admin/games` - Listar jogos
- `GET /api/admin/withdrawals` - Listar saques

---

## **📱 PWA E SERVICE WORKERS**

### **Player**
- **Manifest:** `manifest.webmanifest`
- **SW:** `sw.js` (Workbox)
- **Cache:** Assets estáticos

### **Admin**
- **Manifest:** `manifest.webmanifest`
- **SW:** `sw.js` (Workbox)
- **Cache:** Assets estáticos

---

## **🗄️ BANCO DE DADOS**

### **Supabase PostgreSQL**
- **Driver:** `@supabase/supabase-js`
- **Pool:** Configurado para produção
- **Schema:** Usuários, jogos, transações, saques

---

## **🚨 PRINCIPAIS BLOCKERS**

1. **PIX Simulação:** Sem Mercado Pago real
2. **Saque Manual:** Requer aprovação admin
3. **Dados Fictícios:** Admin com dados mock
4. **Service Workers:** Podem causar cache issues

---

## **📊 STATUS DE DEPLOY**

### **Health Check**
```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

### **Versão**
```bash
curl https://goldeouro-backend-v2.fly.dev/version
```

---

## **🔧 PRÓXIMAS AÇÕES**

1. **Backup completo** da configuração atual
2. **Implementar PIX real** (Mercado Pago)
3. **Automatizar saques** (sem aprovação)
4. **Remover dados fictícios** do Admin
5. **Teste E2E completo** em produção

---

**Auditoria concluída em:** 2025-01-27 15:30 BRT  
**Próxima etapa:** Backup e Snapshot v1.1.1 Complexo