# 🔴 AÇÕES MANUAIS NECESSÁRIAS - GO-LIVE

**Data:** 13 de Novembro de 2025  
**Status:** ⏳ **AGUARDANDO AÇÕES MANUAIS**

---

## ✅ **O QUE JÁ FOI FEITO AUTOMATICAMENTE**

1. ✅ Push realizado para triggerar deploy do frontend
2. ✅ Documentação criada e commitada
3. ✅ Scripts SQL criados
4. ✅ Guias criados

---

## 🔴 **O QUE VOCÊ PRECISA FAZER MANUALMENTE**

### **1. EXECUTAR SCRIPTS SQL NO SUPABASE** (15 minutos)

#### **Passo a Passo:**

1. **Acessar Supabase Dashboard:**
   ```
   URL: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql
   ```

2. **Abrir Arquivo:**
   ```
   Arquivo: E:\Chute de Ouro\goldeouro-backend\database\corrigir-supabase-security-warnings.sql
   ```

3. **Copiar Todo o Conteúdo:**
   - Abrir arquivo no editor
   - Selecionar tudo (CTRL+A)
   - Copiar (CTRL+C)

4. **Colar no SQL Editor do Supabase:**
   - Colar conteúdo completo
   - Verificar sintaxe
   - Clicar "Run" (CTRL+Enter)

5. **Verificar Resultado:**
   - Deve mostrar "Success"
   - Verificar Security Advisor para confirmar que warnings foram resolvidos

---

### **2. ROTACIONAR SECRETS EXPOSTOS** (30-60 minutos)

#### **Passo a Passo:**

**A. Verificar Secrets em Uso:**
```bash
fly secrets list -a goldeouro-backend-v2
```

**B. Rotacionar Supabase Service Role Key:**

1. Acessar: `https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/settings/api`
2. Clicar "Reset" na Service Role Key
3. Copiar nova chave
4. Atualizar em Fly.io:
   ```bash
   fly secrets set SUPABASE_SERVICE_ROLE_KEY="nova_chave" -a goldeouro-backend-v2
   ```

**C. Rotacionar JWT Secret (se necessário):**

1. Gerar novo secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Atualizar em Fly.io:
   ```bash
   fly secrets set JWT_SECRET="novo_secret" -a goldeouro-backend-v2
   ```

**Guia Completo:** `docs/seguranca/GUIA-ROTACAO-SECRETS-EXPOSTOS.md`

---

### **3. VERIFICAR DEPLOY DO FRONTEND** (10 minutos)

#### **Passo a Passo:**

1. **Verificar GitHub Actions:**
   ```
   URL: https://github.com/indesconectavel/gol-de-ouro/actions
   ```
   - Verificar workflow "Frontend Deploy (Vercel)"
   - Aguardar conclusão (~5-10 minutos)

2. **Verificar Vercel:**
   ```
   URL: https://vercel.com/goldeouro-admins-projects/goldeouro-player/deployments
   ```
   - Verificar último deploy
   - Status deve ser "Ready"

3. **Testar Site:**
   ```
   URL: https://goldeouro.lol/
   ```
   - Deve carregar página de login (não 404)

---

### **4. TESTES FINAIS** (30-60 minutos)

#### **Checklist de Testes:**

- [ ] Registro de usuário
- [ ] Login de usuário
- [ ] Criar depósito PIX
- [ ] Realizar chute no jogo
- [ ] Solicitar saque
- [ ] Verificar saldo atualizado

**Guia Completo:** `docs/verificacao/GUIA-VERIFICACAO-COMPLETA-PAGINAS.md`

---

## ⏱️ **TEMPO TOTAL: 1-2 HORAS**

---

## 📋 **ORDEM RECOMENDADA**

1. **Primeiro:** Executar scripts SQL (15 min)
2. **Segundo:** Verificar deploy frontend (10 min)
3. **Terceiro:** Rotacionar secrets (30-60 min)
4. **Quarto:** Testes finais (30-60 min)

---

**Status:** ⏳ **AGUARDANDO SUAS AÇÕES MANUAIS**

