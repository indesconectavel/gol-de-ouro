# 🔗 URLs DO PIPELINE E DEPLOY
## Sistema Gol de Ouro

---

## 📊 REPOSITÓRIO GITHUB

**Repositório:** `indesconectavel/gol-de-ouro`  
**URL:** https://github.com/indesconectavel/gol-de-ouro

---

## 🔄 PIPELINE CI/CD

### **GitHub Actions**

**URL Base do Pipeline:**
```
https://github.com/indesconectavel/gol-de-ouro/actions
```

**URLs Específicas:**

1. **Todas as Execuções do Pipeline:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions
   ```

2. **Workflows Disponíveis:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions/workflows
   ```

3. **Pipeline Principal (main-pipeline.yml):**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions/workflows/main-pipeline.yml
   ```

4. **Deploy Backend (backend-deploy.yml):**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions/workflows/backend-deploy.yml
   ```

5. **CI (ci.yml):**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions/workflows/ci.yml
   ```

6. **Última Execução:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions/runs
   ```

**Workflows Configurados:**
- ✅ `main-pipeline.yml` - Pipeline principal
- ✅ `backend-deploy.yml` - Deploy do backend
- ✅ `frontend-deploy.yml` - Deploy do frontend
- ✅ `ci.yml` - Continuous Integration
- ✅ `tests.yml` - Testes automatizados
- ✅ `health-monitor.yml` - Monitoramento de saúde
- ✅ `monitoring.yml` - Monitoramento geral
- ✅ `security.yml` - Verificações de segurança
- ✅ `rollback.yml` - Rollback de deploys
- ✅ `deploy-on-demand.yml` - Deploy sob demanda
- ✅ `configurar-seguranca.yml` - Configuração de segurança

---

## 🚀 DEPLOY E INFRAESTRUTURA

### **Fly.io (Backend)**

**Dashboard:**
```
https://fly.io/apps/goldeouro-backend-v2
```

**Monitoramento:**
```
https://fly.io/apps/goldeouro-backend-v2/monitoring
```

**Logs:**
```
https://fly.io/apps/goldeouro-backend-v2/logs
```

**Máquinas:**
- **Máquina 1:** `2874551a105768` (withered-cherry-5478)
- **Máquina 2:** `e82d445ae76178` (dry-sea-3466)

**URL da API:**
```
https://goldeouro-backend-v2.fly.dev
```

**Health Check:**
```
https://goldeouro-backend-v2.fly.dev/health
```

---

### **Vercel (Frontend)**

**Admin Panel:**
```
https://admin.goldeouro.lol
```

**Player Frontend:**
```
https://goldeouro.lol
```

**Dashboard Vercel:**
```
https://vercel.com/dashboard
```

---

## 📋 STATUS ATUAL

### **Backend (Fly.io)**
- ✅ **Status:** Deployed and Running
- ✅ **Health Check:** Passing (1/1 checks)
- ✅ **Máquinas:** 2/2 funcionando
- ✅ **Região:** São Paulo, Brazil (gru)

### **Frontend (Vercel)**
- ✅ **Admin Panel:** Deployed
- ✅ **Player:** Deployed

---

## 🔍 VERIFICAÇÃO RÁPIDA

### **Verificar Pipeline GitHub Actions:**
```bash
# Abrir no navegador
start https://github.com/indesconectavel/gol-de-ouro/actions
```

### **Verificar Deploy Fly.io:**
```bash
flyctl status --app goldeouro-backend-v2
```

### **Verificar Health Check:**
```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

---

## 📝 NOTAS

- ⚠️ **GitHub Actions:** O arquivo `.github/workflows/ci-cd.yml` foi removido anteriormente
- ✅ **Deploy Manual:** Atualmente usando `flyctl deploy` manualmente
- ✅ **Health Check:** Corrigido e funcionando corretamente

---

**Última Atualização:** 2025-11-26

