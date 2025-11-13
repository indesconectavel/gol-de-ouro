# 🔐 GUIA COMPLETO - ROTAÇÃO DE SECRETS EXPOSTOS

**Data:** 13 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** 🔴 **AÇÃO URGENTE NECESSÁRIA**

---

## 🚨 **PROBLEMA IDENTIFICADO**

GitGuardian detectou **35 incidentes de secrets expostos** no histórico do Git, incluindo:

1. **Supabase Service Role JWT** (9+ ocorrências)
2. **JSON Web Token** (9+ ocorrências)
3. **Generic Password** (11+ ocorrências)
4. **Generic High Entropy Secret** (2+ ocorrências)

---

## 📋 **CHECKLIST DE ROTAÇÃO**

### **1. SUPABASE SERVICE ROLE JWT** 🔴 **CRÍTICO**

#### **Arquivos Afetados:**
- `implementar-credenciais-reais-final.js`
- `implementar-credenciais-supabase-recentes.js` (já removido)

#### **Ação:**
1. ✅ **Já realizado:** Secret foi rotacionado anteriormente
2. ⚠️ **Pendente:** Verificar se nova chave está em uso
3. ⚠️ **Pendente:** Limpar histórico do Git (opcional, mas recomendado)

#### **Como Rotacionar:**
1. Acessar Supabase Dashboard
2. Settings → API → Service Role Key
3. Clicar em "Reset" ou "Rotate"
4. Copiar nova chave
5. Atualizar em Fly.io Secrets:
   ```bash
   fly secrets set SUPABASE_SERVICE_ROLE_KEY="nova_chave_aqui"
   ```

---

### **2. JSON WEB TOKEN** 🔴 **CRÍTICO**

#### **Arquivos Afetados:**
- `scripts/configure-supabase-correct.js`

#### **Ação:**
1. Identificar qual JWT foi exposto
2. Verificar se ainda está em uso
3. Rotacionar se necessário
4. Remover arquivo ou mover para `.gitignore`

---

### **3. GENERIC PASSWORD** 🟡 **MÉDIO**

#### **Arquivos Afetados:**
- `test-login-novo.json`

#### **Ação:**
1. Verificar se senha é de produção ou teste
2. Se produção: rotacionar imediatamente
3. Se teste: remover arquivo ou mover para `.gitignore`
4. Adicionar `*.json` com senhas ao `.gitignore`

---

### **4. GENERIC HIGH ENTROPY SECRET** 🔴 **CRÍTICO**

#### **Arquivos Afetados:**
- `implementar-credenciais-supabase-recentes.js` (já removido)

#### **Ação:**
1. ✅ **Já realizado:** Arquivo foi removido
2. ⚠️ **Pendente:** Verificar se secret ainda está em uso
3. ⚠️ **Pendente:** Rotacionar se necessário

---

## 🔧 **LIMPEZA DO HISTÓRICO DO GIT**

### **Opção 1: BFG Repo-Cleaner (Recomendado)**

```bash
# Instalar BFG
# Download: https://rtyley.github.io/bfg-repo-cleaner/

# Criar backup
git clone --mirror https://github.com/indesconectavel/gol-de-ouro.git

# Remover arquivos específicos
java -jar bfg.jar --delete-files implementar-credenciais-supabase-recentes.js
java -jar bfg.jar --delete-files implementar-credenciais-reais-final.js
java -jar bfg.jar --delete-files scripts/configure-supabase-correct.js
java -jar bfg.jar --delete-files test-login-novo.json

# Limpar reflog
cd gol-de-ouro.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CUIDADO!)
git push --force
```

### **Opção 2: git filter-branch**

```bash
# Remover arquivo do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch implementar-credenciais-supabase-recentes.js" \
  --prune-empty --tag-name-filter cat -- --all

# Limpar
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CUIDADO!)
git push --force
```

### **⚠️ AVISOS IMPORTANTES:**
- ⚠️ **Backup obrigatório** antes de limpar histórico
- ⚠️ **Avisar todos os colaboradores** antes do force push
- ⚠️ **Histórico será reescrito** - pode afetar PRs e branches
- ⚠️ **Considerar criar novo repositório** se histórico muito comprometido

---

## 🛡️ **PREVENÇÃO FUTURA**

### **1. Configurar GitGuardian Pre-Commit Hook**

```bash
# Instalar GitGuardian CLI
pip install ggshield

# Configurar pre-commit hook
ggshield install

# Testar antes de commit
ggshield scan pre-commit
```

### **2. Atualizar .gitignore**

Adicionar ao `.gitignore`:
```
# Secrets e credenciais
*.env
*.env.local
*.env.production
*credentials*.js
*credenciais*.js
*secrets*.js
*secret*.js
test-login*.json
*config*.json
```

### **3. Usar Variáveis de Ambiente**

Nunca commitar secrets diretamente no código. Sempre usar:
- Fly.io Secrets
- Vercel Environment Variables
- GitHub Secrets

---

## 📊 **STATUS ATUAL**

### **Secrets Rotacionados:**
- ✅ Supabase Service Role JWT (rotacionado anteriormente)

### **Secrets Pendentes:**
- ⚠️ JSON Web Token (verificar e rotacionar)
- ⚠️ Generic Password (verificar se produção)
- ⚠️ Generic High Entropy Secret (verificar uso)

### **Arquivos Removidos:**
- ✅ `implementar-credenciais-supabase-recentes.js`

### **Arquivos Pendentes:**
- ⚠️ `implementar-credenciais-reais-final.js`
- ⚠️ `scripts/configure-supabase-correct.js`
- ⚠️ `test-login-novo.json`

---

## ✅ **PRÓXIMOS PASSOS**

1. [ ] Verificar quais secrets ainda estão em uso
2. [ ] Rotacionar secrets ativos
3. [ ] Remover ou mover arquivos com secrets para `.gitignore`
4. [ ] Considerar limpar histórico do Git
5. [ ] Configurar GitGuardian pre-commit hook
6. [ ] Atualizar `.gitignore`
7. [ ] Documentar processo de gestão de secrets

---

**Documentação criada em:** 13 de Novembro de 2025  
**Status:** ⚠️ **AÇÃO URGENTE NECESSÁRIA**

