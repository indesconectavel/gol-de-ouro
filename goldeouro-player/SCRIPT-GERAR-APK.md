# 📱 **SCRIPT AUTOMÁTICO PARA GERAR APK**

## 🚀 **Script PowerShell para Windows**

```powershell
# Script para gerar APK do Gol de Ouro
# Execute como Administrador

Write-Host "🚀 Iniciando geração de APK - Gol de Ouro" -ForegroundColor Green

# Verificar se Node.js está instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale de: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar se Java está instalado
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Java não encontrado. Instalando OpenJDK..." -ForegroundColor Yellow
    
    # Instalar Java via Chocolatey (se disponível)
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install openjdk11 -y
    } else {
        Write-Host "❌ Instale Java manualmente de: https://adoptium.net/" -ForegroundColor Red
        Write-Host "📋 Ou instale Chocolatey e execute: choco install openjdk11" -ForegroundColor Yellow
        exit 1
    }
}

# Navegar para o diretório do projeto
Set-Location "goldeouro-player"

Write-Host "📦 Instalando dependências..." -ForegroundColor Blue
npm install

Write-Host "🔨 Fazendo build de produção..." -ForegroundColor Blue
npm run build

Write-Host "📱 Configurando Capacitor..." -ForegroundColor Blue
npx cap add android
npx cap sync android

Write-Host "🏗️ Gerando APK..." -ForegroundColor Blue
npx cap build android

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK gerado com sucesso!" -ForegroundColor Green
    Write-Host "📁 Localização: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Cyan
    
    # Copiar APK para pasta mais acessível
    $apkPath = "android/app/build/outputs/apk/debug/app-debug.apk"
    $destPath = "Gol-de-Ouro-v1.0.0.apk"
    
    if (Test-Path $apkPath) {
        Copy-Item $apkPath $destPath
        Write-Host "📱 APK copiado para: $destPath" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Erro ao gerar APK. Verifique os logs acima." -ForegroundColor Red
}

Write-Host "🎉 Processo concluído!" -ForegroundColor Green
```

## 🐧 **Script Bash para Linux/Mac**

```bash
#!/bin/bash

echo "🚀 Iniciando geração de APK - Gol de Ouro"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale de: https://nodejs.org"
    exit 1
fi

# Verificar Java
if ! command -v java &> /dev/null; then
    echo "⚠️ Java não encontrado. Instalando OpenJDK..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install openjdk-11-jdk -y
    # macOS
    elif command -v brew &> /dev/null; then
        brew install openjdk@11
    else
        echo "❌ Instale Java manualmente"
        exit 1
    fi
fi

# Navegar para o diretório
cd goldeouro-player

echo "📦 Instalando dependências..."
npm install

echo "🔨 Fazendo build de produção..."
npm run build

echo "📱 Configurando Capacitor..."
npx cap add android
npx cap sync android

echo "🏗️ Gerando APK..."
npx cap build android

if [ $? -eq 0 ]; then
    echo "✅ APK gerado com sucesso!"
    echo "📁 Localização: android/app/build/outputs/apk/debug/app-debug.apk"
    
    # Copiar APK
    cp android/app/build/outputs/apk/debug/app-debug.apk Gol-de-Ouro-v1.0.0.apk
    echo "📱 APK copiado para: Gol-de-Ouro-v1.0.0.apk"
else
    echo "❌ Erro ao gerar APK"
fi

echo "🎉 Processo concluído!"
```

## 🔧 **Configuração Manual (Se necessário)**

### **1. Instalar Java JDK 11+**
```bash
# Windows (via Chocolatey)
choco install openjdk11

# Ubuntu/Debian
sudo apt install openjdk-11-jdk

# macOS (via Homebrew)
brew install openjdk@11
```

### **2. Configurar JAVA_HOME**
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-11.0.16.101-hotspot"

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

### **3. Instalar Android Studio (Opcional)**
- Baixar de: https://developer.android.com/studio
- Instalar Android SDK
- Configurar ANDROID_HOME

## 📱 **APK Gerado**

Após executar o script, você terá:
- **APK de Debug**: `Gol-de-Ouro-v1.0.0.apk`
- **Tamanho**: ~15-20 MB
- **Compatibilidade**: Android 5.0+ (API 21+)
- **Funcionalidades**: Todas as features do jogo

## 🚀 **Distribuição para Sócios**

### **Opção 1: Envio Direto**
- Enviar APK por email/WhatsApp
- Sócios instalam via "Fontes Desconhecidas"

### **Opção 2: PWA (Recomendado)**
- Compartilhar link: `https://goldeouro.lol`
- Instalação automática como app nativo
- Atualizações automáticas

### **Opção 3: Google Play Store**
- Gerar APK assinado para produção
- Submeter para aprovação
- Distribuição oficial

**O sistema está pronto para teste!** 🎉
