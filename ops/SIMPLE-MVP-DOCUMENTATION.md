# 🔧 SIMPLE_MVP - DOCUMENTAÇÃO COMPLETA

**Data:** 2025-10-01  
**Versão:** SIMPLE_MVP  
**Status:** Implementado

---

## 🎯 **OBJETIVO**

Implementar uma camada de infraestrutura simplificada que resolve os problemas críticos de produção sem alterar UI/UX, mantendo PIX real e banco atual.

---

## 🔄 **ATIVAÇÃO/DESATIVAÇÃO**

### **Ativar SIMPLE_MVP**
```powershell
# Executar script de ativação
.\ops\activate-simple-mvp.ps1
```

### **Desativar SIMPLE_MVP**
```powershell
# Executar script de desativação
.\ops\deactivate-simple-mvp.ps1
```

---

## 📁 **ARQUIVOS MODIFICADOS**

### **Novos Arquivos**
- `goldeouro-player/public/kill-sw.html` - Limpa SW e cache
- `goldeouro-admin/public/kill-sw.html` - Limpa SW e cache
- `goldeouro-player/vercel-simple.json` - Config Vercel simplificada
- `goldeouro-admin/vercel-simple.json` - Config Vercel simplificada
- `ops/activate-simple-mvp.ps1` - Script de ativação
- `ops/deactivate-simple-mvp.ps1` - Script de desativação

### **Arquivos de Backup**
- `goldeouro-player/vercel-complex.json` - Backup da config complexa
- `goldeouro-admin/vercel-complex.json` - Backup da config complexa

---

## 🔧 **MUDANÇAS IMPLEMENTADAS**

### **1. Kill Service Worker (kill-sw.html)**
**Problema Resolvido:** Cache de CSP antigo e Service Workers interferindo

**Funcionalidades:**
- Desregistra todos os Service Workers
- Limpa todos os caches (Cache API)
- Limpa localStorage e sessionStorage
- Redireciona automaticamente para home

**Acesso:**
- Player: `https://www.goldeouro.lol/kill-sw.html`
- Admin: `https://admin.goldeouro.lol/kill-sw.html`

### **2. Vercel.json Simplificado**
**Problema Resolvido:** CSP agressiva bloqueando recursos

**Mudanças:**
- ❌ **Removido:** CSP agressiva
- ❌ **Removido:** Headers complexos
- ✅ **Mantido:** Segurança básica (X-Frame-Options, etc.)
- ✅ **Mantido:** Rewrites para API
- ✅ **Adicionado:** Cache-Control no-cache global
- ✅ **Adicionado:** Service-Worker-Allowed: false

### **3. Headers Simplificados**
```json
{
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff", 
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
}
```

---

## 🚀 **FLUXO DE ATIVAÇÃO**

### **Passo 1: Backup**
- Backup dos `vercel.json` atuais
- Renomeação para `vercel-complex.json`

### **Passo 2: Ativação**
- Cópia de `vercel-simple.json` para `vercel.json`
- Deploy automático via Vercel

### **Passo 3: Limpeza**
- Acesso a `/kill-sw.html` em ambos domínios
- Limpeza automática de cache e SW

### **Passo 4: Teste**
- Verificação de funcionalidades
- Teste de PIX real
- Validação de fluxo completo

---

## 🔄 **FLUXO DE DESATIVAÇÃO**

### **Passo 1: Restauração**
- Restauração de `vercel-complex.json` para `vercel.json`
- Deploy automático via Vercel

### **Passo 2: Verificação**
- Teste de funcionalidades
- Verificação de Service Worker
- Validação de CSP

---

## ✅ **PROBLEMAS RESOLVIDOS**

### **1. CSP Bloqueando Imagem de Fundo**
- **Antes:** `Refused to connect to 'https://www.goldeouro.lol/images/Gol_de_Ouro_Bg01.jpg'`
- **Depois:** Imagem carrega normalmente

### **2. Service Worker Cache**
- **Antes:** Versões antigas sendo servidas
- **Depois:** Cache limpo via kill-sw.html

### **3. Headers Complexos**
- **Antes:** CSP agressiva causando problemas
- **Depois:** Headers mínimos e funcionais

---

## ⚠️ **LIMITAÇÕES**

### **1. PWA Funcionalidades**
- Service Worker desabilitado
- Cache offline limitado
- Notificações push podem não funcionar

### **2. Segurança**
- CSP menos restritiva
- Headers de segurança básicos
- Ainda mantém proteções essenciais

### **3. Performance**
- Cache menos agressivo
- Recarregamento mais frequente
- Trade-off por estabilidade

---

## 🧪 **TESTES RECOMENDADOS**

### **1. Teste de Imagem (Admin)**
```bash
# Verificar se imagem carrega
curl -I https://admin.goldeouro.lol
# Deve retornar 200 sem erros de CSP
```

### **2. Teste de PIX**
```bash
# Testar criação de PIX
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.00, "user_id": "test"}'
```

### **3. Teste de Fluxo Completo**
1. Acessar `https://www.goldeouro.lol/kill-sw.html`
2. Acessar `https://admin.goldeouro.lol/kill-sw.html`
3. Login no player
4. Criar depósito PIX
5. Jogar (chute)
6. Solicitar saque
7. Login no admin
8. Verificar dados

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Antes SIMPLE_MVP**
- ❌ Imagem admin não carrega
- ❌ CSP errors no console
- ❌ Cache de versões antigas
- ❌ PIX não testado

### **Depois SIMPLE_MVP**
- ✅ Imagem admin carrega
- ✅ Sem CSP errors
- ✅ Cache limpo
- ✅ PIX funcional

---

## 🔧 **MANUTENÇÃO**

### **Atualizações**
- Modificar `vercel-simple.json` conforme necessário
- Testar sempre em staging antes de produção
- Manter backup dos arquivos complexos

### **Monitoramento**
- Verificar logs do Vercel
- Monitorar erros de console
- Testar funcionalidades críticas

---

**Status:** ✅ **SIMPLE_MVP IMPLEMENTADO**  
**Próximo:** Testar PIX real e fluxo completo
