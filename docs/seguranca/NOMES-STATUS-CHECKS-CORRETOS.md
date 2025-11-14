# 📋 NOMES CORRETOS DOS STATUS CHECKS

**Data:** 14 de Novembro de 2025  
**Para:** Configuração de Branch Protection Rules

---

## 🔍 STATUS CHECKS DISPONÍVEIS NO SEU REPOSITÓRIO

Baseado nos seus workflows, os status checks que devem aparecer são:

### **1. Workflow: CI**
- **Arquivo:** `.github/workflows/ci.yml`
- **Nome do workflow:** `CI`
- **Jobs que geram status checks:**
  - `🔍 Build e Auditoria`
  - `🔍 Verificação Backend`

**O que procurar no GitHub:**
- `CI` (nome do workflow)
- OU `🔍 Build e Auditoria` (nome do job)
- OU `🔍 Verificação Backend` (nome do job)

---

### **2. Workflow: 🧪 Testes Automatizados**
- **Arquivo:** `.github/workflows/tests.yml`
- **Nome do workflow:** `🧪 Testes Automatizados`
- **Jobs que geram status checks:**
  - `🧪 Testes Backend`
  - `🧪 Testes Frontend`
  - `🔒 Testes de Segurança`
  - `⚡ Testes de Performance`
  - `📊 Relatório de Testes`

**O que procurar no GitHub:**
- `🧪 Testes Automatizados` (nome do workflow)
- OU `🧪 Testes Backend` (nome do job)
- OU qualquer um dos jobs acima

---

### **3. Workflow: 🔒 Segurança e Qualidade**
- **Arquivo:** `.github/workflows/security.yml`
- **Nome do workflow:** `🔒 Segurança e Qualidade`
- **Jobs que geram status checks:**
  - `🔒 Análise de Segurança`
  - `📊 Análise de Qualidade`
  - `🧪 Testes de Segurança`
  - `📊 Relatório de Segurança`

**O que procurar no GitHub:**
- `🔒 Segurança e Qualidade` (nome do workflow)
- OU `🔒 Análise de Segurança` (nome do job)
- OU qualquer um dos jobs acima

---

## 🎯 COMO ADICIONAR OS STATUS CHECKS

### **Método 1: Buscar pelo nome do workflow**

Na seção **"Search for status checks in the last week for this repository"**:

1. Digite: `CI` → Deve aparecer `CI`
2. Digite: `Testes` → Deve aparecer `🧪 Testes Automatizados`
3. Digite: `Segurança` → Deve aparecer `🔒 Segurança e Qualidade`

### **Método 2: Buscar pelo nome do job**

Se não aparecer pelo nome do workflow, tente pelos nomes dos jobs:

1. Digite: `Build e Auditoria`
2. Digite: `Testes Backend`
3. Digite: `Análise de Segurança`

---

## ⚠️ SE NENHUM CHECK APARECER

**Isso pode acontecer se:**
- Você ainda não executou nenhum workflow recentemente
- Os workflows não foram executados na branch `main` nos últimos 7 dias
- Os workflows falharam na última execução

**SOLUÇÃO:**

### **Opção 1: Salvar sem checks (temporário)**
1. Salve a configuração de Branch Protection agora
2. Faça um PR de teste para `main`
3. Isso vai executar os workflows
4. Depois que os workflows executarem, volte aqui e adicione os checks

### **Opção 2: Executar workflows manualmente**
1. Vá para: `https://github.com/indesconectavel/gol-de-ouro/actions`
2. Execute manualmente os workflows:
   - `CI`
   - `🧪 Testes Automatizados`
   - `🔒 Segurança e Qualidade`
3. Depois que executarem, volte para Branch Protection e adicione os checks

---

## ✅ CHECKLIST MÍNIMO

Para uma proteção básica, você precisa de pelo menos:

- ✅ `CI` (obrigatório - valida build básico)
- ✅ `🧪 Testes Automatizados` (recomendado - valida testes)
- ✅ `🔒 Segurança e Qualidade` (recomendado - valida segurança)

**Mínimo aceitável:** Apenas `CI` já é suficiente para começar!

---

## 📝 NOTA IMPORTANTE

Os status checks aparecem **após** os workflows serem executados pelo menos uma vez.

Se você está configurando Branch Protection pela primeira vez:
1. Salve a configuração agora mesmo (mesmo sem checks)
2. Faça um PR de teste
3. Os workflows vão executar
4. Volte aqui e adicione os checks que aparecerem

---

**Última atualização:** 14 de Novembro de 2025

