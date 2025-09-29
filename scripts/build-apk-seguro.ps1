# scripts/build-apk-seguro.ps1 - Build APK de forma segura
Param(
  [string]$PlayerDir = "goldeouro-player",
  [switch]$SkipConfirmation
)

$ErrorActionPreference = 'Stop'

Write-Host "=== BUILD APK SEGURO - GOL DE OURO ===" -ForegroundColor Cyan
Write-Host ""

# 1) Verificações de segurança
Write-Host "🔍 VERIFICAÇÕES DE SEGURANÇA:" -ForegroundColor Yellow

# Verificar se estamos no diretório correto
if (!(Test-Path $PlayerDir)) {
  Write-Error "❌ Diretório $PlayerDir não encontrado"
  exit 1
}

# Verificar se Capacitor está configurado
if (!(Test-Path "$PlayerDir/android")) {
  Write-Error "❌ Capacitor não inicializado. Execute primeiro: npx cap init"
  exit 1
}

# Verificar se keystore existe (opcional)
$keystorePath = "C:\Android\keystores\goldeouro-release-key.keystore"
if (!(Test-Path $keystorePath)) {
  Write-Warning "⚠️ Keystore não encontrado em: $keystorePath"
  Write-Host "   Você precisará configurar assinatura manualmente no Android Studio" -ForegroundColor Yellow
}

Write-Host "✅ Verificações de segurança concluídas" -ForegroundColor Green
Write-Host ""

# 2) Confirmação do usuário
if (!$SkipConfirmation) {
  Write-Host "⚠️  ATENÇÃO: Este script irá:" -ForegroundColor Yellow
  Write-Host "   - Fazer build do PWA" -ForegroundColor White
  Write-Host "   - Copiar assets para Capacitor" -ForegroundColor White
  Write-Host "   - Tentar gerar APK via Gradle" -ForegroundColor White
  Write-Host "   - NÃO modificar configurações de segurança" -ForegroundColor Green
  Write-Host ""
  
  $confirmation = Read-Host "Deseja continuar? (s/N)"
  if ($confirmation -ne "s" -and $confirmation -ne "S") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit 0
  }
}

# 3) Backup de segurança
Write-Host "💾 Criando backup de segurança..." -ForegroundColor Cyan
$backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item "$PlayerDir/dist" "$backupDir/dist-backup" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green

# 4) Build PWA
Write-Host "🔨 Build PWA..." -ForegroundColor Cyan
Set-Location $PlayerDir
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build PWA falhou" }
  Write-Host "✅ PWA buildado com sucesso" -ForegroundColor Green
} catch {
  Write-Error "❌ Erro no build PWA: $_"
  exit 1
}

# 5) Copy para Capacitor
Write-Host "📱 Copiando para Capacitor..." -ForegroundColor Cyan
try {
  npx cap copy
  if ($LASTEXITCODE -ne 0) { throw "Capacitor copy falhou" }
  Write-Host "✅ Assets copiados para Capacitor" -ForegroundColor Green
} catch {
  Write-Error "❌ Erro no Capacitor copy: $_"
  exit 1
}

# 6) Build APK (sem assinatura)
Write-Host "🔨 Gerando APK (debug)..." -ForegroundColor Cyan
Set-Location "android"
try {
  ./gradlew assembleDebug
  if ($LASTEXITCODE -ne 0) { throw "Gradle build falhou" }
  Write-Host "✅ APK debug gerado com sucesso" -ForegroundColor Green
} catch {
  Write-Error "❌ Erro no build APK: $_"
  exit 1
}

# 7) Verificar APK gerado
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
  $apkSize = (Get-Item $apkPath).Length / 1MB
  Write-Host ""
  Write-Host "🎉 APK GERADO COM SUCESSO!" -ForegroundColor Green
  Write-Host "📁 Local: $apkPath" -ForegroundColor Green
  Write-Host "📏 Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
  Write-Host ""
  Write-Host "📋 PRÓXIMOS PASSOS SEGUROS:" -ForegroundColor Yellow
  Write-Host "1. Teste o APK debug: adb install $apkPath" -ForegroundColor White
  Write-Host "2. Para APK de release assinado:" -ForegroundColor White
  Write-Host "   - Abra Android Studio: npx cap open android" -ForegroundColor White
  Write-Host "   - Configure assinatura em Project Structure" -ForegroundColor White
  Write-Host "   - Build → Generate Signed Bundle/APK" -ForegroundColor White
  Write-Host ""
  Write-Host "🔒 SEGURANÇA: Nenhuma chave foi gerada ou modificada" -ForegroundColor Green
} else {
  Write-Error "❌ APK não foi gerado em $apkPath"
  exit 1
}
