# Gol de Ouro Admin - Deploy Automatizado (Vercel)
# ================================================
# 
# INSTRUÇÕES:
# 1. Configure VITE_API_URL no .env.local
# 2. Execute: .\scripts\deploy-admin.ps1
# 3. Siga as instruções do Vercel
# 
# REQUISITOS:
# - Node.js instalado
# - Conta Vercel
# - Backend já deployado

param(
    [string]$ApiUrl = "",
    [switch]$Force
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🚀 Gol de Ouro Admin - Deploy Automatizado (Vercel)$Reset"

# Verificar se estamos na pasta correta
if (-not (Test-Path "package.json") -or -not (Test-Path "vite.config.js")) {
    Write-Host "$Red❌ Execute este script na pasta goldeouro-admin!$Reset"
    exit 1
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "$Red❌ Arquivo .env.local não encontrado!$Reset"
    Write-Host "$Yellow💡 Crie o arquivo .env.local com:$Reset"
    Write-Host "   VITE_API_URL=https://seu-backend.onrender.com"
    exit 1
}

# Obter VITE_API_URL
if (-not $ApiUrl) {
    $ApiUrl = Get-Content ".env.local" | Where-Object { $_ -match "^VITE_API_URL=" } | ForEach-Object { ($_ -split "=", 2)[1] }
}

if (-not $ApiUrl) {
    Write-Host "$Red❌ VITE_API_URL não configurado!$Reset"
    Write-Host "$Yellow💡 Configure no .env.local ou passe como parâmetro$Reset"
    exit 1
}

Write-Host "$Green✅ VITE_API_URL configurado: $ApiUrl$Reset"

# Verificar se o backend está acessível
Write-Host "$Blue🔍 Testando conexão com backend...$Reset"
try {
    $Response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "$Green✅ Backend acessível$Reset"
} catch {
    Write-Host "$Red❌ Backend não acessível: $($_.Exception.Message)$Reset"
    if (-not $Force) {
        Write-Host "$Yellow💡 Use -Force para continuar mesmo assim$Reset"
        exit 1
    }
}

# Verificar dependências
Write-Host "$Blue🔍 Verificando dependências...$Reset"
if (-not (Test-Path "node_modules")) {
    Write-Host "$Yellow📦 Instalando dependências...$Reset"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$Red❌ Erro ao instalar dependências$Reset"
        exit 1
    }
}

# Teste de build
Write-Host "$Blue🔍 Testando build...$Reset"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "$Red❌ Erro no build! Corrija os erros antes do deploy$Reset"
    exit 1
}

Write-Host "$Green✅ Build bem-sucedido$Reset"

# Verificar se Vercel CLI está instalado
Write-Host "$Blue🔍 Verificando Vercel CLI...$Reset"
try {
    $vercelVersion = vercel --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$Green✅ Vercel CLI instalado: $vercelVersion$Reset"
    } else {
        throw "Vercel CLI não encontrado"
    }
} catch {
    Write-Host "$Yellow📦 Instalando Vercel CLI...$Reset"
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$Red❌ Erro ao instalar Vercel CLI$Reset"
        exit 1
    }
}

# Deploy no Vercel
Write-Host "$Blue🚀 Iniciando deploy no Vercel...$Reset"
Write-Host "$Yellow📋 Passos:$Reset"
Write-Host "   1. Login no Vercel (se necessário)"
Write-Host "   2. Conectar repositório"
Write-Host "   3. Configurar domínio"
Write-Host "   4. Deploy automático"

Write-Host "$Blue💡 Execute o comando abaixo:$Reset"
Write-Host "$Yellow   vercel --prod$Reset"

Write-Host "$Green🎉 Deploy configurado! Execute 'vercel --prod' para finalizar$Reset"
