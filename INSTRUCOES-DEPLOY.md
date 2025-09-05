# 🚀 INSTRUÇÕES DE DEPLOY - GOL DE OURO

## 📋 COMANDOS PARA EXECUTAR

### 1. Backend (Render.com)
```bash
# No diretório raiz (goldeouro-backend)
render deploy
```
**URL esperada:** https://goldeouro-backend.onrender.com

### 2. Frontend Admin (Vercel)
```bash
# No diretório goldeouro-admin
cd goldeouro-admin
vercel --prod
```
**URL esperada:** https://goldeouro-admin.vercel.app

### 3. Frontend Player (Vercel)
```bash
# No diretório goldeouro-player
cd goldeouro-player
vercel --prod
```
**URL esperada:** https://goldeouro-player.vercel.app

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Render.com (Backend)
- Framework: Node.js
- Build Command: npm install
- Start Command: npm start
- Environment Variables: Configuradas no .env

### Vercel (Frontends)
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Environment Variables: Configuradas nos vercel.json

## 📊 STATUS ATUAL
- ✅ Backend: Pronto para deploy
- ✅ Admin: Pronto para deploy  
- ✅ Player: Pronto para deploy
- ✅ Configurações: Todas validadas

## 🎯 PRÓXIMOS PASSOS
1. Executar comandos de deploy acima
2. Testar todas as URLs
3. Configurar domínios personalizados (opcional)
4. Monitorar logs de produção
5. Configurar alertas de monitoramento

---
**Data:** 2025-09-02
**Versão:** 1.0.0
