# ✅ CHECKLIST E2E - GOL DE OURO MVP

**Data:** 2025-01-27  
**Versão:** v1.1.1 + SIMPLE_MVP  
**Status:** Produção

---

## **🎯 FLUXO COMPLETO E2E**

### **1️⃣ Preparação**
- [ ] Acessar https://www.goldeouro.lol/kill-sw.html
- [ ] Acessar https://admin.goldeouro.lol/kill-sw.html
- [ ] Confirmar cache limpo
- [ ] Verificar rewrites /api → BACKEND_URL

### **2️⃣ Player Frontend**
- [ ] **Login:** free10signer@gmail.com / password
- [ ] **Perfil:** Dados carregando corretamente
- [ ] **Depósito PIX:** Criar PIX de R$ 10,00
- [ ] **Pagar PIX:** Escanear QR e pagar
- [ ] **Saldo:** Confirmar crédito automático
- [ ] **Jogar:** Apostar R$ 5,00 e jogar
- [ ] **Resultado:** Ver ganho/perda no saldo
- [ ] **Saque:** Solicitar saque de R$ 3,00
- [ ] **Chave PIX:** Informar CPF válido
- [ ] **Confirmação:** Saque processado automaticamente
- [ ] **Logout:** Sair da conta

### **3️⃣ Admin Frontend**
- [ ] **Login:** admin@admin.com / password
- [ ] **Dashboard:** Estatísticas reais carregando
- [ ] **Usuários:** Lista de usuários reais
- [ ] **Jogos:** Histórico de jogos reais
- [ ] **Saques:** Lista de saques reais
- [ ] **Logs:** Logs do sistema funcionando
- [ ] **Logout:** Sair da conta

### **4️⃣ Backend API**
- [ ] **Health:** https://goldeouro-backend-v2.fly.dev/health
- [ ] **Login Player:** POST /auth/login
- [ ] **Login Admin:** POST /auth/login
- [ ] **Perfil:** GET /api/user/me
- [ ] **PIX Criar:** POST /api/payments/pix/criar
- [ ] **PIX Webhook:** POST /api/payments/pix/webhook
- [ ] **Jogo:** POST /api/games/shoot
- [ ] **Saque:** POST /api/withdraw/request
- [ ] **Admin Stats:** GET /api/admin/stats
- [ ] **Logout:** POST /auth/logout

---

## **📊 RESULTADOS ESPERADOS**

### **✅ Player Frontend**
- Login: 200 OK
- Perfil: 200 OK (dados reais)
- Depósito: 200 OK (QR gerado)
- Jogo: 200 OK (resultado correto)
- Saque: 200 OK (processado)
- Logout: 200 OK

### **✅ Admin Frontend**
- Login: 200 OK
- Dashboard: 200 OK (dados reais)
- Usuários: 200 OK (lista real)
- Jogos: 200 OK (histórico real)
- Saques: 200 OK (lista real)
- Logout: 200 OK

### **✅ Backend API**
- Health: 200 OK
- Todas as rotas: 200 OK
- PIX funcionando: Sim
- Webhook funcionando: Sim
- Dados reais: Sim

---

## **🔧 COMANDOS DE TESTE**

### **Teste E2E Automatizado**
```bash
node test-e2e-mvp-final.cjs
```

### **Teste Manual Player**
```bash
# Login
curl -X POST https://goldeouro-backend-v2.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"password"}'

# PIX
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":10.00,"description":"Teste","user_id":"free10signer@gmail.com"}'
```

### **Teste Manual Admin**
```bash
# Login Admin
curl -X POST https://goldeouro-backend-v2.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"password"}'

# Stats
curl -X GET https://goldeouro-backend-v2.fly.dev/api/admin/stats \
  -H "Authorization: Bearer <token>"
```

---

## **📱 TESTE PWA**

### **Instalação Android**
1. Acesse https://www.goldeouro.lol
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação
5. Teste todas as funcionalidades

### **Instalação iOS**
1. Acesse https://www.goldeouro.lol
2. Toque no botão de compartilhar
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação
5. Teste todas as funcionalidades

---

## **🌐 TESTE DE REDE**

### **WiFi**
- [ ] Login funcionando
- [ ] PIX funcionando
- [ ] Jogo funcionando
- [ ] Saque funcionando

### **3G/4G**
- [ ] Login funcionando
- [ ] PIX funcionando
- [ ] Jogo funcionando
- [ ] Saque funcionando

### **Offline**
- [ ] App não abre (esperado)
- [ ] Mensagem de erro clara
- [ ] Reconexão automática

---

## **🔒 TESTE DE SEGURANÇA**

### **Autenticação**
- [ ] Tokens JWT válidos
- [ ] Cookies httpOnly
- [ ] Sessão expira corretamente
- [ ] Logout limpa sessão

### **PIX**
- [ ] Validação de valores
- [ ] Chaves PIX validadas
- [ ] Webhook autenticado
- [ ] Logs de auditoria

### **Dados**
- [ ] Senhas criptografadas
- [ ] Dados sensíveis protegidos
- [ ] HTTPS obrigatório
- [ ] CORS configurado

---

## **📈 MÉTRICAS DE PERFORMANCE**

### **Tempo de Resposta**
- [ ] Login: < 2s
- [ ] PIX: < 3s
- [ ] Jogo: < 1s
- [ ] Saque: < 2s

### **Uptime**
- [ ] Player: 99.9%
- [ ] Admin: 99.9%
- [ ] Backend: 99.9%

### **Erros**
- [ ] Taxa de erro: < 1%
- [ ] Timeout: < 0.1%
- [ ] 500 errors: < 0.1%

---

## **✅ CRITÉRIOS DE ACEITE**

### **Funcionalidade**
- [ ] Fluxo completo funcionando
- [ ] PIX real funcionando
- [ ] Saque automático funcionando
- [ ] Admin com dados reais
- [ ] PWA instalável

### **Segurança**
- [ ] Autenticação segura
- [ ] PIX validado
- [ ] Dados protegidos
- [ ] Logs de auditoria

### **Performance**
- [ ] Tempo de resposta < 3s
- [ ] Uptime > 99%
- [ ] Taxa de erro < 1%

---

## **🆘 PROBLEMAS CONHECIDOS**

### **Resolvidos**
- ✅ CSP bloqueando imagens
- ✅ Service Worker causando cache
- ✅ Login admin com credenciais incorretas
- ✅ Dados fictícios no admin

### **Em Monitoramento**
- ⚠️ Payouts PIX (aguardando habilitação)
- ⚠️ Rate limiting (configurado)

---

**Checklist E2E atualizado em:** 2025-01-27 16:45 BRT  
**Próxima revisão:** Após 7 dias de produção