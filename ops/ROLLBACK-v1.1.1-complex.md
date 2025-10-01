# 🔄 ROLLBACK v1.1.1 COMPLEXO - GOL DE OURO

**Data:** 2025-10-01  
**Versão:** v1.1.1 Complexo  
**Status:** Documentação de Rollback

---

## 🚨 **ROLLBACK RÁPIDO (EMERGÊNCIA)**

### **1. Git Checkout**
```bash
# Voltar para tag v1.1.1-complex
git checkout v1.1.1-complex

# Ou voltar para branch backup
git checkout backup/v1.1.1-complex
```

### **2. Deploy Backend (Fly.io)**
```bash
# Deploy backend
fly deploy --app goldeouro-backend-v2

# Verificar status
fly status --app goldeouro-backend-v2

# Ver logs
fly logs --app goldeouro-backend-v2
```

### **3. Deploy Frontends (Vercel)**
```bash
# Player
cd goldeouro-player
vercel --prod

# Admin
cd goldeouro-admin  
vercel --prod
```

---

## 🔧 **ROLLBACK DETALHADO**

### **Passo 1: Verificar Estado Atual**
```bash
# Ver branch atual
git branch

# Ver tags
git tag -l

# Ver status
git status
```

### **Passo 2: Backup do Estado Atual**
```bash
# Criar backup do estado atual
git checkout -b backup/antes-rollback-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "Backup antes rollback v1.1.1-complex"
```

### **Passo 3: Rollback Git**
```bash
# Voltar para v1.1.1-complex
git checkout v1.1.1-complex

# Verificar arquivos críticos
ls -la goldeouro-player/vercel.json
ls -la goldeouro-admin/vercel.json
ls -la fly.toml
```

### **Passo 4: Deploy Backend**
```bash
# Verificar configuração Fly.io
cat fly.toml

# Deploy
fly deploy --app goldeouro-backend-v2

# Aguardar deploy completar
sleep 30

# Testar health
curl https://goldeouro-backend-v2.fly.dev/health
```

### **Passo 5: Deploy Frontends**
```bash
# Player
cd goldeouro-player
vercel --prod

# Aguardar deploy
sleep 30

# Testar player
curl -I https://www.goldeouro.lol

# Admin
cd goldeouro-admin
vercel --prod

# Aguardar deploy
sleep 30

# Testar admin
curl -I https://admin.goldeouro.lol
```

---

## ✅ **VERIFICAÇÃO PÓS-ROLLBACK**

### **1. Testar URLs**
- [ ] `https://www.goldeouro.lol` - Player OK
- [ ] `https://admin.goldeouro.lol` - Admin OK
- [ ] `https://goldeouro-backend-v2.fly.dev/health` - Backend OK

### **2. Testar Funcionalidades**
- [ ] Login Player
- [ ] Login Admin (senha: G0ld3@0ur0_2025!)
- [ ] PIX (criar depósito)
- [ ] Jogo (chute)
- [ ] Logout

### **3. Verificar Logs**
```bash
# Backend logs
fly logs --app goldeouro-backend-v2

# Vercel logs (via dashboard)
# https://vercel.com/dashboard
```

---

## 🔍 **TROUBLESHOOTING**

### **Problema: Deploy Falha**
```bash
# Verificar credenciais
fly auth whoami

# Verificar app
fly apps list

# Tentar novamente
fly deploy --app goldeouro-backend-v2 --verbose
```

### **Problema: Frontend Não Atualiza**
```bash
# Limpar cache Vercel
vercel --prod --force

# Ou via dashboard Vercel
# Settings > Functions > Clear Cache
```

### **Problema: Backend Não Responde**
```bash
# Verificar status
fly status --app goldeouro-backend-v2

# Restart app
fly restart --app goldeouro-backend-v2

# Ver logs
fly logs --app goldeouro-backend-v2 --follow
```

---

## 📋 **CHECKLIST ROLLBACK**

- [ ] **Git checkout** para v1.1.1-complex
- [ ] **Backup** estado atual
- [ ] **Deploy backend** (Fly.io)
- [ ] **Deploy player** (Vercel)
- [ ] **Deploy admin** (Vercel)
- [ ] **Testar URLs** principais
- [ ] **Testar login** player/admin
- [ ] **Testar PIX** (criar depósito)
- [ ] **Testar jogo** (chute)
- [ ] **Verificar logs** (sem erros críticos)

---

## ⚠️ **IMPORTANTE**

1. **SEMPRE** fazer backup antes do rollback
2. **TESTAR** todas as funcionalidades após rollback
3. **VERIFICAR** logs para erros
4. **COMUNICAR** rollback para equipe
5. **DOCUMENTAR** motivo do rollback

---

**Status:** ✅ **ROLLBACK DOCUMENTADO**  
**Tempo Estimado:** 10-15 minutos  
**Próximo:** Implementar SIMPLE_MVP
