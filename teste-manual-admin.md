# 🧪 TESTE MANUAL DO ADMIN - INSTRUÇÕES

## **PASSO A PASSO PARA TESTE MANUAL:**

### **1. Abrir Navegador**
- Abrir Chrome/Firefox em **janela anônima**
- Ir para: `https://admin.goldeouro.lol/`

### **2. Verificar Comportamento Esperado**
- ✅ **DEVE aparecer:** "Verificando autenticação..." (por alguns segundos)
- ✅ **DEVE redirecionar:** Para `/login` automaticamente
- ❌ **NÃO DEVE aparecer:** Painel admin diretamente

### **3. Verificar Console do Navegador**
- Pressionar F12
- Ir na aba "Console"
- Verificar se há erros JavaScript

### **4. Testar Login**
- Na página de login, digitar: `G0ld3@0ur0_2025!`
- Clicar em "Entrar no Painel"
- Verificar se redireciona para o dashboard

### **5. Relatar Resultados**
- O que aparece na tela?
- Há erros no console?
- O redirecionamento funciona?
- O login funciona?

---

## **RESULTADOS ESPERADOS:**

### **✅ SE FUNCIONANDO:**
1. Acesso direto → Redireciona para login
2. Login com senha → Acesso ao painel
3. Dados zerados no dashboard
4. Sem erros no console

### **❌ SE COM PROBLEMA:**
1. Acesso direto → Mostra painel sem login
2. Console mostra erros JavaScript
3. Não redireciona para login
4. Login não funciona

---

**IMPORTANTE:** Este teste manual é crucial para identificar se o problema está no JavaScript do cliente ou na configuração do servidor.
