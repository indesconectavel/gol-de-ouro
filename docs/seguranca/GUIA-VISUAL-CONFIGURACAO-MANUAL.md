# 📸 GUIA VISUAL - CONFIGURAÇÃO MANUAL DE SEGURANÇA

**Data:** 14 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ✅ **GUIA PASSO A PASSO COM IMAGENS**

---

## 🎯 OBJETIVO

Este guia fornece instruções visuais passo a passo para configurar **Branch Protection Rules** e **Secret Scanning** manualmente no GitHub, baseado nas telas que você está vendo.

---

## 🔒 PARTE 1: CONFIGURAR BRANCH PROTECTION RULES

### **Passo 1: Acessar a Página**

Você já está na página correta! Vejo que você está em:
- **Settings** > **Branches** ✅

### **Passo 2: Adicionar Regra de Proteção**

Na tela que você está vendo, há **2 botões**:

1. **"Add branch ruleset"** (esquerda) - Nova funcionalidade do GitHub
2. **"Add classic branch protection rule"** (direita) - Método clássico ✅ **USE ESTE**

**Clique em:** **"Add classic branch protection rule"** (botão da direita)

---

### **Passo 3: Configurar a Regra**

Após clicar, você verá um formulário. Configure assim:

#### **Branch name pattern:**
```
main
```

#### **Proteções a Marcar:**

✅ **Require pull request reviews before merging:**
- [x] Marque esta opção
- **Required number of approvals:** `1`
- [x] **Dismiss stale pull request approvals when new commits are pushed**

✅ **Require status checks to pass before merging:**
- [x] Marque esta opção
- [x] **Require branches to be up to date before merging**
- **Status checks that are required:**
  - [x] `CI`
  - [x] `Testes Automatizados`
  - [x] `Segurança e Qualidade`

✅ **Require conversation resolution before merging:**
- [x] Marque esta opção

❌ **Require signed commits:**
- [ ] Deixe desmarcado (opcional)

❌ **Require linear history:**
- [ ] Deixe desmarcado

❌ **Include administrators:**
- [ ] **DESMARQUE** esta opção (importante!)

❌ **Restrict who can push to matching branches:**
- [ ] Deixe desmarcado

❌ **Allow force pushes:**
- [ ] **DESMARQUE** (nunca permitir)

❌ **Allow deletions:**
- [ ] **DESMARQUE** (nunca permitir)

#### **Passo 4: Salvar**
- Clique em **"Create"** ou **"Save changes"**

---

## 🔍 PARTE 2: CONFIGURAR SECRET SCANNING

### **⚠️ PROBLEMA: Erro 404 na Página de Security**

Vejo que você recebeu um erro 404 ao tentar acessar:
`https://github.com/indesconectavel/gol-de-ouro/settings/security`

### **Soluções:**

#### **Solução 1: Acessar Via Menu Lateral**

1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/settings`
2. No **menu lateral esquerdo**, procure por:
   - **"Security"** (sob "Security" na sidebar)
   - Clique em **"Security"**
3. Role até encontrar **"Code security and analysis"**

#### **Solução 2: URL Alternativa**

Tente estas URLs alternativas:

```
https://github.com/indesconectavel/gol-de-ouro/settings/security_analysis
```

ou

```
https://github.com/indesconectavel/gol-de-ouro/settings/security/security-and-analysis
```

#### **Solução 3: Via Security Tab**

1. Na barra de navegação superior do repositório
2. Clique em **"Security"** (ao lado de "Actions")
3. Role até encontrar configurações de segurança

---

### **Passo 2: Habilitar Secret Scanning**

Quando conseguir acessar a página de Security:

1. Role até a seção **"Code security and analysis"**
2. Encontre **"Secret scanning"**
3. Clique em **"Enable"** ou **"Set up"**
4. Confirme a ativação

### **Passo 3: Habilitar Dependabot Alerts** (Recomendado)

Na mesma seção:
1. Encontre **"Dependabot alerts"**
2. Clique em **"Enable"**
3. Confirme a ativação

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### **Branch Protection Rules:**
- [ ] Acessar Settings > Branches ✅ (você já está aqui!)
- [ ] Clicar em "Add classic branch protection rule"
- [ ] Branch pattern: `main`
- [ ] Require pull request reviews: 1 aprovação
- [ ] Require status checks: CI, Testes, Segurança
- [ ] Desmarcar "Include administrators"
- [ ] Desmarcar "Allow force pushes"
- [ ] Desmarcar "Allow deletions"
- [ ] Salvar configuração

### **Secret Scanning:**
- [ ] Acessar Settings > Security (resolver erro 404)
- [ ] Role até "Code security and analysis"
- [ ] Habilitar Secret scanning
- [ ] Habilitar Dependabot alerts

---

## 🚨 RESOLVENDO O ERRO 404

### **Possíveis Causas:**

1. **URL incorreta** - Tente as URLs alternativas acima
2. **Permissões insuficientes** - Verifique se você é administrador do repositório
3. **Repositório privado** - Algumas configurações podem não estar disponíveis

### **Soluções:**

#### **Opção 1: Via Menu Lateral**
1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/settings`
2. No menu lateral, clique em **"Security"**
3. Procure por **"Code security and analysis"**

#### **Opção 2: Verificar Permissões**
1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/settings/access`
2. Verifique se você tem permissão de **administrador**
3. Se não tiver, peça ao proprietário do repositório para dar acesso

#### **Opção 3: Tentar URL Direta**
```
https://github.com/indesconectavel/gol-de-ouro/settings/security_analysis
```

---

## ✅ VERIFICAÇÃO FINAL

Após configurar tudo:

### **1. Verificar Branch Protection:**
- Tente fazer push direto em `main` - deve falhar
- Apenas PRs com aprovação podem fazer merge

### **2. Verificar Secret Scanning:**
- Acesse: `https://github.com/indesconectavel/gol-de-ouro/security`
- Deve aparecer a seção "Secret scanning" como habilitada

---

## 📸 REFERÊNCIA DAS TELAS

### **Tela 1: Branch Protection Rules**
- Você está vendo: "Classic branch protections have not been configured"
- **Ação:** Clique em **"Add classic branch protection rule"** (botão da direita)

### **Tela 2: Erro 404 Security**
- **Problema:** Página de Security não encontrada
- **Solução:** Use o menu lateral em Settings > Security

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Configure Branch Protection** (você já está na página certa!)
   - Clique em "Add classic branch protection rule"
   - Configure conforme o guia acima

2. ⚠️ **Resolva o erro 404 de Security**
   - Tente acessar via menu lateral
   - Ou use as URLs alternativas

3. ✅ **Habilite Secret Scanning**
   - Quando conseguir acessar Security
   - Role até "Code security and analysis"
   - Clique em "Enable" em "Secret scanning"

---

## 💡 DICA IMPORTANTE

Se continuar tendo problemas para acessar a página de Security:

1. **Verifique suas permissões** - Você precisa ser administrador
2. **Tente em modo anônimo** - Pode ser cache do navegador
3. **Use outro navegador** - Para descartar problemas de extensões
4. **Aguarde alguns minutos** - Pode ser um problema temporário do GitHub

---

**Última atualização:** 14 de Novembro de 2025  
**Versão:** 1.0

