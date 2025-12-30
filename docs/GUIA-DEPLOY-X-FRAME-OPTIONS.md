# 🚀 GUIA DE DEPLOY - X-Frame-Options

## 📋 OBJETIVO

Aplicar correção do X-Frame-Options no backend em produção.

---

## ✅ CORREÇÃO APLICADA

**Arquivo:** `server-fly.js` (linha ~263)

**Mudança:**
```javascript
frameguard: {
  action: 'deny' // ✅ GO-LIVE: Adicionar X-Frame-Options: DENY
}
```

**Status:** ✅ **CORRIGIDO NO CÓDIGO** - Aguardando deploy

---

## 🚀 PASSOS PARA DEPLOY

### **Opção 1: Deploy via Fly.io CLI (Recomendado)**

```bash
# 1. Verificar se está autenticado
flyctl auth whoami

# 2. Verificar status atual
flyctl status -a goldeouro-backend-v2

# 3. Fazer deploy
flyctl deploy -a goldeouro-backend-v2

# 4. Aguardar deploy concluir (2-5 minutos)

# 5. Validar correção
bash scripts/validar-x-frame-options.sh
```

---

### **Opção 2: Deploy via GitHub Actions**

Se houver workflow configurado:
1. Fazer commit das mudanças
2. Push para branch principal
3. GitHub Actions executará deploy automaticamente

---

### **Opção 3: Deploy Manual via Fly.io Dashboard**

1. Acessar https://fly.io/dashboard
2. Selecionar app `goldeouro-backend-v2`
3. Ir para "Deployments"
4. Clicar em "Deploy" ou fazer push do código

---

## ✅ VALIDAÇÃO APÓS DEPLOY

### **1. Validar X-Frame-Options**

```bash
bash scripts/validar-x-frame-options.sh
```

**Esperado:**
```
✅ X-Frame-Options encontrado:
   x-frame-options: DENY
```

---

### **2. Executar Teste Completo**

```bash
bash scripts/teste-completo-pre-deploy.sh
```

**Esperado:**
- ✅ Todos os testes passam
- ✅ X-Frame-Options presente
- ✅ Rotas protegidas funcionando

---

### **3. Verificar Logs**

```bash
flyctl logs -a goldeouro-backend-v2
```

**Verificar:**
- ✅ Servidor iniciou corretamente
- ✅ Sem erros críticos
- ✅ Health check passando

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após deploy, verificar:

- [ ] Health check retorna 200 OK
- [ ] X-Frame-Options presente nos headers
- [ ] X-Content-Type-Options presente
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Admin stats funciona com token
- [ ] Sem erros nos logs
- [ ] Performance mantida

---

## 🔍 VERIFICAÇÃO MANUAL

### **Via cURL:**

```bash
curl -I https://goldeouro-backend-v2.fly.dev/health
```

**Verificar headers:**
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`

---

### **Via Navegador:**

1. Abrir DevTools (F12)
2. Ir para aba Network
3. Fazer requisição para `/health`
4. Verificar Response Headers
5. Confirmar `X-Frame-Options: DENY`

---

## ⚠️ TROUBLESHOOTING

### **Problema: X-Frame-Options não aparece após deploy**

**Possíveis causas:**
1. Cache do CDN (aguardar 5-10 minutos)
2. Deploy não concluído (verificar logs)
3. Helmet não aplicado corretamente

**Solução:**
1. Aguardar propagação CDN
2. Verificar logs do deploy
3. Verificar configuração do Helmet

---

### **Problema: Deploy falha**

**Solução:**
1. Verificar logs: `flyctl logs -a goldeouro-backend-v2`
2. Verificar status: `flyctl status -a goldeouro-backend-v2`
3. Verificar secrets: `flyctl secrets list -a goldeouro-backend-v2`

---

## 📝 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

1. ✅ Validar X-Frame-Options presente
2. ⏳ Executar testes pendentes (Mobile, WebSocket, Lotes)
3. ⏳ Executar teste PIX completo
4. ⏳ Monitorar latência em produção
5. ⏳ Preparar para testes beta

---

**Status:** ✅ **CORREÇÃO PRONTA - AGUARDANDO DEPLOY**

