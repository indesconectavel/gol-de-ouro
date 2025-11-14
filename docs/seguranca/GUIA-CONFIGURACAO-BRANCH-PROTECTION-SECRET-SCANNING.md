# 🔒 GUIA DE CONFIGURAÇÃO - BRANCH PROTECTION E SECRET SCANNING

**Data:** 14 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ✅ **GUIA COMPLETO PARA CONFIGURAÇÃO MANUAL**

---

## 🎯 OBJETIVO

Este guia fornece instruções passo a passo para configurar **Branch Protection Rules** e **Secret Scanning** no GitHub, resolvendo os 3 problemas críticos de segurança identificados na auditoria.

---

## 🔴 PROBLEMA CRÍTICO 1: BRANCH PROTECTION RULES

### **Por que é crítico?**
Sem Branch Protection Rules, qualquer pessoa com acesso pode fazer push direto na branch `main`, potencialmente quebrando o código em produção.

### **Como Configurar:**

#### **Passo 1: Acessar Configurações**
1. Acesse: `https://github.com/indesconectavel/gol-de-ouro`
2. Clique em **Settings** (no topo do repositório)
3. No menu lateral esquerdo, clique em **Branches**

#### **Passo 2: Adicionar Regra de Proteção**
1. Clique em **Add rule** ou **Add branch protection rule**
2. No campo **Branch name pattern**, digite: `main`
3. Configure as seguintes opções:

#### **Passo 3: Configurar Proteções**

**✅ Require pull request reviews before merging:**
- [x] Marque esta opção
- **Required number of approvals:** `1`
- [x] **Dismiss stale pull request approvals when new commits are pushed**
- [x] **Require review from Code Owners** (se você tiver um arquivo CODEOWNERS)

**✅ Require status checks to pass before merging:**
- [x] Marque esta opção
- [x] **Require branches to be up to date before merging**
- **Status checks that are required:**
  - [x] `CI` (CI workflow)
  - [x] `Testes Automatizados` (tests.yml)
  - [x] `Segurança e Qualidade` (security.yml)

**✅ Require conversation resolution before merging:**
- [x] Marque esta opção

**✅ Require signed commits:**
- [ ] Opcional (recomendado para maior segurança)

**✅ Require linear history:**
- [ ] Opcional (mantenha desmarcado se usar merge commits)

**✅ Include administrators:**
- [ ] **DESMARQUE** esta opção (importante: até administradores devem seguir as regras)

**✅ Restrict who can push to matching branches:**
- [ ] Opcional (deixe desmarcado para permitir que todos com acesso possam criar PRs)

**✅ Allow force pushes:**
- [ ] **DESMARQUE** (nunca permitir force push em main)

**✅ Allow deletions:**
- [ ] **DESMARQUE** (nunca permitir deletar a branch main)

#### **Passo 4: Salvar**
1. Clique em **Create** ou **Save changes**
2. Confirme a criação da regra

---

## 🔴 PROBLEMA CRÍTICO 2: SECRET SCANNING

### **Por que é crítico?**
Secret Scanning detecta automaticamente secrets commitados no código, prevenindo vazamentos de credenciais.

### **Como Configurar:**

#### **Passo 1: Acessar Configurações de Segurança**
1. Acesse: `https://github.com/indesconectavel/gol-de-ouro`
2. Clique em **Settings** (no topo do repositório)
3. No menu lateral esquerdo, clique em **Security**
4. Role até a seção **Code security and analysis**

#### **Passo 2: Habilitar Secret Scanning**
1. Encontre a opção **Secret scanning**
2. Clique em **Enable** ou **Set up**
3. Confirme a ativação

#### **Passo 3: Habilitar Dependabot Alerts** (Recomendado)
1. Na mesma seção, encontre **Dependabot alerts**
2. Clique em **Enable** ou **Set up**
3. Confirme a ativação

#### **Passo 4: Habilitar Dependabot Security Updates** (Recomendado)
1. Encontre **Dependabot security updates**
2. Clique em **Enable**
3. Confirme a ativação

#### **Passo 5: Habilitar Code Scanning** (Opcional mas Recomendado)
1. Encontre **Code scanning**
2. Clique em **Set up** ou **Enable**
3. Selecione **CodeQL Analysis** (já configurado no workflow)
4. Siga as instruções para completar a configuração

---

## 🔴 PROBLEMA CRÍTICO 3: ARQUIVOS SENSÍVEIS NO .gitignore

### **Status:** ✅ **RESOLVIDO**

Os seguintes padrões foram adicionados ao `.gitignore`:

```gitignore
# Environment variables
.env.production
*.env.production
.env.*.production

# Configurações sensíveis
config-*.js
*.secrets.json
secrets.json
*.key
*.pem
*.cert
*.crt
```

**✅ Verificação:**
- [x] `.env.production` adicionado
- [x] `config-*.js` adicionado
- [x] `*.secrets.json` adicionado
- [x] `*.key` e `*.pem` adicionados

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### **Branch Protection Rules:**
- [ ] Acessar Settings > Branches
- [ ] Criar regra para branch `main`
- [ ] Require pull request reviews: 1 aprovação
- [ ] Require status checks: CI, Testes, Segurança
- [ ] Require branches to be up to date
- [ ] Desmarcar "Include administrators"
- [ ] Desmarcar "Allow force pushes"
- [ ] Desmarcar "Allow deletions"
- [ ] Salvar configuração

### **Secret Scanning:**
- [ ] Acessar Settings > Security
- [ ] Habilitar Secret scanning
- [ ] Habilitar Dependabot alerts
- [ ] Habilitar Dependabot security updates
- [ ] (Opcional) Habilitar Code scanning

### **.gitignore:**
- [x] Arquivos sensíveis adicionados
- [x] Padrões de configuração adicionados
- [x] Arquivos de chaves adicionados

---

## 🚨 NOTIFICAÇÕES DE ERROS

### **Como Parar de Receber Emails de Erros:**

#### **Opção 1: Configurar Notificações no GitHub**
1. Acesse: `https://github.com/settings/notifications`
2. Role até **Actions**
3. Configure:
   - **Email:** Escolha quando receber notificações
   - **Web:** Escolha quando receber notificações
   - **Push:** Escolha quando receber notificações

#### **Opção 2: Configurar Notificações por Repositório**
1. Acesse: `https://github.com/indesconectavel/gol-de-ouro`
2. Clique em **Settings**
3. Clique em **Notifications**
4. Configure:
   - **Email:** Desmarque "Workflow runs" se não quiser emails
   - **Web:** Configure quando receber notificações web
   - **Custom:** Configure notificações personalizadas

#### **Opção 3: Usar Workflow Status Badge**
- Adicione um badge no README para ver status sem emails
- Exemplo: `![CI](https://github.com/indesconectavel/gol-de-ouro/workflows/CI/badge.svg)`

#### **Opção 4: Configurar Filtros de Email**
- Configure filtros no seu cliente de email para arquivar emails do GitHub
- Use filtros como: `from:github.com subject:"workflow"`

---

## ✅ VERIFICAÇÃO FINAL

Após configurar tudo, verifique:

1. **Branch Protection:**
   - [ ] Tentar fazer push direto em `main` deve falhar
   - [ ] Apenas PRs com aprovação podem fazer merge

2. **Secret Scanning:**
   - [ ] Fazer commit de um arquivo com `SUPABASE_SERVICE_ROLE_KEY=test123`
   - [ ] Deve receber alerta de secret detectado

3. **.gitignore:**
   - [ ] Tentar commitar `.env.production` deve ser ignorado
   - [ ] Tentar commitar `config-temp.js` deve ser ignorado

---

## 📚 RECURSOS ADICIONAIS

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [GitHub Notifications](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github)

---

## 🎯 CONCLUSÃO

Após seguir este guia:

1. ✅ **Branch Protection Rules** configuradas
2. ✅ **Secret Scanning** habilitado
3. ✅ **.gitignore** atualizado
4. ✅ **Notificações** configuradas

**Status:** 🔒 **REPOSITÓRIO 100% SEGURO**

---

**Última atualização:** 14 de Novembro de 2025  
**Versão:** 1.0

