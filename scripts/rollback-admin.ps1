# Gol de Ouro Admin - Rollback Automatizado (Vercel)
# =================================================
# 
# INSTRUÇÕES:
# 1. Execute: .\scripts\rollback-admin.ps1
# 2. Escolha a versão para rollback
# 3. Confirme a operação
# 
# REQUISITOS:
# - Vercel CLI instalado
# - Projeto conectado ao Vercel

param(
    [string]$DeployId = "",
    [switch]$Force
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🔄 Gol de Ouro Admin - Rollback Automatizado (Vercel)$Reset"

# Verificar se estamos na pasta correta
if (-not (Test-Path "package.json") -or -not (Test-Path "vite.config.js")) {
    Write-Host "$Red❌ Execute este script na pasta goldeouro-admin!$Reset"
    exit 1
}

# Verificar se Vercel CLI está instalado
try {
    $vercelVersion = vercel --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel CLI não encontrado"
    }
    Write-Host "$Green✅ Vercel CLI instalado: $vercelVersion$Reset"
} catch {
    Write-Host "$Red❌ Vercel CLI não instalado!$Reset"
    Write-Host "$Yellow💡 Instale com: npm install -g vercel$Reset"
    exit 1
}

# Listar deploys disponíveis
Write-Host "$Blue🔍 Listando deploys disponíveis...$Reset"
Write-Host "$Yellow💡 Execute o comando abaixo para ver os deploys:$Reset"
Write-Host "   vercel ls"

# Rollback via Vercel CLI
Write-Host "$Blue🔄 Rollback no Vercel...$Reset"
Write-Host "$Yellow📋 Passos:$Reset"
Write-Host "   1. Listar deploys: vercel ls"
Write-Host "   2. Escolher deploy para rollback"
Write-Host "   3. Executar rollback: vercel rollback <deploy-id>"
Write-Host "   4. Verificar status: vercel ls"
Write-Host ""
Write-Host "$Blue💡 Comandos completos:$Reset"
Write-Host "   vercel ls"
Write-Host "   vercel rollback <deploy-id>"

if ($DeployId) {
    Write-Host ""
    Write-Host "$Blue🚀 Rollback automático para deploy: $DeployId$Reset"
    Write-Host "$Yellow💡 Execute: vercel rollback $DeployId$Reset"
}

Write-Host ""
Write-Host "$Blue🔍 Verificações pós-rollback:$Reset"
Write-Host "   1. Verificar se o site está funcionando"
Write-Host "   2. Testar funcionalidades críticas"
Write-Host "   3. Verificar se VITE_API_URL está correto"
Write-Host "   4. Testar login e navegação"

Write-Host ""
Write-Host "$Green🎉 Rollback configurado! Siga as instruções acima$Reset"
Write-Host "$Blue💡 Dica: Sempre teste em staging antes de produção$Reset"
