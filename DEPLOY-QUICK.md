# 🚀 Deploy Rápido no Render

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Conta no Render (gratuita)
- ✅ Supabase configurado com PostgreSQL

## 🎯 Deploy em 3 Passos

### 1️⃣ Clique no Botão de Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy/schema-new?template=https://github.com/seu-usuario/goldeouro-backend)

**OU** acesse: https://render.com/deploy/schema-new

### 2️⃣ Configure o Projeto

- **Nome**: `goldeouro-backend`
- **Branch**: `main`
- **Root Directory**: deixe em branco

### 3️⃣ Configure as Variáveis

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://...` | URL do Supabase |
| `JWT_SECRET` | `abc123...` | Chave JWT (32+ chars) |
| `ADMIN_TOKEN` | `token123...` | Token admin (16+ chars) |

**Variáveis pré-configuradas:**
- ✅ `PORT`: 3000
- ✅ `NODE_ENV`: production
- ✅ `CORS_ORIGINS`: http://localhost:5174,https://goldeouro-admin.vercel.app

## 🎉 Resultado

Após o deploy, você receberá:
- **URL da API**: `https://goldeouro-backend-XXXX.onrender.com`
- **Health Check**: `https://goldeouro-backend-XXXX.onrender.com/health`
- **Status**: ✅ Online e funcionando

## 🔍 Validação

```bash
# Teste o health check
curl https://goldeouro-backend-XXXX.onrender.com/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2025-08-31T16:00:00.000Z"
}
```

## 🆘 Suporte

- **Logs**: Render Dashboard → Seu Projeto → Logs
- **Variáveis**: Render Dashboard → Seu Projeto → Environment
- **Deploy**: Render Dashboard → Seu Projeto → Manual Deploy
