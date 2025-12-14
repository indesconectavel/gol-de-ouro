# ⏳ ETAPA 3 - GERAÇÃO DO APK

**Data:** 2025-12-13  
**Status:** ⏳ AGUARDANDO LOGIN EAS

---

## 🔐 AÇÃO MANUAL NECESSÁRIA

### PASSO 1: Login no EAS

Execute no terminal (dentro de `goldeouro-mobile`):

```bash
eas login
```

Siga as instruções para fazer login com sua conta Expo.

---

## 📦 CONFIGURAÇÃO DO BUILD

### Arquivos Validados:

**`eas.json`:**
- ✅ Profile `production` configurado
- ✅ `buildType: apk` configurado

**`app.json`:**
- ✅ Package: `com.goldeouro.app`
- ✅ Version Code: `2`
- ✅ Version: `2.0.0`
- ✅ API URL: `https://goldeouro-backend-v2.fly.dev`

---

## 🚀 COMANDO PARA GERAR APK

Após fazer login, execute:

```bash
eas build --platform android --profile production
```

**Tempo estimado:** 15-30 minutos

---

## 📋 INFORMAÇÕES DO BUILD

Após o build completar, registrar:

- [ ] Build ID
- [ ] Link de download do APK
- [ ] Hash SHA-256 do APK
- [ ] Tamanho do arquivo
- [ ] Data/hora de geração

---

## ⚠️ IMPORTANTE

- Build será feito em modo **production**
- APK será gerado (não AAB)
- Versão: 2.0.0 (versionCode: 2)
- Package: com.goldeouro.app

---

**Próxima etapa:** ETAPA 4 - Teste real no APK (após APK gerado)

