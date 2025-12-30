# 🚀 INSTRUÇÕES PARA EXECUTAR DEPLOY

## ✅ CORREÇÃO APLICADA

**X-Frame-Options** foi corrigido no código (`server-fly.js` linha ~263).

---

## 🎯 EXECUTAR DEPLOY AGORA

### **Opção 1: PowerShell (Recomendado para Windows)**

```powershell
.\scripts\deploy-flyio.ps1
```

Este script:
- ✅ Verifica autenticação
- ✅ Faz deploy automaticamente
- ✅ Valida X-Frame-Options após deploy
- ✅ Mostra logs

---

### **Opção 2: Fly.io CLI Manual**

```bash
# 1. Verificar autenticação
flyctl auth whoami

# 2. Fazer deploy
flyctl deploy -a goldeouro-backend-v2

# 3. Aguardar conclusão (2-5 minutos)

# 4. Validar
bash scripts/validar-x-frame-options.sh
```

---

### **Opção 3: GitHub Actions**

Se houver workflow configurado:
1. Fazer commit das mudanças
2. Push para branch principal
3. GitHub Actions executará deploy

---

## ✅ VALIDAÇÃO APÓS DEPLOY

### **1. Validar X-Frame-Options:**

```bash
bash scripts/validar-x-frame-options.sh
```

**OU manualmente:**

```bash
curl -I https://goldeouro-backend-v2.fly.dev/health | grep -i "x-frame-options"
```

**Esperado:** `x-frame-options: DENY`

---

### **2. Executar Teste Completo:**

```bash
bash scripts/teste-completo-pre-deploy.sh
```

---

### **3. Verificar Logs:**

```bash
flyctl logs -a goldeouro-backend-v2 --limit 50
```

---

## 📋 CHECKLIST PÓS-DEPLOY

- [ ] Deploy concluído sem erros
- [ ] Health check retorna 200 OK
- [ ] X-Frame-Options presente nos headers
- [ ] X-Content-Type-Options presente
- [ ] Rotas protegidas funcionando
- [ ] Sem erros críticos nos logs
- [ ] Performance mantida

---

## 🎯 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

1. ✅ Validar X-Frame-Options presente
2. ⏳ Executar testes pendentes (Mobile, WebSocket, Lotes)
3. ⏳ Executar teste PIX completo
4. ⏳ Monitorar latência em produção
5. ⏳ Preparar para testes beta

---

**Status:** ✅ **PRONTO PARA DEPLOY - EXECUTAR AGORA**

