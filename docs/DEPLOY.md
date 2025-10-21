# 🚀 Gol de Ouro - Guia Completo de Deploy

## 📋 Visão Geral

Este guia cobre o deploy completo do sistema Gol de Ouro, incluindo:
- **Backend**: Node.js/Express com PostgreSQL (Render/Railway)
- **Admin**: React/Vite (Vercel)
- **Processo**: Desenvolvimento → Homologação → Produção
- **Rollback**: Procedimentos de emergência

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Vercel)      │◄──►│   (Render)      │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deploy Rápido (Um Clique)

### 1. Deploy Completo
```powershell
# Na pasta raiz do projeto
.\scripts\deploy-all.ps1
```

### 2. Deploy Individual
```powershell
# Backend
.\scripts\deploy-backend.ps1

# Admin (na pasta goldeouro-admin)
.\scripts\deploy-admin.ps1
```

## 📁 Estrutura de Scripts

```
scripts/
├── deploy-all.ps1          # Deploy completo (orquestrador)
├── deploy-backend.ps1      # Deploy do backend
├── deploy-admin.ps1        # Deploy do admin
├── rollback-backend.ps1    # Rollback do backend
├── rollback-admin.ps1      # Rollback do admin
└── smoke.ps1               # Testes de integração
```

## 🔧 Configuração Prévia

### Backend (.env)
```bash
# Obrigatórias
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=sua_chave_jwt_super_secreta
ADMIN_TOKEN=seu_token_admin_unico
CORS_ORIGINS=http://localhost:5174,https://seu-admin.vercel.app

# Opcionais
PORT=3000
NODE_ENV=production
```

### Admin (.env.local)
```bash
# Obrigatória
VITE_API_URL=https://seu-backend.onrender.com

# Opcionais
VITE_NODE_ENV=production
VITE_APP_NAME=Gol de Ouro Admin
```

## 🎯 Deploy por Ambiente

### 🟢 Desenvolvimento
```bash
# Backend
npm run dev

# Admin
cd goldeouro-admin
npm run dev
```

### 🟡 Homologação
```bash
# Backend (Render Staging)
.\scripts\deploy-backend.ps1 -Platform render

# Admin (Vercel Preview)
cd goldeouro-admin
vercel --preview
```

### 🔴 Produção
```bash
# Backend (Render Production)
.\scripts\deploy-backend.ps1 -Platform render

# Admin (Vercel Production)
cd goldeouro-admin
vercel --prod
```

## 🌐 Plataformas de Deploy

### Backend

#### Render (Recomendado)
- **URL**: https://render.com
- **Plano**: Free
- **Build**: `npm install`
- **Start**: `npm start`
- **Healthcheck**: `/health`
- **Variáveis**: Via dashboard

#### Railway (Alternativo)
- **URL**: https://railway.app
- **Plano**: Free
- **CLI**: `npm i -g @railway/cli`
- **Deploy**: `railway up`

### Admin

#### Vercel
- **URL**: https://vercel.com
- **Framework**: Vite
- **Build**: `npm run build`
- **Output**: `dist/`
- **Deploy**: `vercel --prod`

## 📊 Monitoramento e Logs

### Backend
```bash
# Logs em tempo real
render logs goldeouro-backend

# Status do serviço
render ps goldeouro-backend

# Healthcheck
curl https://seu-backend.onrender.com/health
```

### Admin
```bash
# Logs de deploy
vercel logs

# Status dos deploys
vercel ls

# Domínios ativos
vercel domains
```

## 🔄 Rollback

### Backend
```powershell
# Rollback para versão anterior
.\scripts\rollback-backend.ps1 -Platform render
```

### Admin
```powershell
# Rollback para deploy anterior
cd goldeouro-admin
.\scripts\rollback-admin.ps1
```

## 🧪 Testes de Integração

### Smoke Test
```powershell
# Testar todas as rotas do backend
.\scripts\smoke.ps1
```

### Build Test
```bash
# Testar build do admin
cd goldeouro-admin
npm run build
npm run preview
```

## 🚨 Troubleshooting

### Backend não responde
1. Verificar logs: `render logs goldeouro-backend`
2. Verificar variáveis de ambiente
3. Testar conexão com banco: `node test-db.js`
4. Verificar CORS e ADMIN_TOKEN

### Admin com erro de build
1. Verificar dependências: `npm install`
2. Verificar VITE_API_URL
3. Verificar imports case-sensitive
4. Verificar sintaxe JavaScript/JSX

### Erro de CORS
1. Verificar CORS_ORIGINS no backend
2. Incluir domínio do admin
3. Verificar protocolo (http/https)
4. Verificar porta se necessário

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Código testado localmente
- [ ] Banco de dados acessível
- [ ] Dependências atualizadas

### Deploy Backend
- [ ] Render/Railway configurado
- [ ] Variáveis de ambiente definidas
- [ ] Healthcheck funcionando
- [ ] CORS configurado

### Deploy Admin
- [ ] Vercel conectado ao repositório
- [ ] VITE_API_URL apontando para backend
- [ ] Build bem-sucedido
- [ ] Deploy em produção

### Pós-Deploy
- [ ] Backend respondendo em /health
- [ ] Admin acessível via Vercel
- [ ] Login funcionando
- [ ] Rotas protegidas funcionando
- [ ] CORS funcionando entre frontend/backend

## 🔐 Segurança

### Variáveis Sensíveis
- ✅ **NUNCA** commitar `.env` ou `.env.local`
- ✅ Usar variáveis de ambiente das plataformas
- ✅ Rotacionar JWT_SECRET e ADMIN_TOKEN regularmente
- ✅ Usar HTTPS em produção

### CORS
- ✅ Configurar apenas domínios necessários
- ✅ Incluir domínios de desenvolvimento e produção
- ✅ Usar `credentials: true` se necessário

## 📞 Suporte

### Comandos Úteis
```bash
# Status geral
.\scripts\deploy-all.ps1 -SkipTests

# Deploy forçado
.\scripts\deploy-backend.ps1 -Force

# Rollback específico
.\scripts\rollback-admin.ps1 -DeployId abc123
```

### Logs e Debug
```bash
# Backend
render logs goldeouro-backend --tail

# Admin
vercel logs --follow

# Local
npm run dev
```

---

## 🎉 Deploy Concluído!

Após seguir este guia, você terá:
- ✅ Backend rodando em Render/Railway
- ✅ Admin rodando em Vercel
- ✅ Integração funcionando
- ✅ Monitoramento configurado
- ✅ Rollback preparado

**Próximo passo**: Teste todas as funcionalidades e monitore os logs!
