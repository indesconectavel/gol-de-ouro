# Guia de Deploy - Gol de Ouro v1.1.1

## 🚀 Deploy em Produção

### **Admin Panel (Vercel)**

```bash
# 1. Navegar para o diretório do admin
cd goldeouro-admin

# 2. Instalar dependências
npm ci

# 3. Build para produção
npm run build

# 4. Deploy no Vercel
vercel --prod
```

**Configurações Vercel:**
- Domínio: `admin.goldeouro.lol`
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- SPA Fallback: ✅ Configurado

### **Player Mode (Vercel)**

```bash
# 1. Navegar para o diretório do player
cd goldeouro-player

# 2. Instalar dependências
npm ci

# 3. Build para produção
npm run build

# 4. Deploy no Vercel
vercel --prod
```

**Configurações Vercel:**
- Domínio: `goldeouro.lol`
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA Fallback: ✅ Configurado

### **Backend (Fly.io)**

```bash
# 1. Instalar flyctl
# https://fly.io/docs/hands-on/install-flyctl/

# 2. Login no Fly.io
flyctl auth login

# 3. Executar script de deploy
.\deploy-flyio.ps1
```

**Configurações Fly.io:**
- App: `goldeouro-backend`
- Região: `gru` (São Paulo)
- Porta: `8080`
- Health Check: `/health`

## 🔐 Secrets (Fly.io)

```bash
# Configurar secrets de produção
flyctl secrets set DATABASE_URL="postgresql://..." --app goldeouro-backend
flyctl secrets set MP_ACCESS_TOKEN="APP_USR_..." --app goldeouro-backend
flyctl secrets set MP_PUBLIC_KEY="APP_USR_..." --app goldeouro-backend
flyctl secrets set ADMIN_TOKEN_PROD="admin-prod-token-2025" --app goldeouro-backend
flyctl secrets set NODE_ENV="production" --app goldeouro-backend
```

## 🌐 URLs de Produção

- **Player Mode:** https://goldeouro.lol
- **Admin Panel:** https://admin.goldeouro.lol
- **Backend API:** https://goldeouro-backend.fly.dev

## 🔍 Health Checks

```bash
# Backend Health
curl https://goldeouro-backend.fly.dev/health

# Backend Readiness
curl https://goldeouro-backend.fly.dev/readiness

# Admin Panel
curl https://admin.goldeouro.lol

# Player Mode
curl https://goldeouro.lol
```

## 📊 Monitoramento

### **Fly.io**
```bash
# Status do app
flyctl status --app goldeouro-backend

# Logs em tempo real
flyctl logs --app goldeouro-backend

# Métricas
flyctl metrics --app goldeouro-backend
```

### **Vercel**
```bash
# Status dos deploys
vercel ls

# Logs
vercel logs [deployment-url]
```

## 🛠️ Comandos Úteis

### **Desenvolvimento Local**
```bash
# Backend
npm run dev

# Admin Panel
cd goldeouro-admin && npm run dev

# Player Mode
cd goldeouro-player && npm run dev
```

### **Produção**
```bash
# Deploy completo
.\deploy-flyio.ps1

# Rollback (se necessário)
flyctl releases rollback --app goldeouro-backend
```

## 🔧 Troubleshooting

### **404 no Admin Panel**
- Verificar se `vercel.json` está correto
- Confirmar SPA fallback configurado
- Testar rota `/login` diretamente

### **CORS Errors**
- Verificar `allowedOrigins` no backend
- Confirmar URLs corretas no CORS

### **Database Connection**
- Verificar `DATABASE_URL` no Fly.io
- Testar conexão com Supabase
- Verificar SSL configurado

## 📝 Notas Importantes

1. **Não alterar ambientes locais** - Manter desenvolvimento isolado
2. **Usar credenciais de produção** - Supabase e Mercado Pago PROD
3. **Testar todas as funcionalidades** - Antes de considerar deploy completo
4. **Monitorar logs** - Para identificar problemas rapidamente
5. **Backup regular** - Manter backups do banco de dados

---

**Versão:** v1.1.1  
**Data:** 2025-01-24  
**Status:** ✅ Produção Configurada
