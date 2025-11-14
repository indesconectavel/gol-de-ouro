# 🚀 COMO EXECUTAR CONFIGURAÇÃO AUTOMÁTICA DE SEGURANÇA

**Data:** 14 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ✅ **GUIA PARA EXECUÇÃO AUTOMÁTICA**

---

## 🎯 OBJETIVO

Este guia explica como executar o workflow automático que configura **Branch Protection Rules** e **Secret Scanning** sem precisar fazer manualmente.

---

## ✅ MÉTODO AUTOMÁTICO (RECOMENDADO)

### **Passo 1: Executar o Workflow**

1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/actions`
2. No menu lateral esquerdo, encontre o workflow **"🔒 Configurar Segurança Automática"**
3. Clique no workflow
4. Clique no botão **"Run workflow"** (no canto superior direito)
5. Selecione a branch **"main"**
6. Clique em **"Run workflow"**

### **Passo 2: Aguardar Execução**

- O workflow executará em aproximadamente 1-2 minutos
- Você verá 3 jobs:
  1. 🔒 Configurar Branch Protection
  2. 🔍 Habilitar Secret Scanning
  3. ✅ Verificar Configuração

### **Passo 3: Verificar Resultado**

- Se tudo funcionar, você verá ✅ em todos os jobs
- Se algum job falhar, verifique os logs para entender o motivo

---

## ⚠️ SE O WORKFLOW FALHAR

### **Possíveis Motivos:**

1. **Permissões Insuficientes:**
   - O workflow precisa de permissões de administrador
   - Vá em Settings > Actions > General > Workflow permissions
   - Selecione "Read and write permissions"
   - Marque "Allow GitHub Actions to create and approve pull requests"

2. **Branch Protection Já Configurada:**
   - Se já existe uma configuração, o workflow pode falhar
   - Isso é normal - significa que já está configurado!

3. **Secret Scanning Não Disponível:**
   - Alguns repositórios podem não ter acesso ao Secret Scanning
   - Nesse caso, configure manualmente

---

## 🔧 MÉTODO ALTERNATIVO: SCRIPT LOCAL

Se o workflow não funcionar, você pode executar o script localmente:

### **Pré-requisitos:**

1. **Instalar Node.js** (se ainda não tiver)
2. **Criar GitHub Token:**
   - Acesse: `https://github.com/settings/tokens`
   - Clique em **"Generate new token (classic)"**
   - Dê um nome: `Gol-de-Ouro-Config`
   - Selecione as permissões:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `admin:repo_hook` (Full control of repository hooks)
   - Clique em **"Generate token"**
   - **COPIE O TOKEN** (você não verá novamente!)

### **Executar o Script:**

```bash
# No PowerShell (Windows)
$env:GITHUB_TOKEN="seu_token_aqui"
node scripts/configurar-branch-protection-secret-scanning.js

# No Bash/Linux/Mac
export GITHUB_TOKEN="seu_token_aqui"
node scripts/configurar-branch-protection-secret-scanning.js
```

---

## 📋 VERIFICAÇÃO MANUAL

Após executar o workflow ou script, verifique:

### **1. Branch Protection:**
- Acesse: `https://github.com/indesconectavel/gol-de-ouro/settings/branches`
- Deve aparecer uma regra para a branch `main`
- Deve mostrar: "1 required approval", "3 required status checks"

### **2. Secret Scanning:**
- Acesse: `https://github.com/indesconectavel/gol-de-ouro/settings/security`
- Role até "Code security and analysis"
- Deve mostrar "Secret scanning: Enabled"

---

## 🎯 RESULTADO ESPERADO

Após executar com sucesso:

✅ **Branch Protection Rules** configuradas  
✅ **Secret Scanning** habilitado  
✅ **Repositório protegido** contra:
   - Push direto em main
   - Secrets commitados
   - Force pushes
   - Deletions da branch main

---

## 🚨 TROUBLESHOOTING

### **Problema: Workflow não aparece**
- **Solução:** Verifique se o arquivo `.github/workflows/configurar-seguranca.yml` foi commitado

### **Problema: "Permission denied"**
- **Solução:** Configure permissões em Settings > Actions > General

### **Problema: "Branch protection already exists"**
- **Solução:** Isso é bom! Significa que já está configurado. Verifique em Settings > Branches

### **Problema: "Secret scanning not available"**
- **Solução:** Alguns repositórios podem não ter acesso. Configure manualmente seguindo o guia original

---

## 📚 RECURSOS ADICIONAIS

- **Guia Manual:** `docs/seguranca/GUIA-CONFIGURACAO-BRANCH-PROTECTION-SECRET-SCANNING.md`
- **Resumo das Correções:** `docs/seguranca/RESUMO-CORRECOES-SEGURANCA-CRITICAS.md`

---

## ✅ CONCLUSÃO

O método automático é mais fácil e rápido. Basta executar o workflow uma vez e tudo será configurado automaticamente!

**Próximo passo:** Execute o workflow e verifique o resultado! 🚀

---

**Última atualização:** 14 de Novembro de 2025  
**Versão:** 1.0

