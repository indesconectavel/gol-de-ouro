# 📋 FASE 3 — BLOCO B3: DEPLOY UI
## Deploy Controlado da UI Web (Player + Admin)

**Data:** 19/12/2025  
**Hora:** 16:02:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

---

## 🎯 OBJETIVO

Executar deploy controlado da UI Web (Player e Admin), validando login real e fluxo completo do jogador.

---

## ⚠️ REGRAS ABSOLUTAS

- ✅ **Validar cada etapa antes de prosseguir**
- ✅ **Testar login real após deploy**
- ✅ **Validar fluxo completo do jogador**
- ✅ **Capacidade de rollback imediato**

---

## 📋 PROCEDIMENTO DE DEPLOY

### **ETAPA 1: Deploy Player (Vercel)**

#### **1.1. Preparação**

**Projeto:** `goldeouro-player`  
**Plataforma:** Vercel  
**URL Esperada:** `https://app.goldeouro.lol` ou `https://player.goldeouro.lol`

**Validação Pré-Deploy:**
- ✅ Variáveis de ambiente validadas
- ✅ Build local funcionando
- ✅ Código commitado e pushado

---

#### **1.2. Executar Deploy**

**Método 1: Via Vercel Dashboard**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto: `goldeouro-player`
3. Clicar em "Deploy" ou "Redeploy"
4. Selecionar branch: `main` ou `release-v1.0.0`
5. Confirmar deploy

**Método 2: Via CLI**
```bash
# Navegar para diretório do player
cd goldeouro-player

# Deploy via Vercel CLI
vercel --prod

# OU se já configurado
vercel deploy --prod
```

**Registrar:**
- ✅ Timestamp do deploy: `_____________`
- ✅ URL de deploy: `_____________`
- ✅ Build ID: `_____________`

---

#### **1.3. Validação Pós-Deploy**

**3.1. Acessar URL de Produção**

**URL:** `https://app.goldeouro.lol` ou `https://player.goldeouro.lol`

**Validação:**
- ✅ Página deve carregar sem erros
- ✅ Nenhum erro no console do navegador
- ✅ Assets carregando corretamente

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.2. Login Real**

**Fluxo de Teste:**
1. Acessar página de login
2. Inserir credenciais reais de teste
3. Clicar em "Entrar"
4. Validar redirecionamento

**Validação:**
- ✅ Login deve funcionar corretamente
- ✅ Token deve ser armazenado
- ✅ Redirecionamento deve ocorrer
- ✅ Nenhum erro no console

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.3. Fluxo Completo do Jogador**

**Etapas de Validação:**

1. **Dashboard**
   - ✅ Deve carregar saldo do usuário
   - ✅ Deve exibir métricas globais
   - ✅ Nenhum erro visível

2. **Jogo**
   - ✅ Deve permitir selecionar direção
   - ✅ Deve permitir inserir valor de aposta
   - ✅ Deve executar chute corretamente
   - ✅ Deve exibir resultado

3. **Pagamento PIX**
   - ✅ Deve permitir criar pagamento PIX
   - ✅ Deve exibir QR Code
   - ✅ Deve permitir copiar chave PIX

4. **Perfil**
   - ✅ Deve exibir dados do usuário
   - ✅ Deve permitir editar perfil (se aplicável)

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

### **ETAPA 2: Deploy Admin (Vercel)**

#### **2.1. Preparação**

**Projeto:** `goldeouro-admin`  
**Plataforma:** Vercel  
**URL Esperada:** `https://admin.goldeouro.lol`

**Validação Pré-Deploy:**
- ✅ Variáveis de ambiente validadas
- ✅ Build local funcionando
- ✅ Código commitado e pushado

---

#### **2.2. Executar Deploy**

**Método 1: Via Vercel Dashboard**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto: `goldeouro-admin`
3. Clicar em "Deploy" ou "Redeploy"
4. Selecionar branch: `main` ou `release-v1.0.0`
5. Confirmar deploy

**Método 2: Via CLI**
```bash
# Navegar para diretório do admin
cd goldeouro-admin

# Deploy via Vercel CLI
vercel --prod

# OU se já configurado
vercel deploy --prod
```

**Registrar:**
- ✅ Timestamp do deploy: `_____________`
- ✅ URL de deploy: `_____________`
- ✅ Build ID: `_____________`

---

#### **2.3. Validação Pós-Deploy**

**3.1. Acessar URL de Produção**

**URL:** `https://admin.goldeouro.lol`

**Validação:**
- ✅ Página deve carregar sem erros
- ✅ Nenhum erro no console do navegador
- ✅ Assets carregando corretamente

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.2. Login Admin**

**Fluxo de Teste:**
1. Acessar página de login admin
2. Inserir credenciais admin
3. Clicar em "Entrar"
4. Validar redirecionamento

**Validação:**
- ✅ Login deve funcionar corretamente
- ✅ Token deve ser armazenado
- ✅ Redirecionamento deve ocorrer
- ✅ Nenhum erro no console

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

**3.3. Dashboard Admin**

**Validação:**
- ✅ Deve carregar estatísticas gerais
- ✅ Deve exibir dados de usuários
- ✅ Deve exibir dados de transações
- ✅ Nenhum erro visível

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

---

## 📊 REGISTRO DE DEPLOY

### **Deploy Player:**

| Item | Valor |
|------|-------|
| **Timestamp** | `_____________` |
| **URL** | `_____________` |
| **Build ID** | `_____________` |
| **Branch** | `main` ou `release-v1.0.0` |

---

### **Deploy Admin:**

| Item | Valor |
|------|-------|
| **Timestamp** | `_____________` |
| **URL** | `_____________` |
| **Build ID** | `_____________` |
| **Branch** | `main` ou `release-v1.0.0` |

---

### **Validações Realizadas:**

| Validação | Player | Admin |
|-----------|--------|-------|
| **Página Carrega** | ⏸️ | ⏸️ |
| **Login Funciona** | ⏸️ | ⏸️ |
| **Fluxo Completo** | ⏸️ | ⏸️ |
| **Sem Erros** | ⏸️ | ⏸️ |

---

## ⚠️ GATES DE SEGURANÇA

### **Gate 1: Página Carrega**

**Condição:** Página deve carregar sem erros  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

### **Gate 2: Login Funciona**

**Condição:** Login deve funcionar corretamente  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

### **Gate 3: Fluxo Completo**

**Condição:** Fluxo completo do jogador deve funcionar  
**Ação se falhar:** ⛔ **ABORTAR E EXECUTAR ROLLBACK**

---

## ✅ CONCLUSÃO DO DEPLOY UI

**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

**Próximo Passo:** BLOCO C - Validação Imediata Pós-Deploy

**Observações:**
- ⚠️ Deploy requer execução manual
- ✅ Procedimentos claros definidos
- ✅ Validações obrigatórias documentadas

---

**Documento gerado em:** 2025-12-19T16:02:00.000Z  
**Status:** ✅ **BLOCO B3 DOCUMENTADO - PRONTO PARA EXECUÇÃO**

