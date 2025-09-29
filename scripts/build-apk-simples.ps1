# scripts/build-apk-simples.ps1 - Build APK simples e seguro
Write-Host "=== BUILD APK SIMPLES E SEGURO ===" -ForegroundColor Cyan

# 1) Build PWA
Write-Host "🔨 Build PWA..." -ForegroundColor Yellow
cd goldeouro-player
npm run build

# 2) Copy para Capacitor
Write-Host "📱 Copy para Capacitor..." -ForegroundColor Yellow
npx cap copy

# 3) Build APK debug
Write-Host "🔨 Build APK debug..." -ForegroundColor Yellow
cd android
./gradlew assembleDebug

Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "📁 APK gerado em: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Green
