# 🎯 CHECKLIST E2E PRODUÇÃO - GOL DE OURO

**Data:** 2025-10-01  
**Versão:** v1.1.1 + SIMPLE_MVP  
**Status:** Checklist Completo

---

## 🚀 **PRÉ-REQUISITOS**

### **1. Ativar SIMPLE_MVP**
```powershell
# Windows PowerShell
.\ops\activate-simple-mvp.ps1

# Linux/Mac
./ops/activate-simple-mvp.sh
```

### **2. Limpar Cache**
- Acessar `https://www.goldeouro.lol/kill-sw.html`
- Acessar `https://admin.goldeouro.lol/kill-sw.html`
- Verificar Application → Service Workers (vazio)

---

## 🔍 **TESTE 1: INFRAESTRUTURA**

### **1.1 Backend (Fly.io)**
- [ ] **Health Check:** `https://goldeouro-backend-v2.fly.dev/health`
- [ ] **Status:** 200 OK
- [ ] **Resposta:** `{"ok": true, "database": "connected"}`

### **1.2 Player (Vercel)**
- [ ] **URL:** `https://www.goldeouro.lol`
- [ ] **Status:** 200 OK
- [ ] **Carregamento:** Página carrega sem erros
- [ ] **Console:** Sem erros críticos

### **1.3 Admin (Vercel)**
- [ ] **URL:** `https://admin.goldeouro.lol`
- [ ] **Status:** 200 OK
- [ ] **Carregamento:** Página carrega sem erros
- [ ] **Imagem Fundo:** Carrega corretamente
- [ ] **Console:** Sem erros CSP

---

## 🔐 **TESTE 2: AUTENTICAÇÃO**

### **2.1 Player - Login**
- [ ] **Acessar:** `https://www.goldeouro.lol`
- [ ] **Login:** `free10signer@gmail.com` / `Free10signer`
- [ ] **Resultado:** Login bem-sucedido
- [ ] **Redirecionamento:** Para dashboard do jogo
- [ ] **Verificar:** Cookie presente e usuário autenticado
- [ ] **Testar:** GET /me retorna dados do usuário

### **2.2 Player - Cadastro**
- [ ] **Acessar:** Página de cadastro
- [ ] **Dados:** Email, senha, confirmação
- [ ] **Resultado:** Cadastro bem-sucedido
- [ ] **Login:** Automático após cadastro

### **2.3 Admin - Login**
- [ ] **Acessar:** `https://admin.goldeouro.lol`
- [ ] **Login:** `admin@admin.com` / `G0ld3@0ur0_2025!`
- [ ] **Resultado:** Login bem-sucedido
- [ ] **Redirecionamento:** Para painel admin

---

## 💳 **TESTE 3: PIX - DEPÓSITO**

### **3.1 Criar Depósito PIX**
- [ ] **Acessar:** Seção de depósito
- [ ] **Valor:** R$ 1,00 (teste mínimo)
- [ ] **Descrição:** "Teste depósito"
- [ ] **Criar PIX:** Clicar em "Gerar PIX"
- [ ] **Resultado:** QR Code gerado
- [ ] **Status:** "Pendente"
- [ ] **Verificar:** Payment ID e external_reference nos logs

### **3.2 Verificar PIX**
- [ ] **QR Code:** Visível e legível
- [ ] **Código PIX:** Copiável
- [ ] **Valor:** R$ 10,00
- [ ] **Status:** "Pendente"

### **3.3 Simular Pagamento**
- [ ] **Usar app bancário:** Escanear QR Code
- [ ] **Valor:** R$ 10,00
- [ ] **Pagar:** Confirmar pagamento
- [ ] **Resultado:** Pagamento processado

---

## 🎮 **TESTE 4: JOGO**

### **4.1 Acessar Jogo**
- [ ] **Dashboard:** Ver saldo atual
- [ ] **Jogo:** Clicar em "Jogar"
- [ ] **Carregamento:** Jogo carrega

### **4.2 Fazer Chute**
- [ ] **Valor:** R$ 5,00
- [ ] **Direção:** Esquerda ou Direita
- [ ] **Chutar:** Confirmar aposta
- [ ] **Resultado:** Win/Lose exibido
- [ ] **Saldo:** Atualizado corretamente

### **4.3 Múltiplos Chutes**
- [ ] **Chute 1:** R$ 2,00 - Esquerda
- [ ] **Chute 2:** R$ 3,00 - Direita
- [ ] **Chute 3:** R$ 1,00 - Esquerda
- [ ] **Resultado:** Todos processados

---

## 💰 **TESTE 5: SAQUE**

### **5.1 Solicitar Saque**
- [ ] **Acessar:** Seção de saque
- [ ] **Valor:** R$ 5,00
- [ ] **Dados PIX:** Chave PIX válida
- [ ] **Solicitar:** Confirmar saque
- [ ] **Resultado:** Solicitação criada

### **5.2 Verificar Status**
- [ ] **Status:** "Pendente"
- [ ] **Valor:** R$ 5,00
- [ ] **Data:** Data atual
- [ ] **ID:** Gerado

---

## 👨‍💼 **TESTE 6: ADMIN PANEL**

### **6.1 Dashboard Admin**
- [ ] **Acessar:** `https://admin.goldeouro.lol`
- [ ] **Login:** Credenciais admin
- [ ] **Dashboard:** Carrega dados
- [ ] **Métricas:** Usuários, transações, saques

### **6.2 Gerenciar Usuários**
- [ ] **Lista:** Usuários cadastrados
- [ ] **Dados:** Nome, email, saldo
- [ ] **Filtros:** Funcionando

### **6.3 Gerenciar Transações**
- [ ] **Lista:** Transações PIX
- [ ] **Status:** Pendente/Aprovado
- [ ] **Valores:** Corretos

### **6.4 Gerenciar Saques**
- [ ] **Lista:** Solicitações de saque
- [ ] **Aprovar:** Funcionalidade
- [ ] **Rejeitar:** Funcionalidade

---

## 🔄 **TESTE 7: FLUXO COMPLETO**

### **7.1 Usuário Novo**
1. [ ] **Cadastro:** Novo usuário
2. [ ] **Login:** Primeiro acesso
3. [ ] **Depósito:** PIX R$ 20,00
4. [ ] **Jogar:** 3 chutes de R$ 5,00
5. [ ] **Saque:** R$ 10,00
6. [ ] **Logout:** Sair do sistema

### **7.2 Usuário Existente**
1. [ ] **Login:** Usuário existente
2. [ ] **Depósito:** PIX R$ 15,00
3. [ ] **Jogar:** 2 chutes de R$ 3,00
4. [ ] **Saque:** R$ 8,00
5. [ ] **Logout:** Sair do sistema

---

## 📱 **TESTE 8: MOBILE/PWA**

### **8.1 PWA Player**
- [ ] **Acessar:** `https://www.goldeouro.lol` (mobile)
- [ ] **Instalar:** "Adicionar à tela inicial"
- [ ] **App:** Abre como app nativo
- [ ] **Funcionalidades:** Todas funcionando

### **8.2 PWA Admin**
- [ ] **Acessar:** `https://admin.goldeouro.lol` (mobile)
- [ ] **Instalar:** "Adicionar à tela inicial"
- [ ] **App:** Abre como app nativo
- [ ] **Funcionalidades:** Todas funcionando

---

## 🚨 **TESTE 9: CENÁRIOS DE ERRO**

### **9.1 Login Inválido**
- [ ] **Email:** inexistente@test.com
- [ ] **Senha:** 123456
- [ ] **Resultado:** Erro "Credenciais inválidas"

### **9.2 PIX Inválido**
- [ ] **Valor:** R$ 0,50 (muito baixo)
- [ ] **Resultado:** Erro "Valor inválido"

### **9.3 Saque Maior que Saldo**
- [ ] **Saldo:** R$ 5,00
- [ ] **Saque:** R$ 10,00
- [ ] **Resultado:** Erro "Saldo insuficiente"

---

## 📊 **TESTE 10: PERFORMANCE**

### **10.1 Tempos de Resposta**
- [ ] **Player:** < 3 segundos
- [ ] **Admin:** < 3 segundos
- [ ] **API:** < 1 segundo
- [ ] **PIX:** < 5 segundos

### **10.2 Memória**
- [ ] **Backend:** < 100MB
- [ ] **Frontend:** < 50MB
- [ ] **Sem vazamentos:** Monitorar

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **Obrigatórios (100%)**
- [ ] Login player funciona
- [ ] Login admin funciona
- [ ] PIX cria e gera QR Code
- [ ] Jogo funciona (chute)
- [ ] Saque solicita corretamente
- [ ] Admin acessa dados
- [ ] Sem erros críticos no console

### **Desejáveis (80%)**
- [ ] PIX real funciona (com token MP)
- [ ] Webhook processa pagamentos
- [ ] Saldo credita automaticamente
- [ ] PWA instala corretamente
- [ ] Performance otimizada

---

## 📋 **RELATÓRIO FINAL**

### **Status Geral**
- [ ] ✅ **PASSOU** - Todos os testes obrigatórios
- [ ] ⚠️ **PARCIAL** - Alguns testes falharam
- [ ] ❌ **FALHOU** - Testes críticos falharam

### **Problemas Identificados**
1. ________________________________
2. ________________________________
3. ________________________________

### **Próximos Passos**
1. ________________________________
2. ________________________________
3. ________________________________

---

**Data do Teste:** _______________  
**Testador:** _______________  
**Versão:** v1.1.1 + SIMPLE_MVP
