# 🔧 CORREÇÕES PRIORITÁRIAS - CODE SCANNING ALERTS

**Data:** 14 de Novembro de 2025  
**Status:** 🟡 **ANÁLISE E CORREÇÕES NECESSÁRIAS**

---

## 🔴 PRIORIDADE 1: SERVER-SIDE REQUEST FORGERY (SSRF)

### **Localização:** `server-fly.js:1745`

**Código Atual:**
```javascript
// Linha 1745
const payment = await axios.get(
  `https://api.mercadopago.com/v1/payments/${data.id}`,
  { 
    headers: { 
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  }
);
```

**Análise:**
- ✅ URL base é fixa (`https://api.mercadopago.com`) - seguro
- ⚠️ `data.id` vem do webhook (fonte externa)
- ⚠️ Não há validação se `data.id` é um número válido
- ⚠️ CodeQL alerta porque `data.id` é entrada externa

**Risco Real:** BAIXO (URL é fixa), mas CodeQL está tecnicamente correto.

**Correção Recomendada:**
```javascript
// Validar que data.id é um número válido antes de usar
if (!data.id || typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
  console.error('❌ [WEBHOOK] ID de pagamento inválido:', data.id);
  return res.status(400).json({ success: false, message: 'ID de pagamento inválido' });
}

// Construir URL de forma segura
const paymentId = parseInt(data.id, 10);
if (isNaN(paymentId) || paymentId <= 0) {
  console.error('❌ [WEBHOOK] ID de pagamento inválido:', data.id);
  return res.status(400).json({ success: false, message: 'ID de pagamento inválido' });
}

const payment = await axios.get(
  `https://api.mercadopago.com/v1/payments/${paymentId}`,
  { 
    headers: { 
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  }
);
```

---

## 🟠 PRIORIDADE 2: OUTROS ALERTAS DE ALTA SEVERIDADE

### **1. Polynomial Regular Expression - `server-fly-deploy.js:787`**

**Problema:** Regex polinomial pode causar ReDoS.

**Ação:** Revisar regex e substituir por alternativa mais segura ou usar biblioteca de validação.

---

### **2. Format String Externamente Controlado - `routes/mpWebhook.js:136`**

**Problema:** String de formato controlada externamente.

**Ação:** Validar e sanitizar strings de formato ou usar template strings.

---

### **3. Sanitização Incompleta - `utils/pix-validator.js:188`**

**Problema:** Sanitização incompleta pode permitir bypass.

**Ação:** Completar sanitização usando biblioteca como `validator.js`.

---

### **4. String Escaping Incompleto - `server-fly.js:472`**

**Problema:** Escapamento incompleto pode permitir injeção.

**Ação:** Completar escapamento usando funções apropriadas para o contexto.

---

### **5. HTML Filtering Regexp - `server-fly.js:470`**

**Problema:** Regexp de filtragem HTML inadequada.

**Ação:** Substituir por biblioteca como `sanitize-html` ou `DOMPurify`.

---

### **6. Insecure Randomness - `services/emailService.js:71`**

**Problema:** Gerador de números aleatórios inseguro.

**Ação:** Substituir por `crypto.randomBytes()` ou `crypto.getRandomValues()`.

---

## 💡 COMO CORRIGIR COM COPILOT AUTOFIX

### **Passo a Passo:**

1. **Acesse o alerta no GitHub:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/security/code-scanning
   ```

2. **Clique em um alerta específico** (ex: SSRF em server-fly.js:1745)

3. **Veja o código problemático** destacado

4. **Use Copilot Autofix:**
   - O GitHub vai sugerir uma correção automaticamente
   - Revise a sugestão
   - Se estiver correto, clique em "Apply fix"

5. **Teste a correção:**
   - Execute testes
   - Verifique se não quebrou funcionalidade
   - Faça commit e push

---

## 📋 PLANO DE EXECUÇÃO

### **Fase 1: Críticos (Esta semana)**
1. [ ] Corrigir SSRF em `server-fly.js:1745` (usar validação acima)
2. [ ] Testar webhook do Mercado Pago após correção
3. [ ] Verificar se outros SSRF foram corrigidos

### **Fase 2: Altos (Próximas 2 semanas)**
1. [ ] Corrigir Polynomial regex em `server-fly-deploy.js:787`
2. [ ] Corrigir Format string em `routes/mpWebhook.js:136`
3. [ ] Corrigir Sanitização em `utils/pix-validator.js:188`
4. [ ] Corrigir String escaping em `server-fly.js:472`
5. [ ] Corrigir HTML filtering em `server-fly.js:470`
6. [ ] Corrigir Insecure randomness em `services/emailService.js:71`

### **Fase 3: Revisão**
1. [ ] Revisar todos os alertas corrigidos
2. [ ] Executar testes completos
3. [ ] Verificar se novos alertas foram criados
4. [ ] Fechar alertas resolvidos no GitHub

---

## 🔗 LINKS ÚTEIS

### **Ver todos os alertas:**
```
https://github.com/indesconectavel/gol-de-ouro/security/code-scanning
```

### **Documentação CodeQL:**
- https://codeql.github.com/docs/
- https://codeql.github.com/docs/codeql-language-guides/

### **Bibliotecas Recomendadas:**
- `validator.js` - Validação de dados
- `sanitize-html` - Sanitização HTML
- `DOMPurify` - Sanitização HTML (mais seguro)
- `crypto` (built-in Node.js) - Geração segura de números aleatórios

---

## ✅ RESUMO

### **✅ BOM SINAL:**
- CodeQL está funcionando perfeitamente
- Encontrou problemas reais de segurança
- Copilot Autofix está disponível para ajudar

### **🟡 AÇÃO NECESSÁRIA:**
- Corrigir SSRF primeiro (validação de `data.id`)
- Corrigir outros alertas de alta severidade
- Usar Copilot Autofix para facilitar correções

### **📋 PRÓXIMOS PASSOS:**
1. Começar pelo SSRF em `server-fly.js:1745`
2. Usar validação sugerida acima
3. Testar webhook após correção
4. Continuar com outros alertas

---

**Última atualização:** 14 de Novembro de 2025  
**Status:** 🟡 **CORREÇÕES PRIORITÁRIAS IDENTIFICADAS**

