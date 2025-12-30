# 🔒 GUIA COMPLETO - CONFIGURAR BRANCH PROTECTION MANUALMENTE

**Data:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA COMPLETO CRIADO**

---

## 📋 PASSO A PASSO - CONFIGURAR BRANCH PROTECTION

### **PASSO 1: Acessar Configurações do Repositório**

1. **Acesse o repositório no GitHub:**
   - URL: https://github.com/indesconectavel/gol-de-ouro

2. **Clique em "Settings" (Configurações):**
   - Localizado no topo do repositório, ao lado de "Code", "Issues", "Pull requests", etc.
   - Ou acesse diretamente: https://github.com/indesconectavel/gol-de-ouro/settings

---

### **PASSO 2: Acessar Branch Protection Rules**

1. **No menu lateral esquerdo, clique em "Branches":**
   - Localizado em "Code and automation" > "Branches"
   - Ou acesse diretamente: https://github.com/indesconectavel/gol-de-ouro/settings/branches

2. **Você verá a seção "Branch protection rules"**

---

### **PASSO 3: Adicionar ou Editar Regra de Proteção**

1. **Se já existe uma regra para `main`:**
   - Clique no botão "Edit" ao lado da regra existente

2. **Se não existe regra:**
   - Clique no botão "Add rule" ou "Add branch protection rule"
   - No campo "Branch name pattern", digite: `main`
   - Clique em "Create"

---

### **PASSO 4: Configurar Proteções**

#### **4.1. Require a pull request before merging**

✅ **Marque esta opção** e configure:

- ✅ **Require approvals:** Marque esta opção
  - **Required number of approvals before merging:** `1` (ou mais, conforme necessário)
  
- ✅ **Dismiss stale pull request approvals when new commits are pushed:** Marque esta opção
  - Isso garante que aprovações antigas sejam descartadas quando novos commits são adicionados

- ✅ **Require review from Code Owners:** Opcional (deixe desmarcado se não usar CODEOWNERS)

- ✅ **Restrict who can dismiss pull request reviews:** Opcional (deixe desmarcado)

---

#### **4.2. Require status checks to pass before merging**

✅ **Marque esta opção** e configure:

- ✅ **Require branches to be up to date before merging:** Marque esta opção
  - Isso garante que a branch esteja atualizada com a branch base

- **Status checks that are required:**
  - Clique em "Search for a status check" ou digite os nomes:
    - `CI` (do workflow `ci.yml`)
    - `🧪 Testes Automatizados` (do workflow `tests.yml`)
    - `🔒 Segurança e Qualidade` (do workflow `security.yml`)
  
  **Importante:** 
  - Os nomes devem corresponder EXATAMENTE aos nomes dos workflows (não dos jobs)
  - Se os status checks não aparecerem, execute os workflows pelo menos uma vez primeiro
  - Os nomes podem aparecer com ou sem emojis, dependendo de como o GitHub os exibe

---

#### **4.3. Require conversation resolution before merging**

✅ **Marque esta opção** (opcional mas recomendado)
- Isso garante que todas as conversas em PRs sejam resolvidas antes do merge

---

#### **4.4. Require signed commits**

⚠️ **Deixe desmarcado** (opcional, requer configuração de GPG)

---

#### **4.5. Require linear history**

⚠️ **Deixe desmarcado** (opcional, força histórico linear)

---

#### **4.6. Require merge queue**

⚠️ **Deixe desmarcado** (opcional, requer GitHub Pro/Team)

---

#### **4.7. Include administrators**

✅ **Marque esta opção**
- Isso garante que até mesmo administradores sigam as regras de proteção

---

#### **4.8. Do not allow bypassing the above settings**

✅ **Marque esta opção** (se disponível)
- Isso garante que ninguém possa ignorar as regras

---

#### **4.9. Restrict who can push to matching branches**

⚠️ **Deixe desmarcado** (opcional, pode restringir demais)

---

#### **4.10. Allow force pushes**

❌ **NÃO marque esta opção**
- Force pushes são perigosos e podem sobrescrever histórico

---

#### **4.11. Allow deletions**

❌ **NÃO marque esta opção**
- Deletar branches protegidas é perigoso

---

### **PASSO 5: Salvar Configurações**

1. **Role até o final da página**

2. **Clique em "Save changes" ou "Create"**

3. **Confirme a ação se solicitado**

---

## ✅ CONFIGURAÇÃO RECOMENDADA COMPLETA

### **Configurações Obrigatórias:**

- ✅ **Require a pull request before merging**
  - Required approvals: `1`
  - Dismiss stale reviews: ✅ Habilitado

- ✅ **Require status checks to pass before merging**
  - Required status checks:
    - `CI`
    - `Testes Automatizados`
    - `Segurança e Qualidade`
  - Require branches to be up to date: ✅ Habilitado

- ✅ **Include administrators**
  - ✅ Habilitado

- ❌ **Allow force pushes**
  - ❌ Desabilitado

- ❌ **Allow deletions**
  - ❌ Desabilitado

---

## 🔍 VERIFICAR NOMES CORRETOS DOS STATUS CHECKS

Para verificar os nomes exatos dos status checks:

1. **Acesse:** https://github.com/indesconectavel/gol-de-ouro/actions

2. **Execute um workflow** ou aguarde um PR ser aberto

3. **Verifique os nomes dos jobs** nos workflows:
   - `.github/workflows/ci.yml` → Job name: `CI`
   - `.github/workflows/tests.yml` → Job name: `Testes Automatizados`
   - `.github/workflows/security.yml` → Job name: `Segurança e Qualidade`

4. **Use os nomes EXATOS** dos jobs nos required status checks

---

## 📸 VISUALIZAÇÃO DA INTERFACE

### **Localização das Configurações:**

```
GitHub Repository
├── Settings (Configurações)
    ├── Branches (Branches)
        └── Branch protection rules
            └── main (ou Add rule)
                ├── Require a pull request before merging
                ├── Require status checks to pass before merging
                ├── Require conversation resolution before merging
                ├── Include administrators
                ├── Allow force pushes
                └── Allow deletions
```

---

## ⚠️ TROUBLESHOOTING

### **Problema: Status checks não aparecem na lista**

**Solução:**
1. Certifique-se de que os workflows foram executados pelo menos uma vez
2. Verifique se os nomes dos jobs correspondem exatamente
3. Aguarde alguns minutos após executar um workflow

### **Problema: Não consigo fazer merge mesmo com aprovações**

**Solução:**
1. Verifique se todos os status checks estão passando
2. Verifique se a branch está atualizada com `main`
3. Verifique se todas as conversas foram resolvidas

### **Problema: Não vejo a opção "Branches" em Settings**

**Solução:**
1. Certifique-se de ter permissões de administrador no repositório
2. Verifique se está no repositório correto
3. Tente acessar diretamente: https://github.com/indesconectavel/gol-de-ouro/settings/branches

---

## 🔗 LINKS ÚTEIS

- **Branch Protection Settings:** https://github.com/indesconectavel/gol-de-ouro/settings/branches
- **GitHub Docs - Branch Protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- **Workflows:** https://github.com/indesconectavel/gol-de-ouro/actions

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Acessar Settings > Branches
- [ ] Adicionar/Editar regra para branch `main`
- [ ] Habilitar "Require a pull request before merging"
  - [ ] Configurar 1 aprovação mínima
  - [ ] Habilitar "Dismiss stale reviews"
- [ ] Habilitar "Require status checks to pass before merging"
  - [ ] Adicionar status check: `CI`
  - [ ] Adicionar status check: `Testes Automatizados`
  - [ ] Adicionar status check: `Segurança e Qualidade`
  - [ ] Habilitar "Require branches to be up to date"
- [ ] Habilitar "Include administrators"
- [ ] Desabilitar "Allow force pushes"
- [ ] Desabilitar "Allow deletions"
- [ ] Salvar configurações

---

**Última atualização:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA COMPLETO CRIADO**

