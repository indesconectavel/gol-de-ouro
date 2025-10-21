# 🚀 Gol de Ouro - Backend + Admin

Sistema completo de backend Node.js + admin React para o jogo Gol de Ouro.

## 🏗️ Arquitetura

- **Backend**: Node.js + Express + PostgreSQL (Render)
- **Admin**: React + Vite + Tailwind CSS (Vercel)
- **Banco**: PostgreSQL (Supabase/Render)
- **Deploy**: Render (backend) + Vercel (admin)

## 🚀 Início Rápido

### 1. Backend Local
```bash
cd goldeouro-backend
npm install
npm start
```
- ✅ Porta: 3000
- ✅ Health: http://localhost:3000/health
- ✅ API: http://localhost:3000/

### 2. Admin Local
```bash
cd goldeouro-admin
npm install
npm run dev
```
- ✅ Porta: 5173 (ou 5174 se ocupada)
- ✅ URL: http://localhost:5173
- ✅ Fallback: http://localhost:5174

## 🔧 Configuração

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_minimo_32_chars
ADMIN_TOKEN=seu_token_admin_unico_aqui
PORT=3000
NODE_ENV=development
```

### Admin (.env.local)
```bash
VITE_API_URL=http://localhost:3000
VITE_ADMIN_TOKEN=seu_token_aqui
```

## 🧪 Smoke Tests

### Local
```bash
.\scripts\smoke.local.ps1
```

### Produção
```bash
# 1. Configure scripts/prod.backend.url.txt
# 2. Execute:
.\scripts\smoke.prod.ps1
```

## 🚨 Emergência

Se houver problemas de conexão:
```bash
.\scripts\emergency-startup.ps1
```

## 🌐 Deploy

### Backend (Render)
1. Configure variáveis de ambiente
2. Deploy automático via Git
3. URL: `https://seu-app.onrender.com`

### Admin (Vercel)
1. Configure `VITE_API_URL` no Vercel
2. Deploy automático via Git
3. URL: `https://goldeouro-admin.vercel.app`

## 📚 Documentação

- [Backend ENV](README-ENV-BACKEND.md)
- [Admin ENV](goldeouro-admin/README-ENV-LOCAL.md)
- [Deploy](DEPLOY.md)
- [Deploy Rápido](DEPLOY-QUICK.md)

## 🔒 Segurança

- ✅ Helmet + CSP
- ✅ Rate Limiting (200 req/min)
- ✅ CORS configurado
- ✅ Validação de ambiente
- ✅ JWT + Admin Token

## 🎯 Endpoints

### Públicos
- `GET /` - Status da API
- `GET /health` - Health check
- `GET /api/public/dashboard` - Dashboard público

### Protegidos
- `GET /admin/test` - Rota de teste (requer x-admin-token)

## 🛠️ Tecnologias

- **Backend**: Express, PostgreSQL, Helmet, CORS
- **Admin**: React 18, Vite, Tailwind CSS, Axios
- **Deploy**: Render, Vercel
- **Scripts**: PowerShell

## 📝 Commits Sugeridos

```bash
fix(admin): router unificado, ErrorBoundary/Suspense e client de API padronizado
chore(backend): health e CORS (localhost:5173/5174 + vercel app)
docs: READMEs, .env.example e scripts de smoke (local/prod)
```

## 🆘 Suporte

- **Local**: Execute smoke tests e verifique logs
- **Produção**: Verifique variáveis de ambiente e conectividade
- **Admin**: Confirme `VITE_API_URL` no Vercel
- **Backend**: Valide DATABASE_URL e tokens no Render
