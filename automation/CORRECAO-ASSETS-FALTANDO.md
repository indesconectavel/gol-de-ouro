# 🔧 CORREÇÃO - Assets Faltando

**Data:** 2025-12-14  
**Problema:** Arquivos de assets não encontrados

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `ENOENT: no such file or directory, open './assets/icon.png'`

**Causa:**
- A pasta `assets` está vazia ou não existe
- O `app.json` referencia múltiplos arquivos que não existem:
  - `icon.png`
  - `splash.png`
  - `favicon.png`
  - `notification-icon.png`

---

## ✅ CORREÇÃO APLICADA

**Removidas todas as referências a arquivos de assets inexistentes:**

1. ✅ Removido `icon` do app.json
2. ✅ Removido `splash` completo do app.json
3. ✅ Removido `favicon` do web
4. ✅ Removido `icon` do plugin expo-notifications

**O Expo usará ícones e splash screens padrão automaticamente.**

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

- ✅ Removidas todas as referências a assets inexistentes
- ✅ Mantida estrutura básica do app.json
- ✅ O Expo gerará ícones padrão automaticamente

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

