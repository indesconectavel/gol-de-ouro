# 🌐 GUIA COMPLETO - CONFIGURAÇÃO DOMÍNIO GOLDEOURO.LOL

## 🎯 **OBJETIVO:**
Configurar o domínio `goldeouro.lol` na Hostinger e conectar ao Vercel para ter uma página profissional.

---

## 📋 **PASSO A PASSO:**

### **1. 🛒 COMPRAR DOMÍNIO NA HOSTINGER:**

#### **1.1 Acessar Hostinger:**
- **URL:** https://hostinger.com.br
- **Buscar:** "goldeouro.lol"
- **Verificar disponibilidade**

#### **1.2 Comprar Domínio:**
- **Período:** 1 ano (recomendado)
- **Proteção WHOIS:** Ativada
- **Auto-renovação:** Configurada

#### **1.3 Acessar Painel:**
- **Login:** Conta Hostinger
- **Navegar:** "Domínios" → "goldeouro.lol"
- **Acessar:** "Gerenciar DNS"

---

### **2. ⚙️ CONFIGURAR DNS NO VERCEL:**

#### **2.1 Adicionar Domínio:**
```bash
# No Vercel Dashboard
1. Projeto: goldeouro-player
2. Settings → Domains
3. Add Domain: "goldeouro.lol"
4. Verificar configuração
```

#### **2.2 Configurar Registros DNS:**
```
Tipo: A
Nome: @
Valor: 76.76.19.61

Tipo: CNAME  
Nome: www
Valor: cname.vercel-dns.com
```

---

### **3. 🔧 CONFIGURAÇÃO HOSTINGER:**

#### **3.1 Registros DNS:**
```
A Record:
- Nome: @
- Valor: 76.76.19.61
- TTL: 3600

CNAME Record:
- Nome: www
- Valor: cname.vercel-dns.com
- TTL: 3600
```

#### **3.2 Verificar Configuração:**
- **Aguardar:** 24-48h para propagação
- **Testar:** `nslookup goldeouro.lol`
- **Verificar:** Status no Vercel

---

### **4. 🎮 CONFIGURAÇÃO PÁGINA INICIAL:**

#### **4.1 Estrutura Atual:**
```
goldeouro.lol/ → Login (✅ Já configurado)
goldeouro.lol/register → Registro
goldeouro.lol/dashboard → Dashboard
goldeouro.lol/game → Jogo
```

#### **4.2 Vantagens:**
- **UX:** Usuário acessa e já vê o jogo
- **Conversão:** Maior chance de registro
- **Profissional:** Domínio personalizado

---

### **5. 🚀 DEPLOY E TESTE:**

#### **5.1 Deploy Automático:**
```bash
# O Vercel já está configurado
# Qualquer push no GitHub = Deploy automático
```

#### **5.2 Teste Final:**
```bash
# URLs para testar:
1. https://goldeouro.lol (Login)
2. https://goldeouro.lol/register
3. https://goldeouro.lol/dashboard
```

---

## 💰 **CUSTOS ESTIMADOS:**

### **Hostinger:**
- **Domínio .lol:** ~R$ 15-25/ano
- **Proteção WHOIS:** Gratuita
- **Total:** ~R$ 20/ano

### **Vercel:**
- **Hospedagem:** Gratuita (Plano Hobby)
- **Domínio personalizado:** Gratuito
- **SSL:** Automático e gratuito

---

## ✅ **BENEFÍCIOS:**

### **1. 🎯 Profissionalismo:**
- Domínio personalizado
- SSL automático
- Performance otimizada

### **2. 🚀 Marketing:**
- Fácil de lembrar
- Perfeito para redes sociais
- Branding consistente

### **3. 📱 SEO:**
- Domínio relevante
- Estrutura otimizada
- Carregamento rápido

---

## 🔧 **COMANDOS ÚTEIS:**

### **Verificar DNS:**
```bash
nslookup goldeouro.lol
dig goldeouro.lol
```

### **Testar SSL:**
```bash
curl -I https://goldeouro.lol
```

### **Deploy Manual:**
```bash
npx vercel --prod
```

---

## 📞 **SUPORTE:**

### **Hostinger:**
- **Chat:** 24/7 em português
- **Email:** suporte@hostinger.com
- **Telefone:** Disponível no site

### **Vercel:**
- **Documentação:** https://vercel.com/docs
- **Suporte:** https://vercel.com/support
- **Status:** https://vercel-status.com

---

## 🎉 **RESULTADO FINAL:**

```
✅ Domínio: goldeouro.lol
✅ Hospedagem: Vercel (gratuita)
✅ SSL: Automático
✅ Performance: Otimizada
✅ Página inicial: Login
✅ Deploy: Automático
```

**Total de custo: ~R$ 20/ano apenas pelo domínio!**
