# ⚠️ ANÁLISE DE ALERTAS DO CODE SCANNING

**Data:** 14 de Novembro de 2025  
**Status:** 🟡 **42 ALERTAS ABERTOS ENCONTRADOS PELO CODEQL**

---

## 📊 RESUMO DOS ALERTAS

### **Estatísticas:**
- **Total de alertas abertos:** 42
- **Alertas fechados:** 0
- **Ferramenta:** CodeQL
- **Branch:** main
- **Tempo:** Todos abertos há 1 hora

---

## 🔴 ALERTAS CRÍTICOS (3)

### **1. Server-side request forgery (SSRF)** - 3 ocorrências
- **Severidade:** Critical 🔴
- **Arquivos afetados:**
  - `server-fly.js:1745`
  - Outros locais (múltiplas ocorrências)

**O que é:** Permite que um atacante faça requisições HTTP a partir do servidor para recursos internos ou externos.

**Risco:** Alto - pode permitir acesso a recursos internos, bypass de firewall, ou ataques a serviços internos.

---

## 🟠 ALERTAS DE ALTA SEVERIDADE

### **2. Polynomial regular expression used on uncontrolled data**
- **Severidade:** High 🟠
- **Arquivo:** `server-fly-deploy.js:787`

**O que é:** Expressões regulares polinomiais podem causar ReDoS (Regular Expression Denial of Service).

**Risco:** Médio-Alto - pode causar negação de serviço se a entrada for grande.

---

### **3. Use of externally-controlled format string** - 3 ocorrências
- **Severidade:** High 🟠
- **Arquivos afetados:**
  - `routes/mpWebhook.js:136`
  - Outros locais

**O que é:** Uso de strings de formato controladas externamente pode permitir vazamento de informações ou execução de código.

**Risco:** Médio-Alto - pode permitir vazamento de informações sensíveis.

---

### **4. Incomplete multi-character sanitization** - 2 ocorrências
- **Severidade:** High 🟠
- **Arquivos afetados:**
  - `utils/pix-validator.js:188`
  - Outros locais

**O que é:** Sanitização incompleta pode permitir bypass de validações.

**Risco:** Médio - pode permitir bypass de validações de segurança.

---

### **5. Incomplete string escaping or encoding**
- **Severidade:** High 🟠
- **Arquivo:** `server-fly.js:472`

**O que é:** Escapamento ou codificação incompleta de strings pode permitir injeção de código.

**Risco:** Médio-Alto - pode permitir injeção de código ou XSS.

---

### **6. Bad HTML filtering regexp**
- **Severidade:** High 🟠 (marcado como "Test")
- **Arquivo:** `server-fly.js:470`

**O que é:** Regexp de filtragem HTML inadequada pode permitir bypass de filtros.

**Risco:** Médio - pode permitir bypass de filtros de segurança.

---

### **7. Insecure randomness**
- **Severidade:** High 🟠
- **Arquivo:** `services/emailService.js:71`

**O que é:** Uso de geradores de números aleatórios inseguros pode permitir previsibilidade.

**Risco:** Médio - pode permitir previsibilidade de tokens ou valores aleatórios.

---

## 📋 ARQUIVOS AFETADOS

### **Arquivos Principais:**
1. `server-fly.js` - Múltiplos alertas (linhas 470, 472, 1745)
2. `server-fly-deploy.js` - 1 alerta (linha 787)
3. `routes/mpWebhook.js` - 1 alerta (linha 136)
4. `utils/pix-validator.js` - 1 alerta (linha 188)
5. `services/emailService.js` - 1 alerta (linha 71)
6. `middlewares/security-performance.js` - 1 alerta (linha 382)
7. `limpeza-segura-sistema.js` - 1 alerta (linha 88)

### **Arquivos de Teste:**
- `tests/security/auth.test.js` - 1 alerta (linha 16)

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### **PRIORIDADE 1: CRÍTICOS (Imediato)**

#### **1. Corrigir Server-side request forgery (SSRF)**
- **Arquivo:** `server-fly.js:1745` e outros
- **Ação:** Validar e sanitizar URLs antes de fazer requisições
- **Solução:** Usar whitelist de domínios permitidos ou validar URLs

**Exemplo de correção:**
```javascript
// ANTES (inseguro)
const response = await fetch(userProvidedUrl);

// DEPOIS (seguro)
const allowedDomains = ['https://api.mercadopago.com', 'https://api.supabase.co'];
const url = new URL(userProvidedUrl);
if (!allowedDomains.includes(url.origin)) {
  throw new Error('URL não permitida');
}
const response = await fetch(url.toString());
```

---

### **PRIORIDADE 2: ALTOS (Urgente)**

#### **2. Corrigir Polynomial regular expression**
- **Arquivo:** `server-fly-deploy.js:787`
- **Ação:** Substituir regex polinomial por alternativa mais segura
- **Solução:** Usar bibliotecas de validação ou regex mais simples

#### **3. Corrigir Format string externamente controlado**
- **Arquivo:** `routes/mpWebhook.js:136`
- **Ação:** Validar e sanitizar strings de formato
- **Solução:** Usar template strings ou validação rigorosa

#### **4. Corrigir Sanitização incompleta**
- **Arquivo:** `utils/pix-validator.js:188`
- **Ação:** Completar sanitização de entrada
- **Solução:** Usar bibliotecas de sanitização como `validator.js` ou `sanitize-html`

#### **5. Corrigir String escaping incompleto**
- **Arquivo:** `server-fly.js:472`
- **Ação:** Completar escapamento de strings
- **Solução:** Usar funções de escape apropriadas para o contexto (HTML, SQL, etc.)

#### **6. Corrigir HTML filtering regexp**
- **Arquivo:** `server-fly.js:470`
- **Ação:** Substituir regex por biblioteca de sanitização HTML
- **Solução:** Usar `sanitize-html` ou `DOMPurify`

#### **7. Corrigir Insecure randomness**
- **Arquivo:** `services/emailService.js:71`
- **Ação:** Substituir por gerador seguro
- **Solução:** Usar `crypto.randomBytes()` ou `crypto.getRandomValues()`

---

## 💡 COMO USAR O COPILOT AUTOFIX

Você já tem **Copilot Autofix habilitado**! Use-o para corrigir automaticamente:

1. **Acesse cada alerta:**
   - Clique em um alerta na lista
   - Veja o código problemático

2. **Use Copilot Autofix:**
   - O GitHub vai sugerir correções automaticamente
   - Revise a sugestão
   - Aplique se estiver correto

3. **Teste a correção:**
   - Execute testes
   - Verifique se não quebrou funcionalidade
   - Faça commit e push

---

## 📋 CHECKLIST DE CORREÇÃO

### **Fase 1: Críticos (Esta semana)**
- [ ] ⚠️ Corrigir SSRF em `server-fly.js:1745`
- [ ] ⚠️ Corrigir outras ocorrências de SSRF

### **Fase 2: Altos (Próximas 2 semanas)**
- [ ] ⚠️ Corrigir Polynomial regex em `server-fly-deploy.js:787`
- [ ] ⚠️ Corrigir Format string em `routes/mpWebhook.js:136`
- [ ] ⚠️ Corrigir Sanitização em `utils/pix-validator.js:188`
- [ ] ⚠️ Corrigir String escaping em `server-fly.js:472`
- [ ] ⚠️ Corrigir HTML filtering em `server-fly.js:470`
- [ ] ⚠️ Corrigir Insecure randomness em `services/emailService.js:71`

### **Fase 3: Revisão (Após correções)**
- [ ] ⚠️ Revisar todos os alertas corrigidos
- [ ] ⚠️ Executar testes completos
- [ ] ⚠️ Verificar se novos alertas foram criados

---

## 🔗 LINKS ÚTEIS

### **Ver todos os alertas:**
```
https://github.com/indesconectavel/gol-de-ouro/security/code-scanning
```

### **Documentação CodeQL:**
- https://codeql.github.com/docs/
- https://codeql.github.com/docs/codeql-language-guides/

### **Guia de correção SSRF:**
- https://owasp.org/www-community/attacks/Server_Side_Request_Forgery

---

## ✅ RESUMO

### **✅ BOM SINAL:**
- CodeQL está funcionando perfeitamente
- Encontrou problemas reais de segurança
- Copilot Autofix está disponível para ajudar

### **🟡 AÇÃO NECESSÁRIA:**
- Corrigir 3 alertas críticos (SSRF)
- Corrigir 7+ alertas de alta severidade
- Usar Copilot Autofix para facilitar correções

### **📋 PRÓXIMOS PASSOS:**
1. Revisar alertas críticos primeiro
2. Usar Copilot Autofix para sugestões
3. Corrigir um alerta por vez
4. Testar cada correção
5. Fazer PR e merge após correção

---

**Última atualização:** 14 de Novembro de 2025  
**Status:** ⚠️ **42 ALERTAS ENCONTRADOS - PLANO DE CORREÇÃO CRIADO**

