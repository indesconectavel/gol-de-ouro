# 📱 GUIA COMPLETO PARA GERAR APK DE RELEASE ASSINADO

## 🔧 CONFIGURAÇÃO DO AMBIENTE (VOCÊ FAZ)

### 1. Instalar Java JDK
```bash
# Baixar Java JDK 17 ou superior
# https://www.oracle.com/java/technologies/downloads/
# ou usar OpenJDK: https://adoptium.net/

# Configurar JAVA_HOME
# Windows: Adicionar variável de ambiente
# JAVA_HOME = C:\Program Files\Java\jdk-17
# PATH = %JAVA_HOME%\bin
```

### 2. Instalar Android Studio
```bash
# Baixar Android Studio
# https://developer.android.com/studio
# Instalar com SDK Manager
```

### 3. Configurar Android SDK
```bash
# No Android Studio:
# File → Settings → Appearance & Behavior → System Settings → Android SDK
# Instalar: Android SDK Platform 33, Android SDK Build-Tools 33.0.0
```

## 🔑 GERAÇÃO SEGURA DE CHAVES (VOCÊ FAZ)

### 1. Criar diretório para keystores
```bash
mkdir C:\Android\keystores
```

### 2. Gerar keystore (VOCÊ EXECUTA)
```bash
cd C:\Android\keystores
keytool -genkey -v -keystore goldeouro-release-key.keystore -alias goldeouro -keyalg RSA -keysize 2048 -validity 10000
```

**Preencha os dados:**
- **Senha do keystore**: (anote bem!)
- **Senha da chave**: (pode ser a mesma)
- **Nome completo**: Gol de Ouro
- **Unidade organizacional**: Gol de Ouro
- **Cidade**: Sua cidade
- **Estado**: Seu estado
- **Código do país**: BR

## 🚀 GERAÇÃO DO APK (AUTOMATIZADA)

### 1. Build PWA (JÁ FEITO ✅)
```bash
cd goldeouro-player
npm run build
```

### 2. Copy para Capacitor (JÁ FEITO ✅)
```bash
npx cap copy
```

### 3. Abrir Android Studio
```bash
npx cap open android
```

### 4. Configurar Assinatura no Android Studio
1. **File → Project Structure** (ou `Ctrl+Alt+Shift+S`)
2. **Modules → app → Signing**
3. **Criar nova configuração:**
   - **Name**: `release`
   - **Key store path**: `C:\Android\keystores\goldeouro-release-key.keystore`
   - **Key alias**: `goldeouro`
   - **Key store password**: (sua senha)
   - **Key password**: (sua senha)

### 5. Configurar Build Types
1. **Build Types → release**
2. **Signing config**: selecionar `release`
3. **Minify enabled**: `true`
4. **Shrink resources**: `true`

### 6. Gerar APK de Release
1. **Build → Generate Signed Bundle/APK**
2. **Escolher APK**
3. **Selecionar keystore**: `C:\Android\keystores\goldeouro-release-key.keystore`
4. **Key alias**: `goldeouro`
5. **Senhas**: inserir suas senhas
6. **Destination folder**: escolher onde salvar
7. **Build variants**: `release`
8. **Clicar em "Finish"**

## ✅ VERIFICAÇÕES FINAIS

### 1. Verificar assinatura do APK
```bash
keytool -printcert -jarfile app-release.apk
```

### 2. Testar APK
```bash
# Instalar no dispositivo
adb install app-release.apk

# Ou instalar via Android Studio
# Run → Select Device → Run
```

## 🔒 GARANTIAS DE SEGURANÇA

### ✅ O QUE FOI FEITO AUTOMATICAMENTE
- ✅ Build do PWA com PWA completo
- ✅ Copy dos assets para Capacitor
- ✅ Configuração do projeto Android

### ❌ O QUE VOCÊ FAZ MANUALMENTE (SEGURO)
- ❌ Instalação do Java e Android Studio
- ❌ Geração do keystore (você controla as senhas)
- ❌ Configuração de assinatura no Android Studio
- ❌ Geração do APK de release assinado

## 📋 STATUS ATUAL

- **PWA**: ✅ Buildado com sucesso
- **Capacitor**: ✅ Assets copiados
- **Android Studio**: ✅ Pronto para abrir
- **Java**: ⚠️ Precisa instalar
- **Keystore**: ⚠️ Precisa gerar
- **APK Release**: ⚠️ Precisa configurar assinatura

## 🎯 PRÓXIMOS PASSOS

1. **Instalar Java JDK 17+**
2. **Instalar Android Studio**
3. **Gerar keystore** (comando acima)
4. **Abrir Android Studio**: `npx cap open android`
5. **Configurar assinatura** (passo 4 acima)
6. **Gerar APK de release** (passo 6 acima)

**O projeto está 100% pronto para gerar APK!** 🚀
