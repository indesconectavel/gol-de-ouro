# 🧪 EXECUÇÃO DE TESTES VIA GITHUB ACTIONS - GOL DE OURO

## 🎯 **GUIA COMPLETO PARA EXECUTAR TESTES**

### **📋 WORKFLOWS PARA EXECUTAR:**

### **1️⃣ Pipeline Principal:**
- **URL:** https://github.com/indesconectavel/gol-de-ouro/actions/workflows/main-pipeline.yml
- **Ação:** Run workflow → main branch
- **Validação:** Todos os jobs com status "success"

### **2️⃣ Testes Automatizados:**
- **URL:** https://github.com/indesconectavel/gol-de-ouro/actions/workflows/tests.yml
- **Ação:** Run workflow → main branch
- **Validação:** Testes unitários, integração, segurança, performance

### **3️⃣ Segurança e Qualidade:**
- **URL:** https://github.com/indesconectavel/gol-de-ouro/actions/workflows/security.yml
- **Ação:** Run workflow → main branch
- **Validação:** CodeQL, auditoria, análise de qualidade

### **4️⃣ Monitoramento:**
- **URL:** https://github.com/indesconectavel/gol-de-ouro/actions/workflows/monitoring.yml
- **Ação:** Run workflow → main branch
- **Validação:** Verificação de saúde dos serviços

---

## 🚀 **INSTRUÇÕES DE EXECUÇÃO:**

### **Passo 1: Acessar GitHub Actions**
1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Clique no workflow desejado
3. Clique em "Run workflow"
4. Selecione branch: "main"
5. Clique em "Run workflow"

### **Passo 2: Monitorar Execução**
1. Acompanhe o progresso em tempo real
2. Verifique os logs de cada job
3. Confirme que todos os testes passaram
4. Baixe os artifacts gerados

### **Passo 3: Validar Resultados**
1. Verifique status final de cada job
2. Baixe relatórios na seção "Artifacts"
3. Confirme que os serviços estão online
4. Teste o sistema completo

---

## ✅ **RESULTADOS ESPERADOS:**

### **Pipeline Principal:**
- ✅ Análise e Validação: success
- ✅ Testes: success
- ✅ Deploy Backend: success
- ✅ Deploy Frontend: success
- ✅ Monitoramento: success

### **Testes Automatizados:**
- ✅ Testes Backend: success
- ✅ Testes Frontend: success
- ✅ Testes de Segurança: success
- ✅ Testes de Performance: success
- ✅ Relatório de Testes: success

### **Segurança e Qualidade:**
- ✅ Análise de Segurança: success
- ✅ Análise de Qualidade: success
- ✅ Testes de Segurança: success
- ✅ Relatório de Segurança: success

### **Monitoramento:**
- ✅ Monitoramento de Saúde: success
- ✅ Monitoramento de Performance: success
- ✅ Monitoramento de Logs: success
- ✅ Relatório de Monitoramento: success

---

## 📊 **ARTIFACTS GERADOS:**

### **Relatórios:**
- 📄 Relatório de Testes
- 📄 Relatório de Segurança
- 📄 Relatório de Monitoramento
- 📄 Logs de Deploy
- 📄 Métricas de Performance

### **Logs:**
- 📄 Logs de Deploy Backend
- 📄 Logs de Deploy Frontend
- 📄 Logs de Testes
- 📄 Logs de Monitoramento

---

## 🎯 **VALIDAÇÃO PÓS-TESTES:**

### **1. Verificar Status dos Serviços:**
- Backend: https://goldeouro-backend.fly.dev/health
- Frontend: https://goldeouro.lol
- Métricas: https://goldeouro-backend.fly.dev/api/metrics

### **2. Verificar Logs:**
```bash
# Logs do Fly.io
flyctl logs --app goldeouro-backend

# Status do Fly.io
flyctl status --app goldeouro-backend
```

### **3. Verificar Deploy:**
- Backend: Deploy para Fly.io
- Frontend: Deploy para Vercel
- Testes: Todos passando
- Segurança: Aprovada

---

## 🚨 **TROUBLESHOOTING:**

### **Se algum teste falhar:**
1. Verifique os logs do job
2. Identifique o problema
3. Corrija o código se necessário
4. Execute novamente

### **Se o deploy falhar:**
1. Verifique os secrets configurados
2. Confirme conectividade com serviços
3. Verifique logs de deploy
4. Execute rollback se necessário

---

## 📊 **STATUS ATUAL:**

### **✅ Workflows Configurados:**
- ✅ Pipeline Principal
- ✅ Testes Automatizados
- ✅ Segurança e Qualidade
- ✅ Monitoramento
- ✅ Rollback Automático
- ✅ Health Monitor

### **⚠️ Próximos Passos:**
1. Configure os secrets no GitHub
2. Execute os workflows
3. Monitore os resultados
4. Valide o sistema

---

**📅 Última atualização:** $(Get-Date)
**👨‍💻 Desenvolvido por:** Fred Silva
