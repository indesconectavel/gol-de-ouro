# 🔧 INSTRUÇÕES PARA CORRIGIR WORKFLOW

**Data:** 2025-12-14  
**Problema:** Workflow executando com warnings do Git

---

## 🎯 OBJETIVO

Garantir que o workflow "Build Android APK" execute corretamente e gere o APK.

---

## 📋 PASSOS PARA CORREÇÃO

### 1. Verificar Workflow na Branch Main

1. Acesse: https://github.com/indesconectavel/gol-de-ouro
2. Certifique-se de estar na branch `main`
3. Verifique se `.github/workflows/build-android-apk.yml` existe
4. Se não existir, copie da branch `test/branch-protection-config`

### 2. Verificar Conteúdo do Workflow

O workflow deve ter:
- Trigger `workflow_dispatch` (para execução manual)
- Trigger `push` apenas para `main` ou `master`
- Não depender de pull requests

### 3. Corrigir Problemas do Git

Se o workflow tiver steps que fazem push:
- Remover ou comentar steps de push
- Garantir que checkout funciona corretamente
- Adicionar tratamento de erros

### 4. Adicionar Secret (Se Não Adicionado)

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
2. Verifique se `EXPO_TOKEN` existe
3. Se não existir, adicione com valor: `fGr2EHaOgPjlMWxwSp6IkEp3HTHa2dJo8OJncLK4`

### 5. Executar Workflow Manualmente

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Clique em "Build Android APK" (não "Create build-android-apk.yml")
3. Clique em "Run workflow"
4. Selecione:
   - Branch: `main`
   - Profile: `production`
5. Clique em "Run workflow"

### 6. Monitorar Execução

1. Aguarde execução completar (15-30 minutos)
2. Verifique se não há warnings do Git
3. Verifique se artifacts foram gerados
4. Baixe o APK

---

## ⚠️ IMPORTANTE

- O workflow deve estar na branch `main` para aparecer na lista
- Use "Run workflow" para execução manual
- Não execute via pull request

---

**Última atualização:** 2025-12-14

