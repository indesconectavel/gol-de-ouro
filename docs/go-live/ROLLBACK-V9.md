# 🔄 INSTRUÇÕES DE ROLLBACK V9 - GO-LIVE
## Gol de Ouro - Versão 1.2.0

---

## ⚠️ PROCEDIMENTO DE ROLLBACK

### **Backend (Fly.io)**

#### **Opção 1: Rollback para release anterior**
```bash
# Listar releases
flyctl releases --app goldeouro-backend-v2

# Rollback para release específico
flyctl releases rollback <RELEASE_ID> --app goldeouro-backend-v2
```

#### **Opção 2: Deploy de imagem anterior**
```bash
# Listar imagens
flyctl image show --app goldeouro-backend-v2

# Deploy de imagem específica
flyctl deploy --app goldeouro-backend-v2 --image <IMAGE_ID>
```

#### **Opção 3: Reverter código e redeploy**
```bash
# Reverter para commit anterior
git checkout <COMMIT_HASH>

# Deploy
flyctl deploy --app goldeouro-backend-v2
```

---

### **Frontend Player (Vercel)**

#### **Opção 1: Rollback via Dashboard**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto `goldeouro-player`
3. Ir em "Deployments"
4. Clicar nos "..." do deployment anterior
5. Selecionar "Promote to Production"

#### **Opção 2: Rollback via CLI**
```bash
cd goldeouro-player

# Listar deployments
vercel ls

# Rollback para deployment específico
vercel rollback <DEPLOYMENT_ID> --prod
```

#### **Opção 3: Reverter código e redeploy**
```bash
cd goldeouro-player

# Reverter para commit anterior
git checkout <COMMIT_HASH>

# Deploy
vercel --prod
```

---

### **Frontend Admin (Vercel)**

Seguir os mesmos passos do Frontend Player, substituindo `goldeouro-player` por `goldeouro-admin`.

---

## 🔍 VERIFICAÇÃO PÓS-ROLLBACK

### **Backend**
```bash
# Verificar health
curl https://goldeouro-backend-v2.fly.dev/health

# Verificar versão
curl https://goldeouro-backend-v2.fly.dev/meta
```

### **Frontend**
- Acessar: https://www.goldeouro.lol
- Verificar se página carrega corretamente
- Testar login/registro

---

## 📋 CHECKLIST DE ROLLBACK

- [ ] Identificar problema que requer rollback
- [ ] Documentar motivo do rollback
- [ ] Fazer backup do estado atual
- [ ] Executar rollback (Backend)
- [ ] Executar rollback (Frontend Player)
- [ ] Executar rollback (Frontend Admin)
- [ ] Verificar health checks
- [ ] Testar funcionalidades críticas
- [ ] Notificar equipe
- [ ] Documentar rollback

---

## ⚠️ AVISOS IMPORTANTES

1. **Backup:** Sempre fazer backup antes de rollback
2. **Comunicação:** Notificar equipe antes de rollback
3. **Documentação:** Documentar motivo e resultado do rollback
4. **Testes:** Testar após rollback antes de considerar completo

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Fly.io:** https://fly.io/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard

---

**Última Atualização:** 2025-12-03  
**Versão:** 1.2.0
