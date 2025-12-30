# 🔧 CORREÇÃO - adaptive-icon.png

**Data:** 2025-12-14  
**Problema:** Arquivo `adaptive-icon.png` não encontrado

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `ENOENT: no such file or directory, open './assets/adaptive-icon.png'`

**Causa:**
- O arquivo `adaptive-icon.png` não existe na pasta `assets`
- O `app.json` referencia este arquivo em `android.adaptiveIcon.foregroundImage`
- O build falha ao tentar processar este arquivo inexistente

---

## ✅ CORREÇÃO APLICADA

**Removida referência ao `adaptiveIcon` do `app.json`:**

- ❌ Removido `android.adaptiveIcon` completo
- ✅ Mantido apenas `package` e `versionCode`
- ✅ O Expo usará o ícone padrão ou gerará automaticamente

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

- ✅ Removida referência ao `adaptive-icon.png` inexistente
- ✅ Mantida estrutura básica do Android no `app.json`

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

