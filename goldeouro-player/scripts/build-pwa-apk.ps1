# scripts/build-pwa-apk.ps1 - Build PWA + APK para Gol de Ouro
Write-Host "=== BUILD PWA + APK - GOL DE OURO v1.1.2 ===" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "Execute este script no diretório do projeto Player"
    exit 1
}

Write-Host "1. Buildando projeto PWA..." -ForegroundColor Yellow
npm run build

Write-Host "2. Inicializando Capacitor..." -ForegroundColor Yellow
npx cap init "Gol de Ouro" "com.goldeouro.app" --web-dir=dist

Write-Host "3. Adicionando plataforma Android..." -ForegroundColor Yellow
npx cap add android

Write-Host "4. Copiando assets para Capacitor..." -ForegroundColor Yellow
npx cap copy

Write-Host "5. Abrindo Android Studio..." -ForegroundColor Yellow
Write-Host "   Para gerar APK: Build > Build Bundle(s)/APK(s) > Build APK(s)" -ForegroundColor Cyan
npx cap open android

Write-Host "`n✅ BUILD PWA + APK CONCLUÍDO!" -ForegroundColor Green
Write-Host "📱 PWA: Disponível em https://goldeouro.lol" -ForegroundColor White
Write-Host "📱 APK: Gerar no Android Studio" -ForegroundColor White