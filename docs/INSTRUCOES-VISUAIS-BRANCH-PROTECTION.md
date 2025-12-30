# 🎯 INSTRUÇÕES VISUAIS - BRANCH PROTECTION

**Data:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA VISUAL CRIADO**

---

## 🖼️ NAVEGAÇÃO VISUAL

### **PASSO 1: Acessar Configurações**

```
GitHub Repository: indesconectavel/gol-de-ouro
│
├── [Code] [Issues] [Pull requests] [Actions] [Projects] [Wiki] [Security] [Insights] [Settings] ← CLIQUE AQUI
│
└── Settings
    ├── General
    ├── Access
    ├── Secrets and variables
    ├── Actions
    ├── Branches ← CLIQUE AQUI
    ├── Tags
    └── ...
```

**URL Direta:** https://github.com/indesconectavel/gol-de-ouro/settings/branches

---

### **PASSO 2: Encontrar Branch Protection Rules**

Na página de Branches, você verá:

```
┌─────────────────────────────────────────────────────────┐
│ Branch protection rules                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Add rule]  ← Se não existe regra, clique aqui        │
│                                                         │
│  OU                                                      │
│                                                         │
│  main  [Edit] [Delete]  ← Se existe regra, clique Edit│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### **PASSO 3: Configurar Regra**

Ao clicar em "Add rule" ou "Edit", você verá:

```
┌─────────────────────────────────────────────────────────┐
│ Branch name pattern                                     │
│ [main                    ]                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Require a pull request before merging                 │
│   ☑ Required number of approvals before merging: [1]   │
│   ☑ Dismiss stale pull request approvals...            │
│                                                         │
│ ☑ Require status checks to pass before merging          │
│   ☑ Require branches to be up to date before merging    │
│   Status checks that are required:                      │
│   [Search for a status check...]                        │
│   • CI                                                  │
│   • 🧪 Testes Automatizados                            │
│   • 🔒 Segurança e Qualidade                            │
│                                                         │
│ ☐ Require conversation resolution before merging        │
│                                                         │
│ ☑ Include administrators                                │
│                                                         │
│ ☐ Allow force pushes                                    │
│ ☐ Allow deletions                                       │
│                                                         │
│                    [Save changes]                       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CONFIGURAÇÃO RECOMENDADA (CHECKBOXES)

### **MARQUE ESTES:**
- ☑ Require a pull request before merging
- ☑ Required number of approvals: 1
- ☑ Dismiss stale reviews
- ☑ Require status checks to pass before merging
- ☑ Require branches to be up to date
- ☑ Include administrators

### **NÃO MARQUE ESTES:**
- ☐ Allow force pushes
- ☐ Allow deletions

---

## 🔍 COMO ENCONTRAR OS STATUS CHECKS

### **Método 1: Buscar Automaticamente**

1. Na seção "Require status checks to pass before merging"
2. Clique em "Search for a status check"
3. Digite: `CI` ou `Testes` ou `Segurança`
4. Selecione os que aparecerem

### **Método 2: Executar Workflows Primeiro**

Se os status checks não aparecerem:

1. **Abra um Pull Request** ou faça push para `main`
2. **Aguarde os workflows executarem** (alguns minutos)
3. **Volte para** Settings > Branches
4. **Os status checks aparecerão** na lista

### **Método 3: Verificar Nomes Exatos**

Os nomes dos workflows são:
- `CI` (do arquivo `.github/workflows/ci.yml`)
- `🧪 Testes Automatizados` (do arquivo `.github/workflows/tests.yml`)
- `🔒 Segurança e Qualidade` (do arquivo `.github/workflows/security.yml`)

**Nota:** O GitHub pode exibir com ou sem emojis. Use o nome que aparecer na lista.

---

## 📸 EXEMPLO DE TELA COMPLETA

```
┌──────────────────────────────────────────────────────────────┐
│ Settings / Branches                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Branch protection rules                                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Branch name pattern: main                              │  │
│ │                                                         │  │
│ │ ☑ Require a pull request before merging                 │  │
│ │   Required number of approvals before merging: [1]     │  │
│ │   ☑ Dismiss stale pull request approvals...            │  │
│ │                                                         │  │
│ │ ☑ Require status checks to pass before merging          │  │
│ │   ☑ Require branches to be up to date before merging   │  │
│ │   Status checks that are required:                     │  │
│ │   [Search for a status check...]                        │  │
│ │   • CI                                                  │  │
│ │   • 🧪 Testes Automatizados                            │  │
│ │   • 🔒 Segurança e Qualidade                            │  │
│ │                                                         │  │
│ │ ☑ Include administrators                                │  │
│ │                                                         │  │
│ │ ☐ Allow force pushes                                    │  │
│ │ ☐ Allow deletions                                       │  │
│ │                                                         │  │
│ │                    [Save changes]                       │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ DICAS IMPORTANTES

1. **Se não encontrar os status checks:**
   - Execute os workflows primeiro (abra um PR)
   - Aguarde alguns minutos
   - Volte às configurações

2. **Nomes dos status checks:**
   - Podem aparecer com ou sem emojis
   - Use o nome exato que aparecer na lista
   - Geralmente são os nomes dos workflows, não dos jobs

3. **Testar a configuração:**
   - Abra um PR de teste
   - Verifique se os status checks aparecem
   - Tente fazer merge sem aprovações (deve bloquear)
   - Tente fazer merge sem status checks passando (deve bloquear)

---

## 🔗 LINKS DIRETOS

- **Branch Protection:** https://github.com/indesconectavel/gol-de-ouro/settings/branches
- **Workflows:** https://github.com/indesconectavel/gol-de-ouro/actions
- **Pull Requests:** https://github.com/indesconectavel/gol-de-ouro/pulls

---

**Última atualização:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA VISUAL CRIADO**

