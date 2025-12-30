# 📚 GUIA PARA A EQUIPE - BRANCH PROTECTION CONFIGURADA

**Data:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA PARA EQUIPE CRIADO**

---

## 🎯 RESUMO

A branch `main` agora está **protegida** com regras de segurança e qualidade.

---

## 📋 NOVAS REGRAS PARA MERGE NA BRANCH `main`

### **✅ O QUE É NECESSÁRIO:**

1. **Pull Request Obrigatório**
   - ❌ Não é mais possível fazer push direto para `main`
   - ✅ Todos os commits devem passar por um PR

2. **Aprovação Necessária**
   - ✅ Mínimo de **1 aprovação** necessária
   - ✅ Aprovações antigas são descartadas quando novos commits são adicionados

3. **Status Checks Obrigatórios**
   - ✅ Todos os seguintes devem **PASSAR**:
     - ✅ Análise de Segurança
     - ✅ Relatório de Segurança
     - ✅ Testes Backend
     - ✅ Testes Frontend
     - ✅ Testes de Segurança

4. **Branch Atualizada**
   - ✅ A branch deve estar atualizada com `main`
   - ✅ Se `main` tiver novos commits, você precisa fazer rebase ou merge

5. **Conversas Resolvidas**
   - ✅ Todas as discussões no código devem estar resolvidas
   - ✅ Comentários devem ser respondidos ou marcados como resolvidos

---

## 🚀 PROCESSO DE TRABALHO

### **ANTES (Como era):**
```
git checkout -b minha-feature
# ... fazer mudanças ...
git push origin minha-feature
git checkout main
git merge minha-feature  # ❌ Não funciona mais!
```

### **AGORA (Como deve ser):**
```
git checkout -b minha-feature
# ... fazer mudanças ...
git push origin minha-feature
# Criar PR no GitHub
# Aguardar aprovações e status checks
# Fazer merge quando tudo estiver OK ✅
```

---

## 📝 PASSO A PASSO PARA CRIAR UM PR

### **1. Criar Branch e Fazer Mudanças**
```bash
git checkout -b minha-feature
# ... fazer suas mudanças ...
git add .
git commit -m "feat: minha nova funcionalidade"
git push origin minha-feature
```

### **2. Criar Pull Request**
- Acesse: https://github.com/indesconectavel/gol-de-ouro/pulls
- Clique em "New Pull Request"
- Selecione sua branch
- Preencha título e descrição
- Clique em "Create Pull Request"

### **3. Aguardar Status Checks**
- Os workflows executarão automaticamente
- Aguarde todos os status checks passarem:
  - ✅ Análise de Segurança
  - ✅ Relatório de Segurança
  - ✅ Testes Backend
  - ✅ Testes Frontend
  - ✅ Testes de Segurança

### **4. Obter Aprovação**
- Solicite revisão de código
- Aguarde pelo menos 1 aprovação

### **5. Resolver Problemas (se houver)**
- Se algum status check falhar, corrija o problema
- Se houver comentários, responda ou resolva
- Se a branch estiver desatualizada, atualize:
  ```bash
  git checkout minha-feature
  git rebase main
  # ou
  git merge main
  git push origin minha-feature
  ```

### **6. Fazer Merge**
- Quando tudo estiver OK, o botão "Merge" ficará disponível
- Escolha o tipo de merge (Squash, Merge, Rebase)
- Clique em "Merge pull request"

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### **Problema: "Merge blocked: required status checks must pass"**

**Solução:**
1. Verifique quais status checks estão falhando
2. Clique no status check para ver os detalhes
3. Corrija o problema no código
4. Faça commit e push novamente
5. Os status checks executarão automaticamente

### **Problema: "Merge blocked: required approvals"**

**Solução:**
1. Solicite revisão de código
2. Aguarde alguém aprovar o PR
3. Verifique se a aprovação não foi descartada (se você adicionou novos commits)

### **Problema: "Merge blocked: branch is out of date"**

**Solução:**
```bash
git checkout minha-feature
git fetch origin
git rebase origin/main
# ou
git merge origin/main
git push origin minha-feature
```

### **Problema: "Merge blocked: conversations must be resolved"**

**Solução:**
1. Vá para a aba "Conversation" no PR
2. Responda aos comentários ou marque como resolvidos
3. Aguarde o status atualizar

---

## 🔍 VERIFICAR STATUS DO PR

### **No GitHub:**
1. Acesse seu PR
2. Role até a seção de status checks
3. Veja quais estão passando/falhando
4. Clique em cada um para ver detalhes

### **Via GitHub CLI:**
```bash
gh pr view <numero-do-pr> --json statusCheckRollup
```

---

## 📊 STATUS CHECKS EXPLICADOS

### **Análise de Segurança**
- O que faz: Analisa o código em busca de vulnerabilidades
- Tempo: ~5-10 minutos
- O que verifica: Vulnerabilidades de segurança, CodeQL

### **Relatório de Segurança**
- O que faz: Gera relatório completo de segurança
- Tempo: ~3-5 minutos
- O que verifica: Resumo de todas as análises de segurança

### **Testes Backend**
- O que faz: Executa testes do backend
- Tempo: ~5-10 minutos
- O que verifica: Testes unitários, integração, API

### **Testes Frontend**
- O que faz: Executa testes do frontend
- Tempo: ~5-10 minutos
- O que verifica: Testes de componentes, E2E

### **Testes de Segurança**
- O que faz: Executa testes específicos de segurança
- Tempo: ~3-5 minutos
- O que verifica: Autenticação, autorização, validação

---

## 💡 DICAS PARA A EQUIPE

### **1. Sempre Crie PRs**
- Não tente fazer push direto para `main`
- Sempre crie uma branch e um PR

### **2. Mantenha Branches Atualizadas**
- Faça rebase/merge regularmente com `main`
- Isso evita conflitos e problemas

### **3. Revise Código com Atenção**
- Aprovações são importantes
- Revise cuidadosamente antes de aprovar

### **4. Corrija Problemas Rapidamente**
- Se um status check falhar, corrija logo
- Não deixe acumular problemas

### **5. Use Commits Descritivos**
- Commits claros ajudam nas revisões
- Use convenções: `feat:`, `fix:`, `docs:`, etc.

---

## 🎯 BENEFÍCIOS DAS NOVAS REGRAS

### **Segurança:**
- ✅ Código sempre testado antes do merge
- ✅ Vulnerabilidades detectadas antes da produção
- ✅ Histórico protegido

### **Qualidade:**
- ✅ Código sempre revisado
- ✅ Testes sempre executados
- ✅ Menos bugs em produção

### **Confiabilidade:**
- ✅ Processo consistente
- ✅ Deploys mais seguros
- ✅ Melhor rastreabilidade

---

## 📞 SUPORTE

### **Se tiver dúvidas:**
1. Consulte este guia
2. Verifique a documentação do GitHub
3. Entre em contato com o time de desenvolvimento

### **Links Úteis:**
- **Pull Requests:** https://github.com/indesconectavel/gol-de-ouro/pulls
- **Workflows:** https://github.com/indesconectavel/gol-de-ouro/actions
- **Branch Protection:** https://github.com/indesconectavel/gol-de-ouro/settings/branches

---

## ✅ CHECKLIST PARA MERGE

Antes de fazer merge, verifique:

- [ ] ✅ Todos os status checks estão passando
- [ ] ✅ Pelo menos 1 aprovação obtida
- [ ] ✅ Branch está atualizada com `main`
- [ ] ✅ Todas as conversas estão resolvidas
- [ ] ✅ Código revisado e aprovado
- [ ] ✅ Sem conflitos

---

**Última atualização:** 15 de Novembro de 2025  
**Status:** ✅ **GUIA PARA EQUIPE CRIADO**

