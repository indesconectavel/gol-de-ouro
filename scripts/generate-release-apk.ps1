# scripts/generate-release-apk.ps1 - Gerar APK de Release Assinado
Param(
  [string]$KeystorePath = "C:\Android\keystores\goldeouro-release-key.keystore",
  [string]$KeyAlias = "goldeouro",
  [string]$PlayerDir = "goldeouro-player"
)

$ErrorActionPreference = 'Stop'

Write-Host "=== GERAR APK DE RELEASE ASSINADO ===" -ForegroundColor Cyan

# 1) Verificar se keystore existe
if (!(Test-Path $KeystorePath)) {
  Write-Host "❌ Keystore não encontrado em: $KeystorePath" -ForegroundColor Red
  Write-Host "Execute primeiro:" -ForegroundColor Yellow
  Write-Host "keytool -genkey -v -keystore $KeystorePath -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Yellow
  exit 1
}

# 2) Build PWA
Write-Host ">> Build PWA..." -ForegroundColor Cyan
Set-Location $PlayerDir
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build PWA falhou" }

# 3) Copy para Capacitor
Write-Host ">> Copy para Capacitor..." -ForegroundColor Cyan
npx cap copy
if ($LASTEXITCODE -ne 0) { throw "Capacitor copy falhou" }

# 4) Gerar APK via Gradle
Write-Host ">> Gerando APK de release..." -ForegroundColor Cyan
Set-Location "android"
./gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { throw "Gradle build falhou" }

# 5) Verificar APK gerado
$apkPath = "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
  $apkSize = (Get-Item $apkPath).Length / 1MB
  Write-Host "✅ APK gerado com sucesso!" -ForegroundColor Green
  Write-Host "📁 Local: $apkPath" -ForegroundColor Green
  Write-Host "📏 Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
  
  # 6) Verificar assinatura
  Write-Host ">> Verificando assinatura..." -ForegroundColor Cyan
  try {
    $cert = keytool -printcert -jarfile $apkPath 2>$null
    if ($cert -match "Alias name: $KeyAlias") {
      Write-Host "✅ APK assinado corretamente" -ForegroundColor Green
    } else {
      Write-Warning "⚠️ Assinatura não verificada automaticamente"
    }
  } catch {
    Write-Warning "⚠️ Não foi possível verificar assinatura automaticamente"
  }
  
  Write-Host ""
  Write-Host "🚀 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
  Write-Host "1. Instalar no dispositivo: adb install $apkPath" -ForegroundColor Yellow
  Write-Host "2. Testar funcionalidades do app" -ForegroundColor Yellow
  Write-Host "3. Para Google Play: use AAB (Build Bundle)" -ForegroundColor Yellow
  
} else {
  Write-Error "❌ APK não foi gerado em $apkPath"
  exit 1
}
