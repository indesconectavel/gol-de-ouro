# 🔧 CORREÇÃO APK - GOL DE OURO
# ================================
# Script para corrigir problemas de dependências do APK

Write-Host "🔧 CORRIGINDO APK - GOL DE OURO" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""

# Navegar para o diretório mobile
Set-Location "goldeouro-mobile"

Write-Host "📁 Diretório atual: $(Get-Location)" -ForegroundColor Green

# Remover arquivos problemáticos
Write-Host "🧹 Removendo arquivos problemáticos..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✅ package-lock.json removido" -ForegroundColor Green
}

if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force
    Write-Host "✅ node_modules removido" -ForegroundColor Green
}

# Criar package.json corrigido
Write-Host "📝 Criando package.json corrigido..." -ForegroundColor Cyan
$packageJson = @"
{
  "name": "gol-de-ouro-mobile",
  "version": "2.0.0",
  "description": "Gol de Ouro - Mobile App",
  "main": "App.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.6",
    "react-native-web": "~0.19.6",
    "expo-status-bar": "~1.11.1",
    "expo-splash-screen": "~0.26.4",
    "expo-font": "~11.10.3",
    "expo-constants": "~15.4.6",
    "expo-linking": "~6.2.2",
    "expo-router": "~3.4.7",
    "expo-image-picker": "~14.7.1",
    "expo-notifications": "~0.27.6",
    "expo-camera": "~14.1.3",
    "expo-av": "~13.10.4",
    "expo-haptics": "~12.8.1",
    "expo-linear-gradient": "~12.7.2",
    "expo-blur": "~12.9.1",
    "expo-vector-icons": "~13.0.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.2",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "3.29.0",
    "react-native-svg": "14.1.0",
    "react-native-paper": "^5.12.3",
    "react-native-vector-icons": "^10.0.3",
    "axios": "^1.6.7",
    "@react-native-async-storage/async-storage": "1.21.0",
    "@expo/vector-icons": "^13.0.0",
    "expo-secure-store": "~12.8.1",
    "expo-crypto": "~12.7.1",
    "expo-device": "~5.9.3"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@expo/webpack-config": "^19.0.0",
    "typescript": "^5.1.3",
    "@types/react": "~18.2.45",
    "@types/react-native": "~0.72.8"
  },
  "private": true
}
"@

$packageJson | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "✅ package.json criado" -ForegroundColor Green

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    
    # Verificar instalação
    Write-Host "🔍 Verificando instalação..." -ForegroundColor Cyan
    npm list expo
    
    Write-Host ""
    Write-Host "🎉 APK CORRIGIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Testar: npm run start" -ForegroundColor White
    Write-Host "2. Build Android: npm run build:android" -ForegroundColor White
    Write-Host "3. Build iOS: npm run build:ios" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Erro na instalação das dependências" -ForegroundColor Red
    Write-Host "Tente executar: npm install --force" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Correção APK concluída!" -ForegroundColor Cyan
