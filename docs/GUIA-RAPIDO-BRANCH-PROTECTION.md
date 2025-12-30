# 🔒 GUIA RÁPIDO - CONFIGURAR BRANCH PROTECTION

**Data:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA RÁPIDO CRIADO**

---

## 🚀 PASSO A PASSO RÁPIDO

### **1. Acesse as Configurações:**
```
https://github.com/indesconectavel/gol-de-ouro/settings/branches
```

### **2. Adicione/Edite Regra para `main`**

### **3. Configure as Seguintes Opções:**

#### ✅ **MARQUE (Habilitar):**
- ✅ **Require a pull request before merging**
  - Required approvals: `1`
  - ✅ Dismiss stale reviews
  
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date
  - Adicione os status checks (execute workflows primeiro se não aparecerem):
    - `CI`
    - `🧪 Testes Automatizados` 
    - `🔒 Segurança e Qualidade`
  
- ✅ **Include administrators**

#### ❌ **DESMARQUE (Desabilitar):**
- ❌ **Allow force pushes**
- ❌ **Allow deletions**

### **4. Clique em "Save changes"**

---

## 📋 CHECKLIST RÁPIDO

- [ ] Acessar: https://github.com/indesconectavel/gol-de-ouro/settings/branches
- [ ] Adicionar/Editar regra para `main`
- [ ] Habilitar "Require a pull request before merging" (1 aprovação)
- [ ] Habilitar "Require status checks" (CI, Testes, Segurança)
- [ ] Habilitar "Include administrators"
- [ ] Desabilitar "Allow force pushes"
- [ ] Desabilitar "Allow deletions"
- [ ] Salvar

---

## ⚠️ IMPORTANTE

**Se os status checks não aparecerem:**
1. Execute os workflows pelo menos uma vez (abra um PR ou faça push)
2. Aguarde alguns minutos
3. Volte às configurações e os status checks aparecerão

---

**Última atualização:** 15 de Novembro de 2025

