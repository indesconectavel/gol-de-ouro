# Gerar APK - Gol de Ouro
# Execute como Administrador no PowerShell

Write-Host "🚀 Iniciando geração de APK - Gol de Ouro" -ForegroundColor Green

# Verificar se Node.js está instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale de: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar se Java está instalado
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Java não encontrado. Instalando OpenJDK..." -ForegroundColor Yellow
    
    # Tentar instalar Java via Chocolatey
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "📦 Instalando Java via Chocolatey..." -ForegroundColor Blue
        choco install openjdk11 -y
    } else {
        Write-Host "❌ Instale Java manualmente de: https://adoptium.net/" -ForegroundColor Red
        Write-Host "📋 Ou instale Chocolatey e execute: choco install openjdk11" -ForegroundColor Yellow
        Write-Host "🔗 Chocolatey: https://chocolatey.org/install" -ForegroundColor Cyan
        exit 1
    }
}

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Execute este script no diretório goldeouro-player" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependências..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Fazendo build de produção..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build de produção" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Configurando Capacitor..." -ForegroundColor Blue
npx cap add android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao configurar Capacitor" -ForegroundColor Red
    exit 1
}

npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar Capacitor" -ForegroundColor Red
    exit 1
}

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
        
        # Mostrar informações do APK
        $apkInfo = Get-Item $destPath
        Write-Host "📊 Tamanho do APK: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        Write-Host "📅 Data de criação: $($apkInfo.CreationTime)" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🎉 APK PRONTO PARA DISTRIBUIÇÃO!" -ForegroundColor Green
    Write-Host "📱 Compartilhe o arquivo: $destPath" -ForegroundColor Yellow
    Write-Host "🔗 Ou use o PWA: https://goldeouro.lol" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Erro ao gerar APK. Verifique os logs acima." -ForegroundColor Red
    Write-Host "💡 Dica: Verifique se o Java está configurado corretamente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Processo concluído!" -ForegroundColor Green
