# 🔧 CORREÇÃO - app.json

**Data:** 2025-12-14  
**Problema:** Erro na fase "Read app config"

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** Build falhou na fase "Read app config"

**Causa:**
- Campo `"owner": "indesconectavel"` estava dentro de `expo` (incorreto)
- O `owner` não deve estar dentro de `expo`, já está configurado via `projectId`

---

## ✅ CORREÇÃO APLICADA

**Removido campo `owner` incorreto:**
- ❌ Removido `"owner": "indesconectavel"` de dentro de `expo`
- ✅ Mantido apenas `projectId` em `extra.eas`

---

## 🎯 PRÓXIMO PASSO: REBUILD

**Execute novamente:**

```powershell
cd goldeouro-mobile
npx eas build --platform android --profile production
```

**Agora deve funcionar!**

---

## 📋 O QUE FOI CORRIGIDO

- ✅ Removido campo `owner` incorreto do app.json
- ✅ Mantida estrutura correta do app.json

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

