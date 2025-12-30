# 🔐 GUIA COMPLETO - AUTENTICAR GITHUB CLI

**Data:** 14 de Novembro de 2025  
**Status:** ⏳ **AGUARDANDO CONCLUSÃO MANUAL**

---

## 📋 PROCESSO DE AUTENTICAÇÃO

### **Código de Autorização Gerado:**
```
81AB-0C67
```

### **Passos para Completar:**

1. **Pressione Enter** no terminal para abrir o navegador
   - Ou acesse manualmente: https://github.com/login/device

2. **Faça login** na sua conta GitHub (se necessário)

3. **Cole o código de autorização:** `81AB-0C67`
   - O código foi gerado automaticamente
   - Cole no campo "Enter code" na página do GitHub

4. **Autorize o GitHub CLI**
   - Clique em "Authorize github"
   - Confirme as permissões solicitadas

5. **Volte ao terminal**
   - O processo será concluído automaticamente
   - Você verá uma mensagem de sucesso

---

## ✅ VERIFICAÇÃO APÓS AUTENTICAÇÃO

Após completar a autenticação, execute:

```powershell
# Verificar status
gh auth status

# Testar comandos
gh pr view 18
gh repo view
```

---

## 🚀 PRÓXIMOS PASSOS APÓS AUTENTICAÇÃO

### **1. Verificar PR #18:**
```bash
gh pr view 18 --json state,merged,mergeable,reviewDecision,statusCheckRollup,url
```

### **2. Verificar Status Checks:**
```bash
gh pr checks 18
```

### **3. Aprovar PR (se necessário):**
```bash
gh pr review 18 --approve
```

### **4. Fazer Merge do PR:**
```bash
gh pr merge 18 --merge
```

---

## 📄 ARQUIVOS CRIADOS

- ✅ Script de autenticação: `scripts/autenticar-github-cli.ps1`
- ✅ Guia completo: `docs/seguranca/GUIA-AUTENTICAR-GITHUB-CLI.md`

---

**Última atualização:** 14 de Novembro de 2025

